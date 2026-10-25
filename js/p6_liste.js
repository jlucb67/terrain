
/* ---------------- onglet Liste, version légère (25/10/2026, arbitrages JL) : l'équipe action cherche une adresse ou un pied
   d'immeuble et touche « Valider ». C'est tout. Retoucher la même semaine annule ; une adresse faite une semaine d'avant
   reçoit un passage de plus (« +1 passage »). Les PAP prévus s'y valident adresse par adresse, ou d'un coup (« Tout
   valider ») ; un PAP dont toutes les adresses sont validées passe en « faite ». Pas de date à saisir : un passage est daté
   par sa semaine. Tout passe par les mêmes actions que la carte (journal partagé). */
var LQ='',LQT='',LN=200,LOUV=null;
const LPAS=200;
/* semaine d'un passage : lundi de la semaine */
const lundiDe=s=>{const d=toD(s)||new Date(),x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return isoD(x).slice(0,10);};
const semTxt=s=>'semaine du '+fmtJ(lundiDe(s));
const semLong=s=>'Semaine du '+toD(lundiDe(s)).toLocaleDateString('fr-FR',{day:'numeric',month:'long'});
const cetteSem=s=>!!s&&lundiDe(s)===lundiDe(isoD(new Date()));
const nbSem=s=>Math.round((toD(lundiDe(isoD(new Date())))-toD(lundiDe(s)))/6048e5);
const relSem=s=>{const n=nbSem(s);return n<=0?'cette semaine':n===1?'la semaine dernière':`il y a ${n} sem.`;};
const campC=()=>campNom(campDefaut());
const deListe=a=>!!(a&&a.origine&&a.origine.lot==='liste');
const stE=e=>e.st==='ferme'?'ferme':(e.toquees>0||e.st==='faite')?'fait':'afaire';
const m10=m=>m>0?Math.max(10,Math.round(m/10)*10):0;
const vibrer=()=>{try{navigator.vibrate&&navigator.vibrate(10);}catch(x){}};
const avH=(c,x)=>`<span class="av ${c}">${x}</span>`;
/* bouton qui change d'état : v Valider, p +1 passage, f Faite, k Pas pu entrer, kf Pas pu entrer (noté) */
const pillH=(k,at,lab)=>`<button class="pill ${k}" ${at}>${k==='f'||k==='kf'?I.check:''}${lab||{v:'Valider',p:'+1 passage',f:'Faite',k:'Pas pu entrer',kf:'Pas pu entrer'}[k]}</button>`;
/* qui a validé : la dernière saisie sur cette adresse */
function parQui(a,id){const s=(a&&a.saisies||[]).slice().reverse().find(x=>x.quoi==='adresse '+id||x.quoi.startsWith('adresse '+id));if(!s)return '';return s.par===moi().id?'toi':userNom(s.par);}
/* après un changement : la liste si elle est affichée, sinon la vue en cours */
function rafr(){if($('lres'))majRes(true);else render(true);}

function vueListe(){return {id:'base',
 html:()=>`<div class="lhead"><div><h1 class="lt">Liste</h1><div class="sub" id="lsub">${compteListe()}</div></div></div><label class="srch2">${I.loupe}<input id="lq" type="search" enterkeyhint="search" placeholder="Chercher une adresse ou une rue" value="${esc(LQT)}" autocomplete="off" aria-label="Chercher une adresse ou une rue"></label><div id="lres">${resHTML()}</div>`,
 after:()=>{const q=$('lq');let qT=0;q.oninput=()=>{LQT=q.value;clearTimeout(qT);qT=setTimeout(()=>{LQ=normA(LQT.trim());LN=LPAS;majRes();},150);};
  $('lres').onclick=clicRes;suite();}};}
/* toutes les adresses de la circo, par rue puis par numéro (JL, 25/10/2026) ; la recherche filtre */
const resHTML=()=>rechercheHTML();
function compteListe(){let pr=0,f=0;D.adresses.forEach(a=>{if(isPr(a))pr++;if(statutA(a[2])==='fait')f++;});return `${pl(D.adresses.length,'adresse')} · ${n0(pr)} prioritaires · <span class="g">${pl(f,'faite')}</span>`;}
function majRes(keep){const r=$('lres');if(!r)return;const y=body.scrollTop;r.innerHTML=resHTML();body.scrollTop=keep?y:0;const c=$('lsub');if(c)c.innerHTML=compteListe();suite();}
var lObs=null;
function suite(){const m=$('lmore');if(!m)return;try{if(lObs)lObs.disconnect();lObs=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){lObs.disconnect();LN+=LPAS;majRes(true);}},{root:body,rootMargin:'300px'});lObs.observe(m);}catch(e){}}
function clicRes(ev){const t=ev.target.closest('[data-lv],[data-le],[data-gv],[data-pv],[data-gh],[data-lt],[data-pt],#lmore');if(!t)return;const d=t.dataset;
 if(d.lv!=null)basculerAdr(+d.lv);else if(d.le){const [aid,k]=d.le.split(':');basculerEtape(aid,+k);}else if(d.gv)toutValider(d.gv);
 else if(d.pv!=null)basculerPied(+d.pv);else if(d.gh){LOUV=LOUV===d.gh?'':d.gh;majRes(true);}else if(d.lt!=null)ouvrirAdresse(+d.lt);
 else if(d.pt!=null)ouvrirPied(D.pieds[+d.pt]);else if(t.id==='lmore'){LN+=LPAS;majRes(true);}}

