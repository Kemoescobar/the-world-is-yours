-- Catalogue media: instru covers + multi screenshots for projets

alter table public.instrumentaux
  add column if not exists cover_url text;

alter table public.projets_dev
  add column if not exists captures text[] default '{}'::text[];

-- Backfill captures from legacy single capture_url
update public.projets_dev
set captures = array[capture_url]
where capture_url is not null
  and capture_url <> ''
  and (captures is null or cardinality(captures) = 0);

comment on column public.instrumentaux.cover_url is 'Sleeve art URL (bucket captures), public-readable for showcase';
comment on column public.projets_dev.captures is 'Screenshot URLs (bucket captures); capture_url mirrors first for legacy';
comment on column public.projets_dev.description is 'Presentation / lookbook text shown in catalogue focus panel';
