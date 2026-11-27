# راهنمای انتشار سایت «جعبه ابزار شیمی»

سایت کاملاً استاتیک است؛ فقط باید پوشهٔ پروژه روی یک میزبان بارگذاری شود. نیازی به Node روی سرور نیست.

## ۰. آماده‌سازی (روی کامپیوتر خودتان، هر بار قبل از انتشار)

```
node tools/fetch-vendor.mjs     # فقط بار اول (یا اگر vendor خالی است)
node tools/build-index.mjs      # فهرست آزمایش‌ها و precache.json را می‌سازد
node tools/serve.mjs            # یک نگاه سریع روی localhost
```

اگر `build-index` خطا یا هشدار داد، اول آن را رفع کنید. آزمایشی که خطا دارد وارد فهرست نمی‌شود.

برای انتشار فقط این‌ها لازم است: `index.html`، `player.html`، `sw.js`، `precache.json`، `_headers`، و پوشه‌های `assets`، `core`، `experiments`، `vendor`. پوشه‌های `tools`، `docs` و فایل `playground.html` را می‌توان بارگذاری نکرد (ضرری هم ندارد).

## ۱. Cloudflare Pages (پیشنهادی، رایگان)

روش بدون Git (ساده‌ترین):
1. در dash.cloudflare.com بخش **Workers & Pages** ← **Create** ← **Pages** ← **Upload assets**.
2. نام پروژه را بدهید، مثلاً `chem-toolbox` (آدرس: `chem-toolbox.pages.dev`).
3. پوشهٔ پروژه را (یا zip آن را) بکشید و رها کنید ← **Deploy**.
4. برای دامنهٔ اختصاصی: **Custom domains** ← **Set up a domain**.

به‌روزرسانی: همان پروژه ← **Create deployment** و بارگذاری دوباره.

روش Git (مناسب کار گروهی): پروژه را در یک مخزن GitHub بگذارید و در Pages آن را وصل کنید؛ **Build command** را خالی بگذارید و **Output directory** را `/` بدهید. اگر خواستید فهرست خودکار ساخته شود، Build command را `node tools/build-index.mjs` بگذارید.

نکته: HTTPS به‌طور خودکار فعال است و Service Worker (کار آفلاین) فقط روی HTTPS کار می‌کند.

## ۲. هاست ایرانی

اگر سایت باید از داخل ایران پرسرعت و بدون فیلتر در دسترس باشد، یک هاست/VPS ایرانی بهتر است.

1. در cPanel یا DirectAdmin بخش **File Manager** را باز کنید.
2. داخل `public_html` (یا پوشهٔ دامنه) محتویات پروژه را بارگذاری کنید (zip را آپلود و Extract کنید). `index.html` باید مستقیم داخل `public_html` باشد، نه داخل زیرپوشه.
3. گواهی SSL (Let's Encrypt یا رایگان هاست) را فعال کنید و **Force HTTPS** را بزنید.
4. فایل `_headers` در هاست‌های معمولی اثر ندارد. اگر Apache است، در `.htaccess` بگذارید:

```
<FilesMatch "^(sw\.js|precache\.json|index\.html|index\.json)$">
  Header set Cache-Control "no-cache"
</FilesMatch>
AddType application/javascript .js .mjs
AddType application/json .json
```

   اگر Nginx است، برای همان فایل‌ها `add_header Cache-Control "no-cache";` بگذارید.
5. مطمئن شوید پسوند `.js` با نوع `application/javascript` سرو می‌شود؛ در غیر این صورت ماژول‌ها بارگذاری نمی‌شوند.

## ۳. آزمون پس از انتشار

1. آدرس سایت را باز کنید؛ باید فهرست آزمایش‌ها بیاید.
2. یک آزمایش را باز کنید (آهن، اکسیدها)؛ باید صحنهٔ سه‌بعدی بالا بیاید.
3. در Chrome: F12 ← **Application** ← **Service Workers**؛ وضعیت باید *activated* باشد.
4. صفحه را یک‌بار کامل بارگذاری کنید، بعد در همان تب F12 ← **Network** ← **Offline** را بزنید و صفحه را رفرش کنید. اگر سایت و آزمایش باز شد، حالت آفلاین درست کار می‌کند.
5. روی موبایل هم یک‌بار باز کنید.

## ۴. به‌روزرسانی‌های بعدی

هر آزمایش جدید یا تغییر: فایل‌ها را جایگزین کنید ← `node tools/build-index.mjs` ← دوباره بارگذاری کنید. چون `precache.json` شمارهٔ نسخه دارد، Service Worker کاربران خودش کش قدیمی را عوض می‌کند. گاهی کاربر باید یک‌بار صفحه را رفرش کند تا نسخهٔ تازه را ببیند.

## ۵. مشکلات رایج

- **صفحهٔ سفید / خطای «vendor»:** پوشهٔ `vendor/three` بارگذاری نشده است.
- **فهرست خالی:** `experiments/index.json` ساخته یا بارگذاری نشده است.
- **تغییرات دیده نمی‌شود:** کش قدیمی؛ یک بار Ctrl+Shift+R بزنید یا در Application ← Service Workers گزینهٔ Unregister را بزنید.
- **فونت فارسی نیامد:** `vendor/fonts` را بررسی کنید.
- **روی هاست ایرانی ماژول‌ها لود نمی‌شوند:** نوع MIME فایل `.js` را بررسی کنید (بند ۴ هاست ایرانی).
