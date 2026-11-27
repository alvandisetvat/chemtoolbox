/* کتابخانهٔ سرور ایستا (توسط serve.mjs و smoke.mjs استفاده می‌شود) */
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {join,extname,normalize,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.woff2':'font/woff2','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
export function start(port=8080){
  const srv=createServer(async(req,res)=>{
    try{
      let p=decodeURIComponent(new URL(req.url,'http://x').pathname);
      if(p.endsWith('/'))p+='index.html';
      const f=normalize(join(ROOT,p));
      if(!f.startsWith(ROOT))throw 0;
      if((await stat(f)).isDirectory())throw 0;
      res.writeHead(200,{'Content-Type':MIME[extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});
      res.end(await readFile(f));
    }catch(e){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('404');}
  });
  return new Promise((res,rej)=>{srv.once('error',rej);srv.listen(port,()=>res(srv));});
}
