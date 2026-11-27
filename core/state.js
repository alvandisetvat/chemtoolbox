/* وضعیت مشترک آزمایش جاری (S) و توابع کمکی چیدمان */
import {THREE,C,world} from './kernel.js';
import {Tube,makeJar,makeBottle} from './glassware.js';
import {addBlob} from './materials.js';
import {species} from './chemistry.js';

/* S: هر دبیر می‌تواند هر چیزی که لازم دارد در S نگه دارد؛ با هر بازنشانی پاک می‌شود */
export const S={tubes:[],vessels:[],jars:{}};
export function resetState(){
  for(const k of Object.keys(S))delete S[k];
  S.tubes=[];S.vessels=[];S.jars={};
}
/* لولهٔ آزمایش در جایگاه slot (۰، ۱ یا ۲) */
export function makeTube(slot,big,small,showSticker=false){
  const t=new Tube(slot,big,small,showSticker);S.tubes[slot]=t;return t;
}
/* هر شیء سه‌بعدی که اضافه کنید با بازنشانی خودکار حذف می‌شود */
export function addToBench(obj){world.dyn.add(obj);return obj;}
/* ظرف ماده روی میز؛ id از SPECIES */
export function placeJar(id,x,z=.3){
  const s=species(id);
  const j=makeJar(s.formula,s.name,s.powder,s.kind);
  j.group.position.set(x,0,z);world.dyn.add(j.group);addBlob(world.dyn,x,z,1.7,1.7,.45);
  return j;
}
/* بطری محلول روی میز */
export function placeBottle(id,x,z=.3){
  const s=species(id);
  const b=makeBottle(s.formula,s.name);
  b.group.position.set(x,0,z);world.dyn.add(b.group);addBlob(world.dyn,x,z,1.6,1.6,.45);
  return b;
}
/* پر کردن لوله با محلول ماده (حجم تا حدود ۲٫۶) */
export function fillTube(tube,id,volume=1.3){
  const s=species(id);
  tube.addLiquid(volume,new C(s.sol),s.solA);
  return tube;
}
