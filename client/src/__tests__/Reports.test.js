import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Reports from '../pages/Reports';
import { pensionService } from '../services/pensionService';

// Mock the pension service
jest.mock('../services/pensionService', () => ({
  getReports: jest.fn(),
  getReportStatistics: jest.fn(),
  generateReport: jest.fn(),
  downloadReport: jest.fn(),
  deleteReport: jest.fn()
}));

// Mock data for testing
const mockReports = [
  {
    id: 1,
    reportType: 'Monthly Contributions',
    generatedDate: '2024-01-01',
    status: 'Completed',
    downloadUrl: '/reports/monthly-2024-01.pdf'
  },
  {
    id: 2,
    reportType: 'Annual Summary',
    generatedDate: '2024-01-01',
    status: 'Completed',
    downloadUrl: '/reports/annual-2023.pdf'
  }
];

const mockStatistics = {
  totalReports: 10,
  recentReports: 5,
  pendingReports: 2,
  failedReports: 0
};

// Wrap component with necessary providers
const renderWithProviders = (component) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {component}
    </LocalizationProvider>
  );
};

describe('Reports Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    pensionService.getReports.mockResolvedValue(mockReports);
    pensionService.getReportStatistics.mockResolvedValue(mockStatistics);
    pensionService.generateReport.mockResolvedValue(mockReports[0]);
    pensionService.downloadReport.mockResolvedValue({ data: 'mock-pdf-data' });
    pensionService.deleteReport.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    // Clean up after each test
    jest.resetAllMocks();
  });

  it('renders loading state initially', async () => {
    await act(async () => {
      renderWithProviders(<Reports />);
    });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('loads and displays reports data', async () => {
    await act(async () => {
      renderWithProviders(<Reports />);
    });

    await waitFor(() => {
      expect(screen.getByText('Monthly Contributions')).toBeInTheDocument();
      expect(screen.getByText('Annual Summary')).toBeInTheDocument();
    });
  });

  it('displays report statistics', async () => {
    await act(async () => {
      renderWithProviders(<Reports />);
    });

    await waitFor(() => {
      expect(screen.getByText('Total Reports: 10')).toBeInTheDocument();
      expect(screen.getByText('Recent Reports: 5')).toBeInTheDocument();
      expect(screen.getByText('Pending Reports: 2')).toBeInTheDocument();
    });
  });

  it('handles report generation', async () => {
    const newReport = {
      id: 3,
      reportType: 'Custom Report',
      generatedDate: '2024-01-02',
      status: 'Completed',
      downloadUrl: '/reports/custom.pdf'
    };

    pensionService.generateReport.mockResolvedValue(newReport);
    
    await act(async () => {
      renderWithProviders(<Reports />);
    });

    // Click generate report button
    const generateButton = screen.getByText('Generate Report');
    
    await act(async () => {
      fireEvent.click(generateButton);
    });

    // Fill in the form
    const reportTypeSelect = screen.getByLabelText('Report Type');
    
    await act(async () => {
      fireEvent.mouseDown(reportTypeSelect);
      const option = screen.getByText('Custom Report');
      fireEvent.click(option);
    });

    const submitButton = screen.getByText('Generate');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Verify API was called
    expect(pensionService.generateReport).toHaveBeenCalled();
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Report generated successfully')).toBeInTheDocument();
    });
  });

  it('handles report download', async () => {
    pensionService.downloadReport.mockResolvedValue({ data: 'mock-pdf-data' });
    
    await act(async () => {
      renderWithProviders(<Reports />);
    });

    await waitFor(() => {
      expect(screen.getByText('Monthly Contributions')).toBeInTheDocument();
    });

    // Click download button
    const downloadButtons = screen.getAllByTestId('DownloadIcon');
    const downloadButton = downloadButtons[0];
    
    await act(async () => {
      fireEvent.click(downloadButton);
    });

    // Verify API was called
    expect(pensionService.downloadReport).toHaveBeenCalledWith(mockReports[0].downloadUrl);
  });

  it('handles error states correctly', async () => {
    // Mock API error
    pensionService.getReports.mockRejectedValue(new Error('API Error'));
    
    await act(async () => {
      renderWithProviders(<Reports />);
    });

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load reports. Please try again.')).toBeInTheDocument();
    });
  });

  it('filters reports by date range', async () => {
    await act(async () => {
      renderWithProviders(<Reports />);
    });

    await waitFor(() => {
      expect(screen.getByText('Monthly Contributions')).toBeInTheDocument();
    });

    // Set date range
    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');

    await act(async () => {
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });
    });

    // Click filter button
    const filterButton = screen.getByText('Apply Filter');
    
    await act(async () => {
      fireEvent.click(filterButton);
    });

    // Verify API was called with correct parameters
    expect(pensionService.getReports).toHaveBeenCalledWith({
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });
  });

  it('handles report deletion', async () => {
    pensionService.deleteReport.mockResolvedValue({ success: true });
    
    await act(async () => {
      renderWithProviders(<Reports />);
    });

    await waitFor(() => {
      expect(screen.getByText('Monthly Contributions')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    const deleteButton = deleteButtons[0];
    
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Confirm deletion
    const confirmButton = screen.getByText('Confirm');
    
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    // Verify API was called
    expect(pensionService.deleteReport).toHaveBeenCalledWith(mockReports[0].id);
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Report deleted successfully')).toBeInTheDocument();
    });
  });
});
