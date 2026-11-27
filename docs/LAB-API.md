# مرجع API نویسندگان آزمایش (LAB-API)

> این فایل را همراه با `experiments/iron-ions/experiment.js` و `core/chemistry.js` به هوش مصنوعی بدهید.
> فقط همین API مجاز است. اگر کاری با این API ممکن نیست، به «یکپارچه‌ساز» اطلاع بدهید؛ در `core/` تغییر ندهید.

## ۱. قرارداد پوشه

هر آزمایش یک پوشه است: `experiments/<id>/`

| فایل | شرح |
|---|---|
| `meta.json` | شناسنامه (بخش ۲) |
| `experiment.js` | منطق آزمایش؛ `export default {tabs:[...]}` |
| فایل‌های کمکی دلخواه | مثل `nail.js`، فقط داخل همین پوشه |

`<id>`: حروف کوچک انگلیسی، عدد و خط تیره (مثل `soap-hard-water`).

قواعد سخت (بررسی خودکار با `node tools/build-index.mjs`):
- فقط از `'../../core/api.js'` و فایل‌های همین پوشه import کنید.
- هیچ آدرس اینترنتی (http/https)، `fetch`، `eval`، `localStorage` و `document.write` در کد نباشد.
- حجم `experiment.js` کمتر از ۳۰۰ کیلوبایت.
- متن‌ها فارسی؛ ارقام با `fa(n)`؛ فرمول‌ها با `<sub>` و `<sup>` در HTML.

## ۲. meta.json

```json
{
  "id": "iron-ions",
  "title": "شناسایی یون‌های آهن",
  "question": "چگونه می‌توان فلز موجود در یک نمونه را شناسایی کرد؟",
  "book": "شیمی ۲", "grade": 11, "chapter": 1, "page": 19,
  "activity": "کاوش کنید (۱)",
  "category": "solution",
  "difficulty": 2,
  "author": "نام و نام خانوادگی",
  "version": "1.0.0",
  "tags": ["آهن", "رسوب"],
  "materials": ["آهن (II) کلرید", "لولهٔ آزمایش"]
}
```

- `category`: `solution` (لوله و محلول) | `apparatus` (دستگاهی و داده‌ای) | `concept` (مفهومی)
- `difficulty`: ۱ تا ۳
- `question`: عین جملهٔ «دربارهٔ اینکه … کاوش کنید» کتاب
- `materials`: عین فهرست «مواد و وسایل» کتاب

## ۳. ساختار experiment.js

```js
import {S, makeTube, placeJar, camTo, ansStep /* ... */} from '../../core/api.js';

function setup(){ /* چیدمان میز؛ هر بار آزمایش (یا تب) شروع/بازنشانی می‌شود */ }
function steps(){
  return [
    {tag:'الف', text:'متن مرحله مطابق کتاب', run: async()=>{ /* انیمیشن */ }},
    ansStep('ب','پرسش کتاب','tube1','عنوان کارت','پاسخ <b>HTML</b>')
  ];
}
export default { tabs:[ {id:'main', title:'آزمایش ۱', subtitle:'توضیح کوتاه', camera:'overview', setup, steps} ] };
```

- گزینه‌های اختیاری تب: `rack:false` (نگه‌دارندهٔ لوله مخفی شود) و `dropper:false` (قطره‌چکان مخفی شود)، `wash:false` (شیشهٔ آب مقطر) و `spoon:false` (قاشقک). اگر آزمایش لوله یا قطره‌چکان ندارد حتماً بگذارید تا ابزار اضافه در صحنه نماند.
- هر «تب» یک آزمایش از کاوش است (مثلاً «آزمایش ۱ تا ۴»). اگر فقط یکی است، تب مخفی می‌شود.
- `S` شیء حالت است و با هر `setup` پاک می‌شود. هر چه لازم دارید در آن نگه دارید (`S.naoh=...`).
- `tag` برچسب مرحله (الف، ب (۱) …). `text` متن مرحله در پنل.
- مرحلهٔ پاسخ: `ansStep(tag,text,cameraName,title,htmlBody)`؛ معادله: `eq('FeCl<sub>2</sub>(aq) + … → …')`.
- دوربین‌ها (`camTo(name)`): `overview`، `rack`، `tube1`، `tube3`، `left`، `top`.
- هر `run` باید async باشد و در پایان همهٔ انیمیشن‌هایش تمام شده باشد (`await`).

## ۴. چیدمان میز

دستگاه مختصات: x چپ/راست (منفی = چپ)، y بالا، z به سمت بیننده. میز در y=0.

