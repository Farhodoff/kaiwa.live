## Dalil va cheklov

- Mahalliy curriculum JSON’larni sanab tekshirish: 140 dars, 0 ta bo‘sh steps ro‘yxati; N5/N4 100 qadamdan, N3/N2/N1 90 qadamdan. Bu strukturani ko‘rsatadi, pedagogik aniqlikni emas.
- Loyiha katalogida mavjud kontent audit kodi va SQL migration o‘qildi; bu vazifada Supabase jonli ulanishiga ulanib so‘rov bajarilmadi.
- Test/build ishga tushirilmadi; ishchi daraxtda oldindan mavjud o‘zgarishlar bor edi va audit faqat ko‘rib chiqish bilan cheklangan.
- Yaponcha savollarning to‘g‘riligi bo‘yicha item-by-item native-speaker proofread hali kerak; bu audit matnini ona tilidagi review o‘rnida ishlatmaslik lozim.

## Joriy ishlar ro'yxati (tavsiya etilgan tartib)

1. **Audit natijalarini ishonchli qilish:** sahifalash/umumiy son, yuklangan qamrov ko‘rsatkichi, javob aggregatsiyasini serverga ko‘chirish
2. **Savol validatsiyasini kuchaytirish:** javob-variant mosligi, tanilmagan savol turi, locale/furigana, matn sifati va "reviewed" holati
3. **0-level va N5→N1 curriculum map tuzish:** prerequisite/order va learning outcome validator qo‘shish
4. **Kontent manbalari bo‘yicha yagona qamrov paneli:** lesson, vocabulary, grammar, kanji, reading, listening, speaking; dashboard N3–N1 ekanini aniq belgilash
5. **Accuracy hisobotini sample threshold, unique learners, versiya va vaqt kesimi bilan qayta talqin qilish**
6. **Landing demo va feature truthfulness’ni to‘g‘rilash:** CTA’larni birinchi real darsgacha qisqartirish
7. **Vizual/accessibility QA’ni real ekranlarda yakunlash:** 360px mobil, planshet, desktop dark/light; WCAG kontrast/focus; uzun kanji/furigana va o‘zbekcha satr sinovi

### 10. Accuracy hisobotini sample threshold, unique learners, versiya va vaqt kesimi bilan qayta talqin qilmaslik

**Foydalanuvchisi:** Admin dashboard  
**Muammoning tavsifi:** Accuracy hisoboti faqt umumiy “accuracy” deb talqin qilinadi; o‘quvchi xatosi va item sifatining ajraltirgandaki sababi qamramaydi.

**Tavsiya:**

- Sample threshold, unique learners, versiya va vaqt kesimi bilan qayta talqin qilish
- Accuracy’ni sababli ajratmasdan "bug" deb atamang

**Joriy kod:** `src/services/ContentQualityAuditService.ts:39-40`

### 9. JLPT 0-level va N5→N1 curriculum map tuzilmagan

**Foydalanuvchisi:** CurriculumStructure  
**Muammoning tavsifi:** Mavjud curriculum faqat N5–N1 oqimini hisoblaydigan lekin 0-level (bosqich) va N5→N1 o‘rni uchun mapping tuzilmagan.

**Tavsiya:**

- 0-level va N5→N1 curriculum map tuzish
- Prerequisite/order va learning outcome validator qo‘shish

**Joriy kod:** `src/services/CurriculumService.ts`

### 8. Duplicate savollarni "aniq matn mosligi" va "ehtimoliy semantik dublikat" qilib ajratmaslik

**Foydalanuvchisi:** Duplicate detection logika  
**Muammoning tavsifi:** Bir xil stem bilan farqli, o‘rinli kontekstli savollar `duplicate` flag olishi mumkin; lekin matni ozgina o‘zgargan `ayni savol` esa topilmaydi. Bu audit natijalarinda mistaken dublikatlar yaratadi.

**Xavf:**

- Manfoy talabolarga olib kelish
- To‘liq bog‘liq savollar filteringda xato

**Tavsiya:**

- Duplicate’ni “aniq matn mosligi” va “ehtimoliy semantik dublikat” qilib ajratish
- Tur/variant/javob/passage ID ni taqqoslash
- Ehtimoliy dublikatni tahrirchi ko‘rib tasdiqlash

**Joriy kod:** `src/services/ContentQualityAuditService.ts:34-35`

### 7. UI dizayni bo‘yicha keyingi vizual audit kerak

