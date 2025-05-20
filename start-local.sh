#!/bin/bash

# Fonction de nettoyage pour arrêter les processus au Ctrl+C
cleanup() {
  echo "Arrêt des services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Gestionnaire d'erreurs
handle_error() {
  echo "\033[0;31mERREUR: $1\033[0m"
  exit 1
}

# Vérifier PostgreSQL
echo "Vérification de PostgreSQL..."
if ! brew services list | grep -q "postgresql.*started"; then
  echo "PostgreSQL n'est pas démarré, tentative de démarrage..."
  brew services start postgresql@14 || echo "⚠️ Impossible de démarrer PostgreSQL. Vérifiez l'espace disque et les permissions."
  sleep 2
fi

# Variables d'environnement
export PORT=8080
export REACT_APP_API_URL=http://localhost:8080/api
export REACT_APP_API_PORT=8080
export CONVERT_API_SECRET=secret_KpZ4EmWSJCFOLYyX
export JWT_SECRET=your_jwt_secret_key_here

# Récupérer le nom d'utilisateur système pour PostgreSQL (sur macOS, l'utilisateur système est souvent l'utilisateur par défaut)
# Utiliser l'utilisateur courant pour PostgreSQL
DB_USER=$(whoami)
export DATABASE_URL=postgres://${DB_USER}:${DB_USER}@localhost:5432/ppt_template_manager
echo "Utilisation de l'utilisateur PostgreSQL: ${DB_USER}"

# Création de la base de données si nécessaire
echo "Vérification de la base de données..."
psql -c "SELECT 1 FROM pg_database WHERE datname='ppt_template_manager'" | grep -q 1 || \
  psql -c "CREATE DATABASE ppt_template_manager;" || \
  echo "⚠️ Impossible de créer la base de données. Les services pourraient ne pas fonctionner correctement."

# Démarrage du backend
echo "\033[0;34mDémarrage du backend...\033[0m"
cd "$(dirname "$0")/backend"
npm start & 
BACKEND_PID=$!

echo "Backend démarré avec PID: $BACKEND_PID"
echo "Attente du démarrage du serveur backend..."
sleep 5

# Vérification que le backend répond
echo "Test de connexion au backend..."
if curl -s http://localhost:$PORT/api/health > /dev/null; then
  echo "✅ Backend opérationnel!"
else
  echo "⚠️ Le backend ne répond pas. Vérifiez les journaux pour plus de détails."
fi

# Démarrage du frontend
echo "\033[0;34mDémarrage du frontend...\033[0m"
cd "$(dirname "$0")/frontend"
npm start &
FRONTEND_PID=$!
echo "Frontend démarré avec PID: $FRONTEND_PID"

# Interception du signal d'interruption
trap cleanup SIGINT SIGTERM

echo "\033[0;32m✅ Tous les services sont démarrés:\033[0m"
echo "📋 Backend: http://localhost:$PORT"
echo "🖥️ Frontend: http://localhost:4322 (défini dans votre package.json)"
echo "Pour arrêter tous les services, appuyez sur Ctrl+C"

# Maintenir le script en exécution
wait $BACKEND_PID $FRONTEND_PID
