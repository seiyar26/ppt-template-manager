const bcrypt = require('bcryptjs');
const { User } = require('../models');
require('dotenv').config();

// Fonction pour réinitialiser le mot de passe d'un utilisateur
async function resetPassword(email, plainPassword) {
  try {
    // Trouver l'utilisateur par email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.error(`Utilisateur avec l'email ${email} non trouvé.`);
      return false;
    }
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    // Mettre à jour directement dans la base de données pour éviter les hooks
    await User.update(
      { password_hash: hashedPassword },
      { where: { id: user.id }, individualHooks: false }
    );
    
    console.log(`Mot de passe réinitialisé avec succès pour ${email}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return false;
  }
}

// Réinitialiser les mots de passe
async function main() {
  // Réinitialiser le mot de passe administrateur
  await resetPassword('admin@example.com', 'admin123');
  
  // Réinitialiser le mot de passe de Bob
  await resetPassword('bob@example.com', 'bob123');
  
  console.log('Réinitialisation des mots de passe terminée.');
  process.exit(0);
}

main();
