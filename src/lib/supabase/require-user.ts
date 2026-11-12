import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function requireUser() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  return { supabase, user };
}
