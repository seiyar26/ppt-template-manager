#!/bin/bash

# Script de réinitialisation complète pour résoudre les problèmes de connexion
# Ce script nettoie tous les caches et reconstruits les applications

echo -e "\033[1;34m===== RÉINITIALISATION COMPLÈTE DES APPLICATIONS =====\033[0m"

# Chemin absolu vers le répertoire du projet
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "\033[0;36mRépertoire du projet: $PROJECT_DIR\033[0m"

# 1. Arrêter tous les processus en cours
echo -e "\n\033[1;33m1. Arrêt de tous les processus Node.js\033[0m"
pkill -f "node" || true
echo -e "\033[0;32m✓ Processus Node.js arrêtés\033[0m"

# 2. Nettoyer le cache et les builds du frontend
echo -e "\n\033[1;33m2. Nettoyage complet du frontend\033[0m"
rm -rf "$FRONTEND_DIR/node_modules/.cache"
rm -rf "$FRONTEND_DIR/build"
echo -e "\033[0;32m✓ Cache et build React nettoyés\033[0m"

# 3. Vérifier les références à l'ancien port (2324) dans les fichiers
echo -e "\n\033[1;33m3. Recherche et correction des références à l'ancien port\033[0m"
OLD_PORT="2324"
NEW_PORT="12000"

# Recherche de références à l'ancien port
OLD_PORT_REFS=$(grep -r "$OLD_PORT" --include="*.js" --include="*.json" --include="*.jsx" --include="*.env*" "$PROJECT_DIR" 2>/dev/null || echo "")

if [ -n "$OLD_PORT_REFS" ]; then
  echo -e "\033[0;31m! Références à l'ancien port trouvées:\033[0m"
  echo "$OLD_PORT_REFS"
  
  # Demande de correction automatique
  echo -e "\033[0;33mCorrection automatique des références à l'ancien port...\033[0m"
  
  # Remplacer l'ancien port par le nouveau dans les fichiers JS et JSON
  find "$PROJECT_DIR" -type f \( -name "*.js" -o -name "*.json" -o -name "*.jsx" -o -name ".env*" \) -exec sed -i '' "s/$OLD_PORT/$NEW_PORT/g" {} \; 2>/dev/null || true
  
  echo -e "\033[0;32m✓ Références à l'ancien port corrigées\033[0m"
else
  echo -e "\033[0;32m✓ Aucune référence à l'ancien port trouvée\033[0m"
fi

# 4. Forcer un fichier .env.development correct
echo -e "\n\033[1;33m4. Création d'un fichier .env.development correct\033[0m"
cat > "$FRONTEND_DIR/.env.development" << EOL
REACT_APP_API_URL=http://localhost:12000/api
REACT_APP_IMAGE_BASE_URL=http://localhost:12000
NODE_ENV=development
EOL
echo -e "\033[0;32m✓ Fichier .env.development créé avec les bonnes valeurs\033[0m"

# 5. Forcer un fichier .env.production correct
echo -e "\n\033[1;33m5. Création d'un fichier .env.production correct\033[0m"
cat > "$FRONTEND_DIR/.env.production" << EOL
REACT_APP_API_URL=http://localhost:12000/api
REACT_APP_IMAGE_BASE_URL=http://localhost:12000
NODE_ENV=production
EOL
echo -e "\033[0;32m✓ Fichier .env.production créé avec les bonnes valeurs\033[0m"

# 6. Réinstallation des dépendances frontend si besoin
echo -e "\n\033[1;33m6. Réinstallation des dépendances du frontend\033[0m"
if [ ! -d "$FRONTEND_DIR/node_modules" ] || [ ! -f "$FRONTEND_DIR/node_modules/.bin/react-scripts" ]; then
  echo "Installation des dépendances du frontend..."
  (cd "$FRONTEND_DIR" && npm install)
  echo -e "\033[0;32m✓ Dépendances frontend installées\033[0m"
else
  echo -e "\033[0;32m✓ Dépendances frontend déjà installées\033[0m"
fi

# 7. Réinstallation des dépendances backend si besoin
echo -e "\n\033[1;33m7. Réinstallation des dépendances du backend\033[0m"
if [ ! -d "$BACKEND_DIR/node_modules" ] || [ ! -f "$BACKEND_DIR/node_modules/.bin/nodemon" ]; then
  echo "Installation des dépendances du backend..."
  (cd "$BACKEND_DIR" && npm install)
  echo -e "\033[0;32m✓ Dépendances backend installées\033[0m"
else
  echo -e "\033[0;32m✓ Dépendances backend déjà installées\033[0m"
fi

# 8. Vérification des répertoires d'upload
echo -e "\n\033[1;33m8. Vérification des répertoires d'upload\033[0m"
bash fix-uploads.sh
echo -e "\033[0;32m✓ Répertoires d'upload vérifiés et réparés\033[0m"

# 9. Redémarrage des applications
echo -e "\n\033[1;34m===== REDÉMARRAGE DES APPLICATIONS =====\033[0m"
echo -e "Démarrage du backend..."
(cd "$PROJECT_DIR" && bash start-local.sh &)
echo -e "Attente de 5 secondes pour le démarrage du backend..."
sleep 5

echo -e "Démarrage du frontend sur le port 4325..."
(cd "$FRONTEND_DIR" && PORT=4325 npm start &)

echo -e "\n\033[1;32mApplication redémarrée. Accédez à:\033[0m"
echo -e "  - Frontend: \033[1;36mhttp://localhost:4325\033[0m"
echo -e "  - Backend: \033[1;36mhttp://localhost:12000/health\033[0m"

exit 0
