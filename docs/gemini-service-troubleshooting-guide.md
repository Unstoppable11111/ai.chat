# Google Gemini Web-to-API (4981) 全景故障排查与维护手册 (SOP)

> 本文档针对部署在 Ubuntu 云服务器（`VM-0-15-ubuntu`）上的 `gemini-web-to-api`（端口 4981）与 `Mihomo`（端口 7890）服务。记录了从初始部署、Issue #73、Cookie 轮换失效到网络节点风控等全部历史踩坑记录与对应的高效解决方案。后续若出现接口异常，可直接对照本手册快速定位与恢复。

---

## 一、系统架构与运行拓扑

```
[ 外部调用 / Next.js 工作流 / 本地 curl ]
                    │
                    ▼ HTTP 请求 (:4981)
┌─────────────────────────────────────────────────────────────┐
│ 宿主机 (VM-0-15-ubuntu)                                      │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Docker 容器: gemini-web-to-api                      │   │
│   │ - 端口: 4981 (Fiber Web 框架)                        │   │
│   │ - 模式: 非阻塞后台异步初始化 (Issue #73 优化后)         │   │
│   │ - 鉴权凭证: GEMINI_1PSID / 1PSIDTS / 1PSIDCC        │   │
│   └──────────────────────┬──────────────────────────────┘   │
│                          │ HTTP 代理 (http://172.17.0.1:7890) │
│                          ▼                                  │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ 宿主机代理: Mihomo (Clash.Meta)                      │   │
│   │ - 监听端口: 0.0.0.0:7890                             │   │
│   └──────────────────────┬──────────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────┘
                           │ 梯子加密隧道 (TLS)
                           ▼
             [ Google Gemini Web 上游 API ]
             - gemini.google.com
             - accounts.google.com/RotateCookies
```

---

## 二、当前最新运行状态实测报告 (2026-09-23 现场实测已全部恢复)

| 探测项目 | 接口端点 / 测试项 | 实测结果 | 状态解读 |
| :--- | :--- | :---: | :--- |
| **模型动态拉取** | `GET /openai/v1/models` | **✅ 成功** | 14 个模型完整加载（含 `gemini-3-pro-image` 等） |
| **文本对话推理** | `POST /openai/v1/chat/completions` | **✅ 成功** | 使用 `gemini-2.5-flash` 测试 `1+1=?`，成功返回 `2` |
| **Cookie 登录态** | Google 会话鉴权凭证 | **✅ 有效** | 容器打印 `Gemini client initialized successfully` |
| **生图功能 (Imagen 3)** | `POST /openai/v1/images/generations` | **🎉 成功** | 成功生成高清图片数据（Base64 长度: 215,192 字节） |

---

## 三、历史问题与标准解决方案清单

### 问题 1：`/models` 返回 `{"object":"list","data":null}`

#### 故障原因
1. **原因 A（刚重启后请求过早）**：在 Issue #73 修复后，容器改为“非阻塞启动”。Fiber 网页端口在 0.1 秒内启动，但后台连接 Google、握手与拉取模型需要 **10~15 秒**。若在重启后 6 秒内请求，此时数据尚为空。
2. **原因 B（初始化时瞬时网络超时）**：若在容器刚启动的握手瞬间，代理节点抖动发生 `net/http: TLS handshake timeout`，后台初始化协程会失败退出，**且该服务失败后不会在后台自动重试**，导致后续所有请求一直拿到失败残留的 `null`。
3. **原因 C（Docker 环境变量未更新）**：如果直接使用 `docker restart`，Docker **不会**加载新传入的环境变量，容器依然在跑旧 Cookie。

#### 解决步骤
```bash
# 1. 查看最新日志，确认是超时还是在进行中
docker logs --tail 25 gemini-web-to-api

# 2. 如果之前失败退出，重新触发一次初始化并等待 12 秒
docker restart gemini-web-to-api && sleep 12

# 3. 再次查询，此时模型列表即可正常返回
curl -s http://127.0.0.1:4981/openai/v1/models
```

---

### 问题 2：Cookie 过期或多端互踢（`401 Unauthorized` / `Rotation failed`）

#### 故障原因
1. **`__Secure-1PSIDTS` 时钟令牌滚动失效**：Google 的鉴权机制包含短效动态时间戳令牌。如果在电脑端提取完 Cookie 后，**没有关闭电脑浏览器上的 Gemini 网页标签页**，电脑网页在后台自动保活刷新，会迫使 Google 签发全新令牌，服务器上的旧令牌被直接废弃（多端互踢）。
2. **特殊字符截断**：Cookie 字符串中含有大量的 `=`、`;`、`_`，若在命令行或配置文件中没有加双引号，会被 bash 截断。

