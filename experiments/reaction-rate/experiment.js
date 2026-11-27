/* «عوامل مؤثر بر سرعت واکنش» — شیمی ۲ (یازدهم)، کاوش کنید (صفحهٔ ۸۰ تا ۸۲)
   قوطی فیلم + قرص جوشان؛ سه آزمایش: مقدار قرص، دمای آب، سطح تماس (قرص خردشده).
   مرجع API: docs/LAB-API.md */
import {
  v3,C,sleep,fa,
  S,CAMS,WATER,
  makeCylinder,cylSetML,makeCanister,openCanister,closeCanister,flipCanister,launchCanister,canisterFizz,pourCylinderIntoCanister,
  makeThermometer,dipThermometer,liftThermometer,makeStopwatch,runStopwatch,makeTablet,makeMortar,grindTablet,pourPowder,
  moveTo,camTo,hud,showAns,ansStep,eq
} from '../../core/api.js';

CAMS.main={p:[.5,3.4,10],t:[.3,1.0,.9]};
CAMS.launch={p:[.5,3.9,11.8],t:[.3,2.2,.8]};
CAMS.close={p:[.4,2.2,6.4],t:[.3,.9,.9]};

/* زمان پرتاب (ثانیه): داده‌های نمونهٔ شبیه‌سازی؛ در آزمایش واقعی اندازه می‌گیرند.
   روند: دمای بیشتر، مقدار بیشتر و سطح تماس بیشتر ← زمان کمتر */
const ROWS=[
  {k:'1a',ex:'۱ ـ الف',amount:'نیم‌قرص',shape:'قطعه',T:0,t:55},
  {k:'1b',ex:'۱ ـ ب',amount:'ربع قرص',shape:'قطعه',T:0,t:80},
  {k:'2a',ex:'۲ ـ الف',amount:'نیم‌قرص',shape:'قطعه',T:25,t:25},
  {k:'2b',ex:'۲ ـ ب',amount:'نیم‌قرص',shape:'قطعه',T:10,t:38},
  {k:'3',ex:'۳',amount:'نیم‌قرص',shape:'پودر',T:0,t:20}
];
const DONE={};   // نتیجه‌های ثبت‌شده (با تغییر تب هم می‌ماند)
const tableHTML=()=>'<table style="width:100%;text-align:center;border-collapse:collapse;font-size:.92em"><tr><td>آزمایش</td><td>مقدار قرص</td><td>شکل قرص</td><td>دمای آب (°C)</td><td>زمان پرتاب (s)</td></tr>'
  +ROWS.map(r=>`<tr><td>${r.ex}</td><td>${r.amount}</td><td>${r.shape}</td><td>${fa(r.T)}</td><td>${DONE[r.k]?fa(r.t):'—'}</td></tr>`).join('')
  +'</table><small>عددها نمونه‌اند؛ در آزمایش واقعی بسته به قرص و محیط کمی تفاوت دارند.</small>';
const COLOR=T=>T<=12?new C(0xcfe6f7):new C(0xdcefff);

function setup(n){
  S.cyl=makeCylinder(3.7,.6,{ml:10,label:'۱۰ mL'});
  newCanister();
  S.th=makeThermometer(-3.0,3.6);
  S.sw=makeStopwatch(-3.4,1.5);
  S.tabs={};
  S.tabs.half=makeTablet(-1.7,1.9,{piece:'half'});
  if(n===0)S.tabs.quarter=makeTablet(-1.0,1.9,{piece:'quarter'});
  if(n===2){S.mortar=makeMortar(-3.3,-1.2);}
}
function newCanister(){
  if(S.can){S.can.group.visible=false;if(S.can.lid2)S.can.lid2.visible=false;}
  S.can=makeCanister(.4,.8);canisterFizz(S.can);
}

