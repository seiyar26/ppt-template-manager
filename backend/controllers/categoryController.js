const { Category, Template, TemplateCategory } = require('../models');

/**
 * Récupérer toutes les catégories de l'utilisateur
 * @route GET /api/categories
 */
const getCategories = async (req, res) => {
  try {
    const { includeTemplates, flat } = req.query;
    
    // Options de base pour la requête
    const options = {
      where: { user_id: req.user.id },
      order: [['position', 'ASC'], ['name', 'ASC']]
    };
    
    // Si on veut une liste plate (non hiérarchique)
    if (flat === 'true') {
      // N'inclure que les associations de template si demandé
      if (includeTemplates === 'true') {
        options.include = [{
          model: Template,
          through: { attributes: [] },
          attributes: ['id', 'name']
        }];
      }
      
      const categories = await Category.findAll(options);
      res.json({ categories });
      return;
    }
    
    // Sinon, construire une structure hiérarchique
    options.where.parent_id = null; // Ne récupérer que les catégories racines
    
    // Inclure les enfants dans la requête
    options.include = [{
      model: Category,
      as: 'children',
      include: [{ // Pour les enfants de niveau 2
        model: Category,
        as: 'children'
      }]
    }];
    
    // Inclure les templates si nécessaire
    if (includeTemplates === 'true') {
      options.include.push({
        model: Template,
        through: { attributes: [] },
        attributes: ['id', 'name']
      });
      
      // Aussi pour les enfants
      options.include[0].include.push({
        model: Template,
        through: { attributes: [] },
        attributes: ['id', 'name']
      });
    }
    
    const categories = await Category.findAll(options);
    res.json({ categories });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Récupérer une catégorie par son ID
 * @route GET /api/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findOne({
      where: { id, user_id: req.user.id },
      include: [
        {
          model: Template,
          through: { attributes: [] },
          include: [
            {
              model: Template.associations.Slides.target,
              where: { slide_index: 0 },
              required: false,
              limit: 1
            }
          ]
        }
      ]
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    res.json({ category });
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Créer une nouvelle catégorie
 * @route POST /api/categories
 */
const createCategory = async (req, res) => {
  try {
    const { name, description, color, icon, parent_id, is_default, position } = req.body;
    
    // Vérifier si une catégorie avec le même nom existe déjà au même niveau
    const existingCategory = await Category.findOne({
      where: { 
        name, 
        user_id: req.user.id,
        parent_id: parent_id || null
      }
    });
    
    if (existingCategory) {
      return res.status(400).json({ message: 'Un dossier avec ce nom existe déjà à cet emplacement' });
    }
    
    // Vérifier si le parent existe et appartient à l'utilisateur
    if (parent_id) {
      const parentCategory = await Category.findOne({
        where: { id: parent_id, user_id: req.user.id }
      });
      
      if (!parentCategory) {
        return res.status(404).json({ message: 'Le dossier parent n\'existe pas' });
      }
    }
    
    // Récupérer la position maximale actuelle pour l'ordre
    const maxPosition = await Category.max('position', {
      where: { 
        user_id: req.user.id,
        parent_id: parent_id || null
      }
    }) || 0;
    
    // Créer la catégorie
    const category = await Category.create({
      name,
      description,
      color,
      icon,
      parent_id: parent_id || null,
      is_default: is_default || false,
      position: position !== undefined ? position : maxPosition + 1,
      user_id: req.user.id
    });
    
    res.status(201).json({
      message: 'Dossier créé avec succès',
      category
    });
  } catch (error) {
    console.error('Erreur lors de la création du dossier:', error);
    
    // Gestion des erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Erreur de validation des données',
        details: error.errors.map(e => e.message)
      });
    }
    
    // Gestion des erreurs de référence
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Le dossier parent spécifié n\'existe pas ou a été supprimé'
      });
    }
    
    res.status(500).json({
      message: 'Erreur lors de la création du dossier',
      // En développement, on renvoie les détails de l'erreur
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Mettre à jour une catégorie
 * @route PUT /api/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;
    
    // Vérifier si la catégorie existe
    const category = await Category.findOne({
      where: { id, user_id: req.user.id }
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    // Vérifier si une autre catégorie a déjà ce nom
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        where: { name, user_id: req.user.id }
      });
      
      if (existingCategory && existingCategory.id !== parseInt(id)) {
        return res.status(400).json({ message: 'Une catégorie avec ce nom existe déjà' });
      }
    }
    
    // Mettre à jour la catégorie
    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      color: color || category.color,
      icon: icon !== undefined ? icon : category.icon
    });
    
    res.json({
      message: 'Catégorie mise à jour avec succès',
      category
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Supprimer une catégorie
 * @route DELETE /api/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si la catégorie existe
    const category = await Category.findOne({
      where: { id, user_id: req.user.id }
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    // Supprimer la catégorie
    await category.destroy();
    
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Ajouter un template à une catégorie
 * @route POST /api/categories/:id/templates/:templateId
 */
const addTemplateToCategory = async (req, res) => {
  try {
    const { id, templateId } = req.params;
    
    // Vérifier si la catégorie existe
    const category = await Category.findOne({
      where: { id, user_id: req.user.id }
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    // Vérifier si le template existe et appartient à l'utilisateur
    const template = await Template.findOne({
      where: { id: templateId, user_id: req.user.id }
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Template non trouvé' });
    }
    
    // Vérifier si le template est déjà dans la catégorie
    const existingAssociation = await TemplateCategory.findOne({
      where: { template_id: templateId, category_id: id }
    });
    
    if (existingAssociation) {
      return res.status(400).json({ message: 'Le template est déjà dans cette catégorie' });
    }
    
    // Ajouter le template à la catégorie
    await TemplateCategory.create({
      template_id: templateId,
      category_id: id
    });
    
    res.json({ message: 'Template ajouté à la catégorie avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du template à la catégorie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Retirer un template d'une catégorie
 * @route DELETE /api/categories/:id/templates/:templateId
 */
const removeTemplateFromCategory = async (req, res) => {
  try {
    const { id, templateId } = req.params;
    
    // Vérifier si l'association existe
    const association = await TemplateCategory.findOne({
      where: { template_id: templateId, category_id: id }
    });
    
    if (!association) {
      return res.status(404).json({ message: 'Le template n\'est pas dans cette catégorie' });
    }
    
    // Vérifier si la catégorie et le template appartiennent à l'utilisateur
    const category = await Category.findOne({
      where: { id, user_id: req.user.id }
    });
    
    const template = await Template.findOne({
      where: { id: templateId, user_id: req.user.id }
    });
    
    if (!category || !template) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Retirer le template de la catégorie
    await association.destroy();
    
    res.json({ message: 'Template retiré de la catégorie avec succès' });
  } catch (error) {
    console.error('Erreur lors du retrait du template de la catégorie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Réorganiser les dossiers (glisser-déposer)
 * @route PUT /api/categories/reorder
 */
const reorderCategories = async (req, res) => {
  try {
    const { categories } = req.body;
    
    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ message: 'Format de données invalide' });
    }
    
    // Vérifier que toutes les catégories appartiennent à l'utilisateur
    const categoryIds = categories.map(c => c.id);
    const userCategories = await Category.findAll({
      where: { 
        id: categoryIds,
        user_id: req.user.id 
      }
    });
    
    if (userCategories.length !== categoryIds.length) {
      return res.status(403).json({ message: 'Certains dossiers n\'appartiennent pas à l\'utilisateur' });
    }
    
    // Mettre à jour la position et le parent de chaque catégorie
    const updatePromises = categories.map(c => {
      return Category.update(
        { 
          position: c.position,
          parent_id: c.parent_id || null 
        },
        { 
          where: { id: c.id, user_id: req.user.id } 
        }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.json({ message: 'Dossiers réorganisés avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réorganisation des dossiers:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  addTemplateToCategory,
  removeTemplateFromCategory,
  reorderCategories
};