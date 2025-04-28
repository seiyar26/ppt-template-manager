import axios from 'axios';

// Configuration de l'URL de base de l'API
// En production, on utilise l'URL du backend sur votre VPS
// En développement, on utilise localhost
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:2324/api';
const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || 'http://localhost:2324'; 

console.log('API URL configurée:', API_URL);

// Création d'une instance axios avec la configuration de base
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Permet l'envoi de cookies cross-origin
});

// Intercepteur pour ajouter le token d'authentification à toutes les requêtes
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Token trouvé, ajout aux en-têtes:', token.substring(0, 15) + '...');
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.log('Aucun token trouvé dans localStorage');
    }
    return config;
  },
  error => {
    console.error('Erreur dans l\'intercepteur de requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et les erreurs
apiClient.interceptors.response.use(
  response => {
    console.log(`Réponse ${response.config.method} ${response.config.url}:`, response.status);
    return response;
  },
  error => {
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'état en dehors de la plage 2xx
      console.error('Erreur de réponse API:', error.response.status, error.response.data);
      
      // Si le token a expiré (401 Unauthorized), on déconnecte l'utilisateur
      if (error.response.status === 401) {
        console.log('Token expiré ou invalide, déconnexion...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirection vers la page de connexion si ce n'est pas déjà le cas
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('Erreur réseau, pas de réponse du serveur:', error.request);
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('Erreur lors de la configuration de la requête:', error.message);
    }
    return Promise.reject(error);
  }
);

// Service pour l'authentification
const authService = {
  register(userData) {
    return apiClient.post('/auth/register', userData).then(response => {
      return response.data;
    }).catch(error => {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    });
  },
  
  login(userData) {
    console.log('Tentative de connexion avec:', { email: userData.email, password: '****' });
    return apiClient.post('/auth/login', userData)
      .then(response => {
        console.log('Réponse du serveur lors du login:', response);
        // Stocker l'utilisateur et le token dans le localStorage pour la persistance
        if (response.data && response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        if (response.data && response.data.token) {
          localStorage.setItem('token', response.data.token);
          console.log('Token stocké dans localStorage:', response.data.token.substring(0, 15) + '...');
        } else {
          console.error('Aucun token reçu du serveur');
        }
        return response.data;
      })
      .catch(error => {
        console.error('Erreur détaillée lors de la connexion:', error.response?.data || error.message);
        // Si c'est une erreur de réseau, ajouter des détails pour le débogage
        if (error.message === 'Network Error') {
          console.error('Erreur réseau - backend inaccessible:', `${API_URL}/auth/login`);
        }
        throw error;
      });
  },
  
  logout() {
    // Supprimer l'utilisateur du localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return Promise.resolve();
  },
  
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('User récupéré depuis localStorage:', user);
    return Promise.resolve({ user });
  }
};

// Service pour les requêtes de modèles (templates)
const templateService = {
  getAllTemplates(categoryId = null) {
    const params = {};
    if (categoryId) {
      params.categoryId = categoryId;
    }
    
    return apiClient.get('/templates', { params }).then(response => {
      // Adaptation du format de réponse pour correspondre à ce qu'attend le composant
      return {
        templates: response.data?.templates || []
      };
    }).catch(error => {
      console.error('Erreur lors de la récupération des modèles:', error);
      throw error;
    });
  },
  
  getTemplateById(id) {
    return apiClient.get(`/templates/${id}`).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de la récupération du modèle ${id}:`, error);
      throw error;
    });
  },
  
  createTemplate(templateData) {
    return apiClient.post('/templates', templateData).then(response => {
      return response.data;
    }).catch(error => {
      console.error('Erreur lors de la création du modèle:', error);
      throw error;
    });
  },
  
  updateTemplate(id, templateData) {
    return apiClient.put(`/templates/${id}`, templateData).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de la mise à jour du modèle ${id}:`, error);
      throw error;
    });
  },
  
  deleteTemplate(id) {
    return apiClient.delete(`/templates/${id}`).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de la suppression du modèle ${id}:`, error);
      throw error;
    });
  },
  
  updateTemplateCategory(templateId, categoryId) {
    return apiClient.post(`/templates/${templateId}/categories`, { categoryId }).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de l'assignation de la catégorie ${categoryId} au modèle ${templateId}:`, error);
      throw error;
    });
  },
  
  removeTemplateFromCategory(templateId, categoryId) {
    return apiClient.delete(`/templates/${templateId}/categories/${categoryId}`).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de la suppression du modèle ${templateId} de la catégorie ${categoryId}:`, error);
      throw error;
    });
  },
  
  // Gestion des champs (fields)
  addField(templateId, fieldData) {
    return apiClient.post(`/templates/${templateId}/fields`, fieldData).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de l'ajout du champ au modèle ${templateId}:`, error);
      throw error;
    });
  },
  
  updateField(templateId, fieldId, fieldData) {
    return apiClient.put(`/templates/${templateId}/fields/${fieldId}`, fieldData).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de la mise à jour du champ ${fieldId}:`, error);
      throw error;
    });
  },
  
  deleteField(templateId, fieldId) {
    return apiClient.delete(`/templates/${templateId}/fields/${fieldId}`).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de la suppression du champ ${fieldId}:`, error);
      throw error;
    });
  },
  
  // Génération de documents
  generateDocument(templateId, values, format = 'pptx', documentName = null) {
    const data = { values, format };
    if (documentName) {
      data.documentName = documentName;
    }
    
    return apiClient.post(`/templates/${templateId}/generate`, data, {
      responseType: 'blob'
    }).then(response => {
      return response;
    }).catch(error => {
      console.error(`Erreur lors de la génération du document pour le modèle ${templateId}:`, error);
      throw error;
    });
  }
};

