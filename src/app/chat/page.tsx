'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, User, Sparkles, Send, Brain, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, CHAT_MODELS as MODELS, markdownComponents as MarkdownComponents } from '@/components/chat/chat-types';
import { ThinkingBlock } from '@/components/chat/thinking-block';
import { ModelSelector } from '@/components/chat/model-selector';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);
  const [enableThinking, setEnableThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是贾维斯 (JARVIS)，CHEN TECH STUDIO 专属人工智能助理。关于系统架构、深度技术白皮书或全栈工程落地，有什么我可以协助你的？' }
  ]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);

  const isThinkingActive = enableThinking || selectedModel.endsWith('-thinking');

  // 仅在消息容器内部进行局部平滑滚动，绝不触发外部页面的 window 跳跃
  const scrollToBottom = (smooth = false) => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  };

  // 检测用户是否手动向上翻看历史，若离开底部则暂停自动跟滚
  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    isAutoScrollRef.current = isNearBottom;
  };

  useEffect(() => {
    if (isAutoScrollRef.current) {
      scrollToBottom(false);
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const newMessages = [...messages, { role: 'user', content: input } as Message];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    isAutoScrollRef.current = true;
    setTimeout(() => scrollToBottom(true), 50);

    const willThink = isThinkingActive;

    try {
      const apiMessages = newMessages.filter((_, i) => i !== 0 || newMessages[0].role !== 'assistant');

      let sessionId = "anonymous-web";
      if (typeof window !== "undefined") {
        sessionId = localStorage.getItem("chat_session_id") || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        localStorage.setItem("chat_session_id", sessionId);
      }

      const res = await fetch('/api-chat-backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: apiMessages, 
          model: selectedModel,
          thinking_budget: willThink ? 2048 : 0,
          session_id: sessionId
        })
      });

      if (!res.ok) throw new Error('Network response was not ok');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '', 
        reasoning_content: '', 
        isThinking: willThink 
      }]);

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
                const delta = data.choices?.[0]?.delta;
                if (delta) {
                  const hasReasoning = typeof delta.reasoning_content === 'string' && delta.reasoning_content.length > 0;
                  const hasContent = typeof delta.content === 'string' && delta.content.length > 0;

                  if (hasReasoning || hasContent) {
                    setMessages(prev => {
                      const newMsgs = [...prev];
                      const lastIdx = newMsgs.length - 1;
                      const currentMsg = newMsgs[lastIdx];
                      if (currentMsg && currentMsg.role === 'assistant') {
                        newMsgs[lastIdx] = {
                          ...currentMsg,
                          reasoning_content: hasReasoning
                            ? (currentMsg.reasoning_content || '') + delta.reasoning_content
                            : currentMsg.reasoning_content,
                          content: hasContent
                            ? currentMsg.content + delta.content
                            : currentMsg.content,
                          isThinking: hasContent ? false : currentMsg.isThinking
                        };
                      }
                      return newMsgs;
                    });
                  }
                }
              } catch {
                // parse error on partial chunks is common, ignore
              }
            }
          }
        }
      }

      // 流结束，确保将 isThinking 标记为 false
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastIdx = newMsgs.length - 1;
        if (newMsgs[lastIdx] && newMsgs[lastIdx].role === 'assistant') {
          newMsgs[lastIdx] = {
            ...newMsgs[lastIdx],
            isThinking: false
          };
        }
        return newMsgs;
      });
    } catch {
      setMessages(prev => {
        if (prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].content === '') {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = '网络请求失败，请检查。';
          newMsgs[newMsgs.length - 1].isThinking = false;
          return newMsgs;
        }
        return [...prev, { role: 'assistant', content: '网络请求失败，请检查。', isThinking: false }];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPrompt = (promptText: string) => {
    setInput(promptText);
  };

  const ALL_SUGGESTED_TOPICS = [
    { title: "🎨 视觉工程", prompt: "介绍一下本站的极简现代排版、流光字体与 3D WebGL 动效设计体系。" },
    { title: "🤖 Coding Agent", prompt: "阅读《自主 Coding Agent 工作流》，自主智能体如何实现端到端代码重构？" },
    { title: "⚡ 混合思考", prompt: "深入解析 Claude 与 Gemini 的混合思考（Hybrid Thinking）双核推理范式。" },
    { title: "🛡️ 安全防线", prompt: "在企业级大模型落地中，如何防御越狱注入（Prompt Injection）与凭证泄露？" },
    { title: "🧠 稀疏 MoE", prompt: "解读 DeepSeek 与前沿 MoE 架构的高吞吐推理与动态门控路由机制。" },
    { title: "📐 RAG 原理", prompt: "在 RAG 系统中，万字长文是如何通过 H2/H3 标题拓扑切分为 Parent-Child 知识块的？" },
    { title: "🧪 Shader 实验", prompt: "站内 Shader 视觉实验中的光线步进（Raymarching）与流体物理是如何实现的？" },
    { title: "🛠️ 全栈架构", prompt: "CHEN TECH STUDIO 的 React 19 + Next.js 16 + MySQL 全栈架构有哪些工程亮点？" },
    { title: "🌐 协议革命", prompt: "Model Context Protocol (MCP) 是如何重构大模型与本地工具链连接的？" },
    { title: "🚀 生产降级", prompt: "当云端数据库发生高并发抖动时，流式 AI 助手是如何做到零感知优雅降级的？" },
    { title: "📊 性能优化", prompt: "Next.js 16 的 Turbopack 与 React Server Components 是如何提升首屏性能的？" },
    { title: "⚙️ 提示词工程", prompt: "从简单的 System Prompt 到 Context Engineering，上下文设计的演进脉络是什么？" },
    { title: "💡 独立开发", prompt: "作为全栈工程师与独立开发者，CHEN TECH STUDIO 创立的技术愿景是什么？" },
    { title: "🔮 未来趋势", prompt: "未来 2-3 年内，具身智能与大模型端侧推理会呈现怎样的技术突破？" },
  ];

  const [activeTopics, setActiveTopics] = useState(ALL_SUGGESTED_TOPICS.slice(0, 4));

  const refreshTopics = () => {
    const shuffled = [...ALL_SUGGESTED_TOPICS].sort(() => 0.5 - Math.random());
    setActiveTopics(shuffled.slice(0, 4));
  };

  useEffect(() => {
    // 首次客户端挂载时随机洗牌一次
    refreshTopics();
  }, []);

  return (
    <div className="container-shell max-w-4xl mx-auto pt-16 sm:pt-20 pb-4 sm:pb-6 px-3 sm:px-6 h-[calc(100dvh-1rem)] flex flex-col overflow-hidden">
      
      {/* 头部标题与控制状态（紧凑贴合） */}
      <div className="flex items-center justify-between gap-3 mb-3 px-1 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-brand-cyan" />
          </span>
          <div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              贾维斯 (JARVIS)
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              专属人工智能助手 · 知识库联动 · 全栈技术支持
            </p>
          </div>
        </div>

        {/* 顶部简易指示灯 */}
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-muted-foreground bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-slate-900/5">
          <span className="flex h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" />
          <span>{MODELS.find(m => m.id === selectedModel)?.name || 'Jarvis-Omni'}</span>
        </div>
      </div>
      
      {/* 聊天消息流视窗 */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-900/10 dark:border-white/10 p-3.5 sm:p-6 mb-3 shadow-sm space-y-4 sm:space-y-5"
      >
        {messages.map((msg, idx) => {
          const displayContent = msg.role === 'assistant' 
            ? msg.content
                .replace(/\[([^\]]+)\]\(http:\/\/googleusercontent\.com\/[a-zA-Z0-9_/-]+\)/g, '$1')
                .replace(/http:\/\/googleusercontent\.com\/[a-zA-Z0-9_/-]+\s*/g, '')
            : msg.content;
            
          return (
            <div key={idx} className={`flex gap-2.5 sm:gap-3.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-xs ${msg.role === 'user' ? 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-[15px] ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-xs dark:bg-white dark:text-slate-900 whitespace-pre-wrap' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-xs shadow-xs dark:border-white/5 dark:bg-zinc-800 dark:text-slate-300'
              }`}>
                {msg.role === 'assistant' && (msg.reasoning_content || msg.isThinking) && (
                  <ThinkingBlock 
                    reasoningContent={msg.reasoning_content} 
                    isThinking={msg.isThinking} 
                  />
                )}
                {msg.role === 'assistant' ? (
                  displayContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                      {displayContent}
                    </ReactMarkdown>
                  ) : (
                    msg.isThinking ? null : (
                      <span className="text-slate-400 dark:text-zinc-500 text-xs sm:text-sm">正在生成回答...</span>
                    )
                  )
                ) : (
                  displayContent
                )}
              </div>
            </div>
          );
        })}

        {/* 初始欢迎状态下的快捷推荐选项 */}
        {messages.length === 1 && !loading && (
          <div className="pt-4 sm:pt-6 border-t border-slate-900/5 dark:border-white/5">
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-brand-cyan" />
                SUGGESTED TOPICS // 推荐探讨
              </p>
              <button
                type="button"
                onClick={refreshTopics}
                className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-brand-cyan transition-colors cursor-pointer px-2 py-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <RefreshCw className="h-3 w-3 transition-transform hover:rotate-180 duration-300" />
                <span>换一批</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeTopics.map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendPrompt(starter.prompt)}
                  className="flex items-center justify-between text-left p-2.5 sm:p-3 rounded-xl border border-slate-900/5 bg-slate-50/70 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 dark:border-white/5 transition-all text-xs text-foreground/80 hover:text-brand-cyan group cursor-pointer"
                >
                  <span className="font-medium shrink-0">{starter.title}</span>
                  <span className="text-[11px] text-muted-foreground group-hover:text-brand-cyan truncate max-w-[180px] sm:max-w-[200px] ml-2">
                    {starter.prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && messages[messages.length - 1].role === 'user' && (
          <div className="flex gap-2.5 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-white text-slate-400 border border-slate-100 rounded-tl-xs shadow-xs dark:border-white/5 dark:bg-zinc-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* 底部控制器与输入栏 */}
      <div className="flex flex-col gap-2">
        {/* 工具栏：模型选择 + 深度思考开关 */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <ModelSelector
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => setEnableThinking(!enableThinking)}
              disabled={loading}
              className={cn(
                "flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1 rounded-full border transition-all cursor-pointer select-none",
                isThinkingActive
                  ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40 shadow-xs dark:bg-brand-cyan/20"
                  : "bg-white/80 text-slate-500 border-slate-900/10 hover:bg-slate-100 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-white/10"
              )}
            >
              <Brain className={cn("h-3.5 w-3.5", isThinkingActive ? "text-brand-cyan animate-pulse" : "")} />
              <span>{isThinkingActive ? "THINKING ON" : "THINKING"}</span>
            </button>
          </div>

          <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
            ENTER TO SEND
          </span>
        </div>

        {/* 核心输入框 */}
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 sm:p-2 rounded-2xl border border-slate-900/10 dark:border-white/10 shadow-sm focus-within:ring-2 focus-within:ring-brand-cyan/20 focus-within:border-brand-cyan transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="随时输入您的问题或想法..." 
            className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-0"
            disabled={loading}
          />
          <button 
            onClick={sendMessage} 
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 sm:h-10 sm:w-auto sm:px-5 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            aria-label="发送消息"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline text-xs font-semibold">{loading ? '...' : '发送'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
