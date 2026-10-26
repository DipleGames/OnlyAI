// Camera return and pitcher preparation are separate phases: the pitch clock starts last.
export const cameraReturnDuration=.65;
export const pitcherReadyDuration=.65;
export function nextPitchPhase(state,phaseStarted,now,reducedMotion=false){
 if(state==='returning'&&now-phaseStarted>=(reducedMotion?0:cameraReturnDuration))return 'ready';
 if(state==='ready'&&now-phaseStarted>=pitcherReadyDuration)return 'pitch';
 return state;
}
