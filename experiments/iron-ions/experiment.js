/* آزمایش «شناسایی یون‌های آهن» — شیمی ۱۱، کاوش کنید (۱)، صفحهٔ ۱۹
   نمونهٔ مرجع برای نویسندگان آزمایش‌های دیگر. مرجع API: docs/LAB-API.md */
import {
  THREE,C,v3,TAU,lerp,lin,easeOut,sleep,tween,moveTo,fa,RACK_Y,
  S,makeTube,addToBench,placeJar,placeBottle,
  SPECIES,PRECIPITATE,NAOHC,world,
  camTo,hud,eq,showAns,ansStep,
  spoon,spawnDebris,debris,clearDebris,addBlob,
  scoopInto,pourWater,shake,pourSpoon,fetchFrom,fetchFromBottle,pourFromDropper,dropwise,dropperHome
} from '../../core/api.js';
import {makeNail} from './nail.js';

const YEL=new C(SPECIES.FeCl3.sol), RUSTHEX=SPECIES.Fe2O3.powder;

async function stepTubes(){
  await camTo('rack');
  const big=['۱','۲','۳'];
  for(let i=0;i<3;i++){
    const t=makeTube(i,big[i],'لوله');
    t.group.position.y=5.8;
    await tween(.85,k=>{t.group.position.y=lerp(5.8,RACK_Y,k);},easeOut);
    t.sticker.visible=true;t.sticker.scale.setScalar(.01);
    await tween(.35,k=>t.sticker.scale.setScalar(.01+k*.99),easeOut);
  }
}
async function prepSolution(i,which){
  const t=S.tubes[i],ch=which==='NaOH'?SPECIES.NaOH:SPECIES[S.salt],jar=which==='NaOH'?S.jars.naoh:S.jars.salt;
  await scoopInto(jar,t,ch.powder,260);
  await pourWater(t,1.6);
  const c0=t.color.clone(),a0=t.alpha,c1=new C(ch.sol),a1=ch.solA,n0=t.solid.count;
  hud('در حال تکان دادن لوله…');
  await shake(t,k=>{
    const e=k*k*(3-2*k);
    t.solid.setActive(n0*Math.pow(1-e,1.5));
    t.color.lerpColors(c0,c1,e);t.alpha=lerp(a0,a1,e);
  });
  t.solid.setActive(0);t.color.copy(c1);t.alpha=a1;hud('');
}
async function stepTransfer(){
  await camTo('rack');
  await fetchFrom(S.tubes[0],.5);
  await pourFromDropper(S.tubes[2],.5);
  await dropperHome();
}
async function stepDrops(){
  await camTo('rack');
  await fetchFrom(S.tubes[1],.5);
  const t=S.tubes[2],col=S.exp===2?PRECIPITATE['Fe(OH)3']:PRECIPITATE['Fe(OH)2'];
  t.precipColor.setHex(col);
  await camTo('tube3');
  await dropwise(t,9,()=>{
    t.addLiquid(.03,NAOHC,.02);
    t.precip.spawn(150,t.level-.03,.05,col,-.25);
  });
  await sleep(4);
  await dropperHome();
}

/* ---- آزمایش ۳ ---- */
async function stepScrape(){
  await camTo('left');
  const np=S.nail.position;
  spoon.mound.material.color.setHex(RUSTHEX);
  await moveTo(spoon,v3(np.x-.75,.6,np.z+.28),1.5,{x:-.4,y:.35,z:0},1.0);
  await moveTo(spoon,v3(np.x-.75,.14,np.z+.1),.6);
  let acc=0;
  await tween(3.6,k=>{
    spoon.position.x=np.x+Math.sin(k*TAU*3.5)*.75;
    spoon.position.y=.14+Math.abs(Math.sin(k*TAU*7))*.04;
    acc+=1;if(acc%4===0)spawnDebris(v3(spoon.position.x,.12,spoon.position.z-.05),1);
  },lin);
  await sleep(.3);
  await moveTo(spoon,v3(np.x,.16,np.z+.45),.9);
  const items=debris.slice();
  await tween(.9,k=>{
    items.forEach(d=>d.m.scale.setScalar(Math.max(.001,(1-k))*1));
    spoon.holder.visible=true;spoon.holder.scale.setScalar(k);
  },lin);
  clearDebris();
  await moveTo(spoon,v3(np.x+.6,1.6,np.z+.6),1.0,{x:-.6,y:.3,z:0});
}
async function stepRustIn(){
  await camTo('overview');
  await pourSpoon(S.tubes[0],RUSTHEX,260);
}
async function stepHCl(){
  await camTo('overview');
  await fetchFromBottle(S.hcl,new C(0xeaf6ff),0);
  const t=S.tubes[0];
  await camTo('tube1');
  const n0=t.solid.count,N=10;
  await dropwise(t,N,i=>{
    t.addLiquid(.035,new C(0xeaf6ff),0);
    const p=(i+1)/N,a=t.solid.count,tg=Math.round(n0*(1-p)),c=t.color.clone(),al=t.alpha;
    tween(.85,k=>{t.solid.setActive(lerp(a,tg,k));t.color.lerpColors(c,YEL,k*.9+.1);t.alpha=lerp(al,Math.min(.95,.15+p*.85),k);},lin);
  },i=>i>=N-2?'زنگ در حال حل‌شدن':'حل‌شدن زنگ آهن');
  t.solid.setActive(0);t.color.copy(YEL);t.alpha=.95;
  await sleep(1.5);
  await dropperHome();
}
async function stepNaOH3(){
  await camTo('rack');
  await fetchFrom(S.tubes[1],.5);
  const t=S.tubes[0];
  t.precipColor.setHex(PRECIPITATE['Fe(OH)3']);
  await camTo('tube1');
  await dropwise(t,12,i=>{
    t.addLiquid(.03,NAOHC,.02);
    if(i>=4){t.precip.spawn(185,t.level-.03,.05,PRECIPITATE['Fe(OH)3'],-.25);t.alpha*=.9;}
  },i=>i<4?'خنثی‌شدن اسید اضافی':'تشکیل رسوب');
  await sleep(4);
  await dropperHome();
}


