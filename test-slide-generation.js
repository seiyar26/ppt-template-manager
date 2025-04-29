/**
 * Script de test pour diagnostiquer la conversion PowerPoint et la génération de diapositives
 * Ce script teste la conversion d'un fichier PPTX spécifique et affiche des informations détaillées
 */

const fs = require('fs');
const path = require('path');
const { convertPptxToImages } = require('./backend/utils/pptxConverter');
const { Slide, Template } = require('./backend/models');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Sélectionner le fichier PPTX à tester - utiliser le dernier fichier uploadé
async function getLastUploadedFile() {
  try {
    const tempDir = path.join(__dirname, 'backend', 'uploads', 'temp');
    const files = fs.readdirSync(tempDir)
      .filter(file => file.endsWith('.pptx'))
      .map(file => ({
        name: file,
        path: path.join(tempDir, file),
        stat: fs.statSync(path.join(tempDir, file))
      }))
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

    if (files.length === 0) {
      throw new Error('Aucun fichier PPTX trouvé dans le répertoire des uploads');
    }

    console.log(`${colors.green}Fichier PPTX sélectionné pour le test: ${files[0].name}${colors.reset}`);
    return files[0].path;
  } catch (error) {
    console.error(`${colors.red}Erreur lors de la recherche du dernier fichier uploadé: ${error.message}${colors.reset}`);
    return null;
  }
}

// Tester la conversion PPTX vers images
async function testPptxConversion() {
  console.log(`\n${colors.blue}====== TEST DE CONVERSION PPTX VERS IMAGES ======${colors.reset}`);

  try {
    // Étape 1 : Trouver le dernier fichier PPTX uploadé
    const pptxPath = await getLastUploadedFile();
    if (!pptxPath) {
      return false;
    }

    console.log(`${colors.cyan}Chemin du fichier: ${pptxPath}${colors.reset}`);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(pptxPath)) {
      console.error(`${colors.red}Erreur: Le fichier ${pptxPath} n'existe pas${colors.reset}`);
      return false;
    }

    // Vérifier la taille du fichier
    const fileStats = fs.statSync(pptxPath);
    console.log(`${colors.cyan}Taille du fichier: ${Math.round(fileStats.size / 1024)} KB${colors.reset}`);

    // Étape 2 : Créer un template de test temporaire
    console.log(`\n${colors.cyan}Création d'un template de test...${colors.reset}`);
    const templateId = `test_${Date.now()}`;
    const templateDir = path.join(__dirname, 'backend', 'uploads', 'templates', templateId);
    
    // Créer le répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
      console.log(`${colors.green}Répertoire créé: ${templateDir}${colors.reset}`);
    }

    // Étape 3 : Tester la conversion
    console.log(`\n${colors.cyan}Lancement de la conversion...${colors.reset}`);
    
    // Activer le mode debug
    process.env.DEBUG_CONVERSION = 'true';
    
    console.time('Conversion');
    const images = await convertPptxToImages(pptxPath, templateId);
    console.timeEnd('Conversion');

    console.log(`\n${colors.green}Conversion terminée. ${images.length} images générées.${colors.reset}`);

    // Étape 4 : Vérifier les images générées
    console.log(`\n${colors.cyan}Vérification des images générées...${colors.reset}`);
    
    if (images.length === 0) {
      console.error(`${colors.red}Aucune image n'a été générée.${colors.reset}`);
      return false;
    }

    images.forEach((image, index) => {
      const exists = fs.existsSync(image.path);
      const size = exists ? fs.statSync(image.path).size : 0;
      
      console.log(`${exists ? colors.green : colors.red}Image ${index + 1}: ${image.path} | Existe: ${exists} | Taille: ${Math.round(size / 1024)} KB${colors.reset}`);
    });

    // Étape 5 : Tester la création manuelle d'entrées slide (sans utiliser le controller)
    console.log(`\n${colors.cyan}Test de création manuelle de slides dans la base de données...${colors.reset}`);
    
    // Créer les slides directement dans la base de données
    try {
      const sequelize = new Sequelize(process.env.DATABASE_URL, {
        logging: false
      });
      
      await sequelize.authenticate();
      console.log(`${colors.green}Connexion à la base de données établie.${colors.reset}`);

      // Trouver le dernier template créé
      const templates = await Template.findAll({
        order: [['created_at', 'DESC']],
        limit: 1
      });

      if (templates.length === 0) {
        console.error(`${colors.red}Aucun template trouvé dans la base de données.${colors.reset}`);
        return false;
      }

      const template = templates[0];
      console.log(`${colors.cyan}Template sélectionné: ID=${template.id}, Nom=${template.name}${colors.reset}`);

      // Supprimer les slides existants pour ce template
      const deletedCount = await Slide.destroy({
        where: { template_id: template.id }
      });
      console.log(`${colors.cyan}${deletedCount} slides existants supprimés.${colors.reset}`);

      // Créer des slides de test
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // Extraire la partie relative du chemin (pour l'URL)
        const imagePath = image.path;
        const uploadsDirIndex = imagePath.indexOf('/uploads/');
        const relativeImagePath = uploadsDirIndex >= 0 
          ? imagePath.substring(uploadsDirIndex) 
          : `/uploads/templates/${templateId}/slide_${i}.jpg`;
        
        const imageUrl = `/api${relativeImagePath}`;
        
        await Slide.create({
          template_id: template.id,
          slide_index: i,
          image_path: imagePath,
          image_url: imageUrl,
          width: image.width || 1280,
          height: image.height || 720,
          thumbnail_path: image.thumbnailPath || imagePath
        });
        
        console.log(`${colors.green}Slide ${i+1} créé avec succès (image_path: ${imagePath})${colors.reset}`);
      }

      // Vérifier que les slides ont été créés
      const slideCount = await Slide.count({
        where: { template_id: template.id }
      });
      
      console.log(`\n${colors.green}${slideCount} slides créés pour le template ID=${template.id}${colors.reset}`);
      
      return slideCount > 0;
    } catch (dbError) {
      console.error(`${colors.red}Erreur lors de l'interaction avec la base de données: ${dbError.message}${colors.reset}`);
      console.error(dbError);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}Erreur lors du test de conversion: ${error.message}${colors.reset}`);
    console.error(error);
    return false;
  }
}

// Exécution du test
testPptxConversion()
  .then(success => {
    if (success) {
      console.log(`\n${colors.green}✅ TEST RÉUSSI: Conversion PPTX et création de slides fonctionnelles${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ TEST ÉCHOUÉ: Problèmes détectés lors de la conversion ou création de slides${colors.reset}`);
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(`${colors.red}Erreur non gérée: ${error.message}${colors.reset}`);
    console.error(error);
    process.exit(1);
  });
