/* «رسانایی الکتریکی گرافن» — شیمی ۳ (دوازدهم)، فصل ۳، کاوش کنید ۱
   مدار: باتری ۹ ولت ← مقاومت ۳۳۰ Ω ← LED ← نوک سیم A ← مستطیل مدادی ← نوک سیم B ← باتری.
   مدل: مقاومت مستطیل ∝ فاصلهٔ دو نوک (R = R□·d/w)؛ شدت LED از جریان I=(۹−۱٫۹)/(۳۳۰+R) به‌دست می‌آید.
   مرجع API: docs/LAB-API.md */
import {
  THREE,v3,C,lerp,lin,sleep,tween,moveTo,fa,
  S,CAMS,world,addUpdater,SPRITE,canvasTex,
  camTo,hud,ansStep
} from '../../core/api.js';

CAMS.main={p:[2.4,13.5,10.5],t:[2.4,0,-.2]};
CAMS.close={p:[3,6.6,6.4],t:[3,0,1.6]};
CAMS.both={p:[2.8,10.2,6.6],t:[2.8,0,-.5]};
CAMS.circuit={p:[2.6,7.2,3.6],t:[2.6,0,-2.4]};

/* ---- ابعاد صحنه (۱ واحد ≈ ۸۸ mm برای کاغذ و مستطیل) ---- */
const PX=3,PZ=2,PW=9,PH=6;                    // کاغذ: مرکز و اندازه
const RX0=1,RX1=5,RZ0=1.1,RZ1=2.9;            // مستطیل مدادی (۴×۱٫۸ واحد ≈ ۳٫۵×۱٫۶ cm)
const CM=3.5/4;                               // سانتی‌متر در هر واحد
const WIDTH_CM=(RZ1-RZ0)*CM;
const RSQ=2000;                               // مقاومت سطحی لایهٔ مداد (Ω بر مربع)، مقدار نمونه
const VF=1.9,VB=9,RFIX=330;
const BAT_POS=v3(6.4,0,-3.4);
const LED_P=v3(.4,.16,-2.9),RES_P=v3(3.4,.31,-2.9),REST_PEN=v3(3.2,.11,4.6),PROBE_A=v3(1.4,.04,.3),PROBE_B=v3(4.6,.04,.3);
const mk=(c,r=.5,m=0,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,...o});
const metal=mk(0xc7ccd2,.28,.95,{envMapIntensity:1.4});
const add=o=>{world.dyn.add(o);return o;};

/* ---------- سیم انعطاف‌پذیر ---------- */
function makeWire(color,r=.055){
  const m=new THREE.Mesh(new THREE.BufferGeometry(),mk(color,.45,0,{bumpScale:.3}));m.castShadow=true;
  m.pts=null;
  m.set=pts=>{
    const key=pts.map(p=>p.x.toFixed(2)+p.y.toFixed(2)+p.z.toFixed(2)).join();
    if(m.key===key)return;m.key=key;m.pts=pts;
    m.geometry.dispose();m.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),44,r,8);
  };
  m.reveal=k=>{const g=m.geometry;if(g.index&&g.setDrawRange)g.setDrawRange(0,Math.floor(g.index.count*k));};
  return add(m);
}
const arc=(a,b,lift=.8)=>{const m=a.clone().add(b).multiplyScalar(.5);m.y=Math.max(a.y,b.y)+lift;
  return [a.clone(),a.clone().add(v3(0,.35,0)),m,b.clone().add(v3(0,.35,0)),b.clone()];};

