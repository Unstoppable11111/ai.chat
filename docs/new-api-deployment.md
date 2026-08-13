# New API 部署与运维文档

## 一、当前部署概况

### 服务器环境

```text
操作系统：Ubuntu Linux
服务器架构：x86_64 / amd64
Docker：已安装并运行
Docker Compose：已安装并可用
时区：Asia/Shanghai
```

### 服务结构

```text
国内服务器
├── Mihomo
│   ├── 配置目录：/etc/mihomo
│   ├── 程序路径：/usr/local/bin/mihomo
│   ├── HTTP/Mixed 代理：127.0.0.1:7890
│   └── systemd 服务：mihomo.service
│
├── Docker daemon
│   └── 通过 http://127.0.0.1:7890 拉取外网镜像
│
└── New API
    ├── Compose 目录：/root/new-api
    ├── 数据目录：/root/new-api/data
    ├── 容器名称：new-api
    ├── 容器端口：3000
    └── 当前宿主机端口：3002
```

### 当前端口情况

```text
3000：已被 next-server 占用
3001：已被其他服务占用
3002：New API
7890：Mihomo HTTP/Mixed 代理
7891：可能为 Mihomo SOCKS 代理
9090：可能为 Mihomo REST API
```

不要停止 `3000` 和 `3001` 上的服务，除非已经确认它们属于哪个业务。

---

# 二、已经完成的内容

## 1. Mihomo 已安装

已安装稳定版 Mihomo：

```text
/etc/mihomo/mihomo-linux-amd64-v1-v1.19.29.gz
/usr/local/bin/mihomo
```

检查版本：

```bash
/usr/local/bin/mihomo -v
```

检查配置：

```bash
sudo /usr/local/bin/mihomo -t -d /etc/mihomo
```

## 2. Clash 配置已导入

配置文件：

```text
/etc/mihomo/config.yaml
```

权限建议保持：

```bash
sudo chown root:root /etc/mihomo/config.yaml
sudo chmod 600 /etc/mihomo/config.yaml
```

配置中已经把默认无法直连的流量调整为使用代理组。实际测试结果显示：

```text
github.com -> 代理节点
registry-1.docker.io -> 代理节点
api.ipify.org -> 代理节点
```

## 3. Mihomo 已作为系统服务运行

查看状态：

```bash
sudo systemctl status mihomo --no-pager
```

查看日志：

```bash
sudo journalctl -u mihomo -n 100 --no-pager
```

重启：

```bash
sudo systemctl restart mihomo
```

确认开机启动：

```bash
sudo systemctl is-enabled mihomo
```

预期：

```text
enabled
```

## 4. Docker daemon 已配置代理

配置文件：

```text
/etc/systemd/system/docker.service.d/http-proxy.conf
```

内容：

```ini
[Service]
Environment="HTTP_PROXY=http://127.0.0.1:7890"
Environment="HTTPS_PROXY=http://127.0.0.1:7890"
Environment="NO_PROXY=localhost,127.0.0.1,::1"
```

检查 Docker 是否读取配置：

```bash
sudo systemctl show docker --property=Environment
```

Docker 拉取测试已经通过：

```bash
docker pull hello-world
```

注意：这个配置只负责 Docker daemon 拉镜像，不代表业务容器自动使用代理。

## 5. 已找到正确的 New API 官方镜像

错误镜像：

```text
caltky/new-api:latest
docker.1panel.live/caltky/new-api:latest
dockerpull.cn/caltky/new-api:latest
```

正确官方镜像：

```text
calciumion/new-api:latest
```

当前已经成功下载：

```text
calciumion/new-api:latest-amd64
```

并添加了本地标签：

```text
calciumion/new-api:latest
```

检查镜像：

```bash
docker image ls calciumion/new-api
```

## 6. New API 已成功启动

当前 Compose 目录：

```text
/root/new-api
```

当前访问端口：

```text
宿主机 3002 -> 容器 3000
```

容器健康检查结果：

```bash
curl -I http://127.0.0.1:3002
```

已经返回：

```text
HTTP/1.1 200 OK
X-New-Api-Version: v1.0.0-rc.24
```

日志显示当前使用 SQLite：

```text
SQL_DSN not set, using SQLite as database
```

这适合单机和初期使用。

---

