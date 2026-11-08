# KAIWA.LIVE — XAVFSIZLIK, KONTENT VA SIFAT AUDITI VAZIFALAR REJASI (TASK.MD)

> **Eslatma:** Ushbu ro'yxat to'liq xavfsizlik (CODEX), kontent sifati, kurrikulum va UI/UX auditi natijasida aniqlangan barcha vazifalarni o'z ichiga oladi. Har bir vazifa bajarilgach, `[x]` belgisi bilan yangilanib boriladi.

---

## 📌 BOSQICH 1 — Xavfsizlik: P0 & P1 (Autentifikatsiya, Ruxsatlar va RLS)

- [x] **TASK-01: PR #152 GitGuardian false-positive holatini rasmiylashtirish**
  - **Tavsif:** `e2e/azure-speech-integration.spec.ts` faylidagi `target.password` tekshiruvi regex (`hasEmbeddedCredentials`) bilan xavfsiz almashtirildi. GitGuardian soxta signali (False Positive) bartaraf etildi.
  - **Holat:** Bajarildi va `ea459c25` bilan `main` ga kiritildi.

- [x] **TASK-02: Supabase Role-Based Authorization migratsiyasi**
  - **Fayl:** `supabase/migrations/20261108010000_role_only_admin_authorization.sql`
  - **Tavsif:** `is_admin()`, `is_reviewer()`, `is_superadmin()` funksiyalaridan hardcoded `fsoyilov@gmail.com` olib tashlanib, `public.profiles.role` asosidagi xavfsiz RBAC ga o'tkazildi.
  - **Holat:** SQL migratsiya va regressiya testlari tayyor (`admin_role_assignment.test.ts`).

- [x] **TASK-03: Curriculum Quality Queue (no_self_approval) bazada tatbiq etilishi**
  - **Fayl:** `supabase/migrations/20261108000000_curriculum_quality_queue.sql`
  - **Tavsif:** Kontent muallifi o'zi kiritgan dars/savolni o'zi tasdiqlab e'lon qila olmasligini ta'minlovchi `no_self_approval` qoidasi.
  - **Holat:** Bajarildi va testlardan o'tdi.

---

## 📌 BOSQICH 2 — Xavfsizlik: P2 (API, CORS va Infratuzilma)

- [x] **TASK-04: CORS Origin ruxsatlarini qat'iylashtirish (Wildcard `*.vercel.app` ni yo'qotish)**
  - **Fayl:** `api/_cors.js`
  - **Tavsif:** Begona Vercel domenlaridan so'rovlarni bloklash, faqat `kaiwa.live`, Telegram WebApp (`web.telegram.org`), mobil (`capacitor://localhost`) va loyihaning o'z preview domenlariga ruxsat berish.
  - **Holat:** Bajarildi va testlardan o'tdi (16/16 test).

- [x] **TASK-05: P2P StudyRoom uchun WebRTC STUN/TURN fallback arxitekturasi**
  - **Fayl:** `src/config/webrtc.ts`, `.env.example`
  - **Tavsif:** Ochiq/ishonchsiz public TURN serverlar o'rniga barqaror Google va Cloudflare STUN serverlari sozlandi; maxsus TURN serverlar uchun environment parametrlari (`VITE_TURN_URLS`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`) hujjatlashtirildi.
  - **Holat:** Bajarildi va testlardan o'tdi.

- [x] **TASK-06: Azure Speech Token sessiya muddati va HTTP 431 himoyasi**
  - **Fayl:** `src/services/AzureSpeechService.ts`, `api/_cors.js`
  - **Tavsif:** Sessiya tugaganda bildirmasdan anonim rejimga tushib qolmaslik; ortiqcha cookie'larni tozalash (`credentials: 'omit'`).
  - **Holat:** Bajarildi va testlardan o'tdi.

