import { callAI, extractJsonFromAiResponse } from '../utils/ai/aiCore';

export type MonologueCategory = 'mensetsu' | 'ryuugaku' | 'visa_seikatsu' | 'daily_kaiwa';
export type MonologueLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface MonologueTopic {
  id: string;
  title: string;
  titleUz: string;
  category: MonologueCategory;
  level: MonologueLevel;
  promptQuestionJa: string;
  promptQuestionUz: string;
  answerGuidance: string; // Yo'riqnoma: qanday qilib batafsil (3-4 gap) javob berish kerakligi
  hints: string[];
}

export interface MonologueVocabularyItem {
  kanji: string;
  reading: string;
  romaji?: string;
  meaningUz: string;
}

export interface MonologueGrammarItem {
  structure: string;
  meaningUz: string;
  exampleJa: string;
  exampleReading?: string;
}

export interface MonologueAnalysisResult {
  originalTranscript: string;
  polishedJapanese: string;
  readingWithFurigana: string;
  uzbekTranslation: string;
  coachFeedback: string;
  accuracyScore: number;
  keyGrammarPoints: MonologueGrammarItem[];
  suggestedVocab: MonologueVocabularyItem[];
  encouragement: string;
}

export const MONOLOGUE_CATEGORIES: {
  id: MonologueCategory;
  labelUz: string;
  labelJa: string;
  icon: string;
  desc: string;
}[] = [
  {
    id: 'mensetsu',
    labelUz: 'Ishga kirish & Suhbat (Mensetsu)',
    labelJa: '就活・面接',
    icon: '💼',
    desc: 'Kompaniya intervyulari, nima uchun Yaponiya, kuchli tomonlar va maqsadlar',
  },
  {
    id: 'ryuugaku',
    labelUz: 'O‘qish & Universitet (Ryuugaku)',
    labelJa: '留学・進学',
    icon: '🎓',
    desc: 'Nega aynan Yaponiya, soha tanlovi, o‘qishdan keyingi rejalar',
  },
  {
    id: 'visa_seikatsu',
    labelUz: 'Viza & Hayot (Seikatsu)',
    labelJa: '生活・ビザ',
    icon: '🏠',
    desc: 'Yaponiyada yashash, madaniyatga moslashish va qiyinchiliklarni yengish',
  },
  {
    id: 'daily_kaiwa',
    labelUz: 'Kundalik & Erkin muloqot (Kaiwa)',
    labelJa: '日常会話',
    icon: '☕',
    desc: 'Kunlik rejalar, sevimli taomlar, xobbi va dam olish kunlari',
  },
];

