// API serverless pour Vercel - Endpoint de diagnostic
require('dotenv').config();

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Verify method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV || 'non défini',
    PORT: process.env.PORT || '3000',
    DATABASE_CONNECTION: process.env.DATABASE_URL ? 'Configuré' : 'Non configuré',
    CONVERT_API: process.env.CONVERT_API_SECRET ? 'Configuré' : 'Non configuré',
    SUPABASE: process.env.SUPABASE_URL ? 'Configuré' : 'Non configuré',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    DEPLOYMENT_INFO: {
      platform: 'Vercel Serverless',
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'unknown'
    }
  };
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ppt-template-manager-api',
    environment: safeEnv,
    serverInfo: {
      node: process.version,
      memory: process.memoryUsage(),
      uptime: process.uptime() + ' seconds'
    }
  });
};
