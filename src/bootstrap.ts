// Auto-bootstrap: ensures the D1 schema + essential seed data exist on first run.
// This makes the app work on ANY fresh Cloudflare D1 database WITHOUT manually
// running `wrangler d1 migrations apply` / seed — admin login, storefront and
// payment options all work immediately after deploy.
//
// Everything here is idempotent (CREATE TABLE IF NOT EXISTS / OR IGNORE), and
// ALTER TABLE statements are run individually so an "already exists" error on
// one column never blocks the rest.

let bootstrapped = false

const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS owners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT, pin TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'trial', plan_status TEXT NOT NULL DEFAULT 'active',
    trial_ends_at DATETIME, plan_expires_at DATETIME,
    is_unlocked INTEGER NOT NULL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL,
    slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general', theme TEXT NOT NULL DEFAULT 'aurora',
    tagline TEXT, about TEXT, logo_url TEXT, cover_url TEXT,
    primary_color TEXT DEFAULT '#4f46e5', accent_color TEXT DEFAULT '#06b6d4',
    currency TEXT DEFAULT 'INR', phone TEXT, whatsapp TEXT, email TEXT, address TEXT,
    pay_upi TEXT, pay_qr_url TEXT, pay_bank TEXT, pay_link TEXT, pay_gateway_enabled INTEGER DEFAULT 0,
    white_label INTEGER DEFAULT 0, custom_domain TEXT,
    seo_title TEXT, seo_description TEXT, seo_keywords TEXT,
    is_published INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug)`,
  `CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER NOT NULL, name TEXT NOT NULL, sort_order INTEGER DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id)`,
  `CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER NOT NULL, category_id INTEGER, name TEXT NOT NULL, description TEXT, price REAL NOT NULL DEFAULT 0, sale_price REAL, image_url TEXT, in_stock INTEGER DEFAULT 1, is_featured INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id)`,
  `CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER NOT NULL, customer_name TEXT NOT NULL, customer_phone TEXT, customer_email TEXT, address TEXT, items_json TEXT NOT NULL, total REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending', payment_status TEXT DEFAULT 'unpaid', payment_ref TEXT, note TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id)`,
  `CREATE TABLE IF NOT EXISTS enquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER NOT NULL, name TEXT, phone TEXT, email TEXT, message TEXT NOT NULL, source TEXT DEFAULT 'form', status TEXT DEFAULT 'new', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_enquiries_store ON enquiries(store_id)`,
  `CREATE TABLE IF NOT EXISTS coupons (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER NOT NULL, code TEXT NOT NULL, description TEXT, discount_type TEXT DEFAULT 'percent', discount_value REAL NOT NULL DEFAULT 0, active INTEGER DEFAULT 1, expires_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_coupons_store ON coupons(store_id)`,
  `CREATE TABLE IF NOT EXISTS subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL, plan TEXT NOT NULL, amount REAL NOT NULL, txn_id TEXT, status TEXT DEFAULT 'pending', gateway TEXT DEFAULT 'payu', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_subs_owner ON subscriptions(owner_id)`,
  `CREATE TABLE IF NOT EXISTS platform_settings (key TEXT PRIMARY KEY, value TEXT)`,
  `CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER NOT NULL, kind TEXT DEFAULT 'image', data_url TEXT NOT NULL, label TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, password TEXT NOT NULL, phone TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id, email)`,
  `CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER NOT NULL, customer_id INTEGER, order_id INTEGER, subject TEXT, status TEXT DEFAULT 'open', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_tickets_store ON tickets(store_id)`,
  `CREATE TABLE IF NOT EXISTS ticket_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, ticket_id INTEGER NOT NULL, sender TEXT NOT NULL, body TEXT, attach_url TEXT, attach_kind TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_tmsg_ticket ON ticket_messages(ticket_id)`,
  `CREATE TABLE IF NOT EXISTS feature_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL, store_id INTEGER, title TEXT, body TEXT, forwarded INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS platform_tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT NOT NULL, subject TEXT NOT NULL, status TEXT DEFAULT 'open', forwarded INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS platform_ticket_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, ticket_id INTEGER NOT NULL, sender TEXT NOT NULL, body TEXT, attach_url TEXT, attach_kind TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_ptmsg_ticket ON platform_ticket_messages(ticket_id)`,
]

