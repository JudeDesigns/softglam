import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserRole } from '@softglow/types';
import { clearTokens, getAccessToken, setTokens } from '@/api/client';
import { apiGetMe, apiSignIn, apiSignUp, type SignInInput, type SignUpInput } from '@/api/auth';
import { useSkinProfile } from './skin-profile';
import { useLookRequests } from './look-requests';
import { useInvites } from './invites';
import { useArtists } from './artists';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

interface SessionState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SessionUser | null;
  role: UserRole | null;
  error: string | null;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionState | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function syncStores(role: UserRole) {
    // Always fetch artists (needed for both roles).
    void useArtists.getState().fetch();
    // Fetch user-specific data.
    void useSkinProfile.getState().fetchFromApi();
    void useLookRequests.getState().fetchFromApi();
    if (role === 'artist') {
      void useInvites.getState().fetchFromApi();
    }
  }

  // On mount, check if a valid token is already stored (resuming session).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const me = await apiGetMe();
        if (!cancelled) {
          const sessionUser = {
            id: me.id,
            email: me.email,
            displayName: me.display_name,
            role: me.role,
          };
          setUser(sessionUser);
          // Hydrate stores in the background.
          void syncStores(me.role);
        }
      } catch {
        await clearTokens();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await apiSignIn(input);
      await setTokens(res.tokens.access_token, res.tokens.refresh_token);
      setUser({
        id: res.user.id,
        email: res.user.email,
        displayName: res.user.display_name,
        role: res.user.role,
      });
      void syncStores(res.user.role);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signUp = useCallback(async (input: SignUpInput) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await apiSignUp(input);
      await setTokens(res.tokens.access_token, res.tokens.refresh_token);
      setUser({
        id: res.user.id,
        email: res.user.email,
        displayName: res.user.display_name,
        role: res.user.role,
      });
      void syncStores(res.user.role);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-up failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    await clearTokens();
    setUser(null);
    useSkinProfile.getState().signOutReset();
    useLookRequests.getState().reset();
    useInvites.getState().reset();
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      isAuthenticated: user !== null,
      isLoading,
      user,
      role: user?.role ?? null,
      error,
      signIn,
      signUp,
      signOut,
    }),
    [user, isLoading, error, signIn, signUp, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
