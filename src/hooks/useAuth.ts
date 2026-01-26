import { useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initialized.current) return;
    initialized.current = true;

    const supabase = getSupabase();
    
    // Set up auth state listener FIRST (synchronous state updates only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Only synchronous state updates here - no async calls
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  };

  const getUsername = (): string => {
    return user?.user_metadata?.username || user?.email?.split('@')[0] || 'Miner';
  };

  return {
    user,
    session,
    loading,
    signOut,
    getUsername,
    isAuthenticated: !!session,
  };
}
