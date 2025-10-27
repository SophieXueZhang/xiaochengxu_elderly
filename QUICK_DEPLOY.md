# 永伴 AI - 快速部署指南

## 方案 1：ngrok（推荐 - 最简单）

### 第一步：注册 ngrok 账号（免费）
1. 访问：https://ngrok.com/signup
2. 注册后复制你的 authtoken

### 第二步：配置 ngrok
```bash
ngrok config add-authtoken <你的token>
```

### 第三步：启动部署
```bash
cd /Users/pc/Documents/cursor/yongban1/test
bash deploy_ngrok.sh
```

脚本会自动：
- 启动后端隧道（端口 8000）
- 启动前端隧道（端口 8080）
- 自动更新前端配置
- 显示可分享的 URL

**复制显示的前端 URL 发给朋友即可！**

---

## 方案 2：Cloudflare Tunnel（永久免费域名）

### 安装 Cloudflare
```bash
brew install cloudflare/cloudflare/cloudflared
```

### 登录认证
```bash
cloudflared tunnel login
```

### 创建隧道
```bash
# 创建隧道
cloudflared tunnel create yongban-ai

# 记住显示的 Tunnel ID
```

### 配置隧道
创建文件 `~/.cloudflared/config.yml`：

```yaml
url: http://localhost:8080
tunnel: <你的Tunnel-ID>
credentials-file: /Users/pc/.cloudflared/<Tunnel-ID>.json
```

### 分配域名
```bash
cloudflared tunnel route dns yongban-ai yongban.你的域名.com
```

### 启动隧道
```bash
cloudflared tunnel run yongban-ai
```

### 更新前端配置
手动修改 `frontend/js/app.js` 第1行：
```javascript
const BACKEND_URL = 'https://yongban.你的域名.com';
```

---

## 方案 3：手动 ngrok（不用脚本）

### 终端 1：启动后端隧道
```bash
ngrok http 8000
```

复制显示的 URL，例如：`https://abc123.ngrok.io`

### 终端 2：更新前端配置
编辑 `frontend/js/app.js` 第1行：
```javascript
const BACKEND_URL = 'https://abc123.ngrok.io';
```

### 终端 3：启动前端隧道
```bash
ngrok http 8080
```

复制显示的 URL，例如：`https://def456.ngrok.io`

**把这个前端 URL 发给朋友！**

---

## 当前系统状态

✅ Docker 服务已运行
✅ 后端：http://localhost:8000
✅ 前端：http://localhost:8080
✅ CORS 已配置为允许所有来源
✅ 数据库已初始化
✅ 测试账号可用

**测试账号：**
- 手机号：13800138000
- 密码：password123

---

## 常见问题

### Q: ngrok 显示 "ERR_NGROK_108"
A: 免费账号同时只能运行 1 个隧道，升级账号或使用方案 2

### Q: 前端能打开但 API 报错
A: 检查 `frontend/js/app.js` 的 `BACKEND_URL` 是否正确

### Q: 想要永久域名
A: 使用方案 2 (Cloudflare Tunnel) 或升级 ngrok 付费版

### Q: 部署后性能如何？
A: 
- ngrok 免费版：速度较慢，有带宽限制
- Cloudflare：速度快，无限带宽
- 正式部署建议用云服务器

---

## 生产部署建议

如果要正式上线，推荐：
1. **Vercel/Netlify**：部署前端（免费）
2. **Railway/Render**：部署后端（免费额度）
3. **Supabase**：PostgreSQL 数据库（免费）

详见 `DEPLOYMENT_GUIDE.md`
