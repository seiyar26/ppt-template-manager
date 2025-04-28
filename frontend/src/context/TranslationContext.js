import React, { createContext, useContext } from 'react';

// Définition des traductions en français
const translations = {
  // Navigation et titres généraux
  appName: 'Gestionnaire de Modèles PowerPoint',
  login: 'Connexion',
  register: 'Inscription',
  logout: 'Déconnexion',
  myTemplates: 'Mes Modèles',
  dashboard: 'Tableau de bord',
  
  // Page d'accueil
  homeTitle: 'Gestionnaire de Modèles PowerPoint',
  homeSubtitle: 'Créez et réutilisez facilement vos modèles',
  homeDescription: 'Créez des modèles à partir de fichiers PowerPoint existants, ajoutez des champs dynamiques et générez de nouvelles présentations en quelques clics.',
  importPPTFiles: 'Importez vos fichiers PowerPoint',
  importDescription: 'Téléchargez vos présentations PowerPoint existantes et convertissez-les en modèles réutilisables.',
  addDynamicFields: 'Ajoutez des champs dynamiques',
  fieldsDescription: 'Définissez des champs dynamiques sur vos diapositives qui peuvent être remplis avec différents contenus à chaque utilisation.',
  generatePresentations: 'Générez de nouvelles présentations',
  generateDescription: 'Remplissez les champs de votre modèle et exportez au format PowerPoint ou PDF en quelques clics.',
  readyToStart: 'Prêt à commencer ?',
  createYourFirstTemplate: 'Créez votre premier modèle dès aujourd\'hui',
  
  // Authentification
  signInAccount: 'Connectez-vous à votre compte',
  emailAddress: 'Adresse email',
  password: 'Mot de passe',
  signIn: 'Se connecter',
  createAccount: 'Créer un compte',
  confirmPassword: 'Confirmer le mot de passe',
  name: 'Nom',
  invalidCredentials: 'Identifiants invalides',
  signUp: "S'inscrire",
  passwordsNotMatch: 'Les mots de passe ne correspondent pas',
  accountCreated: 'Compte créé avec succès',
  
  // Templates
  newTemplate: 'Nouveau Modèle',
  noTemplates: "Vous n'avez pas encore de modèles.",
  createFirstTemplate: 'Créez votre premier modèle',
  uploadTemplate: 'Télécharger un modèle',
  templateName: 'Nom du modèle',
  selectPPTFile: 'Sélectionner un fichier PowerPoint',
  upload: 'Télécharger',
  fileUploadSuccess: 'Fichier téléchargé avec succès',
  processing: 'Traitement en cours...',
  
  // Éditeur de modèle
  templateEditor: 'Éditeur de modèle',
  slides: 'Diapositives',
  slide: 'Diapositive',
  fields: 'Champs',
  addField: 'Ajouter un champ',
  fieldName: 'Nom du champ',
  fieldLabel: 'Libellé du champ', 
  fieldType: 'Type de champ',
  textField: 'Texte',
  numberField: 'Nombre',
  dateField: 'Date',
  imageField: 'Image',
  defaultValue: 'Valeur par défaut',
  position: 'Position',
  width: 'Largeur',
  height: 'Hauteur',
  save: 'Enregistrer',
  cancel: 'Annuler',
  delete: 'Supprimer',
  saveTemplate: 'Enregistrer le modèle',
  templateSaved: 'Modèle enregistré avec succès',
  fontFamily: 'Police',
  fontSize: 'Taille',
  fontColor: 'Couleur',
  textAlign: 'Alignement',
  fontStyle: 'Style',
  showGrid: 'Afficher la grille',
  preciseMode: 'Mode précis',
  showTextPreview: 'Aperçu du texte',
  nameYourDocument: 'Nommez votre document',
  documentNamePrompt: 'Veuillez nommer ce document pour l\'historique des exports',
  
  // Utilisation du modèle
  fillTemplate: 'Remplir le modèle',
  fillFields: 'Remplir les champs',
  generatePPT: 'Générez PowerPoint',
  generatePDF: 'Générez PDF',
  downloadFile: 'Télécharger le fichier',
  generationSuccess: 'Génération réussie',
  sendByEmail: 'Envoyer par email',
  sharePresentation: 'Partager la présentation',
  emailSent: 'Email envoyé avec succès',
  
  // Historique des exports
  exportHistory: 'Historique des exports',
  noExports: "Vous n'avez pas encore d'exports.",
  exportDate: "Date d'export",
  fileSize: 'Taille du fichier',
  downloadCount: 'Nombre de téléchargements',
  format: 'Format',
  recipients: 'Destinataires',
  filterExports: 'Filtrer les exports',
  startDate: 'Date de début',
  endDate: 'Date de fin',
  applyFilters: 'Appliquer les filtres',
  resetFilters: 'Réinitialiser les filtres',
  deleteExport: 'Supprimer cet export',
  confirmDeleteExport: 'Êtes-vous sûr de vouloir supprimer cet export ?',
  viewExportHistory: 'Consulter l\'historique des exports',
  documentGenerated: 'Document généré avec succès !',
  
  // Email
  emailRecipients: 'Destinataires',
  emailSubject: 'Objet',
  emailMessage: 'Message',
  sendEmail: 'Envoyer l\'email',
  addRecipient: 'Ajouter un destinataire',
  emailSmtpNotConfigured: 'Configuration SMTP requise pour envoyer des emails',
  addCc: 'Ajouter CC',
  ccRecipients: 'Destinataires en copie',
  addCcRecipient: 'Ajouter un destinataire en copie',
  attachments: 'Pièces jointes',
  addAttachment: 'Ajouter une pièce jointe',
  noAttachments: 'Aucune pièce jointe',
  mainDocument: 'Document principal',
  selectEmailTemplate: 'Modèle d\'email',
  defaultTemplate: 'Modèle par défaut',
  maxAttachmentSize: 'La taille totale des pièces jointes ne doit pas dépasser 10 Mo',
  
  // Catégories
  categories: 'Catégories',
  category: 'Catégorie',
  categoryName: 'Nom de la catégorie',
  categoryDescription: 'Description de la catégorie',
  categoryColor: 'Couleur de la catégorie',
  createCategory: 'Créer une catégorie',
  editCategory: 'Modifier la catégorie',
  deleteCategory: 'Supprimer la catégorie',
  confirmDeleteCategory: 'Êtes-vous sûr de vouloir supprimer cette catégorie ?',
  addTemplateToCategory: 'Ajouter à une catégorie',
  removeTemplateFromCategory: 'Retirer de la catégorie',
  selectCategory: 'Sélectionner une catégorie',
  allCategories: 'Toutes les catégories',
  noCategories: "Vous n'avez pas encore de catégories.",
  createFirstCategory: 'Créez votre première catégorie',
  
  // Messages d'erreur
  errorOccurred: "Une erreur s'est produite",
  tryAgain: 'Veuillez réessayer',
  fieldRequired: 'Ce champ est requis',
  invalidEmail: 'Adresse email invalide',
  positioningNote: 'Maintenez la touche Maj enfoncée pour un positionnement précis au pixel près',
  infoPositioning: 'Les positions sont maintenant conservées exactement entre l\'éditeur et l\'export PowerPoint',
  positioningHelp: 'Utilisez les flèches du clavier avec Maj pour déplacer un élément par incréments de 1 pixel',
  noResults: 'Aucun résultat ne correspond à vos critères de recherche'
};

const TranslationContext = createContext();

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  return (
    <TranslationContext.Provider value={translations}>
      {children}
    </TranslationContext.Provider>
  );
};
