// Middleware global pour toutes les fonctions serverless de l'API Vercel

module.exports = (req, res, next) => {
  // Ajouter des en-têtes de diagnostic pour faciliter le débogage
  res.setHeader('X-Powered-By', 'PPT Template Manager API');
  res.setHeader('X-Deployment-Type', 'Vercel Serverless');
  
  // Logger la requête pour faciliter le débogage
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // CORS préflight global
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }
  
  // Passer au gestionnaire suivant
  return next();
};
