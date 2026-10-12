/* ---------------- journal partage : depot prive GitHub JOURNAL-TERRAIN (12/10/2026)
   Connexion par identifiant et mot de passe, geres dans la console. Les cles GitHub ne sont jamais saisies par les militants :
   chaque compte porte sa cle chiffree par son mot de passe (fichier public acces.json du depot de l'appli, PBKDF2 puis AES-GCM),
   dechiffree sur le telephone a la connexion et gardee sur le telephone. Aucune cle en clair dans la page publique.
   Listes de reference = fichier listes.json. Action = une fiche (issue) : etat courant dans le bloc de donnees du corps
   (schema journal-terrain/1), etiquettes circo, type, statut, campagne ; saisies = commentaires ; suppression = fiche fermee
   avec l'etiquette supprimee. Envoi differe de 3 s, file gardee sur le telephone hors connexion, relecture toutes les 90 s. */
var JPRET=false,JM={},jOcc=false,jT=0,jHors=false,jDit=false;
var CLE=LS.get('cle','')||'',refSha=LS.get('refSha','')||'',jRefAEnv=!!LS.get('refAEnv',false);
const JAPI='https://api.github.com/repos/jlucb67/JOURNAL-TERRAIN',JFL='listes.json';
const b64e=s=>{const b=new TextEncoder().encode(s);let x='';for(let i=0;i<b.length;i+=32768)x+=String.fromCharCode.apply(null,b.subarray(i,i+32768));return btoa(x);};
const b64d=s=>new TextDecoder().decode(Uint8Array.from(atob(String(s).replace(/\s/g,'')),c=>c.charCodeAt(0)));
async function gh(meth,ch,corps,ent,base,cle){const k=cle===undefined?CLE:cle,h=Object.assign({Accept:'application/vnd.github+json'},k?{Authorization:'Bearer '+k}:{},corps!==undefined?{'Content-Type':'application/json'}:{},ent||{});
 try{const r=await fetch((base||JAPI)+ch,{method:meth,headers:h,body:corps!==undefined?JSON.stringify(corps):undefined,cache:'no-store'});
  let j=null;if(r.status!==204&&r.status!==304){try{j=await r.json();}catch(e){}}
  return {ok:r.ok,st:r.status,j,h:r.headers,lim:r.status===429||(r.status===403&&r.headers.get('x-ratelimit-remaining')==='0')};}
 catch(e){return {ok:false,st:0,j:null,h:null};}}
const jMsg=r=>r.st===0?'Pas de connexion au journal. Vérifiez le réseau, puis réessayez.':r.st===401?'Accès refusé par le journal : reconnectez-vous, ou demandez un nouveau mot de passe à un administrateur.':r.lim?'Le journal reçoit trop de demandes : réessayez dans quelques minutes.':r.st===403||r.st===404?'Cet accès ne permet pas cette opération.':r.st===-1?'Le fichier des listes du journal est illisible.':'Le journal ne répond pas (erreur '+r.st+'). Réessayez plus tard.';

/* listes de reference : lues a la connexion et a chaque ouverture, ecrites par la console (cle administrateurs) */
function normREF(x){x=x&&typeof x==='object'?x:{};x.v=2;['campagnes','ga','users','materiel'].forEach(k=>{if(!Array.isArray(x[k]))x[k]=[];});
 x.users.forEach(u=>{if(!Array.isArray(u.ga))u.ga=[];if(u.actif===undefined)u.actif=true;});x.ga.forEach(g=>{if(!Array.isArray(g.circos))g.circos=[];});
 x.reglages=Object.assign({delaiFaite:30,delaiFerme:14,taille:100,scrutins:[]},x.reglages||{});return x;}
async function lireListes(){const r=await gh('GET','/contents/'+JFL);if(!r.ok)return r;
 let x;try{x=normREF(JSON.parse(b64d(r.j.content)));}catch(e){return {ok:false,st:-1};}
 REF=x;refSha=r.j.sha;LS.set('ref',REF);LS.set('refSha',refSha);return r;}
