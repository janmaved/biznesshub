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
        <a href="#faq" class="hover:text-indigo-600">FAQ</a>
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
      <h1 id="heroTitle" class="text-4xl md:text-6xl font-extrabold leading-tight">Your Business Deserves a<br><span class="text-cyan-300">Beautiful Online Store</span></h1>
      <p id="heroSubtitle" class="mt-6 text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto">Build a stunning website with online ordering, payments, AI chat support and custom branding — in minutes. No code. No designer. Better & cheaper than Shopify.</p>
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
      <div><div class="text-3xl font-extrabold text-indigo-600">₹99</div><div class="text-sm text-slate-500">Starting price/mo</div></div>
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

  <!-- FAQ -->
  <section id="faq" class="py-20 px-4 bg-white">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-extrabold">Frequently Asked Questions</h2>
        <p class="mt-3 text-slate-500">Everything you need to know about Storenest.</p>
      </div>
      <div id="faqList" class="space-y-3"></div>
      <div class="text-center mt-10 text-slate-500 text-sm">Still have a question? <a href="/owner#signup" class="text-indigo-600 font-semibold hover:underline">Start free</a> and ask us inside your dashboard.</div>
    </div>
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
    <div class="relative rounded-2xl border-2 \${p.popular?'border-indigo-500 shadow-xl scale-[1.02]':'border-slate-200'} bg-white p-6 flex flex-col">
      \${p.popular?'<span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>':''}
      \${p.deal?'<span class="self-start mb-2 bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full">'+p.deal+'</span>':''}
      <h3 class="font-bold text-lg">\${p.name}</h3>
      <p class="text-slate-500 text-sm mb-4">\${p.tagline}</p>
      <div class="mb-1">\${p.price===0?'<span class="text-3xl font-extrabold">Free</span>':(p.mrp?'<span class="text-slate-400 line-through text-lg mr-2">₹'+p.mrp+'</span>':'')+'<span class="text-3xl font-extrabold">₹'+p.price+'</span><span class="text-slate-400 text-sm">/'+p.period+'</span>'}</div>
      \${p.mrp&&p.price>0?'<p class="text-xs text-green-600 font-semibold mb-3">You save ₹'+(p.mrp-p.price)+' — best price anywhere</p>':'<div class="mb-3"></div>'}
      <ul class="space-y-2 text-sm flex-1">\${p.features.map(f=>'<li class="flex gap-2"><i class="fas fa-check text-green-500 mt-0.5"></i><span>'+f+'</span></li>').join('')}</ul>
      \${p.price===0
        ? '<a href="/owner#signup" class="mt-5 block text-center bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900">Start Free Trial</a>'
        : '<button onclick=\\'openBuy("'+p.key+'")\\' class="mt-5 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700">Get '+p.name+' →</button>'}
    </div>\`).join('');
}

var FAQS=[
  {q:'What is Storenest?',a:'Storenest is an all-in-one website & online store builder. In minutes you can launch your own branded store, menu or booking site with online ordering, payments, coupons, AI chat support and 20+ premium themes — no coding or designer needed.'},
  {q:'Do I need a credit card to start?',a:'No. You get a 7-day free trial with all features unlocked and no card required. Add a paid plan only when you are ready to grow.'},
  {q:'How much does it cost?',a:'Plans start at just ₹99/month. The Starter plan (with a launch discount) gives you your own online store, a free subdomain (yourstore.storenest.app), order booking and an enquiry inbox. You can upgrade or cancel anytime.'},
  {q:'Can I use my own domain name?',a:'Yes. On paid plans you can connect your own custom domain (like yourbusiness.com). We give you the exact DNS records to add, and a one-click verify button confirms when it is live.'},
  {q:'How do payments work for my customers?',a:'Storenest integrates secure online payments via PayU so your customers can pay you directly. Payments are verified server-side, so an order is only confirmed once the payment genuinely succeeds.'},
  {q:'Can I create discount coupons?',a:'Absolutely. From your owner dashboard you can create coupons (percent or flat amount). Customers see the available coupons in your store and can apply them right at checkout.'},
  {q:'Will my store look professional?',a:'Yes. Choose from 20+ premium themes with distinct layouts (grid, magazine, showcase and more), custom colours, banners and product detail pages — designed to look like a high-end Shopify store.'},
  {q:'Do you offer customer support?',a:'Every store includes a built-in 24/7 AI chat assistant for your customers, plus an enquiry inbox so you never miss a lead. Owners can also send feature requests from the dashboard.'},
  {q:'Is my data safe?',a:'Yes. Storenest runs on Cloudflare’s global secure infrastructure with isolated data per store. Your customers’ and your business data stay private and protected.'},
  {q:'Can I cancel anytime?',a:'Yes, there are no lock-in contracts. You can cancel whenever you like and keep your store running until the end of your billing period.'}
];
function renderFaq(){
  var el=document.getElementById('faqList'); if(!el)return;
  el.innerHTML=FAQS.map(function(f,i){return '<details class="group border rounded-xl px-5 py-4 bg-slate-50 hover:bg-white transition">'+
    '<summary class="flex items-center justify-between cursor-pointer font-semibold text-slate-800 list-none">'+
    '<span>'+f.q+'</span><i class="fas fa-chevron-down text-slate-400 group-open:rotate-180 transition"></i></summary>'+
    '<p class="mt-3 text-slate-600 text-sm leading-relaxed">'+f.a+'</p></details>';}).join('');
}
function getOwnerAcct(){ try{ return JSON.parse(localStorage.getItem('sb_owner')||'null'); }catch(e){ return null; } }
function openBuy(key){
  selectedPlan = META.plans.find(p=>p.key===key);
  const acct = getOwnerAcct();
  // Signup-first: you must have an owner account before buying a plan.
  if(!acct || !acct.id){
    const m=document.getElementById('buyModal');
    document.querySelector('#buyModal .bg-white').innerHTML =
      '<div class="text-center p-2"><div class="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl mx-auto mb-3"><i class="fas fa-user-plus"></i></div>'+
      '<h3 class="text-xl font-bold mb-1">Create a free account first</h3>'+
      '<p class="text-slate-500 text-sm mb-4">To buy the <b>'+selectedPlan.name+'</b> plan you need a Storenest account. Sign up free (no card), then buy the plan from your dashboard \u2192 Plan & Billing.</p>'+
      '<a href="/owner#signup" class="block w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 mb-2">Create Free Account \u2192</a>'+
      '<a href="/owner" class="block w-full border border-slate-300 font-semibold py-2.5 rounded-lg hover:bg-slate-50">I already have an account \u2014 Login</a>'+
      '<button onclick="closeBuy()" class="mt-3 text-sm text-slate-400 hover:text-slate-600">Cancel</button></div>';
    m.classList.remove('hidden'); m.classList.add('flex'); return;
  }
  document.getElementById('buyPlanName').textContent = selectedPlan.name;
  document.getElementById('buyAmount').textContent = '₹'+selectedPlan.price;
  document.getElementById('buyMsg').textContent='';
  var bn=document.getElementById('buyName'); if(bn)bn.value=acct.name||'';
  var be=document.getElementById('buyEmail'); if(be)be.value=acct.email||'';
  var bo=document.getElementById('buyOwnerId'); if(bo){bo.value=acct.id; bo.type='hidden';}
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
    if(data.mode==='link' && data.url){ msg.textContent='Redirecting to secure payment...'; window.location.href=data.url; return; }
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
  if(META.site){
    if(META.site.hero_title){ const e=document.getElementById('heroTitle'); if(e) e.textContent=META.site.hero_title; }
    if(META.site.hero_subtitle){ const e=document.getElementById('heroSubtitle'); if(e) e.textContent=META.site.hero_subtitle; }
  }
  renderFeatures(); renderThemes(); renderPricing(); renderFaq();
})();

// ===== HELP / SUPPORT CHATBOT (platform) =====
(function(){
  const wrap=document.createElement('div'); wrap.innerHTML=
  '<button id="hsBtn" class="fixed bottom-5 right-5 z-50 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-xl text-xl flex items-center justify-center hover:bg-indigo-700"><i class="fas fa-headset"></i></button>'+
  '<div id="hsBox" class="fixed bottom-24 right-5 z-50 w-80 max-w-[92vw] bg-white rounded-2xl shadow-2xl hidden flex-col border" style="height:460px">'+
    '<div class="bg-indigo-600 text-white p-3 rounded-t-2xl flex justify-between items-center"><span class="font-bold"><i class="fas fa-headset mr-1"></i> Storenest Help</span><button id="hsClose"><i class="fas fa-times"></i></button></div>'+
    '<div id="hsBody" class="flex-1 overflow-y-auto p-3 text-sm"></div>'+
  '</div>';
  document.body.appendChild(wrap);
  const box=document.getElementById('hsBox');
  document.getElementById('hsBtn').onclick=()=>{ box.classList.toggle('hidden'); box.classList.toggle('flex'); if(box.classList.contains('flex')) hsRender(); };
  document.getElementById('hsClose').onclick=()=>{ box.classList.add('hidden'); box.classList.remove('flex'); };
  window.hsState=JSON.parse(localStorage.getItem('hs_ticket')||'null');
  window.hsRender=function(){
    const b=document.getElementById('hsBody');
    if(!window.hsState){
      b.innerHTML='<p class="text-slate-500 mb-3">Hi! 👋 Ask us anything about Storenest, pricing, domains or get support. We reply from <b>care@nuvellestudio.store</b>.</p>'+
        '<input id="hsName" placeholder="Your name" class="w-full border rounded-lg px-3 py-2 mb-2">'+
        '<input id="hsEmail" type="email" placeholder="Your email *" class="w-full border rounded-lg px-3 py-2 mb-2">'+
        '<input id="hsSub" placeholder="Subject *" class="w-full border rounded-lg px-3 py-2 mb-2">'+
        '<textarea id="hsMsg" rows="3" placeholder="How can we help? *" class="w-full border rounded-lg px-3 py-2 mb-2"></textarea>'+
        '<button onclick="hsSend()" class="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg">Send message</button><p id="hsErr" class="text-sm text-center mt-2"></p>';
    } else { hsLoadThread(); }
  };
  window.hsSend=async function(){
    const email=document.getElementById('hsEmail').value, subject=document.getElementById('hsSub').value, body=document.getElementById('hsMsg').value;
    if(!email||!subject||!body){ document.getElementById('hsErr').textContent='Email, subject & message required'; document.getElementById('hsErr').className='text-sm text-center text-red-500'; return; }
    const {data}=await axios.post('/api/support/ticket',{name:document.getElementById('hsName').value,email,subject,body});
    if(data.ok){ window.hsState={id:data.ticketId,email}; localStorage.setItem('hs_ticket',JSON.stringify(window.hsState)); hsLoadThread(); }
  };
  window.hsLoadThread=async function(){
    const b=document.getElementById('hsBody'); b.innerHTML='Loading...';
    const {data}=await axios.get('/api/support/ticket/'+window.hsState.id+'?email='+encodeURIComponent(window.hsState.email));
    if(!data.ok){ window.hsState=null; localStorage.removeItem('hs_ticket'); hsRender(); return; }
    b.innerHTML='<p class="text-xs text-slate-400 mb-2">Ticket #'+data.ticket.id+' · '+data.ticket.status+'</p>'+
      '<div class="space-y-2 mb-3">'+data.ticket.messages.map(m=>'<div class="'+(m.sender==='user'?'text-right':'text-left')+'"><span class="inline-block px-3 py-2 rounded-2xl '+(m.sender==='user'?'bg-indigo-600 text-white':'bg-slate-100')+'" style="max-width:85%">'+(m.body||'')+'</span><p class="text-[10px] text-slate-400">'+(m.sender==='user'?'You':'Storenest')+'</p></div>').join('')+'</div>'+
      '<div class="flex gap-2"><input id="hsReply" placeholder="Reply..." class="flex-1 border rounded-lg px-3 py-2"><button onclick="hsReplySend()" class="bg-indigo-600 text-white px-3 rounded-lg">Send</button></div>'+
      '<button onclick="localStorage.removeItem(\\'hs_ticket\\');window.hsState=null;hsRender()" class="text-xs text-slate-400 underline mt-2">New conversation</button>';
  };
  window.hsReplySend=async function(){
    const v=document.getElementById('hsReply').value; if(!v)return;
    await axios.post('/api/support/ticket/'+window.hsState.id+'/reply',{email:window.hsState.email,body:v});
    hsLoadThread();
  };
})();
</script>
</body>
</html>`
}
