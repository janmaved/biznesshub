import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types'
import api from './api'
import { landingPage } from './pages/landing'
import { ownerApp } from './pages/owner'
import { superApp } from './pages/super'
import { storefrontPage } from './pages/storefront'

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))

// API
app.route('/api', api)

// Landing page (SaaS marketing + plans + buy)
app.get('/', (c) => c.html(landingPage()))

// Owner login / signup / dashboard (single SPA shell)
app.get('/owner', (c) => c.html(ownerApp()))
app.get('/admin', (c) => c.html(ownerApp()))

// Super admin
app.get('/super', (c) => c.html(superApp()))

// Public storefront: /s/:slug
app.get('/s/:slug', async (c) => {
  const slug = c.req.param('slug')
  const store = await c.env.DB.prepare('SELECT * FROM stores WHERE slug=? AND is_published=1').bind(slug).first<any>()
  if (!store) {
    return c.html('<h1 style="font-family:sans-serif;text-align:center;margin-top:80px">Store not found</h1>', 404)
  }
  return c.html(storefrontPage(store))
})

export default app
