import React, { useState } from 'react';
import {
  Container,
  Paper,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Box,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const Input = styled('input')({
  display: 'none',
});

const UploadBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  marginBottom: theme.spacing(3),
}));

function PensionManagement() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setUploadProgress(0);

      const response = await axios.post('/api/pension/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      setSuccess('File uploaded and processed successfully!');
      setFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'An error occurred while uploading the file'
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Pension Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <UploadBox>
        <Typography variant="h6" gutterBottom>
          Upload Pension Data
        </Typography>
        <Box sx={{ mb: 2 }}>
          <label htmlFor="pension-file">
            <Input
              accept=".csv"
              id="pension-file"
              type="file"
              onChange={handleFileChange}
            />
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
            >
              Select CSV File
            </Button>
          </label>
          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected file: {file.name}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!file || loading}
        >
          Upload and Process
        </Button>
      </UploadBox>

      {loading && (
        <Box sx={{ width: '100%' }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {uploadProgress}% Uploaded
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default PensionManagement;
