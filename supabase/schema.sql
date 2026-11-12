-- PREDIQ friend access: run once in Supabase SQL Editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 2 and 24),
  is_owner boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tip_reactions (
  id uuid primary key default gen_random_uuid(),
  tip_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique (tip_id, user_id)
);

create table if not exists public.tip_comments (
  id uuid primary key default gen_random_uuid(),
  tip_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- Öffentlich sichtbare Tipps. Auswahlstatus der Spiele bleibt privat im Browser des Eigentümers.
create table if not exists public.prediq_tips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  league text not null,
  match_id text not null,
  home text not null,
  away text not null,
  selection text not null check (char_length(btrim(selection)) between 1 and 100),
  reasoning text not null check (char_length(btrim(reasoning)) between 1 and 1000),
  odds numeric(8, 2) check (odds is null or odds > 1),
  risk text not null check (risk in ('sicher', 'moderat', 'riskant')),
  result text not null default 'offen' check (result in ('offen', 'gewonnen', 'verloren')),
  kickoff text not null,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists prediq_tips_public_order on public.prediq_tips (published_at desc) where is_published;

alter table public.profiles enable row level security;
alter table public.tip_reactions enable row level security;
alter table public.tip_comments enable row level security;
alter table public.prediq_tips enable row level security;

-- Remove any broad default grants before applying the least-privilege grants below.
revoke all on public.profiles, public.tip_reactions, public.tip_comments, public.prediq_tips from anon, authenticated;
revoke select (id, username, is_owner, created_at) on public.profiles from anon;
revoke select (id, tip_id, user_id, reaction, created_at) on public.tip_reactions from anon;
revoke select (id, tip_id, user_id, body, created_at) on public.tip_comments from anon;
revoke select (id, owner_id, league, match_id, home, away, selection, reasoning, odds, risk, result, kickoff, is_published, published_at, created_at) on public.prediq_tips from anon;

grant select on public.profiles, public.tip_reactions, public.tip_comments to authenticated;
grant select on public.prediq_tips to authenticated;
grant insert (owner_id, league, match_id, home, away, selection, reasoning, odds, risk, result, kickoff, is_published, published_at) on public.prediq_tips to authenticated;
grant update (league, match_id, home, away, selection, reasoning, odds, risk, result, kickoff, is_published) on public.prediq_tips to authenticated;
grant delete on public.prediq_tips to authenticated;
grant insert (id, username) on public.profiles to authenticated;
grant update (username) on public.profiles to authenticated;
grant insert (tip_id, user_id, reaction) on public.tip_reactions to authenticated;
grant update (reaction) on public.tip_reactions to authenticated;
grant delete on public.tip_reactions to authenticated;
grant insert (tip_id, user_id, body) on public.tip_comments to authenticated;
grant update (body) on public.tip_comments to authenticated;
grant delete on public.tip_comments to authenticated;

drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public" on public.profiles for select to authenticated using (true);
drop policy if exists "Users create their own profile" on public.profiles;
create policy "Users create their own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Users update their username" on public.profiles;
create policy "Users update their username" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Reactions are public" on public.tip_reactions;
create policy "Reactions are public" on public.tip_reactions for select to authenticated using (true);
drop policy if exists "Users react as themselves" on public.tip_reactions;
create policy "Users react as themselves" on public.tip_reactions for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update their own reaction" on public.tip_reactions;
create policy "Users update their own reaction" on public.tip_reactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users remove their own reaction" on public.tip_reactions;
create policy "Users remove their own reaction" on public.tip_reactions for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Comments are public" on public.tip_comments;
create policy "Comments are public" on public.tip_comments for select to authenticated using (true);
drop policy if exists "Users comment as themselves" on public.tip_comments;
create policy "Users comment as themselves" on public.tip_comments for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users edit their own comments" on public.tip_comments;
create policy "Users edit their own comments" on public.tip_comments for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users or owner delete comments" on public.tip_comments;
create policy "Users or owner delete comments" on public.tip_comments for delete to authenticated using (
  (select auth.uid()) = user_id
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_owner)
);

drop policy if exists "Published tips are public; owner can see drafts" on public.prediq_tips;
create policy "Published tips require login; owner can see drafts" on public.prediq_tips for select to authenticated using (
  is_published or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_owner)
);
drop policy if exists "Only owner can publish tips" on public.prediq_tips;
create policy "Only owner can publish tips" on public.prediq_tips for insert to authenticated with check (
  owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_owner)
);
drop policy if exists "Only owner can update tips" on public.prediq_tips;
create policy "Only owner can update tips" on public.prediq_tips for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_owner)
) with check (
  owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_owner)
);
drop policy if exists "Only owner can delete tips" on public.prediq_tips;
create policy "Only owner can delete tips" on public.prediq_tips for delete to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_owner)
);

-- Optional: after creating your own account and profile, grant moderation rights:
-- update public.profiles set is_owner = true where username = 'YOUR_USERNAME';
