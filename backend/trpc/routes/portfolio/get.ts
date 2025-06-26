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

async function getRealtimePrice(symbol: string, retries = 3, delay = 1000): Promise<number | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
      const response = await globalThis.fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as FinnhubQuoteResponse;
      
      if (!data || typeof data.c !== 'number') {
        throw new Error('Invalid response format from Finnhub API');
      }
      
      console.log('Finnhub API success:', symbol, data.c);
      return data.c; // 'c' is the current price
      
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${symbol}:`, error);
      
      if (i === retries - 1) {
        console.error(`All ${retries} attempts failed for ${symbol}`);
        return null;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  return null;
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
      
      await Promise.all(
        input.symbols.map(async (symbol: any) => {
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
        })
      );
      console.log('Realtime prices result:', prices); // Debug log
      return prices;
    }),
}); 