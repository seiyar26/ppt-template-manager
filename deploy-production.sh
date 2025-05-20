#!/bin/bash

# Script de déploiement complet et automatisé
# ==========================================
# Ce script déploie automatiquement le backend sur Railway et le frontend sur Vercel
# sans nécessiter d'intervention manuelle.

# Couleurs pour le terminal
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}=====================================================${NC}"
echo -e "${BOLD}${CYAN}  DÉPLOIEMENT AUTOMATIQUE DE L'APPLICATION COMPLÈTE   ${NC}"
echo -e "${BOLD}${CYAN}=====================================================${NC}\n"

echo -e "${YELLOW}Ce script va automatiquement déployer votre application complète.${NC}"
echo -e "${YELLOW}Veuillez patienter pendant que nous préparons tout...${NC}\n"

# Vérifier si la configuration de Git est disponible
if [[ -z $(git config --get user.email) ]]; then
  echo -e "${YELLOW}Configuration de Git...${NC}"
  git config --global user.email "auto-deploy@example.com"
  git config --global user.name "Auto Deployer"
  echo -e "${GREEN}Configuration Git terminée${NC}\n"
fi

# Vérifier si le dépôt est initialisé
if [ ! -d .git ]; then
  echo -e "${YELLOW}Initialisation du dépôt Git...${NC}"
  git init
  git add .
  git commit -m "Initial commit for deployment"
  echo -e "${GREEN}Dépôt Git initialisé${NC}\n"
fi

# Préparation du backend
echo -e "${BOLD}${CYAN}=== ÉTAPE 1: Préparation du backend ===${NC}"
echo -e "${YELLOW}Exécution du script de préparation...${NC}"
cd backend && node prepare-for-railway.js
cd ..
echo -e "${GREEN}Préparation du backend terminée${NC}\n"

# Installation des outils de déploiement
echo -e "${BOLD}${CYAN}=== ÉTAPE 2: Installation des outils de déploiement ===${NC}"

if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installation de Vercel CLI...${NC}"
    npm install -g vercel
    echo -e "${GREEN}Vercel CLI installé${NC}"
else
    echo -e "${GREEN}Vercel CLI est déjà installé${NC}"
fi

if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Installation de Railway CLI...${NC}"
    npm install -g @railway/cli
    echo -e "${GREEN}Railway CLI installé${NC}"
else
    echo -e "${GREEN}Railway CLI est déjà installé${NC}"
fi

echo -e "${GREEN}Tous les outils sont installés${NC}\n"

# Génération des tokens temporaires si nécessaire
TEMP_TOKEN_FILE=".deploy_tokens.tmp"
echo -e "${BOLD}${CYAN}=== ÉTAPE 3: Configuration des tokens d'API ===${NC}"

if [ ! -f "$TEMP_TOKEN_FILE" ]; then
    echo -e "${YELLOW}Création d'un fichier de tokens temporaire...${NC}"
    cat << EOF > $TEMP_TOKEN_FILE
# Fichier temporaire pour les tokens de déploiement
# Ce fichier sera supprimé après le déploiement
RAILWAY_TOKEN=your_railway_token
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
EOF
    
    echo -e "${RED}IMPORTANT: Veuillez éditer le fichier $TEMP_TOKEN_FILE avec vos tokens d'API${NC}"
    echo -e "${YELLOW}Pour obtenir votre token Railway: railway login --browserless${NC}"
    echo -e "${YELLOW}Pour obtenir votre token Vercel: vercel login${NC}"
    echo -e "${RED}Appuyez sur Entrée une fois les tokens configurés...${NC}"
    read -r
fi

# Chargement des tokens d'API
source $TEMP_TOKEN_FILE
echo -e "${GREEN}Tokens d'API chargés${NC}\n"

# Déploiement du backend sur Railway
echo -e "${BOLD}${CYAN}=== ÉTAPE 4: Déploiement du backend sur Railway ===${NC}"
echo -e "${YELLOW}Connexion à Railway...${NC}"

# Vérifier si la connexion à Railway est possible
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}Authentification à Railway avec token...${NC}"
    echo $RAILWAY_TOKEN | railway login --browserless
