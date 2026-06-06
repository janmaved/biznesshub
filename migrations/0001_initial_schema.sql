-- =========================================================
-- StoreBuilder SaaS - Multi-tenant schema
-- =========================================================

-- Business owners (tenants)
CREATE TABLE IF NOT EXISTS owners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  pin TEXT NOT NULL,                       -- login PIN
  plan TEXT NOT NULL DEFAULT 'trial',      -- trial | starter | growth | enterprise
  plan_status TEXT NOT NULL DEFAULT 'active', -- active | expired | cancelled
  trial_ends_at DATETIME,
  plan_expires_at DATETIME,
  is_unlocked INTEGER NOT NULL DEFAULT 0,  -- super-admin free unlock
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stores / websites (one per owner for now, extensible to many)
CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  slug TEXT UNIQUE NOT NULL,               -- public url slug
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',-- restaurant | retail | salon | services | general
  theme TEXT NOT NULL DEFAULT 'aurora',    -- selected theme key
  tagline TEXT,
  about TEXT,
  logo_url TEXT,
  cover_url TEXT,
  primary_color TEXT DEFAULT '#4f46e5',
  accent_color TEXT DEFAULT '#06b6d4',
  currency TEXT DEFAULT 'INR',
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  -- payment config
  pay_upi TEXT,
  pay_qr_url TEXT,
  pay_bank TEXT,
  pay_link TEXT,
  pay_gateway_enabled INTEGER DEFAULT 0,
  -- branding / white-label
  white_label INTEGER DEFAULT 0,
  custom_domain TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  is_published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);

-- Product / menu categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id);

-- Products / menu items / services
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  category_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  sale_price REAL,
  image_url TEXT,
  in_stock INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);

-- Customer orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  address TEXT,
  items_json TEXT NOT NULL,                -- JSON array of {id,name,price,qty}
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | confirmed | completed | cancelled
  payment_status TEXT DEFAULT 'unpaid',    -- unpaid | paid
  payment_ref TEXT,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);

-- Enquiries (contact / AI captured)
CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  name TEXT,
  phone TEXT,
  email TEXT,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'form',              -- form | ai_chat
  status TEXT DEFAULT 'new',               -- new | read | replied
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_enquiries_store ON enquiries(store_id);

-- Offers / coupons
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT DEFAULT 'percent',    -- percent | flat
  discount_value REAL NOT NULL DEFAULT 0,
  active INTEGER DEFAULT 1,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_coupons_store ON coupons(store_id);

-- Subscription / payment records (for SaaS billing)
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  plan TEXT NOT NULL,
  amount REAL NOT NULL,
  txn_id TEXT,
  status TEXT DEFAULT 'pending',           -- pending | success | failed
  gateway TEXT DEFAULT 'payu',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_subs_owner ON subscriptions(owner_id);

-- Platform-wide settings (super admin PIN, global config)
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
