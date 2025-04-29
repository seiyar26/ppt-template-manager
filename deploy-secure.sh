#!/bin/bash
# Script de déploiement sécurisé pour PPT Template Manager

echo "=== Début du déploiement sécurisé de PPT Template Manager ==="
echo "Ce script va déployer l'application sur jonathanifrah.fr"

# Configuration
VPS_USER="jonathanifrah"
VPS_HOST="jonathanifrah.fr"
VPS_PATH="/home/jonathanifrah/public_html"
LOCAL_PATH="/Users/michaeltenenbaum/Downloads/ppt-template-manager"
SSH_PASSWORD="Kkoqqkkoqq26#"

# Vérification de sshpass
if ! command -v sshpass &> /dev/null; then
    echo "Erreur: sshpass n'est pas installé. Veuillez l'installer avec 'brew install sshpass'"
    exit 1
fi

# Créer une archive locale
echo "=== Préparation et compression des fichiers ==="
cd "$LOCAL_PATH"
tar -czf /tmp/ppt-manager.tar.gz backend frontend

# Fonction pour exécuter des commandes SSH avec sshpass
ssh_cmd() {
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

# Fonction pour copier des fichiers avec sshpass
scp_cmd() {
    sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no "$1" "$VPS_USER@$VPS_HOST:$2"
}

# Créer le répertoire de destination
echo "=== Création du répertoire de destination ==="
ssh_cmd "mkdir -p $VPS_PATH"

# Envoyer l'archive
echo "=== Transfert de l'archive vers le serveur ==="
scp_cmd "/tmp/ppt-manager.tar.gz" "$VPS_PATH/"

# Exécuter les commandes de configuration sur le serveur
echo "=== Configuration sur le serveur ==="
ssh_cmd "cd $VPS_PATH && \
    echo 'Extraction de l\'archive...' && \
    tar -xzf ppt-manager.tar.gz && \
    rm ppt-manager.tar.gz && \
    \
    echo 'Configuration de l\'environnement backend...' && \
    cd $VPS_PATH/backend && \
    cat > .env << 'EOF'
PORT=2324
NODE_ENV=production
JWT_SECRET=ppt_template_manager_secret_key

# Configuration PostgreSQL
DATABASE_URL=postgresql://$VPS_USER:$SSH_PASSWORD@localhost:5432/ppt_template_manager

# Variables individuelles
DB_HOST=localhost
DB_USER=$VPS_USER
DB_PASSWORD=$SSH_PASSWORD
DB_NAME=ppt_template_manager
DB_PORT=5432

CONVERT_API_SECRET=secret_KpZ4EmWSJCFOLYyX
EOF
    \
    echo 'Configuration du frontend...' && \
    cd $VPS_PATH/frontend && \
    cat > .env.production << 'EOF'
REACT_APP_API_URL=https://jonathanifrah.fr/api
REACT_APP_IMAGE_BASE_URL=https://jonathanifrah.fr
EOF
    \
    echo 'Création des répertoires d\'uploads...' && \
    cd $VPS_PATH/backend && \
    mkdir -p uploads/templates && \
    mkdir -p uploads/exports && \
    chmod -R 755 uploads && \
    \
    echo 'Vérification de Node.js...' && \
    if ! command -v node &> /dev/null; then \
        echo 'Installation de Node.js...' && \
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && \
        export NVM_DIR=\"\$HOME/.nvm\" && \
        [ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh\" && \
        nvm install 16 \
    fi && \
    \
    node -v && \
    npm -v && \
    \
    echo 'Installation des dépendances backend...' && \
    cd $VPS_PATH/backend && \
    npm install && \
    \
    echo 'Installation de PM2...' && \
    if ! command -v pm2 &> /dev/null; then \
        npm install -g pm2 \
    fi && \
    \
    echo 'Installation des dépendances frontend et build...' && \
    cd $VPS_PATH/frontend && \
    npm install && \
    npm run build && \
    \
    echo 'Configuration du .htaccess...' && \
    cat > $VPS_PATH/.htaccess << 'EOF'
# Rediriger les requêtes API vers le backend Node.js
RewriteEngine On
RewriteRule ^api/(.*) http://localhost:2324/api/$1 [P,L]

# Pour React frontend
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /frontend/build/index.html [L]
EOF
    \
    echo 'Démarrage de l\'application...' && \
    cd $VPS_PATH/backend && \
    pm2 stop ppt-manager 2>/dev/null || true && \
    pm2 delete ppt-manager 2>/dev/null || true && \
    pm2 start server.js --name ppt-manager && \
    pm2 save && \
    \
    echo '=== Déploiement terminé sur le serveur ===' && \
    echo 'L\'application devrait être accessible à:' && \
    echo '- Frontend: https://jonathanifrah.fr/' && \
    echo '- API: https://jonathanifrah.fr/api/health'"

# Nettoyage local
echo "=== Nettoyage local ==="
rm -f /tmp/ppt-manager.tar.gz

echo "=== Déploiement terminé ==="
echo "Votre application est maintenant déployée sur $VPS_HOST"
echo "- Frontend: https://$VPS_HOST/"
echo "- API: https://$VPS_HOST/api/health"
