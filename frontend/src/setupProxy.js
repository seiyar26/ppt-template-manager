const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

/**
 * Configuration du proxy pour React
 * Ce fichier est automatiquement utilisé par Create React App
 * pour configurer un proxy en développement, évitant ainsi les problèmes CORS
 * 
 * La configuration centralisée est utilisée pour définir l'URL cible du proxy
 */

// Charger les variables d'environnement
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Déterminer le port et l'hôte du backend
const PORT = process.env.REACT_APP_API_PORT || '8080';
const HOST = process.env.REACT_APP_API_HOST || 'localhost';

module.exports = function(app) {
  // Proxy pour toutes les requêtes API vers le backend
  app.use(
    '/api',
    createProxyMiddleware({
      // Utiliser la configuration dynamique
      target: `http://${HOST}:${PORT}`,
      changeOrigin: true,
      // Autorise les requêtes non sécurisées (en dev uniquement)
      secure: false,
      // Journalisation pour faciliter le débogage
      logLevel: 'debug',
      // Gestion des erreurs pour éviter les crashs sur défaillances réseau
      onError: (err, req, res) => {
        console.error('Erreur de proxy:', err);
        res.writeHead(502, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          error: 'Erreur de connexion au serveur backend',
          details: err.message
        }));
      },
      // Ne pas modifier les headers spéciaux
      onProxyRes: (proxyRes) => {
        // Conserver les headers d'authentification et de disposition des fichiers
        delete proxyRes.headers['www-authenticate'];
      },
      // Ignorer le path prefix lors de la transmission au backend
      pathRewrite: {
        '^/api': '/api', // conserver le préfixe /api
      },
      headers: {
        Connection: 'keep-alive',
      }
    })
  );

  // Proxy spécifique pour la route de santé
  app.use(
    '/health',
    createProxyMiddleware({
      target: `http://${HOST}:${PORT}`,
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
    })
  );
};
