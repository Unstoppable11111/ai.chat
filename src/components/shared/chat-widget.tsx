'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, User } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是网站 AI 助手，有什么可以帮你的？' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: 'user', content: input } as Message];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
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
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="打开 AI 助手"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      <div
        className={`fixed bottom-6 right-6 z-50 flex h-[550px] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-2xl transition-all duration-300 dark:border-white/10 dark:bg-zinc-900 sm:w-[400px] ${isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-8 opacity-0'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-900/10 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/10 text-slate-900 dark:bg-white/10 dark:text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-semibold text-sm text-slate-900 dark:text-white">AI 智能助手</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-zinc-700 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-zinc-900/50 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-sm mt-1 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                {msg.role === 'user' ? <User className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              </div>
              <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm border leading-relaxed whitespace-pre-wrap max-w-[85%] ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white border-transparent rounded-tr-sm dark:bg-white dark:text-slate-900' 
                  : 'bg-white text-slate-700 border-slate-100 rounded-tl-sm dark:border-white/5 dark:bg-zinc-800 dark:text-slate-300'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm mt-1">
                <Sparkles className="h-3 w-3" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm text-slate-400 shadow-sm border border-slate-100 dark:border-white/5 dark:bg-zinc-800 animate-pulse">
                思考中...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-900/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-900">
          <div className="flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-50 px-2 py-1.5 dark:border-white/10 dark:bg-zinc-800 focus-within:ring-2 focus-within:ring-slate-900/20 focus-within:border-slate-900 transition-all dark:focus-within:ring-white/20 dark:focus-within:border-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="问点什么..."
              className="flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="h-4 w-4 -ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
