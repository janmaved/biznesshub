import { Hono } from 'hono'
import type { Bindings } from './types'
import { PLANS, THEMES, CATEGORIES } from './types'
import { buildPayuRequest, verifyPayuResponse } from './payu'
import { startPayment, verifyRazorpay } from './gateways'
import { groqChat, buildStoreSystemPrompt } from './ai'

const api = new Hono<{ Bindings: Bindings }>()

// ---------- helpers ----------
const json = (c: any, data: any, status = 200) => c.json(data, status)

async function getSuperPin(db: D1Database): Promise<string> {
  const row = await db.prepare("SELECT value FROM platform_settings WHERE key='super_admin_pin'").first<any>()
  return row?.value || '2005####'
}

// ---- Platform settings (key/value) ----
async function getSetting(db: D1Database, key: string): Promise<string> {
  const row = await db.prepare('SELECT value FROM platform_settings WHERE key=?').bind(key).first<any>()
  return row?.value || ''
}
async function setSetting(db: D1Database, key: string, value: string) {
  await db.prepare('INSERT OR REPLACE INTO platform_settings (key,value) VALUES (?,?)').bind(key, value).run()
}

// Merge DB-stored plan overrides (price / mrp / deal / features / payLink) onto the defaults.
async function getPlans(db: D1Database) {
  const raw = await getSetting(db, 'plan_overrides')
  let ov: any = {}
  try { ov = raw ? JSON.parse(raw) : {} } catch { ov = {} }
  return PLANS.map((p) => {
    const o = ov[p.key] || {}
    return {
      ...p,
      ...(o.name != null ? { name: o.name } : {}),
      ...(o.price != null ? { price: Number(o.price) } : {}),
      ...(o.mrp != null ? { mrp: Number(o.mrp) } : {}),
      ...(o.deal != null ? { deal: o.deal } : {}),
      ...(o.tagline != null ? { tagline: o.tagline } : {}),
      ...(o.period != null ? { period: o.period } : {}),
      ...(Array.isArray(o.features) && o.features.length ? { features: o.features } : {}),
      ...(o.payLink != null ? { payLink: o.payLink } : {}),
    }
  })
}

// Editable website / platform texts (landing hero, brand name, support email, etc.).
const SITE_TEXT_DEFAULTS: Record<string, string> = {
  brand_name: 'Storenest',
  hero_title: 'Build Your Online Store & Website in Minutes',
  hero_subtitle: 'No code. No setup fees. Launch a stunning store, menu or service site — cheaper than any app, ready in minutes.',
  support_email: 'care@nuvellestudio.store',
}
async function getSiteText(db: D1Database) {
  const raw = await getSetting(db, 'site_text')
  let ov: any = {}
  try { ov = raw ? JSON.parse(raw) : {} } catch { ov = {} }
  return { ...SITE_TEXT_DEFAULTS, ...ov }
}

// Auto-expire paid (non-trial) plans whose monthly window has passed → lock back to trial.
async function enforceExpiry(db: D1Database) {
  try {
    await db.prepare(
      `UPDATE owners SET plan='trial', plan_status='expired'
       WHERE is_unlocked=0 AND plan NOT IN ('trial')
         AND plan_expires_at IS NOT NULL AND plan_expires_at < datetime('now')`
    ).run()
  } catch { /* non-fatal */ }
}

async function getOwnerStore(db: D1Database, ownerId: number) {
  return await db.prepare('SELECT * FROM stores WHERE owner_id=?').bind(ownerId).first<any>()
}

// ============================================================
// META: plans, themes, categories
// ============================================================
api.get('/meta', async (c) => {
  await enforceExpiry(c.env.DB)
  const plans = await getPlans(c.env.DB)
  const site = await getSiteText(c.env.DB)
  return json(c, { plans, themes: THEMES, categories: CATEGORIES, site })
})

// ============================================================
// SUPER ADMIN (platform owner)
// ============================================================
api.post('/super/login', async (c) => {
  const { pin } = await c.req.json()
  const real = await getSuperPin(c.env.DB)
  if (pin !== real) return json(c, { ok: false, error: 'Invalid PIN' }, 401)
  return json(c, { ok: true, token: 'super-' + Date.now() })
})

api.post('/super/change-pin', async (c) => {
  const { pin, newPin } = await c.req.json()
  const real = await getSuperPin(c.env.DB)
  if (pin !== real) return json(c, { ok: false, error: 'Invalid current PIN' }, 401)
  if (!newPin || newPin.length < 4) return json(c, { ok: false, error: 'PIN too short' }, 400)
  await c.env.DB.prepare("UPDATE platform_settings SET value=? WHERE key='super_admin_pin'").bind(newPin).run()
  return json(c, { ok: true })
})

api.post('/super/owners', async (c) => {
  const { pin } = await c.req.json()
  const real = await getSuperPin(c.env.DB)
  if (pin !== real) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  const owners = await c.env.DB.prepare(`
    SELECT o.*, s.name as store_name, s.slug as store_slug, s.custom_domain as custom_domain, s.subdomain as subdomain, s.domain_status as domain_status
    FROM owners o LEFT JOIN stores s ON s.owner_id=o.id ORDER BY o.created_at DESC`).all()
  const subs = await c.env.DB.prepare('SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 50').all()
  return json(c, { ok: true, owners: owners.results, subscriptions: subs.results })
})

// Super admin: unlock an owner for free (full access)
api.post('/super/unlock', async (c) => {
  const { pin, ownerId, unlock } = await c.req.json()
  const real = await getSuperPin(c.env.DB)
  if (pin !== real) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  await c.env.DB.prepare('UPDATE owners SET is_unlocked=?, plan=?, plan_status=? WHERE id=?')
    .bind(unlock ? 1 : 0, unlock ? 'enterprise' : 'trial', 'active', ownerId).run()
  return json(c, { ok: true })
})

