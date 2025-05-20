#!/usr/bin/env node

/**
 * Script de configuration des variables d'environnement Vercel via CLI
 * Ce script configure automatiquement toutes les variables d'environnement pour
 * le backend et le frontend du00e9ployu00e9s sur Vercel
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Configuration
const config = {
  backendDir: path.join(__dirname, 'backend'),
  frontendDir: path.join(__dirname, 'frontend'),
  backendProjectName: 'ppt-template-manager-api',
  frontendProjectName: 'ppt-template-manager-app',
  backendUrl: 'https://ppt-template-manager-snv6fg9ly-seiyar26s-projects.vercel.app',
  frontendUrl: 'https://frontend-p95j09tuw-seiyar26s-projects.vercel.app',
  supabaseUrl: 'https://mbwurtmvdgmnrizxfouf.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3VydG12ZGdtbnJpenhmb3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MDU4MDAsImV4cCI6MjA2MzI4MTgwMH0.tNF11pL0MQQKhb3ejQiHjLhTCIGqabIhKu-WIdZvMDs',
  supabaseServiceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3VydG12ZGdtbnJpenhmb3VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcwNTgwMCwiZXhwIjoyMDYzMjgxODAwfQ.Ojvhv2gXUNiv5NmdMniJyZKgY9d-MqjN3_3p9KIJFsY',
  jwtSecret: 'ppt_template_manager_secret_key_prod',
  convertApiSecret: 'secret_q4Pjq2F9FCU9ypDJ'
};

// Logging avec couleurs
function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[SUCCESS]${colors.reset}`,
    warning: `${colors.yellow}[WARNING]${colors.reset}`,
    error: `${colors.red}[ERROR]${colors.reset}`
  }[type] || `${colors.blue}[INFO]${colors.reset}`;
  
  console.log(`${prefix} ${message}`);
}

// Exu00e9cuter une commande
function execCommand(command, directory) {
  log(`Exu00e9cution de: ${command}`);
  try {
    const output = execSync(command, { 
      cwd: directory, 
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
    return { success: true, output };
  } catch (error) {
    log(`${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Ajouter une variable d'environnement u00e0 un projet Vercel
async function addEnvVar(projectDir, key, value, environment = 'production') {
  try {
    // La commande vercel env add demande une interaction utilisateur
    // Nous devons donc cru00e9er un processus qui ru00e9pond automatiquement aux questions
    const command = `cd ${projectDir} && echo "${value}" | vercel env add ${key} ${environment}`;
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`Variable ${key} configuru00e9e avec succu00e8s`, 'success');
    return true;
  } catch (error) {
    log(`Erreur lors de la configuration de ${key}: ${error.message}`, 'error');
    return false;
  }
}

// Vu00e9rifier si Vercel CLI est installu00e9
async function checkVercelCli() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    log('Vercel CLI est installu00e9', 'success');
    return true;
  } catch (error) {
    log('Vercel CLI n\'est pas installu00e9. Installation...', 'warning');
    const result = execCommand('npm install -g vercel');
    return result.success;
  }
}

// S'assurer que l'utilisateur est connectu00e9 u00e0 Vercel
async function ensureVercelLogin() {
  try {
    const whoamiResult = execSync('vercel whoami', { encoding: 'utf8', stdio: 'pipe' });
    log(`Connecté à Vercel en tant que: ${whoamiResult.trim()}`, 'success');
    return true;
  } catch (error) {
    log('Vous n\'êtes pas connecté à Vercel. Lancement de la procédure de connexion...', 'warning');
    try {
      execSync('vercel login', { stdio: 'inherit' });
      return true;
    } catch (loginError) {
      log('Échec de la connexion à Vercel', 'error');
      return false;
    }
  }
}

// Configurer les variables d'environnement pour le backend
async function configureBackendEnv() {
  log(`\n${colors.bold}Configuration des variables d'environnement pour le backend${colors.reset}`);
  
  // Liste des variables à configurer pour le backend
  const backendEnvVars = [
    { key: 'NODE_ENV', value: 'production' },
    { key: 'PORT', value: '8080' },
    { key: 'SUPABASE_URL', value: config.supabaseUrl },
    { key: 'SUPABASE_ANON_KEY', value: config.supabaseAnonKey },
    { key: 'SUPABASE_SERVICE_KEY', value: config.supabaseServiceKey },
    { key: 'JWT_SECRET', value: config.jwtSecret },
    { key: 'CONVERT_API_SECRET', value: config.convertApiSecret },
    { key: 'CORS_ORIGIN', value: config.frontendUrl }
  ];
  
  // Configurer chaque variable
  for (const envVar of backendEnvVars) {
    await addEnvVar(config.backendDir, envVar.key, envVar.value);
  }
  
  // Redu00e9ployer le backend pour appliquer les changements
  log('Redu00e9ploiement du backend pour appliquer les variables d\'environnement...');
  const redeployResult = execCommand('vercel --prod', config.backendDir);
  
  if (redeployResult.success) {
    log('Backend redu00e9ployu00e9 avec succu00e8s', 'success');
  } else {
    log('Erreur lors du redu00e9ploiement du backend', 'error');
  }
}

// Configurer les variables d'environnement pour le frontend
async function configureFrontendEnv() {
  log(`\n${colors.bold}Configuration des variables d'environnement pour le frontend${colors.reset}`);
  
  // Liste des variables à configurer pour le frontend
  const frontendEnvVars = [
    { key: 'REACT_APP_API_URL', value: config.backendUrl },
    { key: 'REACT_APP_SUPABASE_URL', value: config.supabaseUrl },
    { key: 'REACT_APP_SUPABASE_ANON_KEY', value: config.supabaseAnonKey }
  ];
  
  // Configurer chaque variable
  for (const envVar of frontendEnvVars) {
    await addEnvVar(config.frontendDir, envVar.key, envVar.value);
  }
  
  // Redu00e9ployer le frontend pour appliquer les changements
  log('Redu00e9ploiement du frontend pour appliquer les variables d\'environnement...');
  const redeployResult = execCommand('vercel --prod', config.frontendDir);
  
  if (redeployResult.success) {
    log('Frontend redu00e9ployu00e9 avec succu00e8s', 'success');
  } else {
    log('Erreur lors du redu00e9ploiement du frontend', 'error');
  }
}

// Fonction principale
async function main() {
  console.log(`\n${colors.bold}${colors.cyan}=====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  CONFIGURATION AUTOMATIQUE DES VARIABLES D'ENVIRONNEMENT${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}=====================================================${colors.reset}\n`);
  
  // Vu00e9rification des pru00e9requis
  const hasVercelCli = await checkVercelCli();
  if (!hasVercelCli) {
    log('Vercel CLI est requis pour exu00e9cuter ce script. Installez-le avec: npm install -g vercel', 'error');
    process.exit(1);
  }
  
  // S'assurer que l'utilisateur est connectu00e9
  const isLoggedIn = await ensureVercelLogin();
  if (!isLoggedIn) {
    log('Vous devez être connecté à Vercel pour configurer les variables d\'environnement', 'error');
    process.exit(1);
  }
  
  // S'assurer que les projets sont liu00e9s
  log('Liaison des projets Vercel avec les ru00e9pertoires locaux...');
  execCommand(`vercel link --confirm -p ${config.backendProjectName}`, config.backendDir);
  execCommand(`vercel link --confirm -p ${config.frontendProjectName}`, config.frontendDir);
  
  // Configurer les variables d'environnement
  await configureBackendEnv();
  await configureFrontendEnv();
  
  console.log(`\n${colors.bold}${colors.green}=====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.green}  CONFIGURATION TERMINu00c9E AVEC SUCCu00c8S !                ${colors.reset}`);
  console.log(`${colors.bold}${colors.green}=====================================================${colors.reset}\n`);
  
  console.log(`${colors.cyan}Toutes les variables d'environnement ont u00e9tu00e9 configuru00e9es${colors.reset}`);
  console.log(`${colors.cyan}Les projets ont u00e9tu00e9 redu00e9ployu00e9s pour appliquer les changements${colors.reset}`);
  console.log(`\n${colors.cyan}URLs de production:${colors.reset}`);
  console.log(`${colors.bold}Frontend: ${config.frontendUrl}${colors.reset}`);
  console.log(`${colors.bold}Backend: ${config.backendUrl}${colors.reset}\n`);
}

// Lancer le script
main();
