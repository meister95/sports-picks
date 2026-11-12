import { requireUser } from "@/lib/supabase/require-user";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TipsExplorer } from "@/components/tips-explorer";
import type { Tip } from "@/data/picks";

export const dynamic = "force-dynamic";

export default async function TippsPage() {
  const { supabase, user } = await requireUser();
  let isOwner = false;
  let tips: Tip[] = [];
  const { data: profile } = await supabase.from("profiles").select("is_owner").eq("id", user.id).maybeSingle();
  isOwner = profile?.is_owner === true;
  const { data } = await supabase.from("prediq_tips").select("*").eq("is_published", true).order("published_at", { ascending: false });
  tips = (data ?? []).map((row) => ({
    id: row.id, league: row.league, matchId: row.match_id, home: row.home, away: row.away,
    selection: row.selection, reasoning: row.reasoning, odds: row.odds ?? undefined,
    risk: row.risk, result: row.result, publishedAt: row.published_at, kickoff: row.kickoff,
  } as Tip));
  return <>
    <SiteHeader currentPath="/tipps" />
    <main className="page-wrap quick-page tips-page">
      <TipsExplorer tips={tips} isOwner={isOwner} />
    </main>
    <SiteFooter />
  </>;
}
