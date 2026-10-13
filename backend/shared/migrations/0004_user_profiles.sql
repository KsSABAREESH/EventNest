ALTER TABLE users
  ADD COLUMN username TEXT,
  ADD COLUMN mobile_number TEXT,
  ADD COLUMN photo_url TEXT,
  ADD CONSTRAINT users_username_length CHECK (
    username IS NULL OR LENGTH(BTRIM(username)) BETWEEN 2 AND 40
  ),
  ADD CONSTRAINT users_mobile_number_format CHECK (
    mobile_number IS NULL OR mobile_number ~ '^[+]?[0-9]{10,15}$'
  ),
  ADD CONSTRAINT users_photo_url_http CHECK (
    photo_url IS NULL OR photo_url ~* '^https?://'
  );
