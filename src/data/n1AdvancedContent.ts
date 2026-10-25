import type { JlptReadingPassage, JlptReadingQuestion } from './jlptReadingData';

// ============================================================================
// 1. GAZETA VA EDITORIAL MATNLAR (社説 - SHASETSU)
// ============================================================================

export interface N1EditorialPassage {
  id: string;
  title: string;
  editorialSource: '日本経済新聞 社説風' | '朝日新聞 天声人語・社説風' | '読売新聞 編集手帳風';
  genre: 'social-political' | 'environmental-energy' | 'ai-ethics-democracy';
  japaneseContent: string;
  uzbekTranslation: string;
  recommendedMinutes: number;
  keyThemeUz: string;
  vocabularyHighlights: Array<{
    word: string;
    reading: string;
    meaningUz: string;
    nuanceNote: string;
  }>;
  questions: JlptReadingQuestion[];
}

export const N1_EDITORIAL_SHASETSU: N1EditorialPassage[] = [
  {
    id: 'n1_shasetsu_1',
    title:
      '社説[しゃせつ]：生成[せいせい]AIの 奔流[ほんりゅう]と 民主[みんしゅ]主義[しゅぎ]の 隘路[あいろ]',
    editorialSource: '日本経済新聞 社説風',
    genre: 'ai-ethics-democracy',
    recommendedMinutes: 8,
    keyThemeUz:
      "Sun'iy intellekt shiddati axborot maydonini soxtalashtirish orqali demokratik munozaralar asosiga putur yetkazmasligi uchun huquqiy tartib va media-savodxonlik uyg'unligi zarur.",
    vocabularyHighlights: [
      {
        word: '奔流',
        reading: 'ほんりゅう',
        meaningUz: "Shiddatli oqim, to'xtatib bo'lmas to'lqin",
        nuanceNote: "Texnologik o'zgarishlarning to'xtatib bo'lmas kuchini ifodalashda qo'llanadi.",
      },
      {
        word: '隘路',
        reading: 'あいろ',
        meaningUz: "Tor yo'lak, to'siq, chigal muammo",
        nuanceNote: "Katta maqsadga erishish yo'lidagi jiddiy konstruktiv to'siq.",
      },
      {
        word: '如実',
        reading: 'にょじつ',
        meaningUz: "Yaqqol, o'z holicha, yaqqol ko'rinib turgan",
        nuanceNote: "Haqiqat yoki muammoning ochiq-oydin fosh bo'lishi holatida keladi.",
      },
      {
        word: '乖離',
        reading: 'かいり',
        meaningUz: 'Uzoqlashish, tafovut, uzilish',
        nuanceNote: "Nazariya va amaliyot, yoki so'z bilan ish o'rtasidagi jiddiy jarlik.",
      },
      {
        word: '是々非々',
        reading: 'ぜぜひひ',
        meaningUz: "Xolisona, to'g'rini to'g'ri, noto'g'rini noto'g'ri deb baholash",
        nuanceNote: 'Bir tomonlama tarafkashlik qilmasdan, faktlarga asoslanish pozitsiyasi.',
      },
    ],
    japaneseContent: `生成[せいせい]人工知能[じんこうちのう]（AI）の 急速[きゅうそく]な 普及[ふきゅう]は、産業[さんぎょう]構造[こうぞう]の 抜本的[ばっぽんてき]な 変革[へんかく]を 促[うなが]す 一方[いっぽう]で、公論[こうろん]の 形成[けいせい]という 民主[みんしゅ]主義[しゅぎ]の 根幹[こんかん]を 揺[ゆ]るがしかねない 危機[きき]を 孕[はら]んでいる。
精巧[せいこう]を 極[きわ]めた ディープフェイクや 意図的[いとてき]に 偏向[へんこう]された 情報[じょうほう]が SNS上[じょう]を 席巻[せっけん]し、世論[せろん]の 分断[ぶんだん]を 煽[あお]る 事態[じたい]は、もはや 単なる 懸念[けねん]の 域[いき]を出て、現実[げんじつ]の 脅威[きょうい]として 如実[にょじつ]に 立[た]ち現[あらわ]れている。
表現[ひょうげん]の 自由[じゆう]を 担保[たんぽ]しつつ、いかにして 虚偽[きょぎ]情報[じょうほう]の 拡散[かくさん]に 歯止[はど]めをかけるか。技術[ぎじゅつ]革新[かくしん]の 恩恵[おんけい]と リスクの 抑制[よくせい]は 二律背反[にりつはいはん]の 隘路[あいろ]に見えるが、安易[あんい]な 規制[きせい]強化[きょうか]に 逃[に]げ込むことは 思考[しこう]停止[ていし]に 他[ほか]ならない。
真[しん]に 問[と]われているのは、法制度[ほうせいど]による プラットフォームへの 規律[きりつ]づけと、受容者[じゅようしゃ]たる 市民[しみん]一人[ひとり]ひとりが 情報[じょうほう]の 真偽[しんぎ]を 是々非々[ぜぜひひ]で 見極[みきわ]める メディアリテラシーの 涵養[かんよう]である。技術[ぎじゅつ]の 進展[しんてん]に 倫理[りんり]が 置[お]き去[ざ]りにされる 事態[じたい]だけは 断[だん]じて 避[さ]けねばならない。`,
    uzbekTranslation:
      "Generativ sun'iy intellektning shiddat bilan ommalashishi sanoat tuzilmasini tubdan o'zgartirishga turtki berayotgan bo'lsa-da, jamoatchilik fikrini shakllantirishdek demokratiyaning poydevorini larzaga solishi mumkin bo'lgan xatarlarni keltirib chiqarmoqda. O'ta mukammal darajadagi dipfeyklar va qasddan buzib ko'rsatilgan axborotlar ijtimoiy tarmoqlarni egallab, jamoatchilik parchalanishini kuchaytirayotgan vaziyat endi shunchaki xavotir chegarasidan chiqib, real tahdid sifatida yaqqol namoyon bo'lmoqda. So'z erkinligini kafolatlagan holda yolg'on axborotlar tarqalishini qanday jilovlash mumkin? Texnologik innovatsiyalar ne'mati va xatarlarni jilovlash bir-biriga zid to'siqdek tuyulsa-da, yengil-yelpi tartibga solish qoidalariga suyanib qolish aqlan to'xtab qolishdan boshqa narsa emas. Haqiqiy masala — platformalar ustidan qonuniy intizom o'rnatish va axborotni qabul qiluvchi har bir fuqaroning axborot haqqoniyligini xolisona baholay oladigan media-savodxonligini yuksaltirishdir. Texnologik taraqqiyotdan axloq va mas'uliyat ortda qolib ketishiga aslo yo'l qo'ymasligimiz shart.",
    questions: [
      {
        id: 'q_n1_shasetsu_1_1',
        questionText:
          '筆者[ひっしゃ]が「思考[しこう]停止[ていし]に他[ほか]ならない」と 批判[ひはん]しているのは どのような 姿勢[しせい]か。',
        options: [
          'ディープフェイクなどの 虚偽[きょぎ]情報[じょうほう]を 放置[ほうち]し 続[つづ]けること',
          '表現[ひょうげん]の 自由[じゆう]を 無視[むし]して 法制度[ほうせいど]のみに 頼[たよ]ること',
          '技術[ぎじゅつ]革新[かくしん]の リスクに対[たい]して、熟考[じゅっこう]せずに 単純[たんじゅん]な 規制[きせい]の 強化[きょうか]で 解決[かいけつ]を図[はか]ろうとすること',
          '市民[しみん]の リテラシー教育[きょういく]を 重視[じゅうし]しすぎるあまり 技術[ぎじゅつ]開発[かいはつ]を 停滞[ていたい]させること',
        ],
        correctIndex: 2,
        explanation:
          'Matnda "安易な規制強化に逃げ込むことは思考停止に他ならない" deb yozilgan, ya\'ni chuqur tahlil qilmay shunchaki cheklov va taqiqlarni kuchaytirish yechim emasligi ta\'kidlangan.',
      },
      {
        id: 'q_n1_shasetsu_1_2',
        questionText:
          'この 社説[しゃせつ]において、筆者[ひっしゃ]が 最[もっと]も 強調[きょうちょう]したい 主張[しゅちょう]は どれか。',
        options: [
          '生成[せいせい]AIの 開発[かいはつ]は 民主[みんしゅ]主義[しゅぎ]を 崩壊[ほうかい]させるため、直[ただ]ちに 禁止[きんし]すべきである',
          'プラットフォームの 法的[ほうてき]規律[きりつ]と 市民[しみん]の メディアリテラシーの 双方[そうほう]を 高[たか]めることで、情報[じょうほう]の 脅威[きょうい]に 対峙[たいじ]すべきである',
          'SNSの 普及[ふきゅう]を 制限[せいげん]し、旧来[きゅうらい]の 活字[かつじ]メディアへ 回帰[かいき]することが 唯一[ゆいいつ]の 解決[かいけつ]策[さく]である',
          '表現[ひょうげん]の 自由[じゆう]を守[まも]るためには、情報[じょうほう]の 偏向[へんこう]や 偽造[ぎぞう]はある 程度[ていど] 容認[ようにん]せざるを 得[え]ない',
        ],
        correctIndex: 1,
        explanation:
          "So'nggi xulosa qismida platformalarga huquqiy talablar qo'yish bilan birga fuqarolarning axborotni xolisona saralay olish media-savodxonligini oshirish eng muhim yechim deb ko'rsatilgan.",
      },
    ],
  },
  {
    id: 'n1_shasetsu_2',
    title:
      '社説[しゃせつ]：人口[じんこう]急減[きゅうげん]と 共生[きょうせい]社会[しゃかい]の 覚悟[かくご]',
    editorialSource: '朝日新聞 天声人語・社説風',
    genre: 'social-political',
    recommendedMinutes: 8,
    keyThemeUz:
      "Aholi qisqarishi fonida chet ellik mutaxassislarni vaqtinchalik ishchi kuchi emas, jamiyatning to'laqonli a'zosi sifatida qabul qilish va strukturaviy integratsiyani amalga oshirish zarurati.",
    vocabularyHighlights: [
      {
        word: '趨勢',
        reading: 'すうせい',
        meaningUz: "Yo'nalish, umumiy oqim, tendensiya",
        nuanceNote: 'Katta ijtimoiy-tarixiy jarayonlarning uzoq muddatli siljishi.',
      },
      {
        word: '看過',
        reading: 'かんか',
        meaningUz:
          "Ko'z yumish, e'tiborsiz qoldirish (看過できない - e'tiborsiz qoldirib bo'lmaydi)",
        nuanceNote: "Jiddiy muammoni beparvolik bilan o'tkazib yuborishda ishlatiladi.",
      },
      {
        word: '糊塗',
        reading: 'こと',
        meaningUz: "Vaqtinchalik xaspo'shlash, chala yopish",
        nuanceNote: 'Muammoni tubdan hal qilmay, yuzaki tuzatishga urinish.',
      },
      {
        word: '逼迫',
        reading: 'ひっぱく',
        meaningUz: "O'ta tang ahvol, keskin yetishmovchilik",
        nuanceNote: "Moliya, mehnat bozori yoki vaqtning o'ta qisqarib ketishi.",
      },
    ],
    japaneseContent: `少子[しょうし]高齢化[こうれいか]の 進行[しんこう]に伴[ともな]う 労働力[ろうどうりょく] 不足[ぶそく]の 深刻化[しんこくか]は、もはや 一過性[いっかせい]の 景気[けいき]循環[じゅんかん]による ものではなく、社会[しゃかい]構造[こうぞう]の 根底[こんてい]を 揺[ゆ]るがす 不可逆的[ふかぎゃくてき]な 趨勢[すうせい]である。
各地[かくち]で 医療[いりょう]・介護[かいご]や 物流[ぶつりゅう]、製造業[せいぞうぎょう]の 現場[げんば]が 逼迫[ひっぱく]する なか、外国人[がいこくじん] 労働者[ろうどうしゃ]の 受[う]け入[い]れ 拡大[かくだい]は 避[さ]けて 通[とお]れぬ 命題[めいだい]となっている。
しかしながら、これまでの 議論[ぎろん]は「人手[ひとで]不足[ぶそく]の 穴埋[あなう]め」という 近視眼[きんしがん]的[てき]な 観点[かんてん]に 終始[しゅうし]し、彼[かれ]らを 地域[ちいき] 社会[しゃかい]の 一員[いちいん]として 包摂[ほうせつ]する 長期的[ちょうきてき]な 視座[しざ]を 著[いちじる]しく 欠[か]いていたと 言わざるを 得[え]ない。
言葉[ことば]の 壁[かべ]や 居住[きょじゅう]環境[かんきょう]、子[こ]どもの 教育[きょういく]支援[しえん]といった 生活[せいかつ]インフラの 整備[せいび]を 怠[おこた]ったまま、単なる「労働力[ろうどうりょく]の 調整[ちょうせい]弁[べん]」として 扱[あつか]うことは、人権[じんけん]の 観点[かんてん]からも 看過[かんか]できない。
場当[ばあ]たり 的[てき]な 政策[せいさく]で その場[ば]を 糊塗[こと]する 時代[じだい]は 終焉[しゅうえん]を迎[むか]えた。多様性[たようせい]を 活力[かつりょく]へと 昇華[しょうか]させる 真[しん]の「共生[きょうせい] 社会[しゃかい]」の 構築[こうちく]に向け、今[いま]こそ 国家[こっか]としての 覚悟[かくご]が 問[と]われている。`,
    uzbekTranslation:
      "Aholining qarishi va tug'ilishning kamayishi oqibatida ishchi kuchi taqchilligining chuqurlashishi endi shunchaki davriy iqtisodiy tebranish emas, balki jamiyat tuzilmasi poydevorini larzaga solayotgan qaytarib bo'lmas umumiy tendensiyadir. Mamlakatning turli hududlarida tibbiyot, qariyalarni parvarishlash, logistika va ishlab chiqarish sohalari o'ta tang ahvolga kelib qolgan bir paytda xorijiy kadrlarni qabul qilishni kengaytirish chetlab o'tib bo'lmas zaruriyatga aylandi. Biroq shu paytgacha bo'lgan munozaralar faqatgina 'ishchi kuchi yetishmovchiligini to'ldirish' kabi tor doiradagi qarash bilan cheklanib, ularni mahalliy jamiyatning to'laqonli a'zosi sifatida integratsiya qilishdek uzoq muddatli strategik qarashdan keskin mosvo bo'lganini tan olish shart. Til to'sig'i, yashash sharoitlari, farzandlarining ta'lim olishiga ko'maklashish kabi hayotiy infratuzilmani yaratmasdan, ularga shunchaki 'ishchi kuchi muvozanatlash vositasi' sifatida qarash inson huquqlari nuqtai nazaridan ham ko'z yumib bo'lmaydigan holatdir. Yuzaki tadbirlar bilan muammoni xaspo'shlash davri yakunlandi. Turfa xillikni jamiyat taraqqiyotiga aylantiruvchi chinakam 'hamjihatlik jamiyati'ni qurish yo'lida butun davlatning qat'iy qarori sinovdan o'tmoqda.",
    questions: [
      {
        id: 'q_n1_shasetsu_2_1',
        questionText:
          '筆者[ひっしゃ]が「看過[かんか]できない」と 指摘[してき]している 内容[ないよう]は どれか。',
        options: [
          '外国人[がいこくじん]の 増加[ぞうか]によって 伝統的[でんとうてき]な 地域[ちいき] コミュニティが 崩壊[ほうかい]すること',
          '生活[せいかつ]環境[かんきょう]の 整備[せいび]を 怠[おこた]ったまま、外国人[がいこくじん]を 単なる 労働力[ろうどうりょく]の 補充[ほじゅう]としてのみ 扱[あつか]うこと',
          '若年層[じゃくねんそう]の 雇用の 機会[きかい]が 外国人[がいこくじん] 労働者[ろうどうしゃ]に 奪[うば]われること',
          '物流[ぶつりゅう]や 製造業[せいぞうぎょう]が 機械化[きかいか]によって 縮小[しゅくしょう]していくこと',
        ],
        correctIndex: 1,
        explanation:
          'Matnda "生活インフラの整備を怠ったまま、単なる「労働力の調整弁」として扱うことは、人権の観点からも看過できない" deb aniq ifodalangan.',
      },
    ],
  },
  {
    id: 'n1_shasetsu_3',
    title:
      '社説[しゃせつ]：脱炭素[だったんそ]の 理想[りそう]と エネルギー安全[あんぜん]保障[ほしょう]の 狭間[はざま]',
    editorialSource: '読売新聞 編集手帳風',
    genre: 'environmental-energy',
    recommendedMinutes: 8,
    keyThemeUz:
      "Iqlim o'zgarishiga qarshi uglerod neytralligi sari harakat geosiyosiy energiya xavfsizligi va iqtisodiy barqarorlik bilan muvozanatlashtirilishi shart.",
    vocabularyHighlights: [
      {
        word: '狭間',
        reading: 'はざま',
        meaningUz: "Ikki o'rtada, oraliq ziddiyat",
        nuanceNote: 'Ikki qiyin tanlov yoki qarama-qarshi maqsad orasida qolish holati.',
      },
      {
        word: '標榜',
        reading: 'ひょうぼう',
        meaningUz: "Ochiq e'lon qilish, shior qilib ko'tarish",
        nuanceNote: "Oliy maqsad yoki tamoyilni rasman bayroq qilib ko'rsatish.",
      },
      {
        word: '蹉跌',
        reading: 'さてつ',
        meaningUz: "Qoqilish, rejaning barbod bo'lishi",
        nuanceNote: 'Katta siyosiy yoki iqtisodiy strategiyaning kutilmaganda uzilib qolishi.',
      },
      {
        word: '盤石',
        reading: 'ばんじゃく',
        meaningUz: 'Toshdek mustahkam, barqaror',
        nuanceNote: 'Xavfsizlik yoki iqtisodiy poydevorning yengilmas mustahkamligi.',
      },
    ],
    japaneseContent: `地球[ちきゅう] 温暖化[おんだんか]の 脅威[きょうい]に 対処[たいしょ]すべく、国際[こくさい] 社会[しゃかい]が 脱炭素[だったんそ]へと 舵[かじ]を切る なか、日本[にほん]も また 2050年[ねん] カーボンニュートラルの 達成[たっせい]を 標榜[ひょうぼう]している。
気候[きこう] 変動[へんどう]の 抑制[よくせい]が 人類[じんるい] 共通[きょうつう]の 急務[きゅうむ]であることは 言を俟たない[げんをまたない]が、ウクライナ 危機[きき]に 端[たん]を発した 世界的[せかいてき]な 資源[しげん]価格[かかく]の 高騰[こうとう]は、エネルギー 安全[あんぜん]保障[ほしょう]の 脆[ぜい]弱[じゃく]さを 冷酷[れいこく]なまでに 白日[はくじつ]の 下[もと]に 晒[さら]した。
再生[さいせい]可能[かのう]エネルギーへの 急進的[きゅうしんてき]な 傾斜[けいしゃ]が、電力[でんりょく]供給[きょうきゅう]の 不安定化[ふあんていか]や 産業[さんぎょう]競争力[きょうそうりょく]の 毀損[きそん]を 招[まね]いては、本末転倒[ほんまつてんとう]の 蹉跌[さてつ]を 演[えん]じることになる。
理想[りそう]を 掲[かか]げることと、現実[げんじつ]の 供給[きょうきゅう]責任[せきにん]を 果[は]たすことは、決して 矛盾[むじゅん]するものではない。電源[でんげん]の 最適[さいてき]な ベストミックスを 模索[もさく]し、盤石[ばんじゃく]な インフラを 維持[いじ]しながら 着実[ちゃくじつ]な トランジション（移行[いこう]）を 進[すす]める 現実的[げんじつてき]な 複眼[ふくがん]思考[しこう]こそが、今[いま]の 我[わ]が国[くに]に 求[もと]められている。`,
    uzbekTranslation:
      "Global isish xavfiga qarshi xalqaro hamjamiyat karbonsizlanish tomon burilayotgan pallada, Yaponiya ham 2050 yilga kelib uglerod neytralligiga erishishni o'zining bosh maqsadi deb e'lon qildi. Iqlim o'zgarishini jilovlash insoniyatning umumiy kechiktirib bo'lmas vazifasi ekanligi o'z-o'zidan ravshan bo'lsa-da, Ukrainadagi urush keltirib chiqargan jahon resurs narxlarining keskin oshishi energetika xavfsizligining zaifligini sovuqqonlik bilan fosh etdi. Qayta tiklanuvchi energiyaga o'ta radikal intilish elektr energiyasi ta'minotining beqarorlashuviga va sanoat raqobatbardoshligining sinishiga olib kelsa, asosiy maqsadni yo'qotib qo'yadigan jiddiy qoqilishga aylanadi. Yuksak ideallarni ko'zlash va real ta'minot mas'uliyatini bajarish bir-biriga aslo zid emas. Eng maqbul energiya aralashmasini izlab topish, toshdek mustahkam infratuzilmani saqlab qolgan holda bosqichma-bosqich ishonchli o'tishni amalga oshiruvchi real ko'p qirrali tafakkur aynan bugun mamlakatimiz uchun suv va havodek zarurdir.",
    questions: [
      {
        id: 'q_n1_shasetsu_3_1',
        questionText:
          '筆者[ひっしゃ]の 述[の]べる「本末転倒[ほんまつてんとう]の 蹉跌[さてつ]」とは 何[なに]を 指[さ]しているか。',
        options: [
          '地球[ちきゅう] 温暖化[おんだんか]を 恐[おそ]れるあまり、経済[けいざい]活動[かつどう]を 永久[えいきゅう]に 停止[ていし]してしまうこと',
          '脱炭素[だったんそ]を 急[いそ]ぎすぎるあまり、電力[でんりょく]の 安定[あんてい]供給[きょうきゅう]や 産業[さんぎょう]基盤[きばん]を 損[そこ]なってしまうこと',
          '化石[かせき]燃料[ねんりょう]の 利権[りけん]を 守[まも]るために 再生[さいせい]可能[かのう]エネルギーを 排除[はいじょ]すること',
          '国際的[こくさいてき]な 約束[やくそく]を 無視[むし]して 一国[いっこく]の 利益[りえき]のみを 優先[ゆうせん]すること',
        ],
        correctIndex: 1,
        explanation:
          "Muallif uglerod neytralligiga erishaman deb shoshilinch qadam tashlab, barqaror elektr ta'minotini va sanoat poydevorini yo'qotib qo'yishni asosiy o'rni almashib ketgan qoqilish (本末転倒の蹉跌) deb atamoqda.",
      },
    ],
  },
];

