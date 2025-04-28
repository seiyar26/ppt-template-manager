const { User } = require('../models');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' });

const createDemoUser = async () => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: 'demo@example.com' } });
    
    if (existingUser) {
      console.log('Demo user already exists');
      process.exit(0);
    }
    
    // Create demo user
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@example.com',
      password_hash: await bcrypt.hash('password123', 10)
    });
    
    console.log('Demo user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating demo user:', error);
    process.exit(1);
  }
};

createDemoUser();
