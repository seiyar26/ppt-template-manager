const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const PDFDocument = require('pdfkit');
const { Export } = require('../models');

// Facteurs de conversion pour les coordonnées
// PowerPoint utilise des pouces, notre interface utilise des pixels
// Ces constantes serviront à convertir correctement les positions
const SLIDE_WIDTH_PIXELS = 960;  // Largeur standard de l'affichage des diapositives dans l'interface
const SLIDE_HEIGHT_PIXELS = 540; // Hauteur standard de l'affichage des diapositives dans l'interface
const SLIDE_WIDTH_INCHES = 10;   // Largeur standard d'une diapositive PowerPoint en pouces
const SLIDE_HEIGHT_INCHES = 5.625; // Hauteur standard d'une diapositive PowerPoint en pouces

/**
 * Convertit les coordonnées de pixels (interface) vers pouces (PowerPoint)
 * @param {number} pixelX - Position X en pixels
 * @param {number} pixelY - Position Y en pixels
 * @param {number} pixelWidth - Largeur en pixels (optionnel)
 * @param {number} pixelHeight - Hauteur en pixels (optionnel)
 * @returns {Object} - Coordonnées converties en pouces pour PowerPoint
 */
const convertToInches = (pixelX, pixelY, pixelWidth = null, pixelHeight = null) => {
  // Conversion des coordonnées avec les ratios appropriés
  const inchX = (pixelX / SLIDE_WIDTH_PIXELS) * SLIDE_WIDTH_INCHES;
  const inchY = (pixelY / SLIDE_HEIGHT_PIXELS) * SLIDE_HEIGHT_INCHES;
  
  const result = { x: inchX, y: inchY };
  
  // Conversion des dimensions si fournies
  if (pixelWidth !== null) {
    result.w = (pixelWidth / SLIDE_WIDTH_PIXELS) * SLIDE_WIDTH_INCHES;
  }
  
  if (pixelHeight !== null) {
    result.h = (pixelHeight / SLIDE_HEIGHT_PIXELS) * SLIDE_HEIGHT_INCHES;
  }
  
  return result;
};

/**
 * Generate a PowerPoint file from template and field values
 * @param {Object} template - Template object
 * @param {Array} slides - Array of slide objects
 * @param {Array} fields - Array of field objects
 * @param {Object} values - Object with field values
 * @param {string} format - Output format ('pptx' or 'pdf')
 * @param {number} userId - User ID
 * @returns {Promise<string>} - Path to the generated file
 */
