# -*- coding: utf-8 -*-
"""
JLPT N5 Unit 4: I/Na-Adjectives, Existence (Arimasu/Imasu), Desires (Hoshii/Tai) & Daily Life Dokkai
Lessons 16-20 (15 authentic exercises per lesson = 75 exercises total)
"""

UNIT4_EXERCISES = {
    # ----------------------------------------------------
    # Lesson 16: I-Adjectives (い形容詞) Conjugation
    # ----------------------------------------------------
    "ja-n5-u4-l1": [
        {
            "id": "ja-n5-u4-l1-ex-1",
            "type": "multiple-choice",
            "prompt": "I-sifatlarning hozirgi zamon inkor shakli qanday yasaladi (masalan: 高い[たかい])?",
            "options": [
                "い tushirilib, 〜くないです (〜くありません) qo'shiladi -> 高くないです",
                "〜じゃないです qo'shiladi",
                "〜ではありません qo'shiladi",
                "〜でした qo'shiladi"
            ],
            "correctAnswer": 0,
            "explanation": "I-sifat inkori: 高い -> 高くないです / 高くありません."
        },
        {
            "id": "ja-n5-u4-l1-ex-2",
            "type": "multiple-choice",
            "prompt": "I-sifatlarning o'tgan zamon tasdiq shakli qanday yasaladi (masalan: 暑い[あつい])?",
            "options": [
                "い tushirilib, 〜かったです qo'shiladi -> 暑かったです (Issiq edi)",
                "〜でした qo'shiladi",
                "〜ました qo'shiladi",
                "〜ないでした qo'shiladi"
            ],
            "correctAnswer": 0,
            "explanation": "I-sifat o'tgan zamon tasdig'i: 暑い -> 暑かったです."
        },
        {
            "id": "ja-n5-u4-l1-ex-3",
            "type": "multiple-choice",
            "prompt": "I-sifatlarning o'tgan zamon inkor shakli qanday yasaladi (masalan: 寒い[さむい])?",
            "options": [
                "い tushirilib, 〜くなかったです qo'shiladi -> 寒くなかったです (Sovuq emas edi)",
                "〜くありませんでした",
                "〜じゃなかったです",
                "〜ませんでした"
            ],
            "correctAnswer": 0,
            "explanation": "I-sifat o'tgan zamon inkori: 寒くなかったです / 寒くありませんでした."
        },
        {
            "id": "ja-n5-u4-l1-ex-4",
            "type": "multiple-choice",
            "prompt": "«いい / よい» (yaxshi) sifatining inkor va o'tgan zamon shakllari qaysi (maxsus istisno)?",
            "options": [
                "よくないです (inkor), よかったです (o'tgan zamon), よくなかったです (o'tgan inkor)",
                "いくないです, いかったです, いくなかったです",
                "いいじゃないです, いいでした",
                "よいます, よいました"
            ],
            "correctAnswer": 0,
            "explanation": "«いい» so'zi o'zgarganda asosi «よい» ga aylanadi: よくない, よかった, よくなかった."
        },
        {
            "id": "ja-n5-u4-l1-ex-5",
            "type": "multiple-choice",
            "prompt": "«Kecha havo juda issiq edi»:",
            "options": [
                "昨日[きのう]は とても 暑[あつ]かったです",
                "昨日は とても 暑いです",
                "昨日は とても 暑くなかったです",
                "昨日は とても 暑いでした"
            ],
            "correctAnswer": 0,
            "explanation": "O'tgan zamon: 暑かったです."
        },
        {
            "id": "ja-n5-u4-l1-ex-6",
            "type": "multiple-choice",
            "prompt": "«Bu taom juda mazali»:",
            "options": [
                "この 料理[りょうり]は とても 美味[おい]しいです",
                "この 料理は とても まずいです",
                "この 料理は とても 高いです",
                "この 料理は とても 辛いです"
            ],
            "correctAnswer": 0,
            "explanation": "美味しい[おいしい] — mazali, shirin."
        },
        {
            "id": "ja-n5-u4-l1-ex-7",
            "type": "multiple-choice",
            "prompt": "«Ushbu kino unchalik qiziq emas edi»:",
            "options": [
                "その 映画[えいが]は あまり 面白[おもしろ]くなかったです",
                "その 映画は とても 面白かったです",
                "その 映画は あまり 面白いです",
                "その 映画は あまり 面白いでした"
            ],
            "correctAnswer": 0,
            "explanation": "«あまり» (unchalik emas) inkor bilan keladi: 面白くなかったです."
        },
        {
            "id": "ja-n5-u4-l1-ex-8",
            "type": "multiple-choice",
            "prompt": "«Yangi» va «Eski» sifatlarining to'g'ri juftligi:",
            "options": [
                "新しい[あたらしい] (Yangi) va 古い[ふるい] (Eski)",
                "大きい va 小さい",
                "高い va 安い",
                "近い va 遠い"
            ],
            "correctAnswer": 0,
            "explanation": "新しい (yangi) ning antonimi — 古い (eski)."
        },
        {
            "id": "ja-n5-u4-l1-ex-9",
            "type": "multiple-choice",
            "prompt": "I-sifat otni sifatlab kelganda qanday ulanadi?",
            "options": [
                "O'zgarishsiz to'g'ridan-to'g'ri ot oldiga qo'yiladi (masalan: おいしい パン)",
                "な qo'shiladi",
                "の qo'shiladi",
                "に qo'shiladi"
            ],
            "correctAnswer": 0,
            "explanation": "I-sifatlar ot oldiga to'g'ridan-to'g'ri o'z shaklida ulanadi (おいしいパン, 高い本)."
        },
        {
            "id": "ja-n5-u4-l1-ex-10",
            "type": "multiple-choice",
            "prompt": "Zid ma'noli ikki sifatni bog'lash («Yapon taomlari mazali, lekin qimmat»):",
            "options": [
                "日本の 食べ物は 美味[おい]しいですが、高[たか]いです",
                "日本の 食べ物は 美味しいですから、高いです",
                "日本の 食べ物は 美味しくて、高いです",
                "日本の 食べ物は 美味しいので、高いです"
            ],
            "correctAnswer": 0,
            "explanation": "«〜が» — gap o'rtasida «lekin / ammo» ma'nosini beruvchi zidlovchi bog'lovchi."
        },
        {
            "id": "ja-n5-u4-l1-ex-11",
            "type": "multiple-choice",
            "prompt": "Ikkita ijobiy sifatni bog'lash («Yapon taomlari mazali va foydali»):",
            "options": [
                "日本の 食べ物は 美味しくて、体[からだ]に いいです",
                "日本の 食べ物は 美味しいで、体に いいです",
                "日本の 食べ物は 美味しいが、体に いいです",
                "日本の 食べ物は 美味しいと、体に いいです"
            ],
            "correctAnswer": 0,
            "explanation": "I-sifatlarni o'zaro bog'lashda «い» tushib «〜くて» bo'ladi: 美味しくて (mazali bo'lib)."
        },
        {
            "id": "ja-n5-u4-l1-ex-12",
            "type": "multiple-choice",
            "prompt": "«Yaponiyadagi hayot qanday?» deb taassurot so'rash:",
            "options": [
                "日本の 生活[せいかつ]は どうですか (Nihon no seikatsu wa dou desu ka)",
                "日本の 生活は なんですか",
                "日本の 生活は だれですか",
                "日本の 生活は どこですか"
            ],
            "correctAnswer": 0,
            "explanation": "Taassurot yoki holatni so'rash: どうですか (qanday?)."
        },
        {
            "id": "ja-n5-u4-l1-ex-13",
            "type": "multiple-choice",
            "prompt": "«Imtihon unchalik qiyin emas edi»:",
            "options": [
                "試験[しけん]は あまり 難[むずか]しくなかったです",
                "試験は とても 難しかったです",
                "試験は あまり 難しいです",
                "試験は あまり 難しいでした"
            ],
            "correctAnswer": 0,
            "explanation": "難しい -> 難しくなかったです."
        },
        {
            "id": "ja-n5-u4-l1-ex-14",
            "type": "multiple-choice",
            "prompt": "«Katta xona» va «Kichik xona»:",
            "options": [
                "大[おお]きい 部屋[へや] va 小[ちい]さい 部屋",
                "高い 部屋 va 低い 部屋",
                "長い 部屋 va 短い 部屋",
                "重い 部屋 va 軽い 部屋"
            ],
            "correctAnswer": 0,
            "explanation": "大きい (katta) vs 小さい (kichik)."
        },
        {
            "id": "ja-n5-u4-l1-ex-15",
            "type": "multiple-choice",
            "prompt": "Qaysi jumla to'g'ri tuzilgan?",
            "options": [
                "昨日は 天気[てんき]が よかったです (Kecha ob-havo yaxshi edi)",
                "昨日は 天気が いいでした",
                "昨日は 天気が いいかった",
                "昨日は 天気が よくでした"
            ],
            "correctAnswer": 0,
            "explanation": "«いい» sifatining o'tgan zamoni — «よかったです»."
        }
    ],

    # ----------------------------------------------------
    # Lesson 17: Na-Adjectives (な形容詞) & Noun Modification
    # ----------------------------------------------------
    "ja-n5-u4-l2": [
        {
            "id": "ja-n5-u4-l2-ex-1",
            "type": "multiple-choice",
            "prompt": "Na-sifatlarning (masalan: 静か[しずか]) ot oldida kelgandagi asosiy qoidasi qaysi?",
            "options": [
                "Ot oldida kelganda o'ziga «な» (Na) qo'shimchasini oladi -> 静かな 部屋",
                "O'zgarishsiz to'g'ridan-to'g'ri qo'yiladi",
                "«の» qo'shiladi",
                "«い» ga aylanadi"
            ],
            "correctAnswer": 0,
            "explanation": "Na-sifatlar otni sifatlaganda «な» talab qiladi: 静かな (sokin/tinch)."
        },
        {
            "id": "ja-n5-u4-l2-ex-2",
            "type": "multiple-choice",
            "prompt": "Na-sifatlarning inkor shakli qanday yasaladi (masalan: 暇[ひま]です)?",
            "options": [
                "暇では ありません / 暇じゃ ありません (Bo'sh emasman)",
                "暇くないです",
                "暇くありません",
                "暇ないです"
            ],
            "correctAnswer": 0,
            "explanation": "Na-sifat xuddi ot kabi tuslanadi: 〜ではありません / 〜じゃありません."
        },
        {
            "id": "ja-n5-u4-l2-ex-3",
            "type": "multiple-choice",
            "prompt": "Na-sifatlarning o'tgan zamon tasdiq shakli qanday yasaladi (masalan: 静か)?",
            "options": [
                "静かでした (Tinch edi / Sokin edi)",
                "静かかったです",
                "静かました",
                "静かだったです"
            ],
            "correctAnswer": 0,
            "explanation": "Na-sifat o'tgan zamoni: 静かでした."
        },
        {
            "id": "ja-n5-u4-l2-ex-4",
            "type": "multiple-choice",
            "prompt": "«きれい» (chiroyli / toza) so'zi qaysi turdagi sifatga kiradi?",
            "options": [
                "Oxiri «い» bilan tugasa ham, istisno NA-SIFAT hisoblanadi (きれいな 花)",
                "I-sifat",
                "Fe'l",
                "Ravish"
            ],
            "correctAnswer": 0,
            "explanation": "Eng mashhur istisno: きれい (Kirei) — Na-sifatdir! Ot oldida きれいな bo'ladi."
        },
        {
            "id": "ja-n5-u4-l2-ex-5",
            "type": "multiple-choice",
            "prompt": "«Mashhur shahar»:",
            "options": [
                "有名[ゆうめい]な 町[まち] (Yuumei na machi)",
                "有名の 町",
                "有名い 町",
                "有名 町"
            ],
            "correctAnswer": 0,
            "explanation": "有名な (mashhur) + 町 (shahar)."
        },
        {
            "id": "ja-n5-u4-l2-ex-6",
            "type": "multiple-choice",
            "prompt": "«Tanaka janoblari juda mehribon va ochiqko'ngil inson»:",
            "options": [
                "田中さんは とても 親切[しんせつ]な 人です",
                "田中さんは とても 親切の 人です",
                "田中さんは とても 親切い 人です",
                "田中さんは とても 親切く 人です"
            ],
            "correctAnswer": 0,
            "explanation": "親切な[しんせつな] — mehribon, samimiy."
        },
        {
            "id": "ja-n5-u4-l2-ex-7",
            "type": "multiple-choice",
            "prompt": "«Qulay» va «Noqulay» sifatlarining to'g'ri juftligi:",
            "options": [
                "便利[べんり]な (Qulay) va 不便[ふべん]な (Noqulay)",
                "静かな va 賑やかな",
                "簡単な va 複雑な",
                "安全な va 危険な"
            ],
            "correctAnswer": 0,
            "explanation": "便利な (qulay) ning antonimi — 不便な (noqulay)."
        },
        {
            "id": "ja-n5-u4-l2-ex-8",
            "type": "multiple-choice",
            "prompt": "«元気» (Genki) so'zining to'g'ri ma'nosi:",
            "options": [
                "Sog'lom / Tetik / Kuch-g'ayratga to'la",
                "Kasal",
                "Charchagan",
                "Xafa"
            ],
            "correctAnswer": 0,
            "explanation": "元気[げんき] — tetiklik, sog'lomlik."
        },
        {
            "id": "ja-n5-u4-l2-ex-9",
            "type": "multiple-choice",
            "prompt": "«Men sportni yaxshi ko'raman (yoqtiraman)» jumlasida yoqtirilgan narsaga qaysi zarracha qo'yiladi?",
            "options": [
                "が — スポーツが 好[す]きです (Supootsu ga suki desu)",
                "を — スポーツを 好きです",
                "で — スポーツで 好きです",
                "に — スポーツに 好きです"
            ],
            "correctAnswer": 0,
            "explanation": "Yoqtirish/yoqtirmaslik (好き / 嫌い) sifatlari bilan obyektga «が» zarrachasi qo'yiladi."
        },
        {
            "id": "ja-n5-u4-l2-ex-10",
            "type": "multiple-choice",
            "prompt": "«Go'shtni unchalik yoqtirmayman»:",
            "options": [
                "肉[にく]が あまり 好[す]きでは ありません",
                "肉を とても 好きです",
                "肉が 大好きです",
                "肉は 嫌いでした"
            ],
            "correctAnswer": 0,
            "explanation": "あまり + 好きではありません (unchalik yoqtirmayman)."
        },
        {
            "id": "ja-n5-u4-l2-ex-11",
            "type": "multiple-choice",
            "prompt": "Biror faoliyatda «Mohir/Usta» va «Noo'quv/Tajribasiz» sifatlari qaysilar?",
            "options": [
                "上手[じょうず]な (Mohir) va 下手[へた]な (Noo'quv)",
                "好きな va 嫌いな",
                "得意な va 苦手な",
                "速い va 遅い"
            ],
            "correctAnswer": 0,
            "explanation": "上手[じょうず] (usta) vs 下手[へた] (noo'quv)."
        },
        {
            "id": "ja-n5-u4-l2-ex-12",
            "type": "multiple-choice",
            "prompt": "«Ali yapon tilida gapirishga juda usta»:",
            "options": [
                "アリさんは 日本語が とても 上手[じょうず]です",
                "アリさんは 日本語を とても 上手です",
                "アリさんは 日本語で とても 上手です",
                "アリさんは 日本語に とても 上手です"
            ],
            "correctAnswer": 0,
            "explanation": "Qobiliyat (上手 / 下手) oldidan «が» zarrachasi qo'yiladi."
        },
        {
            "id": "ja-n5-u4-l2-ex-13",
            "type": "multiple-choice",
            "prompt": "«Ertaga bo'shmisiz (vaqtingiz bormi)?»:",
            "options": [
                "明日[あした] 暇[ひま]ですか (Ashita hima desu ka)",
                "明日 忙しいですか",
                "明日 元気ですか",
                "明日 静かですか"
            ],
            "correctAnswer": 0,
            "explanation": "暇[ひま] — bo'sh vaqtga egalik."
        },
        {
            "id": "ja-n5-u4-l2-ex-14",
            "type": "multiple-choice",
            "prompt": "«Oddiy / Oson» ma'nosini beruvchi Na-sifat qaysi?",
            "options": [
                "簡単[かんたん]な (Kantan na)",
                "複雑な",
                "困難な",
                "大変な"
            ],
            "correctAnswer": 0,
            "explanation": "簡単な[かんたんな] — oson, sodda."
        },
        {
            "id": "ja-n5-u4-l2-ex-15",
            "type": "multiple-choice",
            "prompt": "Qaysi gapda Na-sifat to'g'ri qo'llanilgan?",
            "options": [
                "奈良[なら]は 静[しず]かで、きれいな 町です",
                "奈良は 静かなで、きれい町です",
                "奈良は 静かいで、きれいな町です",
                "奈良は 静かくて、きれい町です"
            ],
            "correctAnswer": 0,
            "explanation": "Na-sifatlarni bog'lashda: 静かで (shizuka de) + きれいな町."
        }
    ],

    # ----------------------------------------------------
    # Lesson 18: Existence Verbs: あります (Inanimate) vs います (Animate)
    # ----------------------------------------------------
    "ja-n5-u4-l3": [
        {
            "id": "ja-n5-u4-l3-ex-1",
            "type": "multiple-choice",
            "prompt": "«あります» va «います» fe'llarining asosiy farqi nima?",
            "options": [
                "あります — jonsiz narsalar va o'simliklar uchun; います — tirik jonzotlar (insonlar va hayvonlar) uchun",
                "あります faqat uylar uchun",
                "います faqat o'tmishda ishlatiladi",
                "Ikkalasi bir xil, farqi yo'q"
            ],
            "correctAnswer": 0,
            "explanation": "あります (jonsiz mavjudlik) vs います (harakatlanuvchi tirik jonlik mavjudligi)."
        },
        {
            "id": "ja-n5-u4-l3-ex-2",
            "type": "multiple-choice",
            "prompt": "«Xonada televizor bor»:",
            "options": [
                "部屋[へや]に テレビが あります (Heya ni terebi ga arimasu)",
                "部屋に テレビが います",
                "部屋で テレビを あります",
                "部屋へ テレビが います"
            ],
            "correctAnswer": 0,
            "explanation": "Televizor jonsiz bo'lgani sababli: テレビが あります."
        },
        {
            "id": "ja-n5-u4-l3-ex-3",
            "type": "multiple-choice",
            "prompt": "«Hovlida it bor»:",
            "options": [
                "庭[にわ]に 犬[いぬ]が います (Niwa ni inu ga imasu)",
                "庭に 犬が あります",
                "庭で 犬を います",
                "庭へ 犬が あります"
            ],
            "correctAnswer": 0,
            "explanation": "It (tirik hayvon) bo'lgani sababli: 犬が います."
        },
        {
            "id": "ja-n5-u4-l3-ex-4",
            "type": "multiple-choice",
            "prompt": "«Stol ustida»:",
            "options": [
                "机[つくえ]の 上[うえ]に (Tsukue no ue ni)",
                "机の 下[した]に",
                "机の 中[なか]に",
                "机の 前[まえ]に"
            ],
            "correctAnswer": 0,
            "explanation": "机の 上に = stol ustida."
        },
        {
            "id": "ja-n5-u4-l3-ex-5",
            "type": "multiple-choice",
            "prompt": "«Kreslo ostida mushuk bor»:",
            "options": [
                "椅子[いす]の 下[した]に 猫[ねこ]が います",
                "椅子の 下に 猫が あります",
                "椅子の 上に 猫を います",
                "椅子の 前に 猫で あります"
            ],
            "correctAnswer": 0,
            "explanation": "Mushuk tirik jonzot: 猫が います."
        },
        {
            "id": "ja-n5-u4-l3-ex-6",
            "type": "multiple-choice",
            "prompt": "«Sumka ichida daftar va qalam bor»:",
            "options": [
                "かばんの 中[なか]に ノートと ペンが あります",
                "かばんの 中に ノートと ペンが います",
                "かばんの 外に ノートと ペンを あります",
                "かばんの 前に ノートと ペンで います"
            ],
            "correctAnswer": 0,
            "explanation": "Jonsiz buyumlar: あります."
        },
        {
            "id": "ja-n5-u4-l3-ex-7",
            "type": "multiple-choice",
            "prompt": "«Xonada kim bor?» deb so'rash:",
            "options": [
                "部屋[へや]に だれが いますか (Heya ni dare ga imasu ka)",
                "部屋に 何が ありますか",
                "部屋に だれが ありますか",
                "部屋に 何が いますか"
            ],
            "correctAnswer": 0,
            "explanation": "Insonni so'rash: だれが いますか."
        },
        {
            "id": "ja-n5-u4-l3-ex-8",
            "type": "multiple-choice",
            "prompt": "«Qutida nima bor?» deb so'rash:",
            "options": [
                "箱[はこ]の 中に 何[なに]が ありますか (Hako no naka ni nani ga arimasu ka)",
                "箱の 中に だれが いますか",
                "箱の 中に 何が いますか",
                "箱の 中に だれが ありますか"
            ],
            "correctAnswer": 0,
            "explanation": "Jonsiz narsani so'rash: 何が ありますか."
        },
        {
            "id": "ja-n5-u4-l3-ex-9",
            "type": "multiple-choice",
            "prompt": "«Xonada hech kim yo'q» (To'liq inkor):",
            "options": [
                "部屋[へや]に だれも いません (Heya ni dare mo imasen)",
                "部屋に 何も ありません",
                "部屋に だれも ありません",
                "部屋に 何も いません"
            ],
            "correctAnswer": 0,
            "explanation": "Odamlar uchun to'liq inkor: だれも いません."
        },
        {
            "id": "ja-n5-u4-l3-ex-10",
            "type": "multiple-choice",
            "prompt": "«Muzlatgichda hech narsa yo'q»:",
            "options": [
                "冷蔵庫[れいぞうこ]に 何[なに]も ありません",
                "冷蔵庫に だれも いません",
                "冷蔵庫に 何も いません",
                "冷蔵庫に だれも ありません"
            ],
            "correctAnswer": 0,
            "explanation": "Jonsiz narsalar uchun to'liq inkor: 何も ありません."
        },
        {
            "id": "ja-n5-u4-l3-ex-11",
            "type": "multiple-choice",
            "prompt": "«Bino oldida avtomobil bor»:",
            "options": [
                "ビル[建物]の 前[まえ]に 車[くるま]が あります",
                "ビルの 前に 車が います",
                "ビルの 後ろに 車を あります",
                "ビルの 中に 車で います"
            ],
            "correctAnswer": 0,
            "explanation": "Mashina jonsiz buyum: 車が あります."
        },
        {
            "id": "ja-n5-u4-l3-ex-12",
            "type": "multiple-choice",
            "prompt": "«O'ng» va «Chap» so'zlari:",
            "options": [
                "右[みぎ] (O'ng) va 左[ひだり] (Chap)",
                "上 va 下",
                "前 va 後ろ",
                "東 va 西"
            ],
            "correctAnswer": 0,
            "explanation": "右[みぎ] (o'ng) vs 左[ひだり] (chap)."
        },
        {
            "id": "ja-n5-u4-l3-ex-13",
            "type": "multiple-choice",
            "prompt": "«Do'kon ichida sotuvchi bor»:",
            "options": [
                "店[みせ]の 中に 店員[てんいん]が います",
                "店の 中に 店員が あります",
                "店の 外に 店員を います",
                "店の 前に 店員で あります"
            ],
            "correctAnswer": 0,
            "explanation": "Sotuvchi inson bo'lgani uchun: います."
        },
        {
            "id": "ja-n5-u4-l3-ex-14",
            "type": "multiple-choice",
            "prompt": "O'simliklar, daraxtlar va gullar (harakatsiz tirik tabiat) bilan qaysi fe'l ishlatiladi?",
            "options": [
                "あります — masalan: 庭に 花が あります / 木が あります",
                "います",
                "します",
                "きます"
            ],
            "correctAnswer": 0,
            "explanation": "Muhim qoida: O'simlik va daraxtlar o'zicha mustaqil harakatlanmagani uchun yapon tilida «あります» bilan ishlatiladi."
        },
        {
            "id": "ja-n5-u4-l3-ex-15",
            "type": "multiple-choice",
            "prompt": "A: 「すみません、トイレは どこに ありますか。」\nB: 「（　　）の 隣に あります。」\nBo'sh joyga mos joylashuv so'zini qo'ying:",
            "options": [
                "エレベーター (Erebeetaa)",
                "いぬ",
                "ねこ",
                "さかな"
            ],
            "correctAnswer": 0,
            "explanation": "Hojatxona liftning yonida: エレベーターの 隣."
        }
    ],

    # ----------------------------------------------------
    # Lesson 19: Desires: 〜が ほしい (Want Noun) & 〜たい (Want to do)
    # ----------------------------------------------------
    "ja-n5-u4-l4": [
        {
            "id": "ja-n5-u4-l4-ex-1",
            "type": "multiple-choice",
            "prompt": "Biror moddiy buyumni xohlashda qaysi grammatik qolip ishlatiladi?",
            "options": [
                "[Ot] + が ほしいです (Hoshii desu) — masalan: 新しい 車が ほしいです",
                "[Ot] + を ほしいです",
                "[Ot] + に ほしいです",
                "[Ot] + で ほしいです"
            ],
            "correctAnswer": 0,
            "explanation": "Buyumni xohlash: [Ot] + が ほしいです."
        },
        {
            "id": "ja-n5-u4-l4-ex-2",
            "type": "multiple-choice",
            "prompt": "Biror harakatni bajarishni xohlash («...gim kelyapti / ...moqchiman») qanday yasaladi?",
            "options": [
                "Fe'l [masu-o'rni] + たいです — masalan: 食べます -> 食べたいです",
                "Fe'l oddiy + たいです",
                "Fe'l te-shakli + たいです",
                "Fe'l ta-shakli + たいです"
            ],
            "correctAnswer": 0,
            "explanation": "Fe'l xohishi: Fe'l masu-ildiziga «〜たいです» qo'shiladi."
        },
        {
            "id": "ja-n5-u4-l4-ex-3",
            "type": "multiple-choice",
            "prompt": "«〜たいです» ning inkor shakli qanday yasaladi (masalan: 行きたい)?",
            "options": [
                "〜たくないです (〜たくありません) — 行きたくないです (Borgim kelmayapti)",
                "〜たいじゃないです",
                "〜たいではありません",
                "〜たいませんでした"
            ],
            "correctAnswer": 0,
            "explanation": "«〜たい» xuddi I-sifat kabi tuslanadi: 行きたい -> 行きたくないです."
        },
        {
            "id": "ja-n5-u4-l4-ex-4",
            "type": "multiple-choice",
            "prompt": "«〜たいです» ning o'tgan zamon tasdig'i:",
            "options": [
                "〜たかったです — masalan: 会いたかったです (Ko'rishgim kelgan edi)",
                "〜たいでした",
                "〜たいたです",
                "〜たいました"
            ],
            "correctAnswer": 0,
            "explanation": "O'tgan zamon xohishi: 会いたかったです."
        },
        {
            "id": "ja-n5-u4-l4-ex-5",
            "type": "multiple-choice",
            "prompt": "«Hozir nima xohlaysiz?» deb so'rash:",
            "options": [
                "今 何[なに]が ほしいですか (Ima nani ga hoshii desu ka)",
                "今 何を したいですか",
                "今 どこへ 行きたいですか",
                "今 だれに 会いたいですか"
            ],
            "correctAnswer": 0,
            "explanation": "Buyum xohishini so'rash: 何が ほしいですか."
        },
        {
            "id": "ja-n5-u4-l4-ex-6",
            "type": "multiple-choice",
            "prompt": "«Dam olish kunida nima qilishni xohlaysiz?»:",
            "options": [
                "休[やす]みの 日[ひ]に 何[なに]を したいですか",
                "休みの 日に 何が ほしいですか",
                "休みの 日に どこへ 行きますか",
                "休みの 日に だれと 会いますか"
            ],
            "correctAnswer": 0,
            "explanation": "Harakat qilish xohishi: 何を したいですか."
        },
        {
            "id": "ja-n5-u4-l4-ex-7",
            "type": "multiple-choice",
            "prompt": "«Yaponiyaga borishni xohlayman»:",
            "options": [
                "日本[にほん]へ 行[い]きたいです (Nihon e ikitai desu)",
                "日本へ 行くたいです",
                "日本へ 行きないです",
                "日本へ 行くほしいです"
            ],
            "correctAnswer": 0,
            "explanation": "Fe'l negiziga 〜たいです qo'shiladi: 行きます -> 行きたいです (bormoqchiman)."
        },
        {
            "id": "ja-n5-u4-l4-ex-8",
            "type": "multiple-choice",
            "prompt": "«Muzdek suv ichgim kelyapti»:",
            "options": [
                "冷[つめ]たい 水[みず]を 飲[の]みたいです",
                "冷たい 水を 飲みたくないです",
                "冷たい 水を 飲みたかったです",
                "冷たい 水が ほしいでした"
            ],
            "correctAnswer": 0,
            "explanation": "Suyuqlik ichish xohishida fe'lning 〜ます o'rniga: 飲みます -> 飲みたいです bo'ladi."
        },
        {
            "id": "ja-n5-u4-l4-ex-9",
            "type": "multiple-choice",
            "prompt": "«Charchaganim sababli, biroz dam olgim kelyapti»:",
            "options": [
                "疲[つか]れましたから、少[すこ]し 休[やす]みたいです",
                "疲れましたから、少し 休みたくないです",
                "疲れましたから、少し 働きたいです",
                "疲れましたから、少し 走りたいです"
            ],
            "correctAnswer": 0,
            "explanation": "休みたいです — dam olmoqchiman."
        },
        {
            "id": "ja-n5-u4-l4-ex-10",
            "type": "multiple-choice",
            "prompt": "«Bugun kechqurun hech narsa yegim kelmayapti»:",
            "options": [
                "今夜[こんや] 何[なに]も 食[た]べたくないです",
                "今夜 何も 食べたいです",
                "今夜 何も 食べました",
                "今夜 何も 食べませんでした"
            ],
            "correctAnswer": 0,
            "explanation": "Hech narsa yemaslik inkorida: 何も (hech narsa) + 食べたくないです (yegim kelmayapti)."
        },
        {
            "id": "ja-n5-u4-l4-ex-11",
            "type": "multiple-choice",
            "prompt": "«Yangi kompyuter xohlayman»:",
            "options": [
                "新[あたら]しい パソコンが ほしいです",
                "新しい パソコンを 買いたいです",
                "新しい パソコンが ほしくないです",
                "新しい パソコンで ほしいです"
            ],
            "correctAnswer": 0,
            "explanation": "Narsa-buyumni xohlash modelida: Ot + が ほしいです (パソコンが ほしいです)."
        },
        {
            "id": "ja-n5-u4-l4-ex-12",
            "type": "multiple-choice",
            "prompt": "Yapon tilida «ほしい» va «〜たい» to'g'ridan-to'g'ri kimning xohishini ifodalash uchun ishlatiladi?",
            "options": [
                "Faqat so'zlovchining o'zi (1-shaxs) va so'roqda suhbatdoshning (2-shaxs) xohishi uchun",
                "Har doim 3-shaxs (boshqa odamlar) uchun",
                "Faqat hayvonlar uchun",
                "Faqat o'tmishdagi orzular uchun"
            ],
            "correctAnswer": 0,
            "explanation": "Insonning ichki xohishini boshqa odam aniq bila olmagani sababli, ほしい/たい bevosita 1- va 2-shaxs uchun ishlatiladi."
        },
        {
            "id": "ja-n5-u4-l4-ex-13",
            "type": "multiple-choice",
            "prompt": "«Biroz vaqt xohlayman (vaqtim bo'lishini istayman)»:",
            "options": [
                "時間[じかん]が ほしいです (Jikan ga hoshii desu)",
                "時間が ほしくないです",
                "時間を ほしいです",
                "時間で ほしいです"
            ],
            "correctAnswer": 0,
            "explanation": "Vaqtga ega bo'lishni xohlashda: 時間が ほしいです (vaqtim bo'lishini xohlayman)."
        },
        {
            "id": "ja-n5-u4-l4-ex-14",
            "type": "multiple-choice",
            "prompt": "«Dengizga suzgani bormoqchiman»:",
            "options": [
                "海[うみ]へ 泳[およ]ぎに 行[い]きたいです",
                "海へ 泳ぎに 行きたくないです",
                "海へ 泳ぐに 行きたいです",
                "海へ 泳ぎで 行きたいです"
            ],
            "correctAnswer": 0,
            "explanation": "Maqsad (泳ぎに) + 行きたいです."
        },
        {
            "id": "ja-n5-u4-l4-ex-15",
            "type": "multiple-choice",
            "prompt": "«Qayerga borishni xohlaysiz?»:",
            "options": [
                "どこへ 行[い]きたいですか (Doko e ikitai desu ka)",
                "だれと 行きたいですか",
                "いつ 行きたいですか",
                "なにを 行きたいですか"
            ],
            "correctAnswer": 0,
            "explanation": "Manzil xohishini so'rash: どこへ 行きたいですか."
        }
    ],

    # ----------------------------------------------------
    # Lesson 20: N5 Reading: 田中さんの一日 (Tanaka's Daily Life)
    # ----------------------------------------------------
    "ja-n5-u4-l5": [
        {
            "id": "ja-n5-u4-l5-ex-1",
            "type": "multiple-choice",
            "prompt": "【Matn: 田中さんは 毎朝 6時半に 起きます。顔を 洗って、朝ご飯を 食べます。】\nSavol: Tanaka har kuni ertalab soat nechada uyg'onadi?",
            "options": [
                "6:30 da (Rokuji han ni)",
                "7:00 da",
                "6:00 da",
                "8:00 da"
            ],
            "correctAnswer": 0,
            "explanation": "Matnda: «毎朝 6時半に 起きます»."
        },
        {
            "id": "ja-n5-u4-l5-ex-2",
            "type": "multiple-choice",
            "prompt": "【Matn: 朝ご飯は いつも パンと 卵[たまご]です。そして、熱い コーヒーを 飲みます。】\nSavol: Tanakaning nonushtasi nimalardan iborat?",
            "options": [
                "Non, tuxum va issiq qahva",
                "Guruch va sho'rva",
                "Mevalar va sovuq sut",
                "Faqat suv"
            ],
            "correctAnswer": 0,
            "explanation": "Matnda: «パンと 卵です。そして、熱い コーヒーを 飲みます»."
        },
        {
            "id": "ja-n5-u4-l5-ex-3",
            "type": "multiple-choice",
            "prompt": "【Matn: 7時45分に うちを 出ます。駅から 会社まで 電車で 行きます。電車で 40分くらい かかります。】\nSavol: Tanaka ishga nima bilan boradi va qancha vaqt ketadi?",
            "options": [
                "Poyezdda boradi va taxminan 40 daqiqa ketadi",
                "Avtobusda boradi va 20 daqiqa ketadi",
                "Piyoda 10 daqiqada boradi",
                "Taksida 1 soatda boradi"
            ],
            "correctAnswer": 0,
            "explanation": "Matnda: «電車で 行きます。電車で 40分くらい かかります»."
        },
        {
            "id": "ja-n5-u4-l5-ex-4",
            "type": "multiple-choice",
            "prompt": "【Matn: 会社の 仕事は 9時から 18時までです。とても 忙しいですが、面白いです。】\nSavol: Ish soatlari qaysi vaqt oralig'ida?",
            "options": [
                "9:00 dan 18:00 gacha",
                "8:00 dan 17:00 gacha",
                "10:00 dan 19:00 gacha",
                "Faqat tushgacha"
            ],
            "correctAnswer": 0,
            "explanation": "Matnda: «9時から 18時までです»."
        },
        {
            "id": "ja-n5-u4-l5-ex-5",
            "type": "multiple-choice",
            "prompt": "Oldingi gap bo'yicha: Tanaka o'z ishi haqida nima deb hisoblaydi?",
            "options": [
                "Juda band (og'ir), ammo qiziqarli (とても 忙しいですが、面白いです)",
                "Juda oson va zerikarli",
                "Umuman yoqmaydi",
                "Kasal bo'lib qoladi"
            ],
            "correctAnswer": 0,
            "explanation": "Matnda: «とても 忙しいですが、面白いです»."
        },
        {
            "id": "ja-n5-u4-l5-ex-6",
            "type": "multiple-choice",
            "prompt": "【Matn: 12時に 会社の 食堂で 同僚[どうりょう]と 昼ご飯を 食べます。田中さんは カレーが 好きです。】\nSavol: Tanaka tushlikda nima yeyishni yoqtiradi?",
            "options": [
                "Karri (Curry - カレー)",
                "Sushi",
                "Ramen",
                "Faqat salat"
            ],
            "correctAnswer": 0,
            "explanation": "Matnda: «田中さんは カレーが 好きです»."
        },
        {
            "id": "ja-n5-u4-l5-ex-7",
            "type": "multiple-choice",
            "prompt": "【Matn: 仕事が 終わってから、駅の 近くの スーパーで 買い物を します。】\nSavol: Ish tugagach, Tanaka xaridni qayerda qiladi?",
            "options": [
                "Vokzal yaqinidagi supermarketda (駅の 近くの スーパーで)",
                "Uyning yonidagi kichik do'konda",
                "Bozorda",
                "Universitetda"
            ],
            "correctAnswer": 0,
            "explanation": "Matnda: «駅の 近くの スーパーで 買い物を します»."
        },
        {
            "id": "ja-n5-u4-l5-ex-8",
            "type": "multiple-choice",
            "prompt": "【Matn: 19時半に うちへ 帰ります。お風呂[ふろ]に 入ってから、晩ご飯を 食べます。】\nSavol: Tanaka uyga qaytib kechki ovqatdan oldin nima qiladi?",
            "options": [
                "Vanna qabul qiladi / cho'miladi (お風呂に 入ります)",
                "Televizor ko'radi",
                "Dars qiladi",
                "Uxlaydi"
            ],
            "correctAnswer": 0,
            "explanation": "Matnda: «お風呂に 入ってから、晩ご飯を 食べます»."
        },
        {
            "id": "ja-n5-u4-l5-ex-9",
            "type": "multiple-choice",
            "prompt": "【Matn: 夜は テレビの ニュースを 見ます。時々 本を 読みます。】\nSavol: Tanaka tunda nima bilan shug'ullanadi?",
            "options": [
                "Televizorda yangiliklar ko'radi va ba'zan kitob o'qiydi",
                "Kompaniyaga qaytib ishlaydi",
                "Faqat o'yin o'ynaydi",
                "Telefon gaplashadi"
            ],
            "correctAnswer": 0,
            "explanation": "Matnda: «ニュースを 見ます。時々 本を 読みます»."
        },
        {
            "id": "ja-n5-u4-l5-ex-10",
            "type": "multiple-choice",
            "prompt": "【Matn: 23時に 寝ます。土曜日と 日曜日は 休みです。】\nSavol: Tanaka soat nechada uxlaydi?",
            "options": [
                "23:00 da (Juuichiji ni)",
                "22:00 da",
                "24:00 da",
                "21:00 da"
            ],
            "correctAnswer": 0,
            "explanation": "Matnda: «23時に 寝ます»."
        },
        {
            "id": "ja-n5-u4-l5-ex-11",
            "type": "multiple-choice",
            "prompt": "«時々» (Tokidoki) so'zining o'zbekcha tarjimasi:",
            "options": [
                "Ba'zan / Gohida (Sometimes)",
                "Har doim",
                "Hech qachon",
                "Juda ko'p"
            ],
            "correctAnswer": 0,
            "explanation": "時々[ときどき] — ba'zan, ahyon-ahyonda."
        },
        {
            "id": "ja-n5-u4-l5-ex-12",
            "type": "multiple-choice",
            "prompt": "«いつも» (Itsumo) so'zining to'g'ri ma'nosi:",
            "options": [
                "Doimo / Har doim (Always)",
                "Kamdan-kam",
                "Kecha",
                "Ertaga"
            ],
            "correctAnswer": 0,
            "explanation": "いつも — doimo, muntazam."
        },
        {
            "id": "ja-n5-u4-l5-ex-13",
            "type": "multiple-choice",
            "prompt": "Tanakaning dam olish kunlari qaysi kunlar?",
            "options": [
                "Shanba va Yakshanba (土曜日と 日曜日)",
                "Faqat Juma",
                "Dushanba va Seshanba",
                "Hech qachon dam olmaydi"
            ],
            "correctAnswer": 0,
            "explanation": "Matnda: «土曜日と 日曜日は 休みです»."
        },
        {
            "id": "ja-n5-u4-l5-ex-14",
            "type": "multiple-choice",
            "prompt": "«顔を 洗います» (Kao o araimasu) nimani bildiradi?",
            "options": [
                "Yuzni yuvmoq",
                "Tishni tozalamoq",
                "Sochni taramoq",
                "Ko'zoynak taqmoq"
            ],
            "correctAnswer": 0,
            "explanation": "顔[かお] (yuz) + を 洗います (yuvaman)."
        },
        {
            "id": "ja-n5-u4-l5-ex-15",
            "type": "multiple-choice",
            "prompt": "Tanaka haqidagi butun matndan kelib chiqadigan xulosa:",
            "options": [
                "Tanaka intizomli, har kuni o'z vaqtida ishlaydigan va sog'lom rejimga ega kompaniya xodimidir",
                "Tanaka ishlamaydigan talaba",
                "Tanaka doimo kech uyg'onadi",
                "Tanaka qahva ichishni yoqtirmaydi"
            ],
            "correctAnswer": 0,
            "explanation": "Tanaka har kuni ertalab 6:30 da turib, poyezdda ishga boradigan namunali yapon xodimi tasvirlangan."
        }
    ]
}
