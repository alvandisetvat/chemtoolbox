/* قالب آزمایش — این پوشه را کپی کنید، نام پوشه را به شناسهٔ آزمایش (مثل soap-hard-water) تغییر دهید
   و meta.json و این فایل را ویرایش کنید. مرجع کامل API: docs/LAB-API.md
   قواعد: فقط از '../../core/api.js' import کنید؛ هیچ آدرس اینترنتی (CDN) در فایل نباشد. */
import {
  C,sleep,tween,lerp,easeOut,RACK_Y,
  S,makeTube,placeBottle,fillTube,
  SPECIES,PRECIPITATE,NAOHC,precipitate,
  camTo,ansStep,eq,
  fetchFromBottle,dropwise,dropperHome
} from '../../core/api.js';

/* ---------- چیدمان اولیهٔ میز ---------- */
function setup(){
  S.naoh=placeBottle('NaOH',-3.9);          // بطری محلول سمت چپ میز
}

/* ---------- مراحل ----------
   هر مرحله: {tag:'الف', text:'متن کتاب', run: async()=>{...}}
   مرحلهٔ پاسخ: ansStep(tag, text, نام‌دوربین, عنوان کارت, HTML پاسخ) */
function steps(){
  return [
    {tag:'الف',text:'یک لولهٔ آزمایش بردارید و تا نیمه از محلول مس (II) سولفات پر کنید.',run:async()=>{
      await camTo('rack');
      const t=makeTube(0,'۱','لوله');
      t.group.position.y=5.8;
      await tween(.85,k=>{t.group.position.y=lerp(5.8,RACK_Y,k);},easeOut);
      t.sticker.visible=true;
      fillTube(t,'CuSO4',1.4);
      await sleep(.6);
    }},
    {tag:'ب',text:'قطره‌قطره محلول سدیم هیدروکسید به لوله بیفزایید.',run:async()=>{
      const t=S.tubes[0];
      t.precipColor.setHex(precipitate('Cu(OH)2'));
      await fetchFromBottle(S.naoh,new C(SPECIES.NaOH.sol),0);
      await camTo('tube1');
      await dropwise(t,8,()=>{
        t.addLiquid(.03,NAOHC,.02);
        t.precip.spawn(150,t.level-.03,.05,PRECIPITATE['Cu(OH)2'],-.25);
      },i=>'تشکیل رسوب');
      await sleep(3);
      await dropperHome();
    }},
    ansStep('پ','مشاهده‌های خود را بنویسید.','tube1','مشاهده‌ها',
      'محلول آبی‌رنگ است و با افزودن NaOH <b>رسوب آبی</b> تشکیل می‌شود.'
      +eq('CuSO<sub>4</sub>(aq) + 2NaOH(aq) → Cu(OH)<sub>2</sub>(s) + Na<sub>2</sub>SO<sub>4</sub>(aq)'))
  ];
}

export default {
  tabs:[
    {id:'main',title:'آزمایش',camera:'overview',setup,steps}
  ]
};
