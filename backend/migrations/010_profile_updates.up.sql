-- Account type for users
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'personal';
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram    TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp    TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio         TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url  TEXT;

-- Route type: personal or tour
ALTER TABLE routes ADD COLUMN IF NOT EXISTS route_type TEXT NOT NULL DEFAULT 'personal';
CREATE INDEX IF NOT EXISTS idx_routes_type ON routes(route_type);

-- Tour contacts
ALTER TABLE tours ADD COLUMN IF NOT EXISTS telegram  TEXT;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS whatsapp  TEXT;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS instagram TEXT;
