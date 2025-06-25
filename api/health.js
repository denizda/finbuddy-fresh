export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  res.status(200).json({ 
    status: 'FinBuddy API is running on Vercel',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      trpc: '/api/trpc',
      docs: '/'
    }
  });
} 