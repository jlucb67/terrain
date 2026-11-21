const LT={'marché':'marche','station':'station','supermarché':'commerce','pied':'secteur','parcours':'parcours'};
const TDE={marche:'marché',commerce:'supermarché',station:'station',parcours:'parcours'},DLT={diff_marche:'marché',diff_metro:'station',diff_supermarche:'supermarché',diff_parcours:'parcours',diff_pied:'pied'};
const diffsDe=nom=>ACTIONS.filter(a=>a.type.startsWith('diff')&&a.statut==='faite'&&a.etapes[0]&&a.etapes[0].lieu.id===nom).sort((a,b)=>(toD(b.faite_le)-toD(a.faite_le))||(ACTIONS.indexOf(b)-ACTIONS.indexOf(a)));   /* v32 : à la même minute, la plus récente d'abord */
/* v28 (14/11/2026, JL) : une diff datée plus tard est prévue (statut « à faire », plan) ; elle entre dans le sondage de la
   semaine du GA ; l'heure passée, elle attend « C'est fait » (ou « On n'y va plus ») et ne compte qu'une fois validée */
const diffPrevue=a=>TYPES_TR.includes(a.type)&&a.statut==='a_faire'&&!!a.plan&&!!a.etapes[0];
const prevuesDe=nom=>ACTIONS.filter(a=>diffPrevue(a)&&a.etapes[0].lieu.id===nom).sort((a,b)=>String(a.prevue).localeCompare(String(b.prevue)));
const dueP=a=>!!a.prevue&&!futurQ(a.prevue.length>10?a.prevue:a.prevue+'T00:00');
/* v29 (14/11/2026, JL : « l'onglet Tractage, ça doit être comme pour le PAP : une action lancement, puis une action validation
   plus tard ; quand on a fait lancement, ça met l'action en cours puis ça l'ajoute dans le sondage » ; « métro, marché,
   déambulation, tout ») : sur la fiche d'un lieu, GA, « Maintenant » ou « Plus tard », « On y va » ; la diff est en cours
   (encours) ou prévue (plan) ; « C'est fait » la valide, au jour et à l'heure du lancement (ou de l'heure prévue) */
const diffEC=a=>TYPES_TR.includes(a.type)&&a.statut==='a_faire'&&!!a.encours&&!!a.etapes[0];
const ecDiff=nom=>ACTIONS.find(a=>diffEC(a)&&a.etapes[0].lieu.id===nom);
function diffFaite(a){const q=a.encours||(a.prevue&&a.prevue.length>10?a.prevue:'')||isoD(new Date());a.statut='faite';a.faite_le=q;a.prevue='';delete a.plan;delete a.encours;if(a.etapes[0])a.etapes[0].le=q;}
const etapeL=(k,nom)=>({lieu:{t:LT[k]||'marche',id:nom},portes:0,toquees:0,ouvertes:0,st:'',acc:'',boites:0,le:''});
const nomDiff=(a,nom)=>a.type==='diff_parcours'?nom:`${TYPES_C[a.type]} ${nom.replace(/^Marché /,'')}`;   /* v30 : « Déambulation · Rue … », sans doublon */
/* bloc de lancement d'une diff, sur la fiche d'un lieu (état gardé tant que la fiche du même lieu est ouverte) */
let LCH={nom:''};
const etatL=nom=>{if(LCH.nom!==nom)LCH={nom,tard:false,q:'',ga:gaDefaut()[0]||((gaActifs()[0]||{}).id)||''};return LCH;};
/* v30 (audit) : en cours, « Changer le GA ou l'heure » sans valider ; un marché prévu un jour sans marché est signalé ;
   sans GA dans la circo, on le dit */
const SANS_GA=`<div class="hint">Aucun groupe d'action dans cette circonscription : voyez avec un administrateur.</div>`;
/* v32 (21/11/2026, JL : « revoir toute la partie programmation du tractage avec date en premier ») : le GA et « Quand », le moment
   choisi en haut de l'onglet (TQ), puis « Programmer » ; une diff programmée dont l'heure est passée attend « Valider » ;
   « Annuler l'action » la retire ; plus de « en cours » */
const aValDe=nom=>ACTIONS.filter(a=>TYPES_TR.includes(a.type)&&a.statut==='a_faire'&&a.etapes[0]&&a.etapes[0].lieu.id===nom&&aValider(a)).sort((x,y)=>String(quandA(x)).localeCompare(String(quandA(y))))[0];
function lancerDiffHTML(nom){const ec=aValDe(nom),nt=noteLieuHTML(diffsDe(nom).filter(a=>!deListe(a)))+(aRefaire(nom)&&!ec?`<div class="pcs"><span class="pc ar"><i></i>À refaire</span></div>`:'');   /* v31 */
 if(ec)return nt+`<div class="pcs"><span class="pc pv"><i></i>À valider · le ${esc(quandP(quandA(ec)))} · ${esc(pourQui(ec))}</span></div><button class="btnf" id="dOk">${I.check} Valider</button><button class="lnk9" id="dMod">Changer le GA ou l'heure</button><button class="lnk9" id="dNon">Annuler l'action</button>`;
 const S=etatL(nom),G=gaActifs(),q=TQ.q||maintenant(),hors=D.marches.some(m=>m.nom===nom)&&!!q&&!seanceLe(nom,q);
 return nt+`<div class="pour"><label class="chs">${G.length?`<select id="tga" aria-label="Groupe d'action">${G.map(g=>`<option value="${g.id}"${g.id===S.ga?' selected':''}>${esc(g.nom)}</option>`).join('')}</select>`:'Aucun GA'}${I.down}</label></div>`+tardHTML(TQ)+
  (hors?`<div class="note">Le marché n'a pas lieu le ${JOURS[toD(q).getDay()]}. Vérifiez le jour.</div>`:'')+
  `<button class="btnf go2" id="dGo" ${S.ga?'':'disabled'}>Programmer${hors?' quand même':''}</button>${S.ga?'':SANS_GA}<button class="lnk9" id="dFait">Déjà fait ? Noter le passage</button>`;}
