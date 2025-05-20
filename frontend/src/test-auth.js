// Script de test pour résoudre les problèmes d'authentification
const testAuth = async () => {
  try {
    console.log('🔍 Test des problèmes d\'authentification');
    console.log('Tentative de connexion directe via fetch...');
    
    // Utiliser la configuration centralisée
    const config = require('./config/env').default;
    const API_URL = config.baseApiUrl();
    console.log('Utilisation de l\'URL API (via config):', API_URL);
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      }),
      credentials: 'include'
    });
    
    console.log('Statut de la réponse:', response.status);
    if (!response.ok) {
      console.error('Erreur de connexion:', response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('Réponse du serveur:', data);
    
    // Stocker le token et l'utilisateur dans localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      console.log('✅ Token stocké dans localStorage');
    }
    
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('✅ Utilisateur stocké dans localStorage');
    }
    
    // Rediriger vers la page des modèles
    console.log('Redirection vers /templates...');
    window.location.href = '/templates';
    
  } catch (error) {
    console.error('❌ Erreur lors du test d\'authentification:', error);
  }
};

// Fonction séparée pour créer le bouton (exécutée une seule fois)
let buttonAdded = false;
const addAdminButton = () => {
  // Vérifier si le bouton a déjà été ajouté pour éviter la duplication
  if (buttonAdded) return;
  
  // Créer un bouton de test dans l'interface
  const button = document.createElement('button');
  button.id = 'admin-direct-login'; // Ajouter un ID pour pouvoir le référencer facilement
  button.textContent = 'Connexion directe (Admin)';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '10px 15px';
  button.style.backgroundColor = '#4f46e5';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  
  button.onclick = testAuth;
  
  document.body.appendChild(button);
  buttonAdded = true;
  console.log('Bouton de connexion admin ajouté à l\'interface');
};

// Exécuter seulement l'ajout du bouton au chargement de la page
window.addEventListener('DOMContentLoaded', addAdminButton);

export default testAuth;
