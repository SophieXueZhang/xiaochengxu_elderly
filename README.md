# 永伴 - AI情感陪伴系统

> 专注于中老年群体的AI情感陪伴产品，用科技温暖孤独时光

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com/)

## 项目简介

永伴是一款面向中老年群体的AI情感陪伴产品，通过AI技术复刻"熟悉的人"，为用户提供长期的情感陪伴和心理慰藉。

### 核心功能

- **自定义陪伴角色**: 上传照片、音频，创建个性化AI陪伴角色
- **智能对话**: 基于GPT-4的自然对话，理解情感、提供陪伴
- **长期记忆**: 记住用户的习惯、喜好和重要事件
- **主动关怀**: 定时问候、健康提醒、节日祝福
- **语音交互**: 语音对话、声音克隆（未来支持）
- **回忆录**: 自动生成对话日记和美好回忆

### 技术亮点

- 🚀 FastAPI高性能异步框架
- 🤖 OpenAI GPT-4对话生成
- 🎨 Stable Diffusion图像生成
- 🗣️ ElevenLabs语音合成
- 🧠 Qdrant向量数据库 + 长期记忆
- 📦 Docker一键部署
- 📱 微信小程序原生开发

## 项目组成

本项目包含两个主要部分：

### 1. 后端API服务 (backend/)

基于FastAPI的RESTful API服务，提供所有核心功能的接口支持。

### 2. 微信小程序 (miniprogram/)

**✨ 新增：微信小程序版本已完成！**

专为中老年用户设计的微信小程序客户端，具有以下特点：

- 📱 **原生小程序开发**: 流畅的用户体验
- 👴 **老年友好设计**: 大字体、高对比度、简洁界面
- 💬 **完整功能支持**: 登录、角色管理、智能对话
- 🎯 **易于操作**: 符合老年用户使用习惯

快速开始微信小程序开发，请查看 [miniprogram/README.md](./miniprogram/README.md)

### 3. Web前端 (frontend/)

简单的Web界面（可选），用于演示和测试。

## 快速开始

### 前置要求

- Docker & Docker Compose
- Python 3.11+ (开发环境)
- OpenAI API Key
- Stability AI API Key (可选)
- ElevenLabs API Key (可选)

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd yongban
```

2. **配置环境变量**

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必要的API密钥：

```bash
# 必填项
OPENAI_API_KEY=sk-your-openai-api-key-here
SECRET_KEY=your-secret-key-min-32-chars

# 数据库密码（建议修改）
POSTGRES_PASSWORD=your_postgres_password
MINIO_SECRET_KEY=your_minio_password

# 可选项（图像、语音功能）
STABILITY_API_KEY=sk-your-stability-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

3. **启动服务**

```bash
docker-compose up -d
```

服务启动后，可访问：

- **前端界面**: http://localhost:8080 ⭐️ (老年人友好界面)
- API文档: http://localhost:8000/docs
- MinIO控制台: http://localhost:9001
- Qdrant控制台: http://localhost:6333/dashboard

4. **初始化数据库**

数据库会自动初始化（通过 docker-entrypoint），包含示例数据。

### 开发模式

```bash
# 安装依赖
cd backend
pip install -r requirements.txt

# 运行开发服务器
uvicorn app.main:app --reload --port 8000
```

## API使用指南

### 1. 用户注册

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "password123",
    "nickname": "张阿姨"
  }'
```

响应:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {...},
    "tokens": {
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "token_type": "bearer",
      "expires_in": 86400
    }
  }
}
```

### 2. 用户登录

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "password123"
  }'
```

### 3. 创建陪伴角色

```bash
curl -X POST http://localhost:8000/api/v1/companions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "妈妈",
    "relationship": "parent",
    "gender": "female",
    "background_story": "一位慈爱的母亲，生前最爱做饭...",
    "personality": {
      "traits": ["caring", "patient", "warm"],
      "tone": "gentle"
    }
  }'
```

### 4. 开始对话

```bash
curl -X POST http://localhost:8000/api/v1/conversations/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "message": "妈妈，我今天有点累",
    "companion_id": 1,
    "include_voice": false
  }'