/* ---- accueil : PAP prévus, puis pieds d'immeuble */
const papsPrevus=()=>ACTIONS.filter(x=>x.type==='pap'&&x.statut==='a_faire'&&!deListe(x)).sort(ordreAct);
function tuileDate(a){const d=a.prevue&&toD(a.prevue);return d?`<span class="dt"><i>${JC[d.getDay()]}</i><b>${d.getDate()}</b></span>`:`<span class="dt">${I.cal}</span>`;}
function accueilListeHTML(){const P=papsPrevus();if(LOUV===null)LOUV=P.length?P[0].id:'';
 let h=`<div class="sh2">PAP prévus</div>`;
 h+=P.length?P.map(a=>grpPapHTML(a,a.id===LOUV)).join(''):`<div class="empty">Aucun PAP prévu. Préparez-en un dans l'onglet Porte-à-porte.</div>`;
 if((D.pieds||[]).length)h+=`<div class="sh2">Pieds d'immeuble</div>`+D.pieds.map((s,j)=>lignePied(j)).join('');
 return h;}
function grpPapHTML(a,ouv){const E=a.etapes.map((e,k)=>({e,k,i:idxE(e)})).filter(x=>x.i!=null),nf=E.filter(x=>stE(x.e)!=='afaire').length,tout=E.length&&nf===E.length;
 const ga=esc(a.ga.map(gaNom).join(', ')||'sans GA'),sub=ouv||nf?`${ga} · ${nf} sur ${E.length} faite${nf>1?'s':''}`:`${ga} · ${pl(E.length,'adresse')}${a.prevue?'':' · sans date'}`;
 let h=`<div class="gr${ouv?' on':''}"><div class="gh"><button class="tx" data-gh="${a.id}" aria-expanded="${ouv}">${tuileDate(a)}<span><b>${esc((a.nom||'PAP').replace(/^PAP /,''))}</b><small>${sub}</small></span></button>`+
  (ouv&&!tout?pillH('v',`data-gv="${a.id}"`,'Tout valider'):`<span class="chev">${I.next}</span>`)+`</div>`;
 if(ouv)h+=E.map(x=>{const ad=D.adresses[x.i],s=stE(x.e);
  return `<div class="lr" data-li="${x.i}">${s==='fait'?avH('ok',I.check):s==='ferme'?avH('ko','!'):avH('af',I.home)}<button class="tx" data-lt="${x.i}"><b>${esc(ad[2])}</b><small>${pl(ad[3],'inscrit')}${s==='ferme'?' · <span class="o">pas pu entrer</span>':''}</small></button>${pillH(s==='fait'?'f':'v',`data-le="${a.id}:${x.k}"`)}</div>`;}).join('');
 return h+'</div>';}

