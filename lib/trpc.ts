import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../backend/trpc/app-router';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

// Create the production URL for mobile/web clients
const createProductionUrl = () => {
  return 'https://finbuddy-fresh.vercel.app/api/trpc';
};

// Create the development URL for Expo Go
const createDevelopmentUrl = () => {
  // Use the Mac's IP address for iOS Simulator/Expo Go
  return 'http://172.20.10.2:3000/api/trpc';
};

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: __DEV__ ? createDevelopmentUrl() : createProductionUrl(),
    }),
  ],
  transformer: {
    input: {
      serialize: (object) => object,
      deserialize: (object) => object,
    },
    output: {
      serialize: (object) => object,
      deserialize: (object) => object,
    },
  },
});