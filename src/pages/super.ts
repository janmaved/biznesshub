export function superApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Super Admin – Storenest</title>
  <meta name="robots" content="noindex">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
<div id="app"></div>
<script>
const $=(id)=>document.getElementById(id);
let PIN=sessionStorage.getItem('sb_super_pin')||'';
let DATA={owners:[],subscriptions:[]};

function loginScreen(){
  $('app').innerHTML=\`
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-slate-800 rounded-2xl p-8 shadow-2xl">
      <div class="text-center mb-6"><i class="fas fa-shield-halved text-4xl text-indigo-400"></i><h1 class="text-xl font-bold mt-2">Super Admin</h1><p class="text-slate-400 text-sm">Platform owner access</p></div>
      <form id="sForm" class="space-y-3">
        <input id="sPin" type="password" placeholder="Enter admin PIN" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-3 text-center tracking-widest" required>
        <button class="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-3 rounded-lg">Unlock</button>
        <p id="sMsg" class="text-sm text-center text-red-400"></p>
      </form>
      <p class="text-center text-xs text-slate-500 mt-4">Restricted area · authorised personnel only</p>
    </div>
  </div>\`;
  $('sForm').addEventListener('submit', async e=>{
    e.preventDefault(); const pin=$('sPin').value;
    const {data}=await axios.post('/api/super/login',{pin});
    if(!data.ok){ $('sMsg').textContent='Invalid PIN'; return; }
    PIN=pin; sessionStorage.setItem('sb_super_pin',pin); await loadDash();
  });
}

async function loadDash(){
  const {data}=await axios.post('/api/super/owners',{pin:PIN});
  if(!data.ok){ sessionStorage.removeItem('sb_super_pin'); loginScreen(); return; }
  DATA=data; renderDash();
}

function renderDash(){
  const totalRev=DATA.subscriptions.filter(s=>s.status==='success').reduce((a,s)=>a+s.amount,0);
  $('app').innerHTML=\`
  <div class="max-w-6xl mx-auto p-4 md:p-8">
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <div><h1 class="text-2xl font-bold"><i class="fas fa-shield-halved text-indigo-400"></i> Super Admin</h1><p class="text-slate-400 text-sm">Manage all business owners</p></div>
      <div class="flex gap-2">
        <button onclick="showChangePin()" class="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm"><i class="fas fa-key mr-1"></i> Change PIN</button>
        <button onclick="logout()" class="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm"><i class="fas fa-sign-out-alt mr-1"></i> Logout</button>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-slate-800 rounded-xl p-5"><p class="text-slate-400 text-sm">Total Owners</p><p class="text-3xl font-extrabold">\${DATA.owners.length}</p></div>
      <div class="bg-slate-800 rounded-xl p-5"><p class="text-slate-400 text-sm">Active Subs</p><p class="text-3xl font-extrabold">\${DATA.owners.filter(o=>o.plan_status==='active'&&o.plan!=='trial').length}</p></div>
      <div class="bg-slate-800 rounded-xl p-5"><p class="text-slate-400 text-sm">Revenue (paid)</p><p class="text-3xl font-extrabold">₹\${totalRev}</p></div>
    </div>
    <div class="bg-slate-800 rounded-xl overflow-hidden">
      <div class="p-4 border-b border-slate-700 font-bold">Business Owners</div>
      <div class="overflow-x-auto"><table class="w-full text-sm">
        <thead><tr class="text-left text-slate-400 border-b border-slate-700"><th class="p-3">ID</th><th>Name</th><th>Store</th><th>Plan</th><th>Status</th><th>Domain</th><th>Free Access</th></tr></thead>
        <tbody>\${DATA.owners.map(o=>\`<tr class="border-b border-slate-700/50">
          <td class="p-3">\${o.id}</td>
          <td><b>\${o.name}</b><br><span class="text-xs text-slate-400">\${o.email}</span></td>
          <td>\${o.store_name?'<a class="text-indigo-400" target="_blank" href="/s/'+o.store_slug+'">'+o.store_name+'</a>':'—'}</td>
          <td><span class="capitalize bg-slate-700 px-2 py-1 rounded text-xs">\${o.plan}</span></td>
          <td>\${o.plan_status==='active'?'<span class="text-green-400">●</span> active':'<span class="text-red-400">●</span> '+o.plan_status}</td>
          <td><div class="text-xs">\${o.subdomain?'<span class="text-indigo-300">'+o.subdomain+'.storenest.app</span><br>':''}\${o.custom_domain?'<span class="text-green-300">'+o.custom_domain+'</span><br>':''}<button onclick="openDomain(\${o.id})" class="mt-1 bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded text-xs">\${(o.subdomain||o.custom_domain)?'Edit':'Connect'} domain</button></div></td>
          <td><button onclick="toggleUnlock(\${o.id},\${o.is_unlocked?0:1})" class="\${o.is_unlocked?'bg-green-600':'bg-slate-600'} px-3 py-1 rounded text-xs font-semibold">\${o.is_unlocked?'✓ Unlocked':'Unlock Free'}</button><br><button onclick="openPay(\${o.id})" class="mt-1 bg-emerald-700 hover:bg-emerald-600 px-2 py-1 rounded text-xs">✓ Confirm Payment</button>\${o.plan_expires_at?'<br><span class="text-[10px] text-slate-400">exp: '+(o.plan_expires_at||'').slice(0,10)+'</span>':''}</td>
        </tr>\`).join('')||'<tr><td colspan=7 class="p-6 text-center text-slate-500">No owners yet</td></tr>'}</tbody>
      </table></div>
    </div>
    <p class="text-xs text-slate-500 mt-4">Tip: "Unlock Free" gives an owner full enterprise access at no charge (for your own testing or special deals).</p>

    <div class="bg-slate-800 rounded-xl overflow-hidden mt-6">
      <div class="p-4 border-b border-slate-700 font-bold flex justify-between items-center"><span><i class="fas fa-crown mr-1 text-amber-400"></i> Subscription Plans &amp; Pricing</span><button onclick="savePlans()" class="bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded text-sm font-semibold">Save Plans</button></div>
      <div id="planBox" class="p-4 grid md:grid-cols-2 gap-4 text-sm">Loading…</div>
    </div>

    <div class="bg-slate-800 rounded-xl overflow-hidden mt-6">
      <div class="p-4 border-b border-slate-700 font-bold flex justify-between items-center"><span><i class="fas fa-pen mr-1 text-cyan-400"></i> Website Texts &amp; Branding</span><button onclick="saveSite()" class="bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded text-sm font-semibold">Save Texts</button></div>
      <div id="siteBox" class="p-4 space-y-3 text-sm">Loading…</div>
    </div>

    <div class="bg-slate-800 rounded-xl overflow-hidden mt-6">
      <div class="p-4 border-b border-slate-700 font-bold flex justify-between items-center"><span><i class="fas fa-headset mr-1 text-indigo-400"></i> Support Tickets</span><button onclick="loadTickets()" class="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm"><i class="fas fa-rotate"></i> Refresh</button></div>
      <div id="ticketBox" class="p-4 space-y-3 text-sm">Loading…</div>
    </div>
  </div>
  <div id="payModal" class="fixed inset-0 bg-black/60 hidden items-center justify-center p-4 z-50">
    <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
      <h3 class="font-bold mb-1">Confirm Payment &amp; Activate</h3>
      <p class="text-xs text-slate-400 mb-3">Use this ONLY after the owner has actually paid (e.g. via your payment link). This activates a monthly plan for 30 days, then it auto-locks.</p>
      <form id="payForm" class="space-y-3">
        <input type="hidden" id="payOwner">
        <select id="payPlan" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"></select>
        <div class="flex gap-2"><button class="flex-1 bg-emerald-600 py-2 rounded-lg font-semibold">Activate</button><button type="button" onclick="$('payModal').classList.add('hidden')" class="flex-1 bg-slate-600 py-2 rounded-lg">Cancel</button></div>
        <p id="payMsg" class="text-sm text-center"></p>
      </form>
    </div>
  </div>
  <div id="pinModal" class="fixed inset-0 bg-black/60 hidden items-center justify-center p-4 z-50">
    <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
      <h3 class="font-bold mb-3">Change Admin PIN</h3>
      <form id="cpForm" class="space-y-3">
        <input id="cpNew" type="password" placeholder="New PIN (min 4)" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2">
        <div class="flex gap-2"><button class="flex-1 bg-indigo-600 py-2 rounded-lg font-semibold">Save</button><button type="button" onclick="$('pinModal').classList.add('hidden')" class="flex-1 bg-slate-600 py-2 rounded-lg">Cancel</button></div>
        <p id="cpMsg" class="text-sm text-center"></p>
      </form>
    </div>
  </div>
  <div id="domModal" class="fixed inset-0 bg-black/60 hidden items-center justify-center p-4 z-50">
    <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
      <h3 class="font-bold mb-1">Connect Domain</h3>
      <p class="text-xs text-slate-400 mb-3">Starter plan → free subdomain. Growth/Enterprise → custom domain.</p>
      <form id="domForm" class="space-y-3">
        <input type="hidden" id="domOwner">
        <div>
          <label class="text-xs text-slate-400">Free subdomain</label>
          <div class="flex items-center bg-slate-700 border border-slate-600 rounded-lg overflow-hidden">
            <input id="domSub" oninput="$('domSubPrev').textContent=(this.value||'yourstore')" placeholder="yourstore" class="flex-1 bg-transparent px-3 py-2 outline-none">
            <span class="px-2 text-slate-400 text-sm">.storenest.app</span>
          </div>
          <p class="text-xs text-indigo-300 mt-1">Preview: <span id="domSubPrev">yourstore</span>.storenest.app</p>
        </div>
        <div>
          <label class="text-xs text-slate-400">Custom domain (optional)</label>
          <input id="domCustom" placeholder="www.example.com" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2">
        </div>
        <div id="domSteps" class="hidden text-xs bg-slate-900/60 border border-slate-700 rounded-lg p-3 space-y-2">
          <p class="font-semibold text-amber-300">Real connect — 2 steps (like Shopify):</p>
          <p><b>1.</b> In Cloudflare → your Pages project → <b>Custom domains</b> → <b>Set up a domain</b> → enter this domain. Cloudflare issues SSL automatically.</p>
          <p><b>2.</b> At your domain registrar, add a DNS record:</p>
          <div class="bg-black/40 rounded p-2 font-mono leading-5">
            <div>Type: <b>CNAME</b> (apex → use <b>A/ALIAS</b>)</div>
            <div>Name: <b id="dnsName">www</b></div>
            <div>Target: <b id="dnsTarget" class="text-green-300">your-app.pages.dev</b></div>
          </div>
          <p class="text-slate-400">DNS takes 5–30 min. Then click <b>Verify</b>. Once verified, the owner's store opens on this domain and every change auto-applies.</p>
          <p>Status: <span id="domStatus" class="font-semibold">—</span></p>
        </div>
        <div class="flex gap-2">
          <button class="flex-1 bg-indigo-600 py-2 rounded-lg font-semibold">Save</button>
          <button type="button" id="domVerifyBtn" onclick="verifyDomain()" class="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg font-semibold">Verify</button>
          <button type="button" onclick="$('domModal').classList.add('hidden')" class="px-4 bg-slate-600 py-2 rounded-lg">Close</button>
        </div>
        <p id="domMsg" class="text-sm text-center"></p>
      </form>
    </div>
  </div>\`;
  $('cpForm').addEventListener('submit', async e=>{
    e.preventDefault(); const newPin=$('cpNew').value;
    const {data}=await axios.post('/api/super/change-pin',{pin:PIN,newPin});
    if(data.ok){ PIN=newPin; sessionStorage.setItem('sb_super_pin',newPin); $('cpMsg').textContent='✓ PIN changed'; $('cpMsg').className='text-sm text-center text-green-400'; setTimeout(()=>$('pinModal').classList.add('hidden'),1000); }
    else { $('cpMsg').textContent=data.error; $('cpMsg').className='text-sm text-center text-red-400'; }
  });
  $('domForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const ownerId=$('domOwner').value, subdomain=$('domSub').value.trim(), customDomain=$('domCustom').value.trim();
    const {data}=await axios.post('/api/super/domain',{pin:PIN,ownerId,subdomain,customDomain});
    if(data.ok){
      if(customDomain){ $('domMsg').textContent='✓ Saved. Now add the DNS record below, then click Verify.'; $('domMsg').className='text-sm text-center text-green-400'; domRenderSteps(data.custom_domain, data.domain_status); loadDash(); }
      else { $('domMsg').textContent='✓ Saved'; $('domMsg').className='text-sm text-center text-green-400'; setTimeout(()=>{$('domModal').classList.add('hidden'); loadDash();},800); }
    }
    else { $('domMsg').textContent=data.error||'Error'; $('domMsg').className='text-sm text-center text-red-400'; }
  });
  $('payForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const {data}=await axios.post('/api/super/confirm-payment',{pin:PIN,ownerId:$('payOwner').value,plan:$('payPlan').value});
    if(data.ok){ $('payMsg').textContent='✓ Activated (30 days)'; $('payMsg').className='text-sm text-center text-green-400'; setTimeout(()=>{$('payModal').classList.add('hidden'); loadDash();},800); }
    else { $('payMsg').textContent=data.error||'Error'; $('payMsg').className='text-sm text-center text-red-400'; }
  });
  loadTickets(); loadConfig();
}

let CONFIG={plans:[],site:{}};
async function loadConfig(){
  const {data}=await axios.post('/api/super/config',{pin:PIN});
  if(!data.ok) return; CONFIG=data; renderPlans(); renderSite();
}
function renderPlans(){
  const box=$('planBox'); if(!box) return;
  box.innerHTML=CONFIG.plans.map((p,i)=>\`
    <div class="bg-slate-900/50 rounded-lg p-3 border border-slate-700" data-plan="\${p.key}">
      <p class="font-bold mb-2 capitalize">\${p.key}\${p.key==='trial'?' (free)':''}</p>
      <label class="text-xs text-slate-400">Name</label><input class="pl-name w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 mb-2" value="\${(p.name||'').replace(/"/g,'&quot;')}">
      <div class="grid grid-cols-2 gap-2 mb-2">
        <div><label class="text-xs text-slate-400">Price ₹/mo</label><input type="number" class="pl-price w-full bg-slate-700 border border-slate-600 rounded px-2 py-1" value="\${p.price||0}"></div>
        <div><label class="text-xs text-slate-400">MRP (strike)</label><input type="number" class="pl-mrp w-full bg-slate-700 border border-slate-600 rounded px-2 py-1" value="\${p.mrp||''}"></div>
      </div>
      <label class="text-xs text-slate-400">Deal badge</label><input class="pl-deal w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 mb-2" value="\${(p.deal||'').replace(/"/g,'&quot;')}">
      <label class="text-xs text-slate-400">Tagline</label><input class="pl-tag w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 mb-2" value="\${(p.tagline||'').replace(/"/g,'&quot;')}">
      <label class="text-xs text-slate-400">Features (one per line)</label><textarea rows="4" class="pl-feats w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 mb-2">\${(p.features||[]).join('\\n')}</textarea>
      \${p.key!=='trial'?'<label class="text-xs text-amber-400">Payment link for this plan (PayU/Cashfree/Razorpay)</label><input class="pl-link w-full bg-slate-700 border border-amber-700 rounded px-2 py-1" placeholder="https://..." value="'+((p.payLink||'').replace(/"/g,'&quot;'))+'">':''}
    </div>\`).join('');
}
async function savePlans(){
  const plans=Array.from(document.querySelectorAll('[data-plan]')).map(d=>({
    key:d.getAttribute('data-plan'),
    name:d.querySelector('.pl-name').value,
    price:Number(d.querySelector('.pl-price').value)||0,
    mrp:d.querySelector('.pl-mrp').value,
    deal:d.querySelector('.pl-deal').value,
    tagline:d.querySelector('.pl-tag').value,
    features:d.querySelector('.pl-feats').value.split('\\n').map(s=>s.trim()).filter(Boolean),
    payLink:d.querySelector('.pl-link')?d.querySelector('.pl-link').value:''
  }));
  const {data}=await axios.post('/api/super/plans',{pin:PIN,plans});
  if(data.ok){ CONFIG.plans=data.plans; alert('✓ Plans saved'); } else alert('Error');
}
function renderSite(){
  const s=CONFIG.site||{}; const box=$('siteBox'); if(!box) return;
  box.innerHTML=\`
    <div><label class="text-xs text-slate-400">Brand name</label><input id="st_brand" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2" value="\${(s.brand_name||'').replace(/"/g,'&quot;')}"></div>
    <div><label class="text-xs text-slate-400">Hero title</label><input id="st_ht" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2" value="\${(s.hero_title||'').replace(/"/g,'&quot;')}"></div>
    <div><label class="text-xs text-slate-400">Hero subtitle</label><textarea id="st_hs" rows="2" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2">\${s.hero_subtitle||''}</textarea></div>
    <div><label class="text-xs text-slate-400">Support email</label><input id="st_em" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2" value="\${(s.support_email||'').replace(/"/g,'&quot;')}"></div>\`;
}
async function saveSite(){
  const site={brand_name:$('st_brand').value,hero_title:$('st_ht').value,hero_subtitle:$('st_hs').value,support_email:$('st_em').value};
  const {data}=await axios.post('/api/super/site',{pin:PIN,site});
  if(data.ok){ CONFIG.site=data.site; alert('✓ Texts saved'); } else alert('Error');
}
function openPay(id){
  $('payOwner').value=id; $('payMsg').textContent='';
  $('payPlan').innerHTML=CONFIG.plans.filter(p=>p.price>0).map(p=>'<option value="'+p.key+'">'+p.name+' — ₹'+p.price+'/mo</option>').join('');
  const m=$('payModal'); m.classList.remove('hidden'); m.classList.add('flex');
}
function showChangePin(){ const m=$('pinModal'); m.classList.remove('hidden'); m.classList.add('flex'); }
async function toggleUnlock(id,unlock){ await axios.post('/api/super/unlock',{pin:PIN,ownerId:id,unlock}); await loadDash(); }
function logout(){ sessionStorage.removeItem('sb_super_pin'); loginScreen(); }

function openDomain(id){
  const o=DATA.owners.find(x=>x.id===id)||{};
  $('domOwner').value=id; $('domSub').value=o.subdomain||''; $('domCustom').value=o.custom_domain||'';
  $('domSubPrev').textContent=(o.subdomain||'yourstore'); $('domMsg').textContent='';
  domRenderSteps(o.custom_domain||'', o.domain_status||'');
  const m=$('domModal'); m.classList.remove('hidden'); m.classList.add('flex');
}
function domRenderSteps(dom, status){
  const steps=$('domSteps'); if(!steps) return;
  if(!dom){ steps.classList.add('hidden'); return; }
  steps.classList.remove('hidden');
  dom=dom.toLowerCase().replace(/^https?:\\/\\//,'').replace(/\\/.*$/,'');
  const isApex = dom.split('.').length<=2;
  $('dnsName').textContent = isApex ? '@' : dom.split('.')[0];
  $('dnsTarget').textContent = location.host;
  const map={connected:'✅ Connected & live',pending:'⏳ Pending DNS — click Verify',none:'—'};
  $('domStatus').textContent = map[status]||'⏳ Pending — click Verify';
  $('domStatus').className='font-semibold '+(status==='connected'?'text-green-400':'text-amber-300');
}
async function verifyDomain(){
  const ownerId=$('domOwner').value, dom=$('domCustom').value.trim();
  if(!dom){ $('domMsg').textContent='Enter a custom domain & Save first'; $('domMsg').className='text-sm text-center text-amber-400'; return; }
  $('domMsg').textContent='Checking DNS…'; $('domMsg').className='text-sm text-center text-slate-300';
  const {data}=await axios.post('/api/super/domain/verify',{pin:PIN,ownerId});
  if(data.ok && data.verified){ $('domMsg').textContent='✅ Verified! Store is live at '+data.domain; $('domMsg').className='text-sm text-center text-green-400'; domRenderSteps(dom,'connected'); loadDash(); }
  else { $('domMsg').textContent='⏳ '+(data.detail||'Not connected yet')+'. DNS may still be propagating — try again in a few minutes.'; $('domMsg').className='text-sm text-center text-amber-400'; domRenderSteps(dom,'pending'); }
}
async function loadTickets(){
  const box=$('ticketBox'); if(!box) return;
  const {data}=await axios.post('/api/super/tickets',{pin:PIN});
  if(!data.ok){ box.innerHTML='<p class="text-slate-500">Could not load.</p>'; return; }
  if(!data.tickets.length){ box.innerHTML='<p class="text-slate-500">No tickets yet.</p>'; return; }
  box.innerHTML=data.tickets.map(t=>\`
    <div class="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
      <div class="flex justify-between items-start"><div><b>\${t.subject}</b><br><span class="text-xs text-slate-400">#\${t.id} · \${t.name||'—'} · \${t.email}</span></div><span class="text-xs px-2 py-0.5 rounded \${t.status==='answered'?'bg-green-700':'bg-amber-700'}">\${t.status}</span></div>
      <div class="space-y-1 my-2">\${(t.messages||[]).map(m=>'<div class="text-xs '+(m.sender==='user'?'text-slate-300':'text-indigo-300')+'"><b>'+(m.sender==='user'?'User':'You')+':</b> '+(m.body||'')+'</div>').join('')}</div>
      <div class="flex gap-2"><input id="rt\${t.id}" placeholder="Reply…" class="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"><button onclick="replyTicket(\${t.id})" class="bg-indigo-600 px-3 rounded text-sm">Send</button></div>
    </div>\`).join('');
}
async function replyTicket(id){
  const v=$('rt'+id).value; if(!v) return;
  await axios.post('/api/super/tickets/'+id+'/reply',{pin:PIN,body:v});
  loadTickets();
}

(async ()=>{ if(PIN){ await loadDash(); } else loginScreen(); })();
</script>
</body>
</html>`
}
