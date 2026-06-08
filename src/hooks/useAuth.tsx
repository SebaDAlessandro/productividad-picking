import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase/client";
import { demoProfiles } from "../lib/supabase/demoData";
import { SUPERADMIN_EMAIL, type UserProfile } from "../types/domain";

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  demoLogin: (role?: UserProfile["role"]) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function demoProfile(role: UserProfile["role"] = "superadmin"): UserProfile {
  return {
    ...demoProfiles[0],
    role,
    email: role === "superadmin" ? SUPERADMIN_EMAIL : `${role}@demo.local`,
    full_name: role === "superadmin" ? "Superadministrador" : `Usuario ${role}`,
  };
}

function fallbackProfile(email?: string | null) {
  return demoProfile(email?.toLowerCase() === SUPERADMIN_EMAIL ? "superadmin" : "solo_lectura");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (!isSupabaseConfigured) return demoProfile();
    return null;
  });
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadProfile = useCallback(async (authUserId: string, email?: string | null) => {
    const { data, error } = await getSupabaseClient()
      .from("users_profile")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    if (error) {
      setProfile(fallbackProfile(email));
      return;
    }
    setProfile(data ?? fallbackProfile(email));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let mounted = true;
    const client = getSupabaseClient();
    client.auth
      .getUser()
      .then(async ({ data }) => {
        if (!mounted) return;
        const { data: sessionData } = await client.auth.getSession();
        setSession(sessionData.session);
        if (data.user) await loadProfile(data.user.id, data.user.email);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void loadProfile(nextSession.user.id, nextSession.user.email);
      } else {
        setProfile(null);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      setProfile(demoProfile(email.toLowerCase() === SUPERADMIN_EMAIL ? "superadmin" : "operario"));
      return {};
    }
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      setSession(data.session);
      await loadProfile(data.user.id, data.user.email);
    }
    return { error: error?.message };
  }, [loadProfile]);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return {};
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await getSupabaseClient().auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const demoLogin = useCallback((role: UserProfile["role"] = "superadmin") => {
    setProfile(demoProfile(role));
  }, []);

  const value = useMemo(
    () => ({ session, profile, loading, signIn, resetPassword, signOut, demoLogin }),
    [session, profile, loading, signIn, resetPassword, signOut, demoLogin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
