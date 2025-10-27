#!/bin/bash

# 永伴 AI - ngrok 快速部署脚本
# 使用方法：bash deploy_ngrok.sh

set -e

echo "🚀 永伴 AI - ngrok 部署助手"
echo "================================"
echo ""

# 检查 ngrok 是否安装
if ! command -v ngrok &> /dev/null; then
    echo "❌ 错误：未检测到 ngrok"
    echo "请先安装 ngrok："
    echo "  brew install ngrok/ngrok/ngrok"
    echo "  或访问：https://ngrok.com/download"
    exit 1
fi

# 检查服务是否运行
echo "📋 检查服务状态..."
cd "$(dirname "$0")"

if ! docker-compose ps | grep -q "Up"; then
    echo "⚠️  警告：部分服务未运行"
    echo "正在启动所有服务..."
    docker-compose up -d
    echo "⏳ 等待服务启动（30秒）..."
    sleep 30
fi

echo "✅ 服务运行正常"
echo ""

# 启动后端隧道（后台运行）
echo "🌐 启动后端 ngrok 隧道（端口 8000）..."
ngrok http 8000 --log=stdout > /tmp/ngrok_backend.log 2>&1 &
BACKEND_PID=$!
echo "   后端隧道 PID: $BACKEND_PID"

# 等待后端隧道建立
echo "⏳ 等待后端隧道建立..."
sleep 5

# 获取后端 URL
BACKEND_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -1)

if [ -z "$BACKEND_URL" ]; then
    echo "❌ 错误：无法获取后端 ngrok URL"
    echo "   请检查 ngrok 是否正常运行"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo "✅ 后端隧道已建立"
echo "   后端 URL: $BACKEND_URL"
echo ""

# 更新前端配置
echo "📝 更新前端 API 配置..."
FRONTEND_JS="frontend/js/app.js"

# 备份原文件
cp "$FRONTEND_JS" "${FRONTEND_JS}.backup"

# 替换 BACKEND_URL
sed -i.tmp "s|const BACKEND_URL = .*|const BACKEND_URL = '$BACKEND_URL';  // 自动生成 - $(date)|" "$FRONTEND_JS"
rm -f "${FRONTEND_JS}.tmp"

echo "✅ 前端配置已更新"
echo ""

# 启动前端隧道（前台运行，方便查看日志）
echo "🌐 启动前端 ngrok 隧道（端口 8080）..."
echo ""
echo "================================"
echo "📱 部署完成！"
echo "================================"
echo ""
echo "后端 API: $BACKEND_URL"
echo "前端界面: 启动中... 请等待下方显示的 URL"
echo ""
echo "💡 提示："
echo "  - 复制下方的前端 URL 分享给他人"
echo "  - 按 Ctrl+C 停止隧道"
echo "  - 停止后会自动恢复前端配置"
echo ""
echo "================================"
echo ""

# 捕获退出信号，清理资源
cleanup() {
    echo ""
    echo "🧹 清理中..."

    # 恢复前端配置
    if [ -f "${FRONTEND_JS}.backup" ]; then
        mv "${FRONTEND_JS}.backup" "$FRONTEND_JS"
        echo "✅ 前端配置已恢复"
    fi

    # 停止后端隧道
    kill $BACKEND_PID 2>/dev/null || true
    echo "✅ 后端隧道已停止"

    echo "👋 再见！"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 启动前端隧道（前台运行）
ngrok http 8080
