import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { messages, model = 'gemini-3.7-flash', thinking_budget } = await request.json();

    const isThinkingModel = typeof model === 'string' && model.endsWith('-thinking');
    const finalThinkingBudget = typeof thinking_budget === 'number' 
      ? thinking_budget 
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
          ...messages
        ]
      })
    });

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
