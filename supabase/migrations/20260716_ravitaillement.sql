-- Ravitaillement : propositions de quêtes depuis la roadmap (jamais injectées en silence)

create table if not exists public.ravitaillement_propositions (
  id uuid primary key default gen_random_uuid(),
  arc_id text not null references public.arcs(id),
  competence_id uuid references public.competences(id),
  drafts jsonb not null default '[]'::jsonb,
  -- drafts: [{ titre, competence_id, type }]
  statut text not null default 'proposee'
    check (statut in ('proposee', 'acceptee', 'refusee')),
  note text,
  date_proposition timestamptz default now(),
  date_reponse timestamptz
);

-- Max 1 proposition active par arc
create unique index if not exists uniq_ravitaillement_proposee_arc
  on public.ravitaillement_propositions (arc_id)
  where statut = 'proposee';

create index if not exists idx_ravitaillement_statut
  on public.ravitaillement_propositions (statut, date_proposition desc);

alter table public.ravitaillement_propositions enable row level security;

drop policy if exists owner_all_ravitaillement on public.ravitaillement_propositions;
create policy owner_all_ravitaillement on public.ravitaillement_propositions
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Best-effort : rattacher quêtes faites dont le titre croise clairement une compétence (Dev / Beatmaker)
-- Ne force rien d'ambigu — laisse null sinon.

update public.quetes q
set competence_id = c.id
from public.competences c
where q.competence_id is null
  and q.type = 'dev'
  and c.arc_id = 'dev'
  and (
    (q.titre ilike '%API%' and q.titre ilike '%Supabase%' and c.source_roadmap = 'LearnByDoing-S5-C1')
    or (q.titre ilike '%webhook%' and q.titre ilike '%GitHub%' and c.source_roadmap = 'LearnByDoing-S5-C2')
    or (q.titre ilike '%Auth%' and q.titre ilike '%routes%' and c.source_roadmap = 'LearnByDoing-S7')
  );

update public.quetes q
set competence_id = c.id
from public.competences c
where q.competence_id is null
  and q.type = 'beatmaker'
  and c.arc_id = 'beatmaker'
  and (
    (q.titre ilike '%showcase%' and c.source_roadmap = 'Beatmaker-P64-SS17')
    or (q.titre ilike '%Uploader%' and q.titre ilike '%instrumental%' and c.source_roadmap = 'Beatmaker-P64-SS17')
  );
