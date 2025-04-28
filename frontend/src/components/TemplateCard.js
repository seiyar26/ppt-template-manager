import React from 'react';
import { Link } from 'react-router-dom';
import { useDrag } from 'react-dnd';
import { ELLY_COLORS } from '../App';
import { getImageUrl } from '../services/api';

const TemplateCard = ({ template, onDelete }) => {
  // Configuration du drag source
  const [{ isDragging }, drag] = useDrag({
    type: 'TEMPLATE',
    item: { id: template.id, name: template.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Styles pour l'effet de drag
  const cardStyle = {
    opacity: isDragging ? 0.5 : 1,
    border: isDragging ? `2px dashed ${ELLY_COLORS.primary}` : '1px solid #e5e7eb',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: 'all 0.2s ease',
  };

  // Gestion des catégories (badge)
  const category = template.Category || (template.categories && template.categories.length > 0 ? template.categories[0] : null);
  
  return (
    <div
      ref={drag}
      className="bg-white overflow-hidden shadow rounded-lg transform hover:scale-[1.02] transition duration-200"
      style={cardStyle}
    >
      <div className="relative">
        {/* Aperçu du modèle */}
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          {template.Slides && template.Slides[0] ? (
            <img
              className="h-full w-full object-cover"
              src={getImageUrl(template.Slides[0].image_path)}
              alt={template.name}
            />
          ) : (
            <div className="text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
          
          {/* Badge de catégorie */}
          {category && (
            <div 
              className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: category.color || ELLY_COLORS.secondary,
                color: 'white'
              }}
            >
              {category.name}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
            {template.name}
          </h3>
          
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {template.description || "Aucune description"}
          </p>
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {new Date(template.updated_at || template.created_at).toLocaleDateString('fr-FR')}
            </div>
            
            <div className="flex space-x-2">
              <Link
                to={`/templates/${template.id}/edit`}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white hover:opacity-90 shadow-sm transition-all duration-200"
                style={{ backgroundColor: ELLY_COLORS.action }}
              >
                Modifier
              </Link>
              
              <Link
                to={`/templates/${template.id}/fill`}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white hover:opacity-90 shadow-sm transition-all duration-200"
                style={{ backgroundColor: ELLY_COLORS.success }}
              >
                Utiliser
              </Link>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(template.id);
                }}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white hover:opacity-90 shadow-sm transition-all duration-200"
                style={{ backgroundColor: ELLY_COLORS.danger }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