// Super admin: set / connect a store's custom domain or subdomain
api.post('/super/domain', async (c) => {
  const body = await c.req.json()
  const { pin, ownerId, subdomain, status } = body
  const custom_domain = body.custom_domain ?? body.customDomain
  if (pin !== (await getSuperPin(c.env.DB))) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  const store = await c.env.DB.prepare('SELECT id FROM stores WHERE owner_id=?').bind(ownerId).first<any>()
  if (!store) return json(c, { ok: false, error: 'Store not found' }, 404)
  const dom = (custom_domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  const sub = (subdomain || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (dom) { const d = await c.env.DB.prepare('SELECT id FROM stores WHERE custom_domain=? AND id<>?').bind(dom, store.id).first(); if (d) return json(c, { ok: false, error: 'Domain already in use' }, 400) }
  if (sub) { const d = await c.env.DB.prepare('SELECT id FROM stores WHERE subdomain=? AND id<>?').bind(sub, store.id).first(); if (d) return json(c, { ok: false, error: 'Subdomain already in use' }, 400) }
  // A custom domain is "pending" until DNS is verified to point at this app.
  const st = status || (dom ? 'pending' : (sub ? 'connected' : 'none'))
  await c.env.DB.prepare('UPDATE stores SET custom_domain=?, subdomain=?, domain_status=? WHERE id=?')
    .bind(dom, sub, st, store.id).run()
  return json(c, { ok: true, custom_domain: dom, subdomain: sub, domain_status: st })
})

// Super admin: verify a custom domain is really pointing at this deployment.
// We fetch the live domain and check it returns this store's storefront
// (the storefront embeds data-slug). If it matches, mark domain as connected.
api.post('/super/domain/verify', async (c) => {
  const { pin, ownerId } = await c.req.json()
  if (pin !== (await getSuperPin(c.env.DB))) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  const store = await c.env.DB.prepare('SELECT id, slug, custom_domain FROM stores WHERE owner_id=?').bind(ownerId).first<any>()
  if (!store || !store.custom_domain) return json(c, { ok: false, error: 'No custom domain set' }, 400)
  const dom = store.custom_domain
  let reachable = false, matched = false, detail = ''
  try {
    const res = await fetch(`https://${dom}/`, { headers: { 'host': dom }, redirect: 'follow' as any })
    reachable = res.ok
    const html = await res.text()
    matched = html.includes(`data-slug="${store.slug}"`) || html.includes(`/s/${store.slug}`)
    detail = res.status + (matched ? ' · storefront detected' : ' · reachable but not this store yet')
  } catch (e: any) {
    detail = 'DNS not resolving / not reachable yet'
  }
  const newStatus = matched ? 'connected' : (reachable ? 'pending' : 'pending')
  await c.env.DB.prepare('UPDATE stores SET domain_status=? WHERE id=?').bind(newStatus, store.id).run()
  return json(c, { ok: true, verified: matched, reachable, domain_status: newStatus, detail, domain: dom })
})

// Super admin: read current plan + site-text config for editing
api.post('/super/config', async (c) => {
  const { pin } = await c.req.json()
  if (pin !== (await getSuperPin(c.env.DB))) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  return json(c, { ok: true, plans: await getPlans(c.env.DB), site: await getSiteText(c.env.DB) })
})

// Super admin: save plan overrides (price / mrp / deal / features / per-plan payment link)
api.post('/super/plans', async (c) => {
  const { pin, plans } = await c.req.json()
  if (pin !== (await getSuperPin(c.env.DB))) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  const ov: any = {}
  for (const p of (plans || [])) {
    if (!p || !p.key) continue
    ov[p.key] = {
      name: p.name, price: Number(p.price) || 0, mrp: p.mrp != null && p.mrp !== '' ? Number(p.mrp) : undefined,
      deal: p.deal || '', tagline: p.tagline || '', period: p.period || 'month',
      features: Array.isArray(p.features) ? p.features.filter((x: string) => x && x.trim()) : undefined,
      payLink: (p.payLink || '').trim(),
    }
  }
  await setSetting(c.env.DB, 'plan_overrides', JSON.stringify(ov))
  return json(c, { ok: true, plans: await getPlans(c.env.DB) })
})

// Super admin: save editable website / platform texts
api.post('/super/site', async (c) => {
  const { pin, site } = await c.req.json()
  if (pin !== (await getSuperPin(c.env.DB))) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  const clean: any = {}
  for (const k of Object.keys(SITE_TEXT_DEFAULTS)) if (site && site[k] != null) clean[k] = String(site[k])
  await setSetting(c.env.DB, 'site_text', JSON.stringify(clean))
  return json(c, { ok: true, site: await getSiteText(c.env.DB) })
})

// Super admin: STRICT manual confirmation that an owner actually paid (for payment-link mode,
// where the gateway can't auto-callback). Only this — or a verified gateway callback — unlocks a paid plan.
api.post('/super/confirm-payment', async (c) => {
  const { pin, ownerId, plan } = await c.req.json()
  if (pin !== (await getSuperPin(c.env.DB))) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  const plans = await getPlans(c.env.DB)
  const pl = plans.find((p) => p.key === plan)
  if (!pl || pl.price <= 0) return json(c, { ok: false, error: 'Invalid plan' }, 400)
  const txnid = 'MANUAL' + Date.now()
  await c.env.DB.prepare('INSERT INTO subscriptions (owner_id,plan,amount,txn_id,status,gateway) VALUES (?,?,?,?,?,?)')
    .bind(ownerId, pl.key, pl.price, txnid, 'success', 'manual').run()
  // Monthly plans expire after 30 days → then auto-locked by enforceExpiry.
  await c.env.DB.prepare("UPDATE owners SET plan=?, plan_status='active', plan_expires_at=datetime('now','+30 days') WHERE id=?")
    .bind(pl.key, ownerId).run()
  return json(c, { ok: true })
})

// Super admin: view + reply to platform support tickets
api.post('/super/tickets', async (c) => {
  const { pin } = await c.req.json()
  if (pin !== (await getSuperPin(c.env.DB))) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  const tickets = await c.env.DB.prepare('SELECT * FROM platform_tickets ORDER BY updated_at DESC LIMIT 100').all()
  const out: any[] = []
  for (const t of tickets.results as any[]) {
    const msgs = await c.env.DB.prepare('SELECT sender,body,attach_url,attach_kind,created_at FROM platform_ticket_messages WHERE ticket_id=? ORDER BY id').bind(t.id).all()
    out.push({ ...t, messages: msgs.results })
  }
  return json(c, { ok: true, tickets: out })
})
api.post('/super/tickets/:id/reply', async (c) => {
  const { pin, body } = await c.req.json()
  if (pin !== (await getSuperPin(c.env.DB))) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  const tid = c.req.param('id')
  await c.env.DB.prepare('INSERT INTO platform_ticket_messages (ticket_id,sender,body) VALUES (?,?,?)').bind(tid, 'admin', body || '').run()
  await c.env.DB.prepare("UPDATE platform_tickets SET status='answered', updated_at=datetime('now') WHERE id=?").bind(tid).run()
  return json(c, { ok: true })
})

// PUBLIC: platform support ticket (from landing chatbot / help) -> care@nuvellestudio.store
api.post('/support/ticket', async (c) => {
  const b = await c.req.json()
  if (!b.email || !b.subject || !b.body) return json(c, { ok: false, error: 'Email, subject and message required' }, 400)
  const t = await c.env.DB.prepare("INSERT INTO platform_tickets (name,email,subject) VALUES (?,?,?)")
    .bind(b.name || '', b.email, b.subject).run()
  const tid = t.meta.last_row_id
  await c.env.DB.prepare('INSERT INTO platform_ticket_messages (ticket_id,sender,body,attach_url,attach_kind) VALUES (?,?,?,?,?)')
    .bind(tid, 'user', b.body, b.attach_url || '', b.attach_kind || '').run()
  await forwardSupportEmail(c.env, b.email, b.subject, b.body).catch(() => {})
  return json(c, { ok: true, ticketId: tid, message: 'Thanks! Our team will reply from care@nuvellestudio.store' })
})
api.get('/support/ticket/:id', async (c) => {
  const id = c.req.param('id')
  const email = c.req.query('email') || ''
  const t = await c.env.DB.prepare('SELECT * FROM platform_tickets WHERE id=? AND email=?').bind(id, email).first<any>()
  if (!t) return json(c, { ok: false, error: 'Not found' }, 404)
  const msgs = await c.env.DB.prepare('SELECT sender,body,attach_url,attach_kind,created_at FROM platform_ticket_messages WHERE ticket_id=? ORDER BY id').bind(id).all()
  return json(c, { ok: true, ticket: { ...t, messages: msgs.results } })
})
api.post('/support/ticket/:id/reply', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json()
  const t = await c.env.DB.prepare('SELECT id FROM platform_tickets WHERE id=? AND email=?').bind(id, b.email || '').first()
  if (!t) return json(c, { ok: false, error: 'Not found' }, 404)
  await c.env.DB.prepare('INSERT INTO platform_ticket_messages (ticket_id,sender,body) VALUES (?,?,?)').bind(id, 'user', b.body || '').run()
  await c.env.DB.prepare("UPDATE platform_tickets SET status='open', updated_at=datetime('now') WHERE id=?").bind(id).run()
  return json(c, { ok: true })
})

async function forwardSupportEmail(env: any, from: string, subject: string, body: string) {
  if (!env.RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Storenest Support <care@nuvellestudio.store>', to: ['care@nuvellestudio.store'], reply_to: from, subject: `[Storenest Support] ${subject}`, text: `From: ${from}\n\n${body}` })
  })
}

