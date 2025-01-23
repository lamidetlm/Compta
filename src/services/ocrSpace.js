import axios from 'axios';

const OCR_API_URL = 'https://api.ocr.space/parse/image';

const extractVendorNames = (text) => {
  console.log('Extraction des noms de fournisseurs potentiels');
  
  // Liste des mots à ignorer
  const blacklist = ['facture', 'recu', 'ticket', 'total', 'ht', 'ttc', 'euros', 'eur', '€', 'tel', 'tva'];
  
  // Séparer le texte en lignes
  const lines = text.split('\n');
  
  // Trouver les lignes qui pourraient contenir le nom du fournisseur
  // Généralement dans les premières lignes du reçu
  const potentialVendors = lines
    .slice(0, 10) // Regarder les 10 premières lignes au lieu de 5
    .map(line => line.trim())
    .filter(line => {
      // Ignorer les lignes vides ou trop courtes
      if (!line || line.length < 2) return false;
      
      // Ignorer les lignes qui contiennent des mots de la blacklist
      const lowerLine = line.toLowerCase();
      if (blacklist.some(word => lowerLine.includes(word))) return false;
      
      // Ignorer les lignes qui sont principalement des chiffres
      const numberCount = (line.match(/\d/g) || []).length;
      if (numberCount > line.length / 3) return false;
      
      return true;
    })
    .map(line => {
      // Nettoyer la ligne
      return line
        .replace(/[^\w\s-]/g, '') // Enlever les caractères spéciaux sauf les tirets
        .replace(/\s+/g, ' ') // Normaliser les espaces
        .trim();
    })
    .filter(line => line.length >= 2); // Ignorer les lignes trop courtes après nettoyage

  console.log('Fournisseurs potentiels trouvés:', potentialVendors);
  
  return potentialVendors;
};

