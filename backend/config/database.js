const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration pour PostgreSQL local sur VPS
let sequelize;

// Vérifier si on a une URL de connexion complète
if (process.env.DATABASE_URL) {
  console.log('Utilisation de l\'URL de connexion PostgreSQL complète');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      // SSL peut être désactivé pour une connexion locale sur VPS
      ssl: false
    },
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true
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