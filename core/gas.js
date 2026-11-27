/* جمع‌آوری گاز روی آب: تشت شفاف (با یخ و بخار)، استوانهٔ وارونه، قیف وارونه، پایه و گیره، حباب‌های گاز */
import {THREE,TAU,V3,C,clamp,lerp,rnd,v3,lin,easeOut,easeIO,world,tween,sleep,moveTo,addUpdater} from './kernel.js';
import {SPRITE} from './textures.js';
import {plastic,glassFres,glassRefl,liquidMat,mesh,lathe,addBlob} from './materials.js';
import {CYL_SHELL,cylGradTex,CYL_R,CYL_H,CYL_T,FUNNEL_SHELL,funnelWallR} from './parts.js';
import {WATER} from './glassware.js';

const CYL_IR=CYL_R-.03,CYL_TOP=CYL_H-.32;

/* ====================== تشت پلاستیکی شفاف ====================== */
export function makeTub(x=0,z=0,{w=7.2,d=4.2,h=3.2}={}){
  const g=new THREE.Group();g.position.set(x,0,z);
  const glass=new THREE.MeshStandardMaterial({color:0xdbe9f3,roughness:.15,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false});
  const wall=(sx,sy,sz,px,py,pz,mt=glass)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mt);m.position.set(px,py,pz);m.renderOrder=10;g.add(m);return m;};
  wall(w,h,.08,0,h/2,d/2);wall(w,h,.08,0,h/2,-d/2);wall(.08,h,d,w/2,h/2,0);wall(.08,h,d,-w/2,h/2,0);
  wall(w,.1,d,0,.05,0,new THREE.MeshStandardMaterial({color:0xcfdde8,roughness:.3,transparent:true,opacity:.55}));
  const rimM=new THREE.MeshStandardMaterial({color:0xf2f6f9,roughness:.4});
  [[w+.1,.07,.1,0,h,d/2],[w+.1,.07,.1,0,h,-d/2],[.1,.07,d,w/2,h,0],[.1,.07,d,-w/2,h,0]].forEach(a=>{const m=wall(...a,rimM);m.renderOrder=0;m.castShadow=true;});
  const waterMat=liquidMat();
  const water=new THREE.Mesh(new THREE.BoxGeometry(w-.14,1,d-.14),waterMat);water.renderOrder=5;water.visible=false;g.add(water);
  const iceG=new THREE.Group();g.add(iceG);
  const steam=(()=>{const N=40,pos=new Float32Array(N*3),pa=new THREE.BufferAttribute(pos,3);pa.setUsage(THREE.DynamicDrawUsage);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',pa);
    const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:.55,map:SPRITE,color:0xffffff,transparent:true,opacity:.14,depthWrite:false,sizeAttenuation:true}));
    pts.frustumCulled=false;pts.renderOrder=7;pts.visible=false;g.add(pts);return {pos,pa,pts,s:new Float32Array(N),N};})();
  for(let i=0;i<steam.N;i++)steam.s[i]=Math.random();
  world.dyn.add(g);addBlob(world.dyn,x,z,w+.8,d+.8,.4);
  const t={group:g,H:h,W:w,D:d,level:0,innerR:1.6,dipAt:v3(x-w*.32,0,z),water,waterMat,ice:[],steamK:0,
    setLevel(L,color=WATER,alpha=.08){t.level=L;water.visible=L>.02;water.scale.y=Math.max(.01,L);water.position.y=.1+L/2;
      waterMat.color.copy(color);waterMat.emissive.copy(color).multiplyScalar(.25);waterMat.opacity=.3+.35*alpha;},
    get surfaceY(){return .1+t.level;},
    setSteam(k){t.steamK=k;steam.pts.visible=k>.02;steam.pts.material.opacity=.16*k;}
  };
  addUpdater(dt=>{
    const tm=performance.now()/1000;
    for(const c of t.ice)if(c.landed){c.mesh.position.y=t.surfaceY-.14+Math.sin(tm*1.3+c.ph)*.025;c.mesh.rotation.y+=dt*.05*Math.sin(c.ph);}
    if(t.steamK>.02){const sp=steam.pos;
      for(let i=0;i<steam.N;i++){steam.s[i]+=dt*.22;if(steam.s[i]>1)steam.s[i]-=1;
        const a=i*2.399,r=Math.sqrt((i%11)/11)*(w*.42);sp[i*3]=Math.cos(a)*r;sp[i*3+1]=t.surfaceY+.1+steam.s[i]*2.2;sp[i*3+2]=Math.sin(a)*r*.55;}
      steam.pa.needsUpdate=true;}
  });
  return t;
}
export async function fillTub(t,L,color=WATER,alpha=.08,dur=2){
  const l0=t.level;await tween(dur,k=>t.setLevel(lerp(l0,L,k),color,alpha),lin);
}
/* افتادن تکه‌های یخ روی آب؛ avoid: ناحیه‌ای که نباید یخ بیفتد [x0,x1] (مختصات محلی تشت) */
export async function addIce(t,n=14,{avoid=[.2,2.4]}={}){
  const mat=new THREE.MeshStandardMaterial({color:0xe7f5ff,roughness:.15,transparent:true,opacity:.7});
  const jobs=[];
  for(let i=0;i<n;i++){
    let px;do{px=rnd(-t.W/2+.5,t.W/2-.5);}while(px>avoid[0]&&px<avoid[1]);
    const m=new THREE.Mesh(new THREE.BoxGeometry(.42,.34,.42),mat);m.rotation.set(rnd(-.2,.2),rnd(0,3),rnd(-.2,.2));
    m.position.set(px,5.8,rnd(-t.D/2+.5,t.D/2-.5));m.renderOrder=6;t.group.add(m);
    const c={mesh:m,ph:rnd(0,6),landed:false};t.ice.push(c);
    jobs.push((async()=>{await sleep(i*.12);const y1=t.surfaceY-.14;await tween(.6,k=>{m.position.y=lerp(5.8,y1,k*k);},lin);c.landed=true;})());
  }
  await Promise.all(jobs);
}

