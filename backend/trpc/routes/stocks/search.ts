import { publicProcedure, createTRPCRouter } from '../../create-context';
import { z } from 'zod';
import fetch from 'node-fetch';
import { newsRoute, getNewsRoute } from './news';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Finnhub API response interfaces
interface FinnhubSearchResult {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

interface FinnhubQuoteResponse {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export const stocksRouter = createTRPCRouter({
  searchStocks: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      if (!FINNHUB_API_KEY) {
        throw new Error('Finnhub API key not configured');
      }

      try {
        // Search for stocks using Finnhub symbol search
        const response = await fetch(
          `https://finnhub.io/api/v1/search?q=${encodeURIComponent(input.query)}&token=${FINNHUB_API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error(`Finnhub API error: ${response.status}`);
        }
        
        const data = await response.json() as FinnhubSearchResult;
        
        // Get quotes for the top results
        const symbols = data.result.slice(0, 10).map((item) => item.symbol);
        const quotes = await Promise.all(
          symbols.map(async (symbol: string) => {
            try {
              const quoteResponse = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
              );
              const quoteData = await quoteResponse.json() as FinnhubQuoteResponse;
              return { symbol, ...quoteData };
            } catch {
              return null;
            }
          })
        );
        
        // Combine search results with quotes
        const results = data.result.slice(0, 10).map((item, index) => {
          const quote = quotes[index];
          return {
            symbol: item.symbol,
            description: item.description,
            type: item.type,
            price: quote?.c || 0,
            change: quote?.d || 0,
            changePercent: quote?.dp || 0,
          };
        }).filter((item) => item.price > 0); // Only show stocks with valid prices
        
        return results;
      } catch (error) {
        console.error('Error searching stocks:', error);
        throw new Error('Failed to search stocks');
      }
    }),
    
  getStockQuote: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      if (!FINNHUB_API_KEY) {
        throw new Error('Finnhub API key not configured');
      }

      try {
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${input.symbol}&token=${FINNHUB_API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error(`Finnhub API error: ${response.status}`);
        }
        
        const data = await response.json() as FinnhubQuoteResponse;
        
        return {
          symbol: input.symbol,
          price: data.c || 0,
          change: data.d || 0,
          changePercent: data.dp || 0,
          high: data.h || 0,
          low: data.l || 0,
          open: data.o || 0,
          previousClose: data.pc || 0,
        };
      } catch (error) {
        console.error('Error fetching stock quote:', error);
        throw new Error('Failed to fetch stock quote');
      }
    }),
    
  // News routes
  saveNews: newsRoute,
  getNews: getNewsRoute,
}); 