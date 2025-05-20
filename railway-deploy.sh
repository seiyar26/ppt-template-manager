#!/bin/bash

# Script de déploiement automatisé sur Railway
# Auteur: Cascade
# Date: 2025-05-20

# Couleurs pour le terminal
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}=== Déploiement automatisé sur Railway ===${NC}"
echo -e "${YELLOW}Ce script vous guide à travers le déploiement de votre application sur Railway${NC}\n"

# Vérifier si Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Installation de Railway CLI...${NC}"
    npm install -g @railway/cli
    echo -e "${GREEN}Railway CLI installé avec succès${NC}\n"
else
    echo -e "${GREEN}Railway CLI est déjà installé${NC}\n"
fi

# Assurer que le script prepare-for-railway.js a été exécuté
echo -e "${YELLOW}Exécution du script de préparation...${NC}"
cd backend && node prepare-for-railway.js
echo -e "${GREEN}Préparation terminée${NC}\n"

# Explication des étapes suivantes
echo -e "${BOLD}${CYAN}=== Étapes pour le déploiement sur Railway ===${NC}"
echo -e "${YELLOW}1. Connectez-vous à votre compte Railway${NC}"
echo -e "${YELLOW}2. Créez un nouveau projet${NC}"
echo -e "${YELLOW}3. Associez le projet au répertoire backend${NC}"
echo -e "${YELLOW}4. Configurez les variables d'environnement${NC}"
echo -e "${YELLOW}5. Déployez l'application${NC}\n"

# Connexion à Railway
echo -e "${BOLD}${CYAN}=== 1. Connexion à Railway ===${NC}"
echo -e "${YELLOW}Veuillez vous connecter à Railway...${NC}"
railway login
echo -e "${GREEN}Connexion réussie !${NC}\n"

# Création d'un nouveau projet
echo -e "${BOLD}${CYAN}=== 2. Création d'un projet Railway ===${NC}"
echo -e "${YELLOW}Voulez-vous créer un nouveau projet Railway ? [y/n] ${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${YELLOW}Création d'un nouveau projet...${NC}"
    railway init
    echo -e "${GREEN}Projet créé avec succès !${NC}\n"
else
    echo -e "${YELLOW}Veuillez sélectionner un projet existant...${NC}"
    railway link
    echo -e "${GREEN}Projet lié avec succès !${NC}\n"
fi

# Configuration des variables d'environnement
echo -e "${BOLD}${CYAN}=== 3. Configuration des variables d'environnement ===${NC}"
echo -e "${YELLOW}Ajout des variables d'environnement...${NC}"

# Variables à configurer
variables=(
    "PORT=8080" 
    "NODE_ENV=production" 
    "SUPABASE_URL=https://mbwurtmvdgmnrizxfouf.supabase.co" 
    "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3VydG12ZGdtbnJpenhmb3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MDU4MDAsImV4cCI6MjA2MzI4MTgwMH0.tNF11pL0MQQKhb3ejQiHjLhTCIGqabIhKu-WIdZvMDs" 
    "SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3VydG12ZGdtbnJpenhmb3VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcwNTgwMCwiZXhwIjoyMDYzMjgxODAwfQ.Ojvhv2gXUNiv5NmdMniJyZKgY9d-MqjN3_3p9KIJFsY"
    "JWT_SECRET=ppt_template_manager_secret_key_prod" 
    "CORS_ORIGIN=https://frontend-fivl16tuo-seiyar26s-projects.vercel.app"
    "CONVERT_API_SECRET=secret_q4Pjq2F9FCU9ypDJ"
)

for var in "${variables[@]}"; do
    key="${var%%=*}"
    value="${var#*=}"
    echo -e "${YELLOW}Ajout de la variable: ${key}${NC}"
    railway variables set "$key=$value"
done

echo -e "${GREEN}Variables d'environnement configurées !${NC}\n"

# Déploiement
echo -e "${BOLD}${CYAN}=== 4. Déploiement de l'application ===${NC}"
echo -e "${YELLOW}Voulez-vous déployer l'application maintenant ? [y/n] ${NC}"
read -r deploy
if [[ "$deploy" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${YELLOW}Déploiement en cours...${NC}"
    cd backend && railway up
    echo -e "${GREEN}Déploiement terminé !${NC}\n"
    
    # Récupérer l'URL de l'application
    echo -e "${YELLOW}Récupération de l'URL de l'application...${NC}"
    url=$(railway domain)
    
    echo -e "${BOLD}${GREEN}=== Déploiement réussi ! ===${NC}"
    echo -e "${CYAN}URL de votre application: ${url}${NC}"
    echo -e "${CYAN}N'oubliez pas de mettre à jour la variable REACT_APP_API_URL dans votre frontend Vercel !${NC}"
else
    echo -e "${YELLOW}Déploiement annulé. Vous pouvez déployer manuellement plus tard avec la commande:${NC}"
    echo -e "${CYAN}cd backend && railway up${NC}\n"
fi

echo -e "${BOLD}${GREEN}=== Processus de déploiement terminé ===${NC}"
