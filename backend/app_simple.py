from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
import tempfile
import json
from datetime import datetime
import logging

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 配置
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB
app.config['UPLOAD_FOLDER'] = 'uploads'

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """文件上传接口"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件被上传'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        # 保存文件
        filename = file.filename
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # 处理文件
        result = process_file(file_path)
        
        # 清理临时文件
        os.remove(file_path)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"文件上传错误: {str(e)}")
        return jsonify({'error': f'文件处理失败: {str(e)}'}), 500

def process_file(file_path):
    """处理上传的文件"""
    try:
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext in ['.xlsx', '.xls']:
            return process_excel(file_path)
        elif file_ext == '.docx':
            return process_word(file_path)
        else:
            raise ValueError(f"不支持的文件格式: {file_ext}")
            
    except Exception as e:
        logger.error(f"文件处理错误: {str(e)}")
        raise

def process_excel(file_path):
    """处理Excel文件"""
    try:
        # 读取Excel文件
        df = pd.read_excel(file_path)
        
        # 获取列名
        columns = df.columns.tolist()
        
        # 获取前10行数据预览
        preview_data = df.head(10).to_dict('records')
        
        return {
            'success': True,
            'columns': columns,
            'preview': preview_data,
            'total_rows': len(df),
            'file_type': 'excel'
        }
        
    except Exception as e:
        logger.error(f"Excel文件处理错误: {str(e)}")
        raise

def process_word(file_path):
    """处理Word文件"""
    try:
        from docx import Document
        doc = Document(file_path)
        
        # 提取所有段落文本
        texts = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                texts.append(paragraph.text.strip())
        
        # 创建DataFrame
        df = pd.DataFrame({
            'text': texts,
            'paragraph_id': range(len(texts))
        })
        
        # 获取列名
        columns = df.columns.tolist()
        
        # 获取前10行数据预览
        preview_data = df.head(10).to_dict('records')
        
        return {
            'success': True,
            'columns': columns,
            'preview': preview_data,
            'total_rows': len(df),
            'file_type': 'word'
        }
        
    except Exception as e:
        logger.error(f"Word文件处理错误: {str(e)}")
        raise

@app.route('/api/stopwords', methods=['GET'])
def get_stopwords():
    """获取停用词"""
    try:
        stopwords = {
            'chinese': [
                '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'
            ],
            'english': [
                'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once'
            ],
            'custom': []
        }
        return jsonify(stopwords)
    except Exception as e:
        logger.error(f"获取停用词错误: {str(e)}")
        return jsonify({'error': f'获取停用词失败: {str(e)}'}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_topics():
    """BERTopic分析接口（模拟版本）"""
    try:
        data = request.get_json()
        
        # 验证必要参数
        required_fields = ['texts', 'config']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'缺少必要参数: {field}'}), 400
        
        # 模拟分析结果
        texts = data['texts']
        num_topics = min(5, len(texts) // 10)  # 简单的主题数量估算
        
        # 生成模拟结果
        topics = [i % num_topics for i in range(len(texts))]
        topic_info = []
        
        for i in range(num_topics):
            topic_info.append({
                'Topic': i,
                'Count': topics.count(i),
                'Name': f'主题_{i}',
                'Representation': f'关键词_{i}_1, 关键词_{i}_2, 关键词_{i}_3'
            })
        
        # 添加噪声主题
        topic_info.append({
            'Topic': -1,
            'Count': topics.count(-1),
            'Name': '噪声',
            'Representation': '未分类文档'
        })
        
        result = {
            'success': True,
            'topics': topics,
            'probabilities': None,
            'topic_info': topic_info,
            'visualizations': {},
            'model_info': {
                'num_topics': num_topics,
                'num_documents': len(texts),
                'num_noise': topics.count(-1)
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"分析错误: {str(e)}")
        return jsonify({'error': f'分析失败: {str(e)}'}), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': '文件大小超出限制(50MB)'}), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': '接口不存在'}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': '服务器内部错误'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
