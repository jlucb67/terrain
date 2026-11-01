/* ---------------- v16 (31/10/2026, arbitrages JL) : une appli plus simple, avec un pourcentage d'avancement.
   « On priorise le fait de proposer des choix, puis d'avoir une vue d'ensemble et de faire un suivi. » Plus de curseurs ni de
   filtres ; l'appli propose tout de suite 3 PAP ; la taille se règle en inscrits, ou selon le nombre de personnes et le temps ;
   « On y va » met l'action en cours, « C'est fait » la valide ; les pieds d'immeuble ont leur onglet ; le Suivi remplace la
   Liste. Estimation retenue par JL : 20 portes par heure et par personne ; une porte = un ménage, soit environ 1,25 inscrit
   (inscrits des adresses de l'appli rapportés aux 1 127 329 ménages de Paris, Insee 2022). */
const PORTES_H=20,INS_PORTE=1.25;
const portesDe=ins=>Math.round(ins/INS_PORTE);
const pc1=x=>(Math.round(x*10)/10).toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1});
function prioMoyIds(ids){const A=D.adresses,s=ids.reduce((t,i)=>t+A[i][3],0);return s?Math.round(ids.reduce((t,i)=>t+A[i][3]*A[i][5],0)/s):0;}
const ruesDe=ids=>{const r={};ids.forEach(i=>{const v=ADRP[i].voie;r[v]=(r[v]||0)+1;});return Object.keys(r).sort((x,y)=>r[y]-r[x]);};
const depuis=s=>{const d=toD(s);if(!d)return '';return cetteSem(s)&&isoD(d).slice(0,10)===isoD(new Date()).slice(0,10)?'depuis '+fmtH(d):'depuis le '+fmtJ(s);};

/* ---- avancement : part des inscrits des adresses prioritaires (priorité 70 et plus, 6 inscrits et plus) déjà faits
   pendant la campagne en cours (arbitrage JL du 31/10/2026) */
function avance(){let tot=0,fi=0,sem=0,nf=0;D.adresses.forEach(a=>{if(!isPr(a))return;tot+=a[3];if(statutA(a[2])!=='fait')return;fi+=a[3];nf++;const p=PASS[a[2]];if(p&&cetteSem(p[0].q))sem+=a[3];});
 return {tot,fi,nf,pct:tot?100*fi/tot:0,sem:tot?100*sem/tot:0};}
function bandeHTML(x,titre,extra,grand,larg){const w=larg!=null?larg:x.pct;
 return `<div class="prog"><div class="t"><b>${titre||D.k+'e circonscription'}</b><strong>${grand||pc1(x.pct)+' %'}</strong></div><div class="jb"><i style="width:${Math.max(w>0?1.5:0,Math.min(100,w))}%"></i></div>`+
  `<small>${extra||`<b>${n0(x.fi)}</b> inscrits faits sur ${n0(x.tot)} dans les adresses prioritaires · ${x.sem>0?`<b>+${pc1(x.sem)} %</b> cette semaine`:'rien encore cette semaine'}`}</small></div>`;}
function parBureau(){const B={};D.adresses.forEach(a=>{if(!isPr(a))return;const o=B[a[8]]=B[a[8]]||{b:a[8],tot:0,fi:0};o.tot+=a[3];if(statutA(a[2])==='fait')o.fi+=a[3];});
 return Object.values(B).map(o=>Object.assign(o,{p:o.tot?100*o.fi/o.tot:0}));}
const papsFaits=()=>ACTIONS.filter(a=>a.type==='pap'&&a.statut==='faite'&&a.campagne===campDefaut()&&!deListe(a));
function chiffresHTML(x){const B=parBureau();
 return kpis([[n0(papsFaits().length),'PAP faits depuis le début'],[n0(x.nf),'adresses prioritaires faites'],[`${B.filter(o=>o.fi>0).length}/${B.length}`,'bureaux de vote commencés']]);}

/* ---- en cours : « On y va » ; « C'est fait » valide. Un pied d'immeuble lancé = une action « pied d'immeuble » et une
   action PAP par équipe, reliées par « groupe » */
function lancer(a){const now=isoD(new Date());a.encours=now;a.prevue=now.slice(0,10);}
/* en cours : lancés par « On y va » ; on y range aussi les PAP prévus avant la v16 (statut « à faire », sans « en cours ») */
const enCours=()=>ACTIONS.filter(a=>a.statut==='a_faire'&&((a.type==='diff_pied'&&a.encours)||(a.type==='pap'&&!a.groupe&&!deListe(a))));
const duGroupe=g=>ACTIONS.filter(a=>a.groupe===g);
function finirPAP(a,ferm){const now=isoD(new Date());
 a.etapes.forEach((e,k)=>{if(idxE(e)==null)return;if(ferm&&ferm.has(k)){e.st='ferme';e.le=now;}else if(stE(e)==='afaire'){e.st='faite';e.le=now;}});
 a.statut='faite';a.faite_le=now;a.prevue='';delete a.encours;}
function finirPied(st){const now=isoD(new Date()),l=st.groupe?duGroupe(st.groupe):[st];
 l.forEach(a=>{if(a.statut!=='a_faire')return;if(a.type==='pap')finirPAP(a);else{a.statut='faite';a.faite_le=now;a.prevue='';delete a.encours;(a.etapes||[]).forEach(e=>{e.st='faite';e.le=now;});}
  saisie(a,'C\'est fait');});}
