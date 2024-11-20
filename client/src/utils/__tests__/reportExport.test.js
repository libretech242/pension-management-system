import { exportReport } from '../reportExport';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

// Mock dependencies
jest.mock('xlsx');
jest.mock('file-saver');
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    autoTable: jest.fn(),
    save: jest.fn()
  }));
});

describe('reportExport', () => {
  const mockData = [
    {
      name: 'John Doe',
      employeeContribution: 1000,
      employerContribution: 1000
    },
    {
      name: 'Jane Smith',
      employeeContribution: 1500,
      employerContribution: 1500
    }
  ];

  const mockDateRange = {
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('exportReport', () => {
    it('should throw error when no data is provided', () => {
      expect(() => exportReport(null, 'summary', 'excel'))
        .toThrow('No data available for export');
      expect(() => exportReport([], 'summary', 'excel'))
        .toThrow('No data available for export');
    });

    it('should throw error for unsupported format', () => {
      expect(() => exportReport(mockData, 'summary', 'csv'))
        .toThrow('Unsupported export format: csv');
    });
  });

  describe('Excel export', () => {
    it('should export data to Excel format', () => {
      // Mock XLSX functions
      const mockWorksheet = {};
      const mockWorkbook = {};
      XLSX.utils.json_to_sheet.mockReturnValue(mockWorksheet);
      XLSX.utils.book_new.mockReturnValue(mockWorkbook);
      XLSX.write.mockReturnValue(new ArrayBuffer(8));

      // Execute export
      exportReport(mockData, 'summary', 'excel');

      // Verify Excel creation
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
      expect(saveAs).toHaveBeenCalled();
    });
  });

  describe('PDF export', () => {
    it('should export data to PDF format', () => {
      // Execute export
      exportReport(mockData, 'summary', 'pdf', mockDateRange);

      // Verify PDF creation
      expect(jsPDF).toHaveBeenCalled();
      const mockPdf = jsPDF.mock.results[0].value;
      
      // Verify PDF methods were called
      expect(mockPdf.setFontSize).toHaveBeenCalled();
      expect(mockPdf.text).toHaveBeenCalled();
      expect(mockPdf.autoTable).toHaveBeenCalled();
      expect(mockPdf.save).toHaveBeenCalled();
    });

    it('should include date range in PDF when provided', () => {
      // Execute export
      exportReport(mockData, 'summary', 'pdf', mockDateRange);

      // Get the mock PDF instance
      const mockPdf = jsPDF.mock.results[0].value;

      // Verify date range was included
      expect(mockPdf.text).toHaveBeenCalledWith(
        expect.stringContaining(mockDateRange.startDate),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
});
