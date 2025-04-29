/**
 * Script de test pour uploader un fichier PPTX existant
 * et vérifier le processus complet de conversion et stockage
 */

const fs = require('fs');
const path = require('path');
const { convertPptxToImages } = require('./backend/utils/pptxConverter');
const { Template, Slide } = require('./backend/models');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });

// Chemin du fichier PPTX de test
const TEST_PPTX_PATH = '/Users/michaeltenenbaum/Downloads/ppt-template-manager/frontend/1745948540175-732905162.pptx';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testUploadExisting() {
  console.log(`${colors.blue}=== TEST D'UPLOAD AVEC FICHIER PPTX EXISTANT ===${colors.reset}`);
  
  try {
    // Vérifier l'existence du fichier
    if (!fs.existsSync(TEST_PPTX_PATH)) {
      console.error(`${colors.red}Le fichier PPTX n'existe pas: ${TEST_PPTX_PATH}${colors.reset}`);
      process.exit(1);
    }
    console.log(`${colors.green}Fichier PPTX trouvé: ${TEST_PPTX_PATH}${colors.reset}`);
    
    // Créer un template de test
    const template = await Template.create({
      user_id: 1,
      name: 'Template Test Upload ' + Date.now(),
      description: 'Créé automatiquement pour tester le processus d\'upload'
    });
    console.log(`${colors.green}Template créé avec ID: ${template.id}${colors.reset}`);
    
    // Convertir le PPTX en images
    console.log(`${colors.yellow}Conversion du PPTX en cours...${colors.reset}`);
    const uploadDir = path.join(__dirname, 'backend/uploads/templates');
    const templateDir = `test_upload_${Date.now()}`;
    const imagePaths = await convertPptxToImages(TEST_PPTX_PATH, uploadDir, templateDir);
    
    console.log(`${colors.green}Conversion réussie! ${imagePaths.length} diapositives générées.${colors.reset}`);
    console.log(`${colors.cyan}Première diapositive:${colors.reset}`);
    console.log(imagePaths[0]);
    
    // Créer les entrées de diapositives dans la base de données
    console.log(`${colors.yellow}Enregistrement des diapositives en base de données...${colors.reset}`);
    const slidePromises = imagePaths.map(({ slideIndex, image_path, width, height }) => {
      return Slide.create({
        template_id: template.id,
        slide_index: slideIndex,
        image_path: image_path,
        thumb_path: image_path
      });
    });
    
    const slides = await Promise.all(slidePromises);
    console.log(`${colors.green}${slides.length} diapositives enregistrées en base de données.${colors.reset}`);
    
    console.log(`${colors.blue}=== TEST TERMINÉ AVEC SUCCÈS ===${colors.reset}`);
    console.log(`${colors.yellow}Pour visualiser ce template, accédez à:${colors.reset}`);
    console.log(`${colors.cyan}http://localhost:4322/templates/fill/${template.id}${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Erreur lors du test:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

testUploadExisting();
