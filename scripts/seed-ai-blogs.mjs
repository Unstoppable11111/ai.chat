import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const articles = [
  {
    collection: "build-log",
    slug: "deepseek-r1-reasoning-revolution",
    title: "DeepSeek R1 与开源推理模型的思考链（CoT）革命",
    excerpt: "深入解析强化学习在纯推理大模型中的驱动作用，以及开源思考链技术如何彻底颠覆高难度编程与数学推理格局。",
    date: "2026-02-18",
    tags: ["DeepSeek", "强化学习", "推理模型", "CoT"],
    cover: "/images/placeholders/prompt-01.svg",
    featured: true,
    views: 890,
    likes: 76,
    content: `
## 核心背景与突破

近年来，大语言模型从传统的“下一个词预测（Next-token prediction）”逐渐演进到以强化学习驱动的**深层思考链（Chain of Thought, CoT）**模式。DeepSeek-R1 的开源标志着推理模型进入了普惠时代。

## 为什么纯强化学习能激发出逻辑推理？

在传统的监督微调（SFT）中，模型往往只是在模仿人类标注员给出的解题步骤。而 R1 通过大规模强化学习（RL），在无需大量人类示例的情况下，自发学会了：

- **自我反思与验证（Self-Correction）**：在生成推导过程如果发现矛盾，模型会主动输出“Wait, let me double check...”并重新计算。
- **动态预算分配**：面对简单问题直接作答，面对复杂数学或算法难题则自动展开数百步详细推导。

\`\`\`python
def reasoning_step_verify(hypothesis, constraints):
    """
    模型自发形成的逻辑检验分支
    """
    for constraint in constraints:
        if not constraint.is_satisfied(hypothesis):
            return False, "Constraint violation detected, backtracking..."
    return True, "Valid branch"
\`\`\`

## 对全栈开发与工程实践的启示

开源推理模型让本地私有化部署代码审查、自动化漏洞挖掘和复杂架构重构成为可能，大幅降低了推理任务对闭源商业 API 的单点依赖。
`
  },
  {
    collection: "build-log",
    slug: "mcp-protocol-and-agent-ecosystem",
    title: "Model Context Protocol (MCP)：构建智能体与工具互联的标准协议",
    excerpt: "Anthropic 推出的 MCP 协议正成为 AI Agent 时代的 USB 接口。本文拆解其架构设计、协议规范与本地扩展开发实战。",
    date: "2026-03-05",
    tags: ["MCP", "AI Agent", "架构设计", "工具协议"],
    cover: "/images/placeholders/prompt-02.svg",
    featured: true,
    views: 742,
    likes: 58,
    content: `
## 为什么需要统一的协议？

在 MCP 出现之前，每个 Agent 框架（LangChain, LlamaIndex, AutoGen）都有自己私有的 Tool 封装方式。开发者要为不同的平台重复编写 GitHub、MySQL、Slack 的连接器。

MCP（Model Context Protocol）通过标准的 JSON-RPC 2.0 规范，将工具提供方（Server）与消费方（Client/Host）彻底解耦。

## MCP 核心三要素

1. **Resources（静态资源）**：向模型提供可读取的上下文文件或数据。
2. **Prompts（提示词模板）**：服务器预置的高效交互模版。
3. **Tools（可执行工具）**：具有输入 schema 的可调用函数。

\`\`\`json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "query_database",
    "arguments": {
      "query": "SELECT count(*) FROM user_logs WHERE level = 'ERROR'"
    }
  }
}
\`\`\`

## 总结与落地展望

随着各大 IDE 和客户端全面支持 MCP，未来的全栈系统只需暴露标准 MCP Server，就能让任意 AI 编程助手安全可控地调用后端能力。
`
  },
  {
    collection: "build-log",
    slug: "autonomous-coding-agents-workflow",
    title: "从 Copilot 到自主 Coding Agent：全栈工程师的开发范式重塑",
    excerpt: "探索从单行代码补全迈向全流程规划、代码编写、自动化测试与自愈修复的完整 Agentic 工作流实践。",
    date: "2026-04-12",
    tags: ["Agentic AI", "全栈开发", "自动化重构", "工作流"],
    cover: "/images/placeholders/prompt-03.svg",
    featured: true,
    views: 1120,
    likes: 95,
    content: `
## 编码范式的三代跃迁

- **第一代（行级补全）**：Tab 键自动预测当前行代码。
- **第二代（侧边栏 Chat）**：基于单文件上下文的代码问答与局部替换。
- **第三代（自主 Coding Agent）**：具备终端执行、多文件读写、架构规划与自我测试闭环能力。

## 工程师角色的转变

全栈工程师正在从“一行行敲代码的执行者”转变为“技术方案的评审者与架构督导者”。核心竞争力在于：

1. 精确的问题定义与边界约束。
2. 架构设计与状态流转把控。
3. 安全审计、性能优化与生产环境可回滚机制。
`
  },
  {
    collection: "build-log",
    slug: "rag-hybrid-search-best-practices",
    title: "企业级 RAG 架构演进：从向量检索到混合重排（Rerank）的最佳实践",
    excerpt: "单纯依赖余弦向量检索常常遇到专有名词漏召回。本文分享 BM25 稠密检索结合 Cross-Encoder Rerank 的落地方案。",
    date: "2026-05-20",
    tags: ["RAG", "向量检索", "BM25", "Rerank", "搜索优化"],
    cover: "/images/placeholders/prompt-04.svg",
    featured: false,
    views: 630,
    likes: 42,
    content: `
## 单纯向量检索（Dense Retrieval）的痛点

- **精确专有名词失真**：如版本号（\`Next.js 16.2\`）、商品货号或特定函数名，Embedding 向量经常无法精确匹配。
- **语义漂移**：短句检索时，向量距离相近但并非答案。

## 混合检索（Hybrid Search）架构

通过 **BM25（关键词精确匹配）+ Vector（语义向量相似度）** 的倒数融合排序（Reciprocal Rank Fusion, RRF），再经过轻量 Reranker 模型二次打分，召回准确率提升显著。
`
  },
  {
    collection: "build-log",
    slug: "edge-ai-and-npu-quantization",
    title: "端侧 AI 与 4-bit 量化：如何在本地消费级设备高效运行大模型",
    excerpt: "剖析 GGUF、AWQ 与 EXL2 量化算法的权衡，以及利用 Apple Silicon / NPU 硬件加速器实现数十 token/s 的极致体验。",
    date: "2026-06-15",
    tags: ["端侧AI", "量化", "NPU", "本地部署"],
    cover: "/images/placeholders/prompt-05.svg",
    featured: false,
    views: 512,
    likes: 38,
    content: `
## 内存带宽是核心瓶颈

LLM 推理在生成阶段主要受制于内存带宽（Memory Bandwidth）。将 16-bit 浮点权重压缩至 4-bit（甚至 2-bit/3-bit 混合量化），可以将内存占用降低 70%，并使吞吐速度成倍提升。

## 本地隐私计算的最佳选择

对于敏感数据处理和个人代码知识库，端侧轻量化模型正在成为云端大模型的最佳补充。
`
  },
  {
    collection: "news",
    slug: "2026-07-multimodal-foundation-models",
    title: "多模态基础模型新进展：统一视觉、听觉与物理世界理解",
    excerpt: "2026 年最新多模态大模型在原生音频理解与视频动态推演能力上取得重大飞跃，实时端到端交互成为标准配置。",
    date: "2026-07-02",
    tags: ["多模态", "实时语音", "世界模型", "AI发展"],
    cover: "/images/placeholders/panel-1.svg",
    featured: true,
    views: 960,
    likes: 81,
    content: `
## 原生多模态（Native Multimodal）的终结之战

过去的“多模态”往往是 ASR（语音识别）+ LLM（文本）+ TTS（语音合成）的拼接。而新一代模型采用原生端到端架构，能够捕捉人类语调中的情绪、迟疑以及视觉画面中的细微物理变化。

- **超低延迟响应**：端到端延迟压缩至 200ms 以内，媲美真人对话节奏。
- **空间感知与动作预测**：为具身智能机器人和空间计算设备提供了统一的大脑底座。
`
  },
  {
    collection: "news",
    slug: "2026-08-sparse-moe-and-inference-efficiency",
    title: "稀疏 MoE 与推测解码（Speculative Decoding）普及",
    excerpt: "随着千亿参数模型成为常态，稀疏混合专家与小模型推测解码技术大幅降低了单 Token 推理成本。",
    date: "2026-08-10",
    tags: ["MoE", "推测解码", "推理加速", "架构分析"],
    cover: "/images/placeholders/panel-2.svg",
    featured: false,
    views: 450,
    likes: 35,
    content: `
## 算力成本下降推动行业爆发

通过将单次前向传播激活的参数量限制在 10%~20%，MoE 架构在保持顶级模型能力的同时，将单次 API 调用成本降低了一个数量级。推测解码则利用轻量草稿模型加速生成，使复杂长文本输出速率翻倍。
`
  },
  {
    collection: "experiments",
    slug: "prompt-engineering-to-context-design",
    title: "从单纯提示词到上下文工程（Context Engineering）实测",
    excerpt: "对比单纯增加 Prompt 字数与精细化结构化上下文注入对复杂代码生成任务成功率的影响。",
    date: "2026-08-28",
    category: "架构调优",
    cover: "/images/placeholders/prompt-06.svg",
    tools: ["Claude 3.7", "Gemini 3.7", "TypeScript"],
    tags: ["上下文工程", "Prompt优化", "实战实验"],
    promptPreview: "系统上下文包含全局文件依赖拓扑与类型定义时的精准生成测试",
    featured: true,
    views: 780,
    likes: 64,
    content: `
## Final Result

在长上下文任务中，提供结构清晰的文件树（File Tree）和符号摘要（Symbol Index），比单纯将几千行散乱代码直接塞入 Prompt 的准确率提升了 42%。

## What Worked

- 使用紧凑的 TypeScript \`.d.ts\` 类型定义作为外部上下文。
- 限制相关文件的范围，优先提供接口签名而非全量实现。
`
  }
];