function buildSteps(n){
  if(n===3){
    return [
      {tag:'الف',text:'یک میخ زنگ‌زده را بردارید و زنگ آهن سطح آن را با قاشقک خراش بدهید و جمع‌آوری کنید.',run:stepScrape},
      {tag:'ب (۱)',text:'زنگ آهن جمع‌آوری‌شده را در یک لولهٔ آزمایش بریزید.',run:stepRustIn},
      {tag:'ب (۲)',text:'قطره‌قطره محلول هیدروکلریک‌اسید به آن بیفزایید تا همهٔ زنگ آهن حل شود.',run:stepHCl},
      {tag:'پ',text:'قطره‌قطره محلول سدیم هیدروکسید به لوله بیفزایید و این کار را تا جایی ادامه دهید که رسوب رنگی تشکیل شود.',run:stepNaOH3},
      ansStep('ت','مشاهده‌های خود را بنویسید.','tube1','مشاهده‌ها',
        `زنگ آهن (جامد قرمز‌قهوه‌ای) در هیدروکلریک‌اسید حل می‌شود و <b>محلول زردرنگ</b> به‌دست می‌آید. با افزودن قطره‌قطره سدیم هیدروکسید، ابتدا اسید اضافی خنثی می‌شود (تغییر چشمگیری دیده نمی‌شود) و سپس <b>رسوب قرمز‌قهوه‌ای</b> تشکیل می‌شود.`
        +eq('Fe<sub>2</sub>O<sub>3</sub>(s) + 6HCl(aq) → 2FeCl<sub>3</sub>(aq) + 3H<sub>2</sub>O(l)')
        +eq('FeCl<sub>3</sub>(aq) + 3NaOH(aq) → Fe(OH)<sub>3</sub>(s) + 3NaCl(aq)')),
      ansStep('ث','در زنگ آهن کدام یون آهن وجود دارد؟ چرا؟','tube1','پاسخ',
        `در زنگ آهن یون <b>آهن (III)</b> یعنی <b>Fe³⁺</b> وجود دارد.<br><b>دلیل:</b> رسوبی که با NaOH تشکیل شد قرمز‌قهوه‌ای بود؛ همان رنگ رسوب Fe(OH)₃ در آزمایش ۲ که از آهن (III) کلرید به‌دست آمد. اگر زنگ آهن Fe²⁺ داشت، مانند آزمایش ۱ رسوب سبز تشکیل می‌شد. همچنین محلول زردرنگ پس از حل شدن زنگ در HCl، رنگ محلول FeCl₃ است.`)
    ];
  }
  const f3=n===2,salt=f3?'آهن (III) کلرید':'آهن (II) کلرید';
  const steps=[
    {tag:f3?'الف (۱)':'الف',text:'سه لولهٔ آزمایش بردارید و آن‌ها را شماره‌گذاری کنید.',run:stepTubes},
    {tag:f3?'الف (۲)':'ب',text:`مقدار کمی ${salt} را با قاشقک در لولهٔ ۱ بریزید، تا نیمه آب مقطر اضافه کنید و تکان دهید تا محلول شفاف به‌دست آید.`,run:()=>prepSolution(0,'salt')},
    {tag:f3?'الف (۳)':'پ',text:'مقدار کمی سدیم هیدروکسید را با قاشقک در لولهٔ ۲ بریزید، تا نیمه آب بریزید و تکان دهید تا محلول شفاف به‌دست آید.',run:()=>prepSolution(1,'NaOH')},
    {tag:f3?'الف (۴)':'ت (۱)',text:`با قطره‌چکان حدود ۱ میلی‌لیتر از محلول ${salt} را در لولهٔ ۳ بریزید.`,run:stepTransfer},
    {tag:f3?'الف (۵)':'ت (۲)',text:'قطره‌قطره محلول سدیم هیدروکسید را به لولهٔ ۳ بیفزایید.',run:stepDrops}
  ];
  if(!f3){
    steps.push(
      ansStep('ث','چه مشاهده می‌کنید؟ مشاهده‌های خود را بنویسید.','tube3','مشاهده‌ها',
        `محلول آهن (II) کلرید سبزِ بسیار کم‌رنگ است. با افزودن قطره‌قطره محلول NaOH، <b>رسوب سبز</b> (سبز تیره، مایل به آبی) به‌صورت لخته‌های معلق تشکیل می‌شود و کم‌کم ته‌نشین می‌گردد.`),
      ansStep('ج','معادلهٔ نمادی واکنش را بنویسید و موازنه کنید.','tube3','معادلهٔ موازنه‌شده',
        eq('FeCl<sub>2</sub>(aq) + 2NaOH(aq) → Fe(OH)<sub>2</sub>(s) + 2NaCl(aq)')),
      ansStep('چ','از این آزمایش چه نتیجه‌ای می‌گیرید؟','tube3','نتیجه',
        `تشکیل <b>رسوب سبزرنگ</b> آهن (II) هیدروکسید با افزودن NaOH نشان می‌دهد که در نمونه یون <b>Fe²⁺</b> وجود دارد.`)
    );
  }else{
    steps.push(
      ansStep('ب','مشاهده‌های خود را بنویسید.','tube3','مشاهده‌ها',
        `محلول آهن (III) کلرید زرد‌نارنجی است. با افزودن NaOH، <b>رسوب قرمز‌قهوه‌ای</b> تشکیل می‌شود که با رسوب سبز آزمایش ۱ کاملاً تفاوت دارد.`),
      ansStep('پ','معادلهٔ نمادی واکنش را بنویسید و موازنه کنید.','tube3','معادلهٔ موازنه‌شده',
        eq('FeCl<sub>3</sub>(aq) + 3NaOH(aq) → Fe(OH)<sub>3</sub>(s) + 3NaCl(aq)')),
      ansStep('ت','از این آزمایش چه نتیجه‌ای می‌گیرید؟','tube3','نتیجه',
        `رسوب <b>قرمز‌قهوه‌ای</b> نشانهٔ یون <b>Fe³⁺</b> است. چون رنگ رسوب برای Fe²⁺ (سبز) و Fe³⁺ (قرمز‌قهوه‌ای) متفاوت است، با محلول سدیم هیدروکسید می‌توان این دو یون را از هم تشخیص داد.`)
    );
  }
  return steps;
}


