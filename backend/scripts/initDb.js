const sequelize = require('../config/database');
const { User, Template, Slide, Field } = require('../models');
const bcrypt = require('bcryptjs');

const initDb = async () => {
  try {
    // Sync all models with the database
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    // Create a demo user
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@example.com',
      password_hash: await bcrypt.hash('password123', 10)
    });
    console.log('Demo user created');

    console.log('Database initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDb();