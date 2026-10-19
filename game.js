import {hitResult} from './physics.js';
const $ = id => document.getElementById(id);
const canvas=$('field'),ctx=canvas.getContext('2d');
let best=0;try{best=Number(localStorage.getItem('onlyai-best'))||0;}catch{}
$('best').innerHTML=`${best} <small>m</small>`;
let state='idle',start=0,swungAt=-99,flightAt=0,shots=0,lane=0,outcome=null,now=0;
const pitchDuration=1.5,contactTime=1.27;
function action(){
 if(state==='idle'||state==='result'){
  state='pitch';start=performance.now()/1000;swungAt=-99;lane=(Math.random()-.5)*64;outcome=null;
  $('label').textContent='공이 배트에 다가올 때';$('result').textContent='지금이다 싶을 때, 터치!';$('buttonText').textContent='배트 휘두르기';
 }else if(state==='pitch'){
  swungAt=performance.now()/1000;shots++;$('count').textContent=`SWING ${String(shots).padStart(2,'0')}`;
  outcome=hitResult(swungAt-start-contactTime,lane);state='flight';flightAt=swungAt;
  $('label').textContent=outcome.distance?`타이밍 ${Math.round(outcome.timing*100)}% · 중심 ${Math.round(outcome.contact*100)}%`:'조금 더 공을 기다려 보세요';
  $('result').textContent=outcome.grade;$('buttonText').textContent='공이 날아가는 중';
 }
}
$('game').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;action();});$('swing').addEventListener('click',action);
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat){e.preventDefault();action();}});
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function line(x,y,a,b,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();}
function player(x,y,batter=false){
 ellipse(x,y+48,25,7,'#315b3820');
 line(x-7,y+27,x-13,y+45,'#f8faf1',10);line(x+7,y+27,x+15,y+45,'#f8faf1',10);
 line(x-15,y+47,x-6,y+47,'#304a41',7);line(x+12,y+47,x+21,y+47,'#304a41',7);
 ctx.fillStyle=batter?'#f7f8ed':'#e6a153';ctx.beginPath();ctx.roundRect(x-15,y-6,30,39,9);ctx.fill();
 ellipse(x,y-17,14,16,'#efc197');ellipse(x,y-28,17,8,batter?'#315c4a':'#c9704d');
 line(x-16,y-24,x+18,y-24,batter?'#315c4a':'#c9704d',6);
 if(batter){let swing=now-swungAt;let angle=swing>=0&&swing<.32?-1.4+swing*10:-.8;
  let hx=x+15,hy=y+6;line(x-8,y+4,hx,hy,'#efc197',8);line(hx,hy,hx+Math.cos(angle)*65,hy+Math.sin(angle)*65,'#ca965b',9);
 }else{line(x-14,y+4,x-24,y+15,'#efc197',8);ellipse(x-24,y+14,10,11,'#745841');line(x+13,y+3,x+23,y-10,'#efc197',8);}
}
function ball(x,y,r=5){ellipse(x+2,y+3,r,r,'#315b3820');ellipse(x,y,r,r,'#fffdf1');line(x-2,y-r*.6,x+1,y+r*.5,'#d87c65',1.2);}
function frame(ms){now=ms/1000;const rect=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;if(canvas.width!==Math.round(rect.width*dpr)||canvas.height!==Math.round(rect.height*dpr)){canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);}ctx.setTransform(canvas.width/900,0,0,canvas.height/480,0,0);
 ctx.fillStyle='#dcebd6';ctx.fillRect(0,0,900,480);
 // Soft, graphic outfield. No extra players.
 ctx.fillStyle='#c4dcb8';ctx.beginPath();ctx.ellipse(450,420,650,265,0,Math.PI,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#b6d1a9';ctx.lineWidth=1;for(let i=0;i<6;i++){ctx.beginPath();ctx.ellipse(450,420,250+i*75,100+i*35,0,Math.PI,Math.PI*2);ctx.stroke();}
 ctx.fillStyle='#ecdbb7';ctx.beginPath();ctx.moveTo(450,412);ctx.lineTo(210,260);ctx.quadraticCurveTo(450,145,690,260);ctx.closePath();ctx.fill();
 ctx.fillStyle='#bdd3a3';ctx.beginPath();ctx.moveTo(450,361);ctx.lineTo(316,268);ctx.lineTo(450,210);ctx.lineTo(584,268);ctx.closePath();ctx.fill();
 line(450,388,157,211,'#fff9e9',2);line(450,388,743,211,'#fff9e9',2);
 ellipse(450,268,42,15,'#e8d2a7');line(440,268,460,268,'#fff9eb',4);
 ctx.fillStyle='#fff8e7';ctx.beginPath();ctx.moveTo(440,383);ctx.lineTo(460,383);ctx.lineTo(460,391);ctx.lineTo(450,399);ctx.lineTo(440,391);ctx.closePath();ctx.fill();
 ctx.setLineDash([4,5]);ctx.strokeStyle='#bcab88';ctx.strokeRect(375,355,40,48);ctx.setLineDash([]);
 player(450,222);player(397,341,true);
 const elapsed=now-start;
 if(state==='pitch'){
  const p=Math.min(elapsed/contactTime,1.2);const x=472+(447+lane-472)*p,y=217+160*p;
  line(x,y,x+2,y-16,'#ffffff70',3);ball(x,y,3+3*p);
  if(elapsed>pitchDuration){outcome={distance:0};state='result';$('label').textContent='공이 지나갔어요';$('result').textContent='다음 공을 노려보세요';$('buttonText').textContent='다시 도전';}
 }else if(state==='flight'){
  const t=now-flightAt;if(outcome.distance){let p=Math.min(t/1.6,1);let x=450+lane+(outcome.timing-.5)*170*p,y=377-230*p-130*Math.sin(Math.PI*p);line(x,y,x-5,y+15,'#ffffffaa',3);ball(x,y,6-p*3);}
  if(t>1.7){state='result';if(outcome.distance>best){best=outcome.distance;try{localStorage.setItem('onlyai-best',String(best));}catch{}$('best').innerHTML=`${best} <small>m</small>`;}$('result').textContent=outcome.distance?`${outcome.distance} m · ${outcome.grade}`:'헛스윙!';$('buttonText').textContent='다시 도전';}
 }else if(state==='idle'){ball(473,211,4);}
 if(state==='pitch'){
  const p=Math.min(elapsed/contactTime,1);ctx.fillStyle='#ffffff90';ctx.beginPath();ctx.roundRect(560,342,130,24,12);ctx.fill();ctx.fillStyle='#92b877';ctx.fillRect(653,348,20,12);ellipse(568+p*113,354,4,7,'#315c4a');ctx.fillStyle='#68805c';ctx.font='10px sans-serif';ctx.fillText('TIMING',584,334);
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
