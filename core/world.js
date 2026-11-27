/* صحنهٔ سه‌بعدی: رندرر، نور، محیط آزمایشگاه (میز، دیوار، رک) و دوربین */
import {THREE,$,TAU,V3,C,v3,tween,world} from './kernel.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {BENCH_T,TILE_T,TILE_W,TILE_WB,WOOD_T,paperTex} from './textures.js';
import {addBlob} from './materials.js';
import {SLOT_X,TR} from './glassware.js';
import {buildRoom} from './room.js';

/* صحنهٔ کوچک فقط برای بازتاب‌ها: اتاق خاکستری گرم + پنجره‌های روشن سمت چپ + نوارهای چراغ سقف */
function labEnvironment(){
  const e=new THREE.Scene(),bs=THREE.BackSide;
  const room=new THREE.Mesh(new THREE.BoxGeometry(60,30,60),new THREE.MeshBasicMaterial({color:0x6c7075,side:bs}));e.add(room);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshBasicMaterial({color:0x8d8e88}));floor.rotation.x=-Math.PI/2;floor.position.y=-14.9;e.add(floor);
  const glow=(w,h,x,y,z,ry,k,col=0xffffff)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(k),side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=ry;e.add(m);};
  for(const z of [-12,0,12])glow(9,10,-29.5,2,z,Math.PI/2,7,0xdcecff);          // پنجره‌ها
  for(const x of [-12,0,12])for(const z of [-10,6,22])glow(7,1.6,x,14.8,z,0,12,0xfff3d8).rotation.x=Math.PI/2;   // چراغ‌های سقف
  glow(14,8,0,3,-29.5,0,1.6,0xe8e4d8);                                           // وایت‌برد/دیوار روشن پشت
  return e;
}
export function initWorld(container,meta){
  /* ================= رندرر و صحنه ================= */
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.0;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene=new THREE.Scene();
  scene.background=new C(0x75899a);
  const pmrem=new THREE.PMREMGenerator(renderer);
  try{scene.environment=pmrem.fromScene(labEnvironment(),0.03).texture;}   // محیط بازتاب شبیه آزمایشگاه: پنجره و چراغ‌های سقفی
  catch(e){scene.environment=pmrem.fromScene(new RoomEnvironment(),0.04).texture;}

  const camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.1,120);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=.08;
  controls.minDistance=2.5;controls.maxDistance=24;
  controls.maxPolarAngle=Math.PI/2-.03;
  controls.zoomSpeed=.8;

  const sun=new THREE.DirectionalLight(0xfff4e6,2.3);
  sun.position.set(6,11,8);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:35});
  sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;
  scene.add(sun,sun.target);
  scene.add(new THREE.HemisphereLight(0xffffff,0x8a97a5,.55));

  Object.assign(world,{renderer,scene,camera,controls,sun});
  const dyn=new THREE.Group();scene.add(dyn);world.dyn=dyn;
  buildEnvironment(meta);
}
function buildEnvironment(meta){
  const scene=world.scene;
  const bench=new THREE.Mesh(new THREE.BoxGeometry(34,.4,26),new THREE.MeshStandardMaterial({map:BENCH_T,roughness:.36,metalness:.05,envMapIntensity:.5}));
  bench.position.set(0,-.2,2);bench.receiveShadow=true;scene.add(bench);
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(60,30),new THREE.MeshStandardMaterial({map:TILE_W,bumpMap:TILE_WB,bumpScale:1.2,roughness:.22,envMapIntensity:.9}));
  wall.geometry.dispose();wall.geometry=new THREE.PlaneGeometry(60,22);   // کاشی تا ارتفاع ۹ (بالاتر رنگ‌آمیزی)
  wall.position.set(0,-2,-6.5);wall.receiveShadow=true;scene.add(wall);
  buildRoom(scene,meta);
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(5.6,.9),new THREE.MeshStandardMaterial({map:paperTex(900,145,[{t:'جعبه ابزار شیمی · استان همدان',size:40,y:36,weight:600,color:'#44566a'},{t:'تهیه‌کننده: '+(meta.author||'—'),size:62,y:102}]),roughness:.7}));
  plaque.position.set(0,5.6,-6.45);scene.add(plaque);
  // رک لوله آزمایش
  const wood=new THREE.MeshPhysicalMaterial({map:WOOD_T,roughness:.55,clearcoat:.3,clearcoatRoughness:.5,envMapIntensity:.8});   // چوب لاک‌خورده
  const shape=new THREE.Shape();
  shape.moveTo(-2.1,-.7);shape.lineTo(2.1,-.7);shape.lineTo(2.1,.7);shape.lineTo(-2.1,.7);shape.closePath();
  SLOT_X.forEach(x=>{const h=new THREE.Path();h.absarc(x,0,TR+.03,0,TAU,true);shape.holes.push(h);});
  const tg=new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:2,curveSegments:28});
  tg.rotateX(-Math.PI/2);
  const top=new THREE.Mesh(tg,wood);top.position.y=1.6;
  const bot=new THREE.Mesh(new THREE.BoxGeometry(4.2,.12,1.4),wood);bot.position.y=.06;
  const l1=new THREE.Mesh(new THREE.BoxGeometry(.14,1.72,1.4),wood),l2=l1.clone();
  l1.position.set(-2.03,.86,0);l2.position.set(2.03,.86,0);
  const rack=new THREE.Group();world.rack=rack;scene.add(rack);   // نگه‌دارندهٔ لوله؛ با گزینهٔ rack:false در تب مخفی می‌شود
  [top,bot,l1,l2].forEach(m=>{m.castShadow=true;m.receiveShadow=true;rack.add(m);});
  addBlob(rack,0,0,5.6,2.4,.35);
}


/* ================= دوربین ================= */
export const CAMS={
  overview:{p:[.3,4,12.8],t:[.2,1.7,.6]},
  rack:{p:[0,3,8.4],t:[0,1.9,0]},
  tube1:{p:[-.6,2.4,4.7],t:[-1,1.3,0]},
  tube3:{p:[1.5,2.4,4.7],t:[1.2,1.3,0]},
  left:{p:[-3,2.8,7],t:[-3.7,.5,1.7]},
  top:{p:[0,12.5,4.4],t:[0,0,.6]}
};
export const camState={auto:true};
export const distMul=()=>world.camera.aspect<1.2?1+(1.2-world.camera.aspect)*1.5:1;
export function camTo(name,dur=1.5,force=false){
  const {camera,controls}=world;
  if(!camState.auto&&!force)return Promise.resolve();
  const c=CAMS[name],t1=v3(...c.t),p1=t1.clone().add(v3(...c.p).sub(t1).multiplyScalar(distMul()));
  const p0=camera.position.clone(),t0=controls.target.clone();
  return tween(dur,k=>{camera.position.lerpVectors(p0,p1,k);controls.target.lerpVectors(t0,t1,k);});
}

export function resize(){
  const {renderer,camera}=world;
  const w=innerWidth,h=innerHeight;
  renderer.setSize(w,h);camera.aspect=w/h;
  const panel=$('#panel');
  if(w>900)camera.setViewOffset(w,h,panel.offsetWidth/2+6,0,w,h);
  else camera.setViewOffset(w,h,0,panel.offsetHeight/2,w,h);
  camera.updateProjectionMatrix();
}
