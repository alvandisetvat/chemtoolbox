/* سرعت و کیفیت: سطح کیفیت (سریع/متعادل/بالا + خودکار)، رندر کم‌مصرف در حالت بیکار و پنل عیب‌یابی.
   به منطق آزمایش‌ها کاری ندارد؛ فقط lab.js آن را فراخوانی می‌کند. */
import {world,tweens,$} from './kernel.js';
import {resize} from './world.js';

const mobile=()=>{try{return matchMedia('(pointer:coarse)').matches||Math.min(innerWidth,innerHeight)<600;}catch(e){return false;}};
const LEVELS=['fast','balanced','high'];
const FA={auto:'خودکار',fast:'سریع',balanced:'متعادل',high:'بالا'};
const CFG=()=>({
  fast:{dpr:1,shadow:1024},
  balanced:{dpr:mobile()?1.25:1.5,shadow:mobile()?1024:2048},
  high:{dpr:2,shadow:mobile()?1024:2048}
});
const IDLE_FPS=24;                 // وقتی هیچ انیمیشن و لمسی نیست، فقط در این نرخ رندر می‌شود
const st={mode:'auto',level:'balanced',hot:0,lastR:0,slow:0,warm:0,frames:0,fps:0,fpsT:0,active:true};

export function setLevel(l){
  const c=CFG()[l];if(!c)return;st.level=l;
  const {renderer,sun}=world;
  try{
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,c.dpr));
    if(sun&&sun.shadow&&sun.shadow.mapSize.x!==c.shadow){
      sun.shadow.mapSize.set(c.shadow,c.shadow);
      if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
    }
    resize();
  }catch(e){}
  st.hot=performance.now()+1500;
  paint();
}
export function setMode(m){
  st.mode=m;st.slow=0;
  if(m!=='auto')setLevel(m);else setLevel(st.level);
}
/* هر فریم: true یعنی باید رندر کرد */
export function tick(now,rdt,moved){
  st.active=tweens.length>0||moved||now<st.hot;
  /* خودکار: در حالت فعال، اگر حدود ۷۵ فریم کند دیده شد سطح را پایین می‌آورد */
  if(st.mode==='auto'&&st.active&&++st.warm>40){
    if(rdt>1/28)st.slow++;else if(st.slow>0&&st.frames%8===0)st.slow--;
    if(st.slow>=75){const i=LEVELS.indexOf(st.level);if(i>0){setLevel(LEVELS[i-1]);st.warm=0;}st.slow=0;}
  }
  st.frames++;
  if(st.active){st.lastR=now;return true;}
  if(now-st.lastR>=1000/IDLE_FPS){st.lastR=now;return true;}
  return false;
}
export function poke(ms=1200){st.hot=performance.now()+ms;}
export function rendered(now){st.rc=(st.rc||0)+1;if(now-st.fpsT>=1000){st.fps=Math.round(st.rc*1000/(now-st.fpsT));st.rc=0;st.fpsT=now;paint();}}

let panel;
function paint(){
  if(!panel||panel.style.display==='none')return;
  const i=(world.renderer&&world.renderer.info&&world.renderer.info.render)||{calls:0,triangles:0};
  panel.textContent=`FPS ${st.fps}\nDraw calls ${i.calls}\nمثلث‌ها ${i.triangles}\nDPR ${world.renderer.getPixelRatio?world.renderer.getPixelRatio():'-'}\nکیفیت ${FA[st.level]}${st.mode==='auto'?' (خودکار)':''}\nحالت ${st.active?'فعال':'بیکار'}`;
}
export function initPerf(){
  /* پنل عیب‌یابی: کلید D یا پنج‌بار لمس عنوان */
  panel=document.createElement('pre');
  panel.style.cssText='position:fixed;top:8px;left:8px;z-index:50;margin:0;padding:6px 9px;background:#000a;color:#8cf0b0;font:12px/1.5 monospace;border-radius:6px;display:none;pointer-events:none;white-space:pre';
  document.body.appendChild(panel);
  const toggle=()=>{panel.style.display=panel.style.display==='none'?'block':'none';paint();};
  addEventListener('keydown',e=>{if((e.key==='d'||e.key==='D')&&!/INPUT|SELECT|TEXTAREA/.test((e.target.tagName||'')))toggle();});
  const tt=$('#title');if(tt){let n=0,t0=0;tt.addEventListener('click',()=>{const now=performance.now();if(now-t0>2000)n=0;t0=now;if(++n>=5){n=0;toggle();}});}
  /* هر تعامل با صحنه رندر کامل را بیدار می‌کند */
  const dom=world.renderer&&world.renderer.domElement;
  if(dom)['pointerdown','pointermove','wheel','touchstart'].forEach(ev=>dom.addEventListener(ev,()=>poke(1200),{passive:true}));
  addEventListener('resize',()=>poke(800));
  setMode('auto');   // سطح کیفیت خودکار است؛ انتخاب دستی حذف شد
}
