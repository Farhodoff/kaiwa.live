# -*- coding: utf-8 -*-
"""
JLPT N4 Unit 5: Particle Combos, Health Situations, Task Choukai, Mock Exam & Keigo
Lessons 21-25 (15 authentic exercises per lesson = 75 exercises total)
"""

UNIT5_EXERCISES = {
    # ----------------------------------------------------
    # Lesson 21: N4 Grammar Review: Particle Combinations (には, では, とも, からの)
    # ----------------------------------------------------
    "ja-n4-u5-l1": [
        {
            "id": "ja-n4-u5-l1-ex-1",
            "type": "multiple-choice",
            "prompt": "Qo'shma zarracha «には» ning maqsadi qaysi gapda to'g'ri ifodalangan?\n«Toshkentdan Samarqandga borish uchun poyezd qulay»:",
            "options": [
                "サマルカンドへ 行[い]くには、電車[でんしゃ]が 便利[べんり]です",
                "サマルカンドへ 行くでは、電車が 便利です",
                "サマルカンドへ 行くとも、電車が 便利です",
                "サマルカンドへ 行くへの、電車が 便利です"
            ],
            "correctAnswer": 0,
            "explanation": "Maqsad va mo'ljal: fe'lning lug'at shakli + には (borish uchun / yetib borish maqsadida)."
        },
        {
            "id": "ja-n4-u5-l1-ex-2",
            "type": "multiple-choice",
            "prompt": "«Yaponiya maktablarida odatda forma kiyiladi» (makon ta'kidi - «では»):",
            "options": [
                "日本[にほん]の 学校[がっこう]では、制服[せいふく]を 着[き]ます",
                "日本の 学校には、制服を着ます",
                "日本の 学校へは、制服を着ます",
                "日本の 学校とは、制服を着ます"
            ],
            "correctAnswer": 0,
            "explanation": "Joydagi odatiy qoida yoki holatni ta'kidlash: 〜では (Maktablarda esa...)."
        },
        {
            "id": "ja-n4-u5-l1-ex-3",
            "type": "multiple-choice",
            "prompt": "«Ota-onamdan kelgan xatni o'qidim» (boshlanish nuqtasi va egalik - «からの»):",
            "options": [
                "両親[りょうしん]からの 手紙[てがみ]を 読[よ]みました",
                "両親までの 手紙を 読みました",
                "両親への 手紙を 読みました",
                "両親での 手紙を 読みました"
            ],
            "correctAnswer": 0,
            "explanation": "Manba + tegishlilik: 両親からの手紙 (Ota-onamdan [kelgan] xat). Agar ota-onamga yuboriladigan xat bo'lsa: 両親への手紙."
        },
        {
            "id": "ja-n4-u5-l1-ex-4",
            "type": "multiple-choice",
            "prompt": "«Tokiogacha bo'lgan poyezd chiptasi» (yakuniy nuqta va egalik - «までの»):",
            "options": [
                "東京[とうきょう]までの 切符[きっぷ]",
                "東京からの 切符",
                "東京での 切符",
                "東京へのの 切符"
            ],
            "correctAnswer": 0,
            "explanation": "Manzil chegarasi + ot: 東京までの切符 (Tokiogacha bo'lgan chipta)."
        },
        {
            "id": "ja-n4-u5-l1-ex-5",
            "type": "multiple-choice",
            "prompt": "«Do'stim bilan ham uchrashdim» (hamkorlik va ta'kid - «とも»):",
            "options": [
                "友達[ともだち]とも 会[あ]いました",
                "友達でも 会いました",
                "友達へも 会いました",
                "友達からも 会いました"
            ],
            "correctAnswer": 0,
            "explanation": "Birov bilan birga + «ham»: とも (Do'stim bilan ham uchrashdim)."
        },
        {
            "id": "ja-n4-u5-l1-ex-6",
            "type": "multiple-choice",
            "prompt": "«Yaponiyada yashash chet elliklar uchun biroz qiyin bo'lishi mumkin» (~にとって - nazarida/nuqtai nazaridan):",
            "options": [
                "外国人[がいこくじん]にとって、日本[にほん]の 生活[せいかつ]は 大変[たいへん]かも しれません",
                "外国人に ついて、日本の 生活は 大変です",
                "外国人に よって、日本の 生活は 大変です",
                "外国人として、日本の 生活は 大変です"
            ],
            "correctAnswer": 0,
            "explanation": "Shaxs yoki toifa nuqtai nazaridan baholash: 〜にとって (Chet elliklar uchun / nazarida)."
        },
        {
            "id": "ja-n4-u5-l1-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「健康[けんこう]を　＿＿　＿＿　★　＿＿　大切[たいせつ]です。」",
            "options": ["1: 運動[うんどう]が", "2: 保[たも]つには、", "3: 毎日[まいにち]の", "4: 食事[しょくじ]と"],
            "correctAnswer": 3,
            "explanation": "To'g'ri tartib: 「健康を 保つには、(2) 毎日の (3) 食事と (4★) 運動が (1) 大切です。」 Yulduzcha 4-variantdagi 食事と ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u5-l1-ex-8",
            "type": "multiple-choice",
            "prompt": "«Yapon madaniyati haqida (mavzusida) taqdimot qildim» (~について):",
            "options": [
                "日本[にほん]の 文化[ぶんか]に ついて 発表[はっぴょう]しました",
                "日本の 文化に とって 発表しました",
                "日本の 文化に して 発表しました",
                "日本の 文化に よって 発表しました"
            ],
            "correctAnswer": 0,
            "explanation": "Mavzu yuzasidan, to'g'risida: 〜について (発表しました)."
        },
        {
            "id": "ja-n4-u5-l1-ex-9",
            "type": "multiple-choice",
            "prompt": "«Talaba sifatida (maqomida) stipendiya oldim» (~として):",
            "options": [
                "留学生[りゅうがくせい]として 奨学金[しょうがくきん]を もらいました",
                "留学生にとって 奨学金を もらいました",
                "留学生について 奨学金を もらいました",
                "留学生による 奨学金を もらいました"
            ],
            "correctAnswer": 0,
            "explanation": "Maqom, rol, unvon sifatida: 〜として (Talaba sifatida)."
        },
        {
            "id": "ja-n4-u5-l1-ex-10",
            "type": "multiple-choice",
            "prompt": "«Bu dorini ichish uchun avval ovqatlanish shart» (~には):",
            "options": [
                "この 薬[くすり]を 飲[の]むには、まず 食事[しょくじ]を しなければ なりません",
                "この 薬を 飲むでは、食事を しなければ なりません",
                "この 薬を 飲むとは、食事を しなければ なりません",
                "この 薬を 飲むへは、食事を しなければ なりません"
            ],
            "correctAnswer": 0,
            "explanation": "Shart/zarurat: 飲むには (ichish uchun)."
        },
        {
            "id": "ja-n4-u5-l1-ex-11",
            "type": "multiple-choice",
            "prompt": "«Uyimdan ishxongacha bo'lgan yo'l 1 soat vaqt oladi»:",
            "options": [
                "家[いえ]から 会社[かいしゃ]までは 1時間[いちじかん] かかります",
                "家から 会社へは 1時間 かかります",
                "家で 会社までは 1時間 かかります",
                "家に 会社では 1時間 かかります"
            ],
            "correctAnswer": 0,
            "explanation": "Chegarani ta'kidlash: 〜からは / 〜までは."
        },
        {
            "id": "ja-n4-u5-l1-ex-12",
            "type": "multiple-choice",
            "prompt": "«Unga ham, menga ham xushxabar keldi»:",
            "options": [
                "彼[かれ]にも 私[わたし]にも よい 知[し]らせが 来[き]ました",
                "彼でも 私でも よい 知らせが 来ました",
                "彼へも 私へも よい 知らせが 来ました",
                "彼をも 私をも よい 知らせが 来ました"
            ],
            "correctAnswer": 0,
            "explanation": "Harakat yetib borgan har ikki shaxs: 彼にも私にも."
        },
        {
            "id": "ja-n4-u5-l1-ex-13",
            "type": "multiple-choice",
            "prompt": "«Toshkentda ham qor yog'di»:",
            "options": [
                "タシケントでも 雪[ゆき]が 降[ふ]りました",
                "タシケントにも 雪が 降りました",
                "タシケントへも 雪が 降りました",
                "タシケントからも 雪が 降りました"
            ],
            "correctAnswer": 0,
            "explanation": "Harakat sodir bo'lgan joyda ham: タシケントでも (Toshkentda ham)."
        },
        {
            "id": "ja-n4-u5-l1-ex-14",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos qo'shma zarrachani tanlang:\n「母[はは]（　　） プレゼントを 喜[よろこ]んで もらいました。」",
            "options": ["への", "での", "との", "よりの"],
            "correctAnswer": 0,
            "explanation": "Onamga atalgan sovg'a: 母へのプレゼント."
        },
        {
            "id": "ja-n4-u5-l1-ex-15",
            "type": "multiple-choice",
            "prompt": "«Men uchun bu juda muhim xotira» (~にとって):",
            "options": [
                "私[わたし]にとって、これは とても 大切[たいせつ]な 思[おも]い出[で]です",
                "私について、これは とても 大切な 思い出です",
                "私として、これは とても 大切な 思い出です",
                "私によると、これは とても 大切な 思い出です"
            ],
            "correctAnswer": 0,
            "explanation": "Shaxsiy baholash: 私にとって (Men uchun / mening nazarimda)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 22: N4 Health & Hospital Situations (Describing Symptoms)
    # ----------------------------------------------------
    "ja-n4-u5-l2": [
        {
            "id": "ja-n4-u5-l2-ex-1",
            "type": "multiple-choice",
            "prompt": "«Isitmalayapman (haroratim baland)» shifokorga qanday aytiladi?",
            "options": [
                "熱[ねつ]が あります",
                "熱が 痛[いた]いです",
                "熱を 出[だ]します",
                "熱が 出[で]て あります"
            ],
            "correctAnswer": 0,
            "explanation": "Isitma chiqishi: 熱がある / 熱が出る (Netsu ga aru)."
        },
        {
            "id": "ja-n4-u5-l2-ex-2",
            "type": "multiple-choice",
            "prompt": "«Boshim og'riyapti» qaysi javobda to'g'ri?",
            "options": [
                "頭[あたま]が 痛[いた]いです",
                "頭が 痒[かゆ]いです",
                "頭が 悪[わる]いです",
                "頭が 重[おも]く あります"
            ],
            "correctAnswer": 0,
            "explanation": "Og'riq hissi: 頭が痛い (Boshim og'riyapti)."
        },
        {
            "id": "ja-n4-u5-l2-ex-3",
            "type": "multiple-choice",
            "prompt": "«Tomoq og'rig'i va yo'tal bor» jumlasi qaysi?",
            "options": [
                "のどが 痛[いた]くて、せきが 出[で]ます",
                "のどが 痛くて、せきが あります",
                "のどを 痛くて、せきを します",
                "のどが 痒くて、せきを 飲みます"
            ],
            "correctAnswer": 0,
            "explanation": "Yo'tal chiqishi doimo せきが出る (Seki ga deru) deyiladi."
        },
        {
            "id": "ja-n4-u5-l2-ex-4",
            "type": "multiple-choice",
            "prompt": "Shifokorning maslahati: «Bugun erta yotib dam olganingiz ma'qul» (~たほうがいい):",
            "options": [
                "今日[きょう]は 早[はや]く 寝[ね]た ほうが いいですよ",
                "今日は 早く 寝る ほうが いいですよ",
                "今日は 早く 寝て ほうが いいですよ",
                "今日は 早く 寝ない ほうが いいですよ"
            ],
            "correctAnswer": 0,
            "explanation": "Maslahat berish formulasi: fe'lning た-shakli + ほうがいい (寝たほうがいい)."
        },
        {
            "id": "ja-n4-u5-l2-ex-5",
            "type": "multiple-choice",
            "prompt": "Inkor maslahat: «Muzdek suv ichmaganingiz ma'qul» (~ないほうがいい):",
            "options": [
                "冷[つめ]たい 水[みず]を 飲[の]まない ほうが いいですよ",
                "冷たい 水を 飲まなくて ほうが いいですよ",
                "冷たい 水を 飲まないで ほうが いいですよ",
                "冷たい 水を 飲んだ ほうが いいですよ"
            ],
            "correctAnswer": 0,
            "explanation": "Qilmagan ma'qul (salbiy maslahat): fe'lning ない-shakli + ほうがいい (飲まないほうがいい)."
        },
        {
            "id": "ja-n4-u5-l2-ex-6",
            "type": "multiple-choice",
            "prompt": "Kasal kishiga aytiladigan «Tezroq sog'ayib keting / O'zingizni asrang» odob ifodasi qaysi?",
            "options": [
                "お大事[だいじ]に",
                "お邪魔します",
                "失礼します",
                "おめでとう ございます"
            ],
            "correctAnswer": 0,
            "explanation": "Bemorga hamdardlik va tez sog'ayish tilagi: 「お大事に」 (Odaiji ni)."
        },
        {
            "id": "ja-n4-u5-l2-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「胃[い]が　＿＿　＿＿　★　＿＿　見[み]てもらいました。」",
            "options": ["1: 病院[びょういん]で", "2: 痛[いた]むので、", "3: お医者[いしゃ]さんに", "4: 検査[けんさ]して"],
            "correctAnswer": 2,
            "explanation": "To'g'ri tartib: 「胃が 痛むので、(2) 病院で (1) お医者さんに (3★) 検査して (4) 見てもらいました。」 Yulduzcha 3-variantdagi お医者さんに ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u5-l2-ex-8",
            "type": "multiple-choice",
            "prompt": "«Qornim og'riyapti (oshqozonim buzildi)»:",
            "options": [
                "おなか（胃[い]）が 痛[いた]いです",
                "おなかが すきました",
                "おなかが いっぱいです",
                "おなかが 減[へ]りました"
            ],
            "correctAnswer": 0,
            "explanation": "Qorin og'rig'i: おなかが痛い. (おなかがすきました - qornim ochdi, いっぱいです - qornim to'ydi)."
        },
        {
            "id": "ja-n4-u5-l2-ex-9",
            "type": "multiple-choice",
            "prompt": "«Gripp bo'lib qoldim» jumlasi qaysi?",
            "options": [
                "インフルエンザに かかりました",
                "インフルエンザを 治[なお]りました",
                "インフルエンザが 痛いです",
                "インフルエンザを 飲みました"
            ],
            "correctAnswer": 0,
            "explanation": "Yuqumli kasallikka chalinish: 病気 / インフルエンザ に かかる (Kakarimashita)."
        },
        {
            "id": "ja-n4-u5-l2-ex-10",
            "type": "multiple-choice",
            "prompt": "«Shamollab qoldim (tumov bo'ldim)» ifodasi qaysi?",
            "options": [
                "かぜを ひきました",
                "かぜを ひろいました",
                "かぜを 吹[ふ]きました",
                "かぜを 浴[あ]びました"
            ],
            "correctAnswer": 0,
            "explanation": "Shamollash doimo: 風邪[かぜ]をひく (Kaze o hiku / hikimashita) deb aytiladi."
        },
        {
            "id": "ja-n4-u5-l2-ex-11",
            "type": "multiple-choice",
            "prompt": "«Kasalxonaga ko'rikka borganingiz ma'qul» (~たほうがいい):",
            "options": [
                "一度[いちど] 病院[びょういん]へ 行[い]った ほうが いいですよ",
                "一度 病院へ 行く ほうが いいですよ",
                "一度 病院へ 行って ほうが いいですよ",
                "一度 病院へ 行かない ほうが いいですよ"
            ],
            "correctAnswer": 0,
            "explanation": "Kuchli ijobiy tavsiya: 行ったほうがいいですよ."
        },
        {
            "id": "ja-n4-u5-l2-ex-12",
            "type": "multiple-choice",
            "prompt": "«Sog'lig'ingiz yaxshilanib qoldimi?» xushmuomala savoli:",
            "options": [
                "具合[ぐあい]は いかがですか",
                "気分[きぶん]は だめですか",
                "病気は どうしてですか",
                "熱は 高いですか"
            ],
            "correctAnswer": 0,
            "explanation": "Bemorning hol-ahvolini muloyimlik bilan so'rash: 「お体の具合はいかがですか」."
        },
        {
            "id": "ja-n4-u5-l2-ex-13",
            "type": "multiple-choice",
            "prompt": "Tibbiy sug'urta kartasi (Yaponiyada shifoxonaga ko'rsatiladigan asosiy hujjat):",
            "options": ["保険証[ほけんしょう]", "免許証[めんきょしょう]", "学生証[がくせいしょう]", "領収書[りょうしゅうしょ]"],
            "correctAnswer": 0,
            "explanation": "健康保険証 (Hokenshou) — tibbiy sug'urta guvohnomasi."
        },
        {
            "id": "ja-n4-u5-l2-ex-14",
            "type": "multiple-choice",
            "prompt": "«Ko'nglim aynyapti (o'zimni noxush his qilyapman)»:",
            "options": [
                "気持[きも]ちが 悪[わる]いです",
                "気持ちが いいです",
                "気分が 明るいです",
                "頭が 軽いです"
            ],
            "correctAnswer": 0,
            "explanation": "Ko'ngil aynishi yoki qayt qilish xohishi: 気持ちが悪い."
        },
        {
            "id": "ja-n4-u5-l2-ex-15",
            "type": "multiple-choice",
            "prompt": "Dorixonada dori olish bo'yicha retsept nima deyiladi?",
            "options": ["処方箋[しょほうせん]", "説明書[せつめいしょ]", "案内書[あんないしょ]", "診断書[しんだんしょ]"],
            "correctAnswer": 0,
            "explanation": "Shifokor yozib bergan dori retsepti: 処方箋 (Shohousen)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 23: N4 Choukai: Task-Based Listening & Problem Solving
    # ----------------------------------------------------
    "ja-n4-u5-l3": [
        {
            "id": "ja-n4-u5-l3-ex-1",
            "type": "multiple-choice",
            "prompt": "JLPT Choukai savoli: «男[おとこ]の 人[ひと]は この後[あと]、まず 何[なに]を しますか» nimani so'ramoqda?",
            "options": [
                "Erkak kishi suhbatdan so'ng birinchi bo'lib qaysi ishni bajaradi?",
                "Erkak kishi kecha nima ish qildi?",
                "Ayol kishi erkakdan nima so'radi?",
                "Ular qayerga bormoqchi?"
            ],
            "correctAnswer": 0,
            "explanation": "JLPT N4 topshiriqli tinglashda eng muhim kalit: 「まず (birinchi bo'lib, eng avval)」 nimani qilishni aniqlash."
        },
        {
            "id": "ja-n4-u5-l3-ex-2",
            "type": "multiple-choice",
            "prompt": "Dialog: Ayol: «Xonani tozalashdan oldin derazalarni ochib havoni almashtiring». Erkak birinchi bo'lib nima qiladi?",
            "options": [
                "窓[まど]を 開[あ]けます",
                "部屋[へや]を 掃除[そうじ]します",
                "ごみを 捨てます",
                "テレビを 見ます"
            ],
            "correctAnswer": 0,
            "explanation": "Tozalashdan oldin (前に) derazani ochish aytilgani sababli birinchi harakat: 窓を開けます."
        },
        {
            "id": "ja-n4-u5-l3-ex-3",
            "type": "multiple-choice",
            "prompt": "«〜て おきます (〜te okimasu)» grammatikasining ma'nosi nima?",
            "options": [
                "Kelgusi vaziyat yoki qulaylik uchun oldindan tayyorlab qo'ymoq",
                "Harakatni darhol to'xtatmoq",
                "Birovga majburan qildirmoq",
                "Bajarilgan ishdan afsuslanmoq"
            ],
            "correctAnswer": 0,
            "explanation": "〜ておく (te oku) — oldindan tayyorgarlik ko'rib qo'yish (masalan: ホテルを予約しておく - mehmonxonani oldindan band qilib qo'yish)."
        },
        {
            "id": "ja-n4-u5-l3-ex-4",
            "type": "multiple-choice",
            "prompt": "«〜て しまいました (〜te shimaimashita)» qaysi ma'noni ifodalaydi?",
            "options": [
                "Ish to'liq yakunlandi YOKI kutilmagan ko'ngilsizlik/afsuslanish sodir bo'ldi",
                "Harakat endi boshlanmoqda",
                "Faqat taklif ma'nosida",
                "Hech qanday maxsus ma'noga ega emas"
            ],
            "correctAnswer": 0,
            "explanation": "〜てしまう ikkita asosiy ma'noga ega: 1) Harakatni butunlay tugatish; 2) Afsus va pushaymonlik (masalan: パスポートを落としてしまいました - pasportimni tushirib yo'qotib qo'ydim)."
        },
        {
            "id": "ja-n4-u5-l3-ex-5",
            "type": "multiple-choice",
            "prompt": "Suhbat: Ustoz o'quvchiga: «Avval matnni lug'atsiz o'qing, keyin notanish so'zlarni daftarga yozing». O'quvchi ikkinchi bo'lib nima qiladi?",
            "options": [
                "新[あたら]しい 言葉[ことば]を ノートに 書[か]きます",
                "辞書[じしょ]を 使わないで 本を 読みます",
                "先生[せんせい]に 質問[しつもん]します",
                "宿題[しゅくだい]を 出します"
            ],
            "correctAnswer": 0,
            "explanation": "Avval o'qiydi, keyin (あとで) yangi so'zlarni daftarga yozadi."
        },
        {
            "id": "ja-n4-u5-l3-ex-6",
            "type": "multiple-choice",
            "prompt": "Tinglashdagi chalg'ituvchi (distractor): Suhbatdosh bir narsani taklif qiladi, lekin oxirida «あ、やっぱり （やっぱり...）」 desa, bu nimani bildiradi?",
            "options": [
                "Fikr o'zgardi, avvalgi reja bekor qilinib boshqa qaror qabul qilindi",
                "Oldingi fikr qat'iy ma'qullandi",
                "Suhbat tugadi",
                "U hech narsani tushunmadi"
            ],
            "correctAnswer": 0,
            "explanation": "やっぱり (Yappari) — «Baribir / Yo'q, to'xtang, undan ko'ra...» deb fikrni o'zgartirishni bildiradi, imtihonda javob ko'pincha shundan keyin aytiladi."
        },
        {
            "id": "ja-n4-u5-l3-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「会議[かいぎ]の　＿＿　＿＿　★　＿＿　おいて ください。」",
            "options": ["1: 資料[しりょう]を", "2: コピーして", "3: 前[まえ]に", "4: 20部[にじゅうぶ]"],
            "correctAnswer": 3,
            "explanation": "To'g'ri tartib: 「会議の 前に (3) 資料を (1) 20部 (4★) コピーして (2) おいてください。」 Yulduzcha 4-variantdagi 20部 ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u5-l3-ex-8",
            "type": "multiple-choice",
            "prompt": "«Eshik ochiq qoldirilgan (kimdir ataylab ochib qo'ygan)» (~てある):",
            "options": [
                "ドアが 開[あ]けて あります",
                "ドアが 開いています",
                "ドアを 開けて います",
                "ドアが 開けました"
            ],
            "correctAnswer": 0,
            "explanation": "Maqsadli harakat natijasining saqlanishi: O'timli fe'l (tadoushi) + てあります: ドアが開けてあります."
        },
        {
            "id": "ja-n4-u5-l3-ex-9",
            "type": "multiple-choice",
            "prompt": "Suhbat: A: «Ertangi ziyofat uchun ichimliklar yetarlimi?» B: «Ha, sovutgichga 10 shisha sharbat olib qo'ydim». B nima qildi?",
            "options": [
                "ジュースを 冷蔵庫[れいぞうこ]に 入[い]れて おきました",
                "ジュースを 全部[ぜんぶ] 飲んで しまいました",
                "ジュースを 買いに 行きます",
                "ジュースを 捨てて おきました"
            ],
            "correctAnswer": 0,
            "explanation": "Oldindan tayyorlab qo'yish: 入れておきました (solib qo'ydim)."
        },
        {
            "id": "ja-n4-u5-l3-ex-10",
            "type": "multiple-choice",
            "prompt": "«Afsus, kalitimni unutib qoldiribman!» xijolat ifodasi:",
            "options": [
                "鍵[かぎ]を 忘[わす]れて しまいました！",
                "鍵を 忘れて おきました！",
                "鍵を 忘れて あります！",
                "鍵を 忘れる つもりです！"
            ],
            "correctAnswer": 0,
            "explanation": "Ko'ngilsizlik va afsus: 〜てしまいました."
        },
        {
            "id": "ja-n4-u5-l3-ex-11",
            "type": "multiple-choice",
            "prompt": "«Qanday harakat qilsam ekan?» (maslahat so'rash) tinglashdagi kalit ibora:",
            "options": [
                "どうしたら いいですか",
                "どうしてですか",
                "何ですか",
                "どこですか"
            ],
            "correctAnswer": 0,
            "explanation": "Maslahat va yo'l-yo'riq so'rash: 「どうしたらいいですか」."
        },
        {
            "id": "ja-n4-u5-l3-ex-12",
            "type": "multiple-choice",
            "prompt": "Suhbat: Erkak: «Kechirasiz, kutubxona kartasini olish uchun nima kerak?» Xodim: «Talabalik guvohnomangiz va arizani to'ldirishingiz kerak». Erkak nimani olib kelishi kerak?",
            "options": [
                "学生証[がくせいしょう]",
                "パスポートのみ",
                "お金[かね]",
                "本[ほん]"
            ],
            "correctAnswer": 0,
            "explanation": "Dialogda 学生証 (talabalik guvohnomasi) aytildi."
        },
        {
            "id": "ja-n4-u5-l3-ex-13",
            "type": "multiple-choice",
            "prompt": "«Uchrashuv vaqti soat 14:00 dan 15:00 ga o'zgartirildi». Yangi uchrashuv vaqti qachon?",
            "options": ["15:00 (午後3時)", "14:00", "13:00", "16:00"],
            "correctAnswer": 0,
            "explanation": "14:00 dan 15:00 ga o'zgardi (15時に変更されました)."
        },
        {
            "id": "ja-n4-u5-l3-ex-14",
            "type": "multiple-choice",
            "prompt": "«Xatoni tuzatib qo'ymoq» ifodasi qaysi?",
            "options": [
                "間違[まちが]いを 直[なお]して おきます",
                "間違いを 直して しまいます",
                "間違いを 作って おきます",
                "間違いを 探して しまいます"
            ],
            "correctAnswer": 0,
            "explanation": "Kelgusi noqulaylikning oldini olish uchun tuzatib qo'yish: 直しておきます."
        },
        {
            "id": "ja-n4-u5-l3-ex-15",
            "type": "multiple-choice",
            "prompt": "«To'lovni amalga oshirib bo'ldim (tugatdim)»:",
            "options": [
                "支払[しはら]いを 済[す]ませて しまいました",
                "支払いを 済ませて おきました",
                "支払いを 済ませたいです",
                "支払いを 済ませる予定です"
            ],
            "correctAnswer": 0,
            "explanation": "Ishni to'liq yakunlash: 済ませてしまいました."
        }
    ],

    # ----------------------------------------------------
    # Lesson 24: JLPT N4 Mock Practice: Grammar & Dokkai
    # ----------------------------------------------------
    "ja-n4-u5-l4": [
        {
            "id": "ja-n4-u5-l4-ex-1",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga to'g'ri zarrachani tanlang:\n「私[わたし]は 犬[いぬ]（　　） 手[て]を かまれました。」",
            "options": ["に", "を", "で", "が"],
            "correctAnswer": 0,
            "explanation": "Majhul nisbat (受身形 - Ukemi) gapida ta'sir ko'rsatgan shaxs yoki hayvonga に zarrachasi qo'yiladi: 犬に手をかまれました (It qo'limni tishlab oldi)."
        },
        {
            "id": "ja-n4-u5-l4-ex-2",
            "type": "multiple-choice",
            "prompt": "«Onam meni xonamni tozalashga majbur qildi (buyurdi)» (使役形 - Shieki / Majburiy-orttirma nisbat):",
            "options": [
                "母[はは]は 私[わたし]に 部屋[へや]を 掃除[そうじ]させました",
                "母は 私に 部屋を 掃除されました",
                "母は 私に 部屋を 掃除してもらいました",
                "母は 私に 部屋を 掃除してくれました"
            ],
            "correctAnswer": 0,
            "explanation": "Orttirma nisbat (biror kishiga ish bajartirish): させました (掃除させました)."
        },
        {
            "id": "ja-n4-u5-l4-ex-3",
            "type": "multiple-choice",
            "prompt": "«Bu bino 100 yil muqaddam qurilgan» (majhol nisbat):",
            "options": [
                "この 建物[たてもの]は 100年[ひゃくねん]前[まえ]に 建[た]てられました",
                "この 建物は 100年前に 建てさせました",
                "この 建物は 100年前に 建てました",
                "この 建物は 100年前に 建ちました"
            ],
            "correctAnswer": 0,
            "explanation": "Tarixiy obidalarning bunyod etilishi: 建てられました (Tateraremashita)."
        },
        {
            "id": "ja-n4-u5-l4-ex-4",
            "type": "multiple-choice",
            "prompt": "«Qor yog'adiganga o'xshaydi (hozirgina yog'ib yuborishi mumkin)» (~そうだ - ko'rinishidan):",
            "options": [
                "今[いま]にも 雪[ゆき]が 降[ふ]りそうです",
                "今にも 雪が 降るそうです",
                "今にも 雪が 降ったそうです",
                "今にも 雪が 降るようです"
            ],
            "correctAnswer": 0,
            "explanation": "Ko'z o'ngida yuz beray deb turgan holat: fe'l o'zagi (Masu-ildizi) + そうだ: 降りそうです."
        },
        {
            "id": "ja-n4-u5-l4-ex-5",
            "type": "multiple-choice",
            "prompt": "Eshitilgan mish-mish va yangilik: «Eshitishimcha, ertaga qor yog'armish» (~そうだ - eshitishimcha):",
            "options": [
                "天気予報[てんきよほう]に よると、明日[あした] 雪[ゆき]が 降[ふ]るそうです",
                "天気予報によると、明日 雪が 降りそうです",
                "天気予報によると、明日 雪が 降ったそうです",
                "天気予報によると、明日 雪が 降るらしいです"
            ],
            "correctAnswer": 0,
            "explanation": "Eshitilgan axborotni uzatish: Oddiy shakl (Futsukei) + そうだ (降るそうです)."
        },
        {
            "id": "ja-n4-u5-l4-ex-6",
            "type": "multiple-choice",
            "prompt": "«O'xshaydi / -dek tuyuladi» (~ようです): «Tashqarida kimdir bordek tuyulyapti»:",
            "options": [
                "外[そと]に だれか いるようです",
                "外に だれか いるそうです",
                "外に だれか いそうです",
                "外に だれか いたそうです"
            ],
            "correctAnswer": 0,
            "explanation": "Sezgi a'zolari va holatdan xulosa chiqarish: いるようです (borga o'xshaydi)."
        },
        {
            "id": "ja-n4-u5-l4-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「彼[かれ]は　＿＿　＿＿　★　＿＿　喜[よろこ]びました。」",
            "options": ["1: 先生[せんせい]に", "2: 褒[ほ]められて", "3: テストで", "4: 100点[ひゃくてん]を 取[と]って"],
            "correctAnswer": 1,
            "explanation": "To'g'ri tartib: 「彼は テストで 100点を 取って (3, 4) 先生に (1) 褒められて (2★) 喜びました。」 Yulduzcha 2-variantdagi 褒められて ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u5-l4-ex-8",
            "type": "multiple-choice",
            "prompt": "«Eshik o'z-o'zidan ochildi» (avtofe'l / jidoushi):",
            "options": [
                "ドアが 開[あ]きました",
                "ドアを 開けました",
                "ドアが 開けられました",
                "ドアを 開けさせました"
            ],
            "correctAnswer": 0,
            "explanation": "O'z-o'zidan ochilish avtofe'li: が開きました (Akimashita)."
        },
        {
            "id": "ja-n4-u5-l4-ex-9",
            "type": "multiple-choice",
            "prompt": "«Chiroqni o'chirdim» (o'timli fe'l / tadoushi):",
            "options": [
                "電気[でんき]を 消[け]しました",
                "電気が 消[き]えました",
                "電気を 消えました",
                "電気が 消しました"
            ],
            "correctAnswer": 0,
            "explanation": "Shaxs tomonidan o'chirilishi: を消しました (Keshimashita)."
        },
        {
            "id": "ja-n4-u5-l4-ex-10",
            "type": "multiple-choice",
            "prompt": "«Kasal bo'lib qolmaslik uchun har kuni sport bilan shug'ullanyapman» (~ように):",
            "options": [
                "病気[びょうき]に ならないように、毎日[まいにち] 運動[うんどう]して います",
                "病気にならないために、毎日 運動しています",
                "病気にならないようにて、毎日 運動しています",
                "病気にならないなら、毎日 運動しています"
            ],
            "correctAnswer": 0,
            "explanation": "Imkoniyat fe'li yoki inkor shakl bilan maqsad bildirishda har doim 〜ように ishlatiladi (ならないように)."
        },
        {
            "id": "ja-n4-u5-l4-ex-11",
            "type": "multiple-choice",
            "prompt": "«Yangi uy sotib olish maqsadida pul jamg'aryapman» (~ために):",
            "options": [
                "新[あたら]しい 家[いえ]を 買[か]うために、貯金[ちょきん]して います",
                "新しい 家を買うように、貯金しています",
                "新しい 家を買うためにて、貯金しています",
                "新しい 家を買うと、貯金しています"
            ],
            "correctAnswer": 0,
            "explanation": "Ixtiyoriy maqsadli harakat uchun: fe'lning lug'at shakli + ために (買うために)."
        },
        {
            "id": "ja-n4-u5-l4-ex-12",
            "type": "multiple-choice",
            "prompt": "«U qancha urinmasin, baribir uddasidan chiqa olmadi» (~ても):",
            "options": [
                "いくら 練習[れんしゅう]しても、できませんでした",
                "いくら 練習したら、できませんでした",
                "いくら 練習すれば、できませんでした",
                "いくら 練習するなら、できませんでした"
            ],
            "correctAnswer": 0,
            "explanation": "Qarshilik sharti: いくら + 〜ても (Qancha... qilsa ham)."
        },
        {
            "id": "ja-n4-u5-l4-ex-13",
            "type": "multiple-choice",
            "prompt": "«Qanchalik ko'p kitob o'qisangiz, shunchalik ko'p so'z o'rganasiz» (~ば〜ほど):",
            "options": [
                "本[ほん]を 読[よ]めば 読[よ]むほど、言葉[ことば]を 覚[おぼ]えます",
                "本を読むと 読むほど、言葉を 覚えます",
                "本を読んだら 読むほど、言葉を 覚えます",
                "本を読むなら 読むほど、言葉を 覚えます"
            ],
            "correctAnswer": 0,
            "explanation": "Qanchalik... shunchalik: 〜ば〜ほど (読めば読むほど)."
        },
        {
            "id": "ja-n4-u5-l4-ex-14",
            "type": "multiple-choice",
            "prompt": "Quyidagi qisqa matnni o'qing:\n「昨日の 夜、強い 雨が 降りました。朝、庭を 見ると、大きな 木が 倒れて いました。」\nTongda hovlida nima yuz bergan edi?",
            "options": [
                "Katta daraxt qulab yotgan edi",
                "Yomg'ir hali ham kuchli yog'ayotgan edi",
                "Yangi daraxt ekilgan edi",
                "Hovli qor bilan qoplangan edi"
            ],
            "correctAnswer": 0,
            "explanation": "「大きな木が倒れていました」 — katta daraxt ag'darilib yotgan edi."
        },
        {
            "id": "ja-n4-u5-l4-ex-15",
            "type": "multiple-choice",
            "prompt": "«Endigina yetib keldim (hozirgina tugadi)» (~たばかり):",
            "options": [
                "今[いま] 着[つ]いた ばかりです",
                "今 着く ばかりです",
                "今 着いて ばかりです",
                "今 着き ばかりです"
            ],
            "correctAnswer": 0,
            "explanation": "Harakat yaqindagina yuz berganligi: fe'lning た-shakli + ばかり (着いたばかりです)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 25: JLPT N4 Capstone Mastery & N3 Advancement Assessment
    # ----------------------------------------------------
    "ja-n4-u5-l5": [
        {
            "id": "ja-n4-u5-l5-ex-1",
            "type": "multiple-choice",
            "prompt": "Hurmat tili (Keigo): «Ustoz hozir kabinetlaridalar» (Sonkeigo - Hurmat shakli):",
            "options": [
                "先生[せんせい]は 今[いま] 研究室[けんきゅうしつ]に いらっしゃいます",
                "先生は 今 研究室に 参[まい]ります",
                "先生は 今 研究室に おります",
                "先生は 今 研究室に 申[もう]します"
            ],
            "correctAnswer": 0,
            "explanation": "Hurmatli shaxsning bo'lishi/kelishi/ketishi (いる/行く/来る ning Sonkeigo shakli): いらっしゃる (いらっしゃいます)."
        },
        {
            "id": "ja-n4-u5-l5-ex-2",
            "type": "multiple-choice",
            "prompt": "Kamtarlik tili (Kenjougo): «Ertaga soat 10 da idorangizga boraman»:",
            "options": [
                "明日[あした] 10時[じゅうじ]に 伺[うかが]います (参[まい]ります)",
                "明日 10時に いらっしゃいます",
                "明日 10時に おっしゃいます",
                "明日 10時に なさいます"
            ],
            "correctAnswer": 0,
            "explanation": "So'zlovchining o'zi boshqa hurmatli shaxs huzuriga borishi: 伺う (Ukagau) yoki 参る (Mairu)."
        },
        {
            "id": "ja-n4-u5-l5-ex-3",
            "type": "multiple-choice",
            "prompt": "«Mening ismim Farhod deb ataladi» kamtarlik shakli (Kenjougo):",
            "options": [
                "ファルホドと 申[もう]します",
                "ファルホドと おっしゃいます",
                "ファルホドと 言[い]われます",
                "ファルホドで いらっしゃいます"
            ],
            "correctAnswer": 0,
            "explanation": "O'zini tanishtirishda: 〜と申します (〜to moushimasu)."
        },
        {
            "id": "ja-n4-u5-l5-ex-4",
            "type": "multiple-choice",
            "prompt": "«Rahbar shunday deb aytdilar» (Sonkeigo - Boshqalar gapirishi):",
            "options": [
                "社長[しゃちょう]が そう おっしゃいました",
                "社長が そう 申しました",
                "社長が そう 参りました",
                "社長が そう 存じました"
            ],
            "correctAnswer": 0,
            "explanation": "Hurmatli shaxsning so'zlashi (言う ning Sonkeigo shakli): おっしゃる (Ossharu / おっしゃいました)."
        },
        {
            "id": "ja-n4-u5-l5-ex-5",
            "type": "multiple-choice",
            "prompt": "«Men bu haqda bilaman (xabardorman)» kamtarlik shakli:",
            "options": [
                "存[ぞん]じて おります",
                "ご存知[ぞんじ]です",
                "知っていらっしゃいます",
                "存じますでしょうか"
            ],
            "correctAnswer": 0,
            "explanation": "So'zlovchining bilishi: 存じております (Zonjite orimasu). Qarshidagi odamning bilishi esa: ご存知ですか (Gozonji desu ka)."
        },
        {
            "id": "ja-n4-u5-l5-ex-6",
            "type": "multiple-choice",
            "prompt": "«Marhamat, bu yerni ko'ring» (Xushmuomala xizmat ko'rsatish tili):",
            "options": [
                "こちらを ご覧[らん] ください",
                "こちらを 拝見[はいけん]して ください",
                "こちらを 見て おります",
                "こちらを 見て くださいませんか"
            ],
            "correctAnswer": 0,
            "explanation": "Hurmatli kishiga ko'rsatish: ご覧ください (Goran kudasai). So'zlovchi o'zi ko'rganda esa 拝見する (Haiken suru)."
        },
        {
            "id": "ja-n4-u5-l5-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「社長[しゃちょう]は　＿＿　＿＿　★　＿＿　なられました。」",
            "options": ["1: お帰[かえ]りに", "2: もう", "3: タクシーで", "4: 自宅[じたく]へ"],
            "correctAnswer": 0,
            "explanation": "To'g'ri tartib: 「社長は もう (2) 自宅へ (4) タクシーで (3) お帰りに (1★) なられました。」 Yulduzcha 1-variantdagi お帰りに ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u5-l5-ex-8",
            "type": "multiple-choice",
            "prompt": "Oddiy fe'llarni hurmat shakliga (Sonkeigo) aylantirish formulasi qaysi?",
            "options": [
                "お + Fe'l o'zagi (Masu-ildiz) + に なります",
                "お + Fe'l o'zagi + します",
                "お + Fe'l o'zagi + いただきます",
                "Fe'l lug'at shakli + に なります"
            ],
            "correctAnswer": 0,
            "explanation": "Standart Sonkeigo usuli: お + o'zak + になります (masalan: お読みになります, お待ちになります)."
        },
        {
            "id": "ja-n4-u5-l5-ex-9",
            "type": "multiple-choice",
            "prompt": "Oddiy fe'llarni kamtarlik shakliga (Kenjougo) aylantirish formulasi qaysi?",
            "options": [
                "お + Fe'l o'zagi (Masu-ildiz) + します",
                "お + Fe'l o'zagi + に なります",
                "お + Fe'l o'zagi + ください",
                "Fe'l lug'at shakli + です"
            ],
            "correctAnswer": 0,
            "explanation": "Standart Kenjougo usuli: お + o'zak + します (masalan: お持ちします - ko'tarib beraman, お手伝いします - yordamlashaman)."
        },
        {
            "id": "ja-n4-u5-l5-ex-10",
            "type": "multiple-choice",
            "prompt": "«Ertaga nima qilmoqchisiz?» savolining eng xushmuomala varianti qaysi?",
            "options": [
                "明日[あした]は 何[なに]を なさいますか",
                "明日は 何を いたしますか",
                "明日は 何を しますか",
                "明日は 何を させますか"
            ],
            "correctAnswer": 0,
            "explanation": "Suhbatdoshning harakati uchun: なさる (Nasaru / なさいますか)."
        },
        {
            "id": "ja-n4-u5-l5-ex-11",
            "type": "multiple-choice",
            "prompt": "«Qimmatli xatingizni diqqat bilan o'qib chiqdim» (kamtarlik shakli):",
            "options": [
                "お手紙[てがみ]を 拝読[はいどく]いたしました",
                "お手紙を お読みになりました",
                "お手紙を ご覧になりました",
                "お手紙を 読まれました"
            ],
            "correctAnswer": 0,
            "explanation": "O'zining mutolaasi uchun: 拝読する (Haidoku suru)."
        },
        {
            "id": "ja-n4-u5-l5-ex-12",
            "type": "multiple-choice",
            "prompt": "«N3 darajasiga o'tish uchun nima qilish kerak?» degan o'quvchiga to'g'ri xulosa:",
            "options": [
                "N4 grammatikasi, barcha tuslanishlar va 300 ga yaqin kanjini puxta o'zlashtirib, murakkabroq gazeta va publitsistik matnlarga o'tish",
                "Faqat lug'at yodlash kifoya",
                "Grammatikani o'rganish shart emas",
                "Faqat anime ko'rish yetarli"
            ],
            "correctAnswer": 0,
            "explanation": "N4 fundamentini to'liq egallash N3 darajasining murakkab grammatikasi va uzun matnlarini oson tushunishga zamin yaratadi."
        },
        {
            "id": "ja-n4-u5-l5-ex-13",
            "type": "multiple-choice",
            "prompt": "«Charchaganga o'xshaysiz, ortiqcha zo'riqmang»:",
            "options": [
                "お疲[つか]れの ようですね。無理[むり]を なさらないで ください",
                "疲れたそうですね。無理を しろ",
                "疲れたようで、無理を してください",
                "疲れたらしいから、無理を させます"
            ],
            "correctAnswer": 0,
            "explanation": "Xushmuomala g'amxo'rlik: お疲れのようですね。無理をなさらないでください."
        },
        {
            "id": "ja-n4-u5-l5-ex-14",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos shaklni tanlang:\n「荷物[にもつ]を お持[も]ち（　　）。」",
            "options": ["しましょうか", "になりましょうか", "なさいますか", "いただきましょうか"],
            "correctAnswer": 0,
            "explanation": "O'z yordamini muloyimlik bilan taklif qilish: 「お持ちしましょうか」."
        },
        {
            "id": "ja-n4-u5-l5-ex-15",
            "type": "multiple-choice",
            "prompt": "«Ushbu taklifnomani qabul qiling»:",
            "options": [
                "どうぞ こちらを お受[う]け取[と]り ください",
                "どうぞ こちらを お受け取り します",
                "どうぞ こちらを お受け取り いたしなさい",
                "どうぞ こちらを お受け取り いただきます"
            ],
            "correctAnswer": 0,
            "explanation": "Iltimos hurmat shakli: お + o'zak + ください (お受け取りください)."
        }
    ]
}
