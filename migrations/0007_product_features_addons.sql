-- Product extra fields: bullet feature list + paid add-ons (both JSON-encoded text)
ALTER TABLE products ADD COLUMN features TEXT DEFAULT '';   -- JSON array of strings
ALTER TABLE products ADD COLUMN addons TEXT DEFAULT '';     -- JSON array of {name, price}
