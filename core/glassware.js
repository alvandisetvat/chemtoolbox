import {THREE,$,TAU,V3,V2,C,clamp,lerp,rnd,v3,easeIO,easeOut,lin,fa,FONT,world,tweens,tween,sleep,moveTo} from './kernel.js';
import {NOISE,SPRITE,paperTex,canvasTex,PLASTIC_BUMP} from './textures.js';
import {Slosh,glassFres,glassRefl,liquidMat,mesh,lathe,bumpy,addBlob} from './materials.js';
/* ================= ثابت‌های هندسی ================= */
export const TR=.2,TH=3.2,TW=.024,TI=TR-TW,RL=TI-.006,CY=TR;
export const SLOT_X=[-1.2,0,1.2], RACK_Y=.12;
export const WATER=new C(0xdff3ff), NAOHC=new C(0xeaf4ff);

/* ================= لولهٔ آزمایش ================= */
export function tubeShellGeo(){
  const pts=[];const N=14;
  for(let i=0;i<=N;i++){const a=-Math.PI/2+i/N*Math.PI/2;pts.push([TR*Math.cos(a),TR+TR*Math.sin(a)]);}
  pts.push([TR,TH-.04],[TR+.022,TH-.01],[TR+.022,TH+.02],[TI,TH+.02],[TI,TH-.04],[TI,CY]);
  for(let i=1;i<=N;i++){const a=-i/N*Math.PI/2;pts.push([TI*Math.cos(a),TW+TI+TI*Math.sin(a)]);}
  return lathe(pts,44);
}
export const TUBE_GEO=tubeShellGeo();
export function liquidGeo(level){
  const cy=CY,rl=RL,pts=[];
  const lv=Math.max(level,TW+.01);
  const sinMax=clamp((lv-cy)/rl,-1,0), aMax=Math.asin(sinMax), N=12;
  for(let i=0;i<=N;i++){const a=-Math.PI/2+(aMax+Math.PI/2)*i/N;pts.push([rl*Math.cos(a),cy+rl*Math.sin(a)]);}
  if(lv>cy+.05)pts.push([rl,lv+.026],[rl-.012,lv+.01],[rl-.035,lv+.003],[rl-.07,lv]);   // خمیدگی لبهٔ سطح (منیسک)
  else if(lv>cy)pts.push([rl,lv]);
  pts.push([.0001,lv]);
  return lathe(pts,40);
}

/* ذره‌های رسوب/جامد: لخته‌های کوچک سه‌بعدی نامنظم (InstancedMesh) در دو گروه:
   معلق (نیمه‌شفاف) و ته‌نشین (مات و کمی تیره‌تر). هر لخته که به کف برسد به گروه ته‌نشین می‌رود. */
