export type TipRisk = "sicher" | "moderat" | "riskant";
export type TipResult = "offen" | "gewonnen" | "verloren";

export type Tip = {
  id: string;
  league: string;
  matchId: string;
  home: string;
  away: string;
  selection: string;
  reasoning: string;
  odds?: number;
  risk: TipRisk;
  result: TipResult;
  publishedAt: string;
  kickoff: string;
};

export type BetSlipLeg = {
  id: string;
  match: string;
  selection: string;
  odds: number;
};

export type BetSlip = {
  id: string;
  title: string;
  publishedAt: string;
  legs: BetSlipLeg[];
  result: TipResult;
};

// Die Reihenfolge kann angepasst werden, ohne die Filter- oder Anzeige-Logik zu ändern.
export const leagueOrder = ["Premier League", "Bundesliga", "La Liga", "Champions League", "Europa League"] as const;
export const leagueLogos: Record<(typeof leagueOrder)[number], string> = {
  "Premier League": "/logos/leagues/premier-league-centered.png",
  Bundesliga: "/logos/leagues/bundesliga-trim.png",
  "La Liga": "/logos/leagues/la-liga.svg",
  "Champions League": "/logos/leagues/champions-league.svg",
  "Europa League": "/logos/leagues/europa-league-full.png",
};
export const tips: Tip[] = [];
export const betSlips: BetSlip[] = [];

export type Fixture = {
  id: string;
  home: string;
  away: string;
  kickoff: string;
};

export function summarizeTips(entries: readonly Tip[]) {
  const won = entries.filter((tip) => tip.result === "gewonnen").length;
  const lost = entries.filter((tip) => tip.result === "verloren").length;
  const settled = won + lost;
  return {
    won,
    lost,
    published: entries.length,
    hitRate: settled ? Math.round((won / settled) * 100) : 0,
  };
}

export const tipStats = summarizeTips(tips);
