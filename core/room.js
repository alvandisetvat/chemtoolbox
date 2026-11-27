/* اتاق آزمایشگاه: کف کاشی، دیوارهای چهارگانه، سقف با چراغ فلورسنت، پنجرهٔ کرکره‌دار، در، وایت‌برد،
   پوستر ایمنی و جدول تناوبی، ساعت، قفسه، کپسول آتش‌نشانی و کابینت زیر میز.
   همه ثابت‌اند (matrixAutoUpdate=false). مقیاس: هر واحد حدود ۶ cm؛ کف y=-13، سقف y=28. */
import {THREE,C,TAU,FONT} from './kernel.js';
import {canvasTex,drawTiles,WOOD_T} from './textures.js';

const M=(c,r=.85,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:r,...o});
const FLOOR_Y=-13,CEIL_Y=28,BACK_Z=-6.5,FRONT_Z=34,SIDE_X=30;

function text(g,t,x,y,size,color='#1c2530',weight=700,dir='rtl'){
  g.fillStyle=color;g.font=`${weight} ${size}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.direction=dir;g.fillText(t,x,y);
}
const stuccoTex=()=>canvasTex(256,256,(g,w,h)=>{       // بافت ریز گچ‌کاری (فقط برجستگی)
  g.fillStyle='#808080';g.fillRect(0,0,w,h);
  for(let i=0;i<5000;i++){const v=110+Math.random()*60|0;g.fillStyle=`rgb(${v},${v},${v})`;const r=1+Math.random()*2.5;g.fillRect(Math.random()*w,Math.random()*h,r,r);}
},{repeat:[10,8],srgb:false});
const ceilTex=()=>canvasTex(512,512,(g,w,h)=>{       // کاشی سقف کاذب: دو در دو، با سوراخ‌های ریز
  g.fillStyle='#8f9291';g.fillRect(0,0,w,h);
  for(let r=0;r<2;r++)for(let c=0;c<2;c++){
    const x=c*256+3,y=r*256+3;g.fillStyle='#eceeeb';g.fillRect(x,y,250,250);
    for(let i=0;i<260;i++){g.fillStyle=`rgba(70,75,72,${.25+Math.random()*.3})`;g.fillRect(x+6+Math.random()*238,y+6+Math.random()*238,2,2);}
    g.fillStyle='rgba(255,255,255,.5)';g.fillRect(x,y,250,2);g.fillRect(x,y,2,250);
  }
},{repeat:[3,2.03]});
const wallTex=()=>canvasTex(8,256,(g,w,h)=>{       // گرادیان عمودی: تیره‌تر نزدیک کف و سقف (اکلوژن محیطی ملایم)
  const gr=g.createLinearGradient(0,h,0,0);
  gr.addColorStop(0,'#bcc3c1');gr.addColorStop(.18,'#dfe4e2');gr.addColorStop(.6,'#e8ece9');gr.addColorStop(.92,'#dde1de');gr.addColorStop(1,'#c4c9c6');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
},{srgb:true});
const floorTex=()=>canvasTex(512,512,(g,w,h)=>drawTiles(g,w,h,2,{base:[205,208,203],grout:'#8f9390',gw:5,tint:6}),{repeat:[12,8]});
const cabinetTex=(base='#34505d',door='#456a79')=>canvasTex(512,128,(g,w,h)=>{
  g.fillStyle=base;g.fillRect(0,0,w,h);
  const n=6,dw=w/n;
  for(let i=0;i<n;i++){
    g.fillStyle=door;g.fillRect(i*dw+4,6,dw-8,h-12);
    const sh=g.createLinearGradient(0,6,0,h-6);sh.addColorStop(0,'rgba(255,255,255,.16)');sh.addColorStop(1,'rgba(0,0,0,.14)');g.fillStyle=sh;g.fillRect(i*dw+4,6,dw-8,h-12);
    for(let k=0;k<220;k++){g.fillStyle=`rgba(${Math.random()<.5?255:0},${Math.random()<.5?255:0},${Math.random()<.5?255:0},.035)`;g.fillRect(i*dw+6+Math.random()*(dw-12),8+Math.random()*(h-16),2,2);}
    g.fillStyle='#b8c2c8';g.fillRect(i*dw+(i%2?10:dw-18),h*.35,8,h*.28);
  }
});
const LAMPS=[-16,0,16].flatMap(x=>[2,16,28].map(z=>[x,z]));
/* لکهٔ نور نرم زیر چراغ‌ها روی کف (پخته‌شده در بافت؛ هزینهٔ اجرایی ندارد) */
const floorLightTex=()=>canvasTex(512,342,(g,w,h)=>{
  g.clearRect(0,0,w,h);
  for(const [x,z] of LAMPS){
    const cx=(x+30)/60*w,cy=(z+6.5)/40.5*h,gr=g.createRadialGradient(cx,cy,0,cx,cy,w*.2);
    gr.addColorStop(0,'rgba(255,246,220,.34)');gr.addColorStop(.5,'rgba(255,246,220,.12)');gr.addColorStop(1,'rgba(255,246,220,0)');
    g.fillStyle=gr;g.fillRect(cx-w*.2,cy-w*.2,w*.4,w*.4);
  }
},{srgb:false});
/* بازتاب کم‌رنگ چراغ‌ها روی میز (رزین اپوکسی) + سایه‌روشن لبه‌ها */
const benchLightTex=()=>canvasTex(512,390,(g,w,h)=>{
  g.clearRect(0,0,w,h);
  for(const [x,z] of LAMPS){
    if(x<-17||x>17||z<-11||z>15)continue;
    const cx=(x+17)/34*w,cy=(z+11)/26*h;
    g.save();g.translate(cx,cy);g.scale(2.6,1);
    const gr=g.createRadialGradient(0,0,0,0,0,w*.07);gr.addColorStop(0,'rgba(255,255,255,.10)');gr.addColorStop(.6,'rgba(255,255,255,.035)');gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr;g.fillRect(-w*.07,-w*.07,w*.14,w*.14);g.restore();
  }
  const ed=g.createLinearGradient(0,h,0,h*.9);ed.addColorStop(0,'rgba(0,0,0,.18)');ed.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=ed;g.fillRect(0,h*.9,w,h*.1);
},{srgb:false});
const clockTex=()=>canvasTex(256,256,(g,w,h)=>{
  g.fillStyle='#f7f6f0';g.beginPath();g.arc(128,128,124,0,TAU);g.fill();
  g.strokeStyle='#2a2f36';g.lineWidth=8;g.stroke();
  for(let i=0;i<12;i++){const a=i/12*TAU;g.lineWidth=i%3?4:8;g.beginPath();g.moveTo(128+Math.sin(a)*98,128-Math.cos(a)*98);g.lineTo(128+Math.sin(a)*112,128-Math.cos(a)*112);g.stroke();}
  g.lineCap='round';g.lineWidth=10;g.beginPath();g.moveTo(128,128);g.lineTo(128+Math.sin(5.2)*58,128-Math.cos(5.2)*58);g.stroke();   // ساعت ≈ ۱۰
  g.lineWidth=6;g.beginPath();g.moveTo(128,128);g.lineTo(128+Math.sin(2)*88,128-Math.cos(2)*88);g.stroke();                           // دقیقه ≈ ۱۰
  g.fillStyle='#c0392b';g.beginPath();g.arc(128,128,7,0,TAU);g.fill();
});
const safetyTex=()=>canvasTex(320,440,(g,w,h)=>{
  g.fillStyle='#f4f1e6';g.fillRect(0,0,w,h);g.fillStyle='#1f8a5b';g.fillRect(0,0,w,92);
  text(g,'ایمنی در آزمایشگاه',w/2,48,36,'#fff');
  const rows=[['عینک ایمنی بزنید','#2b6cb0'],['روپوش بپوشید','#b7791f'],['در آزمایشگاه نخورید و ننوشید','#c0392b'],['بوییدن مستقیم ممنوع','#6b46c1'],['پس از کار دست‌ها را بشویید','#2f855a']];
  rows.forEach((r,i)=>{const y=138+i*58;g.fillStyle=r[1];g.beginPath();g.arc(48,y,17,0,TAU);g.fill();text(g,r[0],w/2+22,y,23,'#222',600);});
});
const PT=[[1,0,1],[2,0,1],[2,1,1],[2,10,1]];
const ptTex=()=>canvasTex(720,300,(g,w,h)=>{
  g.fillStyle='#f4f1e6';g.fillRect(0,0,w,h);
  const cw=w/19.5,ch=h/11,x0=cw*.6,y0=ch*.5;
  const cat=(r,c)=>{
    if(c===0)return '#e9b44c';                 // فلز قلیایی
    if(c===1&&r>0)return '#f0d26a';           // قلیایی خاکی
    if(r>=3&&c>=2&&c<=11)return '#7fb0d6';     // واسطه
    if(c>=12&&c<=16)return r<2?'#9ad39a':'#7cc2a0';
    if(c===17)return '#b79ad9';
    return '#d7a0a0';
  };
  for(let r=0;r<7;r++)for(let c=0;c<18;c++){
    if(r===0&&c>0&&c<17)continue;
    if(r<3&&c>1&&c<12)continue;
    g.fillStyle=cat(r,c);g.fillRect(x0+c*cw+1,y0+(r+1)*ch+1,cw-2,ch-2);
  }
  g.fillStyle='#8ac5a0';g.fillRect(x0+2.5*cw,y0+8.6*ch,cw*12.8,ch*.9);g.fillStyle='#d9c27a';g.fillRect(x0+2.5*cw,y0+9.6*ch,cw*12.8,ch*.9);
  text(g,'جدول تناوبی عنصرها',w/2,26,34,'#223');
});
const boardTex=meta=>canvasTex(900,450,(g,w,h)=>{
  g.fillStyle='#f8f9f7';g.fillRect(0,0,w,h);
  g.fillStyle='#1d4ed8';g.fillRect(0,0,w,10);
  const book=[meta&&meta.book,meta&&meta.activity,meta&&meta.page?'صفحهٔ '+meta.page:''].filter(Boolean).join(' · ');
  text(g,book||'جعبه ابزار شیمی',w/2,52,34,'#1d4ed8');
  text(g,(meta&&meta.title)||'',w/2,128,50,'#16202c');
  /* پرسش آزمایش، شکسته‌شده در چند خط */
  const q=(meta&&meta.question)||'';g.font=`600 34px ${FONT}`;g.direction='rtl';
  const words=q.split(' '),lines=[];let cur='';
  for(const wd of words){const t=cur?cur+' '+wd:wd;if(g.measureText(t).width>w-110&&cur){lines.push(cur);cur=wd;}else cur=t;}
  if(cur)lines.push(cur);
  lines.slice(0,4).forEach((l,i)=>text(g,l,w/2,225+i*58,34,'#b91c1c',600));
});
const exitTex=()=>canvasTex(256,96,(g,w,h)=>{g.fillStyle='#15803d';g.fillRect(0,0,w,h);text(g,'خروج',w/2,50,52,'#fff');});

export function buildRoom(scene,meta){
  const room=new THREE.Group(),add=(m,x,y,z,ry=0)=>{m.position.set(x,y,z);m.rotation.y=ry;room.add(m);return m;};
  const box=(w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);room.add(m);return m;};
  const plane=(w,h,mat,x,y,z,ry=0,rx=0)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.rotation.set(rx,ry,0);room.add(m);return m;};
  const paint=M(0xffffff,.95,{map:wallTex(),bumpMap:stuccoTex(),bumpScale:.5}),white=M(0xf4f4f2,.6),metal=M(0xb0b6bd,.35,{metalness:.8});

  /* کف و سقف */
  plane(60,40.5,M(0xffffff,.32,{map:floorTex()}),0,FLOOR_Y,13.75,0,-Math.PI/2);
  plane(60,40.5,M(0xffffff,.95,{map:ceilTex()}),0,CEIL_Y,13.75,0,Math.PI/2);
  /* لکه‌های نور پخته‌شده روی کف و میز */
  const ov=(w,h,map,x,y,z,mat={})=>{const m=plane(w,h,new THREE.MeshBasicMaterial({map,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,...mat}),x,y,z,0,-Math.PI/2);m.renderOrder=1;return m;};
  ov(60,40.5,floorLightTex(),0,FLOOR_Y+.02,13.75);
  ov(34,26,benchLightTex(),0,.012,2);
  /* لبهٔ جلوی میز و شیر گاز و پریز روی دیوار پشتی */
  box(34,.5,.35,M(0x1d2328,.5),0,-.15,15.05);
  for(const x of [-13,13]){
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.5,.6,.35,14),M(0x2a2f35,.5,{metalness:.5}));base.position.set(x,.18,-5.4);room.add(base);
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,1.1,12),M(0xe0b13a,.35,{metalness:.7}));body.position.set(x,.8,-5.4);room.add(body);
    const nz=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.7,10),metal);nz.rotation.x=Math.PI/2;nz.position.set(x,.95,-5.0);room.add(nz);
  }
  box(3.2,1.2,.3,M(0xf4f4f2,.4),-18,4.5,BACK_Z+.2);box(.5,.5,.2,M(0x222,.5),-18.7,4.5,BACK_Z+.4);box(.5,.5,.2,M(0x222,.5),-17.3,4.5,BACK_Z+.4);
  /* دیوارها */
  plane(60,19,M(0xe4e8e6,.95),0,CEIL_Y-9.5,BACK_Z+.02);                       // بالای کاشی دیوار پشتی
  plane(40.5,41,paint,-SIDE_X,7.5,13.75,Math.PI/2);
  plane(40.5,41,paint,SIDE_X,7.5,13.75,-Math.PI/2);
  plane(60,41,paint,0,7.5,FRONT_Z,Math.PI);
  box(60,.9,.3,M(0x6b7780,.7),0,FLOOR_Y+.45,BACK_Z+.1);              // قرنیز
  /* نوار تزئینی و لبهٔ بالای کاشی */
  box(60,.55,.22,M(0x2f6f7a,.3),0,9.15,BACK_Z+.12);box(60,.18,.3,white,0,9.55,BACK_Z+.15);
  /* چراغ‌های فلورسنت */
  const lamp=new THREE.MeshBasicMaterial({color:0xfffbe8});
  for(const x of [-16,0,16])for(const z of [2,16,28]){
    box(7,.4,1.8,white,x,CEIL_Y-.2,z);box(6.4,.12,1.3,lamp,x,CEIL_Y-.44,z);
  }
  /* پنجره‌های کرکره‌دار روی دیوار چپ */
  const sky=new THREE.MeshBasicMaterial({color:0xb9defa});
  for(const z of [6,16,26]){
    box(.2,9.4,5.8,sky,-SIDE_X+.1,15,z);
    for(const s of [-1,1])box(.5,9.6,.35,white,-SIDE_X+.25,15,z+s*2.95);
    for(const y of [10.2,19.8])box(.5,.35,6.1,white,-SIDE_X+.25,y,z);
    box(1,.3,6.4,white,-SIDE_X+.5,10.05,z);                           // لبهٔ پنجره
    for(let k=0;k<16;k++)box(.14,.5,5.4,M(0xf2f0e8,.6),-SIDE_X+.55,19.4-k*.28,z).rotation.z=.35;
  }
  /* در و تابلوی خروج روی دیوار راست */
  box(.4,20,6.4,M(0xcfc9b8,.7),SIDE_X-.1,-3,12);
  box(.4,19.3,5.4,M(0xffffff,.5,{map:WOOD_T}),SIDE_X-.3,-3.35,12);
  box(.3,4,2.2,M(0x9cc9e6,.15,{transparent:true,opacity:.7}),SIDE_X-.55,2.5,12);
  const h=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,1.3,10),metal);h.rotation.x=Math.PI/2;h.position.set(SIDE_X-.8,-4,9.9);room.add(h);
  plane(4.2,1.55,new THREE.MeshBasicMaterial({map:exitTex()}),SIDE_X-.28,9.4,12,-Math.PI/2);
  /* وایت‌برد روی دیوار روبه‌رو */
  box(15,8.2,.3,metal,-6,10,FRONT_Z-.15);
  plane(14.4,7.2,M(0xffffff,.35,{map:boardTex(meta)}),-6,10,FRONT_Z-.32,Math.PI);
  box(10,.3,.7,metal,-6,5.7,FRONT_Z-.5);
  /* دیوار پشتی: پوسترها، ساعت، قفسه و کپسول */
  plane(5.2,7.1,M(0xffffff,.8,{map:safetyTex()}),-21,15.5,BACK_Z+.08);
  plane(14.4,6,M(0xffffff,.8,{map:ptTex()}),-10,15.5,BACK_Z+.08);
  const cl=new THREE.Mesh(new THREE.CircleGeometry(2.1,40),M(0xffffff,.4,{map:clockTex()}));cl.position.set(4,19.5,BACK_Z+.12);room.add(cl);
  for(const [y,cols] of [[12.5,[0xdfe9ef,0x7dd3c0,0xf6b26b,0x9fc5e8,0xdfe9ef,0xea9999,0xb6d7a8]],[17.5,[0xf9cb9c,0xdfe9ef,0xa4c2f4,0xd5a6bd,0x93c47d,0xdfe9ef,0xffe599]]]){
    box(15,.35,1.7,M(0x8b6b4a,.6),19,y,BACK_Z+.95);
    cols.forEach((c,i)=>{
      const x=12.6+i*2.05,gl=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,1.6+(i%3)*.4,16),M(c,.2,{transparent:true,opacity:.82}));gl.position.set(x,y+.18+(.8+(i%3)*.2),BACK_Z+.95);room.add(gl);
      const cap=new THREE.Mesh(new THREE.CylinderGeometry(.32,.38,.35,12),M(0xf1f1ee,.5));cap.position.set(x,y+.18+(1.6+(i%3)*.4)+.15,BACK_Z+.95);room.add(cap);
    });
  }
  const ex=new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,4.4,20),M(0xc0261c,.35,{metalness:.3}));ex.position.set(27,FLOOR_Y+2.9,BACK_Z+1.3);room.add(ex);
  const eh=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,.8,12),M(0x1e1e1e,.5));eh.position.set(27,FLOOR_Y+5.4,BACK_Z+1.3);room.add(eh);
  box(1.4,.2,.2,M(0x1e1e1e,.5),27.5,FLOOR_Y+5.7,BACK_Z+1.3);
  box(.12,9,3,white,27,FLOOR_Y+5,BACK_Z+.5);                         // پایهٔ تابلو
  /* کابینت زیر میز */
  box(33.6,12.4,24.6,M(0x34505d,.6),0,-6.7,2.5);
  plane(33.4,12.1,M(0xffffff,.55,{map:cabinetTex()}),0,-6.7,14.82);
  box(34,.5,25.8,M(0x24343c,.7),0,FLOOR_Y+.25,2.5);                  // سکو

  /* میز کنار دیوار چپ (زیر پنجره‌ها) و راست، با سینک و شیر آب */
  const topM=M(0x2b3238,.35),bodyM=M(0xe6e4dc,.7),steel=M(0xc8ced4,.3,{metalness:.85});
  const counter=(sign,z0,z1,doorMap)=>{
    const L=z1-z0,cz=(z0+z1)/2,cx=sign*(SIDE_X-2.4);
    box(4.8,12.4,L,bodyM,cx,-6.2,cz);box(5,.5,L+.1,topM,cx,-.25,cz);
    plane(L,12.1,M(0xffffff,.6,{map:doorMap}),cx-sign*2.41,-6.2,cz,-sign*Math.PI/2);
    return {cx,cz};
  };
  const lc=counter(-1,4,33,cabinetTex('#c9c6ba','#e9e7df')),rc=counter(1,18,33,cabinetTex('#c9c6ba','#e9e7df'));
  for(const [c,sign,z] of [[lc,-1,16],[rc,1,26]]){
    box(2.6,.12,2.4,steel,c.cx,.06,z);                              // سینک
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.14,.16,1.9,12),steel);stem.position.set(c.cx+sign*1.4,1.0,z);room.add(stem);
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,1.3,10),steel);arm.rotation.z=Math.PI/2;arm.position.set(c.cx+sign*.75,1.9,z);room.add(arm);
    box(.5,.25,.5,M(0x2d6cdf,.4),c.cx+sign*1.4,2.0,z);                // دستگیرهٔ آب
  }
  box(2,5.2,13.6,M(0xdedcd2,.7),SIDE_X-1,5.2,25.7);                     // کمد دیواری بالای میز راست
  /* چهارپایه‌ها دور میز اصلی */
  for(const x of [-9,-3,3,9]){
    const seat=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,.55,22),M(0x2f3b45,.6));seat.position.set(x,-4.2,19.5);room.add(seat);
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,8.4,10),steel);leg.position.set(x,-8.7,19.5);room.add(leg);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.9,.09,8,22),steel);ring.rotation.x=Math.PI/2;ring.position.set(x,-8.4,19.5);room.add(ring);
    const foot=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.25,20),steel);foot.position.set(x,FLOOR_Y+.15,19.5);room.add(foot);
  }
  /* سطل زباله و جعبهٔ کمک‌های اولیه */
  const bin=new THREE.Mesh(new THREE.CylinderGeometry(1.1,.9,3.2,18),M(0x6b7780,.6));bin.position.set(-27,FLOOR_Y+1.6,-4.6);room.add(bin);
  box(2.8,2.2,.7,M(0xf4f4f2,.5),20,6.5,BACK_Z+.4);box(1.4,.35,.2,M(0x15803d,.5),20,6.5,BACK_Z+.8);box(.35,1.4,.2,M(0x15803d,.5),20,6.5,BACK_Z+.8);
  /* ثابت‌سازی: ماتریس‌ها یک‌بار محاسبه می‌شوند */
  room.traverse(o=>{o.updateMatrix&&o.updateMatrix();o.matrixAutoUpdate=false;});
  scene.add(room);
  return room;
}
