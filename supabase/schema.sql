create table if not exists public.hunt_pirzadeh_scores (
  user_key text primary key,
  display_name text not null,
  best_score integer not null default 0 check (best_score >= 0 and best_score <= 5000),
  caught_pirzadeh boolean not null default false,
  games_played integer not null default 1,
  updated_at timestamptz not null default now()
);

create index if not exists idx_hunt_pirzadeh_scores_best
  on public.hunt_pirzadeh_scores (best_score desc, updated_at asc);

alter table public.hunt_pirzadeh_scores enable row level security;

drop policy if exists "Public read leaderboard" on public.hunt_pirzadeh_scores;
create policy "Public read leaderboard"
  on public.hunt_pirzadeh_scores
  for select
  to anon, authenticated
  using (true);

create or replace function public.submit_pirzadeh_score(
  p_user_key text,
  p_display_name text,
  p_score integer,
  p_caught_pirzadeh boolean default false
)
returns table (
  updated boolean,
  best_score integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean_key text := left(trim(coalesce(p_user_key, '')), 64);
  v_clean_name text := left(trim(coalesce(p_display_name, 'PLAYER')), 32);
  v_score integer := greatest(0, least(5000, coalesce(p_score, 0)));
  v_prev integer;
  v_new_best integer;
begin
  if v_clean_key = '' then
    raise exception 'Missing user_key';
  end if;
  if v_clean_name = '' then
    v_clean_name := 'PLAYER';
  end if;

  select s.best_score into v_prev
  from public.hunt_pirzadeh_scores s
  where s.user_key = v_clean_key;

  if not found then
    insert into public.hunt_pirzadeh_scores (user_key, display_name, best_score, caught_pirzadeh, games_played, updated_at)
    values (v_clean_key, v_clean_name, v_score, coalesce(p_caught_pirzadeh, false), 1, now());
    return query select true, v_score;
  else
    v_new_best := greatest(v_prev, v_score);
    update public.hunt_pirzadeh_scores
    set display_name = v_clean_name,
        best_score = v_new_best,
        caught_pirzadeh = caught_pirzadeh or coalesce(p_caught_pirzadeh, false),
        games_played = games_played + 1,
        updated_at = now()
    where user_key = v_clean_key;
    return query select (v_score > v_prev), v_new_best;
  end if;
end;
$$;

grant execute on function public.submit_pirzadeh_score(text, text, integer, boolean) to anon, authenticated;
