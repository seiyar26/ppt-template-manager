/**
 * Script pour corriger les chemins d'images dans la base de données
 * Convertit les chemins absolus en chemins relatifs
 */

// Charger les variables d'environnement avant d'importer les modèles
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });

// Importer les modèles après l'initialisation des variables d'environnement
const { Slide } = require('./backend/models');
const sequelize = require('./backend/config/database');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function fixImagePaths() {
  try {
    console.log(`${colors.blue}====== CORRECTION DES CHEMINS D'IMAGES ======${colors.reset}`);
    
    // Vérifier la connexion à la base de données
    try {
      await sequelize.authenticate();
      console.log(`${colors.green}Connexion à la base de données établie avec succès.${colors.reset}`);
    } catch (dbError) {
      console.error(`${colors.red}Erreur de connexion à la base de données: ${dbError.message}${colors.reset}`);
      return;
    }
    
    // Récupérer toutes les diapositives
    const slides = await Slide.findAll();
    
    console.log(`\n${colors.blue}Diapositives à corriger: ${slides.length}${colors.reset}\n`);
    
    let updatedCount = 0;
    
    // Mettre à jour chaque diapositive avec un chemin relatif
    for (const slide of slides) {
      const originalPath = slide.image_path;
      
      // Si le chemin est déjà relatif, ne pas le modifier
      if (!originalPath || originalPath.startsWith('/uploads')) {
        console.log(`  ${colors.yellow}Diapo ${slide.id}: Chemin déjà relatif ${originalPath}${colors.reset}`);
        continue;
      }
      
      // Extraire le chemin relatif à partir du chemin absolu
      let relativePath = null;
      const uploadsIndex = originalPath.indexOf('/uploads/');
      
      if (uploadsIndex !== -1) {
        relativePath = originalPath.substring(uploadsIndex);
        console.log(`  ${colors.cyan}Diapo ${slide.id}: Conversion ${colors.reset}`);
        console.log(`    ${colors.red}${originalPath}${colors.reset}`);
        console.log(`    ${colors.green}${relativePath}${colors.reset}`);
        
        // Mettre à jour la diapositive avec le chemin relatif
        slide.image_path = relativePath;
        await slide.save();
        updatedCount++;
      } else {
        console.log(`  ${colors.red}Diapo ${slide.id}: Impossible de trouver '/uploads/' dans le chemin ${originalPath}${colors.reset}`);
      }
    }
    
    console.log(`\n${colors.green}${updatedCount} diapositives mises à jour avec succès.${colors.reset}`);
    
    // Vérifier qu'il n'y a plus de chemins absolus
    const remainingAbsolutePaths = await Slide.count({
      where: sequelize.literal("image_path LIKE '/Users/%'")
    });
    
    if (remainingAbsolutePaths > 0) {
      console.log(`${colors.red}Attention: ${remainingAbsolutePaths} diapositives ont encore des chemins absolus.${colors.reset}`);
    } else {
      console.log(`${colors.green}Tous les chemins d'images sont maintenant relatifs.${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Erreur lors de la correction des chemins d'images: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

fixImagePaths();
