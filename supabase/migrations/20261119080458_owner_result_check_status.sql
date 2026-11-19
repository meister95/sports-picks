create table if not exists public.result_check_status (
  id text primary key check (id = 'latest'),
  checked_at timestamptz not null default now(),
  status text not null check (status in ('success', 'partial', 'failed')),
  checked_count integer not null default 0 check (checked_count >= 0),
  settled_count integer not null default 0 check (settled_count >= 0),
  unavailable_count integer not null default 0 check (unavailable_count >= 0),
  deferred_count integer not null default 0 check (deferred_count >= 0)
);

alter table public.result_check_status enable row level security;
revoke all on public.result_check_status from anon, authenticated;
grant select on public.result_check_status to authenticated;
grant all on public.result_check_status to service_role;

drop policy if exists "Only owner can read result check status" on public.result_check_status;
create policy "Only owner can read result check status"
on public.result_check_status for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_owner
  )
);
