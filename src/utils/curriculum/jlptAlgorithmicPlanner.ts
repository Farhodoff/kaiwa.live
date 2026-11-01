import { JLPT_KANJI_DATABASE } from '../../data/jlptKanjiDatabase';
import { JLPT_GRAMMAR_DATABASE } from '../../data/jlptGrammarDatabase';
import { loadPresetDecksByLevel, JlptDeckLevel } from '../../data/jlptPresetDecks';
import type { JlptStudyPlanDay } from '../ai/aiJlpt';

// ─── Phase structure ──────────────────────────────────────────────────────────
function getPhaseNumber(day: number, totalDays: number): 1 | 2 | 3 {
  if (day <= Math.floor(totalDays * 0.35)) return 1;
  if (day <= Math.floor(totalDays * 0.7)) return 2;
  return 3;
}

function getPhaseLabel(phase: 1 | 2 | 3, targetLevel: string): string {
  if (phase === 1) return `🌱 ${targetLevel} Poydevor Bosqichi`;
  if (phase === 2) return `📚 ${targetLevel} Amaliyot Bosqichi`;
  return `🎯 ${targetLevel} Imtihon Tayyorligi`;
}

// ─── JLPT specific daily tasks (concrete, action-oriented) ────────────────────
function buildJlptDailyTasks(
  _day: number,
  phase: 1 | 2 | 3,
  targetLevel: string,
  kanjiChunk: any[],
  grammarChunk: any[],
  vocabChunk: any[],
  focusArea: 'Kanji' | 'Vocabulary' | 'Grammar' | 'Reading' | 'Listening' | 'Speaking',
  isMockDay: boolean,
): string[] {
  const tasks: string[] = [];

  if (isMockDay) {
    const vocabReview = vocabChunk
      .slice(0, 3)
      .map((v) => `${v.front}(${v.back})`)
      .join('、 ');
    tasks.push(
      `📖 Lug'at takrorlash: ${vocabReview || "oldingi kunlar so'zlarini qaytish"} — har birini yozing va ma'nosini aytib bering`,
    );
    tasks.push(`✏️ Kanji diktant: o'tilgan kanjilardan 10 tasini yod bilan yozing`);
    tasks.push(
      `🎯 Mock Test: ${targetLevel} darajasida 1 ta to'liq Section tinglash yoki o'qish mashqi`,
    );
    tasks.push(`📊 Xatolarni tahlil: noto'g'ri javoblar sababini tushunib daftarga yozing`);
    tasks.push(`🃏 Flashcard takrorlash: bu hafta yaratilgan barcha kartlarni qayta ko'ring`);
    return tasks;
  }

  // Always include vocab as first task
  if (vocabChunk.length > 0) {
    const vocabStr = vocabChunk
      .slice(0, 4)
      .map((v) => `${v.front}（${v.back}）`)
      .join('、 ');
    tasks.push(
      `📖 Yangi so'zlarni yodlash: ${vocabStr} — har birini 5 marta yozing va gapda qo'llang`,
    );
  } else {
    tasks.push(
      `📖 Lug'at mashqi: ${targetLevel} daraja so'zlarini takrorlang va flashcard yarating`,
    );
  }

  // Always include grammar as second task
  if (grammarChunk.length > 0) {
    const g = grammarChunk[0];
    const exampleStr =
      g.examples && g.examples[0] ? `Misol: "${g.examples[0].ja}" → "${g.examples[0].uz}"` : '';
    tasks.push(
      `✏️ Grammatika o'rganing: 【${g.title}】 — ${g.meaningUz}. Tuzilishi: ${g.structure || ''}. ${exampleStr}`,
    );
    if (grammarChunk.length > 1) {
      tasks.push(
        `📝 Qo'shimcha grammatika: 【${grammarChunk[1].title}】 — ${grammarChunk[1].meaningUz} — shu qoida bilan 3 ta yangi gap tuzing`,
      );
    }
  } else {
    tasks.push(
      `✏️ Grammatika takrorlash: o'tilgan ${targetLevel} qoidalarini yodlang va jumla tuzing`,
    );
  }

  // Kanji task
  if (kanjiChunk.length > 0) {
    const kanjiStr = kanjiChunk
      .slice(0, 3)
      .map((k) => {
        const exampleWord =
          k.examples && k.examples[0] ? `(${k.examples[0].word} - ${k.examples[0].meaning})` : '';
        return `${k.kanji}[${k.meaningUz}]${exampleWord}`;
      })
      .join('、 ');
    tasks.push(
      `⛩️ Kanji yodlash: ${kanjiStr} — on'yomi: ${kanjiChunk
        .slice(0, 2)
        .map((k) => k.onyomi || '-')
        .join(', ')} / kun'yomi: ${kanjiChunk
        .slice(0, 2)
        .map((k) => k.kunyomi || '-')
        .join(', ')}`,
    );
  }

  // Focus area specific task
  switch (focusArea) {
    case 'Speaking':
      if (phase === 1) {
        tasks.push(
          `🗣️ Kaiwa mashqi: o'rganilgan so'zlardan foydalanib, o'zingizni tanishtiring va 3 ta savol-javob bajaring`,
        );
      } else if (phase === 2) {
        tasks.push(
          `🗣️ AI Coach bilan 10 daqiqa suhbat: bugungi grammatika qoidalarini qo'llab gapiring`,
        );
      } else {
        tasks.push(
          `🗣️ Shadowing: ${targetLevel} darajasidagi audio dialog tinglang va aynan qaytaring`,
        );
      }
      break;
    case 'Reading':
      if (phase === 1) {
        tasks.push(`📰 Qisqa Yapon matnini o'qing (N5/N4 daraja), noma'lum so'zlarni belgilang`);
      } else if (phase === 2) {
        tasks.push(
          `📰 ${targetLevel} daraja reading passage: 200-300 so'zlik matnni o'qib, savollarga javob bering`,
        );
      } else {
        tasks.push(
          `📰 JLPT ${targetLevel} Mock Reading: vaqt taymer bilan to'liq reading section ishlang`,
        );
      }
      break;
    case 'Listening':
      tasks.push(
        `👂 ${targetLevel} daraja audio tinglang: ${phase === 3 ? 'Mock Listening test' : 'dialog yoki monolog'}, asosiy ma'lumotlarni yozib oling`,
      );
      break;
    case 'Grammar':
      if (grammarChunk.length > 0) {
        tasks.push(
          `📝 Grammatika amaliyoti: 【${grammarChunk[0].title}】 qoidasidan foydalanib 5 ta yangi jumla tuzing, har biri turli kontekstda bo'lsin`,
        );
      }
      break;
    case 'Kanji':
      if (kanjiChunk.length > 0) {
        tasks.push(
          `✍️ Kanji yozish mashqi: ${kanjiChunk
            .slice(0, 3)
            .map((k) => k.kanji)
            .join(', ')} — har birini 10 marta yozing va so'z birikmalarida qo'llang`,
        );
      }
      break;
    case 'Vocabulary':
    default:
      if (vocabChunk.length > 0) {
        const extraVocab = vocabChunk
          .slice(4, 7)
          .map((v) => `${v.front}(${v.back})`)
          .join('、 ');
        if (extraVocab) {
          tasks.push(
            `🃏 Flashcard yarating: ${extraVocab} — Anki yoki ilovadagi Flashcard bo'limiga qo'shing`,
          );
        }
      }
      tasks.push(`🔄 Spaced Repetition: bugungi barcha yangi so'zlarni kechqurun qayta tekshiring`);
      break;
  }

  return tasks;
}

// ─── Special goal plan helpers ────────────────────────────────────────────────
const KAIWA_PHRASES = [
  {
    front: 'はじめまして',
    back: 'Tanishganimdan xursandman',
    romaji: 'Hajimemashite',
    example: 'はじめまして、ファルホドと申します。',
  },
  {
    front: 'お世話になっております',
    back: 'Yordamingiz uchun tashakkur (biznes)',
    romaji: 'Osewa ni natte orimasu',
    example: 'いつもお世話になっております。',
  },
  {
    front: 'なるほど',
    back: 'Tushunarli / Haqiqatdan shunday',
    romaji: 'Naruhodo',
    example: 'なるほど、そういうことですね。',
  },
  {
    front: 'そうですね',
    back: "Shunday-a / To'g'ri aytasiz",
    romaji: 'Sou desu ne',
    example: 'そうですね、私もそう思います。',
  },
  {
    front: 'ちょっとよろしいでしょうか',
    back: "Bir daqiqa vaqtingizni olsam bo'ladimi?",
    romaji: 'Chotto yoroshii deshou ka',
    example: '今、ちょっとよろしいでしょうか？',
  },
  {
    front: 'かしこまりました',
    back: "Tushundim / Xo'p bo'ladi (rasmiy)",
    romaji: 'Kashikomarimashita',
    example: 'はい、かしこまりました。',
  },
  {
    front: 'お疲れ様です',
    back: 'Mehnat qildingiz (ishda hurmat bilan)',
    romaji: 'Otsukaresama desu',
    example: 'お疲れ様です、ミーティングを終わりましょう。',
  },
  {
    front: 'よろしくお願いします',
    back: "Iltimos, ko'mak bering / E'tiboringiz uchun",
    romaji: 'Yoroshiku onegaishimasu',
    example: '今後ともよろしくお願いします。',
  },
  {
    front: '少々お待ちください',
    back: 'Bir ozgina kuting (rasmiy)',
    romaji: 'Shoushou omachi kudasai',
    example: '少々お待ちください、確認いたします。',
  },
  {
    front: 'おかげさまで',
    back: 'Sizning yordamingiz tufayli',
    romaji: 'Okagesama de',
    example: 'おかげさまで、元気になりました。',
  },
  {
    front: '失礼いたします',
    back: "Uzr so'raman / Chiqish uchun",
    romaji: 'Shitsurei itashimasu',
    example: 'お先に失礼いたします。',
  },
  {
    front: 'ご確認ください',
    back: "Tekshirib ko'ring iltimos",
    romaji: 'Go-kakunin kudasai',
    example: '添付ファイルをご確認ください。',
  },
];