function oterAction(l,quoi){const pos=l.map(a=>[ACTIONS.indexOf(a),a]).filter(x=>x[0]>=0).sort((x,y)=>y[0]-x[0]);pos.forEach(([k])=>ACTIONS.splice(k,1));sauverA();dessinerParcours();
 toast(quoi,{t:'Annuler',fn:()=>{pos.slice().reverse().forEach(([k,a])=>ACTIONS.splice(k,0,a));sauverA();dessinerParcours();render(true);}});}
const sansToast=()=>{const t=$('toast');if(t)t.hidden=true;clearTimeout(toast.k);};
const pourQui=a=>(a.ga||[]).map(gaNom).join(', ')||'sans GA';
function carteEC(a){const p=a.type==='diff_pied',s=p&&a.etapes[0]?a.etapes[0].lieu.id:'',n=p?duGroupe(a.groupe||'').filter(x=>x.type==='pap').length:0;
 const t=p?`Pied d'immeuble ${esc(s)}`:esc((a.nom||'PAP').replace(/^PAP /,''));
 const q=a.encours?depuis(a.encours):a.prevue?'le '+fmtJ(a.prevue):'sans date';
 const sub=p?`${n?pl(n,'équipe')+' de PAP · ':''}${q} · ${esc(pourQui(a))}`:`${pl(a.etapes.length,'adresse')} · ${q} · ${esc(pourQui(a))}`;
 return `<button class="ecc" data-ec="${a.id}"><span class="dot"></span><span><b>${a.encours?'En cours':'Prévu'} : ${t}</b><small>${sub}</small></span><span class="ecb">C'est fait</span></button>`;}
function ouvrirEC(id){const a=actPar(id);if(!a)return;if(a.type==='diff_pied'){const s=(D.pieds||[]).find(x=>a.etapes[0]&&x.nom===a.etapes[0].lieu.id);if(s){ouvrirPied(s);return;}}detail(vueEnCours(id));}
const lierEC=()=>body.querySelectorAll('[data-ec]').forEach(b=>b.onclick=()=>ouvrirEC(b.dataset.ec));

