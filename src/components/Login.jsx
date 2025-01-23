import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

function Login({ onLogin }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Vérifier s'il y a une session existante
        const isAuthenticated = await authService.initialize();
        if (isAuthenticated) {
          const token = await authService.getValidToken();
          onLogin(token);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setError('Erreur lors de l\'initialisation de l\'authentification');
        toast.error('Erreur lors de l\'initialisation de l\'authentification');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [onLogin]);

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const token = await authService.login();
      if (token) {
        onLogin(token);
      } else {
        throw new Error('Échec de la connexion');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur lors de la connexion. Veuillez réessayer.');
      toast.error('Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Gestion des Reçus
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous avec votre compte Google pour commencer
          </p>
          {error && (
            <p className="mt-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
        <div>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
              isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-blue-500 group-hover:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
            </span>
            {isLoading ? 'Connexion en cours...' : 'Se connecter avec Google'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