function lierLancerDiff(nom,t){const S=etatL(nom),k=TDE[t]||'marché';lierTard(TQ,()=>{majMoment();render(true);});
 const g=$('tga');if(g)g.onchange=()=>{S.ga=g.value;};
 const df=$('dFait');if(df)df.onclick=()=>detail(vueDiff(nom,k));
 const ok=$('dOk');if(ok)ok.onclick=()=>{const a=aValDe(nom);if(a)validerDiff(a.id);};
 const non=$('dNon');if(non)non.onclick=()=>{const a=aValDe(nom);if(!a)return;oterAction([a],'Action annulée : '+nom);render(true);};
 const md=$('dMod');if(md)md.onclick=()=>{const a=aValDe(nom);if(a)detail(vueDiff(nom,k,a.id));};
 /* « Programmer » : la diff au jour et à l'heure de « Quand » ; retour à la liste du tractage */
 const go=$('dGo');if(go)go.onclick=()=>{if(!S.ga)return;const q=quandDe(TQ);LS.set('dga',[S.ga]);
  const x=nouvelleAction(TYPE_DIFF[k],{statut:'a_faire',ga:[S.ga],nb:0,tracts:0,materiel:'',etapes:[etapeL(k,nom)]});lancer(x,q);x.nom=nomDiff(x,nom);
  ACTIONS.push(x);saisie(x,'diff programmée');sauverA();vibrer();show(vueBase());toast(`Programmé : ${nom}, le ${quandP(q)}`,{t:'Défaire',fn:()=>{oterSans(x);render(true);}});};}
/* retirer une action sans message (pour « Défaire ») */
function oterSans(a){const k=ACTIONS.indexOf(a);if(k>=0){ACTIONS.splice(k,1);sauverA();if(typeof dessinerParcours==='function')dessinerParcours();}}
const derniereDiff=nom=>{const d=diffsDe(nom)[0];return d?` · diff faite le ${fmtJ(d.faite_le)}`:'';};
function histoHTML(nom){const P=prevuesDe(nom),v=diffsDe(nom).filter(a=>!deListe(a));let h='';
 if(P.length)h+=`<h2>Diffs programmées ici</h2>`+P.map(a=>`<div class="row p"><button class="tx" data-hk="${a.id}"><b>${fmtJH(a.prevue)}</b><small>${esc(a.ga.map(gaNom).join(', ')||'sans GA')}${dueP(a)?' · à valider':''}</small></button>${dueP(a)?`<button class="addb" data-hf="${a.id}">Valider</button>`:`<button class="addb" data-hk="${a.id}">Modifier</button>`}</div>`).join('');
 if(v.length)h+=`<h2>Diffs faites ici</h2>`+v.map(a=>`<div class="row p"><button class="tx" data-hk="${a.id}"><b>${fmtJH(a.faite_le)}</b><small>${esc(a.ga.map(gaNom).join(', ')||'sans GA')}${a.vite?' · à refaire bientôt':''}</small>${comLigne(a)}</button><button class="addb" data-hk="${a.id}">Modifier</button></div>`).join('');   /* v31 */
 return h;}
const lierHisto=(nom,type)=>{body.querySelectorAll('[data-hk]').forEach(b=>b.onclick=()=>detail(vueDiff(nom,type,b.dataset.hk)));
 body.querySelectorAll('[data-hf]').forEach(b=>b.onclick=()=>validerDiff(b.dataset.hf));};
/* « C'est fait » d'une diff prévue : le passage compte au jour et à l'heure prévus (modifiable ensuite) */
/* v31 : puis « C'est noté », avec le commentaire et la case « À refaire bientôt » (« Annuler : ce n'était pas fini ») */
function validerDiff(id){const a=actPar(id);if(!a||a.statut!=='a_faire')return;const snap=photo([a]);diffFaite(a);saisie(a,'C\'est fait');sauverA();vibrer();sansToast();detail(vueNoteDiff(a,snap));}

/* ---------------- tractage (20/10/2026) : un moment (jour et heure, par défaut maintenant), quatre sortes de lieux,
   et pour chaque lieu la priorité du secteur, tirée des adresses alentour */
let TRI='monde',EXP={},PRC={};
/* v32 : le moment du tractage = « Quand » (jour et heure), en haut de l'onglet ; il sert aux lieux ouverts, à l'affluence et à « Programmer » */
const TQ={q:''};
const mom=()=>{const d=toD(TQ.q||maintenant())||new Date();return {d:d.getDay(),h:d.getHours()};};
const JAF=d=>(d+6)%7;                                   /* indice des tableaux d'affluence : lundi = 0 */
const JTYPE=d=>d===0?'dim':d===6?'sam':'sem';
const JCOURT=['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'];
const hTxt=h=>`de ${h} h à ${(h+1)%24} h`;
/* supermarchés et secteurs : affluence 0-100, relative au moment le plus chargé de la semaine ; null = fermé ou inconnu */
const affAt=(s,m)=>s.af?s.af[JAF(m.d)][m.h]:null;
/* stations : entrées moyennes dans l'heure, selon le type de jour (semaine, samedi, dimanche) */
const totJ=(s,t)=>t==='sam'?(s.jsa||s.jour||0):t==='dim'?(s.jdi||s.jour||0):(s.jour||0);
const entreesM=(s,m)=>{const t=JTYPE(m.d),v=(s[t]||[])[m.h]||0;return totJ(s,t)*v/100;};
const ouvertM=(s,m)=>seances(s).find(x=>x.d===m.d&&x.h0<m.h+1&&x.h1>m.h);
/* priorité d'un lieu (25/10/2026, JL : « ils doivent se baser sur les adresses prio autour, dans la zone de chalandise ») :
   priorité moyenne, de 0 à 100, des adresses de sa zone de chalandise, pondérée par leurs inscrits ; ne dépend pas des
   curseurs. Zone de chalandise : le secteur lui-même pour un pied d'immeuble ; sinon un cercle autour du lieu (marché 500 m,
   station 400 m, supermarché 300 m : réglages, pas des mesures) */
const RCH={ma:500,me:400,su:300};
function dansPoly(x,y,geo){const P=geo.type==='MultiPolygon'?geo.coordinates:[geo.coordinates];let dd=false;
 for(const poly of P){const r=poly[0];let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const [xi,yi]=r[i],[xj,yj]=r[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}if(c){dd=true;break;}}return dd;}
