#!/bin/bash

# BERTopic主题模型分析工具启动脚本

echo "🚀 启动BERTopic主题模型分析工具..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到Python3，请先安装Python3"
    exit 1
fi

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

echo "✅ 环境检查通过"

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "📦 创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 安装Python依赖
echo "📥 安装Python依赖..."
pip install -r requirements.txt

# 安装Node.js依赖
echo "📥 安装Node.js依赖..."
cd frontend
npm install
cd ..

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p backend/uploads
mkdir -p backend/data
mkdir -p backend/logs

echo "🎉 安装完成！"
echo ""
echo "启动说明："
echo "1. 启动后端服务: python backend/app.py"
echo "2. 启动前端服务: cd frontend && npm start"
echo "3. 访问: http://localhost:3000"
echo ""
echo "或者运行: ./start.sh 自动启动所有服务"
