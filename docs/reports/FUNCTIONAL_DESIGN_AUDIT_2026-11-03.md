# Kaiwa Live — funksional va dizayn auditi

**Sana:** 2026-11-03  
**Branch:** `feat/azure-stt-and-pronunciation-assessment`  
**Qamrov:** React/Vite klient, Vercel serverless API, Supabase migratsiyalari, testlar, build, E2E, dev-serverda guest va preview oqimlari, asosiy sahifalarning DOM/kontrast/touch-target ko‘rsatkichlari.  
**Cheklov:** Jonli production bazasi, haqiqiy foydalanuvchi akkauntlari, RLS siyosatlarining real bazadagi holati, iOS/Safari va Android qurilmalari, Azure kalitlari bilan haqiqiy STT sessiyasi tekshirilmadi. Audit davomida ishchi daraxtda boshqa jarayon Azure STT fayllarini parallel o‘zgartirgan; topilmalar 15:07 holatiga tegishli.

---

## 1. Qisqa xulosa

Loyiha muhandislik jihatidan yetuk: TypeScript strict tekshiruvi, ESLint, 2 423 unit/integration test, 21 Playwright E2E va production build muvaffaqiyatli o‘tadi. Curriculum, JLPT kontenti, 9 860 lug‘at yozuvi va 140 darslik bazasi haqiqatan mavjud.

Asosiy kamchiliklar kod sifati emas, **mahsulot haqqoniyligi, sessiya ishonchliligi, xalqarolashtirish va dizayn izchilligi**da:

1. Joriy branchdagi Azure speech-token endpointining quota chaqiruvi noto‘g‘ri — barcha foydalanuvchilar uchun bitta umumiy limit ishlaydi va limit tugagach STT butunlay to‘xtaydi.
2. SEO/landing’dagi 4.9 reyting va 12 480 sharh sun’iy baseline bilan to‘qib chiqarilgan.
3. Muddati o‘tgan sessiyada ham ilova “tizimga kirgan” ko‘rinishida ochiladi, yozish urinishlari 401/RLS xatosi bilan yopiladi.
4. Telegram Mini App sahifasi (`/twa`) `index.html` dagi redirect sabab umuman ochilmaydi.
5. Uch tilli interfeys e’lon qilingan, lekin Auth, Landing va navigatsiyaning katta qismi faqat o‘zbekcha; ba’zi joylarda inglizcha texnik matnlar chiqadi.
6. Asosiy CTA rangining oq matn bilan kontrasti WCAG AA darajasidan past (3.88:1 va 4.27:1).
7. 1 008 ta joyda 9–11px matn, 15 ta touch-target 36px dan kichik; reduced-motion deyarli qo‘llanmagan.
8. 209 MB build (shundan 172 MB audio), 1.5 MB gacha JS chunk va JLPT sahifasida barcha 5 daraja curriculum’ining bir yo‘la yuklanishi.

**Umumiy baho:** funksional tayyorlik o‘rtacha-yuqori, lekin productionga chiqishdan oldin P0/P1 ro‘yxatidagi 8–10 ta nuqta yopilishi shart. Dizayn tizimi yaxshi asosga ega, ammo tokenlar, tipografiya, kontrast va i18n izchilligi tugallanmagan.

---

## 2. Tekshiruv bazasi

| Tekshiruv                                        | Natija                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `npm run typecheck` (`tsc --noEmit`)             | ✅ 0 xato                                                                             |
| `npx eslint . --max-warnings 0`                  | ✅ 0 xato/warning                                                                     |
| `npm test -- --run`                              | ✅ 271 fayl, 2 423 test (4 skip)                                                      |
| `npm run build`                                  | ✅ 7.8 s; PWA 63 precache yozuvi                                                      |
| `npm run test:e2e`                               | ✅ 21/21 test                                                                         |
| `npm run test:seo`                               | ✅ 4/4 tekshiruv                                                                      |
| Dev server, 390×844 va 1440×900                  | ✅ Asosiy sahifalar render bo‘ldi; preview rejimida yozishda 401/RLS xatosi kuzatildi |
| Real Supabase/RLS, iOS Safari, Azure credentials | ⚠️ Tekshirilmadi                                                                      |

Kod hajmi: `src` bo‘yicha 699 TS/TSX/CSS fayl, ~213 800 satr (shundan ~189 500 tasi `src/data`dan tashqari), 75 service, 30 page. Testlar ~50 700 satr.

---

## 3. P0 — darhol tuzatilishi kerak