export const analyzeReceipt = async (file) => {
  try {
    console.log('Début de l\'analyse OCR pour le fichier:', file.name);
    
    // Convertir le fichier en base64
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Ajouter le préfixe data:image correct en fonction du type de fichier
        const prefix = `data:${file.type};base64,`;
        const base64 = reader.result.split(',')[1] || reader.result;
        resolve(prefix + base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const formData = new FormData();
    formData.append('apikey', import.meta.env.VITE_OCR_SPACE_API_KEY);
    formData.append('base64Image', base64Image);
    formData.append('language', 'fre');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('isTable', 'false');
    formData.append('OCREngine', '2');

    console.log('Envoi de la requête à OCR.space...');
    const response = await axios.post(OCR_API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Réponse reçue de OCR.space:', response.data);

    if (response.data.IsErroredOnProcessing) {
      throw new Error(response.data.ErrorMessage || 'Erreur lors du traitement OCR');
    }

    if (!response.data.ParsedResults || response.data.ParsedResults.length === 0) {
      throw new Error('Aucun texte n\'a pu être extrait de l\'image');
    }

    const text = response.data.ParsedResults[0].ParsedText;
    
    // Date: format JJ/MM/AAAA ou JJ-MM-AAAA
    const dateRegexes = [
      /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/g,  // Format JJ/MM/AAAA ou JJ-MM-AAAA
      /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/g,  // Format AAAA/MM/JJ ou AAAA-MM-JJ
      /(\d{1,2})\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s*(\d{4})/gi,  // Format texte
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/g,  // Format JJ.MM.AAAA
      /(\d{2})(\d{2})(\d{4})/g  // Format JJMMAAAA
    ];
    
    // Montant: recherche de motifs courants pour les montants en euros
    const amountRegexes = [
      /TOTAL\s*:?\s*(\d+[.,]\d{2})/gi,  // Format: TOTAL: XX.XX
      /MONTANT\s*:?\s*(\d+[.,]\d{2})/gi,  // Format: MONTANT: XX.XX
      /(\d+[.,]\d{2})\s*€/g,  // Format: XX.XX € ou XX,XX €
      /(\d+[.,]\d{2})\s*EUR/gi,  // Format: XX.XX EUR
      /€\s*(\d+[.,]\d{2})/g,  // Format: € XX.XX
      /(\d+[.,]\d{2})/g  // Dernier recours: tout nombre avec 2 décimales
    ];

    // Recherche de la date
    let dateMatch = null;
    for (const regex of dateRegexes) {
      const matches = text.matchAll(regex);
      for (const match of Array.from(matches)) {
        // Vérifier si la date est valide
        let day, month, year;
        if (match[0].toLowerCase().includes('janvier') || match[0].toLowerCase().includes('février')) {
          day = parseInt(match[1]);
          month = match[2].toLowerCase() === 'janvier' ? 1 : 2;
          year = parseInt(match[3]);
        } else {
          // Pour les formats numériques
          const [d, m, y] = [match[1], match[2], match[3]].map(n => parseInt(n));
          if (regex.toString().includes('AAAA')) {
            // Format AAAA/MM/JJ
            [year, month, day] = [y, m, d];
          } else {
            // Format JJ/MM/AAAA
            [day, month, year] = [d, m, y];
          }
        }

        // Vérifier si la date est valide
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          dateMatch = [match[0], day.toString().padStart(2, '0'), month.toString().padStart(2, '0'), year.toString()];
          break;
        }
      }
      if (dateMatch) break;
    }

    // Si aucune date n'est trouvée, utiliser la date du jour
    if (!dateMatch) {
      const today = new Date();
      dateMatch = [
        today.toLocaleDateString('fr-FR'),
        today.getDate().toString().padStart(2, '0'),
        (today.getMonth() + 1).toString().padStart(2, '0'),
        today.getFullYear().toString()
      ];
      console.log('Aucune date trouvée, utilisation de la date du jour:', dateMatch[0]);
    }

    // Recherche du montant
    let amountMatch = null;
    let highestAmount = 0;
    for (const regex of amountRegexes) {
      const matches = text.matchAll(regex);
      for (const match of Array.from(matches)) {
        const amount = parseFloat(match[1].replace(',', '.'));
        if (amount > highestAmount) {
          highestAmount = amount;
          amountMatch = match;
        }
      }
    }

    if (!amountMatch) {
      throw new Error('Impossible de trouver un montant valide dans le document');
    }

    // Extraire les noms de fournisseurs
    const vendorNames = extractVendorNames(text);

    console.log('Résultats de l\'analyse:', {
      dateMatch,
      amountMatch,
      vendorNames
    });

    if (!dateMatch) {
      throw new Error('Impossible de trouver une date valide dans le document');
    }
    if (!amountMatch) {
      throw new Error('Impossible de trouver un montant valide dans le document');
    }
    if (vendorNames.length === 0) {
      throw new Error('Impossible de trouver le nom du vendeur dans le document');
    }

    // Formatage de la date (JJ-MM-AAAA)
    let formattedDate;
    if (dateMatch[0].includes('/') || dateMatch[0].includes('-') || dateMatch[0].includes('.')) {
      // Format numérique
      formattedDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    } else {
      // Format texte
      const moisMap = {
        'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
        'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
        'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
      };
      const mois = moisMap[dateMatch[2].toLowerCase()] || dateMatch[2].padStart(2, '0');
      formattedDate = `${dateMatch[1]}-${mois}-${dateMatch[3]}`;
    }
    
    // Nettoyage du montant
    const amount = amountMatch[1].replace(',', '.');
    
    // Nettoyage du nom du vendeur
    const vendor = vendorNames[0]
      .trim()
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Permettre les tirets
      .replace(/\s+/g, ' ')
      .toUpperCase();

    console.log('Données extraites finales:', {
      date: formattedDate,
      amount,
      vendor,
      vendorNames
    });

    return {
      success: true,
      date: formattedDate,
      total: amount,
      merchantNames: vendorNames,
      merchantName: vendor,
      rawText: text
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse du reçu:', error);
    throw error; // Propager l'erreur pour une meilleure gestion
  }
};
