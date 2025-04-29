const sequelize = require('../config/database');

// Fonction asynchrone pour tester la connexion
async function testDatabaseConnection() {
  console.log('=== DIAGNOSTIC DE LA CONNEXION À LA BASE DE DONNÉES ===');
  console.log(`Heure du test: ${new Date().toISOString()}`);
  console.log(`ENV: ${process.env.NODE_ENV || 'non défini'}`);
  
  // Afficher les informations de configuration (masquées)
  if (process.env.DATABASE_URL) {
    const maskedUrl = process.env.DATABASE_URL.replace(/:(\/\/[^:]+):[^@]+@/, ':$1:***@');
    console.log(`DATABASE_URL configurée: ${maskedUrl}`);
  } else {
    console.log('DATABASE_URL non configurée');
    console.log(`DB_HOST: ${process.env.DB_HOST || 'non défini'}`);
    console.log(`DB_PORT: ${process.env.DB_PORT || 'non défini'}`);
    console.log(`DB_USER: ${process.env.DB_USER || 'non défini'}`);
    console.log(`DB_NAME: ${process.env.DB_NAME || 'non défini'}`);
    console.log('DB_PASSWORD: ' + (process.env.DB_PASSWORD ? '***' : 'non défini'));
  }
  
  try {
    console.log('\nTentative de connexion à PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ SUCCÈS: Connexion établie avec la base de données PostgreSQL.');
    
    // Test de lecture/écriture basique pour confirmer les autorisations
    console.log('\nTentative de lecture/écriture...');
    await sequelize.query('CREATE TABLE IF NOT EXISTS diagnostic_test (id SERIAL PRIMARY KEY, test_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    await sequelize.query('INSERT INTO diagnostic_test (test_timestamp) VALUES (CURRENT_TIMESTAMP)');
    const [results] = await sequelize.query('SELECT * FROM diagnostic_test ORDER BY id DESC LIMIT 1');
    console.log(`✅ SUCCÈS: Opération de lecture/écriture réussie. Dernier enregistrement: ${JSON.stringify(results[0])}`);
    
    // Nettoyage si nécessaire (décommenter pour nettoyer)
    // await sequelize.query('DROP TABLE diagnostic_test');
    
    console.log('\n=== RÉSUMÉ DU DIAGNOSTIC ===');
    console.log('✅ Connexion PostgreSQL: Réussie');
    console.log('✅ Opérations de lecture/écriture: Réussies');
    console.log('✅ Privilèges d\'accès: Confirmés');
    console.log('\nLa base de données est correctement configurée et accessible.');
    
    // Fermer la connexion proprement
    await sequelize.close();
    return true;
  } catch (error) {
    console.error('\n❌ ÉCHEC: La connexion à la base de données a échoué.');
    console.error(`Message d'erreur: ${error.message}`);
    
    // Analyse du problème selon le type d'erreur
    if (error.original) {
      console.error(`Code d'erreur: ${error.original.code}`);
      
      if (error.original.code === 'ECONNREFUSED') {
        console.error('\nDIAGNOSTIC: Le serveur PostgreSQL n\'est pas accessible.');
        console.error('\nSOLUTIONS RECOMMANDÉES:');
        console.error('1. Vérifiez que PostgreSQL est démarré:');
        console.error('   → brew services start postgresql');
        console.error('2. Vérifiez que le port est correct (par défaut: 5432)');
        console.error('3. Si vous utilisez Docker, assurez-vous que le service PostgreSQL est accessible');
        console.error('   → docker-compose ps');
      } else if (error.original.code === 'ENOTFOUND') {
        console.error('\nDIAGNOSTIC: Le nom d\'hôte spécifié est introuvable.');
        console.error('\nSOLUTIONS RECOMMANDÉES:');
        console.error('1. Vérifiez que le nom d\'hôte dans l\'URL de connexion est correct');
        console.error('2. Utilisez "localhost" ou "127.0.0.1" pour les connexions locales');
      } else if (error.original.code === '28P01') {
        console.error('\nDIAGNOSTIC: Authentification échouée (identifiants incorrects).');
        console.error('\nSOLUTIONS RECOMMANDÉES:');
        console.error('1. Vérifiez le nom d\'utilisateur et le mot de passe dans l\'URL de connexion');
        console.error('2. Confirmez que l\'utilisateur existe dans PostgreSQL:');
        console.error('   → psql -c "\\du"');
      } else if (error.original.code === '3D000') {
        console.error('\nDIAGNOSTIC: La base de données spécifiée n\'existe pas.');
        console.error('\nSOLUTIONS RECOMMANDÉES:');
        console.error('1. Créez la base de données:');
        console.error('   → psql -c "CREATE DATABASE ppt_template_manager;"');
      }
    }
    
    console.error('\n=== RÉSUMÉ DU DIAGNOSTIC ===');
    console.error('❌ Connexion PostgreSQL: Échouée');
    console.error(`❌ Raison: ${error.message}`);
    console.error('\nVoir les instructions ci-dessus pour résoudre le problème.');
    
    return false;
  }
}

// Exécution du test
testDatabaseConnection()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur non gérée:', err);
    process.exit(1);
  });