**Foydalanuvchisi:** Barcha UI komponentlari  
**Muammoning tavsifi:** Kodda theme tokenlari (washi/vermillion, dark theme), Japanese font va komponent utility’lari bor — bu yaxlit asos. Biroq audit mobil/desktopda real render, kontrast, focus, klaviatura, empty/loading/error, uzun yapon subtitle/furigana wrapping, text scaling va motion preference’ni brauzerda tekshirmadi.

**Xavf:**

- “Dizayn yaxshi/yomon” yakuniy bahosiga screenshot’li qurilma QA yo‘q
- WCAG kontrast va focus issue larmi emas

**Tavsiya:**

- 360px mobil, planshet, desktop hamda dark/light bo‘yicha asosiy yo’llar
- WCAG kontrast/focus va reduced-motion
- Uzun kanji/furigana va o‘zbekcha satr sinovi
- Screenshot regression testi

**Joriy kod:** Barcha `src/components/` — визуальный audit kerak

### 6. Landing sahifaydi demo mahsulotning jonli funksiyasiga o‘xshab ko‘rinadi

**Foydalanuvchisi:** Landing page hero va showcase  
**Muammoning tavsifi:** Landing hero va showcase ichida chat xabarlari, onlayn indikator, mic, daraja/mavzu va card tanlash bor. Ko‘rilgan misolda mic tugmasi faqat tarjimani yashiradi/ko‘rsatadi; haqiqiy ovoz yozmaydi. Demo interaktiv maket bo‘lsa ham bu holat yangi foydalanuvchiga "real coach sessiyasi" deb ko‘rinishi mumkin.

**Xavf:**

- Foydalanuvchi o‘zning ovozini yozishni lo‘ngamaydi
- Coach sessiyasiga tasdiqlanmagan namoyin

**Tavsiya:**

- Maketni “Demo” deb belgilash yoki boshqaruvlarni ishlaydigan feature‘ga olib borish
- Mic tugmasi action qilmasa uni dekorativ element qilib ko‘rsatmaslik
- Samarali primary CTA bilan “darajani tanlang → placement → birinchi dars” oqimini yagona qilib berish

**Joriy kod:** `src/components/landing/` (qisqaroq tekshiruv kerak)

### 5. Javob aniqligi statistikasi urinishlar soniga bog‘liq va xato baholanishi mumkin

**Foydalanuvchisi:** Answer audit  
**Muammoning tavsifi:** Answer audit barcha yozuvlarni oddiy attempt sifatida jamlaydigan; foydalanuvchi takroriy urinishlari, user soni, test versiyasi va vaqt bo‘yicha farq yo‘q. Bitta faol foydalanuvchining ko‘p urinishlari ko‘rsatilmasdi, kam urinishli savol esa tasodifan “eng xatoli” chiqishi mumkin.

**Xavf:**

- Accuracy o‘quvchi xatosi va item sifati sabablari ayrilmaydigan
- Rating aniqlik oshib ketyapti

**Tavsiya:**

- Unique learner count, attempt window, savol/content version, confidence interval/sample threshold qo‘shing
- `attempts` kam bo‘lsa ratingdan yashiring
- Accuracy’ni o‘quvchi xatosi va item sifati sabablari bilan ajratib bo‘lmaslik

**Joriy kod:** `src/services/ContentQualityAuditService.ts:37-40`

### 4. Mavjud audit N5/N4 va asosiy dars bazasini qamramaydi

**Foydalanuvchisi:** `CONTENT_AUDIT_LEVELS`  
**Muammoning tavsifi:** `CONTENT_AUDIT_LEVELS` faqat N3, N2, N1 ichig‘ini qamrabilan, N5 va N4 darslari hisobga olinmaydigan.

**Xavf:**

- Dasturiy ta’minot hajmi bo‘yicha{oqim}siz boshqaruvi
- Qadimi yoki kamqadam darslar yo‘qoladi

**Tavsiya:**

- `CONTENT_AUDIT_LEVELS` ga N5 va N4ni qo‘shing
- Barcha levelarni (N5–N1) qo‘llanuvchi qadamlar ketma-ketligini hisoblaydigan map tuzling

**Joriy kod:** `src/services/ContentQualityAuditService.ts:11`

### 3. Darslar qamrovi bor, lekin ketma-ketlik va prerequisite’lar formal ravishda tasdiqlanmagan

**Foydalanuvchisi:** `CurriculumService`, `LessonPlayerPage`  
**Muammoning tavsifi:**

