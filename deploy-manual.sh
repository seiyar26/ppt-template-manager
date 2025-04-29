#!/bin/bash
# Script de du00e9ploiement manuel pour PPT Template Manager

echo "=== Du00e9but du du00e9ploiement manuel de PPT Template Manager ==="
echo "Ce script va pru00e9parer les fichiers pour le du00e9ploiement sur jonathanifrah.fr"

# Configuration
LOCAL_PATH="/Users/michaeltenenbaum/Downloads/ppt-template-manager"

# Cru00e9er une archive locale
echo "=== Pru00e9paration et compression des fichiers ==="
cd "$LOCAL_PATH"
tar -czf /tmp/ppt-manager.tar.gz backend frontend

echo "=== Archive cru00e9u00e9e avec succu00e8s ==="
echo "L'archive est disponible u00e0: /tmp/ppt-manager.tar.gz"

echo "=== Instructions pour le du00e9ploiement manuel ==="
echo "1. Connectez-vous au serveur avec la commande suivante:"
echo "   ssh jonathanifrah@jonathanifrah.fr"
echo "   (Mot de passe: Kkoqqkkoqq26#)"
echo ""
echo "2. Cru00e9ez le ru00e9pertoire de destination sur le serveur:"
echo "   mkdir -p /home/jonathanifrah/public_html"
echo ""
echo "3. Dans une nouvelle fenu00eatre de terminal, transfu00e9rez l'archive vers le serveur:"
echo "   scp /tmp/ppt-manager.tar.gz jonathanifrah@jonathanifrah.fr:/home/jonathanifrah/public_html/"
echo ""
echo "4. Retournez u00e0 la fenu00eatre SSH et exu00e9cutez les commandes suivantes:"
echo "   cd /home/jonathanifrah/public_html"
echo "   tar -xzf ppt-manager.tar.gz"
echo "   rm ppt-manager.tar.gz"
echo ""
echo "5. Configurez le backend:"
echo "   cd /home/jonathanifrah/public_html/backend"
echo "   cat > .env << 'EOF'
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
EOF"
echo ""
echo "6. Configurez le frontend:"
echo "   cd /home/jonathanifrah/public_html/frontend"
echo "   cat > .env.production << 'EOF'
REACT_APP_API_URL=https://jonathanifrah.fr/api
REACT_APP_IMAGE_BASE_URL=https://jonathanifrah.fr
EOF"
echo ""
echo "7. Cru00e9ez les ru00e9pertoires d'uploads:"
echo "   cd /home/jonathanifrah/public_html/backend"
echo "   mkdir -p uploads/templates"
echo "   mkdir -p uploads/exports"
echo "   chmod -R 755 uploads"
echo ""
echo "8. Installez les du00e9pendances backend:"
echo "   cd /home/jonathanifrah/public_html/backend"
echo "   npm install"
echo ""
echo "9. Installez PM2 si nu00e9cessaire:"
echo "   npm install -g pm2"
echo ""
echo "10. Installez les du00e9pendances frontend et construisez l'application:"
echo "    cd /home/jonathanifrah/public_html/frontend"
echo "    npm install"
echo "    npm run build"
echo ""
echo "11. Configurez le .htaccess:"
echo "    cd /home/jonathanifrah/public_html"
echo "    cat > .htaccess << 'EOF'
# Rediriger les requu00eates API vers le backend Node.js
RewriteEngine On
RewriteRule ^api/(.*) http://localhost:2324/api/$1 [P,L]

# Pour React frontend
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /frontend/build/index.html [L]
EOF"
echo ""
echo "12. Du00e9marrez l'application avec PM2:"
echo "    cd /home/jonathanifrah/public_html/backend"
echo "    pm2 stop ppt-manager 2>/dev/null || true"
echo "    pm2 delete ppt-manager 2>/dev/null || true"
echo "    pm2 start server.js --name ppt-manager"
echo "    pm2 save"
echo ""
echo "=== Du00e9ploiement manuel terminu00e9 ==="
echo "Votre application devrait u00eatre accessible u00e0:"
echo "- Frontend: https://jonathanifrah.fr/"
echo "- API: https://jonathanifrah.fr/api/health"
