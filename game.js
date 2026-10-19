import {hitResult} from './physics.js';
import {swingContactDelay,isBigHit} from './batting.js';
import {createField} from './scene.js';
const $=id=>document.getElementById(id);
const canvas=$('field'),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let best=0;
try{best=Number(localStorage.getItem('onlyai-best'))||0;}catch{}
$('best').innerHTML=`${best} <small>m</small>`;
let state='idle',start=0,swungAt=-99,flightAt=0,shots=0,lane=0,outcome=null,audio,impactPlayed=false;
const contactTime=1.27,pitchDuration=1.65;
let field;
try{field=createField(canvas);}catch(error){
 console.error('3D renderer initialization failed:',error);
 $('label').textContent='3D 화면을 시작하지 못했어요';
 $('result').textContent='브라우저의 하드웨어 가속을 확인해 주세요';
 $('buttonText').textContent='3D 실행 불가';$('swing').disabled=true;
}
function sound(hit=false,big=false){
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
  state='pitch';start=now;swungAt=-99;lane=(Math.random()-.5)*64;outcome=null;impactPlayed=false;
  $('game').classList.remove('big-hit');$('label').textContent='공이 스트라이크존에 도착할 때';
  $('result').textContent='타이밍을 맞춰 터치!';$('buttonText').textContent='배트 휘두르기';
 }else if(state==='pitch'){
  swungAt=now;shots++;$('count').textContent=`SWING ${String(shots).padStart(2,'0')}`;
  outcome=hitResult(now-start-contactTime,lane);state='flight';flightAt=now+swingContactDelay;
  $('buttonText').textContent='스윙!';
 }
}
function finish(){
 state='result';$('game').classList.remove('big-hit');
 if(outcome.distance>best){best=outcome.distance;try{localStorage.setItem('onlyai-best',String(best));}catch{}$('best').innerHTML=`${best} <small>m</small>`;}
 $('result').textContent=outcome.distance?`${outcome.distance} m · ${isBigHit(outcome.distance)?'장타! ':''}${outcome.grade}`:'헛스윙!';
 $('buttonText').textContent='다시 도전';
}
$('game').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;action();});
$('swing').addEventListener('click',action);
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!e.target.closest('button')){e.preventDefault();action();}});
function frame(ms){
 if(!field)return;
 const now=ms/1000;
 if(state==='pitch'&&now-start>pitchDuration){state='result';outcome={distance:0};$('label').textContent='공이 지나갔어요';$('result').textContent='다음 공을 노려보세요';$('buttonText').textContent='다시 도전';}
 if(state==='flight'){
  const t=now-flightAt;
  if(t>=0&&!impactPlayed){impactPlayed=true;const big=isBigHit(outcome.distance);sound(outcome.distance>0,big);
   if(outcome.distance&&navigator.vibrate)navigator.vibrate(big?[30,20,60]:20);
   $('label').textContent=outcome.distance?`타이밍 ${Math.round(outcome.timing*100)}% · 중심 ${Math.round(outcome.contact*100)}%`:'타이밍을 조금 바꿔 보세요';
   $('result').textContent=big?'BIG HIT! · 장타!':outcome.grade;$('buttonText').textContent='공이 날아가는 중';$('game').classList.toggle('big-hit',big);
  }
  if(t>1.8)finish();
 }
 const pitching=state==='pitch';$('timing').hidden=!pitching;
 if(pitching)$('needle').style.left=`${Math.min(1,(now-start)/contactTime)*100}%`;
 field.render({now,state,start,swungAt,flightAt,outcome,lane,contactTime,reducedMotion});
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
