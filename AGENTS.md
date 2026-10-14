<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 核心战略指导原则：高精度高效 RAG 知识库系统构建（必须时刻牢记）

本项目中当前及后续新增的所有**博客文章、构建日志、深度技术白皮书、科技资讯**等任何维度的内容生产与数据沉淀：
**其最终也是最核心的战略目标，就是为了支撑和驱动本项目的高效 RAG（检索增强生成）知识库引擎！**

在处理任何内容、数据结构、数据库存储或 API 改造时，必须严格遵守以下原则：
1. **语义完整与知识密度**：所有内容必须具备高密度的实质性技术知识（架构图、数学推导、可运行源码、边缘用例），严禁空洞水文；
2. **结构化切分就绪（Chunking-Ready）**：Markdown 必须具备清晰严谨的 H2/H3 标题拓扑层次，为后续 Parent-Child 分块和语义提取提供无缝支持；
3. **数据库全量持久化**：所有文章的正文（`LONGTEXT`）、摘要、标签（`JSON`）、封面和 Slug 必须完整持久化到 MySQL `posts` 表中，以便后续向量化脚本自动提取、批量生成 Embedding 并注入向量存储；
4. **可回溯与溯源链接**：RAG 检索召回后，AI 助手必须能够依据 `slug` 和标题给出精确到行级或段落级的站内引用溯源。

---

# 🔴 生产与 CI 部署铁律（严防低级错误，推送前强制自检）

为彻底避免 GitHub Actions CI 构建或线上发布中断，所有 Agent 在提交与推送代码前，**必须严格遵守以下军规**：

### 1. 本地 CI 门禁四连检（缺一不可，严禁侥幸直接 push）
在执行 `git push` 前，必须按顺序在本地终端成功跑通以下 4 个命令：
1. `npm run build`：确保 Next.js Turbopack 编译无任何 SSR/客户端组件或路由错误；
2. `npm run typecheck`：确保全工程 TypeScript 类型零报错；
3. `npm test`：确保所有单元测试（`node:test`）100% 通过；
4. `npm run lint`：**极其关键！** CI 流中包含强制 ESLint 校验，出现任何 1 个 ESLint Error 均会导致 CI 立即中断！

### 2. React 19 / Next.js 16 Hook 规范 (react-hooks/set-state-in-effect)
- ❌ **严禁**在 `useEffect` 主体中同步直接调用会触发 `setState` 的函数（如 `void refreshData();`），这会触发级联渲染性能警告并直接导致 ESLint 报错阻断 CI；
- ✅ **正确做法**：必须通过 `async` 异步函数包装，在 `await fetch` / 微任务完成之后或事件监听器回调中再调用 `setState`，并做好 `active` 卸载保护。

### 3. Next.js ESLint 变量命名防踩坑 (@next/next/no-assign-module-variable)
- ❌ **严禁**在任何代码或测试文件（包括 `tests/*.test.mjs`）中声明或对名为 `module` 的变量赋值（如 `const module = { exports };` 会被 Next.js ESLint 判定为覆盖 CommonJS 顶层 `module`）；
- ✅ **正确做法**：统一使用语义化变量名（如 `mockModule`、`targetModule`、`fakeModule`）。

### 4. 提交依赖完整性自检（严禁漏提组件导致远端 Module not found）
- ❌ **严禁漏提依赖文件**：在提交修改某个文件（如 `chat-experience.tsx`）时，若该文件引用了新组件或路由（如 `curate-post-modal.tsx`、`api/curate-post/route.ts`），**必须确保所依赖的文件同步加入 Git 暂存区**；
- ❌ 本地存在该未跟踪文件（Untracked）时本地 build 虽能成功，但一推送到干净环境的 GitHub Actions 就会立即触发 `Module not found: Can't resolve` 构建崩溃；
- ✅ **正确做法**：提交前仔细核对 `git status`，凡属于页面或组件必需的子模块，必须完整提交，严防线上 CI 缺文件断裂！



