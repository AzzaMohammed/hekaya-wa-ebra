/* حكاية وعبرة — Service Worker
   وظيفة: تخزين الملفات الأساسية للتطبيق ليفتح بسرعة ويعمل دون اتصال بالإنترنت.
   ملاحظات:
   - رابط نسخة المخزن يتغير مع كل تحديث (VERSION) ويُحذف القديم في activate، فلا تُحتجز نسخة قديمة.
   - لا نخزّن أي بيانات حساسة: بيانات الطفل (الاسم/النجوم/التقدم) تبقى في localStorage داخل المتصفح فقط.
   - الموارد الخارجية (خطوط جوجل، روابط المراجع) لا تُخزَّن هنا. */
const VERSION = "v1.0.1";
const CACHE = "hikaya-core-" + VERSION;
const CORE = [
  "./",
  "./index.html",
  "./sources.html",
  "./styles.css",
  "./data.js",
  "./app.js",
  "./manifest.json",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

/* التثبيت: تخزين الملفات الأساسية ثم تفعيل النسخة الجديدة فورًا */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

/* التفعيل: حذف كل نسخة المخزن القديمة ثم استلام التحكم بالصفحات المفتوحة */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE && k.indexOf("hikaya-core-") === 0)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* رسالة تفعيل يدوي من الصفحة (اختياري) */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

/* جلب الموارد */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return; // الموارد الخارجية يتكفل بها المتصفح

  const isHtml = req.mode === "navigate" ||
    ((req.headers.get("accept") || "").indexOf("text/html") !== -1);

  if (isHtml) {
    /* الصفحات: الشبكة أولًا (لتحديث المحتوى بسرعة)، مع مرجع من المخزن عند انقطاع الإنترنت
       أو عند أي استجابة غير سليمة (مثل 502 من بعض شبكات المشاركة) */
    const offlinePage = "<!DOCTYPE html><html lang='ar' dir='rtl'><head><meta charset='utf-8'><title>غير متصل بالإنترنت</title></head><body style='font-family:sans-serif;text-align:center;padding:40px;background:#fdf6e7;color:#2b3a34'><h1>لا يوجد اتصال بالإنترنت 📡</h1><p>افتح «حكاية وعبرة» مرة أخرى عند عودة الاتصال 💚</p></body></html>";
    const fallback = () =>
      caches.match(req, { ignoreSearch: true })
        .then((cached) => cached || caches.match("./index.html"))
        .then((m) => m || new Response(offlinePage, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }));
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
            return res;
          }
          return fallback();
        })
        .catch(() => fallback())
    );
    return;
  }

  /* الملفات الثابتة (CSS/JS/صور): من المخزن فورًا + تحديث خلفي من الشبكة */
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
            return res;
          }
          return cached || res; /* استجابة غير سليمة: نعتمد النسخة المخزّنة إن وُجدت */
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
