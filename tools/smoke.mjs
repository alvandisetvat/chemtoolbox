#!/usr/bin/env node
/* آزمون دودی: هر آزمایش را در مرورگر بدون‌سر باز می‌کند و همهٔ مراحل همهٔ تب‌ها را خودکار اجرا می‌کند.
   نیاز: playwright (npm i -D playwright  &&  npx playwright install chromium) و وجود vendor/three
   اجرا: node tools/smoke.mjs [شناسه …]     (بدون آرگومان: همهٔ آزمایش‌ها) */
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {start} from './server-lib.mjs';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'));}catch(e){console.error('playwright نصب نیست: npm i -D playwright && npx playwright install chromium');process.exit(2);}
const idx=JSON.parse(readFileSync(join(ROOT,'experiments/index.json'),'utf8'));
const ids=process.argv.slice(2).length?process.argv.slice(2):idx.experiments.map(e=>e.id);
const srv=await start(0);const port=srv.address().port;
const br=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let bad=0;
for(const id of ids){
  for(const vp of [{width:1280,height:800},{width:390,height:780}]){
    const pg=await br.newPage({viewport:vp});const errs=[];
    pg.on('pageerror',e=>errs.push(e.message));
    pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
    await pg.goto(`http://localhost:${port}/player.html?e=${id}`);
    let rep;
    try{
      await pg.waitForFunction(()=>window.__lab||document.querySelector('#fatal'),null,{timeout:30000});
      if(await pg.$('#fatal')){rep={ok:false,errors:[await pg.textContent('#fatal')]};}
      else rep=await pg.evaluate(()=>window.__lab.autotest());
    }catch(e){rep={ok:false,errors:[String(e.message)]};}
    const ok=rep.ok&&!errs.length;if(!ok)bad++;
    console.log(`${ok?'✓':'✗'} ${id} @${vp.width}px`,(rep.tabs||[]).map(t=>`${t.id}:${t.steps}مرحله/${t.ms}ms`).join(' '));
    [...(rep.errors||[]),...errs].forEach(x=>console.log('    ',x));
    await pg.close();
  }
}
await br.close();srv.close();
console.log(bad?`\n${bad} مورد ناموفق`:'\nهمه موفق');process.exit(bad?1:0);
