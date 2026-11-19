import type { TipResult } from "@/data/picks";

type ApiTeam = { id?: number; name?: string };
type ApiEvent = { type?: string; detail?: string; team?: ApiTeam; player?: { name?: string } };
type ApiStatistic = { type?: string; value?: number | string | null };
type ApiPlayer = { player?: { name?: string }; statistics?: Array<{ shots?: { on?: number | null } }> };
export type ApiFixture = {
  fixture?: { id?: number; status?: { short?: string } };
  teams?: { home?: ApiTeam; away?: ApiTeam };
  goals?: { home?: number | null; away?: number | null };
  score?: { halftime?: { home?: number | null; away?: number | null } };
  events?: ApiEvent[];
  statistics?: Array<{ team?: ApiTeam; statistics?: ApiStatistic[] }>;
  players?: Array<{ players?: ApiPlayer[] }>;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

const aliases: Record<string, string> = {
  "afc bournemouth": "bournemouth", "manchester city": "man city", "man city": "man city",
  "manchester united": "man united", "man united": "man united", "tottenham hotspur": "tottenham",
  "brighton hove albion": "brighton", "nottingham forest": "nottingham forest", "newcastle united": "newcastle",
  "west ham united": "west ham", "wolverhampton wanderers": "wolves", "wolves": "wolves",
  "bayern munchen": "bayern munich", "fc bayern munchen": "bayern munich", "borussia monchengladbach": "monchengladbach",
  "rb leipzig": "leipzig", "1 fc koln": "koln", "fc koln": "koln", "1 fc heidenheim": "heidenheim",
  "athletic club": "athletic bilbao", "athletic bilbao": "athletic bilbao", "atletico de madrid": "atletico madrid",
  "deportivo alaves": "alaves", "real betis": "betis", "real sociedad": "real sociedad",
};

function teamKey(value: string) {
  const key = normalize(value);
  return aliases[key] ?? key;
}

export function matchesFixture(home: string, away: string, fixture: ApiFixture) {
  const apiHome = fixture.teams?.home?.name;
  const apiAway = fixture.teams?.away?.name;
  return Boolean(apiHome && apiAway && teamKey(apiHome) === teamKey(home) && teamKey(apiAway) === teamKey(away));
}

function splitTip(selection: string) {
  const known = [
    "Spieler: Schüsse aufs Tor", "Spieler erzielt ein Tor", "Spieler erhält eine gelbe Karte",
    "Spielausgang", "Doppelte Chance", "Unentschieden: Einsatz zurück", "Beide Teams treffen",
    "Gesamttore", "Team trifft", "Halbzeitergebnis", "Gesamtecken", "Gesamtkarten", "Eigene Auswahl",
  ];
  const prefix = known.find((label) => selection.startsWith(`${label}:`));
  return prefix ? { market: prefix, pick: selection.slice(prefix.length + 1).trim() } : { market: "", pick: selection };
}

function overUnder(pick: string) {
  const match = pick.match(/^(Über|Unter)\s+(\d+(?:[.,]\d+)?)$/i);
  if (!match) return null;
  return { over: match[1].toLowerCase() === "über", line: Number(match[2].replace(",", ".")) };
}

function exactPlayerName(pick: string, suffix: string) {
  const marker = ` ${suffix}`;
  return pick.toLowerCase().endsWith(marker.toLowerCase()) ? pick.slice(0, -marker.length).trim() : "";
}

function statValue(fixture: ApiFixture, teamId: number | undefined, type: string) {
  if (teamId == null) return null;
  const group = fixture.statistics?.find((entry) => entry.team?.id === teamId);
  const value = group?.statistics?.find((entry) => entry.type === type)?.value;
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value);
  return null;
}

