/* هستهٔ پایه: ثوابت، توابع کمکی، موتور انیمیشن و شیء مشترک world */
import * as THREE from 'three';
export {THREE};
export const $=s=>document.querySelector(s);
export const TAU=Math.PI*2, V3=THREE.Vector3, V2=THREE.Vector2, C=THREE.Color;
export const clamp=THREE.MathUtils.clamp, lerp=THREE.MathUtils.lerp;
export const rnd=(a=0,b=1)=>a+Math.random()*(b-a);
export const v3=(x,y,z)=>new V3(x,y,z);
export const easeIO=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
/* حرکت با کمینهٔ پرش (minimum-jerk): شتاب و ترمز نرم و بدون تغییر ناگهانی شتاب */
export const easeMJ=k=>k*k*k*(k*(6*k-15)+10);
export const easeOut=k=>1-Math.pow(1-k,3);
export const lin=k=>k;
export const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
export const FONT='"Vazirmatn","Tahoma",sans-serif';
/* world: renderer، scene، camera، controls و گروه dyn (هرچه در dyn باشد با بازنشانی پاک می‌شود) */
export const world={};
/* به‌روزرسانی‌های هر فریم (حباب، شعله، …): هر تابع با dt (ثانیه) صدا زده می‌شود و با بازنشانی آزمایش پاک می‌شود */
export const updaters=[];
export function addUpdater(fn){updaters.push(fn);return fn;}

/* ================= موتور انیمیشن ================= */
export const tweens=[];
export function tween(dur,fn=()=>{},ease=easeIO){
  return new Promise((res,rej)=>{
    if(dur<=0){fn(1);res();return;}
    tweens.push({t:0,dur,fn,ease,res,rej});
  });
}
export const sleep=s=>tween(s,()=>{},lin);
export function stepTweens(dt){
  const list=tweens.slice();
  for(const tw of list){
    tw.t+=dt;
    const k=Math.min(1,tw.t/tw.dur);
    try{tw.fn(tw.ease(k));}
    catch(e){const i=tweens.indexOf(tw);if(i>=0)tweens.splice(i,1);tw.rej(e);continue;}  // خطای کد آزمایش، حلقهٔ رندر را متوقف نمی‌کند
    if(k>=1){const i=tweens.indexOf(tw);if(i>=0)tweens.splice(i,1);tw.res();}
  }
}
export function moveTo(o,p,dur=1,rot=null,arc=0,ease=easeMJ){
  const p0=o.position.clone(), r0={x:o.rotation.x,y:o.rotation.y,z:o.rotation.z};
  const t=tween(dur,k=>{
    o.position.lerpVectors(p0,p,k);
    if(arc)o.position.y+=Math.sin(Math.PI*k)*arc;
    if(rot)for(const a of ['x','y','z'])if(rot[a]!==undefined)o.rotation[a]=lerp(r0[a],rot[a],k);
  },ease);
  /* گذاشتن روی میز یا کفه: جسم پایین می‌آید و یک جهش بسیار کوچک و میرا می‌کند (ضربه و بازگشت) */
  if(p0.y-p.y>.25&&p.y<1&&!(o.userData&&o.userData.noSettle)){
    const yb=p.y,A=.028;
    return t.then(()=>tween(.34,k=>{o.position.y=k>=1?yb:yb+A*Math.exp(-5.5*k)*Math.abs(Math.sin(k*17));},lin));
  }
  return t;
}