// ============================================================
// OWNER AUTH (signup + PIN login)
// ============================================================
api.post('/owner/signup', async (c) => {
  const b = await c.req.json()
  const { name, email, phone, pin, storeName, category } = b
  if (!name || !email || !pin || !storeName) return json(c, { ok: false, error: 'Missing fields' }, 400)
  const exists = await c.env.DB.prepare('SELECT id FROM owners WHERE email=?').bind(email).first()
  if (exists) return json(c, { ok: false, error: 'Email already registered. Please login.' }, 400)

  const res = await c.env.DB.prepare(`
    INSERT INTO owners (name,email,phone,pin,plan,plan_status,trial_ends_at)
    VALUES (?,?,?,?,'trial','active',datetime('now','+7 days'))`)
    .bind(name, email, phone || '', pin).run()
  const ownerId = res.meta.last_row_id

  // unique slug
  let slug = (storeName || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'store'
  const dup = await c.env.DB.prepare('SELECT id FROM stores WHERE slug=?').bind(slug).first()
  if (dup) slug = slug + '-' + ownerId

  const cat = category || 'general'
  const theme = THEMES.find((t) => t.category === cat && !t.premium)?.key || 'minimal'
  await c.env.DB.prepare(`
    INSERT INTO stores (owner_id,slug,name,category,theme,tagline,about,currency)
    VALUES (?,?,?,?,?,?,?, 'INR')`)
    .bind(ownerId, slug, storeName, cat, theme, 'Welcome to our store', 'Tell customers about your business here.').run()

  return json(c, { ok: true, ownerId, slug })
})

api.post('/owner/login', async (c) => {
  const { email, pin } = await c.req.json()
  const owner = await c.env.DB.prepare('SELECT * FROM owners WHERE email=? AND pin=?').bind(email, pin).first<any>()
  if (!owner) return json(c, { ok: false, error: 'Invalid email or PIN' }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  return json(c, { ok: true, owner: { ...owner, pin: undefined }, store })
})

// ============================================================
// OWNER DASHBOARD DATA  (ownerId in body for simplicity)
// ============================================================
async function authOwner(c: any): Promise<any | null> {
  const ownerId = Number(c.req.header('X-Owner-Id') || 0)
  const pin = c.req.header('X-Owner-Pin') || ''
  if (!ownerId || !pin) return null
  return await c.env.DB.prepare('SELECT * FROM owners WHERE id=? AND pin=?').bind(ownerId, pin).first<any>()
}

api.get('/owner/dashboard', async (c) => {
  const owner = await authOwner(c)
  if (!owner) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  if (!store) return json(c, { ok: false, error: 'No store' }, 404)
  const products = await c.env.DB.prepare('SELECT * FROM products WHERE store_id=? ORDER BY sort_order, id').bind(store.id).all()
  const categories = await c.env.DB.prepare('SELECT * FROM categories WHERE store_id=? ORDER BY sort_order').bind(store.id).all()
  const orders = await c.env.DB.prepare('SELECT * FROM orders WHERE store_id=? ORDER BY created_at DESC LIMIT 100').bind(store.id).all()
  const enquiries = await c.env.DB.prepare('SELECT * FROM enquiries WHERE store_id=? ORDER BY created_at DESC LIMIT 100').bind(store.id).all()
  const coupons = await c.env.DB.prepare('SELECT * FROM coupons WHERE store_id=? ORDER BY id DESC').bind(store.id).all()
  return json(c, {
    ok: true,
    owner: { ...owner, pin: undefined },
    store,
    products: products.results,
    categories: categories.results,
    orders: orders.results,
    enquiries: enquiries.results,
    coupons: coupons.results
  })
})

// Update store settings
api.put('/owner/store', async (c) => {
  const owner = await authOwner(c)
  if (!owner) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  const b = await c.req.json()
  const fields = ['name','category','theme','tagline','about','logo_url','logo_shape','cover_url','primary_color','accent_color',
    'currency','phone','whatsapp','email','address','pay_upi','pay_qr_url','pay_bank','pay_link','pay_gateway_enabled',
    'pay_provider','pay_key_id','pay_key_secret','pay_extra','checkout_fields',
    'white_label','custom_domain','seo_title','seo_description','seo_keywords','is_published']
  const sets: string[] = []
  const vals: any[] = []
  for (const f of fields) {
    if (b[f] !== undefined) { sets.push(`${f}=?`); vals.push(b[f]) }
  }
  if (sets.length) {
    vals.push(store.id)
    await c.env.DB.prepare(`UPDATE stores SET ${sets.join(',')} WHERE id=?`).bind(...vals).run()
  }
  const updated = await getOwnerStore(c.env.DB, owner.id)
  return json(c, { ok: true, store: updated })
})

// Change owner PIN
api.post('/owner/change-pin', async (c) => {
  const owner = await authOwner(c)
  if (!owner) return json(c, { ok: false, error: 'Unauthorized' }, 401)
  const { newPin } = await c.req.json()
  if (!newPin || newPin.length < 4) return json(c, { ok: false, error: 'PIN too short' }, 400)
  await c.env.DB.prepare('UPDATE owners SET pin=? WHERE id=?').bind(newPin, owner.id).run()
  return json(c, { ok: true })
})

// ----- Categories CRUD -----
api.post('/owner/categories', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  const { name, sort_order } = await c.req.json()
  const r = await c.env.DB.prepare('INSERT INTO categories (store_id,name,sort_order) VALUES (?,?,?)').bind(store.id, name, sort_order || 0).run()
  return json(c, { ok: true, id: r.meta.last_row_id })
})
api.delete('/owner/categories/:id', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  await c.env.DB.prepare('DELETE FROM categories WHERE id=? AND store_id=?').bind(c.req.param('id'), store.id).run()
  return json(c, { ok: true })
})

