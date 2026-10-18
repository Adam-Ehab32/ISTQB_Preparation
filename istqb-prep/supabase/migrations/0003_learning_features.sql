-- Smart Coffee, Mistake Vault, Real-World Analogy, Spot the Bug, per-chapter readiness.
alter table questions add column analogy text;     -- practical, non-academic analogy (mostly K2/K3 concepts)
alter table topics add column analogy text;

create table mistake_vault (                       -- a row per question the user has missed; active while cleared_at is null
  user_id         uuid not null references users(id) on delete cascade,
  question_id     uuid not null references questions(id) on delete cascade,
  wrong_count     int not null default 1 check (wrong_count > 0),
  streak_correct  smallint not null default 0 check (streak_correct between 0 and 2),
  first_missed_at timestamptz not null default now(),
  last_missed_at  timestamptz not null default now(),
  cleared_at      timestamptz,                     -- set by the 2nd consecutive correct answer
  primary key (user_id, question_id));
create index on mistake_vault (question_id);
create index on mistake_vault (user_id) where cleared_at is null;

create table coffee_sessions (                     -- the 3 daily warm-up questions, fixed for the day
  user_id uuid not null references users(id) on delete cascade,
  day date not null,
  question_ids uuid[] not null,
  reasons text[] not null,
  completed_at timestamptz,
  primary key (user_id, day));

create table reasoning_cards (                     -- "Spot the bug in reasoning": a flawed claim + candidate flaws
  id uuid primary key default uuid_v7(),
  chapter_id smallint not null references chapters(id) on delete restrict,
  k_level k_level not null,
  claim text not null,
  flaw_options text[] not null check (cardinality(flaw_options) between 2 and 6),
  flaw_index smallint not null,
  trap text not null,                              -- the distractor pattern, e.g. "Absolute-claim trap"
  correction text not null,
  check (flaw_index >= 0 and flaw_index < cardinality(flaw_options)));
create index on reasoning_cards (chapter_id);

create table reasoning_attempts (
  id uuid primary key default uuid_v7(),
  user_id uuid not null default auth.uid() references users(id) on delete cascade,
  card_id uuid not null references reasoning_cards(id) on delete cascade,
  selected_index smallint not null check (selected_index >= 0),
  is_correct boolean not null,
  created_at timestamptz not null default now());
create index on reasoning_attempts (user_id, created_at desc);
create index on reasoning_attempts (card_id);

alter table mistake_vault enable row level security;
alter table coffee_sessions enable row level security;
alter table reasoning_cards enable row level security;
alter table reasoning_attempts enable row level security;
create policy mv_sel on mistake_vault for select to authenticated using (user_id = (select auth.uid()));
create policy cs_sel on coffee_sessions for select to authenticated using (user_id = (select auth.uid()));
create policy rc_sel on reasoning_cards for select to authenticated using (true);
create policy ra_sel on reasoning_attempts for select to authenticated using (user_id = (select auth.uid()));
create policy ra_ins on reasoning_attempts for insert to authenticated with check (user_id = (select auth.uid()));

-- Vault rules live next to the analytics rollup: every wrong answer enters (or resets) the vault;
-- an active entry leaves after 2 consecutive correct answers.
create or replace function qa_after() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform touch_analytics(new.user_id, new.topic_id,
    (case when not new.is_correct then 0 when new.over_time then 1 else 2 end)::smallint,
    new.is_correct, new.time_taken_ms, 0);
  if not new.is_correct then
    insert into mistake_vault (user_id, question_id) values (new.user_id, new.question_id)
      on conflict (user_id, question_id) do update
      set wrong_count = mistake_vault.wrong_count + 1, streak_correct = 0, cleared_at = null, last_missed_at = new.created_at;
  else
    update mistake_vault set streak_correct = streak_correct + 1,
           cleared_at = case when streak_correct + 1 >= 2 then new.created_at end
     where user_id = new.user_id and question_id = new.question_id and cleared_at is null;
  end if;
  return new;
end $$;

drop function submit_attempt(uuid, uuid, smallint, int, boolean);
create function submit_attempt(p_question uuid, p_session uuid, p_selected smallint, p_ms int, p_hint boolean default false)
returns table (is_correct boolean, correct_index smallint, xp_base int, xp_speed int, xp_streak int, xp_daily int, total_xp int, streak_days int,
               in_vault boolean, vault_streak int, vault_cleared boolean)
language plpgsql as $$
#variable_conflict use_column
declare v_id uuid;
begin
  insert into quiz_attempts (session_id, question_id, selected_index, time_taken_ms, hint_used)
    values (p_session, p_question, p_selected, p_ms, p_hint) returning id into v_id;
  return query select a.is_correct, (select q.correct_index from questions q where q.id = p_question),
      x.xp_base, x.xp_speed, x.xp_streak, x.xp_daily, x.total_xp, x.streak_days,
      (mv.question_id is not null and mv.cleared_at is null), coalesce(mv.streak_correct, 0)::int, coalesce(mv.cleared_at = a.created_at, false)
    from quiz_attempts a cross join award_xp(v_id) x
    left join mistake_vault mv on mv.user_id = a.user_id and mv.question_id = a.question_id
    where a.id = v_id;
end $$;
revoke execute on function submit_attempt(uuid, uuid, smallint, int, boolean) from public, anon;
grant execute on function submit_attempt(uuid, uuid, smallint, int, boolean) to authenticated;

