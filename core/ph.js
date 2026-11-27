/* کاغذ pH (نشانگر عمومی)، مقیاس رنگی pH و کنش‌های آغشته‌کردن/مقایسه */
import {THREE,C,clamp,lerp,rnd,v3,easeOut,lin,world,tween,sleep,moveTo,FONT} from './kernel.js';
import {canvasTex,paperTex} from './textures.js';
import {mesh} from './materials.js';

/* رنگ نشانگر عمومی به‌ازای pH (۱ تا ۱۴) */
export const PH_STOPS=[[1,0xe5252a],[2,0xea3a2a],[3,0xf06a28],[4,0xf5902a],[5,0xf6b21f],[6,0xefd53a],[7,0x7cc24a],[8,0x38ad78],[9,0x2d9db8],[10,0x3d73c9],[11,0x4a55b8],[12,0x5f3fa5],[13,0x7a3790],[14,0x8a2c88]];
export function phColor(v){
  v=clamp(v,1,14);
  for(let i=0;i<PH_STOPS.length-1;i++){
    const [a,ca]=PH_STOPS[i],[b,cb]=PH_STOPS[i+1];
    if(v<=b)return new C(ca).lerp(new C(cb),(v-a)/(b-a));
  }
  return new C(PH_STOPS[PH_STOPS.length-1][1]);
}
const hex=(c)=>'#'+new C(c).getHexString();

/* ---------- مقیاس رنگی ---------- */
const CW=1500,CH=480,CELL0=70,CELLW=1360/14,PXU=500;   // بوم ۱۵۰۰×۴۸۰ ↔ کارت ۳٫۰×۰٫۹۶
export function makePHChart(){
  const tex=canvasTex(CW,CH,(g,w,h)=>{
    g.fillStyle='#f7f5ee';g.fillRect(0,0,w,h);
    g.strokeStyle='#c9c4b4';g.lineWidth=8;g.strokeRect(4,4,w-8,h-8);
    g.textAlign='center';g.textBaseline='middle';g.fillStyle='#1c2530';
    g.font=`800 56px ${FONT}`;g.direction='rtl';g.fillText('مقیاس رنگی کاغذ pH',w/2,64);
    for(let i=0;i<14;i++){
      const x=CELL0+i*CELLW;
      g.fillStyle=hex(PH_STOPS[i][1]);g.fillRect(x+3,140,CELLW-6,220);
      g.fillStyle=i<5||i>9?'#ffffff':'#1c2530';g.font='800 64px Tahoma, sans-serif';g.direction='ltr';
      g.fillText(String(i+1),x+CELLW/2,250);
    }
    g.fillStyle='#8a1d1d';g.font=`700 40px ${FONT}`;g.direction='rtl';g.fillText('اسیدی  (pH < 7)',CELL0+CELLW*3,415);
    g.fillStyle='#2b6b2e';g.fillText('خنثی',CELL0+CELLW*6.5,415);
    g.fillStyle='#3a2f8a';g.fillText('بازی  (pH > 7)',CELL0+CELLW*10.5,415);
  });
  const g=new THREE.Group();
  const card=new THREE.Mesh(new THREE.PlaneGeometry(CW/PXU,CH/PXU),new THREE.MeshStandardMaterial({map:tex,roughness:.8}));
  card.position.y=.1+CH/PXU/2;card.rotation.x=-.12;card.castShadow=true;g.add(card);
  const foot=new THREE.Mesh(new THREE.BoxGeometry(CW/PXU+.1,.1,.35),new THREE.MeshStandardMaterial({color:0x2c3a45,roughness:.7}));
  foot.position.set(0,.05,.1);foot.castShadow=true;g.add(foot);
  const marker=new THREE.Mesh(new THREE.ConeGeometry(.07,.16,3),new THREE.MeshStandardMaterial({color:0x111111,roughness:.5}));
  marker.rotation.z=Math.PI;marker.position.set(0,.1+CH/PXU+.1,.04);marker.visible=false;g.add(marker);
  const xFor=v=>(CELL0+(clamp(v,1,14)-1+.5)*CELLW-CW/2)/PXU;
  const rowY=.1+CH/PXU/2-.02;
  world.dyn.add(g);
  return {group:g,card,marker,xFor,rowY,cardW:CW/PXU};
}

