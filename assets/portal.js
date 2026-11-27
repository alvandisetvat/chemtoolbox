/* صفحهٔ اصلی: فهرست آزمایش‌ها، فیلتر و نمایشگر (iframe جداگانه برای هر آزمایش) */
const $=s=>document.querySelector(s);
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

if('serviceWorker' in navigator&&!/^(localhost|127\.|\[::1\])/.test(location.hostname)){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

let idx,books;
try{
  [idx,books]=await Promise.all([fetch('experiments/index.json').then(r=>r.json()),fetch('assets/books.json').then(r=>r.json())]);
}catch(e){
  $('#grid').innerHTML='<p class="empty">فهرست آزمایش‌ها بارگذاری نشد. اتصال را بررسی کنید یا <code>node tools/build-index.mjs</code> را اجرا کنید.</p>';
  throw e;
}
const items=[...idx.experiments.map(e=>({...e,ready:true})),...idx.planned.map(p=>({...p,ready:false}))]
  .sort((a,b)=>a.grade-b.grade||a.chapter-b.chapter||(b.ready-a.ready));
const st={grade:'all',cat:'all',q:'',onlyReady:false};

function chips(el,opts,key){
  el.innerHTML=opts.map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${st[key]===v}">${l}</button>`).join('');
  el.onclick=e=>{const b=e.target.closest('button');if(!b)return;st[key]=b.dataset.v;chips(el,opts,key);render();};
}
chips($('#gradeChips'),[['all','همهٔ پایه‌ها'],['10','دهم'],['11','یازدهم'],['12','دوازدهم']],'grade');
chips($('#catChips'),[['all','همهٔ انواع'],...Object.entries(books.categories)],'cat');
$('#q').oninput=e=>{st.q=e.target.value.trim();render();};
$('#onlyReady').onchange=e=>{st.onlyReady=e.target.checked;render();};

const norm=s=>String(s||'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').toLowerCase();
function render(){
  const q=norm(st.q);
  const list=items.filter(x=>
    (st.grade==='all'||String(x.grade)===st.grade)&&(st.cat==='all'||x.category===st.cat)&&(!st.onlyReady||x.ready)&&
    (!q||norm([x.title,x.question,x.activity,x.author,(x.tags||[]).join(' ')].join(' ')).includes(q)));
  $('#grid').innerHTML=list.map(x=>{
    const g=books[x.grade];const ch=g?.chapters?.[x.chapter];
    const dots='●'.repeat(x.difficulty||1)+'○'.repeat(3-(x.difficulty||1));
    const head=`<div class="meta"><span class="tag g">${esc(g?.grade||'')}</span><span class="tag">فصل ${fa(x.chapter)}${ch?': '+esc(ch):''}</span><span class="tag s">${esc(books.categories[x.category]||'')}</span></div>`;
    const body=`<h3>${esc(x.title)}</h3>${x.question?`<p class="q">${esc(x.question)}</p>`:`<p class="q">${esc(x.activity||'')}</p>`}`;
    if(x.ready)return `<a class="card" href="#/e/${esc(x.id)}">${head}${body}<div class="by"><span>${esc(x.author)}${x.page?` · صفحهٔ ${fa(x.page)}`:''}</span><span class="go">اجرا ←</span></div></a>`;
    return `<div class="card planned">${head}${body}<div class="by"><span>${x.assignee?esc(x.assignee):'مجری مشخص نشده'}</span><span class="tag">به‌زودی</span></div></div>`;
  }).join('');
  $('#empty').hidden=list.length>0;
  const total=items.length,rd=items.filter(x=>x.ready).length;
  $('#stat').innerHTML=`<b>${fa(rd)}</b> از ${fa(total)} آزمایش آماده`;
}
render();

/* ---- نمایشگر ---- */
const v=$('#viewer'),fr=$('#vframe');
/* replace: تا ورود/خروج iframe در تاریخچهٔ مرورگر ثبت نشود و دکمهٔ «بازگشت» درست کار کند */
const go=u=>{try{fr.contentWindow.location.replace(u);}catch(e){fr.src=u;}};
let navigated=false;
function route(){
  const m=location.hash.match(/^#\/e\/([a-z0-9-]+)$/i);
  if(!m){v.hidden=true;document.documentElement.classList.remove('vopen');go('about:blank');document.title='جعبه ابزار شیمی | شبیه‌سازی آزمایش‌های کتاب‌های درسی';return;}
  const x=items.find(i=>i.id===m[1]&&i.ready);
  if(!x){location.hash='';return;}
  $('#vtitle').textContent=x.title;$('#vby').textContent=`تهیه‌کننده: ${x.author}`;
  const url=`player.html?e=${encodeURIComponent(x.id)}`;
  go(url);$('#vopen').href=url;v.hidden=false;document.documentElement.classList.add('vopen');document.title=`${x.title} | جعبه ابزار شیمی`;
}
addEventListener('hashchange',()=>{navigated=true;route();});route();
$('#vback').onclick=()=>{if(navigated)history.back();else location.hash='';};
$('#vfs').onclick=()=>{try{document.fullscreenElement?document.exitFullscreen():v.requestFullscreen();}catch(e){}};
addEventListener('keydown',e=>{if(e.key==='Escape'&&!v.hidden&&!document.fullscreenElement)location.hash='';});