function prioSect(ll,k,geo){k=k||'su';const key=k+','+ll[0].toFixed(5)+','+ll[1].toFixed(5);if(PRC[key])return PRC[key];
 let t=0,p=0;const c=Math.cos(ll[0]*Math.PI/180),R=RCH[k]||300;let bb=null;
 if(geo){bb=[1e9,1e9,-1e9,-1e9];(geo.type==='MultiPolygon'?geo.coordinates:[geo.coordinates]).forEach(po=>po[0].forEach(([x,y])=>{bb[0]=Math.min(bb[0],x);bb[1]=Math.min(bb[1],y);bb[2]=Math.max(bb[2],x);bb[3]=Math.max(bb[3],y);}));}
 for(const a of D.adresses){if(a[5]==null)continue;
  if(geo){if(a[0]<bb[0]||a[0]>bb[2]||a[1]<bb[1]||a[1]>bb[3]||!dansPoly(a[0],a[1],geo))continue;}
  else{const dx=(a[0]-ll[1])*111320*c,dy=(a[1]-ll[0])*110540;if(dx*dx+dy*dy>R*R)continue;}
  t+=a[3];p+=a[3]*a[5];}
 return PRC[key]={t,v:t?Math.round(p/t):0};}
/* magasins à petits prix (JL, 25/10/2026 : « les Aldi, Lidl et autres magasins pas chers, c'est prioritaire ») : priorité
   100 d'office, en tête des magasins quel que soit le tri */
const PETITS=/^(aldi|lidl|paris ?store|tang fr[eè]res|action|gifi)\b/i,petitPrix=s=>!!s&&PETITS.test(s.ens||s.nom||'');
const prioLieu=(ll,k,geo,s)=>k==='su'&&petitPrix(s)?{t:1,v:100}:prioSect(ll,k,geo);
function prHTML(ll,k,geo,s){const r=prioLieu(ll,k,geo,s);if(!r.t)return '';return `<span class="prs" style="${prioStyle(r.v)}">Priorité ${r.v}/100</span>`;}
function prPhrase(ll,k,geo,s){const r=prioLieu(ll,k,geo,s);return r.t?`<div style="margin-top:10px">${prHTML(ll,k,geo,s)}</div>`:'';}
const nomSup=s=>(s.ens||s.nom)+', '+s.adr;

/* lieux classés pour le moment choisi : v = monde attendu (sert au tri), info = ce qu'on en dit */
function lieuxTract(m){const out={ma:[],su:[],me:[],pi:[]};
 const fin=(o,ll)=>{o.pr=prioLieu(ll,o.k,o.k==='pi'?o.s.geo:null,o.s).v;return o;};
 if(chips.tMa)D.marches.forEach((s,i)=>{const x=ouvertM(s,m);out.ma.push(fin({k:'ma',i,s,nom:s.nom,v:x?100:0,
   info:x?`<span class="acc">Ouvert jusqu'à ${x.fin}</span>`:`Fermé · ${joursMarche(s)}`},[s.lat,s.lon]));});
 if(chips.tSu)(D.supers||[]).filter(s=>s.dedans).forEach((s,i)=>{const a=affAt(s,m);out.su.push(fin({k:'su',i:D.supers.indexOf(s),s,nom:s.ens||s.nom,v:a==null?-1:a,
   info:!s.af?esc(s.adr):a==null||a===0?'Fermé':`Affluence <span class="acc">${a} %</span>`},[s.lat,s.lon]));});
 if(chips.tMe)D.metro.forEach((s,i)=>{const e=entreesM(s,m),lim=!dansCirco([s.lat,s.lon]);out.me.push(fin({k:'me',i,s,nom:s.nom,v:e,lim,
   info:`${n0(e)} voyageurs entrent dans l'heure`},[s.lat,s.lon]));});
 if(chips.tPi)(D.pieds||[]).forEach((s,i)=>{const a=affAt(s,m);out.pi.push(fin({k:'pi',i,s,nom:s.nom,v:a==null?-1:a,
   info:`${n0(s.ls)} logements sociaux${a!=null?` · animation <span class="acc">${a} %</span>`:''}`},[s.lat,s.lon]));});
 /* pieds d'immeuble : le monde attendu (indicateur indirect) pondéré par la priorité du secteur */
 out.pi.forEach(o=>{if(o.v>=0)o.v=(o.pr+1)*o.v;});
 const tri=TRI==='prio'?(x,y)=>y.pr-x.pr||y.v-x.v:(x,y)=>y.v-x.v||y.pr-x.pr;
 Object.values(out).forEach(l=>l.sort(tri));out.su.sort((x,y)=>petitPrix(y.s)-petitPrix(x.s));
 /* v24 (revue) : les lieux fermés au moment choisi passent après les lieux ouverts (les magasins à petits prix restent en tête des ouverts) */
 const ferme=o=>(o.k==='ma'&&o.v<=0)||(o.k==='su'&&o.s.af&&o.v<=0)?1:0;
 /* v32 (JL : « ne pas montrer les fermés ») : les marchés et magasins fermés au moment choisi ne sont plus listés */
 Object.keys(out).forEach(k=>{out[k]=out[k].filter(o=>!ferme(o));});
 /* v31 (JL) : un lieu coché « À refaire bientôt » passe en tête de sa liste (après les lieux ouverts), jusqu'à la prochaine diff */
 const ar=o=>o.k!=='pi'&&aRefaire(o.k==='su'?nomSup(o.s):o.s.nom)?1:0;Object.values(out).forEach(l=>{l.forEach(o=>{o.ar=ar(o);});l.sort((x,y)=>ferme(x)-ferme(y)||y.ar-x.ar);});return out;}
