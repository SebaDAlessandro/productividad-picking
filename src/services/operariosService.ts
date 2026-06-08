import { getSupabaseClient } from "../lib/supabase/client";
import type { Employee } from "../types/domain";

export async function getOperarios() {
  const { data, error } = await getSupabaseClient()
    .from("employees")
    .select("*")
    .order("employee_number", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Employee[];
}

export async function upsertOperario(employee: Employee) {
  const { data, error } = await getSupabaseClient()
    .from("employees")
    .upsert(employee, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as Employee;
}

export async function deleteOperario(employeeId: string) {
  const { error } = await getSupabaseClient().from("employees").delete().eq("id", employeeId);
  if (error) throw error;
}
