/**
 * Script complet pour nettoyer les fichiers temporaires de l'application
 * Cible principalement les fichiers dans uploads/temp et uploads/exports
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Configuration
const BACKEND_DIR = path.join(__dirname, 'backend');
const TEMP_DIR = path.join(BACKEND_DIR, 'uploads', 'temp');
const EXPORTS_DIR = path.join(BACKEND_DIR, 'uploads', 'exports');
const MAX_AGE_DAYS = 0; // Supprimer tous les fichiers

async function getDirectorySize(directory) {
  let totalSize = 0;
  let fileCount = 0;
  
  try {
    const files = await readdir(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        const subDirResult = await getDirectorySize(filePath);
        totalSize += subDirResult.size;
        fileCount += subDirResult.count;
      } else {
        totalSize += stats.size;
        fileCount++;
      }
    }
    
    return { size: totalSize, count: fileCount };
  } catch (error) {
    console.error(`${colors.red}Erreur lors de l'analyse du répertoire ${directory}: ${error.message}${colors.reset}`);
    return { size: 0, count: 0 };
  }
}

async function cleanDirectory(directory, forceAll = false) {
  let deletedCount = 0;
  let deletedSize = 0;
  
  try {
    const files = await readdir(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        const subDirResult = await cleanDirectory(filePath, forceAll);
        deletedCount += subDirResult.count;
        deletedSize += subDirResult.size;
      } else {
        // Supprimer tous les fichiers si forceAll est true
        const fileSize = stats.size;
        await unlink(filePath);
        deletedCount++;
        deletedSize += fileSize;
        console.log(`${colors.green}Supprimé: ${filePath} (${(fileSize / 1024).toFixed(2)} KB)${colors.reset}`);
      }
    }
    
    return { count: deletedCount, size: deletedSize };
  } catch (error) {
    console.error(`${colors.red}Erreur lors du nettoyage du répertoire ${directory}: ${error.message}${colors.reset}`);
    return { count: 0, size: 0 };
  }
}

async function cleanupFiles() {
  try {
    console.log(`${colors.blue}====== NETTOYAGE DES FICHIERS TEMPORAIRES ======${colors.reset}`);
    
    // Analyser l'état actuel des répertoires
    console.log(`${colors.yellow}Analyse de l'espace disque utilisé...${colors.reset}`);
    const tempStats = await getDirectorySize(TEMP_DIR);
    const exportsStats = await getDirectorySize(EXPORTS_DIR);
    
    const totalFiles = tempStats.count + exportsStats.count;
    const totalSize = tempStats.size + exportsStats.size;
    
    console.log(`${colors.yellow}État actuel:${colors.reset}`);
    console.log(`  ${colors.yellow}Fichiers temporaires: ${tempStats.count} (${(tempStats.size / 1024 / 1024).toFixed(2)} MB)${colors.reset}`);
    console.log(`  ${colors.yellow}Fichiers d'exports: ${exportsStats.count} (${(exportsStats.size / 1024 / 1024).toFixed(2)} MB)${colors.reset}`);
    console.log(`  ${colors.yellow}Total: ${totalFiles} fichiers (${(totalSize / 1024 / 1024).toFixed(2)} MB)${colors.reset}`);
    
    // Nettoyage des répertoires
    console.log(`\n${colors.blue}Suppression de tous les fichiers temporaires...${colors.reset}`);
    
    const tempResult = await cleanDirectory(TEMP_DIR, true);
    const exportsResult = await cleanDirectory(EXPORTS_DIR, true);
    
    const totalDeletedFiles = tempResult.count + exportsResult.count;
    const totalDeletedSize = tempResult.size + exportsResult.size;
    
    console.log(`\n${colors.blue}Résumé du nettoyage:${colors.reset}`);
    console.log(`  ${colors.green}Fichiers temporaires supprimés: ${tempResult.count} (${(tempResult.size / 1024 / 1024).toFixed(2)} MB)${colors.reset}`);
    console.log(`  ${colors.green}Fichiers d'exports supprimés: ${exportsResult.count} (${(exportsResult.size / 1024 / 1024).toFixed(2)} MB)${colors.reset}`);
    console.log(`  ${colors.green}Total supprimé: ${totalDeletedFiles} fichiers (${(totalDeletedSize / 1024 / 1024).toFixed(2)} MB)${colors.reset}`);
    
    // Analyser l'état après nettoyage
    const tempStatsAfter = await getDirectorySize(TEMP_DIR);
    const exportsStatsAfter = await getDirectorySize(EXPORTS_DIR);
    
    const totalFilesAfter = tempStatsAfter.count + exportsStatsAfter.count;
    const totalSizeAfter = tempStatsAfter.size + exportsStatsAfter.size;
    
    console.log(`\n${colors.blue}État après nettoyage:${colors.reset}`);
    console.log(`  ${colors.blue}Fichiers temporaires: ${tempStatsAfter.count} (${(tempStatsAfter.size / 1024 / 1024).toFixed(2)} MB)${colors.reset}`);
    console.log(`  ${colors.blue}Fichiers d'exports: ${exportsStatsAfter.count} (${(exportsStatsAfter.size / 1024 / 1024).toFixed(2)} MB)${colors.reset}`);
    console.log(`  ${colors.blue}Total: ${totalFilesAfter} fichiers (${(totalSizeAfter / 1024 / 1024).toFixed(2)} MB)${colors.reset}`);
    
    const spaceSaved = ((totalSize - totalSizeAfter) / 1024 / 1024).toFixed(2);
    console.log(`\n${colors.green}Nettoyage terminé avec succès. Espace libéré: ${spaceSaved} MB${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Erreur lors du nettoyage: ${error.message}${colors.reset}`);
    console.error(error);
  }
}

// Exécution du script
cleanupFiles();
