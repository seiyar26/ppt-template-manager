const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration pour PostgreSQL (local ou cloud)
let sequelize;

// Fonction pour extraire l'hôte et le port d'une URL de connexion pour le logging
const extractHostAndPort = (url) => {
  try {
    const matches = url.match(/postgresql:\/\/[^@]+@([^:]+):([0-9]+)\/.+/);
    if (matches && matches.length >= 3) {
      return { host: matches[1], port: matches[2] };
    }
    return { host: 'inconnu', port: 'inconnu' };
  } catch (err) {
    return { host: 'erreur', port: 'erreur' };
  }
};

// En environnement Zeabur ou Docker, POSTGRES_CONNECTION_STRING est fourni au lieu de DATABASE_URL
if (process.env.POSTGRES_CONNECTION_STRING && !process.env.DATABASE_URL) {
  console.log('Variable POSTGRES_CONNECTION_STRING détectée, conversion en DATABASE_URL');
  // Sans SSL - problème de compatibilité avec certains serveurs PostgreSQL
  process.env.DATABASE_URL = process.env.POSTGRES_CONNECTION_STRING;
}

// Vérifier si on a une URL de connexion complète
if (process.env.DATABASE_URL) {
  console.log('Utilisation de l\'URL de connexion PostgreSQL complète');
  
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Environnement détecté: ${isProd ? 'production' : 'développement'}`);
  
  // Configuration pour éviter les erreurs de SSL
  const dialectOptions = {
    ssl: false
  };
  
  console.log('SSL désactivé pour la connexion PostgreSQL (problème de compatibilité)');
  
  // Log pour debug (masquer les informations sensibles)
  const maskedUrl = process.env.DATABASE_URL.replace(/:(\/\/[^:]+):[^@]+@/, ':$1:***@');
  const { host, port } = extractHostAndPort(process.env.DATABASE_URL);
  console.log(`Tentative de connexion à PostgreSQL sur ${host}:${port}`);
  
  if (!isProd) {
    console.log(`URL de connexion (masquée): ${maskedUrl}`);
  }
  
  const retryOptions = {
    max: 10,
    // Stratégie exponentielle de backoff pour les tentatives de reconnexion
    backoffBase: 1000, // 1 seconde
    backoffExponent: 1.5,
  };
  
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
    },
    retry: retryOptions
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

// Fonction de tentative de connexion avec retries adaptés pour l'environnement Docker
const testConnection = async (maxRetries = 5, initialDelay = 2000) => {
  let retries = 0;
  let delay = initialDelay;
  
  while (retries < maxRetries) {
    try {
      await sequelize.authenticate();
      console.log('✅ Connexion à la base de données PostgreSQL établie avec succès.');
      return true;
    } catch (err) {
      retries++;
      console.error(`❌ Tentative ${retries}/${maxRetries} échouée:`, err.message);
      
      // Informations supplémentaires pour le diagnostic
      if (err.original && err.original.code) {
        console.error(`Code d'erreur: ${err.original.code}`);
        
        // Conseils spécifiques selon le type d'erreur
        if (err.original.code === 'ECONNREFUSED') {
          console.error('Diagnostic: Le serveur PostgreSQL n\'est pas accessible ou n\'est pas démarré.');
          console.error('Solutions possibles:');
          console.error('1. Vérifiez que PostgreSQL est bien démarré');          
          console.error('2. Vérifiez que l\'adresse et le port dans DATABASE_URL sont corrects');
          console.error('3. Si vous utilisez Docker, assurez-vous que le conteneur est accessible');
        } else if (err.original.code === 'ENOTFOUND') {
          console.error('Diagnostic: Le nom d\'hôte de la base de données est introuvable.');
        } else if (err.original.code === '28P01') {
          console.error('Diagnostic: Authentification échouée (nom d\'utilisateur ou mot de passe incorrect).');
        }
      }
      
      if (retries < maxRetries) {
        console.log(`Nouvelle tentative dans ${delay/1000} secondes...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Augmentation exponentielle du délai
      }
    }
  }
  
  console.error('❌ Impossible de se connecter à la base de données après plusieurs tentatives.');
  return false;
};

// Tester la connexion avec une stratégie de retry
(async () => {
  await testConnection();
})();

module.exports = sequelize;