
/* ---------------- onglet Liste (25/10/2026) : la liste des adresses du PAP et la liste complète des adresses de la circo,
   à valider d'une touche. Elle lit et écrit les mêmes actions que la carte et le porte-à-porte (journal partagé) : valider
   ici colore la carte, valider sur la carte coche la liste. Une adresse peut être faite plusieurs fois dans une campagne :
   chaque validation ajoute un passage. Une adresse prévue dans un PAP à faire est cochée dans ce PAP ; une autre adresse va
   dans l'action de la semaine « Passages de la semaine du … », créée d'office. Pas de date à saisir : un passage est daté par
   sa semaine (arbitrage JL du 25/10/2026). Décocher retire le passage de la semaine noté d'une touche. */
let LV=LS.get('lvue','pap'),LFP='tous',LF='tous',LQ='',LQT='',LN=200,lFit=false;
const LPAS=200;
/* semaine d'un passage : lundi de la semaine */
const lundiDe=s=>{const d=toD(s)||new Date(),x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return isoD(x).slice(0,10);};
const semTxt=s=>'semaine du '+fmtJ(lundiDe(s));
const semLong=s=>'Semaine du '+toD(lundiDe(s)).toLocaleDateString('fr-FR',{day:'numeric',month:'long'});
const cetteSem=s=>!!s&&lundiDe(s)===lundiDe(isoD(new Date()));
const campC=()=>campNom(campDefaut());
const deListe=a=>!!(a&&a.origine&&a.origine.lot==='liste');
const stE=e=>e.st==='ferme'?'ferme':(e.toquees>0||e.st==='faite')?'fait':'afaire';
/* le PAP affiché : celui choisi dans la liste, sinon celui ouvert, sinon le prochain à faire, sinon le dernier fait */
function papListe(){if(!D)return null;const k=D.k;let a=actPar(LS.get('lpap'+k,''));if(a&&a.type==='pap'&&!deListe(a))return a;
 a=actPar(LS.get('ouv'+k,''));if(a&&a.type==='pap'&&a.statut==='a_faire'&&!deListe(a))return a;
 const l=ACTIONS.filter(x=>x.type==='pap'&&!deListe(x)),af=l.filter(x=>x.statut==='a_faire').sort(ordreAct);if(af.length)return af[0];
 return l.sort((x,y)=>String(y.faite_le||y.cree_le).localeCompare(String(x.faite_le||x.cree_le)))[0]||null;}
/* rang du passage (1er, 2e…) dans la campagne */
function rangPassage(id,aid,k){const l=PASS[id]||[],j=l.findIndex(p=>p.aid===aid&&p.k===k);return j<0?0:l.length-j;}
function vueListe(){lFit=true;return {id:'base',get aid(){return LV==='pap'?(papListe()||{}).id||null:null;},
 html:()=>{let h=`<div class="lsw" role="group" aria-label="Liste"><button data-lv="pap" aria-pressed="${LV==='pap'}">Ce PAP</button><button data-lv="tout" aria-pressed="${LV==='tout'}">Toutes les adresses</button></div>`;
  return h+(LV==='pap'?listePapHTML():listeToutHTML());},
 after:()=>{body.querySelectorAll('[data-lv]').forEach(b=>b.onclick=()=>{if(LV===b.dataset.lv)return;LV=b.dataset.lv;LS.set('lvue',LV);lFit=true;render();});
  if(LV==='pap')lierListePap();else lierListeTout();}};}

