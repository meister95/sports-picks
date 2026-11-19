import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ResultsRefreshButton } from "@/components/results-refresh-button";
import { leagueOrder, summarizeTips, type TipResult } from "@/data/picks";

export const dynamic = "force-dynamic";

const resultLabels: Record<TipResult, string> = { offen: "Offen", gewonnen: "Gewonnen", verloren: "Verloren", annulliert: "Annulliert" };

export default async function StatistikPage() {
  const current = await requireUser();
  const supabase = await createClient();
  const isOwner = current.profile?.is_owner === true;
  const [{ data }, { data: checkStatus }] = await Promise.all([
    supabase
      ? supabase.from("prediq_tips").select("id,league,home,away,selection,result,kickoff,published_at").eq("is_published", true).order("published_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    isOwner && supabase
      ? supabase.from("result_check_status").select("checked_at,status,checked_count,settled_count,unavailable_count,deferred_count").eq("id", "latest").maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const tips = data ?? [];
  const stats = summarizeTips(tips);
  const open = tips.filter((tip) => tip.result === "offen").length;
  const leagueStats = leagueOrder.map((league) => {
    const entries = tips.filter((tip) => tip.league === league);
    return { league, count: entries.length, ...summarizeTips(entries) };
  }).filter((entry) => entry.count > 0);
  const recentTips = tips.slice(0, 6);
  const total = stats.published || 1;

  const tiles = [
    { label: "Trefferquote", value: stats.settled ? stats.hitRate : "–", suffix: stats.settled ? "%" : "", detail: stats.settled ? `${stats.won} von ${stats.settled} entschiedenen Tipps` : "Noch keine entschiedenen Tipps", tone: "rate" },
    { label: "Gewonnen", value: stats.won, tone: "won" },
    { label: "Verloren", value: stats.lost, tone: "lost" },
    { label: "Veröffentlicht", value: stats.published, tone: "published" },
  ];

  return <>
    <SiteHeader currentPath="/statistik" />
    <main className="page-wrap quick-page stats-page">
      {isOwner && <ResultsRefreshButton checkStatus={checkStatus ?? null} />}
      <section className="stats-grid-compact" aria-label="Statistik meiner Tipps">
        {tiles.map((stat) => <article className={`stat-tile stat-${stat.tone}`} key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}{stat.suffix && <small>{stat.suffix}</small>}</strong>
          {stat.detail && <small className="stat-detail">{stat.detail}</small>}
        </article>)}
      </section>

      <section className="stats-panel stats-outcomes" aria-labelledby="stats-outcomes-title">
        <div className="stats-panel-heading"><h1 id="stats-outcomes-title">Ergebnisse</h1><span>{open} offen</span></div>
        <div className="stats-outcome-bar" role="img" aria-label={`${stats.won} gewonnen, ${stats.lost} verloren, ${open} offen, ${stats.annulled} annulliert`}>
          <span className="stats-bar-won" style={{ width: `${stats.won / total * 100}%` }} />
          <span className="stats-bar-lost" style={{ width: `${stats.lost / total * 100}%` }} />
          <span className="stats-bar-open" style={{ width: `${open / total * 100}%` }} />
          <span className="stats-bar-annulled" style={{ width: `${stats.annulled / total * 100}%` }} />
        </div>
        <div className="stats-outcome-legend"><span><i className="legend-won"/>Gewonnen <strong>{stats.won}</strong></span><span><i className="legend-lost"/>Verloren <strong>{stats.lost}</strong></span><span><i className="legend-open"/>Offen <strong>{open}</strong></span><span><i className="legend-annulled"/>Annulliert <strong>{stats.annulled}</strong></span></div>
      </section>

      <div className="stats-detail-grid">
        <section className="stats-panel" aria-labelledby="stats-league-title">
          <div className="stats-panel-heading"><h2 id="stats-league-title">Nach Liga</h2></div>
          {leagueStats.length ? <ul className="stats-league-list">{leagueStats.map((item) => <li key={item.league}>
            <div className="stats-league-line"><strong>{item.league}</strong><span>{item.settled ? `${item.hitRate}% · ${item.won}/${item.settled}` : "Noch keine Entscheidungen"}</span></div>
            <div className="stats-league-track" role="img" aria-label={`${item.league}: ${item.won} gewonnen, ${item.lost} verloren, ${item.published - item.won - item.lost - item.annulled} offen, ${item.annulled} annulliert`}>
              <span className="stats-bar-won" style={{ width: `${item.won / item.count * 100}%` }} />
              <span className="stats-bar-lost" style={{ width: `${item.lost / item.count * 100}%` }} />
              <span className="stats-bar-open" style={{ width: `${(item.published - item.won - item.lost - item.annulled) / item.count * 100}%` }} />
              <span className="stats-bar-annulled" style={{ width: `${item.annulled / item.count * 100}%` }} />
            </div>
          </li>)}</ul> : <p className="stats-empty">Sobald Tipps veröffentlicht sind, erscheint hier die Auswertung nach Liga.</p>}
        </section>

        <section className="stats-panel" aria-labelledby="stats-recent-title">
          <div className="stats-panel-heading"><h2 id="stats-recent-title">Letzte Tipps</h2></div>
          {recentTips.length ? <ul className="stats-recent-list">{recentTips.map((tip) => <li key={tip.id}>
            <div><strong>{tip.home} <span>vs</span> {tip.away}</strong><small>{tip.league} · {tip.kickoff.split(" · ")[0]}</small></div>
            <span className={`stats-result stats-result-${tip.result}`}>{resultLabels[tip.result as TipResult]}</span>
          </li>)}</ul> : <p className="stats-empty">Noch keine Tipps veröffentlicht.</p>}
        </section>
      </div>
    </main>
    <SiteFooter />
  </>;
}
