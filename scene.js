import * as THREE from './vendor/three/three.module.min.js';
import { swingContactDelay, isBigHit } from './batting.js';
import {isTrackedHit,sampleFlight,shotCameraPose,landingTime} from './flight.js';
import {cameraReturnDuration} from './pitch-cycle.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const ease=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const mix=(a,b,t)=>a.clone().lerp(b,t);
const contact=V(0,1.45,0);
const moundZ=-20;
export function configureCatcherCamera(camera,width,height){
 // Centerline view from behind home plate. Keep the zone clear of the batter at left.
 camera.aspect=width/height;
 camera.fov=width<600?62:46;
 camera.position.set(0,2.8,7);
 camera.lookAt(0,1.5,moundZ);
 camera.updateProjectionMatrix();
 camera.updateMatrixWorld();
}
// The hand and barrel positions move through the hitting plane, then toward the pitcher (-Z).
export function batPose(age){
 const ready={grip:V(-1.48,1.63,.92),tip:V(-1.9,2.95,1.45),turn:-.22};
 const hit={grip:V(-.98,1.43,.23),tip:V(.86,1.47,-.18),turn:.22};
 const finish={grip:V(-.5,1.8,-.48),tip:V(.62,2.95,-1.65),turn:.8};
 if(age<0||age>=1.1)return ready;
 let a,b,t;
 if(age<swingContactDelay){a=ready;b=hit;t=ease(age/swingContactDelay);}
 else if(age<.38){a=hit;b=finish;t=ease((age-swingContactDelay)/(.38-swingContactDelay));}
 else if(age<.65)return finish;
 else {a=finish;b=ready;t=ease((age-.65)/.45);}
 return {grip:mix(a.grip,b.grip,t),tip:mix(a.tip,b.tip,t),turn:THREE.MathUtils.lerp(a.turn,b.turn,t)};
}
export function createField(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#c7e4df');scene.fog=new THREE.Fog('#c7e4df',75,150);
 const camera=new THREE.PerspectiveCamera(46,1,.1,210);
 scene.add(new THREE.HemisphereLight(0xfff6de,0x648c80,2.7));
 const sun=new THREE.DirectionalLight(0xffefd0,3.2);sun.position.set(-8,17,7);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:90});sun.shadow.normalBias=.035;sun.shadow.bias=-.0001;scene.add(sun);
 const materials=new Map();
 function mat(color,extra={}){const key=color+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.8,flatShading:true,...extra}));return materials.get(key);}
 function mesh(geometry,color,parent=scene,extra={}){const m=new THREE.Mesh(geometry,mat(color,extra));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(x,y,z,w,h,d,color,parent=scene){const m=mesh(new THREE.BoxGeometry(w,h,d),color,parent);m.position.set(x,y,z);return m;}
 function sphere(x,y,z,r,color,parent=scene){const m=mesh(new THREE.IcosahedronGeometry(r,1),color,parent);m.position.set(x,y,z);return m;}
 function cylinder(x,y,z,rt,rb,h,color,parent=scene,segments=8){const m=mesh(new THREE.CylinderGeometry(rt,rb,h,segments),color,parent);m.position.set(x,y,z);return m;}
 const up=V(0,1,0);
 function bone(radius,color,parent=scene){return mesh(new THREE.CylinderGeometry(radius,radius,1,8),color,parent);}
 function join(m,a,b){m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=a.distanceTo(b);m.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());}
 function stripe(a,b,width,color,y=.03){const m=box(0,0,0,width,.025,1,color);joinGround(m,a,b,y);return m;}
 function joinGround(m,a,b,y){m.position.set((a.x+b.x)/2,y,(a.z+b.z)/2);m.scale.z=a.distanceTo(b);m.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);}
 // Striped turf and diamond are real horizontal meshes receiving player shadows.
 const grass=mesh(new THREE.PlaneGeometry(200,200),'#93b479');grass.rotation.x=-Math.PI/2;grass.position.set(0,-.06,-35);grass.castShadow=false;
 for(let i=0;i<26;i++)box(0,-.04,-91+i*4,170,.02,4,i%2?'#99b982':'#a3bf88');
 const diamond=mesh(new THREE.PlaneGeometry(28.9,28.9),'#e6c49a');diamond.rotation.x=-Math.PI/2;diamond.rotation.z=Math.PI/4;diamond.position.set(0,.005,-18);
 const inner=mesh(new THREE.PlaneGeometry(20.1,20.1),'#9fb982');inner.rotation.x=-Math.PI/2;inner.rotation.z=Math.PI/4;inner.position.set(0,.012,-18);
 cylinder(0,.015,moundZ,1.55,1.55,.1,'#e8c99f',scene,24);box(0,.08,moundZ,.7,.025,.15,'#fff8df');
 cylinder(0,.017,0,2.75,2.75,.06,'#e5c299',scene,32);
 stripe(V(0,0,0),V(-60,0,-60),.09,'#fff9df');stripe(V(0,0,0),V(60,0,-60),.09,'#fff9df');
 for(const x of [-18,18]){const base=box(x,.08,-18,.65,.1,.65,'#fff9df');base.rotation.y=Math.PI/4;}box(0,.08,-36,.65,.1,.65,'#fff9df');
 const plateShape=new THREE.Shape();plateShape.moveTo(-.42,-.3);plateShape.lineTo(.42,-.3);plateShape.lineTo(.42,.13);plateShape.lineTo(0,.48);plateShape.lineTo(-.42,.13);plateShape.closePath();
 const plate=mesh(new THREE.ShapeGeometry(plateShape),'#fff8e6');plate.rotation.x=-Math.PI/2;plate.position.set(0,.065,.35);
 // Batter's box stays on the ground; the strike zone stands above the plate.
 for(const x of [-2.5,-.65])stripe(V(x,0,-.85),V(x,0,1.65),.045,'#fff2d5');
 for(const z of [-.85,1.65])stripe(V(-2.5,0,z),V(-.65,0,z),.045,'#fff2d5');
 const zone=new THREE.Group();scene.add(zone);const zoneMaterial=new THREE.LineBasicMaterial({color:0xfff4d0,transparent:true,opacity:.7});
 const points=[];for(let i=0;i<4;i++){const x=-.62+i*1.24/3,y=.85+i*1.18/3;points.push(V(x,.85,0),V(x,2.03,0),V(-.62,y,0),V(.62,y,0));}
 const grid=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),zoneMaterial);zone.add(grid);
 // Outfield wall, faceted trees and empty bleachers. Only two people on the field.
 for(let i=0;i<41;i++){
  const angle=-Math.PI/3+i*Math.PI/60,x=Math.sin(angle)*70,z=-Math.cos(angle)*70;
  const wall=box(x,1.8,z,3.85,3.6,.8,i%2?'#3d7567':'#447d6a');wall.rotation.y=-angle;
  const rail=box(x,3.67,z,3.87,.14,.95,'#e8c87d');rail.rotation.y=-angle;
 }
 for(const side of [-1,1]){
  cylinder(side*49.5,5.5,-49.5,.1,.1,11,'#edc961');
  for(let row=0;row<5;row++)box(side*(37+row*.9),.6+row*.7,-29,2.3,.4,28,row%2?'#c9d9c6':'#e1dfc2');
 }
 for(let i=0;i<35;i++){
  const angle=-Math.PI/3+i*Math.PI/51,radius=91+(i%3)*2,x=Math.sin(angle)*radius,z=-Math.cos(angle)*radius,height=3+(i%4)*.8;
  cylinder(x,height/2,z,.2,.3,height,'#8b7959');const crown=sphere(x,height+1,z,2.3+(i%3)*.3,i%2?'#72a489':'#87b096');crown.scale.y=1.3;
 }
 // Faceted mascot-like characters, built from articulated low-poly meshes.
 function avatar(x,z,jersey,helmet=false){
  const root=new THREE.Group();root.position.set(x,0,z);scene.add(root);
  const body=new THREE.Group();root.add(body);body.position.y=1.1;
  const shirt=cylinder(0,.2,0,.34,.29,.72,jersey,body);shirt.scale.z=.78;
  box(0,.46,-.23,.12,.12,.04,'#fff0c7',body);box(0,-.12,0,.58,.09,.45,'#2e5149',body);box(0,-.12,-.24,.1,.07,.025,'#e9c16c',body);
  for(let i=0;i<3;i++)sphere(0,.11+i*.12,-.26,.018,'#b7b6a0',body);
  // Raised jersey number on the back, visible from the batting camera.
  box(.09,.22,.245,.07,.3,.025,helmet?'#376653':'#fff1ce',body);
  box(0,.36,.245,.24,.07,.025,helmet?'#376653':'#fff1ce',body);
  const head=sphere(0,.96,0,.34,'#efbe91',body);head.scale.set(.9,1.12,.94);
  sphere(-.3,.95,0,.085,'#e9ae7f',body);sphere(.3,.95,0,.085,'#e9ae7f',body);
  const cap=mesh(new THREE.SphereGeometry(.35,10,5,0,Math.PI*2,0,Math.PI*.55),helmet?'#254e45':'#d7694a',body);cap.position.y=1.11;cap.scale.z=1.06;
  box(0,1.08,-.28,.52,.07,.4,helmet?'#254e45':'#d7694a',body);
  if(helmet)box(-.29,.98,.015,.1,.29,.27,'#254e45',body);
  for(const ex of [-.11,.11])sphere(ex,.99,-.295,.028,'#2e423e',body);
  sphere(0,.91,-.33,.045,'#dc9f77',body);box(0,.8,-.28,.1,.018,.02,'#a76e54',body);
  const arms=[-1,1].map(side=>({side,upper:bone(.105,jersey),fore:bone(.085,'#efbe91'),hand:sphere(0,0,0,.105,helmet?'#fff4db':'#efbe91')}));
  if(!helmet){const glove=sphere(0,0,0,.23,'#9a6c3d',arms[0].hand);glove.scale.set(1,.9,.6);for(let i=0;i<3;i++)box(-.1+i*.1,.01,-.12,.025,.26,.025,'#e1b67b',glove);}
  const legs=[-1,1].map(side=>({side,thigh:bone(.15,'#f8f0d9',root),shin:bone(.125,'#f8f0d9',root),sock:bone(.13,'#d77450',root),shoe:box(0,0,0,.29,.16,.47,'#29463e',root)}));
  function limbPose(turn,grip,wind=0){
   body.rotation.y=turn;body.position.x=helmet?turn*.09:0;
   for(const leg of legs){const side=leg.side,foot=V(side*.28,.15,side<0?.23:-.02);if(!helmet&&side<0)foot.y+=wind*.6;
    const hip=V(side*.18,1,0),knee=V(side*.3,.58,.14);if(!helmet&&side<0)knee.y+=wind*.25;
    join(leg.thigh,hip,knee);join(leg.shin,knee,foot);join(leg.sock,foot.clone().add(V(0,.15,0)),foot);leg.shoe.position.copy(foot).add(V(0,-.03,-.08));}
   root.updateMatrixWorld(true);body.updateMatrixWorld(true);
   for(const arm of arms){const shoulder=body.localToWorld(V(arm.side*.3,.44,0));
    let hand;if(helmet)hand=grip.clone().add(V(arm.side*.05,0,0));else hand=root.localToWorld(arm.side<0?V(-.2,1.48,-.5):V(.45,1.6+wind*.65,-.05+wind*.6));
    const elbow=mix(shoulder,hand,.48).add(V(arm.side*.12,-.17,.18));join(arm.upper,shoulder,elbow);join(arm.fore,elbow,hand);arm.hand.position.copy(hand);}
  }
  return {root,body,limbPose};
 }
 const batter=avatar(-1.55,.7,'#fff4da',true),pitcher=avatar(0,moundZ,'#dc8059');pitcher.root.rotation.y=Math.PI;
 const batHandle=bone(.055,'#5d4830'),batBarrel=mesh(new THREE.CylinderGeometry(.11,.065,1,9),'#dfac60');
 const baseball=sphere(0,0,0,.13,'#fff9e5');const seam=mesh(new THREE.TorusGeometry(.127,.009,4,14),'#cb654a',baseball);seam.rotation.x=.5;
 const ballShadow=mesh(new THREE.CircleGeometry(.18,12),'#355744',scene,{transparent:true,opacity:.17,depthWrite:false});ballShadow.rotation.x=-Math.PI/2;ballShadow.position.y=.07;ballShadow.castShadow=false;
 const trailMaterial=new THREE.LineBasicMaterial({color:0xffe5a0,transparent:true,opacity:.85});
 const trail=new THREE.Line(new THREE.BufferGeometry(),trailMaterial);scene.add(trail);
 const rings=Array.from({length:3},()=>{const r=mesh(new THREE.TorusGeometry(1,.022,5,40),'#ffe082',scene,{transparent:true,opacity:1,emissive:'#d58b27',emissiveIntensity:.5});r.castShadow=false;return r;});
 const sparks=Array.from({length:48},(_,i)=>{const m=box(0,0,0,.065,.12,.045,['#ffcd61','#fff1bd','#e98757','#85c2a1'][i%4]);m.castShadow=false;return m;});
 const ballHalo=new THREE.Mesh(new THREE.RingGeometry(.17,.21,24),new THREE.MeshBasicMaterial({color:'#ffd466',transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));scene.add(ballHalo);
 const landingRing=mesh(new THREE.RingGeometry(.85,1,48),'#ffe29c',scene,{transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false});
 landingRing.rotation.x=-Math.PI/2;landingRing.castShadow=false;
 const landingDot=mesh(new THREE.CircleGeometry(.18,16),'#fff6cd');landingDot.rotation.x=-Math.PI/2;landingDot.castShadow=false;
 let lastWidth=0,lastHeight=0,lastTrackedPose=null;

 function render({now,state,start,phaseStarted,swungAt,flightAt,outcome,lane,contactTime,reducedMotion}){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(w!==lastWidth||h!==lastHeight){lastWidth=w;lastHeight=h;renderer.setSize(w,h,false);configureCatcherCamera(camera,w,h);}
  camera.position.set(0,2.8,7);camera.lookAt(0,1.5,moundZ);camera.fov=w<600?62:46;
  const t=now-flightAt,big=isBigHit(outcome?.distance??0),age=now-swungAt,pose=batPose(age);
  const tracked=isTrackedHit(outcome)&&(state==='flight'||state==='result')&&t>=0;
  if(tracked){
   const shot=shotCameraPose(outcome,lane,t,w,reducedMotion);
   camera.position.copy(shot.position);camera.lookAt(shot.target);camera.fov=shot.fov;lastTrackedPose=shot;
  }else if(lastTrackedPose){
   const blend=state==='returning'&&!reducedMotion?ease((now-phaseStarted)/cameraReturnDuration):1;
   camera.position.copy(mix(lastTrackedPose.position,V(0,2.8,7),blend));
   camera.lookAt(mix(lastTrackedPose.target,V(0,1.5,moundZ),blend));
   camera.fov=THREE.MathUtils.lerp(lastTrackedPose.fov,w<600?62:46,blend);
   if(blend>=1)lastTrackedPose=null;
  }
  camera.updateProjectionMatrix();
  if(state==='flight'&&outcome?.distance&&t>=0&&t<.22&&!reducedMotion){const amount=(big?.12:.065)*(1-t/.22);camera.position.x+=Math.sin(t*140)*amount;camera.position.y+=Math.cos(t*170)*amount;}
  batter.limbPose(pose.turn,pose.grip);
  const wind=state==='pitch'?Math.sin(Math.min(1,(now-start)/.38)*Math.PI):0;
  pitcher.limbPose(-wind*.4,null,wind);
  const handleEnd=mix(pose.grip,pose.tip,.22);join(batHandle,pose.grip,handleEnd);join(batBarrel,handleEnd,pose.tip);
  zoneMaterial.opacity=state==='pitch'?.65:.22;
  const pitch=()=>{
   const elapsed=now-start,release=.38;
   if(elapsed<release)return pitcher.root.localToWorld(V(.45,1.6+wind*.65,-.05+wind*.6));
   const p=Math.min((elapsed-release)/(contactTime+swingContactDelay-release),1.3);
   return V(-.45+(lane/65+.45)*p,1.6+(1.45-1.6)*p+Math.sin(p*Math.PI)*.35,moundZ+.05-(moundZ+.05)*p);
  };
  let position=null,shot=null;
  if(state==='pitch'||(state==='flight'&&(t<0||(!outcome?.distance&&now-start<1.65))))position=pitch();
  else if((state==='flight'||state==='result')&&outcome?.distance&&t>=0){
   shot=sampleFlight(outcome,lane,t);position=shot.position;
   const vertices=[];for(let i=0;i<22;i++)vertices.push(sampleFlight(outcome,lane,Math.max(0,t-i*.025)).position);
   trail.geometry.dispose();trail.geometry=new THREE.BufferGeometry().setFromPoints(vertices);trailMaterial.color.set(big?'#ffd45b':'#fff5ca');
  }else if(['idle','returning','ready'].includes(state))position=pitcher.root.localToWorld(V(.45,1.6,-.05));
  baseball.visible=ballShadow.visible=!!position;trail.visible=state==='flight'&&outcome?.distance>0&&t>=0&&!shot?.landed;
  if(position){baseball.position.copy(position);baseball.rotation.z=now*12;ballShadow.position.set(position.x,.09,position.z);ballShadow.scale.setScalar(Math.max(.4,1-position.y/30));}
  landingRing.visible=landingDot.visible=!!shot&&isTrackedHit(outcome);
  if(landingRing.visible){
   landingRing.position.set(shot.landing.x,.095,shot.landing.z);landingDot.position.set(shot.landing.x,.1,shot.landing.z);
   const after=Math.max(0,t-landingTime(outcome));landingRing.scale.setScalar(shot.landed?1+Math.min(after,1)*1.4:1);
   landingRing.material.opacity=shot.landed?Math.max(.4,1-after*.5):.55;
  }
  ballHalo.visible=tracked&&!!position&&!shot?.landed;
  if(ballHalo.visible){ballHalo.position.copy(position);ballHalo.quaternion.copy(camera.quaternion);}
  const effect=state==='flight'&&outcome?.distance&&t>=0&&t<(big?1.3:.5);
  for(let i=0;i<rings.length;i++){const r=rings[i],age=t-i*.09;r.visible=!!effect&&age>=0&&(big||i===0);if(!r.visible)continue;
   r.position.set(lane/65,1.45,0);r.scale.setScalar(.15+age*(big?5:3));r.material=mat('#ffe082',{transparent:true,emissive:'#d58b27',emissiveIntensity:.5});r.material.opacity=Math.max(0,1-t/(big?1.3:.5));}
  sparks.forEach((m,i)=>{m.visible=!!effect&&i<(big?(reducedMotion?12:48):12);if(!m.visible)return;const angle=i*2.39996,speed=(big?3.7:2)*(1+(i%4)*.2);m.position.set(lane/65+Math.cos(angle)*t*speed,1.45+Math.sin(angle)*t*speed+2*t-3*t*t,Math.sin(i*7)*t*speed);m.rotation.set(t*4+i,t*3,i);m.scale.setScalar(big?1.5:1);});
  renderer.render(scene,camera);
 }
 return {render};
}
