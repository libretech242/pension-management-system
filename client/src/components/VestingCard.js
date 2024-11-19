import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  Tooltip,
} from '@mui/material';
import { calculateVesting } from '../services/pensionService';
import { format } from 'date-fns';

const VestingCard = ({ employeeData }) => {
  const vestingInfo = calculateVesting(employeeData);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Vesting Status
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Vesting Progress
            </Typography>
            <Typography variant="body2">
              {vestingInfo.vestingPercentage}%
            </Typography>
          </Box>
          <Tooltip
            title={`${vestingInfo.yearsOfService} years of service`}
            arrow
            placement="top"
          >
            <LinearProgress
              variant="determinate"
              value={vestingInfo.vestingPercentage}
              sx={{ height: 8, borderRadius: 2 }}
            />
          </Tooltip>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Years of Service
          </Typography>
          <Typography variant="body1">
            {vestingInfo.yearsOfService} years
          </Typography>
        </Box>

        {!vestingInfo.isFullyVested && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Full Vesting Date
            </Typography>
            <Typography variant="body1">
              {format(vestingInfo.projectedFullVestingDate, 'MM/dd/yyyy')}
            </Typography>
          </Box>
        )}

        {vestingInfo.isFullyVested && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="body1"
              color="success.main"
              sx={{ fontWeight: 'bold' }}
            >
              Fully Vested
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VestingCard;
