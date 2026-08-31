import type { Components } from 'react-markdown';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string;
  isThinking?: boolean;
};

export const CHAT_MODELS = [
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' },
] as const;

export type ChatModelId = typeof CHAT_MODELS[number]['id'];

export const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 text-slate-900 dark:text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 text-slate-900 dark:text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2 text-slate-900 dark:text-white">{children}</h3>,
  a: ({ href, children }) => (
    <a href={href} className="text-brand-cyan hover:underline" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className && typeof children === 'string' && !children.includes('\n');
    return isInline ? (
      <code className="bg-slate-100 dark:bg-zinc-700/50 rounded px-1.5 py-0.5 text-[0.9em] text-slate-800 dark:text-slate-200" {...props}>
        {children}
      </code>
    ) : (
      <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-[0.9em] my-3 shadow-sm">
        <code className={className} {...props}>{children}</code>
      </pre>
    );
  },
  strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-slate-200 dark:border-zinc-700 pl-4 py-1 my-2 text-slate-500 dark:text-slate-400 italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse border border-slate-200 dark:border-zinc-700 rounded-lg">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-slate-200 dark:border-zinc-700 px-4 py-2 bg-slate-50 dark:bg-zinc-800/50 text-left font-medium text-slate-900 dark:text-white">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-200 dark:border-zinc-700 px-4 py-2 text-slate-700 dark:text-slate-300">
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