export const PRESET_MONOLOGUE_TOPICS: MonologueTopic[] = [
  // 💼 MENSETSU (Ish suhbati - Haqiqiy Yapon Kompaniyalari Savollari)
  {
    id: 'mensetsu_why_japan',
    title: '日本で働きたい理由（志望動機）',
    titleUz: 'Nima uchun Yaponiyada ishlamoqchisiz? (Shibou Douki)',
    category: 'mensetsu',
    level: 'N3',
    promptQuestionJa:
      'なぜ母国（ぼこく）や他（ほか）の国（くに）ではなく、日本（にほん）の企業（きぎょう）で働（はたら）きたいのですか？',
    promptQuestionUz:
      'Nega o‘z vataningiz yoki boshqa davlatlar emas, aynan Yaponiya kompaniyasida ishlashni xohlaysiz?',
    answerGuidance:
      'Kompaniyalar tezda qaytib ketishingizdan xavotir oladi. Shu sababli: 1) Yapon biznesi yoki texnologiyasiga qiziqishingiz, 2) Shaxsiy tajribangiz, 3) Kompaniyaga qanday hissa qo‘shmoqchi ekaningizni 3–4 ta to‘liq gapda tushuntiring.',
    hints: [
      '高い技術力と品質管理 (yuqori texnologiya va sifat nazorati)',
      '長期的にキャリアを築く (uzoq muddatli karyera qurish)',
      "貢献したい (hissa qo'shishni xohlayman)",
    ],
  },
  {
    id: 'mensetsu_gakuchika',
    title: '学生時代・過去に最も力を入れたこと（ガクチカ）',
    titleUz: 'O‘tmishda eng ko‘p kuch sarflagan ishingiz (Gakuchika)',
    category: 'mensetsu',
    level: 'N2',
    promptQuestionJa:
      '学生時代（がくせいじだい）またはこれまでの経験（けいけん）で、最（もっと）も力（ちから）を入（い）れて取（と）り組（く）んだことは何（なん）ですか？',
    promptQuestionUz:
      'O‘qishingiz yoki faoliyatingiz davomida eng ko‘p kuch va mehnat sarflagan eng katta yutug‘ingiz/loyihangiz nima bo‘lgan?',
    answerGuidance:
      'Yapon intervyusining eng mashhur savoli (Gakuchika). Tuzilishi: 1) Qanday qiyin vazifa bor edi, 2) Siz qanday harakat qildingiz, 3) Natija va undan qanday xulosa chiqardingiz.',
    hints: [
      '困難に直面した時 (qiyinchilikka duch kelganda)',
      '自発的に行動する (tashabbus bilan harakat qilmoq)',
      '成果を上げる (natijaga erishmoq)',
    ],
  },
  {
    id: 'mensetsu_strengths',
    title: '長所と短所（自己PR）',
    titleUz: 'Kuchli va zaif tomonlaringiz (Jiko PR)',
    category: 'mensetsu',
    level: 'N3',
    promptQuestionJa:
      'あなたの長所（ちょうしょ）と短所（たんしょ）は何（なん）ですか？それを仕事（しごと）でどう活（い）かしますか？',
    promptQuestionUz:
      'Sizning kuchli va zaif tomonlaringiz nima? Buni ishda qanday qo‘llay olasiz?',
    answerGuidance:
      'Kuchli tomoningizga aniq 1 ta misol keltiring. Zaif tomoningizni aytganda esa, uni to‘g‘rilash uchun qanday harakat qilayotganingizni ko‘rsatib 3–4 gapda gapiring.',
    hints: [
      "責任感が強い (mas'uliyatli)",
      "継続力がある (qat'iyatli)",
      '〜ように改善に努めています (shunday yaxshilashga intilaman)',
    ],
  },
  {
    id: 'mensetsu_business_culture',
    title: '日本のビジネス文化・報連相への適応',
    titleUz: 'Yapon biznes madaniyati va Hou-Ren-So ga moslashish',
    category: 'mensetsu',
    level: 'N2',
    promptQuestionJa:
      '日本（にほん）のビジネス習慣（しゅうかん）やチームワーク（報連相（ほうれんそう）など）になじむ自信（じしん）はありますか？',
    promptQuestionUz:
      'Yaponiyaning biznes qoidalari, jamoaviy ishlash va "Hou-Ren-So" (hisobot, aloqa, maslahat) tizimiga moslasha olasizmi?',
    answerGuidance:
      'Oddiy "ha" demang. O‘zbekiston va Yaponiya madaniyatidagi farqlarni tushunishingizni va jamoada qanday moslashishingizni aniq misol bilan 3-4 gapda ayting.',
    hints: [
      '報告・連絡・相談（報連相）',
      'チームワークを重視する (jamoaviylikni qadrlash)',
      "柔軟に対応する (moslashuvchan bo'lish)",
    ],
  },
  {
    id: 'mensetsu_future_vision',
    title: '入社後のキャリアプラン（将来のビジョン）',
    titleUz: 'Kompaniyada 5 yildan keyingi maqsadlaringiz',
    category: 'mensetsu',
    level: 'N3',
    promptQuestionJa:
      '入社（にゅうしゃ）したらどんな仕事（しごと）に挑戦（ちょうせん）したいですか？５年後（ねんご）の目標（もくひょう）を教（おし）えてください。',
    promptQuestionUz:
      'Kompaniyaga qabul qilinsangiz, qanday loyihalarda ishlamoqchisiz? 5 yildan keyingi asosiy maqsadingiz nima?',
    answerGuidance:
      "Kompaniyada uzoq muddat o‘sib, mas'uliyatli mutaxassis bo‘lish niyatida ekanligingizni va qanday yangi ko‘nikmalarni egallamoqchiligingizni 3-4 gapda bayon qiling.",
    hints: [
      'プロジェクトをリードする (loyihani boshqarish)',
      '専門性を高める (mutaxassislikni oshirish)',
      '信頼される存在 (ishonchli shaxs)',
    ],
  },

  // 🎓 RYUUGAKU (O'qish & Universitet / Kollej Suhbatlari)
  {
    id: 'ryuugaku_why_study_japan',
    title: '日本留学を選んだ理由',
    titleUz: 'Nega aynan Yaponiyada o‘qishni tanladingiz?',
    category: 'ryuugaku',
    level: 'N4',
    promptQuestionJa:
      '他（ほか）の国（くに）もある中（なか）で、なぜ日本（にほん）に留学（りゅうがく）しようと決（き）めましたか？',
    promptQuestionUz:
      'Boshqa davlatlar ham ko‘p bo‘lishiga qaramay, nima uchun aynan Yaponiyada o‘qishga qaror qildingiz?',
    answerGuidance:
      '"Anime yoqadi" yoki "Yaponiyani sevamann" deyish yetarli emas. Yaponiyaning siz qiziqqan sohadagi o‘rni va ta\'lim sifatini 3-4 ta to‘liq gapda tushuntiring.',
    hints: [
      "先進的な研究環境 (ilg'or ilmiy muhit)",
      '実践的な専門技術 (amaliy texnologiya)',
      '将来の夢を実現するため (orzuni amalga oshirish)',
    ],
  },
  {
    id: 'ryuugaku_why_this_school',
    title: 'この学校を選んだ理由（志望動機）',
    titleUz: 'Nega aynan bizning o‘quv yurtimiz? (Universitet / Kollej)',
    category: 'ryuugaku',
    level: 'N3',
    promptQuestionJa:
      '数（かず）ある学校（がっこう）の中（なか）で、なぜ本校（ほんこう）を選（えら）びましたか？',
    promptQuestionUz:
      'Boshqa ko‘plab o‘quv yurtlari ichida nega aynan bizning maktab/universitetni tanladingiz?',
    answerGuidance:
      'Ushbu maktabning dars dasturi, amaliyoti yoki laboratoriyasining qaysi jihati sizni jalb qilganini aniq faktlar bilan 3-4 gapda aytib bering.',
    hints: [
      'カリキュラムが充実している (dastur boy)',
      '就職率が高い (ishga joylashish foizi yuqori)',
      '実践的な指導 (amaliy ustozlik)',
    ],
  },
  {
    id: 'ryuugaku_tuition_finance',
    title: '学費・生活費の支弁計画',
    titleUz: 'O‘qish va yashash xarajatlarini qanday to‘laysiz?',
    category: 'ryuugaku',
    level: 'N4',
    promptQuestionJa:
      '日本（にほん）での学費（がくひ）や生活費（せいかつひ）は、誰（だれ）がどのように支払（しはら）いますか？',
    promptQuestionUz:
      'Yaponiyadagi o‘qish va yashash xarajatlarini kim va qanday mablag‘ hisobidan qoplaydi?',
    answerGuidance:
      'DIQQAT: "Faqat arubaito (ish) qilib to‘layman" demang! Ota-ona ko‘magi yoki shaxsiy jamg‘arma borligini va asosiy e\'tibor o‘qishda bo‘lishini ayting.',
    hints: [
      '両親からの仕送り (ota-ona yuboradigan pul)',
      "学業に専念する (asosiy e'tiborni o'qishga qaratish)",
      '計画的に準備した (reja asosida tayyorlangan)',
    ],
  },
  {
    id: 'ryuugaku_future_plan',
    title: '卒業後の進路・将来の計画',
    titleUz: 'O‘qishni bitirgach rejalaringiz qanday?',
    category: 'ryuugaku',
    level: 'N3',
    promptQuestionJa:
      '日本（にほん）での学（まな）びを終（お）えた後（あと）、どんな進路（しんろ）に進（すす）む予定（よてい）ですか？',
    promptQuestionUz:
      "Yaponiyadagi ta'limni yakunlagandan so‘ng qanday sohada ishlash yoki qanday hissa qo‘shishni rejalashtiryapsiz?",
    answerGuidance:
      'O‘qishdan keyin Yaponiyada ishlash yoki o‘z vataningizga qaytib qanday hissa qo‘shish niyatingiz borligini aniq bayon qiling.',
    hints: [
      '就職する (ishga kirmoq)',
      "架け橋になりたい (ko'prik bo'lishni xohlayman)",
      "学んだことを活かす (o'rganganlarini qo'llamoq)",
    ],
  },

  // 🏠 VISA & SEIKATSU (Viza & Hayot)
  {
    id: 'visa_purpose_return',
    title: '日本滞在の目的と将来の帰国意思',
    titleUz: 'Yaponiyada bo‘lish maqsadi va vatanga qaytish rejasi',
    category: 'visa_seikatsu',
    level: 'N4',
    promptQuestionJa:
      '日本（にほん）に行（い）く一番（いちばん）の目的（もくてき）は何（なん）ですか？将来（しょうらい）母国（ぼこく）に帰（かえ）る予定（よてい）はありますか？',
    promptQuestionUz:
      'Yaponiyaga borishdan asosiy maqsadingiz nima? Kelgusida o‘z vataningizga qaytish rejangiz qanday?',
    answerGuidance:
      'Viza intervyusida noqonuniy qolib ketish xavfi yo‘qligini, Yaponiyada bilim/tajriba olib o‘z sohangizda rivojlanish maqsadingizni aniq ko‘rsating.',
    hints: [
      '専門知識の習得 (mutaxassislik bilimini egallash)',
      '母国の発展に貢献 (vatan taraqqiyotiga hissa)',
      '合法的に滞在する (qonuniy yashash)',
    ],
  },
  {
    id: 'seikatsu_adaptation',
    title: '日本生活への適応と準備',
    titleUz: 'Yaponiyadagi hayotga moslashish va tayyorgarlik',
    category: 'visa_seikatsu',
    level: 'N4',
    promptQuestionJa:
      '日本（にほん）での生活（せいかつ）で不安（ふあん）なことはありますか？どうやって適応（てきおう）しますか？',
    promptQuestionUz:
      'Yaponiyadagi hayotda sizni qandaydir xavotir yoki qiyinchiliklar o‘ylantiradimi? Ularga qanday moslashasiz?',
    answerGuidance:
      'Oddiy "yo‘q" demang. Til yoki madaniyat farqlari bo‘lishi mumkinligini aytib, uni qanday harakat bilan yengishingizni tushuntiring.',
    hints: [
      'ルールを守る (qoidalarga amal qilmoq)',
      '積極的にコミュニケーションをとる (faol muloqot qilmoq)',
      '文化の違い (madaniy farqlar)',
    ],
  },

  // ☕ DAILY KAIWA (Kundalik)
  {
    id: 'daily_routine',
    title: '今日の一日・予定',
    titleUz: 'Bugungi kun va rejalar',
    category: 'daily_kaiwa',
    level: 'N5',
    promptQuestionJa:
      '今日（きょう）は何（なに）をしますか？一日（ついたち）の予定（よてい）を教（おし）えてください。',
    promptQuestionUz: 'Bugun nimalar qilasiz? Kunlik rejalaringiz haqida gapirib bering.',
    answerGuidance:
      'Ertalabdan kechgacha qiladigan 2-3 ta asosiy ishingizni ~te bog‘lovchisi bilan bog‘lab, to‘liq gaplarda aytib bering.',
    hints: [
      '起きます (turmoq)',
      '散歩します (sayr qilmoq)',
      'お茶を飲みます (choy ichmoq)',
      '〜てから (keyin)',
    ],
  },
  {
    id: 'weekend_recap',
    title: '週末の過ごし方',
    titleUz: 'Dam olish kunlari nima qildingiz?',
    category: 'daily_kaiwa',
    level: 'N5',
    promptQuestionJa: '先週（せんしゅう）の週末（しゅうまつ）は何（なに）をしましたか？',
    promptQuestionUz: "O'tgan dam olish kunlarida nimalar qildingiz?",
    answerGuidance:
      'Dam olish kunida qilgan kamida 2 ta harakatingizni ~tari ~tari shaklida yoki ketma-ketlikda batafsil hikoya qiling.',
    hints: [
      "友達と会いました (do'stlar bilan uchrashdim)",
      "映画を見ました (kino ko'rdim)",
      '〜たり〜たりしました',
    ],
  },
];

