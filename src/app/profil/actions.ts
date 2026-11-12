"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string };

export async function saveProfileAction(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  const username = String(formData.get("username") ?? "").trim();
  if (!/^[\p{L}\p{N}_-]{2,24}$/u.test(username)) return { error: "Der Name muss 2–24 Zeichen lang sein (Buchstaben, Zahlen, _ oder -)." };
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase ist noch nicht verbunden." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const password = String(formData.get("password") ?? "");
  if (formData.get("invited") === "1") {
    if (password.length < 8) return { error: "Das Passwort muss mindestens 8 Zeichen lang sein." };
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) return { error: "Das Passwort konnte nicht gespeichert werden. Bitte versuche es erneut." };
  }
  const { data: existingProfile, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (lookupError) {
    console.error("Profile lookup failed", { code: lookupError.code, message: lookupError.message });
    return { error: `Profil konnte nicht geprüft werden (Fehlercode ${lookupError.code ?? "unbekannt"}).` };
  }

  const { error } = existingProfile
    ? await supabase.from("profiles").update({ username }).eq("id", user.id)
    : await supabase.from("profiles").insert({ id: user.id, username });
  if (error) {
    console.error("Profile upsert failed", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    if (error.code === "23505") return { error: "Dieser Nutzername ist bereits vergeben." };
    return { error: `Profil konnte nicht gespeichert werden (Fehlercode ${error.code ?? "unbekannt"}).` };
  }
  redirect("/tipps");
}
