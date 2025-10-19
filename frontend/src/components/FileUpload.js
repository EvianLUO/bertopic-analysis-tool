import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import {
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import axios from 'axios';

const FileUpload = ({ onNext, onDataLoaded }) => {
  const { t } = useTranslation();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedTextColumn, setSelectedTextColumn] = useState('');
  const [selectedTimestampColumn, setSelectedTimestampColumn] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);  // 添加总行数状态

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // 检查文件格式
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('errors.fileFormat'));
      return;
    }

    // 检查文件大小 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error(t('errors.fileSize'));
      return;
    }

    setLoading(true);
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPreviewData(response.data.preview);
      setColumns(response.data.columns);
      setTotalRows(response.data.total_rows || 0);  // 保存总行数到状态
      
      // 显示文档统计信息
      const totalRows = response.data.total_rows || 0;
      const previewRows = response.data.preview?.length || 0;
      toast.success(`File uploaded successfully! Total ${totalRows} rows, preview shows first ${previewRows} rows`);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || error.message || t('errors.uploadFailed');
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  const handleNext = () => {
    if (!selectedTextColumn) {
      toast.error(t('upload.selectTextColumnError'));
      return;
    }

    const data = {
      file: uploadedFile,
      preview: previewData,
      columns: columns,
      selectedTextColumn: selectedTextColumn,
      selectedTimestampColumn: selectedTimestampColumn || null,
      file_path: uploadedFile.name,
      file_type: uploadedFile.type.includes('word') ? 'word' : 'excel',
      total_rows: totalRows || 0  // 使用实际的总行数，而不是预览数据长度
    };

    onDataLoaded(data);
    onNext();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('upload.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('upload.subtitle')}
      </Typography>

      {/* 文件上传区域 */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          mb: 3,
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? t('upload.dragDrop') : t('upload.dragDrop')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('upload.supportedFormats')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('upload.maxSize')}
        </Typography>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* 数据预览和列选择 */}
      {previewData && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {t('upload.preview')} ({t('upload.totalRows', { count: totalRows })} {t('upload.displayFirst10')})
          </Typography>

          {/* 列选择 */}
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('upload.selectColumn')}</InputLabel>
              <Select
                value={selectedTextColumn}
                onChange={(e) => setSelectedTextColumn(e.target.value)}
                label={t('upload.selectColumn')}
              >
                {columns.map((column) => (
                  <MenuItem key={column} value={column}>
                    {column}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t('upload.selectTimestamp')}</InputLabel>
              <Select
                value={selectedTimestampColumn}
                onChange={(e) => setSelectedTimestampColumn(e.target.value)}
                label={t('upload.selectTimestamp')}
              >
                <MenuItem value="">
                  <em>{t('upload.none')}</em>
                </MenuItem>
                {columns.map((column) => (
                  <MenuItem key={column} value={column}>
                    {column}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 数据预览表格 */}
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      {column}
                      {column === selectedTextColumn && (
                        <Chip label={t('upload.textColumn')} size="small" color="primary" sx={{ ml: 1 }} />
                      )}
                      {column === selectedTimestampColumn && (
                        <Chip label={t('upload.timestampColumn')} size="small" color="secondary" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.slice(0, 10).map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column}>
                        {typeof row[column] === 'string' && row[column].length > 100
                          ? `${row[column].substring(0, 100)}...`
                          : row[column]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {previewData.length > 10 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Display first 10 rows, total {previewData.length} rows
            </Typography>
          )}
        </Box>
      )}

      {/* 下一步按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!selectedTextColumn}
          startIcon={<DescriptionIcon />}
        >
          {t('upload.next')}
        </Button>
      </Box>
    </Box>
  );
};

export default FileUpload;
