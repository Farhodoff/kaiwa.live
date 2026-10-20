# -*- coding: utf-8 -*-
"""
JLPT N4 Unit 1: Te-Form Fundamentals & Daily Requests / Rules
Lessons 1-5 (15 authentic exercises per lesson = 75 exercises total)
"""

UNIT1_EXERCISES = {
    # ----------------------------------------------------
    # Lesson 1: Te-Form (て形) Conjugation: Groups 1, 2, 3
    # ----------------------------------------------------
    "ja-n4-u1-l1": [
        {
            "id": "ja-n4-u1-l1-ex-1",
            "type": "multiple-choice",
            "prompt": "「飲[の]みます (ichmoq, 1-guruh)」fe'lining to'g'ri て-shaklini tanlang:",
            "options": ["飲[の]んで", "飲[の]って", "飲[の]いで", "飲[の]みて"],
            "correctAnswer": 0,
            "explanation": "1-guruhda み, び, に bilan tugaydigan fe'llar て-shaklida んで ga aylanadi: 飲みます -> 飲んで."
        },
        {
            "id": "ja-n4-u1-l1-ex-2",
            "type": "multiple-choice",
            "prompt": "「行[い]きます (bormoq, 1-guruh)」fe'lining istisno て-shakli qaysi?",
            "options": ["行[い]いて", "行[い]って", "行[い]んで", "行[い]きて"],
            "correctAnswer": 1,
            "explanation": "「行きます」 1-guruh bo'lsa ham qoidaga bo'ysunmaydigan yagona istisno: 行いて emas, balki 「行って (itte)」 bo'ladi."
        },
        {
            "id": "ja-n4-u1-l1-ex-3",
            "type": "multiple-choice",
            "prompt": "「待[ま]ちます (kutmoq, 1-guruh)」fe'lining て-shakli qaysi javobda to'g'ri berilgan?",
            "options": ["待[ま]ちて", "待[ま]して", "待[ま]って", "待[ま]いで"],
            "correctAnswer": 2,
            "explanation": "1-guruhda ち, り, い bilan tugaydigan fe'llar kichik っte ga o'zgaradi: 待ちます -> 待って (Matte)."
        },
        {
            "id": "ja-n4-u1-l1-ex-4",
            "type": "multiple-choice",
            "prompt": "「食[た]べます (yemoq, 2-guruh)」fe'lining て-shakli qaysi?",
            "options": ["食[た]べて", "食[た]べって", "食[た]べんで", "食[た]べして"],
            "correctAnswer": 0,
            "explanation": "2-guruh fe'llarida ます olib tashlanib, to'g'ridan-to'g'ri て qo'shiladi: 食べます -> 食べて."
        },
        {
            "id": "ja-n4-u1-l1-ex-5",
            "type": "multiple-choice",
            "prompt": "「話[はな]します (gapirmoq, 1-guruh)」fe'lining to'g'ri て-shakli qaysi?",
            "options": ["話[はな]して", "話[はな]って", "話[はな]いて", "話[はな]んで"],
            "correctAnswer": 0,
            "explanation": "1-guruhda し bilan tugaydigan fe'llar して ga aylanadi: 話します -> 話して."
        },
        {
            "id": "ja-n4-u1-l1-ex-6",
            "type": "multiple-choice",
            "prompt": "「泳[およ]ぎます (suzmoq, 1-guruh)」fe'lining to'g'ri て-shakli qaysi?",
            "options": ["泳[およ]いで", "泳[およ]いて", "泳[およ]んで", "泳[およ]って"],
            "correctAnswer": 0,
            "explanation": "1-guruhda ぎ bilan tugaydigan fe'llar sonorlashib いで ga aylanadi: 泳ぎます -> 泳いで."
        },
        {
            "id": "ja-n4-u1-l1-ex-7",
            "type": "multiple-choice",
            "prompt": "3-guruh fe'llari 「来[き]ます (kelmoq)」 va 「します (qilmoq)」ning て-shakllari qaysilar?",
            "options": [
                "来[き]て / して",
                "来[こ]いて / して",
                "来[き]って / しって",
                "来[く]て / さい"
            ],
            "correctAnswer": 0,
            "explanation": "3-guruh (tartibsiz) fe'llari: 来ます -> 来て (Kite), します -> して (Shite)."
        },
        {
            "id": "ja-n4-u1-l1-ex-8",
            "type": "multiple-choice",
            "prompt": "Ketma-ket harakatlarni bog'lashda bo'sh joyga mos keluvchi fe'l shaklini tanlang:\n「朝[あさ] 6時[ろくじ]に （　　）、顔[かお]を 洗[あら]いました。」",
            "options": ["起[お]きて", "起[お]きます", "起[お]き", "起[お]きた"],
            "correctAnswer": 0,
            "explanation": "Ketma-ket bajariladigan harakatlarni bog'lash uchun birinchi fe'l て-shaklida bo'ladi: 起きて、顔を洗いました (Uyg'onib, yuzimni yuvdim)."
        },
        {
            "id": "ja-n4-u1-l1-ex-9",
            "type": "multiple-choice",
            "prompt": "「買[か]います (sotib olmoq, 1-guruh)」fe'lining to'g'ri て-shakli qaysi?",
            "options": ["買[か]って", "買[か]いて", "買[か]んで", "買[か]して"],
            "correctAnswer": 0,
            "explanation": "い bilan tugagan 1-guruh fe'llari って ga aylanadi: 買います -> 買って."
        },
        {
            "id": "ja-n4-u1-l1-ex-10",
            "type": "multiple-choice",
            "prompt": "「死[し]にます (o'lmoq, 1-guruh)」fe'lining to'g'ri て-shakli qaysi?",
            "options": ["死[し]んで", "死[し]って", "死[し]いて", "死[し]ちて"],
            "correctAnswer": 0,
            "explanation": "に bilan tugagan 1-guruh fe'li んで ga o'zgaradi: 死にます -> 死んで."
        },
        {
            "id": "ja-n4-u1-l1-ex-11",
            "type": "multiple-choice",
            "prompt": "Jumlada qoldirilgan zarrachani toping:\n「図書館[としょかん]（　　） 行[い]って、本[ほん]を 借[か]りました。」",
            "options": ["へ", "で", "を", "から"],
            "correctAnswer": 0,
            "explanation": "Harakat yo'nalishi (borish manzili) uchun へ yoki に zarrachasi ishlatiladi: 図書館へ行って."
        },
        {
            "id": "ja-n4-u1-l1-ex-12",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli: To'g'ri gap tartibini tuzing va (★) o'rnidagi so'zni toping:\n「きのうは　＿＿　＿＿　★　＿＿　寝[ね]ました。」",
            "options": ["1: 食[た]べて", "2: ごはんを", "3: シャワーを", "4: 浴[あ]びてから"],
            "correctAnswer": 2,
            "explanation": "To'g'ri gap tartibi: 「ごはんを (2) 食べて (1) シャワーを (3★) 浴びてから (4) 寝ました。」 (Ovqatlanib, dush qabul qilgach uxladim). Yulduzcha 3-o'rinda: シャワーを."
        },
        {
            "id": "ja-n4-u1-l1-ex-13",
            "type": "multiple-choice",
            "prompt": "「見[み]ます (ko'rmoq, 2-guruh)」fe'lining て-shakli qaysi?",
            "options": ["見[み]て", "見[み]って", "見[み]んで", "見[み]いて"],
            "correctAnswer": 0,
            "explanation": "2-guruh fe'li bo'lgani uchun to'g'ridan-to'g'ri て qo'shiladi: 見ます -> 見て."
        },
        {
            "id": "ja-n4-u1-l1-ex-14",
            "type": "multiple-choice",
            "prompt": "「急[いそ]ぎます (shoshilmoq, 1-guruh)」fe'lining to'g'ri て-shakli qaysi?",
            "options": ["急[いそ]いで", "急[いそ]いて", "急[いそ]んで", "急[いそ]って"],
            "correctAnswer": 0,
            "explanation": "ぎ bilan tugaydigan 1-guruh fe'li いで ga o'zgaradi: 急ぎます -> 急いで."
        },
        {
            "id": "ja-n4-u1-l1-ex-15",
            "type": "multiple-choice",
            "prompt": "Quyidagi dialogda B nima deyishi kerak?\nA: 「すみません、ペンを （　　）も いいですか。」\nB: 「ええ、どうぞ。」",
            "options": ["使[つか]って", "使[つか]います", "使[つか]う", "使[つか]ってから"],
            "correctAnswer": 0,
            "explanation": "Ruxsat so'rash grammatikasi: 〜てもいいですか. Fe'lning て-shakli kerak: 使います -> 使って."
        }
    ],

    # ----------------------------------------------------
    # Lesson 2: Polite Requests: 〜てください (Please do)
    # ----------------------------------------------------
    "ja-n4-u1-l2": [
        {
            "id": "ja-n4-u1-l2-ex-1",
            "type": "multiple-choice",
            "prompt": "«Iltimos, derazani oching» jumlasi yapon tilida qanday ifodalanadi?",
            "options": [
                "窓[まど]を 開[あ]けて ください",
                "窓[まど]を 開[あ]きます ください",
                "窓[まど]を 開[あ]いて ください",
                "窓[まど]を 開[あ]けな ください"
            ],
            "correctAnswer": 0,
            "explanation": "Iltimos bildirish grammatikasi: fe'lning て-shakli + ください. 開けます (2-guruh) -> 開けてください."
        },
        {
            "id": "ja-n4-u1-l2-ex-2",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos so'zni tanlang:\n「ここに お名前[なまえ]と 住所[じゅうしょ]を （　　） ください。」",
            "options": ["書[か]いて", "書[か]いで", "書[か]って", "書[か]きて"],
            "correctAnswer": 0,
            "explanation": "書きます fe'lining て-shakli 書いて bo'ladi. Shu sababli: 書いてください (yozib bering)."
        },
        {
            "id": "ja-n4-u1-l2-ex-3",
            "type": "multiple-choice",
            "prompt": "«Iltimos, bu yerda chekmang» inkor iltimosi qanday tuziladi?",
            "options": [
                "ここで たばこを 吸[す]わないで ください",
                "ここで たばこを 吸[す]わなくて ください",
                "ここで たばこを 吸[す]いません ください",
                "ここで たばこを 吸[す]うない ください"
            ],
            "correctAnswer": 0,
            "explanation": "Inkor iltimos / man qilish formulasi: fe'lning ない-shakli + で ください. 吸います -> 吸わないで ください."
        },
        {
            "id": "ja-n4-u1-l2-ex-4",
            "type": "multiple-choice",
            "prompt": "To'g'ri zarrachani tanlang:\n「少[すこ]し 声[こえ]（　　） 小[ちい]さくして ください。」",
            "options": ["を", "に", "で", "が"],
            "correctAnswer": 0,
            "explanation": "Ovozni pasaytirish harakati ob'ektiga を qo'yiladi: 声を小さくしてください."
        },
        {
            "id": "ja-n4-u1-l2-ex-5",
            "type": "multiple-choice",
            "prompt": "«Biroz kuting, iltimos» ifodasi yapon tilida qaysi?",
            "options": [
                "少々[しょうしょう] お待[ま]ち ください",
                "少々[しょうしょう] 待[ま]ちて ください",
                "少々[しょうしょう] 待[ま]ちます ください",
                "少々[しょうしょう] 待[ま]つ ください"
            ],
            "correctAnswer": 0,
            "explanation": "Rasmiy va xushmuomala xizmat ko'rsatish tilida: 「少々お待ちください」 (Shoushou omachi kudasai) ishlatiladi."
        },
        {
            "id": "ja-n4-u1-l2-ex-6",
            "type": "multiple-choice",
            "prompt": "Quyidagi dialogda qaysi so'z tushib qolgan?\nA: 「すみません、もう 一度[いちど] （　　） ください。」\nB: 「はい、わかりました。」",
            "options": ["言[い]って", "言[い]いで", "言[い]して", "話[はな]し"],
            "correctAnswer": 0,
            "explanation": "言います (aytmoq) fe'lining て-shakli: 言って (Itte). もう一度言ってください = Yana bir bor ayting."
        },
        {
            "id": "ja-n4-u1-l2-ex-7",
            "type": "multiple-choice",
            "prompt": "Iltimosni yana-da xushmuomala (polite) qilish uchun 〜てください o'rniga nima ishlatiladi?",
            "options": [
                "〜て いただけませんか",
                "〜て だめですか",
                "〜て しましょう",
                "〜て ありますか"
            ],
            "correctAnswer": 0,
            "explanation": "Birovdan biror narsa so'rashda eng xushmuomala shakl: 〜ていただけませんか (qilib bera olmaysizmi?)."
        },
        {
            "id": "ja-n4-u1-l2-ex-8",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「すみません、駅[えき]までの　＿＿　＿＿　★　＿＿　ください。」",
            "options": ["1: 教[おし]えて", "2: 道[みち]を", "3: 地図[ちず]を", "4: 見[み]せて"],
            "correctAnswer": 0,
            "explanation": "To'g'ri tartib: 「道を (2) 地図で見せて / 地図を (3) 見せて (4) 教えて (1★) ください」 yoki mantiqan: 道を (2) 見せて / 教えて. Mazmunan: 道を (2) 教えて (1★) ください bo'ladi."
        },
        {
            "id": "ja-n4-u1-l2-ex-9",
            "type": "multiple-choice",
            "prompt": "«Iltimos, rasmga olmang» jumlasi qaysi?",
            "options": [
                "写真[しゃしん]を 撮[と]らないで ください",
                "写真[しゃしん]を 撮[と]らなくて ください",
                "写真[しゃしん]を 撮[と]りないで ください",
                "写真[しゃしん]を 撮[と]るない ください"
            ],
            "correctAnswer": 0,
            "explanation": "撮ります (1-guruh) inkor shakli: 撮らない. Inkor iltimos: 撮らないでください."
        },
        {
            "id": "ja-n4-u1-l2-ex-10",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos keladigan fe'lni tanlang:\n「寒[さむ]いので、ドアを （　　） ください。」",
            "options": ["閉[し]めて", "閉[し]まって", "開[あ]けて", "消[け]して"],
            "correctAnswer": 0,
            "explanation": "Sovuq bo'lgani uchun eshikni yopish so'raladi: 閉めます (yopmoq) -> 閉めてください."
        },
        {
            "id": "ja-n4-u1-l2-ex-11",
            "type": "multiple-choice",
            "prompt": "«Iltimos, daftaringizni oching» qanday aytiladi?",
            "options": [
                "ノートを 開[ひら]いて ください",
                "ノートを 開[ひら]きて ください",
                "ノートを 開[あ]いて ください",
                "ノートを 読[よ]んで ください"
            ],
            "correctAnswer": 0,
            "explanation": "Kitob yoki daftarni ochishda 「開[ひら]きます」 fe'li ishlatiladi. て-shakli: 開いてください."
        },
        {
            "id": "ja-n4-u1-l2-ex-12",
            "type": "multiple-choice",
            "prompt": "Taklif va mehmondo'stlikda «Bemalol tortinmasdan tanovul qiling» qanday ifodalanadi?",
            "options": [
                "どうぞ 遠慮[えんりょ]しないで 召[め]し上[あ]がって ください",
                "どうぞ 遠慮[えんりょ]して 召[め]し上[あ]がって ください",
                "どうぞ 遠慮[えんりょ]がなく 食[た]べて ください",
                "どうぞ 遠慮[えんりょ]ない 食[た]べなさい"
            ],
            "correctAnswer": 0,
            "explanation": "遠慮しないで (tortinmasdan) + 召し上がってください (marhamat, tanovul qiling)."
        },
        {
            "id": "ja-n4-u1-l2-ex-13",
            "type": "multiple-choice",
            "prompt": "Quyidagi vaziyatga mos jumlani tanlang: Do'stingizdan ruchkasini berib turishini so'ramoqchisiz:",
            "options": [
                "ペンを 貸[か]して くれない？",
                "ペンを 借[か]りて くれない？",
                "ペンを 返[かえ]して くれない？",
                "ペンを 売[う]って くれない？"
            ],
            "correctAnswer": 0,
            "explanation": "Do'stona iltimosda: 貸してくれない？ (berib tura olmaysanmi?). 借ります - qarzga olmoq, 貸します - berib turmoq."
        },
        {
            "id": "ja-n4-u1-l2-ex-14",
            "type": "multiple-choice",
            "prompt": "To'g'ri zarrachani tanlang:\n「タクシー（　　） 呼[よ]んで ください。」",
            "options": ["を", "に", "で", "へ"],
            "correctAnswer": 0,
            "explanation": "Taksini chaqirish ob'ektiga を qo'yiladi: タクシーを呼んでください."
        },
        {
            "id": "ja-n4-u1-l2-ex-15",
            "type": "multiple-choice",
            "prompt": "«Iltimos, bu yerga narsalaringizni qo'ymang» qaysi javobda to'g'ri?",
            "options": [
                "ここに 荷物[にもつ]を 置[お]かないで ください",
                "ここに 荷物[にもつ]を 置[お]かなくて ください",
                "ここに 荷物[にもつ]を 置[お]きて ください",
                "ここに 荷物[にもつ]を 置[お]かない ください"
            ],
            "correctAnswer": 0,
            "explanation": "置きます (qo'ymoq) inkor shakli: 置かない. Inkor iltimos: 置かないでください."
        }
    ],

    # ----------------------------------------------------
    # Lesson 3: Permission (〜てもいい) & Prohibition (〜てはいけない)
    # ----------------------------------------------------
    "ja-n4-u1-l3": [
        {
            "id": "ja-n4-u1-l3-ex-1",
            "type": "multiple-choice",
            "prompt": "«Bu yerda suratga olsam maylimi?» savoli qaysi?",
            "options": [
                "ここで 写真[しゃしん]を 撮[と]っても いいですか",
                "ここで 写真[しゃしん]を 撮[と]ってはいけませんか",
                "ここで 写真[しゃしん]を 撮[と]らなくても いいですか",
                "ここで 写真[しゃしん]を 撮[と]りたいですか"
            ],
            "correctAnswer": 0,
            "explanation": "Ruxsat so'rash formulasi: fe'lning て-shakli + もいいですか."
        },
        {
            "id": "ja-n4-u1-l3-ex-2",
            "type": "multiple-choice",
            "prompt": "«Bu yerda chekish taqiqlanadi (mumkin emas)» qaysi ifoda orqali beriladi?",
            "options": [
                "ここで たばこを 吸[す]っては いけません",
                "ここで たばこを 吸[す]っても いいです",
                "ここで たばこを 吸[す]わなければ なりません",
                "ここで たばこを 吸[す]うことが できます"
            ],
            "correctAnswer": 0,
            "explanation": "Qat'iy taqiq bildirish: fe'lning て-shakli + は いけません."
        },
        {
            "id": "ja-n4-u1-l3-ex-3",
            "type": "multiple-choice",
            "prompt": "Savolga rad javobini berishda qaysi ifoda to'g'ri?\nA: 「先生、今 質問[しつもん]しても いいですか。」\nB: 「すみません、今 会議[かいぎ]中[ちゅう]なので （　　）。」",
            "options": [
                "ちょっと 困[こま]ります",
                "しても いいです",
                "しなければ なりません",
                "して ください"
            ],
            "correctAnswer": 0,
            "explanation": "Yapon madaniyatida ruxsat so'ralganda to'g'ridan-to'g'ri «ダメです (Mumkin emas)» demasdan, xushmuomala qilib «ちょっと困ります (Biroz noqulay / imkoni yo'q)» deyiladi."
        },
        {
            "id": "ja-n4-u1-l3-ex-4",
            "type": "multiple-choice",
            "prompt": "«Kirish mumkin emas / Kirmang» qaysi javobda to'g'ri?",
            "options": [
                "入[はい]っては いけません",
                "入[はい]っても いいです",
                "入[はい]らなくては いけません",
                "入[はい]りたくないです"
            ],
            "correctAnswer": 0,
            "explanation": "入ります (1-guruh) -> 入って + はいけません = Kirish qat'iyan man etiladi."
        },
        {
            "id": "ja-n4-u1-l3-ex-5",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos so'zni tanlang:\n「テスト中[ちゅう]は 辞書[じしょ]を （　　）は いけません。」",
            "options": ["使[つか]って", "使[つか]いて", "使[つか]い", "使[つか]う"],
            "correctAnswer": 0,
            "explanation": "〜てはいけません grammatikasida fe'l て-shaklida bo'lishi shart: 使います -> 使って."
        },
        {
            "id": "ja-n4-u1-l3-ex-6",
            "type": "multiple-choice",
            "prompt": "I-sifatlar bilan ruxsat shakli qanday yasaladi? Masalan, «Arzon bo'lsa ham maylimi?»:",
            "options": [
                "安[やす]くても いいですか",
                "安[やす]いでも いいですか",
                "安[やす]くては いけませんか",
                "安[やす]いなら いいですか"
            ],
            "correctAnswer": 0,
            "explanation": "I-sifatning て-shakli: 安い -> 安くて + もいいですか = 安くてもいいですか."
        },
        {
            "id": "ja-n4-u1-l3-ex-7",
            "type": "multiple-choice",
            "prompt": "Na-sifat va otlar bilan ruxsat shakli qanday bo'ladi? Masalan, «Ertaga bo'sh/dam bo'lsangiz ham mayli»:",
            "options": [
                "暇[ひま]でも いいです",
                "暇[ひま]ても いいです",
                "暇[ひま]のでも いいです",
                "暇[ひま]なでも いいです"
            ],
            "correctAnswer": 0,
            "explanation": "Na-sifat va otlarning て-shakli bilan bog'lanishi: でもいいです (暇でもいいです / 日曜日でもいいです)."
        },
        {
            "id": "ja-n4-u1-l3-ex-8",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「美術館[びじゅつかん]の　＿＿　＿＿　★　＿＿　いけません。」",
            "options": ["1: 絵[え]に", "2: 触[さわ]っては", "3: 中[なか]の", "4: 手[て]で"],
            "correctAnswer": 1,
            "explanation": "To'g'ri tartib: 「美術館の中の (3) 絵に (1) 手で触っては (4) / 触っては (2★) いけません。」 Yulduzcha 2-variantga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u1-l3-ex-9",
            "type": "multiple-choice",
            "prompt": "«Bugun ishdan ertaroq ketsam maylimi?» savoli qaysi?",
            "options": [
                "今日[きょう] 早[はや]く 帰[かえ]っても いいですか",
                "今日[きょう] 早[はや]く 帰[かえ]らなければ なりませんか",
                "今日[きょう] 早[はや]く 帰[かえ]っては いけませんか",
                "今日[きょう] 早[はや]く 帰[かえ]りたいですか"
            ],
            "correctAnswer": 0,
            "explanation": "帰ります (1-guruh) -> 帰って + もいいですか = 早く帰ってもいいですか."
        },
        {
            "id": "ja-n4-u1-l3-ex-10",
            "type": "multiple-choice",
            "prompt": "«Buni yemasa ham maylimi?» (Inkor ruxsat) qanday tuziladi?",
            "options": [
                "食[た]べなくても いいですか",
                "食[た]べないでも いいですか",
                "食[た]べては いけませんか",
                "食[た]べないで ください"
            ],
            "correctAnswer": 0,
            "explanation": "Qilmasa ham mayli (ixtiyoriy harakat): fe'lning inkor shakli + くてもいいですか (食べなくてもいいですか)."
        },
        {
            "id": "ja-n4-u1-l3-ex-11",
            "type": "multiple-choice",
            "prompt": "Taqiqning norasmiy (so'zlashuv) shakli qaysi?",
            "options": [
                "触[さわ]っちゃ だめ！",
                "触[さわ]っても いいよ",
                "触[さわ]らなきゃ",
                "触[さわ]るべきだ"
            ],
            "correctAnswer": 0,
            "explanation": "〜てはいけません og'zaki nutqda 〜ちゃだめ / 〜じゃだめ ga qisqaradi: 触っちゃだめ (Ushlama!)."
        },
        {
            "id": "ja-n4-u1-l3-ex-12",
            "type": "multiple-choice",
            "prompt": "To'g'ri zarrachani tanlang:\n「この 部屋[へや]（　　） 入[はい]っては いけません。」",
            "options": ["に", "で", "を", "から"],
            "correctAnswer": 0,
            "explanation": "Kirish harakatining yakuniy nuqtasiga に qo'yiladi: 部屋に入ってはいけません."
        },
        {
            "id": "ja-n4-u1-l3-ex-13",
            "type": "multiple-choice",
            "prompt": "«Qizil chiroqda yo'ldan o'tish taqiqlanadi» jumlasi qaysi?",
            "options": [
                "赤信号[あかしんごう]で 道[みち]を 渡[わた]っては いけません",
                "赤信号[あかしんごう]で 道[みち]を 渡[わた]っても いいです",
                "赤信号[あかしんごう]で 道[みち]を 渡[わた]らなければ なりません",
                "赤信号[あかしんごう]で 道[みち]を 渡[わた]りたいです"
            ],
            "correctAnswer": 0,
            "explanation": "渡ります (kesib o'tmoq) -> 渡って + はいけません = 赤信号で道を渡ってはいけません."
        },
        {
            "id": "ja-n4-u1-l3-ex-14",
            "type": "multiple-choice",
            "prompt": "Quyidagi dialogda B nima deyishi kerak?\nA: 「ここで 車[くるま]を 止[と]めても いいですか。」\nB: 「いいえ、ここは 駐車禁止[ちゅうしゃきんし]ですから、（　　）。」",
            "options": [
                "止[と]めては いけません",
                "止[と]めても いいです",
                "止[と]めて ください",
                "止[と]めたいです"
            ],
            "correctAnswer": 0,
            "explanation": "Avtoturargoh taqiqlanganligi sababli: 止めてはいけません (to'xtatish mumkin emas)."
        },
        {
            "id": "ja-n4-u1-l3-ex-15",
            "type": "multiple-choice",
            "prompt": "«Istalgan vaqtda qo'ng'iroq qilsangiz ham mayli» jumlasi qaysi?",
            "options": [
                "いつでも 電話[でんわ]しても いいですよ",
                "いつでも 電話[でんわ]しては いけませんよ",
                "いつでも 電話[でんわ]しないで ください",
                "いつでも 電話[でんわ]しなければ なりません"
            ],
            "correctAnswer": 0,
            "explanation": "Ruxsat va qulaylik berish: いつでも電話してもいいですよ."
        }
    ],

    # ----------------------------------------------------
    # Lesson 4: Continuous Action & State: 〜ている (Present Continuous & Resultant State)
    # ----------------------------------------------------
    "ja-n4-u1-l4": [
        {
            "id": "ja-n4-u1-l4-ex-1",
            "type": "multiple-choice",
            "prompt": "«Tanaka hozir kitob o'qiyapti» (harakat davom etmoqda) qaysi javobda to'g'ri?",
            "options": [
                "田中[たなか]さんは 今[いま] 本[ほん]を 読[よ]んでいます",
                "田中[たなか]さんは 今[いま] 本[ほん]を 読[よ]みます",
                "田中[たなか]さんは 今[いま] 本[ほん]を 読[よ]んで あります",
                "田中[たなか]さんは 今[いま] 本[ほん]を 読[よ]みました"
            ],
            "correctAnswer": 0,
            "explanation": "Ayni paytda davom etayotgan harakat: fe'lning て-shakli + います (読んでいる)."
        },
        {
            "id": "ja-n4-u1-l4-ex-2",
            "type": "multiple-choice",
            "prompt": "O'tmishdagi harakat natijasining saqlanib turgan holatini ifodalovchi gapni tanlang:",
            "options": [
                "窓[まど]が 開[あ]いています",
                "窓[まど]を 開[あ]けます",
                "窓[まど]を 開[あ]けて ください",
                "窓[まど]が 開[あ]きました"
            ],
            "correctAnswer": 0,
            "explanation": "O'z-o'zidan sodir bo'lgan o'zgarish natijasi saqlanib turishi: Avtofe'l (jidoushi) + ています (窓が開いています - Deraza ochiq turibdi)."
        },
        {
            "id": "ja-n4-u1-l4-ex-3",
            "type": "multiple-choice",
            "prompt": "«Men u kishini bilaman / taniyman» jumlasi qaysi?",
            "options": [
                "その 人[ひと]を 知[し]っています",
                "その 人[ひと]を 知[し]ります",
                "その 人[ひと]を 知[し]りました",
                "その 人[ひと]を 知[し]って あります"
            ],
            "correctAnswer": 0,
            "explanation": "Bilish holati turg'un natija bo'lgani uchun yapon tilida doimo 「知っています」 shaklida aytiladi."
        },
        {
            "id": "ja-n4-u1-l4-ex-4",
            "type": "multiple-choice",
            "prompt": "DIQQAT: «Men u kishini bilmayman / tanimayman» qanday aytiladi?",
            "options": [
                "知[し]りません",
                "知[し]っていません",
                "知[し]らないです",
                "知[し]ってないです"
            ],
            "correctAnswer": 0,
            "explanation": "Muhim qoida: Tasdiq «知っています» bo'lsa ham, inkor shakli «知っていません» emas, balki 「知りません」 bo'ladi."
        },
        {
            "id": "ja-n4-u1-l4-ex-5",
            "type": "multiple-choice",
            "prompt": "«Uylangan / turmush qurgan» holati qaysi?",
            "options": [
                "結婚[けっこん]して います",
                "結婚[けっこん]します",
                "結婚[けっこん]しました",
                "結婚[けっこん]して あります"
            ],
            "correctAnswer": 0,
            "explanation": "Nikohdan o'tib, oilali holatda yashash — natijaviy holat: 結婚しています."
        },
        {
            "id": "ja-n4-u1-l4-ex-6",
            "type": "multiple-choice",
            "prompt": "«Men Toshkentda yashayman» qaysi zarracha va fe'l bilan ifodalanadi?",
            "options": [
                "タシケントに 住[す]んでいます",
                "タシケントで 住[す]んでいます",
                "タシケントを 住[す]みます",
                "タシケントへ 住[す]んでいます"
            ],
            "correctAnswer": 0,
            "explanation": "Yashash joyi turg'un manzil bo'lgani uchun に zarrachasi va 住んでいます birikmasi ishlatiladi."
        },
        {
            "id": "ja-n4-u1-l4-ex-7",
            "type": "multiple-choice",
            "prompt": "Doimiy takrorlanuvchi odat yoki kasbiy faoliyat qaysi gapda ifodalangan?",
            "options": [
                "父[ちち]は 銀行[ぎんこう]で 働[はたら]いています",
                "父[ちち]は 銀行[ぎんこう]で 働[はたら]きます",
                "父[ちち]は 銀行[ぎんこう]へ 行[い]きました",
                "父[ちち]は 銀行[ぎんこう]を 辞[や]めました"
            ],
            "correctAnswer": 0,
            "explanation": "Uzoq muddatli kasbiy faoliyat va xizmat: 〜で働いています."
        },
        {
            "id": "ja-n4-u1-l4-ex-8",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「電気が　＿＿　＿＿　★　＿＿　部屋に　入りました。」",
            "options": ["1: ついて", "2: いる", "3: 明るい", "4: ので"],
            "correctAnswer": 1,
            "explanation": "To'g'ri tartib: 「電気がついて (1) いる (2★) ので (4) 明るい (3) / 明るい部屋に...」 Yulduzcha o'rnida: いる (2)."
        },
        {
            "id": "ja-n4-u1-l4-ex-9",
            "type": "multiple-choice",
            "prompt": "«U qora ko'zoynak taqib olgan» jumlasi qaysi?",
            "options": [
                "彼[かれ]は 黒[くろ]い めがねを かけて います",
                "彼[かれ]は 黒[くろ]い めがねを かけます",
                "彼[かれ]は 黒[くろ]い めがねを かけて あります",
                "彼[かれ]は 黒[くろ]い めがねを かけました"
            ],
            "correctAnswer": 0,
            "explanation": "Kiyim, ko'zoynak taqib yurish holati: fe'lning て-shakli + います (めがねをかけています)."
        },
        {
            "id": "ja-n4-u1-l4-ex-10",
            "type": "multiple-choice",
            "prompt": "Quyidagi dialogda qaysi javob to'g'ri?\nA: 「今[いま]、何[なに]を して いますか。」\nB: 「日本語[にほんご]の 宿題[しゅくだい]を （　　）。」",
            "options": [
                "して います",
                "します",
                "しました",
                "して あります"
            ],
            "correctAnswer": 0,
            "explanation": "Hozir nima qilyapsan? deb so'ralganda, harakat ayni paytda davom etayotgani sababli: 宿題をしています."
        },
        {
            "id": "ja-n4-u1-l4-ex-11",
            "type": "multiple-choice",
            "prompt": "O'zgarish natijasini ifodalovchi to'g'ri shaklni tanlang:\n「道[みち]に 財布[さいふ]が （　　） います。」",
            "options": ["落[お]ちて", "落[お]として", "落[お]ち", "落[お]ちた"],
            "correctAnswer": 0,
            "explanation": "Hamyon yerga tushib yotibdi: avtofe'l 落ちます -> 落ちています."
        },
        {
            "id": "ja-n4-u1-l4-ex-12",
            "type": "multiple-choice",
            "prompt": "«Ular yangi avtomobilga ega (mashinalari bor)» qanday aytiladi?",
            "options": [
                "車[くるま]を 持[も]って います",
                "車[くるま]を 持[も]ちます",
                "車[くるま]を 持[も]って あります",
                "車[くるま]が 持[も]ちます"
            ],
            "correctAnswer": 0,
            "explanation": "Mulkka egalik holati: 持っています."
        },
        {
            "id": "ja-n4-u1-l4-ex-13",
            "type": "multiple-choice",
            "prompt": "«Poезд hozirgina yetib kelib, stantsiyada to'xtab turibdi» holati qaysi?",
            "options": [
                "電車[でんしゃ]が 止[と]まって います",
                "電車[でんしゃ]を 止[と]めて います",
                "電車[でんしゃ]が 止[と]まります",
                "電車[でんしゃ]が 止[と]めました"
            ],
            "correctAnswer": 0,
            "explanation": "Poezd to'xtab turibdi: 止まります (avtofe'l) -> 止まっています."
        },
        {
            "id": "ja-n4-u1-l4-ex-14",
            "type": "multiple-choice",
            "prompt": "«Tashqarida yomg'ir yog'yapti» jumlasi qaysi?",
            "options": [
                "外[そと]で 雨[あめ]が 降[ふ]って います",
                "外[そと]で 雨[あめ]が 降[ふ]ります",
                "外[そと]で 雨[あめ]を 降[ふ]って います",
                "外[そと]で 雨[あめ]が 降[ふ]りました"
            ],
            "correctAnswer": 0,
            "explanation": "Tabiat hodisasi ayni paytda sodir bo'lmoqda: 雨が降っています."
        },
        {
            "id": "ja-n4-u1-l4-ex-15",
            "type": "multiple-choice",
            "prompt": "So'zlashuv tilida (casual speech) 〜ている dagi い qanday qisqaradi?",
            "options": [
                "食[た]べてる (い tushib qoladi)",
                "食[た]べてん (ん ga aylanadi)",
                "食[た]べてく (く ga aylanadi)",
                "食[た]べとる (o'zgarmaydi)"
            ],
            "correctAnswer": 0,
            "explanation": "Og'zaki nutqda 〜ている ko'pincha 〜てる ga qisqaradi: 食べている -> 食べてる, 見ている -> 見てる."
        }
    ],

    # ----------------------------------------------------
    # Lesson 5: Sequential Actions: 〜てから (After doing) & 〜たあとで
    # ----------------------------------------------------
    "ja-n4-u1-l5": [
        {
            "id": "ja-n4-u1-l5-ex-1",
            "type": "multiple-choice",
            "prompt": "«Qo'lingizni yuvgandan so'ng ovqatlaning» jumlasi qaysi?",
            "options": [
                "手[て]を 洗[あら]ってから、食[た]べて ください",
                "手[て]を 洗[あら]うから、食[た]べて ください",
                "手[て]を 洗[あら]ったから、食[た]べて ください",
                "手[て]を 洗[あら]いから、食[た]べて ください"
            ],
            "correctAnswer": 0,
            "explanation": "Bir harakat tugagach, darhol keyingisini qilish: fe'lning て-shakli + から (洗ってから)."
        },
        {
            "id": "ja-n4-u1-l5-ex-2",
            "type": "multiple-choice",
            "prompt": "〜てから va 〜たあとで o'rtasidagi asosiy farq nima?",
            "options": [
                "〜てから — birinchi harakat ikkinchisi uchun shart/boshlanish nuqtasi; 〜たあとで — sof vaqt tartibi",
                "〜てから faqat o'tgan zamonda ishlatiladi",
                "〜たあとで buyruq jumlalarida mutlaqo ishlatilmaydi",
                "Hech qanday farqi yo'q"
            ],
            "correctAnswer": 0,
            "explanation": "〜てから ma'lum bir harakat tugashini ikkinchisi uchun zarur shart deb biladi (masalan, universitetni bitirgach ishlayman). 〜たあとで esa oddiy xronologik vaqt tartibini bildiradi."
        },
        {
            "id": "ja-n4-u1-l5-ex-3",
            "type": "multiple-choice",
            "prompt": "«Kino ko'rgach, qahvaxonaga bordik» qaysi javobda to'g'ri berilgan?",
            "options": [
                "映画[えいが]を 見[み]た あとで、カフェへ 行[い]きました",
                "映画[えいが]を 見[み]る あとで、カフェへ 行[い]きました",
                "映画[えいが]を 見[み]て あとで、カフェへ 行[い]きました",
                "映画[えいが]を 見[み]ない あとで、カフェへ 行[い]きました"
            ],
            "correctAnswer": 0,
            "explanation": "〜あとで grammatikasi oldidan fe'lning o'tgan zamon oddiy shakli (た-form) keladi: 見たあとで."
        },
        {
            "id": "ja-n4-u1-l5-ex-4",
            "type": "multiple-choice",
            "prompt": "Otlar (nouns) bilan 〜あとで qanday bog'lanadi?\n「仕事[しごと]（　　） あとで、飲[の]みに 行[い]きましょう。」",
            "options": ["の", "な", "に", "で"],
            "correctAnswer": 0,
            "explanation": "Otlar 〜あとで bilan bog'langanda の zarrachasini oladi: 仕事のあとで (Ishdan keyin)."
        },
        {
            "id": "ja-n4-u1-l5-ex-5",
            "type": "multiple-choice",
            "prompt": "Qarama-qarshi ma'nodagi «...dan oldin» ifodasi qanday yasaladi?",
            "options": [
                "辞書形[じしょけい] + 前[まえ]に",
                "た形[がた] + 前[まえ]に",
                "て形[がた] + 前[まえ]に",
                "ない形[がた] + 前[まえ]に"
            ],
            "correctAnswer": 0,
            "explanation": "〜前に (oldin) grammatikasi oldidan fe'l har doim lug'at shaklida (jishokei) keladi: 寝る前に (uxlashdan oldin)."
        },
        {
            "id": "ja-n4-u1-l5-ex-6",
            "type": "multiple-choice",
            "prompt": "«Yaponiyaga kelganimdan beri har kuni yaponcha o'rganyapman» jumlasi qaysi?",
            "options": [
                "日本[にほん]へ 来[き]てから、毎日[まいにち] 日本語[にほんご]を 勉強[べんきょう]して います",
                "日本[にほん]へ 来[く]るから、毎日[まいにち] 日本語[にほんご]を 勉強[べんきょう]して います",
                "日本[にほん]へ 来[き]たから、毎日[まいにち] 日本語[にほんご]を 勉強[べんきょう]して います",
                "日本[にほん]へ 来[き]て あとで、毎日[まいにち] 日本語[にほんご]を 勉強[べんきょう]して います"
            ],
            "correctAnswer": 0,
            "explanation": "Harakat sodir bo'lgan vaqtdan beri uzluksiz davom etayotgan holat: 〜てから (来[き]てから)."
        },
        {
            "id": "ja-n4-u1-l5-ex-7",
            "type": "multiple-choice",
            "prompt": "JLPT Yulduzcha (★) savoli:\n「お金[かね]を　＿＿　＿＿　★　＿＿　出[で]ます。」",
            "options": ["1: 切符[きっぷ]が", "2: 入[い]れてから、", "3: ボタンを", "4: 押[お]すと"],
            "correctAnswer": 3,
            "explanation": "To'g'ri tartib: 「お金を入れてから、(2) ボタンを (3) 押すと (4★) 切符が (1) 出ます。」 Yulduzcha 4-o'rindagi 押すと ga to'g'ri keladi."
        },
        {
            "id": "ja-n4-u1-l5-ex-8",
            "type": "multiple-choice",
            "prompt": "Bo'sh joyga mos shaklni tanlang:\n「朝[あさ]ごはんを （　　）あとで、薬[くすり]を 飲[の]みます。」",
            "options": ["食[た]べた", "食[た]べる", "食[た]べて", "食[た]べない"],
            "correctAnswer": 0,
            "explanation": "〜あとで oldidan fe'lning た-shakli keladi: 食べたあとで (nonushta qilgach)."
        },
        {
            "id": "ja-n4-u1-l5-ex-9",
            "type": "multiple-choice",
            "prompt": "«Universitetni tugatgach nima qilmoqchisiz?» savoli qaysi?",
            "options": [
                "大学[だいがく]を 出[で]てから、何[なに]を しますか",
                "大学[だいがく]を 出[で]るから、何[なに]を しますか",
                "大学[だいがく]を 出[で]たから、何[なに]を しますか",
                "大学[だいがく]を 出[で]て 前[まえ]に、何[なに]を しますか"
            ],
            "correctAnswer": 0,
            "explanation": "Hayotiy bosqichdan so'ng keyingi qadam: 出てから (tamomlagach)."
        },
        {
            "id": "ja-n4-u1-l5-ex-10",
            "type": "multiple-choice",
            "prompt": "To'g'ri bog'lovchini tanlang:\n「説明書[せつめいしょ]を （　　）あとで、組[く]みたてて ください。」",
            "options": ["読[よ]んだ", "読[よ]む", "読[よ]んで", "読[よ]みます"],
            "correctAnswer": 0,
            "explanation": "〜あとで oldidan: 読んだ (o'qib chiqqach)."
        },
        {
            "id": "ja-n4-u1-l5-ex-11",
            "type": "multiple-choice",
            "prompt": "«Dush qabul qilib bo'lgach uxladi» qaysi javobda to'g'ri berilgan?",
            "options": [
                "シャワーを 浴[あ]びてから、寝[ね]ました",
                "シャワーを 浴[あ]びるから、寝[ね]ました",
                "シャワーを 浴[あ]びたので、寝[ね]ました",
                "シャワーを 浴[あ]びる 前[まえ]に、寝[ね]ました"
            ],
            "correctAnswer": 0,
            "explanation": "Bajarilgan ishdan keyin: 浴びてから寝ました."
        },
        {
            "id": "ja-n4-u1-l5-ex-12",
            "type": "multiple-choice",
            "prompt": "Vaqt tartibini ko'rsatuvchi to'g'ri jumlani tanlang:",
            "options": [
                "国[くに]へ 帰[かえ]る 前[まえ]に、お土産[みやげ]を 買[か]います",
                "国[くに]へ 帰[かえ]った 前[まえ]に、お土産[みやげ]を 買[か]います",
                "国[くに]へ 帰[かえ]て 前[まえ]に、お土産[みやげ]を 買[か]います",
                "国[くに]へ 帰[かえ]る あとで、お土産[みやげ]を 買[か]います"
            ],
            "correctAnswer": 0,
            "explanation": "〜前に oldidan har doim lug'at shakli keladi: 帰る前に (qaytishdan oldin)."
        },
        {
            "id": "ja-n4-u1-l5-ex-13",
            "type": "multiple-choice",
            "prompt": "«Yaxshilab o'ylab ko'rgandan keyin qaror qiling» jumlasi qaysi?",
            "options": [
                "よく 考[かんが]えてから、決[き]めて ください",
                "よく 考[かんが]えるから、決[き]めて ください",
                "よく 考[かんが]えたから、決[き]めて ください",
                "よく 考[かんが]いから、決[き]めて ください"
            ],
            "correctAnswer": 0,
            "explanation": "Avval o'ylab, keyin qaror qilish sharti: 考えてから."
        },
        {
            "id": "ja-n4-u1-l5-ex-14",
            "type": "multiple-choice",
            "prompt": "Quyidagi dialogda bo'sh joyga nima qo'yiladi?\nA: 「いつ 荷物[にもつ]を 送[おく]りますか。」\nB: 「中身[なかみ]を （　　） あとで 送[おく]ります。」",
            "options": ["確認[かくにん]した", "確認[かくにん]する", "確認[かくにん]して", "確認[かくにん]の"],
            "correctAnswer": 0,
            "explanation": "Fe'l bo'lgani sababli た-shakli: 確認したあとで (tekshirib bo'lgach)."
        },
        {
            "id": "ja-n4-u1-l5-ex-15",
            "type": "multiple-choice",
            "prompt": "«Imtihon tugagandan keyin hamma birga bayram qilamiz» qaysi javobda to'g'ri?",
            "options": [
                "試験[しけん]が 終[お]わってから、みんなで お祝[いわ]いを します",
                "試験[しけん]が 終[お]わるから、みんなで お祝[いわ]いを します",
                "試験[しけん]が 終[お]わったから、みんなで お祝[いわ]いを します",
                "試験[しけん]が 終[お]わって 前[まえ]に、みんなで お祝[いわ]いを します"
            ],
            "correctAnswer": 0,
            "explanation": "Tugagandan keyin: 終わってから (Owattekara)."
        }
    ]
}
