-- ISTQB Prep Master: initial schema (fresh DB, so plain CREATE INDEX is safe; runs in one txn).
-- Rollback: drop views, then tables (quiz_attempts, user_analytics, questions, topics, chapters, users) CASCADE, then types/functions.

-- UUIDv7: time-ordered public IDs (good btree locality, no volume leak)
create function uuid_v7() returns uuid language sql volatile as $$
  select encode(set_bit(set_bit(overlay(uuid_send(gen_random_uuid()) placing
    substring(int8send((extract(epoch from clock_timestamp())*1000)::bigint) from 3) from 1 for 6), 52, 1), 53, 1), 'hex')::uuid $$;

create type k_level as enum ('K1','K2','K3');
create type q_status as enum ('draft','published','archived');

create table users (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0),
  theme        text not null default 'system' check (theme in ('light','dark','system')),
  exam_date    date,                                  -- null = no exam booked
  created_at   timestamptz not null default now()
);

create table chapters (
  id    smallint primary key check (id between 1 and 6),
  slug  text not null unique,
  title text not null
);
insert into chapters values
 (1,'fundamentals','Fundamentals of Testing'),(2,'sdlc','Testing Throughout the Software Development Lifecycle'),
 (3,'static','Static Testing'),(4,'techniques','Test Analysis and Design'),
 (5,'management','Managing the Test Activities'),(6,'tools','Test Tools');

create table topics (                                  -- also the mind-map nodes and SR cards
  id         uuid primary key default uuid_v7(),
  chapter_id smallint not null references chapters(id) on delete restrict,
  parent_id  uuid references topics(id) on delete cascade,   -- null = first-level node
  slug       text not null,
  title      text not null,
  summary    text not null,                            -- quick-summary drawer
  position   smallint not null default 0,
  unique (chapter_id, slug)                            -- also indexes chapter_id FK
);
create index on topics (parent_id);

create table questions (
  id               uuid primary key default uuid_v7(),
  topic_id         uuid not null references topics(id) on delete restrict,
  owner_id         uuid references users(id) on delete cascade,   -- null = official, set = user upload
  k_level          k_level not null,
  stem             text not null,
  options          text[] not null check (cardinality(options) between 2 and 6),
  correct_index    smallint not null,
  hint             text not null,                      -- concept hint drawer
  explanation      text not null,                      -- detailed explanation drawer
  expected_time_sec int not null check (expected_time_sec between 5 and 600),  -- app defaults: K1 30 / K2 60 / K3 120
  status           q_status not null default 'published',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (correct_index >= 0 and correct_index < cardinality(options))
);
create index on questions (topic_id, k_level);
create index on questions (owner_id) where owner_id is not null;

create function touch() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger q_touch before update on questions for each row execute function touch();

create table quiz_attempts (                           -- append-only: one row per answered question
  id                uuid primary key default uuid_v7(),
  user_id           uuid not null default auth.uid() references users(id) on delete cascade,
  session_id        uuid not null,                     -- groups one quiz run
  question_id       uuid not null references questions(id) on delete cascade,
  topic_id          uuid not null references topics(id) on delete restrict,  -- snapshot, set by trigger
  k_level           k_level not null,                  -- snapshot, set by trigger
  expected_time_sec int not null,                      -- snapshot, set by trigger
  selected_index    smallint not null check (selected_index >= 0),
  is_correct        boolean not null,                  -- computed server-side by trigger
  time_taken_ms     int not null check (time_taken_ms between 0 and 3600000),
  hint_used         boolean not null default false,
  over_time         boolean generated always as (time_taken_ms > expected_time_sec * 1000) stored,
  created_at        timestamptz not null default now()
);
create index on quiz_attempts (user_id, created_at desc);
create index on quiz_attempts (user_id, session_id);
create index on quiz_attempts (question_id);
create index on quiz_attempts (topic_id);

create table user_analytics (                          -- per user x topic rollup + SM-2-lite state
  user_id          uuid not null references users(id) on delete cascade,
  topic_id         uuid not null references topics(id) on delete cascade,
  attempts         int not null default 0,
  correct          int not null default 0,
  accuracy         numeric(4,3) generated always as (case when attempts = 0 then 0 else correct::numeric / attempts end) stored,
  quiz_time_ms     bigint not null default 0,
  study_time_sec   bigint not null default 0,          -- reviews / mind-map time
  repetitions      int not null default 0,
  interval_days    int not null default 0,
  ease             numeric(3,2) not null default 2.5 check (ease between 1.3 and 3),
  next_review_at   timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  primary key (user_id, topic_id),
  check (correct <= attempts)
);
create index on user_analytics (user_id, next_review_at);
create index on user_analytics (topic_id);

