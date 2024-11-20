import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false // Changed to false since we're using token-based auth
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network Error - Please check your connection or the server status');
      return Promise.reject(new Error('Unable to connect to the server. Please check your connection.'));
    }

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('token'); // Clear invalid token
      window.location.href = '/login'; // Redirect to login
      return Promise.reject(error);
    }

    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// Employee endpoints
export const employeeAPI = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  batchImport: (data) => api.post('/employees/batch', data),
};

// Contribution endpoints
export const contributionAPI = {
  getAll: (params) => api.get('/pension/contributions', { params }),
  getSummary: () => api.get('/pension/contributions/summary'),
  getVestingStatus: (employeeId) => api.get(`/pension/contributions/vesting/${employeeId}`),
  create: (data) => api.post('/pension/contributions', data),
  update: (id, data) => api.put(`/pension/contributions/${id}`, data),
  delete: (id) => api.delete(`/pension/contributions/${id}`),
  batchProcess: (data) => api.post('/pension/contributions/batch', data),
};

// Reports endpoints
export const reportsAPI = {
  generateReport: (params) => api.get('/pension/reports/generate', { params }),
  downloadReport: (reportId) => api.get(`/pension/reports/download/${reportId}`, {
    responseType: 'blob'
  }),
  getStatistics: () => api.get('/pension/statistics'),
};

export default api;
