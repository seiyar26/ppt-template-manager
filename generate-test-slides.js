/**
 * Script de génération de diapositives de test
 * Ce script crée des diapositives de test et les enregistre en base de données
 * pour permettre le développement même si la conversion PPTX ne fonctionne pas
 */

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Connexion à la base de données
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
  dialectOptions: {
    ssl: process.env.DATABASE_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Modèles
const Template = sequelize.define('Template', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: Sequelize.STRING,
  description: Sequelize.TEXT,
  user_id: Sequelize.INTEGER,
  file_path: Sequelize.STRING,
  original_filename: Sequelize.STRING,
  file_url: Sequelize.STRING,
  created_at: Sequelize.DATE,
  updated_at: Sequelize.DATE
}, { tableName: 'templates', underscored: true, timestamps: true });

const Slide = sequelize.define('Slide', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  template_id: Sequelize.INTEGER,
  slide_index: Sequelize.INTEGER,
  image_path: Sequelize.STRING,
  image_url: Sequelize.STRING,
  width: Sequelize.INTEGER,
  height: Sequelize.INTEGER,
  thumbnail_path: Sequelize.STRING,
  created_at: Sequelize.DATE,
  updated_at: Sequelize.DATE
}, { tableName: 'slides', underscored: true, timestamps: true });

// Relations
Template.hasMany(Slide, { foreignKey: 'template_id' });
Slide.belongsTo(Template, { foreignKey: 'template_id' });

// Création d'une image simple
const createPlaceholderImage = (width, height, color, text) => {
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${color}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle" fill="white">${text}</text>
    </svg>
  `;
};

// Fonction principale
const generateTestSlides = async (templateId) => {
  try {
    // Vérifier si le template existe
    const template = await Template.findByPk(templateId);
    if (!template) {
      console.error(`Template ${templateId} non trouvé.`);
      return;
    }

    console.log(`Génération de diapositives de test pour le template ${templateId}: ${template.name}`);

    // Créer le répertoire pour les diapositives
    const uploadDir = path.join(__dirname, 'backend', 'uploads', 'templates', templateId.toString());
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Nombre de diapositives à générer
    const numSlides = 3;
    const colors = ['#3498db', '#e74c3c', '#2ecc71'];
    
    // Supprimer les diapositives existantes
    await Slide.destroy({ where: { template_id: templateId } });
    
    console.log(`Suppression des diapositives existantes terminée.`);

    // Créer les nouvelles diapositives
    for (let i = 0; i < numSlides; i++) {
      const slideIndex = i;
      const imageName = `slide_${slideIndex}.svg`;
      const imagePath = path.join(uploadDir, imageName);
      
      // Créer une image SVG simple
      const svgContent = createPlaceholderImage(
        800, 600, 
        colors[i % colors.length], 
        `Diapositive ${slideIndex + 1}`
      );
      
      // Écrire l'image sur le disque
      fs.writeFileSync(imagePath, svgContent);
      
      // Chemin relatif pour accès via le backend
      const relativeImagePath = `/uploads/templates/${templateId}/slide_${slideIndex}.svg`;
      
      // Créer l'entrée en base de données
      await Slide.create({
        template_id: templateId,
        slide_index: slideIndex,
        image_path: relativeImagePath,
        image_url: '',
        width: 800,
        height: 600,
        thumbnail_path: relativeImagePath,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log(`Diapositive ${slideIndex + 1} créée: ${relativeImagePath}`);
    }
    
    console.log(`${numSlides} diapositives de test générées avec succès pour le template ${templateId}.`);
  } catch (error) {
    console.error('Erreur lors de la génération des diapositives de test:', error);
  } finally {
    await sequelize.close();
  }
};

// Exécution du script
const templateId = process.argv[2];
if (!templateId) {
  console.error('Veuillez spécifier un ID de template: node generate-test-slides.js [ID]');
  process.exit(1);
}

generateTestSlides(Number(templateId))
  .then(() => {
    console.log('Script terminé.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
  });
