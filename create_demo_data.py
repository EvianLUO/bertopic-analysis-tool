import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# 创建演示数据
np.random.seed(42)
random.seed(42)

# 主题关键词
topics_keywords = {
    '教育': ['学校', '学生', '老师', '课程', '学习', '教育', '教学', '知识', '考试', '成绩'],
    '科技': ['技术', '创新', '人工智能', 'AI', '算法', '数据', '软件', '开发', '编程', '互联网'],
    '健康': ['健康', '医疗', '医生', '医院', '治疗', '药物', '疾病', '康复', '保健', '运动'],
    '经济': ['经济', '市场', '投资', '金融', '股票', '企业', '商业', '利润', '成本', '收入'],
    '环境': ['环境', '环保', '污染', '气候', '绿色', '可持续发展', '能源', '清洁', '生态', '保护']
}

# 生成文档
documents = []
timestamps = []

for i in range(200):
    # 随机选择主题
    topic = random.choice(list(topics_keywords.keys()))
    keywords = topics_keywords[topic]
    
    # 生成文档内容
    doc_length = random.randint(50, 200)
    words = []
    
    # 添加主题关键词
    num_keywords = random.randint(3, 8)
    for _ in range(num_keywords):
        words.append(random.choice(keywords))
    
    # 添加一些通用词汇
    common_words = ['的', '是', '在', '有', '和', '就', '不', '人', '都', '一', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']
    for _ in range(doc_length - num_keywords):
        words.append(random.choice(common_words))
    
    # 随机打乱并组合
    random.shuffle(words)
    document = ' '.join(words)
    
    documents.append(document)
    
    # 生成时间戳（过去6个月）
    days_ago = random.randint(0, 180)
    timestamp = datetime.now() - timedelta(days=days_ago)
    timestamps.append(timestamp.strftime('%Y-%m-%d'))

# 创建DataFrame
df = pd.DataFrame({
    'id': range(1, len(documents) + 1),
    'content': documents,
    'timestamp': timestamps,
    'category': [random.choice(['新闻', '评论', '报告', '研究']) for _ in range(len(documents))],
    'source': [random.choice(['网站A', '网站B', '网站C', '网站D']) for _ in range(len(documents))]
})

# 保存为Excel文件
df.to_excel('demo_data.xlsx', index=False)

print(f"✅ 演示数据已生成: demo_data.xlsx")
print(f"📊 包含 {len(documents)} 个文档")
print(f"📅 时间范围: {min(timestamps)} 到 {max(timestamps)}")
print(f"🏷️ 主题类别: {', '.join(topics_keywords.keys())}")
print("")
print("使用说明:")
print("1. 在应用中上传 demo_data.xlsx")
print("2. 选择 'content' 作为文本列")
print("3. 选择 'timestamp' 作为时间戳列（可选）")
print("4. 开始分析")
