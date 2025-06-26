import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  try {
    const { symbol, title, link, summary, publishedAt, source } = req.body;

    // Validate required fields
    if (!symbol || !title || !link || !publishedAt) {
      return res.status(400).json({ 
        error: 'Missing required fields: symbol, title, link, publishedAt' 
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