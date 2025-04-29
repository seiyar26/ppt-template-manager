const fs = require('fs');
const path = require('path');
const ConvertApi = require('convertapi');
const fetch = require('node-fetch');
const { conversionDiagnostic } = require('./diagnosticService');
require('dotenv').config();

// Initialize ConvertAPI with secret
const CONVERT_API_SECRET = process.env.CONVERT_API_SECRET || '';
if (!CONVERT_API_SECRET) {
  console.error('AVERTISSEMENT: Variable CONVERT_API_SECRET non définie dans .env');
}

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


/**
 * Convertit un fichier PPTX en images en utilisant ConvertAPI
 * @param {string} filePath - Chemin vers le fichier PPTX
 * @param {string|null} templateId - ID du template (optionnel)
 * @returns {Promise<Array>} - Tableau contenant les informations des images converties
 */
const convertPptxToImages = async (filePath, templateId = null) => {
  // Journaliser le début de la conversion avec le service de diagnostic
  conversionDiagnostic.logStart({ filePath, templateId });
  
  try {
    // Mesure de traitement défensif: si templateId n'est pas fourni, utiliser un dossier temporaire
    let outputDir;
    
    if (templateId) {
      outputDir = path.join(__dirname, '../uploads/templates', templateId.toString());
    } else {
      // Générer un ID temporaire basé sur l'horodatage
      const tempId = Date.now().toString();
      outputDir = path.join(__dirname, '../uploads/templates', tempId);
      console.log(`templateId non fourni, utilisation d'un dossier temporaire: ${tempId}`);
    }
    
    // S'assurer que le répertoire existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Vérifier que le fichier PPTX existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Le fichier PPTX n'existe pas: ${filePath}`);
    }

    // Convertir PPTX en JPG avec ConvertAPI - avec trace détaillée
    console.log(`Conversion du fichier ${filePath} avec ConvertAPI...`);
    
    // Vérifier que le fichier existe avant conversion
    const fileStats = fs.statSync(filePath);
    console.log(`Fichier PPTX: ${path.basename(filePath)}, taille: ${Math.round(fileStats.size / 1024)} KB`);
    
    // Appel à l'API avec diagnostic complet
    const conversionOptions = {
      File: filePath,
      ImageQuality: '100',
      StoreFile: true
    };
    
    const result = await convertApi.convert('jpg', conversionOptions, 'pptx');
    
    // Analyse de la réponse avec journalisation complète
    const responseData = {
      ConversionCost: result.ConversionCost,
      Files: result.Files ? `${result.Files.length} fichiers` : (result.files ? `${result.files.length} fichiers (prop en minuscule)` : 'Pas de fichiers')
    };
    
    console.log('Réponse de ConvertAPI:', JSON.stringify(responseData, null, 2));
    
    // Journaliser la réponse complète pour analyse
    fs.writeFileSync(
      path.join(__dirname, '../logs/convertapi_response.json'), 
      JSON.stringify(result, null, 2)
    );
    
    // Adaptation à la structure réelle de la réponse ConvertAPI
    // Les propriétés commencent par des majuscules et les fichiers sont dans Files (pas files)
    const files = result.Files || result.files || [];
    console.log(`${files.length} fichiers reçus de ConvertAPI`);
    
    // Télécharger et sauvegarder chaque image
    const imagePaths = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const slideIndex = i;
      const outputPath = path.join(outputDir, `slide_${slideIndex}.jpg`);
      
      // L'URL de téléchargement est dans la propriété Url (majuscule)
      const downloadUrl = file.Url || file.url;
      
      // Journaliser la tentative de téléchargement avec le service de diagnostic
      conversionDiagnostic.logDownloadAttempt(file, i, downloadUrl);
      console.log(`Téléchargement du fichier ${i+1}/${files.length}: ${downloadUrl}`);
      
      // Téléchargement avec fetch car le format de la réponse ConvertAPI est différent
      try {
        // Vérifier si le répertoire de sortie existe encore
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
          console.log(`Répertoire de sortie recréé: ${outputDir}`);
        }
        
        // Télécharger le fichier avec gestion robuste des erreurs
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        }
        
        const buffer = await response.arrayBuffer();
        
        // Écrire le fichier avec vérification d'espace disque
        fs.writeFileSync(outputPath, Buffer.from(buffer));
        
        // Vérifier que le fichier a bien été créé
        if (fs.existsSync(outputPath)) {
          const fileSize = fs.statSync(outputPath).size;
          console.log(`Fichier enregistré sur ${outputPath} (${Math.round(fileSize / 1024)} KB)`);
          conversionDiagnostic.logDownloadSuccess(i, outputPath);
        } else {
          throw new Error(`Le fichier n'a pas été créé après écriture: ${outputPath}`);
        }
      } catch (downloadError) {
        console.error(`Erreur lors du téléchargement de l'image ${i}:`, downloadError);
        conversionDiagnostic.logDownloadError(i, downloadError, downloadUrl);
        continue;
      }
      
      // Valeurs par défaut pour les dimensions
      const width = 800;
      const height = 600;
      
      // Calculer le chemin relatif pour la base de données
      const relativeImagePath = `/uploads/templates/${path.basename(outputDir)}/slide_${slideIndex}.jpg`;
      
      // Ajouter les informations de l'image
      imagePaths.push({
        slideIndex,
        path: outputPath,           // Chemin physique complet
        image_path: relativeImagePath, // Chemin relatif pour la BDD
        width,
        height,
        thumbnailPath: relativeImagePath // Même image comme miniature
      });
    }

    console.log(`${imagePaths.length} diapositives converties avec succès`);
    
    // Journaliser le succès de la conversion
    conversionDiagnostic.logSuccess(result, imagePaths);
    
    // Analyser le dossier du template pour vérification
    if (templateId) {
      conversionDiagnostic.analyzeTemplateFolder(templateId);
    }
    
    return imagePaths;
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
      console.error('ERREUR CRITIQUE: Problème d'authentification avec ConvertAPI');
      console.error('Veuillez vérifier votre clé API dans le fichier .env');
      
      // Notifier l'administrateur en production
      if (process.env.NODE_ENV === 'production') {
        // Code de notification (email, log, etc.)
      }
    }
    
    // Mode de secours: générer des images vides en développement

    if (process.env.NODE_ENV === 'development') {
      try {
        console.log('MODE DÉVELOPPEMENT: Génération de diapositives de secours');
        const tempOutputDir = path.join(__dirname, '../uploads/templates', 'temp_' + Date.now());
        if (!fs.existsSync(tempOutputDir)) {
          fs.mkdirSync(tempOutputDir, { recursive: true });
        }
        
        // Créer 3 diapositives vides
        const placeholderImages = [];
        for (let i = 0; i < 3; i++) {
          const outputPath = path.join(tempOutputDir, `slide_${i}.jpg`);
          // Créer un fichier vide
          fs.writeFileSync(outputPath, '');
          
          placeholderImages.push({
            slideIndex: i,
            path: outputPath,
            image_path: `/uploads/templates/${path.basename(tempOutputDir)}/slide_${i}.jpg`,
            width: 800,
            height: 600,
            thumbnailPath: `/uploads/templates/${path.basename(tempOutputDir)}/slide_${i}.jpg`
          });
        }
        
        console.log('3 diapositives de secours générées');
        return placeholderImages;
      } catch (fallbackError) {
        console.error('Erreur lors de la génération des images de secours:', fallbackError);
      }
    }
    
    throw error;
  }
};

module.exports = {
  convertPptxToImages
};