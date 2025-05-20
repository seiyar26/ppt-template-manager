// Vercel API Route - /api/health

export default async function handler(req, res) {
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
  
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ppt-template-manager',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime() + ' seconds',
    platform: 'Vercel Serverless',
    checks: {
      database: process.env.DATABASE_URL ? { status: 'configured' } : { status: 'not_configured' },
      supabase: process.env.SUPABASE_URL ? { status: 'configured' } : { status: 'not_configured' }
    }
  };
  
  res.status(200).json(healthData);
}
