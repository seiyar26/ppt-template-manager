const express = require('express');
const { register, login, getCurrentUser } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user
router.get('/me', auth, getCurrentUser);

module.exports = router;