import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Custom render that includes providers
export function renderWithProviders(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  return render(
    <BrowserRouter>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {ui}
      </LocalizationProvider>
    </BrowserRouter>
  );
}

// Mock response helper
export const mockResponse = (status, data, headers = {}) => {
  return Promise.resolve({
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(headers),
    json: () => Promise.resolve(data)
  });
};

// Mock error response helper
export const mockErrorResponse = (status, message) => {
  const error = new Error(message);
  error.response = { status, data: { message } };
  return Promise.reject(error);
};

// Test data generators
export const generateMockPension = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  employeeId: `EMP${Math.floor(Math.random() * 1000)}`,
  contributionAmount: Math.floor(Math.random() * 10000),
  contributionDate: new Date().toISOString(),
  status: 'Active',
  ...overrides
});

export const generateMockEmployee = (overrides = {}) => ({
  id: `emp-${Math.floor(Math.random() * 1000)}`,
  nibNumber: `NIB${Math.floor(10000000 + Math.random() * 90000000)}`,
  firstName: 'John',
  lastName: 'Doe',
  email: `john.doe${Math.floor(Math.random() * 1000)}@example.com`,
  dateOfBirth: '1990-01-01',
  employmentDate: '2020-01-01',
  employmentType: 'LINE_STAFF',
  department: 'Engineering',
  salary: 50000.00,
  employerContributionRate: 5.00,
  employeeContributionRate: 3.50,
  status: 'ACTIVE',
  role: 'EMPLOYEE',
  ...overrides
});

export const generateMockReport = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  reportType: 'Monthly Contributions',
  generatedDate: new Date().toISOString(),
  status: 'Completed',
  downloadUrl: `/reports/report-${Math.floor(Math.random() * 1000)}.pdf`,
  ...overrides
});
