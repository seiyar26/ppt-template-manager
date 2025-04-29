/**
 * Script de correction automatique des problèmes d'upload de fichiers PPTX
 * Exécuter avec: node fix-upload-fixed.js
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

console.log('=== CORRECTION DES PROBLÈMES D\'UPLOAD DE FICHIERS PPTX ===');

// 1. Création des répertoires manquants
console.log('\n1. Création des répertoires d\'upload manquants...');
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  ✅ Répertoire créé: ${dir}`);
    } catch (e) {
      console.error(`  ❌ Erreur: ${e.message}`);
    }
  } else {
    console.log(`  ✅ Répertoire existe déjà: ${dir}`);
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
      `apiClient.interceptors.request.use(\n  config => {\n    // Gestion spéciale pour les FormData - ne pas définir Content-Type\n    if (config.data instanceof FormData) {\n      console.log('FormData détecté - suppression du Content-Type pour permettre la définition correcte de la boundary');\n      if (config.headers && config.headers['Content-Type']) {\n        delete config.headers['Content-Type'];\n      }\n    }`
    );
    modified = true;
  }
  
  // Correction de la fonction createTemplate
  if (!content.includes('headers: {\n        \'Content-Type\': \'multipart/form-data\'')) {
    console.log('  Correction de la fonction createTemplate...');
    
    // Remplacer la fonction createTemplate par une version optimisée
    const createTemplateRegex = /createTemplate\(templateData\)[\s\S]*?\{[\s\S]*?return apiClient\.post\(\'\/templates\'[\s\S]*?\);[\s\S]*?\},/m;
    const fixedCreateTemplate = `createTemplate(templateData) {\n    console.log('Envoi du template avec FormData:', Object.fromEntries(templateData instanceof FormData ? templateData.entries() : []));\n    \n    // Pour les uploads de fichiers, ne pas définir explicitement Content-Type\n    // car Axios le fera automatiquement avec la boundary correcte\n    return apiClient.post('/templates', templateData, {\n      // Ne pas définir Content-Type ici, laissez Axios le faire\n      timeout: 60000, // Augmenter le timeout pour les gros fichiers\n      onUploadProgress: (progressEvent) => {\n        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);\n        console.log('Progression upload:', percentCompleted, '%');\n      }\n    }).then(response => {\n      console.log('Réponse du serveur (succès):', response.status, response.statusText);\n      return response.data;\n    }).catch(error => {\n      console.error('Erreur lors de la création du modèle:', error.response ? error.response.data : error.message);\n      throw error;\n    });\n  },`;
    
    content = content.replace(createTemplateRegex, fixedCreateTemplate);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(apiFile, content);
    console.log('  ✅ Configuration frontend corrigée');
  } else {
    console.log('  ✅ Configuration frontend déjà correcte');
  }
} else {
  console.error('  ❌ Fichier API non trouvé:', apiFile);
}

// 3. Correction du contrôleur backend
console.log('\n3. Correction du contrôleur backend...');
const templateControllerFile = path.join(projectRoot, 'backend/controllers/templateController.js');

if (fs.existsSync(templateControllerFile)) {
  let content = fs.readFileSync(templateControllerFile, 'utf8');
  let modified = false;
  
  // Ajouter du debug pour les fichiers reçus
  if (!content.includes('// DEBUG INFO - UPLOAD')) {
    console.log('  Ajout de logs de débogage pour les fichiers...');
    
    // Trouver la fonction createTemplate
    const createTemplateFunctionStart = content.indexOf('const createTemplate = async (req, res) => {');
    if (createTemplateFunctionStart !== -1) {
      const tryBlockStart = content.indexOf('try {', createTemplateFunctionStart);
      if (tryBlockStart !== -1) {
        const insertPoint = tryBlockStart + 'try {'.length;
        const debugCode = `\n    // DEBUG INFO - UPLOAD\n    console.log('\\n====== DEBUG UPLOAD FICHIER PPTX ======');\n    console.log('Headers:', req.headers);\n    console.log('Body:', req.body);\n    console.log('Fichier:', req.file);\n    console.log('Session User:', req.user);\n    \n    // Vérification des répertoires\n    const uploadTemp = path.join(__dirname, '../uploads/temp');\n    const uploadTemplates = path.join(__dirname, '../uploads/templates');\n    console.log('Répertoire temp existe:', fs.existsSync(uploadTemp));\n    console.log('Répertoire templates existe:', fs.existsSync(uploadTemplates));\n    if (req.file) {\n      console.log('Chemin du fichier:', req.file.path);\n      console.log('Fichier existe:', fs.existsSync(req.file.path));\n      console.log('Permissions:', fs.statSync(req.file.path).mode.toString(8).slice(-3));\n    }\n    console.log('==============================\\n');`;
        
        content = content.slice(0, insertPoint) + debugCode + content.slice(insertPoint);
        modified = true;
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(templateControllerFile, content);
    console.log('  ✅ Contrôleur backend corrigé');
  } else {
    console.log('  ✅ Contrôleur backend déjà correct');
  }
} else {
  console.error('  ❌ Fichier contrôleur non trouvé:', templateControllerFile);
}

// 4. Correction des routes
console.log('\n4. Vérification des routes...');
const routesFile = path.join(projectRoot, 'backend/routes/templateRoutes.js');

if (fs.existsSync(routesFile)) {
  let content = fs.readFileSync(routesFile, 'utf8');
  
  // Vérification de la route d'upload
  if (content.includes("router.post('/', upload.single('file')")) {
    console.log('  ✅ Route d\'upload correctement configurée');
  } else {
    console.log('  ⚠️ Attention: La route d\'upload pourrait ne pas être correctement configurée');
    console.log("  Vérifiez la présence de: router.post('/', upload.single('file'), createTemplate);");
  }
  
  // Vérification de l'ordre des middlewares
  if (content.includes('router.use(auth);') && content.indexOf('router.use(auth);') < content.indexOf("router.post('/', upload.single('file')")) {
    console.log('  ✅ Ordre des middlewares correct');
  } else {
    console.log('  ⚠️ Attention: L\'ordre des middlewares pourrait causer des problèmes');
    console.log('  L\'authentification doit être appliquée avant les routes');
  }
} else {
  console.error('  ❌ Fichier routes non trouvé:', routesFile);
}

// 5. Redémarrage des services
console.log('\n5. Redémarrage des services recommandé...');
console.log('Arrêtez les services actuels (Ctrl+C) et exécutez:');
console.log('  cd backend && npm start');
console.log('  cd frontend && npm start');

console.log('\n=== CORRECTIONS TERMINÉES ===');
console.log('Pour tester le téléchargement, utilisez un fichier PPTX de petite taille (< 5Mo)');
console.log('Vérifiez les journaux de la console du navigateur et du serveur pour le débogage');
