create type event_type_enum  as enum ('Conversation', 'Celebration', 'Dance Party', 'Family Gathering', 'Shared Meal');
create type task_status      as enum ('not_started', 'in_progress', 'complete');
create type pillar           as enum ('guests', 'food', 'venue_decor', 'budget', 'other');
create type invitation_state as enum ('not_sent', 'sent');
create type rsvp_state       as enum ('pending', 'attending', 'declined');

create table event_type_templates (
  event_type                event_type_enum primary key,
  length_hours              integer not null,
  send_invites_days_before  integer not null,
  rsvp_deadline_days_before integer not null,
  food_menu                 text[] not null default '{}',
  drink_menu                text[] not null default '{}',
  dress_code                text,
  timeline                  text[] not null default '{}'
);

-- becomes template for invitation
create table events (
  id                uuid primary key default gen_random_uuid(),
  host_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  description       text,
  event_type        event_type_enum not null,
  start_time        timestamptz not null,
  end_time          timestamptz not null,
  address           text,
  rsvp_deadline     timestamptz,
  total_budget      numeric(10,2),
  additional_fields jsonb not null default '[]',  -- teammate's EventFields[] (custom fields)
  created_at        timestamptz not null default now(),
  check (end_time > start_time)
);

create table guests (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null references events(id) on delete cascade,
  family             text,
  name               text not null,
  plus_one_allowed   boolean not null default false,
  phone              text,
  email              text,
  invitation_status  invitation_state not null default 'not_sent',
  rsvp_status        rsvp_state not null default 'pending',
  plus_one_attending boolean,
  dietary_notes      text,
  note               text,
  created_at         timestamptz not null default now()
);

create table tasks (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references events(id) on delete cascade,
  pillar            pillar not null,
  title             text not null,
  status            task_status not null default 'not_started',
  assigned_guest_id uuid references guests(id) on delete set null,  -- NULL = host does it
  created_at        timestamptz not null default now()
);

create table invitations (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  guest_id   uuid not null unique references guests(id) on delete cascade,
  token      text not null unique default encode(gen_random_bytes(16), 'hex'),
  version    integer not null default 1,
  sent_at    timestamptz,
  responses  jsonb not null default '{}',  -- answers to custom guest questions
  created_at timestamptz not null default now()
);

-- When user adds custom budget items, they're stored here
create table budget_items (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  expense    text not null,
  budgeted   numeric(10,2) not null default 0,
  actual     numeric(10,2) not null default 0,
  paid       boolean not null default false,
  created_at timestamptz not null default now()
);

-- When user creates a budget, this template is used to populate budget_items
create table budget_template_items
insert into budget_template_items (expense, sort_order)
select expense, ordinality
from unnest(
  'Venue (Rental)', 'Venue (Security Deposit)', 'Event Insurance', 'Alcohol permit',
  'Parking', 'Cleaning', 'Decorations', 'Printing', 'Flowers', 'Lighting',
  'Chairs & Table', 'Centerpieces', 'Tableware', 'Food/Catering', 'Dessert',
  'Drinks', 'Photographer', 'Videographer', 'DJ', 'Contingency'
]) with ordinality as t(expense, ordinality);


create index on events (host_id);
create index on guests (event_id);
create index on tasks (event_id);
create index on tasks (assigned_guest_id);
create index on invitations (event_id);
create index on budget_items (event_id);