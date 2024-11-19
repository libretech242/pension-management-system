import React from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import LanguageIcon from '@mui/icons-material/Language';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const Settings = () => {
  const [settings, setSettings] = React.useState({
    notifications: true,
    twoFactor: false,
    darkMode: false,
    emailUpdates: true
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const settingsItems = [
    {
      title: 'Enable Notifications',
      description: 'Receive alerts about pension updates and changes',
      icon: <NotificationsIcon />,
      setting: 'notifications',
      help: 'Get instant notifications for important updates and changes to your pension plan.'
    },
    {
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      icon: <SecurityIcon />,
      setting: 'twoFactor',
      help: 'Protect your account with an additional verification step.'
    },
    {
      title: 'Dark Mode',
      description: 'Switch between light and dark theme',
      icon: <DarkModeIcon />,
      setting: 'darkMode',
      help: 'Enable dark mode for a more comfortable viewing experience in low-light conditions.'
    },
    {
      title: 'Language',
      description: 'English (US)',
      icon: <LanguageIcon />,
      setting: 'language',
      disabled: true,
      help: 'Change the display language of the application.'
    }
  ];

  return (
    <Box className="p-6">
      <div className="mb-8">
        <Typography variant="h4" className="font-bold text-gray-900">
          Settings
        </Typography>
        <Typography variant="body1" className="mt-2 text-gray-600">
          Manage your account preferences and system settings
        </Typography>
      </div>

      <Paper className="rounded-xl shadow-md">
        <List className="divide-y divide-gray-200">
          {settingsItems.map((item, index) => (
            <ListItem
              key={item.title}
              className="p-4 hover:bg-gray-50 transition-colors duration-150"
            >
              <ListItemIcon>
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  {item.icon}
                </div>
              </ListItemIcon>
              <ListItemText 
                primary={
                  <div className="flex items-center">
                    <Typography variant="subtitle1" className="font-medium text-gray-900">
                      {item.title}
                    </Typography>
                    <Tooltip title={item.help} arrow placement="top">
                      <IconButton size="small" className="ml-2 text-gray-400 hover:text-gray-600">
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                }
                secondary={
                  <Typography variant="body2" className="text-gray-600 mt-1">
                    {item.description}
                  </Typography>
                }
                className="mx-4"
              />
              {!item.disabled && (
                <Switch
                  edge="end"
                  checked={settings[item.setting]}
                  onChange={() => handleToggle(item.setting)}
                  className={`${
                    settings[item.setting] ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200`}
                />
              )}
            </ListItem>
          ))}
        </List>
      </Paper>

      <Typography variant="body2" className="mt-8 text-center text-gray-500">
        Version 1.0.0 • Last updated {new Date().toLocaleDateString()}
      </Typography>
    </Box>
  );
};

export default Settings;
