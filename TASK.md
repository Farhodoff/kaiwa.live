# KAIWA.LIVE — XAVFSIZLIK VA SIFAT AUDITI VAZIFALAR REJASI (TASK.MD)

> **Eslatma:** Ushbu ro'yxat audit natijasida aniqlangan muammolar va kamchiliklarni o'z ichiga oladi. Har bir vazifa bajarilgach, `[x]` belgisi qo'yilib boriladi.

---

## 📌 BOSQICH 1 — P0 & P1 (Yuqori ustuvorlikdagi xavfsizlik va ruxsatlar)

- [x] **TASK-01: PR #152 GitGuardian false-positive holatini rasmiylashtirish**
  - **Tavsif:** `e2e/azure-speech-integration.spec.ts` faylidagi `target.password` tekshiruvi regex (`hasEmbeddedCredentials`) bilan xavfsiz almashtirilgan. GitGuardian AST tekshiruvi soxta signal (False Positive) ekani to'liq isbotlandi va hujjatlashtirildi.
  - **Holat:** Bajarildi va hujjatlashtirildi.

- [x] **TASK-02: Supabase Role-Based Authorization migratsiyasini tekshirish va jonli bazaga tatbiq etish**
  - **Fayl:** `supabase/migrations/20261108010000_role_only_admin_authorization.sql`
  - **Tavsif:** `is_admin()`, `is_reviewer()`, `is_superadmin()` funksiyalaridan hardcoded `fsoyilov@gmail.com` emailini olib tashlab, faqat `public.profiles.role` orqali tekshirishga o'tkazish.
  - **Holat:** SQL migratsiya fayli tayyor, `admin_role_assignment.test.ts` va `security_hardening_deep.test.ts` da sinovdan o'tkazildi.

- [x] **TASK-03: Curriculum Quality Queue (no_self_approval) bazada tatbiq etilishi**
  - **Fayl:** `supabase/migrations/20261108000000_curriculum_quality_queue.sql`
  - **Tavsif:** Kontent yaratuvchisi o'zi yozgan dars/savolni o'zi tasdiqlab e'lon qila olmasligini ta'minlovchi `no_self_approval` cheklovini tekshirish.
  - **Holat:** Bajarildi va testlardan o'tdi.

---

## 📌 BOSQICH 2 — P2 (O'rta darajadagi API va Infratuzilma himoyasi)

- [x] **TASK-04: CORS Origin ruxsatlarini qat'iylashtirish (Wildcard `*.vercel.app` ni yo'qotish)**
  - **Fayl:** `api/_cors.js`
  - **Tavsif:** Begona Vercel domenlaridan so'rovlarni bloklash, faqat `kaiwa.live`, Telegram WebApp (`web.telegram.org`), mobil (`capacitor://localhost`) va loyihaning o'z `kaiwa-*.vercel.app` preview domenlariga ruxsat berish.
  - **Holat:** Bajarildi va testlardan o'tdi (16/16 test).

- [ ] **TASK-05: P2P StudyRoom uchun WebRTC TURN server parametrlarini to'ldirish**
  - **Fayl:** `.env.example`, `.env.local` / Vercel Environment Variables
  - **Tavsif:** Simmetrik NAT va korporativ tarmoqlarda video/audio uzilib qolmasligi uchun `VITE_TURN_URLS`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` sozlamalarini kiritish (masalan, Cloudflare Calls yoki Metered.ca orqali).

- [x] **TASK-06: Azure Speech Token sessiya muddati va HTTP 431 himoyasi**
  - **Fayl:** `src/services/AzureSpeechService.ts`, `api/_cors.js`
  - **Tavsif:** Sessiya tugaganda bildirmasdan mehmon (guest) rejimiga tushib qolmaslik; ortiqcha cookie'larni tozalash (`credentials: 'omit'`).
  - **Holat:** Bajarildi va testlardan o'tdi.

- [x] **TASK-07: Admin va User roli bo'yicha regressiya testlarini tiklash**
  - **Fayl:** `src/utils/admin.ts`, `src/utils/__tests__/adminDeleteUser.test.ts`
  - **Tavsif:** Client UI ko'rinishi va server-side RLS chegaralarini moslashtirib, 24 ta qulagan testni 100% yashil holatga keltirish.
  - **Holat:** Bajarildi (barcha 2,514 ta test o'tdi).

---

## 📌 BOSQICH 3 — P3 (Foydalanuvchi interfeysi va brauzer moslashuvi)

- [x] **TASK-08: Brauzer tarjimonlari (Google Translate) ta'siridan Speaking Coach'ni himoya qilish**
  - **Fayl:** `src/pages/SpeakingCoachPage.tsx`, `src/components/speaking/`
  - **Tavsif:** Mobil brauzerlarda Google Translate yoki avtomatik tarjima DOM matn tugunlarini buzib, React komponentlarini qulatishini oldini olish (`translate="no"` va xavfsiz wrapperlar).
  - **Holat:** `fix/coach-browser-translation` branchida amalga oshirildi.

- [x] **TASK-09: UnauthRouter ichida FocusTimerProvider tekshiruvi**
  - **Fayl:** `src/components/UnauthRouter.tsx`
  - **Tavsif:** FocusTimer va FocusPage PR #150 da platformani sof yapon tili o'rganishga moslashtirish uchun to'liq olib tashlangan, shuning uchun UnauthRouter'da ortiqcha bog'liqlik yo'q.
  - **Holat:** Bajarildi va tasdiqlandi.

- [x] **TASK-10: Production CSP (Content Security Policy) headerlarini mustahkamlash**
  - **Fayl:** `vercel.json`
  - **Tavsif:** `frame-ancestors` direktivasi orqali Telegram WebApp integratsiyasi to'liq ta'minlandi va eskirgan `X-Frame-Options` bilan ziddiyat bartaraf etildi.
  - **Holat:** Bajarildi.

---

## 📌 BOSQICH 4 — Sifat va Chiqarish (Release & CI/CD)

- [ ] **TASK-11: `fix/coach-browser-translation` branchini PR #152 bilan tekshirib, main ga merge qilish**
  - **Oldindan shart:** Barcha CI checklari yashil bo'lishi va foydalanuvchi tasdig'i.

- [ ] **TASK-12: Production deploydan keyingi Smoke Test (Staging / Prod)**
  - [ ] Speaking Coach ovozli suhbat sinovi (Azure Speech token olish)
  - [ ] JLPT Mock Exam va SRS Fleshkartalar sinovi
  - [ ] Admin panel kirish huquqlari sinovi (`fsoyilov@gmail.com`)
  - [ ] Oddiy talaba hisobi admin panelga kira olmasligini tekshirish
