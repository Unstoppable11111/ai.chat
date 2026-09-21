import type { Metadata } from "next";
import { cookies } from "next/headers";
import { authConfigured, SESSION_COOKIE, verifySession } from "@/lib/server-security";
import { WorkflowAccessGuard } from "@/components/workflow/workflow-access-guard";

export const metadata: Metadata = {
  title: "工业化小说与短剧工作流",
  description: "全流程小说大纲细纲、正文智能递推、电影级分镜提示词与商业投稿包装工业化生产流水线。",
  alternates: { canonical: "/workflow" },
};

export default async function WorkflowLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionTokenValue = cookieStore.get(SESSION_COOKIE)?.value;
  const owner = await verifySession(sessionTokenValue);

  if (!owner) {
    return <WorkflowAccessGuard configured={authConfigured()} />;
  }

  return <>{children}</>;
}
