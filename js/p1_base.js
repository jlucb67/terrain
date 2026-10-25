/* ---------------- pile des vues du tiroir, branchee sur le retour du telephone */
let stack=[],hist=0,attendu=0;
function show(v){stack=[v];render();}
/* fiches touchées sur la carte : passer d'une fiche à l'autre (adresse, bureau, lieu) remplace la fiche, sans
   empiler le retour (JL, 25/10/2026). Seule une fiche ouverte depuis une autre fiche (fils) s'empile. */
const FICHES=new Set(['adr','bv','ma','mg','st','pi','rue']);
function detail(v){if(!stack.length||stack[0].id!=='base')stack=[vueBase()];const t=stack[stack.length-1];
 if((t.id===v.id&&v.id!=='fini')||(FICHES.has(t.id)&&FICHES.has(v.id)&&!v.fils))stack[stack.length-1]=v;else{stack.push(v);try{history.pushState({terrain:1},'');hist++;}catch(e){}}render();}
function depiler(){if(stack.length<2)return false;stack.pop();sel(null);if(stack.length===1)effLot();render();return true;}
function back(){if(hist>0){attendu=stack.length;try{history.back();}catch(e){attendu=0;hist=0;depiler();return;}
  setTimeout(()=>{if(attendu&&stack.length===attendu){attendu=0;hist=Math.max(0,hist-1);depiler();}},450);return;}depiler();}
addEventListener('popstate',()=>{if(hist>0)hist--;if(attendu&&stack.length<attendu){attendu=0;return;}attendu=0;depiler();});
function render(keep){const v=stack[stack.length-1],y=body.scrollTop;if(v.id!=='parc'&&typeof effParc==='function')effParc();body.innerHTML=v.html();body.scrollTop=keep?y:0;
 const b=body.querySelector('.back');if(b)b.onclick=back;
 const c=$('vCR');if(c)c.onclick=()=>detail(vueActions({}));
 body.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>detail(vueAction(b.dataset.act)));
 body.querySelectorAll('[data-va]').forEach(b=>b.onclick=()=>detail(vueActions({type:b.dataset.va})));
 if(D)majOuverte();
 if(D&&typeof dessinerCons==='function')dessinerCons();
 if(!wide&&det==='peek'){const h=hOf('peek');if(Math.abs(sheet.getBoundingClientRect().height-h)>2)setDet('peek');}
 if(v.after)v.after();}
const headHTML=(title,sub,canBack)=>`<div class="head">${canBack?`<button class="ib back" aria-label="Retour">${I.back}</button>`:''}<div class="tt"><h1>${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div></div>`;
const kpis=a=>`<div class="kpis">${a.map(([v,t])=>`<div class="kpi"><b>${v}</b><span>${t}</span></div>`).join('')}</div>`;
const zTag=z=>`<span class="ztag" style="--zc:var(--quiet)"><i></i>Zone n°${z}</span>`;
/* couleur d'une adresse selon sa priorité, de 0 à 100 (rang dans la circo) : dégradé du jaune pâle (0) au rouge foncé (100)
   (JL, 25/10/2026 : plus de couleurs de zones sur la carte ; rouge = très prioritaire ; pas de vert, pour les daltoniens).
   pcls : palier de 20, gardé en secours si les couleurs ne sont pas lues */
const pcls=v=>v>=80?4:v>=60?3:v>=40?2:v>=20?1:0;
let PC=[];
const rgbH=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(String(h).trim());return m?[0,2,4].map(k=>parseInt(m[1].slice(k,k+2),16)):null;};
/* dégradé continu : les 5 couleurs --p0 à --p4 posées à 0, 25, 50, 75 et 100, nuances entre elles */
const prioDeg=v=>{const x=Math.max(0,Math.min(100,v||0))/25,i=Math.min(3,Math.floor(x)),f=x-i,a=rgbH(PC[i]),b=rgbH(PC[i+1]);if(!a||!b)return PC[pcls(v||0)];return 'rgb('+a.map((c,k)=>Math.round(c+(b[k]-c)*f)).join(',')+')';};
/* couleur de la priorité : dégradé continu du jaune pâle (0) au rouge foncé (100) */
const prioCol=v=>!PC.length?tok('--dot'):prioDeg(v);
/* encre la plus lisible sur une couleur de fond (contraste le plus fort) */
const lumR=c=>{const m=/(\d+),\s*(\d+),\s*(\d+)/.exec(c),x=m?[+m[1],+m[2],+m[3]]:(rgbH(c)||[0,0,0]);const l=x.map(u=>{u/=255;return u<=.03928?u/12.92:Math.pow((u+.055)/1.055,2.4);});return .2126*l[0]+.7152*l[1]+.0722*l[2];};
const encreSur=c=>{const L=lumR(c),cf=(L+.05)/(lumR('#212320')+.05),cb=1.05/(L+.05);return cf>=cb?'#212320':'#FFFFFF';};
const prioStyle=v=>{const c=prioCol(v);return `background:${c};color:${encreSur(c)}`;};
const pl=(n,s,p)=>`${n0(n)} ${n>1?(p||s+'s'):s}`;
const pad2=n=>String(n).padStart(2,'0');

/* ---------------- dates */
const p2=n=>String(n).padStart(2,'0');
const isoD=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
const toD=s=>{if(!s)return null;let m=/^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d):(\d\d))?/.exec(s);if(m)return new Date(+m[1],+m[2]-1,+m[3],m[4]?+m[4]:12,m[5]?+m[5]:0);m=/(\d+)\/(\d+)\/(\d+)/.exec(s);return m?new Date(+m[3],+m[2]-1,+m[1],12):null;};
const fmtJ=s=>{const d=toD(s);if(!d)return '';const y=d.getFullYear()!==new Date().getFullYear();return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short',...(y?{year:'numeric'}:{})});};
const fmtH=d=>`${d.getHours()} h${d.getMinutes()?' '+p2(d.getMinutes()):''}`;
const fmtJH=s=>{const d=toD(s);if(!d)return '';return cap(d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}))+(/T\d/.test(s)?', '+fmtH(d):'');};
const ageJ=s=>{const d=toD(s);return d?(Date.now()-d.getTime())/864e5:1e9;};
const qOf=x=>x.quand||x.debut||(x.date&&isoD(toD(x.date)))||'';
function quandHTML(q,lab){const auj=isoD(new Date()).slice(0,10),hier=isoD(new Date(Date.now()-864e5)).slice(0,10),dv=q.slice(0,10),autre=dv!==auj&&dv!==hier;
 return `<div class="qd"><span>${lab||'Quand'}</span><div class="rw"><button data-qj="${auj}" aria-pressed="${dv===auj}">Aujourd'hui</button><button data-qj="${hier}" aria-pressed="${dv===hier}">Hier</button><input type="date" id="qD" class="${autre?'on':''}" value="${dv}" max="${auj}" aria-label="Autre jour"></div><div class="rw2"><label for="qT">Heure</label><input type="time" id="qT" value="${q.slice(11,16)}"></div></div>`;}
