import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { ELLY_COLORS } from '../App';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const t = useTranslation();

  return (
    <nav style={{ background: `linear-gradient(90deg, ${ELLY_COLORS.primary} 0%, ${ELLY_COLORS.secondary} 100%)` }} className="text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold flex items-center">
          <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t.appName}
        </Link>
        
        <div className="flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              <span className="hidden md:inline text-white">
                Bonjour, {user.name}
              </span>
              <Link to="/templates" className="hover:text-white hover:opacity-80 px-3 py-2 rounded-md transition duration-200 ease-in-out">
                {t.myTemplates}
              </Link>
              <Link to="/categories" className="hover:text-white hover:opacity-80 px-3 py-2 rounded-md transition duration-200 ease-in-out">
                {t.categories}
              </Link>
              <Link to="/exports" className="hover:text-white hover:opacity-80 px-3 py-2 rounded-md transition duration-200 ease-in-out">
                {t.exportHistory}
              </Link>
              <button
                onClick={logout}
                style={{ backgroundColor: ELLY_COLORS.accent, color: ELLY_COLORS.dark }}
                className="hover:opacity-90 px-4 py-2 rounded-md font-medium transition duration-200 ease-in-out shadow-sm"
              >
                {t.logout}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-white hover:opacity-80 px-3 py-2 rounded-md transition duration-200 ease-in-out">
                {t.login}
              </Link>
              {/* Lien d'inscription supprimé */}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;