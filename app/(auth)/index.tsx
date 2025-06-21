import { Redirect } from 'expo-router';

export default function AuthIndex() {
  // @ts-ignore - Expo Router types are not up to date with file-based routing
  return <Redirect href="/login" />;
}
