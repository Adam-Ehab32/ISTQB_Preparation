\set ON_ERROR_STOP on
\set QUIET on
\i supabase/tests/pretest.sql
\i supabase/migrations/0001_init.sql
\i supabase/migrations/0002_gamification.sql
\i supabase/migrations/0003_learning_features.sql
\i supabase/migrations/0004_study_and_quiz_engine.sql
\i supabase/seed.sql
insert into auth.users(id,email) values ('00000000-0000-0000-0000-00000000000a','a@x.com'),('00000000-0000-0000-0000-00000000000b','b@x.com'),('00000000-0000-0000-0000-00000000000c','c@x.com');
create function t_ans(q uuid, ok boolean, ms int default 5000)
returns table (in_vault boolean, vault_streak int, vault_cleared boolean, total_xp int) language sql as $$
 select s.in_vault, s.vault_streak, s.vault_cleared, s.total_xp from submit_attempt(q, gen_random_uuid(),
  (((select correct_index from questions where id=q) + case when ok then 0 else 1 end) % (select cardinality(options) from questions where id=q))::smallint, ms) s $$;
select id as qa from questions where stem like 'Which review type is the most formal%' \gset
select id as qb from questions where stem like 'Which statement about coverage%' \gset
select id as qc from questions where stem like 'A shop discount%' \gset
select id as qd from questions where stem like 'Which statement about state transition%' \gset
select id as qe from questions where stem like 'An age field%' \gset
do $$ begin
 assert (select count(*) from questions)=39 and (select count(*) from questions where analogy is not null)=13,'39 questions, 13 with analogies';
 assert (select count(*) from topics where analogy is not null)=5 and (select count(*) from reasoning_cards)=6,'5 topic analogies, 6 reasoning cards';
 raise notice 'PASS seed content (39 questions, analogies, 6 Spot-the-Bug cards)'; end $$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false) \gset
create temp table v(step text, in_v boolean, st int, cleared boolean);
insert into v select 'wrong',in_vault,vault_streak,vault_cleared from t_ans(:'qa',false);
insert into v select 'right1',in_vault,vault_streak,vault_cleared from t_ans(:'qa',true);
insert into v select 'wrong2',in_vault,vault_streak,vault_cleared from t_ans(:'qa',false);
insert into v select 'right2a',in_vault,vault_streak,vault_cleared from t_ans(:'qa',true);
insert into v select 'right2b',in_vault,vault_streak,vault_cleared from t_ans(:'qa',true);
do $$ begin
 assert (select in_v and st=0 from v where step='wrong'),'wrong answer enters vault with streak 0';
 assert (select in_v and st=1 and not cleared from v where step='right1'),'1 correct keeps it in the vault (streak 1)';
 assert (select in_v and st=0 from v where step='wrong2') and (select wrong_count from mistake_vault)=2,'a wrong answer resets the streak and counts the miss';
 assert (select in_v and st=1 from v where step='right2a'),'non-consecutive corrects do not clear';
 assert (select not in_v and cleared from v where step='right2b'),'2nd consecutive correct clears the question';
 assert (select cleared_at is not null from mistake_vault),'cleared_at recorded';
 raise notice 'PASS Mistake Vault: logs misses, resets on a miss, clears after 2 consecutive correct'; end $$;
insert into v select 'after',in_vault,vault_streak,vault_cleared from t_ans(:'qa',true);
insert into v select 'relapse',in_vault,vault_streak,vault_cleared from t_ans(:'qa',false);
do $$ begin
 assert (select not in_v and not cleared from v where step='after'),'correct after clearing changes nothing';
 assert (select in_v and st=0 from v where step='relapse') and (select cleared_at is null and wrong_count=3 from mistake_vault),'a later miss re-enters the vault';
 raise notice 'PASS vault re-entry after relapse'; end $$;
-- Smart Coffee for user B: one vault item must be picked first and the pick is stable all day
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false) \gset
select count(*) as n0 from t_ans(:'qe',false) \gset
create temp table c1 as select * from get_coffee();
create temp table c2 as select * from get_coffee();
do $$ begin
 assert (select count(*) from c1)=3,'coffee has 3 questions';
 assert (select reason from c1 limit 1)='Mistake Vault' and (select question_id from c1 limit 1)=(select question_id from mistake_vault),'vault question has top priority';
 assert (select array_agg(question_id order by question_id) from c1)=(select array_agg(question_id order by question_id) from c2),'same 3 all day';
 assert complete_coffee()=0,'no bonus before answering';
 raise notice 'PASS Smart Coffee: 3 picks, vault first, stable per day, no early bonus'; end $$;
create temp table cq as select question_id from c1;
select count(*) from (select t_ans(question_id,true) from cq) x \gset
do $$ declare before int; begin
 select total_xp into before from users where id=auth.uid();
 assert complete_coffee()=15,'+15 coffee bonus';
 assert complete_coffee()=0,'bonus only once';
 assert (select total_xp from users where id=auth.uid())=before+15 and (select sum(xp) from xp_events)=before+15,'XP ledger includes the bonus';
 assert (select bool_and(done) from get_coffee()),'coffee marked done';
 raise notice 'PASS Coffee completion: +15 XP once per day'; end $$;
-- Chapter readiness: ch4 K2 1/2, K3 2/2, 3 distinct solved of 11 -> 0.6*80+0.4*27 = 59
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false) \gset
select count(*) from t_ans(:'qb',true) \gset
select count(*) from t_ans(:'qd',false) \gset
select count(*) from t_ans(:'qe',true) \gset
select count(*) from t_ans(:'qc',true) \gset
do $$ declare r chapter_readiness; begin
 select * into r from chapter_readiness where chapter_id=4;
 assert r.attempts=4 and r.acc_k1 is null and r.acc_k2=50 and r.acc_k3=100 and r.coverage=27,'chapter 4 inputs: '||r::text;
 assert r.readiness=59,'chapter 4 readiness 59, got '||r.readiness;
 assert (select sum(readiness) from chapter_readiness where chapter_id<>4)=0,'untouched chapters stay 0';
 assert (select count(*) from chapter_readiness)=6,'6 chapters reported';
 raise notice 'PASS chapter readiness view (59 percent worked example, others 0)'; end $$;
do $$ declare c uuid; f int; begin
 select id,flaw_index into c,f from reasoning_cards limit 1;
 assert (select is_correct from submit_reasoning(c,f::smallint)),'right flaw -> true';
 assert not (select is_correct from submit_reasoning(c,((f+1)%2)::smallint)),'wrong flaw -> false';
 assert (select count(*) from reasoning_attempts)=2,'attempts logged';
 begin perform submit_reasoning(c,9::smallint); raise exception 'FAIL accepted bad option'; exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
 raise notice 'PASS Spot the Bug attempts validated server-side'; end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false) \gset
do $$ begin assert (select count(*) from mistake_vault)=1 and (select count(*) from coffee_sessions)=0,'A sees only own vault/coffee rows'; raise notice 'PASS RLS on vault and coffee'; end $$;
set role anon;
do $$ begin begin perform get_coffee(); raise exception 'FAIL anon ran get_coffee'; exception when insufficient_privilege then null; end; raise notice 'PASS anon blocked from coffee RPC'; end $$;
