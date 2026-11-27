/* «اثر دما بر انحلال‌پذیری گازها در آب» — شیمی ۱ (دهم)، کاوش کنید (صفحهٔ ۱۱۳ و ۱۱۴)
   جمع‌آوری گاز CO₂ حاصل از قرص جوشان روی آب سرد (آزمایش ۱) و آب گرم (آزمایش ۲).
   مرجع API: docs/LAB-API.md */
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

const TX=1.4,TZ=-.5;          // جای استوانه و قیف در تشت
const MOUTH=1.25;             // ارتفاع دهانهٔ استوانه از میز
const LEVEL=1.85;             // سطح آب تشت
const COLD=new C(0xcfe6f7),WARM=new C(0xdcefff);
/* حجم گاز جمع‌شده (mL) در سه بار تکرار: داده‌های نمونهٔ شبیه‌سازی.
   آب گرم‌تر ← انحلال‌پذیری CO₂ کمتر ← گاز بیشتری جمع می‌شود. */
const DATA=[[24,25,23],[37,38,36]];
const REC=[[],[]];
const avg=a=>a.reduce((s,v)=>s+v,0)/a.length;
const tableHTML=()=>{
  const c=i=>j=>REC[i][j]!==undefined?fa(DATA[i][j]):'—';
  const m=i=>REC[i].length===3?fa(avg(DATA[i]).toFixed(0)):'—';
  return '<table style="width:100%;text-align:center;border-collapse:collapse;font-size:.92em"><tr><td></td><td>آزمایش ۱ (آب سرد)</td><td>آزمایش ۲ (آب گرم)</td></tr>'
   +['بار اول','بار دوم','بار سوم'].map((t,j)=>`<tr><td>${t}</td><td>${c(0)(j)}</td><td>${c(1)(j)}</td></tr>`).join('')
   +`<tr><td>میانگین</td><td>${m(0)}</td><td>${m(1)}</td></tr></table><small>حجم گاز جمع‌شده درون استوانهٔ مدرج (mL)؛ عددها نمونه‌اند.</small>`;
};

