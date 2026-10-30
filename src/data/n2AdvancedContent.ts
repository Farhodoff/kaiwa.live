import type { JlptReadingQuestion } from './jlptReadingData';

// ============================================================================
// 1. N2 AUTHENTIC READING (ビジネスメール、告知・案内、新聞コラム)
// ============================================================================

export interface N2AuthenticReadingPassage {
  id: string;
  title: string;
  genre: 'business-email' | 'official-announcement' | 'newspaper-column' | 'workplace-memo';
  sourceStyle: string;
  recommendedMinutes: number;
  themeUz: string;
  japaneseContent: string;
  uzbekTranslation: string;
  vocabularyHighlights: Array<{
    word: string;
    reading: string;
    meaningUz: string;
    nuanceNote: string;
  }>;
  questions: JlptReadingQuestion[];
}

export const N2_AUTHENTIC_READING_PASSAGES: N2AuthenticReadingPassage[] = [
  {
    id: 'n2_reading_email_1',
    title:
      'ビジネスメール：新[しん]プロジェクトキックオフミーティング日程[にってい]調整[ちょうせい]',
    genre: 'business-email',
    sourceStyle: 'IT企業 取引先間 業務連絡メール',
    recommendedMinutes: 5,
    themeUz: 'Loyihani ishga tushirish yig‘ilishi sanasini kelishish va kun tartibini yuborish.',
    vocabularyHighlights: [
      {
        word: '平素',
        reading: 'へいそ',
        meaningUz: 'Doimo, odatda (rasmiy korporativ kirish)',
        nuanceNote:
          '«平素よりお世話になっております» — rasmiy biznes yozishmalarining doimiy kirish iborasi.',
      },
      {
        word: 'ご査収',
        reading: 'ごさしゅう',
        meaningUz: 'Tekshirib qabul qilib olish',
        nuanceNote:
          'Hujjat yoki ilova fayllarni tekshirib ko‘rishni xushmuomalalik bilan so‘rashda ishlatiladi.',
      },
      {
        word: 'すり合わせる',
        reading: 'すりあわせる',
        meaningUz: 'Fikr va rejalarni o‘zaro muvofiqlashtirmoq',
        nuanceNote: 'Bir necha tomonning grafiklarini bir-biriga moslashtirish jarayoni.',
      },
      {
        word: '万障繰り合わせの上',
        reading: 'ばんしょうくりあわせのうえ',
        meaningUz: 'Barcha ishlarni rejalashtirib, vaqt ajratgan holda',
        nuanceNote:
          'Majlis yoki yig‘ilishga albatta qatnashishni xushmuomalalik bilan talab qilish.',
      },
    ],
    japaneseContent: `件名[けんめい]：【日程[にってい]調整[ちょうせい]】新[しん]システム開発[かいはつ]キックオフミーティングの件[けん]

株式会社[かぶしきがいしゃ]グローバルソリューションズ
開発[かいはつ]部[ぶ]　佐藤[さとう] 様

平素[へいそ]は 格別[かくべつ]の お引[ひ]き立[た]てを 賜[たまわ]り、厚[あつ]く 御礼[おんれい]申[もう]し上[あ]げます。
ネクストイノベーション株式会社[かぶしきがいしゃ]の 田中[たなか]でございます。

さて、先日[せんじつ] 内定[ないてい]いたしました 新[しん]基幹[きかん]システム開発[かいはつ]プロジェクトにつきまして、
両社[りょうしゃ]の 担当者[たんとうしゃ]による キックオフミーティングを 開催[かいさい]いたしたく 存[ぞん]じます。

つきましては、大変[たいへん] 恐縮[きょうしゅく]ではございますが、佐藤[さとう]様および チームの皆様[みなさま]の ご都合[つごう]を
お伺[うかが]いしたく、下記[かき]の 候補[こうほ]日時[にちじ]を 挙[あ]げさせていただきました。

【候補[こうほ]日時[にちじ]】
第[だい]１希望[きぼう]：11月[がつ]12日[にち]（火[か]）14:00〜15:30
第[だい]２希望[きぼう]：11月[がつ]14日[にち]（木[もく]）10:30〜12:00
第[だい]３希望[きぼう]：11月[がつ]15日[にち]（金[きん]）15:00〜16:30

【場所[ばしょ]】
弊社[へいしゃ] 第[だい]２会議[かいぎ]室[しつ]（オンラインZoom併用[へいよう]可[か]）

【議題[ぎだい]】
1. プロジェクト全体[ぜんたい]スケジュールおよび 体制[たいせい]の 確認[かくにん]
2. 要件[ようけん]定義[ていぎ]フェーズにおける 役割[やくわり]分担[ぶんたん]の すり合[あ]わせ
3. 今後[こんご]の 定例[ていれい]ミーティング頻度[ひんど]の 決定[けってい]

恐[おそ]れ入[い]りますが、11月[がつ]8日[にち]（金[きん]）17時[じ]までに、ご都合[つごう]の よろしい 日時[にちじ]を
ご返信[へんしん]いただけますと 幸甚[こうじん]に 存[ぞん]じます。

なお、当日[とうじつ]の 配布[はいふ]資料[しりょう]骨子[こっし]を 添付[てんぷ]いたしましたので、あらかじめ ご査収[さしゅう]ください。
万障[ばんしょう]繰[く]り合[あ]わせの 上[うえ]、ご参加[さんか]賜[たまわ]りますよう お願[ねが]い申[もう]し上[あ]げます。`,
    uzbekTranslation: `Mavzu: 【Jadvalni kelishish】 Yangi tizim ishlab chiqish bo‘yicha start yig‘ilishi haqida

Global Solutions AJ
Rivojlantirish bo‘limi, Janob Satoga

Doimiy hamkorligingiz va qo‘llab-quvvatlovingiz uchun samimiy minnatdorchilik bildiramiz.
Next Innovation AJ vakili Tanakaman.

Yaqinda tasdiqlangan yangi asosiy tizim loyihasi bo‘yicha ikkala kompaniya mas’ullari ishtirokida start yig‘ilishini o‘tkazmoqchimiz.
Shu munosabat bilan, siz va jamoangiz uchun qulay vaqtni aniqlash maqsadida quyidagi sana variantlarini taklif qilamiz:

【Taklif qilinadigan sanalar】
1-variant: 12-noyabr (seshanba) 14:00〜15:30
2-variant: 14-noyabr (payshanba) 10:30〜12:00
3-variant: 15-noyabr (juma) 15:00〜16:30

【Joy】
Kompaniyamiz 2-majlislar zali (Zoom orqali onlayn qo‘shilish ham mumkin)

【Kun tartibi】
1. Loyihaning umumiy jadvali va tarkibiy tuzilishini tasdiqlash
2. Talablarni aniqlashtirish bosqichidagi vazifalar taqsimotini muvofiqlashtirish
3. Doimiy haftalik uchrashuvlar tartibini belgilash

Iltimos, 8-noyabr (juma) soat 17:00 gacha siz uchun qulay bo‘lgan variant bo‘yicha javob xati yuborishingizni iltimos qilamiz.
Yig‘ilish materiallari rejasini xatga ilova qildik, ko‘rib chiqishingizni so‘raymiz. Ishtirok etishingizga umid qilamiz.`,
    questions: [
      {
        id: 'q_n2_email_1_1',
        questionText:
          '佐藤[さとう]様が この メールを 受[う]けて 最[もっと]も 先[さき]に 行[おこな]うべきことは どれか。',
        options: [
          '会議[かいぎ]室[しつ]の 予約[よやく]を Zoom上[じょう]で 完了[かんりょう]させること',
          '11月[がつ]8日[にち]までに 候補[こうほ]日時[にちじ]の中[なか]から 都合[つごう]の よい 日時[にちじ]を 返信[へんしん]すること',
          '新[しん]システムの 要件[ようけん]定義書[ていぎしょ]を 作成[さくせい]して 添付[てんぷ]返信[へんしん]すること',
          '定例[ていれい]ミーティングの スケジュールを すぐに 確定[かくてい]させること',
        ],
        correctIndex: 1,
        explanation:
          'Xatda "11月8日（金）17時までにご都合のよろしい日時をご返信いただけますと幸甚に存じます" deb aniq sana va harakat ko‘rsatilgan.',
      },
      {
        id: 'q_n2_email_1_2',
        questionText: 'この メールに 添付[てんぷ]されている ものは 何[なに]か。',
        options: [
          'Zoomの 接続[せつぞく]IDと パスワード',
          '契約[けいやく]の 最終[さいしゅう]合意[ごうい]書[しょ]',
          'キックオフミーティング当日[とうじつ]の 配布[はいふ]資料[しりょう]の 骨子[こっし]',
          '完成[かんせい]した 新[しん]システムの 取扱[とりあつかい]説明書[せつめいしょ]',
        ],
        correctIndex: 2,
        explanation:
          'Xatning oxirgi qismida "なお、当日の配布資料骨子を添付いたしましたので、あらかじめご査収ください" deb aniq yozilgan.',
      },
    ],
  },
  {
    id: 'n2_reading_announcement_1',
    title:
      '公式[こうしき]告知[こくち]：市立[しりつ]図書館[としょかん] システム更新[こうしん]に伴[ともな]う 休館[きゅうかん]および サービス一部[いちぶ]休止[きゅうし]の お知[し]らせ',
    genre: 'official-announcement',
    sourceStyle: '自治体・公的機関 Web掲示告知',
    recommendedMinutes: 5,
    themeUz: 'Kutubxona tizimi yangilanishi munosabati bilan yopilish va xizmatlar to‘xtatilishi.',
    vocabularyHighlights: [
      {
        word: '更新',
        reading: 'こうしん',
        meaningUz: 'Yangilash, modernizatsiya qilish',
        nuanceNote: 'Axborot tizimlari yoki shartnomalarni yangilash jarayoni.',
      },
      {
        word: '休止',
        reading: 'きゅうし',
        meaningUz: 'Vaqtincha to‘xtatib turish',
        nuanceNote: 'Xizmat yoki faoliyatning ma’lum muddatga faoliyatsiz bo‘lishi.',
      },
      {
        word: '返却ポスト',
        reading: 'へんきゃくぽすと',
        meaningUz: 'Kitoblarni qaytarish qutisi',
        nuanceNote: 'Kutubxona yopiq paytlarda kitoblarni tashlab ketish qutisi.',
      },
      {
        word: 'ご不便をおかけします',
        reading: 'ごふべんをおかけします',
        meaningUz: 'Sizga noqulaylik tug‘dirganimiz uchun uzr so‘raymiz',
        nuanceNote: 'Xizmatlar to‘xtatilganda aholiga bildiriladigan rasmiy uzr iborasi.',
      },
    ],
    japaneseContent: `市民[しみん]の 皆様[みなさま]へ

常[つね]日頃[ひごろ]より 中央[ちゅうおう]図書館[としょかん]を ご利用[りよう]いただき、誠[まこと]に ありがとうございます。
この度[たび]、蔵書[ぞうしょ]管理[かんり]システムの大規模[だいきぼ]な 更新[こうしん]および 設備[せつび]点検[てんけん]作業[さぎょう]を 実施[じっし]するため、
誠[まこと]に 勝手[かって]ながら 下記[かき]の 期間[きかん]中[ちゅう]、全館[ぜんかん]休館[きゅうかん]とさせていただきます。

【休館[きゅうかん]期間[きかん]】
2026年[ねん]12月[がつ]1日[にち]（火[か]）〜 12月[がつ]7日[にち]（月[げつ]）終日[しゅうじつ]

【休止[きゅうし]となる サービス】
1. 館内[かんない]での 閲覧[えつらん]・貸出[かしだし]・複写[ふくしゃ]サービス
2. インターネット経由[けいゆ]での 蔵書[ぞうしょ]検索[けんさく]（OPAC）および 予約[よやく]システム
3. 自習[じしゅう]室[しつ]および 研修[けんしゅう]室[しつ]の 利用[りよう]

【図書[としょ]の 返却[へんきゃく]について】
・休館[きゅうかん]期間[きかん]中[ちゅう]も、正面[しょうめん]玄関[げんかん]横[よこ]の「ブックポスト（返却[へんきゃく]ポスト）」への 投函[とうかん]による 返却[へんきゃく]は 可能[かのう]です。
・ただし、破損[はそん]の 恐[おそ]れがあるため、CD・DVDなどの 視聴覚[しちょうかく]資料[しりょう]および 他自治体[たじちたい]からの 相互[そうご]貸借[たいしゃく]本[ぼん]は ポストへの 投函[とうかん]を ご遠慮[えんりょ]ください。開館[かいかん]後[ご]に カウンターへ 直接[ちょくせつ] ご返却[へんきゃく]願[ねが]います。
・休館[きゅうかん]期間[きかん]中[ちゅう]に 返却[へんきゃく]期日[きじつ]を 迎[むか]える 貸出[かしだし]中[ちゅう]の 資料[しりょう]につきましては、一律[いちりつ] 12月[がつ]14日[にち]（月[げつ]）まで 期日[きじつ]を 自動[じどう]延長[えんちょう]いたします。

利用者の皆様には大変ご不便をおかけいたしますが、何卒ご理解とご協力を賜りますようお願い申し上げます。`,
    uzbekTranslation: `Fuqarolar diqqatiga!

Har doim Markaziy kutubxona xizmatlaridan foydalanib kelayotganingiz uchun samimiy tashakkur bildiramiz.
Kitoblar fondini boshqarish tizimini keng ko‘lamli yangilash va jihozlarni tekshirish ishlari o‘tkazilishi sababli, quyidagi muddatda butun bino bo‘ylab xizmatlar to‘xtatiladi.

【Yopiq bo‘lish muddati】
2026-yil 1-dekabr (seshanba)dan 7-dekabr (dushanba)gacha kun bo‘yi.

【To‘xtatiladigan xizmatlar】
1. Bino ichida kitob o‘qish, ijaraga olish va nusxa ko‘chirish (kserokopiya) xizmatlari;
2. Internet orqali qidiruv tizimi (OPAC) va onlayn band qilish tizimi;
3. Mustaqil o‘qish va mashg‘ulot xonalaridan foydalanish.

【Kitoblarni qaytarish haqida】
・Kutubxona yopiq paytida ham bosh kirish eshigi yonidagi "Kitob qaytarish qutisi" orqali kitoblarni tashlab ketish mumkin.
・Biroq, shikastlanish xavfi sababli, CD/DVD audio-video disklar hamda boshqa tuman kutubxonalaridan olib kelingan kitoblarni qutiga tashlash qat’iyan taqiqlanadi. Ochilgandan so‘ng qabulxona peshtaxtasiga topshirish lozim.
・Yopiq muddatga to‘g‘ri kelgan ijaradagi kitoblarning qaytarish muddati avtomatik ravishda 12-dekabrgacha uzaytiriladi.

Keltirilgan noqulayliklar uchun uzr so‘raymiz va tushunishingizga umid qilamiz.`,
    questions: [
      {
        id: 'q_n2_announce_1_1',
        questionText:
          '休館[きゅうかん]中[ちゅう]に「返却[へんきゃく]ポスト」に 入[い]れては ならない ものは どれか。',
        options: [
          '返却[へんきゃく]期限[きげん]が 12月[がつ]3日[にち]になっている 一般[いっぱん]の 小説[しょうせつ]',
          '中央[ちゅうおう]図書館[としょかん]で 借[か]りた 音楽[おんがく]CDや DVDなどの 視聴覚[しちょうかく]資料[しりょう]',
          '期限[きげん]が 12月[がつ]14日[にち]まで 延長[えんちょう]された 児童書[じどうしょ]',
          '開館[かいかん]時間[じかん]中[ちゅう]に 返[かえ]すことができなかった 図書[としょ]',
        ],
        correctIndex: 1,
        explanation:
          'E’londa "破損の恐れがあるため、CD・DVDなどの視聴覚資料および他自治体からの相互貸借本はポストへの投函をご遠慮ください" deb yozilgan.',
      },
      {
        id: 'q_n2_announce_1_2',
        questionText:
          '休館[きゅうかん]期間[きかん]中[ちゅう]の 返却[へんきゃく]期限[きじつ]について、正[ただ]しい 説明[せつめい]は どれか。',
        options: [
          '休館[きゅうかん]中[ちゅう]でも 延滞[えんたい]料金[りょうきん]が 発生[はっせい]するため、初日[しょにち]までに 必[かなら]ず ポストに 返却[へんきゃく]しなければならない',
          'インターネットで 予約[よやく]システムに ログインして、各自[かくじ]で 延長[えんちょう]手続[てつづ]きを 行[おこな]う 必要[ひつよう]がある',
          '返却[へんきゃく]期日[きじつ]が 休館[きゅうかん]期間[きかん]中[ちゅう]に 重[かさ]なる 資料[しりょう]は、自動的[じどうてき]に 12月[がつ]14日[にち]まで 延長[えんちょう]される',
          '開館[かいかん]翌日[よくじつ]の 12月[がつ]8日[にち]の 朝[あさ]一番[いちばん]に 返却[へんきゃく]しなければならない',
        ],
        correctIndex: 2,
        explanation:
          'Matnda "休館期間中に返却期日を迎える貸出中の資料につきましては、一律12月14日（月）まで期日を自動延長いたします" deb bildirilgan.',
      },
    ],
  },
  {
    id: 'n2_reading_column_1',
    title:
      '新聞[しんぶん]コラム：食品[しょくひん]ロス削減[さくげん]と 消費者[しょうひしゃ]の 意識[いしき]変革[へんかく]',
    genre: 'newspaper-column',
    sourceStyle: '全国紙 夕刊 生活・環境コラム風',
    recommendedMinutes: 6,
    themeUz: 'Oziq-ovqat isrofi va iste’molchilarning ongini o‘zgartirish haqidagi tahliliy sharh.',
    vocabularyHighlights: [
      {
        word: '賞味期限',
        reading: 'しょうみきげん',
        meaningUz: 'Ta’m va sifat kafolatlanadigan muddat',
        nuanceNote:
          '«消費期限» (iste’mol xavfsizligi muddati) dan farqli o‘laroq, o‘tganidan keyin ham darhol buzilib qolmaydi.',
      },
      {
        word: '拍車をかける',
        reading: 'はくしゃをかける',
        meaningUz: 'Jarayonni yanada tezlashtirmoq, kuchaytirmoq',
        nuanceNote: 'Otga qamchi urish ma’nosidan kelib chiqqan mashhur N2 iborasi.',
      },
      {
        word: '手前取り',
        reading: 'てまえどり',
        meaningUz: 'Yaroqlilik muddati yaqin turgan oldingi tovarlarni xarid qilish odati',
        nuanceNote: 'Isrofni kamaytirish uchun do‘konda eng oldingi qatordagi mahsulotni olish.',
      },
      {
        word: '過剰',
        reading: 'かじょう',
        meaningUz: 'Haddan tashqari ortiqcha',
        nuanceNote: 'Me’yordan ortiq darajada bo‘lish holati (过剩).',
      },
    ],
    japaneseContent: `まだ 食[た]べられるにもかかわらず 廃棄[はいき]される「食品[しょくひん]ロス」が、年間[ねんかん] 数百万[すうひゃくまん]トンにも 達[たっ]している。
スーパーや コンビニエンスストアでは、棚[たな]の 奥[おく]から 賞味[しょうみ]期限[きげん]の 長[なが]い 商品[しょうひん]を 選[えら]んで 買[か]う「奥取[おくと]り」が 長年[ながねん]の 習慣[しゅうかん]とされてきた。
この 消費者[しょうひしゃ]の 心理[しんり]が、手前[てまえ]に 残[のこ]された 商品[しょうひん]の 期限[きげん]切[ぎ]れ廃棄[はいき]に 拍車[はくしゃ]をかけていたことは 否[いな]めない。

しかし、近年[きんねん]では すぐに 食[た]べるものは 棚[たな]の 手前[てまえ]から 取[と]る「てまえどり」の 呼[よ]びかけが 広[ひろ]がりを 見[み]せている。
値引[ねび]きシールに 頼[たよ]るだけでなく、環境[かんきょう]負荷[ふか]への 配慮[はいりょ]から 自発的[じはつてき]に 行動[こうどう]を 改[あらた]める 若年[じゃくねん]層[そう]も 増[ふ]えつつあるという。

「新鮮[しんせん]で 完璧[かんぺき]な もの」を 追究[ついきゅう]するあまり、過剰[かじょう]な 廃棄[はいき]を 生[う]み出してきた 私[わたし]たちの ライフスタイル。
豊[ゆた]かさの 定義[ていぎ]とは、無限[むげん]の 選択肢[せんたくし]の 中[なか]から 新[あたら]しいものを 浪費[ろうひ]することではなく、
手元[てもと]にある 恵[めぐ]みを 最後[さいご]まで 大切[たいせつ]に 味[あじ]わい尽[つ]くす 姿勢[しせい]にこそ あるのではないだろうか。
一人[ひとり]ひとりの 些細[ささい]な 買[か]い方[かた]の 見直[みなお]しが、社会[しゃかい]全体[ぜんたい]の 巨大[きだい]な 浪費[ろうひ]を 止[と]める 第一歩[だいいっぽ]となる。`,
    uzbekTranslation: `Hali yeyish mumkin bo‘lsa-da, tashlab yuboriladigan oziq-ovqat isrofi yiliga millionlab tonnaga yetmoqda. Supermarketlarda javonning orqasidan muddati uzoqroq tovarlarni titib olish ko‘p yillik odatga aylangan edi. Iste’molchilarning aynan shu psixologiyasi oldingi qatorda qolib ketgan mahsulotlarning muddati o‘tib axlatga tashlanishini yanada tezlashtirayotganini inkor etib bo‘lmaydi.

Biroq, so‘nggi yillarda "darhol yeyiladigan mahsulotni old qatordan olish" (temaedori) chaqirig‘i keng tarqalmoqda. Faqat chegirma stikerlariga qarab emas, balki atrof-muhitga bo‘lgan g‘amxo‘rlik sabab o‘z xarid odatini o‘zgartirayotgan yoshlar soni ham ko‘paymoqda.

"Yangi va mukammal narsa" ketidan quvib, haddan tashqari isrofni keltirib chiqargan turmush tarzimiz. Aslida to‘kin-sochinlikning ta’rifi — cheksiz tanlovlar ichida yangisini isrof qilishda emas, balki qo‘limizdagi ne’matni oxirigacha qadrlashda emasmi? Har bir insonning arzimasdek ko‘ringan xarid odatini o‘zgartirishi butun jamiyatdagi bahaybat isrofning oldini olishdagi birinchi qadamdir.`,
    questions: [
      {
        id: 'q_n2_column_1_1',
        questionText:
          '筆者[ひっしゃ]によると、「奥取[おくと]り」は どのような 結果[けっか]を もたらしていたか。',
        options: [
          '店舗[てんぽ]の 売上[うりあげ]が 急激[きゅうげき]に 減少[げんしょう]し、価格[かかく]が 高騰[こうとう]した',
          '手前[てまえ]に 並[なら]んだ 商品[しょうひん]が 売[う]れ残[のこ]り、廃棄[はいき]される 割[わ]り合[あ]いが 高[たか]まった',
          '値引[ねび]きシールが 貼[は]られた 商品[しょうひん]しか 売[う]れなくなった',
          '消費者[しょうひしゃ]が 食品[しょくひん]の 安全性[あんぜんせい]を 信[しん]じられなくなった',
        ],
        correctIndex: 1,
        explanation:
          'Matnda "手前に残された商品の期限切れ廃棄に拍車をかけていたことは否めない" deb aniq ko‘rsatilgan.',
      },
      {
        id: 'q_n2_column_1_2',
        questionText:
          'この 文章[ぶんしょう]で 筆者[ひっしゃ]が 最[もっと]も 伝[つた]えたい「豊[ゆた]かさ」の 考[かんが]え方[かた]は どれか。',
        options: [
          '常[つね]に 最も 新[あたら]しいものを 自由[じゆう]に 消費[しょうひ]できる 経済的[けいざいてき]な 余裕[よゆう]を持つこと',
          '食品[しょくひん]の 廃棄[はいき]を 法律[ほうりつ]によって 厳[きび]しく 処罰[しょばつ]する 社会[しゃかい]を 実現[じつげん]すること',
          '手元[てもと]にある 恵[めぐ]みを 最後[さいご]まで 尊[とうと]び、無駄[むだ]にしない 生き方[かた]を 大切[たいせつ]にすること',
          'スーパーでの 買い物を 控[ひか]え、自給[じきゅう]自足[じそく]の 生活[せいかつ]へと 移行[いこう]すること',
        ],
        correctIndex: 2,
        explanation:
          'Oxirgi xulosada: "手元にある恵みを最後まで大切に味わい尽くす姿勢にこそあるのではないだろうか" deb boylikning asl ma’nosi tushuntirilgan.',
      },
    ],
  },
];

