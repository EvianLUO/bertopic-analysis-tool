import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Paper,
  Typography,
  Button,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
  Alert
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ScatterPlot as ScatterPlotIcon,
  Timeline as TimelineIcon,
  AccountTree as AccountTreeIcon,
  GridView as HeatMapIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import Plot from 'react-plotly.js';
import { useEffect, useRef } from 'react';

const ResultsDisplay = ({ results, onNext, onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  if (!results) {
    return (
      <Alert severity="error">
        No analysis results to display
      </Alert>
    );
  }

  const getAvailableTabs = () => {
    const tabs = [];
    
    // Basic analysis - always display
    tabs.push({
      id: 'overview',
      label: t('results.overview'),
      icon: <VisibilityIcon />,
      content: <OverviewTab results={results} />
    });

    // Dynamically add tabs based on generated visualizations
    if (results.visualizations?.topics) {
      tabs.push({
        id: 'topics',
        label: t('results.topicsDistribution'),
        icon: <ScatterPlotIcon />,
        content: <TopicsVisualizationTab visualization={results.visualizations.topics} />
      });
    }

    if (results.visualizations?.barchart) {
      tabs.push({
        id: 'barchart',
        label: t('results.keywordsChart'),
        icon: <BarChartIcon />,
        content: <BarchartVisualizationTab visualization={results.visualizations.barchart} />
      });
    }

    if (results.visualizations?.heatmap) {
      tabs.push({
        id: 'heatmap',
        label: t('results.similarityHeatmap'),
        icon: <HeatMapIcon />,
        content: <HeatmapVisualizationTab visualization={results.visualizations.heatmap} />
      });
    }

    if (results.visualizations?.documents) {
      tabs.push({
        id: 'documents',
        label: t('results.documentsScatter'),
        icon: <ScatterPlotIcon />,
        content: <DocumentsVisualizationTab visualization={results.visualizations.documents} />
      });
    }

    if (results.visualizations?.hierarchy) {
      tabs.push({
        id: 'hierarchy',
        label: t('results.hierarchyTree'),
        icon: <AccountTreeIcon />,
        content: <HierarchyVisualizationTab visualization={results.visualizations.hierarchy} />
      });
    }

    if (results.visualizations?.topics_over_time) {
      tabs.push({
        id: 'topics_over_time',
        label: t('results.topicsOverTime'),
        icon: <TimelineIcon />,
        content: <TopicsOverTimeVisualizationTab visualization={results.visualizations.topics_over_time} />
      });
    }

    return tabs;
  };

  const availableTabs = getAvailableTabs();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('results.title')}
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {availableTabs.map((tab, index) => (
            <Tab
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

        <Box sx={{ p: 3, minHeight: 400 }}>
          {availableTabs[activeTab]?.content}
        </Box>
      </Paper>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          {t('common.previous')}
        </Button>
        <Button variant="contained" onClick={onNext}>
          {t('common.next')}
        </Button>
      </Box>
    </Box>
  );
};

// 主题概览Tab组件
const OverviewTab = ({ results }) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('results.overviewStats')}
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {t('results.totalTopics')}
              </Typography>
              <Typography variant="h4">
                {results.model_info?.num_topics || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {t('results.totalDocuments')}
              </Typography>
              <Typography variant="h4">
                {results.model_info?.num_documents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {t('results.noiseDocuments')}
              </Typography>
              <Typography variant="h4">
                {results.model_info?.num_noise || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {t('results.avgDocumentsPerTopic')}
              </Typography>
              <Typography variant="h4">
                {results.model_info?.num_topics > 0 ? 
                  Math.round(results.model_info.num_documents / results.model_info.num_topics) : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Topic Details Table */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        {t('results.topicDetails')}
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('results.topicId')}</TableCell>
              <TableCell>{t('results.documentCount')}</TableCell>
              <TableCell>{t('results.documentRatio')}</TableCell>
              <TableCell>{t('results.keywords')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.topic_info?.slice(0, 10).map((topic) => (
              <TableRow key={topic.Topic}>
                <TableCell>
                  <Chip 
                    label={`Topic ${topic.Topic}`} 
                    color={topic.Topic === -1 ? 'default' : 'primary'}
                  />
                </TableCell>
                <TableCell>{topic.Count}</TableCell>
                <TableCell>
                  {((topic.Count / results.model_info.num_documents) * 100).toFixed(1)}%
                </TableCell>
                <TableCell>
                  {topic.Name?.split('_').slice(0, 5).join(', ') || 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// 可视化Tab组件 - 使用Plotly React组件
const TopicsVisualizationTab = ({ visualization }) => {
  const { t } = useTranslation();
  
  if (typeof visualization === 'string' && visualization.includes('failed')) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.topicsDistribution')}
        </Typography>
        <Alert severity="warning">{visualization}</Alert>
      </Box>
    );
  }
  
  // 检查是否有Plotly数据
  if (visualization && typeof visualization === 'object' && visualization.data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.topicsDistribution')}
        </Typography>
        <Plot
          data={visualization.data.data}
          layout={visualization.data.layout}
          style={{ width: '100%', height: '600px' }}
          config={{ responsive: true }}
        />
      </Box>
    );
  }
  
  // 兼容旧格式（直接是字符串HTML）
  if (typeof visualization === 'string' && !visualization.includes('failed')) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.topicsDistribution')}
        </Typography>
        <Alert severity="info">Visualization data is being processed...</Alert>
      </Box>
    );
  }
  
  // 如果没有数据，显示错误信息
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('results.topicsDistribution')}
      </Typography>
      <Alert severity="error">No visualization data available</Alert>
    </Box>
  );
};

const BarchartVisualizationTab = ({ visualization }) => {
  const { t } = useTranslation();
  
  if (typeof visualization === 'string' && visualization.includes('failed')) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.keywordsChart')}
        </Typography>
        <Alert severity="warning">{visualization}</Alert>
      </Box>
    );
  }
  
  if (visualization && typeof visualization === 'object' && visualization.data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.keywordsChart')}
        </Typography>
        <Plot
          data={visualization.data.data}
          layout={visualization.data.layout}
          style={{ width: '100%', height: '600px' }}
          config={{ responsive: true }}
        />
      </Box>
    );
  }
  
  // 兼容旧格式（直接是字符串HTML）
  if (typeof visualization === 'string' && !visualization.includes('failed')) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.keywordsChart')}
        </Typography>
        <Alert severity="info">Visualization data is being processed...</Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('results.keywordsChart')}
      </Typography>
      <Alert severity="error">No visualization data available</Alert>
    </Box>
  );
};

