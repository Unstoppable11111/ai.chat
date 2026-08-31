import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_BASE_URL) {
      return NextResponse.json(
        { success: false, text: 'AI 服务暂未配置完成，请检查环境变量。' },
        { status: 500 }
      );
    }

    const { messages, model = 'gemini-3.7-flash', thinking_budget } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, text: '无效的消息内容' }, { status: 400 });
    }

    // 截断最近历史记录，控制上下文长度，防止恶意超长请求
    const safeMessages = messages.slice(-15).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content.slice(0, 4000) : '',
    }));

    const isThinkingModel = typeof model === 'string' && model.endsWith('-thinking');
    const finalThinkingBudget = typeof thinking_budget === 'number' 
      ? Math.min(Math.max(thinking_budget, 0), 8192) 
      : (isThinkingModel ? 2048 : 0);

    const response = await fetch(`${process.env.OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        stream: true,
        thinking_budget: finalThinkingBudget,
        messages: [
          { role: 'system', content: '你是网站专属的智能助手，请简短、专业地回答问题。' },
          ...safeMessages
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Upstream AI API Error:', response.status, errText);
      return NextResponse.json({ success: false, text: 'AI 服务响应异常，请稍后再试。' }, { status: 502 });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ success: false, text: '抱歉，系统开小差了，请稍后再试。' }, { status: 500 });
  }
}
