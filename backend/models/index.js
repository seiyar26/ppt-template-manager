const sequelize = require('../config/database');
const User = require('./User');
const Template = require('./Template');
const Slide = require('./Slide');
const Field = require('./Field');
const Category = require('./Category');
const Export = require('./Export');
const TemplateCategory = require('./TemplateCategory');

// Define relationships
User.hasMany(Template, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Template.belongsTo(User, { foreignKey: 'user_id' });

Template.hasMany(Slide, { foreignKey: 'template_id', onDelete: 'CASCADE' });
Slide.belongsTo(Template, { foreignKey: 'template_id' });

Template.hasMany(Field, { foreignKey: 'template_id', onDelete: 'CASCADE' });
Field.belongsTo(Template, { foreignKey: 'template_id' });

// Les relations pour Category et Export sont définies dans leurs modèles respectifs
// Voir Category.js, TemplateCategory.js et Export.js

// Ajouter la relation many-to-many entre Template et Category
Template.belongsToMany(Category, { 
  through: TemplateCategory,
  foreignKey: 'template_id',
  otherKey: 'category_id',
  as: 'categories'
});

Category.belongsToMany(Template, { 
  through: TemplateCategory,
  foreignKey: 'category_id',
  otherKey: 'template_id',
  as: 'templates'
});

// Fonction pour initialiser la base de données et créer un utilisateur admin si nécessaire
const initDb = async () => {
  try {
    // Synchroniser tous les modèles avec la base de données
    console.log('Synchronisation des modèles avec la base de données...');
    await sequelize.sync({ alter: true });
    console.log('Synchronisation terminée avec succès');
    
    // Vérifier si l'utilisateur admin existe déjà
    const adminExists = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!adminExists) {
      console.log('Création de l\'utilisateur admin par défaut...');
      await User.create({
        name: 'Administrateur',
        email: 'admin@example.com',
        password_hash: 'admin123', // Sera haché par le hook beforeCreate dans le modèle User
        is_admin: true
      });
      console.log('Utilisateur admin créé avec succès');
    } else {
      console.log('L\'utilisateur admin existe déjà');
    }
    
    // Créer des catégories par défaut si aucune n'existe
    const categoriesCount = await Category.count();
    if (categoriesCount === 0) {
      console.log('Création des catégories par défaut...');
      await Category.bulkCreate([
        { name: 'Présentations commerciales', position: 1 },
        { name: 'Rapports financiers', position: 2 },
        { name: 'Présentations marketing', position: 3 },
        { name: 'Pitchs startup', position: 4 },
        { name: 'Autres', position: 5 }
      ]);
      console.log('Catégories par défaut créées avec succès');
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  User,
  Template,
  Slide,
  Field,
  Category,
  Export,
  TemplateCategory,
  initDb // Export de la fonction d'initialisation
};