export function ownerApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Owner Dashboard – Storenest</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛠️</text></svg>">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-slate-100 text-slate-800">
<div id="app"></div>

<script>
const $ = (id)=>document.getElementById(id);
let STATE = { owner:null, store:null, products:[], categories:[], orders:[], enquiries:[], coupons:[] };
let META = { plans:[], themes:[], categories:[] };
let tab = 'overview';

function saveAuth(o){ localStorage.setItem('sb_owner', JSON.stringify({id:o.id, pin:o._pin})); }
function getAuth(){ try{return JSON.parse(localStorage.getItem('sb_owner'))}catch(e){return null} }
function clearAuth(){ localStorage.removeItem('sb_owner'); location.href='/owner'; }
function authHeaders(){ const a=getAuth(); return a?{'X-Owner-Id':a.id,'X-Owner-Pin':a.pin}:{}; }

async function loadMeta(){ const {data}=await axios.get('/api/meta'); META=data; }

// ---------------- AUTH SCREENS ----------------
function authScreen(mode){
  $('app').innerHTML = \`
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
      <div class="text-center mb-6">
        <a href="/" class="text-2xl font-extrabold text-indigo-600"><i class="fas fa-store"></i> Storenest</a>
        <p class="text-slate-500 mt-1">\${mode==='login'?'Owner Login':'Create your store'}</p>
      </div>
      <div class="flex bg-slate-100 rounded-lg p-1 mb-6">
        <button onclick="authScreen('login')" class="flex-1 py-2 rounded-md font-semibold \${mode==='login'?'bg-white shadow text-indigo-600':''}">Login</button>
        <button onclick="authScreen('signup')" class="flex-1 py-2 rounded-md font-semibold \${mode==='signup'?'bg-white shadow text-indigo-600':''}">Sign Up</button>
      </div>
      \${mode==='login'?loginForm():signupForm()}
      <p id="authMsg" class="text-sm text-center mt-3"></p>
      <p class="text-center text-xs text-slate-400 mt-4">🔒 Your store, your data. We never share your details.</p>
    </div>
  </div>\`;
  if(mode==='signup'){ $('suCat').innerHTML = META.categories.map(c=>'<option value="'+c.key+'">'+c.label+'</option>').join(''); }
}

function loginForm(){ return \`
  <form id="loginForm" class="space-y-3">
    <input id="liEmail" type="email" placeholder="Email" class="w-full border rounded-lg px-3 py-2.5" required>
    <input id="liPin" type="password" placeholder="PIN" class="w-full border rounded-lg px-3 py-2.5" required>
    <button class="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700">Login</button>
  </form>\`; }

function signupForm(){ return \`
  <form id="signupForm" class="space-y-3">
    <input id="suName" placeholder="Your name" class="w-full border rounded-lg px-3 py-2.5" required>
    <input id="suEmail" type="email" placeholder="Email" class="w-full border rounded-lg px-3 py-2.5" required>
    <input id="suPhone" placeholder="Phone" class="w-full border rounded-lg px-3 py-2.5">
    <input id="suStore" placeholder="Business / Store name" class="w-full border rounded-lg px-3 py-2.5" required>
    <select id="suCat" class="w-full border rounded-lg px-3 py-2.5"></select>
    <input id="suPin" type="password" placeholder="Create a login PIN (min 4 digits)" class="w-full border rounded-lg px-3 py-2.5" required>
    <button class="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700">Start 7-Day Free Trial</button>
  </form>\`; }

function bindAuth(mode){
  if(mode==='login'){
    $('loginForm').addEventListener('submit', async e=>{
      e.preventDefault(); const msg=$('authMsg'); msg.textContent='...'; msg.className='text-sm text-center text-slate-500';
      try{
        const {data}=await axios.post('/api/owner/login',{email:$('liEmail').value, pin:$('liPin').value});
        if(!data.ok){msg.textContent=data.error;msg.className='text-sm text-center text-red-500';return;}
        saveAuth({id:data.owner.id, _pin:$('liPin').value}); await loadDashboard();
      }catch(e){msg.textContent='Login failed';msg.className='text-sm text-center text-red-500';}
    });
  } else {
    $('signupForm').addEventListener('submit', async e=>{
      e.preventDefault(); const msg=$('authMsg'); msg.textContent='Creating...'; msg.className='text-sm text-center text-slate-500';
      try{
        const pin=$('suPin').value;
        const {data}=await axios.post('/api/owner/signup',{name:$('suName').value,email:$('suEmail').value,phone:$('suPhone').value,pin,storeName:$('suStore').value,category:$('suCat').value});
        if(!data.ok){msg.textContent=data.error;msg.className='text-sm text-center text-red-500';return;}
        saveAuth({id:data.ownerId, _pin:pin}); await loadDashboard();
      }catch(e){msg.textContent='Signup failed';msg.className='text-sm text-center text-red-500';}
    });
  }
}

// ---------------- DASHBOARD ----------------
async function loadDashboard(){
  try{
    const {data}=await axios.get('/api/owner/dashboard',{headers:authHeaders()});
    if(!data.ok){ clearAuth(); return; }
    STATE = {owner:data.owner, store:data.store, products:data.products, categories:data.categories, orders:data.orders, enquiries:data.enquiries, coupons:data.coupons};
    renderDashboard();
  }catch(e){ clearAuth(); }
}

function planBadge(){
  const o=STATE.owner;
  if(o.is_unlocked) return '<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">FREE UNLOCKED</span>';
  return '<span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold uppercase">'+o.plan+'</span>';
}

function renderDashboard(){
  const s=STATE.store;
  $('app').innerHTML = \`
  <div class="min-h-screen flex flex-col md:flex-row">
    <!-- Sidebar -->
    <aside class="md:w-64 bg-slate-900 text-slate-300 md:min-h-screen">
      <div class="p-5 border-b border-slate-800">
        <a href="/" class="font-extrabold text-white text-lg"><i class="fas fa-store text-indigo-400"></i> Storenest</a>
        <p class="text-xs text-slate-500 mt-1 truncate">\${s.name}</p>
      </div>
      <nav class="p-3 space-y-1" id="navMenu"></nav>
      <div class="p-3 border-t border-slate-800">
        <a href="/s/\${s.slug}" target="_blank" class="block text-center bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold mb-2"><i class="fas fa-external-link-alt mr-1"></i> View Store</a>
        <button onclick="clearAuth()" class="block w-full text-center text-slate-400 hover:text-white text-sm py-2"><i class="fas fa-sign-out-alt mr-1"></i> Logout</button>
      </div>
    </aside>
    <!-- Main -->
    <main class="flex-1 p-4 md:p-8 max-w-6xl">
      <div class="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 class="text-2xl font-bold" id="tabTitle"></h1>
          <p class="text-sm text-slate-500">\${planBadge()}</p>
        </div>
        <div class="text-sm text-slate-500">Store URL: <a class="text-indigo-600 font-medium" href="/s/\${s.slug}" target="_blank">/s/\${s.slug}</a></div>
      </div>
      <div id="tabContent"></div>
    </main>
  </div>\`;
  renderNav(); switchTab(tab);
}

const NAV=[['overview','Overview','fa-gauge'],['store','Store Settings','fa-gear'],['themes','Themes','fa-palette'],['products','Products / Menu','fa-box'],['orders','Orders','fa-cart-shopping'],['enquiries','Enquiries','fa-envelope'],['coupons','Offers & Coupons','fa-tags'],['payments','Payments','fa-indian-rupee-sign'],['plan','Plan & Billing','fa-crown'],['security','Security','fa-lock']];

function renderNav(){
  $('navMenu').innerHTML = NAV.map(n=>\`
    <button onclick="switchTab('\${n[0]}')" class="nav-btn w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm \${tab===n[0]?'bg-indigo-600 text-white':'hover:bg-slate-800'}">
      <i class="fas \${n[2]} w-4"></i> \${n[1]}
    </button>\`).join('');
}

function switchTab(t){ tab=t; renderNav();
  const titles=Object.fromEntries(NAV.map(n=>[n[0],n[1]]));
  if($('tabTitle')) $('tabTitle').textContent=titles[t];
  const c=$('tabContent');
  if(t==='overview') c.innerHTML=viewOverview();
  if(t==='store') c.innerHTML=viewStore();
  if(t==='themes') c.innerHTML=viewThemes();
  if(t==='products'){ c.innerHTML=viewProducts(); }
  if(t==='orders') c.innerHTML=viewOrders();
  if(t==='enquiries') c.innerHTML=viewEnquiries();
  if(t==='coupons') c.innerHTML=viewCoupons();
  if(t==='payments') c.innerHTML=viewPayments();
  if(t==='plan') c.innerHTML=viewPlan();
  if(t==='security') c.innerHTML=viewSecurity();
}

function card(content,cls=''){ return '<div class="bg-white rounded-xl shadow-sm p-5 '+cls+'">'+content+'</div>'; }

// ---------------- MEDIA / IMAGE FIELD ----------------
// Renders an image input that supports: paste URL, upload a file, or pick from
// the store's media library. The actual value is kept in a hidden input <name>.
let MEDIA=[]; let mediaTarget=null;
function imgField(name,val){
  val=val||'';
  const id='if_'+name;
  return '<div class="mt-1">'+
    '<input type="hidden" name="'+name+'" id="'+id+'" value="'+(val.replace(/"/g,'&quot;'))+'">'+
    '<div class="flex items-center gap-2">'+
      '<div id="'+id+'_prev" class="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden shrink-0">'+(val?'<img src="'+val+'" class="w-full h-full object-cover">':'<i class="fas fa-image"></i>')+'</div>'+
      '<input id="'+id+'_url" value="'+(val.startsWith('data:')?'':val.replace(/"/g,'&quot;'))+'" placeholder="Paste image URL or upload →" class="flex-1 border rounded-lg px-3 py-2 text-sm" oninput="setImg(\\''+id+'\\',this.value)">'+
      '<label class="bg-slate-100 hover:bg-slate-200 cursor-pointer text-sm px-3 py-2 rounded-lg whitespace-nowrap"><i class="fas fa-upload"></i> Upload<input type="file" accept="image/*,video/*" class="hidden" onchange="uploadImg(event,\\''+id+'\\')"></label>'+
      '<button type="button" onclick="openLibrary(\\''+id+'\\')" class="bg-slate-100 hover:bg-slate-200 text-sm px-3 py-2 rounded-lg whitespace-nowrap"><i class="fas fa-images"></i></button>'+
    '</div></div>';
}
function setImg(id,val){ $(id).value=val; const p=$(id+'_prev'); p.innerHTML=val?'<img src="'+val+'" class="w-full h-full object-cover">':'<i class="fas fa-image"></i>'; }
async function uploadImg(ev,id){
  const file=ev.target.files[0]; if(!file)return;
  if(file.size>800*1024){ toast('File too large (max 800KB). Compress it or use a URL.',true); ev.target.value=''; return; }
  const reader=new FileReader();
  reader.onload=async()=>{
    try{
      const {data}=await axios.post('/api/owner/media',{name:file.name,data:reader.result},{headers:authHeaders()});
      if(data.ok){ setImg(id,data.data); const u=$(id+'_url'); if(u)u.value=''; toast('Uploaded & saved to library'); }
      else toast(data.error||'Upload failed',true);
    }catch(e){ toast('Upload failed',true); }
  };
  reader.readAsDataURL(file);
}
async function openLibrary(id){
  mediaTarget=id;
  try{ const {data}=await axios.get('/api/owner/media',{headers:authHeaders()}); if(data.ok)MEDIA=data.media; }catch(e){}
  let modal=$('mediaModal');
  if(!modal){ modal=document.createElement('div'); modal.id='mediaModal'; modal.className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'; document.body.appendChild(modal); }
  modal.style.display='flex';
  modal.innerHTML='<div class="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">'+
    '<div class="p-4 border-b flex justify-between items-center"><h3 class="font-bold">Media Library</h3><div class="flex gap-2"><label class="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg cursor-pointer"><i class="fas fa-upload"></i> Upload<input type="file" accept="image/*,video/*" class="hidden" onchange="libUpload(event)"></label><button onclick="closeLibrary()" class="text-slate-400"><i class="fas fa-times text-xl"></i></button></div></div>'+
    '<div id="mediaGrid" class="p-4 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-3">'+mediaGridHtml()+'</div></div>';
}
function mediaGridHtml(){
  if(!MEDIA.length) return '<p class="col-span-full text-center text-slate-400 py-8 text-sm">No files yet. Upload images or videos to reuse them anywhere.</p>';
  return MEDIA.map(m=>'<div class="relative group border rounded-lg overflow-hidden">'+
    (m.kind==='video'?'<video src="'+m.data+'" class="w-full h-24 object-cover"></video>':'<img src="'+m.data+'" class="w-full h-24 object-cover">')+
    '<button onclick="pickMedia('+m.id+')" class="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/30 transition flex items-center justify-center text-white opacity-0 group-hover:opacity-100"><i class="fas fa-check-circle text-2xl"></i></button>'+
    '<button onclick="delMedia('+m.id+')" class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100"><i class="fas fa-trash"></i></button>'+
    '</div>').join('');
}
function pickMedia(mid){ const m=MEDIA.find(x=>x.id===mid); if(m&&mediaTarget){ setImg(mediaTarget,m.data); const u=$(mediaTarget+'_url'); if(u)u.value=''; } closeLibrary(); }
async function libUpload(ev){
  const file=ev.target.files[0]; if(!file)return;
  if(file.size>800*1024){ toast('File too large (max 800KB).',true); return; }
  const reader=new FileReader();
  reader.onload=async()=>{ const {data}=await axios.post('/api/owner/media',{name:file.name,data:reader.result},{headers:authHeaders()}); if(data.ok){ MEDIA.unshift({id:data.id,kind:data.kind,data:data.data}); $('mediaGrid').innerHTML=mediaGridHtml(); toast('Uploaded'); } else toast(data.error||'Failed',true); };
  reader.readAsDataURL(file);
}
async function delMedia(mid){ if(!confirm('Delete this file?'))return; await axios.delete('/api/owner/media/'+mid,{headers:authHeaders()}); MEDIA=MEDIA.filter(x=>x.id!==mid); $('mediaGrid').innerHTML=mediaGridHtml(); }
function closeLibrary(){ const m=$('mediaModal'); if(m)m.style.display='none'; }

// OVERVIEW
function viewOverview(){
  const pendingOrders=STATE.orders.filter(o=>o.status==='pending').length;
  const newEnq=STATE.enquiries.filter(e=>e.status==='new').length;
  const revenue=STATE.orders.filter(o=>o.payment_status==='paid').reduce((s,o)=>s+o.total,0);
  const stat=(icon,label,val,color)=>\`<div class="bg-white rounded-xl shadow-sm p-5"><div class="flex items-center justify-between"><div><p class="text-slate-500 text-sm">\${label}</p><p class="text-2xl font-extrabold mt-1">\${val}</p></div><div class="w-11 h-11 rounded-lg \${color} flex items-center justify-center text-white"><i class="fas \${icon}"></i></div></div></div>\`;
  return \`
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    \${stat('fa-box','Products',STATE.products.length,'bg-indigo-500')}
    \${stat('fa-cart-shopping','Orders',STATE.orders.length,'bg-emerald-500')}
    \${stat('fa-clock','Pending',pendingOrders,'bg-amber-500')}
    \${stat('fa-indian-rupee-sign','Revenue',STATE.store.currency+' '+revenue,'bg-pink-500')}
  </div>
  <div class="grid lg:grid-cols-2 gap-4">
    \${card('<h3 class="font-bold mb-3"><i class="fas fa-cart-shopping text-emerald-500 mr-1"></i> Recent Orders</h3>'+(STATE.orders.slice(0,5).map(o=>'<div class="flex justify-between py-2 border-b text-sm"><span>'+o.customer_name+'</span><span class="font-semibold">'+STATE.store.currency+' '+o.total+'</span></div>').join('')||'<p class="text-slate-400 text-sm">No orders yet</p>'))}
    \${card('<h3 class="font-bold mb-3"><i class="fas fa-envelope text-indigo-500 mr-1"></i> New Enquiries ('+newEnq+')</h3>'+(STATE.enquiries.slice(0,5).map(e=>'<div class="py-2 border-b text-sm"><b>'+(e.name||'Anon')+'</b>: '+e.message.slice(0,50)+'</div>').join('')||'<p class="text-slate-400 text-sm">No enquiries yet</p>'))}
  </div>
  <div class="mt-6">\${card('<h3 class="font-bold mb-2">🚀 Quick Start</h3><div class="grid sm:grid-cols-3 gap-3 text-sm"><button onclick="switchTab(\\'products\\')" class="bg-indigo-50 text-indigo-700 rounded-lg py-3 font-semibold">+ Add Products</button><button onclick="switchTab(\\'themes\\')" class="bg-purple-50 text-purple-700 rounded-lg py-3 font-semibold">Choose Theme</button><button onclick="switchTab(\\'payments\\')" class="bg-emerald-50 text-emerald-700 rounded-lg py-3 font-semibold">Setup Payments</button></div>')}</div>\`;
}

// STORE SETTINGS
function viewStore(){
  const s=STATE.store; const f=(k,v)=>v==null?'':v;
  return card(\`
  <form id="storeForm" class="grid md:grid-cols-2 gap-4">
    <div><label class="text-sm font-medium">Store Name</label><input name="name" value="\${f('',s.name)}" class="w-full border rounded-lg px-3 py-2 mt-1"></div>
    <div><label class="text-sm font-medium">Category</label><select name="category" class="w-full border rounded-lg px-3 py-2 mt-1">\${META.categories.map(c=>'<option value="'+c.key+'" '+(s.category===c.key?'selected':'')+'>'+c.label+'</option>').join('')}</select></div>
    <div class="md:col-span-2"><label class="text-sm font-medium">Tagline</label><input name="tagline" value="\${f('',s.tagline)}" class="w-full border rounded-lg px-3 py-2 mt-1"></div>
    <div class="md:col-span-2"><label class="text-sm font-medium">About</label><textarea name="about" rows="3" class="w-full border rounded-lg px-3 py-2 mt-1">\${f('',s.about)}</textarea></div>
    <div><label class="text-sm font-medium">Logo</label>\${imgField('logo_url',s.logo_url)}</div>
    <div><label class="text-sm font-medium">Cover Image</label>\${imgField('cover_url',s.cover_url)}</div>
    <div><label class="text-sm font-medium">Primary Color</label><input name="primary_color" type="color" value="\${s.primary_color||'#4f46e5'}" class="w-full border rounded-lg h-10 mt-1"></div>
    <div><label class="text-sm font-medium">Accent Color</label><input name="accent_color" type="color" value="\${s.accent_color||'#06b6d4'}" class="w-full border rounded-lg h-10 mt-1"></div>
    <div><label class="text-sm font-medium">Currency</label><input name="currency" value="\${f('INR',s.currency)}" class="w-full border rounded-lg px-3 py-2 mt-1"></div>
    <div><label class="text-sm font-medium">Phone</label><input name="phone" value="\${f('',s.phone)}" class="w-full border rounded-lg px-3 py-2 mt-1"></div>
    <div><label class="text-sm font-medium">WhatsApp</label><input name="whatsapp" value="\${f('',s.whatsapp)}" class="w-full border rounded-lg px-3 py-2 mt-1"></div>
    <div><label class="text-sm font-medium">Email</label><input name="email" value="\${f('',s.email)}" class="w-full border rounded-lg px-3 py-2 mt-1"></div>
    <div class="md:col-span-2"><label class="text-sm font-medium">Address</label><input name="address" value="\${f('',s.address)}" class="w-full border rounded-lg px-3 py-2 mt-1"></div>
    <div class="md:col-span-2 border-t pt-4"><h4 class="font-bold mb-2">SEO</h4></div>
    <div><label class="text-sm font-medium">SEO Title</label><input name="seo_title" value="\${f('',s.seo_title)}" class="w-full border rounded-lg px-3 py-2 mt-1"></div>
    <div><label class="text-sm font-medium">SEO Keywords</label><input name="seo_keywords" value="\${f('',s.seo_keywords)}" class="w-full border rounded-lg px-3 py-2 mt-1"></div>
    <div class="md:col-span-2"><label class="text-sm font-medium">SEO Description</label><textarea name="seo_description" rows="2" class="w-full border rounded-lg px-3 py-2 mt-1">\${f('',s.seo_description)}</textarea></div>
    <div class="md:col-span-2 flex items-center gap-4">
      <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="is_published" \${s.is_published?'checked':''}> Published (live)</label>
    </div>
    <div class="md:col-span-2"><button class="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-indigo-700">Save Changes</button> <span id="storeMsg" class="text-sm ml-2"></span></div>
  </form>\`);
}

// THEMES
function viewThemes(){
  const s=STATE.store;
  const allowed = STATE.owner.is_unlocked || STATE.owner.plan==='growth' || STATE.owner.plan==='enterprise';
  const list=META.themes.filter(t=>t.category===s.category || t.category==='general');
  return card('<p class="text-slate-500 text-sm mb-4">Pick a theme for your store. '+(allowed?'All premium themes unlocked!':'Upgrade to <b>Growth</b> for premium themes.')+'</p><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">'+
    list.map(t=>{
      const locked = t.premium && !allowed;
      return '<div onclick="'+(locked?'switchTab(\\'plan\\')':'selectTheme(\\''+t.key+'\\')')+'" class="cursor-pointer rounded-xl overflow-hidden border-2 '+(s.theme===t.key?'border-indigo-600 ring-2 ring-indigo-300':'border-slate-200')+' relative">'+
      (locked?'<div class="absolute inset-0 bg-black/40 z-10 flex items-center justify-center text-white"><i class="fas fa-lock"></i></div>':'')+
      '<div class="h-24 flex items-center justify-center text-white font-bold" style="background:'+t.preview+'">'+t.name+'</div>'+
      '<div class="p-2"><div class="flex justify-between items-center"><span class="text-sm font-semibold">'+t.name+'</span>'+(t.premium?'<span class="text-xs text-amber-600">★</span>':'')+'</div><p class="text-xs text-slate-500">'+t.description+'</p>'+(s.theme===t.key?'<p class="text-xs text-indigo-600 font-bold mt-1">✓ Active</p>':'')+'</div></div>';
    }).join('')+'</div>');
}
async function selectTheme(key){ await saveStore({theme:key}); STATE.store.theme=key; switchTab('themes'); toast('Theme applied!'); }

// PRODUCTS
function viewProducts(){
  setTimeout(bindProductForm,0);
  return \`<div class="grid lg:grid-cols-3 gap-4">
    <div class="lg:col-span-2">\${card('<div class="flex justify-between items-center mb-3"><h3 class="font-bold">Products / Menu Items</h3></div><div id="prodList">'+productRows()+'</div>')}</div>
    <div>\${card('<h3 class="font-bold mb-3">Add / Edit Product</h3>'+productForm())}
      <div class="mt-4">\${card('<h4 class="font-bold mb-2 text-sm">Categories</h4><div id="catList">'+catRows()+'</div><form id="catForm" class="flex gap-2 mt-2"><input id="catName" placeholder="New category" class="flex-1 border rounded-lg px-2 py-1.5 text-sm"><button class="bg-indigo-600 text-white px-3 rounded-lg text-sm">Add</button></form>')}</div>
    </div>
  </div>\`;
}
function productRows(){
  if(!STATE.products.length) return '<p class="text-slate-400 text-sm">No products yet. Add your first item →</p>';
  return STATE.products.map(p=>'<div class="flex items-center gap-3 py-2 border-b">'+
    (p.image_url?'<img src="'+p.image_url+'" class="w-12 h-12 rounded object-cover">':'<div class="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-300"><i class="fas fa-image"></i></div>')+
    '<div class="flex-1"><p class="font-semibold text-sm">'+p.name+(p.is_featured?' <span class="text-amber-500">★</span>':'')+'</p><p class="text-xs text-slate-500">'+STATE.store.currency+' '+(p.sale_price||p.price)+'</p></div>'+
    '<button onclick=\\'editProduct('+p.id+')\\' class="text-indigo-600 px-2"><i class="fas fa-edit"></i></button>'+
    '<button onclick=\\'delProduct('+p.id+')\\' class="text-red-500 px-2"><i class="fas fa-trash"></i></button></div>').join('');
}
function catRows(){ return STATE.categories.map(c=>'<div class="flex justify-between items-center py-1 text-sm"><span>'+c.name+'</span><button onclick=\\'delCat('+c.id+')\\' class="text-red-400"><i class="fas fa-times"></i></button></div>').join('')||'<p class="text-xs text-slate-400">No categories</p>'; }
function productForm(){ return \`<form id="prodForm" class="space-y-2">
  <input type="hidden" id="pId">
  <input id="pName" placeholder="Product name" class="w-full border rounded-lg px-3 py-2 text-sm" required>
  <textarea id="pDesc" placeholder="Description" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm"></textarea>
  <div class="grid grid-cols-2 gap-2">
    <input id="pPrice" type="number" step="0.01" placeholder="Price" class="border rounded-lg px-3 py-2 text-sm" required>
    <input id="pSale" type="number" step="0.01" placeholder="Sale price (opt)" class="border rounded-lg px-3 py-2 text-sm">
  </div>
  <select id="pCat" class="w-full border rounded-lg px-3 py-2 text-sm"><option value="">No category</option>\${STATE.categories.map(c=>'<option value="'+c.id+'">'+c.name+'</option>').join('')}</select>
  <label class="text-xs text-slate-500">Product Image</label>\${imgField('pImg','')}
  <div class="flex gap-4 text-sm"><label class="flex items-center gap-1"><input type="checkbox" id="pStock" checked> In stock</label><label class="flex items-center gap-1"><input type="checkbox" id="pFeat"> Featured</label></div>
  <button class="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm">Save Product</button>
</form>\`; }
function bindProductForm(){
  const f=$('prodForm'); if(f) f.addEventListener('submit', async e=>{
    e.preventDefault();
    const body={category_id:$('pCat').value||null,name:$('pName').value,description:$('pDesc').value,price:Number($('pPrice').value),sale_price:$('pSale').value?Number($('pSale').value):null,image_url:$('if_pImg').value,in_stock:$('pStock').checked,is_featured:$('pFeat').checked};
    const id=$('pId').value;
    if(id) await axios.put('/api/owner/products/'+id,body,{headers:authHeaders()});
    else await axios.post('/api/owner/products',body,{headers:authHeaders()});
    await reload(); switchTab('products'); toast('Saved!');
  });
  const cf=$('catForm'); if(cf) cf.addEventListener('submit', async e=>{
    e.preventDefault(); await axios.post('/api/owner/categories',{name:$('catName').value},{headers:authHeaders()}); await reload(); switchTab('products');
  });
}
function editProduct(id){ const p=STATE.products.find(x=>x.id===id); switchTab('products'); setTimeout(()=>{ $('pId').value=p.id;$('pName').value=p.name;$('pDesc').value=p.description||'';$('pPrice').value=p.price;$('pSale').value=p.sale_price||'';$('pCat').value=p.category_id||'';setImg('if_pImg',p.image_url||'');const u=$('if_pImg_url');if(u)u.value=(p.image_url||'').startsWith('data:')?'':(p.image_url||'');$('pStock').checked=!!p.in_stock;$('pFeat').checked=!!p.is_featured; },50); }
async function delProduct(id){ if(!confirm('Delete this product?'))return; await axios.delete('/api/owner/products/'+id,{headers:authHeaders()}); await reload(); switchTab('products'); }
async function delCat(id){ await axios.delete('/api/owner/categories/'+id,{headers:authHeaders()}); await reload(); switchTab('products'); }

// ORDERS
function viewOrders(){
  if(!STATE.orders.length) return card('<p class="text-slate-400">No orders yet.</p>');
  return card('<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-slate-500 border-b"><th class="py-2">Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>'+
    STATE.orders.map(o=>{ let items=''; try{items=JSON.parse(o.items_json).map(i=>i.name+' x'+i.qty).join(', ')}catch(e){}
    return '<tr class="border-b"><td class="py-2"><b>'+o.customer_name+'</b><br><span class="text-xs text-slate-400">'+(o.customer_phone||'')+'</span></td><td class="text-xs">'+items+'</td><td class="font-semibold">'+STATE.store.currency+' '+o.total+'</td><td><span class="text-xs px-2 py-1 rounded '+(o.status==='completed'?'bg-green-100 text-green-700':o.status==='cancelled'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700')+'">'+o.status+'</span></td>'+
    '<td><select onchange=\\'updOrder('+o.id+',this.value)\\' class="border rounded text-xs px-1 py-1"><option>change</option><option value="confirmed">Confirm</option><option value="completed">Complete</option><option value="cancelled">Cancel</option></select></td></tr>'; }).join('')+'</tbody></table></div>');
}
async function updOrder(id,status){ if(status==='change')return; await axios.put('/api/owner/orders/'+id,{status},{headers:authHeaders()}); await reload(); switchTab('orders'); }

// ENQUIRIES
function viewEnquiries(){
  if(!STATE.enquiries.length) return card('<p class="text-slate-400">No enquiries yet.</p>');
  return STATE.enquiries.map(e=>card('<div class="flex justify-between items-start"><div><p class="font-semibold">'+(e.name||'Anonymous')+' <span class="text-xs '+(e.source==='ai_chat'?'bg-purple-100 text-purple-700':'bg-slate-100 text-slate-600')+' px-2 py-0.5 rounded ml-1">'+e.source+'</span></p><p class="text-xs text-slate-400">'+(e.phone||'')+' '+(e.email||'')+'</p><p class="mt-2 text-sm">'+e.message+'</p></div><span class="text-xs '+(e.status==='new'?'bg-indigo-100 text-indigo-700':'bg-slate-100 text-slate-500')+' px-2 py-1 rounded">'+e.status+'</span></div>','mb-3')).join('');
}

// COUPONS
function viewCoupons(){ setTimeout(()=>{ const f=$('coupForm'); if(f)f.addEventListener('submit',addCoupon); },0);
  return \`<div class="grid lg:grid-cols-2 gap-4">
  <div>\${card('<h3 class="font-bold mb-3">Active Coupons</h3>'+(STATE.coupons.map(c=>'<div class="flex justify-between items-center py-2 border-b"><div><span class="font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded">'+c.code+'</span><span class="text-sm text-slate-500 ml-2">'+(c.discount_type==='percent'?c.discount_value+'% off':STATE.store.currency+' '+c.discount_value+' off')+'</span></div><button onclick=\\'delCoupon('+c.id+')\\' class="text-red-500"><i class="fas fa-trash"></i></button></div>').join('')||'<p class="text-slate-400 text-sm">No coupons yet</p>'))}</div>
  <div>\${card('<h3 class="font-bold mb-3">Create Coupon</h3><form id="coupForm" class="space-y-2"><input id="cCode" placeholder="CODE e.g. SAVE20" class="w-full border rounded-lg px-3 py-2 text-sm uppercase" required><input id="cDesc" placeholder="Description" class="w-full border rounded-lg px-3 py-2 text-sm"><div class="grid grid-cols-2 gap-2"><select id="cType" class="border rounded-lg px-2 py-2 text-sm"><option value="percent">Percent %</option><option value="flat">Flat amount</option></select><input id="cVal" type="number" placeholder="Value" class="border rounded-lg px-3 py-2 text-sm" required></div><button class="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm">Create Coupon</button></form>')}</div>
  </div>\`;
}
async function addCoupon(e){ e.preventDefault(); await axios.post('/api/owner/coupons',{code:$('cCode').value.toUpperCase(),description:$('cDesc').value,discount_type:$('cType').value,discount_value:Number($('cVal').value),active:true},{headers:authHeaders()}); await reload(); switchTab('coupons'); }
async function delCoupon(id){ await axios.delete('/api/owner/coupons/'+id,{headers:authHeaders()}); await reload(); switchTab('coupons'); }

// PAYMENTS
const GATEWAYS=[
  {key:'',label:'— None / manual only —'},
  {key:'razorpay',label:'Razorpay (seamless popup)'},
  {key:'payu',label:'PayU'},
  {key:'cashfree',label:'Cashfree'},
  {key:'phonepe',label:'PhonePe'},
];
function gatewayHelp(p){
  const map={
    razorpay:'Key ID = "Key Id" (rzp_live_...), Secret = "Key Secret" from Razorpay → Settings → API Keys.',
    payu:'Key ID = Merchant Key, Secret = Merchant Salt from PayU dashboard.',
    cashfree:'Key ID = App ID, Secret = Secret Key from Cashfree → Developers → API Keys (Production).',
    phonepe:'Key ID = Merchant ID, Secret = Salt Key, Extra = Salt Index (usually 1).'
  };
  return map[p]||'Select a gateway to take real online payments from customers at checkout.';
}
function viewPayments(){
  const s=STATE.store; const f=(v)=>v||'';
  setTimeout(()=>{ const sel=$('paySel'); if(sel) sel.addEventListener('change',()=>{ $('payHelp').textContent=gatewayHelp(sel.value); $('phExtra').style.display=sel.value==='phonepe'?'block':'none'; }); },0);
  return card(\`<h3 class="font-bold mb-1">Online Payment Gateway</h3>
  <p class="text-slate-500 text-sm mb-3">Connect your own gateway so customers pay you <b>directly & seamlessly</b> at checkout (any amount). Keys are stored securely and never shown publicly.</p>
  <form id="gwForm" class="grid md:grid-cols-2 gap-4 mb-2">
    <div><label class="text-sm font-medium">Gateway Provider</label><select id="paySel" name="pay_provider" class="w-full border rounded-lg px-3 py-2 mt-1">\${GATEWAYS.map(g=>'<option value="'+g.key+'" '+(s.pay_provider===g.key?'selected':'')+'>'+g.label+'</option>').join('')}</select></div>
    <div><label class="text-sm font-medium">Key ID / Merchant Key</label><input name="pay_key_id" value="\${f(s.pay_key_id)}" class="w-full border rounded-lg px-3 py-2 mt-1" autocomplete="off"></div>
    <div><label class="text-sm font-medium">Secret / Salt Key</label><input name="pay_key_secret" type="password" value="\${f(s.pay_key_secret)}" class="w-full border rounded-lg px-3 py-2 mt-1" autocomplete="off"></div>
    <div id="phExtra" style="display:\${s.pay_provider==='phonepe'?'block':'none'}"><label class="text-sm font-medium">Salt Index (PhonePe)</label><input name="pay_extra" value="\${f(s.pay_extra)}" placeholder="1" class="w-full border rounded-lg px-3 py-2 mt-1"></div>
    <p id="payHelp" class="md:col-span-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2">\${gatewayHelp(s.pay_provider)}</p>
    <div class="md:col-span-2"><button class="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-indigo-700">Save Gateway</button> <span id="gwMsg" class="text-sm ml-2"></span></div>
  </form>
  <hr class="my-5">
  <h3 class="font-bold mb-1">Manual Payment Methods</h3>
  <p class="text-slate-500 text-sm mb-3">Optional. These also show at checkout for customers who prefer UPI / bank transfer.</p>
  <form id="payForm" class="grid md:grid-cols-2 gap-4">
    <div><label class="text-sm font-medium">UPI ID</label><input name="pay_upi" value="\${f(s.pay_upi)}" placeholder="yourname@upi" class="w-full border rounded-lg px-3 py-2 mt-1"></div>
    <div><label class="text-sm font-medium">Payment QR Code Image</label>\${imgField('pay_qr_url',s.pay_qr_url)}</div>
    <div class="md:col-span-2"><label class="text-sm font-medium">Bank Details</label><textarea name="pay_bank" rows="2" placeholder="Account name, number, IFSC..." class="w-full border rounded-lg px-3 py-2 mt-1">\${f(s.pay_bank)}</textarea></div>
    <div class="md:col-span-2"><label class="text-sm font-medium">Payment Link (Paytm/other hosted link)</label><input name="pay_link" value="\${f(s.pay_link)}" placeholder="https://..." class="w-full border rounded-lg px-3 py-2 mt-1"></div>
    <input type="hidden" name="pay_gateway_enabled" value="1">
    <div class="md:col-span-2"><button class="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-indigo-700">Save Manual Methods</button> <span id="payMsg" class="text-sm ml-2"></span></div>
  </form>\`);
}

// PLAN
function viewPlan(){
  const o=STATE.owner;
  return \`<div class="mb-4">\${card('<div class="flex items-center justify-between"><div><p class="text-slate-500 text-sm">Current Plan</p><p class="text-2xl font-bold capitalize">'+o.plan+(o.is_unlocked?' (Free Unlocked)':'')+'</p></div>'+planBadge()+'</div>')}</div>
  <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">\${META.plans.map(p=>'<div class="rounded-xl border-2 '+(p.popular?'border-indigo-500':'border-slate-200')+' bg-white p-5 flex flex-col"><h3 class="font-bold">'+p.name+'</h3><p class="text-xs text-slate-500 mb-2">'+p.tagline+'</p><div class="mb-3"><span class="text-2xl font-extrabold">'+(p.price===0?'Free':'₹'+p.price)+'</span><span class="text-slate-400 text-sm">/'+p.period+'</span></div><ul class="text-xs space-y-1 flex-1">'+p.features.map(x=>'<li><i class="fas fa-check text-green-500 mr-1"></i>'+x+'</li>').join('')+'</ul>'+(p.price>0?'<button onclick=\\'subscribe("'+p.key+'")\\' class="mt-3 bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm">'+(o.plan===p.key?'Renew':'Upgrade')+'</button>':'<div class="mt-3 text-center text-xs text-slate-400 py-2">Default</div>')+'</div>').join('')}</div>
  <p class="text-xs text-slate-400 mt-4">Payments are processed securely via PayU.</p>\`;
}
async function subscribe(plan){
  try{
    const {data}=await axios.post('/api/pay/subscribe',{plan,ownerId:STATE.owner.id,firstname:STATE.owner.name,email:STATE.owner.email,phone:STATE.owner.phone||'9999999999'});
    if(!data.ok){ toast(data.error,true); return; }
    if(data.mode==='link' && data.url){ window.location.href=data.url; return; }
    const form=document.createElement('form'); form.method='POST'; form.action=data.action;
    for(const k in data.fields){ const i=document.createElement('input'); i.type='hidden'; i.name=k; i.value=data.fields[k]; form.appendChild(i); }
    document.body.appendChild(form); form.submit();
  }catch(e){ toast('Payment not configured. Contact admin.',true); }
}

// SECURITY
function viewSecurity(){ setTimeout(()=>{ $('pinForm').addEventListener('submit',changePin); },0);
  return card('<h3 class="font-bold mb-3">Change Login PIN</h3><form id="pinForm" class="space-y-2 max-w-sm"><input id="newPin" type="password" placeholder="New PIN (min 4 digits)" class="w-full border rounded-lg px-3 py-2" required><button class="bg-indigo-600 text-white font-bold px-6 py-2 rounded-lg">Update PIN</button> <span id="pinMsg" class="text-sm ml-2"></span></form>');
}
async function changePin(e){ e.preventDefault(); const np=$('newPin').value; const {data}=await axios.post('/api/owner/change-pin',{newPin:np},{headers:authHeaders()}); if(data.ok){ const a=getAuth(); a.pin=np; localStorage.setItem('sb_owner',JSON.stringify(a)); $('pinMsg').textContent='✓ Updated'; $('pinMsg').className='text-sm ml-2 text-green-600'; } else { $('pinMsg').textContent=data.error; $('pinMsg').className='text-sm ml-2 text-red-500'; } }

// shared save
async function saveStore(body){ const {data}=await axios.put('/api/owner/store',body,{headers:authHeaders()}); if(data.ok) STATE.store=data.store; return data; }
function bindStoreForm(){ const f=$('storeForm'); if(!f)return; f.addEventListener('submit', async e=>{ e.preventDefault(); const fd=new FormData(f); const body={}; for(const [k,v] of fd.entries()) body[k]=v; body.is_published=f.is_published.checked?1:0; const r=await saveStore(body); $('storeMsg').textContent=r.ok?'✓ Saved':'Error'; $('storeMsg').className='text-sm ml-2 '+(r.ok?'text-green-600':'text-red-500'); }); }
function bindPayForm(){ const f=$('payForm'); if(f){ f.addEventListener('submit', async e=>{ e.preventDefault(); const fd=new FormData(f); const body={}; for(const [k,v] of fd.entries()) body[k]=v; const r=await saveStore(body); $('payMsg').textContent=r.ok?'✓ Saved':'Error'; $('payMsg').className='text-sm ml-2 text-green-600'; }); }
  const g=$('gwForm'); if(g){ g.addEventListener('submit', async e=>{ e.preventDefault(); const fd=new FormData(g); const body={}; for(const [k,v] of fd.entries()) body[k]=v; const r=await saveStore(body); $('gwMsg').textContent=r.ok?'✓ Gateway saved':'Error'; $('gwMsg').className='text-sm ml-2 text-green-600'; }); } }

// hook form binding into switchTab
const _switch = switchTab;
switchTab = function(t){ _switch(t); if(t==='store') bindStoreForm(); if(t==='payments') bindPayForm(); };

async function reload(){ const {data}=await axios.get('/api/owner/dashboard',{headers:authHeaders()}); if(data.ok){ STATE={owner:data.owner,store:data.store,products:data.products,categories:data.categories,orders:data.orders,enquiries:data.enquiries,coupons:data.coupons}; } }

function toast(msg,err){ const t=document.createElement('div'); t.className='fixed top-5 right-5 z-50 px-5 py-3 rounded-lg text-white font-semibold '+(err?'bg-red-600':'bg-green-600'); t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),3000); }

// ---------------- INIT ----------------
(async ()=>{
  await loadMeta();
  if(getAuth()){ await loadDashboard(); }
  else { const mode = location.hash==='#signup'?'signup':'login'; authScreen(mode); bindAuth(mode); }
  // re-bind auth forms when switching
  const obs=new MutationObserver(()=>{ if($('loginForm')&&!$('loginForm').dataset.b){$('loginForm').dataset.b=1;bindAuth('login');} if($('signupForm')&&!$('signupForm').dataset.b){$('signupForm').dataset.b=1;bindAuth('signup');} });
  obs.observe($('app'),{childList:true,subtree:true});
})();
</script>
</body>
</html>`
}