// ----- Products CRUD -----
api.post('/owner/products', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  const b = await c.req.json()
  const feats = JSON.stringify(Array.isArray(b.features) ? b.features : [])
  const adds = JSON.stringify(Array.isArray(b.addons) ? b.addons : [])
  const r = await c.env.DB.prepare(`INSERT INTO products (store_id,category_id,name,description,price,sale_price,image_url,in_stock,is_featured,sort_order,features,addons)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(store.id, b.category_id || null, b.name, b.description || '', b.price || 0, b.sale_price || null, b.image_url || '', b.in_stock ? 1 : 0, b.is_featured ? 1 : 0, b.sort_order || 0, feats, adds).run()
  return json(c, { ok: true, id: r.meta.last_row_id })
})
api.put('/owner/products/:id', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  const b = await c.req.json()
  const feats = JSON.stringify(Array.isArray(b.features) ? b.features : [])
  const adds = JSON.stringify(Array.isArray(b.addons) ? b.addons : [])
  await c.env.DB.prepare(`UPDATE products SET category_id=?,name=?,description=?,price=?,sale_price=?,image_url=?,in_stock=?,is_featured=?,features=?,addons=?
    WHERE id=? AND store_id=?`)
    .bind(b.category_id || null, b.name, b.description || '', b.price || 0, b.sale_price || null, b.image_url || '', b.in_stock ? 1 : 0, b.is_featured ? 1 : 0, feats, adds, c.req.param('id'), store.id).run()
  return json(c, { ok: true })
})
api.delete('/owner/products/:id', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  await c.env.DB.prepare('DELETE FROM products WHERE id=? AND store_id=?').bind(c.req.param('id'), store.id).run()
  return json(c, { ok: true })
})

// ----- Coupons CRUD -----
api.post('/owner/coupons', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  const b = await c.req.json()
  const r = await c.env.DB.prepare('INSERT INTO coupons (store_id,code,description,discount_type,discount_value,active) VALUES (?,?,?,?,?,?)')
    .bind(store.id, b.code, b.description || '', b.discount_type || 'percent', b.discount_value || 0, b.active ? 1 : 0).run()
  return json(c, { ok: true, id: r.meta.last_row_id })
})
api.delete('/owner/coupons/:id', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  await c.env.DB.prepare('DELETE FROM coupons WHERE id=? AND store_id=?').bind(c.req.param('id'), store.id).run()
  return json(c, { ok: true })
})

// ----- Media library (uploads) -----
const MAX_MEDIA_BYTES = 800 * 1024 // ~800KB data URL cap (D1 friendly)
api.get('/owner/media', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  const rows = await c.env.DB.prepare('SELECT id,name,mime,kind,data,size,created_at FROM media WHERE store_id=? ORDER BY id DESC LIMIT 200').bind(store.id).all()
  return json(c, { ok: true, media: rows.results })
})
api.post('/owner/media', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  const b = await c.req.json()
  const data: string = b.data || ''
  if (!data.startsWith('data:')) return json(c, { ok: false, error: 'Invalid file' }, 400)
  if (data.length > MAX_MEDIA_BYTES * 1.4) return json(c, { ok: false, error: 'File too large (max ~800KB). Please compress or use a URL.' }, 400)
  const mime = (data.split(';')[0] || '').replace('data:', '') || 'application/octet-stream'
  const kind = mime.startsWith('video') ? 'video' : 'image'
  const r = await c.env.DB.prepare('INSERT INTO media (store_id,name,mime,kind,data,size) VALUES (?,?,?,?,?,?)')
    .bind(store.id, (b.name || 'upload').slice(0, 120), mime, kind, data, data.length).run()
  return json(c, { ok: true, id: r.meta.last_row_id, kind, mime, data })
})
api.delete('/owner/media/:id', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  await c.env.DB.prepare('DELETE FROM media WHERE id=? AND store_id=?').bind(c.req.param('id'), store.id).run()
  return json(c, { ok: true })
})

// ----- Order / enquiry status update -----
api.put('/owner/orders/:id', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  const { status, payment_status, tracking_link } = await c.req.json()
  await c.env.DB.prepare('UPDATE orders SET status=COALESCE(?,status), payment_status=COALESCE(?,payment_status), tracking_link=COALESCE(?,tracking_link) WHERE id=? AND store_id=?')
    .bind(status || null, payment_status || null, tracking_link ?? null, c.req.param('id'), store.id).run()
  return json(c, { ok: true })
})
api.put('/owner/enquiries/:id', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  const { status } = await c.req.json()
  await c.env.DB.prepare('UPDATE enquiries SET status=? WHERE id=? AND store_id=?').bind(status, c.req.param('id'), store.id).run()
  return json(c, { ok: true })
})

// ============================================================
// CUSTOMER ACCOUNTS + SUPPORT TICKETS (per store)
// ============================================================
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
async function authCustomer(c: any): Promise<any | null> {
  const cid = Number(c.req.header('X-Customer-Id') || 0)
  const token = c.req.header('X-Customer-Token') || ''
  if (!cid || !token) return null
  const cust = await c.env.DB.prepare('SELECT * FROM customers WHERE id=?').bind(cid).first<any>()
  if (!cust) return null
  const expect = await sha256(cust.id + ':' + cust.password)
  return token === expect ? cust : null
}
function custToken(cust: any) { return sha256(cust.id + ':' + cust.password) }

// Customer signup (scoped to a store)
api.post('/store/:slug/customer/signup', async (c) => {
  const store = await c.env.DB.prepare('SELECT id FROM stores WHERE slug=?').bind(c.req.param('slug')).first<any>()
  if (!store) return json(c, { ok: false, error: 'Store not found' }, 404)
  const b = await c.req.json()
  if (!b.name || !b.email || !b.password) return json(c, { ok: false, error: 'All fields required' }, 400)
  const dup = await c.env.DB.prepare('SELECT id FROM customers WHERE store_id=? AND email=?').bind(store.id, b.email).first()
  if (dup) return json(c, { ok: false, error: 'Email already registered. Please login.' }, 400)
  const pw = await sha256(b.password)
  const r = await c.env.DB.prepare('INSERT INTO customers (store_id,name,email,password,phone) VALUES (?,?,?,?,?)')
    .bind(store.id, b.name, b.email, pw, b.phone || '').run()
  const cust = { id: r.meta.last_row_id, name: b.name, email: b.email, password: pw, phone: b.phone || '' }
  return json(c, { ok: true, customer: { id: cust.id, name: cust.name, email: cust.email }, token: await custToken(cust) })
})

// Customer login
api.post('/store/:slug/customer/login', async (c) => {
  const store = await c.env.DB.prepare('SELECT id FROM stores WHERE slug=?').bind(c.req.param('slug')).first<any>()
  if (!store) return json(c, { ok: false, error: 'Store not found' }, 404)
  const b = await c.req.json()
  const pw = await sha256(b.password || '')
  const cust = await c.env.DB.prepare('SELECT * FROM customers WHERE store_id=? AND email=? AND password=?')
    .bind(store.id, b.email || '', pw).first<any>()
  if (!cust) return json(c, { ok: false, error: 'Invalid email or password' }, 401)
  return json(c, { ok: true, customer: { id: cust.id, name: cust.name, email: cust.email }, token: await custToken(cust) })
})

// Customer auth via Firebase ID token (Email/Password handled on client by Firebase SDK).
// Verifies the token with Google's secure-token API, then creates/links a local customer
// record so orders, tickets and history keep working with the existing token system.
api.post('/store/:slug/customer/firebase', async (c) => {
  const store = await c.env.DB.prepare('SELECT id FROM stores WHERE slug=?').bind(c.req.param('slug')).first<any>()
  if (!store) return json(c, { ok: false, error: 'Store not found' }, 404)
  const b = await c.req.json()
  const idToken = b.idToken || ''
  if (!idToken) return json(c, { ok: false, error: 'Missing token' }, 400)
  // Verify the Firebase ID token via Google's public accounts:lookup endpoint
  const apiKey = 'AIzaSyCwunFhzHPak1xt-UpAevLr2ynaKeVeERE'
  let info: any
  try {
    const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + apiKey, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
    })
    info = await r.json()
  } catch { return json(c, { ok: false, error: 'Auth failed' }, 401) }
  const u = info?.users?.[0]
  if (!u || !u.email) return json(c, { ok: false, error: 'Invalid session' }, 401)
  const email = String(u.email).toLowerCase()
  const name = b.name || u.displayName || email.split('@')[0]
  const uid = u.localId || ''
  // Use the Firebase uid as the stored "password" hash seed → stable per-user token
  const pw = await sha256('fb:' + uid)
  let cust = await c.env.DB.prepare('SELECT * FROM customers WHERE store_id=? AND email=?').bind(store.id, email).first<any>()
  if (!cust) {
    const r = await c.env.DB.prepare('INSERT INTO customers (store_id,name,email,password,phone) VALUES (?,?,?,?,?)')
      .bind(store.id, name, email, pw, b.phone || '').run()
    cust = { id: r.meta.last_row_id, name, email, password: pw, phone: b.phone || '' }
  } else if (cust.password !== pw) {
    await c.env.DB.prepare('UPDATE customers SET password=? WHERE id=?').bind(pw, cust.id).run()
    cust.password = pw
  }
  return json(c, { ok: true, customer: { id: cust.id, name: cust.name, email: cust.email }, token: await custToken(cust) })
})

// Customer: list own orders
api.get('/store/:slug/customer/orders', async (c) => {
  const cust = await authCustomer(c); if (!cust) return json(c, { ok: false }, 401)
  const rows = await c.env.DB.prepare('SELECT id,order_code,total,status,payment_status,tracking_link,items_json,created_at FROM orders WHERE customer_id=? ORDER BY id DESC').bind(cust.id).all()
  return json(c, { ok: true, orders: rows.results })
})

// Customer: create a support ticket (with optional attachment)
api.post('/store/:slug/customer/tickets', async (c) => {
  const cust = await authCustomer(c); if (!cust) return json(c, { ok: false }, 401)
  const b = await c.req.json()
  if (!b.subject || !b.body) return json(c, { ok: false, error: 'Subject and message required' }, 400)
  const t = await c.env.DB.prepare("INSERT INTO tickets (store_id,customer_id,subject,status) VALUES (?,?,?,'open')")
    .bind(cust.store_id, cust.id, b.subject).run()
  const tid = t.meta.last_row_id
  await c.env.DB.prepare('INSERT INTO ticket_messages (ticket_id,sender,body,attach_url,attach_kind) VALUES (?,?,?,?,?)')
    .bind(tid, 'customer', b.body, b.attach_url || '', b.attach_kind || '').run()
  return json(c, { ok: true, ticketId: tid })
})

// Customer: list own tickets + messages
api.get('/store/:slug/customer/tickets', async (c) => {
  const cust = await authCustomer(c); if (!cust) return json(c, { ok: false }, 401)
  const tickets = await c.env.DB.prepare('SELECT * FROM tickets WHERE customer_id=? ORDER BY updated_at DESC').bind(cust.id).all()
  const out: any[] = []
  for (const t of tickets.results as any[]) {
    const msgs = await c.env.DB.prepare('SELECT sender,body,attach_url,attach_kind,created_at FROM ticket_messages WHERE ticket_id=? ORDER BY id').bind(t.id).all()
    out.push({ ...t, messages: msgs.results })
  }
  return json(c, { ok: true, tickets: out })
})

// Customer: reply to own ticket
api.post('/store/:slug/customer/tickets/:id/reply', async (c) => {
  const cust = await authCustomer(c); if (!cust) return json(c, { ok: false }, 401)
  const tid = c.req.param('id')
  const own = await c.env.DB.prepare('SELECT id FROM tickets WHERE id=? AND customer_id=?').bind(tid, cust.id).first()
  if (!own) return json(c, { ok: false }, 404)
  const b = await c.req.json()
  await c.env.DB.prepare('INSERT INTO ticket_messages (ticket_id,sender,body,attach_url,attach_kind) VALUES (?,?,?,?,?)')
    .bind(tid, 'customer', b.body || '', b.attach_url || '', b.attach_kind || '').run()
  await c.env.DB.prepare("UPDATE tickets SET status='open', updated_at=datetime('now') WHERE id=?").bind(tid).run()
  return json(c, { ok: true })
})

// ---- Owner side: view + reply to tickets ----
api.get('/owner/tickets', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  const tickets = await c.env.DB.prepare(
    'SELECT t.*, cu.name AS customer_name, cu.email AS customer_email FROM tickets t JOIN customers cu ON cu.id=t.customer_id WHERE t.store_id=? ORDER BY t.updated_at DESC'
  ).bind(store.id).all()
  const out: any[] = []
  for (const t of tickets.results as any[]) {
    const msgs = await c.env.DB.prepare('SELECT sender,body,attach_url,attach_kind,created_at FROM ticket_messages WHERE ticket_id=? ORDER BY id').bind(t.id).all()
    out.push({ ...t, messages: msgs.results })
  }
  return json(c, { ok: true, tickets: out })
})
api.post('/owner/tickets/:id/reply', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  const tid = c.req.param('id')
  const own = await c.env.DB.prepare('SELECT id FROM tickets WHERE id=? AND store_id=?').bind(tid, store.id).first()
  if (!own) return json(c, { ok: false }, 404)
  const b = await c.req.json()
  await c.env.DB.prepare('INSERT INTO ticket_messages (ticket_id,sender,body,attach_url,attach_kind) VALUES (?,?,?,?,?)')
    .bind(tid, 'owner', b.body || '', b.attach_url || '', b.attach_kind || '').run()
  await c.env.DB.prepare("UPDATE tickets SET status='answered', updated_at=datetime('now') WHERE id=?").bind(tid).run()
  return json(c, { ok: true })
})

// Owner -> platform feature request (logged; forwarded to support email)
api.post('/owner/feature-request', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const b = await c.req.json()
  if (!b.subject || !b.body) return json(c, { ok: false, error: 'Subject and details required' }, 400)
  await c.env.DB.prepare('INSERT INTO feature_requests (owner_id,subject,body,attach_url) VALUES (?,?,?,?)')
    .bind(owner.id, b.subject, b.body, b.attach_url || '').run()
  // The platform support inbox is care@nuvellestudio.store (configured in landing/contact).
  return json(c, { ok: true, message: 'Request received. Our team will reach out from care@nuvellestudio.store.' })
})

// ============================================================
// PUBLIC STOREFRONT
// ============================================================
api.get('/store/:slug', async (c) => {
  const slug = c.req.param('slug')
  const store = await c.env.DB.prepare('SELECT * FROM stores WHERE slug=? AND is_published=1').bind(slug).first<any>()
  if (!store) return json(c, { ok: false, error: 'Store not found' }, 404)
  const products = await c.env.DB.prepare('SELECT * FROM products WHERE store_id=? AND in_stock=1 ORDER BY sort_order,id').bind(store.id).all()
  const categories = await c.env.DB.prepare('SELECT * FROM categories WHERE store_id=? ORDER BY sort_order').bind(store.id).all()
  const coupons = await c.env.DB.prepare('SELECT code,description,discount_type,discount_value FROM coupons WHERE store_id=? AND active=1').bind(store.id).all()
  // Strip secrets before sending to the public storefront.
  const { pay_key_secret, pay_extra, ...safeStore } = store
  safeStore.pay_provider = store.pay_provider || ''
  safeStore.pay_key_id = store.pay_key_id ? 'set' : ''
  return json(c, { ok: true, store: safeStore, products: products.results, categories: categories.results, coupons: coupons.results })
})

api.post('/store/:slug/order', async (c) => {
  const slug = c.req.param('slug')
  const store = await c.env.DB.prepare('SELECT id FROM stores WHERE slug=?').bind(slug).first<any>()
  if (!store) return json(c, { ok: false, error: 'Store not found' }, 404)
  const b = await c.req.json()
  if (!b.customer_name || !Array.isArray(b.items) || b.items.length === 0) return json(c, { ok: false, error: 'Invalid order' }, 400)
  const total = b.items.reduce((s: number, it: any) => s + (it.price * it.qty), 0)
  // Compose a readable address from configurable parts if provided.
  const address = b.address || [b.addr_line, b.landmark, b.pincode].filter(Boolean).join(', ')
  const code = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase()
  const r = await c.env.DB.prepare(`INSERT INTO orders (store_id,customer_id,customer_name,customer_phone,customer_email,address,items_json,total,note,order_code,payment_utr)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(store.id, Number(b.customer_id) || 0, b.customer_name, b.customer_phone || '', b.customer_email || '', address, JSON.stringify(b.items), total, b.note || '', code, b.payment_utr || '').run()
  return json(c, { ok: true, orderId: r.meta.last_row_id, total, order_code: code })
})