/* v28 : les diffs prévues, la plus proche d'abord, en haut de l'onglet Tractage */
const diffsPrevues=()=>ACTIONS.filter(a=>diffEC(a)||diffPrevue(a)).sort((x,y)=>(aValider(y)-aValider(x))||String(quandA(x)).localeCompare(String(quandA(y))));   /* v32 : à valider d'abord */
/* v16 (31/10/2026) : les pieds d'immeuble ont leur onglet ; ils ne sont plus dans le tractage */
const SECT=[['ma','Marchés',"marchés"],['su','Magasins',"magasins"],['me','Métro',"stations"]];
function rowTract(o){const ll=[o.s.lat,o.s.lon];
 const nm=o.k==='su'?nomSup(o.s):o.s.nom,eq=o.k!=='pi'&&eqDe(nm);
 const av=o.k!=='pi'&&aValDe(nm),pv=o.k!=='pi'&&!av&&prevuesDe(nm)[0],df=o.k!=='pi'&&diffsDe(nm)[0];   /* v30 : « Prévu le … », « fait le … » ; v32 : « À valider », « Programmé le … » */
 const right=o.k==='pi'?pillH(etatPied(o.s).k,`data-tp="${o.i}"`):av?`<span class="eqp">À valider</span>`:pv?`<span class="eqp">Programmé le ${esc(quandP(pv.prevue))}</span>`:o.ar?`<span class="eqp ar">À refaire</span>`:eq?`<span class="eqp">${esc(eqTxt(eq))}</span>`:'';   /* v29 : « En cours » ; v31 : « À refaire » */
 return `<div class="row p"><button class="tx${TRI==='monde'&&(o.k==='ma'||(o.k==='su'&&o.s.af))&&o.v<=0?' dim':''}" data-tl="${o.k}:${o.i}"><b>${esc(o.nom)}${o.lim?' <span class="lim">limite de circo</span>':''}</b>${o.sub?`<small>${o.sub}</small>`:''}<small>${o.info}${df?` · fait le ${fmtJ(df.faite_le)}`:''}</small>${prHTML(ll,o.k,o.k==='pi'?o.s.geo:null,o.s)}</button>${right}</div>`;}
function momHTML(m){const auj=new Date().getDay();
 return `<div class="mom" role="group" aria-label="Moment"><div class="jr">${[1,2,3,4,5,6,0].map(d=>`<button data-mj="${d}" aria-pressed="${m.d===d}"${d===auj?' class="auj"':''}>${JCOURT[d].replace('.','')}</button>`).join('')}</div>
  <div class="hr"><button data-mh="-1" aria-label="Une heure plus tôt">−</button><b>${m.h} h à ${(m.h+1)%24} h</b><button data-mh="1" aria-label="Une heure plus tard">+</button><button class="now" data-mj="now" aria-pressed="${!MOM}">Maintenant</button></div></div>`;}
/* v18 (01/11/2026, JL : « des mini-onglets à l'intérieur du tractage pour choisir entre métro, magasin, déambulation ») :
   une sorte de lieu à la fois, sur la carte et dans la liste ; les marchés gardent leur onglet */
let TT=LS.get('ttab','su');
const TTAB=[['su','Magasins'],['me','Métro'],['ma','Marchés'],['pa','Déambulation']];
function appliquerTT(){chips.tSu=TT==='su';chips.tMe=TT==='me';chips.tMa=TT==='ma';if(TT==='pa')EXP.pc=true;if(D){lieux();noms();majBulles();majMoment();}}
function vueTractage(){return {id:'base',html:()=>{chips.tSu=TT==='su';chips.tMe=TT==='me';chips.tMa=TT==='ma';const m=mom(),L_=lieuxTract(m);
  /* v30 (audit) : toutes les diffs en cours, puis les 3 prévues les plus proches ; le reste, d'une touche, dans le Suivi */
  const DP=diffsPrevues(),EC=DP.filter(aValider),PV=DP.filter(a=>!aValider(a));let h=headHTML('Tractage','');
  /* v32 : « Quand » d'abord (jour et heure), puis la sorte de lieu ; seuls les lieux ouverts à ce moment sont listés */
  h+=tardHTML(TQ);
  h+=EC.concat(PV.slice(0,3)).map(carteEC).join('')+voirSuivi(PV.length-3,'autre diff programmée','autres diffs programmées');
  h+=`<div class="seg tt" role="group" aria-label="Sorte de lieu">${TTAB.map(([k,t])=>`<button data-tt="${k}" aria-pressed="${TT===k}">${t}</button>`).join('')}</div>`;
  h+=`<div class="seg" role="group" aria-label="Tri">${[['monde','Plus de monde'],['prio','Plus prioritaires']].map(([k,t])=>`<button data-tri="${k}" aria-pressed="${TRI===k}">${t}</button>`).join('')}</div>`;
  if(TT==='pa')h+=parcHTML()||`<div class="empty">Pas de déambulation proposée dans cette circonscription.</div>`;
  let vide=TT!=='pa';
  if(TT!=='pa')SECT.forEach(([k,t,u])=>{const l=L_[k];if(!l.length)return;vide=false;const n=EXP[k]?l.length:Math.min(4,l.length);
   h+=`<div class="tsec"><h2>${t}</h2>${l.length>4?`<button class="more" data-ex="${k}">${EXP[k]?'Moins':`Voir les ${l.length}`}</button>`:''}</div>`+l.slice(0,n).map(rowTract).join('');});
  if(vide)h+=`<div class="empty">Aucun lieu de cette sorte ouvert à ce moment.</div>`;
  h+=lienCR();
  return h;},
 after:()=>{appliquerTT();lierEC();body.querySelectorAll('[data-tt]').forEach(b=>b.onclick=()=>{TT=b.dataset.tt;LS.set('ttab',TT);if(TT==='pa')EXP.pc=true;effParc();render(true);});
  lierTard(TQ,()=>{majMoment();render(true);});
  body.querySelectorAll('[data-tri]').forEach(b=>b.onclick=()=>{TRI=b.dataset.tri;render(true);});
  body.querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>{EXP[b.dataset.ex]=!EXP[b.dataset.ex];render(true);});
  body.querySelectorAll('[data-tl]').forEach(b=>b.onclick=()=>{const [k,i]=b.dataset.tl.split(':');ouvrirLieu(k,+i);});
  body.querySelectorAll('[data-tp]').forEach(b=>b.onclick=()=>basculerPied(+b.dataset.tp));lierParc();}};}