# 三、建议的最终 Compose 配置

编辑：

```bash
cd /root/new-api
sudo nano docker-compose.yml
```

生产环境推荐最终调整为：

```yaml
services:
  new-api:
    image: calciumion/new-api:latest-amd64
    container_name: new-api
    restart: always
    ports:
      - "127.0.0.1:3002:3000"
    volumes:
      - ./data:/data
    environment:
      - TZ=Asia/Shanghai
      - SESSION_COOKIE_SECURE=true
```

这里把端口限制到 `127.0.0.1`，意味着：

```text
公网不能直接访问 IP:3002
只有服务器本机和 Nginx 反向代理可以访问
```

注意：只有配置好 HTTPS 后才能加入：

```yaml
- SESSION_COOKIE_SECURE=true
```

在仍然使用纯 HTTP 测试期间不要开启，否则登录 Cookie 可能无法正常保存。

应用配置：

```bash
cd /root/new-api
docker compose config
docker compose up -d
```

---

# 四、接下来必须完成的事项

## 1. 完成管理员初始化

如果暂时还没有域名，可以先保持：

```yaml
ports:
  - "3002:3000"
```

在云服务器安全组临时开放 TCP `3002`，访问：

```text
http://服务器公网IP:3002
```

创建管理员账号和强密码，完成初始化。

初始化后检查数据：

```bash
sudo ls -lah /root/new-api/data
```

确认数据目录中已经生成数据库文件。

初始化完成后，建议立即关闭安全组中的公网 `3002`，并改用域名 HTTPS。

## 2. 配置域名解析

在域名 DNS 服务商处新增 A 记录：

```text
记录类型：A
主机记录：api 或其他自定义名称
记录值：服务器公网 IP
```

例如：

```text
api.example.com -> 服务器公网 IP
```

等待解析生效：

```bash
nslookup api.example.com
```

确认返回服务器公网 IP。

## 3. 配置 Nginx 反向代理

因为你使用了原生的 Nginx，需要在 `/etc/nginx/sites-available/` 下新建一个配置文件（例如 `new-api`）：

```bash
sudo nano /etc/nginx/sites-available/new-api
```

写入以下反代配置（如果使用 Cloudflare，Nginx 监听 80 端口即可，安全层交由 CF 处理）：

```nginx
server {
    listen 80;
    server_name api.example.com; # 换成你的实际域名

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 较长超时适合流式 AI 请求，避免被 Nginx 提前断开
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
        proxy_buffering off;
    }
}
```

激活并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/new-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 4. 在 Cloudflare 配置 HTTPS 与代理

由于你使用了 Cloudflare（CF）作为前端代理，你不需要在服务器端去手动申请 SSL 证书。请执行以下步骤：

1. 在 CF 的 **DNS** 页面，将域名（例如 `api`）的 A 记录指向你服务器的公网 IP。
2. 确保 **开启小黄云**（Proxied 代理状态）。
3. 在 CF 的 **SSL/TLS** 设置中，将加密模式设置为 **灵活 (Flexible)**。这样 CF 到用户的流量是 HTTPS 的，而 CF 到你的服务器 Nginx 的流量走 80 端口的 HTTP。
4. 在 CF 的 “SSL/TLS -> 边缘证书” 中，开启 **始终使用 HTTPS (Always Use HTTPS)**。

测试解析和访问：

```bash
curl -I https://api.example.com
```

确认返回 `200` 或正常的应用响应。

## 5. 启用安全 Cookie

HTTPS 验证正常后，修改 Compose：

```yaml
environment:
  - TZ=Asia/Shanghai
  - SESSION_COOKIE_SECURE=true
```

应用：

```bash
cd /root/new-api
docker compose up -d
docker compose logs --tail=50 new-api
```

然后用浏览器重新登录，确认登录、刷新和退出功能正常。

## 6. 将 3002 限制为本机

Compose 修改为：

```yaml
ports:
  - "127.0.0.1:3002:3000"
```

应用：

```bash
docker compose up -d
```

检查监听：

```bash
sudo ss -lntp | grep ':3002'
```

预期：

```text
127.0.0.1:3002
```

不要再出现：

```text
0.0.0.0:3002
```

然后从云服务器安全组删除 TCP `3002`，公网只保留：

