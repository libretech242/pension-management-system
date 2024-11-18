const validateEmployee = (req, res, next) => {
  const { nibNumber, firstName, lastName, position, employeeType, company, contributionPercentage } = req.body;

  // Basic validation
  if (!nibNumber || !firstName || !lastName || !position || !employeeType || !company || !contributionPercentage) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }

  // NIB number validation (assuming format NIB-XXXXXX)
  const nibRegex = /^NIB-\d{6}$/;
  if (!nibRegex.test(nibNumber)) {
    return res.status(400).json({
      error: 'Invalid NIB number format. Should be NIB-XXXXXX where X is a digit'
    });
  }

  // Contribution percentage validation
  if (contributionPercentage < 0 || contributionPercentage > 100) {
    return res.status(400).json({
      error: 'Contribution percentage must be between 0 and 100'
    });
  }

  // Employee type validation
  const validTypes = ['management', 'line staff', 'contract'];
  if (!validTypes.includes(employeeType.toLowerCase())) {
    return res.status(400).json({
      error: 'Invalid employee type. Must be one of: management, line staff, contract'
    });
  }

  next();
};

module.exports = {
  validateEmployee
};