- JSON curriculumda N5 25, N4 25, N3 30, N2 30, N1 30 dars aniqlandi (jami 140; har birida 3–4 qadam)
- Lekin `unitId` va `lessonNumber` ketma-ketligini ko‘rish prerequisite grafi to‘g‘ri, uzluksiz va kontentning murakkabligi oshib borishini isbotlamaydi
- `CurriculumService.createLessonNode()`da prerequisite berilmagan holatda `[]` ishlatiladi; generatorning o‘zi ketma-ketlikni kafolatlamaydi
- `LessonPlayerPage` access-check’ni `LearningOrchestrator`ga topshiradi — haqiqiy tartib o‘sha resolver va lesson kontentdagi metadata bilan ham tekshirilishi kerak

**Xavf:**

- Foydalanuvchi darslar oralig‘i zarurondan oldin o‘tkazishi mumkin
- Takrorli yoki topilmagan urinishlar

**Tavsiya:**

- Har kurs uchun o‘quv natijasi → dars → mashq → baholash jadvali
- Tushuncha/kanji/grammatika prerequisite grafigi
- CI validator: cyclic, yetim ID, takroriy order va darajadan oldin berilgan materialni tekshirish
- Yangi grammatikani oldingi darslardaki lug‘at bilan cheklab bo‘lmaydigan joylarda “oldindan tanish” belgisi qo‘shing

**Joriy kod:** `src/services/CurriculumService.ts`, `src/services/CurriculumPrerequisiteValidatorService.ts`

### 2. "Kontent sifatini" tekshiruvi to‘liq emas, javobning to‘g‘riligini emas

**Foydalanuvchisi:** `ContentQualityAuditService` — `hasCorrectAnswer()`, `classifySkill()`  
**Muammoning tavsifi:**

- Audit to‘liq matn, 2+ variant, javob borligi, izoh borligi, reading/audio havolalarini tekshiradi lekin **javobning to‘g‘riligini** emas
- `hasCorrectAnswer()` har qanday obyektni "javob" deb qabul qiladi — turli turdagi validatsiya yo‘q
- `classifySkill()` tanimagan savol turini `vocabulary` deb belgilaydi — skill taqsimoti noto‘g‘ri ko‘rsatishi mumkin
- JLPT darajasiga moslik, tarjimalar va furigana tekshirilmaydigan

**Xavf:**

- To‘liq “structurally complete” namunaviy chunklar tuziladi lekin “editorially verified” emas
- Foydalanuvchi o‘qiydigan kvalitetni ta’minlanmaydigan

**Tavsiya:**

- Schema-level validator (javob indeksi variantlar oralig‘ida, tur/variantlar mos)
- Tip `unknown`/"tasniflanmadi" statusi
- Misol/translation/furigana validatsiyasi
- N5→N1 bo‘yicha alohida redaksion/native review
- “Structurally complete” va “editorially verified”ni alohida ko‘rsating

**Joriy kod:** `src/services/ContentQualityAuditService.ts:19-20`

# Kaiwa Live — Lohiha va Kamchiliklar Ro'yxati (Bugs & Defects)

**Sana:** 2026-11-08  
**Status:** Taxminiy review — audit natijalari asosida tuzildi  
**Manba:** AUDIT.md va kod statik tahlili

---

## P0 — Umumiy oqim bo‘yicha jihatcha muammolar

### 1. Admin audit to‘liq ma’lumot olmasdan ishonchli hisobot chiqarishi mumkin

**Foydalanuvchisi:** `ContentQualityAuditService.fetchReport()`  
**Muammoning tavsifi:** `select('*')` (ya da to‘liq `select` so‘rovi) yuboriladigan jadvallar pagination yoki sonlar bo‘yicha cheklovsiz. Agar `exam_answers` jadvali savol, exam yoki javob yozuvlari limitdan oshsa, audit "to‘liq emas" bo‘lishi mumkin — dublikatlar, maydonlar va statistika to‘liq qaytarilmaydigan datasetga aylanadi.

**Xavf:**

- Dataset o‘lchami keyingi davrda yaxlit bo‘lib qoladi
- Statistika noto‘g‘ri (faqat qolgan ko‘plab javoblar hisoblanadi)
- Audio qamrovi va xatolar eskirishi mumkin

**Tavsiya:**

- Server-side aggregatsiya/RPC yoki barqaror sahifalash (range + umumiy son)
- Har jadval bo‘yicha fetched/total nazorati
- `exam_answers` ni savol bo‘yicha aggregatsiyalash va vaqt oralig‘i chegaralash
- Limitga yetganda audit "to‘liq emas" deb chiqsin

**Joriy kod:** `src/services/ContentQualityAuditService.ts:736-748`