/* ---------- قطعه‌ها ---------- */
function makeBattery(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.0,.64,1.85),mk(0x17181b,.45,.25));body.position.y=.32;
  const band=new THREE.Mesh(new THREE.BoxGeometry(1.02,.2,1.87),mk(0xb8732d,.35,.8));band.position.y=.5;
  const top=new THREE.Mesh(new THREE.BoxGeometry(.98,.04,.45),metal);top.position.set(0,.65,.7);
  const lab=new THREE.Mesh(new THREE.PlaneGeometry(.85,1.2),new THREE.MeshStandardMaterial({roughness:.5,map:canvasTex(128,192,(c,w,h)=>{
    c.fillStyle='#1b1d21';c.fillRect(0,0,w,h);c.fillStyle='#e9a23b';c.font='700 66px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('9V',w/2,h/2-10);
    c.fillStyle='#ddd';c.font='600 22px sans-serif';c.fillText('Alkaline',w/2,h/2+48);})}));
  lab.rotation.x=-Math.PI/2;lab.position.set(0,.652,-.2);
  const hex=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.12,6),metal);hex.position.set(-.22,.72,.7);          // پایانهٔ مثبت (شش‌گوشه)
  const rnd=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.12,16),metal);rnd.position.set(.22,.72,.7);          // پایانهٔ منفی (گرد)
  g.add(body,band,top,lab,hex,rnd);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  g.position.copy(BAT_POS);
  g.plus=v3(BAT_POS.x-.22,.8,BAT_POS.z+.7);g.minus=v3(BAT_POS.x+.22,.8,BAT_POS.z+.7);
  return add(g);
}
function makeBoard(){
  const g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.BoxGeometry(6.4,.16,2.4),mk(0xe9ece6,.6));base.position.y=.08;
  for(let i=0;i<24;i++)for(const dz of [-.5,.5]){               // سوراخ‌های سوکت
    const h=new THREE.Mesh(new THREE.CircleGeometry(.045,8),new THREE.MeshBasicMaterial({color:0x2a2c2f}));h.rotation.x=-Math.PI/2;h.position.set(-3+i*.26,.165,dz);g.add(h);}
  g.add(base);g.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});
  g.position.set(1.9,0,-2.9);return add(g);
}
function makeLED(){
  const g=new THREE.Group();
  const glass=mk(0xff3a2c,.12,0,{transparent:true,opacity:.78,emissive:0xff1408,emissiveIntensity:0,envMapIntensity:1.2});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.3,22,14,0,Math.PI*2,0,Math.PI/2),glass);dome.position.y=.62;
  const cyl=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.45,22,1,true),glass);cyl.position.y=.395;
  const flange=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.07,22),glass);flange.position.y=.2;
  const die=new THREE.Mesh(new THREE.BoxGeometry(.12,.2,.1),mk(0x9a1a12,.6,0,{emissive:0xff2a14,emissiveIntensity:0}));die.position.y=.42;
  const lg=[[-.1,.38],[.1,.38]];
  for(const [x] of lg){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.5,6),metal);leg.position.set(x,.0,0);g.add(leg);}
  const halo=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6),new THREE.MeshBasicMaterial({map:SPRITE,color:0xff3a22,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));halo.position.y=.55;halo.renderOrder=8;
  const pool=new THREE.Mesh(new THREE.CircleGeometry(1.5,24),new THREE.MeshBasicMaterial({map:SPRITE,color:0xff3322,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));pool.rotation.x=-Math.PI/2;pool.position.y=.0;pool.renderOrder=2;
  g.add(dome,cyl,flange,die,halo,pool);
  g.setGlow=v=>{glass.emissiveIntensity=v*2.4;die.material.emissiveIntensity=v*3;halo.material.opacity=v*.85;halo.scale.setScalar(.7+v*.8);pool.material.opacity=v*.6;};
  g.halo=halo;g.anode=v3(.1,.0,0);g.cathode=v3(-.1,.0,0);
  return g;
}
function makeResistor(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.7,16),mk(0xd8b878,.7));body.rotation.z=Math.PI/2;
  const end=(x)=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.15,12,8),mk(0xd8b878,.7));e.scale.x=.6;e.position.x=x;return e;};
  g.add(body,end(-.35),end(.35));
  [[-.2,0xff7a00],[-.08,0xff7a00],[.04,0x7a3b0a],[.24,0xd4af37]].forEach(([x,c])=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.158,.158,.055,16),mk(c,.5));b.rotation.z=Math.PI/2;b.position.x=x;g.add(b);});
  for(const s of [-1,1]){const lead=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.55,6),metal);lead.rotation.z=Math.PI/2;lead.position.x=s*.62;g.add(lead);}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  g.leftEnd=v3(-.9,0,0);g.rightEnd=v3(.9,0,0);
  return g;
}
function makePencil(){
  const g=new THREE.Group();
  const wood=new THREE.Mesh(new THREE.ConeGeometry(.095,.42,6),mk(0xe3c08a,.8));wood.position.y=.21;wood.rotation.x=Math.PI;
  const lead=new THREE.Mesh(new THREE.ConeGeometry(.032,.14,8),mk(0x2a2b2f,.4,.3));lead.position.y=.07;lead.rotation.x=Math.PI;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,2.6,6),mk(0xf2c230,.45));body.position.y=1.72;
  const fer=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.2,12),metal);fer.position.y=3.12;
  const er=new THREE.Mesh(new THREE.CylinderGeometry(.092,.092,.2,12),mk(0xd86a7a,.8));er.position.y=3.32;
  g.add(wood,lead,body,fer,er);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return add(g);
}
function makeProbe(sleeve){
  const g=new THREE.Group();
  const tip=new THREE.Mesh(new THREE.CylinderGeometry(.018,.045,.45,10),metal);tip.position.y=.225;
  const cone=new THREE.Mesh(new THREE.CylinderGeometry(.11,.07,.12,12),mk(sleeve,.5));cone.position.y=.5;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.8,12),mk(sleeve,.55));body.position.y=.96;
  g.add(tip,cone,body);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  g.top=()=>g.position.clone().add(v3(0,1.4,0));
  return add(g);
}

