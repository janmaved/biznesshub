import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types'
import api from './api'
import { landingPage } from './pages/landing'
import { ownerApp } from './pages/owner'
import { superApp } from './pages/super'
import { storefrontPage } from './pages/storefront'
import { ensureBootstrap } from './bootstrap'

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))

// Auto-create schema + seed on a fresh D1 so the app works right after deploy.
app.use('*', async (c, next) => {
  try { if (c.env?.DB) await ensureBootstrap(c.env.DB) } catch { /* non-fatal */ }
  await next()
})

// API
app.route('/api', api)

// Hosts that always serve the main SaaS app (never a tenant storefront).
const PLATFORM_HOSTS = ['storenest.app', 'www.storenest.app', 'localhost', '127.0.0.1']
function isPlatformHost(host: string): boolean {
  const h = (host || '').split(':')[0].toLowerCase()
  if (!h) return true
  if (PLATFORM_HOSTS.includes(h)) return true
  if (h.endsWith('.pages.dev') || h.endsWith('.workers.dev') || h.includes('sandbox') || h.endsWith('.e2b.dev') || h.endsWith('.novita.ai')) return true
  return false
}
async function findStoreByHost(c: any, host: string): Promise<any | null> {
  const h = (host || '').split(':')[0].toLowerCase().replace(/\.$/, '')
  // Match both apex (example.com) and www (www.example.com) for custom domains.
  const bare = h.replace(/^www\./, '')
  const wwwed = 'www.' + bare
  const sub = h.endsWith('.storenest.app') ? h.replace('.storenest.app', '') : ''
  // Match the saved custom_domain whether the visitor used apex or www, and
  // whether the owner saved it with or without the www prefix.
  return await c.env.DB.prepare(
    `SELECT s.*, o.plan AS owner_plan FROM stores s LEFT JOIN owners o ON o.id = s.owner_id
     WHERE s.is_published=1 AND (s.custom_domain=? OR s.custom_domain=? OR s.custom_domain=? OR (?<>'' AND s.subdomain=?)) LIMIT 1`
  ).bind(h, bare, wwwed, sub, sub).first<any>()
}

// Root: tenant storefront on custom domain / subdomain, else SaaS landing.
app.get('/', async (c) => {
  const host = c.req.header('host') || ''
  if (!isPlatformHost(host)) {
    const store = await findStoreByHost(c, host)
    if (store) return c.html(storefrontPage(store))
  }
  return c.html(landingPage())
})

// Favicon (inline SVG) — avoids a noisy 404/500 on every page load.
app.get('/favicon.ico', (c) =>
  c.body(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#4f46e5"/><text x="32" y="44" font-size="38" font-family="Arial" font-weight="bold" fill="#fff" text-anchor="middle">S</text></svg>',
    200,
    { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' }
  )
)

// Owner login / signup / dashboard (single SPA shell)
app.get('/owner', (c) => c.html(ownerApp()))
app.get('/admin', (c) => c.html(ownerApp()))

// Super admin
app.get('/super', (c) => c.html(superApp()))

// Public storefront: /s/:slug
app.get('/s/:slug', async (c) => {
  const slug = c.req.param('slug')
  const store = await c.env.DB.prepare(
    `SELECT s.*, o.plan AS owner_plan FROM stores s LEFT JOIN owners o ON o.id = s.owner_id WHERE s.slug=? AND s.is_published=1`
  ).bind(slug).first<any>()
  if (!store) {
    return c.html('<h1 style="font-family:sans-serif;text-align:center;margin-top:80px">Store not found</h1>', 404)
  }
  return c.html(storefrontPage(store))
})

export default app
