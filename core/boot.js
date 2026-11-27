/* بارگذاری آزمایش: player.html?e=<شناسه> */
const params=new URLSearchParams(location.search);
const id=params.get('e');
function fatal(title,hint){
  const l=document.querySelector('#loading');if(l)l.remove();
  const d=document.createElement('div');d.id='fatal';
  d.innerHTML=`<div><h2>${title}</h2><p>${hint||''}</p></div>`;
  document.body.appendChild(d);
  try{parent!==window&&parent.postMessage({type:'lab-error',message:title+' '+(hint||'').replace(/<[^>]+>/g,'')},location.origin);}catch(e){}
}
try{
  if(!id||!/^[a-z0-9][a-z0-9_-]*$/i.test(id))throw Object.assign(new Error('bad-id'),{code:'id'});
  const r=await fetch(`experiments/${id}/meta.json`,{cache:'no-cache'});
  if(!r.ok)throw Object.assign(new Error('no-meta'),{code:'meta'});
  const meta=await r.json();meta.id=meta.id||id;
  let lab,mod;
  try{lab=await import('./lab.js');}
  catch(e){throw Object.assign(e,{code:'three'});}
  try{mod=await import(`../experiments/${id}/experiment.js`);}
  catch(e){throw Object.assign(e,{code:'exp'});}
  await lab.startLab({meta,experiment:mod.default});
}catch(e){
  console.error(e);
  const c=e&&e.code;
  if(c==='id')fatal('شناسهٔ آزمایش نامعتبر است','نشانی باید به شکل <code>player.html?e=iron-ions</code> باشد.');
  else if(c==='meta')fatal('آزمایش پیدا نشد',`پوشهٔ <code>experiments/${id}/</code> یا فایل <code>meta.json</code> وجود ندارد.`);
  else if(c==='three')fatal('کتابخانهٔ سه‌بعدی بارگذاری نشد','فایل‌های <code>vendor/three</code> موجود نیستند. یک‌بار دستور <code>node tools/fetch-vendor.mjs</code> را اجرا کنید (راهنما: README.md).');
  else if(c==='exp')fatal('خطا در فایل experiment.js',String(e.message||e));
  else fatal('خطا در اجرای آزمایش',String(e&&e.message||e));
}