/* ---- ce PAP */
function listePapHTML(){const a=papListe();
 if(!a)return `<div class="lh1">Aucun PAP</div><div class="empty">Préparez un PAP dans l'onglet Porte-à-porte, ou choisissez « Toutes les adresses ».</div>`;
 const E=a.etapes.map((e,k)=>({e,k,i:idxE(e)})).filter(x=>x.i!=null),ins=x=>D.adresses[x.i][3];
 const n={tous:E.length,afaire:0,fait:0,ferme:0},iF={fait:0,ferme:0},iT=E.reduce((s,x)=>s+ins(x),0);
 E.forEach(x=>{const s=stE(x.e);n[s]++;if(s!=='afaire')iF[s]+=ins(x);});
 const bvs=[...new Set(E.map(x=>D.adresses[x.i][8]))],quand=a.statut==='faite'?'Faite '+semTxt(a.faite_le):a.prevue?'Prévue le '+fmtJ(a.prevue):'Sans date';
 let h=`<button class="lpk" id="lpk" aria-label="Choisir un autre PAP"><h1>${esc(a.nom||'PAP')}</h1>${I.next}</button>`;
 h+=`<div class="sub">${quand} · ${esc(a.ga.map(gaNom).join(', ')||'sans GA')}${bvs.length?` · bureau${bvs.length>1?'x':''} ${esc(bvs.slice(0,3).join(', '))}`:''}</div>`;
 h+=`<div class="lpr"><div class="br"><i style="width:${iT?100*iF.fait/iT:0}%;background:var(--ok)"></i><i style="width:${iT?100*iF.ferme/iT:0}%;background:var(--ko)"></i></div>`+
  `<div class="lg"><span><b>${n.fait} sur ${n.tous} faite${n.fait>1?'s':''}</b>${n.ferme?` · ${n.ferme} pas pu entrer`:''}</span><span>${n0(iF.fait)} sur ${n0(iT)} inscrits</span></div></div>`;
 h+=`<div class="lfl" role="group" aria-label="Filtre">${[['tous','Toutes'],['afaire','À faire'],['fait','Faites'],['ferme','Pas pu entrer']].map(([k,t])=>`<button data-lfp="${k}" aria-pressed="${LFP===k}">${t}<em>${n[k]}</em></button>`).join('')}</div>`;
 const L_=E.filter(x=>LFP==='tous'||stE(x.e)===LFP);
 h+=L_.length?L_.map(x=>lignePap(a,x)).join(''):`<div class="empty">Aucune adresse dans ce filtre.</div>`;
 return h;}
function lignePap(a,x){const e=x.e,s=stE(e),ad=D.adresses[x.i],r=s==='fait'?rangPassage(ad[2],a.id,x.k):0;
 const txt=s==='fait'?`Faite · ${semTxt(e.le||a.faite_le)}${r>1?` · ${r}e passage`:''}${e.toquees?` · ${pl(e.toquees,'toquée')}`:''}`
  :s==='ferme'?`Pas pu entrer${e.acc&&ACCES_T[e.acc]?' · '+ACCES_T[e.acc].toLowerCase():''}`:e.st==='temps'?'Pas eu le temps':'À faire';
 const mk=s==='fait'?(r>1?r:I.check):s==='ferme'?'!':x.k+1;
 return `<div class="la"><span class="lm ${s}">${mk}</span><button class="tx" data-le="${x.k}"><b>${esc(ad[2])}</b><small>${pl(ad[3],'inscrit')} · <span class="s ${s}">${txt}</span></small></button>`+
  `<button class="lc" data-lk="${x.k}" aria-pressed="${s==='fait'}" aria-label="${s==='fait'?'Retirer : pas faite':'Valider : adresse faite'}"><i>${s==='fait'?I.check:''}</i></button></div>`;}
function lierListePap(){const a=papListe();const pk=$('lpk');if(pk)pk.onclick=()=>detail(vueChoixPap());if(!a)return;
 body.querySelectorAll('[data-lfp]').forEach(b=>b.onclick=()=>{LFP=b.dataset.lfp;render(true);});
 body.querySelectorAll('[data-le]').forEach(b=>b.onclick=()=>ouvrirEtape(a.id,+b.dataset.le));
 body.querySelectorAll('[data-lk]').forEach(b=>b.onclick=()=>{const k=+b.dataset.lk,e=a.etapes[k];
  if(stE(e)==='fait'){if(e.toquees>0){ouvrirEtape(a.id,k);return;}setE(a,k,{st:''});}else setE(a,k,{st:'faite'});
  try{navigator.vibrate&&navigator.vibrate(10);}catch(x){}render(true);});
 if(lFit){lFit=false;const ll=a.etapes.map(idxE).filter(i=>i!=null).map(ptA);if(ll.length)setTimeout(()=>map.flyToBounds(L.latLngBounds(ll).pad(.3),{...pad(),maxZoom:17.5,duration:.5}),60);}}
