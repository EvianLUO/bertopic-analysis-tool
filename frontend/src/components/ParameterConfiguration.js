import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Slider,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const ParameterConfiguration = ({ data, onNext, onBack, onConfigUpdated }) => {
  const { t } = useTranslation();
  const [config, setConfig] = useState({
    basic: {
      minTopicSize: 10,
      embeddingModel: 'auto'
    },
    umap: {
      nNeighbors: 15,
      nComponents: 5,
      minDist: 0.0,
      metric: 'cosine'
    },
    hdbscan: {
      minClusterSize: 15,
      metric: 'euclidean'
    },
    advanced: {
      nrTopics: null,
      topNWords: 10,
      calculateProbabilities: false
    }
  });

  const [visualizationOptions, setVisualizationOptions] = useState({
    overview: true,
    topics: true,
    barchart: true,
    heatmap: false,
    documents: false,
    hierarchy: false,
    umapCustom: false,
    hierarchicalTopics: false,
    topicsOverTime: false
  });

  const handleConfigChange = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleVisualizationChange = (option, checked) => {
    setVisualizationOptions(prev => ({
      ...prev,
      [option]: checked
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(visualizationOptions).every(v => v);
    const newOptions = {};
    Object.keys(visualizationOptions).forEach(key => {
      newOptions[key] = !allSelected;
    });
    setVisualizationOptions(newOptions);
  };

  const handleNext = () => {
    const updatedData = {
      ...data,
      config,
      visualizationOptions
    };
    onConfigUpdated(updatedData);
    onNext();
  };

  const getSelectedCount = () => {
    return Object.values(visualizationOptions).filter(v => v).length;
  };

  const getEstimatedTime = () => {
    const selectedCount = getSelectedCount();
    const docCount = data?.preview?.length || 0;
    
    if (docCount < 100) return `1-2 ${t('analysis.minutes')}`;
    if (docCount < 1000) return `3-5 ${t('analysis.minutes')}`;
    if (docCount < 5000) return `5-10 ${t('analysis.minutes')}`;
    return `10-20 ${t('analysis.minutes')}`;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('configuration.title')}
      </Typography>

      {/* Basic Parameters */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            {t('configuration.basic.title')}
            <HelpIcon sx={{ ml: 1, fontSize: 16 }} />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            <TextField
              label={t('configuration.basic.minTopicSize')}
              type="number"
              value={config.basic.minTopicSize}
              onChange={(e) => handleConfigChange('basic', 'minTopicSize', parseInt(e.target.value))}
              fullWidth
              inputProps={{ min: 2, max: 100 }}
            />

            <FormControl fullWidth>
              <InputLabel>{t('configuration.basic.embeddingModel')}</InputLabel>
              <Select
                value={config.basic.embeddingModel}
                onChange={(e) => handleConfigChange('basic', 'embeddingModel', e.target.value)}
                label={t('configuration.basic.embeddingModel')}
              >
                <MenuItem value="auto">{t('configuration.basic.auto')}</MenuItem>
                <MenuItem value="paraphrase-multilingual-MiniLM-L12-v2">{t('configuration.basic.multilingualModel')}</MenuItem>
                <MenuItem value="all-MiniLM-L6-v2">{t('configuration.basic.englishModel')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* UMAP Parameters */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            {t('configuration.umap.title')}
            <HelpIcon sx={{ ml: 1, fontSize: 16 }} />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            <Box>
              <Typography gutterBottom>
                {t('configuration.umap.nNeighbors')}: {config.umap.nNeighbors}
              </Typography>
              <Slider
                value={config.umap.nNeighbors}
                onChange={(e, value) => handleConfigChange('umap', 'nNeighbors', value)}
                min={5}
                max={50}
                step={1}
                marks={[
                  { value: 5, label: '5' },
                  { value: 15, label: '15' },
                  { value: 30, label: '30' },
                  { value: 50, label: '50' }
                ]}
              />
            </Box>

            <Box>
              <Typography gutterBottom>
                {t('configuration.umap.nComponents')}: {config.umap.nComponents}
              </Typography>
              <Slider
                value={config.umap.nComponents}
                onChange={(e, value) => handleConfigChange('umap', 'nComponents', value)}
                min={2}
                max={10}
                step={1}
                marks={[
                  { value: 2, label: '2' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' }
                ]}
              />
            </Box>

            <Box>
              <Typography gutterBottom>
                {t('configuration.umap.minDist')}: {config.umap.minDist}
              </Typography>
              <Slider
                value={config.umap.minDist}
                onChange={(e, value) => handleConfigChange('umap', 'minDist', value)}
                min={0.0}
                max={1.0}
                step={0.01}
                marks={[
                  { value: 0.0, label: '0.0' },
                  { value: 0.5, label: '0.5' },
                  { value: 1.0, label: '1.0' }
                ]}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>{t('configuration.umap.metric')}</InputLabel>
              <Select
                value={config.umap.metric}
                onChange={(e) => handleConfigChange('umap', 'metric', e.target.value)}
                label={t('configuration.umap.metric')}
              >
                <MenuItem value="cosine">{t('configuration.umap.cosine')}</MenuItem>
                <MenuItem value="euclidean">{t('configuration.umap.euclidean')}</MenuItem>
                <MenuItem value="manhattan">{t('configuration.umap.manhattan')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* HDBSCAN Parameters */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            {t('configuration.hdbscan.title')}
            <HelpIcon sx={{ ml: 1, fontSize: 16 }} />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            <TextField
              label={t('configuration.hdbscan.minClusterSize')}
              type="number"
              value={config.hdbscan.minClusterSize}
              onChange={(e) => handleConfigChange('hdbscan', 'minClusterSize', parseInt(e.target.value))}
              fullWidth
              inputProps={{ min: 2, max: 100 }}
            />

            <FormControl fullWidth>
              <InputLabel>{t('configuration.hdbscan.metric')}</InputLabel>
              <Select
                value={config.hdbscan.metric}
                onChange={(e) => handleConfigChange('hdbscan', 'metric', e.target.value)}
                label={t('configuration.hdbscan.metric')}
              >
                <MenuItem value="euclidean">{t('configuration.hdbscan.euclidean')}</MenuItem>
                <MenuItem value="manhattan">{t('configuration.hdbscan.manhattan')}</MenuItem>
                <MenuItem value="cosine">{t('configuration.hdbscan.cosine')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Advanced Parameters */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            {t('configuration.advanced.title')}
            <HelpIcon sx={{ ml: 1, fontSize: 16 }} />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            <TextField
              label={t('configuration.advanced.nrTopics')}
              type="number"
              value={config.advanced.nrTopics || ''}
              onChange={(e) => handleConfigChange('advanced', 'nrTopics', e.target.value ? parseInt(e.target.value) : null)}
              fullWidth
              inputProps={{ min: 2, max: 50 }}
            />

            <TextField
              label={t('configuration.advanced.topNWords')}
              type="number"
              value={config.advanced.topNWords}
              onChange={(e) => handleConfigChange('advanced', 'topNWords', parseInt(e.target.value))}
              fullWidth
              inputProps={{ min: 5, max: 20 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={config.advanced.calculateProbabilities}
                  onChange={(e) => handleConfigChange('advanced', 'calculateProbabilities', e.target.checked)}
                />
              }
              label={t('configuration.advanced.calculateProbabilities')}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 3 }} />

      {/* Visualization Options Selection */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('visualization.title')}
          <SettingsIcon sx={{ ml: 1 }} />
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={handleSelectAll}
            sx={{ mb: 2 }}
          >
            {t('visualization.selectAll')}
          </Button>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('analysis.selectedVisualizations')} {getSelectedCount()} {t('analysis.items')}, {t('analysis.estimatedTime')}: {getEstimatedTime()}
          </Alert>
        </Box>

        {/* Basic Analysis */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              {t('visualization.basic.title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={visualizationOptions.overview}
                    onChange={(e) => handleVisualizationChange('overview', e.target.checked)}
                  />
                }
                label={t('visualization.basic.overview')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={visualizationOptions.topics}
                    onChange={(e) => handleVisualizationChange('topics', e.target.checked)}
                  />
                }
                label={t('visualization.basic.topics')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={visualizationOptions.barchart}
                    onChange={(e) => handleVisualizationChange('barchart', e.target.checked)}
                  />
                }
                label={t('visualization.basic.barchart')}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Advanced Visualizations */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              {t('visualization.advanced.title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={visualizationOptions.heatmap}
                    onChange={(e) => handleVisualizationChange('heatmap', e.target.checked)}
                  />
                }
                label={t('visualization.advanced.heatmap')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={visualizationOptions.documents}
                    onChange={(e) => handleVisualizationChange('documents', e.target.checked)}
                  />
                }
                label={t('visualization.advanced.documents')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={visualizationOptions.hierarchy}
                    onChange={(e) => handleVisualizationChange('hierarchy', e.target.checked)}
                  />
                }
                label={t('visualization.advanced.hierarchy')}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Advanced Analysis */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              {t('visualization.custom.title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={visualizationOptions.umapCustom}
                    onChange={(e) => handleVisualizationChange('umapCustom', e.target.checked)}
                  />
                }
                label={t('visualization.custom.umapCustom')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={visualizationOptions.hierarchicalTopics}
                    onChange={(e) => handleVisualizationChange('hierarchicalTopics', e.target.checked)}
                  />
                }
                label={t('visualization.custom.hierarchicalTopics')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={visualizationOptions.topicsOverTime}
                    onChange={(e) => handleVisualizationChange('topicsOverTime', e.target.checked)}
                    disabled={!data?.selectedTimestampColumn}
                  />
                }
                label={t('visualization.custom.topicsOverTime')}
              />
            </Box>
            {!data?.selectedTimestampColumn && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {t('visualization.topicsOverTime.warning')}
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          {t('common.previous')}
        </Button>
        <Button 
          variant="contained" 
          onClick={handleNext}
          disabled={getSelectedCount() === 0}
        >
          {t('common.next')}
        </Button>
      </Box>
    </Box>
  );
};

export default ParameterConfiguration;