/* ---- recherche : une rue, une adresse, un pied d'immeuble ; par rue, puis par numéro */
/* rues rangées par leur nom, sans le type de voie : Amandiers (rue des), Annam (rue d'), Belleville (boulevard de)… */
const TYPV=/^(rue|avenue|boulevard|place|passage|impasse|allée|allee|villa|cité|cite|square|quai|cour|chemin|sentier|rond-point|parvis|voie|square|porte|galerie|hameau|jardin|promenade|esplanade|route|ruelle|sente|carrefour)\s+((de la|de l'|du|des|de|d'|la|le|les|l')\s*)?/i;
const clefVoie=v=>v.replace(TYPV,'').trim()||v;
function ordreAdrRue(){if(D._or)return D._or;const K={};D.adresses.forEach((a,i)=>{const v=ADRP[i].voie;if(!(v in K))K[v]=clefVoie(v);});
 D._or=D.adresses.map((a,i)=>i).sort((x,y)=>K[ADRP[x].voie].localeCompare(K[ADRP[y].voie],'fr',{sensitivity:'base'})||ADRP[x].voie.localeCompare(ADRP[y].voie,'fr')||ADRP[x].num-ADRP[y].num||ADRP[x].suf.localeCompare(ADRP[y].suf));return D._or;}
function rechercheHTML(){const l=LQ?ordreAdrRue().filter(i=>normA(D.adresses[i][2]).includes(LQ)):ordreAdrRue();
 if(!l.length)return `<div class="empty">Aucune adresse ne correspond.</div>`;
 let h='';
 const G=new Map();l.forEach(i=>{const v=ADRP[i].voie;if(!G.has(v))G.set(v,[]);G.get(v).push(i);});
 let rue=null;l.slice(0,LN).forEach(i=>{const v=ADRP[i].voie;if(v!==rue){rue=v;h+=teteRue(v,G.get(v));}h+=ligneA(i);});
 if(l.length>LN)h+=`<button class="lmore" id="lmore">Afficher la suite · ${pl(l.length-LN,'adresse')}</button>`;
 return h;}
function teteRue(v,ids){const bv=[...new Set(ids.map(i=>D.adresses[i][8]))];let pr=0,f=0,k=0;
 ids.forEach(i=>{const a=D.adresses[i],s=statutA(a[2]);if(isPr(a))pr++;if(s==='fait')f++;else if(s==='ferme')k++;});
 return `<div class="rh" data-rh="${esc(v)}"><div class="rt"><b>${esc(v)}</b><span>bureau${bv.length>1?'x':''} ${esc(bv.slice(0,3).join(', '))}${bv.length>3?'…':''}</span></div>`+
  `<small>${pl(ids.length,'adresse')} · ${pl(pr,'prioritaire')}${f?` · <span class="g">${pl(f,'faite')}</span>`:''}${k?` · <span class="o">${k} pas pu entrer</span>`:''}</small>`+
  `<div class="rb"><i style="flex:${f};background:var(--ok)"></i><i style="flex:${k};background:var(--ko)"></i><i style="flex:${Math.max(0,pr-f-k)}"></i></div></div>`;}
/* état d'une adresse pour sa ligne : le bouton (cette semaine) et une courte phrase */
function etatAdr(i){const a=D.adresses[i],id=a[2],s=statutA(id),ps=PASS[id]||[],sem=ps.length&&cetteSem(ps[0].q);let t='';
 if(s==='fait')t=sem?(ps.length>1?pl(ps.length,'passage'):''):`<span class="g">faite ${relSem(ps[0].q)}</span>`;
 else if(s==='ferme')t=`<span class="o">pas pu entrer ${relSem(FER[id].q)}</span>`;
 else if(s==='prevu'){const p=actPar(PREV[id].aid);t=p&&p.prevue?'prévue le '+fmtJ(p.prevue):'prévue dans un PAP';}
 else if(!isPr(a))t='non prioritaire';
 return {k:sem?'f':s==='fait'?'p':'v',t,s,ps};}
function avAdr(i){const a=D.adresses[i],e=etatAdr(i);
 return e.s==='fait'?avH('ok',e.ps.length>1?e.ps.length:I.check):e.s==='ferme'?avH('ko','!'):e.s==='prevu'?avH('af pv',I.home):isPr(a)?avH('af',I.home):avH('np',I.home);}
function ligneA(i){const a=D.adresses[i],e=etatAdr(i);
 return `<div class="lr" data-li="${i}">${avAdr(i)}<button class="tx" data-lt="${i}"><b>${esc(a[2])}</b><small>${pl(a[3],'inscrit')}${e.t?' · '+e.t:''}</small></button>${pillH(e.k,`data-lv="${i}"`)}</div>`;}

/* ---- une touche : valider, annuler, un passage de plus */
function basculerAdr(i){const id=AID(i),ps=PASS[id]||[];
 if(ps.length&&cetteSem(ps[0].q)){if(!retirerPassage(i)){ouvrirAdresse(i);return;}vibrer();rafr();toast(id+' : passage retiré',{t:'Annuler',fn:()=>{ajouterPassage(i);rafr();}});return;}
 ajouterPassage(i);vibrer();rafr();toast(id+(ps.length?' : un passage de plus':' : faite'),{t:'Annuler',fn:()=>{retirerPassage(i);rafr();}});}
function basculerEtape(aid,k){const a=actPar(aid);if(!a)return;const e=a.etapes[k],i=idxE(e);if(i==null)return;const id=D.adresses[i][2];
 if(stE(e)==='fait'){if(e.toquees>0){ouvrirAdresse(i);return;}setE(a,k,{st:''});vibrer();rafr();toast(id+' : retirée',{t:'Annuler',fn:()=>{setE(a,k,{st:'faite'});rafr();}});return;}
 const av=e.st;setE(a,k,{st:'faite'});vibrer();rafr();toast(id+' : faite',{t:'Annuler',fn:()=>{setE(a,k,{st:av});rafr();}});}
function toutValider(aid){const a=actPar(aid);if(!a)return;const avant=a.etapes.map(e=>[e.st,e.le]),now=isoD(new Date());
 a.etapes.forEach(e=>{if(idxE(e)!=null&&stE(e)==='afaire'){e.st='faite';e.le=now;}});saisie(a,'toutes les adresses validées');finAuto(a);sauverA();dessinerParcours();vibrer();rafr();
 toast((a.nom||'PAP')+' : tout est validé',{t:'Annuler',fn:()=>{a.etapes.forEach((e,k)=>{e.st=avant[k][0];e.le=avant[k][1];});finAuto(a);saisie(a,'validation annulée');sauverA();dessinerParcours();rafr();}});}
/* un PAP dont toutes les adresses sont validées passe en « faite » ; il revient « à faire » si on en retire une */
function finAuto(a){if(!a||a.type!=='pap'||deListe(a))return;const E=a.etapes.filter(e=>idxE(e)!=null),tout=E.length>0&&E.every(e=>stE(e)!=='afaire');
 if(tout&&a.statut==='a_faire'){a.statut='faite';a.faite_le=isoD(new Date());a.fin='liste';saisie(a,'PAP fait : toutes les adresses validées');}
 else if(!tout&&a.statut==='faite'&&a.fin==='liste'){a.statut='a_faire';a.faite_le='';delete a.fin;saisie(a,'PAP rouvert');}}
/* passages hors PAP : l'action de la semaine « Passages de la semaine du … », créée d'office, une par personne */
function actionSemaine(){const now=isoD(new Date());
 let a=ACTIONS.find(x=>deListe(x)&&x.type==='pap'&&x.cree_par===moi().id&&cetteSem(x.faite_le)&&x.campagne===campDefaut());
 if(!a){a=nouvelleAction('pap',{nom:'Passages de la '+semTxt(now),statut:'faite',faite_le:now,origine:{lot:'liste'}});ACTIONS.push(a);saisie(a,'création depuis la liste');}
 return a;}
/* adresse d'un PAP validé cette semaine, retirée puis notée de nouveau : elle revient dans ce PAP */
function etapeSemaine(id){for(const a of ACTIONS){if(a.type!=='pap'||deListe(a)||a.campagne!==campDefaut())continue;if(a.statut==='faite'&&!cetteSem(a.faite_le))continue;
 const k=a.etapes.findIndex(e=>e.lieu.id===id&&stE(e)==='afaire');if(k>=0)return {aid:a.id,k};}return null;}
function noterSemaine(i,st){const id=AID(i),now=isoD(new Date()),pv=PREV[id]||etapeSemaine(id);
 if(pv){const a=actPar(pv.aid);if(a&&a.etapes[pv.k]&&a.etapes[pv.k].lieu.id===id){setE(a,pv.k,{st});return;}}
 const a=actionSemaine(),k=a.etapes.findIndex(e=>e.lieu.id===id);
 if(k>=0)Object.assign(a.etapes[k],{st,le:now,acc:''});else a.etapes.push(Object.assign(etapeAdr(i),{st,le:now}));
 saisie(a,'adresse '+id);sauverA();dessinerParcours();}
const ajouterPassage=i=>noterSemaine(i,'faite');
const marquerFerme=i=>noterSemaine(i,'ferme');
function oterEtape(a,k,id){if(deListe(a)){a.etapes.splice(k,1);saisie(a,'adresse retirée : '+id);if(!a.etapes.length)ACTIONS.splice(ACTIONS.indexOf(a),1);sauverA();}else setE(a,k,{st:''});dessinerParcours();}
function retirerPassage(i){const id=AID(i),p=(PASS[id]||[])[0];if(!p)return false;const a=actPar(p.aid),e=a&&a.etapes[p.k];
 if(!a||!e||e.toquees>0||!cetteSem(p.q))return false;oterEtape(a,p.k,id);return true;}
function retirerFerme(i){const id=AID(i),f=FER[id];if(!f||!cetteSem(f.q))return false;const a=actPar(f.aid);if(!a||!a.etapes[f.k])return false;oterEtape(a,f.k,id);return true;}

/* ---- pieds d'immeuble : validés comme une adresse (un passage par semaine), gardés en actions « pied d'immeuble » */
const passPied=nom=>ACTIONS.filter(a=>a.type==='diff_pied'&&a.statut==='faite'&&a.campagne===campDefaut()&&a.etapes[0]&&a.etapes[0].lieu.id===nom).sort((x,y)=>String(y.faite_le).localeCompare(String(x.faite_le)));
function etatPied(s){const l=passPied(s.nom),sem=l.length&&cetteSem(l[0].faite_le);
 return {l,k:sem?'f':l.length?'p':'v',t:sem?(l.length>1?pl(l.length,'passage'):''):l.length?`<span class="g">fait ${relSem(l[0].faite_le)}</span>`:''};}
function lignePied(j){const s=D.pieds[j],e=etatPied(s);
 return `<div class="lr">${e.l.length?avH('ok',e.l.length>1?e.l.length:I.check):avH('pd',I.pied)}<button class="tx" data-pt="${j}"><b>${esc(s.nom)}</b><small>${n0(s.ins)} inscrits${e.t?' · '+e.t:''}</small></button>${pillH(e.k,`data-pv="${j}"`)}</div>`;}
function validerPied(j){const s=D.pieds[j],now=isoD(new Date());
 const x=nouvelleAction('diff_pied',{statut:'faite',faite_le:now,nb:0,tracts:0,origine:{lot:'liste'},etapes:[{lieu:{t:'secteur',id:s.nom},portes:0,toquees:0,ouvertes:0,st:'faite',acc:'',boites:0,le:now}]});
 x.nom=`Pied d'immeuble ${s.nom}`;ACTIONS.push(x);saisie(x,'validé depuis la liste');sauverA();return x;}
function retirerPied(j){const x=passPied(D.pieds[j].nom)[0];if(!x||!cetteSem(x.faite_le)||!deListe(x))return false;ACTIONS.splice(ACTIONS.indexOf(x),1);sauverA();return true;}
function basculerPied(j){const s=D.pieds[j],e=etatPied(s);
 if(e.k==='f'){if(!retirerPied(j)){ouvrirPied(s);return;}vibrer();rafr();toast(s.nom+' : passage retiré',{t:'Annuler',fn:()=>{validerPied(j);rafr();}});return;}
 const x=validerPied(j);vibrer();rafr();toast(s.nom+(e.l.length?' : un passage de plus':' : fait'),{t:'Annuler',fn:()=>{const k=ACTIONS.indexOf(x);if(k>=0){ACTIONS.splice(k,1);sauverA();}rafr();}});}
/* fiche d'un pied d'immeuble : la même ligne « Cette semaine » qu'une adresse */
function semPiedHTML(j){const s=D.pieds[j],e=etatPied(s),x=e.l[0];
 let h=`<div class="sem"><div><b>Cette semaine</b>${e.k==='f'?`<small>Validé${x&&x.cree_par?' par '+(x.cree_par===moi().id?'toi':esc(userNom(x.cree_par))):''}</small>`:''}</div>${pillH(e.k,'id="pdv"')}</div>`;
 if(e.l.length)h+=`<div class="h3">Passages pendant la campagne</div>`+e.l.slice(0,6).map(a=>`<div class="tl"><i></i><div><b>${esc(semLong(a.faite_le))}</b><span>${deListe(a)?'Validé depuis la liste':`${n0(a.tracts)} tracts`}${a.ga&&a.ga.length?' · '+esc(a.ga.map(gaNom).join(', ')):''}</span></div></div>`).join('');
 return h;}

/* ---- fiche d'une adresse : état, « Cette semaine », passages */
function puceEtatHTML(i){const a=D.adresses[i],id=a[2],s=statutA(id),ps=PASS[id]||[];let h='';
 if(s==='fait')h+=`<span class="pc ok"><i></i>Faite · ${pl(ps.length,'passage')}</span>`;
 else if(s==='ferme')h+=`<span class="pc ko"><i></i>Pas pu entrer ${relSem(FER[id].q)}</span>`;
 else if(s==='prevu'){const p=actPar(PREV[id].aid);h+=`<span class="pc pv"><i></i>Prévue${p&&p.prevue?' le '+fmtJ(p.prevue):' dans un PAP'}</span>`;}
 else h+=`<span class="pc af"><i></i>À faire</span>`;
 h+=isPr(a)?`<span class="pc t">Prioritaire</span>`:`<span class="pc n">Non prioritaire</span>`;
 return `<div class="pcs">${h}</div>`;}
function semaineHTML(i){const id=AID(i),ps=PASS[id]||[],f=FER[id],semP=ps.length&&cetteSem(ps[0].q),semF=!semP&&f&&cetteSem(f.q)&&statutA(id)==='ferme';
 let sub='',right;
 if(semP){const a=actPar(ps[0].aid),q=parQui(a,id);sub=deListe(a)||!a?`Validée${q?' par '+esc(q):''}`:'Faite : '+esc(a.nom);right=pillH('f','id="adp"');}
 else if(semF){sub='Noté : pas pu entrer';right=pillH('kf','id="adk"');}
 else right=pillH(ps.length?'p':'v','id="adp"')+pillH('k','id="adk"');
 return `<div class="sem"><div><b>Cette semaine</b>${sub?`<small>${sub}</small>`:''}</div><div class="ps2">${right}</div></div>`;}
function lierSemaine(i){const id=AID(i),ap=$('adp'),ak=$('adk');
 if(ap)ap.onclick=()=>{const ps=PASS[id]||[];if(ps.length&&cetteSem(ps[0].q)){if(!retirerPassage(i)){toast('Passage noté pendant le PAP : à modifier dans l\'action.');return;}vibrer();render(true);toast(id+' : passage retiré',{t:'Annuler',fn:()=>{ajouterPassage(i);rafr();}});return;}
  ajouterPassage(i);vibrer();render(true);toast(id+(ps.length?' : un passage de plus':' : faite'),{t:'Annuler',fn:()=>{retirerPassage(i);rafr();}});};
 if(ak)ak.onclick=()=>{const f=FER[id];if(f&&cetteSem(f.q)&&statutA(id)==='ferme'){retirerFerme(i);vibrer();render(true);return;}
  marquerFerme(i);vibrer();render(true);toast(id+' : pas pu entrer',{t:'Annuler',fn:()=>{retirerFerme(i);rafr();}});};}
function passagesHTML(id){const ps=PASS[id]||[];if(!ps.length)return '';
 return `<div class="h3">Passages pendant la campagne</div>`+ps.slice(0,6).map(p=>{const a=actPar(p.aid),g=(p.ga||[]).map(gaNom).join(', '),q=parQui(a,id);
  const t=deListe(a)?`Validée depuis la liste${q?', par '+esc(q):''}`:`${esc(a?a.nom:'PAP')}${g?' · '+esc(g):''}${p.t?` · ${pl(p.t,'toquée')}, ${pl(p.o,'ouverte')}`:''}`;
  return `<div class="tl"><i></i><div><b>${esc(semLong(p.q))}</b><span>${t}</span></div></div>`;}).join('')+(ps.length>6?`<div class="hs">et ${pl(ps.length-6,'passage')} plus ancien${ps.length-6>1?'s':''}</div>`:'');}

/* ---- pastille de l'onglet Liste : PAP dont la date est passée, pas encore tout validés */
function majBadge(){const b=$('bdgL');if(!b||!D)return;b.hidden=true;return;const auj=isoD(new Date()).slice(0,10);
 const n=ACTIONS.filter(a=>a.type==='pap'&&a.statut==='a_faire'&&!deListe(a)&&a.prevue&&a.prevue.slice(0,10)<=auj).length;b.textContent=n||'';b.hidden=!n;b.setAttribute('aria-label',n?pl(n,'PAP à valider'):'');}

/* ---------------- tractage : on coche qu'une équipe y va (arbitrage JL du 25/10/2026). Une action « équipe » par lieu,
   avec son GA et ses jours, dans le journal partagé ; décocher la supprime. Pas de validation pour les tractages. */
const eqDe=nom=>ACTIONS.find(a=>a.type==='equipe'&&a.etapes[0]&&a.etapes[0].lieu.id===nom);
const ordJ=l=>l.slice().sort((x,y)=>((x+6)%7)-((y+6)%7));
const eqTxt=a=>`${(a.ga||[]).map(gaNom).join(', ')||'Une équipe'}${a.jours&&a.jours.length?' · '+ordJ(a.jours).map(d=>JC[d]).join(', '):''}`;
const nomEq=a=>{const l=a.etapes[0].lieu;return l.t==='station'?'Métro '+l.id:l.id;};
function llLieu(l){let s=null;if(l.t==='station')s=D.metro.find(x=>x.nom===l.id);else if(l.t==='marche')s=D.marches.find(x=>x.nom===l.id);else if(l.t==='commerce')s=(D.supers||[]).find(x=>nomSup(x)===l.id);return s?[s.lat,s.lon]:null;}
function ouvrirLieuEq(t,id){if(t==='station'){const s=D.metro.find(x=>x.nom===id);if(s)ouvrirStation(s);}else if(t==='marche'){const s=D.marches.find(x=>x.nom===id);if(s)ouvrirMarche(s);}else{const s=(D.supers||[]).find(x=>nomSup(x)===id);if(s)ouvrirMagasin(s);}}
function equipeHTML(nom,jours){const a=eqDe(nom),G=gaActifs();
 let h=`<div class="eqr"><b>Une équipe y va</b><button class="tog" id="eqT" role="switch" aria-checked="${!!a}" aria-label="Une équipe y va"></button></div>`;
 if(a){h+=`<div class="lbl" style="margin-top:2px">Équipe</div><div class="chw">${G.map(g=>`<button class="ch${a.ga.includes(g.id)?' on':''}" data-eg="${g.id}" aria-pressed="${a.ga.includes(g.id)}">${esc(g.nom)}</button>`).join('')}</div>`;
  h+=`<div class="lbl">Jour</div><div class="chw">${jours.map(d=>`<button class="ch${(a.jours||[]).includes(d)?' on':''}" data-ej="${d}" aria-pressed="${(a.jours||[]).includes(d)}">${cap(JOURS[d])}</button>`).join('')}</div>`;}
 const aut=ACTIONS.filter(x=>x.type==='equipe'&&x!==a&&x.etapes[0]);
 if(aut.length)h+=`<div class="h3">Une équipe y va aussi</div>`+aut.map(x=>{const l=x.etapes[0].lieu;
  return `<div class="lr">${l.t==='station'?avH('mt','M'):l.t==='marche'?avH('ma',I.basket):avH('su',I.cart)}<button class="tx" data-eo="${esc(l.t)}|${esc(l.id)}"><b>${esc(nomEq(x))}</b><small>${esc(eqTxt(x))}</small></button><span></span></div>`;}).join('');
 return h;}
function lierEquipe(nom,t){const tg=$('eqT');if(!tg)return;
 tg.onclick=()=>{const a=eqDe(nom);
  if(a){const k=ACTIONS.indexOf(a);ACTIONS.splice(k,1);sauverA();render(true);toast('Plus d\'équipe : '+nom,{t:'Annuler',fn:()=>{ACTIONS.splice(k,0,a);sauverA();render(true);}});return;}
  const g=gaDefaut()[0]||((gaActifs()[0]||{}).id);
  const x=nouvelleAction('equipe',{nom:'Équipe · '+nom,ga:g?[g]:[],jours:[],etapes:[{lieu:{t,id:nom},portes:0,toquees:0,ouvertes:0,st:'',acc:'',boites:0,le:isoD(new Date())}]});
  ACTIONS.push(x);saisie(x,'une équipe y va');sauverA();vibrer();render(true);};
 body.querySelectorAll('[data-eg]').forEach(b=>b.onclick=()=>{const a=eqDe(nom);if(!a)return;a.ga=[b.dataset.eg];LS.set('dga',a.ga);saisie(a,'équipe');sauverA();render(true);});
 body.querySelectorAll('[data-ej]').forEach(b=>b.onclick=()=>{const a=eqDe(nom);if(!a)return;const d=+b.dataset.ej;a.jours=a.jours||[];const k=a.jours.indexOf(d);if(k>=0)a.jours.splice(k,1);else a.jours.push(d);saisie(a,'jours');sauverA();render(true);});
 body.querySelectorAll('[data-eo]').forEach(b=>b.onclick=()=>{const [t2,id]=b.dataset.eo.split('|');ouvrirLieuEq(t2,id);});}
/* sur la carte du tractage : une étiquette sous chaque lieu où une équipe va */
var eqL=null;
function majEq(){if(!D||typeof L==='undefined')return;if(!eqL)eqL=L.layerGroup();eqL.clearLayers();
 if(mode!=='tractage'){if(map.hasLayer(eqL))map.removeLayer(eqL);return;}
 ACTIONS.filter(a=>a.type==='equipe'&&a.etapes[0]).forEach(a=>{const ll=llLieu(a.etapes[0].lieu);if(!ll)return;
  L.marker(ll,{pane:'lieux',interactive:false,icon:L.divIcon({className:'',iconSize:[0,0],html:`<div class="eqtag">${esc(eqTxt(a))}</div>`})}).addTo(eqL);});
 if(!map.hasLayer(eqL))eqL.addTo(map);}

/* ---------------- PAP conseillés (25/10/2026) : sans qu'on dise où. On part de chaque adresse prioritaire libre, on bâtit le
   PAP comme « PAP autour de cette adresse » (adresses proches, taille choisie), on garde le plus efficace, on retire ses adresses,
   on recommence. Efficace = le plus d'inscrits prioritaires pas encore vus pour le moins de marche : inscrits x score / (marche
   + 40 m par adresse). Libre = prioritaire, pas faite depuis le délai, pas « pas pu entrer » récemment, pas déjà dans un PAP à
   faire. Recalculé à chaque validation. Pas de nombre minimum d'adresses (arbitrage JL du 25/10/2026). */
var CONS=null,CONS_K='',CSEL=0,VERS=0,consL=null,CLOTS=null;
function xyCirco(){if(D._xy)return D._xy;const la0=D.adresses.reduce((s,a)=>s+a[1],0)/D.adresses.length,kx=111320*Math.cos(la0*Math.PI/180),ky=110540,lo0=D.adresses[0][0];
 D._xy=D.adresses.map(a=>[(a[0]-lo0)*kx,(a[1]-la0)*ky]);return D._xy;}
function conseilles(){const cible=taille,cle=[VERS,crit.score,crit.ins,crit.ni,cible,D.k].join('|');if(CONS&&CONS_K===cle)return CONS;
 const A=D.adresses,P=xyCirco(),n=A.length,ok=new Uint8Array(n),CEL=400,grid=new Map(),cl=(x,y)=>Math.floor(x/CEL)+','+Math.floor(y/CEL);
 for(let i=0;i<n;i++){const a=A[i];if(isPr(a)&&!recente(i)&&!pasEntreRecent(i)&&!PREV[a[2]]){ok[i]=1;const k=cl(P[i][0],P[i][1]);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i);}}
 const d=(i,j)=>Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1]);
 const pres=i=>{const cx=Math.floor(P[i][0]/CEL),cy=Math.floor(P[i][1]/CEL),o=[];for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++){const g=grid.get(x+','+y);if(g)for(const j of g)if(ok[j])o.push(j);}return o;};
 const lot=i0=>{const out=[i0],pris=new Set(out);let s=A[i0][3],km=0,cur=i0;
  while(s<cible*.9){const reste=cible-s;let bi=-1,bv=-1,bd=0;const V=pres(cur);
   for(const lim of [250,400]){for(const j of V){if(pris.has(j))continue;const a=A[j];if(a[3]>Math.max(reste*1.5,12))continue;const dd=d(cur,j);if(dd>lim)continue;const v=a[3]*(a[5]/100)/(dd+40);if(v>bv){bv=v;bi=j;bd=dd;}}if(bi>=0)break;}
   if(bi<0)break;out.push(bi);pris.add(bi);s+=A[bi][3];km+=bd;cur=bi;}
  return {ids:out,ins:s,km};};
 const res=[],memo=new Array(n);
 /* adresses de départ : toutes pour un petit PAP ; au-delà de 150 inscrits, la meilleure de chaque carré de 150 m (calcul
    plus court ; un grand PAP couvre de toute façon plusieurs carrés) */
 let SEM=[];if(cible<=150){for(let i=0;i<n;i++)if(ok[i])SEM.push(i);}
 else{const bc=new Map();for(let i=0;i<n;i++){if(!ok[i])continue;const k=Math.floor(P[i][0]/150)+','+Math.floor(P[i][1]/150),v=A[i][3]*A[i][5];const b=bc.get(k);if(!b||v>b[1])bc.set(k,[i,v]);}SEM=[...bc.values()].map(x=>x[0]);}
 /* un lot ne change que si une de ses adresses est retirée : retirer une adresse qu'il n'a pas prise ne change pas ses choix */
 while(res.length<6){let best=null;
  for(const i of SEM){if(!ok[i]||A[i][3]>cible*1.5)continue;let r=memo[i];
   if(!r||r.ids.some(j=>!ok[j])){r=lot(i);r.e=r.ins<cible*.6?-1:r.ids.reduce((s,j)=>s+A[j][3]*A[j][5]/100,0)/(r.km+40*r.ids.length);memo[i]=r;}
   if(r.e>=0&&(!best||r.e>best.e))best=r;}
  if(!best)break;best=Object.assign({},best,{ids:best.ids.slice()});res.push(best);best.ids.forEach(j=>ok[j]=0);
  /* deux PAP conseillés ne se touchent pas : on écarte aussi les adresses à moins de 60 m */
  best.ids.forEach(j=>pres(j).forEach(k=>{if(d(j,k)<60)ok[k]=0;}));}
 res.forEach(z=>{const r={};z.ids.forEach(i=>{const v=ADRP[i].voie;(r[v]=r[v]||[]).push(i);});z.rue=Object.keys(r).sort((x,y)=>r[y].length-r[x].length)[0];
  z.nums=Object.entries(r).map(([v,ids])=>{const ns=ids.map(i=>D.adresses[i][2].slice(0,Math.max(0,D.adresses[i][2].length-v.length)).trim()||D.adresses[i][2]);return (ns.length>1?ns.slice(0,-1).join(', ')+' et '+ns[ns.length-1]:ns[0])+' '+v;}).join(' · ');});
 CONS=res;CONS_K=cle;if(CSEL>=res.length)CSEL=0;return res;}
