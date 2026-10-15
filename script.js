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
document.querySelector('#brief-button').addEventListener('click',()=>dialog.showModal());
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

const siteTranslations={"enquiriesTitle":{"en":"Enquiries","th":"สอบถามข้อมูล"},"enquiriesDescription":{"en":"Questions, partnerships or general enquiries","th":"คำถาม ความร่วมมือ หรือการสอบถามทั่วไป"},"copy0":{"en":"Skip to content","th":"ข้ามไปยังเนื้อหา"},"copy1":{"en":"Website concept 01","th":"แนวคิดเว็บไซต์ 01"},"copy2":{"en":"Private review · Working copy","th":"สำหรับตรวจทาน · ฉบับร่าง"},"copy3":{"en":"Read the proposal","th":"อ่านข้อเสนอ"},"copy4":{"en":"Menu","th":"เมนู"},"copy5":{"en":"About","th":"รู้จักเรา"},"copy6":{"en":"Explore together","th":"ร่วมสำรวจ"},"copy7":{"en":"Our approach","th":"แนวทางของเรา"},"copy8":{"en":"Connect","th":"ติดต่อเรา"},"copy9":{"en":"A community taking shape","th":"ชุมชนที่กำลังก่อตัว"},"copy10":{"en":"A local community bringing people together to learn, share experiences and explore AI.","th":"ชุมชนท้องถิ่นที่เชื่อมโยงผู้คนให้เรียนรู้ แบ่งปันประสบการณ์ และสำรวจ AI ไปด้วยกัน"},"copy11":{"en":"Explore what this could mean for you","th":"ค้นหาแนวทางที่เหมาะกับคุณ"},"copy12":{"en":"Discover the collective","th":"ทำความรู้จักชุมชน"},"copy13":{"en":"Lopburi roots. Regional connections.","th":"เริ่มจากลพบุรี เชื่อมโยงสู่ภูมิภาค"},"copy14":{"en":"Scroll to step inside","th":"เลื่อนเพื่อก้าวเข้าไป"},"copy15":{"en":"Use still image","th":"ใช้ภาพนิ่ง"},"copy16":{"en":"Watch full scene","th":"ชมภาพเคลื่อนไหวเต็มจอ"},"copy17":{"en":"The local starting point","th":"จุดเริ่มต้นในท้องถิ่น"},"copy18":{"en":"The work is here.<br>So are the people<br>who know it.","th":"งานอยู่ที่นี่<br>คนที่เข้าใจงาน<br>ก็อยู่ที่นี่เช่นกัน"},"copy19":{"en":"Different backgrounds. Shared curiosity. People with experiences and questions we can learn from.","th":"ต่างพื้นฐาน แต่มีความสนใจร่วมกัน ทุกคนมีประสบการณ์และคำถามที่เราเรียนรู้จากกันได้"},"copy20":{"en":"Lopburi AI Collective is an emerging community for people curious about AI, from first-time learners to those with practical experience.","th":"ชุมชน AI ลพบุรีกำลังก่อตัวขึ้นเพื่อผู้ที่สนใจ AI ตั้งแต่ผู้เริ่มเรียนรู้ไปจนถึงผู้มีประสบการณ์ใช้งานจริง"},"copy21":{"en":"We’re shaping a place for free learning sessions, shared demonstrations, local conversations and community activities. Based in Lopburi, with connections across Upper Central Thailand.","th":"เรากำลังร่วมสร้างพื้นที่สำหรับการเรียนรู้ฟรี การสาธิต การพูดคุยในท้องถิ่น และกิจกรรมชุมชน โดยมีฐานในลพบุรีและเชื่อมโยงกับพื้นที่ภาคกลางตอนบน"},"copy22":{"en":"Our starting principle","th":"หลักคิดเริ่มต้นของเรา"},"copy23":{"en":"Start with a question.<br>Explore together.","th":"เริ่มจากคำถาม<br>สำรวจไปด้วยกัน"},"copy24":{"en":"Businesses","th":"ธุรกิจ"},"copy25":{"en":"Public service","th":"บริการภาครัฐ"},"copy26":{"en":"Community organisations","th":"องค์กรชุมชน"},"copy27":{"en":"Builders & practitioners","th":"นักพัฒนาและผู้ปฏิบัติงาน"},"copy28":{"en":"Find your starting point","th":"ค้นหาจุดเริ่มต้นของคุณ"},"copy29":{"en":"What could we<br>explore together?","th":"เราจะสำรวจอะไร<br>ไปด้วยกันได้บ้าง?"},"copy30":{"en":"Choose what feels relevant to you. Bring a question, share an experience or explore something new with the community.","th":"เลือกสิ่งที่ตรงกับความสนใจของคุณ นำคำถามมาแบ่งปัน แลกเปลี่ยนประสบการณ์ หรือสำรวจสิ่งใหม่กับชุมชน"},"copy31":{"en":"Local businesses","th":"ธุรกิจในท้องถิ่น"},"copy32":{"en":"Public-service participants","th":"ผู้ทำงานบริการสาธารณะ"},"copy33":{"en":"Community groups","th":"กลุ่มชุมชน"},"copy34":{"en":"For local businesses","th":"สำหรับธุรกิจในท้องถิ่น"},"copy35":{"en":"More time for the work<br>that needs you.","th":"มีเวลาเพิ่มขึ้น<br>ให้งานที่ต้องใช้คุณ"},"copy36":{"en":"Bring a repeated task, a communication challenge or a question about AI. A real example gives a conversation somewhere useful to begin.","th":"นำงานที่ทำซ้ำ ปัญหาการสื่อสาร หรือคำถามเกี่ยวกับ AI มาพูดคุย ตัวอย่างจากงานจริงช่วยให้เราเริ่มต้นได้ตรงประเด็น"},"copy37":{"en":"Bring a business question","th":"นำคำถามจากธุรกิจมาคุยกัน"},"copy38":{"en":"Everyday administration","th":"งานธุรการประจำวัน"},"copy39":{"en":"Explore drafting, sorting and summarising routine material, with people checking the result.","th":"สำรวจการร่าง จัดหมวดหมู่ และสรุปข้อมูลในงานประจำ โดยมีคนตรวจสอบผลลัพธ์"},"copy40":{"en":"Customer communication","th":"การสื่อสารกับลูกค้า"},"copy41":{"en":"Look at clearer replies, translation and content workflows that still sound like your organisation.","th":"พิจารณาการตอบคำถามให้ชัดเจนขึ้น การแปล และขั้นตอนการทำเนื้อหา โดยคงน้ำเสียงขององค์กรคุณ"},"copy42":{"en":"Information you can use","th":"ข้อมูลที่นำไปใช้ได้"},"copy43":{"en":"Consider how reports and existing records could become easier to understand, with attention to data quality and privacy.","th":"พิจารณาวิธีทำให้รายงานและข้อมูลที่มีอยู่เข้าใจง่ายขึ้น โดยใส่ใจคุณภาพข้อมูลและความเป็นส่วนตัว"},"copy44":{"en":"For public service teams","th":"สำหรับทีมงานบริการภาครัฐ"},"copy45":{"en":"Useful exploration.<br>Clear responsibility.","th":"สำรวจอย่างมีประโยชน์<br>รับผิดชอบอย่างชัดเจน"},"copy46":{"en":"Begin with a service need and the boundaries that matter. Officers and subject experts can bring the context that a technology demonstration alone cannot provide.","th":"เริ่มจากความต้องการด้านบริการและขอบเขตที่สำคัญ เจ้าหน้าที่และผู้เชี่ยวชาญสามารถให้บริบทที่การสาธิตเทคโนโลยีเพียงอย่างเดียวให้ไม่ได้"},"copy47":{"en":"Bring a public service question","th":"นำคำถามด้านบริการภาครัฐมาคุยกัน"},"copy48":{"en":"Accessible public information","th":"ข้อมูลสาธารณะที่เข้าถึงง่าย"},"copy49":{"en":"Explore clearer explanations, translation and navigation of information already approved for public use.","th":"สำรวจการอธิบายให้ชัดเจน การแปล และการค้นหาข้อมูลที่ได้รับอนุมัติให้เผยแพร่ต่อสาธารณะแล้ว"},"copy50":{"en":"Routine internal workflows","th":"ขั้นตอนงานประจำภายในองค์กร"},"copy51":{"en":"Discuss drafting and summarising using permitted material, with review and accountability built into the process.","th":"พูดคุยเรื่องการร่างและสรุปจากข้อมูลที่อนุญาตให้ใช้ โดยมีการตรวจทานและความรับผิดชอบในทุกขั้นตอน"},"copy52":{"en":"Responsible adoption","th":"การนำไปใช้อย่างรับผิดชอบ"},"copy53":{"en":"Compare privacy, reliability and oversight considerations before choosing a small, low-risk experiment.","th":"พิจารณาความเป็นส่วนตัว ความน่าเชื่อถือ และการกำกับดูแล ก่อนเลือกการทดลองขนาดเล็กที่มีความเสี่ยงต่ำ"},"copy54":{"en":"For community groups","th":"สำหรับกลุ่มชุมชน"},"copy55":{"en":"Shared interests.<br>Local possibilities.","th":"ความสนใจร่วมกัน<br>โอกาสในท้องถิ่น"},"copy56":{"en":"Bring a community question or a project idea. Explore how AI might support the people, activities and connections that matter to your group.","th":"นำคำถามของชุมชนหรือแนวคิดโครงการมาร่วมสำรวจว่า AI อาจช่วยผู้คน กิจกรรม และความสัมพันธ์ที่สำคัญต่อกลุ่มของคุณได้อย่างไร"},"copy57":{"en":"Share a community idea","th":"แบ่งปันแนวคิดเพื่อชุมชน"},"copy58":{"en":"Community communication","th":"การสื่อสารของชุมชน"},"copy59":{"en":"Explore translation, information access and the routine coordination work that uses volunteer time.","th":"สำรวจการแปล การเข้าถึงข้อมูล และงานประสานงานประจำที่ใช้เวลาของอาสาสมัคร"},"copy60":{"en":"Planning activities together","th":"ร่วมวางแผนกิจกรรม"},"copy61":{"en":"Try ideas for organising gatherings, preparing useful materials and making participation easier.","th":"ทดลองแนวคิดในการจัดพบปะ เตรียมสื่อที่เป็นประโยชน์ และช่วยให้ผู้คนเข้าร่วมได้ง่ายขึ้น"},"copy62":{"en":"Small community projects","th":"โครงการเล็ก ๆ ของชุมชน"},"copy63":{"en":"Start with a shared local question and explore a small project using non-sensitive sample material.","th":"เริ่มจากคำถามร่วมกันในท้องถิ่น แล้วสำรวจโครงการเล็ก ๆ ด้วยข้อมูลตัวอย่างที่ไม่อ่อนไหว"},"copy64":{"en":"A practical way forward","th":"แนวทางที่นำไปปฏิบัติได้"},"copy65":{"en":"A conversation.<br>A shared starting point.","th":"เริ่มจากการพูดคุย<br>หาจุดเริ่มต้นร่วมกัน"},"copy66":{"en":"Our interests, experiences and local knowledge help shape what we explore together.","th":"ความสนใจ ประสบการณ์ และความรู้ในท้องถิ่นของเราช่วยกำหนดสิ่งที่จะสำรวจร่วมกัน"},"copy67":{"en":"People remain<br>responsible.","th":"คนยังคงเป็น<br>ผู้รับผิดชอบ"},"copy68":{"en":"Understand","th":"ทำความเข้าใจ"},"copy69":{"en":"Bring your curiosity.","th":"นำความสนใจของคุณมาร่วมแบ่งปัน"},"copy70":{"en":"What interests you? What would you like to learn, share or explore with others?","th":"คุณสนใจอะไร อยากเรียนรู้ แบ่งปัน หรือสำรวจเรื่องใดกับผู้อื่น?"},"copy71":{"en":"Explore","th":"สำรวจ"},"copy72":{"en":"Make the possibilities visible.","th":"ทำให้เห็นความเป็นไปได้"},"copy73":{"en":"Try examples and demonstrations together. Share what works, discuss limitations and check the results.","th":"ลองตัวอย่างและการสาธิตไปด้วยกัน แบ่งปันสิ่งที่ได้ผล พูดคุยถึงข้อจำกัด และตรวจสอบผลลัพธ์"},"copy74":{"en":"Take the first step","th":"เริ่มก้าวแรก"},"copy75":{"en":"Introduce yourself.","th":"แนะนำตัวกับเรา"},"copy76":{"en":"Tell us a little about yourself and one question or idea you would like to explore. We’re still shaping the community, and your interests can help guide what comes next.","th":"เล่าเกี่ยวกับตัวคุณสักนิด พร้อมคำถามหรือแนวคิดที่อยากสำรวจ เรากำลังร่วมสร้างชุมชน และความสนใจของคุณอาจช่วยกำหนดกิจกรรมต่อไป"},"copy77":{"en":"Help shape the collective","th":"ร่วมสร้างชุมชนนี้"},"copy78":{"en":"What would you<br>bring to the table?","th":"คุณอยากนำอะไร<br>มาร่วมแลกเปลี่ยน?"},"copy79":{"en":"A question from everyday life, work or your community. A practical skill. A perspective we haven’t heard yet.","th":"คำถามจากชีวิตประจำวัน งาน หรือชุมชนของคุณ ทักษะที่ใช้ได้จริง หรือมุมมองที่เรายังไม่เคยได้ยิน"},"copy80":{"en":"We are preparing our first gatherings. Curious individuals, local businesses, people in public service, community groups and AI practitioners are welcome to help shape what comes next.","th":"เรากำลังเตรียมการพบปะครั้งแรก ผู้สนใจทั่วไป ธุรกิจท้องถิ่น ผู้ทำงานบริการสาธารณะ กลุ่มชุมชน และผู้มีประสบการณ์ด้าน AI สามารถร่วมกำหนดสิ่งที่จะเกิดขึ้นต่อไป"},"copy81":{"en":"Start a conversation","th":"เริ่มพูดคุยกัน"},"copy82":{"en":"Introduce yourself and tell us one thing you would like to explore.","th":"แนะนำตัวและบอกเรื่องหนึ่งที่คุณอยากสำรวจร่วมกัน"},"copy83":{"en":"Email","th":"อีเมล"},"copy84":{"en":"Email us directly or scan our LINE QR code. Facebook details will be added when ready.","th":"ติดต่อเราทางอีเมลหรือสแกน QR code ของ LINE ได้ รายละเอียด Facebook จะเพิ่มเมื่อพร้อม"},"copy85":{"en":"Join the collective","th":"เข้าร่วมชุมชน"},"copy86":{"en":"A local initiative in development.<br>Programme and contact details to be confirmed.","th":"โครงการท้องถิ่นที่อยู่ระหว่างพัฒนา<br>กำหนดการและรายละเอียดติดต่อยังรอยืนยัน"},"copy87":{"en":"Concept notes","th":"บันทึกแนวคิด"},"copy88":{"en":"Back to top","th":"กลับด้านบน"},"copy89":{"en":"Close","th":"ปิด"},"copy90":{"en":"Step into the collective","th":"ก้าวเข้าสู่ชุมชน"},"copy91":{"en":"Start a conversation","th":"เริ่มพูดคุยกัน"},"copy92":{"en":"Prepare your introduction here, then open it in your email app to send. You can also contact us directly by email or LINE.","th":"เตรียมข้อความแนะนำตัวที่นี่ แล้วเปิดในแอปอีเมลเพื่อตรวจสอบและส่ง หรือจะติดต่อเราทางอีเมลหรือ LINE โดยตรงก็ได้"},"copy93":{"en":"One question or idea you would like to explore","th":"คำถามหรือแนวคิดหนึ่งเรื่องที่อยากสำรวจ"},"copy94":{"en":"Save introduction as text","th":"บันทึกข้อความแนะนำตัว"},"heroFirst":{"en":"Put AI to work.","th":"ใช้ AI ให้เกิดผล"},"heroTogether":{"en":"Together,","th":"ไปด้วยกัน"},"heroLast":{"en":"in Lopburi.","th":"ที่ลพบุรี"},"contactCTA":{"en":"Join the collective","th":"เข้าร่วมชุมชน"},"contactInvite":{"en":"Bring a question, an idea or a practical skill. Tell us a little about yourself and what interests you.","th":"นำคำถาม แนวคิด หรือทักษะมาแบ่งปัน เล่าให้เราฟังสักนิดเกี่ยวกับตัวคุณและสิ่งที่สนใจ"},"projectEmail":{"en":"Project email","th":"อีเมลของโครงการ"},"qrPending":{"en":"QR code to be added","th":"เพิ่มรหัส QR ภายหลัง"},"contactName":{"en":"Your name","th":"ชื่อของคุณ"},"contactEmail":{"en":"Email address","th":"อีเมลของคุณ"},"emailPurpose":{"en":"Include an address we can reply to. You choose when to send from your email app.","th":"ระบุอีเมลที่เราสามารถตอบกลับได้ คุณเลือกส่งข้อความจากแอปอีเมลด้วยตนเอง"},"contactOrganisation":{"en":"Organisation, business or community (optional)","th":"องค์กร ธุรกิจ หรือชุมชน (ไม่จำเป็นต้องกรอก)"},"contactIndependent":{"en":"Independent / not representing an organisation","th":"เข้าร่วมในนามส่วนตัว / ไม่ได้เป็นตัวแทนองค์กร"},"contactLocal":{"en":"Preparing this card keeps your details in this tab. Opening an email draft passes them to your email app; you review and send it there.","th":"การเตรียมข้อความเก็บข้อมูลไว้ในแท็บนี้ เมื่อเปิดร่างอีเมล ข้อมูลจะถูกส่งต่อไปยังแอปอีเมลของคุณ เพื่อให้คุณตรวจสอบและส่งเอง"},"prepareCard":{"en":"Prepare introduction","th":"เตรียมข้อความแนะนำตัว"},"contactThanks":{"en":"Your introduction is ready.","th":"ข้อมูลแนะนำตัวของคุณพร้อมแล้ว"},"contactPrepared":{"en":"Open the email draft, review it and send it from your email app. Nothing has been sent yet; you can also save or edit your introduction.","th":"เปิดร่างอีเมล ตรวจสอบ และส่งจากแอปอีเมลของคุณ ข้อความยังไม่ได้ส่ง คุณยังสามารถบันทึกหรือแก้ไขข้อความแนะนำตัวได้"},"editCard":{"en":"Edit details","th":"แก้ไขข้อมูล"},"communityLabel":{"en":"Community life","th":"กิจกรรมของชุมชน"},"communityTitle":{"en":"A shared interest.<br>A place to connect.","th":"ความสนใจร่วมกัน<br>พื้นที่เชื่อมโยงผู้คน"},"communityIntro":{"en":"We’re an emerging community of people curious about AI. Free training and seminars, shared activities, local partnerships and casual meetups give us ways to learn from one another and shape the collective together.","th":"เราคือชุมชนที่กำลังก่อตัวของผู้สนใจ AI การอบรมและสัมมนาฟรี กิจกรรมร่วมกัน ความร่วมมือในท้องถิ่น และการพบปะแบบเป็นกันเอง เปิดโอกาสให้เราเรียนรู้จากกันและร่วมสร้างชุมชนนี้"},"trainingLabel":{"en":"Free training","th":"การอบรมฟรี"},"trainingTitle":{"en":"Learn by trying.","th":"เรียนรู้ด้วยการลงมือทำ"},"trainingBody":{"en":"Friendly sessions to explore AI tools, practise useful skills and ask questions. Beginners are welcome.","th":"เรียนรู้เครื่องมือ AI ฝึกทักษะที่ใช้ได้จริง และถามคำถามในบรรยากาศเป็นกันเอง ยินดีต้อนรับผู้เริ่มต้น"},"seminarsLabel":{"en":"Seminars & conversations","th":"สัมมนาและวงสนทนา"},"seminarsTitle":{"en":"Ideas worth sharing.","th":"แนวคิดที่แบ่งปันได้"},"seminarsBody":{"en":"Free talks and discussions where community members share experiences, useful examples and questions about AI.","th":"การบรรยายและพูดคุยฟรี เพื่อให้สมาชิกแบ่งปันประสบการณ์ ตัวอย่างที่เป็นประโยชน์ และคำถามเกี่ยวกับ AI"},"activitiesLabel":{"en":"Shared activities","th":"กิจกรรมร่วมกัน"},"activitiesTitle":{"en":"Explore something together.","th":"ร่วมกันสำรวจสิ่งใหม่"},"activitiesBody":{"en":"Demonstrations, practical exercises and small community projects shaped by the interests of the people taking part.","th":"การสาธิต การฝึกปฏิบัติ และโครงการชุมชนขนาดเล็ก ที่เกิดจากความสนใจของผู้เข้าร่วม"},"partnershipsLabel":{"en":"Community partnerships","th":"ความร่วมมือกับชุมชน"},"partnershipsTitle":{"en":"Make local connections.","th":"เชื่อมโยงผู้คนในท้องถิ่น"},"partnershipsBody":{"en":"Connect with local groups, businesses, public-service participants and learning spaces to share knowledge and support community activities.","th":"เชื่อมโยงกลุ่มท้องถิ่น ธุรกิจ ผู้ทำงานภาครัฐ และพื้นที่เรียนรู้ เพื่อแลกเปลี่ยนความรู้และสนับสนุนกิจกรรมชุมชน"},"meetupsLabel":{"en":"Casual meetups","th":"การพบปะแบบเป็นกันเอง"},"meetupsTitle":{"en":"Come for the conversation.","th":"มาร่วมพูดคุยกัน"},"meetupsBody":{"en":"Informal gatherings to meet other AI enthusiasts, exchange ideas and get to know the people behind the collective.","th":"พบปะผู้สนใจ AI แลกเปลี่ยนแนวคิด และทำความรู้จักผู้คนในชุมชนอย่างเป็นกันเอง"},"communityWelcome":{"en":"You don’t need to represent an organisation or have technical experience. Bring your curiosity, your perspective or something you’d like to share.","th":"ไม่จำเป็นต้องเป็นตัวแทนองค์กรหรือมีประสบการณ์ด้านเทคนิค เพียงนำความสนใจ มุมมอง หรือสิ่งที่อยากแบ่งปันมาร่วมกัน"},"communityEventsLink":{"en":"See what’s taking shape","th":"ดูกิจกรรมที่กำลังเตรียม"},"eventsLabel":{"en":"Getting together","th":"มาพบกัน"},"eventsTitle":{"en":"Upcoming events","th":"กิจกรรมที่กำลังจะมาถึง"},"eventsPlanning":{"en":"Planning stage","th":"อยู่ระหว่างวางแผน"},"eventsNote":{"en":"Our first gatherings are being planned. The ideas below are starting points, not confirmed events. Dates, venues and participation details will appear here when agreed.","th":"เรากำลังวางแผนการพบกันครั้งแรก แนวคิดด้านล่างเป็นจุดเริ่มต้น ไม่ใช่กิจกรรมที่ยืนยันแล้ว เราจะเพิ่มวัน เวลา สถานที่ และรายละเอียดการเข้าร่วมเมื่อได้ข้อสรุป"},"eventIdea":{"en":"Activity idea","th":"แนวคิดกิจกรรม"},"firstMeetTitle":{"en":"First community meetup","th":"การพบปะชุมชนครั้งแรก"},"firstMeetBody":{"en":"An informal introduction to the collective: meet one another, share interests and suggest activities.","th":"ทำความรู้จักชุมชน พบปะกัน แลกเปลี่ยนความสนใจ และเสนอแนวคิดกิจกรรม"},"eventDetails":{"en":"Date & venue to be confirmed","th":"วันและสถานที่ยังรอยืนยัน"},"firstTrainingTitle":{"en":"Getting started with AI","th":"เริ่มต้นเรียนรู้ AI"},"firstTrainingBody":{"en":"A free introductory learning session with practical examples, questions and shared exploration.","th":"กิจกรรมเรียนรู้เบื้องต้นฟรี พร้อมตัวอย่างการใช้งานจริง การถามคำถาม และการสำรวจร่วมกัน"},"communityNav":{"en":"Community","th":"ชุมชน"},"conceptImage":{"en":"Concept imagery · inspired by our pavilion scene","th":"ภาพแนวคิด · อ้างอิงจากฉากพื้นที่ชุมชนของเรา"},"joinTitle":{"en":"Who can take part?","th":"ใครเข้าร่วมได้บ้าง?"},"joinIntro":{"en":"Different backgrounds. Shared curiosity. Room to learn from one another.","th":"ต่างประสบการณ์ แต่มีความสนใจร่วมกัน และพร้อมเรียนรู้จากกันและกัน"},"joinBusiness":{"en":"Local businesses","th":"ธุรกิจในท้องถิ่น"},"joinBusinessBody":{"en":"Explore everyday questions and share what you learn.","th":"ร่วมสำรวจคำถามในงานประจำวัน และแบ่งปันสิ่งที่ได้เรียนรู้"},"joinPublic":{"en":"Public-service participants","th":"ผู้ทำงานบริการสาธารณะ"},"joinPublicBody":{"en":"Exchange ideas for useful, responsible AI in local services.","th":"แลกเปลี่ยนแนวคิดการใช้ AI อย่างมีประโยชน์และรับผิดชอบในบริการท้องถิ่น"},"joinGroups":{"en":"Community groups","th":"กลุ่มชุมชน"},"joinGroupsBody":{"en":"Bring a shared interest or a project to explore together.","th":"นำความสนใจร่วมกันหรือโครงการมาสำรวจไปด้วยกัน"},"joinCurious":{"en":"Curious people & AI practitioners","th":"ผู้สนใจและผู้มีประสบการณ์ด้าน AI"},"joinCuriousBody":{"en":"Get started, share skills or help others learn.","th":"เริ่มต้นเรียนรู้ แบ่งปันทักษะ หรือช่วยให้ผู้อื่นได้เรียนรู้"},"joinWelcome":{"en":"Whatever your background, there’s room to join in.","th":"ไม่ว่าคุณจะมีพื้นฐานอย่างไร ก็มีพื้นที่ให้เข้าร่วม"},"joinCta":{"en":"Explore community activities","th":"สำรวจกิจกรรมของชุมชน"},"curiousTab":{"en":"Curious people & AI practitioners","th":"ผู้สนใจและผู้มีประสบการณ์ด้าน AI"},"curiousLabel":{"en":"For beginners and experienced members","th":"สำหรับผู้เริ่มต้นและสมาชิกที่มีประสบการณ์"},"curiousTitle":{"en":"Start with curiosity.<br>Learn by sharing.","th":"เริ่มด้วยความสนใจ<br>เรียนรู้ด้วยการแบ่งปัน"},"curiousBody":{"en":"You do not need a technical background. Ask a first question, practise alongside others or share a skill that helps someone get started.","th":"ไม่จำเป็นต้องมีพื้นฐานด้านเทคนิค คุณสามารถเริ่มถามคำถาม ฝึกไปพร้อมกับผู้อื่น หรือแบ่งปันทักษะที่ช่วยให้ใครสักคนเริ่มต้นได้"},"curiousCta":{"en":"Find a learning activity","th":"ค้นหากิจกรรมการเรียนรู้"},"curiousOne":{"en":"Getting started","th":"เริ่มต้นเรียนรู้"},"curiousOneBody":{"en":"Try everyday AI tools in friendly sessions, with time for questions and checking the results.","th":"ทดลองเครื่องมือ AI ในชีวิตประจำวันในบรรยากาศเป็นกันเอง พร้อมเวลาถามคำถามและตรวจสอบผลลัพธ์"},"curiousTwo":{"en":"Sharing practical skills","th":"แบ่งปันทักษะที่ใช้ได้จริง"},"curiousTwoBody":{"en":"Bring a useful example, explain what you learned and help another member try it.","th":"นำตัวอย่างที่เป็นประโยชน์มาเล่าสิ่งที่เรียนรู้ และช่วยให้สมาชิกคนอื่นได้ลองทำ"},"curiousThree":{"en":"Exploring and experimenting","th":"สำรวจและทดลอง"},"curiousThreeBody":{"en":"Explore a demonstration or a small prototype together, including its limits and where human judgement matters.","th":"ร่วมสำรวจการสาธิตหรือต้นแบบเล็ก ๆ รวมถึงข้อจำกัดและจุดที่ต้องใช้วิจารณญาณของคน"},"arrivalTitle":{"en":"There’s room for you here.","th":"ที่นี่มีพื้นที่ให้คุณร่วมเป็นส่วนหนึ่ง"},"arrivalCta":{"en":"Explore community activities","th":"สำรวจกิจกรรมของชุมชน"},"lineQrScan":{"en":"Scan to connect on LINE","th":"สแกนเพื่อเชื่อมต่อทาง LINE"},"contactRaisedWelcome":{"en":"Bring your curiosity. Let’s explore it together.","th":"นำความสนใจของคุณมา แล้วร่วมสำรวจไปด้วยกัน"},"facebookComing":{"en":"Coming soon","th":"เร็ว ๆ นี้"},"emailIntroduction":{"en":"Email your introduction","th":"ส่งข้อความแนะนำตัวทางอีเมล"},"eventInterest":{"en":"Express interest","th":"แจ้งความสนใจ"},"updatesOptIn":{"en":"Keep me updated about Lopburi AI Collective events, learning resources and community news.","th":"ฉันต้องการรับข่าวสารเกี่ยวกับกิจกรรม แหล่งเรียนรู้ และข่าวชุมชนจากชุมชน AI ลพบุรี"},"updatesHelp":{"en":"Optional. Your choice is included in your email draft and reaches us only when you send it. You can ask us to stop updates by email or LINE.","th":"ไม่บังคับ ตัวเลือกนี้จะรวมอยู่ในร่างอีเมล และเราจะได้รับเมื่อคุณส่งอีเมลเท่านั้น คุณสามารถขอหยุดรับข่าวสารได้ทางอีเมลหรือ LINE"}};
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
  document.title=language==='th'?'ชุมชน AI ลพบุรี — แนวคิดเว็บไซต์':'Lopburi AI Collective — Website concept';
  document.querySelector('meta[name="description"]').content=language==='th'?'แนวคิดชุมชน AI ลพบุรี เชื่อมธุรกิจ ภาครัฐ และประสบการณ์ใช้งาน AI ในท้องถิ่น':'A working concept for Lopburi AI Collective: a local community connecting business, public service and practical AI experience.';
  if(window.refreshContactCard)window.refreshContactCard();
  if(window.refreshNori)window.refreshNori();
  if(window.refreshEventLoopLabels)window.refreshEventLoopLabels();
  motionButton.textContent=window.siteText(motionButton.dataset.motionState||'still');
  const status=document.querySelector('#brief-status');if(status.textContent)status.textContent=window.siteText('saved');
  if(persist){try{localStorage.setItem('lopburi-language',language)}catch{}}
  document.fonts?.ready.then(measureJourney);
  measureJourney();
}
document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>setSiteLanguage(button.dataset.language)));
let preferredLanguage='en';try{preferredLanguage=localStorage.getItem('lopburi-language')||'en'}catch{}
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

