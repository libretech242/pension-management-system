import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
        textAlign: 'center'
      }}
    >
      <Typography variant="h1" sx={{ mb: 2, fontSize: '6rem', fontWeight: 'bold' }}>
        404
      </Typography>
      <Typography variant="h4" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        The page you are looking for might have been removed or is temporarily unavailable.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/')}
        sx={{ mt: 2 }}
      >
        Go to Homepage
      </Button>
    </Box>
  );
};

export default NotFound;
