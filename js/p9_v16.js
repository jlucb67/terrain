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
const depuis=s=>{const d=toD(s);if(!d)return '';return cetteSem(s)&&isoD(d).slice(0,10)===isoD(new Date()).slice(0,10)?'depuis '+fmtH(d).replace(/ /g,String.fromCharCode(160)):'depuis le '+fmtJ(s);};

/* ---- avancement : part des inscrits des adresses prioritaires (priorité 70 et plus, 6 inscrits et plus) déjà faits
   (arbitrage JL du 31/10/2026 ; v27 : une seule campagne, la présidentielle) */
function avance(){let tot=0,fi=0,sem=0,nf=0;D.adresses.forEach(a=>{if(!isPr(a))return;tot+=a[3];if(statutA(a[2])!=='fait')return;fi+=a[3];nf++;const p=PASS[a[2]];if(p&&cetteSem(p[0].q))sem+=a[3];});
 return {tot,fi,nf,pct:tot?100*fi/tot:0,sem:tot?100*sem/tot:0};}
function bandeHTML(x,titre,extra,grand,larg){const w=larg!=null?larg:x.pct;
 return `<div class="prog"><div class="t"><b>${titre||D.k+'e circonscription'}</b><strong>${grand||pc1(x.pct)+' %'}</strong></div><div class="jb"><i style="width:${Math.max(w>0?1.5:0,Math.min(100,w))}%"></i></div>`+
  `<small>${extra||`<b>${n0(x.fi)}</b> inscrits faits sur ${n0(x.tot)} dans les adresses prioritaires · ${x.sem>0?`<b>+${pc1(x.sem)} %</b> cette semaine`:'rien encore cette semaine'}`}</small></div>`;}
function parBureau(){const B={};D.adresses.forEach(a=>{if(!isPr(a))return;const o=B[a[8]]=B[a[8]]||{b:a[8],tot:0,fi:0};o.tot+=a[3];if(statutA(a[2])==='fait')o.fi+=a[3];});
 return Object.values(B).map(o=>Object.assign(o,{p:o.tot?100*o.fi/o.tot:0}));}
const papsFaits=()=>ACTIONS.filter(a=>a.type==='pap'&&a.statut==='faite'&&!deListe(a)&&!(a.origine&&a.origine.lot==='historique'));   /* v30 : sans l'ancien passage ni l'import */
/* ---- v27 (14/11/2026, JL) : taux d'ouverture des portes d'un PAP, facultatif : portes toquées et ouvertes (le taux se calcule),
   ou le taux noté directement */
