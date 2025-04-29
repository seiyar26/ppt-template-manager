/**
 * Configuration du stockage pour les fichiers (production vs développement)
 * Ce fichier centralise la logique de stockage pour faciliter le déploiement
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Création du client Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
let supabaseClient = null;

// Initialiser le client Supabase si les variables d'environnement sont définies
if (supabaseUrl && supabaseKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log('Client Supabase initialisé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du client Supabase:', error);
  }
}

/**
 * Détermine si nous sommes en environnement de production
 * @returns {boolean} true si en production
 */
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Crée les répertoires locaux nécessaires pour le stockage
 */
function ensureLocalDirectories() {
  const dirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../uploads/templates'),
    path.join(__dirname, '../uploads/temp'),
    path.join(__dirname, '../uploads/exports')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Répertoire créé: ${dir}`);
    }
  });
}

/**
 * Upload un fichier vers le stockage (local ou Supabase selon l'environnement)
 * @param {Object} file - Objet fichier (généralement de multer)
 * @param {string} bucket - Nom du bucket Supabase ou sous-dossier local
 * @param {string} customFileName - Nom de fichier personnalisé (optionnel)
 * @returns {Promise<Object>} - Informations sur le fichier uploadé
 */
async function uploadFile(file, bucket, customFileName = null) {
  // S'assurer que les répertoires locaux existent
  ensureLocalDirectories();
  
  // Déterminer le nom du fichier à utiliser
  const fileName = customFileName || file.filename || path.basename(file.path);
  
  // En production, utiliser Supabase si disponible
  if (isProduction() && supabaseClient) {
    try {
      console.log(`Tentative d'upload du fichier ${fileName} vers Supabase (bucket: ${bucket})`);
      
      // Créer un timeout de 10 secondes pour l'upload
      const uploadPromise = supabaseClient.storage
        .from(bucket)
        .upload(fileName, fs.createReadStream(file.path), {
          cacheControl: '3600',
          upsert: true,
          contentType: file.mimetype
        });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout lors de l\'upload vers Supabase')), 10000)
      );
      
      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);
      
      if (error) {
        throw error;
      }
      
      // Construire l'URL publique du fichier
      const { data: urlData } = await supabaseClient.storage
        .from(bucket)
        .getPublicUrl(fileName);
      
      console.log(`Fichier uploadé avec succès vers Supabase: ${urlData?.publicUrl || 'URL non disponible'}`);
      
      return {
        path: file.path, // Chemin local (toujours conservé)
        url: urlData?.publicUrl, // URL publique Supabase
        filename: fileName,
        storage: 'supabase'
      };
    } catch (error) {
      console.error(`Erreur lors de l'upload vers Supabase:`, error);
      console.log(`Fallback vers stockage local`);
      // En cas d'erreur avec Supabase, utiliser le stockage local comme fallback
    }
  }
  
  // Stockage local (développement ou fallback en production)
  const localPath = path.join(__dirname, '../uploads', bucket, fileName);
  const localDir = path.dirname(localPath);
  
  // Créer le répertoire cible s'il n'existe pas
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  
  // Si le fichier n'est pas déjà à sa destination finale, le copier
  if (file.path !== localPath) {
    fs.copyFileSync(file.path, localPath);
  }
  
  // Construire le chemin relatif pour l'API
  const relativePath = `/uploads/${bucket}/${fileName}`;
  
  console.log(`Fichier stocké localement: ${localPath} (chemin API: ${relativePath})`);
  
  return {
    path: localPath,
    url: relativePath, // URL relative pour l'API
    filename: fileName,
    storage: 'local'
  };
}

module.exports = {
  uploadFile,
  isProduction,
  ensureLocalDirectories,
  supabase: supabaseClient
};
