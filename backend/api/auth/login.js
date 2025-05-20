// API serverless pour Vercel - Login endpoint

const jwt = require('jsonwebtoken');
const { User } = require('../../models');
require('dotenv').config();

// Configuration BDD
const sequelize = require('../../config/database');

// Initialisation BDD si nu00e9cessaire
let isDbInitialized = false;
const initDb = async () => {
  if (!isDbInitialized) {
    try {
      await sequelize.authenticate();
      console.log('Connexion u00e0 la BDD u00e9tablie avec succu00e8s');
      isDbInitialized = true;
    } catch (error) {
      console.error('Erreur de connexion u00e0 la BDD:', error);
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
    
    const { email, password } = req.body;
    console.log('Login attempt:', { email });
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    
    console.log('User found, checking password');
    // Check password
    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    
    console.log('Password matched, generating token');
    // Update last login
    user.last_login = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'ppt_template_manager_secret_key',
      { expiresIn: '7d' }
    );
    
    console.log('Login successful for:', email);
    res.json({
      message: 'Connexion ru00e9ussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
