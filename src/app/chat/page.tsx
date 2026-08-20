'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, User, Sparkles, Send } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

const MODELS = [
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' }
];

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
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
    if (!input.trim() || loading) return;
    
    const newMessages = [...messages, { role: 'user', content: input } as Message];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = newMessages.filter((_, i) => i !== 0 || newMessages[0].role !== 'assistant');

      const res = await fetch('/api-chat-backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, model: selectedModel })
      });

      if (!res.ok) throw new Error('Network response was not ok');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader!.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content += data.choices[0].delta.content;
                    return newMsgs;
                  });
                }
              } catch (e) {
                // parse error on partial chunks is common, ignore
              }
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        if (prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].content === '') {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = '网络请求失败，请检查。';
          return newMsgs;
        }
        return [...prev, { role: 'assistant', content: '网络请求失败，请检查。' }];
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-20 p-8 border rounded-2xl shadow-sm bg-white dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-cyan" />
          AI 智能助手
        </h3>
      </div>
      
      <div className="h-[500px] overflow-y-auto bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-6 mb-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${msg.role === 'user' ? 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-sm dark:bg-white dark:text-slate-900' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-sm dark:border-white/5 dark:bg-zinc-800 dark:text-slate-300'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1].role === 'user' && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <div className="max-w-[80%] rounded-2xl px-5 py-3 text-[15px] bg-white text-slate-400 border border-slate-100 rounded-tl-sm shadow-sm dark:border-white/5 dark:bg-zinc-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-3 relative">
        <div className="flex-1 flex items-center border rounded-xl dark:bg-zinc-800 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-brand-cyan/20 focus-within:border-brand-cyan transition-all bg-white overflow-hidden pr-2 shadow-sm">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="输入您的问题，按回车发送..." 
            className="flex-1 px-4 py-3 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
            disabled={loading}
          />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-xs font-medium text-slate-600 bg-slate-100 dark:bg-zinc-700/50 hover:bg-slate-200 dark:hover:bg-zinc-700 dark:text-slate-300 border-none outline-none rounded-lg px-3 py-1.5 cursor-pointer transition-colors max-w-[150px] truncate"
            disabled={loading}
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()}
          className="px-6 py-3 shrink-0 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
        >
          <Send className="h-4 w-4" />
          {loading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
}
