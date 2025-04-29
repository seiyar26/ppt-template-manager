/**
 * Service de diagnostic complet pour l'application
 * Permet de journaliser et d'analyser les problèmes critiques
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const os = require('os');

// Configuration
const LOG_DIR = path.join(__dirname, '../logs');
const CONVERSION_LOG = path.join(LOG_DIR, 'conversion.log');
const UPLOAD_LOG = path.join(LOG_DIR, 'upload.log');
const BACKEND_LOG = path.join(LOG_DIR, 'backend.log');

// Créer le répertoire de logs s'il n'existe pas
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Écrit dans un fichier de log avec horodatage
 * @param {string} filePath - Chemin du fichier de log
 * @param {string} message - Message à journaliser
 * @param {Object} data - Données supplémentaires à inclure
 */
function writeToLog(filePath, message, data = null) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${message}\n`;
  
  if (data) {
    // Formatage propre des objets pour le log
    let dataString;
    try {
      if (typeof data === 'string') {
        dataString = data;
      } else {
        dataString = util.inspect(data, { depth: 8, colors: false });
      }
      logMessage += `DATA: ${dataString}\n`;
    } catch (e) {
      logMessage += `DATA: [Erreur lors du formatage des données: ${e.message}]\n`;
    }
  }
  
  logMessage += '--------------------------------------------\n';
  
  // Écriture asynchrone avec gestion d'erreur
  fs.appendFile(filePath, logMessage, (err) => {
    if (err) {
      console.error(`Erreur lors de l'écriture dans le fichier de log ${filePath}:`, err);
    }
  });
  
  // Également afficher dans la console pour faciliter le débogage
  console.log(message);
  if (data) {
    console.log('Détails:', data);
  }
}

/**
 * Service de diagnostic pour les conversions PPTX
 */
const conversionDiagnostic = {
  /**
   * Journalise le début d'une conversion
   * @param {Object} options - Options de conversion
   */
  logStart: (options) => {
    writeToLog(CONVERSION_LOG, '🔄 DÉBUT DE CONVERSION PPTX', {
      timestamp: new Date().toISOString(),
      options,
      environment: {
        nodeVersion: process.version,
        platform: os.platform(),
        memory: `${Math.round(os.freemem() / 1024 / 1024)}MB libre / ${Math.round(os.totalmem() / 1024 / 1024)}MB total`
      }
    });
  },
  
  /**
   * Journalise le résultat d'une conversion réussie
   * @param {Object} result - Résultat de la conversion
   * @param {Array} imagePaths - Chemins des images générées
   */
  logSuccess: (result, imagePaths) => {
    writeToLog(CONVERSION_LOG, '✅ CONVERSION PPTX RÉUSSIE', {
      timestamp: new Date().toISOString(),
      resultSummary: {
        filesCount: result.Files ? result.Files.length : 0,
        conversionCost: result.ConversionCost || 0
      },
      filesSaved: imagePaths.length,
      firstSavedPath: imagePaths.length > 0 ? imagePaths[0].path : null
    });
  },
  
  /**
   * Journalise l'échec d'une conversion
   * @param {Error} error - Erreur survenue
   * @param {Object} context - Contexte de l'erreur
   */
  logError: (error, context = {}) => {
    writeToLog(CONVERSION_LOG, '❌ ERREUR DE CONVERSION PPTX', {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context
    });
  },
  
  /**
   * Journalise une tentative de téléchargement d'image
   * @param {Object} fileInfo - Informations sur le fichier
   * @param {number} index - Index de l'image
   * @param {string} url - URL de téléchargement
   */
  logDownloadAttempt: (fileInfo, index, url) => {
    writeToLog(CONVERSION_LOG, `📥 TÉLÉCHARGEMENT IMAGE ${index + 1}`, {
      url,
      fileInfo: {
        fileName: fileInfo.FileName || fileInfo.filename || 'inconnu',
        fileSize: fileInfo.FileSize || fileInfo.filesize || 'inconnu',
        fileId: fileInfo.FileId || fileInfo.fileid || 'inconnu'
      }
    });
  },
  
  /**
   * Journalise le succès d'un téléchargement d'image
   * @param {number} index - Index de l'image
   * @param {string} outputPath - Chemin où l'image a été sauvegardée
   */
  logDownloadSuccess: (index, outputPath) => {
    const fileExists = fs.existsSync(outputPath);
    let fileSize = 0;
    
    if (fileExists) {
      try {
        const stats = fs.statSync(outputPath);
        fileSize = stats.size;
      } catch (e) {
        // Ignorer les erreurs
      }
    }
    
    writeToLog(CONVERSION_LOG, `✅ IMAGE ${index + 1} TÉLÉCHARGÉE`, {
      path: outputPath,
      exists: fileExists,
      size: fileSize ? `${Math.round(fileSize / 1024)} KB` : 'inconnu',
      permissions: fileExists ? (fs.statSync(outputPath).mode & parseInt('777', 8)).toString(8) : 'N/A'
    });
  },
  
  /**
   * Journalise l'échec d'un téléchargement d'image
   * @param {number} index - Index de l'image
   * @param {Error} error - Erreur survenue
   * @param {string} url - URL de téléchargement
   */
  logDownloadError: (index, error, url) => {
    writeToLog(CONVERSION_LOG, `❌ ERREUR TÉLÉCHARGEMENT IMAGE ${index + 1}`, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      url
    });
  },
  
  /**
   * Analyse le dossier d'upload et vérifie l'état des diapositives
   * @param {string} templateId - ID du template
   */
  analyzeTemplateFolder: (templateId) => {
    const templateDir = path.join(__dirname, '../uploads/templates', templateId.toString());
    let report = {
      templateId,
      directoryExists: false,
      slides: [],
      totalFiles: 0,
      totalSize: 0,
      permissions: 'N/A'
    };
    
    if (fs.existsSync(templateDir)) {
      report.directoryExists = true;
      try {
        const files = fs.readdirSync(templateDir);
        report.totalFiles = files.length;
        report.permissions = (fs.statSync(templateDir).mode & parseInt('777', 8)).toString(8);
        
        files.forEach(file => {
          const filePath = path.join(templateDir, file);
          const stats = fs.statSync(filePath);
          const fileSize = stats.size;
          report.totalSize += fileSize;
          
          const isImageFile = /\.(jpg|jpeg|png|gif|svg)$/i.test(file);
          const slideMatch = file.match(/slide_(\d+)\./i);
          
          if (isImageFile && slideMatch) {
            const slideIndex = parseInt(slideMatch[1], 10);
            report.slides.push({
              index: slideIndex,
              fileName: file,
              path: filePath,
              size: fileSize,
              lastModified: stats.mtime
            });
          }
        });
        
        // Trier les diapositives par index
        report.slides.sort((a, b) => a.index - b.index);
      } catch (error) {
        report.error = {
          message: error.message,
          stack: error.stack
        };
      }
    }
    
    writeToLog(CONVERSION_LOG, `📊 ANALYSE DU DOSSIER DU TEMPLATE ${templateId}`, report);
    return report;
  }
};