export function evaluateTip(selection: string, home: string, away: string, fixture: ApiFixture): TipResult | null {
  const status = fixture.fixture?.status?.short;
  if (!status || !["FT", "AET", "PEN", "AWD", "WO"].includes(status)) return null;
  const homeName = fixture.teams?.home?.name;
  const awayName = fixture.teams?.away?.name;
  if (!homeName || !awayName || teamKey(homeName) !== teamKey(home) || teamKey(awayName) !== teamKey(away)) return null;
  const homeGoals = fixture.goals?.home;
  const awayGoals = fixture.goals?.away;
  if (typeof homeGoals !== "number" || typeof awayGoals !== "number") return null;
  const outcome = homeGoals > awayGoals ? "home" : homeGoals < awayGoals ? "away" : "draw";
  const { market, pick } = splitTip(selection);
  if (!market || market === "Eigene Auswahl" || market === "Gesamtkarten") return null;

  if (market === "Spielausgang") {
    const selected = teamKey(pick) === teamKey(home) ? "home" : teamKey(pick) === teamKey(away) ? "away" : normalize(pick) === "unentschieden" ? "draw" : null;
    return selected ? (selected === outcome ? "gewonnen" : "verloren") : null;
  }
  if (market === "Doppelte Chance") {
    const selectionCode = pick.match(/\((1X|12|X2)\)$/i)?.[1]?.toUpperCase();
    if (!selectionCode) return null;
    const won = selectionCode === "1X" ? outcome !== "away" : selectionCode === "12" ? outcome !== "draw" : outcome !== "home";
    return won ? "gewonnen" : "verloren";
  }
  if (market === "Unentschieden: Einsatz zurück") {
    const selected = teamKey(pick) === teamKey(home) ? "home" : teamKey(pick) === teamKey(away) ? "away" : null;
    return outcome === "draw" ? null : selected ? (selected === outcome ? "gewonnen" : "verloren") : null;
  }
  if (market === "Beide Teams treffen") {
    const scored = homeGoals > 0 && awayGoals > 0;
    if (pick === "Ja") return scored ? "gewonnen" : "verloren";
    if (pick === "Nein") return scored ? "verloren" : "gewonnen";
    return null;
  }
  if (market === "Gesamttore") {
    const line = overUnder(pick);
    if (!line) return null;
    const total = homeGoals + awayGoals;
    return (line.over ? total > line.line : total < line.line) ? "gewonnen" : "verloren";
  }
  if (market === "Team trifft") {
    const [teamName, answer] = pick.split(/:\s*/);
    const scored = teamKey(teamName) === teamKey(home) ? homeGoals > 0 : teamKey(teamName) === teamKey(away) ? awayGoals > 0 : null;
    if (scored == null || (answer !== "Ja" && answer !== "Nein")) return null;
    return (answer === "Ja" ? scored : !scored) ? "gewonnen" : "verloren";
  }
  if (market === "Halbzeitergebnis") {
    const htHome = fixture.score?.halftime?.home;
    const htAway = fixture.score?.halftime?.away;
    if (typeof htHome !== "number" || typeof htAway !== "number") return null;
    const htOutcome = htHome > htAway ? "home" : htHome < htAway ? "away" : "draw";
    const selected = teamKey(pick) === teamKey(home) ? "home" : teamKey(pick) === teamKey(away) ? "away" : normalize(pick) === "unentschieden" ? "draw" : null;
    return selected ? (selected === htOutcome ? "gewonnen" : "verloren") : null;
  }
  if (market === "Gesamtecken") {
    const line = overUnder(pick);
    const homeCorners = statValue(fixture, fixture.teams?.home?.id, "Corner Kicks");
    const awayCorners = statValue(fixture, fixture.teams?.away?.id, "Corner Kicks");
    if (!line || homeCorners == null || awayCorners == null) return null;
    const total = homeCorners + awayCorners;
    return (line.over ? total > line.line : total < line.line) ? "gewonnen" : "verloren";
  }
  if (market === "Spieler erzielt ein Tor") {
    const playerName = exactPlayerName(pick, "erzielt ein Tor");
    if (!playerName || !fixture.events) return null;
    const found = fixture.events.some((event) => event.type === "Goal" && event.detail !== "Own Goal" && normalize(event.player?.name ?? "") === normalize(playerName));
    return found ? "gewonnen" : "verloren";
  }
  if (market === "Spieler erhält eine gelbe Karte") {
    const playerName = exactPlayerName(pick, "erhält eine gelbe Karte");
    if (!playerName || !fixture.events) return null;
    const found = fixture.events.some((event) => event.type === "Card" && event.detail === "Yellow Card" && normalize(event.player?.name ?? "") === normalize(playerName));
    return found ? "gewonnen" : "verloren";
  }
  if (market === "Spieler: Schüsse aufs Tor") {
    const separator = pick.lastIndexOf(" · ");
    if (separator < 0) return null;
    const playerName = pick.slice(0, separator).trim();
    const line = pick.slice(separator + 3).match(/^(\d+)\+\s+Schuss/);
    const target = Number(line?.[1]);
    if (!playerName || !Number.isFinite(target) || !fixture.players) return null;
    for (const group of fixture.players) {
      const player = group.players?.find((entry) => normalize(entry.player?.name ?? "") === normalize(playerName));
      const shots = player?.statistics?.[0]?.shots?.on;
      if (typeof shots === "number") return shots >= target ? "gewonnen" : "verloren";
    }
    return null;
  }
  return null;
}

export function needsFixtureDetails(selection: string) {
  const { market } = splitTip(selection);
  return ["Spieler erzielt ein Tor", "Spieler erhält eine gelbe Karte", "Spieler: Schüsse aufs Tor", "Gesamtecken"].includes(market);
}

export function apiLeagueId(league: string) {
  const ids: Record<string, number> = { "Premier League": 39, Bundesliga: 78, "La Liga": 140, "Champions League": 2, "Europa League": 3 };
  return ids[league] ?? null;
}
