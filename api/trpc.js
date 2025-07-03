export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Health check
  if (req.url === '/api/health') {
    res.status(200).json({ status: 'Backend API is running on Vercel' });
    return;
  }

  try {
    // Log environment check
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      nodeVersion: process.version
    });

    // Dynamically import ES modules
    const { fetchRequestHandler } = await import('@trpc/server/adapters/fetch');
    const { appRouter } = await import('../backend/trpc/app-router.js');
    const { supabase } = await import('../lib/supabase-backend.js');
    
    // Convert Vercel request to standard Request object
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost';
    const url = `${protocol}://${host}${req.url}`;
    
    const body = req.method === 'GET' ? undefined : JSON.stringify(req.body);
    
    const request = new Request(url, {
      method: req.method || 'GET',
      headers: req.headers,
      body,
    });

    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext: async () => ({
        req: request,
        resHeaders: new Headers(),
        supabase,
      }),
      onError: ({ error, type, path, input }) => {
        console.error('TRPC Error:', { error: error.message, type, path, input });
      },
    });

    // Convert Response to Vercel response
    const text = await response.text();
    
    // Handle empty response
    if (!text) {
      res.status(response.status).json({ result: { data: null } });
      return;
    }
    
    try {
      const data = JSON.parse(text);
      res.status(response.status).json(data);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Raw text:', text);
      res.status(500).json({ 
        error: 'Invalid JSON response', 
        message: 'Failed to parse server response' 
      });
    }
  } catch (error) {
    console.error('Vercel API Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 