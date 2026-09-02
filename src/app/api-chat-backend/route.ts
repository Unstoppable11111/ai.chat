import { NextResponse } from "next/server";
import { logChatMessageAsync } from "@/lib/chat-logger";

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_BASE_URL) {
      return NextResponse.json(
        { success: false, text: "AI 服务暂未配置完成，请检查环境变量。" },
        { status: 500 }
      );
    }

    const { messages, model = "gemini-3.7-flash", thinking_budget, session_id } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, text: "无效的消息内容" }, { status: 400 });
    }

    // 获取用户最近的一条提问
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const userQuery = typeof lastUserMessage?.content === "string" ? lastUserMessage.content : "";

    // 截断最近历史记录，控制上下文长度，防止恶意超长请求
    const safeMessages = messages.slice(-15).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: typeof m.content === "string" ? m.content.slice(0, 4000) : "",
    }));

    const isThinkingModel = typeof model === "string" && model.endsWith("-thinking");
    const finalThinkingBudget = typeof thinking_budget === "number" 
      ? Math.min(Math.max(thinking_budget, 0), 8192) 
      : (isThinkingModel ? 2048 : 0);

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                      request.headers.get("x-real-ip") || 
                      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    const response = await fetch(`${process.env.OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        stream: true,
        thinking_budget: finalThinkingBudget,
        messages: [
          { role: "system", content: "你是网站专属的智能助手，请简短、专业地回答问题。" },
          ...safeMessages
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Upstream AI API Error:", response.status, errText);
      return NextResponse.json({ success: false, text: "AI 服务响应异常，请稍后再试。" }, { status: 502 });
    }

    if (!response.body) {
      return NextResponse.json({ success: false, text: "上游未返回数据流" }, { status: 502 });
    }

    let fullAssistantReply = "";
    const decoder = new TextDecoder();
    let sseBuffer = "";

    // 使用 TransformStream 无感透传流，同时在后台累加回答并在完成后异步写入数据库
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        try {
          const text = decoder.decode(chunk, { stream: true });
          sseBuffer += text;
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  fullAssistantReply += deltaContent;
                }
              } catch {
                // 忽略非完整 JSON 行
              }
            }
          }
        } catch {
          // 容错处理
        }
      },
      flush() {
        const durationMs = Date.now() - startTime;
        // 触发异步非阻塞入库
        logChatMessageAsync({
          sessionId: session_id || "web-chat-session",
          model,
          userQuery,
          assistantReply: fullAssistantReply || "(无文本回复)",
          ragSources: [],
          ipAddress,
          userAgent,
          durationMs,
        }).catch((err) => {
          console.error("Background log error:", err);
        });
      }
    });

    return new Response(response.body.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      }
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ success: false, text: "抱歉，系统开小差了，请稍后再试。" }, { status: 500 });
  }
}
