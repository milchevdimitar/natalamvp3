-- Smoke test against the seeded local database:
--   docker compose exec -T postgres psql -U natala -d natala -f - < db/smoke_test.sql
-- Runs in a transaction and rolls back, so it leaves the data untouched.
\set ON_ERROR_STOP 1
begin;

\echo '1. Daily gift is the same on every open'
select (open_daily_gift('00000000-0000-0000-0000-00000000000a', 'tarot')).title as first_open,
       (open_daily_gift('00000000-0000-0000-0000-00000000000a', 'tarot')).title as second_open;

\echo '2. MBTI: Cleo answers all 40 questions and gets a type'
insert into test_attempts (id, user_id, test_id)
values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000c',
        '00000000-0000-0000-0000-0000000000b1');
insert into test_answers (attempt_id, question_id, value)
select '00000000-0000-0000-0000-0000000000f1', id, 1 + (position % 5) from test_questions
 where test_id = '00000000-0000-0000-0000-0000000000b1';
select complete_test_attempt('00000000-0000-0000-0000-00000000000c',
                             '00000000-0000-0000-0000-0000000000f1') ->> 'type' as mbti_type;

\echo '3. Ben sees Ana in his discovery feed'
select display_name, age, distance_km from discovery_feed('00000000-0000-0000-0000-00000000000b');

\echo '4. Mutual like creates a match, a chat and an outbox event'
insert into swipes values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', 'like');
insert into swipes values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b', 'like');
select (select count(*) from matches) as matches,
       (select count(*) from outbox where topic = 'match.created') as match_events;

\echo '5. Friend request by invite code, accepted from the other side'
select request_friend('00000000-0000-0000-0000-00000000000c',
                      (select invite_code from profiles where username = 'ana')) as cleo_to_ana,
       request_friend('00000000-0000-0000-0000-00000000000a',
                      (select invite_code from profiles where username = 'cleo')) as ana_to_cleo;

rollback;
\echo 'All smoke checks ran (changes rolled back).'
