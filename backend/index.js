// Point d'entru00e9e pour Vercel
// Ce fichier adapte notre application Express pour l'environnement serverless de Vercel

const app = require('./server.js');
const vercelAdapter = require('./vercel-adapter');

// Exporte notre application Express adaptu00e9e pour Vercel
module.exports = vercelAdapter(app);
