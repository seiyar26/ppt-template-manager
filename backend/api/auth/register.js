// API serverless pour Vercel - Register endpoint

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

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Verify method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Initialize DB
    await initDb();
    
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create new user
    const user = await User.create({
      email,
      password_hash: password, // Will be hashed by the model hook
      name
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'ppt_template_manager_secret_key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};
