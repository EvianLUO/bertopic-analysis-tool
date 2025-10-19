import os
import json
import logging

logger = logging.getLogger(__name__)

class StopwordsManager:
    """停用词管理器"""
    
    def __init__(self):
        self.stopwords_file = 'data/stopwords.json'
        self._load_stopwords()
    
    def _load_stopwords(self):
        """加载停用词"""
        try:
            if os.path.exists(self.stopwords_file):
                with open(self.stopwords_file, 'r', encoding='utf-8') as f:
                    self.stopwords = json.load(f)
            else:
                self.stopwords = self._get_default_stopwords()
                self._save_stopwords()
        except Exception as e:
            logger.error(f"加载停用词错误: {str(e)}")
            self.stopwords = self._get_default_stopwords()
    
    def _get_default_stopwords(self):
        """获取默认停用词"""
        return {
            'chinese': [
                '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'
            ],
            'english': [
                'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once'
            ],
            'custom': []
        }
    
    def get_all_stopwords(self):
        """获取所有停用词"""
        return self.stopwords
    
    def update_stopwords(self, new_stopwords):
        """更新停用词"""
        self.stopwords.update(new_stopwords)
        self._save_stopwords()
    
    def _save_stopwords(self):
        """保存停用词"""
        try:
            os.makedirs(os.path.dirname(self.stopwords_file), exist_ok=True)
            with open(self.stopwords_file, 'w', encoding='utf-8') as f:
                json.dump(self.stopwords, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"保存停用词错误: {str(e)}")
            raise
