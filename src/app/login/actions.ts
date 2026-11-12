"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Bitte E-Mail und Passwort eingeben." };

  const supabase = await createClient();
  if (!supabase) return { error: "Der Login ist noch nicht mit Supabase verbunden." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Anmeldung konnte nicht bestätigt werden." };
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  redirect(profile ? "/tipps" : "/profil");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/login");
}
