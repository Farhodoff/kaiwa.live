# -*- coding: utf-8 -*-
"""
JLPT N5 Unit 5: Basic Kanji 1-3, Mini-Mock Exam & Capstone N4 Transition
Lessons 21-25 (15 authentic exercises per lesson = 75 exercises total)
"""

UNIT5_EXERCISES = {
    # ----------------------------------------------------
    # Lesson 21: N5 Basic Kanji 1: Numbers & Nature (一, 二, 三, 日, 月, 木, 水, 火)
    # ----------------------------------------------------
    "ja-n5-u5-l1": [
        {
            "id": "ja-n5-u5-l1-ex-1",
            "type": "multiple-choice",
            "prompt": "«一» kanjisining On'yomi va Kun'yomi o'qilishlari qaysilar?",
            "options": [
                "いち (Ichi) / ひと・つ (Hito-tsu)",
                "に (Ni) / ふた・つ",
                "さん (San) / みっ・つ",
                "よん (Yon) / よっ・つ"
            ],
            "correctAnswer": 0,
            "explanation": "一 — soni 1: いち (Ichi) yoki ひとつ (Hitotsu)."
        },
        {
            "id": "ja-n5-u5-l1-ex-2",
            "type": "multiple-choice",
            "prompt": "«二» kanjisining o'qilishlari qaysilar?",
            "options": [
                "に (Ni) / ふた・つ (Futa-tsu)",
                "いち / ひとつ",
                "さん / みっつ",
                "よん / よっつ"
            ],
            "correctAnswer": 0,
            "explanation": "二 — soni 2: に (Ni) yoki ふたつ (Futatsu)."
        },
        {
            "id": "ja-n5-u5-l1-ex-3",
            "type": "multiple-choice",
            "prompt": "«三» kanjisining to'g'ri o'qilishi:",
            "options": [
                "さん (San) / みっ・つ (Mi-tsu)",
                "よん / よっつ",
                "ご / いつつ",
                "ろく / むっつ"
            ],
            "correctAnswer": 0,
            "explanation": "三 — soni 3: さん (San) yoki みっつ (Mittsu)."
        },
        {
            "id": "ja-n5-u5-l1-ex-4",
            "type": "multiple-choice",
            "prompt": "«日» kanjisi «Quyosh / Kun» ma'nosini beradi. «日曜日» so'zida u qanday o'qiladi?",
            "options": [
                "にちようび (Nichiyoubi) — birinchi «日» nichi, ikkinchisi bi",
                "ひようひ",
                "かようび",
                "つきようび"
            ],
            "correctAnswer": 0,
            "explanation": "日曜日[にちようび] — 日 (Nichi) + 曜 (You) + 日 (Bi)."
        },
        {
            "id": "ja-n5-u5-l1-ex-5",
            "type": "multiple-choice",
            "prompt": "«日本» so'zining to'g'ri o'qilishi va ma'nosi:",
            "options": [
                "にほん / にっぽん (Nihon / Nippon) — Yaponiya (Quyosh chiqadigan yurt)",
                "にちほん",
                "ひほん",
                "がっこう"
            ],
            "correctAnswer": 0,
            "explanation": "日本[にほん] — Yaponiya (日 = quyosh, 本 = asos/kelib chiqish)."
        },
        {
            "id": "ja-n5-u5-l1-ex-6",
            "type": "multiple-choice",
            "prompt": "«月» kanjisi «Oy» ma'nosini beradi. «一月» (Yanvar oyi) da u qanday o'qiladi?",
            "options": [
                "いちがつ (Ichigatsu)",
                "いちげつ",
                "ひとつき",
                "いちつき"
            ],
            "correctAnswer": 0,
            "explanation": "Yil oylarini sanashda «〜がつ»: 一月 = いちがつ."
        },
        {
            "id": "ja-n5-u5-l1-ex-7",
            "type": "multiple-choice",
            "prompt": "«木» kanjisi «Daraxt» ma'nosini beradi. «木曜日» so'zida u qanday o'qiladi?",
            "options": [
                "もくようび (Mokuyoubi) — Payshanba",
                "きようび",
                "ぼくようび",
                "すいようび"
            ],
            "correctAnswer": 0,
            "explanation": "木曜日[もくようび] — Payshanba (Daraxt kuni)."
        },
        {
            "id": "ja-n5-u5-l1-ex-8",
            "type": "multiple-choice",
            "prompt": "«水» kanjisi «Suv» ma'nosini beradi. Kun'yomi (mustaqil so'z sifatida) qanday o'qiladi?",
            "options": [
                "みず (Mizu)",
                "すい (Sui)",
                "かわ (Kawa)",
                "うみ (Umi)"
            ],
            "correctAnswer": 0,
            "explanation": "Mustaqil «suv» so'zi: 水[みず]."
        },
        {
            "id": "ja-n5-u5-l1-ex-9",
            "type": "multiple-choice",
            "prompt": "«火» kanjisi «Olov» ma'nosini beradi. «火曜日» so'zida u qanday o'qiladi?",
            "options": [
                "かようび (Kayoubi) — Seshanba",
                "ひようび",
                "ほようび",
                "すいようび"
            ],
            "correctAnswer": 0,
            "explanation": "火曜日[かようび] — Seshanba (Olov kuni)."
        },
        {
            "id": "ja-n5-u5-l1-ex-10",
            "type": "multiple-choice",
            "prompt": "«金» kanjisi «Oltin / Pul» ma'nosini bildiradi. «Pul» so'zi qanday aytiladi?",
            "options": [
                "おかね (O-kane) — お金",
                "きん",
                "ぎん",
                "えん"
            ],
            "correctAnswer": 0,
            "explanation": "Pul: お金[おかね]. Juma kuni: 金曜日[きんようび]."
        },
        {
            "id": "ja-n5-u5-l1-ex-11",
            "type": "multiple-choice",
            "prompt": "«土» kanjisi «Tuproq / Yer» ma'nosida «土曜日» so'zida qanday o'qiladi?",
            "options": [
                "どようび (Doyoubi) — Shanba",
                "つちようび",
                "とうようび",
                "にちようび"
            ],
            "correctAnswer": 0,
            "explanation": "土曜日[どようび] — Shanba (Tuproq kuni)."
        },
        {
            "id": "ja-n5-u5-l1-ex-12",
            "type": "multiple-choice",
            "prompt": "«山» (Tog') va «川» (Daryo) kanjilarining to'g'ri o'qilishlari:",
            "options": [
                "山 = やま (Yama), 川 = かわ (Kawa)",
                "山 = かわ, 川 = やま",
                "山 = うみ, 川 = いけ",
                "山 = もり, 川 = はやし"
            ],
            "correctAnswer": 0,
            "explanation": "山[やま] (tog'), 川[かわ] (daryo)."
        },
        {
            "id": "ja-n5-u5-l1-ex-13",
            "type": "multiple-choice",
            "prompt": "«富士山» so'zining to'g'ri o'qilishi:",
            "options": [
                "ふじさん (Fujisan) — Fudzi tog'i",
                "ふじやま",
                "ふじかわ",
                "ふじうみ"
            ],
            "correctAnswer": 0,
            "explanation": "Yaponiyaning muqaddas tog'i: 富士山[ふじさん]."
        },
        {
            "id": "ja-n5-u5-l1-ex-14",
            "type": "multiple-choice",
            "prompt": "Oyning 1-kuni (1-sanasi) qanday maxsus o'qiladi (istisno)?",
            "options": [
                "ついたち (Tsuitachi)",
                "いちにち",
                "ひとひ",
                "いちじつ"
            ],
            "correctAnswer": 0,
            "explanation": "Sana sifatida oyning 1-kuni: 一日 = ついたち."
        },
        {
            "id": "ja-n5-u5-l1-ex-15",
            "type": "multiple-choice",
            "prompt": "«日本の 山は きれいです» gapining tarjimasi:",
            "options": [
                "Yaponiyaning tog'lari chiroyli",
                "Yaponiyaning daryolari toza",
                "Yaponiyaning shaharlari katta",
                "Yaponiyaning o'rmonlari zich"
            ],
            "correctAnswer": 0,
            "explanation": "日本の (Yaponiyaning) + 山は (tog'lari) + きれいです (go'zaldir)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 22: N5 Basic Kanji 2: People, Directions & Sizes (人, 男, 女, 大, 小, 中, 上, 下)
    # ----------------------------------------------------
    "ja-n5-u5-l2": [
        {
            "id": "ja-n5-u5-l2-ex-1",
            "type": "multiple-choice",
            "prompt": "«人» kanjisining mustaqil «Inson/Odam» ma'nosidagi o'qilishi qaysi?",
            "options": [
                "ひと (Hito)",
                "じん (Jin)",
                "にん (Nin)",
                "ぼく (Boku)"
            ],
            "correctAnswer": 0,
            "explanation": "Mustaqil inson so'zi: 人[ひと]."
        },
        {
            "id": "ja-n5-u5-l2-ex-2",
            "type": "multiple-choice",
            "prompt": "«男» (Erkak) kanjisi qanday o'qiladi?",
            "options": [
                "おとこ (Otoko) — 男の人 (Otoko no hito)",
                "おんな (Onna)",
                "こども (Kodomo)",
                "ひと (Hito)"
            ],
            "correctAnswer": 0,
            "explanation": "男[おとこ] — erkak kishi."
        },
        {
            "id": "ja-n5-u5-l2-ex-3",
            "type": "multiple-choice",
            "prompt": "«女» (Ayol) kanjisi qanday o'qiladi?",
            "options": [
                "おんな (Onna) — 女の人 (Onna no hito)",
                "おとこ (Otoko)",
                "かた (Kata)",
                "こ (Ko)"
            ],
            "correctAnswer": 0,
            "explanation": "女[おんな] — ayol kishi."
        },
        {
            "id": "ja-n5-u5-l2-ex-4",
            "type": "multiple-choice",
            "prompt": "«子供» so'zining to'g'ri o'qilishi va ma'nosi:",
            "options": [
                "こども (Kodomo) — Bola / Farzand",
                "おとな (Katta odam)",
                "ともだち (Do'st)",
                "せんせい (O'qituvchi)"
            ],
            "correctAnswer": 0,
            "explanation": "子供[こども] (kodomo) so'zi bola yoki farzand ma'nosini bildiradi."
        },
        {
            "id": "ja-n5-u5-l2-ex-5",
            "type": "multiple-choice",
            "prompt": "«大» kanjisi «Katta» ma'nosida «大きい» sifatida qanday o'qiladi?",
            "options": [
                "おお・きい (Oo-kii)",
                "だい・きい",
                "たい・きい",
                "ちい・さい"
            ],
            "correctAnswer": 0,
            "explanation": "大きい[おおきい] — katta."
        },
        {
            "id": "ja-n5-u5-l2-ex-6",
            "type": "multiple-choice",
            "prompt": "«大学» (Universitet) so'zida «大» kanjisi qanday o'qiladi?",
            "options": [
                "だいがく (Daigaku)",
                "おおがく",
                "たいがく",
                "こうがく"
            ],
            "correctAnswer": 0,
            "explanation": "大学[だいがく] — oliy o'quv yurti, universitet."
        },
        {
            "id": "ja-n5-u5-l2-ex-7",
            "type": "multiple-choice",
            "prompt": "«小» kanjisi «Kichik» ma'nosida «小さい» sifatida qanday o'qiladi?",
            "options": [
                "ちい・さい (Chii-sai)",
                "しょう・さい",
                "おお・きい",
                "すこ・し"
            ],
            "correctAnswer": 0,
            "explanation": "小さい[ちいさい] — kichik."
        },
        {
            "id": "ja-n5-u5-l2-ex-8",
            "type": "multiple-choice",
            "prompt": "«中» kanjisi «Ichi / Markazi» ma'nosida mustaqil qanday o'qiladi?",
            "options": [
                "なか (Naka)",
                "ちゅう (Chuu)",
                "じゅう (Juu)",
                "うえ (Ue)"
            ],
            "correctAnswer": 0,
            "explanation": "Mustaqil ichi ma'nosida: 中[なか]."
        },
        {
            "id": "ja-n5-u5-l2-ex-9",
            "type": "multiple-choice",
            "prompt": "«一日中» (Kun bo'yi) so'zida «中» qanday o'qiladi?",
            "options": [
                "いちにちじゅう (Ichinichi-juu)",
                "いちにちなか",
                "いちにちちゅう",
                "ついたちじゅう"
            ],
            "correctAnswer": 0,
            "explanation": "Davomiylik (butun kun bo'yi): 一日中[いちにちじゅう]."
        },
        {
            "id": "ja-n5-u5-l2-ex-10",
            "type": "multiple-choice",
            "prompt": "«上» (Tepa/Usti) va «下» (Pasti/Togi) kanjilarining Kun'yomi o'qilishlari:",
            "options": [
                "上 = うえ (Ue), 下 = した (Shita)",
                "上 = した, 下 = うえ",
                "上 = なか, 下 = そと",
                "上 = まえ, 下 = うしろ"
            ],
            "correctAnswer": 0,
            "explanation": "上[うえ] (usti) vs 下[した] (osti)."
        },
        {
            "id": "ja-n5-u5-l2-ex-11",
            "type": "multiple-choice",
            "prompt": "«上手» va «下手» so'zlarining to'g'ri o'qilishlari va ma'nolari:",
            "options": [
                "上手 = じょうず (Mohir/Usta), 下手 = へた (Noo'quv)",
                "上手 = うえのて, 下手 = したのて",
                "上手 = かみて, 下手 = しもて",
                "上手 = へた, 下手 = じょうず"
            ],
            "correctAnswer": 0,
            "explanation": "上手[じょうず] (usta) va 下手[へた] (tajribasiz)."
        },
        {
            "id": "ja-n5-u5-l2-ex-12",
            "type": "multiple-choice",
            "prompt": "«右» (O'ng tomon) va «左» (Chap tomon) kanjilarining to'g'ri o'qilishlari:",
            "options": [
                "右 = みぎ (Migi), 左 = ひだり (Hidari)",
                "右 = ひだり, 左 = みぎ",
                "右 = きた, 左 = みなみ",
                "右 = ひがし, 左 = にし"
            ],
            "correctAnswer": 0,
            "explanation": "右[みぎ] (o'ng) vs 左[ひだり] (chap)."
        },
        {
            "id": "ja-n5-u5-l2-ex-13",
            "type": "multiple-choice",
            "prompt": "«前» (Oldi / Ilgari) kanjisi qanday o'qiladi?",
            "options": [
                "まえ (Mae) — masalan: 駅の前 (Eki no mae)",
                "うしろ (Ushiro)",
                "あと (Ato)",
                "さき (Saki)"
            ],
            "correctAnswer": 0,
            "explanation": "前[まえ] — old tomon."
        },
        {
            "id": "ja-n5-u5-l2-ex-14",
            "type": "multiple-choice",
            "prompt": "«午前» (Tushgacha / Ertalabki vaqt) va «午後» (Tushdan keyin) so'zlarining to'g'ri o'qilishlari:",
            "options": [
                "午前 = ごぜん (Gozen), 午後 = ごご (Gogo)",
                "午前 = ごご, 午後 = ごぜん",
                "午前 = まえご, 午後 = あとご",
                "午前 = あさご, 午後 = よるご"
            ],
            "correctAnswer": 0,
            "explanation": "午前[ごぜん] (AM - ertalab) va 午後[ごご] (PM - tushdan keyin)."
        },
        {
            "id": "ja-n5-u5-l2-ex-15",
            "type": "multiple-choice",
            "prompt": "«入口» (Kirish joyi) va «出口» (Chiqish joyi) so'zlarining to'g'ri o'qilishlari:",
            "options": [
                "入口 = いりぐち (Iriguchi), 出口 = でぐち (Deguchi)",
                "入口 = はいりぐち, 出口 = だしぐち",
                "入口 = にゅうこう, 出口 = しゅつこう",
                "入口 = いりくち, 出口 = でくち"
            ],
            "correctAnswer": 0,
            "explanation": "入口[いりぐち] (kirish) va 出口[でぐち] (chiqish)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 23: N5 Basic Kanji 3: School, Study & Places (学, 校, 先, 生, 本, 車, 電)
    # ----------------------------------------------------
    "ja-n5-u5-l3": [
        {
            "id": "ja-n5-u5-l3-ex-1",
            "type": "multiple-choice",
            "prompt": "«学校» (Maktab) so'zining to'g'ri o'qilishi qaysi?",
            "options": [
                "がっこう (Gakkou)",
                "がくこう",
                "がくきょう",
                "がっきょう"
            ],
            "correctAnswer": 0,
            "explanation": "学校[がっこう] — maktab."
        },
        {
            "id": "ja-n5-u5-l3-ex-2",
            "type": "multiple-choice",
            "prompt": "«学生» (Talaba / O'quvchi) so'zining to'g'ri o'qilishi:",
            "options": [
                "がくせい (Gakusei)",
                "がっせい",
                "がくしょう",
                "がくじょう"
            ],
            "correctAnswer": 0,
            "explanation": "学生[がくせい] — talaba."
        },
        {
            "id": "ja-n5-u5-l3-ex-3",
            "type": "multiple-choice",
            "prompt": "«先生» (Ustoz / O'qituvchi) so'zining to'g'ri o'qilishi:",
            "options": [
                "せんせい (Sensei)",
                "さきせい",
                "せんしょう",
                "さきしょう"
            ],
            "correctAnswer": 0,
            "explanation": "先生[せんせい] — muallim, shifokor yoki ustoz."
        },
        {
            "id": "ja-n5-u5-l3-ex-4",
            "type": "multiple-choice",
            "prompt": "«電車» (Poyezd / Elektr poyezdi) so'zidagi ikkala kanjining ma'nosi nima?",
            "options": [
                "電 = elektr (Den) + 車 = arava/mashina (Sha) -> Elektr poyezdi",
                "電 = temir + 車 = yo'l",
                "電 = tez + 車 = ulov",
                "電 = katta + 車 = yuk"
            ],
            "correctAnswer": 0,
            "explanation": "電車[でんしゃ] = 电 (elektr) + 车 (arava)."
        },
        {
            "id": "ja-n5-u5-l3-ex-5",
            "type": "multiple-choice",
            "prompt": "«電話» (Telefon) so'zining to'g'ri o'qilishi:",
            "options": [
                "でんわ (Denwa)",
                "でんはなし",
                "でんご",
                "てんわ"
            ],
            "correctAnswer": 0,
            "explanation": "電話[でんわ] — telefon."
        },
        {
            "id": "ja-n5-u5-l3-ex-6",
            "type": "multiple-choice",
            "prompt": "«天気» (Ob-havo) so'zining to'g'ri o'qilishi:",
            "options": [
                "てんき (Tenki)",
                "あめき",
                "そらき",
                "でんき"
            ],
            "correctAnswer": 0,
            "explanation": "天気[てんき] — ob-havo."
        },
        {
            "id": "ja-n5-u5-l3-ex-7",
            "type": "multiple-choice",
            "prompt": "«名前» (Ism) so'zining to'g'ri o'qilishi:",
            "options": [
                "なまえ (Namae)",
                "めいぜん",
                "なまえん",
                "みょうじ"
            ],
            "correctAnswer": 0,
            "explanation": "名前[なまえ] — inson ismi."
        },
        {
            "id": "ja-n5-u5-l3-ex-8",
            "type": "multiple-choice",
            "prompt": "«日本語» (Yapon tili) so'zida «語» kanjisi qanday o'qiladi?",
            "options": [
                "ご (Go) — til ma'nosida",
                "かたり",
                "ごう",
                "ことば"
            ],
            "correctAnswer": 0,
            "explanation": "Mamlakat + 語[ご] = o'sha millat tili (日本語, 英語, ロシア語)."
        },
        {
            "id": "ja-n5-u5-l3-ex-9",
            "type": "multiple-choice",
            "prompt": "«食べます» (Yeyman) fe'lining kanjisi qaysi?",
            "options": [
                "食 (Shoku / Tabe) — 食[た]べます",
                "飲 (In / Nomi)",
                "買 (Bai / Ka)",
                "見 (Ken / Mi)"
            ],
            "correctAnswer": 0,
            "explanation": "食べます[たべます] — ovqat yemoq."
        },
        {
            "id": "ja-n5-u5-l3-ex-10",
            "type": "multiple-choice",
            "prompt": "«飲みます» (Ichaman) fe'lining kanjisi qaysi?",
            "options": [
                "飲 (In / Nomi) — 飲[の]みます",
                "食 (Shoku / Tabe)",
                "聞 (Bun / Ki)",
                "話 (Wa / Hana)"
            ],
            "correctAnswer": 0,
            "explanation": "飲みます[のみます] — suyuqlik ichmoq."
        },
        {
            "id": "ja-n5-u5-l3-ex-11",
            "type": "multiple-choice",
            "prompt": "«本» kanjisining mustaqil ma'nosi nima?",
            "options": [
                "Kitob (Hon)",
                "Daftar",
                "Qalam",
                "Xat"
            ],
            "correctAnswer": 0,
            "explanation": "本[ほん] (hon) kanjisi mustaqil holda kitob ma'nosida ishlatiladi."
        },
        {
            "id": "ja-n5-u5-l3-ex-12",
            "type": "multiple-choice",
            "prompt": "«車» kanjisining mustaqil «Mashina / Avtomobil» ma'nosidagi o'qilishi:",
            "options": [
                "くるま (Kuruma)",
                "しゃ (Sha)",
                "でんしゃ",
                "じどうしゃ"
            ],
            "correctAnswer": 0,
            "explanation": "Mustaqil mashina: 車[くるま]."
        },
        {
            "id": "ja-n5-u5-l3-ex-13",
            "type": "multiple-choice",
            "prompt": "«何» kanjisining o'qilishlari qaysilar?",
            "options": [
                "なに (Nani) va なん (Nan) — Nima ma'nosida",
                "だれ (Dare)",
                "どこ (Doko)",
                "いつ (Itsu)"
            ],
            "correctAnswer": 0,
            "explanation": "何: なに (nima) yoki 何時[なんじ], 何人[なんにん]."
        },
        {
            "id": "ja-n5-u5-l3-ex-14",
            "type": "multiple-choice",
            "prompt": "«英語» (Ingliz tili) so'zining to'g'ri o'qilishi:",
            "options": [
                "えいご (Eigo)",
                "えご",
                "えいこく",
                "イギリスご"
            ],
            "correctAnswer": 0,
            "explanation": "英語[えいご] — ingliz tili."
        },
        {
            "id": "ja-n5-u5-l3-ex-15",
            "type": "multiple-choice",
            "prompt": "«田中先生は 学校で 日本語を 教[おし]えます» jumlasining ma'nosi:",
            "options": [
                "Tanaka ustoz maktabda yapon tilidan dars beradi (o'rgatadi)",
                "Tanaka maktabda yapon tilini o'rganadi",
                "Tanaka uyda kitob o'qiydi",
                "Tanaka do'kondan kitob sotib oldi"
            ],
            "correctAnswer": 0,
            "explanation": "教えます[おしえます] — o'rgatmoq, dars bermoq."
        }
    ],

    # ----------------------------------------------------
    # Lesson 24: JLPT N5 Mini-Mock Exam: Grammar & Reading
    # ----------------------------------------------------
    "ja-n5-u5-l4": [
        {
            "id": "ja-n5-u5-l4-ex-1",
            "type": "multiple-choice",
            "prompt": "【Moji】 «先週» so'zining to'g'ri Hiragana o'qilishi qaysi?",
            "options": [
                "せんしゅう (Senshuu)",
                "ぜんしゅう",
                "こんしゅう",
                "らいしゅう"
            ],
            "correctAnswer": 0,
            "explanation": "先週[せんしゅう] — o'tgan hafta."
        },
        {
            "id": "ja-n5-u5-l4-ex-2",
            "type": "multiple-choice",
            "prompt": "【Moji】 «てがみ» so'zining to'g'ri Kanji yozilishi qaysi?",
            "options": [
                "手紙 (Tegami)",
                "手紙",
                "足紙",
                "目紙"
            ],
            "correctAnswer": 0,
            "explanation": "手紙[てがみ] = 手 (qo'l) + 紙 (qog'oz)."
        },
        {
            "id": "ja-n5-u5-l4-ex-3",
            "type": "multiple-choice",
            "prompt": "【Goi】 Bo'sh joyga mos so'zni qo'ying: 「スプーンで （　　）を 食べます。」",
            "options": [
                "スープ (Suup - Sho'rva)",
                "パン",
                "リンゴ",
                "お茶"
            ],
            "correctAnswer": 0,
            "explanation": "Qoshiq (スプーン) bilan sho'rva (スープ) ichiladi/yeyiladi."
        },
        {
            "id": "ja-n5-u5-l4-ex-4",
            "type": "multiple-choice",
            "prompt": "【Goi】 «昨日 映画を 見ました» gapidagi «昨日» bilan ma'nodosh so'z qaysi?",
            "options": [
                "さくじつ (Sakujitsu — Kecha so'zining rasmiy varianti)",
                "きょう",
                "あした",
                "あさって"
            ],
            "correctAnswer": 0,
            "explanation": "昨日 = きのう (kundalik) = さくじつ (formal)."
        },
        {
            "id": "ja-n5-u5-l4-ex-5",
            "type": "multiple-choice",
            "prompt": "【Bunpou】 Bo'sh joyga mos zarrachani qo'ying: 「毎朝 7時（　　） 起きます。」",
            "options": ["に", "で", "を", "へ"],
            "correctAnswer": 0,
            "explanation": "Aniq soat vaqtiga «に» qo'yiladi: 7時に."
        },
        {
            "id": "ja-n5-u5-l4-ex-6",
            "type": "multiple-choice",
            "prompt": "【Bunpou】 «Qalam bilan xat yozaman» (Qurol/vosita zarrachasi):",
            "options": [
                "ペン（ で ） 手紙を 書きます",
                "ペン（ を ） 手紙を 書きます",
                "ペン（ に ） 手紙を 書きます",
                "ペン（ へ ） 手紙を 書きます"
            ],
            "correctAnswer": 0,
            "explanation": "Yozish quroli (vosita): ペンで."
        },
        {
            "id": "ja-n5-u5-l4-ex-7",
            "type": "multiple-choice",
            "prompt": "【Bunpou】 «Yakshanba kuni do'stim bilan uchrashaman»:",
            "options": [
                "日曜日 友達（ に ） 会います",
                "日曜日 友達（ を ） 会います",
                "日曜日 友達（ で ） 会います",
                "日曜日 友達（ へ ） 会います"
            ],
            "correctAnswer": 0,
            "explanation": "会います fe'li shaxsga nisbatan «に» talab qiladi: 友達に 会います."
        },
        {
            "id": "ja-n5-u5-l4-ex-8",
            "type": "multiple-choice",
            "prompt": "【Bunpou】 «Kecha havo juda sovuq edi»:",
            "options": [
                "昨日 天気は とても 寒[さむ]（ かったです ）",
                "昨日 天気は とても 寒（ いでした ）",
                "昨日 天気は とても 寒（ くないです ）",
                "昨日 天気は とても 寒（ いかったです ）"
            ],
            "correctAnswer": 0,
            "explanation": "寒い o'tgan zamoni: 寒かったです."
        },
        {
            "id": "ja-n5-u5-l4-ex-9",
            "type": "multiple-choice",
            "prompt": "【★ Star savoli】 Gapni to'g'ri terib, ★ o'rnidagi so'zni toping:\n「わたしは （　） （　） （★） （　） 行きます。」\n1. へ　2. 友達と　3. デパート　4. 買い物に",
            "options": [
                "1 (へ)",
                "2 (友達と)",
                "3 (デパート)",
                "4 (買い物に)"
            ],
            "correctAnswer": 0,
            "explanation": "Tartib: わたしは [2. 友達と] [3. デパート] [★1. へ] [4. 買い物に] 行きます. ★ o'rni — 1 (へ)."
        },
        {
            "id": "ja-n5-u5-l4-ex-10",
            "type": "multiple-choice",
            "prompt": "【Bunpou】 Harakat maqsadini bildirish («Kino ko'rgani boraman»):",
            "options": [
                "映画[えいが]を 見（ に ） 行きます",
                "映画を 見（ で ） 行きます",
                "映画を 見（ を ） 行きます",
                "映画を 見（ へ ） 行きます"
            ],
            "correctAnswer": 0,
            "explanation": "Fe'l masu-ildizi + に 行きます (harakat maqsadi): 見に 行きます."
        },
        {
            "id": "ja-n5-u5-l4-ex-11",
            "type": "multiple-choice",
            "prompt": "【Dokkai】 «【図書館のお知らせ】 月曜日は 休みです。火曜日から 日曜日まで 朝9時から 夕方5時まで 開いています。»\nSavol: Kutubxona qaysi kuni yopiq bo'ladi?",
            "options": [
                "Dushanba kuni (月曜日)",
                "Seshanba kuni",
                "Yakshanba kuni",
                "Har kuni ochiq"
            ],
            "correctAnswer": 0,
            "explanation": "E'londa aniq yozilgan: «月曜日は 休みです»."
        },
        {
            "id": "ja-n5-u5-l4-ex-12",
            "type": "multiple-choice",
            "prompt": "【Dokkai】 Kutubxona necha soat davomida ochiq bo'ladi (9:00 dan 17:00 gacha)?",
            "options": [
                "8 soat (8時間)",
                "5 soat",
                "10 soat",
                "6 soat"
            ],
            "correctAnswer": 0,
            "explanation": "9:00 dan 17:00 gacha = 8 soat (8時間)."
        },
        {
            "id": "ja-n5-u5-l4-ex-13",
            "type": "multiple-choice",
            "prompt": "JLPT N5 imtihonida umumiy maksimal ball nechchi va imtihondan o'tish minimal bali qancha?",
            "options": [
                "Maksimal 180 ball, o'tish bali kamida 80 ball (har bo'limdan esa minimal talab bajarilishi shart)",
                "Maksimal 100 ball, o'tish bali 50",
                "Maksimal 200 ball, o'tish bali 150",
                "Cheklov yo'q"
            ],
            "correctAnswer": 0,
            "explanation": "JLPT N5 standarti: jami 180 ball, o'tish me'yori kamida 80 ball (shuningdek Til bilimi/O'qishdan min 38, Tinglashdan min 19)."
        },
        {
            "id": "ja-n5-u5-l4-ex-14",
            "type": "multiple-choice",
            "prompt": "«Ertaga do'stim bilan restoranga borib, tushlik qilmoqchiman»:",
            "options": [
                "明日 友達と レストランへ 行って、昼ご飯を 食べたいです",
                "明日 友達に レストランで 行き、昼ご飯を 食べます",
                "明日 友達を レストランに 行き、昼ご飯を 食べたかったです",
                "明日 友達で レストランを 行き、昼ご飯を 食べないです"
            ],
            "correctAnswer": 0,
            "explanation": "Do'st bilan (友達と) + manzil (レストランへ) + 行って (Te-forma) + 食べたいです (xohish)."
        },
        {
            "id": "ja-n5-u5-l4-ex-15",
            "type": "multiple-choice",
            "prompt": "Savol varaqasida rasm berilib, yo'lovchi qaysi tomonga ketayotganini aniqlashda «右» belgisi qaysi yo'nalishni bildiradi?",
            "options": [
                "O'ng tomon",
                "Chap tomon",
                "To'g'ri",
                "Orqaga"
            ],
            "correctAnswer": 0,
            "explanation": "右[みぎ] = o'ng tomon."
        }
    ],

    # ----------------------------------------------------
    # Lesson 25: JLPT N5 Capstone Mastery & N4 Transition Assessment
    # ----------------------------------------------------
    "ja-n5-u5-l5": [
        {
            "id": "ja-n5-u5-l5-ex-1",
            "type": "multiple-choice",
            "prompt": "JLPT N5 darajasini muvaffaqiyatli yakunlagan o'quvchi qanday ko'nikmalarni to'liq egallagan bo'ladi?",
            "options": [
                "Hiragana, Katakana, ~100 ta tayanch kanji, ~800 ta kundalik so'z, asosiy grammatik zarrachalar va oddiy kundalik dialoglar",
                "Faqat alifbo harflarini o'qiy oladi",
                "Murakkab gazeta maqolalarini tahlil qila oladi",
                "Biznes shartnomalarni yoza oladi"
            ],
            "correctAnswer": 0,
            "explanation": "N5 — bu yapon tilining poydevori: 2 ta alifbo, 100+ kanji, 800+ lug'at va boshlang'ich grammatik modellar."
        },
        {
            "id": "ja-n5-u5-l5-ex-2",
            "type": "multiple-choice",
            "prompt": "N4 darajasiga o'tishdagi eng muhim grammatik ko'prik — fe'lning qaysi shakli hisoblanadi?",
            "options": [
                "Te-shakli (て形 - Te-kei), chunki undan o'nlab yangi konstruksiyalar (〜てください, 〜ている, 〜てもいい) yasaladi",
                "Faqat o'tgan zamon shakli",
                "Faqat inkor shakli",
                "Buyruq shakli"
            ],
            "correctAnswer": 0,
            "explanation": "Te-shakl (て形) butun yapon tili grammatikasining o'zagi bo'lib, barcha keyingi darajalar unga tayanadi."
        },
        {
            "id": "ja-n5-u5-l5-ex-3",
            "type": "multiple-choice",
            "prompt": "«Iltimos, kuting» (Te-shakli orqali xushmuomala iltimos):",
            "options": [
                "少[すこ]し 待[ま]ってください (Sukoshi matte kudasai)",
                "少し 待ちますください",
                "少し 待つください",
                "少し 待たないでください"
            ],
            "correctAnswer": 0,
            "explanation": "待ちます -> 待って (Te-forma) + ください = kuting."
        },
        {
            "id": "ja-n5-u5-l5-ex-4",
            "type": "multiple-choice",
            "prompt": "«Rasmga tushirsam maylimi?» (Ruxsat so'rash shakli):",
            "options": [
                "写真[しゃしん]を 撮[と]っても いいですか (Shashin o totte mo ii desu ka)",
                "写真を 撮ってはいけません",
                "写真を 撮ってください",
                "写真を 撮りましょうか"
            ],
            "correctAnswer": 0,
            "explanation": "〜てもいいですか = ...sam maylimi? (ruxsat so'rash)."
        },
        {
            "id": "ja-n5-u5-l5-ex-5",
            "type": "multiple-choice",
            "prompt": "«Bu yerda chekish mumkin emas (taqiqlanadi)»:",
            "options": [
                "ここで たばこを 吸[す]っては いけません (Tabako o sutte wa ikemasen)",
                "ここで たばこを 吸ってもいいです",
                "ここで たばこを 吸ってください",
                "ここで たばこを 吸いますか"
            ],
            "correctAnswer": 0,
            "explanation": "〜てはいけません = ...ish taqiqlanadi / mumkin emas."
        },
        {
            "id": "ja-n5-u5-l5-ex-6",
            "type": "multiple-choice",
            "prompt": "«Hozir kitob o'qiyapman (harakat ayni paytda davom etmoqda)»:",
            "options": [
                "今 本[ほん]を 読[よ]んでいます (Ima hon o yonde imasu)",
                "今 本を 読みました",
                "今 本を 読みたいです",
                "今 本を 読みませんか"
            ],
            "correctAnswer": 0,
            "explanation": "Fe'l te-shakli + います = ayni damda davom etayotgan harakat (Present Continuous)."
        },
        {
            "id": "ja-n5-u5-l5-ex-7",
            "type": "multiple-choice",
            "prompt": "O'zbek tili va yapon tili grammatikasining eng katta o'xshashligi nimada?",
            "options": [
                "Ikkala til ham SOV (Ega + To'ldiruvchi + Kesim) tartibiga ega va fe'l gapning eng oxirida keladi",
                "Ikkala tilda ham artikllar bor",
                "Ikkala tilda ham fe'llar shaxs va songa qarab o'zgaradi",
                "Ikkala tilda ham so'zlar old qo'shimchalar orqali yasaladi"
            ],
            "correctAnswer": 0,
            "explanation": "O'zbek va yapon tillari agglyutinativ bo'lib, gap tuzilishi bir xil: Men (Ega) kitobni (To'ldiruvchi) o'qiyman (Kesim oxirida)."
        },
        {
            "id": "ja-n5-u5-l5-ex-8",
            "type": "multiple-choice",
            "prompt": "Yangi so'zlarni tez va uzoq muddatli xotiraga muhrlashning eng samarali ilmiy usuli qaysi?",
            "options": [
                "Intervalli takrorlash (Spaced Repetition System - SRS) usulida fleshkartalar orqali muntazam qaytarish",
                "Faqat bir marta o'qib, boshqa qaramaslik",
                "Faqat so'zning harflarini yodlab, gap ichida ishlatmaslik",
                "Kechasi uxlamasdan bitta kitobni yod olish"
            ],
            "correctAnswer": 0,
            "explanation": "SRS (Spaced Repetition) — inson unutish egri chizig'iga (Ebbinghaus) qarshi eng samarali algoritm."
        },
        {
            "id": "ja-n5-u5-l5-ex-9",
            "type": "multiple-choice",
            "prompt": "Kanjilarni oson va mustahkam eslab qolishning eng yaxshi strategiyasi nima?",
            "options": [
                "Kanjini tarkibiy qismlariga (radikallarga) ajratib, mantiqiy va tasavvuriy hikoyalar orqali bog'lash",
                "Bir kanjini 1000 marta ma'nosiz chizib chiqish",
                "Kanjilarni faqat rasmlariga qarab taxmin qilish",
                "Kanjilarni o'rganmasdan faqat romajida o'qish"
            ],
            "correctAnswer": 0,
            "explanation": "Radikallar (bushu) — kanjilarning alifbosi bo'lib, ularni bilgan o'quvchi har qanday murakkab iyeroglifni oson tushunadi."
        },
        {
            "id": "ja-n5-u5-l5-ex-10",
            "type": "multiple-choice",
            "prompt": "Tinglab tushunishda (Choukai) baland natijaga erishish uchun boshlang'ich bosqichda nimaga e'tibor qaratish kerak?",
            "options": [
                "Har bir so'zma-so'z tarjimaga emas, umumiy suhbat konteksti, kim kimga gapirayotgani va xulosaviy qarorga",
                "Faqat birinchi so'zni eshitib, qolganini tinglamaslik",
                "Audioni to'xtatib qo'yish",
                "Faqatgina orqa fondagi musiqani tinglash"
            ],
            "correctAnswer": 0,
            "explanation": "Choukaida spikerlar munosabati va oxirida nima qilishga kelishilgani kalit sanaladi."
        },
        {
            "id": "ja-n5-u5-l5-ex-11",
            "type": "multiple-choice",
            "prompt": "JLPT N4 darajasiga o'tganda sizni qanday yangi asosiy grammatik mavzular kutmoqda?",
            "options": [
                "Potensial (qila olmoq), Majhul (受身), Orttirma (使役), Shart shakllari (〜たら, 〜ば, 〜なら) va nisbiy ergash gaplar",
                "Faqat salomlashish",
                "Faqat sonlar",
                "Hech qanday yangi mavzu yo'q"
            ],
            "correctAnswer": 0,
            "explanation": "N4 — bu fe'llarning barcha zamon va mayl shakllarini (potensial, shart, majhul) to'liq o'zlashtirish bosqichidir."
        },
        {
            "id": "ja-n5-u5-l5-ex-12",
            "type": "multiple-choice",
            "prompt": "«どうぞ お入り[はいり]ください» iborasining ma'nosi:",
            "options": [
                "«Marhamat, ichkariga kiring»",
                "«Xayr, sog' bo'ling»",
                "«Bu yerda kuting»",
                "«Eshikni yoping»"
            ],
            "correctAnswer": 0,
            "explanation": "どうぞ お入りください = Marhamat, kiring."
        },
        {
            "id": "ja-n5-u5-l5-ex-13",
            "type": "multiple-choice",
            "prompt": "«ごちそうさまでした» iborasi qachon aytiladi?",
            "options": [
                "Ovqatlanib bo'lgandan keyin, taom tayyorlagan mehmondo'st insonga minnatdorchilik bildirishda",
                "Ovqatlanishdan oldin",
                "Uyqudan uyg'onganda",
                "Ko'chada uchrashganda"
            ],
            "correctAnswer": 0,
            "explanation": "Ovqatdan oldin: いただきます; ovqatdan keyin: ごちそうさまでした."
        },
        {
            "id": "ja-n5-u5-l5-ex-14",
            "type": "multiple-choice",
            "prompt": "«お疲れ様[つかれさま]でした» iborasi qachon ishlatiladi?",
            "options": [
                "Ish kuni yoki dars yakunlanganda hamkasblar va do'stlarga zahmatlari uchun tashakkur bildirishda",
                "Ertalab uyg'onganda",
                "Ovqatlanish paytida",
                "Kasal bo'lganda"
            ],
            "correctAnswer": 0,
            "explanation": "Otsukaresama deshita — mehnat va darsdan so'ng bir-birini qo'llab-quvvatlash iborasi."
        },
        {
            "id": "ja-n5-u5-l5-ex-15",
            "type": "multiple-choice",
            "prompt": "O'quvchini N5 poydevorini muvaffaqiyatli yakunlagani bilan qutlash va N4 sari intilishga undash iborasi:",
            "options": [
                "「N5合格おめでとうございます！基礎がしっかり身につきました。次のN4に向かって頑張りましょう！」",
                "「勉強をやめましょう」",
                "「日本語はもう終わりです」",
                "「さようなら」"
            ],
            "correctAnswer": 0,
            "explanation": "Mustahkam poydevor qo'yildi, endi keyingi qadam — N4 darajasini zabt etish!"
        }
    ]
}
