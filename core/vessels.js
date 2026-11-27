/* ظرف‌های جدید: بشر، میلهٔ همزن شیشه‌ای، حباب (آب گازدار) */
import {THREE,TAU,V3,C,clamp,lerp,rnd,v3,lin,world,tween,sleep,moveTo,addUpdater} from './kernel.js';
import {SPRITE,paperTex,canvasTex} from './textures.js';
import {Slosh,glassFres,glassFresThin,glassRefl,liquidMat,mesh,lathe,addBlob} from './materials.js';
import {Cloud,WATER,glassStreaks} from './glassware.js';

/* ---------- ابعاد بشر (واحد صحنه) ---------- */
export const BR=.75, BH=1.75, BT=.07, BIR=BR-.035;   // شعاع، ارتفاع، کف، شعاع درونی
const BEAKER_SHELL=lathe([[0,0],[BR-.07,0],[BR,.07],[BR,BH],[BR+.035,BH+.03],[BIR-.005,BH+.03],[BIR,BH],[BIR,BT],[0,BT]],48);
function beakerLiquidGeo(level){
  const lv=Math.max(level,BT+.01);
  const R=BIR-.004;
  return lathe(lv>BT+.08?[[0,BT],[R,BT],[R,lv+.03],[R-.014,lv+.012],[R-.04,lv+.004],[R-.09,lv],[0,lv]]:[[0,BT],[R,BT],[R,lv],[0,lv]],40);
}
/* مقیاس مدرج روی بشر: ۲۵۰ mL (خطوط ۲۵ تا ۲۲۵) یا ۱۰۰ mL (خطوط ۱۰ تا ۱۰۰) */
const GRAD_TOP=504,GRAD_BOT=60,GRAD_H=512;
function gradTex(mlMax){
  return canvasTex(160,GRAD_H,(g,w,h)=>{
    g.clearRect(0,0,w,h);
    g.strokeStyle='rgba(255,255,255,.9)';g.fillStyle='rgba(255,255,255,.95)';g.font='700 30px Tahoma, sans-serif';g.textAlign='right';
    const small=mlMax<=100,step=small?10:25,majorEvery=small?20:50,last=small?100:225;
    for(let ml=step;ml<=last;ml+=step){
      const y=GRAD_TOP-(GRAD_TOP-GRAD_BOT)*ml/mlMax,major=ml%majorEvery===0;
      g.lineWidth=major?4:3;g.beginPath();g.moveTo(w-8,y);g.lineTo(w-(major?90:50),y);g.stroke();
      if(major)g.fillText(String(ml),w-96,y+10);
    }
    g.font='700 28px Tahoma, sans-serif';g.textAlign='left';g.fillText('mL',12,44);
  });
}
const GRAD_TEXS={};
const gradTexFor=ml=>GRAD_TEXS[ml]||(GRAD_TEXS[ml]=gradTex(ml));
/* تبدیل میلی‌لیتر ↔ level (واحد صحنه) برای بشری که با گزینهٔ ml ساخته شده */
export const beakerLevel=(b,ml)=>(BH-.06)-(BH-.12)*(GRAD_TOP-(GRAD_TOP-GRAD_BOT)*ml/b.ml)/GRAD_H;
export const beakerML=b=>{
  const pix=((BH-.06)-b.level)*GRAD_H/(BH-.12);
  return Math.max(0,(GRAD_TOP-pix)/(GRAD_TOP-GRAD_BOT)*b.ml);
};

/* بشر: همان رابط لوله (level، addLiquid، solid، precip، color، alpha …) را دارد تا همهٔ کنش‌ها روی آن کار کنند */
export class Beaker{
  constructor(x=0,z=0,{label='',grad=true,ml=250}={}){
    this.ml=ml;this.H=BH+.03;this.innerR=BIR;this.floorAt=()=>BT;
    this.group=new THREE.Group();this.group.position.set(x,0,z);this.rest=this.group.position.clone();
    this.level=0;this.alpha=0;this.color=WATER.clone();
    this.precipColor=new C(0xf4f4f0);this.agit=0;this.agitTarget=0;this.dirty=true;
    this.group.add(mesh(BEAKER_SHELL,glassFresThin,10),mesh(BEAKER_SHELL,glassRefl,11),glassStreaks(BR+.004,.25,BH-.5));
    this.liqMat=liquidMat();
    this.slosh=new Slosh(.1);this.liq=mesh(beakerLiquidGeo(.05),this.liqMat,5);this.liq.visible=false;this.group.add(this.liq);
    this.solid=new Cloud(this,420,{size:.14,sinkMin:.8,sinkMax:1.3,diff:.03,pileMax:.12,pileN:380,opacity:1});
    this.precip=new Cloud(this,1800,{size:.2,sinkMin:.015,sinkMax:.06,diff:.3,pileMax:.14,pileN:1500,opacity:.7});
    if(grad){
      const gm=new THREE.Mesh(new THREE.CylinderGeometry(BR+.006,BR+.006,BH-.12,24,1,true,.75,.5),
        new THREE.MeshBasicMaterial({map:gradTexFor(ml),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}));
      gm.position.y=(BH-.12)/2+.06;gm.renderOrder=12;this.group.add(gm);
    }
    this.sticker=new THREE.Mesh(new THREE.CylinderGeometry(BR+.008,BR+.008,.5,28,1,true,-.62,1.24),
      new THREE.MeshStandardMaterial({map:paperTex(300,170,[{t:label||' ',size:64,y:85}]),roughness:.7,polygonOffset:true,polygonOffsetFactor:-2}));
    this.sticker.position.y=.62;this.sticker.visible=!!label;this.group.add(this.sticker);
    this.ripple=new THREE.Mesh(new THREE.RingGeometry(.03,.05,28),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide}));
    this.ripple.rotation.x=-Math.PI/2;this.ripple.visible=false;this.ripple.renderOrder=8;this.group.add(this.ripple);
    world.dyn.add(this.group);
    addBlob(world.dyn,x,z,1.9,1.9,.45);
  }
  turb(){return clamp(this.precip.count/900,0,1);}
  dispColor(){return this.color.clone().lerp(this.precipColor,this.turb()*.75);}
  dispOpacity(){return clamp(.26+.5*this.alpha+.6*this.turb(),0,.95);}
  addLiquid(dv,color,alpha){
    if(dv<0){this.level=Math.max(0,this.level+dv);this.dirty=true;if(this.level<1e-6)this.alpha=0;return;}   // برداشتن مایع (ریختن بیرون)
    if(dv===0)return;
    const v1=this.level,v2=dv,w1=v1*this.alpha,w2=v2*alpha;
    if(w1+w2>1e-6)this.color.copy(this.color.clone().multiplyScalar(w1).add(color.clone().multiplyScalar(w2)).multiplyScalar(1/(w1+w2)));
    else if(v1<=1e-6)this.color.copy(color);
    this.alpha=(v1*this.alpha+v2*alpha)/(v1+v2);
    this.level=v1+v2;this.dirty=true;
  }
  /* n ذرهٔ معلق (کدورت/شیری‌شدن) در سراسر مایع پخش می‌کند */
  suspend(n,hex){
    this.precipColor.setHex(hex);
    for(let i=0;i<n;i++)this.precip.spawn(1,rnd(BT+.12,Math.max(BT+.14,this.level-.06)),BIR*.8,hex,0);
  }
  update(dt){
    if(this.dirty){this.liq.geometry.dispose();this.liq.geometry=beakerLiquidGeo(this.level);this.dirty=false;}
    this.liq.visible=this.level>BT+.015;
    this.agit+=(this.agitTarget-this.agit)*Math.min(1,6*dt);
    this.slosh.step(dt,this.group,this.liqMat,this.level,BT);
    this.solid.update(dt,this.level);this.precip.update(dt,this.level);
    if(this.liq.visible){
      const c=this.dispColor();
      this.liqMat.color.copy(c);this.liqMat.emissive.copy(c).multiplyScalar(.3);
      this.liqMat.opacity=this.dispOpacity();
    }
  }
}
/* بشر روی میز؛ در S.tubes ثبت نمی‌شود، پس خودتان در S نگه دارید (مثلاً S.beaker) و update را خودکار صدا می‌زنیم */
import {S} from './state.js';
export function makeBeaker(x=0,z=0,opts={}){
  const b=new Beaker(x,z,opts);S.vessels.push(b);return b;   // S.vessels در هر فریم به‌روز می‌شود
}

/* ---------- میلهٔ همزن شیشه‌ای ---------- */
export const ROD_LEN=2.7, ROD_REST=v3(-2.3,.035,1.9);
export function makeStirRod(){
  const g=new THREE.Group();
  const geo=new THREE.CylinderGeometry(.03,.03,ROD_LEN,12);
  const body=mesh(geo,glassFres,10);body.position.y=ROD_LEN/2;
  const body2=mesh(geo,glassRefl,11);body2.position.y=ROD_LEN/2;
  const solidCore=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xcfe3e6,transparent:true,opacity:.35,roughness:.1}));
  solidCore.position.y=ROD_LEN/2;
  g.add(body,body2,solidCore);
  g.position.copy(ROD_REST);g.rotation.set(0,0,-Math.PI/2);   // افتاده روی میز
  world.dyn.add(g);
  return g;
}
const UP=new V3(0,1,0);
/* هم‌زدن محتوای بشر با میله؛ onK(k) برای تغییر رنگ/حل‌شدن در طول هم‌زدن */
export async function stirBeaker(b,rod,dur=3.4,onK=null){
  const p=b.group.position,rest=rod.position.clone(),rr={x:rod.rotation.x,y:rod.rotation.y,z:rod.rotation.z};
  const top=v3(p.x,BH+ROD_LEN*.85,p.z);
  await moveTo(rod,v3(p.x,BH+.2,p.z),1.2,{x:0,y:0,z:0},.8);
  b.agitTarget=1;
  await tween(dur,k=>{
    const env=Math.min(1,k*5,(1-k)*5),ph=k*TAU*3.2,r=.32*env;
    const tip=v3(p.x+Math.cos(ph)*r,BT+.1+(1-env)*(BH+.2-BT-.1),p.z+Math.sin(ph)*r);
    rod.position.copy(tip);
    rod.quaternion.setFromUnitVectors(UP,top.clone().sub(tip).normalize());
    if(onK)onK(k);
  },lin);
  b.agitTarget=0;
  await moveTo(rod,v3(p.x,BH+.2,p.z),.6);
  rod.rotation.set(0,0,0);
  await moveTo(rod,rest,1.3,rr,1.0);
}

/* ---------- حباب‌های گاز در مایع (آب گازدار) ---------- */
/* container: شیء با group (مثل خروجی makeBottle). ناحیهٔ مایع را با y0..y1 و شعاع r تعیین کنید */
export function addFizz(container,{y0=.2,y1=1.1,r=.4,n=70}={}){
  const pos=new Float32Array(n*3),spd=new Float32Array(n),ph=new Float32Array(n);
  const reset=(i,init)=>{const a=rnd(0,TAU),q=Math.sqrt(Math.random())*r;pos[i*3]=Math.cos(a)*q;pos[i*3+1]=init?rnd(y0,y1):y0+rnd(0,.1);pos[i*3+2]=Math.sin(a)*q;spd[i]=rnd(.25,.6);ph[i]=rnd(0,TAU);};
  for(let i=0;i<n;i++)reset(i,true);
  const g=new THREE.BufferGeometry(),pa=new THREE.BufferAttribute(pos,3);pa.setUsage(THREE.DynamicDrawUsage);g.setAttribute('position',pa);
  const pts=new THREE.Points(g,new THREE.PointsMaterial({size:.06,map:SPRITE,color:0xffffff,transparent:true,opacity:.75,depthWrite:false,sizeAttenuation:true}));
  pts.frustumCulled=false;pts.renderOrder=7;container.group.add(pts);
  let t=0;
  addUpdater(dt=>{
    t+=dt;
    for(let i=0;i<n;i++){
      pos[i*3+1]+=spd[i]*dt;pos[i*3]+=Math.sin(t*3+ph[i])*.0015;
      if(pos[i*3+1]>y1)reset(i,false);
    }
    pa.needsUpdate=true;
  });
  return pts;
}


/* ---------- کف (صابون و …) ----------
   foam.set(h): ارتفاع کف بر حسب واحد صحنه (۱ cm ≈ CM). روی هر ظرفی (بشر، استوانه) کار می‌کند. */
export const CM=.2;
export function addFoam(vessel,{n=900,hmax=1.4}={}){
  const R=(vessel.innerR||BIR)*.93,fr=new Float32Array(n),pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){const a=rnd(0,TAU),q=Math.sqrt(Math.random())*R;pos[i*3]=Math.cos(a)*q;pos[i*3+2]=Math.sin(a)*q;fr[i]=Math.pow(Math.random(),.8);}
  const geo=new THREE.BufferGeometry(),pa=new THREE.BufferAttribute(pos,3);pa.setUsage(THREE.DynamicDrawUsage);geo.setAttribute('position',pa);
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:.17,map:SPRITE,color:0xffffff,transparent:true,opacity:.9,depthWrite:false,sizeAttenuation:true}));
  pts.frustumCulled=false;pts.renderOrder=9;pts.visible=false;vessel.group.add(pts);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(R,R,1,28),new THREE.MeshStandardMaterial({color:0xf6f8fa,roughness:.9,transparent:true,opacity:.42,depthWrite:false}));
  body.renderOrder=8;body.visible=false;vessel.group.add(body);
  const f={h:0,pts,body,set(h){f.h=h;}};
  addUpdater(()=>{
    const h=f.h,on=h>.01;pts.visible=body.visible=on;if(!on)return;
    const y0=vessel.level;
    body.scale.set(1,h,1);body.position.y=y0+h/2;
    const c=Math.max(1,Math.floor(n*Math.min(1,.2+h/hmax*.8)));geo.setDrawRange(0,c);
    for(let i=0;i<c;i++)pos[i*3+1]=y0+fr[i]*h+.02;
    pa.needsUpdate=true;
  });
  return f;
}

/* ---------- خط‌کش ایستاده (cm): صفر روی zeroY (مثلاً سطح مایع) ---------- */
export function makeRuler(x=0,z=0,{cm=6,zeroY=0}={}){
  const H=zeroY+cm*CM+.15,g=new THREE.Group();
  const W=256,Hp=1024;
  const tex=canvasTex(W,Hp,(c,w,h)=>{
    c.fillStyle='#f1e7b8';c.fillRect(0,0,w,h);c.strokeStyle='#2a2a2a';c.fillStyle='#2a2a2a';c.textAlign='left';
    const Y=t=>h*(1-(zeroY+t*CM)/H);
    for(let t=0;t<=cm*2;t++){const half=t/2,major=t%2===0,y=Y(half);c.lineWidth=major?5:3;c.beginPath();c.moveTo(w,y);c.lineTo(w-(major?110:60),y);c.stroke();
      if(major){c.font='700 56px Tahoma, sans-serif';c.fillText(String(half),12,y+18);}}
    c.font='700 40px Tahoma, sans-serif';c.fillText('cm',12,Y(cm)-40);
  });
  const body=new THREE.Mesh(new THREE.BoxGeometry(.26,H,.03),new THREE.MeshStandardMaterial({map:tex,roughness:.6}));
  body.position.y=H/2;body.castShadow=true;g.add(body);
  const mk=new THREE.Mesh(new THREE.ConeGeometry(.07,.16,3),new THREE.MeshBasicMaterial({color:0xe11d48}));
  mk.rotation.z=Math.PI/2;mk.position.set(.2,zeroY,0);mk.visible=false;g.add(mk);
  g.position.set(x,0,z);world.dyn.add(g);
  const r={group:g,marker:mk,zeroY,H,rest:g.position.clone(),
    mark(h){mk.visible=h>0;mk.position.y=zeroY+h;}};   // h: ارتفاع نشانه بالای صفر (واحد صحنه)
  return r;
}
/* خط‌کش را (بدون برخورد) کنار ظرف می‌برد؛ side=-1 چپ، +1 راست */
export async function ruleBeside(r,vessel,{side=-1,gap=.35}={}){
  const p=vessel.group.position,x=p.x+side*((vessel.innerR||BIR)+gap),top=Math.max(vessel.H||BH,r.H)+.5;
  await moveTo(r.group,v3(r.group.position.x,top,r.group.position.z),.7);
  await moveTo(r.group,v3(x,top,p.z+.2),.9);
  await moveTo(r.group,v3(x,0,p.z+.2),.7);
}
export async function ruleHome(r){
  const top=r.H+.5;
  await moveTo(r.group,v3(r.group.position.x,top,r.group.position.z),.6);
  await moveTo(r.group,v3(r.rest.x,top,r.rest.z),.9);
  await moveTo(r.group,r.rest,.6);
  r.mark(0);
}
