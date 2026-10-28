# Kaiwa Live — loyiha auditi

**Sana:** 2026-10-26  
**Qamrov:** repo ichidagi UI va curriculum, lesson player, JLPT kontent oqimi, mavjud admin kontent auditi hamda uning Supabase so‘rovlari. Bu kodga tayangan audit; jonli production bazasi, haqiqiy qurilmalardagi vizual tekshiruv va yapon tili mutaxassisi/native-speaker tekshiruvi bajarilmadi.

## Qisqa xulosa

Mahsulotda katta funksional qamrov va ancha tartibli dars skeleti bor: mahalliy curriculumda 140 dars aniqlandi, har birida qadamlar mavjud. Eng muhim muammo — kontent to‘g‘riligini va o‘qish ketma-ketligini tasdiqlaydigan tekshiruvlar shu qamrovga teng emas. Mavjud kontent auditi faqat Supabase’dagi N3–N1 test savollarini tekshiradi; 0-level, N5/N4 Minna darslari va N5–N1 vocabulary decklari unga kirmaydi. Savollar to‘liq yuklanayotganini ham kafolatlamaydi. Shuning uchun UI’dagi sifat foizlarini hozircha umumiy “accuracy” deb talqin qilib bo‘lmaydi.

## Muhim topilmalar

### P0 — Admin audit to‘liq ma’lumot olmasdan ishonchli hisobot chiqarishi mumkin

`ContentQualityAuditService.fetchReport()` olti jadvalga `select('*')`/to‘liq `select` so‘rovi yuboradi, lekin paginatsiya yoki sonlar bo‘yicha tekshiruv yo‘q. Supabase/PostgREST javob limiti natijani kesishi mumkin; savol, exam yoki answer yozuvlari limitdan oshsa audit kesilgan datasetni to‘liqdek sanaydi. Natijada dublikatlar, yo‘q maydonlar, audio qamrovi va xatolar statistikasi chalg‘itishi mumkin. `exam_answers` ning hammasini olib kelish katta hajmda sekinlik va ortiqcha trafik keltiradi.  
**Tavsiya:** server-side agregatsiya/RPC yoki barqaror sahifalash (range + umumiy son), har jadval bo‘yicha fetched/total nazorati, `exam_answers` ni savol bo‘yicha agregatsiyalash va vaqt oralig‘ini chegaralash. Limitga yetganda audit “to‘liq emas” deb chiqsin.

### P1 — “Kontent sifati” tekshiruvi to‘liqlikni o‘lchaydi, javobning to‘g‘riligini emas

Audit bo‘sh matn, 2+ variant, javob borligi, izoh borligi hamda reading/audio havolalarini tekshiradi. U `correctAnswer` varianti mavjud variantga mosligini, javob izoh bilan mantiqan mosligini, savol yaponchasi/uzbekcha tarjimasi tabiiyligini, JLPT darajasiga mosligini yoki chalg‘ituvchi variantlar sifatini tekshirmaydi. `hasCorrectAnswer()` har qanday obyektni ham javob deb qabul qiladi. `classifySkill()` tanimagan savol turini `vocabulary` deb belgilaydi, bu skill taqsimotini noto‘g‘ri ko‘rsatishi mumkin.  
**Tavsiya:** schema-level validator (javob indeksi variantlar oralig‘ida, tur/variantlar mos), tip `unknown`/“tasniflanmadi” statusi, misol/translation/furigana validatsiyasi va N5→N1 bo‘yicha alohida redaksion/native review. “Structurally complete” bilan “editorially verified”ni alohida ko‘rsating.

### P1 — Darslar qamrovi bor, lekin ketma-ketlik va prerequisite’lar formal ravishda tasdiqlanmagan

JSON curriculumda N5 25, N4 25, N3 30, N2 30, N1 30 dars aniqlandi (jami 140; har birida 3–4 qadam). Lekin darslarning `unitId` va `lessonNumber` ketma-ketligini ko‘rish prerequisite grafi to‘g‘ri, uzluksiz va kontentning murakkabligi oshib borishini isbotlamaydi. `CurriculumService.createLessonNode()`da prerequisite berilmagan holatda `[]` ishlatiladi; generatorning o‘zi ketma-ketlikni kafolatlamaydi. `LessonPlayerPage` access-check’ni `LearningOrchestrator`ga topshiradi, shuning uchun haqiqiy tartib o‘sha resolver va lesson kontentdagi metadata bilan ham tekshirilishi kerak.  
**Tavsiya:** har kurs uchun o‘quv natijasi → dars → mashq → baholash jadvali; tushuncha/kanji/grammatika prerequisite grafigi; cyclic, yetim ID, takroriy order va darajadan oldin berilgan materialni tekshiruvchi CI validator. Yangi grammatikani oldingi darslardagi lug‘at bilan cheklab bo‘lmaydigan joylarga “oldindan tanish” belgisi qo‘shing.

### P1 — Mavjud audit N5/N4 va asosiy dars bazasini qamramaydi

`CONTENT_AUDIT_LEVELS` faqat N3, N2, N1. `fetchReport()` faqat `exams` / `exam_sections` / `exam_questions` va ular bilan bog‘liq passage/audio/answer jadvallarini yig‘adi. JSON dars curriculum, Minna test banki, vocabulary decks, grammar DB, alifbo 0-level, speaking scenariolar hisobotga kirmaydi. Demak admin panelda “skill coverage” 100% bo‘lsa ham butun platforma qamrovi degani emas.  
**Tavsiya:** data source’larni alohida audit qatlamlariga ajratib, hammasini umumiy indeksda ko‘rsatish; hozircha dashboard nomi/izohida qamrovni “N3–N1 exam question bank” deb aniq cheklash.