const MENSETSU_PHRASES = [
  {
    front: '自己PR',
    back: "O'zini namoyon qilish / Kuchli taraflar",
    romaji: 'Jiko PR',
    example: '私の自己PRをお話しさせていただきます。',
  },
  {
    front: '志望動機',
    back: 'Kompaniyaga topshirish sababi',
    romaji: 'Shibou douki',
    example: '貴社を志望した理由は二つあります。',
  },
  {
    front: '長所と短所',
    back: 'Yutuqlar va kamchiliklar',
    romaji: 'Chousho to tansho',
    example: '私の長所は粘り強いところです。',
  },
  {
    front: '御社',
    back: "Sizning kompaniyangiz (og'zaki biznes)",
    romaji: 'Onsha',
    example: '御社の事業内容に強く惹かれました。',
  },
  {
    front: '貴社',
    back: 'Sizning kompaniyangiz (yozma biznes)',
    romaji: 'Kisha',
    example: '貴社に入社することが私の夢です。',
  },
  {
    front: '入社',
    back: 'Kompaniyaga kirish',
    romaji: 'Nyuusha',
    example: '入社後は積極的に貢献したいです。',
  },
  {
    front: 'やりがい',
    back: "Maqsad / Ma'noli ish",
    romaji: 'Yarigai',
    example: 'やりがいのある仕事をしたいです。',
  },
  {
    front: 'チームワーク',
    back: 'Jamoada ishlash',
    romaji: 'Chiimu waaku',
    example: 'チームワークを大切にしています。',
  },
  {
    front: '目標',
    back: 'Maqsad',
    romaji: 'Mokuhyou',
    example: '私の目標は5年後に管理職になることです。',
  },
  {
    front: '経験を活かす',
    back: 'Tajribadan foydalanish',
    romaji: 'Keiken o ikasu',
    example: '前職の経験を活かして貢献したいです。',
  },
];

