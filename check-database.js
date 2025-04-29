/**
 * Script pour vérifier l'état de la base de données et les diapositives associées aux templates
 */

// Charger les variables d'environnement avant d'importer les modèles
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });

// Importer les modèles après l'initialisation des variables d'environnement
const { Template, Slide } = require('./backend/models');
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

async function checkDatabase() {
  try {
    console.log(`${colors.blue}====== VÉRIFICATION DE LA BASE DE DONNÉES ======${colors.reset}`);
    
    // Vérifier la connexion à la base de données
    try {
      await sequelize.authenticate();
      console.log(`${colors.green}Connexion à la base de données établie avec succès.${colors.reset}`);
    } catch (dbError) {
      console.error(`${colors.red}Erreur de connexion à la base de données: ${dbError.message}${colors.reset}`);
      return;
    }
    
    // Récupérer tous les templates
    const templates = await Template.findAll({
      include: [
        {
          model: Slide,
          required: false
        }
      ]
    });
    
    console.log(`\n${colors.blue}Templates dans la base de données: ${templates.length}${colors.reset}\n`);
    
    // Afficher les informations de chaque template
    for (const template of templates) {
      const slideCount = template.Slides ? template.Slides.length : 0;
      const statusColor = slideCount > 0 ? colors.green : colors.red;
      
      console.log(`${colors.cyan}ID: ${template.id} | Nom: ${template.name}${colors.reset}`);
      console.log(`  ${statusColor}Diapositives: ${slideCount}${colors.reset}`);
      
      if (slideCount > 0) {
        console.log(`  ${colors.yellow}Première diapositive: ${colors.reset}`);
        console.log(`    ${colors.yellow}ID: ${template.Slides[0].id}${colors.reset}`);
        console.log(`    ${colors.yellow}Chemin: ${template.Slides[0].image_path}${colors.reset}`);
      }
      
      console.log('---------------------------------------');
    }
    
    // Vérifier les diapositives orphelines
    const totalSlides = await Slide.count();
    console.log(`\n${colors.blue}Total des diapositives dans la base de données: ${totalSlides}${colors.reset}`);
    
    const orphanSlides = await Slide.findAll({
      where: {
        template_id: {
          [sequelize.Op.notIn]: templates.map(t => t.id)
        }
      }
    });
    
    if (orphanSlides.length > 0) {
      console.log(`${colors.red}Diapositives orphelines (sans template associé): ${orphanSlides.length}${colors.reset}`);
    } else {
      console.log(`${colors.green}Aucune diapositive orpheline trouvée.${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Erreur lors de la vérification de la base de données: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkDatabase();