| جایگاه | مختصات |
|---|---|
| رک لوله: ۳ جایگاه | x = ‎-1.2، 0، 1.2 (slot ۰، ۱، ۲) در z=0 |
| ظرف ماده سمت چپ / راست | x ≈ ‎-3.9 / ‎3.7، z=0.3 |
| قاشقک (استراحت) | (1.7, 0.075, 2.9) |
| قطره‌چکان (استراحت) | (‎-1.9, 0.16, 2.8) |
| شیشهٔ آب مقطر (استراحت) | (4.9, 0, ‎-1.5) |

```js
makeTube(slot, big, small, showSticker=false)   // لولهٔ آزمایش؛ big=متن درشت برچسب ('۱' یا 'NaOH')، small=متن کوچک
placeJar(speciesId, x, z=.3)                    // ظرف پودر/قرص؛ برمی‌گرداند {group,lid}
placeBottle(speciesId, x, z=.3)                 // بطری محلول
fillTube(tube, speciesId, volume=1.3)           // لوله را با محلول ماده پر می‌کند
addToBench(object3d)                            // هر شیء سه‌بعدی؛ با بازنشانی حذف می‌شود
```

ارتفاع لوله ۳٫۲ است. «تا نیمه» ≈ ‎1.6 و حداکثر مایع حدود ‎2.6.

## ۵. فرهنگ مواد (core/chemistry.js)

رنگ‌ها فقط از اینجا گرفته می‌شوند: `SPECIES[id]` → `{formula,name,powder,sol,solA,kind}` و `PRECIPITATE[name]` → رنگ رسوب.
با `species('FeCl2')` و `precipitate('Fe(OH)2')` (خطای گویا در صورت نبود). ماده یا رنگ تازه لازم دارید؟ از یکپارچه‌ساز بخواهید به این فایل اضافه کند.

## ۶. کنش‌ها (همه async؛ حتماً await)

| تابع | کار |
|---|---|
| `camTo(name, dur=1.5)` | دوربین را به نمای از پیش تعریف‌شده می‌برد |
| `scoopInto(jar, tube, hex, amount=260)` | درب را برمی‌دارد، با قاشقک از ظرف برمی‌دارد و در لوله می‌ریزد (جامد در ته لوله) |
| `pourWater(tube, level)` | با شیشهٔ آب مقطر تا ارتفاع `level` آب می‌ریزد |
| `shake(tube, onK, dur=2.6)` | لوله را تکان می‌دهد؛ `onK(k)` با k از ۰ تا ۱ برای حل‌شدن/تغییر رنگ |
| `fetchFrom(srcTube, dv)` | با قطره‌چکان از لوله برمی‌دارد (dv≈0.5 یعنی حدود ۱ میلی‌لیتر) |
| `fetchFromBottle(bottle, color, alpha)` | با قطره‌چکان از بطری برمی‌دارد |
| `pourFromDropper(destTube, dv)` | محتوای قطره‌چکان را یک‌جا در لوله می‌ریزد |
| `dropwise(destTube, n, onDrop(i), labelFn(i))` | n قطره، یکی‌یکی؛ در هر قطره `onDrop` اجرا می‌شود و پیام HUD نشان داده می‌شود |
| `dropperHome()` / `spoonHome()` | ابزار را به جای خود برمی‌گرداند |
| `pourSpoon(tube, hex, amount)` | قاشقک (که در دست است) را در لوله خالی می‌کند |
| `hud(text)` | پیام کوتاه بالای صفحه (برای پاک‌کردن: `hud('')`) |

انیمیشن‌های عمومی: `await tween(seconds, k=>{...0→1...}, easeFn)`، `await sleep(seconds)`، `await moveTo(obj3d, v3(x,y,z), seconds, {x,y,z چرخش}, arcHeight)`.
توابع نرمی: `easeIO`، `easeOut`، `lin`، `lerp(a,b,k)`، `clamp(v,a,b)`، `rnd(a,b)`، `v3(x,y,z)`، `fa(n)`، `TAU`، `C` (رنگ THREE).

## ۷. لوله (Tube) و رسوب

```js
const t = makeTube(0,'۱','لوله',true);
t.addLiquid(dv, new C(hex), alpha)   // افزودن مایع با رنگ و غلظت؛ مایع‌ها با هم مخلوط می‌شوند
t.level                               // ارتفاع مایع
t.precipColor.setHex(PRECIPITATE['Fe(OH)2'])  // رنگ رسوب برای این لوله (قبل از spawn)
t.precip.spawn(count, y0, spread, hex, vy0)   // رسوب: ذره‌های ریزِ معلق که کم‌کم ته‌نشین می‌شوند
t.solid.spawn(...)  /  t.solid.setActive(n)   // جامد درشت ته لوله (حل‌شدن: setActive را کم کنید)
t.color / t.alpha                     // رنگ و غلظت مایع (برای تغییر رنگ تدریجی با tween)
t.sticker.visible                     // برچسب شماره
```

