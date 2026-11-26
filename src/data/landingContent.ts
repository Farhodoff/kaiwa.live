import type { Language } from '../context/LanguageContext';

export const LANDING_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type LandingLevel = (typeof LANDING_LEVELS)[number];

const uz = {
  seoTitle: 'JLPT N5–N1 ga aniq reja bilan tayyorlaning',
  description:
    'Darajangizga mos darslar, aqlli takrorlash va sinov imtihonlari. Nima o‘qish va nimani qayta mashq qilish kerakligini biling.',
  headline: ['JLPT N5–N1 ga', 'aniq reja bilan', 'tayyorlaning.'],
  eyebrow: 'Yapon tili · O‘zbekcha tushuntirishlar',
  chooseLevel: 'Darajamni tanlash',
  sampleLesson: 'Namunaviy darsni ko‘rish',
  login: 'Kirish',
  how: 'Qanday ishlaydi',
  levels: 'Darajalar',
  practice: 'Sinab ko‘rish',
  faq: 'Savol-javob',
  menu: 'Menyu',
  theme: 'Mavzuni almashtirish',
  language: 'Interfeys tili',
  skip: 'Asosiy mazmunga o‘tish',
  noAccount: 'Namunani ro‘yxatdan o‘tmasdan ko‘ring.',
  heroFacts: ['N5 dan N1 gacha', 'O‘zbekcha izohlar', 'Dars, mashq va takrorlash'],
  previewLabel: 'Mahsulot namunasi',
  previewTitle: 'Bugungi mashg‘ulot',
  previewSubtitle: 'Bitta maqsad. Tushunarli keyingi qadam.',
  previewTasks: ['So‘zlarni takrorlash', 'Grammatikani o‘rganish', 'Tinglab tushunish'],
  previewDescriptions: [
    'Oldingi so‘zlarni mustahkamlang',
    'Misol orqali mavzuni tushuning',
    'Audio va savollar bilan mashq qiling',
  ],
  previewNext: 'Keyingi dars',
  previewLesson: 'Tanishuv va o‘zini tanishtirish',
  previewAction: 'Darsni ko‘rish',
  previewNote: 'Bu namuna. Shaxsiy mashg‘ulotlar o‘quv jarayoningizga qarab ko‘rsatiladi.',
  howTitle: 'Nima qilishni bilib o‘qing.',
  steps: [
    {
      title: 'Maqsadingizni tanlang',
      description:
        'Tayyorlanayotgan JLPT darajangizni belgilang. Ishonchingiz komil bo‘lmasa, N5 namunasidan boshlang.',
    },
    {
      title: 'Dars va mashqni bajaring',
      description:
        'Lug‘at, kanji va grammatikani o‘rganing. O‘qish va tinglash savollarida qo‘llab ko‘ring.',
    },
    {
      title: 'Xatolaringizga qayting',
      description:
        'Adashgan savollaringizni qayta yeching. So‘zlarni interval bilan takrorlab, sinov natijalarini kuzating.',
    },
  ],
  levelsTitle: 'Siz qaysi bosqichdasiz?',
  levelsDescription:
    'Maqsad darajangizni tanlang. Har bir bosqich uchun mavzular va namunaviy savollarni ko‘ring.',
  levelTopics: 'Nimalarni mashq qilasiz',
  openLessons: 'darslarini ko‘rish',
  tryLevel: 'savolini sinash',
  sampleEyebrow: 'Bitta savoldan boshlang',
  sampleTitle: 'Javob bering. Sababini tushuning.',
  sampleDescription: 'Bo‘sh joyga mos javobni tanlang. Har bir javobdan keyin izohni ko‘rasiz.',
  sampleInstruction: 'Bo‘sh joyni to‘ldiring',
  correct: 'To‘g‘ri javob!',
  incorrect: 'Yana bir bor ko‘rib chiqamiz.',
  correctAnswer: 'To‘g‘ri javob:',
  reset: 'Qayta urinib ko‘rish',
  continueLesson: 'Shu darajada davom etish',
  sampleNote: 'Bu namunaviy mashq. Natijasi shaxsiy statistikangizga qo‘shilmaydi.',
  featuresTitle: 'Tayyorgarlik uchun kerakli vositalar.',
  features: [
    {
      title: 'Tartibli darslar',
      description: 'Lug‘at, kanji va grammatikani darajangizga mos mavzular orqali o‘rganing.',
    },
    {
      title: 'Aqlli takrorlash',
      description: 'Muddati kelgan kartalar va oldingi xatolarni bir joyda qayta ishlang.',
    },
    {
      title: 'Sinov imtihonlari',
      description:
        'Vaqt bilan ishlashni mashq qiling va savollardagi xatolaringizni tahlil qiling.',
    },
    {
      title: 'Tushunarli natijalar',
      description:
        'Qaysi yo‘nalishda o‘sayotganingizni qayd etilgan javoblar va sinov natijalari orqali kuzating.',
    },
  ],
  extras: 'Ko‘proq mashq kerakmi?',
  extraDescription: 'AI suhbat va ssenariylar qo‘shimcha mashq sifatida mavjud.',
  extraLink: 'AI suhbatni ko‘rish',
  faqTitle: 'Boshlashdan oldin.',
  faqs: [
    {
      question: 'Akkauntsiz sinab ko‘rsam bo‘ladimi?',
      answer:
        'Ha. Shu sahifadagi namunaviy savolni yechish va ochiq darslarni ko‘rish uchun ro‘yxatdan o‘tish shart emas. Shaxsiy o‘quv jarayonini hisobingizda davom ettirish uchun akkaunt oching.',
    },
    {
      question: 'Foydalanish bepulmi?',
      answer:
        'Hozir platformadan foydalanish bepul. AI va audio xizmatlari internet ulanishi hamda xizmat mavjudligiga bog‘liq. Foydalanish shartlari uchun narxlar sahifasini ko‘ring.',
    },
    {
      question: 'Qaysi darajadan boshlashim kerak?',
      answer:
        'Boshlovchi bo‘lsangiz N5 darslarini ko‘ring. Oldin o‘qigan bo‘lsangiz, tanish darajangizdagi namunani sinang. Bu sahifadagi bitta savol darajangizni aniqlovchi diagnostik test emas.',
    },
    {
      question: 'Sinov bali rasmiy JLPT natijasimi?',
      answer:
        'Yo‘q. Platformadagi sinovlar mashq qilish uchun. Ular JLPT sertifikati bermaydi va natijasi rasmiy imtihon baliga teng deb olinmaydi.',
    },
    {
      question: 'Telefonda ham ishlaydimi?',
      answer:
        'Ha. Platformani telefon brauzerida ochishingiz mumkin. Ovozli mashqlar uchun mos brauzer va mikrofon ruxsati kerak bo‘lishi mumkin.',
    },
  ],
  finalTitle: 'Keyingi qadamni bugun qo‘ying.',
  finalDescription: 'Darajangizni tanlang. Bitta darsni oching. Bitta mavzuni yaxshiroq tushuning.',
  createAccount: 'O‘quv jarayonimni saqlash',
  footer: 'Yapon tili va JLPT tayyorgarligi uchun.',
  pricing: 'Narxlar va foydalanish',
  copyright: 'Barcha huquqlar himoyalangan.',
};
type LandingCopy = typeof uz;
export const landingCopy: Record<Language, LandingCopy> = {
  uz,
  en: {
    seoTitle: 'Prepare for JLPT N5–N1 with a clear study plan',
    description:
      'Lessons at your level, spaced review, and practice exams. Know what to study next and what to revisit.',
    headline: ['JLPT N5–N1.', 'A clear plan.', 'One step a day.'],
    eyebrow: 'Japanese study · Explanations in Uzbek',
    chooseLevel: 'Choose my level',
    sampleLesson: 'Explore a sample lesson',
    login: 'Sign in',
    how: 'How it works',
    levels: 'Levels',
    practice: 'Try a question',
    faq: 'FAQ',
    menu: 'Menu',
    theme: 'Switch theme',
    language: 'Interface language',
    skip: 'Skip to main content',
    noAccount: 'Explore the sample without an account.',
    heroFacts: ['N5 through N1', 'Explanations in Uzbek', 'Learn, practice, review'],
    previewLabel: 'Product preview',
    previewTitle: 'Today’s study',
    previewSubtitle: 'One goal. A clear next step.',
    previewTasks: ['Review vocabulary', 'Learn grammar', 'Practice listening'],
    previewDescriptions: [
      'Strengthen words you have learned',
      'Understand a pattern through examples',
      'Listen and check your understanding',
    ],
    previewNext: 'Next lesson',
    previewLesson: 'Introductions and greetings',
    previewAction: 'Explore the lesson',
    previewNote: 'An illustrative preview. Your study activities depend on your learning progress.',
    howTitle: 'Know what to work on next.',
    steps: [
      {
        title: 'Choose your goal',
        description:
          'Select the JLPT level you are preparing for. If you are unsure, start with the N5 sample.',
      },
      {
        title: 'Learn and practice',
        description:
          'Study vocabulary, kanji and grammar. Apply what you learn to reading and listening questions.',
      },
      {
        title: 'Revisit your mistakes',
        description:
          'Retry the questions you missed. Review words at intervals and follow your practice results.',
      },
    ],
    levelsTitle: 'Find your starting point.',
    levelsDescription:
      'Choose your target level. Explore the topics and sample questions for each stage.',
    levelTopics: 'What you will practice',
    openLessons: 'lessons',
    tryLevel: 'sample question',
    sampleEyebrow: 'Start with one question',
    sampleTitle: 'Choose an answer. Understand why.',
    sampleDescription: 'Choose the answer that fits the sentence. Then read the explanation.',
    sampleInstruction: 'Fill in the blank',
    correct: 'That’s correct!',
    incorrect: 'Let’s take another look.',
    correctAnswer: 'Correct answer:',
    reset: 'Try again',
    continueLesson: 'Continue at this level',
    sampleNote: 'This is a sample exercise. Its result is not added to your personal statistics.',
    featuresTitle: 'The tools your preparation needs.',
    features: [
      {
        title: 'Structured lessons',
        description:
          'Study vocabulary, kanji and grammar through topics matched to your selected level.',
      },
      {
        title: 'Spaced review',
        description: 'Revisit cards due for review and questions you missed in one place.',
      },
      {
        title: 'Practice exams',
        description: 'Practice working with a timer and review the questions you got wrong.',
      },
      {
        title: 'Clear results',
        description: 'Follow your progress through recorded answers and practice results.',
      },
    ],
    extras: 'Want more practice?',
    extraDescription: 'AI conversation and scenarios are available as additional practice.',
    extraLink: 'Explore AI conversation',
    faqTitle: 'Before you begin.',
    faqs: [
      {
        question: 'Can I try it without an account?',
        answer:
          'Yes. You can answer the sample question here and explore public lessons without registering. Create an account to continue your personal study progress.',
      },
      {
        question: 'Is it free to use?',
        answer:
          'The platform is currently free to use. AI and audio features depend on an internet connection and service availability. See the pricing page for usage information.',
      },
      {
        question: 'Which level should I start with?',
        answer:
          'If you are a beginner, explore N5 lessons. If you have studied before, try a sample at a familiar level. One question on this page is not a diagnostic assessment.',
      },
      {
        question: 'Is a practice score an official JLPT result?',
        answer:
          'No. These exams are for practice. They do not provide a JLPT certificate, and their scores should not be treated as official JLPT results.',
      },
      {
        question: 'Does it work on a phone?',
        answer:
          'Yes. Open the platform in your phone’s browser. Voice exercises may require a supported browser and microphone permission.',
      },
    ],
    finalTitle: 'Take your next step today.',
    finalDescription: 'Choose your level. Open one lesson. Understand one topic a little better.',
    createAccount: 'Save my study progress',
    footer: 'Japanese learning and JLPT preparation.',
    pricing: 'Pricing and usage',
    copyright: 'All rights reserved.',
  },
  ja: {
    seoTitle: '明確な学習計画でJLPT N5〜N1対策',
    description:
      'レベルに合ったレッスン、間隔をあけた復習、模擬試験。次に学ぶことと復習する内容を確認できます。',
    headline: ['JLPT N5〜N1。', '明確な計画で、', '毎日一歩ずつ。'],
    eyebrow: '日本語学習 · ウズベク語の解説',
    chooseLevel: 'レベルを選ぶ',
    sampleLesson: 'サンプルレッスンを見る',
    login: 'ログイン',
    how: '学習の流れ',
    levels: 'レベル',
    practice: '問題を試す',
    faq: 'よくある質問',
    menu: 'メニュー',
    theme: 'テーマを切り替える',
    language: '表示言語',
    skip: '本文へスキップ',
    noAccount: '登録せずにサンプルを試せます。',
    heroFacts: ['N5からN1まで', 'ウズベク語の解説', '学習・練習・復習'],
    previewLabel: '画面サンプル',
    previewTitle: '今日の学習',
    previewSubtitle: '目標は一つ。次の一歩を明確に。',
    previewTasks: ['単語を復習する', '文法を学ぶ', '聴解を練習する'],
    previewDescriptions: [
      '学んだ単語を定着させる',
      '例文で文型を理解する',
      '音声と問題で理解を確認する',
    ],
    previewNext: '次のレッスン',
    previewLesson: '自己紹介と挨拶',
    previewAction: 'レッスンを見る',
    previewNote: '画面はサンプルです。学習内容はご自身の進捗に応じて表示されます。',
    howTitle: '次に学ぶことを明確に。',
    steps: [
      {
        title: '目標を選ぶ',
        description: '目標のJLPTレベルを選びます。迷ったらN5のサンプルから始めましょう。',
      },
      {
        title: '学んで練習する',
        description: '語彙・漢字・文法を学び、読解や聴解の問題で使ってみましょう。',
      },
      {
        title: '間違いを復習する',
        description: '間違えた問題を解き直し、間隔をあけて単語を復習。練習結果も確認できます。',
      },
    ],
    levelsTitle: 'どこから始めますか？',
    levelsDescription: '目標のレベルを選び、各段階のテーマとサンプル問題を見てみましょう。',
    levelTopics: '練習する内容',
    openLessons: 'のレッスンを見る',
    tryLevel: 'の問題を試す',
    sampleEyebrow: 'まずは一問から',
    sampleTitle: '答えを選び、理由を理解する。',
    sampleDescription: '空欄に合う答えを選んで、解説を確認しましょう。',
    sampleInstruction: '空欄に合う答えを選んでください',
    correct: '正解です！',
    incorrect: 'もう一度確認しましょう。',
    correctAnswer: '正解：',
    reset: 'もう一度試す',
    continueLesson: 'このレベルで学習を続ける',
    sampleNote: 'サンプル問題です。結果は個人の学習統計に追加されません。',
    featuresTitle: '試験対策に必要な学習ツール。',
    features: [
      {
        title: '体系的なレッスン',
        description: '選んだレベルのテーマを通して語彙・漢字・文法を学べます。',
      },
      {
        title: '間隔をあけた復習',
        description: '復習予定のカードと間違えた問題を一か所で確認できます。',
      },
      { title: '模擬試験', description: '時間を計って問題を解き、間違いを振り返りましょう。' },
      {
        title: '明確な学習結果',
        description: '記録された回答と練習結果から、分野ごとの進捗を確認できます。',
      },
    ],
    extras: 'もっと練習したいですか？',
    extraDescription: 'AI会話と場面別の練習も追加の練習として利用できます。',
    extraLink: 'AI会話を見る',
    faqTitle: '始める前に。',
    faqs: [
      {
        question: '登録せずに試せますか？',
        answer:
          'はい。このページのサンプル問題と公開レッスンは登録せずに試せます。個人の学習を続けるにはアカウントを作成してください。',
      },
      {
        question: '無料で利用できますか？',
        answer:
          '現在、プラットフォームは無料で利用できます。AIと音声機能はインターネット接続とサービスの稼働状況に依存します。利用については料金ページをご覧ください。',
      },
      {
        question: 'どのレベルから始めればいいですか？',
        answer:
          '初心者はN5のレッスンから始めましょう。学習経験がある場合は、慣れたレベルのサンプルを試してください。このページの一問だけで実力を診断するものではありません。',
      },
      {
        question: '模擬試験の点数は公式JLPTの結果ですか？',
        answer:
          'いいえ。練習のための試験です。JLPTの認定書は発行せず、点数は公式JLPTの結果と同じものではありません。',
      },
      {
        question: 'スマートフォンで使えますか？',
        answer:
          'はい。スマートフォンのブラウザで利用できます。音声練習には対応ブラウザとマイクの許可が必要な場合があります。',
      },
    ],
    finalTitle: '今日、次の一歩を。',
    finalDescription: 'レベルを選び、一つのレッスンを開き、一つのテーマを理解しましょう。',
    createAccount: '学習を保存する',
    footer: '日本語学習とJLPT対策のために。',
    pricing: '料金と利用について',
    copyright: 'All rights reserved.',
  },
};

