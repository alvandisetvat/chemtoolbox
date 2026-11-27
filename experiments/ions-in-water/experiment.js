/* «وجود برخی یون‌ها در آب» — شیمی ۱ (دهم)، فصل ۳، کاوش کنید (صفحهٔ ۸۹ و ۹۰)
   چهار آزمایش: رسوب AgCl، رسوب Ca₃(PO₄)₂، رسوب BaSO₄ و بررسی یون‌ها در آب آشامیدنی.
   مرجع API: docs/LAB-API.md */
import {
  C,v3,lerp,lin,easeOut,sleep,tween,fa,RACK_Y,
  S,makeTube,placeJar,placeBottle,CAMS,SPECIES,PRECIPITATE,
  camTo,hud,eq,ansStep,wash,
  scoopInto,pourWater,shake,fetchFrom,fetchFromBottle,dropwise,dropperHome
} from '../../core/api.js';

CAMS.tube2={p:[.3,2.4,4.7],t:[0,1.3,0]};

/* هر آزمایش: لولهٔ ۱ محلول A (که رسوب در آن تشکیل می‌شود)، لولهٔ ۲ محلول B (قطره‌قطره به A افزوده می‌شود) */
const CFG={
  1:{A:'NaCl',B:'AgNO3',ppt:'AgCl',nameA:'سدیم کلرید',nameB:'نقره نیترات',pptName:'نقره کلرید',
     eq:'AgNO<sub>3</sub>(aq) + NaCl(aq) → AgCl(s) + NaNO<sub>3</sub>(aq)',
     drops:10},
  2:{A:'Na3PO4',B:'CaCl2',ppt:'Ca3(PO4)2',nameA:'سدیم فسفات',nameB:'کلسیم کلرید',pptName:'کلسیم فسفات',
     eq:'2Na<sub>3</sub>PO<sub>4</sub>(aq) + 3CaCl<sub>2</sub>(aq) → Ca<sub>3</sub>(PO<sub>4</sub>)<sub>2</sub>(s) + 6NaCl(aq)',
     drops:10},
  3:{A:'BaCl2',B:'Na2SO4',ppt:'BaSO4',nameA:'باریم کلرید',nameB:'سدیم سولفات',pptName:'باریم سولفات',
     eq:'BaCl<sub>2</sub>(aq) + Na<sub>2</sub>SO<sub>4</sub>(aq) → BaSO<sub>4</sub>(s) + 2NaCl(aq)',
     drops:10}
};
const CLEAR=new C(0xeaf4ff);

async function dropTube(i,big,small){
  const t=makeTube(i,big,small);
  t.group.position.y=5.8;
  await tween(.85,k=>{t.group.position.y=lerp(5.8,RACK_Y,k);},easeOut);
  t.sticker.visible=true;t.sticker.scale.setScalar(.01);
  await tween(.35,k=>t.sticker.scale.setScalar(.01+k*.99),easeOut);
  return t;
}
/* یک‌سوم لوله آب مقطر + چند بلور؛ تکان بدهید تا حل شود */
async function dissolve(i,jar,id){
  const t=S.tubes[i],ch=SPECIES[id];
  await scoopInto(jar,t,ch.powder,220);
  await pourWater(t,1.1);
  const c0=t.color.clone(),a0=t.alpha,c1=new C(ch.sol),a1=ch.solA,n0=t.solid.count;
  hud('در حال تکان دادن لوله…');
  await shake(t,k=>{
    const e=k*k*(3-2*k);
    t.solid.setActive(n0*Math.pow(1-e,1.5));
    t.color.lerpColors(c0,c1,e);t.alpha=lerp(a0,a1,e);
  });
  t.solid.setActive(0);t.color.copy(c1);t.alpha=a1;hud('');
}
/* قطره‌قطره محلول لولهٔ ۲ به لولهٔ ۱: رسوب سفید */
async function addDrops(c,fromTube=1,toTube=0,n=c.drops){
  await camTo('rack');
  await fetchFrom(S.tubes[fromTube],.5);
  const t=S.tubes[toTube],col=PRECIPITATE[c.ppt];
  t.precipColor.setHex(col);
  await camTo(toTube===0?'tube1':'tube2');
  await dropwise(t,n,i=>{
    t.addLiquid(.03,CLEAR,.02);
    t.precip.spawn(150,t.level-.03,.05,col,-.25);
  },i=>i<2?'لکه‌های سفید':'رسوب سفید');
  await sleep(3);
  await dropperHome();
}

