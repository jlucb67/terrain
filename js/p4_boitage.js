/* ---------------- boitage : on prepare la tournee (action), puis on la renseigne numero par numero */
let VOIES={},ADRP=[],RUES_AFF=[],tTaille=LS.get('tTaille',200);
function voies(){VOIES={};ADRP=D.adresses.map((a,i)=>{const m=/^(\d+)\s*(bis|ter|quater|[A-Z](?=\s))?\s+(.+)$/i.exec(a[2]);const p=m?{num:+m[1],suf:(m[2]||'').toLowerCase(),voie:m[3]}:{num:0,suf:'',voie:a[2]};(VOIES[p.voie]=VOIES[p.voie]||[]).push(i);return p;});
 Object.values(VOIES).forEach(l=>l.sort((x,y)=>ADRP[x].num-ADRP[y].num||ADRP[x].suf.localeCompare(ADRP[y].suf)));}
const ordreRue=v=>{const l=VOIES[v]||[];return [...l.filter(i=>ADRP[i].num%2===0),...l.filter(i=>ADRP[i].num%2===1).reverse()];};
const numTxt=i=>{const p=ADRP[i];return p.num?p.num+(p.suf?' '+p.suf:''):D.adresses[i][2];};
const libreB=i=>{const b=BOI[AID(i)];return !(b&&ageJ(b.q)<REF.reglages.delaiFaite);};
function construireTour(ll,cible){const vus=new Set(),ids=[];let s=0,cur=ll;
 while(s<cible){let bv=null,bd=1e9;for(const v in VOIES){if(vus.has(v))continue;for(const i of VOIES[v]){if(!libreB(i))continue;const d=dist(cur,ptA(i));if(d<bd){bd=d;bv=v;}}}
  if(!bv||bd>(ids.length?250:500))break;vus.add(bv);
  let ord=ordreRue(bv).filter(libreB);if(ord.length>1&&dist(cur,ptA(ord[ord.length-1]))<dist(cur,ptA(ord[0])))ord.reverse();
  for(const i of ord){if(s>=cible)break;ids.push(i);s+=D.adresses[i][3];cur=ptA(i);}}
 return {ids,ins:s};}
function ruesListe(f){const q=norm(f||'');if(q.length>=2)return Object.keys(VOIES).filter(v=>norm(v).includes(q)).sort((a,b)=>a.localeCompare(b,'fr')).slice(0,20);
 const c=centreVisible(),ref=[c.lat,c.lng];return Object.keys(VOIES).map(v=>({v,d:Math.min(...VOIES[v].map(i=>dist(ref,ptA(i))))})).sort((a,b)=>a.d-b.d).slice(0,8).map(o=>o.v);}
function ruesHTML(f){RUES_AFF=ruesListe(f);if(!RUES_AFF.length)return '<div class="empty">Aucune rue trouvée dans la circonscription.</div>';
 return RUES_AFF.map((v,k)=>{const l=VOIES[v],ins=insDe(l),bo=l.filter(i=>!libreB(i)).length;return `<div class="row p"><button class="tx" data-v="${k}"><b>${esc(v)}</b><small>${pl(l.length,'numéro')} · environ ${n0(ins)} tracts${bo?` · ${bo} boîté${bo>1?'s':''} récemment`:''}</small></button></div>`;}).join('');}
function majRues(){const l=$('lrues'),f=$('fv');if(!l||(f&&f.value.trim()))return;l.innerHTML=ruesHTML('');lierRues();}
const lierRues=()=>body.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>vueRueOuvrir(RUES_AFF[+b.dataset.v]));
function vueBoitage(){return {id:'base',html:()=>{
  let h=`<div class="head"><div class="tt"><h1>Boîtage</h1><div class="sub">Un tract dans chaque boîte aux lettres, sans sonner.</div></div></div>`;
  h+=blocActions('boitage');
  h+=`<h2>Préparer une action</h2><div class="seg" role="group" aria-label="Tracts à déposer">${[100,200,300].map(t=>`<button data-tt="${t}" aria-pressed="${tTaille===t}">${t} tracts</button>`).join('')}</div>`;
  h+=`<div class="start"><button class="btn line" id="bMe">${I.me} Autour de moi</button><button class="btn line" id="bCtr">${I.target} Centre de la carte</button></div>`;
  h+=`<div class="hint">La tournée suit les rues, côté pair puis côté impair. Estimation : un tract par inscrit, à corriger sur place.</div>`;
  h+=`<h2>Ou une rue entière</h2><div class="fltr"><input id="fv" type="text" placeholder="Nom de la rue" autocomplete="off" aria-label="Chercher une rue"></div><div id="lrues">${ruesHTML('')}</div>`;
  h+=`<div class="legal"><b>À savoir.</b> Distribuer des documents est interdit à partir de la veille du scrutin à 0 h (code électoral, article L. 49). On n'entre que si la porte est ouverte, et on ne note jamais un code d'accès.</div>`;
  h+=lienCR();return h;},
 after:()=>{lierRues();
  body.querySelectorAll('[data-tt]').forEach(b=>b.onclick=()=>{tTaille=+b.dataset.tt;LS.set('tTaille',tTaille);render(true);});
  const fv=$('fv');fv.oninput=()=>{$('lrues').innerHTML=ruesHTML(fv.value);lierRues();};
  $('bCtr').onclick=()=>{const c=centreVisible();proposerTour([c.lat,c.lng],'Autour du centre de la carte');};
  $('bMe').onclick=()=>localiser(ll=>proposerTour(ll,'Autour de votre position'));}};}