/* ---- accueil du porte-à-porte : en cours, avancement, taille, 3 PAP proposés */
let TMODE=LS.get('tmode','ins'),EQN=LS.get('eqN',2),EQH=LS.get('eqH',2),VIS=false;
const DUREES=[[1,'1 h'],[1.5,'1 h 30'],[2,'2 h'],[3,'3 h'],[4,'4 h'],[5,'5 h']],GENS=[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5 et +']];
const tailleEq=()=>Math.round(EQN*EQH*PORTES_H*INS_PORTE);
const segH=(attr,l,v)=>`<div class="seg" role="group">${l.map(([x,t])=>`<button ${attr}="${x}" aria-pressed="${x===v}">${t}</button>`).join('')}</div>`;
function vueAccueil(){return {id:'base',html:()=>{const x=avance();if(TMODE==='eq')taille=tailleEq();const C=conseilles().slice(0,3),EC=enCours().filter(a=>a.encours);   /* les PAP prévus d'avant la v16 : dans le Suivi */
  const mien=EC.filter(a=>a.cree_par===moi().id),autres=EC.filter(a=>a.cree_par!==moi().id);
  let h=`<div class="csh"><h1>Porte-à-porte</h1></div>`+mien.concat(autres).slice(0,3).map(carteEC).join('');
  if(EC.length>3)h+=`<div class="sub" style="margin:-4px 0 10px">et ${pl(EC.length-3,'autre action')} en cours : voir le Suivi</div>`;
  h+=`<div class="btns"><button class="btn line" id="autre">${I.target} Choisir un endroit sur la carte</button></div>`;
  h+=`<div class="tsw"><span>Choisir la taille par</span>${segH('data-tm',[['ins','Nombre d\'inscrits'],['eq','Personnes et temps']],TMODE)}</div>`;
  if(TMODE==='eq'){h+=`<div class="qq"><span>Vous êtes combien ?</span>${segH('data-en',GENS,EQN)}</div><div class="qq"><span>Pendant combien de temps ?</span>${segH('data-eh',DUREES,EQH)}</div>`;
   h+=`<div class="est">Environ <b>${n0(EQN*EQH*PORTES_H)} portes</b>, soit ${n0(taille)} inscrits.</div>`;}
  else h+=`<div class="tsz"><span>Taille<small>environ ${n0(portesDe(taille))} portes</small></span><div class="stp"><button data-tp="-1" aria-label="25 inscrits de moins">−</button><b>${n0(taille)}<small>inscrits</small></b><button data-tp="1" aria-label="25 inscrits de plus">+</button></div></div>`;
  h+=`<h2>Suggestions de PAP</h2>`;
  if(!C.length)h+=`<div class="empty">Aucune adresse prioritaire libre pour cette taille. Essayez une autre taille.</div>`;
  h+=C.map((z,k)=>{const pr=prioMoyIds(z.ids);
   return `<button class="pk" data-cs="${k}"><div class="t"><span class="rk2">${k+1}</span><b>${esc(ruesDe(z.ids)[0]||z.rue)}</b><span class="prs" style="${prioStyle(pr)}">Priorité ${pr}</span><span class="cv">${I.next}</span></div>`+
    `<small>${esc(z.nums)}</small><div class="st"><span><b>${z.ids.length}</b>adresse${z.ids.length>1?'s':''}</span><span><b>${n0(portesDe(z.ins))}</b>portes environ</span><span><b>${n0(z.ins)}</b>inscrits</span></div></button>`;}).join('');
  h+=selBar();
  return h;},
 after:()=>{lierEC();const p=$('vSel');if(p)p.onclick=()=>detail(vueSel());
  body.querySelectorAll('[data-cs]').forEach(b=>b.onclick=()=>preparer(null,'',null,null,null,{r:+b.dataset.cs+1}));
  body.querySelectorAll('[data-tp]').forEach(b=>b.onclick=()=>{taille=Math.max(25,Math.min(1000,taille+25*(+b.dataset.tp)));LS.set('taille16',taille);render(true);});
  body.querySelectorAll('[data-en]').forEach(b=>b.onclick=()=>{EQN=+b.dataset.en;LS.set('eqN',EQN);render(true);});
  body.querySelectorAll('[data-eh]').forEach(b=>b.onclick=()=>{EQH=+b.dataset.eh;LS.set('eqH',EQH);render(true);});
  body.querySelectorAll('[data-tm]').forEach(b=>b.onclick=()=>{TMODE=b.dataset.tm;LS.set('tmode',TMODE);if(TMODE==='ins'){taille=Math.max(25,Math.round(taille/25)*25);LS.set('taille16',taille);}render(true);});
  $('autre').onclick=()=>viseur(true);}};}

/* ---- un PAP en cours : on note « Pas pu entrer » là où c'est le cas, puis « C'est fait » */
function vueEnCours(id){const ferm=new Set();return {id:'ec',aid:id,html:()=>{const a=actPar(id);if(!a)return headHTML('PAP retiré','',true);
  if(a.statut==='faite')return headHTML(esc(a.nom),'Fait le '+fmtJ(a.faite_le),true)+`<button class="lnk9" id="vact">Voir le détail</button>`;
  const E=a.etapes.map((e,k)=>({e,k,i:idxE(e)})).filter(x=>x.i!=null),ins=E.reduce((s,x)=>s+D.adresses[x.i][3],0);
  let h=headHTML(esc((a.nom||'PAP').replace(/^PAP /,'')),E.length?`Priorité ${prioMoyIds(E.map(x=>x.i))}`:'',true);
  h+=`<div class="sum2"><span><b>${E.length}</b>adresse${E.length>1?'s':''}</span><span><b>${n0(portesDe(ins))}</b>portes environ</span><span><b>${n0(ins)}</b>inscrits</span></div>`;
  h+=E.map((x,j)=>`<div class="lr">${avH('br',j+1)}<button class="tx" data-i="${x.i}"><b>${esc(D.adresses[x.i][2])}</b><small>${pl(D.adresses[x.i][3],'inscrit')}</small></button>${pillH(ferm.has(x.k)?'kf':'k',`data-kf="${x.k}"`)}</div>`).join('');
  h+=`<div class="encours"><b>${a.encours?'En cours':'Prévu'}</b> ${a.encours?depuis(a.encours):a.prevue?'le '+fmtJ(a.prevue):'sans date'} · ${esc(pourQui(a))}</div>`;
  h+=`<button class="btnf" id="fini">${I.check} C'est fait</button><div class="hint" style="text-align:center">Toutes les adresses passent en faites, sauf celles marquées « Pas pu entrer ».</div>`;
  h+=`<button class="lnk9" id="annul">On n'y va plus</button>`;
  return h;},
 after:()=>{lierRows(true);const a=actPar(id);const v=$('vact');if(v)v.onclick=()=>detail(vueAction(id));if(!a||a.statut==='faite')return;
  body.querySelectorAll('[data-kf]').forEach(b=>b.onclick=()=>{const k=+b.dataset.kf;if(ferm.has(k))ferm.delete(k);else ferm.add(k);render(true);});
  $('fini').onclick=()=>{sansToast();const avant=avance();finirPAP(a,ferm);saisie(a,'C\'est fait'+(ferm.size?` (${ferm.size} pas pu entrer)`:''));sauverA();dessinerParcours();vibrer();stack=[vueBase(),vueNote(a,avant)];render();};
  $('annul').onclick=()=>{oterAction([a],'PAP retiré : '+(a.nom||''));show(vueBase());};}};}
/* ---- « C'est noté » : ce que l'action fait gagner à la circo */
function vueNote(a,avant,titre){return {id:'note',html:()=>{const x=avance(),l=a.groupe?duGroupe(a.groupe).filter(y=>y.type==='pap'):[a];
  let nf=0,ins=0;l.forEach(y=>y.etapes.forEach(e=>{const i=idxE(e);if(i!=null&&e.st==='faite'){nf++;ins+=D.adresses[i][3];}}));
  const g=x.pct-avant.pct,sem=papsFaits().filter(y=>cetteSem(y.faite_le)&&(y.ga||[]).some(id=>(a.ga||[]).includes(id))).length;
  let h=`<div class="okb"><span>${I.check}</span></div><div class="ctr"><h1>C'est noté</h1><div class="sub">${esc(titre||(a.nom||'PAP').replace(/^PAP /,''))}${nf?` : ${pl(nf,'adresse faite','adresses faites')}, environ ${n0(portesDe(ins))} portes`:''}</div></div>`;
  const B=parBureau();h+=kpis([[n0(sem),'PAP faits cette semaine par le GA'],[n0(x.nf),'adresses prioritaires faites'],[`${B.filter(o=>o.fi>0).length}/${B.length}`,'bureaux de vote commencés']]);
  h+=`<button class="btnf" id="suite">Voir les propositions suivantes</button>`;
  return h;},after:()=>{$('suite').onclick=()=>{if(ONG!=='pap')setMode('pap');else show(vueBase());};}};}

/* ---- Suivi : avancement, en cours, par bureau de vote (liste et carte), toutes les adresses, outils */
let BZTOUT=false;
const BZCOL=[[0,'transparent'],[10,'#D9C8F0'],[25,'#A784DC'],[50,'#7537C2'],[101,'#4C0297']];
const bzCol=p=>p<=0?'transparent':p<10?BZCOL[1][1]:p<25?BZCOL[2][1]:p<50?BZCOL[3][1]:BZCOL[4][1];
function vueSuivi(){return {id:'base',html:()=>{const x=avance(),B=parBureau().sort((p,q)=>q.p-p.p||q.tot-p.tot),EC=enCours();
  /* v18 : les outils (ancien passage, importer, télécharger) et toutes les actions en haut, avant la longue liste d'adresses */
  /* v19 (JL : « dans le Suivi, l'import doit être discret, en mode trois petits points ») */
  let h=`<div class="csh"><h1>Suivi</h1><button class="ib dots" id="sPlus" aria-label="Ancien passage, importer, télécharger" aria-expanded="false"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button></div><div class="dmenu" id="sMenu" hidden>${qaHTML()}${lienCR()}</div>`+bandeHTML(x)+chiffresHTML(x);
  if(EC.length)h+=`<h2>En cours · ${EC.length}</h2>`+EC.map(carteEC).join('');
  h+=`<h2>Par bureau de vote</h2><div class="sub" style="margin-bottom:4px">Part des inscrits prioritaires déjà faite. Sur la carte : plus c'est foncé, plus c'est avancé.</div>`;
  const n=BZTOUT?B.length:Math.min(6,B.length);
  h+=B.slice(0,n).map(o=>`<button class="bz" data-bv="${esc(o.b)}"><span>${esc(o.b)}</span><span class="jb" style="display:block"><i style="width:${o.fi>0?Math.max(2,o.p):0}%"></i></span><em>${Math.round(o.p)} %</em></button>`).join('');
  if(B.length>6)h+=`<button class="lnk9" id="bzT">${BZTOUT?'Moins de bureaux':`Voir les ${B.length} bureaux`}</button>`;
  h+=`<div class="legb">${[['moins de 10 %',1],['10 à 25 %',2],['25 à 50 %',3],['50 % et plus',4]].map(([t,k])=>`<span><i style="background:${BZCOL[k][1]}"></i>${t}</span>`).join('')}</div>`;
  h+=`<h2>Toutes les adresses</h2><label class="srch2">${I.loupe}<input id="lq" type="search" enterkeyhint="search" placeholder="Chercher une adresse ou une rue" value="${esc(LQT)}" autocomplete="off" aria-label="Chercher une adresse ou une rue"></label><div class="sgc t3" role="group" aria-label="Trier">${[['rue','Par rue'],['prio','Par priorité'],['ins','Par taille']].map(([k,x])=>`<button data-lo="${k}" aria-pressed="${LTRI===k}">${x}</button>`).join('')}</div><button class="chf" id="lfa" aria-pressed="${LFAITES}">${I.check} Faites seulement</button><div id="lres">${resHTML()}</div>`;
  return h;},
 after:()=>{lierEC();majCouches();
  const q=$('lq');let qT=0;q.oninput=()=>{LQT=q.value;clearTimeout(qT);qT=setTimeout(()=>{LQ=normA(LQT.trim());LN=LPAS;majRes(true);},150);};
  body.querySelectorAll('[data-lo]').forEach(b=>b.onclick=()=>{LTRI=b.dataset.lo;LS.set('ltri',LTRI);LN=LPAS;body.querySelectorAll('[data-lo]').forEach(x=>x.setAttribute('aria-pressed',x===b));majRes(true);});
  $('lfa').onclick=()=>{LFAITES=!LFAITES;LN=LPAS;$('lfa').setAttribute('aria-pressed',LFAITES);majRes(true);};
  $('lres').onclick=clicRes;lierQA();suite();
  body.querySelectorAll('[data-bv]').forEach(b=>b.onclick=()=>ouvrirBureau(b.dataset.bv,true));
  const t=$('bzT');if(t)t.onclick=()=>{BZTOUT=!BZTOUT;render(true);};
  $('sPlus').onclick=()=>{const m=$('sMenu');m.hidden=!m.hidden;$('sPlus').setAttribute('aria-expanded',!m.hidden);};}};}

/* ---- ce que la carte montre selon l'onglet : points des adresses (porte-à-porte, tractage), bureaux colorés par
   leur avancement (Suivi), secteurs colorés par leur priorité et tentes (pieds d'immeuble) */
let bzL=null,piL=null,pfL=null;
function majCouches(){if(!D||typeof L==='undefined')return;if(VIS&&ONG!=='pap')viseur(false);
 if(adrL){const on=ONG==='pap'||ONG==='tractage';if(on&&!map.hasLayer(adrL)){adrL.addTo(map);stylerAdr();}else if(!on&&map.hasLayer(adrL))map.removeLayer(adrL);}
 if(bzL){map.removeLayer(bzL);bzL=null;}if(piL){map.removeLayer(piL);piL=null;}if(pfL&&ONG!=='pieds'){map.removeLayer(pfL);pfL=null;}
 if(ONG==='suivi'){const B={};parBureau().forEach(o=>B[o.b]=o);
  bzL=L.geoJSON(D.bureaux,{renderer:rP,style:f=>{const o=B[f.properties.id],p=o?o.p:0;return {color:tok('--accent'),weight:.8,opacity:.55,fillColor:bzCol(o&&o.fi>0?Math.max(p,.1):0),fillOpacity:o&&o.fi>0?.6:0};},
   onEachFeature:(f,l)=>l.on('click',()=>ouvrirBureau(f.properties.id))}).addTo(map);}
 if(ONG==='pieds'){piL=L.layerGroup();(D.pieds||[]).forEach(s=>{const o=infoPied(s),c=prioCol(o.v);
   L.geoJSON(s.geo,{renderer:rP,style:{color:c,weight:1.6,opacity:.95,fillColor:c,fillOpacity:.3},interactive:false}).addTo(piL);
   L.marker(standLL(s),{pane:'pap',icon:L.divIcon({className:'',html:`<div class="tent" style="width:26px;height:26px;background:${c};color:${encreSur(c)}">${I.pied}</div>`,iconSize:[26,26],iconAnchor:[13,13]})}).on('click',()=>ouvrirPied(s)).addTo(piL);});
  piL.addTo(map);}}

/* ---- onglet Pieds d'immeuble : la liste par priorité, le stand, les équipes de PAP autour de la tente */
const standLL=s=>s.poste?[s.poste.lat,s.poste.lon]:[s.lat,s.lon];
const standTxt=s=>s.poste?s.poste.txt:'Au pied des immeubles';
const ecPied=s=>ACTIONS.find(a=>a.type==='diff_pied'&&a.statut==='a_faire'&&a.encours&&a.etapes[0]&&a.etapes[0].lieu.id===s.nom);
function infoPied(s){const r=prioLieu([s.lat,s.lon],'pi',s.geo);return {s,v:r.t?r.v:0,fait:passPied(s.nom)[0],ec:ecPied(s)};}
function vuePieds(){return {id:'base',html:()=>{const S=(D.pieds||[]).map(infoPied).sort((x,y)=>y.v-x.v),nf=S.filter(o=>o.fait).length;
  let h=S.filter(o=>o.ec).map(o=>carteEC(o.ec)).join('');
  h+=`<div class="csh"><h1>Pieds d'immeuble</h1></div>`;
  if(!S.length)return h+`<div class="empty">Aucun secteur de pied d'immeuble dans cette circonscription.</div>`;
  h+=S.map((o,k)=>{const c=prioCol(o.v);return `<button class="sect" data-ps="${D.pieds.indexOf(o.s)}"><span class="pv" style="background:${c};color:${encreSur(c)}">${o.v}</span><span><b>${esc(o.s.nom)}</b>`+
   `<small class="s">Stand : ${esc(standTxt(o.s))}</small><small>${n0(o.s.ins)} inscrits prioritaires dans la zone</small>${o.ec?`<span class="tg ec">En cours</span>`:o.fait?`<span class="tg">Fait le ${fmtJ(o.fait.faite_le)}</span>`:''}</span></button>`;}).join('');
  return h;},
 after:()=>{lierEC();if(pfL){map.removeLayer(pfL);pfL=null;}majCouches();body.querySelectorAll('[data-ps]').forEach(b=>b.onclick=()=>ouvrirPied(D.pieds[+b.dataset.ps]));}};}
function ouvrirPied(s){if(!s)return;if(ONG!=='pieds')setMode('pieds');sel(null);if(!wide&&det==='peek')setDet('half');detail(vuePied(s));}
/* équipes de 2 qui partent de la tente, chacune dans sa direction, de proche en proche, avec de quoi tenir le temps choisi */
function equipes(ll,E,cible){if(!E)return [];const A=D.adresses,cosl=Math.cos(ll[0]*Math.PI/180),libre=new Set();
 A.forEach((a,i)=>{if(isPr(a)&&!recente(i)&&!pasEntreRecent(i)&&!PREV[a[2]]&&dist(ll,[a[1],a[0]])<=800)libre.add(i);});
 const ang=p=>Math.atan2(p[0]-ll[0],(p[1]-ll[1])*cosl),ecart=(p,th)=>{let x=Math.abs(ang(p)-th);return x>Math.PI?2*Math.PI-x:x;};
 let best=0,bv=-1;for(let d=0;d<24;d++){const th=-Math.PI+d*Math.PI/12;let v=0;libre.forEach(i=>{const p=ptA(i);if(ecart(p,th)<Math.PI/E)v+=A[i][3]/(80+dist(ll,p));});if(v>bv){bv=v;best=th;}}
 const T=[];for(let k=0;k<E;k++){const th=best+2*Math.PI*k/E,ids=[];let s=0,cur=ll;
  while(s<cible*.85){let bi=null,bd=1e12;libre.forEach(i=>{const p=ptA(i),dans=ecart(p,th)<=Math.PI/E;if(!ids.length&&!dans)return;if(s+A[i][3]>cible*1.25)return;
    const d=dist(cur,p)+(dans?0:120);if(d<bd&&d<300+(ids.length?0:200)){bd=d;bi=i;}});
   if(bi==null)break;ids.push(bi);libre.delete(bi);s+=A[bi][3];cur=ptA(bi);}
  if(ids.length)T.push({ids,ins:s,rue:ruesDe(ids)[0]});}
 return T;}
const EQC=['#4C0297','#1D4ED8','#0F766E','#B45309','#BE185D','#4D7C0F','#7C3AED','#0E7490','#C2410C','#374151'],eqSt=k=>`style="background:${EQC[k%10]};color:#fff"`;
function dessinerPied(s,T){if(pfL)map.removeLayer(pfL);if(piL){map.removeLayer(piL);piL=null;}pfL=L.layerGroup().addTo(map);const c=prioCol(infoPied(s).v),ll=standLL(s);
 L.geoJSON(s.geo,{renderer:rP,style:{color:c,weight:1.4,opacity:.9,dashArray:'4 3',fill:false},interactive:false}).addTo(pfL);
 T.forEach((e,k)=>{const P=e.ids.map(ptA);L.polyline([ll,...P],{renderer:rP,color:EQC[k%10],weight:3,opacity:.85,lineCap:'round',dashArray:'1 6',interactive:false}).addTo(pfL);
  P.forEach((p,j)=>L.marker(p,{pane:'pap',icon:L.divIcon({className:'',html:`<div class="pin2" ${eqSt(k)}>${j+1}</div>`,iconSize:[24,24],iconAnchor:[12,12]})}).on('click',()=>ouvrirAdresse(e.ids[j],true)).addTo(pfL));});
 L.marker(ll,{pane:'pap',zIndexOffset:2000,icon:L.divIcon({className:'',html:`<div class="tent" style="width:34px;height:34px;background:${c};color:${encreSur(c)}">${I.pied}</div>`,iconSize:[34,34],iconAnchor:[17,17]})}).addTo(pfL);
 try{map.stop();}catch(e){}map.fitBounds(L.latLngBounds([ll,...T.flatMap(e=>e.ids.map(ptA))]).pad(.15),{...pad(),maxZoom:17.5,animate:false});}
const GENS_P=[[2,'2'],[4,'4'],[6,'6'],[8,'8'],[10,'10 et +']];
function vuePied(s){let E=LS.get('pE',3),PM=LS.get('pM','h'),hh=LS.get('pH',2),pI=LS.get('pI',300),gaC=gaDefaut()[0]||((gaActifs()[0]||{}).id)||'',T=[];
 return {id:'pi',html:()=>{const o=infoPied(s),ec=o.ec;
  let h=headHTML(esc(s.nom),s.qpv&&s.qpv.length?esc(s.qpv.map(q=>q.nom).join(', ')):"Pied d'immeuble",true);
  h+=`<div class="pcs"><span class="prs" style="${prioStyle(o.v)}">Priorité ${o.v}/100</span>${o.fait&&!ec?`<span class="pc ok"><i></i>Fait le ${fmtJ(o.fait.faite_le)}</span>`:''}</div>`;
  h+=`<div class="sub" style="margin-top:10px;color:var(--ink);font-size:14px">Stand : <b>${esc(standTxt(s))}</b></div>`;
  if(s.poste&&s.poste.type!=='square')h+=`<div class="hint">Endroit repéré sur les plans : à confirmer sur place.</div>`;
  if(ec){const G=ec.groupe?duGroupe(ec.groupe).filter(a=>a.type==='pap'&&a.statut==='a_faire'):[];T=G.map(a=>({ids:a.etapes.map(idxE).filter(i=>i!=null)}));T.forEach(e=>{e.ins=e.ids.reduce((t,i)=>t+D.adresses[i][3],0);e.rue=ruesDe(e.ids)[0];});
   h+=`<div class="encours"><b>En cours</b> ${depuis(ec.encours)} · ${esc(pourQui(ec))}</div>`;
   h+=`<h2>Qui fait quoi</h2><div class="eqx"><span class="av2 eqS">${I.pied}</span><div><b>Stand</b><small>${esc(standTxt(s))}</small></div></div>`;
   h+=G.map((a,k)=>`<div class="eqx"><span class="av2" ${eqSt(k)}>${k+1}</span><div><b>Équipe ${k+1} · ${esc(T[k].rue||'')}</b><small>${pl(T[k].ids.length,'adresse')} · environ ${n0(portesDe(T[k].ins))} portes</small></div></div>`).join('');
   h+=`<button class="btnf" id="pfini">${I.check} C'est fait</button><div class="hint" style="text-align:center">${G.length?'Le stand et les PAP des équipes sont validés d\'une seule touche.':'Le stand est validé.'}</div><button class="lnk9" id="pannul">On n'y va plus</button>`;
   return h;}
  const cible=PM==='i'?(E?pI/E:0):2*hh*PORTES_H*INS_PORTE;T=equipes(standLL(s),E,cible);
  h+=`<div class="tsz"><span>Équipes de 2 en PAP<small>et 2 personnes au stand</small></span><div class="stp"><button data-pe="-1" aria-label="Une équipe de moins">−</button><b>${E}<small>équipe${E>1?'s':''}</small></b><button data-pe="1" aria-label="Une équipe de plus">+</button></div></div>`;
  if(E){h+=`<div class="tsw"><span>Choisir la taille par</span>${segH('data-pm',[['h','Temps'],['i','Nombre d\'inscrits']],PM)}</div>`;
   h+=PM==='h'?`<div class="qq"><span>Pendant combien de temps ?</span>${segH('data-ph',DUREES,hh)}</div>`:`<div class="tsz"><span>Inscrits en tout<small>environ ${n0(portesDe(pI))} portes</small></span><div class="stp"><button data-pi="-1" aria-label="50 inscrits de moins">−</button><b>${n0(pI)}<small>inscrits</small></b><button data-pi="1" aria-label="50 inscrits de plus">+</button></div></div>`;}
  const pt=T.reduce((t,e)=>t+portesDe(e.ins),0),du=T.length?dureeTxt(pt/(2*PORTES_H*T.length)):'';
  h+=!E?`<div class="est">On tient le stand à <b>2</b>, sans PAP autour.</div>`:T.length?`<div class="est"><b>2</b> au stand et <b>${T.length} équipe${T.length>1?'s':''} de 2</b> en PAP : environ <b>${n0(pt)} portes</b>${PM==='i'?`, environ <b>${du}</b>`:''}.${T.length<E?` Pas assez d'adresses prioritaires libres pour ${E} équipes.`:''}</div>`:`<div class="est">Plus d'adresse prioritaire libre autour : on tient le stand.</div>`;
  h+=`<h2>Qui fait quoi</h2><div class="eqx"><span class="av2 eqS">${I.pied}</span><div><b>Stand</b><small>2 personnes · ${esc(standTxt(s))}</small></div></div>`;
  h+=T.map((e,k)=>`<div class="eqx"><span class="av2" ${eqSt(k)}>${k+1}</span><div><b>Équipe ${k+1} · ${esc(e.rue)}</b><small>${pl(e.ids.length,'adresse')} · environ ${n0(portesDe(e.ins))} portes · départ de la tente</small></div></div>`).join('');
  const G=gaActifs();
  h+=`<div class="pour"><label class="chs">${G.length?`<select id="pga" aria-label="Groupe d'action">${G.map(g=>`<option value="${g.id}"${g.id===gaC?' selected':''}>${esc(g.nom)}</option>`).join('')}</select>`:'Aucun GA'}${I.down}</label></div>`;
  h+=`<button class="btnf go2" id="pgo" ${gaC?'':'disabled'}>On y va</button><div class="hint" style="text-align:center">Le stand${T.length?' et les PAP des équipes passent':' passe'} « en cours » ; à la fin, une seule touche « C'est fait » valide tout.</div>`;
  return h;},
 after:()=>{dessinerPied(s,T);
  body.querySelectorAll('[data-pe]').forEach(b=>b.onclick=()=>{E=Math.max(0,Math.min(10,E+(+b.dataset.pe)));LS.set('pE',E);render(true);});
  body.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>{PM=b.dataset.pm;LS.set('pM',PM);render(true);});
  body.querySelectorAll('[data-pi]').forEach(b=>b.onclick=()=>{pI=Math.max(50,Math.min(5000,pI+50*(+b.dataset.pi)));LS.set('pI',pI);render(true);});
  body.querySelectorAll('[data-ph]').forEach(b=>b.onclick=()=>{hh=+b.dataset.ph;LS.set('pH',hh);render(true);});
  const g=$('pga');if(g)g.onchange=()=>{gaC=g.value;};
  const go=$('pgo');if(go)go.onclick=()=>{if(!gaC)return;const grp=uid();
   const st=nouvelleAction('diff_pied',{ga:[gaC],nb:2+2*T.length,groupe:grp,origine:{lot:'pied'},etapes:[{lieu:{t:'secteur',id:s.nom},portes:0,toquees:0,ouvertes:0,st:'',acc:'',boites:0,le:''}]});
   st.nom=`Pied d'immeuble ${s.nom}`;lancer(st);ACTIONS.push(st);saisie(st,'pied d\'immeuble lancé : en cours');
   T.forEach((e,k)=>{const a=nouvelleAction('pap',{ga:[gaC],nb:2,groupe:grp,origine:{lot:'pied',secteur:s.nom,equipe:k+1},etapes:e.ids.map(etapeAdr)});
    a.nom=`PAP ${e.rue} (équipe ${k+1}, ${s.nom})`;lancer(a);ACTIONS.push(a);saisie(a,'PAP lancé depuis un pied d\'immeuble');});
   LS.set('dga',[gaC]);sauverA();dessinerParcours();vibrer();render(true);toast(`En cours : ${s.nom}${T.length?' et '+pl(T.length,'équipe'):''}`);};
  const f=$('pfini');if(f)f.onclick=()=>{sansToast();const ec=ecPied(s);if(!ec)return;const avant=avance();finirPied(ec);sauverA();dessinerParcours();vibrer();
   stack=[vueBase(),vueNote(ec,avant,"Pied d'immeuble "+s.nom)];render();};
  const an=$('pannul');if(an)an.onclick=()=>{const ec=ecPied(s);if(!ec)return;oterAction(ec.groupe?duGroupe(ec.groupe):[ec],'Retiré : '+s.nom);render(true);};}};}

