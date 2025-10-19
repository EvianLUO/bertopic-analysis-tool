from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import tempfile
import json
from datetime import datetime
import traceback
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

# 导入BERTopic相关模块
from models.bertopic_analyzer import BERTopicAnalyzer
from utils.file_processor import FileProcessor
from utils.stopwords_manager import StopwordsManager

# 初始化组件
file_processor = FileProcessor()
stopwords_manager = StopwordsManager()
bertopic_analyzer = BERTopicAnalyzer()

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
        
        # 保存文件（不删除，供后续分析使用）
        filename = file.filename
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # 处理文件获取预览信息
        result = file_processor.process_file(file_path)
        
        # 添加文件路径信息
        result['file_path'] = filename
        result['file_type'] = result.get('file_type', 'excel')
        
        logger.info(f"文件上传成功: {filename}, 总行数: {result.get('total_rows', 0)}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"文件上传错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': f'文件处理失败: {str(e)}'}), 500

@app.route('/api/stopwords', methods=['GET'])
def get_stopwords():
    """获取停用词"""
    try:
        stopwords = stopwords_manager.get_all_stopwords()
        return jsonify(stopwords)
    except Exception as e:
        logger.error(f"获取停用词错误: {str(e)}")
        return jsonify({'error': f'获取停用词失败: {str(e)}'}), 500

@app.route('/api/stopwords', methods=['POST'])
def update_stopwords():
    """更新停用词"""
    try:
        data = request.get_json()
        stopwords_manager.update_stopwords(data)
        return jsonify({'message': '停用词更新成功'})
    except Exception as e:
        logger.error(f"更新停用词错误: {str(e)}")
        return jsonify({'error': f'更新停用词失败: {str(e)}'}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_topics():
    """BERTopic分析接口"""
    try:
        data = request.get_json()
        
        # 验证必要参数
        required_fields = ['file_path', 'text_column', 'config']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'缺少必要参数: {field}'}), 400
        
        # 重新上传文件进行处理（临时解决方案）
        # 在实际应用中，应该保存文件路径或使用文件ID
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], data['file_path'])
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            return jsonify({'error': '文件不存在，请重新上传'}), 400
        
        # 提取完整文本数据
        text_data = file_processor.extract_texts_from_data(
            file_path=file_path,
            text_column=data['text_column'],
            timestamp_column=data.get('timestamp_column'),
            file_type=data.get('file_type', 'excel')
        )
        
        logger.info(f"开始分析 {text_data['total_documents']} 个文档")
        
        # 执行分析
        result = bertopic_analyzer.analyze(
            texts=text_data['texts'],
            config=data['config'],
            timestamps=text_data.get('timestamps'),
            visualization_options=data.get('visualization_options', []),
            preprocessing_config=data.get('preprocessing_config', {}),
            stopwords=data.get('stopwords', {})
        )
        
        # 添加文档统计信息
        result['document_stats'] = {
            'total_documents': text_data['total_documents'],
            'total_rows': text_data['total_rows'],
            'processed_documents': len(text_data['texts'])
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"BERTopic分析错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': f'分析失败: {str(e)}'}), 500

@app.route('/api/export/<export_type>', methods=['POST'])
def export_results(export_type):
    """导出结果接口"""
    try:
        data = request.get_json()
        
        if export_type == 'visualizations':
            # 导出所有可视化结果
            result = bertopic_analyzer.export_visualizations(data)
            return send_file(
                result['file_path'],
                as_attachment=True,
                download_name=result['filename']
            )
        
        elif export_type == 'annotated_data':
            # 导出带标注的数据
            result = bertopic_analyzer.export_annotated_data(data)
            return send_file(
                result['file_path'],
                as_attachment=True,
                download_name=result['filename']
            )
        
        elif export_type == 'topic_details':
            # 导出主题详情
            result = bertopic_analyzer.export_topic_details(data)
            return send_file(
                result['file_path'],
                as_attachment=True,
                download_name=result['filename']
            )
        
        else:
            return jsonify({'error': '不支持的导出类型'}), 400
            
    except Exception as e:
        logger.error(f"导出错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': f'导出失败: {str(e)}'}), 500

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
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=False, host='0.0.0.0', port=port)
