import { authService } from './authService';

class GoogleSheetsService {
  constructor() {
    this.spreadsheetId = import.meta.env.VITE_GOOGLE_SHEETS_ID;
    this.sheetName = 'Reçus';
    this.userName = 'Kaiser';
    this.sheetId = null;
  }

  async getAccessToken() {
    return await authService.getValidToken();
  }

  async getSheetId() {
    if (this.sheetId !== null) {
      return this.sheetId;
    }

    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}?fields=sheets.properties`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Impossible de récupérer les informations de la feuille');
    }

    const data = await response.json();
    const sheet = data.sheets.find(s => s.properties.title === this.sheetName);
    if (!sheet) {
      throw new Error('Feuille non trouvée');
    }

    this.sheetId = sheet.properties.sheetId;
    return this.sheetId;
  }

  async initializeSheet() {
    try {
      const accessToken = await this.getAccessToken();
      
      // Vérifier si la feuille existe déjà
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}?ranges=${this.sheetName}&fields=sheets.properties`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.error.code === 404) {
          // La feuille n'existe pas, on la crée
          await this.createSheet();
          await this.initializeHeaders();
          await this.formatColumns();
        } else {
          throw new Error(`Erreur lors de la vérification de la feuille: ${error.error?.message || 'Erreur inconnue'}`);
        }
      } else {
        const data = await response.json();
        if (!data.sheets || data.sheets.length === 0) {
          // La feuille n'existe pas dans le classeur
          await this.createSheet();
          await this.initializeHeaders();
          await this.formatColumns();
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la feuille:', error);
      throw error;
    }
  }

  async createSheet() {
    console.log('Création de la feuille de calcul');
    
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: {
                    title: this.sheetName,
                  },
                },
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur lors de la création de la feuille: ${error.error?.message || 'Erreur inconnue'}`);
      }

      // Récupérer le nouveau sheetId
      await this.getSheetId();
      
      console.log('Feuille créée avec succès');
    } catch (error) {
      console.error('Erreur lors de la création de la feuille:', error);
      throw error;
    }
  }

  async formatColumns() {
    try {
      const accessToken = await this.getAccessToken();
      const sheetId = await this.getSheetId();
      
      // Formater les colonnes (date et montant)
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                // Format de la date (colonne A)
                repeatCell: {
                  range: {
                    sheetId: sheetId,
                    startColumnIndex: 0,
                    endColumnIndex: 1
                  },
                  cell: {
                    userEnteredFormat: {
                      numberFormat: {
                        type: 'DATE',
                        pattern: 'dd/MM/yyyy'
                      }
                    }
                  },
                  fields: 'userEnteredFormat.numberFormat'
                }
              },
              {
                // Format du montant (colonne D)
                repeatCell: {
                  range: {
                    sheetId: sheetId,
                    startColumnIndex: 3,
                    endColumnIndex: 4
                  },
                  cell: {
                    userEnteredFormat: {
                      numberFormat: {
                        type: 'NUMBER',
                        pattern: '#,##0.00\\ €'
                      }
                    }
                  },
                  fields: 'userEnteredFormat.numberFormat'
                }
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur lors du formatage des colonnes: ${error.error?.message || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur lors du formatage des colonnes:', error);
      throw error;
    }
  }

  async initializeHeaders() {
    console.log('Initialisation des en-têtes');
    
    try {
      const accessToken = await this.getAccessToken();
      const headers = [['Date', 'Nom', 'Fournisseur', 'Montant', 'Type de Dépense', 'Lien du Fichier']];
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}!A1:F1?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: headers,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur lors de l'initialisation des en-têtes: ${error.error?.message || 'Erreur inconnue'}`);
      }

      console.log('En-têtes initialisés avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des en-têtes:', error);
      throw error;
    }
  }

  formatDate(dateStr) {
    // Convertir la date au format DD/MM/YYYY
    const [day, month, year] = dateStr.split(/[-/]/).map(num => num.padStart(2, '0'));
    return `${day}/${month}/${year}`;
  }

  formatAmount(amount) {
    // Convertir le point en virgule et s'assurer que c'est un nombre
    return amount.toString().replace('.', ',');
  }

  async appendRow(rowData) {
    console.log('Ajout d\'une nouvelle ligne:', rowData);
    
    try {
      // Vérifier si la feuille existe et l'initialiser si nécessaire
      await this.initializeSheet();
      
      const [date, vendor, amount, type, fileUrl] = rowData;
      
      // Réorganiser les données selon le nouveau format
      const formattedRow = [
        this.formatDate(date),  // Date avec /
        this.userName,          // Nom (Kaiser)
        vendor,                 // Fournisseur
        this.formatAmount(amount), // Montant avec virgule
        type || '',            // Type de dépense
        fileUrl                // Lien du fichier
      ];

      const accessToken = await this.getAccessToken();
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}!A:F:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [formattedRow],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur lors de l'ajout de la ligne: ${error.error?.message || 'Erreur inconnue'}`);
      }

      // Appliquer le formatage après l'ajout de la ligne
      await this.formatColumns();

      console.log('Ligne ajoutée avec succès');
      return response.json();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la ligne:', error);
      throw error;
    }
  }
}

export const sheetsService = new GoogleSheetsService();
