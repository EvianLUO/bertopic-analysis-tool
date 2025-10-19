import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Help as HelpIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const HelpDialog = ({ open, onClose, title, content }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HelpIcon sx={{ mr: 1 }} />
          {title}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {content}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const PreprocessingHelp = () => {
  const { t } = useTranslation();
  
  const content = (
    <Box>
      <Typography variant="h6" gutterBottom>
        数据预处理说明
      </Typography>
      
      <Typography variant="body1" paragraph>
        数据预处理是BERTopic分析的重要步骤，包括文本清洗和停用词过滤。
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        停用词管理
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="中文停用词"
            secondary="包含常见的中文停用词，如'的'、'了'、'在'等"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="英文停用词"
            secondary="包含常见的英文停用词，如'the'、'is'、'and'等"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="自定义停用词"
            secondary="您可以添加特定领域的停用词"
          />
        </ListItem>
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        文本清洗选项
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="最小词频阈值"
            secondary="过滤出现次数少于该值的词汇"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="最大文档频率阈值"
            secondary="过滤在超过该比例文档中出现的词汇"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="中文分词工具"
            secondary="选择jieba、pkuseg或thulac进行中文分词"
          />
        </ListItem>
      </List>
    </Box>
  );
  
  return content;
};

export const ConfigurationHelp = () => {
  const { t } = useTranslation();
  
  const content = (
    <Box>
      <Typography variant="h6" gutterBottom>
        BERTopic参数配置说明
      </Typography>
      
      <Typography variant="body1" paragraph>
        BERTopic使用多个步骤进行主题建模，每个步骤都有相应的参数可以调整。
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        基础参数
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="最小主题大小"
            secondary="主题包含的最少文档数，建议值10-20"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Embedding模型"
            secondary="根据文本语言自动选择最适合的模型"
          />
        </ListItem>
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        UMAP降维参数
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="邻居数量 (n_neighbors)"
            secondary="控制局部与全局结构的平衡，建议值15"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="降维维度 (n_components)"
            secondary="降维后的维度数，建议值5"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="最小距离 (min_dist)"
            secondary="控制点之间的紧密程度，建议值0.0"
          />
        </ListItem>
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        HDBSCAN聚类参数
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="最小聚类大小"
            secondary="聚类的最小大小，建议值15"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="距离度量"
            secondary="计算距离的方法，建议使用欧几里得距离"
          />
        </ListItem>
      </List>
    </Box>
  );
  
  return content;
};

export const VisualizationHelp = () => {
  const { t } = useTranslation();
  
  const content = (
    <Box>
      <Typography variant="h6" gutterBottom>
        可视化选项说明
      </Typography>
      
      <Typography variant="body1" paragraph>
        您可以选择需要生成的可视化分析项，选择越多计算时间越长。
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        基础分析
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="主题概览统计"
            secondary="显示主题数量、文档分布等基本统计信息"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="主题分布可视化"
            secondary="2D散点图显示主题在降维空间中的分布"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="主题关键词柱状图"
            secondary="显示每个主题的关键词及其重要性"
          />
        </ListItem>
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        进阶可视化
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="主题相似度热力图"
            secondary="显示主题之间的相似度矩阵"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="文档散点图"
            secondary="显示文档在降维空间中的分布"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="层级主题结构"
            secondary="树状图显示主题的层级关系"
          />
        </ListItem>
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        高级分析
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="UMAP自定义可视化"
            secondary="使用自定义UMAP参数生成可视化"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="层次主题模型"
            secondary="展示主题的层次聚类过程"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="动态主题模型"
            secondary="分析主题随时间的变化（需要时间戳数据）"
          />
        </ListItem>
      </List>
    </Box>
  );
  
  return content;
};

export default HelpDialog;
