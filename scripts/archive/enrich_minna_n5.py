#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
enrich_minna_n5.py
Comprehensive pedagogical enrichment pipeline for Minna no Nihongo Shokyu 1 (Lessons 1-25) in Kaiwa Live.
"""

import json
import os
import re
import hashlib
import random

DATA_PATH = "src/data/minna_shokyu1_complete.json"
TARGET_FILE = "src/data/curriculum/minnaN5Lessons.ts"

with open(DATA_PATH, "r", encoding="utf-8") as f:
    lessons = json.load(f)

print(f"Loaded {len(lessons)} lessons from {DATA_PATH}")

CULTURAL_NOTES = {
    1: "Yaponiyada yangi tanishganda ta'zim qilinadi (ojigi). Boshqalar ismiga doimo '～san' qo'shiladi, lekin o'z ismiga hech qachon 'san' qo'shilmaydi. Tanishuv 'Hajimemashite' bilan boshlanib, 'Douzo yoroshiku onegaishimasu' bilan yakunlanadi.",
    2: "Yaponiyada tashrif qog'ozi (meishi) ikki qo'llab beriladi va ikki qo'llab qabul qilinadi. Sovg'a berganda kamsuqumlik bilan 'ほんの気持ちです' (arzimagan sovg'a) deyiladi.",
    3: "Yapon savdo markazlarida va do'konlarda xaridor kirganda xushmuomalalik bilan 'いらっしゃいませ' deb kutib olinadi. Pul to'lashda pul patnisga (tsuritray) qo'yiladi, to'g'ridan-to'g'ri qo'lga berilmaydi.",
    4: "Yaponiyada poyezdlar va avtobuslar daqiqasigacha aniq ishlaydi. Banklar va pochtalar qat'iy jadval asosida ishlaydi (odatda 9:00 dan 15:00 yoki 17:00 gacha).",
    5: "Yaponiyada transport tizimi juda rivojlangan. Tezyurar poyezd Shinkansen bilan shaharlararo sayohat qilinadi. Pasxa va Obon bayramlarida hamma o'z ona shahriga (furusato) qaytadi.",
    6: "Tushlikka yoki choyga taklif qilganda to'g'ridan-to'g'ri 'birga boraylik' deyish o'rniga, muloyimlik bilan '~ませんか' (bormaysizmi?) deb so'raladi.",
    7: "Ovqatlanishdan oldin 'いただきます' (itadakimasu) va ovqatlangandan keyin 'ごちそうさまでした' (gochisousama deshita) deb taomni tayyorlaganlarga minnatdorchilik bildiriladi.",
    8: "Yaponiyada to'rt fasl (shiki) juda qadrlanadi. Bahorda sakura gullashi (hanami), kuzda esa qizil yaproqlar (momiji) tomosha qilinadi. Har faslning o'z an'anaviy taomlari bor.",
    9: "Yapon madaniyatida to'g'ridan-to'g'ri 'yo'q' yoki 'yoqtirmayman' deyish noqulay sanaladi. Uning o'rniga 'ちょっと...' (biroz noqulay...) iborasi qo'llaniladi.",
    10: "Yapon xonadonlariga kirganda poyafzal tashqarida yechiladi va shippak kiyiladi. Tatami qoplangan an'anaviy xonalarda esa shippak ham yechilib, paypoqda yuriladi.",
    11: "Yapon tilida narsalarni sanash uchun shakliga qarab maxsus sanoq so'zlari ishlatiladi: kitoblar uchun '～satsu', qog'ozlar uchun '～mai', qalamlar uchun '～hon', mashinalar uchun '～dai'.",
    12: "Yaponiyada fasllar va mahalliy festivallar (matsuri) juda mashhur. Shaharlar taqqoslanganda 'A to B to dochira ga...' iborasi orqali tanlov so'raladi.",
    13: "Restoranlarda hisob-kitob qilinganda ko'pincha hamma o'zi uchun to'laydi ('別々にお願いします' - betsubetsu ni onegaishimasu deb aytiladi).",
    14: "Birovdan yordam so'rashda yoki taksi haydovchisiga manzilni aytishda fe'lning Te-shakli + 'ください' qo'llaniladi (masalan: '駅まで 行ってください').",
    15: "Yaponiyada qoidalar va tartibga qat'iy rioya qilinadi. Biron narsa qilishdan oldin ruxsat so'rash uchun '~てもいいですか' ishlatiladi. Taqiq uchun '~てはいけません' qo'llaniladi.",
    16: "Bir nechta harakatni ketma-ket bajarganda fe'llar Te-shaklida bog'lanadi. Masalan: ertalab yugurib, dush qabul qilib, nonushta qilish.",
    17: "Kasal bo'lganda yoki shifokor qabulida alomatlarni aytib, dorilarni o'z vaqtida ichish lozim. 'Ichish shart' deganda '~なければなりません' ishlatiladi.",
    18: "Yaponiyada xobbi (shumi) va qobiliyat haqida suhbatlashish do'st orttirishning eng qulay yo'lidir ('〜が できます' - qila olaman).",
    19: "Fuji tog'iga chiqish yoki issiq buloqqa (onsen) borish yaponlar hayotidagi mashhur tajribalardandir. Buni ifodalashda '〜たことがあります' qo'llaniladi.",
    20: "Tengdoshlar, oila a'zolari va yaqin do'stlar bilan suhbatlashganda rasmiy 'Desu/Masu' o'rniga oddiy uslub (Futsuugo / 普通形) ishlatiladi.",
    21: "O'z fikrini bildirayotganda yaponlar muloyimlik bilan '〜と思います' (deb o'ylayman) qo'shimchasini qo'shib, o'z fikrini qat'iy hukm qilmasdan aytadilar.",
    22: "Yaponiyada kvartira ijaraga olish (apāto sagashi) madaniyati o'ziga xos bo'lib, xonalar hajmi tatami to'shamlari soni bilan o'lchanadi.",
    23: "Yaponiyada ko'chada adashib qolsangiz, mahalliy militsiya maskani — 'Koban' xodimlari doimo xaritadan yo'lni mehribonlik bilan tushuntirib berishadi.",
    24: "Yaponlar birovdan yordam olganda doimo '〜てもらいました' yoki '〜てくれました' deb alohida ehtirom va minnatdorchilik bildiradilar.",
    25: "Xayrlashuv va yangi bosqichga o'tishda '今まで本当にお世話になりました' (Shu paytgacha ko'rsatgan yordamingiz uchun rahmat) deb ta'zim qilinadi."
}

UNIT_TITLES = {
    1: "Minna Shokyu 1: 1–5 Darslar (Boshlang'ich Tanishuv va Harakat)",
    2: "Minna Shokyu 1: 6–10 Darslar (Kundalik Hayot, Oila va Mavjudlik)",
    3: "Minna Shokyu 1: 11–15 Darslar (Sanoq, Taqqoslash va Te-shakli)",
    4: "Minna Shokyu 1: 16–20 Darslar (Ketma-ketlik, Nai-shakli va Futsuugo)",
    5: "Minna Shokyu 1: 21–25 Darslar (Fikr, Aniqlovchi gaplar va Shart)"
}

CUSTOM_VOCAB_EXAMPLES = {
    "わたし": ("わたしは 学生[がくせい] です。", "Men talabaman."),
    "わたしたち": ("わたしたちは 留学生[りゅうがくせい] です。", "Biz xorijiy talabalarmiz."),
    "あなた": ("あなたは 日本人[にほんじん] ですか。", "Siz yaponmisiz?"),
    "あのひと": ("あの 人[ひと]は だれですか。", "U kishi kim?"),
    "あのかた": ("あの 方[かた]は どなたですか。", "U kishi (hurmat shakli) kimlar?"),
    "みなさん": ("皆さん[みなさん]、おはようございます。", "Hammaga xayrli tong."),
    "さん": ("田中[たなか]さんは 先生[せんせい] です。", "Tanaka janoblari o'qituvchi."),
    "ちゃん": ("タワポンちゃんの 妹[いもうと]は 5歳[ごさい] です。", "Tawaponchanning singlisi 5 yoshda."),
    "くん": ("山田[やまだ]くんは サッカーが 好[す]きです。", "Yamada-kun futbolni yaxshi ko'radi."),
    "じん": ("サントスさんは ブラジル人[じん] です。", "Janob Santos braziliyalik."),
    "アメリカじん": ("ミラーさんは アメリカ人[じん] です。", "Janob Miller amerikalik."),
    "せんせい": ("木村[きむら]先生は 日本語[にほんご]の 先生です。", "Kimura ustoz yapon tili o'qituvchisi."),
    "きょうし": ("わたしは 教師[きょうし] じゃありません。", "Men o'qituvchi emasman."),
    "がくせい": ("ミラーさんは アメリカの 学生[がくせい] です。", "Janob Miller amerikalik talaba."),
    "かいしゃいん": ("父[ちち]は 会社員[かいしゃいん] です。", "Otam firma xodimi."),
    "ぎんこういん": ("山田[やまだ]さんは 銀行員[ぎんこういん] です。", "Yamada janoblari bank xodimi."),
    "いしゃ": ("あの 方[かた]は 病院[びょういん]の 医者[いしゃ] です。", "U kishi shifoxona shifokori."),
    "けんきゅうしゃ": ("ワットさんは 大学[だいがく]の 研究者[けんきゅうしゃ] です。", "Janob Watt universitet tadqiqotchisi."),
    "エンジニア": ("グプタさんは IMCの エンジニアです。", "Janob Gupta IMC kompaniyasi muhandisi."),
    "だいがく": ("さくら大学[だいがく]へ 行[い]きます。", "Sakura universitetiga boraman."),
    "びょういん": ("あそこは 神戸[こうべ]病院[びょういん] です。", "Anavi yer Kobe shifoxonasi."),
    "でんき": ("電気[でんき]を つけて ください。", "Chiroqni yoqing, iltimos."),
    "だれ": ("あの 人[ひと]は だれですか。", "U kishi kim?"),
    "どなた": ("あちらの 方[かた]は どなたですか。", "Anavi kishi kimlar?"),
    "さい": ("わたしは 20歳[はたち] です。", "Men 20 yoshdaman."),
    "なんさい": ("お名前[なまえ]と おいくつ（何歳[なんさい]）ですか。", "Ismingiz nima va yoshingiz nechada?"),
    "はい": ("はい、そうです。", "Ha, shunday."),
    "いいえ": ("いいえ、違[ちが]います。", "Yo'q, unday emas."),
    "はじめまして": ("初[はじ]めまして、どうぞ よろしく。", "Tanishganimdan xursandman, tanishganimdan mamnunman."),
    "からきました": ("わたしは ウズベキスタンから 来[き]ました。", "Men O'zbekistondan keldim."),
    "これ": ("これは 日本[にほん]の 本[ほん] です。", "Bu Yaponiya kitobi."),
    "それ": ("それは 英語[えいご]の 辞書[じしょ] ですか。", "U ingliz tili lug'atimi?"),
    "あれ": ("あれは わたしのかさです。", "Anavi mening soyabonim."),
    "この": ("この本[ほん]は わたしのです。", "Bu kitob meniki."),
    "その": ("その時計[とけい]は スイスの 時計です。", "U soat Shveytsariya soati."),
    "あの": ("あの車[くるま]は ドイツの 自動車[じどうしゃ] です。", "Anavi mashina Germaniya avtomobili."),
    "ほん": ("図書館[としょかん]で 本[ほん]を 読[よ]みます。", "Kutubxonada kitob o'qiyman."),
    "じしょ": ("これは 電子[でんし]辞書[じしょ] です。", "Bu elektron lug'at."),
    "ざっし": ("カメラの 雑誌[ざっし]を 買[か]いました。", "Kamera jurnali sotib oldim."),
    "しんぶん": ("毎朝[まいあさ] 新聞[しんぶん]を 読[よ]みます。", "Har kuni ertalab gazeta o'qiyman."),
    "てちょう": ("手帳[てちょう]に 予定[よてい]を 書[か]きます。", "Yon daftarchaga rejalarni yozaman."),
    "めいし": ("どうぞ 名刺[めいし]を お受[う]け取[と]りください。", "Marhamat, tashrif qog'ozimni qabul qiling."),
    "とけい": ("この 時計[とけい]は 父[ちち]の 時計です。", "Bu soat otamning soati."),
    "かさ": ("雨[あめ]ですから、かさを 持[も]って 行きます。", "Yomg'ir yog'yapti, soyabon olib boraman."),
    "かばん": ("これは 軽[かる]い かばんです。", "Bu yengil sumka."),
    "テレビ": ("毎晩[まいばん] テレビを 見[み]ます。", "Har kuni kechqurun televizor ko'raman."),
    "ラジオ": ("ラジオで ニュースを 聞[き]きます。", "Radioda yangiliklarni eshitaman."),
    "カメラ": ("これは 新[あたら]しい カメラです。", "Bu yangi fotoapparat."),
    "コンピューター": ("会社[かいしゃ]の コンピューターを 使[つか]います。", "Kompaniya kompyuteridan foydalanaman."),
    "じどうしゃ": ("トヨタの 自動車[じどうしゃ]は 有名[ゆうめい]です。", "Toyota avtomobillari mashhurdir."),
    "つくえ": ("机[つくえ]の 上[うえ]に 本[ほん]が あります。", "Stol ustida kitob bor."),
    "いす": ("いすに 座[すわ]って ください。", "Stulga o'tiring, iltimos."),
    "ここ": ("ここは 教室[きょうしつ] です。", "Bu yer darsxona."),
    "そこ": ("そこは 食堂[しょくどう] です。", "U yer oshxona."),
    "あそこ": ("あそこは 事務所[じむしょ] です。", "Anavi yer idora."),
    "どこ": ("すみません、お手洗[てあら]いは どこですか。", "Kechirasiz, hojatxona qayerda?"),
    "きょうしつ": ("教室[きょうしつ]で 勉強[べんきょう]します。", "Darsxonada o'qiyman."),
    "しょくどう": ("学生[がくせい]食堂[しょくどう]で 昼[ひる]ご飯[はん]を 食べます。", "Talabalar oshxonasida tushlik qilaman."),
    "じむしょ": ("事務所[じむしょ]で 書類[しょるい]を もらいました。", "Idoradan hujjatlarni oldim."),
    "かいぎしつ": ("3階[さんがい]の 会議室[かいぎしつ]で ミーティングを します。", "3-qavatdagi majlislar xonasida yig'ilish o'tkazamiz."),
    "うち": ("6時[ろくじ]に うちへ 帰[かえ]ります。", "Soat 6 da uyga qaytaman."),
    "かいしゃ": ("朝[あさ] 8時[はちじ]に 会社[かいしゃ]へ 行きます。", "Ertalab soat 8 da ishxonaga (firmaga) boraman."),
    "へや": ("わたしの 部屋[へや]は 2階[にかい]に あります。", "Mening xonam 2-qavatda joylashgan."),
    "エレベーター": ("エレベーターで 5階[ごかい]へ 上[あ]がります。", "Lift bilan 5-qavatga ko'tarilaman."),
    "かいだん": ("階段[かいだん]を 使[つか]いましょう。", "Keling, zinadan foydalanamiz."),
    "くに": ("お国[くに]は どちらですか。", "Qaysi davlatdansiz?"),
    "いくら": ("この ネクタイは いくらですか。", "Bu bo'yinbog' (galstuk) qancha turadi?"),
    "いま": ("今[いま] 何時[なんじ] ですか。", "Hozir soat necha?"),
    "おきます": ("毎朝[まいあさ] 6時[ろくじ]に 起[お]きます。", "Har kuni ertalab soat 6 da uyg'onaman."),
    "ねます": ("夜[よる] 11時[じゅういちじ]に 寝[ね]ます。", "Kechasi soat 11 da uxlayman."),
    "はたらきます": ("月曜日[げつようび]から 金曜日[きんようび]まで 働[はたら]きます。", "Dushanbadan jumagacha ishlayman."),
    "やすみます": ("日曜日[にちようび]に 休[やす]みます。", "Yakshanba kuni dam olaman."),
    "べんきょうします": ("図書館[としょかん]で 日本語[にほんご]を 勉強[べんきょう]します。", "Kutubxonada yapon tilini o'rganaman."),
    "おわります": ("授業[じゅぎょう]は 5時[ごじ]に 終[お]わります。", "Dars soat 5 da tugaydi."),
    "ぎんこう": ("銀行[ぎんこう]は 9時[くじ]から 3時[さんじ]までです。", "Bank soat 9 dan 3 gacha ishlaydi."),
    "ゆうびんきょく": ("郵便局[ゆうびんきょく]で 切手[きって]を 買[か]います。", "Pochtada pochta markasi sotib olaman."),
    "としょかん": ("大学[だいがく]の 図書館[としょかん]で 調[しら]べます。", "Universitet kutubxonasida qidiraman."),
    "びじゅつかん": ("上野[うえの]の 美術館[びじゅつかん]へ 行きました。", "Uenodagi san'at muzeyiga bordim."),
    "いきます": ("あした 京都[きょうと]へ 行[い]きます。", "Ertaga Kiotoga boraman."),
    "きます": ("友達[ともだち]が うちへ 来[き]ました。", "Do'stim uyimga keldi."),
    "かえります": ("午後[ごご] 7時[しちじ]に 国[くに]へ 帰[かえ]ります。", "Kechqurun soat 7 da yurtimga qaytaman."),
    "がっこう": ("自転車[じてんしゃ]で 学校[がっこう]へ 行きます。", "Velosipedda maktabga boraman."),
    "スーパー": ("駅[えき]の前[まえ]の スーパーで 買[か]い物[もの]を します。", "Bekat oldidagi supermarketda xarid qilaman."),
    "えき": ("新宿[しんじゅく]駅[えき]で 電車[でんしゃ]を降[お]ります。", "Shinjuku bekatida poyezddan tushaman."),
    "ひこうき": ("飛行機[ひこうき]で 10時間[じゅうじかん] かかります。", "Samolyotda 10 soat ketadi."),
    "ふね": ("横浜[よこはま]から 船[ふね]に 乗[の]ります。", "Yokogamadan kemaga o'tiraman."),
    "でんしゃ": ("地下鉄[ちかてつ]と 電車[でんしゃ]を 使[つか]います。", "Metro va elektr poyezddan foydalanaman."),
    "ちかてつ": ("東京[とうきょう]の 地下鉄[ちかてつ]は 便利[べんり]です。", "Tokio metrosi juda qulaydir."),
    "しんかんせん": ("新幹線[しんかんせん]で 大阪[おおさか]へ 行きました。", "Tezyurar Shinkansenda Osakaga bordim."),
    "バス": ("バス停[てい]で バスを 待[ま]ちます。", "Bekatda avtobus kutaman."),
    "タクシー": ("雨[あめ]ですから、タクシーで 行きましょう。", "Yomg'ir yog'yapti, taksida boraylik."),
    "じてんしゃ": ("弟[おとうと]の 自転車[じてんしゃ]を 借[か]りました。", "Ukamning velosipedini qarzga oldim."),
    "あるいて": ("駅から 家[いえ]まで 歩[ある]いて 行きます。", "Bekatdan uygacha piyoda boraman."),
    "ひと": ("親切[しんせつ]な 人[ひと]に 会[あ]いました。", "Mehribon inson bilan uchrashdim."),
    "ともだち": ("友達[ともだち]と いっしょに 映画[えいが]を 見[み]ました。", "Do'stim bilan birga kino ko'rdim."),
    "かれ": ("彼[かれ]は 英語[えいご]が 上手[じょうず]です。", "U (yigit) ingliz tilida ravon so'zlashadi."),
    "かのじょ": ("彼女[かのじょ]は さくら大学[だいがく]の 学生[がくせい]です。", "U (qiz) Sakura universiteti talabasi."),
    "かぞく": ("家族[かぞく]と 電話[でんわ]で 話[はな]しました。", "Oilam bilan telefonda gaplashdim."),
    "ひとりで": ("一人[ひとり]で 部屋[へや]を 掃除[そうじ]しました。", "Bir o'zim xonani tozaladim."),
    "たべます": ("朝[あさ] パンと 卵[たまご]を 食[た]べます。", "Ertalab non va tuxum yeyman."),
    "のみます": ("毎日[まいにち] 水[みず]を 2リットル 飲[の]みます。", "Har kuni 2 litr suv ichaman."),
    "すいます": ("たばこを 吸[す]いません。", "Tamaki (sigareta) chekmayman."),
    "みます": ("週末[しゅうまつ]に 映画[えいが]を 見[み]ます。", "Hafta oxirida kino ko'raman."),
    "ききます": ("音楽[おんがく]を 聞[き]きながら 散歩[さんぽ]します。", "Musiqa tinglab sayr qilaman."),
    "よみます": ("図書館[としょかん]で 日本[にほん]の 小説[しょうせつ]を 読[よ]みます。", "Kutubxonada yapon qissasini o'qiyman."),
    "かきます": ("先生[せんせい]に メールを 書[か]きました。", "Ustozga xat (email) yozdim."),
    "かいます": ("デパートで シャツを 買[か]いました。", "Univermagda ko'ylak sotib oldim."),
    "とります": ("きれいな 花[はな]の 写真[しゃしん]を 撮[と]りました。", "Chiroyli gulning suratini oldim."),
    "します": ("土曜日[どようび]に サッカーを します。", "Shanba kuni futbol o'ynayman."),
    "あいます": ("駅[えき]の前[まえ]で 友達[ともだち]に 会[あ]いました。", "Bekat oldida do'stim bilan uchrashdim."),
}

def clean_uzbek_meaning(raw_meaning):
    m = raw_meaning.strip()
    m = re.sub(r'^[\[\"\'\-\*]+\s*', '', m)
    m = re.sub(r'[\]\"\'\s]+$', '', m)
    
    # Custom meaning polish
    if "hurmat shakli" in m:
        return "u kishi (hurmat shakli)"
    if "erkalash" in m:
        return "erkalash qo'shimchasi"
    if "millatini bildiradigan" in m:
        return "millat qo'shimchasi"
    if "janob, xonim" in m:
        return "janob / xonim (hurmat qo'shimchasi)"
    if "minnatdorchilik" in m and "rahmat" in m:
        return "Katta rahmat"
    if "so'zlovchiga yaqin" in m:
        return "bu (yaqindagi buyum)"
    if "tinglovchiga yaqin" in m:
        return "u, o'sha (tinglovchiga yaqin)"
    if "ham so'zlovchiga" in m:
        return "ana u (uzoqdagi)"
    
    # Simplify long parenthetical annotations
    if len(m) > 40 and "(" in m:
        parts = m.split("(")
        if len(parts[0].strip()) >= 3:
            m = parts[0].strip()
            
    return m

FALLBACK_VOCAB_MEANINGS = {
    "おねがいします": "iltimos, so'rayman",
    "お願いします": "iltimos, so'rayman",
    "[ お願いします ]": "iltimos, so'rayman",
    "[ おねがいします ]": "iltimos, so'rayman",
    "神[こう] 戸[べ] 病[びょう] 院[いん]": "Kobe shifoxonasi",
    "神戸病院": "Kobe shifoxonasi",
    "ミルク": "sut",
    "（ミルク）": "sut",
    "たいへんですね": "qiyin bo'libdi",
    "大変ですね。": "qiyin bo'libdi"
}

def split_mixed_ja_uz(ja, uz):
    """Cleanly separate Japanese text from accidentally appended Uzbek sentences."""
    ja = ja.strip()
    uz = uz.strip()
    
    # 1. Japanese sentence punctuation followed by Latin/Cyrillic Uzbek text
    m = re.search(r'([。？！\?\!])\s*([A-Za-z\u0400-\u04FF].*)$', ja)
    if m:
        clean_ja = ja[:m.start() + 1].strip()
        extracted_uz = m.group(2).strip()
        final_uz = uz if (uz and len(uz) > 3 and not uz.startswith("（") and not uz.startswith("…") and not uz.startswith("あれ")) else extracted_uz
        return clean_ja, final_uz
        
    # 2. Japanese character followed by capitalized Uzbek words (avoiding single acronyms like IMC)
    m2 = re.search(r'([\u3040-\u30FF\u4E00-\u9FFF\]])\s+([A-Z\u0400-\u04FF][a-z\u0400-\u04FF`\'\,\.\!\?\s].*)$', ja)
    if m2:
        clean_ja = ja[:m2.start() + 1].strip()
        extracted_uz = m2.group(2).strip()
        final_uz = uz if (uz and len(uz) > 3 and not uz.startswith("（") and not uz.startswith("…") and not uz.startswith("あれ")) else extracted_uz
        return clean_ja, final_uz
        
    return ja, uz

def get_smart_sentence_for_vocab(v, lesson_num, clean_meaning=""):
    kana = v.get("kana", "").strip()
    kanji = v.get("kanji", "").strip()
    meaning = clean_meaning or clean_uzbek_meaning(v.get("meaning", "")) or "so'z"
    
    clean_k = re.sub(r'[（）\(\)\s～~]', '', kana)
    clean_kj = re.sub(r'[（）\(\)\s～~]', '', kanji)
    
    for key in [clean_k, clean_kj, kana, kanji]:
        if key in CUSTOM_VOCAB_EXAMPLES:
            return CUSTOM_VOCAB_EXAMPLES[key]
            
    term_display = f"{clean_kj}[{clean_k}]" if clean_kj and clean_kj != clean_k else clean_k
    
    if clean_k.endswith("人") or clean_kj.endswith("人") or clean_k.endswith("じん"):
        return (f"ミラーさんは {term_display} です。", f"Janob Miller {meaning.lower()}.")
    elif "ます" in clean_k or clean_k.endswith("る") or clean_k.endswith("う"):
        return (f"毎日[まいにち] {term_display}。", f"Har kuni {meaning.lower()}.")
    elif clean_k.endswith("い") and len(clean_k) <= 6:
        return (f"この 部屋[へや]は {term_display}です。", f"Bu xona {meaning.lower()}.")
    elif any(clean_kj.endswith(s) for s in ["員", "者", "士", "師", "生", "医", "手", "長"]):
        return (f"田中[たなか]さんは {term_display} です。", f"Tanaka janoblari {meaning.lower()}.")
    elif any(clean_kj.endswith(s) for s in ["院", "館", "校", "室", "場", "堂", "所", "屋", "店", "駅", "園", "国"]):
        return (f"あそこは {term_display} です。", f"Anavi yer {meaning.lower()}.")
    elif "～" in kana or "~" in kana:
        return (f"山田[やまだ]{clean_k}は 親切[しんせつ]な 人[ひと]です。", f"Yamada {meaning.lower()} samimiy inson.")
    else:
        return (f"これは わたしが 買[か]った {term_display} です。", f"Bu men sotib olgan {meaning.lower()}.")

def enrich_grammar(lesson_data, num):
    rules = []
    key_points = []
    
    for g in lesson_data.get("grammar", []):
        title = g.get("title", "").strip()
        formula = g.get("formula", "").strip() or title
        raw_expl = g.get("explanation", "").strip()
        
        # Skip empty grammar fragments with no explanation and no examples
        if not raw_expl and not g.get("examples", []):
            continue
            
        clean_expl = re.sub(r'\[Eslatma\]', '\n💡 Muhim eslatma: ', raw_expl)
        clean_expl = re.sub(r'\s+', ' ', clean_expl).strip()
        
        first_sentence = clean_expl.split(".")[0] if "." in clean_expl else clean_expl[:100]
        key_points.append(f"📌 {title}: {first_sentence}.")
        
        examples = []
        for ex in g.get("examples", []):
            ja = ex.get("ja", "").strip()
            uz = ex.get("uz", "").strip()
            if ja:
                clean_ja, clean_uz = split_mixed_ja_uz(ja, uz)
                examples.append({
                    "sentence": clean_ja or ja,
                    "translation": clean_uz or uz or "Namunaviy gap."
                })
        if not examples:
            examples.append({
                "sentence": formula,
                "translation": "Grammatik qolip."
            })
            
        rules.append({
            "pattern": formula,
            "meaning": clean_expl,
            "usageNotes": f"Minna no Nihongo {num}-dars muhim qoidasi. JLPT N5 grammatika savollarida muntazam uchraydi.",
            "examples": examples
        })
        
    return rules, key_points

def build_interactive_steps(les, num, vocab_items, grammar_rules):
    exercises = []
    test_questions = []
    
    examples = []
    for g in grammar_rules:
        examples.extend(g.get("examples", []))
        
    # ------------------ EXERCISES (5 items) ------------------
    # Ex 1: Particle Gap Fill
    p_choices = [
        ("わたし（　）マイク・ミラーです。", "は", ['は', 'が', 'を', 'に'], "Gap mavzusini ko'rsatish uchun 'は' (va deb o'qiladi) ishlatiladi."),
        ("これは 日本語（　）本です。", "の", ['の', 'は', 'も', 'と'], "Tegishlilik va biror tildagi kitob ekanligini bildirish uchun 'の' qo'yiladi."),
        ("あした 9時（　）学校へ 行きます。", "に", ['に', 'で', 'へ', 'を'], "Aniq vaqt ifodalanganda 'に' zarrachasi qo'yiladi."),
        ("食堂（　）昼ご飯を 食べます。", "で", ['で', 'に', 'を', 'へ'], "Harakat sodir bo'layotgan joy 'で' bilan belgilanadi."),
        ("友達（　）いっしょに 帰ります。", "と", ['と', 'に', 'で', 'へ'], "Birgalikdagi shaxs 'と' zarrachasi orqali ifodalanadi."),
    ]
    p_item = p_choices[(num - 1) % len(p_choices)]
    p_opts = list(p_item[2])
    rng_e1 = random.Random(f"ex1-seed-{num}")
    rng_e1.shuffle(p_opts)
    
    exercises.append({
        "id": f"ja-minna-l{num}-ex1",
        "type": "multiple-choice",
        "prompt": f"Bo'sh joyga to'g'ri zarrachani qo'ying:\n「{p_item[0]}」",
        "options": p_opts,
        "correctAnswer": p_opts.index(p_item[1]),
        "explanation": f"To'g'ri javob: 「{p_item[1]}」. {p_item[3]}"
    })
    
    # Ex 2: Vocab in Context (strictly distinct meanings)
    v_target = vocab_items[num % len(vocab_items)]
    seen_meanings = {v_target["meaning"]}
    unique_meanings = []
    for v in vocab_items:
        m = v.get("meaning", "").strip()
        if m and m not in seen_meanings:
            seen_meanings.add(m)
            unique_meanings.append(m)
            if len(unique_meanings) == 3:
                break
    fb_meanings = ["talaba", "shifokor", "kitob", "maktab", "do'st", "qalam", "soat", "avtomobil"]
    for fb in fb_meanings:
        if len(unique_meanings) < 3 and fb not in seen_meanings:
            seen_meanings.add(fb)
            unique_meanings.append(fb)
            
    e2_opts = [v_target["meaning"]] + unique_meanings[:3]
    rng_e2 = random.Random(f"ex2-seed-{num}")
    rng_e2.shuffle(e2_opts)
    
    exercises.append({
        "id": f"ja-minna-l{num}-ex2",
        "type": "multiple-choice",
        "prompt": f"「{v_target['term']}」 so'zining to'g'ri o'zbekcha ma'nosi qaysi?",
        "options": e2_opts,
        "correctAnswer": e2_opts.index(v_target["meaning"]),
        "explanation": f"To'g'ri javob: 「{v_target['meaning']}」."
    })
    
    # Ex 3: Grammar Pattern in Context (ensuring valid sentence & strictly distinct options)
    valid_examples = [
        e for e in examples 
        if e["sentence"].endswith("。") or "です" in e["sentence"] or "ます" in e["sentence"]
    ]
    if valid_examples:
        sample_ex = valid_examples[0]
    elif examples:
        sample_ex = examples[0]
    else:
        sample_ex = {"sentence": "わたしは 学生[がくせい] です。", "translation": "Men talabaman."}

    correct_sent = sample_ex["sentence"].strip()
    if not correct_sent.endswith("。") and not correct_sent.endswith("？"):
        correct_sent += "。"

    distractor_1 = correct_sent.replace(" は ", " を ") if " は " in correct_sent else (correct_sent.replace("です", "だです") if "です" in correct_sent else correct_sent.replace("ます", "ます です"))
    if distractor_1 == correct_sent:
        distractor_1 = correct_sent.replace("。", " でした です。")
    
    distractor_2 = correct_sent.replace(" です", " じゃあります") if " です" in correct_sent else (correct_sent.replace("ます", "ません でした です") if "ます" in correct_sent else "これ を " + correct_sent)
    if distractor_2 in (correct_sent, distractor_1):
        distractor_2 = "わたし を " + correct_sent
        
    distractor_3 = correct_sent.replace("へ ", "に ") if "へ " in correct_sent else (correct_sent.replace("で ", "へ ") if "で " in correct_sent else (correct_sent.replace("の ", " は ") if "の " in correct_sent else correct_sent.replace("。", " か でした。")))
    if distractor_3 in (correct_sent, distractor_1, distractor_2):
        distractor_3 = "そこ は を " + correct_sent

    seen_e3 = {correct_sent}
    distinct_e3 = [correct_sent]
    for d in [distractor_1, distractor_2, distractor_3]:
        if d not in seen_e3:
            seen_e3.add(d)
            distinct_e3.append(d)

    backup_e3 = [
        "これ は を です。",
        "あした へ 行きません です。",
        "わたし を 学生 に です。",
        "昨日 友達 を 行きます でした。"
    ]
    for bi in backup_e3:
        if len(distinct_e3) < 4 and bi not in seen_e3:
            seen_e3.add(bi)
            distinct_e3.append(bi)

    e3_opts = list(distinct_e3[:4])
    rng_e3 = random.Random(f"ex3-seed-{num}")
    rng_e3.shuffle(e3_opts)
    
    exercises.append({
        "id": f"ja-minna-l{num}-ex3",
        "type": "multiple-choice",
        "prompt": f"{num}-dars grammatik qoidasiga muvofiq to'g'ri tuzilgan gapni aniqlang:",
        "options": e3_opts,
        "correctAnswer": e3_opts.index(correct_sent),
        "explanation": f"To'g'ri gap: 「{correct_sent}」 ({sample_ex['translation']})."
    })
    
    # Ex 4: Translation (Targeting Japanese expression with unique distractors)
    ex_tr = examples[1] if len(examples) > 1 else (examples[0] if examples else {"sentence": "わたしは エンジニアです。", "translation": "Men muhandisman."})
    other_ex_sents = [e["sentence"] for e in examples if e["sentence"] != ex_tr["sentence"]]
    
    seen_e4 = {ex_tr["sentence"]}
    distinct_e4 = [ex_tr["sentence"]]
    for s in other_ex_sents:
        if s not in seen_e4 and len(s) > 3:
            seen_e4.add(s)
            distinct_e4.append(s)
            if len(distinct_e4) == 4:
                break
    fb_sents = [
        "ミラーさんは 会社員[かいしゃいん] です。",
        "あした どこへ 行きますか。",
        "すみません、トイレは どこですか。",
        "昨日 友達と 映画を 見ました。"
    ]
    for fs in fb_sents:
        if len(distinct_e4) < 4 and fs not in seen_e4:
            seen_e4.add(fs)
            distinct_e4.append(fs)
            
    e4_opts = list(distinct_e4[:4])
    rng_e4 = random.Random(f"ex4-seed-{num}")
    rng_e4.shuffle(e4_opts)
    
    exercises.append({
        "id": f"ja-minna-l{num}-ex4",
        "type": "multiple-choice",
        "prompt": f"Ushbu gapning to'g'ri yaponcha tarjimasini tanlang:\n「{ex_tr['translation']}」",
        "options": e4_opts,
        "correctAnswer": e4_opts.index(ex_tr["sentence"]),
        "explanation": f"Yaponcha to'g'ri ifodasi: 「{ex_tr['sentence']}」."
    })
    
    # Ex 5: Conversational Dialogue Response
    d_responses = [
        ("初めまして、どうぞ よろしく お願いします。", "こちらこそ、どうぞ よろしく お願いします。"),
        ("これは ほんの 気持ちです。どうぞ。", "どうも ありがとうございます。"),
        ("いらっしゃいませ！", "すみません、この時計を 見せてください。"),
        ("いっしょに コーヒーを 飲みませんか。", "ええ、飲みましょう。"),
        ("お疲れ様でした。", "お疲れ様でした。")
    ]
    d_pair = d_responses[(num - 1) % len(d_responses)]
    seen_e5 = {d_pair[1]}
    distinct_e5 = [d_pair[1]]
    fb_dialogues = ["失礼します。", "ごちそうさまでした。", "おやすみなさい。", "いってきます。", "どういたしまして。"]
    for fd in fb_dialogues:
        if fd not in seen_e5:
            seen_e5.add(fd)
            distinct_e5.append(fd)
            if len(distinct_e5) == 4:
                break
                
    e5_opts = list(distinct_e5[:4])
    rng_e5 = random.Random(f"ex5-seed-{num}")
    rng_e5.shuffle(e5_opts)
    
    exercises.append({
        "id": f"ja-minna-l{num}-ex5",
        "type": "multiple-choice",
        "prompt": f"Suhbatdoshingiz: 「{d_pair[0]}」 dedi. Unga eng mos muloyim javob qaysi?",
        "options": e5_opts,
        "correctAnswer": e5_opts.index(d_pair[1]),
        "explanation": f"To'g'ri javob: 「{d_pair[1]}」."
    })
    
    # ------------------ TEST QUESTIONS (5 items) ------------------
    # Q1: Kanji Reading (Mondai 1: strictly unique options)
    k_cand = [v for v in vocab_items if "(" in v["term"]]
    k_item = k_cand[num % len(k_cand)] if k_cand else vocab_items[0]
    k_word = k_item["term"].split(" ")[0]
    k_correct = k_item["reading"]
    seen_readings = {k_correct}
    distinct_k = [k_correct]
    for v in vocab_items:
        r = v.get("reading", "").strip()
        if r and r not in seen_readings:
            seen_readings.add(r)
            distinct_k.append(r)
            if len(distinct_k) == 4:
                break
    fb_readings = ["わたし", "あなた", "ひと", "せんせい", "がくせい", "ほん", "くるま", "やま"]
    for fb in fb_readings:
        if len(distinct_k) < 4 and fb not in seen_readings:
            seen_readings.add(fb)
            distinct_k.append(fb)
            
    q1_opts = list(distinct_k[:4])
    rng_q1 = random.Random(f"q1-seed-{num}")
    rng_q1.shuffle(q1_opts)
    
    test_questions.append({
        "id": f"ja-minna-l{num}-q1",
        "question": f"【Mondai 1: Moji/Goi】「{k_word}」の 読[よ]み方[かた]は どれですか。",
        "options": q1_opts,
        "correctAnswerIndex": q1_opts.index(k_correct),
        "explanation": f"「{k_word}」 ning to'g'ri o'qilishi: 「{k_correct}」 ({k_item['meaning']})."
    })
    
    # Q2: Particles (Mondai 2)
    p_test_bank = [
        ("田中さんは 学生（　）ありません。", "じゃ", ["じゃ", "で", "を", "に"], "Inkor shaklda 'じゃ ありません' qo'llaniladi."),
        ("ミラーさんは アメリカ（　）来ました。", "から", ["から", "まで", "へ", "で"], "Kelib chiqish mamlakati '〜から' orqali ko'rsatiladi."),
        ("毎朝 7時（　）起きます。", "に", ["に", "で", "へ", "を"], "Aniq soat bilan 'に' zarrachasi ishlatiladi."),
        ("パン（　）食べます。", "を", ["を", "に", "で", "へ"], "Harakat obyekti 'を' (o) bilan belgilanadi."),
        ("京都（　）行きます。", "へ", ["へ", "で", "を", "から"], "Boriladigan yo'nalish 'へ' (e deb o'qiladi) bilan belgilanadi.")
    ]
    pt = p_test_bank[(num - 1) % len(p_test_bank)]
    q2_opts = list(pt[2])
    rng_q2 = random.Random(f"q2-seed-{num}")
    rng_q2.shuffle(q2_opts)
    
    test_questions.append({
        "id": f"ja-minna-l{num}-q2",
        "question": f"【Mondai 2: Bunpo】（　）に 入[はい]る 最[もっと]も よいものを 1つ えらびなさい。\n「{pt[0]}」",
        "options": q2_opts,
        "correctAnswerIndex": q2_opts.index(pt[1]),
        "explanation": f"To'g'ri zarracha: 「{pt[1]}」. {pt[3]}"
    })
    
    # Q3: Grammar Pattern (Mondai 3: unique candidates)
    rule3 = grammar_rules[min(1, len(grammar_rules)-1)]
    q3_candidates = [
        rule3["pattern"],
        "〜は 〜でした じゃありません",
        "〜を 行きます です",
        "〜に 食べません でした"
    ]
    seen_q3 = set()
    distinct_q3 = []
    for c in q3_candidates:
        if c not in seen_q3:
            seen_q3.add(c)
            distinct_q3.append(c)
    fb_q3 = ["〜で 〜があります です", "〜から 〜まで でした です"]
    for b in fb_q3:
        if len(distinct_q3) < 4 and b not in seen_q3:
            seen_q3.add(b)
            distinct_q3.append(b)

    q3_opts = list(distinct_q3[:4])
    rng_q3 = random.Random(f"q3-seed-{num}")
    rng_q3.shuffle(q3_opts)
    
    test_questions.append({
        "id": f"ja-minna-l{num}-q3",
        "question": f"【Mondai 3: Bunpo】{num}-dars grammatik qoidasi bo'yicha to'g'ri formulani aniqlang:",
        "options": q3_opts,
        "correctAnswerIndex": q3_opts.index(rule3["pattern"]),
        "explanation": f"To'g'ri grammatik formula: 「{rule3['pattern']}」."
    })
    
    # Q4: Context / Reading Comprehension (Mondai 4: distinct lesson translations)
    ex_q4 = examples[min(2, len(examples)-1)] if len(examples) > 2 else examples[0]
    seen_trans = {ex_q4["translation"]}
    distinct_q4 = [ex_q4["translation"]]
    for e in examples:
        t = e.get("translation", "").strip()
        if t and t not in seen_trans and len(t) > 3:
            seen_trans.add(t)
            distinct_q4.append(t)
            if len(distinct_q4) == 4:
                break
    fb_translations = [
        "Ertaga do'stlarim bilan dars qilaman.",
        "Kechirasiz, poyezd soat nechada jo'naydi?",
        "Ushbu darslikni kutubxonadan oldim.",
        "Har kuni ertalab soat yettida uyg'onaman."
    ]
    for ft in fb_translations:
        if len(distinct_q4) < 4 and ft not in seen_trans:
            seen_trans.add(ft)
            distinct_q4.append(ft)
            
    q4_opts = list(distinct_q4[:4])
    rng_q4 = random.Random(f"q4-seed-{num}")
    rng_q4.shuffle(q4_opts)
    
    test_questions.append({
        "id": f"ja-minna-l{num}-q4",
        "question": f"【Mondai 4: Dokkai】Quyidagi yaponcha gapning to'g'ri o'zbekcha ma'nosini toping:\n「{ex_q4['sentence']}」",
        "options": q4_opts,
        "correctAnswerIndex": q4_opts.index(ex_q4["translation"]),
        "explanation": f"To'g'ri ma'nosi: 「{ex_q4['translation']}」."
    })
    
    # Q5: Kaiwa Response (Mondai 5)
    kaiwa_bank = [
        ("ミラーさんは アメリカ人ですか。", "はい、そうです。", ["いいえ、学生です。", "さようなら。", "いただきます。"]),
        ("これは あなたの 傘ですか。", "いいえ、違います。", ["はい、そうです。", "初めまして。", "失礼します。"]),
        ("トイレは どこですか。", "あそこです。", ["はい、そうです。", "ごちそうさまでした。", "おやすみなさい。"]),
        ("今 何時ですか。", "午後 3時です。", ["はい、違います。", "どういたしまして。", "いってきます。"]),
        ("いっしょに 京都へ 行きませんか。", "ええ、飲みましょう。", ["いいえ、行きます。", "すみません、トイレです。", "いただきます。"])
    ]
    kb = kaiwa_bank[(num - 1) % len(kaiwa_bank)]
    seen_q5 = set()
    distinct_q5 = []
    for o in [kb[1]] + kb[2]:
        if o not in seen_q5:
            seen_q5.add(o)
            distinct_q5.append(o)
    backup_q5 = ["はい、分かりました。", "いいえ、まだです。"]
    for b in backup_q5:
        if len(distinct_q5) < 4 and b not in seen_q5:
            seen_q5.add(b)
            distinct_q5.append(b)

    q5_opts = list(distinct_q5[:4])
    rng_q5 = random.Random(f"q5-seed-{num}")
    rng_q5.shuffle(q5_opts)
    
    test_questions.append({
        "id": f"ja-minna-l{num}-q5",
        "question": f"【Mondai 5: Kaiwa】Savolga eng to'g'ri javobni tanlang:\n「{kb[0]}」",
        "options": q5_opts,
        "correctAnswerIndex": q5_opts.index(kb[1]),
        "explanation": f"To'g'ri javob: 「{kb[1]}」."
    })
    
    return exercises, test_questions

# Main loop across all 25 lessons
enriched_lessons = []

for les in lessons:
    num = les["lessonNumber"]
    unit_num = (num - 1) // 5 + 1
    unit_id = f"ja-minna-u{unit_num}"
    unit_title = UNIT_TITLES[unit_num]
    lesson_id = f"ja-minna-l{num}"
    title = les["title"]
    
    # Process all valid vocab items (excluding section markers)
    raw_vocab = les.get("vocabulary", [])
    
    vocab_items = []
    for idx, v in enumerate(raw_vocab):
        kana = v.get("kana", "").strip()
        kanji = v.get("kanji", "").strip()
        meaning = v.get("meaning", "").strip()
        
        # Skip section markers like ◄ 会話 ►
        if "会話" in kana or "会話" in kanji:
            continue
            
        # If meaning is empty, check if kanji contains space and meaning
        if not meaning and " " in kanji:
            parts = kanji.split(" ", 1)
            if re.search(r'[a-zA-Z\u0400-\u04FF]', parts[1]):
                kanji = parts[0].strip()
                meaning = parts[1].strip()
                
        # Check fallback vocabulary meanings
        if not meaning:
            for k, val in FALLBACK_VOCAB_MEANINGS.items():
                if k in kana or k in kanji:
                    meaning = val
                    break
                    
        meaning = clean_uzbek_meaning(meaning)
        if not meaning:
            meaning = "so'z / ibora"
            
        # Clean term and reading
        clean_k = re.sub(r'[\[\]（）\(\)\s]', '', kana)
        clean_kj = re.sub(r'[\[\]（）\(\)\s]', '', kanji)
        
        if not clean_k and clean_kj:
            clean_k = clean_kj
        if not clean_kj and clean_k:
            clean_kj = clean_k
            
        term = f"{clean_kj} ({clean_k})" if clean_kj and clean_kj != clean_k else clean_k
        reading = clean_k if clean_k else clean_kj
        
        ex_sent, ex_tr = get_smart_sentence_for_vocab(v, num, meaning)
        vocab_items.append({
            "term": term,
            "reading": reading,
            "meaning": meaning,
            "exampleSentence": ex_sent,
            "exampleTranslation": ex_tr
        })
        
    grammar_rules, key_points = enrich_grammar(les, num)
    exercises, test_questions = build_interactive_steps(les, num, vocab_items, grammar_rules)
    
    lesson_obj = {
        "id": lesson_id,
        "courseId": "japanese-n5",
        "unitId": unit_id,
        "unitTitle": unit_title,
        "language": "ja",
        "level": "N5",
        "lessonNumber": num,
        "title": title,
        "description": f"Minna no Nihongo Shokyu 1: {title}. Darsda {len(raw_vocab)} ta yangi so'z, audio talaffuzli Furigana misollar va {len(grammar_rules)} ta asosiy grammatik formula o'rganiladi.",
        "estimatedDurationMinutes": 25,
        "icon": "🌸",
        "steps": [
            {
                "id": f"{lesson_id}-s1",
                "title": "Lug'at va Qoidalar",
                "type": "learn",
                "estimatedMinutes": 10,
                "learnData": {
                    "title": f"{num}-Dars: {title}",
                    "subtitle": les.get("title_ja", "みんなの日本語 初級1"),
                    "explanation": f"{title} bo'yicha to'liq grammatik izohlar, formulalar va Furiganali misollar to'plami.",
                    "keyPoints": key_points[:6],
                    "vocabulary": vocab_items,
                    "grammarRules": grammar_rules,
                    "culturalNotes": CULTURAL_NOTES.get(num, "Yapon madaniyati va kundalik muloqot odobiga oid eslatma.")
                }
            },
            {
                "id": f"{lesson_id}-s2",
                "title": "Mustahkamlash Mashqlari",
                "type": "practice",
                "estimatedMinutes": 8,
                "practiceData": {
                    "instructions": "Darsda o'rganilgan yangi so'zlar, zarrachalar va grammatik konstruksiyalar bo'yicha mashqlarni bajaring.",
                    "exercises": exercises
                }
            },
            {
                "id": f"{lesson_id}-s3",
                "title": "JLPT N5 Sinov Testi",
                "type": "test",
                "estimatedMinutes": 7,
                "testData": {
                    "instructions": "Darsni muvaffaqiyatli yakunlash uchun savollarga to'g'ri javob bering (Kamida 80%).",
                    "passingScorePercentage": 80,
                    "questions": test_questions
                }
            }
        ]
    }
    
    enriched_lessons.append(lesson_obj)

print("Writing enriched curriculum to", TARGET_FILE)
with open(TARGET_FILE, "w", encoding="utf-8") as f:
    f.write("import { Lesson } from '../../types/lesson';\n\n")
    f.write("export const MINNA_N5_LESSONS: Lesson[] = ")
    f.write(json.dumps(enriched_lessons, ensure_ascii=False, indent=2))
    f.write(";\n")

print("Successfully enriched all 25 Minna N5 Lessons!")
