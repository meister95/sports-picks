import { cache } from "react";
import { createClient } from "./server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null, profile: null };

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const id = claims?.sub;
  if (error || !claims || typeof id !== "string") return { supabase, user: null, profile: null };

  const profileResult = await supabase
    .from("profiles")
    .select("username,is_owner,avatar_path")
    .eq("id", id)
    .maybeSingle();
  let profile = profileResult.data;

  // Keep the existing site working until the avatar SQL setup is applied.
  if (profileResult.error?.code === "42703" || profileResult.error?.code === "PGRST204") {
    const fallback = await supabase
      .from("profiles")
      .select("username,is_owner")
      .eq("id", id)
      .maybeSingle();
    profile = fallback.data ? { ...fallback.data, avatar_path: null } : null;
  }

  return {
    supabase,
    user: { id, email: typeof claims.email === "string" ? claims.email : undefined },
    profile,
  };
});
