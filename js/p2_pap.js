
/* ---------------- actions : on les prepare (PAP, boitage) ou on les fait en direct (diffs), puis chacun peut les renseigner */
const TYPES={pap:'Porte-à-porte',boitage:'Boîtage',diff_marche:'Diff en marché',diff_supermarche:'Diff supermarché',diff_metro:'Diff en métro',diff_pied:'Diff en pied d\'immeuble'};
const TYPES_C={pap:'PAP',boitage:'Boîtage',diff_marche:'Marché',diff_supermarche:'Supermarché',diff_metro:'Métro',diff_pied:'Pied d\'immeuble'};
const actPar=id=>ACTIONS.find(a=>a.id===id);
const sauverA=()=>{LS.set('actions'+D.k,ACTIONS);deriver();stylerAdr();jPlanifier();};
function saisie(a,quoi){const u=moi().id,now=isoD(new Date()),l=a.saisies[a.saisies.length-1];
 if(l&&l.par===u&&l.quoi===quoi&&ageJ(l.le)*1440<10){l.le=now;return;}a.saisies.push({par:u,le:now,quoi});}
/* GA d'une nouvelle action : le dernier choisi sur ce téléphone s'il mène des actions dans cette circo, sinon le seul GA de la circo s'il n'y en a qu'un */
function gaDefaut(){const act=gaActifs(),d=(LS.get('dga',null)||[]).filter(g=>act.some(x=>x.id===g));return d.length?d.slice():act.length===1?[act[0].id]:[];}
function nouvelleAction(type,x){
 return Object.assign({id:uid(),type,nom:'',campagne:campDefaut(),ga:gaDefaut(),statut:'a_faire',prevue:'',faite_le:'',nb:nbm,tracts:0,materiel:'',etapes:[],saisies:[],cree_par:moi().id,cree_le:isoD(new Date())},x||{});}
const etapeAdr=i=>({lieu:{t:'adresse',id:AID(i)},portes:0,toquees:0,ouvertes:0,st:'',acc:'',boites:0,le:''});
const idxE=e=>e.lieu.t==='adresse'?BYID[e.lieu.id]:null;
const lieuNom=e=>e?(e.lieu.t==='adresse'?e.lieu.id:e.lieu.id):'';
function deriver(){faites={};ACC={};BOI={};
 ACTIONS.forEach(a=>a.etapes.forEach(e=>{if(e.lieu.t!=='adresse')return;const q=e.le||a.faite_le||a.cree_le,id=e.lieu.id;
  if(a.type==='pap'){if(e.toquees>0||e.st==='faite'){if(!faites[id]||faites[id]<q)faites[id]=q;}else if(e.st==='ferme'){if(!ACC[id]||ACC[id].q<q)ACC[id]={q,r:e.acc};}}
  else if(a.type==='boitage'&&(e.st==='boite'||e.st==='ferme')){if(!BOI[id]||BOI[id].q<q)BOI[id]={q,st:e.st};}}));}
function voieDe(e){const i=idxE(e);return i!=null&&typeof ADRP!=='undefined'&&ADRP[i]?ADRP[i].voie:(e.lieu.voie||'');}
function nomDefaut(a){const v=a.etapes.length?voieDe(a.etapes[0])||lieuNom(a.etapes[0]):'';return `${TYPES_C[a.type]}${v?' '+v:''}`;}
const ordreAct=(a,b)=>(a.prevue||'9999')<(b.prevue||'9999')?-1:(a.prevue||'9999')>(b.prevue||'9999')?1:(b.cree_le>a.cree_le?1:-1);
function resumeA(a){const ga=a.ga.map(gaNom).join(', ');const d=a.statut==='faite'?(a.faite_le?'faite le '+fmtJ(a.faite_le):'faite'):a.prevue?'prévue le '+fmtJ(a.prevue):'sans date';
 let q='';if(a.type==='pap'){const t=a.etapes.reduce((s,e)=>s+e.toquees,0),o=a.etapes.reduce((s,e)=>s+e.ouvertes,0);q=`${pl(a.etapes.length,'adresse')}${t?` · ${t} toquée${t>1?'s':''}, ${o} ouverte${o>1?'s':''}`:''}`;}
 else if(a.type==='boitage'){const b=a.etapes.filter(e=>e.st==='boite').length;q=`${pl(a.etapes.length,'numéro')}${b?` · ${b} boîté${b>1?'s':''}`:''}`;}
 else q=`${n0(a.tracts)} tracts`;
 return `${d} · ${esc(ga)} · ${q}`;}
const sttHTML=a=>`<span class="stt ${a.statut}">${a.statut==='faite'?'Faite':'À faire'}</span>`;
const rowAction=a=>`<div class="row p"><button class="tx" data-act="${a.id}"><b>${esc(a.nom||TYPES[a.type])}</b><small>${resumeA(a)}</small></button>${sttHTML(a)}</div>`;
function blocActions(type){const l=ACTIONS.filter(a=>a.type===type),af=l.filter(a=>a.statut==='a_faire').sort(ordreAct);
 let h=`<h2>Actions ${type==='pap'?'de porte-à-porte':'de boîtage'} à faire</h2>`;
 h+=af.length?af.slice(0,3).map(rowAction).join(''):`<div class="empty">Aucune pour l'instant. Préparez-en une ci-dessous.</div>`;
 if(l.length)h+=`<button class="lnk2" data-va="${type}">Toutes les actions ${type==='pap'?'de porte-à-porte':'de boîtage'} (${l.length})</button>`;return h;}
/* l'action ouverte est dessinee sur la carte */
function majOuverte(){let ao=null;for(let k=stack.length-1;k>=0;k--){if(stack[k].aid){ao=stack[k].aid;break;}}if(ao!==ACT_OUV){ACT_OUV=ao;if(ao)LS.set('ouv'+D.k,ao);dessinerParcours();stylerAdr();}}
function dessinerParcours(){if(!papL)return;papL.clearLayers();if(!D)return;
 const a=ACT_OUV&&actPar(ACT_OUV);let ids;if(a){if(a.type!=='pap'&&a.type!=='boitage')return;ids=a.etapes.map(idxE).filter(i=>i!=null);}else if(mode==='pap')ids=SEL;else return;
 if(!ids.length)return;const ll=ids.map(ptA),ac=tok('--accent');
 if(ll.length>1)L.polyline(ll,{renderer:rP,color:ac,weight:2,opacity:.9,dashArray:'1 5',lineCap:'round',interactive:false}).addTo(papL);
 if(a&&a.type==='boitage'){L.marker(ll[0],{pane:'pap',interactive:false,icon:L.divIcon({className:'',html:'<div class="start-pin"></div>',iconSize:[14,14],iconAnchor:[7,7]})}).addTo(papL);return;}
 ids.forEach((i,k)=>{const e=a?a.etapes[k]:null,ok=e&&(e.toquees>0||e.st);const m=L.marker(ll[k],{pane:'pap',icon:L.divIcon({className:'',html:`<div class="pin${ok?' fa':''}${a?'':' sel'}">${ok?'✓':k+1}</div>`,iconSize:[26,26],iconAnchor:[13,13]})});
  m.on('click',()=>a?ouvrirEtape(a.id,k):ouvrirAdresse(i));papL.addLayer(m);});}

