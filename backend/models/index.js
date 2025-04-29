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
    
    // Vérifier si un utilisateur admin existe déjà
    let adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!adminUser) {
      console.log('Création de l\'utilisateur admin par défaut...');
      const hashedPassword = await bcryptjs.hash('admin123', 10);
      
      adminUser = await User.create({
        email: 'admin@example.com',
        password_hash: hashedPassword,
        name: 'Administrateur'
      });
      
      console.log('Utilisateur admin créé avec succès');
    }
    
    // Vérifier si des catégories existent déjà
    const categoriesCount = await Category.count();
    
    if (categoriesCount === 0 && adminUser) {
      console.log('Création des catégories par défaut pour l\'utilisateur admin...');
      
      await Category.bulkCreate([
        { name: 'Présentations commerciales', color: '#3B82F6', icon: 'folder', is_default: false, position: 1, user_id: adminUser.id },
        { name: 'Rapports financiers', color: '#3B82F6', icon: 'folder', is_default: false, position: 2, user_id: adminUser.id },
        { name: 'Présentations marketing', color: '#3B82F6', icon: 'folder', is_default: false, position: 3, user_id: adminUser.id },
        { name: 'Pitchs startup', color: '#3B82F6', icon: 'folder', is_default: false, position: 4, user_id: adminUser.id },
        { name: 'Autres', color: '#3B82F6', icon: 'folder', is_default: false, position: 5, user_id: adminUser.id }
      ]);
      
      console.log('Catégories par défaut créées avec succès');
    } else if (categoriesCount === 0) {
      console.error('Impossible de créer les catégories par défaut : utilisateur admin non trouvé');
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