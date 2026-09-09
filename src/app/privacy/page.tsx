import type { Metadata } from "next";
import { siteConfig } from "@/data/site";
export const metadata: Metadata = { title: "隐私与数据", alternates: { canonical: "/privacy" } };
export default function PrivacyPage() {
  return <article className="container-shell max-w-3xl space-y-7 py-12 text-sm leading-8">
    <h1 className="text-3xl font-semibold">隐私与数据</h1>
    <section><h2 className="text-xl font-semibold">账户与投研数据</h2><p>注册需要邮箱和密码。密码以加盐摘要存储；登录会话最长 8 小时。持仓、模拟账户、个人报告和登录后的聊天历史按账户分别存储。站点管理员维护数据库，账户隔离不意味着管理员无法访问数据库。</p></section>
    <section><h2 className="text-xl font-semibold">AI 对话</h2><p>发送消息时，当前对话的最近消息和检索到的公开站内资料将交给站点配置的外部模型服务处理。持仓不会自动附加到对话。请在发送前检查文本，避免包含密码、密钥或不希望传给外部服务的信息。模型输出可能有误，引用链接可用于核验原文。</p></section>
    <section><h2 className="text-xl font-semibold">历史记录与保存期限</h2><p>未登录时，对话保存在当前浏览器；登录后，最近 10 个对话、每个最多 30 条消息保存在服务器，供本人再次登录查看。点击“清除对话历史”会清空当前账户的对话记录。账户和投研数据保留至用户删除或提出删除请求；基础设施备份可能保留较早版本。</p></section>
    <section><h2 className="text-xl font-semibold">运行记录</h2><p>应用不另行记录完整问答用于分析。请求限额使用短期计数器；启用可信代理时使用 IP 摘要。托管平台和模型供应商可能另有访问日志和保存政策，请勿将此服务视为保密通信工具。</p></section>
    <section><h2 className="text-xl font-semibold">访问、更正与删除</h2><p>可以在工作台修改或删除自己的持仓。账户删除、历史遗留日志清理和数据导出请求可联系 <a className="underline" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>。</p></section>
  </article>;
}