function consLot(r){const z=conseilles()[r-1];return z?{ll:null,ids:z.ids.slice(),ins:z.ins,km:z.km,cible:taille,msg:'',rang:r,rue:z.rue}:null;}
function consHTML(){const C=conseilles();
 let h=`<div class="csh"><h1>PAP conseillés</h1></div>`;
 h+=`<div class="sub">${wide?'Les plus efficaces d\'abord : le plus d\'inscrits prioritaires pas encore vus, le moins de marche. Mis à jour à chaque validation.':'Les plus efficaces d\'abord'}</div>`;
 h+=tailleHTML('cTa','Taille');
 if(!C.length)return h+`<div class="empty">Aucune adresse prioritaire libre. Baissez les curseurs.</div>`;
 if(wide)return h+`<div style="margin-top:10px">`+C.map((z,k)=>`<div class="dk${k===CSEL?' on':''}" data-ck="${k}"><span class="rk">${k+1}</span><div><b>${esc(z.rue)}</b><small>${z.ins} inscrits · ${pl(z.ids.length,'adresse')}${z.ids.length>1?` · ${m10(z.km)} m de marche`:''}</small></div>${pillH(k===CSEL?'b':'p',`data-cs="${k}"`,'Choisir')}</div>`).join('')+`</div>`;
 return h+`<div class="car" id="car">${C.map((z,k)=>`<div class="cc${k===CSEL?' on':''}" data-ck="${k}"><div class="t"><span class="rk">${k+1}</span><b>${esc(z.rue)}</b></div><small>${esc(z.nums)}</small><div class="st"><span><b>${z.ins}</b>inscrits</span><span><b>${z.ids.length}</b>adresse${z.ids.length>1?'s':''}</span>${z.ids.length>1?`<span><b>${m10(z.km)} m</b>de marche</span>`:''}</div><button class="go" data-cs="${k}">Choisir ce PAP</button></div>`).join('')}</div><div class="dots" id="cdots">${C.map((z,k)=>`<i${k===CSEL?' class="on"':''}></i>`).join('')}</div>`;}
