import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';
import { format } from 'date-fns';

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    kpis: {},
    contributionTrends: [],
    employeeDistribution: [],
    topContributors: [],
  });

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [kpisResponse, trendsResponse, distributionResponse, topContributorsResponse] = 
          await Promise.all([
            axios.get('/api/reports/kpis'),
            axios.get('/api/reports/contribution-trends'),
            axios.get('/api/reports/employee-distribution'),
            axios.get('/api/reports/top-contributors'),
          ]);

        setDashboardData({
          kpis: kpisResponse.data,
          contributionTrends: trendsResponse.data,
          employeeDistribution: distributionResponse.data,
          topContributors: topContributorsResponse.data,
        });
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const KPICard = ({ title, value, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div">
          {typeof value === 'number' && value.toString().includes('.') 
            ? formatCurrency(value)
            : value}
        </Typography>
        {subtitle && (
          <Typography color="textSecondary" sx={{ fontSize: 14 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Pension Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Contributions"
            value={dashboardData.kpis.totalContributions}
            subtitle="All time"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Average Contribution"
            value={dashboardData.kpis.averageContribution}
            subtitle="Per employee"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Employees"
            value={dashboardData.kpis.totalEmployees}
            subtitle="Active"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="YoY Growth"
            value={`${dashboardData.kpis.yoyGrowth}%`}
            subtitle="vs. last year"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Contribution Trends */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Contribution Trends
            </Typography>
            <ResponsiveContainer>
              <LineChart data={dashboardData.contributionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM yyyy')}
                />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Contributions']}
                  labelFormatter={(date) => format(new Date(date), 'MMMM yyyy')}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Employee Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Employee Distribution
            </Typography>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={dashboardData.employeeDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {dashboardData.employeeDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Employees']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Contributors */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Top Contributors
            </Typography>
            <ResponsiveContainer>
              <BarChart data={dashboardData.topContributors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Contributions']}
                />
                <Legend />
                <Bar
                  dataKey="amount"
                  fill={theme.palette.primary.main}
                  name="Total Contributions"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
