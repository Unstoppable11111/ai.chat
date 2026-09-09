import { ChatExperience } from "@/components/chat/chat-experience";
export default function ChatPage() {
  return <section className="container-shell mx-auto flex h-[calc(100dvh-6rem)] min-h-[360px] max-w-4xl flex-col gap-3 py-3 sm:py-4"><h1 className="shrink-0 text-lg font-semibold">贾维斯 JARVIS</h1><div className="min-h-0 flex-1"><ChatExperience /></div></section>;
}
