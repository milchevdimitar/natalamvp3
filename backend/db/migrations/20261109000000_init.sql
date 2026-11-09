-- migrate:up
-- =============================================================================
-- NATALA — initial schema
-- Target: PostgreSQL 16 + PostGIS (AWS RDS / Aurora PostgreSQL, eu-central-1).
-- Applied with dbmate. Query types generated with kysely-codegen.
--
-- Responsibility split:
--   * The API (NestJS) owns authentication and authorization: every query is
--     scoped to the signed-in user in the service layer.
--   * The database owns INVARIANTS that must hold no matter which service or
--     script writes: one match per pair, 18+ for dating, blocks cut contact,
--     deterministic daily draws, server-side test scoring.
--   * Side effects (push, chart computation, compatibility) are emitted to the
--     `outbox` table in the same transaction and processed by workers.
-- =============================================================================

create extension if not exists citext;
create extension if not exists postgis;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type gender            as enum ('woman', 'man', 'nonbinary', 'other');
create type visibility        as enum ('private', 'friends', 'public');
create type system_status     as enum ('ready', 'soon', 'profile');
create type daily_kind        as enum ('tarot', 'fortune', 'sky');
create type friendship_status as enum ('pending', 'accepted');
create type swipe_action      as enum ('pass', 'like', 'superlike');
create type conversation_kind as enum ('direct', 'group');
create type message_kind      as enum ('text', 'image', 'share', 'system');
create type report_status     as enum ('open', 'reviewing', 'actioned', 'dismissed');
create type sub_status        as enum ('active', 'grace', 'cancelled', 'expired');
create type user_status       as enum ('active', 'suspended', 'deleted');
create type auth_provider     as enum ('apple', 'google', 'email');

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- =============================================================================
-- 0. OUTBOX — reliable hand-off from DB transactions to background workers
-- =============================================================================
-- A relay worker reads unprocessed rows (FOR UPDATE SKIP LOCKED), enqueues
-- BullMQ jobs, then sets processed_at. Same transaction as the change = no lost
-- or phantom events.
create table outbox (
  id            bigint generated always as identity primary key,
  topic         text not null,          -- 'match.created', 'birth_data.changed', ...
  aggregate_id  uuid,
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  processed_at  timestamptz,
  attempts      int not null default 0
);
create index outbox_pending_idx on outbox (id) where processed_at is null;

create or replace function emit(p_topic text, p_aggregate uuid, p_payload jsonb)
returns void language sql as $$
  insert into outbox (topic, aggregate_id, payload) values (p_topic, p_aggregate, p_payload);
$$;

-- =============================================================================
-- 1. ACCOUNTS & AUTH (owned by the API's auth module)
-- =============================================================================
create table users (
  id                 uuid primary key default gen_random_uuid(),
  email              citext unique,
  email_verified_at  timestamptz,
  status             user_status not null default 'active',
  is_admin           boolean not null default false,
  created_at         timestamptz not null default now(),
  last_seen_at       timestamptz,
  deleted_at         timestamptz
);

-- Sign in with Apple / Google / email one-time code. One user, many identities.
create table auth_identities (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users (id) on delete cascade,
  provider          auth_provider not null,
  provider_subject  text not null,       -- Apple/Google `sub`, or the email
  created_at        timestamptz not null default now(),
  unique (provider, provider_subject)
);
create index auth_identities_user_idx on auth_identities (user_id);

-- Refresh-token sessions. Access tokens are short-lived JWTs (15 min) and are
-- never stored. Refresh tokens rotate on every use; only a hash is kept.
create table sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references users (id) on delete cascade,
  refresh_token_hash   bytea not null unique,
  device_name          text,
  platform             text check (platform in ('ios', 'android', 'web')),
  created_at           timestamptz not null default now(),
  last_used_at         timestamptz not null default now(),
  expires_at           timestamptz not null,
  revoked_at           timestamptz
);
create index sessions_user_idx on sessions (user_id) where revoked_at is null;

