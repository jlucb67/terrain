
/* ---------------- diff en marche */
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
const LT={'marché':'marche','station':'station','supermarché':'commerce'};
const diffsDe=nom=>ACTIONS.filter(a=>a.type.startsWith('diff')&&a.etapes[0]&&a.etapes[0].lieu.id===nom).sort((a,b)=>toD(b.faite_le)-toD(a.faite_le));
const derniereDiff=nom=>{const d=diffsDe(nom)[0];return d?` · diff faite le ${fmtJ(d.faite_le)}`:'';};
function histoHTML(nom){const l=diffsDe(nom);if(!l.length)return '';
 return `<h2>Diffs faites ici</h2>`+l.map(a=>`<div class="row p"><button class="tx" data-hk="${a.id}"><b>${fmtJH(a.faite_le)}</b><small>${n0(a.tracts)} tracts${a.nb?` · ${pl(a.nb,'militant')}`:''} · ${esc(a.ga.map(gaNom).join(', '))}</small></button><button class="addb" data-hk="${a.id}">Modifier</button></div>`).join('');}
const lierHisto=(nom,type)=>body.querySelectorAll('[data-hk]').forEach(b=>b.onclick=()=>detail(vueDiff(nom,type,b.dataset.hk)));
function vueMarches(){return {id:'base',html:()=>{
  const ms=D.marches.map(s=>({s,b:prochaine(s)})).sort((a,b)=>(a.b?a.b.t:1e9)-(b.b?b.b.t:1e9));
  let h=headHTML('Diff en marché','Les marchés de la circonscription et alentour, par prochaine séance.');
  h+=`<div style="margin-top:8px">${ms.map(o=>`<div class="row p"><button class="tx" data-ma="${D.marches.indexOf(o.s)}"><b>${esc(o.s.nom)}</b><small class="${o.b&&o.b.ouvert?'acc':''}">${quand(o.b)}</small><small>${joursMarche(o.s)}${derniereDiff(o.s.nom)}</small></button><button class="addb" data-dm="${D.marches.indexOf(o.s)}">${I.tract}Diff faite</button></div>`).join('')}</div>`;
  const g=D.commerces.filter(c=>c.grand&&c.dedans).sort((a,b)=>(a.ens||a.type).localeCompare(b.ens||b.type,'fr'));
  h+=`<h2>Supermarchés de la circonscription</h2><div>${g.map(c=>`<div class="row p"><button class="tx" data-mg="${D.commerces.indexOf(c)}"><b>${esc(c.ens||c.type)}</b><small>${esc(c.adr)} · ${esc(c.surf)}${derniereDiff((c.ens||c.type)+', '+c.adr)}</small></button><button class="addb" data-dg="${D.commerces.indexOf(c)}">${I.tract}Diff faite</button></div>`).join('')}</div>`;
  h+=lienCR();
  return h;},after:()=>{body.querySelectorAll('[data-ma]').forEach(b=>b.onclick=()=>ouvrirMarche(D.marches[+b.dataset.ma]));
  body.querySelectorAll('[data-mg]').forEach(b=>b.onclick=()=>ouvrirMagasin(D.commerces[+b.dataset.mg]));
  body.querySelectorAll('[data-dm]').forEach(b=>b.onclick=()=>detail(vueDiff(D.marches[+b.dataset.dm].nom,'marché')));
  body.querySelectorAll('[data-dg]').forEach(b=>{const c=D.commerces[+b.dataset.dg];b.onclick=()=>detail(vueDiff((c.ens||c.type)+', '+c.adr,'supermarché'));});}};}
function procheStation(ll){let b=null,bd=1e9;D.metro.forEach(s=>{const d=dist(ll,[s.lat,s.lon]);if(d<bd){bd=d;b=s;}});return b?{s:b,d:bd}:null;}
function ouvrirMarche(s){sel(null);if(det==='peek')setDet('half');voir([s.lat,s.lon],Math.max(map.getZoom(),15.5));const st=procheStation([s.lat,s.lon]);
 detail({id:'ma',html:()=>headHTML(esc(s.nom),quand(prochaine(s)),true)+`<div class="zdef" style="margin-top:10px">${esc(s.lieu)}</div><h2>Jours et horaires</h2><ul class="hours">${s.horaires.map(x=>`<li>${esc(cap(x))}</li>`).join('')}</ul>`+
  (st?`<div class="sub" style="margin-top:12px">Métro le plus proche : <b>${esc(st.s.nom)}</b>, à ${Math.round(st.d/10)*10} m</div>`:'')+`<div class="btns"><button class="btn primary" id="df">${I.tract} Diff faite ici</button></div>`+histoHTML(s.nom),
  after:()=>{$('df').onclick=()=>detail(vueDiff(s.nom,'marché'));lierHisto(s.nom,'marché');}});}
