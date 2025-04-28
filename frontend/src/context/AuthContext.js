import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Le token est géré automatiquement par l'intercepteur du service API
  // Nous n'avons plus besoin de le configurer manuellement ici

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        console.log('Chargement des données utilisateur avec le token');
        const data = await authService.getCurrentUser();
        console.log('Données utilisateur reçues:', data);
        setUser(data.user);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement de l\'utilisateur:', err);
        console.error('Message d\'erreur:', err.message);
        setError('Échec de l\'authentification');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      console.log('Tentative d\'enregistrement...');
      
      const data = await authService.register(userData);
      console.log('Réponse d\'enregistrement:', data);
      
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setError(null);
      return data;
    } catch (err) {
      console.error('Erreur d\'enregistrement détaillée:', err);
      
      setError(err.response?.data?.message || 'Échec d\'enregistrement : ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Nous utilisons maintenant le service API centralisé qui gère les erreurs et les retries

  // Login user
  const login = async (userData) => {
    try {
      setLoading(true);
      console.log('Tentative de connexion...');
      console.log('Données envoyées:', { email: userData.email, password: '******' });
      
      const data = await authService.login(userData);
      console.log('Réponse de connexion:', data);
      
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setError(null);
      
      // Rediriger vers la page des modèles après une connexion réussie
      window.location.href = '/templates';
      
      return data;
    } catch (err) {
      console.error('Erreur de connexion détaillée:', err);
      console.error('Message d\'erreur:', err.message);
      
      setError(err.message || 'Échec de connexion');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    console.log('Déconnexion de l\'utilisateur');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    console.log('Déconnexion terminée avec succès');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;