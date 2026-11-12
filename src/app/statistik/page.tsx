import { requireUser } from "@/lib/supabase/require-user";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { tipStats } from "@/data/picks";

const stats = [
  { label: "Trefferquote", value: tipStats.hitRate, suffix: "%", tone: "rate" },
  { label: "Gewonnen", value: tipStats.won, tone: "won" },
  { label: "Verloren", value: tipStats.lost, tone: "lost" },
  { label: "Veröffentlicht", value: tipStats.published, tone: "published" },
];

export default async function StatistikPage() {
  await requireUser();
  return <>
    <SiteHeader currentPath="/statistik" />
    <main className="page-wrap quick-page stats-page">
      <section className="stats-grid-compact" aria-label="Statistik meiner Tipps">
        {stats.map((stat) => <article className={`stat-tile stat-${stat.tone}`} key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}{stat.suffix && <small>{stat.suffix}</small>}</strong>
        </article>)}
      </section>
    </main>
    <SiteFooter />
  </>;
}
