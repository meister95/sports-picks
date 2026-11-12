"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type NewPasswordState = { error?: string };

export async function updatePasswordAction(_previous: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (password.length < 8) return { error: "Das Passwort muss mindestens 8 Zeichen lang sein." };
  if (password !== confirmPassword) return { error: "Die Passwörter stimmen nicht überein." };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase ist nicht erreichbar. Bitte fordere einen neuen Link an." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login/reset?error=expired");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Das Passwort konnte nicht geändert werden. Bitte fordere einen neuen Link an." };
  redirect("/tipps");
}