function proposerTour(ll,nom){if(!dansCirco(ll)){toast('Ce point est hors de la '+D.k+'e circonscription. Déplacez la carte.');return;}
 const t=construireTour(ll,tTaille);if(!t.ids.length){toast('Aucun numéro à boîter près d\'ici.');return;}
 lot={ll,ids:t.ids,ins:t.ins,type:'boitage'};dessinerLot();if(det==='peek')setDet('half');map.flyToBounds(L.latLngBounds(t.ids.map(ptA)).pad(.2),{...pad(),maxZoom:17.5,duration:.5});
 detail({id:'lot',html:()=>{let h=headHTML('Tournée proposée',nom,true);
  h+=`<div class="pap-sum"><span><b>${pl(t.ids.length,'numéro')}</b></span><span>environ <b>${n0(t.ins)}</b> tracts</span><span>${pl(new Set(t.ids.map(i=>ADRP[i].voie)).size,'rue')}</span></div>`;
  h+=`<div class="btns"><button class="btn primary" id="cree">${I.check} Créer l'action de boîtage</button></div>`;
  let last='';t.ids.forEach(i=>{const v=ADRP[i].voie;if(v!==last){h+=`<div class="side">${esc(v)}</div>`;last=v;}h+=`<div class="row p"><div class="tx"><b>${esc(numTxt(i))}</b><small>${pl(D.adresses[i][3],'inscrit')}</small></div></div>`;});
  return h;},after:()=>{$('cree').onclick=()=>{const a=nouvelleAction('boitage',{etapes:t.ids.map(etapeAdr),origine:{lot:'propose',cible:tTaille}});a.nom=nomDefaut(a);effLot();detail(vueEditer(a,true));};}});}
function ajoutHTML(voiesT){return `<div class="crb"><div class="crt">Numéro absent de la liste</div><div class="addn"><input id="anum" inputmode="numeric" placeholder="N°" aria-label="Numéro"><select id="avoie" aria-label="Rue">${voiesT.map(v=>`<option>${esc(v)}</option>`).join('')}</select><button class="btn primary" id="aok">Boîté</button></div><div class="hint">Les listes électorales n'ont pas les immeubles sans inscrit.</div></div>`;}
function lierAjout(a){const b=$('aok');if(!b||!a)return;b.onclick=()=>{const n=($('anum').value||'').trim(),v=$('avoie').value;if(!n){toast('Indiquez le numéro.');return;}
 a.etapes.push({lieu:{t:'ajout',id:`${n} ${v}`,voie:v},portes:0,toquees:0,ouvertes:0,st:'boite',acc:'',boites:0,le:isoD(new Date())});saisie(a,'numéro ajouté');sauverA();render(true);toast(`${n} ${v} : boîté`);};}
function vueRueOuvrir(v){const l=VOIES[v];if(!l)return;if(det==='peek')setDet('half');
 map.flyToBounds(L.latLngBounds(l.map(ptA)).pad(.15),{...pad(),maxZoom:17.5,duration:.5});detail(vueRue(v));}
function vueRue(v){return {id:'rue',html:()=>{const l=VOIES[v],o=ordreRue(v),np=l.filter(i=>ADRP[i].num%2===0).length;
  let h=headHTML(esc(v),`${pl(l.length,'numéro')} dans les listes · côté pair ${np}, côté impair ${l.length-np} · environ ${n0(insDe(l))} tracts`,true);
  h+=`<div class="btns"><button class="btn primary" id="rB">${I.plus} Créer une action de boîtage avec cette rue</button><button class="btn line" id="rP">Créer une action de porte-à-porte avec cette rue</button></div>`;
  let side='';o.forEach(i=>{const s=ADRP[i].num%2===0?'Côté pair, aller':'Côté impair, retour';if(s!==side){h+=`<div class="side">${s}</div>`;side=s;}
   const b=BOI[AID(i)],f=faites[AID(i)];h+=`<div class="row p"><button class="tx" data-ri="${i}"><b>${esc(numTxt(i))}</b><small>${pl(D.adresses[i][3],'inscrit')}${b?` · ${b.st==='boite'?'boîté':'fermé'} le ${fmtJ(b.q)}`:''}${f?` · PAP fait le ${fmtJ(f)}`:''}</small></button></div>`;});
  return h;},after:()=>{body.querySelectorAll('[data-ri]').forEach(b=>b.onclick=()=>{const i=+b.dataset.ri;if(mode==='boitage'){voir(ptA(i),Math.max(map.getZoom(),17));sel(i);}else ouvrirAdresse(i);});
  $('rB').onclick=()=>{const a=nouvelleAction('boitage',{etapes:ordreRue(v).map(etapeAdr),origine:{lot:'rue'}});a.nom=`Boîtage ${v}`;detail(vueEditer(a,true));};
  $('rP').onclick=()=>{const a=nouvelleAction('pap',{etapes:ordreRue(v).map(etapeAdr),origine:{lot:'rue'}});a.nom=`PAP ${v}`;detail(vueEditer(a,true));};}};}
function ouvrirAdresseB(i){const a=D.adresses[i];sel(i);if(det==='peek')setDet('half');voir(ptA(i),Math.max(map.getZoom(),17));
 const ao=ACT_OUV&&actPar(ACT_OUV),k=ao&&ao.type==='boitage'?ao.etapes.findIndex(e=>e.lieu.id===a[2]):-1;
 detail({id:'adrb',aid:k>=0?ao.id:null,html:()=>{const b=BOI[a[2]];let h=headHTML(esc(a[2]),`${pl(a[3],'inscrit')} · bureau ${esc(a[8])}`,true);
  if(b)h+=`<div class="done-l">${I.check}<span>${b.st==='boite'?'Boîté':'Fermé'} le ${fmtJ(b.q)}</span></div>`;
  if(k>=0){const e=ao.etapes[k];h+=`<div class="crb"><div class="crt">${esc(ao.nom)}</div><div class="bb big"><button data-bs="boite" aria-pressed="${e.st==='boite'}">Boîté</button><button data-bs="ferme" aria-pressed="${e.st==='ferme'}">Fermé</button></div></div>`;}
  const dans=ACTIONS.filter(t=>t.type==='boitage'&&t.etapes.some(e=>e.lieu.id===a[2]));if(dans.length&&k<0)h+=`<h2>Dans ${dans.length>1?'les actions':'l\'action'}</h2>`+dans.slice(0,4).map(rowAction).join('');
  h+=`<div class="btns"><button class="btn line" id="vr">Voir toute la voie</button></div>`;return h;},
  after:()=>{body.querySelectorAll('[data-bs]').forEach(b=>b.onclick=()=>{const e=ao.etapes[k],st=b.dataset.bs;e.st=e.st===st?'':st;e.le=isoD(new Date());saisie(ao,'boîtage');sauverA();render(true);});
   $('vr').onclick=()=>vueRueOuvrir(ADRP[i].voie);}});}

