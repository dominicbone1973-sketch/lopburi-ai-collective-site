'use strict';
/*
# Website behaviour
Handles section reveals, navigation, audience tabs, bilingual copy and contact drafts.
The hero follows native scrolling; preserve its approved media and device treatment.
The contact dialog records an optional preference in a reviewed email, not a live subscription.
Configuration changes may involve inline HTML, dictionaries and JSON references.
*/
document.documentElement.classList.add('js');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.section-label,.audience-tabs,.audience-panel').forEach(element=>element.classList.add('reveal'));
const reveals=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window&&!reduced.matches){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}})},{threshold:0,rootMargin:'0px 0px -24px 0px'});reveals.forEach(el=>observer.observe(el));}else{reveals.forEach(el=>el.classList.add('visible'));}
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
function closeMenu(){toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){closeMenu();toggle.focus()}});
const tabs=Array.from(document.querySelectorAll('[role="tab"]'));
let audienceAnimation=null;
function selectTab(tab,focus=false){
  const changed=tab.getAttribute('aria-selected')!=='true';
  audienceAnimation?.cancel();
  tabs.forEach(item=>{const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!selected;});
  const panel=document.getElementById(tab.getAttribute('aria-controls'));
  panel.classList.add('visible');
  if(changed&&!reduced.matches&&typeof panel.animate==='function')audienceAnimation=panel.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});
  if(focus)tab.focus();
}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();selectTab(tabs[next],true);});});
const dialog=document.querySelector('#brief-dialog');
// Both membership entry points open the same form and direct-submission handler.
document.querySelectorAll('#brief-button,[data-contact-open]').forEach(button=>{button.setAttribute('aria-haspopup','dialog');button.addEventListener('click',()=>{dialog.submissionOpener=button;dialog.showModal()})});
dialog.addEventListener('click',event=>{const rect=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))dialog.close();});

// A paused video follows native scrolling; no wheel or touch interception.
const heroVideo=document.querySelector('#hero-video');
const motionButton=document.querySelector('#hero-motion');
const sceneDialog=document.querySelector('#scene-dialog');
const fullScene=document.querySelector('#full-scene');
const journey=document.querySelector('.hero-journey');
const hero=document.querySelector('.hero');
const header=document.querySelector('.site-header');
const narrow=window.matchMedia('(max-width: 780px)');
const saveData=!!navigator.connection?.saveData;
let enabled=!reduced.matches&&!saveData,scheduled=false,targetTime=0,available=false;
if(narrow.matches)heroVideo.poster='assets/lopburi-ai-hero-v3-poster-mobile.webp';
motionButton.hidden=false;
function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
function seekLatest(){
  if(!enabled||!available||heroVideo.seeking||document.hidden)return;
  if(Math.abs(heroVideo.currentTime-targetTime)>1/30){
    try{heroVideo.currentTime=targetTime}catch{/* Keep the poster if seeking is not supported. */}
  }
}
function updateJourney(){
  scheduled=false;if(!enabled)return;
  const headerHeight=header.getBoundingClientRect().height;
  const rect=journey.getBoundingClientRect();
  const distance=Math.max(1,journey.offsetHeight-hero.offsetHeight);
  const progress=clamp((headerHeight-rect.top)/distance,0,1);
  // Finish just before release, leaving a short steady view of the room.
  const filmProgress=clamp(progress/.94,0,1);
  targetTime=filmProgress*Math.max(0,(heroVideo.duration||10)-.08);
  hero.style.setProperty('--copy-opacity',String(1-clamp((progress-.12)/.38,0,1)));
  hero.classList.toggle('journey-immersed',progress>=.5);
  updateHeroArrival(filmProgress, true);
  seekLatest();
}
function scheduleJourney(){if(!scheduled){scheduled=true;requestAnimationFrame(updateJourney)}}
function measureJourney(){
  journey.style.setProperty('--header-height',header.getBoundingClientRect().height+'px');
  scheduleJourney();
}
function configureJourney(){
  updateHeroArrival(0, enabled);
  journey.classList.toggle('is-scrubbing',enabled);
  motionButton.dataset.motionState=enabled?'still':'enable';
  motionButton.textContent=window.siteText?window.siteText(motionButton.dataset.motionState):(enabled?'Use still image':'Enable scroll journey');
  motionButton.setAttribute('aria-pressed',String(enabled));
  heroVideo.pause();
  if(enabled){
    heroVideo.preload='auto';
    if(!heroVideo.getAttribute('src')){
      heroVideo.src=narrow.matches?heroVideo.dataset.mobile:heroVideo.dataset.desktop;
      heroVideo.load();
    }
  }else{
    hero.style.setProperty('--copy-opacity','1');
    hero.classList.remove('journey-immersed');
  }
  measureJourney();
}
heroVideo.addEventListener('loadedmetadata',()=>{available=true;scheduleJourney()});
heroVideo.addEventListener('loadeddata',()=>{heroVideo.classList.add('ready');scheduleJourney()});
heroVideo.addEventListener('seeked',()=>{heroVideo.classList.add('ready');seekLatest()});
heroVideo.addEventListener('error',()=>{enabled=false;available=false;heroVideo.classList.remove('ready');configureJourney();motionButton.hidden=true});
motionButton.addEventListener('click',()=>{enabled=!enabled;configureJourney()});
window.addEventListener('scroll',scheduleJourney,{passive:true});
window.addEventListener('resize',measureJourney,{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleJourney()});
if('ResizeObserver' in window)new ResizeObserver(measureJourney).observe(header);
reduced.addEventListener('change',event=>{if(event.matches){enabled=false;configureJourney()}});
document.querySelector('#watch-scene').addEventListener('click',()=>{
  sceneDialog.showModal();
  if(!fullScene.getAttribute('src'))fullScene.src=fullScene.dataset.src;
  fullScene.currentTime=0;fullScene.play().catch(()=>{});
});
sceneDialog.addEventListener('close',()=>fullScene.pause());
configureJourney();

