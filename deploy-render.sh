#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si curl est installé
if ! command -v curl &> /dev/null; then
  log_error "curl n'est pas installé. Veuillez l'installer."
  exit 1
fi

# Configuration
SERVICE_NAME="ppt-template-manager-backend"
OWNER_EMAIL="seiyar26@gmail.com"  # Remplacez par votre email
GIT_REPO="https://github.com/seiyar26/ppt-template-manager-app.git"  # Remplacez par votre repo
RENDER_API="https://api.render.com/v1"
RENDER_API_KEY=""  # À remplir si vous avez une clé API Render

# Vérifier si l'utilisateur a déjà une clé API Render
read -p "Avez-vous une clé API Render ? (o/n) " has_api_key

if [[ "$has_api_key" == "o" || "$has_api_key" == "O" ]]; then
  read -p "Entrez votre clé API Render : " RENDER_API_KEY
else
  log "Pour déployer via l'API Render, vous aurez besoin d'une clé API."
  log "Vous pouvez en créer une sur https://dashboard.render.com/account/api-keys"
  log "Nous allons procéder au déploiement manuel."
fi

# Si nous n'avons pas de clé API, procéder au déploiement manuel
if [[ -z "$RENDER_API_KEY" ]]; then
  log "Configuration pour déploiement manuel sur Render.com"
  
  # Créer un fichier de configuration pour Render
  cat > render.yaml << EOL
services:
  - type: web
    name: ppt-template-manager-backend
    env: node
    region: frankfurt  # ou choisissez une région plus proche de vous
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        value: https://mbwurtmvdgmnrizxfouf.supabase.co
      - key: SUPABASE_ANON_KEY
        value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3VydG12ZGdtbnJpenhmb3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MDU4MDAsImV4cCI6MjA2MzI4MTgwMH0.tNF11pL0MQQKhb3ejQiHjLhTCIGqabIhKu-WIdZvMDs
      - key: JWT_SECRET
        value: nvC+hGSPctG1LoQNoDfObSjR16DUkpwIN/D7ct4vS3A=
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: CORS_ORIGIN
        value: "*"
  
  - type: web
    name: ppt-template-manager-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: ./frontend/build
    envVars:
      - key: REACT_APP_API_URL
        value: https://ppt-template-manager-backend.onrender.com
EOL
  
  log_success "Fichier render.yaml créé avec succès"
  log "Instructions pour le déploiement manuel :"
  log "1. Allez sur https://dashboard.render.com/select-repo?type=blueprint"
  log "2. Connectez votre compte GitHub et sélectionnez votre repo"
  log "3. Render utilisera automatiquement le fichier render.yaml"
  log "4. Une fois déployé, mettez à jour l'URL du backend dans votre frontend"
  
  # Mettre à jour le frontend avec l'URL prévue du backend sur Render
  sed -i '' 's|REACT_APP_API_URL=.*|REACT_APP_API_URL=https://ppt-template-manager-backend.onrender.com|g' frontend/.env.production
  
  log_success "Configuration du frontend mise à jour pour utiliser le backend sur Render"
  log "Déployez maintenant le frontend sur Vercel :"
  log "cd frontend && vercel --prod"
  
  exit 0
fi

# Si nous avons une clé API, procéder au déploiement via l'API
log "Préparation du déploiement du backend via l'API Render..."

# Créer un service Web API
log "Création du service backend..."
BACKEND_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "web_service",
    "name": "'$SERVICE_NAME'",
    "owner_id": "'$OWNER_EMAIL'",
    "repo": "'$GIT_REPO'",
    "branch": "main",
    "autoDeploy": "yes",
    "rootDir": "backend",
    "buildCommand": "npm install",
    "startCommand": "npm start",
    "region": "frankfurt",
    "envVars": [
      {"key": "NODE_ENV", "value": "production"},
      {"key": "SUPABASE_URL", "value": "https://mbwurtmvdgmnrizxfouf.supabase.co"},
      {"key": "SUPABASE_ANON_KEY", "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3VydG12ZGdtbnJpenhmb3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MDU4MDAsImV4cCI6MjA2MzI4MTgwMH0.tNF11pL0MQQKhb3ejQiHjLhTCIGqabIhKu-WIdZvMDs"},
      {"key": "JWT_SECRET", "value": "nvC+hGSPctG1LoQNoDfObSjR16DUkpwIN/D7ct4vS3A="},
      {"key": "JWT_EXPIRES_IN", "value": "7d"},
      {"key": "CORS_ORIGIN", "value": "*"}
    ]
  }' \
  $RENDER_API/services)

# Vérifier la réponse
BACKEND_ID=$(echo $BACKEND_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
BACKEND_URL=$(echo $BACKEND_RESPONSE | grep -o '"service_url":"[^"]*"' | cut -d'"' -f4)

if [[ -z "$BACKEND_ID" ]]; then
  log_error "Échec de la création du service backend"
  log_error "Réponse : $BACKEND_RESPONSE"
  log "Passez au déploiement manuel comme indiqué ci-dessus"
  exit 1
fi

log_success "Service backend créé avec succès : $BACKEND_URL"

# Mise à jour de la configuration du frontend
log "Mise à jour de la configuration du frontend..."
sed -i '' "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$BACKEND_URL|g" frontend/.env.production

log_success "Configuration du frontend mise à jour pour utiliser le backend sur Render"

# Instructions pour déployer le frontend
log_success "Le backend a été configuré sur Render et le frontend a été mis à jour"
log "Pour déployer le frontend sur Vercel, exécutez :"
log "cd frontend && vercel --prod"

exit 0
