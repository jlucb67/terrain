/* ---------------- historique et export (v15, 25/10/2026). JL : « les militants doivent pouvoir ajouter leur historique
   d'adresses déjà faites. Aussi extraire quand ils veulent les adresses faites en fichier genre Excel ». Arbitrages JL du
   25/10/2026 : saisie à la main ET import de fichier ; export en .csv (s'ouvre dans Excel). Trois boutons en haut de la Liste.
   Un ancien passage = une action PAP « Ancien passage du … », faite à cette date, par date et par GA (origine : historique). */
const I7={hist:sv('<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'),ul:sv('<path d="M12 15V4.5M7.5 9 12 4.5 16.5 9M5 19.5h14"/>'),
 dl:sv('<path d="M12 4.5V15M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>'),copy:sv('<rect x="8.5" y="8.5" width="10.5" height="10.5" rx="2"/><path d="M5 15.5V6a1 1 0 011-1h9.5"/>')};
const qaHTML=()=>`<div class="qa" role="group" aria-label="Historique et export"><button id="qAnc">${I7.hist}Ancien passage</button><button id="qImp">${I7.ul}Importer</button><button id="qExp">${I7.dl}Télécharger</button></div>`;
function lierQA(){const a=$('qAnc');if(!a)return;a.onclick=()=>{setDet('full');detail(vueAncien());};$('qExp').onclick=()=>{setDet('full');detail(vueExport());};
 $('qImp').onclick=()=>{setDet('full');detail(vueImport(IMP));};}
const hier=()=>{const d=new Date();d.setDate(d.getDate()-1);return isoD(d).slice(0,10);};
const auj10=()=>isoD(new Date()).slice(0,10);
const fmtD=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'';

/* enregistre des passages anciens : une action par date et par GA, ajoutée à celle du même jour si elle existe déjà */
function enregistrerHisto(L){let n=0;const G={};
 L.forEach(x=>{const k=x.q+'|'+(x.ga||'');(G[k]=G[k]||[]).push(x);});
 Object.entries(G).forEach(([k,l])=>{const [q,ga]=k.split('|'),le=q+'T12:00';
  let a=ACTIONS.find(y=>y.type==='pap'&&y.origine&&y.origine.lot==='historique'&&y.faite_le===le&&(y.ga[0]||'')===ga&&y.cree_par===moi().id&&y.campagne===campDefaut());
  if(!a){a=nouvelleAction('pap',{nom:'Ancien passage du '+fmtJ(le),statut:'faite',faite_le:le,ga:ga?[ga]:[],origine:{lot:'historique'}});ACTIONS.push(a);saisie(a,'création : ancien passage');}
  l.forEach(x=>{const id=AID(x.i);if(a.etapes.some(e=>e.lieu.id===id))return;a.etapes.push(Object.assign(etapeAdr(x.i),{st:x.st,le}));n++;});
  saisie(a,'ancien passage : '+pl(l.length,'adresse'));});
 sauverA();dessinerParcours();return n;}

