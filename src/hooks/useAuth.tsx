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
import { isSupabaseConfigured, supabase } from "../lib/supabase/client";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (!isSupabaseConfigured) return demoProfile();
    return null;
  });
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadProfile = useCallback(async (authUserId: string, email?: string | null) => {
    const { data, error } = await supabase
      .from("users_profile")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    if (error) throw error;
    setProfile(data ?? demoProfile(email === SUPERADMIN_EMAIL ? "superadmin" : "solo_lectura"));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData.session);
      if (data.user) await loadProfile(data.user.id, data.user.email);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return {};
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
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
