-- Seed: three local test users (development only — never run in production).
-- Ana and Ben are dating-eligible and near each other in Bern; Cleo is not dating.
insert into users (id, email, email_verified_at) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@natala.local',  now()),
  ('00000000-0000-0000-0000-00000000000b', 'ben@natala.local',  now()),
  ('00000000-0000-0000-0000-00000000000c', 'cleo@natala.local', now())
on conflict do nothing;

insert into profiles (id, username, display_name, gender, locale, timezone) values
  ('00000000-0000-0000-0000-00000000000a', 'ana',  'Ana',  'woman', 'en', 'Europe/Zurich'),
  ('00000000-0000-0000-0000-00000000000b', 'ben',  'Ben',  'man',   'en', 'Europe/Zurich'),
  ('00000000-0000-0000-0000-00000000000c', 'cleo', 'Cleo', 'woman', 'bg', 'Europe/Sofia')
on conflict do nothing;

insert into notification_settings (user_id)
select id from users where email like '%@natala.local'
on conflict do nothing;

insert into birth_data (user_id, birth_date, birth_time, place_name, latitude, longitude) values
  ('00000000-0000-0000-0000-00000000000a', '1996-03-01', '14:30', 'Bern',  46.948, 7.447),
  ('00000000-0000-0000-0000-00000000000b', '1994-07-10', '08:15', 'Basel', 47.559, 7.588),
  ('00000000-0000-0000-0000-00000000000c', '1999-11-22', null,    'Sofia', 42.698, 23.322)
on conflict do nothing;

insert into consents (user_id, kind, version)
select u, k, '2026-11' from
  (values ('00000000-0000-0000-0000-00000000000a'::uuid), ('00000000-0000-0000-0000-00000000000b'::uuid)) as a(u),
  (values ('terms'), ('privacy'), ('dating_sensitive')) as b(k)
where not exists (select 1 from consents c where c.user_id = a.u and c.kind = b.k);

insert into dating_profiles (user_id, is_active, seeking, location) values
  ('00000000-0000-0000-0000-00000000000a', true, '{man}',   'SRID=4326;POINT(7.44 46.95)'),
  ('00000000-0000-0000-0000-00000000000b', true, '{woman}', 'SRID=4326;POINT(7.46 46.94)')
on conflict do nothing;
