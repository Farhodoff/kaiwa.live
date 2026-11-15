export interface TopicExampleSentence {
  ja: string;
  romaji: string;
  uz: string;
  starterPromptUz?: string;
}

export const FREE_TALK_EXAMPLE_SENTENCES: TopicExampleSentence[] = [
  {
    ja: '今日は仕事（勉強）でとても忙しかったですが、充実した一日でした。',
    romaji:
      'Kyou wa shigoto (benkyou) de totemo isogashikatta desu ga, juujitsu shita ichinichi deshita.',
    uz: "Bugun ish (o'qish) bilan juda band bo'ldim, lekin juda unumli kun bo'ldi.",
    starterPromptUz: "Bugungi kuningiz qanday o'tganini ayting (band / ajoyib / odatiy).",
  },
  {
    ja: '最近、日本の文化やアニメを見るのにとてもハマっています。',
    romaji: 'Saikin, nihon no bunka ya anime o miru no ni totemo hamatte imasu.',
    uz: "So'nggi kunlarda yapon madaniyati va animelarini ko'rishga juda qiziqib qoldim.",
    starterPromptUz:
      "Qiziqishlaringiz yoki bo'sh vaqtingizda nima qilishni yoqtirishingizni ayting.",
  },
  {
    ja: '休みの日は散歩をしたり、カフェで美味しいコーヒーを飲むのが好きです。',
    romaji: 'Yasumi no hi wa sanpo o shitari, kafe de oishii koohii o nomu no ga suki desu.',
    uz: "Dam olish kunlarida sayr qilishni va kafeda mazali kofe ichishni yaxshi ko'raman.",
    starterPromptUz: "Dam olish kunlaringizni qanday o'tkazishingizni ayting.",
  },
  {
    ja: '将来、日本に行って本場のラーメンやお寿司を食べてみたいです。',
    romaji: 'Shourai, nihon ni itte honba no raamen ya osushi o tabete mitai desu.',
    uz: "Kelajakda Yaponiyaga borib haqiqiy ramen va sushilardan tatib ko'rmoqchiman.",
    starterPromptUz: 'Yaponiyaga borish orzuingiz yoki sayohat rejalaringizni ayting.',
  },
  {
    ja: '私の考えでは、毎日少しずつでも練習することが一番大切だと思います。',
    romaji:
      'Watashi no kangae dewa, mainichi sukoshi zutsu demo renshuu suru koto ga ichiban taisetsu da to omoimasu.',
    uz: "Mening fikrimcha, har kuni oz-ozdan bo'lsa ham mashq qilish eng muhimi deb o'ylayman.",
    starterPromptUz: "Biror mavzu bo'yicha o'z shaxsiy fikringizni bildiring (〜だと思います).",
  },
];