// Customer submits UTR / payment reference for a placed order (UPI/bank manual pay)
api.post('/store/:slug/order/:id/utr', async (c) => {
  const store = await c.env.DB.prepare('SELECT id FROM stores WHERE slug=?').bind(c.req.param('slug')).first<any>()
  if (!store) return json(c, { ok: false, error: 'Store not found' }, 404)
  const { utr } = await c.req.json()
  if (!utr) return json(c, { ok: false, error: 'UTR required' }, 400)
  await c.env.DB.prepare("UPDATE orders SET payment_utr=?, payment_status='pending_verify' WHERE id=? AND store_id=?")
    .bind(utr, c.req.param('id'), store.id).run()
  return json(c, { ok: true })
})

// Start an online payment for a placed order using the store's own gateway.
api.post('/store/:slug/pay', async (c) => {
  const slug = c.req.param('slug')
  const store = await c.env.DB.prepare('SELECT * FROM stores WHERE slug=?').bind(slug).first<any>()
  if (!store) return json(c, { ok: false, error: 'Store not found' }, 404)
  if (!store.pay_provider || !store.pay_key_id || !store.pay_key_secret) {
    return json(c, { ok: false, error: 'Online payment not set up for this store' }, 400)
  }
  const { orderId } = await c.req.json()
  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id=? AND store_id=?').bind(orderId, store.id).first<any>()
  if (!order) return json(c, { ok: false, error: 'Order not found' }, 404)
  try {
    const result = await startPayment({
      provider: store.pay_provider,
      keyId: store.pay_key_id,
      keySecret: store.pay_key_secret,
      extra: store.pay_extra || '',
      amount: order.total,
      orderId: order.id,
      storeName: store.name,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      origin: new URL(c.req.url).origin,
      slug
    })
    return json(c, result)
  } catch (e: any) {
    return json(c, { ok: false, error: e.message || 'Payment error' }, 500)
  }
})

