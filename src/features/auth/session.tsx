import type { ReactNode } from 'react';
import { createContext, use } from 'react';
import { useAnonymousAuthSession } from './useAnonymousAuthSession';
import type { Session } from './useAnonymousAuthSession';

const SessionContext = createContext<Session>({ uid: null, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useAnonymousAuthSession();
  return <SessionContext value={session}>{children}</SessionContext>;
}

export const useSession = (): Session => use(SessionContext);
