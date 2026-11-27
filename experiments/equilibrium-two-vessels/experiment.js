/* «فرایند برگشت‌پذیر تبدیل A به B تا رسیدن به تعادل» — شیمی ۳ (دوازدهم)، فصل ۱، کاوش کنید (صفحهٔ ۲۰ و ۲۱)
   دو ظرف پلاستیکی ۲ لیتری (۱ و ۲)، بشر ۱۰۰ و ۵۰ mL و دو استوانهٔ مدرج ۱۰۰ mL.
   مدل: بشر ۱۰۰ mL (که از ظرف ۱ آب برمی‌دارد) هر بار ۱۰٪ آب ظرف ۱ را می‌برد (۱۰۰ mL از ۱ لیتر)؛
   بشر ۵۰ mL از ظرف ۲ هر بار ۵٪ آب آن را برمی‌گرداند. ظرف ۲ در آغاز خالی است.
   مرجع API: docs/LAB-API.md */
import {
  v3,C,sleep,fa,tween,lin,lerp,moveTo,
  S,CAMS,
  makeTub,fillTub,makeCylinder,cylSetML,cylLevel,makeBeaker,beakerLevel,makeStream,CYL_T,
  camTo,hud,showAns,ansStep
} from '../../core/api.js';

CAMS.main={p:[0,5.2,14.5],t:[0,2.1,.6]};
CAMS.close={p:[0,4.4,10.5],t:[0,2.0,1.4]};

const BLUE=new C(0x2b7de0),AL=.3;
const K1=.1,K2=.05;              // کسر جابه‌جاشده در هر بار (بشر ۱۰۰ و بشر ۵۰)
const LV=v=>v*.0016;             // سطح آب تشت (۱ لیتر ← ۱٫۶)
const T1=-3.4,T2=3.4,TZ=-1.2;    // جای دو ظرف
const HIST=[];
const f0=v=>fa(Math.round(v));
const hudV=()=>hud(`ظرف ۱: ${f0(S.v1)} mL    ظرف ۲: ${f0(S.v2)} mL`);
const setTubs=(a,b)=>{S.v1=a;S.v2=b;S.t1.setLevel(LV(a),BLUE,AL);S.t2.setLevel(LV(b),BLUE,AL);};

function setup(){
  HIST.length=0;
  S.t1=makeTub(T1,TZ,{w:4.6,d:3.0,h:3.0});S.t2=makeTub(T2,TZ,{w:4.6,d:3.0,h:3.0});
  S.v1=0;S.v2=0;
  S.P=makeBeaker(-1.2,4.2,{ml:100,label:'۱۰۰'});S.P.group.scale.setScalar(.8);
  S.Q=makeBeaker(1.2,4.2,{ml:50,label:'۵۰'});S.Q.group.scale.setScalar(.65);
  S.c1=makeCylinder(-4.6,3.6,{ml:100,label:'۱'});S.c2=makeCylinder(4.6,3.6,{ml:100,label:'۲'});
  S.home={P:v3(-1.2,0,4.2),Q:v3(1.2,0,4.2),c1:v3(-4.6,0,3.6),c2:v3(4.6,0,3.6)};
}
const bset=(b,ml,dur)=>{const l0=b.level,l1=ml<=.01?0:beakerLevel(b,ml);
  return tween(dur,k=>b.addLiquid(lerp(l0,l1,k)-b.level,BLUE,AL),lin);};
const tub=i=>i===1?S.t1:S.t2;
const tx=i=>i===1?T1:T2;

