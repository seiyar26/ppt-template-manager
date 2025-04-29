const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { User } = require('../models');

async function createBobUser() {
  try {
    // Générer un hash pour le mot de passe "bob123"
    const passwordHash = await bcrypt.hash('bob123', 10);
    console.log('Password hash for bob123:', passwordHash);
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email: 'bob@example.com' } });
    
    if (existingUser) {
      // Mettre à jour le mot de passe si l'utilisateur existe
      existingUser.password_hash = passwordHash;
      await existingUser.save();
      console.log('User bob@example.com updated with new password');
    } else {
      // Créer un nouvel utilisateur si l'utilisateur n'existe pas
      await User.create({
        name: 'Bob',
        email: 'bob@example.com',
        password_hash: passwordHash
      });
      console.log('User bob@example.com created successfully');
    }
    
    // Lister tous les utilisateurs pour vérification
    const users = await User.findAll({ attributes: ['id', 'email', 'name'] });
    console.log('All users in the database:', users.map(u => u.toJSON()));
    
  } catch (error) {
    console.error('Error creating/updating bob user:', error);
  } finally {
    // Fermer la connexion à la base de données
    await sequelize.close();
  }
}

createBobUser();
