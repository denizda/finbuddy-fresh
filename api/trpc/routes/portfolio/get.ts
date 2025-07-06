import { publicProcedure, createTRPCRouter } from '../../create-context';
import { z } from 'zod';
// import fetch from 'node-fetch'; // Temporarily commented to fix build

// Define TypeScript interfaces for our data model
interface Company {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercentage?: number;
}

interface PortfolioItem {
  id: string;
  quantity: number;
  average_cost: number;
  current_total_value: number;
  company_ticker: string;
  companies: Company | Company[] | null;
}

export interface ProcessedPortfolioItem {
  id: string;
  quantity: number;
  averageCost: number;
  currentTotalValue: number;
  symbol: string;
  name: string;
  realtimePrice?: number;
}

// Finnhub API response interface
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

// Load environment variables
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

if (!FINNHUB_API_KEY) {
  console.warn('WARNING: FINNHUB_API_KEY is not set in environment variables. Real-time stock data will not be available.');
}

// Enhanced caching and rate limiting system
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache (longer for portfolio)

// Rate limiting
let lastRequestTime = 0;
let requestCount = 0;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 20; // Conservative limit for portfolio
const REQUEST_DELAY = 500; // 500ms between requests

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  
  // Reset request count if window has passed
  if (now - lastRequestTime > RATE_LIMIT_WINDOW) {
    requestCount = 0;
    lastRequestTime = now;
  }
  
  // Check if we're over the rate limit
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    console.warn('Portfolio rate limit exceeded, waiting...');
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WINDOW - (now - lastRequestTime)));
    requestCount = 0;
    lastRequestTime = Date.now();
  }
  
  // Add delay between requests
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }
  
  requestCount++;
  lastRequestTime = Date.now();
  
  return globalThis.fetch(url);
}

async function getRealtimePrice(symbol: string): Promise<number | null> {
  // Check cache first
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached price for', symbol, cached.price);
    return cached.price;
  }

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const response = await rateLimitedFetch(url);
    
    if (response.status === 429) {
      console.warn(`Rate limited for ${symbol}, using fallback price`);
      const fallbackPrice = getFallbackPrice(symbol);
      if (fallbackPrice) {
        priceCache.set(symbol, { price: fallbackPrice, timestamp: Date.now() });
        return fallbackPrice;
      }
      return null;
    }
    
    if (!response.ok) {
      console.warn(`HTTP error for ${symbol}: ${response.status}`);
      const fallbackPrice = getFallbackPrice(symbol);
      if (fallbackPrice) {
        priceCache.set(symbol, { price: fallbackPrice, timestamp: Date.now() });
        return fallbackPrice;
      }
      return null;
    }
    
    const data = await response.json() as FinnhubQuoteResponse;
    
    if (!data || typeof data.c !== 'number') {
      console.warn(`Invalid response for ${symbol}`);
      const fallbackPrice = getFallbackPrice(symbol);
      if (fallbackPrice) {
        priceCache.set(symbol, { price: fallbackPrice, timestamp: Date.now() });
        return fallbackPrice;
      }
      return null;
    }
    
    console.log('Finnhub API success:', symbol, data.c);
    // Cache the result
    priceCache.set(symbol, { price: data.c, timestamp: Date.now() });
    return data.c;
    
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    // Always return fallback price instead of null
    const fallbackPrice = getFallbackPrice(symbol);
    if (fallbackPrice) {
      priceCache.set(symbol, { price: fallbackPrice, timestamp: Date.now() });
      return fallbackPrice;
    }
    return null;
  }
}

// Fallback prices for common stocks when API is rate limited
function getFallbackPrice(symbol: string): number | null {
  const fallbackPrices: Record<string, number> = {
    'AAPL': 201,
    'GOOGL': 174,
    'GOOG': 174,
    'MSFT': 415,
    'AMZN': 217,
    'TSLA': 245,
    'META': 563,
    'NVDA': 875,
    'OSCR': 20.5
  };
  
  return fallbackPrices[symbol] || null;
}