function ouvrirLieu(k,i){if(k==='ma')ouvrirMarche(D.marches[i]);else if(k==='su')ouvrirMagasin(D.supers[i]);else if(k==='me')ouvrirStation(D.metro[i]);else ouvrirPied(D.pieds[i]);}
function diffLieu(k,i){if(k==='ma')detail(vueDiff(D.marches[i].nom,'marché'));else if(k==='su')detail(vueDiff(nomSup(D.supers[i]),'supermarché'));else if(k==='me')detail(vueDiff(D.metro[i].nom,'station'));else detail(vueDiff(D.pieds[i].nom,'pied'));}
/* sur la carte : les lieux sans monde au moment choisi s'estompent ; autour des stations, un cercle dit les entrées */
function majMoment(){if(!D)return;const t=mode==='tractage',m=mom();
 const op=(mk,on)=>{const e=mk&&mk.getElement&&mk.getElement();if(e)e.style.opacity=on?'':'.35';};
 D.marches.forEach(s=>op(s._m,!t||!!ouvertM(s,m)));
 (D.supers||[]).forEach(s=>{const a=affAt(s,m);op(s._m,!t||!s.af||(a!=null&&a>0));});
 (D.pieds||[]).forEach(s=>{const a=affAt(s,m);if(s._g)s._g.setStyle({fillOpacity:t&&a!=null?.05+.25*a/100:.1});});
 majBulles();}

/* ---------------- marchés */
function seances(s){const out=[];s.horaires.forEach(t=>{const m=/^(.*?)\s*:\s*de\s*(\d+)\s*h\s*(\d*)\s*à\s*(\d+)\s*h\s*(\d*)/.exec(t);if(!m)return;
 m[1].split(/\s*,\s*|\s+et\s+/).forEach(j=>{const d=JOURS.indexOf(j.trim().toLowerCase());if(d>=0)out.push({d,h0:+m[2]+(+m[3]||0)/60,h1:+m[4]+(+m[5]||0)/60,deb:`${m[2]} h${m[3]?' '+m[3]:''}`,fin:`${m[4]} h${m[5]?' '+m[5]:''}`});});});return out;}
function prochaine(s){const now=new Date(),dn=now.getDay(),hn=now.getHours()+now.getMinutes()/60;let best=null;
 seances(s).forEach(x=>{let dd=(x.d-dn+7)%7;if(dd===0&&hn>=x.h1)dd=7;const ouvert=dd===0&&hn>=x.h0&&hn<x.h1;const t=ouvert?0:dd*24+x.h0-(dd===0?hn:0);
  if(!best||t<best.t)best={t,dd,ouvert,x};});return best;}
function quand(b){if(!b)return 'Horaires inconnus';if(b.ouvert)return `Ouvert maintenant, jusqu'à ${b.x.fin}`;
 const j=b.dd===0?'Aujourd\'hui':b.dd===1?'Demain':cap(JOURS[b.x.d]);return `${j}, de ${b.x.deb} à ${b.x.fin}`;}
const JC=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
const joursMarche=s=>{const d=[...new Set(seances(s).map(x=>x.d))].sort((a,b)=>((a+6)%7)-((b+6)%7));return d.length?cap(d.map(x=>JC[x]).join(d.length>2?', ':' et ')).replace(/, ([^,]+)$/,' et $1'):'';};
const seanceLe=(nom,q)=>{const s=D.marches.find(m=>m.nom===nom);if(!s)return true;const d=toD(q);return !d||seances(s).some(x=>x.d===d.getDay());};
function procheStation(ll){let b=null,bd=1e9;D.metro.forEach(s=>{const d=dist(ll,[s.lat,s.lon]);if(d<bd){bd=d;b=s;}});return b?{s:b,d:bd}:null;}
function ouvrirMarche(s){sel(null);if(det==='peek')setDet('half');voir([s.lat,s.lon],Math.max(map.getZoom(),15.5));const st=procheStation([s.lat,s.lon]);
 detail({id:'ma',html:()=>headHTML(esc(s.nom),quand(prochaine(s)),true)+prPhrase([s.lat,s.lon],'ma')+`<div class="zdef" style="margin-top:10px">${esc(s.lieu)}</div><h2>Jours et horaires</h2><ul class="hours">${s.horaires.map(x=>`<li>${esc(cap(x))}</li>`).join('')}</ul>`+
  (st?`<div class="sub" style="margin-top:12px">Métro : <b>${esc(st.s.nom)}</b>, ${Math.round(st.d/10)*10} m</div>`:'')+equipeHTML(s.nom,ordJ([...new Set(seances(s).map(x=>x.d))]))+histoHTML(s.nom),
  after:()=>{lierEquipe(s.nom,'marche');lierHisto(s.nom,'marché');}});}

/* ---------------- graphiques heure par heure (6 h à 23 h) */
const HEURES=[...Array(18)].map((_,i)=>i+6);
function chartH(v,hSel,lab){v=v||[];const w=320,hh=80,bw=w/HEURES.length,vals=HEURES.map(h=>v[h]||0),mx=Math.max(...vals,1),top=HEURES.slice().sort((x,y)=>(v[y]||0)-(v[x]||0)).slice(0,3);
 let s=`<svg viewBox="0 0 ${w} ${hh+18}" role="img" aria-label="${lab||'Heure par heure'}">`;
 HEURES.forEach((h,i)=>{const y=hh*(v[h]||0)/mx;s+=`<rect x="${i*bw+2.5}" y="${hh-y}" width="${bw-5}" height="${Math.max(1,y)}" rx="1.5" style="fill:${h===hSel?'var(--cta)':top.includes(h)&&(v[h]||0)>0?'var(--accent)':'var(--line2)'}"></rect>`;});
 s+=`<line x1="0" x2="${w}" y1="${hh+.5}" y2="${hh+.5}" style="stroke:var(--line2);stroke-width:1"></line>`;
 [6,9,12,15,18,21].forEach(h=>{s+=`<text x="${(h-6+.5)*bw}" y="${hh+14}" text-anchor="middle" style="fill:var(--quiet);font:400 10px var(--f)">${h} h</text>`;});
 return s+'</svg>';}
const pointes=(v,fmt)=>HEURES.filter(h=>(v[h]||0)>0).sort((x,y)=>v[y]-v[x]).slice(0,3).sort((x,y)=>x-y).map(h=>`<b>${h} h</b>${fmt?` (${fmt(v[h])})`:''}`).join(', ');
const pointesTxt=v=>HEURES.slice().sort((x,y)=>v[y]-v[x]).slice(0,2).sort((x,y)=>x-y).map(h=>`${h} h`).join(' et ');
/* sélecteur de jour d'une fiche (lundi à dimanche) */
const jourSegHTML=d=>`<div class="seg" role="group" aria-label="Jour">${[1,2,3,4,5,6,0].map(x=>`<button data-fj="${x}" aria-pressed="${d===x}">${JCOURT[x].replace('.','')}</button>`).join('')}</div>`;
function picSemaine(af){let b=null;af.forEach((r,j)=>r.forEach((v,h)=>{if(v!=null&&(!b||v>b.v))b={v,j,h};}));return b?`${JOURS[(b.j+1)%7]} vers ${b.h} h`:'';}

