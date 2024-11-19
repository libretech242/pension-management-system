const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Payroll extends Model {}

Payroll.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Employees',
      key: 'id'
    }
  },
  payPeriodStart: {
    type: DataTypes.DATE,
    allowNull: false
  },
  payPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: false
  },
  grossSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  netSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  pensionContribution: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  otherDeductions: {
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
  processedAt: {
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
  indexes: [
    {
      fields: ['employeeId']
    },
    {
      fields: ['payPeriodStart', 'payPeriodEnd']
    }
  ]
});

Payroll.associate = (models) => {
  Payroll.belongsTo(models.Employee, {
    foreignKey: 'employeeId',
    as: 'employee'
  });
  Payroll.hasMany(models.PensionContribution, {
    foreignKey: 'payrollId',
    as: 'contributions'
  });
};

module.exports = Payroll;