const siteTranslations=SITE_COMMON_COPY;
let siteLanguage='en';
const interfaceCopy={still:{en:'Use still image',th:'ใช้ภาพนิ่ง'},enable:{en:'Enable scroll journey',th:'เปิดการเลื่อนผ่านฉาก'},saved:{en:'Your browser has been asked to save the introduction. Nothing has been sent.',th:'เบราว์เซอร์จะบันทึกข้อความแนะนำตัว ไม่มีการส่งข้อมูลไปที่ใด'}};
window.siteText=key=>interfaceCopy[key]?.[siteLanguage]||key;
const attributeCopy=[
  ['.brand','aria-label','Lopburi AI Collective home','หน้าแรกชุมชน AI ลพบุรี'],
  ['#navigation','aria-label','Main navigation','เมนูหลัก'],
  ['.collective-line','aria-label','Perspectives the collective aims to connect','กลุ่มที่ชุมชนมุ่งเชื่อมโยง'],
  ['.audience-tabs','aria-label','Organisation perspectives','มุมมองขององค์กร'],
  ['#scene-dialog .dialog-head button','aria-label','Close scene','ปิดฉาก'],
  ['#brief-dialog .dialog-head button','aria-label','Close introduction template','ปิดข้อความแนะนำตัว'],
  ['#full-scene','aria-label','A silent journey through the Lopburi AI Collective pavilion','ภาพเคลื่อนไหวไม่มีเสียงพาชมพื้นที่ชุมชน AI ลพบุรี']
];
function setSiteLanguage(language,persist=true){
  if(!['en','th'].includes(language))return;
  const previous=siteLanguage;siteLanguage=language;
  document.documentElement.lang=language;
  document.querySelectorAll('[data-i18n]').forEach(element=>{const value=siteTranslations[element.dataset.i18n]?.[language];if(value!==undefined)element.innerHTML=value});
  document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
  attributeCopy.forEach(([selector,attribute,en,th])=>document.querySelector(selector)?.setAttribute(attribute,language==='th'?th:en));
  SiteUI.sync(language);
  document.title=language==='th'?'ชุมชน AI ลพบุรี — แนวคิดเว็บไซต์':'Lopburi AI Collective — Website concept';
  document.querySelector('meta[name="description"]').content=language==='th'?'แนวคิดชุมชน AI ลพบุรี เชื่อมธุรกิจ ภาครัฐ และประสบการณ์ใช้งาน AI ในท้องถิ่น':'A working concept for Lopburi AI Collective: a local community connecting business, public service and practical AI experience.';
  if(window.refreshContactCard)window.refreshContactCard();
  if(window.refreshNori)window.refreshNori();
  if(window.refreshEventLoopLabels)window.refreshEventLoopLabels();
  motionButton.textContent=window.siteText(motionButton.dataset.motionState||'still');

  if(persist){try{localStorage.setItem('lopburi-language',language)}catch{}}
  document.fonts?.ready.then(measureJourney);
  measureJourney();
}
document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>setSiteLanguage(button.dataset.language)));
let preferredLanguage=SiteUI.initialLanguage();
setSiteLanguage(preferredLanguage,false);

