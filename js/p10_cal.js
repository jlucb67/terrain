
/* ================= v32, 2e temps (21/11/2026, JL) =================
   JL : « programmation, c'est surtout de la carto pour choisir ; puis gestion, communication, validation se font via le
   calendrier » ; « dans la programmation, il ne faut plus qu'il y ait le suivi des actions ».
   - Programmer : en haut de l'encart, PAP, pied d'immeuble ou tractage ; plus de cartes d'actions ici. On touche la carte :
     PAP, le meilleur PAP autour du point ; pied d'immeuble, le stand placé là et ses équipes autour (ou une zone proposée).
     Dans un PAP choisi, toucher une adresse l'ajoute au PAP ou l'enlève.
   - Calendrier : la semaine, en liste (téléphone) ou en frise (ordinateur, au choix au téléphone) ; une couleur par sorte
     d'action ; le passé reste visible ; on ouvre une action pour la valider, changer son jour ou son heure, ou l'annuler ;
     « Valider » d'une touche sur la ligne ; « Envoyer le programme de la semaine » ouvre le sondage Telegram.
   - Bilan : l'ancien Suivi, avec la liste de tout ce qui a été fait. */

/* ---- l'encart de Programmer : le choix du haut */
function segHTML(){return `<div class="seg3" id="seg" role="tablist" aria-label="Que programmer">${[['pap','PAP'],['pieds','Pied d\'immeuble'],['tractage','Tractage']].map(([k,t])=>`<button role="tab" data-m="${k}" aria-selected="${ONG===k}">${t}</button>`).join('')}</div>`;}
function avecSeg(v){const h=v.html,a=v.after;v.html=()=>segHTML()+h();
 v.after=()=>{body.querySelectorAll('#seg [data-m]').forEach(b=>b.onclick=()=>{viseur(false);if(b.dataset.m!==ONG)setMode(b.dataset.m);else{effLot();sel(null);show(vueBase());}});if(a)a();};
 v.enc=1;return v;}

/* ---- toucher la carte (v32) : la couche touchée appelle tapProg avec son point ; la carte seule aussi (plus bas).
   Un même toucher n'agit qu'une fois (marque _tp sur l'événement d'origine). */
function tapProg(ll,i,e){const oe=e&&e.originalEvent;if(oe&&oe._tp)return true;if(!D||VIS)return false;const t=stack[stack.length-1];if(!t)return false;let ok=false;
 if(ONG==='pap'&&t.id==='base'){ok=true;placerPAP(ll);}
 else if(ONG==='pap'&&t.id==='lot'&&lot&&lot.type!=='boitage'){ok=true;const j=i!=null&&adrL.hasLayer(AM[i])?i:adrProche(ll);if(j!=null)basculerLot(j);}
 else if(ONG==='pieds'&&t.id==='base'){ok=true;placerPied(ll);}
 if(ok&&oe)oe._tp=1;return ok;}
map.on('click',e=>{tapProg([e.latlng.lat,e.latlng.lng],null,e);});
/* l'adresse visible la plus proche du toucher, à 36 pixels au plus */
function adrProche(ll){const p=map.latLngToContainerPoint(ll);let bi=null,bd=36*36;
 AM.forEach(m=>{if(!adrL.hasLayer(m))return;const a=D.adresses[m.i],q=map.latLngToContainerPoint([a[1],a[0]]),d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<bd){bd=d;bi=m.i;}});return bi;}
function placerPAP(ll){if(!dansCirco(ll)){toast('Ce point est hors de la '+D.k+'e circonscription.');return;}
 const l=meilleurPAP(ll);if(!l){toast('Aucune adresse prioritaire libre près d\'ici. Touchez un autre endroit.');return;}
 preparer(null,'',null,null,null,{lot:l});}
function basculerLot(i){const k=lot.ids.indexOf(i);if(k>=0)lot.ids.splice(k,1);else lot.ids.push(i);lot.ins=insDe(lot.ids);lot.km=kmDe(lot.ids);
 dessinerLot();render(true);toast((k>=0?'Enlevée du PAP : ':'Ajoutée au PAP : ')+D.adresses[i][2]);try{navigator.vibrate&&navigator.vibrate(12);}catch(e){}}

