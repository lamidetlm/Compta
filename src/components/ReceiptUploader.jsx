import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useDocumentProcessing } from '../context/DocumentProcessingContext';
import { analyzeReceipt } from '../services/ocrSpace';
import { driveService } from '../services/googleDrive';
import { sheetsService } from '../services/googleSheets';
import ProcessingStatus from './ProcessingStatus';
import DataPreview from './DataPreview';
import DataEditor from './DataEditor';
import GoogleLinks from './GoogleLinks';
import { resizeImage } from '../utils/imageUtils';

function ReceiptUploader({ accessToken }) {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [driveRootUrl, setDriveRootUrl] = useState(null);
  const [sheetsUrl, setSheetsUrl] = useState(null);
  const { processingState, updateProcessingState } = useDocumentProcessing();

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        // Récupérer l'URL du dossier racine
        const rootFolderId = await driveService.getRootFolderId(accessToken);
        if (rootFolderId) {
          setDriveRootUrl(`https://drive.google.com/drive/folders/${rootFolderId}`);
        }

        // Récupérer l'URL du Google Sheets
        const sheetsId = sheetsService.spreadsheetId;
        if (sheetsId) {
          setSheetsUrl(`https://docs.google.com/spreadsheets/d/${sheetsId}/edit`);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des URLs:', error);
      }
    };

    if (accessToken) {
      fetchUrls();
    }
  }, [accessToken]);

  const processReceipt = async (data) => {
    try {
      updateProcessingState({
        isProcessing: true,
        currentStep: 'Création des dossiers dans Google Drive...',
        error: null,
      });

      // Format the filename
      const date = new Date(data.date.split('-').reverse().join('-'));
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
      const newFileName = `${formattedDate}_${data.amount}€_${data.vendor}${file.name.substring(file.name.lastIndexOf('.'))}`;

      // Create folder structure
      const folderId = await driveService.createFolderStructure(date.getFullYear(), date.getMonth() + 1);

      // Upload to Google Drive
      updateProcessingState({ currentStep: 'Téléchargement vers Google Drive...' });
      const uploadedFile = await driveService.uploadFile(file, folderId, newFileName);

      // Update Google Sheets
      updateProcessingState({ currentStep: 'Mise à jour du tableur...' });
      await sheetsService.appendRow([
        formattedDate,
        data.vendor,
        data.amount,
        data.type || '', // Type de dépense
        `https://drive.google.com/file/d/${uploadedFile.id}/view`,
      ]);

      updateProcessingState({
        isProcessing: false,
        currentStep: null,
        extractedData: {
          date: formattedDate,
          vendor: data.vendor,
          amount: data.amount,
          type: data.type,
          fileUrl: `https://drive.google.com/file/d/${uploadedFile.id}/view`,
        },
      });

      setFile(null);
      setExtractedData(null);
      setIsEditing(false);
      toast.success('Reçu traité avec succès !');
    } catch (error) {
      console.error('Erreur lors du traitement du reçu:', error);
      updateProcessingState({
        isProcessing: false,
        currentStep: null,
        error: error.message,
      });
      toast.error('Erreur lors du traitement du reçu');
    }
  };
  
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);
    updateProcessingState({
      isProcessing: true,
      currentStep: 'Analyse du document...',
      extractedData: null,
      error: null,
    });

    try {
      // Redimensionner l'image si nécessaire
      const processedFile = await resizeImage(file);
      
      // Analyze the receipt
      const result = await analyzeReceipt(processedFile);
      
      if (!result.success) {
        throw new Error('Échec de l\'extraction des données du reçu');
      }

      setExtractedData({
        date: result.date,
        vendor: result.merchantName,
        amount: result.total,
        type: '',
        vendorSuggestions: result.merchantNames || []
      });
      setIsEditing(true);
      updateProcessingState({
        isProcessing: false,
        currentStep: null,
        error: null,
      });
    } catch (error) {
      console.error('Erreur lors de l\'analyse du reçu:', error);
      updateProcessingState({
        isProcessing: false,
        currentStep: null,
        error: error.message,
      });
      toast.error('Erreur lors de l\'analyse du reçu');
    }
  }, [updateProcessingState]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-6">
      <GoogleLinks driveRootUrl={driveRootUrl} sheetsUrl={sheetsUrl} />
      
      {!isEditing && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="space-y-1">
              <p className="text-gray-500">
                {isDragActive
                  ? 'Déposez le reçu ici...'
                  : 'Glissez-déposez un reçu, ou cliquez pour sélectionner'}
              </p>
              <p className="text-sm text-gray-400">Fichiers PDF, JPG ou PNG</p>
            </div>
          </div>
        </div>
      )}

      {file && !processingState.error && !isEditing && (
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-gray-400" />
            <span className="text-sm text-gray-600">{file.name}</span>
          </div>
        </div>
      )}

      {processingState.isProcessing && (
        <ProcessingStatus step={processingState.currentStep} />
      )}

      {isEditing && extractedData && (
        <DataEditor
          initialData={extractedData}
          file={file}
          vendorSuggestions={extractedData.vendorSuggestions}
          onSave={processReceipt}
          onCancel={() => {
            setIsEditing(false);
            setFile(null);
            setExtractedData(null);
          }}
        />
      )}

      {processingState.extractedData && !isEditing && (
        <DataPreview data={processingState.extractedData} />
      )}

      {processingState.error && (
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600">{processingState.error}</p>
        </div>
      )}
    </div>
  );
}

export default ReceiptUploader;