// Progress is retained so returning to earlier content keeps it readable.
const approachSteps=Array.from(document.querySelectorAll('.journey>li'));
let contentMotionFrame=false;
function updateApproachMotion(){
  contentMotionFrame=false;
  const activationLine=window.innerHeight*.72;
  approachSteps.forEach((step,index)=>{
    const top=step.getBoundingClientRect().top+24;
    if(reduced.matches||top<=activationLine)step.classList.add('step-active');
    if(index<approachSteps.length-1){
      const nextTop=approachSteps[index+1].getBoundingClientRect().top+24;
      const progress=reduced.matches?1:clamp((activationLine-top)/Math.max(1,nextTop-top),0,1);
      const retained=Math.max(Number(step.dataset.lineProgress||0),progress);
      step.dataset.lineProgress=String(retained);
      step.style.setProperty('--step-progress',String(retained));
    }
  });
}
function scheduleContentMotion(){if(!contentMotionFrame){contentMotionFrame=true;requestAnimationFrame(updateApproachMotion)}}
window.addEventListener('scroll',scheduleContentMotion,{passive:true});
window.addEventListener('resize',scheduleContentMotion,{passive:true});
reduced.addEventListener('change',event=>{
  if(event.matches){
    document.querySelectorAll('.reveal').forEach(element=>element.classList.add('visible'));
    audienceAnimation?.cancel();
  }
  scheduleContentMotion();
});
document.addEventListener('focusin',event=>{
  const reveal=event.target.closest('.reveal');if(reveal)reveal.classList.add('visible');
});
scheduleContentMotion();