### P0-1. Azure speech-token quota chaqiruvi buzilgan (joriy branch)

**Dalil:** `api/speech-token.js:77`

```js
const quotaCheck = await checkDailyQuota(req, authenticatedUserId, userRole);
```

`api/_quota.js:33` dagi haqiqiy imzo:

```js
export async function checkDailyQuota(userId, userRole = 'user', bodyString = '', req = null)
```

Ya’ni `req` obyekti `userId` o‘rniga, foydalanuvchi ID esa `userRole` o‘rniga uzatilmoqda. Natijada:

- `isGuest = !userId` har doim `false`;
- Redis kaliti barcha so‘rovlar uchun bir xil `user:[object Request]` bo‘ladi;
- 35 ta token so‘rovidan keyin **barcha foydalanuvchilar** 403 oladi;
- javobda kutilayotgan `quotaCheck.message`, `.limit`, `.used`, `.tier` maydonlari mavjud emas — API o‘rniga `undefined` va umumiy matn qaytaradi.

Testlar buni sezmaydi, chunki `src/utils/__tests__/speech_token_security.test.ts:79-84` da quota natijasi mavjud bo‘lmagan shaklda (`used`, `limit`, `tier`) mock qilingan. Ya’ni test noto‘g‘ri kontraktni “tasdiqlaydi”.

Bu holat Azure STT `#132` commitida ham saqlanib qolgan. **Qo‘shimcha:** dev-serverda `/api/speech-token` uchun middleware yo‘q. `curl` natijasi `200 text/javascript` bo‘lib, Vite manba faylini qaytaradi; klient `res.json()` da yiqiladi va Azure STT lokal muhitda ishlamaydi. `server/vitePlugin.js` faqat TTS, SRS, DeepSeek, feedback, SEO va Telegram marshrutlarini qoplaydi.

**Tavsiya:** chaqiruvni `checkDailyQuota(authenticatedUserId, userRole, '', req)` ga o‘zgartirish; javob maydonlarini `reason`/`remainingQuota` bilan moslashtirish; dev uchun `/api/speech-token` middleware yoki proxy qo‘shish; haqiqiy imzo bo‘yicha contract test yozish.

### P0-2. Sun’iy reyting va sharhlar soni SEO/landing’da ko‘rsatiladi

**Dalil:** `api/seo/ratings.js:14-16`

```js
const BASELINE_RATING = {
  ratingValue: '4.9',
  ratingCount: 12480,
  ...
};
```

Haqiqiy sharhlar bo‘lmasa ham API shu baseline’ni qaytaradi. Haqiqiy sharhlar kelganda ular sun’iy 12 480 ta sharh bilan aralashtiriladi (`73-83`). Landing’da esa “★★★★★ 4.9” to‘g‘ridan-to‘g‘ri hardcode qilingan (`src/pages/LandingPage.tsx:884-885`), JSON-LD `AggregateRating` esa API baseline’idan foydalanadi. Bu:

- foydalanuvchini chalg‘itadi;
- Google rich-results siyosatini buzishi va manual penalty’ga olib kelishi mumkin;
- “100% halol ta’lim” brendiga zid.

**Tavsiya:** baseline’ni butunlay olib tashlash; sharh bo‘lmasa reyting blokini yashirish; faqat haqiqiy `app_reviews` asosida hisoblash; `reviewCount` va `ratingCount`ni ajratish; marketingda “4.9” o‘rniga real ko‘rsatkich yoki umuman reyting ishlatmaslik.

---

## 4. P1 — yuqori prioritet

### P1-1. “Zombi sessiya”: keshdagi foydalanuvchi bilan ilova ochiladi

**Dalil:** `src/App.tsx:163-171` localStorage’dagi `study_planner_user_cache` asosida soxta sessiya yasaydi:

```js
return {
  access_token: 'cached-token',
  ...
  user: parsed,
} as unknown as Session;
```

`src/context/StudyPlannerContext.tsx:422-424` esa Supabase sessiyasi bo‘lmasa ham keshdagi UUID’li userni `currentUser` sifatida qabul qiladi. Natijada token muddati tugagan yoki bekor qilingan foydalanuvchi to‘liq autentifikatsiya qilingan interfeysni ko‘radi; keyingi yozish urinishlari 401 yoki RLS xatosi bilan tugaydi.

Dev-serverdagi preview tekshiruvida aynan shu holat kuzatildi:

```
[SupabaseClient] Access token expired (401)
[SupabaseClient] [HTTP 401] ... row-level security policy for table "flashcards"
[addFlashcardsBatch] ❌ Chunk DB insert error
```

Foydalanuvchiga faqat “Sessiya muddati tugadi” toast’i chiqadi, lekin ilova login sahifasiga qaytarmaydi.

**Tavsiya:** keshdagi userni faqat UX ko‘rsatkichi sifatida ishlatish, ammo `supabase.auth.getSession()` muvaffaqiyatsiz bo‘lsa sessiyani `null` qilish va `/auth?redirect=...` ga yo‘naltirish; `access_token: 'cached-token'` kabi soxta sessiyani olib tashlash; token refresh natijasini kutish; 401 kelganda markazlashgan logout.

### P1-2. Telegram Mini App sahifasi ochilmaydi (`/twa`)

**Dalil:** `index.html:19-20`

```js
if (window.location.pathname === '/twa') {
  window.location.replace('/jlpt');
}
```

Shu bilan birga `src/components/UnauthRouter.tsx:139` va `src/App.tsx` da `/twa` marshruti `TelegramMiniAppPage` ga bog‘langan, `src/services/TelegramService.ts:313` esa foydalanuvchilarni aynan `https://kaiwa.live/twa` ga yuboradi. Ya’ni bot havolasi bosilganda maxsus mini-app sahifasi emas, umumiy JLPT sahifasi ochiladi. Testlar `MemoryRouter` ishlatgani uchun `index.html` darajasidagi redirect’ni ko‘rmaydi.

**Tavsiya:** redirect’ni olib tashlash yoki faqat `?redirect=true` bo‘lganda `/jlpt` ga yo‘naltirish; E2E’da haqiqiy `/twa` URL’ini tekshirish.

### P1-3. Login’dan keyin `?redirect=` yo‘qoladi

`UnauthRouter` himoyalangan sahifalardan `/auth?redirect=/settings` kabi havola yuboradi, lekin `AuthPage` `redirect` parametrini umuman o‘qimaydi (`grep` 0 natija). Muvaffaqiyatli kirishdan keyin `navigate('/')` chaqiriladi, bu esa `/dashboard` ga olib boradi. Foydalanuvchi ochmoqchi bo‘lgan sahifa yo‘qoladi.

**Tavsiya:** `searchParams.get('redirect')` ni xavfsiz ichki path sifatida tekshirib (`/` bilan boshlanadi, `//` va `\\` yo‘q), login/signup’dan keyin o‘shanga yo‘naltirish. `router_security_regression.test.ts` dagi mantiqni haqiqiy `AuthPage` ga qo‘llash.

### P1-4. O‘quv natijalari va reytinglar sun’iy default’lar bilan to‘ldiriladi

**Dalil:** `src/pages/DashboardPage.tsx:124-139` va `src/pages/PersonalPlanPage.tsx:121-136`:

```ts
vocabRetentionRate: 85,
grammarMasteredCount: Math.max(grammarFromCards, meta.listeningQuestionsCompleted > 0 ? 35 : 20),
readingAccuracy: 80,
listeningAccuracy: 80,
speakingFluencyScore: 7.5,
```

Bular `JlptReadinessService` ga uzatiladi va “JLPT tayyorgarligi” foizi, 180 ballik prognoz, radar diagramma va “N4 ga o‘tishga tayyorlik”ni hosil qiladi. Yangi foydalanuvchi 0 ta so‘z bilgan bo‘lsa ham 20 ta grammatika o‘zlashtirilgan, 85% retention va 7.5 fluency hisobiga ega bo‘ladi.

Xuddi shu muammo:

- `TelegramMiniAppPage.tsx:72-73`: `streakDays = currentStreak || 1`, `displayXp = totalXp || 120`;
- `ConversationReviewModal.tsx:107-109`: `overall/fluency/pronunciation` uchun `|| 7.0`;
- `SessionReportModal.tsx` va `CoachProgressDashboard.tsx`: `|| 7.0` / `|| 7.5`;
- `gamification.ts:129-160` va `StudyPlannerContext.tsx:817`: yangi profilga `currentStreak: 1` yoziladi.

**Tavsiya:** “ma’lumot yo‘q” holatini alohida model qilish (`null` / `hasEvidence`), 0% yoki “Hali o‘lchanmagan” ko‘rsatish; sun’iy baseline’larni faqat aniq izoh bilan “prognoz” sifatida ajratish; streak’ni 0 dan boshlash; speaking baholarini faqat real sessiya bo‘lsa ko‘rsatish.

