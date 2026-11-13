import { redirect } from "next/navigation";
import { getCurrentUser } from "./current-user";

export async function requireUser() {
  const current = await getCurrentUser();
  if (!current.supabase || !current.user) redirect("/login");
  return current;
}
