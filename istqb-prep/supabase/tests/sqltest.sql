\set ON_ERROR_STOP on
\set QUIET on
\i supabase/tests/pretest.sql
\i supabase/migrations/0001_init.sql
\i supabase/migrations/0002_gamification.sql
\i supabase/migrations/0003_learning_features.sql
\i supabase/migrations/0004_study_and_quiz_engine.sql
\i supabase/seed.sql
insert into auth.users(id,email,raw_user_meta_data) values ('00000000-0000-0000-0000-00000000000a','a@x.com','{"name":"Alice"}'),('00000000-0000-0000-0000-00000000000b','b@x.com','{}');
do $$ begin assert (select display_name from users where email='a@x.com')='Alice','profile name from metadata'; assert (select display_name from users where email='b@x.com')='b','profile name fallback to email prefix'; raise notice 'PASS signup trigger creates profile (email, display_name)'; end $$;
select id as k1, correct_index as k1c from questions where k_level='K1' limit 1 \gset
select id as k2, correct_index as k2c from questions where k_level='K2' limit 1 \gset
select id as k3, correct_index as k3c from questions where k_level='K3' limit 1 \gset
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false) \gset
create temp table r(label text, base int, speed int, streak int, daily int, total int, sd int);
insert into r select 'K1 fast', xp_base,xp_speed,xp_streak,xp_daily,total_xp,streak_days from submit_attempt(:'k1', gen_random_uuid(), :k1c::smallint, 5000);
insert into r select 'K2 fast', xp_base,xp_speed,xp_streak,xp_daily,total_xp,streak_days from submit_attempt(:'k2', gen_random_uuid(), :k2c::smallint, 5000);
insert into r select 'K3 fast', xp_base,xp_speed,xp_streak,xp_daily,total_xp,streak_days from submit_attempt(:'k3', gen_random_uuid(), :k3c::smallint, 5000);
insert into r select 'K1 slow', xp_base,xp_speed,xp_streak,xp_daily,total_xp,streak_days from submit_attempt(:'k1', gen_random_uuid(), :k1c::smallint, 20000);
insert into r select 'K1 fast 5th', xp_base,xp_speed,xp_streak,xp_daily,total_xp,streak_days from submit_attempt(:'k1', gen_random_uuid(), :k1c::smallint, 5000);
insert into r select 'K1 wrong', xp_base,xp_speed,xp_streak,xp_daily,total_xp,streak_days from submit_attempt(:'k1', gen_random_uuid(), ((:k1c+1)%4)::smallint, 5000);
insert into r select 'goal', xp_base,xp_speed,xp_streak,xp_daily,total_xp,streak_days from submit_attempt(:'k1', gen_random_uuid(), :k1c::smallint, 900000);
do $$ declare x r; begin
 assert (select base+speed from r where label='K1 fast')=20,'K1 fast = 10+10';
 assert (select base+speed from r where label='K2 fast')=30,'K2 fast = 20+10';
 assert (select base+speed from r where label='K3 fast')=40,'K3 fast = 30+10';
 assert (select base||'/'||speed from r where label='K1 slow')='10/0','slow answer gets no speed bonus';
 assert (select streak from r where label='K1 fast 5th')=25,'+25 on 5th consecutive correct';
 assert (select streak from r where label in ('K1 fast','K2 fast','K3 fast','K1 slow') and streak>0 limit 1) is null,'no streak bonus before 5th';
 assert (select base+speed+streak from r where label='K1 wrong')=0,'wrong answer earns 0';
 assert (select daily from r where label='goal')=50 and (select sd from r where label='goal')=1,'+50 once at 15 min and streak_days=1';
 assert (select total from r where label='goal')=205,'running total 205';
 raise notice 'PASS XP rules (10/20/30, +10 speed, +25 x5 streak, +50 daily goal, streak_days)'; end $$;
do $$ begin
 assert (select total_xp from users where id=auth.uid())=205 and (select sum(xp) from xp_events)=205,'users.total_xp equals xp_events sum';
 assert (select count(*) from user_analytics)>0,'spaced-repetition analytics rows written';
 assert (select min(next_review_at) from user_analytics where attempts>0)>now(),'correct answers push next_review_at forward';
 raise notice 'PASS total_xp ledger + spaced repetition updated by attempts'; end $$;
do $$ begin
 begin update users set total_xp=999999 where id=auth.uid(); raise exception 'FAIL xp edit allowed'; exception when insufficient_privilege then null; end;
 begin insert into xp_events(user_id,xp) values (auth.uid(),500); raise exception 'FAIL xp insert allowed'; exception when insufficient_privilege then null; end;
 begin insert into questions(topic_id,owner_id,k_level,stem,options,correct_index,hint,explanation,expected_time_sec) select id,null,'K1','x',array['a','b'],0,'h','e',30 from topics limit 1; raise exception 'FAIL official question insert allowed'; exception when insufficient_privilege then null; end;
 update users set display_name='Alice2', istqb_readiness_score=42 where id=auth.uid();
 assert (select istqb_readiness_score from users where id=auth.uid())=42,'readiness updatable';
 raise notice 'PASS clients cannot edit XP/streak/ledger or insert official questions; profile fields are editable'; end $$;
do $$ declare q uuid; ci int; begin
 select id,correct_index into q,ci from questions where k_level='K1' limit 1;
 insert into quiz_attempts(session_id,question_id,selected_index,time_taken_ms,is_correct) values (gen_random_uuid(),q,(ci+1)%4,1000,true);
 assert (select is_correct from quiz_attempts order by created_at desc,id desc limit 1)=false,'forged is_correct is overridden by trigger';
 raise notice 'PASS attempt correctness cannot be forged'; end $$;
insert into mock_exams(correct,total) values (30,40);
do $$ begin assert (select count(*) from mock_exams)=1 and (select count(*) from review_queue) between 14 and 17,'mock saved; review_queue excludes topics answered correctly'; raise notice 'PASS mock_exams + review_queue'; end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false) \gset
do $$ begin
 assert (select count(*) from users)=1,'B sees only own profile';
 assert (select count(*) from quiz_attempts)=0,'B cannot see A attempts';
 assert (select count(*) from mock_exams)=0,'B cannot see A mock exams';
 assert (select xp from lb_overall where display_name='Alice2')=205,'overall board shows A XP';
 assert (select xp from lb_weekly where display_name='Alice2')=205,'weekly board shows A XP';
 assert (select n from lb_champions where display_name='Alice2')=8 and (select acc from lb_champions where display_name='Alice2')=75,'champions: 6 of 8 correct = 75%';
 assert (select count(*) from lb_overall where display_name='b')=0,'zero-XP users not on overall board';
 raise notice 'PASS RLS isolation + leaderboard views (overall, weekly, champions)'; end $$;
set role anon;
do $$ begin begin perform 1 from lb_overall; raise exception 'FAIL anon can read leaderboard'; exception when insufficient_privilege then null; end; raise notice 'PASS anon blocked from leaderboard'; end $$;
