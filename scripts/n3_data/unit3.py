# -*- coding: utf-8 -*-
"""
JLPT N3 Unit 3: Keigo System, Intermediate Kanji & Quick Response Choukai
Lessons 11-15 (10 authentic exercises per lesson = 50 exercises total)
"""

UNIT3_EXERCISES = {
    # ----------------------------------------------------
    # Lesson 11: Keigo 1: Honorific Language (尊敬語 - Sonkeigo)
    # ----------------------------------------------------
    "ja-n3-u3-l1": [
        {
            "id": "ja-n3-u3-l1-ex-1",
            "type": "multiple-choice",
            "prompt": "«Ustoz, bu kitobni o'qib chiqdingizmi?» (尊敬語 - Sonkeigo):",
            "options": [
                "先生[せんせい]、この 本[ほん]を もう お読[よ]みに なりましたか",
                "先生、この 本を もう 拝読[はいどく]しましたか",
                "先生、この 本を もう 読まれましたか (qisman hurmat, lekin お読みになる aniqroq)",
                "先生、この 本を もう 読まさせましたか"
            ],
            "correctAnswer": 0,
            "explanation": "To'liq Sonkeigo shakli: お + fe'l o'zagi + になる (お読みになりましたか)."
        },
        {
            "id": "ja-n3-u3-l1-ex-2",
            "type": "multiple-choice",
            "prompt": "«Mijoz xonaga kirdilar / keldilar» (行く/来る ning maxsus Sonkeigo shakli):",
            "options": [
                "お客様[きゃくさま]が 部屋[へや]に いらっしゃいました",
                "お客様が 部屋に 参[まい]りました",
                "お客様が 部屋に おりました",
                "お客様が 部屋に 伺[うかが]いました"
            ],
            "correctAnswer": 0,
            "explanation": "Boshqa hurmatli shaxsning kelishi/borishi/bo'lishi: いらっしゃる (Irassharu)."
        },
        {
            "id": "ja-n3-u3-l1-ex-3",
            "type": "multiple-choice",
            "prompt": "«Ovqatlanmoq» (食べる/飲む) fe'lining maxsus Sonkeigo hurmat shakli qaysi?",
            "options": [
                "召[め]し上[あ]がる (Meshiaagaru)",
                "いただく (Itadaku)",
                "お食べする",
                "ご飲食する"
            ],
            "correctAnswer": 0,
            "explanation": "Boshqa hurmatli kishining taom tanovul qilishi: 召し上がる. (いただく esa o'zi tanovul qilgandagi kamtarlik shakli)."
        },
        {
            "id": "ja-n3-u3-l1-ex-4",
            "type": "multiple-choice",
            "prompt": "«Kompaniya rahbari kechagi majlisda shunday dedilar» (言う ning Sonkeigo shakli):",
            "options": [
                "社長[しゃちょう]が そう おっしゃいました",
                "社長が そう 申[もう]しました",
                "社長が そう 存[ぞん]じました",
                "社長が そう 参[まい]りました"
            ],
            "correctAnswer": 0,
            "explanation": "Hurmatli kishining gapirishi: おっしゃる (おっしゃいました)."
        },
        {
            "id": "ja-n3-u3-l1-ex-5",
            "type": "multiple-choice",
            "prompt": "«Ushbu yangilikdan xabardormisiz (bilasizmi)?» savoli:",
            "options": [
                "その ニュースを ご存知[ぞんじ]ですか",
                "その ニュースを 存じて いますか",
                "その ニュースを 知って おりますか",
                "その ニュースを 存じ上げますか"
            ],
            "correctAnswer": 0,
            "explanation": "Qarshidagi kishining bilishi: ご存知ですか (Gozonji desu ka)."
        },
        {
            "id": "ja-n3-u3-l1-ex-6",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「部長[ぶちょう]は　＿＿　＿＿　★　＿＿　なられました。」",
            "options": ["1: 新幹線[しんかんせん]で", "2: 出張[しゅっちょう]に", "3: 大阪[おおさか]へ", "4: お出[で]かけに"],
            "correctAnswer": 3,
            "explanation": "To'g'ri tartib: 「部長は 新幹線で (1) 大阪へ (3) 出張に (2) お出かけに (4★) なられました。」 Yulduzcha 4-variantdagi お出かけに ga to'g'ri keladi."
        },
        {
            "id": "ja-n3-u3-l1-ex-7",
            "type": "multiple-choice",
            "prompt": "«Qilmoq» (する) fe'lining maxsus Sonkeigo shakli qaysi?",
            "options": ["なさる (なさいます)", "いたす (いたします)", "おしになる", "される (oddiy majhul)"],
            "correctAnswer": 0,
            "explanation": "Hurmatli kishining biror amalni bajarishi: なさる (Nasaru / なさいます)."
        },
        {
            "id": "ja-n3-u3-l1-ex-8",
            "type": "multiple-choice",
            "prompt": "«Marhamat, biroz kuting» xushmuomala xizmat ko'rsatish tili:",
            "options": [
                "少々[しょうしょう] お待[ま]ち ください",
                "少々 待たれて ください",
                "少々 お待ちに なって ください",
                "少々 待ってくださいませ"
            ],
            "correctAnswer": 0,
            "explanation": "Standart iltimos hurmat shakli: お + fe'l o'zagi + ください (お待ちください)."
        },
        {
            "id": "ja-n3-u3-l1-ex-9",
            "type": "multiple-choice",
            "prompt": "«Ko'rmoq» (見る) fe'lining maxsus Sonkeigo shakli qaysi?",
            "options": ["ご覧[らん]に なる", "拝見[はいけん]する", "お見えになる", "見られる"],
            "correctAnswer": 0,
            "explanation": "Hurmatli kishining tomosha qilishi / ko'rishi: ご覧になる (Goran ni naru)."
        },
        {
            "id": "ja-n3-u3-l1-ex-10",
            "type": "multiple-choice",
            "prompt": "«Ustoz allaqachon uyga qaytib ketdilar»:",
            "options": [
                "先生[せんせい]は もう お帰[かえ]りに なりました",
                "先生は もう お帰りに しました",
                "先生は もう 帰らせられました",
                "先生は もう 帰って いただきました"
            ],
            "correctAnswer": 0,
            "explanation": "Qaytish hurmati: お帰りに なりました."
        }
    ],

    # ----------------------------------------------------
    # Lesson 12: Keigo 2: Humble Language (謙譲語 - Kenjougo)
    # ----------------------------------------------------
    "ja-n3-u3-l2": [
        {
            "id": "ja-n3-u3-l2-ex-1",
            "type": "multiple-choice",
            "prompt": "Kamtarlik (謙譲語 - Kenjougo) tilining asosiy vazifasi nima?",
            "options": [
                "So'zlovchining o'zini yoki o'z oila/kompaniya a'zolarining harakatini kamsitib, suhbatdoshni yuksaltirish",
                "Faqat uchinchi begona odamlarni maqtaganda ishlatish",
                "Do'stlar orasida hazillashib gapirish",
                "Qat'iy buyruq berish"
            ],
            "correctAnswer": 0,
            "explanation": "Kenjougo (kamtarlik tili): so'zlovchi o'z harakatini ehtirom bilan pastlatadi, shu orqali tinglovchiga chuqur hurmat bildiradi."
        },
        {
            "id": "ja-n3-u3-l2-ex-2",
            "type": "multiple-choice",
            "prompt": "«Ertaga soat 10 da idorangizga boraman» (行く/来る ning Kenjougo shakli):",
            "options": [
                "明日[あした] 10時[じゅうじ]に そちらへ 伺[うかが]います (参[まい]ります)",
                "明日 10時に そちらへ いらっしゃいます",
                "明日 10時に そちらへ おいでに なります",
                "明日 10時に そちらへ 行かれます"
            ],
            "correctAnswer": 0,
            "explanation": "Boshqa hurmatli shaxsning huzuriga borish: 伺う (Ukagau) yoki 参る (Mairu)."
        },
        {
            "id": "ja-n3-u3-l2-ex-3",
            "type": "multiple-choice",
            "prompt": "«Mening ismim Alisher deb ataladi» (言う ning Kenjougo shakli):",
            "options": [
                "アリシェルと 申[もう]します",
                "アリシェルと おっしゃいます",
                "アリシェルと 言われます",
                "アリシェルで いらっしゃいます"
            ],
            "correctAnswer": 0,
            "explanation": "O'zini yoki o'zining aytgan gapini kamtarlik bilan bildirish: 〜と申します."
        },
        {
            "id": "ja-n3-u3-l2-ex-4",
            "type": "multiple-choice",
            "prompt": "«Ustozingiz yuborgan xatni ehtirom bilan o'qib chiqdim» (読む ning Kenjougo shakli):",
            "options": [
                "お手紙[てがみ]を 拝読[はいどく]いたしました",
                "お手紙を お読みになりました",
                "お手紙を ご覧になりました",
                "お手紙を 読まれました"
            ],
            "correctAnswer": 0,
            "explanation": "Hurmatli kishining xati yoki asarini o'qish: 拝読する (Haidoku suru)."
        },
        {
            "id": "ja-n3-u3-l2-ex-5",
            "type": "multiple-choice",
            "prompt": "«Sizga biror narsada yordam beraymi?» xushmuomala Kenjougo taklifi:",
            "options": [
                "何[なに]か お手伝[てつだ]い いたしましょうか (お持ちしましょうか)",
                "何か お手伝い になりましょうか",
                "何か お手伝い なさいますか",
                "何か お手伝い されますか"
            ],
            "correctAnswer": 0,
            "explanation": "Kamtarlik bilan xizmat taklif qilish: お + o'zak + する / いたす (お手伝いいたしましょうか)."
        },
        {
            "id": "ja-n3-u3-l2-ex-6",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「明日[あした]の　＿＿　＿＿　★　＿＿　存[ぞん]じます。」",
            "options": ["1: 参[まい]りたいと", "2: 喜[よろこ]んで", "3: パーティーには", "4: ぜひ"],
            "correctAnswer": 0,
            "explanation": "To'g'ri tartib: 「明日の パーティーには (3) ぜひ (4) 喜んで (2) 参りたいと (1★) 存じます。」 Yulduzcha 1-variantdagi 参りたいと ga to'g'ri keladi."
        },
        {
            "id": "ja-n3-u3-l2-ex-7",
            "type": "multiple-choice",
            "prompt": "«Mijozning hujjatlarini ko'rib chiqdim» (見る ning Kenjougo shakli):",
            "options": [
                "資料[しりょう]を 拝見[はいけん]いたしました",
                "資料を ご覧になりました",
                "資料を お見えになりました",
                "資料を 見られました"
            ],
            "correctAnswer": 0,
            "explanation": "So'zlovchining o'zi ehtirom bilan ko'rishi: 拝見する (Haiken suru)."
        },
        {
            "id": "ja-n3-u3-l2-ex-8",
            "type": "multiple-choice",
            "prompt": "«Men bu kompaniyada 5 yildan beri ishlab kelyapman» (いる ning Kenjougo shakli):",
            "options": [
                "この 会社[かいしゃ]に 5年[ごねん] おります",
                "この 会社に 5年 いらっしゃいます",
                "この 会社に 5年 参ります",
                "この 会社に 5年 なさいます"
            ],
            "correctAnswer": 0,
            "explanation": "So'zlovchining o'zining bo'lishi / istiqomat qilishi (いる ning kamtarligi): おる (Oru / おります)."
        },
        {
            "id": "ja-n3-u3-l2-ex-9",
            "type": "multiple-choice",
            "prompt": "Biznes odobi: Mijoz qo'ng'iroq qilib rahbaringizni so'raganda qanday javob berish to'g'ri?",
            "options": [
                "「田中[たなか]は ただいま 外出[がいしゅつ]して おります」",
                "「田中社長は いらっしゃいません」 (xato, begona oldida o'z boshlig'iga sonkeigo qilinmaydi)",
                "「田中様は 出かけて おられます」 (xato)",
                "「田中社長は 参られました」 (xato)"
            ],
            "correctAnswer": 0,
            "explanation": "Yapon biznes etiketida kompaniyadan tashqaridagi shaxs (Uchi vs Soto) bilan gaplashganda, o'z rahbariga «〜さん» yoki «社長» unvoni qo'shilmaydi va faqat kamtarlik fe'li ishlatiladi: 「田中はただいま外出しております」."
        },
        {
            "id": "ja-n3-u3-l2-ex-10",
            "type": "multiple-choice",
            "prompt": "«Uchrashmoq» (会う) fe'lining Kenjougo shakli qaysi?",
            "options": [
                "お目[め]に かかる",
                "ご覧になる",
                "お会いになられる",
                "いらっしゃる"
            ],
            "correctAnswer": 0,
            "explanation": "Hurmatli kishi bilan ko'rishish: お目にかかる (Ome ni kakaru / お目にかかれて光栄です)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 13: N3 Intermediate Kanji: Abstract Concepts & Economy (経済, 政治, 影響, 関係, 相談)
    # ----------------------------------------------------
    "ja-n3-u3-l3": [
        {
            "id": "ja-n3-u3-l3-ex-1",
            "type": "multiple-choice",
            "prompt": "«Ta'sir / oqibat» ma'nosidagi «影響» kanjisi qanday o'qiladi?",
            "options": ["えいきょう", "けいきょう", "えいこう", "えいごう"],
            "correctAnswer": 0,
            "explanation": "影 (えい - soya) + 響 (きょう - sado/aks-sado) = 影響 (えいきょう - Ta'sir ko'rsatish)."
        },
        {
            "id": "ja-n3-u3-l3-ex-2",
            "type": "multiple-choice",
            "prompt": "«Iqtisodiyot» (経済) va «Siyosat» (政治) so'zlarining to'g'ri o'qilishlari qaysi?",
            "options": [
                "けいざい (Keizai) / せいじ (Seiji)",
                "せいじ / けいざい",
                "けいざい / せいざい",
                "けいし / せいじ"
            ],
            "correctAnswer": 0,
            "explanation": "経済 (けいざい - Iqtisodiyot), 政治 (せいじ - Siyosat)."
        },
        {
            "id": "ja-n3-u3-l3-ex-3",
            "type": "multiple-choice",
            "prompt": "«Munosabat, aloqa» ma'nosidagi «関係» kanjisi qanday o'qiladi?",
            "options": ["かんけい", "かんさい", "かんれん", "せきけい"],
            "correctAnswer": 0,
            "explanation": "関 (かん) + 係 (けい) = 関係 (かんけい - Aloqa, o'zaro bog'liqlik)."
        },
        {
            "id": "ja-n3-u3-l3-ex-4",
            "type": "multiple-choice",
            "prompt": "«Xalqaro munosabatlar» jumlasi kanjida qanday yoziladi?",
            "options": ["国際関係[こくさいかんけい]", "国際政治[こくさいせいじ]", "国際経済[こくさいけいざい]", "国際社会[こくさいしゃかい]"],
            "correctAnswer": 0,
            "explanation": "国際 (こくさい - xalqaro) + 関係 (かんけい - munosabatlar)."
        },
        {
            "id": "ja-n3-u3-l3-ex-5",
            "type": "multiple-choice",
            "prompt": "«Maslahatlashmoq» ma'nosidagi «相談» kanjisi qanday o'qiladi?",
            "options": ["そうだん", "しょうだん", "あうだん", "そうたん"],
            "correctAnswer": 0,
            "explanation": "相 (そう - o'zaro) + 談 (だん - suhbat) = 相談 (そうだん - Maslahatlashuv)."
        },
        {
            "id": "ja-n3-u3-l3-ex-6",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「環境問題[かんきょうもんだい]は　＿＿　＿＿　★　＿＿　与[あた]えます。」",
            "options": ["1: 影響[えいきょう]を", "2: 私[わたし]たちの", "3: 生活[せいかつ]に", "4: 大[おお]きな"],
            "correctAnswer": 0,
            "explanation": "To'g'ri tartib: 「環境問題は 私たちの (2) 生活に (3) 大きな (4) 影響を (1★) 与えます。」 Yulduzcha 1-variantdagi 影響を ga to'g'ri keladi."
        },
        {
            "id": "ja-n3-u3-l3-ex-7",
            "type": "multiple-choice",
            "prompt": "«Hukumat, davlat boshqaruvi» ma'nosidagi «政府» so'zi qanday o'qiladi?",
            "options": ["せいふ", "せいぶ", "しょうふ", "せいき"],
            "correctAnswer": 0,
            "explanation": "政 (せい - siyosat) + 府 (ふ - mahkama) = 政府 (せいふ - Hukumat)."
        },
        {
            "id": "ja-n3-u3-l3-ex-8",
            "type": "multiple-choice",
            "prompt": "«Qaror, o'zaro kelishuv» ma'nosidagi «決定» so'zi qanday o'qiladi?",
            "options": ["けってい", "けつてい", "さだてい", "けっとう"],
            "correctAnswer": 0,
            "explanation": "決 (けつ -> けっ) + 定 (てい) = 決定 (けってい - Qaror, qat'iy to'xtam)."
        },
        {
            "id": "ja-n3-u3-l3-ex-9",
            "type": "multiple-choice",
            "prompt": "«Savdo-sotiq, biznes bitimi» ma'nosidagi «商談» qanday o'qiladi?",
            "options": ["しょうだん", "あきなだん", "しょうたん", "そうだん"],
            "correctAnswer": 0,
            "explanation": "商 (しょう - savdo) + 談 (だん) = 商談 (しょうだん - Tijoriy muzokara)."
        },
        {
            "id": "ja-n3-u3-l3-ex-10",
            "type": "multiple-choice",
            "prompt": "«Jamiyat a'zosi, mustaqil ishlayotgan inson» yapon tilida nima deyiladi?",
            "options": ["社会人[しゃかいじん]", "経済人[けいざいじん]", "政治家[せいじか]", "専門家[せんもんか]"],
            "correctAnswer": 0,
            "explanation": "社会人 (しゃかいじん) — o'qishni tugatib, mustaqil ishlab jamiyatga qo'shilgan fuqaro."
        }
    ],

    # ----------------------------------------------------
    # Lesson 14: N3 Intermediate Kanji: Nature, Weather & Disasters (地震, 台風, 気温, 変化, 被害)
    # ----------------------------------------------------
    "ja-n3-u3-l4": [
        {
            "id": "ja-n3-u3-l4-ex-1",
            "type": "multiple-choice",
            "prompt": "«Zilzila» (地震) va «Tayfun» (台風) so'zlarining to'g'ri o'qilishlari qaysi?",
            "options": [
                "じしん (Jishin) / たいふう (Taifuu)",
                "ちしん / だいふう",
                "じしん / たいう",
                "ちじん / たいふう"
            ],
            "correctAnswer": 0,
            "explanation": "地震 (じしん - Zilzila), 台風 (たいふう - Tayfun)."
        },
        {
            "id": "ja-n3-u3-l4-ex-2",
            "type": "multiple-choice",
            "prompt": "«Zarar, talafot» ma'nosidagi «被害» kanjisi qanday o'qiladi?",
            "options": ["ひがい", "ひかい", "そんがい", "ひがいしゃ"],
            "correctAnswer": 0,
            "explanation": "被 (ひ - duchor bo'lmoq) + 害 (がい - zarar) = 被害 (ひがい - Talafot, zarar ko'rish)."
        },
        {
            "id": "ja-n3-u3-l4-ex-3",
            "type": "multiple-choice",
            "prompt": "«Havo harorati» «気温» va «O'zgarish» «変化» so'zlari qanday o'qiladi?",
            "options": [
                "きおん (Kion) / へんか (Henka)",
                "きおん / へんけい",
                "てんおん / へんか",
                "きおん / へんげ"
            ],
            "correctAnswer": 0,
            "explanation": "気温 (きおん - Havo temperaturasi), 変化 (へんか - O'zgarish, transformatsiya)."
        },
        {
            "id": "ja-n3-u3-l4-ex-4",
            "type": "multiple-choice",
            "prompt": "«Tsunami (katta to'lqin)» yapon tilida qaysi kanji bilan yoziladi?",
            "options": ["津波[つなみ]", "強波[つよなみ]", "海波[うみなみ]", "大水[おおみず]"],
            "correctAnswer": 0,
            "explanation": "津 (つ - port/qirg'oq) + 波 (なみ - to'lqin) = 津波 (つなみ - Tsunami)."
        },
        {
            "id": "ja-n3-u3-l4-ex-5",
            "type": "multiple-choice",
            "prompt": "«Tabiiy ofat» so'zi «自然災害» qanday o'qiladi?",
            "options": ["しぜんさいがい", "じぜんさいがい", "しぜんさいなん", "しぜんわざわい"],
            "correctAnswer": 0,
            "explanation": "自然 (しぜん - tabiat) + 災害 (さいがい - ofat/falokat) = 自然災害 (Tabiiy ofat)."
        },
        {
            "id": "ja-n3-u3-l4-ex-6",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「台風[たいふう]の　＿＿　＿＿　★　＿＿　出[で]ました。」",
            "options": ["1: 大[おお]きな", "2: 各地[かくち]で", "3: 影響[えいきょう]で", "4: 被害[ひがい]が"],
            "correctAnswer": 0,
            "explanation": "To'g'ri tartib: 「台風の 影響で (3) 各地で (2) 大きな (1★) 被害が (4) 出ました。」 Yulduzcha 1-variantdagi 大きな ga to'g'ri keladi."
        },
        {
            "id": "ja-n3-u3-l4-ex-7",
            "type": "multiple-choice",
            "prompt": "«G'ayritabiiy / noodatiy ob-havo» «異常気象» qanday o'qiladi?",
            "options": ["いじょうきしょう", "ことじょうきしょう", "いじょうてんき", "いじょうきこう"],
            "correctAnswer": 0,
            "explanation": "異常 (いじょう - noodatiy/anomal) + 気象 (きしょう - meteorologik hodisa)."
        },
        {
            "id": "ja-n3-u3-l4-ex-8",
            "type": "multiple-choice",
            "prompt": "«Evakuatsiya, xavfsiz joyga ko'chish» ma'nosidagi «避難» qanday o'qiladi?",
            "options": ["ひなん", "さけなん", "ひぜん", "ひなんじょ"],
            "correctAnswer": 0,
            "explanation": "避 (ひ - qochmoq) + 難 (なん - qiyinchilik) = 避難 (ひなん - Xavfsiz joyga evakuatsiya)."
        },
        {
            "id": "ja-n3-u3-l4-ex-9",
            "type": "multiple-choice",
            "prompt": "«Zarar ko'rgan jabrlanuvchi» yapon tilida nima deyiladi?",
            "options": ["被害者[ひがいしゃ]", "関係者[かんけいしゃ]", "案内者[あんないしゃ]", "保護者[ほごしゃ]"],
            "correctAnswer": 0,
            "explanation": "被害 (zarar) + 者 (shaxs) = 被害者 (Jabrlanuvchi)."
        },
        {
            "id": "ja-n3-u3-l4-ex-10",
            "type": "multiple-choice",
            "prompt": "«Global isish (sayyora harorati ko'tarilishi)» atamasi qaysi?",
            "options": ["地球温暖化[ちきゅうおんだんか]", "大気汚染[たいきおせん]", "環境破壊[かんきょうはかい]", "異常現象[いじょうげんしょう]"],
            "correctAnswer": 0,
            "explanation": "地球 (yer shari) + 温暖化 (iliqlashish) = 地球温暖化 (Global isish)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 15: N3 Choukai: Quick Response (即時応答) Mastery
    # ----------------------------------------------------
    "ja-n3-u3-l5": [
        {
            "id": "ja-n3-u3-l5-e1",
            "type": "multiple-choice",
            "audioUrl": "/audio/choukai/n3/40 Track 40.mp3",
            "prompt": "【聴解[ちょうかい]・即時応答[そくじおうとう]】\nAudioni tinglang va savolga eng to'g'ri, tabiiy javobni tanlang:",
            "options": [
                "ええ、ぜひ お願[ねが]いします",
                "いいえ、行[い]きませんでした",
                "はい、知[し]って います",
                "どういたしまして"
            ],
            "correctAnswer": 0,
            "explanation": "Taklifga javoban muloyim rozilik: 「ええ、ぜひお願いします」 (Ha, albatta mamnuniyat bilan)."
        },
        {
            "id": "ja-n3-u3-l5-ex-2",
            "type": "multiple-choice",
            "prompt": "Vaziyat: Hamkasbingiz «この 書類[しょるい]、今日中[きょうじゅう]に チェックして おいて くれる？» dedi. Qaysi javob eng mos?",
            "options": [
                "了解[りょうかい]！ すぐに やって おくね",
                "いいえ、チェックしませんでした",
                "もう 終わって いましたよ",
                "どうも ありがとう"
            ],
            "correctAnswer": 0,
            "explanation": "Tengdosh hamkasbning iltimosiga javob: 了解！すぐにやっておくね (Tushunarli! Darhol qilib qo'yaman)."
        },
        {
            "id": "ja-n3-u3-l5-ex-3",
            "type": "multiple-choice",
            "prompt": "Vaziyat: Boshliq sizga «お茶[ちゃ]でも いかがですか» dedi. Qaysi javob odob me'yoriga mos?",
            "options": [
                "ありがとうございます。では、遠慮[えんりょ]なく いただきます",
                "いいえ、飲みたくないです",
                "自分で いれます",
                "お大事に"
            ],
            "correctAnswer": 0,
            "explanation": "Kattalarning taklifini qabul qilishda: 「ありがとうございます。では、遠慮なくいただきます」 (Rahmat, bemalol tanovul qilaman)."
        },
        {
            "id": "ja-n3-u3-l5-ex-4",
            "type": "multiple-choice",
            "prompt": "Vaziyat: «昨日[きのう]の コンサート、どうだった？» savoliga to'g'ri javob:",
            "options": [
                "思[おも]って いたより ずっと 感動的[かんどうてき]だったよ！",
                "明日 行く つもりだよ",
                "チケットが 高かった らしいよ",
                "コンサートへ 行きなさい"
            ],
            "correctAnswer": 0,
            "explanation": "O'tgan voqea taassuroti: 思っていたよりずっと感動的だったよ! (O'ylaganimdan ancha ta'sirli bo'ldi)."
        },
        {
            "id": "ja-n3-u3-l5-ex-5",
            "type": "multiple-choice",
            "prompt": "Vaziyat: Suhbatdoshingiz «大変[たいへん]お待[ま]たせして 申[もう]し訳[わけ]ありませんでした» dedi. Siz nima deb javob berasiz?",
            "options": [
                "いいえ、私も 今[いま] 来[き]た ところですから、お気[き]になさらないで ください",
                "本当に 遅く なりましたね",
                "もっと 早く 来てください",
                "かしこまりました"
            ],
            "correctAnswer": 0,
            "explanation": "Kechikib uzr so'ragan kishiga xushmuomala yupatish: 「いいえ、私も今来たところですから、お気になさらないでください」 (Hechqisi yo'q, men ham endi kelgandim, xavotir olmang)."
        },
        {
            "id": "ja-n3-u3-l5-ex-6",
            "type": "multiple-choice",
            "prompt": "Vaziyat: «明日[あした]の プレゼン、緊張[きんちょう]するなあ...» degan do'stingizga qanday dalda berasiz?",
            "options": [
                "しっかり 準備[じゅんび]したんだから、きっと 大丈夫[だいじょうぶ]だよ！",
                "絶対に 失敗するよ",
                "早く 諦めなさい",
                "プレゼンを やめれば いいよ"
            ],
            "correctAnswer": 0,
            "explanation": "Do'stona dalda: しっかり準備したんだから、きっと大丈夫だよ! (Yaxshi tayyorlangansan, albatta hammasi zo'r bo'ladi)."
        },
        {
            "id": "ja-n3-u3-l5-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「もし　＿＿　＿＿　★　＿＿　連絡[れんらく]して ください。」",
            "options": ["1: 時間[じかん]に", "2: 遅[おく]れそうなら、", "3: 事前[じぜん]に", "4: 約束[やくそく]の"],
            "correctAnswer": 1,
            "explanation": "To'g'ri tartib: 「もし 約束の (4) 時間に (1) 遅れそうなら、(2★) 事前に (3) 連絡してください。」 Yulduzcha 2-variantdagi 遅れそうなら ga to'g'ri keladi."
        },
        {
            "id": "ja-n3-u3-l5-ex-8",
            "type": "multiple-choice",
            "prompt": "Vaziyat: Telefon suhbati yakunida siz «失礼[しつれい]いたします» deyishdan oldin nima deysiz?",
            "options": [
                "お忙[いそが]しい ところ、お時間[じかん]を いただき ありがとう ございました",
                "もう 切りますね",
                "では、さようなら",
                "また 電話しろよ"
            ],
            "correctAnswer": 0,
            "explanation": "Rasmiy qo'ng'iroq yakunida vaqt ajratgani uchun minnatdorlik: 「お忙しいところ、お時間をいただきありがとうございました」."
        },
        {
            "id": "ja-n3-u3-l5-ex-9",
            "type": "multiple-choice",
            "prompt": "Vaziyat: «プロジェクトが 成功[せいこう]して、本当[ほんとう]に よかったですね！» ga javoban:",
            "options": [
                "ええ、皆様[みなさま]の おかげです。心[こころ]から 感謝[かんしゃ]して おります",
                "いいえ、だめでした",
                "当然[とうぜん]の 結果です",
                "おめでとう ございます (o'ziga o'zi aytilmaydi)"
            ],
            "correctAnswer": 0,
            "explanation": "Kamtarlik bilan jamoaga minnatdorlik: 「ええ、皆様のおかげです」."
        },
        {
            "id": "ja-n3-u3-l5-ex-10",
            "type": "multiple-choice",
            "prompt": "Vaziyat: Hamkasbingiz ketayotib «お先[さき]に 失礼[しつれい]します» dedi. Siz nima deb javob berasiz?",
            "options": [
                "お疲[つか]れ様[さま]でした！",
                "いってらっしゃい！",
                "おかえりなさい！",
                "いただきます！"
            ],
            "correctAnswer": 0,
            "explanation": "Ishdan avval ketayotgan kishiga beriladigan standart javob: 「お疲れ様でした！」."
        }
    ]
}
