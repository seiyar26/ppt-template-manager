#!/usr/bin/env node

/**
 * Script de préparation au déploiement sur Railway
 * 
 * Ce script:
 * 1. Vérifie les configurations nécessaires
 * 2. Crée/met à jour les fichiers de configuration pour Railway
 * 3. Prépare le projet pour le déploiement
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.blue}=== Préparation du déploiement sur Railway ===${colors.reset}`);

// Vérifier que nous sommes dans le dossier backend
const currentDir = process.cwd();
const isBackendDir = fs.existsSync(path.join(currentDir, 'server.js')) && 
                    fs.existsSync(path.join(currentDir, 'package.json'));

if (!isBackendDir) {
  console.error(`${colors.red}Erreur: Ce script doit être exécuté depuis le dossier backend${colors.reset}`);
  console.log(`${colors.yellow}Exécutez: cd backend && node prepare-for-railway.js${colors.reset}`);
  process.exit(1);
}

// Vérifier que le fichier .env.production existe
const envProdPath = path.join(currentDir, '.env.production');
if (!fs.existsSync(envProdPath)) {
  console.error(`${colors.red}Erreur: Fichier .env.production non trouvé${colors.reset}`);
  process.exit(1);
}

// Vérifier le fichier railway.json
const railwayJsonPath = path.join(currentDir, 'railway.json');
if (!fs.existsSync(railwayJsonPath)) {
  console.log(`${colors.yellow}Création du fichier railway.json...${colors.reset}`);
  
  const railwayConfig = {
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
      "builder": "NIXPACKS",
      "buildCommand": "npm install"
    },
    "deploy": {
      "startCommand": "npm start",
      "healthcheckPath": "/health",
      "healthcheckTimeout": 300,
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 10
    }
  };
  
  fs.writeFileSync(railwayJsonPath, JSON.stringify(railwayConfig, null, 2));
  console.log(`${colors.green}Fichier railway.json créé avec succès${colors.reset}`);
} else {
  console.log(`${colors.green}Fichier railway.json déjà existant${colors.reset}`);
}

// Vérifier le fichier Procfile
const procfilePath = path.join(currentDir, 'Procfile');
if (!fs.existsSync(procfilePath)) {
  console.log(`${colors.yellow}Création du fichier Procfile...${colors.reset}`);
  fs.writeFileSync(procfilePath, 'web: node server.js\n');
  console.log(`${colors.green}Fichier Procfile créé avec succès${colors.reset}`);
} else {
  console.log(`${colors.green}Fichier Procfile déjà existant${colors.reset}`);
}

// Ajouter une entrée pour les engines dans package.json
console.log(`${colors.blue}Mise à jour du fichier package.json...${colors.reset}`);
const packageJsonPath = path.join(currentDir, 'package.json');
const packageJson = require(packageJsonPath);

if (!packageJson.engines) {
  packageJson.engines = {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`${colors.green}Version de Node.js spécifiée dans package.json${colors.reset}`);
}

// Copier les variables d'environnement depuis .env.production vers .env
console.log(`${colors.blue}Préparation des variables d'environnement...${colors.reset}`);
fs.copyFileSync(envProdPath, path.join(currentDir, '.env'));
console.log(`${colors.green}Variables d'environnement copiées de .env.production vers .env${colors.reset}`);

// Instructions finales
console.log('\n');
console.log(`${colors.magenta}=== Instructions de déploiement ===${colors.reset}`);
console.log(`${colors.cyan}1. Créez un nouveau projet sur Railway (https://railway.app/)${colors.reset}`);
console.log(`${colors.cyan}2. Liez ce dépôt Git à votre projet Railway${colors.reset}`);
console.log(`${colors.cyan}3. Configurez les variables d'environnement suivantes dans Railway:${colors.reset}`);
console.log(`${colors.yellow}   - PORT: 8080${colors.reset}`);
console.log(`${colors.yellow}   - NODE_ENV: production${colors.reset}`);
console.log(`${colors.yellow}   - SUPABASE_URL: https://mbwurtmvdgmnrizxfouf.supabase.co${colors.reset}`);
console.log(`${colors.yellow}   - SUPABASE_ANON_KEY: [votre clé]${colors.reset}`);
console.log(`${colors.yellow}   - SUPABASE_SERVICE_KEY: [votre clé]${colors.reset}`);
console.log(`${colors.yellow}   - JWT_SECRET: [votre secret - même valeur que pour le backend local pour compatibilité]${colors.reset}`);
console.log(`${colors.yellow}   - CORS_ORIGIN: https://frontend-fivl16tuo-seiyar26s-projects.vercel.app${colors.reset}`);
console.log(`${colors.cyan}4. Lancez le déploiement depuis la console Railway${colors.reset}`);
console.log('\n');
console.log(`${colors.green}Votre application est prête à être déployée sur Railway !${colors.reset}`);