// ============================================================================
// 2. ILMIY VA AKADEMIK MAQOLALAR (学術・論文 DOKKAI)
// ============================================================================

export interface N1AcademicArticle {
  id: string;
  title: string;
  academicDomain: 'cognitive-linguistics' | 'bioethics-genetics' | 'political-philosophy';
  thesisSummaryUz: string;
  counterArgumentUz: string;
  synthesisUz: string;
  japaneseContent: string;
  uzbekTranslation: string;
  recommendedMinutes: number;
  academicTerminology: Array<{
    term: string;
    reading: string;
    definitionUz: string;
  }>;
  questions: JlptReadingQuestion[];
}

export const N1_ACADEMIC_ARTICLES: N1AcademicArticle[] = [
  {
    id: 'n1_acad_1',
    title:
      '認知[にんち]言語学[げんごがく]における「間[ま]」の 身体性[しんたいせい]と 空間[くうかん]表象[ひょうしょう]',
    academicDomain: 'cognitive-linguistics',
    thesisSummaryUz:
      "Yapon tilidagi 'Ma' (間) tushunchasi bo'shliq emas, balki subyekt va obyekt o'rtasidagi munosabatni vujudga keltiruvchi faol kognitiv makondir.",
    counterArgumentUz:
      "G'arb klassik kartesian dualizmi makonni obyektiv geometrik bo'shliq deb biladi.",
    synthesisUz:
      "Tana sezgisi orqali his qilinadigan oraliq til grammatikasida va muloqot jimligida faol ma'no hosil qiluvchi semantik o'q bo'lib xizmat qiladi.",
    recommendedMinutes: 9,
    academicTerminology: [
      {
        term: '身体性',
        reading: 'しんたいせい',
        definitionUz:
          'Kognitiv tilshunoslikda aql va idrokning inson jismoniy tanasi sezgilariga tayanib shakllanishi (Embodiment).',
      },
      {
        term: '表象',
        reading: 'ひょうしょう',
        definitionUz:
          'Miyada tashqi olam obyektlarining idrok etilishi va ichki timsol sifatida gavdalanishi (Representation).',
      },
      {
        term: '蓋然性',
        reading: 'がいぜんせい',
        definitionUz: 'Ehtimollik darajasi, qanchalik haqiqatga yaqinligi (Probability).',
      },
      {
        term: '背反',
        reading: 'はいはん',
        definitionUz: 'Zid kelish, bir-birini inkor etish (Antinomy/Contradiction).',
      },
    ],
    japaneseContent: `近代[きんだい] 西欧[せいおう]の デカルト的[てき] 二元論[にげんろん]において、空間[くうかん]は しばしば 観察者[かんさつしゃ]から 独立[どくりつ]した 均質な[きんしつな] 幾何学的[きかがくてき] 延長[えんちょう]として 措定[さてい]されてきた。
これに対し、日本[にほん]の 伝統的[でんとうてき]な 空間[くうかん]意識[いしき]の中核[ちゅうかく]をなす「間[ま]」は、単なる 物理的[ぶつりてき]な 空虚[くうきょ]や 欠落[けつらく]を 意味[いみ]するのではない。
認知[にんち]言語学[げんごがく]の 視座[しざ]に 立脚[りっきゃく]するならば、「間[ま]」とは 主体[しゅたい]と 客体[きゃくたい]、あるいは 自己[じこ]と 他者[たしゃ]が 相互[そうご]に 浸透[しんとう]し合[あ]う「関係性[かんけいせい]の 場[ば]」であり、身体[しんたい]の 生理的[せいりてき]な リズムと 分かちがたく[わかちがたく] 結びついた[むすびついた] 動態的[どうたいてき] 概念[がいねん]である。
会話[かいわ]における 沈黙[ちんもく]や、建築[けんちく]における 陰翳[いんえい]、能楽[のうがく]における 留[と]めの 所作[しょさ]に 見出[みいだ]されるように、「間[ま]」は 何[なに]も 存在[そんざい]しないことによって 逆説的[ぎゃくせつてき]に 充溢[じゅういつ]した 意味[いみ]を 生起[せいき]させる。
すなわち、「間[ま]」を 解読[かいどく]することとは、客観的[きゃっかんてき] 実体[じったい]としての 記号[きごう]の 背後[はいご]に 潜[ひそ]む、発話者[はつわしゃ]の 身体知[しんたいち]と 暗黙[あんもく]の 共振[きょうしん]を 追体験[ついたいけん]することに 他[ほか]ならないのである。`,
    uzbekTranslation:
      "Zamonaviy g'arb kartesian dualizmida fazo ko'pincha kuzatuvchidan mustaqil bo'lgan bir hil geometrik cho'zilish sifatida qaralgan. Bunga zid o'laroq, Yaponiyaning an'anaviy fazoviy ongining markazida turuvchi 'Ma' (oraliq/masofa/sukut) tushunchasi shunchaki fizik bo'shliq yoki yo'qlikni anglatmaydi. Kognitiv tilshunoslik nuqtai nazaridan qaralganda, 'Ma' — subyekt va obyekt, yoki 'men' va 'o'zga' bir-biriga kirib boradigan 'munosabatlar maydoni' bo'lib, inson tanasining fiziologik ritmlari bilan ajralmas bog'langan dinamik tushunchadir. Suhbatdagi jimlik, me'morchilikdagi soyalar, No teatri harakatlarining to'xtash lahzasida namoyon bo'lganidek, 'Ma' hech narsa mavjud emasligi orqali paradoksal tarzda chuqur va to'liq ma'noni yuzaga chiqaradi. Demak, 'Ma'ni tushunish — obyektiv belgi va so'zlar ortida yashiringan so'zlovchining tana hissiyoti va og'zaki aytilmagan aks-sadosini birgalikda his qilishdan boshqa narsa emas.",
    questions: [
      {
        id: 'q_n1_acad_1_1',
        questionText:
          '筆者[ひっしゃ]の 主張[しゅちょう]によれば、日本[にほん]の「間[ま]」の 本質[ほんしつ]として 最[もっと]も 適切[てきせつ]なものは どれか。',
        options: [
          '観察者[かんさつしゃ]の 意識[いしき]とは 無関係[むかんけい]に 存在[そんざい]する 幾何学的[きかがくてき]な 空間[くうかん]',
          '単なる 物理的[ぶつりてき]な 空白[くうはく]ではなく、主客[しゅかく]の 関係性[かんけいせい]や 身体[しんたい]感覚[かんかく]と 結[むす]びついた 動的[どうてき]な 意味[いみ]の 場[ば]',
          '会話[かいわ]の 失敗[しっぱい]や 誤解[ごかい]を 避[さ]けるために 意識的[いしきてき]に 作[つく]り出[だ]す 計算[けいさん]された 沈黙[ちんもく]',
          '西欧[せいおう]の 記号論[きごうろん]によって 初[はじ]めて 論理的[ろんりてき]に 解明[かいめい]された 言語[げんご]構造[こうぞう]',
        ],
        correctIndex: 1,
        explanation:
          "Matnda \"間\" shunchaki jismoniy bo'shliq emas, balki subyekt-obyekt munosabati va tana hissi bilan uzviy bog'liq dinamik ma'no maydoni deb aniq ta'kidlangan.",
      },
    ],
  },
  {
    id: 'n1_acad_2',
    title:
      '生殖[せいしょく]医療[いりょう]と ゲノム 編集[へんしゅう]が 提起[ていき]する 規範的[きはんてき] 問い',
    academicDomain: 'bioethics-genetics',
    thesisSummaryUz:
      "Genom tahrirlash texnologiyasining davolovchi tibbiyotdan inson qobiliyatini sun'iy oshirish (enhancement) sohasiga o'tishi axloqiy mezonlarni buzishi mumkin.",
    counterArgumentUz:
      "Kasalliklarni ildizi bilan yo'qotish va inson salohiyatini maksimal darajaga ko'tarish utilitar nuqtai nazardan foydali ko'rinadi.",
    synthesisUz:
      "Tug'ilajak avlodning o'z taqdirini erkin belgilash huquqi va ijtimoiy tengsizlikning genetik mustahkamlanib qolishi xavfi chuqur bioetik qonunchilikni talab qiladi.",
    recommendedMinutes: 9,
    academicTerminology: [
      {
        term: '規範',
        reading: 'きはん',
        definitionUz: "Jamiyat va axloqda amal qilinishi lozim bo'lgan mezon (Norm/Standard).",
      },
      {
        term: '演繹',
        reading: 'えんえき',
        definitionUz: 'Umumiy qoidalardan xususiy xulosalar chiqarish mantiqiy usuli (Deduction).',
      },
      {
        term: '恣意性',
        reading: 'しいせい',
        definitionUz: "Xohishiga qarab o'zboshimchalik bilan ish ko'rishlik (Arbitrariness).",
      },
    ],
    japaneseContent: `CRISPR-Cas9を はじめとする ゲノム 編集[へんしゅう]技術[ぎじゅつ]の 到来[とうらい]は、難治性[なんちせい] 遺伝[いでん]性[せい] 疾患[しっかん]の 根治[こんち]という 治療[ちりょう]の 地平[ちへい]を 切[き]り拓[ひら]いた。
しかし、この 技術[ぎじゅつ]が 受精卵[じゅせいらん]や 生殖[せいしょく]細胞[さいぼう]へと 適用[てきよう]される 段階[だんかい]において、我々[われわれ]は「治療[ちりょう]（Therapy）」と「能力[のうりょく] 増強[ぞうきょう]（Enhancement）」の 峻別[しゅんべつ]という 困難[こんなん]な 哲学的[てつがくてき] 命題[めいだい]に 直面[ちょくめん]する。
病[やまい]の 克服[こくふく]を 目的[もくてき]とする 医療[いりょう]の 枠組[わくぐ]みを超え、知能[ちのう]や 身体的[しんたいてき] 特徴[とくちょう]を 恣意的[しいてき]に 操作[そうさ]する「デザイナーベビー」の 誕生[たんじょう]は、親[おや]による 子[こ]の 道具化[どうぐか]を 惹起[じゃっき]しかねない。
生[う]まれながらにして 遺伝的[いでんてき] 改変[かいへん]を 施[ほどこ]された 個体[こたい]は、自[みずか]らの 身体[しんたい]と 人生[じんせい]の 主体[しゅたい]であり 得[え]るのか。
さらに、富[とみ]の 多寡[たか]が 遺伝的[いでんてき] 格差[かくさ]へと 直結[ちょっけつ]するならば、近代[きんだい] 社会[しゃかい]が 標榜[ひょうぼう]してきた 機会[きかい]の 平等[びょうどう]という 理念[りねん]そのものが 瓦解[がかい]する 蓋然性[がいぜんせい]を 孕[はら]んでいる。
生命[せいめい]の 改変[かいへん]可能性[かのうせい]が 飛躍的[ひやくてき]に 増大[ぞうだい]した 現代[げんだい]において、何[なに]をなし 得[え]るかという 技術的[ぎじゅつてき] 問い以上に、何[なに]をなす べきではないかという 規範的[きはんてき] 倫理[りんり]の 確立[かくりつ]が 焦眉[しょうび]の 急[きゅう]なのである。`,
    uzbekTranslation:
      "CRISPR-Cas9 boshchiligidagi genom tahrirlash texnologiyasining kirib kelishi davolash qiyin bo'lgan irsiy kasalliklarni ildizi bilan davolash ufqini ochib berdi. Biroq ushbu texnologiya urug'langan tuxumhujayra yoki reproduktiv hujayralarga qo'llanish bosqichiga kelganda biz 'davolash' (terapiya) va 'qobiliyatlarni oshirish' (enhancement) o'rtasidagi keskin farqni ajratishdek murakkab falsafiy muammoga to'qnash kelamiz. Kasallikni yengishni maqsad qilgan tibbiyot doirasidan chiqib, aql-idrok yoki jismoniy sifatlarni o'zboshimchalik bilan boshqaradigan 'dizayner chaqaloqlar'ning dunyoga kelishi ota-onalar tomonidan bolaning shaxsini shunchaki buyumlashtirishiga sabab bo'lishi mumkin. Tug'ilishidan genetik o'zgartirilgan inson o'z tanasi va hayotining haqiqiy egasi bo'la oladimi? Bundan tashqari, boylik miqdori genetik tafovutga to'g'ridan-to'g'ri bog'lansa, zamonaviy jamiyat shior qilgan imkoniyatlar tengligi g'oyasi yo'q bo'lib ketish xavfi tug'iladi. Hayotni o'zgartirish imkoniyati keskin oshgan hozirgi davrda nimaga qodirligimiz degan texnik savoldan ko'ra, nimani aslo qilmasligimiz kerak degan axloqiy mezonlarni o'rnatish kechiktirib bo'lmas o'tkir vazifadir.",
    questions: [
      {
        id: 'q_n1_acad_2_1',
        questionText:
          '筆者[ひっしゃ]が「焦眉[しょうび]の急[きゅう]」として 求[もと]めていることは どれか。',
        options: [
          'CRISPR-Cas9の 編集[へんしゅう]精度[せいど]を さらに 向上[こうじょう]させる 技術[ぎじゅつ]革新[かくしん]',
          '受精卵[じゅせいらん]への 適用[てきよう]を 推進[すいしん]し、遺伝的[いでんてき] 疾患[しっかん]を 全滅[ぜんめつ]させること',
          '技術[ぎじゅつ]の 進歩[しんぽ]に対[たい]し、何[なに]をなすべきではないかという 規範的[きはんてき]な 倫理[りんり]基準[きじゅん]を 確立[かくりつ]すること',
          '遺伝的[いでんてき] 改変[かいへん]を 商業化[しょうぎょうか]して 医療[いりょう]費[ひ]の 削減[さくげん]を 図[はか]ること',
        ],
        correctIndex: 2,
        explanation:
          'Oxirgi gapda "何[なに]をなすべきではないかという規範的倫理の確立が焦眉の急なのである" deb aniq yozilgan.',
      },
    ],
  },
];

