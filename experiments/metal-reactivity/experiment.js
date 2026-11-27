/* «کدام فلز واکنش‌پذیرتر است؟» — شیمی ۲ (یازدهم)، فصل ۱، کاوش کنید (۲)
   میخ آهنی در محلول مس (II) سولفات ← مس رسوب می‌کند. مرجع API: docs/LAB-API.md */
import {
  THREE,C,v3,lerp,lin,easeOut,sleep,tween,moveTo,
  S,placeJar,addToBench,CAMS,SPECIES,PRECIPITATE,
  makeBeaker,beakerLevel,makeStirRod,stirBeaker,scoopInto,pourWater,
  camTo,hud,eq,ansStep
} from '../../core/api.js';

CAMS.beaker={p:[-.6,3.2,7.2],t:[-1.0,1.1,.6]};
CAMS.close={p:[-.9,2.1,4.9],t:[-1.2,.9,.6]};

const BX=-1.2,BZ=.6;
const CU=PRECIPITATE.Cu, BLUE=new C(SPECIES.CuSO4.sol), PALE=new C(0xcfe6c4);

/* میخ آهنی تمیز + لایهٔ مس روی بخش درون محلول */
function makeIronNail(){
  const g=new THREE.Group();
  const steel=new THREE.MeshStandardMaterial({color:0xb9bec6,roughness:.32,metalness:.9});
  const shank=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.5,12),steel);
  const head=new THREE.Mesh(new THREE.CylinderGeometry(.1,.09,.05,18),steel);head.position.y=.77;
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.04,.2,12),steel);tip.position.y=-.85;tip.rotation.x=Math.PI;
  const copper=new THREE.MeshStandardMaterial({color:CU,roughness:.55,metalness:.6,transparent:true,opacity:0});
  const coat=new THREE.Mesh(new THREE.CylinderGeometry(.052,.052,.75,12),copper);coat.position.y=-.38;
  const coatTip=new THREE.Mesh(new THREE.ConeGeometry(.052,.2,12),copper);coatTip.position.y=-.85;coatTip.rotation.x=Math.PI;
  g.add(shank,head,tip,coat,coatTip);g.traverse(o=>{o.castShadow=true;});
  g.userData.copper=copper;
  addToBench(g);return g;
}

function setup(){
  S.jar=placeJar('CuSO4',-4.1);
  S.rod=makeStirRod();
  S.nails=[];
  for(let i=0;i<2;i++){const n=makeIronNail();n.position.set(2.6+i*.55,.06,2.4);n.rotation.z=Math.PI/2;S.nails.push(n);}
}

