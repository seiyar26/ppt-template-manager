/**
 * Script de migration automatique pour Zeabur
 * S'exécute automatiquement au démarrage en environnement de production
 */
const sequelize = require('./database');
const { User, Template, Slide, Field, Category } = require('../models');
const bcrypt = require('bcrypt');

async function runMigrations() {
  try {
    console.log('Début de la migration automatique pour Zeabur...');
    
    // Synchroniser les modèles avec la base de données
    await sequelize.sync({ alter: true });
    console.log('Modèles synchronisés avec la base de données');
    
    // Vérifier si l'utilisateur admin existe
    const adminExists = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!adminExists) {
      // Créer l'utilisateur admin par défaut
      console.log('Création de l\'utilisateur admin par défaut...');
      await User.create({
        email: 'admin@example.com',
        password_hash: await bcrypt.hash('admin123', 10),
        name: 'Administrateur'
      });
      console.log('Utilisateur admin créé avec succès');
    } else {
      console.log('L\'utilisateur admin existe déjà');
    }
    
    // Vérifier si des catégories existent
    const categoryCount = await Category.count();
    
    if (categoryCount === 0) {
      // Créer des catégories par défaut
      console.log('Création des catégories par défaut...');
      await Category.bulkCreate([
        { name: 'Marketing' },
        { name: 'Ventes' },
        { name: 'Formation' },
        { name: 'Rapport' },
        { name: 'Projet' }
      ]);
      console.log('Catégories par défaut créées avec succès');
    } else {
      console.log(`${categoryCount} catégories existantes dans la base de données`);
    }
    
    console.log('Migration terminée avec succès');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Exporter la fonction pour l'utiliser dans server.js
module.exports = runMigrations;
