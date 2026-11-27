/* «اثر مقدار نمک آب بر انحلال‌پذیری گازها» — شیمی ۱ (دهم)، کاوش کنید پایان صفحهٔ ۱۱۴
   متن کتاب: «درباره اینکه مقدار نمک موجود در آب دریا بر میزان انحلال‌پذیری گازها اثر دارد؟ کاوش کنید
   (در کاوش خود باید آزمایش طراحی و اجرا کنید و از داده‌های آن نتیجهٔ درست و قابل اطمینان بگیرید).»
   طراحی پیشنهادی این شبیه‌سازی: همان دستگاه آزمایش ۱ و ۲ کتاب، اما دما و مقدار آب و قرص ثابت و فقط مقدار نمک متغیر.
   داده‌ها نمونه‌اند. مرجع API: docs/LAB-API.md */
import {
  v3,C,sleep,fa,tween,lin,moveTo,
  S,CAMS,
  makeTub,fillTub,addIce,makeGasCylinder,fillGasCylinder,invertIntoTub,makeCollectFunnel,makeClampStand,makeGasBubbles,
  makeTablet,makeThermometer,dipThermometer,liftThermometer,
  camTo,hud,showAns,ansStep
} from '../../core/api.js';

CAMS.main={p:[0,4.0,13],t:[0,2.1,-.4]};
CAMS.close={p:[1.2,3.0,8.2],t:[1.2,1.9,-.5]};
CAMS.top={p:[0,13,3],t:[0,0,-.4]};

const TX=1.4,TZ=-.5,MOUTH=1.25,LEVEL=1.85;
const WATERC=new C(0xd8ecfa);
/* سه سطح نمک (g در هر لیتر آب) و حجم گاز جمع‌شده (mL) در سه بار تکرار: داده‌های نمونه.
   نمک بیشتر ← انحلال‌پذیری CO₂ کمتر ← گاز بیشتری جمع می‌شود. */
const LV=[
  {g:0,  name:'آب شیر (بدون نمک)',  data:[28,29,27]},
  {g:35, name:'آب نمک ۳۵ g/L (مانند آب دریا)', data:[31,32,30]},
  {g:100,name:'آب نمک ۱۰۰ g/L (غلیظ)',  data:[35,36,34]}
];
const REC=[[],[],[]];
const avg=a=>a.reduce((s,v)=>s+v,0)/a.length;
const tableHTML=(upto)=>{
  const cell=(i,j)=>REC[i][j]!==undefined?fa(LV[i].data[j]):'—';
  const mean=i=>REC[i].length===3?fa(avg(LV[i].data).toFixed(0)):'—';
  const cols=[0,1,2].filter(i=>i<=upto);
  return '<table style="width:100%;text-align:center;border-collapse:collapse;font-size:.88em"><tr><td></td>'+cols.map(i=>`<td>${fa(LV[i].g)} g/L</td>`).join('')+'</tr>'
   +['بار اول','بار دوم','بار سوم'].map((t,j)=>`<tr><td>${t}</td>`+cols.map(i=>`<td>${cell(i,j)}</td>`).join('')+'</tr>').join('')
   +'<tr><td>میانگین</td>'+cols.map(i=>`<td>${mean(i)}</td>`).join('')+'</tr></table><small>حجم گاز جمع‌شده درون استوانهٔ مدرج (mL)؛ عددها نمونه‌اند.</small>';
};

function setup(n){
  S.lv=n;
  S.tub=makeTub(0,TZ);
  S.stand=makeClampStand(TX,-3.4,{ringAt:v3(0,3.9,TZ+3.4-.0)});S.stand.show(false);
  S.fun=makeCollectFunnel(-4.7,.6,{y:0});
  S.gc=makeGasCylinder(5.3,.3,{ml:100});
  S.bub=makeGasBubbles(S.fun,S.gc);
  S.tab=makeTablet(-3.5,2.1,{piece:'half'});
  S.th=makeThermometer(-3.0,3.8);
  S.trial=0;
}

/* یک بار جمع‌آوری گاز: حباب‌ها بالا می‌آیند و سطح آب درون استوانه پایین می‌رود */
async function collect(V,dur=5){
  S.gc.showReading(false);S.bub.set(true,1);
  const e=k=>(1-Math.exp(-3*k))/(1-Math.exp(-3));
  await tween(dur,k=>{S.gc.setGas(V*e(k));S.bub.rate=1-.6*k;hud(`حجم گاز جمع‌شده: ${fa(Math.round(V*e(k)))} mL`);},lin);
  S.gc.setGas(V);S.bub.set(false);S.gc.showReading(true);
  hud(`حجم گاز جمع‌شده: ${fa(V)} mL`);
}

