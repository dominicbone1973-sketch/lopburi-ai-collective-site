'use strict';
// Uses the same explicit language preference as the main site; no analytics.
(()=>{
 function setLanguage(lang){
  if(!['en','th'].includes(lang))return;
  document.documentElement.lang=lang;
  document.querySelectorAll('article[lang],.privacy-draft [lang]').forEach(el=>el.hidden=el.lang!==lang);
  document.querySelectorAll('[data-privacy-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.privacyLanguage===lang)));
  document.title=(lang==='th'?'ความเป็นส่วนตัวและการรับข่าวสาร':'Privacy and email preferences')+' — Lopburi AI Collective';
  SiteUI.sync(lang);
  document.querySelector('meta[name="description"]').content=SiteUI.text('privacyMeta',lang);
  try{localStorage.setItem('lopburi-language',lang)}catch{}
 }
 let lang=SiteUI.initialLanguage();
 document.querySelectorAll('[data-privacy-language]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.privacyLanguage)));
 setLanguage(['en','th'].includes(lang)?lang:'en');
})();