/* ---------------- porte-a-porte : accueil */
function adrSub(a){return `Bureau ${esc(a[8])} · ${pl(a[3],'inscrit')}`;}
const addBtn=(i)=>{const inS=SEL.includes(i);return `<button class="addb${inS?' in':''}" data-add="${i}" aria-label="${inS?'Retirer de la sélection':'Ajouter à la sélection'}">${inS?I.check+'Ajoutée':I.plus+'Ajouter'}</button>`;};
const faiteTxt=i=>{const f=faites[AID(i)],x=ACC[AID(i)];return f?` · faite le ${fmtJ(f)}`:x?` · pas pu entrer le ${fmtJ(x.q)}`:'';};
function rowAdr(i,num,noAct){const a=D.adresses[i],z=zoneOf(a);
 const left=num?`<span class="nb">${num}</span>`:`<span class="zd" style="background:var(--z${z})"></span>`;
 return `<div class="row${num?' n':''}">${left}<button class="tx" data-i="${i}"><b>${esc(a[2])}</b><small>${adrSub(a)}${faiteTxt(i)}</small></button><span class="sc">${Math.round(a[5])}<small>score</small></span>`+
  (noAct?'':num?`<button class="rm" data-rm="${i}" aria-label="Retirer de la sélection">${I.x}</button>`:addBtn(i))+`</div>`;}
function lierRows(){body.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>ouvrirAdresse(+b.dataset.i));
 body.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{basculer(+b.dataset.add);render(true);});
 body.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{basculer(+b.dataset.rm);render(true);});}
function visibles(){const b=map.getBounds();const r=[];D.adresses.forEach((a,i)=>{if(a[3]<1||!b.contains([a[1],a[0]]))return;if(!isPr(a))return;if(faites[a[2]]&&!chips.faites)return;r.push(i);});
 return r.sort((x,y)=>D.adresses[y][5]-D.adresses[x][5]||D.adresses[y][3]-D.adresses[x][3]);}
const insDe=ids=>ids.reduce((s,i)=>s+D.adresses[i][3],0);
function selBar(){if(!SEL.length)return '';
 return `<div class="btns"><button class="btn primary" id="vSel">${I.route} Ma sélection · ${pl(SEL.length,'adresse')} · ${n0(insDe(SEL))} inscrits</button></div>`;}
function listeHTML(){const v=visibles(),top=v.slice(0,30);
 let h=top.length?top.map(i=>rowAdr(i)).join(''):`<div class="empty">Aucune adresse prioritaire ici. Déplacez la carte ou baissez les curseurs.</div>`;
 if(v.length>30)h+=`<div class="sub" style="margin-top:10px">Les 30 meilleures sur ${n0(v.length)}. Zoomez pour affiner.</div>`;return h;}
function compteEcran(){const b=map.getBounds();let n=0,ins=0;D.adresses.forEach((a,i)=>{if(isPr(a)&&b.contains([a[1],a[0]])&&!(faites[a[2]]&&!chips.faites)){n++;ins+=a[3];}});
 return `<b class="acc">${n0(n)}</b> adresse${n>1?'s':''} prioritaire${n>1?'s':''} à l'écran · <b class="acc">${n0(ins)}</b> inscrits`;}
function majListe(){const c=$('nPr'),l=$('lst');if(!c||!l)return;c.innerHTML=compteEcran();l.innerHTML=listeHTML();lierRows();}
const scoreTxt=()=>`Score : rang de l'adresse dans la circonscription. ${crit.score} veut dire plus prioritaire que ${crit.score} % des adresses de la circo.`;
function vueAccueil(){return {id:'base',html:()=>{const mx=Math.min(80,Math.max(...D.adresses.map(a=>a[3])));
  let h=`<div class="head"><div class="tt"><h1>Porte-à-porte</h1><div class="sub" id="nPr">${compteEcran()}</div></div></div>`;
  h+=selBar();
  h+=`<div class="slc" style="margin-top:6px"><label for="rS">Score</label><input type="range" id="rS" min="0" max="100" step="1" value="${crit.score}"><output id="vS">${crit.score}+</output></div>`;
  h+=`<div class="slc"><label for="rI">Inscrits</label><input type="range" id="rI" min="1" max="${mx}" step="1" value="${crit.ins}"><output id="vI">${crit.ins}+</output></div>`;
  const nM=niMax();if(crit.ni>nM)crit.ni=nM;
  h+=`<div class="slc"><label for="rN">Non-inscrits</label><input type="range" id="rN" min="0" max="${nM}" step="1" value="${crit.ni}"><output id="vN">${niTxt(crit.ni)}</output></div>`;
  h+=blocActions('pap');
  h+=`<h2>Préparer une action</h2><div class="start"><button class="btn line" id="pMe">${I.me} Autour de moi</button><button class="btn line" id="pCtr">${I.target} Centre de la carte</button></div><div class="hint">Ou touchez des adresses sur la carte, puis « Ajouter ».</div>`;
  h+=`<h2>Adresses prioritaires à l'écran</h2><div id="lst">${listeHTML()}</div>`;
  h+=`<details class="more"><summary>La ${D.k}e circonscription en chiffres</summary>${kpis([[n0(D.objectif),'voix à obtenir en 2027'],[pc(D.objectif_p),'des exprimés'],['+'+n0(D.gain),'voix par rapport à 2022']])}</details>`;
  h+=lienCR();
  return h;},after:()=>{lierRows();const p=$('vSel');if(p)p.onclick=()=>detail(vueSel());
  $('pCtr').onclick=()=>{const c=centreVisible();preparer([c.lat,c.lng],'Autour du centre de la carte');};
  $('pMe').onclick=()=>localiser(ll=>preparer(ll,'Autour de votre position'));
  const rS=$('rS'),rI=$('rI'),rN=$('rN');const peint=()=>[rS,rI,rN].forEach(r=>r.style.setProperty('--p',(100*(r.value-r.min)/(r.max-r.min))+'%'));
  const maj=()=>{crit={v:2,score:+rS.value,ins:+rI.value,ni:+rN.value};LS.set('crit',crit);peint();$('vS').textContent=crit.score+'+';const hs=$('hS');if(hs)hs.textContent=scoreTxt();PRC={};$('vI').textContent=crit.ins+'+';$('vN').textContent=niTxt(crit.ni);
   clearTimeout(regT);regT=setTimeout(()=>{filtrer();majListe();},80);};
  rS.oninput=maj;rI.oninput=maj;rN.oninput=maj;peint();}};}
function sel(i){if(!selL)return;selL.clearLayers();if(i==null)return;const a=D.adresses[i];
 L.circleMarker([a[1],a[0]],{renderer:rP,radius:rad(a[3],Math.max(map.getZoom(),16.5))+5,color:tok('--accent'),weight:2,fill:false,interactive:false}).addTo(selL);}
