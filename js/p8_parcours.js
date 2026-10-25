/* ---------------- parcours de tractage (v15, 25/10/2026). JL : « des parcours de déambulation (dans la rue) et des parcours
   de bar le soir (barathon) » ; arbitrage : l'appli propose, l'équipe modifie. Données : d/parcours_KK.json (src/prep_parcours.py,
   Apur 2023). Déambulation : le tronçon le plus commerçant d'une voie (1 km au plus). Barathon : 6 bars, cafés ou brasseries
   proches ; on retire ou on ajoute un arrêt (gardé sur ce téléphone, et dans le journal quand une équipe y va). */
let parcL=null;
function chargerParcours(n){fetch(`d/parcours_${pad2(n)}.json`).then(r=>r.ok?r.json():null).then(p=>{if(!D||D.k!==n||!p)return;D.parc=p;
 const v=stack[stack.length-1];if(v&&v.id==='base'&&mode==='tractage')render(true);}).catch(()=>{});}
function effParc(){if(parcL&&typeof map!=='undefined')map.removeLayer(parcL);parcL=null;}
const parcDe=nom=>{const P=D&&D.parc;if(!P)return null;return P.deamb.find(x=>x.nom===nom)||P.bar.find(x=>x.nom===nom)||null;};
const estBar=p=>!!p.arrets;
/* arrêts d'un barathon : ceux de l'équipe qui y va (journal), sinon ceux modifiés sur ce téléphone, sinon la proposition */
function arretsDe(p){const B=D.parc.bars,res=l=>l.map(([n,a])=>B.find(b=>b.nom===n&&b.adr===a)).filter(Boolean);
 const e=eqDe(p.nom);if(e&&e.arrets&&e.arrets.length)return res(e.arrets);const m=(LS.get('parc'+D.k,{})||{})[p.nom];if(m&&m.length)return res(m);return p.arrets.map(i=>B[i]);}
function poserArrets(p,l){const v=l.map(b=>[b.nom,b.adr]),m=LS.get('parc'+D.k,{})||{};m[p.nom]=v;LS.set('parc'+D.k,m);
 const e=eqDe(p.nom);if(e){e.arrets=v;saisie(e,'arrêts du barathon');sauverA();}}
const modifie=p=>{const m=(LS.get('parc'+D.k,{})||{})[p.nom],e=eqDe(p.nom);return !!((e&&e.arrets)||(m&&m.length));};
const longArrets=l=>{let s=0;for(let k=1;k<l.length;k++)s+=dist(l[k-1].ll,l[k].ll);return s;};
const kmTxt=m=>m<1000?m10(m)+' m':(m/1000).toFixed(1).replace('.',',')+' km';
function rowParc(p){const b=estBar(p),l=b?arretsDe(p):null,eq=eqDe(p.nom);
 return `<div class="row p"><button class="tx" data-pc="${esc(p.nom)}"><b>${esc(p.nom)}</b><small>${b?`${pl(l.length,'bar')} et cafés sur ${kmTxt(longArrets(l))} · le soir`:`${pl(p.n,'commerce')} sur ${kmTxt(p.long)}`}</small><span class="prs" style="${prioStyle(p.prio)}">Priorité ${p.prio}/100</span></button>${eq?`<span class="eqp">${esc(eqTxt(eq))}</span>`:''}</div>`;}
function parcHTML(){const P=D&&D.parc;if(!P||(!P.deamb.length&&!P.bar.length))return '';const tous=P.deamb.concat(P.bar),n=tous.length;
 if(TRI==='prio')tous.sort((x,y)=>y.prio-x.prio);
 const l=EXP.pc?tous:TRI==='prio'?tous.slice(0,2):[P.deamb[0],P.bar[0]].filter(Boolean);
 return `<div class="tsec"><h2>Parcours</h2>${n>l.length||EXP.pc?`<button class="more" data-ex="pc">${EXP.pc?'Moins':`Voir les ${n}`}</button>`:''}</div>`+l.map(rowParc).join('');}
function lierParc(){body.querySelectorAll('[data-pc]').forEach(b=>b.onclick=()=>ouvrirParcours(b.dataset.pc));}
function tracer(pts,num){effParc();if(!pts.length)return;parcL=L.layerGroup().addTo(map);const ac=tok('--accent');
 L.polyline(pts,{renderer:rP,color:ac,weight:4,opacity:.85,dashArray:'2 7',lineCap:'round',interactive:false}).addTo(parcL);
 (num||[]).forEach((p,k)=>L.marker(p,{pane:'pap',interactive:false,icon:L.divIcon({className:'',html:`<div class="pin lot">${k+1}</div>`,iconSize:[26,26],iconAnchor:[13,13]})}).addTo(parcL));
 map.flyToBounds(L.latLngBounds(pts).pad(.3),{...pad(),maxZoom:17.5,duration:.5});}
