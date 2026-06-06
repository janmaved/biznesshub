# Storenest – Multi-Tenant Online Store & Website Builder (SaaS)

A complete **Shopify-style SaaS platform** that lets any business (restaurant, retail, salon, services) launch a beautiful online store / website in minutes — with online ordering, payments, AI live chat, custom branding, themes and a full self-service admin panel. Built to be **sold to many business owners** from a single deployment.

## 🎯 Project Overview
- **Name**: Storenest
- **Goal**: Sell one product to unlimited business owners. Each owner gets their own store, dashboard and public website. The platform owner (you) controls everything via a Super Admin panel.
- **Business Model**: Subscriptions (7-day free trial → Starter ₹250 → Growth ₹799 → Enterprise/White-Label ₹1999), paid via PayU.

## ✅ Completed Features
### For Business Owners (Admin Panel `/owner`)
- PIN-based signup & login (each owner sets their own PIN)
- Store settings: name, tagline, about, logo, cover, colors, currency, contact, address
- **20+ premium themes** across 5 categories (4–5 per category; lowest plan = 2 themes)
- Products / menu management (CRUD, categories, images, sale price, featured, stock)
- Orders inbox with status management (pending → confirmed → completed/cancelled)
- Enquiries inbox (from contact form + AI chat captures)
- Coupons & offers (percent / flat discounts)
- **Flexible payment setup**: UPI, QR code, bank details, payment link, gateway toggle
- Custom branding, white-label, custom domain field, SEO fields
- Plan & billing (upgrade via PayU), change login PIN

### For Customers (Public Storefront `/s/:slug`)
- Themed, mobile-responsive storefront with hero, menu/products, categories filter
- Shopping cart + online **order booking**
- Enquiry form
- **AI Live Chat Support** (Groq llama-3.3-70b) that knows the store's menu & details
- Payment options shown after order (UPI/QR/bank/link)
- Full **SEO**: meta tags, Open Graph, JSON-LD structured data, canonical URL

### For Platform Owner (Super Admin `/super`)
- Secure PIN login (**default `2005####`**, changeable)
- View all owners, stores, plans, subscriptions & revenue
- **"Unlock Free"** — grant any owner full Enterprise access at no charge (for testing/special deals)
- Change Super Admin PIN anytime

### Payments & AI
- **PayU** integration (server-side SHA-512 hash, secure; test mode enabled)
- **Groq Cloud AI** live chat (keys stored as Cloudflare secrets, never exposed to frontend)

## 🔗 Functional Entry URIs
| Path | Purpose |
|------|---------|
| `/` | Marketing landing page + pricing + buy (PayU) |
| `/owner` (or `/admin`) | Owner signup / login / full dashboard |
| `/super` | Super Admin panel (platform owner) |
| `/s/:slug` | Public storefront for a business (e.g. `/s/demo`) |

### Key API Endpoints
- `GET /api/meta` — plans, themes, categories
- `POST /api/owner/signup` · `POST /api/owner/login`
- `GET /api/owner/dashboard` (headers `X-Owner-Id`, `X-Owner-Pin`)
- `PUT /api/owner/store` · products/categories/coupons CRUD · order/enquiry status
- `GET /api/store/:slug` · `POST /api/store/:slug/order` · `/enquiry` · `/chat`
- `POST /api/super/login` · `/owners` · `/unlock` · `/change-pin`
- `POST /api/pay/subscribe` · `POST /api/pay/callback`

## 🗄️ Data Architecture
- **Storage**: Cloudflare D1 (SQLite, globally distributed)
- **Tables**: `owners`, `stores`, `categories`, `products`, `orders`, `enquiries`, `coupons`, `subscriptions`, `platform_settings`
- **Multi-tenant**: every record is scoped by `owner_id` / `store_id`; owners can only access their own data.

## 👤 User Guide
**Business owner:** Go to `/owner` → Sign Up → choose category → get 7-day trial → add products, pick a theme, set payment details → share your store link `/s/your-slug`.

**Customer:** Visit the store link → browse → add to cart → place order → see payment options, or use AI chat / enquiry form.

**Platform owner (you):** Go to `/super` → enter PIN `2005####` → see all owners → "Unlock Free" gives any owner (or yourself) full free access. Change PIN from the same screen.

> Demo login: `demo@storenest.app` / PIN `1234` · Demo store: `/s/demo`

## 🔐 Secrets (Cloudflare)
Set these in production via `wrangler pages secret put`:
- `PAYU_KEY`, `PAYU_SALT` — PayU credentials
- `GROQ_API_KEY` — Groq Cloud (AI chat)
- `GEMINI_API_KEY` — (reserved for future AI features)

Local dev uses `.dev.vars` (git-ignored).

## 🚀 Deployment
- **Platform**: Cloudflare Pages + Workers
- **Tech Stack**: Hono + TypeScript + Vite + Cloudflare D1 + TailwindCSS (CDN)
- **Status**: ✅ Built & running locally; ready to deploy
- **Local dev**: `npm run build && pm2 start ecosystem.config.cjs` → http://localhost:3000

## 📌 Recommended Next Steps
1. Deploy to Cloudflare Pages and create the production D1 database.
2. Switch PayU to production (`test: false` in `src/api.ts`) once live merchant keys are added.
3. Add image upload (Cloudflare R2) instead of image URLs.
4. Email/WhatsApp notifications to owners on new orders.
5. Connect custom domains per owner (Cloudflare for SaaS).

## 🔄 Last Updated
Built with full working features: multi-tenant stores, ordering, payments, AI chat, themes, admin + super-admin panels, SEO.
