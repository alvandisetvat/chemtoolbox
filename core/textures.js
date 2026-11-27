import {THREE,$,TAU,V3,V2,C,clamp,lerp,rnd,v3,easeIO,easeOut,lin,fa,FONT,world,tweens,tween,sleep,moveTo} from './kernel.js';
/* ================= بافت‌ها (Canvas) ================= */
export function canvasTex(w,h,draw,{repeat,srgb=true}={}){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d');draw(g,w,h);
  const t=new THREE.CanvasTexture(c);
  if(srgb)t.colorSpace=THREE.SRGBColorSpace;
  t.anisotropy=8;
  if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat[0],repeat[1]);}
  return t;
}
export const NOISE=canvasTex(256,256,(g,w,h)=>{
  const id=g.createImageData(w,h);
  for(let i=0;i<w*h;i++){const v=110+Math.random()*145;id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=v;id.data[i*4+3]=255;}
  g.putImageData(id,0,0);
},{repeat:[2,2],srgb:false});
export const SPRITE=canvasTex(64,64,(g,w,h)=>{
  const gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.45,'rgba(255,255,255,.6)');gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
},{srgb:false});
export const BLOB=canvasTex(128,128,(g,w,h)=>{
  const gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba(0,0,0,.7)');gr.addColorStop(.6,'rgba(0,0,0,.25)');gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
},{srgb:false});
export const BENCH_T=canvasTex(512,512,(g,w,h)=>{
  g.fillStyle='#8c959c';g.fillRect(0,0,w,h);
  for(let i=0;i<46;i++){const x=Math.random()*w,y=Math.random()*h,r=40+Math.random()*90,gr=g.createRadialGradient(x,y,0,x,y,r),d=Math.random()<.5;   // لکه‌های درشت و نرم (ناهمگنی رزین)
    gr.addColorStop(0,d?'rgba(40,50,55,.07)':'rgba(255,255,255,.06)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r);}
  for(let i=0;i<9000;i++){g.fillStyle=`rgba(${Math.random()<.5?255:60},${Math.random()<.5?255:60},${Math.random()<.5?255:60},${Math.random()*.07})`;g.fillRect(Math.random()*w,Math.random()*h,2,2);}
  /* خط‌وخش‌های ریز و چند لکهٔ حلقه‌ای کم‌رنگ (سایش و ریخت‌وپاش) */
  g.lineWidth=1;
  for(let i=0;i<70;i++){const x=Math.random()*w,y=Math.random()*h,a=Math.random()*6.28,l=10+Math.random()*40;
    g.strokeStyle=`rgba(255,255,255,${.04+Math.random()*.07})`;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
  for(let i=0;i<4;i++){const x=40+Math.random()*(w-80),y=40+Math.random()*(h-80),r=14+Math.random()*16;
    g.strokeStyle='rgba(60,50,40,.05)';g.lineWidth=2.5;g.beginPath();g.arc(x,y,r,0,6.28);g.stroke();}
},{repeat:[7,7]});
/* کاشی لعابی: هر کاشی کمی رنگ و لعاب متفاوت، لبهٔ پخ‌دار (روشن بالا‌چپ و تیره پایین‌راست)، بندکشی نویزی.
   mode='bump' نقشهٔ برجستگی سیاه‌وسفید برمی‌گرداند (بند فرورفته). */
export function drawTiles(g,w,h,n,{base=[233,236,234],grout='#a7acaa',gw=3,mode='color',tint=5}={}){
  const cw=w/n,ch=h/n;
  g.fillStyle=mode==='bump'?'#000':grout;g.fillRect(0,0,w,h);
  if(mode!=='bump')for(let i=0;i<w*h/60;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.08})`;g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5);}
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    const x=c*cw+gw/2,y=r*ch+gw/2,tw=cw-gw,th=ch-gw,v=(Math.random()-.5)*tint*2;
    if(mode==='bump'){const gr=g.createLinearGradient(x,y,x+tw,y+th);gr.addColorStop(0,'#fff');gr.addColorStop(1,'#e8e8e8');g.fillStyle=gr;g.fillRect(x,y,tw,th);
      g.strokeStyle='rgba(120,120,120,.9)';g.lineWidth=2;g.strokeRect(x+1,y+1,tw-2,th-2);continue;}
    g.fillStyle=`rgb(${base[0]+v|0},${base[1]+v|0},${base[2]+v*.8|0})`;g.fillRect(x,y,tw,th);
    const sh=g.createLinearGradient(x,y,x+tw,y+th);sh.addColorStop(0,'rgba(255,255,255,.22)');sh.addColorStop(.5,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(0,0,0,.08)');
    g.fillStyle=sh;g.fillRect(x,y,tw,th);
    g.fillStyle='rgba(255,255,255,.5)';g.fillRect(x,y,tw,1.5);g.fillRect(x,y,1.5,th);                    // لبهٔ روشن
    g.fillStyle='rgba(0,0,0,.14)';g.fillRect(x,y+th-1.5,tw,1.5);g.fillRect(x+tw-1.5,y,1.5,th);          // لبهٔ تیره
    if(Math.random()<.25){g.fillStyle='rgba(90,80,60,.035)';g.beginPath();g.ellipse(x+Math.random()*tw,y+Math.random()*th,6+Math.random()*14,4+Math.random()*10,Math.random()*3,0,6.3);g.fill();}   // لکهٔ کم‌رنگ
  }
}
export const TILE_W=canvasTex(1024,1024,(g,w,h)=>drawTiles(g,w,h,8,{}),{repeat:[3,1.1]});
export const TILE_WB=canvasTex(1024,1024,(g,w,h)=>drawTiles(g,w,h,8,{mode:'bump'}),{repeat:[3,1.1],srgb:false});
export const TILE_T=canvasTex(128,128,(g,w,h)=>{
  g.fillStyle='#7f95a4';g.fillRect(0,0,w,h);
  const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(0,0,0,.10)');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.strokeStyle='#4c5f6c';g.lineWidth=4;g.strokeRect(0,0,w,h);
},{repeat:[40,20]});
export const WOOD_T=canvasTex(512,256,(g,w,h)=>{
  g.fillStyle='#b98a56';g.fillRect(0,0,w,h);
  for(let i=0;i<150;i++){
    const y=Math.random()*h;
    g.strokeStyle=`rgba(${70+Math.random()*40|0},${40+Math.random()*30|0},20,${.05+Math.random()*.14})`;
    g.lineWidth=.6+Math.random()*2.2;g.beginPath();g.moveTo(0,y);
    for(let x=0;x<=w;x+=32)g.lineTo(x,y+Math.sin(x*.02+i)*3);
    g.stroke();
  }
});
export function paperTex(w,h,lines){
  return canvasTex(w,h,(g)=>{
    g.fillStyle='#f3f1e8';g.fillRect(0,0,w,h);
    for(let i=0;i<w*h/90;i++){g.fillStyle=`rgba(${Math.random()<.5?255:120},${Math.random()<.5?255:110},100,${Math.random()*.05})`;g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5);}   // الیاف کاغذ
    const sh=g.createLinearGradient(0,0,w,0);sh.addColorStop(0,'rgba(0,0,0,.10)');sh.addColorStop(.18,'rgba(0,0,0,0)');sh.addColorStop(.8,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.14)');
    g.fillStyle=sh;g.fillRect(0,0,w,h);                                                              // خمیدگی برچسب
    g.strokeStyle='#cdc8b8';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4);
    g.textAlign='center';g.textBaseline='middle';
    for(const l of lines){
      g.fillStyle=l.color||'#1c2530';g.font=`${l.weight||700} ${l.size}px ${FONT}`;
      g.direction=l.dir||'rtl';g.fillText(l.t,w/2,l.y);
    }
  });
}


/* دانهٔ ریز پلاستیک (برجستگی) و نقش شیار لاستیک */
export const PLASTIC_BUMP=canvasTex(128,128,(g,w,h)=>{
  g.fillStyle='#808080';g.fillRect(0,0,w,h);
  for(let i=0;i<2600;i++){const v=105+Math.random()*50|0;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5);}
},{repeat:[2,2],srgb:false});

/* فلز ساب‌خورده: خطوط افقی ریز (فقط برجستگی) */
export const BRUSHED_BUMP=canvasTex(256,256,(g,w,h)=>{
  g.fillStyle='#808080';g.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){const v=100+Math.random()*60|0;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(Math.random()*w,Math.random()*h,20+Math.random()*120,1);}
},{repeat:[2,2],srgb:false});
/* ناهمواری بسیار ظریف شیشه: زبری کم با چند لکهٔ ردانگشت (رنگ خاکستری = زبری) */
export const GLASS_IMP=canvasTex(256,256,(g,w,h)=>{
  g.fillStyle='rgb(10,10,10)';g.fillRect(0,0,w,h);
  for(let i=0;i<26;i++){const x=Math.random()*w,y=Math.random()*h,r=8+Math.random()*28,gr=g.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(70,70,70,.7)');gr.addColorStop(1,'rgba(10,10,10,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r);}
},{repeat:[2,2],srgb:false});
