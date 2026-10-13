CREATE TYPE event_category AS ENUM ('Music', 'Workshop', 'Food', 'Sports', 'Kids');
CREATE TYPE user_role AS ENUM ('member', 'admin');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_normalized CHECK (email = LOWER(BTRIM(email)))
);

CREATE UNIQUE INDEX users_email_unique ON users (email);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_key TEXT UNIQUE,
  title TEXT NOT NULL CHECK (LENGTH(BTRIM(title)) BETWEEN 3 AND 160),
  category event_category NOT NULL,
  city TEXT NOT NULL CHECK (LENGTH(BTRIM(city)) BETWEEN 1 AND 100),
  starts_at TIMESTAMPTZ NOT NULL,
  price_paise BIGINT NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
  description TEXT NOT NULL CHECK (LENGTH(BTRIM(description)) BETWEEN 1 AND 5000),
  image_url TEXT NOT NULL CHECK (image_url ~* '^https?://'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE FUNCTION prevent_event_delete() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Events cannot be deleted; set is_active to false instead.'
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_prevent_delete
  BEFORE DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION prevent_event_delete();
