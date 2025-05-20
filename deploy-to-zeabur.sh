#!/bin/bash

# Script d'automatisation de déploiement sur Zeabur
# Utilise l'API Zeabur directement pour contourner les limitations du CLI

set -e

# Couleurs pour les logs
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Configuration
PROJECT_NAME="ppt-template-manager"

# Variables à configurer
ZEABUR_TOKEN="YOUR_ZEABUR_TOKEN" # Remplacez par votre token d'API Zeabur

echo -e "${BLUE}=== Déploiement de PPT Template Manager sur Zeabur ===${NC}"

# 1. Vérifier le token Zeabur
if [ "$ZEABUR_TOKEN" = "YOUR_ZEABUR_TOKEN" ]; then
  echo -e "${RED}⚠️  Veuillez configurer votre token Zeabur dans le script${NC}"
  echo -e "${YELLOW}Vous pouvez générer un token sur https://dash.zeabur.com/settings${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Token Zeabur configuré${NC}"

# 2. Préparation du backend
echo -e "${BLUE}=== Préparation du backend ===${NC}"
cd backend
npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}⚠️  Erreur lors de l'installation des dépendances backend${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Dépendances backend installées${NC}"
cd ..

# 3. Préparation du frontend
echo -e "${BLUE}=== Préparation du frontend ===${NC}"
cd frontend
npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}⚠️  Erreur lors de l'installation des dépendances frontend${NC}"
  exit 1
fi
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}⚠️  Erreur lors du build frontend${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Frontend construit avec succès${NC}"
cd ..

# 4. Déploiement sur Zeabur via l'API
echo -e "${BLUE}=== Déploiement sur Zeabur ===${NC}"
echo -e "${YELLOW}Le déploiement sur Zeabur nécessite d'utiliser l'interface Web pour la configuration initiale.${NC}"
echo -e "${YELLOW}Veuillez accéder à https://dash.zeabur.com et suivre les étapes mentionnées dans la documentation.${NC}"

echo -e "\n${GREEN}=== Instructions pour le déploiement manuel sur Zeabur ===${NC}"
echo -e "1. Connectez-vous à votre compte Zeabur (https://dash.zeabur.com)"
echo -e "2. Créez un nouveau projet \"PPT Template Manager\""
echo -e "3. Sélectionnez \"Deploy from GitHub\" et connectez votre dépôt"
echo -e "4. Pour le backend:"
echo -e "   - Sélectionnez le dossier \"backend\""
echo -e "   - Utilisez le framework \"Node.js\""
echo -e "   - Configurez les variables d'environnement selon zeabur.yaml"
echo -e "5. Pour la base de données:"
echo -e "   - Ajoutez un service PostgreSQL"
echo -e "   - Reliez-le au backend via la variable d'environnement"
echo -e "6. Pour le frontend:"
echo -e "   - Déployez le dossier \"frontend\""
echo -e "   - Utilisez le framework \"React\""
echo -e "   - Configurez l'URL de l'API pour pointer vers le backend"

echo -e "\n${GREEN}=== Préparation terminée ===${NC}"
echo -e "Le code est prêt pour le déploiement sur Zeabur."
