const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// Fonction de test simple pour générer un PPTX
async function testPptxGeneration() {
  try {
    console.log('Début du test de génération PPTX...');
    
    // Créer une nouvelle présentation
    const pptx = new PptxGenJS();
    
    // Ajouter une diapositive avec du texte simple
    const slide = pptx.addSlide();
    
    // Ajouter un titre
    slide.addText('Test de génération PPTX', {
      x: 1,
      y: 1,
      w: 8,
      h: 1,
      fontSize: 24,
      color: '363636',
      bold: true
    });
    
    // Ajouter un paragraphe
    slide.addText('Cette diapositive a été générée par un script de test pour vérifier le bon fonctionnement de PptxGenJS.', {
      x: 1,
      y: 2,
      w: 8,
      h: 1,
      fontSize: 14,
      color: '666666'
    });
    
    // Créer le répertoire de sortie s'il n'existe pas
    const outputDir = path.join(__dirname, 'test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Répertoire de sortie créé: ${outputDir}`);
    }
    
    // Sauvegarder la présentation
    const outputPath = path.join(outputDir, 'test.pptx');
    console.log(`Sauvegarde du fichier PPTX: ${outputPath}`);
    
    await pptx.writeFile({ fileName: outputPath });
    console.log('Fichier PPTX généré avec succès!');
    
    // Vérifier que le fichier existe
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`Taille du fichier: ${stats.size} octets`);
      console.log('Test réussi!');
    } else {
      console.error('Erreur: Le fichier n\'a pas été créé.');
    }
  } catch (error) {
    console.error('Erreur lors du test de génération PPTX:', error);
  }
}

// Exécuter le test
testPptxGeneration();