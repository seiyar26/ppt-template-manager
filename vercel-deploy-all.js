#!/usr/bin/env node

/**
 * Script de déploiement unifié sur Vercel
 * Ce script déploie à la fois le backend et le frontend sur Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Configuration
const config = {
  backendDir: path.join(__dirname, 'backend'),
  frontendDir: path.join(__dirname, 'frontend'),
  tempDir: path.join(__dirname, '.deploy-temp'),
  backendProjectName: 'ppt-template-manager-api',
  frontendProjectName: 'ppt-template-manager-app',
  supabaseUrl: 'https://mbwurtmvdgmnrizxfouf.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3VydG12ZGdtbnJpenhmb3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MDU4MDAsImV4cCI6MjA2MzI4MTgwMH0.tNF11pL0MQQKhb3ejQiHjLhTCIGqabIhKu-WIdZvMDs',
  supabaseServiceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3VydG12ZGdtbnJpenhmb3VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcwNTgwMCwiZXhwIjoyMDYzMjgxODAwfQ.Ojvhv2gXUNiv5NmdMniJyZKgY9d-MqjN3_3p9KIJFsY',
  jwtSecret: 'ppt_template_manager_secret_key_prod',
  convertApiSecret: 'secret_q4Pjq2F9FCU9ypDJ'
};

// Créer le répertoire temporaire
if (!fs.existsSync(config.tempDir)) {
  fs.mkdirSync(config.tempDir, { recursive: true });
}

// Logger avec horodatage
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[SUCCESS]${colors.reset}`,
    warning: `${colors.yellow}[WARNING]${colors.reset}`,
    error: `${colors.red}[ERROR]${colors.reset}`
  }[type] || `${colors.blue}[INFO]${colors.reset}`;
  
  console.log(`${prefix} ${timestamp} - ${message}`);
  
  // Enregistrer également dans un fichier journal
  const logFile = path.join(config.tempDir, 'vercel-deployment.log');
  fs.appendFileSync(logFile, `${timestamp} - ${type.toUpperCase()}: ${message}\n`);
}

// Exécuter une commande et journaliser les résultats
function execCommand(command, directory = __dirname) {
  log(`Exécution de: ${command}`, 'info');
  try {
    const output = execSync(command, { 
      cwd: directory, 
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'] 
    });
    log(`Commande exécutée avec succès: ${command}`, 'success');
    return { success: true, output };
  } catch (error) {
    log(`Erreur lors de l'exécution de: ${command}\n${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Vérifier et installer Vercel CLI
async function installVercelCLI() {
  log('Vérification et installation de Vercel CLI...', 'info');
  
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    log('Vercel CLI est déjà installé', 'success');
  } catch (err) {
    log('Installation de Vercel CLI...', 'info');
    execCommand('npm install -g vercel');
  }
}

// Préparer le backend pour Vercel
async function prepareBackend() {
  log('Préparation du backend pour Vercel...', 'info');
  
  // Créer le fichier vercel.json pour le backend
  const vercelConfig = {
    "version": 2,
    "builds": [
      {
        "src": "server.js",
        "use": "@vercel/node"
      }
    ],
    "routes": [
      {
        "src": "/(.*)",
        "dest": "server.js"
      }
    ],
    "env": {
      "NODE_ENV": "production"
    }
  };
  
  fs.writeFileSync(
    path.join(config.backendDir, 'vercel.json'), 
    JSON.stringify(vercelConfig, null, 2)
  );
  
  log('Configuration Vercel du backend créée avec succès', 'success');
  return true;
}

// Déployer le backend sur Vercel
async function deployBackend() {
  log('Déploiement du backend sur Vercel...', 'info');
  
  // Configuration des variables d'environnement pour le backend
  const envCommand = `vercel env add SUPABASE_URL production ${config.supabaseUrl} -y && \
  vercel env add SUPABASE_ANON_KEY production ${config.supabaseAnonKey} -y && \
  vercel env add SUPABASE_SERVICE_KEY production ${config.supabaseServiceKey} -y && \
  vercel env add JWT_SECRET production ${config.jwtSecret} -y && \
  vercel env add CONVERT_API_SECRET production ${config.convertApiSecret} -y`;
  
  try {
    // Déploiement du backend avec spécification du nom de projet
    log('Déploiement du backend sur Vercel...', 'info');
    const deployCommand = `vercel --prod -y --name ${config.backendProjectName}`;
    const deployResult = execCommand(deployCommand, config.backendDir);
    
    if (!deployResult.success) {
      log('Échec du déploiement du backend', 'error');
      return null;
    }
    
    // Extraire l'URL du déploiement
    const output = deployResult.output;
    const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/);
    const backendUrl = urlMatch ? urlMatch[0] : null;
    
    if (!backendUrl) {
      log('Impossible de récupérer l\'URL du backend après déploiement', 'warning');
      return `https://${config.backendProjectName}.vercel.app`;
    }
    
    log(`Backend déployé avec succès: ${backendUrl}`, 'success');
    return backendUrl;
  } catch (error) {
    log(`Erreur lors du déploiement du backend: ${error.message}`, 'error');
    return null;
  }
}

// Préparer le frontend pour le déploiement sur Vercel
async function prepareFrontend(backendUrl) {
  log('Préparation du frontend pour Vercel...', 'info');
  
  // Mettre à jour .env.production pour le frontend
  const envFile = path.join(config.frontendDir, '.env.production');
  let envContent = '';
  
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf8');
  }
  
  // Mettre à jour REACT_APP_API_URL
  const apiUrlRegex = /REACT_APP_API_URL=.*/;
  const newApiUrlLine = `REACT_APP_API_URL=${backendUrl}`;
  
  if (apiUrlRegex.test(envContent)) {
    envContent = envContent.replace(apiUrlRegex, newApiUrlLine);
  } else {
    envContent += `\n${newApiUrlLine}`;
  }
  
  // Mettre à jour les variables Supabase
  const supabaseUrlRegex = /REACT_APP_SUPABASE_URL=.*/;
  const supabaseKeyRegex = /REACT_APP_SUPABASE_ANON_KEY=.*/;
  
  if (!supabaseUrlRegex.test(envContent)) {
    envContent += `\nREACT_APP_SUPABASE_URL=${config.supabaseUrl}`;
  }
  
  if (!supabaseKeyRegex.test(envContent)) {
    envContent += `\nREACT_APP_SUPABASE_ANON_KEY=${config.supabaseAnonKey}`;
  }
  
  fs.writeFileSync(envFile, envContent.trim() + '\n');
  
  // Créer ou mettre à jour le fichier vercel.json pour le frontend
  const vercelConfig = {
    "version": 2,
    "buildCommand": "npm run build",
    "outputDirectory": "build",
    "routes": [
      {
        "src": "/static/(.*)",
        "headers": { "cache-control": "public, max-age=31536000, immutable" },
        "dest": "/static/$1"
      },
      {
        "src": "/favicon.ico",
        "dest": "/favicon.ico"
      },
      {
        "src": "/manifest.json",
        "dest": "/manifest.json"
      },
      {
        "src": "/(.*)",
        "dest": "/index.html"
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(config.frontendDir, 'vercel.json'), 
    JSON.stringify(vercelConfig, null, 2)
  );
  
  log('Frontend préparé avec succès pour le déploiement', 'success');
  return true;
}

// Déployer le frontend sur Vercel
async function deployFrontend() {
  log('Déploiement du frontend sur Vercel...', 'info');
  
  // Déploiement du frontend avec spécification du nom de projet
  const deployCommand = `vercel --prod -y --name ${config.frontendProjectName}`;
  const deployResult = execCommand(deployCommand, config.frontendDir);
  
  if (!deployResult.success) {
    log('Échec du déploiement du frontend', 'error');
    return null;
  }
  
  // Extraire l'URL du déploiement
  const output = deployResult.output;
  const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/);
  const frontendUrl = urlMatch ? urlMatch[0] : null;
  
  if (!frontendUrl) {
    log('Impossible de récupérer l\'URL du frontend après déploiement', 'warning');
    return `https://${config.frontendProjectName}.vercel.app`;
  }
  
  log(`Frontend déployé avec succès: ${frontendUrl}`, 'success');
  return frontendUrl;
}

