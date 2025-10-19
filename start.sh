#!/bin/bash

# BERTopic主题模型分析工具启动脚本

echo "🚀 启动BERTopic主题模型分析工具..."

# 检查虚拟环境
if [ ! -d "venv_new" ]; then
    echo "❌ 错误: 虚拟环境不存在，请先运行 ./install.sh"
    exit 1
fi

# 激活虚拟环境
source venv_new/bin/activate

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "❌ 错误: 前端依赖未安装，请先运行 ./install.sh"
    exit 1
fi

# 启动后端服务
echo "🔧 启动后端服务..."
python backend/app.py &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务
echo "🎨 启动前端服务..."
cd frontend
npm start &
FRONTEND_PID=$!

echo "✅ 服务启动完成！"
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:5001"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# 保持脚本运行
wait