function voir(ll,z){const H=wide?0:hOf(det==='peek'?'half':det)+TB();z=z||map.getZoom();const pt=map.project(ll,z);const off=wide?[-190,0]:[0,(H-100)/2];
 map.flyTo(map.unproject(pt.add(off),z),z,{duration:.45});}
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),isAndroid=/Android/.test(navigator.userAgent);
const yAller=(lat,lon)=>isIOS?`https://maps.apple.com/?daddr=${lat},${lon}&dirflg=w`:isAndroid?`geo:${lat},${lon}?q=${lat},${lon}`:`https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=%3B${lat}%2C${lon}`;
/* jauges du quartier : barre et chiffre au-dessus = le quartier ; bout de la jauge = maximum de la circo ; trait = médiane de la circo (d/quartiers.json) */
let QS=null;
const QN=['Pauvreté','Chômage','Peu ou pas diplômés','Familles monoparentales'];
function jauge(t,v,md,mx){
 if(md==null||!mx)return `<div class="bar"><span>${t}</span><b>${v} %</b><div class="tr"><i style="width:${Math.min(100,v)}%"></i></div></div>`;
 const p=x=>Math.max(0,Math.min(100,100*x/mx)),pv=p(v),pm=p(md),cv=pv<6?' g':pv>94?' d':'',cm=pm<12?' g':pm>58?' d':'';
 return `<div class="bar j"><span>${t}</span><div class="jv"><b class="${cv}" style="left:${pv}%">${v} %</b></div><div class="tr"><i style="width:${pv}%"></i><u style="left:${pm}%"></u></div><div class="jl"><em class="md${cm}" style="left:${pm}%">médiane ${md} %</em><em class="mx">max ${mx} %</em></div></div>`;}
function quartierHTML(a){const q=QS&&D&&QS.circos&&QS.circos[D.k];
 return `<h2>Ce quartier par rapport à la circonscription</h2><div class="bars">${QN.map((t,j)=>jauge(t,a[10+j],q&&q.med[j],q&&q.max[j])).join('')}</div>`;}
function ouvrirAdresse(i){const a=D.adresses[i],p=BZ[a[9]]||{};if(mode!=='pap')setMode('pap');if(det==='peek')setDet('half');voir([a[1],a[0]],Math.max(map.getZoom(),16.5));sel(i);
 detail({id:'adr',html:()=>{const inS=SEL.includes(i),f=faites[a[2]],x=ACC[a[2]];
  let h=headHTML(esc(a[2]),`Bureau ${esc(a[8])}${a[8]!==a[9]?` (bureau ${esc(a[9])} en 2022)`:''} · ${pl(a[3],'inscrit')}`,true);
  if(p.zone)h+=`<div class="meta">${zTag(p.zone)}<div class="zdef">${cap(ZD[p.zone])}</div></div>`;
  h+=kpis([[a[3],'inscrits'],[Math.round(a[5])+'<small> /100</small>','score dans la circo'],[a[4],'jeunes de 18 à 25 ans']]);
  if(a[14]>=1)h+=`<div class="sub" style="margin-top:8px">Environ ${pl(a[14],'non-inscrit')} à cette adresse${FIAB[a[15]]?`, estimation de fiabilité ${FIAB[a[15]]}`:''}.</div>`;
  if(a[7]>0)h+=`<div class="sub" style="margin-top:8px">${n0(a[7])}<sup>e</sup> adresse la plus prioritaire de Paris.</div>`;
  if(f||x)h+=`<div class="done-l">${f?`${I.check}<span>PAP fait le ${fmtJ(f)}</span>`:`<span>Pas pu entrer le ${fmtJ(x.q)}${x.r&&ACCES_T[x.r]?' : '+ACCES_T[x.r].toLowerCase():''}</span>`}</div>`;
  const dans=ACTIONS.filter(t=>t.type==='pap'&&t.etapes.some(e=>e.lieu.id===a[2]));
  if(dans.length)h+=`<h2>Dans ${dans.length>1?'les actions':'l\'action'}</h2>`+dans.slice(0,4).map(rowAction).join('');
  h+=`<div class="btns"><button class="btn primary" id="ici">${I.spark} Proposer un PAP autour de cette adresse</button></div>`;
  h+=`<div class="btns two" style="margin-top:8px"><button class="btn line" id="tg">${inS?I.check+' Retirer de ma sélection':I.plus+' Ajouter à ma sélection'}</button><a class="btn line" target="_blank" rel="noopener" href="${yAller(a[1],a[0])}">${I.walk} Y aller</a></div>`;
  h+=quartierHTML(a);
  if(p.id)h+=`<div class="btns"><button class="btn line" id="bv">Voir le bureau ${esc(p.id)}</button></div>`;
  return h;},after:()=>{$('tg').onclick=()=>{basculer(i);render(true);};$('ici').onclick=()=>preparer([a[1],a[0]],'Autour de '+a[2],i);const b=$('bv');if(b)b.onclick=()=>ouvrirBureau(p.id);}});}
function ouvrirBureau(id){const p=BZ[id];if(!p)return;sel(null);if(det==='peek')setDet('half');
 const f=D.bureaux.find(x=>x.properties.id===id);voir(L.geoJSON(f).getBounds().getCenter(),Math.max(map.getZoom(),15.5));
 detail({id:'bv',html:()=>{let h=headHTML('Bureau '+esc(id),p.liste===1?'Bureau à faire voter':p.liste===2?'Bureau à convaincre':'',true);
  h+=`<div class="meta">${zTag(p.zone)}<div class="zdef">${cap(ZD[p.zone])}</div></div>`;
  h+=kpis([[pc(100*p.mel/p.exp),'Mélenchon 2022'],[n0(p.v27),'voix à obtenir en 2027'],['+'+n0(p.gain),'voix à gagner']]);
  h+=`<h2>D'où viennent les voix à gagner</h2><div class="bars">${[['Abstentionnistes de 2022',p.L1],['Jeunes électeurs',p.L2],['Électeurs d\'autres candidats',p.L3],['Nouveaux inscrits',p.L4]].map(([t,v])=>`<div class="bar"><span>${t}</span><b>${n0(v)}</b><div class="tr"><i style="width:${Math.min(100,100*v/Math.max(1,p.L1+p.L2+p.L3+p.L4))}%"></i></div></div>`).join('')}</div>`;
  h+=`<div class="sub" style="margin-top:10px">Participation 2022 : ${pc(100*p.vot/p.ins)} · ${n0(p.abst)} abstentionnistes</div>`;
  const best=D.adresses.map((a,i)=>[a,i]).filter(([a])=>a[9]===id&&isPr(a)).sort((x,y)=>y[0][5]-x[0][5]).slice(0,8).map(x=>x[1]);
  if(best.length)h+=`<h2>Adresses prioritaires du bureau</h2>`+best.map(i=>rowAdr(i)).join('');
  return h;},after:lierRows});}