```text
80：HTTP，用于跳转 HTTPS 和证书验证
443：HTTPS
SSH 端口：只允许可信 IP 更好
```

---

# 五、容器访问境外 API

这是后续最容易忽略的部分。

目前 Docker daemon 通过 Mihomo 拉镜像，但 New API 容器不会自动使用宿主机的：

```text
127.0.0.1:7890
```

因为容器内的 `127.0.0.1` 指向容器自己。

## 优先方案：在 New API 后台为渠道设置代理

如果 New API 支持给单个渠道配置代理，应优先使用应用级代理。这样可以做到：

```text
国内渠道 -> 直连
OpenAI 等境外渠道 -> 代理
```

比整套容器全局走代理稳定，也更容易排障。

## 宿主机代理方案

如果必须让整个容器使用 Mihomo，需要：

1. 让 Mihomo 在 Docker 可访问的宿主机地址监听。
2. 用防火墙只允许 Docker 网段访问代理。
3. 不能把 `7890` 暴露到公网。
4. 给容器增加 `HTTP_PROXY` 和 `HTTPS_PROXY`。

不要直接把 Mihomo 配置成公网开放的无认证代理。该部分涉及 Docker 网桥地址和防火墙规则，应先执行：

```bash
docker network inspect new-api_default
ip addr show docker0
sudo ufw status
```

根据实际网段再配置，不能直接照抄固定 IP。

---

# 六、日常运维命令

## 查看状态

```bash
cd /root/new-api
docker compose ps
sudo systemctl status mihomo --no-pager
sudo systemctl status docker --no-pager
```

## 查看 New API 日志

```bash
cd /root/new-api
docker compose logs --tail=100 new-api
```

持续查看：

```bash
docker compose logs -f new-api
```

按 `Ctrl+C` 退出，不会停止容器。

## 查看 Mihomo 日志

```bash
sudo journalctl -u mihomo -n 100 --no-pager
```

持续查看：

```bash
sudo journalctl -u mihomo -f
```

## 重启服务

```bash
sudo systemctl restart mihomo
sudo systemctl restart docker

cd /root/new-api
docker compose restart new-api
```

注意：重启 Docker 会短暂影响服务器上的所有容器。

## 检查端口

```bash
sudo ss -lntp | grep -E ':(3000|3001|3002|7890|7891|9090)\b'
```

## 检查容器资源

```bash
docker stats new-api
```

---

# 七、备份方案

当前使用 SQLite，最稳妥的简单备份方式是短暂停止容器。

## 手动备份

```bash
cd /root/new-api
docker compose stop new-api

sudo tar -czf /root/new-api-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  docker-compose.yml data

docker compose start new-api
```

检查备份：

```bash
ls -lh /root/new-api-backup-*.tar.gz
```

备份文件必须再同步到另一台服务器或对象存储。只放在同一块服务器磁盘上不算可靠备份。

## 恢复方法

先停止服务：

```bash
cd /root/new-api
docker compose down
```

备份当前目录后，再解压指定备份。恢复属于覆盖数据操作，执行前必须再次确认备份文件和目标目录，避免覆盖错误。

---

# 八、更新 New API

当前 Compose 使用：

```text
calciumion/new-api:latest-amd64
```

更新前先备份。

```bash
cd /root/new-api
docker compose stop new-api

sudo tar -czf /root/new-api-before-update-$(date +%Y%m%d-%H%M%S).tar.gz \
  docker-compose.yml data

docker compose start new-api
```

拉取更新：

```bash
docker pull calciumion/new-api:latest-amd64
```

重新创建：

```bash
cd /root/new-api
docker compose up -d
docker compose ps
docker compose logs --tail=100 new-api
```

检查版本：

```bash
curl -I http://127.0.0.1:3002
```

生产环境更稳妥的方案是固定版本标签，不长期追踪 `latest-amd64`。更新前查看发布说明，再改成明确版本，例如：

```yaml
image: calciumion/new-api:v1.0.0-rc.24-amd64
```

实际标签必须以 Docker Hub 当时发布的版本为准。

---

# 九、更新 Mihomo 配置

当前 `config.yaml` 是从 Clash Verge 导出的静态配置。订阅节点变化后，需要重新导出和上传。

覆盖前备份：

