// Adaptateur Vercel pour notre application Express
// Cet adaptateur permet de faire fonctionner notre application Express dans l'environnement serverless de Vercel

module.exports = (app) => {
  // Cette fonction est l'adaptateur qui sera exportu00e9 pour Vercel
  return async (req, res) => {
    // Support pour les requu00eates OPTIONS (CORS preflight)
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.status(200).end();
      return;
    }

    // Passage de la requu00eate u00e0 l'application Express
    return new Promise((resolve) => {
      // Proxy de res.end pour qu'on puisse ruu00e9soudre la promesse une fois que la ru00e9ponse est envoyu00e9e
      const originalEnd = res.end;
      res.end = function(...args) {
        originalEnd.apply(res, args);
        resolve();
      };

      // Passage de la requu00eate u00e0 l'application Express
      app(req, res);
    });
  };
};