/* ====================== استوانهٔ مدرج وارونه برای جمع‌آوری گاز ======================
   gc.setGas(ml): حجم گاز جمع‌شده. خوانش حجم = نشانهٔ مدرج در سطح آب درون استوانه (از ته بسته شمرده می‌شود). */
export function makeGasCylinder(x=0,z=0,{ml=100}={}){
  const g=new THREE.Group();g.position.set(x,0,z);
  g.add(mesh(CYL_SHELL,glassFres,10),mesh(CYL_SHELL,glassRefl,11));
  const gm=new THREE.Mesh(new THREE.CylinderGeometry(CYL_R+.006,CYL_R+.006,CYL_TOP+.18-CYL_T,24,1,true,.7,.62),
    new THREE.MeshBasicMaterial({map:cylGradTex(ml),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}));
  gm.position.y=(CYL_TOP+.18+CYL_T)/2;gm.renderOrder=12;g.add(gm);
  const wm=liquidMat();
  const fillMesh=new THREE.Mesh(new THREE.CylinderGeometry(CYL_IR-.004,CYL_IR-.004,CYL_H-CYL_T,28),wm);fillMesh.renderOrder=5;fillMesh.visible=false;g.add(fillMesh);
  const waterMesh=new THREE.Mesh(new THREE.BufferGeometry(),wm);waterMesh.renderOrder=5;waterMesh.visible=false;g.add(waterMesh);
  const ring=new THREE.Mesh(new THREE.CylinderGeometry(CYL_IR+.012,CYL_IR+.012,.03,28,1,true),new THREE.MeshBasicMaterial({color:0xe11d48,transparent:true,opacity:.9,side:THREE.DoubleSide,depthTest:false}));
  ring.renderOrder=30;ring.visible=false;g.add(ring);
  world.dyn.add(g);
  const gcy={group:g,ml,gas:0,inverted:false,gx:x,gz:z,mouthY:0,
    yw:CYL_T,
    ywFor(m){return CYL_T+(CYL_TOP-CYL_T)*m/ml;},
    setWater(color=WATER,alpha=.08){wm.color.copy(color);wm.emissive.copy(color).multiplyScalar(.25);wm.opacity=.3+.35*alpha;},
    fill(k){fillMesh.visible=k>.01;waterMesh.visible=false;fillMesh.scale.y=Math.max(.01,k);fillMesh.position.y=CYL_T+(CYL_H-CYL_T)*k/2;
      if(k>=.999){fillMesh.visible=false;gcy.setGas(0);}},
    setGas(m){gcy.gas=m;const yw=gcy.ywFor(m);gcy.yw=yw;
      waterMesh.geometry.dispose();waterMesh.geometry=lathe([[0,yw],[CYL_IR-.004,yw],[CYL_IR-.004,CYL_H],[0,CYL_H]],28);waterMesh.visible=true;fillMesh.visible=false;
      ring.position.y=yw;},
    showReading(on){ring.visible=on;},
    /* ارتفاع جهانی سطح آب درون استوانه (وقتی وارونه است) */
    get surfaceY(){return g.position.y-gcy.yw;}
  };
  return gcy;
}
/* پر کردن استوانه با آب (ایستاده روی میز) */
export async function fillGasCylinder(gc,dur=1.5){await tween(dur,k=>gc.fill(k),lin);gc.fill(1);}
/* با کف دست روی دهانه، استوانه وارونه شده و با دهانه به‌سمت پایین درون تشت قرار می‌گیرد.
   mouthY: ارتفاع دهانه از کف میز؛ toX,toZ: مکان درون تشت */
