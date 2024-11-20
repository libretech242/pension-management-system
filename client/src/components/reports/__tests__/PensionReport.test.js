import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import axios from 'axios';
import { message } from 'antd';
import PensionReport from '../PensionReport';
import { AuthContext } from '../../../contexts/AuthContext';
import { exportReport } from '../../../utils/reportExport';

// Mock dependencies
jest.mock('axios');
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));
jest.mock('../../../utils/reportExport');

describe('PensionReport', () => {
  const mockUser = {
    id: '123',
    name: 'Test User'
  };

  const mockReportData = [
    {
      name: 'Department A',
      employeeContribution: 1000,
      employerContribution: 1000
    },
    {
      name: 'Department B',
      employeeContribution: 1500,
      employerContribution: 1500
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithAuth = (component) => {
    return render(
      <AuthContext.Provider value={{ currentUser: mockUser }}>
        {component}
      </AuthContext.Provider>
    );
  };

  it('renders without crashing', () => {
    renderWithAuth(<PensionReport />);
    expect(screen.getByText('Pension Report')).toBeInTheDocument();
  });

  it('shows loading state when fetching data', async () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));
    
    renderWithAuth(<PensionReport />);
    
    // Trigger a filter action
    fireEvent.click(screen.getByText('Filter'));
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    const errorMessage = 'API Error';
    axios.get.mockRejectedValueOnce(new Error(errorMessage));

    renderWithAuth(<PensionReport />);
    
    // Trigger a filter action
    fireEvent.click(screen.getByText('Filter'));
    
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Failed to fetch report data. Please try again later.');
    });
  });

  it('displays report data when API call succeeds', async () => {
    axios.get.mockResolvedValueOnce({ data: { data: mockReportData } });

    renderWithAuth(<PensionReport />);
    
    // Trigger a filter action
    fireEvent.click(screen.getByText('Filter'));
    
    await waitFor(() => {
      expect(screen.getByText('Department A')).toBeInTheDocument();
      expect(screen.getByText('Department B')).toBeInTheDocument();
    });
  });

  it('exports report in Excel format', async () => {
    axios.get.mockResolvedValueOnce({ data: { data: mockReportData } });

    renderWithAuth(<PensionReport />);
    
    // Load data first
    fireEvent.click(screen.getByText('Filter'));
    
    await waitFor(() => {
      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });

    // Click export button and select Excel
    fireEvent.click(screen.getByText('Export Report'));
    fireEvent.click(screen.getByText('Export as Excel'));

    await waitFor(() => {
      expect(exportReport).toHaveBeenCalledWith(
        mockReportData,
        'summary',
        'excel',
        expect.any(Object)
      );
      expect(message.success).toHaveBeenCalledWith('Report exported successfully as EXCEL');
    });
  });

  it('shows warning when trying to export without data', async () => {
    renderWithAuth(<PensionReport />);
    
    // Try to export without data
    fireEvent.click(screen.getByText('Export Report'));
    fireEvent.click(screen.getByText('Export as Excel'));

    await waitFor(() => {
      expect(message.warning).toHaveBeenCalledWith('No data available to export');
    });
  });

  it('handles export errors gracefully', async () => {
    axios.get.mockResolvedValueOnce({ data: { data: mockReportData } });
    const exportError = new Error('Export failed');
    exportReport.mockRejectedValueOnce(exportError);

    renderWithAuth(<PensionReport />);
    
    // Load data first
    fireEvent.click(screen.getByText('Filter'));
    
    await waitFor(() => {
      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });

    // Try to export
    fireEvent.click(screen.getByText('Export Report'));
    fireEvent.click(screen.getByText('Export as Excel'));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith(`Failed to export report: ${exportError.message}`);
    });
  });
});