```bash
sudo cp /etc/mihomo/config.yaml \
  /etc/mihomo/config.yaml.bak-$(date +%Y%m%d-%H%M%S)
```

上传新配置后必须重新检查：

```bash
sudo chmod 600 /etc/mihomo/config.yaml
sudo /usr/local/bin/mihomo -t -d /etc/mihomo
```

重点检查最后的 `MATCH` 规则。新配置可能重新恢复成直连组，导致 Docker Hub 再次失败。

检查：

```bash
sudo grep -n 'MATCH' /etc/mihomo/config.yaml | tail
```

配置验证通过后：

```bash
sudo systemctl restart mihomo
sudo journalctl -u mihomo -n 50 --no-pager
```

测试：

```bash
curl -x http://127.0.0.1:7890 https://api.ipify.org
curl -x http://127.0.0.1:7890 -I https://registry-1.docker.io/v2/
```

Docker Registry 返回 `401 Unauthorized` 表示网络正常。

注意配置必须保存为 UTF-8。之前出现过：

```text
yaml: invalid leading UTF-8 octet
```

这是文件被保存成 GBK/ANSI 导致的。

---

# 十、常见故障排查

## Docker 拉取失败

先测试 Mihomo：

```bash
curl -x http://127.0.0.1:7890 -I https://github.com
curl -x http://127.0.0.1:7890 -I https://registry-1.docker.io/v2/
```

检查 Docker 代理：

```bash
sudo systemctl show docker --property=Environment
```

检查日志：

```bash
sudo journalctl -u docker -n 100 --no-pager
sudo journalctl -u mihomo -n 100 --no-pager
```

## 容器启动失败

```bash
cd /root/new-api
docker compose config
docker compose ps -a
docker compose logs --tail=200 new-api
```

## 端口冲突

```bash
sudo ss -lntp | grep ':3002'
sudo lsof -nP -iTCP:3002 -sTCP:LISTEN
```

## 域名可以打开但流式响应中断

检查 Nginx 是否配置：

```nginx
proxy_buffering off;
proxy_read_timeout 600s;
proxy_send_timeout 600s;
```

## 登录后立即退出或 Cookie 无效

确认：

1. 域名使用 HTTPS。
2. `SESSION_COOKIE_SECURE=true` 只在 HTTPS 下启用。
3. Nginx 正确传递 `X-Forwarded-Proto $scheme`。
4. 浏览器没有通过另一个 HTTP 地址访问。

## 服务重启后数据丢失

检查挂载：

```bash
docker inspect new-api \
  --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}'
```

必须看到：

```text
/root/new-api/data -> /data
```

---

# 十一、安全注意事项

1. 不要公开 Mihomo 订阅地址、节点密码或 `config.yaml`。
2. 不要将 `7890`、`7891`、`9090` 直接开放到公网。
3. 不要长期直接开放 New API 的 `3002`。
4. 管理后台必须使用强密码和 HTTPS。
5. 定期备份 `/root/new-api/data`。
6. 不要执行 `docker system prune -a`，除非明确知道会删除哪些镜像。
7. 不要依赖不明公共 Docker 镜像代理。
8. 不要继续使用错误镜像 `caltky/new-api`。
9. 生产环境尽量固定 New API 版本，不盲目自动更新。
10. VPN/代理服务的服务器使用需符合所在地法规及服务商条款。

---

# 十二、最终验收清单

依次确认：

```bash
sudo systemctl is-active mihomo
sudo systemctl is-enabled mihomo
sudo systemctl is-active docker

cd /root/new-api
docker compose ps

curl -x http://127.0.0.1:7890 -I https://registry-1.docker.io/v2/
curl -I http://127.0.0.1:3002
curl -I https://你的域名
```

最终应满足：

- Mihomo 为 `active`
- Docker 为 `active`
- New API 容器为 `Up`
- Docker Registry 返回 `401`
- 本机 New API 返回 `200`
- 域名 HTTPS 正常
- `3002` 只监听 `127.0.0.1`
- 公网安全组未开放 `3002`
- 已创建异机备份
- 管理员初始化已完成
- HTTPS 后已启用 `SESSION_COOKIE_SECURE=true`

不需要重启整台服务器。修改 Mihomo 配置后重启 Mihomo；修改 Docker daemon 代理后重启 Docker；修改 Compose 后执行 `docker compose up -d`。
