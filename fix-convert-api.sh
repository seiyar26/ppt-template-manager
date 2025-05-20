#!/bin/bash

# Script de diagnostic et de réparation pour ConvertAPI
# Ce script vérifie et corrige les problèmes de configuration de l'API de conversion

echo -e "\033[1;34m===== DIAGNOSTIC ET RÉPARATION DE CONVERT API =====\033[0m"

# Chemin absolu vers le répertoire du projet
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
ENV_FILE="$BACKEND_DIR/.env"
BACKUP_FILE="$BACKEND_DIR/.env.backup.$(date +%Y%m%d%H%M%S)"

# Vérifier si le fichier .env existe
if [ ! -f "$ENV_FILE" ]; then
  echo -e "\033[0;31mERREUR: Fichier .env non trouvé dans $BACKEND_DIR\033[0m"
  echo "Création d'un fichier .env avec une structure de base..."
  cat > "$ENV_FILE" << EOL
PORT=${process.env.REACT_APP_API_PORT || 8080}
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here

# Base de données
DATABASE_URL=postgresql://postgres:password@localhost:5432/ppt_template_manager
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=ppt_template_manager
DB_PORT=5432

# ConvertAPI pour la conversion PPTX en images
CONVERT_API_SECRET=

# Autres variables
UPLOAD_DIR=uploads
EOL
  echo -e "\033[0;32mFichier .env créé avec succès\033[0m"
fi

# Faire une sauvegarde du fichier .env
cp "$ENV_FILE" "$BACKUP_FILE"
echo "Sauvegarde du fichier .env créée: $BACKUP_FILE"

# Vérifier si la clé API est configurée
CONVERT_API_SECRET=$(grep -E "^CONVERT_API_SECRET=" "$ENV_FILE" | cut -d= -f2)

if [ -z "$CONVERT_API_SECRET" ] || [ "$CONVERT_API_SECRET" = "" ]; then
  echo -e "\033[0;31mERREUR: Clé API ConvertAPI non configurée ou vide\033[0m"
  
  # Demander la clé API
  echo -e "\033[1;33mVeuillez entrer votre clé API ConvertAPI:\033[0m"
  read -p "> " NEW_API_KEY
  
  if [ -z "$NEW_API_KEY" ]; then
    echo -e "\033[0;31mAucune clé API fournie. Impossible de continuer.\033[0m"
    exit 1
  fi
  
  # Mettre à jour la clé API dans le fichier .env
  if grep -q "^CONVERT_API_SECRET=" "$ENV_FILE"; then
    # La variable existe, mettre à jour sa valeur
    sed -i '' "s|^CONVERT_API_SECRET=.*|CONVERT_API_SECRET=$NEW_API_KEY|" "$ENV_FILE"
  else
    # La variable n'existe pas, l'ajouter
    echo "CONVERT_API_SECRET=$NEW_API_KEY" >> "$ENV_FILE"
  fi
  
  echo -e "\033[0;32mClé API ConvertAPI mise à jour avec succès\033[0m"
else
  echo -e "\033[0;32mClé API ConvertAPI trouvée: ${CONVERT_API_SECRET:0:4}****\033[0m"
fi

# Tester la connexion à ConvertAPI
echo -e "\n\033[1;33mTest de connexion à ConvertAPI...\033[0m"

cat > "$PROJECT_DIR/test-convert-api.js" << EOL
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
EOL

# Exécuter le test
cd "$BACKEND_DIR" && node "$PROJECT_DIR/test-convert-api.js"
TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
  echo -e "\033[0;32mTest réussi: La connexion à ConvertAPI fonctionne correctement\033[0m"
else
  echo -e "\033[0;31mTest échoué: Impossible de se connecter à ConvertAPI\033[0m"
  echo -e "\033[1;33mSuggestions:\033[0m"
  echo "1. Vérifiez que votre clé API est correcte et active"
  echo "2. Assurez-vous que votre compte ConvertAPI dispose de crédits suffisants"
  echo "3. Vérifiez votre connexion internet"
  echo "4. Vérifiez si le service ConvertAPI est opérationnel: https://status.convertapi.com/"
fi

