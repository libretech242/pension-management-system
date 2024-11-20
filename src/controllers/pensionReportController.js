const PensionReportService = require('../services/pensionReportService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const ExcelJS = require('exceljs');
const { parse } = require('fast-csv');
const { format } = require('date-fns');

class PensionReportController {
  static async getEmployeeContributions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;

      const contributions = await PensionReportService.getEmployeeContributions(
        employeeId,
        startDate,
        endDate
      );

      return res.json({
        success: true,
        data: contributions
      });
    } catch (error) {
      logger.error('Error in getEmployeeContributions controller', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getContributionsSummary(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { year, month } = req.query;

      const summary = await PensionReportService.getContributionsSummary(
        parseInt(year),
        parseInt(month)
      );

      return res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error in getContributionsSummary controller', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async invalidateEmployeeCache(req, res) {
    try {
      const { employeeId } = req.params;

      const invalidatedCount = await PensionReportService.invalidateEmployeeCache(employeeId);

      return res.json({
        success: true,
        message: `Cache invalidated for employee ${employeeId}`,
        invalidatedCount
      });
    } catch (error) {
      logger.error('Error in invalidateEmployeeCache controller', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getCacheStats(req, res) {
    try {
      const stats = await PensionReportService.getCacheStats();

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getCacheStats controller', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async generateContributionsReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const format = req.query.format || 'csv';

      const contributions = await PensionReportService.getContributionsReport(startDate, endDate);
      
      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contributions');
        
        worksheet.columns = [
          { header: 'Employee ID', key: 'employeeId' },
          { header: 'Employee Name', key: 'employeeName' },
          { header: 'Contribution Date', key: 'contributionDate' },
          { header: 'Amount', key: 'amount' },
          { header: 'Type', key: 'type' }
        ];

        worksheet.addRows(contributions);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=contributions-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        
        await workbook.xlsx.write(res);
        return res.end();
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=contributions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        
        const csvStream = parse({ headers: true });
        csvStream.pipe(res);
        contributions.forEach(row => csvStream.write(row));
        csvStream.end();
      }
    } catch (error) {
      logger.error('Error generating contributions report', { error });
      return res.status(500).json({
        success: false,
        error: 'Error generating report'
      });
    }
  }

  static async generateEmployeeSummary(req, res) {
    try {
      const { startDate, endDate, employeeId } = req.query;
      const format = req.query.format || 'csv';

      const summary = await PensionReportService.getEmployeeSummary(employeeId, startDate, endDate);
      
      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Employee Summary');
        
        worksheet.columns = [
          { header: 'Period', key: 'period' },
          { header: 'Total Contributions', key: 'totalContributions' },
          { header: 'Employee Contributions', key: 'employeeContributions' },
          { header: 'Employer Contributions', key: 'employerContributions' }
        ];

        worksheet.addRows(summary);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=employee-summary-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        
        await workbook.xlsx.write(res);
        return res.end();
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=employee-summary-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        
        const csvStream = parse({ headers: true });
        csvStream.pipe(res);
        summary.forEach(row => csvStream.write(row));
        csvStream.end();
      }
    } catch (error) {
      logger.error('Error generating employee summary', { error });
      return res.status(500).json({
        success: false,
        error: 'Error generating summary'
      });
    }
  }

  static async importContributions(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileBuffer = req.file.buffer;
      const results = await PensionReportService.importContributions(fileBuffer, req.file.mimetype);

      return res.json({
        success: true,
        message: 'Contributions imported successfully',
        results
      });
    } catch (error) {
      logger.error('Error importing contributions', { error });
      return res.status(500).json({
        success: false,
        error: 'Error importing contributions'
      });
    }
  }

  static async importEmployees(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileBuffer = req.file.buffer;
      const results = await PensionReportService.importEmployees(fileBuffer, req.file.mimetype);

      return res.json({
        success: true,
        message: 'Employees imported successfully',
        results
      });
    } catch (error) {
      logger.error('Error importing employees', { error });
      return res.status(500).json({
        success: false,
        error: 'Error importing employees'
      });
    }
  }

  static async exportContributions(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const format = req.query.format || 'csv';

      const contributions = await PensionReportService.exportContributions(startDate, endDate);
      
      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contributions Export');
        
        worksheet.columns = [
          { header: 'Employee ID', key: 'employeeId' },
          { header: 'Employee Name', key: 'employeeName' },
          { header: 'Contribution Date', key: 'contributionDate' },
          { header: 'Amount', key: 'amount' },
          { header: 'Type', key: 'type' },
          { header: 'Status', key: 'status' }
        ];

        worksheet.addRows(contributions);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=contributions-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        
        await workbook.xlsx.write(res);
        return res.end();
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=contributions-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        
        const csvStream = parse({ headers: true });
        csvStream.pipe(res);
        contributions.forEach(row => csvStream.write(row));
        csvStream.end();
      }
    } catch (error) {
      logger.error('Error exporting contributions', { error });
      return res.status(500).json({
        success: false,
        error: 'Error exporting contributions'
      });
    }
  }

  static async exportEmployees(req, res) {
    try {
      const format = req.query.format || 'csv';
      const employees = await PensionReportService.exportEmployees();
      
      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Employees Export');
        
        worksheet.columns = [
          { header: 'Employee ID', key: 'id' },
          { header: 'NIB Number', key: 'nibNumber' },
          { header: 'First Name', key: 'firstName' },
          { header: 'Last Name', key: 'lastName' },
          { header: 'Email', key: 'email' },
          { header: 'Position', key: 'position' },
          { header: 'Department', key: 'department' },
          { header: 'Employment Type', key: 'employmentType' },
          { header: 'Status', key: 'status' }
        ];

        worksheet.addRows(employees);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=employees-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        
        await workbook.xlsx.write(res);
        return res.end();
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=employees-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        
        const csvStream = parse({ headers: true });
        csvStream.pipe(res);
        employees.forEach(row => csvStream.write(row));
        csvStream.end();
      }
    } catch (error) {
      logger.error('Error exporting employees', { error });
      return res.status(500).json({
        success: false,
        error: 'Error exporting employees'
      });
    }
  }
}

module.exports = PensionReportController;
