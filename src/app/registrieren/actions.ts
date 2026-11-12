"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type RegisterState = { error?: string; sent?: boolean };

export async function registerAction(_previous: RegisterState, formData: FormData): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!email || !password) return { error: "Bitte E-Mail und Passwort eingeben." };
  if (password.length < 8) return { error: "Das Passwort muss mindestens 8 Zeichen lang sein." };
  if (password !== confirmPassword) return { error: "Die Passwörter stimmen nicht überein." };

  const supabase = await createClient();
  if (!supabase) return { error: "Die Registrierung ist noch nicht mit Supabase verbunden." };
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: "Registrierung fehlgeschlagen. Prüfe deine E-Mail-Adresse und versuche es erneut." };
  if (data.session) redirect("/profil");
  return { sent: true };
}
