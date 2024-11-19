import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Toolbar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  const calculatePensionContributions = (weeklySalary) => {
    const weeklyContribution = weeklySalary * 0.06;
    return {
      weekly: weeklyContribution,
      monthly: weeklyContribution * 4,
      yearly: weeklyContribution * 52,
      monthlySalary: weeklySalary * 4,
      yearlySalary: weeklySalary * 52
    };
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(employees.map(emp => emp.employeeId));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (employeeId) => {
    const selectedIndex = selected.indexOf(employeeId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, employeeId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleImportTemplate = () => {
    const template = [
      ['Employee ID', 'Pension ID', 'First Name', 'Last Name', 'Company', 'Email Address', 'Weekly Salary', 'Monthly Salary', 'Status']
    ];
    
    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employee_import_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleImportEmployees = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        const newEmployees = rows.slice(1).map(row => {
          const values = row.split(',');
          const weeklySalary = parseFloat(values[6]);
          const monthlySalary = parseFloat(values[7]) || weeklySalary * 4; 
          const yearlySalary = weeklySalary * 52;
          const weeklyContribution = weeklySalary * 0.06;
          const monthlyContribution = monthlySalary * 0.06;
          const yearlyContribution = yearlySalary * 0.06;
          
          return {
            employeeId: values[0],
            pensionId: values[1],
            firstName: values[2],
            lastName: values[3],
            company: values[4],
            email: values[5],
            weeklySalary: weeklySalary,
            monthlySalary: monthlySalary,
            yearlySalary: yearlySalary,
            weeklyContribution: weeklyContribution,
            monthlyContribution: monthlyContribution,
            yearlyContribution: yearlyContribution,
            status: values[8]
          };
        });
        setEmployees([...employees, ...newEmployees]);
      };
      reader.readAsText(file);
    }
  };

  const handleExportSelected = () => {
    const selectedEmployees = employees.filter(emp => selected.includes(emp.employeeId));
    const csvContent = [
      ['Employee ID', 'Pension ID', 'First Name', 'Last Name', 'Company', 'Email Address', 
       'Weekly Salary', 'Monthly Salary', 'Yearly Salary', 
       'Weekly Contribution', 'Monthly Contribution', 'Yearly Contribution', 'Status'],
      ...selectedEmployees.map(emp => [
        emp.employeeId, emp.pensionId, emp.firstName, emp.lastName, emp.company, emp.email,
        emp.weeklySalary, emp.monthlySalary, emp.yearlySalary,
        emp.weeklyContribution, emp.monthlyContribution, emp.yearlyContribution, emp.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employees_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleAddEmployee = () => {
    setEditMode(false);
    setCurrentEmployee(null);
    setOpenDialog(true);
  };

  const handleEditSelected = () => {
    if (selected.length === 1) {
      const employeeToEdit = employees.find(emp => emp.employeeId === selected[0]);
      setCurrentEmployee(employeeToEdit);
      setEditMode(true);
      setOpenDialog(true);
    }
  };

  const handleDeleteSelected = () => {
    setEmployees(employees.filter(emp => !selected.includes(emp.employeeId)));
    setSelected([]);
  };

  const EmployeeDialog = () => {
    const [formData, setFormData] = useState(
      currentEmployee || {
        employeeId: '',
        pensionId: '',
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        weeklySalary: '',
        status: 'Active'
      }
    );

    const handleSubmit = () => {
      const contributions = calculatePensionContributions(parseFloat(formData.weeklySalary));
      const newEmployee = {
        ...formData,
        ...contributions
      };

      if (editMode) {
        setEmployees(employees.map(emp => 
          emp.employeeId === currentEmployee.employeeId ? newEmployee : emp
        ));
      } else {
        setEmployees([...employees, newEmployee]);
      }
      setOpenDialog(false);
    };

    return (
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)', mt: 2 }}>
            {!editMode && (
              <>
                <TextField
                  label="Employee ID"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Pension ID"
                  value={formData.pensionId}
                  onChange={(e) => setFormData({ ...formData, pensionId: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  fullWidth
                />
              </>
            )}
            <TextField
              label="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              fullWidth
            />
            <TextField
              label="Weekly Salary"
              type="number"
              value={formData.weeklySalary}
              onChange={(e) => setFormData({ ...formData, weeklySalary: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Terminated">Terminated</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Save Changes' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Employee Management
      </Typography>

      <Toolbar sx={{ gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddEmployee}
        >
          Add Employee
        </Button>
        <input
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          id="import-file"
          onChange={handleImportEmployees}
        />
        <label htmlFor="import-file">
          <Button
            variant="outlined"
            component="span"
            startIcon={<FileUploadIcon />}
          >
            Import Employees
          </Button>
        </label>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleImportTemplate}
        >
          Download Template
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportSelected}
          disabled={selected.length === 0}
        >
          Export Selected
        </Button>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleEditSelected}
          disabled={selected.length !== 1}
        >
          Edit Selected
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDeleteSelected}
          disabled={selected.length === 0}
        >
          Delete Selected
        </Button>
      </Toolbar>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  onChange={handleSelectAll}
                  checked={employees.length > 0 && selected.length === employees.length}
                  indeterminate={selected.length > 0 && selected.length < employees.length}
                />
              </TableCell>
              <TableCell>Employee ID</TableCell>
              <TableCell>Pension ID</TableCell>
              <TableCell>First Name</TableCell>
              <TableCell>Last Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Weekly Salary</TableCell>
              <TableCell align="right">Monthly Salary</TableCell>
              <TableCell align="right">Yearly Salary</TableCell>
              <TableCell align="right">Weekly Contribution</TableCell>
              <TableCell align="right">Monthly Contribution</TableCell>
              <TableCell align="right">Yearly Contribution</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow
                key={employee.employeeId}
                selected={selected.includes(employee.employeeId)}
                hover
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(employee.employeeId)}
                    onChange={() => handleSelect(employee.employeeId)}
                  />
                </TableCell>
                <TableCell>{employee.employeeId}</TableCell>
                <TableCell>{employee.pensionId}</TableCell>
                <TableCell>{employee.firstName}</TableCell>
                <TableCell>{employee.lastName}</TableCell>
                <TableCell>{employee.company}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell align="right">${employee.weeklySalary}</TableCell>
                <TableCell align="right">${employee.monthlySalary}</TableCell>
                <TableCell align="right">${employee.yearlySalary}</TableCell>
                <TableCell align="right">${employee.weeklyContribution}</TableCell>
                <TableCell align="right">${employee.monthlyContribution}</TableCell>
                <TableCell align="right">${employee.yearlyContribution}</TableCell>
                <TableCell>{employee.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <EmployeeDialog />
    </Box>
  );
};

export default Employees;