/* ---------- ریختن واقعی: ظرف طوری کج می‌شود که لبه‌اش بالای مقصد باشد و جریان آب از لبه می‌ریزد ---------- */
const LANE={P:-.8,Q:.8};          // مسیر جدا برای دو بشر تا همزمان به هم نخورند
const rim=v=>({R:(v.innerR||.7)+.04,H:(v.H||1.6)});
/* مکان پایهٔ ظرف برای آن‌که لبه‌اش (سمت side) دقیقاً در (X,Y,Z) باشد، با کج‌شدن θ */
function lipPose(v,X,Y,Z,side,theta){
  const {R,H}=rim(v),sc=v.group.scale.x,phi=side>0?-theta:theta;
  const lx=side*R*sc,ly=H*sc,ox=lx*Math.cos(phi)-ly*Math.sin(phi),oy=lx*Math.sin(phi)+ly*Math.cos(phi);
  return {pos:v3(X-ox,Y-oy,Z),phi};
}
/* جریان واقعی از لبه تا سطح مایع مقصد؛ setSrc(k) سطح مبدأ و setDst(k) سطح مقصد را برای k از ۰ تا ۱ به‌روز می‌کند */
async function pourOut(v,X,Z,lipY,side,theta,surfY,setSrc,setDst,dur){
  const st=makeStream(),pose=lipPose(v,X,lipY,Z,side,theta);
  let live=true;
  const biasLoop=(async()=>{while(live){v.slosh.bias[0]=-Math.tan(v.group.rotation.z);await sleep(.03);}})();   // سطح مایع افقی می‌ماند
  await moveTo(v.group,v3(pose.pos.x,pose.pos.y+.9,pose.pos.z),1.5,{x:0,y:0,z:pose.phi*.3},.5);
  await moveTo(v.group,pose.pos,.8,{x:0,y:0,z:pose.phi});          // کج‌شدن آرام
  await tween(dur,k=>{
    setSrc(k);setDst(k);
    /* مکان واقعی لبه در همین لحظه: جریان دقیقاً از لبهٔ ظرف شروع می‌شود، نه از پایین یا وسط آن */
    const {R,H}=rim(v),sc=v.group.scale.x,ph=v.group.rotation.z,p=v.group.position;
    const lx=side*R*sc,ly=H*sc,lipX=p.x+lx*Math.cos(ph)-ly*Math.sin(ph),lipYNow=p.y+lx*Math.sin(ph)+ly*Math.cos(ph);
    const f=1-k,sy=typeof surfY==='function'?surfY():surfY;
    if(f>.02&&lipYNow>sy+.15&&Math.abs(ph)>Math.abs(pose.phi)*.85)st.set(lipX,lipYNow-.02,sy,p.z,.012+.03*Math.sqrt(f),BLUE,.5*Math.min(1,f*5+.2));
    else st.hide();
  },lin);
  st.hide();live=false;await biasLoop;
  v.slosh.bias[0]=0;
  await moveTo(v.group,v3(pose.pos.x,pose.pos.y+.6,pose.pos.z),.7,{x:0,y:0,z:pose.phi*.2});
}

/* بشر از ظرف i آب برمی‌دارد (غوطه‌ور می‌شود و پر می‌شود) */
async function scoop(bk,i,amt,d,lane){
  const t=tub(i),z=TZ+lane;
  await moveTo(bk.group,v3(tx(i),3.9,z),1.1*d,{x:0,y:0,z:0},.5);
  await moveTo(bk.group,v3(tx(i),Math.max(.5,t.surfaceY-.8),z),.7*d);
  const v=(i===1?S.v1:S.v2)-amt,l0=t.level;
  await Promise.all([bset(bk,amt,.7*d),tween(.7*d,k=>t.setLevel(lerp(l0,LV(v),k),BLUE,AL),lin)]);
  i===1?S.v1=v:S.v2=v;hudV();
  await moveTo(bk.group,v3(tx(i),3.9,z),.7*d);
}
/* بشر محتویاتش را در ظرف j می‌ریزد */
async function pourInto(bk,j,amt,lane,lipY,d){
  const t=tub(j),side=j===2?1:-1,l0=t.level,v0=j===1?S.v1:S.v2,b0=bk.level;
  await pourOut(bk,tx(j),TZ+lane,lipY,side,.62,()=>t.surfaceY,
    k=>{const l1=beakerLevel(bk,amt*(1-k));bk.addLiquid((k>=1?0:l1)-bk.level,BLUE,AL);if(k>=1)bk.addLiquid(-bk.level,BLUE,AL);},
    k=>{const v=v0+amt*k;t.setLevel(LV(v),BLUE,AL);j===1?S.v1=v:S.v2=v;},1.8*d);
  hudV();
}
const goHome=(bk,p,d)=>moveTo(bk.group,p,1.3*d,{x:0,y:0,z:0},.5);

