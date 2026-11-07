insert into event_type_templates
  (event_type, length_hours, send_invites_days_before, rsvp_deadline_days_before, food_menu, drink_menu, dress_code, timeline)
values
  ('Conversation', 2, 14, 3,
    '{"Hors d''oeuvres"}',
    '{"Coffee/Tea","Soda","Water","Cocktail"}',
    'Casual',
    '{"Set up","Arrival","Mingle","Wind Down","Tear Down"}'),
  ('Celebration', 4, 42, 14,
    '{"Hors d''oeuvres","Main Course","Dessert"}',
    '{"Cocktail","Mocktail","Soda","Water"}',
    'Theme or Semi-formal',
    '{"Set up","Arrival","Build","Peak","Wind down","Tear Down"}'),
  ('Dance Party', 5, 28, 7,
    '{"Hors d''oeuvres"}',
    '{"Cocktail","Mocktail","Soda","Water"}',
    'Theme',
    '{"Set up","Arrival","Build","Peak","Wind down","Tear Down"}'),
  ('Family Gathering', 6, 28, 14,
    '{"Hors d''oeuvres","Main Course","Dessert"}',
    '{"Cocktail","Soda","Juice","Water"}',
    'Casual',
    '{"Set up","Arrival","Meal time","Wind Down","Tear Down"}'),
  ('Shared Meal', 3, 21, 7,
    '{"Hors d''oeuvres","Main Course","Dessert"}',
    '{"Cocktail","Soda","Juice","Water"}',
    'Semi-formal',
    '{"Set up","Arrival","Meal time","Wind Down","Tear Down"}')
on conflict (event_type) do nothing;