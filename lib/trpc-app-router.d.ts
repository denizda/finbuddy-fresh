// Type definition for the TRPC AppRouter
// This should match the structure from backend/trpc/app-router.ts

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { CreateTRPCReact } from '@trpc/react-query';

// Define the router structure based on your actual backend router
export type AppRouter = {
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
};

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>; 