export const landingLevelCopy: Record<
  Language,
  Record<LandingLevel, { title: string; description: string; topics: string[] }>
> = {
  uz: {
    N5: {
      title: 'Birinchi poydevor',
      description: 'Yapon tilini endi boshlayotgan yoki asoslarni mustahkamlayotganlar uchun.',
      topics: [
        'Hiragana, katakana va asosiy kanji',
        'Kundalik so‘zlar va sodda gaplar',
        'Qisqa matnlar va sekin dialoglar',
      ],
    },
    N4: {
      title: 'Asoslarni kengaytirish',
      description: 'Sodda gaplardan kundalik vaziyatlarni tushunishga o‘tayotganlar uchun.',
      topics: [
        'Fe’l shakllari va bog‘lovchi qoliplar',
        'Kundalik hayot mavzulari',
        'Qisqa hikoyalar va suhbatlar',
      ],
    },
    N3: {
      title: 'O‘rta bosqich',
      description: 'Kundalik tilni yaxshi bilib, murakkabroq matnlarga o‘tayotganlar uchun.',
      topics: [
        'Gaplar orasidagi ma’no bog‘lanishi',
        'Kengroq lug‘at va grammatika',
        'Matn va suhbatdagi asosiy fikr',
      ],
    },
    N2: {
      title: 'Murakkab matnlar',
      description:
        'Maqolalar va turli vaziyatlardagi tabiiy nutqni tushunishni mashq qiluvchilar uchun.',
      topics: [
        'Rasmiy va mavhum ifodalar',
        'Maqolalardagi dalil va xulosalar',
        'Tabiiy tezlikdagi suhbatlar',
      ],
    },
    N1: {
      title: 'Ma’no nozikliklari',
      description:
        'Murakkab yaponcha matn va nutqni chuqurroq tushunishni mashq qiluvchilar uchun.',
      topics: [
        'Murakkab grammatik qoliplar',
        'Muallif nuqtayi nazari va yashirin ma’no',
        'Keng mavzulardagi o‘qish va tinglash',
      ],
    },
  },
  en: {
    N5: {
      title: 'Build a foundation',
      description: 'For beginners and learners strengthening the basics.',
      topics: [
        'Hiragana, katakana and basic kanji',
        'Everyday words and simple sentences',
        'Short texts and slow dialogues',
      ],
    },
    N4: {
      title: 'Expand the basics',
      description: 'Move from simple sentences to understanding everyday situations.',
      topics: [
        'Verb forms and connecting patterns',
        'Everyday life topics',
        'Short stories and conversations',
      ],
    },
    N3: {
      title: 'The intermediate step',
      description: 'For learners moving from everyday Japanese to more complex texts.',
      topics: [
        'Connections between ideas',
        'Broader vocabulary and grammar',
        'Main ideas in texts and conversations',
      ],
    },
    N2: {
      title: 'Handle complex texts',
      description: 'Practice understanding articles and natural speech in different situations.',
      topics: [
        'Formal and abstract expressions',
        'Arguments and conclusions in articles',
        'Conversations at natural speed',
      ],
    },
    N1: {
      title: 'Understand the nuances',
      description: 'Practice a deeper understanding of complex Japanese texts and speech.',
      topics: [
        'Advanced grammar patterns',
        'Author viewpoints and implied meaning',
        'Reading and listening across broad topics',
      ],
    },
  },
  ja: {
    N5: {
      title: '基礎をつくる',
      description: '日本語を始めた方、基礎を固めたい方へ。',
      topics: [
        'ひらがな・カタカナ・基本の漢字',
        '日常の単語と簡単な文',
        '短い文章とゆっくりした会話',
      ],
    },
    N4: {
      title: '基礎を広げる',
      description: '簡単な文から日常場面の理解へ進む方へ。',
      topics: ['動詞の活用と接続表現', '日常生活の話題', '短い物語と会話'],
    },
    N3: {
      title: '中級への一歩',
      description: '日常の日本語から、より複雑な文章へ進む方へ。',
      topics: ['文と文の意味のつながり', '幅広い語彙と文法', '文章や会話の要点'],
    },
    N2: {
      title: '複雑な文章を読む',
      description: '記事やさまざまな場面の自然な会話を理解する練習に。',
      topics: ['改まった表現と抽象的な表現', '記事の根拠と結論', '自然な速さの会話'],
    },
    N1: {
      title: '微妙な意味を理解する',
      description: '複雑な日本語の文章や発話を深く理解する練習に。',
      topics: ['高度な文法表現', '筆者の視点と暗示された意味', '幅広い話題の読解と聴解'],
    },
  },
};

