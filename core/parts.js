/* قطعه‌های شیشه‌ای و ظرف‌ها: استوانهٔ مدرج، قیف + کاغذ صافی + پایه، قوطی فیلم */
import {THREE,TAU,V3,C,clamp,lerp,rnd,v3,lin,easeOut,world,tween,sleep,moveTo,addUpdater} from './kernel.js';
import {canvasTex,paperTex} from './textures.js';
import {Slosh,plastic,glassFres,glassFresThin,glassPhysical,glassRefl,liquidMat,mesh,lathe,addBlob} from './materials.js';
import {Cloud,WATER,glassStreaks} from './glassware.js';
import {stream,setStream} from './fx.js';
import {S} from './state.js';

/* ====================== استوانهٔ مدرج ======================
   همان رابط لوله/بشر را دارد (level، addLiquid، solid، precip …) پس pourWater، pourFromDropper و … روی آن کار می‌کنند.
   level بر حسب واحد صحنه است؛ برای میلی‌لیتر از cylML و cylSetML استفاده کنید. */
export const CYL_R=.36, CYL_H=3.1, CYL_T=.2;           // شعاع، ارتفاع، کف داخلی
const CYL_IR=CYL_R-.03, CYL_TOP=CYL_H-.32;              // شعاع درونی، بالاترین خط مدرج
function cylShellGeo(){
  return lathe([[0,0],[.62,0],[.62,.06],[.5,.12],[.5,.17],[CYL_R,.3],[CYL_R,CYL_H],[CYL_R+.04,CYL_H+.02],[CYL_IR-.004,CYL_H+.02],[CYL_IR,CYL_H],[CYL_IR,CYL_T],[0,CYL_T]],40);
}
export const CYL_SHELL=cylShellGeo();
function cylLiquidGeo(level){const lv=Math.max(level,CYL_T+.01);const R=CYL_IR-.004;return lathe(lv>CYL_T+.08?[[0,CYL_T],[R,CYL_T],[R,lv+.026],[R-.012,lv+.01],[R-.03,lv+.003],[R-.06,lv],[0,lv]]:[[0,CYL_T],[R,CYL_T],[R,lv],[0,lv]],32);}
export function cylGradTex(ml){
  const yLo=CYL_T,yHi=CYL_TOP+.18;
  return canvasTex(160,1024,(g,w,h)=>{
    g.clearRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,.95)';g.fillStyle='rgba(255,255,255,.98)';g.textAlign='right';
    const step=ml>=100?2:1,Y=m=>h*(1-((CYL_T+(CYL_TOP-CYL_T)*m/ml)-yLo)/(yHi-yLo));
    for(let m=step;m<=ml;m+=step){
      const major=m%(ml/5)===0,mid=!major&&m%(ml/10)===0,y=Y(m);
      g.lineWidth=major?4:3;g.beginPath();g.moveTo(w-8,y);g.lineTo(w-(major?95:mid?62:36),y);g.stroke();
      if(major){g.font='700 34px Tahoma, sans-serif';g.fillText(String(m),w-102,y+11);}
    }
    g.font='700 30px Tahoma, sans-serif';g.textAlign='left';g.fillText(ml+' mL',8,36);
  });
}
export class Cylinder{
  constructor(x=0,z=0,{ml=100,label=''}={}){
    this.ml=ml;this.H=CYL_H+.02;this.innerR=CYL_IR;this.floorAt=()=>CYL_T;
    this.group=new THREE.Group();this.group.position.set(x,0,z);this.rest=this.group.position.clone();
    this.level=0;this.alpha=0;this.color=WATER.clone();
    this.precipColor=new C(0xf4f4f0);this.agit=0;this.agitTarget=0;this.dirty=true;
    this.group.add(mesh(CYL_SHELL,glassPhysical,10),mesh(CYL_SHELL,glassRefl,11),glassStreaks(CYL_R+.004,.5,CYL_H-.7));
    this.liqMat=liquidMat();
    this.slosh=new Slosh(.1);this.liq=mesh(cylLiquidGeo(.05),this.liqMat,5);this.liq.visible=false;this.group.add(this.liq);
    this.solid=new Cloud(this,260,{size:.1,sinkMin:.8,sinkMax:1.3,diff:.03,pileMax:.1,pileN:240,opacity:1});
    this.precip=new Cloud(this,900,{size:.14,sinkMin:.015,sinkMax:.06,diff:.3,pileMax:.12,pileN:800,opacity:.7});
    const gm=new THREE.Mesh(new THREE.CylinderGeometry(CYL_R+.006,CYL_R+.006,CYL_TOP+.18-CYL_T,24,1,true,.7,.62),
      new THREE.MeshBasicMaterial({map:cylGradTex(ml),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}));
    gm.position.y=(CYL_TOP+.18+CYL_T)/2;gm.renderOrder=12;this.group.add(gm);
    this.sticker=new THREE.Mesh(new THREE.CylinderGeometry(CYL_R+.008,CYL_R+.008,.5,24,1,true,-.7,1.1),
      new THREE.MeshStandardMaterial({map:paperTex(260,150,[{t:label||' ',size:60,y:75}]),roughness:.7,polygonOffset:true,polygonOffsetFactor:-2}));
    this.sticker.position.y=.78;this.sticker.visible=!!label;this.group.add(this.sticker);
    world.dyn.add(this.group);addBlob(world.dyn,x,z,1.5,1.5,.45);
  }
  turb(){return clamp(this.precip.count/600,0,1);}
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
  suspend(n,hex){this.precipColor.setHex(hex);for(let i=0;i<n;i++)this.precip.spawn(1,rnd(CYL_T+.12,Math.max(CYL_T+.14,this.level-.06)),CYL_IR*.8,hex,0);}
  update(dt){
    if(this.dirty){this.liq.geometry.dispose();this.liq.geometry=cylLiquidGeo(this.level);this.dirty=false;}
    this.liq.visible=this.level>CYL_T+.015;
    this.agit+=(this.agitTarget-this.agit)*Math.min(1,6*dt);
    this.slosh.step(dt,this.group,this.liqMat,this.level,CYL_T);
    this.solid.update(dt,this.level);this.precip.update(dt,this.level);
    if(this.liq.visible){const c=this.dispColor();this.liqMat.color.copy(c);this.liqMat.emissive.copy(c).multiplyScalar(.3);this.liqMat.opacity=this.dispOpacity();}
  }
}
export function makeCylinder(x=0,z=0,opts={}){const c=new Cylinder(x,z,opts);S.vessels.push(c);return c;}
/* تبدیل میلی‌لیتر ↔ level (واحد صحنه) */
export const cylLevel=(c,ml)=>CYL_T+(CYL_TOP-CYL_T)*ml/c.ml;
export const cylML=c=>Math.max(0,(c.level-CYL_T)/(CYL_TOP-CYL_T)*c.ml);
/* پر کردن آنی تا ml میلی‌لیتر (یا با dur ثانیه، به‌تدریج) */
export async function cylSetML(c,ml,color=WATER,alpha=0,dur=0){
  const l1=cylLevel(c,ml),l0=c.level;
  if(dur<=0){c.addLiquid(l1-c.level,color,alpha);return;}
  await tween(dur,k=>c.addLiquid(lerp(l0,l1,k)-c.level,color,alpha),lin);
}

/* ====================== قیف + کاغذ صافی + پایه ======================
   y0: ارتفاع نوک ساقهٔ قیف از میز. ظرف جمع‌کننده (بشر) را زیر نوک بگذارید: x و z همان x و z قیف.
   funnel.fill: حجم مایع روی صافی (۰..۱)، funnel.residue: رنگ رسوب روی کاغذ. */
const F_STEM=.9,F_TOP=2.3,F_R=.98,F_SR=.075;
const fr=y=>F_SR+(y-F_STEM)*(F_R-.04-F_SR)/(F_TOP-F_STEM-.02);
function funnelLiqGeo(k){
  const lv=F_STEM+.04+(F_TOP-F_STEM-.14)*clamp(k,0,1);
  return lathe([[0,F_STEM],[fr(F_STEM+.02),F_STEM+.02],[fr(lv),lv],[0,lv]],32);
}
export const FUNNEL_SHELL=lathe([[F_SR,0],[F_SR+.03,0],[F_SR+.03,F_STEM],[F_R+.03,F_TOP],[F_R,F_TOP],[F_SR,F_STEM+.04]],40);
export const funnelWallR=y=>fr(y);
export function makeFunnel(x=0,z=0,{y0=2.1}={}){
  const g=new THREE.Group();g.position.set(x,0,z);
  const fg=new THREE.Group();fg.position.y=y0;g.add(fg);
  fg.add(mesh(FUNNEL_SHELL,glassPhysical,10),mesh(FUNNEL_SHELL,glassRefl,11));
  /* کاغذ صافی: مخروط باز */
  const paperMat=new THREE.MeshStandardMaterial({color:0xf3efe4,roughness:1,side:THREE.DoubleSide});
  const paper=new THREE.Mesh(lathe([[.0001,F_STEM+.03],[F_R-.03,F_TOP+.04]],40),paperMat);paper.renderOrder=3;fg.add(paper);
  const residueMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide,transparent:true,opacity:0});
  const residue=new THREE.Mesh(lathe([[.0001,F_STEM+.05],[fr(F_STEM+.5),F_STEM+.5]],32),residueMat);residue.renderOrder=4;fg.add(residue);
  const liqMat=liquidMat();const liq=mesh(funnelLiqGeo(0),liqMat,5);liq.visible=false;fg.add(liq);
  /* پایه */
  const metal=new THREE.MeshStandardMaterial({color:0x8a8f96,roughness:.26,metalness:.9,envMapIntensity:1.5});
  const base=new THREE.Mesh(new THREE.BoxGeometry(2.6,.12,1.4),plastic(0x2c3440,.55));base.position.set(-1.35,.06,0);base.castShadow=true;g.add(base);
  const rodH=y0+F_STEM+1.1;
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,rodH,14),metal);rod.position.set(-1.9,rodH/2,0);rod.castShadow=true;g.add(rod);
  const ringY=y0+F_STEM+.7,ringR=fr(F_STEM+.7)+.12;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(ringR,.035,10,36),metal);ring.rotation.x=Math.PI/2;ring.position.set(0,ringY,0);g.add(ring);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(1.9-ringR+.1,.07,.1),metal);arm.position.set(-(1.9+ringR)/2+.05,ringY,0);g.add(arm);
  const clamp_=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.22),metal);clamp_.position.set(-1.9,ringY,0);g.add(clamp_);
  world.dyn.add(g);
  const f={group:g,fg,paper,paperMat,residue,residueMat,liq,liqMat,fill:0,y0,
    get stemTip(){return v3(g.position.x,y0,g.position.z);},
    setFill(k,color=null,alpha=.4){f.fill=k;liq.geometry.dispose();liq.geometry=funnelLiqGeo(k);liq.visible=k>.01;if(color)liqMat.color.copy(color);liqMat.opacity=.3+.4*alpha;},
    setResidue(hex,amount=1){residueMat.color.setHex(hex);residueMat.opacity=clamp(amount,0,1);}
  };
  return f;
}
/* ریختن مایع (و ذرات معلق) از src روی صافی؛ سپس صاف‌شدن آن به dst.
   ml: مقدار مایع که صاف می‌شود (واحد level ظرف مقصد)، residueHex: اگر رسوب بماند روی کاغذ. */
export async function filterInto(f,dst,{amount=.8,color=WATER,alpha=0,residueHex=null,dur=5}={}){
  const tip=f.stemTip;
  f.setFill(1,color,alpha);
  await sleep(.6);
  const l0=dst.level;
  await tween(dur,k=>{
    f.setFill(lerp(1,.06,k),color,alpha);
    dst.addLiquid(lerp(l0,l0+amount,k)-dst.level,color,alpha);
    if(residueHex!==null)f.setResidue(residueHex,Math.min(1,k*1.6));
    setStream(tip.x,tip.y,dst.group.position.y+Math.max(dst.level,.06)+.02,tip.z,.018,color,.5);
  },lin);
  stream.visible=false;
  f.setFill(0);
}

/* ====================== قوطی فیلم ====================== */
export function makeCanister(x=0,z=0,{hex=0xdfe3e6,lid=0x2d3a47}={}){
  const g=new THREE.Group();g.position.set(x,0,z);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.34,.3,.9,28,1,true),new THREE.MeshStandardMaterial({color:hex,roughness:.5,transparent:true,opacity:.62,side:THREE.DoubleSide}));
  body.position.y=.45;body.castShadow=true;g.add(body);
  const bot=new THREE.Mesh(new THREE.CircleGeometry(.3,28),new THREE.MeshStandardMaterial({color:hex,roughness:.5,transparent:true,opacity:.85}));bot.rotation.x=-Math.PI/2;bot.position.y=.01;g.add(bot);
  const lidG=new THREE.Group();lidG.position.y=.9;g.add(lidG);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.2,28),new THREE.MeshStandardMaterial({color:lid,roughness:.55}));cap.position.y=.1;cap.castShadow=true;lidG.add(cap);
  const liqMat=liquidMat();const liq=new THREE.Mesh(new THREE.CylinderGeometry(.29,.29,1,24),liqMat);liq.visible=false;g.add(liq);
  world.dyn.add(g);addBlob(world.dyn,x,z,1.1,1.1,.4);
  const c={group:g,lid:lidG,body,liq,liqMat,open:false,
    setLiquid(h,color=WATER,op=.45){liq.visible=h>.01;liq.scale.y=Math.max(.01,h);liq.position.y=c.flipped?.88-h/2:.02+h/2;liqMat.color.copy(color);liqMat.opacity=op;}};
  return c;
}
/* باز/بسته‌کردن درپوش با انیمیشن؛ pop=true یعنی پرتاب شدن درپوش با فشار گاز */
export async function popLid(c,{pop=false,dur=pop?1.1:.8}={}){
  const l=c.lid,p0=l.position.clone();c.open=true;
  if(!pop){await moveTo(l,v3(p0.x+.5,p0.y+.2,p0.z),dur,{z:-.5},.3);return;}
  const v=v3(rnd(-.4,.4),4.2,rnd(-.4,.4)),sp=rnd(5,9);
  await tween(dur,k=>{
    const t=k*dur;l.position.set(p0.x+v.x*t,p0.y+v.y*t-4.8*t*t,p0.z+v.z*t);
    l.rotation.x=sp*t;l.rotation.z=sp*.6*t;
  },lin);
}
export async function closeLid(c,dur=.6){
  c.open=false;await moveTo(c.lid,v3(0,.9,0),dur,{x:0,y:0,z:0},.25);
}
