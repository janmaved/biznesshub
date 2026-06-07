-- Custom domain + subdomain routing (set by super-admin)
ALTER TABLE stores ADD COLUMN subdomain TEXT DEFAULT '';
ALTER TABLE stores ADD COLUMN domain_status TEXT DEFAULT 'none'; -- none | pending | connected

CREATE INDEX IF NOT EXISTS idx_stores_domain ON stores(custom_domain);
CREATE INDEX IF NOT EXISTS idx_stores_subdomain ON stores(subdomain);

-- Platform support tickets: visitors / owners -> Storenest team (care@nuvellestudio.store)
CREATE TABLE IF NOT EXISTS platform_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  forwarded INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_ticket_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  sender TEXT NOT NULL,
  body TEXT,
  attach_url TEXT,
  attach_kind TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ptmsg_ticket ON platform_ticket_messages(ticket_id);