function vueChoixPap(){return {id:'lchoix',html:()=>{const l=ACTIONS.filter(x=>x.type==='pap'&&!deListe(x)),af=l.filter(x=>x.statut==='a_faire').sort(ordreAct),
   fa=l.filter(x=>x.statut==='faite').sort((x,y)=>String(y.faite_le).localeCompare(String(x.faite_le))).slice(0,12),cur=(papListe()||{}).id;
  const row=a=>`<div class="row p"><button class="tx" data-cp="${a.id}"><b>${esc(a.nom||'PAP')}</b><small>${resumeA(a)}</small></button>${a.id===cur?`<span class="chev" style="color:var(--accent)">${I.check}</span>`:sttHTML(a)}</div>`;
  let h=headHTML('Choisir un PAP','',true);
  h+=`<h2>À faire</h2>`+(af.length?af.map(row).join(''):`<div class="empty">Aucun PAP à faire.</div>`);
  if(fa.length)h+=`<h2>Faits récemment</h2>`+fa.map(row).join('');return h;},
 after:()=>{body.querySelectorAll('[data-cp]').forEach(b=>b.onclick=()=>{LS.set('lpap'+D.k,b.dataset.cp);lFit=true;back();});}};}

/* ---- toutes les adresses : par bureau, puis par rue et par numéro */
function ordreListe(){if(D._ol)return D._ol;const A=D.adresses;
 D._ol=A.map((a,i)=>i).sort((x,y)=>String(A[x][8]).localeCompare(String(A[y][8]),'fr',{numeric:true})||ADRP[x].voie.localeCompare(ADRP[y].voie,'fr')||ADRP[x].num-ADRP[y].num||ADRP[x].suf.localeCompare(ADRP[y].suf));
 return D._ol;}
const lOk=i=>{const a=D.adresses[i];if(LF==='prio'&&!isPr(a))return false;if(LF==='fait'||LF==='ferme'){if(statutA(a[2])!==LF)return false;}
 if(LQ&&!normA(a[2]).includes(LQ))return false;return true;};
function compteL(){const c={tous:0,prio:0,fait:0,ferme:0,pf:0,pk:0,bv:{}};
 D.adresses.forEach(a=>{const s=statutA(a[2]),pr=isPr(a);c.tous++;if(s==='fait')c.fait++;if(s==='ferme')c.ferme++;
  if(pr){c.prio++;if(s==='fait')c.pf++;if(s==='ferme')c.pk++;const b=c.bv[a[8]]=c.bv[a[8]]||{p:0,f:0};b.p++;if(s==='fait')b.f++;}});return c;}
function enteteToutHTML(c){return `<div class="lpr"><div class="br"><i style="width:${c.prio?100*c.pf/c.prio:0}%;background:var(--ok)"></i><i style="width:${c.prio?100*c.pk/c.prio:0}%;background:var(--ko)"></i></div>`+
 `<div class="lg"><span><b>${n0(c.pf)} faite${c.pf>1?'s':''}</b>${c.pk?` · ${n0(c.pk)} pas pu entrer`:''}</span><span>sur ${n0(c.prio)} prioritaires</span></div></div>`;}
function filtresToutHTML(c){return [['tous','Toutes',c.tous],['prio','Prioritaires',c.prio],['fait','Faites',c.fait],['ferme','Pas pu entrer',c.ferme]].map(([k,t,v])=>`<button data-lf="${k}" aria-pressed="${LF===k}">${t}<em>${n0(v)}</em></button>`).join('');}
function bvTete(b,c){const x=c.bv[b]||{p:0,f:0};return `<div class="lbv" data-lb="${esc(b)}"><b>Bureau ${esc(b)}</b><span>${x.p?`<b>${n0(x.f)} faite${x.f>1?'s':''}</b> sur ${pl(x.p,'prioritaire')}`:'aucune adresse prioritaire'}</span></div><div class="lbb"><i style="width:${x.p?100*x.f/x.p:0}%"></i></div>`;}
function ligneTout(i){const a=D.adresses[i],id=a[2],s=statutA(id),pr=isPr(a),ps=PASS[id]||[];
 const cl=s==='fait'||s==='ferme'?s:s==='prevu'?'dot prevu':pr?'dot':'dot np',mk=s==='fait'?(ps.length>1?ps.length:I.check):s==='ferme'?'!':'';
 let txt;if(s==='fait')txt=ps.length>1?`${ps.length} passages · ${semTxt(ps[0].q)}`:`Faite · ${semTxt(ps[0].q)}`;
 else if(s==='ferme')txt=`Pas pu entrer · ${semTxt(FER[id].q)}`;
 else if(s==='prevu'){const p=actPar(PREV[id].aid);txt=`Prévue · ${esc(p?p.nom:'PAP à faire')}`;}
 else txt=pr?'À faire':'Non prioritaire';
 return `<div class="la" data-li="${i}"><span class="lm ${cl}">${mk}</span><button class="tx" data-lt="${i}"><b>${esc(id)}</b><small>${pl(a[3],'inscrit')} · <span class="s ${s==='afaire'&&!pr?'':s}">${txt}</span></small></button>`+
  `<button class="lc" data-lc="${i}" aria-pressed="${s==='fait'}" aria-label="${s==='fait'?'Retirer le passage de la semaine':'Valider : adresse faite'}"><i>${s==='fait'?I.check:''}</i></button></div>`;}