// Small samples from the existing practice bank. Keep the full exam bank out of the landing bundle.
export const landingQuestions: Record<
  LandingLevel,
  { prompt: string; options: string[]; correct: number; explanations: Record<Language, string> }
> = {
  N5: {
    prompt: 'きょうは 水曜日です。あしたは（　）曜日です。',
    options: ['火', '木', '金', '土'],
    correct: 1,
    explanations: {
      uz: '水曜日 — chorshanba. Ertasi kuni payshanba, ya’ni 木曜日（もくようび）bo‘ladi.',
      en: '水曜日 is Wednesday. The next day is Thursday: 木曜日（もくようび）.',
      ja: '水曜日の次の日は木曜日（もくようび）です。',
    },
  },
  N4: {
    prompt: '雨が 降って（　）、試合は 中止になりました。',
    options: ['きたので', 'くるのに', 'きたら', 'きても'],
    correct: 0,
    explanations: {
      uz: '「〜ので」sababni bildiradi: yomg‘ir yog‘a boshlagani uchun o‘yin bekor qilindi. 「降ってきたので」bu yerda sabab va natijani bog‘laydi.',
      en: '「〜ので」expresses a reason: the game was cancelled because it started raining. 「降ってきたので」connects the cause and result.',
      ja: '「〜ので」は理由を表します。雨が降ってきたことが、試合が中止になった理由です。',
    },
  },
  N3: {
    prompt: '大事な 会議の 最中に、携帯電話が 鳴って（　）。',
    options: ['しまった', 'おいた', 'みた', 'いった'],
    correct: 0,
    explanations: {
      uz: '「〜てしまった」bu gapda kutilmagan, noxush hodisani bildiradi: muhim yig‘ilish paytida telefon jiringlab ketdi.',
      en: '「〜てしまった」here expresses an unintended, regrettable event: a phone rang during an important meeting.',
      ja: 'この文の「〜てしまった」は、意図せず起きた残念な出来事を表します。',
    },
  },
  N2: {
    prompt: '景気の 低迷に（　）、多くの 企業が 採用人数を 削減した。',
    options: ['ともなって', '関わらず', '限らず', 'おいて'],
    correct: 0,
    explanations: {
      uz: '「〜にともなって」bir o‘zgarish bilan birga boshqa o‘zgarish sodir bo‘lishini bildiradi. Iqtisodiy pasayish bilan birga korxonalar ishga qabulni qisqartirgan.',
      en: '「〜にともなって」describes one change accompanying another. Companies reduced hiring as the economy weakened.',
      ja: '「〜にともなって」は、ある変化とともに別の変化が起こることを表します。',
    },
  },
  N1: {
    prompt: '誠心誠意の 謝罪が あって（　）、初めて 和解への 道が 開かれる。',
    options: ['こそあれ', 'ならでは', 'をおいて', 'こそ'],
    correct: 3,
    explanations: {
      uz: '「〜あってこそ」zarur shartni ta’kidlaydi: faqat chin dildan uzr so‘ralgandagina yarashishga yo‘l ochiladi.',
      en: '「〜あってこそ」emphasizes an essential condition: only with a sincere apology can reconciliation become possible.',
      ja: '「〜あってこそ」は欠かせない条件を強調します。心からの謝罪があって初めて、和解が可能になるという意味です。',
    },
  },
};
