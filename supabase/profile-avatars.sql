-- Run this once in the Supabase SQL Editor for an existing PREDIQ project.
alter table public.profiles add column if not exists avatar_path text;
grant insert (id, username, avatar_path) on public.profiles to authenticated;
grant update (username, avatar_path) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prediq-avatars', 'prediq-avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users read their own PREDIQ avatar object" on storage.objects;
drop policy if exists "Authenticated users read PREDIQ avatars" on storage.objects;
create policy "Authenticated users read PREDIQ avatars"
on storage.objects for select to authenticated
using (bucket_id = 'prediq-avatars');

drop policy if exists "Users upload their own PREDIQ avatar" on storage.objects;
create policy "Users upload their own PREDIQ avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'prediq-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users update their own PREDIQ avatar" on storage.objects;
create policy "Users update their own PREDIQ avatar"
on storage.objects for update to authenticated
using (bucket_id = 'prediq-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'prediq-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users delete their own PREDIQ avatar" on storage.objects;
create policy "Users delete their own PREDIQ avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'prediq-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
