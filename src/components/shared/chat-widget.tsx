'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = { role: 'user' | 'assistant'; content: string };

const MarkdownComponents = {
  p: ({children}: any) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({children}: any) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
  ol: ({children}: any) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
  li: ({children}: any) => <li>{children}</li>,
  h1: ({children}: any) => <h1 className="text-xl font-bold mb-2 mt-4 text-slate-900 dark:text-white">{children}</h1>,
  h2: ({children}: any) => <h2 className="text-lg font-bold mb-2 mt-3 text-slate-900 dark:text-white">{children}</h2>,
  h3: ({children}: any) => <h3 className="text-base font-bold mb-2 mt-2 text-slate-900 dark:text-white">{children}</h3>,
  a: ({href, children}: any) => <a href={href} className="text-brand-cyan hover:underline" target="_blank" rel="noreferrer">{children}</a>,
  code: ({node, inline, className, children, ...props}: any) => {
    return inline ? (
      <code className="bg-slate-100 dark:bg-zinc-700/50 rounded px-1.5 py-0.5 text-[0.9em] text-slate-800 dark:text-slate-200" {...props}>{children}</code>
    ) : (
      <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-[0.9em] my-3 shadow-sm">
        <code {...props}>{children}</code>
      </pre>
    )
  },
  strong: ({children}: any) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
  blockquote: ({children}: any) => <blockquote className="border-l-4 border-slate-200 dark:border-zinc-700 pl-4 py-1 my-2 text-slate-500 dark:text-slate-400 italic">{children}</blockquote>,
  table: ({children}: any) => <div className="overflow-x-auto my-3"><table className="w-full text-sm border-collapse border border-slate-200 dark:border-zinc-700 rounded-lg">{children}</table></div>,
  th: ({children}: any) => <th className="border border-slate-200 dark:border-zinc-700 px-4 py-2 bg-slate-50 dark:bg-zinc-800/50 text-left font-medium text-slate-900 dark:text-white">{children}</th>,
  td: ({children}: any) => <td className="border border-slate-200 dark:border-zinc-700 px-4 py-2 text-slate-700 dark:text-slate-300">{children}</td>,
  img: ({src, alt, ...props}: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={src} 
      alt={alt || 'Image'} 
      className="inline-block max-w-full h-auto rounded-md object-contain align-middle max-h-[300px] my-1 mr-1" 
      loading="lazy"
      {...props} 
    />
  ),
};

const MODELS = [
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' }
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);

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
      let buffer = '';
      while (!done) {
        const { value, done: readerDone } = await reader!.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIdx = newMsgs.length - 1;
                    newMsgs[lastIdx] = {
                      ...newMsgs[lastIdx],
                      content: newMsgs[lastIdx].content + data.choices[0].delta.content
                    };
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
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-zinc-700 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-zinc-900/50 space-y-4">
          {messages.map((msg, idx) => {
            const displayContent = msg.role === 'assistant' 
              ? msg.content
                  .replace(/\[([^\]]+)\]\(http:\/\/googleusercontent\.com\/[a-zA-Z0-9_/-]+\)/g, '$1')
                  .replace(/http:\/\/googleusercontent\.com\/[a-zA-Z0-9_/-]+\s*/g, '')
              : msg.content;

            return (
            <div key={idx} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm mt-0.5 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className={`rounded-2xl px-4 py-2.5 text-[14px] shadow-sm border max-w-[82%] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white border-transparent rounded-tr-sm dark:bg-white dark:text-slate-900 whitespace-pre-wrap' 
                  : 'bg-white text-slate-700 border-slate-100 rounded-tl-sm dark:border-white/5 dark:bg-zinc-800 dark:text-slate-300'
              }`}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {displayContent}
                  </ReactMarkdown>
                ) : (
                  displayContent
                )}
              </div>
            </div>
            );
          })}
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
          <div className="flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-50 pl-4 pr-1.5 py-1.5 dark:border-white/10 dark:bg-zinc-800 focus-within:ring-2 focus-within:ring-slate-900/20 focus-within:border-slate-900 transition-all dark:focus-within:ring-white/20 dark:focus-within:border-white shadow-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="问点什么..."
              className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              disabled={loading}
            />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-200/50 dark:bg-zinc-700/50 hover:bg-slate-200 dark:hover:bg-zinc-700 border-none outline-none rounded-full px-2 py-1 cursor-pointer transition-colors max-w-[100px] truncate"
              disabled={loading}
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
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