function lierCons(){const cb=$('cons');if(!cb)return;
 lierTaille('cTa',()=>{CSEL=0;majCons();});
 cb.onclick=ev=>{const s=ev.target.closest('[data-cs]');if(s){const k=+s.dataset.cs;preparer(null,'',null,null,null,{r:k+1});return;}
  const c=ev.target.closest('[data-ck]');if(c)choisirCons(+c.dataset.ck,false,true);};
 const car=$('car');if(car){let t=0;car.onscroll=()=>{clearTimeout(t);t=setTimeout(()=>{const w=car.firstElementChild?car.firstElementChild.offsetWidth+10:1,k=Math.max(0,Math.min(car.children.length-1,Math.round(car.scrollLeft/w)));if(k!==CSEL)choisirCons(k,false,false);},90);};}}
function majCons(){const cb=$('cons');if(!cb)return;cb.innerHTML=consHTML();lierCons();dessinerCons();}
/* choisir un PAP conseillé : il s'allume sur la carte et dans la liste ; touché sur la carte, la liste vient à lui */
function choisirCons(k,carte,voirC){CSEL=k;const car=$('car');
 body.querySelectorAll('[data-ck]').forEach(x=>x.classList.toggle('on',+x.dataset.ck===k));
 body.querySelectorAll('.dk .pill').forEach(x=>{const on=+x.dataset.cs===k;x.classList.toggle('b',on);x.classList.toggle('p',!on);});
 const dt=$('cdots');if(dt)[...dt.children].forEach((x,j)=>x.classList.toggle('on',j===k));
 if(carte&&car&&car.children[k])car.scrollTo({left:car.children[k].offsetLeft-18,behavior:'smooth'});
 dessinerCons();const z=(CONS||[])[k];if(z&&(carte||voirC))map.flyToBounds(L.latLngBounds(z.ids.map(ptA)).pad(.6),{...pad(),maxZoom:17,duration:.5});}
function dessinerCons(){if(!D||typeof L==='undefined')return;if(!consL)consL=L.layerGroup().addTo(map);consL.clearLayers();const v=stack[stack.length-1];
 if(ONG!=='pap'||mode!=='pap'||!v||v.id!=='base')return;const C=conseilles(),ac=tok('--accent');
 C.forEach((z,k)=>{const P=z.ids.map(ptA),c=[P.reduce((s,p)=>s+p[0],0)/P.length,P.reduce((s,p)=>s+p[1],0)/P.length],r=Math.max(...P.map(p=>dist(c,p)))+28,on=k===CSEL;
  L.circle(c,{renderer:rP,radius:r,color:ac,weight:on?1.6:1,opacity:on?.9:.45,fillColor:ac,fillOpacity:on?.16:.08,interactive:false}).addTo(consL);
  L.marker(c,{pane:'pap',zIndexOffset:on?1000:0,icon:L.divIcon({className:'',html:`<div class="cbad${on?' on':''}">${k+1}</div>`,iconSize:[26,26],iconAnchor:[13,13]})}).on('click',()=>choisirCons(k,true)).addTo(consL);});}
