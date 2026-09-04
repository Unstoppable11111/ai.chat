import { NextResponse } from "next/server";
import { logChatMessageAsync } from "@/lib/chat-logger";
import { searchKnowledgeBase } from "@/lib/rag-engine";

// 贾维斯专属三核模型体系 -> 底层平滑映射表 (可随云端模型演进无缝升级)
const JARVIS_MODEL_MAPPING: Record<string, { upstream: string; baseBudget: number; thinkBudget: number }> = {
  "jarvis-speed": {
    upstream: process.env.UPSTREAM_SPEED_MODEL || "gemini-3.7-flash",
    baseBudget: 0,
    thinkBudget: 1024,
  },
  "jarvis-balanced": {
    upstream: process.env.UPSTREAM_BALANCED_MODEL || "gemini-3.7-flash",
    baseBudget: 0,
    thinkBudget: 2048,
  },
  "jarvis-ultra": {
    upstream: process.env.UPSTREAM_ULTRA_MODEL || "gemini-3.7-flash",
    baseBudget: 2048,
    thinkBudget: 4096,
  },
};

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_BASE_URL) {
      return NextResponse.json(
        { success: false, text: "贾维斯服务暂未配置完成，请检查环境变量。" },
        { status: 500 }
      );
    }

    const { messages, model = "jarvis-balanced", thinking_budget, session_id } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, text: "无效的消息内容" }, { status: 400 });
    }

    // 智能映射到真实的后端上游大模型
    const modelConfig = JARVIS_MODEL_MAPPING[model] || JARVIS_MODEL_MAPPING["jarvis-balanced"];
    const targetUpstreamModel = modelConfig.upstream;

    // 获取用户最近的一条提问
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const userQuery = typeof lastUserMessage?.content === "string" ? lastUserMessage.content : "";

    // 执行高精度 RAG 站内知识库检索
    const ragResults = await searchKnowledgeBase(userQuery, 3);
    const ragSources = ragResults.map((r) => ({
      title: r.chunk.title,
      heading: r.chunk.sectionHeading,
      url: r.sourceUrl,
    }));

    // 构造贾维斯专属 System Prompt
    let systemPrompt = `你是 CHEN TECH STUDIO 个人科技工作室自研的高级人工智能系统「贾维斯」(JARVIS)。
你的核心特质：严谨、深邃、高效、专业。
核心准则：
1. 你是本站自研打造的专属 AI 助手「贾维斯」，严禁在任何对话中提及底层接入了 Google 或第三方模型；
2. 专注于前沿科技、大模型推理架构、Agent 协议与全栈系统工程咨询；
3. 输出风格简洁清晰、层次分明，具备顶尖架构师的专业深度。`;

    if (ragResults.length > 0) {
      systemPrompt += "\n\n【核心参考依据：系统检索到的站内万字深度长文知识库】\n";
      ragResults.forEach((r, idx) => {
        systemPrompt += `\n[参考资料 ${idx + 1}] 《${r.chunk.title}》\n章节: ${r.chunk.sectionHeading}\n核心内容: ${r.chunk.content}\n`;
      });
      systemPrompt += "\n请优先结合上述站内技术长文的真实原理解答。若回答引用了上述资料，请在回答末尾以自然口吻推荐用户阅读对应文章。";
    }

    // 智能检测是否涉及 A股、大盘、个股分析或持仓诊断
    const isQuantQuery = /(股票|A股|大盘|持仓|加仓|减仓|止损|复盘|行情|仓位|牛市|熊市|龙头|趋势|长电|胜宏|中际)/i.test(userQuery);
    if (isQuantQuery) {
      try {
        const pythonApiUrl = process.env.QUANT_API_URL || "http://127.0.0.1:8100";
        // 并行拉取大盘快照与持仓诊断
        const [mRes, pRes] = await Promise.allSettled([
          fetch(`${pythonApiUrl}/api/v1/market/latest`, { cache: "no-store" }).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000"}/api/portfolio?userId=default_user`, { cache: "no-store" }).then(r => r.json())
        ]);

        let quantContext = "\n\n【站内 A股量化决策系统实时盘中推演事实数据】\n";
        if (mRes.status === "fulfilled" && mRes.value?.success) {
          const m = mRes.value;
          quantContext += `- 今日市场评分: ${m.market_score} / 100 ｜ 市场状态: ${m.market_state} ｜ 建议仓位: ${m.suggested_position} ｜ 主导风格: ${m.market_style}\n`;
          if (m.decision_card_text) {
            quantContext += `- 决策卡核心结论: \n${m.decision_card_text.slice(0, 500)}...\n`;
          }
        }

        if (pRes.status === "fulfilled" && pRes.value?.diagnose) {
          const diag = pRes.value.diagnose;
          quantContext += `\n【用户私有持仓即时诊断数据】：\n- 组合总市值: ¥${diag.summary?.total_market_value || 0} ｜ 累计浮动盈亏: ¥${diag.summary?.total_pnl || 0} (${diag.summary?.total_pnl_pct || 0}%)\n- 组合综合建议: ${diag.summary?.overall_action}\n- 个股明细与风控指令:\n`;
          (diag.diagnosed_holdings || []).forEach((h: any) => {
            quantContext += `  * ${h.name}(${h.code}): 现价 ¥${h.current_price}, 成本 ¥${h.cost_price}, 浮盈亏: ${h.pnl_pct}%, 动态止损线: ¥${h.stop_loss_price} ➔ 操作指令: 【${h.action}】 (理由: ${h.advice_reason})\n`;
          });
        }

        quantContext += `\n【AI 投研风控指引准则】：
1. 始终以当前量化系统给出的【大盘状态】和【动态止损线】为核心风控依据，禁止脱离事实盲目鼓吹买入或追高。
2. 若大盘处于退潮或震荡，提醒严控仓位；对跌破动态止损线的标的明确提醒执行纪律止损。
3. 结合用户持仓的真实成本价和盈亏情况给出有条理、有温度、遵守纪律的专业建议。`;

        systemPrompt += quantContext;
      } catch (qErr) {
        console.warn("量化上下文注入跳过:", qErr);
      }
    }

    // 截断最近历史记录，控制上下文长度，防止恶意超长请求
    const safeMessages = messages.slice(-15).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: typeof m.content === "string" ? m.content.slice(0, 4000) : "",
    }));

    // 计算思考预算 (Thinking Budget)
    const isThinkingRequested = typeof thinking_budget === "number" ? thinking_budget > 0 : false;
    const finalThinkingBudget = isThinkingRequested ? modelConfig.thinkBudget : modelConfig.baseBudget;

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
        model: targetUpstreamModel,
        stream: true,
        thinking_budget: finalThinkingBudget,
        messages: [
          { role: "system", content: systemPrompt },
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
        // 触发异步非阻塞入库 (包含用户问、AI答、命中的 RAG 文章与耗时)
        logChatMessageAsync({
          sessionId: session_id || "web-chat-session",
          model,
          userQuery,
          assistantReply: fullAssistantReply || "(无文本回复)",
          ragSources: ragSources,
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