// ============================================================================
// 3. RASMIY E-MAIL VA BIZNES YOZISHMALARI (ビジネス文書・契約書)
// ============================================================================

export interface N1BusinessEmailScenario {
  id: string;
  category: 'apology_shazai' | 'price_renegotiation' | 'partnership_nda' | 'contract_clause';
  title: string;
  senderRole: string;
  recipientRole: string;
  japaneseContent: string;
  uzbekTranslation: string;
  etiquetteNotesUz: string[];
  contractClauses?: Array<{
    clauseNumber: string;
    clauseTitle: string;
    japaneseText: string;
    uzbekExplanation: string;
  }>;
  correctionDrills: Array<{
    id: string;
    inappropriateSentence: string;
    issueExplanationUz: string;
    options: string[];
    correctIndex: number;
    explanationUz: string;
  }>;
}

export const N1_BUSINESS_CORRESPONDENCE: N1BusinessEmailScenario[] = [
  {
    id: 'n1_biz_1',
    category: 'apology_shazai',
    title:
      '納品[のうひん]遅延[ちえん]および 仕様[しよう]不一致[ふいっち]に関する お詫[わ]びと 是正[ぜせい]措置[そち]',
    senderRole: '株式会社カイワ・テクノロジーズ 執行役員 開発本部長',
    recipientRole: '大和総合研究所 IT戦略調達部 部長 殿',
    etiquetteNotesUz: [
      "Boshlanishida '拝啓' va mavsumiy tabrik, shoshilinch uzrda esa '拝啓' o'rniga '急啓' yoki to'g'ridan-to'g'ri '平素は格別のご高配...' ishlatiladi.",
      "Kompaniya nomidan gapirilganda '私ども' yoki '小社/弊社' ishlatilib, hamkor kompaniya '貴社' yoki '御社' deb ulug'lanadi.",
      "Xatoni tushuntirishda hech qachon uchinchi tomonni ayblamay ('〜のせいで' o'rniga '弊社の管理不行き届きにより'), sabab va aniq tuzatish muddati beriladi.",
    ],
    japaneseContent: `拝啓[はいけい]
貴社[きしゃ]におかれましては、ますます ご清栄[せいえい]のことと お慶[よろこ]び申[もう]し上[あ]げます。
平素[へいそ]は 格別[かくべつ]の ご高配[こうはい]を 賜[たまわ]り、厚[あつ]く 御礼[おんれい]申[もう]し上[あ]げます。

さて、今般[こんぱん] 貴社[きしゃ]へ 納品[のうひん]いたしました「次世代[じせだい]基幹[きかん]システム」におきまして、一部[いちぶ] 仕様書[しようしょ]との 乖離[かいり]および 納品[のうひん]期日[きじつ]の 遅延[ちえん]が 発生[はっせい]いたしました。
本件[ほんけん]は、弊社[へいしゃ]の プロジェクト 管理[かんり]の 不手際[ふてぎわ]および 最終[さいしゅう] 検査[けんさ]体制[たいせい]の 瑕疵[かし]に 起因[きいん]するものであり、弁解[べんかい]の 余地[よち]もございません。
貴社[きしゃ]の 業務[ぎょうむ]運行[うんこう]に 多大[ただい]なる ご支障[ししょう]と ご迷惑[めいわく]をおかけいたしましたことを、深[ふか]く お詫[わ]び申[もう]し上[あ]げます。

つきましては、直[ただ]ちに 特別[とくべつ]対策[たいさく]班[はん]を 編成[へんせい]し、仕様[しよう]の 是正[ぜせい]パッチを 今週[こんしゅう] 金曜日[きんようび] 17時[じ]までに 適用[てきよう]・完了[かんりょう]させる 所存[しょぞん]でございます。
また、二度[にど]と かかる 事態[じたい]を 惹起[じゃっき]せぬよう、品質[ひんしつ]保証[ほしょう]プロセスの 抜本的[ばっぽんてき] 見直[みなお]しを 実施[じっし]いたします。
追[お]って 弊社[へいしゃ] 代表[だいひょう]取締役[とりしまりやく]とともに 貴社[きしゃ]へ 参上[さんじょう]のうえ、事態[じたい]の 経緯[けいい]と 再発[さいはつ]防止[ぼうし]策[さく]について 改[あらた]めて ご説明[せつめい]申[もう]し上[あ]げたく 存[ぞん]じます。

略儀[りゃくぎ]ながら、まずは 書中[しょちゅう]をもちまして お詫[わ]びと ご報告[ほうこく]を 申[もう]し上[あ]げます。
敬具[けいぐ]`,
    uzbekTranslation:
      "Muhtaram janoblar: Sizning hurmatli kompaniyangizga ulkan ravnaq tilaymiz. Bizga ko'rsatayotgan doimiy yuksak e'tiboringiz va ishonchingiz uchun chuqur minnatdorchilik bildiramiz. Endi asosiy maqsadga kelsak: yaqinda kompaniyangizga yetkazib berilgan 'Keyingi avlod asosiy boshqaruv tizimi' dasturiy ta'minotida texnik shartnomaga nomuvofiqlik va topshirish muddatining kechikishi yuz berdi. Ushbu holat kompaniyamizning loyihani boshqarishdagi mas'uliyatsizligi va yakuniy tekshiruv tizimidagi jiddiy kamchilik tufayli kelib chiqqan bo'lib, buning hech qanday oqlanishi yo'q. Hurmatli kompaniyangiz ish faoliyatiga ulkan to'siq va qiyinchiliklar tug'dirganimiz uchun chin qalbdan uzr so'raymiz. Shu sababli, zudlik bilan maxsus guruh tuzib, kamchiliklarni tuzatuvchi yangilanishni juma kuni soat 17:00 ga qadar to'liq o'rnatib topshirish niyatidamiz. Shuningdek, bunday holat qayta takrorlanmasligi uchun sifat nazorati tizimini tubdan qayta ko'rib chiqamiz. Yaqin fursatda kompaniyamiz bosh direktori bilan birgalikda hurmatli kompaniyangizga shaxsan tashrif buyurib, voqea tafsilotlari va xatolikning oldini olish choralari haqida tushuntirish berishni xohlaymiz. Qoidaga ko'ra shaxsan ko'rishish lozim bo'lsa-da, avvalambor ushbu xat orqali chuqur uzr va hisobotimizni taqdim etamiz. Hurmat bilan.",
    correctionDrills: [
      {
        id: 'cd_1',
        inappropriateSentence:
          '弊社のエンジニアが体調を崩したせいで、納期が遅れました。すみません。',
        issueExplanationUz:
          "Biznesda xodimning betobligi mijoz oldida oqlanish bo'la olmaydi ('〜のせいで' mutlaqo nomaqbul) va 'すみません' korporativ Keigo talablariga to'g'ri kelmaydi.",
        options: [
          '弊社のエンジニアが病気になってしまったので、納期が間に合いませんでした。申し訳ありません。',
          '弊社の社内体制の不備により納品が遅延いたしましたことを、深くお詫び申し上げます。',
          '体調不良は仕方のないことですので、納期遅延をご了承ください。',
          '納期が遅れましたことについて、弊社の責任として了解いたしました。',
        ],
        correctIndex: 1,
        explanationUz:
          "2-variantda '社内体制の不備により...' deb korporativ mas'uliyat olinadi va '深くお詫び申し上げます' rasmiy Keigo mezoniga to'liq javob beradi.",
      },
      {
        id: 'cd_2',
        inappropriateSentence: '今度、社長と一緒にあなたの会社に行きます。',
        issueExplanationUz:
          "Mijoz kompaniyasi 'あなたの会社' deb aytilmaydi ('貴社/御社'), borish harakati esa Kenjougo '参上する' yoki 'お伺いする' bo'lishi kerak.",
        options: [
          '後日、弊社の社長と一緒にそちらのオフィスに遊びに伺います。',
          '追って弊社代表取締役とともに貴社へ参上のうえ、ご説明申し上げたく存じます。',
          '今度、うちの社長と貴社に行かせていただきます。',
          '社長をお連れして、御社に訪問して差し上げます。',
        ],
        correctIndex: 1,
        explanationUz:
          "O'z rahbariga '弊社代表取締役' unvoni beriladi (sama qo'yilmaydi), hamkor '貴社' deyiladi va borish fe'li '参上する' (yuqori Kenjougo) orqali ifodalanadi.",
      },
    ],
  },
  {
    id: 'n1_biz_2',
    category: 'contract_clause',
    title:
      '業務[ぎょうむ]委託[いたく]および 秘密[ひみつ]保持[ほじ]契約書[けいやくしょ]（NDA 条項[じょうこう]）',
    senderRole: '法務部 法務顧問',
    recipientRole: '受託者 代表者 殿',
    etiquetteNotesUz: [
      "Yapon shartnoma tilida buyurtmachi '甲' (Kou), ijrochi esa '乙' (Otsu) deb nomlanadi.",
      "Majburiyatlar '〜するものとする' (qilishi shart/kelishiladi), huquqlar '〜することができる' deb ifodalanadi.",
      "Ziyonni qoplash '損害賠償を請求することができる' orqali yoziladi.",
    ],
    contractClauses: [
      {
        clauseNumber: '第8条',
        clauseTitle: '秘密[ひみつ]保持[ほじ]義務[ぎむ]',
        japaneseText: `1. 乙[おつ]は、本[ほん]契約[けいやく]の 履行[りこう]に関連[かんれん]して 甲[こう]より 開示[かいじ]を受け、または 知得[ちとく]した 一切[いっさい]の 技術[ぎじゅつ]上[じょう]・営業[えいぎょう]上[じょう]の 情報[じょうほう]（以下[いか]「秘密[ひみつ]情報[じょうほう]」という）を、厳重[げんじゅう]に 秘密[ひみつ]として 管理[かんり]し、甲[こう]の 事前[じぜん]の 書面[しょめん]による 承諾[しょうだく]なしに、第三者[だいさんしゃ]に 漏洩[ろうえい]、または 開示[かいじ]してはならない。
2. 乙[おつ]は、秘密[ひみつ]情報[じょうほう]を 本[ほん]契約[けいやく]の 目的[もくてき]の 範囲内[はんいない]でのみ 使用[しよう]するものとし、甲[こう]の 書面[しょめん]による 許諾[きょだく]なく 複製[ふくせい]・翻案[ほんあん]を行[おこな]ってはならない。`,
        uzbekExplanation:
          "8-modda (Maxfiylik majburiyati): 1. Ijrochi (Otsu) ushbu shartnomani bajarish davomida Buyurtmachi (Kou) tomondan berilgan yoki bilib olingan barcha texnik va tijoriy sirlarni qat'iy maxfiy saqlaydi hamda Kouning oldindan berilgan yozma roziligisiz uchinchi shaxslarga oshkor qilmaydi. 2. Otsu ushbu maxfiy axborotni faqatgina shartnoma maqsadlari doirasida ishlatadi va yozma ruxsatsiz nusxa ko'chirmaydi.",
      },
      {
        clauseNumber: '第14条',
        clauseTitle: '契約[けいやく]解除[かいじょ]および 損害[そんがい]賠償[ばいしょう]',
        japaneseText: `甲[こう]または 乙[おつ]は、相手方[あいてがた]が 本[ほん]契約[けいやく]の 各[かく]条項[じょうこう]に 違反[いはん]し、相当[そうとう]の 期間[きかん]を 定[さだ]めて 催告[さいこく]したにもかかわらず 是正[ぜせい]されない ときは、直[ただ]ちに 本[ほん]契約[けいやく]の 全部[ぜんぶ]または 一部[いちぶ]を 解除[かいじょ]することができる。また、これによって 被[こうむ]った 一切[いっさい]の 損害[そんがい]（合理[ごうり]的な 弁護士[べんごし]費用[ひよう]を含む）の 賠償[ばいしょう]を 相手方[あいてがた]に 請求[せいきゅう]することを 妨[さまた]げない。`,
        uzbekExplanation:
          "14-modda (Shartnomani bekor qilish va zararni qoplash): Tomonlardan biri shartnoma shartlarini buzsa va yetarli muhlat berib ogohlantirishga qaramay kamchilik bartaraf etilmasa, ikkinchi tomon shartnomani zudlik bilan to'liq yoki qisman bekor qilishi mumkin. Shuningdek, bu orqali ko'rilgan barcha zararni (asosli advokat xarajatlarini qo'shgan holda) qoplab berishni talab qilish huquqi cheklanmaydi.",
      },
    ],
    japaneseContent: `【業務[ぎょうむ]委託[いたく]基本[きほん]契約書[けいやくしょ] 抜粋[ばっすい]】
甲[こう]（発注者[はっちゅうしゃ]）と 乙[おつ]（受注者[じゅちゅうしゃ]）は、相互[そうご]の 信頼[しんらい]に 基[づ]き、信義[しんぎ]誠実[せいじつ]の 原則[げんそく]に従[したが]って 本[ほん]契約[けいやく]を 履行[りこう]するものとする。
契約[けいやく]条項[じょうこう]の 解釈[かいしゃく]につき 疑義[ぎぎ]が 生[しょう]じた 場合[ばあい]は、甲乙[こうおつ] 誠意[せいい]をもって 協議[きょうぎ]し、円満[えんまん]に 解決[かいけつ]を 図[はか]るものとする。`,
    uzbekTranslation:
      "Xizmat ko'rsatish bosh shartnomasidan ko'chirma: Kou (Buyurtmachi) va Otsu (Ijrochi) o'zaro ishonchga tayanib, vijdonan va halollik tamoyiliga ko'ra ushbu shartnomani bajaradilar. Shartnoma moddalari talqinida shubha yoki noaniqlik paydo bo'lsa, tomonlar samimiyat bilan muzokara olib borib, tinch yo'l bilan hal etadilar.",
    correctionDrills: [
      {
        id: 'cd_3',
        inappropriateSentence:
          '契約の内容がよく分からないので、そっちで適当に書き換えておいてください。',
        issueExplanationUz:
          "Shartnoma tilida 'そっち' (o'sha taraf) va '適当に書き換える' (o'zingizcha o'zgartirib qo'ying) so'zlari mutlaqo nomaqbul bo'lib, huquqiy savodsizlik hisoblanadi.",
        options: [
          '契約内容に不明瞭な点がございますので、貴社のほうで適宜修正願えますでしょうか。',
          '本条項の文言につき疑義がございますので、甲乙協議のうえ修正案をご提示いただけますと幸甚に存じます。',
          '契約書の内容が難解ですので、御社で分かりやすく改定してください。',
          'こちらの希望に合わせて契約書を書き換えていただくようお願いいたします。',
        ],
        correctIndex: 1,
        explanationUz:
          "2-variantda '本条項の文言につき疑義がございますので、甲乙協議のうえ修正案をご提示いただけますと幸甚に存じます' deb oliy darajadagi huquqiy va diplomatik biznes tili ishlatilgan.",
      },
    ],
  },
];