// Service pour les catégories
const categoryService = {
  getAllCategories() {
    return apiClient.get('/categories').then(response => {
      return response.data;
    }).catch(error => {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    });
  },
  
  getCategories() {
    return apiClient.get('/categories').then(response => {
      // Adaptation du format de réponse pour correspondre à ce qu'attend le composant Categories
      return {
        data: {
          categories: response.data?.categories || []
        }
      };
    }).catch(error => {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    });
  },
  
  getCategoryById(id) {
    return apiClient.get(`/categories/${id}`).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de la récupération de la catégorie ${id}:`, error);
      throw error;
    });
  },
  
  createCategory(categoryData) {
    return apiClient.post('/categories', categoryData).then(response => {
      return response.data;
    }).catch(error => {
      console.error('Erreur lors de la création de la catégorie:', error);
      throw error;
    });
  },
  
  updateCategory(id, categoryData) {
    return apiClient.put(`/categories/${id}`, categoryData).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de la mise à jour de la catégorie ${id}:`, error);
      throw error;
    });
  },
  
  deleteCategory(id) {
    return apiClient.delete(`/categories/${id}`).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de la suppression de la catégorie ${id}:`, error);
      throw error;
    });
  },
  
  addTemplateToCategory(categoryId, templateId) {
    return apiClient.post(`/categories/${categoryId}/templates/${templateId}`).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de l'ajout du modèle ${templateId} à la catégorie ${categoryId}:`, error);
      throw error;
    });
  },
  
  removeTemplateFromCategory(categoryId, templateId) {
    return apiClient.delete(`/categories/${categoryId}/templates/${templateId}`).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors du retrait du modèle ${templateId} de la catégorie ${categoryId}:`, error);
      throw error;
    });
  },
  
  reorderCategories(orderData) {
    return apiClient.put('/categories/reorder', orderData).then(response => {
      return response.data;
    }).catch(error => {
      console.error('Erreur lors de la réorganisation des catégories:', error);
      throw error;
    });
  }
};

// Service pour les exports
const exportService = {
  getAllExports(filters = {}) {
    return apiClient.get('/exports', { params: filters }).then(response => {
      // Adaptation du format de réponse pour correspondre à ce qu'attend le composant ExportHistory
      return {
        exports: response.data?.exports || [],
        total: response.data?.total || 0
      };
    }).catch(error => {
      console.error('Erreur lors de la récupération des exports:', error);
      throw error;
    });
  },
  
  getExportById(id) {
    return apiClient.get(`/exports/${id}`).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de la récupération de l'export ${id}:`, error);
      throw error;
    });
  },
  
  downloadExport(id) {
    return apiClient.get(`/exports/${id}/download`, {
      responseType: 'blob'
    }).then(response => {
      return response;
    }).catch(error => {
      console.error(`Erreur lors du téléchargement de l'export ${id}:`, error);
      throw error;
    });
  },
  
  deleteExport(id) {
    return apiClient.delete(`/exports/${id}`).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de la suppression de l'export ${id}:`, error);
      throw error;
    });
  },
  
  sendExportByEmail(id, emailData) {
    return apiClient.post(`/exports/${id}/send-email`, emailData).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de l'envoi par email de l'export ${id}:`, error);
      throw error;
    });
  }
};

// Service pour les emails
const emailService = {
  getEmailTemplates() {
    return apiClient.get('/email/templates').then(response => {
      return response.data;
    }).catch(error => {
      console.error('Erreur lors de la récupération des templates d\'email:', error);
      throw error;
    });
  },
  
  sendEmail(exportId, emailData) {
    // Utiliser FormData pour permettre l'envoi de fichiers
    const formData = new FormData();
    
    // Ajouter les champs de base
    formData.append('to', emailData.to);
    formData.append('subject', emailData.subject);
    formData.append('message', emailData.message);
    
    // Ajouter les champs CC s'ils existent
    if (emailData.cc) {
      formData.append('cc', emailData.cc);
    }
    
    // Ajouter les informations de template si utilisées
    if (emailData.useTemplate) {
      formData.append('useTemplate', 'true');
      formData.append('templateId', emailData.templateId);
      formData.append('templatePath', emailData.templatePath);
    }
    
    // Ajouter les pièces jointes s'il y en a
    if (emailData.attachments && emailData.attachments.length > 0) {
      emailData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    return apiClient.post(`/email/exports/${exportId}/send`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(response => {
      return response.data;
    }).catch(error => {
      console.error(`Erreur lors de l'envoi de l'email pour l'export ${exportId}:`, error);
      throw error;
    });
  }
};

// Fonction utilitaire pour construire des URLs d'images
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return `${IMAGE_BASE_URL}${imagePath}`;
};

export {
  apiClient,
  authService,
  templateService,
  categoryService,
  exportService,
  emailService,
  getImageUrl,
  IMAGE_BASE_URL
};