const { 
  generatePensionReport,
  calculateContributionSummary,
  formatReportData
} = require('../../../src/services/reportService');
const { mockPensionData } = require('../../fixtures/pension');
const cache = require('../../../src/utils/queryCache');

jest.mock('../../../src/utils/queryCache');

describe('Report Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.get.mockImplementation(() => null);
  });

  describe('generatePensionReport', () => {
    it('should generate correct pension report', async () => {
      const mockData = mockPensionData(10);
      const filters = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        employeeId: '123'
      };

      const report = await generatePensionReport(filters);

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.details).toBeInstanceOf(Array);
      expect(report.metadata).toEqual(expect.objectContaining({
        generatedAt: expect.any(Date),
        filters: expect.any(Object)
      }));
    });

    it('should handle empty dataset', async () => {
      const filters = { startDate: '2023-01-01', endDate: '2023-12-31' };
      const report = await generatePensionReport(filters);

      expect(report.summary.totalContributions).toBe(0);
      expect(report.details).toHaveLength(0);
    });

    it('should use cached data when available', async () => {
      const cachedReport = {
        summary: { totalContributions: 1000 },
        details: []
      };
      cache.get.mockImplementation(() => cachedReport);

      const filters = { startDate: '2023-01-01', endDate: '2023-12-31' };
      const report = await generatePensionReport(filters);

      expect(cache.get).toHaveBeenCalled();
      expect(report).toEqual(cachedReport);
    });
  });

  describe('calculateContributionSummary', () => {
    it('should calculate correct summary statistics', () => {
      const contributions = [
        { amount: 100, type: 'EMPLOYEE' },
        { amount: 200, type: 'EMPLOYER' },
        { amount: 150, type: 'EMPLOYEE' }
      ];

      const summary = calculateContributionSummary(contributions);

      expect(summary).toEqual({
        totalContributions: 450,
        employeeContributions: 250,
        employerContributions: 200,
        averageContribution: 150
      });
    });

    it('should handle empty contributions array', () => {
      const summary = calculateContributionSummary([]);

      expect(summary).toEqual({
        totalContributions: 0,
        employeeContributions: 0,
        employerContributions: 0,
        averageContribution: 0
      });
    });
  });

  describe('formatReportData', () => {
    it('should format data correctly for export', () => {
      const rawData = {
        summary: {
          totalContributions: 1000,
          employeeContributions: 500,
          employerContributions: 500
        },
        details: [
          {
            date: '2023-01-01',
            amount: 100,
            type: 'EMPLOYEE'
          }
        ]
      };

      const formattedData = formatReportData(rawData, 'excel');

      expect(formattedData).toHaveProperty('sheets');
      expect(formattedData.sheets).toHaveProperty('Summary');
      expect(formattedData.sheets).toHaveProperty('Details');
    });

    it('should handle different export formats', () => {
      const rawData = {
        summary: { totalContributions: 1000 },
        details: []
      };

      const excelFormat = formatReportData(rawData, 'excel');
      const pdfFormat = formatReportData(rawData, 'pdf');

      expect(excelFormat).toHaveProperty('sheets');
      expect(pdfFormat).toHaveProperty('sections');
    });

    it('should throw error for unsupported format', () => {
      const rawData = {
        summary: { totalContributions: 1000 },
        details: []
      };

      expect(() => formatReportData(rawData, 'invalid'))
        .toThrow('Unsupported export format');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      jest.spyOn(global, 'fetch').mockRejectedValue(dbError);

      await expect(generatePensionReport({}))
        .rejects
        .toThrow('Failed to generate pension report');
    });

    it('should handle invalid date ranges', async () => {
      const filters = {
        startDate: '2023-12-31',
        endDate: '2023-01-01'
      };

      await expect(generatePensionReport(filters))
        .rejects
        .toThrow('Invalid date range');
    });
  });

  describe('Performance optimizations', () => {
    it('should cache expensive calculations', async () => {
      const filters = {
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };

      await generatePensionReport(filters);
      expect(cache.set).toHaveBeenCalled();
    });

    it('should handle large datasets efficiently', () => {
      const largeDataset = Array(10000).fill().map(() => ({
        amount: Math.random() * 1000,
        type: Math.random() > 0.5 ? 'EMPLOYEE' : 'EMPLOYER'
      }));

      const startTime = Date.now();
      const summary = calculateContributionSummary(largeDataset);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should process in under 100ms
      expect(summary.totalContributions).toBeGreaterThan(0);
    });
  });
});