function lignesToutHTML(c){const l=ordreListe().filter(lOk);let h='',bv=null,rue=null;
 l.slice(0,LN).forEach(i=>{const a=D.adresses[i];if(a[8]!==bv){bv=a[8];rue=null;h+=bvTete(bv,c);}const v=ADRP[i].voie;if(v!==rue){rue=v;h+=`<div class="lru">${esc(v)}</div>`;}h+=ligneTout(i);});
 if(!l.length)h=`<div class="empty">Aucune adresse ne correspond.</div>`;
 if(l.length>LN)h+=`<button class="lmore" id="lmore">Afficher la suite · ${pl(l.length-LN,'adresse')}</button>`;
 return h;}
function listeToutHTML(){const c=compteL();
 let h=`<div class="lh1">Toutes les adresses</div><div class="sub">${circoNom(D.k)} · ${pl(c.tous,'adresse')} · ${n0(c.prio)} prioritaires</div>`;
 h+=`<div id="lhd">${enteteToutHTML(c)}</div>`;
 h+=`<label class="lq"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input id="lq" type="search" placeholder="Chercher une rue, une adresse" value="${esc(LQT)}" autocomplete="off" aria-label="Chercher une adresse"></label>`;
 h+=`<div class="lfl" id="lfl" role="group" aria-label="Filtre">${filtresToutHTML(c)}</div>`;
 h+=`<div id="lt">${lignesToutHTML(c)}</div>`;return h;}
let lObs=null;
function lierListeTout(){const lt=$('lt');if(!lt)return;
 const refaire=()=>{const c=compteL();lt.innerHTML=lignesToutHTML(c);$('lfl').innerHTML=filtresToutHTML(c);lierFiltres();suite();};
 const lierFiltres=()=>$('lfl').querySelectorAll('[data-lf]').forEach(b=>b.onclick=()=>{LF=b.dataset.lf;LN=LPAS;refaire();});
 const suite=()=>{const m=$('lmore');if(!m)return;m.onclick=()=>{LN+=LPAS;refaire();};
  try{if(lObs)lObs.disconnect();lObs=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){lObs.disconnect();LN+=LPAS;refaire();}},{root:body,rootMargin:'300px'});lObs.observe(m);}catch(e){}};
 lierFiltres();suite();
 const q=$('lq');let qT=0;q.oninput=()=>{LQT=q.value;clearTimeout(qT);qT=setTimeout(()=>{LQ=normA(LQT);LN=LPAS;refaire();},150);};
 lt.onclick=ev=>{const c=ev.target.closest('[data-lc]'),t=ev.target.closest('[data-lt]');
  if(c){const i=+c.dataset.lc;if(statutA(AID(i))==='fait'){if(!retirerPassage(i)){ouvrirAdresse(i);return;}}else ajouterPassage(i);
   try{navigator.vibrate&&navigator.vibrate(10);}catch(x){}majLigneTout(i);return;}
  if(t)ouvrirAdresse(+t.dataset.lt);};}