/* دور با بشر (مرحلهٔ ۳ و دورهای سریع) */
async function roundBeaker(n,d=1){
  const a1=K1*S.v1,a2=K2*S.v2;
  await Promise.all([scoop(S.P,1,a1,d,LANE.P),scoop(S.Q,2,a2,d,LANE.Q)]);
  await Promise.all([pourInto(S.P,2,a1,LANE.P,4.4,d),pourInto(S.Q,1,a2,LANE.Q,5.8,d)]);
  await Promise.all([goHome(S.P,S.home.P,d),goHome(S.Q,S.home.Q,d)]);
  HIST.push([n,S.v1,S.v2,a1,a2]);
}
/* دور با استوانهٔ مدرج: ابتدا حجم‌ها در استوانه‌ها اندازه‌گیری و مقایسه می‌شود، سپس با استوانه‌ها جابه‌جا می‌شوند */
async function roundCyl(n){
  const a1=K1*S.v1,a2=K2*S.v2;
  await Promise.all([scoop(S.P,1,a1,1,LANE.P),scoop(S.Q,2,a2,1,LANE.Q)]);
  /* ریختن بشرها در استوانه‌ها (جریان از لبهٔ بشر تا سطح آب استوانه) */
  const toCyl=(bk,c,amt,side)=>pourOut(bk,c.group.position.x,c.group.position.z,3.95,side,.6,()=>Math.max(c.level,CYL_T+.06),
    k=>{const l1=beakerLevel(bk,amt*(1-k));bk.addLiquid((k>=1?0:l1)-bk.level,BLUE,AL);if(k>=1)bk.addLiquid(-bk.level,BLUE,AL);},
    k=>{c.addLiquid(cylLevel(c,amt*k)-c.level,BLUE,AL);},1.4);
  await Promise.all([toCyl(S.P,S.c1,a1,1),toCyl(S.Q,S.c2,a2,-1)]);
  await Promise.all([goHome(S.P,S.home.P,1),goHome(S.Q,S.home.Q,1)]);
  await camTo('close');
  hud(`حجم جابه‌جاشده از ظرف ۱ به ۲: ${f0(a1)} mL    از ظرف ۲ به ۱: ${f0(a2)} mL`);
  await sleep(2.2);
  /* جابه‌جایی با استوانه‌ها، یکی‌یکی؛ آب از لبهٔ استوانه در ظرف مقصد می‌ریزد */
  const carry=async(c,home,j,amt)=>{
    const t=tub(j),side=j===2?1:-1,v0=j===1?S.v1:S.v2;
    await pourOut(c,tx(j),TZ,5.7,side,1.0,()=>t.surfaceY,
      k=>{c.addLiquid((k>=1?0:cylLevel(c,amt*(1-k)))-c.level,BLUE,AL);if(k>=1)c.addLiquid(-c.level,BLUE,AL);},
      k=>{const v=v0+amt*k;t.setLevel(LV(v),BLUE,AL);j===1?S.v1=v:S.v2=v;},2.0);
    await moveTo(c.group,home,1.6,{x:0,y:0,z:0},.5);
  };
  await camTo('main');
  await carry(S.c1,S.home.c1,2,a1);await carry(S.c2,S.home.c2,1,a2);hudV();
  HIST.push([n,S.v1,S.v2,a1,a2]);
}
/* ادامهٔ جابه‌جایی تا برابر شدن حجم‌های جابه‌جاشده (محاسبه‌شده) */
function equilibrium(){
  let a=S.v1,b=S.v2,n=HIST.length;
  while(n<60){const t1=K1*a,t2=K2*b;a+=t2-t1;b+=t1-t2;n++;
    if(n%5===0||Math.abs(t1-t2)<.3)HIST.push([n,a,b,t1,t2]);if(Math.abs(t1-t2)<.3)break;}
  return {a,b,n};
}
const tableHTML=()=>'<table style="width:100%;text-align:center;border-collapse:collapse;font-size:.88em"><tr><td>دور</td><td>ظرف ۱ (mL)</td><td>ظرف ۲ (mL)</td><td>۱←۲ (mL)</td><td>۲←۱ (mL)</td></tr>'
  +HIST.map(r=>`<tr><td>${fa(r[0])}</td><td>${f0(r[1])}</td><td>${f0(r[2])}</td><td>${f0(r[3])}</td><td>${f0(r[4])}</td></tr>`).join('')
  +'</table><small>عددها نتیجهٔ مدل ساده‌ای از جابه‌جایی‌اند؛ در آزمایش واقعی کمی متفاوت‌اند.</small>';