function ouvrirMagasin(s){sel(null);if(det==='peek')setDet('half');voir([s.lat,s.lon],Math.max(map.getZoom(),16));const nom=(s.ens||s.type)+', '+s.adr;
 detail({id:'mg',html:()=>headHTML(esc(s.ens||s.type),`${esc(s.type)} · ${esc(s.surf)}`,true)+`<div class="zdef" style="margin-top:10px">${esc(s.adr)}</div><div class="sub" style="margin-top:8px">On tracte sur le trottoir, devant l'entrée.</div><div class="btns"><button class="btn primary" id="df">${I.tract} Diff faite ici</button></div>`+histoHTML(nom),
  after:()=>{$('df').onclick=()=>detail(vueDiff(nom,'supermarché'));lierHisto(nom,'supermarché');}});}

/* ---------------- diff en metro */
const HEURES=[...Array(19)].map((_,i)=>i+5);
const typeJour=d=>{const w=d.getDay();return w===0?'dim':w===6?'sam':'sem';};
const entreesH=(s,h,d)=>{d=d||new Date();const v=(s[typeJour(d)]||[])[h]||0;return s.jour?s.jour*v/100:0;};
function valeurStation(s,j){if(!s.jour)return 0;if(j==='now'||j==='pres'){const n=new Date();return entreesH(s,n.getHours(),n);}return s.jour;}
function majBulles(){if(!bulles)return;bulles.clearLayers();if(mode!=='metro'){if(map.hasLayer(bulles))map.removeLayer(bulles);return;}
 const vals=D.metro.map(s=>valeurStation(s,vueMetroJour)),mx=Math.max(...vals,1),ac=tok('--accent');
 D.metro.forEach((s,k)=>{const r=5+22*Math.sqrt(vals[k]/mx);L.circleMarker([s.lat,s.lon],{renderer:rA,radius:r,color:ac,weight:1.2,opacity:.9,fillColor:ac,fillOpacity:.18}).on('click',()=>ouvrirStation(s)).addTo(bulles);});
 if(!map.hasLayer(bulles))bulles.addTo(map);}
