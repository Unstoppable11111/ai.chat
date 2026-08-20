'use client';
import { useState } from 'react';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('你好！我是本站的 AI 助手，随便问我点什么吧？');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const question = input;
    setInput('');
    setResponse('AI 正在思考中...');

    try {
      const res = await fetch('/api-chat-backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question })
      });
      const data = await res.json();
      setResponse(data.text);
    } catch (err) {
      setResponse('网络请求失败，请检查。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 p-8 border rounded-2xl shadow-sm bg-white dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">AI 智能客服</h3>
      
      <div className="min-h-[250px] bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-6 mb-6 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
        {response}
      </div>

      <div className="flex gap-3">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="输入您的问题，按回车发送..." 
          className="flex-1 px-4 py-3 border rounded-xl dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
          disabled={loading}
        />
        <button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? '发送中...' : '发 送'}
        </button>
      </div>
    </div>
  );
}
