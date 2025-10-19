# BERTopic Analysis Tool

一个基于BERTopic的主题模型分析网页工具，支持中英文双语界面。

## 功能特性

- 📊 **主题分析**：使用BERTopic进行主题建模
- 🌐 **多语言支持**：中英文界面切换
- 📁 **文件上传**：支持Excel、Word、PDF、TXT等格式
- 🎨 **可视化**：多种图表展示分析结果
- 📤 **导出功能**：支持Excel、PDF、ZIP格式导出
- ⚙️ **参数配置**：可自定义分析参数

## 技术栈

- **前端**：React + Material-UI + Plotly.js
- **后端**：Flask + BERTopic + SentenceTransformers
- **部署**：Vercel (前端) + Railway (后端)

## 快速开始

### 本地运行

1. **安装依赖**
```bash
# 后端
pip install -r requirements.txt

# 前端
cd frontend
npm install
```

2. **启动服务**
```bash
# 后端
python backend/app.py

# 前端
cd frontend
npm start
```

3. **访问应用**
- 前端：http://localhost:3000
- 后端：http://localhost:5001

## 部署

### Railway + Vercel 部署

1. **后端部署到Railway**
   - 连接GitHub仓库
   - 自动部署Python应用

2. **前端部署到Vercel**
   - 选择frontend目录
   - 设置环境变量：`REACT_APP_API_URL`

## 使用说明

1. **上传文件**：选择包含文本数据的文件
2. **数据预处理**：配置停用词和文本清洗选项
3. **参数配置**：设置BERTopic分析参数
4. **开始分析**：运行主题分析
5. **查看结果**：浏览可视化结果
6. **导出数据**：下载分析结果

## 许可证

MIT License