/* ---------- بستهٔ کاغذ و نوار ---------- */
export function makePHPack(){
  const g=new THREE.Group();
  const box=new THREE.Mesh(new THREE.BoxGeometry(.6,.2,1.0),new THREE.MeshStandardMaterial({color:0xf2efe6,roughness:.7}));
  box.position.y=.1;box.castShadow=true;box.receiveShadow=true;g.add(box);
  const lab=new THREE.Mesh(new THREE.PlaneGeometry(.52,.9),new THREE.MeshStandardMaterial({map:paperTex(220,360,[{t:'کاغذ pH',size:60,y:110},{t:'pH 1–14',size:54,y:230,dir:'ltr',weight:600}]),roughness:.7}));
  lab.rotation.x=-Math.PI/2;lab.position.y=.202;g.add(lab);
  world.dyn.add(g);
  return {group:g,top:v3(0,.2,0)};
}
export const STRIP_LEN=1.5, STRIP_TIP=.42;
export function makeStrip(){
  const g=new THREE.Group();
  const dry=new C(0xf0e6c4);
  const body=new THREE.Mesh(new THREE.BoxGeometry(.11,STRIP_LEN,.012),new THREE.MeshStandardMaterial({color:dry,roughness:.9}));
  body.position.y=STRIP_LEN/2;body.castShadow=true;
  const tipMat=new THREE.MeshStandardMaterial({color:dry.clone(),roughness:.85});
  const tip=new THREE.Mesh(new THREE.BoxGeometry(.112,STRIP_TIP,.016),tipMat);tip.position.y=STRIP_TIP/2;
  g.add(body,tip);world.dyn.add(g);
  return {group:g,tip,color:tipMat.color,dry};
}
/* نوار تازه از بسته بیرون می‌آورد و بالای بسته نگه می‌دارد */
export async function takePHStrip(pack){
  const s=makeStrip(),p=pack.group.position;
  s.group.position.set(p.x,.2,p.z);
  await moveTo(s.group,v3(p.x,.9,p.z),.9);
  return s;
}
/* نوار را در مایع فرو می‌برد و رنگش را به رنگ pH می‌رساند.
   target: {x,z,surfaceY (ارتفاع سطح مایع),topY (ارتفاع دهانهٔ ظرف)} — برای بشر beakerTarget(b) و برای بطری bottleTarget(b) */
export async function dipPHPaper(strip,target,pH){
  const g=strip.group,over=Math.max(target.topY,target.surfaceY)+.7;
  await moveTo(g,v3(target.x,over,target.z),1.2,null,.6);
  await moveTo(g,v3(target.x,target.surfaceY-STRIP_TIP*.65,target.z),.9);
  const c0=strip.color.clone(),c1=phColor(pH);
  await tween(1.4,k=>strip.color.lerpColors(c0,c1,k),lin);
  await sleep(.3);
  await moveTo(g,v3(target.x,over,target.z),.9);
}
/* نوار را کنار مقیاس رنگی می‌برد و نشانگر را روی خانهٔ pH می‌گذارد */
export async function compareWithChart(strip,chart,pH){
  const cp=chart.group.position,x=cp.x+chart.xFor(pH),y=chart.rowY-STRIP_TIP/2+.04;
  await moveTo(strip.group,v3(x,y+.8,cp.z+.34),1.2,null,.5);
  await moveTo(strip.group,v3(x,y,cp.z+.34),.7);
  chart.marker.visible=true;chart.marker.position.x=chart.xFor(pH);
  await sleep(.5);
}
export const beakerTarget=b=>({x:b.group.position.x,z:b.group.position.z,surfaceY:b.level,topY:b.H});
export const bottleTarget=(b,surfaceY=1.12,topY=2.05)=>({x:b.group.position.x,z:b.group.position.z,surfaceY,topY});
