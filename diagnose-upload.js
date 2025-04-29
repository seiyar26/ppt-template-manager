/**
 * Script de diagnostic des problèmes d'upload de fichiers PPTX
 * Exécuter avec: node diagnose-upload.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

// Configuration
const projectRoot = __dirname;
const uploadDirs = [
  path.join(projectRoot, 'uploads'),
  path.join(projectRoot, 'uploads/temp'),
  path.join(projectRoot, 'uploads/templates'),
  path.join(projectRoot, 'uploads/exports'),
  path.join(projectRoot, 'backend/uploads'),
  path.join(projectRoot, 'backend/uploads/temp'),
  path.join(projectRoot, 'backend/uploads/templates'),
  path.join(projectRoot, 'backend/uploads/exports')
];

// Création du répertoire de rapport
const reportDir = path.join(projectRoot, 'diagnostic-reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Fichier de rapport
const reportFile = path.join(reportDir, `upload-diagnostic-${Date.now()}.txt`);
const report = [];

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  report.push(logMessage);
}

log('=== DIAGNOSTIC DES PROBLÈMES D\'UPLOAD DE FICHIERS PPTX ===')
log(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
log(`Système: ${os.type()} ${os.release()} ${os.arch()}`);
log(`Utilisateur: ${os.userInfo().username}`);
log(`Répertoire projet: ${projectRoot}`);
log('\n=== VÉRIFICATION DES DÉPENDANCES ===')

// Vérifier les packages installés
exec('npm list multer axios express', { cwd: path.join(projectRoot, 'backend') }, (error, stdout, stderr) => {
  log('Packages installés:');
  log(stdout);
  if (stderr) log(`Stderr: ${stderr}`);
  
  checkDirectories();
});

function checkDirectories() {
  log('\n=== VÉRIFICATION DES RÉPERTOIRES ===')
  
  uploadDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    let permissions = 'N/A';
    let writable = false;
    let content = [];
    
    if (exists) {
      try {
        // Test d'écriture
        const testFile = path.join(dir, '.test-write');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        writable = true;
        permissions = fs.statSync(dir).mode.toString(8).slice(-3);
        content = fs.readdirSync(dir);
      } catch (e) {
        writable = false;
        permissions = e.message;
      }
    }
    
    log(`Répertoire: ${dir}`);
    log(`  Existe: ${exists ? 'OUI' : 'NON'}`);
    log(`  Permissions: ${permissions}`);
    log(`  Accessible en écriture: ${writable ? 'OUI' : 'NON'}`);
    log(`  Contenu: ${content.length} fichiers/dossiers`);
  });
  
  // Si les répertoires n'existent pas, les créer
  let directoriesFixed = false;
  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        log(`Répertoire créé: ${dir}`);
        directoriesFixed = true;
      } catch (e) {
        log(`ERREUR lors de la création du répertoire ${dir}: ${e.message}`);
      }
    }
  });
  
  checkApiEndpoint();
}

function checkApiEndpoint() {
  log('\n=== VÉRIFICATION DES ROUTES API ===')
  
  const routesFile = path.join(projectRoot, 'backend/routes/templateRoutes.js');
  if (fs.existsSync(routesFile)) {
    const content = fs.readFileSync(routesFile, 'utf8');
    log(`Route de téléchargement: ${content.includes('upload.single(\'file\')') ? 'TROUVÉE' : 'NON TROUVÉE'}`);
    log(`Middleware auth: ${content.includes('router.use(auth)') ? 'CONFIGURÉ' : 'NON CONFIGURÉ'}`);
  } else {
    log(`Fichier de routes non trouvé: ${routesFile}`);
  }
  
  checkFrontendConfig();
}

function checkFrontendConfig() {
  log('\n=== VÉRIFICATION DE LA CONFIGURATION FRONTEND ===')
  
  const apiFile = path.join(projectRoot, 'frontend/src/services/api.js');
  if (fs.existsSync(apiFile)) {
    const content = fs.readFileSync(apiFile, 'utf8');
    log(`URL API configurée: ${content.includes('REACT_APP_API_URL') ? 'OUI' : 'NON'}`);
    log(`Content-Type pour FormData: ${content.includes('multipart/form-data') ? 'CONFIGURÉ' : 'NON CONFIGURÉ'}`);
    log(`Intercepteur tokens: ${content.includes('Authorization') ? 'CONFIGURÉ' : 'NON CONFIGURÉ'}`);
  } else {
    log(`Fichier API non trouvé: ${apiFile}`);
  }
  
  generateTestFile();
}

function generateTestFile() {
  log('\n=== GÉNÉRATION D\'UN FICHIER PPTX DE TEST ===')
  
  // Créer un fichier de test
  const testFile = path.join(reportDir, 'test.txt');
  fs.writeFileSync(testFile, 'Ceci est un fichier de test');
  
  log(`Fichier de test créé: ${testFile}`);
  log(`Taille: ${fs.statSync(testFile).size} octets`);
  
  finishReport();
}

function finishReport() {
  log('\n=== DIAGNOSTIC TERMINÉ ===')
  log('Recommandations:')
  log('1. Assurez-vous que tous les répertoires d\'upload existent et sont accessibles en écriture')
  log('2. Vérifiez que le Content-Type est bien supprimé pour les requêtes FormData')
  log('3. Vérifiez que tous les middlewares sont correctement appliqués')
  log('4. Testez avec un fichier PPTX de petite taille')
  
  // Écrire le rapport dans un fichier
  fs.writeFileSync(reportFile, report.join('\n'));
  
  console.log(`\nRapport de diagnostic enregistré: ${reportFile}`);
  console.log('Pour appliquer les corrections automatiques, exécutez: node fix-upload.js');
}

// Démarrer le diagnostic
log('Démarrage du diagnostic...');
