"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Tip, TipResult, TipRisk } from "@/data/picks";

export async function publishTip(input: Omit<Tip, "id" | "publishedAt" | "result">): Promise<Tip | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("is_owner").eq("id", user.id).maybeSingle();
  if (profile?.is_owner !== true) return null;

  const league = input.league.trim();
  const matchId = input.matchId.trim();
  const home = input.home.trim();
  const away = input.away.trim();
  const selection = input.selection.trim();
  const reasoning = input.reasoning.trim() || "Keine Begründung angegeben.";
  const risk: TipRisk = input.risk === "sicher" || input.risk === "riskant" ? input.risk : "moderat";
  if (!league || !matchId || !home || !away || !selection || selection.length > 100 || !reasoning || reasoning.length > 1000
  ) return null;

  const publishedAt = new Date().toISOString();
  const { data, error } = await supabase.from("prediq_tips").insert({
    owner_id: user.id, league, match_id: matchId, home, away, selection, reasoning,
    risk, result: "offen", published_at: publishedAt, kickoff: input.kickoff, is_published: true,
  }).select("id").single();
  if (error || !data) return null;

  revalidatePath("/tipps");
  return { ...input, id: data.id, publishedAt, result: "offen", risk };
}

export async function deleteTip(tipId: string): Promise<{ error?: string }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tipId)) {
    return { error: "Dieser Tipp konnte nicht gefunden werden." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Die Verbindung zur Datenbank fehlt." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };
  const { data: profile } = await supabase.from("profiles").select("is_owner").eq("id", user.id).maybeSingle();
  if (profile?.is_owner !== true) return { error: "Nur der Eigentümer kann Tipps löschen." };

  const { error } = await supabase.rpc("delete_owner_tip", { p_tip_id: tipId });
  if (error) return { error: "Der Tipp und seine Kommentare konnten nicht gelöscht werden. Bitte versuche es erneut." };

  revalidatePath("/tipps");
  revalidatePath("/statistik");
  return {};
}

export async function updateTip(tipId: string, formData: FormData): Promise<{ error?: string }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tipId)) {
    return { error: "Dieser Tipp konnte nicht gefunden werden." };
  }

  const selection = String(formData.get("selection") ?? "").trim();
  const reasoning = String(formData.get("reasoning") ?? "").trim() || "Keine Begründung angegeben.";
  const riskValue = String(formData.get("risk") ?? "moderat");
  const risk: TipRisk = riskValue === "sicher" || riskValue === "riskant" ? riskValue : "moderat";
  if (!selection || selection.length > 100 || reasoning.length > 1000) {
    return { error: "Bitte prüfe deine Auswahl und Begründung." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Die Verbindung zur Datenbank fehlt." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };
  const { data: profile } = await supabase.from("profiles").select("is_owner").eq("id", user.id).maybeSingle();
  if (profile?.is_owner !== true) return { error: "Nur der Eigentümer kann Tipps bearbeiten." };

  const { data, error } = await supabase.from("prediq_tips").update({ selection, reasoning, risk }).eq("id", tipId).eq("owner_id", user.id).select("id").maybeSingle();
  if (error || !data) return { error: "Der Tipp konnte nicht gespeichert werden. Bitte versuche es erneut." };

  revalidatePath("/tipps");
  return {};
}

export async function setTipResult(tipId: string, resultValue: string): Promise<{ error?: string }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tipId)) {
    return { error: "Dieser Tipp konnte nicht gefunden werden." };
  }
  if (resultValue !== "offen" && resultValue !== "gewonnen" && resultValue !== "verloren" && resultValue !== "annulliert") {
    return { error: "Bitte wähle ein gültiges Ergebnis." };
  }
  const result = resultValue as TipResult;
  const supabase = await createClient();
  if (!supabase) return { error: "Die Verbindung zur Datenbank fehlt." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };
  const { data: profile } = await supabase.from("profiles").select("is_owner").eq("id", user.id).maybeSingle();
  if (profile?.is_owner !== true) return { error: "Nur der Eigentümer kann Ergebnisse festlegen." };

  const { data, error } = await supabase.from("prediq_tips").update({ result }).eq("id", tipId).eq("owner_id", user.id).select("id").maybeSingle();
  if (error || !data) return { error: "Das Ergebnis konnte nicht gespeichert werden. Bitte versuche es erneut." };

  revalidatePath("/tipps");
  revalidatePath("/statistik");
  return {};
}
