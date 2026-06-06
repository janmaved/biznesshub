const head = (title: string, desc: string) => `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="keywords" content="online store builder, website builder, restaurant ordering, shopify alternative india, small business website, online menu, order booking">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:type" content="website">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛍️</text></svg>">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
`

export function landingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${head('Storenest – Build Your Online Store & Website in Minutes', 'Create a stunning online store, menu and booking website for your business. Online ordering, payments, AI chat support, custom branding & themes. Cheaper & better than Shopify.')}
  <style>
    .gradient-hero{background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#06b6d4 100%);}
    .glass{background:rgba(255,255,255,.08);backdrop-filter:blur(10px);}
    .feature-card:hover{transform:translateY(-6px);}
    .feature-card{transition:.25s}
  </style>
</head>
<body class="bg-slate-50 text-slate-800">
  <!-- NAV -->
  <nav class="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <a href="/" class="font-extrabold text-xl text-indigo-600"><i class="fas fa-store mr-1"></i>Storenest</a>
      <div class="hidden md:flex items-center gap-6 text-sm font-medium">
        <a href="#features" class="hover:text-indigo-600">Features</a>
        <a href="#themes" class="hover:text-indigo-600">Themes</a>
        <a href="#pricing" class="hover:text-indigo-600">Pricing</a>
        <a href="/s/demo" class="hover:text-indigo-600">Live Demo</a>
      </div>
      <div class="flex items-center gap-2">
        <a href="/owner" class="px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg">Login</a>
        <a href="/owner#signup" class="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Start Free</a>
      </div>
    </div>
  </nav>

  <!-- HERO -->
  <header class="gradient-hero text-white pt-28 pb-24 px-4">
    <div class="max-w-5xl mx-auto text-center">
      <span class="glass inline-block px-4 py-1 rounded-full text-sm mb-6">🚀 7-Day Free Trial • No card required</span>
      <h1 class="text-4xl md:text-6xl font-extrabold leading-tight">Your Business Deserves a<br><span class="text-cyan-300">Beautiful Online Store</span></h1>
      <p class="mt-6 text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto">Build a stunning website with online ordering, payments, AI chat support and custom branding — in minutes. No code. No designer. Better & cheaper than Shopify.</p>
      <div class="mt-8 flex flex-wrap gap-3 justify-center">
        <a href="/owner#signup" class="px-8 py-4 bg-white text-indigo-700 font-bold rounded-xl shadow-lg hover:scale-105 transition">Start Building Free <i class="fas fa-arrow-right ml-1"></i></a>
        <a href="/s/demo" class="px-8 py-4 glass text-white font-bold rounded-xl hover:bg-white/20">View Live Demo</a>
      </div>
      <p class="mt-6 text-indigo-200 text-sm">⭐ Trusted approach • Setup in under 5 minutes • Cancel anytime</p>
    </div>
  </header>

  <!-- TRUST STRIP -->
  <div class="bg-white border-b py-6">
    <div class="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      <div><div class="text-3xl font-extrabold text-indigo-600">5 min</div><div class="text-sm text-slate-500">Setup time</div></div>
      <div><div class="text-3xl font-extrabold text-indigo-600">₹250</div><div class="text-sm text-slate-500">Starting price/mo</div></div>
      <div><div class="text-3xl font-extrabold text-indigo-600">20+</div><div class="text-sm text-slate-500">Premium themes</div></div>
      <div><div class="text-3xl font-extrabold text-indigo-600">24/7</div><div class="text-sm text-slate-500">AI chat support</div></div>
    </div>
  </div>

  <!-- FEATURES -->
  <section id="features" class="py-20 px-4 max-w-7xl mx-auto">
    <div class="text-center mb-14">
      <h2 class="text-3xl md:text-4xl font-extrabold">Everything you need to sell online</h2>
      <p class="mt-3 text-slate-500 max-w-2xl mx-auto">A complete toolkit that beats expensive platforms — all manageable from one simple dashboard.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" id="featureGrid"></div>
  </section>

  <!-- THEMES -->
  <section id="themes" class="py-20 px-4 bg-white">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-extrabold">Stunning themes for every business</h2>
        <p class="mt-3 text-slate-500">4–5 premium designs per category. Switch anytime with one click.</p>
      </div>
      <div id="themeGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"></div>
    </div>
  </section>

  <!-- PRICING -->
  <section id="pricing" class="py-20 px-4 max-w-7xl mx-auto">
    <div class="text-center mb-14">
      <h2 class="text-3xl md:text-4xl font-extrabold">Simple, honest pricing</h2>
      <p class="mt-3 text-slate-500">Start free. Upgrade when you grow. Cancel anytime.</p>
    </div>
    <div id="pricingGrid" class="grid md:grid-cols-2 lg:grid-cols-4 gap-6"></div>
  </section>

  <!-- CTA -->
  <section class="gradient-hero text-white py-20 px-4 text-center">
    <h2 class="text-3xl md:text-4xl font-extrabold">Ready to grow your business?</h2>
    <p class="mt-3 text-indigo-100">Join now and get your store live today.</p>
    <a href="/owner#signup" class="mt-8 inline-block px-10 py-4 bg-white text-indigo-700 font-bold rounded-xl shadow-lg hover:scale-105 transition">Start 7-Day Free Trial</a>
  </section>

  <footer class="bg-slate-900 text-slate-400 py-10 px-4 text-center text-sm">
    <p class="font-bold text-white text-lg mb-2"><i class="fas fa-store"></i> Storenest</p>
    <p>Build your online store, menu & booking website. © ${new Date().getFullYear()} Storenest.</p>
    <p class="mt-3"><a href="/owner" class="hover:text-white">Owner Login</a> · <a href="/super" class="hover:text-white">Admin</a> · <a href="/s/demo" class="hover:text-white">Demo</a></p>
  </footer>

  <!-- BUY MODAL -->
  <div id="buyModal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-md w-full p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">Subscribe to <span id="buyPlanName"></span></h3>
        <button onclick="closeBuy()" class="text-slate-400 hover:text-slate-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <p class="text-slate-500 text-sm mb-4">Enter your details. You'll be redirected to secure PayU payment.</p>
      <form id="buyForm" class="space-y-3">
        <input id="buyName" placeholder="Your name" class="w-full border rounded-lg px-3 py-2" required>
        <input id="buyEmail" type="email" placeholder="Email" class="w-full border rounded-lg px-3 py-2" required>
        <input id="buyPhone" placeholder="Phone" class="w-full border rounded-lg px-3 py-2" required>
        <input id="buyOwnerId" type="number" placeholder="Your Owner ID (from dashboard)" class="w-full border rounded-lg px-3 py-2">
        <div class="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
          <span>Amount</span><span class="font-bold text-indigo-600" id="buyAmount"></span>
        </div>
        <button class="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700"><i class="fas fa-lock mr-1"></i> Pay Securely</button>
        <p id="buyMsg" class="text-sm text-center"></p>
      </form>
    </div>
  </div>

<script>
let META = { plans: [], themes: [], categories: [] };
let selectedPlan = null;

const FEATURES = [
  ['fa-store','Online Store & Menu','Showcase products or menu with images, prices and categories. Customers browse beautifully on any device.'],
  ['fa-cart-shopping','Order Booking','Customers place orders directly. You get instant notifications in your dashboard.'],
  ['fa-robot','AI Live Chat Support','24/7 AI assistant answers customer questions and captures enquiries automatically.'],
  ['fa-indian-rupee-sign','Flexible Payments','UPI, QR code, bank details, payment links or full PayU gateway — your choice.'],
  ['fa-palette','20+ Premium Themes','Gorgeous designs for restaurants, retail, salons & services. Switch instantly.'],
  ['fa-tags','Coupons & Offers','Create discount codes and promos to boost sales and conversions.'],
  ['fa-paint-roller','Custom Branding','Your logo, colours & white-label. Make it 100% yours.'],
  ['fa-globe','Custom Domain','Connect your own domain or host anywhere. Total flexibility.'],
  ['fa-magnifying-glass-chart','SEO Optimized','Built-in SEO so customers find you on Google.'],
];

function renderFeatures(){
  document.getElementById('featureGrid').innerHTML = FEATURES.map(f=>\`
    <div class="feature-card bg-white border rounded-2xl p-6 shadow-sm">
      <div class="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl mb-4"><i class="fas \${f[0]}"></i></div>
      <h3 class="font-bold text-lg mb-1">\${f[1]}</h3>
      <p class="text-slate-500 text-sm">\${f[2]}</p>
    </div>\`).join('');
}

function renderThemes(){
  document.getElementById('themeGrid').innerHTML = META.themes.slice(0,12).map(t=>\`
    <div class="rounded-xl overflow-hidden border shadow-sm bg-white">
      <div class="h-28 flex items-center justify-center text-white font-bold" style="background:\${t.preview}">\${t.name}</div>
      <div class="p-3">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-sm">\${t.name}</span>
          \${t.premium?'<span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Premium</span>':'<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Free</span>'}
        </div>
        <p class="text-xs text-slate-500 mt-1 capitalize">\${t.category} · \${t.description}</p>
      </div>
    </div>\`).join('');
}

function renderPricing(){
  document.getElementById('pricingGrid').innerHTML = META.plans.map(p=>\`
    <div class="relative rounded-2xl border-2 \${p.popular?'border-indigo-500 shadow-xl':'border-slate-200'} bg-white p-6 flex flex-col">
      \${p.popular?'<span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>':''}
      <h3 class="font-bold text-lg">\${p.name}</h3>
      <p class="text-slate-500 text-sm mb-4">\${p.tagline}</p>
      <div class="mb-4"><span class="text-3xl font-extrabold">\${p.price===0?'Free':'₹'+p.price}</span><span class="text-slate-400 text-sm">/\${p.period}</span></div>
      <ul class="space-y-2 text-sm flex-1">\${p.features.map(f=>'<li class="flex gap-2"><i class="fas fa-check text-green-500 mt-0.5"></i><span>'+f+'</span></li>').join('')}</ul>
      \${p.price===0
        ? '<a href="/owner#signup" class="mt-5 block text-center bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900">Start Free Trial</a>'
        : '<button onclick=\\'openBuy("'+p.key+'")\\' class="mt-5 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700">Subscribe</button>'}
    </div>\`).join('');
}

function openBuy(key){
  selectedPlan = META.plans.find(p=>p.key===key);
  document.getElementById('buyPlanName').textContent = selectedPlan.name;
  document.getElementById('buyAmount').textContent = '₹'+selectedPlan.price;
  document.getElementById('buyMsg').textContent='';
  const m=document.getElementById('buyModal'); m.classList.remove('hidden'); m.classList.add('flex');
}
function closeBuy(){const m=document.getElementById('buyModal'); m.classList.add('hidden'); m.classList.remove('flex');}

document.getElementById('buyForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const msg=document.getElementById('buyMsg'); msg.textContent='Processing...'; msg.className='text-sm text-center text-slate-500';
  try{
    const {data}=await axios.post('/api/pay/subscribe',{
      plan:selectedPlan.key,
      firstname:document.getElementById('buyName').value,
      email:document.getElementById('buyEmail').value,
      phone:document.getElementById('buyPhone').value,
      ownerId:Number(document.getElementById('buyOwnerId').value)||0
    });
    if(!data.ok){ msg.textContent=data.error; msg.className='text-sm text-center text-red-500'; return; }
    // auto-submit to PayU
    const form=document.createElement('form'); form.method='POST'; form.action=data.action;
    for(const k in data.fields){ const i=document.createElement('input'); i.type='hidden'; i.name=k; i.value=data.fields[k]; form.appendChild(i); }
    document.body.appendChild(form); form.submit();
  }catch(err){ msg.textContent='Payment not configured yet. Please contact admin.'; msg.className='text-sm text-center text-red-500'; }
});

// payment return banner
const ps=new URLSearchParams(location.search).get('pay');
if(ps){ const b=document.createElement('div'); b.className='fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg font-semibold text-white '+(ps==='success'?'bg-green-600':'bg-red-600'); b.textContent= ps==='success'?'✅ Payment successful! Your plan is active.':'❌ Payment failed or cancelled.'; document.body.appendChild(b); setTimeout(()=>b.remove(),6000); }

(async ()=>{
  const {data}=await axios.get('/api/meta'); META=data;
  renderFeatures(); renderThemes(); renderPricing();
})();
</script>
</body>
</html>`
}
