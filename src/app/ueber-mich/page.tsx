import Link from "next/link";
import { requireUser } from "@/lib/supabase/require-user";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default async function AboutPage() {
  await requireUser();
  return <>
    <SiteHeader currentPath="/ueber-mich" />
    <main className="page-wrap inner-page about-page">
      <div className="about-layout">
        <div className="about-copy">
          <div className="section-kicker"><span className="kicker-line" />ÜBER MICH</div>
          <h1 className="page-title">Sport im Herzen.<br /><span>Klar im Kopf.</span></h1>
          <p className="about-lead">Hi, ich bin der Kopf hinter Sports Picks.</p>
          <p className="page-intro about-description">Sport begleitet mich schon lange. Hier teile ich meine eigenen Einschätzungen zu ausgewählten Spielen – mit einer Begründung, die du nachvollziehen kannst. Keine geheimen Systeme, keine Garantie auf Gewinne. Nur meine persönliche Meinung zum Spiel.</p>
          <p className="page-intro about-description">Mir ist wichtig, auch danebenliegende Tipps offen zu zeigen. So kannst du dir selbst ein Bild machen und entscheiden, was du von meinen Analysen hältst.</p>
          <Link className="button button-primary about-button" href="/tipps">Meine Tipps entdecken <span>↗</span></Link>
        </div>
        <div className="about-art"><div className="about-ring ring-one" /><div className="about-ring ring-two" /><div className="about-monogram">SP</div><div className="about-art-caption"><span className="live-dot" />SPORTS PICKS <span>·</span> SEIT 2026</div></div>
      </div>
      <div className="values-grid">
        <div className="value-card"><span className="value-number">01</span><strong>Eigene Meinung</strong><p>Jeder Tipp kommt von mir und zeigt meine persönliche Einschätzung.</p></div>
        <div className="value-card"><span className="value-number">02</span><strong>Volle Transparenz</strong><p>Gewonnene und verlorene Tipps bleiben nachvollziehbar sichtbar.</p></div>
        <div className="value-card"><span className="value-number">03</span><strong>Mit Verantwortung</strong><p>Sportwetten sind Unterhaltung, kein verlässlicher Weg zu Geld.</p></div>
      </div>
    </main>
    <SiteFooter />
  </>;
}
