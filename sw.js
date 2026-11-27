/* Service Worker: پس از اولین بازدید، سایت بدون اینترنت کار می‌کند */
const PREFIX='ct-';
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const {version,files}=await (await fetch('precache.json',{cache:'no-cache'})).json();
    const c=await caches.open(PREFIX+version);
    await Promise.all(files.map(f=>c.add(new Request(f,{cache:'reload'})).catch(()=>{})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    try{
      const {version}=await (await fetch('precache.json',{cache:'no-cache'})).json();
      for(const k of await caches.keys())if(k.startsWith(PREFIX)&&k!==PREFIX+version)await caches.delete(k);
    }catch(err){}
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||r.headers.has('range'))return;
  const fresh=/precache\.json$|experiments\/index\.json$/.test(u.pathname);
  e.respondWith((async()=>{
    const cache=await caches.match(r,{ignoreSearch:u.pathname.endsWith('player.html')});
    const net=fetch(r).then(async res=>{
      if(res.ok){const key=(await caches.keys()).filter(k=>k.startsWith(PREFIX)).sort().pop();if(key)(await caches.open(key)).put(r,res.clone());}
      return res;
    }).catch(()=>null);
    if(fresh)return (await net)||cache||new Response('',{status:504});
    return cache||(await net)||new Response('آفلاین',{status:504,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  })());
});
