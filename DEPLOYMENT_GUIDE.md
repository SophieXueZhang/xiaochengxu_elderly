# 永伴 AI - 外网预览部署指南

## 方案 A：ngrok（最快，推荐演示用）

### 步骤 1：准备工作

确保所有服务都在运行：
```bash
cd /Users/pc/Documents/cursor/yongban1/test
docker-compose ps
```

### 步骤 2：修改前端 API 地址（临时）

编辑 `frontend/js/app.js`，将 Line 3-7 改为：

```javascript
// API配置 - 使用环境变量或手动配置
const BACKEND_URL = 'YOUR_NGROK_BACKEND_URL';  // 等下会填
const API_BASE_URL = `${BACKEND_URL}/api/v1`;
```

### 步骤 3：启动 ngrok（需要两个终端）

**终端 1 - 后端隧道：**
```bash
ngrok http 8000
```

记下生成的 URL，例如：`https://abc123.ngrok-free.app`

**终端 2 - 前端隧道：**
```bash
ngrok http 8080
```

记下生成的 URL，例如：`https://xyz456.ngrok-free.app`

### 步骤 4：更新前端配置

把终端 1 的后端 URL 填到 `frontend/js/app.js`：

```javascript
const BACKEND_URL = 'https://abc123.ngrok-free.app';  // 你的后端 ngrok URL
```

### 步骤 5：分享

把**前端 URL**（终端 2 的）发给别人：
```
https://xyz456.ngrok-free.app
```

---

## 方案 B：使用 ngrok 配置文件（更优雅）

### 步骤 1：创建 ngrok 配置

创建文件 `~/.ngrok2/ngrok.yml`（如果不存在）：

```yaml
tunnels:
  backend:
    addr: 8000
    proto: http
  frontend:
    addr: 8080
    proto: http
```

### 步骤 2：一次性启动两个隧道

```bash
ngrok start --all
```

### 步骤 3：更新前端配置并分享

同方案 A 的步骤 4-5

---

## 方案 C：Cloudflare Tunnel（免费固定域名）

### 步骤 1：安装 cloudflared

```bash
brew install cloudflare/cloudflare/cloudflared
```

### 步骤 2：登录

```bash
cloudflared tunnel login
```

### 步骤 3：创建隧道

```bash
cloudflared tunnel create yongban
```

### 步骤 4：配置路由

创建 `~/.cloudflared/config.yml`：

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /Users/pc/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: yongban-api.yourdomain.com
    service: http://localhost:8000
  - hostname: yongban.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

### 步骤 5：运行隧道

```bash
cloudflared tunnel run yongban
```

---

## 方案 D：最简单方案（单端口，无需改代码）

### 使用 nginx 统一端口

已经为你准备好了配置！只需：

1. 更新 docker-compose.yml，添加 nginx 网关
2. 只用一个 ngrok 隧道（端口 80）
3. 前后端都通过同一个域名访问

详见：`docker-compose-with-gateway.yml`

---

## 临时测试方案（最快）

如果只是快速给别人看一下：

```bash
# 1. 启动 ngrok
ngrok http 8080

# 2. 手动修改前端代码中的 API_BASE_URL
#    把 ngrok 给你的 URL 填进去（需要两个 ngrok）

# 3. 分享前端 ngrok 链接
```

**注意：** ngrok 免费版的 URL 每次重启都会变，需要重新配置。

---

## 生产环境部署（长期使用）

推荐使用云服务器：
- 阿里云/腾讯云轻量应用服务器（~￥60/月）
- Railway.app（免费额度）
- Render.com（免费）

详见：`PRODUCTION_DEPLOYMENT.md`