export async function invertIntoTub(gc,toX,toZ,mouthY,{lift=4.9}={}){
  const g=gc.group,half=(CYL_H+.02)/2,cx0=g.position.x,cz0=g.position.z;
  const cyFinal=mouthY+half;
  const place=(cx,cy,cz,th)=>{g.rotation.z=th;g.position.set(cx+half*Math.sin(th),cy-half*Math.cos(th),cz);};
  await tween(.8,k=>place(cx0,lerp(half,lift,easeIO(k)),cz0,0),lin);
  await tween(1.4,k=>{const e=easeIO(k);place(lerp(cx0,toX,e),lift,lerp(cz0,toZ,e),Math.PI*e);},lin);
  await tween(1.0,k=>place(toX,lerp(lift,cyFinal,easeIO(k)),toZ,Math.PI),lin);
  place(toX,cyFinal,toZ,Math.PI);
  gc.inverted=true;gc.gx=toX;gc.gz=toZ;gc.mouthY=mouthY;
}
export async function liftOutGasCylinder(gc,backX,backZ,lift=4.9){
  const g=gc.group,half=(CYL_H+.02)/2,cx0=gc.gx,cz0=gc.gz;
  const place=(cx,cy,cz,th)=>{g.rotation.z=th;g.position.set(cx+half*Math.sin(th),cy-half*Math.cos(th),cz);};
  const cyNow=gc.mouthY+half;
  await tween(.9,k=>place(cx0,lerp(cyNow,lift,easeIO(k)),cz0,Math.PI),lin);
  await tween(1.2,k=>{const e=easeIO(k);place(lerp(cx0,backX,e),lift,lerp(cz0,backZ,e),Math.PI*(1-e));},lin);
  await tween(.8,k=>place(backX,lerp(lift,half,easeIO(k)),backZ,0),lin);
  gc.inverted=false;
}

/* ====================== قیف وارونه (کوچک‌شده) برای زیر استوانه ======================
   نوک ساقه به‌سمت بالاست و ته گشاد روی کف تشت. tabletLocal: مکان قرص روی دیوارهٔ داخلی. */
export const FUN_SCALE=.4;
export function makeCollectFunnel(x=0,z=0,{y=.1}={}){
  const g=new THREE.Group();g.scale.setScalar(FUN_SCALE);
  g.position.set(x,y+FUN_SCALE*2.3,z);g.rotation.x=Math.PI;
  g.add(mesh(FUNNEL_SHELL,glassFres,10),mesh(FUNNEL_SHELL,glassRefl,11));
  world.dyn.add(g);
  const ly=1.55,lr=funnelWallR(ly)-.1;
  const tabMat=new THREE.MeshStandardMaterial({color:0xf0bf72,roughness:.8,side:THREE.DoubleSide});
  const tab=new THREE.Group();tab.position.set(lr,ly,0);tab.rotation.z=-2.13;
  const half=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.1,24,1,false,0,Math.PI),tabMat);tab.add(half);
  const cut=new THREE.Mesh(new THREE.PlaneGeometry(.5,.1),tabMat);cut.rotation.y=Math.PI/2;tab.add(cut);
  const clay=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),new THREE.MeshStandardMaterial({color:0x9aa58a,roughness:.9}));clay.scale.set(1.2,.7,1.2);clay.position.set(.07,-.02,.2);tab.add(clay);
  tab.scale.setScalar(1.5);tab.visible=false;g.add(tab);
  const f={group:g,tab,
    get x(){return g.position.x;},get z(){return g.position.z;},get tipY(){return g.position.y;},
    get tabletWorld(){return v3(g.position.x+FUN_SCALE*lr,g.position.y-FUN_SCALE*ly,g.position.z);}};
  return f;
}

