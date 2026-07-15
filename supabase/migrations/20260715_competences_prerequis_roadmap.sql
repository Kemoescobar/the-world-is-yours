-- Remplir prerequis vides depuis l'ordre roadmap (semaine / cours précédent).
-- Règle : chaîne linéaire par arc — S1 avant S2, C1 avant C2, etc.

with ranked as (
  select
    id,
    arc_id,
    coalesce(
      (regexp_match(source_roadmap, 'LearnByDoing-S([0-9]+)'))[1]::int,
      (regexp_match(source_roadmap, 'SS([0-9]+)'))[1]::int,
      0
    ) as week_num,
    coalesce((regexp_match(source_roadmap, '-C([0-9]+)$'))[1]::int, 0) as course_num
  from public.competences
  where source_roadmap is not null
),
with_prev as (
  select
    id,
    lag(id) over (
      partition by arc_id
      order by week_num, course_num, id
    ) as prev_id
  from ranked
)
update public.competences c
set prerequis = array[w.prev_id]
from with_prev w
where c.id = w.id
  and w.prev_id is not null
  and (c.prerequis is null or cardinality(c.prerequis) = 0);
