'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, Settings2 } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

const MODELS = [
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [showSettings, setShowSettings] = useState(false);
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
                // Ignore parse errors on incomplete chunks
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
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="打开 AI 助手"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      <div
        className={`fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[85vh] w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-2xl transition-all duration-300 dark:border-white/10 dark:bg-zinc-900 sm:w-[420px] ${isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-8 opacity-0'}`}
      >
        <div className="flex flex-col border-b border-slate-900/10 bg-slate-50 dark:border-white/10 dark:bg-zinc-800/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/10 text-slate-900 dark:bg-white/10 dark:text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-semibold text-sm text-slate-900 dark:text-white">AI 智能助手</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`rounded-full p-1.5 transition-colors ${showSettings ? 'bg-slate-200 text-slate-900 dark:bg-zinc-700 dark:text-white' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-zinc-700 dark:hover:text-white'}`}
              >
                <Settings2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-zinc-700 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* 模型设置面板 (展开/收起) */}
          <div className={`overflow-hidden transition-all duration-300 ${showSettings ? 'max-h-20 border-t border-slate-900/5 dark:border-white/5' : 'max-h-0'}`}>
            <div className="p-3 px-4 flex items-center justify-between bg-white dark:bg-zinc-900/50">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">当前模型</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:border-brand-cyan transition-colors"
                disabled={loading}
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-zinc-900/50 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm mt-0.5 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className={`rounded-2xl px-4 py-2.5 text-[14px] shadow-sm border leading-relaxed whitespace-pre-wrap max-w-[82%] ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white border-transparent rounded-tr-sm dark:bg-white dark:text-slate-900' 
                  : 'bg-white text-slate-700 border-slate-100 rounded-tl-sm dark:border-white/5 dark:bg-zinc-800 dark:text-slate-300'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1].role === 'user' && (
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm mt-0.5">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-slate-400 shadow-sm border border-slate-100 dark:border-white/5 dark:bg-zinc-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
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
