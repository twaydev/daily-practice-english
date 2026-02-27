alter table sentences add column if not exists tags text[] not null default '{}';

-- GIN index enables efficient array contains queries (e.g. WHERE 'work' = any(tags))
create index if not exists sentences_tags_idx on sentences using gin(tags);