### P1 — Dublikat aniqlash faqat bir xil savol matnini topadi

Savol fingerprint’i normallashtirilgan `questionText`dan iborat. Variantlar, javob, passage/audio konteksti hisobga olinmaydi. Shu nedenle bir xil stem bilan farqli, o‘rinli kontekstli savollar duplicate flag olishi mumkin; matni ozgina o‘zgargan ayni savol esa topilmaydi.  
**Tavsiya:** duplicate’ni “aniq matn mosligi” va “ehtimoliy semantik dublikat” qilib ajratish; tur/variant/javob/passage ID ni taqqoslash; ehtimoliy dublikatni tahrirchi ko‘rib tasdiqlasin.

### P2 — Javob aniqligi statistikasi urinishlar soniga bog‘liq va xato baholanishi mumkin

Answer audit barcha yozuvlarni oddiy attempt sifatida jamlaydi; foydalanuvchi takroriy urinishlari, user soni, test versiyasi va vaqt bo‘yicha farq yo‘q. Bitta faol foydalanuvchining ko‘p urinishlari ko‘rsatkichni egallashi, kam urinishli savol esa tasodifan “eng xatoli” chiqishi mumkin.  
**Tavsiya:** unique learner count, attempt window, savol/content version, confidence interval/sample threshold qo‘shing; `attempts` kam bo‘lsa reytingdan yashiring. Accuracy’ni o‘quvchi xatosi va item sifati sababini ajratmasdan bug deb atamang.

### P2 — Landing sahifadagi demo mahsulotning jonli funksiyasiga o‘xshab ko‘rinadi

Landing hero va showcase ichida chat xabarlari, onlayn indikatori, mic, daraja/mavzu va card tanlash bor. Ko‘rilgan misolda mic tugmasi faqat tarjimani yashiradi/ko‘rsatadi; haqiqiy ovoz yozmaydi. Demo interaktiv maket bo‘lsa ham bu holat yangi foydalanuvchiga real coach sessiyasi deb ko‘rinishi mumkin.  
**Tavsiya:** maketni “Demo” deb belgilash yoki boshqaruvlarni ishlaydigan feature’ga olib borish; mic tugmasi action qilmasa uni dekorativ element qilib ko‘rsatmaslik. Samarali primary CTA bilan “darajani tanlang → placement → birinchi dars” oqimini yagona qilib berish.

### P2 — UI dizayni bo‘yicha keyingi vizual audit kerak

Kodda theme tokenlari (washi/vermillion, dark theme), Japanese font va komponent utility’lari bor — bu yaxlit asos. Biroq audit mobil/desktopda real render, kontrast, focus, klaviatura, empty/loading/error, uzun yapon subtitle/furigana wrapping, text scaling va motion preference’ni brauzerda tekshirmadi. Shuning uchun “dizayn yaxshi/yomon” yakuniy bahosiga screenshot’li qurilma QA qo‘shish zarur.
**Tavsiya:** 360px mobil, planshet, desktop hamda dark/light bo‘yicha asosiy yo‘llar; WCAG kontrast/focus va reduced-motion; uzun kanji/furigana va o‘zbekcha satr sinovi; screenshot regression.

## Ishlar ro‘yxati (tavsiya etilgan tartib)

1. Audit natijalarini ishonchli qilish: sahifalash/umumiy son, yuklangan qamrov ko‘rsatkichi, javob agregatsiyasini serverga ko‘chirish.
2. Savol validatsiyasini kuchaytirish: javob-variant mosligi, tanilmagan savol turi, locale/furigana, matn sifati va “reviewed” holati.
3. 0-level va N5→N1 curriculum map tuzish; prerequisite/order va learning outcome validator qo‘shish.
4. Kontent manbalari bo‘yicha yagona qamrov paneli: lesson, vocabulary, grammar, kanji, reading, listening, speaking; mavjud dashboard N3–N1 ekanini aniq belgilash.
5. Accuracy hisobotini sample threshold, unique learners, versiya va vaqt kesimi bilan qayta talqin qilish.
6. Landing demo va feature truthfulness’ni to‘g‘rilash; CTA’larni birinchi real darsgacha qisqartirish.
7. Vizual/accessibility QA’ni real ekranlarda yakunlash.

## Dalil va cheklov

- Mahalliy curriculum JSON’larini sanab tekshirish: 140 dars, 0 ta bo‘sh steps ro‘yxati; N5/N4 100 qadamdan, N3/N2/N1 90 qadamdan. Bu strukturani ko‘rsatadi, pedagogik aniqlikni emas.
- Loyiha katalogida mavjud kontent audit kodi va SQL migration o‘qildi; bu vazifada Supabase jonli ulanishiga ulanib so‘rov bajarilmadi.
- Test/build ishga tushirilmadi; ishchi daraxtda oldindan mavjud o‘zgarishlar bor edi va audit faqat ko‘rib chiqish bilan cheklangan.
- Yaponcha savollarning to‘g‘riligi bo‘yicha item-by-item native-speaker proofread hali kerak; bu audit matnini ona tilidagi review o‘rnida ishlatmaslik lozim.
