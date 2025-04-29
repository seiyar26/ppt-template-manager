const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration pour PostgreSQL (local ou cloud)
let sequelize;

// Vérifier si on a une URL de connexion complète
if (process.env.DATABASE_URL) {
  console.log('Utilisation de l\'URL de connexion PostgreSQL complète');
  
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Environnement détecté: ${isProd ? 'production' : 'développement'}`);
  
  // Options spécifiques pour Zeabur en production
  const dialectOptions = isProd ? {
    ssl: {
      require: true,
      rejectUnauthorized: false // Nécessaire pour certains providers dont Zeabur
    }
  } : {
    // En développement, SSL désactivé
    ssl: false
  };
  
  // Log pour debug (en mode dev uniquement)
  if (!isProd) {
    const maskedUrl = process.env.DATABASE_URL.replace(/:\/\/([^:]+):[^@]+@/, '://***:***@');
    console.log(`URL de connexion (masqu\u00e9e): ${maskedUrl}`);
  }
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions,
    logging: isProd ? false : console.log, // Désactiver les logs SQL en production
    define: {
      timestamps: true,
      underscored: true
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Sinon, utiliser les variables individuelles
  console.log('Utilisation des paramètres de connexion PostgreSQL individuels');
  sequelize = new Sequelize({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'postgres',
    dialect: 'postgres',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true
    }
  });
}

// Test de la connexion à la base de données
sequelize.authenticate()
  .then(() => {
    console.log('Connexion à la base de données PostgreSQL établie avec succès.');
  })
  .catch(err => {
    console.error('Impossible de se connecter à la base de données PostgreSQL:', err);
  });

module.exports = sequelize;