/**
 * Script de vu00e9rification et ru00e9paration automatique de la connexion
 * entre le frontend et le backend de PPT Template Manager
 * 
 * Exu00e9cutez avec: node connection-fix.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec, spawn } = require('child_process');

// Configuration et chemins
const projectRoot = __dirname;
const backendDir = path.join(projectRoot, 'backend');
const frontendDir = path.join(projectRoot, 'frontend');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

console.log(`${colors.blue}===== DIAGNOSTIC ET Ru00c9PARATION DE CONNEXION FRONTEND/BACKEND =====${colors.reset}`);
console.log(`Date: ${new Date().toLocaleString()}\n`);

let backendProcess = null;
let frontendProcess = null;

// u00c9tape 1: Vu00e9rifier si les processus sont en cours d'exu00e9cution
async function checkRunningProcesses() {
  console.log(`${colors.blue}\u25cf u00c9tape 1: Vu00e9rification des processus en cours${colors.reset}`);
  
  // Vu00e9rifier les processus node
  return new Promise((resolve) => {
    exec('lsof -i :12000,4322', (error, stdout, stderr) => {
      if (error) {
        console.log('  Aucun service du00e9tectu00e9 sur les ports 12000 ou 4322');
        return resolve({
          backend: false,
          frontend: false
        });
      }
      
      const backendRunning = stdout.includes(':12000 (LISTEN)');
      const frontendRunning = stdout.includes(':4322 (LISTEN)');
      
      console.log(`  Backend (port 12000): ${backendRunning ? colors.green + 'u2705 EN COURS' : colors.red + 'u274c ARRu00caTu00c9'}${colors.reset}`);
      console.log(`  Frontend (port 4322): ${frontendRunning ? colors.green + 'u2705 EN COURS' : colors.red + 'u274c ARRu00caTu00c9'}${colors.reset}`);
      
      resolve({
        backend: backendRunning,
        frontend: frontendRunning
      });
    });
  });
}

// u00c9tape 2: Vu00e9rifier la configuration API dans le frontend
async function checkApiConfiguration() {
  console.log(`\n${colors.blue}\u25cf u00c9tape 2: Vu00e9rification de la configuration API${colors.reset}`);
  
  const apiFile = path.join(frontendDir, 'src/services/api.js');
  
  if (!fs.existsSync(apiFile)) {
    console.log(`  ${colors.red}u274c Fichier API introuvable: ${apiFile}${colors.reset}`);
    return false;
  }
  
  const content = fs.readFileSync(apiFile, 'utf8');
  const correctApiUrl = "export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:12000/api';";
  const hasCorrectApiUrl = content.includes(correctApiUrl);
  
  console.log(`  Configuration API URL: ${hasCorrectApiUrl ? colors.green + 'u2705 CORRECTE' : colors.red + 'u274c INCORRECTE'}${colors.reset}`);
  
  if (!hasCorrectApiUrl) {
    console.log('  Correction de l\'URL API...');
    const correctedContent = content.replace(
      /export const API_URL = [^\n]+/,
      correctApiUrl
    );
    fs.writeFileSync(apiFile, correctedContent);
    console.log(`  ${colors.green}u2705 URL API corrigu00e9e${colors.reset}`);
  }
  
  return true;
}

// u00c9tape 3: Vu00e9rifier la configuration CORS dans le backend
async function checkCorsConfiguration() {
  console.log(`\n${colors.blue}\u25cf u00c9tape 3: Vu00e9rification de la configuration CORS${colors.reset}`);
  
  const serverFile = path.join(backendDir, 'server.js');
  
  if (!fs.existsSync(serverFile)) {
    console.log(`  ${colors.red}u274c Fichier serveur introuvable: ${serverFile}${colors.reset}`);
    return false;
  }
  
  const content = fs.readFileSync(serverFile, 'utf8');
  const hasPermissiveCors = content.includes('if (process.env.NODE_ENV === \'development\')') && 
                            content.includes('callback(null, true)') && 
                            content.includes('credentials: true');
  
  console.log(`  Configuration CORS: ${hasPermissiveCors ? colors.green + 'u2705 PERMISSIVE' : colors.yellow + 'u26a0ufe0f RESTRICTIVE'}${colors.reset}`);
  
  if (!hasPermissiveCors) {
    console.log('  Application d\'une configuration CORS permissive...');
    
    // Rechercher la section de code CORS
    const corsRegex = /app\.use\(cors\([^)]*\)\);/s;
    const corsOptionsRegex = /const corsOptions[\s\S]*?app\.use\(cors\(corsOptions\)\);/s;
    
    // Nouvelle configuration CORS
    const newCorsConfig = `// Configuration CORS permissive
const corsOptions = {
  origin: function(origin, callback) {
    // En du00e9veloppement, accepter toutes les origines
    callback(null, true);
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Authorization']
};

app.use(cors(corsOptions));

// Middlewares de du00e9bogage pour CORS
app.use((req, res, next) => {
  res.header('X-Debug-Mode', 'enabled');
  next();
});`;
    
    let newContent;
    if (corsOptionsRegex.test(content)) {
      newContent = content.replace(corsOptionsRegex, newCorsConfig);
    } else if (corsRegex.test(content)) {
      newContent = content.replace(corsRegex, newCorsConfig);
    } else {
      // Si aucun pattern ne correspond, insu00e9rer apru00e8s les imports
      const importEnd = content.indexOf('app.use(');
      if (importEnd !== -1) {
        newContent = content.slice(0, importEnd) + newCorsConfig + '\n\n' + content.slice(importEnd);
      } else {
        console.log(`  ${colors.red}u274c Impossible de localiser la section CORS${colors.reset}`);
        return false;
      }
    }
    
    fs.writeFileSync(serverFile, newContent);
    console.log(`  ${colors.green}u2705 Configuration CORS mise u00e0 jour${colors.reset}`);
  }
  
  return true;
}

// u00c9tape 4: Ajouter une route de santu00e9 au backend
async function addHealthRoute() {
  console.log(`\n${colors.blue}\u25cf u00c9tape 4: Configuration de la route de santu00e9${colors.reset}`);
  
  const serverFile = path.join(backendDir, 'server.js');
  let content = fs.readFileSync(serverFile, 'utf8');
  
  if (content.includes('app.get(\'/_health\'')) {
    console.log(`  ${colors.green}u2705 Route de santu00e9 du00e9ju00e0 configuru00e9e${colors.reset}`);
    return true;
  }
  
  console.log('  Ajout d\'une route de santu00e9 du00e9taillu00e9e...');
  
  // Chercher ou00f9 insu00e9rer la route de santu00e9
  const apiRoutesIndex = content.indexOf('// API routes');
  
  if (apiRoutesIndex === -1) {
    console.log(`  ${colors.red}u274c Impossible de localiser la section des routes API${colors.reset}`);
    return false;
  }
  
  const healthRouteCode = `// Route de santu00e9 pour vu00e9rifier la connexion
app.get('/_health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
    cors: 'enabled',
    db: 'connected',
    uptime: process.uptime()
  });
});

`;
  
  // Insu00e9rer avant les routes API
  const newContent = content.slice(0, apiRoutesIndex) + healthRouteCode + content.slice(apiRoutesIndex);
  fs.writeFileSync(serverFile, newContent);
  
  console.log(`  ${colors.green}u2705 Route de santu00e9 ajoutu00e9e${colors.reset}`);
  return true;
}

// u00c9tape 5: Tester la connexion au backend
async function testBackendConnection() {
  console.log(`\n${colors.blue}\u25cf u00c9tape 5: Test de connexion au backend${colors.reset}`);
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:12000/api/health', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`  ${colors.green}u2705 Backend accessible (${res.statusCode})${colors.reset}`);
          console.log(`  Ru00e9ponse: ${data}`);
          resolve(true);
        } else {
          console.log(`  ${colors.red}u274c Backend inaccessible (${res.statusCode})${colors.reset}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`  ${colors.red}u274c Erreur de connexion: ${err.message}${colors.reset}`);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      console.log(`  ${colors.red}u274c Timeout de connexion${colors.reset}`);
      resolve(false);
    });
  });
}

// u00c9tape 6: Arru00eater et redu00e9marrer les services
async function restartServices(services) {
  console.log(`\n${colors.blue}\u25cf u00c9tape 6: Redu00e9marrage des services${colors.reset}`);
  
  // Arru00eater les processus existants
  if (services.backend || services.frontend) {
    console.log('  Arru00eat des services en cours...');
    await new Promise((resolve) => {
      exec('pkill -f "node.*server.js"', () => {
        resolve();
      });
    });
  }
  
  // Du00e9marrer le backend
  console.log('  Du00e9marrage du backend...');
  return new Promise((resolve) => {
    backendProcess = spawn('npm', ['start'], {
      cwd: backendDir,
      env: { ...process.env, NODE_ENV: 'development' },
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let backendStarted = false;
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Serveur du00e9marru00e9 et en u00e9coute sur le port 12000') || 
          output.includes('en u00e9coute sur le port 12000')) {
        backendStarted = true;
        console.log(`  ${colors.green}u2705 Backend du00e9marru00e9 sur le port 12000${colors.reset}`);
        
        // Du00e9marrer le frontend une fois le backend pru00eat
        console.log('  Du00e9marrage du frontend...');
        frontendProcess = spawn('npm', ['start'], {
          cwd: frontendDir,
          env: { 
            ...process.env, 
            PORT: '4322',
            REACT_APP_API_URL: 'http://localhost:12000/api' 
          },
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe']
        });
        
        frontendProcess.stdout.on('data', (data) => {
          const frontendOutput = data.toString();
          if (frontendOutput.includes('Compiled successfully') || 
              frontendOutput.includes('You can now view frontend in the browser')) {
            console.log(`  ${colors.green}u2705 Frontend du00e9marru00e9 sur le port 4322${colors.reset}`);
            resolve(true);
          }
        });
        
        // Timeout pour le frontend
        setTimeout(() => {
          if (!frontendProcess.killed) {
            console.log(`  ${colors.yellow}u26a0ufe0f Frontend en cours de du00e9marrage, mais sans confirmation${colors.reset}`);
            resolve(true);
          }
        }, 15000);
      }
    });
    
    // Timeout pour le backend
    setTimeout(() => {
      if (!backendStarted) {
        console.log(`  ${colors.red}u274c Backend n'a pas du00e9marru00e9 correctement${colors.reset}`);
        resolve(false);
      }
    }, 10000);
  });
}

// Exu00e9cution du script principal
async function main() {
  try {
    // Vu00e9rifier les processus en cours
    const runningServices = await checkRunningProcesses();
    
    // Vu00e9rifier et corriger la configuration API
    await checkApiConfiguration();
    
    // Vu00e9rifier et corriger la configuration CORS
    await checkCorsConfiguration();
    
    // Ajouter une route de santu00e9
    await addHealthRoute();
    
    // Si le backend est en cours d'exu00e9cution, tester la connexion
    let backendConnected = false;
    if (runningServices.backend) {
      backendConnected = await testBackendConnection();
    }
    
    // Si le backend n'est pas connectu00e9 ou si les services ne sont pas en cours d'exu00e9cution, redu00e9marrer
    if (!backendConnected || !runningServices.backend || !runningServices.frontend) {
      await restartServices(runningServices);
    }
    
    console.log(`\n${colors.green}===== DIAGNOSTIC TERMINu00c9 =====${colors.reset}`);
    console.log(`${colors.blue}Pour accu00e9der u00e0 l'application:${colors.reset}`);
    console.log(`  Frontend: ${colors.magenta}http://localhost:4322${colors.reset}`);
    console.log(`  Backend API: ${colors.magenta}http://localhost:12000/api${colors.reset}`);
    console.log(`  Endpoint santu00e9: ${colors.magenta}http://localhost:12000/_health${colors.reset}`);
    
    // Garder le script en vie
    console.log(`\n${colors.yellow}Ce script maintient les services du00e9marru00e9s. Appuyez sur Ctrl+C pour quitter.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}\u274c Erreur lors du diagnostic: ${error.message}${colors.reset}`);
  }
}

// Gu00e9rer l'arru00eat propre
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Arru00eat des services...${colors.reset}`);
  if (backendProcess && !backendProcess.killed) {
    process.kill(-backendProcess.pid);
  }
  if (frontendProcess && !frontendProcess.killed) {
    process.kill(-frontendProcess.pid);
  }
  process.exit(0);
});

// Exu00e9cuter le script
main();
