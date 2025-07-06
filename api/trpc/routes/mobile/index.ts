import { publicProcedure, createTRPCRouter } from '../../create-context';
import { z } from 'zod';

export const mobileRouter = createTRPCRouter({
  getDashboardData: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        // Get portfolio data
        const { data: portfolioData, error: portfolioError } = await ctx.supabase
          .from('portfolio')
          .select('*')
          .eq('user_id', input.userId);

        if (portfolioError) {
          console.error('Portfolio error:', portfolioError);
          throw new Error('Failed to fetch portfolio data');
        }

        // Get account balance
        const { data: balanceData, error: balanceError } = await ctx.supabase
          .from('account_balance')
          .select('*')
          .eq('user_id', input.userId);

        if (balanceError) {
          console.error('Balance error:', balanceError);
          throw new Error('Failed to fetch balance data');
        }

        // Return combined data
        return {
          success: true,
          portfolio: portfolioData || [],
          balance: balanceData?.[0]?.balance || 0,
          accountData: balanceData?.[0] || { balance: 0, user_id: input.userId },
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Mobile dashboard error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          portfolio: [],
          balance: 0,
          accountData: { balance: 0, user_id: input.userId },
          timestamp: new Date().toISOString()
        };
      }
    }),
}); 