// ============================================================================
// 4. MURAKKAB KEIGO (HURMAT NUTQI) TIZIMI (至高の敬語)
// ============================================================================

export interface KeigoVerbMatrixItem {
  baseVerb: string;
  meaningUz: string;
  sonkeigo: string; // 尊敬語 (Boshqalarning harakatini ulug'lash)
  kenjougoI: string; // 謙譲語I (Boshqalarga yo'naltirilgan o'z harakatini kamtarlik bilan pasaytirish)
  kenjougoII: string; // 謙譲語II/丁重語 (Tinglovchi oldida o'z harakatini odob bilan pasaytirish)
  teineigo: string; // 丁寧語 (Xushmuomala so'zlar: です・ます)
  criticalPitfallUz: string;
}

export const N1_KEIGO_VERB_MATRIX: KeigoVerbMatrixItem[] = [
  {
    baseVerb: '行く / 来る',
    meaningUz: 'Bormoq / Kelmoq',
    sonkeigo: 'いらっしゃる / おいでになる / お越しになる',
    kenjougoI: '伺う（うかがう） / まいる（相手先へ）',
    kenjougoII: '参る（まいる）',
    teineigo: '行きます / 来ます',
    criticalPitfallUz:
      "❌ '私が参られた' (O'z harakatiga Sonkeigo qo'llash qat'iyan xato) -> ⭕ '私が参りました'.",
  },
  {
    baseVerb: '言う',
    meaningUz: 'Gapirmoq / Aytmoq',
    sonkeigo: 'おっしゃる',
    kenjougoI: '申し上げる（もうしあげる）',
    kenjougoII: '申す（もうす）',
    teineigo: '言います',
    criticalPitfallUz:
      "❌ '先生が申された' (Ustozga Kenjougo ishlatish xato) -> ⭕ '先生がおっしゃった'.",
  },
  {
    baseVerb: '知る / 知っている',
    meaningUz: 'Bilmoq',
    sonkeigo: 'ご存じである（ごぞんじである）',
    kenjougoI: '存じ上げている（ぞんじあげている）',
    kenjougoII: '存じている（ぞんじている）',
    teineigo: '知っています',
    criticalPitfallUz:
      "Bilmayman deganda: ❌ '存じ上げません' (odamga nisbatan) vs ⭕ '存じません' (fakt yoki vaziyatga nisbatan).",
  },
  {
    baseVerb: '食べる / 飲む',
    meaningUz: 'Yemoq / Ichmoq',
    sonkeigo: '召し上がる（めしあがる）',
    kenjougoI: 'いただく / 頂戴する（ちょうだいする）',
    kenjougoII: 'いただく',
    teineigo: '食べます / 飲みます',
    criticalPitfallUz:
      "❌ 'どうぞいただいてください' (Mijozga Kenjougo bilan taklif qilish) -> ⭕ 'どうぞお召し上がりください'.",
  },
  {
    baseVerb: '見る',
    meaningUz: "Ko'rmoq",
    sonkeigo: 'ご覧になる（ごらんになる）',
    kenjougoI: '拝見する（はいけんする）',
    kenjougoII: '拝見する',
    teineigo: '見ます',
    criticalPitfallUz: "❌ '先生が拝見された' (Mijoz/ustoz ko'rganida) -> ⭕ '先生がご覧になった'.",
  },
  {
    baseVerb: '聞く / 尋ねる',
    meaningUz: "Eshitmoq / So'ramoq",
    sonkeigo: 'お聞きになる',
    kenjougoI: '伺う（うかがう） / 拝聴する（はいちょうする）',
    kenjougoII: '伺う',
    teineigo: '聞きます',
    criticalPitfallUz: "Mijozning ma'ruzasini eshitganda: '拝聴いたしました' (Kenjougo I).",
  },
  {
    baseVerb: '会う',
    meaningUz: 'Uchrashmoq',
    sonkeigo: 'お会いになる',
    kenjougoI: 'お目にかかる（おめにかかる）',
    kenjougoII: 'お会いする',
    teineigo: '会います',
    criticalPitfallUz: "❌ '社長がお目にかかりました' -> ⭕ '社長がお会いになりました'.",
  },
  {
    baseVerb: 'する',
    meaningUz: 'Qilmoq',
    sonkeigo: 'なさる / される',
    kenjougoI: '致す（いたす）',
    kenjougoII: '致す（いたす）',
    teineigo: 'します',
    criticalPitfallUz: "❌ '社長、どういたしますか' -> ⭕ '社長、どうなさいますか'.",
  },
];

