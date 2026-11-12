"use server";

import { createClient } from "@/lib/supabase/server";

export type ResetState = { error?: string; sent?: boolean };

export async function requestPasswordReset(_previous: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Bitte gib deine E-Mail-Adresse ein." };
  const supabase = await createClient();
  if (!supabase) return { error: "Der Login ist noch nicht mit Supabase verbunden." };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const redirectTo = new URL("/auth/confirm?flow=recovery", siteUrl).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: "Die E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut." };
  return { sent: true };
}