-- =============================================================================
-- 2. PROFILE & PERSONAL DATA
-- =============================================================================
create table profiles (
  id                       uuid primary key references users (id) on delete cascade,
  username                 citext unique check (username ~ '^[a-z0-9_.]{3,24}$'),
  display_name             text not null check (char_length(display_name) between 1 and 50),
  bio                      text check (char_length(bio) <= 300),
  avatar_key               text,                       -- S3 key: avatars/{uid}/...
  gender                   gender,
  locale                   text not null default 'en',
  timezone                 text not null default 'UTC', -- IANA; drives "today"
  invite_code              text not null unique
                             default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  onboarding_completed_at  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Most sensitive data besides chat. Never returned to anyone but the owner.
create table birth_data (
  user_id            uuid primary key references users (id) on delete cascade,
  birth_date         date not null check (birth_date > date '1900-01-01'),
  birth_time         time,                -- null = unknown (no houses / rising)
  place_name         text,
  latitude           double precision check (latitude  between -90  and 90),
  longitude          double precision check (longitude between -180 and 180),
  tz_name            text,                -- IANA zone of birthplace (resolved by worker)
  birth_instant_utc  timestamptz,         -- resolved incl. historical DST
  updated_at         timestamptz not null default now()
);
create trigger birth_data_updated_at before update on birth_data
  for each row execute function set_updated_at();

create or replace function birth_data_changed()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT'
     or (new.birth_date, new.birth_time, new.latitude, new.longitude)
        is distinct from (old.birth_date, old.birth_time, old.latitude, old.longitude) then
    perform emit('birth_data.changed', new.user_id, '{}'::jsonb);
  end if;
  return new;
end $$;
create trigger birth_data_emit after insert or update on birth_data
  for each row execute function birth_data_changed();

create table consents (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references users (id) on delete cascade,
  kind        text not null check (kind in
                ('terms', 'privacy', 'dating_sensitive', 'health_lens', 'marketing', 'push')),
  version     text not null,
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
create index consents_user_kind_idx on consents (user_id, kind);

create table notification_settings (
  user_id        uuid primary key references users (id) on delete cascade,
  messages       boolean not null default true,
  matches        boolean not null default true,
  friend_events  boolean not null default true,
  daily_gift     boolean not null default true,
  quiet_from     time,
  quiet_to       time
);

create table push_tokens (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references users (id) on delete cascade,
  token         text not null unique,       -- Expo push token
  platform      text not null check (platform in ('ios', 'android', 'web')),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);
create index push_tokens_user_idx on push_tokens (user_id);

-- =============================================================================
-- 3. DISCOVERY SYSTEMS
-- =============================================================================
create table systems (
  key               text primary key,
  name              text not null,
  icon              text,
  description       text,
  status            system_status not null default 'soon',
  requires_consent  text,
  sort_order        int not null default 0
);

create table system_results (
  user_id      uuid not null references users (id) on delete cascade,
  system_key   text not null references systems (key),
  summary      text not null,               -- 'INFP', 'Scorpio ☉ · Pisces ☾ · Leo ↑'
  data         jsonb not null default '{}'::jsonb,
  source       text not null check (source in ('test', 'computed', 'self_reported')),
  visibility   visibility not null default 'friends',
  computed_at  timestamptz not null default now(),
  primary key (user_id, system_key)
);

create table natal_charts (
  user_id         uuid primary key references users (id) on delete cascade,
  engine_version  text not null,
  house_system    text not null default 'placidus',
  sun_sign        text not null,
  moon_sign       text,
  rising_sign     text,
  ascendant       numeric(7, 4),
  midheaven       numeric(7, 4),
  planets         jsonb not null,
  houses          jsonb,
  aspects         jsonb,
  computed_at     timestamptz not null default now()
);

create table test_definitions (
  id          uuid primary key default gen_random_uuid(),
  system_key  text not null references systems (key),
  version     int  not null,
  locale      text not null,
  title         text not null,
  scale_points  smallint not null default 7 check (scale_points in (5, 7)),  -- Likert 1..N
  is_active     boolean not null default true,
  unique (system_key, version, locale)
);

create table test_questions (
  id         uuid primary key default gen_random_uuid(),
  test_id    uuid not null references test_definitions (id) on delete cascade,
  position   int  not null,
  text       text not null,
  dimension  text not null,
  direction  smallint not null check (direction in (-1, 1)),
  unique (test_id, position)
);

create table test_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users (id) on delete cascade,
  test_id       uuid not null references test_definitions (id),
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  result        jsonb
);
create index test_attempts_user_idx on test_attempts (user_id, started_at desc);

create table test_answers (
  attempt_id   uuid not null references test_attempts (id) on delete cascade,
  question_id  uuid not null references test_questions (id),
  value        smallint not null check (value between 1 and 7),  -- capped per test at scoring
  answered_at  timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

-- =============================================================================
-- 4. DAILY GIFTS & STREAKS
-- =============================================================================
create table content_items (
  id      uuid primary key default gen_random_uuid(),
  kind    daily_kind not null,
  key     text not null,
  locale  text not null,
  title   text not null,
  body    text not null,
  meta    jsonb not null default '{}'::jsonb,
  active  boolean not null default true,
  unique (kind, key, locale)
);

create table daily_draws (
  user_id          uuid not null references users (id) on delete cascade,
  draw_date        date not null,
  kind             daily_kind not null,
  content_item_id  uuid not null references content_items (id),
  revealed_at      timestamptz not null default now(),
  shared_at        timestamptz,
  primary key (user_id, draw_date, kind)
);

create table streaks (
  user_id           uuid primary key references users (id) on delete cascade,
  current_streak    int  not null default 0,
  longest_streak    int  not null default 0,
  last_active_date  date
);

-- =============================================================================
-- 5. SOCIAL GRAPH & SAFETY
-- =============================================================================
create table friendships (
  user_low      uuid not null references users (id) on delete cascade,
  user_high     uuid not null references users (id) on delete cascade,
  requested_by  uuid not null,
  status        friendship_status not null default 'pending',
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  primary key (user_low, user_high),
  check (user_low < user_high),
  check (requested_by in (user_low, user_high))
);
create index friendships_high_idx on friendships (user_high);

create table blocks (
  blocker_id  uuid not null references users (id) on delete cascade,
  blocked_id  uuid not null references users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on blocks (blocked_id);

create table reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid references users (id) on delete set null,
  target_user_id  uuid references users (id) on delete set null,
  target_kind     text not null check (target_kind in ('user', 'message', 'story')),
  target_id       text,
  reason          text not null check (reason in
                    ('spam', 'harassment', 'fake_profile', 'underage', 'inappropriate', 'other')),
  details         text check (char_length(details) <= 2000),
  status          report_status not null default 'open',
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  resolved_by     uuid references users (id) on delete set null
);
create index reports_status_idx on reports (status, created_at);

create or replace function is_blocked(a uuid, b uuid)
returns boolean language sql stable as $$
  select exists (select 1 from blocks
                  where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

create or replace function are_friends(a uuid, b uuid)
returns boolean language sql stable as $$
  select exists (select 1 from friendships
                  where user_low = least(a, b) and user_high = greatest(a, b) and status = 'accepted');
$$;

create or replace function friendship_emit()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    perform emit('friend.requested', new.requested_by,
                 jsonb_build_object('low', new.user_low, 'high', new.user_high));
  elsif new.status = 'accepted' and old.status = 'pending' then
    perform emit('friend.accepted', new.requested_by,
                 jsonb_build_object('low', new.user_low, 'high', new.user_high));
  end if;
  return new;
end $$;
create trigger friendships_emit after insert or update on friendships
  for each row execute function friendship_emit();

-- =============================================================================
-- 6. DATING
-- =============================================================================
create table dating_profiles (
  user_id              uuid primary key references users (id) on delete cascade,
  is_active            boolean not null default false,
  seeking              gender[] not null default '{}',
  age_min              int not null default 18 check (age_min >= 18),
  age_max              int not null default 99 check (age_max >= age_min),
  max_distance_km      int not null default 50 check (max_distance_km between 1 and 20000),
  location             geography(point, 4326),   -- rounded to ~1 km on device
  location_updated_at  timestamptz,
  prompts              jsonb not null default '[]'::jsonb,
  lens_weights         jsonb not null default '{}'::jsonb,
  updated_at           timestamptz not null default now()
);
create index dating_profiles_location_idx on dating_profiles using gist (location);
create index dating_profiles_active_idx   on dating_profiles (is_active) where is_active;
create trigger dating_profiles_updated_at before update on dating_profiles
  for each row execute function set_updated_at();

create or replace function check_dating_eligibility()
returns trigger language plpgsql as $$
begin
  if new.is_active then
    if not exists (select 1 from birth_data
                    where user_id = new.user_id
                      and birth_date <= (current_date - interval '18 years')) then
      raise exception 'dating requires a verified age of 18+' using errcode = 'P0001';
    end if;
    if not exists (select 1 from consents
                    where user_id = new.user_id and kind = 'dating_sensitive' and revoked_at is null) then
      raise exception 'dating requires consent' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
create trigger dating_profiles_eligibility before insert or update on dating_profiles
  for each row execute function check_dating_eligibility();

create table swipes (
  swiper_id   uuid not null references users (id) on delete cascade,
  target_id   uuid not null references users (id) on delete cascade,
  action      swipe_action not null,
  created_at  timestamptz not null default now(),
  primary key (swiper_id, target_id),
  check (swiper_id <> target_id)
);
create index swipes_target_idx on swipes (target_id, action);

create table compatibility (
  user_low        uuid not null references users (id) on delete cascade,
  user_high       uuid not null references users (id) on delete cascade,
  score           numeric(5, 2) not null check (score between 0 and 100),
  breakdown       jsonb not null default '{}'::jsonb,
  engine_version  text not null,
  computed_at     timestamptz not null default now(),
  primary key (user_low, user_high),
  check (user_low < user_high)
);

-- =============================================================================
-- 7. CHAT
-- =============================================================================
create table conversations (
  id               uuid primary key default gen_random_uuid(),
  kind             conversation_kind not null,
  direct_key       text unique,
  title            text,
  created_by       uuid references users (id) on delete set null,
  created_at       timestamptz not null default now(),
  last_message_at  timestamptz,
  check ((kind = 'direct') = (direct_key is not null))
);

create table conversation_members (
  conversation_id    uuid not null references conversations (id) on delete cascade,
  user_id            uuid not null references users (id) on delete cascade,
  role               text not null default 'member' check (role in ('member', 'admin')),
  joined_at          timestamptz not null default now(),
  last_read_message  bigint,
  muted_until        timestamptz,
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on conversation_members (user_id);

-- bigint ids: compact index, natural ordering, simple cursor pagination
-- ("WHERE conversation_id = $1 AND id < $cursor ORDER BY id DESC LIMIT 50").
-- When this table nears ~100M rows, range-partition by id or created_at.
create table messages (
  id               bigint generated always as identity primary key,
  conversation_id  uuid not null references conversations (id) on delete cascade,
  sender_id        uuid references users (id) on delete set null,
  client_id        uuid,                       -- idempotency key from the device
  kind             message_kind not null default 'text',
  body             text check (char_length(body) <= 4000),
  payload          jsonb,
  created_at       timestamptz not null default now(),
  edited_at        timestamptz,
  deleted_at       timestamptz,
  unique (sender_id, client_id)
);
create index messages_conversation_idx on messages (conversation_id, id desc);

create table matches (
  id               uuid primary key default gen_random_uuid(),
  user_low         uuid not null references users (id) on delete cascade,
  user_high        uuid not null references users (id) on delete cascade,
  conversation_id  uuid references conversations (id) on delete set null,
  created_at       timestamptz not null default now(),
  unmatched_at     timestamptz,
  unmatched_by     uuid,
  unique (user_low, user_high),
  check (user_low < user_high)
);
create index matches_high_idx on matches (user_high);

create or replace function are_matched(a uuid, b uuid)
returns boolean language sql stable as $$
  select exists (select 1 from matches
                  where user_low = least(a, b) and user_high = greatest(a, b) and unmatched_at is null);
$$;

create or replace function is_conversation_member(conv uuid, uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from conversation_members where conversation_id = conv and user_id = uid);
$$;

create or replace function ensure_direct_conversation(a uuid, b uuid)
returns uuid language plpgsql as $$
declare
  v_key text := least(a, b)::text || ':' || greatest(a, b)::text;
  v_id  uuid;
begin
  insert into conversations (kind, direct_key, created_by)
  values ('direct', v_key, a)
  on conflict (direct_key) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from conversations where direct_key = v_key;
  end if;
  insert into conversation_members (conversation_id, user_id)
  values (v_id, a), (v_id, b) on conflict do nothing;
  return v_id;
end $$;

-- Mutual like → match + conversation + event.
create or replace function handle_swipe()
returns trigger language plpgsql as $$
declare v_match uuid; v_conv uuid;
begin
  if new.action in ('like', 'superlike')
     and not is_blocked(new.swiper_id, new.target_id)
     and exists (select 1 from swipes
                  where swiper_id = new.target_id and target_id = new.swiper_id
                    and action in ('like', 'superlike'))
  then
    insert into matches (user_low, user_high)
    values (least(new.swiper_id, new.target_id), greatest(new.swiper_id, new.target_id))
    on conflict (user_low, user_high) do nothing
    returning id into v_match;

    if v_match is not null then
      v_conv := ensure_direct_conversation(new.swiper_id, new.target_id);
      update matches set conversation_id = v_conv where id = v_match;
      perform emit('match.created', v_match,
                   jsonb_build_object('users', jsonb_build_array(new.swiper_id, new.target_id),
                                      'conversation_id', v_conv));
    end if;
  end if;
  return new;
end $$;
create trigger swipes_after_insert after insert on swipes
  for each row execute function handle_swipe();

-- Blocking tears down friendship + match.
create or replace function handle_block()
returns trigger language plpgsql as $$
begin
  delete from friendships
   where user_low = least(new.blocker_id, new.blocked_id)
     and user_high = greatest(new.blocker_id, new.blocked_id);
  update matches set unmatched_at = now(), unmatched_by = new.blocker_id
   where user_low = least(new.blocker_id, new.blocked_id)
     and user_high = greatest(new.blocker_id, new.blocked_id)
     and unmatched_at is null;
  return new;
end $$;
create trigger blocks_after_insert after insert on blocks
  for each row execute function handle_block();

-- No messages into a chat with someone who blocked you; bump recency.
-- (Fan-out to sockets/push is done by the API via Redis, not the outbox:
--  chat needs millisecond latency.)
create or replace function before_message_insert()
returns trigger language plpgsql as $$
begin
  if not is_conversation_member(new.conversation_id, new.sender_id) then
    raise exception 'not a member' using errcode = 'P0001';
  end if;
  if exists (select 1 from conversation_members m
              where m.conversation_id = new.conversation_id
                and m.user_id <> new.sender_id
                and is_blocked(m.user_id, new.sender_id)) then
    raise exception 'cannot message this user' using errcode = 'P0001';
  end if;
  return new;
end $$;
create or replace function after_message_insert()
returns trigger language plpgsql as $$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end $$;
create trigger messages_before_insert before insert on messages
  for each row execute function before_message_insert();
create trigger messages_after_insert after insert on messages
  for each row execute function after_message_insert();

-- =============================================================================
-- 8. STORIES
-- =============================================================================
create table stories (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references users (id) on delete cascade,
  kind        text not null,
  title       text not null check (char_length(title) <= 80),
  body        text check (char_length(body) <= 500),
  payload     jsonb not null default '{}'::jsonb,
  media_key   text,                         -- S3 key: stories/{uid}/...
  visibility  visibility not null default 'friends' check (visibility in ('friends', 'public')),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '24 hours'
);
create index stories_author_idx  on stories (author_id, created_at desc);
create index stories_expires_idx on stories (expires_at);

create table story_views (
  story_id   uuid not null references stories (id) on delete cascade,
  viewer_id  uuid not null references users (id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

-- =============================================================================
-- 9. MONETISATION
-- =============================================================================
create table subscriptions (
  user_id             uuid primary key references users (id) on delete cascade,
  entitlement         text not null default 'premium',
  status              sub_status not null,
  store               text check (store in ('app_store', 'play_store', 'stripe', 'promo')),
  product_id          text,
  current_period_end  timestamptz,
  raw_event           jsonb,
  updated_at          timestamptz not null default now()
);

create or replace function is_premium(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from subscriptions
                  where user_id = uid and status in ('active', 'grace')
                    and (current_period_end is null or current_period_end > now()));
$$;

-- =============================================================================
-- 10. DOMAIN FUNCTIONS (called by the API with the authenticated user's id)
-- =============================================================================

-- Daily gift: deterministic per user + local day; cannot be re-rolled.
create or replace function open_daily_gift(p_user uuid, p_kind daily_kind)
returns content_items language plpgsql as $$
declare
  v_tz text; v_locale text; v_today date; v_count int; v_item content_items;
begin
  select timezone, locale into v_tz, v_locale from profiles where id = p_user;
  if not found then raise exception 'profile not found'; end if;
  v_today := (now() at time zone coalesce(v_tz, 'UTC'))::date;

  select ci.* into v_item
    from daily_draws d join content_items ci on ci.id = d.content_item_id
   where d.user_id = p_user and d.draw_date = v_today and d.kind = p_kind;
  if found then return v_item; end if;

  select count(*) into v_count from content_items where kind = p_kind and locale = v_locale and active;
  if v_count = 0 then
    v_locale := 'en';
    select count(*) into v_count from content_items where kind = p_kind and locale = v_locale and active;
  end if;
  if v_count = 0 then raise exception 'no content for %', p_kind; end if;

  select * into v_item from content_items
   where kind = p_kind and locale = v_locale and active
   order by key
  offset ((hashtext(p_user::text || v_today::text || p_kind::text)::bigint % v_count) + v_count) % v_count
   limit 1;

  insert into daily_draws (user_id, draw_date, kind, content_item_id)
  values (p_user, v_today, p_kind, v_item.id) on conflict do nothing;

  insert into streaks as s (user_id, current_streak, longest_streak, last_active_date)
  values (p_user, 1, 1, v_today)
  on conflict (user_id) do update set
    current_streak = case when s.last_active_date = v_today     then s.current_streak
                          when s.last_active_date = v_today - 1 then s.current_streak + 1
                          else 1 end,
    longest_streak = greatest(s.longest_streak,
                     case when s.last_active_date = v_today     then s.current_streak
                          when s.last_active_date = v_today - 1 then s.current_streak + 1
                          else 1 end),
    last_active_date = v_today;

  return v_item;
end $$;

-- Score an MBTI-style attempt and publish the result.
create or replace function complete_test_attempt(p_user uuid, p_attempt uuid)
returns jsonb language plpgsql as $$
declare
  v_test uuid; v_system text; v_scale int; v_missing int; v_type text; v_dims jsonb; v_result jsonb;
begin
  select a.test_id, t.system_key, t.scale_points into v_test, v_system, v_scale
    from test_attempts a join test_definitions t on t.id = a.test_id
   where a.id = p_attempt and a.user_id = p_user and a.completed_at is null
   for update of a;
  if v_test is null then raise exception 'attempt not found'; end if;

  select count(*) into v_missing from test_questions q
   where q.test_id = v_test
     and not exists (select 1 from test_answers x where x.attempt_id = p_attempt and x.question_id = q.id);
  if v_missing > 0 then raise exception '% questions unanswered', v_missing using errcode = 'P0001'; end if;
  if exists (select 1 from test_answers where attempt_id = p_attempt and value > v_scale) then
    raise exception 'answers must be between 1 and %', v_scale using errcode = 'P0001';
  end if;

  -- Each answer counts (value - midpoint) toward the first letter of its
  -- dimension (E, S, T, J) when direction = 1, toward the second when -1.
  -- pct = share toward the first letter, 0..100.
  with scores as (
    select q.dimension,
           sum(q.direction * (a.value - (v_scale + 1) / 2.0)) as score,
           count(*) * (v_scale - 1) / 2.0                      as max_score
      from test_answers a join test_questions q on q.id = a.question_id
     where a.attempt_id = p_attempt and q.test_id = v_test
     group by q.dimension
  )
  select string_agg(case when score >= 0 then left(dimension, 1) else right(dimension, 1) end, ''
                    order by array_position(array['EI','SN','TF','JP'], dimension)),
         jsonb_object_agg(dimension, jsonb_build_object('score', round(score, 1),
                          'pct', round(50 + 50 * score / max_score)::int))
    into v_type, v_dims
    from scores;

  v_result := jsonb_build_object('type', v_type, 'dimensions', v_dims);
  update test_attempts set completed_at = now(), result = v_result where id = p_attempt;

  insert into system_results (user_id, system_key, summary, data, source)
  values (p_user, v_system, v_type, v_result, 'test')
  on conflict (user_id, system_key) do update
    set summary = excluded.summary, data = excluded.data, computed_at = now();

  perform emit('system_result.changed', p_user, jsonb_build_object('system', v_system));
  return v_result;
end $$;

-- Friend request by QR / invite code; auto-accepts a pending reverse request.
create or replace function request_friend(p_user uuid, p_invite_code text)
returns friendship_status language plpgsql as $$
declare v_other uuid; v_row friendships;
begin
  select id into v_other from profiles where invite_code = p_invite_code;
  if v_other is null or v_other = p_user or is_blocked(p_user, v_other) then
    raise exception 'invalid code' using errcode = 'P0001';
  end if;

  select * into v_row from friendships
   where user_low = least(p_user, v_other) and user_high = greatest(p_user, v_other)
   for update;

  if not found then
    insert into friendships (user_low, user_high, requested_by)
    values (least(p_user, v_other), greatest(p_user, v_other), p_user);
    return 'pending';
  elsif v_row.status = 'pending' and v_row.requested_by <> p_user then
    update friendships set status = 'accepted', accepted_at = now()
     where user_low = v_row.user_low and user_high = v_row.user_high;
    return 'accepted';
  end if;
  return v_row.status;
end $$;

-- Open (or create) a 1:1 chat between friends or active matches.
create or replace function start_direct_chat(p_user uuid, p_other uuid)
returns uuid language plpgsql as $$
begin
  if p_other = p_user or is_blocked(p_user, p_other)
     or not (are_friends(p_user, p_other) or are_matched(p_user, p_other)) then
    raise exception 'not allowed' using errcode = 'P0001';
  end if;
  return ensure_direct_conversation(p_user, p_other);
end $$;

-- Discovery feed. Lens summaries with visibility 'friends' or 'public' are
-- shown on dating cards; only 'private' hides them.
create or replace function discovery_feed(p_user uuid, p_limit int default 20)
returns table (user_id uuid, display_name text, avatar_key text, age int,
               distance_km int, astrology text, mbti text, score numeric)
language sql stable as $$
  with me as (
    select dp.*, p.gender as my_gender, extract(year from age(b.birth_date))::int as my_age
      from dating_profiles dp
      join profiles p   on p.id = dp.user_id
      join birth_data b on b.user_id = dp.user_id
     where dp.user_id = p_user and dp.is_active
  )
  select c.user_id, p.display_name, p.avatar_key,
         extract(year from age(b.birth_date))::int,
         case when me.location is not null and c.location is not null
              then round(st_distance(me.location, c.location) / 1000)::int end,
         sa.summary, sm.summary, coalesce(cp.score, 50)
    from me
    join dating_profiles c on c.is_active and c.user_id <> me.user_id
    join users u           on u.id = c.user_id and u.status = 'active'
    join profiles p        on p.id = c.user_id
    join birth_data b      on b.user_id = c.user_id
    left join system_results sa on sa.user_id = c.user_id and sa.system_key = 'astrology' and sa.visibility <> 'private'
    left join system_results sm on sm.user_id = c.user_id and sm.system_key = 'mbti'      and sm.visibility <> 'private'
    left join compatibility cp  on cp.user_low = least(me.user_id, c.user_id)
                               and cp.user_high = greatest(me.user_id, c.user_id)
   where p.gender = any (me.seeking)
     and me.my_gender = any (c.seeking)
     and extract(year from age(b.birth_date)) between me.age_min and me.age_max
     and me.my_age between c.age_min and c.age_max
     and (me.location is null or c.location is null
          or st_dwithin(me.location, c.location, me.max_distance_km * 1000))
     and not exists (select 1 from swipes s where s.swiper_id = me.user_id and s.target_id = c.user_id)
     and not is_blocked(me.user_id, c.user_id)
   order by coalesce(cp.score, 50) desc, random()
   limit least(greatest(p_limit, 1), 50);
$$;

-- =============================================================================
-- 11. SEED: system catalogue (matches src/data/demo.ts)
-- =============================================================================
insert into systems (key, name, icon, description, status, requires_consent, sort_order) values
  ('mbti',         'MBTI',         '◈', 'Personality preferences, communication and decision-making.',       'ready',   null,          1),
  ('astrology',    'Astrology',    '☉', 'Birth chart patterns, archetypes and life themes.',                 'ready',   null,          2),
  ('numerology',   'Numerology',   '⑦', 'Number symbolism and recurring personal themes.',                   'ready',   null,          3),
  ('cardology',    'Cardology',    '◇', 'Card-based reflection and archetypal exploration.',                 'soon',    null,          4),
  ('tarot',        'Tarot',        '♠', 'Daily archetypes, reflection prompts and symbolic card patterns.',  'ready',   null,          5),
  ('blood_group',  'Blood Group',  '◉', 'An optional discovery lens based on personal profile data.',        'profile', 'health_lens', 6),
  ('ayurveda',     'Ayurveda',     '☯', 'Dosha-inspired reflection around energy and balance.',              'ready',   null,          7),
  ('elements',     'Elements',     '◌', 'Air, Water, Fire and Earth as a personal archetype map.',           'ready',   null,          8),
  ('enneagram',    'Enneagram',    '△', 'Motivations, patterns and growth edges.',                           'soon',    null,          9),
  ('human_design', 'Human Design', '✧', 'A symbolic system for energy and decision-making.',                 'soon',    null,         10);

-- migrate:down
-- Initial migration: recreate the database instead of rolling back.
