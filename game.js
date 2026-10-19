import {hitResult} from './physics.js';
const $ = id => document.getElementById(id);
const canvas=$('field'),ctx=canvas.getContext('2d');
let best=0;try{best=Number(localStorage.getItem('onlyai-best'))||0;}catch{}
$('best').innerHTML=`${best} <small>m</small>`;
let state='idle',start=0,swungAt=-99,flightAt=0,shots=0,lane=0,outcome=null,now=0;
const pitchDuration=1.6,contactTime=1.27;
const swingContactDelay=.095;
const contactPoint={x:450,y:350};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function swingPose(age){
 if(age<0)return {angle:-1.05,lean:0,turn:0};
 if(age<swingContactDelay){const p=smooth(age/swingContactDelay);return {angle:-1.05+1.1*p,lean:6*p,turn:.12*p};}
 if(age<.34){const p=smooth((age-swingContactDelay)/.245);return {angle:.05+2.35*p,lean:6+3*p,turn:.12+.18*p};}
 const p=smooth((age-.58)/.38);return {angle:2.4+(-1.05-2.4)*p,lean:9*(1-p),turn:.3*(1-p)};
}
function drawPitch(){
 const p=Math.min((now-start)/(contactTime+swingContactDelay),1.2);
 const x=472+(contactPoint.x+lane-472)*p,y=217+(contactPoint.y-217)*p;
 line(x,y,x+2,y-16,'#ffffff70',3);ball(x,y,3+3*p);
}
function drawBat(){
 const age=now-swungAt,pose=swingPose(age),hx=416+pose.lean,hy=346;
 // Draw in field coordinates so the barrel and ball share a contact plane on every screen.
 ctx.save();
 if(age>=0&&age<.34){ctx.globalAlpha=.32*(1-age/.34);ctx.beginPath();ctx.ellipse(hx,hy,66,25,0,-1.05,pose.angle);ctx.strokeStyle='#fff1ae';ctx.lineWidth=10;ctx.stroke();ctx.globalAlpha=1;}
 const tipX=hx+Math.cos(pose.angle)*66,tipY=hy+Math.sin(pose.angle)*25;
 line(hx,hy,tipX,tipY,'#69492e',10);
 line(hx+(tipX-hx)*.3,hy+(tipY-hy)*.3,tipX,tipY,'#edbd70',8);
 line(hx,hy,hx+(tipX-hx)*.2,hy+(tipY-hy)*.2,'#f4ebce',6);
 ellipse(hx,hy,6,5,'#fffcec');ctx.restore();
}
let audio;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function sound(hit=false){
 try{
  audio??=new AudioContext();audio.resume();
  const time=audio.currentTime;
  const oscillator=audio.createOscillator(),gain=audio.createGain();
  oscillator.type=hit?'triangle':'sine';
  oscillator.frequency.setValueAtTime(hit?780:240,time);
  oscillator.frequency.exponentialRampToValueAtTime(hit?95:65,time+.14);
  gain.gain.setValueAtTime(hit?.24:.07,time);gain.gain.exponentialRampToValueAtTime(.001,time+.18);
  oscillator.connect(gain).connect(audio.destination);oscillator.start();oscillator.stop(time+.2);
  if(hit){const buffer=audio.createBuffer(1,audio.sampleRate*.09,audio.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
   const noise=audio.createBufferSource(),volume=audio.createGain();noise.buffer=buffer;volume.gain.value=.23;noise.connect(volume).connect(audio.destination);noise.start();}
 }catch{}
}
function action(){
 if(!audio){try{audio=new AudioContext();audio.resume();}catch{}}
 if(state==='idle'||state==='result'){
  state='pitch';start=performance.now()/1000;swungAt=-99;lane=(Math.random()-.5)*64;outcome=null;
  $('label').textContent='공이 배트에 다가올 때';$('result').textContent='지금이다 싶을 때, 터치!';$('buttonText').textContent='배트 휘두르기';
 }else if(state==='pitch'){
  swungAt=performance.now()/1000;shots++;$('count').textContent=`SWING ${String(shots).padStart(2,'0')}`;
  outcome=hitResult(swungAt-start-contactTime,lane);state='flight';flightAt=swungAt+swingContactDelay;setTimeout(()=>sound(outcome.distance>0),swingContactDelay*1000);
  if(outcome.distance && navigator.vibrate)navigator.vibrate([20,15,35]);
  $('label').textContent=outcome.distance?`타이밍 ${Math.round(outcome.timing*100)}% · 중심 ${Math.round(outcome.contact*100)}%`:'조금 더 공을 기다려 보세요';
  $('result').textContent=outcome.grade;$('buttonText').textContent='공이 날아가는 중';
 }
}
$('game').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;action();});$('swing').addEventListener('click',action);
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat){e.preventDefault();action();}});
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function line(x,y,a,b,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();}
function shape(points,fill,stroke='#263e37',width=2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function player(x,y,batter=false){
 const swing=now-swungAt,pose=swingPose(swing);
 const wind=!batter&&state==='pitch'?Math.sin(Math.min(1,(now-start)/.32)*Math.PI):0;
 ctx.save();ctx.translate(x,y);
 const proportions=Math.min(2.2,(canvas.clientHeight/480)/(canvas.clientWidth/900));
 ctx.scale((batter?1.16:.9)*proportions,batter?1.16:.9);
 ellipse(0,48,29,7,'#315b3830');
 const lean=batter?pose.lean:0;
 // Cleats, bent trouser legs and colored socks.
 line(-8,20,-16+lean,34,'#2e423f',15);line(-16+lean,34,-20+lean,46,'#fff9e9',11);
 line(8,20,15,32-wind*18,'#2e423f',15);line(15,32-wind*18,21,45-wind*23,'#fff9e9',11);
 line(-20+lean,42,-20+lean,48,'#d2734c',7);line(21,41-wind*23,21,47-wind*23,'#d2734c',7);
 ellipse(-17+lean,49,12,5,'#233f3d');ellipse(25,48-wind*23,12,5,'#233f3d');
 ctx.save();ctx.translate(lean,-wind*3);if(batter)ctx.rotate(pose.turn);
 shape([[-17,-9],[-8,-14],[8,-14],[19,-7],[16,23],[-14,23]],batter?'#fffbeb':'#d97652');
 shape([[-17,-9],[-8,-13],[-7,22],[-14,22]],batter?'#d9e4d7':'#bb5942',null);
 line(-13,22,15,22,'#314e46',4);ctx.fillStyle='#edc875';ctx.fillRect(-1,20,5,4);
 line(0,-8,0,18,batter?'#dfd6be':'#e9a480',1);
 for(let i=0;i<3;i++)ellipse(3,-2+i*6,1,1,'#697c69');
 ctx.fillStyle=batter?'#316250':'#fff4d9';ctx.font='bold 12px sans-serif';ctx.fillText(batter?'7':'1',6,10);
 ellipse(1,-25,16,18,'#efbd91');ellipse(8,-24,10,14,'#f6cda3');ellipse(15,-23,4,6,'#e8ad7c');
 // Helmet/cap with shaded crown, brim and ear guard.
 ctx.fillStyle=batter?'#254d43':'#374e48';ctx.beginPath();ctx.ellipse(0,-33,19,12,-.1,Math.PI,Math.PI*2);ctx.lineTo(19,-29);ctx.lineTo(-18,-29);ctx.fill();
 line(-16,-31,23,-32,batter?'#254d43':'#374e48',5);
 line(-11,-39,3,-42,batter?'#55816b':'#6e8173',3);
 if(batter){ellipse(-10,-25,6,10,'#254d43');ellipse(-10,-25,2,3,'#8ca18c');}
 line(9,-24,12,-24,'#35463c',2);line(7,-15,12,-16,'#b77f60',1);
 if(batter){
  // Both hands follow one shared grip instead of spinning independently.
  const scaleX=1.16*proportions,scaleY=1.16;
  const dx=(416+pose.lean-x)/scaleX-lean,dy=(346-y)/scaleY;
  const hx=dx*Math.cos(pose.turn)+dy*Math.sin(pose.turn);
  const hy=-dx*Math.sin(pose.turn)+dy*Math.cos(pose.turn);
  line(-16,-3,-12,9,'#faf6df',11);line(-12,9,hx,hy,'#efbd91',8);
  line(17,-2,22,8,'#faf6df',10);line(22,8,hx,hy,'#efbd91',8);
 }else{
  line(-16,-4,-23,10,'#d97652',12);line(-23,10,-11,3,'#efbd91',8);
  ellipse(-10,0,12,15,'#784f32');ellipse(-8,-2,8,10,'#a87548');
  for(let i=0;i<3;i++)line(-15+i*5,-9,-14+i*5,5,'#d6aa6e',1);
  line(17,-6,23,-15-wind*18,'#d97652',11);line(23,-15-wind*18,18+wind*10,-24-wind*20,'#efbd91',8);
 }
 ctx.restore();ctx.restore();
}
function impact(t){
 if(!outcome?.distance||t<0||t>.6)return;
 const fade=1-t/.6,x=contactPoint.x+lane,y=contactPoint.y;
 ctx.save();ctx.globalAlpha=fade;
 ctx.strokeStyle='#ffef9d';ctx.lineWidth=4*fade;ctx.beginPath();ctx.arc(x,y,12+t*130,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<16;i++){const angle=i*2.39996,travel=15+t*(100+(i%4)*60);const px=x+Math.cos(angle)*travel,py=y+Math.sin(angle)*travel+t*t*110;
 line(px,py,px+Math.cos(angle)*12*fade,py+Math.sin(angle)*12*fade,i%2?'#fff9d0':'#eba64e',3*fade);}
 ctx.translate(x,y-45-t*40);ctx.rotate(-.1);ctx.font='900 30px sans-serif';ctx.textAlign='center';ctx.strokeStyle='#315b46';ctx.lineWidth=5;const word=outcome.distance>=125?'PERFECT!':'CRACK!';ctx.strokeText(word,0,0);ctx.fillStyle='#fff5b9';ctx.fillText(word,0,0);ctx.restore();
}
function ball(x,y,r=5){ellipse(x+2,y+3,r,r,'#315b3820');ellipse(x,y,r,r,'#fffdf1');line(x-2,y-r*.6,x+1,y+r*.5,'#d87c65',1.2);}
function frame(ms){now=ms/1000;const rect=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;if(canvas.width!==Math.round(rect.width*dpr)||canvas.height!==Math.round(rect.height*dpr)){canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);}ctx.setTransform(canvas.width/900,0,0,canvas.height/480,0,0);
 ctx.fillStyle='#dcebd6';ctx.fillRect(0,0,900,480);
 const impactAge=now-flightAt;
 if(state==='flight'&&outcome?.distance&&!reducedMotion&&impactAge>=0&&impactAge<.22){const amount=6*(1-impactAge/.22);ctx.translate(Math.sin(impactAge*140)*amount,Math.cos(impactAge*170)*amount*.65);}
 const sky=ctx.createLinearGradient(0,0,0,300);sky.addColorStop(0,'#c6e5e2');sky.addColorStop(1,'#e4edd3');ctx.fillStyle=sky;ctx.fillRect(0,0,900,300);
 ellipse(720,85,35,35,'#fff3b7');
 for(let i=0;i<15;i++){ctx.fillStyle=i%2?'#91b6a1':'#a9c5aa';ctx.fillRect(i*66,161-(i%3)*12,64,55);ellipse(i*66+32,161-(i%3)*12,32,25,ctx.fillStyle);}
 ctx.fillStyle='#537e6b';ctx.fillRect(0,193,900,21);line(0,193,900,193,'#eed8a4',4);
 ctx.font='bold 10px sans-serif';ctx.fillStyle='#e7edcd';ctx.textAlign='center';for(let i=0;i<5;i++)ctx.fillText(i===2?'ONLYAI BALLPARK':'HOME RUN CLUB',90+i*180,207);ctx.textAlign='start';
 // Soft, graphic outfield. No extra players.
 ctx.fillStyle='#c4dcb8';ctx.beginPath();ctx.ellipse(450,420,650,265,0,Math.PI,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#b6d1a9';ctx.lineWidth=1;for(let i=0;i<6;i++){ctx.beginPath();ctx.ellipse(450,420,250+i*75,100+i*35,0,Math.PI,Math.PI*2);ctx.stroke();}
 ctx.fillStyle='#ecdbb7';ctx.beginPath();ctx.moveTo(450,412);ctx.lineTo(210,260);ctx.quadraticCurveTo(450,145,690,260);ctx.closePath();ctx.fill();
 ctx.fillStyle='#bdd3a3';ctx.beginPath();ctx.moveTo(450,361);ctx.lineTo(316,268);ctx.lineTo(450,210);ctx.lineTo(584,268);ctx.closePath();ctx.fill();
 line(450,388,157,211,'#fff9e9',2);line(450,388,743,211,'#fff9e9',2);
 ellipse(450,268,42,15,'#e8d2a7');line(440,268,460,268,'#fff9eb',4);
 ctx.fillStyle='#fff8e7';ctx.beginPath();ctx.moveTo(440,383);ctx.lineTo(460,383);ctx.lineTo(460,391);ctx.lineTo(450,399);ctx.lineTo(440,391);ctx.closePath();ctx.fill();
 // Upright strike zone above home plate; the old ground rectangle was a batter's box.
 ctx.save();ctx.fillStyle='#ffffff12';ctx.fillRect(414,322,72,48);
 ctx.strokeStyle='#fff9e5';ctx.lineWidth=2;ctx.strokeRect(414,322,72,48);
 ctx.strokeStyle='#fff9e54a';ctx.lineWidth=1;
 for(let i=1;i<3;i++){line(414+i*24,322,414+i*24,370,'#fff9e54a',1);line(414,322+i*16,486,322+i*16,'#fff9e54a',1);}
 ctx.restore();
 player(450,222);player(397,341,true);drawBat();
 const elapsed=now-start;
 if(state==='pitch'){
  drawPitch();
  if(elapsed>pitchDuration){outcome={distance:0};state='result';$('label').textContent='공이 지나갔어요';$('result').textContent='다음 공을 노려보세요';$('buttonText').textContent='다시 도전';}
 }else if(state==='flight'){
  const t=now-flightAt;if(t<0||(!outcome.distance&&now-start<pitchDuration)){drawPitch();}else if(outcome.distance){let p=Math.min(Math.max(0,t-.07)/1.6,1);const point=q=>({x:450+lane+(outcome.timing-.5)*170*q,y:contactPoint.y-210*q-120*Math.sin(Math.PI*q)});
   ctx.beginPath();for(let i=0;i<18;i++){const q=Math.max(0,p-i*.009),v=point(q);i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y);}ctx.strokeStyle='#fff9c8';ctx.lineWidth=4*(1-p*.7);ctx.stroke();const v=point(p);ball(v.x,v.y,6-p*3);
   ctx.save();ctx.fillStyle='#315943';ctx.font='900 20px sans-serif';ctx.textAlign='center';ctx.fillText(`${Math.round(outcome.distance*Math.min(1,p*1.5))} m`,v.x+37,v.y-12);ctx.restore();}
  if(t>1.7){state='result';if(outcome.distance>best){best=outcome.distance;try{localStorage.setItem('onlyai-best',String(best));}catch{}$('best').innerHTML=`${best} <small>m</small>`;}$('result').textContent=outcome.distance?`${outcome.distance} m · ${outcome.grade}`:'헛스윙!';$('buttonText').textContent='다시 도전';}
 }else if(state==='idle'){ball(473,211,4);}
 if(state==='pitch'){
  const p=Math.min(elapsed/contactTime,1);ctx.fillStyle='#ffffff90';ctx.beginPath();ctx.roundRect(560,342,130,24,12);ctx.fill();ctx.fillStyle='#92b877';ctx.fillRect(671,348,20,12);ellipse(568+p*113,354,4,7,'#315c4a');ctx.fillStyle='#68805c';ctx.font='10px sans-serif';ctx.fillText('TIMING',584,334);
 }
 if(state==='flight')impact(now-flightAt);
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
