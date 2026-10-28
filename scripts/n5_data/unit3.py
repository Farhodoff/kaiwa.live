# -*- coding: utf-8 -*-
"""
JLPT N5 Unit 3: Time, Days, Numbers, Counters, Past Tense & Authentic Listening
Lessons 11-15 (15 authentic exercises per lesson = 75 exercises total)
Includes authentic Choukai audio tracks on ja-n5-u3-l5
"""

UNIT3_EXERCISES = {
    # ----------------------------------------------------
    # Lesson 11: Telling Time (時 / 分) & Days of the Week (曜日)
    # ----------------------------------------------------
    "ja-n5-u3-l1": [
        {
            "id": "ja-n5-u3-l1-ex-1",
            "type": "multiple-choice",
            "prompt": "Soatni aytishda sonning orqasiga qaysi qo'shimcha qo'shiladi?",
            "options": [
                "〜時[じ] (Ji) — masalan: 1時 (Ichiji), 2時 (Niji)",
                "〜分[ふん]",
                "〜日[にち]",
                "〜歳[さい]"
            ],
            "correctAnswer": 0,
            "explanation": "Soat birligi: 〜時[じ]."
        },
        {
            "id": "ja-n5-u3-l1-ex-2",
            "type": "multiple-choice",
            "prompt": "Yapon tilida soat 4:00, 7:00 va 9:00 larning to'g'ri o'qilishlari qaysi (istisnolar)?",
            "options": [
                "4時 = よじ (Yoji), 7時 = しちじ (Shichiji), 9時 = くじ (Kuji)",
                "4時 = よんじ, 7時 = ななじ, 9時 = きゅうじ",
                "4時 = しじ, 7時 = しちじ, 9時 = くじ",
                "4時 = よじ, 7時 = ななじ, 9時 = きゅうじ"
            ],
            "correctAnswer": 0,
            "explanation": "Soatlardagi 3 ta muhim istisno: よじ (4:00), しちじ (7:00), くじ (9:00)."
        },
        {
            "id": "ja-n5-u3-l1-ex-3",
            "type": "multiple-choice",
            "prompt": "«30 daqiqa» yoki «yarim soat» qanday aytiladi?",
            "options": [
                "半[はん] (Han) yoki 30分[さんじゅっぷん] — masalan: 8時半 (Hachiji han)",
                "中[なか]",
                "間[あいだ]",
                "分[ふん]"
            ],
            "correctAnswer": 0,
            "explanation": "Yarim: 半[はん]. Masalan: 8時半 = 8:30 (sakkiz yarim)."
        },
        {
            "id": "ja-n5-u3-l1-ex-4",
            "type": "multiple-choice",
            "prompt": "«Hozir soat necha?»:",
            "options": [
                "今[いま] 何時[なんじ]ですか (Ima nanji desu ka)",
                "今 何日ですか",
                "今 何曜日ですか",
                "今 いくらですか"
            ],
            "correctAnswer": 0,
            "explanation": "今 (hozir) + 何時ですか (soat necha?)."
        },
        {
            "id": "ja-n5-u3-l1-ex-5",
            "type": "multiple-choice",
            "prompt": "«Dushanba» kuni yapon tilida qanday ataladi?",
            "options": [
                "月曜日[げつようび] (Getsuyoubi) — Oy kuni",
                "火曜日[かようび]",
                "水曜日[すいようび]",
                "木曜日[もくようび]"
            ],
            "correctAnswer": 0,
            "explanation": "Dushanba: 月曜日[げつようび] (Oy belgisi bilan boshlanadi)."
        },
        {
            "id": "ja-n5-u3-l1-ex-6",
            "type": "multiple-choice",
            "prompt": "«Seshanba» kuni qaysi?",
            "options": [
                "火曜日[かようび] (Kayoubi) — Olov kuni",
                "水曜日[すいようび]",
                "金曜日[きんようび]",
                "土曜日[どようび]"
            ],
            "correctAnswer": 0,
            "explanation": "Seshanba: 火曜日[かようび]."
        },
        {
            "id": "ja-n5-u3-l1-ex-7",
            "type": "multiple-choice",
            "prompt": "«Chorshanba» kuni qaysi?",
            "options": [
                "水曜日[すいようび] (Suiyoubi) — Suv kuni",
                "木曜日[もくようび]",
                "金曜日[きんようび]",
                "日曜日[にちようび]"
            ],
            "correctAnswer": 0,
            "explanation": "Chorshanba: 水曜日[すいようび]."
        },
        {
            "id": "ja-n5-u3-l1-ex-8",
            "type": "multiple-choice",
            "prompt": "«Payshanba» kuni qaysi?",
            "options": [
                "木曜日[もくようび] (Mokuyoubi) — Daraxt kuni",
                "金曜日[きんようび]",
                "土曜日[どようび]",
                "月曜日[げつようび]"
            ],
            "correctAnswer": 0,
            "explanation": "Payshanba: 木曜日[もくようび]."
        },
        {
            "id": "ja-n5-u3-l1-ex-9",
            "type": "multiple-choice",
            "prompt": "«Juma» kuni qaysi?",
            "options": [
                "金曜日[きんようび] (Kinyoubi) — Oltin kuni",
                "土曜日[どようび]",
                "日曜日[にちようび]",
                "火曜日[かようび]"
            ],
            "correctAnswer": 0,
            "explanation": "Juma: 金曜日[きんようび]."
        },
        {
            "id": "ja-n5-u3-l1-ex-10",
            "type": "multiple-choice",
            "prompt": "«Shanba» va «Yakshanba» (dam olish kunlari):",
            "options": [
                "土曜日[どようび] (Shanba) va 日曜日[にちようび] (Yakshanba)",
                "月曜日 va 火曜日",
                "水曜日 va 木曜日",
                "金曜日 va 土曜日"
            ],
            "correctAnswer": 0,
            "explanation": "土曜日 (Shanba - Tuproq) va 日曜日 (Yakshanba - Quyosh)."
        },
        {
            "id": "ja-n5-u3-l1-ex-11",
            "type": "multiple-choice",
            "prompt": "«Bugun haftaning qaysi kuni?» deb so'rash:",
            "options": [
                "今日[きょう]は 何曜日[なんようび]ですか (Kyou wa nanyoubi desu ka)",
                "今日は 何日ですか",
                "今日は 何時ですか",
                "今日は なんのひですか"
            ],
            "correctAnswer": 0,
            "explanation": "Hafta kunini so'rash: 何曜日ですか."
        },
        {
            "id": "ja-n5-u3-l1-ex-12",
            "type": "multiple-choice",
            "prompt": "Vaqt oralig'ini bildiruvchi «...dan ...gacha» zarrachalari qaysilar?",
            "options": [
                "〜から 〜まで (Kara ... Made) — masalan: 9時から 5時まで",
                "〜へ 〜に",
                "〜で 〜を",
                "〜と 〜も"
            ],
            "correctAnswer": 0,
            "explanation": "から (boshlanish nuqtasi) + まで (tugash chegarasi)."
        },
        {
            "id": "ja-n5-u3-l1-ex-13",
            "type": "multiple-choice",
            "prompt": "«Bank soat 9:00 dan 15:00 gacha ishlaydi»:",
            "options": [
                "銀行[ぎんこう]は 9時[くじ]から 3時[さんじ]までです",
                "銀行は 9時に 3時へ 行きます",
                "銀行は 9時で 3時を します",
                "銀行は 9時と 3時も あります"
            ],
            "correctAnswer": 0,
            "explanation": "9時から 3時までです (soat 9 dan 3 gacha)."
        },
        {
            "id": "ja-n5-u3-l1-ex-14",
            "type": "multiple-choice",
            "prompt": "«Dam olish kuni shanba va yakshanbadir»:",
            "options": [
                "休[やす]みは 土曜日[どようび]と 日曜日[にちようび]です",
                "休みは 土曜日に 日曜日へです",
                "休みは 土曜日で 日曜日をです",
                "休みは 土曜日の 日曜日からです"
            ],
            "correctAnswer": 0,
            "explanation": "休み (dam olish kuni) は 土曜日と (shanba va) 日曜日です."
        },
        {
            "id": "ja-n5-u3-l1-ex-15",
            "type": "multiple-choice",
            "prompt": "«Ertalab 6:30 da uyg'onaman»:",
            "options": [
                "朝[あさ] 6時半[ろくじはん]に 起[お]きます",
                "朝 6時半で 起きます",
                "朝 6時半を 起きます",
                "朝 6時半へ 起きます"
            ],
            "correctAnswer": 0,
            "explanation": "Aniq vaqt: 6時半に + 起きます (uyg'onaman)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 12: Numbers (1-100,000), Money (円) & Prices (いくら)
    # ----------------------------------------------------
    "ja-n5-u3-l2": [
        {
            "id": "ja-n5-u3-l2-ex-1",
            "type": "multiple-choice",
            "prompt": "«Yuz» soni yapon tilida qanday o'qiladi?",
            "options": [
                "百[ひゃく] (Hyaku)",
                "千[せん]",
                "万[まん]",
                "十[じゅう]"
            ],
            "correctAnswer": 0,
            "explanation": "100 soni yapon tilida 百[ひゃく] (hyaku) deb o'qiladi va yoziladi."
        },
        {
            "id": "ja-n5-u3-l2-ex-2",
            "type": "multiple-choice",
            "prompt": "Yuzliklardagi (300, 600, 800) maxsus talaffuzlar qaysilar?",
            "options": [
                "300 = さんびゃく (Sanbyaku), 600 = ろっぴゃく (Roppyaku), 800 = はっぴゃく (Happyaku)",
                "300 = さんひゃく, 600 = ろくひゃく, 800 = はちひゃく",
                "300 = みっぴゃく, 600 = むっぴゃく, 800 = やっぴゃく",
                "300 = さんぴゃく, 600 = ろっびゃく, 800 = はっびゃく"
            ],
            "correctAnswer": 0,
            "explanation": "Yuzlikdagi istisnolar: さんびゃく (300), ろっぴゃく (600), はっぴゃく (800)."
        },
        {
            "id": "ja-n5-u3-l2-ex-3",
            "type": "multiple-choice",
            "prompt": "«Ming» soni va uning istisnolari (3,000 va 8,000) qaysi?",
            "options": [
                "1000 = せん (Sen), 3000 = さんぜん (Sanzen), 8000 = はっせん (Hassen)",
                "1000 = せん, 3000 = さんせん, 8000 = はちせん",
                "1000 = まん, 3000 = さんまん, 8000 = はちまん",
                "1000 = ひゃく, 3000 = さんぜん, 8000 = はっせん"
            ],
            "correctAnswer": 0,
            "explanation": "Minglikdagi istisnolar: 3000 = さんぜん, 8000 = はっせん."
        },
        {
            "id": "ja-n5-u3-l2-ex-4",
            "type": "multiple-choice",
            "prompt": "Yapon tilida «10,000» (o'n ming) alohida razryadga ega. U nima deb ataladi?",
            "options": [
                "一万[いちまん] (Ichiman)",
                "十千[じゅうせん]",
                "百万[ひゃくまん]",
                "千万[せんまん]"
            ],
            "correctAnswer": 0,
            "explanation": "Yapon sanoq tizimi 4 ta noldan (10,000 = 万) guruhlanadi. 10,000 = 一万 (Ichiman)."
        },
        {
            "id": "ja-n5-u3-l2-ex-5",
            "type": "multiple-choice",
            "prompt": "Yaponiya pul birligi bo'lgan «Iyen» (Yen) qanday belgilanadi va o'qiladi?",
            "options": [
                "円[えん] (En) — masalan: 100円 (Hyaku-en)",
                "元[げん]",
                "弗[どる]",
                "銭[せん]"
            ],
            "correctAnswer": 0,
            "explanation": "Yapon pul birligi: 円[えん] (En)."
        },
        {
            "id": "ja-n5-u3-l2-ex-6",
            "type": "multiple-choice",
            "prompt": "«Bu qancha turadi?»:",
            "options": [
                "これは いくらですか (Kore wa ikura desu ka)",
                "これは なんじですか",
                "これは いくつですか",
                "これは どこですか"
            ],
            "correctAnswer": 0,
            "explanation": "Narx so'rash: いくらですか."
        },
        {
            "id": "ja-n5-u3-l2-ex-7",
            "type": "multiple-choice",
            "prompt": "«150 yen» sonining to'g'ri o'qilishi:",
            "options": [
                "ひゃくごじゅうえん (Hyaku-gojuu-en)",
                "せんごじゅうえん",
                "ひゃくごえん",
                "いちまんごえん"
            ],
            "correctAnswer": 0,
            "explanation": "100 (ひゃく) + 50 (ごじゅう) + 円 (えん) = ひゃくごじゅうえん."
        },
        {
            "id": "ja-n5-u3-l2-ex-8",
            "type": "multiple-choice",
            "prompt": "«3,800 yen» sonining to'g'ri o'qilishi:",
            "options": [
                "さんぜんはっぴゃくえん (Sanzen-happyaku-en)",
                "さんせんはちひゃくえん",
                "さんぜんはちひゃくえん",
                "さんぜんろっぴゃくえん"
            ],
            "correctAnswer": 0,
            "explanation": "3000 (さんぜん) + 800 (はっぴゃく) + 円 = さんぜんはっぴゃくえん."
        },
        {
            "id": "ja-n5-u3-l2-ex-9",
            "type": "multiple-choice",
            "prompt": "«Hammasi bo'lib 5,000 yen bo'ldi»:",
            "options": [
                "全部[ぜんぶ]で 5,000円[ごせんえん]です",
                "全部に 5,000円です",
                "全部を 5,000円です",
                "全部へ 5,000円です"
            ],
            "correctAnswer": 0,
            "explanation": "Jami / umumiy hisobda: 全部で[ぜんぶで]."
        },
        {
            "id": "ja-n5-u3-l2-ex-10",
            "type": "multiple-choice",
            "prompt": "Do'konda xaridor sotuvchiga pul uzatganda «Mana bu 10,000 yen» deb qanday aytadi?",
            "options": [
                "10,000円[いちまんえん]から お願いします / 10,000円で お願いします",
                "10,000円を ください",
                "10,000円が ありません",
                "10,000円を 食べます"
            ],
            "correctAnswer": 0,
            "explanation": "Kassaga yirik pul uzatganda: 1万円から お願いします (yoki 1万円お預かりします)."
        },
        {
            "id": "ja-n5-u3-l2-ex-11",
            "type": "multiple-choice",
            "prompt": "Kassadan qaytariladigan ortiqcha pul (qaytim) yapon tilida nima deyiladi?",
            "options": [
                "お釣り[おつり] (O-tsuri)",
                "おさいふ (Hamyon)",
                "おかね (Pul)",
                "おみやげ (Esdalik sovg'a)"
            ],
            "correctAnswer": 0,
            "explanation": "Qaytim puli: お釣り[おつり]."
        },
        {
            "id": "ja-n5-u3-l2-ex-12",
            "type": "multiple-choice",
            "prompt": "«Shuni bering (shuni olaman)»:",
            "options": [
                "これを ください (Kore o kudasai)",
                "これを します",
                "これを 買いますか",
                "これを どうぞ"
            ],
            "correctAnswer": 0,
            "explanation": "Xaridda biror narsani tanlab olish: これを ください."
        },
        {
            "id": "ja-n5-u3-l2-ex-13",
            "type": "multiple-choice",
            "prompt": "«50,000» (ellik ming) sonining yaponcha o'qilishi:",
            "options": [
                "五万[ごまん] (Goman)",
                "五十千[ごじゅうせん]",
                "五千[ごせん]",
                "五百万[ごひゃくまん]"
            ],
            "correctAnswer": 0,
            "explanation": "50,000 = 5 x 10,000 = 五万[ごまん]."
        },
        {
            "id": "ja-n5-u3-l2-ex-14",
            "type": "multiple-choice",
            "prompt": "«Bu qalam juda arzon»:",
            "options": [
                "この ペンは とても 安[やす]いです (Kono pen wa totemo yasui desu)",
                "この ペンは とても 高いです",
                "この ペンは とても 新しいです",
                "この ペンは とても 古いです"
            ],
            "correctAnswer": 0,
            "explanation": "安い[やすい] — arzon narxli."
        },
        {
            "id": "ja-n5-u3-l2-ex-15",
            "type": "multiple-choice",
            "prompt": "«O'sha 200 yenlik nonni bering»:",
            "options": [
                "その 200円の パンを ください",
                "その 200円で パンを ください",
                "その 200円に パンを ください",
                "その 200円を パンで ください"
            ],
            "correctAnswer": 0,
            "explanation": "Narx + の + mahsulot: 200円のパン (200 yenlik non)."
        }
    ],

    # ----------------------------------------------------
    # Lesson 13: Counters (人, 冊, 本, 枚, つ)
    # ----------------------------------------------------
    "ja-n5-u3-l3": [
        {
            "id": "ja-n5-u3-l3-ex-1",
            "type": "multiple-choice",
            "prompt": "Yapon tilida buyumlarni umumiy sanashda (1 dan 5 gacha) an'anaviy sanoq so'zlari qaysi?",
            "options": [
                "1=ひとつ, 2=ふたつ, 3=みっつ, 4=よっつ, 5=いつつ",
                "1=いち, 2=に, 3=さん, 4=よん, 5=ご",
                "1=ひとり, 2=ふたり, 3=さんにん, 4=よにん, 5=ごにん",
                "1=いっぽん, 2=にほん, 3=さんぼん, 4=よんほん, 5=ごほん"
            ],
            "correctAnswer": 0,
            "explanation": "Umumiy sanoq (〜つ): ひとつ, ふたつ, みっつ, よっつ, いつつ..."
        },
        {
            "id": "ja-n5-u3-l3-ex-2",
            "type": "multiple-choice",
            "prompt": "Buyumlar sonini so'rashda «Nechta?» so'rog'i qanday aytiladi?",
            "options": [
                "いくつ (Ikutsu)",
                "いくら (Ikura)",
                "いつ (Itsu)",
                "だれ (Dare)"
            ],
            "correctAnswer": 0,
            "explanation": "いくつ (Ikutsu) — buyumlar uchun «nechta?» so'rog'i."
        },
        {
            "id": "ja-n5-u3-l3-ex-3",
            "type": "multiple-choice",
            "prompt": "Odamlarni sanashda 1 kishi va 2 kishi qanday o'qiladi (istisnolar)?",
            "options": [
                "1 kishi = 一人[ひとり] (Hitori), 2 kishi = 二人[ふたり] (Futari)",
                "1 kishi = いちにん, 2 kishi = ににん",
                "1 kishi = ひとつ, 2 kishi = ふたつ",
                "1 kishi = いっぽん, 2 kishi = にほん"
            ],
            "correctAnswer": 0,
            "explanation": "Odamlar sanog'ida 1 va 2 istisno: ひとり (1 kishi), ふたり (2 kishi). 3 dan boshlab: さんにん, よにん..."
        },
        {
            "id": "ja-n5-u3-l3-ex-4",
            "type": "multiple-choice",
            "prompt": "Kitob, daftar va jurnallar qaysi sanovchi qo'shimcha bilan sanaladi?",
            "options": [
                "〜冊[さつ] (Satsu) — masalan: 本を 2冊 買いました",
                "〜本[ほん]",
                "〜枚[まい]",
                "〜台[だい]"
            ],
            "correctAnswer": 0,
            "explanation": "Muqovalangan kitob-daftarlar: 〜冊[さつ]."
        },
        {
            "id": "ja-n5-u3-l3-ex-5",
            "type": "multiple-choice",
            "prompt": "Yupqa va yassi buyumlar (qog'oz, chipta, fototopshiriq, ko'ylak, tarelka) qaysi sanovchi bilan sanaladi?",
            "options": [
                "〜枚[まい] (Mai) — masalan: 切符を 1枚 (Kippu o ichimai)",
                "〜本[ほん]",
                "〜冊[さつ]",
                "〜匹[ひき]"
            ],
            "correctAnswer": 0,
            "explanation": "Tekis va yupqa buyumlar uchun: 〜枚[まい]."
        },
        {
            "id": "ja-n5-u3-l3-ex-6",
            "type": "multiple-choice",
            "prompt": "Uzun va silindrsimon buyumlar (qalam, shisha, daraxt, soyabon, banan) qaysi sanovchi bilan sanaladi?",
            "options": [
                "〜本[ほん / ぽん / ぼん] (Hon / Pon / Bon)",
                "〜冊[さつ]",
                "〜枚[まい]",
                "〜個[こ]"
            ],
            "correctAnswer": 0,
            "explanation": "Uzun silindrik buyumlar: 〜本[ほん]. Istisnolar: 1本 (いっぽん), 3本 (さんぼん), 6本 (ろっぽん)."
        },
        {
            "id": "ja-n5-u3-l3-ex-7",
            "type": "multiple-choice",
            "prompt": "Avtomobil, velosiped, kompyuter va maishiy texnika qaysi sanovchi bilan sanaladi?",
            "options": [
                "〜台[だい] (Dai) — masalan: 車を 1台 (Kuruma o ichidai)",
                "〜本[ほん]",
                "〜枚[まい]",
                "〜冊[さつ]"
            ],
            "correctAnswer": 0,
            "explanation": "Mexanizm va texnikalar: 〜台[だい]."
        },
        {
            "id": "ja-n5-u3-l3-ex-8",
            "type": "multiple-choice",
            "prompt": "Kichik hayvonlar (it, mushuk, baliq) qaysi sanovchi bilan sanaladi?",
            "options": [
                "〜匹[ひき / ぴき / びき] (Hiki / Piki / Biki) — masalan: 猫が 2匹",
                "〜人[にん]",
                "〜頭[とう]",
                "〜羽[わ]"
            ],
            "correctAnswer": 0,
            "explanation": "Kichik uy hayvonlari: 〜匹[ひき]."
        },
        {
            "id": "ja-n5-u3-l3-ex-9",
            "type": "multiple-choice",
            "prompt": "Ichimliklar (finjon, stakan, piyola) qanday sanaladi?",
            "options": [
                "〜杯[はい / ぱい / ばい] (Hai / Pai / Bai) — masalan: コーヒーを 1杯 (Ippai)",
                "〜本[ほん]",
                "〜個[こ]",
                "〜皿[さら]"
            ],
            "correctAnswer": 0,
            "explanation": "Suyuqlik to'ldirilgan idish: 〜杯[はい]. 1 finjon = いっぱい (Ippai)."
        },
        {
            "id": "ja-n5-u3-l3-ex-10",
            "type": "multiple-choice",
            "prompt": "«Oila a'zolaringiz necha kishi?»:",
            "options": [
                "家族[かぞく]は 何人[なんにん]ですか (Kazoku wa nannin desu ka)",
                "家族は いくつですか",
                "家族は いくらですか",
                "家族は どこですか"
            ],
            "correctAnswer": 0,
            "explanation": "Odamlar soni: 何人[なんにん]ですか."
        },
        {
            "id": "ja-n5-u3-l3-ex-11",
            "type": "multiple-choice",
            "prompt": "Kafeda buyurtma berish: «Ikkita qahva bering»:",
            "options": [
                "コーヒーを 二つ[ふたつ] ください (yoki 2杯 ください)",
                "コーヒーを 二人 ください",
                "コーヒーを 二冊 ください",
                "コーヒーを 二枚 ください"
            ],
            "correctAnswer": 0,
            "explanation": "Umumiy buyurtmada: ふたつ ください."
        },
        {
            "id": "ja-n5-u3-l3-ex-12",
            "type": "multiple-choice",
            "prompt": "«Poyezd chiptasidan 2 dona bering»:",
            "options": [
                "切符[きっぷ]を 2枚[にまい] ください",
                "切符を 2本 ください",
                "切符を 2台 ください",
                "切符を 2匹 ください"
            ],
            "correctAnswer": 0,
            "explanation": "Chipta (qog'oz) uchun: 2枚[にまい]."
        },
        {
            "id": "ja-n5-u3-l3-ex-13",
            "type": "multiple-choice",
            "prompt": "Yapon tilida sanoq so'zlari gapda qayerga joylashadi?",
            "options": [
                "Odatda zarrachadan keyin, bevosita fe'lning oldida (masalan: りんごを 3つ 買いました)",
                "Doimo gapning eng boshida",
                "Doimo gapning eng oxirida fe'ldan keyin",
                "Faqat mavzu zarrachasi «は» dan oldin"
            ],
            "correctAnswer": 0,
            "explanation": "Yapon tilining standart tartibi: [Ot] + を + [Sanoq so'zi] + [Fe'l]. Masalan: ビールを 2本 飲みました."
        },
        {
            "id": "ja-n5-u3-l3-ex-14",
            "type": "multiple-choice",
            "prompt": "«Xonada talabalar nechta (necha kishi) bor?»:",
            "options": [
                "教室[きょうしつ]に 学生[がくせい]が 何人[なんにん] いますか",
                "教室に 学生が いくつ ありますか",
                "教室に 学生が 何枚 いますか",
                "教室に 学生が 何本 ありますか"
            ],
            "correctAnswer": 0,
            "explanation": "Talabalar tirik jon bo'lgani sababli: 何人 いますか."
        },
        {
            "id": "ja-n5-u3-l3-ex-15",
            "type": "multiple-choice",
            "prompt": "«Kecha kitob do'konidan 3 ta kitob sotib oldim»:",
            "options": [
                "昨日 本屋[ほんや]で 本を 3冊[さんさつ] 買[か]いました",
                "昨日 本屋で 本を 3本 買いました",
                "昨日 本屋で 本を 3枚 買いました",
                "昨日 本屋で 本を 3台 買いました"
            ],
            "correctAnswer": 0,
            "explanation": "Kitob uchun: 3冊[さんさつ]."
        }
    ],

    # ----------------------------------------------------
    # Lesson 14: Past Tense of Verbs: 〜ました / 〜ませんでした
    # ----------------------------------------------------
    "ja-n5-u3-l4": [
        {
            "id": "ja-n5-u3-l4-ex-1",
            "type": "multiple-choice",
            "prompt": "Fe'lning xushmuomala o'tgan zamon tasdiq shakli qaysi qo'shimcha bilan yasaladi?",
            "options": [
                "〜ました (〜Mashita) — masalan: 食べました (Yedim / Yedi)",
                "〜ます",
                "〜ません",
                "〜ませんでした"
            ],
            "correctAnswer": 0,
            "explanation": "Fe'l o'tgan zamon tasdig'i: 〜ました."
        },
        {
            "id": "ja-n5-u3-l4-ex-2",
            "type": "multiple-choice",
            "prompt": "Fe'lning xushmuomala o'tgan zamon inkor shakli qaysi?",
            "options": [
                "〜ませんでした (〜Masen deshita) — masalan: 行きませんでした (Bormadim)",
                "〜ません",
                "〜ました",
                "〜ないでした"
            ],
            "correctAnswer": 0,
            "explanation": "Fe'l o'tgan zamon inkori: 〜ませんでした."
        },
        {
            "id": "ja-n5-u3-l4-ex-3",
            "type": "multiple-choice",
            "prompt": "«Kecha» so'zining to'g'ri yaponcha varianti:",
            "options": [
                "昨日[きのう] (Kinou)",
                "今日[きょう] (Kyou)",
                "明日[あした] (Ashita)",
                "あさって (Asatte)"
            ],
            "correctAnswer": 0,
            "explanation": "昨日[きのう] — kecha."
        },
        {
            "id": "ja-n5-u3-l4-ex-4",
            "type": "multiple-choice",
            "prompt": "«O'tgan hafta» so'zining to'g'ri o'qilishi:",
            "options": [
                "先週[せんしゅう] (Senshuu)",
                "今週[こんしゅう]",
                "来週[らいしゅう]",
                "毎週[まいしゅう]"
            ],
            "correctAnswer": 0,
            "explanation": "先週[せんしゅう] — o'tgan hafta."
        },
        {
            "id": "ja-n5-u3-l4-ex-5",
            "type": "multiple-choice",
            "prompt": "«O'tgan oy» so'zi qaysi?",
            "options": [
                "先月[せんげつ] (Sengetsu)",
                "今月[こんげつ]",
                "来月[らいげつ]",
                "毎月[まいつき]"
            ],
            "correctAnswer": 0,
            "explanation": "先月[せんげつ] — o'tgan oy."
        },
        {
            "id": "ja-n5-u3-l4-ex-6",
            "type": "multiple-choice",
            "prompt": "«O'tgan yil» so'zi qaysi?",
            "options": [
                "去年[きょねん] (Kyonen)",
                "今年[ことし]",
                "来年[らいねん]",
                "毎年[まいとし]"
            ],
            "correctAnswer": 0,
            "explanation": "去年[きょねん] — o'tgan yil."
        },
        {
            "id": "ja-n5-u3-l4-ex-7",
            "type": "multiple-choice",
            "prompt": "«Kecha nima qildingiz?»:",
            "options": [
                "昨日 何[なに]を しましたか (Kinou nani o shimashita ka)",
                "今日 何を しますか",
                "明日 何を しますか",
                "昨日 どこへ 行きますか"
            ],
            "correctAnswer": 0,
            "explanation": "昨日 + 何を + しましたか (o'tgan zamon)."
        },
        {
            "id": "ja-n5-u3-l4-ex-8",
            "type": "multiple-choice",
            "prompt": "«Do'stim bilan birga kinoga bordim»:",
            "options": [
                "友達[ともだち]と 映画[えいが]を 見[み]に 行[い]きました",
                "友達と 映画を 見に行きます",
                "友達で 映画を 見に行きました",
                "友達に 映画を 見に行きます"
            ],
            "correctAnswer": 0,
            "explanation": "Hamroh (友達と) + maqsad (見に) + 行きました (bordim)."
        },
        {
            "id": "ja-n5-u3-l4-ex-9",
            "type": "multiple-choice",
            "prompt": "«Kecha kechqurun dars qilmadim (o'qimadim)»:",
            "options": [
                "昨日の 夜[よる] 勉強[べんきょう]しませんでした",
                "昨日の 夜 勉強しました",
                "昨日の 夜 勉強しません",
                "昨日の 夜 勉強します"
            ],
            "correctAnswer": 0,
            "explanation": "O'tgan zamon inkori: 勉強しませんでした."
        },
        {
            "id": "ja-n5-u3-l4-ex-10",
            "type": "multiple-choice",
            "prompt": "A: 「昨日 図書館[としょかん]へ 行きましたか。」\nB: 「いいえ、（　　）。」\nInkor javobni to'g'ri to'ldiring:",
            "options": [
                "行きませんでした (Ikimasen deshita)",
                "行きました",
                "行きません",
                "行きます"
            ],
            "correctAnswer": 0,
            "explanation": "«いいえ» bilan o'tgan zamonga javob: 行きませんでした."
        },
        {
            "id": "ja-n5-u3-l4-ex-11",
            "type": "multiple-choice",
            "prompt": "«Yakshanba kuni hech qayerga bormadim»:",
            "options": [
                "日曜日に どこへも 行きませんでした",
                "日曜日に どこへ 行きました",
                "日曜日に どこへも 行きません",
                "日曜日に なにも 行きませんでした"
            ],
            "correctAnswer": 0,
            "explanation": "どこへも + 行きませんでした (hech qayerga bormadim)."
        },
        {
            "id": "ja-n5-u3-l4-ex-12",
            "type": "multiple-choice",
            "prompt": "«Ertalab non yedim va qahva ichdim»:",
            "options": [
                "朝[あさ] パンを 食[た]べました。そして、コーヒーを 飲[の]みました。",
                "朝 パンを 食べます。そして コーヒーを 飲みます。",
                "朝 パンを 食べませんでした。コーヒーを 飲みませんでした。",
                "朝 パンで 食べました。コーヒーで 飲みました。"
            ],
            "correctAnswer": 0,
            "explanation": "O'tmishdagi harakatlar: 食べました ... 飲みました."
        },
        {
            "id": "ja-n5-u3-l4-ex-13",
            "type": "multiple-choice",
            "prompt": "«Kecha soat 11 da uxladim»:",
            "options": [
                "昨日 11時に 寝[ね]ました (Kinou juuichiji ni nemashita)",
                "昨日 11時で 起きました",
                "昨日 11時を 寝ました",
                "昨日 11時へ 起きました"
            ],
            "correctAnswer": 0,
            "explanation": "Uxlash: 寝ました (nemashita)."
        },
        {
            "id": "ja-n5-u3-l4-ex-14",
            "type": "multiple-choice",
            "prompt": "«O'tgan yili Yaponiyaga keldim»:",
            "options": [
                "去年[きょねん] 日本へ 来[き]ました (Kyonen Nihon e kimashita)",
                "去年 日本へ 行きました",
                "去年 日本で 帰りました",
                "去年 日本を 来ました"
            ],
            "correctAnswer": 0,
            "explanation": "So'zlovchi hozir Yaponiyada bo'lsa: 日本へ来ました."
        },
        {
            "id": "ja-n5-u3-l4-ex-15",
            "type": "multiple-choice",
            "prompt": "Qaysi gapda zamon uyg'unligi (mosligi) BUZILGAN?",
            "options": [
                "明日[あした] 映画を 見ました (Ertaga ko'rdim - xato)",
                "昨日 映画を 見ました",
                "明日 映画を 見ます",
                "毎日 映画を 見ます"
            ],
            "correctAnswer": 0,
            "explanation": "«明日» (ertaga - kelasi zamon) bilan «見ました» (o'tgan zamon) birga kela olmaydi."
        }
    ],

    # ----------------------------------------------------
    # Lesson 15: N5 Listening: Daily Conversations & Asking Directions
    # ----------------------------------------------------
    "ja-n5-u3-l5": [
        {
            "id": "ja-n5-u3-l5-e1",
            "type": "multiple-choice",
            "prompt": "Audioda aytilishicha, pochta bo'limi (郵便局) qayerda joylashgan?",
            "options": [
                "Bankning yonida (銀行の 隣)",
                "Park orqasida",
                "Maktab ichida",
                "Vokzal qarshisida"
            ],
            "correctAnswer": 0,
            "explanation": "Audioda «郵便局は 銀行の 隣に あります» deyilgan.",
            "audioUrl": "/audio/choukai/n5/minna_shokyu_1_001.mp3",
            "audioTitle": "N5 Listening 01: 道案内 (Asking Directions)"
        },
        {
            "id": "ja-n5-u3-l5-e2",
            "type": "multiple-choice",
            "prompt": "Audioda yo'lovchi vokzalga (駅) qanday borishni tushuntirdi?",
            "options": [
                "To'g'riga borib, chorrahada o'ngga burilish kerak",
                "Orqaga qaytish kerak",
                "Avtobusga o'tirish shart",
                "Metroga tushish kerak"
            ],
            "correctAnswer": 0,
            "explanation": "Spiker to'g'riga borib (まっすぐ行って), chorrahadan o'ngga burilishni (右へ曲がって) aytdi.",
            "audioUrl": "/audio/choukai/n5/minna_shokyu_1_002.mp3",
            "audioTitle": "N5 Listening 02: 駅はどこですか"
        },
        {
            "id": "ja-n5-u3-l5-e3",
            "type": "multiple-choice",
            "prompt": "Audiodagi supermarket soat nechadan nechagacha ochiq?",
            "options": [
                "Ertalab 9:00 dan kechqurun 21:00 gacha",
                "10:00 dan 18:00 gacha",
                "Kun bo'yi yopiq",
                "Faqat tushdan keyin"
            ],
            "correctAnswer": 0,
            "explanation": "Audioda «朝9時から 夜9時までです» deb e'lon qilindi.",
            "audioUrl": "/audio/choukai/n5/minna_shokyu_1_003.mp3",
            "audioTitle": "N5 Listening 03: スーパーの営業時間"
        },
        {
            "id": "ja-n5-u3-l5-e4",
            "type": "multiple-choice",
            "prompt": "Audioda keyingi poyezd soat nechada jo'nashi aytildi?",
            "options": [
                "10:15 da",
                "10:00 da",
                "11:30 da",
                "12:00 da"
            ],
            "correctAnswer": 0,
            "explanation": "Stansiya xodimi «次は 10時15分です» deb javob berdi.",
            "audioUrl": "/audio/choukai/n5/minna_shokyu_1_004.mp3",
            "audioTitle": "N5 Listening 04: 電車の時間"
        },
        {
            "id": "ja-n5-u3-l5-e5",
            "type": "multiple-choice",
            "prompt": "Xaridor sotuvchidan nimani buyurtma qildi?",
            "options": [
                "Qahva va non",
                "Sharbat va meva",
                "Choy va gazeta",
                "Suv va shirinlik"
            ],
            "correctAnswer": 0,
            "explanation": "Xaridor: «コーヒーと パンを ください» deb murojaat qildi.",
            "audioUrl": "/audio/choukai/n5/minna_shokyu_1_005.mp3",
            "audioTitle": "N5 Listening 05: 買い物"
        },
        {
            "id": "ja-n5-u3-l5-ex-6",
            "type": "multiple-choice",
            "prompt": "«To'g'riga qarab yuring» iborasi yapon tilida qanday aytiladi?",
            "options": [
                "まっすぐ 行[い]ってください (Massugu itte kudasai)",
                "右へ 曲がってください",
                "左へ 曲がってください",
                "止まってください"
            ],
            "correctAnswer": 0,
            "explanation": "まっすぐ (to'g'riga) + 行ってください."
        },
        {
            "id": "ja-n5-u3-l5-ex-7",
            "type": "multiple-choice",
            "prompt": "«O'ng tomonga buriling»:",
            "options": [
                "右[みぎ]へ 曲[ま]がってください (Migi e magatte kudasai)",
                "左へ 曲がってください",
                "まっすぐ 行ってください",
                "後ろへ 行ってください"
            ],
            "correctAnswer": 0,
            "explanation": "右[みぎ] (o'ng tomon) + へ 曲がってください (buriling)."
        },
        {
            "id": "ja-n5-u3-l5-ex-8",
            "type": "multiple-choice",
            "prompt": "«Chap tomonga buriling»:",
            "options": [
                "左[ひだり]へ 曲[ま]がってください (Hidari e magatte kudasai)",
                "右へ 曲がってください",
                "まっすぐ 行ってください",
                "中へ 入ってください"
            ],
            "correctAnswer": 0,
            "explanation": "左[ひだり] (chap tomon) + へ 曲がってください."
        },
        {
            "id": "ja-n5-u3-l5-ex-9",
            "type": "multiple-choice",
            "prompt": "«Chorraha» so'zining to'g'ri yaponcha varianti:",
            "options": [
                "交差点[こうさてん] (Kousaten)",
                "信号[しんごう] (Svetofor)",
                "角[かど] (Burchak)",
                "橋[はし] (Ko'prik)"
            ],
            "correctAnswer": 0,
            "explanation": "交差点[こうさてん] — yo'llar kesishmasi (chorraha)."
        },
        {
            "id": "ja-n5-u3-l5-ex-10",
            "type": "multiple-choice",
            "prompt": "«Svetofor» so'zi yapon tilida qaysi?",
            "options": [
                "信号[しんごう] (Shingou)",
                "交差点 (Kousaten)",
                "道 (Michi)",
                "駅 (Eki)"
            ],
            "correctAnswer": 0,
            "explanation": "信号[しんごう] — svetofor."
        },
        {
            "id": "ja-n5-u3-l5-ex-11",
            "type": "multiple-choice",
            "prompt": "«Bank va pochtaning o'rtasida»:",
            "options": [
                "銀行[ぎんこう]と 郵便局[ゆうびんきょく]の 間[あいだ]",
                "銀行と 郵便局の 隣",
                "銀行と 郵便局の 近く",
                "銀行と 郵便局の 前"
            ],
            "correctAnswer": 0,
            "explanation": "Ikki narsa o'rtasi: A と B の 間[あいだ]."
        },
        {
            "id": "ja-n5-u3-l5-ex-12",
            "type": "multiple-choice",
            "prompt": "«隣» (Tonari) va «近く» (Chikaku) ning asosiy farqi nima?",
            "options": [
                "隣 — bevosita yonginasida (bitta turdagi narsa yonma-yon); 近く — atrofida / yaqinida",
                "Ikkalasi bir xil",
                "Tonari faqat insonlar uchun",
                "Chikaku faqat uzoq joylar uchun"
            ],
            "correctAnswer": 0,
            "explanation": "隣[となり] — bevosita devor-darmiyon qo'shni; 近く[ちかく] — yaqin tevarak-atrofda."
        },
        {
            "id": "ja-n5-u3-l5-ex-13",
            "type": "multiple-choice",
            "prompt": "«Stansiyagacha qancha vaqt ketadi?»:",
            "options": [
                "駅[えき]まで どのくらい かかりますか",
                "駅まで いくらですか",
                "駅まで なんですか",
                "駅まで だれですか"
            ],
            "correctAnswer": 0,
            "explanation": "Vaqt yoki masofa davomiyligini so'rash: どのくらい かかりますか."
        },
        {
            "id": "ja-n5-u3-l5-ex-14",
            "type": "multiple-choice",
            "prompt": "«Piyoda 5 daqiqacha vaqt oladi»:",
            "options": [
                "歩[ある]いて 5分[ごふん]くらい かかります",
                "歩いてで 5分かかります",
                "走って 5分になります",
                "電車で 5時かかります"
            ],
            "correctAnswer": 0,
            "explanation": "歩いて (piyoda) + 5分くらい (5 daqiqacha) + かかります."
        },
        {
            "id": "ja-n5-u3-l5-ex-15",
            "type": "multiple-choice",
            "prompt": "Ko'chada notanish odamdan yo'l so'rashdan oldin aytiladigan odobli kirish so'zi:",
            "options": [
                "「すみません、ちょっと お伺[うかが]いしますが...」",
                "「おい、教えろ」",
                "「さようなら」",
                "「ごちそうさまでした」"
            ],
            "correctAnswer": 0,
            "explanation": "Xushmuomala yo'l so'rash: 「すみません、ちょっと お伺いしますが...」 (Kechirasiz, bir narsa so'rasam maylimi?)."
        }
    ]
}
