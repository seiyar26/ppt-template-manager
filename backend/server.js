const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const templateRoutes = require('./routes/templateRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const exportRoutes = require('./routes/exportRoutes');
const emailRoutes = require('./routes/emailRoutes');
const config = require('./config/env');

// Initialize Express app
const app = express();

// Middleware
// Middleware pour journaliser toutes les requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ====== Configuration globale de CORS pour tout le serveur ======
// Configuration CORS pour environnements de prod et dev

// Déterminer l'origine autorisée en fonction de l'environnement
const corsOrigin = process.env.CORS_ORIGIN || '*';
console.log(`Configuration CORS avec origine: ${corsOrigin}`);

// Configuration CORS optimisée pour le déploiement
app.use(cors({
  origin: corsOrigin, // Utiliser l'origine configurée dans les variables d'environnement
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true // Nécessaire pour les cookies/auth entre domaines
}));

// Les requêtes OPTIONS sont déjà gérées par le middleware CORS

// Ajouter des en-têtes personnalisés pour le debugging
app.use((req, res, next) => {
  res.header('X-Debug-Mode', 'true');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ajout de journalisation pour débogage statique
app.use((req, res, next) => {
  if (req.path.includes('/uploads/')) {
    console.log('Requête de fichier statique:', req.path);
  }
  next();
});

// Serve static files with proper MIME types
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    console.log('Servir fichier statique:', path);
    // Définir les types MIME appropriés pour les fichiers PPTX et PDF
    if (path.endsWith('.pptx')) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.setHeader('Content-Disposition', 'attachment; filename="' + path.split('/').pop() + '"');
    } else if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
    
    // Désactiver la mise en cache pour les fichiers générés
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Note: Les en-têtes CORS sont gérés par le middleware CORS global
    // Nous ne définissons pas ici d'en-têtes CORS pour éviter des conflits
  }
}));

// Ajout d'un middleware spécifique pour le dossier templates
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    console.log('Servir fichier via /api/uploads:', path);
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    // Note: Les en-têtes CORS sont gérés par le middleware CORS global
    // Nous ne définissons aucun en-tête CORS ici pour éviter les conflits
  }
}));

// La route health check est consolidée plus bas dans le fichier

// Page d'accueil simple pour vérifier l'accès de base
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>PPT Template Manager</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
        h1 { color: #3B82F6; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { padding: 20px; background-color: #f0f9ff; border-radius: 8px; margin-top: 20px; }
        .api-link { margin-top: 20px; }
        .api-link a { color: #3B82F6; text-decoration: none; }
        .api-link a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>PPT Template Manager</h1>
        <div class="status">
          <p><strong>Statut du serveur:</strong> En ligne</p>
          <p><strong>Environnement:</strong> ${process.env.NODE_ENV || 'développement'}</p>
          <p><strong>Heure du serveur:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div class="api-link">
          <p><a href="/api">Accéder à l'API</a> | <a href="/health">Vérification de santé</a></p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Route de diagnostic pour vérifier les variables d'environnement (sans les secrets)
app.get('/diagnostic', (req, res) => {
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV || 'non défini',
    PORT: process.env.PORT || '3000',
    DATABASE_CONNECTION: process.env.DATABASE_URL ? 'Configuré' : 'Non configuré',
    CONVERT_API: process.env.CONVERT_API_SECRET ? 'Configuré' : 'Non configuré',
    SUPABASE: process.env.SUPABASE_URL ? 'Configuré' : 'Non configuré'
  };
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: safeEnv,
    serverUptime: `${Math.floor(process.uptime() / 60)} minutes`
  });
});