async function jEcrireListes(){if(!JPRET||!CLE)return;jRefAEnv=true;LS.set('refAEnv',true);
 const doc=Object.assign({},REF,{schema:'terrain-2027/listes/1',maj:new Date().toISOString(),par:moi().nom});
 const r=await gh('PUT','/contents/'+JFL,{message:'Listes de référence modifiées dans l\'appli par '+moi().nom,content:b64e(JSON.stringify(doc,null,1)+'\n'),sha:refSha||undefined});
 if(r.ok){refSha=r.j.content.sha;LS.set('refSha',refSha);jRefAEnv=false;LS.set('refAEnv',false);return;}
 if(r.st===0){toast('Hors connexion : les listes partiront au retour du réseau.');return;}
 jRefAEnv=false;LS.set('refAEnv',false);if(r.st===401){cleRefusee();return;}
 await lireListes();toast(r.st===409||r.st===422?'Les listes avaient changé entre-temps : elles sont rechargées. Refaites la modification.':r.st===403||r.st===404?'Modification refusée : il faut la clé administrateurs.':jMsg(r));rafraichir();}

/* actions */
const jSer=a=>JSON.stringify(a);
const jCleS=s=>s.par+'|'+s.le+'|'+s.quoi;
const jCirco=k=>k===1?'1re':k+'e';
const jDH=s=>{const d=toD(s);return d?`${p2(d.getDate())}/${p2(d.getMonth()+1)}/${d.getFullYear()}${/T\d/.test(s)?' '+p2(d.getHours())+':'+p2(d.getMinutes()):''}`:'';};
function jChargerMeta(k){JM=LS.get('jm'+k,{})||{};}
function jSauverMeta(k){LS.set('jm'+k,JM);}
const jEtiq=(a,k)=>[`circo:${pad2(k)}`,`type:${a.type}`,`statut:${a.statut==='faite'?'faite':'a_faire'}`].concat(a.campagne?[`campagne:${a.campagne}`]:[]);
const jTitre=(a,k)=>`${TYPES_C[a.type]||a.type} · ${a.nom||'sans nom'} · ${jCirco(k)} circo`;
function jDoc(a,k,rev){const c=JSON.parse(jSer(a));delete c.no;
 (c.etapes||[]).forEach(e=>{if(e.lieu&&e.lieu.t==='adresse'&&!e.lieu.ll&&D&&D.k===k){const i=BYID[e.lieu.id];if(i!=null){const x=D.adresses[i];e.lieu.ll=[+(+x[1]).toFixed(6),+(+x[0]).toFixed(6)];e.lieu.bv=x[8];}}});
 return {schema:'journal-terrain/1',circo:k,rev,action:c};}
function jCorps(a,k,rev){return [`Action de terrain saisie dans l'appli Terrain Paris 2027. Le bloc de données en bas fait foi : ne pas le modifier à la main.`,'',
 `- Type : ${TYPES[a.type]||a.type}`,`- Circonscription : ${jCirco(k)}`,`- Campagne : ${campNom(a.campagne)}`,`- Groupe d'action : ${(a.ga||[]).map(gaNom).join(', ')||'aucun'}`,
 `- Statut : ${a.statut==='faite'?'faite'+(a.faite_le?' le '+jDH(a.faite_le):''):'à faire'+(a.prevue?', prévue le '+jDH(a.prevue):'')}`,
 `- Étapes : ${(a.etapes||[]).length}`,`- Créée par ${userNom(a.cree_par)} le ${jDH(a.cree_le)}`,'','```json',JSON.stringify(jDoc(a,k,rev)),'```'].join('\n');}
function jLire(is){const m=/```json\s*\n([\s\S]*?)\n```/.exec(is.body||'');if(!m)return null;
 try{const x=JSON.parse(m[1]);return x&&x.schema==='journal-terrain/1'&&x.action&&x.action.id?x:null;}catch(e){return null;}}
function jNotes(a,ancien){const vu=new Set(((ancien&&ancien.saisies)||[]).map(jCleS));
 return (a.saisies||[]).filter(s=>!vu.has(jCleS(s))).map(s=>`Saisie : ${userNom(s.par)} · ${jDH(s.le)} · ${s.quoi}`).join('\n');}
