import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AssessmentIcon from '@mui/icons-material/Assessment';

const Navigation = () => {
  return (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              mr: 4,
              color: 'inherit',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Pension Management
          </Typography>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/dashboard"
              startIcon={<DashboardIcon />}
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/employees"
              startIcon={<PeopleIcon />}
            >
              Employees
            </Button>
            <Button
              component={RouterLink}
              to="/payroll"
              color="inherit"
              startIcon={<AttachMoneyIcon />}
              sx={{ mx: 1 }}
            >
              Pension Management
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/reports"
              startIcon={<AssessmentIcon />}
            >
              Reports
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;
