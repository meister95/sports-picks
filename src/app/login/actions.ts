"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { REMEMBER_ME_COOKIE, rememberMeCookieOptions } from "@/lib/supabase/session-cookies";

export type LoginState = { error?: string };

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("rememberMe") === "on";
  if (!email || !password) return { error: "Bitte E-Mail und Passwort eingeben." };

  const supabase = await createClient(rememberMe);
  if (!supabase) return { error: "Der Login ist noch nicht mit Supabase verbunden." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Anmeldung konnte nicht bestätigt werden." };
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_ME_COOKIE, rememberMe ? "persistent" : "session", rememberMeCookieOptions(rememberMe));
  redirect(profile ? "/tipps" : "/profil");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(REMEMBER_ME_COOKIE);
  redirect("/login");
}
