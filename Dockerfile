FROM node:20-slim

# Installer les dépendances nécessaires incluant PostgreSQL client pour la vérification de connexion
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier d'abord les fichiers package.json pour optimiser le cache Docker
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Installer les dépendances du backend (pas besoin de reconstruire bcryptjs qui est en JS pur)
WORKDIR /app/backend
RUN npm install

# Installer les dépendances du frontend
WORKDIR /app/frontend
RUN npm install

# Maintenant copier le reste des fichiers du projet
WORKDIR /app
COPY . .

# Construire le frontend
WORKDIR /app/frontend
RUN npm run build

# Retourner au backend pour le démarrage
WORKDIR /app/backend

# Créer les répertoires nécessaires pour les uploads et ajuster les permissions
RUN mkdir -p logs uploads/templates uploads/temp uploads/exports && \
    chmod -R 777 logs uploads

# Copier le script d'attente pour PostgreSQL
COPY backend/scripts/wait-for-postgres.sh /app/wait-for-postgres.sh
RUN chmod +x /app/wait-for-postgres.sh

# Exposer le port pour le backend
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Script de démarrage qui vérifie la disponibilité de PostgreSQL avant de lancer l'application
CMD ["/app/wait-for-postgres.sh", "node", "--max-old-space-size=512", "server.js"]