const generateDocument = async (template, slides, fields, values, format, userId) => {
  try {
    // Create directory for exports if it doesn't exist
    const outputDir = path.join(__dirname, '../uploads/exports', userId.toString());
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `${template.name.replace(/\s+/g, '_')}_${timestamp}`;
    
    if (format === 'pptx') {
      return await generatePptx(template, slides, fields, values, outputDir, fileName, userId);
    } else if (format === 'pdf') {
      return await generatePdf(template, slides, fields, values, outputDir, fileName, userId);
    } else {
      throw new Error('Unsupported format');
    }
  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
};

/**
 * Generate a PowerPoint file
 */
const generatePptx = async (template, slides, fields, values, outputDir, fileName, userId) => {
  try {
    console.log('Début de la génération du fichier PPTX...');
    console.log('Informations du template:', { 
      id: template.id, 
      name: template.name, 
      user_id: template.user_id 
    });
    
    // Create a new presentation
    const pptx = new PptxGenJS();
    
    // Sort slides by index
    slides.sort((a, b) => a.slide_index - b.slide_index);
    console.log(`Traitement de ${slides.length} diapositives...`);
    
    // Process each slide
    for (const slide of slides) {
      // Create a new slide
      const pptxSlide = pptx.addSlide();
      console.log(`Ajout de la diapositive ${slide.slide_index}...`);
      
      // Add the slide image as background
      // Essayer plusieurs chemins possibles pour trouver l'image
      let imagePath = path.join(__dirname, '..', slide.image_path);
      console.log(`Tentative avec le chemin d'image: ${imagePath}`);
      
      // Si le chemin commence par /uploads, essayer sans le /uploads initial
      if (!fs.existsSync(imagePath) && slide.image_path.startsWith('/uploads/')) {
        const altPath = path.join(__dirname, '..', slide.image_path.substring(8)); // Enlever '/uploads'
        console.log(`Chemin alternatif: ${altPath}`);
        if (fs.existsSync(altPath)) {
          imagePath = altPath;
          console.log(`Utilisation du chemin alternatif: ${imagePath}`);
        }
      }
      
      // Dernier recours: chercher l'image par son nom de fichier dans le répertoire des templates
      if (!fs.existsSync(imagePath)) {
        const filename = path.basename(slide.image_path);
        const templateDir = path.join(__dirname, '..', 'uploads', 'templates', template.id.toString());
        const possiblePath = path.join(templateDir, filename);
        console.log(`Tentative avec le chemin par défaut: ${possiblePath}`);
        if (fs.existsSync(possiblePath)) {
          imagePath = possiblePath;
          console.log(`Utilisation du chemin par défaut: ${imagePath}`);
        }
      }
      
      // Vérifier si le fichier image existe
      if (!fs.existsSync(imagePath)) {
        console.error(`Erreur: L'image de fond n'existe pas: ${imagePath}`);
        console.error(`Chemins essayés: ${imagePath}`);
        console.error(`Chemin original dans la base de données: ${slide.image_path}`);
        
        // Au lieu de lancer une erreur, utiliser une diapositive vide
        console.log('Utilisation d\'une diapositive vide comme solution de repli');
        pptxSlide.background = { color: 'FFFFFF' }; // Fond blanc
        
        // Ajouter un texte d'avertissement
        pptxSlide.addText('Image non disponible', {
          x: 1,
          y: 1,
          w: 8,
          h: 1,
          fontSize: 24,
          color: 'FF0000',
          bold: true
        });
      } else {
        // L'image existe, l'utiliser comme fond
        pptxSlide.background = { path: imagePath };
      }
      
      // Get fields for this slide
      const slideFields = fields.filter(field => field.slide_index === slide.slide_index);
      console.log(`Ajout de ${slideFields.length} champs pour la diapositive ${slide.slide_index}...`);
      
      // Add text boxes for each field
      for (const field of slideFields) {
        try {
          const value = values[field.name] || field.default_value || '';
          
          // Convertir les coordonnées de pixels vers pouces
          const coords = convertToInches(
            field.position_x, 
            field.position_y, 
            field.width || 120, 
            field.height || 40
          );
          
          if (field.type === 'text' || field.type === 'date') {
            pptxSlide.addText(value, {
              x: coords.x,
              y: coords.y,
              w: coords.w,
              h: coords.h,
              fontSize: 14
            });
          } else if (field.type === 'image' && value) {
            // For image fields, add the image at the specified position
            try {
              pptxSlide.addImage({
                path: value,
                x: coords.x,
                y: coords.y,
                w: coords.w,
                h: coords.h
              });
            } catch (imgErr) {
              console.error(`Erreur lors de l'ajout de l'image pour le champ ${field.name}:`, imgErr);
              // Ajouter un texte d'erreur à la place
              pptxSlide.addText('Image non disponible', {
                x: coords.x,
                y: coords.y,
                w: coords.w,
                h: coords.h,
                fontSize: 12,
                color: 'FF0000'
              });
            }
          } else if (field.type === 'checkbox') {
            // For checkbox fields, add a checkmark if value is true
            if (value === true || value === 'true' || value === '1') {
              pptxSlide.addText('✓', {
                x: coords.x,
                y: coords.y,
                fontSize: 14
              });
            }
          }
        } catch (fieldErr) {
          console.error(`Erreur lors du traitement du champ ${field.name}:`, fieldErr);
          // Continuer avec le champ suivant
        }
      }
    }
    
    // Créer le répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Répertoire de sortie créé: ${outputDir}`);
    }
    
    // Save the presentation
    const outputPath = path.join(outputDir, `${fileName}.pptx`);
    console.log(`Sauvegarde du fichier PPTX: ${outputPath}`);
    
    await pptx.writeFile({ fileName: outputPath });
    console.log('Fichier PPTX généré avec succès');
    
    const filePath = `/uploads/exports/${template.user_id}/${fileName}.pptx`;
    
    // Calculer la taille du fichier
    const stats = fs.statSync(outputPath);
    const fileSizeInBytes = stats.size;
    console.log(`Taille du fichier: ${fileSizeInBytes} octets`);
    
    // Enregistrer l'export dans l'historique
    await Export.create({
      user_id: template.user_id, // Utiliser template.user_id au lieu de userId
      template_id: template.id,
      file_path: filePath,
      file_name: `${fileName}.pptx`,
      file_size: fileSizeInBytes,
      format: 'pptx',
      export_date: new Date(),
      status: 'success'
    });
    console.log('Export enregistré dans l\'historique');
    
    return filePath;
  } catch (error) {
    console.error('Erreur lors de la génération du fichier PPTX:', error);
    throw error;
  }
};