/* ---- saisie à la main : une date, un GA, faite ou pas pu entrer, on coche les adresses */
let ANC=null;
function vueAncien(){if(!ANC||ANC.k!==D.k)ANC={k:D.k,q:hier(),ga:gaDefaut()[0]||((gaActifs()[0]||{}).id)||'',st:'faite',t:'',c:new Set(),n:200};const S=ANC;
 /* v21 (JL, 01/11/2026 : « de base mettre toutes les adresses, qu'on les voie pour les cocher ou non ») : toutes les adresses,
    par rue puis par numéro (même ordre que le Suivi), 200 à la fois ; la recherche filtre */
 const lst=()=>{const n=normA(S.t.trim()),o=ordreAdrRue();return n.length<2?o:o.filter(i=>normA(D.adresses[i][2]).includes(n));};
 const row=i=>{const a=D.adresses[i],f=statutA(a[2])==='fait',p=(PASS[a[2]]||[])[0],c=S.c.has(i);
  return `<label class="hrow${f&&!c?' dis':''}"><input type="checkbox" data-hc="${i}"${c?' checked':''}><span><b>${esc(a[2])}</b><small>Bureau ${esc(a[8])} · ${pl(a[3],'inscrit')}${p?' · faite le '+fmtJ(p.q):''}</small></span></label>`;};
 const bouton=()=>{const n=S.c.size,ok=n&&S.q&&S.q<=auj10();return `<button class="btn primary" id="hSv"${ok?'':' disabled'}>${I.check} ${n?`Enregistrer ${pl(n,'adresse')} ${S.st==='faite'?(n>1?'faites':'faite'):'« pas pu entrer »'} le ${fmtJ(S.q+'T12:00')}`:'Cochez les adresses'}</button>`;};
 return {id:'anc',html:()=>{const G=gaActifs();
  let h=headHTML('Ajouter un ancien passage','Pour les adresses faites avant l\'appli, ou oubliées',true);
  h+=`<div class="fl"><span>Date du passage</span><input class="mq-in" type="date" id="hD" max="${auj10()}" value="${S.q}"></div>`;
  h+=`<div class="fl"><span>Groupe d'action</span><label class="chs"><select id="hG" aria-label="Groupe d'action">${G.map(g=>`<option value="${g.id}"${g.id===S.ga?' selected':''}>${esc(g.nom)}</option>`).join('')}</select>${I.down}</label></div>`;
  h+=`<div class="fl"><span>Résultat</span><div class="seg" role="group" aria-label="Résultat">${[['faite','Faite'],['ferme','Pas pu entrer']].map(([k,t])=>`<button data-hs="${k}" aria-pressed="${S.st===k}">${t}</button>`).join('')}</div></div>`;
  h+=`<label class="srch2" style="margin-top:14px">${I.loupe}<input id="hQ" type="search" enterkeyhint="search" placeholder="Chercher une rue ou une adresse" value="${esc(S.t)}" autocomplete="off" aria-label="Chercher une rue ou une adresse"></label>`;
  h+=`<div id="hL">${listeHTML2()}</div><div class="btns hsv" id="hB">${bouton()}</div>`;return h;},
 after:()=>{$('hD').onchange=e=>{S.q=e.target.value;$('hB').innerHTML=bouton();lierSv();};$('hG').onchange=e=>{S.ga=e.target.value;};
  body.querySelectorAll('[data-hs]').forEach(b=>b.onclick=()=>{S.st=b.dataset.hs;body.querySelectorAll('[data-hs]').forEach(x=>x.setAttribute('aria-pressed',x===b));$('hB').innerHTML=bouton();lierSv();});
  const majL=()=>{$('hL').innerHTML=listeHTML2();lierC();lierM();},lierM=()=>{const m=$('hM');if(m)m.onclick=()=>{S.n+=200;majL();};};
  let t=0;$('hQ').oninput=e=>{S.t=e.target.value;S.n=200;clearTimeout(t);t=setTimeout(majL,150);};
  const lierC=()=>body.querySelectorAll('[data-hc]').forEach(c=>c.onchange=()=>{const i=+c.dataset.hc;if(c.checked)S.c.add(i);else S.c.delete(i);c.closest('.hrow').classList.toggle('dis',!c.checked&&statutA(AID(i))==='fait');$('hB').innerHTML=bouton();lierSv();});
  const lierSv=()=>{const b=$('hSv');if(b)b.onclick=()=>{if(!S.c.size||!S.q||S.q>auj10())return;const n=enregistrerHisto([...S.c].map(i=>({i,q:S.q,ga:S.ga,st:S.st})));const q=S.q;S.c=new Set();back();toast(`${pl(n,'adresse')} ajoutée${n>1?'s':''} au ${fmtJ(q+'T12:00')}`);};};
  lierC();lierM();lierSv();}};
 function listeHTML2(){const r=lst(),rs=new Set(r),cs=[...S.c].filter(i=>!rs.has(i)),v=r.slice(0,S.n);let h='',rue=null;
  v.forEach(i=>{const w=ADRP[i].voie;if(w!==rue){rue=w;h+=`<div class="side">${esc(w)}</div>`;}h+=row(i);});
  return `<div class="hint" style="margin-top:10px">Cochez les adresses faites ce jour-là. Tapez une rue pour aller plus vite.</div>`+(cs.length?`<h2>Cochées</h2>`+cs.map(row).join(''):'')+
   (r.length?(cs.length?'<h2>Adresses</h2>':'')+h+(r.length>S.n?`<button class="lnk2 c" id="hM">Afficher la suite · ${pl(r.length-S.n,'adresse')}</button>`:''):`<div class="empty">Aucune adresse de la ${D.k}e circonscription ne correspond.</div>`);}}

/* ---- import d'un fichier : .xlsx (lu dans le téléphone, sans module en plus) ou .csv ; colonnes Adresse et Date,
   facultatif Résultat et GA ; ce qui n'est pas reconnu se corrige dans la ligne */
let IMP=null;
function cleAdr(s){let t=' '+norm(String(s||'').replace(/\b75\d{3}\b/g,' ').replace(/\bparis\b|\bfrance\b/gi,' '))+' ';
 t=t.replace(/ (\d+) ?(bis|b) /g,' $1b ').replace(/ (\d+) ?(ter|t) /g,' $1t ');
 const R={bd:'boulevard',boul:'boulevard',blvd:'boulevard',av:'avenue',ave:'avenue',r:'rue',pl:'place',fg:'faubourg',fbg:'faubourg',faub:'faubourg',st:'saint',ste:'sainte',
  imp:'impasse',pas:'passage',pass:'passage',psg:'passage',sq:'square',all:'allee',che:'chemin',qu:'quai',qua:'quai',crs:'cours',vla:'villa',cite:'cite',gal:'galerie'};
 return t.trim().split(' ').map(w=>R[w]||w).filter(w=>!['de','du','des','la','le','les','l','d'].includes(w)).join(' ');}
function idxAdr(){if(D._ia)return D._ia;const m=new Map();D.adresses.forEach((a,i)=>{const k=cleAdr(a[2]);if(!m.has(k))m.set(k,i);});return D._ia=m;}
function lireDateX(v){v=String(v==null?'':v).trim();if(!v)return null;let y,mo,d,m;
 if(/^\d{5}(\.\d+)?$/.test(v)){const x=new Date(Date.UTC(1899,11,30)+Math.floor(+v)*864e5);y=x.getUTCFullYear();mo=x.getUTCMonth()+1;d=x.getUTCDate();}
 else if((m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))){y=+m[1];mo=+m[2];d=+m[3];}
 else if((m=v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})\b/))){y=+m[3];if(y<100)y+=2000;mo=+m[2];d=+m[1];}
 else return null;
 const x=new Date(y,mo-1,d,12);if(x.getFullYear()!==y||x.getMonth()!==mo-1||x.getDate()!==d||y<2015)return null;const q=isoD(x).slice(0,10);return q>auj10()?null:q;}
