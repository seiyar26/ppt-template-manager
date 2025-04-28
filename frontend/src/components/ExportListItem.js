import React from 'react';

const ExportListItem = ({ exportData, onDownload, onDelete, onSendEmail, t }) => {
  // Formatter la date d'export
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatter la taille du fichier
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes) || bytes === 0) return '0 Ko';
    
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <tr className="hover:bg-gray-50">
      {/* Nom du fichier avec badge de format */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            {exportData.format === 'pptx' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                PPTX
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                PDF
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-gray-900">
            {exportData.file_name}
          </div>
        </div>
      </td>
      
      {/* Date d'export */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(exportData.export_date)}
      </td>
      
      {/* Format */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {exportData.format?.toUpperCase() || '-'}
      </td>
      
      {/* Taille de fichier */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatFileSize(exportData.file_size)}
      </td>
      
      {/* Nombre de téléchargements */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {exportData.download_count || 0}
      </td>
      
      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex space-x-2 justify-end">
          <button
            onClick={() => onDownload(exportData)}
            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
            title={t.downloadFile}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={() => onSendEmail(exportData)}
            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
            title={t.sendByEmail}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(exportData)}
            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
            title={t.delete}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ExportListItem;