import {THREE,$,TAU,V3,V2,C,clamp,lerp,rnd,v3,easeIO,easeOut,lin,fa,FONT,world,tweens,tween,sleep,moveTo} from './kernel.js';
/* ================= جریان، قطره و ذرات ریز ================= */
export const stream=new THREE.Mesh(new THREE.CylinderGeometry(1.15,.62,1,14,1,true),new THREE.MeshStandardMaterial({color:0xcfe8f5,transparent:true,opacity:.55,roughness:.1,depthWrite:false}));
stream.renderOrder=7;stream.visible=false;
export function setStream(x,yt,yb,z,r=.028,color=null,op=.55){
  const w=1+.07*Math.sin(performance.now()*.031)+.04*Math.sin(performance.now()*.017);   // جریان کمی نوسان دارد و پایین‌تر باریک می‌شود
  stream.visible=true;stream.position.set(x,(yt+yb)/2,z);stream.scale.set(r*w,Math.max(.01,yt-yb),r*w);
  if(color)stream.material.color.copy(color);stream.material.opacity=op;
  if(Math.random()<.45)spawnSplash(x,yb,z,color||stream.material.color);
}
/* پاشش ریز هنگام برخورد جریان با سطح مایع */
const SPL=[],splGeo=new THREE.SphereGeometry(1,6,5),splGroup=new THREE.Group();
function spawnSplash(x,y,z,col){
  if(SPL.length>40)return;
  const m=new THREE.Mesh(splGeo,new THREE.MeshStandardMaterial({color:col,transparent:true,opacity:.6,roughness:.05,depthWrite:false}));
  const r=rnd(.008,.017),a=rnd(0,TAU),sp=rnd(.12,.5);m.scale.setScalar(r);m.position.set(x,y,z);m.renderOrder=8;
  splGroup.add(m);SPL.push({m,vx:Math.cos(a)*sp,vz:Math.sin(a)*sp,vy:rnd(.5,1.5),y0:y,life:0});
}
function updateSplash(dt){
  for(let i=SPL.length-1;i>=0;i--){
    const s=SPL[i];s.vy-=9*dt;s.life+=dt;
    s.m.position.x+=s.vx*dt;s.m.position.z+=s.vz*dt;s.m.position.y+=s.vy*dt;s.m.material.opacity=Math.max(0,.6*(1-s.life/.45));
    if(s.m.position.y<s.y0||s.life>.45){splGroup.remove(s.m);s.m.material.dispose();SPL.splice(i,1);}
  }
}
/* جریان مستقل (برای چند ریختن همزمان): {set(x,yTop,yBottom,z,r,color,op), hide()} */
export function makeStream(){
  const m=new THREE.Mesh(stream.geometry,stream.material.clone());m.renderOrder=7;m.visible=false;world.scene.add(m);
  return {mesh:m,
    set(x,yt,yb,z,r=.03,color=null,op=.55){
      const w=1+.07*Math.sin(performance.now()*.031+x)+.04*Math.sin(performance.now()*.017);
      m.visible=true;m.position.set(x,(yt+yb)/2,z);m.scale.set(r*w,Math.max(.01,yt-yb),r*w);
      if(color)m.material.color.copy(color);m.material.opacity=op;
      if(Math.random()<.45)spawnSplash(x,yb,z,color||m.material.color);
    },
    hide(){m.visible=false;}};
}
export const dropMesh=new THREE.Mesh(new THREE.SphereGeometry(.045,14,12),new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.8,roughness:.05}));
dropMesh.visible=false;dropMesh.renderOrder=8;
export const debrisGroup=new THREE.Group();
export const debris=[];
export const debrisGeo=new THREE.BoxGeometry(.035,.02,.035),debrisMat=new THREE.MeshStandardMaterial({color:0x9a4c1a,roughness:1});
export function spawnDebris(p,n=1){
  for(let i=0;i<n;i++){
    const m=new THREE.Mesh(debrisGeo,debrisMat.clone());
    m.material.color.setHex([0x9a4c1a,0xb8651f,0x6b3513,0xc9792a][i%4]);
    m.position.set(p.x+rnd(-.05,.05),p.y,p.z+rnd(-.05,.05));m.rotation.set(rnd(0,3),rnd(0,3),rnd(0,3));
    m.scale.setScalar(rnd(.6,1.6));m.castShadow=true;
    debrisGroup.add(m);debris.push({m,vy:rnd(-.3,0),landed:false,vx:rnd(-.2,.2)});
  }
}
export function updateDebris(dt){
  updateSplash(dt);
  for(const d of debris){
    if(d.landed)continue;
    d.vy-=12*dt;d.m.position.y+=d.vy*dt;d.m.position.x+=d.vx*dt;
    if(d.m.position.y<=.018){d.m.position.y=.018;d.landed=true;}
  }
}
export function clearDebris(){
  while(debrisGroup.children.length){const c=debrisGroup.children[0];debrisGroup.remove(c);c.material.dispose();}
  debris.length=0;
}

export function initFx(){world.scene.add(stream,dropMesh,debrisGroup,splGroup);}
