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
    // Debug: Log what we're receiving
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    
    const { symbol, title, link, summary, publishedAt, source } = req.body;

    // Debug: Log extracted values
    console.log('Extracted values:', { symbol, title, link, summary, publishedAt, source });

    // Validate required fields
    if (!symbol || !title || !link || !publishedAt) {
      return res.status(400).json({ 
        error: 'Missing required fields: symbol, title, link, publishedAt',
        received: req.body,
        extractedValues: { symbol, title, link, summary, publishedAt, source }
      });
    }

    // Check if news already exists to avoid duplicates
    const { data: existingNews } = await supabase
      .from('stock_news')
      .select('id')
      .eq('symbol', symbol.toUpperCase())
      .eq('title', title)
      .single();

    if (existingNews) {
      return res.status(200).json({ 
        success: true, 
        message: 'News already exists',
        duplicate: true 
      });
    }

    // Insert new news
    const { data, error } = await supabase
      .from('stock_news')
      .insert({
        symbol: symbol.toUpperCase(),
        title: title,
        link: link,
        summary: summary || null,
        published_at: new Date(publishedAt).toISOString(),
        source: source || 'n8n',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to save news to database',
        details: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'News saved successfully',
      data: data 
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
} 