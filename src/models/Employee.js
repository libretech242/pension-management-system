const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

class Employee extends Model {}

Employee.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nibNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    field: 'nib_number',
    validate: {
      notEmpty: true,
      is: /^[A-Z]\d{8}$/ // NIB number format validation
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name',
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name',
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'date_of_birth',
    validate: {
      isDate: true,
      isBefore: new Date().toISOString() // Must be in the past
    }
  },
  employmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'employment_date',
    validate: {
      isDate: true,
      isBefore: new Date().toISOString() // Cannot be future date
    }
  },
  employmentType: {
    type: DataTypes.ENUM('MANAGEMENT', 'LINE_STAFF'),
    allowNull: false,
    field: 'employment_type'
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  employerContributionRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 5.00, // Default 5%
    field: 'employer_contribution_rate'
  },
  employeeContributionRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 3.50, // Default 3.5%
    field: 'employee_contribution_rate'
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'TERMINATED'),
    defaultValue: 'ACTIVE'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // Only required if employee needs system access
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'MANAGER', 'EMPLOYEE'),
    defaultValue: 'EMPLOYEE'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at'
  }
}, {
  sequelize,
  modelName: 'Employee',
  tableName: 'employees',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeSave: async (employee) => {
      if (employee.changed('password') && employee.password) {
        employee.password = await bcrypt.hash(employee.password, 10);
      }
    }
  },
  indexes: [
    {
      unique: true,
      fields: ['nib_number']
    },
    {
      fields: ['employment_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['department']
    },
    {
      fields: ['employment_date']
    }
  ]
});

Employee.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = Employee;
