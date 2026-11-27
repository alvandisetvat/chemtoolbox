/* رابط کاربری: پنل مراحل، تب‌ها، پیام کوتاه (HUD) و کارت پاسخ‌ها */
import {$,fa,sleep} from './kernel.js';
import {camTo,resize} from './world.js';

export function hud(t){const e=$('#hud');if(!e)return;e.textContent=t||'';e.style.opacity=t?1:0;}
export const eq=h=>`<div class="eq">${h}</div>`;

export function showAns(title,body){
  const c=document.createElement('div');c.className='card';c.innerHTML=`<h4>${title}</h4>${body}`;
  const a=$('#answers');a.appendChild(c);resize();
  setTimeout(()=>{resize();c.scrollIntoView({block:'nearest',behavior:'smooth'});},60);
}
export function clearAnswers(){$('#answers').innerHTML='';}

/* مرحلهٔ «پاسخ»: دوربین را می‌برد و کارت پاسخ را نشان می‌دهد */
export const ansStep=(tag,text,cam,title,body)=>({tag,text,ans:true,run:async()=>{await camTo(cam);showAns(title,body);await sleep(.4);}});

const DEFAULT_CAMS=[['overview','نمای کلی'],['rack','لوله‌ها'],['top','از بالا']];

export function buildChrome(meta,tabs,cameras){
  document.title=`${meta.title} | جعبه ابزار شیمی`;
  $('#kicker').textContent=[meta.activity,meta.page?`صفحهٔ ${fa(meta.page)}`:''].filter(Boolean).join(' · ')||meta.book||'';
  $('#title').textContent=meta.question||meta.title;
  $('#author').textContent=meta.author?`تهیه‌کننده: ${meta.author}`:'';
  $('#mats').innerHTML=(meta.materials||[]).map(m=>`<span>${m}</span>`).join('');
  const tb=$('#tabs');tb.innerHTML='';
  tb.classList.toggle('single',tabs.length<2);
  tabs.forEach((t,i)=>{
    const b=document.createElement('button');b.dataset.i=i;
    b.innerHTML=t.title+(t.subtitle?`<small> · ${t.subtitle}</small>`:'');
    tb.appendChild(b);
  });
  const cb=$('#camBar');cb.innerHTML='';
  for(const [id,label] of (cameras||DEFAULT_CAMS)){
    const b=document.createElement('button');b.dataset.c=id;b.textContent=label;cb.appendChild(b);
  }
  const sp=document.createElement('span');sp.textContent='با موس بچرخانید · چرخ موس = بزرگ‌نمایی';cb.appendChild(sp);
}

export function markTab(i){document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',+b.dataset.i===i));}

export function renderSteps(steps,stepIdx,running,auto){
  const ol=$('#steps');ol.innerHTML='';
  steps.forEach((s,i)=>{
    const li=document.createElement('li');
    li.className='step '+(i<stepIdx?'done':i===stepIdx?'cur':'');
    li.innerHTML=`<span class="tag">${s.tag}</span><span>${s.text}</span>`;
    ol.appendChild(li);
    if(i===stepIdx)requestAnimationFrame(()=>li.scrollIntoView({block:'nearest',behavior:'smooth'}));
  });
  const fin=stepIdx>=steps.length;
  const run=$('#run');
  run.disabled=running||fin;
  run.textContent=fin?'✔ آزمایش کامل شد':running?'در حال اجرا…':(steps[stepIdx].ans?'نمایش پاسخ':'▶ اجرای مرحله');
  const au=$('#auto');au.disabled=fin||(running&&!auto);au.textContent=auto?'⏸ توقف':'⏩ اجرای خودکار';
  $('#bar').style.width=(steps.length?stepIdx/steps.length*100:0)+'%';
}
