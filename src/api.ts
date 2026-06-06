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

async function getOwnerStore(db: D1Database, ownerId: number) {
  return await db.prepare('SELECT * FROM stores WHERE owner_id=?').bind(ownerId).first<any>()
}

// ============================================================
// META: plans, themes, categories
// ============================================================
api.get('/meta', (c) => json(c, { plans: PLANS, themes: THEMES, categories: CATEGORIES }))

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
    SELECT o.*, s.name as store_name, s.slug as store_slug
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
    'pay_provider','pay_key_id','pay_key_secret','pay_extra',
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
  const r = await c.env.DB.prepare(`INSERT INTO products (store_id,category_id,name,description,price,sale_price,image_url,in_stock,is_featured,sort_order)
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .bind(store.id, b.category_id || null, b.name, b.description || '', b.price || 0, b.sale_price || null, b.image_url || '', b.in_stock ? 1 : 0, b.is_featured ? 1 : 0, b.sort_order || 0).run()
  return json(c, { ok: true, id: r.meta.last_row_id })
})
api.put('/owner/products/:id', async (c) => {
  const owner = await authOwner(c); if (!owner) return json(c, { ok: false }, 401)
  const store = await getOwnerStore(c.env.DB, owner.id)
  const b = await c.req.json()
  await c.env.DB.prepare(`UPDATE products SET category_id=?,name=?,description=?,price=?,sale_price=?,image_url=?,in_stock=?,is_featured=?
    WHERE id=? AND store_id=?`)
    .bind(b.category_id || null, b.name, b.description || '', b.price || 0, b.sale_price || null, b.image_url || '', b.in_stock ? 1 : 0, b.is_featured ? 1 : 0, c.req.param('id'), store.id).run()
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
  const { status, payment_status } = await c.req.json()
  await c.env.DB.prepare('UPDATE orders SET status=COALESCE(?,status), payment_status=COALESCE(?,payment_status) WHERE id=? AND store_id=?')
    .bind(status || null, payment_status || null, c.req.param('id'), store.id).run()
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
  const r = await c.env.DB.prepare(`INSERT INTO orders (store_id,customer_name,customer_phone,customer_email,address,items_json,total,note)
    VALUES (?,?,?,?,?,?,?,?)`)
    .bind(store.id, b.customer_name, b.customer_phone || '', b.customer_email || '', b.address || '', JSON.stringify(b.items), total, b.note || '').run()
  return json(c, { ok: true, orderId: r.meta.last_row_id, total })
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
  const plan = PLANS.find((p) => p.key === b.plan)
  if (!plan || plan.price <= 0) return json(c, { ok: false, error: 'Invalid plan' }, 400)
  const txnid = 'SUB' + Date.now() + Math.floor(Math.random() * 1000)
  await c.env.DB.prepare('INSERT INTO subscriptions (owner_id,plan,amount,txn_id,status) VALUES (?,?,?,?,?)')
    .bind(b.ownerId || 0, plan.key, plan.price, txnid, 'pending').run()

  // Preferred: hosted PayU payment link (real, working payment page).
  const link = c.env.PAYU_PAYMENT_LINK
  if (link) {
    return json(c, { ok: true, mode: 'link', url: link, txnid })
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
