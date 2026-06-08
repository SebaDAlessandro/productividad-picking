import { getSupabaseClient } from "../lib/supabase/client";
import { SUPERADMIN_EMAIL, type UserProfile } from "../types/domain";

export async function getAuthenticatedProfile() {
  const client = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await client
    .from("users_profile")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (data) return data as UserProfile;

  return {
    id: user.id,
    auth_user_id: user.id,
    email: user.email ?? "",
    full_name: user.email === SUPERADMIN_EMAIL ? "Superadministrador" : null,
    role: user.email === SUPERADMIN_EMAIL ? "superadmin" : "solo_lectura",
    employee_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } satisfies UserProfile;
}
