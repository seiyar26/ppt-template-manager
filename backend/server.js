const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const templateRoutes = require('./routes/templateRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const exportRoutes = require('./routes/exportRoutes');
const emailRoutes = require('./routes/emailRoutes');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000; // Changement de port pour éviter les conflits potentiels

// Middleware
// Configuration CORS plus permissive en mode développement
const corsOptions = {
  origin: function (origin, callback) {
    // En développement, accepter toutes les origines
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      // Accepter toutes les origines en mode développement
      console.log('Mode développement: CORS accepté pour toutes les origines');
      callback(null, true);
    } else {
      // En production, vérifier les origines
      const allowedOrigins = [
        'http://localhost:4322',
        'http://127.0.0.1:4322',
        'http://localhost:4323',
        'http://127.0.0.1:4323',
        'http://localhost:4324', 
        'http://127.0.0.1:4324',
        'http://localhost:4325',
        'http://127.0.0.1:4325',
        'https://cousbo-hoshah1jy-seiyar26s-projects.vercel.app',
        'https://cousbo.vercel.app'
      ];
      
      if (!origin) {
        // Autorise les requêtes sans en-tête d'origine (comme les appels API d'outils)
        callback(null, true);
      } else if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        // Autorise les origines qui commencent par une origine autorisée
        callback(null, true);
      } else {
        console.log(`CORS refusé pour l'origine: ${origin}`);
        callback(new Error('Non autorisé par CORS'));
      }
    }
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Ajouter des en-têtes personnalisés pour le debugging
app.use((req, res, next) => {
  res.header('X-Debug-Mode', 'true');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files with proper MIME types
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Définir les types MIME appropriés pour les fichiers PPTX et PDF
    if (path.endsWith('.pptx')) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.setHeader('Content-Disposition', 'attachment; filename="' + path.split('/').pop() + '"');
    } else if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
    
    // Désactiver la mise en cache pour les fichiers générés
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Routes de santé pour vérifier la connexion (supportant les deux chemins pour compatibilité)
const healthResponse = {
  status: 'OK',
  timestamp: new Date().toISOString(),
  database: 'PostgreSQL',
  version: require('./package.json').version || '1.0.0'
};

// Support pour les deux endpoints de santé (avec et sans underscore)
app.get('/_health', (req, res) => res.json(healthResponse));
app.get('/health', (req, res) => res.json(healthResponse));

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

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    database: 'PostgreSQL',
    version: process.env.npm_package_version || 'unknown'
  });
});

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

const startServer = async () => {
  try {
    console.log('Initialisation de la connexion à la base de données PostgreSQL...');
    // Vérification de la connexion à la base de données
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie avec succès.');
    
    // Synchronisation des modèles avec la base de données (en développement)
    if (process.env.NODE_ENV === 'development') {
      console.log('Synchronisation des modèles avec la base de données...');
      await sequelize.sync({ alter: true });
      console.log('Synchronisation terminée avec succès');
    }
    
    // Initialiser la base de données avec les tables et données par défaut
    console.log('Initialisation de la base de données...');
    const dbInitialized = await initDb();
    if (dbInitialized) {
      console.log('Base de données initialisée avec succès');
    } else {
      console.warn('\x1b[33m%s\x1b[0m', 'Avertissement: L\'initialisation de la base de données a échoué');
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Erreur de connexion à la base de données:', error);
    console.log('\x1b[33m%s\x1b[0m', 'Le serveur démarrera quand même, mais certaines fonctionnalités ne seront pas disponibles');
  } finally {
    // Start server even if database connection fails
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\x1b[32m%s\x1b[0m', `Serveur démarré et en écoute sur le port ${PORT}`);
      console.log(`URL API: http://localhost:${PORT}/api`);
      console.log(`Vérification santé: http://localhost:${PORT}/health`);
      console.log('\x1b[36m%s\x1b[0m', `Identificant par défaut: admin@example.com / mot de passe: admin123`);
    });
  }
};

startServer();