import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  People,
  AccountBalance,
  NotificationsActive,
  ArrowUpward,
  ArrowDownward,
  MoreVert,
  AttachMoney,
  Person,
  CalendarToday
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for the chart
const contributionData = [
  { month: 'Jan', amount: 4000 },
  { month: 'Feb', amount: 3000 },
  { month: 'Mar', amount: 5000 },
  { month: 'Apr', amount: 4500 },
  { month: 'May', amount: 6000 },
  { month: 'Jun', amount: 5500 },
];

// Mock data for recent activities
const recentActivities = [
  {
    id: 1,
    user: 'John Doe',
    action: 'Updated pension contribution',
    amount: '$500',
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    user: 'Jane Smith',
    action: 'Enrolled in pension plan',
    timestamp: '4 hours ago',
  },
  {
    id: 3,
    user: 'Mike Johnson',
    action: 'Modified investment allocation',
    timestamp: '1 day ago',
  },
];

const StatCard = ({ title, value, icon, trend, color }) => {
  const Icon = icon;
  const bgColorClass = {
    primary: 'bg-blue-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    error: 'bg-red-50'
  }[color];
  
  const iconColorClass = {
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  }[color];
  
  return (
    <Card className="h-full transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <CardContent className="p-6">
        <Box className="flex justify-between items-start">
          <Box>
            <Typography variant="subtitle2" className="text-gray-600 font-medium">
              {title}
            </Typography>
            <Typography variant="h4" className="my-2 font-bold">
              {value}
            </Typography>
            {trend && (
              <Box className="flex items-center">
                {trend > 0 ? (
                  <ArrowUpward className="text-green-500 text-sm" />
                ) : (
                  <ArrowDownward className="text-red-500 text-sm" />
                )}
                <Typography
                  variant="body2"
                  className={trend > 0 ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}
                >
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar className={`${bgColorClass} ${iconColorClass} p-2`}>
            <Icon />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  return (
    <Box className="p-6">
      <Typography variant="h4" className="mb-6 font-bold text-gray-900">
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value="1,234"
            icon={People}
            trend={12}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Contributions"
            value="$847,235"
            icon={AttachMoney}
            trend={8}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Plans"
            value="156"
            icon={AccountBalance}
            trend={-3}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Actions"
            value="23"
            icon={NotificationsActive}
            trend={5}
            color="error"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper className="p-6 rounded-xl shadow-md">
            <Box className="flex justify-between items-center mb-6">
              <Typography variant="h6" className="font-bold text-gray-900">
                Contribution Trends
              </Typography>
              <IconButton size="small" className="hover:bg-gray-100">
                <MoreVert />
              </IconButton>
            </Box>
            <Box className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={contributionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="month" className="text-gray-600" />
                  <YAxis className="text-gray-600" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper className="p-6 rounded-xl shadow-md h-full">
            <Box className="flex justify-between items-center mb-6">
              <Typography variant="h6" className="font-bold text-gray-900">
                Recent Activities
              </Typography>
              <Button 
                size="small" 
                className="text-blue-600 hover:bg-blue-50 normal-case"
              >
                View All
              </Button>
            </Box>
            <List className="divide-y divide-gray-200">
              {recentActivities.map((activity) => (
                <ListItem 
                  key={activity.id}
                  className="py-4 px-0 hover:bg-gray-50 transition-colors duration-150"
                >
                  <ListItemAvatar>
                    <Avatar className="bg-blue-100 text-blue-600">
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" className="font-medium text-gray-900">
                        {activity.user}
                      </Typography>
                    }
                    secondary={
                      <Box className="mt-1">
                        <Typography variant="body2" className="text-gray-600">
                          {activity.action}
                          {activity.amount && (
                            <span className="ml-1 font-medium text-green-600">
                              {activity.amount}
                            </span>
                          )}
                        </Typography>
                        <Typography variant="caption" className="text-gray-500 flex items-center mt-1">
                          <CalendarToday className="text-base mr-1" />
                          {activity.timestamp}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
