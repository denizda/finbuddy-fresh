import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import { supabase } from "../../lib/supabase-backend";

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  return {
    req: opts.req,
    supabase,
    // You can add more context items here like database connections, auth, etc.
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC with dynamic superjson import to avoid ES module issues
const t = initTRPC.context<Context>().create({
  transformer: {
    input: {
      serialize: (object) => JSON.stringify(object),
      deserialize: (object) => JSON.parse(object),
    },
    output: {
      serialize: (object) => JSON.stringify(object),
      deserialize: (object) => JSON.parse(object),
    },
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;