function setup(n){
  S.warm=n===1;
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
  const warm=n===1,E=warm?'۲':'۱';
  const list=[
    {tag:'الف',text:warm
      ?'آزمایش ۱ را با آب گرم تکرار کنید: ظرف پلاستیکی را بردارید و آب گرم را تا نیمه درون آن بریزید.'
      :'ظرف پلاستیکی را بردارید و مخلوط آب و یخ را تا نیمه درون آن بریزید.',
     run:async()=>{
      await camTo('main');
      if(warm){await fillTub(S.tub,LEVEL,WARM,.05,2);S.tub.setSteam(1);
        await dipThermometer(S.th,S.tub,50,{T0:22,dur:1.8});hud('دمای آب ≈ ۵۰°C');await sleep(.8);await liftThermometer(S.th);hud('');}
      else{await fillTub(S.tub,LEVEL,COLD,.1,2);await addIce(S.tub,12,{avoid:[.1,2.7]});
        await dipThermometer(S.th,S.tub,2,{T0:22,dur:1.8});hud('دمای آب ≈ ۲°C');await sleep(.8);await liftThermometer(S.th);hud('');}
    }},
    {tag:'ب',text:'یک قرص جوشان را نصف کنید و با استفاده از تکه‌ای خمیربازی آن را به دیوارهٔ داخلی قیف بچسبانید.',run:async()=>{
      await camTo('main');
      const p=S.fun.group.position;
      await moveTo(S.tab.group,v3(p.x+.2,2.6,p.z),1.0,null,.7);
      S.tab.group.visible=false;S.fun.tab.visible=true;
      await sleep(.5);
    }},
    {tag:'پ',text:'استوانهٔ مدرج را از آب پر کنید و کف دست خود را روی دهانهٔ آن قرار دهید. حال استوانه را وارونه کرده و درون ظرف محتوی آب قرار دهید (استوانه را با دست نگه دارید).',run:async()=>{
      await camTo('main');
      S.gc.setWater(warm?WARM:COLD,.05);
      await fillGasCylinder(S.gc,1.4);
      hud('کف دست روی دهانهٔ استوانه…');
      await invertIntoTub(S.gc,TX,TZ,MOUTH);
      S.stand.show(true);hud('');
    }},
    {tag:'ت',text:'قیف را درون ظرف بزرگ قرار دهید، به‌گونه‌ای که لولهٔ قیف زیر دهانهٔ استوانهٔ مدرج قرار گیرد. مشاهده‌های خود را بنویسید.',run:async()=>{
      await camTo('main');
      const f=S.fun,g=f.group,y0=g.position.y,yFloor=.1+.4*2.3;
      await moveTo(g,v3(g.position.x,5.4,g.position.z),.9);
      await moveTo(g,v3(TX+1.7,5.4,TZ),1.4);
      await moveTo(g,v3(TX+1.7,yFloor,TZ),1.0);
      await moveTo(g,v3(TX,yFloor,TZ),.9);
      await camTo('close');
      await collect(DATA[n][0],5);REC[n][0]=1;
      showAns(`مشاهده‌ها — آزمایش ${E}`,
        warm?'قرص شروع به واکنش با آب می‌کند و <b>حباب‌های فراوان گاز</b> از لولهٔ قیف بالا می‌آید و آب درون استوانه را به‌سرعت پایین می‌راند.'
            :'قرص با آب واکنش می‌دهد و <b>حباب‌های گاز</b> از لولهٔ قیف بالا می‌آید و آب را درون استوانه پایین می‌راند؛ حجم گاز جمع‌شده نسبتاً کم است.');
    }},
    {tag:'جدول',text:'آزمایش را دو بار دیگر تکرار کنید (بار دوم و سوم) و حجم گاز را در جدول بنویسید.',run:async()=>{
      for(let j=1;j<3;j++){
        hud(`تکرار آزمایش — بار ${j===1?'دوم':'سوم'}`);
        await tween(.9,k=>S.gc.setGas(DATA[n][j-1]*(1-k)),lin);S.gc.showReading(false);
        await sleep(.3);await collect(DATA[n][j],3.2);REC[n][j]=1;await sleep(.6);
      }
      hud('');showAns(`جدول حجم گاز — آزمایش ${E}`,tableHTML());
    }}
  ];
  if(!warm){
    list.push(ansStep('مشاهده','مشاهده‌های خود را بنویسید.','main','مشاهده‌ها',
      'گاز آزادشده از واکنش قرص جوشان با آب، از لولهٔ قیف بالا آمد و درون استوانهٔ مدرج جمع شد. حجم گاز جمع‌شده در آب سرد حدود '+fa(24)+' mL شد (عدد نمونه). حالا آزمایش را با آب گرم در تب بعد تکرار کنید.'));
  }else{
    list.push(
      ansStep('۱','از واکنش قرص جوشان با آب چه گازی آزاد می‌شود؟','main','پاسخ ۱','گاز <b>کربن دی‌اکسید</b> (CO₂).'),
      ansStep('۲','آیا میانگین حجم گاز آزادشده در دو آزمایش یکسان است؟ چرا؟','main','پاسخ ۲','<b>خیر.</b> میانگین حجم گاز در آب گرم (حدود '+fa(37)+' mL) بیشتر از آب سرد (حدود '+fa(24)+' mL) است، چون در آب گرم گاز CO₂ کمتری در آب حل می‌شود و بیشتر آن آزاد و جمع می‌شود.'+tableHTML()),
      ansStep('۳','حجم گاز جمع‌آوری‌شده در کدام آزمایش کمتر است؟','main','پاسخ ۳','در <b>آزمایش ۱ (آب سرد)</b>؛ زیرا بخش بیشتری از گاز در آب سرد حل می‌شود.'),
      ansStep('۴','از مشاهده‌های خود چه نتیجه‌ای می‌گیرید؟ توضیح دهید.','main','پاسخ ۴','با <b>افزایش دمای آب</b>، حجم گاز جمع‌شده بیشتر می‌شود؛ یعنی مقدار گاز حل‌شده در آب کمتر شده است. پس انحلال‌پذیری گاز CO₂ در آب با افزایش دما کم می‌شود.'),
      ansStep('۵','چه رابطه‌ای بین دمای آب و میزان انحلال‌پذیری گاز وجود دارد؟','main','پاسخ ۵','با افزایش دما، انحلال‌پذیری گازها در آب <b>کاهش</b> می‌یابد (رابطهٔ وارونه).'),
      ansStep('۶','چرا در هوای گرم، ماهی‌ها به سطح آب می‌آیند؟','main','پاسخ ۶','در هوای گرم دمای آب بالا می‌رود و انحلال‌پذیری گاز <b>اکسیژن</b> در آب کم می‌شود. ماهی‌ها برای رسیدن به اکسیژن بیشتر به سطح آب می‌آیند.')
    );
  }
  return list;
}

export default {
  cameras:[['main','نمای کلی'],['close','نزدیک'],['top','از بالا']],
  tabs:[
    {id:'exp1',title:'آزمایش ۱',subtitle:'آب سرد',camera:'main',rack:false,dropper:false,setup:()=>setup(0),steps:()=>steps(0)},
    {id:'exp2',title:'آزمایش ۲',subtitle:'آب گرم',camera:'main',rack:false,dropper:false,setup:()=>setup(1),steps:()=>steps(1)}
  ]
};
