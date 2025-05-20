# Déploiement du Backend sur Railway

Ce document vous guide à travers les étapes nécessaires pour déployer ce backend sur Railway.

## Prérequis

- Un compte Railway (inscription gratuite sur [railway.app](https://railway.app))
- Un compte GitHub avec ce dépôt

## Instructions de déploiement

### 1. Connexion à Railway

1. Visitez [Railway](https://railway.app/) et connectez-vous
2. Dans votre tableau de bord, cliquez sur "New Project"
3. Sélectionnez "Deploy from GitHub repo"
4. Autorisez Railway à accéder à vos dépôts GitHub
5. Sélectionnez ce dépôt

### 2. Configuration du déploiement

1. Dans la section "Settings" de votre nouveau projet:
   - Assurez-vous que le répertoire à déployer est `/backend`
   - Service name: `ppt-template-manager-backend`
   - Root Directory: `/backend`
   - Start Command: `npm start`

### 3. Configuration des variables d'environnement

Dans la section "Variables", ajoutez les variables suivantes:

```
PORT=8080
NODE_ENV=production
SUPABASE_URL=https://mbwurtmvdgmnrizxfouf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3VydG12ZGdtbnJpenhmb3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MDU4MDAsImV4cCI6MjA2MzI4MTgwMH0.tNF11pL0MQQKhb3ejQiHjLhTCIGqabIhKu-WIdZvMDs
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3VydG12ZGdtbnJpenhmb3VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcwNTgwMCwiZXhwIjoyMDYzMjgxODAwfQ.Ojvhv2gXUNiv5NmdMniJyZKgY9d-MqjN3_3p9KIJFsY
JWT_SECRET=ppt_template_manager_secret_key_prod
CORS_ORIGIN=https://frontend-fivl16tuo-seiyar26s-projects.vercel.app
CONVERT_API_SECRET=secret_q4Pjq2F9FCU9ypDJ
```

### 4. Finaliser et déployer

1. Cliquez sur "Deploy" pour lancer le déploiement
2. Attendez que le déploiement soit terminé (Railway affiche "Deployment Successful")
3. Cliquez sur l'URL générée pour accéder à votre backend déployé

### 5. Mise à jour du Frontend

Une fois le backend déployé, vous devez mettre à jour votre frontend sur Vercel:

1. Allez dans [vos paramètres de projet Vercel](https://vercel.com/seiyar26s-projects/frontend/settings/environment-variables)
2. Mettez à jour la variable `REACT_APP_API_URL` avec l'URL de votre backend Railway
3. Redéployez le frontend en cliquant sur "Redeploy" dans l'interface Vercel

## Dépannage

Si vous rencontrez des problèmes:

1. Vérifiez les logs dans l'interface Railway
2. Assurez-vous que toutes les variables d'environnement sont correctement configurées
3. Vérifiez que la base de données Supabase est accessible depuis Railway

Pour toute aide supplémentaire, consulter la [documentation Railway](https://docs.railway.app/).