/* deux telephones sur la meme action : etapes reunies (la plus recente gagne), saisies reunies, le reste vient de celui qui envoie */
function jFusion(loc,dist){const r=JSON.parse(jSer(loc)),cle=e=>(e.lieu&&e.lieu.t)+'|'+(e.lieu&&e.lieu.id),dm={},vus=new Set();
 (dist.etapes||[]).forEach(e=>{dm[cle(e)]=e;});
 r.etapes=(r.etapes||[]).map(e=>{const k=cle(e);vus.add(k);const d=dm[k];return d&&(d.le||'')>(e.le||'')?d:e;});
 (dist.etapes||[]).forEach(e=>{if(!vus.has(cle(e)))r.etapes.push(e);});
 const sm={};(dist.saisies||[]).concat(r.saisies||[]).forEach(s=>{sm[jCleS(s)]=s;});
 r.saisies=Object.values(sm).sort((x,y)=>String(x.le||'').localeCompare(String(y.le||'')));return r;}
/* remplacement en place : un formulaire ouvert garde ses objets, ses saisies ne se perdent pas */
function jRemplacer(loc,ra){const cle=e=>(e.lieu&&e.lieu.t)+'|'+(e.lieu&&e.lieu.id),anc={};(loc.etapes||[]).forEach(e=>{anc[cle(e)]=e;});
 const et=(ra.etapes||[]).map(e=>{const o=anc[cle(e)];if(o&&o!==e){Object.keys(o).forEach(x=>delete o[x]);return Object.assign(o,e);}return e;});
 if(loc!==ra){Object.keys(loc).forEach(x=>delete loc[x]);Object.assign(loc,ra);}loc.etapes=et;return loc;}
async function jCreer(a,k){const snap=JSON.parse(jSer(a)),lab=jEtiq(snap,k);
 let r=await gh('POST','/issues',{title:jTitre(snap,k),body:jCorps(snap,k,1),labels:lab});
 if(r.st===422)r=await gh('POST','/issues',{title:jTitre(snap,k),body:jCorps(snap,k,1)});
 if(!r.ok)return r;const no=r.j.number;
 if(!(r.j.labels||[]).length)await gh('POST',`/issues/${no}/labels`,{labels:lab});
 if(snap.statut==='faite')await gh('PATCH',`/issues/${no}`,{state:'closed',state_reason:'completed'});
 a.no=no;snap.no=no;JM[a.id]={no,rev:1,s:jSer(snap)};jSauverMeta(k);return r;}
async function jMaj(a,m,k){const snap=JSON.parse(jSer(a)),g=await gh('GET',`/issues/${m.no}`);
 if(g.st===404||g.st===410){delete a.no;delete JM[a.id];return jCreer(a,k);}
 if(!g.ok)return g;
 const x=jLire(g.j);let fin=snap,rev=1,ancien=null;
 if(x){rev=(x.rev||0)+1;ancien=x.action;if(m.rev==null||x.rev!==m.rev)fin=jFusion(snap,x.action);}
 fin.no=m.no;
 const r=await gh('PATCH',`/issues/${m.no}`,Object.assign({title:jTitre(fin,k),body:jCorps(fin,k,rev),labels:jEtiq(fin,k)},fin.statut==='faite'?{state:'closed',state_reason:'completed'}:{state:'open'}));
 if(!r.ok)return r;
 const notes=jNotes(fin,ancien);if(notes)await gh('POST',`/issues/${m.no}/comments`,{body:notes});
 if(fin!==snap){const i=ACTIONS.findIndex(y=>y.id===a.id);if(i>=0&&jSer(ACTIONS[i])===jSer(Object.assign(JSON.parse(jSer(snap)),{no:m.no})))fin=jRemplacer(ACTIONS[i],fin);}
 JM[a.id]={no:m.no,rev,s:jSer(fin)};jSauverMeta(k);return r;}
async function jSupprimer(m,k){let a=null;try{a=JSON.parse(m.s);}catch(e){}
 const r=await gh('PATCH',`/issues/${m.no}`,{state:'closed',state_reason:'not_planned',labels:(a?jEtiq(a,k):[`circo:${pad2(k)}`]).concat(['supprimee'])});
 if(r.ok)await gh('POST',`/issues/${m.no}/comments`,{body:`Supprimée par ${moi().nom} · ${jDH(isoD(new Date()))}`});return r;}
