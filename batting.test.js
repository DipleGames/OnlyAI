import test from 'node:test';
import assert from 'node:assert/strict';
import {swingPose,swingContactDelay,isBigHit} from './batting.js';
test('follow-through extends the barrel away from the batter toward the pitcher',()=>{
 const contact=swingPose(swingContactDelay);
 let previous=contact;
 for(let t=swingContactDelay+.01;t<.37;t+=.01){const pose=swingPose(t);assert.ok(pose.tipX>=previous.tipX);assert.ok(pose.tipY+pose.gripY<=previous.tipY+previous.gripY);previous=pose;}
 assert.ok(previous.lean>contact.lean);
});
test('swing stages are continuous and recover to the ready stance',()=>{
 for(const t of [swingContactDelay,.36,.62,1.02]){const a=swingPose(t-1e-6),b=swingPose(t+1e-6);for(const k of Object.keys(a))assert.ok(Math.abs(a[k]-b[k])<.001);}
 assert.deepEqual(swingPose(2),swingPose(-1));
});
test('big hit effects start at 120m and exclude misses and regular hits',()=>{
 assert.equal(isBigHit(0),false);assert.equal(isBigHit(119),false);assert.equal(isBigHit(120),true);assert.equal(isBigHit(155),true);
});