export const MonologueService = {
  /**
   * Barcha preset mavzularni filtr bilan qaytaradi
   */
  getPresetTopics(category?: MonologueCategory, level?: MonologueLevel): MonologueTopic[] {
    let filtered = PRESET_MONOLOGUE_TOPICS;
    if (category) {
      filtered = filtered.filter((t) => t.category === category);
    }
    if (level) {
      filtered = filtered.filter((t) => t.level === level);
    }
    return filtered.length > 0 ? filtered : PRESET_MONOLOGUE_TOPICS;
  },

  /**
   * AI orqali Yaponiyaning haqiqiy kompaniyalari, universitetlari va elchixonalari beradigan savollar asosida yangi savol tuzish
   */
  async generateDynamicTopic(
    level: MonologueLevel = 'N3',
    category: MonologueCategory = 'mensetsu',
  ): Promise<MonologueTopic> {
    const categoryInfo =
      MONOLOGUE_CATEGORIES.find((c) => c.id === category) || MONOLOGUE_CATEGORIES[0];

    const prompt = `Siz Yaponiya universitetlari va yetakchi kompaniyalari uchun xorijlik nomzodlarni saralovchi tajribali yaponiyalik imtihonchi va suhbatdoshingiz (Sensei / 面接官).
Talabaning darajasi: JLPT ${level}.
Yo'nalishi / Maqsadi: ${categoryInfo.labelUz} (${categoryInfo.labelJa}).

VAZIFA:
Yaponiyadagi haqiqiy kompaniya intervyulari (就活・面接), universitet imtihonlari (留学面接) yoki elchixona suhbatlarida xorijliklardan ENG KO'P SO'RALADIGAN, chuqur va amaliy yangi bitta savol tuzing.
Masalan:
- Ish suhbatida: Nega Yaponiya korxonalari, Hou-Ren-So, Gakuchika (qiyinchilikni yengish tajribasi), jamoaviy ishlash, 5 yillik reja;
- O'qish suhbatida: Nega boshqa davlat emas Yaponiya, nega aynan shu universitet/fakultet, o'qish xarajatlari ta'minoti, bitirgach niyat;
- Viza suhbatida: Qonuniy maqsad, vatanga qaytish niyati, moliyaviy barqarorlik.

Savol shunday bo'lsinki, talaba 1 ta qisqa gap bilan qochib qutulmasin, balki PREP qoidasiga ko'ra (Asosiy fikr + Sabab + 1 ta shaxsiy misol/tajriba) 3-4 ta to'liq gapda batafsil javob berishi talab qilinsin.

Javobni FAQAT STRICT JSON formatida qaytaring:
{
  "id": "dynamic_${Date.now()}",
  "title": "<Yaponcha sarlavha>",
  "titleUz": "<O'zbekcha sarlavha>",
  "category": "${category}",
  "level": "${level}",
  "promptQuestionJa": "<Talabaga beriladigan savol kanji va qavsda furigana bilan>",
  "promptQuestionUz": "<Savolning o'zbekcha to'liq ma'nosi>",
  "answerGuidance": "<Talabaga ushbu intervyu savoliga qanday qilib PREP qoidasi bo'yicha batafsil (3-4 gap) javob berish kerakligi bo'yicha o'zbekcha professional maslahat>",
  "hints": ["<yordamchi yaponcha so'z/ibora 1>", "<yordamchi yaponcha so'z/ibora 2>", "<yordamchi yaponcha so'z/ibora 3>"]
}`;

    try {
      const response = await callAI(
        prompt,
        'You are an elite Japanese recruiter and university admissions officer.',
        true,
      );
      const data = extractJsonFromAiResponse<MonologueTopic>(response);
      return {
        ...data,
        id: `topic_${Date.now()}`,
        level,
        category,
        answerGuidance:
          data.answerGuidance ||
          'Asosiy fikringiz va 1 ta aniq misol bilan 3-4 gapda batafsil tushuntiring.',
      };
    } catch (err) {
      console.warn('Fallback to preset topic:', err);
      const matchingPresets = PRESET_MONOLOGUE_TOPICS.filter((t) => t.category === category);
      const list = matchingPresets.length > 0 ? matchingPresets : PRESET_MONOLOGUE_TOPICS;
      const randomIndex = Math.floor(Math.random() * list.length);
      return list[randomIndex];
    }
  },

  /**
   * Foydalanuvchining diktofon orqali yozilgan nutqini tahlil qilish va to'g'rilash
   */
  async analyzeMonologueSpeech(
    topic: MonologueTopic,
    transcript: string,
  ): Promise<MonologueAnalysisResult> {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Transkript bo'sh. Iltimos, avval mikrofonga gapiring.");
    }

    const isMensetsu = topic.category === 'mensetsu';
    const isRyuugaku = topic.category === 'ryuugaku';

    const systemPrompt = `Siz yapon tili bo'yicha oliy darajali murabbiy va intervyu (mensetsu) mutaxassisisiz.
Talaba JLPT ${topic.level} darajasida nutq amaliyotini o'tamoqda.
Mavzu yo'nalishi: ${topic.category} (${isMensetsu ? 'Ish intervyusi (就活)' : isRyuugaku ? "O'qish suhbati (進学)" : 'Muloqot'}).
Foydalanuvchiga bitta jiddiy savol berilgan va u shu savolga diktofonga yapon tilida o'z fikrini gapirdi.
Foydalanuvchi gapi 50% chala, grammatikasi yoki sintaksisi xato, so'zlari tartibsiz bo'lishi mumkin.

SIZNING VAZIFANGIZ:
1. Foydalanuvchining aytmoqchi bo'lgan asl maqsadini to'liq anglang.
2. Gaplarni tabiiy, ravon va to'g'ri yapon tiliga aylantiring (polishedJapanese).
   ${isMensetsu || isRyuugaku ? "- DIQQAT: Suhbat (Mensetsu) bo'lgani uchun, rasmiy va hurmat ifodalovchi (Teineigo / Desu-Masu / Keigo) shaklida mukammal shakllantiring." : ''}
3. MUHIM: Kanjilar yonida QAVS ICHIDA uning hiragana o'qilishini (furigana) yozib bering (readingWithFurigana). Masalan: "日本（にほん）のIT技術（ぎじゅつ）に強（つよ）く惹（ひ）かれ、自分（じぶん）のスキルを活（い）かして貢献（こうけん）したいと考（かんが）えています。"
4. O'zbek tilidagi to'liq, ravon tarjimasini bering (uzbekTranslation).
5. O'zbek tilida professional va samimiy murabbiy fikrini (coachFeedback) yozing:
   - Xatolar tahlili;
   - Qisqa javob bergan bo'lsa, qanday kengaytirish kerakligi;
   - Yapon suhbatdoshida ijobiy taassurot qoldirish uchun qanday qo'shimcha qilish lozimligi (masalan: sabab ketidan shaxsiy tajriba va kelajakdagi maqsadni qo'shish).
6. 2-4 ta asosiy grammatik qoida (keyGrammarPoints) va 2-5 ta professional so'z (suggestedVocab).
7. Boshlang'ich ifodaning to'g'rilik foizi (accuracyScore 0-100).
8. Ruhlantiruvchi gap (encouragement).

Qaytish formati FAQAT STRICT JSON bo'lishi shart (hech qanday markdown kod bloklarisiz):
{
  "originalTranscript": "${transcript.replace(/"/g, '\\"')}",
  "polishedJapanese": "<To'g'rilangan ravon yaponcha matn>",
  "readingWithFurigana": "<Kanjilari qavs ichida o'qilishi bilan ko'rsatilgan yaponcha matn>",
  "uzbekTranslation": "<O'zbekcha tarjimasi>",
  "coachFeedback": "<O'zbek tilidagi batafsil murabbiy tahlili va amaliy maslahati>",
  "accuracyScore": <0 dan 100 gacha son>,
  "keyGrammarPoints": [
    {
      "structure": "〜と考えております",
      "meaningUz": "...deb o'ylamoqdaman (rasmiy Keigo)",
      "exampleJa": "貢献したいと考えております。",
      "exampleReading": "貢献（こうけん）したいと考（かんが）えております。"
    }
  ],
  "suggestedVocab": [
    {
      "kanji": "貢献",
      "reading": "こうけん",
      "romaji": "kouken",
      "meaningUz": "hissa qo'shish"
    }
  ],
  "encouragement": "Juda yaxshi urinish! Fikrlaringiz tushunarli, bu uslubda davom etsangiz intervyulardan muvaffaqiyatli o'tasiz."
}`;

    const userPrompt = `Savol va Mavzu:
Sarlavha: ${topic.title} (${topic.titleUz})
Savol: ${topic.promptQuestionJa} (${topic.promptQuestionUz})
Yo'riqnoma: ${topic.answerGuidance}

Foydalanuvchi gapirgan asl matn (User spoken text):
"${transcript}"`;

    try {
      const response = await callAI(userPrompt, systemPrompt, true);
      const parsed = extractJsonFromAiResponse<MonologueAnalysisResult>(response);

      return {
        originalTranscript: parsed.originalTranscript || transcript,
        polishedJapanese: parsed.polishedJapanese || transcript,
        readingWithFurigana: parsed.readingWithFurigana || parsed.polishedJapanese || transcript,
        uzbekTranslation: parsed.uzbekTranslation || '',
        coachFeedback: parsed.coachFeedback || 'Nutqingiz tahlil qilindi.',
        accuracyScore: typeof parsed.accuracyScore === 'number' ? parsed.accuracyScore : 65,
        keyGrammarPoints: Array.isArray(parsed.keyGrammarPoints) ? parsed.keyGrammarPoints : [],
        suggestedVocab: Array.isArray(parsed.suggestedVocab) ? parsed.suggestedVocab : [],
        encouragement: parsed.encouragement || 'Har kuni mashq qilish nutqni erkinlashtiradi!',
      };
    } catch (err: any) {
      console.error('Monologue speech analysis error:', err);
      throw new Error(
        `Tahlil qilishda xatolik yuz berdi: ${err?.message || 'AI bilan ulanishda xato'}`,
      );
    }
  },
};
