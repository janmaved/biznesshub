export type Bindings = {
  DB: D1Database;
  // Secrets (set via wrangler secret put or .dev.vars)
  PAYU_KEY?: string;
  PAYU_SALT?: string;
  PAYU_PAYMENT_LINK?: string; // hosted PayU payment link (u.payu.in/...) for real subscription payments
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  RESEND_API_KEY?: string; // optional: forwards support tickets to care@nuvellestudio.store
};

export const BRAND = 'Storenest';

export interface PlanDef {
  key: string;
  name: string;
  price: number;        // INR
  mrp?: number;         // strike-through original price for offer display
  deal?: string;        // deal badge text
  period: string;
  tagline: string;
  features: string[];
  themesAllowed: number;
  popular?: boolean;
  payLink?: string;     // per-plan hosted payment link (PayU/Cashfree/Razorpay/etc.)
}

export const PLANS: PlanDef[] = [
  {
    key: 'trial',
    name: '7-Day Free Trial',
    price: 0,
    period: '7 days',
    tagline: 'Try everything, risk free',
    features: ['All features unlocked', 'Up to 2 themes', 'Online ordering', 'AI chat support', 'No credit card needed'],
    themesAllowed: 2
  },
  {
    key: 'starter',
    name: 'Starter',
    price: 99,
    mrp: 499,
    period: 'month',
    tagline: 'Cheapest online store anywhere — start in minutes',
    deal: '🔥 80% OFF Launch Deal',
    features: ['Your own online store / menu', 'Free subdomain: yourstore.storenest.app', 'Order booking + enquiry inbox', '2 premium themes', 'UPI / QR payments', 'Basic SEO', 'Coupons & offers'],
    themesAllowed: 2
  },
  {
    key: 'growth',
    name: 'Growth',
    price: 249,
    mrp: 999,
    period: 'month',
    tagline: 'Everything to grow — beats apps costing 10x more',
    deal: '⭐ Most Popular · 75% OFF',
    features: ['Everything in Starter', 'Connect your OWN custom domain', 'All 21 premium themes', 'AI live chat support', 'Your own payment gateway (Razorpay/PayU/Cashfree/PhonePe)', 'White-label (no Storenest branding)', 'Advanced SEO', 'Priority support', 'Free feature requests'],
    themesAllowed: 99,
    popular: true
  },
  {
    key: 'enterprise',
    name: 'Enterprise / White-Label',
    price: 599,
    mrp: 2999,
    period: 'month',
    tagline: 'For large brands & resellers — unbeatable value',
    deal: '💎 80% OFF · Limited',
    features: ['Everything in Growth', 'Custom domain + priority connect', 'Full white-label & reseller rights', 'Unlimited products', 'Dedicated support manager', 'Custom feature builds', 'Hosting flexibility'],
    themesAllowed: 99
  }
];

export interface ThemeDef {
  key: string;
  name: string;
  category: string;
  premium: boolean;
  preview: string;
  description: string;
}

// 4-5 themes per category. Lowest plan gets 2 (non-premium) themes.
export const THEMES: ThemeDef[] = [
  // Restaurant
  { key: 'aurora', name: 'Aurora', category: 'restaurant', premium: false, preview: '#e11d48', description: 'Warm, appetising hero with menu grid' },
  { key: 'bistro', name: 'Bistro', category: 'restaurant', premium: false, preview: '#b45309', description: 'Classic dark elegant dining look' },
  { key: 'fresco', name: 'Fresco', category: 'restaurant', premium: true, preview: '#16a34a', description: 'Bright fresh organic vibe' },
  { key: 'royale', name: 'Royale', category: 'restaurant', premium: true, preview: '#7c3aed', description: 'Luxury fine-dining premium feel' },
  { key: 'streeteats', name: 'Street Eats', category: 'restaurant', premium: true, preview: '#ea580c', description: 'Trendy bold street-food energy' },
  // Retail
  { key: 'shopwave', name: 'ShopWave', category: 'retail', premium: false, preview: '#2563eb', description: 'Clean modern e-commerce grid' },
  { key: 'marketly', name: 'Marketly', category: 'retail', premium: false, preview: '#0891b2', description: 'Friendly marketplace style' },
  { key: 'luxe', name: 'Luxe', category: 'retail', premium: true, preview: '#1f2937', description: 'Minimal premium boutique' },
  { key: 'vibrant', name: 'Vibrant', category: 'retail', premium: true, preview: '#db2777', description: 'Colourful playful storefront' },
  { key: 'noir', name: 'Noir', category: 'retail', premium: true, preview: '#0f172a', description: 'Sleek dark high-end fashion' },
  // Salon / Beauty
  { key: 'glow', name: 'Glow', category: 'salon', premium: false, preview: '#db2777', description: 'Soft elegant beauty layout' },
  { key: 'blush', name: 'Blush', category: 'salon', premium: false, preview: '#f43f5e', description: 'Feminine pastel salon look' },
  { key: 'velvet', name: 'Velvet', category: 'salon', premium: true, preview: '#9333ea', description: 'Rich luxurious spa feel' },
  { key: 'serene', name: 'Serene', category: 'salon', premium: true, preview: '#14b8a6', description: 'Calm wellness & spa theme' },
  // Services
  { key: 'prolaunch', name: 'ProLaunch', category: 'services', premium: false, preview: '#4f46e5', description: 'Professional service landing' },
  { key: 'consult', name: 'Consult', category: 'services', premium: false, preview: '#0284c7', description: 'Trusted consultancy style' },
  { key: 'agency', name: 'Agency', category: 'services', premium: true, preview: '#7c3aed', description: 'Bold creative agency look' },
  { key: 'craft', name: 'Craft', category: 'services', premium: true, preview: '#ca8a04', description: 'Handmade artisan feel' },
  // General
  { key: 'minimal', name: 'Minimal', category: 'general', premium: false, preview: '#334155', description: 'Simple universal layout' },
  { key: 'spark', name: 'Spark', category: 'general', premium: false, preview: '#0d9488', description: 'Energetic general business' },
  { key: 'prism', name: 'Prism', category: 'general', premium: true, preview: '#8b5cf6', description: 'Gradient modern premium' },
];

export const CATEGORIES = [
  { key: 'restaurant', label: 'Restaurant / Cafe / Food' },
  { key: 'retail', label: 'Retail / Shop / Store' },
  { key: 'salon', label: 'Salon / Beauty / Spa' },
  { key: 'services', label: 'Services / Professional' },
  { key: 'general', label: 'General / Other' },
];
