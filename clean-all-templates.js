/**
 * Script pour supprimer tous les templates existants et leurs diapositives associées
 * Cette opération est irréversible, donc utilisée uniquement en environnement de développement
 */

// Charger les variables d'environnement avant d'importer les modèles
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });

// Importer les modèles et la connexion à la base de données
const { Template, Slide, Field } = require('./backend/models');
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

async function cleanAllTemplates() {
  try {
    console.log(`${colors.blue}====== SUPPRESSION DE TOUS LES TEMPLATES ======${colors.reset}`);
    
    // Vérifier la connexion à la base de données
    try {
      await sequelize.authenticate();
      console.log(`${colors.green}Connexion à la base de données établie avec succès.${colors.reset}`);
    } catch (dbError) {
      console.error(`${colors.red}Erreur de connexion à la base de données: ${dbError.message}${colors.reset}`);
      return;
    }
    
    // Compter les templates et slides existants
    const templateCount = await Template.count();
    const slideCount = await Slide.count();
    const fieldCount = await Field.count();
    
    console.log(`${colors.yellow}État actuel de la base de données:${colors.reset}`);
    console.log(`  ${colors.yellow}Templates: ${templateCount}${colors.reset}`);
    console.log(`  ${colors.yellow}Diapositives: ${slideCount}${colors.reset}`);
    console.log(`  ${colors.yellow}Champs: ${fieldCount}${colors.reset}`);
    
    // Confirmation finale
    console.log(`\n${colors.red}ATTENTION: Cette opération va supprimer TOUS les templates et leurs données associées.${colors.reset}`);
    console.log(`${colors.red}Cette action est IRRÉVERSIBLE.${colors.reset}`);
    
    // Supprimer en respectant les dépendances
    console.log(`\n${colors.blue}Suppression des données...${colors.reset}`);
    
    // 1. Supprimer d'abord les slides (pour respecter les contraintes de clé étrangère)
    const deletedSlides = await Slide.destroy({ where: {} });
    console.log(`${colors.green}${deletedSlides} diapositives supprimées.${colors.reset}`);
    
    // 2. Supprimer les champs
    const deletedFields = await Field.destroy({ where: {} });
    console.log(`${colors.green}${deletedFields} champs supprimés.${colors.reset}`);
    
    // 3. Supprimer les templates
    const deletedTemplates = await Template.destroy({ where: {} });
    console.log(`${colors.green}${deletedTemplates} templates supprimés.${colors.reset}`);
    
    // Vérification finale
    const remainingTemplates = await Template.count();
    const remainingSlides = await Slide.count();
    const remainingFields = await Field.count();
    
    console.log(`\n${colors.blue}État final de la base de données:${colors.reset}`);
    console.log(`  ${colors.blue}Templates: ${remainingTemplates}${colors.reset}`);
    console.log(`  ${colors.blue}Diapositives: ${remainingSlides}${colors.reset}`);
    console.log(`  ${colors.blue}Champs: ${remainingFields}${colors.reset}`);
    
    console.log(`\n${colors.green}Nettoyage terminé avec succès.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Erreur lors du nettoyage: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// Execution du script
cleanAllTemplates();
