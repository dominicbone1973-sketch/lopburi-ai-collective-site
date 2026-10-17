'use strict';
/* No cookies, storage or analytics. Bearer link stays in memory, never a server
 * query. A credentialless Google bridge avoids the visitor's account routing. */
(()=>{
 const params=new URLSearchParams(location.hash.slice(1)),request={action:params.get('action'),id:params.get('id'),token:params.get('token'),lang:params.get('lang')==='th'?'th':'en'},lang=request.lang;
 history.replaceState(null,'',location.pathname+location.search);document.documentElement.lang=lang;
 const th=lang==='th',title=document.getElementById('title'),message=document.getElementById('message'),confirm=document.getElementById('confirm'),retry=document.getElementById('retry'),website=document.getElementById('website');
 const words=th?{loading:'กำลังตรวจสอบลิงก์…',wait:'โปรดรอสักครู่',pending:'ยืนยันการเลือกของคุณ',intro:'กดปุ่มด้านล่างเพื่อยืนยันการเลือกของคุณ',confirm:'ยืนยันรับข่าวสาร',unsubscribe:'ยกเลิกรับข่าวสาร',confirmed:'ยืนยันรับข่าวสารแล้ว',already_confirmed:'ยืนยันแล้ว',unsubscribed:'ยกเลิกรับข่าวสารแล้ว',invalid:'ลิงก์ไม่ถูกต้องหรือหมดอายุ',invalidBody:'ไม่มีการเปลี่ยนแปลงการรับข่าวสาร โปรดตรวจสอบอีเมลฉบับล่าสุด',done:'บันทึกการเลือกของคุณแล้ว คุณสามารถปิดแท็บนี้ได้',unchanged:'คุณยืนยันรับข่าวสารแล้ว ไม่มีการเปลี่ยนแปลงเพิ่มเติม',error:'ไม่สามารถเชื่อมต่อได้',errorBody:'ยังไม่สามารถตรวจสอบผลได้ โปรดลองอีกครั้ง ข้อมูลจะไม่ถูกยืนยันจนกว่าบริการจะตอบกลับ',retry:'ลองอีกครั้ง',website:'ไปที่เว็บไซต์ชุมชน'}:{loading:'Checking your link…',wait:'Please wait a moment.',pending:'Confirm your choice',intro:'Press the button below to confirm your choice.',confirm:'Confirm email updates',unsubscribe:'Unsubscribe',confirmed:'Email updates confirmed',already_confirmed:'Already confirmed',unsubscribed:'Unsubscribed',invalid:'Link invalid or expired',invalidBody:'No subscription change. Please check your latest email.',done:'Your choice has been recorded. You can close this tab now.',unchanged:'Your email updates are already confirmed. No further changes were made.',error:'We could not connect',errorBody:'We could not verify the result yet. Please try again; confirmation is only shown after the service replies.',retry:'Try again',website:'Visit the collective website'};
 website.href+='?lang='+lang;website.textContent=words.website;retry.textContent=words.retry;
 const endpoint='https://script.google.com/macros/s/AKfycbzb8l7LnmJaq3KtmLDquOc3hooU0p_n2-rYE8QaVmGxmaTAyqKWX8c5Gcp5GZWs5uYEDw/exec';
 const googleOrigin=o=>{try{const u=new URL(o);return u.protocol==='https:'&&(u.hostname==='script.googleusercontent.com'||u.hostname.endsWith('-script.googleusercontent.com'))}catch{return false}};
 function transport(operation){return new Promise((resolve,reject)=>{
  const frame=document.createElement('iframe'),channel=Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');let sender=null,origin='';
  frame.hidden=true;frame.title='Secure email preference service';frame.referrerPolicy='no-referrer';frame.credentialless=true;frame.setAttribute('credentialless','');
  const cleanup=()=>{clearTimeout(timer);removeEventListener('message',receive);frame.remove()},timer=setTimeout(()=>{cleanup();reject(Error('Timeout'))},45000);
  function receive(e){if(!googleOrigin(e.origin)||e.data?.channel!==channel)return;if(e.data.type==='lac-confirm-ready'&&!sender){sender=e.source;origin=e.origin;sender.postMessage({type:'lac-confirm-submit',channel,operation,request},origin)}else if(e.data.type==='lac-confirm-result'&&e.source===sender&&e.origin===origin){cleanup();resolve(e.data.result)}}
  addEventListener('message',receive);frame.src=endpoint+'?action=subscription-bridge&origin='+encodeURIComponent(location.origin)+'&channel='+channel;document.body.append(frame);
 })}
 let busy=false,last='view';async function run(operation){if(busy)return;busy=true;last=operation;confirm.disabled=true;retry.hidden=true;title.textContent=words.loading;message.textContent=words.wait;
  try{const result=await transport(operation);if(!result?.ok||!['pending','already_confirmed','confirmed','unsubscribed','invalid'].includes(result.state))throw Error('No receipt');confirm.hidden=true;
   if(result.state==='pending'){if(!/^[a-f0-9]{64}$/.test(result.nonce||''))throw Error('No nonce');request.nonce=result.nonce;title.textContent=words.pending;message.textContent=words.intro;confirm.textContent=request.action==='subscriber-unsubscribe'?words.unsubscribe:words.confirm;confirm.hidden=false;}
   else{title.textContent=words[result.state];message.textContent=result.state==='invalid'?words.invalidBody:result.state==='already_confirmed'?words.unchanged:words.done;}
  }catch{confirm.hidden=true;title.textContent=words.error;message.textContent=words.errorBody;retry.hidden=false;}finally{busy=false;confirm.disabled=false;}
 }
 confirm.addEventListener('click',()=>run('apply'));retry.addEventListener('click',()=>run(last));
 if(!['subscriber-confirm','subscriber-unsubscribe'].includes(request.action)||!/^\w{1,80}$/.test(request.id||'')||!/^[a-f0-9]{64}$/.test(request.token||'')){title.textContent=words.invalid;message.textContent=words.invalidBody;return;}
 run('view');
})();
