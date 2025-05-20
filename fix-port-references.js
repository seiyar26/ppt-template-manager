/**
 * Script pour remplacer les références en dur au port 12000 par une variable d'environnement
 * Cela permettra de faciliter le déploiement de l'application
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Configuration
const PORT_TO_REPLACE = '12000';
const REPLACEMENT_BACKEND = '${process.env.PORT || 8080}';
const REPLACEMENT_FRONTEND = '${process.env.REACT_APP_API_PORT || 8080}';

// Options pour exclure certains dossiers lors de la recherche
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'build',
  'dist',
  'uploads',
  'logs'
];

// Fonction pour rechercher tous les fichiers contenant le port spécifié
async function findFilesWithPort(rootDir, port) {
  try {
    // Utiliser grep pour trouver tous les fichiers contenant le port
    const excludePattern = EXCLUDED_DIRS.map(dir => `--exclude-dir="${dir}"`).join(' ');
    const { stdout } = await execPromise(
      `grep -r --include="*.js" --include="*.json" --include="*.sh" --include="*.md" --include="*.env" ${excludePattern} "${port}" ${rootDir}`
    );
    
    // Analyser les résultats
    const results = [];
    const lines = stdout.split('\n').filter(line => line.trim() !== '');
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const filePath = line.substring(0, colonIndex);
        if (!results.includes(filePath)) {
          results.push(filePath);
        }
      }
    }
    
    return results;
  } catch (error) {
    if (error.stderr) {
      console.error(`${colors.red}Erreur lors de la recherche des fichiers: ${error.stderr}${colors.reset}`);
    }
    return [];
  }
}

// Fonction pour remplacer le port dans un fichier
async function replacePortInFile(filePath, port, replacementBackend, replacementFrontend) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const originalContent = content;
    
    // Déterminer si c'est un fichier frontend ou backend pour utiliser la bonne variable
    const isBackend = filePath.includes('/backend/') || 
                      filePath.endsWith('server.js') ||
                      filePath.includes('start.sh') ||
                      filePath.includes('start-local.sh');
    
    const replacement = isBackend ? replacementBackend : replacementFrontend;
    
    // Différentes façons dont le port peut être référencé
    let modifications = 0;

    // Cas 1: PORT=process.env.REACT_APP_API_PORT || 8080
    if (filePath.endsWith('.sh') || filePath.endsWith('.env') || filePath.endsWith('.md')) {
      const pattern = new RegExp(`PORT=${port}`, 'g');
      const newContent = content.replace(pattern, `PORT=${replacement}`);
      modifications += (content !== newContent) ? 1 : 0;
      content = newContent;
    }
    
    // Cas 2: http://localhost:${process.env.PORT || 8080}
    const urlPattern = new RegExp(`http://localhost:${port}`, 'g');
    const newContent = content.replace(urlPattern, `http://localhost:\${process.env.PORT || 8080}`);
    modifications += (content !== newContent) ? 1 : 0;
    content = newContent;
    
    // Cas 3: port: process.env.REACT_APP_API_PORT || 8080, ou "port": process.env.REACT_APP_API_PORT || 8080
    const portPattern = new RegExp(`(["']?port["']?\\s*[:=]\\s*)["']?${port}["']?`, 'gi');
    const portReplacement = isBackend ? 
      `$1process.env.PORT || 8080` : 
      `$1process.env.REACT_APP_API_PORT || 8080`;
    const newContent2 = content.replace(portPattern, portReplacement);
    modifications += (content !== newContent2) ? 1 : 0;
    content = newContent2;
    
    // Cas 4: lsof -i :12000
    if (filePath.includes('connection-fix.js') || filePath.includes('diagnose')) {
      // Conservons cette référence car elle est utilisée pour le diagnostic
      console.log(`${colors.yellow}Conservé la référence de diagnostic dans ${filePath}${colors.reset}`);
    }
    
    // Sauvegarder les modifications si nécessaire
    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`${colors.green}Modifié: ${filePath} (${modifications} références remplacées)${colors.reset}`);
      return modifications;
    } else {
      console.log(`${colors.yellow}Aucun changement nécessaire dans: ${filePath}${colors.reset}`);
      return 0;
    }
  } catch (error) {
    console.error(`${colors.red}Erreur lors de la modification de ${filePath}: ${error.message}${colors.reset}`);
    return 0;
  }
}

// Fonction principale
async function fixPortReferences() {
  console.log(`${colors.blue}====== CORRECTION DES RÉFÉRENCES AU PORT ${PORT_TO_REPLACE} ======${colors.reset}`);
  
  const rootDir = path.resolve(__dirname);
  console.log(`${colors.cyan}Recherche des fichiers contenant le port ${PORT_TO_REPLACE}...${colors.reset}`);
  
  const filesToModify = await findFilesWithPort(rootDir, PORT_TO_REPLACE);
  
  console.log(`${colors.yellow}${filesToModify.length} fichiers trouvés contenant le port ${PORT_TO_REPLACE}${colors.reset}`);
  
  // Créer des fichiers .env.example si nécessaires
  const backendEnvPath = path.join(rootDir, 'backend', '.env.example');
  const frontendEnvPath = path.join(rootDir, 'frontend', '.env.example');
  
  try {
    console.log(`${colors.blue}Création/mise à jour des fichiers .env.example...${colors.reset}`);
    
    // Backend .env.example
    await fs.writeFile(
      backendEnvPath,
      `# Configuration du port (défaut: 8080)\nPORT=8080\n\n# Autres variables d'environnement...\n`,
      { flag: 'w' }
    );
    
    // Frontend .env.example
    await fs.writeFile(
      frontendEnvPath,
      `# Port de l'API backend (défaut: 8080)\nREACT_APP_API_PORT=8080\n\n# URL de l'API\nREACT_APP_API_URL=http://localhost:\${REACT_APP_API_PORT}/api\n\n# Autres variables d'environnement...\n`,
      { flag: 'w' }
    );
    
    console.log(`${colors.green}Fichiers .env.example créés/mis à jour${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Erreur lors de la création des fichiers .env.example: ${error.message}${colors.reset}`);
  }
  
  // Traiter chaque fichier
  let totalModifications = 0;
  for (const filePath of filesToModify) {
    const modifications = await replacePortInFile(
      filePath, 
      PORT_TO_REPLACE,
      REPLACEMENT_BACKEND,
      REPLACEMENT_FRONTEND
    );
    totalModifications += modifications;
  }
  
  console.log(`\n${colors.blue}======= RÉSUMÉ =======${colors.reset}`);
  console.log(`${colors.green}${filesToModify.length} fichiers analysés${colors.reset}`);
  console.log(`${colors.green}${totalModifications} références au port modifiées${colors.reset}`);
  console.log(`\n${colors.magenta}Étapes suivantes recommandées:${colors.reset}`);
  console.log(`${colors.cyan}1. Vérifiez les modifications pour vous assurer qu'elles sont correctes${colors.reset}`);
  console.log(`${colors.cyan}2. Créez des fichiers .env basés sur les .env.example${colors.reset}`);
  console.log(`${colors.cyan}3. Testez l'application localement${colors.reset}`);
  console.log(`${colors.cyan}4. Déployez avec les variables d'environnement appropriées${colors.reset}`);
}

// Exécution du script
fixPortReferences().catch(error => {
  console.error(`${colors.red}Erreur non gérée: ${error.message}${colors.reset}`);
  process.exit(1);
});
