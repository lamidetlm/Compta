import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

function DataPreview({ data }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircleIcon className="h-6 w-6 text-green-500" />
        <h3 className="text-lg font-medium text-gray-900">Processing Complete</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Date</p>
          <p className="mt-1 text-sm text-gray-900">{data.date}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Vendor</p>
          <p className="mt-1 text-sm text-gray-900">{data.vendor}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Amount</p>
          <p className="mt-1 text-sm text-gray-900">{data.amount}€</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">File</p>
          <a
            href={data.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-sm text-blue-600 hover:text-blue-500"
          >
            View in Google Drive
          </a>
        </div>
      </div>
    </div>
  );
}

export default DataPreview;
