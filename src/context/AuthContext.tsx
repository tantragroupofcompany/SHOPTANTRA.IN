import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; profile?: Profile | null; roles?: string[] }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    businessInfo?: any
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: Error | null; link?: string | null }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ error: Error | null }>;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Helper to validate email format
const validateEmailFormat = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from Supabase or LocalStorage fallback
  useEffect(() => {
    let initialized = false;

    // Load Supabase session
    supabase.auth.getSession().then(({ data: { session: sbSession } }) => {
      if (sbSession) {
        setSession(sbSession);
        setUser(sbSession.user);
        // Restore the profile from local storage immediately so dashboards render
        // before the network profile refresh completes (and as a fallback if the
        // refresh is blocked by RBAC on cold reload).
        try {
          const storedProfile = localStorage.getItem('st_local_profile');
          if (storedProfile) {
            setProfile(JSON.parse(storedProfile) as Profile);
          }
        } catch (profileError) {
          console.warn('Failed to restore stored profile:', profileError);
        }
        fetchProfile(sbSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.warn('Supabase getSession failed:', err);
      setLoading(false);
    });

    // 3. Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sbSession) => {
      if (sbSession) {
        setSession(sbSession);
        setUser(sbSession.user);
        fetchProfile(sbSession.user.id);
      } else {
        // Only clear if we don't have a local storage session active
        if (!localStorage.getItem('st_local_session')) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/seller/profile?userId=${userId}`);
      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.data) {
          setProfile(resData.data as Profile);
          return resData.data as Profile;
        }
      }
    } catch (e) {
      console.warn('API fetchProfile failed:', e);
    }

    return null;
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const resData = await response.json();

      if (response.ok && resData.session && resData.profile) {
        setSession(resData.session);
        setUser(resData.session.user);
        setProfile(resData.profile as Profile);

        // Persist session + profile for SPA page-reload restoration
        try {
          localStorage.setItem('st_local_session', JSON.stringify(resData.session));
          localStorage.setItem('st_local_profile', JSON.stringify(resData.profile));
          localStorage.setItem('st_local_user', JSON.stringify(resData.session.user));
        } catch (storageError) {
          console.warn('Failed to persist local session:', storageError);
        }

        setLoading(false);
        return { error: null, profile: resData.profile as Profile, roles: resData.roles || [] };
      } else {
        setLoading(false);
        return { error: new Error(resData.error || 'Failed to authenticate.'), profile: null, roles: [] };
      }
    } catch (e: any) {
      console.error('API signIn failed:', e);
      setLoading(false);
      return { error: new Error(e.message || 'An error occurred during sign in.'), profile: null };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    businessInfo?: any
  ) => {
    setLoading(true);

    // Validation checks
    if (!email.trim() || !validateEmailFormat(email)) {
      setLoading(false);
      return { error: new Error('Please enter a valid email address.') };
    }

    if (!password || password.length < 6) {
      setLoading(false);
      return { error: new Error('Password must be at least 6 characters long.') };
    }

    if (!fullName.trim()) {
      setLoading(false);
      return { error: new Error('Full name is required.') };
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
          businessInfo,
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        // For sellers, do NOT auto-login. Redirect to email verification first.
        const isSeller = (resData.user?.role || role).toLowerCase() === 'seller';
        if (isSeller) {
          setLoading(false);
          return { error: null };
        }

        // Auto-login after successful registration for non-sellers
        try {
          const loginResult = await signIn(email, password);
          return loginResult;
        } catch (loginErr: any) {
          // Registration succeeded but auto-login failed — not critical
          console.warn('Auto-login after registration failed:', loginErr);
          setLoading(false);
          return { error: null }; // Registration was successful
        }
      } else {
        setLoading(false);
        return { error: new Error(resData.error || 'Failed to create account.') };
      }
    } catch (e: any) {
      console.error('API signUp failed:', e);
      setLoading(false);
      return { error: new Error(e.message || 'An error occurred during registration.') };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut failed:', e);
    }

    // Clear the shared HttpOnly auth cookie(s) used by middleware RBAC
    document.cookie = 'auth_token=; path=/; max-age=0';
    document.cookie = 'auth_role=; path=/; max-age=0';
    document.cookie = 'corporate_auth_token=; path=/; max-age=0';

    try {
      localStorage.removeItem('st_local_session');
      localStorage.removeItem('st_local_profile');
      localStorage.removeItem('st_local_user');
    } catch (storageError) {
      console.warn('Failed to clear local session storage:', storageError);
    }

    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        // SECURITY: the reset link is sent ONLY by email. It is never returned in
        // the API response nor displayed on the page (protection against exposure).
        setLoading(false);
        return { error: null, link: null };
      } else {
        setLoading(false);
        return { error: new Error(resData.error || 'Failed to request password reset link.') };
      }
    } catch (e: any) {
      console.error('API forgotPassword failed:', e);
      setLoading(false);
      return { error: new Error(e.message || 'An error occurred while requesting password reset.') };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      return { error: new Error('Password must be at least 6 characters long.') };
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setLoading(false);
        return { error: null };
      } else {
        setLoading(false);
        return { error: new Error(resData.error || 'Failed to reset password.') };
      }
    } catch (e: any) {
      console.error('API resetPassword failed:', e);
      setLoading(false);
      return { error: new Error(e.message || 'An error occurred while resetting the password.') };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, role: profile?.role ?? null, loading,
      signIn, signUp, signOut, refreshProfile, forgotPassword, resetPassword, setProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
