#!/usr/bin/env node
/* دانلود یک‌بارهٔ three.js و فونت وزیرمتن داخل vendor/ تا سایت کاملاً آفلاین کار کند.
   اجرا:  node tools/fetch-vendor.mjs
   اگر npm در دسترس نیست:  node tools/fetch-vendor.mjs --registry https://registry.npmmirror.com
   نیاز: Node 18+ و دستور tar (در ویندوز ۱۰/۱۱ و لینوکس/مک موجود است) */
import {mkdirSync,copyFileSync,existsSync,writeFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const ai=process.argv.indexOf('--registry');
const REG=(ai>0?process.argv[ai+1]:process.env.NPM_REGISTRY||'https://registry.npmjs.org').replace(/\/$/,'');
const THREE_VERSION='0.160.0';           // نسخهٔ ثابت؛ بدون بررسی کامل تغییر ندهید
const tmp=mkdtempSync(join(tmpdir(),'vendor-'));

async function fetchPkg(name,version){
  const meta=await (await fetch(`${REG}/${name}/${version}`)).json();
  const url=meta?.dist?.tarball;if(!url)throw new Error(`بستهٔ ${name}@${version} پیدا نشد`);
  const buf=Buffer.from(await (await fetch(url)).arrayBuffer());
  const tgz=join(tmp,`${name}.tgz`),dir=join(tmp,name);
  writeFileSync(tgz,buf);mkdirSync(dir,{recursive:true});
  execFileSync('tar',['xzf',tgz,'-C',dir]);
  return {dir:join(dir,'package'),version:meta.version};
}
function cp(from,to){mkdirSync(dirname(to),{recursive:true});copyFileSync(from,to);console.log('  ✓',to.replace(ROOT,'.'));}

try{
  console.log(`رجیستری: ${REG}`);
  console.log(`three@${THREE_VERSION} …`);
  const t=await fetchPkg('three',THREE_VERSION);
  cp(join(t.dir,'build/three.module.js'),join(ROOT,'vendor/three/three.module.js'));
  cp(join(t.dir,'examples/jsm/controls/OrbitControls.js'),join(ROOT,'vendor/three/addons/controls/OrbitControls.js'));
  cp(join(t.dir,'examples/jsm/environments/RoomEnvironment.js'),join(ROOT,'vendor/three/addons/environments/RoomEnvironment.js'));
  if(existsSync(join(t.dir,'LICENSE')))cp(join(t.dir,'LICENSE'),join(ROOT,'vendor/three/LICENSE'));

  console.log('vazirmatn …');
  const f=await fetchPkg('vazirmatn','latest');
  const wd=join(f.dir,'fonts/webfonts');
  const files=existsSync(wd)?readdirSync(wd).filter(x=>x.endsWith('.woff2')):[];
  if(!files.length)throw new Error('فایل woff2 در بستهٔ فونت پیدا نشد');
  let css='/* ساخته‌شده با tools/fetch-vendor.mjs */\n';
  const vf=files.find(x=>x.includes('['));
  if(vf){
    cp(join(wd,vf),join(ROOT,'vendor/fonts/Vazirmatn-VF.woff2'));
    css+=`@font-face{font-family:'Vazirmatn';src:url('Vazirmatn-VF.woff2') format('woff2');font-weight:100 900;font-display:swap}\n`;
  }else{
    const W={Regular:400,Medium:500,SemiBold:600,Bold:700,ExtraBold:800};
    for(const x of files){
      const k=Object.keys(W).find(n=>x.includes(n));if(!k)continue;
      cp(join(wd,x),join(ROOT,'vendor/fonts',x));
      css+=`@font-face{font-family:'Vazirmatn';src:url('${x}') format('woff2');font-weight:${W[k]};font-display:swap}\n`;
    }
  }
  writeFileSync(join(ROOT,'vendor/fonts/fonts.css'),css);
  const lic=join(f.dir,'LICENSE');if(existsSync(lic))cp(lic,join(ROOT,'vendor/fonts/LICENSE-Vazirmatn.txt'));
  console.log(`\n✓ تمام شد. حالا:  node tools/build-index.mjs && node tools/serve.mjs`);
}catch(e){
  console.error('\n✗ خطا:',e.message);
  console.error('اگر اینترنت بین‌الملل قطع است، گزینهٔ --registry با یک آینهٔ npm داخلی را امتحان کنید، یا فایل‌ها را دستی مطابق README.md بگذارید.');
  process.exitCode=1;
}finally{rmSync(tmp,{recursive:true,force:true});}
