#!/usr/bin/env node
/* بررسی سریع خطاهای تایپی: نام‌های تعریف‌نشده، import ناموجود (بدون نیاز به مرورگر)
   نیاز: typescript  (npm i -D typescript)    اجرا: node tools/check-names.mjs [پوشهٔ آزمایش …] */
import {createRequire} from 'node:module';
import {readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let tsc;try{tsc=join(dirname(require.resolve('typescript/package.json')),'bin/tsc');}catch(e){console.error('typescript نصب نیست: npm i -D typescript');process.exit(2);}
const args=process.argv.slice(2);
const dirs=args.length?args.map(a=>join('experiments',a)):readdirSync(join(ROOT,'experiments'),{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>join('experiments',d.name));
const files=[...readdirSync(join(ROOT,'core')).filter(f=>f.endsWith('.js')).map(f=>join('core',f)),...dirs.flatMap(d=>readdirSync(join(ROOT,d)).filter(f=>f.endsWith('.js')).map(f=>join(d,f)))];
const r=spawnSync(process.execPath,[tsc,'--noEmit','--allowJs','--checkJs','--target','es2022','--module','esnext','--moduleResolution','bundler','--skipLibCheck','--lib','es2022,dom,dom.iterable',...files],{cwd:ROOT,encoding:'utf8'});
const bad=(r.stdout||'').split('\n').filter(l=>/TS(2304|2552|2305|2614|2300|2451)/.test(l));
bad.forEach(l=>console.log('✗',l.replace(/error TS\d+: /,'')));
console.log(bad.length?`\n${bad.length} مشکل پیدا شد (نام تعریف‌نشده یا import اشتباه).`:'✓ نام تعریف‌نشده یا import اشتباهی پیدا نشد.');
process.exit(bad.length?1:0);
