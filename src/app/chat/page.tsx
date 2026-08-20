'use client';
import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是本站的 AI 助手，随便问我点什么吧？' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: 'user', content: input } as Message];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // 过滤掉第一条默认开场白，把真实的聊天记录发给后端
      const apiMessages = newMessages.filter((_, i) => i !== 0 || newMessages[0].role !== 'assistant');

      const res = await fetch('/api-chat-backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '网络请求失败，请检查。' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-20 p-8 border rounded-2xl shadow-sm bg-white dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">AI 智能助手</h3>
      
      <div className="h-[500px] overflow-y-auto bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-6 mb-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-sm dark:bg-white dark:text-slate-900' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-sm dark:border-white/5 dark:bg-zinc-800 dark:text-slate-300'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-5 py-3 text-[15px] bg-white text-slate-400 border border-slate-100 rounded-tl-sm shadow-sm dark:border-white/5 dark:bg-zinc-800 animate-pulse">
              思考中...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
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
          className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? '发送中...' : '发 送'}
        </button>
      </div>
    </div>
  );
}