const HeatmapVisualizationTab = ({ visualization }) => {
  const { t } = useTranslation();
  
  if (typeof visualization === 'string' && visualization.includes('failed')) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.similarityHeatmap')}
        </Typography>
        <Alert severity="warning">{visualization}</Alert>
      </Box>
    );
  }
  
  if (visualization && typeof visualization === 'object' && visualization.data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.similarityHeatmap')}
        </Typography>
        <Plot
          data={visualization.data.data}
          layout={visualization.data.layout}
          style={{ width: '100%', height: '600px' }}
          config={{ responsive: true }}
        />
      </Box>
    );
  }
  
  // 兼容旧格式（直接是字符串HTML）
  if (typeof visualization === 'string' && !visualization.includes('failed')) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.similarityHeatmap')}
        </Typography>
        <Alert severity="info">Visualization data is being processed...</Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('results.similarityHeatmap')}
      </Typography>
      <Alert severity="error">No visualization data available</Alert>
    </Box>
  );
};

const DocumentsVisualizationTab = ({ visualization }) => {
  const { t } = useTranslation();
  
  if (typeof visualization === 'string' && visualization.includes('failed')) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.documentsScatter')}
        </Typography>
        <Alert severity="warning">{visualization}</Alert>
      </Box>
    );
  }
  
  if (visualization && typeof visualization === 'object' && visualization.data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.documentsScatter')}
        </Typography>
        <Plot
          data={visualization.data.data}
          layout={visualization.data.layout}
          style={{ width: '100%', height: '600px' }}
          config={{ responsive: true }}
        />
      </Box>
    );
  }
  
  // 兼容旧格式（直接是字符串HTML）
  if (typeof visualization === 'string' && !visualization.includes('failed')) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.documentsScatter')}
        </Typography>
        <Alert severity="info">Visualization data is being processed...</Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('results.documentsScatter')}
      </Typography>
      <Alert severity="error">No visualization data available</Alert>
    </Box>
  );
};

const HierarchyVisualizationTab = ({ visualization }) => {
  const { t } = useTranslation();
  
  if (typeof visualization === 'string' && visualization.includes('failed')) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.hierarchyTree')}
        </Typography>
        <Alert severity="warning">{visualization}</Alert>
      </Box>
    );
  }
  
  if (visualization && typeof visualization === 'object' && visualization.data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.hierarchyTree')}
        </Typography>
        <Plot
          data={visualization.data.data}
          layout={visualization.data.layout}
          style={{ width: '100%', height: '600px' }}
          config={{ responsive: true }}
        />
      </Box>
    );
  }
  
  // 兼容旧格式（直接是字符串HTML）
  if (typeof visualization === 'string' && !visualization.includes('failed')) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.hierarchyTree')}
        </Typography>
        <Alert severity="info">Visualization data is being processed...</Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('results.hierarchyTree')}
      </Typography>
      <Alert severity="error">No visualization data available</Alert>
    </Box>
  );
};

const TopicsOverTimeVisualizationTab = ({ visualization }) => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current && visualization && typeof visualization === 'string' && !visualization.includes('failed')) {
      containerRef.current.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.srcdoc = visualization;
      containerRef.current.appendChild(iframe);
    }
  }, [visualization]);
  
  if (typeof visualization === 'string' && visualization.includes('failed')) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('results.topicsOverTime')}
        </Typography>
        <Alert severity="warning">{visualization}</Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('results.topicsOverTime')}
      </Typography>
      <div ref={containerRef} />
    </Box>
  );
};

export default ResultsDisplay;
