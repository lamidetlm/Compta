import React from 'react';
import { FolderIcon, TableCellsIcon } from '@heroicons/react/24/outline';

function GoogleLinks({ driveRootUrl, sheetsUrl }) {
  if (!driveRootUrl && !sheetsUrl) return null;

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">
        Liens rapides
      </h2>
      <div className="flex space-x-4">
        {driveRootUrl && (
          <a
            href={driveRootUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FolderIcon className="h-5 w-5 mr-2 text-gray-500" />
            Dossier Google Drive
          </a>
        )}
        {sheetsUrl && (
          <a
            href={sheetsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <TableCellsIcon className="h-5 w-5 mr-2 text-gray-500" />
            Google Sheets
          </a>
        )}
      </div>
    </div>
  );
}

export default GoogleLinks;