/* ---- pied d'immeuble placé n'importe où (v32, JL) : le stand au point touché, une zone de 250 m autour (réglage, pas une
   mesure) pour la priorité et le dessin ; les équipes de PAP se font comme pour une zone proposée. Le point est gardé
   dans l'action (lieu.lat, lieu.lon) pour la retrouver. */
const PIED_R=250;
function cercleGeo(ll,R){const c=Math.cos(ll[0]*Math.PI/180),P=[];for(let k=0;k<=24;k++){const th=2*Math.PI*k/24;P.push([ll[1]+R*Math.cos(th)/(111320*c),ll[0]+R*Math.sin(th)/110540]);}return {type:'Polygon',coordinates:[P]};}
function piedLibre(lat,lon,nom){const ll=[lat,lon],s={nom,lat,lon,geo:cercleGeo(ll,PIED_R),libre:1,qpv:[],ls:0,poste:{lat,lon,txt:'Placé sur la carte',verif:1,type:'libre'}};
 s.ins=D.adresses.reduce((t,a)=>t+(isPr(a)&&dist(ll,[a[1],a[0]])<=PIED_R?a[3]:0),0);return s;}
function placerPied(ll){if(!dansCirco(ll)){toast('Ce point est hors de la '+D.k+'e circonscription.');return;}
 let bi=null,bd=1e12;D.adresses.forEach((a,i)=>{const d=dist(ll,[a[1],a[0]]);if(d<bd){bd=d;bi=i;}});
 const s=piedLibre(ll[0],ll[1],'Près du '+(bi!=null?D.adresses[bi][2]:'point choisi'));sel(null);if(!wide&&det==='peek')setDet('half');detail(vuePied(s));}
/* un pied d'immeuble d'après son nom : une zone proposée, sinon un stand placé sur la carte (gardé dans l'action) */
function piedDe(nom){const s=(D.pieds||[]).find(x=>x.nom===nom);if(s)return s;
 const a=ACTIONS.find(x=>x.type==='diff_pied'&&x.etapes[0]&&x.etapes[0].lieu.id===nom&&x.etapes[0].lieu.lat!=null);
 return a?piedLibre(a.etapes[0].lieu.lat,a.etapes[0].lieu.lon,nom):null;}

/* ---- le calendrier */
const TCOUL=a=>a.type==='pap'?['var(--cPap)','var(--cPapI)']:a.type==='diff_pied'?['var(--cPied)','var(--cPiedI)']:['var(--cTr)','var(--cTrI)'];
const typeCal=a=>a.type==='pap'?'PAP':a.type==='diff_pied'?'Pied d\'immeuble':'Tractage';
const courtCal=a=>a.type==='pap'?'PAP':a.type==='diff_pied'?'Pied':'Tract.';
const initCal=a=>a.type==='pap'?'P':a.type==='diff_pied'?'Pi':'T';
/* les PAP d'équipe d'un pied d'immeuble sont dans le pied d'immeuble (une seule ligne) */
const estEquipe=a=>a.type==='pap'&&!!a.groupe&&duGroupe(a.groupe).some(x=>x.type==='diff_pied');
let CALW=0,CALG='',CALV=null;
const actsCal=()=>ACTIONS.filter(a=>(a.type==='pap'||String(a.type).startsWith('diff_'))&&!estEquipe(a)&&(!CALG||(a.ga||[]).includes(CALG)));
/* le moment d'une action : programmé (à faire), ou celui où elle a eu lieu (validée ; « quand » est gardé à la validation) */
const quandCal=a=>a.statut==='faite'?(a.quand||a.faite_le||''):quandA(a);
const lieuCal=a=>{const e=a.etapes&&a.etapes[0];if(a.type==='pap')return (a.nom||'PAP').replace(/^PAP /,'');if(!e)return '';return a.type==='diff_metro'||e.lieu.t==='station'?'Métro '+e.lieu.id:e.lieu.id;};
const hhmm=q=>{const d=toD(q);return d&&/T\d/.test(q)?pad2(d.getHours())+':'+pad2(d.getMinutes()):'';};
const MOIS_L=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
function semaineTxt(l){const f=new Date(l);f.setDate(f.getDate()+6);return l.getMonth()===f.getMonth()?`Semaine du ${l.getDate()} au ${f.getDate()} ${MOIS_L[f.getMonth()]}`:`Semaine du ${l.getDate()} ${MOIS_L[l.getMonth()]} au ${f.getDate()} ${MOIS_L[f.getMonth()]}`;}
const memeJour=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
function ligneCal(a){const [c]=TCOUL(a),q=quandCal(a),f=a.statut==='faite',due=!f&&aValider(a);
 const n=a.type==='diff_pied'&&a.groupe?duGroupe(a.groupe).filter(x=>x.type==='pap').length:0;
 const sub=[hhmm(q),pourQui(a),n?pl(n,'équipe'):'',f?'':due?'à valider':q?'programmé':'sans date'].filter(Boolean).join(' · ');
 return `<div class="cr${f?' fait':''}${due?' due':''}" style="--c:${c}"><span class="cb"></span><button class="co" data-ca="${a.id}"><b>${esc(typeCal(a))} · ${esc(lieuCal(a))}</b><small>${esc(sub)}</small></button>${f?`<span class="ok">✓ Validé</span>`:due?`<button class="vbtn" data-cv="${a.id}">Valider</button>`:`<span class="cv2">${I.next}</span>`}</div>`;}