function lierQuand(get,set){body.querySelectorAll('[data-qj]').forEach(b=>b.onclick=()=>{set(b.dataset.qj+get().slice(10));render(true);});
 const d=$('qD'),t=$('qT');if(d)d.onchange=()=>{if(d.value){set(d.value+get().slice(10));render(true);}};if(t)t.onchange=()=>{if(t.value)set(get().slice(0,11)+t.value);};}

/* ---------------- compteurs : boutons de 44 px et saisie au clavier chiffres */
const cptHTML=(k,lab,v)=>`<div class="cpt"><span>${lab}</span><div class="cw"><button data-c="${k}|-1" aria-label="${lab} : un de moins">−</button><input data-ci="${k}" inputmode="numeric" pattern="[0-9]*" value="${v}" aria-label="${lab}"><button data-c="${k}|1" aria-label="${lab} : un de plus">+</button></div></div>`;
function lierCpt(get,set){body.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const [k,d]=b.dataset.c.split('|');set(k,Math.max(0,get(k)+(+d)));render(true);});
 body.querySelectorAll('[data-ci]').forEach(inp=>{inp.onfocus=()=>{try{inp.select();}catch(e){}};
  inp.oninput=()=>{const v=parseInt(inp.value.replace(/\D/g,''),10);set(inp.dataset.ci,isNaN(v)?0:v);body.querySelectorAll('[data-ci]').forEach(o=>{if(o!==inp)o.value=get(o.dataset.ci);});};});}
const nbHTML=nb=>`<div class="cpts one">${cptHTML('nb','Militants présents',nb)}</div>`;
const groupeHTML=gp=>`<label class="fld" for="eq">Groupe d'action<input id="eq" value="${esc(gp)}" placeholder="Par exemple : GA Belleville" autocomplete="off"></label><div class="hint">Pas de prénom ni de nom : le compte rendu ira dans un journal partagé.</div>`;
function partager(txt){try{if(navigator.share){navigator.share({text:txt}).catch(()=>{});return;}}catch(e){}
 try{navigator.clipboard.writeText(txt).then(()=>toast('Copié : collez-le dans la messagerie du groupe'),()=>toast('Copie impossible ici'));}catch(e){toast('Copie impossible ici');}}

/* ---------------- ecran 1 : Paris, coloree par l'objectif 2027 */
let P=null,parisL=null,eauL=null,arrL=null,labL=null,choix=null;
const BINS=[25,35,45,55],cls=p=>BINS.filter(b=>p>=b).length;
const circoNom=n=>n===1?'1re circonscription':n+'e circonscription';
function vueParis(){return {id:'paris',html:()=>{
  let h;
  if(!choix){h=headHTML('Choisissez votre circonscription','Touchez-la sur la carte.');
   h+=`<div class="legend"><div class="t">Objectif 2027, en % des exprimés</div><div class="sw">${[0,1,2,3,4].map(i=>`<i style="background:var(--o${i})"></i>`).join('')}</div><div class="lb"><span>moins de 25</span><span>25 à 35</span><span>35 à 45</span><span>45 à 55</span><span>55 et plus</span></div></div>`;}
  else if(!peutCirco(choix)){h=headHTML(circoNom(choix),'Pas dans vos circonscriptions.');h+=`<div class="hint">Vous avez accès à : ${esc(circosTxt(moi()))}. Pour une autre circonscription, voyez avec un administrateur.</div>`;}
  else{const p=P.circos.find(f=>f.properties.n===choix).properties;
   h=headHTML(circoNom(p.n),`${esc(p.arrs)} arrondissement${p.arrs.includes(',')?'s':''} · ${p.bureaux} bureaux de vote`);
   h+=kpis([[n0(p.objectif),'voix à obtenir en 2027'],[pc(p.objectif_p),'des exprimés'],['+'+n0(p.gain),'voix par rapport à 2022']]);
   h+=`<div class="btns"><button class="btn primary" id="go">Ouvrir la carte de la ${p.n===1?'1re':p.n+'e'}</button></div><div class="hint">Ou touchez une autre circonscription.</div>`;}
  return h;},
 after:()=>{const g=$('go');if(g)g.onclick=()=>ouvrir(choix);}};}
/* libellé d'une circo sans accès : grisé (les marqueurs n'existent qu'une fois la carte posée, d'où l'appel aussi à l'ajout) */
function stLab(m){const e=m.getElement&&m.getElement(),d=e&&e.querySelector('.cl');if(d)d.classList.toggle('off',!peutCirco(m.n));}
function stParis(){const b=tok('--cborder'),ac=tok('--accent');
 parisL.eachLayer(l=>{const s=l.n===choix,ok=peutCirco(l.n);l.setStyle({color:s?ac:b,weight:s?2.6:1.4,opacity:1,fillColor:ok?tok('--o'+cls(l.p)):tok('--off'),fillOpacity:choix&&!s?.7:1});if(s)l.bringToFront();});
 if(labL)labL.eachLayer(stLab);
 eauL.setStyle({fillColor:tok('--water')});arrL.setStyle({color:tok('--arr')});}
