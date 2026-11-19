alter table public.prediq_tips
  add column if not exists provider_fixture_id bigint;

alter table public.prediq_tips
  drop constraint if exists prediq_tips_result_check;

alter table public.prediq_tips
  add constraint prediq_tips_result_check
  check (result in ('offen', 'gewonnen', 'verloren', 'annulliert'));

create index if not exists prediq_tips_provider_fixture
  on public.prediq_tips (provider_fixture_id)
  where provider_fixture_id is not null;