function ouvrirParcours(nom){const p=parcDe(nom);if(!p)return;sel(null);if(det==='peek')setDet('half');const b=estBar(p);let aj=false;
 if(b){const e=eqDe(p.nom),m=(LS.get('parc'+D.k,{})||{})[p.nom];if(e&&!e.arrets&&m&&m.length){e.arrets=m;sauverA();}}
 detail({id:'parc',html:()=>{const l=b?arretsDe(p):null;
  let h=headHTML(esc(p.nom),b?`${pl(l.length,'bar')} et cafés · ${kmTxt(longArrets(l))} à pied`:`${kmTxt(p.long)} · ${pl(p.n,'commerce')}`,true);
  h+=`<span class="prs" style="${prioStyle(p.prio)}">Priorité ${p.prio}/100</span>`;
  h+=`<div class="note">${b?'Le soir, de bar en bar : on discute, on tracte en terrasse. Affluence des bars inconnue pour l\'instant (relevé à faire).':'On remonte la rue avec les tracts : passants, terrasses, commerçants. Aucune mesure du nombre de passants : le moment se choisit sur place.'}</div>`;
  if(b){h+=`<h2>Arrêts</h2>`+l.map((s,k)=>`<div class="lr">${avH('br',k+1)}<div class="tx"><b>${esc(s.nom)}</b><small>${esc(s.adr)}</small></div>${l.length>2?`<button class="xb" data-bx="${k}" aria-label="Retirer ${esc(s.nom)}">${I.x}</button>`:'<span></span>'}</div>`).join('');
   if(aj){const pris=new Set(l.map(s=>s.nom+'|'+s.adr)),dern=l[l.length-1].ll;
    const c=D.parc.bars.filter(s=>!pris.has(s.nom+'|'+s.adr)&&l.some(x=>dist(x.ll,s.ll)<=250)).map(s=>[dist(dern,s.ll),s]).sort((x,y)=>x[0]-y[0]).slice(0,8);
    h+=`<h2>Bars proches</h2>`+(c.length?c.map(([d,s],k)=>`<div class="lr">${avH('af',I.plus)}<div class="tx"><b>${esc(s.nom)}</b><small>${esc(s.adr)} · ${kmTxt(d)} du dernier arrêt</small></div><button class="pill p" data-ba="${k}">Ajouter</button></div>`).join(''):`<div class="empty">Aucun autre bar à moins de 250 m du parcours.</div>`);
    h+=`<button class="lnk2 c" id="bFin">Fini</button>`;}
   else h+=`<button class="lnk2 c" id="bAj">+ Ajouter un bar</button>`;
   if(modifie(p))h+=`<button class="lnk2 c" id="bRz">Revenir à la proposition de l'appli</button>`;}
  else h+=`<h2>Parcours</h2><div class="lr">${avH('br',1)}<div class="tx"><b>Départ</b><small>vers le ${esc(p.dep)}</small></div><span></span></div><div class="lr">${avH('br',2)}<div class="tx"><b>Arrivée</b><small>vers le ${esc(p.arr)}</small></div><span></span></div>`;
  h+=`<div style="margin-top:14px">${equipeHTML(p.nom,[1,2,3,4,5,6,0])}</div>`;
  h+=`<div class="src" style="margin-top:14px">${esc(D.parc.src)}</div>`;return h;},
 after:()=>{lierEquipe(p.nom,'parcours');const l=b?arretsDe(p):null;
  /* une équipe y va : elle emporte les arrêts modifiés sur ce téléphone (journal partagé) */
  const tg=$('eqT');if(b&&tg){const f=tg.onclick;tg.onclick=()=>{const m=(LS.get('parc'+D.k,{})||{})[p.nom];f();const e=eqDe(p.nom);if(e&&!e.arrets&&m&&m.length){e.arrets=m;saisie(e,'arrêts du barathon');sauverA();}};}
  if(b){tracer(l.map(s=>s.ll),l.map(s=>s.ll));
   body.querySelectorAll('[data-bx]').forEach(x=>x.onclick=()=>{const k=+x.dataset.bx,av=l.slice(),n=l.slice();const s=n.splice(k,1)[0];poserArrets(p,n);render(true);toast(s.nom+' retiré du parcours',{t:'Annuler',fn:()=>{poserArrets(p,av);render(true);}});});
   const a=$('bAj');if(a)a.onclick=()=>{aj=true;render(true);};const f=$('bFin');if(f)f.onclick=()=>{aj=false;render(true);};
   if(aj){const pris=new Set(l.map(s=>s.nom+'|'+s.adr)),dern=l[l.length-1].ll;
    const c=D.parc.bars.filter(s=>!pris.has(s.nom+'|'+s.adr)&&l.some(x=>dist(x.ll,s.ll)<=250)).map(s=>[dist(dern,s.ll),s]).sort((x,y)=>x[0]-y[0]).slice(0,8);
    body.querySelectorAll('[data-ba]').forEach(x=>x.onclick=()=>{const s=c[+x.dataset.ba][1];poserArrets(p,l.concat([s]));render(true);toast(s.nom+' ajouté au parcours');});}
   const r=$('bRz');if(r)r.onclick=()=>{const m=LS.get('parc'+D.k,{})||{},av=m[p.nom];delete m[p.nom];LS.set('parc'+D.k,m);const e=eqDe(p.nom),ae=e&&e.arrets;if(e){delete e.arrets;saisie(e,'arrêts : proposition de l\'appli');sauverA();}render(true);
    toast('Proposition de l\'appli remise',{t:'Annuler',fn:()=>{if(av){m[p.nom]=av;LS.set('parc'+D.k,m);}if(e&&ae){e.arrets=ae;sauverA();}render(true);}});};}
  else tracer(p.trace,[p.trace[0],p.trace[p.trace.length-1]]);}});}
