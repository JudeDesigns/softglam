import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/state/session';

export default function AuthLayout() {
  const { isAuthenticated } = useSession();
  if (isAuthenticated) {
    return <Redirect href="/(app)/home" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
