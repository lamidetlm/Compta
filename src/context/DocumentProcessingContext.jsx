import React, { createContext, useContext, useState } from 'react';

const DocumentProcessingContext = createContext();

export function DocumentProcessingProvider({ children }) {
  const [processingState, setProcessingState] = useState({
    isProcessing: false,
    currentStep: null,
    extractedData: null,
    error: null,
  });

  const updateProcessingState = (updates) => {
    setProcessingState((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  return (
    <DocumentProcessingContext.Provider
      value={{
        processingState,
        updateProcessingState,
      }}
    >
      {children}
    </DocumentProcessingContext.Provider>
  );
}

export function useDocumentProcessing() {
  const context = useContext(DocumentProcessingContext);
  if (!context) {
    throw new Error('useDocumentProcessing must be used within a DocumentProcessingProvider');
  }
  return context;
}