/* ---------------- v17 (31/10/2026, arbitrages JL) : le pourcentage seulement dans le Suivi ; un choix clair « par inscrits »
   ou « par personnes et temps » ; jusqu'à 5 h ; pieds d'immeuble : 1 à 10 équipes de 2 et le stand, réglés par le temps ou
   par le nombre d'inscrits ; une cible sur la carte et « Me proposer un PAP dans cette zone » ; un PAP proposé s'agrandit
   avant « On y va ». */
const dureeTxt=h=>{const m=Math.max(30,Math.round(h*2)*30);return m<60?'30 min':`${Math.floor(m/60)} h${m%60?' 30':''}`;};
const libreP=i=>{const a=D.adresses[i];return isPr(a)&&!recente(i)&&!pasEntreRecent(i)&&!PREV[a[2]];};
/* agrandir un PAP proposé : l'adresse prioritaire libre la plus proche de la dernière, de proche en proche (pasSuivant) */
function agrandir(lot){if(!lot||!lot.ids.length)return false;const last=lot.ids[lot.ids.length-1],p0=ptA(last),C=[];
 D.adresses.forEach((a,i)=>{if(libreP(i)&&!lot.ids.includes(i)&&dist(p0,[a[1],a[0]])<800)C.push(i);});
 const r=pasSuivant(C,j=>dist(p0,ptA(j)),new Set(lot.ids),1e6,last,[250,400,600],false);if(!r)return false;
 lot.ids.push(r[0]);lot.ins=insDe(lot.ids);lot.km=kmDe(lot.ids);return true;}
