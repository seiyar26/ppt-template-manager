import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateService } from '../services/api';

const TemplateUpload = () => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Check if file is a PPTX
      if (!selectedFile.name.toLowerCase().endsWith('.pptx')) {
        setError('Only PowerPoint (.pptx) files are allowed');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      
      // Set default name from filename if not already set
      if (!name) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setName(fileName);
      }
      
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }
    
    setUploading(true);
    setProgress(0);
    setError(null); // Effacer les erreurs précédentes
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);
    
    // Vérifier que le fichier est bien ajouté au FormData
    let fileFound = false;
    try {
      for (let pair of formData.entries()) {
        if (pair && pair[0] === 'file' && pair[1] instanceof File && pair[1].size > 0) {
          fileFound = true;
          console.log(`FormData contient bien le fichier: ${pair[1].name} (${pair[1].size} octets)`);
          break;
        }
      }
    } catch (err) {
      console.error('Erreur lors de la vérification du FormData:', err);
      setError('Erreur lors de la préparation du fichier: ' + err.message);
      setUploading(false);
      return;
    }
    
    if (!fileFound) {
      console.error('Erreur critique: Le fichier n\'a pas été correctement ajouté au FormData');
      setError('Erreur lors de la préparation du fichier. Veuillez réessayer.');
      setUploading(false);
      return;
    }
    
    try {
      console.log('Envoi du modèle...');
      
      // Ajout d'un timeout pour éviter de rester bloqué indéfiniment
      const UPLOAD_TIMEOUT = 60000; // 60 secondes maximum pour l'upload
      let uploadTimedOut = false;
      
      // Timer de timeout qui sera annulé si l'upload réussit
      const timeoutTimer = setTimeout(() => {
        uploadTimedOut = true;
        clearInterval(progressInterval);
        setProgress(0); // Remise à zéro pour indiquer l'échec
        setError('L\'upload a pris trop de temps. Veuillez réessayer.');
        setUploading(false);
      }, UPLOAD_TIMEOUT);
      
      // Simulation de progression avec feedback visuel plus précis
      let lastProgressUpdate = Date.now();
      const progressInterval = setInterval(() => {
        // Si ça fait plus de 5 secondes qu'on est bloqué à 90%, on avance quand même
        const now = Date.now();
        const timeAtCurrentProgress = now - lastProgressUpdate;
        
        setProgress(prev => {
          // Si on est à 90% depuis plus de 5 secondes, on continue jusqu'à 95%
          if (prev >= 90 && prev < 95 && timeAtCurrentProgress > 5000) {
            lastProgressUpdate = now;
            return 95; // Avancer jusqu'à 95% après 5 secondes d'attente
          }
          
          // Si on est en dessous de 90%, progresser normalement
          if (prev < 90) {
            lastProgressUpdate = now;
            return prev + 5;
          }
          
          return prev; // Maintenir la valeur actuelle
        });
      }, 500);
      
      // Utiliser directement axios pour avoir plus de contrôle sur l'upload
      try {
        // Journal de débogage (pour voir ce qui est envoyé)
        console.log('Début de l\'upload du template avec FormData');
        
        // Créer le template avec le FormData
        const response = await templateService.createTemplate(formData);
        
        // Annuler le timeout puisque l'upload a réussi
        clearTimeout(timeoutTimer);
        
        // Vérifier si l'opération n'a pas déjà été annulée par le timeout
        if (uploadTimedOut) {
          console.log('L\'upload a réussi mais avait déjà été annulé par timeout');
          return;
        }
        
        // Terminé avec succès
        clearInterval(progressInterval);
        setProgress(100);
        
        console.log('Upload réussi:', response);
        
        // Attendre un peu pour montrer 100% avant de rediriger
        setTimeout(() => {
          navigate(`/templates/${response.template.id}/edit`);
        }, 1000);
      } catch (apiError) {
        // Annuler le timeout puisque nous avons déjà une réponse (erreur)
        clearTimeout(timeoutTimer);
        clearInterval(progressInterval);
        
        // Si l'opération n'a pas déjà été annulée par le timeout
        if (!uploadTimedOut) {
          throw apiError; // Remonter l'erreur pour la gestion ci-dessous
        }
      }
    } catch (err) {
      console.error('Erreur lors de l\'upload du modèle:', err);
      
      // Messages d'erreur détaillés en fonction du type d'erreur
      let errorMessage = 'Impossible d\'uploader le modèle';
      
      if (err.response) {
        // Erreur de réponse du serveur
        errorMessage = err.response.data?.message || `Erreur serveur: ${err.response.status}`;
        console.error('Détails de l\'erreur serveur:', err.response.data);
      } else if (err.request) {
        // Erreur de réseau (pas de réponse)
        errorMessage = 'Erreur réseau: impossible de joindre le serveur. Vérifiez votre connexion.';
      } else {
        // Autre erreur
        errorMessage = `Erreur: ${err.message}`;
      }
      
      setError(errorMessage);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Upload New Template</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload a PowerPoint file (.pptx) to create a new template
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PowerPoint File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pptx"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PowerPoint files only (.pptx)</p>
                </div>
              </div>
              {file && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="My Template"
                required
                disabled={uploading}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Template description..."
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="mb-6">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-500 bg-blue-100">
                        {progress < 100 ? 'Uploading' : 'Processing...'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-500">
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                    <div
                      style={{ width: `${progress}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-400"
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/templates')}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-400 hover:bg-blue-500 disabled:bg-blue-300"
                disabled={!file || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TemplateUpload;