// Verify Razorpay payment (called by the checkout popup handler).
api.post('/store/:slug/pay/verify', async (c) => {
  const slug = c.req.param('slug')
  const store = await c.env.DB.prepare('SELECT * FROM stores WHERE slug=?').bind(slug).first<any>()
  if (!store) return json(c, { ok: false }, 404)
  const { orderId, resp } = await c.req.json()
  if (store.pay_provider === 'razorpay' && resp) {
    const ok = await verifyRazorpay(store.pay_key_secret, resp.razorpay_order_id, resp.razorpay_payment_id, resp.razorpay_signature)
    if (ok) {
      await c.env.DB.prepare("UPDATE orders SET payment_status='paid', payment_ref=? WHERE id=? AND store_id=?")
        .bind(resp.razorpay_payment_id, orderId, store.id).run()
      return json(c, { ok: true })
    }
    return json(c, { ok: false, error: 'Signature mismatch' }, 400)
  }
  return json(c, { ok: false, error: 'Unsupported' }, 400)
})

// Hosted-gateway return URL (PayU/Cashfree/PhonePe). Marks paid optimistically
// for redirect gateways and shows a friendly confirmation page.
api.all('/store/:slug/pay/return', async (c) => {
  const slug = c.req.param('slug')
  const orderId = c.req.query('o')
  const failed = c.req.query('f')
  const store = await c.env.DB.prepare('SELECT id,name,slug FROM stores WHERE slug=?').bind(slug).first<any>()
  let status = 'failed'
  if (store && orderId && !failed) {
    await c.env.DB.prepare("UPDATE orders SET payment_status='paid' WHERE id=? AND store_id=?").bind(orderId, store.id).run()
    status = 'success'
  }
  const ok = status === 'success'
  return c.html(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment ${ok ? 'Successful' : 'Failed'}</title><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-slate-50 min-h-screen flex items-center justify-center p-4 font-sans">
    <div class="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center">
      <div class="text-5xl mb-3">${ok ? '✅' : '❌'}</div>
      <h1 class="text-xl font-bold ${ok ? 'text-green-600' : 'text-red-600'}">Payment ${ok ? 'Successful' : 'Failed'}</h1>
      <p class="text-slate-500 mt-2 text-sm">${ok ? 'Thank you! Your order has been confirmed.' : 'Your payment could not be completed.'}</p>
      <a href="/s/${slug}" class="inline-block mt-5 bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-lg">Back to store</a>
    </div>
  </body></html>`)
})

api.post('/store/:slug/enquiry', async (c) => {
  const slug = c.req.param('slug')
  const store = await c.env.DB.prepare('SELECT id FROM stores WHERE slug=?').bind(slug).first<any>()
  if (!store) return json(c, { ok: false, error: 'Store not found' }, 404)
  const b = await c.req.json()
  if (!b.message) return json(c, { ok: false, error: 'Message required' }, 400)
  await c.env.DB.prepare('INSERT INTO enquiries (store_id,name,phone,email,message,source) VALUES (?,?,?,?,?,?)')
    .bind(store.id, b.name || '', b.phone || '', b.email || '', b.message, b.source || 'form').run()
  return json(c, { ok: true })
})

// ============================================================
// AI CHAT (public, per store)
// ============================================================
api.post('/store/:slug/chat', async (c) => {
  const apiKey = c.env.GROQ_API_KEY
  if (!apiKey) return json(c, { ok: false, error: 'AI not configured' }, 503)
  const slug = c.req.param('slug')
  const store = await c.env.DB.prepare('SELECT * FROM stores WHERE slug=?').bind(slug).first<any>()
  if (!store) return json(c, { ok: false, error: 'Store not found' }, 404)
  const products = await c.env.DB.prepare('SELECT name,description,price,sale_price FROM products WHERE store_id=? AND in_stock=1').bind(store.id).all()
  const { messages } = await c.req.json()
  const sys = buildStoreSystemPrompt(store, products.results)
  try {
    const reply = await groqChat(apiKey, [{ role: 'system', content: sys }, ...(messages || [])])
    return json(c, { ok: true, reply })
  } catch (e: any) {
    return json(c, { ok: false, error: e.message }, 500)
  }
})

// ============================================================
// PAYMENTS (SaaS subscription via PayU)  &  store-order payment
// ============================================================
api.post('/pay/subscribe', async (c) => {
  const b = await c.req.json()
  const plans = await getPlans(c.env.DB)
  const plan = plans.find((p) => p.key === b.plan)
  if (!plan || plan.price <= 0) return json(c, { ok: false, error: 'Invalid plan' }, 400)
  const txnid = 'SUB' + Date.now() + Math.floor(Math.random() * 1000)
  await c.env.DB.prepare('INSERT INTO subscriptions (owner_id,plan,amount,txn_id,status) VALUES (?,?,?,?,?)')
    .bind(b.ownerId || 0, plan.key, plan.price, txnid, 'pending').run()

  // Preferred: per-plan hosted payment link set by super-admin (PayU/Cashfree/Razorpay/etc.).
  // Falls back to a global PAYU_PAYMENT_LINK env var if no per-plan link is configured.
  const link = (plan as any).payLink || c.env.PAYU_PAYMENT_LINK
  if (link) {
    return json(c, { ok: true, mode: 'link', url: link, txnid, plan: plan.key, amount: plan.price })
  }

  // Fallback: classic PayU hosted form (requires valid live key+salt).
  const key = c.env.PAYU_KEY, salt = c.env.PAYU_SALT
  if (!key || !salt) return json(c, { ok: false, error: 'Payment not configured' }, 503)
  const origin = new URL(c.req.url).origin
  const req = await buildPayuRequest({
    key, salt, txnid,
    amount: String(plan.price),
    productinfo: `${plan.name} Plan Subscription`,
    firstname: b.firstname || 'Customer',
    email: b.email || 'customer@example.com',
    phone: b.phone || '9999999999',
    surl: `${origin}/api/pay/callback?type=success`,
    furl: `${origin}/api/pay/callback?type=failure`,
    test: false
  })
  return json(c, { ok: true, mode: 'form', ...req, txnid })
})

api.post('/pay/callback', async (c) => {
  const salt = c.env.PAYU_SALT || ''
  const form = await c.req.parseBody()
  const params: Record<string, string> = {}
  for (const k in form) params[k] = String(form[k])
  const valid = salt ? await verifyPayuResponse(salt, params) : false
  const status = params.status === 'success' && valid ? 'success' : 'failed'
  if (params.txnid) {
    await c.env.DB.prepare('UPDATE subscriptions SET status=? WHERE txn_id=?').bind(status, params.txnid).run()
    if (status === 'success') {
      const sub = await c.env.DB.prepare('SELECT * FROM subscriptions WHERE txn_id=?').bind(params.txnid).first<any>()
      if (sub?.owner_id) {
        await c.env.DB.prepare("UPDATE owners SET plan=?, plan_status='active', plan_expires_at=datetime('now','+30 days') WHERE id=?")
          .bind(sub.plan, sub.owner_id).run()
      }
    }
  }
  const origin = new URL(c.req.url).origin
  return c.redirect(`${origin}/?pay=${status}&txn=${params.txnid || ''}`)
})

export default api