نمونهٔ رسوب‌گیری (۸ قطره):
```js
t.precipColor.setHex(precipitate('Cu(OH)2'));
await dropwise(t, 8, ()=>{ t.addLiquid(.03,NAOHC,.02); t.precip.spawn(150,t.level-.03,.05,PRECIPITATE['Cu(OH)2'],-.25); });
```

## ۸. بشر، همزن، آب گازدار و کاغذ pH

```js
const b = makeBeaker(x, z, {label:'متن برچسب', grad:true});  // بشر مدرج (۲۵۰ mL)؛ همان رابط لوله را دارد
b.group.position.y = 5.8; await tween(.9,k=>{b.group.position.y=lerp(5.8,0,k);},easeOut);   // ورود به صحنه
await pourWater(b, .95, 'beaker');          // آب تا ارتفاع ۰٫۹۵ (حدود نیمه)؛ آرگومان سوم نام دوربین
await scoopInto(jar, b, hex, 200, v3(x,.11,z));  // آرگومان آخر: جای درب ظرف (برای جلوگیری از برخورد)
b.suspend(700, PRECIPITATE['Ca(OH)2']);     // کدورت/شیری‌شدن؛ b.solid.setActive(n) برای حل‌شدن جامد
const rod = makeStirRod();                  // میلهٔ همزن (افتاده روی میز)
await stirBeaker(b, rod, 3.6, k=>{ /* k از ۰ تا ۱ */ });

const soda = makeBottle('CO₂','آب گازدار'); addToBench(soda.group); addFizz(soda,{y0:.2,y1:1.1,r:.4}); // حباب‌ها

const chart = makePHChart();  const pack = makePHPack();    // مقیاس رنگی و بستهٔ کاغذ (آن‌ها را جابه‌جا کنید)
const s = await takePHStrip(pack);                           // نوار تازه
await dipPHPaper(s, beakerTarget(b), 12.4);                  // یا bottleTarget(soda)؛ رنگ نوار با pH عوض می‌شود
await compareWithChart(s, chart, 12.4);                      // نوار کنار مقیاس + نشانگر
```
- رنگ نوار از `phColor(pH)` (۱ تا ۱۴) می‌آید. pH را خودتان از دانش شیمی بدهید (مثلاً آب‌آهک ≈ ‎12.4، آب گازدار ≈ ‎3.9، آب خالص = ۷).
- دوربین جدید اضافه کنید: `CAMS.beaker={p:[x,y,z], t:[x,y,z]}` (p موقعیت دوربین، t نقطهٔ نگاه) و در `export default` فهرست `cameras:[['overview','نمای کلی'],['beaker','بشر']]`.
- حباب و هر انیمیشن مداوم دیگر: `addUpdater(dt=>{...})` (با بازنشانی پاک می‌شود).

## ۹. محدودیت‌های نسخهٔ فعلی (قطعهٔ جدید لازم است)

لولهٔ آزمایش (تا ۳ عدد)، بشر، میلهٔ همزن، ظرف‌های پودر/قرص، بطری، قاشقک، قطره‌چکان، شیشهٔ آب مقطر، آب گازدار (حباب) و کاغذ pH **آماده‌اند**.
**هنوز نیست:** استوانهٔ مدرج، قیف، چراغ الکلی/شعله، دماسنج، ترازو، مدار الکتریکی/LED، قوطی فیلم، نمودار.
قطعهٔ جدید باید یک بار در `core/` ساخته شود (توسط یکپارچه‌ساز) تا در همهٔ آزمایش‌ها یک‌دست باشد؛ در پوشهٔ آزمایش قطعهٔ جدید نسازید مگر تک‌منظوره (مثل `nail.js`).

## ۱۰. ایمنی و کیفیت

- نکته‌های ایمنی کتاب (عینک، دستکش، فاصله) را با `hud()` یا در متن مرحله یادآوری کنید.
- تصویر و متن کتاب را کپی نکنید؛ متن مرحله را بازنویسی یا کوتاه کنید.
- پیش از تحویل: `playground.html` ← «آزمون خودکار» سبز باشد و چک‌لیست کامل شود.

## ۱۱. قطعه‌های جدید هسته (ظرف‌ها و ابزارها)