### P1-5. Cron va Telegram webhook himoyasi konfiguratsiyaga bog‘liq

**Dalil:** `api/_telegram/notify-daily.js:46` va `dispatch-daily-dataset.js:30` — `CRON_SECRET` mavjud bo‘lsagina tekshiriladi. Agar secret o‘rnatilmagan bo‘lsa, istalgan tashqi shaxs `GET/POST /api/telegram/notify-daily` ni chaqirib, barcha Telegram foydalanuvchilariga ommaviy xabar yuborishi mumkin. `.env.example`, README yoki `vercel.json` da `CRON_SECRET` talabi hujjatlashtirilmagan.

`api/_telegram/webhook.js` da Telegram’ning `x-telegram-bot-api-secret-token` sarlavhasi tekshirilmaydi (Supabase funksiyasida bu bor, Vercel handlerida yo‘q). Vercel webhook marshruti ishlatilsa, soxta update’lar qabul qilinadi.

**Tavsiya:** secret bo‘lmasa endpoint’ni 503 bilan yopish (fail-closed); `CRON_SECRET` va webhook secret’ni majburiy env sifatida hujjatlashtirish; CORS’ni faqat kerakli origin bilan cheklash. Shuningdek `api/_rateLimit.js` Upstash ishlamasa fail-open bo‘lib, har serverless instansiyada alohida xotira limitiga tushadi — AI xarajatini himoya qilish uchun fail-closed yoki markazlashgan limit kerak.

### P1-6. Production fallback credentials va admin chegarasi

**Dalil:** `src/lib/supabase.ts:22-23` va `api/_auth.js:6-7` haqiqiy production Supabase URL/anon key’ni hardcoded fallback sifatida saqlaydi. Env yo‘q bo‘lsa, dev/test muhit jimgina production bazasiga ulanadi. E2E yoki lokal tajriba real ma’lumotga yozishi mumkin.

`api/admin/update-deck-card.js:62-66` da admin tekshiruvi hardcoded email ro‘yxati, JWT metadata’dagi `role` va `NODE_ENV === 'development' && user` shartiga tayanadi. `src/App.tsx:62-137` dagi `AdminRoute` esa localStorage’dagi keshlangan rolni ishlatadi va DB tekshiruvi 1.5 soniyada timeout bo‘lsa foydalanuvchini `/jlpt` ga qaytaradi. Bu UX jihatidan mo‘rt; xavfsizlik nuqtai nazaridan esa yagona himoya RLS bo‘lib qolishi kerak.

**Tavsiya:** fallback credentials’ni olib tashlash, env yo‘q bo‘lsa aniq xato bilan ishga tushmaslik; admin email ro‘yxatini faqat serverdagi env’ga ko‘chirish; admin tekshiruvini server-side RPC/RLS bilan qat’iy qilish; `AdminRoute` timeout’ini uzoqroq qilish yoki xato holatini ko‘rsatish.

### P1-7. Build va yetkazib berish hajmi

`npm run build` natijasi `build/` = **209 MB**, shundan `public/audio` = **172 MB**, `build/data` = 12 MB, `build/assets` = 18 MB. Eng katta JS chunk’lar:

- `jlpt-vocab-n2` — 1.57 MB (gzip 504 KB)
- `jlpt-grammar-kanji-data` — 1.04 MB (gzip 293 KB)
- `jlpt-vocab-n1` — 984 KB (gzip 253 KB)
- `jlpt_n2` — 930 KB (gzip 288 KB)
- `curriculum-minna-n5` — 740 KB (gzip 161 KB)

`MinnaLessonsExplorer.tsx:12-16` barcha 5 daraja curriculum’ini statik import qiladi; JLPT sahifasi ochilganda N5–N1 JSON’larining hammasi yuklanadi. Bu mobil tarmoqda sezilarli kechikish beradi.

**Tavsiya:** darajani tanlaganda curriculum’ni dinamik import qilish; audio fayllarni CDN’ga yoki siqilgan formatga (opus/aac, 64–96 kbps) ko‘chirish; build hajmi byudjetini CI’da belgilash; `jlpt-vocab-n2` kabi chunk’larni sahifa bo‘yicha bo‘lish.

---

## 5. P2 — o‘rta prioritet funksional kamchiliklar

### P2-1. `purgeOversizedCookies()` barcha cookie’larni o‘chiradi

