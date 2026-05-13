import { Redirect } from 'expo-router';
import { useSession } from '@/state/session';

export default function Index() {
  const { isAuthenticated } = useSession();
  return <Redirect href={isAuthenticated ? '/(app)/home' : '/(auth)/sign-in'} />;
}
