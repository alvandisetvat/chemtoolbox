/* «آیا دیگر پرتوهای الکترومغناطیس را می‌توان مشاهده کرد؟» — شیمی ۱ (دهم)، فصل ۱، کاوش کنید (ص ۲۱)
   کنترل تلویزیون پرتو فروسرخ (نامرئی) می‌فرستد؛ چشم چیزی نمی‌بیند ولی حسگر دوربین موبایل آن را به‌صورت نور بنفش‌سفید ثبت می‌کند.
   توجه: «تصویر صفحهٔ موبایل» یک تصویر ساده‌شده است، نه عکس واقعی. مرجع API: docs/LAB-API.md */
import {
  THREE,v3,lerp,lin,sleep,tween,moveTo,fa,
  S,CAMS,world,addUpdater,canvasTex,
  camTo,hud,ansStep
} from '../../core/api.js';

CAMS.main={p:[0,6.4,9.8],t:[0,1.1,0]};
CAMS.eye={p:[-.5,.95,-1.7],t:[-.6,.2,.8]};
CAMS.phone={p:[-.9,5.4,5.2],t:[-.9,1.7,1.0]};

const mk=(c,r=.5,m=0,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,...o});
const add=o=>{world.dyn.add(o);return o;};
const REMOTE_P=v3(-.6,0,2.4),REMOTE_LEN=4.4,REMOTE_W=1.25;
const TIP=()=>REMOTE_P.clone().add(v3(0,.12,-REMOTE_LEN/2));
/* موبایل: بدنه در صفحهٔ XY (نمایشگر رو به +z)، با زاویهٔ A به عقب خم می‌شود تا دوربین پشتی بالای چشمی کنترل قرار گیرد */
const PH_W=1.55,PH_H=3.2,PH_T=.13,PH_A=-.78,LENS_L=v3(.45,1.22,-.09),LENS_H=2.4;
const PHONE_USE=(()=>{const ca=Math.cos(PH_A),sa=Math.sin(PH_A);
  const dy=LENS_L.y*ca-LENS_L.z*sa,dz=LENS_L.y*sa+LENS_L.z*ca,t=TIP();
  return v3(t.x-LENS_L.x,t.y+LENS_H-dy,t.z-dz);})();
const PHONE_REST=v3(4.6,PH_T/2+.01,2.8);

/* هر کلید کد پالس ویژهٔ خودش را می‌فرستد، ولی پالس‌ها در هزارم ثانیه‌اند و هم چشم و هم دوربین موبایل آن را فقط
   به‌صورت یک درخشش کوتاه و یکسان می‌بینند؛ پس در شبیه‌سازی برای همهٔ کلیدها ظاهر یکسانی نشان داده می‌شود. */
const CODES={power:'power',vol:'vol',ch:'ch'};
const FLASH=.38;

/* مستطیل گوشه‌گرد کشیده‌شده */
function rrGeo(w,h,r,depth,bev){
  const sh=new THREE.Shape(),x=-w/2,y=-h/2;
  sh.moveTo(x+r,y);sh.lineTo(x+w-r,y);sh.quadraticCurveTo(x+w,y,x+w,y+r);sh.lineTo(x+w,y+h-r);sh.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  sh.lineTo(x+r,y+h);sh.quadraticCurveTo(x,y+h,x,y+h-r);sh.lineTo(x,y+r);sh.quadraticCurveTo(x,y,x+r,y);
  return new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:true,bevelSize:bev,bevelThickness:bev,bevelSegments:3,curveSegments:14});
}
const rrPath=(c,x,y,w,h,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();};