`src/lib/consoleFilter.ts:67-85` funksiyasi nomi “oversized” bo‘lsa-da, hajmini tekshirmaydi — har bir cookie’ni `expires=1970` bilan o‘chiradi va bu har ilova ishga tushganda bajariladi (`installConsoleShield()`). Supabase cookie-based sessiyaga o‘tsa yoki boshqa servis cookie ishlatsa, foydalanuvchi har safar tizimdan chiqadi.

**Tavsiya:** faqat haqiqatan katta cookie’larni (masalan, 4 KB dan yuqori) tozalash; funksiyani startup’dan olib tashlash yoki opt-in qilish.

### P2-2. PWA har 30 soniyada yangilanishni tekshirib, majburiy reload qiladi

`src/main.tsx:22,28-36,41` — `VersionUpdateService.startPeriodicCheck(30000)`, SW `controllerchange` va `onNeedRefresh` avtomatik `applyUpdate()` → `location.reload()`. Imtihon yoki speaking sessiyasi paytida deploy bo‘lsa, sahifa majburan yangilanadi. Mock exam draft’i localStorage’ga saqlanadi, lekin speaking audio/sessiya holati yo‘qolishi mumkin.

**Tavsiya:** yangilanishni foydalanuvchi tasdiqlashi bilan qo‘llash (“Yangi versiya tayyor — yangilash” banneri); imtihon/record paytida reload’ni bloklash; `beforeunload` ogohlantirishi.

### P2-3. Guest ma’lumotlari `default-user` / `guest` ostida aralashadi

`DashboardPage.tsx:201,229,265`, `useSpeakingSessionOrchestrator.tsx:514,528` va boshqa joylarda `user?.id || 'default-user'` ishlatiladi. Bir brauzerdagi barcha mehmonlar bitta “default-user” progressini bo‘lishadi; keyinchalik login qilgan foydalanuvchi bu ma’lumotni o‘ziga o‘tkazmaydi. `LessonPlayerPage` esa `'guest'` ishlatadi — yana boshqa kalit.

**Tavsiya:** mehmon uchun yagona `guest-session-id` yaratish va login paytida progressni migratsiya qilish yoki mehmon progressini umuman saqlamaslik.

### P2-4. Xatolarni yashirish va kuzatuvning yetarli emasligi

- 186 ta bo‘sh `catch {}` / `catch { }`;
- 517 ta `console.log/warn/error` chaqiruvi;
- 1 111 ta `any` / `@ts-ignore` / `@ts-expect-error`;
- API’da 2 ta AI javob validatoridan boshqa schema validatsiyasi yo‘q (`zod`/`yup` o‘rnatilmagan);
- `consoleFilter` “Failed to fetch” va boshqa tarmoq xatolarini butunlay bosadi — real nosozliklarni debug qilishni qiyinlashtiradi.

**Tavsiya:** markazlashgan `logger` orqali xatolarni Sentry’ga yuborish; bo‘sh catch’larni kamaytirish; API kirishlarini schema bilan tekshirish; console shield’ni faqat production’da va faqat ma’lum shovqinli xabarlar uchun yoqish.

### P2-5. Testlar ishonch darajasi yetarli emas

- E2E testlarida 12 ta “agar ko‘rinsa, tekshir” (soft) sharti bor; sahifa umuman ishlamasa ham test o‘tishi mumkin.
- `router_security_regression.test.ts` haqiqiy router’ni emas, test ichidagi inline mantiqni tekshiradi.
- Speech token testi yuqorida ko‘rsatilganidek noto‘g‘ri quota shaklini mock qiladi.
- `Task20RealSupabase` 4 testi CI’da skip bo‘ladi (secrets yo‘q bo‘lsa).
- Vizual regressiya (screenshot) testlari yo‘q.

**Tavsiya:** contract testlarni haqiqiy funksiya imzosi bilan yozish; E2E’da `expect`ni shartsiz qilish; asosiy 5 sahifa uchun Playwright screenshot regression; RLS uchun alohida test bazasi.

### P2-6. Hujjat va mahsulot da’volari mos emas

README’da `tldraw` va Google Gemini 2.0 integratsiyasi ko‘rsatilgan (`README.md:65,82,92,95,136`), lekin:

- `package.json` da `tldraw` yo‘q; `StudyRoomPage` o‘z canvas whiteboard’ini ishlatadi (`RoomWhiteboard.tsx`, `data-testid="tldraw-whiteboard"` nomi chalg‘ituvchi);
- Gemini integratsiyasi faqat testlarda uchraydi, real kodda yo‘q.