function listeCal(lun,S){if(!S.length)return `<div class="cvide">Aucune action cette semaine. Programmez-en dans l'onglet Programmer.</div>`;
 const auj=new Date();let h='';
 for(let k=0;k<7;k++){const d=new Date(lun);d.setDate(d.getDate()+k);const l=S.filter(a=>{const x=toD(quandCal(a));return x&&memeJour(x,d);});if(!l.length)continue;
  const j=d.toLocaleDateString('fr-FR',{weekday:'long'})+' '+d.getDate();
  h+=`<div class="cday${memeJour(d,auj)?' auj':''}">${memeJour(d,auj)?'Aujourd\'hui, ':''}${esc(j)}</div>`+l.map(ligneCal).join('');}
 return h;}
/* la frise (v32, 2e temps ; JL : « plus zoomé, pas toutes les heures mais juste les blocs où il y a les actions ; on défile en
   swipant à droite ou à gauche, pas toute la semaine à l'écran en même temps », puis « l'heure peut être sur le bloc, pas de
   blanc ») : une colonne par jour, les actions du jour empilées dans l'ordre des heures, l'heure écrite sur chaque bloc, sans
   grille d'heures ni vide entre les blocs ; au téléphone, 3 jours à l'écran, on glisse le doigt pour voir les autres, la frise
   s'ouvre sur aujourd'hui ; à l'ordinateur, les 7 jours. */
function friseHTML(lun,S){const auj=new Date(),col=wide?'minmax(0,1fr)':'calc(100% / 3)';
 const T=S.map(a=>({a,t:toD(quandCal(a))})).filter(o=>o.t);
 if(!T.length)return `<div class="cvide">Aucune action cette semaine. Programmez-en dans l'onglet Programmer.</div>`;
 let h=`<div class="frz z"><div class="fzs" id="fzs"><div class="fzg" style="grid-template-columns:repeat(7,${col})">`;
 for(let k=0;k<7;k++){const d=new Date(lun);d.setDate(d.getDate()+k);h+=`<span class="fzh${memeJour(d,auj)?' auj':''}">${d.toLocaleDateString('fr-FR',{weekday:'short'}).replace('.','')}<b>${d.getDate()}</b></span>`;}
 for(let k=0;k<7;k++){const d=new Date(lun);d.setDate(d.getDate()+k);const c=T.filter(o=>memeJour(o.t,d)).sort((p,q)=>p.t-q.t);
  h+=`<div class="fcol${memeJour(d,auj)?' auj':''}">`+c.map(o=>{const a=o.a,[bg,ink]=TCOUL(a),f=a.statut==='faite',due=!f&&aValider(a);
   return `<button class="fb${f?' fait':''}${due?' due':''}" data-ca="${a.id}" style="--c:${bg};--ci:${ink}" aria-label="${esc(typeCal(a)+' '+lieuCal(a)+', '+fmtJH(quandCal(a))+(f?', validé':due?', à valider':''))}"><span class="fbh">${hhmm(quandCal(a))}${f?' ✓':due?' !':''}</span>${esc(courtCal(a))}<small>${esc(lieuCal(a))}</small></button>`;}).join('')+`</div>`;}
 return h+`</div></div></div>`;}
