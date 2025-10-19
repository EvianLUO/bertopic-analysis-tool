import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  LinearProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as WordIcon,
  Archive as ArchiveIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import axios from 'axios';

const ExportModule = ({ results, data, onBack, onReset }) => {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState({});
  const [exportProgress, setExportProgress] = useState({});

  const getAvailableVisualizations = () => {
    if (!results?.visualizations) return [];
    return Object.keys(results.visualizations);
  };

  const handleExport = async (exportType) => {
    setExporting(prev => ({ ...prev, [exportType]: true }));
    setExportProgress(prev => ({ ...prev, [exportType]: 0 }));

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => ({
          ...prev,
          [exportType]: Math.min(prev[exportType] + 10, 90)
        }));
      }, 200);

      // Prepare different data based on export type
      let exportData = {};
      
      // Add debug information
      console.log('Export data for', exportType, ':', {
        results: results,
        data: data
      });
      
      if (exportType === 'annotated_data') {
        // Export annotated data needs original texts, topics and probabilities
        exportData = {
          texts: results?.texts || data?.texts || [],
          topics: results?.topics || data?.topics || [],
          probabilities: results?.probabilities || data?.probabilities || [],
          topic_info: results?.topic_info || data?.topic_info || []
        };
      } else if (exportType === 'visualizations') {
        // Export visualization results
        exportData = {
          visualizations: results?.visualizations || data?.visualizations || {}
        };
      } else if (exportType === 'topic_details') {
        // Export topic details
        exportData = {
          topic_info: results?.topic_info || data?.topic_info || [],
          model_info: results?.model_info || data?.model_info || {}
        };
      }
      
      console.log('Final export data:', exportData);

      const response = await axios.post(`http://localhost:5001/api/export/${exportType}`, exportData, {
        responseType: 'blob'
      });

      clearInterval(progressInterval);
      setExportProgress(prev => ({ ...prev, [exportType]: 100 }));

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = `export_${exportType}_${new Date().getTime()}`;
      
      // Add appropriate file extension based on export type
      if (exportType === 'visualizations') {
        filename += '.zip';
      } else if (exportType === 'annotated_data' || exportType === 'topic_details') {
        filename += '.xlsx';
      }
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${exportType} export successful!`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setExporting(prev => ({ ...prev, [exportType]: false }));
      setTimeout(() => {
        setExportProgress(prev => ({ ...prev, [exportType]: 0 }));
      }, 1000);
    }
  };

  const handleExportAll = async () => {
    const availableExports = ['visualizations', 'annotated_data', 'topic_details'];
    
    for (const exportType of availableExports) {
      await handleExport(exportType);
    }
  };

  const getFileSizeEstimate = (exportType) => {
    const vizCount = getAvailableVisualizations().length;
    const docCount = data?.preview?.length || 0;
    
    switch (exportType) {
      case 'visualizations':
        return `${vizCount * 2}MB`;
      case 'annotated_data':
        return `${Math.ceil(docCount / 1000)}MB`;
      case 'topic_details':
        return `${Math.ceil(docCount / 5000)}MB`;
      default:
        return 'Unknown';
    }
  };

  const ExportCard = ({ 
    title, 
    description, 
    icon, 
    exportType, 
    color = 'primary',
    disabled = false 
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Estimated size: {getFileSizeEstimate(exportType)}
          </Typography>
        </Box>

        {exporting[exportType] && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={exportProgress[exportType] || 0} 
            />
            <Typography variant="caption" color="text.secondary">
              {exportProgress[exportType] || 0}%
            </Typography>
          </Box>
        )}
      </CardContent>
      
      <CardActions>
        <Button
          variant="contained"
          color={color}
          startIcon={exporting[exportType] ? <CheckCircleIcon /> : <DownloadIcon />}
          onClick={() => handleExport(exportType)}
          disabled={disabled || exporting[exportType]}
          fullWidth
        >
          {exporting[exportType] ? 'Exporting...' : 'Export'}
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('export.title')}
      </Typography>

      {/* Export Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Analysis Results Summary
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Chip 
              label={`Topic Count: ${results?.model_info?.num_topics || 0}`} 
              color="primary" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Chip 
              label={`Document Count: ${results?.model_info?.num_documents || 0}`} 
              color="secondary" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Chip 
              label={`Generated Visualizations: ${getAvailableVisualizations().length} items`} 
              color="info" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Chip 
              label={`Analysis Time: ${new Date().toLocaleString()}`} 
              color="default" 
            />
          </Grid>
        </Grid>

        <Alert severity="info">
          This analysis generated {getAvailableVisualizations().length} visualization results
        </Alert>
      </Paper>

      {/* Export Options */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <ExportCard
            title={t('export.allVisualizations')}
            description="Export all generated visualization charts as ZIP package, containing interactive HTML files"
            icon={<ArchiveIcon color="primary" />}
            exportType="visualizations"
            color="primary"
            disabled={getAvailableVisualizations().length === 0}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <ExportCard
            title={t('export.annotatedData')}
            description="Export original data with topic annotations, including topic ID, topic name, keywords and other information"
            icon={<ExcelIcon color="success" />}
            exportType="annotated_data"
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <ExportCard
            title={t('export.topicDetails')}
            description="Export detailed topic analysis report, including topic statistics, keyword matrix, similarity and more"
            icon={<PdfIcon color="warning" />}
            exportType="topic_details"
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Export All */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('export.exportAll')}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Export all analysis results simultaneously, including visualization charts, annotated data and detailed reports
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<DownloadIcon />}
          onClick={handleExportAll}
          disabled={Object.values(exporting).some(v => v)}
          sx={{ mr: 2 }}
        >
          Export All
        </Button>
        
        <Typography variant="caption" color="text.secondary">
          Estimated total size: {getFileSizeEstimate('visualizations')} + {getFileSizeEstimate('annotated_data')} + {getFileSizeEstimate('topic_details')}
        </Typography>
      </Paper>

      {/* Export Content List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Export Content List
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <ArchiveIcon />
            </ListItemIcon>
            <ListItemText
              primary="Visualization Results Package"
              secondary={`Contains ${getAvailableVisualizations().length} interactive HTML charts`}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <ExcelIcon />
            </ListItemIcon>
            <ListItemText
              primary="Annotated Data File"
              secondary="Original data + Topic annotations + Keyword information"
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <PdfIcon />
            </ListItemIcon>
            <ListItemText
              primary="Topic Details Report"
              secondary="Contains detailed analysis report with multiple sheets"
            />
          </ListItem>
        </List>
      </Paper>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          {t('common.previous')}
        </Button>
        
        <Box>
          <Button 
            variant="outlined" 
            onClick={onReset}
            sx={{ mr: 2 }}
          >
            Restart
          </Button>
          <Button variant="contained" onClick={onReset}>
            Complete
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ExportModule;
