/**
 * Script pour vérifier les diapositives dans la base de données
 */

// Charger les variables d'environnement avant d'importer les modèles
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });

// Importer les modèles après l'initialisation des variables d'environnement
const { Template, Slide } = require('./backend/models');
const sequelize = require('./backend/config/database');
const fs = require('fs');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function checkSlides() {
  try {
    console.log(`${colors.blue}====== VÉRIFICATION DES DIAPOSITIVES ======${colors.reset}`);
    
    // Vérifier la connexion à la base de données
    try {
      await sequelize.authenticate();
      console.log(`${colors.green}Connexion à la base de données établie avec succès.${colors.reset}`);
    } catch (dbError) {
      console.error(`${colors.red}Erreur de connexion à la base de données: ${dbError.message}${colors.reset}`);
      return;
    }
    
    // Récupérer tous les templates avec leurs diapositives
    const templates = await Template.findAll({
      include: [
        {
          model: Slide,
          separate: true,
          order: [['slide_index', 'ASC']]
        }
      ]
    });
    
    console.log(`\n${colors.blue}Templates dans la base de données: ${templates.length}${colors.reset}\n`);
    
    if (templates.length === 0) {
      console.log(`${colors.yellow}Aucun template trouvé dans la base de données.${colors.reset}`);
      return;
    }
    
    // Analyser chaque template et ses diapositives
    for (const template of templates) {
      const slideCount = template.Slides ? template.Slides.length : 0;
      const statusColor = slideCount > 0 ? colors.green : colors.red;
      
      console.log(`${colors.cyan}Template ID: ${template.id} | Nom: ${template.name}${colors.reset}`);
      console.log(`  ${statusColor}Nombre de diapositives: ${slideCount}${colors.reset}`);
      
      if (slideCount === 0) {
        console.log(`  ${colors.red}Problème: Ce template n'a aucune diapositive associée${colors.reset}`);
        continue;
      }
      
      // Vérifier les chemins d'images des premières diapositives
      const SLIDES_TO_CHECK = Math.min(3, slideCount);
      console.log(`  ${colors.yellow}Vérification des ${SLIDES_TO_CHECK} premières diapositives:${colors.reset}`);
      
      for (let i = 0; i < SLIDES_TO_CHECK; i++) {
        const slide = template.Slides[i];
        const imagePath = slide.image_path;
        
        console.log(`    ${colors.cyan}Diapo ${slide.slide_index}:${colors.reset}`);
        console.log(`      ${colors.yellow}Chemin en BDD: ${imagePath}${colors.reset}`);
        
        // Vérifier si le chemin commence par /uploads
        if (!imagePath.startsWith('/uploads')) {
          console.log(`      ${colors.red}Erreur: Le chemin ne commence pas par /uploads${colors.reset}`);
        }
        
        // Vérifier si le fichier existe physiquement
        const fullPath = path.join(__dirname, 'backend', imagePath);
        const fileExists = fs.existsSync(fullPath);
        
        if (fileExists) {
          console.log(`      ${colors.green}Le fichier existe${colors.reset}`);
        } else {
          console.log(`      ${colors.red}Erreur: Le fichier n'existe pas physiquement: ${fullPath}${colors.reset}`);
        }
        
        // Vérifier l'accès via URL
        const urlPath = `http://localhost:12000${imagePath}`;
        console.log(`      ${colors.yellow}URL d'accès: ${urlPath}${colors.reset}`);
      }
      
      console.log('----------------------------------------');
    }
    
    // Vérifier si des diapositives existent mais ne sont pas associées à un template
    const orphanedSlides = await Slide.findAll({
      where: {
        template_id: {
          [sequelize.Op.notIn]: templates.map(t => t.id)
        }
      }
    });
    
    if (orphanedSlides.length > 0) {
      console.log(`\n${colors.red}Diapositives orphelines (sans template valide): ${orphanedSlides.length}${colors.reset}`);
      for (const slide of orphanedSlides) {
        console.log(`  ${colors.red}Diapo ID: ${slide.id}, template_id: ${slide.template_id}, chemin: ${slide.image_path}${colors.reset}`);
      }
    } else {
      console.log(`\n${colors.green}Aucune diapositive orpheline détectée.${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Erreur lors de la vérification des diapositives: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// Exécuter la vérification
checkSlides();
