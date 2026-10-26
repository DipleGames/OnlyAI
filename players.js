import * as THREE from './vendor/three/three.module.min.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const up=V(0,1,0);
const ease=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
export const pitchRelease=.38;
const rest={shift:V(0,.98,0),turn:0,tilt:0,throwHand:V(.16,1.48,-.4),gloveHand:V(-.12,1.48,-.43),frontFoot:V(-.28,.13,-.16),backFoot:V(.28,.13,.18)};
const lift={...rest,turn:-.38,throwHand:V(.16,1.62,-.3),gloveHand:V(-.12,1.62,-.33),frontFoot:V(-.25,.73,-.35)};
const cock={shift:V(0,.98,-.12),turn:-.45,tilt:.03,throwHand:V(.57,2.05,.25),gloveHand:V(-.44,1.66,-.55),frontFoot:V(-.3,.2,-.72),backFoot:rest.backFoot};
const release={shift:V(0,.93,-.22),turn:.22,tilt:-.15,throwHand:V(.35,1.98,-.85),gloveHand:V(-.18,1.47,-.4),frontFoot:V(-.3,.13,-.8),backFoot:rest.backFoot};
const follow={shift:V(.02,.92,-.35),turn:.5,tilt:-.24,throwHand:V(-.18,1.2,-.92),gloveHand:V(-.15,1.4,-.36),frontFoot:release.frontFoot,backFoot:V(.28,.38,.44)};
function blend(a,b,t){return Object.fromEntries(Object.keys(a).map(key=>[key,a[key]?.isVector3?a[key].clone().lerp(b[key],t):THREE.MathUtils.lerp(a[key],b[key],t)]));}
export function pitcherPose(elapsed){
 if(elapsed<0||elapsed>=1.12)return blend(rest,rest,0);
 if(elapsed<.18)return blend(rest,lift,ease(elapsed/.18));
 if(elapsed<.3)return blend(lift,cock,ease((elapsed-.18)/.12));
 if(elapsed<pitchRelease)return blend(cock,release,ease((elapsed-.3)/.08));
 if(elapsed<.66)return blend(release,follow,ease((elapsed-pitchRelease)/.28));
 return blend(follow,rest,ease((elapsed-.66)/.46));
}
// A two-bone joint keeps elbows and knees bent with stable segment lengths.
export function solveJoint(a,b,upper,lower,bend){
 const direction=b.clone().sub(a),distance=Math.max(.0001,direction.length());direction.divideScalar(distance);
 const reach=Math.max(Math.abs(upper-lower)+.0001,Math.min(distance,upper+lower-.0001));
 const along=(upper*upper-lower*lower+reach*reach)/(2*reach);
 let outward=bend.clone().addScaledVector(direction,-bend.dot(direction));
 if(outward.lengthSq()<.0001)outward=V(0,0,1).cross(direction);
 outward.normalize();
 return a.clone().addScaledVector(direction,along).addScaledVector(outward,Math.sqrt(Math.max(0,upper*upper-along*along)));
}
export function createPlayer(scene,{x,z,pitcher=false}){
 const root=new THREE.Group();root.position.set(x,0,z);root.rotation.y=pitcher?Math.PI:0;scene.add(root);
 const body=new THREE.Group();root.add(body);
 const skin=material('#e7b68d'),cloth=material(pitcher?'#d47e58':'#f4efd9'),pants=material('#e9e7d7'),green=material('#285247'),shoeMaterial=material('#253e37'),sock=material('#b76646');
 function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.8,...extra});}
 function add(geometry,mat,parent=body){const m=new THREE.Mesh(geometry,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function ball(parent,position,scale,mat){const m=add(new THREE.SphereGeometry(1,16,10),mat,parent);m.position.copy(position);m.scale.copy(scale);return m;}
 function box(parent,position,size,mat){const m=add(new THREE.BoxGeometry(...size),mat,parent);m.position.copy(position);return m;}
 function segment(parent,top,bottom,mat){return add(new THREE.CylinderGeometry(top,bottom,1,12),mat,parent);}
 function join(m,a,b){m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=a.distanceTo(b);m.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());}
 const torso=add(new THREE.LatheGeometry([[0,.08],[.27,.08],[.31,.3],[.375,.65],[.28,.81],[.15,.84],[0,.84]].map(([x,y])=>new THREE.Vector2(x,y)),16),cloth);torso.scale.z=.73;
 ball(body,V(0,0,0),V(.29,.18,.23),pants);
 const belt=add(new THREE.CylinderGeometry(.28,.28,.07,16),green);belt.position.y=.12;belt.scale.z=.8;
 box(body,V(0,.12,-.225),[.09,.055,.025],material('#c6a16b'));
 const neck=add(new THREE.CylinderGeometry(.11,.13,.18,12),skin);neck.position.y=.87;
 const head=new THREE.Group();head.position.set(0,1.14,-.005);body.add(head);
 ball(head,V(),V(.27,.33,.255),skin);
 for(const side of [-1,1]){ball(head,V(side*.265,-.015,0),V(.055,.085,.04),skin);ball(head,V(side*.092,.025,-.237),V(.022,.031,.018),shoeMaterial);}
 ball(head,V(0,-.045,-.255),V(.042,.055,.045),skin);
 box(head,V(0,-.14,-.224),[.07,.014,.013],material('#9b6a52'));
 const hat=material(pitcher?'#b95f44':'#234c42',{roughness:.55});
 const crown=add(new THREE.SphereGeometry(.292,16,8,0,Math.PI*2,0,Math.PI*.58),hat,head);crown.position.y=.12;
 const brim=ball(head,V(0,.11,-.24),V(.29,.035,.21),hat);
 if(!pitcher)ball(head,V(-.255,-.01,.025),V(.06,.145,.13),hat);
 box(head,V(0,.25,.236),[.045,.065,.025],material('#d9bf84'));
 for(let i=0;i<3;i++)ball(body,V(0,.32+i*.13,-.245),V(.014,.014,.012),green);
 const piping=material(pitcher?'#eedbc0':'#77917c');box(body,V(0,.49,-.253),[.018,.45,.015],piping);
 box(body,V(.08,.48,.252),[.055,.28,.016],green);box(body,V(0,.6,.252),[.2,.055,.016],green);
 const hands=[],arms=[];
 for(const side of [-1,1]){
  const hand=ball(scene,V(),V(.09,.105,.08),pitcher?skin:cloth);
  ball(hand,V(.65,-.15,-.05),V(.32,.55,.5),pitcher?skin:cloth);
  arms.push({side,sleeve:segment(scene,.125,.14,cloth),upper:segment(scene,.095,.115,skin),fore:segment(scene,.075,.095,skin),elbow:ball(scene,V(),V(.095,.095,.095),skin),hand});hands.push(hand);
 }
 if(pitcher){
  const glove=material('#92643e');ball(hands[0],V(0,0,0),V(1.8,1.7,1.2),glove);
  for(let i=0;i<4;i++)ball(hands[0],V(-1.2+i*.7,.9,0),V(.38,1,.7),glove);
  box(hands[0],V(0,.2,-1.15),[2.4,.15,.09],material('#c49b63'));
 }
 const legs=[-1,1].map(side=>{
  const shoe=ball(root,V(),V(.145,.1,.255),shoeMaterial);
  for(let i=0;i<3;i++)box(shoe,V(0,.7,-.35+i*.35),[1,.09,.07],material('#ddd8be'));
  return {side,thigh:segment(root,.16,.19,pants),shin:segment(root,.12,.15,pants),sock:segment(root,.115,.12,sock),knee:ball(root,V(),V(.148,.148,.148),pants),shoe};
 });
 function update(pose,grip=null){
  body.position.copy(pose.shift);body.rotation.set(pose.tilt,pose.turn,0);root.updateMatrixWorld(true);
  for(const leg of legs){
   const foot=leg.side<0?pose.frontFoot:pose.backFoot;
   const hip=V(leg.side*.17,0,0).applyAxisAngle(up,pose.turn*.45).add(pose.shift);
   const ankle=foot.clone().add(V(0,.09,0)),knee=solveJoint(hip,ankle,.49,.49,V(0,0,-1));
   join(leg.thigh,hip,knee);join(leg.shin,knee,ankle);join(leg.sock,ankle.clone().add(V(0,.15,0)),ankle);leg.knee.position.copy(knee);
   leg.shoe.position.copy(foot).add(V(0,-.025,-.07));leg.shoe.rotation.y=leg.side>0?pose.turn*.4:0;
  }
  for(const arm of arms){
   const shoulder=body.localToWorld(V(arm.side*.335,.65,0));
   const hand=grip?grip.clone().add(V(arm.side*.04,0,0)):root.localToWorld((arm.side>0?pose.throwHand:pose.gloveHand).clone());
   const bend=V(arm.side*.65,-.25,.8).transformDirection(root.matrixWorld);
   const elbow=solveJoint(shoulder,hand,.49,.49,bend),cuff=shoulder.clone().lerp(elbow,.5);
   join(arm.sleeve,shoulder,cuff);join(arm.upper,cuff,elbow);join(arm.fore,elbow,hand);arm.elbow.position.copy(elbow);arm.hand.position.copy(hand);
   arm.hand.quaternion.copy(body.getWorldQuaternion(new THREE.Quaternion()));
  }
 }
 function updateBatter(age,bat,now){
  const push=age<0?0:age<.38?ease(age/.38):age<.65?1:1-ease((age-.65)/.45);
  const breathing=age<0?Math.sin(now*2.2)*.008:0;
  update({shift:V(push*.24,.97+breathing,-push*.34),turn:bat.turn,tilt:-.04,frontFoot:V(-.28,.13,-.18-push*.2),backFoot:V(.28,.13+push*.04,.22)},bat.grip);
 }
 function updatePitcher(elapsed){update(pitcherPose(elapsed));}
 function throwingHand(){return hands[1].position.clone();}
 return {root,updateBatter,updatePitcher,throwingHand};
}
