-- Cache OpenAI phonetic analysis on the sentence itself
alter table sentences add column if not exists phonetic_data jsonb;

-- Redesign practice_history: was phonetic cache, now stores speech attempts
drop table if exists practice_history;

create table practice_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  sentence_id uuid references sentences(id) on delete set null,
  sentence_text text not null,          -- preserved even if sentence is deleted
  user_transcript text not null,        -- what the user said (SpeechRecognition)
  accuracy_score numeric(5,2) not null, -- 0.00–100.00 word-overlap accuracy
  created_at timestamptz default now()
);

alter table practice_history enable row level security;

create policy "Users manage own history" on practice_history
  for all using (auth.uid() = user_id);

create index practice_history_user_id_idx on practice_history(user_id);
create index practice_history_created_at_idx on practice_history(created_at desc);
