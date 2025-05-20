#!/usr/bin/env node

/**
 * Script de surveillance des déploiements
 * 
 * Ce script permet de surveiller en temps réel l'état des déploiements
 * de votre application sur Railway et Vercel.
 */

const https = require('https');
const readline = require('readline');
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
let config = {
  backendUrl: process.env.BACKEND_URL || '',
  frontendUrl: process.env.FRONTEND_URL || '',
  interval: 30000 // 30 secondes entre chaque vérification
};

// Charger la configuration depuis un fichier s'il existe
const configFile = path.join(__dirname, '.deploy-config.json');
if (fs.existsSync(configFile)) {
  try {
    const savedConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    config = { ...config, ...savedConfig };
  } catch (err) {
    console.log(`${colors.yellow}Impossible de charger la configuration: ${err.message}${colors.reset}`);
  }
}

// Interface de ligne de commande
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour effacer l'écran du terminal
function clearScreen() {
  process.stdout.write('\x1Bc');
}

// Fonction pour faire une requête HTTP
function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data)
            });
          } catch {
            resolve({
              status: res.statusCode,
              data: data
            });
          }
        } else {
          reject(new Error(`Status code: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Fonction pour vérifier l'état du backend
async function checkBackend() {
  if (!config.backendUrl) {
    return { status: 'unknown', message: 'URL non configurée' };
  }

  try {
    const response = await makeHttpRequest(`${config.backendUrl}/health`);
    return {
      status: 'online',
      details: response.data
    };
  } catch (error) {
    return {
      status: 'offline',
      message: error.message
    };
  }
}

// Fonction pour vérifier l'état du frontend
async function checkFrontend() {
  if (!config.frontendUrl) {
    return { status: 'unknown', message: 'URL non configurée' };
  }

  try {
    await makeHttpRequest(config.frontendUrl);
    return {
      status: 'online'
    };
  } catch (error) {
    return {
      status: 'offline',
      message: error.message
    };
  }
}

// Formater un statut pour l'affichage
function formatStatus(status) {
  switch (status) {
    case 'online':
      return `${colors.green}En ligne${colors.reset}`;
    case 'offline':
      return `${colors.red}Hors ligne${colors.reset}`;
    case 'unknown':
    default:
      return `${colors.yellow}Inconnu${colors.reset}`;
  }
}

// Afficher le tableau de bord
async function displayDashboard() {
  clearScreen();

  console.log(`${colors.bold}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}  TABLEAU DE BORD DES DÉPLOIEMENTS      ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}========================================${colors.reset}\n`);
  
  console.log(`${colors.bold}Dernière mise à jour: ${new Date().toLocaleString()}${colors.reset}\n`);
  
  // Vérifier l'état du backend
  const backendStatus = await checkBackend();
  console.log(`${colors.bold}Backend:${colors.reset}`);
  console.log(`  URL: ${colors.cyan}${config.backendUrl || 'Non configurée'}${colors.reset}`);
  console.log(`  Statut: ${formatStatus(backendStatus.status)}`);
  
  if (backendStatus.details) {
    console.log(`  Version: ${backendStatus.details.version || 'Inconnue'}`);
    console.log(`  Environnement: ${backendStatus.details.environment || 'Inconnu'}`);
    if (backendStatus.details.checks && backendStatus.details.checks.database) {
      console.log(`  Base de données: ${formatStatus(backendStatus.details.checks.database.status === 'ok' ? 'online' : 'offline')}`);
    }
  }
  
  console.log();
  
  // Vérifier l'état du frontend
  const frontendStatus = await checkFrontend();
  console.log(`${colors.bold}Frontend:${colors.reset}`);
  console.log(`  URL: ${colors.cyan}${config.frontendUrl || 'Non configurée'}${colors.reset}`);
  console.log(`  Statut: ${formatStatus(frontendStatus.status)}`);
  
  console.log(`\n${colors.bold}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.yellow}Actualisation automatique toutes les ${config.interval / 1000} secondes${colors.reset}`);
  console.log(`${colors.yellow}Appuyez sur 'q' pour quitter, 'r' pour actualiser, 'c' pour configurer${colors.reset}`);
}

// Configurer les URL
function configureUrls() {
  clearScreen();
  console.log(`${colors.bold}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}  CONFIGURATION DES DÉPLOIEMENTS        ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}========================================${colors.reset}\n`);
  
  rl.question(`URL du backend (actuelle: ${config.backendUrl || 'non configurée'}): `, (backendUrl) => {
    if (backendUrl) config.backendUrl = backendUrl.trim();
    
    rl.question(`URL du frontend (actuelle: ${config.frontendUrl || 'non configurée'}): `, (frontendUrl) => {
      if (frontendUrl) config.frontendUrl = frontendUrl.trim();
      
      // Enregistrer la configuration
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
      console.log(`\n${colors.green}Configuration enregistrée${colors.reset}`);
      
      // Revenir au tableau de bord
      setTimeout(() => {
        mainLoop();
      }, 1500);
    });
  });
}

// Boucle principale
async function mainLoop() {
  // Afficher le tableau de bord
  await displayDashboard();
  
  // Mettre en place un intervalle pour l'actualisation automatique
  const updateInterval = setInterval(async () => {
    await displayDashboard();
  }, config.interval);
  
  // Gestion des entrées utilisateur
  const keyPressHandler = (key) => {
    if (key === '\u0003' || key.toLowerCase() === 'q') {
      // Ctrl+C ou 'q' pour quitter
      clearInterval(updateInterval);
      rl.removeListener('line', keyPressHandler);
      rl.close();
      process.exit(0);
    } else if (key.toLowerCase() === 'r') {
      // 'r' pour rafraîchir
      displayDashboard();
    } else if (key.toLowerCase() === 'c') {
      // 'c' pour configurer
      clearInterval(updateInterval);
      rl.removeListener('line', keyPressHandler);
      configureUrls();
    }
  };
  
  rl.on('line', keyPressHandler);
}

// Démarrer l'application
mainLoop();