// Direct submission is bound by contact-flows.js for all three journeys.
// Event animations load only when visible and appropriate for the device.
const eventLoopMedia = matchMedia('(max-width:780px)');
const eventLoopReduced = matchMedia('(prefers-reduced-motion: reduce)');
const eventLoopItems = [...document.querySelectorAll('.event-media')].map(media => ({media, video:media.querySelector('video'), button:media.querySelector('button'), visible:false, paused:false}));
function eventLoopsAllowed(){return !eventLoopMedia.matches && !eventLoopReduced.matches && !navigator.connection?.saveData}
function eventLoopLabel(item){
  const paused=item.paused;
  item.button.textContent=paused?'▷':'Ⅱ';
  item.button.setAttribute('aria-label',siteLanguage==='th'?(paused?'เล่นภาพเคลื่อนไหว':'หยุดภาพเคลื่อนไหวชั่วคราว'):(paused?'Play animation':'Pause animation'));
}
window.refreshEventLoopLabels=()=>eventLoopItems.forEach(eventLoopLabel);
function updateEventLoop(item){
  const allowed=eventLoopsAllowed();
  item.button.hidden=!allowed;
  eventLoopLabel(item);
  if(!allowed){item.video.pause();item.media.classList.remove('is-playing');return}
  if(!item.visible || document.hidden || item.paused){item.video.pause();return}
  if(!item.video.getAttribute('src')){item.video.src=item.video.dataset.loopSrc;item.video.load()}
  const playing=item.video.play();
  playing?.then(()=>{if(eventLoopsAllowed() && item.visible && !document.hidden && !item.paused)item.media.classList.add('is-playing');else item.video.pause()}).catch(()=>{item.media.classList.remove('is-playing')});
}
const eventLoopObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{const item=eventLoopItems.find(item=>item.media===entry.target);item.visible=entry.isIntersecting;updateEventLoop(item)});
},{threshold:.15});
eventLoopItems.forEach(item=>{
  item.button.addEventListener('click',()=>{item.paused=!item.paused;updateEventLoop(item)});
  item.video.addEventListener('error',()=>{item.media.classList.remove('is-playing');item.button.hidden=true});
  eventLoopObserver.observe(item.media);
});
function refreshEventLoops(){eventLoopItems.forEach(updateEventLoop)}
eventLoopMedia.addEventListener('change',refreshEventLoops);
eventLoopReduced.addEventListener('change',refreshEventLoops);
navigator.connection?.addEventListener('change',refreshEventLoops);
document.addEventListener('visibilitychange',refreshEventLoops);
refreshEventLoops();

// Empty destinations remain ordinary cards. Add an approved URL to enable a card.
const participationLinks=JSON.parse(document.getElementById('participation-links')?.textContent || '{}');
document.querySelectorAll('[data-participation]').forEach(card=>{
 const destination=participationLinks[card.dataset.participation]?.trim();
 if(!destination || !/^(https?:\/\/|#[A-Za-z][\w-]*$)/.test(destination))return;
 const link=document.createElement('a');link.className=card.className;link.href=destination;
 while(card.firstChild)link.appendChild(card.firstChild);
 const arrow=document.createElement('span');arrow.className='participation-link-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';link.appendChild(arrow);card.replaceWith(link);
});

// Arrival invitation follows the final two seconds of the scroll journey.
function updateHeroArrival(filmProgress, moving){
 const arrival=document.querySelector('.hero-arrival');
 if(!arrival)return;
 const opacity=moving?Math.max(0,Math.min(1,(filmProgress-.8)/.1)):1;
 arrival.hidden=moving && opacity===0;
 arrival.style.setProperty('--arrival-opacity',String(opacity));
 arrival.inert=moving && opacity<.5;
}
updateHeroArrival(0,enabled);

// Facebook remains non-interactive until an approved URL is configured.
(()=>{const config=document.getElementById('contact-social-links');if(!config)return;const url=JSON.parse(config.textContent).facebookUrl;if(!/^https:\/\//.test(url))return;document.querySelectorAll('[data-facebook-card]').forEach(card=>{const a=document.createElement('a');a.className=card.className;a.href=url;a.setAttribute('aria-label','Lopburi AI Collective on Facebook');while(card.firstChild)a.appendChild(card.firstChild);a.querySelector('small').remove();card.replaceWith(a)})})();

// Visible navigation section and event-interest drafts.
(()=>{
 const links=[...document.querySelectorAll('#navigation a')];
 const sections=links.filter(a=>a.getAttribute('href').startsWith('#')).map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
 let queued=false;
 function update(){queued=false;const boundary=document.querySelector('.site-header').getBoundingClientRect().height+window.innerHeight*.24;let current=null;for(const section of [...sections].sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top)){if(section.getBoundingClientRect().top<=boundary)current=section.id}links.forEach(a=>{if(a.getAttribute('href')==='#'+current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}
 function queue(){if(!queued){queued=true;requestAnimationFrame(update)}}
 window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue,{passive:true});queue();

})();