/* ---------------- mon profil et console d'administration (profil administrateur seulement) */
function vueMoi(){return {id:'moi',html:()=>{const u=moi(),t=themeDe();let h=headHTML(esc(u.nom),`${u.profil==='admin'?'Administrateur':'Utilisateur'} · ${u.ga.map(gaNom).map(esc).join(', ')||'aucun GA'}`,true);
  h+=`<div class="fl"><span>Affichage</span><div class="seg" role="group" aria-label="Affichage">${[['auto','Comme le téléphone'],['clair','Clair'],['sombre','Sombre']].map(([k,x])=>`<button data-th="${k}" aria-pressed="${t===k}">${x}</button>`).join('')}</div></div>`;
  if(estAdmin())h+=`<div class="btns"><button class="btn primary" id="cons">${I.grid} Console d'administration</button></div>`;
  h+=`<div class="btns"><button class="btn line" id="deco">Se déconnecter</button></div>`;
  return h;},after:()=>{body.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{LS.set('theme_'+MOI,b.dataset.th);appliquerTheme();render(true);});
  $('deco').onclick=deconnecter;
  const c=$('cons');if(c)c.onclick=()=>detail(vueConsole());}};}
function aVerifier(){const l=[];ACTIONS.forEach(a=>{if(a.type==='diff_marche'&&a.etapes[0]&&!seanceLe(a.etapes[0].lieu.id,a.faite_le))l.push([a,'diff un jour sans marché']);
 if(a.type==='pap'&&a.etapes.some(e=>e.toquees>0&&!e.portes))l.push([a,'portes non comptées']);
 if(a.statut==='a_faire'&&a.prevue&&ageJ(a.prevue+'T23:59')>1)l.push([a,'date prévue passée']);});return l;}
function vueConsole(){if(!estAdmin())return vueMoi();return {id:'console',html:()=>{let h=headHTML('Administration','Listes de référence, accès et réglages',true);
  const rows=[['users','Personnes et accès',`${pl(REF.users.length,'personne')} · ${REF.users.filter(u=>u.profil==='admin').length} administrateurs`],['campagnes','Campagnes',pl(REF.campagnes.filter(c=>!c.archive).length,'active')],['ga','Groupes d\'action',pl(REF.ga.filter(g=>!g.archive).length,'actif')],['reglages','Réglages',`délais ${REF.reglages.delaiFaite} et ${REF.reglages.delaiFerme} jours · ${pl((REF.reglages.scrutins||[]).length,'date de scrutin','dates de scrutin')}`],['actions','Toutes les actions',pl(ACTIONS.length,'action')],['controles','Contrôles',`${pl(aVerifier().length,'saisie','saisies')} à vérifier`],['donnees','Données',`circo_${pad2(D.k)} · modèle Paris 2027 v5.7`]];
  h+=`<div style="margin-top:8px">${rows.map(([k,t,s])=>`<div class="row p"><button class="tx" data-cs="${k}"><b>${t}</b><small>${s}</small></button><span class="chev">${I.next}</span></div>`).join('')}</div>`;
  h+=`<div class="hint">Listes et actions sont enregistrées dans le journal partagé.</div>`;return h;},
 after:()=>{body.querySelectorAll('[data-cs]').forEach(b=>b.onclick=()=>{const k=b.dataset.cs;
  detail(k==='users'?vueUsers():k==='reglages'?vueReglages():k==='actions'?vueActions({type:'tous'}):k==='controles'?vueControles():k==='donnees'?vueDonnees():vueRef(k));});}};}
const REFT={campagnes:['Campagnes','campagne'],ga:['Groupes d\'action','GA'],materiel:['Matériel','matériel']};
function vueRef(k){return {id:'ref-'+k,html:()=>{const [t,u]=REFT[k];let h=headHTML(t,k==='campagnes'?'Liste fixe : les utilisateurs choisissent dedans, sans pouvoir la modifier.':'Liste de référence : les utilisateurs choisissent dedans, sans pouvoir la modifier.',true);
  if(k!=='campagnes')h+=`<div class="btns"><button class="btn primary" id="add">${I.plus} Ajouter ${k==='ga'?'un GA':'un matériel'}</button></div>`;
  h+=REF[k].map((x,j)=>`<div class="row p"><button class="tx" data-rj="${j}"><b>${esc(x.nom)}${x.defaut?' <span class="stt faite">par défaut</span>':''}</b><small>${k==='campagnes'?`${x.debut?'du '+fmtJ(x.debut):''}${x.fin?' au '+fmtJ(x.fin):''}`:k==='ga'?`${arrTxt(x.arr)} · circo ${(x.circos||[]).join(', ')||'à indiquer'}`:esc(x.campagne?campNom(x.campagne):'toutes campagnes')}${x.archive?' · archivé':''}</small></button><span class="chev">${I.next}</span></div>`).join('');
  return h;},after:()=>{const ad=$('add');if(ad)ad.onclick=()=>detail(vueRefEdit(k,-1));body.querySelectorAll('[data-rj]').forEach(b=>b.onclick=()=>detail(vueRefEdit(k,+b.dataset.rj)));}};}