/* ---------------- lot d'adresses autour d'un point : taille respectee, adresses proches */
const dist=(a,b)=>{const R=6371e3,r=Math.PI/180,dl=(b[0]-a[0])*r,dg=(b[1]-a[1])*r,x=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(x));};
let taille=LS.get('taille',null)||REF.reglages.taille||100;
function construireLot(ll,cible,i0){
 const ok=i=>isPr(D.adresses[i])&&!recente(i)&&!pasEntreRecent(i);
 const C=[];D.adresses.forEach((a,i)=>{if(ok(i)&&dist(ll,[a[1],a[0]])<2500)C.push(i);});
 const out=[],pris=new Set();let cur=ll,s=0,km=0,msg='';
 if(i0!=null){if(ok(i0)){out.push(i0);pris.add(i0);s+=D.adresses[i0][3];cur=ptA(i0);}
  else msg=`${D.adresses[i0][2]} ${recente(i0)?'a été faite récemment':pasEntreRecent(i0)?'était fermée il y a peu':'n\'est pas prioritaire'} : l'action part des adresses prioritaires les plus proches.`;}
 while(s<cible*.9){const reste=cible-s;let bi=-1,bv=-1,bd=0;
  for(const lim of (out.length?[250,400]:[300,600])){
   for(const strict of (out.length?[true]:[true,false])){
    for(const i of C){if(pris.has(i))continue;const a=D.adresses[i];if(strict&&a[3]>Math.max(reste*1.5,12))continue;const d=dist(cur,ptA(i));if(d>lim)continue;const v=a[3]*(a[5]/100)/(d+40);if(v>bv){bv=v;bi=i;bd=d;}}
    if(bi>=0)break;}
   if(bi>=0)break;}
  if(bi<0)break;if(out.length)km+=bd;out.push(bi);pris.add(bi);s+=D.adresses[bi][3];cur=ptA(bi);}
 return {ll,ids:out,ins:s,km,cible,msg};}
const kmDe=ids=>{let k=0;for(let j=1;j<ids.length;j++)k+=dist(ptA(ids[j-1]),ptA(ids[j]));return k;};
function effLot(){if(lotL)lotL.clearLayers();lot=null;}
function dessinerLot(){if(!lotL)return;lotL.clearLayers();if(!lot)return;
 if(lot.ll)L.marker(lot.ll,{pane:'pap',interactive:false,icon:L.divIcon({className:'',html:'<div class="start-pin"></div>',iconSize:[14,14],iconAnchor:[7,7]})}).addTo(lotL);
 const ll=lot.ids.map(i=>ptA(i));
 L.polyline(lot.ll?[lot.ll,...ll]:ll,{renderer:rP,color:tok('--accent'),weight:2,opacity:.9,dashArray:'1 5',lineCap:'round',interactive:false}).addTo(lotL);
 if(lot.type!=='boitage')lot.ids.forEach((i,k)=>L.marker(ll[k],{pane:'pap',icon:L.divIcon({className:'',html:`<div class="pin lot">${k+1}</div>`,iconSize:[26,26],iconAnchor:[13,13]})}).on('click',()=>ouvrirAdresse(i)).addTo(lotL));}
function preparer(ll,nom,i0,ids,titre){if(mode!=='pap')setMode('pap');
 if(!ids){if(!dansCirco(ll)){toast('Ce point est hors de la '+D.k+'e circonscription. Déplacez la carte.');return;}lot=construireLot(ll,taille,i0);}
 else lot={ll:null,ids,ins:insDe(ids),km:kmDe(ids),cible:insDe(ids),msg:'',recu:titre||'Action reçue'};
 dessinerLot();if(det==='peek')setDet('half');
 if(lot.ids.length)map.flyToBounds(L.latLngBounds([...(lot.ll?[lot.ll]:[]),...lot.ids.map(ptA)]).pad(.25),{...pad(),maxZoom:17.5,duration:.5});
 detail({id:'lot',html:()=>{
  let h=headHTML(lot.recu?esc(lot.recu):'Adresses proposées',lot.recu?'Reçue par lien':nom,true);
  if(!lot.recu)h+=`<div class="seg" role="group" aria-label="Taille">${[50,100,150,200].map(t=>`<button data-t="${t}" aria-pressed="${taille===t}">${t} inscrits</button>`).join('')}</div>`;
  if(lot.msg)h+=`<div class="note">${esc(lot.msg)}</div>`;
  if(!lot.ids.length)return h+`<div class="empty">Aucune adresse prioritaire assez proche. Baissez les curseurs ou choisissez un autre point.</div>`;
  const min=Math.round(lot.km/75),big=lot.ids.length>1?lot.ids.find(i=>D.adresses[i][3]>lot.ins*.5):undefined;
  h+=`<div class="pap-sum"><span><b>${pl(lot.ids.length,'adresse')}</b></span><span><b>${n0(lot.ins)}</b> inscrits</span><span>Marche entre adresses : <b>${min} min</b> (sans le temps aux portes)</span></div>`;
  if(big!=null)h+=`<div class="sub">Dont 1 grand immeuble de ${D.adresses[big][3]} inscrits.</div>`;
  if(!lot.recu&&lot.ins<lot.cible*.9)h+=`<div class="note">Pas assez d'adresses prioritaires proches les unes des autres pour atteindre ${lot.cible} inscrits.</div>`;
  h+=`<div class="btns"><button class="btn primary" id="cree">${I.check} Créer l'action avec ces adresses</button><button class="btn line" id="aj">Ajouter à ma sélection</button></div>`;
  h+=`<div style="margin-top:8px">${lot.ids.map((i,k)=>rowAdr(i,k+1,true)).join('')}</div>`;
  h+=`<div class="hint">Ordre de marche, à moins de 400 m d'une adresse à l'autre. Les adresses faites depuis moins de ${REF.reglages.delaiFaite} jours sont écartées.</div>`;
  return h;},
 after:()=>{lierRows();body.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{taille=+b.dataset.t;LS.set('taille',taille);lot=construireLot(lot.ll,taille,i0);dessinerLot();render(true);});
  const c=$('cree');if(c)c.onclick=()=>{const a=nouvelleAction('pap',{etapes:lot.ids.map(etapeAdr),origine:lot.recu?{lot:'recu'}:{lot:'propose',cible:lot.cible}});a.nom=nomDefaut(a);effLot();detail(vueEditer(a,true));};
  const j=$('aj');if(j)j.onclick=()=>{lot.ids.forEach(i=>{if(!SEL.includes(i))SEL.push(i);});LS.set('sel'+D.k,SEL);effLot();dessinerParcours();stack=[vueBase(),vueSel()];render();toast('Ajoutées à la sélection');};}});}
map.on('contextmenu',e=>{if(!D||!adrL||!map.hasLayer(adrL)||mode!=='pap')return;preparer([e.latlng.lat,e.latlng.lng],'Autour de ce point');});

