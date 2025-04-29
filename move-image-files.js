/**
 * Script pour déplacer les fichiers physiques des images vers le bon emplacement
 * Problème: Les fichiers sont dans /backend/uploads/templates/Users/michaeltenenbaum/...
 * Solution: Les déplacer vers /backend/uploads/templates/
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function moveImageFiles() {
  try {
    console.log(`${colors.blue}====== DÉPLACEMENT DES FICHIERS D'IMAGES ======${colors.reset}`);
    
    // Répertoire de base
    const baseDir = path.resolve(__dirname, 'backend/uploads/templates');
    console.log(`${colors.yellow}Répertoire de base: ${baseDir}${colors.reset}`);
    
    // Répertoire avec les fichiers à une mauvaise position
    const problemDir = path.join(baseDir, 'Users');
    
    // Vérifier si le répertoire source existe
    if (!fs.existsSync(problemDir)) {
      console.log(`${colors.yellow}Répertoire problématique non trouvé: ${problemDir}${colors.reset}`);
      
      // Rechercher tous les fichiers slide_*.jpg récursivement
      console.log(`${colors.yellow}Recherche récursive des fichiers d'images...${colors.reset}`);
      
      // Utiliser find pour rechercher récursivement
      exec(`find ${baseDir} -type f -name "slide_*.jpg"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`${colors.red}Erreur lors de la recherche: ${error.message}${colors.reset}`);
          return;
        }
        
        if (stderr) {
          console.error(`${colors.red}Erreur stderr: ${stderr}${colors.reset}`);
          return;
        }
        
        const files = stdout.trim().split('\n').filter(f => f);
        
        if (files.length === 0) {
          console.log(`${colors.yellow}Aucun fichier slide_*.jpg trouvé.${colors.reset}`);
          return;
        }
        
        console.log(`${colors.green}${files.length} fichiers trouvés.${colors.reset}`);
        
        // Déplacer chaque fichier vers la racine du répertoire templates
        let movedCount = 0;
        
        files.forEach(filePath => {
          if (!filePath || filePath.trim() === '') return;
          
          try {
            // Extraire le nom du fichier
            const fileName = path.basename(filePath);
            const destPath = path.join(baseDir, fileName);
            
            // Vérifier si le fichier existe déjà à destination
            if (fs.existsSync(destPath) && filePath !== destPath) {
              console.log(`${colors.yellow}Le fichier existe déjà: ${destPath}${colors.reset}`);
              return;
            }
            
            if (filePath === destPath) {
              console.log(`${colors.yellow}Le fichier est déjà à la bonne position: ${filePath}${colors.reset}`);
              return;
            }
            
            // Copier le fichier (au lieu de le déplacer pour conserver l'original)
            fs.copyFileSync(filePath, destPath);
            console.log(`${colors.green}Copié: ${filePath} → ${destPath}${colors.reset}`);
            movedCount++;
          } catch (err) {
            console.error(`${colors.red}Erreur lors du déplacement de ${filePath}: ${err.message}${colors.reset}`);
          }
        });
        
        console.log(`${colors.green}${movedCount} fichiers copiés vers ${baseDir}${colors.reset}`);
        console.log(`${colors.yellow}Vous pouvez maintenant tester l'application.${colors.reset}`);
      });
      return;
    }
    
    // Si le répertoire source existe
    console.log(`${colors.green}Répertoire problématique trouvé: ${problemDir}${colors.reset}`);
    
    // Trouver tous les fichiers d'images à déplacer
    const findPaths = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          findPaths(fullPath, fileList);
        } else if (file.match(/slide_\d+\.jpg$/)) {
          fileList.push(fullPath);
        }
      });
      
      return fileList;
    };
    
    const imageFiles = findPaths(problemDir);
    console.log(`${colors.green}${imageFiles.length} fichiers d'images trouvés.${colors.reset}`);
    
    // Déplacer chaque fichier
    let movedCount = 0;
    
    imageFiles.forEach(filePath => {
      try {
        const fileName = path.basename(filePath);
        const destPath = path.join(baseDir, fileName);
        
        // Vérifier si le fichier existe déjà à destination
        if (fs.existsSync(destPath)) {
          console.log(`${colors.yellow}Le fichier existe déjà: ${destPath}${colors.reset}`);
          return;
        }
        
        // Copier le fichier (au lieu de le déplacer pour conserver l'original)
        fs.copyFileSync(filePath, destPath);
        console.log(`${colors.green}Copié: ${filePath} → ${destPath}${colors.reset}`);
        movedCount++;
      } catch (err) {
        console.error(`${colors.red}Erreur lors du déplacement de ${filePath}: ${err.message}${colors.reset}`);
      }
    });
    
    console.log(`${colors.green}${movedCount} fichiers copiés vers ${baseDir}${colors.reset}`);
    console.log(`${colors.yellow}Vous pouvez maintenant tester l'application.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Erreur lors du déplacement des fichiers: ${error.message}${colors.reset}`);
    console.error(error);
  }
}

moveImageFiles();
