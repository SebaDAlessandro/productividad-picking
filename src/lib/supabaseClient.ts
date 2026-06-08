import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en las variables de entorno.");
  }
  return supabase;
}

export async function testSupabaseConnection() {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message: "Faltan variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.",
    };
  }

  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message: data.session ? "Conexion activa con sesion autenticada." : "Conexion configurada sin sesion activa.",
  };
}
