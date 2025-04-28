const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Field = sequelize.define('Field', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  slide_index: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'text'
  },
  default_value: {
    type: DataTypes.TEXT
  },
  position_x: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  position_y: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  width: {
    type: DataTypes.INTEGER
  },
  height: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Field;