/* اجراکنندهٔ شبیه‌سازی: صحنه را می‌سازد، تب‌ها و مراحل را اجرا می‌کند و گزارش خودکار می‌دهد */
import {THREE,$,tweens,updaters,stepTweens,world} from './kernel.js';
import {initWorld,resize,camTo,camState,CAMS,distMul} from './world.js';
import {initPerf,tick as perfTick,rendered as perfRendered} from './perf.js';
import {initTools,placeTools,dropper,wash,spoon} from './tools.js';
import {initFx,clearDebris,updateDebris} from './fx.js';
import {TUBE_GEO} from './glassware.js';
import {S,resetState} from './state.js';
import * as UI from './ui.js';

export const errorLog=[];
const post=m=>{try{parent!==window&&parent.postMessage(m,location.origin);}catch(e){}};
export function logError(where,e){
  const msg=`${where}: ${e&&e.message?e.message:e}`;
  errorLog.push(msg);console.error(msg,e);post({type:'lab-error',message:msg});
}
addEventListener('error',e=>logError('خطای صفحه',e.error||e.message));
addEventListener('unhandledrejection',e=>logError('خطای ناهمگام',e.reason));

export async function startLab({meta,experiment}){
  const tabs=experiment&&experiment.tabs;
  if(!Array.isArray(tabs)||!tabs.length)throw new Error('experiment.js باید «export default {tabs:[...]}» داشته باشد.');
  tabs.forEach((t,i)=>{
    if(typeof t.setup!=='function'||typeof t.steps!=='function')throw new Error(`تب ${i+1}: توابع setup و steps لازم است.`);
  });

  UI.buildChrome(meta,tabs,experiment.cameras);
  initWorld($('#stage'),meta);initTools();initFx();
  resize();addEventListener('resize',resize);
  try{initPerf();}catch(e){console.warn('perf',e);}
  {
    const c=CAMS.overview,t=new THREE.Vector3(...c.t),p=t.clone().add(new THREE.Vector3(...c.p).sub(t).multiplyScalar(distMul()));
    world.camera.position.copy(p);world.controls.target.copy(t);
  }

  let cur=0,steps=[],stepIdx=0,running=false,auto=false,token=0,speed=1,boost=1;

  function clearDyn(){
    while(world.dyn.children.length){
      const c=world.dyn.children[0];world.dyn.remove(c);
      c.traverse(o=>{if(o.geometry&&o.geometry!==TUBE_GEO)o.geometry.dispose();});
    }
    clearDebris();
  }
  function paint(){UI.renderSteps(steps,stepIdx,running,auto);}
  function setupTab(i){
    cur=i;token++;running=false;auto=false;tweens.length=0;updaters.length=0;
    const tab=tabs[i];
    clearDyn();placeTools();UI.hud('');UI.clearAnswers();resetState();
    world.rack.visible=tab.rack!==false;            // نگه‌دارندهٔ لوله (پیش‌فرض: نشان داده می‌شود)
    dropper.group.visible=tab.dropper!==false;      // قطره‌چکان (پیش‌فرض: نشان داده می‌شود)
    wash.visible=tab.wash!==false;                  // شیشهٔ آب مقطر (با wash:false مخفی می‌شود)
    spoon.visible=tab.spoon!==false;                // قاشقک (با spoon:false مخفی می‌شود)
    try{
      tab.setup();
      steps=tab.steps();
    }catch(e){logError(`تب «${tab.title}»`,e);steps=[];}
    stepIdx=0;UI.markTab(i);paint();
    camTo(tab.camera||'overview',1.2,true);
  }
  async function runCurrent(){
    if(running||stepIdx>=steps.length)return false;
    const my=token,st=steps[stepIdx];running=true;paint();
    let ok=true;
    try{await st.run();}catch(e){ok=false;logError(`تب «${tabs[cur].title}»، مرحلهٔ «${st.tag}»`,e);}
    if(my!==token)return false;
    running=false;stepIdx++;paint();return ok;
  }
  async function runAll(){
    if(auto){auto=false;paint();return;}
    if(running)return;
    auto=true;const my=token;paint();
    while(auto&&my===token&&stepIdx<steps.length){
      await runCurrent();
      if(my!==token)return;
      await new Promise(r=>setTimeout(r,350));
    }
    if(my===token){auto=false;paint();}
  }

  $('#run').onclick=()=>runCurrent();
  $('#auto').onclick=()=>runAll();
  $('#reset').onclick=()=>setupTab(cur);
  document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>setupTab(+b.dataset.i));
  document.querySelectorAll('#camBar button').forEach(b=>b.onclick=()=>camTo(b.dataset.c,1.2,true));
  $('#autocam').onchange=e=>{camState.auto=e.target.checked;};
  $('#speed').oninput=e=>{speed=+e.target.value;};

  /* آزمون خودکار: همهٔ مراحل همهٔ تب‌ها را با سرعت بالا اجرا می‌کند */
  async function autotest(){
    const before=errorLog.length,report={id:meta.id,ok:true,tabs:[],errors:[]};
    boost=12;
    for(let i=0;i<tabs.length;i++){
      setupTab(i);const t0=performance.now();let bad=0;
      while(stepIdx<steps.length){if(!(await runCurrent()))bad++;}
      report.tabs.push({id:tabs[i].id||String(i),title:tabs[i].title,steps:steps.length,failed:bad,ms:Math.round(performance.now()-t0)});
      if(!steps.length)report.ok=false;
    }
    boost=1;setupTab(0);
    report.errors=errorLog.slice(before);
    if(report.errors.length)report.ok=false;
    return report;
  }
  addEventListener('message',async e=>{
    if(e.origin!==location.origin||!e.data||e.data.type!=='lab-command')return;
    if(e.data.cmd==='autotest')post({type:'lab-report',report:await autotest()});
    if(e.data.cmd==='ping')post({type:'lab-ready',id:meta.id,tabs:tabs.length});
  });

  /* حلقهٔ رندر */
  let last=performance.now();
  loop.seen=new Set();
  function loop(now){
    const rdt=Math.min(.05,(now-last)/1000);last=now;
    const dt=rdt*speed*boost;
    try{
      stepTweens(dt);
      for(const u of updaters)u(dt);
      S.tubes.forEach(t=>t&&t.update(dt));
      S.vessels.forEach(v=>v&&v.update(dt));
      updateDebris(dt);
      const moved=world.controls.update();
      if(perfTick(now,rdt,moved)){world.renderer.render(world.scene,world.camera);perfRendered(now);}
    }catch(e){
      const m=String(e&&e.message||e);
      if(!loop.seen.has(m)){loop.seen.add(m);logError('حلقهٔ رندر',e);}
    }
    requestAnimationFrame(loop);
  }
  setupTab(0);
  requestAnimationFrame(t=>{last=t;loop(t);});
  const l=$('#loading');if(l){l.style.opacity=0;setTimeout(()=>l.remove(),700);}
  window.__lab={autotest,errorLog,setupTab,get steps(){return steps;}};
  post({type:'lab-ready',id:meta.id,tabs:tabs.length});
}