function vueRefEdit(k,j){const x=j>=0?JSON.parse(JSON.stringify(REF[k][j])):{id:uid().slice(0,8),nom:'',archive:false,...(k==='ga'?{arr:null,circos:[D.k]}:k==='campagnes'?{debut:'',fin:'',defaut:false}:{campagne:''})};if(k==='ga'&&!x.circos)x.circos=[];
 return {id:'refedit',html:()=>{let h=headHTML(j>=0?'Modifier':'Ajouter',REFT[k][0],true);
  h+=`<label class="fld" for="rn">Nom<input id="rn" value="${esc(x.nom)}" autocomplete="off"></label>`;
  if(k==='campagnes')h+=`<div class="two-f"><label class="fld" for="rd">Début<input type="date" id="rd" value="${x.debut}"></label><label class="fld" for="rf">Fin<input type="date" id="rf" value="${x.fin}"></label></div><label class="ckb"><input type="checkbox" id="rdef" ${x.defaut?'checked':''}><span>Campagne proposée par défaut</span></label>`;
  if(k==='ga')h+=`<div class="fl"><span>Arrondissement (un seul)</span><select id="rarr" aria-label="Arrondissement"><option value="">À choisir</option>${[...Array(20)].map((_,i)=>`<option value="${i+1}" ${x.arr===i+1?'selected':''}>${i===0?'1er':(i+1)+'e'}</option>`).join('')}</select></div><div class="fl"><span>Circonscriptions (une ou plusieurs)</span><div class="ch2 num">${[...Array(18)].map((_,i)=>`<button data-cz="${i+1}" aria-pressed="${x.circos.includes(i+1)}">${i+1}</button>`).join('')}</div></div>`;
  if(k==='materiel')h+=`<div class="fl"><span>Campagne</span><div class="ch2"><button data-mc="" aria-pressed="${!x.campagne}">Toutes</button>${REF.campagnes.filter(c=>!c.archive).map(c=>`<button data-mc="${c.id}" aria-pressed="${x.campagne===c.id}">${esc(c.nom)}</button>`).join('')}</div></div>`;
  h+=`<label class="ckb"><input type="checkbox" id="rar" ${x.archive?'checked':''}><span>Archivé : n'est plus proposé, reste sur les anciennes actions</span></label>`;
  h+=`<div class="btns stick"><button class="btn primary" id="sv">${I.check} Enregistrer</button></div>`;return h;},
 after:()=>{$('rn').oninput=e=>{x.nom=e.target.value;};const rd=$('rd');if(rd){rd.onchange=()=>x.debut=rd.value;$('rf').onchange=e=>x.fin=e.target.value;$('rdef').onchange=e=>x.defaut=e.target.checked;}
  const ra=$('rarr');if(ra)ra.onchange=()=>{x.arr=parseInt(ra.value,10)||null;};body.querySelectorAll('[data-cz]').forEach(b=>b.onclick=()=>{const c=+b.dataset.cz,i=x.circos.indexOf(c);if(i>=0)x.circos.splice(i,1);else x.circos.push(c);x.circos.sort((a,b)=>a-b);render(true);});body.querySelectorAll('[data-mc]').forEach(b=>b.onclick=()=>{x.campagne=b.dataset.mc;render(true);});
  $('rar').onchange=e=>{x.archive=e.target.checked;};
  $('sv').onclick=()=>{if(!x.nom.trim()){toast('Indiquez un nom.');return;}if(k==='ga'&&(!x.arr||!x.circos.length)){toast('Indiquez l\'arrondissement et au moins une circonscription.');return;}if(k==='campagnes'&&x.defaut)REF.campagnes.forEach(c=>c.defaut=false);if(j>=0)REF[k][j]=x;else REF[k].push(x);sauverREF();back();toast('Liste mise à jour');};}};}
function vueUsers(){return {id:'users',html:()=>{let h=headHTML('Personnes et accès','Seuls les administrateurs entrent dans la console.',true);
  h+=`<div class="note">Chacun se connecte avec l'identifiant et le mot de passe que vous lui donnez ici. Pour retirer un accès : « Accès suspendu ».</div>`;
  h+=`<div class="btns"><button class="btn primary" id="add">${I.plus} Ajouter une personne</button></div>`;
  h+=REF.users.map((u,j)=>`<div class="row p"><button class="tx" data-uj="${j}"><b>${esc(u.nom)}</b><small>${u.profil==='admin'?'Administrateur':'Utilisateur'} · ${esc(circosTxt(u))} · ${u.login?'identifiant '+esc(u.login):'pas d\'identifiant'}${u.actif?'':' · suspendu'}</small></button><span class="chev">${I.next}</span></div>`).join('');return h;},
 after:()=>{$('add').onclick=()=>detail(vueUserEdit(-1));body.querySelectorAll('[data-uj]').forEach(b=>b.onclick=()=>detail(vueUserEdit(+b.dataset.uj)));}};}