const jSale=a=>{const m=JM[a.id];return !m||m.s!==jSer(a);};
function jEnAttente(){if(!D)return 0;return ACTIONS.filter(jSale).length+Object.keys(JM).filter(id=>!ACTIONS.some(a=>a.id===id)).length;}
function jPlanifier(){if(!JPRET)return;clearTimeout(jT);jT=setTimeout(jPousser,3000);}
async function jPousser(){if(!JPRET||!CLE||!D)return 0;if(jOcc){jPlanifier();return 0;}jOcc=true;const k=D.k,A=ACTIONS;let err=null,n=0;
 try{for(const id of Object.keys(JM)){if(A.some(a=>a.id===id))continue;const m=JM[id];
   if(m.no){const r=await jSupprimer(m,k);if(!r.ok&&r.st!==404&&r.st!==410){err=r;break;}}
   delete JM[id];jSauverMeta(k);n++;}
  if(!err)for(const a of A.slice()){if(!jSale(a))continue;const m=JM[a.id];
   const r=(m&&m.no)||a.no?await jMaj(a,m||{no:a.no},k):await jCreer(a,k);if(!r.ok){err=r;break;}n++;}}
 finally{jOcc=false;}
 if(D&&D.k===k&&A===ACTIONS){LS.set('actions'+k,ACTIONS);if(n){deriver();stylerAdr();}}
 jEtat(err);return n;}
function jAppliquer(is,k){const x=jLire(is);if(!x||x.circo!==k)return false;const ra=x.action;ra.no=is.number;
 const supp=(is.labels||[]).some(l=>(l&&l.name||l)==='supprimee'),i=ACTIONS.findIndex(a=>a.id===ra.id),m=JM[ra.id];
 if(supp){delete JM[ra.id];if(i>=0){ACTIONS.splice(i,1);return true;}return false;}
 if(i<0){if(m)return false;ACTIONS.push(ra);JM[ra.id]={no:is.number,rev:x.rev,s:jSer(ra)};return true;}
 if(m&&m.s!==jSer(ACTIONS[i]))return false;
 if(m&&m.rev===x.rev&&m.no===is.number)return false;
 jRemplacer(ACTIONS[i],ra);JM[ra.id]={no:is.number,rev:x.rev,s:jSer(ACTIONS[i])};return true;}
async function jTirer(){if(!JPRET||!CLE||!D||jOcc)return 0;jOcc=true;const k=D.k;let chg=0;
 try{const q=`/issues?labels=circo:${pad2(k)}&state=all&sort=updated&direction=desc&per_page=100`,et=LS.get('jet'+k,'');
  let r=await gh('GET',q,undefined,et?{'If-None-Match':et}:{});
  if(r.st===304){jEtat(null);return 0;}if(!r.ok){jEtat(r);return 0;}
  const vu=LS.get('jvu'+k,''),et2=(r.h&&r.h.get('ETag'))||'';let tout=r.j||[],p=1;
  while(r.ok&&(r.j||[]).length===100&&(!vu||r.j[r.j.length-1].updated_at>=vu)){p++;r=await gh('GET',q+'&page='+p);if(r.ok)tout=tout.concat(r.j||[]);}
  if(!r.ok){jEtat(r);return 0;}
  let mx=vu;for(const is of tout){if(!D||D.k!==k)break;if(is.pull_request||(vu&&is.updated_at<vu))continue;if(is.updated_at>mx)mx=is.updated_at;if(jAppliquer(is,k))chg++;}
  if(D&&D.k===k){LS.set('jet'+k,et2);LS.set('jvu'+k,mx);jSauverMeta(k);if(chg){LS.set('actions'+k,ACTIONS);deriver();stylerAdr();dessinerParcours();rafraichir();}}
  jEtat(null);}
 finally{jOcc=false;}
 return chg;}
function jEtat(r){const avant=jHors;jHors=!!(r&&r.st===0);
 if(r&&r.st===401){cleRefusee();return;}
 if(jHors){if(!avant)toast('Hors connexion : vos saisies restent sur ce téléphone et partiront au retour du réseau.');return;}
 if(r){if(!jDit){jDit=true;toast(jMsg(r));}return;}
 jDit=false;}
function rafraichir(){const v=stack[stack.length-1];if(v&&['base','actions','console','users','controles'].includes(v.id))render(true);}
function jOuvert(n){jChargerMeta(n);jTirer().then(()=>{if(jEnAttente())jPousser();});}
function cleRefusee(){if(!CLE&&!$('login').hidden)return;oublierAcces();fermerMenu();
 ecranConnexion(()=>{if(D){jTirer().then(()=>jPousser());}else demarrer();},'Votre accès a changé : reconnectez-vous.');}

/* ---------------- acces : identifiant et mot de passe. Fichier public acces.json du depot de l'appli :
   {v, comptes:{<empreinte de l'identifiant>:{s,iv,c,n}}} ; chaque compte chiffre {id, p (profil), k (cle), ku (cle utilisateurs,
   administrateurs seulement)} par son mot de passe. Lecture sans cle ; ecriture par la console, avec la cle administrateurs. */
const JAPP='https://api.github.com/repos/jlucb67/terrain',JACC='acces.json',ITER=600000;
const u8b64=u=>{let x='';for(let i=0;i<u.length;i+=32768)x+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(x);};
const b64u8=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const normLogin=l=>String(l||'').trim().toLowerCase();
async function idLogin(l){const h=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('terrain2027|'+normLogin(l))));return [...h.slice(0,16)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function cleMdp(mdp,sel,n){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(mdp),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:sel,iterations:n},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function chiffrer(o,mdp){const sel=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),k=await cleMdp(mdp,sel,ITER);
 return {s:u8b64(sel),iv:u8b64(iv),n:ITER,c:u8b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(JSON.stringify(o)))))};}
async function dechiffrer(b,mdp){const k=await cleMdp(mdp,b64u8(b.s),b.n||ITER);return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:b64u8(b.iv)},k,b64u8(b.c))));}
const accesVide=()=>({v:1,comptes:{}});
async function lireAcces(){const r=await gh('GET','/contents/'+JACC,undefined,undefined,JAPP,'');
 if(r.ok){try{return {ok:true,a:JSON.parse(b64d(r.j.content))};}catch(e){return {ok:false,st:-1};}}
 if(r.st===404)return {ok:true,a:accesVide()};
 try{const q=await fetch(JACC+'?t='+Date.now(),{cache:'no-store'});if(q.ok)return {ok:true,a:await q.json()};if(q.status===404)return {ok:true,a:accesVide()};}catch(e){}
 return r;}
/* ecriture : relire, modifier, renvoyer ; une nouvelle tentative si un autre administrateur a ecrit entre-temps */
async function ecrireAcces(modif,message,cle){for(let t=0;t<3;t++){
  const g=await gh('GET','/contents/'+JACC,undefined,undefined,JAPP,cle);let a=accesVide(),sha;
  if(g.ok){a=JSON.parse(b64d(g.j.content));sha=g.j.sha;}else if(g.st!==404)return g;
  a.comptes=a.comptes||{};await modif(a);
  const r=await gh('PUT','/contents/'+JACC,{message,content:b64e(JSON.stringify(a,null,1)+'\n'),sha},undefined,JAPP,cle);
  if(r.ok||(r.st!==409&&r.st!==422))return r;}
 return {ok:false,st:409};}
const msgAcces=r=>r.st===0?'Pas de connexion. Vérifiez le réseau, puis réessayez.':r.st===401?'La clé administrateurs est refusée par GitHub.':r.st===403||r.st===404?'La clé administrateurs n\'a pas accès au dépôt de l\'appli (terrain) : ajoutez-le à cette clé dans GitHub.':'Enregistrement des accès impossible (erreur '+r.st+').';
function oublierAcces(){CLE='';LS.set('cle','');LS.set('cleU','');LS.set('session',null);}
const mdpPropose=()=>{const a='abcdefghjkmnpqrstuvwxyz23456789',v=crypto.getRandomValues(new Uint8Array(10));return [...v].map(x=>a[x%a.length]).join('');};
/* compte d'une personne : sa cle selon son profil ; un administrateur porte aussi la cle utilisateurs pour creer des comptes */
async function blocCompte(u,mdp){const adm=u.profil==='admin',cu=LS.get('cleU','')||'';
 return chiffrer(adm?{id:u.id,p:'admin',k:CLE,ku:cu}:{id:u.id,p:'utilisateur',k:cu},mdp);}

/* connexion : identifiant et mot de passe ; la premiere fois, un administrateur colle les deux cles (mise en place) */
function connecte(){const x=LS.get('session',null);return CLE&&x&&REF.users.some(u=>u.id===x.id&&u.actif)?x:null;}
function ecranConnexion(apres,msg){const o=$('login'),f=$('lgF'),t=$('lgT');o.hidden=false;let acces=null;
 const err=m=>{const e=$('lgE');if(e){e.textContent=m||'';e.hidden=!m;}};
 const fini=()=>{appliquerTheme();o.hidden=true;apres();};
 const vueConnexion=m=>{t.textContent='Connexion';
  f.innerHTML=`<div class="sub">Une seule fois sur ce téléphone.</div><label class="fld" for="lgL">Identifiant<input id="lgL" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"></label><label class="fld" for="lgP">Mot de passe<input id="lgP" type="password" autocomplete="current-password"></label><div class="lg-err" id="lgE" hidden></div><div class="btns"><button class="btn primary" id="lgGo">Se connecter</button></div><button class="lnk2" id="lgM" hidden>Première mise en place</button>`;
  err(m);const go=$('lgGo');
  lireAcces().then(r=>{if(r.ok){acces=r.a;if(!Object.keys(acces.comptes||{}).length){const b=$('lgM');if(b){b.hidden=false;b.onclick=vueMiseEnPlace;}}}});
  $('lgP').onkeydown=e=>{if(e.key==='Enter')go.click();};
  go.onclick=async()=>{const l=$('lgL').value,p=$('lgP').value;if(!normLogin(l)||!p){err('Indiquez votre identifiant et votre mot de passe.');return;}
   go.disabled=true;go.textContent='Connexion…';err('');
   try{if(!acces){const r=await lireAcces();if(!r.ok){err(jMsg(r));return;}acces=r.a;}
    const b=(acces.comptes||{})[await idLogin(l)];let x=null;if(b){try{x=await dechiffrer(b,p);}catch(e){}}
    if(!x){err('Identifiant ou mot de passe incorrect.');return;}
    const anc=CLE;CLE=x.k;const r=await lireListes();
    if(!r.ok){CLE=anc;err(r.st===401?'Cet accès a été retiré : demandez un nouveau mot de passe à un administrateur.':jMsg(r));return;}
    const u=REF.users.find(v=>v.id===x.id);if(!u||!u.actif){CLE=anc;err('Accès suspendu : voyez avec un administrateur.');return;}
    LS.set('cle',CLE);LS.set('cleU',x.ku||'');MOI=x.id;LS.set('moi',MOI);LS.set('session',{id:x.id,login:normLogin(l),le:isoD(new Date())});fini();}
   finally{go.disabled=false;go.textContent='Se connecter';}};};
 /* mise en place : les deux cles une seule fois, puis le compte de l'administrateur ; tout est chiffre dans acces.json */
 const vueMiseEnPlace=()=>{t.textContent='Première mise en place';
  f.innerHTML=`<div class="sub">Une seule fois, par un administrateur. Les clés restent chiffrées par votre mot de passe.</div><label class="fld" for="mKA">Clé administrateurs<input id="mKA" type="password" autocomplete="off"></label><label class="fld" for="mKU">Clé utilisateurs<input id="mKU" type="password" autocomplete="off"></label><div class="lg-err" id="lgE" hidden></div><div class="btns"><button class="btn primary" id="mV">Vérifier les clés</button></div><div id="mS"></div><button class="lnk2" id="mR">Retour à la connexion</button>`;
  $('mR').onclick=()=>vueConnexion();
  $('mV').onclick=async()=>{const ka=$('mKA').value.trim(),ku=$('mKU').value.trim();if(!ka||!ku){err('Collez les deux clés.');return;}err('');
   const ru=await gh('GET','/contents/'+JFL,undefined,undefined,JAPI,ku);if(!ru.ok){err(ru.st===0?jMsg(ru):'La clé utilisateurs est refusée.');return;}
   const anc=CLE;CLE=ka;const ra=await lireListes();if(!ra.ok){CLE=anc;err(ra.st===0?jMsg(ra):'La clé administrateurs est refusée.');return;}
   const adm=REF.users.filter(u=>u.actif&&u.profil==='admin');
   $('mS').innerHTML=`<label class="fld" for="mN">Votre nom<select id="mN">${adm.map(u=>`<option value="${esc(u.id)}">${esc(u.nom)}</option>`).join('')}</select></label><label class="fld" for="mL">Votre identifiant<input id="mL" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"></label><label class="fld" for="mP">Votre mot de passe (7 caractères au moins)<input id="mP" type="password" autocomplete="new-password"></label><div class="btns"><button class="btn primary" id="mC">Créer mon accès</button></div>`;
   $('mV').hidden=true;$('mKA').disabled=true;$('mKU').disabled=true;
   $('mC').onclick=async()=>{const id=$('mN').value,l=normLogin($('mL').value),p=$('mP').value;
    if(!l){err('Choisissez un identifiant.');return;}if(p.length<7){err('Le mot de passe doit faire 7 caractères au moins.');return;}
    const b=$('mC');b.disabled=true;b.textContent='Enregistrement…';err('');
    try{const u=REF.users.find(v=>v.id===id),bloc=await chiffrer({id,p:'admin',k:ka,ku},p),cle=await idLogin(l);
     const r=await ecrireAcces(a=>{a.comptes[cle]=bloc;},'Accès : mise en place par '+u.nom,ka);
     if(!r.ok){err(msgAcces(r));return;}
     CLE=ka;LS.set('cle',ka);LS.set('cleU',ku);MOI=id;LS.set('moi',MOI);LS.set('session',{id,login:l,le:isoD(new Date())});
     u.login=l;sauverREF();fini();toast('Accès créé : à l\'avenir, connectez-vous avec « '+l+' » et votre mot de passe.');}
    finally{b.disabled=false;b.textContent='Créer mon accès';}};};};
 vueConnexion(msg);}
/* console : identifiant et mot de passe d'une personne ; suspendre retire son compte */
async function majCompte(x,ancien,mdp){const cles=[];
 if(ancien&&ancien.login&&(ancien.login!==x.login||!x.actif||mdp))cles.push(['-',await idLogin(ancien.login)]);
 if(x.login&&x.actif&&mdp)cles.push(['+',await idLogin(x.login),await blocCompte(x,mdp)]);
 if(!cles.length)return {ok:true};
 return ecrireAcces(a=>{cles.forEach(([o,c,b])=>{if(o==='-')delete a.comptes[c];else a.comptes[c]=b;});},'Accès : '+x.nom+' (console, par '+moi().nom+')');}

/* versions precedentes : essais de la maquette mis de cote, cle collee oubliee (la connexion passe par l'identifiant) */
if(!LS.get('jv',0)){try{for(let k=1;k<=18;k++)['actions','cr','pap'].forEach(p=>{const v=localStorage.getItem(p+k);if(v!=null){localStorage.setItem(p+'_maquette'+k,v);localStorage.removeItem(p+k);}});
 const r=localStorage.getItem('ref');if(r!=null){localStorage.setItem('ref_maquette',r);localStorage.removeItem('ref');}}catch(e){}
 LS.set('session',null);LS.set('jv',1);}
if(LS.get('jv',0)<2){const x=LS.get('session',null);if(!(x&&x.login))oublierAcces();LS.set('jv',2);}
JPRET=true;
setInterval(()=>{if(document.visibilityState!=='visible'||!connecte())return;if(jEnAttente())jPousser();else jTirer();},90000);
addEventListener('online',()=>{if(!connecte())return;jPousser().then(()=>jTirer());if(jRefAEnv)jEcrireListes();});
document.addEventListener('visibilitychange',()=>{if(!connecte())return;if(document.visibilityState==='visible')jTirer();else if(jEnAttente()){clearTimeout(jT);jPousser();}});
function jDemarrer(){lireListes().then(r=>{if(r.st===401)cleRefusee();else if(r.ok&&!connecte())deconnecter();else if(jRefAEnv)jEcrireListes();});}
if(connecte()){demarrer();jDemarrer();}else ecranConnexion(demarrer);