// ─── MAIN FUNCTION ─────────────────────────────────────────────────────────────
export const generateAlgorithmicJlptPlan = async (
  _currentLevel: string,
  targetLevel: string,
  durationDays: number,
  planType: string = 'jlpt',
  specialGoal: string = '',
): Promise<JlptStudyPlanDay[]> => {
  // 1. Get data pools for target level
  const kanjiForLevel = JLPT_KANJI_DATABASE.filter((k) => {
    if (targetLevel === 'N3') return ['N5', 'N4', 'N3'].includes(k.level);
    if (targetLevel === 'N2') return ['N5', 'N4', 'N3', 'N2'].includes(k.level);
    if (targetLevel === 'N1') return true;
    return k.level === targetLevel;
  });

  const grammarForLevel = JLPT_GRAMMAR_DATABASE.filter((g) => {
    if (targetLevel === 'N3') return ['N5', 'N4', 'N3'].includes(g.level);
    if (targetLevel === 'N2') return ['N5', 'N4', 'N3', 'N2'].includes(g.level);
    if (targetLevel === 'N1') return true;
    return g.level === targetLevel;
  });

  const normalizedTargetLevel = (targetLevel || 'N5').toUpperCase() as JlptDeckLevel;
  const levelDecks = await loadPresetDecksByLevel(normalizedTargetLevel);
  const vocabDecks = levelDecks.filter(
    (d) => d.level === normalizedTargetLevel && d.id.includes('vocab'),
  );
  const vocabForLevel = vocabDecks.flatMap((d) => d.cards.filter((c) => c.type === 'vocab'));

  // 2. Items per day calculations — minimum 3 vocab, 1-2 grammar, 2-3 kanji
  const KANJI_PER_DAY = Math.max(2, Math.min(5, Math.ceil(kanjiForLevel.length / durationDays)));
  const GRAMMAR_PER_DAY = Math.max(
    1,
    Math.min(3, Math.ceil(grammarForLevel.length / durationDays)),
  );
  const VOCAB_PER_DAY = Math.max(5, Math.min(10, Math.ceil(vocabForLevel.length / durationDays)));

  // Focus area rotation
  const FOCUS_ROTATION: Array<
    'Kanji' | 'Vocabulary' | 'Grammar' | 'Reading' | 'Listening' | 'Speaking'
  > = ['Vocabulary', 'Kanji', 'Grammar', 'Vocabulary', 'Reading', 'Listening', 'Speaking'];

  const dailyPlan: JlptStudyPlanDay[] = [];

  for (let day = 1; day <= durationDays; day++) {
    const phase = getPhaseNumber(day, durationDays);
    const phaseLabel = getPhaseLabel(phase, targetLevel);
    const isMockDay = day % 7 === 0; // Every 7th day is mock/review

    let focusArea: 'Kanji' | 'Vocabulary' | 'Grammar' | 'Reading' | 'Listening' | 'Speaking';
    let dayTitle: string;
    let dayVocab: any[] = [];
    let dayKanji: any[] = [];
    let dayGrammar: any[] = [];
    let tasks: string[] = [];

    if (planType === 'special') {
      // ── SPECIAL GOAL PLANS ───────────────────────────────────────────
      if (specialGoal === 'kaiwa') {
        focusArea = day % 2 === 0 ? 'Speaking' : 'Listening';
        const vSlice = KAIWA_PHRASES.slice(
          ((day - 1) * 2) % KAIWA_PHRASES.length,
          (((day - 1) * 2) % KAIWA_PHRASES.length) + 3,
        );
        dayVocab = vSlice;
        dayTitle = `🗣️ Kaiwa: ${phaseLabel} (Kun ${day})`;

        const phraseList = vSlice.map((v) => `「${v.front}」(${v.back})`).join('、 ');
        tasks = [
          `📖 Bugungi muloqot iboralari: ${phraseList} — ma'nosini yodlang va talaffuz qiling`,
          `✏️ Har bir iborani ishlatib 2 ta jumla tuzing va yozing`,
          `🗣️ AI Coach bilan 15 daqiqa jonli suhbat: bugungi iboralarni gapda qo'llang`,
          `👂 Yapon tilida dialog tinglang va shadowing (aynan qaytarish) mashqi bajaring`,
          `🔄 Kecha o'rganilgan iboralarni qaytadan aytib tekshiring`,
        ];

        // Supplementary grammar from JLPT database for kaiwa context
        if (grammarForLevel.length > 0) {
          const g = grammarForLevel[(day - 1) % grammarForLevel.length];
          dayGrammar = [{ rule: g.title, explanation: g.meaningUz, example: g.examples?.[0]?.ja }];
          tasks.splice(
            1,
            0,
            `✏️ Grammatika: 【${g.title}】 — ${g.meaningUz}. Kaiwa suhbatida shu qoidani qo'llang`,
          );
        }
      } else if (specialGoal === 'mensetsu') {
        focusArea = 'Speaking';
        const vSlice = MENSETSU_PHRASES.slice(
          ((day - 1) * 2) % MENSETSU_PHRASES.length,
          (((day - 1) * 2) % MENSETSU_PHRASES.length) + 2,
        );
        dayVocab = vSlice;
        dayTitle = `💼 Mensetsu Tayyorlik: ${phaseLabel} (Kun ${day})`;

        const phraseList = vSlice.map((v) => `「${v.front}」(${v.back})`).join('、 ');
        tasks = [
          `📖 Intervyu terminlari: ${phraseList} — rasmiy ishlatilishini va misol gapni yodlang`,
          `🗣️ Jikoshoukai (O'z-o'zini tanishtirish): taymer bilan 1 daqiqa gapiring, hech to'xtamang`,
          `✏️ Keigo (Hushmomila) shakllari: ます→ます、ください→くださいませ farqlarini o'rganing`,
          `🎤 Klassik intervyu savollariga javob tayyorlang: "なぜ弊社を志望しましたか？" (Nega bizning kompaniyaga?)`,
          `🔄 Ovoz yozuvi: javobingizni yozib, talaffuz va tezlikni tekshiring`,
        ];

        if (grammarForLevel.length > 0) {
          const g = grammarForLevel[(day - 1) % grammarForLevel.length];
          dayGrammar = [{ rule: g.title, explanation: g.meaningUz, example: g.examples?.[0]?.ja }];
          tasks.splice(
            1,
            0,
            `✏️ Grammatika (Keigo): 【${g.title}】 — ${g.meaningUz}. Intervyu gaplarida qo'llang`,
          );
        }
      } else if (specialGoal === 'dokkai') {
        focusArea = 'Reading';
        const startG = ((day - 1) * GRAMMAR_PER_DAY) % grammarForLevel.length;
        const gSlice = grammarForLevel.slice(startG, startG + GRAMMAR_PER_DAY);
        const startV = ((day - 1) * VOCAB_PER_DAY) % (vocabForLevel.length || 1);
        const vSlice = vocabForLevel.slice(startV, startV + VOCAB_PER_DAY);

        dayGrammar = gSlice.map((g) => ({
          rule: g.title,
          explanation: g.meaningUz,
          example: g.examples?.[0]?.ja,
        }));
        dayVocab = vSlice.map((v) => ({
          word: v.front,
          reading: v.romaji || '',
          meaning: v.back,
          example: v.example,
        }));
        dayTitle = `📖 Dokkai Mutolaa: ${phaseLabel} (Kun ${day})`;

        const grammarStr =
          gSlice.length > 0
            ? gSlice.map((g) => `【${g.title}】`).join('、')
            : "o'tilgan grammatika";
        const vocabStr =
          vSlice.length > 0
            ? vSlice
                .slice(0, 4)
                .map((v) => `${v.front}(${v.back})`)
                .join('、 ')
            : "lug'at so'zlari";
        tasks = [
          `📖 Lug'at yodlash: ${vocabStr} — matnda uchragan so'zlarni tezda anglash uchun`,
          `✏️ Grammatika: ${grammarStr} — ushbu qurilmalar matnda qanday ishlatilishini ko'ring`,
          `📰 ${targetLevel} darajali matnni o'qing: noma'lum so'zlarni avval kontekst orqali taxmin qiling`,
          `🔍 Matndan ${grammarStr} qurilmasini topib, rang bilan belgilang`,
          phase === 3
            ? `⏱️ JLPT Mock Reading: vaqt taymer bilan rasmiy reading section ishlang`
            : `📝 Matni xulosa qiling: asosiy fikrni o'zbekchaga tarjima qiling`,
        ];
      } else if (specialGoal === 'kanji') {
        focusArea = 'Kanji';
        const startK = ((day - 1) * KANJI_PER_DAY) % (kanjiForLevel.length || 1);
        const kSlice = kanjiForLevel.slice(startK, startK + KANJI_PER_DAY);
        dayKanji = kSlice.map((k) => ({
          kanji: k.kanji,
          meaning: k.meaningUz,
          onyomi: k.onyomi,
          kunyomi: k.kunyomi,
        }));
        dayTitle = `⛩️ Kanji Intensiv: ${phaseLabel} (Kun ${day})`;

        const kanjiStr = kSlice
          .slice(0, 4)
          .map((k) => {
            const ex = k.examples?.[0] ? `(${k.examples[0].word}:${k.examples[0].meaning})` : '';
            return `${k.kanji}[${k.meaningUz}]${ex}`;
          })
          .join('、 ');
        const onyomiStr = kSlice
          .slice(0, 3)
          .map((k) => `${k.kanji}: ${k.onyomi || '-'}`)
          .join(', ');
        const kunyomiStr = kSlice
          .slice(0, 3)
          .map((k) => `${k.kanji}: ${k.kunyomi || '-'}`)
          .join(', ');

        tasks = [
          `⛩️ Bugungi kanjiler: ${kanjiStr} — ma'nosini yodlang`,
          `✍️ On'yomi takrori: ${onyomiStr} — har birini 5 marta yozing`,
          `✍️ Kun'yomi takrori: ${kunyomiStr} — har birini 5 marta yozing`,
          `📝 So'z birikmasi: har kanji bilan kamida 1 ta so'z yozing (lug'atdan)`,
          phase === 3
            ? `⏱️ JLPT ${targetLevel} Mock Kanji section: rasmiy mashq ishlang`
            : `🃏 Flashcard: bugungi kanjilarni kalit ishora bilan esda qolish usulini ixtiro qiling`,
        ];
      } else {
        // Custom special goal
        focusArea = FOCUS_ROTATION[(day - 1) % FOCUS_ROTATION.length];
        const cleanGoal =
          specialGoal.length > 35 ? specialGoal.substring(0, 35) + '...' : specialGoal;
        dayTitle = `🎯 ${cleanGoal}: ${phaseLabel} (Kun ${day})`;

        const startV = ((day - 1) * VOCAB_PER_DAY) % Math.max(1, vocabForLevel.length);
        const vSlice = vocabForLevel.slice(startV, startV + VOCAB_PER_DAY);
        dayVocab = vSlice.map((v) => ({
          word: v.front,
          reading: v.romaji || '',
          meaning: v.back,
          example: v.example,
        }));
        const vocabStr =
          vSlice.length > 0
            ? vSlice
                .slice(0, 4)
                .map((v) => `${v.front}(${v.back})`)
                .join('、 ')
            : `${targetLevel} daraja so'zlari`;

        const g =
          grammarForLevel.length > 0 ? grammarForLevel[(day - 1) % grammarForLevel.length] : null;
        if (g)
          dayGrammar = [{ rule: g.title, explanation: g.meaningUz, example: g.examples?.[0]?.ja }];

        tasks = [
          `📖 Lug'at yodlash: ${vocabStr} — ${cleanGoal} maqsadi kontekstida o'rganing`,
          g
            ? `✏️ Grammatika: 【${g.title}】 — ${g.meaningUz}. Maqsadga bog'liq gapda qo'llang`
            : `✏️ Grammatika: o'tilgan ${targetLevel} qoidalarini takrorlang`,
          `🗣️ AI Coach bilan suhbat: "${cleanGoal}" mavzusida so'zlarni ishlatib gapiring`,
          `📰 Mavzuga oid matn o'qing yoki dialog tinglang`,
          `🃏 Flashcard yarating: bugungi so'zlarni saqlang`,
        ];
      }
    } else {
      // ── STANDARD JLPT LEVEL PLAN ──────────────────────────────────────
      const startKanji = ((day - 1) * KANJI_PER_DAY) % Math.max(1, kanjiForLevel.length);
      const kanjiChunk = kanjiForLevel.slice(startKanji, startKanji + KANJI_PER_DAY);
      // Wrap around
      const kanjiWrap =
        kanjiChunk.length < KANJI_PER_DAY
          ? [...kanjiChunk, ...kanjiForLevel.slice(0, KANJI_PER_DAY - kanjiChunk.length)]
          : kanjiChunk;

      const startGrammar = ((day - 1) * GRAMMAR_PER_DAY) % Math.max(1, grammarForLevel.length);
      const grammarChunk = grammarForLevel.slice(startGrammar, startGrammar + GRAMMAR_PER_DAY);
      const grammarWrap =
        grammarChunk.length < GRAMMAR_PER_DAY
          ? [...grammarChunk, ...grammarForLevel.slice(0, GRAMMAR_PER_DAY - grammarChunk.length)]
          : grammarChunk;

      const startVocab = ((day - 1) * VOCAB_PER_DAY) % Math.max(1, vocabForLevel.length);
      const vocabChunk = vocabForLevel.slice(startVocab, startVocab + VOCAB_PER_DAY);
      const vocabWrap =
        vocabChunk.length < VOCAB_PER_DAY
          ? [...vocabChunk, ...vocabForLevel.slice(0, VOCAB_PER_DAY - vocabChunk.length)]
          : vocabChunk;

      // Focus area based on phase
      if (isMockDay) {
        focusArea = 'Reading';
      } else if (phase === 1) {
        focusArea = FOCUS_ROTATION[(day - 1) % 3] as any; // Vocab/Kanji/Grammar rotation
      } else if (phase === 2) {
        focusArea = FOCUS_ROTATION[(day - 1) % FOCUS_ROTATION.length];
      } else {
        // Phase 3: more reading/listening (exam-like)
        focusArea = [
          'Reading',
          'Listening',
          'Grammar',
          'Vocabulary',
          'Kanji',
          'Reading',
          'Listening',
        ][(day - 1) % 7] as any;
      }

      dayTitle = isMockDay
        ? `Kun ${day}: 🎯 Haftalik Mock & Tahlil — ${phaseLabel}`
        : `Kun ${day}: ${focusArea} — ${phaseLabel}`;

      dayKanji = kanjiWrap.map((k) => ({
        kanji: k.kanji,
        meaning: k.meaningUz,
        onyomi: k.onyomi,
        kunyomi: k.kunyomi,
      }));
      dayGrammar = grammarWrap.map((g) => ({
        rule: g.title,
        explanation: g.meaningUz + (g.structure ? `\n\nTuzilishi: ${g.structure}` : ''),
        example: g.examples?.[0] ? `${g.examples[0].ja} — ${g.examples[0].uz}` : '',
      }));
      dayVocab = vocabWrap.map((v) => ({
        word: v.front,
        reading: (v as any).romaji || (v as any).furigana || '',
        meaning: v.back,
        example: (v as any).example,
      }));

      tasks = buildJlptDailyTasks(
        day,
        phase,
        targetLevel,
        kanjiWrap,
        grammarWrap,
        vocabWrap,
        focusArea,
        isMockDay,
      );
    }

    dailyPlan.push({
      day,
      title: dayTitle,
      focusArea,
      tasks,
      pomodoroTargetMinutes: phase === 3 ? 90 : 60,
      vocabularyList: dayVocab.length > 0 ? dayVocab : undefined,
      grammarNotes: dayGrammar.length > 0 ? dayGrammar : undefined,
      kanjiList: dayKanji.length > 0 ? dayKanji : undefined,
    });
  }

  return dailyPlan;
};
