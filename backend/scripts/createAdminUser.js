const sequelize = require('../config/database');
const { User } = require('../models');
require('dotenv').config({ path: '../.env' });

const createAdminUser = async () => {
  try {
    // Utiliser directement l'interface de base de données pour éviter les hooks
    const result = await sequelize.query(
      `INSERT INTO "Users" (email, password_hash, name, created_at, updated_at) 
       VALUES ('admin@example.com', '$2b$10$1NxVBiGY8/R3pXUUO98pruUYbSKfAGqwVdWYR0hpx7bdfPkNwRgJO', 'Admin User', NOW(), NOW()) 
       RETURNING id, email, name;`,
      { type: sequelize.QueryTypes.INSERT }
    );
    
    console.log('Admin user created successfully with ID:', result[0][0].id);
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
