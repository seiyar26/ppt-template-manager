const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Nom du bucket de stockage
const UPLOADS_BUCKET = 'uploads';

/**
 * Télécharge un fichier vers Supabase Storage
 * @param {string} filePath - Chemin local du fichier à télécharger
 * @param {string} destinationPath - Chemin de destination dans le bucket
 * @returns {Promise<Object>} - Résultat de l'opération de téléchargement
 */
const uploadFile = async (filePath, destinationPath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Le fichier ${filePath} n'existe pas`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    // Déterminer le type MIME du fichier
    let contentType = 'application/octet-stream'; // Par défaut
    if (filePath.endsWith('.pptx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (filePath.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (filePath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    }

    const fullPath = destinationPath || fileName;
    
    // Télécharger le fichier
    const { data, error } = await supabase.storage
      .from(UPLOADS_BUCKET)
      .upload(fullPath, fileBuffer, {
        contentType,
        upsert: true // Remplacer si existe déjà
      });

    if (error) {
      throw error;
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(UPLOADS_BUCKET)
      .getPublicUrl(fullPath);

    return {
      success: true,
      path: fullPath,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Télécharge un fichier depuis Supabase Storage
 * @param {string} filePath - Chemin du fichier dans le bucket
 * @param {string} localPath - Chemin local où enregistrer le fichier
 * @returns {Promise<Object>} - Résultat de l'opération de téléchargement
 */
const downloadFile = async (filePath, localPath) => {
  try {
    const { data, error } = await supabase.storage
      .from(UPLOADS_BUCKET)
      .download(filePath);

    if (error) {
      throw error;
    }

    // Écrire le fichier localement
    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(localPath, buffer);

    return {
      success: true,
      path: localPath
    };
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Supprime un fichier du Supabase Storage
 * @param {string} filePath - Chemin du fichier dans le bucket
 * @returns {Promise<Object>} - Résultat de l'opération de suppression
 */
const deleteFile = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(UPLOADS_BUCKET)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return {
      success: true,
      removed: data
    };
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Génère une URL publique pour un fichier
 * @param {string} filePath - Chemin du fichier dans le bucket
 * @returns {string} - URL publique du fichier
 */
const getPublicUrl = (filePath) => {
  const { data } = supabase.storage
    .from(UPLOADS_BUCKET)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile,
  getPublicUrl
};
