# 站点整改与部署说明

## 本次范围

- 多用户：邮箱注册、密码登录、服务端会话、持仓所有权校验、私人模拟账户、个人报告和聊天历史。
- 真实性：移除共享模拟盘写入、固定行情兜底、预置收益图、虚构晨报和本地伪造统计。模拟记录采用用户参考价和明确的实验费率；自动策略因缺少验证数据暂停。
- 聊天：共享页面/浮窗状态，流式输出、取消、失败重试、输入法保护、数据库历史、输入限制、超时和跨实例请求计数。私人持仓不会自动发送到模型。
- 内容：12 篇重复文章改为独立技术笔记，带原始来源和可运行示例。四类内容通过同一 posts 发布查询提供正文、列表、metadata、sitemap 和检索。项目概念明确标识，新增本站实际案例。
- RAG：完整 AST 分块，正文版本、行号与段落锚点；中文词法排序在截取结果数量前完成。当前不是向量检索，没有声称已经接入 Embedding 服务。
- 体验与发布：桌面导航收敛、可访问搜索弹层、真正的站内内容搜索、聊天移动端布局、隐私页面、Article/Breadcrumb、独立发布目录与健康检查。

## 主要文件

- 身份与权限：`src/lib/auth-db.ts`、`src/lib/server-security.ts`、`src/proxy.ts`、`src/app/api-workspace-session/route.ts`。
- 个人数据：`src/lib/portfolio-db.ts`、`src/lib/private-arena.ts`、`src/app/api-chat-history/route.ts`、`src/app/api-market/`。
- 内容和检索：`src/lib/published-posts.mjs`、`src/lib/posts-repository.ts`、`src/lib/markdown-core.mjs`、`src/lib/rag-engine.ts`。
- 界面：`src/components/chat/`、`src/components/market/`、`src/components/ui/command-menu.tsx`、`src/components/layout/site-header.tsx`。
- 数据管线：`scripts/lib/database.mjs`、`scripts/migrate-db.mjs`、`scripts/sync-mdx-to-mysql.mjs`、`scripts/seed-rag-chunks.mjs`。
- 验证与发布：`tests/`、`scripts/deploy-release.sh`、`.github/workflows/deploy.yml`。

## 数据库兼容与上线顺序

已确认服务器原有 posts 主键是有符号 BIGINT，迁移会读取实际主键类型创建关联表。tags 的旧字符串转为合法 JSON 后变更为 JSON 列；原有正文和阅读/点赞累计值不会在内容同步时重置。

上线前先备份业务数据库和服务器 `.env.local`，并验证备份可恢复。数据库结构迁移的回退依赖备份，不能通过切回旧代码撤销 DDL。

在服务器上的新版本目录、确认 `.env.local` 指向正确业务库后执行：

```sh
npm ci
npm run db:migrate
npm run db:sync
npm run rag:index
npm run typecheck
npm test
npm run lint
npm run build
```

不要直接在当前 Windows 目录执行生产迁移：local 配置中的 127.0.0.1 指本机，服务器数据库需要 SSH 隧道或在服务器本机访问。2026-09-09 已通过校验主机密钥的 SSH 隧道迁移业务库，先完成数据库备份和独立临时库恢复验证，再同步 27 篇本地内容、写入 56 个完整知识分块。备份位于服务器 `/root/chenyc-backups/`，目录仅 root 可读。

新增环境变量见 `.env.example`。保留已有凭据，只补充需要的配置。生产启用 HTTPS Cookie；仅在覆盖 X-Forwarded-For 的可信代理后启用 TRUST_PROXY。应用账号宜仅持有业务表读写权限，迁移使用单独管理账号。

CI 的 DEPLOY_KNOWN_HOSTS 已使用本机已知主机记录配置。PM2_APP_NAME 默认精确指定本站 chenyc 进程，不能重启其他项目。APP_PORT 默认 3000，CHECK_PORT 默认 3107。新版本通过数据库结构和 release 标识健康检查后才替换指定进程；量化 API 文件单独备份，语法检查后更新 quant-api 进程并检查 8100 健康接口。

## 验证证据

- `npm run lint -- --quiet`、`npm run typecheck`、`npm test`、`npm run build`。
- Node 测试执行全部 12 篇笔记的示例、检查分块无截断、特殊目录锚点、12 主题召回以及峰值回撤。
- `artifacts/verify-multiuser.mjs` 在独立 MySQL 数据库创建两个真实会话，测试持仓/历史/报告/模拟交易隔离、幂等写入、退出失效、跨站写入和统计去重。结束后删除测试数据库。
- `artifacts/multiuser-verification.json` 保存集成验证结果。聊天上游使用本地模拟服务；结果不代表所有外部供应商协议均验证通过。
- 浏览器截图保存在 `artifacts/`，覆盖聊天 390/1024/1440 宽度和首页多滚动位置。
- 13 项集成检查通过；另外 11 个页面在 390/1440 宽度的 22 项浏览器检查通过。37 个公开页面 HTML 的标题、描述、canonical、H1、图片 alt 和 JSON-LD 检查通过。
- SEO 插件在线抓取受本机代理 DNS 安全检查阻止；使用保存的 HTTP HTML 调用插件 schema 检查函数，结果见 `artifacts/seo-verification.json`。这些结果不是 Lighthouse、CrUX 或完整插件在线评分。

## 当前限制

- 发布结果以本次 GitHub Actions 和线上健康检查为准；未通过故意破坏线上应用来演练回滚。数据库 DDL 回退必须使用备份。
- 已从工作树脚本移除硬编码凭据，但泄露过的 API key 和密码仍需在供应商/服务器侧轮换；修改源码不能使旧凭据失效，也不能清除 Git 历史。
- 自动选股、自动交易、实时风险评级和外部指数基准未接入可信数据前保持暂停。手动模拟记录不是券商交易，不是实时估值。
- 历史共享 default_user 持仓、旧模拟 JSON 和旧日志没有自动分配给任何新用户，也没有擅自删除。归属迁移和旧日志清理需要单独核实。
- RAG 当前为词法基线；12 主题冒烟集不等于大规模检索评测。历史资讯也不因本次基础设施改造而自动获得事实核验。
- 导入任务只生成带来源链接的待审核摘要草稿，不能将其视为已完成全文授权采集或直接发布的原创文章。
- 忘记密码、账户注销和数据导出目前走站点管理员渠道，尚未配置邮件验证或自助恢复。

## 预览与维护

隔离预览使用 `codex_studio_preview_20260909`，与线上业务库分开。启动脚本位于 `artifacts/start-preview.mjs`，通过已知主机密钥校验的 SSH 隧道连接。预览库保留用户在预览中的输入，不会随验证测试清空。

页面修改后刷新即可看到开发环境更新。生产需重新构建、执行必要迁移并重启指定应用进程；没有使用 CDN 清缓存作为修复步骤。

建议提交信息：`fix: 完善多用户隔离并修复内容检索与站点可靠性`
