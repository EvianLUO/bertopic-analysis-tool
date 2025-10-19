import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Container,
  Paper
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';

import FileUpload from './components/FileUpload';
import DataPreprocessing from './components/DataPreprocessing';
import ParameterConfiguration from './components/ParameterConfiguration';
import AnalysisEngine from './components/AnalysisEngine';
import ResultsDisplay from './components/ResultsDisplay';
import ExportModule from './components/ExportModule';

const steps = [
  'upload',
  'preprocessing', 
  'configuration',
  'analysis',
  'results',
  'export'
];

function App() {
  const { t, i18n } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  const handleLanguageChange = () => {
    const newLang = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(newLang);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setAnalysisData(null);
    setAnalysisResults(null);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <FileUpload 
            onNext={handleNext}
            onDataLoaded={setAnalysisData}
          />
        );
      case 1:
        return (
          <DataPreprocessing 
            data={analysisData}
            onNext={handleNext}
            onBack={handleBack}
            onDataUpdated={setAnalysisData}
          />
        );
      case 2:
        return (
          <ParameterConfiguration 
            data={analysisData}
            onNext={handleNext}
            onBack={handleBack}
            onConfigUpdated={setAnalysisData}
          />
        );
      case 3:
        return (
          <AnalysisEngine 
            data={analysisData}
            onNext={handleNext}
            onBack={handleBack}
            onResultsGenerated={setAnalysisResults}
          />
        );
      case 4:
        return (
          <ResultsDisplay 
            results={analysisResults}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <ExportModule 
            results={analysisResults}
            data={analysisData}
            onBack={handleBack}
            onReset={handleReset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('app.title')}
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<LanguageIcon />}
            onClick={handleLanguageChange}
          >
            {t('language.switch')}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            {t('app.title')}
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            {t('app.subtitle')}
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{t(`navigation.${label}`)}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 400 }}>
            {renderStepContent(activeStep)}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
