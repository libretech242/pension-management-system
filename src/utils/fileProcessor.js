const Papa = require('papaparse');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;

const processPayrollFile = async (filePath) => {
  try {
    const fileExtension = filePath.split('.').pop().toLowerCase();
    let data;

    if (fileExtension === 'csv') {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      data = await new Promise((resolve, reject) => {
        Papa.parse(fileContent, {
          header: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error),
        });
      });
    } else if (fileExtension === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(1);
      
      const headers = worksheet.getRow(1).values.slice(1); // Skip first empty cell
      data = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          rowData[headers[colNumber - 1]] = cell.value;
        });
        data.push(rowData);
      });
    } else {
      throw new Error('Unsupported file format');
    }

    // Validate and transform the data
    const validatedData = data.map((row, index) => {
      const errors = [];

      // Required fields
      const requiredFields = ['nibNumber', 'grossSalary', 'payPeriodStart', 'payPeriodEnd'];
      requiredFields.forEach(field => {
        if (!row[field]) {
          errors.push(`Missing ${field}`);
        }
      });

      // Validate salary
      if (isNaN(parseFloat(row.grossSalary))) {
        errors.push('Invalid gross salary');
      }

      // Validate dates
      const startDate = new Date(row.payPeriodStart);
      const endDate = new Date(row.payPeriodEnd);
      
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid pay period start date');
      }
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid pay period end date');
      }
      if (startDate > endDate) {
        errors.push('Pay period start date must be before end date');
      }

      return {
        row: {
          nibNumber: row.nibNumber,
          grossSalary: parseFloat(row.grossSalary),
          payPeriodStart: startDate,
          payPeriodEnd: endDate,
        },
        errors,
        rowNumber: index + 2, // +2 because of 0-based index and header row
      };
    });

    // Check for any validation errors
    const rowsWithErrors = validatedData.filter(item => item.errors.length > 0);
    if (rowsWithErrors.length > 0) {
      const errorMessage = rowsWithErrors
        .map(item => `Row ${item.rowNumber}: ${item.errors.join(', ')}`)
        .join('\n');
      throw new Error(`Validation errors in payroll file:\n${errorMessage}`);
    }

    // Clean up the temporary file
    await fs.unlink(filePath);

    return validatedData.map(item => item.row);
  } catch (error) {
    // Clean up the temporary file in case of error
    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
    }
    throw error;
  }
};

module.exports = {
  processPayrollFile,
};
