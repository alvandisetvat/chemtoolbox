/* آزمایش «رفتار شیمیایی اکسیدهای فلزی و نافلزی» — شیمی ۱۰، فصل ۲، کاوش کنید (صفحهٔ ۶۱)
   نخستین آزمایش «دستگاهی»: بشر، میلهٔ همزن، کاغذ pH و مقیاس رنگی. مرجع API: docs/LAB-API.md */
import {
  v3,lerp,easeOut,tween,sleep,
  S,world,addToBench,placeJar,addBlob,
  SPECIES,PRECIPITATE,CAMS,
  makeBeaker,makeStirRod,stirBeaker,addFizz,makeBottle,
  makePHChart,makePHPack,takePHStrip,dipPHPaper,compareWithChart,beakerTarget,bottleTarget,
  scoopInto,pourWater,camTo,hud,showAns,ansStep,eq
} from '../../core/api.js';

/* دوربین‌های اختصاصی این آزمایش */
CAMS.beaker={p:[-1.4,3.4,7.4],t:[-1.9,1.2,.5]};
CAMS.chart={p:[1.0,2.4,5.6],t:[.8,.6,-.3]};
CAMS.soda={p:[2.0,3.4,7.4],t:[2.6,1.2,.7]};

const CAOHEX=SPECIES.CaO.powder, MILK=PRECIPITATE['Ca(OH)2'];
const PH_LIMEWATER=12.4, PH_SODA=3.9;

function setup(){
  S.jar=placeJar('CaO',-4.1);
  S.soda=makeBottle('CO₂','آب گازدار');
  S.soda.group.position.set(2.9,0,.7);addToBench(S.soda.group);addBlob(world.dyn,2.9,.7,1.6,1.6,.45);
  addFizz(S.soda,{y0:.2,y1:1.1,r:.4});
  S.chart=makePHChart();S.chart.group.position.set(.6,0,-1.6);
  S.pack=makePHPack();S.pack.group.position.set(1.3,0,1.6);
  S.rod=makeStirRod();
}

function steps(){
  return [
    {tag:'۱ (۱)',text:'در یک بشر تا نیمهٔ آن آب بریزید.',run:async()=>{
      await camTo('beaker');
      const b=S.beaker=makeBeaker(-1.9,.6);
      b.group.position.y=5.8;
      await tween(.9,k=>{b.group.position.y=lerp(5.8,0,k);},easeOut);
      await pourWater(b,.95,'beaker');
    }},
    {tag:'۱ (۲)',text:'مقداری آهک (کلسیم اکسید) به آن بیفزایید و مخلوط را خوب هم بزنید.',run:async()=>{
      const b=S.beaker;
      await scoopInto(S.jar,b,CAOHEX,200,v3(-4.1,.11,1.8));
      await camTo('beaker');
      const n0=b.solid.count;let em=0;
      hud('در حال هم زدن…');
      await stirBeaker(b,S.rod,3.6,k=>{
        const want=Math.floor(k*700);
        if(want>em){b.suspend(want-em,MILK);em=want;}
        b.solid.setActive(n0*(1-.75*k));
      });
      hud('');
      await sleep(.5);
    }},
    {tag:'۲',text:'یک تکه کاغذ pH بردارید و آن را در محلول آب‌آهک فرو ببرید. چه مشاهده می‌کنید؟',run:async()=>{
      await camTo('overview');
      const s=await takePHStrip(S.pack);
      await camTo('beaker');
      await dipPHPaper(s,beakerTarget(S.beaker),PH_LIMEWATER);
      await camTo('chart');
      await compareWithChart(s,S.chart,PH_LIMEWATER);
      showAns('مشاهده‌ها (آب‌آهک)','کاغذ pH در آب‌آهک به رنگ <b>آبی‌بنفش</b> درمی‌آید (pH حدود ۱۲). یعنی محلول آب‌آهک <b>بازی</b> است (pH > ۷).');
    }},
    {tag:'۳',text:'بطری آب گازدار را بردارید و کاغذ pH را به آن آغشته کنید. چه رنگی می‌شود؟',run:async()=>{
      await camTo('overview');
      const s=await takePHStrip(S.pack);
      await camTo('soda');
      await dipPHPaper(s,bottleTarget(S.soda),PH_SODA);
      await camTo('chart');
      await compareWithChart(s,S.chart,PH_SODA);
      showAns('مشاهده‌ها (آب گازدار)','کاغذ pH در آب گازدار <b>نارنجی تا قرمز</b> می‌شود (pH حدود ۴). یعنی آب گازدار <b>اسیدی</b> است (pH < ۷).');
    }},
    ansStep('۴','از این آزمایش‌ها چه نتیجه‌ای می‌گیرید؟ توضیح دهید.','overview','نتیجه',
      'کلسیم اکسید، یک <b>اکسید فلزی</b> است و با آب <b>محلول بازی</b> (آب‌آهک) می‌دهد. کربن دیاکسید، یک <b>اکسید نافلزی</b> است و وقتی در آب حل می‌شود (آب گازدار) <b>محلول اسیدی</b> می‌دهد. به‌طور کلی اکسیدهای فلزی با آب خاصیت بازی و اکسیدهای نافلزی خاصیت اسیدی ایجاد می‌کنند.'
      +eq('CaO(s) + H<sub>2</sub>O(l) → Ca(OH)<sub>2</sub>(aq)')
      +eq('CO<sub>2</sub>(g) + H<sub>2</sub>O(l) ⇌ H<sub>2</sub>CO<sub>3</sub>(aq)')),
    ansStep('۵','پیش‌بینی کنید با افزودن هر ماده به آب، محلول چه خاصیتی دارد.','overview','پیش‌بینی',
      '<b>MgO</b> (اکسید فلزی): بازی، pH > ۷ (کم‌محلول؛ بازی ضعیف)<br><b>SO₂</b> (اکسید نافلزی): اسیدی، pH < ۷<br><b>CO₂</b> (اکسید نافلزی): اسیدی، pH < ۷<br><b>Na₂O</b> (اکسید فلزی): بازی، pH > ۷'
      +eq('Na<sub>2</sub>O(s) + H<sub>2</sub>O(l) → 2NaOH(aq)')
      +eq('SO<sub>2</sub>(g) + H<sub>2</sub>O(l) → H<sub>2</sub>SO<sub>3</sub>(aq)'))
  ];
}

export default {
  cameras:[['overview','نمای کلی'],['beaker','بشر'],['chart','مقیاس pH'],['top','از بالا']],
  tabs:[{id:'main',title:'کاوش',camera:'overview',rack:false,dropper:false,setup,steps}]   // این آزمایش رک لوله و قطره‌چکان ندارد
};