const obs=(c,extra='')=>`با ریختن قطره‌های محلول ${c.nameB} به محلول ${c.nameA}، <b>رسوب سفیدرنگ ${c.pptName}</b> تشکیل می‌شود و محلول شیری می‌شود.${extra}`;

function chemSteps(n){
  const c=CFG[n];
  const steps=[
    {tag:n===1?'الف':'الف (۱)',text:`یک لولهٔ آزمایش بردارید و تا یک‌سوم حجم آن آب مقطر بریزید. سپس با قاشقک چند بلور کوچک ${c.nameA} به آن بیفزایید. لوله را تکان دهید.`,run:async()=>{
      await camTo('rack');await dropTube(0,'۱','لوله');await dissolve(0,S.jars.A,c.A);}},
    {tag:n===1?'ب':'الف (۲)',text:`لولهٔ آزمایش دیگری بردارید و تا یک‌سوم حجم آن آب مقطر بریزید. سپس با قاشقک چند بلور کوچک ${c.nameB} به آن بیفزایید. لوله را تکان دهید.`,run:async()=>{
      await camTo('rack');await dropTube(1,'۲','لوله');await dissolve(1,S.jars.B,c.B);}},
    {tag:n===1?'پ':'ب',text:`با قطره‌چکان چند قطره از محلول ${c.nameB} را درون محلول ${c.nameA} بریزید. مشاهدهٔ خود را بنویسید.`,run:()=>addDrops(c)},
    ansStep(n===1?'پ (مشاهده)':'مشاهده','مشاهدهٔ خود را بنویسید. از این آزمایش چه نتیجه‌ای می‌گیرید؟','tube1','مشاهده و نتیجه',
      obs(c)+`<br><b>نتیجه:</b> دو محلول حاوی یون‌هایی هستند که با هم ترکیب نامحلول (رسوب) می‌سازند؛ تشکیل رسوب نشان می‌دهد در محلول‌ها یون‌های جداگانه وجود دارد.`),
    ansStep(n===1?'ت':'معادله','معادلهٔ شیمیایی واکنش را بنویسید و موازنه کنید.','tube1','معادلهٔ موازنه‌شده',eq(c.eq))
  ];
  if(n===3){steps.splice(0,3,
    {tag:'الف (۱)',text:`لولهٔ ۱: محلول ${c.nameA} (حاوی یون باریم، Ba²⁺) را تهیه کنید.`,run:async()=>{
      await camTo('rack');await dropTube(0,'۱','لوله');await dissolve(0,S.jars.A,c.A);}},
    {tag:'الف (۲)',text:`لولهٔ ۲: محلول ${c.nameB} را (به‌عنوان معرف یون باریم) تهیه کنید.`,run:async()=>{
      await camTo('rack');await dropTube(1,'۲','لوله');await dissolve(1,S.jars.B,c.B);}},
    {tag:'الف (۳)',text:`این آزمایش را انجام دهید: چند قطره از محلول ${c.nameB} را به محلول ${c.nameA} بیفزایید.`,run:()=>addDrops(c)});
  }
  return steps;
}

