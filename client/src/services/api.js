import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Debug logging for API URL
console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Enable credentials for CORS
});

// Debug request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      url: `${config.baseURL}${config.url}`,
      method: config.method,
      headers: config.headers,
      data: config.data,
      withCredentials: config.withCredentials
    });
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Interceptor Error:', {
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    return Promise.reject(error);
  }
);

// Debug response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response Interceptor Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: error.config
    });
    
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
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
