/**
 * Script pour générer des diapositives à partir d'un fichier PPTX existant
 * et les associer à un template existant
 */

// Charger les variables d'environnement
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });

// Importer les modules nécessaires
const { Template, Slide } = require('./backend/models');
const { convertPptxToImages } = require('./backend/utils/pptxConverter');
const sequelize = require('./backend/config/database');
const fs = require('fs');

// Configuration
const TEMPLATE_ID = 12; // ID du template à utiliser (modifiez selon vos besoins)
const PPTX_FILE_PATH = '/Users/michaeltenenbaum/Downloads/ppt-template-manager/frontend/1745948540175-732905162.pptx'; // Chemin du fichier PPTX

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function generateSlidesForTemplate() {
  try {
    console.log(`${colors.blue}====== GÉNÉRATION DES DIAPOSITIVES POUR TEMPLATE #${TEMPLATE_ID} ======${colors.reset}`);
    
    // Vérifier si le fichier PPTX existe
    if (!fs.existsSync(PPTX_FILE_PATH)) {
      console.error(`${colors.red}Le fichier PPTX n'existe pas: ${PPTX_FILE_PATH}${colors.reset}`);
      return;
    }
    console.log(`${colors.green}Fichier PPTX trouvé: ${PPTX_FILE_PATH}${colors.reset}`);
    
    // Vérifier la connexion à la base de données
    try {
      await sequelize.authenticate();
      console.log(`${colors.green}Connexion à la base de données établie avec succès.${colors.reset}`);
    } catch (dbError) {
      console.error(`${colors.red}Erreur de connexion à la base de données: ${dbError.message}${colors.reset}`);
      return;
    }
    
    // Vérifier si le template existe
    const template = await Template.findByPk(TEMPLATE_ID);
    if (!template) {
      console.error(`${colors.red}Le template avec ID=${TEMPLATE_ID} n'existe pas.${colors.reset}`);
      return;
    }
    console.log(`${colors.green}Template trouvé: ${template.name} (ID=${template.id})${colors.reset}`);
    
    // Supprimer les diapositives existantes pour ce template (s'il y en a)
    await Slide.destroy({ where: { template_id: template.id } });
    console.log(`${colors.yellow}Diapositives existantes supprimées pour ce template${colors.reset}`);
    
    // Convertir le fichier PPTX en images
    console.log(`${colors.yellow}Conversion du PPTX en images...${colors.reset}`);
    const uploadDir = path.join(__dirname, 'backend/uploads/templates');
    const templateDir = `template_${template.id}_${Date.now()}`;
    
    try {
      // Utiliser la fonction de conversion existante
      const images = await convertPptxToImages(PPTX_FILE_PATH, uploadDir, templateDir);
      console.log(`${colors.green}${images.length} diapositives converties en images${colors.reset}`);
      
      // Créer les entrées de diapositives dans la base de données
      console.log(`${colors.yellow}Enregistrement des diapositives en base de données...${colors.reset}`);
      const slidePromises = [];
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // Vérifier que le chemin d'image est correct
        let finalImagePath = image.image_path;
        console.log(`Diapo ${i}: Chemin d'image = ${finalImagePath}`);
        
        // S'assurer que le chemin commence par /uploads
        if (!finalImagePath.startsWith('/uploads')) {
          console.warn(`${colors.yellow}Correction du chemin d'image pour la diapo ${i}${colors.reset}`);
          const uploadIndex = finalImagePath.indexOf('/uploads');
          if (uploadIndex !== -1) {
            finalImagePath = finalImagePath.substring(uploadIndex);
          } else {
            // Si le chemin ne contient pas /uploads, construire un chemin par défaut
            finalImagePath = `/uploads/templates/${templateDir}/slide_${i}.jpg`;
          }
          console.log(`${colors.yellow}Nouveau chemin: ${finalImagePath}${colors.reset}`);
        }
        
        // Vérifier si le fichier existe physiquement
        const fullPath = path.join(__dirname, 'backend', finalImagePath);
        const directory = path.dirname(fullPath);
        
        // Créer le répertoire s'il n'existe pas
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
          console.log(`${colors.yellow}Répertoire créé: ${directory}${colors.reset}`);
        }
        
        // Si le chemin physique n'existe pas mais que nous avons un chemin d'origine, copier le fichier
        if (!fs.existsSync(fullPath) && image.path && fs.existsSync(image.path)) {
          try {
            fs.copyFileSync(image.path, fullPath);
            console.log(`${colors.green}Fichier copié: ${image.path} -> ${fullPath}${colors.reset}`);
          } catch (copyErr) {
            console.error(`${colors.red}Erreur lors de la copie du fichier: ${copyErr.message}${colors.reset}`);
          }
        }
        
        // Créer la diapositive
        slidePromises.push(
          Slide.create({
            template_id: template.id,
            slide_index: i,
            image_path: finalImagePath,
            thumb_path: finalImagePath,
            width: image.width || 800,
            height: image.height || 600
          })
        );
      }
      
      // Attendre que toutes les diapositives soient créées
      const slides = await Promise.all(slidePromises);
      console.log(`${colors.green}${slides.length} diapositives enregistrées en base de données${colors.reset}`);
      
      // Mettre à jour le template avec le nombre de diapositives
      await template.update({ slide_count: slides.length });
      
      console.log(`${colors.green}====== GÉNÉRATION TERMINÉE AVEC SUCCÈS ======${colors.reset}`);
      console.log(`${colors.cyan}Vous pouvez maintenant accéder au template via l'URL:${colors.reset}`);
      console.log(`${colors.cyan}http://localhost:4322/templates/fill/${template.id}${colors.reset}`);
      
    } catch (conversionError) {
      console.error(`${colors.red}Erreur lors de la conversion: ${conversionError.message}${colors.reset}`);
      console.error(conversionError);
    }
    
  } catch (error) {
    console.error(`${colors.red}Erreur générale: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// Exécuter la fonction
generateSlidesForTemplate();
