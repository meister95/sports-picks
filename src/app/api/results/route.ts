import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
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
  provider_fixture_id: number | null;
};
type ApiResponse<T> = { response?: T[]; errors?: Record<string, unknown> };
type RequestBudget = { used: number; limit: number };
type CheckStatus = "success" | "partial" | "failed";

async function saveCheckStatus(admin: SupabaseClient<any>, values: {
  status: CheckStatus; checked: number; settled: number; unavailable: number; deferred: number;
}) {
  await admin.from("result_check_status").upsert({
    id: "latest",
    checked_at: new Date().toISOString(),
    status: values.status,
    checked_count: values.checked,
    settled_count: values.settled,
    unavailable_count: values.unavailable,
    deferred_count: values.deferred,
  }, { onConflict: "id" });
}

function dateFromKickoff(value: string) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? null;
}

function seasonFor(date: string) {
  const [year, month] = date.split("-").map(Number);
  return month >= 7 ? year : year - 1;
}

function todayInVienna() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dayOffset(date: string, today: string) {
  return Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
}

async function fetchApiFootball<T>(path: string, apiKey: string, budget: RequestBudget): Promise<T[] | null> {
  if (budget.used >= budget.limit) return null;
  budget.used += 1;
  try {
    const response = await fetch(`https://v3.football.api-sports.io/${path}`, {
      headers: { "x-apisports-key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return null;
    const body = await response.json() as ApiResponse<T>;
    if (body.errors && Object.keys(body.errors).length > 0) return null;
    return body.response ?? null;
  } catch {
    return null;
  }
}

async function saveResult(admin: SupabaseClient<any>, tip: OpenTip, fixture: ApiFixture) {
  if (!matchesFixture(tip.home, tip.away, fixture)) return false;
  const result = evaluateTip(tip.selection, tip.home, tip.away, fixture);
  if (!result) return false;
  const { data, error } = await admin.from("prediq_tips").update({ result })
    .eq("id", tip.id).eq("is_published", true).eq("result", "offen").select("id").maybeSingle();
  return !error && Boolean(data);
}

async function runResultCheck() {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Die Ergebnisabfrage ist noch nicht vollständig eingerichtet." }, { status: 503 });
  }
  if (new URL(supabaseUrl).hostname !== "fggreivlzksnotonnrse.supabase.co") {
    return NextResponse.json({ error: "Die Datenbankverbindung ist nicht auf das PREDIQ-Projekt eingestellt." }, { status: 503 });
  }

  const admin = createSupabaseClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }) as SupabaseClient<any>;
  if (!apiKey) {
    await saveCheckStatus(admin, { status: "failed", checked: 0, settled: 0, unavailable: 0, deferred: 0 });
    return NextResponse.json({ error: "Der Anbieter für Ergebnisdaten ist gerade nicht eingerichtet.", status: "failed" }, { status: 503 });
  }
  const { data: openTips, error } = await admin.from("prediq_tips")
    .select("id,league,home,away,selection,kickoff,provider_fixture_id")
    .eq("is_published", true).eq("result", "offen").order("kickoff", { ascending: true }).limit(5000);
  if (error) {
    await saveCheckStatus(admin, { status: "failed", checked: 0, settled: 0, unavailable: 0, deferred: 0 });
    return NextResponse.json({ error: "Offene Tipps konnten nicht geladen werden.", status: "failed" }, { status: 500 });
  }

  const tips = (openTips ?? []) as OpenTip[];
  const budget: RequestBudget = { used: 0, limit: 90 };
  let checked = 0;
  let settled = 0;
  let unavailable = 0;
  let deferredTips = 0;

  // Reuse a provider fixture ID as the authoritative link on later daily checks.
  const knownIds = Array.from(new Set(tips.map((tip) => tip.provider_fixture_id).filter((id): id is number => id !== null)));
  for (let start = 0; start < knownIds.length; start += 20) {
    const ids = knownIds.slice(start, start + 20);
    const batchTips = tips.filter((tip) => tip.provider_fixture_id !== null && ids.includes(tip.provider_fixture_id));
    if (budget.used >= budget.limit) { deferredTips += batchTips.length; continue; }
    const fixtures = await fetchApiFootball<ApiFixture>(`fixtures?ids=${ids.join("-")}`, apiKey, budget);
    if (!fixtures) { unavailable += batchTips.length; continue; }
    const fixtureById = new Map(fixtures.map((fixture) => [fixture.fixture?.id, fixture]));
    for (const tip of batchTips) {
      const fixture = fixtureById.get(tip.provider_fixture_id!);
      if (!fixture || !matchesFixture(tip.home, tip.away, fixture)) { unavailable += 1; continue; }
      checked += 1;
      if (await saveResult(admin, tip, fixture)) settled += 1;
    }
  }

  const today = todayInVienna();
  const groups = new Map<string, OpenTip[]>();
  for (const tip of tips) {
    if (tip.provider_fixture_id !== null) continue;
    const date = dateFromKickoff(tip.kickoff);
    const leagueId = apiLeagueId(tip.league);
    if (!date || !leagueId) continue;
    const offset = dayOffset(date, today);
    // Link existing and upcoming picks, while limiting historical lookups.
    if (offset < -90 || offset > 30) continue;
    const key = `${tip.league}|${date}`;
    groups.set(key, [...(groups.get(key) ?? []), tip]);
  }

  const selectedGroups = Array.from(groups.entries())
    .sort((a, b) => Math.abs(dayOffset(a[0].split("|")[1], today)) - Math.abs(dayOffset(b[0].split("|")[1], today)))
    .slice(0, 45);

  for (const [key, groupTips] of selectedGroups) {
    if (budget.used >= budget.limit) { deferredTips += groupTips.length; continue; }
    const [league, date] = key.split("|");
    const leagueId = apiLeagueId(league);
    if (!leagueId) continue;
    const fixtures = await fetchApiFootball<ApiFixture>(`fixtures?league=${leagueId}&season=${seasonFor(date)}&date=${date}&timezone=Europe%2FVienna`, apiKey, budget);
    if (!fixtures) { unavailable += groupTips.length; continue; }

    const matched = groupTips.map((tip) => ({ tip, fixture: fixtures.find((item) => matchesFixture(tip.home, tip.away, item)) }))
      .filter((entry): entry is { tip: OpenTip; fixture: ApiFixture } => Boolean(entry.fixture));
    checked += matched.length;

    for (const { tip, fixture } of matched) {
      const providerFixtureId = fixture.fixture?.id;
      if (providerFixtureId == null) continue;
      const { error: linkError } = await admin.from("prediq_tips").update({ provider_fixture_id: providerFixtureId })
        .eq("id", tip.id).is("provider_fixture_id", null);
      if (!linkError) tip.provider_fixture_id = providerFixtureId;
    }

    const detailIds = Array.from(new Set(matched.filter(({ tip }) => needsFixtureDetails(tip.selection))
      .map(({ fixture }) => fixture.fixture?.id).filter((id): id is number => typeof id === "number")));
    const detailsById = new Map<number, ApiFixture>();
    for (let start = 0; start < detailIds.length; start += 20) {
      if (budget.used >= budget.limit) { deferredTips += matched.filter(({ tip }) => needsFixtureDetails(tip.selection)).length; break; }
      const details = await fetchApiFootball<ApiFixture>(`fixtures?ids=${detailIds.slice(start, start + 20).join("-")}`, apiKey, budget);
      if (!details) { unavailable += matched.filter(({ tip }) => needsFixtureDetails(tip.selection)).length; continue; }
      details.forEach((fixture) => { if (fixture.fixture?.id != null) detailsById.set(fixture.fixture.id, fixture); });
    }

    for (const { tip, fixture: basicFixture } of matched) {
      const fixture = needsFixtureDetails(tip.selection)
        ? detailsById.get(basicFixture.fixture?.id ?? -1)
        : basicFixture;
      if (!fixture) continue;
      if (await saveResult(admin, tip, fixture)) settled += 1;
    }
  }

  const deferredGroups = Math.max(0, groups.size - selectedGroups.length);
  const deferred = deferredTips + deferredGroups;
  const status: CheckStatus = unavailable > 0 && checked === 0 && deferred === 0
    ? "failed"
    : unavailable > 0 || deferred > 0 ? "partial" : "success";
  await saveCheckStatus(admin, { status, checked, settled, unavailable, deferred });
  return NextResponse.json({ checked, settled, unavailable, apiRequests: budget.used, deferredTips, deferredGroups, status });
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
