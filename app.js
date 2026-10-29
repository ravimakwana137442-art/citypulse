(() => {
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATS = ['All','Roads','Electrical','Sanitation','Water','Parks'];
const STAGES = ['Reported','In Progress','Resolved'];
const PROG = {'Reported':15,'In Progress':55,'Resolved':100};
const PRI = {Low:'bg-slate-100 text-slate-600',Medium:'bg-amber-100 text-amber-700',Critical:'bg-rose-100 text-rose-700'};
const ICON = {Roads:'🛣️',Electrical:'💡',Sanitation:'🗑️',Water:'💧',Parks:'🌳'};
const OFFICERS = ['Rohan Mehta','Priya Nair','Imran Sheikh','Sunita Patel','Daniel Brooks'];
const H = 3600e3, D = 24*H, now = Date.now();
let state = {cat:'All', status:'all', q:'', resolvedBase:195, activeBase:24, nextId:8492};

const mk = (id,title,cat,dept,ward,pri,desc,status,officer,ago,steps,comments=[]) => ({id,title,cat,dept,ward,pri,desc,status,officer,progress:PROG[status],img:null,created:now-ago,
  timeline:steps.map(([label,a])=>({label,ts:now-a})),comments});
let complaints = [
 mk('#CP-8488','Pothole on 5th Avenue','Roads','Public Works','Ward 7 · 5th Ave','Critical','Deep pothole near the bus stop damaging tyres and causing sudden braking. Two near-accidents this week.','In Progress',OFFICERS[0],2*D+3*H,[['Complaint reported',2*D+3*H],['Verified by field inspector',D+20*H],['Repair crew assigned',D+2*H]],[{who:'Neha K.',text:'Saw the crew marking the area today, thanks!',ts:now-5*H}]),
 mk('#CP-8489','Water Pipeline Leak near Ward 4','Water','Water Authority','Ward 4 · Canal Rd','Critical','Main line leaking for 2 days; water pooling on the road and pressure has dropped for nearby homes.','Reported',OFFICERS[2],6*H,[['Complaint reported',6*H]]),
 mk('#CP-8490','Broken Streetlights on Elm St','Electrical','Electricity Board','Ward 2 · Elm St','Medium','Four consecutive streetlights are out, leaving the stretch very dark at night.','In Progress',OFFICERS[1],4*D,[['Complaint reported',4*D],['Inspection completed',3*D],['Parts ordered',2*D+4*H]]),
 mk('#CP-8491','Overflowing Garbage Bins at Lake Park Gate','Sanitation','Sanitation Dept.','Ward 9 · Lake Park','Low','Bins have not been cleared for several days and the smell is spreading.','Resolved',OFFICERS[3],6*D,[['Complaint reported',6*D],['Pickup scheduled',5*D],['Area cleaned & bins emptied',4*D]],[{who:'Officer Patel',text:'Cleared. Added to the daily pickup route.',ts:now-4*D}])
];
let notifs = [{t:'Welcome to CityPulse! Track your complaints here.',ts:now-H,unread:true},{t:'#CP-8488 moved to In Progress.',ts:now-5*H,unread:true},{t:'#CP-8491 has been resolved.',ts:now-4*D,unread:true}];

const ago = ts => { const m = Math.max(1,Math.round((Date.now()-ts)/6e4)); return m<60?m+'m ago':m<1440?Math.round(m/60)+'h ago':Math.round(m/1440)+'d ago'; };
const fmt = ts => new Date(ts).toLocaleString([], {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});

function toast(msg){ const t=document.createElement('div'); t.className='toast'; t.textContent=msg; $('#toasts').appendChild(t); setTimeout(()=>{t.classList.add('out'); setTimeout(()=>t.remove(),300)},3200); }
function notify(t){ notifs.unshift({t,ts:Date.now(),unread:true}); renderNotifs(); }
function renderNotifs(){
  const u = notifs.filter(n=>n.unread).length; $('#bellBadge').textContent=u; $('#bellBadge').classList.toggle('hidden',!u);
  $('#notifList').innerHTML = notifs.map(n=>`<li class="px-4 py-3 text-sm ${n.unread?'bg-indigo-50/60':''}"><p>${esc(n.t)}</p><p class="text-xs text-slate-400 mt-0.5">${ago(n.ts)}</p></li>`).join('');
}
function renderStats(){
  const resolvedNew = complaints.filter(c=>c.status==='Resolved' && c.resolvedNow).length;
  const addedActive = complaints.filter(c=>c.userAdded && c.status!=='Resolved').length;
  const res = state.resolvedBase + resolvedNew, act = state.activeBase + addedActive - resolvedNew;
  const pct = Math.round(res/(res+act)*100);
  $('#stResolved').textContent = pct+'%'; $('#stResolvedBar').style.width = pct+'%'; $('#stActive').textContent = act;
  const crit = {}; complaints.filter(c=>c.pri==='Critical'&&c.status!=='Resolved').forEach(c=>crit[c.dept]=(crit[c.dept]||0)+1);
  const top = Object.entries(crit).sort((a,b)=>b[1]-a[1])[0];
  $('#stDept').textContent = top?top[0]:'Public Works'; $('#stDeptSub').textContent = top?top[1]+' critical open ticket'+(top[1]>1?'s':''):'Most critical tickets';
}
function pipeline(status){
  const i = STAGES.indexOf(status);
  return `<div class="flex items-center gap-1.5 text-[11px] font-semibold">${STAGES.map((s,k)=>`<span class="flex items-center gap-1 ${k<=i?(i===2?'text-emerald-600':'text-indigo-600'):'text-slate-300'}"><span class="h-2 w-2 rounded-full ${k<=i?(i===2?'bg-emerald-500':'bg-indigo-500'):'bg-slate-200'}"></span>${s}</span>${k<2?`<span class="h-px w-4 ${k<i?'bg-indigo-300':'bg-slate-200'}"></span>`:''}`).join('')}</div>`;
}
function renderTabs(){
  $('#tabs').innerHTML = CATS.map(c=>`<button data-cat="${c}" class="tab ${state.cat===c?'on':''}">${c}</button>`).join('');
}
function filtered(){
  const q = state.q.toLowerCase();
  return complaints.filter(c => (state.cat==='All'||c.cat===state.cat) && (state.status==='all'||c.status===state.status) &&
    (!q || [c.title,c.id,c.ward,c.dept,c.desc,c.cat].some(v=>v.toLowerCase().includes(q))));
}
function renderFeed(newId){
  const list = filtered();
  $('#feed').innerHTML = list.length ? list.map(c=>`
   <article data-id="${c.id}" class="card ccard p-4 ${c.id===newId?'new-item':''}">
     <div class="flex gap-3">
       <div class="h-11 w-11 shrink-0 rounded-xl bg-slate-100 grid place-items-center text-xl overflow-hidden">${c.img?`<img src="${c.img}" class="h-full w-full object-cover" alt="">`:ICON[c.cat]}</div>
       <div class="flex-1 min-w-0">
         <div class="flex flex-wrap items-center gap-2"><h3 class="font-semibold truncate">${esc(c.title)}</h3><span class="badge ${PRI[c.pri]}">${c.pri}</span></div>
         <p class="text-xs text-slate-500 mt-0.5">${c.id} · ${esc(c.ward)} · ${esc(c.dept)} · ${ago(c.created)}</p>
         <p class="text-sm text-slate-600 mt-2 line-clamp-2">${esc(c.desc)}</p>
         <div class="mt-3 flex flex-wrap items-center justify-between gap-2">${pipeline(c.status)}<span class="text-xs text-slate-400">💬 ${c.comments.length}</span></div>
       </div>
     </div>
   </article>`).join('') : `<div class="card p-10 text-center text-slate-500">No complaints match your filters.</div>`;
}
function openModal(id){
  const c = complaints.find(x=>x.id===id); if(!c) return;
  $('#modalBody').innerHTML = `
  <div class="p-5 sm:p-6 border-b border-slate-100 flex justify-between gap-4">
    <div><div class="flex items-center gap-2 mb-1"><span class="text-xs font-bold text-indigo-600">${c.id}</span><span class="badge ${PRI[c.pri]}">${c.pri}</span></div>
    <h2 class="text-xl font-extrabold tracking-tight">${esc(c.title)}</h2><p class="text-xs text-slate-500 mt-1">${esc(c.ward)} · ${esc(c.dept)} · Filed ${fmt(c.created)}</p></div>
    <button id="closeModal" class="h-8 w-8 shrink-0 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Close">✕</button>
  </div>
  <div class="p-5 sm:p-6 space-y-5">
    ${c.img?`<img src="${c.img}" class="w-full max-h-56 object-cover rounded-xl" alt="Attached">`:''}
    <p class="text-sm text-slate-600">${esc(c.desc)}</p>
    <div><div class="flex justify-between text-xs font-semibold mb-1.5"><span>${c.status}</span><span>${c.progress}%</span></div>
      <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full ${c.status==='Resolved'?'bg-emerald-500':'bg-indigo-500'} transition-all duration-700" style="width:${c.progress}%"></div></div><div class="mt-3">${pipeline(c.status)}</div></div>
    <div class="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-3">
      <div class="flex items-center gap-3"><div class="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-sm font-bold">${esc(c.officer.split(' ').map(w=>w[0]).join(''))}</div><div><p class="text-sm font-semibold">${esc(c.officer)}</p><p class="text-xs text-slate-500">Assigned maintenance officer</p></div></div>
      ${c.status!=='Resolved'?`<button id="advBtn" class="text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition">Advance → ${STAGES[STAGES.indexOf(c.status)+1]}</button>`:'<span class="text-xs font-semibold text-emerald-600">✔ Closed</span>'}</div>
    <div><h3 class="font-bold text-sm mb-3">Tracking Timeline</h3><ol class="border-l-2 border-slate-200 ml-1.5 space-y-3">
      ${c.timeline.map((t,i)=>`<li class="pl-4 relative"><span class="absolute -left-[7px] top-1 h-3 w-3 rounded-full ${i===c.timeline.length-1?'bg-indigo-500 ring-4 ring-indigo-100':'bg-slate-300'}"></span><p class="text-sm font-medium">${esc(t.label)}</p><p class="text-xs text-slate-400">${fmt(t.ts)}</p></li>`).join('')}</ol></div>
    <div><h3 class="font-bold text-sm mb-3">Comments &amp; Updates</h3>
      <div class="space-y-2 mb-3">${c.comments.length?c.comments.map(m=>`<div class="bg-slate-50 rounded-xl p-3"><p class="text-xs"><b>${esc(m.who)}</b> <span class="text-slate-400">· ${ago(m.ts)}</span></p><p class="text-sm mt-0.5">${esc(m.text)}</p></div>`).join(''):'<p class="text-sm text-slate-400">No comments yet.</p>'}</div>
      <form id="cmtForm" class="flex gap-2"><input id="cmtInput" required placeholder="Add an update…" class="field flex-1"><button class="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition">Post</button></form></div>
  </div>`;
  $('#modal').classList.remove('hidden'); document.body.style.overflow='hidden';
  $('#closeModal').onclick = closeModal;
  $('#cmtForm').onsubmit = e => { e.preventDefault(); const v=$('#cmtInput').value.trim(); if(!v) return; c.comments.push({who:'You',text:v,ts:Date.now()}); toast('Comment posted'); renderFeed(); openModal(id); };
  const adv = $('#advBtn'); if(adv) adv.onclick = () => {
    c.status = STAGES[STAGES.indexOf(c.status)+1]; c.progress = PROG[c.status];
    c.timeline.push({label: c.status==='Resolved'?'Issue resolved & closed':'Work started by field team', ts:Date.now()});
    if(c.status==='Resolved') c.resolvedNow = true;
    notify(`${c.id} moved to ${c.status}.`); toast(`${c.id} → ${c.status}`); renderStats(); renderFeed(); openModal(id);
  };
}
function closeModal(){ $('#modal').classList.add('hidden'); document.body.style.overflow=''; }

// events
$('#tabs').addEventListener('click', e => { const b=e.target.closest('[data-cat]'); if(!b) return; state.cat=b.dataset.cat; renderTabs(); renderFeed(); });
$('#statusFilter').onchange = e => { state.status=e.target.value; renderFeed(); };
const setQ = v => { state.q=v; $('#globalSearch').value=v; $('#feedSearch').value=v; renderFeed(); };
$('#globalSearch').oninput = e => setQ(e.target.value);
$('#feedSearch').oninput = e => setQ(e.target.value);
$('#feed').addEventListener('click', e => { const a=e.target.closest('[data-id]'); if(a) openModal(a.dataset.id); });
$('#modal').addEventListener('click', e => { if(e.target.id==='modal') closeModal(); });
document.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });
$('#bellBtn').onclick = e => { e.stopPropagation(); $('#notifPanel').classList.toggle('hidden'); };
document.addEventListener('click', e => { if(!e.target.closest('#notifPanel')) $('#notifPanel').classList.add('hidden'); });
$('#markRead').onclick = () => { notifs.forEach(n=>n.unread=false); renderNotifs(); };