/* ---------- کاغذ با بافت مدادی که تدریجی سیاه می‌شود ---------- */
function makePaper(){
  const W=576,H=384,tex=canvasTex(W,H,()=>{});
  const cv=tex.image,g=cv.getContext('2d');
  const sx=x=>(x-(PX-PW/2))/PW*W,sz=z=>(z-(PZ-PH/2))/PH*H;
  const grain=[];for(let i=0;i<2200;i++)grain.push([Math.random()*W,Math.random()*H,Math.random()*.05]);
  const rows=[];for(let r=0;r<64;r++)rows.push({o:Math.random()*5-2.5,a:.5+Math.random()*.4});
  const paint=p=>{
    g.fillStyle='#f6f4ee';g.fillRect(0,0,W,H);
    for(const q of grain){g.fillStyle=`rgba(120,110,90,${q[2]})`;g.fillRect(q[0],q[1],1.4,1.4);}
    g.strokeStyle='rgba(120,160,210,.35)';g.lineWidth=1;                       // خط‌کشی کم‌رنگ کاغذ
    for(let y=28;y<H;y+=28){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
    if(p<=0)return;
    const x0=sx(RX0),x1=sx(RX1),z0=sz(RZ0),z1=sz(RZ1),n=Math.floor(rows.length*Math.min(p,1)),dh=(z1-z0)/rows.length;
    for(let r=0;r<n;r++){
      const y=z0+r*dh;
      for(let pass=0;pass<3;pass++){
        g.strokeStyle=`rgba(${38+pass*6},${38+pass*6},${44+pass*6},${.35+rows[r].a*.4})`;g.lineWidth=dh*1.9;
        g.beginPath();g.moveTo(x0+rows[r].o+pass,y+dh*.5+pass*.7);g.lineTo(x1-rows[r].o-pass,y+dh*.5-pass*.5);g.stroke();
      }
    }
    if(p>=1){g.fillStyle='rgba(20,20,24,.35)';g.fillRect(x0+2,z0,x1-x0-4,z1-z0);}     // سیاه کامل
  };
  paint(0);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(PW,PH),new THREE.MeshStandardMaterial({map:tex,roughness:.85}));
  mesh.rotation.x=-Math.PI/2;mesh.position.set(PX,.012,PZ);mesh.receiveShadow=true;
  mesh.draw=p=>{paint(p);tex.needsUpdate=true;};
  return add(mesh);
}