export interface NijyuuKeigoTrap {
  id: string;
  incorrectSentence: string;
  correctSentence: string;
  trapType: '二重敬語 (Nijyuu Keigo)' | '身内への敬称' | '目上への不敬' | 'マナー違反';
  explanationUz: string;
}

export const N1_NIJYUU_KEIGO_TRAPS: NijyuuKeigoTrap[] = [
  {
    id: 'trap_1',
    incorrectSentence: '社長がおっしゃられました。',
    correctSentence: '社長がおっしゃいました。',
    trapType: '二重敬語 (Nijyuu Keigo)',
    explanationUz:
      "'おっしゃる' (Sonkeigo) fe'liga yana 'られる' (Sonkeigo qo'shimchasi) qo'shish ortiqcha takror (二重敬語) hisoblanadi. To'g'risi: 'おっしゃいました'.",
  },
  {
    id: 'trap_2',
    incorrectSentence: '資料をご覧になられましたでしょうか。',
    correctSentence: '資料をご覧になりましたでしょうか。',
    trapType: '二重敬語 (Nijyuu Keigo)',
    explanationUz: "'ご覧になる' ning o'zi mukammal Sonkeigo. Unga yana 'られる' qo'shish xatodir.",
  },
  {
    id: 'trap_3',
    incorrectSentence: '（他社の人に対して）弊社の田中社長様はいらっしゃいません。',
    correctSentence: '（他社の人に対して）社長の田中は席を外しております。',
    trapType: '身内への敬称',
    explanationUz:
      "Begona kompaniya bilan gaplashganda o'z rahbari (Tanaka)ga '様' yoki 'いらっしゃる' qo'llanilmaydi. O'z tomoni pasaytirilib '社長の田中は...' deb aytiladi.",
  },
  {
    id: 'trap_4',
    incorrectSentence: '（上司に対して）ご苦労様でした。',
    correctSentence: '（上司に対して）お疲れ様でございました。',
    trapType: '目上への不敬',
    explanationUz:
      "'ご苦労様' faqat yuqori lavozimdagi odam pastdagilarga aytadi. Rahbarga 'お疲れ様でございました' deyish shart.",
  },
  {
    id: 'trap_5',
    incorrectSentence: '（取引先に対して）その件、了解しました。',
    correctSentence: '（取引先に対して）その件、かしこまりました / 承知いたしました。',
    trapType: 'マナー違反',
    explanationUz:
      "'了解' tengdoshlar yoki pastdagilar buyrug'ini tushunganda ishlatiladi. Mijoz va rahbarga '承知いたしました' yoki 'かしこまりました' aytiladi.",
  },
  {
    id: 'trap_6',
    incorrectSentence: 'お名前を頂戴できますでしょうか。',
    correctSentence: 'お名前をお伺いできますでしょうか。',
    trapType: 'マナー違反',
    explanationUz:
      "'頂戴する' jismoniy buyumni qabul qilishda ('名刺を頂戴する') ishlatiladi. Ismni esa 'お伺いする' orqali so'raladi.",
  },
];

