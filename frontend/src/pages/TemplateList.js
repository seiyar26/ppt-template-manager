import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { templateService, categoryService } from '../services/api';
import { ELLY_COLORS } from '../App';
import { useTranslation } from '../context/TranslationContext';
import CategoryFolder from '../components/CategoryFolder';
import TemplateCard from '../components/TemplateCard';

const TemplateList = () => {
  const translations = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Charger les catégories et les templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Charger les catégories
        const categoriesData = await categoryService.getCategories();
        const fetchedCategories = categoriesData.data.categories || [];
        
        // Ajouter une catégorie "Tous" pour afficher tous les templates
        const allCategories = [
          { id: null, name: 'Tous les modèles', is_default: true },
          ...fetchedCategories
        ];
        
        setCategories(allCategories);
        
        // Charger les templates
        console.log('Récupération des modèles...');
        const templatesData = await templateService.getAllTemplates(selectedCategoryId);
        console.log('Réponse des modèles:', templatesData);
        
        // Mettre à jour le compteur de templates par catégorie
        const updatedCategories = allCategories.map(category => {
          if (category.id === null) {
            // La catégorie "Tous" contient tous les templates
            return { ...category, count: templatesData.templates.length };
          }
          
          // Compter les templates dans cette catégorie
          const count = templatesData.templates.filter(template => 
            template.categories?.some(cat => cat.id === category.id)
          ).length;
          
          return { ...category, count };
        });
        
        setCategories(updatedCategories);
        setTemplates(templatesData.templates || []);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        console.error('Message d\'erreur:', err.message);
        setError('Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategoryId]);

  // Gérer le drag & drop d'un template vers une catégorie
  const handleDrop = async (templateId, categoryId) => {
    try {
      // Utiliser categoryService.addTemplateToCategory au lieu de templateService.updateTemplateCategory
      await categoryService.addTemplateToCategory(categoryId, templateId);
      
      // Mettre à jour l'UI après le succès
      setTemplates(prevTemplates => prevTemplates.map(template => {
        if (template.id === templateId) {
          const updatedTemplate = { ...template };
          
          // Si le template n'a pas encore de catégories, initialiser le tableau
          if (!updatedTemplate.categories) {
            updatedTemplate.categories = [];
          }
          
          // Trouver la catégorie cible
          const category = categories.find(cat => cat.id === categoryId);
          
          // Ajouter la catégorie si elle n'est pas déjà présente
          if (category && !updatedTemplate.categories.some(cat => cat.id === categoryId)) {
            updatedTemplate.categories = [category, ...updatedTemplate.categories];
          }
          
          return updatedTemplate;
        }
        return template;
      }));
      
      // Mettre à jour les compteurs de catégories
      setCategories(prevCategories => prevCategories.map(category => {
        if (category.id === categoryId) {
          return { ...category, count: category.count + 1 };
        }
        return category;
      }));
      
    } catch (err) {
      console.error('Erreur lors de l\'assignation de la catégorie:', err);
      setError('Impossible d\'assigner la catégorie au modèle');
    }
  };

  // Supprimer un template
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) {
      return;
    }

    try {
      console.log('Suppression du modèle:', id);
      
      await templateService.deleteTemplate(id);
      
      // Mettre à jour la liste des templates
      setTemplates(prevTemplates => prevTemplates.filter(template => template.id !== id));
      
      // Mettre à jour les compteurs de catégories
      const deletedTemplate = templates.find(t => t.id === id);
      if (deletedTemplate) {
        setCategories(prevCategories => prevCategories.map(category => {
          if (category.id === null) {
            // La catégorie "Tous" est décrémentée à chaque suppression
            return { ...category, count: category.count - 1 };
          }
          
          // Vérifier si le template supprimé appartenait à cette catégorie
          if (deletedTemplate.categories?.some(cat => cat.id === category.id)) {
            return { ...category, count: category.count - 1 };
          }
          
          return category;
        }));
      }
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la suppression du modèle:', err);
      console.error('Message d\'erreur:', err.message);
      setError('Impossible de supprimer le modèle');
    }
  };

  // Filtrer les templates par catégorie
  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
  };

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-300"></div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{translations.templates || "Mes Modèles"}</h1>
            <Link
              to="/templates/new"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 transition-all duration-200"
              style={{ backgroundColor: ELLY_COLORS.action }}
            >
              {translations.newTemplate || "Nouveau Modèle"}
            </Link>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Section des catégories - Masquée selon la demande */}
          {false && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-700 mb-4">{translations.categories || "Catégories"}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.map((category) => (
                  <CategoryFolder
                    key={category.id || 'all'}
                    category={category}
                    onDrop={handleDrop}
                    onSelect={handleCategorySelect}
                    isSelected={selectedCategoryId === category.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Liste des templates */}
          {templates.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
              <p className="text-gray-500">{translations.noTemplates || "Vous n'avez pas encore de modèles."}</p>
              <Link
                to="/templates/new"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 transition-all duration-200"
                style={{ backgroundColor: ELLY_COLORS.action }}
              >
                {translations.createFirstTemplate || "Créer votre premier modèle"}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default TemplateList;