/* la frise s'ouvre sur aujourd'hui (s'il est dans la semaine affichée) */
function caleFrise(lun){const s=$('fzs'),c=s&&s.querySelector('.fcol');if(!c)return;const k=Math.floor((new Date()-lun)/864e5);if(k>0&&k<7)s.scrollLeft=k*c.getBoundingClientRect().width;}
function vueCal(){return {id:'base',html:()=>{if(!CALV)CALV=LS.get('calV',wide?'frise':'liste');
  const lun=toD(lundiDe(isoD(new Date())));lun.setDate(lun.getDate()+7*CALW);const fin=new Date(lun);fin.setDate(fin.getDate()+7);
  const A=actsCal(),dans=a=>{const d=toD(quandCal(a));return !!d&&d>=lun&&d<fin;},S=A.filter(dans).sort((x,y)=>String(quandCal(x)).localeCompare(String(quandCal(y))));
  const G=gaActifs();
  let h=`<div class="calp"><div class="calh"><h1>Calendrier</h1><div class="sgc t2" role="group" aria-label="Affichage">${[['liste','Liste'],['frise','Frise']].map(([k,t])=>`<button data-cvw="${k}" aria-pressed="${CALV===k}">${t}</button>`).join('')}</div></div>`;
  if(G.length>1)h+=`<div class="pour"><label class="chs"><select id="calG" aria-label="Groupe d'action"><option value="">Tous les GA</option>${G.map(g=>`<option value="${g.id}"${g.id===CALG?' selected':''}>${esc(g.nom)}</option>`).join('')}</select>${I.down}</label></div>`;
  h+=`<div class="cwk"><button id="cwP" aria-label="Semaine précédente">‹</button><b>${semaineTxt(lun)}</b><button id="cwN" aria-label="Semaine suivante">›</button></div>`;
  h+=`<div class="cleg"><span><i style="background:var(--cPap)"></i>PAP</span><span><i style="background:var(--cPied)"></i>Pied d'immeuble</span><span><i style="background:var(--cTr)"></i>Tractage</span><span><i class="av"></i>à valider</span></div>`;
  h+=`<button class="btnf calsb" id="calSond">Envoyer le programme de la semaine</button>`;
  /* les actions à valider des semaines d'avant, et celles sans date, restent en vue sur la semaine en cours */
  const vieux=CALW===0?A.filter(a=>a.statut==='a_faire'&&aValider(a)&&!dans(a)&&(toD(quandA(a))||fin)<lun).sort((x,y)=>String(quandA(x)).localeCompare(String(quandA(y)))):[];
  if(vieux.length)h+=`<div class="cday">À valider, des semaines d'avant</div>`+vieux.map(ligneCal).join('');
  h+=CALV==='frise'?friseHTML(lun,S):listeCal(lun,S);
  const sd=CALW===0?A.filter(a=>a.statut==='a_faire'&&!quandA(a)):[];
  if(sd.length)h+=`<div class="cday">Sans date</div>`+sd.map(ligneCal).join('');
  h+=`<div class="hint" style="margin-top:12px">${wide?'Cliquez sur':'Touchez'} une action pour la valider, changer son jour ou son heure, ou l'annuler.</div>`+lienCR()+`</div>`;
  return h;},
 after:()=>{majCouches();body.querySelectorAll('[data-cvw]').forEach(b=>b.onclick=()=>{CALV=b.dataset.cvw;LS.set('calV',CALV);render(true);});
  $('cwP').onclick=()=>{CALW--;render(true);};$('cwN').onclick=()=>{CALW++;render(true);};
  if(CALV==='frise'&&!wide){const l=toD(lundiDe(isoD(new Date())));l.setDate(l.getDate()+7*CALW);caleFrise(l);}
  const g=$('calG');if(g)g.onchange=()=>{CALG=g.value;render(true);};
  /* le sondage s'ouvre sur la semaine affichée (au plus tôt, celle qu'il propose d'habitude), pour le GA choisi */
  $('calSond').onclick=()=>{const l=toD(lundiDe(isoD(new Date())));l.setDate(l.getDate()+7*CALW);const m=lundiS(new Date()),G=gaActifs();
   if(!SOND||SOND.k!==D.k)SOND={k:D.k,ga:gaDefaut()[0]||((G[0]||{}).id)||'',deb:''};SOND.deb=isoD(l>m?l:m).slice(0,10);if(CALG)SOND.ga=CALG;setMode('sondage');};
  body.querySelectorAll('[data-ca]').forEach(b=>b.onclick=()=>ouvrirCal(b.dataset.ca));
  body.querySelectorAll('[data-cv]').forEach(b=>b.onclick=()=>validerCal(b.dataset.cv));}};}
