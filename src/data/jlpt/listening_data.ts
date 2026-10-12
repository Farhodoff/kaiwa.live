/**
 * listening_data.ts
 * Comprehensive JLPT Choukai (聴解 - Listening) Master Database.
 * Contains authentic exam scenarios across N5, N4, N3, N2, N1 with
 * structured dialogue lines, multi-speaker tagging, and detailed pedagogical explanations.
 */

export interface DialogueLine {
  id: string;
  speaker: string; // e.g. '男', '女', '先生', '店員', 'ナレーション', 'アナウンス'
  speakerRoleUz?: string; // 'Erkak', 'Ayol', 'O'qituvchi', 'Sotuvchi', 'Boshlovchi'
  gender?: 'male' | 'female' | 'neutral';
  japanese: string;
  uzbek?: string;
  startTime?: number; // Exact start timestamp in seconds (Karaoke sync)
  endTime?: number; // Exact end timestamp in seconds (Karaoke sync)
}

export interface JlptListeningQuestion {
  id: number | string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  type: 'task' | 'point' | 'quick' | 'summary'; // 課題理解, ポイント理解, 即時応答, 概要理解
  titleUz?: string;
  audioUrl?: string;
  script: string;
  dialogueLines?: DialogueLine[];
  questionText: string;
  questionTextUz?: string;
  options: string[];
  optionsUz?: string[];
  correctAnswer: number; // index of options (0-indexed)
  explanationUzbek: string;
  tipUzbek?: string;
}