/* آماده‌کردن ۵ میلی‌لیتر آب با دمای T و ریختن آن در قوطی (قوطی باز می‌شود) */
async function water(T){
  await camTo('main');
  await cylSetML(S.cyl,5,COLOR(T),.05,1.2);
  await dipThermometer(S.th,S.cyl,T,{T0:22,dur:1.6});
  hud(`دمای آب: ${fa(T)}°C`);await sleep(.5);
  await liftThermometer(S.th);hud('');
  await openCanister(S.can);
  await camTo('close');
  await pourCylinderIntoCanister(S.cyl,S.can,{color:COLOR(T),h:.3});
}
/* قرص را در قوطی می‌اندازد، درپوش را می‌بندد و قوطی را وارونه می‌گذارد */
async function addTabletAndFlip(piece){
  await camTo('close');
  const t=S.tabs[piece],p=S.can.group.position;
  await moveTo(t.group,v3(p.x,1.9,p.z),1.0,null,.6);
  await moveTo(t.group,v3(p.x,.2,p.z),.5);
  t.group.visible=false;
  S.can.fizzSet(true,false);
  await closeCanister(S.can);
  await flipCanister(S.can);
  S.can.fizzSet(true,true);
}
async function addPowderAndFlip(){
  await camTo('close');
  await pourPowder(S.mortar,S.can);
  S.can.fizzSet(true,false);
  await closeCanister(S.can);
  await flipCanister(S.can);
  S.can.fizzSet(true,true);
}
/* زمان‌سنج را راه می‌اندازد تا قوطی پرتاب شود و نتیجه را در جدول می‌نویسد */
async function timeLaunch(row){
  await camTo('launch');
  hud('زمان‌سنج روشن شد…');
  await runStopwatch(S.sw,row.t,{speed:15});
  await launchCanister(S.can,{peak:3.6});
  hud(`زمان پرتاب: ${fa(row.t)} s`);
  DONE[row.k]=true;
  await sleep(.9);
  showAns('جدول ثبت زمان‌ها',tableHTML());
  hud('');
}
const row=k=>ROWS.find(r=>r.k===k);

const SAFETY='عینک ایمنی بزنید و به‌دلیل پرتاب‌شدن قوطی، آزمایش را در فاصلهٔ مناسبی از خود و هم‌کلاسی‌ها انجام دهید.';

