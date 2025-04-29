const fs = require('fs');
const path = require('path');
const util = require('util');

class DiagnosticLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.uploadLogFile = path.join(this.logDir, 'upload-diagnostic.log');
    this.errorLogFile = path.join(this.logDir, 'error-diagnostic.log');
    
    // Créer le répertoire de logs s'il n'existe pas
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Créer les fichiers de logs s'ils n'existent pas
    if (!fs.existsSync(this.uploadLogFile)) {
      fs.writeFileSync(this.uploadLogFile, '');
    }
    
    if (!fs.existsSync(this.errorLogFile)) {
      fs.writeFileSync(this.errorLogFile, '');
    }
  }
  
  /**
   * Log détaillé d'un événement avec timestamp
   */
  _writeToFile(logFile, level, message, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    try {
      fs.appendFileSync(
        logFile,
        JSON.stringify(logEntry, null, 2) + ',\n'
      );
      
      // Afficher également dans la console
      console.log(`[${timestamp}] [${level}] ${message}`);
      if (data) {
        console.log(util.inspect(data, { depth: null, colors: true }));
      }
    } catch (err) {
      console.error('Erreur lors de l\'écriture du log:', err);
    }
  }
  
  /**
   * Logs détaillés pour le diagnostic d'upload
   */
  logUploadStart(req) {
    const fileDetails = req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : 'Aucun fichier';
    
    const reqDetails = {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: { ...req.body },
      file: fileDetails,
      user: req.user ? { id: req.user.id, email: req.user.email } : 'Non authentifié'
    };
    
    this._writeToFile(this.uploadLogFile, 'INFO', 'Début de l\'upload', reqDetails);
  }
  
  logUploadSuccess(templateData) {
    this._writeToFile(this.uploadLogFile, 'SUCCESS', 'Upload réussi', templateData);
  }
  
  logUploadError(error, req) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      request: {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: { ...req.body },
        file: req.file
      }
    };
    
    this._writeToFile(this.errorLogFile, 'ERROR', 'Erreur d\'upload', errorDetails);
  }
  
  /**
   * Logs généraux pour le suivi des erreurs
   */
  logError(error, context = {}) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      context
    };
    
    this._writeToFile(this.errorLogFile, 'ERROR', 'Erreur générale', errorDetails);
  }
  
  /**
   * Vérification des permissions et chemins
   */
  logPathCheck(directory, hasAccess) {
    this._writeToFile(
      this.uploadLogFile,
      hasAccess ? 'INFO' : 'WARNING',
      `Vérification d'accès: ${directory}`,
      { hasAccess, directory }
    );
  }
  
  /**
   * Diagnostic complet du système
   */
  async runSystemDiagnostic() {
    const diagnosticResults = {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      env: process.env.NODE_ENV,
      directories: {}
    };
    
    // Vérifier les répertoires clés
    const dirsToCheck = [
      path.join(__dirname, '../uploads'),
      path.join(__dirname, '../uploads/temp'),
      path.join(__dirname, '../uploads/templates'),
      path.join(__dirname, '../uploads/exports')
    ];
    
    dirsToCheck.forEach(dir => {
      try {
        const exists = fs.existsSync(dir);
        let writable = false;
        
        if (exists) {
          try {
            // Test écriture
            const testFile = path.join(dir, '.write-test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            writable = true;
          } catch (e) {
            writable = false;
          }
        }
        
        diagnosticResults.directories[dir] = { exists, writable };
        this.logPathCheck(dir, exists && writable);
      } catch (err) {
        diagnosticResults.directories[dir] = { error: err.message };
      }
    });
    
    this._writeToFile(
      this.uploadLogFile,
      'DIAGNOSTIC',
      'Diagnostic système',
      diagnosticResults
    );
    
    return diagnosticResults;
  }
}

// Singleton pour réutilisation
const diagnosticLogger = new DiagnosticLogger();

module.exports = diagnosticLogger;
