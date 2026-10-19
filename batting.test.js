import test from 'node:test';
import assert from 'node:assert/strict';
import {swingContactDelay,isBigHit} from './batting.js';
import {batPose} from './scene.js';
test('3D follow-through extends the hands and barrel toward the pitcher',()=>{
 let previous=batPose(swingContactDelay);
 for(let t=swingContactDelay+.01;t<.38;t+=.01){const pose=batPose(t);assert.ok(pose.grip.z<=previous.grip.z);assert.ok(pose.tip.z<=previous.tip.z);previous=pose;}
});
test('3D bat crosses the ball contact point at impact',()=>{
 const {grip,tip}=batPose(swingContactDelay);
 const p=grip.clone().lerp(tip,-grip.x/(tip.x-grip.x));
 assert.ok(Math.abs(p.z)<.03);assert.ok(Math.abs(p.y-1.45)<.03);
});
test('3D swing stages are continuous and recover to ready position',()=>{
 for(const t of [swingContactDelay,.38,.65,1.1]){const a=batPose(t-1e-6),b=batPose(t+1e-6);assert.ok(a.grip.distanceTo(b.grip)<.001);assert.ok(a.tip.distanceTo(b.tip)<.001);assert.ok(Math.abs(a.turn-b.turn)<.001);}
 assert.deepEqual(batPose(2),batPose(-1));
});
test('big hit effects start at 120m and exclude misses and regular hits',()=>{
 assert.equal(isBigHit(0),false);assert.equal(isBigHit(119),false);assert.equal(isBigHit(120),true);assert.equal(isBigHit(155),true);
});
