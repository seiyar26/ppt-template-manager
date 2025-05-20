/**
 * Configuration centralisée pour le frontend
 * Ce fichier sert de source unique de vérité pour toutes les variables d'environnement
 */

// Récupération des variables d'environnement (process.env.REACT_APP_*)
const env = process.env;

// Valeurs par défaut si les variables d'environnement ne sont pas définies
const defaults = {
  apiPort: '8080',
  apiHost: 'localhost',
  nodeEnv: 'development',
  protocol: 'http',
};

// Configuration centralisée
const config = {
  // Environnement
  env: env.NODE_ENV || defaults.nodeEnv,
  
  // API
  apiPort: env.REACT_APP_API_PORT || defaults.apiPort,
  apiHost: env.REACT_APP_API_HOST || defaults.apiHost,
  protocol: env.REACT_APP_API_PROTOCOL || defaults.protocol,
  
  // URLs
  baseApiUrl: function() {
    // Si une URL complète est fournie, l'utiliser directement
    if (env.REACT_APP_API_URL) {
      return env.REACT_APP_API_URL;
    }
    
    // Sinon, construire l'URL à partir des paramètres de configuration
    return `${this.protocol}://${this.apiHost}:${this.apiPort}/api`;
  },
  
  imageBaseUrl: function() {
    // Si une URL de base pour les images est fournie, l'utiliser directement
    if (env.REACT_APP_IMAGE_BASE_URL) {
      return env.REACT_APP_IMAGE_BASE_URL;
    }
    
    // Sinon, utiliser l'URL de base construite avec les paramètres
    return `${this.protocol}://${this.apiHost}:${this.apiPort}`;
  },
  
  // Fonction utilitaire pour obtenir l'URL complète d'un endpoint API
  getApiUrl: function(endpoint) {
    const baseUrl = this.baseApiUrl();
    // Éviter les doubles slashes
    if (endpoint.startsWith('/')) {
      endpoint = endpoint.substring(1);
    }
    return `${baseUrl}/${endpoint}`;
  },
  
  // Fonction utilitaire pour obtenir l'URL complète d'une image
  getImageUrl: function(path) {
    const baseUrl = this.imageBaseUrl();
    // Éviter les doubles slashes
    if (path.startsWith('/')) {
      return `${baseUrl}${path}`;
    }
    return `${baseUrl}/${path}`;
  },
  
  // Pour déterminer si nous sommes en mode production
  isProd: function() {
    return this.env === 'production';
  },
  
  // Pour déterminer si nous sommes en mode développement
  isDev: function() {
    return this.env === 'development';
  },
};

export default config;