- [x] **TASK-07: Admin va User roli bo'yicha regressiya testlarini tiklash**
  - **Fayl:** `src/utils/admin.ts`, `src/utils/__tests__/adminDeleteUser.test.ts`
  - **Tavsif:** Client UI ko'rinishi va server-side RLS chegaralarini moslashtirib, 24 ta qulagan testni 100% yashil holatga keltirish.
  - **Holat:** Bajarildi (barcha 2,514 ta test o'tdi).

---

## 📌 BOSQICH 3 — Brauzer va Front-end barqarorligi

- [x] **TASK-08: Brauzer tarjimonlari (Google Translate) ta'siridan Speaking Coach'ni himoya qilish**
  - **Fayl:** `src/pages/SpeakingCoachPage.tsx`, `src/components/speaking/`
  - **Tavsif:** Mobil brauzerlarda avtomatik tarjima DOM matn tugunlarini buzib, React komponentlarini qulatishini oldini olish (`translate="no"` atributlari va xavfsiz wrapperlar).
  - **Holat:** Bajarildi va `main` ga birlashtirildi.

- [x] **TASK-09: UnauthRouter ichida FocusTimerProvider tozalanishi**
  - **Fayl:** `src/components/UnauthRouter.tsx`
  - **Tavsif:** FocusTimer va FocusPage PR #150 da platformani sof yapon tili o'rganishga yo'naltirish maqsadida to'liq chiqarilgan, ziddiyat bartaraf etilgan.
  - **Holat:** Bajarildi va tasdiqlandi.

- [x] **TASK-10: Production CSP (Content Security Policy) headerlarini mustahkamlash**
  - **Fayl:** `vercel.json`
  - **Tavsif:** `frame-ancestors` direktivasi orqali Telegram WebApp integratsiyasi ta'minlandi va `X-Frame-Options: SAMEORIGIN` moslashtirildi.
  - **Holat:** Bajarildi.

---

## 📌 BOSQICH 4 — Release & Production Smoke Test

- [x] **TASK-11: `fix/coach-browser-translation` branchini PR #152 orqali main ga merge qilish**
  - **Tavsif:** PR #152 barcha 9 ta CI quality gate checklaridan 100% muvaffaqiyatli o'tgach, `main` branch'ga squash-merge qilindi (`ea459c25`).
  - **Holat:** Bajarildi.

- [x] **TASK-12: Production jonli tekshiruv (Smoke Test & Security Verification)**
  - [x] `https://kaiwa.live` HTTP/2 200, CSP, HSTS, Permissions-Policy faol
  - [x] `POST /api/speech-token` autentifikatsiyasiz so'rovlarni qat'iy 401 bilan qaytaradi
  - [x] `POST /api/tts` anonim so'rovlarni 401 bilan qaytaradi
  - [x] `POST /api/admin/delete-user` ruxsatsiz so'rovlarni bloklaydi
  - [x] Begona domenlardan kelgan CORS so'rovlariga ruxsat berilmaydi

---

## 📌 BOSQICH 5 — Kontent va Kurrikulum sifati (Content Quality & Pedagogics)

- [x] **TASK-13: `ContentQualityAuditService` pagination va server-side aggregatsiyani kuchaytirish**
  - **Fayl:** `src/services/ContentQualityAuditService.ts`
  - **Tavsif:** Katta ma'lumotlar bazasida `select('*')` cheklovidan qochish, sahifalash (offset/range `pageSize: 1000, maxRows: 50000`) va `isTruncated` xabarnomalari kiritildi.
  - **Holat:** Bajarildi va testlardan o'tdi (`ContentQualityAuditService.test.ts`).

- [x] **TASK-14: Savol validatsiyasi va javob to'g'riligi tahlili**
  - **Fayl:** `src/services/ContentQualityAuditService.ts`
  - **Tavsif:** `buildCorrectAnswerSignature`, `buildOptionsSignature`, `hasCorrectAnswer` orqali javob-variant mosligi sinovdan o'tkazildi.
  - **Holat:** Bajarildi va testlardan o'tdi.

- [x] **TASK-15: Content Audit darajalariga N5 va N4 ni to'liq qamrab olish**
  - **Fayl:** `src/services/ContentQualityAuditService.ts`
  - **Tavsif:** `CONTENT_AUDIT_LEVELS = ['N3', 'N2', 'N1', 'N4', 'N5']` to'liq 5 ta darajaga kengaytirildi.
  - **Holat:** Bajarildi va tasdiqlandi.

- [x] **TASK-16: Darslar ketma-ketligi va Prerequisite grafigini validatsiya qilish**
  - **Fayl:** `src/services/CurriculumService.ts`, `src/services/CurriculumPrerequisiteValidatorService.ts`
  - **Tavsif:** 140 ta dars (N5: 25, N4: 25, N3: 30, N2: 30, N1: 30) bo'yicha prerequisite zanjiri, siklik bog'lanish va yetim darslar yo'qligi test qilindi.
  - **Holat:** Bajarildi (barcha 7 ta test fayl, 46 ta test o'tdi).

- [x] **TASK-17: Dublikat savollarni aniqlash algoritmini takomillashtirish**
  - **Fayl:** `src/services/ContentQualityAuditService.ts`
  - **Tavsif:** Aniq dublikatlar va matni o'xshash ammo varianti boshqa savollar (`distinguishes exact duplicates from probable stem duplicates`) alohida saralanadi.
  - **Holat:** Bajarildi va testlandi.

---

## 📌 BOSQICH 6 — UI/UX va Tashqi ko'rinish (Visual & User Experience QA)

- [x] **TASK-18: Landing sahifasidagi Demo va Real funksiyalar aniqligi**
  - **Fayl:** `src/pages/LandingPage.tsx`
  - **Tavsif:** Landing showcase va hero qismida "Interaktiv Demo" belgilari o'rnatilgan, soxta mic o'rniga "Ovozli demo tinglash" va to'g'ridan-to'g'ri birinchi dars/dashboardga olib o'tuvchi CTA tugmasi mavjud.
  - **Holat:** Bajarildi va tasdiqlandi.

- [x] **TASK-19: Mobil (360px) va Planshet ekranlarda Yaponiya shriftlari va Furigana wrapping QA**
  - **Fayl:** `e2e/mobile-ux-visual.spec.ts`, `src/index.css`
  - **Tavsif:** Android 360x800 va iPhone 390x844 ekranlarida Landing, JLPT Hub, Flashcards, Speaking Coach, Mock Exam sahifalarida gorizontal overflow yo'qligi (`isOverflowing === false`) va xatosiz yuklanishi Playwright orqali 10/10 test bilan tasdiqlandi.
  - **Holat:** Bajarildi (10/10 Playwright testi yashil).

- [x] **TASK-20: WCAG Accessibility (Rang kontrasti va Focus holatlari)**
  - **Fayl:** `src/index.css`, `src/styles/design-system.css`
  - **Tavsif:** `:where(button, a, input, select, textarea, [tabindex]):focus-visible` orqali WCAG 2.4.7 Focus Visible ta'minlangan; Sumi-e va Hanko (Washi/Dark) rang tokenlari 4.5:1 kontrastga moslashtirilgan, `ruby`/`rt` taglari uchun no-select va markazlashgan shrift o'lchamlari o'rnatilgan.
  - **Holat:** Bajarildi va tasdiqlandi.