-- Smart Coffee priority: vault +50, topic due (or never studied) +30, weakness 0..20, never attempted +10.
create function get_coffee() returns table (question_id uuid, reason text, done boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare v_uid uuid := auth.uid(); v_ids uuid[]; v_rs text[]; v_done timestamptz;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select c.question_ids, c.reasons, c.completed_at into v_ids, v_rs, v_done from coffee_sessions c where c.user_id = v_uid and c.day = current_date;
  if v_ids is null then
    with scored as (
      select q.id,
        (case when mv.question_id is not null then 50 else 0 end
         + case when ua.topic_id is null or ua.next_review_at <= now() then 30 else 0 end
         + round((1 - coalesce(case when ua.attempts > 0 then ua.accuracy end, .5)) * 20)::int
         + case when exists (select 1 from quiz_attempts a where a.user_id = v_uid and a.question_id = q.id) then 0 else 10 end) as sc,
        case when mv.question_id is not null then 'Mistake Vault'
             when coalesce(ua.attempts, 0) > 0 and ua.next_review_at <= now() then 'Due for review'
             when coalesce(ua.attempts, 0) > 0 and ua.accuracy < .6 then 'Weak topic'
             else 'New material' end as rs
      from questions q
      left join user_analytics ua on ua.user_id = v_uid and ua.topic_id = q.topic_id
      left join mistake_vault mv on mv.user_id = v_uid and mv.question_id = q.id and mv.cleared_at is null
      where q.status = 'published' and (q.owner_id is null or q.owner_id = v_uid)
      order by sc desc, q.id limit 3)
    select array_agg(id order by sc desc, id), array_agg(rs order by sc desc, id) into v_ids, v_rs from scored;
    insert into coffee_sessions (user_id, day, question_ids, reasons) values (v_uid, current_date, coalesce(v_ids, '{}'), coalesce(v_rs, '{}'));
  end if;
  return query select i.id, r.rs, v_done is not null
    from unnest(v_ids) with ordinality as i(id, n) join unnest(v_rs) with ordinality as r(rs, n) using (n) order by n;
end $$;

-- +15 XP once per day after all 3 coffee questions were answered today.
create function complete_coffee() returns int language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); c coffee_sessions;
begin
  select * into c from coffee_sessions where user_id = v_uid and day = current_date for update;
  if not found or c.completed_at is not null or cardinality(c.question_ids) = 0 then return 0; end if;
  if (select count(distinct a.question_id) from quiz_attempts a
       where a.user_id = v_uid and a.created_at::date = current_date and a.question_id = any (c.question_ids)) < cardinality(c.question_ids) then return 0; end if;
  update coffee_sessions set completed_at = now() where user_id = v_uid and day = current_date;
  insert into xp_events (user_id, xp) values (v_uid, 15);
  update users set total_xp = total_xp + 15 where id = v_uid;
  return 15;
end $$;

create function submit_reasoning(p_card uuid, p_selected smallint) returns table (is_correct boolean, flaw_index smallint)
language plpgsql as $$
#variable_conflict use_column
declare c reasoning_cards;
begin
  select * into c from reasoning_cards where id = p_card;
  if not found or p_selected < 0 or p_selected >= cardinality(c.flaw_options) then raise exception 'invalid card or option'; end if;
  insert into reasoning_attempts (card_id, selected_index, is_correct) values (p_card, p_selected, p_selected = c.flaw_index);
  return query select p_selected = c.flaw_index, c.flaw_index;
end $$;
revoke execute on function get_coffee(), complete_coffee(), submit_reasoning(uuid, smallint) from public, anon;
grant execute on function get_coffee(), complete_coffee(), submit_reasoning(uuid, smallint) to authenticated;

-- Chapter readiness: 60% K-weighted accuracy (K1 x1, K2 x2, K3 x3; only levels attempted) + 40% coverage
-- (distinct questions answered correctly / published questions in the chapter). 0 until the first attempt.
create view chapter_readiness with (security_invoker = true) as
with base as (
  select c.id as chapter_id, count(a.id)::int as attempts,
    round(100.0 * avg(a.is_correct::int) filter (where a.k_level = 'K1'))::int as acc_k1,
    round(100.0 * avg(a.is_correct::int) filter (where a.k_level = 'K2'))::int as acc_k2,
    round(100.0 * avg(a.is_correct::int) filter (where a.k_level = 'K3'))::int as acc_k3,
    round(100.0 * least(1, count(distinct a.question_id) filter (where a.is_correct)::numeric /
      nullif((select count(*) from questions q join topics t2 on t2.id = q.topic_id where t2.chapter_id = c.id and q.status = 'published'), 0)))::int as coverage
  from chapters c left join topics t on t.chapter_id = c.id
  left join quiz_attempts a on a.topic_id = t.id and a.user_id = auth.uid()
  group by c.id)
select b.*, case when attempts = 0 then 0 else
  round(0.6 * (coalesce(acc_k1, 0) * 1 + coalesce(acc_k2, 0) * 2 + coalesce(acc_k3, 0) * 3)::numeric
        / nullif(case when acc_k1 is null then 0 else 1 end + case when acc_k2 is null then 0 else 2 end + case when acc_k3 is null then 0 else 3 end, 0)
        + 0.4 * coalesce(coverage, 0))::int end as readiness
from base b;
grant select on chapter_readiness to authenticated;
