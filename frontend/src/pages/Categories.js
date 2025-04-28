import React, { useState, useEffect, useCallback } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTranslation } from '../context/TranslationContext';
import { categoryService } from '../services/api';

// Type d'élément pour le drag & drop
const ITEM_TYPE = 'FOLDER';

// Composant représentant un dossier
const Folder = ({ category, depth = 0, onDrop, onEdit, onDelete, isOver, canDrop }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: category.id, parentId: category.parent_id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver: isOverCurrent }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        onDrop(item.id, category.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combiner les refs pour drag et drop
  const dragDropRef = (element) => {
    drag(element);
    drop(element);
  };

  // Déterminer la couleur de fond
  const getBgColor = () => {
    if (isOverCurrent) return 'bg-blue-100';
    if (isDragging) return 'opacity-50';
    return '';
  };

  // Calculer la marge gauche en fonction de la profondeur
  const marginLeft = `${depth * 1.5}rem`;

  return (
    <div
      ref={dragDropRef}
      className={`p-3 mb-2 rounded-lg border border-gray-200 cursor-move flex items-center ${getBgColor()}`}
      style={{ marginLeft }}
    >
      <div className="text-blue-600 mr-3">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
      <div className="flex-grow">
        <div className="font-medium">{category.name}</div>
        {category.description && (
          <div className="text-sm text-gray-500">{category.description}</div>
        )}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(category)}
          className="text-gray-600 hover:text-blue-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(category)}
          className="text-gray-600 hover:text-red-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      {/* Zone pour déposer des sous-dossiers */}
      {category.children && category.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {category.children.map(child => (
            <Folder
              key={child.id}
              category={child}
              depth={depth + 1}
              onDrop={onDrop}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Composant pour la zone racine de drop
const RootDropZone = ({ onDrop, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item) => onDrop(item.id, null),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`p-4 min-h-[300px] ${isOver ? 'bg-blue-50' : ''}`}
    >
      {children}
      {isOver && canDrop && (
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center text-blue-500">
          Déposer ici pour placer à la racine
        </div>
      )}
    </div>
  );
};

const Categories = () => {
  const t = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    parent_id: null
  });

  // Charger les catégories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoryService.getCategories();
      setCategories(response.data.categories);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des dossiers:', err);
      setError('Impossible de charger les dossiers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation des données
    if (!formData.name || formData.name.trim() === '') {
      setError('Le nom du dossier est obligatoire');
      return;
    }
    
    if (formData.name.length > 50) {
      setError('Le nom du dossier ne doit pas dépasser 50 caractères');
      return;
    }
    
    // Réinitialiser l'erreur si la validation est réussie
    setError(null);
    
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, formData);
      } else {
        await categoryService.createCategory(formData);
      }
      
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        parent_id: null
      });
      setShowForm(false);
      setEditingCategory(null);
      
      // Recharger les catégories
      fetchCategories();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du dossier:', err);
      
      // Affichage détaillé de l'erreur
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Si le backend renvoie des détails d'erreur, les afficher
        if (errorData.details && Array.isArray(errorData.details)) {
          setError(`${errorData.message}: ${errorData.details.join(', ')}`);
        } else {
          setError(errorData.message || 'Échec de l\'enregistrement du dossier');
        }
      } else if (err.message === 'Network Error') {
        setError('Erreur de connexion au serveur. Vérifiez que le serveur backend est bien démarré.');
      } else {
        setError('Échec de l\'enregistrement du dossier: ' + err.message);
      }
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6',
      parent_id: category.parent_id
    });
    setShowForm(true);
  };

  const handleDelete = async (category) => {
    if (!window.confirm(t.confirmDeleteCategory)) return;
    
    try {
      await categoryService.deleteCategory(category.id);
      fetchCategories();
    } catch (err) {
      console.error('Erreur lors de la suppression du dossier:', err);
      setError(err.response?.data?.message || 'Échec de la suppression du dossier');
    }
  };

  const handleDrop = async (draggedId, targetId) => {
    try {
      // Copier l'état actuel des catégories
      const updatedCategories = [...categories];
      
      // Trouver la catégorie glissée
      const flattenedCategories = flattenCategoryTree(updatedCategories);
      const draggedCategory = flattenedCategories.find(c => c.id === draggedId);
      
      if (!draggedCategory) return;
      
      // Mettre à jour le parent_id et recalculer les positions
      draggedCategory.parent_id = targetId;
      
      // Recalculer les positions pour chaque niveau
      const positionedCategories = recalculatePositions(flattenedCategories);
      
      // Envoyer la mise à jour au serveur
      await categoryService.reorderCategories({
        categories: positionedCategories.map(c => ({
          id: c.id,
          parent_id: c.parent_id,
          position: c.position
        }))
      });
      
      // Recharger les catégories pour refléter la nouvelle structure
      fetchCategories();
    } catch (err) {
      console.error('Erreur lors de la réorganisation des dossiers:', err);
      setError(err.response?.data?.message || 'Échec de la réorganisation des dossiers');
    }
  };

  // Fonction utilitaire pour aplatir l'arbre des catégories
  const flattenCategoryTree = (categories, parentId = null, result = []) => {
    categories.forEach(category => {
      const flatCategory = { ...category, parent_id: parentId };
      result.push(flatCategory);
      
      if (category.children && category.children.length > 0) {
        flattenCategoryTree(category.children, category.id, result);
      }
    });
    
    return result;
  };

  // Fonction pour recalculer les positions des catégories
  const recalculatePositions = (categories) => {
    // Regrouper par parent_id
    const groupedByParent = {};
    categories.forEach(category => {
      const parentId = category.parent_id || 'root';
      if (!groupedByParent[parentId]) {
        groupedByParent[parentId] = [];
      }
      groupedByParent[parentId].push(category);
    });
    
    // Pour chaque groupe, assigner les positions
    Object.keys(groupedByParent).forEach(parentId => {
      groupedByParent[parentId].forEach((category, index) => {
        category.position = index;
      });
    });
    
    // Aplatir à nouveau
    return Object.values(groupedByParent).flat();
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-6xl mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{t.categories}</h1>
          <button
            onClick={() => {
              setEditingCategory(null);
              setFormData({
                name: '',
                description: '',
                color: '#3B82F6',
                parent_id: null
              });
              setShowForm(!showForm);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm"
          >
            {showForm ? t.cancel : t.createCategory}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingCategory ? t.editCategory : t.createCategory}
            </h2>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
                  <span className="block sm:inline">{error}</span>
                  <button 
                    type="button"
                    className="absolute top-0 bottom-0 right-0 px-4 py-3"
                    onClick={() => setError(null)}
                  >
                    <span className="text-xl">&times;</span>
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.categoryName}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.categoryColor}
                  </label>
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.categoryDescription}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dossier parent
                  </label>
                  <select
                    name="parent_id"
                    value={formData.parent_id || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Aucun (dossier racine)</option>
                    {flattenCategoryTree(categories).map(cat => (
                      <option 
                        key={cat.id} 
                        value={cat.id}
                        disabled={editingCategory && cat.id === editingCategory.id}
                      >
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingCategory ? t.save : t.createCategory}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">{t.noCategories}</h3>
              <p className="mt-1 text-gray-500">{t.createFirstCategory}</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t.createCategory}
                </button>
              </div>
            </div>
          ) : (
            <RootDropZone onDrop={handleDrop}>
              <div className="space-y-3">
                {categories.map(category => (
                  <Folder
                    key={category.id}
                    category={category}
                    onDrop={handleDrop}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </RootDropZone>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default Categories;