-- Core analytics + spaced repetition. q: 0 = again, 1 = good, 2 = easy, null = study time only.
create function touch_analytics(p_user uuid, p_topic uuid, p_q smallint, p_correct boolean, p_ms bigint, p_study int)
returns void language plpgsql security definer set search_path = public as $$
declare a user_analytics; n int; e numeric;
begin
  insert into user_analytics (user_id, topic_id) values (p_user, p_topic) on conflict do nothing;
  select * into a from user_analytics where user_id = p_user and topic_id = p_topic for update;
  n := case when p_q is null then a.interval_days when p_q = 0 then 0 when a.repetitions = 0 then 1
            when a.repetitions = 1 then 3 else round(a.interval_days * a.ease * case when p_q = 2 then 1.3 else 1 end) end;
  e := case when p_q = 0 then greatest(1.3, a.ease - .2) when p_q = 2 then least(3, a.ease + .1) else a.ease end;
  update user_analytics set
    attempts = attempts + (p_correct is not null)::int, correct = correct + coalesce(p_correct, false)::int,
    quiz_time_ms = quiz_time_ms + p_ms, study_time_sec = study_time_sec + p_study,
    repetitions = case when p_q is null then repetitions when p_q = 0 then 0 else repetitions + 1 end,
    interval_days = n, ease = e,
    next_review_at = case when p_q is null then next_review_at else now() + n * interval '1 day' end,
    last_activity_at = now()
  where user_id = p_user and topic_id = p_topic;
end $$;
revoke execute on function touch_analytics(uuid, uuid, smallint, boolean, bigint, int) from public, anon, authenticated;

-- Attempts: server fills snapshots + correctness (client can't forge), then rolls up analytics
create function qa_before() returns trigger language plpgsql as $$
declare q questions;
begin
  select * into q from questions where id = new.question_id;   -- RLS applies: only visible questions
  if not found or new.selected_index >= cardinality(q.options) then raise exception 'invalid question or option'; end if;
  new.topic_id := q.topic_id; new.k_level := q.k_level; new.expected_time_sec := q.expected_time_sec;
  new.is_correct := (new.selected_index = q.correct_index);
  return new;
end $$;
create trigger qa_before before insert on quiz_attempts for each row execute function qa_before();

create function qa_after() returns trigger language plpgsql security definer set search_path = public as $$
begin  -- wrong -> again; right but over time -> good; right and on time -> easy
  perform touch_analytics(new.user_id, new.topic_id,
    (case when not new.is_correct then 0 when new.over_time then 1 else 2 end)::smallint,
    new.is_correct, new.time_taken_ms, 0);
  return new;
end $$;
create trigger qa_after after insert on quiz_attempts for each row execute function qa_after();

-- RPCs used by the app (typed, no client-side column juggling)
create function submit_attempt(p_question uuid, p_session uuid, p_selected smallint, p_ms int, p_hint boolean default false)
returns table (is_correct boolean, correct_index smallint) language plpgsql as $$
begin
  return query insert into quiz_attempts (session_id, question_id, selected_index, time_taken_ms, hint_used)
    values (p_session, p_question, p_selected, p_ms, p_hint)
    returning quiz_attempts.is_correct, (select q.correct_index from questions q where q.id = p_question);
end $$;

create function review_topic(p_topic uuid, p_q smallint, p_study_sec int default 0)
returns void language sql security definer set search_path = public as $$
  select touch_analytics(auth.uid(), p_topic, p_q, null, 0, p_study_sec)
  where auth.uid() is not null and (p_q is null or p_q between 0 and 2) and p_study_sec between 0 and 3600 $$;
revoke execute on function submit_attempt(uuid, uuid, smallint, int, boolean), review_topic(uuid, smallint, int) from public, anon;

-- Signup hook
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into users (id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), nullif(split_part(new.email, '@', 1), ''), 'Learner'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Views (RLS-respecting)
create view review_queue with (security_invoker = true) as   -- due or never-seen topics for today's session
  select t.id topic_id, t.chapter_id, t.title, t.summary, coalesce(a.next_review_at, now()) due_at
  from topics t left join user_analytics a on a.topic_id = t.id and a.user_id = auth.uid()
  where coalesce(a.next_review_at, now()) <= now();

create view weak_topics with (security_invoker = true) as
  select a.user_id, a.topic_id, t.chapter_id, t.title, a.attempts, a.accuracy
  from user_analytics a join topics t on t.id = a.topic_id where a.attempts >= 3 and a.accuracy < .6;

create view k_time_stats with (security_invoker = true) as   -- time vs complexity; K1 over_time_n = slow on simple questions
  select user_id, k_level, count(*) attempts, round(avg(time_taken_ms) / 1000.0, 1) avg_sec,
         round(avg(expected_time_sec), 1) expected_sec, count(*) filter (where over_time) over_time_n
  from quiz_attempts group by user_id, k_level;

-- RLS
do $$ declare t text; begin
  foreach t in array array['users','chapters','topics','questions','quiz_attempts','user_analytics']
  loop execute format('alter table %I enable row level security', t); end loop; end $$;

create policy users_sel    on users for select to authenticated using (id = (select auth.uid()));
create policy users_upd    on users for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy chapters_sel on chapters for select to authenticated using (true);
create policy topics_sel   on topics for select to authenticated using (true);
create policy q_sel on questions for select to authenticated
  using (status = 'published' and (owner_id is null or owner_id = (select auth.uid())));
create policy q_ins on questions for insert to authenticated with check (owner_id = (select auth.uid()));
create policy q_upd on questions for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy q_del on questions for delete to authenticated using (owner_id = (select auth.uid()));
create policy qa_sel on quiz_attempts for select to authenticated using (user_id = (select auth.uid()));
create policy qa_ins on quiz_attempts for insert to authenticated with check (user_id = (select auth.uid()));
create policy ua_sel on user_analytics for select to authenticated using (user_id = (select auth.uid()));  -- writes only via definer functions
