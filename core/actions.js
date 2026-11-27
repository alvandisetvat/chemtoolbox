import {THREE,$,TAU,V3,V2,C,clamp,lerp,rnd,v3,easeIO,easeOut,lin,fa,FONT,world,tweens,tween,sleep,moveTo} from './kernel.js';
import {TR,TH,TW,TI,RL,CY,SLOT_X,RACK_Y,WATER,NAOHC,WASH_TIP} from './glassware.js';
import {stream,dropMesh,setStream,spawnDebris,updateDebris,clearDebris,debris} from './fx.js';
import {spoon,dropper,wash,tools,SPOON_REST,SPOON_REST_ROT,DROP_REST,DROP_REST_ROT,WASH_REST} from './tools.js';
import {camTo} from './world.js';
import {hud} from './ui.js';
import {S} from './state.js';
export const mouthWorld=t=>v3(t.group.position.x,t.group.position.y+(t.H||TH),t.group.position.z);

export async function spoonHome(){
  await moveTo(spoon,SPOON_REST,1.3,{...SPOON_REST_ROT},1.4);
  spoon.holder.visible=false;spoon.holder.scale.setScalar(1);
}
export async function pourSpoon(tube,hex,amount){
  const tp=tube.group.position;
  await moveTo(spoon,v3(tp.x,tp.y+(tube.H||TH)+.6,tp.z+.04),1.4,{x:-.5,y:.12,z:0},1.1);
  let em=0;
  await tween(1.1,k=>{
    spoon.rotation.z=-1.55*k;
    const want=Math.floor(k*amount);
    if(want>em){tube.solid.spawn(want-em,spoon.position.y-tp.y-.05,.06,hex,-.4,spoon.position.x-tp.x,spoon.position.z-tp.z);em=want;}
    spoon.holder.scale.setScalar(Math.max(.001,1-k));
  },lin);
  await sleep(.4);
  spoon.holder.visible=false;
  await spoonHome();
}
export async function scoopInto(jar,tube,hex,amount=260,lidPos=null){
  await camTo('overview');
  const jp=jar.group.position,lid=jar.lid,lid0=lid.position.clone(),side=jp.x<0?-1:1;
  await moveTo(lid,lidPos||v3(side*1.0,.11,.95),1.1,{x:0,y:0,z:0},1.1);
  await moveTo(spoon,v3(jp.x,1.9,jp.z),1.3,{x:-.75,y:.3,z:0},1.0);
  await moveTo(spoon,v3(jp.x,.97,jp.z+.02),.8);
  spoon.mound.material.color.setHex(hex);spoon.holder.visible=true;spoon.holder.scale.setScalar(1);
  await sleep(.3);
  await moveTo(spoon,v3(jp.x,1.9,jp.z),.8);
  await moveTo(lid,lid0,1.0,{x:0,y:0,z:0},.9);
  await pourSpoon(tube,hex,amount);
}
export async function pourWater(tube,target,cam='rack'){
  const tp=tube.group.position,mp=mouthWorld(tube);
  await camTo(cam);
  const py=Math.max(0,mp.y+.65-WASH_TIP.y),tipY=py+WASH_TIP.y,pos=v3(tp.x,py,tp.z-WASH_TIP.x);   // کف شیشه نباید زیر میز برود
  await moveTo(wash,pos,1.6,null,1.0);
  const l0=tube.level;
  await tween(2.2,k=>{
    tube.addLiquid(lerp(l0,target,k)-tube.level,WATER,0);
    wash.body.scale.set(1+.03*Math.sin(k*60),1,1+.03*Math.sin(k*60));
    setStream(tp.x,tipY,tp.y+Math.max(tube.level,.06),tp.z);
  },lin);
  stream.visible=false;wash.body.scale.set(1,1,1);
  await moveTo(wash,WASH_REST,1.6,null,1.0);
}
export async function shake(tube,onK,dur=2.6){
  const g=tube.group,r=tube.rest,h=TH*.8,LIFT=1.85;   // LIFT: انتهای لوله باید بالاتر از صفحهٔ رک (y≈۱٫۷۴) برود تا هنگام تکان‌دادن از آن رد نشود
  await moveTo(g,v3(r.x,r.y+LIFT,r.z),.9);
  tube.agitTarget=1;
  await tween(dur,k=>{
    const env=Math.min(1,k*6,(1-k)*6),th=Math.sin(k*dur*14)*.2*env;
    g.rotation.z=th;g.position.x=r.x+h*Math.sin(th);g.position.y=r.y+LIFT+h*(1-Math.cos(th));
    if(onK)onK(k);
  },lin);
  tube.agitTarget=0;g.rotation.z=0;g.position.set(r.x,r.y+LIFT,r.z);
  await moveTo(g,r,.9);
}