// Columns added by later migrations. Run individually — "duplicate column" is ignored.
const ALTERS: string[] = [
  `ALTER TABLE stores ADD COLUMN pay_provider TEXT DEFAULT ''`,
  `ALTER TABLE stores ADD COLUMN pay_key_id TEXT DEFAULT ''`,
  `ALTER TABLE stores ADD COLUMN pay_key_secret TEXT DEFAULT ''`,
  `ALTER TABLE stores ADD COLUMN pay_extra TEXT DEFAULT ''`,
  `ALTER TABLE stores ADD COLUMN logo_shape TEXT DEFAULT 'circle'`,
  `ALTER TABLE stores ADD COLUMN checkout_fields TEXT DEFAULT ''`,
  `ALTER TABLE stores ADD COLUMN support_email TEXT DEFAULT ''`,
  `ALTER TABLE stores ADD COLUMN subdomain TEXT DEFAULT ''`,
  `ALTER TABLE stores ADD COLUMN domain_status TEXT DEFAULT 'none'`,
  `ALTER TABLE orders ADD COLUMN customer_id INTEGER DEFAULT 0`,
  `ALTER TABLE orders ADD COLUMN payment_utr TEXT DEFAULT ''`,
  `ALTER TABLE orders ADD COLUMN tracking_link TEXT DEFAULT ''`,
  `ALTER TABLE orders ADD COLUMN order_code TEXT DEFAULT ''`,
  `ALTER TABLE products ADD COLUMN features TEXT DEFAULT ''`,
  `ALTER TABLE products ADD COLUMN addons TEXT DEFAULT ''`,
]

const SEED: string[] = [
  `INSERT OR REPLACE INTO platform_settings (key, value) VALUES ('super_admin_pin', '2005####')`,
  `INSERT OR REPLACE INTO platform_settings (key, value) VALUES ('platform_name', 'Storenest')`,
  `INSERT OR IGNORE INTO owners (id, name, email, phone, pin, plan, plan_status, is_unlocked, trial_ends_at)
     VALUES (1, 'Demo Business', 'demo@storenest.app', '9999999999', '1234', 'enterprise', 'active', 1, datetime('now','+7 days'))`,
  `INSERT OR IGNORE INTO stores (id, owner_id, slug, name, category, theme, tagline, about, currency, phone, whatsapp, email, address, pay_upi, primary_color, accent_color, seo_title, seo_description, seo_keywords)
     VALUES (1, 1, 'demo', 'Spice Garden Restaurant', 'restaurant', 'aurora', 'Authentic flavours, delivered fresh', 'We serve the finest multi-cuisine dishes prepared by expert chefs. Dine in, take away or order online.', 'INR', '9999999999', '9999999999', 'demo@storenest.app', '123 Main Street, Mumbai', 'demo@upi', '#e11d48', '#f59e0b', 'Spice Garden Restaurant - Order Online', 'Order delicious multi-cuisine food online from Spice Garden. Fast delivery, best prices.', 'restaurant, food delivery, order online, mumbai')`,
  `INSERT OR IGNORE INTO categories (id, store_id, name, sort_order) VALUES (1,1,'Starters',1),(2,1,'Main Course',2),(3,1,'Desserts',3),(4,1,'Beverages',4)`,
  `INSERT OR IGNORE INTO products (store_id, category_id, name, description, price, image_url, is_featured) VALUES
     (1,1,'Paneer Tikka','Char-grilled cottage cheese with spices',220,'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400',1),
     (1,1,'Spring Rolls','Crispy veg spring rolls',150,'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400',0),
     (1,2,'Butter Chicken','Creamy tomato gravy with tender chicken',320,'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400',1),
     (1,2,'Veg Biryani','Fragrant basmati rice with vegetables',250,'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',1),
     (1,3,'Gulab Jamun','Soft milk dumplings in sugar syrup',90,'https://images.unsplash.com/photo-1601303516361-cfba0e8d4c98?w=400',0),
     (1,4,'Masala Chai','Indian spiced tea',40,'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',0)`,
  `INSERT OR IGNORE INTO coupons (store_id, code, description, discount_type, discount_value, active) VALUES
     (1,'WELCOME10','10% off on first order','percent',10,1),
     (1,'FLAT50','Flat ₹50 off above ₹500','flat',50,1)`,
]

export async function ensureBootstrap(db: D1Database): Promise<void> {
  if (bootstrapped) return
  try {
    // Fast path: if the super_admin_pin row exists, schema+seed are already in place.
    const ok = await db.prepare("SELECT value FROM platform_settings WHERE key='super_admin_pin'").first().catch(() => null)
    if (ok) { bootstrapped = true; return }
  } catch { /* table doesn't exist yet — fall through to create */ }

  for (const sql of SCHEMA) { try { await db.prepare(sql).run() } catch { /* ignore */ } }
  for (const sql of ALTERS) { try { await db.prepare(sql).run() } catch { /* duplicate column ignored */ } }
  for (const sql of SEED) { try { await db.prepare(sql).run() } catch { /* ignore */ } }
  bootstrapped = true
}