export interface KeigoDrillQuestion {
  id: string;
  scenarioUz: string;
  speakerRole: string;
  listenerRole: string;
  questionPrompt: string;
  options: string[];
  correctIndex: number;
  explanationUz: string;
}

export const N1_KEIGO_DRILLS: KeigoDrillQuestion[] = [
  {
    id: 'kq_1',
    scenarioUz:
      'Kompaniyangiz bosh direktori (Shachou) xonasida muhim mehmon (Mijoz kompaniya boshqaruvi) kutmoqda. Siz mehmonga choy uzatmoqchisiz.',
    speakerRole: 'Qabulxona xodimi',
    listenerRole: 'VIP Hamkor Kompaniya Direktori',
    questionPrompt:
      'お茶を 勧[すす]めるときの 最[もっと]も 適切[てきせつ]な 敬語[けいご]表現[ひょうげん]は どれか。',
    options: [
      'どうぞ、お茶を いただいて ください。',
      'お茶を お淹[い]れ いたしましたので、どうぞ お召[め]し上[あ]がり ください。',
      'お茶を 飲[の]まれて ください。',
      'お茶を ご賞味[しょうみ] 申[もう]し上[あ]げます。',
    ],
    correctIndex: 1,
    explanationUz:
      "1-variantdagi 'いただく' Kenjougo bo'lgani uchun mehmonga qaratilishi xato. 3-variantdagi '飲まれてください' sun'iy va noto'g'ri. 4-variantdagi 'ご賞味' mehmonga aytilmaydi. 2-variantdagi 'お淹れいたしました' (o'z harakati Kenjougo) va 'お召し上がりください' (mehmon harakati Sonkeigo) benuqson Keigo hisoblanadi.",
  },
  {
    id: 'kq_2',
    scenarioUz:
      "Siz xorijiy hamkor kompaniya vakili bilan telefonda gaplashyapsiz. Hamkor sizning boshlig'ingiz (Sato) qachon qaytishini so'ramoqda.",
    speakerRole: 'Yordamchi xodim',
    listenerRole: "Hamkor kompaniya bo'lim boshlig'i",
    questionPrompt:
      '佐藤[さとう]部長[ぶちょう]の 状況[じょうきょう]を 伝[つた]える 表現[ひょうげん]として 正[ただ]しいものは どれか。',
    options: [
      '佐藤部長様は、ただいま 外出[がいしゅつ]されて いらっしゃいます。',
      '部長の佐藤は、ただいま 外出[がいしゅつ]して おります。15時には 戻[もど]る 予定[よてい]で ございます。',
      '佐藤部長は、外出[がいしゅつ]なさって おられます。',
      '佐藤部長は、ただいま 席[せき]を 外[はず]されて おられます。',
    ],
    correctIndex: 1,
    explanationUz:
      "Tashqi kompaniya bilan muloqotda o'z rahbariga '様' qo'yilmaydi va lavozim familiyadan oldin qo'yilib ('部長の佐藤は'), o'z harakati kamtarlik bilan '外出しております' (Teichougo) deb ifodalanadi.",
  },
  {
    id: 'kq_3',
    scenarioUz:
      "Mijoz sizga o'zining yangi mahsulot konsepsiyasi loyihasini ko'rsatib, fikringizni so'radi. Siz loyihani diqqat bilan o'qib chiqqaningizni aytmoqchisiz.",
    speakerRole: 'Katta biznes tahlilchi',
    listenerRole: 'Mijoz kompaniya raxbari',
    questionPrompt:
      '相手[あいて]の 企画書[きかくしょ]を 読[よ]んだことを 伝[つた]える 最[もっと]も 敬意[けいい]の 高[たか]い 表現[ひょうげん]は どれか。',
    options: [
      '企画書[きかくしょ]を ご覧[らん]に なりました。',
      '企画書[きかくしょ]を 拝読[はいどく] いたしました。大[たい]へん 感銘[かんめい]を 受[う]けました。',
      '企画書[きかくしょ]を お読[よ]み 申[もう]し上[あ]げました。',
      '企画書[きかくしょ]を 読[よ]ませて いただきました。',
    ],
    correctIndex: 1,
    explanationUz:
      "Mijozning hujjatini o'qishda '拝読する' (Haidoku suru - Kenjougo I) ishlatiladi. 'ご覧になる' esa Sonkeigo bo'lib, o'z harakatiga qo'llanmaydi.",
  },
];

// ============================================================================
// 5. SINONIM VA NUANS FARQLARI (類義語・ニュアンス徹底比較)
// ============================================================================

export interface N1NuanceComparison {
  id: string;
  category: 'grammar_construct' | 'advanced_vocabulary' | 'yontango';
  title: string;
  expressions: string[];
  coreDifferenceUz: string;
  comparativeDetails: Array<{
    expression: string;
    exactNuanceUz: string;
    volitionRule: string;
    tone: string;
    collocations: string[];
    exampleJp: string;
    exampleUz: string;
  }>;
  drillQuestion: {
    promptJp: string;
    promptUz: string;
    options: string[];
    correctIndex: number;
    explanationUz: string;
  };
}

