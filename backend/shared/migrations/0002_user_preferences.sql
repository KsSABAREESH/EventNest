CREATE TYPE event_card_theme AS ENUM ('sunset', 'midnight', 'paper');

CREATE TABLE user_favourite_categories (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category event_category NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, category)
);

CREATE TABLE event_reminders (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE event_card_designs (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  theme event_card_theme NOT NULL DEFAULT 'paper',
  stickers TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id),
  CONSTRAINT event_card_design_sticker_limit CHECK (CARDINALITY(stickers) <= 3),
  CONSTRAINT event_card_design_sticker_values CHECK (
    stickers <@ ARRAY['sparkles', 'music-notes', 'confetti', 'heart', 'star']::TEXT[]
  )
);

CREATE INDEX user_favourites_category_user ON user_favourite_categories (category, user_id);
CREATE INDEX reminders_event_id ON event_reminders (event_id);
CREATE INDEX card_designs_event_id ON event_card_designs (event_id);
