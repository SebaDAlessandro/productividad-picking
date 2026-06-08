import { getSupabaseClient } from "../lib/supabase/client";
import type { WorkCourt } from "../types/domain";

function normalizeCourt(court: WorkCourt) {
  return {
    ...court,
    expected_packages_per_hour: Number(court.expected_packages_per_hour),
  };
}

export async function getCanchas() {
  const { data, error } = await getSupabaseClient()
    .from("work_courts")
    .select("*")
    .order("code", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as WorkCourt[]).map(normalizeCourt);
}

export async function upsertCancha(court: WorkCourt) {
  const { data, error } = await getSupabaseClient()
    .from("work_courts")
    .upsert(court, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return normalizeCourt(data as WorkCourt);
}

export async function deleteCancha(courtId: string) {
  const { error } = await getSupabaseClient().from("work_courts").delete().eq("id", courtId);
  if (error) throw error;
}
