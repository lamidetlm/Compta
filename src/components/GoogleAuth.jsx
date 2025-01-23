import React, { useEffect, useState } from 'react';

function GoogleAuth({ onAuthSuccess }) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    const initializeGoogleAuth = () => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/spreadsheets'
        ].join(' '),
        callback: (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            onAuthSuccess(tokenResponse.access_token);
          }
        },
      });

      // Créer un bouton de connexion personnalisé
      const button = document.getElementById('googleSignInButton');
      if (button) {
        button.onclick = () => {
          client.requestAccessToken();
        };
      }
    };

    // Charger le script Google Identity Services
    if (!isScriptLoaded) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsScriptLoaded(true);
        initializeGoogleAuth();
      };
      document.body.appendChild(script);
    } else {
      initializeGoogleAuth();
    }

    return () => {
      // Nettoyage
      const button = document.getElementById('googleSignInButton');
      if (button) {
        button.onclick = null;
      }
    };
  }, [onAuthSuccess, isScriptLoaded]);

  return (
    <div className="flex flex-col items-center space-y-4 p-8 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800">Connexion requise</h2>
      <p className="text-gray-600 text-center">
        Pour utiliser l'application de gestion des reçus, veuillez vous connecter avec votre compte Google
      </p>
      <button
        id="googleSignInButton"
        className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          className="w-4 h-4 mr-2"
        />
        Se connecter avec Google
      </button>
    </div>
  );
}

export default GoogleAuth;
