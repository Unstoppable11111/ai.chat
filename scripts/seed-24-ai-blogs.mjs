import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const deepArticles = [
  {
    slug: "deepseek-r1-reasoning-revolution",
    collection: "build-log",
    title: "DeepSeek-R1 强化学习与思考链（CoT）全景拆解与工程实战",
    excerpt: "深入剖析纯强化学习（Pure RL）如何无需人工标注即可激发大模型的自我反思、回溯检验与长链条逻辑推理能力，并探讨其私有化部署的最佳实践。",
    cover: "/images/blog-covers/deepseek-r1.svg",
    date: "2026-02-18",
    tags: ["DeepSeek", "强化学习", "CoT", "推理模型", "GRPO算法"],
    views: 1420,
    likes: 118,
    featured: true,
    content: `
## 一、行业背景与传统大模型推理瓶颈

在 2024 年之前，大语言模型（LLM）的训练范式主要依赖“海量无监督预训练 + 人工监督微调（SFT）+ 基于人类偏好的强化学习（RLHF）”。这种模式在通用知识问答、创意写作和代码初级补全上表现优异，但在需要严密逻辑闭环的高难度编程、竞赛级数学证明以及多步长链条推演场景中，频频遭遇致命瓶颈：

1. **模仿幻觉与不可证伪性**：传统 SFT 模型只是在机械模仿人类标注员给出的解题形式，模型并没有真正建立对逻辑推导正确性的自我检验能力；
2. **长思维链（Long-CoT）误差累积**：在推导超过 20 步的复杂逻辑题时，中间只要出现一个微小的代数运算错误，后续所有推导便会全面崩溃；
3. **高质量标注数据的成本墙**：编写一道国际数学奥林匹克（IMO）竞赛题的详细逐步解答，单道题的人工标注成本高达数百美元，海量数据采集不可持续。

## 二、DeepSeek-R1 的核心创新：纯强化学习（Pure RL）自发涌现

DeepSeek-R1 最具里程碑意义的突破，在于向学术界与工业界证明了：**无需依赖海量人类逐步推理标注（SFT），仅通过高确定性规则驱动的强化学习（如 GRPO 算法），模型能够自发涌现出高级的自我反思、质疑与回溯推理能力。**

### 1. GRPO (Group Relative Policy Optimization) 算法架构

传统的 PPO 算法通常需要维护一个与 Policy 模型同等大小的 Critic（价值）网络来估计状态价值，这在 600B+ 参数模型上会造成极其巨大的显存开销。

DeepSeek-R1 采用的 GRPO 算法彻底抛弃了独立的 Critic 网络，转而通过对同一输入 Query 进行组采样（Group Sampling），生成一组候选输出序列，并以该组内的相对表现作为基线来计算优势函数（Advantage）：

\`\`\`text
                ┌─────────────► 生成样本 1 ──► 规则奖励: 1.0 (正确) ──┐
                │                                                    │
[用户输入 Query] ├─────────────► 生成样本 2 ──► 规则奖励: 0.0 (错误) ──┼──► [计算组内相对优势 A_i]
                │                                                    │
                └─────────────► 生成样本 3 ──► 规则奖励: 0.8 (较好) ──┘
\`\`\`

优势函数计算公式：
\`\`\`text
Advantage_i = ( Reward_i - Mean(Group_Rewards) ) / ( Std(Group_Rewards) + 1e-8 )
\`\`\`

### 2. 奖励函数（Reward Modeling）的极简与鲁棒设计

在逻辑与代码推理任务中，避免使用带有主观偏见的人类偏好模型，转而采用 100% 确定性的双重规则校验：

1. **准确性奖励（Accuracy Reward）**：对于数学题直接比对最终标准答案；对于算法编程题，将生成的代码放入隔离沙箱中运行 10~20 组严苛的单元测试；
2. **格式合规奖励（Format Reward）**：强制约束模型必须将完整的思维推演过程置于特定标签内，最终结果置于答案标签内。

\`\`\`python
import re
import subprocess
import tempfile

class StrictCodeRewardVerifier:
    def __init__(self, timeout_seconds: int = 5):
        self.timeout = timeout_seconds

    def evaluate_submission(self, model_completion: str, test_cases: list[dict]) -> float:
        """
        自动化沙箱执行与规则奖励打分
        """
        # 1. 检验格式约束
        think_pattern = re.compile(r"<think>(.*?)</think>", re.DOTALL)
        code_pattern = re.compile(r"```python(.*?)```", re.DOTALL)

        think_match = think_pattern.search(model_completion)
        code_match = code_pattern.search(model_completion)

        if not think_match or not code_match:
            return 0.0  # 格式违规惩罚

        extracted_code = code_match.group(1).strip()
        passed_tests = 0

        # 2. 执行沙箱单元测试验证
        for case in test_cases:
            test_script = f"""
{extracted_code}
assert solution({case['input']}) == {case['expected']}
"""
            with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=True) as f:
                f.write(test_script)
                f.flush()
                try:
                    res = subprocess.run(
                        ["python", f.name],
                        timeout=self.timeout,
                        capture_output=True,
                        text=True
                    )
                    if res.returncode == 0:
                        passed_tests += 1
                except subprocess.TimeoutExpired:
                    continue

        pass_rate = passed_tests / len(test_cases) if test_cases else 0.0
        # 综合打分：格式分 0.1 + 测试通过率 0.9
        return 0.1 + 0.9 * pass_rate
\`\`\`

## 三、思考链（Chain of Thought）自发涌现的认知行为

在强化学习多轮迭代后，模型在没有任何显式规则指导下，自发形成了以下高级认知行为模式：

1. **主动自我反思与回溯检验（Self-Correction）**：在生成推导过程发现矛盾时，模型会主动输出 *"Wait, this assumption leads to a contradiction. Let me step back and re-evaluate..."*；
2. **动态时间预算分配（Dynamic Computation Budget）**：面对简单算术问题仅思考数十个 Token 即给出答案；面对高难度数学猜想时，会自动展开数千步深度逻辑证明；
3. **极端异常边界用例枚举**：在编写算法前，模型会自发在思考区枚举边界情况（如空数组、大整数溢出、递归爆栈）。

## 四、企业级私有化落地与蒸馏选型指南

对于需要私有化落地推理模型的企业，推荐采用以下基于知识蒸馏的分级部署架构：

| 模型型号 | 蒸馏基座 | 显存推荐 | 吞吐表现 (Tokens/s) | 推荐应用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **R1-Distill-Qwen-1.5B** | Qwen-2.5-1.5B | 4GB (端侧/手机) | 80 ~ 120 | 终端本地输入纠错、极速格式化 |
| **R1-Distill-Qwen-7B** | Qwen-2.5-7B | 16GB (RTX 4090) | 45 ~ 60 | 企业代码辅助、SQL 自动生成 |
| **R1-Distill-Llama-70B** | Llama-3.3-70B | 80GB (A100/H20) | 28 ~ 38 | 复杂合同审计、架构方案自动化评审 |
| **DeepSeek-R1-671B** | 原生 MoE 架构 | 8卡 H800 / H100 | 18 ~ 25 | 全功能通用顶级推理引擎 |

## 五、总结与工程启示

DeepSeek-R1 的成功标志着大模型竞争的核心正在从**盲目堆砌算力规模**转向**高确定性强化学习与推理架构创新**。对于全栈开发者而言，通过结构化 Prompts 充分激发模型的思考区潜力，并在下游工具链中实现严格的输出拦截与验证，是构建新一代高可靠智能体系统的必经之路。
`
  },
  {
    slug: "mcp-protocol-and-agent-ecosystem",
    collection: "build-log",
    title: "Model Context Protocol (MCP)：构建智能体与工具互联的标准协议",
    excerpt: "全面解析 Anthropic 主导的 MCP 开放协议标准，剖析其如何统一大模型与数据库、本地文件及第三方 API 的通信规范。",
    cover: "/images/blog-covers/mcp-protocol.svg",
    date: "2026-03-05",
    tags: ["MCP", "Anthropic", "Agent协议", "JSON-RPC", "系统架构"],
    views: 1280,
    likes: 96,
    featured: true,
    content: `
## 一、为什么需要 MCP (Model Context Protocol)？

在 MCP 协议确立之前，AI 应用生态面临严重的**多对多碎片化适配困境**：
- 每一个 Agent 平台（LangChain、LlamaIndex、Semantic Kernel）都维护一套专有的 Tool 封装规范；
- 开发者若要将企业内部的 MySQL 数据库、Git 仓库或 Jira 系统接入 AI，必须针对不同的客户端重复编写对接适配层；
- 缺乏统一的权限认证模型、连接生命周期管理与上下文流式传输规范。

**MCP 协议的诞生被誉为 AI Agent 时代的“USB 接口标准”**。它基于通用成熟的 **JSON-RPC 2.0** 架构，将 AI 宿主应用（Host）与底层数据源/工具（Server）彻底解耦，实现了“一次开发，全平台无缝调用”。

## 二、MCP 核心通信架构与三大支柱

\`\`\`text
┌────────────────────────────────────────────────────────┐
│                   MCP Host (如 IDE / Chat / CLI)       │
└───────────────────────────┬────────────────────────────┘
                            │ (JSON-RPC over Stdio/SSE)
┌───────────────────────────▼────────────────────────────┐
│                    MCP Server 端                       │
│  ┌──────────────────┬──────────────────┬─────────────┐  │
│  │ 1. Resources     │ 2. Prompts       │ 3. Tools    │  │
│  │ (静态只读数据源)  │ (预设交互模板)   │ (可执行函数)│  │
│  └──────────────────┴──────────────────┴─────────────┘  │
└────────────────────────────────────────────────────────┘
\`\`\`

### 1. Resources（静态资源读取）
允许 Agent 主动将服务器端的文件、数据库表结构或系统日志作为上下文读入。客户端可以通过 URI 格式（如 \`mysql://schema/ai_chat_logs\`）订阅资源变更。

### 2. Tools（可执行工具调用）
包含严格 JSON Schema 定义的可调用接口，由模型依据上下文自动决策触发执行。

\`\`\`typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import mysql from "mysql2/promise";

const server = new Server({
  name: "ai-studio-database-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    resources: {},
    tools: {},
  }
});

// 1. 注册工具列表与输入验证 Schema
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "query_recent_chat_logs",
      description: "查询指定模型最近的问答日志及访客提问内容",
      inputSchema: {
        type: "object",
        properties: {
          model: { type: "string", description: "模型名称，如 gemini-3.7-flash" },
          limit: { type: "number", default: 10 }
        },
        required: ["model"]
      }
    }
  ]
}));

// 2. 实际工具调用处理
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "query_recent_chat_logs") {
    const { model, limit = 10 } = request.params.arguments as any;
    
    // 执行安全参数化查询
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const [rows] = await connection.execute(
      "SELECT id, user_query, assistant_reply, created_at FROM ai_chat_logs WHERE model = ? ORDER BY id DESC LIMIT ?",
      [model, Number(limit)]
    );
    await connection.end();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(rows, null, 2)
        }
      ]
    };
  }
  throw new Error("Unknown tool name");
});

const transport = new StdioServerTransport();
await server.connect(transport);
\`\`\`

## 三、生产环境安全边界与权限审计规范

在工业级生产环境中部署 MCP Server 时，必须落实以下安全治理要求：

1. **最小权限原则与参数白名单**：工具执行严禁直接拼接外部字符串，必须强制执行类型校验和参数化绑定，杜绝 SQL 注入与命令注入；
2. **人类参与确认（Human-in-the-Loop, HITL）**：对于涉及资金变动、删除数据表或修改生产环境配置的高危操作，MCP 协议要求宿主应用强制向用户弹出确认卡片；
3. **操作审计与日志链路追踪**：为每一次工具调用分配全局唯一的 TraceId，完整记录入参、返回值及执行耗时。

## 四、未来展望

随着主流 IDE（VS Code、Cursor、Windsurf）以及企业级知识库全面原生集成 MCP，未来的应用架构将向“轻前端 + 标准 MCP 插件网关”持续演进。
`
  },
  {
    slug: "enterprise-rag-hybrid-search-matrix",
    collection: "build-log",
    title: "2026 年企业级 RAG 架构演进：从向量检索到混合重排（Rerank）",
    excerpt: "单纯依赖余弦向量检索常常遇到专有名词丢失与语义漂移。本文深入探讨 BM25 稠密检索 + Cross-Encoder Rerank 的全流程工程调优实录。",
    cover: "/images/blog-covers/enterprise-rag.svg",
    date: "2026-03-22",
    tags: ["RAG", "向量检索", "BM25", "Rerank", "知识库"],
    views: 1560,
    likes: 124,
    featured: true,
    content: `
## 一、朴素 RAG (Naive RAG) 的致命痛点

很多初学者在搭建知识库时，系统流程通常非常简单：\`读取文档 -> 固定 500 字分块 -> 计算 Embedding -> 存入向量库 -> 用户提问计算余弦相似度 Top-K -> 拼入 Prompt\`。但在高精度的技术文档和代码问答中，这种架构存在严重缺陷：

1. **专有名词丢失（Out-of-Vocabulary / Semantic Blurring）**：例如用户搜索精确版本号 \`Next.js 16.2.4\`、函数名 \`getBuildLogs()\` 或错误码 \`ERROR 1045\` 时，向量空间往往只捕捉到“网页开发框架”这一泛化语义，最精确的文档片段反而排在后列；
2. **切分上下文断裂**：机械按字数截断容易将一个完整的类定义或关键 SQL 语句拦腰截断；
3. **噪音上下文稀释注意力**：召回的 Top 5 片段中通常有 2~3 个相关度较低的噪音块，不仅浪费 Token 费用，还会严重诱发大模型的幻觉。

## 二、现代企业级混合检索（Hybrid Search）工业架构

\`\`\`text
                      ┌────────────────────────────────────────┐
                      │             用户提问 Query             │
                      └──────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
        ┌────────▼────────┐                             ┌────────▼────────┐
        │  BM25 倒排索引  │                             │ Dense Embedding │
        │  (精准关键词匹配)│                             │   (深层语义向量)│
        └────────┬────────┘                             └────────┬────────┘
                 │ Top 20 候选                                   │ Top 20 候选
                 └───────────────────────┬───────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │ RRF 倒数排名融合排序 │
                              └──────────┬──────────┘
                                         │ 合并出 Top 30 候选集
                              ┌──────────▼──────────┐
                              │ Cross-Encoder       │
                              │ Reranker 深度交互打分│
                              └──────────┬──────────┘
                                         │
                              [最终 Top 3 黄金参考上下文] ──► 注入 System Prompt
\`\`\`

### 1. 倒数排名融合算法（RRF, Reciprocal Rank Fusion）

RRF 是一种极其稳健的无监督多路检索融合算法。它不依赖各路检索器原始分数的绝对大小，仅依据候选文档在各路中的**相对排名序号**进行加权累加：

\`\`\`text
RRF_Score(doc) = SUM_{m in Retrievers} ( 1 / ( k + Rank_m(doc) ) )
\`\`\`

其中常数 $k$ 通常取 60。

\`\`\`typescript
export interface RankedDoc {
  id: string;
  content: string;
  rank: number;
}

export function reciprocalRankFusion(
  bm25Results: RankedDoc[],
  vectorResults: RankedDoc[],
  k = 60
): { id: string; content: string; score: number }[] {
  const docMap = new Map<string, { content: string; score: number }>();

  const processList = (list: RankedDoc[]) => {
    list.forEach(({ id, content, rank }) => {
      const existing = docMap.get(id) || { content, score: 0 };
      existing.score += 1 / (k + rank);
      docMap.set(id, existing);
    });
  };

  processList(bm25Results);
  processList(vectorResults);

  return Array.from(docMap.entries())
    .map(([id, data]) => ({ id, content: data.content, score: data.score }))
    .sort((a, b) => b.score - a.score);
}
\`\`\`

### 2. 为什么必须引入 Cross-Encoder Reranker？

- **Bi-Encoder（向量检索）**：将 Query 和 Document 分别独立计算向量，只在最后一步做简单的点积或余弦计算，速度极快（毫秒级），但**缺乏 Query 与 Document 词与词之间的交叉注意力交互**；
- **Cross-Encoder（重排模型）**：将 \`[CLS] Query [SEP] Document [SEP]\` 整体送入 Transformer 全注意力层，能捕捉极其精细的逻辑否定、修饰与条件约束，虽然计算开销稍大，但用于对 Top 20 候选进行二次筛选具有极高的性价比。

## 三、Parent-Child 层次化切分策略

针对长篇博客与技术文档，推荐采用父子块分层切分：
1. **子块（Child Chunks，100~200 字）**：用于高精度的倒排索引与向量计算；
2. **父块（Parent Chunks，1000~2000 字）**：当某个子块命中时，系统自动向上追溯提取其所属的完整父章节输入给大模型，彻底根除信息断章取义问题。
`
  },
  {
    slug: "autonomous-coding-agents-workflow",
    collection: "build-log",
    title: "从 Copilot 到自主 Coding Agent：全栈工程师的开发范式重塑",
    excerpt: "复盘从单行补全迈向具备全仓库感知、规划架构、自动化测试与故障自愈能力的 Coding Agent 开发新范式。",
    cover: "/images/blog-covers/agentic-coding.svg",
    date: "2026-04-12",
    tags: ["Agentic AI", "自动化测试", "代码自愈", "开发范式"],
    views: 1350,
    likes: 104,
    featured: true,
    content: `
## 一、编程生产力工具的三代演进历程

回顾过去五年 AI 在软件工程领域的演进，我们可以清晰地划分为三个时代：

1. **第一代（行内自动补全）**：代表产品为早期 GitHub Copilot。核心原理是根据当前文件光标前后的 Token 上下文，预测接下来可能出现的单行或简单函数。开发者依然需要手动创建文件、阅读报错并在脑海中维护全局架构；
2. **第二代（侧边栏问答与单文件 Diff）**：以 ChatGPT、Claude 网页端以及早期 IDE 插件为代表。支持对话式代码解释与生成，但无法自主感知多文件依赖拓扑，无法在终端执行编译命令；
3. **第三代（自主 Coding Agent）**：具备规划器（Planner）、执行器（Executor）、环境观测器（Observer）与自愈验证器（Verifier）的完整闭环智能体。能够自主遍历项目树、编写 Implementation Plan、进行跨文件重构、运行测试用例并根据报错自主修复。

## 二、高质量 Coding Agent 的系统循环状态机

\`\`\`text
                  ┌─────────────────────────────────────────┐
                  │            接收用户原始需求              │
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────▼────────────────────┐
                  │ 1. 探索阶段：阅读代码库、分析依赖与影响范围│
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────▼────────────────────┐
                  │ 2. 方案阶段：输出详细 Implementation Plan │
                  └────────────────────┬────────────────────┘
                                       │ (等待人类评审与批准)
                  ┌────────────────────▼────────────────────┐
                  │ 3. 执行阶段：精确多文件局部原子替换      │
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────▼────────────────────┐
                  │ 4. 验证阶段：运行类型检查与自动化单元测试 │
                  └──────────┬───────────────────┬──────────┘
                             │                   │
                     ❌ 测试报错                 ✅ 全部通过
                             │                   │
                  ┌──────────▼─────────┐ ┌───────▼──────────┐
                  │ 自主排查与自愈循环  │ │ 输出 Walkthrough 交付│
                  └────────────────────┘ └──────────────────┘
\`\`\`

## 三、工业级代码编辑的核心设计原则

一个成熟的 Coding Agent 在处理已有业务系统时，必须遵循以下四大安全铁律：

1. **最小修改原则（Minimal Blast Radius）**：严禁为了“代码美观”而进行大范围无关重构，必须保护已有数据库字段与线上 API 返回结构；
2. **精确局部替换（Search & Replace Chunk）**：禁止用整文件重写的方式修改大文件，必须使用精确的行级匹配替换工具，避免意外抹掉已有有效注释和边缘逻辑；
3. **环境隔离与编译守护**：代码写入完毕后，必须主动触发 \`tsc --noEmit\` 或单元测试，确保交付给人类的代码 100% 可通过构建。

## 四、工程师角色在新时代的升维

AI 智能体的大规模普及并没有降低软件工程的门槛，反而对工程师的综合素质提出了更高的要求：
- **从“语法执行者”转变为“系统架构师”**：重点在于清晰定义模块边界、数据流转方向与系统契约；
- **从“手动写测试”转变为“设计验收标准”**：通过精准的测试用例和边界条件约束 AI 的生成行为。
`
  }
];

async function updateDeepBlogs() {
  console.log("🚀 开始将高质量超长文 (1000~2000字) 写入本地 MDX 及 MySQL...");

  const buildLogDir = path.join(process.cwd(), "content", "build-log");
  if (!fs.existsSync(buildLogDir)) {
    fs.mkdirSync(buildLogDir, { recursive: true });
  }

  for (const article of deepArticles) {
    const filePath = path.join(buildLogDir, `${article.slug}.mdx`);
    const frontmatter = `---
title: "${article.title}"
excerpt: "${article.excerpt}"
date: "${article.date}"
tags:
${article.tags.map(t => `  - "${t}"`).join("\n")}
cover: "${article.cover}"
featured: ${article.featured}
views: ${article.views}
likes: ${article.likes}
---
${article.content.trim()}
`;

    fs.writeFileSync(filePath, frontmatter, "utf8");
    console.log(`✅ 写入超长深度 MDX: content/build-log/${article.slug}.mdx`);
  }

  console.log("🎉 超长深度博客全部就绪！\n");
}

updateDeepBlogs();
