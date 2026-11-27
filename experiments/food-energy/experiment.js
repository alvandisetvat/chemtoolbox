/* «اثر نوع و مقدار ماده بر انرژی آن» — شیمی ۲ (یازدهم)، فصل ۲، کاوش کنید
   سوزاندن مغز گردو (۱ و ۲ گرم) و ماکارونی (۲ گرم) زیر لولهٔ حاوی ۶۰ mL آب و اندازه‌گیری تغییر دما.
   مرجع API: docs/LAB-API.md */
import {
  v3,C,lerp,lin,easeOut,sleep,tween,moveTo,fa,
  S,makeTube,CAMS,WATER,
  makeClampStand,makeBurner,setFlame,makeBalance,weighOn,takeOff,makeThermometer,dipThermometer,liftThermometer,makeFood,makeTongs,
  camTo,hud,showAns,ansStep,pourWater
} from '../../core/api.js';

CAMS.main={p:[-.4,3.8,10.5],t:[-.8,1.9,.3]};
CAMS.close={p:[.3,2.7,6.4],t:[0,1.8,.3]};
CAMS.bench={p:[3.4,3.4,5.6],t:[3.4,.7,.8]};

const TUBE_Y=1.45;                 // ارتفاع ته لوله از میز
const BURN=v3(-3.6,2.35,.9);       // جای نگه‌داشتن نمونه در شعلهٔ چراغ
/* دماهای نمونه (°C) و جرم‌ها؛ داده‌های نمونهٔ شبیه‌سازی (در آزمایش واقعی اندازه می‌گیرند) */
const TRIALS=[
  {k:1,kind:'nut',pieces:1,g:1,name:'یک گرم مغز گردو',T0:24,T1:36,dur:3.6},
  {k:2,kind:'nut',pieces:2,g:2,name:'دو گرم مغز گردو',T0:25,T1:49,dur:5.6},
  {k:3,kind:'pasta',pieces:2,g:2,name:'دو گرم ماکارونی',T0:24,T1:38,dur:4.2}
];
const DONE={};
const tableHTML=()=>'<table style="width:100%;text-align:center;border-collapse:collapse;font-size:.92em"><tr><td>شمارهٔ آزمایش</td><td>مادهٔ غذایی</td><td>دمای آغازی آب (°C)</td><td>دمای پایانی آب (°C)</td></tr>'
 +TRIALS.map(t=>`<tr><td>${fa(t.k)}</td><td>${t.name}</td><td>${fa(t.T0)}</td><td>${DONE[t.k]?fa(t.T1):'—'}</td></tr>`).join('')
 +'</table><small>عددها نمونه‌اند؛ در آزمایش واقعی بسته به نمونه کمی تفاوت دارند.</small>';
const SAFETY='عینک ایمنی بزنید و نکات ایمنی کار با چراغ بونزن را رعایت کنید: موی بلند را ببندید و مواد قابل‌اشتعال را از شعله دور نگه دارید.';

function setup(){
  S.stand=makeClampStand(0,-2.7,{ringAt:v3(0,3.0,2.7),height:4.6,ringR:.44});S.stand.show(false);
  S.tube=makeTube(1,'','',false);
  S.tube.group.scale.set(1.5,1,1.5);S.tube.group.position.set(0,TUBE_Y+4.2,0);S.tube.innerR=.26;
  S.burner=makeBurner(-3.6,.9);
  S.bal=makeBalance(3.4,1.0,{dish:true});
  S.th=makeThermometer(-3.4,3.8);
  S.tongs=makeTongs();S.tongs.group.position.set(-1.9,.05,3.0);
  S.food=null;S.samples={};
  S.samples.nut1=makeFood('nut',1);S.samples.nut2=makeFood('nut',2);S.samples.pasta=makeFood('pasta',2);
  S.samples.nut1.group.position.set(1.4,.06,2.5);S.samples.nut2.group.position.set(2.1,.06,2.7);S.samples.pasta.group.position.set(2.9,.06,2.7);
  for(const f of Object.values(S.samples))f.group.rotation.y=.4;
  S.ready=false;
}
async function readInitial(T0){
  await camTo('close');
  await dipThermometer(S.th,S.tube,T0,{T0:22,dur:1.6});
  hud(`دمای آغازی آب: ${fa(T0)}°C`);await sleep(.9);hud('');
}
/* نمونه را وزن می‌کند، با انبر در شعلهٔ چراغ می‌گیرد، زیر لوله می‌برد و می‌سوزاند */
async function burnTrial(tr,key){
  const food=S.samples[key],tg=S.tongs;
  await camTo('bench');
  food.group.userData.baseY=.05;
  await weighOn(S.bal,food.group,tr.g,{dur:1.3});
  hud(`جرم نمونه: ${fa(tr.g.toFixed(2).replace('.','٫'))} g`);await sleep(.7);hud('');
  /* انبر نمونه را برمی‌دارد */
  await camTo('main');
  await moveTo(tg.group,v3(food.group.position.x,.5,food.group.position.z+.5),1.2,null,.6);
  tg.hold(food);S.bal.setMass(0);
  await moveTo(tg.group,v3(BURN.x,BURN.y+1.2,BURN.z),1.4,null,.8);
  await setFlame(S.burner,{on:true,air:1},1.0);
  await moveTo(tg.group,BURN,.9);
  hud('نمونه در شعله می‌گیرد…');
  await tween(1.1,k=>tg.flame.set(.2+.55*k),lin);
  /* بلافاصله زیر لوله */
  await setFlame(S.burner,{on:false},.6);
  /* میله‌های انبر به‌سمت بالا و راست‌اند؛ پس نوک را از سمت راست و پایین‌تر از ته لوله نزدیک می‌کنیم تا میله از لوله رد نشود */
  await moveTo(tg.group,v3(1.7,BURN.y+1.2,.9),1.4,null,.4);
  await moveTo(tg.group,v3(1.7,1.1,.5),1.0);
  await camTo('close');
  await moveTo(tg.group,v3(0,TUBE_Y-.42,0),.9);
  hud('نمونه زیر لوله می‌سوزد…');
  const sz=tr.kind==='nut'?.75:.55;
  await tween(tr.dur,k=>{
    tg.flame.set(sz*(1-.7*k*k));food.char(k);
    S.th.setTemp(tr.T0+(tr.T1-tr.T0)*easeOut(Math.min(1,k*1.02)));
  },lin);
  tg.flame.set(0);
  await tween(1.2,k=>S.th.setTemp(tr.T1),lin);
  hud(`دمای پایانی آب: ${fa(tr.T1)}°C`);await sleep(1.1);hud('');
  DONE[tr.k]=true;
  await moveTo(tg.group,v3(1.7,1.1,.5),.9);
  await moveTo(tg.group,v3(-1.9,.05,3.0),1.4,null,.6);
  tg.food.group.visible=false;
  showAns(`جدول — آزمایش ${fa(tr.k)}`,tableHTML());
}
/* لوله برای آزمایش بعد: آب تازه، دماسنج دوباره به دمای آغازی */
async function freshWater(T0){
  await camTo('close');
  await liftThermometer(S.th);
  S.tube.level=0;S.tube.dirty=true;
  await pourWater(S.tube,2.0,'close');
  await dipThermometer(S.th,S.tube,T0,{T0:S.th.T,dur:1.2});
  hud(`دمای آغازی آب: ${fa(T0)}°C`);await sleep(.8);hud('');
}

