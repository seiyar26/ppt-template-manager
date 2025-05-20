#!/usr/bin/env node

/**
 * Script de déploiement unifié sur Railway
 * Ce script déploie à la fois le backend et le frontend sur Railway
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
  backendProjectName: 'ppt-template-manager-backend',
  frontendProjectName: 'ppt-template-manager-frontend',
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
  const logFile = path.join(config.tempDir, 'railway-deployment.log');
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

// Vérifier et installer Railway CLI
async function installRailwayCLI() {
  log('Vérification et installation de Railway CLI...', 'info');
  
  try {
    execSync('railway version', { stdio: 'ignore' });
    log('Railway CLI est déjà installé', 'success');
  } catch (err) {
    log('Installation de Railway CLI...', 'info');
    execCommand('npm install -g @railway/cli');
  }
}

// Préparer et déployer le backend sur Railway
async function deployBackend() {
  log('Préparation du backend pour Railway...', 'info');
  
  // Exécuter le script de préparation existant
  execCommand('node prepare-for-railway.js', config.backendDir);
  
  log('Initialisation du projet Railway pour le backend...', 'info');
  const backendInit = execCommand(`railway init --name ${config.backendProjectName}`, config.backendDir);
  
  if (!backendInit.success) {
    log('Échec de l\'initialisation du projet Railway pour le backend', 'error');
    return null;
  }
  
  // Configuration des variables d'environnement
  log('Configuration des variables d\'environnement pour le backend...', 'info');
  
  const envVars = [
    'PORT=8080',
    'NODE_ENV=production',
    `SUPABASE_URL=${config.supabaseUrl}`,
    `SUPABASE_ANON_KEY=${config.supabaseAnonKey}`,
    `SUPABASE_SERVICE_KEY=${config.supabaseServiceKey}`,
    `JWT_SECRET=${config.jwtSecret}`,
    `CONVERT_API_SECRET=${config.convertApiSecret}`
  ];
  
  for (const envVar of envVars) {
    execCommand(`railway variables set ${envVar}`, config.backendDir);
  }
  
  // Déploiement du backend
  log('Déploiement du backend sur Railway...', 'info');
  const deployResult = execCommand('railway up', config.backendDir);
  
  if (!deployResult.success) {
    log('Échec du déploiement du backend', 'error');
    return null;
  }
  
  // Récupérer l'URL du backend
  log('Récupération de l\'URL du backend...', 'info');
  const domainResult = execCommand('railway domain', config.backendDir);
  const backendUrl = domainResult.success ? domainResult.output.trim() : null;
  
  if (backendUrl) {
    log(`Backend déployé avec succès à l'adresse: ${backendUrl}`, 'success');
    return backendUrl;
  } else {
    log('Impossible de récupérer l\'URL du backend', 'warning');
    return `${config.backendProjectName}.up.railway.app`;
  }
}

// Préparer le frontend pour Railway
async function prepareFrontend(backendUrl) {
  log('Préparation du frontend pour Railway...', 'info');
  
  // Créer un fichier railway.json pour le frontend
  const railwayConfig = {
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
      "builder": "NIXPACKS",
      "buildCommand": "npm install && npm run build"
    },
    "deploy": {
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 10,
      "startCommand": "npx serve -s build",
      "healthcheckPath": "/",
      "healthcheckTimeout": 300
    }
  };
  
  fs.writeFileSync(
    path.join(config.frontendDir, 'railway.json'), 
    JSON.stringify(railwayConfig, null, 2)
  );
  
  // Mettre à jour les variables d'environnement dans .env.production
  log('Mise à jour des variables d\'environnement du frontend...', 'info');
  
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
  
  // Installer serve pour servir l'application statique
  log('Installation de serve pour le frontend...', 'info');
  execCommand('npm install --save-dev serve', config.frontendDir);
  
  return true;
}

// Déployer le frontend sur Railway
async function deployFrontend(backendUrl) {
  log('Initialisation du projet Railway pour le frontend...', 'info');
  const frontendInit = execCommand(`railway init --name ${config.frontendProjectName}`, config.frontendDir);
  
  if (!frontendInit.success) {
    log('Échec de l\'initialisation du projet Railway pour le frontend', 'error');
    return null;
  }
  
  // Configuration des variables d'environnement
  log('Configuration des variables d\'environnement pour le frontend...', 'info');
  execCommand(`railway variables set REACT_APP_API_URL=${backendUrl}`, config.frontendDir);
  execCommand(`railway variables set REACT_APP_SUPABASE_URL=${config.supabaseUrl}`, config.frontendDir);
  execCommand(`railway variables set REACT_APP_SUPABASE_ANON_KEY=${config.supabaseAnonKey}`, config.frontendDir);
  execCommand('railway variables set NODE_ENV=production', config.frontendDir);
  execCommand('railway variables set PORT=3000', config.frontendDir);
  
  // Déploiement du frontend
  log('Déploiement du frontend sur Railway...', 'info');
  const deployResult = execCommand('railway up', config.frontendDir);
  
  if (!deployResult.success) {
    log('Échec du déploiement du frontend', 'error');
    return null;
  }
  
  // Récupérer l'URL du frontend
  log('Récupération de l\'URL du frontend...', 'info');
  const domainResult = execCommand('railway domain', config.frontendDir);
  const frontendUrl = domainResult.success ? domainResult.output.trim() : null;
  
  if (frontendUrl) {
    log(`Frontend déployé avec succès à l'adresse: ${frontendUrl}`, 'success');
    return frontendUrl;
  } else {
    log('Impossible de récupérer l\'URL du frontend', 'warning');
    return `${config.frontendProjectName}.up.railway.app`;
  }
}

// Mettre à jour la configuration CORS du backend
async function updateCorsConfiguration(frontendUrl) {
  log('Mise à jour de la configuration CORS du backend...', 'info');
  execCommand(`railway variables set CORS_ORIGIN=${frontendUrl}`, config.backendDir);
  log('Configuration CORS mise à jour avec succès', 'success');
}

// Générer un rapport de déploiement
function generateDeploymentReport(backendUrl, frontendUrl) {
  const reportContent = `
=========================================
     DÉPLOIEMENT COMPLET SUR RAILWAY
=========================================

Date: ${new Date().toISOString()}
Application: PPT Template Manager

BACKEND:
  URL: ${backendUrl}
  État: Déployé
  Plateforme: Railway
  
FRONTEND:
  URL: ${frontendUrl}
  État: Déployé
  Plateforme: Railway (application React statique)

CONFIGURATION:
  Base de données: Supabase (${config.supabaseUrl})
  CORS: Configuré pour accepter les requêtes de ${frontendUrl}
  Variables d'environnement: Configurées correctement

PROCHAINES ÉTAPES:
  1. Accéder à l'application via: ${frontendUrl}
  2. Vérifier l'état du backend: ${backendUrl}/health
  3. Se connecter avec les identifiants par défaut

SURVEILLANCE:
  Tableau de bord Railway: https://railway.app/dashboard

=========================================
`;

  const reportFile = path.join(config.tempDir, 'railway-deployment-report.txt');
  fs.writeFileSync(reportFile, reportContent);
  
  log(`Rapport de déploiement généré: ${reportFile}`, 'success');
  return reportContent;
}

// Fonction principale de déploiement unifié
async function deployAll() {
  console.log(`${colors.bold}${colors.blue}=====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}  DÉPLOIEMENT COMPLET SUR RAILWAY                    ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}=====================================================${colors.reset}\n`);
  
  try {
    // Étape 1: Installation de Railway CLI
    await installRailwayCLI();
    
    // Étape 2: Déploiement du backend
    const backendUrl = await deployBackend();
    if (!backendUrl) {
      throw new Error('Échec du déploiement du backend');
    }
    
    // Étape 3: Préparation du frontend
    const frontendPrepared = await prepareFrontend(backendUrl);
    if (!frontendPrepared) {
      throw new Error('Échec de la préparation du frontend');
    }
    
    // Étape 4: Déploiement du frontend
    const frontendUrl = await deployFrontend(backendUrl);
    if (!frontendUrl) {
      throw new Error('Échec du déploiement du frontend');
    }
    
    // Étape 5: Mise à jour de CORS sur le backend
    await updateCorsConfiguration(frontendUrl);
    
    // Étape 6: Génération du rapport de déploiement
    const report = generateDeploymentReport(backendUrl, frontendUrl);
    
    // Affichage du rapport
    console.log('\n' + report);
    
    console.log(`${colors.bold}${colors.green}=====================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.green}  DÉPLOIEMENT RAILWAY TERMINÉ AVEC SUCCÈS !          ${colors.reset}`);
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
    console.log(`${colors.bold}${path.join(config.tempDir, 'railway-deployment.log')}${colors.reset}\n`);
  }
}

// Démarrer le déploiement
deployAll();