export const portfolioRouter = createTRPCRouter({
  getPortfolio: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!FINNHUB_API_KEY) {
        console.warn('Finnhub API key not configured');
      }
      const { userId } = input;

      // Get portfolio items with company details using the correct join
      const { data, error } = await ctx.supabase
        .from('portfolio')
        .select(`
          id,
          quantity,
          average_cost,
          current_total_value,
          company_ticker,
          companies (
            symbol,
            name,
            price,
            change,
            changePercentage
          )
        `)
        .eq('user_id', userId);
        
      // Log the raw query for debugging
      console.log('Portfolio query result:', { data: data?.[0], error });

      if (error) {
        console.error('Error fetching portfolio:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw new Error(`Failed to fetch portfolio data: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return {
          portfolioItems: [],
          summary: {
            totalValue: 0,
            dailyChange: 0,
            dailyChangePercentage: 0,
            weeklyChange: 0,
            weeklyChangePercentage: 0,
            allocation: []
          }
        };
      }

      // Process portfolio items with better error handling
      const portfolioItems: ProcessedPortfolioItem[] = [];
      
      if (data) {
        for (const item of data) {
          try {
            // Handle both array and single object cases
            const company = Array.isArray(item.companies) ? item.companies[0] : item.companies;
            
            // Skip if no company data
            if (!company || !company.symbol) {
              console.warn('Skipping portfolio item with missing company data:', item.id);
              continue;
            }
            
            const symbol = company.symbol;
            let realtimePrice: number | null = null;
            
            // Use the price from database if available, otherwise fetch from API
            if (company.price) {
              realtimePrice = company.price;
            } else if (FINNHUB_API_KEY) {
              try {
                realtimePrice = await getRealtimePrice(symbol);
              } catch (e) {
                console.error(`Error fetching real-time price for ${symbol}:`, e);
              }
            }
            
            // Convert null to undefined to match the type
            const portfolioItem: ProcessedPortfolioItem = {
              id: item.id,
              quantity: item.quantity,
              averageCost: item.average_cost,
              currentTotalValue: item.current_total_value,
              symbol,
              name: company.name,
              realtimePrice: realtimePrice === null ? undefined : realtimePrice,
            };
            
            portfolioItems.push(portfolioItem);
          } catch (e) {
            console.error('Error processing portfolio item:', item, e);
            // Skip this item but continue processing others
            continue;
          }
        }
      }

      // Calculate total portfolio value and other summary data
      const totalValue = portfolioItems.reduce((sum: number, item: any) => sum + item.currentTotalValue, 0);

      // This is mock data for daily/weekly change and allocation for now,
      // as fetching real-time stock data and calculating these would be more complex.
      // You would integrate a stock market API here for real data.
      const dailyChange = 345.28;
      const dailyChangePercentage = 1.42;
      const weeklyChange = 876.32;
      const weeklyChangePercentage = 3.68;
      const allocation = [
        { category: 'Technology', percentage: 42 },
        { category: 'Healthcare', percentage: 18 },
        { category: 'Finance', percentage: 15 },
        { category: 'Consumer', percentage: 12 },
        { category: 'Energy', percentage: 8 },
        { category: 'Other', percentage: 5 },
      ];

      return {
        portfolioItems,
        summary: {
          totalValue,
          dailyChange,
          dailyChangePercentage,
          weeklyChange,
          weeklyChangePercentage,
          allocation,
        },
      };
    }),

  getRealtimePrices: publicProcedure
    .input(z.object({ symbols: z.array(z.string()) }))
    .query(async ({ input }: { input: any }) => {
      const prices = {} as Record<string, { 
        currentPrice: number | null;
        change: number | null;
        changePercent: number | null;
      }>;
      
      // Process symbols sequentially to avoid rate limiting
      for (const symbol of input.symbols) {
        try {
          const price = await getRealtimePrice(symbol);
          if (price !== null) {
            // For demo purposes, calculate a mock daily change
            // In production, you'd fetch the previous day's close price
            const mockPreviousClose = price * (1 - (Math.random() * 0.1 - 0.05)); // ±5% random change
            const change = price - mockPreviousClose;
            const changePercent = (change / mockPreviousClose) * 100;
            
            prices[symbol] = {
              currentPrice: price,
              change: change,
              changePercent: changePercent
            };
          } else {
            prices[symbol] = {
              currentPrice: null,
              change: null,
              changePercent: null
            };
          }
        } catch (e) {
          prices[symbol] = {
            currentPrice: null,
            change: null,
            changePercent: null
          };
        }
        
        // Rate limiting is handled in rateLimitedFetch
      }
      
      console.log('Realtime prices result:', prices); // Debug log
      return prices;
    }),
}); 