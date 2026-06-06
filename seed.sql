-- Super admin PIN (changeable by owner)
INSERT OR REPLACE INTO platform_settings (key, value) VALUES ('super_admin_pin', '2005####');
INSERT OR REPLACE INTO platform_settings (key, value) VALUES ('platform_name', 'StoreBuilder');

-- Demo owner (unlocked free for testing)
INSERT OR IGNORE INTO owners (id, name, email, phone, pin, plan, plan_status, is_unlocked, trial_ends_at)
VALUES (1, 'Demo Business', 'demo@storebuilder.app', '9999999999', '1234', 'enterprise', 'active', 1, datetime('now','+7 days'));

-- Demo store
INSERT OR IGNORE INTO stores (id, owner_id, slug, name, category, theme, tagline, about, currency, phone, whatsapp, email, address, pay_upi, primary_color, accent_color, seo_title, seo_description, seo_keywords)
VALUES (1, 1, 'demo', 'Spice Garden Restaurant', 'restaurant', 'aurora',
  'Authentic flavours, delivered fresh', 'We serve the finest multi-cuisine dishes prepared by expert chefs. Dine in, take away or order online.',
  'INR', '9999999999', '9999999999', 'demo@storebuilder.app', '123 Main Street, Mumbai',
  'demo@upi', '#e11d48', '#f59e0b',
  'Spice Garden Restaurant - Order Online', 'Order delicious multi-cuisine food online from Spice Garden. Fast delivery, best prices.', 'restaurant, food delivery, order online, mumbai');

INSERT OR IGNORE INTO categories (id, store_id, name, sort_order) VALUES
  (1, 1, 'Starters', 1),
  (2, 1, 'Main Course', 2),
  (3, 1, 'Desserts', 3),
  (4, 1, 'Beverages', 4);

INSERT OR IGNORE INTO products (store_id, category_id, name, description, price, image_url, is_featured) VALUES
  (1, 1, 'Paneer Tikka', 'Char-grilled cottage cheese with spices', 220, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400', 1),
  (1, 1, 'Spring Rolls', 'Crispy veg spring rolls', 150, 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400', 0),
  (1, 2, 'Butter Chicken', 'Creamy tomato gravy with tender chicken', 320, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', 1),
  (1, 2, 'Veg Biryani', 'Fragrant basmati rice with vegetables', 250, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', 1),
  (1, 3, 'Gulab Jamun', 'Soft milk dumplings in sugar syrup', 90, 'https://images.unsplash.com/photo-1601303516361-cfba0e8d4c98?w=400', 0),
  (1, 4, 'Masala Chai', 'Indian spiced tea', 40, 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400', 0);

INSERT OR IGNORE INTO coupons (store_id, code, description, discount_type, discount_value, active) VALUES
  (1, 'WELCOME10', '10% off on first order', 'percent', 10, 1),
  (1, 'FLAT50', 'Flat ₹50 off above ₹500', 'flat', 50, 1);
