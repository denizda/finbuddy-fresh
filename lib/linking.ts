import * as Linking from 'expo-linking';

export default {
  prefixes: [Linking.createURL('/'), 'finbuddy://', 'https://rork.app'],
  config: {
    screens: {
      // This will be used to handle the auth callback
      '(auth)': {
        path: 'auth',
        screens: {
          // This will match any path under /auth/*
          '*': '*',
        },
      },
    },
  },
};