const tauxA=a=>a.taux!=null&&a.taux!==''?Math.max(0,Math.min(100,Math.round(+a.taux))):a.portes&&a.portes.t>0?Math.round(100*Math.min(a.portes.o||0,a.portes.t)/a.portes.t):null;
function portesHTML(a){const p=a.portes||{t:0,o:0},m=a.taux!=null?'t':a.portes?'c':LS.get('ptm','c'),tx=tauxA(a);
 let h=`<div class="pto"><h2>Portes ouvertes <small>(facultatif)</small></h2>`+segH('data-tm',[['c','Compter les portes'],['t','Noter le taux']],m);
 if(m==='c')h+=`<div class="cpts">${cptHTML('t','Portes toquées',p.t||0)}${cptHTML('o','Portes ouvertes',p.o||0)}</div>`;
 else h+=`<label class="fld" for="ptx">Taux d'ouverture des portes (en %)<input id="ptx" inputmode="numeric" pattern="[0-9]*" maxlength="3" value="${a.taux!=null?a.taux:''}" placeholder="par exemple 30"></label>`;
 h+=`<div class="sub" id="ptxv">${tx!=null?`Taux d'ouverture : <b>${tx} %</b>`:'Pas encore noté.'}</div></div>`;return h;}
function lierPortes(a){let tS=0,dit=false;const enr=()=>{clearTimeout(tS);tS=setTimeout(()=>{if(!dit){saisie(a,'portes ouvertes');dit=true;}sauverA();},700);},
  maj=()=>{const v=$('ptxv'),tx=tauxA(a);if(v)v.innerHTML=tx!=null?`Taux d'ouverture : <b>${tx} %</b>`:'Pas encore noté.';};
 body.querySelectorAll('[data-tm]').forEach(b=>b.onclick=()=>{LS.set('ptm',b.dataset.tm);if(b.dataset.tm==='c'){delete a.taux;}else{delete a.portes;}enr();render(true);});
 lierCpt(k=>((a.portes||{})[k])||0,(k,v)=>{a.portes=Object.assign({t:0,o:0},a.portes||{});a.portes[k]=v;if(k==='o'&&v>a.portes.t)a.portes.t=v;if(k==='t'&&a.portes.o>v)a.portes.o=v;delete a.taux;enr();maj();});
 const x=$('ptx');if(x)x.oninput=()=>{const v=parseInt(x.value.replace(/\D/g,''),10);if(isNaN(v))delete a.taux;else a.taux=Math.min(100,v);delete a.portes;enr();maj();};}
/* taux moyen des PAP qui l'ont noté (un PAP compte pour un) */
function tauxMoyen(){const l=ACTIONS.filter(a=>(a.type==='pap'||a.type==='diff_pied')&&a.statut==='faite').map(tauxA).filter(v=>v!=null);
 return l.length?{v:Math.round(l.reduce((s,v)=>s+v,0)/l.length),n:l.length}:null;}
/* récap du tractage (v27) : chaque lieu, son dernier passage (jour, heure, GA) et le nombre de passages */
const TYPES_TR=['diff_marche','diff_metro','diff_supermarche','diff_parcours'];
function recapTractage(){const P={};ACTIONS.forEach(a=>{if(!TYPES_TR.includes(a.type)||a.statut!=='faite'||!a.etapes[0])return;const l=a.etapes[0].lieu,k=l.t+'|'+l.id;
  const o=P[k]=P[k]||{t:l.t,id:l.id,type:a.type,n:0,der:null,sem:0};o.n++;if(cetteSem(a.faite_le))o.sem++;if(!o.der||String(a.faite_le)>String(o.der.faite_le))o.der=a;});
 return Object.values(P).sort((x,y)=>String(y.der.faite_le).localeCompare(String(x.der.faite_le)));}
let TRTOUT=false;
function tractageHTML(){const R=recapTractage(),sem=R.reduce((s,o)=>s+o.sem,0);
 let h=`<h2>Tractage</h2>`;if(!R.length)return h+`<div class="sub">Aucun passage noté pour l'instant. Programmez un tractage dans l'onglet Programmer, puis validez-le au Calendrier : le passage s'enregistre ici.</div>`;
 h+=`<div class="sub" style="margin-bottom:4px">${pl(sem,'passage')} cette semaine · ${pl(R.length,'lieu','lieux')} ${R.length>1?'faits':'fait'} depuis le début</div>`;
 const n=TRTOUT?R.length:Math.min(6,R.length);
 h+=R.slice(0,n).map((o,j)=>`<div class="lr">${avH('ok',o.n>1?o.n:I.check)}<button class="tx" data-tr="${j}"><b>${esc(o.id)}</b><small>${esc(TYPES_C[o.type])} · dernier passage ${esc(fmtJH(o.der.faite_le).replace(/^./,c=>c.toLowerCase()))}${o.der.ga&&o.der.ga.length?' · '+esc(o.der.ga.map(gaNom).join(', ')):''}</small></button><span class="trn">${pl(o.n,'passage')}</span></div>`).join('');
 if(R.length>6)h+=`<button class="lnk9" id="trT">${TRTOUT?'Moins de lieux':`Voir les ${R.length} lieux`}</button>`;
 return h;}
function lierTractage(){const R=recapTractage();body.querySelectorAll('[data-tr]').forEach(b=>b.onclick=()=>{const o=R[+b.dataset.tr];if(!o)return;setMode('tractage');ouvrirLieuEq(o.t,o.id);});
 const t=$('trT');if(t)t.onclick=()=>{TRTOUT=!TRTOUT;render(true);};}
function chiffresHTML(x){const B=parBureau();
 const nP=papsFaits().length;return kpis([[n0(nP),nP>1?'PAP faits depuis le début':'PAP fait depuis le début'],[n0(x.nf),'adresses prioritaires faites'],[`${B.filter(o=>o.fi>0).length}/${B.length}`,'bureaux de vote commencés, parmi ceux qui ont des adresses prioritaires']])+(t=>t?`<div class="sub txo">Taux d'ouverture des portes : <b>${t.v} %</b> en moyenne, sur ${pl(t.n,'PAP renseigné','PAP renseignés')}</div>`:'')(tauxMoyen());}

/* ---- en cours : « On y va » ; « C'est fait » valide. Un pied d'immeuble lancé = une action « pied d'immeuble » et une
   action PAP par équipe, reliées par « groupe » */
/* v32 (21/11/2026, JL : « on y va > programmer » ; « le terme c'est fait donne l'impression que c'est déjà fait : premier clic programmer,
   puis valider quand on revient » ; « le en cours depuis x h, à enlever de partout ») : une action est programmée (jour et heure),
   puis validée ; plus d'état « en cours ». Une action « en cours » d'avant la v32 compte comme programmée à son heure de lancement. */
const maintenant=()=>isoD(new Date());
function lancer(a,q){a.prevue=q||maintenant();a.plan=1;delete a.encours;}
const aValider=a=>a.statut==='a_faire'&&(!!a.encours||dueP(a));   /* programmée, l'heure passée : à valider */
const quandA=a=>a.encours||a.prevue||'';
const quandDe=o=>o&&o.m&&o.q?o.q:maintenant();   /* le « Quand » choisi, sinon maintenant (au moment de « Programmer ») */
/* en cours : lancés par « On y va » ; on y range aussi les PAP prévus avant la v16 (statut « à faire », sans « en cours ») ;
   v28 : et ce qui est prévu plus tard (plan) : PAP, pieds d'immeuble, diffs. En cours d'abord, puis le plus proche */
const enCours=()=>ACTIONS.filter(a=>a.statut==='a_faire'&&((a.type==='diff_pied'&&(a.encours||a.plan))||(a.type==='pap'&&!a.groupe&&!deListe(a))||diffPrevue(a)||diffEC(a)))
 .sort((x,y)=>(aValider(y)-aValider(x))||String(quandA(x)||'9999').localeCompare(String(quandA(y)||'9999')));   /* v32 : à valider d'abord */
/* v28 (14/11/2026, JL : « ça doit pouvoir rentrer dans le sondage, pour les futures actions ») : « Maintenant » ou « Plus tard »
   (jour et heure) pour lancer un PAP ou un pied d'immeuble ; prévu plus tard, il entre dans le sondage de la semaine du GA */
const demain10=()=>isoD(new Date(Date.now()+864e5)).slice(0,10)+'T10:00';
/* v32 (JL : « plus tard / maintenant : enlever maintenant, garder juste le choix de date ; le maintenant, c'est la date déjà mise
   du jour » ; « toujours le même mode de choix d'horaire, où on met la date et l'heure ») : un seul champ « Quand », déjà rempli */
function tardHTML(o){if(!o.m||!o.q||o.q.length<16)o.q=maintenant();   /* pas encore touché : toujours maintenant (o.m : choisi à la main) */
 return `<div class="qtd q1"><span class="qlab">Quand</span><div class="rw3"><input type="date" id="qtD" value="${o.q.slice(0,10)}" aria-label="Jour"><input type="time" id="qtT" value="${o.q.slice(11,16)}" aria-label="Heure"></div></div>`;}
function lierTard(o,apres){const d=$('qtD'),t=$('qtT');const fait=()=>{if(apres)apres();else render(true);};
 if(d)d.onchange=()=>{if(d.value){o.q=d.value+o.q.slice(10);o.m=1;fait();}};if(t)t.onchange=()=>{if(t.value){o.q=o.q.slice(0,11)+t.value;o.m=1;fait();}};}
const duGroupe=g=>ACTIONS.filter(a=>a.groupe===g);
function finirPAP(a,ferm){const now=isoD(new Date());if(!a.quand&&quandA(a))a.quand=quandA(a);   /* v32 : le calendrier la garde à son heure */
 a.etapes.forEach((e,k)=>{if(idxE(e)==null)return;if(ferm&&ferm.has(k)){e.st='ferme';e.le=now;}else if(stE(e)==='afaire'){e.st='faite';e.le=now;}});
 a.statut='faite';a.faite_le=now;a.prevue='';delete a.encours;}
function finirPied(st){const now=isoD(new Date()),l=st.groupe?duGroupe(st.groupe):[st];
 l.forEach(a=>{if(a.statut!=='a_faire')return;if(a.type==='pap')finirPAP(a);else{if(!a.quand&&quandA(a))a.quand=quandA(a);a.statut='faite';a.faite_le=now;a.prevue='';delete a.encours;(a.etapes||[]).forEach(e=>{e.st='faite';e.le=now;});}
  saisie(a,'C\'est fait');});}
function oterAction(l,quoi){const pos=l.map(a=>[ACTIONS.indexOf(a),a]).filter(x=>x[0]>=0).sort((x,y)=>y[0]-x[0]);pos.forEach(([k])=>ACTIONS.splice(k,1));sauverA();dessinerParcours();
 toast(quoi,{t:'Défaire',fn:()=>{pos.slice().reverse().forEach(([k,a])=>ACTIONS.splice(k,0,a));sauverA();dessinerParcours();render(true);}});}
const sansToast=()=>{const t=$('toast');if(t)t.hidden=true;clearTimeout(toast.k);};
const pourQui=a=>(a.ga||[]).map(gaNom).join(', ')||'sans GA';
/* v30 (audit) : « et N autres … : voir le Suivi », d'une touche */
const voirSuivi=(n,s,p)=>n>0?`<button class="lnk9" data-vsu="1" style="margin:-4px 0 10px">et ${pl(n,s,p)} : voir le Suivi</button>`:'';
function carteEC(a){const p=a.type==='diff_pied',d=diffPrevue(a)||diffEC(a),l=a.etapes[0]?a.etapes[0].lieu:{t:'',id:''},s=(p||d)?l.id:'',n=p?duGroupe(a.groupe||'').filter(x=>x.type==='pap').length:0;
 const t=p?`Pied d'immeuble ${esc(s)}`:d?esc(l.t==='station'?'Métro '+s:s):esc((a.nom||'PAP').replace(/^PAP /,''));
 const q=quandA(a)?'le '+quandP(quandA(a)):'sans date',due=aValider(a);   /* v32 */
 const sub=p?`${n?pl(n,'équipe')+' de PAP · ':''}${q} · ${esc(pourQui(a))}`:d?`${esc(TYPES[a.type])} · ${q} · ${esc(pourQui(a))}`:`${pl(a.etapes.length,'adresse')} · ${q} · ${esc(pourQui(a))}`;
 return `<button class="ecc" data-ec="${a.id}"><span class="dot"></span><span><b>${due?'À valider':'Programmé'} : ${t}</b><small>${sub}</small></span><span class="ecb${due?' go':''}">${due?'Valider':'Ouvrir'}</span></button>`;}
function ouvrirEC(id){const a=actPar(id);if(!a)return;if(a.type==='diff_pied'){const s=a.etapes[0]&&piedDe(a.etapes[0].lieu.id);if(s){ouvrirPied(s);return;}}
 if(diffPrevue(a)||diffEC(a)){const l=a.etapes[0].lieu;if(ONG!=='tractage')setMode('tractage');ouvrirLieuEq(l.t,l.id);return;}   /* v29 : la fiche du lieu, avec « C'est fait » */detail(vueEnCours(id));}
const lierEC=()=>{body.querySelectorAll('[data-ec]').forEach(b=>b.onclick=()=>ouvrirEC(b.dataset.ec));body.querySelectorAll('[data-vsu]').forEach(b=>b.onclick=()=>setMode('suivi'));};

/* ---- accueil du porte-à-porte : en cours, avancement, taille, 3 PAP proposés */
let TMODE=LS.get('tmode','ins'),EQN=LS.get('eqN',2),EQH=LS.get('eqH',2),VIS=false;
if(![2,4,6,8,10].includes(EQN))EQN=Math.min(10,Math.max(2,Math.ceil((+EQN||2)/2)*2));   /* v31 : une ancienne valeur (1, 3, 5) passe au nombre pair au-dessus */
const DUREES=[[1,'1 h'],[1.5,'1 h 30'],[2,'2 h'],[3,'3 h'],[4,'4 h'],[5,'5 h']],GENS=[[2,'2'],[4,'4'],[6,'6'],[8,'8'],[10,'10']];   /* v31 (JL) : 2, 4, 6, 8, 10 */
const tailleEq=()=>Math.round(EQN*EQH*PORTES_H*INS_PORTE);
const segH=(attr,l,v)=>`<div class="seg" role="group">${l.map(([x,t])=>`<button ${attr}="${x}" aria-pressed="${x===v}">${t}</button>`).join('')}</div>`;
function vueAccueil(){return {id:'base',html:()=>{if(TMODE==='eq')taille=tailleEq();const C=conseilles();
  /* v32, 2e temps (JL : « un petit encart » ; « il ne faut plus qu'il y ait le suivi des actions » ici, tout est au Calendrier) :
     on touche la carte là où l'on veut le PAP ; la cible reste au choix ; les propositions en pastilles */
  let h=`<div class="tap1"><span class="ti">${I.target}</span><span><b>${wide?'Cliquez sur':'Touchez'} la carte</b><small>là où vous voulez faire le PAP</small></span><button class="btn line sm" id="autre">Viser</button></div>`;
  h+=`<div class="tsw"><span>Taille du PAP, selon</span>${segH('data-tm',[['ins','Nombre d\'inscrits'],['eq','Personnes et temps']],TMODE)}</div>`;
  if(TMODE==='eq'){h+=`<div class="qq"><span>Vous êtes combien ?</span>${segH('data-en',GENS,EQN)}</div><div class="qq"><span>Pendant combien de temps ?</span>${segH('data-eh',DUREES,EQH)}</div>`;
   h+=`<div class="est">Environ <b>${n0(EQN*EQH*PORTES_H)} portes</b>, soit ${n0(taille)} inscrits.</div>`;}
  else h+=`<div class="tsz"><span>Taille du PAP<small>environ ${n0(portesDe(taille))} portes</small></span><div class="stp"><button data-tp="-1" aria-label="25 inscrits de moins">−</button><b>${n0(taille)}<small>inscrits</small></b><button data-tp="1" aria-label="25 inscrits de plus">+</button></div></div>`;
  if(!C.length)h+=`<div class="empty">Aucune adresse prioritaire libre pour cette taille. Essayez une autre taille.</div>`;
  else h+=`<div class="prl">Ou une proposition${C[0].cq?', une par quartier':''}</div><div class="chp">${C.map((z,k)=>{const pr=prioMoyIds(z.ids);
   return `<button class="pkc" data-cs="${k}" title="${esc((z.cq?z.cq+' · ':'')+'priorité '+pr+' · '+pl(z.ids.length,'adresse')+' · '+n0(z.ins)+' inscrits')}"><i style="background:${prioCol(pr)}"></i><b>${k+1}</b>${esc(ruesDe(z.ids)[0]||z.rue)}</button>`;}).join('')}</div>`;
  h+=selBar();
  return h;},
 after:()=>{const p=$('vSel');if(p)p.onclick=()=>detail(vueSel());
  body.querySelectorAll('[data-cs]').forEach(b=>b.onclick=()=>preparer(null,'',null,null,null,{r:+b.dataset.cs+1}));
  body.querySelectorAll('[data-tp]').forEach(b=>b.onclick=()=>{taille=Math.max(25,Math.min(1000,taille+25*(+b.dataset.tp)));LS.set('taille16',taille);render(true);});
  body.querySelectorAll('[data-en]').forEach(b=>b.onclick=()=>{EQN=+b.dataset.en;LS.set('eqN',EQN);render(true);});
  body.querySelectorAll('[data-eh]').forEach(b=>b.onclick=()=>{EQH=+b.dataset.eh;LS.set('eqH',EQH);render(true);});
  body.querySelectorAll('[data-tm]').forEach(b=>b.onclick=()=>{TMODE=b.dataset.tm;LS.set('tmode',TMODE);if(TMODE==='ins'){taille=Math.max(25,Math.round(taille/25)*25);LS.set('taille16',taille);}render(true);});
  $('autre').onclick=()=>viseur(true);}};}

/* ---- un PAP en cours : on note « Pas pu entrer » là où c'est le cas, puis « C'est fait » */
/* v30 (audit) : un PAP prévu a « On y va » (il passe en cours), son jour et son heure se changent ici ; « C'est fait » dès l'heure passée */
function vueEnCours(id){const ferm=new Set();let chg=false,nq='';return {id:'ec',aid:id,html:()=>{const a=actPar(id);if(!a)return headHTML('PAP retiré','',true);
  if(a.statut==='faite')return headHTML(esc(a.nom),'Fait le '+fmtJ(a.faite_le),true)+portesHTML(a)+comViteHTML(a,'pap')+`<button class="lnk9" id="vact">Voir le détail</button>`;
  const E=a.etapes.map((e,k)=>({e,k,i:idxE(e)})).filter(x=>x.i!=null),ins=E.reduce((s,x)=>s+D.adresses[x.i][3],0);
  let h=headHTML(esc((a.nom||'PAP').replace(/^PAP /,'')),E.length?`Priorité ${prioMoyIds(E.map(x=>x.i))}`:'',true);
  h+=`<div class="sum2"><span><b>${E.length}</b>adresse${E.length>1?'s':''}</span><span><b>${n0(portesDe(ins))}</b>portes environ</span><span><b>${n0(ins)}</b>inscrits</span></div>`;
  const fin=aValider(a);   /* v32 : programmé, puis à valider l'heure passée */
  h+=notesAvantHTML(E.map(x=>x.i),a.id);   /* v31 */
  h+=E.map((x,j)=>`<div class="lr">${avH('br',j+1)}<button class="tx" data-i="${x.i}"><b>${esc(D.adresses[x.i][2])}</b><small>${pl(D.adresses[x.i][3],'inscrit')}</small></button>${fin?pillH(ferm.has(x.k)?'kf':'k',`data-kf="${x.k}"`):'<span></span>'}</div>`).join('');
  /* v32 (JL, 21/11) : à valider, seulement « Valider » et « Annuler l'action » ; programmé, son jour et son heure, qu'on peut changer */
  if(!fin){h+=`<div class="encours"><b>Programmé</b> ${quandA(a)?'le '+quandP(quandA(a)):'sans date'} · ${esc(pourQui(a))}</div>`;
   if(chg)h+=`<div class="qtd"><div class="rw3"><input type="date" id="pqD" value="${nq.slice(0,10)}" aria-label="Jour"><input type="time" id="pqT" value="${nq.slice(11,16)}" aria-label="Heure"></div></div><button class="btn primary" id="pqOk" style="width:100%;margin-top:10px">Enregistrer le jour et l'heure</button>`;
   else h+=`<button class="lnk9" id="pqC">Changer le jour ou l'heure</button>`;}
  if(fin)h+=`<button class="btnf go2 stk" id="fini">${I.check} Valider</button>`;
  h+=`<button class="lnk9" id="annul">Annuler l'action</button>`;
  return h;},
 after:()=>{lierRows(true);const a=actPar(id);const v=$('vact');if(v)v.onclick=()=>detail(vueAction(id));if(a&&a.statut==='faite'){lierPortes(a);lierComVite(a,{cibles:[a]});}if(!a||a.statut==='faite')return;
  body.querySelectorAll('[data-kf]').forEach(b=>b.onclick=()=>{const k=+b.dataset.kf;if(ferm.has(k))ferm.delete(k);else ferm.add(k);render(true);});
  const pc=$('pqC');if(pc)pc.onclick=()=>{chg=true;nq=quandA(a).length>10?quandA(a):(quandA(a)||demain10().slice(0,10))+'T10:00';render(true);};
  const pd=$('pqD');if(pd)pd.onchange=()=>{if(pd.value)nq=pd.value+nq.slice(10);};const pt=$('pqT');if(pt)pt.onchange=()=>{if(pt.value)nq=nq.slice(0,11)+pt.value;};
  const po=$('pqOk');if(po)po.onclick=()=>{lancer(a,nq);saisie(a,'jour et heure du PAP');sauverA();chg=false;render(true);toast('PAP prévu le '+quandP(nq));};
  const fi=$('fini');if(fi)fi.onclick=()=>{sansToast();const avant=avance(),snap=photo([a]);finirPAP(a,ferm);saisie(a,'C\'est fait'+(ferm.size?` (${ferm.size} pas pu entrer)`:''));sauverA();dessinerParcours();vibrer();stack=[vueBase(),vueNote(a,avant,'',snap)];render();};
  $('annul').onclick=()=>{oterAction([a],'Action annulée : '+(a.nom||''));show(vueBase());};}};}
/* ---- v31 (15/11/2026, JL) : un commentaire facultatif à la validation, qu'on revoit la fois d'après (fiche de l'adresse,
   préparation d'un PAP, PAP en cours, fiche du lieu ou du pied d'immeuble) ; une case « À refaire bientôt » :
   PAP et équipes d'un pied d'immeuble : les adresses reviennent dans les propositions au bout de 30 jours, à pleine priorité ;
   tractage : le lieu passe en tête de sa liste, avec « À refaire », jusqu'à la prochaine diff */
const VITE_J=30,delaiVite=()=>Math.min(VITE_J,REF.reglages.delaiFaite);
const comDe=a=>!a?'':a.com||(a.groupe?((duGroupe(a.groupe).find(y=>y.type==='diff_pied')||{}).com||''):'');
const aRefaire=nom=>{const d=diffsDe(nom).filter(a=>!deListe(a))[0];return !!(d&&d.vite);};
function comViteHTML(o,sorte){const R=REF.reglages,tx=sorte==='diff'?'Le lieu passe en tête de sa liste, avec « À refaire », jusqu\'à la prochaine diff.'
  :`${sorte==='pied'?'Les adresses des équipes':'Les adresses'} reviennent dans les propositions au bout de ${delaiVite()} jours, à pleine priorité (sinon ${R.delaiFaite} jours, avec un quart de priorité en moins).`;
 return `<div class="pto cv"><h2>Commentaire <small>(facultatif)</small></h2><textarea class="mq-ta" id="com" rows="3" maxlength="500" aria-label="Commentaire" placeholder="Pour la prochaine fois : ce qui a marché, ce qui a bloqué…">${esc(o.com||'')}</textarea>
  <label class="ckb ckv"><input type="checkbox" id="vite"${o.vite?' checked':''}><span><b>À refaire bientôt</b><small>${tx}</small></span></label></div>`;}
/* pers : l'action à enregistrer tout de suite (écran « C'est noté ») et les actions qui prennent la case ; sinon, un formulaire enregistre à la fin */
function lierComVite(o,pers){const c=$('com'),v=$('vite');let t=0,dit=false;
 const enr=()=>{clearTimeout(t);if(!pers)return;if(!String(o.com||'').trim())delete o.com;if(!dit){saisie(o,'commentaire');dit=true;}sauverA();};
 if(c){c.oninput=()=>{o.com=c.value.slice(0,500);clearTimeout(t);if(pers)t=setTimeout(enr,700);};c.onchange=enr;}
 if(v)v.onchange=()=>{if(!pers){o.vite=v.checked;return;}(pers.cibles||[o]).forEach(y=>{if(v.checked)y.vite=1;else delete y.vite;});saisie(o,v.checked?'à refaire bientôt':'« à refaire bientôt » retiré');sauverA();};}
/* un formulaire : le commentaire et la case posés sur l'action (et, pour un pied d'immeuble, la case sur ses équipes) */
function poserComVite(a,o){const c=String(o.com||'').trim().slice(0,500);if(c)a.com=c;else delete a.com;
 const l=[a].concat(a.type==='diff_pied'&&a.groupe?duGroupe(a.groupe).filter(y=>y.type==='pap'):[]);l.forEach(y=>{if(o.vite)y.vite=1;else delete y.vite;});}
const comLigne=a=>{const c=comDe(a);return c?`<span class="pcom">« ${esc(c)} »</span>`:'';};
/* les commentaires des PAP d'avant sur ces adresses (un par PAP, ou un par pied d'immeuble), les plus récents d'abord */
function notesAvantHTML(ids,sauf){const vu=new Map();
 ids.forEach(i=>(PASS[AID(i)]||[]).forEach(p=>{const a=actPar(p.aid);if(!a||a.id===sauf)return;const c=comDe(a);if(!c)return;const k=a.groupe&&!a.com?'g:'+a.groupe:a.id;
  if(!vu.has(k))vu.set(k,{a,c,q:a.faite_le||p.q});}));
 const l=[...vu.values()].sort((x,y)=>String(y.q).localeCompare(String(x.q)));if(!l.length)return '';
 return `<div class="h3">Commentaires des PAP d'avant ici</div>`+l.slice(0,3).map(o=>`<div class="tl"><i></i><div><b>${esc(fmtJ(o.q))}${o.a.ga&&o.a.ga.length?' · '+esc(o.a.ga.map(gaNom).join(', ')):''}</b><span class="pcom">« ${esc(o.c)} »</span></div></div>`).join('')+(l.length>3?`<div class="hs">et ${pl(l.length-3,'autre commentaire','autres commentaires')}</div>`:'');}
/* le dernier commentaire d'un lieu de tractage (ou d'un pied d'immeuble), et « À refaire » */
function noteLieuHTML(l){const d=l.find(a=>a.com);if(!d)return '';
 return `<div class="pnote"><b>Dernier commentaire · ${esc(fmtJH(d.faite_le).replace(/^./,c=>c.toLowerCase()))}${d.ga&&d.ga.length?' · '+esc(d.ga.map(gaNom).join(', ')):''}</b><span class="pcom">« ${esc(d.com)} »</span></div>`;}
/* « C'est fait » d'une diff : « C'est noté », avec le commentaire et la case */
function vueNoteDiff(a,snap){const nom=a.etapes[0]?a.etapes[0].lieu.id:'';return {id:'note',aid:a.id,html:()=>{
  let h=`<div class="okb"><span>${I.check}</span></div><div class="ctr"><h1>Validé</h1><div class="sub">${esc(nom)} · ${esc(fmtJH(a.faite_le).replace(/^./,c=>c.toLowerCase()))}${a.ga.length?' · '+esc(a.ga.map(gaNom).join(', ')):''}</div></div>`;
  h+=comViteHTML(a,'diff')+`<button class="btnf" id="suite">${ONG==='cal'?'Retour au calendrier':'Revenir au lieu'}</button>`;
  if(snap)h+=`<button class="lnk9" id="nAnn">Défaire : ce n'était pas fini</button>`;
  return h;},after:()=>{lierComVite(a,{cibles:[a]});$('suite').onclick=()=>{if(ONG==='cal')show(vueBase());else back();};
  const n=$('nAnn');if(n)n.onclick=()=>{remettre(snap);if(ONG==='cal')show(vueBase());else back();toast('Défait : l\'action est de nouveau à valider');};}};}

/* ---- « C'est noté » : ce que l'action fait gagner à la circo */
/* v24 : une photo des actions avant « C'est fait », pour pouvoir annuler */
const photo=l=>l.map(a=>[a,JSON.stringify(a)]);
function remettre(snap){snap.forEach(([a,j])=>{const o=JSON.parse(j);Object.keys(a).forEach(k=>{if(!(k in o))delete a[k];});Object.assign(a,o);saisie(a,'« C\'est fait » annulé');});sauverA();dessinerParcours();}
function vueNote(a,avant,titre,snap){return {id:'note',html:()=>{const x=avance(),l=a.groupe?duGroupe(a.groupe).filter(y=>y.type==='pap'):[a];
  let nf=0,ins=0;l.forEach(y=>y.etapes.forEach(e=>{const i=idxE(e);if(i!=null&&e.st==='faite'){nf++;ins+=D.adresses[i][3];}}));
  const g=x.pct-avant.pct,sem=papsFaits().filter(y=>cetteSem(y.faite_le)&&(y.ga||[]).some(id=>(a.ga||[]).includes(id))).length;
  let h=`<div class="okb"><span>${I.check}</span></div><div class="ctr"><h1>Validé</h1><div class="sub">${esc(titre||(a.nom||'PAP').replace(/^PAP /,''))}${nf?` : ${pl(nf,'adresse faite','adresses faites')}, environ ${n0(portesDe(ins))} portes`:''}</div></div>`;
  const B=parBureau();h+=kpis([[n0(sem),sem>1?'PAP faits cette semaine par le GA':'PAP fait cette semaine par le GA'],[n0(x.nf),'adresses prioritaires faites'],[`${B.filter(o=>o.fi>0).length}/${B.length}`,'bureaux de vote commencés']]);
  h+=portesHTML(a)+comViteHTML(a,a.type==='diff_pied'?'pied':'pap');   /* v31 */
  h+=`<button class="btnf" id="suite">${ONG==='cal'?'Retour au calendrier':a.type==='diff_pied'?'Revenir aux pieds d\'immeuble':'Voir les propositions suivantes'}</button>`;
  if(snap)h+=`<button class="lnk9" id="nAnn">Défaire : ce n'était pas fini</button>`;
  return h;},after:()=>{lierPortes(a);lierComVite(a,{cibles:[a].concat(a.groupe?duGroupe(a.groupe).filter(y=>y.type==='pap'&&y!==a):[])});$('suite').onclick=()=>{if(ONG==='cal'){show(vueBase());return;}const m=a.type==='diff_pied'?'pieds':'pap';if(ONG!==m)setMode(m);else show(vueBase());};
  const n=$('nAnn');if(n)n.onclick=()=>{remettre(snap);toast('Défait : l\'action est de nouveau à valider');const s=a.type==='diff_pied'&&a.etapes[0]&&piedDe(a.etapes[0].lieu.id);stack=[vueBase()];if(s){if(ONG==='cal')detail(vuePied(s));else ouvrirPied(s);}else detail(vueEnCours(a.id));};}};}

/* ---- Suivi : avancement, en cours, par bureau de vote (liste et carte), toutes les adresses, outils */
let BZTOUT=false;
const BZCOL=[[0,'transparent'],[10,'#D9C8F0'],[25,'#A784DC'],[50,'#7537C2'],[101,'#4C0297']];
const bzCol=p=>p<=0?'transparent':p<10?BZCOL[1][1]:p<25?BZCOL[2][1]:p<50?BZCOL[3][1]:BZCOL[4][1];
function vueSuivi(){return {id:'base',html:()=>{const x=avance(),B=parBureau().sort((p,q)=>q.p-p.p||q.tot-p.tot);
  /* v18 : les outils (ancien passage, importer, télécharger) et toutes les actions en haut, avant la longue liste d'adresses */
  /* v19 (JL : « dans le Suivi, l'import doit être discret, en mode trois petits points ») */
  /* v22 (JL : « en web, la page est mal utilisée ») : sur ordinateur, deux colonnes, les chiffres et les bureaux à gauche,
     toutes les adresses à droite (classes pg2, pgh, pcl, pc2) ; au téléphone, rien ne change */
  let h=`<div class="pg2 suiv"><div class="pgh"><div class="csh"><h1>Bilan</h1><button class="ib dots" id="sPlus" aria-label="Ancien passage, importer, télécharger" aria-expanded="false"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button></div><div class="dmenu" id="sMenu" hidden>${qaHTML()}${lienCR()}</div></div><div class="pcl">`+chiffresHTML(x);   /* v32 (JL) : plus de part des inscrits en haut du Suivi */
  h+=faitHTML();   /* v32, 2e temps : le programmé est au Calendrier ; ici, tout ce qui a été fait */
  h+=`<h2>Par bureau de vote</h2><div class="sub" style="margin-bottom:4px">Part des inscrits prioritaires déjà faite.</div>`;
  const n=BZTOUT?B.length:Math.min(6,B.length);
  h+=B.slice(0,n).map(o=>`<button class="bz" data-bv="${esc(o.b)}"><span>${esc(o.b)}</span><span class="jb" style="display:block"><i style="width:${o.fi>0?Math.max(2,o.p):0}%;background:${bzCol(o.fi>0?Math.max(o.p,.1):0)}"></i></span><em>${Math.round(o.p)} %</em></button>`).join('');
  if(B.length>6)h+=`<button class="lnk9" id="bzT">${BZTOUT?'Moins de bureaux':`Voir les ${B.length} bureaux`}</button>`;
  h+=`<div class="legb">${[['moins de 10 %',1],['10 à 25 %',2],['25 à 50 %',3],['50 % et plus',4]].map(([t,k])=>`<span><i style="background:${BZCOL[k][1]}"></i>${t}</span>`).join('')}</div>`;
  h+=tractageHTML();
  h+=`</div><div class="pc2"><h2>Toutes les adresses</h2><label class="srch2">${I.loupe}<input id="lq" type="search" enterkeyhint="search" placeholder="Chercher une adresse ou une rue" value="${esc(LQT)}" autocomplete="off" aria-label="Chercher une adresse ou une rue"></label><div class="sgc t3" role="group" aria-label="Trier">${[['rue','Par rue'],['prio','Par priorité'],['ins','Par taille']].map(([k,x])=>`<button data-lo="${k}" aria-pressed="${LTRI===k}">${x}</button>`).join('')}</div><button class="chf" id="lfa" aria-pressed="${LFAITES}">${I.check} Faites seulement</button><div id="lres">${resHTML()}</div></div></div>`;
  return h;},
 after:()=>{lierFait();majCouches();
  const q=$('lq');let qT=0;q.oninput=()=>{LQT=q.value;clearTimeout(qT);qT=setTimeout(()=>{LQ=normA(LQT.trim());LN=LPAS;majRes(true);},150);};
  body.querySelectorAll('[data-lo]').forEach(b=>b.onclick=()=>{LTRI=b.dataset.lo;LS.set('ltri',LTRI);LN=LPAS;body.querySelectorAll('[data-lo]').forEach(x=>x.setAttribute('aria-pressed',x===b));majRes(true);});
  $('lfa').onclick=()=>{LFAITES=!LFAITES;LN=LPAS;$('lfa').setAttribute('aria-pressed',LFAITES);majRes(true);};
  $('lres').onclick=clicRes;lierQA();suite();
  body.querySelectorAll('[data-bv]').forEach(b=>b.onclick=()=>ouvrirBureau(b.dataset.bv,true));
  const t=$('bzT');if(t)t.onclick=()=>{BZTOUT=!BZTOUT;render(true);};lierTractage();
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
/* v32 : un pied d'immeuble programmé a ses équipes de PAP dès « Programmer » (groupe) ; ecPied le trouve (et ceux lancés avant la v32) ;
   pvPied : un pied prévu avant la v32, encore sans équipes : « Programmer » les fait */
const ecPied=s=>ACTIONS.find(a=>a.type==='diff_pied'&&a.statut==='a_faire'&&(a.encours||(a.plan&&a.groupe))&&a.etapes[0]&&a.etapes[0].lieu.id===s.nom);
const pvPied=s=>ACTIONS.find(a=>a.type==='diff_pied'&&a.statut==='a_faire'&&a.plan&&!a.groupe&&!a.encours&&a.etapes[0]&&a.etapes[0].lieu.id===s.nom);
function infoPied(s){const r=prioLieu([s.lat,s.lon],'pi',s.geo);return {s,v:r.t?r.v:0,fait:passPied(s.nom)[0],ec:ecPied(s),pv:pvPied(s)};}
function vuePieds(){return {id:'base',html:()=>{const S=(D.pieds||[]).map(infoPied).sort((x,y)=>y.v-x.v);
  /* v32, 2e temps : plus de cartes d'actions ici (Calendrier) ; une zone proposée, ou n'importe où sur la carte */
  let h=`<div class="tap1"><span class="ti">${I.pied}</span><span><b>${wide?'Cliquez sur':'Touchez'} une zone, ou n'importe où</b><small>l'appli place le stand et fait les équipes autour</small></span></div>`;
  if(!S.length)return h+`<div class="empty">Aucun secteur de pied d'immeuble dans cette circonscription.</div>`;
  h+=S.map((o,k)=>{const c=prioCol(o.v);return `<button class="sect" data-ps="${D.pieds.indexOf(o.s)}"><span class="pv" style="background:${c};color:${encreSur(c)}">${o.v}</span><span><b>${esc(o.s.nom)}</b>`+
   `<small class="s">Stand : ${esc(standTxt(o.s))}</small><small>${n0(o.s.ins)} inscrits prioritaires dans la zone</small>${o.ec?`<span class="tg ec">${aValider(o.ec)?'À valider':'Programmé le '+esc(quandP(quandA(o.ec)))}</span>`:o.pv?`<span class="tg ec">Programmé le ${esc(quandP(o.pv.prevue))}</span>`:o.fait?`<span class="tg">Fait le ${fmtJ(o.fait.faite_le)}</span>`:''}</span></button>`;}).join('');
  return h;},
 after:()=>{if(pfL){map.removeLayer(pfL);pfL=null;}majCouches();body.querySelectorAll('[data-ps]').forEach(b=>b.onclick=()=>ouvrirPied(D.pieds[+b.dataset.ps]));}};}
function ouvrirPied(s){if(!s)return;if(ONG!=='pieds')setMode('pieds');sel(null);if(!wide&&det==='peek')setDet('half');detail(vuePied(s));}
/* équipes de 2 qui partent de la tente, chacune dans sa direction, de proche en proche, avec de quoi tenir le temps choisi */
function equipes(ll,E,cible){if(!E)return [];const A=D.adresses,cosl=Math.cos(ll[0]*Math.PI/180),libre=new Set();
 A.forEach((a,i)=>{if(isPr(a)&&!recente(i)&&!pasEntreRecent(i)&&!PREV[a[2]]&&dist(ll,[a[1],a[0]])<=800)libre.add(i);});
 /* v23 : écart d'angle ramené entre 0 et 180° (au-delà d'un tour, une adresse comptait à tort dans le secteur d'une équipe) */
 const ang=p=>Math.atan2(p[0]-ll[0],(p[1]-ll[1])*cosl),ecart=(p,th)=>{let x=Math.abs(ang(p)-th)%(2*Math.PI);return x>Math.PI?2*Math.PI-x:x;};
 let best=0,bv=-1;for(let d=0;d<24;d++){const th=-Math.PI+d*Math.PI/12;let v=0;libre.forEach(i=>{const p=ptA(i);if(ecart(p,th)<Math.PI/E)v+=A[i][3]*poidsP(i)/(80+dist(ll,p));});if(v>bv){bv=v;best=th;}}
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
/* v24 : deux équipes n'ont plus le même nom (la 2e rue de l'équipe, sinon un numéro de plus) */
function nomsEq(T){const vu=new Set();T.forEach(e=>{const r=ruesDe(e.ids);let n=r[0]||'';if(vu.has(n))n=r.find(x=>!vu.has(x))||n+' (suite)';vu.add(n);e.rue=n;});}
function vuePied(s){let E=LS.get('pE',3),PM=LS.get('pM','h'),hh=LS.get('pH',2),pI=LS.get('pI',300),gaC=gaDefaut()[0]||((gaActifs()[0]||{}).id)||'',T=[];
 const pv0=pvPied(s);if(pv0&&pv0.ga&&pv0.ga[0])gaC=pv0.ga[0];const QT={q:pv0&&String(pv0.prevue).length>10?pv0.prevue:'',m:pv0&&String(pv0.prevue).length>10?1:0},QC={q:''};let chg=false;
 return {id:'pi',html:()=>{const o=infoPied(s),ec=o.ec,pv=o.pv;
  let h=headHTML(esc(s.nom),s.qpv&&s.qpv.length?esc(s.qpv.map(q=>q.nom).join(', ')):"Pied d'immeuble",true);
  h+=`<div class="pcs"><span class="prs" style="${prioStyle(o.v)}">Priorité ${o.v}/100</span>${ec&&aValider(ec)?'':ec?`<span class="pc pv"><i></i>Programmé · le ${esc(quandP(quandA(ec)))} · ${esc(pourQui(ec))}</span>`:pv?`<span class="pc pv"><i></i>Programmé le ${esc(quandP(pv.prevue))} · ${esc(pourQui(pv))}</span>`:o.fait&&!ec?`<span class="pc ok"><i></i>Fait le ${fmtJ(o.fait.faite_le)}</span>`:''}</div>`;
  h+=`<div class="sub" style="margin-top:10px;color:var(--ink);font-size:14px">Stand : <b>${esc(standTxt(s))}</b></div>`+noteLieuHTML(passPied(s.nom));   /* v31 */
  /* v26 : sans endroit vérifié, au pied des immeubles ; v28 (JL) : la phrase « Endroit vérifié sur photo » est retirée */
  if(s.poste&&!s.poste.verif&&s.poste.type!=='square')h+=`<div class="hint">Endroit repéré sur les plans : à confirmer sur place.</div>`;
  else if(!s.poste)h+=`<div class="hint">Pas encore d'endroit vérifié pour la tente : installez-vous au pied des immeubles, au cœur de la zone.</div>`;
  /* v28 (JL) : en cours, plus de cadre « En cours » ni de phrase sous « C'est fait » (la carte en haut de l'onglet le dit) */
  if(ec){const G=ec.groupe?duGroupe(ec.groupe).filter(a=>a.type==='pap'&&a.statut==='a_faire'):[];T=G.map(a=>({ids:a.etapes.map(idxE).filter(i=>i!=null)}));T.forEach(e=>{e.ins=e.ids.reduce((t,i)=>t+D.adresses[i][3],0);e.rue=ruesDe(e.ids)[0];});
   h+=`<h2>Qui fait quoi</h2><div class="eqx"><span class="av2 eqS">${I.pied}</span><div><b>Stand</b><small>${esc(standTxt(s))}</small></div></div>`;
   nomsEq(T);h+=G.map((a,k)=>`<button class="eqx bt" data-eqa="${a.id}"><span class="av2" ${eqSt(k)}>${k+1}</span><div><b>Équipe ${k+1} · ${esc(T[k].rue||'')}</b><small>${pl(T[k].ids.length,'adresse')} · environ ${n0(portesDe(T[k].ins))} portes · voir ses adresses</small></div><span class="cv">${I.next}</span></button>`).join('');
   const av=aValider(ec);   /* v32 : programmé, puis à valider (dit par la pastille du haut : v28, pas de cadre) */
   if(av){}   /* v32 (JL, 21/11) : à valider, seulement « Valider » et « Annuler l'action » */
   else if(chg){if(!QC.q){QC.q=quandA(ec).length>10?quandA(ec):maintenant();QC.m=1;}h+=tardHTML(QC)+`<button class="btn primary" id="pqOk" style="width:100%;margin-top:10px">Enregistrer le jour et l'heure</button>`;}
   else h+=`<button class="lnk9" id="pqC">Changer le jour ou l'heure</button>`;
   if(av)h+=`<button class="btnf go2 stk" id="pfini">${I.check} Valider</button>`;
   h+=`<button class="lnk9" id="pannul">Annuler l'action</button>`;
   return h;}
  const cible=PM==='i'?(E?pI/E:0):2*hh*PORTES_H*INS_PORTE;T=equipes(standLL(s),E,cible);
  h+=`<div class="tsz"><span>Équipes de 2 en PAP<small>et 2 personnes au stand</small></span><div class="stp"><button data-pe="-1" aria-label="Une équipe de moins">−</button><b>${E}<small>équipe${E>1?'s':''}</small></b><button data-pe="1" aria-label="Une équipe de plus">+</button></div></div>`;
  if(E){h+=`<div class="tsw"><span>Taille des PAP des équipes, selon</span>${segH('data-pm',[['h','Temps'],['i','Nombre d\'inscrits']],PM)}</div>`;
   h+=PM==='h'?`<div class="qq"><span>Pendant combien de temps ?</span>${segH('data-ph',DUREES,hh)}</div>`:`<div class="tsz"><span>Inscrits en tout<small>environ ${n0(portesDe(pI))} portes</small></span><div class="stp"><button data-pi="-1" aria-label="50 inscrits de moins">−</button><b>${n0(pI)}<small>inscrits</small></b><button data-pi="1" aria-label="50 inscrits de plus">+</button></div></div>`;}
  const pt=T.reduce((t,e)=>t+portesDe(e.ins),0),du=T.length?dureeTxt(pt/(2*PORTES_H*T.length)):'';
  h+=!E?`<div class="est">On tient le stand à <b>2</b>, sans PAP autour.</div>`:T.length?`<div class="est"><b>2</b> au stand et <b>${T.length} équipe${T.length>1?'s':''} de 2</b> en PAP : environ <b>${n0(pt)} portes</b>${PM==='i'?`, environ <b>${du}</b>`:''}.${T.length<E?` Pas assez d'adresses prioritaires libres pour ${E} équipes.`:''}</div>`:`<div class="est">Plus d'adresse prioritaire libre autour : on tient le stand.</div>`;
  h+=`<h2>Qui fait quoi</h2><div class="eqx"><span class="av2 eqS">${I.pied}</span><div><b>Stand</b><small>2 personnes · ${esc(standTxt(s))}</small></div></div>`;
  nomsEq(T);h+=T.map((e,k)=>`<div class="eqx"><span class="av2" ${eqSt(k)}>${k+1}</span><div><b>Équipe ${k+1} · ${esc(e.rue)}</b><small>${pl(e.ids.length,'adresse')} · environ ${n0(portesDe(e.ins))} portes · départ de la tente</small></div></div>`).join('');
  const G=gaActifs();
  h+=`<div class="pour"><label class="chs">${G.length?`<select id="pga" aria-label="Groupe d'action">${G.map(g=>`<option value="${g.id}"${g.id===gaC?' selected':''}>${esc(g.nom)}</option>`).join('')}</select>`:'Aucun GA'}${I.down}</label></div>`;
  h+=tardHTML(QT);
  h+=`<button class="btnf go2 stk" id="pgo" ${gaC?'':'disabled'}>Programmer</button>${gaC?'':SANS_GA}`;   /* v32, 2e temps : toujours en vue */
  if(pv)h+=`<button class="lnk9" id="pannul">Annuler l'action</button>`;
  return h;},
 after:()=>{dessinerPied(s,T);body.querySelectorAll('[data-eqa]').forEach(b=>b.onclick=()=>detail(vueEnCours(b.dataset.eqa)));
  body.querySelectorAll('[data-pe]').forEach(b=>b.onclick=()=>{E=Math.max(0,Math.min(10,E+(+b.dataset.pe)));LS.set('pE',E);render(true);});
  body.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>{PM=b.dataset.pm;LS.set('pM',PM);render(true);});
  body.querySelectorAll('[data-pi]').forEach(b=>b.onclick=()=>{pI=Math.max(50,Math.min(5000,pI+50*(+b.dataset.pi)));LS.set('pI',pI);render(true);});
  body.querySelectorAll('[data-ph]').forEach(b=>b.onclick=()=>{hh=+b.dataset.ph;LS.set('pH',hh);render(true);});
  const g=$('pga');if(g)g.onchange=()=>{gaC=g.value;};if(ecPied(s))lierTard(QC,()=>{});else lierTard(QT);
  /* v32 : « Programmer » : le pied d'immeuble et ses équipes de PAP, au jour et à l'heure de « Quand » ; retour à la liste */
  const go=$('pgo');if(go)go.onclick=()=>{if(!gaC)return;const pv=pvPied(s),snap=pv?photo([pv]):null,q=quandDe(QT),grp=uid();
   const st=pv||nouvelleAction('diff_pied',{origine:{lot:s.libre?'pied_libre':'pied'},etapes:[{lieu:Object.assign({t:'secteur',id:s.nom},s.libre?{lat:+s.lat.toFixed(6),lon:+s.lon.toFixed(6)}:{}),portes:0,toquees:0,ouvertes:0,st:'',acc:'',boites:0,le:''}]});
   Object.assign(st,{ga:[gaC],nb:2+2*T.length,groupe:grp});st.nom=`Pied d'immeuble ${s.nom}`;lancer(st,q);if(!pv)ACTIONS.push(st);saisie(st,'pied d\'immeuble programmé');
   T.forEach((e,k)=>{const a=nouvelleAction('pap',{ga:[gaC],nb:2,groupe:grp,origine:{lot:'pied',secteur:s.nom,equipe:k+1},etapes:e.ids.map(etapeAdr)});
    a.nom=`PAP ${e.rue} (équipe ${k+1}, ${s.nom})`;lancer(a,q);ACTIONS.push(a);saisie(a,'PAP programmé avec un pied d\'immeuble');});
   LS.set('dga',[gaC]);sauverA();dessinerParcours();vibrer();show(vueBase());
   toast(`Programmé : ${s.nom}, le ${quandP(q)}${T.length?' · '+pl(T.length,'équipe'):''}`,{t:'Défaire',fn:()=>{const eq=duGroupe(grp).filter(a=>a!==st);eq.forEach(oterSans);if(snap){remettre(snap);}else oterSans(st);dessinerParcours();render(true);}});};
  const pc=$('pqC');if(pc)pc.onclick=()=>{chg=true;QC.q='';render(true);};
  const po=$('pqOk');if(po)po.onclick=()=>{const ec=ecPied(s);if(!ec)return;const l=ec.groupe?duGroupe(ec.groupe).filter(a=>a.statut==='a_faire'):[ec];l.forEach(a=>{lancer(a,QC.q);saisie(a,'jour et heure du pied d\'immeuble');});
   sauverA();chg=false;render(true);toast('Programmé le '+quandP(QC.q));};
  const f=$('pfini');if(f)f.onclick=()=>{sansToast();const ec=ecPied(s);if(!ec)return;const avant=avance(),snap=photo(ec.groupe?duGroupe(ec.groupe):[ec]);finirPied(ec);sauverA();dessinerParcours();vibrer();
   stack=[vueBase(),vueNote(ec,avant,"Pied d'immeuble "+s.nom,snap)];render();};
  const an=$('pannul');if(an)an.onclick=()=>{const ec=ecPied(s)||pvPied(s);if(!ec)return;oterAction(ec.groupe?duGroupe(ec.groupe):[ec],'Action annulée : '+s.nom);if(ONG==='cal')show(vueBase());else render(true);};}};}

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
  const e=out.reduce((t,j)=>t+A[j][3]*A[j][5]/100*poidsP(j),0)/(km+40*out.length)*(s>=cible*.6?1:.01);
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
 if(VIS){if(!avant)VDET=det;const v=x.querySelector('.vcx'),pl=()=>{const p=map.latLngToContainerPoint(ptCible());v.style.left=p.x+'px';v.style.top=p.y+'px';};pl();setTimeout(pl,60);
  /* v23 : si la cible tombe hors de la circo (carte déplacée ou dézoomée), la carte vient d'elle-même sur la circo */
  setTimeout(()=>{if(!VIS)return;map.invalidateSize();const c=ptCible();if(dansCirco([c.lat,c.lng]))return;const z=coeurCirco(),a=map.latLngToContainerPoint(c),b=map.latLngToContainerPoint(z);map.panBy([b.x-a.x,b.y-a.y],{duration:.3});},90);}
 else if(avant&&!wide)setDet(VDET||'half');}
/* v19 : agrandir la carte (téléphone) : la liste descend, la carte prend l'écran ; une 2e touche la remet */
/* v23 : si la carte agrandie montre du vide autour du fond de la circo, elle se recadre sur la circo */
$('fBig').onclick=()=>{setDet(det==='peek'?'half':'peek');setTimeout(()=>{map.invalidateSize();recadrerSiVide();},320);};
const fondB=()=>{const b=D.bounds;return L.latLngBounds([b[0][0]-.004,b[0][1]-.004],[b[1][0]+.004,b[1][1]+.004]);};
function recadrerSiVide(){if(!D)return;if(!fondB().contains(map.getBounds()))map.flyToBounds(D.bounds,{...pad(),duration:.35});}
/* un point sûr de la circo : l'adresse la plus proche du milieu de son cadre */
function coeurCirco(){const m=L.latLngBounds(D.bounds).getCenter(),k=Math.cos(m.lat*Math.PI/180);let bi=0,bd=1e9;D.adresses.forEach((a,i)=>{const d=(a[1]-m.lat)**2+((a[0]-m.lng)*k)**2;if(d<bd){bd=d;bi=i;}});return L.latLng(D.adresses[bi][1],D.adresses[bi][0]);}
