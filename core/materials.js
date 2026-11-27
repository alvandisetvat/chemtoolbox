import {THREE,$,TAU,V3,V2,C,clamp,lerp,rnd,v3,easeIO,easeOut,lin,fa,FONT,world,tweens,tween,sleep,moveTo} from './kernel.js';
import {BLOB,PLASTIC_BUMP,GLASS_IMP} from './textures.js';
/* ================= مصالح مشترک ================= */
const mkFres=(a0,a1)=>new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,
  uniforms:{c:{value:new C(0x2f4a52)}},
  vertexShader:`varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform vec3 c;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),1.5);gl_FragColor=vec4(c,${a0.toFixed(3)}+${a1.toFixed(3)}*f);#include <tonemapping_fragment>
#include <colorspace_fragment>
}`
});
export const glassFres=mkFres(.10,.78);
export const glassFresThin=mkFres(.05,.5);   // بشر و استوانه: جدارهٔ شفاف‌تر
export const glassRefl=new THREE.MeshStandardMaterial({
  color:0x000000,roughness:1,roughnessMap:GLASS_IMP,metalness:0,transparent:true,blending:THREE.AdditiveBlending,
  side:THREE.DoubleSide,depthWrite:false,envMapIntensity:2.8
});
/* مایع: سطح آزاد می‌تواند با لختی کج شود (شیب سطح uTilt، فقط بالای مایع جابه‌جا می‌شود و دیواره‌ها را قطع نمی‌کند) */
export function liquidMat(){
  const m=new THREE.MeshStandardMaterial({color:0xdff3ff,transparent:true,opacity:.32,roughness:.05,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:1.0});
  const u={uTilt:{value:new V2(0,0)},uLv:{value:1},uFl:{value:0}};
  m.userData.liq=u;
  m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,u);
    sh.vertexShader='uniform vec2 uTilt;uniform float uLv;uniform float uFl;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      'vec3 transformed=vec3(position);float hf=clamp((position.y-uFl)/max(uLv-uFl,.01),0.,1.);transformed.y+=(position.x*uTilt.x+position.z*uTilt.y)*hf*hf;');
  };
  m.customProgramCacheKey=()=>'liqtilt';
  return m;
}
/* لختی مایع: شتاب افقی ظرف، سطح را با یک فنر میرا کج می‌کند (مایع از حرکت ظرف عقب می‌ماند و سپس نوسان می‌کند) */
export class Slosh{
  constructor(max=.12){this.max=max;this.bias=[0,0];this.p=null;this.v=[0,0];this.th=[0,0];this.w=[0,0];}
  step(dt,group,mat,level,floor=0){
    if(!dt||!mat||!mat.userData.liq)return;
    dt=Math.min(dt,.05);const pos=group.position;
    if(!this.p){this.p=[pos.x,pos.z];return;}
    const vx=(pos.x-this.p[0])/dt,vz=(pos.z-this.p[1])/dt;this.p=[pos.x,pos.z];
    const a=[(vx-this.v[0])/dt,(vz-this.v[1])/dt];this.v=[vx,vz];
    const K=55,Cd=3.2,G=.02;let moving=false;
    for(let i=0;i<2;i++){
      const ac=Math.max(-40,Math.min(40,a[i]));
      this.w[i]+=(-K*this.th[i]-Cd*this.w[i]-(i===0?G:-G)*ac)*dt;
      this.th[i]=Math.max(-this.max,Math.min(this.max,this.th[i]+this.w[i]*dt));
      if(Math.abs(this.th[i])>1e-4||Math.abs(this.w[i])>1e-3)moving=true;else this.th[i]=this.w[i]=0;
    }
    const u=mat.userData.liq;u.uTilt.value.set(this.th[0]+this.bias[0],this.th[1]+this.bias[1]);u.uLv.value=level;u.uFl.value=floor;
  }
}

export const mesh=(g,m,ro=0)=>{const x=new THREE.Mesh(g,m);x.renderOrder=ro;return x;};
export const lathe=(pts,seg=40)=>new THREE.LatheGeometry(pts.map(([x,y])=>new V2(Math.max(x,.0001),y)),seg);
export function bumpy(geo,amp){
  const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const n=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453, f=(n-Math.floor(n))-.5;
    const s=1+f*amp;p.setXYZ(i,x*s,y*s,z*s);
  }
  geo.computeVertexNormals();return geo;
}
export function addBlob(parent,x,z,sx,sz,op=.5){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:BLOB,transparent:true,opacity:op,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.set(x,.006,z);m.scale.set(sx,sz,1);parent.add(m);return m;
}


/* پلاستیک با دانهٔ ریز و بازتاب ملایم */
export const plastic=(color,roughness=.5)=>new THREE.MeshStandardMaterial({color,roughness,metalness:.02,bumpMap:PLASTIC_BUMP,bumpScale:.35,envMapIntensity:.7});
