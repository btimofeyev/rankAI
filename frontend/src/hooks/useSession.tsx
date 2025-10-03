import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient.ts';

export type PlanTier = 'free' | 'pro';

type SessionContextValue = {
  session: Session | null;
  loading: boolean;
  plan: PlanTier;
  setPlan: (plan: PlanTier) => void;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const PLAN_KEY = 'rankai_user_plan';

const getInitialPlan = (): PlanTier => {
  if (typeof window === 'undefined') return 'free';
  const stored = window.localStorage.getItem(PLAN_KEY) as PlanTier | null;
  return stored === 'pro' ? 'pro' : 'free';
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlanState] = useState<PlanTier>(getInitialPlan);

  useEffect(() => {
    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };
    void syncSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const setPlan = useCallback((next: PlanTier) => {
    setPlanState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PLAN_KEY, next);
    }
  }, []);

  const value = useMemo<SessionContextValue>(() => ({
    session,
    loading,
    plan,
    setPlan,
    signOut: async () => {
      await supabase.auth.signOut();
      setPlan('free');
    }
  }), [session, loading, plan, setPlan]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};
