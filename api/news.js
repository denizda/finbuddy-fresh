import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Debug environment variables
  console.log('Environment check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey,
    urlStart: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'missing'
  });

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      error: 'Supabase configuration missing',
      debug: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      }
    });
  }

  try {
    const { symbol, title, link, summary, publishedAt, source } = req.body;

    // Validate required fields
    if (!symbol || !title || !link || !publishedAt) {
      return res.status(400).json({ 
        error: 'Missing required fields: symbol, title, link, publishedAt' 
      });
    }

    // For now, just return success without database interaction to test the API
    return res.status(200).json({ 
      success: true, 
      message: 'News API is working - database interaction temporarily disabled',
      received: {
        symbol: symbol,
        title: title,
        link: link,
        summary: summary,
        publishedAt: publishedAt,
        source: source
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
} 