const pointesTxt=v=>HEURES.slice().sort((x,y)=>v[y]-v[x]).slice(0,2).sort((x,y)=>x-y).map(h=>`${h} h`).join(' et ');
const lignesHTML=s=>`<span class="lines s">${s.lignes.map(l=>{const c=LIGNE[l]||['#888','#fff'];return `<span class="ln" style="background:${c[0]};color:${c[1]}">${esc(l)}</span>`;}).join('')}</span>`;
function vueMetro(){return {id:'base',html:()=>{const n=new Date(),j=vueMetroJour,hs=n.getHours(),h1=(hs+1)%24,h2=(hs+2)%24;
  const ref=j==='pres'?(posMoi||(()=>{const c=centreVisible();return [c.lat,c.lng];})()):null;
  let ss=D.metro.filter(s=>s.jour).map(s=>({s,v:valeurStation(s,j),d:ref?dist(ref,[s.lat,s.lon]):0}));
  ss.sort(j==='pres'?(a,b)=>a.d-b.d:(a,b)=>b.v-a.v);if(j==='pres')ss=ss.slice(0,8);
  const sub=j==='now'?`${cap(JOURS[n.getDay()])} : entrées moyennes de ${hs} h à ${h1} h, puis de ${h1} h à ${h2} h`:j==='pres'?(posMoi?'Les stations les plus proches de vous':'Les stations les plus proches du centre de la carte. Touchez « Me localiser » pour partir de vous.'):'Stations de la circonscription et alentour, par entrées par jour';
  let h=headHTML('Diff en métro',sub);
  h+=`<div class="seg five" role="group" aria-label="Moment">${[['now','Maintenant'],['pres','Près de moi'],['sem','Semaine'],['sam','Samedi'],['dim','Dimanche']].map(([k,t])=>`<button data-j="${k}" aria-pressed="${j===k}">${t}</button>`).join('')}</div>`;
  h+=`<div style="margin-top:6px">${ss.map(o=>{const pk=(j==='sem'||j==='sam'||j==='dim')&&o.s[j]?pointesTxt(o.s[j]):'',lim=!dansCirco([o.s.lat,o.s.lon]);
   const info=j==='now'?`${n0(entreesH(o.s,hs))} entrées de ${hs} h à ${h1} h · ${n0(entreesH(o.s,h1))} de ${h1} h à ${h2} h`:j==='pres'?`${o.d<1000?Math.round(o.d/10)*10+' m':(o.d/1000).toFixed(1).replace('.',',')+' km'} · ${n0(entreesH(o.s,h1))} entrées de ${h1} h à ${h2} h`:`${n0(o.s.jour)} entrées par jour · pointes à ${pk}`;
   return `<div class="row p"><button class="tx" data-st="${D.metro.indexOf(o.s)}"><b>${esc(o.s.nom)}${lim?' <span class="lim">limite de circo</span>':''}</b><small>${info}${derniereDiff(o.s.nom)}</small>${lignesHTML(o.s)}</button><button class="addb" data-ds="${D.metro.indexOf(o.s)}">${I.tract}Diff faite</button></div>`;}).join('')}</div>`;
  h+=`<div class="hint">Moyennes d'Île-de-France Mobilités, 4e trimestre 2025. Le matin, ce sont surtout des habitants qui partent.</div>`+lienCR();
  return h;},after:()=>{body.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{vueMetroJour=b.dataset.j;majBulles();render(true);if(vueMetroJour==='pres'&&!posMoi)localiser(ll=>{posMoi=ll;render(true);},true);});
  body.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>ouvrirStation(D.metro[+b.dataset.st]));
  body.querySelectorAll('[data-ds]').forEach(b=>b.onclick=()=>detail(vueDiff(D.metro[+b.dataset.ds].nom,'station')));}};}
function chartH(v){const w=320,hh=80,bw=w/HEURES.length,mx=Math.max(...HEURES.map(h=>v[h]),1),top=HEURES.slice().sort((x,y)=>v[y]-v[x]).slice(0,3),hn=new Date().getHours();
 let s=`<svg viewBox="0 0 ${w} ${hh+18}" role="img" aria-label="Entrées par heure">`;
 HEURES.forEach((h,i)=>{const y=hh*v[h]/mx;s+=`<rect x="${i*bw+3}" y="${hh-y}" width="${bw-6}" height="${Math.max(1,y)}" rx="1.5" style="fill:${top.includes(h)?'var(--accent)':'var(--line2)'}"></rect>`;});
 s+=`<line x1="0" x2="${w}" y1="${hh+.5}" y2="${hh+.5}" style="stroke:var(--line2);stroke-width:1"></line>`;
 if(hn>=5)s+=`<line x1="${(hn-5+.5)*bw}" x2="${(hn-5+.5)*bw}" y1="0" y2="${hh}" style="stroke:var(--cta);stroke-width:1;stroke-dasharray:2 3"></line>`;
 [6,9,12,15,18,21].forEach(h=>{s+=`<text x="${(h-5+.5)*bw}" y="${hh+14}" text-anchor="middle" style="fill:var(--quiet);font:400 10px var(--f)">${h} h</text>`;});
 return s+'</svg>';}
