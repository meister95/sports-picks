import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { apiLeagueId, evaluateTip, matchesFixture, needsFixtureDetails, type ApiFixture } from "@/lib/results/evaluator";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type OpenTip = {
  id: string;
  league: string;
  home: string;
  away: string;
  selection: string;
  kickoff: string;
};
type ApiResponse<T> = { response?: T[]; errors?: Record<string, unknown> };

function dateFromKickoff(value: string) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? null;
}

function seasonFor(date: string) {
  const [year, month] = date.split("-").map(Number);
  return month >= 7 ? year : year - 1;
}

async function fetchApiFootball<T>(path: string, apiKey: string): Promise<T[] | null> {
  const response = await fetch(`https://v3.football.api-sports.io/${path}`, {
    headers: { "x-apisports-key": apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return null;
  const body = await response.json() as ApiResponse<T>;
  if (body.errors && Object.keys(body.errors).length > 0) return null;
  return body.response ?? null;
}

async function runResultCheck() {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Die Ergebnisabfrage ist noch nicht vollständig eingerichtet." }, { status: 503 });
  }
  if (new URL(supabaseUrl).hostname !== "fggreivlzksnotonnrse.supabase.co") {
    return NextResponse.json({ error: "Die Datenbankverbindung ist nicht auf das PREDIQ-Projekt eingestellt." }, { status: 503 });
  }

  const admin = createSupabaseClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: openTips, error } = await admin.from("prediq_tips")
    .select("id,league,home,away,selection,kickoff")
    .eq("is_published", true).eq("result", "offen").order("kickoff", { ascending: true }).limit(5000);
  if (error) return NextResponse.json({ error: "Offene Tipps konnten nicht geladen werden." }, { status: 500 });

  const groups = new Map<string, OpenTip[]>();
  for (const raw of openTips ?? []) {
    const tip = raw as OpenTip;
    const date = dateFromKickoff(tip.kickoff);
    const leagueId = apiLeagueId(tip.league);
    if (!date || !leagueId) continue;
    const nowVienna = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const kickoffDay = Date.parse(`${date}T12:00:00Z`);
    const today = Date.parse(`${nowVienna}T12:00:00Z`);
    if (date > nowVienna || today - kickoffDay > 90 * 24 * 60 * 60 * 1000) continue;
    const key = `${tip.league}|${date}`;
    groups.set(key, [...(groups.get(key) ?? []), tip]);
  }

  // Stay within the API provider's free daily quota even if old picks piled up.
  const selectedGroups = Array.from(groups.entries()).sort((a, b) => a[0].split("|")[1].localeCompare(b[0].split("|")[1])).slice(0, 45);
  let checked = 0;
  let settled = 0;
  let unavailable = 0;
  for (const [key, tips] of selectedGroups) {
    const [league, date] = key.split("|");
    const leagueId = apiLeagueId(league);
    if (!leagueId) continue;
    const fixtures = await fetchApiFootball<ApiFixture>(`fixtures?league=${leagueId}&season=${seasonFor(date)}&date=${date}&timezone=Europe%2FVienna`, apiKey);
    if (!fixtures) { unavailable += tips.length; continue; }
    checked += tips.length;
    const matched = tips.map((tip) => ({ tip, fixture: fixtures.find((item) => matchesFixture(tip.home, tip.away, item)) })).filter((entry): entry is { tip: OpenTip; fixture: ApiFixture } => Boolean(entry.fixture));
    const detailIds = matched.filter(({ tip }) => needsFixtureDetails(tip.selection)).map(({ fixture }) => fixture.fixture?.id).filter((id): id is number => typeof id === "number");
    let detailed: ApiFixture[] = [];
    if (detailIds.length) {
      const details = await fetchApiFootball<ApiFixture>(`fixtures?ids=${Array.from(new Set(detailIds)).join("-")}`, apiKey);
      if (details) detailed = details;
    }

    for (const { tip, fixture: basicFixture } of matched) {
      let fixture = basicFixture;
      if (needsFixtureDetails(tip.selection)) {
        const detail = detailed.find((item) => item.fixture?.id === basicFixture.fixture?.id);
        if (!detail) continue;
        fixture = detail;
      }
      const result = evaluateTip(tip.selection, tip.home, tip.away, fixture);
      if (!result) continue;
      const update = await admin.from("prediq_tips").update({ result }).eq("id", tip.id).eq("is_published", true).eq("result", "offen");
      if (!update.error) settled += 1;
    }
  }
  return NextResponse.json({ checked, settled, unavailable, deferredGroups: Math.max(0, groups.size - selectedGroups.length) });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  return runResultCheck();
}

export async function POST() {
  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: "Bitte melde dich an." }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Bitte melde dich an." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_owner").eq("id", user.id).maybeSingle();
  if (profile?.is_owner !== true) return NextResponse.json({ error: "Nur der Eigentümer kann die Abfrage starten." }, { status: 403 });
  return runResultCheck();
}
