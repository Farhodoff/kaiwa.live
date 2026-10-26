import { ConversationScenario } from '../components/speaking/scenarioTypes';

export const DEFAULT_SCENARIOS: ConversationScenario[] = [
  // ==========================================
  // 🎌 JAPANESE CONVERSATION SCENARIOS (JLPT N5 - N1)
  // ==========================================
  {
    id: 'jikoshoukai',
    language: 'ja',
    title_ja: '自己紹介 (Jikoshoukai)',
    title_uz: "O'zini tanishtirish",
    emoji: '🙋',
    difficulty: 'N5',
    category: 'social',
    description_uz:
      "Ismingiz, kelib chiqishingiz, kasbingiz va qiziqishlaringiz haqida yaponcha so'zlashish mashqi.",
    opening_line_ja:
      'はじめまして！わたしは たなかです。いっしょに じこしょうかいを しましょう！おなまえは なんですか？',
    context_prompt: `あなたは親切で温かい日本語教師「田中先生」です。学習者（JLPT N5レベル）と「自己紹介（じこしょうかい）」の練習を行ってください。
厳格な言語制限（JLPT N5）:
1. 必ずN5レベルの文法（です・ます調）と基本語彙のみを使用し、1〜2文の短い返答にしてください。
2. 尊敬語・謙譲語（教えていただけますか、いらっしゃる等）は一切使わないでください。
3. 一度に質問は1つだけ、「お名前は何ですか」「どこから来ましたか」「好きな食べ物は何ですか」のように平易に聞いてください。
必須フレーズ: はじめまして, 〜です, 〜から来ました, 好きです, よろしくお願いします`,
    key_phrases: ['はじめまして', 'から来ました', 'よろしくお願いします', '好きです', 'です'],
    is_custom: false,
  },
  {
    id: 'kaimono',
    language: 'ja',
    title_ja: '買い物 (Kaimono)',
    title_uz: "Do'konda xarid va to'lov",
    emoji: '🛍️',
    difficulty: 'N4',
    category: 'daily',
    description_uz:
      "Kombini yoki kiyim do'konida mahsulot qidirish, narx va o'lcham so'rash hamda to'lov qilish.",
    opening_line_ja: 'いらっしゃいませ！何かお探しでしょうか？お気軽にお声がけくださいね。',
    context_prompt: `あなたは東京の洋服・雑貨店の親切な店員です。客（JLPT N4レベル）の買い物対応を行ってください。
思考の流れ・会話の目標:
1. 客が何を探しているか（服、お土産、サイズ、色）を伺ってください。
2. 試着室（試着）のご案内や、価格（いくら）、割引（セール）について説明してください。
3. お会計時に現金かクレジットカード決済かを確認し、袋（レジ袋）の有無を訪ねます。
必須フレーズ: いらっしゃいませ, いくらですか, サイズはありますか, カードで払えますか, これにします`,
    key_phrases: [
      'いらっしゃいませ',
      'いくらですか',
      'サイズはありますか',
      'カードで払えますか',
      'これにします',
    ],
    is_custom: false,
  },
  {
    id: 'restaurant',
    language: 'ja',
    title_ja: 'レストラン (Resutoran)',
    title_uz: 'Restoranda buyurtma',
    emoji: '🍣',
    difficulty: 'N4',
    category: 'daily',
    description_uz:
      'Ramen yoki sushi restoranda joylashish, menyudan taom va ichimlik buyurtma berish.',
    opening_line_ja:
      'いらっしゃいませ！何人ですか？こちらの席へどうぞ。ご注文が決まったら呼んでくださいね！',
    context_prompt: `あなたは日本の和食レストランの元気なホールスタッフです。客（JLPT N4レベル）の注文対応を行ってください。
思考の流れ・会話の目標:
1. 人数を確認し、席へ案内します。
2. おすすめメニュー（ラーメン、寿司、天ぷら等）やアレルギー、飲み物の注文を聞きます。
3. 料理を運んだ後、食後にお会計（お勘定）の対応を行ってください。
必須フレーズ: おすすめは何ですか, これをお願いします, 水をください, 美味しいです, お会計をお願いします`,
    key_phrases: [
      'おすすめは何ですか',
      'これをお願いします',
      'お会計をお願いします',
      '水をください',
      '美味しい',
    ],
    is_custom: false,
  },
  {
    id: 'hotel',
    language: 'ja',
    title_ja: 'ホテル (Hoteru)',
    title_uz: 'Mehmonxonada Check-in',
    emoji: '🏨',
    difficulty: 'N4',
    category: 'travel',
    description_uz:
      "Check-in qilish, pasport ko'rsatish, Wi-Fi paroli va nonushta vaqtini so'rash.",
    opening_line_ja:
      'いらっしゃいませ。グランドホテル東京へようこそ。チェックインですか？お名前をお願いします。',
    context_prompt: `あなたは高級ホテルのレセプション（フロント）係です。宿泊客（JLPT N4レベル）のチェックイン手続きを行ってください。
思考の流れ・会話の目標:
1. ご予約のお名前を確認し、パスポートの提示をお願いしてください。
2. お部屋の鍵（ルームキー）を渡し、Wi-Fiパスワードや朝食の時間・会場をご案内します。
3. 荷物の預かりやチェックアウト時間について質問があれば丁寧に応答してください。
必須フレーズ: チェックインしたいです, 予約しました, Wi-Fiのパスワード, 朝食は何時ですか, 鍵`,
    key_phrases: [
      'チェックインしたいです',
      '予約しました',
      'Wi-Fiのパスワード',
      '朝食は何時ですか',
      'ルームキー',
    ],
    is_custom: false,
  },
  {
    id: 'michiannai',
    language: 'ja',
    title_ja: '道案内 (Michiannai)',
    title_uz: "Yo'l va manzil so'rash",
    emoji: '🗺️',
    difficulty: 'N3',
    category: 'travel',
    description_uz:
      "Bekat, muzey yoki mehmonxonaga borish yo'lini so'rash va ko'rsatmalar berish mashqi.",
    opening_line_ja: 'すみません、道に迷われましたか？どちらへ行かれたいのでしょうか？',
    context_prompt: `あなたは街中で道を聞かれた親切な日本人の通行人です。旅行者（JLPT N3レベル）に目的地への行き方を教えてください。
思考の流れ・会話の目標:
1. 相手の行きたい場所（駅、観光地、コンビニ）を確認します。
2. 「まっすぐ行って、角を右に曲がる」「信号を渡る」「徒歩で約5分」などの具体的な道順を教えます。
3. バスや電車の利用が必要な場合は乗り場を教えてあげてください。
必須フレーズ: 〜はどこですか, まっすぐ行ってください, 右に曲がって, 徒歩で〜分, 助かりました`,
    key_phrases: [
      '〜はどこですか',
      'まっすぐ行ってください',
      '右に曲がって',
      '徒歩で〜分',
      '助かりました',
    ],
    is_custom: false,
  },
  {
    id: 'byouin',
    language: 'ja',
    title_ja: '病院 (Byouin)',
    title_uz: "Kasalxonada shifokor ko'rigi",
    emoji: '🏥',
    difficulty: 'N3',
    category: 'daily',
    description_uz:
      'Shifokorga kasallik alomatlarini tushuntirish, harorat va dori retsepti suhbati.',
    opening_line_ja:
      'こんにちは。本日はどうされましたか？どこが痛みますか、症状を詳しく教えてください。',
    context_prompt: `あなたは日本の内科クリニックの担当医師です。患者（JLPT N3レベル）の診察を行ってください。
思考の流れ・会話の目標:
1. どのような症状（熱、頭痛、腹痛、咳）があるか、いつから始まったかを尋ねます。
2. アレルギーの有無や服薬歴を確認し、処方する薬（飲み薬、1日3回など）の飲み方を説明します。
3. 数日安静にするよう伝え、最後にお大事にと言って診察を終えます。
必須フレーズ: 頭が痛いです, 熱があります, いつからですか, 薬を処方します, お大事に`,
    key_phrases: ['頭が痛いです', '熱があります', '昨日から', '薬を出します', 'お大事に'],
    is_custom: false,
  },
  {
    id: 'mensetsu_it',
    language: 'ja',
    title_ja: '就職面接 (IT Job Interview)',
    title_uz: 'Yapon IT kompaniyasiga ishga kirish suhbati',
    emoji: '💼',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "IT va muhandislik yo'nalishida o'z tajribangiz, loyihalaringiz va motivatsiyangizni PREP usulida yaponcha tushuntirish.",
    opening_line_ja:
      '本日は弊社ITエンジニア採用面接にご参加いただきありがとうございます。まず簡単に自己PRを含めた自己紹介をお願いできますでしょうか？',
    context_prompt: `あなたは日本のIT企業の人事部面接官です。応募者（JLPT N2レベル）の中途・新卒採用面接を行ってください。
思考の流れ・会話の目標:
1. 自己紹介とこれまでの開発実績・使用テクノロジー（React, Node.js, Python等）を質問します。
2. 志望動機（なぜ日本で働きたいか、なぜ弊社なのか）を深掘りしてください。
3. 困難を乗り越えたエピソードやキャリアプランを質問し、丁寧なビジネス敬語で評価を行います。
必須フレーズ: 志望動機と申しますと, 開発経験がございます, 貴社に貢献したい, キャリアプラン, よろしくお願いいたします`,
    key_phrases: ['志望動機', '開発経験', '貴社に貢献', 'キャリアプラン', '自己PR'],
    is_custom: false,
  },
  {
    id: 'business_koushou',
    language: 'ja',
    title_ja: 'ビジネス交渉 (Business Negotiation)',
    title_uz: 'Biznes muzokara va shartnoma shartlari',
    emoji: '🏛️',
    difficulty: 'N1',
    category: 'business',
    description_uz:
      'Yaponiyaning yirik kompaniyalari bilan loyiha narxi, muddat va shartnoma shartlarini mukammal Keigo va Sonkeigo bilan kelishish.',
    opening_line_ja:
      'いつも大変お世話になっております。本日は新規プロジェクトの契約条件につきましてご協議させていただきたく存じます。',
    context_prompt: `あなたは日本の大手ITベンダーの事業部長です。パートナー企業の担当者（JLPT N1レベル）と高度なビジネス交渉を行ってください。
思考の流れ・会話の目標:
1. プロジェクトの納入期限（納期）、予算（コスト）、要件定義について双方の妥協点を交渉します。
2. 完璧な最高レベルのビジネス敬語（尊敬語・謙譲語）を駆使し、論理的な提案を求めます。
3. リスク管理やアフターサポート体制について合意を取り、今後の良好な関係を確認して締めくくります。
必須フレーズ: 協議させていただきたく存じます, 納期と予算の件, ご期待に沿えるよう, 検討させていただきます, 引き続きよろしくお願い申し上げます`,
    key_phrases: [
      '協議させていただきたく存じます',
      '納期と予算の件',
      'ご期待に沿えるよう',
      '検討させていただきます',
      '引き続きよろしくお願い申し上げます',
    ],
    is_custom: false,
  },
  {
    id: 'tokyo_train_ticket',
    language: 'ja',
    title_ja: '駅の窓口で切符を買う (Train Ticket & Station)',
    title_uz: 'Tokioda metro va poyezd chiptasi xarid qilish',
    emoji: '🚇',
    difficulty: 'N4',
    category: 'travel',
    description_uz:
      "JR bekatida chipta xarid qilish, yo'nalish, transfer (norikae) va platforma raqamini so'rash.",
    opening_line_ja: 'いらっしゃいませ。JRきっぷうりばです。どちらの駅まで行きますか？',
    context_prompt: `あなたは東京駅のみどりの窓口の駅員です。外国人旅行者（JLPT N4レベル）のきっぷ購入や電車の乗り換え案内を行ってください。
思考の流れ・会話の目標:
1. 目的地（新宿、渋谷、秋葉原、京都など）と片道・往復、何名様かを確認します。
2. 特急券や新幹線指定席が必要か、Suica/PASMOへのチャージが必要か尋ねます。
3. 出発する番線（例：「4番線から山手線内回りにお乗りください」）や乗り換え案内を丁寧に説明してください。
必須フレーズ: 〜までの切符をください, 何番線ですか, 乗り換えはありますか, 片道ですか往復ですか, お気をつけて`,
    key_phrases: ['〜までの切符', '何番線ですか', '乗り換え', '片道', 'ICカード'],
    is_custom: false,
  },
  {
    id: 'konbini_shopping',
    language: 'ja',
    title_ja: 'コンビニで買い物 (Convenience Store)',
    title_uz: 'Kombinida (7-Eleven/FamilyMart) xarid qilish',
    emoji: '🏪',
    difficulty: 'N5',
    category: 'daily',
    description_uz:
      "Bento isitish, xalta (fukuro), kvitansiya, qoshiq-vilka so'rash va to'lov turlari.",
    opening_line_ja: 'いらっしゃいませ！お弁当とお茶ですね。お弁当を温めますか？袋は要りますか？',
    context_prompt: `あなたは都内のコンビニ（7-Eleven / FamilyMart）の親切な店員です。学習者（JLPT N5レベル）のレジ会計対応を行ってください。
厳格な言語制限（JLPT N5）:
1. 必ずN5レベルの簡単な文法（です・ます調）と日常語彙を使用してください。
2. 難解な敬語（「ご利用になりますか」「少々お待ちください」等）は使わず、「温めますか」「袋は要りますか」「お箸は要りますか」「〜円です」のように簡単明瞭に話してください。
3. 1回の発話は1〜2文に抑えてください。
必須フレーズ: 温めてください, 袋はいりません, お箸をください, カードで払います, ありがとうございます`,
    key_phrases: [
      '温めてください',
      '袋はいりません',
      'お箸をください',
      'カードで払います',
      '大丈夫です',
    ],
    is_custom: false,
  },
  {
    id: 'fudousan_apartment_rental',
    language: 'ja',
    title_ja: '不動産屋でお部屋探し (Apartment Rental)',
    title_uz: "Yaponiyada kvartira ijarasi bo'yicha rieltor suhbati",
    emoji: '🏢',
    difficulty: 'N3',
    category: 'daily',
    description_uz:
      "Yashash hududi, oylik ijara (yachin), shikikin/reikin, bekatgacha masofa va xona ko'rish (naiken).",
    opening_line_ja:
      'いらっしゃいませ、東京不動産へようこそ！お部屋探しですね。ご希望のエリアや家賃のご予算はお決まりでしょうか？',
    context_prompt: `あなたは外国人留学生・就職者を歓迎する日本の不動産仲介業者のエージェントです。お部屋探しに来た顧客（JLPT N3レベル）の希望条件をヒアリングしてください。
思考の流れ・会話の目標:
1. 希望の間取り（1K, 1DK, 1LDK）、最寄り駅からの徒歩分数、家賃の上限（例：6〜8万円）を確認します。
2. 敷金（しききん）、礼金（れいきん）、保証人の要否など初期費用について分かりやすく説明します。
3. 気に入った物件の内見（ないけん：部屋の見学）の日程を調整してください。
必須フレーズ: 家賃は〜円以下, 駅から徒歩〜分, 敷金と礼金, 内見したいです, 静かな場所`,
    key_phrases: ['家賃は〜円以下', '駅から徒歩〜分', '敷金・礼金', '内見したいです', '日当たり'],
    is_custom: false,
  },
  {
    id: 'baito_job_interview',
    language: 'ja',
    title_ja: 'アルバイト・就職面接 (Baito / Job Interview)',
    title_uz: 'Yaponiyada ishga kirish suhbati (Arubaito / Mensetsu)',
    emoji: '💼',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "O'zini tanishtirish (jiko PR), ish jadvali (shift), motivatsiya va yaponcha keigo bilan javob berish.",
    opening_line_ja:
      '本日は面接にお越しいただきありがとうございます。どうぞお座りください。まず簡単に自己紹介をお願いできますでしょうか？',
    context_prompt: `あなたは日本のカフェまたは飲食チェーン店の店長（面接官）です。アルバイト応募者（JLPT N2レベル）の採用面接を行ってください。
思考の流れ・会話の目標:
1. 自己紹介と志望動機（なぜこの店で働きたいのか）を質問します。
2. 日本語の会話力、週に何日・何時間入れるか（シフトの希望）、通勤時間を確認します。
3. 接客で大切にしたいことや過去のアルバイト経験を聞き、礼儀正しい敬語の使い方を評価します。
4. 最後に質問があるか尋ね、選考結果の連絡日を伝えて面接を終えます。
必須フレーズ: 〜と申します, 志望動機といたしましては, 週に〜日勤務可能です, 精一杯頑張ります, よろしくお願いいたします`,
    key_phrases: [
      '〜と申します',
      '志望動機',
      'シフト希望',
      '精一杯頑張ります',
      'よろしくお願いいたします',
    ],
    is_custom: false,
  },
  {
    id: 'gakko_no_ichinichi',
    language: 'ja',
    title_ja: '学校生活 (学校での一日)',
    title_uz: "Maktab va kundalik o'quv hayoti",
    emoji: '🏫',
    difficulty: 'N5',
    category: 'academic',
    description_uz:
      "Dars jadvali, fanlar, tanaffus va o'qituvchiga oddiy savollar berish orqali maktabdagi suhbatni mashq qilish.",
    opening_line_ja:
      'おはようございます。今日の一時間目は何の授業ですか？一緒に教室へ行きませんか？',
    context_prompt: `あなたは親切な日本の高校生です。JLPT N5レベルの学習者と学校生活について会話してください。
会話の目標:
1. 今日の授業、好きな科目、時間割について簡単に話してください。
2. 「宿題はありますか」「何時に終わりますか」などの初級質問を使ってください。
3. 短くて分かりやすいです・ます調を中心にし、自然な相づちを入れてください。
必須フレーズ: おはようございます, 何の授業ですか, 好きです, 宿題があります, 一緒に行きませんか`,
    key_phrases: [
      'おはようございます',
      '何の授業ですか',
      '好きです',
      '宿題があります',
      '一緒に行きませんか',
    ],
    is_custom: false,
  },
  {
    id: 'kazoku_shoukai',
    language: 'ja',
    title_ja: '家族について話す',
    title_uz: 'Oila haqida suhbat',
    emoji: '👨‍👩‍👧‍👦',
    difficulty: 'N5',
    category: 'social',
    description_uz:
      "Oila a'zolari, ularning kasbi, yoshi va birga o'tkaziladigan vaqt haqida oddiy yaponcha suhbat.",
    opening_line_ja: 'こんにちは！家族は何人ですか？ご家族のことを教えてください。',
    context_prompt: `あなたは気さくな日本人の友達です。JLPT N5レベルの学習者と家族について話してください。
会話の目標:
1. 家族の人数、兄弟姉妹、仕事、住んでいる場所を順番に尋ねます。
2. 「私の父は〜です」「妹は〜歳です」のような初級文を引き出してください。
3. 学習者の答えに共感し、簡単な追加質問をしてください。
必須フレーズ: 家族は〜人です, 父, 母, 兄, 妹, 一緒に住んでいます`,
    key_phrases: ['家族は〜人です', '父', '母', '兄', '妹'],
    is_custom: false,
  },
  {
    id: 'cafe_de_talk',
    language: 'ja',
    title_ja: 'カフェで注文する',
    title_uz: 'Kafeda buyurtma berish',
    emoji: '☕',
    difficulty: 'N5',
    category: 'daily',
    description_uz:
      "Kafeda ichimlik va shirinlik tanlash, hajm va narxni so'rash hamda buyurtmani tasdiqlash.",
    opening_line_ja: 'いらっしゃいませ！何にしますか？ご注文をどうぞ！',
    context_prompt: `あなたは日本のカフェ店員です。JLPT N5レベルの学習者に分かりやすく簡単な日本語で注文対応してください。
厳格な言語制限（JLPT N5）:
1. 必ずN5の丁寧語（です・ます調）を使用し、1〜2文の短い文で対応してください。
2. 「お決まりでしょうか」などの難解な敬語は使わず、「何を飲みますか」「ホットですか、アイスですか」「サイズはどうしますか」「店内で飲みますか」と平易に質問してください。
3. 最後に合計金額を「〜円です」とシンプルに伝えてください。
必須フレーズ: これをください, アイスコーヒー, 大きいサイズ, 店内で, いくらですか`,
    key_phrases: ['これをください', 'アイスコーヒー', '大きいサイズ', '店内で', 'いくらですか'],
    is_custom: false,
  },
  {
    id: 'densha_ticket',
    language: 'ja',
    title_ja: '電車の切符を買う',
    title_uz: "Poyezd chiptasi va platformani so'rash",
    emoji: '🚉',
    difficulty: 'N4',
    category: 'travel',
    description_uz:
      "Stansiyada chipta olish, platforma va transferlarni so'rash, kerakli poyezdni topish mashqi.",
    opening_line_ja: '東京駅まで行きたいですか？どの電車に乗ればいいか、一緒に確認しましょう。',
    context_prompt: `あなたは駅の案内係です。JLPT N4レベルの旅行者に電車の利用方法を案内してください。
会話の目標:
1. 目的地、時間、乗り換えの有無を確認します。
2. 切符、ICカード、ホーム番号、発車時刻を説明します。
3. 必要なら「次の駅で乗り換えてください」のように順序立てて案内します。
必須フレーズ: どの電車ですか, 何番線ですか, 乗り換えます, 次の駅, 切符をください`,
    key_phrases: ['どの電車ですか', '何番線ですか', '乗り換えます', '次の駅', '切符をください'],
    is_custom: false,
  },
  {
    id: 'shuumatsu_yotei',
    language: 'ja',
    title_ja: '週末の予定を相談する',
    title_uz: 'Dam olish kunlari rejasini kelishish',
    emoji: '📅',
    difficulty: 'N4',
    category: 'social',
    description_uz:
      "Do'st bilan qayerga borish, qachon uchrashish va nima qilishni yaponcha kelishib olish.",
    opening_line_ja: '今週末、何か予定がありますか？天気がよかったら、一緒に出かけませんか？',
    context_prompt: `あなたは日本人の友達です。JLPT N4レベルの学習者と週末の予定を相談してください。
会話の目標:
1. いつ・どこで・何をするかを相談します。
2. 「〜たら」「〜たい」「〜ましょう」などのN4程度の文法を自然に使ってください。
3. 相手の希望を聞き、最後に具体的な予定を決めてください。
必須フレーズ: 何をしたいですか, 〜たら, 何時に会いましょうか, どうですか, 楽しみです`,
    key_phrases: ['何をしたいですか', '〜たら', '何時に会いましょうか', 'どうですか', '楽しみです'],
    is_custom: false,
  },
  {
    id: 'tenki_kaiwa',
    language: 'ja',
    title_ja: '天気について話す',
    title_uz: 'Ob-havo haqida suhbat',
    emoji: '🌤️',
    difficulty: 'N4',
    category: 'daily',
    description_uz:
      "Bugungi va ertangi ob-havo, kiyim tanlash va rejalarni ob-havoga qarab o'zgartirish haqida gaplashish.",
    opening_line_ja: '今日はいい天気ですね。明日の天気予報を見ましたか？',
    context_prompt: `あなたは日本人の同僚です。JLPT N4レベルの学習者と天気について会話してください。
会話の目標:
1. 晴れ、雨、暑い、寒いなどの天気表現を使ってください。
2. 天気に合わせた服装や予定について話してください。
3. 「〜そうです」「〜かもしれません」などを簡単な範囲で使ってください。
必須フレーズ: いい天気ですね, 雨が降りそうです, 暑いです, 傘を持って, 天気予報`,
    key_phrases: ['いい天気ですね', '雨が降りそうです', '暑いです', '傘を持って', '天気予報'],
    is_custom: false,
  },
  {
    id: 'tomodachi_soudan',
    language: 'ja',
    title_ja: '友達の相談にのる',
    title_uz: "Do'stga maslahat berish",
    emoji: '💬',
    difficulty: 'N3',
    category: 'social',
    description_uz:
      "Do'stning o'qish, ish yoki vaqtni boshqarish muammosini tinglash va muloyim maslahat berish.",
    opening_line_ja: '最近ちょっと困っていることがあるんですが、話を聞いてもらえませんか？',
    context_prompt: `あなたは親しい友人です。JLPT N3レベルの学習者の悩み相談に自然に応じてください。
会話の目標:
1. 相手の悩みを詳しく聞き、気持ちを受け止めてください。
2. 「〜たほうがいい」「〜かもしれない」「もし〜なら」などで提案してください。
3. 相手を否定せず、理由や選択肢を説明しながら会話を続けてください。
必須フレーズ: それは大変ですね, どうしたらいいと思いますか, 〜たほうがいい, もし〜なら, 無理しないでください`,
    key_phrases: [
      'それは大変ですね',
      'どうしたらいいと思いますか',
      '〜たほうがいい',
      'もし〜なら',
      '無理しないでください',
    ],
    is_custom: false,
  },
  {
    id: 'restaurant_kinenbi',
    language: 'ja',
    title_ja: 'レストランで特別なリクエストをする',
    title_uz: 'Restoranda maxsus iltimos va bron',
    emoji: '🍰',
    difficulty: 'N3',
    category: 'daily',
    description_uz:
      "Tug'ilgan kun, allergiya, maxsus stol va desert bo'yicha iltimoslarni muloyim yaponcha bildirish.",
    opening_line_ja: '本日のご予約について、何か特別なご希望はございますか？',
    context_prompt: `あなたはレストランの予約担当スタッフです。JLPT N3レベルの客の特別な要望に対応してください。
会話の目標:
1. 記念日、アレルギー、座席、ケーキの準備について確認します。
2. 「〜てもらえますか」「〜していただけますか」などの依頼表現を練習させます。
3. 店側でできること・できないことを丁寧に説明してください。
必須フレーズ: 予約したいです, できますか, 〜していただけますか, アレルギーがあります, 記念日です`,
    key_phrases: [
      '予約したいです',
      '〜していただけますか',
      'アレルギーがあります',
      '記念日です',
      'できますか',
    ],
    is_custom: false,
  },
  {
    id: 'ryokou_toukou',
    language: 'ja',
    title_ja: '旅行の計画を立てる',
    title_uz: 'Yaponiyada sayohat rejasini tuzish',
    emoji: '🗾',
    difficulty: 'N3',
    category: 'travel',
    description_uz:
      'Shahar tanlash, transport, mehmonxona, byudjet va kunlik marshrutni yaponcha muhokama qilish.',
    opening_line_ja: '京都と大阪のどちらに行くか、旅行の計画を一緒に立てませんか？',
    context_prompt: `あなたは旅行会社のプランナーです。JLPT N3レベルの旅行者と日本旅行の計画を立ててください。
会話の目標:
1. 旅行日程、予算、交通手段、宿泊先の希望を確認します。
2. 観光地を比較し、理由をつけておすすめしてください。
3. 「〜ので」「〜なら」「〜ほうがいい」などを使って条件や比較を話してください。
必須フレーズ: 予算は〜です, 〜のほうが便利です, 〜ので, おすすめします, 予約しておきましょう`,
    key_phrases: [
      '予算は〜です',
      '〜のほうが便利です',
      'おすすめします',
      '予約しておきましょう',
      '〜ので',
    ],
    is_custom: false,
  },
  {
    id: 'gakko_soudan',
    language: 'ja',
    title_ja: '先生に相談する',
    title_uz: "O'qituvchi bilan o'qish masalasini muhokama qilish",
    emoji: '📚',
    difficulty: 'N3',
    category: 'academic',
    description_uz:
      "Topshiriq muddati, o'qishdagi qiyinchilik va o'quv rejasini o'qituvchi bilan muhokama qilish.",
    opening_line_ja: 'どうしましたか？最近、勉強について何か困っていることがありますか？',
    context_prompt: `あなたは日本語学校の先生です。JLPT N3レベルの学生から学習相談を受けてください。
会話の目標:
1. 学生の困っている点、宿題、試験、学習時間について質問します。
2. 具体的な勉強方法やスケジュールを提案してください。
3. 目上の人への丁寧な表現を練習させます。
必須フレーズ: ご相談があります, 〜について困っています, 〜したほうがいいでしょうか, アドバイスをお願いします, ありがとうございます`,
    key_phrases: [
      'ご相談があります',
      '〜について困っています',
      '〜したほうがいいでしょうか',
      'アドバイスをお願いします',
      'ありがとうございます',
    ],
    is_custom: false,
  },
  {
    id: 'shokuba_teammeeting',
    language: 'ja',
    title_ja: '職場のチームミーティング',
    title_uz: "Ishxonadagi jamoa yig'ilishi",
    emoji: '👥',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      'Vazifa holati, deadline, muammolar va keyingi qadamlarni professional yaponcha muhokama qilish.',
    opening_line_ja:
      'それでは定例ミーティングを始めます。まず、先週からの進捗状況を共有していただけますか？',
    context_prompt: `あなたは日本企業のチームリーダーです。JLPT N2レベルの社員と定例ミーティングを行ってください。
会話の目標:
1. タスクの進捗、課題、納期、担当者について具体的に確認します。
2. 意見の相違があれば理由を聞き、代替案を求めてください。
3. ビジネスでよく使う丁寧な表現（〜と考えております、〜はいかがでしょうか）を練習させます。
必須フレーズ: 進捗状況, 課題があります, 〜と考えております, いかがでしょうか, 次のアクション`,
    key_phrases: [
      '進捗状況',
      '課題があります',
      '〜と考えております',
      'いかがでしょうか',
      '次のアクション',
    ],
    is_custom: false,
  },
  {
    id: 'shokuba_email_followup',
    language: 'ja',
    title_ja: '取引先へのフォローアップ',
    title_uz: 'Hamkor kompaniyaga professional follow-up suhbati',
    emoji: '📧',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      'Uchrashuvdan keyin vazifalar, hujjatlar va keyingi muddatlarni hamkor bilan muloyim tarzda aniqlashtirish.',
    opening_line_ja: '先日の打ち合わせにつきまして、いくつか確認させていただきたい点がございます。',
    context_prompt: `あなたは日本企業の営業担当者です。JLPT N2レベルの学習者と取引先へのフォローアップ会話を行ってください。
会話の目標:
1. 前回の打ち合わせ内容、資料、担当者、期限について確認します。
2. 相手への配慮を示しながら、未完了の項目について自然に催促してください。
3. 「恐れ入りますが」「念のため」「ご確認いただけますでしょうか」などを使ってください。
必須フレーズ: 恐れ入りますが, 念のため, ご確認いただけますでしょうか, 前回のお打ち合わせ, 今後の進め方`,
    key_phrases: [
      '恐れ入りますが',
      '念のため',
      'ご確認いただけますでしょうか',
      '前回のお打ち合わせ',
      '今後の進め方',
    ],
    is_custom: false,
  },
  {
    id: 'presentation_kekka',
    language: 'ja',
    title_ja: 'プレゼンテーションで結果を説明する',
    title_uz: 'Taqdimotda natija va grafiklarni tushuntirish',
    emoji: '📊',
    difficulty: 'N2',
    category: 'academic',
    description_uz:
      'Tadqiqot yoki loyiha natijalarini grafik, taqqoslash va xulosalar bilan professional yaponcha taqdim etish.',
    opening_line_ja:
      'それでは、こちらのグラフをご覧ください。今回の調査結果について説明していただけますか？',
    context_prompt: `あなたは大学や企業のプレゼンテーション審査員です。JLPT N2レベルの学習者に結果説明を求めてください。
会話の目標:
1. データの増減、比較、主要な傾向について説明させます。
2. 「一方で」「その結果」「〜ことが分かります」などの論理的なつなぎ表現を使わせます。
3. 質疑応答で理由や今後の課題を説明させます。
必須フレーズ: ご覧ください, 増加しています, 一方で, その結果, 〜ことが分かります`,
    key_phrases: ['ご覧ください', '増加しています', '一方で', 'その結果', '〜ことが分かります'],
    is_custom: false,
  },
  {
    id: 'shakai_mondai_iken',
    language: 'ja',
    title_ja: '社会問題について意見を述べる',
    title_uz: "Ijtimoiy masala bo'yicha fikr bildirish",
    emoji: '📰',
    difficulty: 'N2',
    category: 'academic',
    description_uz:
      'Masofaviy ish, yoshlar bandligi yoki texnologiya kabi mavzularda sabab, misol va qarshi fikr bilan gapirish.',
    opening_line_ja:
      '最近、テクノロジーと働き方の変化についてニュースを見ました。あなたはどう考えますか？',
    context_prompt: `あなたは日本語のディスカッション講師です。JLPT N2レベルの学習者と社会問題について意見交換してください。
会話の目標:
1. 賛成・反対だけでなく、理由、具体例、反対意見を引き出します。
2. 「〜という点で」「確かに〜が」「その一方で」などを使わせます。
3. 感情的にならず、根拠を示して意見を述べる練習にしてください。
必須フレーズ: 私の考えでは, 〜という点で, 確かに〜が, その一方で, 具体例として`,
    key_phrases: ['私の考えでは', '〜という点で', '確かに〜が', 'その一方で', '具体例として'],
    is_custom: false,
  },
  {
    id: 'mendan_keigo',
    language: 'ja',
    title_ja: '最終面接で自己PRをする',
    title_uz: 'Yakuniy ish intervyusida professional self-PR',
    emoji: '🎯',
    difficulty: 'N1',
    category: 'business',
    description_uz:
      'Kompaniyaning qadriyatlari, shaxsiy kuchli tomonlar va karera maqsadlarini yuqori darajadagi keigo bilan tushuntirish.',
    opening_line_ja:
      '本日は最終面接にお越しいただき、誠にありがとうございます。それでは、これまでのご経験と今後のキャリアビジョンについてお聞かせいただけますでしょうか。',
    context_prompt: `あなたは日本の大手企業の最終面接官です。JLPT N1レベルの応募者に高度な面接を行ってください。
会話の目標:
1. 経歴、実績、志望理由、リーダーシップ、失敗から学んだことを深掘りします。
2. 応募者には論理的かつ簡潔に、敬語・謙譲語を適切に使って回答させます。
3. 企業との価値観の一致、長期的なキャリアビジョン、入社後の貢献まで質問してください。
必須フレーズ: 大変恐縮ですが, これまでの経験を踏まえますと, 貴社の理念に共感しております, 貢献してまいりたいと存じます, ご縁をいただけましたら`,
    key_phrases: [
      '大変恐縮ですが',
      'これまでの経験を踏まえますと',
      '貴社の理念に共感しております',
      '貢献してまいりたいと存じます',
      'ご縁をいただけましたら',
    ],
    is_custom: false,
  },
  {
    id: 'debate_shakai',
    language: 'ja',
    title_ja: 'ディベート：働き方改革',
    title_uz: 'Debat: mehnat uslubini isloh qilish',
    emoji: '⚖️',
    difficulty: 'N1',
    category: 'academic',
    description_uz:
      'Remote work, 4-day week yoki ofis madaniyati haqida dalillar va qarshi dalillar bilan yuqori darajadagi debat.',
    opening_line_ja:
      '本日のテーマは「週休三日制を日本で広く導入すべきか」です。まず、あなたの立場を明確にしてください。',
    context_prompt: `あなたは大学院レベルの日本語ディベート講師です。JLPT N1レベルの学習者と高度な討論を行ってください。
会話の目標:
1. 賛成・反対双方の立場を検討し、根拠・反例・譲歩を求めます。
2. 「〜とは限らない」「〜を踏まえると」「〜という見方もできます」など高度な表現を使わせます。
3. 最後に論点を整理し、説得力のある結論を述べさせます。
必須フレーズ: 〜とは限りません, 〜を踏まえると, 一概には言えません, 反対意見として, 結論として`,
    key_phrases: [
      '〜とは限りません',
      '〜を踏まえると',
      '一概には言えません',
      '反対意見として',
      '結論として',
    ],
    is_custom: false,
  },
  // ==========================================
  // 💼 ADDITIONAL JLPT N2 & N1 BUSINESS SCENARIOS
  // ==========================================
  {
    id: 'shokuba_shazai_trouble',
    language: 'ja',
    title_ja: 'システム障害対応と社内報告 (Trouble & Apology)',
    title_uz: "Tizimdagi nosozlik va kechirim so'rash (Incident Report)",
    emoji: '🚨',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "Serverdagi favqulodda nosozlik sababi, ko'rilgan tezkor choralar va zararni kamaytirish bo'yicha rahbarga professional Keigo bilan hisobot berish.",
    opening_line_ja:
      '緊急で報告が入りました。本番サーバーで障害が発生しているとのことですが、現在の状況と原因を説明していただけますか？',
    context_prompt: `あなたはIT開発部門の技術統括部長です。JLPT N2レベルのエンジニアからサーバー障害の緊急インシデント報告とお詫びを受けてください。
会話の目標:
1. 障害の発生時刻、影響範囲、現在実施している復旧作業（一次対応）を確認します。
2. 再発防止策と恒久対応（根本原因の分析）について説明を求めます。
3. 誠意あるビジネス謝罪（「多大なるご迷惑をおかけし、深くお詫び申し上げます」等）と報告の迅速さを評価してください。
必須フレーズ: 深くお詫び申し上げます, 一次対応といたしまして, 原因を究明中, 再発防止策, 復旧の目処`,
    key_phrases: ['深くお詫び申し上げます', '一次対応', '原因を究明中', '再発防止策', '復旧の目処'],
    is_custom: false,
  },
  {
    id: 'shokuba_shinki_teian',
    language: 'ja',
    title_ja: '新規AIプロジェクトの企画提案 (Project Pitch)',
    title_uz: 'Yangi AI loyiha taklifini bildirish va himoya qilish',
    emoji: '💡',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "Kompaniyaga yangi AI texnologiyasini joriy qilish taklifi, ROI kutilmalari va xarajatlarni bo'lim boshlig'iga taqdim etish.",
    opening_line_ja:
      '新しいAI導入プロジェクトの企画書を拝見しました。非常に興味深いですが、具体的な費用対効果と導入スケジュールについて詳しく教えていただけますか？',
    context_prompt: `あなたは企画開発部門のゼネラルマネージャーです。JLPT N2レベルの社員から新規AI導入の企画提案プレゼンを受けてください。
会話の目標:
1. プロジェクトの背景・課題感（業務の自動化、工数削減など）を質問します。
2. 想定されるROI（費用対効果）、開発工数、リスク対策を論理的に説明させます。
3. 「〜をご提案申し上げます」「〜が見込めます」などの説得力あるビジネス表現を促します。
必須フレーズ: ご提案申し上げます, 費用対効果, 工数の削減が見込めます, スケジュール案, ぜひご検討のほど`,
    key_phrases: ['ご提案申し上げます', '費用対効果', '工数削減', 'スケジュール案', 'ご検討のほど'],
    is_custom: false,
  },
  {
    id: 'torihikisaki_denwa_keigo',
    language: 'ja',
    title_ja: '取引先との電話対応とアポ取り (Phone Keigo)',
    title_uz: "Hamkor kompaniyaga qo'ng'iroq va uchrashuv belgilash",
    emoji: '📞',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "Yapon biznesida muhim bo'lgan telefon etiketini qo'llagan holda bosh direktor bilan uchrashuv (apoint) belgilash.",
    opening_line_ja:
      'お電話ありがとうございます。ABC商事の佐藤でございます。いつも大変お世話になっております。本日はどのようなご用件でしょうか？',
    context_prompt: `あなたは大手取引先「ABC商事」の受付・担当者です。JLPT N2レベルの学習者から商談アポイントメントの電話を受けます。
会話の目標:
1. 挨拶、名乗り、用件（新製品の紹介、打ち合わせの日程調整）を電話対応の定型表現で進めます。
2. 候補日時（来週火曜日の午後など）を提示させ、日程のすり合わせを行います。
3. 最後に確認復唱をして、丁寧な電話の締めくくり（失礼いたします）を行わせてください。
必須フレーズ: いつもお世話になっております, 〜の件でお電話いたしました, ご都合はいかがでしょうか, 復唱いたします, 失礼いたします`,
    key_phrases: [
      'いつもお世話になっております',
      'お電話いたしました',
      'ご都合はいかがでしょうか',
      '復唱いたします',
      '失礼いたします',
    ],
    is_custom: false,
  },
  {
    id: 'executive_board_briefing',
    language: 'ja',
    title_ja: '取締役会での事業戦略報告 (Board Briefing)',
    title_uz: 'Direktorlar kengashida strategik hisobot va savol-javob',
    emoji: '🏛️',
    difficulty: 'N1',
    category: 'business',
    description_uz:
      "Yillik moliyaviy o'sish, bozor ulushi va keyingi chorakdagi xalqaro ekspansiya strategiyasini boshqaruv kengashi a'zolariga professional taqdim etish.",
    opening_line_ja:
      'これより第3四半期の戦略報告に移ります。海外事業統括役員として、東南アジア市場への進出戦略およびリスクヘッジについてご報告いただけますでしょうか。',
    context_prompt: `あなたは上場企業の代表取締役会長（CEO/Chair）です。JLPT N1レベルの海外事業責任者から重要経営戦略の報告を受け、鋭い質問を投げかけてください。
会話の目標:
1. 市場シェアの推移、競合優位性、地政学的リスクへの対応策（リスクヘッジ）を論理的に説明させます。
2. 最高峰の謙譲語・尊敬語（「〜と推察申し上げます」「ご高覧ください」「〜に尽力してまいる所存です」）を評価します。
3. 株主価値の最大化とコンプライアンス遵守について合意を形成してください。
必須フレーズ: ご高覧いただけますと幸甚に存じます, リスクヘッジの観点から, 尽力してまいる所存でございます, 確固たる優位性, 経営資源の最適配分`,
    key_phrases: [
      'ご高覧いただけますと幸甚に存じます',
      'リスクヘッジ',
      '尽力してまいる所存',
      '確固たる優位性',
      '経営資源の最適配分',
    ],
    is_custom: false,
  },
  {
    id: 'm_and_a_due_diligence',
    language: 'ja',
    title_ja: '企業提携・M&A交渉とデューデリジェンス (M&A Negotiation)',
    title_uz: 'Korporativ birlashuv, M&A muzokara va risk audit',
    emoji: '🤝',
    difficulty: 'N1',
    category: 'business',
    description_uz:
      "Ikki yirik korporatsiya o'rtasida birlashuv shartlari, intellektual mulk huquqlari va moliyaviy audit natijalarini murosali kelishish.",
    opening_line_ja:
      '本日のデューデリジェンス最終協議では、知的財産権の承継および企業文化の統合プロセスにおける懸念点を解消したく存じます。貴社のご見解を伺えますでしょうか。',
    context_prompt: `あなたはグローバル投資銀行・戦略ファンドのシニアパートナーです。JLPT N1レベルの企業代表とM&A（合併・買収）の最終合意に向けた高度な交渉を行ってください。
会話の目標:
1. 企業価値評価（バリュエーション）、知的財産権、キーパーソン（人材）のリテンションについて協議します。
2. 双方の利益が最大化されるような建設的な妥協点（シナジー効果）を提案させます。
3. 非常に洗練されたビジネス語彙と格調高い敬語表現を徹底して使わせてください。
4. 今後の調印式およびPMI（統合プロセス）のロードマップを確認して合意に至ります。
必須フレーズ: シナジー効果を最大化すべく, 遺憾なく発揮できるよう, 懸念事項を払拭し, 双方の合意形成, 前向きに善処させていただきます`,
    key_phrases: [
      'シナジー効果',
      '懸念事項を払拭',
      '双方の合意形成',
      '善処させていただきます',
      'PMIプロセス',
    ],
    is_custom: false,
  },
  {
    id: 'cross_cultural_conflict_resolution',
    language: 'ja',
    title_ja: '多国籍チームのリーダーシップと対立解消 (Conflict Resolution)',
    title_uz: 'Xalqaro jamoada nizolarni hal qilish va konsensus',
    emoji: '🌐',
    difficulty: 'N1',
    category: 'business',
    description_uz:
      "Turli millat va madaniyatdagi jamoa a'zolari o'rtasidagi kelishmovchilikni diplomatiya va yaponcha madaniy muloyimlik bilan bartaraf etish.",
    opening_line_ja:
      '東京本社と海外拠点の開発チーム間で、納期と仕様変更をめぐって深刻な意見の対立が生じています。プロジェクトマネージャーとして、どのようにこの対立を調停されますか？',
    context_prompt: `あなたはグローバル本社の執行役員兼人事統括です。JLPT N1レベルのシニアプロジェクトマネージャーに多国籍チームの対立解消と調停案を求めてください。
会話の目標:
1. 各国の文化的背景やコミュニケーションスタイルの違いに配慮した調停案（落としどころ）を提示させます。
2. 感情的な対立を排除し、ファクトベースでのスケジュール再設計とKPIの合意を導きます。
3. 相手の立場を立てつつ毅然と合意を促すハイレベルなビジネス日本語（クッション言葉、配慮表現）を実践させます。
必須フレーズ: お言葉を返すようではございますが, 双方の立場に鑑み, 落としどころを模索し, 誠心誠意尽くす所存, 大局的な見地から`,
    key_phrases: [
      'お言葉を返すようではございますが',
      '双方の立場に鑑み',
      '落としどころ',
      '誠心誠意尽くす所存',
      '大局的な見地から',
    ],
    is_custom: false,
  },
];
