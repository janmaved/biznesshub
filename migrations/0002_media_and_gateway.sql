-- =========================================================
-- 0002: Media library (uploaded files) + per-store payment gateway
-- =========================================================

-- Uploaded media files (images/video) stored as data URLs in D1.
-- Kept small (validated <= ~600KB) so it works without R2.
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  name TEXT,
  mime TEXT,
  kind TEXT DEFAULT 'image',          -- image | video
  data TEXT NOT NULL,                  -- data:...;base64,....
  size INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_store ON media(store_id);

-- Per-store online payment gateway config (so each business can take REAL
-- customer payments seamlessly with their own keys).
ALTER TABLE stores ADD COLUMN pay_provider TEXT DEFAULT '';        -- razorpay | payu | cashfree | phonepe | ''
ALTER TABLE stores ADD COLUMN pay_key_id TEXT DEFAULT '';          -- public/merchant key
ALTER TABLE stores ADD COLUMN pay_key_secret TEXT DEFAULT '';      -- secret / salt
ALTER TABLE stores ADD COLUMN pay_extra TEXT DEFAULT '';           -- e.g. cashfree app id, phonepe merchant id
