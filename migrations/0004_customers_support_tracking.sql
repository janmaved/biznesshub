-- Customer accounts (per store) so customers can log in to send feedback / view orders
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,            -- sha-256 hex
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_id, email)
);
CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);

-- Support tickets / feedback threads (customer <-> owner)
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open',         -- open | answered | closed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tickets_store ON tickets(store_id);

-- Messages inside a ticket (text + optional attachment data-url, image or video)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  sender TEXT NOT NULL,               -- customer | owner
  body TEXT,
  attach_url TEXT,                    -- data-url or media url
  attach_kind TEXT,                   -- image | video | file
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tmsg_ticket ON ticket_messages(ticket_id);

-- Owner -> platform feature requests (forwarded to platform support email)
CREATE TABLE IF NOT EXISTS feature_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  attach_url TEXT,
  status TEXT DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order extras: customer UTR/payment reference + tracking link + linked customer
ALTER TABLE orders ADD COLUMN customer_id INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN payment_utr TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN tracking_link TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN order_code TEXT DEFAULT '';

-- Configurable checkout fields (owner decides which fields, mandatory/optional)
ALTER TABLE stores ADD COLUMN checkout_fields TEXT DEFAULT '';

-- Platform support email for forwarding owner feature requests
ALTER TABLE stores ADD COLUMN support_email TEXT DEFAULT '';
