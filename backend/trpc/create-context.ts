import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
// import superjson from "superjson";
import { supabase } from "../../lib/supabase-backend";

// Dynamic import for superjson
let superjson: any;
(async () => {
  superjson = (await import("superjson")).default;
})();

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  return {
    req: opts.req,
    supabase,
    // You can add more context items here like database connections, auth, etc.
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;