# -*- coding: utf-8 -*-
"""
JLPT N4 Unit 2: Nai-Form, Experiences, Comparisons, Rules & Notices
Lessons 6-10 (15 authentic exercises per lesson = 75 exercises total)
"""

UNIT2_EXERCISES = {
    # ----------------------------------------------------
    # Lesson 6: Nai-Form (ない形) & Negative Requests: 〜ないでください
    # ----------------------------------------------------
    "ja-n4-u2-l1": [
        {
            "id": "ja-n4-u2-l1-ex-1",
            "type": "multiple-choice",
            "prompt": "「書[か]きます (yozmoq, 1-guruh)」fe'lining ない-shakli qaysi?",
            "options": ["書[か]かない", "書[か]きない", "書[か]くない", "書[か]しない"],
            "correctAnswer": 0,
            "explanation": "1-guruh fe'llarida 'i' tovushi 'a' tovushiga o'zgaradi va ない qo'shiladi: 書きます -> 書かない."
        },
        {
            "id": "ja-n4-u2-l1-ex-2",
            "type": "multiple-choice",
            "prompt": "DIQQAT: 「買[か]います (sotib olmoq, 1-guruh)」fe'lining to'g'ri ない-shakli qaysi?",
            "options": ["買[か]わない", "買[か]あない", "買[か]きない", "買[か]えない"],
            "correctAnswer": 0,
            "explanation": "い bilan tugaydigan 1-guruh fe'llari 'a' emas, 'wa' ga aylanadi: 買います -> 買わない (Kawanai)."
        },
        {
            "id": "ja-n4-u2-l1-ex-3",
            "type": "multiple-choice",
            "prompt": "3-guruh «kelmoq» 「来[き]ます」fe'lining to'g'ri ない-shakli qaysi?",
            "options": ["来[こ]ない", "来[き]ない", "来[く]ない", "来[か]ない"],
            "correctAnswer": 0,
            "explanation": "Tartibsiz fe'l: 来ます ning o'qilishi ない-shaklida こない (Konai) bo'lib o'zgaradi."
        },
        {
            "id": "ja-n4-u2-l1-ex-4",
            "type": "multiple-choice",
            "prompt": "«Xavotir olmang, iltimos» ifodasi yapon tilida qaysi?",
            "options": [
                "心配[しんぱい]しないで ください",
                "心配[しんぱい]しなくて ください",
                "心配[しんぱい]しない ください",
                "心配[しんぱい]するないで ください"
            ],
            "correctAnswer": 0,
            "explanation": "心配します (3-guruh) -> 心配しない + でください = 心配しないでください."
        },
        {
            "id": "ja-n4-u2-l1-ex-5",
            "type": "multiple-choice",
            "prompt": "«Ertaga darsga kechikmang» jumlasi qaysi?",
            "options": [
                "明日[あした] 授業[じゅぎょう]に 遅[おく]れないで ください",
                "明日[あした] 授業[じゅぎょう]に 遅[おく]らなくて ください",
                "明日[あした] 授業[じゅぎょう]に 遅[おく]れない ください",
                "明日[あした] 授業[じゅぎょう]に 遅[おく]れなく ください"
            ],
            "correctAnswer": 0,
            "explanation": "遅れます (2-guruh) -> 遅れない + でください = 遅れないでください."
        },
        {
            "id": "ja-n4-u2-l1-ex-6",
            "type": "multiple-choice",
            "prompt": "Biror harakatni bajarmasdan ikkinchisini qilish (〜ないで): «Nonushta qilmasdan maktabga ketdim»:",
            "options": [
                "朝[あさ]ごはんを 食[た]べないで、学校[がっこう]へ 行[い]きました",
                "朝[あさ]ごはんを 食[た]べなくて、学校[がっこう]へ 行[い]きました",
                "朝[あさ]ごはんを 食[た]べない、学校[がっこう]へ 行[い]きました",
                "朝[あさ]ごはんを 食[た]べなく、学校[がっこう]へ 行[い]きました"
            ],
            "correctAnswer": 0,
            "explanation": "Biror ishni qilmagan holatda harakatlanish: fe'lning ない-shakli + で (食べないで)."
        },
        {
            "id": "ja-n4-u2-l1-ex-7",
            "type": "multiple-choice",
            "prompt": "«Parolni hech kimga aytmang» qaysi javobda to'g'ri?",
            "options": [
                "パスワードを だれにも 言[い]わないで ください",
                "パスワードを だれにも 言[い]わなくて ください",
                "パスワードを だれにも 話[はな]さない ください",
                "パスワードを だれも 言[い]わないで ください"
            ],
            "correctAnswer": 0,
            "explanation": "言います -> 言わないでください. Hech kimga: だれにも."
        },
        {
            "id": "ja-n4-u2-l1-ex-8",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「危[あぶ]ないですから、　＿＿　＿＿　★　＿＿　ください。」",
            "options": ["1: 機械[きかい]に", "2: その", "3: 触[さわ]らないで", "4: 手[て]で"],
            "correctAnswer": 2,
            "explanation": "To'g'ri tartib: 「その (2) 機械に (1) 手で (4) 触らないで (3★) ください。」 Yulduzcha 3-o'rindagi 触らないで ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u2-l1-ex-9",
            "type": "multiple-choice",
            "prompt": "«Lug'atdan foydalanmasdan yaponcha kitob o'qidim» jumlasi qaysi?",
            "options": [
                "辞書[じしょ]を 使[つか]わないで 日本語[にほんご]の 本[ほん]を 読[よ]みました",
                "辞書[じしょ]を 使[つか]わなくて 日本語[にほんご]の 本[ほん]を 読[よ]みました",
                "辞書[じしょ]を 使[つか]わない 日本語[にほんご]の 本[ほん]を 読[よ]みました",
                "辞書[じしょ]を 使[つか]いなくて 日本語[にほんご]の 本[ほん]を 読[よ]みました"
            ],
            "correctAnswer": 0,
            "explanation": "使います -> 使わないで (foydalanmasdan)."
        },
        {
            "id": "ja-n4-u2-l1-ex-10",
            "type": "multiple-choice",
            "prompt": "«Soyabon olmasdan tashqariga chiqdim, yomg'irda qoldim» ifodasidagi fe'l shakli qaysi?",
            "options": [
                "傘[かさ]を 持[も]たないで 出[で]かけました",
                "傘[かさ]を 持[も]ちないで 出[で]かけました",
                "傘[かさ]を 持[も]たなくて 出[で]かけました",
                "傘[かさ]を 持[も]つないで 出[で]かけました"
            ],
            "correctAnswer": 0,
            "explanation": "持ちます (1-guruh) -> 持たないで (olmasdan)."
        },
        {
            "id": "ja-n4-u2-l1-ex-11",
            "type": "multiple-choice",
            "prompt": "«Iltimos, bu yerga axlat tashlamang» qanday aytiladi?",
            "options": [
                "ここに ごみを 捨[す]てないで ください",
                "ここに ごみを 捨[す]てなくて ください",
                "ここに ごみを 捨[す]てない ください",
                "ここに ごみを 捨[す]つないで ください"
            ],
            "correctAnswer": 0,
            "explanation": "捨てます (2-guruh) -> 捨てないでください."
        },
        {
            "id": "ja-n4-u2-l1-ex-12",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos shaklni tanlang:\n「無理[むり]を （　　）で、休[やす]んで ください。」",
            "options": ["しない", "しなくて", "するない", "し"],
            "correctAnswer": 0,
            "explanation": "無理をしないでください (O'zingizni zo'riqtirmang, dam oling). します -> しない + で."
        },
        {
            "id": "ja-n4-u2-l1-ex-13",
            "type": "multiple-choice",
            "prompt": "«Kechqurun qahva ichmasdan uxladim» jumlasi qaysi?",
            "options": [
                "夜[よる] コーヒーを 飲[の]まないで 寝[ね]ました",
                "夜[よる] コーヒーを 飲[の]まなくて 寝[ね]ました",
                "夜[よる] コーヒーを 飲[の]みないで 寝[ね]ました",
                "夜[よる] コーヒーを 飲[の]むないで 寝[ね]ました"
            ],
            "correctAnswer": 0,
            "explanation": "飲みます -> 飲まないで寝ました."
        },
        {
            "id": "ja-n4-u2-l1-ex-14",
            "type": "multiple-choice",
            "prompt": "«Bosh kiyimingizni yechmang» iltimosi qaysi?",
            "options": [
                "帽子[ぼうし]を 脱[ぬ]がないで ください",
                "帽子[ぼうし]を 脱[ぬ]ぎないで ください",
                "帽子[ぼうし]を 脱[ぬ]がなくて ください",
                "帽子[ぼうし]を 脱[ぬ]ぐないで ください"
            ],
            "correctAnswer": 0,
            "explanation": "脱ぎます (1-guruh) -> 脱がないでください."
        },
        {
            "id": "ja-n4-u2-l1-ex-15",
            "type": "multiple-choice",
            "prompt": "Quyidagi dialogda qaysi so'z tushib qolgan?\nA: 「パスポートを （　　）で くださいね。」\nB: 「はい、大切[たいせつ]に 保管[ほかん]します。」",
            "options": ["なくさない", "なくさなくて", "なくしない", "なくすない"],
            "correctAnswer": 0,
            "explanation": "なくします (yo'qotmoq, 1-guruh) -> なくさないでください (yo'qotib qo'ymang)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 7: Experience: 〜たことがある (Have done before)
    # ----------------------------------------------------
    "ja-n4-u2-l2": [
        {
            "id": "ja-n4-u2-l2-ex-1",
            "type": "multiple-choice",
            "prompt": "«Men Yaponiyaga borganman (tajribam bor)» qaysi javobda to'g'ri?",
            "options": [
                "日本[にほん]へ 行[い]った ことが あります",
                "日本[にほん]へ 行[い]く ことが あります",
                "日本[にほん]へ 行[い]って ことが あります",
                "日本[にほん]へ 行[い]きました ことが あります"
            ],
            "correctAnswer": 0,
            "explanation": "Tajriba ifodasi: fe'lning o'tgan zamon oddiy shakli (た-form) + ことがある: 行ったことがある."
        },
        {
            "id": "ja-n4-u2-l2-ex-2",
            "type": "multiple-choice",
            "prompt": "«Men hali biror marta ham sushi yemaganman» jumlasi qaysi?",
            "options": [
                "一度[いちど]も すしを 食[た]べた ことが ありません",
                "一度[いちど]も すしを 食[た]べない ことが あります",
                "一度[いちど]も すしを 食[た]べる ことが ありません",
                "一度[いちど]も すしを 食[た]べました ことが ありません"
            ],
            "correctAnswer": 0,
            "explanation": "Biror marta ham qilmaganlik: 一度も + たことがありません (一度も食べたことがありません)."
        },
        {
            "id": "ja-n4-u2-l2-ex-3",
            "type": "multiple-choice",
            "prompt": "Oddiy o'tgan zamon (きのう食べた) va tajriba (食べたことがある) o'rtasidagi asosiy farq nima?",
            "options": [
                "Oddiy o'tgan zamon aniq o'tgan paytda sodir bo'lgan voqeani; 〜たことがある esa umr davomidagi tajribani bildiradi",
                "〜たことがある faqat kelasi zamonda ishlatiladi",
                "Oddiy o'tgan zamon faqat savollarda ishlatiladi",
                "Hech qanday farqi yo'q"
            ],
            "correctAnswer": 0,
            "explanation": "Aniq vaqt ko'rsatilganda (masalan, «Kecha soat 8 da») 〜たことがある ishlatilmaydi; u umumiy hayotiy tajriba («Umringizda borganmisiz?») uchun xosdir."
        },
        {
            "id": "ja-n4-u2-l2-ex-4",
            "type": "multiple-choice",
            "prompt": "«Fudzi tog'iga chiqqanmisiz?» savoli qanday beriladi?",
            "options": [
                "富士山[ふじさん]に 登[のぼ]った ことが ありますか",
                "富士山[ふじさん]に 登[のぼ]る ことが ありますか",
                "富士山[ふじさん]に 登[のぼ]って ことが ありますか",
                "富士山[ふじさん]に 登[のぼ]り ことが ありますか"
            ],
            "correctAnswer": 0,
            "explanation": "登ります (1-guruh) -> 登った (chiqqan) + ことがありますか."
        },
        {
            "id": "ja-n4-u2-l2-ex-5",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos shaklni tanlang:\n「歌舞伎[かぶき]を （　　） ことが ありますか。」",
            "options": ["見[み]た", "見[み]る", "見[み]て", "見[み]ます"],
            "correctAnswer": 0,
            "explanation": "Kabuki an'anaviy teatrini ko'rgan tajriba: 見た ことがありますか."
        },
        {
            "id": "ja-n4-u2-l2-ex-6",
            "type": "multiple-choice",
            "prompt": "«Ha, bir necha bor borganman» javobi qaysi?",
            "options": [
                "はい、何度[なんど]も 行[い]った ことが あります",
                "はい、一度[いちど]も 行[い]った ことが あります",
                "はい、決[けっ]して 行[い]った ことが あります",
                "はい、ぜんぜん 行[い]った ことが あります"
            ],
            "correctAnswer": 0,
            "explanation": "Bir necha bor, ko'p marta: 何度も (Nandomo)."
        },
        {
            "id": "ja-n4-u2-l2-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「彼[かれ]とは　＿＿　＿＿　★　＿＿　ありません。」",
            "options": ["1: 会[あ]った", "2: ことが", "3: 一度[いちど]も", "4: 直接[ちょくせつ]"],
            "correctAnswer": 1,
            "explanation": "To'g'ri tartib: 「一度も (3) 直接 (4) 会った (1★) ことが (2) ありません。」 Yulduzcha 1-o'rindagi 会った ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u2-l2-ex-8",
            "type": "multiple-choice",
            "prompt": "«Otga minib ko'rgan tajribangiz bormi?» qaysi zarracha bilan yasaladi?\n「馬[うま]（　　） 乗[の]った ことが ありますか。」",
            "options": ["に", "を", "で", "へ"],
            "correctAnswer": 0,
            "explanation": "Otga, transport vositasiga minishda har doim に zarrachasi ishlatiladi: 馬に乗ったことがありますか."
        },
        {
            "id": "ja-n4-u2-l2-ex-9",
            "type": "multiple-choice",
            "prompt": "«Yapon choy marosimi (Sadou) da qatnashganman» jumlasi qaysi?",
            "options": [
                "茶道[さどう]を 体験[たいけん]した ことが あります",
                "茶道[さどう]を 体験[たいけん]する ことが あります",
                "茶道[さどう]を 体験[たいけん]して ことが あります",
                "茶道[さどう]を 体験[たいけん]しない ことが あります"
            ],
            "correctAnswer": 0,
            "explanation": "体験します -> 体験した + ことがあります."
        },
        {
            "id": "ja-n4-u2-l2-ex-10",
            "type": "multiple-choice",
            "prompt": "«Qor ko'rganmisiz?» savoliga «Yo'q, hali ko'rmaganman» javobi qaysi?",
            "options": [
                "いいえ、まだ 見[み]た ことが ありません",
                "いいえ、もう 見[み]た ことが あります",
                "いいえ、ぜひ 見[み]た ことが あります",
                "いいえ、きっと 見[み]た ことが ありません"
            ],
            "correctAnswer": 0,
            "explanation": "Hali ko'rmaganlik: まだ〜たことがありません."
        },
        {
            "id": "ja-n4-u2-l2-ex-11",
            "type": "multiple-choice",
            "prompt": "Quyidagi jumla nega xato?\n「きのう 7時[じ]に 晩[ばん]ごはんを 食[た]べた ことが あります。」",
            "options": [
                "Chunki aniq bir o'tgan payt (kecha soat 7 da) ko'rsatilganda tajriba emas, oddiy o'tgan zamon (食べました) ishlatilishi kerak",
                "Chunki 晩ごはん oldidan zarracha noto'g'ri",
                "Chunki 食べた fe'lining o'rniga 飲む bo'lishi kerak",
                "Xato emas, mutlaqo to'g'ri"
            ],
            "correctAnswer": 0,
            "explanation": "O'tgan aniq vaqtda sodir bo'lgan voqea tajriba hisoblanmaydi: 「きのう7時に晩ごはんを食べました」 deb aytilishi shart."
        },
        {
            "id": "ja-n4-u2-l2-ex-12",
            "type": "multiple-choice",
            "prompt": "«Kimono kiyib ko'rganmisiz?» savoli qaysi?",
            "options": [
                "着物[きもの]を 着[き]た ことが ありますか",
                "着物[きもの]を はいた ことが ありますか",
                "着物[きもの]を かぶった ことが ありますか",
                "着物[きもの]を ぬいた ことが ありますか"
            ],
            "correctAnswer": 0,
            "explanation": "Yelka va tana kiyimlarini kiyish: 着ます (kimasu) -> 着た (kita)."
        },
        {
            "id": "ja-n4-u2-l2-ex-13",
            "type": "multiple-choice",
            "prompt": "«Men ilgari yapon restoranida ishlab ko'rganman» jumlasi qaysi?",
            "options": [
                "前[まえ]に 日本料理店[にほんりょうりてん]で 働[はたら]いた ことが あります",
                "前に 日本料理店で 働く ことが あります",
                "前に 日本料理店で 働いて ことが あります",
                "前に 日本料理店で 働き ことが あります"
            ],
            "correctAnswer": 0,
            "explanation": "働きまし -> 働いた + ことがあります."
        },
        {
            "id": "ja-n4-u2-l2-ex-14",
            "type": "multiple-choice",
            "prompt": "«Shunday mazali taomni ilgari hech yemaganman» ifodasi qaysi?",
            "options": [
                "こんなに おいしい 料理[りょうり]は 今[いま]まで 食[た]べた ことが ありません",
                "こんなに おいしい 料理は 今まで 食べる ことが ありません",
                "こんなに おいしい 料理は 今まで 食べて ことが ありません",
                "こんなに おいしい 料理は 今まで 食べたい ことが ありません"
            ],
            "correctAnswer": 0,
            "explanation": "Shu paytgacha hech: 今まで食べたことがありません."
        },
        {
            "id": "ja-n4-u2-l2-ex-15",
            "type": "multiple-choice",
            "prompt": "Quyidagi dialogda B nima deb javob beradi?\nA: 「納豆[なっとう]を 食[た]べた ことが ありますか。」\nB: 「ええ、一度[いちど] （　　）。でも、においが 苦[にが]手[て]です。」",
            "options": [
                "あります",
                "ありません",
                "いました",
                "します"
            ],
            "correctAnswer": 0,
            "explanation": "Ha, bir marta tajribam bor: ええ、一度あります."
        }
    ],

    # ----------------------------------------------------
    # Lesson 8: Comparison: 〜のほうが〜より & 〜の中で〜が一番
    # ----------------------------------------------------
    "ja-n4-u2-l3": [
        {
            "id": "ja-n4-u2-l3-ex-1",
            "type": "multiple-choice",
            "prompt": "«Poyezd avtobusdan tezroq» jumlasi qaysi?",
            "options": [
                "電車[でんしゃ]の ほうが バスより 速[はや]いです",
                "バスの ほうが 電車より 速いです",
                "電車は バスより 速くないです",
                "電車より バスの ほうが 速いです"
            ],
            "correctAnswer": 0,
            "explanation": "A ning ustunligini ko'rsatish: A の ほうが B より [sifat] です."
        },
        {
            "id": "ja-n4-u2-l3-ex-2",
            "type": "multiple-choice",
            "prompt": "«Olma va apelsin, qaysi biri ko'proq yoqadi?» taqqoslash savoli qanday tuziladi?",
            "options": [
                "りんごと みかんと どちらが 好[す]きですか",
                "りんごと みかんと どれが 好きですか",
                "りんごと みかんと だれが 好きですか",
                "りんごと みかんと 何が 好きですか"
            ],
            "correctAnswer": 0,
            "explanation": "Ikki narsa o'rtasida tanlashda doimo 「どちら」 (dochira) ishlatiladi: AとBとどちらが..."
        },
        {
            "id": "ja-n4-u2-l3-ex-3",
            "type": "multiple-choice",
            "prompt": "«Fasllar ichida qaysi biri eng yoqimli?» (3 yoki undan ortiq variant orasida):",
            "options": [
                "季節[きせつ]の 中[なか]で どれが 一番[いちばん] 好[す]きですか",
                "季節の中で どちらが 一番 好きですか",
                "季節の ほうが 一番 好きですか",
                "季節より 一番 好きですか"
            ],
            "correctAnswer": 0,
            "explanation": "3 yoki undan ortiq narsalar to'plamida tanlash: 〜の中で どれ / 何 / いつ / だれ が 一番..."
        },
        {
            "id": "ja-n4-u2-l3-ex-4",
            "type": "multiple-choice",
            "prompt": "Inkor taqqoslash: «Yapon tili siz o'ylagandek unchalik qiyin emas» (~ほど〜ない):",
            "options": [
                "日本語[にほんご]は 思[おも]った ほど 難[むずか]しくないです",
                "日本語は 思った より 難しくないです",
                "日本語は 思った ほうが 難しくないです",
                "日本語は 思った 一番 難しくないです"
            ],
            "correctAnswer": 0,
            "explanation": "〜ほど [inkor sifat]: ...chalik emas (思[おも]ったほど難しくない)."
        },
        {
            "id": "ja-n4-u2-l3-ex-5",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos zarrachani tanlang:\n「家族[かぞく]の 中[なか]（　　） 父[ちち]が 一番[いちばん] 背[せ]が 高[たか]いです。」",
            "options": ["で", "に", "を", "から"],
            "correctAnswer": 0,
            "explanation": "Guruh doirasini chegaralashda で zarrachasi ishlatiladi: 家族の中で (Oila ichida)."
        },
        {
            "id": "ja-n4-u2-l3-ex-6",
            "type": "multiple-choice",
            "prompt": "«Shahar markazida yashash qishloqqa qaraganda qulayroq» jumlasi qaysi?",
            "options": [
                "都会[とかい]の ほうが 田舎[いなか]より 便利[べんり]です",
                "都会より 田舎の ほうが 便利です",
                "都会は 田舎ほど 便利です",
                "都会と 田舎は どちらも 不便です"
            ],
            "correctAnswer": 0,
            "explanation": "A ning qulayligi: 都会のほうが 田舎より 便利です."
        },
        {
            "id": "ja-n4-u2-l3-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「世界[せかい]の　＿＿　＿＿　★　＿＿　高[たか]いですか。」",
            "options": ["1: 山[やま]が", "2: 一番[いちばん]", "3: 中[なか]で", "4: どの"],
            "correctAnswer": 3,
            "explanation": "To'g'ri tartib: 「世界の中で (3) どの (4) 山が (1) 一番 (2★) 高いですか。」 Yulduzcha 2-variantga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u2-l3-ex-8",
            "type": "multiple-choice",
            "prompt": "«Ikkalasi ham yoqadi» javobi qanday aytiladi?",
            "options": [
                "どちらも 好[す]きです",
                "どれも 好きです",
                "どちらが 好きです",
                "どちらの ほうが 好きです"
            ],
            "correctAnswer": 0,
            "explanation": "Ikki narsaning ikkalasi ham: どちらも好きです."
        },
        {
            "id": "ja-n4-u2-l3-ex-9",
            "type": "multiple-choice",
            "prompt": "«Bu do'kon anavisiga qaraganda ancha arzon» ifodasidagi «ancha / ancha ko'p» so'zi qaysi?",
            "options": [
                "ずっと",
                "もっと",
                "すこし",
                "あまり"
            ],
            "correctAnswer": 0,
            "explanation": "Taqqoslashda farq juda katta ekanligini ta'kidlash: ずっと (Zutto) - masalan, ずっと安いです."
        },
        {
            "id": "ja-n4-u2-l3-ex-10",
            "type": "multiple-choice",
            "prompt": "«Qish yozchalik issiq emas» (~ほど〜ない) jumlasi qaysi?",
            "options": [
                "冬[ふゆ]は 夏[なつ]ほど 暑[あつ]くないです",
                "冬は 夏より 暑くないです",
                "冬の ほうが 夏より 暑いです",
                "冬は 夏ほど 暑いです"
            ],
            "correctAnswer": 0,
            "explanation": "AはBほど [inkor]: 冬は夏ほど暑くないです."
        },
        {
            "id": "ja-n4-u2-l3-ex-11",
            "type": "multiple-choice",
            "prompt": "«Sinfdagi talabalar orasida kim eng yosh?» so'rog'i qaysi?",
            "options": [
                "クラスの 中[なか]で だれが 一番[いちばん] 若[わか]いですか",
                "クラスの中で どれが 一番 若いですか",
                "クラスの ほうが だれより 若いですか",
                "クラスより だれが 一番 若いですか"
            ],
            "correctAnswer": 0,
            "explanation": "Odamlar haqida so'ralganda: だれが一番... (誰が一番若いです)."
        },
        {
            "id": "ja-n4-u2-l3-ex-12",
            "type": "multiple-choice",
            "prompt": "«Ikkalasi ham yoqmaydi / ma'qul emas» (ikkalasini inkor qilish):",
            "options": [
                "どちらも 好[す]きでは ありません",
                "どちらが 好きでは ありません",
                "どれも 好きでは ありません",
                "どちらの ほうが 嫌[きら]いです"
            ],
            "correctAnswer": 0,
            "explanation": "Ikkala narsani ham inkor etish: どちらも + inkor (どちらも好きではありません)."
        },
        {
            "id": "ja-n4-u2-l3-ex-13",
            "type": "multiple-choice",
            "prompt": "«Bugun kechagiga qaraganda biroz sovuqroq» ifodasidagi «biroz» so'zi qaysi?",
            "options": [
                "少[すこ]し",
                "ずっと",
                "ぜんぜん",
                "たくさん"
            ],
            "correctAnswer": 0,
            "explanation": "Biroz ustunlik: 少し (Sukoshi): きのうより少し寒いです."
        },
        {
            "id": "ja-n4-u2-l3-ex-14",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos so'zni tanlang:\n「1年[いちねん]の 中[なか]で （　　）が 一番[いちばん] 暑[あつ]いですか。」\n「8月[はちがつ]です。」",
            "options": ["いつ", "どこ", "だれ", "どちら"],
            "correctAnswer": 0,
            "explanation": "Vaqt (qaysi oy/qachon) haqida so'ralganligi uchun: いつ (Qachon)."
        },
        {
            "id": "ja-n4-u2-l3-ex-15",
            "type": "multiple-choice",
            "prompt": "«Samolyot tezyurar poyezddan tezroq, ammo poyezd qulayroq» mantiqiy jumlasi qaysi?",
            "options": [
                "飛行機[ひこうき]の ほうが 新幹線[しんかんせん]より 速[はや]いですが、新幹線[しんかんせん]の ほうが 快適[かいてき]です",
                "飛行機より 新幹線の ほうが 速いですが、飛行機が 快適です",
                "飛行機は 新幹線ほど 速くないです",
                "飛行機も 新幹線も どちらも 遅いです"
            ],
            "correctAnswer": 0,
            "explanation": "To'g'ri taqqoslash va bog'lovchi: 飛行機のほうが新幹線より速いですが、新幹線のほうが快適です."
        }
    ],

    # ----------------------------------------------------
    # Lesson 9: Obligation (〜なければならない) & Non-obligation (〜なくてもいい)
    # ----------------------------------------------------
    "ja-n4-u2-l4": [
        {
            "id": "ja-n4-u2-l4-ex-1",
            "type": "multiple-choice",
            "prompt": "«Dori ichishim shart (majburman)» qaysi javobda to'g'ri?",
            "options": [
                "薬[くすり]を 飲[の]まなければ なりません",
                "薬[くすり]を 飲[の]まなくても いいです",
                "薬[くすり]を 飲[の]んでは いけません",
                "薬[くすり]を 飲[の]みたいです"
            ],
            "correctAnswer": 0,
            "explanation": "Qat'iy majburiyat: fe'lning ない-shaklidagi い o'rniga ければなりません qo'shiladi: 飲まなければなりません."
        },
        {
            "id": "ja-n4-u2-l4-ex-2",
            "type": "multiple-choice",
            "prompt": "«Ertaga kelishingiz shart emas (ixtiyoriy)» qanday aytiladi?",
            "options": [
                "明日[あした] 来[こ]なくても いいです",
                "明日[あした] 来[こ]ないで ください",
                "明日[あした] 来[こ]なければ なりません",
                "明日[あした] 来[こ]ては いけません"
            ],
            "correctAnswer": 0,
            "explanation": "Majburiyat yo'qligi (qilmasa ham bo'ladi): fe'lning ない-shaklidagi い o'rniga くてもいいです: 来なくてもいいです."
        },
        {
            "id": "ja-n4-u2-l4-ex-3",
            "type": "multiple-choice",
            "prompt": "«Har kuni 8 soat ishlashim kerak» jumlasi qaysi?",
            "options": [
                "毎日[まいにち] 8時間[はちじかん] 働[はたら]かなければ なりません",
                "毎日 8時間 働かなくても いいです",
                "毎日 8時間 働いては いけません",
                "毎日 8時間 働きたいです"
            ],
            "correctAnswer": 0,
            "explanation": "働きます (1-guruh) -> 働かない -> 働かなければなりません."
        },
        {
            "id": "ja-n4-u2-l4-ex-4",
            "type": "multiple-choice",
            "prompt": "So'zlashuv tilida (casual speech) 〜なければならない qanday qisqaradi?",
            "options": [
                "〜なきゃ / 〜なくちゃ",
                "〜ないと",
                "〜なきゃ / 〜なくちゃ hamda 〜ないと ikkalasi ham keng qo'llanadi",
                "Faqat 〜ねばならない"
            ],
            "correctAnswer": 2,
            "explanation": "Og'zaki norasmiy nutqda: 行かなきゃ (borishim kerak), 勉強しなくちゃ (o'qishim shart), 早く帰らないと (tezroq qaytmasam bo'lmaydi)."
        },
        {
            "id": "ja-n4-u2-l4-ex-5",
            "type": "multiple-choice",
            "prompt": "«Kutubxona kitobini juma kunigacha qaytarishim shart» jumlasi qaysi?",
            "options": [
                "金曜日[きんようび]までに 本[ほん]を 返[かえ]さなければ なりません",
                "金曜日まで 本を 返さなくても いいです",
                "金曜日から 本を 返しては いけません",
                "金曜日に 本を 返したいです"
            ],
            "correctAnswer": 0,
            "explanation": "Muddat cheklovi (muayyan vaqtgacha bajarish): までに + 返さなければなりません."
        },
        {
            "id": "ja-n4-u2-l4-ex-6",
            "type": "multiple-choice",
            "prompt": "«Ertaga dam olish kuni, shuning uchun erta turishim shart emas» qanday tuziladi?",
            "options": [
                "明日[あした]は 休[やす]みだから、早[はや]く 起[お]きなくても いいです",
                "明日は 休みだから、早く 起きなければ なりません",
                "明日は 休みだから、早く 起きては いけません",
                "明日は 休みだから、早く 起きないで ください"
            ],
            "correctAnswer": 0,
            "explanation": "Harakat qilish majburiyati yo'q: 起きなくてもいいです."
        },
        {
            "id": "ja-n4-u2-l4-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「レポートは　＿＿　＿＿　★　＿＿　いけませんか。」",
            "options": ["1: 出[だ]さなければ", "2: 明日[あした]までに", "3: 必[かなら]ず", "4: パソコンで"],
            "correctAnswer": 0,
            "explanation": "To'g'ri tartib: 「レポートは 明日までに (2) パソコンで (4) 出さなければ (1★) / 必ず (3) 出さなければ (1★) いけませんか。」 Yulduzcha 1-variantga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u2-l4-ex-8",
            "type": "multiple-choice",
            "prompt": "«Pasportingizni doimo yoningizda olib yurishingiz lozim» jumlasi qaysi?",
            "options": [
                "パスポートを いつも 持[も]って いなければ なりません",
                "パスポートを いつも 持たなくても いいです",
                "パスポートを いつも 持っては いけません",
                "パスポートを いつも 持たないで ください"
            ],
            "correctAnswer": 0,
            "explanation": "Turg'un saqlash majburiyati: 持っていなければなりません."
        },
        {
            "id": "ja-n4-u2-l4-ex-9",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos shaklni tanlang:\n「靴[くつ]を （　　）なくても いいですか。」\n「はい、靴の ままで 入[はい]って ください。」",
            "options": ["脱[ぬ]が", "脱[ぬ]ぎ", "脱[ぬ]い", "脱[ぬ]ぐ"],
            "correctAnswer": 0,
            "explanation": "脱ぎます -> 脱がない -> 脱がなくてもいい (yechmasam ham bo'ladimi?)."
        },
        {
            "id": "ja-n4-u2-l4-ex-10",
            "type": "multiple-choice",
            "prompt": "«Imtihonga tayyorlanishim kerak (boshqa ilojim yo'q)» formulasi:",
            "options": [
                "勉強[べんきょう]しなければ ならない",
                "勉強しなくても よい",
                "勉強しては だめだ",
                "勉強したいと 思う"
            ],
            "correctAnswer": 0,
            "explanation": "Majburiyatning oddiy uslubi: 勉強しなければならない."
        },
        {
            "id": "ja-n4-u2-l4-ex-11",
            "type": "multiple-choice",
            "prompt": "Quyidagi dialogda qaysi javob to'g'ri?\nA: 「お金[かね]を 払[はら]わなければ なりませんか。」\nB: 「いいえ、入場料[にゅうじょうりょう]は 無料[むりょう]ですから、（　　）。」",
            "options": [
                "払[はら]わなくても いいです",
                "払わなければ なりません",
                "払っては いけません",
                "払って ください"
            ],
            "correctAnswer": 0,
            "explanation": "Kirish bepul bo'lgani uchun: 払わなくてもいいです (to'lamasangiz ham bo'ladi)."
        },
        {
            "id": "ja-n4-u2-l4-ex-12",
            "type": "multiple-choice",
            "prompt": "To'g'ri zarrachani tanlang:\n「来週[らいしゅう]の 月曜日[げつようび]（　　） 宿題[しゅくだい]を 出[だ]してください。」",
            "options": ["までに", "まで", "から", "に"],
            "correctAnswer": 0,
            "explanation": "Topshirishning oxirgi muddati: までに (Dushanbagacha)."
        },
        {
            "id": "ja-n4-u2-l4-ex-13",
            "type": "multiple-choice",
            "prompt": "«Rasm chizishda qalamdan foydalanmasangiz ham bo'ladi» qaysi javobda to'g'ri?",
            "options": [
                "鉛筆[えんぴつ]を 使[つか]わなくても いいですよ",
                "鉛筆を使わなければ なりませんよ",
                "鉛筆を使っては いけませんよ",
                "鉛筆を使わないで ください"
            ],
            "correctAnswer": 0,
            "explanation": "Ixtiyoriylik: 使わなくてもいいですよ."
        },
        {
            "id": "ja-n4-u2-l4-ex-14",
            "type": "multiple-choice",
            "prompt": "«Kech bo'ldi, endi uyga ketishim shart» norasmiy (so'zlashuv) ifodasi qaysi?",
            "options": [
                "もう 遅[おそ]いから、帰[かえ]らなきゃ！",
                "もう 遅いから、帰っても いいよ！",
                "もう 遅いから、帰っちゃ だめ！",
                "もう 遅いから、帰るつもり！"
            ],
            "correctAnswer": 0,
            "explanation": "Og'zaki majburiyat: 帰らなきゃ (帰らなければならない)."
        },
        {
            "id": "ja-n4-u2-l4-ex-15",
            "type": "multiple-choice",
            "prompt": "«Sog'lig'ingiz uchun har kuni sabzavot yeyishingiz lozim» jumlasi qaysi?",
            "options": [
                "健康[けんこう]の ために、毎日[まいにち] 野菜[やさい]を 食[た]べなければ なりません",
                "健康のために、毎日 野菜を食べなくても いいです",
                "健康のために、毎日 野菜を食べては いけません",
                "健康のために、毎日 野菜を食べないで ください"
            ],
            "correctAnswer": 0,
            "explanation": "Zarurat: 食べなければなりません."
        }
    ],

    # ----------------------------------------------------
    # Lesson 10: N4 Reading: Short Public Notices & Information Retrieval
    # ----------------------------------------------------
    "ja-n4-u2-l5": [
        {
            "id": "ja-n4-u2-l5-ex-1",
            "type": "multiple-choice",
            "prompt": "E'londagi quyidagi yozuv nima ma'noni bildiradi?\n【使用禁止[しようきんし]】",
            "options": [
                "Ishlatish taqiqlanadi (foydalanish mumkin emas)",
                "Iltimos, ehtiyotkorlik bilan ishlating",
                "Hozir ishlayapti",
                "Faqat xodimlar uchun bepul"
            ],
            "correctAnswer": 0,
            "explanation": "使用 (foydalanish) + 禁止 (taqiq) = Ishlatish mutlaqo man etiladi."
        },
        {
            "id": "ja-n4-u2-l5-ex-2",
            "type": "multiple-choice",
            "prompt": "Restoran eshigidagi 【準備中[じゅんびちゅう]】 yozuvi nimani anglatadi?",
            "options": [
                "Tayyorgarlik ko'rilmoqda (hozircha yopiq)",
                "Marhamat, ichkariga kiring",
                "Bugun butunlay dam olish kuni",
                "Barcha taomlar tugadi"
            ],
            "correctAnswer": 0,
            "explanation": "準備中 — muassasa ochilishga hozirlik ko'rmoqda, xaridorlar uchun hali yopiq."
        },
        {
            "id": "ja-n4-u2-l5-ex-3",
            "type": "multiple-choice",
            "prompt": "Chiptaxonadagi e'lonni o'qing:\n「大人[おとな]：800円[えん]、子供[こども]（小学生[しょうがくせい]以下[いか]）：400円」\nOta-ona va bitta 9 yoshli maktab o'quvchisi jami qancha to'laydi?",
            "options": ["2000円", "1600円", "2400円", "1200円"],
            "correctAnswer": 0,
            "explanation": "2 nafar kattalar: 800 * 2 = 1600円. 1 nafar bola (maktab o'quvchisi): 400円. Jami: 1600 + 400 = 2000円."
        },
        {
            "id": "ja-n4-u2-l5-ex-4",
            "type": "multiple-choice",
            "prompt": "Axlat tashlash jadvalidagi yozuv:\n「燃[も]える ごみ：火曜日[かようび]・金曜日[きんようび]」\nYonadigan (oshxona) axlatlarini qaysi kunlari chiqarish mumkin?",
            "options": [
                "Seshanba va Juma kunlari",
                "Dushanba va Payshanba kunlari",
                "Chorshanba va Shanba kunlari",
                "Faqat Yakshanba kuni"
            ],
            "correctAnswer": 0,
            "explanation": "火曜日 (Seshanba) va 金曜日 (Juma) kunlari."
        },
        {
            "id": "ja-n4-u2-l5-ex-5",
            "type": "multiple-choice",
            "prompt": "Kutubxonadagi bildirishnoma:\n「休館日[きゅうかんび]：毎週[まいしゅう] 月曜日[げつようび]（祝日[しゅくじつ]の 場合[ばあい]は 翌日[よくじつ]）」\n«翌日 (Yokujitsu)» so'zi nimani anglatadi?",
            "options": [
                "Ertasi kuni (keyingi kun)",
                "O'tgan kuni",
                "Bir haftadan keyin",
                "Shu kunning o'zida"
            ],
            "correctAnswer": 0,
            "explanation": "翌日 (よくじつ) — ertasiga, keyingi ish kuni deganidir."
        },
        {
            "id": "ja-n4-u2-l5-ex-6",
            "type": "multiple-choice",
            "prompt": "Eshikdagi belgi: 【関係者以外[かんけいしゃいがい] 立入禁止[たちいりきんし]】\nBu nimani bildiradi?",
            "options": [
                "Tegishli xodimlardan boshqalarning kirishi taqiqlanadi (Begonalar kirmasin)",
                "Xush kelibsiz, bemalol kiring",
                "Faqat bolalar kirishi mumkin",
                "Faqat chet ellik mehmonlar uchun"
            ],
            "correctAnswer": 0,
            "explanation": "関係者 (aloqador xodimlar) + 以外 (tashqari) + 立入禁止 (kirish man etiladi)."
        },
        {
            "id": "ja-n4-u2-l5-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「この　＿＿　＿＿　★　＿＿　ご遠慮[えんりょ]ください。」",
            "options": ["1: 通話[つうわ]は", "2: 車内[しゃない]での", "3: 携帯電話[けいたいでんわ]の", "4: 場所[ばしょ]での"],
            "correctAnswer": 0,
            "explanation": "To'g'ri tartib: 「車内での (2) 携帯電話の (3) 通話は (1★) ご遠慮ください。」 Yulduzcha 1-variantga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u2-l5-ex-8",
            "type": "multiple-choice",
            "prompt": "Klinika ish tartibi:\n「午前[ごぜん]：9:00〜12:30 / 午後[ごご]：14:30〜18:00（土曜[どよう]は 午前[ごぜん]のみ）」\nShanba kuni soat 15:00 da qabul bormi?",
            "options": [
                "Yo'q, shanba kuni faqat ertalab (午前のみ) ishlaydi",
                "Ha, soat 18:00 gacha ochiq",
                "Faqat favqulodda holatda ochiq",
                "Shanba butunlay dam olish kuni"
            ],
            "correctAnswer": 0,
            "explanation": "Shanba kuni faqat ertalab ishlaydi (土曜は午前のみ), demak soat 15:00 da qabul bo'lmaydi."
        },
        {
            "id": "ja-n4-u2-l5-ex-9",
            "type": "multiple-choice",
            "prompt": "Lift yonidagi ogohlantirish:\n「地震[じしん]・火災[かさい]の 時[とき]は エレベーターを 使[つか]わないで ください」\nNima qilish kerak?",
            "options": [
                "Zilzila yoki yong'in vaqtida liftdan foydalanmaslik kerak",
                "Zilzila vaqtida darhol liftga chiqish kerak",
                "Yong'in chiqsa liftni to'xtatmaslik kerak",
                "Har kuni liftni tekshirish kerak"
            ],
            "correctAnswer": 0,
            "explanation": "地震 (zilzila) yoki 火災 (yong'in) paytida zinalardan tushish talab etiladi, lift ishlatilmaydi."
        },
        {
            "id": "ja-n4-u2-l5-ex-10",
            "type": "multiple-choice",
            "prompt": "Do'kondagi chegirma e'loni:\n「本日[ほんじつ]に かぎり、全品[ぜんぴん] 20％引[び]き！」\n«本日[ほんじつ]に限り» nimani anglatadi?",
            "options": [
                "Faqat bugungi kun uchun amal qiladi",
                "Ertadan boshlab boshlanadi",
                "Faqat kechki payt amal qiladi",
                "Butun oy davomida chegirma"
            ],
            "correctAnswer": 0,
            "explanation": "本日 (Bugun) + に限り (faqat/cheklangan holda) = Faqat bugun barcha tovarlarga 20% chegirma."
        },
        {
            "id": "ja-n4-u2-l5-ex-11",
            "type": "multiple-choice",
            "prompt": "Mehmonxona xonasidagi bildirish:\n「チェックアウトは 午前[ごぜん] 10時[じゅうじ]までで ございます」\nMehmon xonani qachongacha bo'shatishi shart?",
            "options": [
                "Ertalab soat 10:00 gacha",
                "Kechqurun soat 10:00 gacha",
                "Tushki soat 12:00 gacha",
                "Istalgan vaqtda"
            ],
            "correctAnswer": 0,
            "explanation": "午前 10時まで — ertalab soat 10:00 gacha."
        },
        {
            "id": "ja-n4-u2-l5-ex-12",
            "type": "multiple-choice",
            "prompt": "Dori qutisidagi yo'riqnoma:\n「1日[いちにち] 3回[さんかい]、毎食後[まいしょくご]に 飲[の]んで ください」\nDori qachon ichiladi?",
            "options": [
                "Kuniga 3 mahal, har bir ovqatlanishdan so'ng",
                "Kuniga 3 mahal, ovqatdan oldin",
                "Faqat kechki ovqatdan keyin",
                "Har 3 soatda bir marta"
            ],
            "correctAnswer": 0,
            "explanation": "毎食後 (Har ovqatdan so'ng) + 1日3回 (kuniga 3 mahal)."
        },
        {
            "id": "ja-n4-u2-l5-ex-13",
            "type": "multiple-choice",
            "prompt": "Metrodagi e'lon:\n「駆[か]け込[こ]み 乗車[じょうしゃ]は おやめ ください」\nBu qanday harakatni to'xtatishni so'ramoqda?",
            "options": [
                "Yopilayotgan poyezd eshigiga yugurib chiqishni",
                "Poyezd ichida baland gapirishni",
                "Poyezdda uxlab qolishni",
                "Chiptani yo'qotib qo'yishni"
            ],
            "correctAnswer": 0,
            "explanation": "駆け込み乗車 (kakekomi jousha) — eshik yopilayotganda sakrab/yugurib chiqish xavfli bo'lgani sababli to'xtatilishi so'raladi."
        },
        {
            "id": "ja-n4-u2-l5-ex-14",
            "type": "multiple-choice",
            "prompt": "Basseyn qoidasi:\n「泳[およ]ぐ 前[まえ]に、必[かなら]ず シャワーを 浴[あ]びて ください」\nQaysi talab qo'yilgan?",
            "options": [
                "Suzishdan oldin albatta dush qabul qiling",
                "Suzib bo'lgach dush qabul qiling",
                "Suzish vaqtida suv ichmang",
                "Suzishdan keyin havzani tozalang"
            ],
            "correctAnswer": 0,
            "explanation": "泳ぐ前に (suzishdan oldin) + 必ず (albatta) + シャワーを浴びてください."
        },
        {
            "id": "ja-n4-u2-l5-ex-15",
            "type": "multiple-choice",
            "prompt": "Muzeydagi belgi: 【飲食禁止[いんしょくきんし]】\nNimani bildiradi?",
            "options": [
                "Ichimlik ichish va ovqat tanovul qilish taqiqlanadi",
                "Ichimliklar bepul beriladi",
                "Rasmga olish mumkin emas",
                "Mobil telefondan foydalanmang"
            ],
            "correctAnswer": 0,
            "explanation": "飲 (ichmoq) + 食 (yemoq) + 禁止 (taqiq) = Yeb-ichish taqiqlanadi."
        }
    ]
}
