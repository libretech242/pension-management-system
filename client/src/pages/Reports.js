import React from 'react';
import {
  Container,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';

const Reports = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    company: '',
    employeeType: '',
  });
  const [reportData, setReportData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const [reportResponse, summaryResponse] = await Promise.all([
        axios.get(`/api/pensions?${params.toString()}`),
        axios.get(`/api/reports/summary?${params.toString()}`)
      ]);

      setReportData(reportResponse.data);
      setSummary(summaryResponse.data);
    } catch (error) {
      setError('Error fetching report data. Please try again.');
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`/api/reports/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pension-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Error exporting report. Please try again.');
      console.error('Error exporting report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Pension Reports
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Company</InputLabel>
              <Select
                name="company"
                value={filters.company}
                label="Company"
                onChange={handleFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ACME Corp">ACME Corp</MenuItem>
                <MenuItem value="Tech Inc">Tech Inc</MenuItem>
                <MenuItem value="Global Ltd">Global Ltd</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Employee Type</InputLabel>
              <Select
                name="employeeType"
                value={filters.employeeType}
                label="Employee Type"
                onChange={handleFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="management">Management</MenuItem>
                <MenuItem value="line staff">Line Staff</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Button
            variant="contained"
            onClick={fetchReport}
            disabled={loading}
          >
            Generate Report
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={loading || !reportData}
          >
            Export to CSV
          </Button>

          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>

        {summary && (
          <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Summary Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Contributions
                </Typography>
                <Typography variant="h6">
                  ${summary.totalContributions.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Average Contribution
                </Typography>
                <Typography variant="h6">
                  ${summary.averageContribution.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Number of Contributions
                </Typography>
                <Typography variant="h6">
                  {summary.contributionCount}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {reportData && reportData.contributions && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>NIB Number</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.contributions.map((contribution) => (
                  <TableRow key={contribution.id}>
                    <TableCell>
                      {`${contribution.employee.firstName} ${contribution.employee.lastName}`}
                    </TableCell>
                    <TableCell>{contribution.employee.nibNumber}</TableCell>
                    <TableCell>{contribution.employee.company}</TableCell>
                    <TableCell>
                      {new Date(contribution.contributionDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      ${contribution.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default Reports;