function choisir(n){choix=n;stParis();show(vueParis());setDet('fit');map.flyToBounds(P.bounds,{...pad(56),duration:.35});}
function ecranParis(){
 clearCirco();LS.set('circo',0);fermerMenu();$('menuP').hidden=false;$('searchbox').hidden=true;$('brand').hidden=false;$('fLeg').hidden=true;$('tabbar').hidden=true;app.classList.remove('tabs');sheet.classList.add('paris');
 if(!parisL){parisL=L.layerGroup();labL=L.layerGroup();
  P.circos.forEach(f=>{const l=L.geoJSON(f,{renderer:rA}).getLayers()[0];l.n=f.properties.n;l.p=f.properties.objectif_p;l.on('click',()=>choisir(l.n));parisL.addLayer(l);
   const m=L.marker([f.properties.lab[1],f.properties.lab[0]],{pane:'noms',interactive:false,icon:L.divIcon({className:'',html:`<div class="cl${cls(f.properties.objectif_p)>=2?' hi':''}"><b>${f.properties.n===1?'1ère':f.properties.n+'ème'}</b><span>${Math.round(f.properties.objectif_p)} %</span></div>`,iconSize:[0,0]})});
   m.p=f.properties.objectif_p;m.n=f.properties.n;m.on('add',()=>stLab(m));labL.addLayer(m);});
  eauL=L.geoJSON(P.eau,{renderer:rC,interactive:false,style:{stroke:false,fillOpacity:1}});
  arrL=L.geoJSON(P.arr,{renderer:rC,interactive:false,style:{weight:.8,opacity:1,dashArray:'1 3',lineCap:'round',fill:false}});}
 [parisL,eauL,arrL,labL].forEach(l=>l.addTo(map));
 map.setMaxBounds(null);map.setMinZoom(10.5);stParis();show(vueParis());setDet('fit');
 map.fitBounds(P.bounds,pad(56));}

/* ---------------- ecran 2 : la circonscription et ses quatre missions */
let D=null,BZ={},crit={v:2,score:70,ins:6,ni:0},fondL=null,zonesL=null,contourL=null,adrL=null,nomsL=null,bvlL=null,stnL=null,lieuxL={},papL=null,lotL=null,selL=null,AM=[],ZC={},bulles=null;
let mode='pap',ONG='pap',vueMetroJour='now';
const chips={prio:false,zones:true,metro:true,faites:true,tMa:true,tSu:true,tMe:true,tPi:true};
const CHIPS={pap:[['prio','Prioritaires','--accent'],['zones','Bureaux','--quiet'],['faites','Faites','--ok'],['metro','Métro','--ink']],
 tractage:[['tMa','Marchés','#2E7D4F'],['tSu','Magasins','--sup'],['tMe','Métro','--ink'],['tPi',"Pieds d'immeuble",'--pied']]};
