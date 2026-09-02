import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 智能助手",
  description: "用于了解网站架构、设计理念与技术实验的站内 AI 助手。",
  alternates: { canonical: "/chat" },
};

export default function ChatLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
