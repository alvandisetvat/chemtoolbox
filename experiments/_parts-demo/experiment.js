/* نمایش و آزمون خودکار قطعه‌های هسته. نمونهٔ استفاده از هر قطعه برای دبیران. */
import {
  v3,tween,sleep,lin,C,S,world,CAMS,
  makeBeaker,makeCylinder,cylML,cylSetML,cylLevel,pourWater,camTo,hud,showAns,WATER,
  makeFunnel,filterInto,makeCanister,popLid,
  makeThermometer,dipThermometer,liftThermometer,makeBalance,weighOn,takeOff,
  makeBurner,setFlame,makeTripod,addBoiling,makeConductivityTester
} from '../../core/api.js';

CAMS.left={p:[-4.5,4.2,8.5],t:[-4,1.4,0]};
CAMS.right={p:[5.5,4.4,9.5],t:[5.5,1.4,0]};

function setup(){
  S.cyl=makeCylinder(-6.2,.4,{ml:100,label:'۱۰۰ mL'});
  S.fun=makeFunnel(-3.6,0,{y0:2.1});
  S.cup=makeBeaker(-3.6,0);
  S.bal=makeBalance(.4,1.4);
  S.th=makeThermometer(-2.6,3.4);
  S.tri=makeTripod(3.4,0);
  S.burner=makeBurner(3.4,0);
  S.beaker=makeBeaker(3.4,0);S.beaker.group.position.y=S.tri.topY+.03;
  S.can=makeCanister(.5,-1.4);
  S.tester=makeConductivityTester(7.6,-.6);
  S.cond=makeBeaker(7.6,-.6);
}
function steps(){return [
  {tag:'۱',text:'استوانهٔ مدرج را تا ۶۰ میلی‌لیتر پر کنید.',run:async()=>{
    await camTo('left');await cylSetML(S.cyl,60,WATER,0,2);hud('خوانش: '+Math.round(cylML(S.cyl))+' mL');
    S.cyl.suspend(0,0xffffff);await sleep(.4);
  }},
  {tag:'۲',text:'صاف‌کردن با قیف.',run:async()=>{
    await camTo('left');await filterInto(S.fun,S.cup,{amount:.7,color:new C(0xcfe8f5),alpha:.1,residueHex:0x8a5a2b,dur:3});
  }},
  {tag:'۳',text:'وزن‌کردن روی ترازو.',run:async()=>{
    await camTo('overview');S.bal.setMass(0);await weighOn(S.bal,S.can.group,12.4,{dur:1.2});
    await takeOff(S.bal,S.can.group,v3(.5,0,-1.4));S.bal.clear();
  }},
  {tag:'۴',text:'چراغ بونزن و جوشش.',run:async()=>{
    await camTo('right');
    await setFlame(S.burner,{on:true,air:0},1);await setFlame(S.burner,{air:1},1.2);
    S.beaker.addLiquid(.9,WATER,0);S.boil=addBoiling(S.beaker);
    await dipThermometer(S.th,S.beaker,25,{T0:25,dur:.5});
    await tween(2,k=>{S.th.setTemp(25+75*k);S.boil.set(k);},lin);
    await liftThermometer(S.th);await setFlame(S.burner,{on:false},1);S.boil.set(0);
  }},
  {tag:'۵',text:'رسانایی محلول (LED).',run:async()=>{
    await camTo('right');S.cond.addLiquid(.9,new C(0xbfe0ff),.2);
    await S.tester.lower(1.2);await S.tester.glowTo(1,.6);await sleep(.4);await S.tester.glowTo(0,.4);await S.tester.raise(1);
  }},
  {tag:'۶',text:'قوطی فیلم و پرتاب درپوش.',run:async()=>{
    await camTo('overview');S.can.setLiquid(.35);await popLid(S.can,{pop:true,dur:1});
    showAns('پایان','همهٔ قطعه‌ها اجرا شدند.');
  }}
];}
export default {cameras:[['overview','نمای کلی'],['left','چپ'],['right','راست']],tabs:[{id:'main',title:'قطعه‌ها',camera:'overview',rack:false,dropper:false,setup,steps}]};
