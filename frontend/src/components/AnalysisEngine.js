import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Paper,
  Typography,
  Button,
  Box,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import axios from 'axios';

const AnalysisEngine = ({ data, onNext, onBack, onResultsGenerated }) => {
  const { t } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const analysisSteps = [
    { name: t('analysis.steps.preprocessing'), description: t('analysis.steps.preprocessingDesc') },
    { name: t('analysis.steps.embedding'), description: t('analysis.steps.embeddingDesc') },
    { name: t('analysis.steps.topics'), description: t('analysis.steps.topicsDesc') },
    { name: t('analysis.steps.visualization'), description: t('analysis.steps.visualizationDesc') },
    { name: t('analysis.steps.complete'), description: t('analysis.steps.completeDesc') }
  ];

  const getSelectedVisualizations = () => {
    const selected = [];
    Object.entries(data.visualizationOptions).forEach(([key, value]) => {
      if (value) selected.push(key);
    });
    return selected;
  };

  const calculateEstimatedTime = () => {
    const docCount = data.total_rows || data.preview?.length || 0;
    const vizCount = getSelectedVisualizations().length;
    
    let baseTime = 0;
    if (docCount < 100) baseTime = 60;
    else if (docCount < 1000) baseTime = 180;
    else if (docCount < 5000) baseTime = 300;
    else baseTime = 600;
    
    const vizTime = vizCount * 30;
    return Math.max(baseTime + vizTime, 60);
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentStep(0);
    setProgress(0);
    setError(null);
    setStartTime(Date.now());
    
    const totalTime = calculateEstimatedTime();
    setEstimatedTime(`${Math.ceil(totalTime / 60)} ${t('analysis.minutes')}`);

    try {
      // Prepare analysis data - use complete data instead of preview data
      const analysisData = {
        file_path: data.file_path, // Use correct file path
        file_type: data.file_type || 'excel', // Pass file type
        text_column: data.selectedTextColumn,
        timestamp_column: data.selectedTimestampColumn,
        config: data.config,
        preprocessing_config: data.preprocessingConfig,
        stopwords: data.stopwords,
        visualization_options: getSelectedVisualizations()
      };

      // Phased progress display
      for (let i = 0; i < analysisSteps.length - 1; i++) {
        setCurrentStep(i);
        setProgress((i / (analysisSteps.length - 1)) * 100);
        
        // Update elapsed time and remaining time
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
        
        const remaining = Math.max(0, Math.floor(totalTime - elapsed));
        setRemainingTime(remaining);
        
        // Simulate time for each step
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Send analysis request
      const response = await axios.post('http://localhost:5001/api/analyze', analysisData);
      
      if (response.data.success) {
        setResults(response.data);
        setProgress(100);
        setCurrentStep(analysisSteps.length - 1);
        
        // Calculate total elapsed time
        const totalElapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(totalElapsed);
        setRemainingTime(0);
        
        toast.success(t('analysis.completed', { time: totalElapsed, count: response.data.document_stats?.total_documents || 0 }));
      } else {
        throw new Error(response.data.error || 'Analysis failed');
      }

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || err.message || 'Error occurred during analysis');
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (results) {
      onResultsGenerated(results);
      onNext();
    }
  };

  const getStepIcon = (stepIndex) => {
    if (stepIndex < currentStep) {
      return <CheckCircleIcon color="success" />;
    } else if (stepIndex === currentStep && isAnalyzing) {
      return <CircularProgress size={20} color="primary" />;
    } else if (stepIndex === currentStep && error) {
      return <ErrorIcon color="error" />;
    }
    return null;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('analysis.title')}
      </Typography>

      {/* Analysis Configuration Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('analysis.configSummary')}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Chip label={`${t('analysis.documentCount')}: ${data.total_rows || data.preview?.length || 0}`} color="primary" />
          <Chip label={`${t('analysis.textColumn')}: ${data.selectedTextColumn}`} color="secondary" />
          {data.selectedTimestampColumn && (
            <Chip label={`${t('analysis.timestampColumn')}: ${data.selectedTimestampColumn}`} color="info" />
          )}
          <Chip label={`${t('analysis.minTopicSize')}: ${data.config.basic.minTopicSize}`} />
          <Chip label={`${t('analysis.selectedVisualizations')}: ${getSelectedVisualizations().length}${t('analysis.items')}`} />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" color="text.secondary">
          {t('analysis.estimatedTime')}: {estimatedTime || calculateEstimatedTime() + t('analysis.seconds')}
        </Typography>
      </Paper>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('analysis.processing')}
          </Typography>
          
          {/* Main Progress Bar */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('analysis.progress')}: {Math.round(progress)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('analysis.elapsedTime')}: {elapsedTime}{t('analysis.seconds')} | {t('analysis.remainingTime')}: {remainingTime}{t('analysis.seconds')}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                }
              }} 
            />
          </Box>

          {/* Current Step Information */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {analysisSteps[currentStep]?.name}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {analysisSteps[currentStep]?.description}
            </Typography>
          </Box>

          {/* Step List */}
          <Stepper activeStep={currentStep} orientation="vertical">
            {analysisSteps.map((step, index) => (
              <Step key={step.name}>
                <StepLabel
                  StepIconComponent={() => getStepIcon(index)}
                  optional={
                    index === currentStep && isAnalyzing ? (
                      <Typography variant="caption" color="primary">
                        {t('analysis.inProgress')}
                      </Typography>
                    ) : index < currentStep ? (
                      <Typography variant="caption" color="success.main">
                        {t('analysis.completed')}
                      </Typography>
                    ) : null
                  }
                >
                  {step.name}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Time Information */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Estimated Total Time:</strong> {estimatedTime} | 
              <strong> Elapsed:</strong> {elapsedTime}s | 
              <strong> Estimated Remaining:</strong> {remainingTime}s
            </Typography>
          </Alert>
        </Paper>
      )}

      {/* Error Information */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Analysis Results Summary */}
      {results && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('analysis.resultsSummary')}
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {t('analysis.topicCount')}
                </Typography>
                <Typography variant="h4">
                  {results.model_info?.num_topics || 0}
                </Typography>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {t('analysis.totalDocuments')}
                </Typography>
                <Typography variant="h4">
                  {results.model_info?.num_documents || 0}
                </Typography>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {t('analysis.noiseDocuments')}
                </Typography>
                <Typography variant="h4">
                  {results.model_info?.num_noise || 0}
                </Typography>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Generated Visualizations
                </Typography>
                <Typography variant="h4">
                  {Object.keys(results.visualizations || {}).length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Paper>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} disabled={isAnalyzing}>
          {t('common.previous')}
        </Button>
        
        {!isAnalyzing && !results && (
          <Button
            variant="contained"
            onClick={startAnalysis}
            startIcon={<PlayArrowIcon />}
            size="large"
          >
            {t('analysis.start')}
          </Button>
        )}
        
        {results && (
          <Button
            variant="contained"
            onClick={handleNext}
            size="large"
          >
            {t('common.next')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default AnalysisEngine;
