import * as THREE from './vendor/three/three.module.min.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
export const isTrackedHit=outcome=>(outcome?.distance??0)>=85;
export const flightDuration=outcome=>isTrackedHit(outcome)?3.8:1.6;
export const landingTime=outcome=>.05+flightDuration(outcome);
export const shotEndTime=outcome=>outcome?.distance?landingTime(outcome)+1:1.8;
export function sampleFlight(outcome,lane,elapsed){
 const p=clamp((elapsed-.05)/flightDuration(outcome));
 const origin=V(lane/65,1.45,0);
 const lateral=(outcome.timing-.5)*9;
 const length=Math.max(2,outcome.distance*.5);
 const landing=V(origin.x+lateral,.15,-Math.sqrt(Math.max(0,length*length-lateral*lateral)));
 const position=origin.clone().lerp(landing,p);
 position.y+=Math.sin(p*Math.PI)*(isTrackedHit(outcome)?14+outcome.distance*.035:7);
 const after=elapsed-landingTime(outcome);
 // The bounce stays at the measured landing position so the distance is unambiguous.
 if(after>0&&after<.55)position.y+=Math.sin(after/.55*Math.PI)*.7*(1-after/.55);
 return {position,landing,progress:p,landed:after>=0};
}
export function shotCameraPose(outcome,lane,elapsed,width,reducedMotion=false){
 const {position,landing,progress}=sampleFlight(outcome,lane,elapsed);
 const catcher=V(0,2.8,7),catcherTarget=V(0,1.5,-20);
 const entry=ease((elapsed-.2)/.65);
 let aerial,target;
 if(reducedMotion){
  // A steady wide shot replaces travelling camera motion when motion reduction is enabled.
  const length=Math.abs(landing.z);aerial=V(8,Math.max(32,length*.85),length*.45+15);target=V(landing.x*.5,4,landing.z*.5);
 }else{
  const settle=ease((progress-.8)/.2);
  aerial=position.clone().add(V(8,12,14));
  target=position.clone().lerp(landing,settle*.55);
 }
 const blend=reducedMotion?(elapsed>=.25?1:0):entry;
 return {position:catcher.lerp(aerial,blend),target:catcherTarget.lerp(target,blend),fov:THREE.MathUtils.lerp(width<600?62:46,width<600?64:50,blend)};
}
