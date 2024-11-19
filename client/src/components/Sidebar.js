import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
  { text: 'Pension Management', icon: <AccountBalanceIcon />, path: '/pension-management' },
  { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1a237e !important',
          color: '#ffffff !important',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          position: 'fixed',
          height: '100vh',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%', backgroundColor: '#1a237e' }}>
        <Box 
          sx={{ 
            p: 2, 
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: '#1a237e'
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#ffffff',
              fontWeight: 'bold',
            }}
          >
            Pension Management
          </Typography>
        </Box>
        <List sx={{ backgroundColor: '#1a237e' }}>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.08) !important' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.12) !important'
                },
                marginBottom: '4px',
              }}
            >
              <ListItemIcon sx={{ color: '#ffffff !important', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiTypography-root': { 
                    color: '#ffffff',
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