/* ouvrir une action du calendrier (ou du Bilan) : sa fiche, sans changer d'onglet ; on y valide, change le jour ou l'heure, annule */
function ouvrirCal(id){const a=actPar(id);if(!a)return;
 if(a.type==='pap'){detail(vueEnCours(id));return;}
 if(a.statut==='faite'){detail(vueAction(id));return;}
 const l=a.etapes[0]&&a.etapes[0].lieu;if(!l)return;
 if(a.type==='diff_pied'){const s=piedDe(l.id);if(s)detail(vuePied(s));else detail(vueAction(id));return;}
 if(aValider(a))ouvrirLieuEq(l.t,l.id);else detail(vueDiff(l.id,DLT[a.type],a.id));}
/* « Valider » d'une touche, sur la ligne du calendrier : toutes les adresses d'un PAP sont faites (« Pas pu entrer » se note
   dans le PAP ouvert) ; puis l'écran « Validé » (portes, commentaire, « À refaire bientôt ») */
function validerCal(id){const a=actPar(id);if(!a||a.statut!=='a_faire')return;sansToast();
 if(a.type==='pap'){const avant=avance(),snap=photo([a]);finirPAP(a);saisie(a,'Validé');sauverA();dessinerParcours();vibrer();stack=[vueBase(),vueNote(a,avant,'',snap)];render();return;}
 if(a.type==='diff_pied'){const avant=avance(),snap=photo(a.groupe?duGroupe(a.groupe):[a]);finirPied(a);sauverA();dessinerParcours();vibrer();stack=[vueBase(),vueNote(a,avant,"Pied d'immeuble "+lieuCal(a),snap)];render();return;}
 validerDiff(id);}

/* ---- Bilan : tout ce qui a été fait, le plus récent d'abord */
let BFILT='tout',BN=15;
function faitHTML(){const F=ACTIONS.filter(a=>a.statut==='faite'&&(a.type==='pap'||String(a.type).startsWith('diff_'))&&!estEquipe(a)&&(BFILT==='tout'||(BFILT==='pap'&&a.type==='pap')||(BFILT==='pied'&&a.type==='diff_pied')||(BFILT==='tr'&&a.type!=='pap'&&a.type!=='diff_pied'))).sort((x,y)=>String(quandCal(y)).localeCompare(String(quandCal(x))));
 let h=`<h2>Tout ce qui a été fait · ${F.length}</h2><div class="sgc" role="group" aria-label="Sorte d'action" style="margin-bottom:10px">${[['tout','Tout'],['pap','PAP'],['pied','Pieds'],['tr','Tractage']].map(([k,t])=>`<button data-bf="${k}" aria-pressed="${BFILT===k}">${t}</button>`).join('')}</div>`;
 if(!F.length)return h+`<div class="cvide">Rien de validé pour l'instant.</div>`;
 h+=F.slice(0,BN).map(a=>{const [c]=TCOUL(a),q=quandCal(a),n=a.type==='pap'?a.etapes.length:0,sub=[fmtJH(q).replace(/^./,x=>x.toLowerCase()),pourQui(a),n?pl(n,'adresse'):''].filter(Boolean).join(' · ');
  return `<div class="cr fait" style="--c:${c}"><span class="cb"></span><button class="co" data-bfa="${a.id}"><b>${esc(typeCal(a))} · ${esc(lieuCal(a))}</b><small>${esc(sub)}</small>${a.com?`<small class="pcom">« ${esc(a.com)} »</small>`:''}</button><span class="cv2">${I.next}</span></div>`;}).join('');
 if(F.length>BN)h+=`<button class="lnk9" id="bfPlus">Voir plus (${F.length-BN})</button>`;
 return h;}
function lierFait(){body.querySelectorAll('[data-bf]').forEach(b=>b.onclick=()=>{BFILT=b.dataset.bf;BN=15;render(true);});
 body.querySelectorAll('[data-bfa]').forEach(b=>b.onclick=()=>ouvrirCal(b.dataset.bfa));const p=$('bfPlus');if(p)p.onclick=()=>{BN+=30;render(true);};}
