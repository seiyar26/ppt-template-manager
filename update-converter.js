const fs = require('fs');
const path = require('path');

const converterPath = path.join(__dirname, 'backend', 'utils', 'pptxConverter.js');

if (!fs.existsSync(converterPath)) {
  console.error('Fichier pptxConverter.js non trouvé');
  process.exit(1);
}

let content = fs.readFileSync(converterPath, 'utf8');

// Ajouter une vérification explicite de la clé API
const apiCheckCode = `
// Vérification explicite de la clé API
const CONVERT_API_SECRET = process.env.CONVERT_API_SECRET || '';
if (!CONVERT_API_SECRET) {
  console.error('ERREUR CRITIQUE: Variable CONVERT_API_SECRET non définie dans .env');
  // En production, nous lançons une erreur
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Configuration ConvertAPI manquante');
  }
}
const convertApi = new ConvertApi(CONVERT_API_SECRET);

// Vérification de la clé API au démarrage
(async () => {
  try {
    if (CONVERT_API_SECRET) {
      const userInfo = await convertApi.getUser();
      console.log('ConvertAPI connecté avec succès - Secondes disponibles:', userInfo.SecondsLeft);
    }
  } catch (error) {
    console.error('Erreur de connexion à ConvertAPI:', error.message);
  }
})();
`;

// Remplacer l'initialisation existante
content = content.replace(
  /const convertApi = new ConvertApi\(.*\);/,
  apiCheckCode
);

// Ajouter un meilleur traitement des erreurs d'authentification
const errorHandlingCode = `
  } catch (error) {
    console.error('Erreur de conversion PPTX vers images:', error);
    
    // Journaliser l'erreur avec le service de diagnostic
    conversionDiagnostic.logError(error, { filePath, templateId });
    
    // Détection spécifique des erreurs d'authentification
    if (error.message && (
        error.message.includes('Unauthorized') || 
        error.message.includes('credentials not set') ||
        error.message.includes('Code: 401') ||
        error.message.includes('Code: 4013')
      )) {
      console.error('ERREUR CRITIQUE: Problème d\'authentification avec ConvertAPI');
      console.error('Veuillez vérifier votre clé API dans le fichier .env');
      
      // Notifier l'administrateur en production
      if (process.env.NODE_ENV === 'production') {
        // Code de notification (email, log, etc.)
      }
    }
    
    // Mode de secours: générer des images vides en développement
`;

// Remplacer le bloc catch existant
content = content.replace(
  /\s+} catch \(error\) \{\s+console\.error\('Erreur de conversion PPTX vers images:', error\);(\s+\/\/ Journaliser l'erreur avec le service de diagnostic\s+conversionDiagnostic\.logError\(error, \{ filePath, templateId \}\);)?\s+\/\/ Mode de secours: générer des images vides en développement/,
  errorHandlingCode
);

fs.writeFileSync(converterPath, content, 'utf8');
console.log('Fichier pptxConverter.js mis à jour avec succès');
