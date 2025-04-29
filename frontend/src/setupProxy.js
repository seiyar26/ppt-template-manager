const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Configuration du proxy pour React
 * Ce fichier est automatiquement utilisé par Create React App
 * pour configurer un proxy en développement, évitant ainsi les problèmes CORS
 */

module.exports = function(app) {
  // Proxy pour toutes les requêtes API vers le backend
  app.use(
    '/api',
    createProxyMiddleware({
      // Cible configurée pour le port actuel du backend (12000)
      target: 'http://localhost:12000',
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
      target: 'http://localhost:12000',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
    })
  );
};
