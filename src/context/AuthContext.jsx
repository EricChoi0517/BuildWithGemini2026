import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { isGuestMode, setGuestModeEnabled, clearGuestStorage } from '@/lib/guestCookies';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(
    () => typeof window !== 'undefined' && isGuestMode()
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      if (isGuestMode()) clearGuestStorage();
      setIsGuest(false);
    } else {
      setIsGuest(isGuestMode());
    }
  }, [user]);

  const enterGuestMode = useCallback(() => {
    setGuestModeEnabled(true);
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(() => {
    clearGuestStorage();
    setIsGuest(false);
  }, []);

  async function signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) throw error;
    if (data?.session?.user) {
      clearGuestStorage();
      setIsGuest(false);
    }
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    clearGuestStorage();
    setIsGuest(false);
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        enterGuestMode,
        exitGuestMode,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