const steps=()=>[
  {tag:'ایمنی',text:SAFETY,run:async()=>{await camTo('main');hud('نکتهٔ ایمنی: عینک ایمنی و دقت در کار با شعله');await sleep(1.6);hud('');}},
  {tag:'۱',text:'یک لولهٔ آزمایش بزرگ را با گیره به پایه و میله وصل کنید.',run:async()=>{
    await camTo('main');
    await moveTo(S.tube.group,v3(0,TUBE_Y,0),1.4,null,.4);
    S.stand.show(true);}},
  {tag:'۲',text:'درون آن تا ۶۰ mL آب بریزید و دمای آن را اندازه بگیرید (دماسنج با بدنه یا ته لوله تماس نداشته باشد).',run:async()=>{
    await camTo('close');
    await pourWater(S.tube,2.0,'close');
    await readInitial(TRIALS[0].T0);}},
  {tag:'۳',text:'یک گرم مغز گردو بردارید و آن را با انبر تا شعله‌ورشدن روی شعله بگیرید. بلافاصله آن را تا سوختن کامل زیر لولهٔ آزمایش نگه دارید. پس از خاموش‌شدن شعله، دمای پایانی آب را یادداشت کنید.',run:async()=>{
    await burnTrial(TRIALS[0],'nut1');}},
  {tag:'۴ (۱)',text:'آزمایش را جداگانه با دو گرم مغز گردو تکرار کنید.',run:async()=>{
    await freshWater(TRIALS[1].T0);await burnTrial(TRIALS[1],'nut2');}},
  {tag:'۴ (۲)',text:'آزمایش را با دو گرم ماکارونی تکرار کنید و جدول را کامل کنید.',run:async()=>{
    await freshWater(TRIALS[2].T0);await burnTrial(TRIALS[2],'pasta');await liftThermometer(S.th);}},
  ansStep('الف','با توجه به اینکه در آزمایش ۱ و ۲ نوع مادهٔ سوخته یکسان است، چرا تغییر دمای آب تفاوت دارد؟','main','پاسخ الف',
    'جرم گردوی سوخته در آزمایش ۲ دو برابر آزمایش ۱ است. هرچه <b>مقدار مادهٔ سوخته</b> بیشتر باشد انرژی آزادشدهٔ بیشتری به آب می‌رسد؛ پس تغییر دمای آب هم بیشتر است (تقریباً '+fa(24)+'°C در برابر '+fa(12)+'°C).'),
  ansStep('ب','با توجه به اینکه در آزمایش ۲ و ۳ مقدار مادهٔ سوخته یکسان است، چرا تغییر دمای آب تفاوت دارد؟','main','پاسخ ب',
    'در جرم یکسان، <b>نوع مادهٔ غذایی</b> متفاوت است. مغز گردو چربی و انرژی بیشتری در هر گرم دارد؛ ماکارونی عمدتاً کربوهیدرات است و در هر گرم انرژی کمتری آزاد می‌کند؛ پس آب کمتر گرم می‌شود (تقریباً '+fa(13)+'°C در برابر '+fa(24)+'°C).'+tableHTML()),
  ansStep('پ','یافته‌های خود را از این آزمایش جمع‌بندی کنید.','main','جمع‌بندی',
    'انرژی آزادشده از سوختن مواد غذایی هم به <b>نوع مادهٔ غذایی</b> و هم به <b>مقدار</b> آن بستگی دارد: با افزایش مقدار ماده، انرژی بیشتری آزاد می‌شود و مواد گوناگون در جرم یکسان انرژی متفاوتی آزاد می‌کنند.')
];

export default {
  cameras:[['main','نمای کلی'],['close','لوله'],['bench','میز']],
  tabs:[{id:'main',title:'کاوش',camera:'main',rack:false,dropper:false,setup,steps}]
};
