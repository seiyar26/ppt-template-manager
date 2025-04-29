/**
 * Script d'automatisation de test d'upload pour le PPT Template Manager
 * Ce script utilise Puppeteer pour automatiser le test d'upload complet
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Configuration
const APP_URL = 'http://localhost:4322';
const LOGIN_EMAIL = 'admin@example.com';
const LOGIN_PASSWORD = 'admin123';
const PPTX_FILE_PATH = '/Users/michaeltenenbaum/Downloads/ppt-template-manager/frontend/1745948540175-732905162.pptx';
const TEMPLATE_NAME = 'Test PPTX Auto Upload ' + new Date().toISOString();

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function runTest() {
  console.log(`${colors.blue}====== DÉBUT DU TEST D'UPLOAD AUTOMATISÉ ======${colors.reset}`);
  
  // Vérifier que le fichier PPTX existe
  if (!fs.existsSync(PPTX_FILE_PATH)) {
    console.error(`${colors.red}ERREUR: Le fichier PPTX n'existe pas: ${PPTX_FILE_PATH}${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ Fichier PPTX trouvé: ${PPTX_FILE_PATH}${colors.reset}`);
  
  // Démarrer le navigateur en mode visible
  console.log(`${colors.yellow}Démarrage du navigateur...${colors.reset}`);
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    console.log(`${colors.green}✓ Navigateur démarré${colors.reset}`);
    
    // Activer la journalisation de la console du navigateur
    page.on('console', msg => console.log(`${colors.yellow}BROWSER LOG:${colors.reset}`, msg.text()));
    
    // Navigation vers l'application
    console.log(`${colors.yellow}Navigation vers ${APP_URL}...${colors.reset}`);
    await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log(`${colors.green}✓ Page chargée${colors.reset}`);
    
    // Vérifier si déjà connecté
    console.log(`${colors.yellow}Vérification de l'état de connexion...${colors.reset}`);
    const isLoggedIn = await page.evaluate(() => {
      return document.querySelector('a[href="/logout"]') !== null;
    });
    
    if (!isLoggedIn) {
      // Connexion
      console.log(`${colors.yellow}Connexion en cours...${colors.reset}`);
      await page.type('input[name="email"]', LOGIN_EMAIL);
      await page.type('input[name="password"]', LOGIN_PASSWORD);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
      ]);
      console.log(`${colors.green}✓ Connexion réussie${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Déjà connecté${colors.reset}`);
    }
    
    // Navigation vers la page d'upload
    console.log(`${colors.yellow}Navigation vers la page d'upload...${colors.reset}`);
    await Promise.all([
      page.click('a[href="/templates/upload"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
    ]);
    console.log(`${colors.green}✓ Page d'upload atteinte${colors.reset}`);
    
    // Remplir le formulaire
    console.log(`${colors.yellow}Remplissage du formulaire d'upload...${colors.reset}`);
    await page.type('input[name="name"]', TEMPLATE_NAME);
    await page.type('textarea[name="description"]', 'Description automatique générée par le script de test');
    
    // Upload du fichier
    console.log(`${colors.yellow}Préparation de l'upload du fichier PPTX...${colors.reset}`);
    const inputFile = await page.$('input[type="file"]');
    await inputFile.uploadFile(PPTX_FILE_PATH);
    console.log(`${colors.green}✓ Fichier sélectionné${colors.reset}`);
    
    // Soumission du formulaire
    console.log(`${colors.yellow}Soumission du formulaire et attente de l'upload...${colors.reset}`);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForSelector('.progress-bar', { visible: true, timeout: 30000 })
    ]);
    
    // Surveiller la progression de l'upload
    console.log(`${colors.yellow}Surveillance de la progression de l'upload...${colors.reset}`);
    
    let uploadSuccessful = false;
    let lastProgress = 0;
    
    // Boucle de surveillance de la progression
    for (let i = 0; i < 60; i++) { // 60 tentatives * 1s = 60s max
      const progressText = await page.evaluate(() => {
        const progressBar = document.querySelector('.progress-bar');
        return progressBar ? progressBar.textContent.trim() : '';
      });
      
      const progressMatch = progressText.match(/(\d+)%/);
      const currentProgress = progressMatch ? parseInt(progressMatch[1], 10) : 0;
      
      if (currentProgress > lastProgress) {
        console.log(`${colors.cyan}   Progression: ${currentProgress}%${colors.reset}`);
        lastProgress = currentProgress;
      }
      
      // Vérifier si le message de succès est affiché
      const successMessage = await page.evaluate(() => {
        const alerts = Array.from(document.querySelectorAll('.alert'));
        return alerts.find(alert => alert.textContent.includes('succès'))?.textContent.trim() || '';
      });
      
      if (successMessage) {
        console.log(`${colors.green}✓ Upload réussi: ${successMessage}${colors.reset}`);
        uploadSuccessful = true;
        break;
      }
      
      // Vérifier s'il y a un message d'erreur
      const errorMessage = await page.evaluate(() => {
        const alerts = Array.from(document.querySelectorAll('.alert-danger'));
        return alerts.find(alert => alert.textContent.includes('erreur'))?.textContent.trim() || '';
      });
      
      if (errorMessage) {
        console.log(`${colors.red}ERREUR: ${errorMessage}${colors.reset}`);
        break;
      }
      
      if (currentProgress === 100) {
        // Si la progression est à 100% mais pas de message de succès, attendons un moment
        console.log(`${colors.yellow}Progression à 100%, attente du traitement final...${colors.reset}`);
        await page.waitForTimeout(5000); // Attendre 5 secondes supplémentaires
        
        // Vérifier une dernière fois le message de succès
        const finalSuccessMessage = await page.evaluate(() => {
          const alerts = Array.from(document.querySelectorAll('.alert'));
          return alerts.find(alert => alert.textContent.includes('succès'))?.textContent.trim() || '';
        });
        
        if (finalSuccessMessage) {
          console.log(`${colors.green}✓ Upload réussi après attente: ${finalSuccessMessage}${colors.reset}`);
          uploadSuccessful = true;
        } else {
          console.log(`${colors.red}L'upload semble terminé, mais aucun message de confirmation n'a été trouvé.${colors.reset}`);
        }
        
        break;
      }
      
      // Pause avant la prochaine vérification
      await page.waitForTimeout(1000);
    }
    
    // Si l'upload est réussi, naviguer vers la page de remplissage pour vérifier
    if (uploadSuccessful) {
      console.log(`${colors.yellow}Récupération de l'ID du template créé...${colors.reset}`);
      
      // Naviguer vers la liste des templates
      await Promise.all([
        page.click('a[href="/templates"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
      ]);
      
      // Trouver le template que nous venons de créer
      const templateId = await page.evaluate((templateName) => {
        const templates = Array.from(document.querySelectorAll('.card'));
        const template = templates.find(t => t.textContent.includes(templateName));
        if (!template) return null;
        
        // Extraire l'ID du template depuis le lien
        const link = template.querySelector('a[href^="/templates/fill/"]');
        if (!link) return null;
        
        const href = link.getAttribute('href');
        return href.split('/').pop();
      }, TEMPLATE_NAME);
      
      if (templateId) {
        console.log(`${colors.green}✓ Template trouvé avec ID: ${templateId}${colors.reset}`);
        
        // Naviguer vers la page de remplissage
        console.log(`${colors.yellow}Navigation vers la page de remplissage...${colors.reset}`);
        await Promise.all([
          page.goto(`${APP_URL}/templates/fill/${templateId}`, { waitUntil: 'networkidle0', timeout: 30000 })
        ]);
        
        // Vérifier si des diapositives sont affichées
        const slideCount = await page.evaluate(() => {
          const slides = document.querySelectorAll('.slide-container') || [];
          return slides.length;
        });
        
        if (slideCount > 0) {
          console.log(`${colors.green}✓ Diapositives trouvées: ${slideCount}${colors.reset}`);
          console.log(`${colors.green}====== TEST RÉUSSI: UPLOAD ET AFFICHAGE FONCTIONNENT CORRECTEMENT ======${colors.reset}`);
          
          // Prendre une capture d'écran pour preuve
          await page.screenshot({ path: 'test-upload-success.png', fullPage: true });
          console.log(`${colors.green}✓ Capture d'écran enregistrée: test-upload-success.png${colors.reset}`);
        } else {
          console.log(`${colors.red}ERREUR: Aucune diapositive trouvée dans le template créé.${colors.reset}`);
          
          // Prendre une capture d'écran pour le débogage
          await page.screenshot({ path: 'test-upload-no-slides.png', fullPage: true });
          console.log(`${colors.yellow}Capture d'écran de débogage enregistrée: test-upload-no-slides.png${colors.reset}`);
        }
      } else {
        console.log(`${colors.red}ERREUR: Impossible de trouver le template créé.${colors.reset}`);
      }
    }
    
  } catch (error) {
    console.error(`${colors.red}ERREUR CRITIQUE:${colors.reset}`, error);
  } finally {
    // Garder le navigateur ouvert pour inspecter visuellement le résultat
    console.log(`${colors.yellow}Test terminé.${colors.reset}`);
    console.log(`${colors.yellow}Le navigateur reste ouvert pour inspection visuelle des résultats.${colors.reset}`);
    console.log(`${colors.yellow}Fermez manuellement la fenêtre du navigateur lorsque vous avez terminé.${colors.reset}`);
    
    // Pour fermer automatiquement après 2 minutes
    setTimeout(() => {
      console.log(`${colors.yellow}Fermeture automatique du navigateur après délai d'attente...${colors.reset}`);
      browser.close().then(() => process.exit(0));
    }, 120000);
  }
}

// Vérifier si puppeteer est installé
try {
  require.resolve('puppeteer');
  // Démarrer le test
  runTest();
} catch (e) {
  console.error(`${colors.red}ERREUR: Puppeteer n'est pas installé. Installation en cours...${colors.reset}`);
  // On ne peut pas installer puppeteer ici facilement, donc on affiche un message d'instruction
  console.log(`${colors.yellow}Pour installer puppeteer, exécutez la commande suivante:${colors.reset}`);
  console.log(`${colors.cyan}npm install puppeteer${colors.reset}`);
  process.exit(1);
}
