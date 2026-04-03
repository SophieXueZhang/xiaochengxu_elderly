# 永伴小程序 - 完整部署指南

## 📋 目录

1. [系统架构](#系统架构)
2. [环境准备](#环境准备)
3. [后端部署](#后端部署)
4. [小程序部署](#小程序部署)
5. [生产环境配置](#生产环境配置)
6. [监控和维护](#监控和维护)
7. [常见问题](#常见问题)

## 系统架构

```
┌─────────────────────────────────────────┐
│         用户层                           │
│    微信小程序客户端（移动端）              │
└──────────────┬──────────────────────────┘
               │ HTTPS
┌──────────────┴──────────────────────────┐
│         Nginx反向代理                     │
│      SSL证书 + 负载均衡                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│      FastAPI后端服务                      │
│   - 用户认证                              │
│   - 对话管理                              │
│   - 媒体处理                              │
│   - AI集成                                │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│         数据存储层                        │
│  - PostgreSQL（结构化数据）               │
│  - MinIO（媒体文件）                      │
│  - Redis（缓存）                         │
│  - Qdrant（向量数据库）                   │
└──────────────────────────────────────────┘
```

## 环境准备

### 1. 服务器要求

**最低配置（测试环境）：**
- CPU: 2核
- 内存: 4GB
- 硬盘: 50GB SSD
- 带宽: 5Mbps

**推荐配置（生产环境）：**
- CPU: 4核
- 内存: 8GB
- 硬盘: 100GB SSD
- 带宽: 10Mbps+

**操作系统：**
- Ubuntu 20.04/22.04 LTS
- CentOS 7/8
- Debian 10/11

### 2. 必需软件

```bash
# Docker和Docker Compose
curl -fsSL https://get.docker.com | bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Nginx
sudo apt install nginx

# Certbot (SSL证书)
sudo apt install certbot python3-certbot-nginx

# Git
sudo apt install git
```

### 3. 域名和SSL证书

```bash
# 申请免费SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 后端部署

### 1. 克隆代码

```bash
# 克隆仓库
git clone https://github.com/your-repo/xiaochengxu_elderly.git
cd xiaochengxu_elderly

# 切换到生产分支
git checkout production  # 或main
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**关键配置：**

```bash
# 数据库
POSTGRES_USER=yongban
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=yongban
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# MinIO (对象存储)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_minio_password
MINIO_ENDPOINT=minio:9000
MINIO_BUCKET=yongban-media

# 应用配置
SECRET_KEY=your-very-long-secret-key-at-least-32-characters
DEBUG=false
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# AI服务
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_BASE_URL=https://api.openai.com/v1  # 可选代理

# 可选服务
STABILITY_API_KEY=sk-your-stability-key
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
```

### 4. 初始化数据库

```bash
# 进入backend容器
docker-compose exec backend bash

# 运行数据库迁移
alembic upgrade head

# 创建测试数据（可选）
python scripts/seed_data.py

# 退出容器
exit
```

### 5. 配置Nginx

```nginx
# /etc/nginx/sites-available/yongban

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL证书
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 日志
    access_log /var/log/nginx/yongban_access.log;
    error_log /var/log/nginx/yongban_error.log;

    # API代理
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 媒体文件（静态资源）
    location /media/ {
        proxy_pass http://localhost:9000/yongban-media/;
        proxy_set_header Host $host;

        # 缓存设置
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:8000/health;
        access_log off;
    }

    # 文件上传大小限制
    client_max_body_size 50M;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/yongban /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

## 小程序部署

### 1. 配置API地址

编辑 `miniprogram/app.js`：

```javascript
globalData: {
  // 生产环境API地址
  apiBaseUrl: 'https://your-domain.com/api/v1',
  // ...
}
```

### 2. 微信公众平台配置

登录 [微信公众平台](https://mp.weixin.qq.com/)：

**a) 配置服务器域名**

开发 → 开发管理 → 开发设置 → 服务器域名：

```
request合法域名：
- https://your-domain.com

uploadFile合法域名：
- https://your-domain.com

downloadFile合法域名：
- https://your-domain.com
```

**b) 配置业务域名（可选）**

设置 → 第三方设置 → 业务域名：
- https://your-domain.com

### 3. 上传代码

**使用微信开发者工具：**

1. 打开微信开发者工具
2. 导入 `miniprogram` 目录
3. 填入AppID
4. 点击"上传"
5. 填写版本号和描述
6. 上传成功

### 4. 提交审核

登录微信公众平台：

1. 版本管理 → 开发版本
2. 点击"提交审核"
3. 填写审核信息：
   - 服务类目：生活服务 - 综合生活服务平台
   - 标签：老年关怀、AI陪伴
4. 提交并等待审核（1-3天）

### 5. 发布上线

审核通过后：
1. 版本管理 → 审核版本
2. 点击"发布"
3. 确认发布

## 生产环境配置

### 1. 数据库优化

```sql
-- PostgreSQL优化配置
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET work_mem = '16MB';

-- 重启数据库
docker-compose restart db
```

### 2. Redis配置

```bash
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 3. MinIO配置

```bash
# 启用HTTPS
mc alias set myminio https://minio.your-domain.com ACCESS_KEY SECRET_KEY

# 设置公共策略（仅媒体文件）
mc anonymous set download myminio/yongban-media

# 设置生命周期（自动删除旧文件）
mc ilm add --expiry-days 90 myminio/yongban-media
```

### 4. 备份策略

```bash
#!/bin/bash
# backup.sh - 每日备份脚本

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d)

# 备份PostgreSQL
docker-compose exec -T db pg_dump -U yongban yongban > $BACKUP_DIR/db_$DATE.sql

# 备份MinIO
mc mirror myminio/yongban-media $BACKUP_DIR/media_$DATE/

# 保留30天的备份
find $BACKUP_DIR -type f -mtime +30 -delete

# 上传到云存储（可选）
# rclone copy $BACKUP_DIR remote:backup/
```

设置定时任务：

```bash
# crontab -e
0 2 * * * /path/to/backup.sh
```

## 监控和维护

### 1. 日志查看

```bash
# 实时查看日志
docker-compose logs -f backend

# 查看最近100行
docker-compose logs --tail=100 backend

# 查看错误日志
docker-compose logs backend | grep ERROR
```

### 2. 性能监控

```bash
# Docker stats
docker stats

# 查看容器资源使用
docker-compose exec backend ps aux

# 查看数据库连接
docker-compose exec db psql -U yongban -c "SELECT count(*) FROM pg_stat_activity;"
```

### 3. 健康检查

```bash
# API健康检查
curl https://your-domain.com/health

# 数据库健康检查
docker-compose exec db pg_isready -U yongban
```

### 4. 更新部署

```bash
# 拉取最新代码
git pull origin production

# 重新构建
docker-compose down
docker-compose up -d --build

# 数据库迁移
docker-compose exec backend alembic upgrade head
```

## 常见问题

### Q1: 视频上传失败

**检查：**
```bash
# 1. Nginx上传限制
grep client_max_body_size /etc/nginx/sites-enabled/yongban

# 2. MinIO存储空间
df -h

# 3. 后端日志
docker-compose logs backend | grep upload
```

### Q2: API请求超时

**解决：**
```nginx
# Nginx超时配置
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;
```

### Q3: 数据库连接过多

**解决：**
```python
# backend/app/core/database.py
engine = create_engine(
    DATABASE_URL,
    pool_size=10,          # 降低连接池大小
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

### Q4: MinIO文件无法访问

**检查：**
```bash
# 1. MinIO服务状态
docker-compose ps minio

# 2. 桶策略
mc anonymous list myminio/yongban-media

# 3. Nginx代理配置
nginx -t
```

## 安全建议

### 1. 防火墙配置

```bash
# UFW防火墙
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. 定期更新

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 更新Docker镜像
docker-compose pull
docker-compose up -d
```

### 3. 密钥管理

- 使用强密码（至少16位）
- 定期更换SECRET_KEY
- 不在代码中硬编码密钥
- 使用环境变量或密钥管理服务

### 4. 限流保护

```nginx
# Nginx限流配置
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ...
}
```

## 性能优化

### 1. CDN配置

使用CDN加速媒体文件：
- 七牛云
- 腾讯云CDN
- 阿里云CDN

### 2. 数据库索引

```sql
-- 常用查询索引
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_companions_user ON companions(user_id);
```

### 3. Redis缓存

```python
# 缓存用户信息
@cache(ttl=3600)
def get_user_profile(user_id):
    return db.query(User).get(user_id)
```

## 总结

完成以上步骤后，您的"永伴"小程序就可以在生产环境稳定运行了！

**检查清单：**
- [ ] 服务器配置完成
- [ ] 域名和SSL证书配置
- [ ] 后端服务正常运行
- [ ] 数据库初始化完成
- [ ] Nginx配置正确
- [ ] 小程序代码上传
- [ ] 微信审核通过
- [ ] 备份策略启用
- [ ] 监控系统就绪

如有问题，请查看日志或联系技术支持。

---

**祝部署顺利！** 🚀
