import React from 'react';
import { useDrop } from 'react-dnd';
import { ELLY_COLORS } from '../App';

const CategoryFolder = ({ category, onDrop, onSelect, isSelected }) => {
  // Configuration du drop target
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'TEMPLATE',
    drop: (item) => onDrop(item.id, category.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Styles dynamiques en fonction de l'état du drag & drop
  const folderStyle = {
    backgroundColor: isSelected 
      ? `${ELLY_COLORS.secondary}` 
      : (isOver 
          ? `${ELLY_COLORS.accent}` 
          : ELLY_COLORS.light),
    borderColor: isOver 
      ? ELLY_COLORS.action 
      : (isSelected 
          ? ELLY_COLORS.action 
          : '#e5e7eb'),
    transform: isOver ? 'scale(1.05)' : 'scale(1)',
    boxShadow: isOver || isSelected 
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
      : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  return (
    <div
      ref={drop}
      className="border rounded-md p-4 flex flex-col items-center shadow-sm hover:shadow-md"
      style={folderStyle}
      onClick={() => onSelect(category.id)}
    >
      <div className="text-3xl mb-2" style={{ color: category.color || ELLY_COLORS.primary }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
        </svg>
      </div>
      <div className="text-center font-medium">
        {category.name}
      </div>
      {category.count > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {category.count} modèle{category.count > 1 ? 's' : ''}
        </div>
      )}
      {isOver && canDrop && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-30 flex items-center justify-center pointer-events-none">
          <span className="text-blue-600 font-medium">Déposer ici</span>
        </div>
      )}
    </div>
  );
};

export default CategoryFolder;
