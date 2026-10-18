-- Profiles, XP, daily activity, mock exams, leaderboard views, hardened column grants.
alter table users
  add column email text, add column avatar_url text,
  add column istqb_readiness_score smallint not null default 0 check (istqb_readiness_score between 0 and 100),
  add column total_xp int not null default 0 check (total_xp >= 0),
  add column streak_days int not null default 0 check (streak_days >= 0),
  add column last_goal_day date;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into users (id, email, display_name, avatar_url) values (new.id, new.email,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
             nullif(split_part(new.email, '@', 1), ''), 'Learner'), new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;

-- Clients may not edit XP/streak: only these columns are updatable.
revoke update on users from authenticated;
grant update (display_name, theme, exam_date, avatar_url, istqb_readiness_score) on users to authenticated;

create table xp_events (
  id uuid primary key default uuid_v7(),
  user_id uuid not null references users(id) on delete cascade,
  xp int not null check (xp > 0),
  created_at timestamptz not null default now());
create index on xp_events (created_at desc);
create index on xp_events (user_id);

create table daily_activity (
  user_id uuid not null references users(id) on delete cascade,
  day date not null,
  ms bigint not null default 0,
  goal_awarded boolean not null default false,       -- 15-minute goal reached, +50 XP paid once
  primary key (user_id, day));

create table mock_exams (
  id uuid primary key default uuid_v7(),
  user_id uuid not null default auth.uid() references users(id) on delete cascade,
  correct smallint not null check (correct >= 0),
  total smallint not null check (total > 0),
  created_at timestamptz not null default now(),
  check (correct <= total));
create index on mock_exams (user_id, created_at desc);

alter table xp_events enable row level security;
alter table daily_activity enable row level security;
alter table mock_exams enable row level security;
create policy xe_sel on xp_events for select to authenticated using (user_id = (select auth.uid()));
create policy da_sel on daily_activity for select to authenticated using (user_id = (select auth.uid()));
create policy me_sel on mock_exams for select to authenticated using (user_id = (select auth.uid()));
create policy me_ins on mock_exams for insert to authenticated with check (user_id = (select auth.uid()));

-- XP rules: K1 10 / K2 20 / K3 30 for a correct answer; +10 if answered in < 50% of target time;
-- +25 on every 5th consecutive correct answer; +50 once per day when 15 minutes of quiz time is reached.
create function award_xp(p_attempt uuid)
returns table (xp_base int, xp_speed int, xp_streak int, xp_daily int, total_xp int, streak_days int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare a quiz_attempts; v_base int; v_speed int; v_streak int; v_daily int := 0; v_run int; v_ms bigint; v_done boolean; v_today date := current_date;
begin
  select * into a from quiz_attempts where id = p_attempt and user_id = auth.uid();
  if not found then raise exception 'attempt not found'; end if;
  v_base := case when not a.is_correct then 0 when a.k_level = 'K1' then 10 when a.k_level = 'K2' then 20 else 30 end;
  v_speed := case when a.is_correct and a.time_taken_ms < a.expected_time_sec * 500 then 10 else 0 end;
  select coalesce(min(rn) filter (where not is_correct) - 1, count(*)) into v_run
    from (select is_correct, row_number() over (order by created_at desc, id desc) rn from quiz_attempts where user_id = a.user_id) t;
  v_streak := case when a.is_correct and v_run > 0 and v_run % 5 = 0 then 25 else 0 end;
  insert into daily_activity (user_id, day, ms) values (a.user_id, v_today, a.time_taken_ms)
    on conflict (user_id, day) do update set ms = daily_activity.ms + excluded.ms returning ms, goal_awarded into v_ms, v_done;
  if v_ms >= 900000 and not v_done then
    v_daily := 50;
    update daily_activity set goal_awarded = true where user_id = a.user_id and day = v_today;
    update users set streak_days = case when last_goal_day = v_today - 1 then streak_days + 1 else 1 end, last_goal_day = v_today where id = a.user_id;
  end if;
  if v_base + v_speed + v_streak + v_daily > 0 then
    insert into xp_events (user_id, xp) values (a.user_id, v_base + v_speed + v_streak + v_daily);
    update users set total_xp = total_xp + v_base + v_speed + v_streak + v_daily where id = a.user_id;
  end if;
  return query select v_base, v_speed, v_streak, v_daily, u.total_xp, u.streak_days from users u where u.id = a.user_id;
end $$;
revoke execute on function award_xp(uuid) from public, anon;

drop function submit_attempt(uuid, uuid, smallint, int, boolean);
create function submit_attempt(p_question uuid, p_session uuid, p_selected smallint, p_ms int, p_hint boolean default false)
returns table (is_correct boolean, correct_index smallint, xp_base int, xp_speed int, xp_streak int, xp_daily int, total_xp int, streak_days int)
language plpgsql as $$
#variable_conflict use_column
declare v_id uuid;
begin
  insert into quiz_attempts (session_id, question_id, selected_index, time_taken_ms, hint_used)
    values (p_session, p_question, p_selected, p_ms, p_hint) returning id into v_id;
  return query select a.is_correct, (select q.correct_index from questions q where q.id = p_question), x.xp_base, x.xp_speed, x.xp_streak, x.xp_daily, x.total_xp, x.streak_days
    from quiz_attempts a, award_xp(v_id) x where a.id = v_id;
end $$;
revoke execute on function submit_attempt(uuid, uuid, smallint, int, boolean) from public, anon;
grant execute on function submit_attempt(uuid, uuid, smallint, int, boolean), review_topic(uuid, smallint, int) to authenticated;

-- Leaderboards: views run as owner so they can rank everyone while exposing only name/avatar/score.
create view lb_overall as select id, display_name, avatar_url, total_xp as xp from users where total_xp > 0;
create view lb_weekly as
  select u.id, u.display_name, u.avatar_url, sum(e.xp)::int as xp
  from xp_events e join users u on u.id = e.user_id where e.created_at > now() - interval '7 days' group by u.id;
create view lb_champions as
  select u.id, u.display_name, u.avatar_url, round(100.0 * avg(a.is_correct::int))::int as acc,
         round(100.0 * avg((a.time_taken_ms < a.expected_time_sec * 500)::int))::int as fast, count(*)::int as n
  from quiz_attempts a join users u on u.id = a.user_id group by u.id having count(*) >= 5;
revoke all on lb_overall, lb_weekly, lb_champions from public, anon;
grant select on lb_overall, lb_weekly, lb_champions to authenticated;
