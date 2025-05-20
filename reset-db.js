const sequelize = require('./backend/config/database');
const bcryptjs = require('bcryptjs');
const User = require('./backend/models/User');
const Category = require('./backend/models/Category');

const resetDb = async () => {
  try {
    console.log('Initialisation de la base de données...');
    
    // Forcer la réinitialisation des modèles (attention: cela supprime toutes les données)
    await sequelize.sync({ force: true });
    console.log('Base de données réinitialisée avec succès');
    
    // Créer l'utilisateur admin
    console.log('Création de l\'utilisateur admin...');
    const hashedPassword = await bcryptjs.hash('admin123', 10);
    
    const adminUser = await User.create({
      email: 'admin@example.com',
      password_hash: hashedPassword,
      name: 'Administrateur'
    });
    
    console.log('Utilisateur admin créé avec succès, ID:', adminUser.id);
    
    // Créer les catégories par défaut
    console.log('Création des catégories par défaut...');
    
    await Category.bulkCreate([
      { name: 'Présentations commerciales', color: '#3B82F6', icon: 'folder', is_default: false, position: 1, user_id: adminUser.id },
      { name: 'Rapports financiers', color: '#3B82F6', icon: 'folder', is_default: false, position: 2, user_id: adminUser.id },
      { name: 'Présentations marketing', color: '#3B82F6', icon: 'folder', is_default: false, position: 3, user_id: adminUser.id },
      { name: 'Pitchs startup', color: '#3B82F6', icon: 'folder', is_default: false, position: 4, user_id: adminUser.id },
      { name: 'Autres', color: '#3B82F6', icon: 'folder', is_default: false, position: 5, user_id: adminUser.id }
    ]);
    
    console.log('Catégories par défaut créées avec succès');
    console.log('Base de données initialisée avec succès');
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la réinitialisation de la base de données:', error);
    process.exit(1);
  }
};

resetDb();
