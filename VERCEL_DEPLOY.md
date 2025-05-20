# Déploiement sur Vercel

Ce guide explique comment déployer PPT Template Manager sur Vercel.

## Prérequis

- Compte Vercel (https://vercel.com/signup)
- Node.js 14+ et npm installés
- Compte Supabase (pour la base de données)
- Vercel CLI (sera installé automatiquement si nécessaire)

## Configuration requise

### 1. Base de données

Créez une base de données PostgreSQL sur Supabase :

1. Allez sur https://supabase.com et créez un nouveau projet
2. Une fois le projet créé, allez dans l'onglet "SQL Editor"
3. Exécutez le script SQL fourni dans `supabase-schema.sql`
4. Notez les informations de connexion dans la section "Project Settings" > "Database"

### 2. Configuration des variables d'environnement

Copiez le fichier `.env.example` vers `.env` et remplissez les valeurs :

```bash
cp .env.example .env
```

Remplissez les variables suivantes :

- `DATABASE_URL`: URL de connexion à votre base de données PostgreSQL
- `JWT_SECRET`: Une clé secrète pour signer les tokens JWT
- `NEXT_PUBLIC_SUPABASE_URL`: URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clé anonyme de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Clé de service Supabase (optionnel, pour les opérations admin)

## Déploiement

### Option 1 : Utilisation du script de déploiement (recommandé)

1. Rendez le script exécutable :
   ```bash
   chmod +x vercel-deploy.sh
   ```

2. Exécutez le script :
   ```bash
   ./vercel-deploy.sh
   ```

Le script va :
1. Vérifier les dépendances
2. Vérifier les variables d'environnement
3. Construire l'application
4. Vous guider à travers le processus de déploiement

### Option 2 : Déploiement manuel

1. Installez Vercel CLI si ce n'est pas déjà fait :
   ```bash
   npm install -g vercel
   ```

2. Construisez l'application :
   ```bash
   # À la racine du projet
   npm install
   
   # Dans le dossier frontend
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. Déployez sur Vercel :
   ```bash
   vercel --prod
   ```

## Configuration Vercel

### Variables d'environnement

Assurez-vous que toutes les variables du fichier `.env` sont configurées dans les paramètres de votre projet Vercel :

1. Allez sur le tableau de bord Vercel
2. Sélectionnez votre projet
3. Allez dans "Settings" > "Environment Variables"
4. Ajoutez toutes les variables de `.env`

### Configuration du build

Les paramètres de build sont déjà configurés dans `vercel.json`. Aucune modification n'est nécessaire.

## Mise à jour du déploiement

Pour mettre à jour votre application :

1. Poussez vos modifications sur la branche principale
2. Vercel détectera automatiquement les changements et redéploiera l'application

Ou en utilisant Vercel CLI :
```bash
vercel --prod
```

## Dépannage

### Erreurs de base de données

- Vérifiez que `DATABASE_URL` est correctement configuré
- Assurez-vous que la base de données accepte les connexions depuis les adresses IP de Vercel

### Erreurs de build

- Vérifiez les logs de build dans le tableau de bord Vercel
- Assurez-vous que toutes les dépendances sont correctement installées

### Problèmes de CORS

- Vérifiez que `CORS_ORIGIN` est correctement configuré
- Assurez-vous que les URLs autorisées sont correctement définies dans Supabase

## Sécurité

- Ne partagez jamais vos clés secrètes
- Utilisez des variables d'environnement pour les informations sensibles
- Activez la vérification en deux étapes sur votre compte Vercel
- Limitez les permissions des clés d'API
