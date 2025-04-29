import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, IMAGE_BASE_URL } from '../services/api';

const TemplateFill = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [format, setFormat] = useState('pdf');

  // Récupération des données du modèle
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        // Utilisation de l'instance apiClient pour inclure le token d'authentification
        const res = await apiClient.get(`templates/${id}`);
        console.log('Réponse API:', res.data);
        
        // Vérification de la structure de la réponse et récupération des données
        let templateData;
        
        if (res.data && res.data.template) {
          templateData = res.data.template;
        } else if (res.data) {
          // Si la réponse ne contient pas de propriété 'template', utiliser directement les données
          templateData = res.data;
        } else {
          throw new Error('Format de réponse invalide');
        }
        
        console.log('Données du modèle:', templateData);
        
        // Tri des diapositives si elles existent
        if (templateData && templateData.Slides && templateData.Slides.length > 0) {
          // Tri des diapositives par index
          const sortedSlides = [...templateData.Slides].sort(
            (a, b) => a.slide_index - b.slide_index
          );
          
          // Mise à jour du modèle avec les diapositives triées
          templateData = {
            ...templateData,
            Slides: sortedSlides
          };
        }
        
        // Définition du modèle une seule fois avec toutes les modifications
        setTemplate(templateData);
        
        // Initialisation des valeurs des champs avec les valeurs par défaut
        const initialValues = {};
        const fields = templateData.Fields || [];
        
        fields.forEach(field => {
          initialValues[field.name] = field.default_value || '';
        });
        
        setFieldValues(initialValues);
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement du modèle:', err);
        console.error('Message d\'erreur:', err.message);
        if (err.response) {
          console.error('Réponse d\'erreur:', err.response.data);
          console.error('Statut HTTP:', err.response.status);
          setError(`Impossible de charger le modèle: ${err.response.status} - ${err.response.data.message || err.message}`);
        } else if (err.request) {
          console.error('Aucune réponse reçue:', err.request);
          setError('Impossible de charger le modèle: Aucune réponse du serveur');
        } else {
          console.error('Erreur de configuration:', err.message);
          setError(`Impossible de charger le modèle: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id]);

  // Gestion du changement de valeur des champs
  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Pour les cases à cocher, utiliser la propriété checked
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFieldValues({
      ...fieldValues,
      [name]: fieldValue
    });
  };

  // Navigation vers la diapositive précédente
  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  // Navigation vers la diapositive suivante
  const handleNextSlide = () => {
    if (template && currentSlideIndex < template.Slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  // Génération du document
  const handleGenerate = async () => {
    try {
      // Demander le nom du document avant la génération
      const documentName = window.prompt("Veuillez nommer ce document pour l'historique des exports", template.name + " - " + new Date().toLocaleDateString('fr-FR'));
      
      // Si l'utilisateur annule, ne pas continuer
      if (documentName === null) return;
      
      setGenerating(true);
      console.log(`Génération du document au format: ${format}`);
      
      // Utilisation de l'instance apiClient pour inclure le token d'authentification
      const res = await apiClient.post(`templates/${id}/generate`, {
        values: fieldValues,
        format,
        documentName: documentName || `${template.name} - Export`  // Inclure le nom du document
      });
      
      console.log('Réponse du serveur:', res.data);
      
      // Méthode simplifiée : utiliser directement l'URL du fichier
      const filePath = res.data.filePath;
      console.log('Chemin du fichier généré:', filePath);
      
      // Utiliser directement l'URL complète pour le téléchargement
      const downloadUrl = `${IMAGE_BASE_URL}${filePath}`;
      console.log('URL de téléchargement:', downloadUrl);
      
      // Ouvrir le fichier dans un nouvel onglet pour le téléchargement
      window.open(downloadUrl, '_blank');
      
      // Navigation vers l'historique des exports après génération réussie
      const navigateToHistory = window.confirm('Document généré avec succès ! Voulez-vous consulter l\'historique des exports ?');
      if (navigateToHistory) {
        navigate('/exports');
      }
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la génération du document:', err);
      // Afficher plus de détails sur l'erreur
      if (err.response) {
        console.error('Détails de l\'erreur:', err.response.data);
        setError(`Impossible de générer le document: ${err.response.data.message || 'Erreur serveur'}`);
      } else if (err.request) {
        console.error('Pas de réponse du serveur');
        setError('Impossible de générer le document: Pas de réponse du serveur');
      } else {
        setError(`Impossible de générer le document: ${err.message}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Template not found
          </div>
        </div>
      </div>
    );
  }

  // Traitement défensif des données pour éviter les erreurs d'accès à des propriétés de undefined
  // Vérifications complètes selon les principes SOLID
  const hasValidSlides = template.Slides && Array.isArray(template.Slides) && template.Slides.length > 0;
  const hasValidFields = template.Fields && Array.isArray(template.Fields);
  
  // Si aucune diapositive valide n'est présente, afficher un message d'erreur
  if (!hasValidSlides) {
    console.error('Données de diapositives manquantes ou invalides:', template);
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Le modèle ne contient pas de diapositives valides. Veuillez contacter l'administrateur.
          </div>
          <button
            onClick={() => navigate('/templates')}
            className="mt-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Retour aux modèles
          </button>
        </div>
      </div>
    );
  }
  
  // Accès sécurisé aux données
  const currentSlide = hasValidSlides ? template.Slides[currentSlideIndex] : null;
  const currentSlideFields = hasValidFields 
    ? template.Fields.filter(field => field.slide_index === currentSlideIndex)
    : [];
  
  // Vérification supplémentaire de la diapositive courante
  if (!currentSlide) {
    console.error(`Diapositive ${currentSlideIndex} introuvable:`, template.Slides);
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Diapositive introuvable. Veuillez réessayer.
          </div>
          <button
            onClick={() => navigate('/templates')}
            className="mt-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Retour aux modèles
          </button>
        </div>
      </div>
    );
  }
  
  // Group fields by slide for the form - avec vérification défensive
  const fieldsBySlide = hasValidFields ? template.Fields.reduce((acc, field) => {
    // Vérification que le champ a un index de diapositive valide
    const slideIndex = field.slide_index !== undefined ? field.slide_index : 0;
    
    if (!acc[slideIndex]) {
      acc[slideIndex] = [];
    }
    acc[slideIndex].push(field);
    return acc;
  }, {}) : {};

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Fill Template: {template.name}
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/templates')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <div className="relative inline-block text-left">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <option value="pdf">PDF</option>
                <option value="pptx">PowerPoint</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {generating ? 'Generating...' : `Generate ${format.toUpperCase()}`}
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Slide Preview */}
          <div className="w-full md:w-2/3 bg-white shadow overflow-hidden sm:rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handlePrevSlide}
                disabled={currentSlideIndex === 0}
                className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Slide {currentSlideIndex + 1} of {template.Slides.length}
              </span>
              <button
                onClick={handleNextSlide}
                disabled={currentSlideIndex === template.Slides.length - 1}
                className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            
            <div className="relative">
              {/* Vérification défensive pour l'accès à image_path */}
              {currentSlide && currentSlide.image_path ? (
                <img
                  src={`${IMAGE_BASE_URL}${currentSlide.image_path}`}
                  alt={`Slide ${currentSlideIndex + 1}`}
                  className="w-full h-auto"
                  onError={(e) => {
                    console.error(`Erreur de chargement de l'image: ${IMAGE_BASE_URL}${currentSlide.image_path}`);
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">Aperçu de diapositive non disponible</p>
                </div>
              )}
              
              {/* Field Value Overlays */}
              {currentSlideFields.map(field => (
                <div
                  key={field.id}
                  className="absolute border border-gray-300 bg-white bg-opacity-80 p-2 rounded"
                  style={{
                    left: `${field.position_x}px`,
                    top: `${field.position_y}px`,
                    minWidth: '100px',
                    minHeight: '30px'
                  }}
                >
                  {field.type === 'checkbox' ? (
                    <div className="flex items-center">
                      {fieldValues[field.name] ? '✓' : ''}
                    </div>
                  ) : field.type === 'image' ? (
                    <div className="text-xs text-gray-500">
                      [Image placeholder]
                    </div>
                  ) : (
                    <div className="text-sm">
                      {fieldValues[field.name] || ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Field Form */}
          <div className="w-full md:w-1/3 bg-white shadow overflow-hidden sm:rounded-lg p-4 md:ml-4 mt-4 md:mt-0">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Fill Template Fields
            </h2>
            
            <div className="space-y-6">
              {Object.keys(fieldsBySlide).map(slideIndex => (
                <div key={slideIndex} className="border-t pt-4 first:border-t-0 first:pt-0">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Slide {parseInt(slideIndex) + 1}
                  </h3>
                  <div className="space-y-3">
                    {fieldsBySlide[slideIndex].map(field => (
                      <div key={field.id}>
                        <label className="block text-xs font-medium text-gray-700">
                          {field.label || field.name}
                        </label>
                        
                        {field.type === 'text' && (
                          <input
                            type="text"
                            name={field.name}
                            value={fieldValues[field.name] || ''}
                            onChange={handleFieldChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                          />
                        )}
                        
                        {field.type === 'date' && (
                          <input
                            type="date"
                            name={field.name}
                            value={fieldValues[field.name] || ''}
                            onChange={handleFieldChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                          />
                        )}
                        
                        {field.type === 'checkbox' && (
                          <div className="mt-1 flex items-center">
                            <input
                              type="checkbox"
                              name={field.name}
                              checked={!!fieldValues[field.name]}
                              onChange={handleFieldChange}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-500">
                              {field.default_value || 'Check if applicable'}
                            </span>
                          </div>
                        )}
                        
                        {field.type === 'image' && (
                          <div className="mt-1">
                            <input
                              type="text"
                              name={field.name}
                              value={fieldValues[field.name] || ''}
                              onChange={handleFieldChange}
                              placeholder="Enter image URL"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Enter a URL to an image
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateFill;