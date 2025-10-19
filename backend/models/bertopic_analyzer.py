import os
import tempfile
import zipfile
import json
import logging
from datetime import datetime
import pandas as pd
import numpy as np
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer
from umap import UMAP
from hdbscan import HDBSCAN
import jieba
import re

logger = logging.getLogger(__name__)

class BERTopicAnalyzer:
    """BERTopic分析器"""
    
    def __init__(self):
        self.topic_model = None
        self.embeddings = None
        self.docs = None
        self.timestamps = None
    
    def analyze(self, texts, config, timestamps=None, visualization_options=None, preprocessing_config=None, stopwords=None):
        """执行BERTopic分析"""
        try:
            self.docs = texts
            self.timestamps = timestamps
            
            # 文本预处理
            processed_texts = self._preprocess_texts(texts, config, preprocessing_config, stopwords)
            
            # 选择embedding模型
            embedding_model = self._select_embedding_model(config)
            
            # 配置UMAP
            umap_model = UMAP(
                n_neighbors=config.get('umap', {}).get('nNeighbors', 15),
                n_components=config.get('umap', {}).get('nComponents', 5),
                min_dist=config.get('umap', {}).get('minDist', 0.0),
                metric=config.get('umap', {}).get('metric', 'cosine')
            )
            
            # 配置HDBSCAN
            hdbscan_model = HDBSCAN(
                min_cluster_size=config.get('hdbscan', {}).get('minClusterSize', 15),
                metric=config.get('hdbscan', {}).get('metric', 'euclidean')
            )
            
            # 创建BERTopic模型
            self.topic_model = BERTopic(
                embedding_model=embedding_model,
                umap_model=umap_model,
                hdbscan_model=hdbscan_model,
                min_topic_size=config.get('basic', {}).get('minTopicSize', 10),
                nr_topics=config.get('advanced', {}).get('nrTopics'),
                top_n_words=config.get('advanced', {}).get('topNWords', 10),
                calculate_probabilities=config.get('advanced', {}).get('calculateProbabilities', False)
            )
            
            # 训练模型
            logger.info(f"开始训练BERTopic模型，文档数量: {len(processed_texts)}")
            topics, probabilities = self.topic_model.fit_transform(processed_texts)
            
            # 记录实际的主题数量
            unique_topics = set(topics)
            logger.info(f"训练完成，实际主题数量: {len(unique_topics)}, 主题列表: {sorted(unique_topics)}")
            logger.info(f"主题分布: {dict(zip(*np.unique(topics, return_counts=True)))}")
            
            # 生成可视化结果
            visualizations = self._generate_visualizations(
                visualization_options or [],
                processed_texts,
                topics,
                probabilities,
                timestamps
            )
            
            return {
                'success': True,
                'texts': texts,  # 返回原始文本
                'topics': topics.tolist() if hasattr(topics, 'tolist') else list(topics),
                'probabilities': probabilities.tolist() if probabilities is not None and hasattr(probabilities, 'tolist') else (list(probabilities) if probabilities is not None else None),
                'topic_info': self.topic_model.get_topic_info().to_dict('records'),
                'visualizations': visualizations,
                'model_info': {
                    'num_topics': len(set(topics)) - (1 if -1 in topics else 0),
                    'num_documents': len(texts),
                    'num_noise': list(topics).count(-1)
                }
            }
            
        except Exception as e:
            logger.error(f"BERTopic分析错误: {str(e)}")
            raise
    
    def _preprocess_texts(self, texts, config, preprocessing_config=None, stopwords=None):
        """文本预处理"""
        processed_texts = []
        
        # 合并配置
        cleaning_config = {}
        if preprocessing_config:
            cleaning_config.update(preprocessing_config)
        if config.get('cleaning'):
            cleaning_config.update(config['cleaning'])
        
        # 获取停用词
        stopwords_list = []
        if stopwords and stopwords.get('final'):
            stopwords_list = stopwords['final']
        
        for text in texts:
            # 基本清理
            if cleaning_config.get('removeNumbers', True):
                text = re.sub(r'\d+', '', text)
            
            if cleaning_config.get('removePunctuation', True):
                text = re.sub(r'[^\w\s]', '', text)
            
            if cleaning_config.get('toLowerCase', True):
                text = text.lower()
            
            # 去除英文字符（中文文档）
            if cleaning_config.get('removeEnglishChars', False):
                text = re.sub(r'[a-zA-Z]', '', text)
            
            # 中文分词
            segmenter = cleaning_config.get('segmenter', 'jieba')
            if segmenter == 'jieba':
                text = ' '.join(jieba.cut(text))
            elif segmenter == 'pkuseg':
                try:
                    import pkuseg
                    seg = pkuseg.pkuseg()
                    text = ' '.join(seg.cut(text))
                except ImportError:
                    logger.warning("pkuseg未安装，使用jieba替代")
                    text = ' '.join(jieba.cut(text))
            elif segmenter == 'thulac':
                try:
                    import thulac
                    thu = thulac.thulac(seg_only=True)
                    text = ' '.join(thu.cut(text))
                except ImportError:
                    logger.warning("thulac未安装，使用jieba替代")
                    text = ' '.join(jieba.cut(text))
            
            # 应用停用词
            if stopwords_list:
                words = text.split()
                words = [word for word in words if word not in stopwords_list]
                text = ' '.join(words)
            
            processed_texts.append(text)
        
        return processed_texts
    
    def _select_embedding_model(self, config):
        """选择embedding模型"""
        # 本地模型路径
        local_model_path = '/Users/eviane/Downloads/all-MiniLM-L6-v2'
        
        # 检查本地模型是否存在
        if os.path.exists(local_model_path):
            try:
                logger.info(f"使用本地模型: {local_model_path}")
                return SentenceTransformer(local_model_path)
            except Exception as e:
                logger.error(f"本地模型加载失败: {str(e)}")
                logger.info("回退到在线模型")
        
        # 根据配置选择模型
        model_name = config.get('basic', {}).get('embeddingModel', 'auto')
        
        if model_name == 'auto':
            # 自动选择多语言模型
            model_name = 'paraphrase-multilingual-MiniLM-L12-v2'
        elif model_name == 'all-MiniLM-L6-v2':
            # 尝试使用本地路径
            if os.path.exists(local_model_path):
                try:
                    return SentenceTransformer(local_model_path)
                except Exception as e:
                    logger.error(f"本地模型加载失败: {str(e)}")
                    logger.info("回退到在线模型")
        
        try:
            logger.info(f"使用在线模型: {model_name}")
            return SentenceTransformer(model_name)
        except Exception as e:
            logger.error(f"模型加载失败: {str(e)}")
            # 最后的回退方案
            logger.info("使用默认多语言模型")
            return SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    
    def _generate_visualizations(self, options, texts, topics, probabilities, timestamps=None):
        """生成可视化结果"""
        visualizations = {}
        
        # 检查主题数量
        unique_topics = set(topics)
        num_topics = len(unique_topics)
        
        logger.info(f"开始生成可视化，主题数量: {num_topics}, 文档数量: {len(texts)}")
        
        for option in options:
            try:
                logger.info(f"正在生成 {option} 可视化...")
                
                if option == 'topics':
                    if num_topics <= 1:
                        visualizations['topics'] = "Cannot generate topic visualization: insufficient topics (need at least 2 topics)"
                        continue
                    
                    try:
                        # 使用标准BERTopic方法
                        fig = self.topic_model.visualize_topics()
                        visualizations['topics'] = {
                            'html': self._fig_to_html(fig),
                            'data': self._fig_to_json(fig)
                        }
                        logger.info("Topic visualization generated successfully")
                    except Exception as e:
                        logger.warning(f"Topic visualization failed: {str(e)}")
                        visualizations['topics'] = f"Topic visualization failed: {str(e)}"
                
                elif option == 'barchart':
                    if num_topics <= 1:
                        visualizations['barchart'] = "Cannot generate bar chart: insufficient topics (need at least 2 topics)"
                        continue
                    
                    try:
                        # 使用标准BERTopic方法
                        fig = self.topic_model.visualize_barchart()
                        visualizations['barchart'] = {
                            'html': self._fig_to_html(fig),
                            'data': self._fig_to_json(fig)
                        }
                        logger.info("Bar chart generated successfully")
                    except Exception as e:
                        logger.warning(f"Bar chart generation failed: {str(e)}")
                        visualizations['barchart'] = f"Bar chart generation failed: {str(e)}"
                
                elif option == 'heatmap':
                    if num_topics <= 1:
                        visualizations['heatmap'] = "Cannot generate heatmap: insufficient topics (need at least 2 topics)"
                        continue
                    
                    try:
                        # 使用标准BERTopic方法
                        fig = self.topic_model.visualize_heatmap()
                        visualizations['heatmap'] = {
                            'html': self._fig_to_html(fig),
                            'data': self._fig_to_json(fig)
                        }
                        logger.info("Heatmap generated successfully")
                    except Exception as e:
                        logger.warning(f"Heatmap generation failed: {str(e)}")
                        visualizations['heatmap'] = f"Heatmap generation failed: {str(e)}"
                
                elif option == 'documents':
                    try:
                        # 使用标准BERTopic方法
                        fig = self.topic_model.visualize_documents(texts)
                        visualizations['documents'] = {
                            'html': self._fig_to_html(fig),
                            'data': self._fig_to_json(fig)
                        }
                        logger.info("Documents visualization generated successfully")
                    except Exception as e:
                        logger.warning(f"Documents visualization failed: {str(e)}")
                        visualizations['documents'] = f"Documents visualization failed: {str(e)}"
                
                elif option == 'hierarchy':
                    if num_topics <= 1:
                        visualizations['hierarchy'] = "Cannot generate hierarchy: insufficient topics (need at least 2 topics)"
                        continue
                    
                    try:
                        # 检查scipy版本兼容性
                        import scipy
                        if hasattr(scipy, 'array'):
                            # 使用标准BERTopic方法
                            fig = self.topic_model.visualize_hierarchy()
                            visualizations['hierarchy'] = {
                                'html': self._fig_to_html(fig),
                                'data': self._fig_to_json(fig)
                            }
                            logger.info("Hierarchy visualization generated successfully")
                        else:
                            # 创建简单的层次结构可视化
                            fig = self._create_fallback_hierarchy_visualization(texts, topics)
                            if fig is not None:
                                visualizations['hierarchy'] = {
                                    'html': self._fig_to_html(fig),
                                    'data': self._fig_to_json(fig)
                                }
                                logger.info("Hierarchy visualization generated using fallback method")
                            else:
                                visualizations['hierarchy'] = "Hierarchy visualization failed: fallback method error"
                    except Exception as e:
                        logger.warning(f"Hierarchy visualization failed: {str(e)}")
                        # 使用备用方法
                        fig = self._create_fallback_hierarchy_visualization(texts, topics)
                        if fig is not None:
                            visualizations['hierarchy'] = {
                                'html': self._fig_to_html(fig),
                                'data': self._fig_to_json(fig)
                            }
                        else:
                            visualizations['hierarchy'] = "Hierarchy visualization failed: fallback method error"
                
                elif option == 'topics_over_time':
                    if timestamps is None or len(timestamps) == 0:
                        visualizations['topics_over_time'] = "Cannot generate topics over time: no timestamps provided"
                        logger.warning("Topics over time visualization skipped: no timestamps")
                        continue
                    
                    try:
                        # 确保时间戳数量与文档数量匹配
                        if len(timestamps) != len(texts):
                            logger.warning(f"Timestamp count ({len(timestamps)}) doesn't match text count ({len(texts)})")
                            # 截断或填充时间戳
                            if len(timestamps) > len(texts):
                                timestamps = timestamps[:len(texts)]
                            else:
                                # 用最后一个时间戳填充
                                timestamps.extend([timestamps[-1]] * (len(texts) - len(timestamps)))
                        
                        # 使用标准BERTopic方法
                        topics_over_time = self.topic_model.topics_over_time(texts, timestamps, global_tuning=False, evolution_tuning=False)
                        fig = self.topic_model.visualize_topics_over_time(topics_over_time)
                        visualizations['topics_over_time'] = self._fig_to_html(fig)
                        logger.info("Topics over time visualization generated successfully")
                    except Exception as e:
                        logger.warning(f"Topics over time visualization failed: {str(e)}")
                        visualizations['topics_over_time'] = f"Topics over time visualization failed: {str(e)}"
                
            except Exception as e:
                logger.error(f"生成可视化 {option} 错误: {str(e)}")
                visualizations[option] = f"生成失败: {str(e)}"
        
        logger.info(f"可视化生成完成，成功生成 {len([v for v in visualizations.values() if not str(v).startswith('无法生成') and not str(v).startswith('生成失败')])} 个可视化")
        return visualizations
    
    def _fig_to_html(self, fig):
        """将plotly图形转换为HTML字符串"""
        return fig.to_html(include_plotlyjs=True, div_id="plotly-div")
    
    def _fig_to_json(self, fig):
        """将plotly图形转换为JSON数据"""
        import json
        import numpy as np
        
        def convert_numpy(obj):
            """递归转换numpy数组为Python列表"""
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, dict):
                return {key: convert_numpy(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [convert_numpy(item) for item in obj]
            elif isinstance(obj, (np.integer, np.floating)):
                return obj.item()
            else:
                return obj
        
        fig_dict = fig.to_dict()
        return convert_numpy(fig_dict)
    
    def _create_fallback_topics_visualization(self, texts, topics):
        """创建备用的主题可视化"""
        try:
            import plotly.graph_objects as go
            from collections import Counter
            
            # 统计主题分布
            topic_counts = Counter(topics)
            
            # 创建简单的柱状图
            fig = go.Figure(data=[
                go.Bar(
                    x=list(topic_counts.keys()),
                    y=list(topic_counts.values()),
                    text=[f'Topic {t}' for t in topic_counts.keys()],
                    textposition='auto',
                )
            ])
            
            fig.update_layout(
                title='主题分布（备用可视化）',
                xaxis_title='主题ID',
                yaxis_title='文档数量',
                width=800,
                height=600
            )
            
            return fig
            
        except Exception as e:
            logger.error(f"备用可视化生成失败: {str(e)}")
            return None
    
    def _create_fallback_hierarchy_visualization(self, texts, topics):
        """创建备用的层级可视化"""
        try:
            import plotly.graph_objects as go
            from collections import Counter
            
            # 统计主题分布
            topic_counts = Counter(topics)
            
            # 创建简单的树状图
            fig = go.Figure(go.Treemap(
                labels=[f'Topic {t}' for t in topic_counts.keys()],
                values=list(topic_counts.values()),
                parents=[''] * len(topic_counts),
                textinfo="label+value"
            ))
            
            fig.update_layout(
                title='主题层级分布（备用可视化）',
                width=800,
                height=600
            )
            
            return fig
            
        except Exception as e:
            logger.error(f"备用层级可视化生成失败: {str(e)}")
            return None
    
    def _create_visualization_index(self, visualizations):
        """创建可视化索引页面"""
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>BERTopic Visualization Results</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        h1 {{ color: #333; }}
        .viz-link {{ 
            display: block; 
            margin: 10px 0; 
            padding: 10px; 
            background: #f5f5f5; 
            border-radius: 5px; 
            text-decoration: none; 
            color: #333;
        }}
        .viz-link:hover {{ background: #e0e0e0; }}
    </style>
</head>
<body>
    <h1>BERTopic Analysis Results</h1>
    <p>Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    <h2>Available Visualizations:</h2>
"""
        
        for viz_name, viz_data in visualizations.items():
            # 处理新的字典格式和旧的字符串格式
            if isinstance(viz_data, dict) and 'html' in viz_data:
                viz_html = viz_data['html']
            else:
                viz_html = viz_data
            
            if viz_html and isinstance(viz_html, str) and not viz_html.startswith('failed'):
                safe_name = viz_name.replace(' ', '_').replace('/', '_')
                html_content += f'    <a href="{safe_name}.html" class="viz-link">{viz_name.title()} Visualization</a>\n'
        
        html_content += """
</body>
</html>
"""
        return html_content
    
    def export_visualizations(self, data):
        """导出可视化结果为ZIP压缩包，包含HTML文件"""
        try:
            import zipfile
            import os
            
            logger.info("Starting ZIP export for visualizations")
            
            # 创建ZIP文件
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'BERTopic_Visualizations_{timestamp}.zip'
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as tmp_file:
                with zipfile.ZipFile(tmp_file.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    # 创建主页面
                    main_html = self._create_visualization_index(data.get('visualizations', {}))
                    zipf.writestr('index.html', main_html)
                    
                    # 添加每个可视化文件
                    for viz_name, viz_data in data.get('visualizations', {}).items():
                        # 处理新的字典格式和旧的字符串格式
                        if isinstance(viz_data, dict) and 'html' in viz_data:
                            viz_html = viz_data['html']
                        else:
                            viz_html = viz_data
                        
                        if viz_html and isinstance(viz_html, str) and not viz_html.startswith('failed') and not viz_html.startswith('Cannot generate'):
                            safe_name = viz_name.replace(' ', '_').replace('/', '_')
                            zipf.writestr(f'{safe_name}.html', viz_html)
                            logger.info(f"Added {safe_name}.html to ZIP")
                
            logger.info(f"ZIP export completed: {tmp_file.name}")
            return {
                'file_path': tmp_file.name,
                'filename': filename
            }
            
        except Exception as e:
            logger.error(f"Export visualizations error: {str(e)}")
            # Fallback to text format
            return self._export_visualizations_text(data)
    
    def export_annotated_data(self, data):
        """导出带主题标注的数据"""
        try:
            # 获取原始数据和主题信息
            texts = data.get('texts', [])
            topics = data.get('topics', [])
            probabilities = data.get('probabilities', [])
            
            # 确保所有列表长度一致
            min_length = min(len(texts), len(topics), len(probabilities))
            texts = texts[:min_length]
            topics = topics[:min_length]
            probabilities = probabilities[:min_length]
            
            # 创建DataFrame
            df = pd.DataFrame({
                'text': texts,
                'topic_id': topics,
                'topic_probability': probabilities
            })
            
            # 添加主题名称列（如果有主题信息）
            topic_info = data.get('topic_info', [])
            if topic_info:
                topic_name_map = {}
                for topic in topic_info:
                    topic_id = topic.get('Topic', -1)
                    topic_name = topic.get('Name', f'Topic_{topic_id}')
                    topic_name_map[topic_id] = topic_name
                
                df['topic_name'] = df['topic_id'].map(topic_name_map).fillna('Unknown_Topic')
            
            # 保存到临时文件
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'BERTopic_Annotated_Data_{timestamp}.xlsx'
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
                df.to_excel(tmp_file.name, index=False, engine='openpyxl')
                
            return {
                'file_path': tmp_file.name,
                'filename': filename
            }
            
        except Exception as e:
            logger.error(f"导出标注数据错误: {str(e)}")
            raise
    
    def _export_visualizations_text(self, data):
        """回退方法：导出可视化结果为文本文件"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'BERTopic_Visualizations_{timestamp}.txt'
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.txt', mode='w', encoding='utf-8') as tmp_file:
            tmp_file.write('BERTopic分析结果\n')
            tmp_file.write(f'生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n\n')
            tmp_file.write('可视化结果:\n')
            
            for viz_name, viz_data in data.get('visualizations', {}).items():
                # 处理新的字典格式和旧的字符串格式
                if isinstance(viz_data, dict) and 'html' in viz_data:
                    viz_html = viz_data['html']
                else:
                    viz_html = viz_data
                
                if viz_html and isinstance(viz_html, str) and not viz_html.startswith('生成失败'):
                    tmp_file.write(f'- {viz_name}可视化: 已生成\n')
                else:
                    tmp_file.write(f'- {viz_name}可视化: 生成失败\n')
        
        return {
            'file_path': tmp_file.name,
            'filename': filename
        }
    
    def export_topic_details(self, data):
        """导出主题详情为Excel文件"""
        try:
            import pandas as pd
            
            # 获取主题信息
            topic_info = data.get('topic_info', [])
            
            if not topic_info:
                # 创建空的Excel文件
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f'BERTopic_Topic_Details_{timestamp}.xlsx'
                
                with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
                    df = pd.DataFrame({'Topic': ['No topics found'], 'Count': [0], 'Percentage': ['0%'], 'Words': ['']})
                    df.to_excel(tmp_file.name, index=False, engine='openpyxl')
                
                return {
                    'file_path': tmp_file.name,
                    'filename': filename
                }
            
            # 创建Excel文件
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'BERTopic_Topic_Details_{timestamp}.xlsx'
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
                # 准备数据
                topic_data = []
                for topic in topic_info:
                    topic_id = topic.get('Topic', '')
                    count = topic.get('Count', 0)
                    percentage = topic.get('Percentage', 0)
                    
                    # 尝试多种方式获取关键词
                    words = []
                    if 'Words' in topic and topic['Words']:
                        words = topic['Words'][:10]  # 前10个关键词
                    elif 'Name' in topic and topic['Name']:
                        # 如果Words字段为空，尝试使用Name字段
                        words = [topic['Name']]
                    else:
                        # 如果都没有，尝试从topic_model获取
                        try:
                            if hasattr(self, 'topic_model') and self.topic_model is not None:
                                topic_words = self.topic_model.get_topic(topic_id)
                                if topic_words:
                                    words = [word for word, _ in topic_words[:10]]
                        except Exception as e:
                            logger.warning(f"无法获取主题 {topic_id} 的关键词: {str(e)}")
                    
                    words_str = ', '.join(words) if words else 'No keywords available'
                    
                    topic_data.append({
                        'Topic': topic_id,
                        'Count': count,
                        'Percentage': f'{percentage:.1f}%',
                        'Words': words_str
                    })
                
                # 创建DataFrame并导出
                df = pd.DataFrame(topic_data)
                df.to_excel(tmp_file.name, index=False, engine='openpyxl')
                
            return {
                'file_path': tmp_file.name,
                'filename': filename
            }
            
        except Exception as e:
            logger.error(f"导出主题详情错误: {str(e)}")
            raise
