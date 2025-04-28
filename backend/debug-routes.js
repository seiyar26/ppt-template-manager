const express = require('express');
const app = express();
const listEndpoints = require('express-list-endpoints');

// Importez les routes de votre application
const authRoutes = require('./routes/authRoutes');
const templateRoutes = require('./routes/templateRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const exportRoutes = require('./routes/exportRoutes');

// Enregistrez les routes
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/exports', exportRoutes);

// Listez les endpoints
const endpoints = listEndpoints(app);
console.log(JSON.stringify(endpoints, null, 2));