export const N1_NUANCE_COMPARISONS: N1NuanceComparison[] = [
  {
    id: 'nuance_1',
    category: 'grammar_construct',
    title: '「〜を皮切りに」 vs 「〜を契機に」 vs 「〜を境に」',
    expressions: ['〜を皮切りに（して）', '〜を契機に（して）', '〜を境に（して）'],
    coreDifferenceUz:
      "Uchala konstruksiya ham boshlang'ich nuqtani bildirsa-da: '皮切り' birin-ketin kengayib boruvchi bir xil tipdagi faol harakatlar seriyasi uchun; '契機' tub burilish yasagan tarixiy yoki motivatsion sabab uchun; '境に' esa undan oldingi va keyingi holat tubdan farq qiluvchi chegara davr uchun ishlatiladi.",
    comparativeDetails: [
      {
        expression: '〜を皮切りに（して）',
        exactNuanceUz:
          "Boshlanish nuqtasi bo'lib, undan keyin o'sha turdagi ijobiy yoki shijoatli harakatlar ketma-ket kengayib boradi (masalan, konsert gastrollari, yangi filiallar ochilishi).",
        volitionRule: 'Odatda insonning irodaviy, faol harakatlari (意志動詞) keladi.',
        tone: 'Rasmiy, tantanavor, yangiliklar va hisobotlar uslubi.',
        collocations: ['東京公演を皮切りに', '今回の発売を皮切りに', '全国展開'],
        exampleJp:
          '東京[とうきょう]公演[こうえん]を 皮切[かわき]りに、全国[ぜんこく]10都市[とし]を 巡[めぐ]る ツアーが スタートした。',
        exampleUz:
          'Tokiodagi konsertdan boshlab butun mamlakatning 10 ta shahrini qamrab oluvchi gastrol safari boshlandi.',
      },
      {
        expression: '〜を契機に（して）',
        exactNuanceUz:
          "Katta o'zgarishga sabab bo'lgan tarixiy burilish nuqtasi, turtki yoki imkoniyat (yaxshi yoki jiddiy yo'nalishga o'zgarish).",
        volitionRule: "Natijada yangi qaror qabul qilinadi yoki vaziyat o'zgaradi.",
        tone: 'Akademik, rasmiy, publitsistik.',
        collocations: ['法改正を契機に', '病気入院を契機に', 'グローバル化の加速'],
        exampleJp:
          '環境[かんきょう] 汚染[おせん]の 深刻化[しんこくか]を 契機[けいき]に、法[ほう]規制[きせい]が 抜本的[ばっぽんてき]に 見直[みなお]された。',
        exampleUz:
          "Atrof-muhit ifloslanishining keskinlashishi turtki bo'lib, qonuniy me'yorlar tubdan qayta ko'rib chiqildi.",
      },
      {
        expression: '〜を境に（して）',
        exactNuanceUz:
          "Aynan o'sha vaqtdan oldin va keyin inson hayoti yoki vaziyat tubdan 180 gradusga o'zgargan chegara davri.",
        volitionRule: "Ko'pincha tabiiy o'zgarish yoki ong o'zgarishi (無意志動詞 / 状態変化).",
        tone: 'Shaxsiy yoki tahliliy xotiralar.',
        collocations: ['定年退職を境に', 'あの日を境に', 'ガラリと変わる'],
        exampleJp:
          '大病[たいびょう]を 患[わずら]ったのを 境[さかい]に、彼[かれ]の 人生観[じんせいかん]は ガラリと 変[か]わった。',
        exampleUz:
          "Og'ir kasallikka chalinganidan boshlab uning dunyoqarashi mutlaqo butunlay o'zgardi.",
      },
    ],
    drillQuestion: {
      promptJp:
        '新製品[しんせいひん]の 成功[せいこう]（　　）、わが社[しゃ]は 海外[かいがい]市場[しじょう]への 進出[しんしゅつ]を 本格化[ほんかくか]させた。',
      promptUz:
        "Yangi mahsulotning muvaffaqiyati turtki bo'lib (sababli), kompaniyamiz xorijiy bozorlarga chiqishni faollashtirdi.",
      options: ['を皮切りに', 'を契機に', 'を境に', 'にあって'],
      correctIndex: 1,
      explanationUz:
        "Muvaffaqiyat yangi strategik burilish va turtki bo'lgani uchun '〜を契機に' to'g'ri keladi. 'を皮切りに' ketma-ket o'xshash tadbirlar seriyasini talab qiladi.",
    },
  },
  {
    id: 'nuance_2',
    category: 'grammar_construct',
    title: '「〜余儀なくされる」 vs 「〜余儀なくさせる」',
    expressions: ['〜余儀なくされる', '〜余儀なくさせる'],
    coreDifferenceUz:
      "'される' passiv shaklda: ega (inson yoki tashkilot) noiloj qolib, o'z xohishiga qarshi majbur bo'ladi. 'させる' kauzativ shaklda: tashqi voqea yoki ofat kimnidir majburiy ahvolga solib qo'yadi.",
    comparativeDetails: [
      {
        expression: '〜余儀なくされる（受身）',
        exactNuanceUz:
          "Ega bo'lgan shaxs/kompaniya tashqi og'ir sharoit tufayli noilojlikdan o'z rejasini o'zgartirishga yoki to'xtatishga majbur bo'ladi.",
        volitionRule: "Ega: jabrlanuvchi subyekt ('〜は...余儀なくされた').",
        tone: "Og'ir vaziyatlarni ifodalovchi rasmiy tahliliy uslub.",
        collocations: ['避難を余儀なくされる', '撤退を余儀なくされる', '計画変更'],
        exampleJp:
          '台風[たいふう]の 直撃[ちょくげき]により、住民[じゅうみん]は 避難[ひなん]生活[せいかつ]を 余儀[よぎ]なくされた。',
        exampleUz:
          "To'fonning to'g'ridan-to'g'ri zarbasi tufayli aholi evakuatsiyada yashashga majbur bo'ldi.",
      },
      {
        expression: '〜余儀なくさせる（使役）',
        exactNuanceUz:
          "Ega odatda ofat, urush, qarz yoki kutilmagan tashqi omil bo'lib, u boshqa subyektni og'ir choraga majburlaydi.",
        volitionRule: "Ega: sababchi voqea ('〜が...余儀なくさせた').",
        tone: 'Gazeta sarlavhalari va sabab-oqibat tahlili.',
        collocations: ['変更を余儀なくさせる', '辞任を余儀なくさせる'],
        exampleJp:
          '相次[あいつ]ぐ 不祥事[ふしょうじ]が、社長[しゃちょう]に 辞任[じにん]を 余儀[よぎ]なくさせた。',
        exampleUz:
          "Ketma-ket yuz bergan janjalli voqealar prezidentni iste'foga chiqishga majbur qildi.",
      },
    ],
    drillQuestion: {
      promptJp:
        '財政[ざいせい]破綻[はたん]の 危機[きき]が、政府[せいふ]に 増税[ぞうぜい]を（　　）。',
      promptUz: 'Moliyaviy inqiroz xavfi hukumatni soliqlarni oshirishga majbur qildi.',
      options: ['余儀なくされた', '余儀なくさせた', '余儀なくさせられた', '余儀なくし得た'],
      correctIndex: 1,
      explanationUz:
        "Bu yerda ega inson emas, balki sababchi holat ('財政破綻の危機が' - inqiroz xavfi) bo'lgani uchun kauzativ shakldagi '〜余儀なくさせた' to'g'ri.",
    },
  },
  {
    id: 'nuance_3',
    category: 'advanced_vocabulary',
    title: '「懸念（けねん）」 vs 「危惧（きぐ）」 vs 「憂慮（ゆうりょ）」',
    expressions: ['懸念（けねん）', '危惧（きぐ）', '憂慮（ゆうりょ）'],
    coreDifferenceUz:
      "'懸念' (xavotir) kelajakdagi noaniq salbiy natijadan shubhalanish; '危惧' (xatar hissi) yaqinlashib kelayotgan xavf yoki fojiadan cho'chish; '憂慮' (chuqur qayg'u/g'am) jamiyat, xalq yoki kelajak taqdiri haqidagi oliy darajadagi ma'yus tashvish.",
    comparativeDetails: [
      {
        expression: '懸念（けねん）',
        exactNuanceUz:
          "Ehtimoliy noxush oqibatdan xavotirlanish. Biznes, iqtisodiyot va rasmiy hisobotlarda eng keng tarqalgan so'z.",
        volitionRule: '懸念される / 懸念を抱く / 懸念材料',
        tone: 'Neytral-rasmiy.',
        collocations: ['景気後退の懸念', '安全性への懸念', '懸念事項'],
        exampleJp:
          '原材料[げんざいりょう]の 価格[かかく]高騰[こうとう]による 業績[ぎょうせき]悪化[あっか]が 懸念[けねん]されている。',
        exampleUz:
          "Xomashyo narxlarining ko'tarilishi tufayli kompaniya ko'rsatkichlarining yomonlashishi xavotir uyg'otmoqda.",
      },
      {
        expression: '危惧（きぐ）',
        exactNuanceUz:
          "Xavf yoki tang holatning haqiqatda sodir bo'lishidan qo'rqish, xatar sezish (danger/crisis awareness).",
        volitionRule: '危惧される / 危惧の念',
        tone: "Xatarni ta'kidlovchi yuqori daraja.",
        collocations: ['絶滅が危惧される', '治安の悪化を危惧する', '危惧の念を禁じ得ない'],
        exampleJp:
          '生態系[せいたいけい]の 破壊[はかい]により、多[おお]くの 固有[こゆう]種[しゅ]の 絶滅[ぜつめつ]が 危惧[きぐ]されている。',
        exampleUz:
          "Ekologik tizimning buzilishi sababli ko'plab noyob turlarning qirilib ketishi jiddiy xavf ostida turibdi.",
      },
      {
        expression: '憂慮（ゆうりょ）',
        exactNuanceUz:
          "Jamiyat, davlat, yoshlar tarbiyasi kabi yuksak ijtimoiy-siyosiy masalalarga chuqur qayg'urish va g'am chekish.",
        volitionRule: '深く憂慮する / 憂慮すべき事態',
        tone: 'Davlat rahbarlari, faylasuflar va tahririyatlar uslubi.',
        collocations: ['将来を深く憂慮する', '憂慮に堪えない', '憂慮すべき事態'],
        exampleJp:
          '若年層[じゃくねんそう]の 活字[かつじ]離[ばな]れと 読解力[どっかいりょく]の 低下[ていか]は、深[ふか]く 憂慮[ゆうりょ]すべき 事態[じたい]である。',
        exampleUz:
          "Yoshlarning mutolaadan uzoqlashishi va o'qib tushunish qobiliyatining pasayishi chuqur qayg'urish lozim bo'lgan vaziyatdir.",
      },
    ],
    drillQuestion: {
      promptJp:
        '密猟[みつりょう]の 横行[おうこう]により、野生[やせい]トラの 個体数[こたいすう]激減[げきげん]と 絶滅[ぜつめつ]が（　　）されている。',
      promptUz:
        "Brakonyerlikning avj olishi tufayli yovvoyi yo'lbarslar sonining keskin kamayishi va qirilib ketishi xavfi mavjud.",
      options: ['憂慮', '危惧', '思索', '躊躇'],
      correctIndex: 1,
      explanationUz:
        "Biologik turlarning yo'qolib ketish xavfi (絶滅) iborasi yapon tilida doimo '絶滅が危惧される' shaklida mustahkam barqaror birikma (collocation) hisoblanadi.",
    },
  },
  {
    id: 'nuance_4',
    category: 'advanced_vocabulary',
    title:
      '「著しい（いちじるしい）」 vs 「夥しい（おびただしい）」 vs 「甚だしい（はなはだしい）」',
    expressions: ['著しい（いちじるしい）', '夥しい（おびただしい）', '甚だしい（はなはだしい）'],
    coreDifferenceUz:
      "'著しい' aniq, yaqqol ko'zga tashlanadigan taraqqiyot yoki o'zgarish (ijobiy yoki neytral); '夥しい' aql bovar qilmas darajadagi haddan tashqari ko'p miqdor (ko'pincha qon, vayronalar, zararlar); '甚だしい' me'yordan oshib ketgan noo'rin, tanqidga loyiq hadsizlik (beparvolik, mas'uliyatsizlik).",
    comparativeDetails: [
      {
        expression: '著しい（いちじるしい）',
        exactNuanceUz:
          "O'zgarish yoki rivojlanishning ravshan ko'rinib turishi. Ijobiy yutuqlarda ham keng ishlatiladi.",
        volitionRule: "Taraqqiyot, pasayish yoki taqqoslashda qo'llanadi.",
        tone: 'Ilmiy, rasmiy hisobot.',
        collocations: ['著しい進歩', '著しい回復', '著しい成果'],
        exampleJp:
          '近年の 医療[いりょう]技術[ぎじゅつ]の 進歩[しんぽ]には 著[いちじる]しい ものがある。',
        exampleUz:
          "So'nggi yillarda tibbiyot texnologiyasining rivojlanishida yaqqol ko'zga tashlanadigan ulkan siljish bor.",
      },
      {
        expression: '夥しい（おびただしい）',
        exactNuanceUz:
          "Ko'rish orqali his qilinadigan son-sanoqsiz, dahshatli darajada ko'p miqdor (salbiy yoki hayratlanarli manzaralar).",
        volitionRule: "Miqdor ifodalovchi otlar bilan keladi ('夥しい数の...')",
        tone: 'Publitsistik, tasviriy.',
        collocations: ['夥しい数の瓦礫', '夥しい流血', '夥しい死傷者'],
        exampleJp:
          '地震[じしん]の 爪痕[つめあと]として、倒壊[とうかい]した 家屋[かおく]から 夥[おびただ]しい 瓦礫[がれき]が 出[で]た。',
        exampleUz:
          'Zilzila oqibati sifatida qulagan uylardan son-sanoqsiz behisob vayronalar chiqdi.',
      },
      {
        expression: '甚だしい（はなはだしい）',
        exactNuanceUz:
          "Haddan oshgan noo'rinlik, aqlga sig'mas beparvolik yoki salbiy sifatning cho'qqisi.",
        volitionRule: "Odatda salbiy yoki tanqidiy tushunchalarga qo'shiladi.",
        tone: "Qat'iy tanqidiy.",
        collocations: ['無責任も甚だしい', '勘違いも甚だしい', '時代錯誤も甚だしい'],
        exampleJp:
          '重要[じゅうよう]な 会議[かいぎ]に 事前[じぜん]の 連絡[れんらく]もなく 欠席[けっせき]するとは、無責任[むせきにん]も 甚[はなは]だしい。',
        exampleUz:
          "Muhim yig'ilishga oldindan xabar bermasdan kelmaslik — o'ta hadsiz mas'uliyatsizlikdan boshqa narsa emas.",
      },
    ],
    drillQuestion: {
      promptJp:
        '事実[じじつ]無根[むこん]の 噂[うわさ]を 信[しん]じ込[こ]んで 相手[あいて]を 責[せ]め立[た]てるとは、（　　）も 甚[はなは]だしい。',
      promptUz:
        'Asossiz mish-mishlarga ishonib olib boshqalarni ayblash — haddan oshgan adashish va xomxayoldir.',
      options: ['進歩', '勘違い', '瓦礫', '回復'],
      correctIndex: 1,
      explanationUz:
        "Tanqidiy ma'nodagi '〜も甚だしい' grammatik qolipiga faqatgina '勘違い' (xato tushuncha / adashish) to'g'ri keladi: '勘違いも甚だしい'.",
    },
  },
];

// ============================================================================
// 6. IMPLICIT MEANING & INFERENCE SAVOLLARI (言外の意味・推論問題)
// ============================================================================

export interface N1InferenceTrapOption {
  textJp: string;
  textUz: string;
  isCorrect: boolean;
  trapType:
    | 'Word-Match Trap (Matndagi so‘zlardan yasalgan soxta tuzoq)'
    | 'Overgeneralization (Haddan ortiq umumlashtirish tuzog‘i)'
    | 'External Common Sense (Haqiqat, ammo muallif aytmagan tashqi bilim)'
    | 'Misattributed Causality (Sabab-oqibatni teskari talqin qilish)'
    | 'Correct Inference (Matndan mantiqan kelib chiquvchi yashirin xulosa)';
  distractorRationaleUz: string;
}

export interface N1InferenceQuestion {
  id: string;
  passageTitle: string;
  inferenceTheme: string;
  passageJp: string;
  passageUz: string;
  questionJp: string;
  questionUz: string;
  logicalProofChainUz: string;
  options: N1InferenceTrapOption[];
}

