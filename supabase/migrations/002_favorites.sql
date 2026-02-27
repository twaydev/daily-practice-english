create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  sentence_id uuid references sentences(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, sentence_id)
);

alter table favorites enable row level security;

create policy "Users manage own favorites" on favorites
  for all using (auth.uid() = user_id);

create index favorites_user_id_idx on favorites(user_id);
create index favorites_sentence_id_idx on favorites(sentence_id);
