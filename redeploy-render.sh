#!/bin/bash

# Script de redéploiement complet pour PPT Template Manager sur Render
# Ce script va :
# 1. Vérifier les dépendances
# 2. Se connecter à l'API Render
# 3. Redémarrer les services
# 4. Vérifier le statut du déploiement

# Configuration
RENDER_API_KEY="rnd_oenlEpTn9FCT2X193O4B6vnFkABs"  # Remplacez par votre clé API Render
SERVICE_BACKEND="ppt-template-manager-api"
SERVICE_FRONTEND="ppt-template-manager-frontend"
API_BASE_URL="https://api.render.com/v1"

# Fonction pour afficher les messages d'information
log_info() {
  echo -e "\033[1;34m[INFO]\033[0m $1"
}

# Fonction pour afficher les messages de succès
log_success() {
  echo -e "\033[1;32m[SUCCÈS]\033[0m $1"
}

# Fonction pour afficher les messages d'erreur
log_error() {
  echo -e "\033[1;31m[ERREUR]\033[0m $1" >&2
}

# Vérifier les dépendances
check_dependencies() {
  log_info "Vérification des dépendances..."
  
  local missing_deps=0
  
  if ! command -v curl &> /dev/null; then
    log_error "curl n'est pas installé. Veuillez l'installer."
    missing_deps=$((missing_deps + 1))
  fi
  
  if ! command -v jq &> /dev/null; then
    log_error "jq n'est pas installé. Installation en cours avec Homebrew..."
    if command -v brew &> /dev/null; then
      brew install jq
    else
      log_error "Homebrew n'est pas installé. Veuillez installer jq manuellement."
      missing_deps=$((missing_deps + 1))
    fi
  fi
  
  if [ $missing_deps -gt 0 ]; then
    log_error "Veuillez installer les dépendances manquantes et réessayer."
    exit 1
  fi
  
  log_success "Toutes les dépendances sont installées."
}

# Obtenir l'ID du service à partir de son nom
get_service_id() {
  local service_name=$1
  
  log_info "Recherche de l'ID pour le service: $service_name"
  
  local response
  response=$(curl -s -X GET "$API_BASE_URL/services?name=$service_name" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer $RENDER_API_KEY")
  
  if [ $? -ne 0 ] || [ -z "$response" ]; then
    log_error "Échec de la récupération des services"
    return 1
  fi
  
  local service_id
  service_id=$(echo "$response" | jq -r '.[0].id // empty')
  
  if [ -z "$service_id" ] || [ "$service_id" == "null" ]; then
    log_error "Service non trouvé: $service_name"
    return 1
  fi
  
  log_success "ID du service $service_name: $service_id"
  echo "$service_id"
  return 0
}

# Redémarrer un service
restart_service() {
  local service_name=$1
  
  log_info "Démarrage du redémarrage du service: $service_name"
  
  local service_id
  service_id=$(get_service_id "$service_name")
  
  if [ $? -ne 0 ]; then
    return 1
  fi
  
  log_info "Lancement du redémarrage pour $service_name (ID: $service_id)"
  
  local response
  response=$(curl -s -X POST "$API_BASE_URL/services/$service_id/restart" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -d '{"clearCache": "clear"}')
  
  if [ $? -ne 0 ]; then
    log_error "Échec du redémarrage du service $service_name"
    return 1
  fi
  
  log_success "Redémarrage du service $service_name lancé avec succès"
  echo "$service_id"
  return 0
}

# Vérifier le statut d'un déploiement
check_deployment_status() {
  local service_id=$1
  
  log_info "Vérification du statut du déploiement pour le service ID: $service_id"
  
  local response
  response=$(curl -s -X GET "$API_BASE_URL/services/$service_id/deploys" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer $RENDER_API_KEY")
  
  if [ $? -ne 0 ] || [ -z "$response" ]; then
    log_error "Échec de la récupération du statut du déploiement"
    return 1
  fi
  
  local latest_deploy
  latest_deploy=$(echo "$response" | jq '.[0] // empty')
  
  if [ -z "$latest_deploy" ] || [ "$latest_deploy" == "null" ]; then
    log_error "Aucun déploiement trouvé pour ce service"
    return 1
  fi
  
  local status
  status=$(echo "$latest_deploy" | jq -r '.status // empty')
  
  log_info "Statut actuel du déploiement: $status"
  
  if [ "$status" == "live" ]; then
    log_success "Le service est maintenant en ligne et fonctionnel"
    return 0
  elif [ "$status" == "build_failed" ] || [ "$status" == "canceled" ] || [ "$status" == "failed" ]; then
    log_error "Échec du déploiement avec le statut: $status"
    return 1
  else
    # Le déploiement est toujours en cours
    echo "pending"
    return 2
  fi
}

# Fonction principale
main() {
  log_info "Début du processus de redéploiement pour PPT Template Manager"
  
  # Vérifier les dépendances
  check_dependencies
  
  # Redémarrer le backend
  log_info "=== REDÉMARRAGE DU BACKEND ==="
  local backend_id
  backend_id=$(restart_service "$SERVICE_BACKEND")
  
  if [ $? -ne 0 ]; then
    log_error "Échec du redémarrage du backend"
    exit 1
  fi
  
  # Attendre que le backend soit opérationnel
  log_info "Attente de la disponibilité du backend..."
  local backend_ready=false
  local attempts=0
  local max_attempts=30  # 5 minutes max (10s * 30 = 300s)
  
  while [ $attempts -lt $max_attempts ]; do
    local status_result
    status_result=$(check_deployment_status "$backend_id")
    local status_code=$?
    
    if [ $status_code -eq 0 ]; then
      log_success "Le backend est maintenant opérationnel"
      backend_ready=true
      break
    elif [ $status_code -eq 1 ]; then
      log_error "Erreur lors de la vérification du statut du backend"
      exit 1
    fi
    
    attempts=$((attempts + 1))
    log_info "En attente du démarrage du backend... (tentative $attempts/$max_attempts)"
    sleep 10
  done
  
  if [ "$backend_ready" = false ]; then
    log_error "Délai d'attente dépassé pour le démarrage du backend"
    exit 1
  fi
  
  # Redémarrer le frontend
  log_info "\n=== REDÉMARRAGE DU FRONTEND ==="
  local frontend_id
  frontend_id=$(restart_service "$SERVICE_FRONTEND")
  
  if [ $? -ne 0 ]; then
    log_error "Échec du redémarrage du frontend"
    exit 1
  fi
  
  # Vérifier le statut du frontend (plus rapide car c'est un site statique)
  log_info "Vérification du statut du frontend..."
  sleep 10  # Court délai pour laisser le temps au déploiement de démarrer
  
  local frontend_status
  frontend_status=$(check_deployment_status "$frontend_id")
  
  if [ $? -eq 0 ]; then
    log_success "Le frontend est maintenant opérationnel"
  else
    log_error "Problème lors du déploiement du frontend"
    exit 1
  fi
  
  # Afficher les URLs des services
  log_info "\n=== DÉPLOIEMENT TERMINÉ AVEC SUCCÈS ==="
  log_info "Backend:  https://$SERVICE_BACKEND.onrender.com"
  log_info "Frontend: https://$SERVICE_FRONTEND.onrender.com"
  log_info "\nVérifiez le statut complet sur le dashboard Render: https://dashboard.render.com"
  
  # Tester l'API
  log_info "\nTest de l'API..."
  curl -s "https://$SERVICE_BACKEND.onrender.com/health" | jq .
}

# Exécuter le script principal
main "$@"
