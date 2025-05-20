#!/bin/bash

# Script de déploiement Vercel pour PPT Template Manager

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages d'information
log_info() {
  echo -e "${YELLOW}[INFO]${NC} $1"
}

# Fonction pour afficher les messages de succès
log_success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

# Fonction pour afficher les messages d'erreur
log_error() {
  echo -e "${RED}[ERREUR]${NC} $1" >&2
}

# Vérifier si Vercel CLI est installé
check_vercel_cli() {
  if ! command -v vercel &> /dev/null; then
    log_error "Vercel CLI n'est pas installé. Installation en cours..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
      log_error "Échec de l'installation de Vercel CLI. Veuillez l'installer manuellement."
      exit 1
    fi
  fi
  log_success "Vercel CLI est installé"
}

# Vérifier les variables d'environnement
check_env_vars() {
  log_info "Vérification des variables d'environnement..."
  
  if [ ! -f ".env" ]; then
    log_error "Fichier .env introuvable. Création à partir du modèle..."
    cp .env.example .env
    log_info "Veuvez configurer les variables dans le fichier .env avant de continuer"
    exit 1
  fi
  
  # Vérifier les variables obligatoires
  local required_vars=(
    "DATABASE_URL"
    "JWT_SECRET"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  )
  
  local missing_vars=()
  
  for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env; then
      missing_vars+=("$var")
    fi
  done
  
  if [ ${#missing_vars[@]} -gt 0 ]; then
    log_error "Variables manquantes dans .env:"
    for var in "${missing_vars[@]}"; do
      echo " - $var"
    done
    exit 1
  fi
  
  log_success "Toutes les variables requises sont présentes dans .env"
}

# Construire l'application
build_app() {
  log_info "Construction de l'application..."
  
  # Installer les dépendances
  log_info "Installation des dépendances..."
  npm install
  
  if [ $? -ne 0 ]; then
    log_error "Échec de l'installation des dépendances"
    exit 1
  fi
  
  # Construire le frontend
  log_info "Construction du frontend..."
  cd frontend
  npm install
  npm run build
  
  if [ $? -ne 0 ]; then
    log_error "Échec de la construction du frontend"
    exit 1
  fi
  
  cd ..
  log_success "Construction terminée avec succès"
}

# Déployer sur Vercel
deploy_to_vercel() {
  log_info "Démarrage du déploiement sur Vercel..."
  
  # Vérifier si l'utilisateur est connecté à Vercel
  vercel whoami > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    log_info "Connexion à Vercel requise..."
    vercel login
  fi
  
  # Déployer l'application
  log_info "Déploiement en cours..."
  vercel --prod
  
  if [ $? -ne 0 ]; then
    log_error "Échec du déploiement sur Vercel"
    exit 1
  fi
  
  log_success "Déploiement réussi !"
}

# Fonction principale
main() {
  echo -e "\n=== DÉPLOIEMENT PPT TEMPLATE MANAGER SUR VERCEL ===\n"
  
  check_vercel_cli
  check_env_vars
  build_app
  deploy_to_vercel
  
  echo -e "\n=== DÉPLOIEMENT TERMINÉ AVEC SUCCÈS ==="
  echo -e "\nVotre application est maintenant déployée sur Vercel !"
  echo -e "Vous pouvez la gérer à l'adresse : https://vercel.com/dashboard\n"
}

# Exécuter le script principal
main "$@"