/* ====================== پایهٔ فلزی با حلقهٔ نگه‌دارندهٔ استوانه ====================== */
export function makeClampStand(x=0,z=0,{ringAt=v3(0,3.9,0),height=5.4,ringR=CYL_R+.12}={}){
  const g=new THREE.Group();g.position.set(x,0,z);
  const m=new THREE.MeshStandardMaterial({color:0x8a8f96,roughness:.26,metalness:.9,envMapIntensity:1.5});
  const base=new THREE.Mesh(new THREE.BoxGeometry(1.5,.12,1.1),plastic(0x2c3440,.55));base.position.y=.06;base.castShadow=true;g.add(base);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,height,12),m);pole.position.y=height/2;pole.castShadow=true;g.add(pole);
  const len=Math.hypot(ringAt.x,ringAt.z)-.1,ang=Math.atan2(ringAt.x,ringAt.z);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,len),m);arm.position.set(Math.sin(ang)*len/2,ringAt.y,Math.cos(ang)*len/2);arm.rotation.y=ang;g.add(arm);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(ringR,.04,10,32),m);ring.rotation.x=Math.PI/2;ring.position.copy(ringAt);g.add(ring);
  const clampB=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),m);clampB.position.set(0,ringAt.y,0);g.add(clampB);
  world.dyn.add(g);
  return {group:g,ring,arm,show(v){ring.visible=arm.visible=v;}};
}

/* ====================== حباب‌های گاز: از قرص، از ساقهٔ قیف، تا سطح آب درون استوانه ====================== */
export function makeGasBubbles(funnel,gc,{n=70}={}){
  const pos=new Float32Array(n*3),pa=new THREE.BufferAttribute(pos,3);pa.setUsage(THREE.DynamicDrawUsage);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',pa);
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:.075,map:SPRITE,color:0xffffff,transparent:true,opacity:.9,depthWrite:false,sizeAttenuation:true}));
  pts.frustumCulled=false;pts.renderOrder=9;pts.visible=false;world.dyn.add(pts);
  const ph=new Float32Array(n);for(let i=0;i<n;i++)ph[i]=Math.random();
  const b={on:false,rate:1,set(on,rate=1){b.on=on;b.rate=rate;pts.visible=on;}};
  addUpdater(dt=>{
    if(!b.on)return;
    const from=funnel.tabletWorld,tipY=funnel.tipY,sy=gc.surfaceY,x=funnel.x,z=funnel.z;
    const cnt=Math.max(1,Math.floor(n*Math.min(1,b.rate)));geo.setDrawRange(0,cnt);
    for(let i=0;i<cnt;i++){
      ph[i]+=dt*(.45+.4*((i%5)/5))*(.6+b.rate*.6);if(ph[i]>1)ph[i]-=1;
      const t=ph[i],jx=Math.sin(i*7.3+t*9)*.03,jz=Math.cos(i*5.1+t*8)*.03;
      let px,py,pz;
      if(t<.45){const k=t/.45;px=lerp(from.x,x,k)+jx;py=lerp(from.y,tipY,k);pz=lerp(from.z,z,k)+jz;}
      else{const k=(t-.45)/.55;px=x+jx;py=lerp(tipY,Math.max(tipY,sy),k);pz=z+jz;}
      pos[i*3]=px;pos[i*3+1]=py;pos[i*3+2]=pz;
    }
    pa.needsUpdate=true;
  });
  return b;
}