#### 解决步骤（三件套防失效操作 SOP）
1. **电脑端解除潜在风控**：电脑访问 [gemini.google.com](https://gemini.google.com)，若有验证码或安全提示，先手动点过，并在网页中发送任意一条消息确认正常。
2. **提取最新 Cookie 三件套**：按 `F12` 进入 **Application** → **Cookies** → `gemini.google.com`，复制最新值：
   - `__Secure-1PSID`
   - `__Secure-1PSIDTS`
   - `__Secure-1PSIDCC`
3. **关键防失效操作（必须执行）**：
   > **复制完成后，立即将电脑端所有的 Gemini 标签页彻底关闭！** 切勿让网页挂在后台！
4. **彻底销毁旧容器并重新注入环境变量**：
```bash
docker rm -f gemini-web-to-api

docker run -d \
  --name gemini-web-to-api \
  --restart always \
  -p 4981:4981 \
  -e HTTP_PROXY="http://172.17.0.1:7890" \
  -e HTTPS_PROXY="http://172.17.0.1:7890" \
  -e GEMINI_TEMPORARY="false" \
  -e GEMINI_1PSID="<你的新_1PSID>" \
  -e GEMINI_1PSIDTS="<你的新_1PSIDTS>" \
  -e GEMINI_1PSIDCC="<你的新_1PSIDCC>" \
  -e GEMINI_REFRESH_INTERVAL=30 \
  -e GEMINI_MAX_RETRIES=3 \
  ghcr.io/ntthanh2603/gemini-web-to-api:latest
```

---

### 问题 3：生图返回 `BardErrorInfo code [9 1060]` 或 `provider returned no generated images`

#### 故障原因（经现场抓包与全链路实测）
1. **网络层面（已由助手修复）**：Mihomo 的 `🤖AI服务` 分组原本默认选择了 `"日本621 中继"`（日本机房 IP `202.8.9.242`）。Google Gemini 严禁机房 IP 进行 Imagen 3 绘图，直接返回拦截码 `[9 1060]`（`LOCATION_REJECTED`）。
   - **已实施修复**：已在 `/etc/mihomo/config.yaml` 中将 `[IPLC·US] 美国815|IPLC专线|1.5x` 和 `美国635 中继 AI` 置顶并重启生效，彻底解除了 `1060` 区域封锁。
2. **鉴权层面（导致返回 no generated images）**：
   - 切换到美国节点后，Google Gemini 明确返回文字：
     *`"Are you signed in? I can search for images, but can't seem to create any for you right now."`*
   - 容器日志精确报错：
     *`"authentication failed: cookies invalid. Please provide __Secure-1PSIDTS in addition to __Secure-1PSID"`*
   - **根因**：当前容器内的 `GEMINI_COOKIES` 只有 368 字符（仅包含 `1PSID` 和失效的 `1PSIDTS`）。Google Imagen 3 生图接口**必须验证完整的 Google 账号登录态**（包含 `SID`, `HSID`, `SSID`, `SAPISID` 等完整标头）。如果只传两项且令牌失效，Google 会降级为“未完全登录访客”，允许普通聊天（所以 1+1=2 能回），但严禁调用生图！

#### 最终解决步骤
1. 打开电脑浏览器登录 [gemini.google.com](https://gemini.google.com)；
2. 按 `F12` 切换到 **Network（网络）** 标签页，在过滤器中输入 `batchexecute`；
3. 点击任意一个 `batchexecute` 请求，复制右侧 **Request Headers（请求标头）** 中完整的 **`Cookie:`** 值（长达 1500~2500 字符的大段文本）；
4. **立即关闭电脑端所有 Gemini 网页标签页**（防多端互踢）；
5. 在服务器上运行下方“完整 Cookie 注入命令”重建容器即可立即恢复出图。

---

### 问题 4：容器内访问 `172.17.0.1:7890` 发生 `TLS handshake timeout`

#### 故障原因
* 宿主机自己执行 `curl -x http://172.17.0.1:7890` 走的是内核本地回环直连。
* 容器走的是虚拟网桥（`docker0`）。如果 Ubuntu 的防火墙（UFW）拦截了从网桥到宿主机端口的包，会导致握手超时。

#### 解决步骤
```bash
# 放行来自 Docker 网桥对宿主机 7890 代理端口的访问
ufw allow from 172.17.0.0/16 to any port 7890

# 若仍有网络隔离问题，启动命令中直接加 --network host 彻底跳过网桥：
# -e HTTP_PROXY="http://127.0.0.1:7890"
```

---

### 问题 5：旧版容器启动无限死锁、无日志、连接被重置 (Issue #73)

#### 故障原因
* `ntthanh2603/gemini-web-to-api` 在旧版本中是在依赖注入阶段同步执行 Google 鉴权。如果网络或代理握手稍有迟缓，整个 Fiber HTTP 服务器无法绑定端口，导致 `Connection reset by peer` 且日志一片空白。

#### 解决步骤
* 升级至包含修复提交 `2150fd4` 的最新镜像：
```bash
docker pull ghcr.io/ntthanh2603/gemini-web-to-api:latest
```

---

## 四、日常运维与健康检查 3 步命令（Cheatsheet）

在服务器终端直接运行以下指令，10 秒内即可确认整套系统当前所有链路是否健康：

```bash
# 1. 检查代理外网连通性与当前节点归属
curl -s -x http://127.0.0.1:7890 http://ip-api.com/json | grep -o '"country":"[^"]*"'

# 2. 检查 4981 服务模型加载状态
curl -s http://127.0.0.1:4981/openai/v1/models | grep -o 'gemini-[^"]*' | head -n 5

# 3. 验证文本会话与 Cookie 在线状态
curl -s -X POST http://127.0.0.1:4981/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "gemini-2.5-flash", "messages": [{"role": "user", "content": "1+1=?"}]}' | grep -o '"content":"[^"]*"'
```