/* ---------------- magasins : affluence heure par heure, jour par jour (relevé Google ; inconnue pour ceux de l'Apur) */
function ouvrirMagasin(s){sel(null);if(det==='peek')setDet('half');voir([s.lat,s.lon],Math.max(map.getZoom(),16));const nom=nomSup(s);let jd=mom().d;
 detail({id:'mg',html:()=>{let h=headHTML(esc(s.ens||s.nom),esc(s.adr),true)+prPhrase([s.lat,s.lon],'su',null,s);
  h+=equipeHTML(nom,[1,2,3,4,5,6,0]);
  if(s.af){const v=s.af[JAF(jd)],ou=v.some(x=>x>0);
   h+=`<h2>Affluence</h2>${jourSegHTML(jd)}`+(ou?`<div class="chart">${chartH(v,jd===mom().d?mom().h:-1,'Affluence par heure')}</div><div class="peak">Le plus de monde : ${pointes(v)}</div>`:`<div class="empty">Fermé ce jour-là.</div>`);}
  else h+=`<div class="hint">Affluence inconnue${s.src==='apur2023'?' : magasin absent du relevé Google, repris de la base des commerces de l\'Apur (2023)':''}.</div>`;
  return h+histoHTML(nom);},
  after:()=>{lierEquipe(nom,'commerce');lierHisto(nom,'supermarché');body.querySelectorAll('[data-fj]').forEach(b=>b.onclick=()=>{jd=+b.dataset.fj;render(true);});}});}

/* ---------------- stations */
const typeJour=d=>JTYPE(d.getDay());
const entreesH=(s,h,d)=>entreesM(s,{d:(d||new Date()).getDay(),h});
function majBulles(){colorerLieux();if(!bulles)return;bulles.clearLayers();if(mode!=='tractage'||!chips.tMe){if(map.hasLayer(bulles))map.removeLayer(bulles);return;}
 const m=mom(),vals=D.metro.map(s=>entreesM(s,m)),mx=Math.max(...D.metro.map(s=>Math.max(...HEURES.map(h=>entreesM(s,{d:m.d,h})))),1),ac=tok('--accent');
 D.metro.forEach((s,k)=>{const r=4+22*Math.sqrt(vals[k]/mx);L.circleMarker([s.lat,s.lon],{renderer:rA,radius:r,color:ac,weight:1.2,opacity:.9,fillColor:ac,fillOpacity:.16}).on('click',()=>ouvrirStation(s)).addTo(bulles);});
 if(!map.hasLayer(bulles))bulles.addTo(map);}
const lignesHTML=s=>`<span class="lines s">${s.lignes.map(l=>{const c=LIGNE[l]||['#888','#fff'];return `<span class="ln" style="background:${c[0]};color:${c[1]}">${esc(l)}</span>`;}).join('')}</span>`;
function ouvrirStation(s){sel(null);if(det==='peek')setDet('half');voir([s.lat,s.lon],Math.max(map.getZoom(),15.5));let jd=mom().d;
 detail({id:'st',html:()=>{const t=JTYPE(jd),tot=totJ(s,t),v=(s[t]||[]).map(x=>tot*x/100);
  let h=headHTML(esc(s.nom),tot?`${n0(tot)} entrées par jour${t==='sem'?' en semaine':t==='sam'?' le samedi':' le dimanche'}`:'Station',true);
  h+=`<div class="lines">${s.lignes.map(l=>{const c=LIGNE[l]||['#888','#fff'];return `<span class="ln" style="background:${c[0]};color:${c[1]}">${esc(l)}</span>`;}).join('')}</div>`;
  if(!dansCirco([s.lat,s.lon]))h+=`<div class="sub" style="margin-top:8px"><span class="lim">limite de circo</span></div>`;
  h+=prPhrase([s.lat,s.lon],'me');
  h+=equipeHTML(s.nom,[1,2,3,4,5,6,0]);
  if(tot){h+=`<h2>Entrées par heure</h2>${jourSegHTML(jd)}<div class="chart">${chartH(v,jd===mom().d?mom().h:-1,'Entrées par heure')}</div><div class="peak">Le plus de monde : ${pointes(v)}</div>`;}
  h+=histoHTML(s.nom);
  return h;},after:()=>{body.querySelectorAll('[data-fj]').forEach(b=>b.onclick=()=>{jd=+b.dataset.fj;render(true);});lierEquipe(s.nom,'station');lierHisto(s.nom,'station');}});}

/* ---------------- pieds d'immeuble : secteurs de quartiers prioritaires, de logement social ou d'adresses prioritaires */
function ouvrirPiedV15(s){sel(null);if(det==='peek')setDet('half');try{map.flyToBounds(s._g.getBounds(),{...pad(),maxZoom:17,duration:.4});}catch(e){voir([s.lat,s.lon],16.5);}let jd=mom().d;
 detail({id:'pi',html:()=>{let h=headHTML(esc(s.nom),s.qpv.length?esc(s.qpv.map(q=>q.nom).join(', ')):"Pied d'immeuble",true);
  const tg=[];if(s.qpv.length)tg.push('Quartier prioritaire');if(s.crit.ls)tg.push('Logement social');if(s.crit.prio)tg.push('Adresses prioritaires');
  h+=`<div class="tags">${tg.map(t=>`<span>${t}</span>`).join('')}</div>`;
  h+=prPhrase([s.lat,s.lon],'pi',s.geo);
  h+=kpis([[n0(s.hab),'habitants'],[n0(s.ls),'logements sociaux'],[n0(s.ins),'inscrits']]);
  const j=D.pieds.indexOf(s);h+=semPiedHTML(j);
  h+=`<h2>Où se poster</h2>`+(s.places.length?s.places.slice(0,3).map((p,k)=>`<div class="row p"><button class="tx" data-pl="${k}"><b>Square, ${esc(p.rue[0].toLowerCase()+p.rue.slice(1))}</b><small>${n0(p.m2)} m²</small></button></div>`).join(''):`<div class="hint">Pas de square : au pied des immeubles.</div>`);
  if(s.af){const v=s.af[JAF(jd)];h+=`<h2>Quand y aller</h2>${jourSegHTML(jd)}<div class="chart">${chartH(v,jd===mom().d?mom().h:-1,'Animation du quartier par heure')}</div><div class="peak">Le plus de monde : ${pointes(v)}</div><div class="hint">D'après l'affluence des supermarchés proches.</div>`;}
  if(s.metro)h+=`<div class="sub" style="margin-top:12px">Métro : <b>${esc(s.metro.nom)}</b>, ${n0(s.metro.d)} m</div>`;
  return h+histoHTML(s.nom);},
  after:()=>{const pv=$('pdv');if(pv)pv.onclick=()=>basculerPied(D.pieds.indexOf(s));lierHisto(s.nom,'pied');body.querySelectorAll('[data-fj]').forEach(b=>b.onclick=()=>{jd=+b.dataset.fj;render(true);});
   body.querySelectorAll('[data-pl]').forEach(b=>b.onclick=()=>{const p=s.places[+b.dataset.pl];voir([p.lat,p.lon],18);});}});}

