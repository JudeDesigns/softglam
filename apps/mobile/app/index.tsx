import { Redirect } from 'expo-router';
import { useSession } from '@/state/session';
import { useSkinProfile } from '@/state/skin-profile';

export default function Index() {
  const { isAuthenticated, role } = useSession();
  const profile = useSkinProfile((s) => s.profile);
  const skipped = useSkinProfile((s) => s.onboardingSkipped);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  // Clients see the onboarding gate; artists go straight to their dashboard.
  if (role === 'client' && profile === null && !skipped) {
    return <Redirect href="/(onboarding)/welcome" />;
  }
  return <Redirect href="/(app)/home" />;
}