function steps(){
  return [
    {tag:'۱ (۱)',text:'درون بشری تا یک‌سوم حجم آن آب بریزید.',run:async()=>{
      await camTo('beaker');
      const b=S.beaker=makeBeaker(BX,BZ);
      b.group.position.y=5.8;
      await tween(.9,k=>{b.group.position.y=lerp(5.8,0,k);},easeOut);
      await pourWater(b,beakerLevel(b,80),'beaker');
    }},
    {tag:'۱ (۲)',text:'نصف قاشق چای‌خوری مس (II) سولفات به آن بیفزایید و آن را هم بزنید تا محلول آبی‌رنگ به‌دست آید.',run:async()=>{
      const b=S.beaker;
      await scoopInto(S.jar,b,SPECIES.CuSO4.powder,120,v3(-4.1,.11,1.8));
      await camTo('beaker');
      const n0=b.solid.count,c0=b.color.clone(),a0=b.alpha;
      hud('در حال هم زدن…');
      await stirBeaker(b,S.rod,3.4,k=>{
        const e=k*k*(3-2*k);
        b.solid.setActive(n0*Math.pow(1-e,1.5));
        b.color.lerpColors(c0,BLUE,e);b.alpha=lerp(a0,SPECIES.CuSO4.solA,e);
      });
      b.solid.setActive(0);b.color.copy(BLUE);b.alpha=SPECIES.CuSO4.solA;hud('');
      await sleep(.4);
    }},
    {tag:'۲',text:'دو عدد میخ آهنی درون بشر بیندازید و مدتی صبر کنید.',run:async()=>{
      const b=S.beaker;
      await camTo('overview');
      const spots=[[BX+.12,.82,BZ+.1,.3],[BX-.18,.82,BZ-.12,-.26]];
      for(let i=0;i<2;i++){
        const n=S.nails[i],s=spots[i];
        await moveTo(n,v3(n.position.x,3.4,n.position.z),.7,{x:0,y:0,z:0},.3);
        await moveTo(n,v3(s[0],2.9,s[2]),.9,{x:0,y:0,z:0});
        await moveTo(n,v3(s[0],s[1],s[2]),.7,{x:0,y:0,z:s[3]});
      }
      await camTo('close');
      hud('چند دقیقه بعد…');
      const c0=b.color.clone(),a0=b.alpha,m=[S.nails[0].userData.copper,S.nails[1].userData.copper];
      let em=0;
      await tween(7,k=>{
        const e=k*k*(3-2*k);
        b.color.lerpColors(c0,PALE,e);b.alpha=lerp(a0,.4,e);
        m[0].opacity=m[1].opacity=Math.min(1,e*1.6);
        const want=Math.floor(k*460);
        if(want>em){b.precip.spawn(want-em,b.level-.05,.4,CU,-.22);em=want;}
      },lin);
      b.precipColor.setHex(CU);
      hud('');
      await sleep(1);
    }},
    ansStep('۳','مشاهده‌های خود را بنویسید.','close','مشاهده‌ها',
      'پس از مدتی، رنگ <b>آبی</b> محلول کم‌رنگ می‌شود (به سبز بسیار کم‌رنگ). روی میخ آهنی لایه‌ای <b>قهوه‌ای مایل به قرمز</b> (فلز مس) می‌نشیند و کمی مس به‌شکل ذره‌های قرمز‌قهوه‌ای ته بشر ته‌نشین می‌شود.'),
    ansStep('۴','اگر فراورده‌های واکنش انجام‌شده فلز مس و محلول آهن (II) سولفات باشند، معادلهٔ نمادی واکنش را بنویسید.','close','معادلهٔ واکنش',
      eq('Fe(s) + CuSO<sub>4</sub>(aq) → Cu(s) + FeSO<sub>4</sub>(aq)')
      +'<small>معادلهٔ یونی: Fe(s) + Cu²⁺(aq) → Fe²⁺(aq) + Cu(s)</small>'),
    ansStep('۵','از این آزمایش چه نتیجه‌ای می‌گیرید؟','close','نتیجه',
      'فلز آهن توانست یون‌های مس (Cu²⁺) را از محلول جدا کند و خودش به یون آهن (II) تبدیل شود؛ یعنی آهن در واکنش <b>جانشین مس</b> در ترکیب شد و مس به‌صورت فلز رسوب کرد.'),
    ansStep('۶','به نظر شما کدام فلز واکنش‌پذیرتر است؟ برای درستی دلیل خود، شواهد تجربی ارائه کنید.','close','پاسخ',
      '<b>آهن</b> واکنش‌پذیرتر از <b>مس</b> است. <b>شواهد:</b> آهن، مس را از محلول مس (II) سولفات خارج می‌کند: رنگ آبی محلول کم‌رنگ می‌شود (یون Cu²⁺ مصرف می‌شود) و فلز مس قهوه‌ای‌قرمز روی میخ و ته بشر دیده می‌شود. در مقابل، اگر مس را در محلول آهن (II) سولفات بگذاریم واکنشی رخ نمی‌دهد.')
  ];
}

export default {
  cameras:[['overview','نمای کلی'],['beaker','بشر'],['close','نزدیک'],['top','از بالا']],
  tabs:[{id:'main',title:'کاوش',camera:'overview',rack:false,dropper:false,setup,steps}]
};
