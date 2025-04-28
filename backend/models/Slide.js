const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Slide = sequelize.define('Slide', {
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
  image_path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  thumb_path: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Slide;