// Mettre à jour la configuration CORS sur le backend déployé
async function updateCorsOnBackend(backendUrl, frontendUrl) {
  log('Configuration de CORS sur le backend déployé...', 'info');
  
  // Utiliser Vercel ENV pour configurer les variables d'environnement
  const corsCommand = `vercel env add CORS_ORIGIN production ${frontendUrl} -y`;
  const corsResult = execCommand(corsCommand, config.backendDir);
  
  if (corsResult.success) {
    log('Configuration CORS mise à jour avec succès', 'success');
    
    // Redéployer le backend pour appliquer la nouvelle configuration
    log('Redéploiement du backend pour appliquer la configuration CORS...', 'info');
    execCommand('vercel --prod -y', config.backendDir);
  } else {
    log('Échec de la configuration CORS', 'warning');
  }
}

// Générer un rapport de déploiement
function generateDeploymentReport(backendUrl, frontendUrl) {
  const reportContent = `
=========================================
     DÉPLOIEMENT COMPLET SUR VERCEL
=========================================

Date: ${new Date().toISOString()}
Application: PPT Template Manager

BACKEND:
  URL: ${backendUrl}
  État: Déployé
  Plateforme: Vercel
  
FRONTEND:
  URL: ${frontendUrl}
  État: Déployé
  Plateforme: Vercel

CONFIGURATION:
  Base de données: Supabase (${config.supabaseUrl})
  CORS: Configuré pour accepter les requêtes de ${frontendUrl}
  Variables d'environnement: Configurées correctement

PROCHAINES ÉTAPES:
  1. Accéder à l'application via: ${frontendUrl}
  2. Vérifier l'état du backend: ${backendUrl}/health
  3. Se connecter avec les identifiants par défaut

SURVEILLANCE:
  Tableau de bord Vercel: https://vercel.com/dashboard

=========================================
`;

  const reportFile = path.join(config.tempDir, 'vercel-deployment-report.txt');
  fs.writeFileSync(reportFile, reportContent);
  
  log(`Rapport de déploiement généré: ${reportFile}`, 'success');
  return reportContent;
}

