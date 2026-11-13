import type { Components } from 'react-markdown';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string;
  isThinking?: boolean;
  sources?: { id: string; title: string; heading: string; url: string; excerpt: string; version?: string }[];
  error?: boolean;
};

export interface ChatModelConfig {
  id: string;
  name: string;
  desc: string;
  adminOnly?: boolean;
}

export const CHAT_MODELS: ChatModelConfig[] = [
  { id: 'gemini-3.5-flash-lite', name: 'CTS-3.5 疾速引擎', desc: '轻量极速响应 · 全员默认' },
  { id: '4hydrogen', name: '4 Hydrogen', desc: '日常帮助平衡核心 · 全员可用' },
  { id: '4argon', name: '4 Argon 旗舰超算', desc: '自研终极核心 · 深度长思维链', adminOnly: true },
];

export type ChatModelId = string;

export const THINKING_LEVELS = [
  { id: 'off', name: '思考: 关', desc: '不展开思考链，极速响应' },
  { id: 'low', name: '思考: 浅层', desc: '快速轻度推导' },
  { id: 'medium', name: '思考: 适中', desc: '平衡思考深度' },
  { id: 'high', name: '思考: 深度', desc: '长思维链全量推导' },
] as const;

export type ThinkingLevelId = typeof THINKING_LEVELS[number]['id'];

export const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2 text-white">{children}</h3>,
  a: ({ href, children }) => (
    <a href={href} className="text-brand-cyan hover:underline" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className && typeof children === 'string' && !children.includes('\n');
    return isInline ? (
      <code className="bg-white/10 rounded px-1.5 py-0.5 text-[0.9em] text-cyan-200 border border-white/10" {...props}>
        {children}
      </code>
    ) : (
      <pre className="bg-[#04060b] border border-white/10 text-slate-200 p-4 rounded-xl overflow-x-auto text-[0.9em] my-3 shadow-sm">
        <code className={className} {...props}>{children}</code>
      </pre>
    );
  },
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-cyan-500/40 pl-4 py-1 my-2 text-slate-400 italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse border border-white/10 rounded-lg">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-white/10 px-4 py-2 bg-[#04060b] text-left font-medium text-white">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-white/10 px-4 py-2 text-slate-300">
      {children}
    </td>
  ),
  img: ({ src, alt, ...props }) => (
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
