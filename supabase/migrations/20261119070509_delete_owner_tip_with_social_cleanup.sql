create or replace function public.delete_owner_tip(p_tip_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles as p
    where p.id = auth.uid() and p.is_owner
  ) then
    raise exception 'Only the PREDIQ owner can delete picks' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.prediq_tips as t
    where t.id = p_tip_id and t.owner_id = auth.uid()
  ) then
    raise exception 'Pick not found' using errcode = 'P0002';
  end if;

  delete from public.tip_reactions where tip_id = p_tip_id::text;
  delete from public.tip_comments where tip_id = p_tip_id::text;
  delete from public.prediq_tips where id = p_tip_id and owner_id = auth.uid();
end;
$function$;

revoke all on function public.delete_owner_tip(uuid) from public, anon, authenticated;
grant execute on function public.delete_owner_tip(uuid) to authenticated;