/**
 * Service de diagnostic pour les uploads de fichiers
 */
const uploadDiagnostic = {
  /**
   * Journalise un upload de fichier
   * @param {Object} req - Requête Express
   */
  logUploadStart: (req) => {
    const file = req.file || {};
    const fileData = {
      originalname: file.originalname || 'inconnu',
      mimetype: file.mimetype || 'inconnu',
      size: file.size ? `${Math.round(file.size / 1024)} KB` : 'inconnu',
      path: file.path || 'inconnu'
    };
    
    writeToLog(UPLOAD_LOG, '📤 DÉBUT UPLOAD FICHIER', {
      timestamp: new Date().toISOString(),
      file: fileData,
      user: req.user ? { id: req.user.id, email: req.user.email } : 'non authentifié',
      headers: {
        contentType: req.headers['content-type'] || 'non défini',
        contentLength: req.headers['content-length'] || 'non défini'
      }
    });
  },
  
  /**
   * Journalise une erreur d'upload
   * @param {Error} error - Erreur survenue
   * @param {Object} req - Requête Express
   */
  logUploadError: (error, req) => {
    writeToLog(UPLOAD_LOG, '❌ ERREUR UPLOAD FICHIER', {
      error: {
        message: error.message,
        stack: error.stack
      },
      user: req.user ? { id: req.user.id, email: req.user.email } : 'non authentifié'
    });
  },
  
  /**
   * Journalise le succès d'un upload
   * @param {Object} template - Template créé
   * @param {Object} file - Fichier uploadé
   */
  logUploadSuccess: (template, file) => {
    writeToLog(UPLOAD_LOG, '✅ UPLOAD FICHIER RÉUSSI', {
      template: {
        id: template.id,
        name: template.name
      },
      file: {
        originalname: file.originalname,
        path: file.path,
        size: file.size ? `${Math.round(file.size / 1024)} KB` : 'inconnu'
      }
    });
  }
};

/**
 * Exécute un diagnostic complet du système
 * @returns {Object} Résultat du diagnostic
 */
async function runSystemDiagnostic() {
  const result = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      memory: {
        free: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
        total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`
      },
      uptime: `${Math.round(os.uptime() / 60)} minutes`
    },
    directories: {}
  };
  
  // Vérifier les répertoires clés
  const directoriesToCheck = [
    { name: 'logs', path: LOG_DIR },
    { name: 'uploads', path: path.join(__dirname, '../uploads') },
    { name: 'uploads/temp', path: path.join(__dirname, '../uploads/temp') },
    { name: 'uploads/templates', path: path.join(__dirname, '../uploads/templates') },
    { name: 'uploads/exports', path: path.join(__dirname, '../uploads/exports') }
  ];
  
  for (const dir of directoriesToCheck) {
    const dirPath = dir.path;
    const exists = fs.existsSync(dirPath);
    
    let writable = false;
    if (exists) {
      try {
        const testFile = path.join(dirPath, `test_${Date.now()}.tmp`);
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        writable = true;
      } catch (e) {
        writable = false;
      }
    }
    
    result.directories[dir.name] = {
      path: dirPath,
      exists,
      writable
    };
    
    // Si le répertoire n'existe pas, essayer de le créer
    if (!exists) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        result.directories[dir.name].created = true;
      } catch (e) {
        result.directories[dir.name].error = e.message;
      }
    }
  }
  
  // Journaliser le résultat
  writeToLog(BACKEND_LOG, '🔍 DIAGNOSTIC SYSTÈME', result);
  
  return result;
}

module.exports = {
  conversionDiagnostic,
  uploadDiagnostic,
  runSystemDiagnostic
};