/* ---------- چینش و وضعیت ---------- */
function setup(){
  S.board=makeBoard();S.bat=makeBattery();
  S.paper=makePaper();
  S.led=add(makeLED());S.led.position.copy(LED_P);S.led.rotation.y=0;
  S.res=add(makeResistor());S.res.position.copy(RES_P);
  S.pen=makePencil();S.pen.position.copy(REST_PEN);S.pen.rotation.set(0,0,-Math.PI/2);
  S.pA=makeProbe(0xc0392b);S.pB=makeProbe(0x23262b);
  S.pA.position.copy(PROBE_A);S.pB.position.copy(PROBE_B);
  S.w1=makeWire(0xc0392b);S.w2=makeWire(0xe0b020);S.w3=makeWire(0xc0392b);S.w4=makeWire(0x23262b);
  const ledA=()=>S.led.position.clone().add(S.led.anode),ledC=()=>S.led.position.clone().add(S.led.cathode),
        resL=()=>S.res.position.clone().add(S.res.leftEnd),resR=()=>S.res.position.clone().add(S.res.rightEnd);
  S.w1.set(arc(S.bat.plus,resR(),.9));                   // + باتری ← مقاومت
  S.w2.set(arc(resL(),ledA(),.5));                        // مقاومت ← آند LED
  S.w3.set(arc(ledC(),S.pA.top(),1.5));                  // کاتد LED ← نوک A
  S.w4.set(arc(S.pB.top(),S.bat.minus,1.8));              // نوک B ← − باتری
  for(const w of [S.w1,S.w2,S.w3,S.w4])w.reveal(0);
  for(const o of [S.led,S.res,S.bat,S.board])o.visible=false;
  S.graph=0;S.glow=0;S.on=false;
    addUpdater(dt=>{                                         // سیم‌های متصل به نوک‌ها هم‌راه با حرکت آن‌ها
    S.w3.set(arc(ledC(),S.pA.top(),1.5));S.w4.set(arc(S.pB.top(),S.bat.minus,1.8));
    /* مدار: فقط وقتی هر دو نوک روی مستطیل کاملاً سیاه‌شده بنشینند بسته است */
    const onRect=p=>p.position.y<.12&&p.position.x>=RX0&&p.position.x<=RX1&&p.position.z>=RZ0&&p.position.z<=RZ1;
    const d=Math.abs(S.pA.position.x-S.pB.position.x)*CM;
    S.on=S.graph>=.99&&onRect(S.pA)&&onRect(S.pB);
    let target=0;
    if(S.on){const R=RFIX+RSQ*d/WIDTH_CM,I=(VB-VF)/R*1000;target=Math.pow(Math.min(1,I/6),.7);S.I=I;S.d=d;}
    S.glow+=(target-S.glow)*Math.min(1,dt*9);
    S.led.setGlow(S.glow);
    if(S.led.halo.quaternion.copy)S.led.halo.quaternion.copy(world.camera.quaternion);
  });
}
const reveal=(m,dur)=>tween(dur,k=>m.reveal(k),lin);
const hudD=()=>hud(`فاصلهٔ دو نوک: ${fa(((Math.abs(S.pA.position.x-S.pB.position.x))*CM).toFixed(1).replace('.','٫'))} cm`);