همه از `../../core/api.js` import می‌شوند. نمونه‌های کامل و اجرایی: `experiments/food-energy/experiment.js` (ترازو، دماسنج، چراغ)، `experiments/gas-solubility-temp/experiment.js` (استوانه، قیف، تشت) و `experiments/graphene-conductivity/experiment.js` (مدار LED و سیم).
همهٔ ظرف‌ها (بشر، استوانه) همان رابط لوله را دارند، پس `pourWater`، `scoopInto`، `pourFromDropper` و … روی آن‌ها کار می‌کنند.

**استوانهٔ مدرج**
- `makeCylinder(x,z,{ml:100,label:''})` ← ظرف (ml می‌تواند ۲۵، ۵۰، ۱۰۰ یا … باشد).
- `await cylSetML(c, ۶۰, رنگ, شفافیت, مدت)` پر کردن تا ۶۰ mL؛ `cylML(c)` خوانش فعلی؛ `cylLevel(c, ml)` تبدیل mL به level.

**قیف و صافی**
- `makeFunnel(x,z,{y0:2.1})` ← قیف + کاغذ صافی + پایه. بشر را در همان x,z بگذارید.
- `await filterInto(f, ظرفمقصد, {amount, color, alpha, residueHex, dur})` ← مایع صاف می‌شود و رسوب (اگر residueHex بدهید) روی کاغذ می‌ماند.

**قوطی فیلم**: `makeCanister(x,z)`، `c.setLiquid(h,رنگ)`، `await popLid(c,{pop:true})` (پرتاب درپوش با فشار گاز)، `closeLid(c)`.

**دماسنج**: `makeThermometer(x,z)`، `th.setTemp(T)` (−۱۰ تا ۱۱۰)، `await dipThermometer(th,ظرف,T,{T0,dur})`، `await liftThermometer(th)`.

**ترازوی دیجیتال**: `makeBalance(x,z)`، `b.setMass(g)`، `b.tare()`، `await weighOn(b,obj3d,گرم)`، `await takeOff(b,obj3d,مقصد)`. اگر جسم کف ندارد در `obj.userData.baseY` فاصلهٔ مبدأ تا کف را بگذارید.

**چراغ بونزن و سه‌پایه**
- `makeBurner(x,z)`، `await setFlame(b,{on:true,air:0|1},مدت)`: air=۰ شعلهٔ زرد و پرنور، air=۱ شعلهٔ آبی.
- `makeTripod(x,z,{topY:2.55})` ← توری نسوز؛ ظرف را با `group.position.y = tripod.topY + .03` روی آن بگذارید.
- `addBoiling(ظرف)` ← `h.set(0..1)` شدت جوشش و بخار.

**مدار رسانایی (باتری ۹ ولت + LED + دو الکترود گرافیتی)**: `makeConductivityTester(x,z)`؛ بشر را در همان x,z بگذارید. `await t.lower()` و `await t.raise()` برای الکترودها، `await t.glowTo(0..1)` برای روشنایی LED.

نکته: با هر بازنشانی، همهٔ این‌ها خودکار حذف می‌شوند و نیازی به پاک‌کردن نیست.

**فاصلهٔ چیدمان (برای جلوگیری از تداخل):** هر قطعه فضای افقی زیر را می‌گیرد (نسبت به x,z خودش). قطعه‌ها را حداقل به اندازهٔ مجموع این دو فاصله از هم دور بگذارید.
| قطعه | شعاع تقریبی | توضیح |
|---|---|---|
| بشر | ۱ | |
| استوانهٔ مدرج | ۰٫۷ | |
| قیف و پایه | ۱ تا ۲ به سمت چپ | پایه سمت x منفی است |
| چراغ بونزن + سه‌پایه | ۱٫۳ | لولهٔ گاز تا ۲ واحد به سمت x مثبت و z مثبت می‌رود |
| ترازو | ۱٫۴ در x، ۱٫۲ در z | کفه کوچک و عقب است؛ نمایشگر جلو |
| مدار رسانایی | تا ۲ واحد به سمت x منفی | بشر در x,z خودش؛ باتری روی صفحهٔ کوچک سمت چپ و LED بالای پایه است |

**مسیر امن (برخورد نکردن):** قطره‌چکان (`dropperTo`، `fetchFrom`، `dropperHome` …) و دماسنج (`dipThermometer`، `liftThermometer`) همیشه اول بالا می‌روند، بالای همهٔ ظرف‌ها جابه‌جا می‌شوند و مستقیم پایین می‌آیند؛ نیازی به مسیردهی دستی نیست. `shake` هم لوله را آن‌قدر بالا می‌برد که از صفحهٔ رک رد نشود. اگر خودتان جسمی را حرکت می‌دهید (`moveTo`)، اول بالا ببرید، بعد افقی ببرید، بعد پایین بیاورید.

