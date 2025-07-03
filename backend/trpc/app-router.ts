import { createTRPCRouter } from "./create-context";
import { portfolioRouter } from "./routes/portfolio/get";
import { stocksRouter } from "./routes/stocks/search";
import { tradingRouter } from "./routes/trading/trade";
import { mobileRouter } from "./routes/mobile";

export const appRouter = createTRPCRouter({
  portfolio: portfolioRouter,
  stocks: stocksRouter,
  trading: tradingRouter,
  mobile: mobileRouter,
});

export type AppRouter = typeof appRouter;