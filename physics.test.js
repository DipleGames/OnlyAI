import test from 'node:test';
import assert from 'node:assert/strict';
import {hitResult} from './physics.js';
test('perfect timing and center contact give maximum distance',()=>assert.equal(hitResult(0,0).distance,155));
test('timing and bat contact each affect distance',()=>{assert.ok(hitResult(.1,0).distance<hitResult(0,0).distance);assert.ok(hitResult(0,30).distance<hitResult(0,0).distance);});
test('outside contact window or bat is a miss',()=>{assert.equal(hitResult(.21,0).distance,0);assert.equal(hitResult(0,55).distance,0);assert.equal(hitResult(-.21,0).distance,0);});