const contactForm=document.querySelector('#contact-form');
const contactReady=document.querySelector('#contact-ready');
const organisationField=document.querySelector('#contact-organisation');
let preparedIntroduction=null;
document.querySelectorAll('[data-contact-open]').forEach(button=>button.addEventListener('click',()=>dialog.showModal()));
function introductionText(data,language){
  const labels=language==='th'?['ชื่อ','อีเมล','องค์กร ธุรกิจ หรือชุมชน','คำถามหรือแนวคิด']:['Name','Email','Organisation, business or community','Question or idea'];
  const organisation=data.organisation || (language==='th'?'ไม่ได้ระบุ':'Not specified');
  return 'Lopburi AI Collective — ชุมชน AI ลพบุรี\n\n'+labels[0]+': '+data.name+'\n'+labels[1]+': '+data.email+'\n'+labels[2]+': '+organisation+'\n\n'+labels[3]+':\n'+data.question+(language==='th'?'\n\nรับข่าวสารชุมชน: ':'\n\nCommunity updates: ')+(data.updates?(language==='th'?'ต้องการรับ':'Yes, please'):(language==='th'?'ไม่ได้เลือก':'Not requested'))+'\n\n[LOPBURI_UPDATES_V1]\nPreference: '+(data.updates?'REQUESTED':'NOT_REQUESTED')+'\nConsent-version: 2026-10-12-v1\nConsent-wording: '+data.consentWording+'\nPrepared-at: '+data.preparedAt+'\nConsent-source: introduction-email-draft\n[/LOPBURI_UPDATES_V1]';
}
window.refreshContactCard=()=>{if(preparedIntroduction){const body=introductionText(preparedIntroduction,siteLanguage);document.querySelector('#contact-summary').textContent=body;document.querySelector('#email-introduction').href='mailto:lopburiaicollective+newmembers@gmail.com?subject='+encodeURIComponent('Hello Lopburi AI Collective')+'&body='+encodeURIComponent(body)}};
contactForm.addEventListener('submit',event=>{
  event.preventDefault();
  ['contact-name','contact-email','contact-organisation','brief-text'].forEach(id=>{const input=document.getElementById(id);input.value=input.value.trim()});
  if(!contactForm.reportValidity())return;
  preparedIntroduction={name:document.querySelector('#contact-name').value,email:document.querySelector('#contact-email').value,organisation:organisationField.value,question:document.querySelector('#brief-text').value,updates:document.querySelector('#contact-updates').checked,consentWording:window.siteText('updatesOptIn'),preparedAt:new Date().toISOString()};
  window.refreshContactCard();contactForm.hidden=true;contactReady.hidden=false;contactReady.focus();
  document.querySelector('#brief-status').textContent='';
});
document.querySelector('#edit-contact').addEventListener('click',()=>{contactReady.hidden=true;contactForm.hidden=false;document.querySelector('#contact-name').focus();document.querySelector('#brief-status').textContent=''});
document.querySelector('#download-brief').addEventListener('click',()=>{
  if(!preparedIntroduction)return;
  const url=URL.createObjectURL(new Blob([introductionText(preparedIntroduction,siteLanguage)],{type:'text/plain;charset=utf-8'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download='Lopburi-AI-introduction.txt';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  document.querySelector('#brief-status').textContent=window.siteText('saved');
});
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
 const sections=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
 let queued=false;
 function update(){queued=false;const boundary=document.querySelector('.site-header').getBoundingClientRect().height+window.innerHeight*.24;let current=null;for(const section of [...sections].sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top)){if(section.getBoundingClientRect().top<=boundary)current=section.id}links.forEach(a=>{if(a.getAttribute('href')==='#'+current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}
 function queue(){if(!queued){queued=true;requestAnimationFrame(update)}}
 window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue,{passive:true});queue();
 document.querySelectorAll('[data-event-interest]').forEach(a=>a.addEventListener('click',()=>{const title=a.closest('.event-card').querySelector('h4').textContent.trim();const body=siteLanguage==='th'?'สวัสดีชุมชน AI ลพบุรี\n\nฉันสนใจกิจกรรม: '+title+'\nโปรดแจ้งรายละเอียดเมื่อพร้อม\n\nชื่อ: ':'Hello Lopburi AI Collective,\n\nI am interested in: '+title+'\nPlease let me know when details are available.\n\nName: ';a.href='mailto:lopburiaicollective@gmail.com?subject='+encodeURIComponent('Community activity interest')+'&body='+encodeURIComponent(body)}));
})();