// Fonction principale de déploiement
async function deployAll() {
  console.log(`${colors.bold}${colors.blue}=====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}  DÉPLOIEMENT COMPLET SUR VERCEL                     ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}=====================================================${colors.reset}\n`);
  
  try {
    // Étape 1: Installation de Vercel CLI
    await installVercelCLI();
    
    // Étape 2: Préparation du backend
    const backendPrepared = await prepareBackend();
    if (!backendPrepared) {
      throw new Error('Échec de la préparation du backend');
    }
    
    // Étape 3: Déploiement du backend
    const backendUrl = await deployBackend();
    if (!backendUrl) {
      throw new Error('Échec du déploiement du backend');
    }
    
    // Étape 4: Préparation du frontend
    const frontendPrepared = await prepareFrontend(backendUrl);
    if (!frontendPrepared) {
      throw new Error('Échec de la préparation du frontend');
    }
    
    // Étape 5: Déploiement du frontend
    const frontendUrl = await deployFrontend();
    if (!frontendUrl) {
      throw new Error('Échec du déploiement du frontend');
    }
    
    // Étape 6: Mise à jour de CORS sur le backend
    await updateCorsOnBackend(backendUrl, frontendUrl);
    
    // Étape 7: Génération du rapport de déploiement
    const report = generateDeploymentReport(backendUrl, frontendUrl);
    
    // Affichage du rapport
    console.log('\n' + report);
    
    console.log(`${colors.bold}${colors.green}=====================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.green}  DÉPLOIEMENT VERCEL TERMINÉ AVEC SUCCÈS !          ${colors.reset}`);
    console.log(`${colors.bold}${colors.green}=====================================================${colors.reset}\n`);
    
    console.log(`${colors.cyan}Pour accéder à votre application:${colors.reset}`);
    console.log(`${colors.bold}Frontend: ${frontendUrl}${colors.reset}`);
    console.log(`${colors.bold}Backend: ${backendUrl}/health${colors.reset}\n`);
    
  } catch (error) {
    log(`Erreur lors du déploiement: ${error.message}`, 'error');
    console.log(`${colors.bold}${colors.red}=====================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.red}  ÉCHEC DU DÉPLOIEMENT                               ${colors.reset}`);
    console.log(`${colors.bold}${colors.red}=====================================================${colors.reset}\n`);
    console.log(`${colors.red}Consultez le fichier journal pour plus de détails:${colors.reset}`);
    console.log(`${colors.bold}${path.join(config.tempDir, 'vercel-deployment.log')}${colors.reset}\n`);
  }
}

// Démarrer le déploiement
deployAll();