```

响应:
```json
{
  "success": true,
  "message": "对话成功",
  "data": {
    "conversation_id": 1,
    "user_message": {...},
    "assistant_message": {
      "id": 2,
      "content": "孩子，是不是工作太忙了？要注意休息啊...",
      "emotion": "caring",
      "created_at": "2025-10-24T10:00:00Z"
    }
  }
}
```

### 5. 获取对话历史

```bash
curl -X GET http://localhost:8000/api/v1/conversations/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

完整API文档请访问: http://localhost:8000/docs

## 项目结构

```
yongban/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── api/               # API路由
│   │   │   └── v1/
│   │   │       ├── auth.py    # 认证API
│   │   │       ├── users.py   # 用户API
│   │   │       ├── companions.py  # 角色API
│   │   │       └── conversations.py  # 对话API
│   │   ├── core/              # 核心配置
│   │   │   ├── config.py      # 应用配置
│   │   │   ├── database.py    # 数据库连接
│   │   │   └── security.py    # 安全认证
│   │   ├── models/            # 数据模型
│   │   │   ├── user.py
│   │   │   ├── companion.py
│   │   │   ├── conversation.py
│   │   │   ├── memory.py
│   │   │   ├── care.py
│   │   │   └── media.py
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # 业务服务
│   │   │   └── ai_service.py  # AI服务集成
│   │   ├── tasks/             # Celery任务
│   │   └── main.py            # 应用入口
│   ├── requirements.txt       # Python依赖
│   └── Dockerfile
├── miniprogram/              # 微信小程序 ✨
│   ├── pages/               # 小程序页面
│   │   ├── login/          # 登录页
│   │   ├── register/       # 注册页
│   │   ├── companions/     # 角色列表页
│   │   ├── create-companion/ # 创建角色页
│   │   └── chat/           # 聊天对话页
│   ├── utils/              # 工具类
│   │   ├── api.js          # API接口封装
│   │   └── util.js         # 通用工具
│   ├── images/             # 图片资源
│   ├── app.js              # 小程序入口
│   ├── app.json            # 小程序配置
│   ├── app.wxss            # 全局样式
│   └── README.md           # 小程序文档
├── database/                  # 数据库
│   ├── schema.sql            # 数据库结构
│   └── seed_data.sql         # 测试数据
├── docs/                     # 文档
├── frontend/                 # Web前端
├── scripts/                  # 工具脚本
├── docker-compose.yml        # Docker编排
├── .env.example             # 环境变量示例
└── README.md
```

## 架构设计

详细架构设计请参考: [YONGBAN_ARCHITECTURE.md](./YONGBAN_ARCHITECTURE.md)

```
┌─────────────────────────────────────┐
│         客户端层                      │
│  微信小程序 / Web应用 / 移动APP        │
└──────────────┬──────────────────────┘
               │ HTTPS/WSS
┌──────────────┴──────────────────────┐
│         API网关层 (FastAPI)          │
│  认证/鉴权 | 限流 | 负载均衡           │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│         应用服务层                    │
│  用户 | 角色 | 对话 | 记忆 | 关怀     │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│         AI服务层                      │
│  GPT-4 | SD | TTS | Embedding       │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│         数据层                        │
│  PostgreSQL | Qdrant | Redis | MinIO│
└─────────────────────────────────────┘
```

## 数据库设计

核心表结构：

- **users**: 用户信息和订阅状态
- **companions**: 陪伴角色配置
- **conversations**: 对话会话
- **messages**: 消息记录
- **memories**: 长期记忆
- **care_schedules**: 关怀计划
- **media_assets**: 媒体资源

详细schema见: [database/schema.sql](./database/schema.sql)

## 功能路线图

### ✅ MVP (已完成)

- [x] 用户注册/登录系统
- [x] 陪伴角色创建与管理
- [x] 基于GPT-4的智能对话
- [x] 基础记忆系统
- [x] RESTful API
- [x] Docker部署

### 🚧 Phase 2 (进行中)

