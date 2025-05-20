// API serverless pour Vercel - Récupération de l'utilisateur courant

const jwt = require('jsonwebtoken');
const { User } = require('../../models');
require('dotenv').config();

// Configuration BDD
const sequelize = require('../../config/database');

// Initialisation BDD si nécessaire
let isDbInitialized = false;
const initDb = async () => {
  if (!isDbInitialized) {
    try {
      await sequelize.authenticate();
      console.log('Connexion à la BDD établie avec succès');
      isDbInitialized = true;
    } catch (error) {
      console.error('Erreur de connexion à la BDD:', error);
      throw error;
    }
  }
};

// Middleware d'authentification pour Vercel serverless
const authenticate = async (req) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization header missing or invalid');
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new Error('Token missing');
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ppt_template_manager_secret_key');
    
    // Find user by id
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Verify method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Initialize DB
    await initDb();
    
    // Authenticate user
    let user;
    try {
      user = await authenticate(req);
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized', error: error.message });
    }
    
    // Return user info
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        last_login: user.last_login
      } 
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