Shuningdek Pricing sahifasi “Cheklovlarsiz” deb yozadi, ammo AI uchun kunlik quota (guest 5, user 35, admin 500) mavjud; “100% bepul” va “cheksiz” so‘zlari real limit bilan ziddiyatda.

**Tavsiya:** README va marketing matnlarini haqiqiy implementatsiyaga moslashtirish; “cheksiz” o‘rniga “bepul, adolatli kunlik limit bilan” yozish; `data-testid` nomini ham to‘g‘rilash.

### P2-7. Migratsiyalar va schema boshqaruvi

`supabase/migrations` da 102 fayl, bir nechta bir xil sanali va takroriy migratsiyalar mavjud (`20260819000000_*`, `20260824000000_*` va h.k.). `supabase/baseline_schema.sql` bo‘sh (0 bayt) va git’da kuzatilmagan. Bu yangi muhitni tiklash va schema drift’ni aniqlashni qiyinlashtiradi.

**Tavsiya:** haqiqiy baseline dump yaratish; migratsiyalarni yagona tartibga keltirish; CI’da `supabase db diff` yoki schema lint qo‘shish.

---

## 6. Dizayn va UX kamchiliklari

### D1. Kontrast WCAG AA talabiga javob bermaydi

O‘lchangan qiymatlar:

| Juftlik                               | Kontrast   | Talab             |
| ------------------------------------- | ---------- | ----------------- |
| Oq matn / dark primary `#E8483A`      | **3.88:1** | 4.5:1             |
| Oq matn / light primary `#DC4433`     | **4.27:1** | 4.5:1             |
| `#64748B` muted / light bg `#F8F6F0`  | **4.40:1** | 4.5:1             |
| `#8B8680` muted / dark card `#1A2028` | 4.54:1     | 4.5:1 (chegarada) |

Landing sahifasida 20 ta, Auth sahifasida 3 ta ko‘rinadigan matn kontrastdan yiqiladi. Asosiy “Bepul boshlash”, “Kirish”, “Hoziroq suhbatni boshlang” CTA’lari shu holatda. Bu butun ilovadagi 659 ta `bg-primary` va 273 ta `text-primary-foreground` kombinatsiyasiga ta’sir qiladi.

**Tavsiya:** primary rangni quyuqlashtirish (masalan, dark uchun `#C93A2C`, light uchun `#C0392B`) yoki CTA matnini 18.66px bold qilish; muted rangni light theme’da `#5B6675` ga tushirish; tokenlarni automated kontrast testi bilan qo‘riqlash.

### D2. Juda kichik tipografiya

`text-[9px]`, `text-[10px]`, `text-[11px]` jami **1 008** marta ishlatilgan. Landing’da 77 ta matn 12px, 13 tasi 11px; mobil pastki navigatsiya yorliqlari 10px; furigana `0.62em` bo‘lib, 10px asosiy matnda ~6px ga tushadi. Yaponcha kanji/furigana va o‘zbekcha diakritikalar uchun bu o‘qishni qiyinlashtiradi.

**Tavsiya:** minimal 12px (asosiy matn 14–16px), furigana uchun alohida 11–12px; `text-[10px]` larni dizayn tokeniga aylantirish; 200% zoom’da layout buzilmasligini tekshirish.

### D3. Uch tilli interfeys amalda uch tilli emas

- `AuthPage.tsx` da `useLanguage` **0** marta ishlatilgan — barcha matn o‘zbekcha.
- `LandingPage.tsx` 1 274 satr bo‘lsa-da, faqat **3** ta `language === 'ja'/'en'` sharti bor; til almashtirish sahifa matnining ~95% ini o‘zgartirmaydi.
- `Layout.tsx:139-165` da “Monolog”, “Progress”, “Speaking” kabi yorliqlar inglizcha qolgan; ba’zi joyda `isJa` bor, `isEn` yo‘q.
- Dashboard’da foydalanuvchiga inglizcha texnik matn chiqadi: “Completed Lessons (0/2) is below threshold.”, “VOCABULARY darsini o‘qing”, “Japanese diagnostic assessment is required before promotion.”
- i18n fayllarida 234 tadan kalit bor, lekin ularning katta qismi ishlatilmaydi; tarjimalar `any` bilan tiplanmagan.

**Tavsiya:** `t()` ni barcha sahifalarga majburiy qilish; Auth/Landing’ni to‘liq kalitlarga ko‘chirish; tarjima kalitlarini type-safe qilish; “VOCABULARY” kabi ichki nomlarni lokalizatsiya qilish; tilni URL/localStorage bilan izchil sinxronlash.

