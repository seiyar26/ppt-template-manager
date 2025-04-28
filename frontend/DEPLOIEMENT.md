# Guide de déploiement sur Vercel

Ce document explique comment déployer le frontend de PowerPoint Template Manager sur Vercel.

## Prérequis

- Un compte Vercel
- L'URL de votre backend (VPS) fonctionnel avec PostgreSQL et Supabase

## Étapes de déploiement

1. **Connectez-vous à Vercel** et créez un nouveau projet

2. **Importez votre dépôt Git** contenant le code du projet
   - Si vous n'utilisez pas Git, vous pouvez également déployer directement depuis votre dossier local

3. **Configuration du projet**
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Root Directory: `frontend` (si vous importez l'ensemble du projet)

4. **Variables d'environnement**
   Définissez les variables d'environnement suivantes dans les paramètres du projet Vercel :
   
   ```
   REACT_APP_API_URL=https://votre-vps.example.com/api
   REACT_APP_IMAGE_BASE_URL=https://votre-vps.example.com
   ```
   
   Si nécessaire, ajoutez également les variables Supabase :
   ```
   REACT_APP_SUPABASE_URL=https://votre-projet.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=votre-clé-anon
   ```

5. **Configuration CORS sur votre backend**
   Assurez-vous que votre backend autorise les requêtes depuis votre domaine Vercel :
   
   ```javascript
   app.use(cors({
     origin: ['https://votre-domaine-vercel.vercel.app', 'https://votre-domaine-personnalisé.com'],
     credentials: true
   }));
   ```

6. **Domaine personnalisé (optionnel)**
   - Dans les paramètres du projet Vercel, ajoutez votre domaine personnalisé
   - Suivez les instructions pour configurer les enregistrements DNS

## Problèmes courants

- **Erreurs CORS** : Vérifiez que votre backend autorise les requêtes depuis votre domaine Vercel
- **API non accessible** : Assurez-vous que l'URL de l'API est correctement configurée et accessible publiquement
- **Problèmes d'authentification** : Si vous utilisez des cookies pour l'authentification, assurez-vous que les paramètres CORS incluent `credentials: true`

## Mise à jour du déploiement

Chaque push sur la branche principale (ou la branche configurée) déclenchera automatiquement un nouveau déploiement sur Vercel.

Pour déployer manuellement une nouvelle version :
1. Accédez à votre projet sur le dashboard Vercel
2. Cliquez sur "Deployments" puis "Deploy"