// ============================================================================
// 2. N2 KEIGO & BUSINESS JAPANESE (敬語・ビジネス実務)
// ============================================================================

export interface N2KeigoItem {
  verb: string;
  meaningUz: string;
  sonkeigo: string;
  kenjougo: string;
  teineigo: string;
  businessScenarioUz: string;
  exampleSentence: string;
}

export const N2_KEIGO_MATRIX: N2KeigoItem[] = [
  {
    verb: '行く / 来る',
    meaningUz: 'Bormoq / Kelmoq',
    sonkeigo: 'いらっしゃる / おいでになる',
    kenjougo: '参る[まいる] / 伺う[うかがう]',
    teineigo: '行きます / 来ます',
    businessScenarioUz: 'Mijoz idorasiga tashrif buyurish yoki mijozning tashrifi.',
    exampleSentence:
      '明日[あす]の 14時[じ]に 貴社[きしゃ]へ お伺[うかが]いいたします。社長[しゃちょう]は もう いらっしゃいますか。',
  },
  {
    verb: '言う',
    meaningUz: 'Aytmoq, demoq',
    sonkeigo: 'おっしゃる',
    kenjougo: '申す[もうす] / 申し上げる[もうしあげる]',
    teineigo: '言います',
    businessScenarioUz: 'Boshliq yoki hamkorning fikrini yetkazish yoki o‘zini tanishtirish.',
    exampleSentence:
      '部長[ぶちょう]が おっしゃった通[とお]り、私[わたくし]から 先方[せんぽう]へ 申[もう]し伝[つた]えておきます。',
  },
  {
    verb: '見る',
    meaningUz: "Ko'rmoq, ko'zdan kechirmoq",
    sonkeigo: 'ご覧[ごらん]になる',
    kenjougo: '拝見[はいけん]する',
    teineigo: '見ます',
    businessScenarioUz: 'Hujjat, taqdimot yoki xatni ko‘rib chiqish.',
    exampleSentence:
      'お送[おく]りいただいた 企画書[きかくしょ]を 拝見[はいけん]いたしました。すでにご覧になりましたでしょうか。',
  },
  {
    verb: '知る',
    meaningUz: 'Bilmoq, xabardor bo‘lmoq',
    sonkeigo: 'ご存[ぞん]じである',
    kenjougo: '存[ぞん]じる / 存[ぞん]じ上げる[ぞんじあげる]',
    teineigo: '知っています',
    businessScenarioUz: 'Loyihaning tafsilotlarini bilish yoki bilmaslik haqida so‘rash.',
    exampleSentence:
      'その件[けん]につきましては、私[わたくし]も よく 存[ぞん]じ上[あ]げております。佐藤[さとう]様は ご存[ぞん]じですか。',
  },
  {
    verb: '食べる / 飲む',
    meaningUz: 'Yemoq / Ichmoq',
    sonkeigo: '召[め]し上[あ]がる',
    kenjougo: 'いただく / 頂戴[ちょうだい]する',
    teineigo: '食べます / 飲みます',
    businessScenarioUz: 'Tushlik uchrashuvi yoki sovg‘a qilingan shirinliklarni qabul qilish.',
    exampleSentence:
      'どうぞ 温[あたた]かいうちに お召[め]し上[あ]がりください。それでは 遠慮[えんりょ]なく いただきます。',
  },
  {
    verb: '会う',
    meaningUz: 'Uchrashmoq',
    sonkeigo: 'お会[あ]いになる',
    kenjougo: 'お目[め]にかかる',
    teineigo: '会います',
    businessScenarioUz: 'Mijoz yoki rahbar bilan birinchi marotaba yuzma-yuz ko‘rishish.',
    exampleSentence:
      '本日[ほんじつ]は 初[はじ]めて お目[め]にかかれて、大変[たいへん] 光栄[こうえい]に 存[ぞん]じます。',
  },
];

