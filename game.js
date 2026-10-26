import {hitResult} from './physics.js';
import {swingContactDelay,isBigHit} from './batting.js';
import {createField} from './scene.js';
import {isTrackedHit,sampleFlight,shotEndTime} from './flight.js';
import {nextPitchPhase} from './pitch-cycle.js';
const $=id=>document.getElementById(id);
const canvas=$('field'),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let best=0,muted=false,timingEnabled=true;
try{timingEnabled=localStorage.getItem('onlyai-timing-enabled')!=='false';}catch{}
try{muted=localStorage.getItem('onlyai-muted')==='true';}catch{}
try{best=Number(localStorage.getItem('onlyai-best'))||0;}catch{}
$('best').innerHTML=`${best} <small>m</small>`;
let state='idle',start=0,swungAt=-99,flightAt=0,shots=0,lane=0,outcome=null,audio,impactPlayed=false,phaseStarted=0;
const contactTime=1.27,pitchDuration=1.65;
let field;
try{field=createField(canvas);}catch(error){
 console.error('3D renderer initialization failed:',error);
 $('label').textContent='3D 화면을 시작하지 못했어요';
 $('result').textContent='브라우저의 하드웨어 가속을 확인해 주세요';
 $('buttonText').textContent='3D 실행 불가';$('swing').disabled=true;
}
function sound(hit=false,big=false){
 if(muted)return;
 try{
  audio??=new AudioContext();audio.resume();
  const time=audio.currentTime;
  const oscillator=audio.createOscillator(),gain=audio.createGain();
  oscillator.type=hit?'triangle':'sine';
  oscillator.frequency.setValueAtTime(hit?780:240,time);
  oscillator.frequency.exponentialRampToValueAtTime(hit?95:65,time+.14);
  gain.gain.setValueAtTime(hit?.24:.07,time);gain.gain.exponentialRampToValueAtTime(.001,time+.18);
  oscillator.connect(gain).connect(audio.destination);oscillator.start();oscillator.stop(time+.2);
  if(big){for(let i=0;i<3;i++){const tone=audio.createOscillator(),envelope=audio.createGain();tone.type='sine';tone.frequency.value=[523.25,659.25,783.99][i];const at=time+.1+i*.085;envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(.075,at+.015);envelope.gain.exponentialRampToValueAtTime(.001,at+.3);tone.connect(envelope).connect(audio.destination);tone.start(at);tone.stop(at+.32);}}
  if(hit){const buffer=audio.createBuffer(1,audio.sampleRate*.09,audio.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
   const noise=audio.createBufferSource(),volume=audio.createGain();noise.buffer=buffer;volume.gain.value=.23;noise.connect(volume).connect(audio.destination);noise.start();}
 }catch{}
}function action(){
 if(!field||document.hidden)return;
 if(!audio){try{audio=new AudioContext();audio.resume();}catch{}}
 const now=performance.now()/1000;
 if(state==='idle'||state==='result'){
  state=isTrackedHit(outcome)?'returning':'ready';phaseStarted=now;
  swungAt=-99;lane=(Math.random()-.5)*64;outcome=null;impactPlayed=false;
  $('game').classList.remove('big-hit');$('recordNotice').hidden=true;showPitchPhase();
 }else if(state==='pitch'){
  swungAt=now;shots++;$('count').textContent=`SWING ${String(shots).padStart(2,'0')}`;
  outcome=hitResult(now-start-contactTime,lane);state='flight';flightAt=now+swingContactDelay;
  $('buttonText').textContent='스윙!';
 }
}
function showPitchPhase(){
 const returning=state==='returning',ready=state==='ready';
 $('swing').disabled=returning||ready;
 $('label').textContent=returning?'타석으로 복귀 중':ready?'잠시 후 투수가 공을 던집니다':'공이 스트라이크존에 도착할 때';
 $('result').textContent=returning?'포수 시점으로 돌아갑니다':ready?'준비하세요!':'타이밍을 맞춰 터치!';
 $('buttonText').textContent=returning?'화면 복귀 중…':ready?'투구 준비 중…':'배트 휘두르기';
}
function finish(){
 state='result';$('game').classList.remove('big-hit');
 if(outcome.distance>best){$('recordNotice').hidden=false;best=outcome.distance;try{localStorage.setItem('onlyai-best',String(best));}catch{}$('best').innerHTML=`${best} <small>m</small>`;}
 $('result').textContent=outcome.distance?`${outcome.distance} m · ${isBigHit(outcome.distance)?'장타! ':''}${outcome.grade}`:'헛스윙!';
 $('buttonText').textContent='다시 도전';

}
function updateMute(){
 $('mute').textContent=muted?'소리 OFF':'소리 ON';$('mute').setAttribute('aria-pressed',String(muted));$('mute').setAttribute('aria-label',muted?'효과음 켜기':'효과음 끄기');
}
updateMute();
$('mute').addEventListener('click',()=>{muted=!muted;try{localStorage.setItem('onlyai-muted',String(muted));}catch{}updateMute();});
function updateTimingToggle(){
 $('timingToggle').textContent=timingEnabled?'게이지 ON':'게이지 OFF';
 $('timingToggle').setAttribute('aria-pressed',String(timingEnabled));
 $('timingToggle').setAttribute('aria-label',timingEnabled?'타이밍 게이지 끄기':'타이밍 게이지 켜기');
 $('timing').hidden=!timingEnabled||state!=='pitch';
}
updateTimingToggle();
$('timingToggle').addEventListener('click',()=>{
 timingEnabled=!timingEnabled;
 try{localStorage.setItem('onlyai-timing-enabled',String(timingEnabled));}catch{}
 updateTimingToggle();
});
$('game').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;action();});
$('swing').addEventListener('click',action);
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!e.target.closest('button')){e.preventDefault();action();}});
function frame(ms){
 if(!field)return;
 const now=ms/1000;
 const next=nextPitchPhase(state,phaseStarted,now,reducedMotion);
 if(next!==state){
  state=next;phaseStarted=now;
  // Start timing only once the view has returned and the preparation pause has finished.
  if(state==='pitch')start=now;
  showPitchPhase();
 }
 if(state==='pitch'&&now-start>pitchDuration){state='result';outcome={distance:0};$('label').textContent='공이 지나갔어요';$('result').textContent='다음 공을 노려보세요';$('buttonText').textContent='다시 도전';}
 if(state==='flight'){
  const t=now-flightAt;
  if(t>=0&&!impactPlayed){impactPlayed=true;const big=isBigHit(outcome.distance);sound(outcome.distance>0,big);
   if(outcome.distance&&navigator.vibrate)navigator.vibrate(big?[30,20,60]:20);
   $('label').textContent=outcome.distance?'공이 날아갑니다':'타이밍을 조금 바꿔 보세요';
   $('result').textContent=big?'BIG HIT! · 장타!':outcome.grade;$('buttonText').textContent='공이 날아가는 중';$('game').classList.toggle('big-hit',big);
  }
  if(t>shotEndTime(outcome))finish();
 }
 const track=isTrackedHit(outcome)&&(state==='flight'||state==='result')&&now>=flightAt;
 $('shotTracker').hidden=!track;
 if(track){
  const shot=sampleFlight(outcome,lane,now-flightAt);
  $('shotState').textContent=shot.landed?'LANDED · 착지 완료':'FLY CAM · 타구 추적';
  $('shotDistance').textContent=`${Math.round(outcome.distance*shot.progress)} m`;
  $('game').dataset.camera=shot.landed?'landing':'tracking';
  if(state==='flight'&&shot.landed)$('buttonText').textContent='착지 확인 중';
 }else $('game').dataset.camera=state==='returning'?'returning':'catcher';
 $('game').dataset.phase=state;
 const pitching=state==='pitch';$('timing').hidden=!pitching||!timingEnabled;
 if(pitching)$('needle').style.left=`${Math.min(1,(now-start)/contactTime)*100}%`;
 field.render({now,state,start,phaseStarted,swungAt,flightAt,outcome,lane,contactTime,reducedMotion});
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
