# BERTopic 网站部署指南

## 方法一：Railway 部署（推荐）

### 1. 准备工作
1. 访问 [Railway.app](https://railway.app) 并注册账号
2. 连接您的 GitHub 账号

### 2. 部署步骤
1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择您的项目仓库
4. Railway 会自动检测到 Python 项目并开始部署

### 3. 环境变量设置
在 Railway 项目设置中添加以下环境变量：
- `PORT`: Railway 会自动设置
- 其他环境变量根据需要添加

### 4. 访问您的网站
部署完成后，Railway 会提供一个 URL，例如：
`https://your-project-name.up.railway.app`

## 方法二：Vercel + Railway 混合部署

### 后端部署（Railway）
按照方法一的步骤部署后端到 Railway

### 前端部署（Vercel）
1. 访问 [Vercel.com](https://vercel.com) 并注册账号
2. 导入您的项目
3. 设置构建配置：
   - Framework Preset: Create React App
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: build
4. 在环境变量中设置：
   - `REACT_APP_API_URL`: 您的 Railway 后端 URL

## 方法三：本地网络分享

### 使用 ngrok（临时分享）
1. 安装 ngrok: `npm install -g ngrok`
2. 启动您的后端服务
3. 运行: `ngrok http 5001`
4. 将生成的 URL 分享给其他人

## 注意事项
- Railway 免费版有使用限制
- 大文件可能需要使用付费版本
- 建议定期备份数据
