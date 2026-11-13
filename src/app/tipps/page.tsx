import { requireUser } from "@/lib/supabase/require-user";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TipsExplorer } from "@/components/tips-explorer";
import { createClient } from "@/lib/supabase/server";
import type { Tip } from "@/data/picks";

export const dynamic = "force-dynamic";

export default async function TippsPage() {
  const tipsPromise = createClient().then((client) => client
    ? client.from("prediq_tips").select("id,league,match_id,home,away,selection,reasoning,risk,result,published_at,kickoff").eq("is_published", true).order("published_at", { ascending: false })
    : null);
  const [current, result] = await Promise.all([requireUser(), tipsPromise]);
  const tips: Tip[] = (result?.data ?? []).map((row) => ({
    id: row.id, league: row.league, matchId: row.match_id, home: row.home, away: row.away,
    selection: row.selection, reasoning: row.reasoning,
    risk: row.risk, result: row.result, publishedAt: row.published_at, kickoff: row.kickoff,
  } as Tip));
  const isOwner = current.profile?.is_owner === true;
  return <>
    <SiteHeader currentPath="/tipps" />
    <main className="page-wrap quick-page tips-page">
      <TipsExplorer tips={tips} isOwner={isOwner} />
    </main>
    <SiteFooter />
  </>;
}
