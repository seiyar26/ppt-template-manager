// Script de test pour les routes des catégories
const express = require('express');
const app = express();
const categoryRoutes = require('./routes/categoryRoutes');

// Configurer les middlewares essentiels
app.use(express.json());

// Enregistrer uniquement les routes des catégories pour le test
app.use('/api/categories', categoryRoutes);

// Démarrer un serveur de test
const PORT = 13000;
app.listen(PORT, () => {
  console.log(`Serveur de test démarré sur le port ${PORT}`);
  console.log(`Routes disponibles :`);
  console.log(`- GET http://localhost:${PORT}/api/categories`);
  console.log(`- POST http://localhost:${PORT}/api/categories`);
  console.log(`- PUT http://localhost:${PORT}/api/categories/reorder`);
  console.log(`- GET http://localhost:${PORT}/api/categories/:id`);
  console.log(`- PUT http://localhost:${PORT}/api/categories/:id`);
  console.log(`- DELETE http://localhost:${PORT}/api/categories/:id`);
});