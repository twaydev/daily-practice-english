-- Add audio_url column to practice_history
alter table practice_history
  add column if not exists audio_url text;

-- Create private recordings bucket
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

-- RLS: authenticated users can upload to their own folder
create policy "Users can upload own recordings"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'recordings' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: authenticated users can read their own recordings
create policy "Users can read own recordings"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'recordings' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: authenticated users can delete their own recordings
create policy "Users can delete own recordings"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'recordings' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
