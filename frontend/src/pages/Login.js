import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { ELLY_COLORS } from '../App';
import { useTranslation } from '../context/TranslationContext';
import testAuth from '../test-auth';
import config from '../config/env';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const { login, error, loading } = useContext(AuthContext);
  const t = useTranslation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    try {
      console.log('Formulaire soumis avec:', { email: formData.email });
      
      // Utiliser la fonction login du contexte
      await login(formData);
      
      // La redirection sera gérée par le contexte après un login réussi
    } catch (err) {
      console.error('Erreur capturée dans Login.js:', err);
      if (err.message === 'Network Error' || err.message === 'Failed to fetch') {
        setFormError(`Erreur de connexion: Le serveur backend n'est pas disponible. Vérifiez que le serveur est bien démarré sur le port ${config.apiPort}.`);
      } else {
        setFormError(err.message || 'Identifiants invalides');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" 
         style={{ backgroundColor: ELLY_COLORS.tertiary }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img 
          src="https://replicate.delivery/xezq/wsG97dDR16JPNd8qqyIOXDH1jTQ8tjNkNNeE1VxMWbpFiKTKA/tmp2uw89qhv.png" 
          alt="Elly PPT Manager" 
          className="h-20 mx-auto mb-6" 
        />
        <h2 className="text-center text-3xl font-extrabold" style={{ color: ELLY_COLORS.primary }}>
          {t.loginTitle || 'Connexion à votre compte'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {(formError || error) && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-medium">Erreur de connexion :</p>
              <p>{formError || error}</p>
              <p className="text-xs mt-1">Vérifiez que le serveur backend est bien démarré sur le port {config.apiPort}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t.emailAddress || 'Adresse email'}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm"
                  style={{ 
                    ':focus': { 
                      borderColor: ELLY_COLORS.primary,
                      boxShadow: `0 0 0 3px ${ELLY_COLORS.accent}` 
                    } 
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t.password || 'Mot de passe'}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm"
                  style={{
                    '::placeholder': { color: '#A0AEC0' },
                    ':focus': { 
                      borderColor: ELLY_COLORS.primary,
                      boxShadow: `0 0 0 3px ${ELLY_COLORS.accent}` 
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                style={{ 
                  backgroundColor: loading ? ELLY_COLORS.secondary : ELLY_COLORS.primary, 
                  borderColor: ELLY_COLORS.primary,
                  cursor: loading ? 'wait' : 'pointer'
                }}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-100 focus:ring-blue-500 transition-opacity duration-200"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion en cours...
                  </>
                ) : (t.login || 'Se connecter')}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={testAuth}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {t.alternativeLogin || 'Méthode de connexion alternative'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;