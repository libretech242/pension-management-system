import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  getAll: (params) => api.get('/contributions', { params }),
  getSummary: () => api.get('/contributions/summary'),
  getVestingStatus: (employeeId) => api.get(`/contributions/vesting/${employeeId}`),
  create: (data) => api.post('/contributions', data),
  update: (id, data) => api.put(`/contributions/${id}`, data),
  delete: (id) => api.delete(`/contributions/${id}`),
  batchProcess: (data) => api.post('/contributions/batch', data),
};

// Reports endpoints
export const reportsAPI = {
  generateReport: (params) => api.get('/reports/generate', { params }),
  downloadReport: (reportId) => api.get(`/reports/download/${reportId}`, {
    responseType: 'blob'
  }),
};

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server error
          break;
        default:
          // Handle other errors
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
