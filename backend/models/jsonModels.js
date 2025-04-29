/**
 * Modèles JSON pour remplacer les modèles Sequelize
 * Solution légère pour les hébergements partagés sans accès à une base de données
 */

const JsonStorage = require('../utils/jsonStorage');

// Initialiser les modèles
const User = new JsonStorage('User');
const Template = new JsonStorage('Template');
const Category = new JsonStorage('Category');
const Slide = new JsonStorage('Slide');
const Field = new JsonStorage('Field');
const Export = new JsonStorage('Export');
const TemplateCategory = new JsonStorage('TemplateCategory');

// Fonction d'initialisation de la base de données
async function initDb() {
  try {
    console.log('Initialisation de la base de données JSON...');
    
    // Vérifier si l'utilisateur admin existe déjà
    const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!adminUser) {
      console.log('Création de l\'utilisateur admin par défaut...');
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await User.create({
        email: 'admin@example.com',
        password_hash: passwordHash,
        name: 'Administrateur'
      });
      
      console.log('Utilisateur admin créé avec succès');
    }
    
    // Vérifier si des catégories existent déjà
    const categoriesCount = (await Category.findAll()).length;
    
    if (categoriesCount === 0) {
      console.log('Création des catégories par défaut...');
      
      const defaultCategories = [
        { name: 'Présentations commerciales', color: '#3B82F6', icon: 'folder', is_default: false, position: 1 },
        { name: 'Rapports financiers', color: '#3B82F6', icon: 'folder', is_default: false, position: 2 },
        { name: 'Présentations marketing', color: '#3B82F6', icon: 'folder', is_default: false, position: 3 },
        { name: 'Pitchs startup', color: '#3B82F6', icon: 'folder', is_default: false, position: 4 },
        { name: 'Autres', color: '#3B82F6', icon: 'folder', is_default: false, position: 5 }
      ];
      
      for (const category of defaultCategories) {
        await Category.create(category);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    return false;
  }
}

module.exports = {
  User,
  Template,
  Category,
  Slide,
  Field,
  Export,
  TemplateCategory,
  initDb
};
