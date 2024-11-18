import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    company: '',
    employeeType: '',
  });
  const [loading, setLoading] = useState(false);

  const columns = [
    { field: 'nibNumber', headerName: 'NIB Number', width: 130 },
    { field: 'firstName', headerName: 'First Name', width: 130 },
    { field: 'lastName', headerName: 'Last Name', width: 130 },
    { field: 'position', headerName: 'Position', width: 130 },
    { field: 'employeeType', headerName: 'Type', width: 130 },
    { field: 'company', headerName: 'Company', width: 130 },
    {
      field: 'contributionPercentage',
      headerName: 'Contribution %',
      width: 130,
      valueFormatter: (params) => `${params.value}%`,
    },
  ];

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.company) params.append('company', filters.company);
      if (filters.employeeType) params.append('type', filters.employeeType);

      const response = await axios.get(`/api/employees?${params.toString()}`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Employee Management
        </Typography>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
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
          <Grid item xs={12} sm={6} md={4}>
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
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={employees}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            loading={loading}
            disableSelectionOnClick
          />
        </div>
      </Paper>
    </Container>
  );
};

export default EmployeeManagement;
