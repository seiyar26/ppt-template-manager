/**
 * Configuration centralisée pour le backend
 * Ce fichier sert de source unique de vérité pour toutes les variables d'environnement
 */

require('dotenv').config();

// Valeurs par défaut si les variables d'environnement ne sont pas définies
const defaults = {
  port: 8080,
  nodeEnv: 'development',
  dbPath: './database.sqlite',
  logLevel: 'info',
  corsOrigin: 'http://localhost:3000',
  uploadDir: './uploads',
  templatesDir: './templates',
};

// Configuration centralisée
const config = {
  // Paramètres serveur
  port: parseInt(process.env.PORT || defaults.port, 10),
  env: process.env.NODE_ENV || defaults.nodeEnv,
  
  // Base de données
  dbPath: process.env.DB_PATH || defaults.dbPath,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || defaults.logLevel,
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || defaults.corsOrigin,
  
  // Chemins des dossiers
  uploadDir: process.env.UPLOAD_DIR || defaults.uploadDir,
  templatesDir: process.env.TEMPLATES_DIR || defaults.templatesDir,
  
  // URLs
  baseUrl: function() {
    // Génère dynamiquement l'URL de base en fonction du port
    return `http://localhost:${this.port}`;
  },
  apiUrl: function() {
    return `${this.baseUrl()}/api`;
  },
  
  // Fonction utilitaire pour obtenir l'URL complète d'une ressource
  getFullUrl: function(path) {
    return `${this.baseUrl()}${path}`;
  },
  
  // Pour déterminer si nous sommes en mode production
  isProd: function() {
    return this.env === 'production';
  },
  
  // Pour déterminer si nous sommes en mode développement
  isDev: function() {
    return this.env === 'development';
  },
  
  // Pour déterminer si nous sommes en mode test
  isTest: function() {
    return this.env === 'test';
  },
};

module.exports = config;
