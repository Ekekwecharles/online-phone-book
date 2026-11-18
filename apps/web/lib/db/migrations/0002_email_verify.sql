-- Email must be checked with a code before we use it for login notices or recovery.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS email_verifications (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0
);
