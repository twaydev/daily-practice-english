create table practice_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  sentence_text text not null,
  phonetic_data jsonb,
  created_at timestamptz default now()
);

alter table practice_history enable row level security;

create policy "Users manage own history" on practice_history
  for all using (auth.uid() = user_id);

create index practice_history_user_id_idx on practice_history(user_id);
create index practice_history_created_at_idx on practice_history(created_at desc);
