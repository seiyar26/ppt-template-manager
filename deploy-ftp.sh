#!/bin/bash
# Script de déploiement FTP pour PPT Template Manager

echo "=== Début du déploiement FTP de PPT Template Manager ==="
echo "Ce script va déployer l'application sur jonathanifrah.fr via FTP"

# Configuration
FTP_USER="jonathanifrah"
FTP_HOST="jonathanifrah.fr"
FTP_PASSWORD="Kkoqqkkoqq26#"
FTP_PATH="/public_html"
LOCAL_PATH="/Users/michaeltenenbaum/Downloads/ppt-template-manager"

# Créer une archive locale
echo "=== Préparation et compression des fichiers ==="
cd "$LOCAL_PATH"
rm -rf /tmp/ppt-deploy
mkdir -p /tmp/ppt-deploy/backend
mkdir -p /tmp/ppt-deploy/frontend

# Copier les fichiers backend (en excluant node_modules)
echo "=== Copie des fichiers backend ==="
rsync -av --exclude='node_modules' --exclude='.git' "$LOCAL_PATH/backend/" "/tmp/ppt-deploy/backend/"

# Copier les fichiers frontend (en excluant node_modules)
echo "=== Copie des fichiers frontend ==="
rsync -av --exclude='node_modules' --exclude='.git' "$LOCAL_PATH/frontend/" "/tmp/ppt-deploy/frontend/"

# Créer les fichiers de configuration
echo "=== Création des fichiers de configuration ==="

# Fichier .env pour le backend
cat > /tmp/ppt-deploy/backend/.env << EOF
PORT=2324
NODE_ENV=production
JWT_SECRET=ppt_template_manager_secret_key

# Configuration PostgreSQL
DATABASE_URL=postgresql://jonathanifrah:Kkoqqkkoqq26#@localhost:5432/ppt_template_manager

# Variables individuelles
DB_HOST=localhost
DB_USER=jonathanifrah
DB_PASSWORD=Kkoqqkkoqq26#
DB_NAME=ppt_template_manager
DB_PORT=5432

CONVERT_API_SECRET=secret_KpZ4EmWSJCFOLYyX
EOF

# Fichier .env.production pour le frontend
cat > /tmp/ppt-deploy/frontend/.env.production << EOF
REACT_APP_API_URL=https://jonathanifrah.fr/api
REACT_APP_IMAGE_BASE_URL=https://jonathanifrah.fr
EOF

# Fichier .htaccess pour la racine
cat > /tmp/ppt-deploy/.htaccess << EOF
# Rediriger les requêtes API vers le backend Node.js
RewriteEngine On
RewriteRule ^api/(.*) http://localhost:2324/api/\$1 [P,L]

# Pour React frontend
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /frontend/build/index.html [L]
EOF

# Créer un fichier README avec les instructions pour le serveur
cat > /tmp/ppt-deploy/README.txt << EOF
Instructions pour terminer le déploiement sur le serveur:

1. Installer Node.js et npm si ce n'est pas déjà fait
2. Installer les dépendances backend:
   cd /home/jonathanifrah/public_html/backend
   npm install

3. Installer PM2 si nécessaire:
   npm install -g pm2

4. Installer les dépendances frontend et construire l'application:
   cd /home/jonathanifrah/public_html/frontend
   npm install
   npm run build

5. Créer les répertoires d'uploads:
   cd /home/jonathanifrah/public_html/backend
   mkdir -p uploads/templates
   mkdir -p uploads/exports
   chmod -R 755 uploads

6. Démarrer l'application avec PM2:
   cd /home/jonathanifrah/public_html/backend
   pm2 stop ppt-manager 2>/dev/null || true
   pm2 delete ppt-manager 2>/dev/null || true
   pm2 start server.js --name ppt-manager
   pm2 save

L'application devrait être accessible à:
- Frontend: https://jonathanifrah.fr/
- API: https://jonathanifrah.fr/api/health
EOF

# Créer un script de déploiement lftp
cat > /tmp/ppt-deploy-lftp.txt << EOF
# Se connecter au serveur FTP
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST

# Définir le mode de transfert
set ftp:ssl-allow no
set mirror:use-pget-n 5
set xfer:parallel 5

# Créer les répertoires nécessaires
mkdir -p $FTP_PATH

# Transférer les fichiers
cd $FTP_PATH
mirror -R --delete /tmp/ppt-deploy .

# Quitter
bye
EOF

echo "=== Déploiement via FTP ==="
echo "Transfert des fichiers vers le serveur..."
lftp -f /tmp/ppt-deploy-lftp.txt

echo "=== Nettoyage local ==="
rm -rf /tmp/ppt-deploy
rm -f /tmp/ppt-deploy-lftp.txt

echo "=== Déploiement FTP terminé ==="
echo "Les fichiers ont été transférés avec succès sur le serveur."
echo "IMPORTANT: Vous devez maintenant vous connecter au serveur via SSH pour terminer l'installation."
echo "Consultez le fichier README.txt qui a été transféré pour les instructions détaillées."
echo ""
echo "Votre application sera accessible à:"
echo "- Frontend: https://jonathanifrah.fr/"
echo "- API: https://jonathanifrah.fr/api/health"
