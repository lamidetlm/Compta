import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import ReceiptUploader from './components/ReceiptUploader';
import { DocumentProcessingProvider } from './context/DocumentProcessingContext';
import { authService } from './services/authService';

function App() {
  const [accessToken, setAccessToken] = useState(null);

  const handleLogin = (token) => {
    setAccessToken(token);
  };

  const handleLogout = () => {
    authService.logout();
    setAccessToken(null);
  };

  if (!accessToken) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <DocumentProcessingProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header avec bouton de déconnexion */}
          <div className="px-4 py-4 sm:px-0 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Gestion des Reçus</h1>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Se déconnecter
            </button>
          </div>
          
          {/* Contenu principal */}
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-4">
              <ReceiptUploader accessToken={accessToken} />
            </div>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </DocumentProcessingProvider>
  );
}

export default App;
