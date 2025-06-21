import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './backend/trpc/app-router';
import { createContext } from './backend/trpc/create-context';

// Log environment variables for debugging (remove in production)
console.log('Environment variables loaded:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '***' : 'Not set');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '***' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

const app = new Hono();

// Add CORS headers middleware
app.use('*', async (c, next) => {
  // Set CORS headers
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  
  await next();
});

// Simple request logging
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

// Health check endpoint
app.get('/health', (c) => {
  return c.text('OK');
});

// Import supabase client (backend-only)
import { supabase } from './lib/supabase-backend';

// TRPC request handler
const trpcHandler = async (c: any) => {
  const req = c.req.raw;
  // Log the incoming request for debugging
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  try {
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: req,
      router: appRouter,
      createContext: async () => ({
        req: req,
        resHeaders: new Headers(),
        supabase,
      }),
      onError: ({ error, type, path, input }) => {
        console.error('TRPC Error:', { error, type, path, input });
      },
    });
    return response;
  } catch (error) {
    console.error('Server error:', error);
    return c.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

// Handle both exact path and wildcard
app.all('/api/trpc', trpcHandler);
app.all('/api/trpc/*', trpcHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
serve({ fetch: app.fetch, port });
console.log(`🚀 Server ready at http://localhost:${port}`); 