/* stockage local par circonscription ; les adresses sont designees par leur libelle, unique et stable */
let faites={},ACC={},BOI={},SEL=[],ACTIONS=[],ACT_OUV=null,equipe='',nbm=2,regT=0,lot=null,posMoi=null;
const AID=i=>D.adresses[i][2];
let BYID={};
const ptA=i=>[D.adresses[i][1],D.adresses[i][0]];
const uid=()=>{try{return crypto.randomUUID();}catch(e){return 'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,10);}};
const TYPE_DIFF={'marché':'diff_marche','supermarché':'diff_supermarche','station':'diff_metro','pied':'diff_pied'};
/* listes de reference : lues dans le journal (listes.json), gerees dans la console ; ci-dessous, les exemples de la maquette, avant la premiere connexion */
const REF0={v:2,campagnes:[{id:'pres',nom:'Présidentielle',debut:'',fin:'',archive:false,defaut:true},{id:'legis',nom:'Législatives',debut:'',fin:'',archive:false,defaut:false},{id:'muni',nom:'Municipales',debut:'',fin:'',archive:false,defaut:false},{id:'thema',nom:'Campagnes thématiques récurrentes',debut:'',fin:'',archive:false,defaut:false}],
 ga:[{id:'g1',nom:'GA exemple A',arr:11,circos:[6],archive:false},{id:'g2',nom:'GA exemple B',arr:20,circos:[6],archive:false},{id:'g3',nom:'GA exemple C',arr:20,circos:[6],archive:false}],
 materiel:[{id:'m1',nom:'Tract exemple',campagne:'thema',archive:false}],
 users:[{id:'u1',nom:'Vous',contact:'',profil:'admin',ga:['g1'],actif:true},{id:'u2',nom:'Administrateur exemple',contact:'',profil:'admin',ga:['g2'],actif:true},{id:'u3',nom:'Militant exemple',contact:'',profil:'utilisateur',ga:['g1'],actif:true}],
 reglages:{delaiFaite:30,delaiFerme:14,taille:100,scrutins:[]}};
let REF=LS.get('ref',null)||JSON.parse(JSON.stringify(REF0));
const sauverREF=()=>{LS.set('ref',REF);if(JPRET)jEcrireListes();};
const CAMP_V1={c1:'thema',c2:'pres'};
if(!REF.v||REF.v<2){REF.campagnes=JSON.parse(JSON.stringify(REF0.campagnes));REF.ga.forEach(g=>{if(!g.circos)g.circos=g.circo?[g.circo]:[6];if(g.arr===undefined)g.arr=null;delete g.circo;});REF.materiel.forEach(m=>{if(CAMP_V1[m.campagne])m.campagne=CAMP_V1[m.campagne];});REF.v=2;sauverREF();}
let MOI=LS.get('moi','u1');
const moi=()=>REF.users.find(u=>u.id===MOI)||REF.users[0];
const estAdmin=()=>moi().profil==='admin';
/* droits par circonscription : un administrateur a les 18 ; un utilisateur, celles cochées dans la console (sans liste : les 18) */
const TOUTES=[...Array(18)].map((_,i)=>i+1);
const circosDe=u=>!u||u.profil==='admin'||!Array.isArray(u.circos)?TOUTES:u.circos;
const peutCirco=n=>circosDe(moi()).includes(n);
const circosTxt=u=>{const c=circosDe(u);return c.length===18?'toutes les circos':c.map(n=>n===1?'1re':n+'e').join(', ');};
function circoDepart(){const c=+LS.get('dernCirco',0)||0,m=circosDe(moi());return c&&m.includes(c)?c:m.length===1?m[0]:0;}
/* affichage clair ou sombre : choix de chaque utilisateur, garde sur son telephone */
const themeDe=()=>LS.get('theme_'+MOI,'auto');
function appliquerTheme(){const t=themeDe(),r=document.documentElement;if(t==='clair')r.setAttribute('data-theme','light');else if(t==='sombre')r.setAttribute('data-theme','dark');else r.removeAttribute('data-theme');}
appliquerTheme();
const gaNom=id=>(REF.ga.find(g=>g.id===id)||{nom:'GA retiré'}).nom;
const campNom=id=>(REF.campagnes.find(c=>c.id===id)||{nom:'Campagne retirée'}).nom;
const userNom=id=>(REF.users.find(u=>u.id===id)||{nom:'Personne retirée'}).nom;
const matNom=id=>(REF.materiel.find(m=>m.id===id)||{nom:''}).nom;
const campDefaut=()=>(REF.campagnes.find(c=>c.defaut&&!c.archive)||REF.campagnes.find(c=>!c.archive)||{}).id||'';
const gaActifs=()=>REF.ga.filter(g=>!g.archive&&(!D||!g.circos||!g.circos.length||g.circos.includes(D.k)));
const arrTxt=n=>n?(n===1?'1er':n+'e')+' arrondissement':'arrondissement à indiquer';
function lireStock(n){
 SEL=LS.get('sel'+n,null);if(!SEL)SEL=LS.get('pap'+n,[])||[];SEL=SEL.filter(i=>D.adresses[i]);
 equipe=LS.get('equipe','');nbm=LS.get('nbm',2);crit=LS.get('crit',{v:2,score:70,ins:6,ni:0});if(crit.ni==null)crit.ni=0;
 /* 20/10/2026 : le score devient un rang dans la circo ; un curseur réglé sur l'ancienne échelle repart à 70 */
 if(crit.v!==2){crit.v=2;crit.score=70;LS.set('crit',crit);}
 ACTIONS=LS.get('actions'+n,null);if(!ACTIONS){ACTIONS=migrerV4(n);LS.set('actions'+n,ACTIONS);}
 ACTIONS.forEach(a=>{if(CAMP_V1[a.campagne])a.campagne=CAMP_V1[a.campagne];});
 deriver();if(JPRET)jOuvert(n);}
function migrerV4(n){const out=[],cr=LS.get('cr'+n,[])||[];const lt={'marché':'marche','station':'station','supermarché':'commerce'};
 cr.forEach(x=>{const le=x.debut||x.saisi_le||isoD(new Date());const base={id:uid(),nom:'',campagne:campDefaut(),ga:[],statut:'faite',prevue:'',faite_le:le,nb:x.nb_militants||0,tracts:x.tracts_distribues||x.tracts_deposes||0,materiel:'',saisies:[{par:moi().id,le,quoi:'reprise de la version précédente'}],cree_par:moi().id,cree_le:le};
  if(x.type==='pap')out.push(Object.assign(base,{type:'pap',etapes:(x.adresses||[]).map(d=>({lieu:{t:'adresse',id:d.adr_id},portes:d.portes_toquees||0,toquees:d.portes_toquees||0,ouvertes:d.portes_ouvertes||0,st:d.statut==='faite'?'faite':d.statut==='pas_pu_entrer'?'ferme':'temps',acc:d.acces||'',boites:0,le}))}));
  else if(x.type==='boitage')out.push(Object.assign(base,{type:'boitage',etapes:(x.adresses||[]).map(d=>({lieu:{t:'adresse',id:d.adr_id},portes:0,toquees:0,ouvertes:0,st:d.statut==='boite'?'boite':d.statut==='ferme'?'ferme':'',acc:'',boites:0,le}))}));
  else out.push(Object.assign(base,{type:x.type,etapes:[{lieu:{t:lt[x.lieu_type]||'marche',id:x.lieu_nom},portes:0,toquees:0,ouvertes:0,st:'',acc:'',boites:0,le}]}));});
 out.forEach(a=>{a.nom=nomDefaut(a);const g=gaActifs()[0];if(g)a.ga=[g.id];});return out;}
function clearCirco(){[fondL,zonesL,contourL,adrL,nomsL,bvlL,stnL,papL,lotL,selL,bulles,...Object.values(lieuxL)].forEach(l=>{if(l&&map.hasLayer(l))map.removeLayer(l);});}
async function chargerJSON(url,onp){const r=await fetch(url);if(!r.ok)throw new Error(r.status);const tot=+r.headers.get('content-length')||0;
 if(!r.body||!tot||!onp||!window.TextDecoder)return r.json();const rd=r.body.getReader();const parts=[];let got=0,last=-1;
 for(;;){const {done,value}=await rd.read();if(done)break;parts.push(value);got+=value.length;const p=Math.min(99,Math.round(100*got/tot));if(p!==last){last=p;onp(p);}}
 const buf=new Uint8Array(got);let o=0;parts.forEach(x=>{buf.set(x,o);o+=x.length;});return JSON.parse(new TextDecoder().decode(buf));}
/* magasins absents du relevé Google (Apur, commerces 2023), Action et Gifi (v15, 25/10/2026) : un fichier pour tout Paris,
   on garde ceux de la circo (pas ses abords : carte épurée) ; sans affluence */
let MAGS=null;
function ajouterMagasins(){if(D._mag||!MAGS||!MAGS.magasins)return;D._mag=1;const b=D.bounds;D.supers=D.supers||[];
 MAGS.magasins.forEach(s=>{if(s.lat<b[0][0]||s.lat>b[1][0]||s.lon<b[0][1]||s.lon>b[1][1]||!dansCirco([s.lat,s.lon]))return;D.supers.push(Object.assign({},s,{dedans:true}));});}
async function ouvrir(n,ensuite){
 if(!(n>=1&&n<=18)||!peutCirco(n))return;
 body.innerHTML='<div class="load" id="ld">Chargement de la carte…</div>';
 try{if(!D||D.k!==n){D=await chargerJSON(`d/circo_${pad2(n)}.json`,p=>{const l=$('ld');if(l)l.textContent=`Chargement de la carte : ${p} %`;});D.bati=null;
  if(!MAGS)MAGS=await fetch('d/magasins.json').then(r=>r.ok?r.json():null).catch(()=>null);ajouterMagasins();construire();chargerBati(n);chargerParcours(n);}}
 catch(e){console.error('chargement',e&&e.stack||e);body.innerHTML='<div class="load">La carte n\'a pas pu être chargée. Vérifiez la connexion, puis réessayez.</div>';return;}
 [parisL,eauL,arrL,labL].forEach(l=>{if(l&&map.hasLayer(l))map.removeLayer(l);});sheet.classList.remove('paris');
 [fondL,zonesL,contourL,adrL,nomsL,bvlL,stnL,papL,lotL,selL].forEach(l=>{if(l)l.addTo(map);});
 $('brand').hidden=true;$('menuP').hidden=true;$('searchbox').hidden=false;$('fLeg').hidden=false;$('tabbar').hidden=false;app.classList.add('tabs');
 LS.set('circo',n);LS.set('dernCirco',n);$('cLab').textContent=n===1?'1re':n+'e';lireStock(n);
 dessinerParcours();setDet('peek');
 map.setMaxBounds(null);map.fitBounds(D.bounds,{...pad(),animate:false});
 map.setMinZoom(Math.min(12,map.getZoom()));
 setMode(LS.get('mode','pap'),true);
 if(ensuite)ensuite();else{const a=actPar(LS.get('ouv'+n,''));if(a&&a.statut==='a_faire'&&a.type===mode){setDet('half');detail(vueAction(a.id));}}
}
/* fond statique de la circonscription (espaces verts, chaussées, eau, bâti) : un seul canvas, des chemins calculés une
   fois au zoom de référence puis redessinés par simple changement d'échelle. Rien n'est recalculé au zoom ni au glissé
   (les calques vectoriels de Leaflet reprojetaient et découpaient des centaines de milliers de sommets à chaque mouvement de la carte). */
const ZREF=16,SREF=256*Math.pow(2,ZREF),RAD=Math.PI/180;
const pxX=lon=>SREF*(lon/360+.5),pxY=lat=>SREF*(.5-Math.log(Math.tan(Math.PI/4+lat*RAD/2))/(2*Math.PI));
const Fond=L.Layer.extend({
 options:{pane:'fond',padding:.25},
 initialize(o){this._o={x:pxX(o[1]),y:pxY(o[0])};this._c=[];this._col={};},
 /* anneaux d'un polygone : extérieur dans un sens, trous dans l'autre, pour un remplissage correct en « nonzero ».
    Deux versions : complète, et allégée pour les vues larges (sommets à moins de 6 px du tracé au zoom 16 retirés,
    petits polygones de moins de 14 px retirés) : à l'échelle de la circonscription, l'écart est invisible. */
 _anneaux(p,q,poly){const ox=this._o.x,oy=this._o.y;poly.forEach((r,j)=>{if(r.length<3)return;const n=r.length,xs=new Float64Array(n),ys=new Float64Array(n);let a=0,x0=1e12,x1=-1e12,y0=1e12,y1=-1e12;
   for(let i=0;i<n;i++){const x=xs[i]=pxX(r[i][0])-ox,y=ys[i]=pxY(r[i][1])-oy;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
   for(let i=0,k=n-1;i<n;k=i++)a+=(xs[k]-xs[i])*(ys[k]+ys[i]);
   const inv=(j===0)!==(a>0),idx=[];for(let i=0;i<n;i++)idx.push(inv?n-1-i:i);
   p.moveTo(xs[idx[0]],ys[idx[0]]);for(let i=1;i<n;i++)p.lineTo(xs[idx[i]],ys[idx[i]]);p.closePath();
   if(Math.max(x1-x0,y1-y0)<14)return;
   const keep=new Uint8Array(n);keep[0]=keep[n-1]=1;const st=[[0,n-1]];
   while(st.length){const [a0,b0]=st.pop();let dm=0,im=-1;const ax=xs[idx[a0]],ay=ys[idx[a0]],bx=xs[idx[b0]],by=ys[idx[b0]],dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy;
    for(let i=a0+1;i<b0;i++){const px=xs[idx[i]]-ax,py=ys[idx[i]]-ay;let d;if(!L2)d=px*px+py*py;else{const t=Math.max(0,Math.min(1,(px*dx+py*dy)/L2)),ex=px-t*dx,ey=py-t*dy;d=ex*ex+ey*ey;}if(d>dm){dm=d;im=i;}}
    if(dm>36){keep[im]=1;st.push([a0,im],[im,b0]);}}
   let m=0;for(let i=0;i<n;i++)if(keep[i])m++;if(m<3)return;
   let f=true;for(let i=0;i<n;i++)if(keep[i]){if(f){q.moveTo(xs[idx[i]],ys[idx[i]]);f=false;}else q.lineTo(xs[idx[i]],ys[idx[i]]);}q.closePath();});},
 /* nom de la couche, couleur (jeton CSS), géométries GeoJSON (Polygon / MultiPolygon) ou liste de polygones */
 couche(nom,tokCol,geoms){const p=new Path2D(),q=new Path2D();geoms.forEach(g=>{if(!g)return;if(Array.isArray(g)){this._anneaux(p,q,g);return;}
   const G=g.geometry||g;if(G.type==='Polygon')this._anneaux(p,q,G.coordinates);else if(G.type==='MultiPolygon')G.coordinates.forEach(pl=>this._anneaux(p,q,pl));});
  const i=this._c.findIndex(c=>c.nom===nom),c={nom,tok:tokCol,p,q};if(i>=0)this._c[i]=c;else this._c.push(c);this._trier();this.couleurs();},
 _trier(){const o=['verts','chaussees','eau','bati'];this._c.sort((a,b)=>o.indexOf(a.nom)-o.indexOf(b.nom));},
 couleurs(){this._c.forEach(c=>c.col=tok(c.tok));this._dessiner();},
 onAdd(map){if(!this._cv){this._cv=L.DomUtil.create('canvas','leaflet-zoom-animated');this._ctx=this._cv.getContext('2d');}
  map.getPane(this.options.pane).appendChild(this._cv);
  map.on('moveend viewreset zoomend',this._update,this);map.on('zoom',this._onZoom,this);if(map._zoomAnimated)map.on('zoomanim',this._anim,this);this._update();},
 onRemove(map){L.DomUtil.remove(this._cv);map.off('moveend viewreset zoomend',this._update,this);map.off('zoom',this._onZoom,this);map.off('zoomanim',this._anim,this);},
 _update(){const m=this._map;if(!m)return;const p=this.options.padding,size=m.getSize(),min=m.containerPointToLayerPoint(size.multiplyBy(-p)).round();
  this._b=L.bounds(min,min.add(size.multiplyBy(1+p*2)).round());this._ce=m.getCenter();this._z=m.getZoom();
  const s=this._b.getSize(),r=this._r=Math.min(2,window.devicePixelRatio||1);L.DomUtil.setPosition(this._cv,this._b.min);
  this._cv.width=Math.round(r*s.x);this._cv.height=Math.round(r*s.y);this._cv.style.width=s.x+'px';this._cv.style.height=s.y+'px';this._dessiner();},
 _dessiner(){const x=this._ctx,m=this._map;if(!x||!m||!this._b)return;const k=Math.pow(2,this._z-ZREF),r=this._r,po=m.getPixelOrigin(),b=this._b;
  x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,this._cv.width,this._cv.height);
  x.setTransform(r*k,0,0,r*k,r*(this._o.x*k-po.x-b.min.x),r*(this._o.y*k-po.y-b.min.y));
  const lo=this._z<14.5;this._c.forEach(c=>{x.fillStyle=c.col;x.fill(lo?c.q:c.p);});},
 _anim(e){this._trans(e.center,e.zoom);},
 _onZoom(){this._trans(this._map.getCenter(),this._map.getZoom());},
 _trans(center,zoom){const m=this._map;if(!this._ce)return;const sc=m.getZoomScale(zoom,this._z),half=m.getSize().multiplyBy(.5+this.options.padding),
  cur=m.project(this._ce,zoom),tl=half.multiplyBy(-sc).add(cur).subtract(m._getNewPixelOrigin(center,zoom));
  if(L.Browser.any3d)L.DomUtil.setTransform(this._cv,tl,sc);else L.DomUtil.setPosition(this._cv,tl);}
});
/* score affiché : rang de l'adresse dans sa circonscription (arbitrage JL du 20/10/2026). 70 = plus prioritaire que
   70 % des adresses de la circo. Même barème, même ordre : le score de Paris (0 à 100) est gardé en a[16]. */
function rangCirco(){if(D._rang)return;D._rang=1;const A=D.adresses,n=A.length,v=i=>A[i][5]==null?-1:A[i][5],o=A.map((a,i)=>i).sort((x,y)=>v(x)-v(y));
 let i=0;while(i<n){let j=i;while(j+1<n&&v(o[j+1])===v(o[i]))j++;const r=n>1?100*((i+j)/2)/(n-1):100;
  for(let k=i;k<=j;k++){const a=A[o[k]];a[16]=a[5];a[5]=Math.round(r*10)/10;}i=j+1;}}
const ACCENTS={Pyrenees:'Pyrénées',Menilmontant:'Ménilmontant',Pere:'Père',Lachaise:'Lachaise',Republique:'République',Saint:'Saint'};
function construire(){
 BZ={};D.bureaux.forEach(f=>BZ[f.properties.id]=f.properties);BYID={};D.adresses.forEach((a,i)=>BYID[a[2]]=i);rangCirco();
 D.marches.forEach(s=>{s.nom=s.nom.replace(/[A-Za-z]+/g,w=>ACCENTS[w]||w);});
 fondL=new Fond([D.bounds[0][0],D.bounds[0][1]]);fondL.couche('verts','--green',D.fond.verts);fondL.couche('chaussees','--road',D.fond.chaussees);
 zonesL=L.geoJSON({type:'FeatureCollection',features:D.bureaux},{renderer:rA,onEachFeature:(f,l)=>l.on('click',()=>{if(mode==='pap')ouvrirBureau(f.properties.id);})});
 contourL=L.layerGroup([L.geoJSON(D.contour,{renderer:rC,interactive:false,style:{weight:4.5,opacity:.95,fill:false}}),L.geoJSON(D.contour,{renderer:rC,interactive:false,style:{weight:1.4,opacity:1,fill:false}})]);
 AM=D.adresses.map((a,i)=>{const m=L.circleMarker([a[1],a[0]],{renderer:rA,radius:3});m.i=i;m.on('click',()=>{if(mode==='pap')ouvrirAdresse(i);else if(mode==='boitage')ouvrirAdresseB(i);});return m;});
 adrL=L.layerGroup();nomsL=L.layerGroup();bvlL=L.layerGroup();stnL=L.layerGroup();papL=L.layerGroup();lotL=L.layerGroup();selL=L.layerGroup();
 const mk=(ll,cls,html,sz,fn,lab)=>{const m=L.marker(ll,{pane:'lieux',icon:L.divIcon({className:'',html:lab?`<div class="mkl"><div class="mk ${cls}" style="width:${sz}px;height:${sz}px">${html}</div><span>${esc(lab)}</span></div>`:`<div class="mk ${cls}" style="width:${sz}px;height:${sz}px">${html}</div>`,iconSize:[sz,sz],iconAnchor:[sz/2,sz/2]}),keyboard:true});m.on('click',fn);return m;};
 lieuxL={metro:L.layerGroup(D.metro.map(s=>mk([s.lat,s.lon],'mk-m','M',14,()=>ouvrirStation(s)))),
  marches:L.layerGroup(D.marches.map(s=>{const m=mk([s.lat,s.lon],'mk-ma',I.basket,20,()=>ouvrirMarche(s),s.nom.replace(/^Marché /,''));s._m=m;return m;})),
  grands:L.layerGroup((D.supers||[]).map(s=>{const m=mk([s.lat,s.lon],'mk-c g',I.cart,20,()=>ouvrirMagasin(s));s._m=m;return m;})),
  pieds:L.layerGroup((D.pieds||[]).map(s=>{const g=L.geoJSON(s.geo,{renderer:rA,style:{color:tok('--pied'),weight:1.6,opacity:.9,dashArray:'4 3',fillColor:tok('--pied'),fillOpacity:.1}}).on('click',()=>ouvrirPied(s));s._g=g;
   const m=mk([s.lat,s.lon],'mk-p',I.pied,18,()=>ouvrirPied(s));s._m=m;return L.layerGroup([g,m]);}))};
 PRC={};
 bulles=L.layerGroup();
 voies();indexer();
}
function construireBati(){if(!D.bati)return;
 if(D.bati.eau)fondL.couche('eau','--water',[D.bati.eau]);
 fondL.couche('bati','--bati',D.bati.ilots);
 styler();}
function chargerBati(n){fetch(`d/bati_${pad2(n)}.json`).then(r=>r.json()).then(b=>{if(!D||D.k!==n)return;D.bati=b;construireBati();}).catch(()=>{});}
/* le point est-il dans la circonscription ? */
function dansCirco(ll){const g=D.contour.type==='Polygon'?[D.contour.coordinates]:D.contour.type==='MultiPolygon'?D.contour.coordinates:(D.contour.features||[]).map(f=>f.geometry.type==='Polygon'?f.geometry.coordinates:f.geometry.coordinates[0]);
 const x=ll[1],y=ll[0];return g.some(poly=>{const r=poly[0];let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const [xi,yi]=r[i],[xj,yj]=r[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;});}
/* centre de la partie visible de la carte, entre la recherche et le tiroir */
function centreVisible(){const W=app.clientWidth,H=app.clientHeight;
 if(wide)return map.containerPointToLatLng([396+(W-396)/2,H/2]);
 const top=($('searchbox').getBoundingClientRect().bottom||100)+4,bas=Math.min(H,sheet.getBoundingClientRect().top||H);
 return map.containerPointToLatLng([W/2,(top+Math.max(top+40,bas))/2]);}
const isPr=a=>a[5]>=crit.score&&a[3]>=crit.ins&&(!(crit.ni>0)||a[14]>=crit.ni);
/* non-inscrits estimes (index 14) : borne du curseur = 99e centile de la circo, entre 10 et 60 */
const niMax=()=>{const v=D.adresses.map(a=>a[14]).filter(x=>x>0).sort((x,y)=>x-y);return v.length?Math.max(10,Math.min(60,Math.round(v[Math.floor(.99*(v.length-1))]))):10;};
const niTxt=n=>n>0?n+'+':'tous';
const FIAB={b:'bonne',m:'moyenne',f:'faible'};
const zoneOf=a=>(BZ[a[9]]||{}).zone||0;
const rad=(ins,z)=>{const f=z<14?.48:z<15?.6:z<16?.78:z<17?1:z<18?1.3:1.65;return Math.max(1.8,(1.4+Math.sqrt(ins)*.58)*f);};
const recente=i=>ageJ(faites[AID(i)])<REF.reglages.delaiFaite;
const pasEntreRecent=i=>{const x=ACC[AID(i)];return !!x&&ageJ(x.q)<REF.reglages.delaiFerme;};
function styler(){if(!D)return;ZC={1:tok('--z1'),2:tok('--z2'),3:tok('--z3')};PC=[0,1,2,3,4].map(k=>tok('--p'+k));
 const g=tok('--green'),r=tok('--road'),bt=tok('--bati'),ink=tok('--ink'),so=tok('--solid'),fo=parseFloat(tok('--fo-zone'))||.075,zo=parseFloat(tok('--zo'))||.55;
 fondL.couleurs();if(lieuxL.pieds){const pc=tok('--pied');(D.pieds||[]).forEach(x=>x._g&&x._g.setStyle({color:pc,fillColor:pc}));}
 const zon=(mode==='pap'||mode==='boitage')&&chips.zones;
 zonesL.setStyle(()=>zon?{color:tok('--quiet'),weight:1,opacity:.45,fillOpacity:0}:{color:tok('--quiet'),weight:.6,opacity:.22,fillOpacity:0});
 const cl=contourL.getLayers();cl[0].setStyle({color:so});cl[1].setStyle({color:ink});
 stylerAdr();}
let dernZ=-1;const zBucket=z=>z<14?0:z<15?1:z<16?2:z<17?3:z<18?4:5;
function stylerAdr(){const z=map.getZoom(),so=tok('--solid'),dt=tok('--dot'),ac=tok('--accent'),qu=tok('--quiet');
 dernZ=zBucket(z);try{rA.options.tolerance=z>=16?12:7;}catch(e){}
 const creux=(a,c,dash)=>({radius:Math.max(3,rad(a[3],z)*.85),stroke:true,color:c,weight:1.7,opacity:1,fill:true,fillColor:so,fillOpacity:.95,dashArray:dash||null});
 if(mode==='boitage'){const ao=ACT_OUV&&actPar(ACT_OUV),tour=new Set(ao&&ao.type==='boitage'?ao.etapes.map(e=>e.lieu.id):[]);AM.forEach(m=>{const a=D.adresses[m.i],b=BOI[a[2]],rec=b&&ageJ(b.q)<REF.reglages.delaiFaite;
  m.setStyle(rec&&b.st==='boite'?creux(a,ac):rec&&b.st==='ferme'?creux(a,qu,'2 2')
   :tour.has(a[2])?{radius:rad(a[3],z),stroke:true,color:so,weight:z<15?.6:1,opacity:.95,fill:true,fillColor:prioCol(a[5]),fillOpacity:1,dashArray:null}
   :{radius:rad(a[3],z)*.7,stroke:false,fill:true,fillColor:prioCol(a[5]),fillOpacity:.55,dashArray:null});});return;}
 if(mode!=='pap'){AM.forEach(m=>{const a=D.adresses[m.i];m.setStyle({radius:rad(a[3],z)*.55,stroke:false,fill:true,fillColor:prioCol(a[5]),fillOpacity:isPr(a)?.45:.35,dashArray:null});});return;}
/* statut de l'adresse pendant la campagne en cours : faite (violet), pas pu entrer (gris), prévue dans un PAP (anneau) */
 const okc=tok('--ok'),koc=tok('--ko'),plein=(a,c)=>({radius:Math.max(3,rad(a[3],z)*.92),stroke:true,color:so,weight:z<15?.6:1.2,opacity:1,fill:true,fillColor:c,fillOpacity:1,dashArray:null});
 AM.forEach(m=>{const a=D.adresses[m.i],pr=isPr(a),s=statutA(a[2]);
  m.setStyle(s==='fait'?plein(a,okc):s==='ferme'?plein(a,koc)
   :s==='prevu'?{radius:Math.max(3,rad(a[3],z)),stroke:true,color:ac,weight:2,opacity:1,fill:true,fillColor:so,fillOpacity:1,dashArray:null}
   :pr?{radius:rad(a[3],z),stroke:true,color:so,weight:z<15?.6:1,opacity:.95,fill:true,fillColor:prioCol(a[5]),fillOpacity:1,dashArray:null}
   :{radius:rad(a[3],z)*.62,stroke:false,fill:true,fillColor:prioCol(a[5]),fillOpacity:.85,dashArray:null});});}
function filtrer(){if(!D)return;adrL.clearLayers();
 if(mode==='boitage'){AM.forEach(m=>adrL.addLayer(m));styler();return;}
 const pr=[],ot=[];AM.forEach(m=>{const a=D.adresses[m.i],f=statutA(a[2])==='fait';if(f&&!chips.faites&&mode==='pap')return;if(isPr(a))pr.push(m);else if(!chips.prio||mode!=='pap'||f)ot.push(m);});
 ot.forEach(m=>adrL.addLayer(m));pr.forEach(m=>adrL.addLayer(m));
 styler();}
function lieux(){if(!D)return;const z=map.getZoom();
 const t=mode==='tractage';
 const on={metro:(t&&chips.tMe)||(mode==='pap'&&chips.metro&&z>=14.75),marches:(t&&chips.tMa)||(mode==='pap'&&z>=15.5),grands:t&&chips.tSu,pieds:t&&chips.tPi};
 Object.entries(lieuxL).forEach(([k,l])=>{if(on[k]&&!map.hasLayer(l))l.addTo(map);if(!on[k]&&map.hasLayer(l))map.removeLayer(l);});}
function noms(){nomsL.clearLayers();bvlL.clearLayers();stnL.clearLayers();if(!D)return;const z=map.getZoom(),b=map.getBounds().pad(.1);
 if(z>=(mode==='boitage'?14.75:15)){let n=0;for(const x of D.fond.noms){if(n>160)break;if(z<16&&x[4]<500&&mode!=='boitage')continue;if(!b.contains([x[1],x[0]]))continue;n++;
  nomsL.addLayer(L.marker([x[1],x[0]],{pane:'noms',interactive:false,icon:L.divIcon({className:'',iconSize:[0,0],html:`<div class="nm" style="transform:translate(-50%,-50%) rotate(${x[2]}deg)">${esc(x[3])}</div>`})}));}}
 if(mode==='pap'&&chips.zones&&z>=15.25){if(!D._bc)D._bc=D.bureaux.map(f=>L.geoJSON(f).getBounds().getCenter());D.bureaux.forEach((f,j)=>{const c=D._bc[j];if(!b.contains(c))return;
  bvlL.addLayer(L.marker(c,{pane:'noms',interactive:false,icon:L.divIcon({className:'',iconSize:[0,0],html:`<div class="bvl" style="transform:translate(-50%,-50%)">${esc(f.properties.id)}</div>`})}));});}
 if(mode==='tractage'&&chips.tMe&&z>=14.5)D.metro.forEach(s=>{if(!b.contains([s.lat,s.lon]))return;stnL.addLayer(L.marker([s.lat,s.lon],{pane:'noms',interactive:false,icon:L.divIcon({className:'',iconSize:[0,0],html:`<div class="stn" style="transform:translate(12px,-50%)">${esc(s.nom)}</div>`})}));});}
/* au zoom, les points ne changent de taille qu'au passage d'un palier : on ne les restyle qu'à ce moment */
map.on('zoomend',()=>{if(D&&adrL&&map.hasLayer(adrL)){if(zBucket(map.getZoom())!==dernZ)stylerAdr();lieux();}});
let mvT=0;map.on('moveend',()=>{if(!D||!adrL||!map.hasLayer(adrL))return;noms();clearTimeout(mvT);mvT=setTimeout(()=>{const v=stack[stack.length-1];if(v&&v.id==='base'&&mode==='pap'&&ONG==='pap')majListe();if(v&&v.id==='base'&&mode==='boitage')majRues();},150);});

/* missions */
/* trois onglets depuis le 25/10/2026 : Porte-à-porte, Liste (adresses à valider, même carte que le porte-à-porte) et Tractage */
function setMode(m,first){if(m==='boitage')m='pap';if(m!=='pap'&&m!=='liste'&&m!=='tractage')m='tractage';ONG=m;m=m==='liste'?'pap':m;mode=m;LS.set('mode',ONG);$('q').value='';$('res').hidden=true;$('qx').hidden=true;
 $('tabbar').querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',b.dataset.m===ONG));
 dessinerChips();filtrer();lieux();noms();majBulles();effLot();sel(null);
 if(papL){if(m==='pap'){if(!map.hasLayer(papL))papL.addTo(map);}else if(map.hasLayer(papL))map.removeLayer(papL);}majMoment();
 ACT_OUV=null;dessinerParcours();if(typeof majEq==='function')majEq();
 if(!wide){if(ONG==='liste')setDet('full');else if(det==='full')setDet('peek');}
 show(vueBase());if(!first){if(det==='peek'&&ONG!=='pap')setDet('half');if(ONG!=='liste')map.flyToBounds(D.bounds,{...pad(),duration:.4});}}
$('tabbar').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.m!==ONG)setMode(b.dataset.m);});
function dessinerChips(){const c=$('chips');c.classList.toggle('t4',mode==='tractage');c.innerHTML=(CHIPS[mode]||[]).map(([k,t,col])=>{
 const sw=k==='prio'?`<i style="background:linear-gradient(90deg,var(--p1),var(--p4))"></i>`:`<i style="background:${col&&col.startsWith('--')?`var(${col})`:col}"></i>`;
 return `<button class="chip glass" data-k="${k}" aria-pressed="${chips[k]}">${sw}${t}</button>`;}).join('');
 c.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{const k=b.dataset.k;chips[k]=!chips[k];b.setAttribute('aria-pressed',chips[k]);
  if(k==='prio'||k==='faites')filtrer();else if(k==='zones'){styler();noms();}else{lieux();noms();majBulles();}
  const v=stack[stack.length-1];if(v&&v.id==='base'&&mode==='pap'&&ONG==='pap')majListe();if(v&&v.id==='base'&&mode==='tractage')render(true);});}
const vueBase=()=>ONG==='liste'?vueListe():mode==='tractage'?vueTractage():vueAccueil();
const lienCR=()=>`<button class="lnk" id="vCR">${I.list} Toutes les actions (${ACTIONS.filter(a=>a.type!=='equipe').length})</button>`;