function steps(){
  return [
    {tag:'۱ و ۲',text:'دو ظرف پلاستیکی دو لیتری را شماره‌گذاری کنید و درون یکی (ظرف ۱) حدود یک لیتر آب بریزید. به ظرف محتوی آب چند قطره رنگ خوراکی بیفزایید.',run:async()=>{
      await camTo('main');
      await fillTub(S.t1,LV(1000),new C(0xdcefff),.05,2.4);S.v1=1000;
      const l=S.t1.level;
      await tween(1.8,k=>S.t1.setLevel(l,new C(0xdcefff).lerp(BLUE,k),.05+(AL-.05)*k),lin);
      hudV();await sleep(.8);
    }},
    {tag:'۳',text:'با بشر ۱۰۰ میلی‌لیتری از محتویات ظرف (۱) بردارید و به ظرف (۲) بریزید؛ همزمان با بشر ۵۰ میلی‌لیتری از محتویات ظرف (۲) بردارید (ظرف خالی) و به ظرف (۱) بریزید.',run:async()=>{
      await camTo('main');await roundBeaker(1);await sleep(.6);
    }},
    ansStep('۳ (پرسش)','محتویات کدام ظرف را می‌توان به‌عنوان فراورده در نظر گرفت؟ چرا؟','main','پاسخ',
      'محتویات <b>ظرف ۲</b> را فراورده در نظر می‌گیریم؛ چون در آغاز خالی بود و با انتقال آب از ظرف ۱ (واکنش‌دهنده) به آن، مقدار آن افزایش یافت. انتقال آب از ظرف ۱ به ۲ مانند واکنش رفت و انتقال از ظرف ۲ به ۱ مانند واکنش برگشت است.'),
    {tag:'۴',text:'جابه‌جایی محتویات دو ظرف را با همین روند ادامه دهید، اما پیش از اینکه هر بار به ظرف دیگر منتقل کنید، نخست آنها را در دو استوانهٔ مدرج بریزید و پس از مقایسهٔ حجم آنها، محلول‌ها را با استوانهٔ مدرج جابه‌جا کنید.',run:async()=>{
      await camTo('main');await roundCyl(2);await roundCyl(3);
    }},
    ansStep('۴ (پرسش)','دلیل این عمل را توضیح دهید.','main','پاسخ',
      'با ریختن آب در استوانهٔ مدرج، <b>حجم آبی که در هر بار جابه‌جا می‌شود اندازه‌گیری و مقایسه</b> می‌شود. حجم جابه‌جاشده از ظرف ۱ به ۲ در هر دور کمتر و از ظرف ۲ به ۱ بیشتر می‌شود. اگر هر بار از بشر استفاده می‌کردیم، حجم دقیق آب جابه‌جاشده را نمی‌دانستیم.'),
    {tag:'۵',text:'سرانجام به مرحله‌ای خواهید رسید که حجم محلول‌های جابه‌جاشده میان دو ظرف برابر و مقدار محتویات هر ظرف ثابت خواهد ماند، اما مقدار این محتویات با هم برابر نیست.',run:async()=>{
      await camTo('main');
      for(let n=4;n<=6;n++)await roundBeaker(n,.35);
      hud('چند دور دیگر…');
      const e=equilibrium();
      const a0=S.v1,b0=S.v2;
      await tween(4,k=>{const x=k*k*(3-2*k);setTubs(lerp(a0,e.a,x),lerp(b0,e.b,x));},lin);
      hudV();await sleep(1.2);
      hud(`حجم‌های جابه‌جاشده برابر شدند (حدود ${f0(K1*e.a)} mL در هر جهت)`);await sleep(2);
    }},
    {tag:'۵ (جدول)',text:'حجم محتویات دو ظرف و حجم جابه‌جاشده را در هر دور بررسی کنید.',ans:true,run:async()=>{await camTo('main');showAns('جدول داده‌ها',tableHTML());await sleep(.4);}},
    ansStep('۶','دربارهٔ درستی نتیجهٔ زیر گفت‌وگو کنید: «در یک واکنش برگشت‌پذیر که همزمان واکنش‌های رفت و برگشت به‌طور پیوسته انجام می‌شوند، سرانجام مقدار واکنش‌دهنده‌ها و فراورده‌ها ثابت می‌ماند».','main','گفت‌وگو',
      'نتیجه <b>درست</b> است. وقتی <b>سرعت رفت و برگشت برابر</b> شود، هر مقداری که در واحد زمان تولید می‌شود، همزمان به همان اندازه مصرف می‌شود؛ پس مقدار مواد ثابت می‌ماند، اما فرایند متوقف نشده است (<b>تعادل پویا</b>). در آزمایش، حجم جابه‌جاشده در دو جهت برابر شد و مقدار آب در هر ظرف ثابت ماند (حدود ۳۳۳ و ۶۶۷ mL)، ولی این دو مقدار با هم برابر نیستند.')
  ];
}

export default {
  cameras:[['main','نمای کلی'],['close','نزدیک']],
  tabs:[{id:'main',title:'کاوش',camera:'main',rack:false,dropper:false,wash:false,spoon:false,setup,steps}]
};
