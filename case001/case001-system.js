
(function(){
const KEY='dossier_case001_v3';
const stages=[
 {id:'briefing',file:'case001.html',label:'Briefing'},
 {id:'email',file:'evidence001.html',label:'Email'},
 {id:'website',file:'evidence002.html',label:'Website'},
 {id:'footprint',file:'evidence003.html',label:'Footprint'},
 {id:'board',file:'investigation001.html',label:'Board'},
 {id:'complete',file:'casecomplete001.html',label:'Closed'}
];
const defaults={unlocked:['briefing'],completed:[],notes:[],score:0,startedAt:Date.now()};
function get(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return {...defaults}}}
function set(s){localStorage.setItem(KEY,JSON.stringify(s))}
function currentId(){return document.body.dataset.caseStage||'briefing'}
function idx(id){return stages.findIndex(x=>x.id===id)}
function toast(t){let el=document.querySelector('.c1-toast');if(!el){el=document.createElement('div');el.className='c1-toast';document.body.appendChild(el)}el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function addNote(text){
 const s=get(); if(!s.notes.includes(text))s.notes.push(text); set(s); renderNotebook(); toast('Notebook updated');
}
function complete(id,next,points,note){
 const s=get();
 if(!s.completed.includes(id))s.completed.push(id);
 if(next&&!s.unlocked.includes(next))s.unlocked.push(next);
 s.score=Math.max(s.score||0,Math.min(100,(s.score||0)+(points||0)));
 if(note&&!s.notes.includes(note))s.notes.push(note);
 set(s); render();
}
function isUnlocked(id){const s=get();return s.unlocked.includes(id)||id==='briefing'}
function requireAccess(){
 const id=currentId(); if(isUnlocked(id))return true;
 const lock=document.querySelector('.c1-lock'); if(lock)lock.classList.add('show'); return false;
}
function render(){
 const s=get(),id=currentId(),i=idx(id);
 const pct=Math.round((s.completed.length/(stages.length-1))*100);
 const fill=document.querySelector('.c1-meter-fill');if(fill)fill.style.width=Math.min(100,pct)+'%';
 const p=document.querySelector('[data-c1-progress]');if(p)p.textContent=Math.min(100,pct)+'%';
 const obj=document.querySelector('[data-c1-objective]');if(obj)obj.textContent=(document.body.dataset.objective||stages[i]?.label||'Investigation');
 const sc=document.querySelector('[data-c1-score]');if(sc)sc.textContent=s.score||0;
 const nav=document.querySelector('.c1-stage-nav');
 if(nav)nav.innerHTML=stages.map((x,n)=>{
   const cls=(s.completed.includes(x.id)?' done':'')+(x.id===id?' current':'');
   return `<span class="c1-stage-pill${cls}">${n+1}. ${x.label}</span>`
 }).join('');
 renderNotebook();
}
function renderNotebook(){
 const el=document.querySelector('[data-c1-notes]');if(!el)return;
 const n=get().notes;
 el.innerHTML=n.length?n.map(x=>`<div class="c1-note">✓ ${x}</div>`).join(''):'<p style="color:var(--c1-muted)">Validated findings will appear here.</p>';
}
function toggleNotebook(){document.querySelector('.c1-notebook')?.classList.toggle('show')}
function restart(){if(!confirm('Restart CASE 001 and erase its saved progress?'))return;localStorage.removeItem(KEY);location.href='case001.html'}
function go(next,file){
 if(!isUnlocked(next)){toast('Complete the current investigation stage first.');return}
 location.href=file;
}
window.Case001={get,set,addNote,complete,isUnlocked,requireAccess,render,toggleNotebook,restart,go,toast};
document.addEventListener('DOMContentLoaded',()=>{requireAccess();render()});
})();
