import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  IconButton,
  Fade,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import FilterListIcon from '@mui/icons-material/FilterList';
import BarChartIcon from '@mui/icons-material/BarChart';
import { format } from 'date-fns';

const Reports = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reportType, setReportType] = useState('contributions');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const reportTypes = [
    { value: 'contributions', label: 'Contribution Report', color: 'bg-emerald-500' },
    { value: 'distributions', label: 'Distribution Report', color: 'bg-blue-500' },
    { value: 'performance', label: 'Performance Report', color: 'bg-amber-500' },
    { value: 'compliance', label: 'Compliance Report', color: 'bg-purple-500' }
  ];

  const mockData = [
    { id: 1, date: '2023-11-01', type: 'Contribution', amount: 5000, status: 'Completed' },
    { id: 2, date: '2023-11-05', type: 'Distribution', amount: 2500, status: 'Pending' },
    { id: 3, date: '2023-11-10', type: 'Contribution', amount: 7500, status: 'Completed' },
    { id: 4, date: '2023-11-15', type: 'Distribution', amount: 3000, status: 'Completed' },
  ];

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const styles = status === 'Completed' 
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      : 'bg-amber-50 text-amber-700 ring-amber-600/20';
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles}`}>
        {status}
      </span>
    );
  };

  return (
    <Fade in={true}>
      <Box className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Typography variant="h4" className="font-bold text-gray-900">
              Reports Dashboard
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              Generate and manage your pension reports
            </Typography>
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip title="Download Report">
              <IconButton className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Report">
              <IconButton className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Filter Section */}
        <Paper className="p-6 rounded-xl shadow-sm bg-white border border-gray-100">
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Report Type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="rounded-lg"
              >
                {reportTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value} className="hover:bg-gray-50">
                    <Box className="flex items-center py-1">
                      <span className={`w-3 h-3 rounded-full mr-2 ${option.color}`} />
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  renderInput={(params) => <TextField {...params} fullWidth className="rounded-lg" />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  renderInput={(params) => <TextField {...params} fullWidth className="rounded-lg" />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleGenerateReport}
                disabled={loading}
                className="h-14 rounded-lg text-base font-medium bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400"
              >
                {loading ? (
                  <CircularProgress size={24} className="text-white" />
                ) : (
                  <div className="flex items-center justify-center">
                    <BarChartIcon className="mr-2" />
                    Generate
                  </div>
                )}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Table Section */}
        <Paper className="rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="p-4 bg-white border-b border-gray-200">
            <Typography variant="h6" className="font-semibold text-gray-900">
              Recent Reports
            </Typography>
          </div>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-semibold text-gray-900">Date</TableCell>
                  <TableCell className="font-semibold text-gray-900">Type</TableCell>
                  <TableCell className="font-semibold text-gray-900 text-right">Amount</TableCell>
                  <TableCell className="font-semibold text-gray-900 text-center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockData.map((row) => (
                  <TableRow 
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <TableCell className="text-gray-700">
                      {format(new Date(row.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-gray-700">{row.type}</TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
                      ${row.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusChip(row.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setError(null)} 
            severity="error" 
            className="rounded-lg shadow-lg border border-red-100"
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={success}
          autoHideDuration={3000}
          onClose={() => setSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            severity="success" 
            className="rounded-lg shadow-lg border border-green-100"
          >
            Report generated successfully!
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default Reports;