let CLUMP_GEO=null;
function clumpGeo(){
  if(CLUMP_GEO)return CLUMP_GEO;
  const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position,seen=new Map();
  for(let i=0;i<p.count;i++){   // جابه‌جایی تصادفی ولی یکسان برای رأس‌های مشترک
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),key=x.toFixed(3)+','+y.toFixed(3)+','+z.toFixed(3);
    let k=seen.get(key);if(!k){k=.68+Math.random()*.5;seen.set(key,k);}
    p.setXYZ(i,x*k*1.15,y*k*.8,z*k);
  }
  g.computeVertexNormals();return CLUMP_GEO=g;
}
/* لکهٔ بازتاب نرم (پنجره و چراغ) روی شیشه؛ افزایشی و بدون نوشتن عمق */
let STREAK_TEX=null;
export function glassStreaks(R,y0,h){
  if(!STREAK_TEX)STREAK_TEX=canvasTex(64,256,(g,w,hh)=>{
    const gx=g.createLinearGradient(0,0,w,0);gx.addColorStop(0,'rgba(255,255,255,0)');gx.addColorStop(.35,'rgba(255,255,255,.9)');gx.addColorStop(.65,'rgba(255,255,255,.9)');gx.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gx;g.fillRect(0,0,w,hh);
    g.globalCompositeOperation='destination-in';
    const gy=g.createLinearGradient(0,0,0,hh);gy.addColorStop(0,'rgba(0,0,0,0)');gy.addColorStop(.12,'rgba(0,0,0,1)');gy.addColorStop(.85,'rgba(0,0,0,.8)');gy.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gy;g.fillRect(0,0,w,hh);
  },{srgb:false});
  const grp=new THREE.Group();
  for(const [t0,len,op] of [[-.95,.3,.42],[.7,.14,.22]]){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(R,R,h,6,1,true,t0,len),
      new THREE.MeshBasicMaterial({map:STREAK_TEX,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.FrontSide}));
    m.position.y=y0+h/2;m.renderOrder=11;grp.add(m);
  }
  return grp;
}
export class Cloud{
  constructor(tube,N,o){
    this.tube=tube;this.N=N;this.count=0;this.o=o;
    this.rad=o.size*(o.clump||.3);                         // بیشینهٔ شعاع لخته
    this.pos=new Float32Array(N*3);this.col=new Float32Array(N*3);
    this.vy=new Float32Array(N);this.sink=new Float32Array(N);this.h=new Float32Array(N);
    this.rot=new Float32Array(N*4);this.sc=new Float32Array(N);this.ph=new Float32Array(N);this.age=new Float32Array(N);this.T=0;
    const geo=clumpGeo();
    const mk=(opacity,tr)=>{const m=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({roughness:.85,metalness:0,flatShading:true,transparent:true,opacity,depthWrite:tr!==1}),N);
      m.count=0;m.frustumCulled=false;m.renderOrder=tr===2?7:6;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.setColorAt(0,new C(1,1,1));tube.group.add(m);return m;};
    this.susp=mk(o.opacity<1?o.opacity*.85:.9,1);     // معلق: نیمه‌شفاف
    this.sett=mk(1,2);                                   // ته‌نشین: مات، پس از مایع رسم می‌شود تا رنگ مایع رویش نیفتد
    this._m=new THREE.Matrix4();this._q=new THREE.Quaternion();this._p=new THREE.Vector3();this._s=new THREE.Vector3();this._c=new C();
    this.nSusp=0;
  }
  spawn(n,y0,spread,hex,vy0=0,ox=0,oz=0){
    const base=new C(hex);
    for(let k=0;k<n&&this.count<this.N;k++){
      const i=this.count++,a=rnd(0,TAU),r=Math.sqrt(Math.random())*spread;
      this.pos[i*3]=ox+Math.cos(a)*r;this.pos[i*3+1]=y0+rnd(-.04,.04);this.pos[i*3+2]=oz+Math.sin(a)*r;
      this.vy[i]=vy0;this.sink[i]=rnd(this.o.sinkMin,this.o.sinkMax)*(this.o.sinkMax<.5?1.5:1);this.h[i]=Math.random();this.ph[i]=Math.random();this.age[i]=0;
      const v=rnd(.8,1.15);
      this.col[i*3]=base.r*v;this.col[i*3+1]=base.g*v;this.col[i*3+2]=base.b*v;
      this._q.set(rnd(-1,1),rnd(-1,1),rnd(-1,1),rnd(-1,1)).normalize();
      this.rot[i*4]=this._q.x;this.rot[i*4+1]=this._q.y;this.rot[i*4+2]=this._q.z;this.rot[i*4+3]=this._q.w;
      this.sc[i]=this.rad*rnd(.4,1);
    }
    this.draw();
  }
  setActive(n){this.count=Math.max(0,Math.min(this.count,Math.floor(n)));this.draw();}
  clear(){this.count=0;this.draw();}
  /* نوشتن ماتریس‌ها: ته‌نشین‌شده‌ها در یک گروه و معلق‌ها در گروه دیگر */
  draw(){
    const {pos,col,rot,sc,count,_m,_q,_p,_s,_c}=this,f0=this.tube.floorAt?this.tube.floorAt(0):0;
    let a=0,b=0;
    for(let i=0;i<count;i++){
      const j=i*3,settled=this.vy[i]===0&&this.rest&&this.rest[i];
      _p.set(pos[j],pos[j+1],pos[j+2]);_q.set(rot[i*4],rot[i*4+1],rot[i*4+2],rot[i*4+3]);_s.setScalar(sc[i]);
      _m.compose(_p,_q,_s);
      if(settled){this.sett.setMatrixAt(b,_m);const ao=.7+.3*Math.min(1,Math.max(0,(pos[j+1]-f0)/(this.o.pileMax+.05)));_c.setRGB(col[j]*.95*ao,col[j+1]*.95*ao,col[j+2]*.95*ao);this.sett.setColorAt(b,_c);b++;}
      else{this.susp.setMatrixAt(a,_m);_c.setRGB(col[j],col[j+1],col[j+2]);this.susp.setColorAt(a,_c);a++;}
    }
    this.susp.count=a;this.sett.count=b;this.nSusp=a;
    this.susp.instanceMatrix.needsUpdate=this.sett.instanceMatrix.needsUpdate=true;
    if(this.susp.instanceColor)this.susp.instanceColor.needsUpdate=true;
    if(this.sett.instanceColor)this.sett.instanceColor.needsUpdate=true;
  }
  update(dt,level){
    if(!this.count||dt<=0)return;
    dt=Math.min(dt,.05);
    if(!this.rest)this.rest=new Uint8Array(this.N);
    const o=this.o,ag=this.tube.agit,A=this.pos,R=this.rad;
    const tb=this.tube,pile=o.pileMax*Math.min(1,this.count/o.pileN),rl=Math.max(.04,(tb.innerR||RL)-R*1.4-.004);
    const dif=o.diff*(1+ag*14);const T=(this.T+=dt);
    for(let i=0;i<this.count;i++){
      const j=i*3;let x=A[j],y=A[j+1],z=A[j+2],vy=this.vy[i];
      if(this.rest[i]&&ag<.05&&Math.abs(level-y)>.02){continue;}   // لختهٔ ته‌نشین‌شده بی‌حرکت می‌ماند تا هم بخورد
      if(y>level+.03){vy-=9*dt;}
      else{
        /* ته‌نشینی آرام: پخش اولیه با نرم‌شدن تدریجی؛ فقط با تکان‌دادن ظرف دوباره آشفته می‌شود */
        const calm=1-Math.min(1,this.age[i]);
        vy+=(-this.sink[i]*(1-ag*.8)-vy)*Math.min(1,3*dt);
        const sw=(.15+calm*.85)*dif*.5+ag*.012;
        x+=Math.sin(T*1.7+this.ph[i]*6.3)*sw*dt*6;z+=Math.cos(T*1.3+this.ph[i]*9.1)*sw*dt*6;
        y+=ag*(Math.random()-.3)*.05;
        this.age[i]+=dt*.35;
        if(y>level-.01)y=level-.01;
      }
      y+=vy*dt;
      let r=Math.hypot(x,z);
      if(r>rl){x*=rl/r;z*=rl/r;r=rl;}
      const sr=this.sc[i];
      const fl=(tb.floorAt?tb.floorAt(r):CY-Math.sqrt(Math.max(rl*rl-r*r,0)))+sr*.8+this.h[i]*pile*(1-.55*(r*r)/(rl*rl));
      this.rest[i]=0;
      if(y<fl){y=fl;vy=0;this.rest[i]=ag<.05?1:0;}
      A[j]=x;A[j+1]=y;A[j+2]=z;this.vy[i]=vy;
    }
    this.draw();
  }
}

export class Tube{
  constructor(slot,big,small,showLabel){
    this.slot=slot;
    this.group=new THREE.Group();
    this.group.position.set(SLOT_X[slot],RACK_Y,0);
    this.rest=this.group.position.clone();
    this.level=0;this.alpha=0;this.color=WATER.clone();
    this.precipColor=new C(0x4f8f6b);this.agit=0;this.agitTarget=0;this.dirty=true;
    this.group.add(mesh(TUBE_GEO,glassFres,10),mesh(TUBE_GEO,glassRefl,11),glassStreaks(TR+.004,.5,TH-.9));
    this.liqMat=liquidMat();
    this.slosh=new Slosh(.1);this.liq=mesh(liquidGeo(.05),this.liqMat,5);this.liq.visible=false;this.group.add(this.liq);
    this.solid=new Cloud(this,320,{size:.13,sinkMin:.8,sinkMax:1.3,diff:.03,pileMax:.14,pileN:300,opacity:1});
    this.precip=new Cloud(this,1500,{size:.17,sinkMin:.02,sinkMax:.07,diff:.35,pileMax:.32,pileN:1300,opacity:.7});
    const band=new THREE.CylinderGeometry(TR+.006,TR+.006,.58,28,1,true,-.62,1.24);
    const tex=paperTex(220,480,[
      {t:big,size:big.length>2?84:170,y:190,dir:big.length>2?'ltr':'rtl'},
      {t:small,size:54,y:380,weight:600}
    ]);
    this.sticker=new THREE.Mesh(band,new THREE.MeshStandardMaterial({map:tex,roughness:.7,polygonOffset:true,polygonOffsetFactor:-2}));
    this.sticker.position.y=2.55;this.sticker.visible=!!showLabel;
    this.group.add(this.sticker);
    this.ripple=new THREE.Mesh(new THREE.RingGeometry(.03,.05,28),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide}));
    this.ripple.rotation.x=-Math.PI/2;this.ripple.visible=false;this.ripple.renderOrder=8;
    this.group.add(this.ripple);
    world.dyn.add(this.group);
    addBlob(world.dyn,this.rest.x,0,.9,.9,.45);
  }
  turb(){return clamp(this.precip.count/1300,0,1);}
  dispColor(){return this.color.clone().lerp(this.precipColor,this.turb()*.7);}
  dispOpacity(){return clamp(.28+.5*this.alpha+.55*this.turb(),0,.93);}
  addLiquid(dv,color,alpha){
    if(dv<0){this.level=Math.max(0,this.level+dv);this.dirty=true;if(this.level<1e-6)this.alpha=0;return;}   // برداشتن مایع (ریختن بیرون)
    if(dv===0)return;
    const v1=this.level,v2=dv,w1=v1*this.alpha,w2=v2*alpha;
    if(w1+w2>1e-6){
      this.color.copy(this.color.clone().multiplyScalar(w1).add(color.clone().multiplyScalar(w2)).multiplyScalar(1/(w1+w2)));
    }else if(v1<=1e-6){this.color.copy(color);}
    this.alpha=(v1*this.alpha+v2*alpha)/(v1+v2);
    this.level=v1+v2;this.dirty=true;
  }
  update(dt){
    if(this.dirty){
      this.liq.geometry.dispose();this.liq.geometry=liquidGeo(this.level);this.dirty=false;
    }
    this.liq.visible=this.level>TW+.015;
    this.agit+=(this.agitTarget-this.agit)*Math.min(1,6*dt);
    this.slosh.step(dt,this.group,this.liqMat,this.level,TW);
    this.solid.update(dt,this.level);this.precip.update(dt,this.level);
    if(this.liq.visible){
      const c=this.dispColor();
      this.liqMat.color.copy(c);this.liqMat.emissive.copy(c).multiplyScalar(.3);
      this.liqMat.opacity=this.dispOpacity();
    }
  }
}

/* ================= ظرف‌ها ================= */
export function makeJar(formula,pname,hex,kind){
  const g=new THREE.Group();const R=.62,H=1.1;
  const shell=lathe([[0,0],[R-.06,0],[R,.07],[R,H],[R-.05,H],[R-.05,.15],[0,.15]],44);
  g.add(mesh(shell,glassFres,10),mesh(shell,glassRefl,11));
  const pm=new THREE.MeshStandardMaterial({color:hex,roughness:.85,bumpMap:NOISE,bumpScale:2});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(R-.07,R-.07,.55,32),pm);body.position.y=.425;body.castShadow=true;
  const cap=new THREE.Mesh(bumpy(new THREE.SphereGeometry(1,28,12,0,TAU,0,Math.PI/2),.16),pm);
  cap.scale.set(R-.07,.14,R-.07);cap.position.y=.7;cap.castShadow=true;
  g.add(body,cap);
  if(kind==='pellet'){
    const n=120,im=new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,8),new THREE.MeshStandardMaterial({color:0xfafaf6,roughness:.3}),n);
    const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();
    for(let i=0;i<n;i++){
      const a=rnd(0,TAU),r=Math.sqrt(Math.random())*(R-.13);
      e.set(rnd(0,3),rnd(0,3),rnd(0,3));q.setFromEuler(e);
      m.compose(v3(Math.cos(a)*r,.74+rnd(0,.07)*(1-r/R),Math.sin(a)*r),q,v3(.075,.042,.075));im.setMatrixAt(i,m);
    }
    g.add(im);
  }
  const lab=new THREE.Mesh(new THREE.CylinderGeometry(R+.012,R+.012,.62,32,1,true,-.85,1.7),
    new THREE.MeshStandardMaterial({map:paperTex(300,190,[{t:formula,size:78,y:62,dir:'ltr'},{t:pname,size:40,y:138,weight:600}]),roughness:.7,polygonOffset:true,polygonOffsetFactor:-2}));
  lab.position.y=.6;g.add(lab);
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(R+.02,R+.02,.2,36),new THREE.MeshStandardMaterial({color:0x1b1f25,roughness:.45,metalness:.1}));
  lid.position.y=H+.1;lid.castShadow=true;g.add(lid);
  g.traverse(o=>{if(o.isMesh&&o.renderOrder===0)o.receiveShadow=true;});
  return {group:g,lid};
}
export function makeBottle(formula,pname){
  const g=new THREE.Group();
  const shell=lathe([[0,0],[.5,0],[.56,.08],[.56,1.15],[.5,1.35],[.24,1.55],[.22,1.95],[.28,2.0],[.28,2.05],[.2,2.05],[.2,1.95],[.2,1.55],[.45,1.32],[.5,1.15],[.5,.14],[0,.14]],44);
  g.add(mesh(shell,glassFres,10),mesh(shell,glassRefl,11));
  const lm=liquidMat();lm.opacity=.3;
  const liq=mesh(new THREE.CylinderGeometry(.49,.49,.98,32),lm,5);liq.position.y=.63;g.add(liq);
  const lab=new THREE.Mesh(new THREE.CylinderGeometry(.575,.575,.7,32,1,true,-.85,1.7),
    new THREE.MeshStandardMaterial({map:paperTex(300,220,[{t:formula,size:84,y:70,dir:'ltr'},{t:pname,size:36,y:160,weight:600}]),roughness:.7,polygonOffset:true,polygonOffsetFactor:-2}));
  lab.position.y=.62;g.add(lab);
  return {group:g,liq};
}

/* ================= قاشقک ================= */
export function makeSpoon(){
  const g=new THREE.Group();g.rotation.order='YXZ';
  const metal=new THREE.MeshStandardMaterial({color:0xd5d9dd,metalness:1,roughness:.22,side:THREE.DoubleSide});
  const bowl=new THREE.Mesh(new THREE.SphereGeometry(1,28,14,0,TAU,Math.PI/2,Math.PI/2),metal);
  bowl.scale.set(.17,.09,.26);bowl.castShadow=true;
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(.045,.03,3.4,14),metal);
  handle.rotation.x=Math.PI/2;handle.position.z=1.85;handle.castShadow=true;
  const holder=new THREE.Group();holder.position.y=.045;
  const mound=new THREE.Mesh(bumpy(new THREE.IcosahedronGeometry(.13,2),.5),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9,bumpMap:NOISE,bumpScale:2}));
  mound.scale.set(1,.55,1.4);holder.add(mound);holder.visible=false;
  g.add(bowl,handle,holder);
  g.holder=holder;g.mound=mound;
  return g;
}

/* ================= قطره‌چکان ================= */
export function dropperR(y){return y>=.9?.062:.022+(.062-.022)*Math.pow(y/.9,.8);}
export function makeDropper(){
  const g=new THREE.Group();
  const op=[];for(let y=0;y<=1.6001;y+=.08)op.push([dropperR(y),y]);
  op.push([.075,1.6],[.075,1.7]);
  const glassG=lathe(op,28);
  g.add(mesh(glassG,glassFres,10),mesh(glassG,glassRefl,11));
  const bulbG=lathe([[.07,0],[.1,.12],[.15,.38],[.17,.7],[.13,.98],[.06,1.15],[0,1.18]],28);
  const rubber=new THREE.MeshPhysicalMaterial({color:0x1b1b1e,roughness:.62,clearcoat:.25,clearcoatRoughness:.55,bumpMap:PLASTIC_BUMP,bumpScale:.3});
  const bulb=new THREE.Mesh(bulbG,rubber);bulb.position.y=1.62;bulb.castShadow=true;g.add(bulb);
  const lm=liquidMat();
  const liq=mesh(new THREE.BufferGeometry(),lm,5);g.add(liq);
  const d={group:g,bulb,liq,lm,fill:0,liqColor:WATER.clone(),liqAlpha:0};
  d.setFill=f=>{
    d.fill=clamp(f,0,1);
    liq.geometry.dispose();
    if(d.fill<.01){liq.visible=false;return;}
    liq.visible=true;
    const h=d.fill*1.45,pts=[];
    for(let y=.02;y<=.02+h;y+=h/10)pts.push([Math.max(dropperR(y)-.015,.004),y]);
    pts.push([.0001,.02+h]);
    liq.geometry=lathe(pts,16);
  };
  d.setLiquid=(c,a)=>{
    d.liqColor.copy(c);d.liqAlpha=a;
    lm.color.copy(c);lm.emissive.copy(c).multiplyScalar(.3);lm.opacity=clamp(.25+.5*a,0,.9);
  };
  d.setBulb=s=>{bulb.scale.set(1+(1-s)*.3,s,1+(1-s)*.3);};
  g.traverse(o=>{if(o.isMesh)o.castShadow=false;});bulb.castShadow=true;
  return d;
}

/* ================= شیشهٔ شست‌وشو (آب مقطر) ================= */
export const WASH_TIP=v3(1.62,3.04,0);
export function makeWash(){
  const g=new THREE.Group();g.rotation.y=-Math.PI/2;
  const plastic=new THREE.MeshPhysicalMaterial({color:0xeef2f5,roughness:.42,clearcoat:.35,clearcoatRoughness:.4,bumpMap:PLASTIC_BUMP,bumpScale:.3,envMapIntensity:.8});
  const body=new THREE.Mesh(lathe([[0,0],[.52,0],[.6,.1],[.6,.2],[.57,.27],[.6,.34],[.57,.41],[.6,.48],[.6,1.9],[.55,2.15],[.38,2.35],[.22,2.45],[.2,2.62],[0,2.62]],48),plastic);
  body.castShadow=true;body.receiveShadow=true;
  const blue=new THREE.MeshStandardMaterial({color:0x2f6fb5,roughness:.45,bumpMap:PLASTIC_BUMP,bumpScale:.3,envMapIntensity:.8});
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.22,24),blue);cap.position.y=2.72;cap.castShadow=true;
  const curve=new THREE.CatmullRomCurve3([v3(0,2.8,0),v3(0,3.15,0),v3(.3,3.45,0),v3(1,3.5,0),v3(1.55,3.3,0),v3(1.62,3.08,0)]);
  const noz=new THREE.Mesh(new THREE.TubeGeometry(curve,40,.05,10),blue);noz.castShadow=true;
  const lab=new THREE.Mesh(new THREE.CylinderGeometry(.606,.606,1.15,32,1,true,Math.PI/2-.9,1.8),
    new THREE.MeshStandardMaterial({map:paperTex(300,230,[{t:'آب مقطر',size:76,y:80},{t:'H₂O',size:70,y:170,dir:'ltr'}]),roughness:.6,polygonOffset:true,polygonOffsetFactor:-2}));
  lab.position.y=1.0;
  g.add(body,cap,noz,lab);g.body=body;
  /* تغییر برچسب (مثلاً «آب شیر») */
  g.setLabel=(fa,en='H₂O')=>{lab.material.map=paperTex(300,230,[{t:fa,size:fa.length>6?62:76,y:80},{t:en,size:70,y:170,dir:'ltr'}]);lab.material.needsUpdate=true;};
  return g;
}