function makeTV(){
  const g=new THREE.Group();
  const frame=new THREE.Mesh(new THREE.BoxGeometry(5.6,3.3,.35),mk(0x15171a,.45,.2));frame.position.y=2.55;
  const stand=new THREE.Mesh(new THREE.BoxGeometry(1.6,.12,.9),mk(0x1b1d20,.4,.4));stand.position.y=.06;
  const neck=new THREE.Mesh(new THREE.BoxGeometry(.3,.9,.2),mk(0x1b1d20,.4,.4));neck.position.y=.55;
  const tex=canvasTex(320,180,()=>{});
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(5.2,2.92),new THREE.MeshStandardMaterial({map:tex,roughness:.25,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:0}));
  scr.position.set(0,2.55,.19);
  const led=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),new THREE.MeshBasicMaterial({color:0xff2a14}));led.position.set(2.4,1.0,.19);
  g.add(frame,stand,neck,scr,led);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  g.position.set(0,0,-2.6);
  const c=tex.image.getContext('2d');
  g.show=(on,ch,vol)=>{
    c.fillStyle='#050607';c.fillRect(0,0,320,180);
    if(on){
      const cols=['#c8c8c8','#c8c800','#00c8c8','#00c800','#c800c8','#c80000','#0000c8'];
      cols.forEach((k,i)=>{c.fillStyle=k;c.fillRect(i*320/7,0,320/7+1,128);});
      c.fillStyle='#161616';c.fillRect(0,128,320,52);
      c.fillStyle='#fff';c.font='700 34px sans-serif';c.textBaseline='top';c.textAlign='left';c.fillText('CH '+ch,12,12);
      c.fillStyle='#222';c.fillRect(0,150,320,30);c.fillStyle='#4caf50';c.fillRect(10,160,vol*28,10);
      c.fillStyle='#fff';c.font='600 16px sans-serif';c.fillText('VOL',10,134);
    }
    tex.needsUpdate=true;scr.material.emissiveIntensity=on?.55:0;led.material.color.set(on?0x38e060:0xff2a14);
  };
  g.show(false,1,5);
  return add(g);
}