/**
 * Generate a PDF file
 */
const generatePdf = async (template, slides, fields, values, outputDir, fileName, userId) => {
  // Create a new PDF document
  const doc = new PDFDocument({ autoFirstPage: false });
  const outputPath = path.join(outputDir, `${fileName}.pdf`);
  const writeStream = fs.createWriteStream(outputPath);
  
  // Pipe the PDF to the file
  doc.pipe(writeStream);
  
  // Sort slides by index
  slides.sort((a, b) => a.slide_index - b.slide_index);
  
  // Process each slide
  for (const slide of slides) {
    // Add a new page for each slide
    doc.addPage();
    
    // Add the slide image as background
    const imagePath = path.join(__dirname, '..', slide.image_path);
    doc.image(imagePath, 0, 0, { width: doc.page.width, height: doc.page.height });
    
    // Get fields for this slide
    const slideFields = fields.filter(field => field.slide_index === slide.slide_index);
    
    // Facteur de mise à l'échelle pour convertir les pixels en points PDF
    const scaleX = doc.page.width / SLIDE_WIDTH_PIXELS;
    const scaleY = doc.page.height / SLIDE_HEIGHT_PIXELS;
    
    // Add text for each field
    for (const field of slideFields) {
      const value = values[field.name] || field.default_value || '';
      
      // Convertir les coordonnées de pixels vers points PDF
      const pdfX = field.position_x * scaleX;
      const pdfY = field.position_y * scaleY;
      const pdfWidth = (field.width || 300) * scaleX;
      const pdfHeight = (field.height || 100) * scaleY;
      
      if (field.type === 'text' || field.type === 'date') {
        doc.fontSize(14)
           .fillColor('black')
           .text(value, pdfX, pdfY, {
             width: pdfWidth,
             height: pdfHeight
           });
      } else if (field.type === 'checkbox') {
        // For checkbox fields, add a checkmark if value is true
        if (value === true || value === 'true' || value === '1') {
          doc.fontSize(14)
             .fillColor('black')
             .text('✓', pdfX, pdfY);
        }
      }
      // Note: Image fields in PDF would require more complex handling
    }
  }
  
  // Finalize the PDF
  doc.end();
  
  // Return a promise that resolves when the file is written
  return new Promise((resolve, reject) => {
    writeStream.on('finish', async () => {
      const filePath = `/uploads/exports/${template.user_id}/${fileName}.pdf`;
      
      // Calculer la taille du fichier
      const stats = fs.statSync(outputPath);
      const fileSizeInBytes = stats.size;
      
      // Enregistrer l'export dans l'historique
      try {
        await Export.create({
          user_id: template.user_id, // Utiliser template.user_id au lieu de userId
          template_id: template.id,
          file_path: filePath,
          file_name: `${fileName}.pdf`,
          file_size: fileSizeInBytes,
          format: 'pdf',
          export_date: new Date(),
          status: 'success'
        });
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'export dans l\'historique:', error);
      }
      
      resolve(filePath);
    });
    writeStream.on('error', reject);
  });
};

module.exports = {
  generateDocument
};