### D4. Touch-target va mobil ergonomika

390×844 o‘lchamda:

- mobil header’dagi tema tugmasi 32×32, til tugmasi 55×27;
- JLPT daraja tugmalari 67–71×28;
- unit filter tugmalari 33–34px balandlik;
- `Button` komponentining `sm` varianti 32px, `icon` 40px.

JLPT sahifasidagi 108 ta interaktiv elementdan 15 tasi 36px dan kichik. Apple/Google tavsiyasi 44×44px.

**Tavsiya:** mobil uchun minimal 44px; `sm` variantni 36–40px, icon’ni 44px qilish; zich ro‘yxatlarda vertikal bo‘shliqni oshirish.

### D5. Ikki xil dizayn tizimi aralashgan

Tokenlar (washi/sumi/hanko) yaxshi asos, lekin kodda:

- 237 ta `bg-white`, 72 tasi `dark:` variantisiz;
- 129 ta `text-gray-900`/`text-slate-900`;
- 148 ta `bg-slate-900`, 116 ta `bg-slate-800`, 54 ta `bg-slate-950`;
- 1 278 ta `dark:` patch.

Ya’ni ba’zi sahifalar tokenlarda, ba’zilari standart Tailwind slate/gray palitrasida. Natijada dark/light rejimda kartalar, chegaralar va matn ranglari bir xil ko‘rinmaydi; yangi komponent qo‘shishda qaysi tizimga tayanish noaniq.

**Tavsiya:** `slate/gray/rose/emerald` kabi raw ranglarni semantik tokenlarga almashtirish; `bg-white` ni `bg-card` ga; `text-slate-900` ni `text-foreground` ga; qolgan hardcoded ranglarni codemod bilan inventarizatsiya qilish.

### D6. Motion va reduced-motion

`prefers-reduced-motion` faqat 2 ta CSS animatsiya va 1 ta komponentda hurmat qilinadi (`index.css:272,300`, `KaiwaOrbCharacter.tsx:315`). Shu bilan birga:

- 181 `animate-in`, 102 `animate-spin`, 63 `animate-pulse`, 13 `animate-bounce`, 12 `animate-ping`;
- 777 `transition-all`;
- har bir route o‘zgarishida Framer Motion fade/slide (`Layout.tsx`);
- 10 ta faylda `framer-motion`.

**Tavsiya:** global `@media (prefers-reduced-motion: reduce)` bilan `animation-duration: 0.01ms` va `transition-duration: 0.01ms`; Framer Motion’da `useReducedMotion()`; `transition-all` ni aniq property’larga almashtirish.

### D7. Native `alert/confirm` va modal izchilligi

27 ta `window.confirm`/`alert` chaqiruvi bor (o‘chirish, logout, admin amallari, daraja oshirish). Ular:

- ilova temasiga mos emas (ayniqsa dark mode va Telegram ichida);
- mobil brauzerda bloklaydi;
- xavfli amallarda “Ha” tugmasini boshqa joyda qilish odatini buzadi.

Auth sahifasidagi “Foydalanish shartlari” va “Maxfiylik siyosati” matnlari bosiladigan `span`, havola emas; shartlar sahifasi umuman mavjud emas (`src/pages` da terms/privacy yo‘q). Ro‘yxatdan o‘tishda checkbox **default `true`** (`AuthPage.tsx:65`) — foydalanuvchi roziligini so‘ramasdan oldindan belgilangan.

**Tavsiya:** tasdiqlash uchun yagona `ConfirmDialog` komponenti; xavfli amallarda matnli sabab; Terms/Privacy sahifalarini yaratish; checkbox’ni `false` qilish va havolalarni real qilish.

### D8. Axborot arxitekturasi va ekran zichligi

- JLPT sahifasida 12 ta yuqori tab + 5 ta daraja + 25 ta dars kartasi; har kartada 3 ta CTA (“Darsni Boshlash”, “Mondai”, “AI Speaking Coach”). Bir ekranda 75+ tugma.
- Dashboard’da 7–8 ta katta blok: greeting, streak, focus card, daily plan, roadmap, promotion blockers, quick links.
- Sidebar’da 8 ta asosiy bo‘lim, lekin “Shaxsiy reja”, “Kalendar”, “Fanlar” faqat command palette yoki dashboard havolalari orqali topiladi.
- Mobil pastki navigatsiyada 6 ta element, yorliqlar 10px.

