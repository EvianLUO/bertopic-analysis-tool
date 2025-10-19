import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Paper,
  Typography,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Radio,
  RadioGroup,
  FormControl as MuiFormControl,
  FormLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import axios from 'axios';

const DataPreprocessing = ({ data, onNext, onBack, onDataUpdated }) => {
  const { t } = useTranslation();
  
  // 语言选择状态
  const [selectedLanguage, setSelectedLanguage] = useState('chinese');
  
  // 停用词管理状态
  const [stopwords, setStopwords] = useState({
    chinese: [],
    english: [],
    custom: [],
    uploaded: []
  });
  
  // 自定义停用词输入
  const [customStopwordsText, setCustomStopwordsText] = useState('');
  
  // 上传的停用词文件
  const [uploadedStopwordsFile, setUploadedStopwordsFile] = useState(null);
  
  // 预处理配置
  const [preprocessingConfig, setPreprocessingConfig] = useState({
    minFreq: 2,
    maxFreq: 0.95,
    minLength: 2,
    segmenter: 'jieba',
    stemming: false,
    lemmatization: false,
    removeNumbers: true,
    removePunctuation: true,
    toLowerCase: true,
    removeEnglishChars: false // 新增：去除英文字符选项
  });
  

  useEffect(() => {
    loadDefaultStopwords();
  }, []);

  const loadDefaultStopwords = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/stopwords');
      setStopwords(response.data);
    } catch (error) {
      console.error('Failed to load stopwords:', error);
      // 设置默认停用词
      setStopwords({
        chinese: ['的', '了', '是', '在', '有', '和', '就', '不', '人', '都', '一', '个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'],
        english: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'],
        custom: [],
        uploaded: []
      });
    }
  };

  // 计算最终停用词列表
  const getFinalStopwords = () => {
    const defaultStopwords = stopwords[selectedLanguage] || [];
    const customStopwords = customStopwordsText
      .split(/[,\n]/)
      .map(word => word.trim())
      .filter(word => word.length > 0);
    const uploadedStopwords = stopwords.uploaded || [];
    
    // 合并所有停用词并去重
    const allStopwords = [...defaultStopwords, ...customStopwords, ...uploadedStopwords];
    return [...new Set(allStopwords)];
  };

  // 处理停用词文件上传
  const handleStopwordsFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'text/plain') {
      toast.error('请上传txt格式的停用词文件');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const words = content.split('\n')
        .map(word => word.trim())
        .filter(word => word.length > 0);
      
      setStopwords(prev => ({
        ...prev,
        uploaded: words
      }));
      
      setUploadedStopwordsFile(file);
      toast.success(`成功加载 ${words.length} 个停用词`);
    };
    reader.readAsText(file);
  };

  // 语言变化处理
  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    
    // 根据语言调整预处理配置
    setPreprocessingConfig(prev => ({
      ...prev,
      segmenter: newLanguage === 'chinese' ? 'jieba' : 'none',
      stemming: newLanguage === 'english',
      lemmatization: newLanguage === 'english',
      removeEnglishChars: newLanguage === 'chinese'
    }));
  };

  const handleConfigChange = (field, value) => {
    setPreprocessingConfig({
      ...preprocessingConfig,
      [field]: value
    });
  };

  const handleNext = () => {
    const finalStopwords = getFinalStopwords();
    const updatedData = {
      ...data,
      preprocessingConfig,
      stopwords: {
        ...stopwords,
        final: finalStopwords,
        language: selectedLanguage
      },
      selectedLanguage
    };
    onDataUpdated(updatedData);
    onNext();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('preprocessing.title')}
      </Typography>

      {/* 语言选择 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('preprocessing.languageSelection')}
          <HelpIcon sx={{ ml: 1, fontSize: 16 }} />
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('preprocessing.languageSelectionDesc')}
        </Typography>
        
        <MuiFormControl component="fieldset">
          <FormLabel component="legend">{t('preprocessing.selectLanguage')}</FormLabel>
          <RadioGroup
            row
            value={selectedLanguage}
            onChange={handleLanguageChange}
          >
            <FormControlLabel value="chinese" control={<Radio />} label={t('preprocessing.chinese')} />
            <FormControlLabel value="english" control={<Radio />} label={t('preprocessing.english')} />
          </RadioGroup>
        </MuiFormControl>
      </Paper>

      {/* 停用词管理 */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            {t('preprocessing.stopwords.title')}
            <HelpIcon sx={{ ml: 1, fontSize: 16 }} />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('preprocessing.stopwords.description')}
            </Typography>
            
            {/* 当前停用词统计 */}
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('preprocessing.stopwords.currentCount')}: {getFinalStopwords().length} {t('preprocessing.stopwords.words')}
              {selectedLanguage === 'chinese' && ` (${t('preprocessing.stopwords.chinese')}: ${stopwords.chinese?.length || 0}${t('preprocessing.stopwords.words')})`}
              {selectedLanguage === 'english' && ` (${t('preprocessing.stopwords.english')}: ${stopwords.english?.length || 0}${t('preprocessing.stopwords.words')})`}
              {customStopwordsText && ` + ${t('preprocessing.stopwords.additionalStopwords')}: ${customStopwordsText.split(/[,\n]/).filter(w => w.trim()).length}${t('preprocessing.stopwords.words')}`}
              {stopwords.uploaded?.length > 0 && ` + ${t('preprocessing.stopwords.uploadStopwordsFile')}: ${stopwords.uploaded.length}${t('preprocessing.stopwords.words')}`}
            </Alert>
            
            {/* 额外停用词输入 */}
            <TextField
              label={t('preprocessing.stopwords.additionalStopwords')}
              multiline
              rows={3}
              value={customStopwordsText}
              onChange={(e) => setCustomStopwordsText(e.target.value)}
              placeholder={t('preprocessing.stopwords.additionalStopwordsPlaceholder')}
              fullWidth
              sx={{ mb: 2 }}
            />
            
            {/* 停用词文件上传 */}
            <Box sx={{ mb: 2 }}>
              <input
                accept=".txt"
                style={{ display: 'none' }}
                id="stopwords-file-upload"
                type="file"
                onChange={handleStopwordsFileUpload}
              />
              <label htmlFor="stopwords-file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 1 }}
                >
                  {t('preprocessing.stopwords.uploadStopwordsFile')}
                </Button>
              </label>
              {uploadedStopwordsFile && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {t('preprocessing.stopwords.uploadedFile')}: {uploadedStopwordsFile.name} ({stopwords.uploaded?.length || 0}{t('preprocessing.stopwords.words')})
                </Typography>
              )}
            </Box>
            
            {/* 预览最终停用词 */}
            {getFinalStopwords().length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('preprocessing.stopwords.preview')}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {getFinalStopwords().slice(0, 20).map((word, index) => (
                    <Chip key={index} label={word} size="small" />
                  ))}
                  {getFinalStopwords().length > 20 && (
                    <Chip label={`...${t('preprocessing.stopwords.moreWords')}${getFinalStopwords().length - 20}${t('preprocessing.stopwords.words')}`} size="small" color="secondary" />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* 文本清洗选项 */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            {t('preprocessing.cleaning.title')}
            <HelpIcon sx={{ ml: 1, fontSize: 16 }} />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            
            {/* 通用选项 */}
            <FormControlLabel
              control={
                <Switch
                  checked={preprocessingConfig.removePunctuation}
                  onChange={(e) => handleConfigChange('removePunctuation', e.target.checked)}
                />
              }
              label={t('preprocessing.cleaning.removePunctuation')}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preprocessingConfig.removeNumbers}
                  onChange={(e) => handleConfigChange('removeNumbers', e.target.checked)}
                />
              }
              label={t('preprocessing.cleaning.removeNumbers')}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preprocessingConfig.toLowerCase}
                  onChange={(e) => handleConfigChange('toLowerCase', e.target.checked)}
                />
              }
              label={t('preprocessing.cleaning.toLowerCase')}
            />

            {/* 中文特有选项 */}
            {selectedLanguage === 'chinese' && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preprocessingConfig.removeEnglishChars}
                      onChange={(e) => handleConfigChange('removeEnglishChars', e.target.checked)}
                    />
                  }
                  label={t('preprocessing.cleaning.removeEnglishChars')}
                />

                <FormControl fullWidth>
                  <InputLabel>{t('preprocessing.cleaning.segmentationTool')}</InputLabel>
                  <Select
                    value={preprocessingConfig.segmenter}
                    onChange={(e) => handleConfigChange('segmenter', e.target.value)}
                    label={t('preprocessing.cleaning.segmentationTool')}
                  >
                    <MenuItem value="jieba">{t('preprocessing.cleaning.jiebaRecommended')}</MenuItem>
                    <MenuItem value="pkuseg">pkuseg</MenuItem>
                    <MenuItem value="thulac">thulac</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            {/* 英文特有选项 */}
            {selectedLanguage === 'english' && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preprocessingConfig.stemming}
                      onChange={(e) => handleConfigChange('stemming', e.target.checked)}
                    />
                  }
                  label={t('preprocessing.cleaning.stemming')}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={preprocessingConfig.lemmatization}
                      onChange={(e) => handleConfigChange('lemmatization', e.target.checked)}
                    />
                  }
                  label={t('preprocessing.cleaning.lemmatization')}
                />
              </>
            )}

            {/* 词频过滤 */}
            <TextField
              label={t('preprocessing.cleaning.minFreq')}
              type="number"
              value={preprocessingConfig.minFreq}
              onChange={(e) => handleConfigChange('minFreq', parseInt(e.target.value))}
              fullWidth
            />

            <TextField
              label={t('preprocessing.cleaning.maxFreq')}
              type="number"
              value={preprocessingConfig.maxFreq}
              onChange={(e) => handleConfigChange('maxFreq', parseFloat(e.target.value))}
              fullWidth
              inputProps={{ min: 0, max: 1, step: 0.01 }}
            />

            <TextField
              label={t('preprocessing.cleaning.minLength')}
              type="number"
              value={preprocessingConfig.minLength}
              onChange={(e) => handleConfigChange('minLength', parseInt(e.target.value))}
              fullWidth
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* 导航按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          {t('common.previous')}
        </Button>
        <Button variant="contained" onClick={handleNext}>
          {t('common.next')}
        </Button>
      </Box>
    </Box>
  );
};

export default DataPreprocessing;
