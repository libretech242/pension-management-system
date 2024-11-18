const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PensionContribution = sequelize.define('PensionContribution', {
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
    }
  }, {
    timestamps: true
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

  return PensionContribution;
};
