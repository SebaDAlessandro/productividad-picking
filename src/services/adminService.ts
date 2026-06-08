import { getSupabaseClient } from "../lib/supabase/client";
import type { RoleName, UserProfile } from "../types/domain";

export type RoleRecord = {
  id: string;
  name: RoleName;
  description: string | null;
  permissions: Record<string, unknown>;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
};

export type SettingRecord = {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getUsersProfile() {
  const { data, error } = await getSupabaseClient()
    .from("users_profile")
    .select("*")
    .order("email", { ascending: true });

  if (error) throw error;
  return (data ?? []) as UserProfile[];
}

export async function updateUserProfile(profile: UserProfile) {
  const { data, error } = await getSupabaseClient()
    .from("users_profile")
    .update({
      full_name: profile.full_name,
      role: profile.role,
      employee_id: profile.employee_id,
      is_active: profile.is_active,
    })
    .eq("id", profile.id)
    .select("*")
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export async function getRoles() {
  const { data, error } = await getSupabaseClient()
    .from("roles")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as RoleRecord[];
}

export async function getSettings() {
  const { data, error } = await getSupabaseClient()
    .from("settings")
    .select("*")
    .order("key", { ascending: true });

  if (error) throw error;
  return (data ?? []) as SettingRecord[];
}
