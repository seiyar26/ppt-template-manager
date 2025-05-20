// Point d'entrée optimisé pour Zeabur
require('dotenv').config();
const app = require('./server');
const PORT = process.env.PORT || 3000;

// Démarrage du serveur avec gestion améliorée des signaux pour Zeabur
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔄 Routes API disponibles à: http://localhost:${PORT}/api`);
  console.log(`🩺 Health check à: http://localhost:${PORT}/health`);
});

// Gestion propre de l'extinction pour Zeabur
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    console.log(`Réception du signal ${signal}, fermeture propre...`);
    server.close(() => {
      console.log('Serveur HTTP arrêté');
      process.exit(0);
    });
    
    // Forcer la fermeture après un délai si le serveur ne se ferme pas proprement
    setTimeout(() => {
      console.error('Fermeture forcée après délai d\'expiration');
      process.exit(1);
    }, 10000);
  });
});
