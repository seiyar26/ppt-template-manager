// API serverless pour Vercel - Endpoint de vu00e9rification de santu00e9
require('dotenv').config();

// Configuration BDD
const sequelize = require('../config/database');

// Initialisation BDD si nu00e9cessaire
let isDbInitialized = false;
const initDb = async () => {
  if (!isDbInitialized) {
    try {
      await sequelize.authenticate();
      console.log('Connexion u00e0 la BDD u00e9tablie avec succu00e8s');
      isDbInitialized = true;
      return true;
    } catch (error) {
      console.error('Erreur de connexion u00e0 la BDD:', error);
      return false;
    }
  }
  return isDbInitialized;
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Verify method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ppt-template-manager',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime() + ' seconds',
    server: 'Vercel Serverless',
    checks: {}
  };
  
  // Vu00e9rification de la base de donnu00e9es
  try {
    const dbStatus = await initDb();
    if (dbStatus) {
      healthData.checks.database = { status: 'ok' };
    } else {
      healthData.checks.database = { status: 'error', message: 'Database connection failed' };
      healthData.status = 'warning';
    }
  } catch (err) {
    healthData.checks.database = { status: 'error', message: err.message };
    healthData.status = 'warning';
  }
  
  // Vu00e9rification de Supabase
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    healthData.checks.supabase = { status: 'ok' };
  } else {
    healthData.checks.supabase = { status: 'warning', message: 'Configuration incomplete' };
    healthData.status = 'warning';
  }
  
  res.json(healthData);
};
