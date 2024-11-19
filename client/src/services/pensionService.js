import axios from 'axios';

const API_URL = '/api';

export const pensionService = {
  // Contribution related endpoints
  getContributions: async () => {
    const response = await axios.get(`${API_URL}/contributions`);
    return response.data;
  },

  addContribution: async (contributionData) => {
    const response = await axios.post(`${API_URL}/contributions`, contributionData);
    return response.data;
  },

  updateContribution: async (id, contributionData) => {
    const response = await axios.put(`${API_URL}/contributions/${id}`, contributionData);
    return response.data;
  },

  deleteContribution: async (id) => {
    const response = await axios.delete(`${API_URL}/contributions/${id}`);
    return response.data;
  },

  // Employee related endpoints
  getEmployees: async () => {
    const response = await axios.get(`${API_URL}/employees`);
    return response.data;
  },

  getEmployeeDetails: async (id) => {
    const response = await axios.get(`${API_URL}/employees/${id}`);
    return response.data;
  },

  updateEmployeeStatus: async (id, status) => {
    const response = await axios.patch(`${API_URL}/employees/${id}/status`, { status });
    return response.data;
  },

  // Reports and statistics
  getStatistics: async () => {
    const response = await axios.get(`${API_URL}/statistics`);
    return response.data;
  },

  generateReport: async (params) => {
    const response = await axios.get(`${API_URL}/reports/generate`, { params });
    return response.data;
  }
};

// Pension calculation and management service

export const calculatePensionContributions = (salary, type = 'weekly') => {
  const CONTRIBUTION_RATE = 0.06; // 6% contribution rate
  const WEEKS_IN_MONTH = 4;
  const WEEKS_IN_YEAR = 52;

  let weeklySalary;
  if (type === 'weekly') {
    weeklySalary = salary;
  } else if (type === 'monthly') {
    weeklySalary = salary / WEEKS_IN_MONTH;
  } else if (type === 'yearly') {
    weeklySalary = salary / WEEKS_IN_YEAR;
  }

  const weeklyContribution = weeklySalary * CONTRIBUTION_RATE;
  const monthlyContribution = weeklyContribution * WEEKS_IN_MONTH;
  const yearlyContribution = weeklyContribution * WEEKS_IN_YEAR;

  return {
    weekly: {
      salary: weeklySalary,
      contribution: weeklyContribution,
    },
    monthly: {
      salary: weeklySalary * WEEKS_IN_MONTH,
      contribution: monthlyContribution,
    },
    yearly: {
      salary: weeklySalary * WEEKS_IN_YEAR,
      contribution: yearlyContribution,
    },
  };
};

export const validateContribution = (contribution) => {
  const errors = {};

  if (!contribution.employeeId) {
    errors.employeeId = 'Employee is required';
  }

  if (!contribution.amount || contribution.amount <= 0) {
    errors.amount = 'Valid contribution amount is required';
  }

  if (!contribution.date) {
    errors.date = 'Contribution date is required';
  }

  if (!contribution.type) {
    errors.type = 'Contribution type is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const calculatePensionStatistics = (contributions) => {
  const stats = {
    totalContributions: 0,
    employeeContributions: 0,
    employerContributions: 0,
    contributionsByMonth: {},
    averageContribution: 0,
    totalParticipants: new Set(),
    activeParticipants: new Set(),
  };

  contributions.forEach((contribution) => {
    // Total contributions
    stats.totalContributions += contribution.amount;

    // Split by type
    if (contribution.type === 'Employee') {
      stats.employeeContributions += contribution.amount;
    } else if (contribution.type === 'Employer') {
      stats.employerContributions += contribution.amount;
    }

    // Monthly tracking
    const month = new Date(contribution.date).toISOString().slice(0, 7);
    stats.contributionsByMonth[month] = (stats.contributionsByMonth[month] || 0) + contribution.amount;

    // Participant tracking
    stats.totalParticipants.add(contribution.employeeId);
    if (contribution.status !== 'Inactive') {
      stats.activeParticipants.add(contribution.employeeId);
    }
  });

  // Calculate averages
  stats.averageContribution = stats.totalContributions / stats.totalParticipants.size;

  // Convert Sets to counts
  stats.totalParticipants = stats.totalParticipants.size;
  stats.activeParticipants = stats.activeParticipants.size;

  return stats;
};

export const generateContributionReport = (contributions, options = {}) => {
  const {
    startDate,
    endDate,
    employeeId,
    type,
    status,
  } = options;

  let filteredContributions = [...contributions];

  // Apply filters
  if (startDate) {
    filteredContributions = filteredContributions.filter(
      (c) => new Date(c.date) >= new Date(startDate)
    );
  }

  if (endDate) {
    filteredContributions = filteredContributions.filter(
      (c) => new Date(c.date) <= new Date(endDate)
    );
  }

  if (employeeId) {
    filteredContributions = filteredContributions.filter(
      (c) => c.employeeId === employeeId
    );
  }

  if (type) {
    filteredContributions = filteredContributions.filter(
      (c) => c.type === type
    );
  }

  if (status) {
    filteredContributions = filteredContributions.filter(
      (c) => c.status === status
    );
  }

  // Calculate totals
  const totals = {
    total: filteredContributions.reduce((sum, c) => sum + c.amount, 0),
    byType: filteredContributions.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + c.amount;
      return acc;
    }, {}),
    count: filteredContributions.length,
  };

  return {
    contributions: filteredContributions,
    totals,
    filters: options,
  };
};

export const processBatchContributions = (contributionsData) => {
  const results = {
    successful: [],
    failed: [],
    summary: {
      total: 0,
      successful: 0,
      failed: 0,
    },
  };

  contributionsData.forEach((contribution) => {
    results.summary.total++;

    const validation = validateContribution(contribution);
    if (validation.isValid) {
      // Process contribution
      const processed = {
        ...contribution,
        processedDate: new Date().toISOString(),
        status: 'Processed',
      };
      results.successful.push(processed);
      results.summary.successful++;
    } else {
      results.failed.push({
        contribution,
        errors: validation.errors,
      });
      results.summary.failed++;
    }
  });

  return results;
};

export const calculateVesting = (employeeData) => {
  const VESTING_YEARS = 5; // Full vesting after 5 years
  const startDate = new Date(employeeData.startDate);
  const today = new Date();
  
  // Calculate years of service
  const yearsOfService = (today - startDate) / (1000 * 60 * 60 * 24 * 365);
  
  // Calculate vesting percentage
  const vestingPercentage = Math.min(Math.floor(yearsOfService / VESTING_YEARS * 100), 100);
  
  return {
    yearsOfService: Math.floor(yearsOfService),
    vestingPercentage,
    isFullyVested: vestingPercentage === 100,
    projectedFullVestingDate: new Date(startDate.setFullYear(startDate.getFullYear() + VESTING_YEARS)),
  };
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const exportToCSV = (data, filename) => {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header] ?? '')
      ).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default pensionService;
