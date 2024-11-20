import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';

export const exportToExcel = (data, reportType) => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
    Name: item.name,
    'Employee Contribution': item.employeeContribution,
    'Employer Contribution': item.employerContribution,
    'Total Contribution': item.employeeContribution + item.employerContribution
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pension Report');

  // Generate file name with timestamp
  const fileName = `pension_report_${reportType}_${moment().format('YYYY-MM-DD_HH-mm')}.xlsx`;
  
  // Convert workbook to array buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  saveAs(data, fileName);
};

export const exportToPDF = (data, reportType, dateRange) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text('Pension Report', 14, 15);
  
  // Add metadata
  doc.setFontSize(10);
  doc.text(`Report Type: ${reportType}`, 14, 25);
  if (dateRange) {
    doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 14, 30);
  }
  doc.text(`Generated: ${moment().format('YYYY-MM-DD HH:mm')}`, 14, 35);

  // Calculate totals
  const totals = data.reduce((acc, item) => ({
    employeeTotal: acc.employeeTotal + item.employeeContribution,
    employerTotal: acc.employerTotal + item.employerContribution
  }), { employeeTotal: 0, employerTotal: 0 });

  // Create table data
  const tableData = data.map(item => [
    item.name,
    `$${item.employeeContribution.toFixed(2)}`,
    `$${item.employerContribution.toFixed(2)}`,
    `$${(item.employeeContribution + item.employerContribution).toFixed(2)}`
  ]);

  // Add summary row
  tableData.push([
    'Total',
    `$${totals.employeeTotal.toFixed(2)}`,
    `$${totals.employerTotal.toFixed(2)}`,
    `$${(totals.employeeTotal + totals.employerTotal).toFixed(2)}`
  ]);

  // Add table
  doc.autoTable({
    startY: 45,
    head: [['Name', 'Employee Contribution', 'Employer Contribution', 'Total']],
    body: tableData,
    foot: [],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: 0,
      fontSize: 8,
      fontStyle: 'bold',
    },
  });

  // Generate file name with timestamp
  const fileName = `pension_report_${reportType}_${moment().format('YYYY-MM-DD_HH-mm')}.pdf`;
  
  // Save the PDF
  doc.save(fileName);
};

export const exportReport = (data, reportType, format, dateRange) => {
  if (!data || data.length === 0) {
    throw new Error('No data available for export');
  }

  switch (format.toLowerCase()) {
    case 'excel':
      return exportToExcel(data, reportType);
    case 'pdf':
      return exportToPDF(data, reportType, dateRange);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};
