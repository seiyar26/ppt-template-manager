const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

async function createTestPptx() {
  try {
    // Création d'une présentation avec 3 slides
    const pptx = new PptxGenJS();
    
    // Slide 1
    let slide = pptx.addSlide();
    slide.addText('Slide de test 1', { x: 1, y: 1, fontSize: 24, color: '363636' });
    slide.addText('Ce slide est généré automatiquement pour le diagnostic', { x: 1, y: 2, fontSize: 14 });
    
    // Slide 2
    slide = pptx.addSlide();
    slide.addText('Slide de test 2', { x: 1, y: 1, fontSize: 24, color: '363636' });
    slide.addShape(pptx.ShapeType.rect, { x: 1, y: 2, w: 4, h: 2, fill: { color: '5981b3' } });
    
    // Slide 3
    slide = pptx.addSlide();
    slide.addText('Slide de test 3', { x: 1, y: 1, fontSize: 24, color: '363636' });
    slide.addText('Fin du test', { x: 1, y: 4, fontSize: 18, color: '7b7b7b' });
    
    // Enregistrer la présentation
    const outputPath = path.join(__dirname, 'diagnostic-test.pptx');
    await pptx.writeFile({ fileName: outputPath });
    console.log(`Fichier de test créé avec succès: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Erreur lors de la création du fichier PPTX de test:', error);
    throw error;
  }
}

// Exécuter la fonction si lancé directement
if (require.main === module) {
  createTestPptx()
    .then(filePath => {
      console.log('PPTX généré avec succès:', filePath);
      process.exit(0);
    })
    .catch(error => {
      console.error('Échec de la génération PPTX:', error);
      process.exit(1);
    });
}

module.exports = { createTestPptx };
