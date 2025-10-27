# 微信小程序快速开始指南

## 5分钟上手

### 第一步：准备环境

1. **下载微信开发者工具**
   - 访问：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
   - 下载并安装对应系统版本

2. **启动后端服务**
   ```bash
   # 在项目根目录
   cd backend
   docker-compose up -d
   ```

### 第二步：配置小程序

1. **修改API地址**

   打开 `miniprogram/app.js`，修改第5行：
   ```javascript
   apiBaseUrl: 'http://localhost:8000/api/v1',  // 改为你的API地址
   ```

   如果使用Docker部署，保持默认即可。

2. **导入项目**

   - 打开微信开发者工具
   - 点击"导入项目"
   - 选择 `miniprogram` 目录
   - AppID选择"测试号"
   - 点击"导入"

### 第三步：开始开发

1. **启用开发调试**

   在开发者工具中：
   - 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
   - 这样可以在开发环境访问本地API

2. **体验功能**

   使用测试账号登录：
   - 手机号：13800138000
   - 密码：password123

3. **开始开发**

   - 修改代码后自动刷新
   - 在控制台查看日志
   - 使用真机预览测试

## 常见场景

### 场景1：使用内网穿透工具（推荐）

如果需要真机调试或后端不在本地，使用ngrok等工具：

```bash
# 安装ngrok
# macOS: brew install ngrok
# Windows: 下载 https://ngrok.com/download

# 启动内网穿透（假设后端运行在8000端口）
ngrok http 8000

# 复制生成的https URL，例如：
# https://abc123.ngrok.io

# 修改 app.js 中的 apiBaseUrl
apiBaseUrl: 'https://abc123.ngrok.io/api/v1',
```

### 场景2：部署到云服务器

1. 将后端部署到云服务器
2. 配置域名和HTTPS证书
3. 修改 `app.js` 中的 `apiBaseUrl`
4. 在小程序后台配置服务器域名

### 场景3：仅修改UI/UX

如果只想修改界面，不改功能：
- 主要修改 `.wxss` 文件（样式）
- 修改 `.wxml` 文件（结构）
- 保持 `.js` 文件不变

## 目录说明

```
miniprogram/
├── pages/              # 页面目录
│   ├── login/         # 登录页 - 入口页面
│   ├── companions/    # 角色列表 - 主页
│   └── chat/          # 聊天页 - 核心功能
├── utils/
│   ├── api.js         # 🔧 修改这里来调整API调用
│   └── util.js        # 🔧 通用工具函数
├── app.js             # 🔧 修改全局配置
├── app.json           # 🔧 页面路由、导航栏配置
└── app.wxss           # 🔧 全局样式
```

🔧 = 常修改的文件

## 调试技巧

### 1. 查看网络请求

开发者工具 → Network → 查看所有API请求

### 2. 查看数据

在页面 `.js` 文件中：
```javascript
console.log('当前数据:', this.data)
```

### 3. 清除缓存

开发者工具 → 清除缓存 → 全部清除

### 4. 真机调试

点击"预览" → 手机微信扫码 → 在真机上调试

## 常见问题

### Q1: 请求失败，显示"网络错误"

**解决方案：**
1. 检查后端服务是否启动
2. 检查 `app.js` 中的 `apiBaseUrl` 是否正确
3. 开发工具是否勾选"不校验合法域名"
4. 查看Network面板确认请求URL

### Q2: 登录后立即退出

**解决方案：**
1. 查看Console是否有错误
2. 检查token是否正确保存
3. 检查API返回格式是否正确

### Q3: 页面样式混乱

**解决方案：**
1. 清除缓存重新编译
2. 检查 `.wxss` 文件是否有语法错误
3. 查看Console是否有警告

### Q4: 真机预览白屏

**解决方案：**
1. 检查手机是否能访问API地址
2. API必须是HTTPS或使用内网穿透
3. 查看真机调试Console日志

## 下一步

完成基础开发后：

1. **自定义样式** → 修改 `app.wxss` 和各页面的 `.wxss`
2. **添加功能** → 参考现有页面，创建新页面
3. **优化体验** → 添加loading、错误提示等
4. **准备上线** → 参考 [README.md](./README.md) 的部署章节

## 获取帮助

- 微信小程序官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 项目Issue：提交到GitHub Issues
- 后端API文档：http://localhost:8000/docs

祝开发顺利！🎉
