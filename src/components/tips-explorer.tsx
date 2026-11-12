"use client";

import { useEffect, useState, type FormEvent } from "react";
import { fixtureSchedules } from "@/data/fixtures";
import { leagueLogos, leagueOrder, type Fixture, type Tip, type TipRisk, type TipResult } from "@/data/picks";
import { TipSocial } from "@/components/tip-social";
import { publishTip } from "@/app/tipps/actions";
import Image from "next/image";

type FixtureChoice = "follow" | "skip";
const riskLabels: Record<TipRisk, string> = { sicher: "Sicher", moderat: "Moderat", riskant: "Riskant" };
const resultLabels: Record<TipResult, string> = { offen: "Offen", gewonnen: "Gewonnen", verloren: "Verloren" };

function TipCard({ tip }: { tip: Tip }) {
  return <article className={`prediction ${tip.result === "offen" ? `risk-${tip.risk}` : `result-${tip.result}`}`}>
    <div className="prediction-heading">
      <span className="prediction-match">{tip.home} <span>vs</span> {tip.away}</span>
      <span className={`prediction-result result-label-${tip.result}`}>{resultLabels[tip.result]}</span>
    </div>
    <div className="prediction-selection">{tip.selection}</div>
    <p className="prediction-reason">{tip.reasoning}</p>
    <div className="prediction-meta">
      <span className={`risk-label risk-label-${tip.risk}`}>{riskLabels[tip.risk]} eingeschätzt</span>
      {tip.odds && <span>Quote {tip.odds.toFixed(2)}</span>}
      <span>{tip.kickoff}</span>
    </div>
    <TipSocial tipId={tip.id}/>
  </article>;
}

