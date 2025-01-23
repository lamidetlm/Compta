const STORAGE_KEY = 'google_auth';
const TOKEN_EXPIRY_MARGIN = 5 * 60 * 1000; // 5 minutes en millisecondes

class AuthService {
  constructor() {
    this.tokenClient = null;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.isInitializing = false;
    this.initPromise = null;
  }

  async loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async initialize() {
    if (this.isInitializing) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        // Charger l'API Google si elle n'est pas déjà chargée
        if (!window.google) {
          await this.loadGoogleAPI();
        }

        // Attendre que l'API soit complètement chargée
        while (!window.google?.accounts?.oauth2) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Charger les données d'authentification stockées
        const storedAuth = localStorage.getItem(STORAGE_KEY);
        if (storedAuth) {
          const { accessToken, expiry } = JSON.parse(storedAuth);
          // Vérifier si le token n'est pas expiré
          if (expiry && new Date(expiry).getTime() - TOKEN_EXPIRY_MARGIN > Date.now()) {
            this.accessToken = accessToken;
            this.tokenExpiry = new Date(expiry);
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        return false;
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  async initializeGoogleAuth() {
    if (!this.tokenClient) {
      return new Promise((resolve) => {
        if (!window.google?.accounts?.oauth2) {
          console.error('L\'API Google n\'est pas chargée');
          resolve(null);
          return;
        }

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
          callback: (response) => {
            if (response.access_token) {
              this.setSession(response);
              resolve(response.access_token);
            } else {
              resolve(null);
            }
          },
          error_callback: (error) => {
            console.error('Erreur lors de l\'authentification Google:', error);
            resolve(null);
          }
        });
        resolve(null);
      });
    }
  }

  setSession(response) {
    const expiryDate = new Date(Date.now() + response.expires_in * 1000);
    this.accessToken = response.access_token;
    this.tokenExpiry = expiryDate;

    // Sauvegarder dans le localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accessToken: response.access_token,
      expiry: expiryDate.toISOString(),
    }));

    // Mettre à jour les services qui utilisent le token
    import('./googleDrive.js').then(({ driveService }) => {
      driveService.setAccessToken(response.access_token);
    });
  }

  async getValidToken() {
    // S'assurer que l'API est initialisée
    await this.initialize();

    // Si nous n'avons pas de token ou s'il est sur le point d'expirer
    if (!this.accessToken || !this.tokenExpiry || 
        this.tokenExpiry.getTime() - TOKEN_EXPIRY_MARGIN < Date.now()) {
      await this.initializeGoogleAuth();
      if (!this.tokenClient) {
        throw new Error('Impossible d\'initialiser le client Google');
      }
      return new Promise((resolve) => {
        this.tokenClient.requestAccessToken({ prompt: '' });
        const checkToken = setInterval(() => {
          if (this.accessToken) {
            clearInterval(checkToken);
            resolve(this.accessToken);
          }
        }, 100);
      });
    }
    return this.accessToken;
  }

  async login() {
    try {
      // S'assurer que l'API est initialisée
      await this.initialize();
      await this.initializeGoogleAuth();
      
      if (!this.tokenClient) {
        throw new Error('Impossible d\'initialiser le client Google');
      }

      return new Promise((resolve, reject) => {
        this.tokenClient.requestAccessToken({
          prompt: 'consent',
          error_callback: reject
        });

        const checkToken = setInterval(() => {
          if (this.accessToken) {
            clearInterval(checkToken);
            resolve(this.accessToken);
          }
        }, 100);

        // Timeout après 30 secondes
        setTimeout(() => {
          clearInterval(checkToken);
          reject(new Error('Délai d\'attente dépassé pour la connexion'));
        }, 30000);
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  logout() {
    if (this.accessToken && window.google?.accounts?.oauth2) {
      google.accounts.oauth2.revoke(this.accessToken, () => {});
    }
    this.accessToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  isAuthenticated() {
    return !!this.accessToken && this.tokenExpiry && 
           this.tokenExpiry.getTime() - TOKEN_EXPIRY_MARGIN > Date.now();
  }
}

export const authService = new AuthService();
