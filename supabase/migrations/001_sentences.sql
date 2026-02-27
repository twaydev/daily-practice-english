create table sentences (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  category text not null default 'general',
  content_type text not null default 'sentence' check (content_type in ('sentence', 'phrasal')),
  is_seeded boolean default false,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table sentences enable row level security;

create policy "Anyone can read seeded sentences" on sentences
  for select using (is_seeded = true);

create policy "Users can read own sentences" on sentences
  for select using (auth.uid() = user_id);

create policy "Users can insert own sentences" on sentences
  for insert with check (auth.uid() = user_id);

create policy "Users can update own sentences" on sentences
  for update using (auth.uid() = user_id);

create policy "Users can delete own sentences" on sentences
  for delete using (auth.uid() = user_id);

create index sentences_category_idx on sentences(category);
create index sentences_content_type_idx on sentences(content_type);
create index sentences_is_seeded_idx on sentences(is_seeded);
