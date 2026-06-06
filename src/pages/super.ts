export function superApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Super Admin – StoreFront Pro</title>
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
      <p class="text-center text-xs text-slate-500 mt-4">Default PIN: 2005#### (change after login)</p>
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
        <thead><tr class="text-left text-slate-400 border-b border-slate-700"><th class="p-3">ID</th><th>Name</th><th>Store</th><th>Plan</th><th>Status</th><th>Free Access</th></tr></thead>
        <tbody>\${DATA.owners.map(o=>\`<tr class="border-b border-slate-700/50">
          <td class="p-3">\${o.id}</td>
          <td><b>\${o.name}</b><br><span class="text-xs text-slate-400">\${o.email}</span></td>
          <td>\${o.store_name?'<a class="text-indigo-400" target="_blank" href="/s/'+o.store_slug+'">'+o.store_name+'</a>':'—'}</td>
          <td><span class="capitalize bg-slate-700 px-2 py-1 rounded text-xs">\${o.plan}</span></td>
          <td>\${o.plan_status==='active'?'<span class="text-green-400">●</span> active':'<span class="text-red-400">●</span> '+o.plan_status}</td>
          <td><button onclick="toggleUnlock(\${o.id},\${o.is_unlocked?0:1})" class="\${o.is_unlocked?'bg-green-600':'bg-slate-600'} px-3 py-1 rounded text-xs font-semibold">\${o.is_unlocked?'✓ Unlocked':'Unlock Free'}</button></td>
        </tr>\`).join('')||'<tr><td colspan=6 class="p-6 text-center text-slate-500">No owners yet</td></tr>'}</tbody>
      </table></div>
    </div>
    <p class="text-xs text-slate-500 mt-4">Tip: "Unlock Free" gives an owner full enterprise access at no charge (for your own testing or special deals).</p>
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
  </div>\`;
  $('cpForm').addEventListener('submit', async e=>{
    e.preventDefault(); const newPin=$('cpNew').value;
    const {data}=await axios.post('/api/super/change-pin',{pin:PIN,newPin});
    if(data.ok){ PIN=newPin; sessionStorage.setItem('sb_super_pin',newPin); $('cpMsg').textContent='✓ PIN changed'; $('cpMsg').className='text-sm text-center text-green-400'; setTimeout(()=>$('pinModal').classList.add('hidden'),1000); }
    else { $('cpMsg').textContent=data.error; $('cpMsg').className='text-sm text-center text-red-400'; }
  });
}
function showChangePin(){ const m=$('pinModal'); m.classList.remove('hidden'); m.classList.add('flex'); }
async function toggleUnlock(id,unlock){ await axios.post('/api/super/unlock',{pin:PIN,ownerId:id,unlock}); await loadDash(); }
function logout(){ sessionStorage.removeItem('sb_super_pin'); loginScreen(); }

(async ()=>{ if(PIN){ await loadDash(); } else loginScreen(); })();
</script>
</body>
</html>`
}