/* ---------------- ma selection : adresses choisies a la main, avant de creer l'action */
function basculer(i){const k=SEL.indexOf(i);if(k>=0)SEL.splice(k,1);else SEL.push(i);LS.set('sel'+D.k,SEL);dessinerParcours();toast(k>=0?'Retirée de la sélection':`Ajoutée à la sélection (${SEL.length})`);try{navigator.vibrate&&navigator.vibrate(12);}catch(e){}}
function ordonner(ids){if(ids.length<3)return ids;const P0=ids.slice(),out=[P0.shift()];while(P0.length){const l=ptA(out[out.length-1]);let bi=0,bd=1e12;
 P0.forEach((i,k)=>{const d=dist(l,ptA(i));if(d<bd){bd=d;bi=k;}});out.push(P0.splice(bi,1)[0]);}return out;}
function vueSel(){return {id:'sel',html:()=>{let h=headHTML('Ma sélection',SEL.length?`${pl(SEL.length,'adresse')} · ${n0(insDe(SEL))} inscrits`:'Ajoutez des adresses depuis la carte ou la liste.',true);
  h+=`<div style="margin-top:6px">${SEL.map((i,k)=>rowAdr(i,k+1)).join('')}</div>`;
  if(SEL.length)h+=`<div class="btns stick"><button class="btn primary" id="cree">${I.check} Créer l'action</button></div><div class="btns"><button class="btn line danger" id="vid">Vider la sélection</button></div>`;
  return h;},after:()=>{lierRows();const c=$('cree');if(c)c.onclick=()=>{const a=nouvelleAction('pap',{etapes:ordonner(SEL).map(etapeAdr),origine:{lot:'manuel'}});a.nom=nomDefaut(a);detail(vueEditer(a,true));};
  const v=$('vid');if(v)v.onclick=()=>{const old=SEL.slice();SEL=[];LS.set('sel'+D.k,SEL);dessinerParcours();render();toast('Sélection vidée',{t:'Annuler',fn:()=>{SEL=old;LS.set('sel'+D.k,SEL);dessinerParcours();render();}});};}};}

/* ---------------- creer ou modifier une action : nom, campagne, GA, date prevue */
function vueEditer(a,neuve){let nom=a.nom,camp=a.campagne,ga=a.ga.slice(),prev=a.prevue;const prepa=a.type==='pap'||a.type==='boitage';
 return {id:'edit',aid:neuve?null:a.id,html:()=>{
  let h=headHTML(neuve?'Créer l\'action':'Modifier l\'action',`${TYPES[a.type]} · ${a.type==='pap'?pl(a.etapes.length,'adresse'):a.type==='boitage'?pl(a.etapes.length,'numéro'):esc(lieuNom(a.etapes[0]))}`,true);
  h+=`<label class="fld" for="an">Nom de l'action<input id="an" value="${esc(nom)}" autocomplete="off"></label>`;
  h+=`<div class="fl"><span>Campagne</span><div class="ch2">${REF.campagnes.filter(c=>!c.archive||c.id===camp).map(c=>`<button data-cp="${c.id}" aria-pressed="${camp===c.id}">${esc(c.nom)}</button>`).join('')}</div></div>`;
  h+=`<div class="fl"><span>Groupes d'action (un ou plusieurs)</span><div class="ch2">${gaActifs().map(g=>`<button data-g="${g.id}" aria-pressed="${ga.includes(g.id)}">${esc(g.nom)}</button>`).join('')}</div></div>`;
  if(prepa)h+=`<label class="fld" for="ap">Date prévue<input type="date" id="ap" value="${prev}"></label>`;
  const ok=camp&&ga.length;
  h+=`<div class="btns stick"><button class="btn primary" id="sv" ${ok?'':'disabled'}>${I.check} ${neuve?'Enregistrer l\'action':'Enregistrer'}</button>${neuve&&prepa?`<button class="btn line" id="sv2" ${ok?'':'disabled'}>Enregistrer et commencer</button>`:''}${ok?'':'<div class="hint">Choisissez une campagne et au moins un GA.</div>'}</div>`;
  return h;},
 after:()=>{$('an').oninput=e=>{nom=e.target.value;};
  body.querySelectorAll('[data-cp]').forEach(b=>b.onclick=()=>{camp=b.dataset.cp;render(true);});
  body.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const g=b.dataset.g,k=ga.indexOf(g);if(k>=0)ga.splice(k,1);else ga.push(g);render(true);});
  const ap=$('ap');if(ap)ap.onchange=()=>{prev=ap.value;};
  const enr=go=>{a.nom=(nom||'').trim()||nomDefaut(a);a.campagne=camp;a.ga=ga.slice();a.prevue=prev||'';LS.set('dga',a.ga);
   if(neuve){ACTIONS.push(a);saisie(a,'création');if(a.origine&&a.origine.lot==='manuel'){SEL=[];LS.set('sel'+D.k,SEL);}}else saisie(a,'campagne, GA ou date');
   sauverA();stack=[vueBase(),vueAction(a.id)];render();toast(neuve?'Action créée : '+a.nom:'Action modifiée');if(go&&a.etapes.length&&a.type==='pap')ouvrirEtape(a.id,0);};
  $('sv').onclick=()=>enr(false);const s2=$('sv2');if(s2)s2.onclick=()=>enr(true);}};}

/* ---------------- une action : ses etapes dans l'ordre de passage, modifiable */
const ACCES=[['porte','Porte fermée'],['digicode','Digicode'],['interphone','Interphone'],['gardien','Gardien']];
const ACCES_T=Object.fromEntries(ACCES);
function etatE(a,e){if(a.type==='boitage')return e.st==='boite'?'Boîté':e.st==='ferme'?'Fermé':'';
 if(e.st==='ferme')return `Pas pu entrer${e.acc&&ACCES_T[e.acc]?' : '+ACCES_T[e.acc].toLowerCase():''}`;
 if(e.toquees>0||e.portes>0)return `${e.portes?pl(e.portes,'porte')+' · ':''}${e.toquees} toquée${e.toquees>1?'s':''} · ${e.ouvertes} ouverte${e.ouvertes>1?'s':''}`;
 if(e.st==='faite')return 'Faite · portes à noter';if(e.st==='temps')return 'Pas eu le temps';return '';}