// ============================================================================
// 3. N2 COLLOCATIONS & POLYSEMY (連語・多義語)
// ============================================================================

export interface N2CollocationItem {
  phrase: string;
  reading: string;
  meaningUz: string;
  contextUz: string;
  exampleSentence: string;
}

export const N2_COLLOCATIONS: N2CollocationItem[] = [
  {
    phrase: '目処が立つ',
    reading: 'めどがたつ',
    meaningUz: 'Ishning bitishiga yoki maqsadga erishishga ko‘z yetmoq, istiqbol ko‘rinmoq',
    contextUz: 'Loyiha yoki jarayonning muvaffaqiyatli yakunlanishiga ishonch paydo bo‘lishi.',
    exampleSentence:
      '資金[しきん]調達[ちょうたつ]の 目処[めど]が 立[た]ち、新規[しんき]事業[じぎょう]の 開始[かいし]に 踏[ふ]み切[き]った。',
  },
  {
    phrase: '拍車をかける',
    reading: 'はくしゃをかける',
    meaningUz: 'Jarayonni yanada tezlashtirmoq, jadallashtirmoq',
    contextUz: 'Biror o‘zgarish yoki salbiy/ijobiy holatning sur’atini oshirish.',
    exampleSentence:
      '政府[せいふ]の 補助金[ほじょきん]が、再生[さいせい]エネルギーの 普及[ふきゅう]に 拍車[はくしゃ]を かけた。',
  },
  {
    phrase: '筋が通る',
    reading: 'すじがとおる',
    meaningUz: 'Mantiqli bo‘lmoq, qonun-qoidaga muvofiq bo‘lmoq',
    contextUz: 'Taklif yoki dalilning mantiqan asosli ekani.',
    exampleSentence:
      '彼[かれ]の 主張[しゅちょう]は 筋[すじ]が 通[とお]っており、全員[ぜんいん]が 納得[なっとく]せざるを 得[え]なかった。',
  },
  {
    phrase: '手を打つ',
    reading: 'てをうつ',
    meaningUz: 'Chora ko‘rmoq, chora-tadbir qo‘llamoq',
    contextUz: 'Muammo kattalashishidan oldin tezkor choralar ko‘rish.',
    exampleSentence:
      '問題[もんだい]が 深刻[しんこく]化する 前[まえ]に、早急[さっきゅう]に 手[て]を 打[う]つ 必要[ひつよう]がある。',
  },
  {
    phrase: '機嫌をとる',
    reading: 'きげんをとる',
    meaningUz: 'Ko‘nglini olmoq, kayfiyatini ko‘tarmoq',
    contextUz: 'Xafa bo‘lgan kishining ko‘ngliga yo‘l topish.',
    exampleSentence:
      '上司[じょうし]の 不機嫌[ふきげん]を 察[さっ]して、部下[ぶか]たちが 必死[ひっし]に 機嫌[きげん]を とっていた。',
  },
  {
    phrase: '顔が利く',
    reading: 'かおがきく',
    meaningUz: 'Obro‘si o‘tmoq, tanish-bilish orqali ta’siri bo‘lmoq',
    contextUz: 'Ma’lum doira yoki sohada katta nufuzga ega bo‘lish.',
    exampleSentence:
      '彼[かれ]は 地元[じもと]の 商店街[しょうてんがい]に 顔[かお]が 利[き]くので、交渉[こうしょう]が スムーズに 進[すす]んだ。',
  },
];

