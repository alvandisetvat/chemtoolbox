/* وسیله‌های کوچک: زمان‌سنج، هاون چینی، قرص جوشان، و کارهای ویژهٔ قوطی فیلم (وارونه‌کردن، پرتاب) */
import {THREE,TAU,V3,C,clamp,lerp,rnd,v3,lin,easeOut,easeIO,world,tween,sleep,moveTo} from './kernel.js';
import {canvasTex} from './textures.js';
import {mesh,lathe,addBlob,plastic} from './materials.js';
import {addFizz} from './vessels.js';
import {makeFlame} from './instruments.js';
import {cylSetML} from './parts.js';
import {setStream,stream} from './fx.js';

/* ====================== زمان‌سنج ====================== */
export function makeStopwatch(x=0,z=0){
  const g=new THREE.Group();g.position.set(x,0,z);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.2,40),plastic(0x2b323c,.4));
  body.position.y=.1;body.castShadow=true;g.add(body);
  const cv=document.createElement('canvas');cv.width=512;cv.height=256;const cx=cv.getContext('2d');
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(.98,.5),new THREE.MeshBasicMaterial({map:tex}));scr.rotation.x=-Math.PI/2;scr.position.y=.205;g.add(scr);
  const btn=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.1,14),new THREE.MeshStandardMaterial({color:0xd9dde2,roughness:.3,metalness:.8}));btn.position.set(0,.22,-.66);g.add(btn);
  world.dyn.add(g);addBlob(world.dyn,x,z,1.5,1.5,.4);
  const sw={group:g,btn,t:0,
    show(t){sw.t=t;cx.fillStyle='#10201a';cx.fillRect(0,0,512,256);cx.fillStyle='#9af2b8';cx.font='700 150px "Courier New",monospace';cx.textAlign='center';cx.textBaseline='middle';
      cx.fillText(t.toFixed(1),256,118);cx.font='700 40px Tahoma,sans-serif';cx.fillText('s',440,210);tex.needsUpdate=true;},
    reset(){sw.show(0);}};
  sw.show(0);return sw;
}
/* زمان‌سنج را تا T ثانیه (شبیه‌سازی شتاب‌دار) می‌شمارد؛ سرعت: speed برابر */
export async function runStopwatch(sw,T,{speed=14,onTick=null}={}){
  await tween(Math.max(1.4,T/speed),k=>{sw.show(T*k);onTick&&onTick(k);},lin);
  sw.show(T);
}

/* ====================== قرص جوشان ====================== */
const TAB_R=.25,TAB_H=.1;
export function makeTablet(x=0,z=0,{piece='whole'}={}){
  const g=new THREE.Group();g.position.set(x,TAB_H/2+.01,z);
  const mat=new THREE.MeshStandardMaterial({color:0xf0bf72,roughness:.8,side:THREE.DoubleSide});
  const th=piece==='half'?Math.PI:piece==='quarter'?Math.PI/2:TAU;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(TAB_R,TAB_R,TAB_H,28,1,false,0,th),mat);body.castShadow=true;g.add(body);
  if(piece==='half'){const p=new THREE.Mesh(new THREE.PlaneGeometry(2*TAB_R,TAB_H),mat);p.rotation.y=Math.PI/2;g.add(p);}
  if(piece==='quarter'){
    const a=new THREE.Mesh(new THREE.PlaneGeometry(TAB_R,TAB_H),mat);a.rotation.y=Math.PI/2;a.position.z=TAB_R/2;g.add(a);
    const b=new THREE.Mesh(new THREE.PlaneGeometry(TAB_R,TAB_H),mat);b.position.x=TAB_R/2;g.add(b);
  }
  world.dyn.add(g);return {group:g,piece};
}

