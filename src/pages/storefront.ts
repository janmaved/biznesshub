import { getThemeStyle } from '../themes'
import { BRAND } from '../types'

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[m])
}

export function storefrontPage(store: any): string {
  const title = store.seo_title || `${store.name} – Order Online`
  const desc = store.seo_description || store.tagline || `Order online from ${store.name}`
  const keywords = store.seo_keywords || `${store.name}, ${store.category}, online order`

  const th = getThemeStyle(store.theme)
  // Owner custom colours override the theme palette when provided.
  const primary = store.primary_color || th.primary
  const accent = store.accent_color || th.accent
  const dark = th.heroShape === 'dark'
  // White-label: lowest tier (trial/starter) always shows branding.
  // Growth & Enterprise plans are fully white-label (branding hidden), as is
  // any store with the white_label flag enabled.
  const paidWhiteLabel = ['growth', 'enterprise'].includes(String(store.owner_plan || ''))
  const branding = (store.white_label || paidWhiteLabel) ? '' : `<a href="/" class="hover:underline">Powered by ${BRAND}</a>`
  // Logo shape: circle | rounded | square | blob | ellipse
  const shape = store.logo_shape || 'circle'
  const shapeCss = shape === 'circle' ? 'border-radius:50%'
    : shape === 'square' ? 'border-radius:0'
    : shape === 'rounded' ? 'border-radius:.6rem'
    : shape === 'ellipse' ? 'border-radius:50%/35%'
    : shape === 'blob' ? 'border-radius:42% 58% 63% 37% / 41% 44% 56% 59%'
    : 'border-radius:.4rem'

  const ld = {
    '@context': 'https://schema.org',
    '@type': store.category === 'restaurant' ? 'Restaurant' : 'Store',
    name: store.name,
    description: desc,
    telephone: store.phone || undefined,
    email: store.email || undefined,
    address: store.address || undefined
  }

  // Hero markup varies by theme heroShape.
  const heroInner = `
      <h1 class="hero-title text-3xl md:text-5xl font-extrabold">${esc(store.name)}</h1>
      ${store.tagline ? `<p class="mt-3 text-lg opacity-90">${esc(store.tagline)}</p>` : ''}
      <div class="mt-6 flex flex-wrap gap-3 justify-center text-sm">
        ${store.phone ? `<a href="tel:${esc(store.phone)}" class="chip"><i class="fas fa-phone mr-1"></i> Call</a>` : ''}
        ${store.whatsapp ? `<a href="https://wa.me/${esc(store.whatsapp)}" class="chip"><i class="fab fa-whatsapp mr-1"></i> WhatsApp</a>` : ''}
        <a href="#enquiry" class="chip"><i class="fas fa-envelope mr-1"></i> Enquiry</a>
      </div>`

  let hero = ''
  if (th.heroShape === 'split') {
    hero = `<div class="max-w-6xl mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-8 items-center">
      <div class="text-left">${heroInner}</div>
      <div class="hidden md:block">${store.cover_url ? `<img src="${esc(store.cover_url)}" class="rounded-2xl w-full h-72 object-cover shadow-xl">` : `<div class="rounded-2xl w-full h-72 hero-art"></div>`}</div>
    </div>`
  } else if (th.heroShape === 'image' && store.cover_url) {
    hero = `<div class="hero-bg" style="background-image:url('${esc(store.cover_url)}')"><div class="hero-overlay max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">${heroInner}</div></div>`
  } else {
    hero = `<div class="max-w-6xl mx-auto px-4 py-12 md:py-20 text-center">${heroInner}</div>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="keywords" content="${esc(keywords)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="website">
  ${store.cover_url ? `<meta property="og:image" content="${esc(store.cover_url)}">` : ''}
  <link rel="canonical" href="/s/${esc(store.slug)}">
  ${store.logo_url ? `<link rel="icon" href="${esc(store.logo_url)}">` : `<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛍️</text></svg>">`}
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="${th.fontUrl}" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <style>
    :root{--primary:${primary};--accent:${accent};--bg:${th.bg};--surface:${th.surface};--text:${th.text};--muted:${th.muted};--radius:${th.radius}}
    body{background:var(--bg);color:var(--text);font-family:${th.font}}
    .hero-title{${th.uppercaseHeads ? 'text-transform:uppercase;letter-spacing:.04em;' : ''}}
    h2,h3{font-family:${th.font}}
    .btn-primary{background:var(--primary);color:#fff;border-radius:var(--radius)}
    .btn-primary:hover{filter:brightness(.93)}
    .text-primary{color:var(--primary)}
    .chip{background:${dark ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.22)'};padding:.5rem 1rem;border-radius:999px}
    .chip:hover{background:rgba(255,255,255,.3)}
    .theme-hero{${th.heroShape === 'dark'
      ? 'background:linear-gradient(135deg,#000,var(--primary));color:#fff'
      : th.heroShape === 'minimal'
        ? 'background:var(--surface);color:var(--text);border-bottom:1px solid rgba(0,0,0,.06)'
        : 'background:linear-gradient(135deg,var(--primary),var(--accent));color:#fff'}}
    .theme-hero .chip{color:${th.heroShape === 'minimal' ? 'var(--text)' : '#fff'}}
    .theme-hero .chip{${th.heroShape === 'minimal' ? 'background:rgba(0,0,0,.06)' : ''}}
    .hero-art{background:linear-gradient(135deg,var(--primary),var(--accent))}
    .hero-bg{background-size:cover;background-position:center;color:#fff;position:relative}
    .hero-overlay{background:rgba(0,0,0,.45)}
    .prod-card{background:var(--surface);border-radius:var(--radius);transition:.2s;${th.cardStyle === 'border' ? 'border:1px solid rgba(120,120,120,.25)' : th.cardStyle === 'flat' ? '' : th.cardStyle === 'glass' ? 'background:rgba(255,255,255,.06);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12)' : 'box-shadow:0 4px 14px rgba(0,0,0,.06)'}}
    .prod-card:hover{transform:translateY(-4px);${th.cardStyle === 'shadow' ? 'box-shadow:0 14px 30px rgba(0,0,0,.14)' : 'box-shadow:0 8px 20px rgba(0,0,0,.10)'}}
    .surface{background:var(--surface)}
    .catbtn{border-radius:999px}
    .catbtn.active{background:var(--primary);color:#fff}
    .catbtn:not(.active){background:var(--surface);border:1px solid rgba(120,120,120,.25)}
    .wave-bottom{margin-bottom:-1px}
  </style>
</head>
<body data-slug="${esc(store.slug)}" data-currency="${esc(store.currency || 'INR')}" data-theme="${esc(store.theme)}">

  <!-- HEADER -->
  <header class="theme-hero">
    <nav class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2 font-bold text-lg">
        ${store.logo_url ? `<img src="${esc(store.logo_url)}" class="w-10 h-10 object-cover bg-white" style="${shapeCss}">` : '<i class="fas fa-store"></i>'}
        <span>${esc(store.name)}</span>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="openAccount()" class="chip text-sm font-semibold"><i class="fas fa-user"></i> <span id="accLabel">Account</span></button>
        <button onclick="openCart()" class="relative chip text-sm font-semibold">
          <i class="fas fa-cart-shopping"></i> <span id="cartLabel">Cart</span> <span id="cartCount" class="absolute -top-2 -right-2 bg-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center" style="color:var(--primary)">0</span>
        </button>
      </div>
    </nav>
    ${hero}
    ${th.heroShape === 'wave' ? `<svg class="wave-bottom" viewBox="0 0 1440 60" preserveAspectRatio="none" style="width:100%;height:40px"><path fill="${th.bg}" d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z"></path></svg>` : ''}
  </header>

  <!-- COUPONS -->
  <div id="couponBar" class="hidden border-y py-2 text-center text-sm" style="background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.3)"></div>

  <!-- MENU / PRODUCTS -->
  <main class="max-w-6xl mx-auto px-4 py-10">
    <div id="catNav" class="flex gap-2 flex-wrap mb-6"></div>
    <div id="products" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"></div>
  </main>

  <!-- ABOUT -->
  ${store.about ? `<section class="surface py-12 px-4"><div class="max-w-3xl mx-auto text-center"><h2 class="text-2xl font-bold mb-3 hero-title">About Us</h2><p style="color:var(--muted)">${esc(store.about)}</p>
    ${store.address ? `<p class="mt-4" style="color:var(--muted)"><i class="fas fa-location-dot mr-1"></i> ${esc(store.address)}</p>` : ''}</div></section>` : ''}

  <!-- ENQUIRY -->
  <section id="enquiry" class="py-12 px-4 max-w-xl mx-auto">
    <h2 class="text-2xl font-bold text-center mb-4 hero-title">Send an Enquiry</h2>
    <form id="enqForm" class="surface shadow-sm p-6 space-y-3" style="border-radius:var(--radius)">
      <input id="eqName" placeholder="Your name" class="w-full border rounded-lg px-3 py-2 bg-transparent">
      <div class="grid grid-cols-2 gap-3">
        <input id="eqPhone" placeholder="Phone" class="border rounded-lg px-3 py-2 bg-transparent">
        <input id="eqEmail" type="email" placeholder="Email" class="border rounded-lg px-3 py-2 bg-transparent">
      </div>
      <textarea id="eqMsg" rows="3" placeholder="Your message" class="w-full border rounded-lg px-3 py-2 bg-transparent" required></textarea>
      <button class="w-full btn-primary font-bold py-3">Send Enquiry</button>
      <p id="eqResult" class="text-sm text-center"></p>
    </form>
  </section>

  <footer class="py-8 px-4 text-center text-sm" style="background:#0f172a;color:#94a3b8">
    <p class="font-bold text-white">${esc(store.name)}</p>
    ${store.email ? `<p class="mt-1">${esc(store.email)}</p>` : ''}
    <p class="mt-3 text-xs">${branding}</p>
  </footer>

  <!-- CART DRAWER -->
  <div id="cartDrawer" class="fixed inset-0 z-50 hidden">
    <div class="absolute inset-0 bg-black/40" onclick="closeCart()"></div>
    <div class="absolute right-0 top-0 h-full w-full max-w-md surface shadow-2xl flex flex-col">
      <div class="p-4 border-b flex justify-between items-center"><h3 id="orderTitle" class="font-bold text-lg">Your Order</h3><button onclick="closeCart()"><i class="fas fa-times text-xl" style="color:var(--muted)"></i></button></div>
      <div id="cartItems" class="flex-1 overflow-y-auto p-4 space-y-3"></div>
      <div class="border-t p-4">
        <div class="flex justify-between font-bold text-lg mb-3"><span>Total</span><span id="cartTotal"></span></div>
        <div id="checkoutForm" class="space-y-2">
          <div id="checkoutFields"></div>
          <button id="placeBtn" onclick="placeOrder()" class="w-full btn-primary font-bold py-3">Place Order</button>
          <p id="orderResult" class="text-sm text-center"></p>
        </div>
        <div id="payInfo" class="hidden mt-3 rounded-lg p-3 text-sm" style="background:rgba(120,120,120,.08)"></div>
      </div>
    </div>
  </div>

  <!-- ACCOUNT DRAWER -->
  <div id="accDrawer" class="fixed inset-0 z-50 hidden">
    <div class="absolute inset-0 bg-black/40" onclick="closeAccount()"></div>
    <div class="absolute right-0 top-0 h-full w-full max-w-md surface shadow-2xl flex flex-col">
      <div class="p-4 border-b flex justify-between items-center"><h3 class="font-bold text-lg">My Account</h3><button onclick="closeAccount()"><i class="fas fa-times text-xl" style="color:var(--muted)"></i></button></div>
      <div id="accBody" class="flex-1 overflow-y-auto p-4"></div>
    </div>
  </div>

  <!-- AI CHAT -->
  <button id="chatToggle" onclick="toggleChat()" class="fixed bottom-5 right-5 z-40 btn-primary w-14 h-14 rounded-full shadow-xl text-xl flex items-center justify-center"><i class="fas fa-comment-dots"></i></button>
  <div id="chatBox" class="fixed bottom-24 right-5 z-40 w-80 max-w-[90vw] surface rounded-2xl shadow-2xl hidden flex-col" style="height:440px">
    <div class="btn-primary p-3 rounded-t-2xl flex justify-between items-center" style="border-radius:1rem 1rem 0 0"><span class="font-bold"><i class="fas fa-robot mr-1"></i> Live Support</span><button onclick="toggleChat()"><i class="fas fa-times"></i></button></div>
    <div id="chatMsgs" class="flex-1 overflow-y-auto p-3 space-y-2 text-sm"></div>
    <form id="chatForm" class="p-2 border-t flex gap-2"><input id="chatInput" placeholder="Ask anything..." class="flex-1 border rounded-lg px-3 py-2 text-sm bg-transparent"><button class="btn-primary px-3 rounded-lg"><i class="fas fa-paper-plane"></i></button></form>
  </div>

<script>
const SLUG=document.body.dataset.slug, CUR=document.body.dataset.currency;
let STORE=null, PRODUCTS=[], CATS=[], COUPONS=[], CART=[];
let activeCat='all';

// Service-type aware wording: restaurant/food, salon/services book, retail shop.
let LBL={add:'Add +',cart:'Cart',order:'Your Order',place:'Place Order',addr:'Delivery address (optional)'};
function applyLabels(cat){
  if(cat==='restaurant'){ LBL={add:'Add +',cart:'Cart',order:'Your Order',place:'Place Order',addr:'Delivery address (optional)'}; }
  else if(cat==='salon'||cat==='services'){ LBL={add:'Book',cart:'Bookings',order:'Your Booking',place:'Confirm Booking',addr:'Preferred date / time / notes (optional)'}; }
  else { LBL={add:'Add to Cart',cart:'Cart',order:'Your Cart',place:'Place Order',addr:'Shipping address (optional)'}; }
  const cl=document.getElementById('cartLabel'); if(cl)cl.textContent=LBL.cart;
  const ot=document.getElementById('orderTitle'); if(ot)ot.textContent=LBL.order;
  const pb=document.getElementById('placeBtn'); if(pb)pb.textContent=LBL.place;
  const ad=document.getElementById('coAddr'); if(ad)ad.placeholder=LBL.addr;
}
async function load(){
  const {data}=await axios.get('/api/store/'+SLUG);
  if(!data.ok) return;
  STORE=data.store; PRODUCTS=data.products; CATS=data.categories; COUPONS=data.coupons;
  applyLabels(STORE.category);
  renderCheckoutFields();
  refreshAccountBtn();
  if(COUPONS.length){ document.getElementById('couponBar').classList.remove('hidden'); document.getElementById('couponBar').innerHTML='🎉 Offers: '+COUPONS.map(c=>'<b>'+c.code+'</b> ('+(c.discount_type==='percent'?c.discount_value+'% off':CUR+' '+c.discount_value+' off')+')').join(' · '); }
  renderCats(); renderProducts();
  greetChat();
}

function renderCats(){
  const nav=document.getElementById('catNav');
  let html='<button onclick="filterCat(\\'all\\')" class="catbtn px-4 py-1.5 text-sm font-medium '+(activeCat==='all'?'active':'')+'">All</button>';
  html+=CATS.map(c=>'<button onclick="filterCat('+c.id+')" class="catbtn px-4 py-1.5 text-sm font-medium '+(activeCat==c.id?'active':'')+'">'+esc(c.name)+'</button>').join('');
  nav.innerHTML=html;
}
function filterCat(id){ activeCat=id; renderCats(); renderProducts(); }

function renderProducts(){
  const list=activeCat==='all'?PRODUCTS:PRODUCTS.filter(p=>p.category_id==activeCat);
  const el=document.getElementById('products');
  if(!list.length){ el.innerHTML='<p class="col-span-full text-center py-10" style="color:var(--muted)">No items available yet.</p>'; return; }
  el.innerHTML=list.map(p=>{
    const price=p.sale_price||p.price;
    return '<div class="prod-card overflow-hidden">'+
      (p.image_url?'<img src="'+p.image_url+'" class="w-full h-44 object-cover">':'<div class="w-full h-44 flex items-center justify-center text-3xl" style="background:rgba(120,120,120,.08);color:var(--muted)"><i class="fas fa-image"></i></div>')+
      '<div class="p-4"><div class="flex justify-between items-start"><h3 class="font-bold">'+esc(p.name)+'</h3>'+(p.is_featured?'<span class="text-amber-500 text-xs">★ Popular</span>':'')+'</div>'+
      (p.description?'<p class="text-sm mt-1" style="color:var(--muted)">'+esc(p.description)+'</p>':'')+
      '<div class="flex justify-between items-center mt-3"><div>'+(p.sale_price?'<span class="line-through text-sm mr-1" style="color:var(--muted)">'+CUR+' '+p.price+'</span>':'')+'<span class="font-bold text-primary">'+CUR+' '+price+'</span></div>'+
      '<button onclick="addCart('+p.id+')" class="btn-primary text-sm font-semibold px-3 py-1.5">'+LBL.add+'</button></div></div></div>';
  }).join('');
}
function esc(s){return String(s||'').replace(/[<>&]/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[m]))}

// CART
function addCart(id){ const p=PRODUCTS.find(x=>x.id===id); const ex=CART.find(c=>c.id===id); if(ex)ex.qty++; else CART.push({id:p.id,name:p.name,price:p.sale_price||p.price,qty:1}); updateCart(); toast(p.name+' added'); }
function updateCart(){ document.getElementById('cartCount').textContent=CART.reduce((s,c)=>s+c.qty,0); renderCart(); }
function renderCart(){
  const el=document.getElementById('cartItems');
  if(!CART.length){ el.innerHTML='<p class="text-center py-10" style="color:var(--muted)">Cart is empty</p>'; document.getElementById('cartTotal').textContent=CUR+' 0'; return; }
  el.innerHTML=CART.map(c=>'<div class="flex items-center justify-between border-b pb-2"><div><p class="font-semibold text-sm">'+esc(c.name)+'</p><p class="text-xs" style="color:var(--muted)">'+CUR+' '+c.price+'</p></div><div class="flex items-center gap-2"><button onclick="chQty('+c.id+',-1)" class="w-7 h-7 rounded" style="background:rgba(120,120,120,.12)">-</button><span>'+c.qty+'</span><button onclick="chQty('+c.id+',1)" class="w-7 h-7 rounded" style="background:rgba(120,120,120,.12)">+</button></div></div>').join('');
  const total=CART.reduce((s,c)=>s+c.price*c.qty,0);
  document.getElementById('cartTotal').textContent=CUR+' '+total;
}
function chQty(id,d){ const c=CART.find(x=>x.id===id); c.qty+=d; if(c.qty<=0)CART=CART.filter(x=>x.id!==id); updateCart(); }
function openCart(){ document.getElementById('cartDrawer').classList.remove('hidden'); renderCart(); }
function closeCart(){ document.getElementById('cartDrawer').classList.add('hidden'); }

// Default checkout fields; owner can override via STORE.checkout_fields (JSON).
const DEFAULT_FIELDS=[
  {key:'customer_name',label:'Your name',type:'text',required:true},
  {key:'customer_phone',label:'Phone',type:'tel',required:true},
  {key:'customer_email',label:'Email',type:'email',required:false},
  {key:'addr_line',label:'Address',type:'text',required:false},
  {key:'landmark',label:'Landmark',type:'text',required:false},
  {key:'pincode',label:'PIN code',type:'text',required:false}
];
function getFields(){
  try{ const j=JSON.parse(STORE.checkout_fields||''); if(Array.isArray(j)&&j.length) return j; }catch(e){}
  return DEFAULT_FIELDS;
}
function renderCheckoutFields(){
  const el=document.getElementById('checkoutFields'); if(!el)return;
  el.innerHTML=getFields().map(f=>'<input data-fk="'+f.key+'" type="'+(f.type||'text')+'" placeholder="'+esc(f.label)+(f.required?' *':'')+'" class="w-full border rounded-lg px-3 py-2 text-sm bg-transparent mb-2">').join('');
}
function collectFields(){
  const out={}; let missing='';
  document.querySelectorAll('#checkoutFields [data-fk]').forEach(i=>{
    const f=getFields().find(x=>x.key===i.dataset.fk); out[i.dataset.fk]=i.value;
    if(f&&f.required&&!i.value.trim()) missing=missing||f.label;
  });
  return {out,missing};
}
async function placeOrder(){
  if(!CART.length){ toast('Cart is empty',true); return; }
  const {out,missing}=collectFields();
  if(missing){ toast('Please fill: '+missing,true); return; }
  if(!out.customer_name){ toast('Enter your name',true); return; }
  const r=document.getElementById('orderResult'); r.textContent='Placing...'; r.className='text-sm text-center';
  const body=Object.assign({},out,{items:CART});
  if(ACC) body.customer_id=ACC.id;
  const {data}=await axios.post('/api/store/'+SLUG+'/order',body);
  if(data.ok){
    r.textContent='✅ Order placed! ID '+(data.order_code||data.orderId)+' · Total '+CUR+' '+data.total;
    r.className='text-sm text-center text-green-600 font-semibold';
    showPayInfo(data.orderId, data.total);
    CART=[]; updateCart();
  } else { r.textContent=data.error||'Failed'; r.className='text-sm text-center text-red-500'; }
}
async function showPayInfo(orderId, total){
  const pi=document.getElementById('payInfo'); let html='<p class="font-bold mb-1">💳 Payment options:</p>';
  if(STORE.pay_provider && STORE.pay_key_id){
    html+='<button onclick="payOnline('+orderId+','+total+')" class="btn-primary w-full font-bold py-2 mb-2">Pay '+CUR+' '+total+' Online</button>';
  }
  const manual=STORE.pay_upi||STORE.pay_qr_url||STORE.pay_bank||STORE.pay_link;
  if(STORE.pay_upi) html+='<p>UPI: <b>'+esc(STORE.pay_upi)+'</b></p>';
  if(STORE.pay_qr_url) html+='<img src="'+STORE.pay_qr_url+'" class="w-32 mt-2 rounded">';
  if(STORE.pay_bank) html+='<p class="mt-1 whitespace-pre-line">'+esc(STORE.pay_bank)+'</p>';
  if(STORE.pay_link) html+='<a href="'+STORE.pay_link+'" target="_blank" class="inline-block mt-2 btn-primary px-3 py-1.5">Pay via Link</a>';
  if(manual){
    html+='<div class="mt-3 border-t pt-2"><p class="text-xs mb-1" style="color:var(--muted)">After paying via UPI/Bank, enter your UTR / Transaction ID for confirmation:</p>'+
      '<div class="flex gap-2"><input id="utrInput" placeholder="UTR / Txn ID" class="flex-1 border rounded-lg px-3 py-2 text-sm bg-transparent">'+
      '<button onclick="submitUtr('+orderId+')" class="btn-primary px-3 text-sm font-semibold">Submit</button></div><p id="utrMsg" class="text-xs mt-1"></p></div>';
  }
  if(!STORE.pay_provider&&!manual) html+='<p style="color:var(--muted)">Owner will contact you for payment.</p>';
  pi.innerHTML=html; pi.classList.remove('hidden');
}
async function submitUtr(orderId){
  const v=document.getElementById('utrInput').value.trim();
  if(!v){ toast('Enter UTR',true); return; }
  const {data}=await axios.post('/api/store/'+SLUG+'/order/'+orderId+'/utr',{utr:v});
  const m=document.getElementById('utrMsg');
  if(data.ok){ m.textContent='✅ Sent! Owner will verify your payment.'; m.className='text-xs mt-1 text-green-600'; }
  else { m.textContent=data.error||'Failed'; m.className='text-xs mt-1 text-red-500'; }
}

// ===== CUSTOMER ACCOUNT =====
let ACC=null, ACC_TOKEN='';
try{ const saved=JSON.parse(localStorage.getItem('acc_'+SLUG)||'null'); if(saved){ ACC=saved.customer; ACC_TOKEN=saved.token; } }catch(e){}
function accHeaders(){ return ACC?{'X-Customer-Id':ACC.id,'X-Customer-Token':ACC_TOKEN}:{}; }
function refreshAccountBtn(){ const l=document.getElementById('accLabel'); if(l) l.textContent=ACC?(ACC.name.split(' ')[0]):'Account'; }
function openAccount(){ document.getElementById('accDrawer').classList.remove('hidden'); ACC?renderAccount():renderAuth(); }
function closeAccount(){ document.getElementById('accDrawer').classList.add('hidden'); }
function logoutAcc(){ ACC=null; ACC_TOKEN=''; localStorage.removeItem('acc_'+SLUG); refreshAccountBtn(); renderAuth(); }
function renderAuth(){
  document.getElementById('accBody').innerHTML=
    '<div class="flex gap-2 mb-4"><button id="tabLogin" onclick="authTab(1)" class="flex-1 py-2 rounded-lg btn-primary text-sm font-semibold">Login</button><button id="tabSignup" onclick="authTab(0)" class="flex-1 py-2 rounded-lg text-sm font-semibold" style="background:rgba(120,120,120,.12)">Sign up</button></div>'+
    '<div id="authForm"></div>';
  authTab(1);
}
function authTab(login){
  document.getElementById('tabLogin').className='flex-1 py-2 rounded-lg text-sm font-semibold '+(login?'btn-primary':'');
  document.getElementById('tabSignup').className='flex-1 py-2 rounded-lg text-sm font-semibold '+(login?'':'btn-primary');
  if(!login){ document.getElementById('tabLogin').style.background='rgba(120,120,120,.12)'; document.getElementById('tabSignup').style.background=''; }
  else { document.getElementById('tabSignup').style.background='rgba(120,120,120,.12)'; document.getElementById('tabLogin').style.background=''; }
  const f=document.getElementById('authForm');
  f.innerHTML=(login?'':'<input id="auName" placeholder="Full name *" class="w-full border rounded-lg px-3 py-2 text-sm bg-transparent mb-2">')+
    '<input id="auEmail" type="email" placeholder="Email *" class="w-full border rounded-lg px-3 py-2 text-sm bg-transparent mb-2">'+
    (login?'':'<input id="auPhone" placeholder="Phone" class="w-full border rounded-lg px-3 py-2 text-sm bg-transparent mb-2">')+
    '<input id="auPass" type="password" placeholder="Password *" class="w-full border rounded-lg px-3 py-2 text-sm bg-transparent mb-2">'+
    '<button onclick="doAuth('+login+')" class="w-full btn-primary font-bold py-2.5">'+(login?'Login':'Create account')+'</button>'+
    '<p id="auMsg" class="text-sm text-center mt-2"></p>';
}
async function doAuth(login){
  const m=document.getElementById('auMsg'); m.textContent='Please wait...'; m.className='text-sm text-center';
  const body={email:document.getElementById('auEmail').value,password:document.getElementById('auPass').value};
  if(!login){ body.name=document.getElementById('auName').value; body.phone=document.getElementById('auPhone').value; }
  const {data}=await axios.post('/api/store/'+SLUG+'/customer/'+(login?'login':'signup'),body);
  if(data.ok){ ACC=data.customer; ACC_TOKEN=data.token; localStorage.setItem('acc_'+SLUG,JSON.stringify({customer:ACC,token:ACC_TOKEN})); refreshAccountBtn(); renderAccount(); }
  else { m.textContent=data.error||'Failed'; m.className='text-sm text-center text-red-500'; }
}
let ACC_VIEW='orders';
function renderAccount(){
  document.getElementById('accBody').innerHTML=
    '<div class="flex justify-between items-center mb-3"><p class="font-semibold">Hi, '+esc(ACC.name)+'</p><button onclick="logoutAcc()" class="text-xs underline" style="color:var(--muted)">Logout</button></div>'+
    '<div class="flex gap-2 mb-3"><button onclick="accView(\\'orders\\')" id="avO" class="flex-1 py-1.5 rounded-lg text-sm font-semibold btn-primary">My Orders</button><button onclick="accView(\\'support\\')" id="avS" class="flex-1 py-1.5 rounded-lg text-sm font-semibold" style="background:rgba(120,120,120,.12)">Support</button></div>'+
    '<div id="accView"></div>';
  accView(ACC_VIEW);
}
function accView(v){
  ACC_VIEW=v;
  const o=document.getElementById('avO'), s=document.getElementById('avS');
  o.className='flex-1 py-1.5 rounded-lg text-sm font-semibold '+(v==='orders'?'btn-primary':''); o.style.background=v==='orders'?'':'rgba(120,120,120,.12)';
  s.className='flex-1 py-1.5 rounded-lg text-sm font-semibold '+(v==='support'?'btn-primary':''); s.style.background=v==='support'?'':'rgba(120,120,120,.12)';
  if(v==='orders') loadMyOrders(); else loadMyTickets();
}
async function loadMyOrders(){
  const el=document.getElementById('accView'); el.innerHTML='Loading...';
  const {data}=await axios.get('/api/store/'+SLUG+'/customer/orders',{headers:accHeaders()});
  if(!data.ok||!data.orders.length){ el.innerHTML='<p class="text-sm" style="color:var(--muted)">No orders yet.</p>'; return; }
  el.innerHTML=data.orders.map(o=>{
    let items=''; try{ items=JSON.parse(o.items_json).map(i=>i.name+' x'+i.qty).join(', '); }catch(e){}
    return '<div class="border rounded-lg p-3 mb-2 text-sm"><div class="flex justify-between"><b>'+(o.order_code||('#'+o.id))+'</b><span>'+CUR+' '+o.total+'</span></div>'+
      '<p class="text-xs mt-1" style="color:var(--muted)">'+esc(items)+'</p>'+
      '<p class="text-xs mt-1">Status: <b>'+o.status+'</b> · Payment: <b>'+o.payment_status+'</b></p>'+
      (o.tracking_link?'<a href="'+o.tracking_link+'" target="_blank" class="inline-block mt-1 btn-primary px-2 py-1 text-xs">Track delivery</a>':'')+'</div>';
  }).join('');
}
async function loadMyTickets(){
  const el=document.getElementById('accView'); el.innerHTML='Loading...';
  const {data}=await axios.get('/api/store/'+SLUG+'/customer/tickets',{headers:accHeaders()});
  let html='<button onclick="newTicket()" class="w-full btn-primary font-semibold py-2 mb-3 text-sm">+ New support / feedback</button>';
  if(data.ok&&data.tickets.length){
    html+=data.tickets.map(t=>'<div class="border rounded-lg p-3 mb-2"><div class="flex justify-between text-sm"><b>'+esc(t.subject)+'</b><span class="text-xs">'+t.status+'</span></div>'+
      '<div class="mt-2 space-y-2">'+t.messages.map(m=>msgHtml(m)).join('')+'</div>'+
      '<div class="flex gap-2 mt-2"><input id="rep'+t.id+'" placeholder="Reply..." class="flex-1 border rounded-lg px-2 py-1.5 text-sm bg-transparent"><input type="file" id="repf'+t.id+'" accept="image/*,video/*" class="hidden" onchange="ticketAttach('+t.id+')"><button onclick="document.getElementById(\\'repf'+t.id+'\\').click()" class="px-2 text-sm" title="Attach"><i class="fas fa-paperclip"></i></button><button onclick="replyTicket('+t.id+')" class="btn-primary px-3 text-sm">Send</button></div><span id="ratt'+t.id+'" class="text-xs" style="color:var(--muted)"></span></div>').join('');
  } else html+='<p class="text-sm" style="color:var(--muted)">No tickets yet.</p>';
  el.innerHTML=html;
}
function msgHtml(m){
  const mine=m.sender==='customer';
  let att=''; if(m.attach_url){ att=m.attach_kind==='video'?'<video src="'+m.attach_url+'" controls class="mt-1 rounded max-w-full"></video>':'<img src="'+m.attach_url+'" class="mt-1 rounded max-w-full">'; }
  return '<div class="'+(mine?'text-right':'text-left')+'"><span class="inline-block px-3 py-2 rounded-2xl text-sm '+(mine?'btn-primary':'')+'" style="'+(mine?'':'background:rgba(120,120,120,.12)')+';max-width:85%">'+(m.body?esc(m.body):'')+att+'</span><p class="text-[10px]" style="color:var(--muted)">'+(mine?'You':'Owner')+'</p></div>';
}
let TATT={};
async function ticketAttach(id){ const f=document.getElementById('repf'+id).files[0]; if(!f)return; if(f.size>800*1024){ toast('Max 800KB',true); return; } const r=new FileReader(); r.onload=()=>{ TATT[id]={url:r.result,kind:f.type.startsWith('video')?'video':'image'}; document.getElementById('ratt'+id).textContent='Attached: '+f.name; }; r.readAsDataURL(f); }
async function replyTicket(id){
  const body=document.getElementById('rep'+id).value; const a=TATT[id]||{};
  if(!body&&!a.url){ toast('Write something',true); return; }
  await axios.post('/api/store/'+SLUG+'/customer/tickets/'+id+'/reply',{body,attach_url:a.url||'',attach_kind:a.kind||''},{headers:accHeaders()});
  delete TATT[id]; loadMyTickets();
}
let NTATT=null;
function newTicket(){
  document.getElementById('accView').innerHTML=
    '<input id="ntSub" placeholder="Subject *" class="w-full border rounded-lg px-3 py-2 text-sm bg-transparent mb-2">'+
    '<textarea id="ntBody" rows="4" placeholder="Your message / feedback *" class="w-full border rounded-lg px-3 py-2 text-sm bg-transparent mb-2"></textarea>'+
    '<input type="file" id="ntFile" accept="image/*,video/*" class="text-sm mb-2" onchange="ntAttach()"><span id="ntInfo" class="text-xs block mb-2" style="color:var(--muted)"></span>'+
    '<div class="flex gap-2"><button onclick="accView(\\'support\\')" class="flex-1 py-2 rounded-lg text-sm" style="background:rgba(120,120,120,.12)">Back</button><button onclick="sendTicket()" class="flex-1 btn-primary font-semibold py-2 text-sm">Send</button></div><p id="ntMsg" class="text-sm text-center mt-2"></p>';
}
function ntAttach(){ const f=document.getElementById('ntFile').files[0]; if(!f)return; if(f.size>800*1024){ toast('Max 800KB',true); document.getElementById('ntFile').value=''; return; } const r=new FileReader(); r.onload=()=>{ NTATT={url:r.result,kind:f.type.startsWith('video')?'video':'image'}; document.getElementById('ntInfo').textContent='Attached: '+f.name; }; r.readAsDataURL(f); }
async function sendTicket(){
  const subject=document.getElementById('ntSub').value, body=document.getElementById('ntBody').value;
  if(!subject||!body){ toast('Subject & message required',true); return; }
  const {data}=await axios.post('/api/store/'+SLUG+'/customer/tickets',{subject,body,attach_url:NTATT?.url||'',attach_kind:NTATT?.kind||''},{headers:accHeaders()});
  if(data.ok){ NTATT=null; accView('support'); } else { document.getElementById('ntMsg').textContent=data.error||'Failed'; document.getElementById('ntMsg').className='text-sm text-center text-red-500'; }
}
async function payOnline(orderId, total){
  try{
    const {data}=await axios.post('/api/store/'+SLUG+'/pay',{orderId});
    if(!data.ok){ toast(data.error||'Payment unavailable',true); return; }
    if(data.mode==='razorpay'){
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      const rzp=new Razorpay({key:data.key,amount:data.amount,currency:data.currency||'INR',name:STORE.name,description:'Order #'+orderId,order_id:data.order_id,
        handler:function(resp){ axios.post('/api/store/'+SLUG+'/pay/verify',{provider:'razorpay',orderId,resp}).then(()=>{ toast('Payment successful!'); }); },
        prefill:{name:(document.querySelector('#checkoutFields [data-fk=customer_name]')||{}).value||''},theme:{color:STORE.primary_color||'#4f46e5'}});
      rzp.open();
    } else if(data.mode==='redirect'){
      if(data.action && data.fields){
        const form=document.createElement('form'); form.method='POST'; form.action=data.action;
        for(const k in data.fields){ const i=document.createElement('input'); i.type='hidden'; i.name=k; i.value=data.fields[k]; form.appendChild(i); }
        document.body.appendChild(form); form.submit();
      } else if(data.url){ window.location.href=data.url; }
    }
  }catch(e){ toast('Payment failed to start',true); }
}
function loadScript(src){ return new Promise((res,rej)=>{ if(document.querySelector('script[src="'+src+'"]'))return res(); const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }

// ENQUIRY
document.getElementById('enqForm').addEventListener('submit', async e=>{
  e.preventDefault(); const r=document.getElementById('eqResult'); r.textContent='Sending...'; r.className='text-sm text-center';
  const {data}=await axios.post('/api/store/'+SLUG+'/enquiry',{name:document.getElementById('eqName').value,phone:document.getElementById('eqPhone').value,email:document.getElementById('eqEmail').value,message:document.getElementById('eqMsg').value});
  if(data.ok){ r.textContent='✅ Sent! We will contact you soon.'; r.className='text-sm text-center text-green-600'; document.getElementById('enqForm').reset(); }
  else { r.textContent=data.error||'Failed'; r.className='text-sm text-center text-red-500'; }
});

// AI CHAT
let chatHistory=[];
function toggleChat(){ const b=document.getElementById('chatBox'); b.classList.toggle('hidden'); b.classList.toggle('flex'); }
function greetChat(){ if(chatHistory.length)return; addChat('assistant','Hi! 👋 Welcome to '+STORE.name+'. How can I help you today? Ask about our products, prices or timings.'); }
function addChat(role,text){ const m=document.getElementById('chatMsgs'); const d=document.createElement('div'); d.className=role==='user'?'text-right':'text-left'; d.innerHTML='<span class="inline-block px-3 py-2 rounded-2xl '+(role==='user'?'btn-primary':'')+' max-w-[85%]" style="'+(role==='user'?'':'background:rgba(120,120,120,.12)')+'">'+esc(text)+'</span>'; m.appendChild(d); m.scrollTop=m.scrollHeight; }
document.getElementById('chatForm').addEventListener('submit', async e=>{
  e.preventDefault(); const inp=document.getElementById('chatInput'); const text=inp.value.trim(); if(!text)return;
  addChat('user',text); chatHistory.push({role:'user',content:text}); inp.value='';
  const typing=document.createElement('div'); typing.className='text-left text-xs'; typing.id='typing'; typing.style.color='var(--muted)'; typing.textContent='typing...'; document.getElementById('chatMsgs').appendChild(typing);
  try{
    const {data}=await axios.post('/api/store/'+SLUG+'/chat',{messages:chatHistory.slice(-10)});
    document.getElementById('typing')?.remove();
    if(data.ok){ addChat('assistant',data.reply); chatHistory.push({role:'assistant',content:data.reply}); }
    else { addChat('assistant','Sorry, live chat is busy. Please use the enquiry form below and we will get back to you!'); }
  }catch(e){ document.getElementById('typing')?.remove(); addChat('assistant','Sorry, I had trouble. Please send an enquiry and we will contact you.'); }
});

function toast(msg,err){ const t=document.createElement('div'); t.className='fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-white text-sm font-semibold '+(err?'bg-red-600':'bg-green-600'); t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2000); }

load();
</script>
</body>
</html>`
}