function vueUserEdit(j){const ancien=j>=0?REF.users[j]:null,x=j>=0?JSON.parse(JSON.stringify(REF.users[j])):{id:uid().slice(0,8),nom:'',contact:'',login:'',profil:'utilisateur',circos:D?[D.k]:[],actif:true};let mdp='';
 if(!Array.isArray(x.circos))x.circos=TOUTES.slice();delete x.ga;
 return {id:'useredit',html:()=>{let h=headHTML(j>=0?esc(x.nom):'Ajouter une personne','',true);
  h+=`<label class="fld" for="un">Nom<input id="un" value="${esc(x.nom)}" autocomplete="off"></label><label class="fld" for="uc">Contact (e-mail ou téléphone)<input id="uc" value="${esc(x.contact)}" autocomplete="off"></label>`;
  h+=`<label class="fld" for="ul">Identifiant<input id="ul" value="${esc(x.login||'')}" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"></label>`;
  h+=`<label class="fld" for="up">${x.login&&ancien&&ancien.login?'Nouveau mot de passe (vide : inchangé)':'Mot de passe (7 caractères au moins)'}<span class="kw"><input id="up" type="text" value="${esc(mdp)}" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"><button type="button" class="ib" id="ug" aria-label="Proposer un mot de passe">${I.spark}</button></span></label>`;
  h+=`<div class="hint">Donnez-les à la personne, de vive voix ou par message. L'appli ne les garde nulle part en clair.</div>`;
  h+=`<div class="fl"><span>Profil</span><div class="seg" role="group"><button data-pf="utilisateur" aria-pressed="${x.profil==='utilisateur'}">Utilisateur</button><button data-pf="admin" aria-pressed="${x.profil==='admin'}">Administrateur</button></div></div>`;
  h+=x.profil==='admin'?`<div class="fl"><span>Circonscriptions</span><div class="hint" style="margin:0">Un administrateur a accès aux 18 circonscriptions.</div></div>`
   :`<div class="fl"><span>Circonscriptions (une ou plusieurs)</span><div class="ch2 num">${TOUTES.map(n=>`<button data-cz="${n}" aria-pressed="${x.circos.includes(n)}">${n}</button>`).join('')}</div><div class="ch2" style="margin-top:8px"><button data-czt="1">Toutes</button><button data-czt="0">Aucune</button></div></div>`;
  h+=`<label class="ckb"><input type="checkbox" id="ua" ${x.actif?'':'checked'}><span>Accès suspendu</span></label>`;
  h+=`<div class="btns stick"><button class="btn primary" id="sv">${I.check} Enregistrer</button></div>`;return h;},
 after:()=>{$('un').oninput=e=>{x.nom=e.target.value;};$('uc').oninput=e=>{x.contact=e.target.value;};
  body.querySelectorAll('[data-pf]').forEach(b=>b.onclick=()=>{x.profil=b.dataset.pf;render(true);});
  body.querySelectorAll('[data-cz]').forEach(b=>b.onclick=()=>{const c=+b.dataset.cz,k=x.circos.indexOf(c);if(k>=0)x.circos.splice(k,1);else x.circos.push(c);x.circos.sort((a,b)=>a-b);render(true);});
  body.querySelectorAll('[data-czt]').forEach(b=>b.onclick=()=>{x.circos=b.dataset.czt==='1'?TOUTES.slice():[];render(true);});
  $('ua').onchange=e=>{x.actif=!e.target.checked;};
  $('ul').oninput=e=>{x.login=normLogin(e.target.value);};$('up').oninput=e=>{mdp=e.target.value;};$('ug').onclick=()=>{mdp=mdpPropose();$('up').value=mdp;};
  $('sv').onclick=async()=>{if(!x.nom.trim()){toast('Indiquez un nom.');return;}
   if(x.profil!=='admin'&&!x.circos.length){toast('Cochez au moins une circonscription.');return;}
   const admins=REF.users.filter((u,i)=>i!==j&&u.profil==='admin'&&u.actif).length+(x.profil==='admin'&&x.actif?1:0);if(admins<2){toast('Il faut toujours au moins deux administrateurs.');return;}
   if(x.login&&REF.users.some((u,i)=>i!==j&&u.login===x.login)){toast('Cet identifiant est déjà pris.');return;}
   const change=!ancien||ancien.login!==x.login||ancien.profil!==x.profil||(!ancien.actif&&x.actif);
   if(x.login&&x.actif&&change&&!mdp){toast('Indiquez un mot de passe pour cet identifiant.');return;}
   if(mdp&&mdp.length<7){toast('Le mot de passe doit faire 7 caractères au moins.');return;}
   if(mdp&&!x.login){toast('Indiquez un identifiant.');return;}
   const sv=$('sv');sv.disabled=true;
   const r=await majCompte(x,ancien,mdp);sv.disabled=false;if(!r.ok){toast(msgAcces(r));return;}
   const y=JSON.parse(JSON.stringify(x));if(y.profil==='admin')delete y.circos;
   if(j>=0)REF.users[j]=y;else REF.users.push(y);sauverREF();back();toast(mdp?`Accès enregistré : identifiant « ${x.login} »`:j>=0?'Fiche modifiée':x.nom+' ajouté à la liste');};}};}
function vueReglages(){const R=JSON.parse(JSON.stringify(REF.reglages));R.scrutins=R.scrutins||[];let nd='';
 return {id:'reglages',html:()=>{let h=headHTML('Réglages','',true);
  h+=`<div class="cpts one">${cptHTML('delaiFaite','Jours avant de reproposer une adresse faite',R.delaiFaite)}${cptHTML('delaiFerme','Jours avant de reproposer une adresse fermée',R.delaiFerme)}</div>`;
  h+=`<div class="fl"><span>Taille de PAP proposée par défaut</span><div class="seg" role="group">${[50,100,150,200].map(t=>`<button data-tl="${t}" aria-pressed="${R.taille===t}">${t} inscrits</button>`).join('')}</div></div>`;
  h+=`<h2>Dates de scrutin</h2><div class="hint">La diff et le boîtage sont bloqués de la veille à 0 h jusqu'à la fin du jour du scrutin (code électoral, article L. 49).</div>`;
  h+=R.scrutins.map((s,j)=>`<div class="row p"><div class="tx"><b>${fmtJH(s)}</b></div><button class="rm" data-sd="${j}" aria-label="Retirer">${I.x}</button></div>`).join('');
  h+=`<div class="addn two"><input type="date" id="nd" value="${nd}" aria-label="Date de scrutin"><button class="btn line" id="ndok">Ajouter</button></div>`;
  h+=`<div class="btns stick"><button class="btn primary" id="sv">${I.check} Enregistrer</button></div>`;return h;},
 after:()=>{lierCpt(k=>R[k],(k,v)=>{R[k]=Math.max(1,v);});body.querySelectorAll('[data-tl]').forEach(b=>b.onclick=()=>{R.taille=+b.dataset.tl;render(true);});
  body.querySelectorAll('[data-sd]').forEach(b=>b.onclick=()=>{R.scrutins.splice(+b.dataset.sd,1);render(true);});
  $('nd').onchange=e=>{nd=e.target.value;};$('ndok').onclick=()=>{if(nd){R.scrutins.push(nd);R.scrutins.sort();nd='';render(true);}};
  $('sv').onclick=()=>{REF.reglages=R;sauverREF();taille=R.taille;back();toast('Réglages enregistrés');};}};}
function vueControles(){return {id:'controles',html:()=>{const l=aVerifier();let h=headHTML('Contrôles',l.length?`${pl(l.length,'saisie','saisies')} à vérifier`:'Rien à vérifier',true);
  h+=l.map(([a,r])=>`<div class="row p"><button class="tx" data-act="${a.id}"><b>${esc(a.nom)}</b><small>${esc(r)} · ${resumeA(a)}</small></button></div>`).join('');return h;}};}
