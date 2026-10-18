\set ON_ERROR_STOP on
\set QUIET on
\i supabase/tests/pretest.sql
\i supabase/migrations/0001_init.sql
\i supabase/migrations/0002_gamification.sql
\i supabase/migrations/0003_learning_features.sql
\i supabase/migrations/0004_study_and_quiz_engine.sql
\i supabase/seed.sql
insert into auth.users(id,email) values ('00000000-0000-0000-0000-00000000000a','a@x.com'),('00000000-0000-0000-0000-00000000000b','b@x.com');
create function t_ans(q uuid, ok boolean, ms int default 5000)
returns table (in_vault boolean, total_xp int) language sql as $$
 select s.in_vault, s.total_xp from submit_attempt(q, gen_random_uuid(),
  (((select correct_index from questions where id=q) + case when ok then 0 else 1 end) % (select cardinality(options) from questions where id=q))::smallint, ms) s $$;
do $$ begin
 assert (select count(*) from questions)=39,'39 questions';
 assert (select count(*) from questions where exam_set is not null)=24 and (select count(distinct exam_set) from questions)=4,'24 questions across Sets A-D (6 each)';
 assert (select min(c) from (select count(*) c from questions where exam_set is not null group by exam_set) x)=6,'6 per set';
 assert (select count(*) from questions where difficulty=1)>5 and (select count(*) from questions where difficulty=3)>5 and (select count(*) from questions where difficulty=2)>5,'every difficulty has a pool';
 assert (select count(distinct chapter_id) from summary_sections)=6 and (select count(*) from summary_sections)=19,'19 summary sections over 6 chapters';
 assert (select min(c) from (select count(*) c from summary_sections group by chapter_id) x)>=2,'each chapter has at least 2 sections';
 assert (select count(*) from summary_terms)>=45,'key terms seeded';
 assert (select bool_and(cardinality(memo)>0) from summary_sections),'every section has memorization bullets';
 begin update questions set difficulty=5 where id=(select id from questions limit 1); raise exception 'FAIL difficulty 5 accepted'; exception when check_violation then null; end;
 begin insert into questions(topic_id,owner_id,k_level,stem,options,correct_index,hint,explanation,expected_time_sec,gen_key) select id,null,'K3','x',array['a','b'],0,'h','e',30,'k' from topics limit 1; raise exception 'FAIL gen_key without owner'; exception when check_violation then null; end;
 raise notice 'PASS seeded pool (39 questions, 4 sets, difficulties) and summaries (19 sections, terms, memo)'; end $$;
select id as q4 from questions where stem like 'Which statement about coverage%' \gset
select id as qage from questions where stem like 'An age field%' \gset
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false) \gset
do $$ begin
 assert (select count(*) from summary_sections)=19,'authenticated can read summaries';
 insert into questions(topic_id,owner_id,k_level,stem,options,correct_index,hint,explanation,expected_time_sec,difficulty,gen_key)
  select id,auth.uid(),'K3','Generated A',array['1','2','3'],1,'h','e',120,3,'ep:3:100-300' from topics where chapter_id=4 order by position limit 1
  on conflict (owner_id,gen_key) do nothing;
 insert into questions(topic_id,owner_id,k_level,stem,options,correct_index,hint,explanation,expected_time_sec,difficulty,gen_key)
  select id,auth.uid(),'K3','Generated A again',array['1','2','3'],1,'h','e',120,3,'ep:3:100-300' from topics where chapter_id=4 order by position limit 1
  on conflict (owner_id,gen_key) do nothing;
 assert (select count(*) from questions where gen_key is not null)=1,'same generated variant is stored once per user';
 insert into questions(topic_id,owner_id,k_level,stem,options,correct_index,hint,explanation,expected_time_sec) select id,auth.uid(),'K1','Upload 1',array['a','b'],0,'h','e',30 from topics limit 1;
 insert into questions(topic_id,owner_id,k_level,stem,options,correct_index,hint,explanation,expected_time_sec) select id,auth.uid(),'K1','Upload 2',array['a','b'],0,'h','e',30 from topics limit 1;
 assert (select count(*) from questions where stem like 'Upload %')=2,'uploads with NULL gen_key never conflict';
 raise notice 'PASS generated-question upsert key (idempotent per user, uploads unaffected)'; end $$;
select count(*) from t_ans(:'q4',true) \gset
select count(*) from t_ans(:'q4',true) \gset
select count(*) from t_ans(:'qage',false) \gset
do $$ declare g uuid; begin
 assert (select times from question_exposure where question_id=(select id from questions where stem like 'Which statement about coverage%'))=2,'exposure counts repeated answers';
 assert (select count(*) from question_exposure)=2 and (select min(last_seen) from question_exposure) is not null,'exposure rows with last_seen';
 select id into g from questions where gen_key is not null;
 perform t_ans(g,true);
 assert (select coverage from chapter_readiness where chapter_id=4)=9,'coverage counts 1 of 11 core ch4 questions; generated variant excluded: '||(select coverage from chapter_readiness where chapter_id=4);
 assert (select attempts from chapter_readiness where chapter_id=4)=4,'but the generated attempt still counts for accuracy';
 raise notice 'PASS exposure tracking and readiness ignoring generated variants for coverage'; end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false) \gset
do $$ begin assert (select count(*) from question_exposure)=0 and (select count(*) from questions where gen_key is not null)=0,'B sees no exposure and no generated rows of A'; raise notice 'PASS per-user isolation of exposure and generated questions'; end $$;
