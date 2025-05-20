# Script de Redéploiement Automatisé

Ce script permet de redéployer facilement l'application PPT Template Manager sur Render.com. Il gère le redémarrage séquentiel du backend et du frontend, avec des vérifications d'état.

## Prérequis

- Un système Unix-like (Linux, macOS, WSL)
- `curl` pour les requêtes HTTP
- `jq` pour le traitement JSON (sera installé automatiquement si nécessaire)
- Une clé API Render avec les permissions nécessaires

## Configuration

1. Rendez le script exécutable :
   ```bash
   chmod +x redeploy-render.sh
   ```

2. Modifiez les variables suivantes dans le script si nécessaire :
   - `RENDER_API_KEY` : Votre clé API Render (à remplacer)
   - `SERVICE_BACKEND` : Le nom de votre service backend sur Render
   - `SERVICE_FRONTEND` : Le nom de votre service frontend sur Render

## Utilisation

Exécutez simplement le script :

```bash
./redeploy-render.sh
```

Le script va :
1. Vérifier les dépendances
2. Redémarrer le service backend
3. Attendre que le backend soit opérationnel
4. Redémarrer le service frontend
5. Vérifier que tout est en ligne
6. Afficher les URLs des services

## Dépannage

- **Erreur d'authentification** : Vérifiez que votre clé API est valide et a les bonnes permissions
- **Service introuvable** : Vérifiez les noms des services dans le script
- **Échec du déploiement** : Consultez les logs sur le dashboard Render pour plus de détails

## Sécurité

- Ne partagez jamais votre clé API
- Conservez ce fichier dans un endroit sécurisé
- Utilisez des variables d'environnement pour les informations sensibles en production
