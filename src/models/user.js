const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

class User extends Model {
  // Method to generate JWT token
  generateToken() {
    const jwt = require('jsonwebtoken');
    if (!process.env.JWT_SECRET) {
      throw new Error(process.env.NODE_ENV === 'development' 
        ? 'JWT_SECRET environment variable is not configured' 
        : 'Authentication configuration error');
    }
    
    return jwt.sign(
      { 
        userId: this.id,
        email: this.email,
        roleId: this.role_id,
        timestamp: Date.now()
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
        algorithm: 'HS256'
      }
    );
  }

  // Method to validate password
  async validatePassword(password) {
    try {
      return await bcrypt.compare(password, this.password_hash);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Password validation error:', error);
      }
      throw new Error('Password validation failed');
    }
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Please enter a valid email address'
      },
      notNull: {
        msg: 'Email is required'
      }
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'First name is required'
      }
    }
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Last name is required'
      }
    }
  },
  role_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE
  },
  last_activity: {
    type: DataTypes.DATE
  },
  reset_token: {
    type: DataTypes.STRING
  },
  reset_token_expires: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password_hash')) {
        // Use fewer rounds in development for faster testing
        const saltRounds = process.env.NODE_ENV === 'development' ? 5 : 12;
        try {
          const salt = await bcrypt.genSalt(saltRounds);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Password hashed successfully with salt rounds:', saltRounds);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Password hashing error:', error);
          }
          throw new Error('Failed to hash password');
        }
      }
    }
  }
});

module.exports = User;
