FROM node:20-slim

# Installer les dépendances nécessaires
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Copier les fichiers package.json pour optimiser le cache Docker
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers de l'application
COPY . .

# Créer les répertoires nécessaires pour les uploads s'ils n'existent pas déjà
RUN mkdir -p logs uploads/templates uploads/temp uploads/exports && \
    chmod -R 777 logs uploads

# Exposer le port pour le backend
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Ajouter un script de démarrage qui attendra que PostgreSQL soit disponible
COPY ./scripts/wait-for-postgres.sh ./
RUN chmod +x ./wait-for-postgres.sh

# Démarrer l'application avec options de performances
CMD ["./wait-for-postgres.sh", "node", "--max-old-space-size=512", "server.js"]
