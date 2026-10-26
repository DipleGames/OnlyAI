import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraReturnDuration,pitcherReadyDuration,nextPitchPhase} from './pitch-cycle.js';
test('pitch cannot begin during camera return, even after a delayed frame',()=>{
 for(const elapsed of [.1,cameraReturnDuration-.001])assert.equal(nextPitchPhase('returning',10,10+elapsed),'returning');
 assert.equal(nextPitchPhase('returning',10,10+cameraReturnDuration),'ready');
 assert.equal(nextPitchPhase('returning',10,100),'ready');
});
test('a complete preparation pause is required after the camera returns',()=>{
 const readyAt=12;
 assert.equal(nextPitchPhase('ready',readyAt,readyAt+pitcherReadyDuration-.001),'ready');
 assert.equal(nextPitchPhase('ready',readyAt,readyAt+pitcherReadyDuration),'pitch');
 assert.equal(nextPitchPhase('pitch',readyAt,100),'pitch');
});
test('reduced motion skips travel but preserves pitcher preparation',()=>{
 assert.equal(nextPitchPhase('returning',10,10,true),'ready');
 assert.equal(nextPitchPhase('ready',10,10,true),'ready');
 assert.equal(nextPitchPhase('ready',10,10+pitcherReadyDuration,true),'pitch');
});
