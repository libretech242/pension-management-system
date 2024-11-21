import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Container,
  Paper
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} className="login-container">
        <Box className="login-content">
          <div className="login-header">
            <div className="login-icon-wrapper">
              <LockOutlinedIcon className="login-icon" />
            </div>
            <Typography variant="h4" className="login-title">
              Welcome Back
            </Typography>
            <Typography variant="body1" className="login-subtitle">
              Sign in to Pension Management System
            </Typography>
          </div>

          {(error || authError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || authError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <TextField
              variant="outlined"
              margin="normal"
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
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className="login-button"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