/* le meilleur PAP autour de la cible : on part de chaque adresse prioritaire libre à 350 m au plus, on bâtit le PAP de
   proche en proche à la taille choisie, on garde le plus efficace (même mesure que les PAP proposés, p6_liste.js) */
function meilleurPAP(ll){const A=D.adresses,cible=taille,S=[],C=[];
 A.forEach((a,i)=>{if(!libreP(i))return;const d=dist(ll,[a[1],a[0]]);if(d<1500)C.push(i);if(d<=350&&a[3]<=cible*1.1)S.push([i,d]);});
 S.sort((x,y)=>x[1]-y[1]);let best=null;
 for(const [i0] of S.slice(0,60)){const out=[i0],pris=new Set(out);let s=A[i0][3],km=0,cur=i0;
  while(s<cible*.9){const c0=ptA(cur),r=pasSuivant(C,j=>dist(c0,ptA(j)),pris,cible-s,cur,[250,400],false);if(!r)break;out.push(r[0]);pris.add(r[0]);s+=A[r[0]][3];km+=r[1];cur=r[0];}
  const e=out.reduce((t,j)=>t+A[j][3]*A[j][5]/100,0)/(km+40*out.length)*(s>=cible*.6?1:.01);
  if(!best||e>best.e)best={ids:out,ins:s,km,e};}
 return best?{ll:null,ids:best.ids,ins:best.ins,km:best.km,cible,msg:'',zone:true,rue:ruesDe(best.ids)[0]}:null;}
