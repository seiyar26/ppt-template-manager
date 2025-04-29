/**
 * Script de test pour vérifier la validité de la clé API ConvertAPI
 * Ce script affiche des informations détaillées sur la clé et indique si elle est valide
 */

const ConvertApi = require('convertapi');

// Clé à tester (celle trouvée dans le fichier .env)
const API_KEY = 'secret_KpZ4EmWSJCFOLYyX';

async function testApiKey() {
  console.log('====== TEST DE LA CLÉ API CONVERTAPI ======');
  console.log(`Clé testée: ${API_KEY.substring(0, 10)}...`);
  
  try {
    // Initialiser ConvertAPI avec la clé
    const convertApi = new ConvertApi(API_KEY);
    
    // Tenter de récupérer les informations utilisateur
    console.log('Tentative de connexion à l\'API...');
    const userInfo = await convertApi.getUser();
    
    console.log('\n✅ CONNEXION RÉUSSIE!');
    console.log('\nInformations du compte:');
    console.log(`- Email: ${userInfo.Email || 'Non disponible'}`);
    console.log(`- Nom d'utilisateur: ${userInfo.Username || 'Non disponible'}`);
    console.log(`- Secondes restantes: ${userInfo.SecondsLeft || 0}`);
    console.log(`- Statut: ${userInfo.Status || 'Inconnu'}`);
    
    // Vérifier le quota
    if (userInfo.SecondsLeft && userInfo.SecondsLeft < 100) {
      console.log('\n⚠️  AVERTISSEMENT: Votre quota est presque épuisé!');
      console.log('Il vous reste moins de 100 secondes de conversion.');
      console.log('Envisagez de recharger votre compte pour éviter des interruptions de service.');
    }
    
    return true;
  } catch (error) {
    console.log('\n❌ ÉCHEC DE LA CONNEXION');
    console.log(`\nErreur: ${error.message}`);
    
    // Analyse détaillée de l'erreur
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      console.log('\nDiagnostic: La clé API semble être invalide ou expirée.');
      console.log('Solutions possibles:');
      console.log('1. Vérifiez que la clé a été correctement copiée (sans espaces supplémentaires)');
      console.log('2. Connectez-vous à votre compte ConvertAPI pour vérifier l\'état de la clé');
      console.log('3. Générez une nouvelle clé API si celle-ci a expiré');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.log('\nDiagnostic: Problème de connexion au serveur ConvertAPI.');
      console.log('Solutions possibles:');
      console.log('1. Vérifiez votre connexion internet');
      console.log('2. Le service ConvertAPI pourrait être temporairement indisponible');
    } else {
      console.log('\nDiagnostic: Erreur inconnue.');
      console.log('Solutions possibles:');
      console.log('1. Vérifiez la documentation ConvertAPI pour plus d\'informations');
      console.log('2. Contactez le support ConvertAPI');
    }
    
    return false;
  }
}

// Exécuter le test
testApiKey()
  .then(success => {
    console.log('\n====== TEST TERMINÉ ======');
    if (!success) {
      console.log('\nPour obtenir une nouvelle clé API:');
      console.log('1. Créez un compte sur https://www.convertapi.com/');
      console.log('2. Connectez-vous et accédez à votre tableau de bord');
      console.log('3. Copiez votre clé API secrète');
      console.log('4. Mettez à jour la variable CONVERT_API_SECRET dans le fichier .env');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erreur inattendue:', error);
    process.exit(1);
  });