function vueDonnees(){return {id:'donnees',html:()=>{let h=headHTML('Données','Fournies par l\'Agent Électoral, en lecture seule',true);
  h+=`<div class="meta2"><div><span>Fichier</span><b>circo_${pad2(D.k)}</b></div><div><span>Modèle</span><b>Paris 2027 v5.7</b></div><div><span>Adresses</span><b>${n0(D.adresses.length)}</b></div></div>`;
  h+=`<div class="src" style="margin-top:12px">Ville de Paris (bureaux de vote, voirie, espaces verts, voies d'eau, marchés), IGN (bâti), Île-de-France Mobilités (entrées par heure, 2e trimestre 2026), Google (affluence des supermarchés, relevée les 10 et 11 octobre 2026), Apur (commerces 2023), Ville de Paris (quartiers prioritaires), Insee (quartiers, carrés de 200 m), modèle Paris 2027 v5.7. ${esc(D.ni_src||'')}</div>`;return h;}};}
/* menu : actions, circonscription, legende, affichage, administration (administrateurs), deconnexion */
function ouvrirMenu(){const m=$('menu'),u=moi(),t=themeDe(),enCirco=!!(D&&!$('searchbox').hidden);$('res').hidden=true;
 const nA=jEnAttente();m.innerHTML=`<div class="mh"><b>${esc(u.nom)}</b><span>${u.profil==='admin'?'Administrateur':'Utilisateur'} · ${esc(circosTxt(u))}</span>${nA?`<span class="att">${pl(nA,'action')} en attente d'envoi au journal</span>`:''}</div>`+
  (enCirco?`<button class="mi" role="menuitem" data-mi="actions">${I.list}<span>Toutes les actions</span></button><button class="mi" role="menuitem" data-mi="paris">${I.carte}<span>Changer de circonscription</span></button><button class="mi" role="menuitem" data-mi="legende">${I.couches}<span>Légende</span></button><div class="sep"></div>`:'')+
  `<div class="mi th"><span>Affichage</span><div class="seg sm" role="group" aria-label="Affichage">${[['auto','Téléphone'],['clair','Clair'],['sombre','Sombre']].map(([k,x])=>`<button data-th="${k}" aria-pressed="${t===k}">${x}</button>`).join('')}</div></div><div class="sep"></div>`+
  (estAdmin()?`<button class="mi adm" role="menuitem" data-mi="admin">${I.admin}<span>Administration</span></button>`:'')+
  `<button class="mi" role="menuitem" data-mi="deco">${I.sortie}<span>Se déconnecter</span></button>`;
 m.hidden=false;$('mback').hidden=false;
 m.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{LS.set('theme_'+MOI,b.dataset.th);appliquerTheme();m.querySelectorAll('[data-th]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
 m.querySelectorAll('[data-mi]').forEach(b=>b.onclick=()=>{const k=b.dataset.mi;fermerMenu();
  if(k==='actions'){if(det==='peek')setDet('half');detail(vueActions({type:'tous'}));}
  else if(k==='paris'){$('q').value='';ecranParis();}
  else if(k==='legende'){if(det==='peek')setDet('half');detail(vueLegende());}
  else if(k==='admin'){const go=()=>{setDet('half');detail(vueConsole());};if(enCirco)go();else ouvrir(+LS.get('dernCirco',6)||6,go);}
  else if(k==='deco')deconnecter();});}
function fermerMenu(){$('menu').hidden=true;$('mback').hidden=true;}
$('moi').onclick=ouvrirMenu;$('menuP').onclick=ouvrirMenu;$('mback').onclick=fermerMenu;
addEventListener('keydown',e=>{if(e.key==='Escape')fermerMenu();});

/* ---------------- legende */
function vueLegende(){return {id:'leg',html:()=>{let h=headHTML('Légende','',true);
 h+=`<h2>Zones</h2>`+[1,2,3].map(z=>`<div class="leg"><i style="background:var(--z${z})"></i><div><b>Zone n°${z}</b>, ${ZD[z]}</div></div>`).join('');
 h+=`<h2>Adresses</h2><div class="leg"><i style="background:var(--z1)"></i><div>Rond plein en couleur : adresse prioritaire selon vos curseurs (score de ${crit.score} et plus, ${pl(crit.ins,'inscrit')} ou plus${crit.ni>0?`, ${pl(crit.ni,'non-inscrit')} estimé${crit.ni>1?'s':''} ou plus`:''}), dans la couleur de sa zone.</div></div>
  <div class="leg"><i style="background:var(--dot)"></i><div>Rond gris : les autres adresses.</div></div><div class="leg"><span></span><div>Le score est le rang de l'adresse dans la circonscription : 70 veut dire plus prioritaire que 70 % des adresses de la circo. Il combine la situation sociale du quartier (40 %), l'âge des inscrits (30 %) et la participation dans le bureau (30 %).</div></div><div class="leg"><i style="background:var(--ok)"></i><div>Rond vert : adresse faite pendant la campagne en cours (${esc(campNom(campDefaut()))}). Une adresse peut être faite plusieurs fois : l'onglet Liste et la fiche de l'adresse donnent le nombre de passages.</div></div><div class="leg"><i style="background:var(--ko)"></i><div>Rond orange : pas pu entrer.</div></div><div class="leg"><i class="anneau"></i><div>Rond blanc cerclé : adresse prévue dans un PAP à faire.</div></div><div class="leg"><span></span><div>La taille du point dit le nombre d'inscrits.</div></div>`;
 h+=`<h2>Tractage</h2>${[['mk-m','M','Station de métro, RER ou tram',14],['mk-ma',I.basket,'Marché',18],['mk-c g',I.cart,'Supermarché',14],['mk-p',I.pied,"Pied d'immeuble : secteur en pointillé",18]].map(([c,x,t,s])=>`<div class="leg"><div class="mk ${c}" style="width:${s}px;height:${s}px;margin:2px 0 0 ${(22-s)/2}px">${x}</div><div>${t}</div></div>`).join('')}
  <div class="leg"><span></span><div>Le cercle autour d'une station dit le nombre d'entrées au moment choisi. Les marchés fermés et les supermarchés vides à ce moment s'estompent.</div></div>
  <div class="leg"><span></span><div>Priorité du secteur : part des inscrits à moins de 300 m qui habitent une adresse au score de ${crit.score} ou plus. Très prioritaire à partir de 50 %, prioritaire de 30 à 50 %.</div></div>
  <div class="leg"><span></span><div>Supermarchés : affluence habituelle, en % du moment le plus chargé de la semaine. Pieds d'immeuble : aucune mesure n'existe ; l'animation du quartier est estimée d'après l'affluence des supermarchés proches.</div></div>
  <div class="leg"><span></span><div>Pieds d'immeuble retenus : quartier prioritaire, ou au moins 200 logements sociaux (40 % des ménages) dans un carré de 200 m, ou 60 % des inscrits dans des adresses prioritaires.</div></div>`;
 if(QS&&QS.paris_max)h+=`<h2>Ce quartier par rapport à la circonscription</h2><div class="bar j lj"><div class="jv"><b style="left:46%">le quartier</b></div><div class="tr"><i style="width:46%"></i><u style="left:30%"></u></div><div class="jl"><em class="md" style="left:30%">médiane de la circo</em><em class="mx">max de la circo</em></div></div>
  <ul class="puces"><li>La barre et le chiffre au-dessus : le quartier de l'adresse.</li><li>Le trait : la médiane de la circonscription ; la moitié de ses inscrits vivent dans un quartier à ce niveau ou en dessous.</li><li>Le bout de la jauge : le quartier le plus touché de la circonscription.</li><li>Maximum à Paris : ${QN.map((t,j)=>`${t.toLowerCase()} ${QS.paris_max[j]} %`).join(', ')}.</li><li>Quartiers de moins de ${QS.seuil} inscrits écartés des maximums.</li></ul>`;
 h+=`<h2>Sources</h2><div class="src">Ville de Paris (bureaux de vote, voirie, espaces verts, voies d'eau, marchés), IGN (bâti), Île-de-France Mobilités (entrées par heure, 2e trimestre 2026), Google (affluence des supermarchés, relevée les 10 et 11 octobre 2026), Apur (commerces 2023), Ville de Paris (quartiers prioritaires), Insee (quartiers, carrés de 200 m), modèle Paris 2027 v5.7. ${esc(D.ni_src||'')}</div>`;
 return h;}};}

/* ---------------- recherche : accents, fautes d'une lettre, bis et ter */
let IDX=[];
const normA=s=>norm(s).replace(/\b(\d+) ?(bis|b)\b/g,'$1b').replace(/\b(\d+) ?(ter|t)\b/g,'$1t');
function near1(a,b){if(a===b)return true;const la=a.length,lb=b.length;if(Math.abs(la-lb)>1)return false;let i=0,j=0,e=0;
 while(i<la&&j<lb){if(a[i]===b[j]){i++;j++;continue;}if(++e>1)return false;if(la>lb)i++;else if(lb>la)j++;else{i++;j++;}}return e+(la-i)+(lb-j)<=1;}
function indexer(){IDX=[];
 Object.keys(VOIES).forEach(v=>IDX.push({t:v,s:pl(VOIES[v].length,'numéro'),k:'Rue',n:normA(v),r:1,go:()=>vueRueOuvrir(v)}));
 D.fond.noms.forEach(x=>{const k=normA(x[3]);if(!IDX.some(y=>y.k==='Rue'&&y.n===k)&&!IDX.some(y=>y.k==='Voie'&&y.n===k))IDX.push({t:x[3],s:'',k:'Voie',n:k,r:1,go:()=>map.flyTo([x[1],x[0]],17,{duration:.5})});});
 D.adresses.forEach((a,i)=>IDX.push({t:a[2],s:adrSub(a),k:'Adresse',n:normA(a[2]),r:2,go:()=>mode==='boitage'?ouvrirAdresseB(i):ouvrirAdresse(i)}));
 D.metro.forEach(s=>IDX.push({t:s.nom,s:'Métro '+s.lignes.join(', '),k:'Station',n:normA(s.nom+' metro station'),r:0,go:()=>ouvrirStation(s)}));
 D.marches.forEach(s=>IDX.push({t:s.nom,s:joursMarche(s),k:'Marché',n:normA(s.nom+' marche'),r:0,go:()=>ouvrirMarche(s)}));
 (D.supers||[]).forEach(s=>IDX.push({t:nomSup(s),s:s.cat||'Supermarché',k:'Magasin',n:normA((s.ens||'')+' '+(s.nom||'')+' '+s.adr),r:2,go:()=>ouvrirMagasin(s)}));
 (D.pieds||[]).forEach(s=>IDX.push({t:s.nom,s:"Pied d'immeuble",k:'Secteur',n:normA(s.nom+' '+s.qpv.map(q=>q.nom).join(' ')),r:2,go:()=>ouvrirPied(s)}));
 (D.lieux_vote||[]).forEach(s=>IDX.push({t:`${s.nom}, ${s.adr}`,s:`bureau${s.bv.length>1?'x':''} ${s.bv.join(', ')}`,k:'Lieu de vote',n:normA(`${s.nom} ${s.adr} ecole bureau vote`),r:1,go:()=>{map.flyTo([s.lat,s.lon],17,{duration:.5});const b=s.bv.find(x=>BZ[x]);if(b&&mode==='pap')ouvrirBureau(b);}}));
 D.bureaux.forEach(f=>IDX.push({t:'Bureau '+f.properties.id,s:'Zone n°'+f.properties.zone,k:'Bureau',n:normA('bureau '+f.properties.id),r:0,go:()=>{if(mode!=='pap')setMode('pap');ouvrirBureau(f.properties.id);}}));}
const ICO={Rue:I.route,Voie:I.route,Adresse:I.home,Station:'<b style="font:700 12px var(--f)">M</b>','Marché':I.basket,Magasin:I.cart,Secteur:I.pied,Bureau:I.grid,'Lieu de vote':I.grid};
function chercher(){const q=normA($('q').value),res=$('res');$('qx').hidden=!$('q').value;if(q.length<2){res.hidden=true;return;}
 const m=q.split(' '),num=/^\d/.test(q);
 const score=x=>(x.n.startsWith(q)?0:2)+(num?(x.k==='Adresse'?-1:1):x.r)+x.t.length/200;
 let r=IDX.filter(x=>m.every(w=>x.n.includes(w))).map(x=>({x,s:score(x)}));
 if(r.length<3&&m.some(w=>w.length>5)){const deja=new Set(r.map(o=>o.x));IDX.forEach(x=>{if(deja.has(x))return;const ws=x.w||(x.w=x.n.split(' '));if(m.every(w=>x.n.includes(w)||(w.length>5&&ws.some(t=>near1(w,t)))))r.push({x,s:score(x)+3});});}
 r=r.sort((a,b)=>a.s-b.s).slice(0,12);
 res.hidden=false;res.innerHTML=r.length?r.map((o,k)=>`<button class="res" data-k="${k}"><span class="ico">${ICO[o.x.k]}</span><span><b>${esc(o.x.t)}</b><small>${esc(o.x.k)}${o.x.s?' · '+esc(o.x.s):''}</small></span></button>`).join(''):'<div class="empty">Rien trouvé dans la circonscription.</div>';
 res.querySelectorAll('.res').forEach(b=>b.onclick=()=>{const o=r[+b.dataset.k].x;res.hidden=true;$('q').blur();o.go();});}
$('q').addEventListener('input',chercher);$('q').addEventListener('focus',chercher);
$('q').addEventListener('keydown',e=>{if(e.key==='Enter'){const b=$('res').querySelector('.res');if(b)b.click();}if(e.key==='Escape'){$('res').hidden=true;$('q').blur();}});
$('qx').onclick=()=>{$('q').value='';$('res').hidden=true;$('qx').hidden=true;};
map.on('click',()=>{$('res').hidden=true;});
$('toParis').onclick=()=>{$('q').value='';$('res').hidden=true;ecranParis();};
$('fLeg').onclick=()=>{detail(vueLegende());if(det==='peek')setDet('half');};
let meL=null;
function localiser(fn,silent){if(!navigator.geolocation){toast('Position indisponible sur cet appareil. Touchez « Centre de la carte ».');return;}
 navigator.geolocation.getCurrentPosition(p=>{const ll=[p.coords.latitude,p.coords.longitude];posMoi=ll;if(meL)map.removeLayer(meL);meL=L.marker(ll,{pane:'pap',interactive:false,icon:L.divIcon({className:'',html:'<div class="me"></div>',iconSize:[14,14],iconAnchor:[7,7]})}).addTo(map);if(fn)fn(ll);else map.flyTo(ll,17,{duration:.5});},
  e=>toast(e&&e.code===1?'Position refusée. Pour l\'activer : réglages du téléphone, puis du navigateur, puis Position. En attendant, touchez « Centre de la carte ».':'Position introuvable ici. Réessayez dehors, ou touchez « Centre de la carte ».'),{enableHighAccuracy:true,timeout:8000,maximumAge:60000});}
$('fCtr').onclick=()=>{if(app.classList.contains('tabs')&&D)map.flyToBounds(D.bounds,{...pad(),duration:.4});else if(P)map.flyToBounds(P.bounds,{...pad(56),duration:.4});};
$('fMe').onclick=()=>localiser(mode==='tractage'?(ll=>{map.flyTo(ll,16,{duration:.5});if(TRI==='pres'){const v=stack[stack.length-1];if(v&&v.id==='base')render(true);}}):null);

/* theme */
const reth=()=>{if(D&&fondL&&map.hasLayer(fondL)){styler();dessinerParcours();dessinerLot();majBulles();}if(parisL&&map.hasLayer(parisL))stParis();};
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',reth);}catch(e){}
new MutationObserver(reth).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

/* connexion : voir js5/p5_journal.js (identifiant et mot de passe) ; se deconnecter oublie l'acces sur ce telephone */
function deconnecter(){oublierAcces();$('q').value='';$('res').hidden=true;ecranConnexion(()=>{ecranParis();const c=circoDepart();if(c)choisir(c);});}

/* demarrage : connexion, puis choix de la circonscription (la derniere est proposee), ou action recue par lien */
setDet('fit');
body.innerHTML='<div class="load">Chargement…</div>';
const H0=(()=>{const m=/#(?:pap|act)=(\d+):(\d+):(?:(pap|boitage):)?([\d.]+)/.exec(location.hash||'');return m?{circo:+m[1],n:+m[2],type:m[3]||'pap',ids:m[4].split('.').map(Number)}:null;})();
function demarrer(){fetch('d/quartiers.json').then(r=>r.json()).then(q=>{QS=q;}).catch(()=>{});fetch('d/paris.json').then(r=>r.json()).then(p=>{P=p;
 if(H0&&H0.circo>=1&&H0.circo<=18&&!peutCirco(H0.circo)){ecranParis();choisir(H0.circo);toast('Ce lien concerne une circonscription qui n\'est pas dans les vôtres.');}
 else if(H0&&H0.circo>=1&&H0.circo<=18)ouvrir(H0.circo,()=>{try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}
  if(H0.n!==D.adresses.length){toast('Ce lien vient d\'une autre version des données : action non chargée.');return;}const ids=H0.ids.filter(i=>D.adresses[i]);if(ids.length)preparer(null,'',null,ids,H0.type==='boitage'?'Boîtage reçu':'Action reçue');});
 else{ecranParis();const c=circoDepart();if(c)choisir(c);}}).catch(()=>{body.innerHTML='<div class="load">La carte de Paris n\'a pas pu être chargée. Vérifiez la connexion, puis réessayez.</div>';});}
/* lancement : a la fin de js5/p5_journal.js */
