/**
 * Redimensionne une image pour qu'elle fasse moins de 1 Mo
 * @param {File} file - Le fichier image original
 * @returns {Promise<Blob>} - L'image redimensionnée
 */
export const resizeImage = async (file) => {
  const MAX_FILE_SIZE = 1024 * 1024; // 1 Mo en bytes
  
  // Vérifier que c'est bien une image
  if (!file.type.startsWith('image/')) {
    return file;
  }
  
  // Si l'image fait déjà moins de 1 Mo, on la retourne telle quelle
  if (file.size <= MAX_FILE_SIZE) {
    return file;
  }

  try {
    // Créer un objet URL pour l'image
    const imageBitmap = await createImageBitmap(file);
    
    // Calculer le ratio de redimensionnement nécessaire
    const ratio = Math.sqrt(MAX_FILE_SIZE / file.size);
    
    // Calculer les nouvelles dimensions
    const newWidth = Math.floor(imageBitmap.width * ratio);
    const newHeight = Math.floor(imageBitmap.height * ratio);

    // Créer un canvas pour le redimensionnement
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Dessiner l'image redimensionnée
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);
    
    // Convertir le canvas en blob avec une qualité ajustée
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        // Créer un nouveau File object avec le même nom et type
        const resizedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: file.lastModified
        });
        resolve(resizedFile);
      }, file.type, 0.9); // Qualité de 0.9 pour maintenir une bonne qualité
    });
  } catch (error) {
    console.error('Erreur lors du redimensionnement:', error);
    return file; // En cas d'erreur, retourner le fichier original
  }
};
