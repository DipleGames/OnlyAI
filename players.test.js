import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three/three.module.min.js';
import {pitcherPose,pitchRelease,solveJoint} from './players.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
test('elbow and knee joints preserve both segment lengths when bending',()=>{
 for(const distance of [.15,.35,.65,.9,.97])for(const bend of [V(0,0,1),V(-1,-1,0)]){
  const a=V(0,0,0),b=V(0,distance,0),joint=solveJoint(a,b,.49,.49,bend);
  assert.ok(Math.abs(a.distanceTo(joint)-.49)<1e-7);
  assert.ok(Math.abs(b.distanceTo(joint)-.49)<1e-7);
 }
});
test('pitch has a leg lift, forward plant, release, follow-through and recovery',()=>{
 const rest=pitcherPose(-1),lift=pitcherPose(.18),release=pitcherPose(pitchRelease),follow=pitcherPose(.66);
 assert.ok(lift.frontFoot.y>rest.frontFoot.y+.4);
 assert.ok(release.frontFoot.z<rest.frontFoot.z-.5);
 assert.ok(release.throwHand.z<lift.throwHand.z-.4);
 assert.ok(follow.throwHand.y<release.throwHand.y-.5);
 assert.ok(follow.backFoot.y>rest.backFoot.y);
 assert.deepEqual(pitcherPose(2),rest);
});
test('pitch joints and releasing hand remain continuous across animation phases',()=>{
 for(const t of [.18,.3,pitchRelease,.66,1.12]){
  const a=pitcherPose(t-1e-6),b=pitcherPose(t+1e-6);
  for(const key of ['shift','throwHand','gloveHand','frontFoot','backFoot'])assert.ok(a[key].distanceTo(b[key])<1e-4,`${key} jumps at ${t}`);
 }
});