function steps(n){
  const L=LV[n],salt=L.g>0,last=n===2;
  const list=[];
  if(n===0){
    list.push(ansStep('طراحی','آزمایش را چگونه طراحی می‌کنید؟','main','طراحی آزمایش',
      '<b>پرسش:</b> آیا مقدار نمک آب بر انحلال‌پذیری گاز CO₂ اثر دارد؟<br>'
     +'<b>متغیر مستقل:</b> مقدار نمک (۰، ۳۵ و ۱۰۰ گرم در هر لیتر آب).<br>'
     +'<b>متغیر وابسته:</b> حجم گاز جمع‌شده در استوانهٔ مدرج.<br>'
     +'<b>ثابت نگه می‌داریم:</b> دمای آب، حجم آب، اندازهٔ قطعهٔ قرص جوشان (نصف قرص)، همان ظرف، قیف و استوانه.<br>'
     +'<b>برای قابل‌اطمینان بودن:</b> هر حالت سه بار تکرار می‌شود و میانگین گرفته می‌شود.'));
  }
  list.push(
    {tag:'الف',text:salt
      ?`ظرف پلاستیکی را تا نیمه از آب هم‌دما با اتاق پر کنید و ${fa(L.g)} گرم نمک به‌ازای هر لیتر آب در آن حل کنید.`
      :'ظرف پلاستیکی را تا نیمه از آب شیر هم‌دما با اتاق پر کنید (بدون نمک).',
     run:async()=>{
      await camTo('main');
      await fillTub(S.tub,LEVEL,WATERC,.05,2);
      if(salt){hud(`افزودن ${fa(L.g)} g نمک به هر لیتر و هم‌زدن تا حل شدن کامل`);await sleep(1.6);}
      await dipThermometer(S.th,S.tub,22,{T0:22,dur:1.6});hud('دمای آب ≈ ۲۲°C (در هر سه آزمایش یکسان)');await sleep(.8);await liftThermometer(S.th);hud('');
    }},
    {tag:'ب',text:'یک قرص جوشان را نصف کنید و با تکه‌ای خمیربازی به دیوارهٔ داخلی قیف بچسبانید.',run:async()=>{
      await camTo('main');
      const p=S.fun.group.position;
      await moveTo(S.tab.group,v3(p.x+.2,2.6,p.z),1.0,null,.7);
      S.tab.group.visible=false;S.fun.tab.visible=true;
      await sleep(.5);
    }},
    {tag:'پ',text:'استوانهٔ مدرج را از همان آب پر کنید، دهانهٔ آن را با کف دست ببندید و وارونه درون ظرف بگذارید.',run:async()=>{
      await camTo('main');
      S.gc.setWater(WATERC,.05);
      await fillGasCylinder(S.gc,1.4);
      hud('کف دست روی دهانهٔ استوانه…');
      await invertIntoTub(S.gc,TX,TZ,MOUTH);
      S.stand.show(true);hud('');
    }},
    {tag:'ت',text:'قیف را زیر دهانهٔ استوانه قرار دهید و حجم گاز جمع‌شده را بخوانید.',run:async()=>{
      await camTo('main');
      const f=S.fun,g=f.group,yFloor=.1+.4*2.3;
      await moveTo(g,v3(g.position.x,5.4,g.position.z),.9);
      await moveTo(g,v3(TX+1.7,5.4,TZ),1.4);
      await moveTo(g,v3(TX+1.7,yFloor,TZ),1.0);
      await moveTo(g,v3(TX,yFloor,TZ),.9);
      await camTo('close');
      await collect(L.data[0],5);REC[n][0]=1;
    }},
    {tag:'تکرار',text:'آزمایش را دو بار دیگر تکرار کنید و حجم گاز را در جدول بنویسید.',run:async()=>{
      for(let j=1;j<3;j++){
        hud(`تکرار آزمایش — بار ${j===1?'دوم':'سوم'}`);
        await tween(.9,k=>S.gc.setGas(L.data[j-1]*(1-k)),lin);S.gc.showReading(false);
        await sleep(.3);await collect(L.data[j],3.2);REC[n][j]=1;await sleep(.6);
      }
      hud('');showAns(`جدول — ${L.name}`,tableHTML(n));
    }}
  );
  if(!last){
    list.push(ansStep('مشاهده','میانگین حجم گاز در این آزمایش چقدر شد؟','main','نتیجهٔ این بخش',
      `میانگین حجم گاز جمع‌شده در «${L.name}» حدود ${fa(avg(L.data).toFixed(0))} mL شد (عدد نمونه). برای مقایسه، آزمایش بعدی را با مقدار نمک متفاوت انجام دهید.`));
  }else{
    list.push(
      ansStep('مقایسه','داده‌های سه آزمایش را مقایسه کنید.','main','مقایسهٔ دادهٔ سه آزمایش',
        'با افزایش مقدار نمک، میانگین حجم گاز جمع‌شده <b>بیشتر</b> می‌شود.'+tableHTML(2)),
      ansStep('نتیجه','چه نتیجه‌ای می‌گیرید؟ آیا نتیجه قابل اطمینان است؟','main','نتیجه',
        'هرچه مقدار نمک حل‌شده در آب بیشتر باشد، گاز CO₂ کمتری در آن حل می‌شود و گاز بیشتری جمع می‌شود؛ یعنی <b>انحلال‌پذیری گاز با افزایش مقدار نمک کم می‌شود</b>. پس مقدار نمک آب دریا بر انحلال‌پذیری گازها اثر دارد.<br>'
       +'نتیجه قابل اطمینان است، چون فقط یک متغیر (مقدار نمک) تغییر کرد، دما، حجم آب و اندازهٔ قرص ثابت بود و هر آزمایش سه بار تکرار شد و تفاوت میانگین‌ها از پراکندگی تکرارها بیشتر بود. <small>(داده‌ها در این شبیه‌سازی نمونه‌اند؛ آزمایش واقعی را خودتان انجام دهید.)</small>')
    );
  }
  return list;
}

export default {
  cameras:[['main','نمای کلی'],['close','نزدیک'],['top','از بالا']],
  tabs:LV.map((L,n)=>({id:'salt'+n,title:'آزمایش '+fa(n+1),subtitle:L.g?fa(L.g)+' g/L نمک':'بدون نمک',camera:'main',rack:false,dropper:false,setup:()=>setup(n),steps:()=>steps(n)}))
};
