const { convertPptxToImages } = require('./backend/utils/pptxConverter');
const path = require('path');
const fs = require('fs');

async function testConversion() {
  try {
    // Chemin vers le fichier PPTX de test
    const pptxPath = path.join(__dirname, 'diagnostic-test.pptx');
    
    if (!fs.existsSync(pptxPath)) {
      console.error(`Fichier PPTX de test non trouvé: ${pptxPath}`);
      return false;
    }
    
    console.log(`Test de conversion du fichier: ${pptxPath}`);
    
    // Appeler le service de conversion
    const result = await convertPptxToImages(pptxPath, 'test_diagnostic');
    
    console.log(`Conversion terminée, ${result.length} images générées`);
    return result.length > 0;
  } catch (error) {
    console.error('Erreur lors du test de conversion:', error);
    return false;
  }
}

// Exécuter le test
testConversion()
  .then(success => {
    console.log(`Test de conversion ${success ? 'réussi' : 'échoué'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });
