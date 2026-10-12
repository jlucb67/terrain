/* ---------------- journal partage : depot prive GitHub JOURNAL-TERRAIN (12/10/2026)
   Cle d'acces saisie une fois sur le telephone (collee, ou code scanne), gardee sur le telephone, jamais dans la page publique.
   Listes de reference = fichier listes.json. Action = une fiche (issue) : etat courant dans le bloc de donnees du corps
   (schema journal-terrain/1), etiquettes circo, type, statut, campagne ; saisies = commentaires ; suppression = fiche fermee
   avec l'etiquette supprimee. Envoi differe de 3 s, file gardee sur le telephone hors connexion, relecture toutes les 90 s. */
var JPRET=false,JM={},jOcc=false,jT=0,jHors=false,jDit=false;
var CLE=LS.get('cle','')||'',refSha=LS.get('refSha','')||'',jRefAEnv=!!LS.get('refAEnv',false);
const JAPI='https://api.github.com/repos/jlucb67/JOURNAL-TERRAIN',JFL='listes.json';
const b64e=s=>{const b=new TextEncoder().encode(s);let x='';for(let i=0;i<b.length;i+=32768)x+=String.fromCharCode.apply(null,b.subarray(i,i+32768));return btoa(x);};
const b64d=s=>new TextDecoder().decode(Uint8Array.from(atob(String(s).replace(/\s/g,'')),c=>c.charCodeAt(0)));
async function gh(meth,ch,corps,ent){const h=Object.assign({Accept:'application/vnd.github+json',Authorization:'Bearer '+CLE},corps!==undefined?{'Content-Type':'application/json'}:{},ent||{});
 try{const r=await fetch(JAPI+ch,{method:meth,headers:h,body:corps!==undefined?JSON.stringify(corps):undefined,cache:'no-store'});
  let j=null;if(r.status!==204&&r.status!==304){try{j=await r.json();}catch(e){}}
  return {ok:r.ok,st:r.status,j,h:r.headers,lim:r.status===429||(r.status===403&&r.headers.get('x-ratelimit-remaining')==='0')};}
 catch(e){return {ok:false,st:0,j:null,h:null};}}
const jMsg=r=>r.st===0?'Pas de connexion au journal. Vérifiez le réseau, puis réessayez.':r.st===401?'Clé refusée : elle est fausse, ou elle a été changée. Demandez la nouvelle à un administrateur.':r.lim?'Le journal reçoit trop de demandes : réessayez dans quelques minutes.':r.st===403||r.st===404?'Cette clé ne donne pas accès au journal.':r.st===-1?'Le fichier des listes du journal est illisible.':'Le journal ne répond pas (erreur '+r.st+'). Réessayez plus tard.';
const lireCle=v=>{v=String(v||'').trim();const m=/[#&?]cle=([^&\s]+)/.exec(v);return m?decodeURIComponent(m[1]):v;};

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
function cleRefusee(){if(!CLE&&!$('login').hidden)return;CLE='';LS.set('cle','');LS.set('session',null);fermerMenu();
 ecranConnexion(()=>{if(D){jTirer().then(()=>jPousser());}else demarrer();},'La clé a été changée ou retirée. Saisissez la nouvelle clé.');}

/* connexion : la cle d'abord (elle ouvre les listes), puis le nom */
function connecte(){const x=LS.get('session',null);return CLE&&x&&REF.users.some(u=>u.id===x.id&&u.actif)?x:null;}
function ecranConnexion(apres,msg){const o=$('login'),sel=$('lgN'),e=$('lgE'),ki=$('lgK'),go=$('lgGo');o.hidden=false;
 const err=t=>{e.textContent=t||'';e.hidden=!t;};let ok=false,tmr=0,enCours=null;err(msg);ki.value='';
 const noms=b=>{sel.disabled=!b;sel.innerHTML=b?'<option value="">Choisissez votre nom</option>'+REF.users.filter(u=>u.actif).map(u=>`<option value="${esc(u.id)}">${esc(u.nom)}</option>`).join(''):'<option value="">D\'abord la clé d\'accès</option>';};
 const marque=()=>{ki.placeholder=CLE?'Clé enregistrée sur ce téléphone':'Collez la clé ou scannez le code';};
 const verifier=c=>enCours=verif(c);const verif=async c=>{err('');go.disabled=true;const anc=CLE;CLE=c;const r=await lireListes();go.disabled=false;
  if(r.ok){LS.set('cle',CLE);ok=true;ki.value='';noms(true);marque();return true;}
  if(r.st===0&&c===anc&&LS.get('ref',null)){ok=true;noms(true);err('Pas de connexion : listes gardées sur ce téléphone.');return true;}
  CLE=anc;ok=false;noms(false);marque();err(jMsg(r));return false;};
 noms(false);marque();if(CLE)verifier(CLE);
 ki.oninput=()=>{clearTimeout(tmr);const c=lireCle(ki.value);if(c.length>=30)tmr=setTimeout(()=>verifier(c),300);};
 $('lgS').onclick=()=>scanner(c=>verifier(c));
 go.onclick=async()=>{clearTimeout(tmr);if(enCours)await enCours;const c=lireCle(ki.value);if(c&&c!==CLE&&!(await verifier(c)))return;
  if(!CLE||!ok){err(e.textContent||'Saisissez d\'abord la clé d\'accès.');return;}
  const id=sel.value;if(!id){err('Choisissez votre nom.');return;}
  MOI=id;LS.set('moi',MOI);LS.set('session',{id,le:isoD(new Date())});appliquerTheme();o.hidden=true;err('');apres();};}
/* scan dans l'appli quand le navigateur sait lire les codes ; sinon l'appareil photo du telephone ouvre le lien du code */
async function scanner(fn){if(!('BarcodeDetector' in window)||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('Visez le code avec l\'appareil photo du téléphone : l\'appli s\'ouvre avec la clé.');return;}
 let st=null,fin=false;const ov=document.createElement('div');ov.className='scan';ov.innerHTML='<video playsinline muted></video><div class="scan-c"></div><button class="btn line" type="button">Annuler</button>';document.body.appendChild(ov);
 const v=ov.querySelector('video'),stop=()=>{fin=true;if(st)st.getTracks().forEach(t=>t.stop());ov.remove();};ov.querySelector('button').onclick=stop;
 try{st=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});v.srcObject=st;await v.play();const bd=new BarcodeDetector({formats:['qr_code']});
  const tour=async()=>{if(fin)return;try{const c=await bd.detect(v);if(c&&c[0]&&c[0].rawValue){const k=lireCle(c[0].rawValue);stop();fn(k);return;}}catch(e){}setTimeout(tour,250);};tour();}
 catch(e){stop();toast('Appareil photo indisponible : visez le code avec l\'appareil photo du téléphone, ou collez la clé.');}}
/* console : code a montrer pour donner la cle ; l'ecran ne l'enregistre nulle part. Generateur de codes QR (Kazuhiko Arase,
   licence MIT) charge depuis cdnjs, empreinte verifiee par le navigateur. */
function chargerQR(fn){if(window.qrcode){fn();return;}const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';s.integrity='sha384-mZT2gIty7ZDdOGkxfP6joZcYdMW1Jvj9dRlfpTmaJAKKXTqzygtB22k7FLe+KZC1';s.crossOrigin='anonymous';s.onload=fn;s.onerror=()=>toast('Le générateur de code n\'a pas pu être chargé. Vérifiez la connexion.');document.head.appendChild(s);}
function vueCode(){return {id:'code',html:()=>{let h=headHTML('Code d\'accès','La personne le vise avec l\'appareil photo de son téléphone : l\'appli s\'ouvre avec la clé.',true);
  h+=`<label class="fld" for="ck">Clé à transmettre (utilisateurs ou administrateurs)<input id="ck" type="password" autocomplete="off" placeholder="Collez la clé"></label><div class="qr" id="qr"></div>`;
  h+=`<div class="hint">Cet écran n'enregistre la clé nulle part.</div>`;return h;},
 after:()=>{const i=$('ck'),z=$('qr');i.oninput=()=>{const c=lireCle(i.value);if(c.length<20){z.innerHTML='';return;}
  chargerQR(()=>{const q=qrcode(0,'M');q.addData(location.origin+location.pathname+'#cle='+encodeURIComponent(c));q.make();z.innerHTML=q.createSvgTag({cellSize:6,margin:4,scalable:true});});};}};}

/* premier lancement relie au journal : les essais de la maquette restent sur le telephone, mis de cote, jamais envoyes */
if(!LS.get('jv',0)){try{for(let k=1;k<=18;k++)['actions','cr','pap'].forEach(p=>{const v=localStorage.getItem(p+k);if(v!=null){localStorage.setItem(p+'_maquette'+k,v);localStorage.removeItem(p+k);}});
 const r=localStorage.getItem('ref');if(r!=null){localStorage.setItem('ref_maquette',r);localStorage.removeItem('ref');}}catch(e){}
 LS.set('session',null);LS.set('jv',1);}
/* cle recue par le lien d'un code scanne : gardee sur le telephone, retiree de l'adresse */
(()=>{const m=/[#&]cle=([^&]+)/.exec(location.hash||'');if(!m)return;const c=decodeURIComponent(m[1]);try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}if(c&&c!==CLE){CLE=c;LS.set('cle',c);}})();
JPRET=true;
setInterval(()=>{if(document.visibilityState!=='visible'||!connecte())return;if(jEnAttente())jPousser();else jTirer();},90000);
addEventListener('online',()=>{if(!connecte())return;jPousser().then(()=>jTirer());if(jRefAEnv)jEcrireListes();});
document.addEventListener('visibilitychange',()=>{if(!connecte())return;if(document.visibilityState==='visible')jTirer();else if(jEnAttente()){clearTimeout(jT);jPousser();}});
function jDemarrer(){lireListes().then(r=>{if(r.st===401)cleRefusee();else if(r.ok&&!connecte())deconnecter();else if(jRefAEnv)jEcrireListes();});}
if(connecte()){demarrer();jDemarrer();}else ecranConnexion(demarrer);
