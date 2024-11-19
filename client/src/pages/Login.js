import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <div className="login-icon-wrapper">
            <LockOutlinedIcon className="login-icon" />
          </div>
          <Typography variant="h1" className="login-title">
            Welcome Back
          </Typography>
          <Typography variant="body1" className="login-subtitle">
            Sign in to Pension Management System
          </Typography>
        </div>

        <div className="login-form-container">
          {error && (
            <Alert severity="error" className="error-alert">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
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
              />
            </div>

            <div className="form-field">
              <TextField
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
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              className="login-button"
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="login-links">
              <Link to="/forgot-password" className="login-link">
                Forgot your password?
              </Link>
              <Link to="/register" className="login-link">
                Create an account
              </Link>
            </div>
          </form>
        </div>

        <Typography className="login-footer">
          {new Date().getFullYear()} Pension Management System. All rights reserved.
        </Typography>
      </div>
    </div>
  );
};

export default Login;