const steps1=()=>[
  {tag:'ایمنی',text:SAFETY,run:async()=>{await camTo('main');hud('نکتهٔ ایمنی: عینک ایمنی و فاصلهٔ مناسب');await sleep(1.6);hud('');}},
  {tag:'الف',text:'درون قوطی فیلم عکاسی ۵ میلی‌لیتر آب با دمای ۰°C بریزید.',run:async()=>{await water(0);}},
  {tag:'ب',text:'نیم‌قرص جوشان بیفزایید و بلافاصله درپوش را محکم ببندید؛ سپس قوطی را وارونه روی زمین قرار دهید.',run:async()=>{await addTabletAndFlip('half');}},
  {tag:'پ',text:'زمان لازم برای پرتاب‌شدن قوطی را با زمان‌سنج اندازه بگیرید و در جدول یادداشت کنید.',run:async()=>{await timeLaunch(row('1a'));}},
  {tag:'ت',text:'همین آزمایش را با ربع قرص جوشان تکرار کنید و زمان را یادداشت کنید.',run:async()=>{
    newCanister();S.sw.reset();await water(0);await addTabletAndFlip('quarter');await timeLaunch(row('1b'));}},
  ansStep('نتیجه','از مشاهده‌های خود چه نتیجه‌ای می‌گیرید؟','main','نتیجه',
    'با <b>نیم‌قرص</b> (مقدار واکنش‌دهندهٔ بیشتر) قوطی در زمان <b>کوتاه‌تری</b> پرتاب شد تا با ربع قرص. پس با <b>افزایش مقدار واکنش‌دهنده</b> سرعت واکنش بیشتر می‌شود و گاز CO₂ سریع‌تر تولید و فشار درون قوطی زودتر زیاد می‌شود.')
];
const steps2=()=>[
  {tag:'ایمنی',text:SAFETY,run:async()=>{await camTo('main');hud('نکتهٔ ایمنی: عینک ایمنی و فاصلهٔ مناسب');await sleep(1.6);hud('');}},
  {tag:'الف',text:'این بار درون قوطی فیلم عکاسی ۵ میلی‌لیتر آب با دمای ۲۵°C بریزید.',run:async()=>{await water(25);}},
  {tag:'ب',text:'نیم‌قرص جوشان بیفزایید و بلافاصله درپوش را محکم ببندید؛ سپس قوطی را وارونه روی زمین قرار دهید.',run:async()=>{await addTabletAndFlip('half');}},
  {tag:'پ',text:'زمان پرتاب‌شدن قوطی را اندازه بگیرید و در جدول یادداشت کنید.',run:async()=>{await timeLaunch(row('2a'));}},
  {tag:'ت',text:'این آزمایش را در دمای ۱۰°C تکرار کنید و نتیجه را در جدول بنویسید.',run:async()=>{
    newCanister();S.sw.reset();S.tabs.half.group.visible=true;S.tabs.half.group.position.set(-1.7,.06,1.9);
    await water(10);await addTabletAndFlip('half');await timeLaunch(row('2b'));}},
  ansStep('نتیجه','از مشاهده‌های خود چه نتیجه‌ای می‌گیرید؟','main','نتیجه',
    'در آب <b>گرم‌تر</b> (۲۵°C) قوطی در زمان <b>کوتاه‌تری</b> پرتاب شد تا در آب سردتر (۱۰°C). پس با <b>افزایش دما</b> سرعت واکنش بیشتر می‌شود.')
];
const steps3=()=>[
  {tag:'ایمنی',text:SAFETY,run:async()=>{await camTo('main');hud('نکتهٔ ایمنی: عینک ایمنی و فاصلهٔ مناسب');await sleep(1.6);hud('');}},
  {tag:'الف',text:'نیمی از قرص را به‌خوبی در هاون چینی بسایید.',run:async()=>{await camTo('main');await grindTablet(S.mortar,S.tabs.half,{dur:3});}},
  {tag:'ب',text:'آن را به درون قوطی فیلم محتوی ۵ میلی‌لیتر آب با دمای ۰°C بیفزایید و بلافاصله درپوش را محکم ببندید؛ سپس قوطی را وارونه روی زمین قرار دهید.',run:async()=>{
    await water(0);await addPowderAndFlip();}},
  {tag:'پ',text:'زمان پرتاب‌شدن قوطی را اندازه بگیرید و در جدول یادداشت کنید.',run:async()=>{await timeLaunch(row('3'));}},
  ansStep('نتیجه','از مشاهده‌های خود چه نتیجه‌ای می‌گیرید؟','main','نتیجه',
    'قرص <b>خردشده</b> (سطح تماس بیشتر) در همان دمای ۰°C قوطی را در زمان <b>کوتاه‌تری</b> پرتاب کرد تا نیم‌قرص سالم. پس با <b>افزایش سطح تماس</b> سرعت واکنش بیشتر می‌شود.'),
  ansStep('جمع‌بندی','یافته‌های خود را از این آزمایش‌ها جمع‌بندی کنید و در چند سطر بنویسید.','main','جمع‌بندی',
    'انجام آزمایش‌های بالا نشان داد که با <b>افزایش دما</b>، <b>افزایش مقدار واکنش‌دهنده‌ها</b> و <b>افزایش سطح تماس</b> می‌توان سرعت انجام واکنش‌ها را افزایش داد.'
    +eq('NaHCO<sub>3</sub>(aq) + H<sup>+</sup>(aq) → CO<sub>2</sub>(g) + H<sub>2</sub>O(l) + Na<sup>+</sup>(aq)')
    +tableHTML())
];

export default {
  cameras:[['main','نمای کلی'],['close','نزدیک'],['launch','پرتاب']],
  tabs:[
    {id:'exp1',title:'آزمایش ۱',subtitle:'مقدار قرص',camera:'main',rack:false,dropper:false,setup:()=>setup(0),steps:steps1},
    {id:'exp2',title:'آزمایش ۲',subtitle:'دمای آب',camera:'main',rack:false,dropper:false,setup:()=>setup(1),steps:steps2},
    {id:'exp3',title:'آزمایش ۳',subtitle:'سطح تماس',camera:'main',rack:false,dropper:false,setup:()=>setup(2),steps:steps3}
  ]
};
