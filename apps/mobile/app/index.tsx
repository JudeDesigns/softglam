import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '@/state/session';
import { useSkinProfile } from '@/state/skin-profile';

export default function Index() {
  const { isAuthenticated, isLoading, role } = useSession();
  const profile = useSkinProfile((s) => s.profile);
  const skipped = useSkinProfile((s) => s.onboardingSkipped);

  // Wait for the session bootstrap (token validation) to finish.
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  // Clients see the onboarding gate; artists go straight to their dashboard.
  if (role === 'client' && profile === null && !skipped) {
    return <Redirect href="/(onboarding)/welcome" />;
  }
  return <Redirect href="/(app)/home" />;
}
