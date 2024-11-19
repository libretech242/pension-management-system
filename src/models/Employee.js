const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

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
    validate: {
      notEmpty: true
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
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
    allowNull: false
  },
  employmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  employmentType: {
    type: DataTypes.ENUM('MANAGEMENT', 'LINE_STAFF'),
    allowNull: false
  },
  department: {
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
    defaultValue: 5.00 // Default 5%
  },
  employeeContributionRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 3.50 // Default 3.5%
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
  }
}, {
  sequelize: require('../config/database'),
  modelName: 'Employee',
  tableName: 'employees',
  timestamps: true,
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
      fields: ['nibNumber']
    },
    {
      fields: ['employmentType']
    },
    {
      fields: ['status']
    }
  ]
});

Employee.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = Employee;
