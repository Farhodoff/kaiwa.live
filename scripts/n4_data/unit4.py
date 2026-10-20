# -*- coding: utf-8 -*-
"""
JLPT N4 Unit 4: Intentions, Volitional Form, Causes, Conditionals & Letters
Lessons 16-20 (15 authentic exercises per lesson = 75 exercises total)
"""

UNIT4_EXERCISES = {
    # ----------------------------------------------------
    # Lesson 16: Intention & Plans: 〜つもりです & 〜予定です
    # ----------------------------------------------------
    "ja-n4-u4-l1": [
        {
            "id": "ja-n4-u4-l1-ex-1",
            "type": "multiple-choice",
            "prompt": "«Kelasi yili Yaponiyada o'qimoqchiman (qat'iy niyatim bor)» jumlasi qaysi?",
            "options": [
                "来年[らいねん] 日本[にほん]へ 留学[りゅうがく]する つもりです",
                "来年 日本へ 留学した つもりです",
                "来年 日本へ 留学して つもりです",
                "来年 日本へ 留学します つもりです"
            ],
            "correctAnswer": 0,
            "explanation": "Qat'iy shaxsiy reja/niyat: fe'lning lug'at shakli (jishokei) + つもりです (留学するつもりです)."
        },
        {
            "id": "ja-n4-u4-l1-ex-2",
            "type": "multiple-choice",
            "prompt": "«Ertaga hech qayerga bormoqchi emasman (borish niyatim yo'q)» qanday tuziladi?",
            "options": [
                "明日[あした]は どこへも 行[い]かない つもりです",
                "明日は どこへも 行く つもりでは ありません",
                "Ikkala shakl ham (行かないつもり / 行くつもりはない) to'g'ri",
                "明日は どこへも 行きません つもりです"
            ],
            "correctAnswer": 2,
            "explanation": "Niyatning inkori: fe'lning ない-shakli + つもりです (行かないつもりです) yoki fe'lning lug'at shakli + つもりはありません (行くつもりはありません)."
        },
        {
            "id": "ja-n4-u4-l1-ex-3",
            "type": "multiple-choice",
            "prompt": "〜つもりです va 〜予定[よてい]です o'rtasidagi asosiy farq nima?",
            "options": [
                "〜つもり — so'zlovchining shaxsiy ixtiyoriy qarori; 〜予定 — oldindan rasmiy kelishilgan yoki jadvallashtirilgan reja",
                "〜つもり rasmiy hujjatlarda ishlatiladi",
                "〜予定 faqat o'tgan zamonda ishlatiladi",
                "Hech qanday farqi yo'q"
            ],
            "correctAnswer": 0,
            "explanation": "〜つもり — ichki shaxsiy xohish-istak va reja. 〜予定 (Yotei) — jadval, poyezd soati yoki uchrashuv kabi ob'ektiv belgilangan reja."
        },
        {
            "id": "ja-n4-u4-l1-ex-4",
            "type": "multiple-choice",
            "prompt": "«Poyezd soat 3 da jo'nashi rejalashtirilgan» (rasmiy jadval) jumlasi qaysi?",
            "options": [
                "電車[でんしゃ]は 3時[さんじ]に 出発[しゅっぱつ]する 予定[よてい]です",
                "電車は 3時に 出発する つもりです",
                "電車は 3時に 出発して 予定です",
                "電車は 3時に 出発したい 予定です"
            ],
            "correctAnswer": 0,
            "explanation": "Poyezd jonli inson emas, uning o'z niyati (tsumori) bo'lmaydi; u jadvallashtirilgan ob'ektiv reja bo'lgani sababli 予定です ishlatiladi."
        },
        {
            "id": "ja-n4-u4-l1-ex-5",
            "type": "multiple-choice",
            "prompt": "Otlar (nouns) bilan 〜予定です qanday bog'lanadi?\n「出張[しゅっちょう]（　　） 予定[よてい]は 来週[らいしゅう]です。」",
            "options": ["の", "な", "に", "で"],
            "correctAnswer": 0,
            "explanation": "Otlar 予定 bilan bog'langanda の zarrachasini oladi: 出張の予定 (Xizmat safari rejasi)."
        },
        {
            "id": "ja-n4-u4-l1-ex-6",
            "type": "multiple-choice",
            "prompt": "«Universitetni bitirgach, o'z kompaniyamni ochmoqchiman» jumlasi qaysi?",
            "options": [
                "大学[だいがく]を 卒業[そつぎょう]したら、自分[じぶん]の 会社[かいしゃ]を 作[つく]る つもりです",
                "大学を 卒業したら、自分の 会社を 作った つもりです",
                "大学を 卒業したら、自分の 会社を 作って つもりです",
                "大学を 卒業したら、自分の 会社を 作りたい 予定です"
            ],
            "correctAnswer": 0,
            "explanation": "Kelajakdagi shaxsiy orzu va qat'iy reja: 作るつもりです."
        },
        {
            "id": "ja-n4-u4-l1-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「会議[かいぎ]は　＿＿　＿＿　★　＿＿　予定[よてい]です。」",
            "options": ["1: 行[おこな]われる", "2: 午後[ごご] 2時[にじ]から", "3: 3階[さんがい]の", "4: 部屋[へや]で"],
            "correctAnswer": 0,
            "explanation": "To'g'ri tartib: 「会議は 午後2時から (2) 3階の (3) 部屋で (4) 行われる (1★) 予定です。」 Yulduzcha 1-variantdagi 行われる ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u4-l1-ex-8",
            "type": "multiple-choice",
            "prompt": "«Bugundan boshlab shirinlik yemayman deb qat'iy niyat qildim» qaysi javobda to'g'ri?",
            "options": [
                "今日[きょう]から 甘[あま]い 物[もの]を 食[た]べない つもりです",
                "今日から 甘い 物を 食べる つもりです",
                "今日から 甘い 物を 食べたい 予定です",
                "今日から 甘い 物を 食べなくて 予定です"
            ],
            "correctAnswer": 0,
            "explanation": "Biror narsani qilmaslik niyati: 食べないつもりです."
        },
        {
            "id": "ja-n4-u4-l1-ex-9",
            "type": "multiple-choice",
            "prompt": "Boshliq yoki ustozga o'z rejasi haqida savol berganda qaysi birini ishlatish xushmuomalaroq?",
            "options": [
                "〜ご予定[よてい]ですか (Yotei)",
                "〜つもりですか (Tsumori)",
                "〜したいですか",
                "〜するつもりだろう"
            ],
            "correctAnswer": 0,
            "explanation": "Kattalarga yoki hurmatli kishilarga «〜つもりですか» deb so'rash qo'pol hisoblanadi (shaxsiy niyatini so'roq qilishdek tuyuladi); xushmuomala qilib «〜ご予定ですか» deyiladi."
        },
        {
            "id": "ja-n4-u4-l1-ex-10",
            "type": "multiple-choice",
            "prompt": "«Yangi uy sotib olish niyatidaman» ifodasidagi fe'l shakli qaysi?",
            "options": [
                "新[あたら]しい 家[いえ]を 買[か]う つもりです",
                "新しい 家を 買います つもりです",
                "新しい 家を 買って つもりです",
                "新しい 家を 買った つもりです"
            ],
            "correctAnswer": 0,
            "explanation": "Lug'at shakli: 買う + つもりです = 買うつもりです."
        },
        {
            "id": "ja-n4-u4-l1-ex-11",
            "type": "multiple-choice",
            "prompt": "«Majlis soat nechtada tugashi rejalashtirilgan?» savoli qaysi?",
            "options": [
                "会議[かいぎ]は 何時[なんじ]に 終[お]わる 予定[よてい]ですか",
                "会議は 何時に 終わる つもりですか",
                "会議は 何時に 終わった 予定ですか",
                "会議は 何時に 終わりに 予定ですか"
            ],
            "correctAnswer": 0,
            "explanation": "Jadval bo'yicha tadbirning yakunlanishi: 終わる予定ですか."
        },
        {
            "id": "ja-n4-u4-l1-ex-12",
            "type": "multiple-choice",
            "prompt": "«Kelgusi oy imtihon topshirish niyatidaman» jumlasi qaysi?",
            "options": [
                "来月[らいげつ] 試験[しけん]を 受[う]ける つもりです",
                "来月 試験を 受けて つもりです",
                "来月 試験を 受けた つもりです",
                "来月 試験を 受ける 予定でした"
            ],
            "correctAnswer": 0,
            "explanation": "Imtihon topshirmoq: 受ける (Ukeru) + つもりです."
        },
        {
            "id": "ja-n4-u4-l1-ex-13",
            "type": "multiple-choice",
            "prompt": "«Dam olish kunlari uyda dam olmoqchiman» so'zlashuvdagi reja:",
            "options": [
                "週末[しゅうまつ]は 家[いえ]で ゆっくり 休[やす]む つもりだよ",
                "週末は 家で ゆっくり 休んだ つもりだよ",
                "週末は 家で ゆっくり 休んで 予定だよ",
                "週末は 家で ゆっくり 休みたい 予定だよ"
            ],
            "correctAnswer": 0,
            "explanation": "Dam olish niyati: 休むつもりだよ."
        },
        {
            "id": "ja-n4-u4-l1-ex-14",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos shaklni tanlang:\n「飛行機[ひこうき]の 出発[しゅっぱつ]は 1時間[いちじかん] （　　） 予定[よてい]です。」",
            "options": ["遅[おく]れる", "遅れて", "遅れた", "遅れます"],
            "correctAnswer": 0,
            "explanation": "Lug'at shakli bilan: 遅れる予定です (kechikishi rejalashtirilgan)."
        },
        {
            "id": "ja-n4-u4-l1-ex-15",
            "type": "multiple-choice",
            "prompt": "«U qachon kelishi rejalashtirilgan?» savoli qaysi?",
            "options": [
                "彼[かれ]は いつ 来[く]る 予定[よてい]ですか",
                "彼は いつ 来る つもりですか",
                "彼は いつ 来て 予定ですか",
                "彼は いつ 来た 予定ですか"
            ],
            "correctAnswer": 0,
            "explanation": "Ob'ektiv kelish vaqti rejasi: 来る予定ですか."
        }
    ],

    # ----------------------------------------------------
    # Lesson 17: Volitional Form (意向形): 〜(よ)う (Let's do / Intent)
    # ----------------------------------------------------
    "ja-n4-u4-l2": [
        {
            "id": "ja-n4-u4-l2-ex-1",
            "type": "multiple-choice",
            "prompt": "1-guruh «ichmoq» 「飲[の]みます」fe'lining taklif / iroda (volitional) shakli qaysi?",
            "options": ["飲[の]もう", "飲[の]みよう", "飲[の]もうよう", "飲[の]まよう"],
            "correctAnswer": 0,
            "explanation": "1-guruh fe'llarining volitional shaklida 'i' tovushi 'o' tovushiga cho'zilib o'zgaradi: 飲みます -> 飲もう (Keling, ichamiz / ichaylik)."
        },
        {
            "id": "ja-n4-u4-l2-ex-2",
            "type": "multiple-choice",
            "prompt": "2-guruh «yemoq» 「食[た]べます」fe'lining volitional shakli qaysi?",
            "options": ["食[た]べよう", "食[た]ぼう", "食[た]べろ", "食[た]べようよ"],
            "correctAnswer": 0,
            "explanation": "2-guruh fe'llarida ます olib tashlanib, よう qo'shiladi: 食べます -> 食べよう (Yeylik)."
        },
        {
            "id": "ja-n4-u4-l2-ex-3",
            "type": "multiple-choice",
            "prompt": "3-guruh «qilmoq» 「します」 va «kelmoq» 「来[き]ます」fe'llarining volitional shakllari qaysilar?",
            "options": [
                "しよう / 来[こ]よう",
                "しよう / 来[き]よう",
                "すよう / 来[く]よう",
                "しろう / 来[こ]ろう"
            ],
            "correctAnswer": 0,
            "explanation": "Tartibsiz fe'llar: します -> しよう (Shilaylik), 来ます -> 来よう (Koyou - kelaylik)."
        },
        {
            "id": "ja-n4-u4-l2-ex-4",
            "type": "multiple-choice",
            "prompt": "〜ましょう va 〜よう o'rtasidagi asosiy uslubiy farq nima?",
            "options": [
                "〜ましょう — xushmuomala (polite); 〜よう — do'stona va norasmiy (casual)",
                "〜よう faqat o'tmishda ishlatiladi",
                "〜ましょう faqat yozma nutqda ishlatiladi",
                "Hech qanday farqi yo'q"
            ],
            "correctAnswer": 0,
            "explanation": "Taklif shakllari: 行きましょう (Xushmuomala taklif) = 行こう (Do'stona/norasmiy taklif)."
        },
        {
            "id": "ja-n4-u4-l2-ex-5",
            "type": "multiple-choice",
            "prompt": "Niyat va o'y-fikr: «Kelasi oy yangi kompyuter sotib olmoqchiman (deb o'ylayapman)»:",
            "options": [
                "来月[らいげつ] 新[あたら]しい パソコンを 買[か]おうと 思[おも]って います",
                "来月 新しい パソコンを 買おうと 思います",
                "来月 新しい パソコンを 買うと 思って います",
                "来月 新しい パソコンを 買いたいと 思います"
            ],
            "correctAnswer": 0,
            "explanation": "Biror narsani qilish haqida ma'lum vaqtdan beri o'ylab yurgan reja: fe'lning volitional shakli + と思っています (買おうと思っています)."
        },
        {
            "id": "ja-n4-u4-l2-ex-6",
            "type": "multiple-choice",
            "prompt": "«Charchadik, biroz dam olaylik!» do'stona taklifi qaysi?",
            "options": [
                "疲[つか]れたから、少[すこ]し 休[やす]もう！",
                "疲れたから、少し 休む！",
                "疲れたから、少し 休め！",
                "疲れたから、少し 休みよう！"
            ],
            "correctAnswer": 0,
            "explanation": "休もう (Dam olaylik! - 1-guruh fe'li: 休みます -> 休もう)."
        },
        {
            "id": "ja-n4-u4-l2-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「今度[こんど]の　＿＿　＿＿　★　＿＿　思[おも]って います。」",
            "options": ["1: 行[い]こうと", "2: 休[やす]みに", "3: 温泉[おんせん]へ", "4: 一緒[いっしょ]に"],
            "correctAnswer": 0,
            "explanation": "To'g'ri tartib: 「今度の 休みに (2) 一緒に (4) 温泉へ (3) 行こうと (1★) 思っています。」 Yulduzcha 1-variantdagi 行こうと ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u4-l2-ex-8",
            "type": "multiple-choice",
            "prompt": "«Tezroq ketmasak kechikamiz, shoshamiz!» jumlasi qaysi?",
            "options": [
                "遅[おく]れるから、急[いそ]ごう！",
                "遅れるから、急ぐ！",
                "遅れるから、急ぎよう！",
                "遅れるから、急げ！"
            ],
            "correctAnswer": 0,
            "explanation": "急ぎます -> 急ごう (Isogou - shoshilaylik)."
        },
        {
            "id": "ja-n4-u4-l2-ex-9",
            "type": "multiple-choice",
            "prompt": "Shu onning o'zida birdan tug'ilgan fikr / niyat uchun qaysi ifoda to'g'ri?",
            "options": [
                "もう 遅[おそ]いから、そろそろ 帰[かえ]ろうと 思[おも]います",
                "もう 遅いから、そろそろ 帰ろうと 思っています",
                "もう 遅いから、そろそろ 帰るつもりでした",
                "もう 遅いから、そろそろ 帰りたい予定です"
            ],
            "correctAnswer": 0,
            "explanation": "Ayni paytda yangi paydo bo'lgan niyat: 〜ようと思います. Agar oldindan rejalashtirib kelayotgan bo'lsa: 〜ようと思っています."
        },
        {
            "id": "ja-n4-u4-l2-ex-10",
            "type": "multiple-choice",
            "prompt": "«1-guruh «uchrashmoq» 「会[あ]います」fe'lining volitional shakli qaysi?",
            "options": ["会[あ]おう", "会いよう", "合おう", "会おうよ"],
            "correctAnswer": 0,
            "explanation": "会います -> 会おう (Aou - uchrashaylik)."
        },
        {
            "id": "ja-n4-u4-l2-ex-11",
            "type": "multiple-choice",
            "prompt": "«Keling, bu yerda rasmga tushaylik!» taklifi qaysi?",
            "options": [
                "ここで 写真[しゃしん]を 撮[と]ろう！",
                "ここで 写真を 撮りよう！",
                "ここで 写真を 撮る！",
                "ここで 写真を 撮れ！"
            ],
            "correctAnswer": 0,
            "explanation": "撮ります -> 撮ろう (Torou)."
        },
        {
            "id": "ja-n4-u4-l2-ex-12",
            "type": "multiple-choice",
            "prompt": "«Ertaga do'stim bilan mehmonga boraylik deb rejalashtiryapman»:",
            "options": [
                "明日[あした] 友達[ともだち]と 遊[あそ]ぼうと 思[おも]って います",
                "明日 友達と 遊びようと 思っています",
                "明日 友達と 遊ぶと 思っています",
                "明日 友達と 遊ぼうと 思いました"
            ],
            "correctAnswer": 0,
            "explanation": "遊びます -> 遊ぼう (Asobou) + と思っています."
        },
        {
            "id": "ja-n4-u4-l2-ex-13",
            "type": "multiple-choice",
            "prompt": "«Bugun darsdan so'ng birga qahva ichamizmi?» do'stona taklifi:",
            "options": [
                "今日[きょう] 授業[じゅぎょう]の あと、一緒[いっしょ]に コーヒー 飲[の]まない？",
                "今日 授業の あと、一緒に コーヒー 飲もうか？",
                "Ikkala shakl ham (飲まない？ va 飲もうか？) tabiiy taklif ifodasidir",
                "Faqat 飲みましょう"
            ],
            "correctAnswer": 2,
            "explanation": "Og'zaki do'stona takliflarda inkor so'rog'i (飲まない？) va volitional so'roq (飲もうか？) ikkalasi ham keng qo'llanadi."
        },
        {
            "id": "ja-n4-u4-l2-ex-14",
            "type": "multiple-choice",
            "prompt": "«Yordam beraymi?» taklifi do'stona tarzda qanday aytiladi?",
            "options": [
                "手伝[てつだ]おうか？",
                "手伝いようか？",
                "手伝うか？",
                "手伝いましょうか？"
            ],
            "correctAnswer": 0,
            "explanation": "手伝います -> 手伝おうか？ (Tetsudaou ka - yordam beraymi?). Xushmuomala shakli: 手伝いましょうか."
        },
        {
            "id": "ja-n4-u4-l2-ex-15",
            "type": "multiple-choice",
            "prompt": "«Yil oxiriga qadar JLPT N4 imtihonidan o'tmoqchiman deb harakat qilyapman»:",
            "options": [
                "今年中[ことしじゅう]に N4に 合格[ごうかく]しようと 思[おも]って います",
                "今年中に N4に 合格しようと 思いました",
                "今年中に N4に 合格すると 思っています",
                "今年中に N4に 合格したいと 予定です"
            ],
            "correctAnswer": 0,
            "explanation": "Harakat va o'y: 合格しようと思っています."
        }
    ],

    # ----------------------------------------------------
    # Lesson 18: Reason & Cause: 〜から vs 〜ので (Subjective vs Objective Reason)
    # ----------------------------------------------------
    "ja-n4-u4-l3": [
        {
            "id": "ja-n4-u4-l3-ex-1",
            "type": "multiple-choice",
            "prompt": "〜から va 〜ので o'rtasidagi asosiy farq nima?",
            "options": [
                "〜から — so'zlovchining shaxsiy fikri va buyruq/taklifga ruxsat beradi; 〜ので — ob'ektiv, xushmuomala va rasmiy sabab",
                "〜ので faqat o'tgan zamonda ishlatiladi",
                "〜から bilan xushmuomala iltimos qilib bo'lmaydi",
                "Ikkalasi ham har qanday gapda bir-birining o'rnini 100% bosa oladi"
            ],
            "correctAnswer": 0,
            "explanation": "〜から shaxsiy munosabatni bildiradi va keyidan buyruq/iltimos (〜てください, 〜ましょう) kelishi mumkin. 〜ので esa ob'ektiv sabab bo'lib, oqibatni muloyimlashtiradi va qat'iy buyruqlar bilan kam ishlatiladi."
        },
        {
            "id": "ja-n4-u4-l3-ex-2",
            "type": "multiple-choice",
            "prompt": "Na-sifatlar va otlar bilan 〜ので qanday bog'lanadi?\n「今日[きょう]は 雨[あめ]（　　）ので、試合[しあい]は 中止[ちゅうし]です。」",
            "options": ["な", "だ", "の", "に"],
            "correctAnswer": 0,
            "explanation": "Otlar va Na-sifatlar 〜ので bilan bog'langanda 「な」 oladi: 雨なので (Yomg'ir bo'lgani sababli), 暇なので (bo'sh bo'lganim uchun)."
        },
        {
            "id": "ja-n4-u4-l3-ex-3",
            "type": "multiple-choice",
            "prompt": "Boshliqqa xushmuomala qilib «Boshim og'riyotgani uchun ertaroq ketsam maylimi?» deb sabab ko'rsatishda qaysi biri eng maqbul?",
            "options": [
                "頭[あたま]が 痛[いた]いので、早[はや]く 帰[かえ]っても よろしいでしょうか",
                "頭が 痛いから、早く 帰れ",
                "頭が 痛いので、早く 帰りなさい",
                "頭が 痛いだから、早く 帰る"
            ],
            "correctAnswer": 0,
            "explanation": "Xushmuomala ruxsat so'rashda sababni 〜ので bilan berish eng to'g'ri odob hisoblanadi."
        },
        {
            "id": "ja-n4-u4-l3-ex-4",
            "type": "multiple-choice",
            "prompt": "Ot bilan 〜から qanday bog'lanadi?\n「明日[あした]は 祝日[しゅくじつ]（　　）から、学校[がっこう]は 休[やす]みです。」",
            "options": ["だ", "な", "の", "に"],
            "correctAnswer": 0,
            "explanation": "Ot va Na-sifatlar 〜から oldidan 「だ」 oladi: 祝日だから (Bayram bo'lgani uchun)."
        },
        {
            "id": "ja-n4-u4-l3-ex-5",
            "type": "multiple-choice",
            "prompt": "«Vaqt yo'q, shuning uchun shoshilaylik!» jumlasi qaysi?",
            "options": [
                "時間[じかん]が ないから、急[いそ]ごう！",
                "時間が ないので、急ぎなさい！",
                "時間が なくて、急ごう！",
                "時間が ないから、急いで あります"
            ],
            "correctAnswer": 0,
            "explanation": "Taklif (急ごう) oldidan shaxsiy da'vat bo'lgani uchun 〜から ishlatiladi: 時間がないから、急ごう!"
        },
        {
            "id": "ja-n4-u4-l3-ex-6",
            "type": "multiple-choice",
            "prompt": "«Avtobus kechikkani sababli uchrashuvga kech qoldim» (ob'ektiv voqea):",
            "options": [
                "バスが 遅[おく]れたので、約束[やくそく]に 遅[おく]れました",
                "バスが 遅れたから、約束に 遅れなさい",
                "バスが 遅れたので、約束に 遅れましょう",
                "バスが 遅れたなら、約束に 遅れました"
            ],
            "correctAnswer": 0,
            "explanation": "Tabiiy ob'ektiv sabab va uning natijasi: 遅れたので、遅れました."
        },
        {
            "id": "ja-n4-u4-l3-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「危[あぶ]ない　＿＿　＿＿　★　＿＿　ください。」",
            "options": ["1: 入[はい]らないで", "2: から、", "3: ここには", "4: 決[けっ]して"],
            "correctAnswer": 0,
            "explanation": "To'g'ri tartib: 「危ない から、(2) ここには (3) 決して (4) 入らないで (1★) ください。」 Yulduzcha 1-variantdagi 入らないで ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u4-l3-ex-8",
            "type": "multiple-choice",
            "prompt": "«Bu do'kon juda mashhur bo'lgani uchun mijozlar doimo ko'p»:",
            "options": [
                "この 店[みせ]は 有名[ゆうめい]なので、いつも 客[きゃく]が 多[おお]いです",
                "この 店は 有名なので、いつも 客が 多かったです",
                "この 店は 有名ので、いつも 客が 多いです",
                "この 店は 有名だので、いつも 客が 多いです"
            ],
            "correctAnswer": 0,
            "explanation": "Na-sifat bo'lgani sababli: 有名なので (Mashhur bo'lgani sababli)."
        },
        {
            "id": "ja-n4-u4-l3-ex-9",
            "type": "multiple-choice",
            "prompt": "«Ertaga imtihon bor, shuning uchun kechgacha dars qilaman»:",
            "options": [
                "明日[あした] 試験[しけん]が あるから、夜[よる]遅[おそ]くまで 勉強[べんきょう]します",
                "明日 試験が あるので、夜遅くまで 勉強しなさい",
                "明日 試験が あってから、夜遅くまで 勉強します",
                "明日 試験が あるなら、夜遅くまで 勉強しました"
            ],
            "correctAnswer": 0,
            "explanation": "Ixtiyoriy qaror va shaxsiy sabab: あるから、勉強します."
        },
        {
            "id": "ja-n4-u4-l3-ex-10",
            "type": "multiple-choice",
            "prompt": "«Kechirasiz, biroz tushunarsiz bo'lgani sababli, yana bir bor tushuntirib bera olmaysizmi?»:",
            "options": [
                "少[すこ]し 分[わ]からないので、もう一度[いちど] 説明[せつめい]して いただけませんか",
                "少し 分からないから、もう一度 説明しろ",
                "少し 分からないので、もう一度 説明するな",
                "少し 分からないだから、説明して ください"
            ],
            "correctAnswer": 0,
            "explanation": "Muloyim iltimos bilan birga: 分からないので、...していただけませんか."
        },
        {
            "id": "ja-n4-u4-l3-ex-11",
            "type": "multiple-choice",
            "prompt": "Quyidagi gap nega xato?\n「危[あぶ]ないなので、さわらないで ください。」",
            "options": [
                "Chunki 危ない — I-sifat, u «な» olmasdan to'g'ridan-to'g'ri «危ないので» bo'lishi shart",
                "Chunki 危ない so'zidan keyin から kelishi mumkin emas",
                "Chunki さわらないで so'zi noto'g'ri",
                "Xato emas"
            ],
            "correctAnswer": 0,
            "explanation": "I-sifatlar to'g'ridan-to'g'ri ので bilan bog'lanadi: 危ないので (危ないなので emas)."
        },
        {
            "id": "ja-n4-u4-l3-ex-12",
            "type": "multiple-choice",
            "prompt": "«Sovuq bo'lgani uchun paltongizni kiying» buyrug'i:",
            "options": [
                "寒[さむ]いから、コートを 着[き]なさい",
                "寒いので、コートを着なさい (odatda unchalik tabiiy emas)",
                "寒くて、コートを着て ある",
                "寒かったので、コートを着よう"
            ],
            "correctAnswer": 0,
            "explanation": "To'g'ridan-to'g'ri buyruq yoki qat'iy talab gaplarida 〜から ishlatiladi: 寒いから、コートを着なさい."
        },
        {
            "id": "ja-n4-u4-l3-ex-13",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos shaklni tanlang:\n「道[みち]が （　　）ので、遅刻[ちこく]して しまいました。」",
            "options": ["混[こ]んでいた", "混んでいたな", "混んでいだ", "混んでいるだ"],
            "correctAnswer": 0,
            "explanation": "Fe'lning o'tgan zamoni + ので: 混んでいたので (Tirband bo'lganligi sababli)."
        },
        {
            "id": "ja-n4-u4-l3-ex-14",
            "type": "multiple-choice",
            "prompt": "«Ertaga bo'shman, shuning uchun birga sayr qilaylik»:",
            "options": [
                "明日[あした]は 暇[ひま]だから、散歩[さんぽ]しよう！",
                "明日は 暇なから、散歩しよう！",
                "明日は 暇だから、散歩しなさい",
                "明日は 暇なので、散歩しろ"
            ],
            "correctAnswer": 0,
            "explanation": "Na-sifat + だから + taklif (しよう): 暇だから、散歩しよう!"
        },
        {
            "id": "ja-n4-u4-l3-ex-15",
            "type": "multiple-choice",
            "prompt": "E'lonlardagi rasmiy sabab ko'rsatish:\n「工事中[こうじちゅう]（　　） 通行止[つうこうど]めです」",
            "options": ["のため", "だから", "ので", "から"],
            "correctAnswer": 0,
            "explanation": "Juda rasmiy yozma e'lonlarda otlar bilan: のため (Qurilish ishlari sababli yo'l yopiq)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 19: N4 Conditionals: 〜たら (When / If) & 〜ば
    # ----------------------------------------------------
    "ja-n4-u4-l4": [
        {
            "id": "ja-n4-u4-l4-ex-1",
            "type": "multiple-choice",
            "prompt": "«Agar ertaga yomg'ir yog'sa, bormayman» (~たら shart shakli) jumlasi qaysi?",
            "options": [
                "明日[あした] 雨[あめ]が 降[ふ]ったら、行[い]きません",
                "明日 雨が 降ると、行きません",
                "明日 雨が 降れば、行きません",
                "明日 雨が 降るなら、行きません"
            ],
            "correctAnswer": 0,
            "explanation": "Kelajakdagi ehtimoliy shart va shaxsiy qaror uchun eng tabiiy va keng tarqalgan shakl: 〜たら (降ったら、行きません)."
        },
        {
            "id": "ja-n4-u4-l4-ex-2",
            "type": "multiple-choice",
            "prompt": "1-guruh «yozmoq» 「書[か]く」fe'lining 〜ば shart shakli qaysi?",
            "options": ["書[か]けば", "書[か]かば", "書[か]きば", "書[か]いたら"],
            "correctAnswer": 0,
            "explanation": "1-guruh fe'llarining 'u' tovushi 'e' tovushiga o'zgaradi va ば qo'shiladi: 書く -> 書けば (Kakeba - agar yozsa)."
        },
        {
            "id": "ja-n4-u4-l4-ex-3",
            "type": "multiple-choice",
            "prompt": "I-sifat «arzon» 「安[やす]い」ning 〜ば shart shakli qaysi?",
            "options": ["安[やす]ければ", "安[やす]いば", "安[やす]かったら", "安[やす]くば"],
            "correctAnswer": 0,
            "explanation": "I-sifatlarda oxirgi い tushib qolib, ければ qo'shiladi: 安い -> 安ければ (Yasukereba - agar arzon bo'lsa)."
        },
        {
            "id": "ja-n4-u4-l4-ex-4",
            "type": "multiple-choice",
            "prompt": "Tabiiy qonuniyat yoki tugmani bosganda o'z-o'zidan yuz beradigan holat uchun qaysi shart shakli eng mos?",
            "options": [
                "〜と (masalan: ボタンを 押すと、おつりが 出ます)",
                "〜たら",
                "〜なら",
                "〜ても"
            ],
            "correctAnswer": 0,
            "explanation": "Tabiiy muqarrar natija, texnika ishlashi yoki yo'l ko'rsatishda (o'ngga burilsangiz bank bor): 〜と eng aniq shakldir."
        },
        {
            "id": "ja-n4-u4-l4-ex-5",
            "type": "multiple-choice",
            "prompt": "«Agar Yaponiyaga borsangiz, Kyoto shahrini ko'rishni tavsiya qilaman» (~なら maslahat/mavzu):",
            "options": [
                "日本[にほん]へ 行[い]くなら、京都[きょうと]が おすすめです",
                "日本へ 行くと、京都が おすすめです",
                "日本へ 行けば、京都が おすすめです",
                "日本へ 行ったら、京都が おすすめです"
            ],
            "correctAnswer": 0,
            "explanation": "Suhbatdosh aytgan mavzu bo'yicha maslahat berishda: 〜なら (Agar boradigan bo'lsangiz...)."
        },
        {
            "id": "ja-n4-u4-l4-ex-6",
            "type": "multiple-choice",
            "prompt": "Vaqt ma'nosi: «Uyga yetib borgach, qo'ng'iroq qiling»:",
            "options": [
                "家[いえ]に 着[つ]いたら、電話[でんわ]して ください",
                "家に着くと、電話して ください",
                "家に着けば、電話して ください",
                "家に着くなら、電話して ください"
            ],
            "correctAnswer": 0,
            "explanation": "Keyingi qismda iltimos yoki buyruq (〜てください) bo'lsa, faqat 〜たら ishlatiladi (〜と yoki 〜ば bilan buyruq ulanmaydi)."
        },
        {
            "id": "ja-n4-u4-l4-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「春[はる]に　＿＿　＿＿　★　＿＿　咲[さ]きます。」",
            "options": ["1: きれいな", "2: なると、", "3: 桜[さくら]が", "4: 公園[こうえん]に"],
            "correctAnswer": 1,
            "explanation": "To'g'ri tartib: 「春に なると、(2) 公園に (4) きれいな (1★) 桜が (3) 咲きます。」 Yulduzcha 1-variantdagi きれいな ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u4-l4-ex-8",
            "type": "multiple-choice",
            "prompt": "«Agar tushunmasangiz, ustozdan so'rang» jumlasi qaysi?",
            "options": [
                "分[わ]からなかったら、先生[せんせい]に 聞[き]いて ください",
                "分からなくては、先生に 聞いて ください",
                "分からないと、先生に 聞いて ください",
                "分からないば、先生に 聞いて ください"
            ],
            "correctAnswer": 0,
            "explanation": "Inkor shart + iltimos: 分からなかったら、...聞いてください."
        },
        {
            "id": "ja-n4-u4-l4-ex-9",
            "type": "multiple-choice",
            "prompt": "«Ko'p pulim bo'lsa, butun dunyoni sayohat qilgan bo'lardim» gipotetik orzu:",
            "options": [
                "お金[かね]が あれば、世界中[せかいじゅう]を 旅行[りょこう]したいです",
                "お金が あると、世界中を 旅行したいです",
                "お金が あってから、世界中を 旅行したいです",
                "お金が あるなら、世界中を 旅行したいです"
            ],
            "correctAnswer": 0,
            "explanation": "Faraziy shart: ある -> あれば (Bo'lganida edi)."
        },
        {
            "id": "ja-n4-u4-l4-ex-10",
            "type": "multiple-choice",
            "prompt": "«Stantsiyaga yetib borganimda, do'stim kutib turgan ekan» (kutilmagan kashfiyot):",
            "options": [
                "駅[えき]に 行[い]ったら、友達[ともだち]が 待[ま]って いました",
                "駅に行くと、友達が待っていました",
                "駅に行けば、友達が待っていました",
                "駅に行くなら、友達が待っていました"
            ],
            "correctAnswer": 0,
            "explanation": "Bir harakat bajarilgach, o'tmishda noma'lum holat kashf etilishi: 〜たら (行ったら、待っていました)."
        },
        {
            "id": "ja-n4-u4-l4-ex-11",
            "type": "multiple-choice",
            "prompt": "«Havo yaxshi bo'lsa, toqqa chiqaylik!» taklifi:",
            "options": [
                "天気[てんき]が よかったら、山[やま]に 登[のぼ]ろう！",
                "天気が いいと、山に 登ろう！",
                "天気が よければ、山に 登ろう！",
                "天気が いいなら、山に 登れ！"
            ],
            "correctAnswer": 0,
            "explanation": "Taklif (登ろう) bilan birikuvchi shart: よかったら (Agar yaxshi bo'lsa)."
        },
        {
            "id": "ja-n4-u4-l4-ex-12",
            "type": "multiple-choice",
            "prompt": "«Bu dorini ichsangiz, tuzalib ketasiz» tabiiy maslahati:",
            "options": [
                "この 薬[くすり]を 飲[の]めば、治[なお]りますよ",
                "この 薬を 飲んだら、治りなさい",
                "この 薬を 飲むと、治りたいです",
                "この 薬を 飲むなら、治りますよ"
            ],
            "correctAnswer": 0,
            "explanation": "Shart va uning ijobiy oqibati: 飲めば、治ります (ichsangiz, tuzaladi)."
        },
        {
            "id": "ja-n4-u4-l4-ex-13",
            "type": "multiple-choice",
            "prompt": "«Agar vaqtingiz bo'lmasa, ertaga qilsangiz ham bo'ladi»:",
            "options": [
                "時間[じかん]が なければ、明日[あした]でも いいですよ",
                "時間が なかったら、明日でも だめですよ",
                "時間が ないと、明日でも してください",
                "時間が ないなら、明日でも いけません"
            ],
            "correctAnswer": 0,
            "explanation": "Inkor shart shakli: ない -> なければ (Agar bo'lmasa)."
        },
        {
            "id": "ja-n4-u4-l4-ex-14",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos shaklni tanlang:\n「まっすぐ （　　）と、右側[みぎがわ]に 郵便局[ゆうびんきょく]が あります。」",
            "options": ["行[い]く", "行ったら", "行けば", "行って"],
            "correctAnswer": 0,
            "explanation": "〜と oldidan fe'lning lug'at shakli (jishokei) keladi: 行くと (borsangiz)."
        },
        {
            "id": "ja-n4-u4-l4-ex-15",
            "type": "multiple-choice",
            "prompt": "«Ertaga bo'sh bo'lsangiz, birga kinoga boramizmi?» taklifi:",
            "options": [
                "明日[あした] 暇[ひま]だったら、一緒[いっしょ]に 映画[えいが]を 見[み]に 行[い]きませんか",
                "明日 暇なら、映画を見に行きなさい",
                "明日 暇だと、映画を見に行きませんか",
                "明日 暇でば、映画を見に行きましょう"
            ],
            "correctAnswer": 0,
            "explanation": "Na-sifatning たら-shakli: 暇だったら (Agar bo'sh bo'lsangiz)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 20: N4 Reading: Letters & Everyday Communications
    # ----------------------------------------------------
    "ja-n4-u4-l5": [
        {
            "id": "ja-n4-u4-l5-ex-1",
            "type": "multiple-choice",
            "prompt": "Yapon an'anaviy xatlarining boshlanishidagi standart salomlashish so'zi qaysi?",
            "options": ["拝啓[はいけい]", "敬具[けいぐ]", "さようなら", "こんにちは"],
            "correctAnswer": 0,
            "explanation": "拝啓 (はいけい) — xat boshida qo'yiladigan hurmatli murojaat so'zi bo'lib, xat oxirida doimo 敬具 (けいぐ) bilan yopiladi."
        },
        {
            "id": "ja-n4-u4-l5-ex-2",
            "type": "multiple-choice",
            "prompt": "Xat boshidagi mavsumiy salomlashish jumlasi: «Kunlar ancha sovib qoldi, yaxshi yuribsizmi?»:",
            "options": [
                "寒[さむ]くなりましたが、お元気[げんき]ですか",
                "暑くなりましたが、さようなら",
                "暖かくなりましたが、お邪魔します",
                "涼しくなりましたが、いただきます"
            ],
            "correctAnswer": 0,
            "explanation": "Yapon xat odobida avval ob-havo/fasl o'zgarishi, so'ng suhbatdoshning salomatligi so'raladi: 寒くなりましたが、お元気ですか."
        },
        {
            "id": "ja-n4-u4-l5-ex-3",
            "type": "multiple-choice",
            "prompt": "Xat oxiridagi xushmuomala tilak: «O'zingizni ehtiyot qiling (salomatligingizga qarang)»:",
            "options": [
                "お体[からだ]に 気[き]をつけて ください",
                "お体に 触らないで ください",
                "お体を 休まないで ください",
                "お体を 動かして ください"
            ],
            "correctAnswer": 0,
            "explanation": "Xat yakunida: 「お体に気をつけてください」 (Sog'lig'ingizni asrang)."
        },
        {
            "id": "ja-n4-u4-l5-ex-4",
            "type": "multiple-choice",
            "prompt": "Elektron pochtadagi «Re: / Mavzu» yaponcha nima deyiladi?",
            "options": ["件名[けんめい]", "宛先[あてさき]", "送信[そうしん]", "返信[へんしん]"],
            "correctAnswer": 0,
            "explanation": "件名 (けんめい) — xat mavzusi (Subject). 宛先 (あてさき) — qabul qiluvchi manzili."
        },
        {
            "id": "ja-n4-u4-l5-ex-5",
            "type": "multiple-choice",
            "prompt": "«Uchrashuvimizni intiqlik bilan kutaman» ifodasi qaysi?",
            "options": [
                "お会[あ]いできるのを 楽[たの]しみに して います",
                "お会いできるのを 心配して います",
                "お会いできるのを 忘れて います",
                "お会いできるのを 困って います"
            ],
            "correctAnswer": 0,
            "explanation": "Biror voqeani sabrsizlik va quvonch bilan kutish: 〜を心待ちにする / 楽しみにしています."
        },
        {
            "id": "ja-n4-u4-l5-ex-6",
            "type": "multiple-choice",
            "prompt": "Maktubdagi uzrxohlik: «Javob yozishim kechikkanidan xijolatdaman»:",
            "options": [
                "お返事[へんじ]が 遅[おく]れて 申[もう]し訳[わけ]ありません",
                "お返事が 早くて ありがとう",
                "お返事を 書かないで ください",
                "お返事を 待って いません"
            ],
            "correctAnswer": 0,
            "explanation": "Kechikkan javob uchun uzr: お返事が遅れて申し訳ありません."
        },
        {
            "id": "ja-n4-u4-l5-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「先生[せんせい]、　＿＿　＿＿　★　＿＿　ありがとう ございました。」",
            "options": ["1: 日本語[にほんご]を", "2: いつも", "3: 教[おし]えて", "4: くださり"],
            "correctAnswer": 3,
            "explanation": "To'g'ri tartib: 「先生、いつも (2) 日本語を (1) 教えて (3) くださり (4★) ありがとうございました。」 Yulduzcha 4-variantdagi くださり ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u4-l5-ex-8",
            "type": "multiple-choice",
            "prompt": "«Xat jo'natuvchi (yuboruvchi shaxs)» yapon tilida nima deyiladi?",
            "options": ["差出人[さしだしにん]", "受取人[うけとりにん]", "案内人[あんないにん]", "管理人[かんりにん]"],
            "correctAnswer": 0,
            "explanation": "差出人 (さしだしにん) — konvert yoki posilkani jo'natuvchi shaxs."
        },
        {
            "id": "ja-n4-u4-l5-ex-9",
            "type": "multiple-choice",
            "prompt": "«Qabul qilib oluvchi shaxs» nima deyiladi?",
            "options": ["受取人[うけとりにん]", "差出人[さしだしにん]", "外国人[がいこくじん]", "配達人[はいたつにん]"],
            "correctAnswer": 0,
            "explanation": "受取人 (うけとりにん) yoki 宛名 (あてな) — xat oluvchi."
        },
        {
            "id": "ja-n4-u4-l5-ex-10",
            "type": "multiple-choice",
            "prompt": "Quyidagi qisqa xatni o'qing:\n「田中先生、昨日は 素晴らしい 本を 貸して いただき、本当に ありがとうございました。大切に 読みます。」\nXat yozuvchisi Tanaka domlaga nima uchun minnatdorchilik bildiryapti?",
            "options": [
                "Kecha ajoyib kitob berib turganlari uchun",
                "Kitob sotib olib berganlari uchun",
                "Kechki ovqatga taklif qilganlari uchun",
                "Darsga kirmagani uchun"
            ],
            "correctAnswer": 0,
            "explanation": "「本を貸していただき」 — kitob berib turganingiz uchun."
        },
        {
            "id": "ja-n4-u4-l5-ex-11",
            "type": "multiple-choice",
            "prompt": "Xat so'ngidagi xushmuomala yopilish so'zi «拝啓» ga javoban qaysi bo'ladi?",
            "options": ["敬具[けいぐ]", "かしこ", "お大事に", "失礼します"],
            "correctAnswer": 0,
            "explanation": "拝啓 (Boshlanish) -> 敬具 (Xotima). Ayollar tomonidan shaxsiy xatda «かしこ» ham ishlatilishi mumkin, lekin umumiy me'yor «敬具»dir."
        },
        {
            "id": "ja-n4-u4-l5-ex-12",
            "type": "multiple-choice",
            "prompt": "«Uydagilaringizga (oilangizga) salomimni yetkazing» ifodasi qaysi?",
            "options": [
                "ご家族[かぞく]の 皆様[みなさま]に よろしく お伝[つた]え ください",
                "ご家族の 皆様に 気をつけて ください",
                "ご家族の 皆様に さようなら",
                "ご家族の 皆様と 一緒に 来て ください"
            ],
            "correctAnswer": 0,
            "explanation": "Salom yetkazish: 「よろしくお伝えください」."
        },
        {
            "id": "ja-n4-u4-l5-ex-13",
            "type": "multiple-choice",
            "prompt": "Do'stga yozilgan norasmiy xat boshlanishi qaysi bo'lishi mumkin?",
            "options": [
                "元気[げんき]？ 最近[さいきん] どうしてる？",
                "拝啓 寒冷の候",
                "貴社ますますご清栄のこととお慶び申し上げます",
                "前略 ごめんください"
            ],
            "correctAnswer": 0,
            "explanation": "Tengdosh do'stlar o'rtasida murakkab kanjilar o'rniga oddiy va samimiy: 「元気？最近どうしてる？」 (Yaxshimisan? Nimalar qilyapsan?)."
        },
        {
            "id": "ja-n4-u4-l5-ex-14",
            "type": "multiple-choice",
            "prompt": "«Fursat topib (vaqtingiz bo'lganda) uyimizga mehmonga keling» taklifi:",
            "options": [
                "ぜひ 近[ちか]いうちに 遊[あそ]びに 来[き]て くださいね",
                "決して うちに 来ないで ください",
                "あまり うちに 来ないで ください",
                "うちに来なければ なりません"
            ],
            "correctAnswer": 0,
            "explanation": "Xushmuomala taklif: ぜひ近いうちに遊びに来てくださいね."
        },
        {
            "id": "ja-n4-u4-l5-ex-15",
            "type": "multiple-choice",
            "prompt": "«Xatni o'qib bo'lgach darhol javob yozdim»:",
            "options": [
                "手紙[てがみ]を 読[よ]んで、すぐに 返事[へんじ]を 書[か]きました",
                "手紙を 読まないで 返事を 書きました",
                "手紙を 読んだら 返事を 書かないで ください",
                "手紙を 読めば 返事を 書いて あります"
            ],
            "correctAnswer": 0,
            "explanation": "Ketma-ket harakat: 読んで、すぐに返事を書きました."
        }
    ]
}
