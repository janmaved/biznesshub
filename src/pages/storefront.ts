function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[m])
}

export function storefrontPage(store: any): string {
  const title = store.seo_title || `${store.name} – Order Online`
  const desc = store.seo_description || store.tagline || `Order online from ${store.name}`
  const keywords = store.seo_keywords || `${store.name}, ${store.category}, online order`
  const primary = store.primary_color || '#4f46e5'
  const accent = store.accent_color || '#06b6d4'
  const branding = store.white_label ? '' : `<a href="/" class="hover:underline">Powered by StoreFront Pro</a>`

  const ld = {
    '@context': 'https://schema.org',
    '@type': store.category === 'restaurant' ? 'Restaurant' : 'Store',
    name: store.name,
    description: desc,
    telephone: store.phone || undefined,
    email: store.email || undefined,
    address: store.address || undefined
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
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <style>:root{--primary:${primary};--accent:${accent}}
    .btn-primary{background:var(--primary)} .text-primary{color:var(--primary)}
    .theme-hero{background:linear-gradient(135deg,var(--primary),var(--accent))}
    .prod-card{transition:.2s} .prod-card:hover{transform:translateY(-4px);box-shadow:0 12px 28px rgba(0,0,0,.12)}
  </style>
</head>
<body class="bg-slate-50 text-slate-800" data-slug="${esc(store.slug)}" data-currency="${esc(store.currency || 'INR')}" data-theme="${esc(store.theme)}">

  <!-- HEADER -->
  <header class="theme-hero text-white">
    <nav class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2 font-bold text-lg">
        ${store.logo_url ? `<img src="${esc(store.logo_url)}" class="w-9 h-9 rounded-full object-cover bg-white">` : '<i class="fas fa-store"></i>'}
        <span>${esc(store.name)}</span>
      </div>
      <button onclick="openCart()" class="relative bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold">
        <i class="fas fa-cart-shopping"></i> Cart <span id="cartCount" class="absolute -top-2 -right-2 bg-white text-primary text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center" style="color:var(--primary)">0</span>
      </button>
    </nav>
    <div class="max-w-6xl mx-auto px-4 py-12 md:py-20 text-center">
      <h1 class="text-3xl md:text-5xl font-extrabold">${esc(store.name)}</h1>
      ${store.tagline ? `<p class="mt-3 text-lg text-white/90">${esc(store.tagline)}</p>` : ''}
      <div class="mt-6 flex flex-wrap gap-3 justify-center text-sm">
        ${store.phone ? `<a href="tel:${esc(store.phone)}" class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg"><i class="fas fa-phone mr-1"></i> Call</a>` : ''}
        ${store.whatsapp ? `<a href="https://wa.me/${esc(store.whatsapp)}" class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg"><i class="fab fa-whatsapp mr-1"></i> WhatsApp</a>` : ''}
        <a href="#enquiry" class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg"><i class="fas fa-envelope mr-1"></i> Enquiry</a>
      </div>
    </div>
  </header>

  <!-- COUPONS -->
  <div id="couponBar" class="hidden bg-amber-50 border-y border-amber-200 py-2 text-center text-sm text-amber-800"></div>

  <!-- MENU / PRODUCTS -->
  <main class="max-w-6xl mx-auto px-4 py-10">
    <div id="catNav" class="flex gap-2 flex-wrap mb-6"></div>
    <div id="products" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"></div>
  </main>

  <!-- ABOUT -->
  ${store.about ? `<section class="bg-white py-12 px-4"><div class="max-w-3xl mx-auto text-center"><h2 class="text-2xl font-bold mb-3">About Us</h2><p class="text-slate-600">${esc(store.about)}</p>
    ${store.address ? `<p class="mt-4 text-slate-500"><i class="fas fa-location-dot mr-1"></i> ${esc(store.address)}</p>` : ''}</div></section>` : ''}

  <!-- ENQUIRY -->
  <section id="enquiry" class="py-12 px-4 max-w-xl mx-auto">
    <h2 class="text-2xl font-bold text-center mb-4">Send an Enquiry</h2>
    <form id="enqForm" class="bg-white rounded-xl shadow-sm p-6 space-y-3">
      <input id="eqName" placeholder="Your name" class="w-full border rounded-lg px-3 py-2">
      <div class="grid grid-cols-2 gap-3">
        <input id="eqPhone" placeholder="Phone" class="border rounded-lg px-3 py-2">
        <input id="eqEmail" type="email" placeholder="Email" class="border rounded-lg px-3 py-2">
      </div>
      <textarea id="eqMsg" rows="3" placeholder="Your message" class="w-full border rounded-lg px-3 py-2" required></textarea>
      <button class="w-full btn-primary text-white font-bold py-3 rounded-lg">Send Enquiry</button>
      <p id="eqResult" class="text-sm text-center"></p>
    </form>
  </section>

  <footer class="bg-slate-900 text-slate-400 py-8 px-4 text-center text-sm">
    <p class="font-bold text-white">${esc(store.name)}</p>
    ${store.email ? `<p class="mt-1">${esc(store.email)}</p>` : ''}
    <p class="mt-3 text-xs">${branding}</p>
  </footer>

  <!-- CART DRAWER -->
  <div id="cartDrawer" class="fixed inset-0 z-50 hidden">
    <div class="absolute inset-0 bg-black/40" onclick="closeCart()"></div>
    <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
      <div class="p-4 border-b flex justify-between items-center"><h3 class="font-bold text-lg">Your Order</h3><button onclick="closeCart()"><i class="fas fa-times text-xl text-slate-400"></i></button></div>
      <div id="cartItems" class="flex-1 overflow-y-auto p-4 space-y-3"></div>
      <div class="border-t p-4">
        <div class="flex justify-between font-bold text-lg mb-3"><span>Total</span><span id="cartTotal"></span></div>
        <div id="checkoutForm" class="space-y-2">
          <input id="coName" placeholder="Your name *" class="w-full border rounded-lg px-3 py-2 text-sm">
          <div class="grid grid-cols-2 gap-2">
            <input id="coPhone" placeholder="Phone" class="border rounded-lg px-3 py-2 text-sm">
            <input id="coEmail" placeholder="Email" class="border rounded-lg px-3 py-2 text-sm">
          </div>
          <input id="coAddr" placeholder="Delivery address (optional)" class="w-full border rounded-lg px-3 py-2 text-sm">
          <button onclick="placeOrder()" class="w-full btn-primary text-white font-bold py-3 rounded-lg">Place Order</button>
          <p id="orderResult" class="text-sm text-center"></p>
        </div>
        <div id="payInfo" class="hidden mt-3 bg-slate-50 rounded-lg p-3 text-sm"></div>
      </div>
    </div>
  </div>

  <!-- AI CHAT -->
  <button id="chatToggle" onclick="toggleChat()" class="fixed bottom-5 right-5 z-40 btn-primary text-white w-14 h-14 rounded-full shadow-xl text-xl flex items-center justify-center"><i class="fas fa-comment-dots"></i></button>
  <div id="chatBox" class="fixed bottom-24 right-5 z-40 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl hidden flex-col" style="height:440px">
    <div class="btn-primary text-white p-3 rounded-t-2xl flex justify-between items-center"><span class="font-bold"><i class="fas fa-robot mr-1"></i> Live Support</span><button onclick="toggleChat()"><i class="fas fa-times"></i></button></div>
    <div id="chatMsgs" class="flex-1 overflow-y-auto p-3 space-y-2 text-sm"></div>
    <form id="chatForm" class="p-2 border-t flex gap-2"><input id="chatInput" placeholder="Ask anything..." class="flex-1 border rounded-lg px-3 py-2 text-sm"><button class="btn-primary text-white px-3 rounded-lg"><i class="fas fa-paper-plane"></i></button></form>
  </div>

<script>
const SLUG=document.body.dataset.slug, CUR=document.body.dataset.currency;
let STORE=null, PRODUCTS=[], CATS=[], COUPONS=[], CART=[];
let activeCat='all';

async function load(){
  const {data}=await axios.get('/api/store/'+SLUG);
  if(!data.ok) return;
  STORE=data.store; PRODUCTS=data.products; CATS=data.categories; COUPONS=data.coupons;
  if(COUPONS.length){ document.getElementById('couponBar').classList.remove('hidden'); document.getElementById('couponBar').innerHTML='🎉 Offers: '+COUPONS.map(c=>'<b>'+c.code+'</b> ('+(c.discount_type==='percent'?c.discount_value+'% off':CUR+' '+c.discount_value+' off')+')').join(' · '); }
  renderCats(); renderProducts();
  greetChat();
}

function renderCats(){
  const nav=document.getElementById('catNav');
  let html='<button onclick="filterCat(\\'all\\')" class="px-4 py-1.5 rounded-full text-sm font-medium '+(activeCat==='all'?'btn-primary text-white':'bg-white border')+'">All</button>';
  html+=CATS.map(c=>'<button onclick="filterCat('+c.id+')" class="px-4 py-1.5 rounded-full text-sm font-medium '+(activeCat==c.id?'btn-primary text-white':'bg-white border')+'">'+c.name+'</button>').join('');
  nav.innerHTML=html;
}
function filterCat(id){ activeCat=id; renderCats(); renderProducts(); }

function renderProducts(){
  const list=activeCat==='all'?PRODUCTS:PRODUCTS.filter(p=>p.category_id==activeCat);
  const el=document.getElementById('products');
  if(!list.length){ el.innerHTML='<p class="col-span-full text-center text-slate-400 py-10">No items available yet.</p>'; return; }
  el.innerHTML=list.map(p=>{
    const price=p.sale_price||p.price;
    return '<div class="prod-card bg-white rounded-xl overflow-hidden shadow-sm">'+
      (p.image_url?'<img src="'+p.image_url+'" class="w-full h-44 object-cover">':'<div class="w-full h-44 bg-slate-100 flex items-center justify-center text-slate-300 text-3xl"><i class="fas fa-image"></i></div>')+
      '<div class="p-4"><div class="flex justify-between items-start"><h3 class="font-bold">'+esc(p.name)+'</h3>'+(p.is_featured?'<span class="text-amber-500 text-xs">★ Popular</span>':'')+'</div>'+
      (p.description?'<p class="text-sm text-slate-500 mt-1">'+esc(p.description)+'</p>':'')+
      '<div class="flex justify-between items-center mt-3"><div>'+(p.sale_price?'<span class="text-slate-400 line-through text-sm mr-1">'+CUR+' '+p.price+'</span>':'')+'<span class="font-bold text-primary" style="color:var(--primary)">'+CUR+' '+price+'</span></div>'+
      '<button onclick="addCart('+p.id+')" class="btn-primary text-white text-sm font-semibold px-3 py-1.5 rounded-lg">Add +</button></div></div></div>';
  }).join('');
}
function esc(s){return String(s||'').replace(/[<>&]/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[m]))}

// CART
function addCart(id){ const p=PRODUCTS.find(x=>x.id===id); const ex=CART.find(c=>c.id===id); if(ex)ex.qty++; else CART.push({id:p.id,name:p.name,price:p.sale_price||p.price,qty:1}); updateCart(); toast(p.name+' added'); }
function updateCart(){ document.getElementById('cartCount').textContent=CART.reduce((s,c)=>s+c.qty,0); renderCart(); }
function renderCart(){
  const el=document.getElementById('cartItems');
  if(!CART.length){ el.innerHTML='<p class="text-center text-slate-400 py-10">Cart is empty</p>'; document.getElementById('cartTotal').textContent=CUR+' 0'; return; }
  el.innerHTML=CART.map(c=>'<div class="flex items-center justify-between border-b pb-2"><div><p class="font-semibold text-sm">'+esc(c.name)+'</p><p class="text-xs text-slate-500">'+CUR+' '+c.price+'</p></div><div class="flex items-center gap-2"><button onclick="chQty('+c.id+',-1)" class="w-7 h-7 bg-slate-100 rounded">-</button><span>'+c.qty+'</span><button onclick="chQty('+c.id+',1)" class="w-7 h-7 bg-slate-100 rounded">+</button></div></div>').join('');
  const total=CART.reduce((s,c)=>s+c.price*c.qty,0);
  document.getElementById('cartTotal').textContent=CUR+' '+total;
}
function chQty(id,d){ const c=CART.find(x=>x.id===id); c.qty+=d; if(c.qty<=0)CART=CART.filter(x=>x.id!==id); updateCart(); }
function openCart(){ document.getElementById('cartDrawer').classList.remove('hidden'); renderCart(); }
function closeCart(){ document.getElementById('cartDrawer').classList.add('hidden'); }

async function placeOrder(){
  if(!CART.length){ toast('Cart is empty',true); return; }
  const name=document.getElementById('coName').value;
  if(!name){ toast('Enter your name',true); return; }
  const r=document.getElementById('orderResult'); r.textContent='Placing...'; r.className='text-sm text-center text-slate-500';
  const {data}=await axios.post('/api/store/'+SLUG+'/order',{customer_name:name,customer_phone:document.getElementById('coPhone').value,customer_email:document.getElementById('coEmail').value,address:document.getElementById('coAddr').value,items:CART});
  if(data.ok){
    r.textContent='✅ Order placed! Total '+CUR+' '+data.total;
    r.className='text-sm text-center text-green-600 font-semibold';
    showPayInfo();
    CART=[]; updateCart();
  } else { r.textContent=data.error||'Failed'; r.className='text-sm text-center text-red-500'; }
}
function showPayInfo(){
  const pi=document.getElementById('payInfo'); let html='<p class="font-bold mb-1">💳 Payment options:</p>';
  if(STORE.pay_upi) html+='<p>UPI: <b>'+STORE.pay_upi+'</b></p>';
  if(STORE.pay_qr_url) html+='<img src="'+STORE.pay_qr_url+'" class="w-32 mt-2 rounded">';
  if(STORE.pay_bank) html+='<p class="mt-1 whitespace-pre-line">'+esc(STORE.pay_bank)+'</p>';
  if(STORE.pay_link) html+='<a href="'+STORE.pay_link+'" target="_blank" class="inline-block mt-2 btn-primary text-white px-3 py-1.5 rounded">Pay Now</a>';
  if(!STORE.pay_upi&&!STORE.pay_qr_url&&!STORE.pay_bank&&!STORE.pay_link) html+='<p class="text-slate-500">Owner will contact you for payment.</p>';
  pi.innerHTML=html; pi.classList.remove('hidden');
}

// ENQUIRY
document.getElementById('enqForm').addEventListener('submit', async e=>{
  e.preventDefault(); const r=document.getElementById('eqResult'); r.textContent='Sending...'; r.className='text-sm text-center text-slate-500';
  const {data}=await axios.post('/api/store/'+SLUG+'/enquiry',{name:document.getElementById('eqName').value,phone:document.getElementById('eqPhone').value,email:document.getElementById('eqEmail').value,message:document.getElementById('eqMsg').value});
  if(data.ok){ r.textContent='✅ Sent! We will contact you soon.'; r.className='text-sm text-center text-green-600'; document.getElementById('enqForm').reset(); }
  else { r.textContent=data.error||'Failed'; r.className='text-sm text-center text-red-500'; }
});

// AI CHAT
let chatHistory=[];
function toggleChat(){ const b=document.getElementById('chatBox'); b.classList.toggle('hidden'); b.classList.toggle('flex'); }
function greetChat(){ if(chatHistory.length)return; addChat('assistant','Hi! 👋 Welcome to '+STORE.name+'. How can I help you today? Ask about our products, prices or timings.'); }
function addChat(role,text){ const m=document.getElementById('chatMsgs'); const d=document.createElement('div'); d.className=role==='user'?'text-right':'text-left'; d.innerHTML='<span class="inline-block px-3 py-2 rounded-2xl '+(role==='user'?'btn-primary text-white':'bg-slate-100')+' max-w-[85%]">'+esc(text)+'</span>'; m.appendChild(d); m.scrollTop=m.scrollHeight; }
document.getElementById('chatForm').addEventListener('submit', async e=>{
  e.preventDefault(); const inp=document.getElementById('chatInput'); const text=inp.value.trim(); if(!text)return;
  addChat('user',text); chatHistory.push({role:'user',content:text}); inp.value='';
  const typing=document.createElement('div'); typing.className='text-left text-slate-400 text-xs'; typing.id='typing'; typing.textContent='typing...'; document.getElementById('chatMsgs').appendChild(typing);
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