- [ ] 向量记忆检索（Qdrant集成）
- [ ] 语音合成（TTS）
- [ ] 图像生成（头像定制）
- [ ] 主动关怀系统
- [ ] WebSocket实时对话

### 📋 Phase 3 (计划中)

- [ ] 语音识别（STT）
- [ ] 声音克隆
- [ ] 回忆录生成
- [ ] 订阅支付系统
- [ ] 微信小程序前端
- [ ] 数据分析面板

### 🔮 Future

- [ ] 多模态对话（图片、视频）
- [ ] 情绪识别
- [ ] 社交功能
- [ ] 硬件设备集成
- [ ] 多语言支持

## 配置说明

### 环境变量

详细配置说明请参考 `.env.example`

关键配置项：

| 配置项 | 说明 | 必填 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI API密钥 | ✅ |
| `SECRET_KEY` | JWT加密密钥（32位以上） | ✅ |
| `POSTGRES_PASSWORD` | 数据库密码 | ✅ |
| `STABILITY_API_KEY` | 图像生成API | ❌ |
| `ELEVENLABS_API_KEY` | 语音合成API | ❌ |

### 业务配置

```python
MAX_FREE_MESSAGES_PER_DAY = 20      # 免费用户每日消息限额
MAX_PREMIUM_MESSAGES_PER_DAY = 500  # 付费用户每日消息限额
MAX_COMPANIONS_FREE = 1             # 免费用户最大角色数
MAX_COMPANIONS_PREMIUM = 5          # 付费用户最大角色数
```

## 性能优化

- **缓存策略**: Redis缓存用户信息和对话上下文
- **异步处理**: Celery处理图像生成、语音合成等耗时任务
- **数据库优化**: 索引优化、分页查询
- **连接池**: PostgreSQL、Redis连接池管理

## 安全性

- **密码加密**: bcrypt哈希
- **JWT认证**: 访问令牌 + 刷新令牌
- **数据隔离**: 用户数据严格隔离
- **输入验证**: Pydantic数据验证
- **SQL注入防护**: SQLAlchemy ORM
- **敏感数据**: 环境变量管理

## 监控与日志

- 日志文件: `logs/yongban.log`
- 日志级别: DEBUG/INFO/WARNING/ERROR
- 监控端点: `/health` (健康检查)

## 成本估算

### AI服务成本（每用户/月）

| 服务 | 成本 |
|------|------|
| GPT-4对话 | ¥15-35 |
| 图像生成 | ¥3-7 |
| 语音合成 | ¥7-15 |
| 语音识别 | ¥3-7 |
| **总计** | **¥28-64** |

### 基础设施成本

- 云服务器: ¥350-1400/月
- 数据库: ¥210-700/月
- 对象存储: ¥70-350/月
- CDN: ¥140-560/月

### 盈利模型

- 订阅价格: ¥49-69/月
- 毛利率: 40-60%
- 盈亏平衡: 1000+付费用户

## 故障排查

### 问题1: 数据库连接失败

```bash
# 检查数据库状态
docker-compose logs db

# 重启数据库
docker-compose restart db
```

### 问题2: OpenAI API调用失败

- 检查API Key是否正确
- 检查余额是否充足
- 查看日志: `logs/yongban.log`

### 问题3: Docker启动失败

```bash
# 查看所有容器状态
docker-compose ps

# 查看特定容器日志
docker-compose logs backend

# 重新构建
docker-compose up -d --build
```

## 贡献指南

欢迎贡献代码、报告问题、提出建议！

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目主页: [GitHub](https://github.com/your-username/yongban)
- 问题反馈: [Issues](https://github.com/your-username/yongban/issues)
- 邮箱: support@yongban.ai

## 致谢

- [FastAPI](https://fastapi.tiangolo.com/) - 现代化的Python Web框架
- [OpenAI](https://openai.com/) - GPT-4 API
- [Stability AI](https://stability.ai/) - Stable Diffusion
- [ElevenLabs](https://elevenlabs.io/) - 语音合成
- [Qdrant](https://qdrant.tech/) - 向量数据库

---

**永伴，用科技陪伴人类走过孤独时光** ❤️