async function runSeed() {
  console.log("🚀 开始生成 AI 发展博客文件与数据库同步...");

  // 1. 写入本地 MDX 文件
  for (const article of articles) {
    const targetDir = path.join(process.cwd(), "content", article.collection);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, `${article.slug}.mdx`);
    
    let frontmatter = `---
title: "${article.title}"
excerpt: "${article.excerpt}"
date: "${article.date}"
tags:
${article.tags.map(t => `  - "${t}"`).join("\n")}
cover: "${article.cover}"
featured: ${article.featured}
`;

    if (article.collection === "experiments") {
      frontmatter += `category: "${article.category || '技术探索'}"
tools:
${(article.tools || []).map(t => `  - "${t}"`).join("\n")}
promptPreview: "${article.promptPreview || ''}"
`;
    }

    frontmatter += `---\n${article.content.trim()}\n`;

    fs.writeFileSync(filePath, frontmatter, "utf8");
    console.log(`✅ 已写入 MDX: content/${article.collection}/${article.slug}.mdx`);
  }

  // 2. 连接并同步到 MySQL 数据库
  console.log("\n📦 正在同步数据到 MySQL (ai_studio.posts)...");
  try {
    const connection = await mysql.createConnection({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "980822Cyc!",
      database: "ai_studio",
      charset: "utf8mb4"
    });

    for (const article of articles) {
      await connection.execute(
        `INSERT INTO posts (slug, collection, title, excerpt, views, likes, featured, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           title = VALUES(title),
           excerpt = VALUES(excerpt),
           views = VALUES(views),
           likes = VALUES(likes),
           featured = VALUES(featured),
           published_at = VALUES(published_at)`,
        [
          article.slug,
          article.collection,
          article.title,
          article.excerpt,
          article.views,
          article.likes,
          article.featured ? 1 : 0,
          article.date
        ]
      );
    }

    await connection.end();
    console.log(`🎉 成功同步 ${articles.length} 篇精选 AI 发展技术博客到数据库 posts 表！\n`);
  } catch (dbErr) {
    console.warn("⚠️ 数据库连接或写入警告:", dbErr.message);
    console.log("（MDX 本地文件已全部就绪）");
  }
}

runSeed();
