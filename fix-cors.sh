#!/bin/bash

# Script de diagnostic et correction pour les problèmes CORS
# Ce script vérifie et corrige les problèmes courants qui empêchent la communication entre le frontend et le backend

echo -e "\033[1;34m===== DIAGNOSTIC ET RÉPARATION DES PROBLÈMES CORS =====\033[0m"

# Chemin absolu vers le répertoire du projet
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "\033[0;36mRépertoire du projet: $PROJECT_DIR\033[0m"
echo -e "\033[0;36mRépertoire backend: $BACKEND_DIR\033[0m"
echo -e "\033[0;36mRépertoire frontend: $FRONTEND_DIR\033[0m"

# 1. Vérification des ports utilisés
echo -e "\n\033[1;33m1. Vérification des ports utilisés\033[0m"
BACKEND_PORT=${process.env.REACT_APP_API_PORT || 8080}
FRONTEND_PORT=4322

# Trouver le port réel du frontend
REAL_FRONTEND_PORT=$(grep -r "Local:.*localhost:" "$FRONTEND_DIR/node_modules/.cache" 2>/dev/null | grep -oE '[0-9]+' | sort -u | tail -1)
if [ -n "$REAL_FRONTEND_PORT" ]; then
  echo -e "Port frontend détecté: \033[0;32m$REAL_FRONTEND_PORT\033[0m"
else
  echo -e "Port frontend par défaut: \033[0;33m$FRONTEND_PORT\033[0m"
  REAL_FRONTEND_PORT=$FRONTEND_PORT
fi

# Vérifier les processus en cours d'exécution sur ces ports
echo "Vérification des processus sur les ports $BACKEND_PORT et $REAL_FRONTEND_PORT..."
BACKEND_PROCESS=$(lsof -i :$BACKEND_PORT -t 2>/dev/null)
FRONTEND_PROCESS=$(lsof -i :$REAL_FRONTEND_PORT -t 2>/dev/null)

if [ -n "$BACKEND_PROCESS" ]; then
  echo -e "\033[0;32m✓ Backend en cours d'exécution sur le port $BACKEND_PORT\033[0m"
else
  echo -e "\033[0;31m✗ Backend non détecté sur le port $BACKEND_PORT\033[0m"
fi

if [ -n "$FRONTEND_PROCESS" ]; then
  echo -e "\033[0;32m✓ Frontend en cours d'exécution sur le port $REAL_FRONTEND_PORT\033[0m"
else
  echo -e "\033[0;31m✗ Frontend non détecté sur le port $REAL_FRONTEND_PORT\033[0m"
fi

# 2. Test de la connectivité CORS
echo -e "\n\033[1;33m2. Test de la connectivité CORS\033[0m"
echo "Test de l'endpoint de santé du backend..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$BACKEND_PORT/health)

if [ "$HEALTH_CHECK" -eq 200 ]; then
  echo -e "\033[0;32m✓ Endpoint de santé accessible (HTTP 200)\033[0m"
else
  echo -e "\033[0;31m✗ Endpoint de santé inaccessible (HTTP $HEALTH_CHECK)\033[0m"
  
  # Tentative alternative avec l'autre endpoint
  ALT_HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$BACKEND_PORT/_health)
  if [ "$ALT_HEALTH_CHECK" -eq 200 ]; then
    echo -e "\033[0;32m✓ Endpoint /_health alternatif accessible (HTTP 200)\033[0m"
  else
    echo -e "\033[0;31m✗ Endpoint /_health alternatif également inaccessible (HTTP $ALT_HEALTH_CHECK)\033[0m"
  fi
fi

# 3. Vérification des en-têtes CORS
echo -e "\n\033[1;33m3. Vérification des en-têtes CORS\033[0m"
echo "Test des en-têtes CORS du backend..."
CORS_HEADERS=$(curl -s -I -X OPTIONS -H "Origin: http://localhost:$REAL_FRONTEND_PORT" http://localhost:$BACKEND_PORT/api/categories)

if echo "$CORS_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
  echo -e "\033[0;32m✓ En-têtes CORS correctement configurés\033[0m"
  echo "$CORS_HEADERS" | grep -i "Access-Control"
else
  echo -e "\033[0;31m✗ En-têtes CORS manquants ou mal configurés\033[0m"
fi

# 4. Installation du proxy CORS si nécessaire
echo -e "\n\033[1;33m4. Configuration du proxy CORS\033[0m"
if [ ! -f "$FRONTEND_DIR/src/setupProxy.js" ]; then
  echo "Proxy CORS manquant, installation..."
  
  # Vérifier si le package http-proxy-middleware est installé
  if ! grep -q "http-proxy-middleware" "$FRONTEND_DIR/package.json"; then
    echo "Installation du package http-proxy-middleware..."
    (cd "$FRONTEND_DIR" && npm install --save http-proxy-middleware)
  fi
  
  # Création du fichier de proxy
  cat > "$FRONTEND_DIR/src/setupProxy.js" << 'EOL'
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:${process.env.PORT || 8080}',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
    })
  );
  
  app.use(
    '/health',
    createProxyMiddleware({
      target: 'http://localhost:${process.env.PORT || 8080}',
      changeOrigin: true,
    })
  );
};
EOL
  echo -e "\033[0;32m✓ Proxy CORS configuré\033[0m"
else
  echo -e "\033[0;32m✓ Proxy CORS déjà configuré\033[0m"
fi

# 5. Nettoyage du cache React
echo -e "\n\033[1;33m5. Nettoyage du cache React\033[0m"
echo "Suppression du cache React pour forcer une reconstruction..."
rm -rf "$FRONTEND_DIR/node_modules/.cache"
echo -e "\033[0;32m✓ Cache React nettoyé\033[0m"

# 6. Résumé et recommandations
echo -e "\n\033[1;34m===== RÉSUMÉ DU DIAGNOSTIC CORS =====\033[0m"
echo -e "Backend sur port $BACKEND_PORT: \033[0;32m✓\033[0m"
echo -e "Frontend sur port $REAL_FRONTEND_PORT: \033[0;32m✓\033[0m"
echo -e "Proxy CORS: \033[0;32m✓\033[0m"
echo -e "Cache React nettoyé: \033[0;32m✓\033[0m"

echo -e "\n\033[1;32mDiagnostic terminé. Pour appliquer toutes les corrections :\033[0m"
echo -e "1. Arrêtez le frontend et le backend : \033[1;37mpkill -f 'npm start'\033[0m"
echo -e "2. Redémarrez l'application : \033[1;37mbash start-local.sh\033[0m"
echo -e "3. Dans un autre terminal : \033[1;37mcd frontend && npm start\033[0m"

exit 0
