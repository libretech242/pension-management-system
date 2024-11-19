import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import PensionManagement from '../pages/PensionManagement';
import { pensionService } from '../services/pensionService';

// Mock the pension service
jest.mock('../services/pensionService');

// Mock data for testing
const mockStats = {
  totalEmployees: 100,
  activeContributors: 95,
  totalContributions: 250000,
  averageContribution: 2500,
  employerTotal: 125000,
  employeeTotal: 125000
};

const mockEmployees = [
  {
    id: 1,
    name: 'John Doe',
    pensionId: 'PEN001',
    status: 'Active',
    startDate: '2023-01-01',
    contributions: []
  },
  {
    id: 2,
    name: 'Jane Smith',
    pensionId: 'PEN002',
    status: 'Active',
    startDate: '2023-02-01',
    contributions: []
  }
];

const mockContributions = [
  {
    id: 1,
    date: '2024-01-01',
    employeeId: 1,
    employeeName: 'John Doe',
    pensionId: 'PEN001',
    amount: 500,
    type: 'Employee',
    status: 'Active'
  },
  {
    id: 2,
    date: '2024-01-01',
    employeeId: 1,
    employeeName: 'John Doe',
    pensionId: 'PEN001',
    amount: 500,
    type: 'Employer',
    status: 'Active'
  }
];

// Wrap component with necessary providers
const renderWithProviders = (component) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {component}
    </LocalizationProvider>
  );
};

describe('PensionManagement Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    pensionService.getStatistics.mockResolvedValue(mockStats);
    pensionService.getEmployees.mockResolvedValue(mockEmployees);
    pensionService.getContributions.mockResolvedValue(mockContributions);
  });

  it('renders loading state initially', async () => {
    await act(async () => {
      renderWithProviders(<PensionManagement />);
    });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('loads and displays overview data', async () => {
    await act(async () => {
      renderWithProviders(<PensionManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('Total Employees')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Active Contributors: 95')).toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', async () => {
    await act(async () => {
      renderWithProviders(<PensionManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Click Contributions tab
    await act(async () => {
      fireEvent.click(screen.getByText('Contributions'));
    });
    expect(screen.getByText('Add Contribution')).toBeInTheDocument();

    // Click Employee Details tab
    await act(async () => {
      fireEvent.click(screen.getByText('Employee Details'));
    });
    expect(screen.getByText('Search Employees')).toBeInTheDocument();
  });

  it('handles adding a new contribution', async () => {
    pensionService.addContribution.mockResolvedValue({ id: 3, ...mockContributions[0] });
    
    await act(async () => {
      renderWithProviders(<PensionManagement />);
    });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Contributions')).toBeInTheDocument();
    });

    // Switch to Contributions tab
    await act(async () => {
      fireEvent.click(screen.getByText('Contributions'));
    });

    // Click Add Contribution button
    await act(async () => {
      fireEvent.click(screen.getByText('Add Contribution'));
    });

    // Fill in the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Amount'), {
        target: { value: '1000' }
      });

      // Select employee
      const employeeSelect = screen.getByLabelText('Employee');
      fireEvent.mouseDown(employeeSelect);
      const option = screen.getByText('John Doe (PEN001)');
      fireEvent.click(option);

      // Submit form
      fireEvent.click(screen.getByText('Add Contribution'));
    });

    // Verify API was called
    expect(pensionService.addContribution).toHaveBeenCalled();
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Contribution added successfully')).toBeInTheDocument();
    });
  });

  it('handles contribution deletion', async () => {
    pensionService.deleteContribution.mockResolvedValue({ success: true });
    
    await act(async () => {
      renderWithProviders(<PensionManagement />);
    });

    // Wait for initial load and switch to Contributions tab
    await waitFor(() => {
      fireEvent.click(screen.getByText('Contributions'));
    });

    // Find and click delete button for first contribution
    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });

    // Verify API was called
    expect(pensionService.deleteContribution).toHaveBeenCalledWith(mockContributions[0].id);
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Contribution deleted successfully')).toBeInTheDocument();
    });
  });

  it('handles employee search correctly', async () => {
    await act(async () => {
      renderWithProviders(<PensionManagement />);
    });

    // Wait for initial load and switch to Employee Details tab
    await waitFor(() => {
      fireEvent.click(screen.getByText('Employee Details'));
    });

    // Type in search box
    const searchInput = screen.getByLabelText('Search Employees');
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'John' } });
    });

    // Verify filtered results
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('handles error states correctly', async () => {
    // Mock API error
    pensionService.getStatistics.mockRejectedValue(new Error('API Error'));
    
    await act(async () => {
      renderWithProviders(<PensionManagement />);
    });

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load data. Please try again.')).toBeInTheDocument();
    });
  });

  it('exports contributions correctly', async () => {
    pensionService.generateReport.mockResolvedValue(mockContributions);
    pensionService.exportToCSV.mockImplementation(() => {});
    
    await act(async () => {
      renderWithProviders(<PensionManagement />);
    });

    // Wait for initial load and switch to Contributions tab
    await waitFor(() => {
      fireEvent.click(screen.getByText('Contributions'));
    });

    // Click export button
    await act(async () => {
      fireEvent.click(screen.getByText('Export'));
    });

    // Verify API calls
    expect(pensionService.generateReport).toHaveBeenCalled();
    expect(pensionService.exportToCSV).toHaveBeenCalled();
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Report exported successfully')).toBeInTheDocument();
    });
  });
});