const pointes=v=>HEURES.slice().sort((x,y)=>v[y]-v[x]).slice(0,3).sort((x,y)=>x-y).map(h=>`<b>${h} h</b> (${pc(v[h])})`).join(', ');
function ouvrirStation(s){sel(null);if(det==='peek')setDet('half');voir([s.lat,s.lon],Math.max(map.getZoom(),15.5));let jour=typeJour(new Date());
 detail({id:'st',html:()=>{let h=headHTML(esc(s.nom),s.jour?`${n0(s.jour)} entrées par jour en moyenne`:'Station de métro',true);
  h+=`<div class="lines">${s.lignes.map(l=>{const c=LIGNE[l]||['#888','#fff'];return `<span class="ln" style="background:${c[0]};color:${c[1]}">${esc(l)}</span>`;}).join('')}</div>`;
  if(!dansCirco([s.lat,s.lon]))h+=`<div class="sub" style="margin-top:8px">En limite de circonscription : une partie des voyageurs n'habite pas la ${D.k}e.</div>`;
  h+=`<div class="btns"><button class="btn primary" id="df">${I.tract} Diff faite ici</button></div>`;
  if(s.sem){h+=`<div class="seg" role="group"><button data-j="sem" aria-pressed="${jour==='sem'}">Semaine</button><button data-j="sam" aria-pressed="${jour==='sam'}">Samedi</button><button data-j="dim" aria-pressed="${jour==='dim'}">Dimanche</button></div>
   <div class="chart">${chartH(s[jour])}</div><div class="peak">Heures les plus chargées : ${pointes(s[jour])}</div><div class="sub">Part des entrées de la journée, heure par heure. Le trait rouge marque l'heure qu'il est.</div>`;}
  h+=histoHTML(s.nom);
  return h;},after:()=>{body.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{jour=b.dataset.j;render(true);});$('df').onclick=()=>detail(vueDiff(s.nom,'station'));lierHisto(s.nom,'station');}});}

