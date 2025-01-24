import React, { useState, useEffect } from 'react';

function DataEditor({ initialData, file, vendorSuggestions = [], onSave, onCancel }) {
  const [data, setData] = useState(initialData);
  const [customType, setCustomType] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
  const [isCustomVendor, setIsCustomVendor] = useState(false);

  useEffect(() => {
    if (file) {
      // Créer un aperçu pour les images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
      // Pour les PDF, on pourrait utiliser pdf.js pour générer un aperçu
      // Pour l'instant, on affiche juste une icône
    }
  }, [file]);

  const handleChange = (field, value) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeChange = (value) => {
    if (value === 'Autre') {
      setCustomType('');
    } else {
      setCustomType('');
      handleChange('type', value);
    }
  };

  const handleCustomTypeChange = (value) => {
    setCustomType(value);
    handleChange('type', value);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex flex-col md:flex-row">
        {/* Aperçu du document */}
        <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Aperçu du document</h3>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Aperçu du reçu"
                className="w-full h-auto max-h-[600px] object-contain"
              />
            ) : file?.type === 'application/pdf' ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">Fichier PDF</p>
                <p className="text-xs text-gray-400">{file.name}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-gray-500">Aucun aperçu disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Formulaire */}
        <div className="w-full md:w-1/2 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du reçu</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={data.date.split('-').reverse().join('-')}
                onChange={(e) => handleChange('date', e.target.value.split('-').reverse().join('-'))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">
                Fournisseur
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="vendor"
                  value={data.vendor}
                  onChange={(e) => {
                    handleChange('vendor', e.target.value);
                    setShowVendorSuggestions(true);
                  }}
                  onFocus={() => setShowVendorSuggestions(true)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {showVendorSuggestions && (vendorSuggestions.length > 0 || !isCustomVendor) && (
                  <div 
                    className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                  >
                    {vendorSuggestions.map((vendor, index) => (
                      <div
                        key={index}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
                        onClick={() => {
                          handleChange('vendor', vendor);
                          setShowVendorSuggestions(false);
                          setIsCustomVendor(false);
                        }}
                      >
                        <span className="block truncate">{vendor}</span>
                        {vendor === data.vendor && !isCustomVendor && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                    ))}
                    <div
                      className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 border-t border-gray-100"
                      onClick={() => {
                        setIsCustomVendor(true);
                        setShowVendorSuggestions(false);
                        handleChange('vendor', '');
                      }}
                    >
                      <span className="block truncate text-blue-600">Autre fournisseur...</span>
                    </div>
                  </div>
                )}
              </div>
              {isCustomVendor && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Entrez le nom du fournisseur"
                    value={data.vendor}
                    onChange={(e) => handleChange('vendor', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Montant (€)
              </label>
              <input
                type="number"
                id="amount"
                step="0.01"
                value={data.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type de dépense
              </label>
              <select
                id="type"
                value={data.type === customType ? 'Autre' : data.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Sélectionner un type</option>
                <option value="Fournitures">Fournitures</option>
                <option value="Services">Services</option>
                <option value="Transport">Transport</option>
                <option value="Repas">Repas</option>
                <option value="Hébergement">Hébergement</option>
                <option value="Autre">Autre</option>
              </select>
              {(data.type === customType || data.type === 'Autre') && (
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => handleCustomTypeChange(e.target.value)}
                  placeholder="Précisez le type de dépense"
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => onSave(data)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataEditor;