/* compte rendu de diff : une action faite en direct. v27 (14/11/2026, JL : « pas besoin du nombre de tracts, juste mettre jour et
   heure de passage » ; « pas besoin de plusieurs campagnes ») : le jour, l'heure et le GA, rien d'autre */
function vueDiff(nom,type,aid){const e=aid?actPar(aid):null;const rep=null;   /* v32 (JL) : plus de brouillon */
 const d0=nouvelleAction(TYPE_DIFF[type]||'diff_marche'),prv=e&&e.statut==='a_faire',CV={com:e&&e.com||'',vite:!!(e&&e.vite)};   /* v31 */
 let q=e?(prv?(quandA(e).length>10?quandA(e):maintenant()):e.faite_le):isoD(new Date()),ga=e?e.ga.slice():(LS.get('dga',null)||d0.ga).filter(g=>gaActifs().some(x=>x.id===g));
 const garde=()=>{};
 return {id:'fini',aid:e?e.id:null,html:()=>{const fut=futurQ(q);
  let h=headHTML(e?(prv?(aValider(e)?'Diff à valider':'Diff programmée'):'Modifier la diff'):fut?'Diff programmée':'Diff faite',esc(nom),true);
  if(rep&&!e)h+=`<div class="note">Saisie reprise là où vous l'aviez laissée.</div>`;
  h+=quandHTML(q,'Jour et heure du passage',true);
  const hors=type==='marché'&&!seanceLe(nom,q),lock=interdit(q);
  if(hors)h+=`<div class="note">Le ${esc(nom.replace(/^Marché /,'marché '))} n'a pas lieu le ${JOURS[toD(q).getDay()]}. Vérifiez la date.</div>`;
  if(lock)h+=`<div class="note">Distribution interdite à cette date : veille ou jour de scrutin (code électoral, article L. 49).</div>`;
  h+=`<div class="fl"><span>Groupes d'action</span><div class="ch2">${gaActifs().map(g=>`<button data-g="${g.id}" aria-pressed="${ga.includes(g.id)}">${esc(g.nom)}</button>`).join('')}</div></div>`;
  if(!fut&&!prv)h+=comViteHTML(CV,e&&e.type==='diff_pied'?'pied':'diff');   /* v31 : un passage fait */
  const ok=ga.length&&!lock;
  const lab=hors?'Enregistrer quand même':e?'Enregistrer':fut?'Programmer':'Enregistrer le passage';   /* v32 : une diff programmée se change ici, elle se valide avec « Valider » */
  h+=`<div class="btns stick"><button class="btn cta" id="env" ${ok?'':'disabled'}>${I.check} ${lab}</button>${ok||lock?'':`<div class="hint">Choisissez au moins un GA.</div>`}</div>`;
  if(prv)h+=`<button class="lnk9" id="del">Annuler l'action</button>`;
  else if(e&&peutSupprimer(e))h+=`<div class="btns"><button class="btn line danger" id="del">Supprimer ce compte rendu</button></div>`;
  if(e)h+=histoSaisies(e);
  return h;},
 after:()=>{lierQuand(()=>q,v=>{q=v;garde();render(true);});
  body.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const g=b.dataset.g,k=ga.indexOf(g);if(k>=0)ga.splice(k,1);else ga.push(g);render(true);});
  lierComVite(CV,null);
  const dl=$('del');if(dl)dl.onclick=()=>{const k=ACTIONS.indexOf(e);ACTIONS.splice(k,1);sauverA();back();toast(prv?'Action annulée : '+nom:'Compte rendu supprimé',{t:'Défaire',fn:()=>{ACTIONS.splice(k,0,e);sauverA();render(true);}});};
  $('env').onclick=()=>{if(!ga.length)return;const lieuId=nom,fut=futurQ(q);
   if(e){
    if(fut||prv){Object.assign(e,{statut:'a_faire',faite_le:'',ga:ga.slice()});lancer(e,q);if(e.etapes[0])e.etapes[0].le='';saisie(e,'diff programmée : jour, heure ou GA');sauverA();back();toast('Programmé le '+fmtJH(q).replace(/^./,c=>c.toLowerCase()));return;}
    else{e.prevue=q;delete e.encours;diffFaite(e);e.ga=ga.slice();poserComVite(e,CV);}
    saisie(e,'compte rendu modifié');sauverA();back();toast((fut?'Passage programmé le ':'Passage du ')+fmtJH(q).replace(/^./,c=>c.toLowerCase())+(fut?'':' enregistré'));return;}
   const x=nouvelleAction(TYPE_DIFF[type]||'diff_marche',Object.assign(fut?{statut:'a_faire',prevue:q,plan:1}:{statut:'faite',faite_le:q},{nb:0,tracts:0,campagne:campDefaut(),ga:ga.slice(),materiel:'',etapes:[{lieu:{t:LT[type]||'marche',id:lieuId},portes:0,toquees:0,ouvertes:0,st:'',acc:'',boites:0,le:fut?'':q}]}));
   x.nom=`${TYPES_C[x.type]} ${nom.replace(/^Marché /,'')}`;if(!fut)poserComVite(x,CV);ACTIONS.push(x);saisie(x,fut?'diff programmée':'diff faite');sauverA();LS.set('dga',ga);
   stack=[vueBase(),{id:'ok',html:()=>`<div class="ok"><div class="ck">${I.check}</div><h1>${fut?'Passage programmé':'Passage enregistré'}</h1><div class="sub">${esc(nom)} · ${fmtJH(q)}</div><div class="sub">${fut?'Il entre dans le sondage de la semaine du GA. ':''}Envoyé au journal partagé, ou au retour du réseau si le téléphone est hors connexion.</div></div><div class="btns"><button class="btn line" id="sh">Partager le compte rendu</button><button class="btn primary" id="nv">Revenir à la liste</button></div>`,
    after:()=>{$('sh').onclick=()=>partager(txtAction(x));$('nv').onclick=()=>show(vueBase());}}];render();};}};}
