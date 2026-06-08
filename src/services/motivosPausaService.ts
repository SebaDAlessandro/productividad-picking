import { getSupabaseClient } from "../lib/supabase/client";
import type { PauseReason } from "../types/domain";

export async function getMotivosPausa() {
  const { data, error } = await getSupabaseClient()
    .from("pause_reasons")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PauseReason[];
}

export async function upsertMotivoPausa(reason: PauseReason) {
  const { data, error } = await getSupabaseClient()
    .from("pause_reasons")
    .upsert(reason, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as PauseReason;
}

export async function deleteMotivoPausa(reasonId: string) {
  const { error } = await getSupabaseClient().from("pause_reasons").delete().eq("id", reasonId);
  if (error) throw error;
}
