import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/state/session';

export default function OnboardingLayout() {
  const { isAuthenticated } = useSession();
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
