#!/usr/bin/env node
/* بررسی شناسنامه‌ها + ساخت experiments/index.json و precache.json
   اجرا: node tools/build-index.mjs   (کد خروج ۱ یعنی خطا وجود دارد) */
import {readdirSync,readFileSync,writeFileSync,existsSync,statSync} from 'node:fs';
import {join,relative,sep,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const EXP=join(ROOT,'experiments');
const CATS=['solution','apparatus','concept'];
const errors=[],warns=[];
const err=(id,m)=>errors.push(`✗ ${id}: ${m}`), warn=(id,m)=>warns.push(`! ${id}: ${m}`);

const ready=[];
for(const d of readdirSync(EXP,{withFileTypes:true})){
  if(!d.isDirectory())continue;
  const id=d.name,dir=join(EXP,id),mp=join(dir,'meta.json'),ep=join(dir,'experiment.js');
  const isTpl=id.startsWith('_');const e0=errors.length;
  if(!existsSync(mp)){err(id,'meta.json وجود ندارد');continue;}
  if(!existsSync(ep)){err(id,'experiment.js وجود ندارد');continue;}
  let m;try{m=JSON.parse(readFileSync(mp,'utf8'));}catch(e){err(id,'meta.json فرمت JSON معتبر ندارد: '+e.message);continue;}
  if(m.id!==id)err(id,`id در meta.json («${m.id}») با نام پوشه یکی نیست`);
  if(!isTpl&&!/^[a-z0-9][a-z0-9-]*$/.test(id))err(id,'نام پوشه فقط حروف کوچک انگلیسی، عدد و خط تیره');
  for(const k of ['title','question','book','activity','author','version'])if(!m[k]||typeof m[k]!=='string')err(id,`فیلد «${k}» لازم است`);
  if(![10,11,12].includes(m.grade))err(id,'grade باید ۱۰، ۱۱ یا ۱۲ باشد');
  if(!Number.isInteger(m.chapter)||m.chapter<1||m.chapter>4)err(id,'chapter باید عدد ۱ تا ۴ باشد');
  if(!Number.isInteger(m.page)||m.page<1)err(id,'page (شمارهٔ صفحهٔ کتاب) لازم است');
  if(!CATS.includes(m.category))err(id,`category باید یکی از ${CATS.join(' | ')} باشد`);
  if(![1,2,3].includes(m.difficulty))err(id,'difficulty باید ۱ تا ۳ باشد');
  if(!Array.isArray(m.materials)||!m.materials.length)err(id,'materials (فهرست مواد و وسایل) لازم است');
  if(!Array.isArray(m.tags))warn(id,'tags پیشنهاد می‌شود');
  const src=readFileSync(ep,'utf8');
  if(src.length>300*1024)err(id,'experiment.js بزرگ‌تر از ۳۰۰ کیلوبایت است');
  for(const imp of src.matchAll(/(?:import|from)\s*(?:[\w{},*\s]+from\s*)?['"]([^'"]+)['"]/g)){
    const p=imp[1];
    if(/^https?:|^\/\//.test(p))err(id,`import از آدرس اینترنتی ممنوع است: ${p}`);
    else if(p.startsWith('.')&&!p.endsWith('core/api.js')&&!existsSync(join(dir,p)))err(id,`فایل import شده پیدا نشد: ${p}`);
    else if(!p.startsWith('.'))err(id,`import غیرمجاز: ${p} (فقط ../../core/api.js و فایل‌های همین پوشه)`);
  }
  if(/https?:\/\//.test(src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm,'')))err(id,'آدرس اینترنتی (http/https) داخل کد پیدا شد');
  if(/\beval\s*\(|new Function\s*\(|document\.write|\bfetch\s*\(|XMLHttpRequest|localStorage/.test(src))err(id,'eval/fetch/localStorage/document.write در آزمایش مجاز نیست');
  if(!/from\s*['"]\.\.\/\.\.\/core\/api\.js['"]/.test(src))warn(id,'هیچ import از ../../core/api.js پیدا نشد');
  if(!isTpl&&!m.draft&&errors.length===e0)ready.push(m);
}
const planned=JSON.parse(readFileSync(join(EXP,'planned.json'),'utf8')).filter(p=>!ready.some(r=>r.id===p.id));

function walk(dir,out=[]){
  for(const e of readdirSync(dir,{withFileTypes:true})){
    if(['node_modules','.git','docs','tools'].includes(e.name))continue;
    const p=join(dir,e.name);
    if(e.isDirectory())walk(p,out);else out.push(p);
  }
  return out;
}
const skip=new Set(['precache.json','README.md','experiments/index.json']);
const files=walk(ROOT).map(p=>relative(ROOT,p).split(sep).join('/')).filter(f=>!skip.has(f)&&!f.endsWith('.md')&&!f.startsWith('experiments/_')).sort();
const h=createHash('sha1');for(const f of files){h.update(f);h.update(readFileSync(join(ROOT,f)));}
const version=h.digest('hex').slice(0,10);

writeFileSync(join(EXP,'index.json'),JSON.stringify({version,experiments:ready,planned},null,1));
const pre=[...files,'experiments/index.json','./'];
writeFileSync(join(ROOT,'precache.json'),JSON.stringify({version,files:pre}));
console.log(`آزمایش آماده: ${ready.length} | در انتظار: ${planned.length} | فایل‌های کش: ${pre.length} | نسخه: ${version}`);
warns.forEach(w=>console.log(w));
if(errors.length){
  console.log(`\n===== ${errors.length} خطا پیدا شد =====`);
  errors.forEach(e=>console.log(e));
  console.log('\nبعد از رفع خطاها دوباره اجرا کنید.');
  process.exit(1);
}
console.log('✓ همهٔ شناسنامه‌ها معتبرند');
