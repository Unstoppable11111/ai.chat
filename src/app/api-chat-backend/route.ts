import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const response = await fetch(`${process.env.OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gemini-3.1-pro',
        messages: [
          { role: 'system', content: '你是网站专属的智能助手，请简短、专业地回答问题。' },
          ...messages
        ]
      })
    });

    const data = await response.json();
    return NextResponse.json({ success: true, text: data.choices[0].message.content });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ success: false, text: '抱歉，系统开小差了，请稍后再试。' }, { status: 500 });
  }
}
