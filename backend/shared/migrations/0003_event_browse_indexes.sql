ALTER TABLE events
  ADD COLUMN search_document TSVECTOR GENERATED ALWAYS AS (
    SETWEIGHT(TO_TSVECTOR('simple'::REGCONFIG, COALESCE(title, '')), 'A') ||
    SETWEIGHT(TO_TSVECTOR('simple'::REGCONFIG, COALESCE(city, '')), 'B') ||
    SETWEIGHT(TO_TSVECTOR('simple'::REGCONFIG, COALESCE(description, '')), 'C')
  ) STORED;

CREATE INDEX events_active_upcoming ON events (starts_at ASC) WHERE is_active = TRUE;
CREATE INDEX events_active_category_upcoming ON events (category, starts_at ASC) WHERE is_active = TRUE;
CREATE INDEX events_active_city_upcoming ON events (LOWER(city), starts_at ASC) WHERE is_active = TRUE;
CREATE INDEX events_search_document_gin ON events USING GIN (search_document);
