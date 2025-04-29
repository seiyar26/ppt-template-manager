/**
 * Script pour corriger les chemins d'images qui contiennent une duplication de chemin
 * Problème: /uploads/templates/Users/michaeltenenbaum/Downloads/ppt-template-manager/backend/uploads/templates/slide_0.jpg
 * Solution: /uploads/templates/slide_0.jpg
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

async function fixDoublePaths() {
  try {
    console.log(`${colors.blue}====== CORRECTION DES CHEMINS D'IMAGES DUPLIQUÉS ======${colors.reset}`);
    
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
    
    console.log(`\n${colors.blue}Diapositives à analyser: ${slides.length}${colors.reset}\n`);
    
    let updatedCount = 0;
    
    // Mettre à jour chaque diapositive avec un chemin sans duplication
    for (const slide of slides) {
      const originalPath = slide.image_path;
      
      // Ne traiter que les chemins problématiques
      if (!originalPath || !originalPath.includes('/uploads/templates/Users/')) {
        continue;
      }
      
      // Trouver la dernière occurrence de slide_X.jpg
      const slidePattern = /slide_\d+\.jpg$/;
      const match = originalPath.match(slidePattern);
      
      if (match) {
        const slideFile = match[0];
        // Créer un nouveau chemin propre
        const newPath = `/uploads/templates/${slideFile}`;
        
        console.log(`  ${colors.cyan}Diapo ${slide.id}: Correction du chemin${colors.reset}`);
        console.log(`    ${colors.red}${originalPath}${colors.reset}`);
        console.log(`    ${colors.green}${newPath}${colors.reset}`);
        
        // Mettre à jour la diapositive avec le chemin corrigé
        slide.image_path = newPath;
        slide.thumb_path = newPath; // Également mettre à jour le chemin de la miniature
        await slide.save();
        updatedCount++;
      } else {
        console.log(`  ${colors.yellow}Diapo ${slide.id}: Pas de motif 'slide_X.jpg' trouvé dans ${originalPath}${colors.reset}`);
      }
    }
    
    console.log(`\n${colors.green}${updatedCount} diapositives mises à jour avec succès.${colors.reset}`);
    
    // Vérifier qu'il n'y a plus de chemins dupliqués
    const remainingBadPaths = await Slide.count({
      where: sequelize.literal("image_path LIKE '/uploads/templates/Users/%'")
    });
    
    if (remainingBadPaths > 0) {
      console.log(`${colors.red}Attention: ${remainingBadPaths} diapositives ont encore des chemins problématiques.${colors.reset}`);
    } else {
      console.log(`${colors.green}Tous les chemins d'images sont maintenant propres.${colors.reset}`);
    }
    
    // Déplacer physiquement les fichiers vers la bonne destination
    console.log(`\n${colors.blue}====== DÉPLACEMENT DES FICHIERS PHYSIQUES ======${colors.reset}`);
    console.log(`${colors.yellow}Ce script ne déplace pas les fichiers physiques.${colors.reset}`);
    console.log(`${colors.yellow}Vous devrez peut-être les déplacer manuellement ou créer un script séparé pour cette tâche.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Erreur lors de la correction des chemins: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

fixDoublePaths();
