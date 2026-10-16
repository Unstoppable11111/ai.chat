# Project Guidelines & Memory (GEMINI.md)

## 项目常见避坑与错误记录

### 1. API 路由命名规范（严禁使用 `/api/...`）
- **错误现象**：在前端通过 `fetch('/api/...')`（例如 `/api/generate/image`）调用自身 Next.js API 时，请求返回 HTTP 404/502，且响应 JSON 为 `{"success": false, "message": "接口不存在"}`。
- **根本原因**：服务器生产环境与网关反向代理配置中，`/api/` 路径被前置代理全局拦截并转发到了 New API / One API（Gin 框架服务，运行于 3002 端口），该网关无此接口定义时会默认返回 `{"message": "接口不存在", "success": false}`。
- **正确做法与约束（Dos & Don'ts）**：
  - ❌ **严禁**创建任何形如 `/api/...` 的子路由（例如 `/api/generate/...`、`/api/upload` 等）。
  - ✅ **必须**遵循全站统一的连字符命名规范：前缀统一为 `/api-*`，例如 `/api-generate-image`、`/api-workflow/...`、`/api-chat-backend`、`/api-workspace-session`。
  - 这样可保证 Nginx 与前端代理直接穿透到 Next.js 主服务，彻底避免被第三方 API 网关截胡拦截。
