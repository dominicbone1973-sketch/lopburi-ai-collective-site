/* Shared visible activity loops. Pausable; respects reduced motion and data saving. */
(()=>{
// Event animations load only when visible and appropriate for the device.
const eventLoopReduced = matchMedia('(prefers-reduced-motion: reduce)');
const eventLoopItems = [...document.querySelectorAll('.event-media')].map(media => ({media, video:media.querySelector('video'), button:media.querySelector('button'), visible:false, paused:false}));
function eventLoopsAllowed(){return !eventLoopReduced.matches && !navigator.connection?.saveData}
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
eventLoopReduced.addEventListener('change',refreshEventLoops);
navigator.connection?.addEventListener('change',refreshEventLoops);
document.addEventListener('visibilitychange',refreshEventLoops);
refreshEventLoops();

})();
