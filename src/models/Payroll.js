const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payroll = sequelize.define('Payroll', {
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
    contributionAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    processedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true
  });

  Payroll.associate = (models) => {
    Payroll.belongsTo(models.Employee, {
      foreignKey: 'employeeId',
      as: 'employee'
    });
    Payroll.hasOne(models.PensionContribution, {
      foreignKey: 'payrollId',
      as: 'pensionContribution'
    });
  };

  return Payroll;
};