/* چیدمان کلیدها روی کنترل (x,z نسبت به مرکز؛ z منفی سمت چشمی) */
const KEYS={
  power:{x:-.34,z:-1.62,r:.17,c:'#c0392b',t:'⏻'},
  mute:{x:.34,z:-1.62,r:.13,c:'#454a52',t:'×'},
  vol:{x:-.32,z:-1.05,w:.3,h:.34,c:'#3b4048',t:'+'},volm:{x:-.32,z:-.6,w:.3,h:.34,c:'#3b4048',t:'−'},
  ch:{x:.32,z:-1.05,w:.3,h:.34,c:'#3b4048',t:'+'},chm:{x:.32,z:-.6,w:.3,h:.34,c:'#3b4048',t:'−'}
};
function remoteTex(){
  const W=275,H=1000,tex=canvasTex(W,H,()=>{}),c=tex.image.getContext('2d');
  const X=x=>(x+.55)/1.1*W,Y=z=>(z+2.2)/4.4*H;
  c.clearRect(0,0,W,H);
  c.fillStyle='#1a1c20';rrPath(c,0,0,W,H,70);c.fill();
  const pad=(x,z,w,h,col,txt,fs=26)=>{const px=X(x)-w*W/1.1/2,py=Y(z)-h*H/4.4/2;
    c.fillStyle='rgba(0,0,0,.55)';rrPath(c,px+2,py+3,w*W/1.1,h*H/4.4,12);c.fill();
    c.fillStyle=col;rrPath(c,px,py,w*W/1.1,h*H/4.4,12);c.fill();
    c.fillStyle='rgba(255,255,255,.12)';rrPath(c,px+3,py+2,w*W/1.1-6,h*H/4.4*.4,10);c.fill();
    if(txt){c.fillStyle='#e8eaee';c.font=`600 ${fs}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(txt,X(x),Y(z)+1);}};
  /* ناوبری */
  c.fillStyle='#2a2d33';c.beginPath();c.arc(X(0),Y(.12),W*.38,0,7);c.fill();
  c.fillStyle='#3b4048';c.beginPath();c.arc(X(0),Y(.12),W*.14,0,7);c.fill();
  c.fillStyle='#d4d7dc';c.font='600 20px sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.fillText('OK',X(0),Y(.12));c.fillText('▲',X(0),Y(.12)-W*.27);c.fillText('▼',X(0),Y(.12)+W*.27);c.fillText('◀',X(0)-W*.27,Y(.12));c.fillText('▶',X(0)+W*.27,Y(.12));
  /* کلیدهای عددی */
  let n=1;for(let r=0;r<3;r++)for(let k=0;k<3;k++){pad(-.34+k*.34,.78+r*.34,.27,.24,'#4a4f57',String(n++),22);}
  pad(0,1.8,.27,.24,'#4a4f57','0',22);pad(-.34,1.8,.27,.24,'#3b4048','☰',18);pad(.34,1.8,.27,.24,'#3b4048','↩',18);
  c.fillStyle='#8a8f98';c.font='500 17px sans-serif';c.textAlign='center';c.fillText('VOL',X(-.32),Y(-.82));c.fillText('CH',X(.32),Y(-.82));
  tex.needsUpdate=true;return tex;
}
function keyTex(k){
  const S2=96,tex=canvasTex(S2,S2,()=>{}),c=tex.image.getContext('2d');
  c.fillStyle=k.c;c.fillRect(0,0,S2,S2);
  c.fillStyle='rgba(255,255,255,.14)';c.fillRect(0,0,S2,S2*.4);
  c.fillStyle='#f1f2f4';c.font='700 56px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(k.t,S2/2,S2/2+3);
  tex.needsUpdate=true;return tex;
}
function makeRemote(){
  const g=new THREE.Group();
  const bg=rrGeo(REMOTE_W,REMOTE_LEN,.5,.2,.05);bg.translate(0,0,0);bg.rotateX(-Math.PI/2);
  const body=new THREE.Mesh(bg,mk(0x16181c,.42,.05,{envMapIntensity:.9}));body.position.y=.0;
  const top=new THREE.Mesh(new THREE.PlaneGeometry(1.1,4.4),new THREE.MeshStandardMaterial({map:remoteTex(),roughness:.55,transparent:true}));
  top.rotation.x=-Math.PI/2;top.position.y=.262;
  /* درز درپوش باتری و قاب سمت چشمی */
  const seam=new THREE.Mesh(new THREE.BoxGeometry(1.02,.006,.02),mk(0x050505,.9));seam.position.set(0,.262,1.35);
  g.add(body,top,seam);
  g.keys={};
  for(const name of ['power','vol','ch']){
    const k=KEYS[name];
    const geo=k.r?new THREE.CylinderGeometry(k.r,k.r,.05,24):new THREE.BoxGeometry(k.w,.05,k.h);
    const m=new THREE.Mesh(geo,[mk(0x222,.6),new THREE.MeshStandardMaterial({map:keyTex(k),roughness:.5}),mk(0x222,.6)]);
    m.position.set(k.x,.285,k.z);m.userData.y0=.285;g.add(m);g.keys[name]=m;
  }
  /* پنجرهٔ فروسرخ: قابِ کوچک تیره‌ی نیمه‌شفاف در نوک */
  const win=new THREE.Mesh(new THREE.SphereGeometry(.2,16,10),mk(0x2a0b10,.12,0,{transparent:true,opacity:.9,envMapIntensity:1.4}));
  win.scale.set(1.5,.55,.7);win.position.set(0,.13,-REMOTE_LEN/2+.02);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.2,.02,8,20),mk(0x0a0a0c,.5));rim.scale.set(1.5,.6,1);rim.position.copy(win.position);rim.rotation.x=Math.PI/2;
  g.add(win,rim);g.lens=win;
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  g.position.copy(REMOTE_P);
  g.press=async name=>{const k=g.keys[name];await tween(.12,t=>{k.position.y=k.userData.y0-.035*t;},lin);await tween(.12,t=>{k.position.y=k.userData.y0-.035*(1-t);},lin);};
  return add(g);
}

function makePhone(){
  const g=new THREE.Group();
  const bg=rrGeo(PH_W,PH_H,.3,PH_T,.025);bg.translate(0,0,-PH_T/2);
  const body=new THREE.Mesh(bg,mk(0x2d3036,.28,.85,{envMapIntensity:1.3}));
  const W=300,H=620,tex=canvasTex(W,H,()=>{});
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(PH_W-.1,PH_H-.1),new THREE.MeshBasicMaterial({map:tex,transparent:true}));
  scr.position.z=PH_T/2+.03;
  /* پشت: جزیرهٔ دوربین */
  const bump=new THREE.Mesh(rrGeo(.62,.62,.14,.03,.01),mk(0x202328,.3,.7));bump.geometry.translate(0,0,-.03);bump.position.set(LENS_L.x-.02,LENS_L.y-.02,-PH_T/2-.045);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.04,20),mk(0x050507,.05,.3,{envMapIntensity:1.6}));lens.rotation.x=Math.PI/2;lens.position.set(LENS_L.x,LENS_L.y,-PH_T/2-.07);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.16,.018,8,20),mk(0x9aa0a8,.3,.9));ring.position.copy(lens.position);
  g.add(body,scr,bump,lens,ring);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  g.tex=tex;g.ctx=tex.image.getContext('2d');
  g.position.copy(PHONE_REST);g.rotation.x=-Math.PI/2;
  /* برنامهٔ دوربین: نمای بالای نوک کنترل + نور فروسرخ بنفش‌سفید هنگام پالس (تصویر ساده‌شده) */
  g.draw=lvl=>{
    const c=g.ctx;
    const bgG=c.createLinearGradient(0,0,0,H);bgG.addColorStop(0,'#3a3f48');bgG.addColorStop(1,'#23262c');c.fillStyle=bgG;c.fillRect(0,0,W,H);
    c.fillStyle='rgba(255,255,255,.04)';for(let i=0;i<16;i++)c.fillRect(0,40*i+8,W,2);                    // بافت میز
    const bx=70,bw=160,by=230;                                                                            // کنترل از نوک تا پایین
    c.fillStyle='rgba(0,0,0,.4)';rrPath(c,bx+6,by+8,bw,H,60);c.fill();
    c.fillStyle='#1a1c20';rrPath(c,bx,by,bw,H,60);c.fill();
    c.fillStyle='#2b2e34';rrPath(c,bx+14,by+60,bw-28,H,40);c.fill();
    c.fillStyle='#c0392b';c.beginPath();c.arc(bx+36,by+110,12,0,7);c.fill();
    c.fillStyle='#3b4048';for(let r=0;r<4;r++){rrPath(c,bx+22,by+170+r*52,40,34,8);c.fill();rrPath(c,bx+bw-62,by+170+r*52,40,34,8);c.fill();}
    c.fillStyle='#2a0b10';c.beginPath();c.ellipse(bx+bw/2,by+14,30,12,0,0,7);c.fill();                    // پنجرهٔ فروسرخ
    c.strokeStyle='#0a0a0c';c.lineWidth=3;c.stroke();
    if(lvl>0){
      const cx=bx+bw/2,cy=by+14,r=46+lvl*90;
      const gr=c.createRadialGradient(cx,cy,2,cx,cy,r);
      gr.addColorStop(0,`rgba(255,255,255,${lvl})`);gr.addColorStop(.22,`rgba(222,185,255,${.9*lvl})`);gr.addColorStop(.6,`rgba(130,80,255,${.45*lvl})`);gr.addColorStop(1,'rgba(90,50,255,0)');
      c.fillStyle=gr;c.fillRect(0,0,W,H);
      c.strokeStyle=`rgba(230,200,255,${.5*lvl})`;c.lineWidth=2;c.beginPath();c.moveTo(cx-r*1.1,cy);c.lineTo(cx+r*1.1,cy);c.stroke();
    }
    /* رابط برنامهٔ دوربین */
    c.fillStyle='rgba(0,0,0,.45)';c.fillRect(0,0,W,48);c.fillRect(0,H-120,W,120);
    c.fillStyle='#fff';c.font='600 18px sans-serif';c.textAlign='center';c.textBaseline='middle';
    c.fillText('1×',W/2,H-98);c.fillText('عکس',W/2+40,H-72);c.fillStyle='#ffd54a';c.fillText('ویدیو',W/2-40,H-72);
    c.strokeStyle='#fff';c.lineWidth=4;c.beginPath();c.arc(W/2,H-34,24,0,7);c.stroke();
    c.fillStyle='#fff';c.beginPath();c.arc(W/2,H-34,18,0,7);c.fill();
    c.fillStyle='#e53935';c.beginPath();c.arc(W-30,24,6,0,7);c.fill();
    c.strokeStyle='rgba(255,213,74,.9)';c.lineWidth=2;c.strokeRect(bx+bw/2-34,by-16,68,56);               // کادر فوکوس
    g.tex.needsUpdate=true;
  };
  g.draw(0);
  return add(g);
}

function setup(){
  S.tv=makeTV();S.rem=makeRemote();S.phone=makePhone();
  S.tvOn=false;S.ch=1;S.vol=5;S.sig=null;S.lvl=0;S.phoneActive=false;
  addUpdater(()=>{
    let lvl=0;
    if(S.sig){
      const t=(performance.now()-S.sig.t0)/1000;
      if(t>=FLASH)S.sig=null;else lvl=.82+.18*Math.random();     // سوسوی بسیار سریع: دیده نمی‌شود، فقط درخشش پایدار
    }
    if(lvl!==S.lvl){S.lvl=lvl;if(S.phoneActive)S.phone.draw(lvl);}
    /* چشم: لنز کنترل هیچ نوری ندارد (نور فروسرخ دیده نمی‌شود) */
  });
}

/* فشردن یک کلید: پالس فروسرخ فرستاده می‌شود و تلویزیون واکنش نشان می‌دهد */
async function pressKey(name,code,react){
  const p=S.rem.press(name);
  S.sig={t0:performance.now(),code};
  await sleep(.25);react&&react();
  await p;await sleep(FLASH+.2);
}
const tvReact={
  power:()=>{S.tvOn=!S.tvOn;S.tv.show(S.tvOn,S.ch,S.vol);},
  vol:()=>{S.vol=Math.min(10,S.vol+2);S.tv.show(S.tvOn,S.ch,S.vol);},
  ch:()=>{S.ch++;S.tv.show(S.tvOn,S.ch,S.vol);}
};

function steps(){
  return [
    {tag:'۱',text:'یک کنترل تلویزیون با باتری سالم بردارید و از یکی از دوستانتان بخواهید کلید روشن و خاموش آن را فشار دهد. شما هم به چشمی کنترل نگاه کنید. چه مشاهده می‌کنید؟',run:async()=>{
      await camTo('eye');
      hud('به چشمی کنترل (جلوی آن) نگاه کنید');await sleep(.9);
      await pressKey('power',CODES.power,tvReact.power);
      await camTo('main');await sleep(.5);
      hud('تلویزیون روشن شد، اما از چشمی کنترل نوری دیده نمی‌شود');await sleep(1.2);
      await pressKey('power',CODES.power,tvReact.power);
      await sleep(.4);
    }},
    ansStep('۱ (پرسش)','با چشم، هنگام فشردن کلید به چشمی کنترل نگاه می‌کنید. چه مشاهده می‌کنید؟','eye','مشاهده',
      'هیچ نوری از چشمی کنترل دیده نمی‌شود، با اینکه تلویزیون به فرمان کنترل پاسخ می‌دهد. پس کنترل چیزی می‌فرستد که چشم ما آن را نمی‌بیند.'),
    {tag:'۲',text:'قسمت ۱ را تکرار کنید؛ اما این بار با دوربین یک موبایل به چشمی کنترل نگاه کنید. چه مشاهده می‌کنید؟ آن را توصیف کنید.',run:async()=>{
      S.phoneActive=true;S.phone.draw(0);
      await camTo('main');
      await moveTo(S.phone,PHONE_USE,1.5,{x:PH_A,y:0,z:0},.9);
      await camTo('phone');
      hud('صفحهٔ موبایل، دوربین رو به چشمی کنترل');await sleep(.9);
      await pressKey('power',CODES.power,tvReact.power);
      hud('روی صفحه، نقطه‌ای بنفش‌سفید برای لحظه‌ای روشن می‌شود');await sleep(1.3);
    }},
    ansStep('۲ (پرسش)','با نگاه کردن به چشمی از دوربین موبایل چه می‌بینید؟','phone','مشاهده',
      'دوربین موبایل نور بنفش‌سفیدی را نشان می‌دهد که با هر فشردن کلید برای لحظه‌ای کوتاه روشن می‌شود. یعنی از چشمی کنترل پرتویی خارج می‌شود که چشم ما آن را نمی‌بیند، ولی حسگر دوربین آن را ثبت می‌کند. <small>(تصویر موبایل در این شبیه‌سازی ساده‌شده است.)</small>'),
    {tag:'۳',text:'آزمایش را با فشردن دیگر دکمه‌ها تکرار نمایید و مشاهده‌های خود را یادداشت نمایید. چه تفاوتی مشاهده می‌کنید؟ توضیح دهید.',run:async()=>{
      await camTo('phone');
      hud('به نقطهٔ روی صفحه نگاه کنید و تفاوت کلیدها را بسنجید');await sleep(1.2);
      hud('کلید «صدا +»');await pressKey('vol',CODES.vol,tvReact.vol);
      hud('کلید «کانال +»');await pressKey('ch',CODES.ch,tvReact.ch);
      hud('کلید «روشن/خاموش»');await pressKey('power',CODES.power,tvReact.power);
      await camTo('main');await sleep(.6);
    }},
    ansStep('۳ (پرسش)','فشردن کلیدهای دیگر چه تفاوتی در مشاهده‌ها ایجاد می‌کند؟','phone','مشاهده',
      'در دوربین موبایل برای <b>همهٔ کلیدها</b> همان درخشش بنفش‌سفید کوتاه دیده می‌شود و تفاوتی در آن نمی‌بینیم، چون پالس‌ها بسیار سریع‌اند. تنها تفاوت قابل‌مشاهده، واکنش تلویزیون است (روشن‌شدن، تغییر صدا یا تغییر کانال). در واقع هر کلید پیام (کد) ویژهٔ خودش را با پالس‌های فروسرخ می‌فرستد، ولی این تفاوت را نه با چشم می‌توان دید و نه با دوربین موبایل.'),
    ansStep('۴ (پرسش)','از این مشاهده‌ها چه نتیجه‌ای می‌گیرید؟','phone','نتیجه',
      'کنترل تلویزیون پرتو <b>فروسرخ</b> می‌فرستد؛ این پرتو، نور مرئی نیست و چشم آن را نمی‌بیند، اما حسگر دوربین موبایل آن را ثبت می‌کند. پس بخشی از پرتوهای الکترومغناطیس (مانند فروسرخ) را نمی‌توان با چشم دید و برای دیدنشان به وسیله نیاز داریم.')
  ];
}

export default {
  cameras:[['main','نمای کلی'],['eye','چشمی کنترل'],['phone','صفحهٔ موبایل']],
  tabs:[{id:'main',title:'کاوش',camera:'main',rack:false,dropper:false,wash:false,spoon:false,setup,steps}]
};