function steps(){
  return [
    {tag:'۱',text:'مداری مطابق شکل روبه‌رو بسازید (باتری ۹ ولتی، لامپ LED، مقاومت ۳۳۰ اهمی و سیم‌های رابط).',run:async()=>{
      await camTo('circuit');
      for(const o of [S.board,S.bat]){o.visible=true;}
      S.res.visible=S.led.visible=true;
      const dropIn=async(o,y)=>{const p=o.position.clone();o.position.y=p.y+2.2;await moveTo(o,p,.9,null,0);};
      await dropIn(S.led);await dropIn(S.res);
      await reveal(S.w1,.9);await reveal(S.w2,.6);
      await camTo('main');
      await Promise.all([reveal(S.w3,.9),reveal(S.w4,.9)]);
      hud('سر دو سیم هنوز آزادند و مدار بسته نیست');await sleep(.8);
    }},
    {tag:'۲',text:'با یک مداد نرم، چهارگوشی ضخیم و تیره روی کاغذ بکشید (حدود ۳ تا ۴ سانتی‌متر طول و ۱٫۵ سانتی‌متر عرض) و آن را کاملاً سیاه کنید.',run:async()=>{
      await camTo('close');
      const pen=S.pen,tip=(x,z)=>v3(x,.07,z);
      await moveTo(pen,tip(RX0,RZ0),1.2,{x:1.18,y:0,z:0},.8);
      const rows=8,dz=(RZ1-RZ0)/rows;
      for(let r=0;r<rows;r++){
        const z=RZ0+r*dz+dz/2,fromL=r%2===0,xa=fromL?RX0+.1:RX1-.1,xb=fromL?RX1-.1:RX0+.1;
        await moveTo(pen,tip(xa,z),.25,null,.12);
        await tween(.85,k=>{pen.position.set(lerp(xa,xb,k),.07+.015*Math.sin(k*9),z+.04*Math.sin(k*13));S.paper.draw((r+k)/rows);},lin);
      }
      S.graph=1;S.paper.draw(1);
      await moveTo(pen,REST_PEN,1.1,{x:0,y:0,z:-Math.PI/2},.8);
      await sleep(.4);
    }},
    {tag:'۳',text:'نوک فلزی دو سیم رابط را با مستطیل گرافیتی تماس دهید و به لامپ نگاه کنید. چه رخ می‌دهد؟',run:async()=>{
      await camTo('both');
      await Promise.all([moveTo(S.pA,v3(1.4,1.2,2),1.2,null,.5),moveTo(S.pB,v3(4.6,1.2,2),1.2,null,.5)]);
      await Promise.all([moveTo(S.pA,v3(1.4,.04,2),.7),moveTo(S.pB,v3(4.6,.04,2),.7)]);
      hudD();await sleep(.6);
      await sleep(1.6);
    }},
    ansStep('۳ (پرسش)','با تماس دو نوک سیم با مستطیل گرافیتی چه رخ می‌دهد؟','both','مشاهده',
      'لامپ LED روشن می‌شود (کم‌نور). یعنی مدار بسته شد و جریان برق از لایهٔ نازک مداد (گرافیت) عبور کرد؛ پس گرافیت رساناست. این لایه فقط چند نانومتر ضخامت دارد، چون در هر خط مداد لایه‌هایی از گرافیت روی کاغذ جا می‌ماند.'),
    {tag:'۴',text:'دو نقطهٔ اتصال را به هم نزدیک یا از هم دور کنید. چه تغییری در شدت روشنایی لامپ پدید می‌آید؟',run:async()=>{
      await camTo('both');
      const go=async(a,b)=>{await Promise.all([moveTo(S.pA,v3(a,.2,2),.5),moveTo(S.pB,v3(b,.2,2),.5)]);
        await Promise.all([moveTo(S.pA,v3(a,.04,2),.4),moveTo(S.pB,v3(b,.04,2),.4)]);};
      const slide=(a0,b0,a1,b1,dur)=>tween(dur,k=>{S.pA.position.x=lerp(a0,a1,k);S.pB.position.x=lerp(b0,b1,k);hudD();},lin);
      await slide(1.4,4.6,2.5,3.5,2.4);                      // نزدیک‌کردن
      hudD();await sleep(1.8);
      await slide(2.5,3.5,1.1,4.9,3.2);                      // دورکردن
      hudD();await sleep(1.8);
    }},
    ansStep('۴ (پرسش)','با نزدیک یا دور کردن دو نقطهٔ اتصال شدت روشنایی لامپ چه تغییری می‌کند؟','both','مشاهده',
      'هرچه دو نقطهٔ اتصال به هم نزدیک‌تر شوند، لامپ <b>روشن‌تر</b> و هرچه دورتر شوند، <b>کم‌نورتر</b> می‌شود. با افزایش فاصله، مسیر عبور الکترون‌ها در لایهٔ گرافیتی بلندتر و مقاومت الکتریکی بیشتر می‌شود؛ پس جریان و شدت نور کم می‌شود.'),
    ansStep('جمع‌بندی','چرا گرافیت (و گرافن) جریان برق را عبور می‌دهد؟','both','نتیجه',
      'در هر لایهٔ گرافیت (گرافن) هر اتم کربن با سه اتم کربن دیگر پیوند کووالانسی دارد و چهارمین الکترون ظرفیتش آزاد است و در سراسر لایه حرکت می‌کند. همین الکترون‌های آزاد جریان برق را عبور می‌دهند. <small>(مقاومت لایهٔ مداد و فاصله‌ها در این شبیه‌سازی نمونه‌اند.)</small>')
  ];
}

export default {
  cameras:[['main','نمای کلی'],['both','مدار و کاغذ'],['close','کاغذ'],['circuit','مدار']],
  tabs:[{id:'main',title:'کاوش',camera:'main',rack:false,dropper:false,wash:false,spoon:false,setup,steps}]
};
