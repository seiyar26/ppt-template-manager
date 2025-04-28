const { User } = require('../models');
require('dotenv').config();

const setupUsers = async () => {
  try {
    console.log('Configuration des utilisateurs...');
    
    // 1. Supprimer tous les utilisateurs existants
    await User.destroy({ where: {}, truncate: { cascade: true } });
    console.log('Utilisateurs existants supprimu00e9s');
    
    // 2. Cru00e9er un utilisateur admin
    const admin = await User.create({
      email: 'admin@example.com',
      password_hash: 'admin123', // Sera hashu00e9 automatiquement par le hook du modu00e8le
      name: 'Administrateur'
    });
    console.log(`Utilisateur admin cru00e9u00e9 avec l'ID: ${admin.id}`);
    
    // 3. Cru00e9er un utilisateur de du00e9mo
    const demo = await User.create({
      email: 'demo@example.com',
      password_hash: 'demo123', // Sera hashu00e9 automatiquement par le hook du modu00e8le
      name: 'Utilisateur Du00e9mo'
    });
    console.log(`Utilisateur du00e9mo cru00e9u00e9 avec l'ID: ${demo.id}`);
    
    console.log('\nIdentifiants de connexion:');
    console.log('------------------------------');
    console.log('Admin - Email: admin@example.com | Mot de passe: admin123');
    console.log('Du00e9mo  - Email: demo@example.com | Mot de passe: demo123');
    console.log('------------------------------');
    
    console.log('\nConfiguration des utilisateurs terminu00e9e avec succu00e8s!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la configuration des utilisateurs:', error);
    process.exit(1);
  }
};

setupUsers();