/* ---- قطره‌چکان ---- */
/* ارتفاع امن (نوک قطره‌چکان): بالاتر از دهانهٔ همهٔ لوله‌ها و ظرف‌های روی میز */
export function dropperSafeY(){
  let y=4.2;
  for(const t of S.tubes)if(t)y=Math.max(y,t.group.position.y+(t.H||TH)+.9);
  for(const v of S.vessels)if(v)y=Math.max(y,v.group.position.y+(v.H||TH)+.9);
  return y;
}
/* قطره‌چکان هرگز از میان ظرف‌ها نمی‌گذرد: اگر مقصد دورتر از ۰٫۳ است، اول مستقیم بالا می‌رود، در ارتفاع امن جابه‌جا می‌شود و بعد مستقیم پایین می‌آید. */
export async function dropperTo(pos,dur=1.2,rot={x:0,y:0,z:.1},arc=.8){
  const g=dropper.group,p0=g.position.clone(),sy=dropperSafeY();
  const flat=Math.hypot(pos.x-p0.x,pos.z-p0.z);
  if(flat<.3){await moveTo(g,pos,dur,rot,Math.min(arc,.3));return;}
  const a=v3(p0.x,Math.max(p0.y,sy),p0.z),b=v3(pos.x,Math.max(pos.y,sy),pos.z);
  const L1=a.distanceTo(p0),L2=a.distanceTo(b),L3=b.distanceTo(pos),L=Math.max(L1+L2+L3,.001);
  const r0={x:g.rotation.x,y:g.rotation.y,z:g.rotation.z};
  await tween(dur*1.15,k=>{
    const d=k*L;
    if(d<=L1)g.position.lerpVectors(p0,a,L1?d/L1:1);
    else if(d<=L1+L2)g.position.lerpVectors(a,b,L2?(d-L1)/L2:1);
    else g.position.lerpVectors(b,pos,L3?(d-L1-L2)/L3:1);
    for(const q of ['x','y','z'])if(rot[q]!==undefined)g.rotation[q]=lerp(r0[q],rot[q],k);
  });
}
export async function squeezeBulb(from,to,dur){await tween(dur,k=>dropper.setBulb(lerp(from,to,k)),lin);}
export async function fetchFrom(src,dv){
  const d=dropper,mp=mouthWorld(src);
  d.setFill(0);d.setLiquid(src.dispColor(),src.alpha);
  await dropperTo(v3(mp.x,mp.y+.9,mp.z),1.3);
  await squeezeBulb(1,.72,.4);
  await moveTo(d.group,v3(mp.x,src.group.position.y+Math.max(.28,src.level*.55),mp.z),.9);
  const l0=src.level;
  await tween(1.0,k=>{d.setBulb(lerp(.72,1,k));d.setFill(k);src.level=l0-dv*k;src.dirty=true;},easeOut);
  await sleep(.25);
  await moveTo(d.group,v3(mp.x,mp.y+.9,mp.z),.9);
}
export async function fetchFromBottle(b,col,alpha){
  const d=dropper,bp=b.group.position;
  d.setFill(0);d.setLiquid(col,alpha);
  await dropperTo(v3(bp.x,3.0,bp.z),1.4);
  await squeezeBulb(1,.72,.4);
  await moveTo(d.group,v3(bp.x,.55,bp.z),1.0);
  await tween(1.0,k=>{d.setBulb(lerp(.72,1,k));d.setFill(k);},easeOut);
  await sleep(.25);
  await moveTo(d.group,v3(bp.x,3.0,bp.z),1.0);
}
export async function pourFromDropper(dest,dv){
  const d=dropper,mp=mouthWorld(dest),tp=dest.group.position;
  await dropperTo(v3(mp.x,mp.y+.55,mp.z),1.3);
  const f0=d.fill;
  await tween(1.4,k=>{
    d.setBulb(lerp(1,.7,k));d.setFill(f0*(1-k));
    const add=dv*k-(dest._added||0);dest.addLiquid(add,d.liqColor,d.liqAlpha);dest._added=dv*k;
    setStream(mp.x,mp.y+.52,tp.y+Math.max(dest.level,.06),mp.z,.02,d.liqColor,.7);
  },lin);
  dest._added=0;stream.visible=false;d.setFill(0);
  await squeezeBulb(.7,1,.4);
  await dropperTo(v3(mp.x,mp.y+1.2,mp.z),.9);
}
export function ripple(t){
  const r=t.ripple;r.visible=true;r.position.y=t.level+.003;
  tween(.9,k=>{r.scale.setScalar(1+k*3.4);r.material.opacity=.55*(1-k);},easeOut).then(()=>{r.visible=false;});
}
export async function dropFall(dest,onImpact){
  const d=dropper,tip=d.group.position.clone();
  dropMesh.material.color.copy(d.liqColor);dropMesh.material.opacity=clamp(.35+.55*d.liqAlpha,.35,.9);
  dropMesh.position.set(tip.x,tip.y-.02,tip.z);dropMesh.scale.setScalar(.01);dropMesh.visible=true;
  await tween(.3,k=>dropMesh.scale.setScalar(.01+k),easeOut);
  const y0=dropMesh.position.y,ys=dest.group.position.y+Math.max(dest.level,.1)+.02;
  const T=Math.sqrt(2*Math.max(.05,y0-ys)/20);
  await tween(T,k=>{dropMesh.position.y=y0-(y0-ys)*k*k;},lin);
  dropMesh.visible=false;ripple(dest);
  if(onImpact)onImpact();
}
export async function dropwise(dest,n,onDrop,label){
  const d=dropper,mp=mouthWorld(dest);
  await dropperTo(v3(mp.x,mp.y+.5,mp.z),1.3);
  const per=d.fill/(n+2);
  for(let i=0;i<n;i++){
    hud(`قطرهٔ ${fa(i+1)} از ${fa(n)}${label?' — '+label(i):''}`);
    await Promise.all([
      tween(.35,k=>d.setBulb(1-.28*Math.sin(Math.PI*k)),lin),
      dropFall(dest,()=>onDrop(i))
    ]);
    d.setFill(Math.max(0,d.fill-per));
    await sleep(.35);
  }
  hud('');
}
export async function dropperHome(){
  await dropperTo(DROP_REST,1.5,{...DROP_REST_ROT});
  dropper.setFill(0);dropper.setBulb(1);
}

