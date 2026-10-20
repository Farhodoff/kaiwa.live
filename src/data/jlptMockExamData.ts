export interface ExamQuestion {
  id: number;
  section: 'knowledge' | 'reading' | 'listening';
  questionText: string;
  passageText?: string;
  audioUrl?: string;
  script?: string;
  options: string[];
  correctAnswer: number;
  explanationUzbek: string;
}

export const JLPT_MOCK_EXAM_DATA: Record<'N5' | 'N4' | 'N3' | 'N2' | 'N1', ExamQuestion[]> = {
  // ==========================================
  // === N5 MOCK EXAM (25 questions) ==========
  // ==========================================
  N5: [
    {
      id: 101,
      section: 'knowledge',
      questionText: 'きょうは 水曜日（すいようび）です。あしたは（　）曜日です。',
      options: ['火', '木', '金', '土'],
      correctAnswer: 1,
      explanationUzbek:
        "Bugun Chorshanba (水曜日). Ertaga esa Payshanba (木曜日 - もくようび) bo'ladi. 火曜日 - Seshanba, 金曜日 - Juma, 土曜日 - Shanba.",
    },
    {
      id: 102,
      section: 'knowledge',
      questionText: '教室（きょうしつ）の なかに つくえ（　）いすが あります。',
      options: ['と', 'が', 'を', 'も'],
      correctAnswer: 0,
      explanationUzbek:
        "Narsalarni to'liq sanab o'tishda 'va' ma'nosida 'と' yuklamasi keladi: つくえ と いす (stol va stul).",
    },
    {
      id: 103,
      section: 'knowledge',
      questionText: '毎朝、新聞を（　）から、会社へ行きます。',
      options: ['読みます', '読んで', '読んだ', '読む'],
      correctAnswer: 1,
      explanationUzbek:
        "Ketma-ket harakatlarda '~te kara' (qilib bo'lgach) grammatikasi qo'llanadi: 読んでから (o'qib bo'lgach).",
    },
    {
      id: 104,
      section: 'knowledge',
      questionText: '駅まで バスで どの（　）かかりますか。',
      options: ['いくら', 'ぐらい', 'ごろ', 'なんにん'],
      correctAnswer: 1,
      explanationUzbek:
        "Vaqt yoki muddat miqdorini (taxminan qancha) so'rashda 'どのぐらい' (dono gurai) birikmasi ishlatiladi.",
    },
    {
      id: 105,
      section: 'knowledge',
      questionText: '田中さんは（毎朝）ジョギングを します。',
      options: ['まいあさ', 'まいばん', 'まいとし', 'まいにち'],
      correctAnswer: 0,
      explanationUzbek:
        "「毎朝」kanjisining to'g'ri o'qilishi — まいあさ (har tong). 毎晩 - har oqshom, 毎日 - har kun.",
    },
    {
      id: 106,
      section: 'knowledge',
      questionText: 'わたしは 毎朝 7時半（　）起きます。',
      options: ['に', 'で', 'を', 'へ'],
      correctAnswer: 0,
      explanationUzbek:
        "Aniq vaqt ko'rsatkichlaridan keyin (soat, daqiqa) 'に' yuklamasi qo'yiladi: 7時半に 起きます (7 yarimda uyg'onaman).",
    },
    {
      id: 107,
      section: 'knowledge',
      questionText: '日本人は はし（　）ご飯を 食べます。',
      options: ['に', 'で', 'を', 'へ'],
      correctAnswer: 1,
      explanationUzbek:
        "Biror vosita yoki qurol yordamida harakat bajarilganda 'で' yuklamasi ishlatiladi: はしで (cho'p bilan).",
    },
    {
      id: 108,
      section: 'knowledge',
      questionText: '部屋が 暗いですから、電気を（　）ください。',
      options: ['つけて', '消して', 'あけて', 'しめて'],
      correctAnswer: 0,
      explanationUzbek:
        "Xona qorong'i bo'lgani uchun chiroqni yoqish so'ralmoqda. Chiroqni yoqish — つける (つけます -> つけて). 消す - o'chirmoq.",
    },
    {
      id: 109,
      section: 'knowledge',
      questionText: '日曜日、デパートへ（友だち）と 行きました。',
      options: ['こども', 'ともだち', 'きょうだい', 'かぞく'],
      correctAnswer: 1,
      explanationUzbek:
        "「友だち」kanjisining to'g'ri o'qilishi — ともだち (do'st). 子ども - bola, 家族 - oila.",
    },
    {
      id: 110,
      section: 'knowledge',
      questionText: 'ここは 図書館ですから、大きな声で（　）で ください。',
      options: ['話さない', '話す', '話して', '話した'],
      correctAnswer: 0,
      explanationUzbek:
        "Biror ishni qilmaslikni so'rashda inkor '〜ないでください' qolipi ishlatiladi: 話さないでください (gapirmang).",
    },
    {
      id: 111,
      section: 'knowledge',
      questionText: 'この みかんは 甘くて、（　）です。',
      options: ['おいしい', 'おいしくて', 'おいしかった', 'おいしくない'],
      correctAnswer: 0,
      explanationUzbek:
        "Gap oxirida kesim sifatida i-sifatning lug'aviy shakli + です keladi: 甘くて、おいしいです (shirin va mazali).",
    },
    {
      id: 112,
      section: 'knowledge',
      questionText: 'テーブルの上に ペンが（　）あります。',
      options: ['3ぽん', '3まい', '3さつ', '3だい'],
      correctAnswer: 0,
      explanationUzbek:
        "Qalam, ruchka kabi uzun ingichka buyumlar '本 (ほん/ぼん/ぽん)' sanoq so'zi bilan sanaladi: 3本 (さんぼん).",
    },
    {
      id: 113,
      section: 'knowledge',
      questionText: '正しい文を作ってください：\n昨日 ＿＿ ＿＿ ★ ＿＿ 買いました。',
      options: ['デパートで', '新しい', '靴（くつ）を', '友達と'],
      correctAnswer: 2,
      explanationUzbek:
        "To'g'ri tartib: 昨日 [友達と] [デパートで] [★ 靴を] [新しい] 買いました (yoki 新しい 靴を). Yulduzcha o'rnida 靴を (3-variant) turadi.",
    },
    {
      id: 114,
      section: 'reading',
      passageText:
        'リーさんは 毎朝（まいあさ）７時に おきます。朝ご飯を 食べてから、８時に 自転車で 学校へ 行きます。学校は ８時半に 始まります。',
      questionText: 'リーさんは 何で 学校へ 行きますか？',
      options: ['歩いて', 'バスで', '自転車で', '電車で'],
      correctAnswer: 2,
      explanationUzbek:
        "Matnda aniq keltirilgan: 'jitensha de gakkou e ikimasu' (velosipedda maktabga boradi).",
    },
    {
      id: 115,
      section: 'reading',
      passageText:
        'きのう 田中さんと レストランへ 行きました。わたしは さかなを 食べました。田中さんは にくを 食べました。とても おいしかったです。二人で 3000円でした。',
      questionText: '二人の 食事は いくらでしたか？',
      options: ['1500円', '2000円', '3000円', '6000円'],
      correctAnswer: 2,
      explanationUzbek:
        "Matnda 'Futari de 3000-en deshita' (ikkalamizga jami 3000 yen bo'ldi) deyilgan.",
    },
    {
      id: 116,
      section: 'reading',
      passageText:
        '【母からのメモ】\nタケシへ。\n冷蔵庫の中にカレーがあります。電子レンジで2分温めて食べてください。食べたあとで、お皿を洗っておいてね。お母さんは8時に帰ります。',
      questionText: 'タケシさんは カレーを 食べた後で、何を しなければなりませんか？',
      options: ['カレーを作る', 'お皿を洗う', '母を駅へ迎えに行く', '冷蔵庫を掃除する'],
      correctAnswer: 1,
      explanationUzbek:
        "Onaning xatida: '食べたあとで、お皿を洗っておいてね' (ovqatlangandan so'ng likopchalarni yuvib qo'y) deb topshiriq berilgan.",
    },
    {
      id: 117,
      section: 'reading',
      passageText:
        '山田さんの日記：\n土曜日は朝から雨が降っていましたから、一日中うちで映画を見ました。日曜日はとてもいい天気でした。山田さんは朝9時から公園を散歩して、午後から友達とお茶を飲みました。楽しかったです。',
      questionText: '山田さんは 日曜日の午前に 何を しましたか？',
      options: ['映画を見た', '友達とお茶を飲んだ', '公園を散歩した', '一日中うちにいた'],
      correctAnswer: 2,
      explanationUzbek:
        "Matnda: '日曜日はとてもいい天気でした。山田さんは朝9時から公園を散歩して...' (yakshanba ertalab 9 dan parkda sayr qildi) deb yozilgan.",
    },
    {
      id: 118,
      section: 'reading',
      passageText:
        'はじめまして、マリアです。ブラジルから来ました。日本に来て3か月になります。最初は日本語が全然わかりませんでしたが、クラスの友達や先生が親切に教えてくれました。今はひらがなとカタカナが読めます。来週から漢字の勉強が始まります。少し難しいですが、一生懸命がんばります。',
      questionText: 'マリアさんは 今、何が できますか？',
      options: [
        '漢字がたくさん読める',
        'ひらがなとカタカナが読める',
        '日本語でスピーチができる',
        '英語を教えている',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Matnda: '今はひらがなとカタカナが読めます' (Hozir hiragana va katakanani o'qiy olaman) deb yozilgan. Kanji o'rganish kelasi hafta boshlanadi.",
    },
    {
      id: 119,
      section: 'reading',
      passageText:
        '【さくらクリニック 診療案内】\n・月曜日〜金曜日：午前 9:00〜12:30 / 午後 14:30〜18:00\n・土曜日：午前 9:00〜13:00（午後は休診）\n・休診日：日曜日・祝日\n※予約がない方は、受付終了の30分前までにお越しください。',
      questionText: '土曜日の 午後3時に このクリニックで 診察を 受けることが できますか？',
      options: [
        '受けることができる',
        '予約があれば受けられる',
        '午後は休診なので受けることができない',
        '祝日なら受けられる',
      ],
      correctAnswer: 2,
      explanationUzbek:
        "E'londa yozilgan: '土曜日：午前 9:00〜13:00（午後は休診）' — Shanba kuni tushdan keyin klinika ishlamaydi (休診 - qabul yo'q).",
    },
    {
      id: 120,
      section: 'listening',
      audioUrl: '/audio/choukai/n5/minna_shokyu_1_001.mp3',
      script:
        '女の人が話しています。テーブルの上に何を置きますか？\n女：食事の準備をしましょう。お皿を並べて、その右側にスプーンを置いてください。',
      questionText: 'お皿の右側に何を置きますか？',
      options: ['フォーク', 'ナイフ', 'スプーン', 'はし'],
      correctAnswer: 2,
      explanationUzbek:
        "Ayol kishi: 'migi gawa ni supuun o oite kudasai' (o'ng tomonga qoshiqni qo'ying) deb aytadi.",
    },
    {
      id: 121,
      section: 'listening',
      audioUrl: '/audio/choukai/n5/minna_shokyu_1_002.mp3',
      script:
        '男の人と女の人が話しています。男の人はあした何時に起きますか？\n女：あしたは何時に出かけるの？\n男：8時の電車に乗るから、7時に起きるよ。',
      questionText: '男の人はあした何時に起きますか？',
      options: ['6時', '7時', '8時', '9時'],
      correctAnswer: 1,
      explanationUzbek: "Erkak kishi: '7-ji ni okiru yo' (soat 7 da uyg'onaman) deb javob beradi.",
    },
    {
      id: 122,
      section: 'listening',
      audioUrl: '/audio/choukai/n5/minna_shokyu_1_003.mp3',
      script:
        '男の人と女の人が話しています。二人はどこで会いますか？\n男：明日の待ち合わせ、駅の改札口にする？\n女：うーん、改札口は人が多くて見つけにくいよ。北口の本屋さんの前にしない？\n男：そうだね、じゃあそこにしよう。',
      questionText: '二人は 明日 どこで 会いますか？',
      options: ['駅の改札口', '北口の本屋の前', '南口のカフェ', '映画館の入り口'],
      correctAnswer: 1,
      explanationUzbek:
        "Suhbatda ayol '北口の本屋さんの前にしない？' (Shimoliy chiqishdagi kitob do'koni oldi bo'lsinmi?) deb taklif qiladi va erkak rozi bo'ladi.",
    },
    {
      id: 123,
      section: 'listening',
      audioUrl: '/audio/choukai/n5/minna_shokyu_1_004.mp3',
      script:
        '先生が学生に話しています。学生は明日何を持ってこなければなりませんか？\n先生：みなさん、明日は作文のテストをします。えんぴつと消しゴムを必ず持ってきてください。辞書や教科書は使えませんから、机の上に出さないでください。',
      questionText: '学生は 明日 机の上に 何を 出しますか？',
      options: ['辞書と教科書', 'えんぴつと消しゴム', 'ノートと教科書', '携帯電話'],
      correctAnswer: 1,
      explanationUzbek:
        "O'qituvchi: 'えんぴつと消しゴムを必ず持ってきてください' (Qalam va o'chirg'ichni albatta olib keling) deb ta'kidlaydi.",
    },
    {
      id: 124,
      section: 'listening',
      audioUrl: '/audio/choukai/n5/minna_shokyu_1_005.mp3',
      script:
        '女の人と男の人が話しています。男の人は何を着て出かけますか？\n女：外は風が強くて寒いよ。上着を着ていったほうがいいよ。\n男：うん、じゃあ厚いコートを着ていくよ。帽子もかぶろう。',
      questionText: '男の人は 何を着て 出かけますか？',
      options: ['薄いシャツ', '厚いコート', 'レインコート', 'セーターだけ'],
      correctAnswer: 1,
      explanationUzbek:
        "Erkak kishi: 'じゃあ厚いコートを着ていくよ' (U holda qalin palto kiyib boraman) deb javob beradi.",
    },
    {
      id: 125,
      section: 'listening',
      audioUrl: '/audio/choukai/n5/minna_shokyu_1_006.mp3',
      script:
        'レストランで男の人と店員が話しています。男の人は飲み物に何を頼みましたか？\n店員：ご注文はお決まりですか？\n男：カレーライスを一つお願いします。それから、冷たいお茶をください。\n店員：かしこまりました。冷たいお茶ですね。',
      questionText: '男の人は 飲み物に 何を 頼みましたか？',
      options: ['温かいコーヒー', '冷たいお茶', 'ジュース', 'コーラ'],
      correctAnswer: 1,
      explanationUzbek: "Mijoz: '冷たいお茶をください' (Muzdek choy bering) deb buyurtma qiladi.",
    },
  ],

  // ==========================================
  // === N4 MOCK EXAM (25 questions) ==========
  // ==========================================
  N4: [
    {
      id: 201,
      section: 'knowledge',
      questionText: '雨が 降って（　）、試合は 中止になりました。',
      options: ['きたので', 'くるのに', 'きたら', 'きても'],
      correctAnswer: 0,
      explanationUzbek:
        "Sabab-oqibatni bildirishda 'node' qo'llaniladi: Ame ga futte kita node (yomg'ir yog'ib boshlaganligi sababli).",
    },
    {
      id: 202,
      section: 'knowledge',
      questionText: '先生に 本を（　）。ありがとうございました。',
      options: ['あげました', 'くれました', 'いただきました', 'やりました'],
      correctAnswer: 2,
      explanationUzbek:
        "Ustoz yoki hurmatli shaxsdan biror narsa qabul qilganda kamtarlik fe'li 'itadakimasu' ishlatiladi.",
    },
    {
      id: 203,
      section: 'knowledge',
      questionText: 'この漢字は どういう（　）ですか。',
      options: ['いみ', 'わけ', 'こと', 'りゆう'],
      correctAnswer: 0,
      explanationUzbek:
        "So'z yoki belgining ma'nosi so'ralganda 'imi' (意味 - ma'no) so'zi to'g'ri keladi.",
    },
    {
      id: 204,
      section: 'knowledge',
      questionText: '毎日 走る（　）に しています。健康のためです。',
      options: ['こと', 'よう', 'はず', 'わけ'],
      correctAnswer: 1,
      explanationUzbek:
        "O'ziga odat qilib olish ma'nosida 'fe'l oddiy shakli + you ni suru' ifodasi ishlatiladi.",
    },
    {
      id: 205,
      section: 'knowledge',
      questionText: '来年の（計画）を 立てています。',
      options: ['けいかく', 'けいがく', 'けいかっ', 'かいかく'],
      correctAnswer: 0,
      explanationUzbek: "「計画」kanjisining to'g'ri o'qilishi — けいかく (reja).",
    },
    {
      id: 206,
      section: 'knowledge',
      questionText: '漢字が 難しくて、日本の新聞が まだ（　）。',
      options: ['読めません', '読みません', '読まれません', '読ませません'],
      correctAnswer: 0,
      explanationUzbek:
        "Qobiliyat yetmasligida imkoniyat/potentsial fe'lining inkori ishlatiladi: 読めません (o'qiy olmayman).",
    },
    {
      id: 207,
      section: 'knowledge',
      questionText: '風で ドアが（　）しまいました。',
      options: ['閉めて', '閉まって', '開けて', '止めて'],
      correctAnswer: 1,
      explanationUzbek:
        "Eshik shamolda o'z-o'zidan yopilgani uchun o'timsiz fe'l (jidoushi) '閉まる' (しまって) ishlatiladi.",
    },
    {
      id: 208,
      section: 'knowledge',
      questionText: '熱が ありますから、今日は 早く 寝た（　）が いいですよ。',
      options: ['ほう', 'こと', 'もの', 'よう'],
      correctAnswer: 0,
      explanationUzbek:
        "Tavsiya va maslahat berishda 'fe'l ta-shakli + ほうがいい' qo'llaniladi: 寝たほうがいい (uxlaganingiz ma'qul).",
    },
    {
      id: 209,
      section: 'knowledge',
      questionText: '弟に 大切な ケーキを（　）しまいました。',
      options: ['食べて', '食べられて', '食べさせて', '食べられても'],
      correctAnswer: 1,
      explanationUzbek:
        "Birovning harakatidan noxush zarar ko'rilganda majhullik (ukemi) ishlatiladi: 食べられてしまいました.",
    },
    {
      id: 210,
      section: 'knowledge',
      questionText: '空が 暗くなってきました。今にも 雨が（　）そうです。',
      options: ['降る', '降り', '降った', '降って'],
      correctAnswer: 1,
      explanationUzbek:
        "Ko'rinishdan sodir bo'lish arafasidagi holat uchun 'fe'l o'zagi + そうだ' ishlatiladi: 降りそうです.",
    },
    {
      id: 211,
      section: 'knowledge',
      questionText: '駅前の 図書館へ 本を（　）に 行きます。',
      options: ['返し', '返す', '返して', '返した'],
      correctAnswer: 0,
      explanationUzbek:
        "Maqsad bilan borishda 'fe'l o'zagi + に行く' qo'llanadi: 返しに行きます (topshirgani boraman).",
    },
    {
      id: 212,
      section: 'knowledge',
      questionText: '田中さんは 用事があるから、今日のパーティーには（　）と 言っていました。',
      options: ['来られない', '来ないで', '来させる', '来られる'],
      correctAnswer: 0,
      explanationUzbek:
        "Kela olmaslik haqidagi iqtibos: potentsial inkor '来られない' (korarenai to itte imashita).",
    },
    {
      id: 213,
      section: 'knowledge',
      questionText: '正しい文を作ってください：\n日本へ ＿＿ ＿＿ ★ ＿＿ 勉強しています。',
      options: ['留学するために', '大学で', '経済を', '一生懸命'],
      correctAnswer: 2,
      explanationUzbek:
        "To'g'ri tartib: 日本へ [留学するために] [大学で] [★ 経済を] [一生懸命] 勉強しています -> 経済を (3-variant).",
    },
    {
      id: 214,
      section: 'reading',
      passageText:
        '先週 新しい アパートに 引っ越しました。前の 部屋より 広くて 明るいですが、駅から 少し 遠くなりました。でも、近くに 静かな 公園が あるので 気に入っています。',
      questionText: '新しい アパートの どんなところが 気に入っていますか？',
      options: [
        '駅から とても 近いところ',
        '近くに 静かな 公園が あるところ',
        '家賃が 前より 安いところ',
        '近くに 大きな スーパーが あるところ',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Matnda aniq keltirilgan: 'chikaku ni shizukana kouen ga aru node ki ni itte imasu' (yaqinida tinch bog' borligi yoqmoqda).",
    },
    {
      id: 215,
      section: 'reading',
      passageText:
        '【図書館の お知らせ】\n本は 一人 5冊まで 2週間 借りられます。ただし、DVDや 雑誌の 最新号は 借りることが できません。図書館の 中で 見てください。返却期限は 必ず 守ってください。',
      questionText: '借りることが できないものは 何ですか？',
      options: ['古い小説', '歴史の本', 'DVDや最新号の雑誌', '辞書'],
      correctAnswer: 2,
      explanationUzbek:
        "E'londa yozilgan: 'DVD ya zasshi no saishingou wa kariru koto ga dekimasen' (DVD va yangi son jurnallarni qarzga olib ketib bo'lmaydi).",
    },
    {
      id: 216,
      section: 'reading',
      passageText:
        '【ごみ収集（しゅうしゅう）の ルール】\n・燃えるごみ：火曜日・金曜日の 朝8時まで。\n・燃えないごみ：第2・第4水曜日の 朝8時まで。\n・資源ごみ（ペットボトル・びん・缶）：木曜日の 朝8時まで。\n※前日の夜には 絶対に 出さないでください。カラスや猫が ごみを荒らす原因になります。',
      questionText: 'ペットボトルや空き缶は、いつ 出さなければなりませんか？',
      options: ['火曜日の夜', '水曜日の朝8時まで', '木曜日の朝8時まで', '金曜日の午後'],
      correctAnswer: 2,
      explanationUzbek:
        "Qoidalarda resurs chiqindilari (資源ごみ: pet butilkalar, bankalar) '木曜日の 朝8時まで' (Payshanba ertalab soat 8 gacha) deb belgilangan.",
    },
    {
      id: 217,
      section: 'reading',
      passageText:
        '先週の日曜日、留学生センターの料理教室に参加しました。先生から「肉じゃが」の作り方を習いました。じゃがいもや牛肉をしょうゆと砂糖で煮る日本の家庭料理です。思ったより簡単で、とても美味しかったです。来週、自分の国から来た友達をアパートに招待して作ってあげるつもりです。',
      questionText: 'この文章の内容と合っているものはどれですか？',
      options: [
        '肉じゃがを作るのはとても難しかった',
        '友達のためにすでにアパートで作った',
        '来週友達を招待して肉じゃがを作るつもりだ',
        '先生に料理を振る舞った',
      ],
      correctAnswer: 2,
      explanationUzbek:
        "Matn oxirida yozilgan: '来週、自分の国から来た友達をアパートに招待して作ってあげるつもりです' (Kelasi hafta do'stlarimni chaqirib pishirib bermoqchiman).",
    },
    {
      id: 218,
      section: 'reading',
      passageText:
        '【業務連絡メール】\n宛先：田中課長\n発信：営業部 佐藤\nお疲れ様です。本日15時に予定していたABC商事との打ち合わせですが、先方の担当者が急な出張となったため、来週月曜日の午前10時に変更となりました。会議室の予約も変更済みです。よろしくお願いいたします。',
      questionText: '打ち合わせの日時が変更になった理由は何ですか？',
      options: [
        '会議室が予約できなかったから',
        '佐藤さんが病気になったから',
        '田中課長が不在だったから',
        '先方の担当者が急に出張になったから',
      ],
      correctAnswer: 3,
      explanationUzbek:
        "Email matnida aniq ko'rsatilgan: '先方の担当者が急な出張となったため' (hamkor tomon mas'ul xodimi to'satdan xizmat safariga ketgani sababli).",
    },
    {
      id: 219,
      section: 'reading',
      passageText:
        '【休日メトロ1日乗り放題きっぷ】\n・土曜日、日曜日、国民の祝日に限り利用可能。\n・大人：600円 / 子ども：300円\n・地下鉄全線が1日中何度でも乗り降り自由。\n※JR線や民間鉄道、都営バスにはご利用いただけません。自動券売機でお買い求めください。',
      questionText: 'この切符について 正しい 説明は どれですか？',
      options: [
        '平日の通勤時にも使える',
        'バスにも自由に乗ることができる',
        '土日や祝日に地下鉄全線で何度でも使える',
        'JR線にも自由に乗ることができる',
      ],
      correctAnswer: 2,
      explanationUzbek:
        'Qoidalarda aytilganidek: dam olish va bayram kunlarida metroning barcha liniyalarida cheksiz foydalanish mumkin. Boshqa transportlarda esa amal qilmaydi.',
    },
    {
      id: 220,
      section: 'listening',
      audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_001.mp3',
      script:
        '女の学生と男の学生が話しています。男の学生はどうしてパーティーに来られませんか？\n女：明日の夜、みんなでタワポンさんの送別会をするんだけど、来られる？\n男：あー、明日はアルバイトのシフトが入っていて、休めないんだ。ごめんね。',
      questionText: '男の学生はどうしてパーティーに来られませんか？',
      options: ['風邪をひいたから', 'アルバイトがあるから', 'お金がないから', '宿題が多いから'],
      correctAnswer: 1,
      explanationUzbek:
        "Erkak talaba: 'arubaito no shifuto ga haitte ite' (yarim kunlik ish navbati borligi sababli) kela olmasligini aytadi.",
    },
    {
      id: 221,
      section: 'listening',
      audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_002.mp3',
      script:
        '駅で案内放送を聞いています。新幹線は何番線から発車しますか？\n放送：まもなく11番線に、博多行き新幹線が到着いたします。黄色い線の内側までお下がりください。',
      questionText: '新幹線は何番線から発車しますか？',
      options: ['10番線', '11番線', '12番線', '13番線'],
      correctAnswer: 1,
      explanationUzbek:
        "E'londa aniq eshitiladi: '11-bansen ni Hakata-yuki shinkansen ga touchaku itashimasu' (11-yo'lga yetib keladi).",
    },
    {
      id: 222,
      section: 'listening',
      audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_003.mp3',
      script:
        '会社で課長と女性社員が話しています。女性社員はまず何をしますか？\n課長：佐藤さん、午後の会議の準備だけど、資料のコピーはできた？\n女性：あ、まだ会議室の予約をしただけです。\n課長：そうか。じゃあ、先にこの資料を20部コピーして会議室に持っていって。パソコンの準備はその後でいいから。\n女性：はい、わかりました。すぐやります。',
      questionText: '女性社員は まず 何を しますか？',
      options: ['会議室を予約する', '資料を20部コピーする', 'パソコンの準備をする', 'お茶を入れる'],
      correctAnswer: 1,
      explanationUzbek:
        "Boshliq: '先にこの資料を20部コピーして会議室に持っていって' (avval ushbu hujjatdan 20 nusxa ko'chirib majlis xonasiga olib bor) deb buyuradi.",
    },
    {
      id: 223,
      section: 'listening',
      audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_004.mp3',
      script:
        '病院で医者と男の人が話しています。男の人は白い薬をいつ飲みますか？\n医者：喉の痛みを抑える白い薬と、熱が出たときだけの青い薬を出しますね。\n男：はい。\n医者：白い薬は毎食後、必ず水と一緒に飲んでください。青い薬は38度以上の熱が出たときだけですよ。\n男：わかりました。',
      questionText: '男の人は 白い薬を いつ 飲みますか？',
      options: ['毎食後', '寝る前', '熱が38度以上出たときだけ', '朝起きたときだけ'],
      correctAnswer: 0,
      explanationUzbek:
        "Shifokor: '白い薬は毎食後、必ず水と一緒に飲んでください' (oq dorini har ovqatdan keyin iching) deb uqtiradi.",
    },
    {
      id: 224,
      section: 'listening',
      audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_005.mp3',
      script:
        '店で客と店員が話しています。客はどうやって支払いますか？\n店員：お会計は4200円になります。\n客：クレジットカードは使えますか？\n店員：すみません、ただいま通信端末の故障でカードとバーコード決済が使えないんです。現金かSuicaなどの交通系電子マネーのみとなります。\n客：そうですか。じゃあSuicaでお願いします。',
      questionText: '客は どうやって 支払いますか？',
      options: [
        'クレジットカード',
        'スマホのバーコード決済',
        '交通系電子マネー（Suica）',
        '商品券',
      ],
      correctAnswer: 2,
      explanationUzbek:
        "Xaridor bank kartasi ishlamagach: 'じゃあSuicaでお願いします' (undog' bo'lsa Suica transport elektron puli bilan to'layman) deydi.",
    },
    {
      id: 225,
      section: 'listening',
      audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_006.mp3',
      script:
        '男の人と女の人が明日の旅行について話しています。二人は何時の電車に乗りますか？\n男：明日は9時の特急に乗る予定だったよね？\n女：うん。でも現地の博物館が10時から特別展をやるから、できればもう一本早い8時半の電車にしない？\n男：いいね。じゃあ8時半のに乗ろう。駅には8時15分に集合ね。',
      questionText: '二人は 明日 何時の 電車に 乗りますか？',
      options: ['8時', '8時15分', '8時半', '9時'],
      correctAnswer: 2,
      explanationUzbek:
        "Ayol 8:30 dagi poyezdni taklif qiladi va erkak ham rozi bo'ladi ('8時半のに乗ろう'). 8:15 esa stantsiyada uchrashish vaqti.",
    },
  ],

  // ==========================================
  // === N3 MOCK EXAM (25 questions) ==========
  // ==========================================
  N3: [
    {
      id: 301,
      section: 'knowledge',
      questionText: '大事な 会議の 最中に、携帯電話が 鳴って（　）。',
      options: ['しまった', 'おいた', 'みた', 'いった'],
      correctAnswer: 0,
      explanationUzbek:
        "Kutilmagan yoki noxush hodisa yuz berganda '~te shimatta' (afsuski bo'lib qoldi) grammatikasi ishlatiladi.",
    },
    {
      id: 302,
      section: 'knowledge',
      questionText: 'どんなに 頼まれても、この仕事を 引き受ける（　）には いかない。',
      options: ['もの', 'こと', 'わけ', 'はず'],
      correctAnswer: 2,
      explanationUzbek:
        "'~wake ni wa ikanai' ijtimoiy yoki axloqiy sababga ko'ra 'bunday qilib bo'lmaydi' degan ma'noni ifodalaydi.",
    },
    {
      id: 303,
      section: 'knowledge',
      questionText: '試験の 結果は、ウェブサイトに（　）次第、メールで ご連絡します。',
      options: ['発表する', '発表した', '発表され', '発表して'],
      correctAnswer: 2,
      explanationUzbek:
        "'fe'l o'zagi (stem) + shidai' (darhol, bo'lishi bilanoq) ma'nosini bildiradi: happyousare-shidai (e'lon qilinishi bilanoq).",
    },
    {
      id: 304,
      section: 'knowledge',
      questionText: '最近の パソコンは 小型化される（　）、性能も 著しく 向上している。',
      options: ['反面', '一方', '途端', '次第'],
      correctAnswer: 1,
      explanationUzbek:
        "Biror tendensiyaning bir tomonlama rivojlanib borishini bildirishda 'ippou' qo'llaniladi.",
    },
    {
      id: 305,
      section: 'knowledge',
      questionText: '契約を結ぶ前に、条件を（慎重）に 確認してください。',
      options: ['しんちょう', 'きんちょう', 'しんじょう', 'きんじょう'],
      correctAnswer: 0,
      explanationUzbek:
        "「慎重」kanjisining to'g'ri o'qilishi — しんちょう (ehtiyotkorlik bilan, chuqur o'ylab).",
    },
    {
      id: 306,
      section: 'knowledge',
      questionText: '今回の 新規事業の 計画（　）、役員会で 詳しい 説明が あった。',
      options: ['に関して', 'にとって', 'に反して', 'を通じて'],
      correctAnswer: 0,
      explanationUzbek:
        "Biror mavzu yoki masala to'g'risida gap ketganda '〜に関して' (to'g'risida / haqida) grammatikasi ishlatiladi.",
    },
    {
      id: 307,
      section: 'knowledge',
      questionText: '毎日 仕事で 多忙な 現代人（　）、質の良い 睡眠は 不可欠だ。',
      options: ['にとって', 'に対して', 'によって', 'につれて'],
      correctAnswer: 0,
      explanationUzbek:
        "Muayyan shaxs yoki toifa nuqtai nazaridan baholaganda '〜にとって' (... uchun) ifodasi to'g'ri keladi.",
    },
    {
      id: 308,
      section: 'knowledge',
      questionText: '冬の 寒い 時期は、どうしても 運動不足に（　）になる。',
      options: ['なりがち', 'なりぎみ', 'なりそう', 'なりかけ'],
      correctAnswer: 0,
      explanationUzbek:
        "Noxush odat yoki tendensiyaga moyillikni bildirishda 'fe'l o'zagi + がち' (〜がち) qo'llanadi: なりがち (bo'lib qolishga moyil).",
    },
    {
      id: 309,
      section: 'knowledge',
      questionText: '明日、午前10時に 貴社へ（　）。よろしくお願いいたします。',
      options: ['お伺いします', 'いらっしゃいます', '参られます', 'おいでになります'],
      correctAnswer: 0,
      explanationUzbek:
        "Hamkor kompaniyaga borishda o'z harakatini kamtarin qilish uchun kenjougo (kamtarlik) fe'li 'お伺いします' ishlatiladi.",
    },
    {
      id: 310,
      section: 'knowledge',
      questionText: '午後から 天気が 崩れると 思っていたが、（　）雷雨になった。',
      options: ['案の定', 'かえって', 'むしろ', 'せっかく'],
      correctAnswer: 0,
      explanationUzbek:
        "'案の定' (あんのじょう) - kutilganidek, taxmin qilinganidek (ko'pincha salbiy holatlarda) ma'nosidagi ravishdir.",
    },
    {
      id: 311,
      section: 'knowledge',
      questionText: 'あんなに 毎日 猛練習を 積み重ねて きたのだから、彼なら 必ず 合格する（　）。',
      options: ['に違いない', 'にすぎない', 'わけがない', 'はずがない'],
      correctAnswer: 0,
      explanationUzbek:
        "Kuchli ishonch bilan xulosa chiqarishda '〜に違いない' (shubhasiz, aniq shunday bo'ladi) qo'llanadi.",
    },
    {
      id: 312,
      section: 'knowledge',
      questionText: '会社の 就業規則により、勤務中の 私用電話は 原則禁止という（　）。',
      options: ['ことになっている', 'ことにしている', 'わけになっている', 'ようにしている'],
      correctAnswer: 0,
      explanationUzbek:
        "Ijtimoiy qoida, qonun yoki tashkiliy tartib-qoidani bildirishda '〜ことになっている' (shunday tartib belgilangan) ishlatiladi.",
    },
    {
      id: 313,
      section: 'knowledge',
      questionText: '正しい文を作ってください：\n困難な 状況でも、＿＿ ＿＿ ★ ＿＿ 努力した。',
      options: ['決して', '目標に向かって', '諦めることなく', '最後まで'],
      correctAnswer: 2,
      explanationUzbek:
        "To'g'ri tartib: 困難な 状況でも、[決して] [目標に向かって] [★ 諦めることなく] [最後まで] 努力した -> 諦めることなく (3-variant).",
    },
    {
      id: 314,
      section: 'reading',
      passageText:
        '環境保護の観点から、プラスチックごみの削減が世界的な課題となっている。レジ袋の有料化以降、エコバッグを持参する消費者は確実に増えたが、容器包装プラスチックの総量は依然として高水準にある。単に消費者の意識に頼るだけでなく、企業側が分解可能な代替素材を積極的に採用することが不可欠である。',
      questionText: '筆者が最も強調したい点はどれですか？',
      options: [
        'レジ袋の価格をもっと引き上げるべきだ',
        '消費者の努力だけに頼らず、企業が代替素材を採用すべきだ',
        'プラスチック製品の製造を完全に禁止すべきだ',
        'エコバッグの普及率をさらに高める必要がある',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Muallif: 'iste'molchilar ongi bilangina cheklanmay, korxonalar parchalanishi mumkin bo'lgan muqobil materiallarni qo'llashi shart' deb ta'kidlaydi.",
    },
    {
      id: 315,
      section: 'reading',
      passageText:
        '時間を有効に使うためには、「緊急度」と「重要度」の2つの軸でタスクを整理するとよい。多くの人は「緊急だが重要ではないこと」に追われがちだが、自己成長につながるのは「緊急ではないが重要なこと」である。毎日の読書や健康管理がその典型例だ。',
      questionText: '自己成長にとって最も重要だとされているのはどのようなことですか？',
      options: [
        '緊急かつ重要なこと',
        '緊急だが重要ではないこと',
        '緊急ではないが重要なこと',
        '緊急でも重要でもないこと',
      ],
      correctAnswer: 2,
      explanationUzbek:
        "Matnda o'sish uchun eng muhimi: 'kinkyuu dewa nai ga juuyou na koto' (shoshilinch bo'lmagan, lekin muhim ishlar) deb aniq aytilgan.",
    },
    {
      id: 316,
      section: 'reading',
      passageText:
        'テレワークの普及により通勤負担は激減したが、オフィスでの偶然の立ち話や雑談から生まれていたクリエイティブな発想やチームの一体感が薄れるという弊害も生じている。テキストチャットや画面越しの定例会議だけでは相手の微妙な感情の機微を察知しにくいため、週に数日の出社日を設けたり、オンライン上で気軽に雑談できる場を意図的に設ける企業が増えている。',
      questionText: '文章によると、テレワークにおいてどのような課題が生じていますか？',
      options: [
        '通勤時間が以前より長くなってしまったこと',
        '業務の生産性が完全にゼロになってしまうこと',
        '偶発的な雑談から生まれるアイデアや一体感が減少すること',
        '社員同士の給与格差が広がること',
      ],
      correctAnswer: 2,
      explanationUzbek:
        "Matnda tasvirlanishicha, teleworkning asosiy muammosi — tasodifiy suhbatlardan tug'iladigan ijodiy g'oyalar va jamoaviy birdamlikning susayishidir.",
    },
    {
      id: 317,
      section: 'reading',
      passageText:
        '現代はインターネット上で膨大な要約や解説動画を即座に閲覧できる時代である。しかし、一冊の書物を最初から最後までじっくりと読み通す経験には、それに代えがたい独自の価値が存在する。著者が長い論理の筋道をどのように組み立て、どのような葛藤を経て結論に至ったのかを追体験することによってのみ、表面的な知識にとどまらない「本質を見抜く深い洞察力」が培われるからである。',
      questionText: '筆者が考える「1冊の本を読み通すことの最大の価値」は何ですか？',
      options: [
        '短時間で大量のトリビアを記憶できること',
        '著者の思考過程を追体験し、本質を見抜く深い洞察力を養えること',
        '最新の流行やトレンドをいち早く知ること',
        '要約動画を作るスキルが身につくこと',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Muallif kitobni to'liq o'qish orqali muallifning fikrlash zanjirini bosib o'tish va chuqur mohiyatni tushunish ko'nikmasi shakllanishini ta'kidlaydi.",
    },
    {
      id: 318,
      section: 'reading',
      passageText:
        '【クラウドサービス利用規約および料金改定のお知らせ】\n平素は当ストレージサービスをご利用いただき、誠にありがとうございます。\nこのたび、最新のセキュリティ基盤強化およびAI検索機能の標準搭載に伴い、2026年10月1日より月額利用料を現行の1,200円から1,500円に改定いたします。\nなお、現行プランをご契約中のお客様は、9月30日までに1年契約の自動更新をお申し込みいただくことで、向こう1年間は旧料金（月額1,200円）のまま新機能をご利用いただけます。',
      questionText: '現行の利用者が来年も旧料金のまま利用し続けるにはどうすればよいですか？',
      options: [
        '何もしないで待っていればよい',
        '9月30日までに1年契約の自動更新を申し込む',
        'セキュリティ機能を無効にする',
        '10月1日以降に新規アカウントを作成する',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "E'lon shartida aytilgan: '9月30日までに1年契約の自動更新をお申し込みいただくことで、向こう1年間は旧料金（月額1,200円）のまま新機能をご利用いただけます'.",
    },
    {
      id: 319,
      section: 'reading',
      passageText:
        '【コワーキングスペース『MIRAI』料金プランのご案内】\n・デイタイム会員（平日 9:00〜18:00利用可能）：月額15,000円\n・ナイト＆ホリデー会員（平日 18:00〜23:00 および 土日祝日終日）：月額12,000円\n・フルタイム会員（24時間365日利用可能、登記利用可）：月額28,000円\n※全プランでフリードリンク、高速Wi-Fi、通話専用ブースが無料利用可能。会議室利用は1時間あたり別途1,000円（フルタイム会員は月3時間まで無料）。',
      questionText:
        '平日夜（19時以降）と日曜日を中心に利用し、費用を最も抑えたい人に最適なプランはどれですか？',
      options: ['デイタイム会員', 'ナイト＆ホリデー会員', 'フルタイム会員', '会議室専用プラン'],
      correctAnswer: 1,
      explanationUzbek:
        "Ish kunlari kechasi (18:00 dan keyin) va dam olish kunlari foydalanuvchilar uchun eng arzon va mos tarif — 'ナイト＆ホリデー会員' (oyiga 12,000 yen).",
    },
    {
      id: 320,
      section: 'listening',
      audioUrl: '/audio/choukai/n3/01 Track 1.mp3',
      script:
        '会社で上司と部下が話しています。部下はこれから何を修正しますか？\n上司：山田さん、提出してもらった企画書、大筋はいいんだけど、予算のグラフが去年のデータのままだよ。\n部下：あ、大変失礼しました！すぐに最新のデータに差し替えます。\n上司：うん、それとスケジュールのフォントも統一しておいてね。',
      questionText: '部下はまず何を修正しますか？',
      options: ['企画書のタイトル', '予算のグラフのデータ', '全体の構成', '参加者のリスト'],
      correctAnswer: 1,
      explanationUzbek:
        "Xodim o'tgan yilgi eski byudjet grafik ma'lumotlarini eng so'nggisiga almashtirishini aytadi.",
    },
    {
      id: 321,
      section: 'listening',
      audioUrl: '/audio/choukai/n3/02 Track 2.mp3',
      script:
        '留学生と先生が相談しています。留学生は何のビザを申請しなければなりませんか？\n学生：先生、卒業後も日本で就職活動を続けたいのですが。\n先生：それなら、「特定活動ビザ」への変更手続きが必要になりますよ。推薦状を準備しましょう。',
      questionText: '留学生が申請するビザの種類は何ですか？',
      options: ['留学ビザ', '特定活動ビザ', '就労ビザ', '観光ビザ'],
      correctAnswer: 1,
      explanationUzbek:
        "O'qituvchi o'qishni tugatgach ish qidirish uchun 'Tokutei Katsudou Visa' kerakligini tushuntiradi.",
    },
    {
      id: 322,
      section: 'listening',
      audioUrl: '/audio/choukai/n3/03 Track 3.mp3',
      script:
        '会社で男性社員と女性上司が話しています。男性社員は今日中に何を終わらせなければなりませんか？\n男：課長、来週のセミナーの発表スライドと、取引先へ送る見積書の作成があるのですが、どちらを優先しましょうか？\n上司：スライドは明日一緒に見直すから、今日はまず見積書を直ちに完成させて先方にメール送信しておいて。\n男：承知しました。見積書を最優先で片付けます。',
      questionText: '男性社員は 今日中に 何を 終わらせますか？',
      options: [
        'セミナーの発表スライド',
        '取引先への見積書の作成と送信',
        '会議室の手配',
        '出張の精算手続き',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Boshliq taqdimot slaydlarini ertaga birga ko'rishlarini, bugun esa kechiktirmasdan hisob-faktura (見積書) ni yuborishni buyuradi.",
    },
    {
      id: 323,
      section: 'listening',
      audioUrl: '/audio/choukai/n3/04 Track 4.mp3',
      script:
        'デパートの館内放送を聞いています。迷子のお子様の特徴は何ですか？\n放送：お客様にお呼び出しを申し上げます。4階おもちゃ売り場にて、4歳くらいの男の子がお連れ様をお探しです。青い長袖Tシャツに、黒い半ズボンを着用し、赤い帽子をかぶっております。お心当たりのあるお客様は、1階案内所までお越しください。',
      questionText: '迷子の男の子が 着ている 服装の 特徴は どれですか？',
      options: [
        '黄色いシャツに白いズボン',
        '青い長袖Tシャツに黒い半ズボン、赤い帽子',
        '緑のセーターにジーンズ',
        '白いシャツに茶色い帽子',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "E'londa aniq aytildi: '青い長袖Tシャツに、黒い半ズボンを着用し、赤い帽子をかぶっております'.",
    },
    {
      id: 324,
      section: 'listening',
      audioUrl: '/audio/choukai/n3/05 Track 5.mp3',
      script:
        'ホテルのフロントで客と係員が話しています。客は何時の朝食券をもらいましたか？\n係員：ご朝食は7時、8時、9時の時間指定制となっておりますが、何時がよろしいでしょうか？\n客：明日は朝8時半にチェックアウトして出発したいんです。\n係員：それでしたら、7時からの回が最もゆっくり召し上がっていただけます。\n客：わかりました。では7時でお願いします。',
      questionText: '客は 何時の 朝食券を もらいましたか？',
      options: ['7時', '8時', '8時半', '9時'],
      correctAnswer: 0,
      explanationUzbek:
        "Mijoz 8:30 da jo'nab ketishi kerak bo'lgani sababli soat 7 dagi nonushta vaqtini tanlaydi.",
    },
    {
      id: 325,
      section: 'listening',
      audioUrl: '/audio/choukai/n3/06 Track 6.mp3',
      script:
        'ラジオで専門家が節電について話しています。家庭で最も簡単に効果が出る節電対策は何ですか？\n専門家：みなさんエアコンの設定温度を気にされますが、実は長期間使っていない家電製品の待機電力を減らすこと、特にスイッチ付きタップでこまめに電源を切ることが、生活の快適さを損なわずに最も効果的な節電になります。',
      questionText: '専門家が 勧めている 最も 手軽で 効果的な 節電対策は何ですか？',
      options: [
        'エアコンを一切つけないこと',
        'スイッチ付きタップなどを活用して待機電力を切ること',
        '夜間は照明をすべて消すこと',
        '冷蔵庫の電源を定期的に抜くこと',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Mutaxassis maishiy texnikalarning kutish rejimidagi quvvatini o'chirish (スイッチ付きタップ orqali) eng samarali ekanligini ta'kidlaydi.",
    },
  ],

  // ==========================================
  // === N2 & N1 MOCK EXAMS ===================
  // ==========================================
  N2: [
    {
      id: 401,
      section: 'knowledge',
      questionText: '景気の 低迷に（　）、多くの 企業が 採用人数を 削減した。',
      options: ['ともなって', '関わらず', '限らず', 'おいて'],
      correctAnswer: 0,
      explanationUzbek:
        "'~ni tomonatte' (biror narsa sodir bo'lishi bilan birga, unga mutanosib ravishda) ma'nosini beradi.",
    },
    {
      id: 402,
      section: 'knowledge',
      questionText: 'いくら 経験が 豊富だからと（　）、過信は 禁物だ。',
      options: ['いっても', 'いったら', 'いえば', 'いって'],
      correctAnswer: 0,
      explanationUzbek:
        "'~kara to itte / to ittemo' (garchi ... bo'lgan taqdirda ham) qolipi to'g'ri keladi.",
    },
    {
      id: 403,
      section: 'knowledge',
      questionText: '新商品の 発売を（　）、大規模な キャンペーンを 展開する。',
      options: ['めぐって', '皮切りに', '契機に', 'よそに'],
      correctAnswer: 1,
      explanationUzbek:
        "'~o kawakiri ni' biror ketma-ket hodisalar zanjirining boshlanishi va startini ifodalaydi.",
    },
    {
      id: 404,
      section: 'knowledge',
      questionText: 'あの 作家の 新作は、期待を（　）素晴らしい 傑作だった。',
      options: ['通して', '裏切らない', 'もとにした', 'めざした'],
      correctAnswer: 1,
      explanationUzbek:
        "'kitai o uragiranai' (kutilmalarni puchga chiqarmagan, ishonchni oqlagan) iborasi qo'llaniladi.",
    },
    {
      id: 405,
      section: 'knowledge',
      questionText: 'この プロジェクトの 成功は、チーム全員の 協力（　）あり得ない。',
      options: ['なしには', 'ばかりに', 'わりに', 'からして'],
      correctAnswer: 0,
      explanationUzbek:
        "'~nashi ni wa (ari-enai)' (...siz aslo bo'lishi mumkin emas / ...siz tasavvur qilib bo'lmaydi) ma'nosini bildiradi.",
    },
    {
      id: 406,
      section: 'knowledge',
      questionText: '地震の 揺れを 感知した（　）、エレベーターは 最寄り階に 自動停止した。',
      options: ['が早いか', 'なり', 'とたん', 'や否や'],
      correctAnswer: 2,
      explanationUzbek: "'~to tan' (shu zahoti, bilanoq) kutilmagan ketma-ket hodisani ifodalaydi.",
    },
    {
      id: 407,
      section: 'knowledge',
      questionText:
        '次の 下線部の 言葉の 読み方として 最も よいものを 選びなさい。\n「政府は 新たな 経済政策を <u>提唱</u>した。」',
      options: ['ていしょう', 'だいしょう', 'ていじょう', 'ちょうしょう'],
      correctAnswer: 0,
      explanationUzbek:
        "提唱 iyeroglifining to'g'ri o'qilishi 'ていしょう' (Teishou - ilgari surish, taklif qilish).",
    },
    {
      id: 408,
      section: 'knowledge',
      questionText:
        '次の 下線部の 言葉の 漢字として 最も よいものを 選びなさい。\n「彼は 困難な 状況でも <u>れいせい</u>に 判断した。」',
      options: ['冷清', '冷静', '冷精', '冷整'],
      correctAnswer: 1,
      explanationUzbek:
        "'Reisei' (sovuqqon, bosiq) so'zining to'g'ri iyeroglifi '冷静' hisoblanadi.",
    },
    {
      id: 409,
      section: 'knowledge',
      questionText: '会議で 出た 意見を（　）、最終的な 報告書を 作成した。',
      options: ['ふまえて', 'かぎって', 'かけて', 'めぐって'],
      correctAnswer: 0,
      explanationUzbek:
        "'~o fumaete' (biror narsani asos/tayanch qilib olgan holda) ma'nosidagi N2 grammatik vositasi.",
    },
    {
      id: 410,
      section: 'knowledge',
      questionText: '留学を（　）に、彼の 視野は 大きく 広がった。',
      options: ['最中', '契機', '極み', '拍子'],
      correctAnswer: 1,
      explanationUzbek:
        "'~o keiki ni' (biror muhim voqeani turtki/imkoniyat deb bilib) qolipi to'g'ri keladi.",
    },
    {
      id: 411,
      section: 'knowledge',
      questionText: '親の 反対を（　）、彼は 自分の 夢を 追い続けた。',
      options: ['よそに', 'かねて', 'もとより', 'こめて'],
      correctAnswer: 0,
      explanationUzbek:
        "'~o yoso ni' (boshqalarning e'tirozi yoki xavotiriga qaramasdan, pisand qilmay) degan ma'noni beradi.",
    },
    {
      id: 412,
      section: 'knowledge',
      questionText: '次の 言葉の 使い方として 最も 適切なものを 選びなさい。\n「<u>愛着</u>」',
      options: [
        '長年 使ってきた 時計に 深い 愛着を 感じている。',
        '新しい パソコンを 愛着して 仕事を 始めた。',
        '彼の 愛着な 態度は 周囲を 怒らせた。',
        '今回の 旅行は とても 愛着な 思い出に なった。',
      ],
      correctAnswer: 0,
      explanationUzbek:
        "'Aichaku' (biror qadrdon buyum yoki joyga mehr qo'yish) hissini ifodalaydi: '愛着を感じる / 愛着が湧く'.",
    },
    {
      id: 413,
      section: 'knowledge',
      questionText: 'あの レストランは、料理の 味は（　）、接客サービスが 素晴らしい。',
      options: ['ともかく', 'からこそ', 'あまり', 'いっぽうで'],
      correctAnswer: 0,
      explanationUzbek:
        "'~wa tomokaku' (...ni chetga surib turganda / bir chetga qo'yib aytganda) qolipi qo'llaniladi.",
    },
    {
      id: 414,
      section: 'reading',
      passageText:
        'テレワークの普及により、労働者は通勤ストレスから解放された一方で、業務と私生活の境界が曖昧になるという弊害が指摘されている。常時接続された環境下では、終業後も連絡への対応を迫られ、慢性的な疲労蓄積を招く恐れがある。この問題に対処すべく、諸外国では「つながらない権利」を法制化する動きが加速している。日本においても、単なる柔軟な働き方の推進にとどまらず、労働者の心身の健康を守る明確なルール作りが喫緊の課題といえよう。',
      questionText: '筆者が日本社会に求めていることは何ですか？',
      options: [
        'テレワークを廃止し、全員がオフィスに出社すること',
        '終業後の連絡を規制するなど、労働者の健康を守る明確なルールを作ること',
        '諸外国と同じ労働法をそのまま無条件に導入すること',
        'IT機器の利用時間を個人が自己責任で管理すること',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Muallif ish vaqtidan keyin aloqaga chiqmaslik huquqi kabi aniq himoya qoidalari zarurligini ta'kidlaydi.",
    },
    {
      id: 415,
      section: 'reading',
      passageText:
        '人工知能（AI）の急速な進化は、定型的な業務のみならず、創造性を要する分野にまで影響を及ぼし始めている。しかし、AIが生成する作品は過去の厖大なデータの再構成に過ぎず、人間特有の「個人的な体験や葛藤から生じる独自性」を代替することは原理的に不可能である。したがって、人間はAIを競合相手とみなすのではなく、自らの創造性を拡張するための道具として共生を図るべきである。',
      questionText: '筆者によると、人間にしか生み出せないものとは何ですか？',
      options: [
        '膨大なデータに基づく正確な分析結果',
        '個人的な体験や葛藤から生じる独自性',
        '短時間で大量に作成できる絵画や文章',
        '過去の様式を忠実に模倣した作品',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Matnda odamning o'z shaxsiy kechinmalari va ziddiyatlaridan kelib chiquvchi o'ziga xoslikni (独自性) sun'iy intellekt o'rnini bosa olmasligi yozilgan.",
    },
    {
      id: 416,
      section: 'reading',
      passageText:
        '近年、消費者の意識は「モノの所有」から「コトの体験」へと大きく移行している。かつては高級車や貴金属を所有することが社会的地位の象徴とされていたが、現代の若年層はシェアリングサービスを賢く利用し、旅先での特別な体験や他者との共感に価値を見出している。この変化は、企業に対して従来の製品重視の販売モデルから、体験と関係性を重視するサービスモデルへの転換を強く促している。',
      questionText: '現代の若年層の消費傾向として最も合致するものはどれですか？',
      options: [
        '高級な品物をできるだけ多く買い集めること',
        'モノを所有することよりも、体験や人との共感に価値を置くこと',
        'シェアリングサービスを避け、すべて自分で購入すること',
        '旅行やイベントなどの出費を極力控えること',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Yoshlar buyumni sotib olib mulk qilishdan ko'ra (モノの所有), noyob tajriba va boshqalar bilan hamfikrlikka (体験・共感) ko'proq ahamiyat bermoqda.",
    },
    {
      id: 417,
      section: 'reading',
      passageText:
        '失敗を恐れる文化が根強い組織では、新規事業の立ち上げや業務改善が停滞しやすい。真のイノベーションは、数多くの試行錯誤と想定内の失敗を前提として初めて生まれるものである。経営層が失敗した社員を減点方式で評価するのではなく、果敢に挑戦したプロセスそのものを正当に評価する姿勢を示してこそ、社員の自発的な創意工夫が引き出されるのである。',
      questionText: '組織でイノベーションを起こすために経営層に必要な姿勢は何ですか？',
      options: [
        '絶対に失敗が起きない完璧な計画のみを承認すること',
        '失敗した社員に対して厳しい減点処分を科すこと',
        '失敗を恐れず挑戦したプロセスそのものを正当に評価すること',
        '新規事業への投資を控え、既存事業のみに注力すること',
      ],
      correctAnswer: 2,
      explanationUzbek:
        'Muallif xodimlarning xatosiga jazo bermasdan, botirlik bilan yangilikka intilgan jarayonini (挑戦したプロセス) yuqori baholash zarurligini uqtiradi.',
    },
    {
      id: 418,
      section: 'reading',
      passageText:
        '読書の意義は単なる情報収集にとどまらない。著者の論理展開を追い、自分自身の経験と照らし合わせながら批判的に吟味するプロセスを通じて、読者は深い「思考力」を養うことができる。インターネットの要約情報だけで満足してしまうと、結論だけを効率的に得ることはできても、自ら深く問いを立てて思索する力はむしろ衰退してしまう危険性がある。',
      questionText: '筆者がインターネットの要約情報に対して懸念している点は何ですか？',
      options: [
        '情報が手に入るまでに時間がかかりすぎること',
        '自ら深く問いを立てて思索する力が衰えてしまうこと',
        'インターネットの利用料金が高騰していること',
        '要約された文章が難解で理解できないこと',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Faqat tayyor qisqartirilgan konspektlar bilan cheklanish o'z mustaqil mushohada yuritish qobiliyatini zaiflashtiradi (思索する力が衰退する).",
    },
    {
      id: 419,
      section: 'reading',
      passageText:
        '【市立図書館 システム移行に伴う休館のお知らせ】\n新図書管理システムの導入工事に伴い、以下の期間、全館休館いたします。\n・休館期間：11月10日（月）〜 11月17日（月）\n・図書の返却：休館中も正面玄関横の「返却ポスト」をご利用いただけます（CD・DVD等の視聴覚資料は破損防止のため投函不可）。\n・予約サービス：11月9日午後6時以降、ウェブサイトからの予約受付を一時停止します。\n利用者の皆様にはご不便をおかけしますが、ご理解とご協力をお願い申し上げます。',
      questionText: '休館期間中の対応について、正しいものはどれですか？',
      options: [
        'すべての資料は返却ポストに投函して返却できる',
        'CDやDVDは返却ポストに投函せず、開館後にカウンターへ返却する',
        '休館期間中もウェブサイトからいつでも本の予約ができる',
        '休館中は正面玄関から入館して自習室のみ利用できる',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "E'londa CD va DVD disklari sinish xavfi bo'lgani sababli qutiga tashlanmasligi (投函不可) va ochilgandan so'ng topshirilishi ko'rsatilgan.",
    },
    {
      id: 420,
      section: 'listening',
      audioUrl: '/audio/choukai/n2/Track01.mp3',
      script:
        'テレビで経済アナリストが話しています。今年度の個人消費の特徴は何ですか？\nアナリスト：今年度は物価高の影響で生活必需品の節約志向が強まる一方、旅行やコンサートなど体験型の消費には惜しみなく支出する傾向が見られます。二極化が顕著になっています。',
      questionText: '今年度の個人消費の特徴として述べられているのはどれですか？',
      options: [
        'すべての分野で消費が均等に落ち込んでいる',
        '日用品は節約するが、体験型のことにはお金を使うという二極化',
        '高級ブランド品の売上だけが伸びている',
        'オンラインショッピングの利用が激減している',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Iste'molchilar ro'zg'or mahsulotlarida tejab, sayohat va konsert kabi tajriba (taiken) sohalariga pul sarflamoqda (qutblanish).",
    },
    {
      id: 421,
      section: 'listening',
      audioUrl: '/audio/choukai/n2/Track02.mp3',
      script:
        'セミナーで講師が話しています。チームの生産性を高めるために最も重要な要素は何ですか？\n講師：心理的安全性の確保です。失敗を恐れず率直に意見を言える環境こそが、イノベーションの土台となります。',
      questionText: 'チームの生産性を高めるために最重要とされているものは何ですか？',
      options: ['厳格な上下関係', '心理的安全性', '労働時間の延長', '成果主義による競争'],
      correctAnswer: 1,
      explanationUzbek:
        'Spiker jamoada psixologik xavfsizlik (shinriteki anzensei) eng asosiy omil ekanligini aytadi.',
    },
    {
      id: 422,
      section: 'listening',
      audioUrl: '/audio/choukai/n2/Track03.mp3',
      script:
        '会社で課長と女性社員が話しています。女性社員はまず何をしなければなりませんか？\n課長：佐藤さん、明日のプレゼン資料の修正、どうなってる？\n社員：はい、市場調査のグラフは差し替え完了しました。\n課長：ありがとう。じゃあ、印刷する前に、部長に最終確認のメールを送ってくれるかな。承認が下りたら部数を刷ろう。\n社員：承知いたしました。すぐにメールをお送りします。',
      questionText: '女性社員は まず 何を しますか？',
      options: [
        '資料を全員分印刷する',
        '市場調査のグラフを修正する',
        '部長に確認のメールを送る',
        '明日のプレゼンの練習をする',
      ],
      correctAnswer: 2,
      explanationUzbek:
        "Bo'lim boshlig'i chop etishdan oldin boshliqqa (buchou) tasdiq so'rab xat yozishni buyuradi ('部長に最終確認のメールを送って').",
    },
    {
      id: 423,
      section: 'listening',
      audioUrl: '/audio/choukai/n2/Track04.mp3',
      script:
        'ラジオで専門家が睡眠について話しています。朝すっきりと目覚めるために効果的な方法は何ですか？\n専門家：目覚めを良くするためには、起きた直後にカーテンを開けて太陽の光を浴びることが極めて効果的です。これにより体内時計がリセットされ、夜の自然な眠気にもつながります。',
      questionText: '朝 すっきりと 目覚めるために 最も 効果的な 方法は何ですか？',
      options: [
        '起きてすぐに太陽の光を浴びること',
        '夜遅くに激しい運動をすること',
        'アラームを何度も鳴らすこと',
        '朝一番に熱いシャワーを浴びること',
      ],
      correctAnswer: 0,
      explanationUzbek:
        "Mutaxassis uyg'ongan zahoti pardani ochib quyosh nurini qabul qilishni eng samarali vosita deb ta'kidlaydi ('太陽の光を浴びること').",
    },
    {
      id: 424,
      section: 'listening',
      audioUrl: '/audio/choukai/n2/Track05.mp3',
      script:
        '男の人と女の人が話しています。男の人はなぜ新しいスマートフォンを買わないことにしましたか？\n女：新しいモデル出たけど、買い替えないの？\n男：うーん、カメラの性能は魅力的だったんだけどね。今使っている機種でもバッテリー持ちは悪くないし、何より本体の価格が高すぎて手が出ないよ。\n女：確かに最近のは15万円超えるもんね。',
      questionText: '男の人が 新しいスマートフォンを 買わない 理由は 何ですか？',
      options: [
        'カメラの性能が気に入らないから',
        '今使っている機種のバッテリーが切れたから',
        '本体の価格が高すぎるから',
        'デザインが古く見えるから',
      ],
      correctAnswer: 2,
      explanationUzbek:
        'Yigit yangi telefon narxi haddan tashqari qimmatligi (価格が高すぎて手が出ない) sababli uni xarid qilmaslikka qaror qiladi.',
    },
    {
      id: 425,
      section: 'listening',
      audioUrl: '/audio/choukai/n2/Track06.mp3',
      script:
        '取引先のオフィスで、受付の人が来客に対応しています。\n客：恐れ入ります。本日14時に営業部の田中様とお約束をいただいております、ABC商事の木村と申します。\n受付：木村様ですね。お待ちしておりました。恐れ入りますが、あちらのソファーにお掛けになって少々お待ちいただけますでしょうか。担当の田中に内線で連絡いたします。\n客：わかりました。ありがとうございます。',
      questionText: '木村さんは この後 まず どうしますか？',
      options: [
        '自分で営業部の部屋へ向かう',
        'ソファーに座って待つ',
        '田中に直接電話をかける',
        '建物の外へ出て待つ',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Qabulxona xodimi divanda o'tirib ozgina kutib turishni iltimos qiladi ('ソファーにお掛けになって少々お待ちいただけますでしょうか').",
    },
  ],
  // ==========================================
  // === N1 MOCK EXAM =========================
  // ==========================================
  N1: [
    {
      id: 501,
      section: 'knowledge',
      questionText: '国家の 安全保障に 関わる 重大な 秘密を（　）漏らすことは 許されない。',
      options: ['たりとも', 'だに', 'すら', 'まじき'],
      correctAnswer: 0,
      explanationUzbek:
        "'~taritomo (...nai)' qolipi 'hatto zarracha ham' degan kuchli inkor ma'nosini bildiradi: ichi-nichi taritomo / sukoshi taritomo.",
    },
    {
      id: 502,
      section: 'knowledge',
      questionText: '親友の 突然の 訃報に、悲しみを（　）ことが できなかった。',
      options: ['禁じ得ない', '禁じざる', '禁じかねない', '禁じ得る'],
      correctAnswer: 0,
      explanationUzbek:
        "'~kinji enai' hissiyotlarni bosib tura olmaslik, tiyib bo'lmas qayg'uni bildiradi: kanashimi o kinji enai.",
    },
    {
      id: 503,
      section: 'knowledge',
      questionText: '誠心誠意の 謝罪が あって（　）、初めて 和解への 道が 開かれる。',
      options: ['こそあれ', 'ならでは', 'をおいて', 'こそ'],
      correctAnswer: 3,
      explanationUzbek:
        "'A atte koso' ta'kid qolipi: aynan chin dildan uzr bo'lgandagina yarashishga yo'l ochiladi.",
    },
    {
      id: 504,
      section: 'knowledge',
      questionText: '公職に ある者が、私利私欲を 肥やすなど 断じて（　）行為だ。',
      options: ['あるまじき', 'ありがちな', 'あるべき', 'あり得る'],
      correctAnswer: 0,
      explanationUzbek:
        "'~aru majiki' qolipi kasbiy yoki ijtimoiy mavqe nuqtai nazaridan 'aslo yo'l qo'yib bo'lmaydigan' ma'nosini anglatadi.",
    },
    {
      id: 505,
      section: 'knowledge',
      questionText: '自然の 猛威の 前には、人間の 知恵など 児戯に（　）。',
      options: ['等しい', '至らない', '及ばない', '堪えない'],
      correctAnswer: 0,
      explanationUzbek:
        "'jigi ni hitoshii' (bolalar o'yiniga teng, arzimas) iborasi tabiat oldida inson ojizligini ko'rsatadi.",
    },
    {
      id: 506,
      section: 'knowledge',
      questionText:
        '次の 下線部の 言葉の 読み方として 最も よいものを 選びなさい。\n「長年の 悲願が ついに <u>成就</u>した。」',
      options: ['じょうじゅ', 'せいじゅ', 'じょうしゅう', 'せいしゅう'],
      correctAnswer: 0,
      explanationUzbek:
        "成就 so'zining to'g'ri o'qilishi — じょうじゅ (Jouju - niyatning amalga oshishi, ro'yobga chiqishi).",
    },
    {
      id: 507,
      section: 'knowledge',
      questionText:
        '次の 下線部の 言葉の 漢字として 最も よいものを 選びなさい。\n「相手の <u>しつよう</u>な 追及に 苦慮した。」',
      options: ['執拗', '執要', '湿拗', '執洋'],
      correctAnswer: 0,
      explanationUzbek: "'Shitsuyou' (o'jar, tinimsiz, qaysar) so'zining to'g'ri kanjisi — 執拗.",
    },
    {
      id: 508,
      section: 'knowledge',
      questionText: '彼の 卓抜した 才能と 弛まぬ 努力が（　）、今回の 歴史的 快挙が 生まれた。',
      options: ['相まって', '先立って', 'ひきかえ', 'おいて'],
      correctAnswer: 0,
      explanationUzbek:
        "'~to aimatte' (ikki ijobiy omil bir-biri bilan uyg'unlashib, kuchayib) degan N1 grammatik qoidasidir.",
    },
    {
      id: 509,
      section: 'knowledge',
      questionText: 'この 難病の 治療法を 見いだすことは、医学者（　）の 崇高な 使命だ。',
      options: ['たるもの', 'づくめ', 'まみれ', 'ずくめ'],
      correctAnswer: 0,
      explanationUzbek:
        "'~taru mono' (o'z kasbi yoki mas'uliyatli maqomiga sazovor shaxs sifatida) ma'nosini ifodalaydi.",
    },
    {
      id: 510,
      section: 'knowledge',
      questionText: '多額の 資金援助を いただいた 恩師には、感謝の（　）ございません。',
      options: ['念に堪えません', '極みで', 'きらいが', '余儀なく'],
      correctAnswer: 0,
      explanationUzbek:
        "'kansha no nen ni taemasen' (cheksiz minnatdorlik tuyg'usini bosolmayman) eng oliy darajadagi rasmiy minnatdorlik iborasidir.",
    },
    {
      id: 511,
      section: 'knowledge',
      questionText: '不祥事を 起こした 企業が、責任を 逃れようとするのは 卑劣（　）。',
      options: ['極まりない', '極まること', '極めない', '極まり得ない'],
      correctAnswer: 0,
      explanationUzbek:
        "'Na-sifat + kiwamarinai' (haddan tashqari, o'ta darajada nomaqbul) holatni ifodalaydi: hiretsu kiwamarinai.",
    },
    {
      id: 512,
      section: 'knowledge',
      questionText:
        '次の 文の（　）に 入れるのに 最も よい 言葉を 選びなさい。\n「経済指標の 改善傾向は <u>顕著</u>に 現れている。」',
      options: ['目立って', 'かすかに', '徐々に', '不自然に'],
      correctAnswer: 0,
      explanationUzbek:
        "顕著 (kencho) — 'ko'zga yaqqol tashlanadigan, sezilarli' (目立って - medatte) ma'nodoshidir.",
    },
    {
      id: 513,
      section: 'knowledge',
      questionText: '彼が これほど 責任感の 強い 人物であったとは、想像（　）しなかった。',
      options: ['だに', 'すら', 'だの', 'なり'],
      correctAnswer: 0,
      explanationUzbek:
        "'~dani shinakatta' (hatto xayolga ham keltirmagan edim, tasavvur ham qilmagan edim) ma'nosidagi adabiy N1 vositasidir.",
    },
    {
      id: 514,
      section: 'reading',
      passageText:
        '近代合理主義の進展は、自然を人間が支配・利用すべき客体として捉える二元論的世界観を定着させた。この知のパラダイムは産業革命を駆動し、物質的繁栄をもたらしたが、同時に生態系の深刻な破壊と人間自身の疎外という未曽有の危機を胚胎していた。今求められているのは、人間を自然の支配者ではなく、生命圏の不可分な一環として再定位する思想的転回である。東洋の伝統思想に見られる「天人合一」の境地は、持続可能な文明を再構築する上で、極めて示唆に富む洞察を提供している。',
      questionText: '筆者の主張の核心として最も適切なものはどれですか？',
      options: [
        '近代合理主義による産業革命の成果を全面的に放棄すべきだ',
        '自然を支配の対象とみなす思想を改め、自然と共生する世界観へ転換すべきだ',
        '東洋思想は西洋の科学技術と一切相容れないものである',
        '生態系の破壊は科学技術のさらなる進歩によってのみ解決できる',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Muallif inson tabiat ustidan hukmronlik qilishi haqidagi qarashdan voz kechib, tabiat bilan uyg'unlikdagi falsafaga o'tish lozimligini ta'kidlaydi.",
    },
    {
      id: 515,
      section: 'reading',
      passageText:
        '古典を読む意義は、単なる過去の知識の蓄積にあるのではない。同時代の価値観に無批判に同調しがちな我々の思考の偏りを、異なる時代精神の鏡に照らし出すことによって自覚化させ、相対化する点にこそある。古典との対話は、自明視されている現代の前提を疑う批判的思考の契機となるのである。',
      questionText: '筆者が考える「古典を読む最大の意義」とは何ですか？',
      options: [
        '過去の歴史的事実を暗記し、教養を高めること',
        '現代の価値観を絶対的な基準として過去の誤りを批判すること',
        '自らの時代の前提を相対化し、批判的に省察する契機を得ること',
        '古風な文体を模倣して美しい文章を書けるようになること',
      ],
      correctAnswer: 2,
      explanationUzbek:
        "Klassik asarlarni o'qish orqali zamonamiz qoliplaridan chiqib, tanqidiy fikrlash (批判的思考) imkoniyati paydo bo'ladi.",
    },
    {
      id: 516,
      section: 'reading',
      passageText:
        '科学における発見は、しばしば周到に計画された実験の論理的帰結としてではなく、予期せぬ偶然や失敗（セレンディピティ）を契機として生じる。しかし、その偶然を見過ごさず大発見へと昇華させるのは、日頃から問題意識を研ぎ澄まし、既存の常識を疑い続ける準備された知性である。パスツールの「観察の領域において、偶然は準備された精神にのみ微笑む」という言葉は、まさにこの創造的知の本質を看破している。',
      questionText:
        '偶然の発見（セレンディピティ）を生かすために最も不可欠なものは何だと述べられていますか？',
      options: [
        '最新式の高性能な実験機器と潤沢な研究資金',
        '常に問題意識を持ち常識を疑う、準備された知性',
        '偶然の失敗を完全に排除する緻密な計画性',
        '他の研究者との積極的な共同研究体制',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Tasodifiy kashfiyotlardan unumli foydalanish uchun doimo teran izlanishda bo'lgan 'tayyorlangan aql' (準備された精神) zarur.",
    },
    {
      id: 517,
      section: 'reading',
      passageText:
        'AIや自動化技術の急速な浸透は、効率性と利便性を極限まで高める一方で、人間の身体的経験や暗黙知の価値を再考させている。効率至上主義の中で「無駄」として削ぎ落とされた試行錯誤や身体的直観の中にこそ、真の独創性や人間性の根源が宿っているのではないか。技術の進化に身を委ねるだけでなく、人間固有の感性を如何にして錬磨し続けるかが、現代人に課された重い問いである。',
      questionText: '本文で筆者が問題提起している内容として最も合致するものはどれですか？',
      options: [
        'AIの発展によって効率性が高まるのは人類にとって無条件に歓迎すべきことだ',
        '効率至上主義で失われがちな身体的経験や試行錯誤にこそ人間の独創性がある',
        'あらゆる自動化技術の開発を今すぐ停止し、手作業の時代に戻るべきだ',
        '人間の直観や身体感覚は科学的に再現可能であるため重視に値しない',
      ],
      correctAnswer: 1,
      explanationUzbek:
        'Muallif AI samaradorlikni oshirgani bilan, haqiqiy insoniy ijodkorlik aynan sinov-xatolar va jismoniy tajribada yashiringanini uqtiradi.',
    },
    {
      id: 518,
      section: 'reading',
      passageText:
        '言語の豊かさは、単語数の多寡にあるのではなく、言葉の行間に滲む沈黙や余白を解釈する受容能力に依存している。日本語の和歌や俳句に見られる「余情」や「言わぬが花」の美学は、表現を極限まで切り詰めることで、受け手の想像力を極大化させる。過剰な言葉による説明は、かえって相手の主体的な思考と共感を奪うことになりかねない。',
      questionText:
        '「言わぬが花」や「余情」の美学がもたらす効果として、筆者は何を挙げていますか？',
      options: [
        '正確な情報伝達により誤解をゼロにすること',
        '表現を切り詰めることで、受け手の想像力を極大化させること',
        '会話の時間を短縮して業務を効率化すること',
        '外国語への翻訳を容易にすること',
      ],
      correctAnswer: 1,
      explanationUzbek:
        'Gapni qisqa va vazmin qilib, tinglovchining tasavvur qobiliyatini (受け手の想像力) yuksaltirish maqsad qilingan.',
    },
    {
      id: 519,
      section: 'reading',
      passageText:
        'リーダーシップの本質は、他者を力で威圧し牽引することにあるのではなく、成員一人ひとりの内発的動機付けを刺激し、潜在能力を開花させる「サーバント・リーダーシップ（奉仕型リーダーシップ）」にある。トップダウンの号令によって動かされる組織は外的な変化に脆弱であるが、自律的な個人の連携によって支えられる組織は、未曾有の危機に対しても強靭な適応力を発揮する。',
      questionText: '筆者が推奨するリーダーシップと組織のあり方はどれですか？',
      options: [
        '強力な権限を持つリーダーがトップダウンで統率する組織',
        '成員の内発的動機を引き出し、自律的な連携を促す奉仕型のリーダーシップ',
        'リーダーを置かず、全員の多数決のみで全ての意思決定を行う組織',
        '外的な変化に左右されず、過去の規則を頑なに守り抜く組織',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Muallif a'zolarning ichki ishtiyoqini uyg'otib, ularga ko'maklashuvchi 'xizmatchi yetakchilik' (サーバント・リーダーシップ) tarafdoridir.",
    },
    {
      id: 520,
      section: 'listening',
      audioUrl: '/audio/choukai/n1/n1_mock_q520.mp3',
      script:
        '大学の公開講座で教授が話しています。科学哲学においてパラダイムシフトが起こる契機とは何ですか？\n教授：既存の理論的枠組みでは到底説明のつかない「アノマリー（変則事象）」が累積し、もはや無視できないレベルに達したとき、根本的な転換が促されるのです。',
      questionText: 'パラダイムシフトが起こる根本的な契機として述べられているのはどれですか？',
      options: [
        '学会の指導者が交代したとき',
        '既存の理論で説明できない変則事象が累積したとき',
        '実験機器の予算が大幅に増額されたとき',
        '社会一般の関心が科学から離れたとき',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Professor mavjud nazariyalar tushuntirib bera olmaydigan anomaliyalar to'planib ketganda paradigma o'zgarishini aytadi.",
    },
    {
      id: 521,
      section: 'listening',
      audioUrl: '/audio/choukai/n1/n1_mock_q521.mp3',
      script:
        '国際シンポジウムで言語学者が話しています。言語の多様性を保持すべき理由は何ですか？\n言語学者：言語の消滅は、単なる語彙の喪失にとどまりません。その言語共同体が何世代にもわたって培ってきた独自の認識体系や世界観そのものが永遠に失われることを意味するからです。',
      questionText: '言語学者が言語の多様性を重要視する最大の理由は何ですか？',
      options: [
        '観光産業の発展に直結するから',
        '独自の認識体系や世界観の喪失を防ぐため',
        '外国語学習者の教材を増やすため',
        '翻訳技術の精度を測る指標になるから',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Tilning yo'qolishi shu xalqning asrlar davomida shakllangan o'ziga xos dunyoqarashi va idrok tizimining yo'qolishidir.",
    },
    {
      id: 522,
      section: 'listening',
      audioUrl: '/audio/choukai/n1/n1_mock_q522.mp3',
      script:
        '環境問題のセミナーで専門家が講演しています。\n専門家：カーボンニュートラルを実現するためには、単に再生可能エネルギーの導入比率を高めるだけでは不十分です。産業構造そのものの脱炭素化と、消費者のライフスタイルの抜本的な変革という両輪が揃って初めて、実効性のある成果が期待できるのです。',
      questionText: 'カーボンニュートラルの実現に不可欠な二つの要素は何ですか？',
      options: [
        '原子力発電の増設と海外からの電力輸入',
        '産業構造の脱炭素化と消費者のライフスタイルの変革',
        '化石燃料の価格引き上げと自動車の利用禁止',
        '先端技術の輸出制限と自然保護区の拡大',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Ekspert sanoat tuzilmasini dekarbonizatsiya qilish hamda iste'molchilar turmush tarzini tubdan o'zgartirishni zaruriy deb ta'kidlaydi.",
    },
    {
      id: 523,
      section: 'listening',
      audioUrl: '/audio/choukai/n1/n1_mock_q523.mp3',
      script:
        '経営会議で社長が新規事業の方針について説明しています。\n社長：わが社の成長戦略において、既存事業の漸進的な改善にとどまることは、実質的な後退を意味します。不確実性を恐れず、非連続なイノベーションをもたらすフロンティア領域へ、果敢に経営資源を集中投下すべきです。',
      questionText: '社長が打ち出した新規事業の基本方針はどれですか？',
      options: [
        '既存事業の改善のみに専念し、リスクを徹底的に回避する',
        '不確実性を恐れず、革新的なフロンティア領域に資源を集中投下する',
        '全事業から撤退し、他社との合併を目指す',
        '人件費を大幅に削減し、現状の利益を維持する',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Prezident noaniqlikdan cho'chimay, yangi innovatsion sohalarga resurslarni jamlashni taklif qilmoqda.",
    },
    {
      id: 524,
      section: 'listening',
      audioUrl: '/audio/choukai/n1/n1_mock_q524.mp3',
      script:
        '美術館の学芸員が特別展について解説しています。\n学芸員：今回の回顧展の眼目は、画家の代表作を年代順に並べることではなく、彼が生涯にわたってこだわり続けた「光の陰影の変遷」というテーマを軸に空間を再構成した点にあります。来館者の皆様には、光と影のダイナミズムを体感していただきたいと考えております。',
      questionText: '今回の特別展の最も大きな特徴は何ですか？',
      options: [
        '作品を制作年代順に機械的に配列したこと',
        '「光の陰影の変遷」というテーマを軸に空間を再構成したこと',
        '画家の遺品や手紙のみを展示の中心としたこと',
        '入場料を無料にして鑑賞者を増やしたこと',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Ko'rgazmaning asosiy o'ziga xosligi 'yorug'lik va soyaning o'zgarishi' mavzusi atrofida qayta tashkil etilganligidir.",
    },
    {
      id: 525,
      section: 'listening',
      audioUrl: '/audio/choukai/n1/n1_mock_q525.mp3',
      script:
        '教育フォーラムで教育評論家が話しています。\n評論家：AI時代における真の学力とは、正解の決まっている問いにいかに早く到達するかではありません。何が問題であるのかを自ら見出し、他者と対話を重ねながら新たな価値を共創していく「問いを立てる力」こそが、これからの教育に求められているのです。',
      questionText: 'これからの教育で最も求められている力は何だと述べられていますか？',
      options: [
        '既知の問題に迅速に正解を出す暗記力',
        '自ら課題を発見し共創を促す「問いを立てる力」',
        '計算ソフトを使いこなすプログラミング技能',
        '試験で高得点を取るためのテクニック',
      ],
      correctAnswer: 1,
      explanationUzbek:
        "Kelajak ta'limida muammoni mustaqil topish va yangi savollarni o'rtaga tashlash qobiliyati (問いを立てる力) talab etiladi.",
    },
  ],
};

// ==========================================
// ==========================================
// === N5 MOCK EXAM SET 2 (Supplementary) ===
// ==========================================
export const JLPT_N5_MOCK_SET_2: ExamQuestion[] = [
  {
    id: 126,
    section: 'knowledge',
    questionText: 'あしたは（雨）ですか。',
    options: ['ゆき', 'はれ', 'くもり', 'あめ'],
    correctAnswer: 3,
    explanationUzbek:
      "「雨」（yomg'ir）so'zining to'g'ri o'qilishi — あめ (ame). ゆき — qor, はれ — ochiq havo, くもり — bulutli havo.",
  },
  {
    id: 127,
    section: 'knowledge',
    questionText: 'きょうしつで（書いて）ください。',
    options: ['かいて', 'きいて', 'はいて', 'ひいて'],
    correctAnswer: 0,
    explanationUzbek:
      "「書く」（yozmoq）fe'lining te-shakli — かいて (kaite). きいて — eshitib/so'rab, はいて — kiyib/supurib, ひいて — chalib/tortib.",
  },
  {
    id: 128,
    section: 'knowledge',
    questionText: 'しゃしんは はこの（中）に あります。',
    options: ['そば', 'そと', 'なか', 'よこ'],
    correctAnswer: 2,
    explanationUzbek:
      "「中」（ichida, ichkarisida）so'zining to'g'ri o'qilishi — なか (naka). そば — yonida, そと — tashqarisida, よこ — yon tomonida.",
  },
  {
    id: 129,
    section: 'knowledge',
    questionText: 'この いすは（小さい）です。',
    options: ['ちいさい', 'ちさい', 'しいさい', 'しさい'],
    correctAnswer: 0,
    explanationUzbek:
      "「小さい」（kichkina）so'zining to'g'ri o'qilishi — ちいさい (chiisai). Cho'ziq 'ii' tovushi bilan yoziladi.",
  },
  {
    id: 130,
    section: 'knowledge',
    questionText: 'あしたは（火よう日）です。',
    options: ['どようび', 'すいようび', 'かようび', 'にちようび'],
    correctAnswer: 2,
    explanationUzbek:
      "「火曜日」（Seshanba）ning to'g'ri o'qilishi — かようび (kayoubi). どようび — Shanba, すいようび — Chorshanba, にちようび — Yakshanba.",
  },
  {
    id: 131,
    section: 'knowledge',
    questionText: 'せいとは（百人）います。',
    options: ['ひゃくにん', 'びゃくにん', 'ひゃくじん', 'びゃくじん'],
    correctAnswer: 0,
    explanationUzbek:
      "「百人」（yuz nafar kishi/o'quvchi）ning to'g'ri o'qilishi — ひゃくにん (hyakunin). Odam sanaganda 'nin' qo'shimchasi ulanadi.",
  },
  {
    id: 132,
    section: 'knowledge',
    questionText: 'わたしの くには（かわ）が おおいです。',
    options: ['花', '山', '川', '木'],
    correctAnswer: 2,
    explanationUzbek:
      "「かわ」（daryo）so'zining to'g'ri kanji yozilishi — 川 (kawa). 花 — gul, 山 — tog', 木 — daraxt.",
  },
  {
    id: 133,
    section: 'knowledge',
    questionText: 'きのうは（かいしゃ）を やすみました。',
    options: ['公仕', '公社', '会仕', '会社'],
    correctAnswer: 3,
    explanationUzbek:
      "「かいしゃ」（firma, korxona）ning to'g'ri kanji yozilishi — 会社 (kaisha). 会 (uchrashuv) + 社 (jamiyat).",
  },
  {
    id: 134,
    section: 'knowledge',
    questionText: '（　）を わすれましたから、じかんが わかりません。',
    options: ['じしょ', 'ちず', 'とけい', 'さいふ'],
    correctAnswer: 2,
    explanationUzbek:
      "Vaqtni bilish uchun 'soat' kerak bo'ladi: とけい (tokei - soat). じしょ — lug'at, ちず — xarita, さいふ — hamyon.",
  },
  {
    id: 135,
    section: 'knowledge',
    questionText: 'わたしの うちは えきに ちかいですから、（　）です。',
    options: ['べんり', 'じょうぶ', 'いっぱい', 'へた'],
    correctAnswer: 0,
    explanationUzbek:
      "Vokzalga yaqin bo'lgan uy qulay (べんり - benri) hisoblanadi. じょうぶ — baquvvat, いっぱい — to'la, へた — no'noq.",
  },
  {
    id: 136,
    section: 'knowledge',
    questionText: '田中さんは イギリス人（　）けっこんしました。',
    options: ['と', 'に', 'を', 'へ'],
    correctAnswer: 0,
    explanationUzbek:
      "Biror inson bilan turmush qurishda o'sha shaxsga 'bilan' ma'nosida 'と' yuklamasi ulanadi: イギリス人と結婚しました.",
  },
  {
    id: 137,
    section: 'knowledge',
    questionText: 'すみません、この りんごを みっつ（　）ください。',
    options: ['を', 'に', 'で', 'と'],
    correctAnswer: 0,
    explanationUzbek:
      "Ob'ektni ko'rsatib iltimos qilishda 'o' (を) keladi: りんごを 3つ ください (olmadan 3 ta bering).",
  },
  {
    id: 138,
    section: 'knowledge',
    questionText: 'きのう デパートへ シャツを かい（　）いきました。',
    options: ['に', 'で', 'を', 'へ'],
    correctAnswer: 0,
    explanationUzbek:
      "Harakat maqsadini bildirishda fe'l o'zagiga '~ni ikimasu' (qilish uchun bormoq) qo'shiladi: かいに行きました (sotib olgani bordim).",
  },
  {
    id: 139,
    section: 'reading',
    passageText:
      '【日本語学校の 図書館案内】\n図書館は 月曜日から 金曜日まで 開いています。時間は 朝9時から 夕方5時までです。土曜日と 日曜日は 休みです。本は 1回に 3さつまで、2週間 借りることができます。',
    questionText: '図書館について、正しいものは どれですか。',
    options: [
      '土曜日も 本を 借りることが できる。',
      '本は 1回に 5さつまで 借りられる。',
      '平日の 朝9時から 夕方5時まで 開いている。',
      '本は 1か月 借りることが できる。',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "E'londa ochiq aytilgan: Dushanbadan Jumagacha (hafta ichi kunlari) soat 9:00 dan 17:00 gacha kutubxona ochiq bo'ladi.",
  },
  {
    id: 140,
    section: 'reading',
    passageText:
      '田中さんへ\n昨日は 楽しい パーティーを ありがとうございました。田中さんの 作った ケーキは とても おいしかったです。写真を 5枚 メールで 送りますので、見てください。また 来週 学校で 会いましょう。\nリーより',
    questionText: 'リーさんは なぜ このメールを 書きましたか。',
    options: [
      'ケーキの 作り方を 質問するため。',
      'パーティーの お礼を 言って、写真を 送るため。',
      '来週の 約束を キャンセルするため。',
      '新しい カメラを 買ってもらうため。',
    ],
    correctAnswer: 1,
    explanationUzbek:
      'Xat kechagi shirin ziyofat va shirinlik uchun minnatdorchilik bildirish hamda suratlarni yuborish maqsadida yozilgan.',
  },
  {
    id: 141,
    section: 'reading',
    passageText:
      '【富士山 ツアーの スケジュール】\n8:00 新宿駅 西口に 集合\n8:30 バスで 出発\n11:00 富士山の 5合目に 到着、昼ご飯\n13:00〜15:00 散歩と 写真撮影\n15:30 新宿へ 戻る（18:00着予定）',
    questionText: 'ツアーの 参加者は 昼ご飯を どこで 食べますか。',
    options: ['新宿駅の レストラン', '富士山の 5合目', '出発前の バスの中', '午後3時の 新宿'],
    correctAnswer: 1,
    explanationUzbek:
      "Jadvalda aniq ko'rsatilgan: 11:00 da Fujisan 5-bosqichiga (5合目) yetib boriladi va o'sha yerda tushlik qilinadi.",
  },
  {
    id: 142,
    section: 'reading',
    passageText:
      '私は 毎朝 6時に 起きます。シャワーを 浴びてから、パンと 卵を 食べて、コーヒーを 飲みます。それから、7時半に うちを 出て、電車で 会社へ 行きます。会社は 8時45分に 始まります。家から 会社まで 1時間くらい かかります。',
    questionText: 'この人は 朝 何時に うちを 出ますか。',
    options: ['6時', '7時半', '8時', '8時45分'],
    correctAnswer: 1,
    explanationUzbek:
      "Matnda aniq keltirilgan: '7時半に うちを 出て' (soat 7:30 da uydan chiqib ketadi).",
  },
  {
    id: 143,
    section: 'reading',
    passageText:
      '【さくらクリニック 診療時間】\n月〜金：午前 9:00〜12:30 / 午後 14:30〜18:00\n土曜日：午前 9:00〜13:00（午後休診）\n日曜・祝日：休診\n※初めての 方は 保険証（ほけんしょう）を お持ちください。',
    questionText: '土曜日の 午後2時に クリニックへ 行くと どうなりますか。',
    options: [
      '診察を 受けることが できる。',
      '薬だけ もらえる。',
      '休みなので 診察は 受けられない。',
      '保険証が あれば 見てもらえる。',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Shanba kuni faqat 13:00 gacha ishlaydi, tushdan keyin '午後休診' (dam olish) bo'lgani sababli ko'rikdan o'tib bo'lmaydi.",
  },
  {
    id: 144,
    section: 'reading',
    passageText:
      '【買い物の メモ】\n牛乳 2本、りんご 4個、パン 1斤（きん）。\n※スーパーで 牛乳が 売り切れの ときは、近くの コンビニで 買ってきてください。卵は まだ 冷蔵庫に 6個 あるので、買わなくて いいです。',
    questionText: '買わなくても いいものは どれですか。',
    options: ['牛乳', 'りんご', 'パン', '卵'],
    correctAnswer: 3,
    explanationUzbek:
      "Eslatmada aniq yozilgan: '卵は まだ 冷蔵庫に 6個 あるので、買わなくて いいです' (tuxum muzlatgichda bor, sotib olish shart emas).",
  },
  {
    id: 145,
    section: 'listening',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_005.mp3',
    script:
      '男の人と 女の人が 話しています。男の人は 何を 飲みますか？\n女：いらっしゃい。お茶と コーヒーと ジュースが あるけど、何がいい？\n男：じゃあ、冷たい ジュースを ください。\n女：はい、どうぞ。',
    questionText: '男の人は 何を 飲みますか？',
    options: ['お茶', 'コーヒー', '冷たいジュース', '水'],
    correctAnswer: 2,
    explanationUzbek:
      "Mehmon tavsiya etilgan ichimliklar orasidan sovuq sharbatni tanladi: '冷たい ジュースを ください'.",
  },
  {
    id: 146,
    section: 'listening',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_006.mp3',
    script:
      '教室で 先生が 話しています。学生は 明日 何を 持ってきますか？\n先生：みなさん、明日は 日本料理の 実習です。エプロンと 三角巾（さんかくきん）を 忘れずに 持ってきてください。包丁や お皿は 学校のものを 使いますから、持ってこなくて いいです。\n学生：はい、わかりました。',
    questionText: '学生が 明日 持ってくるものは どれですか？',
    options: ['エプロンと三角巾', '包丁とお皿', '教科書とノート', 'お弁当'],
    correctAnswer: 0,
    explanationUzbek:
      "O'qituvchi talabalarga oshxona fartugi va ro'molcha (エプロンと三角巾) olib kelishni tayinladi.",
  },
  {
    id: 147,
    section: 'listening',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_007.mp3',
    script:
      '店で 男の人と 店員が 話しています。男の人は 全部で いくら 払いますか？\n男：この りんごを 2個と、バナナを 1房（ふさ）ください。\n店員：はい。りんごは 1個 100円、バナナは 200円です。合わせて 400円になります。\n男：はい、500円で お願いします。',
    questionText: '男の人は 全部で いくら 払いますか？',
    options: ['300円', '400円', '500円', '600円'],
    correctAnswer: 1,
    explanationUzbek:
      "2 ta olma (200 yen) va 1 bog' banan (200 yen) jami 400 yen bo'ladi: '合わせて 400円になります'.",
  },
  {
    id: 148,
    section: 'listening',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_008.mp3',
    script:
      '駅で 女の人と 駅員が 話しています。女の人は 何番線の 電車に 乗りますか？\n女：すみません。東京駅へ 行きたいんですが、どの電車ですか？\n駅員：東京駅ですね。あちらの 2番線の 電車に 乗ってください。1番線は 横浜方面行きです。\n女：2番線ですね。ありがとうございます。',
    questionText: '女の人は 何番線の 電車に 乗りますか？',
    options: ['1番線', '2番線', '3番線', '4番線'],
    correctAnswer: 1,
    explanationUzbek:
      "Bekat xodimi Tokyo vokzaliga borish uchun 2-yo'ldagi poyezdga chiqishni aytdi: '2番線の 電車に 乗ってください'.",
  },
  {
    id: 149,
    section: 'listening',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_009.mp3',
    script:
      '電話で 男の人と 女の人が 話しています。二人は 何時に 会いますか？\n男：もしもし、明日の 映画だけど、何時に 会おうか？\n女：映画は 2時に 始まるから、その30分前に 会わない？\n男：うん、じゃあ 1時半に 駅の 改札口で 会おう。',
    questionText: '二人は 何時に 会いますか？',
    options: ['1時', '1時半', '2時', '2時半'],
    correctAnswer: 1,
    explanationUzbek:
      'Kino 14:00 da boshlanadi, ular 30 daqiqa oldin — soat 1:30 da (1時半) uchrashishga kelishdilar.',
  },
  {
    id: 150,
    section: 'listening',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_010.mp3',
    script:
      '病院の 受付で 男の人が 話しています。男の人は 次に どこへ 行きますか？\n受付：田中さん、診察券を お返しします。2階の 3番の 部屋の前で お待ちください。\n男：2階の 3番ですね。わかりました。',
    questionText: '男の人は 次に どこへ 行きますか？',
    options: ['1階の薬局', '2階の3番の部屋の前', '会計の窓口', '外のタクシー乗り場'],
    correctAnswer: 1,
    explanationUzbek:
      "Qabulxona xodimi 2-qavatdagi 3-xona oldida kutishni aytdi: '2階の 3番の 部屋の前で お待ちください'.",
  },
];

// === N4 MOCK EXAM SET 2 (Supplementary) ===
// ==========================================
export const JLPT_N4_MOCK_SET_2: ExamQuestion[] = [
  {
    id: 226,
    section: 'knowledge',
    questionText: 'この町の（人口）は どのぐらいですか。',
    options: ['にんこう', 'ひとくち', 'じんこう', 'いりぐち'],
    correctAnswer: 2,
    explanationUzbek:
      "「人口」（aholi, odam soni）so'zining to'g'ri o'qilishi — じんこう (jinkou). 「人」bu yerda on'yomi 'jin' deb o'qiladi.",
  },
  {
    id: 227,
    section: 'knowledge',
    questionText: '部屋が 暑いですね。エアコンを（　）。',
    options: ['つけましょう', 'あけましょう', 'おしましょう', 'ひらきましょう'],
    correctAnswer: 0,
    explanationUzbek:
      'Konditsioner yoki elektr jihozlarini yoqish — 「つける」(tsukeru). Taklif shaklida: つけましょう (yoqaylik).',
  },
  {
    id: 228,
    section: 'knowledge',
    questionText: '黒いペン（　）名前を 書いてください。',
    options: ['で', 'を', 'に', 'が'],
    correctAnswer: 0,
    explanationUzbek:
      "Harakatni bajarish vositasi yoki qurolini ifodalashda 'で' (de) yuklamasi qo'yiladi: 黒いペンで (qora ruchka bilan).",
  },
  {
    id: 229,
    section: 'knowledge',
    questionText: 'この カメラの（使い方）を 教えてください。',
    options: ['つかいかた', 'つかいほう', 'しよおかた', 'つかいがた'],
    correctAnswer: 0,
    explanationUzbek:
      "Fe'l ます-asosi + 方 (かた) birikmasi qilish usulini bildiradi: 使い方 — つかいかた (ishlatish usuli).",
  },
  {
    id: 230,
    section: 'knowledge',
    questionText: '道が 複雑ですから、（　）地図を 見てください。',
    options: ['よく', 'ずっと', '急に', '大体'],
    correctAnswer: 0,
    explanationUzbek:
      "Yo'l chigal bo'lgani sababli xaritani 'diqqat bilan, yaxshilab' qarash so'ralyapti: 「よく」(yaxshilab).",
  },
  {
    id: 231,
    section: 'knowledge',
    questionText: '田中さんは 今、（会議中）です。',
    options: ['かいぎちゅう', 'あいぎなか', 'かいぎじゅう', 'えいぎちゅう'],
    correctAnswer: 0,
    explanationUzbek:
      'Biror harakat davom etayotgan paytda Ot + 中 (ちゅう) birikmasi keladi: 会議中 — かいぎちゅう (majlisda / majlis davomida).',
  },
  {
    id: 232,
    section: 'knowledge',
    questionText: 'この お茶は 熱すぎて、（　）にくいです。',
    options: ['飲み', '飲んで', '飲む', '飲ま'],
    correctAnswer: 0,
    explanationUzbek:
      "Biror ishni bajarish qiyinligini ifodalovchi '~nikui' qo'shimchasi fe'lning ます-asosi bilan keladi: 飲み + にくい = 飲みにくい (ichish qiyin).",
  },
  {
    id: 233,
    section: 'knowledge',
    questionText: 'レポートを 書いた（　）、先生に 見せます。',
    options: ['あとで', 'まえに', 'ながら', 'あいだ'],
    correctAnswer: 0,
    explanationUzbek:
      "Harakat sodir bo'lgandan keyingi ketma-ketlik: Fe'l た-shakli + あとで (...gandan keyin): 書いたあとで (yozgandan keyin).",
  },
  {
    id: 234,
    section: 'knowledge',
    questionText: 'あしたは 雨が 降る（　）。傘を 持って行きましょう。',
    options: ['かもしれません', 'つもりです', 'はずです', '予定です'],
    correctAnswer: 0,
    explanationUzbek:
      "Ob-havo kabi ehtimoliy taxminlarda '~kamoshiremasen' (ehtimol, bo'lsa kerak) qo'llanadi. 'Tsumori' faqat insonning shaxsiy niyatiga ishlatiladi.",
  },
  {
    id: 235,
    section: 'knowledge',
    questionText: '駅前の レストランは 安い（　）、とても おいしいです。',
    options: ['し', 'が', 'のに', 'けど'],
    correctAnswer: 0,
    explanationUzbek:
      "Bir necha ijobiy sifatlarni yoki sabablarni sanab o'tishda '~shi' (ham, ustiga-ustak) grammatikasi ishlatiladi: 安いし、おいしいです.",
  },
  {
    id: 236,
    section: 'knowledge',
    questionText: '先生、この 書類を（　）いただけませんか。',
    options: ['見て', '見せて', '見られて', '見させて'],
    correctAnswer: 0,
    explanationUzbek:
      "Boshqalardan muloyim iltimos qilishda: Fe'l て-shakli + いただけませんか qo'llanadi: 見ていただけませんか (ko'rib bera olmaysizmi?).",
  },
  {
    id: 237,
    section: 'knowledge',
    questionText: '壁に カレンダーが（　）あります。',
    options: ['掛けて', '掛かって', '掛けた', '掛かる'],
    correctAnswer: 0,
    explanationUzbek:
      "Bajarilgan ish natijasining saqlanishi: Ot + が + o'timli fe'l (tadoushi) て-shakli + あります. 掛ける (kakemasu - osmoq) -> 掛けてあります.",
  },
  {
    id: 238,
    section: 'knowledge',
    questionText: '日本へ（　）なら、新幹線に 乗ったほうが いいですよ。',
    options: ['行く', '行って', '行った', '行かない'],
    correctAnswer: 0,
    explanationUzbek:
      "Hali sodir bo'lmagan voqea yuzasidan maslahat berganda: Lug'at shakli + なら ishlatiladi: 行くなら (agar boradigan bo'lsangiz).",
  },
  {
    id: 239,
    section: 'reading',
    passageText:
      '【図書館からのお知らせ】\n今週の土曜日は館内の整理のため、休館いたします。本を返却される方は、入口の「返却ポスト」をご利用ください。ただし、DVDやCDなどの壊れやすい物はポストに入れず、月曜日以降に直接カウンターまでお持ちください。',
    questionText: '土曜日に DVDを 返したい人は どうしなければなりませんか。',
    options: [
      '返却ポストに入れます。',
      '月曜日以降にカウンターへ直接持って行きます。',
      '土曜日の朝、電話をします。',
      '来週の土曜日まで待ちます。',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Matnda aniq aytilgan: DVD va CD kabi sinuvchan buyumlarni qutiga solmasdan, dushanba kunidan boshlab to'g'ridan-to'g'ri qabulxona peshtaxtasiga (counter) olib kelish shart.",
  },
  {
    id: 240,
    section: 'reading',
    passageText:
      '【留学生交流会のご案内】\n日時：10月15日（日）14:00〜16:00\n場所：国際交流センター 3階 ホール\n参加費：無料（お菓子と飲み物が出ます）\n申し込み：10月10日（火）までに事務室の鈴木さんにメールで申し込んでください。定員は先着30名です。',
    questionText: 'この 交流会に 参加したい人は いつまでに 何をしなければなりませんか。',
    options: [
      '10月15日までに参加費を払います。',
      '10月10日までに鈴木さんにメールで申し込みます。',
      '10月10日までに国際交流センターへ行きます。',
      '10月15日の14時に直接ホールへ行きます。',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "E'londa yozilgan: 10-oktabrgacha (seshanba) xizmatchi Suzuki xonimga elektron pochta (mail) orqali ariza topshirish kerak.",
  },
  {
    id: 241,
    section: 'reading',
    passageText:
      '私は 先週の 日曜日に 新しい アパートへ 引っ越しを しました。前の アパートは 駅から 歩いて 25分も かかりましたが、今度の アパートは 歩いて 5分ですから、とても 便利です。部屋も 広くて 日当たりも いいですが、近くに 電車が 通るため、少し 音が 気になります。',
    questionText: '新しい アパートについて、正しくないものは どれですか。',
    options: [
      '駅から歩いて5分で便利です。',
      '部屋が広くて日当たりがいいです。',
      '電車の音が少し気になります。',
      '家賃が前の部屋より安いです。',
    ],
    correctAnswer: 3,
    explanationUzbek:
      "Matnda ijara haqi (yachin / 家賃) haqida umuman gapirilmagan. Qolgan uchta ma'lumot (bekatga yaqinligi, yorug'ligi, poyezd shovqini) matnda keltirilgan.",
  },
  {
    id: 242,
    section: 'reading',
    passageText:
      'スミスさんは 日本へ 来てから、毎朝 ジョギングを しています。最初は 1キロ 走るのも 大変でしたが、最近は 5キロ 走れるように なりました。体を 動かすと 気分が すっきりして、勉強にも 集中できます。',
    questionText: 'スミスさんの 最近の 様子について、合っているものは どれですか。',
    options: [
      '今は5キロ走れるようになりました。',
      '毎朝ジョギングをするのが大変でやめました。',
      '日本に来る前も毎日5キロ走っていました。',
      '走ると疲れて勉強に集中できません。',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Matnda aytilgan: '最近は 5キロ 走れるように なりました' (so'nggi paytlarda 5 kilometr yugura oladigan bo'ldi).",
  },
  {
    id: 243,
    section: 'reading',
    passageText:
      '【ゴミの出し方の注意】\n・燃えるゴミ：火曜日と金曜日の朝8時までに出してください。\n・燃えないゴミ（ビン、缶）：水曜日の朝8時までに出してください。\n※透明の指定袋に入れて、ネットを必ず掛けてください。指定袋以外で出されたゴミは回収しません。',
    questionText: '缶や ビンは 何曜日の 何時までに 出しますか。',
    options: ['火曜日の朝8時まで', '水曜日の朝8時まで', '金曜日の朝8時まで', '水曜日の夜8時まで'],
    correctAnswer: 1,
    explanationUzbek:
      "Matndagi qoidaga ko'ra: Yonmaydigan chiqindi (shisha va bankalar - bin, kan) chorshanba kuni ertalab soat 8:00 gacha chiqariladi.",
  },
  {
    id: 244,
    section: 'reading',
    passageText:
      '日本人の 友達から 結婚式の 招待状を もらいました。出席する 場合は「出席」の 文字を 〇で 囲んで、返信ハガキを 送ります。その時、「御出席」の「御」の 字を 二本線で 消すのが 日本の マナーだと 友達に 教えてもらいました。',
    questionText: '返信ハガキを 送る時、どうしますか。',
    options: [
      '「御出席」をそのまま丸で囲みます。',
      '「御」を二本線で消して、「出席」を丸で囲みます。',
      '新しいハガキを買って送ります。',
      '何も書かずにそのまま送ります。',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Yapon madaniyatida taklifnomaga javob yozganda hurmat prefiksi bo'lgan '御' (Go) belgisi ikkita chiziq bilan o'chirilib, '出席' (ishtirok etaman) aylanaga olinadi.",
  },
  {
    id: 245,
    section: 'listening',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_005.mp3',
    script:
      '会社で 男の人と 女の人が 話しています。女の人は これから どこへ 行きますか？\n男：佐藤さん、さっきの会議の資料、部長に渡してくれた？\n女：あ、すみません。まだです。今から部長室へ持って行きます。\n男：あ、部長はさっきお客様と1階のロビーに行かれたよ。\n女：そうですか。じゃあ、ロビーへ行って渡してきます。',
    questionText: '女の人は これから どこへ 行きますか？',
    options: ['部長室', '1階のロビー', '会議室', '自分の席'],
    correctAnswer: 1,
    explanationUzbek:
      "Direktor hozir 1-qavat kutish zalida (lobby) mehmon bilan birga bo'lgani uchun ayol xodim o'sha yerga borishini aytadi: 'ロビーへ行って渡してきます'.",
  },
  {
    id: 246,
    section: 'listening',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_006.mp3',
    script:
      '大学で 先生が 学生に 話しています。学生は 明日 何時に どこに 集まりますか？\n先生：明日の見学旅行について連絡します。バスは朝9時に出発します。遅れないように、8時45分までに駅の東口に集まってください。西口ではありませんから、間違えないでくださいね。\n学生：はい、わかりました。',
    questionText: '学生は 明日 何時に どこに 集まりますか？',
    options: ['8時45分に駅の東口', '8時45分に駅の西口', '9時に駅の東口', '9時に駅の西口'],
    correctAnswer: 0,
    explanationUzbek:
      "O'qituvchi aytadi: '8時45分までに駅の東口に集まってください' (soat 8:45 gacha vokzalning sharqiy chiqishida to'planish kerak).",
  },
  {
    id: 247,
    section: 'listening',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_007.mp3',
    script:
      '店で 男の人と 店員が 話しています。男の人は どのシャツを 買いますか？\n男：すみません。この青いシャツのMサイズはありますか？\n店員：申し訳ありません。青のMサイズは売り切れで、白と黒ならございますが。\n男：そうですか。仕事で使いたいので、白のMサイズをお願いします。',
    questionText: '男の人は どの シャツを 買いますか？',
    options: ['青のMサイズ', '白のMサイズ', '黒のMサイズ', '白のLサイズ'],
    correctAnswer: 1,
    explanationUzbek:
      "Moviy rang tugagan bo'lgani uchun xaridor ishda kiyish maqsadida oq rangdagi M o'lchamli ko'ylakni tanlaydi.",
  },
  {
    id: 248,
    section: 'listening',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_008.mp3',
    script:
      '病院で 医者と 男の人が 話しています。男の人は 薬を いつ 飲みますか？\n医者：この薬は1日3回、必ずご飯を食べたあとに飲んでください。食前に飲むと胃が痛くなりますからね。\n男：わかりました。毎食後ですね。',
    questionText: '男の人は 薬を いつ 飲みますか？',
    options: ['ご飯を食べる前', 'ご飯を食べたあと', '寝る前', '朝起きたとき'],
    correctAnswer: 1,
    explanationUzbek:
      "Shifokor ta'kidlaydi: '必ずご飯を食べたあとに飲んでください' (albatta ovqatdan keyin iching).",
  },
  {
    id: 249,
    section: 'listening',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_009.mp3',
    script:
      '留学生の 男の人と 女の人が 話しています。男の人は 日本の 生活で 何が 一番 困っていますか？\n女：日本に来て3か月だけど、生活には慣れた？\n男：うん、物価が高いのはちょっと大変だけど、一番困っているのはゴミの分別ルールなんだ。曜日によって出すものが違うから、まだよく覚えられないんだよ。\n女：あー、日本のゴミ出しは確かに複雑だよね。',
    questionText: '男の人は 日本の 生活で 何が 一番 困っていますか？',
    options: ['物価が高いこと', '日本語が通じないこと', 'ゴミの分別ルール', '電車の乗り方'],
    correctAnswer: 2,
    explanationUzbek:
      "Erkak kishi aniq aytadi: '一番困っているのはゴミの分別ルールなんだ' (eng qiynayotgan narsa — chiqindilarni saralash qoidalari).",
  },
  {
    id: 250,
    section: 'listening',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_010.mp3',
    script:
      '駅で 女の人と 駅員が 話しています。女の人は 何番線の 電車に 乗りますか？\n女：すみません。空港へ行きたいんですが、どの電車に乗ればいいですか？\n駅員：空港行きですね。3番線の快速電車に乗ってください。4番線の普通電車でも行けますが、3番線のほうが20分早く着きますよ。\n女：わかりました。3番線ですね。ありがとうございます。',
    questionText: '女の人は 何番線の 電車に 乗りますか？',
    options: ['1番線', '2番線', '3番線', '4番線'],
    correctAnswer: 2,
    explanationUzbek:
      "Bekat xodimi 20 daqiqa tezroq yetib borishi uchun 3-yo'ldagi tezkor poyezdga chiqishni tavsiya qiladi: '3番線の快速電車に乗ってください'.",
  },
];

// ==========================================
// === N3 MOCK EXAM SET 2 (Supplementary) ===
// ==========================================
export const JLPT_N3_MOCK_SET_2: ExamQuestion[] = [
  {
    id: 326,
    section: 'knowledge',
    questionText: '郵便局の 近くに （引っ越した）ので 便利です。',
    options: ['ひっこした', 'うつった', 'とおった', 'わたった'],
    correctAnswer: 0,
    explanationUzbek:
      "「引っ越す」（ko'chib o'tmoq）ning to'g'ri o'qilishi — ひっこす (hikkosu). O'tgan zamonda: 引っ越した (hikkoshita).",
  },
  {
    id: 327,
    section: 'knowledge',
    questionText: '荷物が 届きましたが、それは 私が 頼んだのと（　）。',
    options: ['ちがかったです', 'まちがったです', 'ちがっていました', 'まちがえていました'],
    correctAnswer: 2,
    explanationUzbek:
      "Narsa kutilganidan yoki buyurtma qilinganidan 'boshqacha bo'lmoq' fe'li — 「違う」(chigau). To'g'ri davomiy o'tgan shakli: 違っていました (chigatte imashita).",
  },
  {
    id: 328,
    section: 'knowledge',
    questionText: '子供の ころ、よく この 公園で 遊んだ（　）。',
    options: ['ことか', 'ことだ', 'ものか', 'ものだ'],
    correctAnswer: 3,
    explanationUzbek:
      "O'tmishdagi doimiy odat yoki xotiralarni eslashda fe'lning oddiy o'tgan zamoniga 「〜たものだ」 qo'shiladi (bolaligimda bu bog'da ko'p o'ynardim).",
  },
  {
    id: 329,
    section: 'knowledge',
    questionText: '新しい 計画について （反対）する 意見が 出ました。',
    options: ['さんせい', 'はんたい', 'きそく', 'しょうにん'],
    correctAnswer: 1,
    explanationUzbek:
      "「反対」（qarshilik, qarshi bo'lish）so'zining to'g'ri o'qilishi — はんたい (hantai).",
  },
  {
    id: 330,
    section: 'knowledge',
    questionText: '彼は いつも （真面目）に 仕事に 取り組んでいる。',
    options: ['しんけん', 'まじめ', 'ねっしん', 'ていねい'],
    correctAnswer: 1,
    explanationUzbek:
      "「真面目」（jiddiy, vijdonan ishlaydigan）so'zining to'g'ri o'qilishi — まじめ (majime).",
  },
  {
    id: 331,
    section: 'knowledge',
    questionText: '明日の 試験が 心配で、昨夜は なかなか（　）。',
    options: ['眠れなかった', '起きなかった', '休まなかった', '座れなかった'],
    correctAnswer: 0,
    explanationUzbek:
      "Xavotir sababli uxlay olmaslik — 「眠れなかった」(nemurenakatta). 'Nakanaka' inkor fe'l bilan kelib 'hech uxlay olmadim' ma'nosini beradi.",
  },
  {
    id: 332,
    section: 'knowledge',
    questionText: '会議の （準備）が すべて 整いました。',
    options: ['じゅんび', 'せつび', 'よてい', 'けいかく'],
    correctAnswer: 0,
    explanationUzbek:
      "「準備」（tayyorgarlik, hozirlik）so'zining to'g'ri o'qilishi — じゅんび (junbi).",
  },
  {
    id: 333,
    section: 'knowledge',
    questionText: '雨が 降らない（　）、急いで 買い物に 行ってきましょう。',
    options: ['あいだに', 'うちに', 'までに', 'とおりに'],
    correctAnswer: 1,
    explanationUzbek:
      "Holat o'zgarishidan oldin biror ishni bajarib olish grammatikasi: 「〜ないうちに」(yomg'ir yog'masdan turib / fursat borida).",
  },
  {
    id: 334,
    section: 'knowledge',
    questionText: 'どんなに 失敗しても、最後まで 諦めない（　）。',
    options: ['わけだ', 'はずだ', 'つもりだ', 'べきだ'],
    correctAnswer: 2,
    explanationUzbek:
      "O'zining qat'iy niyatini ifodalashda fe'lning oddiy shakliga 「つもりだ」(taslim bo'lmaslik niyatidaman) qo'shiladi.",
  },
  {
    id: 335,
    section: 'knowledge',
    questionText: 'この 部屋は 南向きで （日当たり）が とても いいです。',
    options: ['ひあたり', 'ひざし', 'にっこう', 'ひるま'],
    correctAnswer: 0,
    explanationUzbek:
      "「日当たり」（quyosh tushishi, yorug'lik tushishi）so'zining to'g'ri o'qilishi — ひあたり (hiatari).",
  },
  {
    id: 336,
    section: 'knowledge',
    questionText: '先輩に アドバイスを （　）おかげで、問題が 解決しました。',
    options: ['さしあげた', 'いただいた', 'くださった', 'やり直した'],
    correctAnswer: 1,
    explanationUzbek:
      "Katta yoshli yoki tajribali odamdan (senpaidan) maslahat qabul qilib olganda kamtarlik fe'li — 「いただく」(itadaku) ishlatiladi.",
  },
  {
    id: 337,
    section: 'knowledge',
    questionText: 'あんなに 優しい 彼が、そんな ひどい 嘘を つく（　）。',
    options: ['はずがない', 'わけではない', 'に違いない', 'にすぎない'],
    correctAnswer: 0,
    explanationUzbek:
      "Mantiqan mutlaqo imkonsiz narsani inkor qilishda: 「〜はずがない」(bo'lishi aslo mumkin emas, yolg'on gapirishi mumkin emas).",
  },
  {
    id: 338,
    section: 'knowledge',
    questionText: '日本での 留学生活は 毎日が とても（充実）しています。',
    options: ['まんぞく', 'じゅうじつ', 'けんこう', 'たいへん'],
    correctAnswer: 1,
    explanationUzbek:
      "「充実」（mazmunli, to'laqonli o'tish）so'zining to'g'ri o'qilishi — じゅうじつ (juujitsu).",
  },
  {
    id: 339,
    section: 'reading',
    passageText:
      '【企画会議 日程変更のお知らせ】\n来週火曜日（10月15日）14:00から予定しておりました「新商品企画会議」ですが、担当役員の出張日程変更に伴い、同日の16:00開始に変更いたします。場所は第2会議室から大会議室へと変更になりますのでご注意ください。配布資料は前日までにメールでお送りします。',
    questionText: '変更後の 会議について、正しいものは どれですか。',
    options: [
      '火曜日の14:00から第2会議室で行われる。',
      '火曜日の16:00から大会議室で行われる。',
      '水曜日の16:00に延期された。',
      '資料は会議の当日に紙で配布される。',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Xabarnomada aniq yozilgan: Soat 16:00 ga ko'chirildi va xona '大会議室' (katta majlislar zali) ga o'zgardi.",
  },
  {
    id: 340,
    section: 'reading',
    passageText:
      '最近、電子書籍を利用する人が増えています。紙の本に比べて持ち運びが便利で、いつでもどこでも読めるという利点があります。しかし一方で、紙のページのめくる感覚や、手元に本として残る実感を好む読者も依然として多く存在します。用途や気分によって両方を使い分けるのが現代の賢い読書スタイルと言えるでしょう。',
    questionText: '筆者が 述べている 現代の 読書スタイルとは どのようなものですか。',
    options: [
      '紙の本をすべて捨てて、電子書籍だけに統一すること。',
      '電子書籍は読みにくいので、紙の本だけを読むこと。',
      '状況や気分に合わせて、電子書籍と紙の本の両方を使い分けること。',
      '読書をやめてオーディオブックだけを利用すること。',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Muallif oxirgi jumlada ta'kidlaydi: '用途や気分によって両方を使い分ける' (vaziyat va kayfiyatga qarab ikkalasidan ham unumli foydalanish).",
  },
  {
    id: 341,
    section: 'reading',
    passageText:
      '【留学生向け ゴミ分別ルールの確認】\nこの地域では、資源ゴミの回収日が品目ごとに異なります。ペットボトルはキャップとラベルをはがして水洗いし、火曜日に出してください。ビンと缶はつぶさずに水曜日に出します。ダンボールなどの古紙はひもで十字に縛って木曜日に出してください。ルールが守られていないゴミは回収されません。',
    questionText: 'ペットボトルを ゴミに 出すときの 正しい 手順は どれですか。',
    options: [
      'そのまま火曜日に出す。',
      'キャップとラベルをはがして水で洗い、火曜日に出す。',
      '足で平らにつぶして水曜日に出す。',
      'ひもで十字に縛って木曜日に出す。',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Qoidada yozilgan: 'キャップとラベルをはがして水洗いし、火曜日に出してください' (qopqoq va etiketkasini yulib, chayqab, seshanba kuni chiqariladi).",
  },
  {
    id: 342,
    section: 'reading',
    passageText:
      '言葉というものは、時代とともに変化していきます。かつては若者言葉として使われていた表現が、数十年後には辞書に掲載され、一般的な言葉として定着することも珍しくありません。言葉の乱れを批判する声もありますが、言語が生きている限り、時代の要求に応じて変化し続けるのは自然な現象なのです。',
    questionText: '言葉の 変化について、筆者は どのように 考えていますか。',
    options: [
      '若者言葉はすべて禁止すべきである。',
      '昔の正しい日本語だけを守り続けるべきである。',
      '言語が生きている限り、時代とともに変化するのは自然なことである。',
      '辞書に載っていない言葉を使ってはならない。',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Muallif fikricha: '言語が生きている限り、時代の要求に応じて変化し続けるのは自然な現象なのです' (til tirik ekan, davr bilan birga o'zgarishi tabiiy hodisadir).",
  },
  {
    id: 343,
    section: 'reading',
    passageText:
      '【アパート水道管 定期点検のお知らせ】\n日時：11月20日（水）午前10:00〜午後12:00\n点検中は全館断水となりますので、トイレや台所の水はご使用になれません。また、作業終了直後は一時的に赤い水や濁った水が出ることがありますので、1分ほど水を流してからご使用ください。ご不便をおかけしますが、ご協力をお願い申し上げます。',
    questionText: '点検が 終わったあと、水を 使うときは どうすれば いいですか。',
    options: [
      'すぐにそのまま飲んでも構わない。',
      '1分ほど水を流してから使用する。',
      'お湯だけを使うようにする。',
      '翌日まで水を使ってはいけない。',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "E'londa aytilgan: '1分ほど水を流してからご使用ください' (suv quvurlari tozalanishi uchun 1 daqiqacha oqizib yuborib keyin ishlatish kerak).",
  },
  {
    id: 344,
    section: 'reading',
    passageText:
      '私は毎晩、寝る前の10分間に日記を書いています。その日にあった出来事だけでなく、自分がどう感じたかを短い文章で記録するのです。嬉しいことも嫌だったことも文字にすることで頭の中が整理され、翌朝を前向きな気持ちで迎えることができます。忙しい現代人にとって、自分と静かに向き合う貴重な時間です。',
    questionText: '日記を 書くことの 効果として、筆者が 挙げているものは どれですか。',
    options: [
      '日本語の漢字の書き順が上達すること。',
      '気持ちや思考が整理されて、前向きに新しい一日を迎えられること。',
      '過去の出来事を他人に自慢できるようになること。',
      '睡眠時間が短くても疲れなくなること。',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Muallif: '文字にすることで頭の中が整理され、翌朝を前向きな気持ちで迎えることができます' deb yozgan (fikrlar tartiblanib, yangi kunga ijobiy kayfiyatda kirishadi).",
  },
  {
    id: 345,
    section: 'listening',
    audioUrl: '/audio/choukai/n3/05 Track 5.mp3',
    script:
      '会社で男性社員と女性上司が話しています。男性社員はまず何をしなければなりませんか？\n男：課長、明日のプレゼン資料の印刷と、取引先への確認メールの送信ですが、どちらを先に進めましょうか？\n女：あ、取引先の山田部長が今日午後から外出されるそうだから、先に確認メールを送っておいて。印刷は夕方で十分間に合うから。\n男：承知いたしました。すぐにメールを作成します。',
    questionText: '男性社員は まず 何を しますか？',
    options: [
      'プレゼン資料を印刷する',
      '取引先に確認メールを送る',
      '会議室の予約をする',
      '外出の準備をする',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Boshliq xaridori tushdan keyin safarga ketishi sababli avval tasdiqlovchi xatni yuborishni buyuradi: '先に確認メールを送っておいて'.",
  },
  {
    id: 346,
    section: 'listening',
    audioUrl: '/audio/choukai/n3/06 Track 6.mp3',
    script:
      '駅で外国人観光客と案内係が話しています。観光客は何番線の電車に乗りますか？\n観光客：すみません、成田空港へ行く特急に乗りたいのですが、どこへ行けばいいですか？\n案内係：成田空港行きの特急「成田エクスプレス」ですね。地下2階の5番線ホームへお進みください。4番線は普通電車ですのでお乗り間違えのないようにお願いします。\n観光客：地下2階の5番線ですね。ありがとうございます。',
    questionText: '観光客は 何番線の 電車に 乗りますか？',
    options: ['1番線', '3番線', '4番線', '5番線'],
    correctAnswer: 3,
    explanationUzbek:
      "Yo'riqchi aniq tushuntiradi: Narita Express tezyurar poyezdi yerosti 2-qavatdagi 5-yo'ldan jo'naydi ('5番線ホームへお進みください').",
  },
  {
    id: 347,
    section: 'listening',
    audioUrl: '/audio/choukai/n3/07 Track 7.mp3',
    script:
      '大学で学生二人が話しています。午後の日本文学の講義はどこで行われますか？\n男：佐藤さん、今日の3限の「日本文学」の授業、教室が変更になったの知ってる？\n女：え、本当？いつもの3号館の201教室じゃないの？\n男：プロジェクターの故障で、5号館の105教室に変更になったって掲示板に出てたよ。\n女：教えてくれてありがとう！危うく間違えるところだった。',
    questionText: '午後の 日本文学の 講義は どこで 行われますか？',
    options: ['3号館の201教室', '3号館の105教室', '5号館の201教室', '5号館の105教室'],
    correctAnswer: 3,
    explanationUzbek:
      "Proyektor buzilganligi sababli dars 5-bino 105-auditoriyaga ko'chirilgan ('5号館の105教室に変更になった').",
  },
  {
    id: 348,
    section: 'listening',
    audioUrl: '/audio/choukai/n3/08 Track 8.mp3',
    script:
      '靴屋で客と店員が話しています。客はどの靴を買うことにしましたか？\n客：すみません、この黒のウォーキングシューズ、26.5センチはありますか？\n店員：申し訳ございません。黒の26.5はちょうど在庫切れでして。同じデザインの紺色か茶色ならご用意できますが。\n客：うーん、仕事でも履きたいので茶色にしてみようかな。サイズを試してもいいですか？\n店員：かしこまりました。茶色の26.5をお持ちいたします。',
    questionText: '客は どの靴を 買うことに しましたか？',
    options: ['黒の26.5', '紺の26.0', '茶色の26.5', '茶色の27.0'],
    correctAnswer: 2,
    explanationUzbek:
      "Qora rang tugagani sababli mijoz ishda kiyish uchun 26.5 o'lchamdagi jigarrang poyabzalni tanlaydi ('茶色にしてみようかな').",
  },
  {
    id: 349,
    section: 'listening',
    audioUrl: '/audio/choukai/n3/09 Track 9.mp3',
    script:
      '天気予報を聞いています。午後はどのような天気になる予報ですか？\nアナウンサー：関東地方のお天気をお伝えします。午前中は広く晴れて穏やかな陽気となりますが、午後は西から雨雲が広がり、夕方以降は激しい雷雨となる所がある見込みです。お出かけの際は、折りたたみ傘を必ずお持ちください。',
    questionText: '午後の 天気について、正しいものは どれですか？',
    options: [
      '一日中ずっと快晴が続く。',
      '午後から雨雲が広がり、夕方以降は雷雨になる。',
      '朝から雪が降る。',
      '非常に強い台風が直撃する。',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Sinoptik aytadi: Tushdan keyin yomg'ir bulutlari kelib, kechqurun kuchli momaqaldiroqli yomg'ir yog'ishi kutilmoqda.",
  },
  {
    id: 350,
    section: 'listening',
    audioUrl: '/audio/choukai/n3/10 Track 10.mp3',
    script:
      '病院で医師と患者が話しています。患者はどの薬を寝る前に飲みますか？\n医師：風邪の症状を抑えるお薬を出しておきますね。この赤いカプセルは朝と晩の食後に飲んでください。そしてこちらの白い錠剤は、咳を鎮める作用がありますので、毎晩おやすみになる30分前に1錠飲んでください。\n患者：わかりました。白い錠剤が寝る前ですね。',
    questionText: '患者は どの薬を 寝る前に 飲みますか？',
    options: ['赤いカプセル', '白い錠剤', '両方の薬', '食後の粉薬'],
    correctAnswer: 1,
    explanationUzbek:
      "Shifokor yo'talni qoldiruvchi oq tabletkani uxlashdan 30 daqiqa oldin ichishni buyuradi: '白い錠剤は...おやすみになる30分前に'.",
  },
];

export const JLPT_N2_MOCK_SET_2: ExamQuestion[] = [
  {
    id: 426,
    section: 'knowledge',
    questionText: 'どんなに 困難な 道（　）、自分で 選んだからには 最後まで やり抜く。',
    options: ['であろうと', 'にすぎず', 'ばかりか', 'につけ'],
    correctAnswer: 0,
    explanationUzbek: "'~de arou to' (qanchalik ... bo'lgan taqdirda ham) ma'nosini ifodalaydi.",
  },
  {
    id: 427,
    section: 'knowledge',
    questionText: '彼の 普段の 努力を（　）いればこそ、今回の 合格を 心から 祝福できる。',
    options: ['知って', '知れば', '知ろうと', '知るまいと'],
    correctAnswer: 0,
    explanationUzbek:
      "'~ba koso / V-te ireba koso' (aynan ... bo'lgani uchungina / sababli) grammatik qolipidir.",
  },
  {
    id: 428,
    section: 'knowledge',
    questionText:
      '次の 下線部の 言葉の 読み方として 最も よいものを 選びなさい。\n「両国の 間で <u>平和条約</u>が 締結された。」',
    options: ['へいわじょうやく', 'へいわていやく', 'へいわじょうき', 'へいわちょうやく'],
    correctAnswer: 0,
    explanationUzbek:
      "平和条約 ning to'g'ri o'qilishi 'へいわじょうやく' (Heiwa jouyaku - tinchlik shartnomasi).",
  },
  {
    id: 429,
    section: 'knowledge',
    questionText:
      '次の 下線部の 言葉の 漢字として 最も よいものを 選びなさい。\n「事件の <u>しんそう</u>を 明らかにする。」',
    options: ['真想', '真相', '深相', '真爽'],
    correctAnswer: 1,
    explanationUzbek: "'Shinsou' (haqiqiy holat, voqea asl haqiqati) '真相' deb yoziladi.",
  },
  {
    id: 430,
    section: 'knowledge',
    questionText: '先輩の アドバイスに（　）、履歴書の 志望動機を 書き直した。',
    options: ['沿って', '向かって', '際して', '通して'],
    correctAnswer: 0,
    explanationUzbek:
      "'~ni sotte' (biror qoida, reja yoki yo'l-yo'riqqa rioya qilgan holda, muvofiq ravishda) qolipi qo'llaniladi.",
  },
  {
    id: 431,
    section: 'knowledge',
    questionText: '健康管理は、食事（　）、適度な 運動も 不可欠である。',
    options: ['はもとより', 'にしては', 'とあれば', 'にしたら'],
    correctAnswer: 0,
    explanationUzbek:
      "'~wa motoyori' (A o'z-o'zidan ma'lumki, lekin B ham zarur) degan ma'noni ifodalaydi.",
  },
  {
    id: 432,
    section: 'knowledge',
    questionText: 'この 計画には 莫大な 予算が 必要であり、実行は（　）困難だ。',
    options: ['極めて', 'ろくに', 'たいして', 'いっそ'],
    correctAnswer: 0,
    explanationUzbek:
      "'Kiwamete' (g'oyatda, haddan tashqari darajada) ravishi N2 darajasidagi rasmiy uslubga xosdir.",
  },
  {
    id: 433,
    section: 'knowledge',
    questionText: '天候の 悪化に（　）、山頂への 登山は 中止と 決定された。',
    options: ['かんがみ', 'ともない', 'めぐり', 'おいて'],
    correctAnswer: 0,
    explanationUzbek:
      "'~ni kangami' (vaziyat yoki holatni chuqur inobatga olgan holda) ma'nosidagi rasmiy ifoda.",
  },
  {
    id: 434,
    section: 'knowledge',
    questionText:
      '次の 下線部の 言葉と 意味が 最も 近いものを 選びなさい。\n「彼は <u>おおむね</u> 賛成の 意を 表した。」',
    options: ['だいたい', 'まったく', 'めったに', 'けっして'],
    correctAnswer: 0,
    explanationUzbek:
      "'Oomune' so'zi 'umumiy hisobda, deyarli / asosiy qismi' ya'ni 'だいたい (daitai)' bilan sinonimdir.",
  },
  {
    id: 435,
    section: 'knowledge',
    questionText: '人気 アイドルの コンサート（　）、会場周辺は 早朝から ファンで 埋め尽くされた。',
    options: ['とあって', 'にすぎず', 'から見れば', 'を限りに'],
    correctAnswer: 0,
    explanationUzbek:
      "'~to atte' (...dek alohida/favqulodda vaziyat bo'lgani sababli) ma'nosini bildiradi.",
  },
  {
    id: 436,
    section: 'knowledge',
    questionText: '子ども（　）、親の 表情の 変化には 敏感に 気づくものだ。',
    options: ['ながらも', 'っこない', 'っぽい', 'がちで'],
    correctAnswer: 0,
    explanationUzbek:
      "'~nagara mo' (garchi ... bo'lsa ham / yosh bo'lishiga qaramay) zid ma'noli N2 qolipidir.",
  },
  {
    id: 437,
    section: 'knowledge',
    questionText: '長年の 研究成果が ついに 実を結び、新薬の 開発に 成功（　）。',
    options: ['した次第だ', 'するわけがない', 'しないとも限らない', 'するはずがない'],
    correctAnswer: 0,
    explanationUzbek:
      "'~shidaida' (mana shunday sabablar va voqealar zanjiri natijasida shunga yetib keldik) deb xulosa qilishda ishlatiladi.",
  },
  {
    id: 438,
    section: 'knowledge',
    questionText: '次の 言葉の 使い方として 最も 適切なものを 選びなさい。\n「<u>手際</u>」',
    options: [
      'シェフは 鮮やかな 手際で 魚を さばいた。',
      '彼の 手際が 悪くて バスに 乗り遅れた。',
      '手際を よく 磨いて 部屋を 掃除した。',
      'この パソコンは 手際が 軽くて 持ち運びに 便利だ。',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "'Tegiwa' ishni chaqqon, mohirona va epchillik bilan bajarish mahoratini bildiradi: '手際が良い / 鮮やかな手際'.",
  },
  {
    id: 439,
    section: 'reading',
    passageText:
      '人は誰しも、他者からの承認を求める欲求を抱えている。しかし、SNSの普及によって「他者からの評価」が数値として可視化された結果、他人の目を過剰に気にするあまり、本来の自分を見失ってしまう人が増えている。真の自己肯定感とは、他者との比較や一時的な称賛によって得られるものではなく、自らの価値観に基づいて誠実に生きる過程で培われるものである。',
    questionText: '筆者の主張として最も適切なものはどれですか？',
    options: [
      'SNSで多くの評価を得ることが自己肯定感を高める最善策である',
      '他者からの評価に依存せず、自らの価値観に従って生きることが大切である',
      '他人の目をまったく気にせずに生きることは不可能である',
      '自己肯定感を高めるためにはSNSの利用を完全に禁止すべきである',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Muallif boshqalarning sonli bahosiga qaram bo'lmasdan, o'z qadriyatlariga tayanib yashash haqiqiy o'ziga ishonchni berishini ta'kidlaydi.",
  },
  {
    id: 440,
    section: 'reading',
    passageText:
      '都市部における緑地の減少は、単なる景観の悪化にとどまらず、ヒートアイランド現象の深刻化や生態系の破壊といった環境問題を引き起こしている。これに対し、ビルの屋上や壁面を緑化する取り組みが注目を集めている。建築空間の立体的な緑化は、都市の気温上昇を抑えるだけでなく、人々に潤いと安らぎをもたらす心理的効果も実証されている。',
    questionText: 'ビルの屋上や壁面の緑化がもたらす効果として述べられていないものはどれですか？',
    options: [
      '都市の気温上昇（ヒートアイランド現象）を緩和すること',
      '人々に精神的な安らぎや潤いを与えること',
      '建築物の建設コストを大幅に削減すること',
      '都市の景観を向上させること',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Matnda qurilish xarajatlarini kamaytirishi haqida hech narsa aytilmagan (qolgan barcha bandlar matnda sanab o'tilgan).",
  },
  {
    id: 441,
    section: 'reading',
    passageText:
      '異文化理解において最も陥りやすい罠は、自らの文化基準を普遍的な「当たり前」とみなしてしまう自文化中心主義である。異なる習慣や価値観に出会ったとき、安易に「非常識」と断定するのではなく、その背景にある歴史や社会的文脈を理解しようと努める姿勢こそが、真の相互尊重への第一歩となる。',
    questionText: '異文化と接する際に筆者が重要だと考えている姿勢は何ですか？',
    options: [
      '自分の文化の優位性を相手に納得させること',
      '相手の文化をすぐに自文化の基準で判断すること',
      '背景にある歴史や社会的文脈を理解しようと努めること',
      '自文化の習慣をすべて捨てて相手に同化すること',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Boshqa madaniyatni o'rganishda uning zamiridagi tarixiy va ijtimoiy omillarni (歴史や社会的文脈) tushunishga intilish eng muhimdir.",
  },
  {
    id: 442,
    section: 'reading',
    passageText:
      '優れたリーダーシップとは、強力な権力で部下を従わせることではない。メンバー各自の強みを見極め、それを最大限に発揮できる環境を整える「支援型リーダーシップ」が、激動の現代において強く求められている。トップが指示を出すだけでなく、現場の自律的な意思決定を後押しすることが、組織の持続的な成長につながる。',
    questionText:
      '現代において求められている「支援型リーダーシップ」の説明として正しいものはどれですか？',
    options: [
      'すべての決定をリーダーが一人で行い、厳格に従わせること',
      'メンバーの強みを活かし、自律的な決定を支援する環境を整えること',
      '業務の指示を出さず、部下の行動を完全に放任すること',
      '短期的な成果のみを重視して厳しいノルマを課すこと',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Qo'llab-quvvatlovchi lider xodimlarning kuchli tomonlarini yuzaga chiqarib, erkin qaror qabul qilishiga ko'maklashadi.",
  },
  {
    id: 443,
    section: 'reading',
    passageText:
      '睡眠時間を削って勉強や仕事に充てることは、一見効率的に思えるが、科学的には逆効果であることが明らかになっている。睡眠不足は脳の集中力や判断力を著しく低下させ、結果としてミスが増えたり学習効率が落ちたりする。十分な睡眠を確保することこそが、長期的なパフォーマンスを維持するための最も確実な投資である。',
    questionText: '筆者が睡眠について述べていることと合致するものはどれですか？',
    options: [
      '睡眠時間を削ることで短期的には大きな成果が得られる',
      '十分な睡眠をとることが長期的な高い成果を維持する投資となる',
      '勉強時間を増やすためには睡眠時間を4時間以下に抑えるべきである',
      '睡眠不足でも集中力や判断力には何の影響もない',
    ],
    correctAnswer: 1,
    explanationUzbek:
      'Etarli uyqu uzoq muddatli aqliy samaradorlik va salomatlikka kiritilgan eng ishonchli sarmoyadir (最も確実な投資).',
  },
  {
    id: 444,
    section: 'reading',
    passageText:
      '【オフィスのセキュリティカード再発行手続きについて】\n紛失または破損により入館用セキュリティカードの再発行を希望される社員は、以下の手順に従ってください。\n1. 直属の上長に速やかに報告し、「紛失・破損報告書」の承認を得てください。\n2. 総務部窓口に承認済みの報告書と身分証明書を持参してください。\n3. 再発行手数料（2,000円）は翌月の給与から天引きされます。\n※カードの悪用を防ぐため、紛失が判明した時点で直ちに総務部へ電話連絡し、旧カードの利用停止手続きを行ってください。',
    questionText: 'カードを紛失した際、最初に行うべき緊急の対応は何ですか？',
    options: [
      '翌月の給与明細を確認すること',
      '直ちに総務部へ電話連絡し、旧カードの利用を停止すること',
      '警察署に行って遺失物届を出すこと',
      'すぐに再発行手数料2,000円を現金で支払うこと',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Karta yo'qolganda xavfsizlik uchun eng avval darhol telefon orqali eski kartani bloklash (利用停止手続き) kerak.",
  },
  {
    id: 445,
    section: 'listening',
    audioUrl: '/audio/choukai/n2/Track05.mp3',
    script:
      'オフィスで上司と部下が新プロジェクトのスケジュールについて話しています。\n上司：山田君、来月の新システム導入の件だけど、テスト期間が少し短すぎないかい？\n部下：はい、開発が1週間遅れた影響で、テスト期間を圧縮せざるを得ませんでした。\n上司：バグが見落とされたままリリースされたら大問題になる。クライアントと交渉して、全体の納期を1週間後ろにずらそう。\n部下：わかりました。すぐにクライアントの担当者に連絡して日程調整をいたします。',
    questionText: '二人は 最終的に どうすることに しましたか？',
    options: [
      'テスト期間をさらに短縮して予定通りリリースする',
      'クライアントと交渉して納期を1週間延ばす',
      '新システムの導入そのものを中止する',
      'テストを省略してそのまま運用を開始する',
    ],
    correctAnswer: 1,
    explanationUzbek:
      'Boshliq xatoliklar qolib ketmasligi uchun mijoz bilan kelishib topshirish muddatini 1 haftaga uzaytirishga (納期を1週間後ろにずらそう) qaror qiladi.',
  },
  {
    id: 446,
    section: 'listening',
    audioUrl: '/audio/choukai/n2/Track06.mp3',
    script:
      '大学の就職課で相談員が学生に面接のアドバイスをしています。\n相談員：面接では、志望動機を暗記した通りにスラスラ話すことよりも、面接官の質問の意図を正確に捉えて対話することが重要です。一方的にアピールするのではなく、聞かれたことに対して結論から簡潔に答えるキャッチボールを心がけましょう。',
    questionText: '相談員が 面接で 最も 大切だと 言っていることは 何ですか？',
    options: [
      '用意した志望動機を完璧に暗記して話すこと',
      '質問の意図を捉えて結論から簡潔に答える対話をすること',
      '自分の実績をできるだけ長く詳しくアピールすること',
      '面接官の目を見ずに下を向いて話すこと',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Maslahatchi yodlab olingan matnni to'xtovsiz aytish emas, savol mohiyatini anglab qisqa xulosa bilan muloqot qilish muhimligini uqtiradi.",
  },
  {
    id: 447,
    section: 'listening',
    audioUrl: '/audio/choukai/n2/Track07.mp3',
    script:
      '電話で旅行会社の社員と客が話しています。\n社員：お電話ありがとうございます、サンシャインツアーでございます。\n客：すみません、来週の北海道ツアーに申し込んでいる田中ですが、人数の変更をお願いできますか？ 2名から3名に増やしたいのですが。\n社員：かしこまりました。お調べしますので、予約番号をお教えいただけますでしょうか。\n客：はい、Tの4589です。\n社員：ありがとうございます。確認いたしましたところ、1名様分の飛行機の座席とホテルの追加が可能です。差額のお手続きについてメールをお送りしますね。',
    questionText: '客の 要望について、どうなりましたか？',
    options: [
      '満席のため人数を増やすことはできなかった',
      '飛行機もホテルも手配でき、1名の追加が可能になった',
      'ツアー自体が中止になっていた',
      'ホテルは空いているが飛行機が取れなかった',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Sayyohlik agentligi samolyot va mehmonxonadan joy topib, 1 nafar kishini qo'shish imkoni borligini tasdiqladi.",
  },
  {
    id: 448,
    section: 'listening',
    audioUrl: '/audio/choukai/n2/Track08.mp3',
    script:
      '会社で男性と女性が新入社員の研修について話しています。\n男：今年の新入社員、ビジネスマナー研修の進み具合はどう？\n女：名刺交換や電話応対のロールプレイングは順調です。ただ、ビジネスメールの敬語の使い方で戸惑っている人が目立ちますね。\n男：そうか。じゃあ来週は敬語メールの添削指導に時間を多めに割こう。\n女：賛成です。実際の業務メールを想定した演習を用意しますね。',
    questionText: '来週の 研修で 重点的に 行うことは 何ですか？',
    options: [
      '名刺交換のロールプレイング',
      '電話応対の基本練習',
      'ビジネスメールの敬語指導と添削',
      '社内システムの操作説明',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Xodimlar yangi ishchilar qiynalayotgan rasmiy xat yozishdagi hurmat tili (keigo email) ustida ko'proq mashq o'tkazishga kelishib oldilar.",
  },
  {
    id: 449,
    section: 'listening',
    audioUrl: '/audio/choukai/n2/Track09.mp3',
    script:
      '美術館の案内放送を聞いています。\nアナウンス：ご来館の皆様にご案内いたします。本展覧会の展示室内での写真撮影は、フラッシュおよび三脚を使用しない場合に限り、一部の指定作品のみ可能となっております。動画撮影および録音は一切ご遠慮いただいております。他のお客様の鑑賞の妨げとならないよう、マナーを守ってご鑑賞ください。',
    questionText: '美術館での 写真撮影について、正しいものは どれですか？',
    options: [
      'すべての作品をフラッシュを使って撮影できる',
      '指定された作品のみ、フラッシュと三脚なしで撮影できる',
      '動画であれば全館で自由に撮影できる',
      'いかなる撮影も完全に禁止されている',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "E'londa faqat belgilangan asarlarnigina chiroq (flash) va shtativsiz suratga olishga ruxsat berilgani aytiladi.",
  },
  {
    id: 450,
    section: 'listening',
    audioUrl: '/audio/choukai/n2/Track10.mp3',
    script:
      '洋服店で店員と男性客が話しています。\n店員：いかがですか、こちらのジャケット？\n客：うん、軽くて着心地はすごくいいね。ただ、このグレーだと手持ちのズボンと合わせにくいかな。紺か黒のものはありますか？\n店員：はい、同じサイズで紺色がございます。すぐにお持ちしますね。\n客：ありがとう。紺を着てみて決めるよ。',
    questionText: '男性客は 次に 何を 試着しますか？',
    options: ['グレーのズボン', '紺色のジャケット', '黒色のズボン', '別のサイズのジャケット'],
    correctAnswer: 1,
    explanationUzbek:
      "Mijoz kulrang o'rniga to'q ko'k (紺 - kon) rangli nimchani (jaket) kiyib ko'rmoqchi bo'ladi: '紺を着てみて決めるよ'.",
  },
];

// ==========================================
// === N1 MOCK EXAM SET 2 (Supplementary) ===
// ==========================================
export const JLPT_N1_MOCK_SET_2: ExamQuestion[] = [
  {
    id: 526,
    section: 'knowledge',
    questionText: '彼の 学問に対する 情熱は、生涯を 通じて 衰えることを（　）。',
    options: ['知らなかった', '言わなかった', '見なかった', '聞かなかった'],
    correctAnswer: 0,
    explanationUzbek:
      "'otoroeru koto o shiranakatta' (aslo so'nishni bilmadi, tinimsiz kuchaydi) adabiy turg'un iborasidir.",
  },
  {
    id: 527,
    section: 'knowledge',
    questionText:
      'どれほど 科学技術が 発展しようと（　）、死の 恐怖を 完全に 克服することは できない。',
    options: ['が', 'とも', 'なら', 'から'],
    correctAnswer: 1,
    explanationUzbek:
      "'Verb-(y)ou to / to mo' (qanchalik ... qilingan taqdirda ham) degan N1 shart-inkor vositasi: dore hodo hatten shiyou tomo.",
  },
  {
    id: 528,
    section: 'knowledge',
    questionText:
      '次の 下線部の 言葉の 読み方として 最も よいものを 選びなさい。\n「両国は 長年の 確執を 解消すべく <u>妥協</u>点を探った。」',
    options: ['だきょう', 'たいきょう', 'だぎょう', 'たいぎょう'],
    correctAnswer: 0,
    explanationUzbek:
      "妥協 iyeroglifining to'g'ri o'qilishi — だきょう (Dakyou - murosa, konsensus).",
  },
  {
    id: 529,
    section: 'knowledge',
    questionText:
      '次の 下線部の 言葉の 漢字として 最も よいものを 選びなさい。\n「相手の 弱点を <u>こうみょう</u>に ついた 戦術だ。」',
    options: ['巧妙', '功妙', '巧名', '高妙'],
    correctAnswer: 0,
    explanationUzbek:
      "'Koumyou' (ustamonlik bilan, epchil, ayyorona) so'zining to'g'ri kanjisi — 巧妙.",
  },
  {
    id: 530,
    section: 'knowledge',
    questionText: '彼の 傲慢な 態度は、周囲の 反感を 買わずには（　）。',
    options: ['おかない', 'やまない', 'すまない', 'たえない'],
    correctAnswer: 0,
    explanationUzbek:
      "'~zu ni wa okanai' (muqarrar ravishda ...ga olib keladi, sababchi bo'lmay qo'ymaydi) kuchli oqibatni bildiradi.",
  },
  {
    id: 531,
    section: 'knowledge',
    questionText: '未曾有の 経済危機に 直面し、政府は 緊急対策を 余儀なく（　）。',
    options: ['された', 'した', 'させた', 'ならなかった'],
    correctAnswer: 0,
    explanationUzbek:
      "'~o yogi naku sareta' (chora yo'qligidan majburan ... qilishga to'g'ri keldi) passiv konstruksiyasidir.",
  },
  {
    id: 532,
    section: 'knowledge',
    questionText: '長年 培った 職人の 熟練技は、機械（　）再現できるものではない。',
    options: ['とて', 'たりとも', 'とばかりに', 'ごとく'],
    correctAnswer: 0,
    explanationUzbek:
      "'Noun + tote' (hatto ... bo'lgan taqdirda ham / hatto zamonaviy mashinalar ham) degan N1 chegaralash vositasi.",
  },
  {
    id: 533,
    section: 'knowledge',
    questionText: '被災地の 一日も 早い 復興を 心から 祈って（　）。',
    options: ['やまない', 'たえない', 'おかない', 'すまない'],
    correctAnswer: 0,
    explanationUzbek:
      "'inotte yamanai' (yurakdan tinimsiz duo qilmoq / tilamoq) iborasi his-tuyg'uning bardavomligini bildiradi.",
  },
  {
    id: 534,
    section: 'knowledge',
    questionText:
      '次の 下線部の 言葉の 意味として 最も 近いものを 選びなさい。\n「彼の 意見には <u>一理</u>ある。」',
    options: ['道理にかなった部分がある', '全く根拠がない', '専門的な理論である', '非常識である'],
    correctAnswer: 0,
    explanationUzbek:
      "一理ある (ichiri aru) — unda ham o'ziga yarasha haqiqat yoki to'g'ri mantiq (道理にかなった部分) borligini anglatadi.",
  },
  {
    id: 535,
    section: 'knowledge',
    questionText: 'いかに 困難が あろうと、最後まで 初志を 貫徹する（　）だ。',
    options: ['のみ', 'きらい', 'まじき', 'ずくめ'],
    correctAnswer: 0,
    explanationUzbek:
      "'~suru nomi da' (faqat va faqat ... qilmoq qoladi xolos) qat'iy qaror va ahdni bildiradi.",
  },
  {
    id: 536,
    section: 'knowledge',
    questionText: '親の 財産を（　）に 放蕩の 限りを 尽くすなど、言語道断だ。',
    options: ['いいこと', 'かぎり', 'ばかり', 'もの'],
    correctAnswer: 0,
    explanationUzbek:
      "'~o ii koto ni' (vaziyat yoki imkoniyatdan yomon maqsadda, suiiste'mol qilib foydalanish) ma'nosini bildiradi.",
  },
  {
    id: 537,
    section: 'knowledge',
    questionText: '真相が 明らかに なるに（　）、世論の 怒りは ますます 高まった。',
    options: ['つれて', 'おいて', '沿って', '反して'],
    correctAnswer: 0,
    explanationUzbek:
      "'~ni tsurete' (hodisaning rivojlanishi bilan bir qatorda) o'zgarishni ko'rsatadi.",
  },
  {
    id: 538,
    section: 'knowledge',
    questionText: '日頃の 地道な 鍛錬が あって（　）の 栄冠である。',
    options: ['こそ', 'さえ', 'すら', 'だに'],
    correctAnswer: 0,
    explanationUzbek:
      "'~atte koso no (Noun)' (aynan tinimsiz mashaqqatli mehnat tufayligina qo'lga kiritilgan g'alaba) ta'kid shaklidir.",
  },
  {
    id: 539,
    section: 'reading',
    passageText:
      'グローバル化が加速する現代において、多文化共生が叫ばれて久しい。しかし、単に異なる文化背景を持つ人々が物理的に同じ空間に併存しているだけでは、真の共生とは言えない。互いの文化的前提の違いを理解し、自己の価値観を絶対化することなく、対話を通じて絶えず相互変容を受け入れる柔軟性こそが、共生の真髄である。',
    questionText: '筆者が考える「真の多文化共生」に必要な姿勢とは何ですか？',
    options: [
      '自国の伝統文化のみを他民族に徹底して学習させること',
      '自己の価値観を絶対化せず、対話を通じて相互変容を受け入れること',
      '外国人の居住区を隔離し、摩擦を物理的に防ぐこと',
      'すべての言語を英語に統一し、効率的な社会を作ること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Muallif o'z qadriyatlarini yagona haqiqat deb bilmasdan, o'zaro muloqot orqali bir-birini tushunish va o'zgarishga tayyor bo'lishni aytadi.",
  },
  {
    id: 540,
    section: 'reading',
    passageText:
      '科学的知識の蓄積は、世界から不可知の謎を追放し、全てを計量可能なデータへと還元しつつあるように見える。しかし、知の地平が広がるほど、その外側に広がる「未知の深淵」もまた幾何級数的に拡大していくのである。真の知性とは、自らの知を過信することなく、世界の奥深さに対して謙虚な畏怖の念を抱き続けることにある。',
    questionText: '筆者が述べる「真の知性」とはどのようなものですか？',
    options: [
      'すべての自然現象をデータで完全に解明したと確信すること',
      '自らの知識を過信せず、未知の深淵に対して謙虚な畏怖の念を抱くこと',
      '科学以外の迷信や伝統をすべて否定し排除すること',
      '誰よりも多くの専門用語や公式を記憶していること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Haqiqiy aql-idrok o'z bilganlariga bino qo'ymasdan, noma'lum olam oldida kamtarlik va hayrat tuyg'usini saqlashdadir.",
  },
  {
    id: 541,
    section: 'reading',
    passageText:
      '芸術作品の鑑賞とは、作者の意図を受動的に受け取る作業ではない。鑑賞者自身の人生経験、価値観、感情の総体が作品と衝突し、共鳴することによって、作品の中に新たな意味が生成される創造的行為である。したがって、優れた芸術作品は、時代や観客を超えて汲み尽くせぬ解釈の泉であり続ける。',
    questionText: '筆者によれば、芸術鑑賞の本質とは何ですか？',
    options: [
      '作者の伝記的事実を調べ、作者の意図のみを忠実に復元すること',
      '鑑賞者の経験と作品が響き合い、新たな意味を共創する能動的行為',
      '美術評論家の解説をそのまま暗記して作品の値段を当てること',
      '作品の技法や構図の優劣を客観的な数値で採点すること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "San'at asarini tomosha qilish — insonning o'z hayotiy tajribasi bilan asar o'rtasida yangi ma'no yaratuvchi ijodiy jarayondir.",
  },
  {
    id: 542,
    section: 'reading',
    passageText:
      '都市の再開発において、効率や近代性のみを追求して歴史的建造物を破壊することは、都市の「記憶の喪失」に等しい。古い町並みや歴史的遺産は、過去と現在、そして未来を架橋するアイデンティティの拠り所である。利便性と歴史性の調和こそが、持続可能で魅力ある都市景観を創造する鍵である。',
    questionText: '都市計画に関して筆者が強く主張していることはどれですか？',
    options: [
      '古い建物をすべて取り壊し、超高層ビルを建設すべきだ',
      '歴史的建造物を保存し、利便性と歴史性の調和を図るべきだ',
      '自動車の通行を完全に禁止し、江戸時代の町並みをそのまま復元すべきだ',
      '都市の景観は経済的利益のみを最優先に決定されるべきだ',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Shahar taraqqiyotida faqat zamonaviylik ortidan quvmay, tarixiy meros va qulaylik uyg'unligini (調和) saqlash lozim.",
  },
  {
    id: 543,
    section: 'reading',
    passageText:
      '失敗を極度に恐れる文化は、組織の創造性を窒息させる。イノベーションとは、数多の試行錯誤と失敗の屍の上に咲く花である。失敗を個人の資質の欠如として断罪するのではなく、新たな知見を獲得するための貴重なデータとして受容する「心理的安全性」のある組織こそが、真の飛躍を遂げることができる。',
    questionText: 'イノベーションを生み出す組織に必要な条件として、筆者は何を挙げていますか？',
    options: [
      '失敗した者を厳しく処罰し、ミスを根絶する規律',
      '失敗を貴重な学びとして受け入れる「心理的安全性」',
      '失敗の可能性がゼロである確実なプロジェクトのみを行うこと',
      '外部のコンサルタントに全ての新規事業を一任すること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Yangi yangiliklar yaratish uchun xatolardan qo'rqmaydigan ruhiy xavfsizlik muhiti (心理的安全性) zarur.",
  },
  {
    id: 544,
    section: 'reading',
    passageText:
      '現代の消費社会は、我々に絶え間ない欲求の喚起と物質的充足を促すが、真の幸福感は所有の多寡とは相関しない。他者との精神的な絆、自己の成長を実感できる挑戦、そして社会に貢献しているという手応えの中にこそ、持続的な幸福の源泉が存在する。物質主義から経験・関係性重視への価値観のシフトが求められている。',
    questionText: '筆者が説く「真の幸福」の源泉とは何ですか？',
    options: [
      '他人よりも多くの高級ブランド品を所有すること',
      '他者との絆、自己の成長、社会への貢献という経験と関係性',
      '仕事を辞めて一人で孤立した生活を送ること',
      '将来の不安を解消するために資産を蓄積し続けること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Muallif baxt boyliklar sonida emas, balki samimiy munosabatlar, shaxsiy o'sish va jamiyatga xizmat qilishda ekanligini ta'kidlaydi.",
  },
  {
    id: 545,
    section: 'listening',
    audioUrl: '/audio/choukai/n1/n1_track_78.mp3',
    script:
      '環境フォーラムで研究者が登壇しています。\n研究者：海洋プラスチックゴミの削減に向けて、生分解性素材の開発が進んでいますが、それだけで海洋汚染の根本的な解決には至りません。廃棄物処理インフラの未整備な途上国への技術支援と、使い捨てプラスチックそのものを減らす国際条約の締結が急務なのです。',
    questionText: '研究者が最も早急に取り組むべきだと主張しているのは何ですか？',
    options: [
      '生分解性プラスチックの国内生産のみを増やすこと',
      '途上国へのインフラ支援と使い捨てプラ削減の国際条約締結',
      'すべてのプラスチック製品の製造を即座に全面禁止すること',
      '海洋ゴミの回収作業をボランティアだけに頼ること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      'Tadqiqotchi rivojlanayotgan davlatlarga infratuzilma yordami berish va bir martalik plastmassani qisqartirish xalqaro shartnomasini zarur deb biladi.',
  },
  {
    id: 546,
    section: 'listening',
    audioUrl: '/audio/choukai/n1/n1_track_79.mp3',
    script:
      '歴史学の講義で准教授が話しています。\n准教授：ある歴史的事件を客観的に評価するためには、勝者の側が遺した公式記録だけでなく、敗者や市井の名もなき庶民の手記や書簡といった多角的な史料を突き合わせることが不可欠です。歴史の真実は、単一の記録の枠内には収まりきらないのです。',
    questionText: '歴史的事件を正当に評価するために不可欠な方法は何ですか？',
    options: [
      '勝者の公式記録のみを絶対の事実として採用すること',
      '敗者や庶民の手記など多角的な史料を突き合わせて検証すること',
      '古い記録は信用せず、現代の価値観のみで解釈すること',
      '教科書の記述をそのまま鵜呑みにすること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Tarixiy hodisani xolis baholash uchun faqat g'oliblarning emas, mag'lublar va oddiy xalq yozuvlarini ham har tomonlama solishtirish zarur.",
  },
  {
    id: 547,
    section: 'listening',
    audioUrl: '/audio/choukai/n1/n1_track_80.mp3',
    script:
      'IT企業の開発会議でプロダクトマネージャーが話しています。\nマネージャー：新機能の追加を急ぐあまり、既存システムの動作安定性を損なっては本末転倒です。今四半期は新機能開発を一時凍結し、コードのリファクタリングとセキュリティの脆弱性対策に全力を注ぎましょう。',
    questionText: '今四半期において最優先される方針は何ですか？',
    options: [
      '新機能のリリースを予定より前倒しして実施すること',
      '新機能開発を凍結し、システムの安定性とセキュリティ対策を徹底すること',
      '開発チームの人員を半減させてコストを削減すること',
      'セキュリティ対策は後回しにして売上拡大を狙うこと',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Menejer yangi funksiyalarni to'xtatib, tizim barqarorligi va xavfsizlik zaifliklarini bartaraf etishni birinchi o'ringa qo'ydi.",
  },
  {
    id: 548,
    section: 'listening',
    audioUrl: '/audio/choukai/n1/n1_track_83.mp3',
    script:
      '都市社会学のシンポジウムで専門家が話しています。\n専門家：少子高齢化が進む地方都市の再生には、単なるハコモノ（公共施設）の建設ではなく、医療・福祉・商業機能を中心部に集約する「コンパクトシティ」の構築と、公共交通網の再編が不可欠な鍵となります。',
    questionText: '地方都市の再生に向けて提唱されている施策は何ですか？',
    options: [
      '郊外に巨大なショッピングモールを乱立させること',
      '都市機能を中心部に集約するコンパクトシティ化と公共交通網の再編',
      'すべての公共施設を民間に売却して撤退すること',
      '若者の移住のみを強制し、高齢者福祉を削減すること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Shahar markazida xizmatlarni jamlash (kompakt shahar) va jamoat transportini qayta yo'lga qo'yish zaruriyati aytildi.",
  },
  {
    id: 549,
    section: 'listening',
    audioUrl: '/audio/choukai/n1/n1_track_84.mp3',
    script:
      '医学シンポジウムで脳科学者が講演しています。\n脳科学者：睡眠不足が長期化すると、脳内の老廃物排出システムが正常に機能しなくなり、認知機能の低下や神経変性疾患のリスクが跳ね上がります。十分な睡眠時間を確保することは、怠惰ではなく、脳の健康維持における必須の投資なのです。',
    questionText: '脳科学者が睡眠に関して強調しているポイントは何ですか？',
    options: [
      '睡眠時間は極力削って仕事に充てるべきである',
      '十分な睡眠は脳の老廃物を排出し健康を維持する必須の投資である',
      '睡眠薬を常用して短時間で深い眠りを取れば問題ない',
      '高齢者は睡眠を全くとる必要がない',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Yetarli uyqu miyadagi chiqindilarni tozalab, kognitiv salomatlikni saqlovchi zaruriy omil ekanligi ta'kidlandi.",
  },
  {
    id: 550,
    section: 'listening',
    audioUrl: '/audio/choukai/n1/n1_track_85.mp3',
    script:
      '建築デザインの講義で建築家が語っています。\n建築家：日本の伝統建築が木造でありながら数百年もの風雪に耐えうるのは、地震の揺れを剛性で押さえつけるのではなく、各接合部がしなやかに変形してエネルギーを分散吸収する「柔構造」の叡智があるからです。自然に抗うのではなく、いなす思想が息づいています。',
    questionText: '日本伝統建築の耐震性の本質として説明されているものはどれですか？',
    options: [
      '鉄筋コンクリートで揺れを力ずくで押さえつける剛構造',
      '接合部がしなやかに揺れを逃しエネルギーを分散する柔構造の知恵',
      '地下深くまで太い金属杭を打ち込む基礎工事',
      '地震の起きない地域のみを選んで建築すること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Yapon an'anaviy me'morchiligida zilzila kuchini qattiq ushlab turish emas, balki bo'g'inlarning egiluvchan harakati orqali kuchni tarqatish (柔構造 - egiluvchan struktura) uslubi qo'llaniladi.",
  },
];

export const JLPT_MOCK_EXAM_SET2_DATA: Record<'N5' | 'N4' | 'N3' | 'N2' | 'N1', ExamQuestion[]> = {
  N5: JLPT_N5_MOCK_SET_2,
  N4: JLPT_N4_MOCK_SET_2,
  N3: JLPT_N3_MOCK_SET_2,
  N2: JLPT_N2_MOCK_SET_2,
  N1: JLPT_N1_MOCK_SET_2,
};

// ==========================================
// === JLPT MOCK EXAMS - SET 3 (Speed Master & Authentic Choukai) ===
// ==========================================

export const JLPT_N5_MOCK_SET_3: ExamQuestion[] = [
  {
    id: 151,
    section: 'knowledge',
    questionText: 'きのう、あたらしい（車）を かいました。',
    options: ['くるま', 'でんしゃ', 'じてんしゃ', 'ひこうき'],
    correctAnswer: 0,
    explanationUzbek:
      "「車」（mashina/avtomobil）kanjisining to'g'ri o'qilishi — くるま (kuruma). でんしゃ — poyezd, じてんしゃ — velosiped.",
  },
  {
    id: 152,
    section: 'knowledge',
    questionText: 'つくえの うえに ほんが（五冊）あります。',
    options: ['ごほん', 'ごさつ', 'ごまい', 'ごだい'],
    correctAnswer: 1,
    explanationUzbek:
      "Kitob va daftarlar «〜冊（さつ）» qo'shimchasi bilan sanaladi: 五冊 — ごさつ (beshta kitob).",
  },
  {
    id: 153,
    section: 'knowledge',
    questionText: 'きょうは てんきが よくて、（あたたかい）です。',
    options: ['暑い', '涼しい', '暖かい', '寒い'],
    correctAnswer: 2,
    explanationUzbek:
      "«Iliq» (ob-havo) so'zining to'g'ri kanjisi — 暖かい (あたたかい). 暑い — issiq, 寒い — sovuq.",
  },
  {
    id: 154,
    section: 'knowledge',
    questionText: 'あした ともだち（　）えいがを みに いきます。',
    options: ['に', 'を', 'で', 'と'],
    correctAnswer: 3,
    explanationUzbek:
      "Birgalikda harakat bajarilganda biriktiruvchi «と» yuklamasi ishlatiladi: ともだちと (do'stim bilan).",
  },
  {
    id: 155,
    section: 'knowledge',
    questionText: 'すみません、この りんごを みっつ（　）。',
    options: ['ください', 'あります', 'います', 'します'],
    correctAnswer: 0,
    explanationUzbek:
      'Xarid qilishda buyurtma «〜を ください» (bering) bilan ifodalanadi: みっつ ください (uchta bering).',
  },
  {
    id: 156,
    section: 'knowledge',
    questionText: 'わたしは まいばん おんがくを（　）ながら ほんを よみます。',
    options: ['きいて', 'きき', 'きく', 'きいた'],
    correctAnswer: 1,
    explanationUzbek:
      "Bir vaqtda ikkita ishni bajarishda V-masu o'zagi + ながら: 聞きながら (tinglagan holda).",
  },
  {
    id: 157,
    section: 'knowledge',
    questionText: 'へやの でんきを（　）から、ねます。',
    options: ['けす', 'けした', 'けして', 'けさない'],
    correctAnswer: 2,
    explanationUzbek: "Ketma-ket harakatlarda te-shakl + から: 消してから (o'chirgandan so'ng).",
  },
  {
    id: 158,
    section: 'knowledge',
    questionText: 'わたしの へやは ひろい（　）、あかるいです。',
    options: ['が', 'から', 'でも', 'し'],
    correctAnswer: 3,
    explanationUzbek: "Sifatlarni biriktirib ifodalashda: 広いし、明るいです (keng hamda yorug').",
  },
  {
    id: 159,
    section: 'knowledge',
    questionText: 'この みちは くるまが おおいですから、（あぶない）です。',
    options: ['危ない', '安全', '便利', '静か'],
    correctAnswer: 0,
    explanationUzbek:
      "«Xavfli» so'zining to'g'ri kanjisi — 危ない (あぶない). 安全 — xavfsiz, 便利 — qulay.",
  },
  {
    id: 160,
    section: 'knowledge',
    questionText: 'きのうは どこ（　）いきませんでした。',
    options: ['にも', 'へも', 'でも', 'をも'],
    correctAnswer: 1,
    explanationUzbek: "To'liq inkor: どこへも 行きませんでした (hech qayerga bormadim).",
  },
  {
    id: 161,
    section: 'knowledge',
    questionText: 'あには （がいこく）の だいがくで べんきょうして います。',
    options: ['外園', '国外国', '外国', '町国'],
    correctAnswer: 2,
    explanationUzbek: "«Chet el» so'zining to'g'ri kanjisi — 外国 (がいこく).",
  },
  {
    id: 162,
    section: 'knowledge',
    questionText: 'この おかしは とても （あまくて） おいしいです。',
    options: ['辛くて', '苦くて', '酸っぱくて', '甘くて'],
    correctAnswer: 3,
    explanationUzbek: "«Shirin bo'lib» i-sifat te-shakli kanjisi — 甘くて (あまくて).",
  },
  {
    id: 163,
    section: 'knowledge',
    questionText: 'えきまで あるいて 15ふん（　）かかります。',
    options: ['ぐらい', 'ごろ', 'しか', 'まで'],
    correctAnswer: 0,
    explanationUzbek: 'Vaqt miqdorining taxminiyligi: 15分ぐらい (taxminan 15 daqiqa).',
  },
  {
    id: 164,
    section: 'reading',
    passageText:
      'わたしは まいあさ 6じに おきます。あさごはんを たべてから、いぬと さんぽを します。それから バスで かいしゃへ いきます。',
    questionText: 'この ひとは あさごはんの あとで 何[なに]を しますか。',
    options: ['かいしゃへ いきます', 'いぬと さんぽを します', '6じに おきます', 'テレビを みます'],
    correctAnswer: 1,
    explanationUzbek: 'Matnda nonushtadan keyin it bilan sayr qilishi yozilgan.',
  },
  {
    id: 165,
    section: 'reading',
    passageText:
      'きのうの にちようび、たなかさんと デパートへ いきました。たなかさんは あおい シャツを かいました。わたしは くろい くつを かいました。',
    questionText: '「わたし」は デパートで 何[なに]を かいましたか。',
    options: ['あおい シャツ', 'コーヒー', 'くろい くつ', 'かばん'],
    correctAnswer: 2,
    explanationUzbek: "Matnda qora poyabzal sotib olgani aniq ko'rsatilgan.",
  },
  {
    id: 166,
    section: 'reading',
    passageText:
      'わたしの へやには ベッドと つくえが あります。つくえの うえには パソコンが あります。ほんばこは つくえの ひだりに あります。',
    questionText: 'ほんばこは どこに ありますか。',
    options: ['つくえの うえ', 'ベッドの した', 'へやの そと', 'つくえの ひだり'],
    correctAnswer: 3,
    explanationUzbek: 'Kitob javoni stolning chap tomonida joylashgan.',
  },
  {
    id: 167,
    section: 'reading',
    passageText:
      '日本の なつは とても あついです。でも、なつやすみには うみや やまへ いきます。わたしは うみで およぐのが だいすきです。',
    questionText: 'この ひとは なつやすみに 何[なに]を するのが すきですか。',
    options: ['うみで およぐこと', 'やまに のぼること', 'いえで ねること', 'あめを みること'],
    correctAnswer: 0,
    explanationUzbek: "Dengizda suzishni yaxshi ko'rishi aytilgan.",
  },
  {
    id: 168,
    section: 'reading',
    passageText:
      'スミスさんは らいしゅう 国へ かえります。みんなで 金曜日の よるに 送別会を します。時間は 6時半からです。',
    questionText: 'そうべつかいは いつ ありますか。',
    options: [
      'どようびの あさ',
      'きんようびの よる 6じはん',
      'らいしゅうの にちようび',
      'きょうの よる',
    ],
    correctAnswer: 1,
    explanationUzbek: "Juma oqshomi 6:30 da o'tkazilishi aytilgan.",
  },
  {
    id: 169,
    section: 'reading',
    passageText:
      'としょかんの ごあんない：ほんは ひとり 5さつまで かりることが できます。かりる きかんは 2しゅうかんです。',
    questionText: 'としょかんで ほんは なんさつまで かりられますか。',
    options: ['2さつまで', '10さつまで', '5さつまで', 'なんさつでも'],
    correctAnswer: 2,
    explanationUzbek: "Kutubxona qoidasiga ko'ra 5 tagacha kitob olish mumkin.",
  },
  {
    id: 170,
    section: 'listening',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_005.mp3',
    script:
      '男：このペンはいくらですか。\n女：1本150円です。\n男：じゃ、2本ください。\n女：300円になります。',
    questionText: '男[おとこ]の 人[ひと]は 全部[ぜんぶ]で いくら はらいますか。',
    options: ['150円', '200円', '450円', '300円'],
    correctAnswer: 3,
    explanationUzbek: "150 yendan 2 ta ruchka xarid qilgani uchun 300 yen to'laydi.",
  },
  {
    id: 171,
    section: 'listening',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_006.mp3',
    script:
      '女：あした何時に会いましょうか。\n男：9時はどうですか。\n女：9時は少し早いので9時半にしませんか。\n男：いいですよ。',
    questionText: '2人[ふたり]は あした 何時[なんじ]に 会[あ]いますか。',
    options: ['9時半[くじはん]', '9時[くじ]', '10時[じゅうじ]', '8時半[はちじはん]'],
    correctAnswer: 0,
    explanationUzbek: "9 juda erta bo'lgani sababli 9:30 ga kelishishdi.",
  },
  {
    id: 172,
    section: 'listening',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_007.mp3',
    script:
      '男：きのうはどこか行きましたか。\n女：ええ、家族と動物園へ行きました。パンダを見ましたよ。',
    questionText: '女[おんな]の 人[ひと]は きのう どこへ 行[い]きましたか。',
    options: ['水族館[すいぞくかん]', '動物園[どうぶつえん]', '映画館[えいがかん]', 'デパート'],
    correctAnswer: 1,
    explanationUzbek: "Hayvonot bog'iga borib pandalarni ko'rgani aytildi.",
  },
  {
    id: 173,
    section: 'listening',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_008.mp3',
    script: '女：その傘は田中さんのですか。\n男：いいえ、私のは青いです。これは山田さんのです。',
    questionText: '田中[たなか]さんの 傘[かさ]は 何色[なにいろ]ですか。',
    options: ['黒[くろ]', '白[しろ]', '青[あお]', '赤[あか]'],
    correctAnswer: 2,
    explanationUzbek: "Tanaka janob o'z soyaboni ko'k rangdaligini bildirdi.",
  },
  {
    id: 174,
    section: 'listening',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_009.mp3',
    script: '男：今何時ですか。\n女：ちょうど3時ですよ。\n男：会議の時間ですね。急ぎましょう。',
    questionText: '2人[ふたり]は これから 何[なに]を しますか。',
    options: ['昼[ひる]ごはんを 食[た]べる', '帰[かえ]る', '休[やす]む', '会議[かいぎ]に 行[い]く'],
    correctAnswer: 3,
    explanationUzbek: "Soat 3 da majlis bo'lgani uchun tezroq yig'ilishga borishmoqda.",
  },
  {
    id: 175,
    section: 'listening',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_010.mp3',
    script: '女：富士山のはがきを3枚ください。\n店員：はい、3枚で300円です。',
    questionText: '女[おんな]の 人[ひと]は はがきを 何枚[なんまい] 買[か]いましたか。',
    options: ['3枚[さんまい]', '1枚[いちまい]', '5枚[ごまい]', '2枚[にまい]'],
    correctAnswer: 0,
    explanationUzbek: 'Ayol kishi 3 ta otkritka sotib oldi.',
  },
];

export const JLPT_N4_MOCK_SET_3: ExamQuestion[] = [
  {
    id: 251,
    section: 'knowledge',
    questionText: '日本[にほん]の 歴史[れきし]に ついて（研究[けんきゅう]）して います。',
    options: ['けんきゅう', 'けんがく', 'けんしゅう', 'せんもん'],
    correctAnswer: 0,
    explanationUzbek:
      "「研究」（ilmiy izlanish, tadqiqot）ning to'g'ri o'qilishi — けんきゅう (kenkyuu).",
  },
  {
    id: 252,
    section: 'knowledge',
    questionText:
      'パスポートを （紛失[ふんしつ]）した 場合は、すぐに 届け出[とどけで]て ください。',
    options: ['こわした', 'なくした', 'みつけた', 'もらった'],
    correctAnswer: 1,
    explanationUzbek: "「紛失」so'zining ma'nosi — tushirib yo'qotmoq (なくした).",
  },
  {
    id: 253,
    section: 'knowledge',
    questionText: 'この 荷物[にもつ]は （重[おも]すぎて）、一人[ひとり]では 持[も]てません。',
    options: ['軽すぎて', '長すぎて', '重すぎて', '多すぎて'],
    correctAnswer: 2,
    explanationUzbek: "«Juda og'ir bo'lib ketgan» kanjisi — 重すぎて (おもすぎて).",
  },
  {
    id: 254,
    section: 'knowledge',
    questionText: '田中[たなか]さんは 会議[かいぎ]の 資料[しりょう]を もう 集[あつ]めて（　）。',
    options: ['います', 'おきます', 'しまいます', 'あります'],
    correctAnswer: 3,
    explanationUzbek:
      'Oldindan qilingan maqsadli harakat natijasi: 他動詞＋てあります: 集めてあります.',
  },
  {
    id: 255,
    section: 'knowledge',
    questionText: '頭[あたま]が 痛[いた]いんです。（　）早[はや]く 帰[かえ]っても いいですか。',
    options: ['ですから', 'それで', 'しかし', 'でも'],
    correctAnswer: 0,
    explanationUzbek: "Sabab bildirishdan so'ng xulosa chiqarish: ですから (shuning uchun).",
  },
  {
    id: 256,
    section: 'knowledge',
    questionText: '先生[せんせい]、この 漢字[かんじ]の 読[よ]み方[かた]を 教[おし]えて（　）。',
    options: ['あげましょうか', 'いただけませんか', 'もらいますか', 'くれますか'],
    correctAnswer: 1,
    explanationUzbek: "O'qituvchidan muloyimlik bilan o'rgatishni so'rash: 〜ていただけませんか.",
  },
  {
    id: 257,
    section: 'knowledge',
    questionText: '雨[あめ]が（　）そうだから、傘[かさ]を 持[も]って 行[い]きましょう。',
    options: ['降る', '降った', '降り', '降って'],
    correctAnswer: 2,
    explanationUzbek:
      "Tashqi belgiga qarab taxmin: Fe'l masu-o'zagi + そう: 降りそう (yog'adiganga o'xshaydi).",
  },
  {
    id: 258,
    section: 'knowledge',
    questionText: '将来[しょうらい] 医者[いしゃ]に（　）つもりです。',
    options: ['なり', 'なって', 'なろう', 'なる'],
    correctAnswer: 3,
    explanationUzbek:
      "Qat'iy niyat va maqsad: Fe'l lug'aviy shakli + つもり: なる つもり (bo'lmoqchiman).",
  },
  {
    id: 259,
    section: 'knowledge',
    questionText: 'この 本[ほん]は 難[むずか]しすぎて、ちっとも（　）。',
    options: ['分かりません', '分かります', '読めました', '面白いです'],
    correctAnswer: 0,
    explanationUzbek:
      "«Juda qiyin bo'lgani uchun umuman tushunmadim»: ちっとも＋inkor (分かりません).",
  },
  {
    id: 260,
    section: 'knowledge',
    questionText: '明日[あした]までに この 本[ほん]を 読[よ]んで（　）ください。',
    options: ['あって', 'おいて', 'いて', 'みせて'],
    correctAnswer: 1,
    explanationUzbek: "Belgilangan vaqtgacha tayyorlab qo'yish: V-ておいて ください.",
  },
  {
    id: 261,
    section: 'knowledge',
    questionText: '時間[じかん]が ありませんから、（急[いそ]いで） 行[い]きましょう。',
    options: ['あるいて', 'はしって', 'いそいで', 'とんで'],
    correctAnswer: 2,
    explanationUzbek: "«Shoshib, tezlik bilan» fe'lining te-shakli — 急いで (いそいで).",
  },
  {
    id: 262,
    section: 'knowledge',
    questionText: '私[わたし]は 毎朝[まいあさ] 6時[ろくじ]に（起[お]きる）ように して います。',
    options: ['おける', 'あきる', 'いきる', 'おきる'],
    correctAnswer: 3,
    explanationUzbek: "«Uyg'onmoq» fe'lining to'g'ri o'qilishi — 起きる (おきる).",
  },
  {
    id: 263,
    section: 'knowledge',
    questionText:
      '田中[たなか]さんは 来週[らいしゅう] アメリカへ 出張[しゅっちょう]する（　）です。',
    options: ['予定[よてい]', '都合[つごう]', '準備[じゅんび]', '利用[りよう]'],
    correctAnswer: 0,
    explanationUzbek: 'Rasmiy taqvim rejasi: 〜予定です (yotei desu - rejalashtirilgan).',
  },
  {
    id: 264,
    section: 'reading',
    passageText:
      'スピーチ大会のお知らせ：日時：11月1日（日）午後1時〜。参加希望者は10月15日（木）までに事務所へ申し込んでください。原稿は10月20日までに提出してください。',
    questionText:
      'スピーチ大会[たいかい]に 出[で]る 人[ひと]は 何日[なんにち]までに 申[もう]し込[こ]まなければ なりませんか。',
    options: ['10月20日', '10月15日[じゅうがつじゅうごにち]', '11月1日', 'いつでもよい'],
    correctAnswer: 1,
    explanationUzbek: "E'londa arizalar 10-oktyabr 15-sanagacha qabul qilinishi yozilgan.",
  },
  {
    id: 265,
    section: 'reading',
    passageText:
      'アパートの利用規則：ゴミは決められた曜日の朝8時までに出してください。ペットの飼育や深夜の楽器演奏は禁止です。夜10時以降は近隣の迷惑にならないよう静かに過ごしてください。',
    questionText: 'この アパートの 規則[きそく]で 正[ただ]しいものは どれですか。',
    options: [
      'ペットを 飼[か]っても よい',
      'ゴミは いつでも 捨[す]てて よい',
      '夜[よる] 10時[じゅうじ]以降[いこう]は 静[しず]かに する',
      '部屋[へや]で 楽器[がっき]を 弾[ひ]いて よい',
    ],
    correctAnswer: 2,
    explanationUzbek:
      'Kvartira qoidasida kechki soat 10 dan keyin shovqin qilmaslik shart qilingan.',
  },
  {
    id: 266,
    section: 'reading',
    passageText:
      '山田さんのメール：「田中部長、すみません。乗っていた電車が事故で止まってしまい、30分ほど遅れます。資料は先に始めていてください。」',
    questionText: '山田[やまだ]さんは どうして 会議[かいぎ]に 遅[おく]れましたか。',
    options: [
      '寝坊[ねぼう]したから',
      '道[みち]に 迷[まよ]ったから',
      '場所[ばしょ]を 間違[まちが]えたから',
      '電車[でんしゃ]が 事故[じこ]で 止[と]まったから',
    ],
    correctAnswer: 3,
    explanationUzbek: "Poyezd halokat sababli to'xtab qolgani tushuntirilgan.",
  },
  {
    id: 267,
    section: 'reading',
    passageText:
      'リサイクルショップ受付基準：汚れや破れのない衣類、正常に動作する電化製品のみ買い取ります。故障品や粗大ゴミはお引き取りできません。',
    questionText: 'リサイクルショップに 持[も]って 行[い]ける 物[もの]は どれですか。',
    options: [
      'まだ 使[つか]える きれいな 服[ふく]',
      '壊[こわ]れた テレビ',
      '汚[よご]れた 家具[かぐ]',
      '動[うご]かない 時計[とけい]',
    ],
    correctAnswer: 0,
    explanationUzbek: 'Faqat toza va yaroqli kiyim-kechaklar qabul qilinishi aytilgan.',
  },
  {
    id: 268,
    section: 'reading',
    passageText:
      'パソコンコーナーの利用案内：利用希望者は受付カウンターで学生証を提示し、利用カードを受け取ってください。1回の利用時間は最大1時間です。',
    questionText:
      '図書館[としょかん]の パソコンを 使[つか]いたい 人[ひと]は まず 何[なに]を しますか。',
    options: [
      '自由[じゆう]に 座[すわ]って 電源[でんげん]を 入[い]れる',
      '受付[うけつけ]で 学生証[がくせいしょう]を 見[み]せる',
      'お金[かね]を 払[はら]う',
      '先生[せんせい]の 許可[きょか]を もらう',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Kutubxonadagi kompyuterdan foydalanish uchun talabalik guvohnomasini ko'rsatish kerak.",
  },
  {
    id: 269,
    section: 'reading',
    passageText:
      '留学生奨学金募集要項：対象は出席率が90％以上で、学業成績が優秀な正規学生です。他の奨学金を受給していないことが条件となります。',
    questionText:
      '留学生[りゅうがくせい]センターの 奨学金[しょうがくきん]の 条件[じょうけん]で 合[あ]って いるものは どれですか。',
    options: [
      'アルバイトを して いない 人',
      '1年生[いちねんせい]だけ',
      '出席率[しゅっせきりつ]が 90％以上[いじょう]の 人[ひと]',
      '日本語[にほんご]が 話[はな]せない 人',
    ],
    correctAnswer: 2,
    explanationUzbek: "Davomat ko'rsatkichi 90% dan yuqori bo'lishi talab qilinadi.",
  },
  {
    id: 270,
    section: 'listening',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-B_001.mp3',
    script:
      '男：郵便局へ行く前に、まず銀行でお金を下ろしてくるよ。\n女：じゃ、ついでに切手も買ってきてくれる？\n男：うん、分かった。',
    questionText: '男[おとこ]の 人[ひと]は これから まず どこへ 行[い]きますか。',
    options: ['郵便局[ゆうびんきょく]', 'コンビニ', '会社[かいしゃ]', '銀行[ぎんこう]'],
    correctAnswer: 3,
    explanationUzbek: 'Avval pul yechib olish uchun bankka borishini aytdi.',
  },
  {
    id: 271,
    section: 'listening',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-B_002.mp3',
    script:
      '女：10時ちょうどは満席ですね。\n駅員：10時15分のひかり号なら空きがございます。\n女：じゃ、その10時15分のをお願いします。',
    questionText: '女[おんな]の 人[ひと]は 何時[なんじ]の 新幹線[しんかんせん]に 乗[の]りますか。',
    options: ['10時15分[じゅうじじゅうごふん]', '10時[じゅうじ]', '10時30分', '11時[じゅういちじ]'],
    correctAnswer: 0,
    explanationUzbek: '10:15 dagi poyezdga chiqishi rejalashtirildi.',
  },
  {
    id: 272,
    section: 'listening',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-B_003.mp3',
    script:
      '男：お昼は何にする？食堂は混んでるよ。\n女：駅前に新しいカレー屋ができたから行ってみない？\n男：いいね、そうしよう。',
    questionText: '2人[ふたり]は どこで 昼[ひる]ごはんを 食[た]べますか。',
    options: [
      '会社の 食堂[しょくどう]',
      '駅前[えきまえ]の カレー屋[や]',
      '公園[こうえん]',
      'コンビニ',
    ],
    correctAnswer: 1,
    explanationUzbek: 'Vokzal oldidagi yangi ochilgan karri oshxonasiga borishga kelishishdi.',
  },
  {
    id: 273,
    section: 'listening',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-B_004.mp3',
    script:
      '受付：明日の健康診断には、健康保険証と写真2枚を必ずお持ちください。\n男：はい、保険証と写真ですね。分かりました。',
    questionText:
      '男[おとこ]の 人[ひと]は 明日[あした] 何[なに]を 持[も]って 行[い]かなければ なりませんか。',
    options: [
      'お金[かね]だけ',
      'パスポート',
      '保険証[ほけんしょう]と 写真[しゃしん]',
      '筆記用具[ひっきようぐ]だけ',
    ],
    correctAnswer: 2,
    explanationUzbek: "Tibbiy sug'urta kartasi va 2 dona fotosurat talab qilinadi.",
  },
  {
    id: 274,
    section: 'listening',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-B_005.mp3',
    script:
      '男：すみません、この机を隣の部屋に運びたいんですが、手伝ってもらえませんか。\n女：ええ、いいですよ。一緒に持ちましょう。',
    questionText: '女[おんな]の 人[ひと]は 何[なに]を 手伝[てつだ]いますか。',
    options: [
      '書類[しょるい]を コピーする',
      '電話[でんわ]を かける',
      '掃除[そうじ]をする',
      '部屋[へや]の 机[つくえ]を 運[はこ]ぶ',
    ],
    correctAnswer: 3,
    explanationUzbek: "Xonadagi og'ir stolni ko'chirishga yordam beradi.",
  },
  {
    id: 275,
    section: 'listening',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-B_006.mp3',
    script:
      '女：明日の歓迎会、来られる？\n男：残念だけど、急にバイトのシフトが入っちゃって行けないんだ。\n女：そうなんだ、残念。',
    questionText: '男[おとこ]の 人[ひと]は どうして パーティーに 行[い]けませんか。',
    options: [
      'アルバイトが 入[はい]って しまったから',
      '病気[びょうき]に なったから',
      '旅行[りょこう]に 行[い]くから',
      'お金[かね]が ないから',
    ],
    correctAnswer: 0,
    explanationUzbek: 'Kutilmaganda smenada yarim kunlik ish chiqib qolgani sababli borolmaydi.',
  },
];

export const JLPT_N3_MOCK_SET_3: ExamQuestion[] = [
  {
    id: 351,
    section: 'knowledge',
    questionText:
      'この プロジェクトは 全員[ぜんいん]の 協力[きょうりょく]の（もとに） 成功[せいこう]した。',
    options: ['もとに', 'うしろに', 'あいだに', 'まえに'],
    correctAnswer: 0,
    explanationUzbek:
      "Biror narsaning rahnamoligi yoki ko'magi ostida: 〜のもとに (yordami ostida).",
  },
  {
    id: 352,
    section: 'knowledge',
    questionText: '新商品の 発売[はつばい]を 来月[らいげつ]に（延期[えんき]）することになった。',
    options: ['えんちょう', 'えんき', 'ちゅうし', 'はいし'],
    correctAnswer: 1,
    explanationUzbek:
      "「延期」（kechiktirish, muddatini surish）ning to'g'ri o'qilishi — えんき (enki).",
  },
  {
    id: 353,
    section: 'knowledge',
    questionText: '最近[さいきん]の 若者[わかもの]は スマートフォンに（依存[いぞん]）しがちだ。',
    options: ['いそん', 'たいぞん', 'いぞん', 'よりぞん'],
    correctAnswer: 2,
    explanationUzbek: "«Bog'lanib/qaram bo'lib qolish» so'zining o'qilishi — 依存 (いぞん/いそん).",
  },
  {
    id: 354,
    section: 'knowledge',
    questionText: 'どんなに 忙[いそが]しくても、連絡[れんらく]ぐらい（すべきだ）。',
    options: ['するはずだ', 'するわけだ', 'するべきではない', 'すべきだ'],
    correctAnswer: 3,
    explanationUzbek: "Burch va umuminsoniy qoida sifatida: 〜べきだ (qilmog'i shart/lozim).",
  },
  {
    id: 355,
    section: 'knowledge',
    questionText: '彼[かれ]は 親切[しんせつ]な（反面[はんめん]）、怒[おこ]りっぽい ところも ある。',
    options: ['はんめん', 'うらめん', 'ぎゃくめん', 'たいめん'],
    correctAnswer: 0,
    explanationUzbek: '«Bir tomondan... ikkinchi tomondan esa»: 反面 (はんめん - hanmen).',
  },
  {
    id: 356,
    section: 'knowledge',
    questionText:
      'この 店[みせ]の パンは 美味[おい]しい（ばかりでなく）、値段[ねだん]も 手頃[てごろ]だ。',
    options: ['ばかりか', 'ばかりでなく', 'ほどではなく', 'きりではなく'],
    correctAnswer: 1,
    explanationUzbek: '«Faqatgina u emas, balki... ham»: 〜ばかりでなく.',
  },
  {
    id: 357,
    section: 'knowledge',
    questionText:
      '試験[しけん]が 近[ちか]づく（にしたがって）、緊張感[きんちょうかん]が 高[たか]まってきた。',
    options: ['にともなって', 'にたいして', 'にしたがって', 'について'],
    correctAnswer: 2,
    explanationUzbek: 'Biror holat rivojlanishi bilan mutanosib ravishda: 〜にしたがって.',
  },
  {
    id: 358,
    section: 'knowledge',
    questionText:
      '田中[たなか]さんが 犯人[はんにん]の（はずがない）。彼[かれ]は その時[とき] 旅行中[りょこうちゅう]だった。',
    options: ['わけがない', 'にちがいない', 'かもしれない', 'はずがない'],
    correctAnswer: 3,
    explanationUzbek: "Kuchli mantiqiy inkor: «bunday bo'lishi aslo mumkin emas» — 〜はずがない.",
  },
  {
    id: 359,
    section: 'knowledge',
    questionText: '風邪[かぜ]（気味[ぎみ]）で、頭[あたま]が ぼんやり しています。',
    options: ['ぎみ', 'っぽい', 'がち', 'だらけ'],
    correctAnswer: 0,
    explanationUzbek: 'Biroz shamollash alomati sezilayotganda: 風邪気味 (かぜぎみ).',
  },
  {
    id: 360,
    section: 'knowledge',
    questionText:
      '昨日[きのう]は 一日中[ついたちじゅう] 忙[いそが]しくて、食事[しょくじ]を（とる時間すらなかった）。',
    options: [
      'とる時間ばかりだった',
      'とる時間すらなかった',
      'とる時間だけだった',
      'とる時間どころだった',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Hatto eng oddiy narsaga ham imkon bo'lmaganda: 〜すら (hattoki ovqatlanishga vaqt ham bo'lmadi).",
  },
  {
    id: 361,
    section: 'knowledge',
    questionText: 'その 計画[けいかく]には （賛成[さんせい]）いたしかねます。',
    options: ['応援する', '賛成できる', '賛同できない', '歓迎する'],
    correctAnswer: 2,
    explanationUzbek:
      '«〜かねます» — vaziyat taqozosi bilan qila olmaslikni muloyim rad etish: 賛成いたしかねます = 賛同できない.',
  },
  {
    id: 362,
    section: 'knowledge',
    questionText:
      '環境[かんきょう]問題[もんだい]に（関心[かんしん]）を 持[も]つ 人[ひと]が 増[ふ]えている。',
    options: ['かんけい', 'かんかく', 'かんどう', 'かんしん'],
    correctAnswer: 3,
    explanationUzbek: "«Qiziqish, e'tibor» so'zining to'g'ri kanjisi — 関心 (かんしん).",
  },
  {
    id: 363,
    section: 'knowledge',
    questionText:
      'この 映画[えいが]は 大人[おとな]から 子供[こども]に（至[いた]るまで）、楽[たの]しめる。',
    options: ['いたるまで', 'わたるまで', 'かぎるまで', 'つづくまで'],
    correctAnswer: 0,
    explanationUzbek: 'Qamrov chegarasi: 〜から〜に至るまで (kattalardan tortib bolalargacha).',
  },
  {
    id: 364,
    section: 'reading',
    passageText:
      '挑戦なくして成長はありません。多くの人は失敗を恐れて新しい一歩を踏み出せなくなりますが、つまずきから得られる学びこそが、将来の確かな力となるのです。失敗を回避する安全策ばかりを選ぶのではなく、未知の課題に勇敢に向き合う姿勢が求められています。',
    questionText:
      '筆者[ひっしゃ]が この 文章[ぶんしょう]で 最[もっと]も 伝[つた]えたいことは 何[なに]ですか。',
    options: [
      '失敗[しっぱい]しないように 慎重[しんちょう]に 行動[こうどう]すべきである',
      '失敗[しっぱい]を 恐[おそ]れずに 挑戦[ちょうせん]する 姿勢[しせい]が 成長[せいちょう]に 不可欠[ふかけつ]である',
      '成功[せいこう]の ためには 他人[たにん]の 意見[いけん]を 聞[き]いてはならない',
      '目標[もくひょう]は 低[ひく]めに 設定[せってい]するのが よい',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Matnda xatolardan qo'rqmasdan yangi sinovlarga dadil intilish inson o'sishi uchun zarurligi ilgari surilgan.",
  },
  {
    id: 365,
    section: 'reading',
    passageText:
      '来月より導入されるフレックスタイム制およびリモートワーク制度は、従業員一人ひとりが生活リズムに合わせて柔軟に働く時間を設計することを目的としています。自律的なスケジュール管理が生産性の向上につながると期待されています。',
    questionText:
      '新[あたら]しい 勤務[きんむ]システムに よって、社員[しゃいん]には どのような 変化[へんか]が 期待[きたい]されますか。',
    options: [
      '残業代[ざんぎょうだい]が 自動的[じどうてき]に 2倍[ばい]に 増[ふ]えること',
      '毎日[まいにち] 必[かなら]ず 出社[しゅっしゃ]しなければならなくなること',
      '自分[じぶん]の 裁量[さいりょう]で 効率的[こうりつてき]に 時間[じかん]を 活用[かつよう]できること',
      '同僚[どうりょう]との コミュニケーションが 完全[かんぜん]に なくなること',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Xodimlarning o'z ixtiyori bilan vaqtni unumli rejalashtirishi ko'zda tutilgan.",
  },
  {
    id: 366,
    section: 'reading',
    passageText:
      '読書習慣に関する調査結果によると、20代の回答者の約65％が「主に電子書籍を利用している」と答えており、紙の書籍派を大きく上回りました。移動中の手軽さや保管場所をとらない利便性が支持される要因となっています。',
    questionText: 'この アンケート結果[けっか]から 読[よ]み取[と]れる 事実[じじつ]は どれですか。',
    options: [
      '高齢者[こうれいしゃ]の 9割[きゅうわり]が 電子書籍[でんししょせき]を 利用[りよう]して いる',
      '読書[どくしょ]をする 人[ひと]の 割合[わりあい]は 毎年[まいとし] 減少[げんしょう]して いる',
      '電子書籍[でんししょせき]の 値段[ねだん]は 紙[かみ]の 本[ほん]より 高[たか]い',
      '若年層[じゃくねんそう]ほど 紙[かみ]の 本[ほん]より 電子書籍[でんししょせき]を 好[この]む 傾向[けいこう]が ある',
    ],
    correctAnswer: 3,
    explanationUzbek:
      "So'rovnoma yoshlar orasida elektron kitoblarga qiziqish yuqoriligini ko'rsatgan.",
  },
  {
    id: 367,
    section: 'reading',
    passageText:
      '工場見学のお願い：安全管理上、サンダル、ハイヒール等でのご来場は固くお断りいたします。動きやすい靴と服装でお越しください。また、製造ライン内での無断撮影は禁止です。',
    questionText:
      '工場見学[こうじょうけんがく]に 参加[さんか]する 際[さい]の 注意事項[ちゅういじこう]として 正[ただ]しいものは どれですか。',
    options: [
      '安全[あんぜん]のため、サンダルや ハイヒールでの 参加[さんか]は 認[みと]められない',
      '工場内[こうじょうない]では 自由[じゆう]に 写真[しゃしん]を 撮影[さつえい]して よい',
      '小学生[しょうがくせい]以下[いか]の 子供[こども]は 保護者[ほごしゃ]なしで 見学[けんがく]できる',
      'ヘルメットの 着用[ちゃくよう]は 任意[にんい]である',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Xavfsizlik yuzasidan baland poshnali tufli va shippaklarda qatnashish qat'iyan man etiladi.",
  },
  {
    id: 368,
    section: 'reading',
    passageText:
      'AI技術の急速な進展により、定型的な計算やデータ処理は機械の得意分野となりました。これからの時代に人間にこそ求められるのは、他者の感情を深く汲み取り、対話を通じて新しい価値を生み出す共感力と創造性です。',
    questionText:
      '筆者[ひっしゃ]に よると、AI（人工知能[じんこうちのう]）時代[じだい]に 人間[にんげん]に 求[もと]められる 力[ちから]とは 何[なに]ですか。',
    options: [
      '膨大[ぼうだい]な データを 機械[きかい]より 早[はや]く 暗記[あんき]する 力',
      '他者[たしゃ]の 気持[きも]ちに 共感[きょうかん]し、創造的[そうぞうてき]に 協働[きょうどう]する 力[ちから]',
      '誰[だれ]とも 関[かか]わらずに 一人[ひとり]で 計算[けいさん]する 力',
      '過去[かこ]の 例[れい]を そのまま 丸暗記[まるあんき]する 力',
    ],
    correctAnswer: 1,
    explanationUzbek:
      'Insoniy hamdardlik, kreativlik va hamkorlikda ishlash fazilatlari talab etiladi.',
  },
  {
    id: 369,
    section: 'reading',
    passageText:
      '給水設備定期清掃のお知らせ：来週火曜日午前9時から午後1時まで、受水槽の清掃点検を行います。作業中は全館で断水となりますので、事前に飲料水等の確保をお願いいたします。',
    questionText: 'この お知らせの 目的[もくてき]は 何[なに]ですか。',
    options: [
      '水道料金[すいどうりょうきん]の 値上[ねあ]げの 通知[つうち]',
      '新[あたら]しい 水道管[すいどうかん]の 工事[こうじ]の 完了[かんりょう]報告[ほうこく]',
      '定期点検[ていきてんけん]に 伴[ともな]う 断水[だんすい]の 日時[にちじ]と 協力[きょうりょく]の 依頼[いらい]',
      'マンションの 管理人[かんりにん]の 交代[こうたい]挨拶[あいさつ]',
    ],
    correctAnswer: 2,
    explanationUzbek: "Rejali texnik ko'rik sababli suv o'chirilishi haqidagi ogohlantirish.",
  },
  {
    id: 370,
    section: 'listening',
    audioUrl: '/audio/choukai/n3/04 Track 4.mp3',
    script:
      '課長：田中君、さっきのA社からの件だけど、納期が遅れる可能性があるって本当かい？\n男：はい、先方からメールが入っておりました。\n課長：まずは先方の担当者に直接電話して、正確な状況を確認してくれ。\n男：承知いたしました、今すぐ電話します。',
    questionText: '男[おとこ]の 人[ひと]は これから まず 何[なに]を しますか。',
    options: [
      '会議室[かいぎしつ]の 予約[よやく]を 取[と]り消[け]す',
      '上司[じょうし]に 報告書[ほうこくしょ]を 提出[ていしゅつ]する',
      '昼休[ひるやす]みを 取[と]る',
      '取引先[とりひきさき]に 電話[でんわ]を かけて 納期[のうき]を 確認[かくにん]する',
    ],
    correctAnswer: 3,
    explanationUzbek: "Avval hamkor tashkilotga qo'ng'iroq qilib muddatni aniqlashtirishi kerak.",
  },
  {
    id: 371,
    section: 'listening',
    audioUrl: '/audio/choukai/n3/05 Track 5.mp3',
    script:
      '店員：こちらの光回線とスマートフォンのセットプランですと、毎月1500円の割引が適用されます。\n女：今別々に契約しているので、セットにしたほうがお得ですね。じゃあそれでお願いします。',
    questionText: '女[おんな]の 人[ひと]は どの プランを 申[もう]し込[こ]むことに しましたか。',
    options: [
      'インターネットと 携帯[けいたい]が セットになった 割引[わりびき]プラン',
      '通話[つうわ]のみの 基本[きほん]プラン',
      'データ無制限[むせいげん]の 単体[たんたい]プラン',
      '家族[かぞく]4人[よにん]の ファミリープラン',
    ],
    correctAnswer: 0,
    explanationUzbek: 'Internet va uyali aloqa birlashtirilgan chegirmali tarifni tanladi.',
  },
  {
    id: 372,
    section: 'listening',
    audioUrl: '/audio/choukai/n3/06 Track 6.mp3',
    script:
      '男：新年会の日程だけど、来月の第1金曜日は部長が出張なんだよね。\n女：第3金曜日は決算期でみんな忙しいですし、第2金曜日なら全員都合が合いそうですよ。\n男：よし、じゃあ第2金曜日で予約を取ろう。',
    questionText: '2人[ふたり]は 新年会[しんねんかい]の 日程[にってい]を いつに 決[き]めましたか。',
    options: [
      '今月[こんげつ]の 末[すえ]',
      '来月[らいげつ]の 第2金曜日[だいにきんようび]',
      '来月[らいげつ]の 初日[しょにち]',
      '再来月[さらいげつ]',
    ],
    correctAnswer: 1,
    explanationUzbek: "Kelasi oyning ikkinchi jumasi hamma uchun qulay bo'lgani sababli tanlandi.",
  },
  {
    id: 373,
    section: 'listening',
    audioUrl: '/audio/choukai/n3/07 Track 7.mp3',
    script:
      '女：プレゼン資料の3ページ目だけど、売上グラフの縦軸に「百万円」の単位が抜けているわよ。\n男：あ、本当ですね！すぐ修正して印刷し直します。',
    questionText:
      '女[おんな]の 人[ひと]が 指摘[してき]した 資料[しりょう]の 修正点[しゅうせいてん]は どこですか。',
    options: [
      '表紙[ひょうし]の タイトルが 間違[まちが]えて いる点',
      'ページ番号[ばんごう]が ない点',
      '最新[さいしん]の 売上[うりあげ]グラフの 単位[たんい]が 抜[ぬ]けて いる点',
      'フォントサイズが 小[ちい]さすぎる点',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Sotuv diagrammasida o'lchov birligi (million yen) yozilmay qolgani ko'rsatildi.",
  },
  {
    id: 374,
    section: 'listening',
    audioUrl: '/audio/choukai/n3/08 Track 8.mp3',
    script:
      '先生：出願手続きですが、まず今週中に志望動機と自己PRの作文を書いて見せてください。願書の清書はそのあとで構いません。\n学生：はい、まず作文ですね。頑張って書きます。',
    questionText:
      '留学生[りゅうがくせい]は これから まず 何[なに]を 書[か]かなければ なりませんか。',
    options: [
      '履歴書[りれきしょ]の 職歴[しょくれき]',
      '健康[けんこう]診断書[しんだんしょ]',
      '推薦状[すいせんじょう]',
      '自己[じこ]PRと 志望[しぼう]理由[りゆう]の 作文[さくぶん]',
    ],
    correctAnswer: 3,
    explanationUzbek:
      "O'zini tanishtirish va tanlagan mutaxassislik sabablarini bayon qiluvchi insho yozishi kerak.",
  },
  {
    id: 375,
    section: 'listening',
    audioUrl: '/audio/choukai/n3/09 Track 9.mp3',
    script:
      '店員：こちらは特殊ナイロン製で、わずか400グラムと非常に軽量ですが、強い雨にも耐える高い防水性を持っています。\n男：ノートパソコンを持ち歩くので、軽くて濡れないのは一番助かりますね。これにします。',
    questionText:
      '男[おとこ]の 人[ひと]が この 鞄[かばん]を 気[き]に 入[い]った 理由[りゆう]は 何[なに]ですか。',
    options: [
      '軽[かる]くて 防水[ぼうすい]機能[きのう]が 優[すぐ]れて いるところ',
      'デザインが 派手[はで]なところ',
      '革[かわ]が 高級[こうきゅう]なところ',
      '鍵[かぎ]が 3つ 付[つ]いて いるところ',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Sumkaning juda yengil va suv o'tkazmas (vodonepronitsayemyy) xususiyati yoqdi.",
  },
];

export const JLPT_N2_MOCK_SET_3: ExamQuestion[] = [
  {
    id: 451,
    section: 'knowledge',
    questionText:
      '政府[せいふ]は 景気[けいき]の 回復[かいふく]を（目指[めざ]して）、新[あたら]しい 経済[けいざい]対策[たいさく]を 打[う]ち出[だ]した。',
    options: ['めざして', 'めがけて', 'ねらって', 'むかって'],
    correctAnswer: 0,
    explanationUzbek: "«Maqsad qilib intilmoq» ma'nosidagi fe'l — 目指して (めざして).",
  },
  {
    id: 452,
    section: 'knowledge',
    questionText:
      '今回[こんかい]の 不祥事[ふしょうじ]は、組織[そしき]の 隠蔽[いんぺい]体質[たいしつ]に（起因[きいん]）する ものだ。',
    options: ['おこいん', 'きいん', 'はついん', 'げんいん'],
    correctAnswer: 1,
    explanationUzbek: "«...dan kelib chiqmoq / sabab bo'lmoq»: 起因 (きいん - kiin).",
  },
  {
    id: 453,
    section: 'knowledge',
    questionText:
      'いかに 困難[こんなん]な 状況[じょうきょう]で（あろうと）、最後[さいご]まで 諦[あきら]めない。',
    options: ['あろうが', 'あっても', 'あろうと', 'あるまいと'],
    correctAnswer: 2,
    explanationUzbek: "Kuchli iroda bilan «qanchalik og'ir bo'lmasin»: 〜であろうと.",
  },
  {
    id: 454,
    section: 'knowledge',
    questionText:
      '両国[りょうこく]の 首脳[しゅのう]は 領土[りょうど]問題[もんだい]を（めぐって）、激[はげ]しい 議論[ぎろん]を 交[か]わした。',
    options: ['こめて', 'つうじて', 'とおして', 'めぐって'],
    correctAnswer: 3,
    explanationUzbek: 'Biror bahsli mavzu atrofida tortishuv: 〜をめぐって.',
  },
  {
    id: 455,
    section: 'knowledge',
    questionText:
      '市民[しみん]の 声[こえ]を（踏[ふ]まえて）、都市[とし]再開発[さいかいはつ]の 計画[けいかく]を 見直[みなお]す。',
    options: ['ふまえて', 'かまえて', 'おさえて', 'とらえて'],
    correctAnswer: 0,
    explanationUzbek: 'Fikr va takliflarni asos qilib olgan holda: 〜を踏まえて (tayangan holda).',
  },
  {
    id: 456,
    section: 'knowledge',
    questionText:
      'こんな 重大[じゅうだい]な 決定[けってい]を、私[わたし]の一存[いちぞん]では（決[き]めかねます）。',
    options: ['決められます', '決めかねます', '決めるべきです', '決めかねません'],
    correctAnswer: 1,
    explanationUzbek:
      "Vaziyat nozikligi tufayli bir o'zi hal qila olmasligini bildirish: 〜かねます.",
  },
  {
    id: 457,
    section: 'knowledge',
    questionText:
      '調査[ちょうさ]の 結果[けっか]は、私[わたし]たちの 予想[よそう]に（反[はん]して）、大幅[おおはば]な 黒字[くろじ]だった。',
    options: ['そくして', 'たいして', 'はんして', 'こたえて'],
    correctAnswer: 2,
    explanationUzbek: 'Kutilgan taxminga zid ravishda: 〜に反して (予想に反して).',
  },
  {
    id: 458,
    section: 'knowledge',
    questionText:
      '日頃[ひごろ]の 努力[どりょく]（なしには）、このような 快挙[かいきょ]は 達成[たっせい]できなかった。',
    options: ['ぬきには', 'からには', 'うえないでは', 'なしには'],
    correctAnswer: 3,
    explanationUzbek: "«...siz aslo bo'lmasdi»: 〜なしには / 〜なくしては.",
  },
  {
    id: 459,
    section: 'knowledge',
    questionText:
      '彼[かれ]の 成功[せいこう]は 天才[てんさい]的な 才能[さいのう]の（たまもの）と 言[い]える。',
    options: ['努力の結晶', '偶然の産物', '単なる幸運', '他人の援助'],
    correctAnswer: 0,
    explanationUzbek: "«たまもの» — uzoq mehnatu sa'y-harakatning mevasi, samarali natijasi.",
  },
  {
    id: 460,
    section: 'knowledge',
    questionText:
      '契約書[けいやくしょ]の 条件[じょうけん]を （厳格[げんかく]）に 遵守[じゅんしゅ]する。',
    options: ['ごんかく', 'げんかく', 'きゅうかく', 'りつかく'],
    correctAnswer: 1,
    explanationUzbek: "«Qat'iy, shafqatsiz darajada aniq»: 厳格 (げんかく).",
  },
  {
    id: 461,
    section: 'knowledge',
    questionText: '彼[かれ]は どんなに 忙[いそが]しくても、笑顔[えがお]を（絶[た]やさない）。',
    options: ['きらさない', 'やめない', 'たやさない', 'すてない'],
    correctAnswer: 2,
    explanationUzbek: "Tabassumini aslo so'ndirmaydi/yo'qotmaydi: 笑顔を絶やさない.",
  },
  {
    id: 462,
    section: 'knowledge',
    questionText:
      '一度[いちど] 決[き]めた（以上[いじょう]）、最後[さいご]まで やり遂[と]げなければ ならない。',
    options: ['からには', 'うえは', 'ばかりに', 'いじょう'],
    correctAnswer: 3,
    explanationUzbek: '«Modomiki qaror qilingan ekan»: 〜以上 (〜以上は).',
  },
  {
    id: 463,
    section: 'knowledge',
    questionText:
      '彼[かれ]の 言動[げんどう]には、いささか 疑問[ぎもん]を（抱[いだ]かざるを得ない）。',
    options: [
      'いだかざるをえない',
      'いだかざるをえないわけがない',
      'いだかざるをえないはずだ',
      'いだくべきではない',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Majburan shubhalanishga to'g'ri keladi: 〜ざるを得ない (qilmaslikning iloji yo'q).",
  },
  {
    id: 464,
    section: 'reading',
    passageText:
      'かつての指導者像は、強烈なカリスマ性と絶対的な命令権で集団を牽引するトップダウン型でした。しかし複雑化した現代社会において真のリーダーシップとは、部下一人ひとりの自発性と強みを最大限に引き出し、背中を支える「サーバント・リーダー」としての伴走力にほかなりません。',
    questionText:
      '筆者[ひっしゃ]が 主張[しゅちょう]する「真[しん]の リーダーシップ」とは どのような ものですか。',
    options: [
      'すべてを 独断[どくだん]で 決[き]めて 部下[ぶか]に 命令[めいれい]を 下[くだ]すこと',
      '権力[けんりょく]で 従[したが]わせるのではなく、組織[そしき]の 潜在能力[せんざいのうりょく]を 引[ひ]き出[だ]す 伴走者[ばんそうしゃ]であること',
      '失敗[しっぱい]の 責任[せきにん]を すべて 部下[ぶか]に 負[お]わせること',
      '何[なに]も 指示[しじ]を出さず 現場[げんば]に 丸投[まるな]げすること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Haqiqiy rahbarlik buyruqbozlik emas, balki xodimlarning imkoniyatlarini yuzaga chiqaruvchi hamroh bo'lishdir.",
  },
  {
    id: 465,
    section: 'reading',
    passageText:
      '現代のマーケティングにおいて注目されるのは、「モノ消費」から「コト消費」への明確な転換です。消費者は単に製品の機能やスペックを満たすこと以上に、その商品を通じてどのような人生経験や感動、他者との物語を共有できるかというエモーショナルな価値を購買基準に据えています。',
    questionText:
      '現代[げんだい]の 消費者[しょうひひしゃ]行動[こうどう]の 特徴[とくちょう]として 述[の]べられているものは どれですか。',
    options: [
      '安ければ品質はどうでもよいという極端な価格至上主義',
      '他人の評判は一切気にせず直感だけで購買を決定すること',
      '単なる「モノの所有」から、特別な体験や共感を重視する「コト消費」へのシフト',
      '店舗での対面販売しか信用しない傾向の強まり',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Oddiy buyumga egalik qilishdan ko'ra noyob tajriba va taassurot orttirish muhim ahamiyat kasb etmoqda.",
  },
  {
    id: 466,
    section: 'reading',
    passageText:
      '在宅勤務の定着は業務効率化をもたらした一方で、オフィスの給湯室や廊下で交わされていた何気ない雑談の機会を奪いました。異なる部門同士の偶発的なアイデアの衝突（セレンディピティ）や組織への帰属意識の醸成という観点から、長期的な弊害を指摘する声も少なくありません。',
    questionText:
      'リモートワークが 企業[きぎょう]文化[ぶんか]に 与[あた]える 潜在的[せんざいてき]な リスクとして 懸念[けねん]されているものは 何[なに]ですか。',
    options: [
      '通勤時間がなくなることで従業員の睡眠時間が過剰になること',
      '紙の書類が減りすぎてオフィスが整頓されすぎること',
      '世界中の優秀な人材を採用できるようになること',
      '偶発的[ぐうはつてき]な 雑談[ざつだん]や 交流[こうりゅう]が 減少[げんしょう]し、組織[そしき]の 一体感[いったいかん]や 創発性[そうはつせい]が 損[そこ]なわれること',
    ],
    correctAnswer: 3,
    explanationUzbek:
      "Kutilmagan tasodifiy suhbatlarning kamayishi sababli ijodiy g'oyalar va jamoaviy birlik susayishi xavfi bor.",
  },
  {
    id: 467,
    section: 'reading',
    passageText:
      '後継者不足に悩む各地の伝統工芸ですが、単に古典的な様式を墨守するだけでは市場から取り残されます。受け継がれてきた精緻な手技の核心を守りながら、現代の住空間や海外の食卓に調和するモダンな意匠へと再構築する試みが、再生の突破口となっています。',
    questionText:
      '伝統工芸[でんとうこうげい]の 継承[けいしょう]における 課題[かだい]と 解決策[かいけつさく]として 適切[てきせつ]なものは どれですか。',
    options: [
      '伝統[でんとう]の 技法[ぎほう]を 守[まも]りつつ、現代[げんだい]の ライフスタイルに 合[あ]わせた 新製品[しんせいひん]を 開発[かいはつ]すること',
      '昔ながらのデザインを絶対に変えずに高価格で維持し続けること',
      '職人の手作業をすべてロボットによる大量生産に切り替えること',
      '後継者がいないため自然に産業が消滅するのを待つこと',
    ],
    correctAnswer: 0,
    explanationUzbek:
      'Qadimiy hunarmandchilik mahoratini asragan holda zamonaviy hayotga mos yangi dizaynlarni joriy etish.',
  },
  {
    id: 468,
    section: 'reading',
    passageText:
      '科学技術の発展は人類に計り知れない恩恵をもたらしてきましたが、遺伝子編集や人工知能の暴走など、一歩間違えれば不可逆的な災厄を招くリスクを孕んでいます。技術決定論に陥ることなく、倫理的・社会的な合意形成を市民を交えて継続していくリテラシーが不可欠です。',
    questionText:
      '筆者[ひっしゃ]の 科学[かがく]技術[ぎじゅつ]に 対[たい]する 立場[たちば]は どのような ものですか。',
    options: [
      '科学の進展は常に絶対善であり、いかなる規制も加えるべきではない',
      '技術[ぎじゅつ]の 進歩[しんぽ]を 盲信[もうしん]せず、倫理的[りんりてき]な 影響[えいきょう]を 絶[た]えず 吟味[ぎんみ]する 社会的[しゃかいてき] 対話[たいわ]が 不可欠[ふかけつ]である',
      '危険な新技術はすべて開発を即座に中止し原始的な生活に戻るべきだ',
      '専門家だけにすべての判断を委ね、一般市民は沈黙を守るべきだ',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Texnologiyaga ko'r-ko'rona ishonmasdan, axloqiy va ijtimoiy oqibatlarni chuqur muhokama qilish lozim.",
  },
  {
    id: 469,
    section: 'reading',
    passageText:
      '複言語を話す能力は、単なる意思疎通の道具に留まりません。異なる文法体系や文化的前提を行き来することで、自己の思考の枠組みを相対化し、多角的な視点から物事の本質を見極める柔軟なメタ認知能力を育む契機となります。',
    questionText:
      '多言語[たげんご]教育[きょういく]が もたらす 最大[さいだい]の メリットとして 述[の]べられているものは どれですか。',
    options: [
      '将来必ず外交官になって大金を稼げるようになること',
      '母国語の文法や語彙を完全に忘れて新しい人格になれること',
      '単なる 言語[げんご]の 習得[しゅうとく]に 留[とど]まらず、多様[たよう]な 視点[してん]から 物事[ものごと]を 捉[とら]える 柔軟[じゅうなん]な 思考力[しこうりょく]が 養[やしな]われること',
      '外国語を話すときだけ性格が攻撃的になれること',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Shunchaki til o'rganish emas, balki dunyoga turli rakurslardan qaray oladigan teran tafakkurni shakllantiradi.",
  },
  {
    id: 470,
    section: 'listening',
    audioUrl: '/audio/choukai/n2/Track04.mp3',
    script:
      '司会：新型ウェアラブル端末ですが、ユーザーからのフィードバックはいかがですか。\n男：処理速度やセンサーの精度は高く評価されていますが、連続稼働時間が12時間程度と短く、高負荷時の発熱を気にする声が寄せられています。次世代モデルでは、省電力チップの採用によるバッテリー持続時間の延長と放熱機構の抜本的見直しに最優先で取り組みます。',
    questionText:
      '男[おとこ]の 開発者[かいはつしゃ]は 今後[こんご] どこを 重点的[じゅうてんてき]に 改良[かいりょう]する 予定[よてい]ですか。',
    options: [
      '本体[ほんたい]の カラーバリエーション',
      'スピーカーの 音質[おんしつ]',
      'パッケージの デザイン',
      'バッテリーの 駆動[くどう]時間[じかん]と 放熱[ほうねつ]効率[こうりつ]',
    ],
    correctAnswer: 3,
    explanationUzbek:
      "Batareyaning ishlash muddatini uzaytirish va qizib ketmasligini ta'minlashga e'tibor qaratiladi.",
  },
  {
    id: 471,
    section: 'listening',
    audioUrl: '/audio/choukai/n2/Track05.mp3',
    script:
      '女：ネットバンキングの普及により、単純な振り込みや口座照会で来店されるお客様は減少しています。だからこそ店舗に求められるのは、相続や資産承継など、対面でじっくりと個別のライフプランに寄り添う質の高いコンサルティング力の強化です。行員の専門知識研修を急ぎます。',
    questionText:
      '女[おんな]の 支店長[してんちょう]が 最優先[さいゆうせん]で 取り組[とりく]むべきと 考[かんが]えている 施策[しさく]は 何[なに]ですか。',
    options: [
      '顧客[こきゃく]一人ひとりの ニーズに 合[あ]わせた 資産[しさん]運用[うんよう]コンサルティングの 強化[きょうか]',
      '支店の 窓口[まどぐち]営業[えいぎょう]時間[じかん]の 延長[えんちょう]',
      '新規[しんき]口座[こうざ]開設[かいせつ]の 手数料[てすうりょう]の 引き下げ',
      'テレビCMの 放送[ほうそう]回数[かいすう]の 増加[ぞうか]',
    ],
    correctAnswer: 0,
    explanationUzbek:
      'Mijozlarning ehtiyojlariga mos professional moliyaviy maslahat berish xizmatini kuchaytirish.',
  },
  {
    id: 472,
    section: 'listening',
    audioUrl: '/audio/choukai/n2/Track06.mp3',
    script:
      '町長：当町が目指すのは、観光バスで短時間立ち寄ってゴミだけを残していくような大量消費型の観光ではありません。豊かな森林や古民家での暮らしを体験してもらい、数日間ゆっくりと滞在していただく持続可能なエコツーリズムこそが、地域経済に真の活力を生み出します。',
    questionText:
      '町長[ちょうちょう]は 観光[かんこう]振興[しんこう]のために どのような 方針[ほうしん]を 示[しめ]しましたか。',
    options: [
      '大型[おおがた]リゾートホテルを 多数[たすう] 誘致[ゆうち]すること',
      '自然[しぜん]や 歴史[れきし]資源[しげん]を 生[い]かした 長期[ちょうき]滞在型[たいざいがた]の エコツーリズムの 推進[すいしん]',
      '外国人[がいこくじん]観光客[かんこうきゃく]の 入場[にゅうじょう]を 制限[せいげん]すること',
      '観光地[かんこうち]の 入場料[にゅうじょうりょう]を 完全[かんぜん]無料[むりょう]に すること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      'Tabiat va tarixiy merosga asoslangan ekoturizmni rivojlantirish orqali uzoq muddatli mehmonlarni jalb qilish.',
  },
  {
    id: 473,
    section: 'listening',
    audioUrl: '/audio/choukai/n2/Track07.mp3',
    script:
      '研究員：今回開発された植物由来のセルロースナノファイバー複合体は、重量は鉄の5分の1でありながら、強度は鋼鉄の5倍以上を誇ります。さらに廃棄時には微生物によって完全に土に還る生分解性を備えており、自動車の車体軽量化と脱炭素化を同時に実現します。',
    questionText:
      '研究所[けんきゅうじょ]の 発表[はっぴょう]に よると、新素材[しんそざい]の 最大[さいだい]の 利点[りてん]は 何[なに]ですか。',
    options: [
      '製造コストが プラスチックの 10倍[じゅうばい] かかる点',
      '火[ひ]に 弱[よわ]く 溶[と]けやすい 点',
      '軽量[けいりょう]でありながら 鋼鉄[こうてつ]の 5倍[ごばい]の 強度[きょうど]を 持[も]ち、自然[しぜん]分解[ぶんかい]される 点',
      'リサイクルが 不可能[ふかのう]な 点',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Juda yengil bo'lishiga qaramay po'latdan 5 barobar mustahkam va tabiatda o'z-o'zidan parchalanadi.",
  },
  {
    id: 474,
    section: 'listening',
    audioUrl: '/audio/choukai/n2/Track08.mp3',
    script:
      '女：生産性を高めるためには、無駄な承認手続きを撤廃し、完全にペーパーレス化を進める必要があります。そのうえで、希望者を対象に週休3日制をトライアル導入し、心身のリフレッシュが創造的な成果にどう寄与するか検証してはどうでしょうか。',
    questionText:
      '女性[じょせい]が 提案[ていあん]した 働き方[はたらきかた]改革[かいかく]の 具体策[ぐたいさく]は どれですか。',
    options: [
      'すべての 会議[かいぎ]の 時間[じかん]を 2倍[ばい]に 延[の]ばすこと',
      '有給[ゆうきゅう]休暇[きゅうか]の 取得[しゅとく]を 禁止[きんし]すること',
      '全員[ぜんいん]が 深夜[しんや]まで 残業[ざんぎょう]すること',
      '週休[しゅうきゅう]3日制[みっかせい]の 試験[しけん]導入[どうにゅう]と 業務[ぎょうむ]の ペーパーレス化[か]',
    ],
    correctAnswer: 3,
    explanationUzbek:
      "Haftada 3 kunlik dam olish rejimini sinovdan o'tkazish va qog'ozsiz tizimga o'tish taklif etildi.",
  },
  {
    id: 475,
    section: 'listening',
    audioUrl: '/audio/choukai/n2/Track09.mp3',
    script:
      '担当者：ビザ更新のための在籍証明書および推薦書の発行申請ですが、入国管理局の審査スケジュール上、今月末の金曜日午後5時で締め切ります。1分でも遅れると翌月処理となり、在留期限が切れる恐れがありますので厳守してください。',
    questionText:
      '大学[だいがく]の 事務[じむ]スタッフが 留学生[りゅうがくせい]に 伝[つた]えている 手続き[てつづき]の 期限[きげん]は いつですか。',
    options: [
      '今月[こんげつ]末[まつ]の 金曜日[きんようび] 午後[ごご]5時[ごじ]まで',
      '来週[らいしゅう]の 月曜日[げつようび] 朝[あさ]9時[くじ]',
      '来月[らいげつ]の 15日[じゅうごにち]',
      'いつでも 提出[ていしゅつ]可能[かのう]',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Shu oyning oxirgi juma kuni soat 17:00 ga qadar topshirish qat'iy belgilangan.",
  },
];

export const JLPT_N1_MOCK_SET_3: ExamQuestion[] = [
  {
    id: 551,
    section: 'knowledge',
    questionText:
      '長年[ながねん]の 宿願[しゅくがん]が ようやく 達成[たっせい]され、（感慨[かんがい]無量[むりょう]）である。',
    options: ['かんがいむりょう', 'かんげきむりょう', 'かんしょうむりょう', 'かんしんむりょう'],
    correctAnswer: 0,
    explanationUzbek:
      "Cheksiz taassurot va yuksak his-tuyg'ular og'ushida: 感慨無量 (かんがいむりょう).",
  },
  {
    id: 552,
    section: 'knowledge',
    questionText:
      '法案[ほうあん]の 成立[せいりつ]に 向け、野党[やとう]との 妥協点[だきょうてん]を（模索[もさく]）する。',
    options: ['ぼさく', 'もさく', 'めいさく', 'ばくさく'],
    correctAnswer: 1,
    explanationUzbek: "«Paypaslab to'g'ri yo'l qidirmoq»: 模索 (もさく).",
  },
  {
    id: 553,
    section: 'knowledge',
    questionText:
      'あの 政治家[せいじか]の 発言[はつげん]は、無責任[むせきにん]（極[きわ]まりない）。',
    options: ['かぎりない', 'たえない', 'きわまりない', 'やまない'],
    correctAnswer: 2,
    explanationUzbek: "Had-hududsiz salbiy ma'noda: 〜極まりない (nihoyatda mas'uliyatsiz).",
  },
  {
    id: 554,
    section: 'knowledge',
    questionText:
      '一国[いっこく]の 首相[しゅしょう]（たるもの）、国家[こっか]の 将来[しょうらい]に 責任[せきにん]を 持[も]つべきだ。',
    options: ['ともあろうもの', 'としたところで', 'ならではの', 'たるもの'],
    correctAnswer: 3,
    explanationUzbek: '«...dek yuqori maqomdagi shaxsga loyiq ravishda»: 〜たるもの.',
  },
  {
    id: 555,
    section: 'knowledge',
    questionText:
      '天候[てんこう]の 急変[きゅうへん]に より、登山[とざん]ルートの 変更[へんこう]を（余儀[よぎ]なくされた）。',
    options: ['よぎなくされた', 'やむをえなくなった', 'よぎなくさせた', 'しぜんとなった'],
    correctAnswer: 0,
    explanationUzbek: 'Tashqi favqulodda omillar sababli noiloj majbur qolmoq: 〜を余儀なくされた.',
  },
  {
    id: 556,
    section: 'knowledge',
    questionText:
      'たとえ 誰[だれ]で（あれ）、法[ほう]の 前[まえ]には 平等[びょうどう]で なければ ならない。',
    options: ['あれども', 'あれ', 'あろうとも', 'ありながら'],
    correctAnswer: 1,
    explanationUzbek: "«Kim bo'lishidan qat'i nazar»: 〜であれ.",
  },
  {
    id: 557,
    section: 'knowledge',
    questionText:
      '伝統[でんとう]の 技[わざ]と 最新[さいしん]の テクノロジーが（相[あい]まって）、比類[ひるい]なき 名品[めいひん]が 生[う]まれた。',
    options: ['かさなって', 'ひきかえて', 'あいまって', 'かこつけて'],
    correctAnswer: 2,
    explanationUzbek:
      "Ikki buyuk kuch birlashib yanada kuchayishi: 〜と相まって (qo'shilib, uyg'unlashib).",
  },
  {
    id: 558,
    section: 'knowledge',
    questionText:
      '彼女[かのじょ]は ピアノは（おろか）、バイオリンの 演奏[えんそう]に かけても 一流[いちりゅう]だ。',
    options: ['さることながら', 'ばかりか', 'どころか', 'おろか'],
    correctAnswer: 3,
    explanationUzbek: '«U yoqda tursin, hatto...»: 〜はおろか.',
  },
  {
    id: 559,
    section: 'knowledge',
    questionText:
      '今日[きょう]の 出来事[できごと]は、私[わたし]の 生涯[しょうがい]において 忘[わす]れる（まじき） 屈辱[くつじょく]である。',
    options: ['まじき', 'べからざる', 'べからず', 'まじきこと'],
    correctAnswer: 0,
    explanationUzbek: "«Aslo sodir bo'lmasligi lozim bo'lgan»: 〜まじき.",
  },
  {
    id: 560,
    section: 'knowledge',
    questionText:
      '会社[かいしゃ]の 資金[しきん]を 私的[してき]に 流用[りゅうよう]するなど、言語[ごんご]（道断[どうだん]）だ。',
    options: ['とうだん', 'どうだん', 'さいだん', 'みちだん'],
    correctAnswer: 1,
    explanationUzbek:
      "Kechirib bo'lmas, so'z bilan ta'riflash mushkul yovuz qilmish: 言語道断 (ごんごどうだん).",
  },
  {
    id: 561,
    section: 'knowledge',
    questionText:
      '彼[かれ]の 論文[ろんぶん]は 既存[きぞん]の 定説[ていせつ]を 根底[こんてい]から 覆[くつがえ]す（画期的[かっきてき]）な ものだ。',
    options: ['かくきてき', 'がきてき', 'かっきてき', 'えつきてき'],
    correctAnswer: 2,
    explanationUzbek: '«Tarixiy burilish yasovchi davriy yangilik»: 画期的 (かっきてき).',
  },
  {
    id: 562,
    section: 'knowledge',
    questionText:
      '新体制[しんたいせい]の 発足[ほっそく]を（皮切[かわき]りに）、全社的[ぜんしゃてき]な 改革[かいかく]が 断行[だんこう]された。',
    options: ['かぎりに', 'おわりに', 'しめくくりに', 'かわきりに'],
    correctAnswer: 3,
    explanationUzbek:
      'Ketma-ket yirik voqealarning birinchi debochasi: 〜を皮切りに (boshlab berib).',
  },
  {
    id: 563,
    section: 'knowledge',
    questionText: '我々[われわれ]の 懸念[けねん]は （杞憂[きゆう]）に 終[お]わった。',
    options: ['取り越し苦労', '的確な予想', '重大な危機', '正当な判断'],
    correctAnswer: 0,
    explanationUzbek:
      '«杞憂» (qadimiy rivoyatdan kelib chiqqan) — keraksiz, asossiz vahima va havotir = 取り越し苦労.',
  },
  {
    id: 564,
    section: 'reading',
    passageText:
      '高度情報化社会がもたらした極限の効率化は、人間存在を交換可能な機能へと還元してしまいました。あらゆる関係性が費用対効果で計測される中で、個々人は全体との有機的な連帯を失い、自らの生の意味を実感できない根源的な孤独と疎外の淵に立たされているのです。',
    questionText:
      '筆者[ひっしゃ]の 述[の]べる「現代[げんだい]社会[しゃかい]の 疎外感[そがいかん]」の 根源[こんげん]は 何[なに]にあるとされていますか。',
    options: [
      '単純に物質的な富が不足していること',
      '効率[こうりつ]と 合理主義[ごうりしゅぎ]の 徹底[てってい]に より、人間[にんげん]が 生[い]きる 意味[いみ]や 全体性[ぜんたいせい]から 切[き]り離[はな]された 点',
      '科学技術の発展が完全に停止してしまったこと',
      '人々が過度に宗教的になりすぎたこと',
    ],
    correctAnswer: 1,
    explanationUzbek:
      'Samaradorlik va ratsionalizm natijasida inson butunlikdan va tiriklik mohiyatidan uzilib qolgani.',
  },
  {
    id: 565,
    section: 'reading',
    passageText:
      '芸術とは美的な装飾でも現実の客観的複写でもありません。それは私たちが自明のものとして疑わない日常の知覚フレームを根底から解体し、見慣れた世界を未知の驚異として再体験させる異化作用であり、感性のラディカルな変革を迫る闘争にほかなりません。',
    questionText:
      '芸術[げいじゅつ]の 本質[ほんしつ]について、筆者[ひっしゃ]は どのような 見解[けんかい]を 示[しめ]して いますか。',
    options: [
      '権力者のプロパガンダとして奉仕すること',
      '鑑賞者を退屈させずに眠らせるための娯楽',
      '現実[げんじつ]を 単[たん]に 模倣[もほう]するのではなく、日常[にちじょう]の 枠組[わくぐ]みを 揺[ゆ]るがし 新[あたら]しい 感受性[かんじゅせい]を 開眼[かいげん]させる 営[いとな]みである',
      '過去の古典作品を寸分違わず再現する職人芸',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "San'at oddiy taqlid emas, balki odatiy qarashlarni larzaga solib yangi idrok ufqlari ochishdir.",
  },
  {
    id: 566,
    section: 'reading',
    passageText:
      '私たちは言葉を用いて思考していると考えがちですが、むしろ私たちが特定の言語体系の網の目によって世界を意味づけられていると言えます。言語の持つ語彙や統語構造の違いは、そのまま事象の切り分け方や因果関係の捉え方の差異となり、主体の世界像を無意識のうちに構築しているのです。',
    questionText:
      '言語[げんご]と 思考[しこう]の 相関[そうかん]関係[かんけい]に 関[かん]する 記述[きじゅつ]として 最[もっと]も 適切[てきせつ]なものは どれですか。',
    options: [
      '人間は言語がなくても全く同じ深さで論理的思考を行える',
      'すべての言語は本質的に同一であり文化的差異は存在しない',
      '言語は思考の結果として生じる副産物にすぎない',
      '言語[げんご]は 単[たん]なる 伝達[でんたつ]の 道具[どうぐ]ではなく、人間[にんげん]が 世界[せかい]を 分節[ぶんせつ]し 認識[にんしき]する 構造[こうぞう]そのものを 規定[きてい]して いる',
    ],
    correctAnswer: 3,
    explanationUzbek:
      'Til shunchaki muloqot vositasi emas, inson ongining borliqni tushunish tizimini belgilaydi.',
  },
  {
    id: 567,
    section: 'reading',
    passageText:
      '国境を越えた資本と情報の浸透は、世界各地のローカルな生活様式や言語の多様性を平準化の波に晒しています。しかし同時に、この均質化への反作用として、足元の固有の風土や土着の知恵に宿る価値を地球規模の視座から再発見し、新しい文脈で蘇生させようとするダイナミズムも生まれています。',
    questionText:
      'グローバリズムが 地域[ちいき]文化[ぶんか]に 与[あた]える 功罪[こうざい]について 筆者[ひっしゃ]はどう 論[ろん]じて いますか。',
    options: [
      '画一的[かくいつてき]な 消費[しょうひ]文化[ぶんか]が 固有[こゆう]の 多様性[たようせい]を 侵食[しんしょく]する 一方[いっぽう]で、伝統[でんとう]の 価値[かち]を 再評価[さいひょうか]する 契機[けいき]にも なりうる',
      '地域文化はグローバル化によって完全に抹殺される運命にある',
      'グローバル化によって世界中のすべての文化が完全に均質化された',
      '地域文化は孤立を保ち、外来文化を一切排除すべきである',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Globallashuv bir xillashtiruvchi iste'mol madaniyatini yoysa-da, milliy merosni qayta anglash imkonini ham beradi.",
  },
  {
    id: 568,
    section: 'reading',
    passageText:
      'アルゴリズムは厖大な過去ログの相関関係から確率的に最も尤もらしい解を提示できますが、その選択に伴う痛みや不条理を引き受ける主客の一致は持ち得ません。正解のない葛藤の中で悩み抜き、自らの選択の重責を背負い続ける覚悟こそが、人間に固有の尊厳であり意思決定の本質です。',
    questionText:
      'AIの 判断[はんだん]と 人間[にんげん]の 意思[いし]決定[けってい]の 差異[さい]について、筆者[ひっしゃ]が 強調[きょうちょう]する 点[てん]は 何[なに]ですか。',
    options: [
      'AIの判断には一切の誤りがなく人間よりも常に倫理的である',
      'AIは 確率[かくりつ]計算[けいさん]に 基[づ]く 最適解[さいてきかい]を 出[だ]すが、結果[けっか]に 対[たい]する 倫理的[りんりてき]な 責任[せきにん]を 引[ひ]き受[う]けられるのは 人間[にんげん]だけである',
      '人間は感情に左右されるため、すべての司法判断をAIに代行させるべきだ',
      'AIと人間の意思決定プロセスには本質的な差異は全く存在しない',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "AI ehtimolliklar asosida optimal javob topsa-da, yuzaga keladigan natija uchun mas'uliyatni faqat inson oladi.",
  },
  {
    id: 569,
    section: 'reading',
    passageText:
      '私たちが触れる公認の歴史物語は、往々にして権力の正統性を担保するために勝者の論理で編纂された言説です。周縁に追いやられ、公的アーカイヴから消去された名もなき民衆の祈りや挫折の残響に耳を澄ませることなくして、真に豊かな歴史の厚みに肉薄することはできません。',
    questionText:
      '「歴史[れきし]の 叙述[じょじゅつ]」に ついて 筆者[ひっしゃ]が 警鐘[けいしょう]を 鳴[な]らして いる 内容[ないよう]は どれですか。',
    options: [
      '歴史教科書に書かれている記述はすべて疑いの余地のない絶対的真実である',
      '過去の出来事は現在の基準だけで断罪すれば十分である',
      '歴史[れきし]は 勝者[しょうしゃ]の 視点[してん]から 都合[つごう]よく 体系化[たいけいか]されがちであり、埋[う]もれた 敗者[はいしゃ]や 名[な]もなき 人々[ひとびと]の 声[こえ]を 掬[すく]い取[と]る 複眼[ふくがん]的[てき]な 読解[どっかい]が 欠[か]かせない',
      '記録に残っていない民衆の歴史は研究する価値が全くない',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Tarix ko'pincha g'oliblar manfaati bo'yicha tizimlashtirilgani bois, mag'lublar va xalq xotirasini ham o'rganish zarur.",
  },
  {
    id: 570,
    section: 'listening',
    audioUrl: '/audio/choukai/n1/n1_mock_q570.mp3',
    script:
      '司会：情報空間の進展が代議制民主主義に与える影響について、先生の率直な危機意識をお聞かせください。\n教授：SNS空間における推薦アルゴリズムは、利用者の既存の好悪や情動を増幅し、心地よい言説のみで周囲を囲い込むエコーチェンバー現象を不可避に生み出します。異質な他者との熟議や妥協の余地が削ぎ落とされ、敵対感情が過剰に煽られることで、民主主義の基盤である寛容と連帯が溶解しつつあるのです。',
    questionText:
      'シンポジウムにおいて、登壇者[とうだんしゃ]が 指摘[してき]する デジタル民主主義[みんしゅしゅぎ]の 構造的[こうぞうてき]な 脆弱性[ぜいじゃくせい]とは 何[なに]ですか。',
    options: [
      'インターネットの通信速度が遅すぎて投票が遅延する点',
      '政治家のSNSアカウントがハッキングされる危険性',
      '若者の投票率が異常に高くなりすぎること',
      'アルゴリズムによる 情報[じょうほう]の 偏向[へんこう]（エコーチェンバー）が 社会[しゃかい]の 分断[ぶんだん]と ポピュリズムを 加速[かそく]させる 点',
    ],
    correctAnswer: 3,
    explanationUzbek:
      "Algoritmlar keltirib chiqaradigan axborot pufagi (echo chamber) jamiyatning qutblanishi va bo'linishini tezlashtiradi.",
  },
  {
    id: 571,
    section: 'listening',
    audioUrl: '/audio/choukai/n1/n1_mock_q571.mp3',
    script:
      '人類学者：マルセル・モースが論じたように、人間社会における贈与は決して純粋な好意のみでは完結しません。贈り物を受け取った瞬間、受贈者の内面には「お返しをしなければならない」という無形の負債感が生じます。この返礼の義務が果たされない限り、贈与者と受贈者の間には不可避な非対称性、すなわち一種の力関係が刻み込まれることになるのです。',
    questionText:
      '文化[ぶんか]人類学者[じんるいがくしゃ]が 述[の]べる「贈与[ぞうよ]の 逆説[ぎゃくせつ]」とは どのような 内容[ないよう]ですか。',
    options: [
      '純粋[じゅんすい]な 無償[むしょう]の 贈与[ぞうよ]に 見[み]えても、受[う]け手[て]に 返礼[へんれい]の 義務[ぎむ]や 負債感[ふさいかん]を 生[う]じさせ、非対称[ひたいしょう]な 権力[けんりょく]関係[かんけい]を 構築[こうちく]する 点',
      '贈り物は常に金額が高ければ高いほど人間関係が円滑になる点',
      'プレゼントを貰ったら即座に同じものを買い与えなければ法的に罰せられる点',
      '原始社会において物品の交換は一切行われていなかった点',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Beg'araz sovg'adek ko'rinsa-da, qabul qiluvchida qaytarish majburiyatini va qaramlik hissini paydo qiladi.",
  },
  {
    id: 572,
    section: 'listening',
    audioUrl: '/audio/choukai/n1/n1_mock_q572.mp3',
    script:
      '経済学者：従来の大量生産・大量消費・大量廃棄という「リニア（線形）経済」は、地球環境の臨界点を超えようとしています。求められているのは、単に使用済み製品をリサイクルするという対症療法ではなく、設計の初期段階から再利用や分解を前提とし、資源が半永久的に循環し続けるビジネスモデルの再構築です。',
    questionText:
      '経済学者[けいざいがくしゃ]が 提言[ていげん]する「循環型[じゅんかんがた] 経済[けいざい]（サーキュラー・エコノミー）」の 核心[かくしん]は 何[なに]ですか。',
    options: [
      '壊れた製品はすべて発展途上国へ輸出して処理すること',
      '製品[せいひん]の 企画[きかく]・設計[せっけい] 段階[だんかい]から 廃棄物[はいきぶつ]を 出[だ]さない ループを 組[く]み込[こ]み、資源[しげん]の 価値[かち]を 最大限[さいだいげん]に 維持[いじ]し 続[つづ]けること',
      '消費者が買い物を一切やめて自給自足の原始生活を送ること',
      'リサイクルマークを印刷するだけで実際は焼却処分を続けること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Mahsulotni yaratish va loyihalash bosqichidanoq chiqindi chiqarmaydigan to'liq aylanma tizimni joriy etish.",
  },
  {
    id: 573,
    section: 'listening',
    audioUrl: '/audio/choukai/n1/n1_mock_q573.mp3',
    script:
      '哲学者：レイコフとジョンソンが明らかにしたように、メタファーは単なる文学的装飾ではありません。「時間は金である」や「議論は戦争である」という表現が示すように、私たちは未知の抽象的な領域を、自らの身体を通じた具体的で馴染みのある経験へと写像することで初めて認識しています。メタファーこそが人間の概念体系の根幹を規定しているのです。',
    questionText:
      '言語[げんご]哲学者[てつがくしゃ]の 講義[こうぎ]に おいて、メタファー（隠喩[いんゆ]）の 認知的[にんちてき] 機能[きのう]として 説明[せつめい]されたものは どれですか。',
    options: [
      '単に詩人や文学者が文章を華やかに飾るための修辞的テクニックにすぎないこと',
      '日常会話においては誤解を招くだけなので絶対に使用してはならない言葉遣いであること',
      '未知[みち]の 抽象的[ちゅうしょうてき]な 概念[がいねん]を、身体的[しんたいてき]で 具体的[ぐたいてき]な 経験[けいけん]に 投射[とうしゃ]して 理解[りかい]を 可能[かのう]に する 基盤[きばん]的[てき]な 思考[しこう]の 枠組[わくぐ]みであること',
      '辞書に載っていない造語を勝手に作り出して相手を混乱させる行為であること',
    ],
    correctAnswer: 2,
    explanationUzbek:
      'Metafora nafaqat badiiy vosita, balki murakkab mavhum tushunchalarni tana va tajriba orqali idrok etish tizimidir.',
  },
  {
    id: 574,
    section: 'listening',
    audioUrl: '/audio/choukai/n1/n1_mock_q574.mp3',
    script:
      '専門家：パリをはじめ欧州で提唱されている15分都市構想は、過度な車依存と長距離通勤からの解放を目指す都市革命です。生活に必要なあらゆるインフラが短距離で完結することにより、移動のストレスが軽減されるだけでなく、地域のコミュニティが活性化し、都市全体のCO2排出量も劇的に抑制されます。',
    questionText:
      '都市[とし]計画[けいかく]の 専門家[せんもんか]が 主張[しゅちょう]する「15分[じゅうごふん] 都市[とし]（15-Minute City）」の 狙[ねら]いは 何[なに]ですか。',
    options: [
      'すべての住民を毎日15分間強制的に全力疾走させる健康政策',
      '自動車の所有を法律で完全に死刑にすること',
      '都市の中心部を富裕層だけの居住区に限定すること',
      '居住[きょじゅう]、労働[ろうどう]、医療[いりょう]、商業[しょうぎょう]などの 必須[ひっす] 機能[きのう]を 徒歩[とほ]や 自転車[じてんしゃ]で 15分[じゅうごふん]圏内[けんない]に 集約[しゅうやく]し、生活[せいかつ]の 質[しつ]と 脱炭素[だつたんそ]を 両立[りょうりつ]させること',
    ],
    correctAnswer: 3,
    explanationUzbek:
      "Uy, ishxona, poliklinika va do'konlarni piyoda yoki velosipedda 15 daqiqalik masofada jamlash orqali sifatli hayot yaratish.",
  },
  {
    id: 575,
    section: 'listening',
    audioUrl: '/audio/choukai/n1/n1_mock_q575.mp3',
    script:
      '心理学者：多くの人が「自分は仕事をしながらメールを返し、会議も聞けるマルチタスカーだ」と自負していますが、脳科学的に見ればこれは完全な錯覚です。脳の前頭前野は同時に2つの注意を要する作業を処理できず、タスク間を高速で往復しているにすぎません。このスイッチングコストにより、エネルギーが激しく消耗し、ミスが激増しているのです。',
    questionText:
      '認知[にんち]心理学者[しんりがくしゃ]が 警鐘[けいしょう]を 鳴[な]らす「マルチタスクの 幻想[げんそう]」の 本質[ほんしつ]は 何[なに]ですか。',
    options: [
      '脳[のう]は 複数[ふくすう]の 認知的[にんちてき] 課題[かだい]を 同時[どうじ]に 並行[へいこう]処理[しょり]しているのではなく、急速[きゅうそく]に 注意[ちゅうい]を 切[き]り替[か]えているにすぎず、結果[けっか]として 集中力[しゅうちゅうりょく]と 処理[しょり]能力[のうりょく]が 著[いちじる]しく 低下[ていか]する 点',
      '脳は訓練すれば同時に5つ以上の複雑な仕事を完璧に遂行できる点',
      'マルチタスクを行えば睡眠時間を半分に減らしても健康でいられる点',
      '音楽を聴きながら仕事をすると記憶力が自動的に10倍に跳ね上がる点',
    ],
    correctAnswer: 0,
    explanationUzbek:
      'Miya bir vaqtda ikkita ishni qilmaydi, balki tez-tez diqqatni almashtirishi sababli aqliy quvvat keskin pasayadi.',
  },
];

export const JLPT_MOCK_EXAM_SET3_DATA: Record<'N5' | 'N4' | 'N3' | 'N2' | 'N1', ExamQuestion[]> = {
  N5: JLPT_N5_MOCK_SET_3,
  N4: JLPT_N4_MOCK_SET_3,
  N3: JLPT_N3_MOCK_SET_3,
  N2: JLPT_N2_MOCK_SET_3,
  N1: JLPT_N1_MOCK_SET_3,
};
