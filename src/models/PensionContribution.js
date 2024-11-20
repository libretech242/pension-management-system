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
    field: 'employee_id',
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  contributionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'contribution_date',
    validate: {
      isDate: true,
      isBefore: new Date().toISOString()
    }
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0,
      isDecimal: true
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
  processingDate: {
    type: DataTypes.DATE,
    field: 'processing_date'
  },
  notes: {
    type: DataTypes.TEXT
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
  modelName: 'PensionContribution',
  tableName: 'pension_contributions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['employee_id']
    },
    {
      fields: ['contribution_date']
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    },
    {
      fields: ['processing_date']
    },
    // Composite indexes for common queries
    {
      fields: ['employee_id', 'contribution_date']
    },
    {
      fields: ['employee_id', 'status']
    }
  ],
  validate: {
    validateDates() {
      if (this.processingDate && this.contributionDate) {
        if (new Date(this.processingDate) < new Date(this.contributionDate)) {
          throw new Error('Processing date cannot be before contribution date');
        }
      }
    }
  }
});

// Removing the associate method since associations are defined in models/index.js

module.exports = PensionContribution;
