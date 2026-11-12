"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Tip, TipRisk } from "@/data/picks";

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
  const reasoning = input.reasoning.trim();
  const risk: TipRisk = input.risk === "sicher" || input.risk === "riskant" ? input.risk : "moderat";
  const odds = input.odds;
  if (!league || !matchId || !home || !away || !selection || selection.length > 100 || !reasoning || reasoning.length > 1000
    || (odds !== undefined && (!Number.isFinite(odds) || odds <= 1))) return null;

  const publishedAt = new Date().toISOString();
  const { data, error } = await supabase.from("prediq_tips").insert({
    owner_id: user.id, league, match_id: matchId, home, away, selection, reasoning,
    odds: odds ?? null, risk, result: "offen", published_at: publishedAt, kickoff: input.kickoff, is_published: true,
  }).select("id").single();
  if (error || !data) return null;

  revalidatePath("/tipps");
  return { ...input, id: data.id, publishedAt, result: "offen", risk };
}
