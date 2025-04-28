const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Template = require('./Template');
const Category = require('./Category');

const TemplateCategory = sequelize.define('TemplateCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Template,
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Category,
      key: 'id'
    }
  }
}, {
  tableName: 'TemplateCategories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Établir les relations many-to-many
Template.belongsToMany(Category, { through: TemplateCategory, foreignKey: 'template_id' });
Category.belongsToMany(Template, { through: TemplateCategory, foreignKey: 'category_id' });

module.exports = TemplateCategory;