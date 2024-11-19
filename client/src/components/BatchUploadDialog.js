import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { processBatchContributions } from '../services/pensionService';

const BatchUploadDialog = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.split('\\n');
        const headers = rows[0].split(',');
        
        const contributionsData = rows.slice(1)
          .filter(row => row.trim())
          .map(row => {
            const values = row.split(',');
            const contribution = {};
            headers.forEach((header, index) => {
              contribution[header.trim()] = values[index]?.trim();
            });
            return contribution;
          });

        const results = processBatchContributions(contributionsData);
        setResults(results);
        
        if (results.summary.successful > 0) {
          onSuccess?.(results.successful);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Error processing file: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Batch Upload Contributions</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          {!results && (
            <>
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="raised-button-file">
                <Button variant="outlined" component="span">
                  Select CSV File
                </Button>
              </label>
              {file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {file.name}
                </Typography>
              )}
            </>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}

          {processing && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Processing contributions...
              </Typography>
            </Box>
          )}

          {results && (
            <Box sx={{ mt: 2 }}>
              <Alert
                severity={results.summary.failed > 0 ? 'warning' : 'success'}
                sx={{ mb: 2 }}
              >
                <AlertTitle>Upload Complete</AlertTitle>
                Successfully processed {results.summary.successful} of{' '}
                {results.summary.total} contributions
              </Alert>

              {results.failed.length > 0 && (
                <>
                  <Typography variant="h6" color="error" gutterBottom>
                    Failed Entries
                  </Typography>
                  <List>
                    {results.failed.map((fail, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`Row ${index + 1}`}
                          secondary={Object.entries(fail.errors)
                            .map(([field, error]) => `${field}: ${error}`)
                            .join(', ')}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          {results ? 'Close' : 'Cancel'}
        </Button>
        {!results && (
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!file || processing}
          >
            Upload
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BatchUploadDialog;