fi

echo -e "${YELLOW}Création du projet Railway...${NC}"
cd backend
railway init --name ppt-template-manager-backend

# Configuration des variables d'environnement sur Railway
echo -e "${YELLOW}Configuration des variables d'environnement...${NC}"
railway variables set PORT=8080
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=https://mbwurtmvdgmnrizxfouf.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3VydG12ZGdtbnJpenhmb3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MDU4MDAsImV4cCI6MjA2MzI4MTgwMH0.tNF11pL0MQQKhb3ejQiHjLhTCIGqabIhKu-WIdZvMDs
railway variables set SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3VydG12ZGdtbnJpenhmb3VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcwNTgwMCwiZXhwIjoyMDYzMjgxODAwfQ.Ojvhv2gXUNiv5NmdMniJyZKgY9d-MqjN3_3p9KIJFsY
railway variables set JWT_SECRET=ppt_template_manager_secret_key_prod
railway variables set CORS_ORIGIN=https://frontend-fivl16tuo-seiyar26s-projects.vercel.app
railway variables set CONVERT_API_SECRET=secret_q4Pjq2F9FCU9ypDJ

# Déploiement du backend
echo -e "${YELLOW}Déploiement du backend...${NC}"
railway up
BACKEND_URL=$(railway domain)
echo -e "${GREEN}Backend déployé avec succès sur: $BACKEND_URL${NC}\n"
cd ..

# Déploiement du frontend sur Vercel
echo -e "${BOLD}${CYAN}=== ÉTAPE 5: Déploiement du frontend sur Vercel ===${NC}"
echo -e "${YELLOW}Préparation du frontend...${NC}"

# Mise à jour de l'URL de l'API dans .env.production
cd frontend
echo "REACT_APP_API_URL=$BACKEND_URL" >> .env.production
echo -e "${GREEN}Variables d'environnement du frontend mises à jour${NC}"

# Vérifier si la connexion à Vercel est possible
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Authentification à Vercel avec token...${NC}"
    vercel login --token $VERCEL_TOKEN
fi

# Déploiement du frontend
echo -e "${YELLOW}Déploiement du frontend...${NC}"
vercel --prod --token $VERCEL_TOKEN
FRONTEND_URL=$(vercel --token $VERCEL_TOKEN --prod)
echo -e "${GREEN}Frontend déployé avec succès sur: $FRONTEND_URL${NC}\n"
cd ..

# Mise à jour de la variable CORS_ORIGIN côté backend avec l'URL du frontend
echo -e "${BOLD}${CYAN}=== ÉTAPE 6: Mise à jour de la configuration CORS ===${NC}"
echo -e "${YELLOW}Mise à jour de la configuration CORS avec l'URL du frontend...${NC}"
cd backend
railway variables set CORS_ORIGIN=$FRONTEND_URL
echo -e "${GREEN}Configuration CORS mise à jour${NC}\n"
cd ..

# Nettoyage
echo -e "${BOLD}${CYAN}=== ÉTAPE 7: Nettoyage final ===${NC}"
echo -e "${YELLOW}Suppression du fichier temporaire des tokens...${NC}"
rm -f $TEMP_TOKEN_FILE
echo -e "${GREEN}Nettoyage terminé${NC}\n"

# Résumé
echo -e "${BOLD}${GREEN}=====================================================${NC}"
echo -e "${BOLD}${GREEN}           DÉPLOIEMENT RÉUSSI !                      ${NC}"
echo -e "${BOLD}${GREEN}=====================================================${NC}\n"

echo -e "${CYAN}Backend URL: $BACKEND_URL${NC}"
echo -e "${CYAN}Frontend URL: $FRONTEND_URL${NC}\n"

echo -e "${YELLOW}Pour vérifier l'état de votre déploiement:${NC}"
echo -e "${CYAN}Backend: $BACKEND_URL/health${NC}"
echo -e "${CYAN}Frontend: Accédez simplement à l'URL du frontend${NC}\n"

echo -e "${BOLD}${GREEN}Votre application est maintenant en production !${NC}"
