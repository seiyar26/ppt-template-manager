import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import TemplateList from './pages/TemplateList';
import TemplateUpload from './pages/TemplateUpload';
import TemplateEditor from './pages/TemplateEditor';
import TemplateFill from './pages/TemplateFill';
import Categories from './pages/Categories';
import ExportHistory from './pages/ExportHistory';

// Définition des couleurs Elly Energie pour l'application - version blanc et bleu clair
export const ELLY_COLORS = {
  primary: '#4DA8DA',    // Bleu clair - couleur principale
  secondary: '#87CEEB',  // Bleu ciel plus clair - couleur secondaire
  tertiary: '#F0F8FF',   // Blanc bleuté pour backgrounds
  accent: '#E0F7FF',     // Bleu très clair pour accents
  dark: '#2C5F8E',       // Bleu foncé pour texte
  light: '#FFFFFF',      // Blanc pour contrastes
  gray: '#F5F9FF',       // Gris bleuté clair pour sections alternatives
  action: '#1E88E5',     // Bleu plus vif pour boutons d'action
  success: '#43A047',    // Vert pour boutons de confirmation/succès
  warning: '#FFA000',    // Orange pour boutons d'attention/avertissement
  danger: '#E53935',     // Rouge pour boutons de suppression/danger
};

function App() {
  return (
    <TranslationProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen font-sans flex flex-col" style={{
            background: `linear-gradient(145deg, ${ELLY_COLORS.tertiary} 0%, ${ELLY_COLORS.light} 100%)`,
            color: ELLY_COLORS.dark
          }}>
            <Navbar />
            <main className="container mx-auto px-4 py-8 flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                {/* Route d'inscription désactivée */}
                
                {/* Protected Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/templates" element={<TemplateList />} />
                  <Route path="/templates/new" element={<TemplateUpload />} />
                  <Route path="/templates/:id/edit" element={<TemplateEditor />} />
                  <Route path="/templates/:id/fill" element={<TemplateFill />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/exports" element={<ExportHistory />} />
                </Route>
              </Routes>
            </main>
            <footer style={{ background: ELLY_COLORS.primary, color: ELLY_COLORS.light }} className="py-6 mt-auto">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0">
                    <p className="font-semibold text-lg">Elly PPT Manager</p>
                    <p className="text-sm opacity-80">Solution de gestion de modèles PowerPoint</p>
                  </div>
                  <div>
                    <p>&copy; {new Date().getFullYear()} Elly Energie - Tous droits réservés</p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </TranslationProvider>
  );
}

export default App;