**Tavsiya:** JLPT’da daraja → unit → dars bosqichli drill-down; kartada bitta asosiy CTA + “...” menyu; dashboard’da “bugun” va “tahlil”ni ajratish; sidebar’ga reja/kalendar qo‘shish yoki ularni dashboard’dan doimiy ko‘rinadigan qilish.

### D9. Auth sahifasi accessibility

Runtime tekshiruvida:

- email va parol inputlarida `id`/`name` yo‘q, `label[for]` bog‘lanmagan; accessible name faqat placeholder’dan keladi;
- parolni ko‘rsatish tugmasi ikonka-only va `aria-label` yo‘q;
- “Kirish” tugmasi kontrasti 3.86:1;
- sahifa `useSEO` ishlatmaydi, title umumiy landing title’i bo‘lib qoladi.

**Tavsiya:** `id` + `htmlFor`, `autoComplete`, `aria-describedby`, `aria-label`; xato matnlarini `role="alert"` bilan; sahifa uchun alohida title/description.

### D10. Empty/loading/error holatlari va copy

- Flashcards sahifasida “Takrorlash inbox: bugun muddati kelgan karta yo‘q. Kutubxona faqat boshqaruv uchun.” — foydalanuvchiga tushunarsiz, ichki tildagi matn.
- Terminologiya izchil emas: “Fleshkartalar” (58 marta), “Fleshkard” (6 marta) va “Flashcards” (772 marta, `flashcards`/`Flashcards` ko‘rinishida) aralash ishlatilgan.
- Skeleton faqat bitta komponentda; ko‘p sahifalarda spinner yoki bo‘sh ekran.
- Xatolar ko‘pincha toast bilan cheklanadi, sahifa darajasida retry yo‘q.

**Tavsiya:** har bir sahifa uchun aniq empty/loading/error matnlari; “qayta urinish” tugmasi; copy’ni redaksion ko‘rikdan o‘tkazish.

---

## 7. Prioritetli harakat rejasi

### 0–3 kun (blockerlar)

1. `api/speech-token.js` quota chaqiruvini tuzatish, dev middleware qo‘shish, contract test yozish.
2. Sun’iy `BASELINE_RATING` ni olib tashlash; landing/JSON-LD’da real ma’lumot yoki reytingni yashirish.
3. “Zombi sessiya”ni yo‘q qilish: keshdagi user bilan ilovani ochmaslik, 401’da logout + redirect.
4. `/twa` redirect’ini olib tashlash.
5. `?redirect=` ni AuthPage’da qo‘llash.

### 1–2 hafta

6. Readiness/XP/streak/speaking default’larini “ma’lumot yo‘q” modeliga o‘tkazish.
7. `CRON_SECRET` va webhook secret’ni majburiy qilish; fallback Supabase credentials’ni olib tashlash.
8. Primary/muted rang kontrastini tuzatish; touch-targetlarni 44px ga yetkazish.
9. Auth/Landing/Layout i18n’ini tugallash; inglizcha texnik matnlarni lokalizatsiya qilish.
10. Cookie purge va PWA auto-reload’ni xavfsiz qilish.
11. Curriculum’ni daraja bo‘yicha lazy-load qilish; audio hajmini optimallashtirish.

### 3–6 hafta

12. Dizayn tokenlarini yagona tizimga keltirish (raw slate/gray → semantik tokenlar).
13. Reduced-motion, keyboard focus, screen-reader va 200% zoom auditini avtomatlashtirish.
14. JLPT/dashboard axborot arxitekturasini soddalashtirish.
15. E2E’ni kuchaytirish: screenshot regression, real auth, real RLS, `/twa`, `/api/speech-token`.
16. Migratsiyalarni baseline + CI schema diff bilan tartibga solish.

---

## 8. Tekshirilmagan / keyingi qadam

- Jonli Supabase’dagi RLS siyosatlari va `profiles.role` bilan admin chegarasi real so‘rovlar bilan tasdiqlanmadi.
- Azure Speech kalitlari bilan haqiqiy token olish va pronunciation assessment oqimi sinalmadi; faqat kod/contract tekshirildi.
- iOS Safari (Web Speech API va PWA), Android Chrome, Telegram WebView’da real qurilma testi yo‘q.
- Yapon tili kontenti native speaker tomonidan item-by-item tekshirilmagan (bu alohida redaksion audit).
- Dizayn vizual regressiyasi screenshot’lar bilan qamrab olinmagan; o‘lchovlar DOM/computed style asosida.