/* compte rendu de diff : une action faite en direct ; saisie au clavier, date, campagne et GA */
function vueDiff(nom,type,aid){const e=aid?actPar(aid):null;const brd=LS.get('brd'+D.k,null);const rep=!e&&brd&&brd.nom===nom&&(Date.now()-brd.ts)<72e5?brd:null;
 const d0=nouvelleAction(TYPE_DIFF[type]||'diff_marche');
 let tr=e?e.tracts:rep?rep.tr:0,q=e?e.faite_le:rep?rep.q:isoD(new Date()),nb=e?(e.nb||1):rep?rep.nb:nbm,camp=e?e.campagne:(LS.get('dcamp',null)||d0.campagne),ga=e?e.ga.slice():(LS.get('dga',null)||d0.ga).filter(g=>gaActifs().some(x=>x.id===g)),mat=e?e.materiel:'';
 const garde=()=>{if(!e)LS.set('brd'+D.k,{nom,tr,q,nb,ts:Date.now()});};
 return {id:'fini',aid:e?e.id:null,html:()=>{
  let h=headHTML(e?'Modifier la diff':'Diff faite',esc(nom),true);
  if(rep&&!e)h+=`<div class="note">Saisie reprise là où vous l'aviez laissée.</div>`;
  h+=`<div class="trc"><label for="trv">Tracts distribués</label><input id="trv" inputmode="numeric" pattern="[0-9]*" value="${tr}"></div><div class="trb">${[-10,10,50,100].map(d=>`<button data-d="${d}" aria-label="${d>0?'Ajouter':'Retirer'} ${Math.abs(d)} tracts">${d>0?'+':'−'}${Math.abs(d)}</button>`).join('')}</div>`;
  h+=quandHTML(q,'Début de la diff');
  const hors=type==='marché'&&!seanceLe(nom,q),lock=interdit(q);
  if(hors)h+=`<div class="note">Le ${esc(nom.replace(/^Marché /,'marché '))} n'a pas lieu le ${JOURS[toD(q).getDay()]}. Vérifiez la date.</div>`;
  if(lock)h+=`<div class="note">Distribution interdite à cette date : veille ou jour de scrutin (code électoral, article L. 49).</div>`;
  h+=nbHTML(nb);
  h+=`<div class="fl"><span>Campagne</span><div class="ch2">${REF.campagnes.filter(c=>!c.archive||c.id===camp).map(c=>`<button data-cp="${c.id}" aria-pressed="${camp===c.id}">${esc(c.nom)}</button>`).join('')}</div></div>`;
  h+=`<div class="fl"><span>Groupes d'action</span><div class="ch2">${gaActifs().map(g=>`<button data-g="${g.id}" aria-pressed="${ga.includes(g.id)}">${esc(g.nom)}</button>`).join('')}</div></div>`;
  h+=matHTML(mat,camp);
  const ok=tr>0&&camp&&ga.length&&!lock;
  h+=`<div class="btns stick"><button class="btn cta" id="env" ${ok?'':'disabled'}>${I.check} ${hors?'Enregistrer quand même':e?'Enregistrer':'Enregistrer le compte rendu'}</button>${ok||lock?'':`<div class="hint" id="hTr">${tr>0?'Choisissez une campagne et au moins un GA.':'Indiquez le nombre de tracts distribués.'}</div>`}</div>`;
  if(e&&peutSupprimer(e))h+=`<div class="btns"><button class="btn line danger" id="del">Supprimer ce compte rendu</button></div>`;
  if(e)h+=histoSaisies(e);
  return h;},
 after:()=>{lierQuand(()=>q,v=>{q=v;garde();});
  const tv=$('trv');tv.onfocus=()=>{try{tv.select();}catch(x){}};tv.oninput=()=>{const v=parseInt(tv.value.replace(/\D/g,''),10);tr=isNaN(v)?0:v;garde();const b=$('env');if(b)b.disabled=!(tr>0&&camp&&ga.length&&!interdit(q));const hh=$('hTr');if(hh)hh.hidden=tr>0&&camp&&ga.length;};
  body.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{tr=Math.max(0,tr+(+b.dataset.d));garde();render(true);});
  lierCpt(()=>nb,(x,v)=>{nb=Math.max(1,v);if(!e){nbm=nb;LS.set('nbm',nb);}garde();});
  body.querySelectorAll('[data-cp]').forEach(b=>b.onclick=()=>{camp=b.dataset.cp;render(true);});
  body.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const g=b.dataset.g,k=ga.indexOf(g);if(k>=0)ga.splice(k,1);else ga.push(g);render(true);});
  lierMat(v=>mat=v);
  const dl=$('del');if(dl)dl.onclick=()=>{const k=ACTIONS.indexOf(e);ACTIONS.splice(k,1);sauverA();back();toast('Compte rendu supprimé',{t:'Annuler',fn:()=>{ACTIONS.splice(k,0,e);sauverA();render(true);}});};
  $('env').onclick=()=>{if(!(tr>0))return;const lieuId=nom;
   if(e){Object.assign(e,{tracts:tr,faite_le:q,nb,campagne:camp,ga:ga.slice(),materiel:mat});saisie(e,'compte rendu modifié');sauverA();back();toast('Diff du '+fmtJ(q)+' enregistrée');return;}
   const x=nouvelleAction(TYPE_DIFF[type]||'diff_marche',{statut:'faite',faite_le:q,nb,tracts:tr,campagne:camp,ga:ga.slice(),materiel:mat,etapes:[{lieu:{t:LT[type]||'marche',id:lieuId},portes:0,toquees:0,ouvertes:0,st:'',acc:'',boites:0,le:q}]});
   x.nom=`${TYPES_C[x.type]} ${nom.replace(/^Marché /,'')}`;ACTIONS.push(x);saisie(x,'diff faite');sauverA();LS.set('brd'+D.k,null);LS.set('dcamp',camp);LS.set('dga',ga);
   stack=[vueBase(),{id:'ok',html:()=>`<div class="ok"><div class="ck">${I.check}</div><h1>Compte rendu enregistré</h1><div class="sub">${esc(nom)} · ${n0(tr)} tracts · ${fmtJH(q)}</div><div class="sub">Envoyé au journal partagé, ou au retour du réseau si le téléphone est hors connexion.</div></div><div class="btns"><button class="btn line" id="sh">Partager le compte rendu</button><button class="btn primary" id="nv">Revenir à la liste</button></div>`,
    after:()=>{$('sh').onclick=()=>partager(txtAction(x));$('nv').onclick=()=>show(vueBase());}}];render();};}};}
