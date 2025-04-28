const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware d'authentification
 * Vérifie que l'utilisateur est authentifié via un JWT valide
 * Extrait les informations utilisateur du token et les ajoute à l'objet req
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Vérifier si le token est présent dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Si aucun token n'est fourni, retourner une erreur
    if (!token) {
      return res.status(401).json({ message: 'Accès non autorisé, token manquant' });
    }
    
    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ppt_template_manager_secret_key');
      
      // Récupérer l'utilisateur depuis la base de données
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password_hash'] } // Ne pas inclure le mot de passe
      });
      
      // Si l'utilisateur n'existe pas, retourner une erreur
      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }
      
      // Ajouter les informations utilisateur à l'objet req
      req.user = user;
      next();
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      res.status(401).json({ message: 'Token invalide ou expiré' });
    }
  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { protect };