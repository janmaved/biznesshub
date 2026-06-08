-- Plan overrides + editable site texts are stored as JSON in platform_settings (key/value).
-- No schema change needed; this migration documents the keys used:
--   plan_overrides : JSON map of {planKey:{name,price,mrp,deal,tagline,period,features[],payLink}}
--   site_text      : JSON map of {brand_name,hero_title,hero_subtitle,support_email}
-- platform_settings table already exists from 0001.
INSERT OR IGNORE INTO platform_settings (key,value) VALUES ('plan_overrides','');
INSERT OR IGNORE INTO platform_settings (key,value) VALUES ('site_text','');
