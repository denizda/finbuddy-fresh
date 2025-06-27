import { createTRPCRouter } from "./create-context";
import { portfolioRouter } from "./routes/portfolio/get";
import { stocksRouter } from "./routes/stocks/search";
import { tradingRouter } from "./routes/trading/trade";

export const appRouter = createTRPCRouter({
  portfolio: portfolioRouter,
  stocks: stocksRouter,
  trading: tradingRouter,
});

export type AppRouter = typeof appRouter;