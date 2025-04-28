#!/bin/bash
# Script pour corriger la configuration du site

echo "=== Correction de la configuration du site web ==="

# Configuration
VPS_USER="jonathanifrah"
VPS_HOST="jonathanifrah.fr"

# Création du contenu du .htaccess
echo "Création du fichier .htaccess..."
cat > htaccess.txt << 'EOF'
# Configuration générale
Options -Indexes
DirectoryIndex index.html index.php

# Activation du moteur de réécriture
RewriteEngine On

# Rediriger les requêtes API vers le backend Node.js
RewriteRule ^api/(.*) http://localhost:2324/api/$1 [P,L]

# Redirection pour l'application PPT Manager
RewriteRule ^ppt-manager/?$ /ppt-manager/frontend/build/ [R=302,L]
RewriteRule ^ppt-manager/app/(.*) /ppt-manager/frontend/build/$1 [L]

# Pour React frontend (SPA routing)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ppt-manager/frontend/build/(.*) /ppt-manager/frontend/build/index.html [L]
EOF

# Création d'une page d'accueil simple
echo "Création d'une page d'accueil simple..."
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jonathan Ifrah</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        h1 {
            color: #333;
        }
        .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 14px 20px;
            margin: 10px 0;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            font-size: 16px;
        }
        .button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Bienvenue sur le site de Jonathan Ifrah</h1>
        <p>Ce site est en cours de développement.</p>
        <a href="/ppt-manager" class="button">Accéder au gestionnaire de modèles PowerPoint</a>
    </div>
</body>
</html>
EOF

# Transfert des fichiers
echo "Transfert des fichiers vers le serveur..."
scp htaccess.txt $VPS_USER@$VPS_HOST:/home/jonathanifrah/public_html/.htaccess
scp index.html $VPS_USER@$VPS_HOST:/home/jonathanifrah/public_html/index.html

# Nettoyage
echo "Nettoyage des fichiers temporaires..."
rm htaccess.txt
rm index.html

echo "=== Configuration terminée ==="
echo "Votre site est maintenant accessible à :"
echo "- Accueil : https://$VPS_HOST"
echo "- Application : https://$VPS_HOST/ppt-manager"
