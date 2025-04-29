FROM node:20-slim

WORKDIR /app

# Copier les fichiers du projet
COPY . .

# Installer les dépendances du backend et reconstruire bcrypt
WORKDIR /app/backend
RUN npm install
RUN npm rebuild bcrypt --build-from-source

# Installer les dépendances du frontend et construire
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Retourner à la racine du projet
WORKDIR /app

# Exposer le port pour le backend
EXPOSE 3000

# Démarrer l'application
CMD ["node", "backend/server.js"]
