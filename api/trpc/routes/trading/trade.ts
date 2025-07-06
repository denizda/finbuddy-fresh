import { publicProcedure, createTRPCRouter } from '../../create-context';
import { z } from 'zod';

const INITIAL_BALANCE = 100000; // $100,000 initial balance

export const tradingRouter = createTRPCRouter({
  getAccountBalance: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get user's portfolio total value
      const { data: portfolioData } = await ctx.supabase
        .from('portfolio')
        .select('current_total_value')
        .eq('user_id', input.userId);
      
      const portfolioValue = portfolioData?.reduce((sum, item) => sum + (item.current_total_value || 0), 0) || 0;
      const availableBalance = INITIAL_BALANCE - portfolioValue;
      
      return {
        totalBalance: INITIAL_BALANCE,
        portfolioValue,
        availableBalance,
      };
    }),
    
  executeTrade: publicProcedure
    .input(z.object({
      userId: z.string(),
      symbol: z.string(),
      companyName: z.string(),
      quantity: z.number().positive(),
      price: z.number().positive(),
      type: z.enum(['buy', 'sell']),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, symbol, companyName, quantity, price, type } = input;
      const totalValue = quantity * price;
      
      // Check if company exists, if not create it
      const { data: existingCompany } = await ctx.supabase
        .from('companies')
        .select('id, symbol')
        .eq('symbol', symbol)
        .single();
        
      let companyId = existingCompany?.id;
      
      if (!existingCompany) {
        // Create new company
        const { data: newCompany, error: companyError } = await ctx.supabase
          .from('companies')
          .insert({
            id: symbol, // Use symbol as ID
            symbol,
            name: companyName,
            price,
          })
          .select()
          .single();
          
        if (companyError) {
          throw new Error(`Failed to create company: ${companyError.message}`);
        }
        
        companyId = newCompany.id;
      }
      
      // Check existing position
      const { data: existingPosition } = await ctx.supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', userId)
        .eq('company_ticker', symbol)
        .single();
      
      if (type === 'buy') {
        // Check available balance
        const { data: portfolioData } = await ctx.supabase
          .from('portfolio')
          .select('current_total_value')
          .eq('user_id', userId);
        
        const portfolioValue = portfolioData?.reduce((sum, item) => sum + (item.current_total_value || 0), 0) || 0;
        const availableBalance = INITIAL_BALANCE - portfolioValue;
        
        if (totalValue > availableBalance) {
          throw new Error(`Insufficient funds. Available balance: $${availableBalance.toFixed(2)}`);
        }
        
        if (existingPosition) {
          // Update existing position
          const newQuantity = existingPosition.quantity + quantity;
          const newAverageCost = ((existingPosition.average_cost * existingPosition.quantity) + (price * quantity)) / newQuantity;
          const newTotalValue = newQuantity * price;
          
          const { error } = await ctx.supabase
            .from('portfolio')
            .update({
              quantity: newQuantity,
              average_cost: newAverageCost,
              current_total_value: newTotalValue,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPosition.id);
            
          if (error) {
            throw new Error(`Failed to update position: ${error.message}`);
          }
        } else {
          // Create new position
          const { error } = await ctx.supabase
            .from('portfolio')
            .insert({
              user_id: userId,
              company_ticker: symbol,
              quantity,
              average_cost: price,
              current_total_value: totalValue,
            });
            
          if (error) {
            throw new Error(`Failed to create position: ${error.message}`);
          }
        }
      } else { // sell
        if (!existingPosition) {
          throw new Error('No position found to sell');
        }
        
        if (quantity > existingPosition.quantity) {
          throw new Error(`Insufficient shares. You have ${existingPosition.quantity} shares`);
        }
        
        const newQuantity = existingPosition.quantity - quantity;
        
        if (newQuantity === 0) {
          // Delete position
          const { error } = await ctx.supabase
            .from('portfolio')
            .delete()
            .eq('id', existingPosition.id);
            
          if (error) {
            throw new Error(`Failed to delete position: ${error.message}`);
          }
        } else {
          // Update position
          const newTotalValue = newQuantity * price;
          
          const { error } = await ctx.supabase
            .from('portfolio')
            .update({
              quantity: newQuantity,
              current_total_value: newTotalValue,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPosition.id);
            
          if (error) {
            throw new Error(`Failed to update position: ${error.message}`);
          }
        }
      }
      
      return {
        success: true,
        message: `Successfully ${type === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${symbol}`,
      };
    }),
}); 