// Route unique pour vérifier la santé de l'application (consolidée)
app.get(['/_health', '/health'], async (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'ppt-template-manager',
    version: require('./package.json').version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime() + ' seconds',
    database: 'PostgreSQL',
    checks: {}
  };

  // Vérification de la disponibilité du système de fichiers
  try {
    const uploadsPath = path.join(__dirname, 'uploads');
    healthData.checks.filesystem = { status: 'ok', path: uploadsPath };
  } catch (err) {
    healthData.checks.filesystem = { status: 'error', message: err.message };
  }

  // Vérification de la base de données (si disponible)
  try {
    // Vérifier si nous sommes en mode de secours (fallback)
    if (typeof sequelize.fallbackMode === 'function' && sequelize.fallbackMode()) {
      healthData.checks.database = {
        status: 'limited',
        message: 'Mode de secours actif - fonctionnalités limitées disponibles',
        connection: 'fallback'
      };
    } else {
      // Essayer de vérifier la connexion à la base de données
      await sequelize.authenticate({ logging: false });
      healthData.checks.database = { status: 'ok', connection: 'active' };
    }
  } catch (err) {
    healthData.checks.database = { 
      status: 'warning',
      message: 'Mode dégradé - l\'application fonctionne mais la base de données n\'est pas disponible',
      error: err.message 
    };
  }

  res.json(healthData);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/email', emailRoutes);

// Route de diagnostic pour tester le problème avec les catégories
app.get('/api/categories-test', (req, res) => {
  res.json({ message: 'Route de diagnostic des catégories fonctionne' });
});

// Route spécifique pour le téléchargement de fichiers
app.get('/api/download/:type/:userId/:fileName', (req, res) => {
  try {
    const { type, userId, fileName } = req.params;
    
    // Vérifier que le type est valide
    if (type !== 'exports') {
      return res.status(400).json({ message: 'Type de fichier non valide' });
    }
    
    // Construire le chemin du fichier
    const filePath = path.join(__dirname, 'uploads', type, userId, fileName);
    console.log(`Tentative de téléchargement du fichier: ${filePath}`);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.error(`Fichier non trouvé: ${filePath}`);
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }
    
    // Déterminer le type MIME en fonction de l'extension
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    let contentDisposition = 'attachment';
    
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.pptx') {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      contentDisposition = 'attachment; filename="' + fileName + '"';
    }
    
    // Définir les en-têtes
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Envoyer le fichier
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Gérer les erreurs de lecture du fichier
    fileStream.on('error', (err) => {
      console.error(`Erreur lors de la lecture du fichier: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Erreur lors de la lecture du fichier' });
      }
    });
  } catch (error) {
    console.error(`Erreur lors du téléchargement du fichier: ${error.message}`);
    res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
  }
});

// La route health check est déjà définie plus haut dans le fichier

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection and server start
const { initDb } = require('./models');

// Import du script de migration pour Zeabur
const runMigrations = require('./config/zeabur-migrate');

// Vérification de l'existence des répertoires de stockage
const { ensureLocalDirectories } = require('./utils/storageConfig');

// Diagnostic pour vérifier les variables d'environnement importantes
function logEnvironmentVariables() {
  console.log('==== DIAGNOSTIC DES VARIABLES D\'ENVIRONNEMENT ====');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'non défini'}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Défini' : 'Non défini'}`);
  console.log(`POSTGRES_CONNECTION_STRING: ${process.env.POSTGRES_CONNECTION_STRING ? 'Défini' : 'Non défini'}`);
  
  // Si DATABASE_URL n'est pas défini mais POSTGRES_CONNECTION_STRING l'est, l'utiliser
  if (!process.env.DATABASE_URL && process.env.POSTGRES_CONNECTION_STRING) {
    process.env.DATABASE_URL = process.env.POSTGRES_CONNECTION_STRING + '?sslmode=require';
    console.log('DATABASE_URL automatiquement défini à partir de POSTGRES_CONNECTION_STRING');
  }
  
  console.log(`Port configuré: ${config.port} (utiliser config.port)`);
  console.log(`Base URL: ${config.baseUrl()} (utiliser config.baseUrl())`);
  console.log(`API URL: ${config.apiUrl()} (utiliser config.apiUrl())`);
  console.log('================================================');
}

const startServer = async () => {
  try {
    // Afficher les variables d'environnement importantes
    logEnvironmentVariables();
    
    // S'assurer que les répertoires de stockage existent
    ensureLocalDirectories();
    
    console.log('Initialisation de la connexion à la base de données PostgreSQL...');
    // Vérification de la connexion à la base de données
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie avec succès.');
    
    // Gestion différente selon l'environnement
    if (process.env.NODE_ENV === 'production') {
      // En production (Zeabur), utiliser les migrations automatiques
      console.log('Environnement de production détecté, exécution des migrations automatiques...');
      await runMigrations();
    } else {
      // En développement, synchroniser simplement les modèles
      console.log('Synchronisation des modèles avec la base de données...');
      await sequelize.sync({ alter: true });
      console.log('Synchronisation terminée avec succès');
      
      // Initialiser la base de données avec les tables et données par défaut
      console.log('Initialisation de la base de données...');
      const dbInitialized = await initDb();
      if (dbInitialized) {
        console.log('Base de données initialisée avec succès');
      } else {
        console.warn('\x1b[33m%s\x1b[0m', 'Avertissement: L\'initialisation de la base de données a échoué');
      }
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Erreur de connexion à la base de données:', error);
    console.log('\x1b[33m%s\x1b[0m', 'Le serveur démarrera quand même, mais certaines fonctionnalités ne seront pas disponibles');
  } finally {
    // Start server even if database connection fails
    app.listen(config.port, '0.0.0.0', () => {
      console.log('\x1b[32m%s\x1b[0m', `Serveur démarré et en écoute sur le port ${config.port}`);
      console.log(`URL API: ${config.apiUrl()}`);
      console.log(`Vérification santé: ${config.baseUrl()}/health`);
      console.log('\x1b[36m%s\x1b[0m', `Identifiant par défaut: admin@example.com / mot de passe: admin123`);
    });
  }
};

// En mode production avec plateformes cloud, nous exportons l'application
if (process.env.NODE_ENV === 'production' && (process.env.VERCEL || process.env.ZEABUR)) {
  console.log('Mode plateforme cloud détecté, exportation de l\'application');
  
  // Pour Zeabur, nous n'exécutons pas directement startServer() car cela sera géré par zeabur-start.js
  if (!process.env.ZEABUR) {
    // Préparation asynchrone uniquement pour Vercel
    startServer();
  }
  
  // Exporter l'application pour les plateformes cloud
  module.exports = app;
} else {
  // En mode développement, démarrer normalement
  startServer();
}