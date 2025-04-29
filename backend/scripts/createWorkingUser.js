const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createWorkingUser = async () => {
  try {
    // Créer un hash unique sans utiliser le hook du modèle
    const plainPassword = 'abc123';
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    
    // Insérer directement dans la base de données sans passer par le modèle Sequelize
    await sequelize.query(
      `INSERT INTO \"Users\" (email, password_hash, name, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW())`,
      { 
        bind: ['user@example.com', passwordHash, 'User Test'],
        type: sequelize.QueryTypes.INSERT 
      }
    );
    
    console.log('Utilisateur créé avec succès:');
    console.log('Email: user@example.com');
    console.log('Mot de passe: abc123');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    process.exit(1);
  }
};

createWorkingUser();