function vueActionDiffHTML(a){const e=a.etapes[0]||{lieu:{id:''}};let h=headHTML(esc(a.nom),`${TYPES[a.type]} · ${sttHTML(a)}`,true);
 h+=`<div class="meta2"><div><span>Campagne</span><b>${esc(campNom(a.campagne))}</b></div><div><span>GA</span><b>${a.ga.map(g=>esc(gaNom(g))).join(', ')}</b></div><div><span>Faite le</span><b>${fmtJH(a.faite_le)}</b></div></div>`;
 h+=`<div class="pap-sum"><span>${esc(e.lieu.id)}</span><span><b>${n0(a.tracts)}</b> tracts</span>${a.nb?`<span><b>${a.nb}</b> militant${a.nb>1?'s':''}</span>`:''}${a.materiel?`<span>${esc(matNom(a.materiel))}</span>`:''}</div>`;
 h+=`<div class="btns"><button class="btn primary" id="mdiff">Modifier ce compte rendu</button><button class="btn line" id="sh">Partager</button></div>`+histoSaisies(a);return h;}
function lierActionDiff(a){const lt={diff_marche:'marché',diff_metro:'station',diff_supermarche:'supermarché'};$('mdiff').onclick=()=>detail(vueDiff(a.etapes[0].lieu.id,lt[a.type],a.id));$('sh').onclick=()=>partager(txtAction(a));}

/* ---------------- liste des actions : tri par date ou par GA, filtres type, statut, GA */
let FILTRE={type:'tous',statut:'tous',ga:'tous',tri:'date'};
function vueActions(f){if(f&&f.type){FILTRE.type=f.type;}
 return {id:'actions',html:()=>{const F=FILTRE;
  let l=ACTIONS.filter(a=>(F.type==='tous'||(F.type==='diff'?a.type.startsWith('diff'):a.type===F.type))&&(F.statut==='tous'||a.statut===F.statut)&&(F.ga==='tous'||a.ga.includes(F.ga)));
  l.sort((a,b)=>{const x=a.statut==='faite'?a.faite_le:a.prevue||a.cree_le,y=b.statut==='faite'?b.faite_le:b.prevue||b.cree_le;return (y||'').localeCompare(x||'');});
  let h=headHTML('Actions',`${pl(l.length,'action')} dans le journal`,true);
  h+=`<div class="seg" role="group" aria-label="Type">${[['tous','Toutes'],['pap','PAP'],['boitage','Boîtage'],['diff','Diffs']].map(([k,t])=>`<button data-ft="${k}" aria-pressed="${F.type===k}">${t}</button>`).join('')}</div>`;
  h+=`<div class="seg" role="group" aria-label="Statut">${[['tous','Tous statuts'],['a_faire','À faire'],['faite','Faites']].map(([k,t])=>`<button data-fs="${k}" aria-pressed="${F.statut===k}">${t}</button>`).join('')}</div>`;
  h+=`<div class="frow2"><select id="fg" aria-label="GA"><option value="tous">Tous les GA</option>${REF.ga.map(g=>`<option value="${g.id}" ${F.ga===g.id?'selected':''}>${esc(g.nom)}${g.archive?' (archivé)':''}</option>`).join('')}</select><div class="seg sm" role="group" aria-label="Tri">${[['date','Par date'],['ga','Par GA']].map(([k,t])=>`<button data-fo="${k}" aria-pressed="${F.tri===k}">${t}</button>`).join('')}</div></div>`;
  if(!l.length)return h+'<div class="empty">Aucune action pour ces filtres.</div>';
  if(F.tri==='ga'){const gs=REF.ga.filter(g=>l.some(a=>a.ga.includes(g.id)));gs.forEach(g=>{const m=l.filter(a=>a.ga.includes(g.id));h+=`<div class="side">${esc(g.nom)} · ${m.length}</div>`+m.map(rowAction).join('');});}
  else h+=l.map(rowAction).join('');
  return h;},
 after:()=>{body.querySelectorAll('[data-ft]').forEach(b=>b.onclick=()=>{FILTRE.type=b.dataset.ft;render(true);});
  body.querySelectorAll('[data-fs]').forEach(b=>b.onclick=()=>{FILTRE.statut=b.dataset.fs;render(true);});
  body.querySelectorAll('[data-fo]').forEach(b=>b.onclick=()=>{FILTRE.tri=b.dataset.fo;render(true);});
  $('fg').onchange=e=>{FILTRE.ga=e.target.value;render(true);};}};}
