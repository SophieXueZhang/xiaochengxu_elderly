# 永伴 - 微信小程序版

> 专为中老年群体设计的AI情感陪伴小程序

## 项目简介

永伴小程序是一款面向中老年群体的AI情感陪伴产品，通过微信小程序提供便捷的AI陪伴服务。用户可以创建个性化的陪伴角色，通过自然对话获得情感支持和陪伴。

### 核心功能

- **用户注册/登录**: 手机号注册，安全便捷
- **陪伴角色管理**: 创建和管理多个陪伴角色
- **智能对话**: 基于GPT-4的自然对话，理解情感、提供陪伴
- **长期记忆**: AI记住用户的习惯和重要事件
- **老年友好**: 大字体、简洁界面、易于操作

## 技术栈

- **前端**: 微信小程序原生开发
- **后端**: FastAPI (Python) - 已有后端API
- **AI服务**: OpenAI GPT-4
- **数据库**: PostgreSQL + Qdrant向量数据库

## 目录结构

```
miniprogram/
├── pages/                      # 页面
│   ├── login/                 # 登录页
│   ├── register/              # 注册页
│   ├── companions/            # 角色列表页
│   ├── create-companion/      # 创建角色页
│   └── chat/                  # 聊天对话页
├── utils/                      # 工具类
│   ├── api.js                 # API接口封装
│   └── util.js                # 通用工具函数
├── images/                     # 图片资源
├── app.js                      # 小程序入口
├── app.json                    # 小程序配置
├── app.wxss                    # 全局样式
├── project.config.json         # 项目配置
└── sitemap.json               # 站点地图配置
```

## 开发指南

### 前置要求

- 微信开发者工具
- 小程序AppID（开发测试可使用测试号）
- 后端API服务已部署

### 安装步骤

1. **克隆项目**

```bash
cd miniprogram
```

2. **配置API地址**

编辑 `app.js`，修改 `apiBaseUrl` 为您的后端API地址：

```javascript
globalData: {
  apiBaseUrl: 'https://your-api-domain.com/api/v1',  // 修改为实际API地址
  // ...
}
```

3. **导入微信开发者工具**

- 打开微信开发者工具
- 选择"导入项目"
- 选择 `miniprogram` 目录
- 填入AppID（测试可选择测试号）
- 点击"导入"

4. **配置服务器域名**

在微信小程序后台配置以下域名（正式版需要）：

- request合法域名：添加您的API域名
- 必须使用HTTPS协议

### 开发调试

1. 在微信开发者工具中点击"编译"
2. 使用测试账号登录：
   - 手机号：13800138000
   - 密码：password123
3. 开发模式下可以勾选"不校验合法域名"

### API配置说明

小程序需要连接到后端API服务。请确保：

1. 后端API服务已启动（参考根目录的README.md）
2. API地址在 `app.js` 中正确配置
3. 网络可访问（开发环境可使用内网穿透工具如ngrok）

## 页面说明

### 1. 登录页 (pages/login)

- 手机号登录
- 跳转注册
- 自动保存登录状态

### 2. 注册页 (pages/register)

- 手机号注册
- 昵称设置
- 密码验证

### 3. 角色列表页 (pages/companions)

- 展示所有陪伴角色
- 点击进入聊天
- 创建新角色
- 退出登录

### 4. 创建角色页 (pages/create-companion)

- 设置角色名称
- 选择关系类型（父母、配偶、朋友等）
- 选择性别
- 描述角色背景

### 5. 聊天页 (pages/chat)

- 实时对话
- 消息历史
- AI思考动画
- 自动滚动

## 设计特点

### 老年友好设计

1. **大字体**: 全局字体32rpx起，重要信息36-48rpx
2. **高对比度**: 清晰的颜色对比，易于阅读
3. **简洁界面**: 去除复杂元素，聚焦核心功能
4. **大按钮**: 按钮高度100rpx，易于点击
5. **明确反馈**: 所有操作都有清晰的视觉反馈

### 样式规范

- 主色调：蓝色渐变 (#4A90E2 - #357ABD)
- 背景色：#F5F7FA
- 圆角：12-24rpx
- 间距：20-40rpx为基准
- 阴影：轻柔的投影效果

## API接口说明

### 认证相关

```javascript
// 登录
API.login(phone, password)

// 注册
API.register(phone, password, nickname)

// 退出
API.logout()
```

### 角色相关

```javascript
// 获取角色列表
API.getCompanions()

// 创建角色
API.createCompanion(data)

// 获取角色详情
API.getCompanion(id)
```

### 对话相关

```javascript
// 发送消息
API.sendMessage(message, companionId, includeVoice)

// 获取对话历史
API.getConversation(conversationId)

// 获取对话列表
API.getConversations(companionId, page, pageSize)
```

完整API文档请参考 `utils/api.js`

## 注意事项

### 安全性

- 所有敏感数据通过HTTPS传输
- Token自动管理和刷新
- 密码前端不存储
- 登录状态本地加密存储

### 性能优化

- 消息列表虚拟滚动
- 图片懒加载
- 接口请求防抖
- 本地缓存用户信息

### 兼容性

- 支持微信版本：7.0.0+
- 基础库版本：2.32.0+
- 支持机型：iOS和Android

## 部署上线

### 1. 小程序审核前准备

- [ ] 配置服务器域名（必须HTTPS）
- [ ] 完善用户协议和隐私政策
- [ ] 准备小程序图标和截图
- [ ] 填写小程序基本信息
- [ ] 配置服务类目

### 2. 提交审核

1. 在微信开发者工具中点击"上传"
2. 填写版本号和描述
3. 登录小程序后台
4. 提交审核
5. 等待审核通过（一般1-3天）

### 3. 发布上线

审核通过后，在小程序后台点击"发布"即可上线

## 常见问题

### Q: 无法登录或请求失败？

A: 检查以下几点：
- 后端API服务是否正常运行
- `app.js` 中的 `apiBaseUrl` 是否正确
- 开发工具是否勾选"不校验合法域名"
- 网络连接是否正常

### Q: 如何使用真机调试？

A:
1. 点击开发者工具中的"预览"
2. 用微信扫描二维码
3. 确保手机和电脑在同一网络
4. 或使用内网穿透工具

### Q: 如何更换API地址？

A: 修改 `app.js` 中的 `globalData.apiBaseUrl`

## 后续计划

- [ ] 语音输入功能
- [ ] 语音合成（TTS）
- [ ] 图片分享
- [ ] 关怀提醒
- [ ] 回忆录生成
- [ ] 数据统计

## 相关链接

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [后端API文档](../README.md)
- [项目架构说明](../PROJECT_SUMMARY.md)

## 开源协议

MIT License

---

**永伴，用科技陪伴人类走过孤独时光** ❤️
