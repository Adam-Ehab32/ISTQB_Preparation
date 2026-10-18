-- Study summaries, quiz engine support (difficulty, exam sets, generated questions, exposure tracking).
alter table questions
  add column difficulty smallint not null default 2 check (difficulty between 1 and 3),      -- 1 easy, 2 medium, 3 hard
  add column exam_set text check (exam_set in ('A','B','C','D')),                            -- original practice sets, not official ISTQB papers
  add column gen_key text,                                                                   -- set for dynamically generated variants
  add constraint gen_needs_owner check (gen_key is null or owner_id is not null);
update questions set difficulty = case k_level when 'K1' then 1 when 'K2' then 2 else 3 end;
-- A generated variant is stored once per user; NULL keys never conflict, so normal questions are unaffected.
create unique index questions_owner_gen_key on questions (owner_id, gen_key);

create table summary_sections (
  id uuid primary key default uuid_v7(),
  chapter_id smallint not null references chapters(id) on delete restrict,
  position smallint not null,
  title text not null,
  points text[] not null check (cardinality(points) > 0),
  memo text[] not null default '{}',
  unique (chapter_id, position));
create table summary_terms (
  id uuid primary key default uuid_v7(),
  section_id uuid not null references summary_sections(id) on delete cascade,
  term text not null,
  definition text not null,
  position smallint not null default 0,
  unique (section_id, term));
alter table summary_sections enable row level security;
alter table summary_terms enable row level security;
create policy ss_sel on summary_sections for select to authenticated using (true);
create policy st_sel on summary_terms for select to authenticated using (true);

-- Server-side exposure: how often (and when last) the current user has answered each question.
create view question_exposure with (security_invoker = true) as
  select question_id, count(*)::int as times, max(created_at) as last_seen
  from quiz_attempts where user_id = auth.uid() group by question_id;
grant select on question_exposure to authenticated;

-- Generated variants are practice material and must not distort syllabus coverage.
create or replace view chapter_readiness with (security_invoker = true) as
with base as (
  select c.id as chapter_id, count(a.id)::int as attempts,
    round(100.0 * avg(a.is_correct::int) filter (where a.k_level = 'K1'))::int as acc_k1,
    round(100.0 * avg(a.is_correct::int) filter (where a.k_level = 'K2'))::int as acc_k2,
    round(100.0 * avg(a.is_correct::int) filter (where a.k_level = 'K3'))::int as acc_k3,
    round(100.0 * least(1, count(distinct a.question_id) filter (where a.is_correct and qq.gen_key is null)::numeric /
      nullif((select count(*) from questions q join topics t2 on t2.id = q.topic_id
               where t2.chapter_id = c.id and q.status = 'published' and q.gen_key is null), 0)))::int as coverage
  from chapters c left join topics t on t.chapter_id = c.id
  left join quiz_attempts a on a.topic_id = t.id and a.user_id = auth.uid()
  left join questions qq on qq.id = a.question_id
  group by c.id)
select b.*, case when attempts = 0 then 0 else
  round(0.6 * (coalesce(acc_k1, 0) * 1 + coalesce(acc_k2, 0) * 2 + coalesce(acc_k3, 0) * 3)::numeric
        / nullif(case when acc_k1 is null then 0 else 1 end + case when acc_k2 is null then 0 else 2 end + case when acc_k3 is null then 0 else 3 end, 0)
        + 0.4 * coalesce(coverage, 0))::int end as readiness
from base b;
