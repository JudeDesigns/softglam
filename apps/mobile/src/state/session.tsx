import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { UserRole } from '@softglow/types';

/**
 * Minimal in-memory session store. Replaced by real auth + secure storage later.
 * Kept context-based (not Zustand yet) to avoid an extra dependency before it earns its keep.
 */
interface SessionState {
  isAuthenticated: boolean;
  role: UserRole | null;
  signIn: (role: UserRole) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionState | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);

  const value = useMemo<SessionState>(
    () => ({
      isAuthenticated: role !== null,
      role,
      signIn: (nextRole) => setRole(nextRole),
      signOut: () => setRole(null),
    }),
    [role],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
