import { getSupabaseClient } from "../lib/supabase/client";

export interface SupabaseDatabaseUsage {
  database_size_bytes: number;
  database_size_mb: number;
  database_limit_mb: number;
  usage_percent: number;
}

function normalizeUsage(value: unknown): SupabaseDatabaseUsage | null {
  const item = Array.isArray(value) ? value[0] : value;
  if (!item || typeof item !== "object") return null;
  const usage = item as Record<string, unknown>;
  return {
    database_size_bytes: Number(usage.database_size_bytes ?? 0),
    database_size_mb: Number(usage.database_size_mb ?? 0),
    database_limit_mb: Number(usage.database_limit_mb ?? 0),
    usage_percent: Number(usage.usage_percent ?? 0),
  };
}

export async function getSupabaseDatabaseUsage() {
  const { data, error } = await getSupabaseClient().rpc("get_supabase_database_usage");
  if (error) throw error;
  return normalizeUsage(data);
}
