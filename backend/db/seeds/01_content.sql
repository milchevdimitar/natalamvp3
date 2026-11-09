-- Seed: daily gift content (en), taken from the demo in src/screens/Home.tsx
insert into content_items (kind, key, locale, title, body) values
  ('tarot',   'the_star',   'en', 'The Star', 'Renewed hope, clarity and trust in your path.'),
  ('tarot',   'the_moon',   'en', 'The Moon', 'Make room for intuition and the unknown.'),
  ('tarot',   'the_sun',    'en', 'The Sun',  'A moment of warmth and renewed confidence.'),
  ('fortune', 'fortune_001','en', 'Today''s message', 'A quiet choice today can open a surprising door tomorrow.'),
  ('fortune', 'fortune_002','en', 'Today''s message', 'Trust the small steps. They are taking you somewhere meaningful.'),
  ('fortune', 'fortune_003','en', 'Today''s message', 'You are allowed to grow beyond the version of yourself you once knew.'),
  ('sky',     'sky_001',    'en', 'Your sky today', 'A good day to slow down and listen before you act.'),
  ('sky',     'sky_002',    'en', 'Your sky today', 'Energy is high: start the thing you have been putting off.')
on conflict do nothing;
