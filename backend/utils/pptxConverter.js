const fs = require('fs');
const path = require('path');
const ConvertApi = require('convertapi');
const axios = require('axios');
const { conversionDiagnostic } = require('./diagnosticService');

// Configuration d'axios pour les téléchargements
axios.defaults.timeout = 30000; // 30 secondes de timeout
axios.defaults.maxContentLength = 50 * 1024 * 1024; // 50 MB max

// Charger les variables d'environnement en utilisant le chemin absolu vers le fichier .env
// pour éviter les problèmes de chemin relatif
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Vérification explicite de la clé API
const CONVERT_API_SECRET = process.env.CONVERT_API_SECRET || '';
if (!CONVERT_API_SECRET) {
  console.error('ERREUR CRITIQUE: Variable CONVERT_API_SECRET non définie dans .env');
  console.error('Chemin du fichier .env recherché:', path.resolve(__dirname, '../.env'));
  console.error('Variables d\'environnement disponibles:', Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')).join(', '));
  
  // En production, nous lançons une erreur
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Configuration ConvertAPI manquante');
  }
}

// Initialisation avec la clé API
let convertApi = null;
try {
  convertApi = new ConvertApi(CONVERT_API_SECRET);
  console.log('Clé ConvertAPI configurée:', CONVERT_API_SECRET ? `${CONVERT_API_SECRET.substring(0, 6)}...` : 'Manquante');
} catch (error) {
  console.error('Erreur lors de l\'initialisation de ConvertAPI:', error.message);
}

