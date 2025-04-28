import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/TranslationContext';
import ExportListItem from '../components/ExportListItem';
import EmailModal from '../components/EmailModal';
import FilterPanel from '../components/ExportFilterPanel';
import { exportService, templateService, emailService } from '../services/api';

const ExportHistory = () => {
  const translations = useTranslation();
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [filters, setFilters] = useState({
    format: '',
    templateId: '',
    startDate: '',
    endDate: '',
    sort: 'desc',
    limit: 50,
    offset: 0
  });
  const [selectedExport, setSelectedExport] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [emailTemplates] = useState({
    template1: {
      name: "Envoi standard",
      subject: "Document PowerPoint à consulter",
      message: "Bonjour,\n\nVeuillez trouver ci-joint le document \"{{document_name}}\" généré le {{export_date}} à partir du modèle \"{{template_name}}\".\n\nN'hésitez pas à me contacter pour toute question.\n\nCordialement,\nELLY Energie"
    },
    template2: {
      name: "Présentation client",
      subject: "Présentation ELLY Energie",
      message: "Bonjour,\n\nSuite à notre échange, je vous fais parvenir la présentation \"{{document_name}}\" que nous avons préparée spécialement pour vous.\n\nJe reste à votre disposition pour en discuter prochainement.\n\nBien cordialement,\nVotre conseiller ELLY Energie"
    }
  });

  // Charger les exports et les templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Construire les paramètres de requête pour les filtres
        const queryParams = {};
        if (filters.format) queryParams.format = filters.format;
        if (filters.templateId) queryParams.templateId = filters.templateId;
        if (filters.startDate) queryParams.startDate = filters.startDate;
        if (filters.endDate) queryParams.endDate = filters.endDate;
        queryParams.sort = filters.sort;
        queryParams.limit = filters.limit;
        queryParams.offset = filters.offset;
        
        // Récupérer les exports avec filtres en utilisant le service
        const exportsData = await exportService.getAllExports(queryParams);
        setExports(exportsData.exports || []);
        setTotalCount(exportsData.total || 0);
        
        // Récupérer les templates pour le filtre
        if (templates.length === 0) {
          const templatesData = await templateService.getAllTemplates();
          setTemplates(templatesData.templates || []);
        }
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des exports:', err);
        setError(err.message || translations.errorOccurred);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters, templates.length, translations]);

  // Gérer les changements de filtres
  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, offset: 0 }); // Réinitialiser l'offset lors d'un changement de filtre
  };

  // Gérer la pagination
  const handlePageChange = (newOffset) => {
    setFilters({ ...filters, offset: newOffset });
  };

  // Mettre à jour le compteur de téléchargement
  const handleDownload = async (exportData) => {
    try {
      // Télécharger l'export en utilisant le service
      const response = await exportService.downloadExport(exportData.id);
      
      // Créer un URL pour le blob et l'ouvrir dans un nouvel onglet
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', exportData.file_name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Mettre à jour l'affichage localement
      setExports(exports.map(e => 
        e.id === exportData.id 
          ? { ...e, download_count: (e.download_count || 0) + 1 } 
          : e
      ));
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      alert(translations.errorOccurred);
    }
  };

  // Supprimer un export
  const handleDelete = async (exportId) => {
    if (window.confirm(translations.confirmDeleteExport)) {
      try {
        await exportService.deleteExport(exportId);
        
        // Mettre à jour la liste après suppression
        setExports(exports.filter(e => e.id !== exportId));
        setTotalCount(prevCount => prevCount - 1);
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        alert(translations.errorOccurred);
      }
    }
  };

  // Ouvrir le modal d'email
  const handleOpenEmailModal = (exportData) => {
    setSelectedExport(exportData);
    setShowEmailModal(true);
  };

  // Envoyer un email
  const handleSendEmail = async (emailData) => {
    try {
      setLoading(true);
      console.log('Données d\'email à envoyer:', emailData);
      
      // Préparation des données d'email
      const formData = {
        to: emailData.to,
        cc: emailData.cc,
        subject: emailData.subject,
        message: emailData.message,
        attachments: emailData.attachments || []
      };
      
      // Ajout du template si sélectionné
      if (emailData.templateId) {
        formData.useTemplate = true;
        formData.templateId = emailData.templateId;
        formData.templatePath = `${emailData.templateId}.hbs`;
      }
      
      // Utiliser le nouveau service d'email pour l'envoi
      await emailService.sendEmail(selectedExport.id, formData);
      
      alert(translations.emailSent);
      setShowEmailModal(false);
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'email:', err);
      alert(err.message || translations.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  // Préparer les variables pour les modèles d'email
  const getEmailTemplateVariables = () => {
    if (!selectedExport) return {};
    
    const template = templates.find(t => t.id === selectedExport.template_id);
    const templateName = template ? template.name : '';
    
    const exportDate = new Date(selectedExport.export_date).toLocaleDateString('fr-FR');
    
    return {
      document_name: selectedExport.file_name || '',
      export_date: exportDate,
      template_name: templateName
    };
  };

  // Calculer le nombre de pages pour la pagination
  const totalPages = Math.ceil(totalCount / filters.limit);
  const currentPage = Math.floor(filters.offset / filters.limit) + 1;

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Si peu de pages, afficher toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Sinon, afficher un sous-ensemble avec des ellipses
      if (currentPage <= 3) {
        // Si on est près du début
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Si on est près de la fin
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Si on est au milieu
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-5">{translations.exportHistory}</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-5">
        <FilterPanel 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          templates={templates}
          t={translations}
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="loader"></div>
        </div>
      ) : exports.length > 0 ? (
        <>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.name}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.exportDate}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.format}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.fileSize}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.downloadCount}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exports.map(exportItem => (
                  <ExportListItem 
                    key={exportItem.id}
                    exportData={exportItem}
                    onDownload={() => handleDownload(exportItem)}
                    onDelete={() => handleDelete(exportItem.id)}
                    onSendEmail={() => handleOpenEmailModal(exportItem)}
                    t={translations}
                  />
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-5">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  &laquo;
                </button>
                
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (page !== '...') {
                        handlePageChange((page - 1) * filters.limit);
                      }
                    }}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      page === currentPage
                        ? 'text-white bg-blue-500'
                        : page === '...'
                        ? 'text-gray-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={page === '...'}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(filters.offset + filters.limit)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  &raquo;
                </button>
              </nav>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{translations.noResults}</p>
        </div>
      )}
      
      {/* Modal pour l'envoi d'email */}
      {showEmailModal && selectedExport && (
        <EmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSubmit={handleSendEmail}
          initialSubject=""
          initialMessage=""
          exportData={selectedExport}
          emailTemplates={emailTemplates}
          templateVariables={getEmailTemplateVariables()}
          t={translations}
        />
      )}
    </div>
  );
};

export default ExportHistory;