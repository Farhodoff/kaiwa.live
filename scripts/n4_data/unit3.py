# -*- coding: utf-8 -*-
"""
JLPT N4 Unit 3: Potential Form, Giving/Receiving, Kanji Mastery, Transit Audio
Lessons 11-15 (15 authentic exercises per lesson = 75 exercises total)
"""

UNIT3_EXERCISES = {
    # ----------------------------------------------------
    # Lesson 11: Potential Form: 〜ことができる vs 〜(ら)れる (Ability & Possibility)
    # ----------------------------------------------------
    "ja-n4-u3-l1": [
        {
            "id": "ja-n4-u3-l1-ex-1",
            "type": "multiple-choice",
            "prompt": "1-guruh «yozmoq» 「書[か]きます」fe'lining imkoniyat (potential) shakli qaysi?",
            "options": ["書[か]ける", "書[か]かれる", "書[か]かせる", "書[か]きられる"],
            "correctAnswer": 0,
            "explanation": "1-guruh fe'llarining imkoniyat shaklida 'i' tovushi 'e' tovushiga o'zgaradi va る qo'shiladi: 書きます -> 書ける (Yozolmoq)."
        },
        {
            "id": "ja-n4-u3-l1-ex-2",
            "type": "multiple-choice",
            "prompt": "2-guruh «yemoq» 「食[た]べます」fe'lining to'g'ri imkoniyat shakli qaysi?",
            "options": ["食[た]べられる", "食[た]べれる", "食[た]べせる", "食[た]ばれる"],
            "correctAnswer": 0,
            "explanation": "2-guruh fe'llarida ます olib tashlanib, られる qo'shiladi: 食べます -> 食べられる (Yeyolmoq)."
        },
        {
            "id": "ja-n4-u3-l1-ex-3",
            "type": "multiple-choice",
            "prompt": "3-guruh «kelmoq» 「来[き]ます」 va «qilmoq» 「します」fe'llarining imkoniyat shakllari qaysilar?",
            "options": [
                "来[こ]られる / できる",
                "来[き]られる / しられる",
                "来[く]れる / せる",
                "来[こ]れる / しれる"
            ],
            "correctAnswer": 0,
            "explanation": "Tartibsiz fe'llarning imkoniyat shakli: 来ます -> 来られる (Korareru - kela olmoq), します -> できる (Dekiru - qila olmoq)."
        },
        {
            "id": "ja-n4-u3-l1-ex-4",
            "type": "multiple-choice",
            "prompt": "Imkoniyat fe'li bilan gap tuzilganda ob'ekt zarrachasi ko'pincha を dan qaysi zarrachaga o'zgaradi?",
            "options": ["が", "に", "で", "へ"],
            "correctAnswer": 0,
            "explanation": "Imkoniyat fe'llari (可能動詞) bilan to'ldiruvchi odatda が zarrachasini oladi: 漢字を書く -> 漢字が書ける."
        },
        {
            "id": "ja-n4-u3-l1-ex-5",
            "type": "multiple-choice",
            "prompt": "«Men yapon tilida gaplasha olaman» jumlasi qaysi?",
            "options": [
                "私[わたし]は 日本語[にほんご]が 話[はな]せます",
                "私は 日本語が 話されます",
                "私は 日本語を 話します",
                "私は 日本語が 話させます"
            ],
            "correctAnswer": 0,
            "explanation": "話します -> 話せます (Gapira olaman). Zarracha: が."
        },
        {
            "id": "ja-n4-u3-l1-ex-6",
            "type": "multiple-choice",
            "prompt": "«Ko'zga tabiiy ko'rinmoq» (tabiiy holat) va «imkoni bo'lib ko'rmoq» o'rtasidagi farq qaysi?",
            "options": [
                "「見[み]える」 — o'z-o'zidan ko'rinmoq; 「見[み]られる」 — ko'rish imkoniyatiga ega bo'lmoq",
                "«見える» odamlar uchun, «見られる» buyumlar uchun",
                "Ikkalasi ham aynan bir xil",
                "«見える» o'tgan zamon, «見られる» kelasi zamon"
            ],
            "correctAnswer": 0,
            "explanation": "見える: harakat qilmasdan tabiiy ko'zga tashlanish (Fuji tog'i ko'rinib turibdi). 見られる: sharoit yoki ixtiyor orqali ko'rish imkoni borligi (kinoni ko'ra olaman)."
        },
        {
            "id": "ja-n4-u3-l1-ex-7",
            "type": "multiple-choice",
            "prompt": "«Tashqaridan musiqa ovozi eshitilyapti» (quloqqa tabiiy chalinyapti) ifodasi qaysi?",
            "options": [
                "外[そと]から 音楽[おんがく]が 聞[き]こえます",
                "外から 音楽が 聞けます",
                "外から 音楽を 聞きます",
                "外から 音楽が 聞かれます"
            ],
            "correctAnswer": 0,
            "explanation": "Ixtiyorsiz quloqqa eshitilish: 聞こえる (Kikoeru). Ixtiyoriy eshita olish esa: 聞ける (Kikeru)."
        },
        {
            "id": "ja-n4-u3-l1-ex-8",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「私[わたし]は　＿＿　＿＿　★　＿＿　泳[およ]げません。」",
            "options": ["1: 全然[ぜんぜん]", "2: 水[みず]が", "3: 怖[こわ]くて", "4: 泳[およ]ぎが"],
            "correctAnswer": 0,
            "explanation": "To'g'ri tartib: 「私は 水が (2) 怖くて (3) 全然 (1★) 泳げません。」 Yulduzcha 1-variantdagi 全然 ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u3-l1-ex-9",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos shaklni tanlang:\n「この スーパーでは クレジットカードが （　　）。」",
            "options": ["使[つか]えます", "使います", "使われます", "使わせます"],
            "correctAnswer": 0,
            "explanation": "Kredit karta ishlatish imkoniyati bor: 使います -> 使えます (Tsukaemasu)."
        },
        {
            "id": "ja-n4-u3-l1-ex-10",
            "type": "multiple-choice",
            "prompt": "«Bugun vaqtim bor, shuning uchun kino ko'ra olaman» jumlasi qaysi?",
            "options": [
                "今日[きょう]は 時間[じかん]が あるので、映画[えいが]が 見[み]られます",
                "今日は 時間があるので、映画が 見えます",
                "今日は 時間があるので、映画を 見させます",
                "今日は 時間があるので、映画が 見てあります"
            ],
            "correctAnswer": 0,
            "explanation": "Sharoit imkon bergani uchun ko'rish: 見られます (Miraremasu)."
        },
        {
            "id": "ja-n4-u3-l1-ex-11",
            "type": "multiple-choice",
            "prompt": "«Men xom baliq (sashimi) yeya olmayman» jumlasi qaysi?",
            "options": [
                "私[わたし]は 刺身[さしみ]が 食[た]べられません",
                "私は 刺身が 食べません",
                "私は 刺身が 食べさせません",
                "私は 刺身が 食べたいです"
            ],
            "correctAnswer": 0,
            "explanation": "Imkoniyatsizlik: 食べられません."
        },
        {
            "id": "ja-n4-u3-l1-ex-12",
            "type": "multiple-choice",
            "prompt": "«Piyoda borsa bo'ladimi?» savoli qanday beriladi?",
            "options": [
                "歩[ある]いて 行[い]けますか",
                "歩いて 行きますか",
                "歩いて 行かれますか",
                "歩いて 行かせますか"
            ],
            "correctAnswer": 0,
            "explanation": "Bora oladimi: 行きます -> 行けますか (Ikemasu ka)."
        },
        {
            "id": "ja-n4-u3-l1-ex-13",
            "type": "multiple-choice",
            "prompt": "«Yangi metro bekati bitgach, qatnov ancha qulay bo'ldi» ma'nosidagi «qurib bitkazilmoq (paydo bo'lmoq)» fe'li qaysi?",
            "options": [
                "駅[えき]が できました",
                "駅を しました",
                "駅が 読めました",
                "駅を 作られました"
            ],
            "correctAnswer": 0,
            "explanation": "Binolar, do'konlar, yo'llar qurilib foydalanishga topshirilishi: 駅ができました."
        },
        {
            "id": "ja-n4-u3-l1-ex-14",
            "type": "multiple-choice",
            "prompt": "Quyidagi so'zlashuv shaklini (ra-nuki kotoba) aniqlang:\n«食べられる» so'zlashuv tilida ko'pincha qanday aytiladi?",
            "options": [
                "食[た]べれる",
                "食べれるん",
                "食べらる",
                "食べらてる"
            ],
            "correctAnswer": 0,
            "explanation": "Kundalik og'zaki nutqda 2-guruh imkoniyat shaklidagi 'ra' tushib qolib 'tabereru', 'koreru' deyiladi (bunga 'ra-nuki kotoba' deyiladi)."
        },
        {
            "id": "ja-n4-u3-l1-ex-15",
            "type": "multiple-choice",
            "prompt": "«Qor ko'p yoqqani sababli, samolyot ucha olmadi» qaysi javobda to'g'ri?",
            "options": [
                "雪[ゆき]が 多[おお]く 降[ふ]ったので、飛行機[ひこうき]が 飛[と]べませんでした",
                "雪が多く 降ったので、飛行機が 飛びませんでした",
                "雪が多く 降ったので、飛行機が 飛ぶことが ありました",
                "雪が多く 降ったので、飛行機を 飛ばせませんでした"
            ],
            "correctAnswer": 0,
            "explanation": "飛べませんでした (Ucha olmadi - imkoniyat fe'lining inkor o'tgan zamoni)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 12: Giving & Receiving: あげる, もらう, くれる (Yarimorai)
    # ----------------------------------------------------
    "ja-n4-u3-l2": [
        {
            "id": "ja-n4-u3-l2-ex-1",
            "type": "multiple-choice",
            "prompt": "«Men Tanaka xonimga gul berdim» jumlasi qaysi?",
            "options": [
                "私[わたし]は 田中[たなか]さんに 花[はな]を あげました",
                "私は 田中さんに 花を もらいました",
                "田中さんは 私に 花を くれました",
                "私は 田中さんに 花を くれました"
            ],
            "correctAnswer": 0,
            "explanation": "So'zlovchi birovga narsa berganda doimo 「あげる」 ishlatiladi: 私は田中さんに花をあげました."
        },
        {
            "id": "ja-n4-u3-l2-ex-2",
            "type": "multiple-choice",
            "prompt": "DIQQAT: «Tanaka menga kitob sovg'a qildi (berdi)» jumlasi qaysi?",
            "options": [
                "田中[たなか]さんは 私[わたし]に 本[ほん]を くれました",
                "田中さんは 私に 本を あげました",
                "私は 田中さんに 本を くれました",
                "田中さんは 私から 本を あげました"
            ],
            "correctAnswer": 0,
            "explanation": "Boshqa birov so'zlovchiga (yoki uning oila a'zosiga) narsa berganda 「くれる」 ishlatiladi: 田中さんは私にくれました."
        },
        {
            "id": "ja-n4-u3-l2-ex-3",
            "type": "multiple-choice",
            "prompt": "«Men do'stimdan chiroyli soat oldim (qabul qildim)» jumlasi qaysi?",
            "options": [
                "私[わたし]は 友達[ともだち]に きれいな 時計[とけい]を もらいました",
                "私は 友達に きれいな 時計を あげました",
                "友達は 私に きれいな 時計を もらいました",
                "私は 友達から きれいな 時計を くれました"
            ],
            "correctAnswer": 0,
            "explanation": "Birovdan qabul qilib olish: 私は友達に (yoki 友達から) 時計をもらいました."
        },
        {
            "id": "ja-n4-u3-l2-ex-4",
            "type": "multiple-choice",
            "prompt": "Fe'llar bilan bog'lanish: «Men ukamga yapon tilini o'rgatib qo'ydim (yordam berdim)» (~てあげる):",
            "options": [
                "私[わたし]は 弟[おとうと]に 日本語[にほんご]を 教[おし]えて あげました",
                "私は 弟に 日本語を 教えて もらいました",
                "弟は 私に 日本語を 教えて くれました",
                "私は 弟に 日本語を 教えて いただきました"
            ],
            "correctAnswer": 0,
            "explanation": "So'zlovchi boshqa shaxs foydasiga ish bajarganda: 〜てあげる (教[おし]えてあげました)."
        },
        {
            "id": "ja-n4-u3-l2-ex-5",
            "type": "multiple-choice",
            "prompt": "«Yamada mening yukimni ko'tarib berdi (minnatdorman)» (~てくれる):",
            "options": [
                "山田[やまだ]さんは 私[わたし]の 荷物[にもつ]を 持[も]って くれました",
                "山田さんは 私の 荷物を 持って あげました",
                "私は 山田さんの 荷物を 持って くれました",
                "山田さんは 私に 荷物を 持って もらいました"
            ],
            "correctAnswer": 0,
            "explanation": "Birov so'zlovchiga yaxshilik qilganda: 〜てくれる (持ってくれました)."
        },
        {
            "id": "ja-n4-u3-l2-ex-6",
            "type": "multiple-choice",
            "prompt": "«Men ustozimdan xatoni tekshirib berishlarini iltimos qilib, tekshirtirib oldim» (~てもらう):",
            "options": [
                "私[わたし]は 先生[せんせい]に 直[なお]して もらいました",
                "先生は 私に 直して もらいました",
                "私は 先生に 直して あげました",
                "先生は 私に 直して あげました"
            ],
            "correctAnswer": 0,
            "explanation": "Birovdan xizmat yoki yordam qabul qilib olish: 私は先生に直してもらいました."
        },
        {
            "id": "ja-n4-u3-l2-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「母[はは]の　＿＿　＿＿　★　＿＿　あげました。」",
            "options": ["1: スカーフを", "2: 誕生日に", "3: 買[か]って", "4: きれいな"],
            "correctAnswer": 0,
            "explanation": "To'g'ri tartib: 「母の 誕生日に (2) きれいな (4) スカーフを (1★) 買って (3) あげました。」 Yulduzcha 1-variantdagi スカーフを ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u3-l2-ex-8",
            "type": "multiple-choice",
            "prompt": "Hurmat darajasi: Ustoz yoki boshliqdan narsa olganda «もらう» o'rniga qaysi xushmuomala fe'l ishlatiladi?",
            "options": [
                "いただく (いただきます)",
                "くださる (くださいます)",
                "やる (やります)",
                "さしあげる"
            ],
            "correctAnswer": 0,
            "explanation": "Yuqori martabali kishilardan narsa qabul qilganda kamtarlik bilan: いただく (Itadaku)."
        },
        {
            "id": "ja-n4-u3-l2-ex-9",
            "type": "multiple-choice",
            "prompt": "Hurmat darajasi: Ustoz yoki rahbar so'zlovchiga narsa berganda «くれる» o'rniga qaysi fe'l ishlatiladi?",
            "options": [
                "くださる (くださいます)",
                "いただく",
                "さしあげる",
                "あげる"
            ],
            "correctAnswer": 0,
            "explanation": "Yuqori martabali kishi berganida: くださる (Kudasaru / 先生が本をくださいました)."
        },
        {
            "id": "ja-n4-u3-l2-ex-10",
            "type": "multiple-choice",
            "prompt": "«Kim senga yapon tilini o'rgatdi?» savoli qaysi?",
            "options": [
                "だれが 日本語[にほんご]を 教[おし]えて くれたんですか",
                "だれに 日本語を 教えて あげたんですか",
                "だれが 日本語を 教えて もらったんですか",
                "だれを 日本語を 教えて くれたんですか"
            ],
            "correctAnswer": 0,
            "explanation": "Birov so'zlovchiga o'rgatganini so'rash: だれが教えてくれたんですか."
        },
        {
            "id": "ja-n4-u3-l2-ex-11",
            "type": "multiple-choice",
            "prompt": "Quyidagi jumla nega xato?\n「父[ちち]は 私[わたし]に 時計[とけい]を あげました。」",
            "options": [
                "Chunki so'zlovchiga (私に) boshqa birov berganda «あげました» emas, «くれました» ishlatilishi shart",
                "Chunki 時計 so'zi noto'g'ri",
                "Chunki に zarrachasi o'rniga で bo'lishi kerak",
                "Xato emas"
            ],
            "correctAnswer": 0,
            "explanation": "Yapon tilida hech qachon birov so'zlovchiga berishida «私にあげました» deyilmaydi; faqat «私にくれました» deyiladi."
        },
        {
            "id": "ja-n4-u3-l2-ex-12",
            "type": "multiple-choice",
            "prompt": "«Men itimga ovqat berdim» (hayvonlar yoki o'simliklarga berishda):",
            "options": [
                "犬[いぬ]に えさを やりました",
                "犬に えさを くれました",
                "犬に えさを もらいました",
                "犬に えさを いただきました"
            ],
            "correctAnswer": 0,
            "explanation": "O'simlikka suv quyish yoki hayvonga ozuqa berishda an'anaviy ravishda: やる (Yaru / やりました)."
        },
        {
            "id": "ja-n4-u3-l2-ex-13",
            "type": "multiple-choice",
            "prompt": "«Stantsiyaga mashinada olib borib qo'yaman (yetkazib qo'yaman)» mehmondo'stlik taklifi:",
            "options": [
                "車[くるま]で 駅[えき]まで 送[おく]って あげましょうか",
                "車で 駅まで 送って もらいましょうか",
                "車で 駅まで 送って くれましょうか",
                "車で 駅まで 送って くださいましょうか"
            ],
            "correctAnswer": 0,
            "explanation": "O'z yordamini taklif qilish: 〜てあげましょうか (送ってあげましょうか)."
        },
        {
            "id": "ja-n4-u3-l2-ex-14",
            "type": "multiple-choice",
            "prompt": "«Do'stim stantsiyagacha kuzatib qo'ydi» qaysi javobda to'g'ri?",
            "options": [
                "友達[ともだち]が 駅[えき]まで 送[おく]って くれました",
                "友達が 駅まで 送って あげました",
                "私は 友達に 駅まで 送って くれました",
                "友達は 私に 送って もらいました"
            ],
            "correctAnswer": 0,
            "explanation": "Do'sti unga yaxshilik qilgan: 友達が駅まで送ってくれました."
        },
        {
            "id": "ja-n4-u3-l2-ex-15",
            "type": "multiple-choice",
            "prompt": "«Kasal bo'lganimda, xonadoshim ovqat pishirib berdi» jumlasi qaysi?",
            "options": [
                "病気[びょうき]の とき、ルームメイトが ごはんを 作[つく]って くれました",
                "病気の とき、ルームメイトが ごはんを作って あげました",
                "病気の とき、ルームメイトに ごはんを作って くれました",
                "病気の とき、私が ルームメイトに 作って くれました"
            ],
            "correctAnswer": 0,
            "explanation": "Xonadoshi unga g'amxo'rlik qildi: 作ってくれました."
        }
    ],

    # ----------------------------------------------------
    # Lesson 13: N4 Kanji 1: Daily Verbs & Actions (行, 来, 帰, 買, 見, 聞, 書, 読)
    # ----------------------------------------------------
    "ja-n4-u3-l3": [
        {
            "id": "ja-n4-u3-l3-ex-1",
            "type": "multiple-choice",
            "prompt": "「旅行」 birikmasining to'g'ri o'qilishini tanlang:",
            "options": ["りょこう", "りょきょう", "ろこう", "りょごう"],
            "correctAnswer": 0,
            "explanation": "旅 (りょ - sayohat) + 行 (こう - bormoq) = 旅行 (りょこう - Sayohat)."
        },
        {
            "id": "ja-n4-u3-l3-ex-2",
            "type": "multiple-choice",
            "prompt": "«見学» so'zining to'g'ri o'qilishi va ma'nosi qaysi?",
            "options": [
                "けんがく (Kengaku) — joyiga borib o'rganish, ekskursiya",
                "みかく (Mikaku) — ko'rish qobiliyati",
                "けんまなぶ (Kenmanabu) — mustaqil ta'lim",
                "げんがく (Gengaku) — chegirma"
            ],
            "correctAnswer": 0,
            "explanation": "見 (けん - ko'rmoq) + 学 (がく - o'rganmoq) = 見学 (けんがく - ekskursiya, zavod yoki muzeyni ko'rib o'rganish)."
        },
        {
            "id": "ja-n4-u3-l3-ex-3",
            "type": "multiple-choice",
            "prompt": "«読書» birikmasi qanday o'qiladi?",
            "options": ["どくしょ", "とうしょ", "よみしょ", "どくかき"],
            "correctAnswer": 0,
            "explanation": "読 (どく) + 書 (しょ) = 読書 (どくしょ - Kitobxonlik, mutolaa)."
        },
        {
            "id": "ja-n4-u3-l3-ex-4",
            "type": "multiple-choice",
            "prompt": "«Vatanga qaytish» ma'nosidagi «帰国» kanjisi qanday o'qiladi?",
            "options": ["きこく", "かえりくに", "きごく", "けっこく"],
            "correctAnswer": 0,
            "explanation": "帰 (き) + 国 (こく) = 帰国 (きこく - O'z vataniga qaytish)."
        },
        {
            "id": "ja-n4-u3-l3-ex-5",
            "type": "multiple-choice",
            "prompt": "«Gazeta» so'zi «新聞» qanday o'qiladi?",
            "options": ["しんぶん", "あたらしぶん", "しんもん", "にゅうす"],
            "correctAnswer": 0,
            "explanation": "新 (しん - yangi) + 聞 (ぶん - eshitmoq) = 新聞 (しんぶん - Gazeta)."
        },
        {
            "id": "ja-n4-u3-l3-ex-6",
            "type": "multiple-choice",
            "prompt": "«買い物» birikmasining ma'nosi qaysi?",
            "options": [
                "Harid, bozorlik qilish",
                "Ovqat pishirish",
                "Sayr qilish",
                "Qarz olish"
            ],
            "correctAnswer": 0,
            "explanation": "買 (かい - sotib olmoq) + 物 (もの - buyum) = 買い物 (Harid, bozorlik)."
        },
        {
            "id": "ja-n4-u3-l3-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「図書館[としょかん]で　＿＿　＿＿　★　＿＿　借[か]りました。」",
            "options": ["1: 日本語[にほんご]の", "2: 面白[おもしろ]い", "3: 本[ほん]を", "4: 読[よ]むために"],
            "correctAnswer": 2,
            "explanation": "To'g'ri tartib: 「日本語の (1) 読むために / 面白い (2) 本を (3★) 借りました。」 Yulduzcha 3-variantdagi 本を ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u3-l3-ex-8",
            "type": "multiple-choice",
            "prompt": "«Kelasi hafta» «来週» qanday o'qiladi?",
            "options": ["らいしゅう", "こしゅう", "きしゅう", "くしゅう"],
            "correctAnswer": 0,
            "explanation": "来 (らい) + 週 (しゅう) = 来週 (らいしゅう - Kelasi hafta)."
        },
        {
            "id": "ja-n4-u3-l3-ex-9",
            "type": "multiple-choice",
            "prompt": "«Ertaga do'stim mehmonga keladi» jumlasi kanjida to'g'ri berilgan variant qaysi?",
            "options": [
                "明日[あした] 友達[ともだち]が 来[き]ます",
                "明日 友達が 帰[き]ます",
                "明日 友達が 行[き]ます",
                "明日 友達が 見[き]ます"
            ],
            "correctAnswer": 0,
            "explanation": "Kelmoq fe'li: 来ます (Kimasu)."
        },
        {
            "id": "ja-n4-u3-l3-ex-10",
            "type": "multiple-choice",
            "prompt": "«Xat» so'zi «手紙» qanday o'qiladi?",
            "options": ["てがみ", "しゅし", "てかみ", "てし"],
            "correctAnswer": 0,
            "explanation": "手 (て - qo'l) + 紙 (かみ -> がみ - qog'oz) = 手紙 (てがみ - Xat)."
        },
        {
            "id": "ja-n4-u3-l3-ex-11",
            "type": "multiple-choice",
            "prompt": "«Kitob do'koni» so'zi «本屋» qanday o'qiladi?",
            "options": ["ほんや", "ほんおく", "ほんてん", "ほんいえ"],
            "correctAnswer": 0,
            "explanation": "本 (ほん - kitob) + 屋 (や - do'kon) = 本屋 (ほんや - Kitob do'koni)."
        },
        {
            "id": "ja-n4-u3-l3-ex-12",
            "type": "multiple-choice",
            "prompt": "«Fikr, mulohaza» ma'nosidagi «意見» kanjisi qanday o'qiladi?",
            "options": ["いけん", "いみ", "いかん", "おもけん"],
            "correctAnswer": 0,
            "explanation": "意 (い - niyat/ma'no) + 見 (けん - qarash) = 意見 (いけん - Fikr, shaxsiy fikr)."
        },
        {
            "id": "ja-n4-u3-l3-ex-13",
            "type": "multiple-choice",
            "prompt": "«Ketish-kelish (qatnash)» ma'nosidagi «行き来» qanday o'qiladi?",
            "options": ["いきき", "こうらい", "ぎょうらい", "ゆきく"],
            "correctAnswer": 0,
            "explanation": "行き来 (いきき - qatnov, bordi-keldi)."
        },
        {
            "id": "ja-n4-u3-l3-ex-14",
            "type": "multiple-choice",
            "prompt": "«O'qish uslubi / talaffuzi» ma'nosidagi «読み方» qanday o'qiladi?",
            "options": ["よみかた", "どくほう", "よみほう", "どくかた"],
            "correctAnswer": 0,
            "explanation": "読み方 (よみかた - o'qilishi, talaffuz qilish usuli)."
        },
        {
            "id": "ja-n4-u3-l3-ex-15",
            "type": "multiple-choice",
            "prompt": "«Eshitish qobiliyati / Tinglab tushunish» ma'nosidagi «聞き取り» qanday o'qiladi?",
            "options": ["ききとり", "ぶんしゅ", "ききどり", "もんしゅ"],
            "correctAnswer": 0,
            "explanation": "聞き取り (ききとり - tinglab tushunish, intervyu orqali ma'lumot olish)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 14: N4 Kanji 2: Society, Time & Opposites (社, 会, 駅, 店, 多, 少, 高, 安, 新, 古)
    # ----------------------------------------------------
    "ja-n4-u3-l4": [
        {
            "id": "ja-n4-u3-l4-ex-1",
            "type": "multiple-choice",
            "prompt": "«Kompaniya, firma» «会社» va «Jamiyat» «社会» kanjilarining to'g'ri o'qilishlari qaysi?",
            "options": [
                "かいしゃ (Kaisha) / しゃかい (Shakai)",
                "しゃかい / かいしゃ",
                "かいしゃ / えきしゃ",
                "しゃかい / てんしゃ"
            ],
            "correctAnswer": 0,
            "explanation": "会 (かい) + 社 (しゃ) = 会社 (Kompaniya); aksincha: 社 (しゃ) + 会 (かい) = 社会 (Jamiyat)."
        },
        {
            "id": "ja-n4-u3-l4-ex-2",
            "type": "multiple-choice",
            "prompt": "«Stantsiya xodimi» «駅員» so'zi qanday o'qiladi?",
            "options": ["えきいん", "えきしゃ", "えきじん", "えきかん"],
            "correctAnswer": 0,
            "explanation": "駅 (えき - stantsiya) + 員 (いん - a'zo/xodim) = 駅員 (えきいん - Stantsiya navbatchisi)."
        },
        {
            "id": "ja-n4-u3-l4-ex-3",
            "type": "multiple-choice",
            "prompt": "«Do'kon sotuvchisi» «店員» so'zi qanday o'qiladi?",
            "options": ["てんいん", "みせいん", "てんしゃ", "みせひと"],
            "correctAnswer": 0,
            "explanation": "店 (てん - do'kon) + 員 (いん) = 店員 (てんいん - Sotuvchi)."
        },
        {
            "id": "ja-n4-u3-l4-ex-4",
            "type": "multiple-choice",
            "prompt": "«Ko'p va oz / Qaysidir darajada» ma'nosidagi «多少» birikmasi qanday o'qiladi?",
            "options": ["たしょう", "おおすこ", "たずな", "たしょうりょう"],
            "correctAnswer": 0,
            "explanation": "多 (た - ko'p) + 少 (しょう - kam) = 多少 (たしょう - bir oz, muayyan miqdorda)."
        },
        {
            "id": "ja-n4-u3-l4-ex-5",
            "type": "multiple-choice",
            "prompt": "«Xavfsiz, tinch» ma'nosidagi «安全» so'zi qanday o'qiladi?",
            "options": ["あんぜん", "やすぜん", "あんたく", "やすらか"],
            "correctAnswer": 0,
            "explanation": "安 (あん) + 全 (ぜん) = 安全 (あんぜん - Xavfsiz, bexatar)."
        },
        {
            "id": "ja-n4-u3-l4-ex-6",
            "type": "multiple-choice",
            "prompt": "«Qimmatbaho» «高価» va «Arzon» «安価» so'zlari qanday o'qiladi?",
            "options": [
                "こうか (Kouka) / あんか (Anka)",
                "たかか / やすか",
                "こうか / やすか",
                "たかか / あんか"
            ],
            "correctAnswer": 0,
            "explanation": "高価 (こうか - qimmatbaho), 安価 (あんか - arzon, hamyonbop)."
        },
        {
            "id": "ja-n4-u3-l4-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「駅[えき]の　＿＿　＿＿　★　＿＿　買[か]いました。」",
            "options": ["1: 店[みせ]で", "2: 新[あたら]しい", "3: 前[まえ]の", "4: 雑誌[ざっし]を"],
            "correctAnswer": 1,
            "explanation": "To'g'ri tartib: 「駅の 前の (3) 店で (1) 新しい (2★) 雑誌を (4) 買いました。」 Yulduzcha 2-variantdagi 新しい ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u3-l4-ex-8",
            "type": "multiple-choice",
            "prompt": "«Yangi avtomobil» «新車» va «Ishlatilgan mashina» «中古車» kanjilari qanday o'qiladi?",
            "options": [
                "しんしゃ (Shinsha) / ちゅうこしゃ (Chuukosha)",
                "あたらしくるま / ふるいくるま",
                "しんぐるま / ちゅうふるくるま",
                "しんしゃ / こくるま"
            ],
            "correctAnswer": 0,
            "explanation": "新車 (しんしゃ - yangi mashina), 中古車 (ちゅうこしゃ - ikkilamchi bozor, haydalgan avtomobil)."
        },
        {
            "id": "ja-n4-u3-l4-ex-9",
            "type": "multiple-choice",
            "prompt": "«Kasalxona» «病院» so'zi tarkibidagi kanjilar qaysilar?",
            "options": [
                "病 (kasallik) + 院 (muassasa)",
                "病 + 屋",
                "痛 + 院",
                "医 + 院"
            ],
            "correctAnswer": 0,
            "explanation": "病 (びょう - xastalik) + 院 (いん - katta bino/institut) = 病院 (びょういん - Kasalxona)."
        },
        {
            "id": "ja-n4-u3-l4-ex-10",
            "type": "multiple-choice",
            "prompt": "«Qadimgi poytaxt / Qadimiy shahar» «古都» qanday o'qiladi?",
            "options": ["こと", "ふるみやこ", "こみやこ", "ふると"],
            "correctAnswer": 0,
            "explanation": "古 (こ - qadimiy) + 都 (と - poytaxt) = 古都 (こと - masalan, Kyoto yoki Nara shaharlari)."
        },
        {
            "id": "ja-n4-u3-l4-ex-11",
            "type": "multiple-choice",
            "prompt": "«Ko'pchilik» ma'nosidagi «多数» kanjisi qanday o'qiladi?",
            "options": ["たすう", "おおすう", "たかず", "おおず"],
            "correctAnswer": 0,
            "explanation": "多 (た) + 数 (すう - son/miqdor) = 多数 (たすう - ko'pchilik, ulkan miqdor)."
        },
        {
            "id": "ja-n4-u3-l4-ex-12",
            "type": "multiple-choice",
            "prompt": "«Kam sonli / Ozchilik» ma'nosidagi «少数» qanday o'qiladi?",
            "options": ["しょうすう", "すくすう", "すくなかず", "こずう"],
            "correctAnswer": 0,
            "explanation": "少 (しょう) + 数 (すう) = 少数 (しょうすう - ozchilik, kam son)."
        },
        {
            "id": "ja-n4-u3-l4-ex-13",
            "type": "multiple-choice",
            "prompt": "«Kompaniya rahbari / Prezidenti» «社長» qanday o'qiladi?",
            "options": ["しゃちょう", "かいちょう", "やどちょう", "しゃなが"],
            "correctAnswer": 0,
            "explanation": "社 (しゃ) + 長 (ちょう - boshliq) = 社長 (しゃちょう - Kompaniya direktori)."
        },
        {
            "id": "ja-n4-u3-l4-ex-14",
            "type": "multiple-choice",
            "prompt": "«Uchrashuv, majlis zali» «会場» qanday o'qiladi?",
            "options": ["かいじょう", "あうば", "かいば", "えきじょう"],
            "correctAnswer": 0,
            "explanation": "会 (かい) + 場 (じょう - joy) = 会場 (かいじょう - Majlis o'tkaziladigan bino/zal)."
        },
        {
            "id": "ja-n4-u3-l4-ex-15",
            "type": "multiple-choice",
            "prompt": "«Kassir, hisob-kitob joyi» ma'nosidagi «会計» qanday o'qiladi?",
            "options": ["かいけい", "かいはかり", "あうけい", "しゃけい"],
            "correctAnswer": 0,
            "explanation": "会 (かい) + 計 (けい - hisoblash) = 会計 (かいけい - Hisob-kitob, kassa to'lovi)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 15: N4 Listening: Transit Instructions & Public Announcements
    # ----------------------------------------------------
    "ja-n4-u3-l5": [
        {
            "id": "ja-n4-u3-l5-ex-1",
            "type": "multiple-choice",
            "prompt": "Poyezd stantsiyasidagi e'londa «1番線[いちばんせん]» nimani anglatadi?",
            "options": [
                "1-yo'l (1-platforma temir yo'li)",
                "1-vagon",
                "1-chipta kassasi",
                "1-chiqish darvozasi"
            ],
            "correctAnswer": 0,
            "explanation": "番線 (ばんせん) — poyezd to'xtaydigan temir yo'l yo'lagi (platforma raqami)."
        },
        {
            "id": "ja-n4-u3-l5-ex-2",
            "type": "multiple-choice",
            "prompt": "«次は 新宿、新宿です。山手線は お乗り換えです» e'lonidagi «お乗り換え (Onorikae)» nimani bildiradi?",
            "options": [
                "Boshqa liniyaga / poyezdga qayta o'tish (peresadka)",
                "Poyezddan tushib qolish",
                "Chipta narxini yangilash",
                "Poyezdning oxirgi bekati ekanligi"
            ],
            "correctAnswer": 0,
            "explanation": "乗り換え (のりかえ) — transportni almashtirish, peresadka qilish."
        },
        {
            "id": "ja-n4-u3-l5-ex-3",
            "type": "multiple-choice",
            "prompt": "«発車いたします (Hassha itashimasu)» jumlasi nimani anglatadi?",
            "options": [
                "Poyezd harakatlanib yo'lga chiqmoqda (jo'namoqda)",
                "Poyezd bekatga yetib kelmoqda",
                "Poyezd kechikmoqda",
                "Harakat to'xtatildi"
            ],
            "correctAnswer": 0,
            "explanation": "発車 (はっしゃ) — g'ildirakli transport yoki poyezdning jo'nashi."
        },
        {
            "id": "ja-n4-u3-l5-ex-4",
            "type": "multiple-choice",
            "prompt": "Platformadagi ogohlantirish:\n「白[しろ]い 線[せん]の 内側[うちがわ]まで お下[さ]がり ください」\nYo'lovchilardan nima so'ralmoqda?",
            "options": [
                "Oq chiziqning ichkari (xavfsiz) tomoniga o'tish",
                "Oq chiziq ustida to'xtash",
                "Temir yo'lga tushish",
                "Zinalardan pastga tushish"
            ],
            "correctAnswer": 0,
            "explanation": "内側 (ichkari qism) + お下がりください (orqaga tisariling/chekinib turing)."
        },
        {
            "id": "ja-n4-u3-l5-ex-5",
            "type": "multiple-choice",
            "prompt": "«Kechikish haqida ma'lumotnoma (kechikkanlik chiptasi)» Yaponiyada nima deyiladi?",
            "options": ["遅延証明書[ちえんしょうめいしょ]", "領収書[りょうしゅうしょ]", "定期券[ていきけん]", "回数券[かいすうけん]"],
            "correctAnswer": 0,
            "explanation": "Poyezd kechikkanida ishxona yoki maktabga ko'rsatish uchun stantsiyada beriladigan hujjat: 遅延証明書 (Chien shoumeisho)."
        },
        {
            "id": "ja-n4-u3-l5-ex-6",
            "type": "multiple-choice",
            "prompt": "«Ushbu poyezd faqat xususiy chiptali (barcha o'rindiqlar band qilingan)» ifodasi qaysi?",
            "options": [
                "全席[ぜんせき] 指定席[していせき]で ございます",
                "自由席[じゆうせき]で ございます",
                "満席[まんせき]では ありません",
                "優先席[ゆうせんせき]で ございます"
            ],
            "correctAnswer": 0,
            "explanation": "指定席 (していせき) — oldindan joy band qilingan o'rindiqlar. 自由席 (じゆうせき) — bo'sh joyga o'tiriladigan erkin o'rindiqlar."
        },
        {
            "id": "ja-n4-u3-l5-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「急行[きゅうこう]は　＿＿　＿＿　★　＿＿　止[と]まりません。」",
            "options": ["1: この", "2: 駅[えき]には", "3: 電車[でんしゃ]ですから", "4: 速[はや]い"],
            "correctAnswer": 1,
            "explanation": "To'g'ri tartib: 「急行は 速い (4) 電車ですから (3) この (1) 駅には (2★) 止まりません。」 Yulduzcha 2-variantdagi 駅には ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u3-l5-ex-8",
            "type": "multiple-choice",
            "prompt": "«Keksalar, homilador ayollar va nogironlar uchun mo'ljallangan maxsus o'rindiq» nima deyiladi?",
            "options": ["優先席[ゆうせんせき]", "指定席[していせき]", "禁煙席[きんえんせき]", "予約席[よやくせき]"],
            "correctAnswer": 0,
            "explanation": "優先席 (ゆうせんせき - Imtiyozli/afzallikli o'rindiqlar)."
        },
        {
            "id": "ja-n4-u3-l5-ex-9",
            "type": "multiple-choice",
            "prompt": "Poyezd eshigi yopilayotgandagi standart e'lon qaysi?",
            "options": [
                "ドアが 閉[し]まります。ご注意[ちゅうい] ください",
                "ドアを 開けて ください",
                "電車が 止まりました",
                "切符を 見せて ください"
            ],
            "correctAnswer": 0,
            "explanation": "「ドアが閉まります。ご注意ください」 (Eshiklar yopilmoqda. Ehtiyot bo'ling)."
        },
        {
            "id": "ja-n4-u3-l5-ex-10",
            "type": "multiple-choice",
            "prompt": "Avtobus e'loni:\n「次[つぎ]、止[と]まります。バスが 完全[かんぜん]に 止[と]まるまで 席[せき]を お立[た]ちにならないで ください」\nYo'lovchidan nima talab qilinadi?",
            "options": [
                "Avtobus butunlay to'xtamaguncha o'rindig'idan turmaslik",
                "Avtobus harakatlanayotganda darhol eshik yoniga borish",
                "To'xtash tugmasini qayta-qayta bosish",
                "Haydovchiga pulni oldindan uzatish"
            ],
            "correctAnswer": 0,
            "explanation": "完全に止まるまで席をお立ちにならないでください — to'liq to'xtamaguncha o'rindig'ingizdan turmang."
        },
        {
            "id": "ja-n4-u3-l5-ex-11",
            "type": "multiple-choice",
            "prompt": "«Shoshilinch to'xtash (avariya sababli to'xtash)» e'loni qaysi?",
            "options": [
                "急停車[きゅうていしゃ]いたします。お足元[あしもと]に ご注意[ちゅうい] ください",
                "安全に 運転しています",
                "終点に 着きました",
                "出発いたします"
            ],
            "correctAnswer": 0,
            "explanation": "急停車 (きゅうていしゃ) — to'satdan qattiq tormoz berib to'xtash."
        },
        {
            "id": "ja-n4-u3-l5-ex-12",
            "type": "multiple-choice",
            "prompt": "«Ushbu poyezd oxirgi bekatgacha to'xtovsiz harakatlanadi» ma'nosidagi «oxirgi bekat» nima deyiladi?",
            "options": ["終点[しゅうてん]", "始発[しはつ]", "各駅[かくえき]", "特急[とっきゅう]"],
            "correctAnswer": 0,
            "explanation": "終点 (しゅうてん) — marshrutning yakuniy, eng oxirgi bekati."
        },
        {
            "id": "ja-n4-u3-l5-ex-13",
            "type": "multiple-choice",
            "prompt": "Har bir bekatda to'xtaydigan oddiy poyezd nima deyiladi?",
            "options": ["各駅停車[かくえきていしゃ] (普通)", "快速[かいそく]", "特急[とっきゅう]", "新幹線[しんかんせん]"],
            "correctAnswer": 0,
            "explanation": "各駅停車 (かくえきていしゃ) yoki 普通 (ふつう) — har bir stantsiyada to'xtab o'tuvchi poyezd."
        },
        {
            "id": "ja-n4-u3-l5-ex-14",
            "type": "multiple-choice",
            "prompt": "«Unutilgan buyumlar (yo'qolgan buyumlar stoli)» nima deyiladi?",
            "options": ["忘[わす]れ物[もの] 取扱所[とりあつかいじょ]", "案内所[あんないじょ]", "切符売場[きっぷうりば]", "改札口[かいさつぐち]"],
            "correctAnswer": 0,
            "explanation": "忘れ物 (unutib qoldirilgan buyumlar) + 取扱所 (qabul qilish/saqlash bo'limi)."
        },
        {
            "id": "ja-n4-u3-l5-ex-15",
            "type": "multiple-choice",
            "prompt": "Turniketdan o'tish joyi (chipta tekshirish darvozasi) qaysi kanji bilan yoziladi?",
            "options": ["改札口[かいさつぐち]", "出口[でぐち]", "入口[いりぐち]", "非常口[ひじょうぐち]"],
            "correctAnswer": 0,
            "explanation": "改札口 (かいさつぐち) — metro yoki temir yo'l stantsiyasidagi chipta tekshiriladigan turniket kirish-chiqish darvozasi."
        }
    ]
}
