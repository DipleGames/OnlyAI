export const swingContactDelay = .095;
export const bigHitDistance = 120;
export const isBigHit = distance => distance >= bigHitDistance;
const smooth = t => { t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
const ready = { tipX:22, tipY:-62, lean:0, turn:0, gripY:0 };
const contact = { tipX:66, tipY:1, lean:6, turn:-.10, gripY:0 };
const finish = { tipX:83, tipY:-56, lean:13, turn:-.26, gripY:-13 };
function blend(a,b,p){return Object.fromEntries(Object.keys(a).map(key=>[key,a[key]+(b[key]-a[key])*p]));}
export function swingPose(age){
 if(age<0)return {...ready};
 if(age<swingContactDelay)return blend(ready,contact,smooth(age/swingContactDelay));
 // Extend through the ball toward the outfield, keeping the barrel outside the body.
 if(age<.36)return blend(contact,finish,smooth((age-swingContactDelay)/(.36-swingContactDelay)));
 if(age<.62)return {...finish};
 return blend(finish,ready,smooth((age-.62)/.4));
}
