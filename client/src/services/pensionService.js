import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add response interceptor for error handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

export const pensionService = {
  // Contribution related endpoints
  getContributions: async () => {
    try {
      const response = await axios.get('/pension/contributions');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch contributions: ' + (error.response?.data?.message || error.message));
    }
  },

  addContribution: async (contributionData) => {
    try {
      const response = await axios.post('/pension/contributions', contributionData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to add contribution: ' + (error.response?.data?.message || error.message));
    }
  },

  updateContribution: async (id, contributionData) => {
    try {
      const response = await axios.put(`/pension/contributions/${id}`, contributionData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update contribution: ' + (error.response?.data?.message || error.message));
    }
  },

  deleteContribution: async (id) => {
    try {
      const response = await axios.delete(`/pension/contributions/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete contribution: ' + (error.response?.data?.message || error.message));
    }
  },

  // Employee related endpoints
  getEmployees: async () => {
    try {
      const response = await axios.get('/employees');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch employees: ' + (error.response?.data?.message || error.message));
    }
  },

  getEmployeeDetails: async (id) => {
    try {
      const response = await axios.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch employee details: ' + (error.response?.data?.message || error.message));
    }
  },

  updateEmployeeStatus: async (id, status) => {
    try {
      const response = await axios.patch(`/employees/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update employee status: ' + (error.response?.data?.message || error.message));
    }
  },

  // Reports and statistics
  getStatistics: async () => {
    try {
      const response = await axios.get('/pension/statistics');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch statistics: ' + (error.response?.data?.message || error.message));
    }
  },

  generateReport: async (params) => {
    try {
      const response = await axios.get('/pension/reports/generate', { params });
      return response.data;
    } catch (error) {
      throw new Error('Failed to generate report: ' + (error.response?.data?.message || error.message));
    }
  }
};

// Pension calculation and management service

export const calculatePensionContributions = (salary, type = 'weekly', employeeAge, yearsOfService) => {
  const BASE_CONTRIBUTION_RATE = 0.06; // 6% base contribution rate
  const WEEKS_IN_MONTH = 4;
  const WEEKS_IN_YEAR = 52;

  // Additional contribution based on age and years of service
  const getAdditionalRate = (age, years) => {
    let rate = 0;
    if (age >= 50) rate += 0.02; // Additional 2% for age 50+
    if (years >= 10) rate += 0.01; // Additional 1% for 10+ years of service
    if (years >= 20) rate += 0.01; // Additional 1% for 20+ years of service
    return rate;
  };

  const totalRate = BASE_CONTRIBUTION_RATE + getAdditionalRate(employeeAge, yearsOfService);

  let weeklySalary;
  if (type === 'weekly') {
    weeklySalary = salary;
  } else if (type === 'monthly') {
    weeklySalary = salary / WEEKS_IN_MONTH;
  } else if (type === 'yearly') {
    weeklySalary = salary / WEEKS_IN_YEAR;
  }

  const weeklyContribution = weeklySalary * totalRate;
  const monthlyContribution = weeklyContribution * WEEKS_IN_MONTH;
  const yearlyContribution = weeklyContribution * WEEKS_IN_YEAR;

  const projectedPension = calculateProjectedPension(salary, totalRate, yearsOfService);

  return {
    weekly: {
      salary: weeklySalary,
      contribution: weeklyContribution,
      rate: totalRate
    },
    monthly: {
      salary: weeklySalary * WEEKS_IN_MONTH,
      contribution: monthlyContribution,
      rate: totalRate
    },
    yearly: {
      salary: weeklySalary * WEEKS_IN_YEAR,
      contribution: yearlyContribution,
      rate: totalRate
    },
    projectedPension
  };
};

const calculateProjectedPension = (salary, rate, yearsOfService) => {
  const RETIREMENT_AGE = 65;
  const AVERAGE_RETURN_RATE = 0.07; // 7% average annual return
  const INFLATION_RATE = 0.03; // 3% average inflation

  const annualContribution = salary * rate;
  const realReturnRate = (1 + AVERAGE_RETURN_RATE) / (1 + INFLATION_RATE) - 1;
  
  // Calculate future value using compound interest formula
  const futureValue = annualContribution * ((Math.pow(1 + realReturnRate, yearsOfService) - 1) / realReturnRate);
  
  // Calculate monthly pension assuming a 4% withdrawal rate
  const monthlyPension = (futureValue * 0.04) / 12;

  return {
    totalAccumulated: futureValue,
    monthlyPension: monthlyPension,
    retirementAge: RETIREMENT_AGE,
    assumedReturnRate: AVERAGE_RETURN_RATE,
    assumedInflationRate: INFLATION_RATE
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
