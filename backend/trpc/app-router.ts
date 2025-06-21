import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { portfolioRouter } from "./routes/portfolio/get";
import { stocksRouter } from "./routes/stocks/search";
import { tradingRouter } from "./routes/trading/trade";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  portfolio: portfolioRouter,
  stocks: stocksRouter,
  trading: tradingRouter,
});

export type AppRouter = typeof appRouter;