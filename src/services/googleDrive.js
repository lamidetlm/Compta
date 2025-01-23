import { authService } from './authService';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
];

class GoogleDriveService {
  constructor() {
    this.rootFolderName = 'Reçus';
  }

  async getAccessToken() {
    return await authService.getValidToken();
  }

  async getRootFolderId() {
    console.log('Recherche de l\'ID du dossier racine');
    
    try {
      const rootFolderId = await this.searchFolder(this.rootFolderName);
      return rootFolderId;
    } catch (error) {
      console.error('Erreur lors de la recherche du dossier racine:', error);
      return null;
    }
  }

  async searchFolder(folderName, parentId = null) {
    console.log(`Recherche du dossier "${folderName}"${parentId ? ` dans le dossier parent ${parentId}` : ''}`);
    
    try {
      const accessToken = await this.getAccessToken();
      const query = [
        "mimeType='application/vnd.google-apps.folder'",
        `name='${folderName}'`,
        "trashed=false"
      ];
      
      if (parentId) {
        query.push(`'${parentId}' in parents`);
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query.join(' and '))}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur lors de la recherche du dossier: ${error.error?.message || 'Erreur inconnue'}`);
      }

      const data = await response.json();
      console.log(`Résultats de la recherche pour "${folderName}":`, data);
      
      return data.files[0]?.id;
    } catch (error) {
      console.error('Erreur lors de la recherche du dossier:', error);
      throw error;
    }
  }

  async createFolder(folderName, parentId = null) {
    console.log(`Création du dossier "${folderName}"${parentId ? ` dans le dossier parent ${parentId}` : ''}`);
    
    try {
      const accessToken = await this.getAccessToken();
      const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentId) {
        metadata.parents = [parentId];
      }

      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metadata),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur lors de la création du dossier: ${error.error?.message || 'Erreur inconnue'}`);
      }

      const folder = await response.json();
      console.log(`Dossier "${folderName}" créé avec succès:`, folder);
      
      return folder.id;
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      throw error;
    }
  }

  async createFolderStructure(year, month) {
    console.log(`Création de la structure de dossiers pour ${month}/${year}`);

    try {
      // Recherche ou création du dossier racine
      let rootFolderId = await this.searchFolder(this.rootFolderName);
      if (!rootFolderId) {
        console.log('Dossier racine non trouvé, création...');
        rootFolderId = await this.createFolder(this.rootFolderName);
      }

      // Recherche ou création du dossier de l'année
      const yearFolderName = year.toString();
      let yearFolderId = await this.searchFolder(yearFolderName, rootFolderId);
      if (!yearFolderId) {
        console.log('Dossier année non trouvé, création...');
        yearFolderId = await this.createFolder(yearFolderName, rootFolderId);
      }

      // Recherche ou création du dossier du mois
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      const monthFolderName = monthNames[month - 1];
      let monthFolderId = await this.searchFolder(monthFolderName, yearFolderId);
      if (!monthFolderId) {
        console.log('Dossier mois non trouvé, création...');
        monthFolderId = await this.createFolder(monthFolderName, yearFolderId);
      }

      return monthFolderId;
    } catch (error) {
      console.error('Erreur lors de la création de la structure de dossiers:', error);
      throw new Error(`Erreur lors de la création de la structure de dossiers: ${error.message}`);
    }
  }

  async uploadFile(file, folderId, newFileName) {
    console.log(`Téléchargement du fichier "${newFileName}" vers le dossier ${folderId}`);
    
    try {
      const accessToken = await this.getAccessToken();
      
      // Étape 1 : Créer un fichier vide avec les métadonnées
      const metadata = {
        name: newFileName,
        parents: [folderId],
      };

      const metadataResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metadata),
        }
      );

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json();
        throw new Error(`Erreur lors de la création du fichier: ${error.error?.message || 'Erreur inconnue'}`);
      }

      const { id } = await metadataResponse.json();

      // Étape 2 : Télécharger le contenu du fichier
      const contentResponse = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': file.type,
          },
          body: file,
        }
      );

      if (!contentResponse.ok) {
        const error = await contentResponse.json();
        throw new Error(`Erreur lors du téléchargement du contenu: ${error.error?.message || 'Erreur inconnue'}`);
      }

      const uploadedFile = await contentResponse.json();
      console.log('Fichier téléchargé avec succès:', uploadedFile);
      
      return uploadedFile;
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      throw new Error(`Erreur lors du téléchargement du fichier: ${error.message}`);
    }
  }
}

export const driveService = new GoogleDriveService();
