const ConvertApi = require('convertapi');
require('dotenv').config();

async function testConvertApi() {
  try {
    const apiSecret = process.env.CONVERT_API_SECRET;
    
    if (!apiSecret) {
      console.error('Erreur: CONVERT_API_SECRET non défini dans le fichier .env');
      process.exit(1);
    }
    
    console.log('Clé API trouvée, test de connexion...');
    const convertApi = new ConvertApi(apiSecret);
    
    // Récupérer les informations utilisateur
    const userInfo = await convertApi.getUser();
    console.log('Connexion réussie!');
    console.log('Informations utilisateur:');
    console.log('- Nom du compte:', userInfo.Username || 'Non spécifié');
    console.log('- Email:', userInfo.Email || 'Non spécifié');
    console.log('- Secondes restantes:', userInfo.SecondsLeft || 0);
    console.log('- Statut:', userInfo.Status || 'Inconnu');
    
    return true;
  } catch (error) {
    console.error('Erreur lors du test de connexion à ConvertAPI:', error.message);
    if (error.message.includes('Unauthorized')) {
      console.error('La clé API fournie semble être invalide ou expirée.');
    }
    return false;
  }
}

testConvertApi()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });
