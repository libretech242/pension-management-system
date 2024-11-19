const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class PensionContribution extends Model {}

PensionContribution.init({
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
  payrollId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Payrolls',
      key: 'id'
    }
  },
  contributionDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  type: {
    type: DataTypes.ENUM('EMPLOYER', 'EMPLOYEE'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PROCESSED', 'FAILED'),
    defaultValue: 'PENDING'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'PensionContribution',
  tableName: 'pension_contributions',
  timestamps: true,
  indexes: [
    {
      fields: ['employeeId']
    },
    {
      fields: ['payrollId']
    },
    {
      fields: ['contributionDate']
    }
  ]
});

PensionContribution.associate = (models) => {
  PensionContribution.belongsTo(models.Employee, {
    foreignKey: 'employeeId',
    as: 'employee'
  });
  PensionContribution.belongsTo(models.Payroll, {
    foreignKey: 'payrollId',
    as: 'payroll'
  });
};

module.exports = PensionContribution;
