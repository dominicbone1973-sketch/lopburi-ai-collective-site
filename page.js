'use strict';
/* Static activity page: shared language preference, responsive navigation and
 * contact-flows.js for event-interest/enquiry drafts. No booking or mailing-list submission. */
const siteTranslations=SITE_COMMON_COPY;
let siteLanguage='en';
function setSiteLanguage(lang,persist=true){
 if(!['en','th'].includes(lang))return;
 siteLanguage=lang;document.documentElement.lang=lang;
 document.querySelectorAll('[data-i18n]').forEach(el=>{const text=siteTranslations[el.dataset.i18n]?.[lang];if(text!==undefined)el.innerHTML=text});
 document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===lang)));
 document.title=(siteTranslations[document.body.dataset.pageTitleKey||'eventsPageTitle']?.[lang]||'Lopburi AI Collective')+' — Lopburi AI Collective';
 SiteUI.sync(lang);
 const description=document.querySelector('meta[name="description"]');
 if(description)description.content=SiteUI.text(document.body.dataset.pageTitleKey==='resourcesPageTitle'?'resourcesMeta':'eventsMeta',lang);
 if(persist){try{localStorage.setItem('lopburi-language',lang)}catch{}}
 window.refreshContactCard?.();
 window.refreshNori?.();
}
const menu=document.querySelector('.menu-toggle'),navigation=document.querySelector('#navigation');
function closeEventsMenu(){menu.setAttribute('aria-expanded','false');navigation.classList.remove('open')}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));navigation.classList.toggle('open',open)});
navigation.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeEventsMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navigation.classList.contains('open')){closeEventsMenu();menu.focus()}});
document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>setSiteLanguage(b.dataset.language)));
let preferred=SiteUI.initialLanguage();
setSiteLanguage(['en','th'].includes(preferred)?preferred:'en',false);