/* ---- آزمایش ۴: آب آشامیدنی ---- */
async function sampleTube(i,big,small){
  await camTo('rack');
  const t=await dropTube(i,big,small);
  await pourWater(t,1.5);
  return t;
}
async function testSample(i,bottleKey,col,sol,alpha,label,cam){
  await camTo('overview');
  await fetchFromBottle(S.bottles[bottleKey],new C(sol),alpha);
  const t=S.tubes[i];t.precipColor.setHex(col);
  await camTo(cam);
  await dropwise(t,8,k=>{t.addLiquid(.03,CLEAR,.02);t.precip.spawn(34,t.level-.03,.05,col,-.2);},k=>label);
  await sleep(3);
  await dropperHome();
}
function steps4(){
  return [
    {tag:'الف',text:'از یک منبع آب آشامیدنی (آب شیر، آب معدنی، آب چشمه یا آب قنات) دو نمونه تهیه کنید: دو لولهٔ آزمایش را تا نیمه از آب نمونه پر کنید.',run:async()=>{
      await sampleTube(0,'۱','نمونهٔ ۱');await sampleTube(1,'۲','نمونهٔ ۲');}},
    {tag:'ب',text:'وجود یون کلرید را در نمونهٔ ۱ بررسی کنید: چند قطره محلول نقره نیترات به آن بیفزایید.',run:()=>testSample(0,'ag',PRECIPITATE.AgCl,SPECIES.AgNO3.sol,SPECIES.AgNO3.solA,'کدورت سفید (AgCl)','tube1')},
    {tag:'پ',text:'وجود یون کلسیم را در نمونهٔ ۲ بررسی کنید: چند قطره محلول سدیم فسفات به آن بیفزایید.',run:()=>testSample(1,'po',PRECIPITATE['Ca3(PO4)2'],SPECIES.Na3PO4.sol,SPECIES.Na3PO4.solA,'کدورت سفید (Ca₃(PO₄)₂)','tube2')},
    ansStep('مشاهده','مشاهده‌های خود را بنویسید و نتیجه بگیرید.','overview','مشاهده و نتیجه',
      'در نمونهٔ ۱ با نقره نیترات <b>کدورت سفید کم‌رنگ</b> ظاهر شد ← وجود یون <b>کلرید (Cl⁻)</b> در آب. در نمونهٔ ۲ با سدیم فسفات <b>کدورت سفید</b> ظاهر شد ← وجود یون <b>کلسیم (Ca²⁺)</b>. هرچه رسوب بیشتر باشد غلظت یون بیشتر است. آب آشامیدنی مخلوطی همگن است که مقدار کمی از یون‌های گوناگون دارد.'
      +eq('Ag<sup>+</sup>(aq) + Cl<sup>−</sup>(aq) → AgCl(s)')
      +eq('3Ca<sup>2+</sup>(aq) + 2PO<sub>4</sub><sup>3−</sup>(aq) → Ca<sub>3</sub>(PO<sub>4</sub>)<sub>2</sub>(s)')
      +'<small>شدت کدورت به نوع آب (شیر، معدنی، چشمه یا قنات) بستگی دارد؛ در این شبیه‌سازی آب نمونه، آب شیر فرض شده است.</small>')
  ];
}

function setup(n){
  if(wash&&wash.setLabel)n===4?wash.setLabel('آب شیر','Tap water'):wash.setLabel('آب مقطر','H₂O');
  if(n===4){
    S.bottles={ag:placeBottle('AgNO3',-3.9),po:placeBottle('Na3PO4',3.7)};
  }else{
    const c=CFG[n];
    S.jars.A=placeJar(c.A,-3.9);S.jars.B=placeJar(c.B,3.7);
  }
}

export default {
  tabs:[
    {id:'exp1',title:'آزمایش ۱',subtitle:'نقره نیترات + سدیم کلرید',camera:'overview',setup:()=>setup(1),steps:()=>chemSteps(1)},
    {id:'exp2',title:'آزمایش ۲',subtitle:'سدیم فسفات + کلسیم کلرید',camera:'overview',setup:()=>setup(2),steps:()=>chemSteps(2)},
    {id:'exp3',title:'آزمایش ۳',subtitle:'یون باریم',camera:'overview',setup:()=>setup(3),steps:()=>chemSteps(3)},
    {id:'exp4',title:'آزمایش ۴',subtitle:'آب آشامیدنی',camera:'overview',setup:()=>setup(4),steps:()=>steps4()}
  ]
};