const lireRes=v=>/pas|ferm|non\b|absent|refus|impossible|entre pas/.test(norm(v||''))?'ferme':'faite';
function gaDe(v){const n=norm(v||'');if(!n)return '';const g=REF.ga.find(x=>norm(x.nom)===n)||REF.ga.find(x=>norm(x.nom).includes(n)||n.includes(norm(x.nom)));return g?g.id:'';}
/* lignes du fichier -> passages : repère les colonnes par leur titre ; sans titre, adresse puis date puis résultat */
function lignesImport(T){T=T.filter(r=>r.some(c=>String(c||'').trim()));if(!T.length)return [];
 const h=T[0].map(c=>norm(c)),f=re=>h.findIndex(c=>re.test(c));
 let ia=f(/^(adresse|adresses|adr|lieu)\b/),id=f(/^(date|jour|le)\b|date/),ir=f(/resultat|statut|etat/),ig=f(/^ga\b|groupe/),inum=f(/^(n|no|num|numero)$/),iv=f(/^(rue|voie|nom de (la )?voie)$/);
 const tete=ia>=0||id>=0||(inum>=0&&iv>=0);if(!tete){ia=0;id=1;ir=T[0].length>2?2:-1;}
 return T.slice(tete?1:0).map(r=>{const adr=ia>=0?String(r[ia]||'').trim():(String(r[inum]||'')+' '+String(r[iv]||'')).trim();
  return verifL({adr,dt:String(r[id]==null?'':r[id]).trim(),st:ir>=0?lireRes(r[ir]):'faite',ga:(ig>=0&&gaDe(r[ig]))||'',on:true});});}
function verifL(x){x.i=idxAdr().get(cleAdr(x.adr));if(x.i==null)x.i=-1;x.q=lireDateX(x.dt);
 x.err=x.i<0?`adresse introuvable dans la ${D.k}e circonscription`:!x.q?(x.dt?'date illisible':'date manquante'):'';return x;}