// image upload
let imgData = null;
function loadFile(f){ if(!f||!f.type.startsWith('image/')) return toast('Please choose an image file'); const r=new FileReader(); r.onload=()=>{ imgData=r.result; $('#preview').src=imgData; $('#preview').classList.remove('hidden'); $('#dropHint').classList.add('hidden'); }; r.readAsDataURL(f); }
$('#fileInput').onchange = e => loadFile(e.target.files[0]);
['dragover','dragenter'].forEach(ev=>$('#drop').addEventListener(ev,e=>{e.preventDefault();$('#drop').classList.add('border-indigo-400','bg-indigo-50/40');}));
['dragleave','drop'].forEach(ev=>$('#drop').addEventListener(ev,e=>{e.preventDefault();$('#drop').classList.remove('border-indigo-400','bg-indigo-50/40');}));
$('#drop').addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));

$('#reportForm').onsubmit = e => {
  e.preventDefault(); const f = new FormData(e.target); const id = '#CP-' + (++state.nextId + 1);
  const c = {id,title:f.get('title').trim(),cat:f.get('cat'),dept:f.get('dept'),ward:f.get('ward').trim(),pri:f.get('pri'),desc:f.get('desc').trim(),status:'Reported',progress:15,
    officer:OFFICERS[Math.floor(Math.random()*OFFICERS.length)],img:imgData,created:Date.now(),userAdded:true,timeline:[{label:'Complaint reported',ts:Date.now()}],comments:[]};
  complaints.unshift(c); e.target.reset(); imgData=null; $('#preview').classList.add('hidden'); $('#dropHint').classList.remove('hidden');
  state.cat='All'; state.status='all'; $('#statusFilter').value='all'; setQ(''); renderTabs(); renderFeed(id); renderStats();
  notify(`${id} submitted and routed to ${c.dept}.`); toast(`✅ Complaint ${id} submitted successfully`);
};

setInterval(()=>{ $('#clock').innerHTML = new Date().toLocaleDateString([], {weekday:'short',day:'numeric',month:'short'}) + '<br><b class="text-white">' + new Date().toLocaleTimeString() + '</b>'; },1000);
$('#clock').innerHTML = '&nbsp;';
renderTabs(); renderFeed(); renderStats(); renderNotifs();
})();
