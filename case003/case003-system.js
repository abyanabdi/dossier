(()=>{
'use strict';
const stages=[
 {id:'overview',file:'case003.html',label:'Case File',objective:'Review the case and open the official briefing.'},
 {id:'briefing',file:'briefing.html',label:'Briefing',objective:'Review the incident report and accept the assignment.'},
 {id:'scene',file:'crime-scene.html',label:'Crime Scene',objective:'Document the scene and identify every relevant evidence item.'},
 {id:'locker',file:'evidence-locker.html',label:'Evidence',objective:'Inspect, classify, and release the evidence for testing.'},
 {id:'lab',file:'lab.html',label:'Laboratory',objective:'Complete every forensic station and record the findings.'},
 {id:'interviews',file:'interviews.html',label:'Interviews',objective:'Interview all four persons of interest and close each session.'},
 {id:'board',file:'investigation-board.html',label:'Case Board',objective:'Connect the evidence, establish probable cause, and request a warrant.'},
 {id:'resolution',file:'case-resolution.html',label:'Resolution',objective:'Review the reconstruction, secure the confession, and close the case.'},
 {id:'complete',file:'casecomplete003.html',label:'Certificate',objective:'Review your result and archive CASE 003.'}
];
const currentFile=(location.pathname.split('/').pop()||'case003.html').toLowerCase();
const currentIndex=Math.max(0,stages.findIndex(s=>s.file===currentFile));
const STORAGE_KEY='dossierCase003FlagshipV3';
const oldKey='dossierCase003ProgressV2';
const defaults={highest:0,completed:[],notes:'',startedAt:Date.now(),lastSeen:Date.now(),score:{evidence:0,analysis:0,interviews:0,deduction:0},name:''};
let state={...defaults};
try{state={...defaults,...JSON.parse(localStorage.getItem(STORAGE_KEY)||localStorage.getItem(oldKey)||'{}')};}catch(_){state={...defaults};}
state.completed=[...new Set((state.completed||[]).filter(Number.isInteger))];
state.score={...defaults.score,...(state.score||{})};

function save(){state.lastSeen=Date.now();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function detectLegacyProgress(){
 const checks=[
  [5,()=>localStorage.getItem('case003InterviewsComplete')==='true'||(()=>{try{const x=JSON.parse(localStorage.getItem('case003InterviewState')||'{}');return Object.values(x).filter(Boolean).length>=4}catch(_){return false}})()],
  [6,()=>localStorage.getItem('case003BoardComplete')==='true'||localStorage.getItem('case003ResolutionUnlocked')==='true'],
  [7,()=>localStorage.getItem('case003Complete')==='true'||localStorage.getItem('case003ConfessionRecorded')==='true'],
  [8,()=>localStorage.getItem('case003Complete')==='true']
 ];
 checks.forEach(([i,fn])=>{if(fn()) markDone(i,false);});
}
function calculateScore(){
 const done=new Set(state.completed);
 state.score.evidence=Math.min(100,Math.round(([2,3,4].filter(i=>done.has(i)).length/3)*100));
 state.score.analysis=Math.min(100,Math.round(([1,2,3,4].filter(i=>done.has(i)).length/4)*100));
 state.score.interviews=done.has(5)?100:Math.min(90,Number(localStorage.getItem('case003InterviewsProgress')||0));
 state.score.deduction=done.has(7)?100:done.has(6)?85:0;
 const final=Number(localStorage.getItem('case003FinalScore'));
 if(Number.isFinite(final)&&final>0){state.score.deduction=Math.max(state.score.deduction,final);}
}
function markDone(i,notify=true){
 if(i<0||i>=stages.length)return;
 if(!state.completed.includes(i))state.completed.push(i);
 state.highest=Math.max(state.highest,Math.min(stages.length-1,i+1));
 calculateScore();save();
 if(document.readyState!=='loading')render();
 if(notify)toast(`${stages[i].label} completed. ${i<stages.length-1?'Next stage unlocked.':'Case archived.'}`);
}
function completionPercent(){return Math.round((state.completed.filter(i=>i>0).length/(stages.length-1))*100);}
function overallScore(){calculateScore();const s=state.score;return Math.round((s.evidence+s.analysis+s.interviews+s.deduction)/4);}
function elapsed(){const ms=Math.max(0,Date.now()-(state.startedAt||Date.now()));const mins=Math.floor(ms/60000);return mins<60?`${mins} min`:`${Math.floor(mins/60)}h ${mins%60}m`;}
function render(){
 document.querySelector('.case003-command')?.remove();
 const pct=completionPercent();const score=overallScore();
 const wrap=document.createElement('section');wrap.className='case003-command';wrap.setAttribute('aria-label','CASE 003 investigation command bar');
 wrap.innerHTML=`<div class="case003-command-inner">
  <div class="c3-case"><div class="c3-id">ACTIVE DOSSIER · CASE 003</div><div class="c3-title">Silent Dose <span class="c3-live">LIVE</span></div></div>
  <div class="c3-progress"><div class="c3-track-row"><span>Investigation Progress</span><strong>${pct}%</strong></div><div class="c3-track"><span style="width:${pct}%"></span></div></div>
  <div class="c3-objective">CURRENT OBJECTIVE<strong>${stages[currentIndex].objective}</strong></div>
  <div class="c3-metrics"><button data-c3-panel="mission"><span>CASE SCORE</span><strong>${score}%</strong></button><button data-c3-panel="mission"><span>TIME ACTIVE</span><strong>${elapsed()}</strong></button><button data-c3-panel="notebook"><span>NOTES</span><strong>${state.notes.trim()?state.notes.trim().split(/\s+/).length:0}</strong></button></div>
  <div class="c3-stage-nav">${stages.map((s,i)=>{const done=state.completed.includes(i);const current=i===currentIndex;const locked=i>Math.max(1,state.highest);return `<a class="c3-stage ${done?'done':''} ${current?'current':''} ${locked?'locked':''}" data-i="${i}" href="${locked?'#':s.file}" aria-current="${current?'page':'false'}">${done&&!current?'✓ ':''}${s.label}${locked?' · LOCKED':''}</a>`}).join('')}</div>
 </div>`;
 const nav=document.querySelector('nav');if(nav)nav.insertAdjacentElement('afterend',wrap);else document.body.prepend(wrap);
 wrap.querySelectorAll('.locked').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();toast('Complete the previous investigation stage first.');}));
 wrap.querySelectorAll('[data-c3-panel]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.c3Panel)));
}
function toast(msg){let el=document.querySelector('.c3-toast');if(!el){el=document.createElement('div');el.className='c3-toast';el.setAttribute('role','status');document.body.appendChild(el);}el.textContent=msg;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2200);}
function createPanels(){
 const tools=document.createElement('div');tools.className='c3-tools';tools.innerHTML='<button class="c3-tool" data-open="notebook" title="Detective notebook" aria-label="Open detective notebook">✎</button><button class="c3-tool" data-open="mission" title="Mission control" aria-label="Open mission control">◎</button><button class="c3-tool" data-save title="Save progress" aria-label="Save progress">✓</button>';
 const notebook=document.createElement('aside');notebook.className='c3-drawer';notebook.id='c3Notebook';notebook.innerHTML='<div class="c3-drawer-head"><div><div class="c3-id">FIELD NOTES</div><h3>Detective Notebook</h3></div><button data-close aria-label="Close notebook">×</button></div><p>Your notes remain available on every CASE 003 page.</p><textarea id="c3Notes" placeholder="Record observations, contradictions, and questions..."></textarea><div class="c3-drawer-actions"><button class="c3-mini-btn" id="c3SaveNotes">Save Notes</button><button class="c3-mini-btn secondary" id="c3ClearNotes">Clear</button></div>';
 const mission=document.createElement('aside');mission.className='c3-drawer';mission.id='c3Mission';mission.innerHTML=`<div class="c3-drawer-head"><div><div class="c3-id">MISSION CONTROL</div><h3>Investigation Performance</h3></div><button data-close aria-label="Close mission control">×</button></div><div class="c3-score-grid">${Object.entries(state.score).map(([k,v])=>`<div><span>${k.toUpperCase()}</span><strong>${v}%</strong><i><b style="width:${v}%"></b></i></div>`).join('')}</div><div class="c3-mission-meta"><span>Case completion</span><strong>${completionPercent()}%</strong><span>Session time</span><strong>${elapsed()}</strong></div><button class="c3-mini-btn secondary c3-full" id="c3Reset">Restart CASE 003</button>`;
 document.body.append(tools,notebook,mission);
 notebook.querySelector('textarea').value=state.notes||'';
 tools.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openPanel(b.dataset.open));
 tools.querySelector('[data-save]').onclick=()=>{save();toast('CASE 003 progress saved.');};
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closePanels());
 notebook.querySelector('#c3SaveNotes').onclick=()=>{state.notes=notebook.querySelector('textarea').value;save();render();toast('Notebook saved.');};
 notebook.querySelector('#c3ClearNotes').onclick=()=>{notebook.querySelector('textarea').value='';state.notes='';save();render();toast('Notebook cleared.');};
 mission.querySelector('#c3Reset').onclick=resetCase;
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanels();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();toast('CASE 003 progress saved.');}});
}
function openPanel(which){closePanels();document.getElementById(which==='mission'?'c3Mission':'c3Notebook')?.classList.add('open');}
function closePanels(){document.querySelectorAll('.c3-drawer.open').forEach(x=>x.classList.remove('open'));}
function resetCase(){if(!confirm('Restart CASE 003 and erase all saved progress for this case?'))return;Object.keys(localStorage).filter(k=>k.toLowerCase().includes('case003')||k===STORAGE_KEY||k===oldKey).forEach(k=>localStorage.removeItem(k));location.href='case003.html';}
function wireProgress(){
 document.querySelectorAll('a[href]').forEach(el=>{const href=(el.getAttribute('href')||'').split('/').pop().split('?')[0];const target=stages.findIndex(s=>s.file===href);if(target===currentIndex+1){el.addEventListener('click',()=>markDone(currentIndex,false),{capture:true});}});
 if(currentFile==='casecomplete003.html')markDone(8,false);
 window.case003={markCurrentComplete:()=>markDone(currentIndex),markStageComplete:id=>{const i=stages.findIndex(s=>s.id===id);markDone(i);},getState:()=>typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state)),toast,save,openPanel};
}
function protect(){
 if(currentIndex<=1||new URLSearchParams(location.search).has('preview'))return;
 const allowed=Math.max(1,state.highest);
 if(currentIndex>allowed){const target=stages[allowed]||stages[1];const ov=document.createElement('div');ov.className='c3-lock-overlay';ov.innerHTML=`<div class="c3-lock-card"><div class="c3-id">STAGE LOCKED</div><h2>Complete the previous investigation stage</h2><p>This section contains information that should only be available after the earlier investigative work is complete.</p><a href="${target.file}">Return to ${target.label}</a></div>`;document.body.appendChild(ov);}
}
function transitions(){document.querySelectorAll('a[href]').forEach(a=>{const href=a.getAttribute('href');if(!href||href.startsWith('#')||href.startsWith('http')||a.target==='_blank')return;a.addEventListener('click',e=>{if(e.defaultPrevented||a.classList.contains('locked'))return;document.body.classList.add('c3-leaving');});});requestAnimationFrame(()=>document.body.classList.add('c3-ready'));}
function boot(){
 detectLegacyProgress();
 if(currentIndex>0)state.highest=Math.max(state.highest,currentIndex);
 calculateScore();save();render();createPanels();wireProgress();protect();transitions();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
})();
