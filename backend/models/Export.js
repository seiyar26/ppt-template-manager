const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Template = require('./Template');

const Export = sequelize.define('Export', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Template,
      key: 'id'
    }
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  format: {
    type: DataTypes.ENUM('pptx', 'pdf'),
    allowNull: false,
    defaultValue: 'pptx'
  },
  export_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  recipients: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('recipients');
      return value ? JSON.parse(value) : [];
    },
    set(val) {
      this.setDataValue('recipients', val ? JSON.stringify(val) : null);
    }
  },
  download_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('success', 'error', 'pending'),
    allowNull: false,
    defaultValue: 'success'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Exports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Établir les relations
User.hasMany(Export, { foreignKey: 'user_id' });
Export.belongsTo(User, { foreignKey: 'user_id' });

Template.hasMany(Export, { foreignKey: 'template_id' });
Export.belongsTo(Template, { foreignKey: 'template_id' });

module.exports = Export;