export const CATEGORY_EXAMPLE_SENTENCES: Record<string, TopicExampleSentence[]> = {
  social: [
    {
      ja: 'はじめまして、ウズベキスタンから来た[名前]と申します。どうぞよろしくお願いします。',
      romaji:
        'Hajimemashite, Uzbekisutan kara kita [Ismingiz] to moushimasu. Douzo yoroshiku onegaishimasu.',
      uz: "Tanishganimdan xursandman, O'zbekistondan kelgan [Ismingiz]man. Siz bilan tanishganimdan mamnunman.",
      starterPromptUz: "O'zingizni tanishtiring: Ismingiz va qayerdan ekanligingizni ayting.",
    },
    {
      ja: '趣味は外国語を学ぶことと、新しい友達を作ることです。',
      romaji: 'Shumi wa gaikokugo o manabu koto to, atarashii tomodachi o tsukuru koto desu.',
      uz: "Qiziqishim - xorijiy tillarni o'rganish va yangi do'stlar orttirish.",
      starterPromptUz: 'Qiziqishlaringiz haqida gapiring: 趣味は〜です。',
    },
  ],
  daily: [
    {
      ja: 'すみません、メニューのおすすめは何ですか？これを一つお願いします。',
      romaji: 'Sumimasen, menyuu no osusume wa nan desu ka? Kore o hitotsu onegaishimasu.',
      uz: 'Kechirasiz, menyudagi eng tavsiya etiladigan taom nima? Shundan bitta bersangiz.',
      starterPromptUz: "Buyurtma bering yoki narxini so'rang: 〜をお願いします / いくらですか。",
    },
    {
      ja: '別のサイズや色はありますか？試着してもいいですか？',
      romaji: 'Betsu no saizu ya iro wa arimasu ka? Shichaku shite mo ii desu ka?',
      uz: "Boshqa o'lchami yoki rangi bormi? Kiyib ko'rsam bo'ladimi?",
      starterPromptUz: "Do'konda xarid qilayotganda savol bering: 〜てもいいですか。",
    },
  ],
  travel: [
    {
      ja: 'すみません、駅に行きたいのですが、どの電車に乗ればいいですか？',
      romaji: 'Sumimasen, eki ni ikitai no desu ga, dono densha ni noreba ii desu ka?',
      uz: "Kechirasiz, vokzalga bormoqchi edim, qaysi poyezdga chiqsam bo'ladi?",
      starterPromptUz: "Yo'l so'rang: 〜へ行きたいのですが、〜ですか。",
    },
    {
      ja: 'チェックインをお願いします。予約した[名前]です。',
      romaji: 'Chekku-in o onegaishimasu. Yoyaku shita [Ismingiz] desu.',
      uz: "Ro'yxatdan o'tish (check-in) qilmoqchi edim. Band qilgan edim, ismim [Ismingiz].",
      starterPromptUz: 'Mehmonxonada yoki aeroportda murojaat qiling.',
    },
  ],
  business: [
    {
      ja: 'お忙しいところ恐れ入ります。本日の会議の件につきましてご相談がございます。',
      romaji:
        'Oisogashii tokoro osoreirimasu. Honjitsu no kaigi no ken ni tsukimashite gosoudan ga gozaimasu.',
      uz: 'Band vaqtingizda bezovta qilganim uchun uzr. Bugungi majlis masalasi yuzasidan maslahatlashmoqchi edim.',
      starterPromptUz: 'Rasmiy yoki ish yuzasidan muloyim murojaat qiling (敬語).',
    },
    {
      ja: '私の強みは、チームワークを大切にしながら問題解決に向けて粘り強く取り組むことです。',
      romaji:
        'Watashi no tsuyomi wa, chiimuwaaku o taisetsu ni shinagara mondai kaiketsu ni mukete nebariyuzuyoku torikumu koto desu.',
      uz: 'Mening kuchli tomonim - jamoaviy ishlashni qadrlagan holda, muammolarni hal qilishda sabr bilan yondashishdir.',
      starterPromptUz:
        'Ish intervyusida (Mensetsu) kuchli tomoningizni tushuntiring: 私の強みは〜です。',
    },
  ],
  academic: [
    {
      ja: 'この文法について質問があるのですが、詳しく教えていただけますか？',
      romaji:
        'Kono bunpou ni tsuite shitsumon ga aru no desu ga, kuwashiku oshiete itadakemasu ka?',
      uz: "Ushbu grammatika bo'yicha savolim bor edi, batafsil tushuntirib bera olasizmi?",
      starterPromptUz: "Ustozdan yoki o'qituvchidan savol so'rash formulasi.",
    },
  ],
};

/**
 * Resolves contextually relevant example sentences for any scenario or free conversation.
 */
export function getScenarioExampleSentences(
  scenarioId?: string | null,
  category?: string | null,
  keyPhrases?: string[],
): TopicExampleSentence[] {
  if (!scenarioId) {
    return FREE_TALK_EXAMPLE_SENTENCES;
  }

  // 1. Check if category examples exist
  const catKey = (category || 'daily').toLowerCase();
  const categoryExamples = CATEGORY_EXAMPLE_SENTENCES[catKey] || CATEGORY_EXAMPLE_SENTENCES.daily;

  // 2. If key phrases exist, synthesize helpful starter patterns
  if (keyPhrases && keyPhrases.length > 0) {
    const dynamicKeyPhrases = keyPhrases.slice(0, 3).map((phrase) => {
      return {
        ja: `「${phrase}」を使って話してみましょう。`,
        romaji: `"${phrase}" o tsukatte hanashite mimashou.`,
        uz: `Ushbu kalit iborani o'z jumlalaringizda qo'llang: "${phrase}"`,
        starterPromptUz: `Namuna: Ushbu vaziyatda "${phrase}" iborasi bilan gap tuzing.`,
      };
    });
    return [...categoryExamples.slice(0, 2), ...dynamicKeyPhrases.slice(0, 1)];
  }

  return categoryExamples;
}