/* ====================== هاون چینی ====================== */
export function makeMortar(x=0,z=0){
  const g=new THREE.Group();g.position.set(x,0,z);
  const por=new THREE.MeshPhysicalMaterial({color:0xf3f1ea,roughness:.3,metalness:.02,clearcoat:.7,clearcoatRoughness:.15,side:THREE.DoubleSide});
  const bowl=new THREE.Mesh(lathe([[0,0],[.34,0],[.62,.1],[.92,.45],[1.0,.78],[.93,.8],[.84,.5],[.56,.24],[0,.2]],40),por);bowl.castShadow=true;bowl.receiveShadow=true;g.add(bowl);
  const spout=new THREE.Mesh(new THREE.BoxGeometry(.3,.05,.2),por);spout.position.set(1.0,.78,0);g.add(spout);
  const powder=new THREE.Mesh(lathe([[0,0],[.42,0],[.34,.07],[.18,.13],[0,.15]],24),new THREE.MeshStandardMaterial({color:0xf4dcae,roughness:1}));
  powder.position.y=.21;powder.visible=false;g.add(powder);
  world.dyn.add(g);addBlob(world.dyn,x,z,2.2,2.2,.4);
  const pestle=new THREE.Group();
  const hd=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,1.6,16),por);hd.position.y=.8;hd.castShadow=true;pestle.add(hd);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(.16,16,12),por);pestle.add(tip);
  const rest=v3(x+1.3,.16,z+1.5);pestle.position.copy(rest);pestle.rotation.z=-Math.PI/2;
  world.dyn.add(pestle);
  return {group:g,bowl,powder,pestle,rest,restRot:{x:0,y:0,z:-Math.PI/2},center:v3(x,0,z)};
}
/* قرص را در هاون می‌ریزد، می‌ساید و پودر می‌شود. پس از آن پودر در m.powder است (قابل‌نمایش). */
export async function grindTablet(m,tablet,{dur=3}={}){
  const c=m.center,pg=tablet.group;
  await moveTo(pg,v3(c.x,1.3,c.z),.8,null,.5);await moveTo(pg,v3(c.x,.32,c.z),.5);
  await moveTo(m.pestle,v3(c.x,1.4,c.z+.2),.9,{x:0,y:0,z:0},.4);
  await tween(dur,k=>{
    const a=k*TAU*4,r=.26*Math.min(1,k*4);
    m.pestle.position.set(c.x+Math.cos(a)*r,.34+.04*Math.sin(a*2),c.z+Math.sin(a)*r);
    m.pestle.rotation.set(.28*Math.sin(a),0,-.28*Math.cos(a));
    if(k>.55){pg.visible=false;m.powder.visible=true;m.powder.scale.setScalar(lerp(.35,1,(k-.55)/.45));}
  },lin);
  await moveTo(m.pestle,v3(c.x,1.4,c.z+.2),.6,{x:0,y:0,z:0});
  await moveTo(m.pestle,m.rest,1.0,m.restRot,.4);
}
/* پودر را از هاون به قوطی (باز) می‌ریزد؛ پودر ناپدید می‌شود */
export async function pourPowder(m,can){
  const p=can.group.position,c=m.center,pw=m.powder,home=v3(0,.21,0);
  const above=v3(p.x-c.x,1.45,p.z-c.z);
  await moveTo(pw,above,1.2,null,.9);
  await tween(.8,k=>{pw.position.y=lerp(1.45,.35,k);pw.scale.setScalar(lerp(1,.15,k));},lin);
  pw.visible=false;pw.position.copy(home);
}

/* ====================== قوطی فیلم: وارونه‌کردن و پرتاب ====================== */
export function canisterFizz(c){
  if(c.fz)return;
  c.fz=[addFizz(c,{y0:.1,y1:.8,r:.22,n:70}),addFizz(c,{y0:.45,y1:.86,r:.22,n:70})];
  c.fz.forEach(p=>{p.visible=false;});
  c.fizzSet=(on,top=false)=>{c.fz[0].visible=on&&!top;c.fz[1].visible=on&&top;};
}
export async function openCanister(c,dur=.7){
  await moveTo(c.lid,v3(-.9,1.5,.2),dur,{x:0,y:0,z:.5},.5);
}
export async function closeCanister(c,dur=.7){
  await moveTo(c.lid,v3(.0,1.25,0),dur*.5,{x:0,y:0,z:0},.2);
  await moveTo(c.lid,v3(0,.9,0),dur*.5);
}
/* وارونه روی زمین: درپوش پایین، مایع کنار درپوش */
export async function flipCanister(c,dur=1.1){
  const g=c.group,p0=g.position.clone(),y1=1.1,liqH=c.liq.scale.y;
  await tween(dur,k=>{
    g.position.set(p0.x,lerp(p0.y,y1,k)+Math.sin(k*Math.PI)*.9,p0.z);
    g.rotation.x=Math.PI*easeIO(k);
    if(k>.5&&!c.flipped){c.flipped=true;c.liq.position.y=.88-liqH/2;}
  },lin);
  g.position.y=y1;g.rotation.x=Math.PI;
}
/* پرتاب: بدنهٔ قوطی بالا می‌رود (درپوش روی زمین می‌ماند) و می‌افتد */
export async function launchCanister(c,{peak=3.8,dur=1.9,toZ=1.0}={}){
  const g=c.group,p=g.position.clone();
  const l2=c.lid.clone();l2.position.set(p.x,.2,p.z);l2.rotation.set(Math.PI,0,0);world.dyn.add(l2);c.lid.visible=false;c.lid2=l2;
  await tween(.45,k=>{g.position.x=p.x+Math.sin(k*40)*.015*k;},lin);
  g.position.x=p.x;
  await tween(dur,k=>{
    g.position.y=lerp(p.y,.34,k*k)+peak*4*k*(1-k);
    g.position.z=p.z+toZ*k;
    g.rotation.x=Math.PI+(Math.PI/2)*k;
    g.rotation.z=.5*Math.sin(k*Math.PI);
  },lin);
  g.position.y=.34;g.rotation.z=0;
  c.fizzSet&&c.fizzSet(false);
}
/* ریختن مایع از استوانه (که سمت راست قوطی ایستاده) درون قوطی باز. ml میلی‌لیتر بر حسب نشانهٔ استوانه. */
export async function pourCylinderIntoCanister(cyl,can,{color=null,dur=2.4,h=.3}={}){
  const H=3.1,th=1.2,cp=can.group.position,rest=cyl.group.position.clone();
  const base=v3(cp.x+H*Math.sin(th),1.2-H*Math.cos(th)+.02,cp.z);
  const col=color||cyl.color.clone();
  await moveTo(cyl.group,v3(rest.x,1.0,rest.z),.7,null,.3);
  await moveTo(cyl.group,base,1.2,{x:0,y:0,z:th},.5);
  const mouth=v3(cp.x,1.2,cp.z);
  const l0=cyl.level;
  await tween(dur,k=>{
    cyl.addLiquid(lerp(l0,0,k)-cyl.level,col,0);
    can.setLiquid(h*k,col);
    setStream(mouth.x,mouth.y,.12+h*k,mouth.z,.02,col,.55);
  },lin);
  stream.visible=false;
  cyl.level=0;cyl.dirty=true;
  await moveTo(cyl.group,v3(rest.x,1.0,rest.z),1.0,{x:0,y:0,z:0},.5);
  await moveTo(cyl.group,rest,.6);
}

/* ====================== نمونهٔ غذایی (مغز گردو، ماکارونی) و انبر ====================== */
const NUT=0xb8864a,PASTA=0xe6b84a,CHAR=0x2a2420;
/* kind: 'nut' | 'pasta'؛ pieces: تعداد تکه‌ها (۱ یا ۲) */
/* نیمهٔ مغز گردو: دو لوب چروکیده با شیار میانی و پشتهٔ پیچ‌خورده */
function walnutGeo(){
  const g=new THREE.SphereGeometry(.24,36,24),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    x*=1.25;y*=.62;z*=.95;
    const lobe=Math.abs(z)/.23;                       // 0 در شیار میانی
    y-=.07*Math.exp(-Math.pow(z/.045,2))*(y>0?1:.2);   // شیار
    const w=Math.sin(x*21+z*7)*Math.sin(z*17-x*5)+.5*Math.sin(x*37+z*29);
    const r=y>-.02?1:.25;                              // کف نسبتاً صاف
    y+=w*.022*r;x+=w*.008*r;z+=Math.cos(x*23)*.008*r;
    if(y<-.06)y=-.06+(y+.06)*.15;
    p.setXYZ(i,x,y,z);
  }
  g.computeVertexNormals();return g;
}
export function makeFood(kind='nut',pieces=1){
  const g=new THREE.Group(),mats=[];
  for(let i=0;i<pieces;i++){
    const mt=new THREE.MeshStandardMaterial({color:kind==='nut'?NUT:PASTA,roughness:.9,flatShading:kind==='nut'});mats.push(mt);
    let m;
    if(kind==='nut'){m=new THREE.Mesh(walnutGeo(),mt);m.rotation.y=i*1.1;m.scale.setScalar(1.15);m.position.set(i*.55-(pieces-1)*.275,.09,i*.05);}
    else{
      mt.side=THREE.DoubleSide;
      m=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.7,16,1,true),mt);m.rotation.z=Math.PI/2;
      m.rotation.y=i*.35;m.position.set(i*.2-(pieces-1)*.1,.13+i*.0,i*.28-(pieces-1)*.14);
    }
    m.castShadow=true;g.add(m);
  }
  g.userData.baseY=0;world.dyn.add(g);
  return {group:g,mats,kind,
    char(k){mats.forEach(mt=>mt.color.setHex(kind==='nut'?NUT:PASTA).lerp(new C(CHAR),clamp(k,0,1)));g.scale.setScalar(1-.2*k);}};
}
/* انبر: نوک انبر در مبدأ است و میله‌ها به بالا و راست می‌روند. food را با tongs.hold(food) می‌گیرد. */
export function makeTongs(){
  const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x9aa0a8,roughness:.24,metalness:.92,envMapIntensity:1.5});
  const dir=v3(.825,.565,0),len=3.6;
  for(const [a,off] of [[-.97,.03],[-.93,-.03]]){
    const r=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,len,8),m);r.rotation.z=a;r.position.set(dir.x*len/2,dir.y*len/2+off,off);r.castShadow=true;g.add(r);
  }
  const holder=new THREE.Group();holder.position.set(0,-.06,0);g.add(holder);
  const fl=makeFlame({air:0,height:.5});fl.group.position.set(0,.05,0);g.add(fl.group);
  world.dyn.add(g);
  const t={group:g,flame:fl,food:null,
    hold(food){if(t.food)holder.remove(t.food.group);t.food=food;holder.add(food.group);food.group.position.set(0,0,0);}};
  return t;
}
