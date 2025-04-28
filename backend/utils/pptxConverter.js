const fs = require('fs');
const path = require('path');
const ConvertApi = require('convertapi');
require('dotenv').config();

// Initialize ConvertAPI with secret
const convertApi = new ConvertApi(process.env.CONVERT_API_SECRET);

/**
 * Convert PPTX file to images using ConvertAPI
 * @param {string} filePath - Path to the PPTX file
 * @param {number} templateId - ID of the template
 * @returns {Promise<Array>} - Array of image paths
 */
const convertPptxToImages = async (filePath, templateId) => {
  try {
    // Create directory for template images if it doesn't exist
    const outputDir = path.join(__dirname, '../uploads/templates', templateId.toString());
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert PPTX to JPG using ConvertAPI
    const result = await convertApi.convert('jpg', {
      File: filePath,
      ImageQuality: '100',
      StoreFile: true
    }, 'pptx');

    // Download and save each image
    const imagePaths = [];
    for (let i = 0; i < result.files.length; i++) {
      const file = result.files[i];
      const slideIndex = i;
      const outputPath = path.join(outputDir, `slide_${slideIndex}.jpg`);
      
      // Download the file
      await file.save(outputPath);
      
      // Add the relative path to the array
      imagePaths.push({
        slideIndex,
        imagePath: `/uploads/templates/${templateId}/slide_${slideIndex}.jpg`
      });
    }

    return imagePaths;
  } catch (error) {
    console.error('Error converting PPTX to images:', error);
    throw error;
  }
};

module.exports = {
  convertPptxToImages
};