export const N1_INFERENCE_QUESTIONS: N1InferenceQuestion[] = [
  {
    id: 'inf_1',
    passageTitle: '批評[ひひょう]における 称賛[しょうさん]の 逆説[ぎゃくせつ]と 批判[ひはん]',
    inferenceTheme: 'Diplomatik maqtov ortiga yashiringan botiniy istehzo va tanqidni anglash',
    passageJp: `ある 新進[しんしん]気鋭[きえい]の 建築家[けんちくか]が 手[て]がけた 公共[こうきょう]図書館[としょかん]について、著名[ちょめい]な 批評家[ひひょうか]は 次[つぎ]のように 評[ひょう]した。
「この 建築[けんちく]は、斬新[ざんしん]な ガラス張[ば]りの 構造[こうぞう]と 前衛的[ぜんえいてき]な 造形美[ぞうけいび]によって、訪[おとず]れる 者[もの]の 視線[しせん]を 奪[うば]わずには おかない。
雑誌[ざっし]の 表紙[ひょうし]を 飾[かざ]り、SNSで 拡散[かくさん]される オブジェとしては、比類[ひるい]なき 完成度[かんせいど]を 誇[ほこ]っている。
しかし、ひとたび 本[ほん]を 手[て]に取[と]り、静寂[せいじゃく]の 中[なか]で 思索[しさく]に 沈[しず]もうとする 読書家[どくしょか]にとって、直射[ちょくしゃ]日光[にっこう]と 音[おと]の 反響[はんきょう]は、いささか 刺激的[しげきてき]に 過[す]ぎるかも 知[し]れない。」`,
    passageUz:
      "Taniqli bir arxitektura tanqidchisi yosh mashhur me'morning yangi jamoat kutubxonasi loyihasi haqida quyidagicha baho berdi: 'Ushbu bino o'zining yangicha shishasimon konstruksiyasi va avangard shakli bilan tashrif buyuruvchilarning nigohini maftun etmay qo'ymaydi. Jurnal muqovalarini bezaydigan va ijtimoiy tarmoqlarda tarqaladigan eksponat sifatida tengsiz mukammallikka ega. Biroq qo'liga kitob olib, sukunat ichida chuqur tafakkurga sho'ng'imoqchi bo'lgan kitobxon uchun quyoshning to'g'ridan-to'g'ri tushayotgan nurlari va tovush aks-sadosi bir oz ortiqcha bezovtalik tug'dirishi mumkin.'",
    questionJp:
      '批評家[ひひょうか]が この 建築[けんちく]について 言外[げんがい]に 最[もっと]も 伝[つた]えたかった 意図[いと]は どれか。',
    questionUz:
      "Tanqidchining ushbu bino haqida ochiq aytmasdan, so'zlar ortida yashirgan asl xulosasi nima?",
    logicalProofChainUz:
      "Tanqidchi dastlab binoni 'jurnal muqovasi va rasmga tushish uchun ajoyib' deb maqtagan, biroq 'kutubxonaning asl mohiyati bo'lgan kitob o'qish uchun shovqinli va yorug'' deb ko'rsatgan. Demak, uning yashirin xulosasi: bino tashqi ko'rinishga haddan ziyod berilib, kutubxonaning funksional vazifasiga putur yetkazgan.",
    options: [
      {
        textJp: 'ガラス張りの建築は採光に優れており、読書に最も適した環境を提供している。',
        textUz:
          "Shishali bino yorug'likni yaxshi o'tkazadi va mutolaa uchun eng qulay sharoit yaratadi.",
        isCorrect: false,
        trapType: 'Misattributed Causality (Sabab-oqibatni teskari talqin qilish)',
        distractorRationaleUz:
          "Matnda quyosh nuri mutolaa uchun 'ortiqcha bezovtalik' (刺激的に過ぎる) deb aytilgan, variant esa buni mutlaqo teskari talqin qilgan.",
      },
      {
        textJp: '外見の話題性や写真映えを重視するあまり、図書館本来の機能性が損なわれている。',
        textUz:
          "Tashqi ko'rinish va internetda shov-shuv bo'lishga berilib ketilgani sababli kutubxonaning asl funksionalligi buzilgan.",
        isCorrect: true,
        trapType: 'Correct Inference (Matndan mantiqan kelib chiquvchi yashirin xulosa)',
        distractorRationaleUz:
          "Tanqidchining maqtov ortidagi asl nishi aynan shu: bino ko'rgazmali obyekt bo'lib qolgan, ammo kutubxona sifatida yaroqsiz.",
      },
      {
        textJp: 'この建築家は才能がないため、今後は公共建築の設計に関わるべきではない。',
        textUz:
          "Bu arxitektor iste'dodsiz, shuning uchun boshqa jamoat binolarini loyihalamasligi kerak.",
        isCorrect: false,
        trapType: 'Overgeneralization (Haddan ortiq umumlashtirish tuzog‘i)',
        distractorRationaleUz:
          "Tanqidchi uning dizayn mahoratini (比類なき完成度) tan olgan. Butunlay qobiliyatsiz deb xulosa chiqarish me'yordan oshiq xatolikdir.",
      },
      {
        textJp: 'SNSで拡散される現代の建築は、すべて予算を削減して建設されている。',
        textUz:
          'Ijtimoiy tarmoqlarda tarqaladigan zamonaviy binolarning barchasi arzon byudjetda qurilgan.',
        isCorrect: false,
        trapType: 'External Common Sense (Haqiqat, ammo muallif aytmagan tashqi bilim)',
        distractorRationaleUz:
          'Matnda qurilish byudjeti yoki xarajatlar haqida umuman gapirilmagan.',
      },
    ],
  },
  {
    id: 'inf_2',
    passageTitle: '組織[そしき]改革[かいかく]における「合意[ごうい]形成[けいせい]」の 欺瞞[ぎまん]',
    inferenceTheme:
      'Kompaniya restrukturizatsiyasidagi passiv bayonotlar ostidagi haqiqatni ochish',
    passageJp: `わが社[しゃ]の 経営[けいえい]陣[じん]は、今回[こんかい]の 大規模[だいきぼ]な 事業[じぎょう]再編[さいへん]に際し、「全[ぜん]社員[しゃいん]の 忌憚[きたん]のない 意見[いけん]を 吸[す]い上[あ]げ、丁寧[ていねい]な 対話[たいわ]を 重[かさ]ねた 上[うえ]での 苦渋[くじゅう]の 決断[けつだん]であった」と プレスリリースで 強調[きょうちょう]した。
しかし、現場[げんば]の アンケート 回収[かいしゅう]率[りつ]が 90％を 超[こ]えていたにもかかわらず、提出[ていしゅつ]された 代替[だいたい]案[あん]が 経営[けいえい]会議[かいぎ]の 議題[ぎだい]に 上[のぼ]ることは 一度[いちど]として なかった。
発表[はっぴょう]の 翌日[よくじつ]には、すでに 半年[はんとし]前[まえ]から 準備[じゅんび]が進められていたと 見[み]られる 新[しん]体制[たいせい]の 組織[そしき]図[ず]が 速[すみ]やかに 全社[ぜんしゃ]へ 配布[はいふ]されたのである。`,
    passageUz:
      "Kompaniyamiz rahbariyati ushbu keng ko'lamli qayta tuzilish munosabati bilan bergan press-relizida: 'Barcha xodimlarning ochiq fikrlarini to'plab, bafurja muloqot o'tkazgan holda qabul qilingan og'ir qaror bo'ldi' deb ta'kidladi. Biroq xodimlarning so'rovnomadagi ishtiroki 90% dan oshganiga qaramasdan, ular taklif qilgan muqobil rejalar biror marta ham boshqaruv yig'ilishi kun tartibiga kiritilmadi. Rasmiy e'lonning ertasigayoq allaqachon olti oy oldin tayyorlab qo'yilgani ko'rinib turgan yangi tashkiliy tuzilma chizmasi zudlik bilan barcha bo'limlarga tarqatildi.",
    questionJp:
      '筆者[ひっしゃ]が この 文章[ぶんしょう]で 読者[どくしゃ]に 暗示[あんじ]している 事実[じじつ]として 最[もっと]も 妥当[だとう]なものは どれか。',
    questionUz:
      "Muallif ushbu matnda kitobxonga yashirincha qaysi haqiqatni uqtirmoqchi bo'lmoqda?",
    logicalProofChainUz:
      "Muallif 1) rahbariyat 'xodimlar fikri eshitildi' deb da'vo qilganini, 2) aslida so'rovlar umuman ko'rib chiqilmaganini va 3) qaror allaqachon yarim yil oldin yakunlab qo'yilganini dalillamoqda. Demak, 'xodimlar bilan maslahatlashuv' shunchaki nomigagina qilingan rasmiyatchilik bo'lgan.",
    options: [
      {
        textJp: '経営陣は社員のアンケート結果に深く感謝し、新体制にすべて反映させた。',
        textUz:
          "Rahbariyat so'rovnoma natijalari uchun minnatdor bo'lib, barchasini yangi rejaga kiritdi.",
        isCorrect: false,
        trapType: 'Word-Match Trap (Matndagi so‘zlardan yasalgan soxta tuzoq)',
        distractorRationaleUz:
          "Matndagi 'アンケート' so'zidan foydalanilgan, biroq xulosasi haqiqatga mutlaqo zid.",
      },
      {
        textJp:
          '「丁寧な対話」という説明は形式的な建前に過ぎず、事業再編は当初から既定路線であった。',
        textUz:
          "'Bafurja muloqot' degan da'vo shunchaki yuzaki rasmiyatchilik (tatemae) bo'lib, qayta tuzilish boshidanoq rejalashtirib bo'lingan edi.",
        isCorrect: true,
        trapType: 'Correct Inference (Matndan mantiqan kelib chiquvchi yashirin xulosa)',
        distractorRationaleUz:
          "Muallif 6 oy avval tuzilgan chizma va ko'rilmagan takliflarni taqqoslab aynan shu xulosani isbotlamoqda.",
      },
      {
        textJp: '社員の90％が新しい組織図に不満を抱いており、全員が退職を検討している。',
        textUz: "Xodimlarning 90 foizi norozi bo'lib, barchasi ishdan bo'shamoqchi.",
        isCorrect: false,
        trapType: 'Overgeneralization (Haddan ortiq umumlashtirish tuzog‘i)',
        distractorRationaleUz:
          "90% bu so'rovnomani to'ldirish ko'rsatkichi edi, norozilar soni emas.",
      },
      {
        textJp: 'プレスリリースを外部に公開した広報担当者の職務怠慢が問題視されている。',
        textUz:
          "Press-relizni e'lon qilgan matbuot kotibining mas'uliyatsizligi muammo qilinmoqda.",
        isCorrect: false,
        trapType: 'External Common Sense (Haqiqat, ammo muallif aytmagan tashqi bilim)',
        distractorRationaleUz: "Matnda matbuot kotibi haqida hech qanday baho yo'q.",
      },
    ],
  },
];

// Helper to convert N1 Editorials & Academic articles into standard JlptReadingPassage format
export function getAllN1ReadingPassages(): JlptReadingPassage[] {
  const editorialConverted: JlptReadingPassage[] = N1_EDITORIAL_SHASETSU.map((ed) => ({
    id: ed.id,
    level: 'N1',
    title: `${ed.title}`,
    passageType: 'medium',
    japaneseContent: ed.japaneseContent,
    uzbekTranslation: ed.uzbekTranslation,
    recommendedTimeMinutes: ed.recommendedMinutes,
    questions: ed.questions,
  }));

  const academicConverted: JlptReadingPassage[] = N1_ACADEMIC_ARTICLES.map((ac) => ({
    id: ac.id,
    level: 'N1',
    title: `学術論説[がくじゅつろんせつ]：${ac.title}`,
    passageType: 'medium',
    japaneseContent: ac.japaneseContent,
    uzbekTranslation: ac.uzbekTranslation,
    recommendedTimeMinutes: ac.recommendedMinutes,
    questions: ac.questions,
  }));

  return [...editorialConverted, ...academicConverted];
}