// ============================================================================
// 4. N2 REAL-SPEED LISTENING & INFERENCE DIALOGUES
// ============================================================================

export interface N2ListeningScenario {
  id: string;
  title: string;
  situation: string;
  speakers: string;
  japaneseScript: string;
  uzbekTranslation: string;
  question: string;
  options: string[];
  correctIndex: number;
  inferenceExplanation: string;
}

export const N2_LISTENING_SCENARIOS: N2ListeningScenario[] = [
  {
    id: 'n2_listen_1',
    title: '会社[かいしゃ]での 打ち合わせ：企画書[きかくしょ]の 修正[しゅうせい]',
    situation: 'Xodim va bo‘lim boshlig‘i taqdimot loyihasi ustida fikr almashmoqda.',
    speakers: '部長（男性）と 部下（女性）',
    japaneseScript: `女性：部長、来週のプレゼン用の企画書、目を通していただけましたでしょうか。
男性：うん、ざっと見たよ。市場調査のデータはよく集まってるね。ただ、コスト削減の具体策のところが、ちょっと抽象的すぎるかな。
女性：やはりそうですか。他社の成功事例をもう少し盛り込んだ方がよろしいでしょうか。
男性：事例よりも、うちの工場で実際にどれくらい削減できるのか、試算のグラフが1枚入ると説得力が全然違ってくると思うんだよね。
女性：わかりました。生産管理部に問い合わせて、今期のシミュレーションデータを反映させて作り直します。
男性：うん、それじゃあ明日の夕方までに見せてもらえるかい？`,
    uzbekTranslation: `Ayol: Boshliq, kelasi haftadagi taqdimot loyihasini ko‘zdan kechirishga ulgurdingizmi?
Erkak: Ha, tezda ko‘rib chiqdim. Bozor tadqiqoti ma’lumotlari juda yaxshi to‘plangan. Lekin xarajatlarni qisqartirish bo‘yicha aniq rejalar qismi biroz mavhumdek tuyulyapti.
Ayol: Haqiqatan ham shundaymi? Boshqa kompaniyalarning muvaffaqiyatli misollarini qo‘shganim ma’qulmikin?
Erkak: Misollardan ko‘ra, o‘zimizning zavodda amalda qancha tejash mumkinligi haqida 1 varaq hisob-kitob grafigi qo‘shilsa, ancha ishonchliroq chiqardi deb o‘ylayman.
Ayol: Tushundim. Ishlab chiqarish bo‘limidan so‘rab, joriy davr simulyatsiya ma’lumotlarini aks ettirib qayta tuzataman.
Erkak: Yaxshi, unda ertaga kechgacha ko‘rsata olasanmi?`,
    question:
      '女性[じょせい]の 社員[しゃいん]は、このあと まず 何[なに]を しなければなりませんか。',
    options: [
      '他社[たしゃ]の 成功[せいこう]事例[じれい]を インターネットで 検索[けんさく]して レポートに まとめる',
      '市場[しじょう]調査[ちょうさ]の データを 最初[さいしょ]から 集[あつ]め直[なお]す',
      '生産[せいさん]管理[かんり]部[ぶ]に 連絡[れんらく]して コスト削減[さくげん]の 試算[しさん]データを 入手[にゅうしゅ]する',
      '明日の 夕方[ゆうがた]までに プレゼンの 練習[れんしゅう]を 完了[かんりょう]させる',
    ],
    correctIndex: 2,
    inferenceExplanation:
      'Boshliq zavod xarajatlarini tejash bo‘yicha aniq grafik kerakligini aytdi. Ayol xodim bunga javoban "生産管理部に問い合わせて、今期のシミュレーションデータを反映させて作り直します" (Ishlab chiqarish bo‘limidan so‘rab, hisob-kitob ma’lumotlarini olaman) deb keyingi birinchi harakatini bildirdi.',
  },
  {
    id: 'n2_listen_2',
    title: '店舗[てんぽ]での トラブル対応[たいおう]：商品[しょうひん]の 配送[はいそう]遅延[ちえん]',
    situation:
      'Mijoz va xizmat ko‘rsatuvchi xodim o‘rtasida buyurtma yetkazilishi haqidagi muloqot.',
    speakers: '顧客（女性）と 店員（男性）',
    japaneseScript: `女性：すみません、先週こちらで注文した空気清浄機、今日届くはずなんですが、まだ連絡もなくて。
男性：大変申し訳ございません。すぐにお調べいたしますので、お客様のお名前とお電話番号を伺えますでしょうか。
女性：佐藤です。090-XXXX-XXXXです。
男性：佐藤様ですね……申し訳ございません。実は昨日の大雪の影響で物流センターからの幹線道路が通行止めになっておりまして、本日中の配送が困難な状況となっております。
女性：えっ、今日引っ越しで、どうしても今日必要だったのに……困るわ。
男性：ご不便をおかけし、重ねてお詫び申し上げます。もしよろしければ、当店に1台のみ展示用以外の予備在庫がございますので、私どもで直接今夜ご自宅までお届けにあがる手配も可能ですが、いかがでしょうか。
女性：本当？ それなら助かるわ。ぜひお願いします。`,
    uzbekTranslation: `Ayol: Kechirasiz, o‘tgan hafta bu yerdan buyurtma qilgan havo tozalagich bugun kelishi kerak edi, lekin hali xabar ham kelmadi.
Erkak: Juda xijolatdamiz. Darhol tekshirib ko‘raman, ismingiz va telefon raqamingizni ayta olasizmi?
Ayol: Satoman. 090-XXXX-XXXX.
Erkak: Sato xonim... Kechirasiz. Kechagi kuchli qor sabab logistika markazidan keluvchi asosiy yo‘l yopilib qolgan ekan, shu bois bugun yetkazib berishning iloji bo‘lmay qolibdi.
Ayol: Nima? Bugun yangi uyga ko‘chgan edim, bugun albatta kerak edi... Juda qiyin bo‘ldi-ku.
Erkak: Noqulaylik uchun yana bir bor uzr so‘raymiz. Agar ma’qul ko‘rsangiz, do‘konimizda bitta zaxira apparat bor edi, o‘zimiz to‘g‘ridan-to‘g‘ri bugun oqshom uyingizga yetkazib berishimiz mumkin, nima deysiz?
Ayol: Rostdanmi? Unda juda yaxshi bo‘lardi. Albatta shunday qiling.`,
    question:
      '店員[てんいん]は、最終的[さいしゅうてき]に どのような 解決[かいけつ]策[さく]を 提案[ていあん]しましたか。',
    options: [
      '大雪[おおゆき]が やむまで 数日間[すうじつかん] 待[ま]ってもらうよう お願いした',
      '商品の 注文[ちゅうもん]を キャンセルして 全額[ぜんがく] 返金[へんきん]する 手続[てつづ]きを とった',
      '店舗[てんぽ]に ある 予備[よび]の 在庫[ざいこ]を、今夜[こんや] 直接[ちょくせつ] 自宅[じたく]へ 届[とど]けるよう 手配[てはい]する',
      '他[ほか]の 電気[でんき]店[てん]で 同じ 商品[しょうひん]を 探[さが]すよう 案内[あんない]した',
    ],
    correctIndex: 2,
    inferenceExplanation:
      'Do‘kon xodimi mijozning muammosini hal qilish uchun "当店に1台のみ予備在庫がございますので、私どもで直接今夜ご自宅までお届けにあがる" deb taklif kiritdi va mijoz buni mamnuniyat bilan qabul qildi.',
  },
];