function vueActionDiffHTML(a){const e=a.etapes[0]||{lieu:{id:''}};let h=headHTML(esc(a.nom),`${TYPES[a.type]} · ${sttHTML(a)}`,true);
 /* v30 (audit) : une action à faire (pied d'immeuble, diff en cours ou prévue) s'ouvre sur sa fiche, où sont « On y va », « C'est fait » et « On n'y va plus » */
 if(a.statut==='a_faire'){h+=`<div class="meta2"><div><span>Lieu</span><b>${esc(e.lieu.id)}</b></div><div><span>GA</span><b>${esc(pourQui(a))}</b></div><div><span>${aValider(a)?'À valider':'Programmé'}</span><b>${esc(quandP(quandA(a))||'sans date')}</b></div></div>`;
  return h+`<div class="btns"><button class="btn primary" id="mfi">${a.type==='diff_pied'?'Ouvrir le pied d\'immeuble':'Ouvrir la fiche du lieu'}</button></div>`+histoSaisies(a);}
 h+=`<div class="meta2"><div><span>Lieu</span><b>${esc(e.lieu.id)}</b></div><div><span>GA</span><b>${a.ga.map(g=>esc(gaNom(g))).join(', ')}</b></div><div><span>${a.statut==='faite'?'Passage':'Programmé'}</span><b>${fmtJH(a.statut==='faite'?a.faite_le:a.prevue)}</b></div></div>`;
 if(a.com||a.vite)h+=`<div class="pnote"><b>Commentaire${a.vite?' · à refaire bientôt':''}</b>${a.com?`<span class="pcom">« ${esc(a.com)} »</span>`:''}</div>`;   /* v31 */
 h+=`<div class="btns"><button class="btn primary" id="mdiff">Modifier ce compte rendu</button><button class="btn line" id="sh">Partager</button></div>`+histoSaisies(a);return h;}
function lierActionDiff(a){const fi=$('mfi');if(fi){fi.onclick=()=>{const l=a.etapes[0].lieu;if(a.type==='diff_pied'){const s=(D.pieds||[]).find(x=>x.nom===l.id);if(s)ouvrirPied(s);return;}if(ONG!=='tractage')setMode('tractage');ouvrirLieuEq(l.t,l.id);};return;}
 $('mdiff').onclick=()=>detail(vueDiff(a.etapes[0].lieu.id,DLT[a.type],a.id));$('sh').onclick=()=>partager(txtAction(a));}

/* ---------------- liste des actions : tri par date ou par GA, filtres type et GA (filtre statut retiré, JL 25/10/2026) */
let FILTRE={type:'tous',ga:'tous',tri:'date'};
function vueActions(f){if(f&&f.type){FILTRE.type=f.type;}
 return {id:'actions',html:()=>{const F=FILTRE;
  /* v30 (audit) : « Pieds d'immeuble » à part du tractage ; les actions sans GA gardées dans le tri par GA */
  let l=ACTIONS.filter(a=>a.type!=='equipe'&&(F.type==='tous'||(F.type==='diff'?a.type.startsWith('diff')&&a.type!=='diff_pied':F.type==='pieds'?a.type==='diff_pied':a.type===F.type))&&(F.ga==='tous'||a.ga.includes(F.ga)));
  l.sort((a,b)=>{const x=a.statut==='faite'?a.faite_le:a.prevue||a.cree_le,y=b.statut==='faite'?b.faite_le:b.prevue||b.cree_le;return (y||'').localeCompare(x||'');});
  let h=headHTML('Actions',`${pl(l.length,'action')} dans le journal`,true);
  h+=`<div class="seg" role="group" aria-label="Type">${[['tous','Toutes'],['pap','PAP'],['pieds','Pieds'],['diff','Tractage']].concat(ACTIONS.some(a=>a.type==='boitage')?[['boitage','Boîtage']]:[]).map(([k,t])=>`<button data-ft="${k}" aria-pressed="${F.type===k}">${t}</button>`).join('')}</div>`;
  h+=`<div class="frow2"><select id="fg" aria-label="GA"><option value="tous">Tous les GA</option>${REF.ga.map(g=>`<option value="${g.id}" ${F.ga===g.id?'selected':''}>${esc(g.nom)}${g.archive?' (archivé)':''}</option>`).join('')}</select><div class="seg sm" role="group" aria-label="Tri">${[['date','Par date'],['ga','Par GA']].map(([k,t])=>`<button data-fo="${k}" aria-pressed="${F.tri===k}">${t}</button>`).join('')}</div></div>`;
  if(!l.length)return h+'<div class="empty">Aucune action pour ces filtres.</div>';
  if(F.tri==='ga'){const gs=REF.ga.filter(g=>l.some(a=>a.ga.includes(g.id)));gs.forEach(g=>{const m=l.filter(a=>a.ga.includes(g.id));h+=`<div class="side">${esc(g.nom)} · ${m.length}</div>`+m.map(rowAction).join('');});
   const sg=l.filter(a=>!a.ga.some(id=>REF.ga.some(g=>g.id===id)));if(sg.length)h+=`<div class="side">Sans GA · ${sg.length}</div>`+sg.map(rowAction).join('');}
  else h+=l.map(rowAction).join('');
  return h;},
 after:()=>{body.querySelectorAll('[data-ft]').forEach(b=>b.onclick=()=>{FILTRE.type=b.dataset.ft;render(true);});
  body.querySelectorAll('[data-fo]').forEach(b=>b.onclick=()=>{FILTRE.tri=b.dataset.fo;render(true);});
  $('fg').onchange=e=>{FILTRE.ga=e.target.value;render(true);};}};}
