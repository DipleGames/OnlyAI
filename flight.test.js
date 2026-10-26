import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three/three.module.min.js';
import {isTrackedHit,sampleFlight,shotCameraPose,landingTime,shotEndTime} from './flight.js';
test('only good hits of 85m or more trigger the aerial camera',()=>{
 for(const distance of [0,37,84])assert.equal(isTrackedHit({distance}),false);
 for(const distance of [85,120,155])assert.equal(isTrackedHit({distance}),true);
});
test('flight reaches its measured landing point and finishes after the bounce',()=>{
 for(const distance of [37,85,120,155]){
  const o={distance,timing:.9},lane=23,start=sampleFlight(o,lane,0),land=sampleFlight(o,lane,landingTime(o));
  assert.ok(Math.abs(start.position.y-1.45)<1e-8);
  assert.ok(land.position.distanceTo(land.landing)<1e-8);assert.equal(land.landed,true);
  assert.ok(Math.abs(Math.hypot(land.landing.x-start.position.x,land.landing.z)-distance*.5)<1e-8);
  for(let t=0;t<shotEndTime(o);t+=.025)assert.ok(sampleFlight(o,lane,t).position.y>=.15-1e-8);
  assert.ok(shotEndTime(o)>landingTime(o)+.55);
 }
});
test('tracking keeps the ball visible through the camera transition, descent and landing',()=>{
 for(const [width,height] of [[1016,560],[350,520]])for(const distance of [85,155])for(const motion of [false,true]){
  const o={distance,timing:1};
  for(let t=0;t<shotEndTime(o);t+=.05){
   const pose=shotCameraPose(o,30,t,width,motion),camera=new THREE.PerspectiveCamera(pose.fov,width/height,.1,210);
   camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld();
   const screen=sampleFlight(o,30,t).position.project(camera);
   assert.ok(Math.abs(screen.x)<.9&&Math.abs(screen.y)<.85&&screen.z<1&&screen.z>-1,`ball offscreen at ${t}s, ${width}px, reduced motion=${motion}`);
  }
 }
});
