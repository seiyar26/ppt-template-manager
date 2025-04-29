#!/bin/bash

# Script de diagnostic complet pour l'application PPT Template Manager
# Ce script analyse l'ensemble du système et génère un rapport détaillé

echo -e "\033[1;34m===== DIAGNOSTIC COMPLET DU SYSTÈME PPT TEMPLATE MANAGER =====\033[0m"

# Chemin absolu vers le répertoire du projet
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
LOGS_DIR="$BACKEND_DIR/logs"
REPORT_FILE="$PROJECT_DIR/diagnostic-report.txt"

# Création du répertoire de logs s'il n'existe pas
mkdir -p "$LOGS_DIR"

# Création d'un nouveau rapport
echo "=================================" > "$REPORT_FILE"
echo "RAPPORT DE DIAGNOSTIC COMPLET" >> "$REPORT_FILE"
echo "Date: $(date)" >> "$REPORT_FILE"
echo "=================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Fonction pour ajouter une section au rapport
add_section() {
  echo -e "\n\033[1;33m$1\033[0m"
  echo -e "\n=== $1 ===" >> "$REPORT_FILE"
}

# Fonction pour exécuter une commande et ajouter le résultat au rapport
run_and_report() {
  local cmd="$1"
  local description="$2"
  
  echo -e "\033[0;36m$description\033[0m"
  echo "--- $description ---" >> "$REPORT_FILE"
  
  # Exécuter la commande et capturer sa sortie
  output=$(eval "$cmd" 2>&1)
  exit_code=$?
  
  # Ajouter la sortie au rapport
  echo "$output" >> "$REPORT_FILE"
  echo "Exit code: $exit_code" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  # Afficher un résumé du résultat
  if [ $exit_code -eq 0 ]; then
    echo -e "\033[0;32m✓ Succès\033[0m"
  else
    echo -e "\033[0;31m✗ Échec (code $exit_code)\033[0m"
  fi
}

# 1. Informations système
add_section "INFORMATIONS SYSTÈME"
run_and_report "uname -a" "Version du système d'exploitation"
run_and_report "node -v" "Version de Node.js"
run_and_report "npm -v" "Version de NPM"
run_and_report "df -h | grep -E '/$|/home'" "Espace disque disponible"
run_and_report "free -h || vm_stat" "Mémoire disponible"

# 2. Vérification des répertoires
add_section "VÉRIFICATION DES RÉPERTOIRES"
run_and_report "ls -la $PROJECT_DIR" "Contenu du répertoire principal"
run_and_report "ls -la $BACKEND_DIR/uploads 2>/dev/null || echo 'Répertoire uploads non trouvé'" "Contenu du répertoire uploads"
run_and_report "ls -la $BACKEND_DIR/uploads/templates 2>/dev/null || echo 'Répertoire templates non trouvé'" "Contenu du répertoire templates"
run_and_report "ls -la $BACKEND_DIR/uploads/temp 2>/dev/null || echo 'Répertoire temp non trouvé'" "Contenu du répertoire temp"
run_and_report "find $BACKEND_DIR/uploads -type f | wc -l" "Nombre total de fichiers dans uploads"

# 3. Variables d'environnement
add_section "VARIABLES D'ENVIRONNEMENT"
run_and_report "grep -v '^#' $BACKEND_DIR/.env | sed 's/=.*/=***/' 2>/dev/null || echo 'Fichier .env non trouvé'" "Variables d'environnement backend (valeurs masquées)"
run_and_report "grep -v '^#' $FRONTEND_DIR/.env.development | sed 's/=.*/=***/' 2>/dev/null || echo 'Fichier .env.development non trouvé'" "Variables d'environnement frontend (valeurs masquées)"

# 4. État de la base de données
add_section "ÉTAT DE LA BASE DE DONNÉES"
run_and_report "cd $BACKEND_DIR && node -e \"require('dotenv').config(); console.log('URL de connexion: ' + (process.env.DATABASE_URL ? 'Configurée (valeur masquée)' : 'Non configurée'));\"" "Configuration de la base de données"

# 5. Scripts et services
add_section "SCRIPTS ET SERVICES"
run_and_report "ps aux | grep -E 'node|npm' | grep -v grep" "Processus Node.js en cours d'exécution"
run_and_report "netstat -tuln 2>/dev/null | grep -E ':(12000|4322|4323|4324|4325)'" "Ports ouverts"

# 6. Journaux d'erreurs
add_section "JOURNAUX D'ERREURS"
run_and_report "tail -n 50 $LOGS_DIR/backend.log 2>/dev/null || echo 'Fichier backend.log non trouvé'" "Dernières entrées du journal backend"
run_and_report "tail -n 50 $LOGS_DIR/conversion.log 2>/dev/null || echo 'Fichier conversion.log non trouvé'" "Dernières entrées du journal de conversion"
run_and_report "tail -n 50 $LOGS_DIR/upload.log 2>/dev/null || echo 'Fichier upload.log non trouvé'" "Dernières entrées du journal d'upload"

# 7. Test des outils de conversion
add_section "TEST DES OUTILS DE CONVERSION"
run_and_report "cd $BACKEND_DIR && node -e \"const fs = require('fs'); const ConvertApi = require('convertapi'); require('dotenv').config(); const convertApiSecret = process.env.CONVERT_API_SECRET || ''; console.log('CONVERT_API_SECRET configuré: ' + (convertApiSecret ? 'Oui' : 'Non')); if (!convertApiSecret) { process.exit(1); }\"" "Vérification de la clé API ConvertAPI"

# 8. Diagnostic spécifique pour le template problématique
add_section "DIAGNOSTIC DU TEMPLATE PROBLÉMATIQUE"
template_id="20241028_153047_output_PRICING_HP.HC_avec_bouclier_tarifaire"
run_and_report "find $BACKEND_DIR/uploads -name \"*${template_id}*\" -type f | sort" "Fichiers associés au template problématique"

# 9. Création d'un fichier de test PPTX minimal pour diagnostic
add_section "CRÉATION D'UN FICHIER PPTX DE TEST"
cat > "$PROJECT_DIR/create-test-pptx.js" << 'EOL'
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
EOL

run_and_report "cd $PROJECT_DIR && npm install --no-save pptxgenjs" "Installation de pptxgenjs pour le test"
run_and_report "cd $PROJECT_DIR && node create-test-pptx.js" "Génération du fichier PPTX de test"

# 10. Test du service de conversion avec le fichier de test
add_section "TEST DU SERVICE DE CONVERSION"
cat > "$PROJECT_DIR/test-conversion.js" << 'EOL'
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
EOL

run_and_report "cd $PROJECT_DIR && node test-conversion.js" "Test du service de conversion"

# Finalisation du rapport
add_section "CONCLUSION"
echo -e "\nRapport de diagnostic créé: $REPORT_FILE"
echo -e "\nVeuillez consulter ce fichier pour les détails complets du diagnostic."
echo "Rapport complet enregistré dans: $REPORT_FILE" >> "$REPORT_FILE"

# Affichage final
echo -e "\n\033[1;32mDiagnostic terminé. Le rapport complet est disponible dans:\033[0m"
echo -e "\033[1;36m$REPORT_FILE\033[0m"
echo -e "\nCe rapport contient des informations détaillées sur l'état du système et les problèmes potentiels."
echo "Utilisez ces informations pour résoudre les problèmes persistants avec le convertisseur PPTX."

exit 0