const peutSupprimer=a=>estAdmin()||a.cree_par===moi().id;
function totaux(a){return a.etapes.reduce((s,e)=>{s.p+=e.portes;s.t+=e.toquees;s.o+=e.ouvertes;s.b+=e.st==='boite'?1:0;s.f+=e.st==='ferme'?1:0;s.n+=(e.st||e.toquees>0)?1:0;return s;},{p:0,t:0,o:0,b:0,f:0,n:0});}
function vueAction(id){let ordre=false;return {id:'act',aid:id,html:()=>{const a=actPar(id);if(!a)return headHTML('Action supprimée','',true);
  if(a.type.startsWith('diff'))return vueActionDiffHTML(a);
  const t=totaux(a),ids=a.etapes.map(idxE).filter(i=>i!=null);
  let h=headHTML(esc(a.nom||TYPES[a.type]),`${TYPES[a.type]} · ${sttHTML(a)}`,true);
  h+=`<div class="meta2"><div><span>Campagne</span><b>${esc(campNom(a.campagne))}</b></div><div><span>GA</span><b>${a.ga.map(g=>esc(gaNom(g))).join(', ')}</b></div><div><span>${a.statut==='faite'?'Faite le':'Prévue'}</span><b>${a.statut==='faite'?(a.faite_le?fmtJH(a.faite_le):'date à indiquer'):a.prevue?fmtJ(a.prevue):'sans date'}</b></div></div>`;
  h+=a.type==='pap'?`<div class="pap-sum"><span><b>${pl(a.etapes.length,'adresse')}</b></span><span><b>${n0(insDe(ids))}</b> inscrits</span><span><b>${t.p}</b> portes</span><span><b>${t.t}</b> toquées</span><span><b>${t.o}</b> ouvertes</span></div>`
   :`<div class="pap-sum"><span><b>${pl(a.etapes.length,'numéro')}</b></span><span><b>${t.b}</b> boîté${t.b>1?'s':''}</span><span><b>${t.f}</b> fermé${t.f>1?'s':''}</span><span>environ <b>${n0(insDe(ids))}</b> tracts</span></div>`;
  h+=`<div class="ordbar"><span>Ordre de passage</span><button class="lnk3" id="ord">${ordre?'Terminé':'Changer l\'ordre'}</button></div>`;
  if(ordre)h+=`<div class="btns"><button class="btn line" id="auto">${I.route} Remettre dans l'ordre de marche</button></div>`;
  let last='';
  a.etapes.forEach((e,k)=>{const i=idxE(e);
   if(a.type==='boitage'&&!ordre){const v=voieDe(e);if(v&&v!==last){h+=`<div class="side">${esc(v)}</div>`;last=v;}}
   const lab=i!=null?(a.type==='boitage'&&!ordre?esc(numTxt(i)):esc(D.adresses[i][2])):esc(e.lieu.id),sub=etatE(a,e)||(i!=null?adrSub(D.adresses[i]):'Numéro ajouté sur place');
   const right=ordre?`<span class="ord"><button data-up="${k}" aria-label="Monter" ${k===0?'disabled':''}>${I.up}</button><button data-dn="${k}" aria-label="Descendre" ${k===a.etapes.length-1?'disabled':''}>${I.down}</button></span>`
    :a.type==='boitage'?`<span class="bb"><button data-bs="${k}:boite" aria-pressed="${e.st==='boite'}">Boîté</button><button data-bs="${k}:ferme" aria-pressed="${e.st==='ferme'}">Fermé</button></span>`
    :`<span class="sc">${i!=null?D.adresses[i][3]:''}<small>inscrits</small></span>`;
   h+=`<div class="row ${a.type==='boitage'&&!ordre?'bo':'n'}">${a.type==='boitage'&&!ordre?'':`<span class="nb${(e.st||e.toquees>0)?' fa':''}">${k+1}</span>`}<button class="tx" data-e="${k}"><b>${lab}</b><small>${(e.st||e.toquees>0)?`<span class="acc">${esc(sub)}</span>`:sub}</small></button>${right}</div>`;});
  if(a.type==='boitage'&&!ordre){const vt=[...new Set(a.etapes.map(voieDe).filter(Boolean))];if(vt.length)h+=ajoutHTML(vt);}
  /* boutons selon l'avancement : rien de renseigné -> Commencer ; en cours -> Continuer + Terminer (discret) ; tout renseigné -> Terminer (rouge) */
  const fait=e=>!!(e.st||e.toquees>0),nR=a.etapes.filter(fait).length,tout=nR===a.etapes.length,jS=a.type==='pap'?a.etapes.findIndex(e=>!fait(e)&&idxE(e)!=null):-1;
  if(a.statut==='faite')h+=`<div class="btns stick"><button class="btn line" id="fin">${I.check} Modifier le compte rendu</button></div>`;
  else if(tout)h+=`<div class="btns stick"><button class="btn cta" id="fin">${I.check} Terminer l'action : compte rendu</button></div>`;
  else{if(jS>=0)h+=`<div class="btns stick"><button class="btn primary" id="goE">${nR?'Continuer : adresse suivante':'Commencer : 1re adresse'}</button></div>`;
   if(nR||a.type!=='pap')h+=`<div class="btns"><button class="btn line" id="fin">${I.check} Terminer l'action : compte rendu</button></div>`;}
  h+=`<div class="btns two"><button class="btn line" id="mod">Campagne, GA, date</button><button class="btn line" id="sh">Partager</button></div>`;
  if(peutSupprimer(a))h+=`<div class="btns"><button class="btn line danger" id="del">Supprimer l'action</button></div>`;
  h+=histoSaisies(a);
  return h;},
 after:()=>{const a=actPar(id);if(!a)return;if(a.type.startsWith('diff')){lierActionDiff(a);return;}
  $('ord').onclick=()=>{ordre=!ordre;render(true);};const au=$('auto');if(au)au.onclick=()=>{const ord=ordonner(a.etapes.map(idxE).filter(i=>i!=null));const rest=a.etapes.filter(e=>idxE(e)==null);a.etapes=[...ord.map(i=>a.etapes.find(e=>e.lieu.id===AID(i))),...rest];saisie(a,'ordre de passage');sauverA();dessinerParcours();render(true);};
  body.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const k=+b.dataset.up;if(k<1)return;[a.etapes[k-1],a.etapes[k]]=[a.etapes[k],a.etapes[k-1]];saisie(a,'ordre de passage');sauverA();dessinerParcours();render(true);});
  body.querySelectorAll('[data-dn]').forEach(b=>b.onclick=()=>{const k=+b.dataset.dn;if(k>=a.etapes.length-1)return;[a.etapes[k+1],a.etapes[k]]=[a.etapes[k],a.etapes[k+1]];saisie(a,'ordre de passage');sauverA();dessinerParcours();render(true);});
  body.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{const k=+b.dataset.e;if(a.type==='pap')ouvrirEtape(a.id,k);else{const i=idxE(a.etapes[k]);if(i!=null){voir(ptA(i),Math.max(map.getZoom(),17));sel(i);}}});
  body.querySelectorAll('[data-bs]').forEach(b=>b.onclick=()=>{const [k,st]=b.dataset.bs.split(':');const e=a.etapes[+k];e.st=e.st===st?'':st;e.le=isoD(new Date());saisie(a,'boîtage');sauverA();render(true);try{navigator.vibrate&&navigator.vibrate(10);}catch(x){}});
  lierAjout(a);
  const fn=$('fin');if(fn)fn.onclick=()=>detail(vueCloture(a.id));const ge=$('goE');if(ge)ge.onclick=()=>{const j=a.etapes.findIndex(e=>!(e.st||e.toquees>0)&&idxE(e)!=null);if(j>=0)ouvrirEtape(a.id,j);};$('mod').onclick=()=>detail(vueEditer(a,false));$('sh').onclick=()=>partager(txtAction(a));
  const d=$('del');if(d)d.onclick=()=>{const k=ACTIONS.indexOf(a);ACTIONS.splice(k,1);sauverA();back();toast('Action supprimée',{t:'Annuler',fn:()=>{ACTIONS.splice(k,0,a);sauverA();render(true);}});};
  if(a.etapes.length&&det!=='full'){const ll=a.etapes.map(idxE).filter(i=>i!=null).map(ptA);if(ll.length)map.flyToBounds(L.latLngBounds(ll).pad(.25),{...pad(),maxZoom:17.5,duration:.5});}}};}