/* ---------- چیدمان هر آزمایش ---------- */
function setup(n){
  S.exp=n;S.salt=n===2?'FeCl3':'FeCl2';
  if(n===3){
    S.hcl=placeBottle('HCl',-3.9);
    S.nail=makeNail();S.nail.position.set(-3.85,.05,2.35);addToBench(S.nail);
    const paper=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.3),new THREE.MeshStandardMaterial({color:0xf7f7f3,roughness:.95}));
    paper.rotation.x=-Math.PI/2;paper.position.set(-3.85,.006,2.4);paper.receiveShadow=true;addToBench(paper);
    const t0=makeTube(0,'۱','لوله',true);
    const t1=makeTube(1,'NaOH','محلول',true);
    t1.addLiquid(1.3,NAOHC,.02);
    t0.precipColor.setHex(PRECIPITATE['Fe(OH)3']);
  }else{
    S.jars.salt=placeJar(S.salt,-3.9);
    S.jars.naoh=placeJar('NaOH',3.7);
  }
}

export default {
  tabs:[
    {id:'exp1',title:'آزمایش ۱',subtitle:'یون آهن (II)',camera:'overview',setup:()=>setup(1),steps:()=>buildSteps(1)},
    {id:'exp2',title:'آزمایش ۲',subtitle:'یون آهن (III)',camera:'overview',setup:()=>setup(2),steps:()=>buildSteps(2)},
    {id:'exp3',title:'آزمایش ۳',subtitle:'زنگ آهن',camera:'rack',setup:()=>setup(3),steps:()=>buildSteps(3)}
  ]
};