export function TipsExplorer({ tips, isOwner }: { tips: Tip[]; isOwner: boolean }) {
  const [selectedLeague, setSelectedLeague] = useState<string>("Alle Ligen");
  const [selectedMatchday, setSelectedMatchday] = useState<string>("Alle Spieltage");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [fixtureChoices, setFixtureChoices] = useState<Record<string, FixtureChoice>>({});
  const [activeFixture, setActiveFixture] = useState<string | null>(null);
  const [showSkipped, setShowSkipped] = useState<Record<string, boolean>>({});
  const matchdayOptions = leagueOrder.map((league) => ({ value: `${league}::${fixtureSchedules[league].label}`, league, label: fixtureSchedules[league].label }));
  const visibleLeagues = leagueOrder.filter((league) =>
    (selectedLeague === "Alle Ligen" || selectedLeague === league)
    && (selectedMatchday === "Alle Spieltage" || selectedMatchday.startsWith(`${league}::`)));
  const shownLeagues = isOwner ? visibleLeagues : leagueOrder.filter((league) => selectedLeague === "Alle Ligen" || selectedLeague === league);

  function officialMatchday(league: string, matchId: string) {
    const schedule = fixtureSchedules[league];
    return schedule?.dates.some((date) => date.fixtures.some((fixture) => fixture.id === matchId)) ? schedule.label : null;
  }

  useEffect(() => {
    if (!isOwner) return;
    let restoreTimer: number | undefined;
    try {
      const stored = window.localStorage.getItem("prediq-fixture-choices");
      const parsed: unknown = stored ? JSON.parse(stored) : null;
      if (parsed && typeof parsed === "object") {
        const choices = Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, FixtureChoice] => entry[1] === "follow" || entry[1] === "skip"));
        restoreTimer = window.setTimeout(() => setFixtureChoices(choices), 0);
      }
    } catch {
      // Die Auswahl bleibt optional und wird bei blockiertem Speicher ignoriert.
    }
    return () => window.clearTimeout(restoreTimer);
  }, [isOwner]);

  function setChoice(fixtureId: string, choice: FixtureChoice) {
    if (!isOwner) return;
    setFixtureChoices((current) => {
      const next = { ...current, [fixtureId]: choice };
      try {
        window.localStorage.setItem("prediq-fixture-choices", JSON.stringify(next));
      } catch {
        // Die Auswahl bleibt bis zum Neuladen zumindest im React-Zustand erhalten.
      }
      return next;
    });
    if (choice === "follow") setActiveFixture(fixtureId);
    else if (activeFixture === fixtureId) setActiveFixture(null);
  }

  function clearChoice(fixtureId: string) {
    if (!isOwner) return;
    setFixtureChoices((current) => {
      const next = Object.fromEntries(Object.entries(current).filter(([id]) => id !== fixtureId)) as Record<string, FixtureChoice>;
      try {
        window.localStorage.setItem("prediq-fixture-choices", JSON.stringify(next));
      } catch {
        // Das Zurücksetzen bleibt bis zum Neuladen zumindest im React-Zustand erhalten.
      }
      return next;
    });
    setActiveFixture(null);
  }

  async function saveTip(fixture: Fixture, league: string, date: string, formData: FormData) {
    if (!isOwner) return;
    const selection = String(formData.get("selection") ?? "").trim();
    const reasoning = String(formData.get("reasoning") ?? "").trim();
    const oddsValue = String(formData.get("odds") ?? "").trim();
    const odds = oddsValue ? Number(oddsValue) : undefined;
    const riskValue = String(formData.get("risk") ?? "moderat");
    if (!selection || !reasoning || (oddsValue && (!Number.isFinite(odds) || odds! <= 1))) return;

    const tip = await publishTip({
      league,
      matchId: fixture.id,
      home: fixture.home,
      away: fixture.away,
      selection,
      reasoning,
      risk: riskValue === "sicher" || riskValue === "riskant" ? riskValue : "moderat",
      kickoff: `${date} · ${fixture.kickoff}`,
      ...(odds ? { odds } : {}),
    });
    if (tip) setActiveFixture(null);
  }

  function toggleLeague(league: string) {
    setExpanded((current) => current.includes(league) ? current.filter((item) => item !== league) : [...current, league]);
  }

  return <div className="tips-explorer">
    <div className="league-filter" role="group" aria-label="Tipps nach Liga filtern">
      {["Alle Ligen", ...leagueOrder].map((league) => <button key={league} type="button" className={selectedLeague === league ? "league-filter-button selected" : "league-filter-button"} aria-pressed={selectedLeague === league} onClick={() => { setSelectedLeague(league); setSelectedMatchday("Alle Spieltage"); }}>{league}{league !== "Alle Ligen" && <span className={`league-filter-logo league-logo-${league.toLowerCase().replaceAll(" ", "-")}`} aria-hidden="true"><Image className="league-logo-image" src={leagueLogos[league as (typeof leagueOrder)[number]]} alt="" width={48} height={48} unoptimized /></span>}</button>)}
    </div>
    {isOwner && <label className="owner-matchday-filter">Spieltag
      <select value={selectedMatchday} onChange={(event) => setSelectedMatchday(event.target.value)}>
        <option value="Alle Spieltage">Alle Spieltage</option>
        {matchdayOptions.filter((option) => selectedLeague === "Alle Ligen" || option.league === selectedLeague).map((option) => <option key={option.value} value={option.value}>{option.league} · {option.label}</option>)}
      </select>
    </label>}
    <div className="league-sections">
      {shownLeagues.map((league) => {
        const leagueTips = tips.filter((tip) => tip.league === league);
        if (!isOwner) {
          const groups = new Map<string, Map<string, Tip[]>>();
          leagueTips.forEach((tip) => {
            const matchday = officialMatchday(league, tip.matchId);
            if (!matchday) return;
            const matches = groups.get(matchday) ?? new Map<string, Tip[]>();
            matches.set(tip.matchId, [...(matches.get(tip.matchId) ?? []), tip]);
            groups.set(matchday, matches);
          });
          const publishedCount = Array.from(groups.values()).reduce((count, matches) => count + Array.from(matches.values()).reduce((sum, matchTips) => sum + matchTips.length, 0), 0);
          return <section className="league-section" key={league}>
            <h2 className="league-heading"><span className="league-toggle"><span className="league-title-group"><span className={`league-heading-logo league-logo-${league.toLowerCase().replaceAll(" ", "-")}`} aria-hidden="true"><Image className="league-logo-image" src={leagueLogos[league]} alt="" width={64} height={64} unoptimized /></span><span className="league-heading-copy"><span className="league-name">{league}</span><span className="league-count">{publishedCount} {publishedCount === 1 ? "Tipp" : "Tipps"}</span></span></span></span></h2>
            <div className="league-content">
              {groups.size === 0 ? <p className="public-empty-state">Noch keine Tipps veröffentlicht.</p> : Array.from(groups, ([matchday, matches]) => <section className="public-matchday" key={matchday}>
                <h3 className="fixture-date-heading">{matchday}</h3>
                <div className="fixture-list">{Array.from(matches, ([matchId, matchTips]) => <article className="fixture-row" key={matchId}>{matchTips.map((tip) => <TipCard key={tip.id} tip={tip}/>)}</article>)}</div>
              </section>)}
            </div>
          </section>;
        }
        const schedule = fixtureSchedules[league];
        const fixtureCount = schedule.dates.reduce((count, date) => count + date.fixtures.length, 0);
        const skippedCount = schedule.dates.reduce((count, date) => count + date.fixtures.filter((fixture) => fixtureChoices[fixture.id] === "skip").length, 0);
        const open = expanded.includes(league) || selectedMatchday === `${league}::${schedule.label}`;
        const panelId = `league-${league.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        return <section className={`league-section ${open ? "expanded" : ""}`} key={league}>
          <h2 className="league-heading">
            <button type="button" className="league-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => toggleLeague(league)}>
              <span className="league-title-group"><span className={`league-heading-logo league-logo-${league.toLowerCase().replaceAll(" ", "-")}`} aria-hidden="true"><Image className="league-logo-image" src={leagueLogos[league]} alt="" width={64} height={64} unoptimized /></span><span className="league-heading-copy"><span className="league-name">{league}</span><span className="league-count"><span>{fixtureCount} Spiele</span><span aria-hidden="true">·</span><span>{schedule.label}</span></span></span></span>
              <svg className="league-chevron" aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="m3.5 6 4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </h2>
          {open && <div className="league-content" id={panelId}>
            <div className="fixture-matchday">
              <p className="fixture-intro">Wähle die Spiele aus, die du einschätzen kannst. Mit „Verfolge ich“ öffnet sich direkt die Tipp-Eingabe. Zeiten in CET.</p>
              {skippedCount > 0 && <button className="show-skipped-button" type="button" aria-expanded={Boolean(showSkipped[league])} onClick={() => setShowSkipped((current) => ({ ...current, [league]: !current[league] }))}>
                {showSkipped[league] ? "Übersprungene Spiele ausblenden" : `${skippedCount} übersprungene ${skippedCount === 1 ? "Partie anzeigen" : "Partien anzeigen"}`}
              </button>}
              {schedule.dates.map((date) => {
                const fixtures = date.fixtures.filter((fixture) => showSkipped[league] || fixtureChoices[fixture.id] !== "skip");
                if (!fixtures.length) return null;
                return <section className="fixture-date-group" key={date.date}>
                  <h3 className="fixture-date-heading">{date.label}</h3>
                  <div className="fixture-list">{fixtures.map((fixture) => {
                    const choice = fixtureChoices[fixture.id];
                    const fixtureTips = leagueTips.filter((tip) => tip.matchId === fixture.id);
                    return <FixtureRow key={fixture.id} fixture={fixture} date={date.date} league={league} choice={choice} tips={fixtureTips} formOpen={activeFixture === fixture.id} onChoose={setChoice} onClear={() => clearChoice(fixture.id)} onAddTip={() => setActiveFixture(fixture.id)} onCancel={() => setActiveFixture(null)} onSave={(formData) => saveTip(fixture, league, date.date, formData)} />;
                  })}</div>
                </section>;
              })}
            </div>
          </div>}
        </section>;
      })}
    </div>
  </div>;
}

function FixtureRow({ fixture, date, league, choice, tips, formOpen, onChoose, onClear, onAddTip, onCancel, onSave }: {
  fixture: Fixture;
  date: string;
  league: string;
  choice?: FixtureChoice;
  tips: Tip[];
  formOpen: boolean;
  onChoose: (fixtureId: string, choice: FixtureChoice) => void;
  onClear: () => void;
  onAddTip: () => void;
  onCancel: () => void;
  onSave: (formData: FormData) => Promise<void>;
}) {
  return <article className={`fixture-row ${choice ? `fixture-${choice}` : ""}`}>
    <div className="fixture-info">
      <span className="fixture-teams">{fixture.home}<span>vs</span>{fixture.away}</span>
      <time className="fixture-time">{fixture.kickoff}</time>
    </div>
    <div className="fixture-actions" role="group" aria-label={`${fixture.home} gegen ${fixture.away}`}>
      <button type="button" aria-pressed={choice === "follow"} className={choice === "follow" ? "fixture-choice is-selected" : "fixture-choice"} onClick={() => onChoose(fixture.id, "follow")}>Verfolge ich</button>
      <button type="button" aria-pressed={choice === "skip"} className={choice === "skip" ? "fixture-choice is-selected" : "fixture-choice"} onClick={() => onChoose(fixture.id, "skip")}>Überspringen</button>
    </div>
    {choice && <button className="clear-fixture-choice" type="button" onClick={onClear}>Auswahl zurücksetzen</button>}
    {tips.length > 0 && <div className="fixture-tips">
      <p className="fixture-tip-count">{tips.length} {tips.length === 1 ? "Tipp" : "Tipps"} von dir</p>
      {tips.map((tip) => <TipCard key={tip.id} tip={tip}/>)}
      <button className="add-tip-button" type="button" onClick={onAddTip}>+ Weitere Auswahl hinzufügen</button>
    </div>}
    {formOpen && <TipEntryForm fixture={fixture} onSave={onSave} onCancel={onCancel} />}
    {!formOpen && tips.length === 0 && choice === "follow" && <button className="add-tip-button" type="button" onClick={onAddTip}>Tipp zu diesem Spiel schreiben</button>}
    <span className="sr-only">{league}, {date}</span>
  </article>;
}

function TipEntryForm({ fixture, onSave, onCancel }: { fixture: Fixture; onSave: (formData: FormData) => Promise<void>; onCancel: () => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const oddsValue = String(formData.get("odds") ?? "").trim();
    if (oddsValue && (!Number.isFinite(Number(oddsValue)) || Number(oddsValue) <= 1)) return;
    await onSave(formData);
    form.reset();
  }

  return <form className="tip-entry-form" onSubmit={submit}>
    <h4>Tipp für {fixture.home} – {fixture.away}</h4>
    <label>Deine Auswahl<input name="selection" required maxLength={100} placeholder="z. B. Beide Teams treffen" /></label>
    <label>Deine Begründung<textarea name="reasoning" required maxLength={1000} rows={3} placeholder="Warum erwartest du dieses Ergebnis?" /></label>
    <div className="tip-entry-row">
      <label>Quote <span>(optional)</span><input name="odds" type="number" min="1.01" step="0.01" inputMode="decimal" placeholder="1,85" /></label>
      <label>Risiko<select name="risk" defaultValue="moderat"><option value="sicher">Sicher</option><option value="moderat">Moderat</option><option value="riskant">Riskant</option></select></label>
    </div>
    <div className="tip-entry-actions"><button className="tip-save-button" type="submit">Tipp speichern</button><button className="tip-cancel-button" type="button" onClick={onCancel}>Abbrechen</button></div>
    <p className="tip-storage-note">Nach dem Speichern ist dein Tipp für alle Besucher sichtbar.</p>
  </form>;
}