# Mise à jour du fichier pptxConverter.js pour un meilleur traitement des erreurs d'API
echo -e "\n\033[1;33mMise à jour du fichier pptxConverter.js pour un meilleur traitement des erreurs d'API...\033[0m"

cat > "$PROJECT_DIR/update-converter.js" << EOL
const fs = require('fs');
const path = require('path');

const converterPath = path.join(__dirname, 'backend', 'utils', 'pptxConverter.js');

if (!fs.existsSync(converterPath)) {
  console.error('Fichier pptxConverter.js non trouvé');
  process.exit(1);
}

let content = fs.readFileSync(converterPath, 'utf8');

// Ajouter une vérification explicite de la clé API
const apiCheckCode = \`
// Vérification explicite de la clé API
const CONVERT_API_SECRET = process.env.CONVERT_API_SECRET || '';
if (!CONVERT_API_SECRET) {
  console.error('ERREUR CRITIQUE: Variable CONVERT_API_SECRET non définie dans .env');
  // En production, nous lançons une erreur
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Configuration ConvertAPI manquante');
  }
}
const convertApi = new ConvertApi(CONVERT_API_SECRET);

// Vérification de la clé API au démarrage
(async () => {
  try {
    if (CONVERT_API_SECRET) {
      const userInfo = await convertApi.getUser();
      console.log('ConvertAPI connecté avec succès - Secondes disponibles:', userInfo.SecondsLeft);
    }
  } catch (error) {
    console.error('Erreur de connexion à ConvertAPI:', error.message);
  }
})();
\`;

// Remplacer l'initialisation existante
content = content.replace(
  /const convertApi = new ConvertApi\(.*\);/,
  apiCheckCode
);

// Ajouter un meilleur traitement des erreurs d'authentification
const errorHandlingCode = \`
  } catch (error) {
    console.error('Erreur de conversion PPTX vers images:', error);
    
    // Journaliser l'erreur avec le service de diagnostic
    conversionDiagnostic.logError(error, { filePath, templateId });
    
    // Détection spécifique des erreurs d'authentification
    if (error.message && (
        error.message.includes('Unauthorized') || 
        error.message.includes('credentials not set') ||
        error.message.includes('Code: 401') ||
        error.message.includes('Code: 4013')
      )) {
      console.error('ERREUR CRITIQUE: Problème d\\'authentification avec ConvertAPI');
      console.error('Veuillez vérifier votre clé API dans le fichier .env');
      
      // Notifier l'administrateur en production
      if (process.env.NODE_ENV === 'production') {
        // Code de notification (email, log, etc.)
      }
    }
    
    // Mode de secours: générer des images vides en développement
\`;

// Remplacer le bloc catch existant
content = content.replace(
  /\s+} catch \(error\) \{\s+console\.error\('Erreur de conversion PPTX vers images:', error\);(\s+\/\/ Journaliser l'erreur avec le service de diagnostic\s+conversionDiagnostic\.logError\(error, \{ filePath, templateId \}\);)?\s+\/\/ Mode de secours: générer des images vides en développement/,
  errorHandlingCode
);

fs.writeFileSync(converterPath, content, 'utf8');
console.log('Fichier pptxConverter.js mis à jour avec succès');
EOL

node "$PROJECT_DIR/update-converter.js"
UPDATE_RESULT=$?

if [ $UPDATE_RESULT -eq 0 ]; then
  echo -e "\033[0;32mFichier pptxConverter.js mis à jour avec succès\033[0m"
else
  echo -e "\033[0;31mÉchec de la mise à jour du fichier pptxConverter.js\033[0m"
fi

# Redémarrer le backend
echo -e "\n\033[1;33mRedémarrage du backend...\033[0m"
cd "$PROJECT_DIR" && bash hard-reset.sh backend
RESTART_RESULT=$?

if [ $RESTART_RESULT -eq 0 ]; then
  echo -e "\033[0;32mBackend redémarré avec succès\033[0m"
else
  echo -e "\033[0;31mÉchec du redémarrage du backend\033[0m"
fi

echo -e "\n\033[1;32mDiagnostic et réparation terminés\033[0m"
echo "Si les problèmes persistent, vérifiez le rapport complet généré par diagnose-all.sh"
echo "ou contactez le support technique."

exit 0