function lireCSV(txt){if(txt.charCodeAt(0)===0xFEFF)txt=txt.slice(1);const l1=txt.split(/\r?\n/)[0]||'',sep=[';',',','\t'].map(s=>[s,l1.split(s).length]).sort((a,b)=>b[1]-a[1])[0][0];
 const R=[];let r=[],c='',q=false;
 for(let i=0;i<txt.length;i++){const ch=txt[i];
  if(q){if(ch==='"'){if(txt[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;continue;}
  if(ch==='"')q=true;else if(ch===sep){r.push(c);c='';}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&txt[i+1]==='\n')i++;r.push(c);R.push(r);r=[];c='';}else c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}return R;}
/* .xlsx = archive zip ; on lit la 1re feuille et les textes partagés (DecompressionStream, navigateurs récents) */
async function lireXLSX(buf){const u=new Uint8Array(buf),dv=new DataView(buf),td=new TextDecoder();let e=-1;
 for(let i=u.length-22;i>=Math.max(0,u.length-66000);i--)if(dv.getUint32(i,true)===0x06054b50){e=i;break;}
 if(e<0)throw new Error('zip');const F={};let p=dv.getUint32(e+16,true);
 for(let k=dv.getUint16(e+10,true);k>0;k--){const ln=dv.getUint16(p+28,true);F[td.decode(u.subarray(p+46,p+46+ln))]={m:dv.getUint16(p+10,true),cs:dv.getUint32(p+20,true),o:dv.getUint32(p+42,true)};p+=46+ln+dv.getUint16(p+30,true)+dv.getUint16(p+32,true);}
 const lire=async n=>{const f=F[n];if(!f)return null;const s=f.o+30+dv.getUint16(f.o+26,true)+dv.getUint16(f.o+28,true),d=u.subarray(s,s+f.cs);
  if(f.m===0)return td.decode(d);return td.decode(await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());};
 const X=s=>new DOMParser().parseFromString(s,'application/xml'),ss=[],sx=await lire('xl/sharedStrings.xml');
 if(sx)X(sx).querySelectorAll('si').forEach(si=>ss.push([...si.querySelectorAll('t')].map(t=>t.textContent).join('')));
 let sh='xl/worksheets/sheet1.xml';try{const wb=X(await lire('xl/workbook.xml')),rid=wb.querySelector('sheet').getAttribute('r:id'),rl=X(await lire('xl/_rels/workbook.xml.rels'));
  const t=[...rl.querySelectorAll('Relationship')].find(r=>r.getAttribute('Id')===rid);if(t){const g=t.getAttribute('Target').replace(/^\//,'');sh=g.startsWith('xl/')?g:'xl/'+g;}}catch(x){}
 const col=r=>{let n=0;for(const ch of (r.match(/^[A-Z]+/)||[''])[0])n=n*26+ch.charCodeAt(0)-64;return n-1;},T=[];
 X(await lire(sh)).querySelectorAll('row').forEach(r=>{const row=[];r.querySelectorAll('c').forEach(c=>{const t=c.getAttribute('t'),v=c.querySelector('v');
  row[col(c.getAttribute('r')||'A')]=t==='s'?ss[+(v&&v.textContent)]:t==='inlineStr'?(c.querySelector('is')||{}).textContent:v?v.textContent:'';});T.push(Array.from(row,x=>x==null?'':x));});
 return T;}
async function lireFichier(f){try{const buf=await f.arrayBuffer();let T;
  if(/\.xlsx$/i.test(f.name)||(new Uint8Array(buf,0,2)[0]===0x50&&new Uint8Array(buf,0,2)[1]===0x4b)){
   if(typeof DecompressionStream==='undefined'){toast('Ce téléphone ne lit pas les fichiers Excel : enregistrez le fichier en .csv, puis importez-le.');return;}T=await lireXLSX(buf);}
  else{let s;try{s=new TextDecoder('utf-8',{fatal:true}).decode(buf);}catch(x){s=new TextDecoder('windows-1252').decode(buf);}T=lireCSV(s);}
  const L=lignesImport(T);if(!L.length){toast('Fichier vide ou illisible.');return;}
  IMP={k:D.k,nom:f.name,L,ga:gaDefaut()[0]||((gaActifs()[0]||{}).id)||''};const v=stack[stack.length-1];if(v&&v.id==='imp')stack[stack.length-1]=vueImport(IMP);else detail(vueImport(IMP));render();}
 catch(e){console.warn('import',e);toast('Ce fichier n\'a pas pu être lu. Essayez de l\'enregistrer en .csv.');}}
function vueImport(S){return {id:'imp',html:()=>{let h=headHTML('Importer un historique','Fichier Excel (.xlsx) ou .csv',true);
  h+=`<div class="note">Une ligne par adresse. Colonnes reconnues : <b>Adresse</b> (ex. 24 rue Ramponeau) et <b>Date</b> (ex. 12/10/2026). Facultatif : <b>Résultat</b> (faite, ou pas pu entrer) et <b>GA</b>.</div>`;
  if(!S||S.k!==D.k)return h+`<div class="btns"><button class="btn primary" id="iCh">${I7.ul} Choisir le fichier</button></div>`;
  const ok=S.L.filter(x=>!x.err),ko=S.L.filter(x=>x.err),n=ok.filter(x=>x.on).length,G=gaActifs();
  h+=`<div class="mqbox"><h3>${esc(S.nom)}</h3><div class="sub">${pl(S.L.length,'ligne')} lue${S.L.length>1?'s':''} · <button class="lnk3" id="iCh">autre fichier</button></div></div>`;
  h+=`<div class="sum2"><span><b>${ok.length}</b>reconnue${ok.length>1?'s':''}</span><span><b>${ko.filter(x=>x.i<0).length}</b>introuvable${ko.filter(x=>x.i<0).length>1?'s':''}</span><span><b>${ko.filter(x=>x.i>=0).length}</b>sans date lisible</span></div>`;
  h+=`<div class="fl"><span>GA des lignes sans GA</span><label class="chs"><select id="iG" aria-label="Groupe d'action">${G.map(g=>`<option value="${g.id}"${g.id===S.ga?' selected':''}>${esc(g.nom)}</option>`).join('')}</select>${I.down}</label></div>`;
  if(ko.length)h+=`<h2>À corriger dans la ligne</h2>`+ko.map(x=>{const k=S.L.indexOf(x);return `<div class="crl"><input class="mq-in" data-ia="${k}" value="${esc(x.adr)}" aria-label="Adresse"><input class="mq-in dt" data-id="${k}" value="${esc(x.dt)}" placeholder="jj/mm/aaaa" inputmode="numeric" aria-label="Date"><small>${esc(x.err)}</small></div>`;}).join('');
  h+=`<h2>Reconnues</h2>`+(ok.length?ok.map(x=>{const k=S.L.indexOf(x);return `<label class="hrow"><input type="checkbox" data-io="${k}"${x.on?' checked':''}><span><b>${esc(D.adresses[x.i][2])}</b><small>${fmtD(x.q)} · ${x.st==='faite'?'faite':'pas pu entrer'}${x.ga?' · '+esc(gaNom(x.ga)):''}</small></span></label>`;}).join(''):`<div class="empty">Aucune ligne reconnue pour l'instant.</div>`);
  h+=`<div class="btns"><button class="btn primary" id="iSv"${n?'':' disabled'}>${I.check} Enregistrer ${pl(n,'passage')}</button></div>`;return h;},
 after:()=>{const c=$('iCh');if(c)c.onclick=choisirFichier;if(!S||S.k!==D.k)return;
  $('iG').onchange=e=>{S.ga=e.target.value;};
  body.querySelectorAll('[data-io]').forEach(b=>b.onchange=()=>{S.L[+b.dataset.io].on=b.checked;render(true);});
  body.querySelectorAll('[data-ia],[data-id]').forEach(b=>b.onchange=()=>{const x=S.L[+(b.dataset.ia||b.dataset.id)];if(b.dataset.ia!=null)x.adr=b.value;else x.dt=b.value;verifL(x);render(true);});
  $('iSv').onclick=()=>{const L=S.L.filter(x=>!x.err&&x.on);if(!L.length)return;const n=enregistrerHisto(L.map(x=>({i:x.i,q:x.q,st:x.st,ga:x.ga||S.ga})));IMP=null;back();toast(`${pl(n,'passage')} ajouté${n>1?'s':''} à l'historique`+(n<L.length?` (${L.length-n} déjà là)`:''));};}};}
function choisirFichier(){const fi=document.createElement('input');fi.type='file';fi.accept='.xlsx,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';fi.hidden=true;
 fi.onchange=()=>{const f=fi.files&&fi.files[0];fi.remove();if(f)lireFichier(f);};document.body.appendChild(fi);fi.click();}

/* ---- export : adresses faites (ou « pas pu entrer ») du journal, en .csv pour Excel (séparateur « ; », accents gardés) */
let EXPF={per:'tout',ga:'tous'};
function lignesExport(F){const now=new Date(),mois=isoD(now).slice(0,7),out=[];
 ACTIONS.forEach(a=>{if(a.type!=='pap')return;if(F.ga!=='tous'&&!(a.ga||[]).includes(F.ga))return;
  a.etapes.forEach(e=>{if(e.lieu.t!=='adresse')return;const ok=e.toquees>0||e.st==='faite';if(!ok&&e.st!=='ferme')return;const i=BYID[e.lieu.id];if(i==null)return;
   const q=(e.le||a.faite_le||a.cree_le||'').slice(0,10);if(F.per==='sem'&&!cetteSem(q))return;if(F.per==='mois'&&q.slice(0,7)!==mois)return;
   const x=D.adresses[i];out.push([x[2],x[8],q,(a.ga||[]).map(gaNom).join(', '),ok?'faite':'pas pu entrer',x[3]]);});});
 return out.sort((p,q)=>q[2].localeCompare(p[2])||p[0].localeCompare(q[0]));}
function csvDe(R){const c=v=>{v=String(v);return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
 return String.fromCharCode(0xFEFF)+[['Adresse','Bureau','Date','GA','Résultat','Inscrits']].concat(R.map(r=>[r[0],r[1],fmtD(r[2]),r[3],r[4],r[5]])).map(r=>r.map(c).join(';')).join('\r\n')+'\r\n';}
function telecharger(nom,txt,type){const b=new Blob([txt],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=nom;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}
function vueExport(){return {id:'exp',html:()=>{const F=EXPF,R=lignesExport(F),n=new Set(R.map(r=>r[0])).size,G=gaActifs();
  let h=headHTML('Télécharger les adresses faites','Fichier .csv, s\'ouvre dans Excel',true);
  h+=`<div class="fl"><span>Période</span><div class="seg" role="group" aria-label="Période">${[['sem','Cette semaine'],['mois','Ce mois'],['tout','Depuis le début']].map(([k,t])=>`<button data-ep="${k}" aria-pressed="${F.per===k}">${t}</button>`).join('')}</div></div>`;
  h+=`<div class="fl"><span>Groupe d'action</span><label class="chs"><select id="eG" aria-label="Groupe d'action"><option value="tous">Tous les GA</option>${G.map(g=>`<option value="${g.id}"${g.id===F.ga?' selected':''}>${esc(g.nom)}</option>`).join('')}</select>${I.down}</label></div>`;
  h+=`<div class="sum2"><span><b>${n0(R.length)}</b>passage${R.length>1?'s':''}</span><span><b>${n0(n)}</b>adresse${n>1?'s':''}</span><span><b>6</b>colonnes</span></div>`;
  h+=`<div class="sub">Colonnes : adresse, bureau, date, GA, résultat (faite, ou pas pu entrer), inscrits. ${D.k}e circonscription.</div>`;
  if(R.length)h+=`<div class="xlw"><table class="xl"><tr><th>Adresse</th><th>Bureau</th><th>Date</th><th>Résultat</th></tr>${R.slice(0,5).map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${fmtD(r[2])}</td><td>${r[4]}</td></tr>`).join('')}</table></div>`;
  else h+=`<div class="empty">Aucune adresse faite pour ces filtres.</div>`;
  h+=`<div class="btns"><button class="btn primary" id="eDl"${R.length?'':' disabled'}>${I7.dl} Télécharger le fichier .csv</button></div>`;return h;},
 after:()=>{body.querySelectorAll('[data-ep]').forEach(b=>b.onclick=()=>{EXPF.per=b.dataset.ep;render(true);});$('eG').onchange=e=>{EXPF.ga=e.target.value;render(true);};
  $('eDl').onclick=()=>{const R=lignesExport(EXPF);if(!R.length)return;telecharger(`adresses_faites_${pad2(D.k)}e_circo_${auj10()}.csv`,csvDe(R),'text/csv;charset=utf-8');toast(pl(R.length,'passage')+' dans le fichier');};}};}

/* ---------------- sondage Telegram de la semaine (v15, 25/10/2026). JL : « une zone pour permettre à l'équipe action de
   générer un sondage sur Telegram ». Arbitrages JL : lignes reprises des actions prévues du GA, complétées ; lignes au format
   « Samedi 24/10 - 10h30 - Marché … - RDV … - Prénom 06… » ; chaque ligne se modifie directement, toutes ensemble. L'appli
   ne publie pas dans Telegram (il faudrait un robot avec une clé sur un serveur) : on copie la question et les lignes.
   Limites de Telegram : question 300 signes, 12 options, 100 signes par option. Brouillon gardé sur ce téléphone. */
const JL7=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],MOIS7=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
/* semaine du sondage : du lundi au dimanche (JL, 01/11/2026 ; jeudi au mercredi jusqu'à la v18) ; on ouvre sur le lundi qui vient */
const lundiS=d=>{const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()+((1-x.getDay()+7)%7));return x;};
const jourTxt=q=>{const x=toD(q+'T12:00');return JL7[x.getDay()]+' '+pad2(x.getDate())+'/'+pad2(x.getMonth()+1);};
const dLong=x=>JL7[x.getDay()].toLowerCase()+' '+x.getDate()+(x.getDate()===1?'er':'')+' '+MOIS7[x.getMonth()];
/* v23 (JL, 01/11/2026 : « pas besoin de RDV ») : le lieu porte le numéro de la 1re adresse du PAP, ou le stand ; plus de champ RDV */
const ligneS=o=>[o.d?jourTxt(o.d):'',o.h,o.t,o.l,o.p].map(x=>String(x||'').trim()).filter(Boolean).join(' - ');
const prenomTel=u=>{const p=(u.nom||'').trim().split(/\s+/)[0]||'',c=String(u.contact||'').replace(/[\s.]/g,'');return (p+(/^\+?\d{9,}$/.test(c)?' '+c:'')).trim();};
/* v23 (JL : « référent et téléphone : pouvoir en ajouter au fur et à mesure, seulement pour son GA, et supprimer ») : les membres
   du GA et ceux ajoutés à la main, gardés sur cet appareil (refs_<GA>) ; un membre retiré est caché (refsX_<GA>) */
const refsGA=ga=>{const H=new Set(LS.get('refsX_'+ga,[])),M=REF.users.filter(u=>u.actif!==false&&(u.ga||[]).includes(ga)).sort((x,y)=>(x.profil==='admin')-(y.profil==='admin')).map(prenomTel).filter(Boolean);
 return [...new Set([...M,...LS.get('refs_'+ga,[])])].filter(x=>!H.has(x));};
function retirerRef(ga,t){const A=LS.get('refs_'+ga,[]);if(A.includes(t))LS.set('refs_'+ga,A.filter(x=>x!==t));else LS.set('refsX_'+ga,[...new Set([...LS.get('refsX_'+ga,[]),t])]);}
function ajouterRef(ga,t){LS.set('refsX_'+ga,LS.get('refsX_'+ga,[]).filter(x=>x!==t));const A=LS.get('refs_'+ga,[]);if(!A.includes(t))LS.set('refs_'+ga,A.concat([t]));}
const PHRASE_V22=' Tracts : à compléter. Vous pouvez vous y inscrire si vous le désirez.';
let SOND=null;
function semaineS(deb){const x=toD(deb+'T12:00'),j=[];for(let k=0;k<7;k++){const y=new Date(x);y.setDate(x.getDate()+k);j.push(isoD(y).slice(0,10));}return j;}
function prerempliS(ga,deb){const J=semaineS(deb),fin=J[6],L=[];
 const p=refsGA(ga)[0]||'';
 ACTIONS.forEach(a=>{if(!(a.ga||[]).includes(ga))return;
  if(a.type==='equipe'&&a.etapes[0]){const l=a.etapes[0].lieu,j=(a.jours||[]);
   const t=l.t==='station'?'Diffusion':l.t==='marche'?l.id:l.t==='commerce'?'Diffusion':l.t==='parcours'?l.id.split(' · ')[0]:'Diffusion',lieu=l.t==='station'?'Métro '+l.id:l.t==='marche'?'':l.t==='parcours'?l.id.split(' · ').slice(1).join(' · '):l.id;
   J.forEach(q=>{if(j.includes(toD(q+'T12:00').getDay()))L.push({d:q,h:'',t,l:lieu,p});});}
  /* v19 (JL, 01/11/2026 : « quand on met un PAP en cours, il doit se préremplir dans la partie sondage ») : les PAP en cours et les
     pieds d'immeuble en cours y sont, datés du jour prévu s'il tombe dans la semaine, sinon du premier jour (modifiable) */
  else if(a.statut==='a_faire'&&((a.type==='pap'&&!a.groupe)||(a.type==='diff_pied'&&a.encours))){const q=(a.prevue||'').slice(0,10),dans=q>=deb&&q<=fin;if(!dans&&!a.encours)return;
   L.push({aid:a.id,d:dans?q:deb,h:/T\d/.test(a.prevue||'')?a.prevue.slice(11,13)+'h':'',t:a.type==='pap'?'Porte-à-porte':"Pied d'immeuble",l:lieuS(a),p});}});
 L.sort((x,y)=>x.d.localeCompare(y.d));
 const x=toD(deb+'T12:00'),y=toD(fin+'T12:00');
 return {q:`Bonjour, voici le calendrier des actions du ${dLong(x)} au ${dLong(y)}.`,L};}
/* lieu du rendez-vous : la 1re adresse du PAP, avec son numéro ; pour un pied d'immeuble, l'endroit du stand */
function lieuS(a){const id=(a.etapes[0]||{lieu:{id:''}}).lieu.id;if(a.type==='pap')return id||(a.nom||'').replace(/^PAP /,'');
 const s=(D.pieds||[]).find(x=>x.nom===id);return s&&s.poste?s.poste.txt:id;}
function vueSondage(base){const G=gaActifs();if(!SOND||SOND.k!==D.k)SOND={k:D.k,ga:gaDefaut()[0]||((G[0]||{}).id)||'',deb:isoD(lundiS(new Date())).slice(0,10)};const S=SOND;
 const cle=()=>`sond${D.k}_${S.ga}_${S.deb}`,charge=()=>{const g=LS.get(cle(),null);S.b=g||prerempliS(S.ga,S.deb);if(g){const N=prerempliS(S.ga,S.deb).L,vu=new Set(S.b.L.map(o=>o.aid).filter(Boolean));let n=0;N.forEach(o=>{if(o.aid&&!vu.has(o.aid)){S.b.L.push(o);n++;}});if(n)S.b.L.sort((x,y)=>x.d.localeCompare(y.d));
  /* brouillons d'avant la v23 : phrase des tracts retirée, rue remplacée par l'adresse avec son numéro, plus de RDV */
  S.b.q=S.b.q.replace(PHRASE_V22,'');S.b.L.forEach(o=>{delete o.r;const z=o.aid&&N.find(x=>x.aid===o.aid);if(z&&z.l!==o.l&&z.l.endsWith(o.l))o.l=z.l;});}},garde=()=>LS.set(cle(),S.b);charge();
 const opt=(o,k)=>{const J=semaineS(S.deb),t=ligneS(o),R=refsGA(S.ga);
  return `<div class="sl" data-k="${k}"><div class="sl1"><span class="n">${k+1}</span><label class="chs"><select data-f="d" aria-label="Jour">${o.d?'':'<option value="" selected>Jour à choisir</option>'}${J.map(q=>`<option value="${q}"${q===o.d?' selected':''}>${jourTxt(q)}</option>`).join('')}</select>${I.down}</label><input data-f="h" value="${esc(o.h)}" placeholder="Heure" aria-label="Heure"><button class="xb" data-sx="${k}" aria-label="Retirer la ligne ${k+1}">${I.x}</button></div>
   <input data-f="t" value="${esc(o.t)}" placeholder="Action : Porte-à-porte, Marché d'Aligre, Diffusion…" aria-label="Action"><input data-f="l" value="${esc(o.l)}" placeholder="Lieu : 5 rue Eugénie Eboué, Métro…" aria-label="Lieu">
   <label class="chs slr"><select data-f="p" aria-label="Référent"><option value="">Pas de référent</option>${R.concat(o.p&&!R.includes(o.p)?[o.p]:[]).map(t=>`<option value="${esc(t)}"${t===o.p?' selected':''}>${esc(t)}</option>`).join('')}</select>${I.down}</label>
   <div class="slp"><span class="tx2">${esc(t)}</span><span class="cn${t.length>100?' over':''}">${t.length} / 100</span></div></div>`;};
 return {id:base?'base':'sond',html:()=>{const B=S.b,x=toD(S.deb+'T12:00'),y=new Date(x);y.setDate(x.getDate()+6);
  /* v22 (JL : « en web, la page est mal utilisée ») : sur ordinateur, les réglages et le bouton Copier à gauche, les options
     à droite ; au téléphone, même ordre qu'avant (pc1, pc2, pc3) */
  let h=`<div class="pg2 sond"><div class="pgh">`+headHTML('Sondage Telegram','Calendrier de la semaine d\'un GA',!base)+`</div><div class="pcl"><div class="pc1">`;
  h+=`<div class="fl"><span>Groupe d'action</span><label class="chs"><select id="sG" aria-label="Groupe d'action">${G.map(g=>`<option value="${g.id}"${g.id===S.ga?' selected':''}>${esc(g.nom)}</option>`).join('')}</select>${I.down}</label></div>`;
  const dc=z=>z.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'});
  h+=`<div class="wk"><button id="sP" aria-label="Semaine précédente">‹</button><b>${cap(dc(x))} au ${dc(y)}</b><button id="sN" aria-label="Semaine suivante">›</button></div>`;
  h+=`<div class="fl"><span>Question</span><textarea class="mq-ta" id="sQ" aria-label="Question">${esc(B.q)}</textarea><div class="cnt${B.q.length>300?' over':''}" id="sQc"><b>${B.q.length}</b> / 300 signes</div></div>`;
  const R=refsGA(S.ga);
  h+=`<div class="fl"><span>Référents du GA</span><div class="rfl">${R.length?R.map((t,k)=>`<span class="rfc">${esc(t)}<button data-rx="${k}" aria-label="Retirer ${esc(t)}">${I.x}</button></span>`).join(''):'<small class="sub">Aucun référent pour ce GA : ajoutez-en un.</small>'}</div>`+
   `<div class="rfa"><input class="mq-in" id="rfN" placeholder="Prénom" autocomplete="off" aria-label="Prénom du référent"><input class="mq-in" id="rfT" placeholder="Téléphone" inputmode="tel" autocomplete="off" aria-label="Téléphone du référent"><button class="btn" id="rfA">${I.plus} Ajouter</button></div><small class="sub">Liste gardée sur cet appareil.</small></div></div>`;
  const pc3=`<div class="pc3"><div class="btns"><button class="btn primary" id="sC"${B.L.length?'':' disabled'}>${I7.copy} Copier pour Telegram</button></div><button class="lnk2 c" id="sR">Remettre les actions prévues (efface vos lignes)</button></div>`;
  h+=pc3+`</div><div class="pc2"><h2>Options : ${B.L.length} sur 12</h2>`+(B.L.length>12?`<div class="note">Telegram n'accepte que 12 options : retirez-en ${B.L.length-12}.</div>`:'');
  h+=B.L.length?`<div id="sL">${B.L.map(opt).join('')}</div>`:`<div class="empty">Aucune action prévue pour ce GA cette semaine. Ajoutez des lignes.</div>`;
  h+=`<button class="lnk2 c" id="sA" style="margin-top:10px">+ Ajouter une ligne (manif, réunion…)</button></div></div>`;return h;},
 after:()=>{const B=S.b;$('sG').onchange=e=>{S.ga=e.target.value;charge();render(true);};
  const dec=n=>{const z=toD(S.deb+'T12:00');z.setDate(z.getDate()+n);S.deb=isoD(z).slice(0,10);charge();render();};$('sP').onclick=()=>dec(-7);$('sN').onclick=()=>dec(7);
  body.querySelectorAll('[data-rx]').forEach(b=>b.onclick=()=>{const t=refsGA(S.ga)[+b.dataset.rx];if(!t)return;retirerRef(S.ga,t);render(true);toast(t+' retiré de la liste',{t:'Annuler',fn:()=>{ajouterRef(S.ga,t);render(true);}});});
  $('rfA').onclick=()=>{const n=$('rfN').value.trim(),tel=$('rfT').value.replace(/[\s.]/g,'');if(!n){toast('Indiquez le prénom du référent.');$('rfN').focus();return;}const t=(n+(tel?' '+tel:'')).trim();ajouterRef(S.ga,t);render(true);toast(t+' ajouté à la liste');};
  $('sQ').oninput=e=>{B.q=e.target.value;garde();const c=$('sQc');c.innerHTML=`<b>${B.q.length}</b> / 300 signes`;c.classList.toggle('over',B.q.length>300);};
  body.querySelectorAll('.sl [data-f]').forEach(inp=>{const ev=inp.tagName==='SELECT'?'onchange':'oninput';inp[ev]=()=>{const r=inp.closest('.sl'),o=B.L[+r.dataset.k];o[inp.dataset.f]=inp.value;
   if(inp.dataset.f==='d'){B.L.sort((x,y)=>x.d.localeCompare(y.d));garde();render(true);return;}
   garde();const t=ligneS(o);r.querySelector('.tx2').textContent=t;const c=r.querySelector('.cn');c.textContent=t.length+' / 100';c.classList.toggle('over',t.length>100);};});
  body.querySelectorAll('[data-sx]').forEach(b=>b.onclick=()=>{const k=+b.dataset.sx,o=B.L.splice(k,1)[0];garde();render(true);toast('Ligne retirée',{t:'Annuler',fn:()=>{B.L.splice(k,0,o);garde();render(true);}});});
  $('sA').onclick=()=>{B.L.push({d:'',h:'',t:'',l:'',p:''});garde();render(true);const l=body.querySelectorAll('.sl');if(l.length){const z=l[l.length-1];z.scrollIntoView({block:'center'});z.querySelector('[data-f="t"]').focus();}};
  $('sR').onclick=()=>{const av=S.b;LS.set(cle(),null);charge();render(true);toast('Lignes reprises des actions prévues',{t:'Annuler',fn:()=>{S.b=av;garde();render(true);}});};
  const c=$('sC');if(c)c.onclick=()=>detail(vueCopierS(B));}};}
async function copier(t){try{await navigator.clipboard.writeText(t);return true;}catch(e){const a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand('copy');}catch(x){}a.remove();return ok;}}
function vueCopierS(B){const fait=new Set();
 return {id:'sondc',html:()=>{let h=headHTML('Copier dans Telegram','Une touche par champ, puis coller',true);
  h+=`<ol class="steps2"><li>Dans le groupe Telegram : trombone, puis <b>Sondage</b>.</li><li>Collez la question, puis chaque ligne dans une option.</li><li>Réglages : vote <b>public</b>, <b>plusieurs réponses</b> possibles.</li></ol>`;
  const L=[B.q].concat(B.L.map(ligneS));
  h+=L.map((t,k)=>`<div class="opt"><span class="n">${k?k:'Q'}</span><div><p>${esc(t)}</p>${t.length>(k?100:300)?`<small><span class="w">${t.length} signes : Telegram en accepte ${k?100:300}</span></small>`:''}</div><button class="cp${fait.has(k)?' on':''}" data-cp="${k}">${fait.has(k)?I.check+' Copié':I7.copy+' Copier'}</button></div>`).join('');
  return h;},
 after:()=>{body.querySelectorAll('[data-cp]').forEach(b=>b.onclick=async()=>{const k=+b.dataset.cp,t=k?ligneS(B.L[k-1]):B.q;if(await copier(t)){fait.add(k);render(true);toast(k?'Ligne '+k+' copiée':'Question copiée');}else toast('Copie impossible : sélectionnez le texte à la main.');});}};}
