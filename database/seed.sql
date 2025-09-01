BEGIN;

-- Optional: start clean (will also remove RSVPs via CASCADE)
TRUNCATE TABLE events CASCADE;

-- -----------------------------
-- Seed 100 events
-- -----------------------------
WITH params AS (
  SELECT
    ARRAY[
      'Budapest', 'Berlin', 'Paris', 'Madrid', 'Rome', 'Vienna', 'Prague',
      'Warsaw', 'Amsterdam', 'Lisbon', 'Copenhagen', 'Dublin', 'Athens',
      'Zurich', 'Helsinki', 'Oslo', 'Stockholm', 'Brussels', 'Munich', 'Milan'
    ]::text[]         AS cities,
    ARRAY['Hall','Park','Rooftop','Auditorium','Conference Center','Café','Online']::text[] AS venues,
    ARRAY['Tech Talk','Meetup','Workshop','Concert','Yoga','Brunch','Game Night','Hackathon','Book Club','Networking']::text[] AS themes
),
to_insert AS (
  SELECT
    -- 8-char ID (hex)
    LEFT(ENCODE(gen_random_bytes(4), 'hex'), 8)                                    AS id,
    -- Make varied names by mixing a theme and city
    (SELECT themes[(gs % array_length(themes,1)) + 1] FROM params) || ' @ ' ||
    (SELECT cities[(gs % array_length(cities,1)) + 1] FROM params)                 AS name,
    -- Spread dates across past and future (centered around today)
    (CURRENT_DATE + (gs - 50))::date                                               AS date,
    -- Varied times: between 08:00 and 19:xx
    make_time( (8 + (gs % 12))::int, (gs*7 % 60)::int, 0)::time                    AS time,
    -- City + venue
    (SELECT cities[(gs % array_length(cities,1)) + 1] FROM params) || ' ' ||
    (SELECT venues[(gs % array_length(venues,1)) + 1] FROM params)                 AS location,
    -- Alternate types
    CASE WHEN gs % 2 = 0 THEN 'limited' ELSE 'unlimited' END                       AS type,
    -- Only set attendee_limit for limited events
    CASE WHEN gs % 2 = 0 THEN 10 + (gs % 40) ELSE NULL END                         AS attendee_limit,
    -- Rotate through 20 user_ids
    'user_' || ((gs % 20) + 1)::text                                               AS user_id,
    -- Mix public/private
    CASE WHEN gs % 3 = 0 THEN 'private' ELSE 'public' END                          AS visibility
  FROM generate_series(1, 100) AS gs
)
INSERT INTO events (id, name, date, time, location, type, attendee_limit, user_id, visibility, created_at, updated_at)
SELECT id, name, date, time, location, type, attendee_limit, user_id, visibility, NOW(), NOW()
FROM to_insert;

-- -----------------------------
-- Seed RSVPs
--   - For limited events: 0..attendee_limit attendees
--   - For unlimited events: 0..75 attendees
-- -----------------------------
WITH ev AS (
  SELECT e.id, e.type, e.attendee_limit
  FROM events e
),
counts AS (
  SELECT
    id,
    type,
    attendee_limit,
    CASE
      WHEN type = 'limited'   THEN GREATEST(0, LEAST(attendee_limit, FLOOR(random() * (COALESCE(attendee_limit,0) + 1))::int))
      ELSE FLOOR(random() * 76)::int
    END AS rsvp_count
  FROM ev
)
INSERT INTO rsvps (event_id, name, user_id, created_at, updated_at)
SELECT
  c.id AS event_id,
  'Attendee ' || c.id || '-' || g AS name,
  -- distribute user_ids across 200 synthetic users, deterministically mixed per event
  'user_' || ((ABS(HASHTEXT(c.id)) + g) % 200 + 1)::text AS user_id,
  NOW(), NOW()
FROM counts c
JOIN LATERAL generate_series(1, c.rsvp_count) AS g ON TRUE;

COMMIT;