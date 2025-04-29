/**
 * Script de correction automatique des problu00e8mes d'upload de fichiers PPTX
 * Exu00e9cuter avec: node fix-upload.js
 */

const fs = require('fs');
const path = require('path');
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

console.log('=== CORRECTION DES PROBLu00c8MES D\'UPLOAD DE FICHIERS PPTX ===');

// 1. Cru00e9ation des ru00e9pertoires manquants
console.log('\n1. Cru00e9ation des ru00e9pertoires d\'upload manquants...');
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  u2705 Ru00e9pertoire cru00e9u00e9: ${dir}`);
    } catch (e) {
      console.error(`  u274c Erreur: ${e.message}`);
    }
  } else {
    console.log(`  u2705 Ru00e9pertoire existe du00e9ju00e0: ${dir}`);
  }
});

// 2. Correction de la configuration frontend d'upload
console.log('\n2. Correction de la configuration frontend...');
const apiFile = path.join(projectRoot, 'frontend/src/services/api.js');

if (fs.existsSync(apiFile)) {
  let content = fs.readFileSync(apiFile, 'utf8');
  let modified = false;
  
  // Correction du createTemplate pour utiliser correctement FormData
  if (!content.includes('Content-Type\':\n        delete config.headers[\'Content-Type\']')) {
    console.log('  Correction de la gestion du Content-Type pour FormData...');
    
    // Ajouter la logique qui supprime le Content-Type pour FormData
    content = content.replace(
      /apiClient\.interceptors\.request\.use\([\s\S]*?config => {/m,
      `apiClient.interceptors.request.use(\n  config => {\n    // Gestion spu00e9ciale pour les FormData - ne pas du00e9finir Content-Type\n    if (config.data instanceof FormData) {\n      console.log('FormData du00e9tectu00e9 - suppression du Content-Type pour permettre la du00e9finition correcte de la boundary');\n      if (config.headers && config.headers['Content-Type']) {\n        delete config.headers['Content-Type'];\n      }\n    }`
    );
    modified = true;
  }
  
  // Correction de la fonction createTemplate
  if (!content.includes('headers: {\n        \'Content-Type\': \'multipart/form-data\'')) {
    console.log('  Correction de la fonction createTemplate...');
    
    // Remplacer la fonction createTemplate par une version optimisu00e9e
    const createTemplateRegex = /createTemplate\(templateData\)[\s\S]*?\{[\s\S]*?return apiClient\.post\(\'\/templates\'[\s\S]*?\);[\s\S]*?\},/m;
    const fixedCreateTemplate = `createTemplate(templateData) {\n    console.log('Envoi du template avec FormData:', Object.fromEntries(templateData instanceof FormData ? templateData.entries() : []));\n    \n    // Pour les uploads de fichiers, ne pas du00e9finir explicitement Content-Type\n    // car Axios le fera automatiquement avec la boundary correcte\n    return apiClient.post('/templates', templateData, {\n      // Ne pas du00e9finir Content-Type ici, laissez Axios le faire\n      timeout: 60000, // Augmenter le timeout pour les gros fichiers\n      onUploadProgress: (progressEvent) => {\n        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);\n        console.log('Progression upload:', percentCompleted, '%');\n      }\n    }).then(response => {\n      console.log('Ru00e9ponse du serveur (succu00e8s):', response.status, response.statusText);\n      return response.data;\n    }).catch(error => {\n      console.error('Erreur lors de la cru00e9ation du modu00e8le:', error.response ? error.response.data : error.message);\n      throw error;\n    });\n  },`;
    
    content = content.replace(createTemplateRegex, fixedCreateTemplate);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(apiFile, content);
    console.log('  u2705 Configuration frontend corrigu00e9e');
  } else {
    console.log('  u2705 Configuration frontend du00e9ju00e0 correcte');
  }
} else {
  console.error('  u274c Fichier API non trouvu00e9:', apiFile);
}

// 3. Correction du contru00f4leur backend
console.log('\n3. Correction du contru00f4leur backend...');
const templateControllerFile = path.join(projectRoot, 'backend/controllers/templateController.js');

if (fs.existsSync(templateControllerFile)) {
  let content = fs.readFileSync(templateControllerFile, 'utf8');
  let modified = false;
  
  // Ajouter du debug pour les fichiers reu00e7us
  if (!content.includes('// DEBUG INFO - UPLOAD')) {
    console.log('  Ajout de logs de du00e9bogage pour les fichiers...');
    
    // Trouver la fonction createTemplate
    const createTemplateFunctionStart = content.indexOf('const createTemplate = async (req, res) => {');
    if (createTemplateFunctionStart !== -1) {
      const tryBlockStart = content.indexOf('try {', createTemplateFunctionStart);
      if (tryBlockStart !== -1) {
        const insertPoint = tryBlockStart + 'try {'.length;
        const debugCode = `\n    // DEBUG INFO - UPLOAD\n    console.log('\\n====== DEBUG UPLOAD FICHIER PPTX ======');\n    console.log('Headers:', req.headers);\n    console.log('Body:', req.body);\n    console.log('Fichier:', req.file);\n    console.log('Session User:', req.user);\n    \n    // Vu00e9rification des ru00e9pertoires\n    const uploadTemp = path.join(__dirname, '../uploads/temp');\n    const uploadTemplates = path.join(__dirname, '../uploads/templates');\n    console.log('Ru00e9pertoire temp existe:', fs.existsSync(uploadTemp));\n    console.log('Ru00e9pertoire templates existe:', fs.existsSync(uploadTemplates));\n    if (req.file) {\n      console.log('Chemin du fichier:', req.file.path);\n      console.log('Fichier existe:', fs.existsSync(req.file.path));\n      console.log('Permissions:', fs.statSync(req.file.path).mode.toString(8).slice(-3));\n    }\n    console.log('==============================\\n');`;
        
        content = content.slice(0, insertPoint) + debugCode + content.slice(insertPoint);
        modified = true;
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(templateControllerFile, content);
    console.log('  u2705 Contru00f4leur backend corrigu00e9');
  } else {
    console.log('  u2705 Contru00f4leur backend du00e9ju00e0 correct');
  }
} else {
  console.error('  u274c Fichier contru00f4leur non trouvu00e9:', templateControllerFile);
}

// 4. Correction des routes
console.log('\n4. Vu00e9rification des routes...');
const routesFile = path.join(projectRoot, 'backend/routes/templateRoutes.js');

if (fs.existsSync(routesFile)) {
  let content = fs.readFileSync(routesFile, 'utf8');
  
  // Vu00e9rification de la route d'upload
  if (content.includes('router.post(\'/', upload.single(\'file\'),')) {
    console.log('  u2705 Route d\'upload correctement configuru00e9e');
  } else {
    console.log('  u26a0ufe0f  Attention: La route d\'upload pourrait ne pas u00eatre correctement configuru00e9e');\n    console.log('  Vu00e9rifiez la pru00e9sence de: router.post(\'/', upload.single(\'file\'), createTemplate);')
  }
  
  // Vu00e9rification de l'ordre des middlewares
  if (content.includes('router.use(auth);') && content.indexOf('router.use(auth);') < content.indexOf('router.post(\'/', upload.single(\'file\'),')) {
    console.log('  u2705 Ordre des middlewares correct');
  } else {
    console.log('  u26a0ufe0f  Attention: L\'ordre des middlewares pourrait causer des problu00e8mes');\n    console.log('  L\'authentification doit u00eatre appliquu00e9e avant les routes')
  }
} else {
  console.error('  u274c Fichier routes non trouvu00e9:', routesFile);
}

// 5. Redu00e9marrage des services
console.log('\n5. Redu00e9marrage des services recommandu00e9...');
console.log('Arru00eatez les services actuels (Ctrl+C) et exu00e9cutez:');
console.log('  cd backend && npm start');
console.log('  cd frontend && npm start');

console.log('\n=== CORRECTIONS TERMINu00c9ES ===');
console.log('Pour tester le tu00e9lu00e9chargement, utilisez un fichier PPTX de petite taille (< 5Mo)');
console.log('Vu00e9rifiez les journaux de la console du navigateur et du serveur pour le du00e9bogage');
