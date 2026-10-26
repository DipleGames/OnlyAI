import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three/three.module.min.js';
import {configureCatcherCamera} from './scene.js';
for(const [width,height] of [[1016,560],[350,520],[280,520]]){
 test(`catcher view keeps pitcher and strike zone centered at ${width}px`,()=>{
  const camera=new THREE.PerspectiveCamera();configureCatcherCamera(camera,width,height);
  const pitcher=new THREE.Vector3(0,1.5,-20).project(camera);
  const zone=new THREE.Vector3(0,1.45,0).project(camera);
  assert.ok(Math.abs(pitcher.x)<.01);assert.ok(Math.abs(zone.x)<.01);
  assert.ok(pitcher.y>zone.y,'pitcher must appear above the nearby strike zone');
  assert.ok(Math.abs(zone.y)<.7,'strike zone must stay above the bottom controls');
  const head=new THREE.Vector3(-1.55,2.6,.7).project(camera);
  const feet=new THREE.Vector3(-1.55,0,.7).project(camera);
  for(const point of [head,feet]){assert.ok(point.x>-.95&&point.x<-.15,'batter must be visible left of the zone');assert.ok(Math.abs(point.y)<1);}
 });
}