function histoSaisies(a){const l=a.saisies.slice(-5).reverse();if(!l.length)return '';
 return `<h2>Historique</h2>`+l.map(s=>`<div class="hs"><b>${esc(userNom(s.par))}</b> · ${esc(s.quoi)} · ${fmtJH(s.le)}</div>`).join('')+(a.saisies.length>5?`<div class="hs">et ${a.saisies.length-5} saisies plus anciennes</div>`:'');}
function txtAction(a){const t=totaux(a);let s=`${a.nom} (${TYPES[a.type]}, ${D.k}e circonscription)\nCampagne : ${campNom(a.campagne)} · GA : ${a.ga.map(gaNom).join(', ')}\n${a.statut==='faite'?'Faite le '+fmtJH(a.faite_le):a.prevue?'Prévue le '+fmtJ(a.prevue):'À faire'}\n`;
 s+=a.etapes.map((e,k)=>{const i=idxE(e);return `${k+1}. ${i!=null?D.adresses[i][2]:e.lieu.id}${etatE(a,e)?' : '+etatE(a,e):''}`;}).join('\n');
 if(a.type==='pap'&&t.t)s+=`\nTotal : ${t.p} portes, ${t.t} toquées, ${t.o} ouvertes`;
 const ids=a.etapes.map(idxE).filter(i=>i!=null);if(ids.length)s+=`\nOuvrir dans l'appli : ${location.href.split('#')[0]}#act=${D.k}:${D.adresses.length}:${a.type}:${ids.join('.')}`;return s;}

/* ---------------- une adresse d'une action de PAP : portes, toquees, ouvertes */
function setE(a,k,p){const e=a.etapes[k];Object.assign(e,p);
 if('portes' in p){if(e.toquees>e.portes)e.toquees=e.portes;if(e.ouvertes>e.toquees)e.ouvertes=e.toquees;}
 if('toquees' in p){if(e.toquees>e.portes)e.portes=e.toquees;if(e.ouvertes>e.toquees)e.ouvertes=e.toquees;if(e.toquees>0&&!e.st)e.st='faite';}
 if('ouvertes' in p){if(e.ouvertes>e.toquees)e.toquees=e.ouvertes;if(e.toquees>e.portes)e.portes=e.toquees;if(e.ouvertes>0&&!e.st)e.st='faite';}
 if(p.st&&p.st!=='ferme')e.acc='';e.le=isoD(new Date());
 const i=idxE(e);saisie(a,'adresse '+(i!=null?D.adresses[i][2]:e.lieu.id));sauverA();dessinerParcours();}
/* adresse suivante à renseigner : après k, sinon la première restée avant k */
function suivE(a,k){const v=j=>j!==k&&!a.etapes[j].st&&!a.etapes[j].toquees&&idxE(a.etapes[j])!=null,ks=[...a.etapes.keys()];return ks.slice(k+1).find(v)??ks.slice(0,k).find(v);}
function ouvrirEtape(id,k){const a=actPar(id);if(!a)return;const e0=a.etapes[k],i=idxE(e0);if(i==null)return;const ad=D.adresses[i];
 if(mode!=='pap')setMode('pap');if(det==='peek')setDet('half');voir(ptA(i),Math.max(map.getZoom(),16.5));sel(i);
 detail({id:'etape',aid:id,html:()=>{const e=a.etapes[k];
  let h=headHTML(esc(ad[2]),`${k+1} sur ${a.etapes.length} · ${esc(a.nom)} · ${pl(ad[3],'inscrit')}`,true);
  h+=`<div class="crb"><div class="seg st" role="group" aria-label="Statut">${[['faite','Faite'],['ferme','Pas pu entrer'],['temps','Pas eu le temps']].map(([x,t])=>`<button data-st="${x}" aria-pressed="${e.st===x}">${t}</button>`).join('')}</div>`;
  if(e.st==='ferme')h+=`<div class="seg sm" role="group" aria-label="Pourquoi">${ACCES.map(([x,t])=>`<button data-ac="${x}" aria-pressed="${e.acc===x}">${t}</button>`).join('')}</div><div class="hint">On ne note jamais un code d'accès.</div>`;
  else if(e.st!=='temps')h+=`<div class="cpts one">${cptHTML('portes','Portes',e.portes)}${cptHTML('toquees','Portes toquées',e.toquees)}${cptHTML('ouvertes','Portes ouvertes',e.ouvertes)}</div>`;
  const nx=suivE(a,k);
  h+=`<div class="btns">${nx!=null?`<button class="btn line" id="nx">Adresse suivante : ${esc(D.adresses[idxE(a.etapes[nx])][2])}</button>`:`<button class="btn cta" id="nx2">${I.check} Terminer l'action : compte rendu</button>`}</div></div>`;
  if(BZ[ad[9]]&&BZ[ad[9]].zone)h+=`<div class="meta">${zTag(BZ[ad[9]].zone)}<div class="zdef">${cap(ZD[BZ[ad[9]].zone])}</div></div>`;
  h+=`<div class="btns two" style="margin-top:12px"><button class="btn line" id="act">Voir l'action</button><a class="btn line" target="_blank" rel="noopener" href="${yAller(ad[1],ad[0])}">${I.walk} Y aller</a></div>`;
  h+=quartierHTML(ad);
  return h;},after:()=>{
   body.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{const st=b.dataset.st;setE(a,k,{st:a.etapes[k].st===st?'':st});render(true);});
   body.querySelectorAll('[data-ac]').forEach(b=>b.onclick=()=>{setE(a,k,{acc:b.dataset.ac});render(true);});
   lierCpt(x=>a.etapes[k][x],(x,v)=>setE(a,k,{[x]:v}));
   const nx=$('nx');if(nx){const j=suivE(a,k);nx.onclick=()=>ouvrirEtape(id,j);}
   const n2=$('nx2');if(n2)n2.onclick=()=>detail(vueCloture(id));$('act').onclick=()=>{if(stack.length>1&&stack[stack.length-2].id==='act')back();else detail(vueAction(id));};}});}

