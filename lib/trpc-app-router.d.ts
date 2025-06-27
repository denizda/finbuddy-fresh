// Standalone AppRouter type definition for mobile builds
// This prevents importing server-side code in the mobile app

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export interface AppRouter {
  portfolio: {
    getPortfolio: any;
    getRealtimePrices: any;
  };
  stocks: {
    searchStocks: any;
    getStockQuote: any;
  };
  trading: {
    getAccountBalance: any;
    trade: any;
  };
}

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>; 