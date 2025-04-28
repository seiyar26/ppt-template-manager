import React, { useState, useEffect } from 'react';
import { ELLY_COLORS } from '../App';

const EmailModal = ({ isOpen, onClose, onSubmit, t, exportData, emailTemplates }) => {
  const [recipients, setRecipients] = useState(['']);
  const [cc, setCc] = useState(['']);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [attachments, setAttachments] = useState([]);
  const [showCc, setShowCc] = useState(false);
  
  // Initialiser le formulaire avec le modèle d'email par défaut
  useEffect(() => {
    if (isOpen && exportData) {
      // Définir un sujet par défaut basé sur le document exporté
      setSubject(`Document ${exportData.file_name || 'PowerPoint'} disponible`);
      
      // Construire un message par défaut
      const defaultMessage = `Bonjour,

Veuillez trouver ci-joint le document "${exportData.file_name || 'PowerPoint'}" généré le ${new Date(exportData.export_date).toLocaleDateString('fr-FR')}.

Cordialement,
L'équipe Elly Energie`;
      
      setMessage(defaultMessage);
      
      // Définir la pièce jointe par défaut (le document exporté)
      setAttachments([{
        id: 'exported-doc',
        name: exportData.file_name,
        type: exportData.format === 'pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 'application/pdf',
        path: exportData.file_path,
        size: exportData.file_size || 0,
        isDefault: true
      }]);
    }
  }, [isOpen, exportData]);
  
  // Appliquer un modèle d'email
  const applyTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    
    if (templateId === 'default') {
      // Réinitialiser au modèle par défaut
      if (exportData) {
        setSubject(`Document ${exportData.file_name || 'PowerPoint'} disponible`);
        
        const defaultMessage = `Bonjour,

Veuillez trouver ci-joint le document "${exportData.file_name || 'PowerPoint'}" généré le ${new Date(exportData.export_date).toLocaleDateString('fr-FR')}.

Cordialement,
L'équipe Elly Energie`;
        
        setMessage(defaultMessage);
      }
    } else if (emailTemplates && emailTemplates[templateId]) {
      // Appliquer le modèle sélectionné
      const template = emailTemplates[templateId];
      setSubject(template.subject);
      
      // Remplacer les variables dans le modèle
      let templateMessage = template.message;
      if (exportData) {
        templateMessage = templateMessage
          .replace('{{document_name}}', exportData.file_name || 'document')
          .replace('{{export_date}}', new Date(exportData.export_date).toLocaleDateString('fr-FR'))
          .replace('{{template_name}}', exportData.Template?.name || 'modèle');
      }
      
      setMessage(templateMessage);
    }
  };

  if (!isOpen) return null;

  const handleAddRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const handleRecipientChange = (index, value) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const handleRemoveRecipient = (index) => {
    if (recipients.length === 1) return;
    const newRecipients = [...recipients];
    newRecipients.splice(index, 1);
    setRecipients(newRecipients);
  };
  
  const handleAddCc = () => {
    setCc([...cc, '']);
  };

  const handleCcChange = (index, value) => {
    const newCc = [...cc];
    newCc[index] = value;
    setCc(newCc);
  };

  const handleRemoveCc = (index) => {
    if (cc.length === 1) return;
    const newCc = [...cc];
    newCc.splice(index, 1);
    setCc(newCc);
  };
  
  const handleAddAttachment = () => {
    // Simuler un clic sur l'input de fichier
    document.getElementById('email-attachment').click();
  };
  
  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Limiter la taille totale des pièces jointes (par exemple, 10 Mo)
    const maxSize = 10 * 1024 * 1024; // 10 Mo
    const currentSize = attachments.reduce((sum, att) => sum + (att.size || 0), 0);
    
    const newAttachments = files.map(file => ({
      id: `att-${Date.now()}-${file.name}`,
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
      isDefault: false
    }));
    
    const newTotalSize = newAttachments.reduce((sum, att) => sum + att.size, 0) + currentSize;
    
    if (newTotalSize > maxSize) {
      setError(`La taille totale des pièces jointes ne doit pas dépasser 10 Mo`);
      return;
    }
    
    setAttachments([...attachments, ...newAttachments]);
    // Réinitialiser l'input pour permettre de sélectionner à nouveau le même fichier
    e.target.value = '';
  };
  
  const handleRemoveAttachment = (id) => {
    // Ne pas permettre la suppression de la pièce jointe par défaut (le document exporté)
    const attachment = attachments.find(att => att.id === id);
    if (attachment && attachment.isDefault) {
      setError('Vous ne pouvez pas supprimer la pièce jointe principale');
      return;
    }
    
    setAttachments(attachments.filter(att => att.id !== id));
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Valider les emails principaux
    const validRecipients = recipients.filter(r => r.trim() !== '');
    
    if (validRecipients.length === 0) {
      setError('Veuillez ajouter au moins un destinataire');
      return;
    }
    
    for (const email of validRecipients) {
      if (!validateEmail(email)) {
        setError(`L'adresse email "${email}" n'est pas valide`);
        return;
      }
    }
    
    // Valider les emails en CC
    const validCc = cc.filter(c => c.trim() !== '');
    for (const email of validCc) {
      if (!validateEmail(email)) {
        setError(`L'adresse CC "${email}" n'est pas valide`);
        return;
      }
    }
    
    // Soumettre le formulaire
    onSubmit({
      recipients: validRecipients,
      cc: validCc,
      subject,
      message,
      attachments
    });
    
    // Réinitialiser le formulaire
    setRecipients(['']);
    setCc(['']);
    setSubject('');
    setMessage('');
    setAttachments([]);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center" style={{ backgroundColor: ELLY_COLORS.primary, color: 'white' }}>
          <h3 className="text-lg font-medium">Envoyer par email</h3>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {emailTemplates && emailTemplates.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modèle d'email
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => applyTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">Modèle par défaut</option>
                  {Object.keys(emailTemplates).map(key => (
                    <option key={key} value={key}>{emailTemplates[key].name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destinataires
              </label>
              {recipients.map((recipient, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="email"
                    value={recipient}
                    onChange={(e) => handleRecipientChange(index, e.target.value)}
                    placeholder="exemple@email.com"
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {recipients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddRecipient}
                className="mt-1 text-sm text-blue-600 hover:text-blue-800"
              >
                + Ajouter un destinataire
              </button>
            </div>
            
            <div className="mb-4">
              {!showCc ? (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Ajouter CC
                </button>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CC
                  </label>
                  {cc.map((ccEmail, index) => (
                    <div key={index} className="flex mb-2">
                      <input
                        type="email"
                        value={ccEmail}
                        onChange={(e) => handleCcChange(index, e.target.value)}
                        placeholder="cc@email.com"
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {cc.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCc(index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddCc}
                    className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Ajouter un CC
                  </button>
                </>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objet
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pièces jointes
              </label>
              <div className="bg-gray-50 p-3 rounded border border-gray-300">
                {attachments.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune pièce jointe</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {attachments.map(attachment => (
                      <li key={attachment.id} className="py-2 flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="text-sm font-medium">{attachment.name}</span>
                          {attachment.isDefault && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Document principal</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className={`text-red-600 hover:text-red-800 ${attachment.isDefault ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={attachment.isDefault}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <input
                  id="email-attachment"
                  type="file"
                  multiple
                  onChange={handleAttachmentChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="mt-3 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Ajouter une pièce jointe
                </button>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{ backgroundColor: ELLY_COLORS.primary, borderColor: ELLY_COLORS.primary }}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailModal;