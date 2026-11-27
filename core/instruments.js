/* ابزارها: دماسنج، ترازو، چراغ بونزن + سه‌پایه، جوشش/بخار، مدار رسانایی (LED) */
import {THREE,TAU,V3,C,clamp,lerp,rnd,v3,lin,easeOut,easeIO,world,tween,sleep,moveTo,addUpdater,FONT} from './kernel.js';
import {canvasTex,SPRITE} from './textures.js';
import {glassFres,glassPhysical,glassRefl,mesh,lathe,addBlob,plastic} from './materials.js';
import {BRUSHED_BUMP} from './textures.js';

const UP=new V3(0,1,0);
const metalMat=(c=0x8a8f96)=>new THREE.MeshStandardMaterial({color:c,roughness:.26,metalness:.9,envMapIntensity:1.5,bumpMap:BRUSHED_BUMP,bumpScale:.25});
function rodBetween(a,b,r,mat){
  const d=b.clone().sub(a),len=d.length();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10),mat);
  m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(UP,d.normalize());m.castShadow=true;return m;
}

/* ====================== دماسنج ======================
   مبدأ: پایین حبابچه. طول TH_L. دمای نمایش −۱۰ تا ۱۱۰ درجه. */
export const TH_L=4.4,TH_MIN=-10,TH_MAX=110,TH_Y0=.5,TH_Y1=TH_L-.3;
export function makeThermometer(x=-2.6,z=1.9,{T=25}={}){
  const g=new THREE.Group();
  const stem=lathe([[0,0],[.075,.02],[.085,.12],[.04,.22],[.04,TH_L-.05],[.045,TH_L],[0,TH_L]],14);
  g.add(mesh(stem,glassPhysical,10),mesh(stem,glassRefl,11));
  /* پشتی مدرج */
  const tex=canvasTex(128,1024,(c,w,h)=>{
    c.fillStyle='#f4f1e6';c.fillRect(0,0,w,h);c.strokeStyle='#1d2630';c.fillStyle='#1d2630';c.textAlign='left';
    const Y=t=>h*(1-((TH_Y0+(TH_Y1-TH_Y0)*(t-TH_MIN)/(TH_MAX-TH_MIN))/TH_L));
    for(let t=TH_MIN;t<=TH_MAX;t+=2){
      const ten=t%10===0,five=t%5===0,y=Y(t);c.lineWidth=ten?3:2;c.beginPath();c.moveTo(w-4,y);c.lineTo(w-(ten?44:five?30:18),y);c.stroke();
      if(ten){c.font='700 26px Tahoma, sans-serif';c.fillText(String(t),6,y+9);}
    }
    c.font='700 24px Tahoma, sans-serif';c.fillText('°C',6,34);
  });
  const back=new THREE.Mesh(new THREE.BoxGeometry(.24,TH_L-.35,.03),new THREE.MeshStandardMaterial({map:tex,roughness:.6}));
  back.position.set(0,.3+(TH_L-.35)/2,-.075);back.castShadow=true;g.add(back);
  const stemL=TH_L-.35;                                                    // بدنهٔ شیشه‌ای دماسنج
  const gs=new THREE.CylinderGeometry(.055,.055,stemL,14,1,true);
  const gl1=mesh(gs,glassPhysical,10),gl2=mesh(gs,glassRefl,11);gl1.position.set(0,.3+stemL/2,.02);gl2.position.copy(gl1.position);g.add(gl1,gl2);
  const redMat=new THREE.MeshStandardMaterial({color:0xd62828,roughness:.3,emissive:0x5a0808});
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.07,16,12),redMat);bulb.position.y=.1;g.add(bulb);
  const col=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,1,8),redMat);g.add(col);
  g.position.set(x,0,z);g.rotation.z=-Math.PI/2;g.position.y=.12;   // افتاده روی میز
  world.dyn.add(g);
  const th={group:g,T:25,rest:g.position.clone(),restRot:{x:g.rotation.x,y:g.rotation.y,z:g.rotation.z},
    setTemp(t){th.T=t;const y=TH_Y0+(TH_Y1-TH_Y0)*clamp((t-TH_MIN)/(TH_MAX-TH_MIN),0,1);col.scale.y=Math.max(.01,y-.1);col.position.y=.1+(y-.1)/2;}};
  th.setTemp(T);return th;
}
/* مسیر امن: دماسنج ابتدا افقی بالا می‌رود (بالاتر از همهٔ ظرف‌ها)، آنجا عمودی می‌شود، بالای ظرف می‌رود و مستقیم پایین می‌آید. */
const TH_SAFE=5.0;
/* دماسنج را در ظرف فرو می‌برد و دما را به‌تدریج به T می‌رساند (T0: دمای آغازین). */
export async function dipThermometer(th,vessel,T,{T0=null,dur=3,depth=.9}={}){
  const p=vessel.dipAt||vessel.group.position,from=T0===null?th.T:T0,g=th.group;
  const x=p.x+Math.min(.12,(vessel.innerR||.4)*.3);
  await moveTo(g,v3(g.position.x,TH_SAFE,g.position.z),.9);          // ۱) بالا، هنوز افقی
  await moveTo(g,v3(x,TH_SAFE,p.z),1.0);                              // ۲) بالای ظرف
  await moveTo(g,v3(x,TH_SAFE,p.z),.8,{x:0,y:0,z:0});                 // ۳) عمودی شدن (دماسنج بالای همه‌چیز است)
  const yIn=Math.max(.2,(vessel.group.position.y||0)+(vessel.level||1)-depth*.5)+.1;
  await moveTo(g,v3(x,yIn,p.z),1.2);                                  // ۴) مستقیم پایین
  await tween(dur,k=>th.setTemp(lerp(from,T,easeOut(k))),lin);
}
export async function liftThermometer(th,dur=1.4){
  const g=th.group,r=th.rest;
  await moveTo(g,v3(g.position.x,TH_SAFE,g.position.z),1.0);          // مستقیم بالا
  await moveTo(g,v3(g.position.x,TH_SAFE,g.position.z),.7,th.restRot); // افقی
  await moveTo(g,v3(r.x,TH_SAFE,r.z),1.0);
  await moveTo(g,r,dur*.7);
}

/* ====================== ترازو (دیجیتال) ====================== */
export function makeBalance(x=0,z=0,{max=200,dish=false}={}){
  const g=new THREE.Group();g.position.set(x,0,z);
  const body=new THREE.Mesh(new THREE.BoxGeometry(2.8,.34,2.3),plastic(0xdfe3e8,.38));
  body.position.y=.17;body.castShadow=body.receiveShadow=true;g.add(body);
  const front=new THREE.Mesh(new THREE.BoxGeometry(2.5,.05,.5),plastic(0x2a313b,.55));front.position.set(0,.34,.82);g.add(front);
  const cv=document.createElement('canvas');cv.width=512;cv.height=160;const cx=cv.getContext('2d');
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.4),new THREE.MeshBasicMaterial({map:tex}));
  scr.rotation.x=-Math.PI/2+.2;scr.position.set(-.4,.375,.85);g.add(scr);
  const btn=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.05,16),new THREE.MeshStandardMaterial({color:0x2dd4bf,roughness:.4}));btn.position.set(.9,.375,.86);g.add(btn);
  const bez=new THREE.Mesh(new THREE.PlaneGeometry(1.48,.54),new THREE.MeshStandardMaterial({color:0x14181d,roughness:.4}));bez.rotation.x=-Math.PI/2+.2;bez.position.set(-.4,.372,.85);g.add(bez);   // قاب نمایشگر
  for(const fx of [-1.2,1.2])for(const fz of [-.95,.95]){const ft=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,.06,12),new THREE.MeshStandardMaterial({color:0x1b1d21,roughness:.9}));ft.position.set(fx,.03,fz);g.add(ft);}   // پایه‌های لاستیکی
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,.2,16),metalMat(0x7d838c));pillar.position.set(0,.44,-.25);g.add(pillar);
  const PAN_Y=.62;
  const pan=new THREE.Mesh(new THREE.CylinderGeometry(.58,.58,.06,36),metalMat(0xc7ccd3));pan.position.set(0,PAN_Y-.03,-.25);pan.castShadow=pan.receiveShadow=true;g.add(pan);
  if(dish){const d=new THREE.Mesh(new THREE.CylinderGeometry(.5,.44,.05,32),new THREE.MeshStandardMaterial({color:0x1f4e5f,roughness:.5}));d.position.set(0,PAN_Y+.025,-.25);d.receiveShadow=true;g.add(d);}
  world.dyn.add(g);addBlob(world.dyn,x,z,3.5,3.0,.4);
  const b={group:g,pan,panY:PAN_Y,raw:0,tareOff:0,max,
    get panPos(){return v3(g.position.x,PAN_Y,g.position.z-.25);},
    show(v,dec=2){
      cx.fillStyle='#0b1a12';cx.fillRect(0,0,512,160);
      cx.fillStyle='#8cf0b0';cx.font='700 96px "Courier New",monospace';cx.textAlign='right';cx.textBaseline='middle';
      cx.fillText(Math.abs(v)<1e-9?(0).toFixed(dec):v.toFixed(dec),400,84);
      cx.font='700 46px Tahoma,sans-serif';cx.textAlign='left';cx.fillText('g',420,92);tex.needsUpdate=true;},
    setMass(m){b.raw=m;b.show(m-b.tareOff);},
    tare(){b.tareOff=b.raw;b.show(0);},
    clear(){b.raw=0;b.tareOff=0;b.show(0);}
  };
  b.show(0);return b;
}
/* جسم obj را روی کفهٔ ترازو می‌گذارد و عدد به‌تدریج روی grams (جرم کل روی کفه) می‌نشیند */
export async function weighOn(b,obj,grams,{dur=1.6}={}){
  const pp=b.panPos,m0=b.raw;
  await moveTo(obj,v3(pp.x,pp.y+(obj.userData.baseY||0)+.9,pp.z),1.2,null,.5);
  await moveTo(obj,v3(pp.x,pp.y+(obj.userData.baseY||0),pp.z),.5);
  await tween(dur,k=>{b.setMass(lerp(m0,grams,easeOut(k))+(grams-m0)*.012*Math.sin(k*24)*(1-k));},lin);
  b.setMass(grams);
}
export async function takeOff(b,obj,to,{dur=1.3}={}){
  await moveTo(obj,v3(b.panPos.x,b.panPos.y+1.2,b.panPos.z),.7);
  b.setMass(b.tareOff);
  await moveTo(obj,to,dur,null,.6);
}

/* ====================== چراغ بونزن + سه‌پایه ====================== */
const FLAME_H=1.7;
const flameVS=`uniform float uT;varying float vY;varying vec3 vN;varying vec3 vV;
void main(){vY=clamp(position.y/${FLAME_H.toFixed(2)},0.,1.);vec3 p=position;
  p.x+=sin(uT*9.+p.y*6.)*.035*vY;p.z+=cos(uT*8.+p.y*5.)*.035*vY;
  vec4 mv=modelViewMatrix*vec4(p,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;
const flameFS=`uniform float uAir;uniform float uInt;varying float vY;varying vec3 vN;varying vec3 vV;
void main(){float e=pow(abs(dot(normalize(vN),normalize(vV))),.7);
  vec3 blue=mix(vec3(.12,.25,1.),vec3(.45,.7,1.),vY);vec3 yel=mix(vec3(1.,.82,.25),vec3(1.,.42,.08),vY);
  vec3 c=mix(yel,blue,uAir);float a=(1.-vY*.9)*e*uInt*mix(.85,.55,uAir);
  gl_FragColor=vec4(c,a);}`;
export function makeBurner(x=0,z=0){
  const g=new THREE.Group();g.position.set(x,0,z);
  const dark=new THREE.MeshStandardMaterial({color:0x353b44,roughness:.4,metalness:.85,envMapIntensity:1.3});
  const base=new THREE.Mesh(lathe([[0,0],[.62,0],[.62,.08],[.34,.18],[.13,.3],[0,.3]],36),dark);base.castShadow=true;g.add(base);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,1.3,20,1,true),metalMat(0xb6bcc4));barrel.position.y=.3+.65;barrel.castShadow=true;g.add(barrel);
  const collar=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.3,24),new THREE.MeshStandardMaterial({color:0x14171c,roughness:.5,metalness:.4}));collar.position.y=.55;g.add(collar);
  for(let k=0;k<20;k++){const a=k/20*TAU,rib=new THREE.Mesh(new THREE.BoxGeometry(.025,.28,.03),new THREE.MeshStandardMaterial({color:0x23272d,roughness:.4,metalness:.6}));rib.position.set(Math.cos(a)*.155,.55,Math.sin(a)*.155);rib.rotation.y=-a;g.add(rib);}   // شیارهای حلقهٔ هوا
  for(const a of [0,Math.PI]){const hole=new THREE.Mesh(new THREE.CircleGeometry(.05,12),new THREE.MeshBasicMaterial({color:0x050607}));hole.position.set(Math.cos(a+1.57)*.098,.41,Math.sin(a+1.57)*.098);hole.rotation.y=-(a+1.57)+Math.PI/2;g.add(hole);}
  const noz=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.5,10),metalMat(0x777c84));noz.rotation.z=Math.PI/2;noz.position.set(.4,.14,0);g.add(noz);
  const hose=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v3(.6,.14,0),v3(1.1,.1,.15),v3(1.6,.05,.7),v3(2.2,.05,1.3)]),24,.05,8),new THREE.MeshStandardMaterial({color:0x2f6fa8,roughness:.6}));g.add(hose);
  const TOP=1.6;
  const fl=new THREE.Group();fl.position.y=TOP;fl.visible=false;g.add(fl);
  const prof=[[0,0],[.1,.04],[.17,.35],[.15,.85],[.08,1.3],[.02,1.55],[0,FLAME_H]];
  const uT={value:0};
  const mkMat=(air,int)=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    uniforms:{uT,uAir:{value:air},uInt:{value:int}},vertexShader:flameVS,fragmentShader:flameFS});
  const mat=mkMat(0,1),mat2=mkMat(1,1.1);
  const outer=new THREE.Mesh(lathe(prof,20),mat);outer.renderOrder=20;fl.add(outer);
  const inner=new THREE.Mesh(lathe(prof,16),mat2);inner.scale.set(.5,.42,.5);inner.renderOrder=21;fl.add(inner);
  const light=new THREE.PointLight(0xffa24a,0,7,1.6);light.position.y=TOP+1;g.add(light);
  world.dyn.add(g);addBlob(world.dyn,x,z,1.9,1.9,.45);
  const b={group:g,top:v3(x,TOP,z),on:false,air:0,size:1,collar,
    get flameTip(){return v3(x,TOP+FLAME_H*b.size,z);},
    set(o){
      if(o.on!==undefined)b.on=o.on;if(o.air!==undefined)b.air=o.air;if(o.size!==undefined)b.size=o.size;
      fl.visible=b.on&&b.size>.02;fl.scale.set(b.size*(1-.25*b.air),b.size*(1+.1*b.air),b.size*(1-.25*b.air));
      mat.uniforms.uAir.value=b.air;mat.uniforms.uInt.value=b.air>.5?.85:1.15;inner.visible=b.air>.3;
      mat2.uniforms.uInt.value=1.3*b.air;collar.rotation.y=b.air*2.4;
      light.intensity=b.on?3.2*b.size*(1-.4*b.air):0;}
  };
  let t=0;addUpdater(dt=>{t+=dt;uT.value=t;if(b.on){fl.scale.y=b.size*(1+.1*b.air)*(1+.05*Math.sin(t*13)+.03*Math.sin(t*29));light.intensity=(3.2*b.size*(1-.4*b.air))*(1+.08*Math.sin(t*17));}});
  return b;
}
/* روشن/خاموش و تنظیم دریچهٔ هوا: air=۰ شعلهٔ زرد و پرنور، air=۱ شعلهٔ آبی (کامل). */
export async function setFlame(b,{on=true,air=b.air,size=on?1:0},dur=1.2){
  const a0=b.air,s0=b.size;
  if(on&&!b.on)b.set({on:true,size:.05});
  await tween(dur,k=>b.set({air:lerp(a0,air,k),size:lerp(on?Math.max(.05,s0):s0,size,k)}),easeIO);
  if(!on)b.set({on:false,size:0});
}
/* شعلهٔ مستقل (مثلاً روی ماده‌ای که می‌سوزد): f.group را به هر جسمی بچسبانید؛ f.set(اندازه) */
export function makeFlame({air=0,height=1}={}){
  const g=new THREE.Group();g.visible=false;
  const uT={value:0};
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    uniforms:{uT,uAir:{value:air},uInt:{value:1.1}},vertexShader:flameVS,fragmentShader:flameFS});
  const prof=[[0,0],[.1,.04],[.17,.35],[.15,.85],[.08,1.3],[.02,1.55],[0,FLAME_H]];
  const m=new THREE.Mesh(lathe(prof,16),mat);m.renderOrder=20;g.add(m);
  let t=0,sz=0;addUpdater(dt=>{t+=dt;uT.value=t;if(sz>0)m.scale.y=sz*height*(1+.08*Math.sin(t*14)+.05*Math.sin(t*31));});
  return {group:g,set(size){sz=size;g.visible=size>.02;m.scale.set(size*.5,size*height,size*.5);}};
}
/* سه‌پایه با توری نسوز؛ topY ارتفاع توری. ظرف را روی y = tripod.topY بگذارید. */
export function makeTripod(x=0,z=0,{topY=2.55}={}){
  const g=new THREE.Group();g.position.set(x,0,z);const m=metalMat(0x6d737b);
  const R=.82,R2=1.2;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(R,.05,10,40),m);ring.rotation.x=Math.PI/2;ring.position.y=topY-.07;g.add(ring);
  for(let i=0;i<3;i++){const a=i*TAU/3+.5;g.add(rodBetween(v3(Math.cos(a)*R,topY-.07,Math.sin(a)*R),v3(Math.cos(a)*R2,0,Math.sin(a)*R2),.045,m));}
  const tex=canvasTex(128,128,(c,w,h)=>{c.fillStyle='#8f9296';c.fillRect(0,0,w,h);c.strokeStyle='#2b2e33';c.lineWidth=3;for(let i=0;i<=16;i++){c.beginPath();c.moveTo(i*8,0);c.lineTo(i*8,h);c.moveTo(0,i*8);c.lineTo(w,i*8);c.stroke();}},{repeat:[2,2]});
  const gauze=new THREE.Mesh(new THREE.CircleGeometry(R-.02,40),new THREE.MeshStandardMaterial({map:tex,roughness:.8,side:THREE.DoubleSide}));gauze.rotation.x=-Math.PI/2;gauze.position.y=topY-.04;g.add(gauze);
  const ctr=new THREE.Mesh(new THREE.CircleGeometry(.36,28),new THREE.MeshStandardMaterial({color:0xe8e4da,roughness:1,side:THREE.DoubleSide}));ctr.rotation.x=-Math.PI/2;ctr.position.y=topY-.035;g.add(ctr);
  world.dyn.add(g);
  return {group:g,topY};
}

/* ====================== جوشش و بخار ======================
   handle.set(k): شدت جوشش ۰..۱ . روی هر ظرفی با level (بشر، استوانه، لوله) کار می‌کند. */
export function addBoiling(vessel,{r=null,n=90}={}){
  r=r||(vessel.innerR||.6)*.8;
  const mk=(N,size,op)=>{const pos=new Float32Array(N*3),pa=new THREE.BufferAttribute(pos,3);pa.setUsage(THREE.DynamicDrawUsage);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',pa);
    const pts=new THREE.Points(geo,new THREE.PointsMaterial({size,map:SPRITE,color:0xffffff,transparent:true,opacity:op,depthWrite:false,sizeAttenuation:true}));
    pts.frustumCulled=false;pts.renderOrder=7;vessel.group.add(pts);return {pos,pa,pts,geo};};
  const bub=mk(n,.06,.8),stm=mk(40,.38,.16);
  const bs=new Float32Array(n),ss=new Float32Array(40);
  for(let i=0;i<n;i++)bs[i]=Math.random();for(let i=0;i<40;i++)ss[i]=Math.random();
  const h={k:0,set(k){h.k=k;}};
  addUpdater(dt=>{
    const k=h.k,fl=vessel.floorAt?vessel.floorAt(0):.07,lv=Math.max(vessel.level,fl+.05);
    const nb=Math.floor(n*k);bub.geo.setDrawRange(0,nb);bub.pts.visible=k>.02&&vessel.level>fl+.05;
    for(let i=0;i<nb;i++){bs[i]+=dt*(.5+1.2*k)*(.6+(i%7)/7);if(bs[i]>1)bs[i]-=1;
      const a=i*2.399,q=Math.sqrt((i%13)/13)*r;bub.pos[i*3]=Math.cos(a)*q;bub.pos[i*3+1]=fl+.03+bs[i]*(lv-fl);bub.pos[i*3+2]=Math.sin(a)*q;}
    bub.pa.needsUpdate=true;
    const ns=Math.floor(40*Math.max(0,(k-.5)*2));stm.geo.setDrawRange(0,ns);stm.pts.visible=ns>0;
    const top=(vessel.H||1.8);
    for(let i=0;i<ns;i++){ss[i]+=dt*.35;if(ss[i]>1)ss[i]-=1;const a=i*2.399;
      stm.pos[i*3]=Math.cos(a)*r*.5*(1+ss[i]);stm.pos[i*3+1]=top+ss[i]*1.8;stm.pos[i*3+2]=Math.sin(a)*r*.5*(1+ss[i]);}
    stm.pa.needsUpdate=true;stm.pts.material.opacity=.2*(1-0)*Math.min(1,(k-.5)*3);
  });
  return h;
}

/* ====================== مدار رسانایی: باتری + LED + دو الکترود ======================
   ظرف (بشر) را در مرکز x,z بگذارید. tester.lower(vessel) الکترودها را فرو می‌برد؛ tester.setGlow(0..1) روشنایی LED. */
export function makeConductivityTester(x=0,z=0){
  const g=new THREE.Group();g.position.set(x,0,z);const m=metalMat(0x7f858d);
  const AY=3.5,PX=-1.5;
  const plate=new THREE.Mesh(new THREE.BoxGeometry(1.1,.12,1.7),plastic(0x2c3440,.55));plate.position.set(PX,.06,.2);plate.castShadow=true;g.add(plate);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,AY+.1,12),m);pole.position.set(PX,(AY+.1)/2,0);pole.castShadow=true;g.add(pole);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(2.0,.1,.14),m);arm.position.set(PX+1.0,AY,0);g.add(arm);
  const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.3,14),new THREE.MeshStandardMaterial({color:0x22262c,roughness:.5}));
  const sleeveL=sleeve,sleeveR=sleeve.clone();sleeveL.position.set(-.3,AY,0);sleeveR.position.set(.3,AY,0);g.add(sleeveL,sleeveR);
  /* الکترودها: میلهٔ گرافیتی */
  const el=new THREE.Group();g.add(el);
  const rodGeo=new THREE.CylinderGeometry(.045,.045,2.6,12),rodMat=new THREE.MeshStandardMaterial({color:0x2b2d31,roughness:.55,metalness:.3});
  const rl=new THREE.Mesh(rodGeo,rodMat),rr=new THREE.Mesh(rodGeo,rodMat);rl.position.set(-.3,AY-.1,0);rr.position.set(.3,AY-.1,0);
  rl.castShadow=rr.castShadow=true;el.add(rl,rr);
  const cl=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.14),new THREE.MeshStandardMaterial({color:0xcc2b2b,roughness:.5}));
  const cr=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.14),new THREE.MeshStandardMaterial({color:0x22262c,roughness:.5}));
  cl.position.set(-.3,AY+.9,0);cr.position.set(.3,AY+.9,0);el.add(cl,cr);
  /* باتری روی صفحهٔ کوچک کنار پایه؛ LED بالای پایه (دور از بشر و پیدا از همهٔ زاویه‌ها) */
  const bat=new THREE.Mesh(new THREE.BoxGeometry(.8,.46,.5),new THREE.MeshStandardMaterial({map:canvasTex(256,140,(c,w,h)=>{c.fillStyle='#1f2a37';c.fillRect(0,0,w,h);c.fillStyle='#fbbf24';c.fillRect(0,0,w,26);c.fillStyle='#fff';c.font='800 58px Tahoma,sans-serif';c.textAlign='center';c.fillText('9 V',w/2,100);}),roughness:.5}));
  bat.position.set(PX,.35,.6);bat.castShadow=true;g.add(bat);
  const LY=AY+.55;
  const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.26,12),new THREE.MeshStandardMaterial({color:0x22262c,roughness:.5}));lamp.position.set(PX,AY+.2,0);g.add(lamp);
  const ledMat=new THREE.MeshStandardMaterial({color:0x5a1010,emissive:0xff2a1a,emissiveIntensity:0,roughness:.2,transparent:true,opacity:.92});
  const led=new THREE.Mesh(new THREE.SphereGeometry(.17,20,14,0,TAU,0,Math.PI*.62),ledMat);led.scale.y=1.35;led.position.set(PX,AY+.33,0);g.add(led);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:SPRITE,color:0xff4a3a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));halo.scale.set(1.4,1.4,1);halo.position.set(PX,AY+.5,0);g.add(halo);
  const light=new THREE.PointLight(0xff3a2a,0,5,1.8);light.position.copy(halo.position);g.add(light);
  /* سیم‌ها */
  const wires=[];const wmat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.6});
  const wire=(idx,a,b,mid,c)=>{wires[idx]&&(g.remove(wires[idx]),wires[idx].geometry.dispose());
    const w=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,mid,b]),24,.025,6),wmat(c));g.add(w);wires[idx]=w;};
  wire(2,v3(PX,.6,.6),v3(PX+.05,AY+.12,0),v3(PX-.35,AY*.5,.45),0x22262c);   // باتری ← LED (ثابت)
  const t={group:g,electrodes:el,ELV:{up:0,down:-1.9},y:0,glow:0,
    setGlow(k){t.glow=k;ledMat.emissiveIntensity=3.2*k;ledMat.color.setRGB(.35+.65*k,.06+.2*k,.06+.15*k);halo.material.opacity=.95*k;halo.scale.setScalar(.8+1.2*k);light.intensity=2.8*k;},
    setY(y){t.y=y;el.position.y=y;
      wire(0,v3(-.3,AY+.9+y,0),v3(PX-.04,AY+.15,0),v3(-.9,AY+1.25+y*.3,.15),0xcc2b2b);   // الکترود ← LED
      wire(1,v3(.3,AY+.9+y,0),v3(PX+.2,.6,.6),v3(.1,AY+1.5,.55),0x22262c);},             // الکترود ← باتری
    async lower(dur=1.8,to=t.ELV.down){const y0=t.y;await tween(dur,k=>t.setY(lerp(y0,to,k)));},
    async raise(dur=1.4){return t.lower(dur,t.ELV.up);},
    async glowTo(k,dur=.8){const g0=t.glow;await tween(dur,q=>t.setGlow(lerp(g0,k,q)),lin);}
  };
  t.setY(0);t.setGlow(0);
  world.dyn.add(g);return t;
}
