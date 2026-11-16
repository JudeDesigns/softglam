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
import * as SecureStore from 'expo-secure-store';
import { ApiError, clearTokens, getAccessToken, setTokens } from '@/api/client';
import { apiGetMe, apiSignIn, apiSignUp, type SignInInput, type SignUpInput } from '@/api/auth';
import { useSkinProfile } from './skin-profile';
import { useLookRequests } from './look-requests';
import { useInvites } from './invites';
import { useArtists } from './artists';
import { useLookCatalog } from './looks';
import { useAppointments } from './appointments';

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

// Last signed-in user, so a flaky network at launch doesn't log people out.
const USER_KEY = 'softglow.user';

async function cacheUser(user: SessionUser | null): Promise<void> {
  if (user) await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  else await SecureStore.deleteItemAsync(USER_KEY);
}

async function cachedUser(): Promise<SessionUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

/** Only an explicit "your login is no longer valid" from the server ends the session. */
function isAuthRejection(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function syncStores(role: UserRole) {
    // Always fetch artists and the look catalog (needed for both roles).
    void useArtists.getState().fetch();
    void useLookCatalog.getState().fetch();
    // Fetch user-specific data.
    void useSkinProfile.getState().fetchFromApi();
    void useLookRequests.getState().fetchFromApi();
    if (role === 'artist') {
      void useInvites.getState().fetchFromApi();
      void useAppointments.getState().fetchFromApi();
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
          void cacheUser(sessionUser);
          // Hydrate stores in the background.
          void syncStores(me.role);
        }
      } catch (err) {
        if (isAuthRejection(err)) {
          await clearTokens();
          await cacheUser(null);
        } else {
          // Server unreachable (offline, restarting): stay signed in with the
          // last known user; screens show cached data and retry later.
          const last = await cachedUser();
          if (last && !cancelled) setUser(last);
        }
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
      const sessionUser = {
        id: res.user.id,
        email: res.user.email,
        displayName: res.user.display_name,
        role: res.user.role,
      };
      setUser(sessionUser);
      void cacheUser(sessionUser);
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
      const sessionUser = {
        id: res.user.id,
        email: res.user.email,
        displayName: res.user.display_name,
        role: res.user.role,
      };
      setUser(sessionUser);
      void cacheUser(sessionUser);
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
    await cacheUser(null);
    setUser(null);
    useSkinProfile.getState().signOutReset();
    useLookRequests.getState().reset();
    useInvites.getState().reset();
    useAppointments.getState().reset();
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
