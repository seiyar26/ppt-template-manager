#!/bin/bash
# Script de déploiement automatique pour PPT Template Manager
# Ce script automatise le déploiement complet sur votre hébergement

echo "=== Début du déploiement de PPT Template Manager ==="
echo "Ce script va déployer l'application sur jonathanifrah.fr"

# Configuration
VPS_USER="jonathanifrah"
VPS_HOST="jonathanifrah.fr"
VPS_PATH="/home/jonathanifrah/public_html/ppt-manager"
LOCAL_PATH="/Users/michaeltenenbaum/Downloads/ppt-template-manager"

# Créer un archive locale
echo "=== Préparation et compression des fichiers ==="
cd "$LOCAL_PATH"
tar -czf /tmp/ppt-manager.tar.gz backend frontend

# Envoyer en une seule fois
echo "=== Transfert de l'archive vers le serveur ==="
ssh $VPS_USER@$VPS_HOST "mkdir -p $VPS_PATH"
scp /tmp/ppt-manager.tar.gz $VPS_USER@$VPS_HOST:$VPS_PATH/

# Configuration sur le VPS
echo "=== Configuration sur le serveur ==="
ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
# Variables
VPS_PATH="/home/jonathanifrah/public_html/ppt-manager"
cd $VPS_PATH

# Extraction de l'archive
echo "Extraction de l'archive..."
tar -xzf ppt-manager.tar.gz
rm ppt-manager.tar.gz

# Configuration de l'environnement
cd $VPS_PATH/backend
cat > .env << 'EOF'
PORT=2324
NODE_ENV=development
JWT_SECRET=ppt_template_manager_secret_key
CONVERT_API_SECRET=secret_KpZ4EmWSJCFOLYyX
EOF

# Configuration du frontend
cd $VPS_PATH/frontend
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://jonathanifrah.fr/api
REACT_APP_IMAGE_BASE_URL=https://jonathanifrah.fr
EOF

# Configuration du backend
cd $VPS_PATH/backend
mkdir -p uploads/templates
mkdir -p uploads/exports
chmod -R 755 uploads

# Installation de Node.js (si nécessaire)
if ! command -v node &> /dev/null; then
    echo "Installation de Node.js..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 16
fi

# Vérification de Node.js
node -v
npm -v

# Installation des dépendances backend
cd $VPS_PATH/backend
npm install

# Installation de PM2 (si nécessaire)
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Installation des dépendances frontend et build
cd $VPS_PATH/frontend
npm install
npm run build

# Configuration du .htaccess
cat > /home/jonathanifrah/public_html/.htaccess << 'EOF'
# Rediriger les requêtes API vers le backend Node.js
RewriteEngine On
RewriteRule ^api/(.*) http://localhost:2324/api/$1 [P,L]

# Pour React frontend
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ppt-manager/(.*)$ /ppt-manager/frontend/build/index.html [L]
EOF

# Démarrage de l'application
cd $VPS_PATH/backend
pm2 stop ppt-manager 2>/dev/null || true
pm2 delete ppt-manager 2>/dev/null || true
pm2 start server.js --name ppt-manager
pm2 save

# Sortie
echo "=== Déploiement terminé sur le serveur ==="
echo "L'application devrait être accessible à:"
echo "- Frontend: https://jonathanifrah.fr/ppt-manager/frontend/build/"
echo "- API: https://jonathanifrah.fr/api/health"
ENDSSH

# Nettoyage local
echo "=== Nettoyage local ==="
rm -f /tmp/ppt-manager.tar.gz

echo "=== Déploiement terminé ==="
echo "Votre application est maintenant déployée sur $VPS_HOST"
echo "- Frontend: https://$VPS_HOST/ppt-manager/frontend/build/"
echo "- API: https://$VPS_HOST/api/health"
