const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Payroll extends Model {}

Payroll.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  pay_period_start: {
    type: DataTypes.DATE,
    allowNull: false
  },
  pay_period_end: {
    type: DataTypes.DATE,
    allowNull: false
  },
  gross_salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  net_salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  pension_contribution: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  other_deductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'PROCESSED', 'PAID'),
    defaultValue: 'DRAFT'
  },
  processed_at: {
    type: DataTypes.DATE
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'Payroll',
  tableName: 'payrolls',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['employee_id']
    },
    {
      fields: ['pay_period_start', 'pay_period_end']
    }
  ]
});

module.exports = Payroll;
