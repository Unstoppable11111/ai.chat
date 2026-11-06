# Project Guidelines & Memory (GEMINI.md)

## 项目常见避坑与错误记录

### 1. API 路由命名规范（严禁使用 `/api/...`）
- **错误现象**：在前端通过 `fetch('/api/...')`（例如 `/api/generate/image`）调用自身 Next.js API 时，请求返回 HTTP 404/502，且响应 JSON 为 `{"success": false, "message": "接口不存在"}`。
- **根本原因**：服务器生产环境与网关反向代理配置中，`/api/` 路径被前置代理全局拦截并转发到了 New API / One API（Gin 框架服务，运行于 3002 端口），该网关无此接口定义时会默认返回 `{"message": "接口不存在", "success": false}`。
- **正确做法与约束（Dos & Don'ts）**：
  - ❌ **严禁**创建任何形如 `/api/...` 的子路由（例如 `/api/generate/...`、`/api/upload` 等）。
  - ✅ **必须**遵循全站统一的连字符命名规范：前缀统一为 `/api-*`，例如 `/api-generate-image`、`/api-workflow/...`、`/api-chat-backend`、`/api-workspace-session`。
  - 这样可保证 Nginx 与前端代理直接穿透到 Next.js 主服务，彻底避免被第三方 API 网关截胡拦截。

### 2. 上游大模型渠道变动与容灾回退规范（严禁单点硬编码依赖）
- **错误现象**：在工作流（/workflow）、小说生成或章节微调时，界面提示 `文本服务暂时不可用（HTTP 503），请稍后重试。`，Step 1 直接报 FAIL。
- **根本原因**：上游聚合网关（如 New API）中部分特定模型（如 `gemini-3.7-flash`）的供应商渠道下线、额度耗尽或发生临时封控时，网关会直接返回 HTTP 503 `No available channel for model ...`。如果服务端未配置候选备用模型列表，直接因单点异常导致全流水线崩溃。
- **正确做法与约束（Dos & Don'ts）**：
  - ❌ **严禁**在调用上游大模型时只允许一个固定模型重试，否则网关该模型无渠道时重试多少次都会是 503。
  - ✅ **必须**为核心文本流（如 `callLLMStream`、章节微调）建立候选模型回退机制（Fallback Models，如 `["gemini-3.5-flash-lite", "gemini-3.1-pro"]`）；在检测到上游 5xx/404 且尚未向用户输出截断正文时，自动平滑切换至下一个健康模型无感重试。
  - ✅ **必须**保证默认模型优先配置为当前经真实验证可用的稳定模型（如 `gemini-3.5-flash-lite`）。
