/**
 * Script pour tester la nouvelle configuration centralisée
 * Ce script vérifie que les variables d'environnement sont correctement chargées
 * et que les différentes parties de l'application utilisent les mêmes valeurs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function printHeader(message) {
  console.log(`\n${colors.blue}====== ${message} ======${colors.reset}\n`);
}

function printSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
}

function printError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function printInfo(message) {
  console.log(`${colors.cyan}ℹ️ ${message}${colors.reset}`);
}

function checkEnvFile(filePath, requiredVars) {
  printHeader(`Vérification du fichier ${path.basename(filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    printError(`Le fichier ${filePath} n'existe pas!`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const envVars = {};
  
  // Parcourir chaque ligne pour trouver les variables d'environnement
  lines.forEach(line => {
    // Ignorer les commentaires et lignes vides
    if (line.trim().startsWith('#') || line.trim() === '') return;
    
    // Extraire la clé et la valeur
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  });
  
  // Vérifier si toutes les variables requises sont présentes
  let allFound = true;
  requiredVars.forEach(varName => {
    if (envVars[varName]) {
      printSuccess(`Variable ${varName} trouvée: ${envVars[varName]}`);
    } else {
      printWarning(`Variable ${varName} manquante!`);
      allFound = false;
    }
  });
  
  // Rechercher les références codées en dur au port 12000
  const hardcodedPortRef = content.includes('12000');
  if (hardcodedPortRef) {
    printError(`Le fichier contient encore des références au port codé en dur (12000)!`);
    return false;
  } else {
    printSuccess(`Aucune référence codée en dur au port 12000 trouvée.`);
  }
  
  return allFound && !hardcodedPortRef;
}

function testBackendConfig() {
  printHeader("Test de la configuration backend");
  
  try {
    // Construire un petit script pour tester la configuration
    const testScript = `
    try {
      const config = require('./backend/config/env');
      console.log(JSON.stringify({
        port: config.port,
        baseUrl: config.baseUrl(),
        apiUrl: config.apiUrl(),
        env: config.env,
        isProd: config.isProd()
      }));
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
    `;
    
    // Exécuter le script
    const result = execSync(`node -e "${testScript}"`, { encoding: 'utf8' });
    const config = JSON.parse(result);
    
    printSuccess(`Configuration chargée avec succès`);
    printInfo(`Port: ${config.port}`);
    printInfo(`URL de base: ${config.baseUrl}`);
    printInfo(`URL API: ${config.apiUrl}`);
    printInfo(`Environnement: ${config.env}`);
    printInfo(`Est en production: ${config.isProd}`);
    
    // Vérifier que le port n'est pas codé en dur à 12000
    if (config.port === 12000) {
      printWarning(`Le port est toujours fixé à 12000!`);
    }
    
    return true;
  } catch (error) {
    printError(`Erreur lors du test de la configuration backend: ${error.message}`);
    return false;
  }
}

function testFrontendConfig() {
  printHeader("Test de la configuration frontend");
  
  try {
    // Vérifier que le fichier de configuration existe
    const configPath = path.join(__dirname, 'frontend', 'src', 'config', 'env.js');
    if (!fs.existsSync(configPath)) {
      printError(`Le fichier de configuration frontend n'existe pas: ${configPath}`);
      return false;
    }
    
    printSuccess(`Le fichier de configuration frontend existe`);
    
    // Vérifier le contenu du fichier pour des références au port 12000
    const content = fs.readFileSync(configPath, 'utf8');
    if (content.includes('12000')) {
      printError(`Le fichier de configuration frontend contient encore des références au port 12000!`);
      return false;
    } else {
      printSuccess(`Aucune référence au port 12000 trouvée dans le fichier de configuration frontend.`);
    }
    
    return true;
  } catch (error) {
    printError(`Erreur lors du test de la configuration frontend: ${error.message}`);
    return false;
  }
}

function findHardcodedPortReferences() {
  printHeader("Recherche des références restantes au port 12000");
  
  try {
    // Exclure les dossiers node_modules, .git et les fichiers logs pour une recherche plus rapide
    const result = execSync(`grep -r --include="*.js" --include="*.json" --include="*.sh" --include="*.md" --include="*.env" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=logs "12000" .`, { encoding: 'utf8' });
    
    const lines = result.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 0) {
      printWarning(`${lines.length} références au port 12000 trouvées:`);
      lines.forEach(line => {
        console.log(`  ${line}`);
      });
      return false;
    } else {
      printSuccess(`Aucune référence codée en dur au port 12000 trouvée!`);
      return true;
    }
  } catch (error) {
    // grep renvoie une erreur si aucune correspondance n'est trouvée, donc c'est en fait un succès
    if (error.status === 1) {
      printSuccess(`Aucune référence codée en dur au port 12000 trouvée!`);
      return true;
    } else {
      printError(`Erreur lors de la recherche des références au port 12000: ${error.message}`);
      return false;
    }
  }
}

function runAllTests() {
  printHeader("DÉBUT DES TESTS DE CONFIGURATION");
  
  // Vérifier les fichiers .env
  const backendEnvOk = checkEnvFile(
    path.join(__dirname, 'backend', '.env'),
    ['PORT', 'NODE_ENV']
  );
  
  const frontendEnvOk = checkEnvFile(
    path.join(__dirname, 'frontend', '.env'),
    ['REACT_APP_API_PORT', 'REACT_APP_API_HOST']
  );
  
  // Tester les configurations
  const backendConfigOk = testBackendConfig();
  const frontendConfigOk = testFrontendConfig();
  
  // Rechercher des références restantes
  const noHardcodedRefsOk = findHardcodedPortReferences();
  
  // Résultats finaux
  printHeader("RÉSULTATS DES TESTS");
  
  const allOk = backendEnvOk && frontendEnvOk && backendConfigOk && frontendConfigOk && noHardcodedRefsOk;
  
  if (allOk) {
    printSuccess("TOUS LES TESTS ONT RÉUSSI!");
    printSuccess("La configuration est correctement centralisée et ne contient plus de références codées en dur.");
  } else {
    printError("CERTAINS TESTS ONT ÉCHOUÉ!");
    printError("Des corrections supplémentaires sont nécessaires pour éliminer toutes les références codées en dur.");
  }
  
  return allOk;
}

// Exécuter les tests
runAllTests();