/* après une validation : la ligne, l'en-tête de son bureau, les compteurs ; le reste de la liste ne bouge pas */
function majLigneTout(i){const c=compteL(),r=body.querySelector(`[data-li="${i}"]`);if(r)r.outerHTML=ligneTout(i);
 const b=D.adresses[i][8],t=body.querySelector(`[data-lb="${CSS.escape(b)}"]`);if(t){const n=t.nextElementSibling;const tmp=document.createElement('div');tmp.innerHTML=bvTete(b,c);t.replaceWith(tmp.children[0]);if(n&&n.classList.contains('lbb'))n.replaceWith(tmp.children[0]);}
 const hd=$('lhd');if(hd)hd.innerHTML=enteteToutHTML(c);const fl=$('lfl');if(fl){fl.innerHTML=filtresToutHTML(c);fl.querySelectorAll('[data-lf]').forEach(x=>x.onclick=()=>{LF=x.dataset.lf;LN=LPAS;render(true);});}}

/* ---- passages : ajouter (une touche), retirer celui de la semaine */
function ajouterPassage(i){const id=AID(i),now=isoD(new Date()),pv=PREV[id];
 if(pv){const a=actPar(pv.aid);if(a&&a.etapes[pv.k]&&a.etapes[pv.k].lieu.id===id){setE(a,pv.k,{st:'faite'});return;}}
 let a=ACTIONS.find(x=>deListe(x)&&x.type==='pap'&&x.cree_par===moi().id&&cetteSem(x.faite_le)&&x.campagne===campDefaut());
 if(!a){a=nouvelleAction('pap',{nom:'Passages de la '+semTxt(now),statut:'faite',faite_le:now,origine:{lot:'liste'}});ACTIONS.push(a);saisie(a,'création depuis la liste');}
 const k=a.etapes.findIndex(e=>e.lieu.id===id);
 if(k>=0)Object.assign(a.etapes[k],{st:'faite',le:now});else a.etapes.push(Object.assign(etapeAdr(i),{st:'faite',le:now}));
 saisie(a,'adresse '+id);sauverA();dessinerParcours();}
function retirerPassage(i){const id=AID(i),p=(PASS[id]||[])[0];if(!p)return false;const a=actPar(p.aid),e=a&&a.etapes[p.k];
 if(!a||!e||e.toquees>0||!cetteSem(p.q))return false;
 if(deListe(a)){a.etapes.splice(p.k,1);saisie(a,'adresse retirée : '+id);if(!a.etapes.length)ACTIONS.splice(ACTIONS.indexOf(a),1);sauverA();}
 else setE(a,p.k,{st:''});
 dessinerParcours();return true;}
/* fiche d'une adresse : statut dans la campagne, passages, bouton pour en ajouter un */
function passagesHTML(id){const s=statutA(id),ps=PASS[id]||[],f=FER[id],pv=PREV[id];let h='';
 if(s==='fait')h+=`<div class="pst fait"><i></i>Faite · ${pl(ps.length,'passage')} pendant la campagne ${esc(campC())}</div>`;
 else if(s==='ferme')h+=`<div class="pst ferme"><i></i>Pas pu entrer · ${semTxt(f.q)}${f.r&&ACCES_T[f.r]?' · '+ACCES_T[f.r].toLowerCase():''}</div>`;
 else if(s==='prevu'){const a=actPar(pv.aid);h+=`<div class="pst prevu"><i></i>Prévue : ${esc(a?a.nom:'PAP à faire')}${a&&a.prevue?' · le '+fmtJ(a.prevue):''}</div>`;}
 if(ps.length)h+=`<h2>Passages</h2>`+ps.slice(0,6).map(p=>{const a=actPar(p.aid),g=(p.ga||[]).map(gaNom).join(', ');
  return `<div class="pss"><i></i><div><b>${esc(semLong(p.q))}</b><span>${esc(g||(a?a.nom:''))}${p.t?` · ${pl(p.t,'toquée')} · ${pl(p.o,'ouverte')}`:''}</span></div></div>`;}).join('')+(ps.length>6?`<div class="hs">et ${pl(ps.length-6,'passage')} plus ancien${ps.length-6>1?'s':''}</div>`:'');
 return h;}
/* bouton de la fiche : valider l'adresse, ou ajouter un passage (un par semaine) */
function boutonPassageHTML(id){const ps=PASS[id]||[],sem=ps.length&&cetteSem(ps[0].q);
 return `<div class="btns" style="margin-top:8px"><button class="btn line" id="adp" ${sem?'disabled':''}>${I.check} ${sem?'Faite cette semaine':ps.length?'Ajouter un passage':'Valider : adresse faite'}</button></div>`;}
