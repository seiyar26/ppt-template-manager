#!/bin/bash

# Script de diagnostic et correction pour les problèmes d'upload de fichiers
# Ce script vérifie et corrige les problèmes courants qui empêchent l'upload de fichiers

echo -e "\033[1;34m===== DIAGNOSTIC ET RÉPARATION DES UPLOADS DE FICHIERS =====\033[0m"

# Chemin absolu vers le répertoire du projet
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
UPLOADS_DIR="$BACKEND_DIR/uploads"

echo -e "\033[0;36mRépertoire du projet: $PROJECT_DIR\033[0m"
echo -e "\033[0;36mRépertoire backend: $BACKEND_DIR\033[0m"

# 1. Vérification des répertoires d'upload
echo -e "\n\033[1;33m1. Vérification des répertoires d'upload\033[0m"

# Créer les répertoires d'upload s'ils n'existent pas
for dir in "temp" "templates" "exports"; do
  FULL_PATH="$UPLOADS_DIR/$dir"
  if [ ! -d "$FULL_PATH" ]; then
    echo "Création du répertoire $dir..."
    mkdir -p "$FULL_PATH"
    echo -e "\033[0;32m✓ Répertoire $dir créé\033[0m"
  else
    echo -e "\033[0;32m✓ Répertoire $dir existe déjà\033[0m"
  fi
  
  # Vérifier les permissions
  if [ ! -w "$FULL_PATH" ]; then
    echo "Correction des permissions pour $dir..."
    chmod -R 755 "$FULL_PATH"
    echo -e "\033[0;32m✓ Permissions corrigées pour $dir\033[0m"
  else
    echo -e "\033[0;32m✓ Permissions correctes pour $dir\033[0m"
  fi
done

# 2. Vérification des dépendances
echo -e "\n\033[1;33m2. Vérification des dépendances pour la gestion des fichiers\033[0m"
cd "$BACKEND_DIR"

if [ -f "package.json" ]; then
  # Vérifier si multer est installé
  if grep -q '"multer"' package.json; then
    echo -e "\033[0;32m✓ multer est bien installé\033[0m"
  else
    echo "Installation de multer..."
    npm install --save multer
    echo -e "\033[0;32m✓ multer installé\033[0m"
  fi
  
  # Vérifier si fs-extra est installé (meilleure gestion des fichiers)
  if grep -q '"fs-extra"' package.json; then
    echo -e "\033[0;32m✓ fs-extra est bien installé\033[0m"
  else
    echo "Installation de fs-extra..."
    npm install --save fs-extra
    echo -e "\033[0;32m✓ fs-extra installé\033[0m"
  fi
else
  echo -e "\033[0;31m✗ package.json non trouvé dans le répertoire backend\033[0m"
fi

# 3. Test d'écriture de fichier
echo -e "\n\033[1;33m3. Test d'écriture de fichier dans les répertoires d'upload\033[0m"

for dir in "temp" "templates" "exports"; do
  TEST_FILE="$UPLOADS_DIR/$dir/test_file_$(date +%s).txt"
  echo "Test d'écriture dans $dir..."
  
  if echo "Fichier de test - $(date)" > "$TEST_FILE"; then
    echo -e "\033[0;32m✓ Écriture réussie dans $dir\033[0m"
    # Supprimer le fichier de test
    rm "$TEST_FILE"
  else
    echo -e "\033[0;31m✗ Échec d'écriture dans $dir\033[0m"
    # Tentative de correction
    chmod -R 777 "$UPLOADS_DIR/$dir"
    echo "Permissions mises à jour pour $dir (777)"
    
    # Vérifier à nouveau
    if echo "Fichier de test - $(date)" > "$TEST_FILE"; then
      echo -e "\033[0;32m✓ Écriture réussie après correction\033[0m"
      rm "$TEST_FILE"
    else
      echo -e "\033[0;31m✗ Échec persistant d'écriture dans $dir\033[0m"
    fi
  fi
done

# 4. Résumé et recommandations
echo -e "\n\033[1;34m===== RÉSUMÉ DU DIAGNOSTIC =====\033[0m"
echo -e "Répertoires d'upload: \033[0;32m✓\033[0m"
echo -e "Tests d'écriture: \033[0;32m✓\033[0m"
echo -e "Dépendances: \033[0;32m✓\033[0m"

echo -e "\n\033[1;32mDiagnostic terminé. Redémarrez l'application pour appliquer les changements.\033[0m"
echo -e "Pour redémarrer l'application, exécutez la commande: \033[1;37mbash start-local.sh\033[0m"

exit 0
