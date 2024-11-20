import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Password reset instructions have been sent to your email.
            </Alert>
            <Typography variant="body2" align="center">
              Didn't receive the email? Check your spam folder or{' '}
              <Button
                onClick={handleSubmit}
                disabled={loading}
                sx={{ textTransform: 'none' }}
              >
                click here to resend
              </Button>
            </Typography>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Enter your email address and we'll send you instructions to reset your
              password.
            </Typography>

            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send Reset Instructions'
              )}
            </Button>
          </form>
        )}

        <Typography variant="body2" align="center">
          Remember your password?{' '}
          <Link to="/login" style={{ textDecoration: 'none' }}>
            Back to Login
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