/* ---------------- compte rendu d'une action preparee : date, militants, materiel */
function vueCloture(id){const a=actPar(id);let q=a.faite_le||(a.saisies.find(s=>s.quoi.startsWith('adresse')||s.quoi==='boîtage')||{}).le||isoD(new Date()),nb=a.nb||nbm,mat=a.materiel,tr=a.tracts||0,garder=true;const deja=a.statut==='faite';
 if(a.type==='boitage'&&!tr)tr=a.etapes.reduce((s,e)=>{const i=idxE(e);return s+(e.st==='boite'&&i!=null?D.adresses[i][3]:0);},0);
 return {id:'fini',aid:id,html:()=>{const t=totaux(a);
  let h=headHTML(deja?'Modifier le compte rendu':'Compte rendu',esc(a.nom),true);
  if(a.type==='pap'){h+=`<div class="pap-sum"><span><b>${t.n}</b> sur ${pl(a.etapes.length,'adresse')} renseignée${t.n>1?'s':''}</span><span><b>${t.p}</b> portes</span><span><b>${t.t}</b> toquées</span><span><b>${t.o}</b> ouvertes</span></div>`;
   h+=`<div style="margin-top:6px">${a.etapes.map((e,k)=>{const i=idxE(e);return `<div class="row n"><span class="nb${(e.st||e.toquees>0)?' fa':''}">${k+1}</span><button class="tx" data-e="${k}"><b>${esc(i!=null?D.adresses[i][2]:e.lieu.id)}</b><small>${esc(etatE(a,e)||'À renseigner')}</small></button><span class="chev">${I.next}</span></div>`;}).join('')}</div>`;}
  else{h+=`<div class="pap-sum"><span><b>${t.b}</b> boîté${t.b>1?'s':''}</span><span><b>${t.f}</b> fermé${t.f>1?'s':''}</span><span><b>${a.etapes.length-t.b-t.f}</b> pas fait${a.etapes.length-t.b-t.f>1?'s':''}</span></div>`;
   h+=`<div class="trc"><label for="trv">Tracts déposés</label><input id="trv" inputmode="numeric" pattern="[0-9]*" value="${tr}"></div><div class="trb">${[-10,10,50,100].map(d=>`<button data-d="${d}">${d>0?'+':'−'}${Math.abs(d)}</button>`).join('')}</div><div class="hint">Prérempli avec un tract par inscrit des numéros boîtés. Corrigez si vous avez compté.</div>`;}
  h+=quandHTML(q,'Début de l\'action')+nbHTML(nb)+matHTML(mat,a.campagne);
  const lock=interdit(q)&&a.type==='boitage';if(lock)h+=`<div class="note">Distribution interdite à cette date : veille ou jour de scrutin (code électoral, article L. 49).</div>`;
  const nt=a.type==='pap'?a.etapes.filter(e=>!e.toquees&&e.st!=='ferme').length:0,ok=a.type==='pap'?a.etapes.some(e=>e.toquees>0||e.st==='ferme'):(t.b+t.f>0&&tr>0);
  if(!deja&&nt&&ok)h+=`<label class="ckb"><input type="checkbox" id="gd" ${garder?'checked':''}><span>Créer une nouvelle action à faire avec ${nt===1?'l\'adresse non faite':`les ${nt} adresses non faites`}</span></label>`;
  h+=`<div class="btns stick"><button class="btn cta" id="env" ${ok&&!lock?'':'disabled'}>${I.check} ${deja?'Enregistrer les modifications':'Enregistrer : action faite'}</button>${ok?'':`<div class="hint">${a.type==='pap'?'Indiquez au moins une porte toquée, ou une adresse où vous n\'avez pas pu entrer.':'Marquez au moins un numéro, et indiquez les tracts déposés.'}</div>`}</div>`;
  return h;},
 after:()=>{lierQuand(()=>q,v=>q=v);body.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>ouvrirEtape(id,+b.dataset.e));
  lierCpt(()=>nb,(x,v)=>{nb=Math.max(1,v);nbm=nb;LS.set('nbm',nb);});lierMat(v=>mat=v);
  const tv=$('trv');if(tv){tv.onfocus=()=>{try{tv.select();}catch(x){}};tv.oninput=()=>{const v=parseInt(tv.value.replace(/\D/g,''),10);tr=isNaN(v)?0:v;$('env').disabled=!(tr>0);};}
  body.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{tr=Math.max(0,tr+(+b.dataset.d));render(true);});
  const g=$('gd');if(g)g.onchange=()=>{garder=g.checked;};
  $('env').onclick=()=>{a.statut='faite';a.faite_le=q;a.nb=nb;a.materiel=mat;if(a.type==='boitage')a.tracts=tr;saisie(a,deja?'compte rendu modifié':'action faite');
   let suite=null;if(!deja&&garder&&a.type==='pap'){const rest=a.etapes.filter(e=>!e.toquees&&e.st!=='ferme');if(rest.length){suite=nouvelleAction('pap',{nom:a.nom+' (suite)',campagne:a.campagne,ga:a.ga.slice(),etapes:rest.map(e=>({...e,st:'',le:''})),origine:{lot:'suite'}});ACTIONS.push(suite);saisie(suite,'création (suite)');}}
   sauverA();const t=totaux(a);
   stack=[vueBase(),{id:'ok',html:()=>`<div class="ok"><div class="ck">${I.check}</div><h1>${deja?'Compte rendu modifié':'Action faite'}</h1><div class="sub">${esc(a.nom)} · ${a.type==='pap'?`${pl(t.t,'porte toquée','portes toquées')} · ${pl(t.o,'ouverte')}`:`${pl(t.b,'numéro boîté','numéros boîtés')} · ${n0(tr)} tracts`}</div><div class="sub">Envoyé au journal partagé, ou au retour du réseau si le téléphone est hors connexion.</div>${suite?`<div class="sub">Nouvelle action à faire : ${esc(suite.nom)}.</div>`:''}</div><div class="btns"><button class="btn line" id="sh">Partager le compte rendu</button><button class="btn primary" id="nv">Revenir aux actions</button></div>`,
    after:()=>{$('sh').onclick=()=>partager(txtAction(a));$('nv').onclick=()=>show(vueBase());}}];render();};}};}
function matHTML(mat,camp){return '';const l=REF.materiel.filter(m=>!m.archive&&(!m.campagne||!camp||m.campagne===camp));if(!l.length)return '';
 return `<div class="fl"><span>Matériel distribué</span><div class="ch2"><button data-mt="" aria-pressed="${!mat}">Aucun</button>${l.map(m=>`<button data-mt="${m.id}" aria-pressed="${mat===m.id}">${esc(m.nom)}</button>`).join('')}</div></div>`;}
function lierMat(set){body.querySelectorAll('[data-mt]').forEach(b=>b.onclick=()=>{set(b.dataset.mt);body.querySelectorAll('[data-mt]').forEach(x=>x.setAttribute('aria-pressed',x===b));});}
function interdit(q){const d=toD(q);if(!d)return false;return (REF.reglages.scrutins||[]).some(s=>{const j=toD(s+'T00:00');if(!j)return false;const veille=new Date(j.getTime()-864e5),fin=new Date(j.getTime()+864e5);return d>=veille&&d<fin;});}
