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

