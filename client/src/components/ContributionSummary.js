import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider,
} from '@mui/material';
import { formatCurrency } from '../services/pensionService';

const ContributionSummary = ({ contributionData }) => {
  const {
    totalContributions,
    employeeContributions,
    employerContributions,
    averageContribution,
    totalParticipants,
    activeParticipants,
  } = contributionData;

  const StatItem = ({ label, value, secondary }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h6">
        {typeof value === 'number' && value.toString().includes('.') 
          ? formatCurrency(value)
          : value}
      </Typography>
      {secondary && (
        <Typography variant="body2" color="text.secondary">
          {secondary}
        </Typography>
      )}
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Contribution Summary
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatItem
              label="Total Contributions"
              value={totalContributions}
              secondary={`From ${totalParticipants} participants`}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatItem
              label="Employee Contributions"
              value={employeeContributions}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatItem
              label="Employer Contributions"
              value={employerContributions}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StatItem
              label="Average Contribution"
              value={averageContribution}
              secondary="Per participant"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StatItem
              label="Active Participants"
              value={activeParticipants}
              secondary={`Out of ${totalParticipants} total`}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ContributionSummary;
