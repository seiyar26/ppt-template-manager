import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { templateService, getImageUrl } from '../services/api';
import { useTranslation } from '../context/TranslationContext';
import { ELLY_COLORS } from '../App';

const TemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = useTranslation();
  const [template, setTemplate] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    default_value: '',
    position_x: 50,
    position_y: 50,
    width: 120,
    height: 40,
    font_family: 'Arial',
    font_size: 14,
    font_color: '#000000',
    text_align: 'left',
    font_style: 'normal'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [isPreciseMode, setIsPreciseMode] = useState(false);
  const [showTextPreview, setShowTextPreview] = useState(true);
  const slideRef = useRef(null);
  const fieldRefs = useRef({});
  const startPositionRef = useRef({x: 0, y: 0});
  const dragOffsetRef = useRef({x: 0, y: 0});

  // Save field position to server - définition avec useCallback
  const saveFieldPosition = useCallback(async (fieldId, field) => {
    try {
      await templateService.updateField(id, fieldId, {
        position_x: field.position_x,
        position_y: field.position_y,
        width: field.width,
        height: field.height,
        font_family: field.font_family,
        font_size: field.font_size,
        font_color: field.font_color, 
        text_align: field.text_align,
        font_style: field.font_style
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la position du champ:', err);
      setError('Impossible de mettre à jour la position du champ');
    }
  }, [id, setError]);

  // Liste des polices Google populaires
  const googleFonts = [
    { name: 'Arial', family: 'Arial, sans-serif' },
    { name: 'Roboto', family: '"Roboto", sans-serif' },
    { name: 'Open Sans', family: '"Open Sans", sans-serif' },
    { name: 'Lato', family: '"Lato", sans-serif' },
    { name: 'Montserrat', family: '"Montserrat", sans-serif' },
    { name: 'Raleway', family: '"Raleway", sans-serif' },
    { name: 'Poppins', family: '"Poppins", sans-serif' },
    { name: 'Nunito', family: '"Nunito", sans-serif' },
    { name: 'Ubuntu', family: '"Ubuntu", sans-serif' },
    { name: 'Playfair Display', family: '"Playfair Display", serif' },
    { name: 'Merriweather', family: '"Merriweather", serif' },
    { name: 'Outfit', family: '"Outfit", sans-serif' },
    { name: 'Inter', family: '"Inter", sans-serif' },
    { name: 'Source Sans Pro', family: '"Source Sans Pro", sans-serif' },
    { name: 'Oswald', family: '"Oswald", sans-serif' },
    { name: 'Noto Sans', family: '"Noto Sans", sans-serif' },
    { name: 'PT Sans', family: '"PT Sans", sans-serif' },
    { name: 'Quicksand', family: '"Quicksand", sans-serif' },
    { name: 'Work Sans', family: '"Work Sans", sans-serif' }
  ];
  
  // Options d'alignement de texte
  const textAlignOptions = [
    { value: 'left', label: 'Gauche' },
    { value: 'center', label: 'Centre' },
    { value: 'right', label: 'Droite' },
    { value: 'justify', label: 'Justifié' }
  ];
  
  // Options de style de police
  const fontStyleOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'italic', label: 'Italique' },
    { value: 'bold', label: 'Gras' },
    { value: 'bold italic', label: 'Gras Italique' }
  ];
  
  // Tailles de police
  const fontSizes = Array.from({ length: 30 }, (_, i) => i + 8);
  
  // Fetch template data
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        console.log('Récupération du modèle:', id);
        setLoading(true);
        
        const data = await templateService.getTemplateById(id);
        console.log('Réponse du modèle:', data);
        
        if (!data || !data.template) {
          console.error('Données de template invalides:', data);
          setError('Données du modèle invalides ou incomplètes');
          return;
        }
        
        // Debug des diapositives reçues
        console.log('Diapositives reçues:', data.template.Slides);
        
        // Sort slides by index
        const sortedSlides = [...(data.template.Slides || [])].sort(
          (a, b) => a.slide_index - b.slide_index
        );
        
        console.log('Diapositives triées:', sortedSlides);
        
        if (sortedSlides.length === 0) {
          console.warn('Aucune diapositive trouvée dans le modèle');
        } else {
          console.log('Première diapositive:', sortedSlides[0]);
          console.log('Image path:', sortedSlides[0].image_path);
        }
        
        // Update template with sorted slides
        setTemplate({
          ...data.template,
          Slides: sortedSlides
        });
        
        // Set fields
        setFields(data.template.Fields || []);
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération du modèle:', err);
        console.error('Message d\'erreur:', err.message);
        setError('Impossible de charger le modèle');
      } finally {
        setLoading(false);
        console.log('Chargement terminé');
      }
    };

    fetchTemplate();
  }, [id]);
  
  // Debug des variables d'état après chargement
  useEffect(() => {
    if (!loading) {
      console.log('État après chargement:');
      console.log('- template:', template);
      console.log('- currentSlideIndex:', currentSlideIndex);
      console.log('- Slides disponibles:', template?.Slides?.length || 0);
      console.log('- currentSlide:', template?.Slides?.[currentSlideIndex]);
    }
  }, [loading, template, currentSlideIndex]);

  // Handle keyboard events for precise positioning
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedField) return;
      
      // Only handle arrow keys when in precise mode or with Shift key
      if ((isPreciseMode || e.shiftKey) && selectedField) {
        let deltaX = 0;
        let deltaY = 0;
        
        // Calculate deltas based on key pressed
        switch (e.key) {
          case 'ArrowLeft':
            deltaX = -1;
            break;
          case 'ArrowRight':
            deltaX = 1;
            break;
          case 'ArrowUp':
            deltaY = -1;
            break;
          case 'ArrowDown':
            deltaY = 1;
            break;
          default:
            return; // Do nothing for other keys
        }
        
        e.preventDefault(); // Prevent scrolling
        
        // Update field position
        const updatedField = {
          ...selectedField,
          position_x: selectedField.position_x + deltaX,
          position_y: selectedField.position_y + deltaY
        };
        
        // Update in state
        setSelectedField(updatedField);
        setFields(fields.map(f => 
          f.id === selectedField.id ? updatedField : f
        ));
        
        // Save to server
        saveFieldPosition(updatedField.id, updatedField);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedField, fields, isPreciseMode, saveFieldPosition]);

  // Handle field selection
  const handleFieldSelect = (field) => {
    setSelectedField(field);
  };

  // Handle field drag start
  const handleFieldDragStart = (e, fieldId) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!slideRef.current) return;
    
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    setIsDragging(true);
    
    // Store initial mouse position
    startPositionRef.current = {
      x: e.clientX,
      y: e.clientY
    };
    
    // Store offset from field corner
    const fieldElement = fieldRefs.current[fieldId];
    if (fieldElement) {
      const fieldRect = fieldElement.getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - fieldRect.left,
        y: e.clientY - fieldRect.top
      };
    }
    
    // Add event listeners for dragging
    document.addEventListener('mousemove', handleFieldDragMove);
    document.addEventListener('mouseup', handleFieldDragEnd);
  };

  // Handle field drag move
  const handleFieldDragMove = (e) => {
    if (!isDragging || !selectedField || !slideRef.current) return;
    
    // Get slide image dimensions
    const slideRect = slideRef.current.getBoundingClientRect();
    
    // Calculate position relative to slide image
    let x = Math.round(e.clientX - slideRect.left - dragOffsetRef.current.x);
    let y = Math.round(e.clientY - slideRect.top - dragOffsetRef.current.y);
    
    // Constrain to slide boundaries
    x = Math.max(0, Math.min(x, slideRect.width - (selectedField.width || 120)));
    y = Math.max(0, Math.min(y, slideRect.height - (selectedField.height || 40)));
    
    // Snap to grid when not in precise mode
    if (showGrid && !isPreciseMode && !e.shiftKey) {
      const gridSize = 10;
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }
    
    // Update field position
    const updatedField = {
      ...selectedField,
      position_x: x,
      position_y: y
    };
    
    // Update in state
    setSelectedField(updatedField);
    setFields(fields.map(f => 
      f.id === selectedField.id ? updatedField : f
    ));
  };

  // Handle field drag end
  const handleFieldDragEnd = () => {
    if (isDragging && selectedField) {
      // Save final position to server
      saveFieldPosition(selectedField.id, selectedField);
    }
    
    setIsDragging(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleFieldDragMove);
    document.removeEventListener('mouseup', handleFieldDragEnd);
  };

  // Handle direct position input change
  const handlePositionChange = (e) => {
    if (!selectedField) return;
    
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    
    if (!isNaN(numValue)) {
      const updatedField = {
        ...selectedField,
        [name]: numValue
      };
      
      setSelectedField(updatedField);
    }
  };

  // Apply position changes after direct input
  const applyPositionChanges = () => {
    if (!selectedField) return;
    
    const updatedFields = fields.map(f => 
      f.id === selectedField.id ? selectedField : f
    );
    
    setFields(updatedFields);
    saveFieldPosition(selectedField.id, selectedField);
  };

  // Handle new field input change
  const handleNewFieldChange = (e) => {
    setNewField({
      ...newField,
      [e.target.name]: e.target.value
    });
  };

  // Add new field
  const handleAddField = async (e) => {
    e.preventDefault();
    
    try {
      const fieldData = {
        ...newField,
        slide_index: currentSlideIndex
      };
      
      const response = await templateService.addField(id, fieldData);
      
      // Add new field to state
      setFields([...fields, response.field]);
      
      // Reset new field form
      setNewField({
        name: '',
        label: '',
        type: 'text',
        default_value: '',
        position_x: 50,
        position_y: 50,
        width: 120,
        height: 40,
        font_family: 'Arial',
        font_size: 14,
        font_color: '#000000',
        text_align: 'left',
        font_style: 'normal'
      });
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors de l\'ajout du champ:', err);
      setError('Impossible d\'ajouter le champ');
    }
  };

  // Update selected field
  const handleUpdateField = async (e) => {
    e.preventDefault();
    
    if (!selectedField) return;
    
    try {
      const response = await templateService.updateField(id, selectedField.id, selectedField);
      
      // Update field in state
      setFields(fields.map(f => 
        f.id === selectedField.id ? response.field : f
      ));
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du champ:', err);
      setError('Impossible de mettre à jour le champ');
    }
  };

  // Delete selected field
  const handleDeleteField = async () => {
    if (!selectedField) return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce champ ?')) {
      return;
    }
    
    try {
      await templateService.deleteField(id, selectedField.id);
      
      // Remove field from state
      setFields(fields.filter(f => f.id !== selectedField.id));
      
      // Clear selected field
      setSelectedField(null);
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la suppression du champ:', err);
      setError('Impossible de supprimer le champ');
    }
  };

  // Handle selected field input change
  const handleSelectedFieldChange = (e) => {
    setSelectedField({
      ...selectedField,
      [e.target.name]: e.target.value
    });
  };

  // Navigate to previous slide
  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
      setSelectedField(null);
    }
  };

  // Navigate to next slide
  const handleNextSlide = () => {
    if (template && currentSlideIndex < template.Slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
      setSelectedField(null);
    }
  };

  // Save template
  const handleSaveTemplate = async () => {
    try {
      await templateService.updateTemplate(id, {
        name: template.name,
        description: template.description
      });
      
      navigate('/templates');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du modèle:', err);
      setError('Impossible de sauvegarder le modèle');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: ELLY_COLORS.primary }}></div>
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

  // Vérification complète des données pour le rendu avec log détaillé
  let currentSlide = null;
  if (template && template.Slides && template.Slides.length > 0) {
    currentSlide = template.Slides[currentSlideIndex];
    if (!currentSlide) {
      console.warn(`Diapositive non trouvée pour l'index ${currentSlideIndex}, utilisation de la première diapositive à la place`);
      currentSlide = template.Slides[0]; // Fallback sur la première diapositive si l'index actuel n'existe pas
      setCurrentSlideIndex(0); // Reset de l'index
    }
    console.log('currentSlide sélectionné pour le rendu:', currentSlide);
  } else {
    console.warn('Aucune diapositive disponible');
  }
  
  const currentSlideFields = fields.filter(field => field.slide_index === currentSlideIndex);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t.templateEditor}: {template.name}
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/templates')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSaveTemplate}
              style={{ backgroundColor: ELLY_COLORS.primary, borderColor: ELLY_COLORS.primary }}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 transition duration-200"
            >
              {t.saveTemplate}
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
                className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Précédent
              </button>
              <span className="text-sm text-gray-500">
                {t.slide} {currentSlideIndex + 1} / {template.Slides.length}
              </span>
              <button
                onClick={handleNextSlide}
                disabled={currentSlideIndex === template.Slides.length - 1}
                className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition duration-200"
              >
                Suivant
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="relative">
              {/* Grille d'aide au positionnement */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none z-0">
                  <div 
                    className="w-full h-full" 
                    style={{
                      backgroundSize: '10px 10px',
                      backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px), 
                                       linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)`
                    }}
                  />
                </div>
              )}
              
              {/* Affichage de l'image avec vérification complète */}
              {currentSlide && currentSlide.image_path ? (
                <img
                  id="slide-image"
                  src={getImageUrl(currentSlide.image_path)}
                  alt={`${t.slide} ${currentSlideIndex + 1}`}
                  className="w-full h-auto relative z-10"
                  ref={slideRef}
                  onLoad={() => console.log('Image chargée avec succès:', getImageUrl(currentSlide.image_path))}
                  onError={(e) => {
                    console.error('Erreur de chargement de l\'image:', e);
                    console.error('URL de l\'image:', getImageUrl(currentSlide.image_path));
                  }}
                />
              ) : (
                <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-100 rounded border-2 border-dashed border-gray-300 text-gray-400 p-4">
                  <div className="text-xl mb-2">{!currentSlide ? 'Aucune diapositive disponible' : 'Image non disponible'}</div>
                  <div className="text-sm text-red-500">
                    {!template ? 'Modèle non chargé' :
                     !template.Slides || template.Slides.length === 0 ? 'Aucune diapositive dans le modèle' :
                     !currentSlide ? `Problème avec la diapositive ${currentSlideIndex + 1}` :
                     !currentSlide.image_path ? 'Chemin d\'image non défini pour cette diapositive' :
                     'Problème de chargement de l\'image'}
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Actualiser la page
                  </button>
                </div>
              )}
              
              {/* Overlays des champs */}
              {currentSlideFields.map(field => (
                <div
                  key={field.id}
                  className={`absolute border-2 cursor-move p-2 rounded transition-colors duration-200 z-20 ${
                    selectedField && selectedField.id === field.id ? '' : 'border-gray-400 bg-gray-100 bg-opacity-30'
                  }`}
                  style={{
                    left: `${field.position_x}px`,
                    top: `${field.position_y}px`,
                    width: `${field.width}px`,
                    height: `${field.height}px`,
                    minWidth: '40px',
                    minHeight: '20px',
                    ...(selectedField && selectedField.id === field.id ? {
                      borderColor: ELLY_COLORS.primary,
                      backgroundColor: ELLY_COLORS.accent,
                      opacity: 0.9
                    } : {})
                  }}
                  onClick={() => handleFieldSelect(field)}
                  onMouseDown={(e) => handleFieldDragStart(e, field.id)}
                  ref={(ref) => fieldRefs.current[field.id] = ref}
                >
                  <div className="text-xs font-medium truncate">
                    {field.label || field.name}
                  </div>
                  
                  {/* Visualisation du point de départ du texte */}
                  <div 
                    className="absolute h-4 border-l border-red-500" 
                    style={{ 
                      left: '3px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      opacity: 0.8
                    }}
                  />
                  
                  {/* Aperçu du texte */}
                  {showTextPreview && (
                    <div 
                      className="absolute left-0 top-0 right-0 bottom-0 flex items-center overflow-hidden p-2"
                      style={{ 
                        fontFamily: field.font_family || 'Arial',
                        fontSize: `${field.font_size || 14}px`,
                        color: field.font_color || '#000000',
                        textAlign: field.text_align || 'left',
                        fontStyle: field.font_style === 'italic' || field.font_style === 'bold italic' ? 'italic' : 'normal',
                        fontWeight: field.font_style === 'bold' || field.font_style === 'bold italic' ? 'bold' : 'normal',
                        pointerEvents: 'none',
                        opacity: 0.7
                      }}
                    >
                      {field.default_value || (field.type === 'image' ? '[Image]' : 'Texte exemple')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contrôles d'aide au positionnement */}
            <div className="flex justify-between items-center mt-4 bg-gray-50 p-3 rounded">
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showGrid} 
                    onChange={() => setShowGrid(!showGrid)}
                    className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Afficher la grille</span>
                </label>
                
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPreciseMode} 
                    onChange={() => setIsPreciseMode(!isPreciseMode)}
                    className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Mode précis</span>
                </label>
                
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showTextPreview} 
                    onChange={() => setShowTextPreview(!showTextPreview)}
                    className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Aperçu du texte</span>
                </label>
              </div>
              
              <div className="text-xs text-gray-500 italic">
                {t.positioningNote}
              </div>
            </div>
          </div>

          {/* Éditeur de champs */}
          <div className="w-full md:w-1/3 bg-white shadow overflow-hidden sm:rounded-lg p-4 md:ml-4 mt-4 md:mt-0">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {t.fields} - {t.slide} {currentSlideIndex + 1}
            </h2>
            
            {/* Liste des champs */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Champs existants
              </h3>
              {currentSlideFields.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Aucun champ sur cette diapositive. Ajoutez un champ ci-dessous.
                </p>
              ) : (
                <div className="space-y-2">
                  {currentSlideFields.map(field => (
                    <div
                      key={field.id}
                      className={`p-2 border rounded cursor-pointer transition-colors duration-200 ${
                        selectedField && selectedField.id === field.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleFieldSelect(field)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{field.label || field.name}</span>
                        <span className="text-xs text-gray-500">{field.type}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Position: X={field.position_x}, Y={field.position_y}, W={field.width}, H={field.height}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Éditeur du champ sélectionné */}
            {selectedField && (
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Modifier le champ
                  </h3>
                  <button
                    onClick={handleDeleteField}
                    className="text-xs text-red-600 hover:text-red-800 transition duration-200"
                  >
                    Supprimer
                  </button>
                </div>
                
                <form onSubmit={handleUpdateField} className="bg-gray-50 p-3 rounded">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        {t.fieldName}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={selectedField.name}
                        onChange={handleSelectedFieldChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        {t.fieldLabel}
                      </label>
                      <input
                        type="text"
                        name="label"
                        value={selectedField.label}
                        onChange={handleSelectedFieldChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        {t.fieldType}
                      </label>
                      <select
                        name="type"
                        value={selectedField.type}
                        onChange={handleSelectedFieldChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                      >
                        <option value="text">{t.textField}</option>
                        <option value="number">{t.numberField}</option>
                        <option value="date">{t.dateField}</option>
                        <option value="image">{t.imageField}</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        {t.defaultValue}
                      </label>
                      <input
                        type="text"
                        name="default_value"
                        value={selectedField.default_value || ''}
                        onChange={handleSelectedFieldChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        {t.fontFamily}
                      </label>
                      <select
                        name="font_family"
                        value={selectedField.font_family}
                        onChange={handleSelectedFieldChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                      >
                        {googleFonts.map(font => (
                          <option key={font.name} value={font.name}>{font.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        {t.fontSize}
                      </label>
                      <select
                        name="font_size"
                        value={selectedField.font_size}
                        onChange={handleSelectedFieldChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                      >
                        {fontSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        {t.fontColor}
                      </label>
                      <input
                        type="color"
                        name="font_color"
                        value={selectedField.font_color}
                        onChange={handleSelectedFieldChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        {t.textAlign}
                      </label>
                      <select
                        name="text_align"
                        value={selectedField.text_align}
                        onChange={handleSelectedFieldChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                      >
                        {textAlignOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        {t.fontStyle}
                      </label>
                      <select
                        name="font_style"
                        value={selectedField.font_style}
                        onChange={handleSelectedFieldChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                      >
                        {fontStyleOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          X
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            name="position_x"
                            value={selectedField.position_x}
                            onChange={handlePositionChange}
                            onBlur={applyPositionChanges}
                            className="mt-1 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 text-sm"
                            required
                          />
                          <div className="flex items-center">
                            <button 
                              type="button" 
                              className="border border-l-0 border-gray-300 px-2 py-2 bg-gray-50 text-gray-500 text-xs rounded-r-md"
                              onClick={() => {
                                const updatedField = {
                                  ...selectedField,
                                  position_x: selectedField.position_x - 1
                                };
                                setSelectedField(updatedField);
                                setFields(fields.map(f => 
                                  f.id === selectedField.id ? updatedField : f
                                ));
                                saveFieldPosition(selectedField.id, updatedField);
                              }}
                            >
                              -
                            </button>
                            <button 
                              type="button" 
                              className="border border-l-0 border-gray-300 px-2 py-2 bg-gray-50 text-gray-500 text-xs rounded-r-md ml-1"
                              onClick={() => {
                                const updatedField = {
                                  ...selectedField,
                                  position_x: selectedField.position_x + 1
                                };
                                setSelectedField(updatedField);
                                setFields(fields.map(f => 
                                  f.id === selectedField.id ? updatedField : f
                                ));
                                saveFieldPosition(selectedField.id, updatedField);
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          Y
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            name="position_y"
                            value={selectedField.position_y}
                            onChange={handlePositionChange}
                            onBlur={applyPositionChanges}
                            className="mt-1 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 text-sm"
                            required
                          />
                          <div className="flex items-center">
                            <button 
                              type="button" 
                              className="border border-l-0 border-gray-300 px-2 py-2 bg-gray-50 text-gray-500 text-xs rounded-r-md"
                              onClick={() => {
                                const updatedField = {
                                  ...selectedField,
                                  position_y: selectedField.position_y - 1
                                };
                                setSelectedField(updatedField);
                                setFields(fields.map(f => 
                                  f.id === selectedField.id ? updatedField : f
                                ));
                                saveFieldPosition(selectedField.id, updatedField);
                              }}
                            >
                              -
                            </button>
                            <button 
                              type="button" 
                              className="border border-l-0 border-gray-300 px-2 py-2 bg-gray-50 text-gray-500 text-xs rounded-r-md ml-1"
                              onClick={() => {
                                const updatedField = {
                                  ...selectedField,
                                  position_y: selectedField.position_y + 1
                                };
                                setSelectedField(updatedField);
                                setFields(fields.map(f => 
                                  f.id === selectedField.id ? updatedField : f
                                ));
                                saveFieldPosition(selectedField.id, updatedField);
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          {t.width}
                        </label>
                        <input
                          type="number"
                          name="width"
                          value={selectedField.width || 120}
                          onChange={handleSelectedFieldChange}
                          onBlur={() => applyPositionChanges()}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          {t.height}
                        </label>
                        <input
                          type="number"
                          name="height"
                          value={selectedField.height || 40}
                          onChange={handleSelectedFieldChange}
                          onBlur={() => applyPositionChanges()}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <button
                        type="submit"
                        style={{ backgroundColor: ELLY_COLORS.primary, borderColor: ELLY_COLORS.primary }}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-100 focus:ring-green-500 transition-opacity duration-200"
                      >
                        {t.save}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
            
            {/* Formulaire d'ajout de nouveau champ */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {t.addField}
              </h3>
              <form onSubmit={handleAddField} className="space-y-3 bg-gray-50 p-3 rounded">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    {t.fieldName}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newField.name}
                    onChange={handleNewFieldChange}
                    placeholder="champ_1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    {t.fieldLabel}
                  </label>
                  <input
                    type="text"
                    name="label"
                    value={newField.label}
                    onChange={handleNewFieldChange}
                    placeholder="Nom du client"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    {t.fieldType}
                  </label>
                  <select
                    name="type"
                    value={newField.type}
                    onChange={handleNewFieldChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  >
                    <option value="text">{t.textField}</option>
                    <option value="number">{t.numberField}</option>
                    <option value="date">{t.dateField}</option>
                    <option value="image">{t.imageField}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    {t.defaultValue}
                  </label>
                  <input
                    type="text"
                    name="default_value"
                    value={newField.default_value}
                    onChange={handleNewFieldChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    {t.fontFamily}
                  </label>
                  <select
                    name="font_family"
                    value={newField.font_family}
                    onChange={handleNewFieldChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  >
                    {googleFonts.map(font => (
                      <option key={font.name} value={font.name}>{font.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    {t.fontSize}
                  </label>
                  <select
                    name="font_size"
                    value={newField.font_size}
                    onChange={handleNewFieldChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  >
                    {fontSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    {t.fontColor}
                  </label>
                  <input
                    type="color"
                    name="font_color"
                    value={newField.font_color}
                    onChange={handleNewFieldChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    {t.textAlign}
                  </label>
                  <select
                    name="text_align"
                    value={newField.text_align}
                    onChange={handleNewFieldChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  >
                    {textAlignOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    {t.fontStyle}
                  </label>
                  <select
                    name="font_style"
                    value={newField.font_style}
                    onChange={handleNewFieldChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  >
                    {fontStyleOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      X
                    </label>
                    <input
                      type="number"
                      name="position_x"
                      value={newField.position_x}
                      onChange={handleNewFieldChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Y
                    </label>
                    <input
                      type="number"
                      name="position_y"
                      value={newField.position_y}
                      onChange={handleNewFieldChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      {t.width}
                    </label>
                    <input
                      type="number"
                      name="width"
                      value={newField.width}
                      onChange={handleNewFieldChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      {t.height}
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={newField.height}
                      onChange={handleNewFieldChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    style={{ backgroundColor: ELLY_COLORS.primary, borderColor: ELLY_COLORS.primary }}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-100 focus:ring-blue-500 transition-opacity duration-200"
                  >
                    {t.addField}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Barre d'information sur les raccourcis clavier */}
        <div className="mt-6 p-3 rounded-md shadow-sm" style={{ backgroundColor: ELLY_COLORS.accent }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: ELLY_COLORS.dark }}>Astuces de positionnement</h3>
          <ul className="text-xs space-y-1" style={{ color: ELLY_COLORS.dark }}>
            <li><span className="font-semibold">Mode précis :</span> Activer pour désactiver la grille magnétique et positionner au pixel près</li>
            <li><span className="font-semibold">Shift + déplacement :</span> Désactive temporairement la grille magnétique pendant le déplacement</li>
            <li><span className="font-semibold">Flèches du clavier :</span> Déplace le champ sélectionné pixel par pixel</li>
            <li><span className="font-semibold">Shift + flèches :</span> Déplace le champ sélectionné pixel par pixel même avec la grille active</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;