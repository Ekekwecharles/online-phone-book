CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  phone_idx text UNIQUE,
  phone_enc text,
  password_hash text NOT NULL,
  wrapped_key text NOT NULL,
  email text,
  recovery_phone_enc text,
  recovery_code_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name_enc text NOT NULL,
  phone_enc text NOT NULL,
  phone_idx text NOT NULL,
  updated_at bigint NOT NULL,
  synced_at bigint NOT NULL,
  deleted boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS contacts_user_synced ON contacts (user_id, synced_at);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);

CREATE TABLE IF NOT EXISTS login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL,
  device_type text NOT NULL,
  device_id text,
  place text NOT NULL,
  emailed boolean NOT NULL DEFAULT false,
  wasnt_me_hash text
);
CREATE INDEX IF NOT EXISTS login_events_user_at ON login_events (user_id, at);

CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS push_tokens_token ON push_tokens (token);

CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_codes (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0
);
