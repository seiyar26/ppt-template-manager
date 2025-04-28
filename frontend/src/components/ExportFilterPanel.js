import React, { useState } from 'react';

const FilterPanel = ({ filters, templates, onFilterChange, t }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempFilters, setTempFilters] = useState({ ...filters });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempFilters({ ...tempFilters, [name]: value });
  };

  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      format: '',
      templateId: '',
      startDate: '',
      endDate: '',
      sort: 'desc'
    };
    setTempFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">{t.filterExports}</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Réduire
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Plus de filtres
            </span>
          )}
        </button>
      </div>

      <div className={`mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 ${isExpanded ? 'block' : 'hidden'}`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format
          </label>
          <select
            name="format"
            value={tempFilters.format}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les formats</option>
            <option value="pptx">PowerPoint (PPTX)</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Modèle
          </label>
          <select
            name="templateId"
            value={tempFilters.templateId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les modèles</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trier par
          </label>
          <select
            name="sort"
            value={tempFilters.sort}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Plus récent d'abord</option>
            <option value="asc">Plus ancien d'abord</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.startDate}
          </label>
          <input
            type="date"
            name="startDate"
            value={tempFilters.startDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.endDate}
          </label>
          <input
            type="date"
            name="endDate"
            value={tempFilters.endDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end space-x-3">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t.applyFilters}
          </button>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            {t.resetFilters}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;