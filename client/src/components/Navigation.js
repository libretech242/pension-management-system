import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';

const Navigation = () => {
  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: '#1a237e',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            color: '#ffffff',
            fontWeight: 'bold'
          }}
        >
          Pension Management System
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
