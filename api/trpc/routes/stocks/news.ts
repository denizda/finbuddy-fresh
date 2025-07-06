import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { supabase } from '../../../../lib/supabase-backend';

const newsInputSchema = z.object({
  symbol: z.string(),
  title: z.string(),
  link: z.string(),
  summary: z.string().optional(),
  publishedAt: z.string(),
  source: z.string().default('yahoo-finance'),
});

export const newsRoute = publicProcedure
  .input(newsInputSchema)
  .mutation(async ({ input }) => {
    try {
      // Check if news already exists to avoid duplicates
      const { data: existingNews } = await supabase
        .from('stock_news')
        .select('id')
        .eq('symbol', input.symbol)
        .eq('title', input.title)
        .single();

      if (existingNews) {
        return { success: true, message: 'News already exists' };
      }

      // Insert new news
      const { data, error } = await supabase
        .from('stock_news')
        .insert({
          symbol: input.symbol.toUpperCase(),
          title: input.title,
          link: input.link,
          summary: input.summary,
          published_at: new Date(input.publishedAt).toISOString(),
          source: input.source,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to save news');
      }

      return { success: true, data };

    } catch (error) {
      throw new Error('Failed to process stock news');
    }
  });

// Get news for a specific stock
export const getNewsRoute = publicProcedure
  .input(z.object({
    symbol: z.string(),
    limit: z.number().default(20),
  }))
  .query(async ({ input }) => {
    try {
      const { data, error } = await supabase
        .from('stock_news')
        .select('*')
        .eq('symbol', input.symbol.toUpperCase())
        .order('published_at', { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new Error('Failed to fetch news');
      }

      return data || [];

    } catch (error) {
      throw new Error('Failed to fetch stock news');
    }
  }); 