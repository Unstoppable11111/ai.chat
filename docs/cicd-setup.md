# CI/CD Setup

这个项目已经配置了 GitHub Actions 自动部署流水线：

- push 到 `main` 时自动触发
- 先在 GitHub Actions 里执行 `npm ci` 和 `npm run build`
- 构建通过后 SSH 到服务器
- 在服务器项目目录拉取最新代码、重新安装依赖、重新构建
- 如果服务器安装了 PM2，则自动重启服务

## GitHub Secrets

在 GitHub 仓库打开：

`Settings -> Secrets and variables -> Actions -> New repository secret`

添加这些 Secrets：

```text
DEPLOY_HOST=124.223.54.164
DEPLOY_USER=root
DEPLOY_PORT=22
DEPLOY_PATH=/www/wwwroot/chenyc
DEPLOY_SSH_KEY=<本机 C:\Users\14393\.ssh\chenyc_github_actions 的完整内容>
```

可选：

```text
PM2_APP_NAME=<PM2 应用名>
```

如果不设置 `PM2_APP_NAME`，流水线会执行 `pm2 restart all`。

## 服务器授权

把本机生成的公钥追加到服务器的 `authorized_keys`：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo '<本机 C:\Users\14393\.ssh\chenyc_github_actions.pub 的内容>' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 服务器项目要求

服务器上的项目目录应满足：

- 路径是 `/www/wwwroot/chenyc`
- 目录内是这个 Git 仓库
- 服务器可以执行 `git fetch origin main`
- 服务器已安装 Node.js、npm
- 如果需要自动重启服务，服务器已安装并配置 PM2

## 手动触发

除了 push 到 `main`，也可以在 GitHub 仓库：

`Actions -> Deploy -> Run workflow`

手动触发一次部署。