// Vérification de la clé API au démarrage (une seule fois)
(async () => {
  try {
    if (CONVERT_API_SECRET && convertApi) {
      const userInfo = await convertApi.getUser();
      console.log('ConvertAPI connecté avec succès - Secondes disponibles:', userInfo.SecondsLeft);
    } else {
      console.error('Impossible de vérifier la connexion ConvertAPI: Clé manquante ou API non initialisée');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de la clé API ConvertAPI:', error.message);
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
    
    // Journaliser la réponse complète pour analyse - avec gestion des structures circulaires
    try {
      // Extraction sécurisée des propriétés importantes uniquement pour éviter les références circulaires
      const safeResult = {
        ConversionCost: result.ConversionCost,
        Files: result.Files ? result.Files.map(file => ({
          FileName: file.FileName,
          FileExt: file.FileExt,
          FileSize: file.FileSize,
          FileId: file.FileId,
          Url: file.Url
        })) : []
      };

      fs.writeFileSync(
        path.join(__dirname, '../logs/convertapi_response.json'), 
        JSON.stringify(safeResult, null, 2)
      );
    } catch (logError) {
      console.error('Erreur lors de la journalisation de la réponse ConvertAPI:', logError.message);
    }
    
    // Adaptation à la structure réelle de la réponse ConvertAPI
    // Déterminer la structure de la réponse et extraire les fichiers de manière robuste
    let files = [];
    
    // Vérification complète de la structure de la réponse
    console.log('Analyse complète de la réponse ConvertAPI:', JSON.stringify(result, (key, value) => {
      // Éviter les références circulaires
      if (key === 'client' || key === 'api') return '[Circular]';
      return value;
    }, 2).substring(0, 1000));
    
    // Tenter d'extraire les fichiers avec différentes stratégies
    if (result.Files && Array.isArray(result.Files)) {
      // Cas 1: Files est un tableau (structure attendue)
      files = result.Files;
      console.log('Structure standard détectée: Files est un tableau');
    } else if (result.files && Array.isArray(result.files)) {
      // Cas 2: files est en minuscule
      files = result.files;
      console.log('Structure alternative détectée: files est en minuscule');
    } else if (result.File && Array.isArray(result.File)) {
      // Cas 3: File au singulier
      files = result.File;
      console.log('Structure alternative détectée: File au singulier');
    } else if (result.Response && result.Response.Files && Array.isArray(result.Response.Files)) {
      // Cas 4: Sous-propriété Response
      files = result.Response.Files;
      console.log('Structure imbriquée détectée: Response.Files');
    } else {
      // Cas d'échec: Explorer manuellement pour trouver un tableau d'URLs
      console.log('Aucune structure standard détectée, recherche manuelle de fichiers...');
      
      // Cas 5: Explorer les propriétés de premier niveau pour trouver une URL
      const urlProperties = Object.entries(result)
        .filter(([key, value]) => {
          return typeof value === 'string' && 
                 (value.startsWith('http://') || value.startsWith('https://')) &&
                 (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png'));
        })
        .map(([key, value]) => ({ Url: value, FileName: `slide_${key}.jpg` }));
      
      if (urlProperties.length > 0) {
        files = urlProperties;
        console.log('URLs trouvées comme propriétés de premier niveau');
      }
    }
    
    console.log(`Nombre de fichiers convertis: ${files.length}`);
    
    // Journalisation détaillée du premier fichier pour vérification
    if (files.length > 0) {
      // Vérifier si les propriétés attendues existent et normaliser les noms
      const firstFile = files[0];
      const normalizedFile = {
        FileName: firstFile.FileName || firstFile.fileName || firstFile.filename || `slide_0.jpg`,
        FileExt: firstFile.FileExt || firstFile.fileExt || firstFile.ext || 'jpg',
        FileSize: firstFile.FileSize || firstFile.fileSize || firstFile.size || 0,
        FileId: firstFile.FileId || firstFile.fileId || firstFile.id || '0',
        Url: firstFile.Url || firstFile.url || firstFile.URL || firstFile.href || ''
      };
      
      console.log('Premier fichier converti (normalisé):', normalizedFile);
    }
    
    if (files.length === 0) {
      throw new Error('La conversion n\'a produit aucun fichier');
    }
    
    // Télécharger et sauvegarder chaque image
    const imagePaths = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const slideIndex = i;
      const outputPath = path.join(outputDir, `slide_${slideIndex}.jpg`);
      
      // Normaliser l'accès à l'URL (peu importe la casse: Url, url, URL...)
      const downloadUrl = file.Url || file.url || file.URL || file.href || '';
      
      if (!downloadUrl) {
        console.error(`Fichier ${i+1}/${files.length}: URL manquante`);
        console.log('Propriétés disponibles:', Object.keys(file).join(', '));
        console.log('Contenu du fichier:', JSON.stringify(file, null, 2));
        continue; // Passer au fichier suivant
      }
      
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
        
        // Vérifier si l'URL est valide
        if (!downloadUrl.startsWith('http://') && !downloadUrl.startsWith('https://')) {
          throw new Error(`URL invalide: ${downloadUrl}`);
        }
        
        // Télécharger le fichier avec gestion robuste des erreurs via axios
        const response = await axios({
          method: 'get',
          url: downloadUrl,
          responseType: 'arraybuffer',
          timeout: 30000, // 30 secondes
          maxContentLength: 10 * 1024 * 1024, // 10 MB max
          validateStatus: status => status >= 200 && status < 300
        });
        
        // Écrire le fichier avec vérification d'espace disque
        fs.writeFileSync(outputPath, Buffer.from(response.data));
        
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
      // Extraire la partie du chemin après /uploads/ pour créer une URL relative correcte
      let relativeImagePath = outputPath;
      const uploadsIndex = outputPath.indexOf('/uploads/');
      
      if (uploadsIndex !== -1) {
        // Extraire la partie après /uploads/
        relativeImagePath = outputPath.substring(uploadsIndex);
      } else {
        // Fallback si le chemin ne contient pas /uploads/
        relativeImagePath = `/uploads/templates/${path.basename(outputDir)}/slide_${slideIndex}.jpg`;
      }
      
      console.log(`Image ${slideIndex}: Chemin absolu=${outputPath}, Chemin relatif=${relativeImagePath}`);
      
      // Ajouter les informations de l'image
      imagePaths.push({
        slideIndex,
        path: outputPath,             // Chemin physique complet
        image_path: relativeImagePath, // Chemin relatif pour la BDD
        image_url: relativeImagePath,  // Url pour accès frontal
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
      console.error('ERREUR CRITIQUE: Problème d\'authentification avec ConvertAPI');
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