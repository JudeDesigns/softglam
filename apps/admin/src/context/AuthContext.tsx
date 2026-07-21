import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, clearToken, setRefreshToken, setToken } from '@/lib/api';
import type { AuthResponse, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bootstrap — validate stored token.
  useEffect(() => {
    (async () => {
      try {
        const me = await api<User>('/users/me');
        if (me.role !== 'admin') { clearToken(); return; }
        setUser(me);
      } catch {
        clearToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api<AuthResponse>('/auth/sign-in', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email, password }),
      });
      if (res.user.role !== 'admin') throw new Error('Access restricted to admin accounts.');
      setToken(res.tokens.access_token);
      setRefreshToken(res.tokens.refresh_token);
      setUser(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, isLoading, error, signIn, signOut }),
    [user, isLoading, error, signIn, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
