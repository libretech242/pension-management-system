import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Snackbar,
  Avatar,
  Chip,
  Fade
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { pensionService, calculatePensionContributions } from '../services/pensionService';

const PensionManagement = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [statsData, employeesData, contributionsData] = await Promise.all([
        pensionService.getStatistics(),
        pensionService.getEmployees(),
        pensionService.getContributions()
      ]);
      setStats(statsData);
      setEmployees(employeesData);
      setContributions(contributionsData);
    } catch (err) {
      console.error('Data loading error:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRefresh = () => {
    loadInitialData();
  };

  // Overview Tab Content
  const OverviewTab = () => {
    if (!stats) return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress className="text-blue-600" />
      </div>
    );

    return (
      <div className="space-y-8 py-6">
        {/* Stats Cards */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper className="p-6 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 shadow-xl transform transition-all duration-200 hover:scale-105">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <PeopleIcon className="text-white" />
                </div>
                <div>
                  <Typography className="text-white/80 text-sm font-medium">
                    Total Employees
                  </Typography>
                  <Typography className="text-white text-2xl font-bold mt-1">
                    {stats.totalEmployees}
                  </Typography>
                </div>
              </div>
              <div className="mt-4 flex items-center text-white/70 text-sm">
                <TrendingUpIcon className="w-4 h-4 mr-1" />
                <span>Active in pension plan</span>
              </div>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper className="p-6 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 shadow-xl transform transition-all duration-200 hover:scale-105">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <AccountBalanceIcon className="text-white" />
                </div>
                <div>
                  <Typography className="text-white/80 text-sm font-medium">
                    Total Contributions
                  </Typography>
                  <Typography className="text-white text-2xl font-bold mt-1">
                    ${stats.totalContributions.toLocaleString()}
                  </Typography>
                </div>
              </div>
              <div className="mt-4 flex items-center text-white/70 text-sm">
                <TrendingUpIcon className="w-4 h-4 mr-1" />
                <span>Year to date</span>
              </div>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper className="p-6 rounded-xl bg-gradient-to-br from-amber-600 to-amber-400 shadow-xl transform transition-all duration-200 hover:scale-105">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingUpIcon className="text-white" />
                </div>
                <div>
                  <Typography className="text-white/80 text-sm font-medium">
                    Average Contribution
                  </Typography>
                  <Typography className="text-white text-2xl font-bold mt-1">
                    ${stats.averageContribution.toLocaleString()}
                  </Typography>
                </div>
              </div>
              <div className="mt-4 flex items-center text-white/70 text-sm">
                <TrendingUpIcon className="w-4 h-4 mr-1" />
                <span>Per employee</span>
              </div>
            </Paper>
          </Grid>
        </Grid>

        {/* Recent Activity Table */}
        <Paper className="rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-white border-b border-gray-200">
            <Typography variant="h6" className="font-semibold text-gray-900">
              Recent Activity
            </Typography>
          </div>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-semibold text-gray-900">Employee</TableCell>
                  <TableCell className="font-semibold text-gray-900">Action</TableCell>
                  <TableCell className="font-semibold text-gray-900 text-right">Amount</TableCell>
                  <TableCell className="font-semibold text-gray-900">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contributions.slice(0, 5).map((contribution) => (
                  <TableRow
                    key={contribution.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar 
                          className={`w-8 h-8 mr-3 ${
                            contribution.type === 'deposit' 
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {contribution.employeeName.charAt(0)}
                        </Avatar>
                        <span className="font-medium text-gray-900">
                          {contribution.employeeName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        contribution.type === 'deposit'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {contribution.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
                      ${contribution.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {format(new Date(contribution.date), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </div>
    );
  };

  // Contributions Tab Content
  const ContributionsTab = () => {
    const [contributionDialog, setContributionDialog] = useState(false);
    const [selectedContribution, setSelectedContribution] = useState(null);
    const [dateRange, setDateRange] = useState({ start: null, end: null });

    const handleAddContribution = () => {
      setSelectedContribution(null);
      setContributionDialog(true);
    };

    const handleEditContribution = (contribution) => {
      setSelectedContribution(contribution);
      setContributionDialog(true);
    };

    const handleDeleteContribution = async (id) => {
      try {
        await pensionService.deleteContribution(id);
        setSuccess('Contribution deleted successfully');
        loadInitialData();
      } catch (err) {
        setError('Failed to delete contribution');
        console.error('Delete error:', err);
      }
    };

    const handleExport = async () => {
      try {
        const data = await pensionService.generateReport({ 
          startDate: dateRange.start, 
          endDate: dateRange.end 
        });
        pensionService.exportToCSV(data, 'pension-contributions.csv');
        setSuccess('Report exported successfully');
      } catch (err) {
        setError('Failed to export report');
        console.error('Export error:', err);
      }
    };

    const ContributionDialog = () => {
      const [formData, setFormData] = useState({
        employeeId: selectedContribution?.employeeId || '',
        amount: selectedContribution?.amount || '',
        type: selectedContribution?.type || 'Employee',
        date: selectedContribution?.date ? new Date(selectedContribution.date) : new Date(),
      });

      const handleSubmit = async () => {
        try {
          if (selectedContribution) {
            await pensionService.updateContribution(selectedContribution.id, formData);
            setSuccess('Contribution updated successfully');
          } else {
            await pensionService.addContribution(formData);
            setSuccess('Contribution added successfully');
          }
          setContributionDialog(false);
          loadInitialData();
        } catch (err) {
          setError('Failed to save contribution');
          console.error('Save error:', err);
        }
      };

      return (
        <Dialog open={contributionDialog} onClose={() => setContributionDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedContribution ? 'Edit Contribution' : 'Add New Contribution'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  label="Employee"
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.pensionId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="Employee">Employee Contribution</MenuItem>
                  <MenuItem value="Employer">Employer Contribution</MenuItem>
                </Select>
              </FormControl>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Contribution Date"
                  value={formData.date}
                  onChange={(newDate) => setFormData({ ...formData, date: newDate })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setContributionDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>
              {selectedContribution ? 'Save Changes' : 'Add Contribution'}
            </Button>
          </DialogActions>
        </Dialog>
      );
    };

    return (
      <div className="space-y-6 py-6">
        <div className="flex justify-between items-center">
          <div className="space-x-4">
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From Date"
                value={dateRange.start}
                onChange={(newDate) => setDateRange({ ...dateRange, start: newDate })}
                renderInput={(params) => <TextField {...params} />}
              />
              <DatePicker
                label="To Date"
                value={dateRange.end}
                onChange={(newDate) => setDateRange({ ...dateRange, end: newDate })}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
          </div>
          <div className="space-x-4">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddContribution}
            >
              Add Contribution
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Pension ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contributions.map((contrib, index) => (
                <TableRow key={index}>
                  <TableCell>{format(new Date(contrib.date), 'MM/dd/yyyy')}</TableCell>
                  <TableCell>{contrib.employeeName}</TableCell>
                  <TableCell>{contrib.pensionId}</TableCell>
                  <TableCell>{contrib.type}</TableCell>
                  <TableCell align="right">${contrib.amount}</TableCell>
                  <TableCell>{contrib.status}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEditContribution(contrib)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteContribution(contrib.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <ContributionDialog />
      </div>
    );
  };

  // Employee Details Tab Content
  const EmployeeDetailsTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [pensionProjection, setPensionProjection] = useState(null);
    const [projectionError, setProjectionError] = useState(null);

    useEffect(() => {
      setFilteredEmployees(
        employees.filter((emp) =>
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.pensionId.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }, [searchTerm, employees]);

    const handleEmployeeSelect = (employee) => {
      setSelectedEmployee(employee);
      setProjectionError(null);
      
      try {
        if (!employee.salary || !employee.age || !employee.yearsOfService) {
          throw new Error('Missing required employee data for pension calculation');
        }

        const projection = calculatePensionContributions(
          employee.salary,
          'yearly',
          employee.age,
          employee.yearsOfService
        );
        setPensionProjection(projection);
      } catch (error) {
        console.error('Pension calculation error:', error);
        setProjectionError(error.message);
        setPensionProjection(null);
      }
    };

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box p={3}>
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      );
    }

    return (
      <div className="space-y-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <TextField
            className="w-1/3"
            label="Search Employees"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </div>

        <Grid container spacing={4}>
          {/* Employee List */}
          <Grid item xs={12} md={7}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee Name</TableCell>
                    <TableCell>Pension ID</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell align="right">Total Contributions</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">
                          {searchTerm ? 'No employees found matching your search' : 'No employees found'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <TableRow 
                        key={emp.id}
                        onClick={() => handleEmployeeSelect(emp)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <TableCell>{emp.name}</TableCell>
                        <TableCell>{emp.pensionId}</TableCell>
                        <TableCell>{format(new Date(emp.startDate), 'MM/dd/yyyy')}</TableCell>
                        <TableCell align="right">
                          ${emp.contributions.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emp.status}
                            color={emp.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployee(emp);
                              setOpenDialog(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Employee Pension Details */}
          <Grid item xs={12} md={5}>
            {selectedEmployee && (projectionError ? (
              <Paper className="p-6">
                <Alert 
                  severity="error"
                  icon={<ErrorIcon />}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => {
                        setSelectedEmployee(null);
                        setProjectionError(null);
                      }}
                    >
                      Clear
                    </Button>
                  }
                >
                  {projectionError}
                </Alert>
                <Typography variant="body2" color="text.secondary" className="mt-4">
                  Please ensure all required employee data (salary, age, and years of service) 
                  is properly set before calculating pension projections.
                </Typography>
              </Paper>
            ) : pensionProjection && (
              <Paper className="p-6 space-y-6">
                <Typography variant="h6" className="font-semibold mb-4">
                  Pension Projection for {selectedEmployee.name}
                </Typography>

                <div className="space-y-4">
                  {/* Current Contributions */}
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">
                      Current Contribution Rate
                    </Typography>
                    <Typography variant="h5" className="font-semibold">
                      {(pensionProjection.yearly.rate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Base rate: 6% + Age bonus: {selectedEmployee.age >= 50 ? '2%' : '0%'} + 
                      Service bonus: {
                        selectedEmployee.yearsOfService >= 20 ? '2%' : 
                        selectedEmployee.yearsOfService >= 10 ? '1%' : '0%'
                      }
                    </Typography>
                  </div>

                  {/* Monthly Contributions */}
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">
                      Monthly Contribution
                    </Typography>
                    <Typography variant="h5" className="font-semibold">
                      ${pensionProjection.monthly.contribution.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </Typography>
                  </div>

                  {/* Projected Pension */}
                  <div className="pt-4 border-t">
                    <Typography variant="subtitle2" color="text.secondary">
                      Projected Pension at Age {pensionProjection.projectedPension?.retirementAge || 65}
                    </Typography>
                    <Typography variant="h5" className="font-semibold">
                      ${(pensionProjection.projectedPension?.monthlyPension || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} /month
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Accumulated: ${(pensionProjection.projectedPension?.totalAccumulated || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </Typography>
                  </div>

                  {/* Assumptions */}
                  <div className="pt-4 border-t">
                    <Typography variant="subtitle2" color="text.secondary">
                      Calculation Assumptions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Return Rate: {((pensionProjection.projectedPension?.assumedReturnRate || 0.07) * 100).toFixed(1)}%<br />
                      • Inflation Rate: {((pensionProjection.projectedPension?.assumedInflationRate || 0.03) * 100).toFixed(1)}%<br />
                      • Withdrawal Rate: 4%<br />
                      • Years of Service: {selectedEmployee.yearsOfService} years
                    </Typography>
                  </div>
                </div>
              </Paper>
            ))}
          </Grid>
        </Grid>
      </div>
    );
  };

  if (loading && !stats && !employees.length && !contributions.length) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <CircularProgress className="text-blue-600" />
      </div>
    );
  }

  return (
    <Fade in={true}>
      <div className="min-h-screen bg-gray-50 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Typography variant="h4" className="font-bold text-gray-900">
              Pension Management
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              Manage employee pension plans and contributions
            </Typography>
          </div>
        </div>

        <Paper className="rounded-xl shadow-sm overflow-hidden">
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            className="bg-white border-b border-gray-200"
          >
            <Tab 
              label="Overview" 
              className={`font-medium px-6 ${currentTab === 0 ? 'text-blue-600' : 'text-gray-600'}`}
            />
            <Tab 
              label="Contributions" 
              className={`font-medium px-6 ${currentTab === 1 ? 'text-blue-600' : 'text-gray-600'}`}
            />
            <Tab 
              label="Employee Details" 
              className={`font-medium px-6 ${currentTab === 2 ? 'text-blue-600' : 'text-gray-600'}`}
            />
          </Tabs>

          <div className="bg-white p-6">
            {currentTab === 0 && <OverviewTab />}
            {currentTab === 1 && <ContributionsTab />}
            {currentTab === 2 && <EmployeeDetailsTab />}
          </div>
        </Paper>

        <Snackbar
          open={!!error || !!success || snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={error ? "error" : success ? "success" : snackbar.severity}
            className={`rounded-lg shadow-lg border ${
              error ? 'border-red-100' : success ? 'border-green-100' : 'border-blue-100'
            }`}
          >
            {error || success || snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </Fade>
  );
};

export default PensionManagement;