/* la cible (v20, JL : « dur de cibler, on ne voit rien ») : la liste se range, la carte prend l'écran, la cible au milieu de
   la partie visible ; en bas, un bouton fin « PAP ici » et une croix pour annuler ; une petite bulle en haut dit quoi faire */
let VDET='half';
function ptCible(){const x=$('visr');if(wide||!x)return centreVisible();const t=($('searchbox').getBoundingClientRect().bottom||76)+4,b=(x.querySelector('.vbar').getBoundingClientRect().top||app.clientHeight)-4;
 return map.containerPointToLatLng([app.clientWidth/2,(t+b)/2]);}
function viseur(on){const avant=VIS;VIS=!!on;let x=$('visr');
 if(!x){x=document.createElement('div');x.id='visr';x.hidden=true;
  x.innerHTML=`<div class="vtip">Placez la cible sur le quartier voulu</div><div class="vcx" aria-hidden="true"></div><div class="vbar"><button class="vno" id="vno" aria-label="Annuler">${I.x}</button><button class="btnf go2" id="vgo">PAP ici</button></div>`;app.appendChild(x);
  $('vno').onclick=()=>viseur(false);
  $('vgo').onclick=()=>{const c=ptCible(),ll=[c.lat,c.lng];if(!dansCirco(ll)){toast('La cible est hors de la '+D.k+'e circonscription. Déplacez la carte.');return;}
   const l=meilleurPAP(ll);if(!l){toast('Aucune adresse prioritaire libre près de la cible. Déplacez la carte.');return;}viseur(false);preparer(null,'',null,null,null,{lot:l});};}
 x.hidden=!VIS;app.classList.toggle('vis',VIS);
 if(VIS){if(!avant)VDET=det;const v=x.querySelector('.vcx'),pl=()=>{const p=map.latLngToContainerPoint(ptCible());v.style.left=p.x+'px';v.style.top=p.y+'px';};pl();setTimeout(pl,60);}
 else if(avant&&!wide)setDet(VDET||'half');}
/* v19 : agrandir la carte (téléphone) : la liste descend, la carte prend l'écran ; une 2e touche la remet */
$('fBig').onclick=()=>{setDet(det==='peek'?'half':'peek');setTimeout(()=>map.invalidateSize(),320);};
