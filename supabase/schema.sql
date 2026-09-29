-- Besuchskalender: Schema für Supabase (SQL Editor → einfügen → Run)
-- Die Tabelle ist für die Öffentlichkeit gesperrt (RLS ohne Policy).
-- Zugriff nur über sync_visits(code, besuche); der Familien-Code wird als SHA-256 gespeichert.

create table if not exists public.visits (
  family     text    not null,
  id         text    not null,
  updated_at bigint  not null,
  deleted    boolean not null default false,
  data       jsonb,
  primary key (family, id)
);

alter table public.visits enable row level security;
revoke all on public.visits from anon, authenticated;

create or replace function public.sync_visits(p_code text, p_visits jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  fam text;
begin
  if p_code is null or length(p_code) < 6 or length(p_code) > 100 then
    raise exception 'invalid code' using errcode = '22023';
  end if;
  if p_visits is null or jsonb_typeof(p_visits) <> 'array' or jsonb_array_length(p_visits) > 2000 then
    raise exception 'bad body' using errcode = '22023';
  end if;

  fam := encode(sha256(convert_to(p_code, 'utf8')), 'hex');

  -- Last-write-wins pro Besuch
  insert into visits (family, id, updated_at, deleted, data)
  select fam, id, updated_at, deleted,
         case when deleted then null else jsonb_build_object(
           'who',  left(v->>'who', 80),
           'date', v->>'date',
           'from', left(coalesce(v->>'from', ''), 5),
           'to',   left(coalesce(v->>'to', ''), 5),
           'note', left(coalesce(v->>'note', ''), 500)) end
  from (
    select distinct on (v->>'id')
           v, v->>'id' as id, (v->>'updatedAt')::bigint as updated_at,
           coalesce((v->>'deleted')::boolean, false) as deleted
    from jsonb_array_elements(p_visits) v
    where jsonb_typeof(v) = 'object'
      and length(v->>'id') between 1 and 64
      and (v->>'updatedAt') ~ '^\d{1,15}$'
      and (coalesce((v->>'deleted')::boolean, false)
           or ((v->>'date') ~ '^\d{4}-\d{2}-\d{2}$' and length(coalesce(v->>'who', '')) > 0))
    order by v->>'id', (v->>'updatedAt')::bigint desc
  ) s
  on conflict (family, id) do update
    set updated_at = excluded.updated_at, deleted = excluded.deleted, data = excluded.data
    where visits.updated_at < excluded.updated_at;

  -- Löschmarkierungen nach 90 Tagen entfernen
  delete from visits
   where family = fam and deleted
     and updated_at < (extract(epoch from now()) * 1000)::bigint - 90::bigint * 86400000;

  return coalesce((
    select jsonb_agg(
      case when deleted
        then jsonb_build_object('id', id, 'deleted', true, 'updatedAt', updated_at)
        else data || jsonb_build_object('id', id, 'updatedAt', updated_at) end)
    from visits where family = fam
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.sync_visits(text, jsonb) from public;
grant execute on function public.sync_visits(text, jsonb) to anon, authenticated;
