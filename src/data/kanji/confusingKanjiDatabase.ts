export interface ConfusingKanjiPair {
  id: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  kanjiA: {
    char: string;
    reading: string;
    meaningUz: string;
    meaningJa: string;
    radical: string;
    radicalMeaning: string;
    commonCompounds: string[]; // e.g. ["待合室", "期待"]
  };
  kanjiB: {
    char: string;
    reading: string;
    meaningUz: string;
    meaningJa: string;
    radical: string;
    radicalMeaning: string;
    commonCompounds: string[]; // e.g. ["保持", "気持ち"]
  };
  keyDifference: {
    uz: string;
    ja: string;
  };
  mnemonic: {
    uz: string;
    ja: string;
  };
  practiceQuestion: {
    sentence: string; // blank with （　）
    correctChar: string;
    options: string[];
    explanationUz: string;
  };
}

export const CONFUSING_KANJI_PAIRS: ConfusingKanjiPair[] = [
  {
    id: 'ck_1_matsu_motsu',
    level: 'N5',
    kanjiA: {
      char: '待',
      reading: 'まつ (matsu) / タイ (tai)',
      meaningUz: 'Kutmoq',
      meaningJa: '待つ・期待',
      radical: '彳 (gyouninben - qadam/yo‘l)',
      radicalMeaning: 'Yo‘lda to‘xtab kutish ma’nosini beradi',
      commonCompounds: ['期待[きたい] (umid/kutish)', '待合室[まちあいしつ] (kutish zali)'],
    },
    kanjiB: {
      char: '持',
      reading: 'もつ (motsu) / ジ (ji)',
      meaningUz: 'Ushlamoq, ega bo‘lmoq',
      meaningJa: '持つ・維持',
      radical: '扌 (tehen - qo‘l)',
      radicalMeaning: 'Qo‘l bilan ushlash, saqlash ma’nosini beradi',
      commonCompounds: ['気持[きも]ち (kayfiyat)', '維持[いじ] (saqlab turish)'],
    },
    keyDifference: {
      uz: 'Chap tomondagi radikal: 待 da 彳 (qadam/yo‘l), 持 da esa 扌 (qo‘l/ushlamoq).',
      ja: '偏の違い：待は行徳偏（彳・道を行く）、持は手偏（扌・手で持つ）。',
    },
    mnemonic: {
      uz: 'Yo‘lda (彳) kutiladi (待), qo‘l bilan (扌) ushlanadi (持).',
      ja: '道で待つ（待）、手で持つ（持）。',
    },
    practiceQuestion: {
      sentence: '駅[えき]の前[まえ]で 友達[ともだち]を （　）っています。',
      correctChar: '待',
      options: ['待', '持', '特', '寺'],
      explanationUz: 'Do‘stni stantsiya oldida "kutmoq" ma’nosi uchun 待 (待つ) to‘g‘ri bo‘ladi.',
    },
  },
  {
    id: 'ck_2_hidari_migi',
    level: 'N5',
    kanjiA: {
      char: '左',
      reading: 'ひだり (hidari) / サ (sa)',
      meaningUz: 'Chap tomon',
      meaningJa: '左側',
      radical: '工 (hunar/asbob)',
      radicalMeaning: 'Ish asbobi (chap qo‘l yordamchi asbob ushlagan)',
      commonCompounds: ['左手[ひだりて] (chap qo‘l)', '左右[さゆう] (chap va o‘ng)'],
    },
    kanjiB: {
      char: '右',
      reading: 'みぎ (migi) / ウ・ユウ (u, yuu)',
      meaningUz: 'O‘ng tomon',
      meaningJa: '右側',
      radical: '口 (og‘iz)',
      radicalMeaning: 'Og‘iz (o‘ng qo‘l ovqat yeyishda og‘izga olib boradi)',
      commonCompounds: ['右手[みぎて] (o‘ng qo‘l)', '右折[うせつ] (o‘ngga burilish)'],
    },
    keyDifference: {
      uz: 'Pastki qism: 左 da 工 (ish), 右 da esa 口 (og‘iz) joylashgan.',
      ja: '左は下が「工」、右は下が「口」。筆順の1画目も異なる。',
    },
    mnemonic: {
      uz: 'O‘ng qo‘l bilan og‘izga (口) ovqat yeyiladi -> 右.',
      ja: '右手で口（口）に運ぶ＝右、左手は工（工）具を持つ＝左。',
    },
    practiceQuestion: {
      sentence: '交差点[こうさてん]を （　）に 曲[ま]がってください。',
      correctChar: '右',
      options: ['右', '左', '石', '古'],
      explanationUz: 'O‘ngga burilish ma’nosida 右 (みぎ) ishlatiladi.',
    },
  },
  {
    id: 'ck_3_shiro_mizukara',
    level: 'N5',
    kanjiA: {
      char: '白',
      reading: 'しろ (shiro) / ハク (haku)',
      meaningUz: 'Oq rang',
      meaningJa: '白い・純白',
      radical: '白 (oq)',
      radicalMeaning: 'Toza yorug‘lik nuri',
      commonCompounds: ['白黒[しろくろ] (oq-qora)', '告白[こくはく] (tan olish)'],
    },
    kanjiB: {
      char: '自',
      reading: 'みずか・ら (mizukara) / ジ・シ (ji, shi)',
      meaningUz: 'O‘zi, mustaqil',
      meaningJa: '自分・自身',
      radical: '自 (burun/o‘zi)',
      radicalMeaning: 'Burun tasviri (yaponlar o‘ziga ishora qilganda burunga ko‘rsatadi)',
      commonCompounds: ['自分[じぶん] (o‘zi)', '自信[じしん] (ishonch)'],
    },
    keyDifference: {
      uz: '自 ieroglifida 白 ga nisbatan ichida bitta ortiqcha gorizontal chiziq bor.',
      ja: '白は横線が1本、自は横線が2本（目に似た形）。',
    },
    mnemonic: {
      uz: 'O‘zingizni ko‘rsatganda burninizga ishora qilasiz (自); quyosh nuri kabi oq narsa esa 白.',
      ja: '自分を指す鼻の形＝自、純粋な光＝白。',
    },
    practiceQuestion: {
      sentence: '（　）分[ぶん]の 力[ちから]で 頑張[がんば]りましょう。',
      correctChar: '自',
      options: ['自', '白', '百', '目'],
      explanationUz: 'O‘z kuchi bilan (自分の力で) birikmasi uchun 自 to‘g‘ri.',
    },
  },
  {
    id: 'ck_4_atsui_atsui',
    level: 'N4',
    kanjiA: {
      char: '暑',
      reading: 'あつ・い (atsui) / ショ (sho)',
      meaningUz: 'Issiq (ob-havo, iqlim)',
      meaningJa: '気温が高い（暑い気候）',
      radical: '日 (quyosh)',
      radicalMeaning: 'Tepasida quyosh (日) bor — osmon va havo harorati',
      commonCompounds: ['猛暑[もうしょ] (qattiq jazirama)', '残暑[ざんしょ] (kuzgi issiq)'],
    },
    kanjiB: {
      char: '熱',
      reading: 'あつ・い (atsui) / ネツ (netsu)',
      meaningUz: 'Issiq (choy, ovqat, tana harorati)',
      meaningJa: '物体の温度が高い・発熱',
      radical: '灬 (renga - olov)',
      radicalMeaning: 'Pastida olov (灬) bor — narsaning qizishi',
      commonCompounds: [
        '熱気[ねっき] (issiq havo/jo‘shqinlik)',
        '高熱[こうねつ] (yuqori tana harorati)',
      ],
    },
    keyDifference: {
      uz: '暑 faqat ob-havo uchun (日 - quyosh); 熱 esa ovqat, choy, qizigan jism yoki isitma uchun (灬 - olov).',
      ja: '暑いは気候・天気、熱いは物体や体温。',
    },
    mnemonic: {
      uz: 'Tepada quyosh (日) bo‘lsa ob-havo issiq (暑), pastda olov (灬) bo‘lsa choy qaynoq (熱).',
      ja: 'お日様（日）で暑い夏、火（灬）で熱いお茶。',
    },
    practiceQuestion: {
      sentence: '夏[なつ]は 毎日[まいにち] とても （　）いです。',
      correctChar: '暑',
      options: ['暑', '熱', '厚', '温'],
      explanationUz: 'Yoz faslidagi ob-havo issiqligi uchun 暑 (暑い) tanlanadi.',
    },
  },
  {
    id: 'ck_5_ima_matsu',
    level: 'N4',
    kanjiA: {
      char: '未',
      reading: 'いま・だ (imada) / ミ (mi)',
      meaningUz: 'Hali emas, tugallanmagan',
      meaningJa: 'まだ〜ない・未完成',
      radical: '木 (daraxt)',
      radicalMeaning: 'Daraxtning yuqori shoxi hali o‘smagan',
      commonCompounds: [
        '未来[みらい] (kelajak - hali kelmagan)',
        '未成年[みせいねん] (balog‘atga yetmagan)',
      ],
    },
    kanjiB: {
      char: '末',
      reading: 'すえ (sue) / マツ (matsu)',
      meaningUz: 'Oxiri, yakuni',
      meaningJa: 'おわり・結末',
      radical: '木 (daraxt)',
      radicalMeaning: 'Daraxtning tepa shoxi to‘liq cho‘zilgan/eng chekka uchi',
      commonCompounds: ['月末[げつまつ] (oyning oxiri)', '年末[ねんまつ] (yil yakuni)'],
    },
    keyDifference: {
      uz: '未 da yuqori chiziq kalta, pastki chiziq uzun; 末 da esa yuqori chiziq uzunroq.',
      ja: '未は上が短く下が長い。末は上が長く下が短い。',
    },
    mnemonic: {
      uz: 'Hali yosh (未) — tepasi kalta; oxiriga yetgan (末) — tepasi uzun.',
      ja: '未熟だから上は短い（未）、末広がりで上が長い（末）。',
    },
    practiceQuestion: {
      sentence: '今月[こんげつ]の （　）に テストが あります。',
      correctChar: '末',
      options: ['末', '未', '木', '本'],
      explanationUz: 'Oyning oxiri (月末 - げつまつ) so‘zida 末 ishlatiladi.',
    },
  },
  {
    id: 'ck_6_kasu_kariru',
    level: 'N4',
    kanjiA: {
      char: '貸',
      reading: 'か・す (kasu) / タイ (tai)',
      meaningUz: 'Qarz bermoq, ijaraga bermoq',
      meaningJa: '貸す・賃貸',
      radical: '貝 (chig‘anoq/pul)',
      radicalMeaning: 'Boshqa odamga pul/mulk berish',
      commonCompounds: ['貸出[かしだし] (berish/prokat)', '賃貸[ちんたい] (ijaraga berish)'],
    },
    kanjiB: {
      char: '借',
      reading: 'か・りる (kariru) / シャク (shaku)',
      meaningUz: 'Qarz olmoq, ijaraga olmoq',
      meaningJa: '借りる・借金',
      radical: '亻 (ninben - odam)',
      radicalMeaning: 'Odamdan biror narsani so‘rab olish',
      commonCompounds: ['借金[しゃっきん] (qarz pul)', '借用[しゃくよう] (qarzga olish)'],
    },
    keyDifference: {
      uz: '貸 tepasida 代 (o‘rniga), pastida 貝 (pul); 借 chapida esa 亻 (odam) joylashgan.',
      ja: '貸す（代＋貝：お金を他人に渡す）、借りる（亻＋昔：人から借りる）。',
    },
    mnemonic: {
      uz: 'Pulingizni (貝) birovga berasiz -> 貸; Odamdan (亻) qarz olasiz -> 借.',
      ja: 'お金（貝）を貸す、人（亻）から借りる。',
    },
    practiceQuestion: {
      sentence: '図書館[としょかん]で 本[ほん]を 3冊[さんさつ] （　）りました。',
      correctChar: '借',
      options: ['借', '貸', '買', '賃'],
      explanationUz: 'Kutubxonadan kitob "qarzga oldim" (借りる) bo‘lgani uchun 借 to‘g‘ri.',
    },
  },
  {
    id: 'ck_7_chisa_shirushi',
    level: 'N3',
    kanjiA: {
      char: '微',
      reading: 'かす・か (kasuka) / ビ (bi)',
      meaningUz: 'Juda nozik, mayda, bilinmas',
      meaningJa: 'かすか・微小・微妙',
      radical: '彳 (gyouninben)',
      radicalMeaning: 'O‘rtasida 山 + 一 (kichik tepalik)',
      commonCompounds: ['微妙[びみょう] (nozik farqli)', '微細[びさい] (juda mayda)'],
    },
    kanjiB: {
      char: '徴',
      reading: 'チョウ (chou)',
      meaningUz: 'Belgi, yig‘ish, nishona',
      meaningJa: 'しるし・徴収・特徴',
      radical: '彳 (gyouninben)',
      radicalMeaning: 'O‘rtasida 山 o‘rniga 王 (hukmdor/belgi)',
      commonCompounds: [
        '特徴[とくちょう] (o‘ziga xos xususiyat)',
        '徴収[ちょうしゅう] (yig‘ib olish)',
      ],
    },
    keyDifference: {
      uz: 'O‘rta qismiga e’tibor bering: 微 da tepada 山 va pastda 一 bor; 徴 da esa tepada 山 o‘rniga shoxsimon chiziqlar mavjud.',
      ja: '微の真ん中は山冠、徴の真ん中は「王」に似た形。',
    },
    mnemonic: {
      uz: 'Bilinmas mayda farq — 微妙 (bimyou); eng yaqqol xususiyat/belgi — 特徴 (tokuchou).',
      ja: 'かすかな差は微妙、目立つしるしは特徴。',
    },
    practiceQuestion: {
      sentence:
        'この製品[せいひん]の 最大[さいだい]の 特（　）は、軽[かる]くて 丈夫[じょうぶ]な 点[てん]です。',
      correctChar: '徴',
      options: ['徴', '微', '役', '徹'],
      explanationUz: 'Xususiyat (特徴 - とくちょう) so‘zida 徴 kanjisi ishlatiladi.',
    },
  },
  {
    id: 'ck_8_osameru_yameru',
    level: 'N3',
    kanjiA: {
      char: '治',
      reading: 'おさ・める (osameru) / ジ・チ (ji, chi)',
      meaningUz: 'Davolamoq, tinchlantirmoq, boshqarmoq',
      meaningJa: 'なおす・おさめる・治療・政治',
      radical: '氵 (sanzui - suv)',
      radicalMeaning: 'Suv toshqinini tartibga keltirib boshqarish',
      commonCompounds: ['治療[ちりょう] (davolash)', '政治[せいじ] (siyosat)'],
    },
    kanjiB: {
      char: '冶',
      reading: 'ヤ (ya)',
      meaningUz: 'Metall eritish, qoliplash',
      meaningJa: '溶かす・鍛える・冶金',
      radical: '冫 (nisui - muz)',
      radicalMeaning: 'Muz / sovitish va qotirish',
      commonCompounds: ['冶金[やきん] (metallurgiya)', '陶冶[とうや] (shaxsiyatni toblash)'],
    },
    keyDifference: {
      uz: 'Chap tomonda: 治 da 氵 (3 ta tomchi - suv); 冶 da esa 冫 (2 ta tomchi - muz).',
      ja: '治はさんずい（氵）、冶はにすい（冫）。',
    },
    mnemonic: {
      uz: 'Suv (氵) bilan dori ichib davolanasiz (治); metallni esa sovitib (冫) toblashadi (冶).',
      ja: '水（氵）を治める、氷（冫）で冷やし鍛える冶金。',
    },
    practiceQuestion: {
      sentence:
        '医師[いし]の 適切[てきせつ]な （　）療[りょう]のおかげで、病気[びょうき]が 完治[かんち]した。',
      correctChar: '治',
      options: ['治', '冶', '法', '油'],
      explanationUz: 'Davolash (治療 - ちりょう) so‘zida 治 (sanzui) kanjisi to‘g‘ri.',
    },
  },
  {
    id: 'ck_9_tanba_suteru',
    level: 'N3',
    kanjiA: {
      char: '拾',
      reading: 'ひろ・う (hirou) / シュウ (shuu)',
      meaningUz: 'Terib olmoq, topib olmoq',
      meaningJa: 'ひろう・収拾',
      radical: '扌 (tehen - qo‘l)',
      radicalMeaning: 'Qo‘l bilan narsalarni bir yerga to‘plamoq (合)',
      commonCompounds: ['拾得物[しゅうとくぶつ] (topib olingan narsa)', '拾い主 (topib oluvchi)'],
    },
    kanjiB: {
      char: '捨',
      reading: 'す・てる (suteru) / シャ (sha)',
      meaningUz: 'Tashlab yubormoq',
      meaningJa: 'すてる・廃棄',
      radical: '扌 (tehen - qo‘l)',
      radicalMeaning: 'O‘ng tomonda 舎 (bino/saroydan chiqarib tashlamoq)',
      commonCompounds: ['四捨五入[ししゃごにゅう] (yaxlitlash)', '見捨てる (tashlab ketmoq)'],
    },
    keyDifference: {
      uz: 'O‘ng tomon: 拾 da 合 (birlashtirmoq/yig‘moq); 捨 da esa 舎 joylashgan.',
      ja: '拾（手で合わせ拾う）、捨（手から離して捨てる）。',
    },
    mnemonic: {
      uz: 'Qo‘lga jamlash (合) — terib olish (拾); qo‘ldan chiqarish — tashlash (捨).',
      ja: '集めて拾う（拾）、手放して捨てる（捨）。',
    },
    practiceQuestion: {
      sentence: '道[みち]に 落[お]ちていた ゴミを （　）って、ゴミ箱[ばこ]に 入[い]れた。',
      correctChar: '拾',
      options: ['拾', '捨', '持', '指'],
      explanationUz: 'Yerdan axlatni "terib oldim" ma’nosida 拾 (拾う) to‘g‘ri.',
    },
  },
  {
    id: 'ck_10_utagau_modoki',
    level: 'N2',
    kanjiA: {
      char: '疑',
      reading: 'うたが・う (utagau) / ギ (gi)',
      meaningUz: 'Shubha qilmoq, gumonsiramoq',
      meaningJa: 'うたがう・疑問・疑惑',
      radical: '疋 (oyoq/to‘xtash)',
      radicalMeaning: 'Ikkilanish va noaniqlik',
      commonCompounds: ['疑問[ぎもん] (shubhali savol)', '容疑者[ようぎしゃ] (gumondor)'],
    },
    kanjiB: {
      char: '擬',
      reading: 'ギ (gi)',
      meaningUz: 'Taqlid qilmoq, o‘xshatmoq',
      meaningJa: 'なぞらえる・模擬・擬音語',
      radical: '扌 (tehen - qo‘l)',
      radicalMeaning: 'Qo‘l bilan o‘xshatib yasash',
      commonCompounds: [
        '模擬試験[もぎしけん] (mock exam / sinov imtihoni)',
        '擬態語[ぎたいご] (holat bildiruvchi taqlid so‘z)',
      ],
    },
    keyDifference: {
      uz: '擬 chap tomonida 扌 (tehen/qo‘l) bor, 疑 da esa bu radikal yo‘q.',
      ja: '疑に手偏（扌）がついたものが「擬」（手で似せること）。',
    },
    mnemonic: {
      uz: 'Dilda shubha qilmoq — 疑; Qo‘l bilan taqlid/simulyatsiya qilmoq — 擬 (模擬試験 - Mock exam).',
      ja: '心で疑う＝疑、手偏で似せて真似る＝擬。',
    },
    practiceQuestion: {
      sentence:
        '来週[らいしゅう]、本番[ほんばん]に 備[そな]えて （　）擬[ぎ]試験[しけん]を 受[う]けます。',
      correctChar: '模',
      options: ['模', '疑', '擬', '規'],
      explanationUz:
        'Sinov imtihoni "模擬試験" (もぎしけん) iborasida ikkinchi belgi 擬 (taqlid) hisoblanadi.',
    },
  },
];
