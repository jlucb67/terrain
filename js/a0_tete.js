(()=>{
'use strict';
const $=id=>document.getElementById(id);
const tok=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NF=new Intl.NumberFormat('fr-FR');const n0=x=>NF.format(Math.round(x));
const pc=(x,d=1)=>(+x).toFixed(d).replace('.',',')+' %';
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const ZD={1:'au plus fort électorat LFI, le plus fidèle',2:'électorat LFI à convaincre et activer',3:'électorat de classe moyenne, plus difficile à convaincre'};
const cap=s=>s.replace(/^./,c=>c.toUpperCase());
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const LIGNE={'1':['#FFCD00','#212320'],'2':['#003CA6','#fff'],'3':['#837902','#fff'],'3bis':['#6EC4E8','#212320'],'4':['#CF009E','#fff'],'5':['#FF7E2E','#212320'],'6':['#6ECA97','#212320'],'7':['#FA9ABA','#212320'],'7bis':['#6ECA97','#212320'],'8':['#E19BDF','#212320'],'9':['#B6BD00','#212320'],'10':['#C9910D','#212320'],'11':['#704B1C','#fff'],'12':['#007852','#fff'],'13':['#6EC4E8','#212320'],'14':['#62259D','#fff']};
const JOURS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const sv=(d,w)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||1.8}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I={
 back:sv('<path d="M15 5l-7 7 7 7"/>'),plus:sv('<path d="M12 6v12M6 12h12"/>',2),check:sv('<path d="M6 12.5l4 4L18 8"/>',2),x:sv('<path d="M7 7l10 10M17 7L7 17"/>'),
 walk:sv('<circle cx="13" cy="4.5" r="1.6"/><path d="M10.5 20.5l1.8-5.5-2.8-2.8.9-4.6 3.6 2.8 2.8.9M9.4 12l-1.9 2.8"/>'),
 route:sv('<circle cx="6" cy="18.5" r="1.8"/><circle cx="18" cy="5.5" r="1.8"/><path d="M8 18.5h7a3.3 3.3 0 000-6.6H9a3.3 3.3 0 010-6.6h7"/>'),
 spark:sv('<path d="M12 3.5l1.9 5.2 5.6.3-4.4 3.5 1.5 5.4L12 14.8l-4.6 3.1 1.5-5.4-4.4-3.5 5.6-.3z"/>'),
 me:sv('<path d="M20 4L4 11l7 2 2 7z"/>'),target:sv('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/>'),
 home:sv('<path d="M5 11l7-6 7 6v8H5z"/><path d="M10 19v-4.5h4V19"/>'),
 cart:sv('<path d="M3.5 5h2l2 9.5h9.5L19 8.5H7"/><circle cx="9" cy="18.5" r="1.2"/><circle cx="16.5" cy="18.5" r="1.2"/>',2.2),
 basket:sv('<path d="M4.5 10h15l-1.8 8.5H6.3z"/><path d="M8.5 10l3.5-5 3.5 5"/>',2.2),
 grid:sv('<path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z"/>'),
 tract:sv('<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5v4h4M10 12h5M10 15.5h5"/>'),
 pied:sv('<path d="M4.5 20.5V8l5-3v15.5M9.5 20.5V10.5h6v10M15.5 20.5V13h4v7.5M3 20.5h18"/>',2.2),
 list:sv('<path d="M9 6.5h10M9 12h10M9 17.5h10"/><path d="M5 6.5h.01M5 12h.01M5 17.5h.01"/>',2),
 up:sv('<path d="M7 14l5-5 5 5"/>'),down:sv('<path d="M7 10l5 5 5-5"/>'),next:sv('<path d="M10 7l5 5-5 5"/>'),
 carte:sv('<path d="M9 4.5l-5 2v13l5-2 6 2 5-2v-13l-5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',1.6),couches:sv('<path d="M12 4l8 4.5-8 4.5-8-4.5z"/><path d="M4 13l8 4.5 8-4.5"/>',1.6),
 admin:sv('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',1.6),sortie:sv('<path d="M14 5h4a1 1 0 011 1v12a1 1 0 01-1 1h-4"/><path d="M10 16l-4-4 4-4M6 12h9"/>',1.6)
};

/* ---------------- carte */
const map=L.map('map',{zoomControl:false,attributionControl:false,zoomSnap:.25,zoomDelta:.5,wheelPxPerZoomLevel:90,minZoom:10.5,maxZoom:19,tapTolerance:18});
[['fond',200],['bati',210],['adr',400],['contour',410],['papl',415],['noms',430],['lieux',620],['pap',650]].forEach(([n,z])=>{map.createPane(n).style.zIndex=z;});
['noms','fond','bati','contour','papl'].forEach(n=>map.getPane(n).style.pointerEvents='none');
const rC=L.canvas({pane:'contour',padding:.25}),rA=L.canvas({pane:'adr',padding:.25,tolerance:7}),rP=L.canvas({pane:'papl',padding:.25});

/* ---------------- tiroir a crans, au-dessus de la barre des missions */
const sheet=$('sheet'),body=$('body'),app=$('app');
let det='half',wide=matchMedia('(min-width:900px)').matches;
const PEEK=170;
const TB=()=>$('tabbar').hidden||wide?0:$('tabbar').offsetHeight;
function hOf(d){const H=app.clientHeight-TB();return d==='peek'?PEEK:d==='fit'?(choix?Math.min(Math.round(H*.5),300):150):d==='half'?Math.round(H*.5):H-76;}
function setDet(d){det=d;if(wide){app.style.setProperty('--sh','0px');return;}const h=hOf(d);app.style.setProperty('--sh',h+'px');sheet.style.height=h+'px';}
matchMedia('(min-width:900px)').addEventListener('change',e=>{wide=e.matches;sheet.style.height='';setDet(det);});
addEventListener('resize',()=>setDet(det));
(()=>{let y0=0,h0=0,t0=0,on=false;
 const start=e=>{if(wide)return;on=true;y0=e.clientY;h0=sheet.getBoundingClientRect().height;t0=performance.now();sheet.classList.add('drag');try{e.target.setPointerCapture(e.pointerId);}catch(_){}};
 const move=e=>{if(!on)return;const h=Math.max(90,Math.min(hOf('full'),h0-(e.clientY-y0)));sheet.style.height=h+'px';app.style.setProperty('--sh',h+'px');};
 const end=e=>{if(!on)return;on=false;sheet.classList.remove('drag');const h=sheet.getBoundingClientRect().height,v=(e.clientY-y0)/Math.max(1,performance.now()-t0);
  const ds=det==='fit'?['peek','fit','full']:['peek','half','full'];let best=ds.reduce((a,d)=>Math.abs(hOf(d)-h)<Math.abs(hOf(a)-h)?d:a,'peek');
  if(Math.abs(v)>.6){const i=ds.indexOf(det);best=ds[Math.max(0,Math.min(2,i+(v<0?1:-1)))];}
  if(Math.abs(e.clientY-y0)<6){best=det==='full'?ds[1]:det==='peek'?ds[1]:'full';}
  setDet(best);};
 const g=$('grab');g.addEventListener('pointerdown',start);g.addEventListener('pointermove',move);g.addEventListener('pointerup',end);g.addEventListener('pointercancel',end);
 body.addEventListener('pointerdown',e=>{if(e.target.closest('.head')&&!e.target.closest('button'))start(e);});
 body.addEventListener('pointermove',move);body.addEventListener('pointerup',end);body.addEventListener('pointercancel',end);
})();
function toast(m,act){const t=$('toast');t.innerHTML='';const sp=document.createElement('span');sp.textContent=m;t.appendChild(sp);
 if(act){const b=document.createElement('button');b.textContent=act.t;b.onclick=()=>{t.hidden=true;act.fn();};t.appendChild(b);}
 t.hidden=false;clearTimeout(toast.k);toast.k=setTimeout(()=>t.hidden=true,act?6000:2800);}
const pad=(top)=>({paddingTopLeft:wide?[420,24]:[12,(top||100)],paddingBottomRight:wide?[24,24]:[12,(det==='peek'?PEEK:hOf(det==='fit'?'fit':'half'))+TB()+8]});

