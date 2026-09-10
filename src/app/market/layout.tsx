import type { Metadata } from "next";
import { cookies } from "next/headers";
import { authConfigured, SESSION_COOKIE, verifySession } from "@/lib/server-security";
import { WorkspaceLogin } from "@/components/market/workspace-access";

export const metadata: Metadata = { title: "投研工作台", description: "独立持仓与模拟策略研究工作台。", alternates: { canonical: "/market" }, robots: { index: false, follow: false } };
export default async function MarketLayout({ children }: { children: React.ReactNode }) {
  const owner = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!owner) return <WorkspaceLogin configured={authConfigured()} />;
  return <>{children}</>;
}
