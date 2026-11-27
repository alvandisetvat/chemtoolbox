import {THREE,canvasTex} from '../../core/api.js';

/* میخ زنگ‌زده: لکه‌های زنگ نارنجی‌قهوه‌ای با حفره و پوسته، و جاهایی که فولاد خاکستری تیره بیرون زده.
   سه نقشه از یک چیدمان لکه ساخته می‌شود: رنگ، زبری (زنگ = زبر)، فلزی‌بودن (فولاد = فلز، زنگ = غیرفلز). */
const W=512,H=256;
const SPOTS=(()=>{const a=[];
  for(let i=0;i<70;i++)a.push({x:Math.random()*W,y:Math.random()*H,r:14+Math.random()*46,k:Math.random()});            // لکه‌های درشت زنگ
  const steel=[];for(let i=0;i<14;i++)steel.push({x:Math.random()*W,y:Math.random()*H,rx:6+Math.random()*34,ry:3+Math.random()*10});   // فولاد لخت (کشیده در راستای میخ)
  return {rust:a,steel};})();
const RUST=['#a8541d','#8a3f14','#c26a24','#6a2e0e','#b45e1e'];
function draw(mode){
  return canvasTex(W,H,(g,w,h)=>{
    const base=mode==='color'?'#5a2c10':mode==='rough'?'#ffffff':'#101010';
    g.fillStyle=base;g.fillRect(0,0,w,h);
    for(const s of SPOTS.rust){
      const gr=g.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r);
      const c=mode==='color'?RUST[(s.k*5)|0]:mode==='rough'?'#ffffff':'#000000';
      gr.addColorStop(0,c);gr.addColorStop(1,'rgba(0,0,0,0)');
      g.globalAlpha=mode==='color'?.7:1;g.fillStyle=gr;g.fillRect(s.x-s.r,s.y-s.r,2*s.r,2*s.r);
    }
    g.globalAlpha=1;
    if(mode==='color')for(let i=0;i<5200;i++){g.fillStyle=RUST[i%5];g.globalAlpha=.2+Math.random()*.5;const q=1+Math.random()*5;g.fillRect(Math.random()*w,Math.random()*h,q,q*(.4+Math.random()));}   // دانه‌های زنگ
    g.globalAlpha=1;
    for(const s of SPOTS.steel){                      // فولاد لخت که از زیر زنگ بیرون زده
      g.save();g.translate(s.x,s.y);g.scale(s.rx,s.ry);
      const gr=g.createRadialGradient(0,0,0,0,0,1);
      const c0=mode==='color'?'#55575a':mode==='rough'?'#6a6a6a':'#d8d8d8';
      gr.addColorStop(0,c0);gr.addColorStop(.7,c0);gr.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=gr;g.beginPath();g.arc(0,0,1,0,6.3);g.fill();g.restore();
    }
    if(mode==='bump'){for(let i=0;i<260;i++){g.fillStyle=`rgba(0,0,0,${.3+Math.random()*.5})`;const q=1+Math.random()*3;g.fillRect(Math.random()*w,Math.random()*h,q,q);}}   // حفره‌های خوردگی
  },{srgb:mode==='color'});
}
const MAPS={color:draw('color'),rough:draw('rough'),metal:draw('metal'),bump:draw('bump')};

/* شعاع ساقه با موج کم‌بسامد و ناهمواری تصادفی تغییر می‌کند تا میخ کاملاً استوانه‌ای نباشد */
function pitted(geo,amp){
  const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x);
    const n=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453,f=(n-Math.floor(n))-.5;
    const s=1+amp*(.55*Math.sin(y*9+a*3)+.35*Math.sin(y*23-a*5)+f);
    p.setXYZ(i,x*s,y,z*s);
  }
  geo.computeVertexNormals();return geo;
}

export /* ================= میخ زنگ‌زده و کاغذ ================= */
function makeNail(){
  const g=new THREE.Group();
  const m=new THREE.MeshStandardMaterial({map:MAPS.color,roughnessMap:MAPS.rough,metalnessMap:MAPS.metal,bumpMap:MAPS.bump,bumpScale:2.2,roughness:1,metalness:1,envMapIntensity:.9});
  const shank=new THREE.Mesh(pitted(new THREE.CylinderGeometry(.044,.038,1.9,16,36),.09),m);
  /* سر میخ: مخروط کوتاه گرد و کمی کج، با لبهٔ ناهموار */
  const head=new THREE.Mesh(pitted(new THREE.CylinderGeometry(.115,.09,.06,22,3),.12),m);head.position.y=.97;head.rotation.z=.04;
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.06,.046,.05,16),m);neck.position.y=.935;
  /* نوک: مخروط بلندتر و کمی خمیده */
  const tip=new THREE.Mesh(pitted(new THREE.ConeGeometry(.038,.26,14,6),.1),m);tip.position.set(.004,-1.07,0);tip.rotation.x=Math.PI;
  g.add(shank,neck,head,tip);g.traverse(o=>{o.castShadow=true;});
  g.rotation.z=Math.PI/2;
  const holder=new THREE.Group();holder.add(g);
  return holder;
}