export const JLPT_LISTENING_QUESTIONS: JlptListeningQuestion[] = [
  {
    id: 1,
    level: 'N5',
    type: 'task',
    titleUz: 'Soyabon olish',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_002.mp3',
    script:
      '男の人と女の人が話しています。男の人はこれから何をしますか？\n男：あ、雨が降ってきましたね。\n女：そうですね。傘を持っていますか？\n男：いいえ、持っていません。コンビニで買ってきます。\n女：あ、私の傘を貸しましょうか？車の中にありますから。\n男：ありがとうございます！じゃあ、お願いします。',
    questionText: '男の人はこれから何をしますか？',
    questionTextUz: 'Erkak kishi bundan keyin nima qiladi?',
    options: [
      'コンビニで傘を買います',
      '女の人の車から傘を持ってきます',
      '雨の中を歩きます',
      '店の中で待ちます',
    ],
    optionsUz: [
      "Do'kondan soyabon sotib oladi",
      'Ayolning mashinasidan soyabonni oladi',
      "Yomg'irda piyoda yuradi",
      "Do'kon ichida kutadi",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Erkak kishi soyaboni yo'qligini aytib do'kondan sotib olmoqchi bo'ladi, ammo ayol mashinasidagi zaxira soyabonini berib turishini aytganda erkak buni minnatdorchilik bilan qabul qiladi. Demak, u ayolning mashinasidan soyabonni oladi.",
    tipUzbek:
      "Suhbat oxiridagi 'じゃあ、お願いします' (undog'am iltimos) jumlasi ayolning taklifiga rozilikni bildiradi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '男の人と女の人が話しています。男の人はこれから何をしますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'あ、雨が降ってきましたね。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: 'そうですね。傘を持っていますか？',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'いいえ、持っていません。コンビニで買ってきます。',
        uzbek: '',
      },
      {
        id: 'line_5',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: 'あ、私の傘を貸しましょうか？車の中にありますから。',
        uzbek: '',
      },
      {
        id: 'line_6',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'ありがとうございます！じゃあ、お願いします。',
        uzbek: '',
      },
    ],
  },
  {
    id: 2,
    level: 'N5',
    type: 'quick',
    titleUz: "Poezd yo'li raqami",
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_003.mp3',
    script:
      '駅で男の人が駅員に聞いています。\n男：すみません、東京行きの電車は何番線ですか？\n駅員：3番線ですよ。もうすぐ来ますよ。',
    questionText: '東京行きの電車は何番線ですか？',
    questionTextUz: "Tokioga ketadigan poyezd nechanchi yo'ldan jo'naydi?",
    options: ['1番線', '2番線', '3番線', '4番線'],
    optionsUz: ["1-yo'l", "2-yo'l", "3-yo'l", "4-yo'l"],
    correctAnswer: 2,
    explanationUzbek: "Vokzal xodimi aniq qilib '3番線ですよ' (3-yo'l) deb javob beradi.",
    tipUzbek: "Raqamlar va '番線' (yo'l raqami) qo'shimchasiga diqqat qiling.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '駅で男の人が駅員に聞いています。',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'すみません、東京行きの電車は何番線ですか？',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '駅員',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '3番線ですよ。もうすぐ来ますよ。',
        uzbek: '',
      },
    ],
  },
  {
    id: 3,
    level: 'N5',
    type: 'point',
    titleUz: 'Test kuni',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_004.mp3',
    script:
      '学校で先生と学生が話しています。テストは何曜日ですか？\n学生：先生、日本語のテストは金曜日ですか？\n先生：いいえ、金曜日は祝日でお休みですから、木曜日に行いますよ。\n学生：わかりました。木曜日ですね。',
    questionText: '日本語のテストは何曜日ですか？',
    questionTextUz: "Yapon tili testi haftaning qaysi kuni bo'ladi?",
    options: ['水曜日', '木曜日', '金曜日', '土曜日'],
    optionsUz: ['Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
    correctAnswer: 1,
    explanationUzbek:
      "O'qituvchi juma kuni bayram bo'lgani sababli, test payshanba (木曜日) kuni o'tkazilishini tushuntiradi.",
    tipUzbek:
      "'金曜日は祝日でお休み' (juma bayram va dam olish) sababli '木曜日' (payshanba) tanlanadi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '学校で先生と学生が話しています。テストは何曜日ですか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '学生',
        speakerRoleUz: 'Talaba',
        gender: 'neutral',
        japanese: '先生、日本語のテストは金曜日ですか？',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '先生',
        speakerRoleUz: "O'qituvchi",
        gender: 'male',
        japanese: 'いいえ、金曜日は祝日でお休みですから、木曜日に行いますよ。',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '学生',
        speakerRoleUz: 'Talaba',
        gender: 'neutral',
        japanese: 'わかりました。木曜日ですね。',
        uzbek: '',
      },
    ],
  },
  {
    id: 12,
    level: 'N5',
    type: 'task',
    titleUz: "Ko'ylak xaridi",
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_005.mp3',
    script:
      '店で男の人と店員が話しています。男の人はどのシャツを買いますか？\n男：すみません、この白いシャツのMサイズはありますか？\n店員：申し訳ありません、白のMは売り切れてしまいました。青のMならございます。\n男：そうですか。じゃあ、青のMをお願いします。',
    questionText: '男の人はどのシャツを買いますか？',
    questionTextUz: "Erkak qaysi ko'ylakni sotib oladi?",
    options: ['白のMサイズ', '青のMサイズ', '白のLサイズ', '黒のSサイズ'],
    optionsUz: [
      "Oq rangli M o'lcham",
      "Ko'k rangli M o'lcham",
      "Oq rangli L o'lcham",
      "Qora rangli S o'lcham",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Oq M o'lcham qolmagani uchun xaridor sotuvchi taklif qilgan ko'k rangli M o'lchamdagi ko'ylakni sotib oladi.",
    tipUzbek: "'売り切れ' (tugab qolgan) so'zidan keyingi muqobil taklifga e'tibor qarating.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '店で男の人と店員が話しています。男の人はどのシャツを買いますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'すみません、この白いシャツのMサイズはありますか？',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '店員',
        speakerRoleUz: 'Xodim / Sotuvchi',
        gender: 'neutral',
        japanese: '申し訳ありません、白のMは売り切れてしまいました。青のMならございます。',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'そうですか。じゃあ、青のMをお願いします。',
        uzbek: '',
      },
    ],
  },
  {
    id: 13,
    level: 'N5',
    type: 'quick',
    titleUz: 'Mehmondorchilik odobi',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_006.mp3',
    script:
      '友達の家で。友達がお茶を出してくれました。何と言いますか？\n男：お茶をどうぞ。\nあなた：あ、（　）',
    questionText: 'こんなとき、何と言いますか？',
    questionTextUz: 'Bunday vaziyatda nima deyiladi?',
    options: ['いただきます', 'ごちそうさまでした', 'いってきます', 'ただいま'],
    optionsUz: [
      'Itadakimasu (Ichish/yeyishdan oldin)',
      'Gochisousamadeshita (Ovqatdan keyin)',
      'Ittekimasu (Uydan chiqayotganda)',
      'Tadaima (Uyga qaytganda)',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Ichimlik yoki taom taqdim etilganda boshlashdan oldin 'いただきます' (itadakimasu) aytiladi.",
    tipUzbek: "Oshxona va mehmondorchilik kundalik iboralari JLPT N5 Choukaida juda ko'p tushadi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '友達の家で。友達がお茶を出してくれました。何と言いますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'お茶をどうぞ。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: 'あなた',
        speakerRoleUz: 'Siz',
        gender: 'neutral',
        japanese: 'あ、（　）',
        uzbek: '',
      },
    ],
  },
  {
    id: 22,
    level: 'N5',
    type: 'task',
    titleUz: 'Kutubxonada kitob topshirish',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_007.mp3',
    script:
      '図書館で男の学生と係の人が話しています。学生は何冊本を返しますか？\n学生：すみません、本を返したいんですが。\n係員：はい。全部で4冊ですね。あれ、この本は来週まで借りられますよ。\n学生：あ、まだ読んでいないので、この1冊はそのまま借ります。\n係員：わかりました。じゃあ、3冊お預かりします。',
    questionText: '学生は何冊本を返しますか？',
    questionTextUz: 'Talaba necha dona kitobni qaytaradi?',
    options: ['1冊', '2冊', '3冊', '4冊'],
    optionsUz: ['1 dona', '2 dona', '3 dona', '4 dona'],
    correctAnswer: 2,
    explanationUzbek:
      "Talabada jami 4 ta kitob bo'lgan, ammo bittasini hali o'qib bo'lmagani sababli olib qoladi. Natijada 3 ta kitobni qaytaradi (3冊お預かりします).",
    tipUzbek: 'Sonlar hisobi: 4 - 1 = 3 ta kitob qaytariladi.',
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '図書館で男の学生と係の人が話しています。学生は何冊本を返しますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '学生',
        speakerRoleUz: 'Talaba',
        gender: 'neutral',
        japanese: 'すみません、本を返したいんですが。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '係員',
        speakerRoleUz: 'Xodim / Sotuvchi',
        gender: 'neutral',
        japanese: 'はい。全部で4冊ですね。あれ、この本は来週まで借りられますよ。',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '学生',
        speakerRoleUz: 'Talaba',
        gender: 'neutral',
        japanese: 'あ、まだ読んでいないので、この1冊はそのまま借ります。',
        uzbek: '',
      },
      {
        id: 'line_5',
        speaker: '係員',
        speakerRoleUz: 'Xodim / Sotuvchi',
        gender: 'neutral',
        japanese: 'わかりました。じゃあ、3冊お預かりします。',
        uzbek: '',
      },
    ],
  },
  {
    id: 23,
    level: 'N5',
    type: 'point',
    titleUz: 'Ertangi uchrashuv joyi',
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_008.mp3',
    script:
      '男の人と女の人が話しています。2人は明日どこで会いますか？\n男：明日の待ち合わせ、駅の改札口でいい？\n女：改札口は人が多くて見つけにくいから、駅の東口にあるカフェの前にしない？\n男：あそこね、いいね。じゃあ、10時にカフェの前で。\n女：うん、そうしよう。',
    questionText: '2人は明日どこで会いますか？',
    questionTextUz: 'Ular ertaga qayerda uchrashadilar?',
    options: ['駅の改札口', '駅の東口のカフェの前', '駅のホーム', '学校の前'],
    optionsUz: [
      'Vokzal chiptaxonasida',
      'Sharqiy chiqishdagi qahvaxona oldida',
      'Poyezd platformasida',
      'Maktab oldida',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Erkak dastlab chiptaxona (改札口) oldini taklif qiladi, lekin ayol u yerda odam ko'pligini aytib, sharqiy chiqishdagi kafe oldini (駅の東口にあるカフェの前) tanlaydi va erkak rozi bo'ladi.",
    tipUzbek: "Taklif qilingan birinchi joy emas, kelishilgan yakuniy joy to'g'ri javob bo'ladi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '男の人と女の人が話しています。2人は明日どこで会いますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: '明日の待ち合わせ、駅の改札口でいい？',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: '改札口は人が多くて見つけにくいから、駅の東口にあるカフェの前にしない？',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'あそこね、いいね。じゃあ、10時にカフェの前で。',
        uzbek: '',
      },
      {
        id: 'line_5',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: 'うん、そうしよう。',
        uzbek: '',
      },
    ],
  },
  {
    id: 24,
    level: 'N5',
    type: 'quick',
    titleUz: "Kutubxonada ruxsat so'rash",
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_009.mp3',
    script: '教室でペンがありません。隣の人に借りたいです。何と言いますか？\nあなた：（　）',
    questionText: 'こんなとき、何と言いますか？',
    questionTextUz: "Ruchka so'rashda qanday murojaat qilinadi?",
    options: [
      'ペンを貸してください',
      'ペンを借りてください',
      'ペンをあげますよ',
      'ペンをもらいませんか',
    ],
    optionsUz: [
      'Iltimos, ruchkangizni berib turing',
      'Ruchka qarz oling',
      'Sizga ruchka beraman',
      'Ruchka olmaysizmi',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Birovdan narsa so'rab turishda '貸してください' (kashite kudasai - qarzga/berib turing) iborasi ishlatiladi.",
    tipUzbek: "«貸す» (berib turmoq) va «借りる» (olib turmoq) fe'llarini adashtirmaslik kerak.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '教室でペンがありません。隣の人に借りたいです。何と言いますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: 'あなた',
        speakerRoleUz: 'Siz',
        gender: 'neutral',
        japanese: '（　）',
        uzbek: '',
      },
    ],
  },
  {
    id: 25,
    level: 'N5',
    type: 'task',
    titleUz: "Supermarketdagi xarid ro'yxati",
    audioUrl: '/audio/choukai/n5/minna_shokyu_1_010.mp3',
    script:
      '家で母親と息子が話しています。息子は何を買ってきますか？\n母：買い物に行ってくれる？牛乳と卵を買ってきて。\n息子：わかった。パンはまだあったっけ？\n母：パンは今朝買ったのがあるから買わなくていいわ。あ、リンゴも2つお願い。\n息子：牛乳、卵、リンゴ2つだね。行ってきます。',
    questionText: '息子は何を買ってきますか？',
    questionTextUz: "O'g'il nimalarni sotib olib keladi?",
    options: ['牛乳と卵とリンゴ', '牛乳とパンとリンゴ', 'パンと卵だけ', '牛乳とパンだけ'],
    optionsUz: ['Sut, tuxum va olma', 'Sut, non va olma', 'Faqat non va tuxum', 'Faqat sut va non'],
    correctAnswer: 0,
    explanationUzbek:
      "Ona sut va tuxum, so'ngra 2 ta olma buyuradi. Non esa ertalab olingani sababli kerak emas (買わなくていい). Shuning uchun o'g'il sut, tuxum va olma olib keladi.",
    tipUzbek: "'買わなくていい' (olish shart emas) degan narsa ro'yxatdan chiqariladi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '家で母親と息子が話しています。息子は何を買ってきますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '母',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: '買い物に行ってくれる？牛乳と卵を買ってきて。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '息子',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'わかった。パンはまだあったっけ？',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '母',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: 'パンは今朝買ったのがあるから買わなくていいわ。あ、リンゴも2つお願い。',
        uzbek: '',
      },
      {
        id: 'line_5',
        speaker: '息子',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: '牛乳、卵、リンゴ2つだね。行ってきます。',
        uzbek: '',
      },
    ],
  },
  {
    id: 4,
    level: 'N4',
    type: 'point',
    titleUz: 'Dars qoldirish sababi',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_001.mp3',
    script:
      '女の学生と男の学生が話しています。男の学生はどうして昨日学校を休みましたか？\n女：山田くん、昨日はどうして休んだの？風邪？\n男：ううん、風邪じゃなくて。実は、自転車が途中で壊れちゃって、遅刻しそうだったから家に帰ったんだ。\n女：えー、それだけで休んだの？\n男：うん、テストもない日だったしね。',
    questionText: '男の学生はどうして昨日学校を休みましたか？',
    questionTextUz: 'Yigit nima sababdan kecha darsga kelmadi?',
    options: [
      '風邪をひいたからです',
      '自転車が壊れたからです',
      'テストがなかったからです',
      '寝坊したからです',
    ],
    optionsUz: [
      'Shamollagani uchun',
      'Velosipedi buzilib qolgani uchun',
      "Test bo'lmagani uchun",
      'Uxlab qolgani uchun',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Erkak talaba shamollagani yo'q, balki yo'lda velosipedi buzilib qolgani sababli darsga kelmay uyiga qaytib ketganligini aytadi.",
    tipUzbek:
      "'風邪じゃなくて' (shamollash emas) inkoridan keyingi '自転車が壊れちゃって' haqiqiy sababdir.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '女の学生と男の学生が話しています。男の学生はどうして昨日学校を休みましたか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: '山田くん、昨日はどうして休んだの？風邪？',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese:
          'ううん、風邪じゃなくて。実は、自転車が途中で壊れちゃって、遅刻しそうだったから家に帰ったんだ。',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: 'えー、それだけで休んだの？',
        uzbek: '',
      },
      {
        id: 'line_5',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'うん、テストもない日だったしね。',
        uzbek: '',
      },
    ],
  },
  {
    id: 5,
    level: 'N4',
    type: 'task',
    titleUz: 'Majlis hujjatlari nusxasi',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_002.mp3',
    script:
      '会社で女の人と男の人が話しています。男の人はまず何をコピーしますか？\n女：田中さん、会議の準備を手伝ってくれませんか？\n男：はい、何をしましょうか？\n女：まずこの企画書を10部コピーしてください。それからスケジュールの表もお願いします。\n男：わかりました。企画書ですね。',
    questionText: '男の人はまず何をコピーしますか？',
    questionTextUz: 'Erkak avval nimadan nusxa oladi?',
    options: ['スケジュールの表', '企画書', '参加者名簿', 'アンケート用紙'],
    optionsUz: [
      'Jadval varaqasi',
      'Loyiha rejasi (kikakusho)',
      "Qatnashuvchilar ro'yxati",
      "So'rovnoma varaqasi",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Ayol kishi 'まずこの企画書を10部コピーしてください' (avval loyiha rejasidan 10 nusxa oling) deydi. Demak, u birinchi navbatda 企画書 ni nusxa qiladi.",
    tipUzbek: "'まず' (avvalo / birinchi navbatda) so'ziga ergashgan buyruqqa diqqat qiling.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '会社で女の人と男の人が話しています。男の人はまず何をコピーしますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: '田中さん、会議の準備を手伝ってくれませんか？',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'はい、何をしましょうか？',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese:
          'まずこの企画書を10部コピーしてください。それからスケジュールの表もお願いします。',
        uzbek: '',
      },
      {
        id: 'line_5',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'わかりました。企画書ですね。',
        uzbek: '',
      },
    ],
  },
  {
    id: 14,
    level: 'N4',
    type: 'task',
    titleUz: 'Kasalxonada birinchi qadam',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_003.mp3',
    script:
      '病院の受付で女の人と係の人が話しています。女の人はまずどこへ行きますか？\n係員：初診ですね。まずあちらの窓口で問診票を記入して出してください。その後、2階の内科の前でお待ちください。\n女：わかりました。問診票ですね。',
    questionText: '女の人はまず何をしますか？',
    questionTextUz: 'Ayol dastlab nima qilishi kerak?',
    options: ['2階の内科に行く', '問診票を記入して出す', '薬局で薬をもらう', '会計を済ませる'],
    optionsUz: [
      '2-qavatdagi terapevt oldiga borish',
      "Savolnomani to'ldirib topshirish",
      'Dorixonadan dori olish',
      "Kassada to'lov qilish",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Xodim avval qabul oynasida savolnomani (問診票) to'ldirib berishni, keyin 2-qavatga chiqishni aytadi.",
    tipUzbek: "'まず' va 'その後' (undan keyin) orqali ketma-ketlikni belgilang.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '病院の受付で女の人と係の人が話しています。女の人はまずどこへ行きますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '係員',
        speakerRoleUz: 'Xodim / Sotuvchi',
        gender: 'neutral',
        japanese:
          '初診ですね。まずあちらの窓口で問診票を記入して出してください。その後、2階の内科の前でお待ちください。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: 'わかりました。問診票ですね。',
        uzbek: '',
      },
    ],
  },
  {
    id: 15,
    level: 'N4',
    type: 'quick',
    titleUz: "Boshliq topshirig'iga javob",
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_004.mp3',
    script:
      '会社で上司に書類の提出を頼まれました。何と答えますか？\n上司：佐藤さん、この報告書を今日中にまとめてもらえるかい？\nあなた：（　）',
    questionText: '質問を聞いて、何と答えますか？',
    questionTextUz: 'Topshiriqqa qanday muloyim javob beriladi?',
    options: [
      'かしこまりました。すぐに取りかかります',
      'どういたしまして',
      'お疲れ様でした',
      'ごめんなさい',
    ],
    optionsUz: [
      "Xo'p bo'ladi, darhol kirishaman",
      'Arzimaydi',
      'Charchamang / Rahmat',
      'Kechirasiz',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Boshliqning rasmiy topshirig'iga xodim xushmuomalalik bilan 'かしこまりました' (kashikomarimashita) deb javob beradi.",
    tipUzbek:
      "Yapon ishbilarmonlik madaniyatida 'かしこまりました' eng standart qabul qilish iborasidir.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '会社で上司に書類の提出を頼まれました。何と答えますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '上司',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '佐藤さん、この報告書を今日中にまとめてもらえるかい？',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: 'あなた',
        speakerRoleUz: 'Siz',
        gender: 'neutral',
        japanese: '（　）',
        uzbek: '',
      },
    ],
  },
  {
    id: 26,
    level: 'N4',
    type: 'point',
    titleUz: 'Dam olish kuni sayohati',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_005.mp3',
    script:
      '男の人と女の人が週末の予定について話しています。2人はどうして山に行くのをやめましたか？\n男：今週末、温泉に行こうか、山に登ろうか。\n女：山登りもいいけど、天気予報見たら土曜日も日曜日も雨が降るって言ってたよ。\n男：本当？雨の中の山道は滑って危ないから、今回は温泉旅館でのんびりしよう。\n女：そうだね、賛成！',
    questionText: '2人はどうして山に行くのをやめましたか？',
    questionTextUz: 'Ular nima sababdan toqqa chiqish fikridan qaytdilar?',
    options: [
      '雨の予報で危険だから',
      '温泉のほうが安かったから',
      '男の人の体調が悪いから',
      '旅館の予約が取れなかったから',
    ],
    optionsUz: [
      "Yomg'ir kutilayotgani va xavfli bo'lgani uchun",
      "Issiq buloq ancha arzon bo'lgani uchun",
      'Erkakning tobi qochgani uchun',
      'Mehmonxonada joy qolmagani uchun',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Ob-havo ma'lumotida yomg'ir yog'ishi aytilgani va yomg'irli kunda tog' yo'llari sirpanchiq bo'lib xavfli bo'lgani uchun toqqa borish bekor qilinadi.",
    tipUzbek: "'雨が降る' va '滑って危ない' sabab-oqibat zanjiriga e'tibor qarating.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '男の人と女の人が週末の予定について話しています。2人はどうして山に行くのをやめましたか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: '今週末、温泉に行こうか、山に登ろうか。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: '山登りもいいけど、天気予報見たら土曜日も日曜日も雨が降るって言ってたよ。',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: '本当？雨の中の山道は滑って危ないから、今回は温泉旅館でのんびりしよう。',
        uzbek: '',
      },
      {
        id: 'line_5',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: 'そうだね、賛成！',
        uzbek: '',
      },
    ],
  },
  {
    id: 27,
    level: 'N4',
    type: 'task',
    titleUz: "Mehmonxona xonasidagi ko'rsatma",
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_006.mp3',
    script:
      'ホテルの部屋でフロントからの電話を聞いています。客はチェックアウトのとき鍵をどこに置きますか？\nフロント：お客様、明朝のチェックアウトについてご案内いたします。朝7時前はフロントが無人となりますので、ルームキーはお部屋のテーブルの上に置いたまま、ドアを閉めてご出発ください。\n客：わかりました。テーブルの上ですね。',
    questionText: '客は鍵をどこに置きますか？',
    questionTextUz: 'Mijoz xona kalitini qayerga qoldirishi kerak?',
    options: ['部屋のテーブルの上', 'フロントのカウンター', '玄関のポストの中', 'エレベーターの前'],
    optionsUz: [
      'Xonadagi stol ustiga',
      'Qabulxona (front) ustiga',
      'Eshik oldidagi pochta qutisiga',
      'Lift oldiga',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Tongda qabulxona bo'sh bo'lgani uchun kalitni xonaning stoli ustida qoldirib (お部屋のテーブルの上に置いたまま) chiqib ketish aytildi.",
    tipUzbek: "'〜に置いたまま' grammatikasi (qoldirgan holatda) joyni aniqlab beradi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          'ホテルの部屋でフロントからの電話を聞いています。客はチェックアウトのとき鍵をどこに置きますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: 'フロント',
        speakerRoleUz: 'Xodim / Sotuvchi',
        gender: 'neutral',
        japanese:
          'お客様、明朝のチェックアウトについてご案内いたします。朝7時前はフロントが無人となりますので、ルームキーはお部屋のテーブルの上に置いたまま、ドアを閉めてご出発ください。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '客',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: 'わかりました。テーブルの上ですね。',
        uzbek: '',
      },
    ],
  },
  {
    id: 28,
    level: 'N4',
    type: 'quick',
    titleUz: "Uzr so'rash va kechirim",
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_007.mp3',
    script: '駅で人とぶつかってしまいました。何と言いますか？\nあなた：（　）',
    questionText: 'こんなとき、何と言いますか？',
    questionTextUz: 'Birov bilan turtilishib ketganda nima deyiladi?',
    options: [
      'すみません、大丈夫ですか？',
      'おめでとうございます',
      '失礼いたしました、さようなら',
      'ごちそうさまでした',
    ],
    optionsUz: ['Kechirasiz, tuzukmisiz?', 'Tabriklayman', 'Uzr, xayr', "Rahmat, to'ydim"],
    correctAnswer: 0,
    explanationUzbek:
      "Birovga tegib ketganda 'すみません、大丈夫ですか？' (Kechirasiz, hammasi yaxshimi / og'rimadingizmi?) deyish odobdandir.",
    tipUzbek: "Kundalik favqulodda vaziyatlarda kechirim so'rash iboralari.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '駅で人とぶつかってしまいました。何と言いますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: 'あなた',
        speakerRoleUz: 'Siz',
        gender: 'neutral',
        japanese: '（　）',
        uzbek: '',
      },
    ],
  },
  {
    id: 29,
    level: 'N4',
    type: 'summary',
    titleUz: 'Yangi taom xulosasi',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_008.mp3',
    script:
      'レストランで2人が新メニューについて話しています。2人はこの料理をどう思っていますか？\n男：この季節限定のスープ、すごく野菜の甘みが出ているね。\n女：本当！少し辛いけど、体の芯から温まる感じがして、冬にぴったりだわ。\n男：うん、また来週も食べに来たいね。',
    questionText: '2人はこの料理をどう評価していますか？',
    questionTextUz: 'Ikkala suhbatdosh taomga qanday umumiy baho bermoqda?',
    options: [
      'とても美味しくて気に入っている',
      '辛すぎて食べられない',
      '野菜が少なくて物足りない',
      '値段が高すぎると感じている',
    ],
    optionsUz: [
      'Juda mazali va ularga yoqdi',
      "Haddan tashqari achchiq, yeb bo'lmaydi",
      'Sabzavoti kam, qoniqarsiz',
      'Narxi juda qimmat deb hisoblashmoqda',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Ikkala suhbatdosh ham sho'rvaning shirinligi, isitishi va qishga mosligini olqishlab, keyingi hafta ham kelishni niyat qilishadi. Demak, taom ularga juda yoqqan.",
    tipUzbek:
      "'冬にぴったり' (qishga ayni muddao) va 'また食べに来たい' (yana kelib yegim bor) ijobiy xulosani bildiradi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          'レストランで2人が新メニューについて話しています。2人はこの料理をどう思っていますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'この季節限定のスープ、すごく野菜の甘みが出ているね。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: '本当！少し辛いけど、体の芯から温まる感じがして、冬にぴったりだわ。',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'うん、また来週も食べに来たいね。',
        uzbek: '',
      },
    ],
  },
  {
    id: 30,
    level: 'N4',
    type: 'task',
    titleUz: 'Chiqindilarni saralash',
    audioUrl: '/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_009.mp3',
    script:
      'アパートのゴミ捨て場で管理人と住人が話しています。ペットボトルはいつ出しますか？\n住人：すみません、このペットボトルの回収日は何曜日ですか？\n管理人：ペットボトルと缶は水曜日の朝8時までに出してください。月曜と木曜は燃えるゴミです。\n住人：わかりました。水曜日ですね。',
    questionText: 'ペットボトルは何曜日に出しますか？',
    questionTextUz: 'Yelim idishlar (pet-butulka) haftaning qaysi kuni chiqariladi?',
    options: ['月曜日', '火曜日', '水曜日', '木曜日'],
    optionsUz: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba'],
    correctAnswer: 2,
    explanationUzbek:
      'Uy boshqaruvchisi pet-butulka va tunuka bankalar chorshanba kuni ertalab 8 gacha chiqarilishi kerakligini aytadi.',
    tipUzbek: "'燃えるゴミ' (yonuvchi chiqindi) bilan 'ペットボトル' kunini farqlang.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          'アパートのゴミ捨て場で管理人と住人が話しています。ペットボトルはいつ出しますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '住人',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: 'すみません、このペットボトルの回収日は何曜日ですか？',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '管理人',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          'ペットボトルと缶は水曜日の朝8時までに出してください。月曜と木曜は燃えるゴミです。',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '住人',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: 'わかりました。水曜日ですね。',
        uzbek: '',
      },
    ],
  },
  {
    id: 6,
    level: 'N3',
    type: 'quick',
    titleUz: 'Pochta qayerda?',
    audioUrl: '/audio/choukai/n3/01 Track 1.mp3',
    script:
      '男の人が女の人に話しかけています。\n男：すみません、この近くに郵便局はありますか？\n女：あ、それなら、この道をまっすぐ行って、最初の角を右に曲がると左側にありますよ。',
    questionText: '郵便局はどこにありますか？',
    questionTextUz: 'Pochta qayerda joylashgan?',
    options: [
      '最初の角を左に曲がったところ',
      'この道をまっすぐ行って、最初の角を右に曲がった左側',
      'この道の右側',
      'コンビニの隣',
    ],
    optionsUz: [
      'Birinchi chorrahadan chapga burilganda',
      "To'g'ri borib, birinchi chorrahadan o'ngga burilgandagi chap tomon",
      "Ushbu ko'chaning o'ng tomonida",
      "Do'konning yonida",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Ayol kishi pochta manzilini: ko'chadan to'g'ri borib, birinchi chorrahadan o'ngga burilganda chap tomonda joylashganligini tushuntirdi.",
    tipUzbek: "'まっすぐ' (to'g'ri), '右に曲がる' (o'ngga burilish), '左側' (chap tomon).",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '男の人が女の人に話しかけています。',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'すみません、この近くに郵便局はありますか？',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: 'あ、それなら、この道をまっすぐ行って、最初の角を右に曲がると左側にありますよ。',
        uzbek: '',
      },
    ],
  },
  {
    id: 7,
    level: 'N3',
    type: 'task',
    titleUz: 'Restoranda vazifa tartibi',
    audioUrl: '/audio/choukai/n3/02 Track 2.mp3',
    script:
      'レストランで店長とアルバイトの人が話しています。アルバイトの人はこれから何をしますか？\n店長：鈴木さん、テーブルの片付け終わった？\n鈴木：はい、終わりました。次はお皿を洗いましょうか？\n店長：お皿は後でいいから、先に予約のお客様の席を奥の個室に準備しておいてくれる？もうすぐいらっしゃる時間だから。\n鈴木：かしこまりました。すぐ準備します。',
    questionText: '鈴木さんはこれから何をしますか？',
    questionTextUz: 'Suzuki-san darhol nima ish qilishi kerak?',
    options: ['お皿を洗う', '予約の席を準備する', '新しい料理を作る', '店の看板を出す'],
    optionsUz: [
      'Idishlarni yuvish',
      'Bron qilingan joyni tayyorlash',
      'Yangi taom pishirish',
      "Do'kon peshlavhasini ilish",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Boshliq idishlarni yuvishni keyinga qoldirib, eng avvalo bron qilib qo'yilgan mijozlarning xonasidagi joyni tayyorlashni buyuradi.",
    tipUzbek: "'お皿は後でいい' (idishlar keyinroq bo'laveradi), '先に...' (avval...).",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          'レストランで店長とアルバイトの人が話しています。アルバイトの人はこれから何をしますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '店長',
        speakerRoleUz: 'Xodim / Sotuvchi',
        gender: 'neutral',
        japanese: '鈴木さん、テーブルの片付け終わった？',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '鈴木',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'はい、終わりました。次はお皿を洗いましょうか？',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '店長',
        speakerRoleUz: 'Xodim / Sotuvchi',
        gender: 'neutral',
        japanese:
          'お皿は後でいいから、先に予約のお客様の席を奥の個室に準備しておいてくれる？もうすぐいらっしゃる時間だから。',
        uzbek: '',
      },
      {
        id: 'line_5',
        speaker: '鈴木',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'かしこまりました。すぐ準備します。',
        uzbek: '',
      },
    ],
  },
  {
    id: 16,
    level: 'N3',
    type: 'point',
    titleUz: "Grant talablari o'zgarishi",
    audioUrl: '/audio/choukai/n3/03 Track 3.mp3',
    script:
      '留学生センターで職員が説明しています。奨学金の申請条件で変更されたのは何ですか？\n職員：今年度から申請条件が一部変更されました。成績基準のGPA3.0以上という点は去年と同じですが、アルバイトの週当たり就業時間の上限が、これまでの28時間から20時間以内に制限されることになりました。',
    questionText: '奨学金の申請条件で新しく変更された点は何ですか？',
    questionTextUz: "Grant talabida yangi o'zgargan band qaysi?",
    options: [
      '成績基準がGPA3.5に上がったこと',
      'アルバイトの週就業時間の上限が20時間以内になったこと',
      '申請の締切日が1ヶ月早まったこと',
      '面接試験が廃止されたこと',
    ],
    optionsUz: [
      "Baholar talabi GPA 3.5 ga ko'tarilgani",
      'Haftalik ish vaqti 20 soatgacha cheklangani',
      'Hujjat topshirish muddati 1 oy oldinga surilgani',
      'Suhbat imtihoni bekor qilingani',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Xodim baholar o'zgarmagani, ammo yarim kunlik ish vaqti cheklovi haftasiga 28 soatdan 20 soatga tushirilganini ta'kidlaydi.",
    tipUzbek: "'去年と同じですが' (o'tgan yilgidek, ammo...) burilish nuqtasiga e'tibor bering.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '留学生センターで職員が説明しています。奨学金の申請条件で変更されたのは何ですか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '職員',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '今年度から申請条件が一部変更されました。成績基準のGPA3.0以上という点は去年と同じですが、アルバイトの週当たり就業時間の上限が、これまでの28時間から20時間以内に制限されることになりました。',
        uzbek: '',
      },
    ],
  },
  {
    id: 17,
    level: 'N3',
    type: 'task',
    titleUz: 'Bazm menyusi tanlovi',
    audioUrl: '/audio/choukai/n3/04 Track 4.mp3',
    script:
      'オフィスで同僚2人が話しています。男性はこれから何を注文しますか？\n女：来週の歓迎会、お店の予約は済んだ？\n男：席は確保したんだけど、飲み放題のコースにするか料理だけのコースにするか迷っていて。\n女：みんなお酒好きだから、飲み放題付きのコースのほうが安心だよ。\n男：そうだね、じゃあそっちに変更しておくよ。',
    questionText: '男性はどのコースに変更して注文しますか？',
    questionTextUz: "Yigit qaysi to'plamga o'zgartirib buyurtma beradi?",
    options: [
      '料理のみのコース',
      '飲み放題付きのコース',
      'ランチタイムの軽食コース',
      'テイクアウトのオードブル',
    ],
    optionsUz: [
      'Faqat taomlardan iborat kurs',
      'Cheksiz ichimlikli kurs (nomihoudai)',
      'Tushlik yengil tamaddi kursi',
      "Olib ketiladigan gazaklar to'plami",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Hamkasb qiz barchaga cheksiz ichimlikli (飲み放題付き) to'plam ma'qul ekanini aytadi va erkak unga o'zgartirishini tasdiqlaydi.",
    tipUzbek: "'じゃあそっちに変更しておくよ' iborasi oxirgi tanlangan variantni bildiradi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: 'オフィスで同僚2人が話しています。男性はこれから何を注文しますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: '来週の歓迎会、お店の予約は済んだ？',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese:
          '席は確保したんだけど、飲み放題のコースにするか料理だけのコースにするか迷っていて。',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '女',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: 'みんなお酒好きだから、飲み放題付きのコースのほうが安心だよ。',
        uzbek: '',
      },
      {
        id: 'line_5',
        speaker: '男',
        speakerRoleUz: 'Erkak',
        gender: 'male',
        japanese: 'そうだね、じゃあそっちに変更しておくよ。',
        uzbek: '',
      },
    ],
  },
  {
    id: 31,
    level: 'N3',
    type: 'summary',
    titleUz: "Masofaviy ishning ta'siri",
    audioUrl: '/audio/choukai/n3/05 Track 5.mp3',
    script:
      'テレビでアナウンサーが在宅勤務の調査結果について話しています。調査で明らかになった最も大きなメリットは何ですか？\nアナウンサー：全国の社会人3000人を対象にした意識調査によりますと、テレワークの導入により、通勤による身体的・精神的ストレスが激減したと答えた人が全体の約7割に達し、業務効率化や家族との時間の増加を抑えて最大の利点として挙げられました。',
    questionText: '調査で明らかになった最大のメリットは何ですか？',
    questionTextUz: "So'rovnomada qayd etilgan eng katta ijobiy jihat nima?",
    options: [
      '通勤ストレスが大幅に減ったこと',
      '残業代が増加したこと',
      '光熱費の負担が軽くなったこと',
      '会社のオフィス面積が半減したこと',
    ],
    optionsUz: [
      "Yo'l yurishdagi stressning keskin kamaygani",
      "Qo'shimcha ish haqi oshgani",
      "Kommunal to'lovlar yengillashgani",
      'Ofis maydoni qisqargani',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "So'rovnoma qatnashchilarining 70 foizi通勤ストレス (qatnovdagi jismoniy va ruhiy stress) keskin kamayganini eng katta ijobiy omil deb e'tirof etgan.",
    tipUzbek:
      "'最大の利点として挙げられました' (eng katta afzallik sifatida keltirildi) jumlasiga diqqat qiling.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          'テレビでアナウンサーが在宅勤務の調査結果について話しています。調査で明らかになった最も大きなメリットは何ですか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: 'アナウンサー',
        speakerRoleUz: "E'lon / Diktor",
        gender: 'neutral',
        japanese:
          '全国の社会人3000人を対象にした意識調査によりますと、テレワークの導入により、通勤による身体的・精神的ストレスが激減したと答えた人が全体の約7割に達し、業務効率化や家族との時間の増加を抑えて最大の利点として挙げられました。',
        uzbek: '',
      },
    ],
  },
  {
    id: 32,
    level: 'N3',
    type: 'point',
    titleUz: "Ko'chmas mulk ijarasi",
    audioUrl: '/audio/choukai/n3/06 Track 6.mp3',
    script:
      '不動産屋で女性客と店員が話しています。女性がこの部屋を気に入った一番の理由は何ですか？\n店員：こちらのお部屋は、駅からは徒歩15分と少し離れていますが、南向きで日当たりが良く、何より周囲が閑静な住宅街で夜も大変静かです。\n客：駅近の物件も見ましたが、夜勤もあって昼間にぐっすり眠りたいので、この静かさが何より決め手になりますね。ここにします。',
    questionText: '女性がこの部屋に決めた一番の理由は何ですか？',
    questionTextUz: "Ayol bu uyni tanlashiga asosiy sabab nima bo'ldi?",
    options: [
      '駅から近くて便利なこと',
      '周囲が静かで昼間もぐっすり眠れること',
      '家賃が相場より大幅に安いこと',
      '最新の家電製品が備え付けられていること',
    ],
    optionsUz: [
      'Vokzalga yaqin va qulayligi',
      'Atrof tinchligi va kunduzi yaxshi uxlash mumkinligi',
      'Ijara narxi bozordan arzonligi',
      "Yangi maishiy texnikalar o'rnatilgani",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Ayol tunda ishlagani sababli kunduz kuni tinch uxlash unga muhim bo'lgan va atrofning tinchligi (静かさ) asosiy hal qiluvchi omil (決め手) bo'lgan.",
    tipUzbek: "'決め手になります' (hal qiluvchi omil bo'ladi) so'zi to'g'ri javobni ko'rsatadi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '不動産屋で女性客と店員が話しています。女性がこの部屋を気に入った一番の理由は何ですか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '店員',
        speakerRoleUz: 'Xodim / Sotuvchi',
        gender: 'neutral',
        japanese:
          'こちらのお部屋は、駅からは徒歩15分と少し離れていますが、南向きで日当たりが良く、何より周囲が閑静な住宅街で夜も大変静かです。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '客',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '駅近の物件も見ましたが、夜勤もあって昼間にぐっすり眠りたいので、この静かさが何より決め手になりますね。ここにします。',
        uzbek: '',
      },
    ],
  },
  {
    id: 33,
    level: 'N3',
    type: 'quick',
    titleUz: 'Maslahatga minnatdorchilik',
    audioUrl: '/audio/choukai/n3/07 Track 7.mp3',
    script: '先輩に仕事の相談に乗ってもらいました。別れ際に何と言いますか？\nあなた：（　）',
    questionText: 'こんなとき、何と言いますか？',
    questionTextUz:
      'Kattaroq hamkasb (senpai) maslahat berib yordam qilganda xayrlashuvda nima deyiladi?',
    options: [
      'お忙しいところ、お時間をいただきありがとうございました',
      'どういたしまして、またいつでもどうぞ',
      '失礼ですが、お名前を教えてください',
      'お邪魔しました、ごちそうさまでした',
    ],
    optionsUz: [
      'Band vaqtingizda menga vaqt ajratganingiz uchun katta rahmat',
      "Arzimaydi, yana bemalol so'rang",
      'Uzr, ismingizni aytib yuboring',
      'Bezovta qildim, mehmondorchilik uchun rahmat',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Kattaroq inson sizga vaqt ajratib maslahat berganda 'お忙しいところ、お時間をいただきありがとうございました' minnatdorchiligi bildiriladi.",
    tipUzbek: 'Senpai va Kouhai orasidagi hurmat shakllari (teinei/keigo).',
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '先輩に仕事の相談に乗ってもらいました。別れ際に何と言いますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: 'あなた',
        speakerRoleUz: 'Siz',
        gender: 'neutral',
        japanese: '（　）',
        uzbek: '',
      },
    ],
  },
  {
    id: 34,
    level: 'N3',
    type: 'task',
    titleUz: "Ekskursiya yig'ilishi",
    audioUrl: '/audio/choukai/n3/08 Track 8.mp3',
    script:
      'ツアーガイドが観光バスの中で案内しています。乗客はバスを降りた後、まず何をしますか？\nガイド：皆様、まもなく目的地の美術館に到着します。到着しましたら、まず入口前の広場で記念撮影を行います。その後、入場チケットをお配りして館内自由見学となります。集合時間は15時です。\n乗客：写真撮影が先なんだね。',
    questionText: '乗客はバスを降りた後、まず何をしますか？',
    questionTextUz: 'Sayyohlar avtobusdan tushgach, birinchi navbatda nima qilishadi?',
    options: [
      '広場で記念撮影をする',
      'チケットを受け取って入場する',
      'お土産店で買い物をする',
      '15時まで自由に食事をする',
    ],
    optionsUz: [
      'Maydonda esdalik suratga tushish',
      'Chipta olib ichkariga kirish',
      "Sovg'alar do'konida xarid qilish",
      'Soat 15 gacha erkin ovqatlanish',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Gid avval maydonda esdalik uchun rasmga tushilishini, shundan so'ng chiptalar tarqatilishini uqtirdi.",
    tipUzbek: "'まず記念撮影を行います' jumlasi ketma-ketlikning boshini belgilaydi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          'ツアーガイドが観光バスの中で案内しています。乗客はバスを降りた後、まず何をしますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: 'ガイド',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '皆様、まもなく目的地の美術館に到着します。到着しましたら、まず入口前の広場で記念撮影を行います。その後、入場チケットをお配りして館内自由見学となります。集合時間は15時です。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '乗客',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '写真撮影が先なんだね。',
        uzbek: '',
      },
    ],
  },
  {
    id: 35,
    level: 'N3',
    type: 'summary',
    titleUz: 'Muzey qoidalari',
    audioUrl: '/audio/choukai/n3/09 Track 9.mp3',
    script:
      '美術館の館内放送を聞いています。来館者に呼びかけている主な注意事項は何ですか？\nアナウンス：本日は特別展にご来館いただきありがとうございます。特別展示室内の作品はフラッシュ撮影および動画の撮影が固く禁じられております。また、他のお客様のご迷惑となりますので、携帯電話での通話はお控えください。',
    questionText: '館内放送の主な注意事項は何ですか？',
    questionTextUz: "Muzey e'lonida ziyoratchilarga qaratilgan asosiy ogohlantirish nima?",
    options: [
      '撮影制限と携帯通話の禁止',
      '入場料の追加徴収について',
      '閉館時間が早まったこと',
      '雨傘の持ち込み禁止',
    ],
    optionsUz: [
      "Suratga tushirish taqiqlari va telefon so'zlashuvi cheklovi",
      "Qo'shimcha kirish to'lovi haqida",
      "Yopilish vaqti erta bo'lishi haqida",
      'Soyabon olib kirish taqiqlangani',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "E'londa fleshka orqali surat/video olish qat'iyan man etilgani va telefon orqali gaplashmaslik so'ralgan.",
    tipUzbek: "'固く禁じられております' (qat'iyan man etiladi) e'londagi asosiy taqiq.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '美術館の館内放送を聞いています。来館者に呼びかけている主な注意事項は何ですか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: 'アナウンス',
        speakerRoleUz: "E'lon / Diktor",
        gender: 'neutral',
        japanese:
          '本日は特別展にご来館いただきありがとうございます。特別展示室内の作品はフラッシュ撮影および動画の撮影が固く禁じられております。また、他のお客様のご迷惑となりますので、携帯電話での通話はお控えください。',
        uzbek: '',
      },
    ],
  },
  {
    id: 36,
    level: 'N3',
    type: 'task',
    titleUz: "Dori ichish yo'riqnomasi",
    audioUrl: '/audio/choukai/n3/10 Track 10.mp3',
    script:
      '薬局で薬剤師と患者が話しています。患者は食後すぐにどの薬を飲みますか？\n薬剤師：こちらの白い錠剤は毎食後30分以内に1錠お飲みください。そして、こちらの粉薬は胃を保護するものですので、食事の直後すぐにお飲みください。\n患者：食後すぐは粉薬ですね。わかりました。',
    questionText: '患者は食後すぐにどの薬を飲みますか？',
    questionTextUz: "Bemor ovqatdan darhol so'ng qaysi dorini ichadi?",
    options: ['胃を保護する粉薬', '白い錠剤', '両方の薬を同時に', '水で薄めたシロップ'],
    optionsUz: [
      'Oshqozonni himoyalovchi kukun dori',
      'Oq tabletka',
      'Ikkala dorini bir vaqtda',
      'Suv bilan aralashtirilgan sirop',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Farmatsevt kukun dori oshqozonni himoyalashi uchun '食事の直後すぐ' (ovqatdan darhol keyin) ichilishini, oq tabletka esa 30 daqiqa ichida ichilishini tushuntirdi.",
    tipUzbek: "'食後すぐ' (darhol keyin) vs '食後30分以内' (30 daqiqa ichida).",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '薬局で薬剤師と患者が話しています。患者は食後すぐにどの薬を飲みますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '薬剤師',
        speakerRoleUz: 'Xodim / Sotuvchi',
        gender: 'neutral',
        japanese:
          'こちらの白い錠剤は毎食後30分以内に1錠お飲みください。そして、こちらの粉薬は胃を保護するものですので、食事の直後すぐにお飲みください。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '患者',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '食後すぐは粉薬ですね。わかりました。',
        uzbek: '',
      },
    ],
  },
  {
    id: 8,
    level: 'N2',
    type: 'task',
    titleUz: 'Taqdimot tayyorgarligi',
    audioUrl: '/audio/choukai/n2/Track01.mp3',
    script:
      '会社で課長と女性社員が話しています。女性社員はこれからまず何をしますか？\n課長：佐藤さん、明日の新商品発表会の資料の準備はどうなっていますか？\n佐藤：はい、スライドの印刷はすべて完了しました。会場のプロジェクターの確認も済んでいます。\n課長：そうか。じゃあ、参加者の名簿の最新版を印刷して、受付に届けておいてくれるかい？\n佐藤：承知いたしました。すぐに名簿を確認して印刷します。',
    questionText: '女性社員はこれからまず何をしますか？',
    questionTextUz: 'Xodim ayol bundan keyin dastlab nimani bajaradi?',
    options: [
      'スライドを印刷する',
      'プロジェクターを確認する',
      '参加者名簿の最新版を印刷して届ける',
      '新商品のサンプルを用意する',
    ],
    optionsUz: [
      'Slaydlarni chop etish',
      'Proyektorni tekshirish',
      "Qatnashuvchilar yangi ro'yxatini chop etib topshirish",
      'Yangi mahsulot namunalarini tayyorlash',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Slaydlar va proyektor tayyor bo'lgani sababli, bo'lim boshlig'i qatnashuvchilar ro'yxatining so'nggi nusxasini chop etib qabulxonaga olib borishni so'radi va ayol buni darhol bajarishini bildirdi.",
    tipUzbek: "'最新版を印刷して、受付に届けて' buyrug'i birinchi bajariladi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '会社で課長と女性社員が話しています。女性社員はこれからまず何をしますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '課長',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '佐藤さん、明日の新商品発表会の資料の準備はどうなっていますか？',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '佐藤',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese:
          'はい、スライドの印刷はすべて完了しました。会場のプロジェクターの確認も済んでいます。',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '課長',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: 'そうか。じゃあ、参加者の名簿の最新版を印刷して、受付に届けておいてくれるかい？',
        uzbek: '',
      },
      {
        id: 'line_5',
        speaker: '佐藤',
        speakerRoleUz: 'Ayol',
        gender: 'female',
        japanese: '承知いたしました。すぐに名簿を確認して印刷します。',
        uzbek: '',
      },
    ],
  },
  {
    id: 9,
    level: 'N2',
    type: 'point',
    titleUz: 'Suhbatda eng muhim qobiliyat',
    audioUrl: '/audio/choukai/n2/Track02.mp3',
    script:
      '大学の就職支援セミナーで講師が話しています。講師は面接で最も重視されるのは何だと言っていますか？\n講師：面接では、資格の多さや話の流暢さももちろんプラスになりますが、それ以上に採用担当者が注目しているのは「相手の質問の意図を正確に捉えて端的に答える力」です。どんなに素晴らしい経歴があっても、質問とずれた回答をしていては信頼を得られません。',
    questionText: '講師は面接で最も重視されるのは何だと言っていますか？',
    questionTextUz: "Ma'ruzachining fikricha ishga kirish suhbatida eng muhim ko'nikma nima?",
    options: [
      '取得している資格の数',
      '途切れずに長く話す流暢さ',
      '質問の意図を理解して的確に答える力',
      '有名大学での成績',
    ],
    optionsUz: [
      'Egalik qilayotgan sertifikatlar soni',
      "To'xtovsiz uzoq gapirish qobiliyati",
      'Savolning tub mohiyatini tushunib, ixcham va aniq javob berish',
      "Nufuzli universitetdagi a'lo baholar",
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Ma'ruzachi suhbatda eng ko'p e'tibor qaratiladigan jihat suhbatdoshning savol niyatini to'g'ri tushunib, ixcham va aniq javob berish qobiliyati ekanini aytadi.",
    tipUzbek: "'それ以上に...注目しているのは' iborasidan keyingi jumlaga e'tibor qaratiladi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '大学の就職支援セミナーで講師が話しています。講師は面接で最も重視されるのは何だと言っていますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '講師',
        speakerRoleUz: "O'qituvchi",
        gender: 'male',
        japanese:
          '面接では、資格の多さや話の流暢さももちろんプラスになりますが、それ以上に採用担当者が注目しているのは「相手の質問の意図を正確に捉えて端的に答える力」です。どんなに素晴らしい経歴があっても、質問とずれた回答をしていては信頼を得られません。',
        uzbek: '',
      },
    ],
  },
  {
    id: 18,
    level: 'N2',
    type: 'point',
    titleUz: "Mijozlarga tezkor e'tibor",
    audioUrl: '/audio/choukai/n2/Track03.mp3',
    script:
      'ビジネスセミナーで経営者が話しています。新規事業を成功させる上で最も重視した要素は何ですか？\n経営者：資金力や最新のITシステムも有用ですが、当社が急成長できた決定的な要因は「顧客からの不満やクレームに24時間以内に直接電話で対応する徹底したアフターフォロー」でした。顧客の信頼が最大の差別化になります。',
    questionText: '経営者が成功の決定的要因として挙げているのは何ですか？',
    questionTextUz:
      "Tadbirkor o'z biznesi muvaffaqiyatining asosiy omili sifatida nimani ta'kidlamoqda?",
    options: [
      '莫大な広告宣伝費の投入',
      '競合他社より圧倒的に安い価格設定',
      '顧客の不満に即座に対応する徹底したアフターフォロー',
      'AIによる完全無人のカスタマー対応',
    ],
    optionsUz: [
      'Milliardlab reklama sarflash',
      "Raqobatchilardan ancha arzon narx qo'yish",
      "Mijoz e'tiroziga 24 soat ichida darhol javob berish",
      "AI orqali insonlarsiz xizmat ko'rsatish",
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Tadbirkor eng asosiy muvaffaqiyat omili mijozlarning e'tirozlariga 24 soat ichida darhol bevosita javob berish (徹底したアフターフォロー) bo'lganini aytadi.",
    tipUzbek: "'決定的な要因は' (hal qiluvchi omil esa) kalit ifodadir.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          'ビジネスセミナーで経営者が話しています。新規事業を成功させる上で最も重視した要素は何ですか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '経営者',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '資金力や最新のITシステムも有用ですが、当社が急成長できた決定的な要因は「顧客からの不満やクレームに24時間以内に直接電話で対応する徹底したアフターフォロー」でした。顧客の信頼が最大の差別化になります。',
        uzbek: '',
      },
    ],
  },
  {
    id: 19,
    level: 'N2',
    type: 'quick',
    titleUz: "Biznes qo'ng'iroq odobi",
    audioUrl: '/audio/choukai/n2/Track04.mp3',
    script:
      '取引先の担当者と電話で話しています。相手が「あいにく部長の田中は席を外しております」と言いました。あなたは何と言いますか？\n相手：あいにく部長の田中は席を外しております。\nあなた：（　）',
    questionText: '適切な返答はどれですか？',
    questionTextUz: "Hamkor kompaniyaga qo'ng'iroq qilganda qanday javob qaytariladi?",
    options: [
      'では、後ほど改めてお電話差し上げます',
      'いえ、とんでもございません',
      'どうもごちそうさまでした',
      'お邪魔いたします',
    ],
    optionsUz: [
      "Unday bo'lsa birozdan so'ng yana qayta qo'ng'iroq qilaman",
      "Yo'g'e, arzimaydi",
      'Ziyofat uchun rahmat',
      'Kechirasiz, kirishga ruxsat bering',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Boshliq joyida yo'qligi aytilganda rasmiy biznes yapon tilida '後ほど改めてお電話差し上げます' (birozdan so'ng qayta aloqaga chiqaman) deb javob beriladi.",
    tipUzbek:
      "Biznes yapon tilida '席を外しております'ga standart javob '後ほど改めてお電話差し上げます'.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '取引先の担当者と電話で話しています。相手が「あいにく部長の田中は席を外しております」と言いました。あなたは何と言いますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '相手',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: 'あいにく部長の田中は席を外しております。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: 'あなた',
        speakerRoleUz: 'Siz',
        gender: 'neutral',
        japanese: '（　）',
        uzbek: '',
      },
    ],
  },
  {
    id: 37,
    level: 'N2',
    type: 'summary',
    titleUz: 'Mahalliy iqtisodiyotni jonlantirish',
    audioUrl: '/audio/choukai/n2/Track05.mp3',
    script:
      '市役所の地域創生課で職員が報告しています。地方活性化プロジェクトで最も高い成果を上げた施策は何ですか？\n職員：過去3年間の施策を検証した結果、大型商業施設の誘致よりも、地元の伝統工芸品や農産物を首都圏のレストランと直接提携してブランディング化した取り組みが、安定した雇用創出と地域所得の向上に最も貢献したことが判明しました。',
    questionText: '最も成果を上げた施策は何ですか？',
    questionTextUz: "Eng yuqori natija bergan chora qaysi bo'ldi?",
    options: [
      '地場産品と大都市レストランとの直接提携によるブランド化',
      '郊外への大型ショッピングモールの誘致',
      '若年層への一律現金給付金支給',
      '外国人観光客向けの免税店設置',
    ],
    optionsUz: [
      "Mahalliy mahsulotlarni poytaxt restoranlari bilan to'g'ridan-to'g'ri bog'lash",
      'Shahar chetiga yirik savdo majmualarini qurish',
      'Yoshlarga naqd pul tarqatish',
      "Chet ellik sayyohlar uchun bojxonasiz do'konlar ochish",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Tekshiruv xulosasiga ko'ra, yirik savdo markazlari qurishdan ko'ra mahalliy hunarmandchilik va qishloq xo'jaligi mahsulotlarini poytaxt restoranlari bilan bog'lab brend qilish eng katta daromad keltirgan.",
    tipUzbek: "'最も貢献したことが判明しました' jumlasi xulosani ko'rsatadi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '市役所の地域創生課で職員が報告しています。地方活性化プロジェクトで最も高い成果を上げた施策は何ですか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '職員',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '過去3年間の施策を検証した結果、大型商業施設の誘致よりも、地元の伝統工芸品や農産物を首都圏のレストランと直接提携してブランディング化した取り組みが、安定した雇用創出と地域所得の向上に最も貢献したことが判明しました。',
        uzbek: '',
      },
    ],
  },
  {
    id: 38,
    level: 'N2',
    type: 'task',
    titleUz: 'Shartnoma tuzatishi',
    audioUrl: '/audio/choukai/n2/Track06.mp3',
    script:
      '法務部の担当者と営業担当者が話しています。営業担当者はこれから契約書のどこを修正しますか？\n法務：この業務委託契約書ですが、第5条の損害賠償の上限額の記述が曖昧です。受託側の一方的な過失による場合でも発注額全額とするのはリスクが高すぎます。\n営業：では、月額報酬の3ヶ月分を限度額とする文言に修正すればよろしいでしょうか？\n法務：ええ、その条件なら問題ありません。直ちに修正して先方に送付してください。',
    questionText: '営業担当者は契約書のどこをどのように修正しますか？',
    questionTextUz: 'Savdo xodimi shartnomaning qayeriga tuzatish kiritadi?',
    options: [
      '第5条の損害賠償額の上限を月額報酬3ヶ月分に限定する',
      '契約期間を3ヶ月短縮する',
      '第1条の業務内容を全て削除する',
      '支払い期日を月末から翌月10日に変更する',
    ],
    optionsUz: [
      '5-moddadagi zararni qoplash chegarasini 3 oylik maosh miqdoriga cheklash',
      'Shartnoma muddatini 3 oyga qisqartirish',
      "1-moddadagi barcha bandlarni o'chirib tashlash",
      "To'lov muddatini keyingi oyning 10-sanasiga ko'chirish",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Yurist 5-moddadagi zararni qoplash yuqori riskdaligini aytgach, savdo xodimi 3 oylik maosh chegarasini qo'yishni taklif qiladi va yurist buni ma'qullaydi.",
    tipUzbek: "'第5条の損害賠償の上限' va '月額報酬の3ヶ月分' iboralariga e'tibor qarating.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '法務部の担当者と営業担当者が話しています。営業担当者はこれから契約書のどこを修正しますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '法務',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          'この業務委託契約書ですが、第5条の損害賠償の上限額の記述が曖昧です。受託側の一方的な過失による場合でも発注額全額とするのはリスクが高すぎます。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '営業',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: 'では、月額報酬の3ヶ月分を限度額とする文言に修正すればよろしいでしょうか？',
        uzbek: '',
      },
      {
        id: 'line_4',
        speaker: '法務',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: 'ええ、その条件なら問題ありません。直ちに修正して先方に送付してください。',
        uzbek: '',
      },
    ],
  },
  {
    id: 39,
    level: 'N2',
    type: 'quick',
    titleUz: 'Rasmiy taklifga rozilik bildirish',
    audioUrl: '/audio/choukai/n2/Track07.mp3',
    script:
      '取引先の社長から「もしよろしければ、弊社の新工場をご案内いたしましょうか」と提案されました。何と答えますか？\n社長：もしよろしければ、弊社の新工場をご案内いたしましょうか。\nあなた：（　）',
    questionText: '適切な返答はどれですか？',
    questionTextUz: 'Prezidentning samimiy taklifiga qanday minnatdor javob qaytariladi?',
    options: [
      'ぜひよろしくお願い申し上げます。お言葉に甘えさせていただきます',
      'いえ、結構ですのでお構いなく',
      'どういたしまして、いつでもどうぞ',
      'ご案内してあげても構いませんよ',
    ],
    optionsUz: [
      'Jon deb qabul qilamiz, marhamatingizdan mamnunmiz',
      "Yo'q, menga kerak emas, bezovta bo'lmang",
      'Arzimaydi, bemalol',
      "Sizni kuzatib qo'ysam ham mayli",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Yapon madaniyatida samimiy mehmondo'stlik taklifiga 'ぜひよろしくお願い申し上げます。お言葉に甘えさせていただきます' (Marhamatingizdan mamnunmiz) deb xushmuomala javob beriladi.",
    tipUzbek: "'お言葉に甘える' iborasi kattalarning iltifotini qabul qilishda qo'llanadi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '取引先の社長から「もしよろしければ、弊社の新工場をご案内いたしましょうか」と提案されました。何と答えますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '社長',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: 'もしよろしければ、弊社の新工場をご案内いたしましょうか。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: 'あなた',
        speakerRoleUz: 'Siz',
        gender: 'neutral',
        japanese: '（　）',
        uzbek: '',
      },
    ],
  },
  {
    id: 40,
    level: 'N2',
    type: 'point',
    titleUz: 'Ekologik qadoqlash loyihasi',
    audioUrl: '/audio/choukai/n2/Track08.mp3',
    script:
      '商品開発会議でデザイナーが話しています。新パッケージでプラスチックを全廃する代わりに採用された工夫は何ですか？\nデザイナー：脱プラスチックに向けて様々な素材を比較検討しました。紙製容器は環境負荷は低いものの湿気に弱い欠点がありましたが、サトウキビの搾りかすを再利用した耐水性植物性コーティングを施すことで、鮮度保持と環境性能の両立を実現しました。',
    questionText: '新パッケージに採用された画期的な工夫は何ですか？',
    questionTextUz: "Yangi qadoqda qo'llanilgan innovatsion yechim nima?",
    options: [
      'サトウキビ廃棄物を原料にした植物性耐水コーティングの採用',
      'アルミ箔を二重に重ねる密閉構造',
      'ガラス容器への全面的な切り替え',
      '防腐剤を増量して賞味期限を延ばすこと',
    ],
    optionsUz: [
      "Shakarqamish chiqindisidan olingan o'simlik suv o'tkazmas qoplama",
      'Alyuminiy qatlamini ikki barobar qalinlashtirish',
      "To'liq shisha idishlarga o'tish",
      "Konservantlarni ko'paytirib saqlash muddatini uzaytirish",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Dizayner qog'ozning namga chidamsizligini hal qilish uchun shakarqamish chiqindisidan olingan o'simlik qoplamasi qo'llanilganini ta'kidlaydi.",
    tipUzbek: "'サトウキビの搾りかすを再利用した耐水性植物性コーティング' asosiy javobdir.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '商品開発会議でデザイナーが話しています。新パッケージでプラスチックを全廃する代わりに採用された工夫は何ですか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: 'デザイナー',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '脱プラスチックに向けて様々な素材を比較検討しました。紙製容器は環境負荷は低いものの湿気に弱い欠点がありましたが、サトウキビの搾りかすを再利用した耐水性植物性コーティングを施すことで、鮮度保持と環境性能の両立を実現しました。',
        uzbek: '',
      },
    ],
  },
  {
    id: 41,
    level: 'N2',
    type: 'task',
    titleUz: 'Taqdimot slaydlarini yangilash',
    audioUrl: '/audio/choukai/n2/Track09.mp3',
    script:
      '研究室で教授が生徒に指示を出しています。生徒は発表スライドをどう変更しますか？\n教授：実験結果のデータは非常に説得力があるね。ただ、グラフの軸の文字が小さすぎて、後方の聴衆には読み取れないよ。フォントサイズを最低でも24ポイントに拡大して、凡例の色分けもコントラストを強めておきなさい。\n生徒：承知しました。フォントを大きくして配色を調整します。',
    questionText: '生徒は発表スライドをどう修正しますか？',
    questionTextUz: 'Talaba taqdimot slaydlarini qanday tuzatadi?',
    options: [
      'グラフのフォントサイズを拡大し色のコントラストを強める',
      'スライドの枚数を半分に減らす',
      '実験データ全体を削除して写真に置き換える',
      '英語のアブストラクトを追加する',
    ],
    optionsUz: [
      'Grafik shriftini kattalashtirish va ranglar kontrastini oshirish',
      'Slaydlar sonini yarmiga qisqartirish',
      "Eksperiment ma'lumotlarini o'chirib fotosurat qo'yish",
      "Inglizcha annotatsiya qo'shish",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Professor grafikdagi harflar orqadagi tomoshabinga ko'rinmasligini aytib, shriftni 24pt ga kattalashtirishni va ranglar kontrastini kuchaytirishni buyurdi.",
    tipUzbek: "'フォントサイズを拡大して、凡例の色分けもコントラストを強めて' buyrug'i.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '研究室で教授が生徒に指示を出しています。生徒は発表スライドをどう変更しますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '教授',
        speakerRoleUz: "O'qituvchi",
        gender: 'male',
        japanese:
          '実験結果のデータは非常に説得力があるね。ただ、グラフの軸の文字が小さすぎて、後方の聴衆には読み取れないよ。フォントサイズを最低でも24ポイントに拡大して、凡例の色分けもコントラストを強めておきなさい。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: '生徒',
        speakerRoleUz: 'Talaba',
        gender: 'neutral',
        japanese: '承知しました。フォントを大きくして配色を調整します。',
        uzbek: '',
      },
    ],
  },
  {
    id: 10,
    level: 'N1',
    type: 'point',
    audioUrl: '/audio/choukai/n1/n1_track_10.mp3',
    titleUz: "Iste'mol pasayishi sababi",
    script:
      'ラジオで経済評論家が話しています。評論家は今年度の個人消費が伸び悩んでいる最大の原因は何だと言っていますか？\n評論家：今年度の景気動向を見ますと、雇用の改善は見られるものの、実質賃金の伸びが物価の上昇に追いついていないことが、消費者の節約志向に拍車をかけています。将来の社会保障に対する不安も背景にありますが、やはり直接的には購買力の低下が最大の要因と分析されます。',
    questionText: '今年度の個人消費が伸び悩んでいる最大の原因は何ですか？',
    questionTextUz: "Ekspertning fikricha shaxsiy iste'mol o'smasligining eng katta sababi nima?",
    options: [
      '失業率が上昇したこと',
      '実質賃金の伸びが物価高に追いつかず購買力が低下したこと',
      '新製品の流通が滞っていること',
      '若者の人口が急減したこと',
    ],
    optionsUz: [
      'Ishsizlik darajasi oshgani',
      'Real oylik inflyatsiyaga yetolmay xarid qobiliyati tushgani',
      "Yangi mahsulotlar yetkazilishi to'xtab qolgani",
      'Yoshlar aholisi keskin kamaygani',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Ekspertning ta'kidlashicha, bandlik yaxshilangan bo'lsa-da, real ish haqining narxlar o'sishidan orqada qolishi va xarid qobiliyatining pasayishi iste'mol o'smasligining bevosita asosiy sababidir.",
    tipUzbek: "'実質賃金の伸びが物価の上昇に追いついていない' jumlasini tushunish.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          'ラジオで経済評論家が話しています。評論家は今年度の個人消費が伸び悩んでいる最大の原因は何だと言っていますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '評論家',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '今年度の景気動向を見ますと、雇用の改善は見られるものの、実質賃金の伸びが物価の上昇に追いついていないことが、消費者の節約志向に拍車をかけています。将来の社会保障に対する不安も背景にありますが、やはり直接的には購買力の低下が最大の要因と分析されます。',
        uzbek: '',
      },
    ],
  },
  {
    id: 11,
    level: 'N1',
    type: 'task',
    titleUz: 'Xalqaro anjuman ochilishidan oldin',
    audioUrl: '',
    script:
      'シンポジウムの運営会議でリーダーが話しています。メンバーは開会までに何を完了させなければなりませんか？\nリーダー：皆さん、準備ご苦労様です。来場者向けのパンフレット配布と誘導動線の確保は整いました。ただ、登壇される海外招聘教授の同時通訳レシーバーの動作確認が一部未完了のままです。開会まであと30分しかありませんので、全端末の音声テストを最優先で完了させてください。\nメンバー：承知しました。直ちに全員で点検します。',
    questionText: 'メンバーは開会までに最優先で何をしなければなりませんか？',
    questionTextUz: "A'zolar anjuman ochilishigacha eng ustuvor nima ishni tugatishlari kerak?",
    options: [
      '来場者パンフレットの印刷',
      '誘導動線の再設計',
      '同時通訳レシーバーの全数動作確認',
      '海外教授の宿泊ホテルの予約',
    ],
    optionsUz: [
      'Tashrif buyuruvchilar bukletini chop etish',
      "Yo'l harakati chiziqlarini qayta chizish",
      "Sinxron tarjima qabul qilgichlarini to'liq tekshirib chiqish",
      'Xorijiy professorlarning mehmonxonasini band qilish',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Lider ochilishga 30 daqiqa qolganini va sinxron tarjima uskunalarining (同時通訳レシーバー) to'liq ovoz sinovidan o'tishini eng ustuvor vazifa deb topshirdi.",
    tipUzbek: "'全端末の音声テストを最優先で' buyrug'i.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          'シンポジウムの運営会議でリーダーが話しています。メンバーは開会までに何を完了させなければなりませんか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: 'リーダー',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '皆さん、準備ご苦労様です。来場者向けのパンフレット配布と誘導動線の確保は整いました。ただ、登壇される海外招聘教授の同時通訳レシーバーの動作確認が一部未完了のままです。開会まであと30分しかありませんので、全端末の音声テストを最優先で完了させてください。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: 'メンバー',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: '承知しました。直ちに全員で点検します。',
        uzbek: '',
      },
    ],
  },
  {
    id: 20,
    level: 'N1',
    type: 'point',
    audioUrl: '/audio/choukai/n1/n1_track_20.mp3',
    titleUz: "Yashil energetika to'sig'i",
    script:
      '環境問題の専門家フォーラムで学者が話しています。再生可能エネルギーの普及を阻む本質的なボトルネックは何だと指摘されていますか？\n学者：発電コストの低下や技術革新は著しいものの、天候による発電量の変動を吸収する大規模蓄電池インフラの未整備と、既存の基幹送電網の容量不足が、これ以上の系統連系拡大における最大の障壁となっています。',
    questionText: '再生可能エネルギー普及の最大の障壁として指摘されているのは何ですか？',
    questionTextUz:
      "Olimning fikricha qayta tiklanuvchi energiya tarqalishiga eng katta to'siq nima?",
    options: [
      '国民の環境意識の著しい欠如',
      '蓄電池インフラの未整備と既存送電網の容量不足',
      '太陽光パネルの製造コストの高騰',
      '原子力発電所の新設ラッシュ',
    ],
    optionsUz: [
      'Aholining ekologik ongi pastligi',
      "Akkumulyator infratuzilmasi yo'qligi va uzatish tarmoqlari yetishmasligi",
      'Quyosh panellari narxining keskin qimmatlashgani',
      "Yangi atom stansiyalari ko'paygani",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Olim ob-havo o'zgaruvchanligini kompensatsiya qiluvchi ulkan akkumulyator tizimlari va uzatish tarmoqlarining sig'imi yetishmasligini asosiy to'siq deb atadi.",
    tipUzbek: "'大規模蓄電池インフラの未整備と、既存の基幹送電網の容量不足' kalit terminlar.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '環境問題の専門家フォーラムで学者が話しています。再生可能エネルギーの普及を阻む本質的なボトルネックは何だと指摘されていますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '学者',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '発電コストの低下や技術革新は著しいものの、天候による発電量の変動を吸収する大規模蓄電池インフラの未整備と、既存の基幹送電網の容量不足が、これ以上の系統連系拡大における最大の障壁となっています。',
        uzbek: '',
      },
    ],
  },
  {
    id: 21,
    level: 'N1',
    type: 'task',
    titleUz: 'Ilmiy maqola uchun etika hujjati',
    audioUrl: '',
    script:
      '国際共同研究プロジェクトのオンラインミーティングで研究代表者が指示を出しています。各国の研究チームは今週末までに何を提出しなければなりませんか？\n代表：論文の初稿執筆は予定通り進んでいます。しかし、査読付き学術誌への投稿に先立ち、各国の研究倫理委員会の承認証明書の英訳原本が必要です。今週末までにクラウドの共有フォルダにアップロードを完了させてください。',
    questionText: '各研究チームが今週末までに提出すべきものは何ですか？',
    questionTextUz: 'Tadqiqot jamoalari hafta oxirigacha nimani yuklashlari kerak?',
    options: [
      '論文の最終決定稿',
      '研究倫理委員会の承認証明書の英訳原本',
      '実験データの全生データファイル',
      '来年度の研究費予算要求書',
    ],
    optionsUz: [
      'Maqolaning yakuniy matni',
      "Tadqiqot etika qo'mitasi tasdiqnomasining inglizcha asl nusxasi",
      "Barcha xom tajriba ma'lumotlari fayllari",
      'Kelasi yilgi tadqiqot byudjeti arizasi',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Loyiha rahbari har bir davlat jamoasiga ilmiy etika qo'mitasining tasdiqlangan inglizcha hujjati asl nusxasini yuklashni buyurdi.",
    tipUzbek: "'研究倫理委員会の承認証明書の英訳原本' iborasi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '国際共同研究プロジェクトのオンラインミーティングで研究代表者が指示を出しています。各国の研究チームは今週末までに何を提出しなければなりませんか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '代表',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '論文の初稿執筆は予定通り進んでいます。しかし、査読付き学術誌への投稿に先立ち、各国の研究倫理委員会の承認証明書の英訳原本が必要です。今週末までにクラウドの共有フォルダにアップロードを完了させてください。',
        uzbek: '',
      },
    ],
  },
  {
    id: 42,
    level: 'N1',
    type: 'summary',
    audioUrl: '/audio/choukai/n1/n1_track_42.mp3',
    titleUz: "Sun'iy intellekt va mualliflik huquqi",
    script:
      '知的財産権のシンポジウムで弁護士がAI生成物の法的扱いについて基調講演を行っています。弁護士は現行法制度の課題をどのように総括していますか？\n弁護士：生成AIによる創作物は、従来の「人間の思想や感情の創作的表現」を前提とした著作権法の枠組みでは捉えきれなくなっています。権利者保護とイノベーション促進のバランスを図る新たな包括的法制度の構築が喫緊の課題と言えます。',
    questionText: '弁護士が指摘する最大の課題は何ですか？',
    questionTextUz: "Advokatning ta'kidlagan eng dolzarb vazifasi nima?",
    options: [
      '生成AIの技術革新を即座に禁止すること',
      '現行著作権法の限界と権利保護・技術革新の両立を目指す新法制定',
      'AI企業の海外移転を促進すること',
      'すべての著作物を無償公開すること',
    ],
    optionsUz: [
      'AI texnologiyalarini darhol taqiqlash',
      'Mavjud mualliflik huquqi chegaralari va innovatsiya bilan muvozanatli yangi qonun qabul qilish',
      "AI kompaniyalarini xorijga ko'chirish",
      'Barcha intellektual mulkni bepul qilish',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Advokat an'anaviy mualliflik huquqi inson hissiyotiga asoslangani uchun AI asarlarini qamrab ololmasligini va yangi qonunchilik tizimini yaratish kechiktirib bo'lmas vazifa ekanini umumlashtirdi.",
    tipUzbek: "'権利者保護とイノベーション促進のバランスを図る新たな包括的法制度' xulosasi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '知的財産権のシンポジウムで弁護士がAI生成物の法的扱いについて基調講演を行っています。弁護士は現行法制度の課題をどのように総括していますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '弁護士',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '生成AIによる創作物は、従来の「人間の思想や感情の創作的表現」を前提とした著作権法の枠組みでは捉えきれなくなっています。権利者保護とイノベーション促進のバランスを図る新たな包括的法制度の構築が喫緊の課題と言えます。',
        uzbek: '',
      },
    ],
  },
  {
    id: 43,
    level: 'N1',
    type: 'point',
    titleUz: 'Aholi qarishi va tibbiyot texnologiyalari',
    audioUrl: '',
    script:
      '公衆衛生政策の諮問会議で有識者が提言しています。超高齢社会における医療費抑制のために最も優先すべき方針は何ですか？\n有識者：重症化してからの高度医療の拡充も大切ですが、財政破綻を防ぐためには、AIバイタルセンシングを用いた未病段階での早期介入と生活習慣病の予防医療へのシフトが不可欠です。治療中心から予防中心への転換こそが核心です。',
    questionText: '医療費抑制のために最優先すべき方針は何ですか？',
    questionTextUz: 'Tibbiyot xarajatlarini jilovlashda eng ustuvor strategiya nima?',
    options: [
      '国民皆保険制度の廃止',
      '治療中心からAIセンサーを用いた予防医療への転換',
      '高齢者の入院期間の一律制限',
      '医薬品の輸入規制強化',
    ],
    optionsUz: [
      "Umumiy sug'urta tizimini bekor qilish",
      "Davolashdan ko'ra AI sensorlari orqali kasallikni oldini olish (profilaktika)ga o'tish",
      'Keksalar shifoxonada yotish muddatini majburiy cheklash',
      "Dori-darmon importini to'xtatish",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Ekspert kasallik og'irlashgandan so'ng davolashdan ko'ra, sun'iy intellekt orqali boshlang'ich bosqichdayoq profilaktika (予防中心への転換) qilish tibbiy byudjetni saqlashning eng asosiy yo'li ekanini ta'kidladi.",
    tipUzbek:
      "'治療中心から予防中心への転換こそが核心です' (Davolashdan profilaktikaga o'tish eng asosiy nuqtadir).",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '公衆衛生政策の諮問会議で有識者が提言しています。超高齢社会における医療費抑制のために最も優先すべき方針は何ですか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '有識者',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '重症化してからの高度医療の拡充も大切ですが、財政破綻を防ぐためには、AIバイタルセンシングを用いた未病段階での早期介入と生活習慣病の予防医療へのシフトが不可欠です。治療中心から予防中心への転換こそが核心です。',
        uzbek: '',
      },
    ],
  },
  {
    id: 44,
    level: 'N1',
    type: 'quick',
    audioUrl: '/audio/choukai/n1/n1_track_44.mp3',
    titleUz: 'Yuqori darajadagi rasmiy muzokara rad javobi',
    script:
      '役員会で他社との提携案について意見を求められました。時期尚早であると慎重な立場を伝える場合、最もふさわしい表現はどれですか？\n議長：この事業提携案について、経営企画部としての見解を聞かせてください。\nあなた：（　）',
    questionText: '適切な発言はどれですか？',
    questionTextUz:
      'Hali vaqti kelmagani (erta) haqida rasmiy va ehtiyotkor fikr qanday bildiriladi?',
    options: [
      '将来的な可能性は認めつつも、市場の動向を踏まえますと、現段階では時期尚早かと存じます',
      'そんな提携案は全く意味がありませんので却下すべきです',
      'どちらでも構いませんので皆さんにお任せいたします',
      '早く契約を結ばないと他社に取られてしまいますよ',
    ],
    optionsUz: [
      "Kelajak imkoniyatlarini e'tirof etgan holda, bozor holatini inobatga olsak hozircha erta deb hisoblayman",
      'Bu reja befoyda, rad qilish kerak',
      "Farqi yo'q, o'zlaringiz bilasizlar",
      'Tezroq imzolamasak boshqalar ilib ketadi',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "JLPT N1 darajasidagi rasmiy korporativ etikada salbiy fikr bildirilganda oldin ijobiy tomoni e'tirof etilib, so'ngra muloyim qilib '現段階では時期尚早かと存じます' deyiladi.",
    tipUzbek:
      "'時期尚早かと存じます' (hali erta deb o'ylayman) oliy darajadagi biznes keigo iborasi.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '役員会で他社との提携案について意見を求められました。時期尚早であると慎重な立場を伝える場合、最もふさわしい表現はどれですか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '議長',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese: 'この事業提携案について、経営企画部としての見解を聞かせてください。',
        uzbek: '',
      },
      {
        id: 'line_3',
        speaker: 'あなた',
        speakerRoleUz: 'Siz',
        gender: 'neutral',
        japanese: '（　）',
        uzbek: '',
      },
    ],
  },
  {
    id: 45,
    level: 'N1',
    type: 'task',
    audioUrl: '/audio/choukai/n1/n1_track_45.mp3',
    titleUz: 'Kiberxavfsizlik protokoli',
    script:
      '情報システム部の緊急対策会議でセキュリティ責任者が指示を出しています。社員が直ちに実施すべき初動対応は何ですか？\n責任者：社内サーバーへの不正アクセスが検知されました。基幹データベースの遮断は完了しましたが、感染拡大を防ぐため、全社のアカウントパスワードの強制リセットを行います。全社員に対し、社内ネットワークから即座に端末を切断し、指定の手順で新パスワードを再設定するよう通達してください。',
    questionText: '全社員が直ちに取るべき対応は何ですか？',
    questionTextUz: 'Barcha xodimlar darhol qanday harakatni amalga oshirishlari shart?',
    options: [
      '端末をネットワークから切断し新パスワードを再設定する',
      'パソコンの電源を完全に切って帰宅する',
      '外部の取引先に謝罪メールを一斉送信する',
      'サーバー室の物理バックアップテープを回収する',
    ],
    optionsUz: [
      "Qurilmani tarmoqdan uzib, yangi parolni qayta o'rnatish",
      "Kompyuterni o'chirib uyga ketish",
      'Mijozlarga birdaniga kechirim xatlari yozish',
      'Server xonasidan tasmali arxivlarni olib chiqish',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Xavfsizlik rahbari zudlik bilan tarmoqdan kompyuterlarni uzishni (ネットワークから即座に端末を切断) va yangi parol o'rnatishni buyurdi.",
    tipUzbek: "'ネットワークから即座に端末を切断し、...再設定する' buyrug'i.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '情報システム部の緊急対策会議でセキュリティ責任者が指示を出しています。社員が直ちに実施すべき初動対応は何ですか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '責任者',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '社内サーバーへの不正アクセスが検知されました。基幹データベースの遮断は完了しましたが、感染拡大を防ぐため、全社のアカウントパスワードの強制リセットを行います。全社員に対し、社内ネットワークから即座に端末を切断し、指定の手順で新パスワードを再設定するよう通達してください。',
        uzbek: '',
      },
    ],
  },
  {
    id: 46,
    level: 'N1',
    type: 'summary',
    audioUrl: '/audio/choukai/n1/n1_track_46.mp3',
    titleUz: "Ta'lim falsafasi va inson kapitali",
    script:
      '大学の学術シンポジウムで教育哲学者が講演しています。現代社会における高等教育の真の使命は何だと論じられていますか？\n講演者：短期的な即戦力としての職業スキルの習得が声高に叫ばれる昨今ですが、技術革新のスピードが加速する時代において真に必要なのは、既存の知識を批判的に疑い、未知の問いを自ら立てる教養と批判的思考力です。知識の消費者を育てるのではなく、問いの創造者を育てることこそが高等教育の真髄です。',
    questionText: '講演者が主張する高等教育の本質的使命は何ですか？',
    questionTextUz: "Ma'ruzachining ta'kidlashicha oliy ta'limning eng asosiy maqsadi nima?",
    options: [
      '未知の問いを自ら立てる批判的思考力を持った人材の育成',
      '即座に使えるプログラミングスキルの徹底的な訓練',
      '大学の学費を無償化して進学率を90%に引き上げること',
      '企業の要求に応じた専門資格取得者の大量輩出',
    ],
    optionsUz: [
      "Noma'lum savollarni mustaqil qo'ya oluvchi tanqidiy fikrlovchi insonlarni tarbiyalash",
      "Tezkor dasturlash ko'nikmalarini intensiv o'rgatish",
      "Talabalarni 90% ga yetkazish uchun o'qishni tekin qilish",
      "Kompaniyalar talabiga ko'ra mutaxassislar tayyorlash",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Olim oliy ta'lim faqat kasbiy ko'nikma beruvchi emas, balki mavjud bilimlarni tanqidiy tahlil qilib, o'z oldiga yangi savollar qo'ya oladigan ijodkor insonlarni (未知の問いを自ら立てる教養と批判的思考力) yetishtirishi kerakligini ta'kidladi.",
    tipUzbek: "'問いの創造者を育てることこそが高等教育の真髄です' eng asosiy xulosa.",
    dialogueLines: [
      {
        id: 'line_1',
        speaker: 'ナレーション',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '大学の学術シンポジウムで教育哲学者が講演しています。現代社会における高等教育の真の使命は何だと論じられていますか？',
        uzbek: '',
      },
      {
        id: 'line_2',
        speaker: '講演者',
        speakerRoleUz: 'Boshlovchi',
        gender: 'neutral',
        japanese:
          '短期的な即戦力としての職業スキルの習得が声高に叫ばれる昨今ですが、技術革新のスピードが加速する時代において真に必要なのは、既存の知識を批判的に疑い、未知の問いを自ら立てる教養と批判的思考力です。知識の消費者を育てるのではなく、問いの創造者を育てることこそが高等教育の真髄です。',
        uzbek: '',
      },
    ],
  },
  {
    id: 47,
    level: 'N4',
    type: 'task',
    titleUz: "Do'konda to'lov qilish",
    script:
      '店で 男の人と 店員が 話しています。男の人は いくら 払いますか？\n店員：いらっしゃいませ。こちらの お弁当は 500円です。お茶は 150円になります。\n男：あ、この 割引クーポンは 使えますか？100円引きの クーポンです。\n店員：はい、使えますよ。合計から 100円 お引きしますね。\n男：じゃあ、これで お願いします。',
    questionText: '男の人は いくら 払いますか？',
    questionTextUz: "Erkak kishi qancha to'laydi?",
    options: ['650円', '550円', '500円', '400円'],
    optionsUz: ['650 yen', '550 yen', '500 yen', '400 yen'],
    correctAnswer: 1,
    explanationUzbek:
      "Bento 500 yen + choy 150 yen = jami 650 yen. Erkak 100 yenlik chegirma kuponidan foydalangani uchun (650 - 100) = 550 yen to'laydi.",
    tipUzbek:
      "Chegirma (割引) so'zini eshitganda umumiy summadan chegirma narxini ayirishni unutmang.",
  },
  {
    id: 48,
    level: 'N4',
    type: 'point',
    titleUz: 'Uchrashuv vaqti',
    script:
      '大学で 女の学生と 男の学生が 話しています。二人は 何時に どこで 会いますか？\n女：明日の 映画、何時に する？映画は 2時からだよ。\n男：じゃあ、30分前に 映画館の 前で 会おうか。\n女：うーん、お昼ごはんを 一緒に 食べない？12時半に 駅の 改札口で どう？\n男：いいね！じゃあ、そうしよう。',
    questionText: '二人は 明日 何時に どこで 会いますか？',
    questionTextUz: 'Ular ertaga soat nechada qayerda uchrashishadi?',
    options: [
      '12時半に 駅の 改札口',
      '1時半に 映画館の 前',
      '2時に 映画館の 中',
      '12時に レストラン',
    ],
    optionsUz: [
      'Soat 12:30 da vokzal turniketida',
      'Soat 13:30 da kinoteatr oldida',
      'Soat 14:00 da kinoteatr ichida',
      'Soat 12:00 da restoranda',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Avval erkak 13:30 da kinoteatrda uchrashishni aytadi, lekin ayol tushlik qilishni taklif qilib '12:30 da vokzal turniketida' uchrashishga kelishib olishadi.",
    tipUzbek:
      "Suhbat oxirida o'zgartirilgan yakuniy taklifga (じゃあ、そうしよう) e'tibor qarating.",
  },
  {
    id: 49,
    level: 'N4',
    type: 'quick',
    titleUz: 'Taklifga javob',
    script: '男：日曜日、みんなで バーベキューを するんだけど、一緒に行かない？',
    questionText: '質問を聞いて、何と答えますか？',
    questionTextUz: "Qanday javob berish to'g'ri?",
    options: [
      'ええ、ぜひ 行きたいです！',
      'いいえ、行きましたよ。',
      'バーベキューを 食べました。',
      '日曜日は 晴れですね。',
    ],
    optionsUz: [
      'Ha, albatta borishni xohlayman!',
      "Yo'q, bordim-ku.",
      'Barbekyu yedim.',
      "Yakshanba kuni ochiq havo bo'ladi.",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "'~ikani?' taklifiga eng tabiiy va xushmuomala ijobiy javob 'ええ、ぜひ行きたいです！' hisoblanadi.",
    tipUzbek: "Taklifga rozilik bildirishda 'ぜひ' (albatta/jon deb) so'zi kalit hisoblanadi.",
  },
  {
    id: 50,
    level: 'N4',
    type: 'task',
    titleUz: 'Kasalxonada dori ichish tartibi',
    script:
      '病院で 医者と 女の人が 話しています。女の人は 白い薬を いつ 飲みますか？\n医者：熱が ありますね。薬を 2種類 出しておきます。\n女：はい、どのように 飲めば いいですか？\n医者：この 赤い薬は 毎食後、白い薬は 熱が 高くて つらい時だけに 飲んでください。\n女：わかりました。ありがとうございます。',
    questionText: '女の人は 白い薬を いつ 飲みますか？',
    questionTextUz: 'Ayol oq dorini qachon ichadi?',
    options: ['毎朝 起きたとき', '毎食後 必ず', '熱が高くて つらい時だけ', '寝る前だけに'],
    optionsUz: [
      "Har kuni ertalab uyg'onganda",
      'Har safar ovqatdan keyin albatta',
      "Harorati baland bo'lib qiynalgandagina",
      'Faqat uxlashdan oldin',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Shifokor qizil dorini har safar ovqatdan so'ng, oq dorini esa faqat isitmasi ko'tarilib qiynalganda (熱が高くてつらい時だけ) ichishni aytadi.",
    tipUzbek:
      "Ikki xil dori haqida gapirilganda savolda aynan qaysi dori (oq yoki qizil) so'ralayotganiga e'tibor bering.",
  },
  {
    id: 51,
    level: 'N4',
    type: 'point',
    titleUz: 'Poyezd kechikishi sababi',
    script:
      '駅で アナウンスを 聞いています。電車が 遅れている 理由は 何ですか？\nアナウンス：お客様に お知らせいたします。ただいま、強風の 影響により、東海道線は 全線で 運転を 見合わせております。運転再開は 10時30分頃を 予定しております。ご迷惑を おかけして 大変 申し訳ございません。',
    questionText: '電車が 遅れている 理由は 何ですか？',
    questionTextUz: 'Poyezd kechikayotganining sababi nima?',
    options: ['大雨', '事故', '強風', '大雪'],
    optionsUz: ["Kuchli yomg'ir", 'Halokat', 'Kuchli shamol', 'Qalin qor'],
    correctAnswer: 2,
    explanationUzbek:
      "E'londa '強風の影響により' (kuchli shamol ta'siri sababli) poyezdlar harakati to'xtatilgani aytiladi.",
    tipUzbek:
      "Sababni ifodalovchi '~no eikyou ni yori' (tufayli/sababli) birikmasi oldidagi so'zga quloq soling.",
  },
  {
    id: 52,
    level: 'N4',
    type: 'summary',
    titleUz: "Yaponiyada bayram sovg'asi",
    script:
      '先生が 日本の 習慣について 話しています。\n先生：日本には 夏に「お中元」、冬に「お歳暮」という 贈り物を する 習慣があります。これは、日頃 お世話になっている 上司や 親戚に、感謝の 気持ちを 伝えるための ものです。ビールや そうめん、お菓子などが よく 選ばれます。',
    questionText: '先生は 何について 話していますか？',
    questionTextUz: "O'qituvchi nima haqida gapirmoqda?",
    options: [
      'お中元やお歳暮という 感謝の 贈り物の 習慣',
      'ビールの 作り方',
      '夏休みの 旅行の 計画',
      '親戚の 人数の 増え方',
    ],
    optionsUz: [
      "O-chuugen va O-seibo minnatdorchilik sovg'alari odati",
      'Pivo tayyorlash usuli',
      "Yozgi ta'til sayohati rejasi",
      "Qarindoshlar sonining ko'payishi",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "O'qituvchi Yaponiyada yozda va qishda minnatdorchilik bildirish uchun beriladigan sovg'alar (O-chuugen, O-seibo) haqida gapirmoqda.",
    tipUzbek:
      "Xulosa (概要理解) savollarida butun nutqning mavzusini qamrab oluvchi variant to'g'ri bo'ladi.",
  },
  {
    id: 53,
    level: 'N4',
    type: 'quick',
    titleUz: 'Hamdardlik bildirish',
    script: '女：昨日から ずっと 頭が 痛くて、熱も あるんです。',
    questionText: '質問を聞いて、何と答えますか？',
    questionTextUz: "Qanday javob berish to'g'ri?",
    options: [
      'それは いけませんね。お大事に。',
      'おめでとうございます！',
      'いただきます。',
      'どういたしまして。',
    ],
    optionsUz: [
      "Bu yomon bo'libdi-ku. Sog'ayib keting.",
      'Tabriklayman!',
      'Yoqimli ishtaha.',
      'Arzimaydi.',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Bosh og'rig'i va isitmasi bor odamga hamdardlik sifatida 'それは いけませんね。お大事に' (Tuzalib keting) deyiladi.",
    tipUzbek: "Bemorga nisbatan standart ibora 'お大事に' (o-daiji ni) hisoblanadi.",
  },
  {
    id: 54,
    level: 'N4',
    type: 'task',
    titleUz: "Ofisda nusxa ko'chirish",
    script:
      '会社で 上司と 部下が 話しています。部下の 男性は まず 何を しますか？\n上司：山田くん、この 会議の 資料、20部 コピーして ホチキスで 留めてくれる？\n男性：はい、わかりました。あ、カラーですか、白黒ですか？\n上司：グラフが あるから カラーで お願い。あ、その前に 誤字がないか 1回 見直してくれる？\n男性：承知しました。すぐ 確認します。',
    questionText: '部下の 男性は まず 何を しますか？',
    questionTextUz: 'Xodim yigit dastlab nima qiladi?',
    options: [
      '資料を カラーコピーする',
      'ホチキスで 留める',
      '資料の 誤字がないか 確認する',
      '会議室を 予約する',
    ],
    optionsUz: [
      "Hujjatni rangli nusxa ko'paytiradi",
      'Stepler bilan qadab chiqadi',
      "Hujjatda xatolik bor-yo'qligini tekshiradi",
      'Majlislar xonasini band qiladi',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Rahbar avval nusxa ko'chirishni aytadi, ammo 'uning oldidan xato bormi tekshirib ol' (その前に見直してくれる？) degani uchun xodim dastlab tekshiruv o'tkazadi.",
    tipUzbek:
      "'その前に' (undan oldin) iborasidan keyin aytilgan amal har doim birinchi bo'lib bajariladi.",
  },
  {
    id: 55,
    level: 'N4',
    type: 'point',
    titleUz: 'Mehmonxonada nonushta',
    script:
      'ホテルの フロントで 男の人が 係の人に 聞いています。朝食は どこで 食べられますか？\n男：すみません、明日の 朝食は どこですか？\n係：朝食は 2階の レストラン「さくら」で ご用意しております。和食と 洋食の バイキング形式で、朝 7時から 9時半まで ご利用いただけます。\n男：部屋番号を 言えば いいですか？\n係：はい、入口で お部屋の ルームキーを ご提示ください。',
    questionText: '朝食は どこで 食べられますか？',
    questionTextUz: 'Nonushtani qayerda tanovul qilish mumkin?',
    options: ['1階の ロビー', '2階の レストラン', '自分の 部屋', '地下の カフェ'],
    optionsUz: ['1-qavat foye', '2-qavat restorani', "O'z xonasi", 'Zirzamidagi kofe'],
    correctAnswer: 1,
    explanationUzbek:
      "Xodim nonushta 2-qavatdagi 'Sakura' restoranida (2階のレストラン) ekanligini aytadi.",
    tipUzbek: 'Qayerda (doko de) savoliga javob berishda qavat va joy nomiga diqqat qiling.',
  },
  {
    id: 56,
    level: 'N4',
    type: 'quick',
    titleUz: 'Kechikish uchun uzr',
    script: '男：遅れてしまって、本当に すみませんでした！',
    questionText: '質問を聞いて、何と答えますか？',
    questionTextUz: "Qanday javob berish to'g'ri?",
    options: [
      'いいえ、私も さっき 着いたところですから、大丈夫ですよ。',
      'はい、遅れましたね。',
      'ごちそうさまでした。',
      '失礼します。',
    ],
    optionsUz: [
      "Hechqisi yo'q, o'zim ham hozirgina yetib keldim, xavotir olmang.",
      'Ha, kechikdingiz-da.',
      "Rahmat, to'ydim.",
      'Ruxsat bering.',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Kechikib kelgan odam uzr so'raganda xotirjam qilib 'いいえ、私もさっき着いたところですから、大丈夫ですよ' (hechqisi yo'q, o'zim ham boyagina keldim) deyish odob qoidasidir.",
    tipUzbek: "Uzrga nisbatan kechirimlilik va xotirjamlik ifodasi to'g'ri variantdir.",
  },
  {
    id: 57,
    level: 'N3',
    type: 'task',
    audioUrl: '/audio/choukai/n3/11 Track 11.mp3',
    titleUz: "Yangi xodimlar yig'ilishiga tayyorgarlik",
    script:
      '会社で 先輩と 後輩が 新入社員研修の 準備について 話しています。後輩の 女性は 次に 何を しますか？\n先輩：研修の 会場、机の 配置は 終わった？\n女性：はい、グループワーク用に 4人掛けの 島を 5つ 作りました。\n先輩：ありがとう。じゃあ、参加者の 名札と 配布資料を 各机に 並べてくれる？\n女性：わかりました。あ、プロジェクターの 接続確認は もう 済んでいますか？\n先輩：あ、それは まだだ。僕が やっておくから、君は 名札と 資料の 準備を 急いでくれ。\n女性：承知しました！',
    questionText: '後輩の 女性は 次に 何を しますか？',
    questionTextUz: 'Kichik mutaxassis ayol bundan keyin nima qiladi?',
    options: [
      '机の 配置を 変更する',
      '名札と 配布資料を 各机に 並べる',
      'プロジェクターの 接続テストを する',
      '参加者に 電話を かける',
    ],
    optionsUz: [
      "Stollar joylashuvini o'zgartiradi",
      "Ism kartalari va tarqatma materiallarni stollarga qo'yadi",
      "Proyektorni ulash testini o'tkazadi",
      "Ishtirokchilarga qo'ng'iroq qiladi",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Katta xodim proyektorni o'zi tekshirishini aytib, ayoldan stollarga ism kartochkalari va materiallarni joylashtirishni (名札と資料の準備) so'raydi.",
    tipUzbek:
      "Vazifalar bo'linganda kim qaysi ishni o'z zimmasiga olganini (僕がやっておく / 君は...) ajrating.",
  },
  {
    id: 58,
    level: 'N3',
    type: 'point',
    audioUrl: '/audio/choukai/n3/12 Track 12.mp3',
    titleUz: 'Ish almashtirish sababi',
    script:
      '男の人と 女の人が 転職について 話しています。男の人が 転職を 決意した 一番の 理由は 何ですか？\n女：田中さん、来月で 退職されるそうですね。待遇に 不満でも あったんですか？\n男：いえ、給与や 福利厚生には 満足していました。残業も 少なかったですし。\n女：じゃあ、どうして？\n男：もっと 自分の スキルを 活かして、海外向けの 新規事業に 挑戦したかったんです。今の 会社では 国内事業が 中心で、希望の 部署に 空きが なくて。\n女：なるほど、キャリアアップの ための 前向きな 挑戦なんですね。',
    questionText: '男の人が 転職を 決意した 一番の 理由は 何ですか？',
    questionTextUz: 'Erkak kishi ishini almashtirishga qaror qilganining eng asosiy sababi nima?',
    options: [
      '給与が 低く 残業が 多かったから',
      '人間関係が うまくいかなかったから',
      '海外向けの 新規事業に 挑戦したかったから',
      '体調を 崩したから',
    ],
    optionsUz: [
      "Maoshi past va ortiqcha ishlari ko'p bo'lgani uchun",
      "Jamoaviy munosabatlar yomon bo'lgani uchun",
      "Chet elga yo'naltirilgan yangi loyihalarda o'zini sinab ko'rmoqchi bo'lgani uchun",
      "Sog'lig'i yomonlashgani uchun",
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Erkak oylikdan nolimaganini aytadi, lekin o'z qobiliyatini rivojlantirib chet elga oid yangi loyihalarda ishlashni orzu qilganini (海外向けの新規事業に挑戦) ta'kidlaydi.",
    tipUzbek:
      "Inkorni bildiruvchi 'いえ、〜には満足していました' so'zlaridan so'ng haqiqiy sabab keladi.",
  },
  {
    id: 59,
    level: 'N3',
    type: 'quick',
    audioUrl: '/audio/choukai/n3/13 Track 13.mp3',
    titleUz: 'Maslahatga minnatdorlik',
    script: '男：先輩、先日の アドバイスのおかげで、無事に プレゼンが 成功しました！',
    questionText: '先輩は 何と 答えますか？',
    questionTextUz: 'Katta xodim qanday javob qaytaradi?',
    options: [
      'それは よかった！君が 努力した 成果だよ。',
      'いいえ、プレゼンは 失敗でしたね。',
      '今から 始めましょう。',
      'どういたしまして、やり直してください。',
    ],
    optionsUz: [
      "Juda soz bo'libdi! Bu o'zing qilgan mehnatning natijasi.",
      "Yo'q, taqdimot barbod bo'ldi-ku.",
      'Hozirdan boshlaylik.',
      'Arzimaydi, boshqatdan qiling.',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Muvaffaqiyatli taqdimot haqidagi minnatdorlikka 'それはよかった！君が努力した成果だよ' (Juda yaxshi, o'zing harakat qilganing mevasi) deb javob berish eng munosibdir.",
    tipUzbek: "Yutuq bilan o'rtoqlashganda tabrik va rag'batlantirish ifodasi to'g'ri bo'ladi.",
  },
  {
    id: 60,
    level: 'N3',
    type: 'summary',
    audioUrl: '/audio/choukai/n3/14 Track 14.mp3',
    titleUz: 'Qayta tiklanadigan energiya',
    script:
      '環境問題の セミナーで 講師が 話しています。\n講師：脱炭素社会の 実現に向けて、太陽光や 風力といった 再生可能エネルギーの 導入が 加速しています。しかし、天候によって 発電量が 変動するという 弱点があります。これを 解決するためには、大容量の 蓄電池技術の 開発と、地域間で 電力を 融通し合う 送電網の 強化が 不可欠です。',
    questionText: '講師が 最も 強調していることは 何ですか？',
    questionTextUz: "Ma'ruzachi eng ko'p nimani ta'kidlamoqda?",
    options: [
      '再生可能エネルギーの 開発を 直ちに 中止すべきであること',
      '再エネの 変動性を 補う 蓄電池や 送電網の 整備が 不可欠であること',
      '石炭火力発電所を さらに 増設すべきであること',
      '電気料金を 大幅に 値上げすべきであること',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Ma'ruzachi quyosh va shamol energiyasining ob-havoga bog'liqligini bartaraf etish uchun akkumulyator va elektr uzatish tarmog'ini kuchaytirish zarurligini uqtiradi.",
    tipUzbek: "'これを解決するためには、〜が不可欠です' jumlasiga tayaning.",
  },
  {
    id: 61,
    level: 'N3',
    type: 'point',
    audioUrl: '/audio/choukai/n3/15 Track 15.mp3',
    titleUz: 'Sport zalini tanlash sababi',
    script:
      '女性二人が フィットネスクラブについて 話しています。二人が 最終的に Aジムを 選んだ 理由は 何ですか？\n女1：ジム、Bジムは プールが あるけど、駅から 徒歩15分で ちょっと 遠いよね。\n女2：そうだね。Aジムは プールは ないけど、駅直結で 24時間 営業だよ。\n女1：仕事帰りに 寄りやすいのが 一番だよね。月謝も Aジムの 方が 2000円 安いし。\n女2：決まり！じゃあ Aジムに 入会しよう。',
    questionText: '二人が Aジムを 選んだ 決定的な 理由は 何ですか？',
    questionTextUz: 'Ular nima sababdan A sport zalini tanlashdi?',
    options: [
      'プールが 広くて きれいだから',
      '駅に近くて 24時間使え、月謝も 安いから',
      'トレーナーが 有名だから',
      '土日だけ 営業しているから',
    ],
    optionsUz: [
      "Basseyni katta va chiroyli bo'lgani uchun",
      "Vokzalga ulangan, 24 soat ochiq va oylik to'lovi arzon bo'lgani uchun",
      "Murabbiylari mashhur bo'lgani uchun",
      'Faqat dam olish kunlari ishlagani uchun',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "A zali vokzalga yaqinligi, 24 soat ochiqligi va to'lovi arzonroq ekanligi sababli tanlandi.",
    tipUzbek:
      'Ikki tomonlama solishtirishda ijobiy afzalliklar umumlashtirilgan variantni tanlang.',
  },
  {
    id: 62,
    level: 'N3',
    type: 'task',
    audioUrl: '/audio/choukai/n3/16 Track 16.mp3',
    titleUz: 'Ijara shartnomasini yangilash',
    script:
      '不動産屋で 男の人と 店員が 話しています。男の人は いつまでに 更新手続きの 書類を 出さなければなりませんか？\n店員：マンションの 契約満了が 3月末日となっております。更新を ご希望の場合は、満了の 1ヶ月前までに 書類を ご返送いただく 必要が ございます。\n男：ということは、2月末日までに 必着ですね？\n店員：はい、その通りです。同封の 振込用紙での 更新料の お支払いも 同時に お願いいたします。\n男：わかりました。',
    questionText: '男の人は いつまでに 更新手続きの 書類を 出さなければなりませんか？',
    questionTextUz: 'Erkak kishi shartnomani yangilash hujjatlarini qachongacha topshirishi kerak?',
    options: ['1月末日', '2月末日', '3月末日', '4月1日'],
    optionsUz: [
      'Yanvar oyining oxirigacha',
      'Fevral oyining oxirigacha',
      'Mart oyining oxirigacha',
      '1-aprelgacha',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Shartnoma mart oxirida tugaydi, biroq 1 oy oldin topshirilishi kerakligi sababli oxirgi muddat 2-oy (fevral) oxirigacha bo'ladi: '2月末日までに必着'.",
    tipUzbek: "'1ヶ月前までに' degan hisob-kitobni aniq amalga oshiring.",
  },
  {
    id: 63,
    level: 'N3',
    type: 'quick',
    audioUrl: '/audio/choukai/n3/17 Track 17.mp3',
    titleUz: "Hamkasbdan yordam so'rash",
    script:
      '女：すみません、今 ちょっと 手が 離せないんですが、この 荷物を 運ぶのを 手伝っていただけませんか？',
    questionText: '質問を聞いて、何と答えますか？',
    questionTextUz: "Qanday javob berish to'g'ri?",
    options: [
      'ええ、いいですよ。どこへ 運びますか？',
      'はい、運ばせていただきました。',
      '荷物は 重いですね。',
      'いいえ、手伝いました。',
    ],
    optionsUz: [
      'Ha, mayli. Qayerga olib boramiz?',
      'Ha, olib borishga ruxsat oldim.',
      "Yuk og'ir ekan-a.",
      "Yo'q, yordam berdim.",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Yordam so'ralganda 'ええ、いいですよ。どこへ運びますか？' (Ha mayli, qayerga olib boramiz?) deb javob qaytariladi.",
    tipUzbek:
      "'手伝っていただけませんか？' iltimosiga rozilik va keyingi harakatni aniqlashtirish mantiqiydir.",
  },
  {
    id: 64,
    level: 'N3',
    type: 'summary',
    audioUrl: '/audio/choukai/n3/18 Track 18.mp3',
    titleUz: "Ta'limda o'yinlashtirish (Gamification)",
    script:
      '教育関係の ラジオ番組を 聞いています。\n解説者：最近、語学学習アプリなどに ゲームの 要素を 取り入れる「ゲーミフィケーション」が 注目されています。経験値や バッジの 獲得、連続ログインの 記録などによって、学習者の モチベーションを 維持する 仕組みです。単調になりがちな 基礎学習を 楽しく 習慣化する上で、非常に 有効な 手法と 言えます。',
    questionText: '解説者は 何について 話していますか？',
    questionTextUz: 'Boshlovchi nima haqida gapirmoqda?',
    options: [
      '最新の テレビゲームの 攻略法',
      '学習に ゲームの 要素を 導入して 意欲を 高める 手法',
      'スマートフォンの 使いすぎによる 弊害',
      '学校の テストで 満点を 取る 方法',
    ],
    optionsUz: [
      "Eng yangi videoo'yinlarni o'tish usuli",
      "O'qishga o'yin elementlarini kiritib qiziqishni oshirish usuli",
      "Smartfondan me'yordan ortiq foydalanish zararlari",
      'Maktab imtihonida eng yuqori ball olish usullari',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Nutq ta'limga o'yin elementlarini kiritish (ゲーミフィケーション) orqali o'quvchilar motivatsiyasini saqlab qolish haqidadir.",
    tipUzbek:
      "Mavzuni topishda asosiy atama (ゲーミフィケーション) va uning maqsadiga e'tibor bering.",
  },
  {
    id: 65,
    level: 'N3',
    type: 'point',
    audioUrl: '/audio/choukai/n3/19 Track 19.mp3',
    titleUz: "Kompaniya ekskursiyasi bekor bo'lishi",
    script:
      '社内放送を 聞いています。週末の 社員旅行が 延期になった 理由は 何ですか？\nアナウンス：社員の 皆様に ご連絡いたします。今週末に 予定されておりました 秋の 社員旅行ですが、大型の 台風が 接近しており、現地の 交通機関に 大幅な 乱れが 予想されるため、誠に 残念ながら 来月に 延期することとなりました。日程の 詳細は 追って ご連絡いたします。',
    questionText: '社員旅行が 延期になった 理由は 何ですか？',
    questionTextUz: 'Kompaniya sayohati qoldirilganining sababi nima?',
    options: [
      '参加者の 人数が 足りなかったから',
      '大型の 台風が 接近しているから',
      'バスの 手配が できなかったから',
      '会社の 業績が 悪化したから',
    ],
    optionsUz: [
      'Qatnashuvchilar soni yetmagani uchun',
      'Katta tayfun yaqinlashib kelayotgani uchun',
      'Avtobus topilmagani uchun',
      'Kompaniya moliyaviy ahvoli yomonlashgani uchun',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Katta tayfun (大型の台風が接近) yaqinlashib kelayotgani va yo'llar yopilishi mumkinligi sababli sayohat keyingi oyga qoldirildi.",
    tipUzbek: "'〜ため、延期することとなりました' qismidagi sababni aniqlang.",
  },
  {
    id: 66,
    level: 'N3',
    type: 'quick',
    audioUrl: '/audio/choukai/n3/20 Track 20.mp3',
    titleUz: 'Hamkasbga minnatdorchilik bildirish',
    script: '女：課長、お忙しいところ、わざわざ お越しいただき ありがとうございました。',
    questionText: '課長は 何と 答えますか？',
    questionTextUz: "Bo'lim boshlig'i nima deb javob qaytaradi?",
    options: [
      'いいえ、とんでもない。お役に 立てて よかったです。',
      'はい、忙しかったです。',
      'お疲れ様でした。さようなら。',
      'どうぞ お入りください。',
    ],
    optionsUz: [
      "Yo'g'-e, arzimaydi. Foydam tekkan bo'lsa xursandman.",
      'Ha, juda band edim.',
      'Hormang, xayr.',
      'Marhamat, kiring.',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Xushmuomala minnatdorlikka 'いいえ、とんでもない。お役に立ててよかったです' (Hechqisi yo'q, yordamim tekkan bo'lsa xursandman) deb javob beriladi.",
    tipUzbek:
      "Rasmiy kensonda 'とんでもない' (arzimaydi/hechqisi yo'q) iborasi o'rinli hisoblanadi.",
  },
  {
    id: 67,
    level: 'N2',
    type: 'task',
    titleUz: 'Kompaniya yangi mahsulot taqdimoti',
    script:
      '商品開発部の 会議で 部長と 担当者が 話しています。担当の 男性は この後 まず 何を しますか？\n部長：来期の 新型スマートウォッチの 試作機、デザインは 非常に 評判が いいね。ただ、バッテリーの 持ちについて 営業部から 懸念が 出ている。\n男性：はい、高機能センサーの 常時稼働が 原因と考えられます。\n部長：来週の 経営会議で 承認を 得る必要がある。コストを 抑えつつ バッテリー容量を 増やす代替案を、明日の 夕方までに 3パターン 作成してくれ。\n男性：承知いたしました。技術チームと 至急 協議に入ります。',
    questionText: '担当の 男性は この後 まず 何を しますか？',
    questionTextUz: "Mas'ul xodim bundan keyin darhol nima ish qiladi?",
    options: [
      '営業部に 説明に 行く',
      '技術チームと 代替案の 協議を 行う',
      '試作機の デザインを 変更する',
      '経営会議の 議事録を 作成する',
    ],
    optionsUz: [
      "Sotuv bo'limiga tushuntirishga boradi",
      'Muhandislar jamoasi bilan muqobil yechimlarni muhokama qiladi',
      "Prototip dizaynini o'zgartiradi",
      'Boshqaruv kengashi majlisi bayonnomasini tuzadi',
    ],
    correctAnswer: 1,
    explanationUzbek:
      'Xodim ertaga kechgacha 3 ta variant tayyorlash uchun darhol muhandislar (texnik guruh) bilan maslahatlashishga (技術チームと至急協議) kirishishini aytadi.',
    tipUzbek: "'この後まず何をするか' savolida xodimning eng birinchi amaliga diqqat qiling.",
  },
  {
    id: 68,
    level: 'N2',
    type: 'point',
    titleUz: 'Masofaviy ishning qiyinchiligi',
    script:
      '人事コンサルタントが テレワークの 課題について 話しています。\nコンサルタント：テレワークは 通勤ストレスの 軽減や 業務効率の 向上を もたらしましたが、その一方で「偶発的な コミュニケーションの 喪失」という 深刻な 弊害を 生んでいます。オフィスでの 雑談や すれ違いざまの 相談から 生まれていた 創発的な アイデアが 激減し、組織の イノベーションが 停滞する リスクが 浮き彫りになっているのです。',
    questionText: 'コンサルタントが 指摘する テレワークの 最大の 弊害は 何ですか？',
    questionTextUz: "Mutaxassis masofaviy ishning eng katta zarari sifatida nimani ko'rsatmoqda?",
    options: [
      '通勤時間が 長くなり 疲労が 蓄積すること',
      '雑談などの 偶発的な 対話が 失われ、革新的な 発想が 減ること',
      '通信回線の 費用が 高騰すること',
      'パソコンの 性能が 低下すること',
    ],
    optionsUz: [
      "Yo'l vaqti ko'payib charchoq ortishi",
      "Tasodifiy suhbatlar yo'qolib, yangi ijodiy g'oyalar kamayishi",
      "Internet to'lovlari oshib ketishi",
      'Kompyuter tezligi pasayishi',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Masofaviy ish tufayli norasmiy tasodifiy suhbatlar (雑談や偶発的な対話) yo'qolgani va bu yangi innovatsiyalarning to'xtashiga olib kelishi ta'kidlangan.",
    tipUzbek: "'偶発的なコミュニケーションの喪失' jumlasi to'g'ridan-to'g'ri kalit hisoblanadi.",
  },
  {
    id: 69,
    level: 'N2',
    type: 'quick',
    titleUz: 'Hamkor bilan kelishuvdagi muloyim rad javobi',
    script: '取引先：今回の 納期短縮の ご提案、何とか ご検討いただけないでしょうか？',
    questionText: '質問を聞いて、何と答えますか？',
    questionTextUz: "Qanday javob berish biznes etikasiga to'g'ri?",
    options: [
      '大変 恐縮ですが、現場の 稼働状況からいたしまして、これ以上の 短縮は 致しかねます。',
      'はい、喜んで 短縮いたします。',
      '納期なんて 関係ありませんよ。',
      'ぜひ お引き受けしたいです。',
    ],
    optionsUz: [
      "Juda uzr so'raymiz, mavjud ishlab chiqarish quvvatlaridan kelib chiqib, bundan ortiq qisqartira olmaymiz.",
      'Ha, bajonidil muddatni qisqartiramiz.',
      "Muddatning umuman ahamiyati yo'q.",
      "Jon deb qabul qilgan bo'lardik.",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Talabni xushmuomala rad etishda '大変恐縮ですが、〜は致しかねます' (uzr so'ragan holda imkonsizligini bildirish) N2 keigo qoidasidir.",
    tipUzbek: "'〜いたしかねます' (qila olmaymiz) fe'li muloyim inkor uchun ishlatiladi.",
  },
  {
    id: 70,
    level: 'N2',
    type: 'summary',
    titleUz: 'Hissiy aql (EQ) va rahbarlik',
    script:
      '経営大学院の 講義で 教授が 話しています。\n教授：激変する 現代の ビジネス環境において、リーダーに 求められる 資質は、IQ（知能指数）の 高さから EQ（心の知能指数）へと シフトしています。論理的な 正論だけで 部下を 動かそうとしても、反発を 招くだけです。部下の 不安や 葛藤に 共感し、心理的 安全性を 確保した 上で 自発的な 挑戦を 促せる 人物こそが、真の 成果を 生み出せるのです。',
    questionText: '教授の 主張の 要点は 何ですか？',
    questionTextUz: 'Professor fikrining asosiy mazmuni nima?',
    options: [
      'リーダーは 部下の 意見を 聞かずに 厳しく 統制すべきだ',
      'IQのみを 重視し、感情的な 配慮は 排除すべきだ',
      '共感力と 心理的 安全性を 重視する EQの 高い リーダーシップが 必要である',
      'ビジネスでは 感情を 一切 表に出してはならない',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Professor boshqaruvda faqat sovuq mantiq emas, balki xodimlarning his-tuyg'ularini tushunadigan va psixologik xavfsizlik yaratuvchi EQ yetakchiligi (共感力と心理的安全性) zarurligini uqtiradi.",
    tipUzbek: "Xulosa savolida o'zgarish yo'nalishini (IQ dan EQ ga) aniqlang.",
  },
  {
    id: 71,
    level: 'N2',
    type: 'point',
    titleUz: 'Mahalliy turizmni rivojlantirish',
    script:
      '自治体の 観光課で 職員二人が 施策について 話しています。二人が 今年度 最優先で 取り組むべきと 合意した 内容は 何ですか？\n男性：外国人観光客を 誘致するために、多言語看板の 増設を 進めるべきでしょうか。\n女性：うーん、看板も 大切ですが、アンケートを 見ると「Wi-Fi環境が 脆弱」「キャッシュレス決済が 使えない」という 声が 圧倒的ですよ。\n男性：なるほど。利便性が 低くては、いくら 訪れても 消費が 伸びませんね。\n女性：ええ。まずは 店舗への デジタル決済端末の 導入補助を 最優先に すべきです。\n男性：異議なしです。その 方針で 予算案を 組みましょう。',
    questionText: '二人が 今年度 最優先で 取り組むべきと 合意した 内容は 何ですか？',
    questionTextUz: 'Ular ushbu yilda birinchi navbatda nima ish qilishga kelishib olishdi?',
    options: [
      '多言語の 案内看板を 各所に 増設すること',
      '店舗への キャッシュレス決済端末の 導入補助を 行うこと',
      '新しい ホテルを 建設すること',
      '観光バスの 運行数を 増やすこと',
    ],
    optionsUz: [
      "Ko'p tilli ko'rsatkich belgilarini ko'paytirish",
      "Do'konlarga naqdsiz to'lov terminallarini o'rnatishga subsidiya berish",
      'Yangi mehmonxona qurish',
      "Turistik avtobuslar sonini ko'paytirish",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Ayol ko'rsatkichlardan ko'ra do'konlarda naqdsiz to'lov (キャッシュレス決済) qulayligini ta'minlashni taklif qiladi va erkak bunga '異議なし' (e'tiroz yo'q, to'liq roziman) deb kelishadi.",
    tipUzbek: "'まずは〜を最優先にすべき' va unga bildirilgan yakuniy rozilikka tayaning.",
  },
  {
    id: 72,
    level: 'N2',
    type: 'task',
    titleUz: "Xatolik to'g'risida hisobot berish",
    script:
      'IT企業で プロジェクトマネージャーと エンジニアが 話しています。エンジニアの 女性は この後 直ちに 何を しますか？\nPM：本番サーバーで データベースの 接続エラーが 発生しているようだ。\n女性：はい、先ほど リリースした 新機能の パッチが 原因と 思われます。\nPM：顧客への 影響を 最小限に 抑えたい。新機能の 改修は 後回しにして、まずは 直前の 安定バージョンに システムを 切り戻してくれ。\n女性：ロールバックですね。承知いたしました。直ちに 実行します。\nPM：頼む。完了したら 顧客サポートチームに 一報を 入れてくれ。',
    questionText: 'エンジニアの 女性は この後 直ちに 何を しますか？',
    questionTextUz: 'Muhandis ayol bundan keyin darhol nima qiladi?',
    options: [
      '新機能の バグを 修正する コードを 書く',
      '直前の 安定バージョンへ システムを ロールバック（切り戻し）する',
      '顧客サポートチームに メールを 送る',
      '新しい サーバーを 購入する',
    ],
    optionsUz: [
      'Yangi funksiyadagi xatoni tuzatish kodini yozadi',
      'Tizimni avvalgi barqaror versiyaga qaytaradi (rollback)',
      "Mijozlarni qo'llab-quvvatlash bo'limiga xat yuboradi",
      'Yangi server sotib oladi',
    ],
    correctAnswer: 1,
    explanationUzbek:
      'Rahbar yangi funksiyani tuzatishni keyinga qoldirib, avval tizimni avvalgi holiga qaytarishni (直前の安定バージョンに切り戻してくれ - rollback) talab qiladi.',
    tipUzbek: "'まずは〜してくれ' (avval buni qil) degan buyruqqa diqqat qiling.",
  },
  {
    id: 73,
    level: 'N2',
    type: 'quick',
    titleUz: 'Ishdagi yordam uchun xushmuomala taklif',
    script: '男：もし よろしければ、こちらの 資料作成、私に お手伝いさせていただけませんか？',
    questionText: '質問を聞いて、何と答えますか？',
    questionTextUz: "Qanday javob berish to'g'ri?",
    options: [
      '本当ですか？お忙しいのに 恐縮です、ぜひ お願いします。',
      'いいえ、手伝わせません。',
      '私が 手伝いましょうか？',
      '資料は もう 捨てました。',
    ],
    optionsUz: [
      "Rostdanmi? O'zingiz band bo'lsangiz ham xijolatdaman, iltimos yordam berib yuboring.",
      "Yo'q, yordam berishga ruxsat bermayman.",
      'Men yordam beraymi?',
      'Materiallarni allaqachon tashlab yubordim.',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Birov yordam taklif qilganda minnatdorlik va muloyim xijolat bilan qabul qilish: '本当ですか？お忙しいのに恐縮です、ぜひお願いします'.",
    tipUzbek: "Yordamni qabul qilishda 'お忙しいのに恐縮です' keigo iborasi juda keng tarqalgan.",
  },
  {
    id: 74,
    level: 'N2',
    type: 'summary',
    titleUz: "Eko-qadoqlash va iste'molchi xulq-atvori",
    script:
      'マーケティングの セミナーで 講師が 話しています。\n講師：脱プラスチックを 掲げ、紙製パッケージへの 転換を 進める メーカーが 急増しています。しかし、単に 素材を 環境配慮型に 変えるだけでは、消費者の 購買行動には つながりません。商品の 鮮度保持や 開けやすさといった 実用的な 利便性を 損なわないこと、そして 環境価値が 価格に見合っていると 納得してもらう コミュニケーションが 不可欠です。',
    questionText: '環境配慮型パッケージの 成功に 不可欠な 要素は 何ですか？',
    questionTextUz: 'Ekologik qadoqlashning muvaffaqiyati uchun zaruriy omil nima?',
    options: [
      'すべての 商品の 値段を 2倍に 引き上げること',
      '環境価値だけでなく、実用的な 利便性と 価格に対する 納得感を 両立させること',
      'デザインを すべて 白黒に 統一すること',
      '海外からの 輸入を 一切 停止すること',
    ],
    optionsUz: [
      'Barcha tovarlar narxini 2 barobarga oshirish',
      "Faqat ekologiya emas, balki qulaylik va munosib narx uyg'unligini ta'minlash",
      "Dizaynni butunlay oq-qora rangga o'tkazish",
      "Chet eldan import qilishni to'xtatish",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Faqat ekologik material ishlatish yetarli emas, foydalanishdagi qulaylik va xaridorgir narx uyg'unligi (利便性と納得感の両立) muhimdir.",
    tipUzbek: "'単に〜だけでは不十分で、〜が不可欠です' qolipiga tayaning.",
  },
  {
    id: 75,
    level: 'N2',
    type: 'point',
    titleUz: "Kitob do'koni strategiyasi",
    script:
      'ラジオで 書店の 店長が インタビューに 答えています。\n店長：電子書籍や ネット書店の 普及により、町の 書店は 厳しい 局面に あります。そこで 当店では、単に 本を 並べるのではなく、「専門書に 特化した 選書」と「読書カフェの 併設」という 空間価値の 提供に 舵を切りました。実際に 手に取って 吟味し、じっくり 対話できる 場として、遠方からも お客様が 訪れるようになっています。',
    questionText: 'この 書店が 顧客を 引きつけている 最大の 工夫は 何ですか？',
    questionTextUz: "Ushbu kitob do'koni mijozlarni jalb qilish uchun nima qildi?",
    options: [
      'すべての 本を 定価の 半額で セールしたこと',
      '電子書籍の ダウンロード販売のみに 切り替えたこと',
      '独自の 選書と カフェ併設による「体験空間の 価値」を 提供したこと',
      '漫画だけを 専門に 扱うようにしたこと',
    ],
    optionsUz: [
      'Barcha kitoblarni yarim narxda sotgani',
      "Faqat elektron kitob sotishga o'tgani",
      "Noyob saralash va qahvaxona uyg'unligidagi tajriba maskanini yaratgani",
      'Faqat manga sotishga ixtisoslashgani',
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Do'kon shunchaki kitob sotmay, maxsus saralangan kitoblar va kofe ichish maydoni (空間価値の提供) orqali odamlarni o'ziga jalb qilgan.",
    tipUzbek: "'〜ではなく、〜に舵を切りました' orqali yangi yechimni aniqlang.",
  },
  {
    id: 76,
    level: 'N2',
    type: 'quick',
    titleUz: "Hamkasbning kechikishi bo'yicha bildirishnoma",
    script:
      '男：鈴木先輩、先ほど 営業課の 木村様から、事故渋滞で 会議に 15分ほど 遅れるとの ご連絡が ありました。',
    questionText: '先輩は 何と 答えますか？',
    questionTextUz: 'Katta xodim qanday javob qaytaradi?',
    options: [
      '分かった。じゃあ、他の アジェンダから 先に 始めよう。',
      'なぜ 木村さんが 会議に 出席するんだい？',
      '遅れるのは 許されないから 帰ってもらおう。',
      '事故に 遭ったなら 警察に 電話しよう。',
    ],
    optionsUz: [
      'Tushunarli. Unda boshqa masalalarni muhokama qilishdan boshlab turamiz.',
      'Nega Kimura majlisga qatnashishi kerak?',
      'Kechikish kechirilmaydi, ketaversin.',
      "Avariya bo'lgan bo'lsa politsiyaga qo'ng'iroq qilaylik.",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Mijoz yoki hamkasb tirbandlik sababli 15 daqiqa kechikishini bilgach, 'Tushunarli, unda boshqa masalalardan boshlab turamiz' (他のアジェンダから先に始めよう) deb ishni rejalashtirish eng o'rinlidir.",
    tipUzbek:
      "Biznes vaziyatida kechikish xabariga ishni to'xtatmasdan moslashuvchan javob beriladi.",
  },
  {
    id: 77,
    level: 'N1',
    type: 'task',
    audioUrl: '/audio/choukai/n1/n1_track_77.mp3',
    titleUz: 'Inqiroz boshqaruvi va matbuot bayonoti',
    script:
      '広報部の 緊急会議で 部長と 担当者が 話しています。担当の 男性は この後 まず 何を しますか？\n部長：わが社の クラウドサービスにおける 個人情報流出の 疑いについて、SNS上で 憶測が 飛び交っている。午後3時に 記者会見を 開く。\n男性：はい。流出の 痕跡について、セキュリティ調査会社からの 正式な 報告書は まだ 届いておりません。\n部長：未確認の 情報を 出して 混乱を 招くことは 厳に 慎むべきだ。まずは 現時点で 判明している 客観的 事実のみを 整理し、メディア向けの プレスリリース原稿を 1時間以内に 骨子として まとめなさい。\n男性：承知いたしました。直ちに 着手します。',
    questionText: '担当の 男性は この後 まず 何を しますか？',
    questionTextUz: "Mas'ul erkak bundan keyin dastlab nima qiladi?",
    options: [
      'SNSの アカウントを 削除する',
      '判明している 事実のみを 整理し、プレスリリースの 骨子を 作成する',
      'セキュリティ調査会社に 怒りの 電話を かける',
      '記者会見を 中止する',
    ],
    optionsUz: [
      "Ijtimoiy tarmoq profilini o'chiradi",
      "Ma'lum bo'lgan faktlarni tartibga solib, press-reliz loyihasini tuzadi",
      "Xavfsizlik kompaniyasiga g'azab bilan qo'ng'iroq qiladi",
      'Matbuot anjumanini bekor qiladi',
    ],
    correctAnswer: 1,
    explanationUzbek:
      'Rahbar hozircha tasdiqlangan faktlarni umumlashtirib, matbuot xabarnomasi loyihasini 1 soat ichida tayyorlashni buyuradi (プレスリリース原稿をまとめなさい).',
    tipUzbek: "Krizis menejmenti kontekstida '客観的事実の整理' har doim birlamchi amal bo'ladi.",
  },
  {
    id: 78,
    level: 'N1',
    type: 'point',
    audioUrl: '/audio/choukai/n1/n1_track_78.mp3',
    titleUz: 'Fanning etik chegaralari',
    script:
      '生命倫理の シンポジウムで 哲学者が 話しています。\n哲学者：ゲノム編集による 難病治療への 期待が高まる一方で、優生思想への 回帰という 倫理的 危険性が 孕まれています。「技術的に 可能であること」と「倫理的に 許容されること」は 峻別されねばなりません。科学者の 好奇心や 経済的 利益のみに 開発の 暴走を 委ねるのではなく、民主的な 市民対話を 通じた 規範の 策定が 強く 求められているのです。',
    questionText: '哲学者が 最も 懸念している 点は 何ですか？',
    questionTextUz: "Faylasuf eng ko'p nimadan xavotirlanmoqda?",
    options: [
      '遺伝子治療の 開発費用が 安すぎること',
      '技術の 暴走により、倫理的 規範を 欠いた 優生思想へ 回帰すること',
      '科学者の 給与が 削減されること',
      '市民が 科学に 無関心であること',
    ],
    optionsUz: [
      "Gen davolash xarajatlari o'ta arzonligi",
      'Texnologiyaning haddan oshib, axloqsiz evgenikaga qaytishi',
      'Olimlarning maoshi qisqarishi',
      'Aholining fanga befarqligi',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Faylasuf fanning axloqiy me'yorlardan chiqib, insonlarni saralash (yevgenika) xavfiga olib kelishidan ogohlantirmoqda.",
    tipUzbek: "'〜という倫理的危険性が孕まれています' jumlasidagi xavfni ilg'ab oling.",
  },
  {
    id: 79,
    level: 'N1',
    type: 'quick',
    audioUrl: '/audio/choukai/n1/n1_track_79.mp3',
    titleUz: 'Oliy martabali mehmonga muloyim taklif',
    script:
      '女性：会長、本日の 懇親会では、乾杯の ご発声を 賜りたく 存じますが、いかがでしょうか。',
    questionText: '会長は 何と 答えますか？',
    questionTextUz: 'Boshqaruv kengashi raisi qanday javob qaytaradi?',
    options: [
      '私で よければ、喜んで お引き受けいたしましょう。',
      '乾杯なんて 飲みたくありません。',
      'あなた自身が 乾杯しなさい。',
      'ごちそうさまでした。',
    ],
    optionsUz: [
      "Mening so'zim ma'qul bo'lsa, bajonidil qabul qilaman.",
      "Qadah so'zini aytishni istamayman.",
      "O'zingiz qadah so'zi ayting.",
      "Rahmat, to'ydim.",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Oliy martabali rahbarga qadah so'zi aytishni iltimos qilganda (ご発声を賜りたく存じます), '私でよければ、喜んでお引き受けいたしましょう' deb javob berish yapon korporativ madaniyatiga mos keladi.",
    tipUzbek: "'〜賜りたく存じます' oliy darajadagi rasmiy iltimos hisoblanadi.",
  },
  {
    id: 80,
    level: 'N1',
    type: 'summary',
    audioUrl: '/audio/choukai/n1/n1_track_80.mp3',
    titleUz: "Modernistik arxitektura va mahalliy o'ziga xoslik",
    script:
      '建築批評の フォーラムで 専門家が 講演しています。\n専門家：20世紀の モダニズム建築は、鉄と ガラスという 均質な 素材を用いて、世界中どこにでも 建てられる「国際様式」を 確立しました。しかし、それは 風土や 地域の 歴史的 固有性を 剥奪する 結果を 招きました。21世紀の 建築に 課されているのは、地域の 自然素材や 伝統工法を 現代技術と 融合させ、その 土地にしか 成立し得ない「固有の 建築美」を 再構築することなのです。',
    questionText: '講演者が 提唱する「21世紀の 建築」の あり方は どれですか？',
    questionTextUz: "Notiq ilgari surayotgan XXI asr arxitekturasi qanday bo'lishi lozim?",
    options: [
      '世界中どこでも 同じ ガラス張りの 高層ビルを 乱立させること',
      '地域の 風土や 伝統工法と 現代技術を 融合し、固有の 建築美を 創出すること',
      'コンクリートの 使用を 法律で 完全に 禁じること',
      '過去の 建築理論を すべて 破棄すること',
    ],
    optionsUz: [
      'Butun dunyoda bir xil oynavand binolarni qurish',
      "Mahalliy an'ana va zamonaviy texnologiyani uyg'unlashtirib, betakror me'moriy go'zallik yaratish",
      'Betondan foydalanishni butunlay man qilish',
      "O'tmishdagi arxitektura nazariyalaridan butunlay voz kechish",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Mutaxassis modernizmning bir xilligini tanqid qilib, an'anaviy mahalliy materiallar va zamonaviy texnologiyalarni birlashtirish (地域の風土と現代技術の融合) zarurligini aytadi.",
    tipUzbek: "'〜融合させ、固有の建築美を再構築すること' jumlasi xulosadir.",
  },
  {
    id: 81,
    level: 'N1',
    type: 'point',
    titleUz: "Iqtisodiy tahlil: iste'mol xulqi",
    script:
      '経済アナリストが 消費動向について 解説しています。\nアナリスト：物価高騰が 続く中、消費者の 購買心理は 二極化しています。日常の 消耗品については、徹底して 低価格な プライベートブランドを 選ぶ 一方で、趣味や 推し活といった「自己実現」に 関わる 分野には、価格を 厭わずに 惜しみなく 投資する 傾向が 顕著です。単なる 節約志向ではなく、自己の 価値基準に 照らした「選択と 集中」が 進んでいると言えます。',
    questionText: 'アナリストによれば、現代の 消費者の 購買行動には どのような 特徴が ありますか？',
    questionTextUz: "Tahlilchiga ko'ra bugungi iste'molchilar xulq-atvori qanday xususiyatga ega?",
    options: [
      'あらゆる 商品の 購入を 完全に 控えている',
      '日常品は 徹底して 節約するが、自己実現や 趣味には 惜しみなく 支出する「二極化」',
      '高級ブランド品だけを 買い集めている',
      '物価高の 影響を まったく 受けていない',
    ],
    optionsUz: [
      'Har qanday tovarni sotib olishdan butunlay tiyilmoqda',
      "Kundalik ehtiyojlarni qattiq tejab, o'zini qiziqtirgan sevimli mashg'ulotlarga saxiylik bilan sarflaydigan qutblashuv",
      'Faqat qimmatbaho brend mahsulotlarini xarid qilmoqda',
      "Narx-navo oshishining hech qanday ta'siri sezilmayapti",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Iste'molchilar mayda narsalarni tejab, o'ziga yoqqan sohalarga pulni ayamay sarflaydigan 'tanlov va jamlanish' (選択と集中 / 二極化) yo'lini tutmoqda.",
    tipUzbek: "'一方で〜傾向が顕著です' qiyoslashiga quloq soling.",
  },
  {
    id: 82,
    level: 'N1',
    type: 'task',
    titleUz: 'Kompaniyadagi diplomatik muzokara',
    script:
      '経営企画室で 役員二人が 海外企業との 提携交渉について 話しています。男性役員は 次に 何を しますか？\n女性役員：相手方の CEOから、合弁会社の 出資比率を 51対49で 主導権を 握りたいとの 要請が ありました。\n男性役員：こちらが 開発した コア技術を 提供する以上、経営権を 相手に 握られるのは 到底 容認できませんね。\n女性役員：ええ。ただ、交渉を 決裂させるわけには いきません。技術提携の 範囲を 限定するか、拒否権条項を 盛り込むか、対案を 提示すべきです。\n男性役員：分かりました。顧問弁護士と 協議し、技術防衛と 提携成立を 両立させる 契約書の 修正条項案を 起草しましょう。',
    questionText: '男性役員は 次に 何を しますか？',
    questionTextUz: 'Erkak rahbar bundan keyin nima ish qiladi?',
    options: [
      '相手方の CEOの 要求を 無条件で 承諾する',
      '提携交渉を 即座に 白紙撤回する',
      '顧問弁護士と 協議し、契約書の 修正条項案を 起草する',
      '出資比率を 100対0に 変更する',
    ],
    optionsUz: [
      "Raqib rahbarining talabini so'zsiz qabul qiladi",
      "Muzokaralarni butunlay to'xtatadi",
      "Kompaniya yuristi bilan maslahatlashib, shartnomaga o'zgartirish loyihasini tuzadi",
      "Ulish nisbatini 100 ga 0 qilib o'zgartiradi",
    ],
    correctAnswer: 2,
    explanationUzbek:
      "Erkak rahbar yurist (顧問弁護士) bilan maslahatlashib, texnologiyani himoya qiluvchi yangi shartnoma bandlarini tayyorlashni o'z zimmasiga oladi.",
    tipUzbek: "'顧問弁護士と協議し、〜起草しましょう' gapi to'g'ri javob kalitidir.",
  },
  {
    id: 83,
    level: 'N1',
    type: 'quick',
    audioUrl: '/audio/choukai/n1/n1_track_83.mp3',
    titleUz: 'Diplomatik taklifni qabul qilish',
    script:
      '男性：長年の 懸案でありました 両社の 共同開発プロジェクト、何卒 前向きな ご決断を 仰ぎたく 存じます。',
    questionText: '質問を聞いて、何と答えますか？',
    questionTextUz: 'Qanday javob berish munosib?',
    options: [
      '貴社の 誠意ある ご提案、重く 受け止め、前向きに 検討させていただきます。',
      '決断なんて できませんよ。',
      'あなたが 決めてください。',
      'もう 終わった話です。',
    ],
    optionsUz: [
      "Sizlarning samimiy taklifingizni chuqur qadrlagan holda, ijobiy tomondan ko'rib chiqamiz.",
      'Hech qanday qaror qabul qila olmayman.',
      "O'zingiz hal qiling.",
      'Bu eski gap-ku.',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "N1 biznes muzokarasida rasmiy taklifga javoban '貴社の誠意あるご提案、重く受け止め、前向きに検討させていただきます' (Sizning taklifingizni jiddiy qabul qilib, ijobiy ko'rib chiqamiz) deyiladi.",
    tipUzbek: "N1 rasmiy keigo dialoglarida '前向きに検討させていただきます' qolipi standartdir.",
  },
  {
    id: 84,
    level: 'N1',
    type: 'summary',
    audioUrl: '/audio/choukai/n1/n1_track_84.mp3',
    titleUz: 'Til va dunyoqarash',
    script:
      '文化人類学の シンポジウムで 教授が 講演しています。\n教授：サピア・ウォーフの 仮説が 示唆するように、言語は 単に 思考を 表出する 道具にとどまらず、我々が 世界を どのように 分節し 認識するかという「認知の 枠組み」そのものを 規定しています。ある言語が 固有の 虹の 色数を 持つように、語彙体系の 差異は 世界認識の 差異に 直結します。言語の 多様性を 保持することは、人類の 知の 多角性を 担保することに他ならないのです。',
    questionText: '教授の 講演の 主旨として 最も 適切なものは どれですか？',
    questionTextUz: "Professor ma'ruzasining asosiy maqsadi nima?",
    options: [
      '言語は 思考を 伝えるための 単なる 記号にすぎない',
      '言語は 認知の 枠組みそのものを 規定しており、言語の 多様性は 人類の 知の 豊かさである',
      'すべての 言語を 人工言語に 統一すべきである',
      '虹の色は 物理的に 3色しかない',
    ],
    optionsUz: [
      'Til fikrni yetkazish uchun oddiy belgilardir xolos',
      'Til idrok doirasini belgilaydi va tilning xilma-xilligi insoniyat tafakkurining boyligidir',
      "Barcha tillarni yagona sun'iy tilga birlashtirish lozim",
      "Kamalak aslida bor-yo'g'i 3 rangdan iborat",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Professor til insonning dunyoni qanday qabul qilishini belgilab berishi va til xilma-xilligi insoniyat boyligi ekanligini ta'kidlamoqda.",
    tipUzbek:
      "Xulosa savollarida umumiy falsafiy xulosaga (言語の多様性を保持することは〜に他ならない) e'tibor bering.",
  },
  {
    id: 85,
    level: 'N1',
    type: 'point',
    audioUrl: '/audio/choukai/n1/n1_track_85.mp3',
    titleUz: "Sun'iy intellekt va san'at asari muallifligi",
    script:
      '知的財産権の 専門家が AI生成コンテンツの 著作権について 話しています。\n専門家：AIが 自律的に 生成した 画像や 音楽について、現行の 著作権法では「思想又は感情を 創作的に 表現した もの」という 人間の 精神的 営為を 前提としており、AI単独の 創作物に 著作権を 認めることは 困難です。争点となっているのは、プロンプトの 工夫や パラメータの 調整に どの程度の「人間の 創作的 寄与」が 認められるかという 境界線の 画定なのです。',
    questionText: 'AI生成物の 著作権を 巡る 最大の 争点は 何ですか？',
    questionTextUz:
      'AI yaratgan ijodiy mahsulotlar mualliflik huquqidagi eng asosiy bahsli nuqta nima?',
    options: [
      'AIの 開発企業の 株価が 変動すること',
      '人間の 創作的な 寄与が どの程度 介在しているかという 境界線',
      'パソコンの 電気料金を 誰が 支払うか',
      'AIが 絵の具を 使えるかどうか',
    ],
    optionsUz: [
      "AI kompaniyalarining aksiya narxlari o'zgarishi",
      'Insonning ijodiy hissasi qaysi darajada mavjudligi haqidagi chegara',
      "Kompyuter elektr to'lovini kim to'lashi",
      "AI bo'yoqlardan foydalana olish-olmasligi",
    ],
    correctAnswer: 1,
    explanationUzbek:
      'Eng asosiy bahs — AI ga buyruq berishda insonning ijodiy hissasi (人間の創作的寄与) qanchalik darajada ekanligi chegarasini aniqlashdir.',
    tipUzbek:
      "'争点となっているのは、〜という境界線の画定なのです' jumlasi to'g'ri javobni ko'rsatadi.",
  },
  {
    id: 86,
    level: 'N1',
    type: 'quick',
    titleUz: 'Diplomatik uchrashuvdagi rasmiy kutib olish',
    script:
      '男性：本日は ご多忙の折、遠方より 弊社の 設立記念式典に ご臨席賜り、身に余る 光栄に 存じます。',
    questionText: '質問を聞いて、何と答えますか？',
    questionTextUz: "Qanday javob berish to'g'ri?",
    options: [
      '記念すべき 佳き日に お招きいただき、心より 御礼申し上げます。貴社の 益々の ご発展を お祈り申し上げます。',
      'はい、遠くて とても 疲れました。',
      '設立なんて 大したことありませんね。',
      'もう すぐ 帰ります。',
    ],
    optionsUz: [
      "Ushbu qutlug' tantanali kunga taklif etganingiz uchun samimiy minnatdorlik bildiraman. Kompaniyangizga ulkan ravnaq tilayman.",
      "Ha, yo'l juda uzoq ekan, charchab ketdim.",
      "Tashkil etilganiga ko'p bo'lmabdi-ku.",
      'Tez orada qaytaman.',
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Tantanali yubiley marosimidagi rasmiy qutlovga '記念すべき佳き日にお招きいただき、心より御礼申し上げます。貴社の益々のご発展をお祈り申し上げます' deb javob qaytarish N1 rasmiy etiketining oliy ko'rinishidir.",
    tipUzbek: "Oliy rasmiy tabriklarga javoban qutlov va tilak bildirish to'g'ri variantdir.",
  },
  {
    id: 87,
    level: 'N2',
    type: 'task',
    titleUz: 'Kompaniya mahsulot taqdimotiga tayyorgarlik',
    script:
      'オフィスで課長と女性社員が、来週の取引先へのプレゼンについて話しています。女性社員はこの後、まず何をしなければなりませんか？\n女：課長、来週の新規エコ素材の企画提案書、一通り出来上がりましたのでご確認いただけますか。\n男：うん、全体の構成はすごく論理的でいいね。ただ、競合他社との価格比較データの部分が少し前年度の古い数字のままになっているみたいだ。\n女：あ、申し訳ありません。最新の市場調査レポートの数値を反映させるのを忘れていました。\n男：そうだね。あと、プレゼンの導入部分のスライド順序も少し変えたいけど、それはデータが揃ってからでいいよ。まずはその最新の市場価格データを更新して差し替えてくれるかい？デザインのブラッシュアップはその後で一緒に見よう。\n女：承知いたしました。すぐに最新レポートを確認して修正いたします。',
    questionText: '女性社員はこの後、まず何をしなければなりませんか？',
    questionTextUz: "Ayol xodim bundan so'ng eng birinchi nima qilishi kerak?",
    options: [
      'プレゼンの導入部分のスライド順序を変更する',
      '最新の市場価格データを更新して資料を差し替える',
      'スライド全体のデザインをブラッシュアップする',
      '取引先に古い提案書をメールで送信する',
    ],
    optionsUz: [
      "Taqdimotning kirish qismidagi slaydlar ketma-ketligini o'zgartirish",
      "Eng so'nggi bozor narxlari ma'lumotlarini yangilab, materialni almashtirish",
      'Slaydlarning umumiy dizaynini takomillashtirish',
      'Mijozga eski loyiha taklifini elektron pochta orqali yuborish',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Bo'lim boshlig'i (課長) taqdimot slaydlarining tartibini o'zgartirish va dizaynni ko'rib chiqish keyinroqqa qoldirilishini, lekin avvalo eng so'nggi bozor narxlari ma'lumotlarini yangilab qo'yish kerakligini (まずはその最新の市場価格データを更新して差し替えてくれるかい) aytdi. Shuning uchun ayol xodim eng birinchi bo'lib ma'lumotlarni yangilashi lozim.",
    tipUzbek:
      "JLPT N2 課題理解 savollarida 'まず' (avvalo) so'zi kalit hisoblanadi. Boshliq 'それはデータが揃ってからでいい' deb boshqa ishlarni kechiktirdi va 'まずは〜' orqali birinchi vazifani belgilab berdi.",
  },
  {
    id: 88,
    level: 'N2',
    type: 'point',
    titleUz: "Ekologik qadoq va iste'molchilar xulq-atvori",
    script:
      'テレビでアナウンサーが、食品メーカーの環境対策について専門家にインタビューしています。消費者がやや割高なエコ包装商品を選ぶ最大の理由は何ですか？\nアナウンサー：最近、脱プラスチックを目指して紙製や生分解性プラスチックの包装を採用する企業が増えていますね。一般的にコストが1割ほど高くなるそうですが、売れ行きは好調だと伺いました。\n専門家：ええ。以前は「環境に良くても高いなら買わない」という意見が主流でしたが、最近の調査では意識が大きく変化しています。特に若い世代やファミリー層を中心に、「日々の買い物を通じて環境保護に貢献している」という実感や満足感が得られることが、購入を後押しする決定打となっているのです。もちろんパッケージの見た目のナチュラルさや企業イメージへの共感もありますが、自己肯定感や社会的責任を果たしているという納得感が一番の購買動機ですね。',
    questionText: '消費者がやや割高なエコ包装商品を選ぶ最大の理由は何ですか？',
    questionTextUz:
      "Iste'molchilarning narxi biroz qimmatroq bo'lgan eko-qadoqli mahsulotlarni tanlashining eng asosiy sababi nima?",
    options: [
      '商品の賞味期限が通常より大幅に伸びるから',
      '買い物を楽しむことで環境保護に貢献している実感が得られるから',
      'パッケージを回収に出すとお金がキャッシュバックされるから',
      'プラスチック包装よりも重くて頑丈だから',
    ],
    optionsUz: [
      'Mahsulotning yaroqlilik muddati odatdagidan sezilarli darajada uzaygani uchun',
      "Xarid orqali atrof-muhitni asrashga hissa qo'shayotganlik hissi va qoniqish olingani uchun",
      'Qadoqni qaytarib topshirganda pul qaytarib berilgani uchun',
      'Plastik qadoqqa qaraganda og‘irroq va mustahkamroq bo‘lgani uchun',
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Mutaxassis (専門家) iste'molchilar nima uchun 10% qimmatroq eko-qadoqni sotib olayotganini tushuntirar ekan, asosiy sabab — 'kundalik xarid orqali atrof-muhitni asrashga hissa qo'shayotganlik hissi va qoniqish olish' (環境保護に貢献しているという実感や満足感が得られること) hamda burchini bajarganlik hissi ekanligini ta'kidladi.",
    tipUzbek:
      "Nuqtai nazar savollarida (ポイント理解) ekspertning '決定打となっている' (hal qiluvchi omil bo'lmoqda) va '一番の購買動機' (eng asosiy sotib olish motivi) degan yakuniy urg'uli jumlalariga diqqat qarating.",
  },
  {
    id: 89,
    level: 'N1',
    type: 'task',
    titleUz: 'Kiberxavfsizlik insidenti va inqirozli boshqaruv',
    script:
      'IT企業の緊急危機管理対策本部で、役員とセキュリティ担当チーフが話しています。担当チーフはこの後、公表前にまず何に着手しなければなりませんか？\n役員：先ほど検知されたクラウド基盤への不正アクセスインシデントの件だが、顧客情報の漏洩懸念について報道関係へのブリーフィングをどう進めるべきか。\nチーフ：はい。現時点で侵入経路となった脆弱性のパッチ適用と外部ネットワークからの当該サーバの隔離は完了しております。速やかなプレスリリースが求められますが、影響範囲の特定、すなわちどのデータが持ち出された痕跡があるかのログフォレンジック解析を完了させ、被害実態を確定させることが最優先です。\n役員：被害規模の数字が曖昧なまま会見を開けば、市場の不信感を招くからね。\nチーフ：おっしゃる通りです。再発防止策の策定や被害顧客への個別補償の検討も並行して進めますが、まずは詳細なログ解析による漏洩実態の特定を完遂させ、その確証を報告書にまとめます。\n役員：分かった。急ぎ取りかかってくれたまえ。',
    questionText: '担当チーフはこの後、公表前にまず何に着手しなければなりませんか？',
    questionTextUz:
      "Xavfsizlik bo'yicha bosh mutaxassis bundan so'ng, rasmiy e'lon qilishdan oldin eng birinchi nimaga kirishishi kerak?",
    options: [
      '当該サーバを外部ネットワークから直ちに隔離する',
      '詳細なログ解析を行って情報漏洩の被害実態を特定する',
      '被害に遭った全顧客への損害賠償金の送金手続きを行う',
      '影響範囲が未確定のまま直ちに記者会見を開く',
    ],
    optionsUz: [
      'Tegishli serverni zudlik bilan tashqi tarmoqdan uzib ajratish',
      "Batafsil log-tahlil (forensika) o'tkazib, ma'lumotlar sizib chiqishi ko'lamini aniqlash",
      "Zarar ko'rgan barcha mijozlarga tovon pulini o'tkazib berish amaliyotini boshlash",
      "Zarar ko'lami noaniq bo'lgan holda zudlik bilan matbuot anjumani o'tkazish",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Serverni ajratish va zaiflikni tuzatish allaqachon bajarilgan (完了しております). Matbuotga e'lon qilishdan oldin, eng birinchi navbatda batafsil log tahlili orqali qanday ma'lumotlar chiqib ketganini aniqlash (ログフォレンジック解析を完了させ、被害実態を確定させることが最優先 / まずは詳細なログ解析による漏洩実態の特定を完遂させ) lozimligi aytildi.",
    tipUzbek:
      "JLPT N1 da allaqachon tugallangan ishlarni (完了しております) chalg'ituvchi variant sifatida berishadi. Bajarilishi kerak bo'lgan birinchi ish '最優先' va 'まずは〜' orqali berilgan log tahlilidir.",
  },
  {
    id: 90,
    level: 'N1',
    type: 'summary',
    titleUz: 'Hududiy qayta tiklanish va aholi migratsiyasi falsafasi',
    script:
      '地域経済学のシンポジウムで、大学教授が過疎地域の再生政策について基調講演を行っています。\n教授：従来の過疎対策は、工場誘致や大規模公共事業など、都市部の資本に依存した「外部活力の注入」が中心でした。しかし人口減少社会が本格化する中で、そうした画一的な振興策はもはや持続可能ではありません。真の地域創生とは、単に転入者数を競う頭数主義ではなく、その土地固有の自然資源や文化的土着性に根ざした「関係人口」の創出にあります。定住に固執せず、複業やリモートワークを通じて地域と重層的に関わり続ける人々を育むこと、すなわち自律分散的なコミュニティの生態系を再構築することこそが、今後の地方再生の根幹をなす理念なのです。',
    questionText: '教授の講演の主旨として最も適切なものはどれですか？',
    questionTextUz: "Professor ma'ruzasining asosiy g'oyasi sifatida eng to'g'ri fikr qaysi?",
    options: [
      '工場の誘致と大型公共事業をさらに拡大して外部資本を呼び込むべきだ',
      '定住者数の増加のみに固執せず、地域と多層的に関わる関係人口と自律的生態系を育むべきだ',
      '過疎地域は再生不可能であるため、全住民を大都市に集約移転させるべきだ',
      'リモートワークを禁止して全員を現地の農業に専従させるべきだ',
    ],
    optionsUz: [
      'Zavodlarni jalb qilish va yirik jamoat loyihalarini kengaytirish orqali tashqi sarmoyani kiritish kerak',
      "Faqat doimiy ko'chib keluvchilar soniga bog'lanib qolmasdan, hudud bilan ko'p qatlamli bog'langan 'aloqador aholi' va o'zini-o'zi boshqaruvchi ekotizimni rivojlantirish lozim",
      "Aholisi siyraklashgan hududlarni tiklab bo'lmaydi, shuning uchun barcha aholini megapolislarga ko'chirish shart",
      "Masofaviy ishni taqiqlab, hamma fuqarolarni mahalliy qishloq xo'jaligiga jalb etish lozim",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Professor an'anaviy zavod qurish yoki faqat doimiy ko'chib keluvchilar soni ortidan quvish davri o'tganini, kelajakdagi haqiqiy mintaqaviy tiklanish — bu hudud bilan ko'p tomonlama bog'langan 'aloqador aholi' (関係人口) va o'zini o'zi ta'minlovchi jamoaviy ekotizimni shakllantirishda ekanligini (自律分散的なコミュニティの生態系を再構築することこそが〜根幹をなす理念) tushuntirdi.",
    tipUzbek:
      "N1 Gist (概要理解) savollarida ma'ruzachining an'anaviy yondashuvni inkor qilib (もはや持続可能ではない), '真の〜とは' yoki '〜ことこそが根幹をなす理念' deb yakunlagan konseptual xulosasi to'g'ri javob kalitidir.",
  },
  {
    id: 91,
    level: 'N1',
    type: 'quick',
    titleUz: 'Biznesda taklifni xushmuomalalik bilan rad etish (Keigo)',
    script:
      '男性：先般ご提案申し上げました新規共同プロジェクトの件、前向きにご検討いただけておりますでしょうか。',
    questionText: '質問を聞いて、何と答えますか？',
    questionTextUz: "Qanday javob berish to'g'ri?",
    options: [
      '大変魅力的なお話ではございますが、諸般の事情により今回は見送らせていただきたく存じます。',
      'はい、検討する価値もありませんのでお引き取りください。',
      '前向きに検討しないことになっていますので、困惑しております。',
      'せっかくのご提案ですが、二度と連絡してこないでいただけますか。',
    ],
    optionsUz: [
      "Juda qiziqarli taklif bo'lishiga qaramay, turli holatlar sababli bu safar uni qabul qilmaslikni (rad etishni) ma'qul ko'rdik.",
      "Ha, ko'rib chiqishga ham arzimaydi, shuning uchun ketishingiz mumkin.",
      "Ijobiy ko'rib chiqmaslik belgilab qo'yilgan, shuning uchun sarosimadaman.",
      "Qanchalik taklif bo'lmasin, boshqa qaytib bog'lanmasligingizni so'raymiz.",
    ],
    correctAnswer: 0,
    explanationUzbek:
      "Biznes muzokaralarida hamkorlik taklifini rad etishda '大変魅力的なお話ではございますが、諸般の事情により今回は見送らせていただきたく存じます' (Taklif juda ajoyib bo'lsa-da, turli sabablarga ko'ra bu gal kechiktirishga / rad etishga to'g'ri keladi) deb diplomatik va yuksak ehtirom (Sonkeigo/Kenjougo) bilan javob qaytarish yapon ishbilarmonlik madaniyatining oltin qoidasidir.",
    tipUzbek:
      "Rad etish keigosida '今回は見送らせていただく' (bu safar rad etishga ruxsat bergaysiz) iborasi eng klassik N1 konstruksiyasidir.",
  },
  {
    id: 92,
    level: 'N1',
    type: 'point',
    titleUz: 'Kognitiv neyrobiologiya va qaror qabul qilish mexanizmi',
    script:
      '学術フォーラムで、認知心理学の研究者が「直感と論理的推論」について発表しています。研究者によると、熟練のチェス棋士が瞬時に最善手を見出せる最大の要因は何ですか？\n研究者：熟練のチェス棋士や医師の診断プロセスをfMRIで観察すると、興味深い現象が確認されます。彼らは膨大な選択肢を網羅的に論理計算しているのではなく、過去の膨大な経験を通じて脳の大脳基底核や前頭前野に蓄積された「パターンの直感的照合」を無意識下で行っています。思考の堂々巡りを排除し、状況を一目見ただけで無関係な何千もの悪手を瞬時に枝刈りして、最善の数手に絞り込む認知のチャンキング能力こそが、卓越した直感的意思決定を可能にしているのです。',
    questionText: '研究者によると、熟練のチェス棋士が瞬時に最善手を見出せる最大の要因は何ですか？',
    questionTextUz:
      "Tadqiqotchiga ko'ra, tajribali shaxmatchilar eng yaxshi yurishni bir lahzada topa olishining eng asosiy omili nima?",
    options: [
      'すべての盤面の変化を毎秒何千万通りも完全に計算し尽くすこと',
      '経験に基づき無関係な悪手を瞬時に排除しパターンを照合する認知能力',
      '対戦相手の脈拍や呼吸の乱れから心理状態を読み取ること',
      '試合前の十分な睡眠によって脳の活動を活性化させること',
    ],
    optionsUz: [
      "Doskadagi barcha o'zgarishlarni soniyasiga o'n millionlab kombinatsiyada to'liq hisoblab chiqish",
      "Tajribaga tayanib noto'g'ri yurishlarni bir lahzada chetga surib, naqshlarni (pattern) qiyoslaydigan kognitiv qobiliyat",
      "Raqibning puls va nafas olish ritmidan uning ruhiy holatini o'qib olish",
      "O'yindan oldin yetarlicha uxlab, miya faoliyatini faollashtirish",
    ],
    correctAnswer: 1,
    explanationUzbek:
      "Olim tushuntirishicha, usta shaxmatchilar barcha kombinatsiyalarni bittalab hisoblab chiqmaydi, balki ko'p yillik tajriba natijasida noo'rin yurishlarni bir lahzada chiqarib tashlab (無関係な何千もの悪手を瞬時に枝刈りして), vaziyatga mos patternlarni avtomatik taqqoslay oladigan 'kognitiv chunking' (認知のチャンキング能力) qobiliyatiga ega bo'ladilar.",
    tipUzbek:
      "Point (ポイント理解) savolida 'すべての計算' (variant 1) chalg'ituvchi bo'lib, tadqiqotchi uni inkor etdi (論理計算しているのではなく). '枝刈りして絞り込む認知能力' ifodasi to'g'ri javobni belgilab berdi.",
  },
];

/**
 * Parses raw script text into structured DialogueLine elements
 */
export function parseScriptIntoDialogueLines(script: string): DialogueLine[] {
  const lines: DialogueLine[] = [];
  const rawLines = script.split('\n');
  let idx = 1;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    let speaker = 'ナレーション';
    let speakerRoleUz = 'Boshlovchi';
    let gender: 'male' | 'female' | 'neutral' = 'neutral';
    let text = trimmed;

    if (trimmed.includes('：')) {
      const parts = trimmed.split('：');
      speaker = parts[0].trim();
      text = parts.slice(1).join('：').trim();
    } else if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      speaker = parts[0].trim();
      text = parts.slice(1).join(':').trim();
    }

    if (
      [
        '男',
        '男の人',
        '男性',
        '息子',
        '彼',
        '山田',
        '田中',
        '鈴木',
        '課長',
        '部長',
        '社長',
        '役員',
        'チーフ',
      ].includes(speaker)
    ) {
      gender = 'male';
      speakerRoleUz = 'Erkak / Xodim';
    } else if (
      ['女', '女の人', '女性', '母', '母親', '彼女', '佐藤', '女性社員'].includes(speaker)
    ) {
      gender = 'female';
      speakerRoleUz = 'Ayol';
    } else if (
      ['先生', '教授', '講師', '専門家', '研究者', '学者', '有識者', '医師', '医者'].includes(
        speaker,
      )
    ) {
      gender = 'male';
      speakerRoleUz = "Mutaxassis / O'qituvchi";
    } else if (['学生', '生徒'].includes(speaker)) {
      gender = 'neutral';
      speakerRoleUz = 'Talaba';
    } else if (
      ['店員', '店長', '係員', '係の人', 'フロント', '薬剤師', '看護師'].includes(speaker)
    ) {
      gender = 'neutral';
      speakerRoleUz = 'Xodim / Sotuvchi';
    } else if (['アナウンサー', 'アナウンス', '司会', 'リポーター'].includes(speaker)) {
      gender = 'neutral';
      speakerRoleUz = "E'lon / Diktor";
    } else if (speaker === 'あなた') {
      gender = 'neutral';
      speakerRoleUz = 'Siz';
    }

    lines.push({
      id: `line_${idx++}`,
      speaker,
      speakerRoleUz,
      gender,
      japanese: text,
    });
  }

  return lines;
}

/**
 * Filters questions by JLPT Level
 */
export function getQuestionsByLevel(
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1',
): JlptListeningQuestion[] {
  return JLPT_LISTENING_QUESTIONS.filter((q) => q.level === level);
}

/**
 * Filters questions by JLPT Question Type
 */
export function getQuestionsByType(type: string): JlptListeningQuestion[] {
  return JLPT_LISTENING_QUESTIONS.filter((q) => q.type === type);
}
