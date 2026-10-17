'use strict';
/* Shared direct submission. Public GitHub Pages uses the hosted Google receipt
 * bridge; local review uses its local API. Never fall back to an email app. */
(()=>{
 const hosted=(location.origin==='https://dominicbone1973-sketch.github.io'&&location.pathname.startsWith('/lopburi-ai-collective-site/'))||new URLSearchParams(location.search).get('submission')==='hosted';
 const hostedEndpoint='https://script.google.com/macros/s/AKfycbzb8l7LnmJaq3KtmLDquOc3hooU0p_n2-rYE8QaVmGxmaTAyqKWX8c5Gcp5GZWs5uYEDw/exec';
 // Apps Script's sandboxed receipt bridge avoids opaque no-cors success claims.
 // Bind replies to a random channel, Google's frame origin and the ready sender.
 function submitHosted(data,signal){return new Promise((resolve,reject)=>{
  const channel=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join(''),iframe=document.createElement('iframe');let sender=null,senderOrigin='';
  iframe.hidden=true;iframe.title='Submission receipt';iframe.referrerPolicy='no-referrer';
  const cleanup=()=>{window.removeEventListener('message',receive);signal.removeEventListener('abort',abort);iframe.remove();};
  const abort=()=>{cleanup();reject(Error('Submission timed out'));};
  const googleOrigin=origin=>{try{const u=new URL(origin);return u.protocol==='https:'&&(u.hostname==='script.googleusercontent.com'||u.hostname.endsWith('-script.googleusercontent.com'));}catch{return false;}};
  function receive(e){if(!googleOrigin(e.origin)||!e.data||e.data.channel!==channel)return;
   if(e.data.type==='lac-form-ready'&&!sender){sender=e.source;senderOrigin=e.origin;sender.postMessage({type:'lac-form-submit',channel,data},senderOrigin);}
   else if(e.data.type==='lac-form-result'&&sender===e.source&&senderOrigin===e.origin){cleanup();resolve(e.data.result);}
  }
  window.addEventListener('message',receive);signal.addEventListener('abort',abort,{once:true});
  iframe.src=hostedEndpoint+'?action=website-form-bridge&origin='+encodeURIComponent(location.origin)+'&channel='+channel;document.body.append(iframe);
 });}
 const modal=document.querySelector('#enquiry-dialog'),form=document.querySelector('#enquiry-form');
 let activityCard=null,proposal=false;
 const val=id=>document.getElementById(id).value.trim();
 function mode(){
  const keys={enquiryHeading:'activityHeading',enquiryIntro:'activityIntro',enquirySubject:'activitySubject',enquiryMessage:'activityMessage',enquiryNote:'activityNote',enquiryPrepare:'activityPrepare'};
  for(const [general,activity] of Object.entries(keys)){
   const el=modal.querySelector('[data-i18n="'+general+'"],[data-i18n="'+activity+'"],[data-i18n="'+general.replace('enquiry','proposal')+'"]');
   const key=proposal?general.replace('enquiry','proposal'):activityCard?activity:general;el.dataset.i18n=key;el.textContent=SiteUI.text(key,siteLanguage);
  }
 }
 const receipt=document.createElement('div');receipt.id='submission-receipt';receipt.className='submission-receipt';receipt.hidden=true;receipt.tabIndex=-1;receipt.setAttribute('role','status');receipt.setAttribute('aria-live','polite');document.body.append(receipt);
 // A previous receipt must not cover the next conversation or form controls.
 document.addEventListener('nori:open',()=>{receipt.hidden=true});
 document.querySelectorAll('#brief-button,[data-contact-open]').forEach(b=>b.addEventListener('click',()=>{receipt.hidden=true}));
 const previous=window.refreshContactCard;
 window.refreshContactCard=()=>{previous?.();mode();SiteUI.sync(siteLanguage)};
 function open(e,card){e.preventDefault();receipt.hidden=true;modal.submissionOpener=e.currentTarget;const was=proposal?'proposal':activityCard?'activity':'enquiry',next=e.currentTarget.hasAttribute('data-activity-proposal')?'proposal':card?'activity':'enquiry';
  if(was!==next||activityCard&&card&&activityCard!==card){document.querySelector('#enquiry-subject').value='';document.querySelector('#enquiry-message').value='';}
  activityCard=card||null;proposal=next==='proposal';mode();document.querySelector('#enquiry-status').textContent='';
  if(card){document.querySelector('#enquiry-subject').value=card.querySelector('[data-activity-title],h4').textContent.trim();if(!document.querySelector('#enquiry-message').value)document.querySelector('#enquiry-message').value=SiteUI.text('activityInterestMessage',siteLanguage);}
  else if(proposal){if(!document.querySelector('#enquiry-subject').value)document.querySelector('#enquiry-subject').value=SiteUI.text('proposalDefaultSubject',siteLanguage);document.querySelector('#enquiry-message').placeholder=SiteUI.text('proposalPlaceholder',siteLanguage);}
  if(!proposal)document.querySelector('#enquiry-message').placeholder='';
  modal.showModal();
 }
 document.querySelectorAll('[data-enquiry-open]').forEach(a=>a.addEventListener('click',e=>open(e)));
 document.querySelectorAll('[data-event-interest]').forEach(a=>{a.setAttribute('aria-haspopup','dialog');a.addEventListener('click',e=>open(e,a.closest('.event-card')))});
 modal.addEventListener('click',e=>{const r=modal.getBoundingClientRect();if(e.target===modal&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))modal.close()});
 const member=document.querySelector('#contact-form');
 // An idempotency key survives an uncertain response; changed fields get a new key.
 function bind(f,dialog,status,payload){let busy=false,previousBody='',requestId='';
  const trap=document.createElement('input');trap.name='website';trap.type='text';trap.autocomplete='off';trap.tabIndex=-1;trap.setAttribute('aria-hidden','true');trap.style.display='none';f.append(trap);
  f.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;
   for(const input of f.querySelectorAll('input:not([type=checkbox]),textarea'))input.value=input.value.trim();
   if(!f.reportValidity())return;
   const data=payload(),body=JSON.stringify(data),lang=siteLanguage;
   if(body!==previousBody){requestId=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');previousBody=body;}
   busy=true;receipt.hidden=true;status.textContent=SiteUI.text('submitting',lang);f.setAttribute('aria-busy','true');
   const controls=[...f.elements],disabled=controls.map(c=>c.disabled);controls.forEach(c=>c.disabled=true);
   const timeout=new AbortController(),timer=setTimeout(()=>timeout.abort(),60000);
   try{
    if(!['http:','https:'].includes(location.protocol))throw Error('Use the local HTTP preview');
    let response={ok:true},result;
    if(hosted)result=await submitHosted({...data,requestId,website:trap.value},timeout.signal);
    else{response=await fetch('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,requestId}),signal:timeout.signal});result=await response.json();}
    if(result?.accepted===false&&['DAILY_LIMIT','WAIT_BEFORE_RETRY','SERVICE_BUSY'].includes(result.code))throw Object.assign(Error('Submission held'),{code:result.code});
    const alreadyRegistered=data.kind==='member'&&result?.outcome==='already_registered';
    if(!result||!response.ok||result.accepted!==true||!['local-test','owner-email-test','hosted'].includes(result.mode)||result.requestId!==requestId||(!alreadyRegistered&&!result.receiptId))throw Error('No confirmed receipt');
    dialog.close();f.reset();status.textContent='';previousBody='';requestId='';activityCard=null;proposal=false;mode();
    receipt.replaceChildren();const text=document.createElement('span');text.textContent=SiteUI.text(alreadyRegistered?'alreadyRegistered':'localThanks',lang);const close=document.createElement('button');close.type='button';close.className='receipt-close';close.textContent='×';close.setAttribute('aria-label',lang==='th'?'ปิดข้อความ':'Close message');close.addEventListener('click',()=>{receipt.hidden=true;const trigger=dialog.submissionOpener||document.querySelector(data.kind==='member'?'#brief-button':'[data-enquiry-open], [data-event-interest]');trigger?.focus({preventScroll:true});});receipt.append(text,close);receipt.hidden=false;receipt.focus({preventScroll:true});
   }catch(error){const key={DAILY_LIMIT:'submitDailyLimit',WAIT_BEFORE_RETRY:'submitWait',SERVICE_BUSY:'submitServiceBusy'}[error.code]||'submitFailed';status.textContent=SiteUI.text(key,lang);status.tabIndex=-1;status.focus();}
   finally{clearTimeout(timer);busy=false;f.removeAttribute('aria-busy');controls.forEach((c,i)=>c.disabled=disabled[i]);}
  });
 }
 bind(form,modal,document.querySelector('#enquiry-status'),()=>({kind:activityCard?'activity':'enquiry',language:siteLanguage,name:val('enquiry-name'),email:val('enquiry-email'),subject:val('enquiry-subject'),message:val('enquiry-message'),activityId:activityCard?.dataset.activityId||activityCard?.id||'',updates:false}));
 if(member)bind(member,document.querySelector('#brief-dialog'),document.querySelector('#brief-status'),()=>({kind:'member',language:siteLanguage,name:val('contact-name'),email:val('contact-email'),organisation:val('contact-organisation'),message:val('brief-text'),updates:document.querySelector('#contact-updates').checked,consentVersion:'2026-10-12-v1',consentWording:SiteUI.text('updatesOptIn',siteLanguage)}));
 if(!hosted)for(const f of [form,member].filter(Boolean)){const note=document.createElement('p');note.className='contact-local-note';note.dataset.i18n='localTestNote';note.textContent=SiteUI.text('localTestNote',siteLanguage);f.prepend(note);}
 setSiteLanguage(siteLanguage,false);
})();
