/* «پاک‌کنندگی صابون در آب‌های گوناگون» — شیمی ۳ (دوازدهم)، فصل ۱، کاوش کنید (صفحهٔ ۸ و ۹)
   سه بشر: آب مقطر، آب + Mg²⁺ ، آب + Ca²⁺ ؛ مقایسهٔ ارتفاع کف. مرجع API: docs/LAB-API.md */
import {
  v3,lerp,easeOut,tween,sleep,fa,
  S,world,placeJar,CAMS,SPECIES,PRECIPITATE,
  makeBeaker,beakerLevel,makeStirRod,stirBeaker,addFoam,CM,makeRuler,ruleBeside,ruleHome,
  scoopInto,pourWater,camTo,hud,showAns,ansStep,eq
} from '../../core/api.js';

CAMS.beakers={p:[0,3.4,9.2],t:[0,1.1,.4]};
CAMS.near={p:[0,2.6,6.2],t:[0,1.0,.4]};

const X=[-2.8,0,2.8], BZ=.5, JZ=-2.4;
const SOAP=SPECIES.soap.powder, SCUM=PRECIPITATE['soap-scum'];
/* ارتفاع کف (سانتی‌متر): داده‌های نمونه برای شبیه‌سازی؛ در آزمایش واقعی اندازه می‌گیرند */
const FOAM_CM=[4.0,1.0,0.8];
const lid=i=>v3(X[i]-1.45,.11,JZ+1.0);   // درپوش جلوی ظرف خودش، دور از بطری شوینده

function setup(){
  S.jarSoap=placeJar('soap',X[0],JZ);
  S.jarMg=placeJar('MgCl2',X[1],JZ);
  S.jarCa=placeJar('CaCl2',X[2],JZ);
  S.rod=makeStirRod();
  S.beakers=[];S.foams=[];
  S.ruler=makeRuler(5.4,1.6,{cm:6,zeroY:beakerLevel({ml:100},50)});
}

const soapInto=async i=>{await scoopInto(S.jarSoap,S.beakers[i],SOAP,150,lid(0));};

function steps(){
  return [
    {tag:'۱',text:'سه بشر ۱۰۰ میلی‌لیتری بردارید و آن‌ها را از ۱ تا ۳ شماره‌گذاری کنید.',run:async()=>{
      await camTo('beakers');
      for(let i=0;i<3;i++){
        const b=makeBeaker(X[i],BZ,{ml:100,label:fa(i+1)});S.beakers[i]=b;S.foams[i]=addFoam(b);
        b.group.position.y=5.5;
        await tween(.7,k=>{b.group.position.y=lerp(5.5,0,k);},easeOut);
      }
    }},
    {tag:'۲',text:'درون هر بشر ۵۰ میلی‌لیتر آب مقطر و یک قاشق چایخوری صابون رنده‌شده بریزید.',run:async()=>{
      for(let i=0;i<3;i++){
        await pourWater(S.beakers[i],beakerLevel(S.beakers[i],50),'beakers');
      }
      for(let i=0;i<3;i++){
        await soapInto(i);
      }
    }},
    {tag:'۳',text:'به بشر شمارهٔ ۲ نصف قاشق چایخوری منیزیم کلرید و به بشر شمارهٔ ۳ نصف قاشق چایخوری کلسیم کلرید بیفزایید.',run:async()=>{
      await scoopInto(S.jarMg,S.beakers[1],SPECIES.MgCl2.powder,110,lid(1));
      await scoopInto(S.jarCa,S.beakers[2],SPECIES.CaCl2.powder,110,lid(2));
    }},
    {tag:'۴',text:'محتویات هر بشر را به مدت ۳۰ ثانیه و با سرعتی برابر به هم بزنید.',run:async()=>{
      for(let i=0;i<3;i++){
        const b=S.beakers[i],f=S.foams[i],n0=b.solid.count;let em=0;
        await camTo('near');
        hud(`در حال هم زدن بشر ${fa(i+1)}…`);
        await stirBeaker(b,S.rod,3.2,k=>{
          f.set(FOAM_CM[i]*CM*easeOut(Math.min(1,k*1.2)));
          b.solid.setActive(n0*(1-.8*k));
          if(i>0){const want=Math.floor(k*(i===1?420:380));if(want>em){b.suspend(want-em,SCUM);em=want;}}
        });
      }
      hud('');
      await camTo('beakers');
      await sleep(.6);
    }},
    {tag:'۴',text:'ارتفاع کف ایجادشده را اندازه‌گیری و در جدول یادداشت کنید.',run:async()=>{
      await camTo('beakers');
      for(let i=0;i<3;i++){
        const b=S.beakers[i];
        await ruleBeside(S.ruler,b,{side:-1,gap:.4});
        S.ruler.mark(FOAM_CM[i]*CM);
        hud(`بشر ${fa(i+1)}: ارتفاع کف ≈ ${fa(FOAM_CM[i].toFixed(1).replace('.','٫'))} cm`);
        await sleep(1.4);
        S.ruler.mark(0);
      }
      await ruleHome(S.ruler);hud('');
      showAns('جدول مشاهده‌ها (داده‌های نمونه)',
        '<table style="width:100%;text-align:center;border-collapse:collapse"><tr><td>شمارهٔ بشر</td><td>۱</td><td>۲</td><td>۳</td></tr>'
        +`<tr><td>ارتفاع کف (cm)</td><td>${fa('4٫0')}</td><td>${fa('1٫0')}</td><td>${fa('0٫8')}</td></tr></table>`
        +'<small>عددها نمونه‌اند؛ در آزمایش واقعی بسته به صابون و آب کمی تفاوت دارند.</small>');
    }},
    ansStep('الف','از این داده‌ها چه نتیجه‌ای می‌گیرید؟','beakers','نتیجه',
      'در <b>آب مقطر</b> (بشر ۱) صابون به‌خوبی کف می‌کند، اما در بشرهایی که <b>یون‌های Mg²⁺ یا Ca²⁺</b> دارند (بشر ۲ و ۳) کف بسیار کمتر است. پس صابون در آب‌هایی که این یون‌ها را دارند (آب سخت) کارایی پاک‌کنندگی کمتری دارد.'),
    ansStep('ب','با توجه به معادله‌های شیمیایی، توضیح دهید چرا ارتفاع کف در ظرف ۲ و ۳ کمتر از ظرف ۱ است؟','near','توضیح',
      'یون‌های <b>Mg²⁺</b> و <b>Ca²⁺</b> با آنیون صابون (RCOO⁻) نمک‌های <b>نامحلول</b> می‌سازند و به‌صورت رسوب (جرم صابون) ته‌نشین می‌شوند. بدین ترتیب بخشی از صابون مصرف می‌شود و مقدار صابون محلول برای تولید کف و پاک‌کنندگی کم می‌شود.'
      +eq('2RCOONa(aq) + MgCl<sub>2</sub>(aq) → (RCOO)<sub>2</sub>Mg(s) + 2NaCl(aq)')
      +eq('2RCOONa(aq) + CaCl<sub>2</sub>(aq) → (RCOO)<sub>2</sub>Ca(s) + 2NaCl(aq)'))
  ];
}

export default {
  cameras:[['beakers','نمای کلی'],['near','نزدیک'],['top','از بالا']],
  tabs:[{id:'main',title:'کاوش',camera:'beakers',rack:false,dropper:false,setup,steps}]
};