**بشر با ظرفیت دلخواه، کف و خط‌کش (افزودهٔ کاوش صابون)**
- `makeBeaker(x,z,{ml:100})` ← بشر ۱۰۰ mL با درجه‌بندی ۱۰ تا ۱۰۰ (پیش‌فرض ۲۵۰ mL). `beakerLevel(b,ml)` و `beakerML(b)` تبدیل mL ↔ level؛ مثلاً `pourWater(b, beakerLevel(b,50))`.
- `addFoam(ظرف)` ← `foam.set(h)` ارتفاع کف به واحد صحنه؛ `h = cm * CM` (CM=۰٫۲).
- `makeRuler(x,z,{cm:6,zeroY})` ← خط‌کش ایستاده؛ `zeroY` ارتفاع صفر (مثلاً سطح مایع). `ruler.mark(h)` نشانهٔ قرمز؛ `await ruleBeside(ruler,ظرف,{side:-1})` و `await ruleHome(ruler)` بدون برخورد جابه‌جایش می‌کنند.
- ماده‌های تازهٔ فرهنگ مواد: `soap` (صابون رنده‌شده) با فرمول RCOONa.

**وسیله‌های آزمایش سرعت واکنش (`core/kit.js`)**
- `makeStopwatch(x,z)` ← `sw.show(t)`, `await runStopwatch(sw,T,{speed})` (شمارش شتاب‌دار تا T ثانیه).
- `makeTablet(x,z,{piece:'whole'|'half'|'quarter'})` قرص جوشان؛ `makeMortar(x,z)` هاون چینی با `await grindTablet(m,tablet)` و `await pourPowder(m,can)`.
- قوطی فیلم: `canisterFizz(c)`، `await openCanister(c)`, `await closeCanister(c)`, `await flipCanister(c)` (وارونه روی زمین)، `await launchCanister(c)` (پرتاب)، `await pourCylinderIntoCanister(cyl,can,{color,h})` (استوانه باید سمت راست قوطی و حدود ۳ واحد از آن دور باشد).
- نمونهٔ کامل: `experiments/reaction-rate/experiment.js`.

**جمع‌آوری گاز روی آب (`core/gas.js`)**
- `makeTub(x,z)` تشت پلاستیکی شفاف؛ `await fillTub(t,سطح,رنگ,شفافیت,مدت)`، `await addIce(t,تعداد,{avoid:[x0,x1]})`، `t.setSteam(0..1)`. دماسنج را با `dipThermometer(th,t,T)` در آن فرو ببرید.
- `makeGasCylinder(x,z)` استوانهٔ مدرج برای جمع‌آوری گاز: `await fillGasCylinder(gc)` (پر از آب)، `await invertIntoTub(gc,x,z,ارتفاع‌دهانه)` (وارونه در تشت)، `gc.setGas(ml)` (حجم گاز)، `gc.showReading(true)` (نشانگر خوانش)، `await liftOutGasCylinder(gc,x,z)`.
- `makeCollectFunnel(x,z)` قیف وارونهٔ کوچک با قرص روی دیواره (`f.tab.visible`)، `makeClampStand(x,z,{ringAt})` پایه و حلقه، `makeGasBubbles(قیف,gc)` ← `b.set(true,آهنگ)`.
- نمونهٔ کامل: `experiments/gas-solubility-temp/experiment.js`.

**سوزاندن مواد (انرژی غذا)**
- `makeFood('nut'|'pasta', تعداد‌تکه)` ← نمونهٔ غذایی؛ `food.char(0..1)` سوختن و سیاه‌شدن. `makeTongs()` انبر (نوک در مبدأ؛ میله‌ها بالا و راست)؛ `tongs.hold(food)`، `tongs.flame.set(اندازه)` شعلهٔ روی نمونه.
- `makeFlame({air,height})` شعلهٔ مستقل برای هر جسم (`f.group` را بچسبانید، `f.set(اندازه)`).
- `makeClampStand(x,z,{ringAt,height,ringR})` پایه و حلقه برای نگه‌داشتن لوله یا استوانه.
- **مسیر انبر:** چون میله‌های انبر بالا و راست می‌روند، نوک را از سمت راست و پایین‌تر از ته لولهٔ بسته‌شده نزدیک کنید.
- نمونهٔ کامل: `experiments/food-energy/experiment.js`.
