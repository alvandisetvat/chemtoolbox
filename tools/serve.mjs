#!/usr/bin/env node
/* سرور ایستای ساده برای توسعه: node tools/serve.mjs [پورت]  — تا زمانی که Ctrl+C نزنید باز می‌ماند */
import {start} from './server-lib.mjs';

let port=+process.argv[2]||8080,srv;
for(let i=0;i<20&&!srv;i++,port++){
  try{srv=await start(port);}
  catch(e){if(e.code!=='EADDRINUSE'&&e.code!=='EACCES'){console.error('✗ خطا:',e.message);process.exit(1);}}
}
if(!srv){console.error('✗ هیچ پورت آزادی پیدا نشد.');process.exit(1);}
port=srv.address().port;
console.log(`✓ سرور آماده است. این آدرس را در مرورگر باز کنید:\n  http://localhost:${port}/\n  صفحهٔ آزمایشی: http://localhost:${port}/playground.html\nبرای توقف: Ctrl+C (این پنجره را نبندید)`);
srv.on('close',()=>{console.log('سرور بسته شد.');});
process.on('SIGINT',()=>process.exit(0));
