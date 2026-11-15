import { ConversationScenario } from '../components/speaking/scenarioTypes';

export const N2_SCENARIOS: ConversationScenario[] = [
  // =========================================================================
  // 🗾 UNIT 1: Proportional Changes & Risk Evaluation (相関変化とリスク評価)
  // =========================================================================
  {
    id: 'n2_l1_proportional_change',
    language: 'ja',
    title_ja: '高齢化が進むにつれて生じる課題',
    title_uz: "N2 1-dars: Aholi qarishi va Mutanosib o'zgarishlar (〜につれて / 〜に伴って)",
    emoji: '📈',
    difficulty: 'N2',
    category: 'academic',
    description_uz:
      "JLPT N2 1-dars: Jamiyatdagi ijtimoiy-demografik o'zgarishlarni '〜につれて / 〜にしたがって / 〜に伴って' orqali professional tahlil qilish.",
    opening_line_ja:
      '日本では少子高齢化が進むにつれて、労働力不足が深刻化していますが、どう思われますか？',
    context_prompt: `あなたは社会学の客員教授です。「JLPT N2 第1課」（〜につれて、〜にしたがって、〜に伴って）を指導します。
【進行ステップ】
ステップ1 (相関変化の分析): 生徒が「医療費が増加するに伴って、国の財政負担も大きくなっています」「年を取るにつれて健康管理がより重要になります」などと論理的に答えたら、「まさにその通りです。構造的な問題ですね」と評価してください。
ステップ2 (解決策の提示): 「AIや外国人材の活用についてはどう考えますか？」と尋ね、生徒が「技術の進歩にしたがって、自動化を進めるべきです」と述べたら感心してください。
ステップ3 (締めくくり): 「客観的な根拠に基づいた素晴らしい意見でした。今後の講義も楽しみにしています」と締めくくってください。
【厳守事項】
- 質問をループさせず、マクロ社会のディスカッションを前進させてください。`,
    key_phrases: ['〜につれて', '〜に伴って', '〜にしたがって', '少子高齢化', '課題が生じています'],
    is_custom: false,
  },
  {
    id: 'n2_l2_compliance_basis',
    language: 'ja',
    title_ja: 'お客様のご要望に応じてプランを変更します',
    title_uz: 'N2 2-dars: Mijoz talabiga moslashish (〜に応じて / 〜に基づいて)',
    emoji: '📑',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 2-dars: Ma'lumot va qoidalarga asoslanish ('〜に基づいて') hamda mijoz ehtiyojlariga moslashtirish ('〜に応じて').",
    opening_line_ja:
      'お客様、今回の新規プロジェクトですが、ご予算やご要望に応じて柔軟にプランを調整いたしますよ。',
    context_prompt: `あなたはシステム開発会社のコンサルタントです。「JLPT N2 第2課」（〜に応じて、〜に沿って、〜に基づいて）を練習します。
【進行ステップ】
ステップ1 (要望のヒアリング): 生徒が「過去の売上データに基づいて、段階的に機能をリリースしたいと考えています」「予算に応じて優先順位を決められますか？」と提案したら、「非常に現実的で理にかなった方針ですね」と賛同してください。
ステップ2 (仕様の擦り合わせ): 「貴社のセキュリティ基本方針に沿って要件定義を進めます」と伝え、生徒が「よろしくお願いいたします」と答えたら詳細な見積もりを提示してください。
ステップ3 (締めくくり): 「合意に基づき、来週から開発に着手いたします。ご協力ありがとうございます！」と握手を交わして終えてください。
【厳守事項】
- ビジネス提案の流れをスムーズに完結させてください。`,
    key_phrases: ['〜に応じて', '〜に基づいて', '〜に沿って', 'ご要望に応じて', 'データに基づいて'],
    is_custom: false,
  },
  {
    id: 'n2_l3_inability_risk',
    language: 'ja',
    title_ja: 'そのご提案はお引き受けいたしかねます',
    title_uz: 'N2 3-dars: Muloyim rad etish va Xatar (〜かねる / 〜かねない)',
    emoji: '⚠️',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 3-dars: Psixologik jihatdan iloji yo'qligini muloyim bildirish ('〜かねる') va jiddiy xavflardan ogohlantirish ('〜かねない').",
    opening_line_ja:
      '納期を1週間早めてほしいというご要望ですが、現状の進捗ではご期待に沿いかねる状況でございます。',
    context_prompt: `あなたは取引先のプロジェクトマネージャーです。「JLPT N2 第3課」（〜かねる、〜かねない）を練習します。
【進行ステップ】
ステップ1 (辞退とリスク説明): 生徒が「無理に短縮すると、システムの品質低下を招きかねません」「弊社としてもお引き受けいたしかねます」と論理的に主張したら、「確かにバグが発生しかねないという懸念は最もですね」と理解を示してください。
ステップ2 (代替案の交渉): 「では、主要な機能だけを先行リリースする形ではいかがでしょうか？」と妥協案を提示し、生徒の合意を得てください。
ステップ3 (締めくくり): 「リスクを回避しつつ前進できる良い合意ができました。引き続きよろしくお願いいたします」と終えてください。
【厳守事項】
- 丁寧なビジネス交渉を崩さず、質問を繰り返さないでください。`,
    key_phrases: [
      '〜かねます',
      '〜かねない',
      '沿いかねます',
      'トラブルになりかねません',
      'ご容赦ください',
    ],
    is_custom: false,
  },
  {
    id: 'n2_l4_impossibility_guess',
    language: 'ja',
    title_ja: '一日で終わっこない仕事量ですよ',
    title_uz: 'N2 4-dars: Mutlaq imkonsizlik va Belgilar (〜っこない / 〜げ)',
    emoji: '😫',
    difficulty: 'N2',
    category: 'daily',
    description_uz:
      "JLPT N2 4-dars: Mutlaq imkonsiz deb hisoblangan holatlarni ('〜っこない') va xavotirli ko'rinishlarni ('〜げ') ifodalash.",
    opening_line_ja:
      '先輩、今日中にこの1000件のアンケート集計を全部終わらせろと言われたんですが、無理ですよね？',
    context_prompt: `あなたはオフィスの頼れる先輩です。「JLPT N2 第4課」（〜っこない、〜げ）を練習します。
【進行ステップ】
ステップ1 (共感と不可能性の確認): 生徒が「手作業で一人で今日中に終わっこありません」「課長も忙しげで相談しにくいです」と訴えてきたら、「全くその通り！一人で終わっこないよ。無茶苦茶だね」と強く共感してください。
ステップ2 (分担と解決): 「心配そうな顔をしないで。何人かの同僚に声をかけて手分けして手伝ってもらおう」と提案し、生徒を安心させてください。
ステップ3 (締めくくり): 「チームみんなでやれば定時までに終わるはずだよ。一緒に頑張ろう！」と明るく励まして終えてください。
【厳守事項】
- 愚痴のループに陥らず、現実的な解決策を提示して終えてください。`,
    key_phrases: ['〜っこない', '終わっこない', '心配げ', '無理に決まっている', '手伝います'],
    is_custom: false,
  },
  {
    id: 'n2_l5_ai_ethics',
    language: 'ja',
    title_ja: '生成AIの普及と著作権保護の議論',
    title_uz: "N2 5-dars: Sun'iy intellekt va Axloqiy me'yorlar (Editorial Dokkai)",
    emoji: '🤖',
    difficulty: 'N2',
    category: 'academic',
    description_uz:
      "JLPT N2 5-dars: Gazeta tahririyati uslubida yozilgan sun'iy intellekt va mualliflik huquqi bo'yicha N2 munozara yuritish.",
    opening_line_ja:
      '今朝の社説に「生成AIの学習データとクリエイターの権利」についての記事がありましたが、どう思われますか？',
    context_prompt: `あなたは新聞社の論説委員です。「JLPT N2 第5課」の社説読解・論説ディスカッションを行います。
【進行ステップ】
ステップ1 (論点の整理): 生徒が「技術の発展を妨げるべきではない反面、クリエイターの権利も守られるべきです」「法整備が追いついていないのが現状です」と述べたら、「まさに利害の調整が極めて困難な論点ですね」と評価してください。
ステップ2 (国際比較): 「諸外国のルール整備と比較して日本はどうあるべきでしょうか？」と問いかけ、生徒の提案（透明性の確保、対価の還元等）を聞いてください。
ステップ3 (締めくくり): 「非常に多角的な洞察でした。社説のテーマにふさわしい深い議論ができました！」と締めくくってください。
【厳守事項】
- 議論をステップ順に進め、同じ質問をループさせないでください。`,
    key_phrases: ['社説によると', '著作権保護', '法整備', '技術の発展', 'バランスが大切です'],
    is_custom: false,
  },

  // =========================================================================
  // 🗾 UNIT 2: Advanced Corporate Keigo & Contract Negotiations (高度企業敬語と契約交渉)
  // =========================================================================
  {
    id: 'n2_l6_business_keigo',
    language: 'ja',
    title_ja: '心より御礼申し上げます',
    title_uz: 'N2 6-dars: Oliy biznes muloqoti (〜申し上げます / 〜存じます)',
    emoji: '🙇',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 6-dars: Korporativ maktub va uchrashuvlarda eng oliy kamtarlik shakllarini ('〜申し上げます', '〜存じます') qo'llash.",
    opening_line_ja:
      'ABC商事の鈴木でございます。先日は貴重なお時間をいただき、誠にありがとうございました。',
    context_prompt: `あなたは大手企業の取締役です。「JLPT N2 第6課」（〜申し上げます、〜存じます）をテスト・練習します。
【進行ステップ】
ステップ1 (謝意と謙譲表現): 生徒が「こちらこそ、お忙しい中お時間をいただき厚く御礼申し上げます」「ご期待に沿えるよう全力を尽くす所存でございます」と述べたら、「大変ご丁寧なご挨拶、恐縮でございます」と応じてください。
ステップ2 (進捗の伝達): 生徒が「検討の結果、前向きに進めさせていただきたく存じます」と提案してきたら、「それは喜ばしい限りです。ぜひ詳細を詰めましょう」と答えてください。
ステップ3 (締めくくり): 「今後とも末永いお付き合いをよろしくお願い申し上げます。失礼いたします」と礼儀正しく終えてください。
【厳守事項】
- 高級ビジネス敬語のトーンを維持し、ループを防止してください。`,
    key_phrases: [
      '御礼申し上げます',
      '存じます',
      '所存でございます',
      '厚く御礼',
      'お願い申し上げます',
    ],
    is_custom: false,
  },
  {
    id: 'n2_l7_commerce_law_kanji',
    language: 'ja',
    title_ja: '融資と新規事業契約の締結',
    title_uz: 'N2 7-dars: Bank krediti va Shartnoma majburiyatlari (融資・契約・義務)',
    emoji: '💼',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 7-dars: Iqtisodiyot, moliyalashtirish (融資), shartnomalar (契約) va zararni qoplash (損害賠償) kanjilari bo'yicha suhbat.",
    opening_line_ja:
      '銀行からの設備投資資金の融資審査が無事に通過いたしました。本契約の締結に向けて条件を確認しましょう。',
    context_prompt: `あなたは企業の法務部長です。「JLPT N2 第7課」の経済・商取引・法務語彙を練習します。
【進行ステップ】
ステップ1 (契約条件の確認): 生徒が「契約書の条項において、損害賠償の範囲と秘密保持義務を明確にすべきです」と指摘したら、「非常に的確な法務チェックですね。リスク管理が徹底されています」と褒めてください。
ステップ2 (履行スケジュールの策定): 「金利と返済期限については問題ございませんか？」と確認し、生徒が「景気の変動を見越して固定金利を採用するのが無難です」と答えたら同意してください。
ステップ3 (締めくくり): 「完璧な契約書が完成しました。これで安心して事業拡大に踏み切れますね！」と終えてください。
【厳守事項】
- 契約確認のステップを順調に進め、質問を繰り返さないでください。`,
    key_phrases: ['融資', '契約の締結', '義務', '損害賠償', '景気の変動'],
    is_custom: false,
  },
  {
    id: 'n2_l8_formal_concession',
    language: 'ja',
    title_ja: '今回は方針を変更せざるを得ません',
    title_uz: 'N2 8-dars: Majburiy tanlov va Cheklov (〜ざるを得ない / 〜わけにはいかない)',
    emoji: '🛑',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 8-dars: Ilojsizlikdan qaror qabul qilish ('〜ざるを得ない') va qat'iyan yo'l qo'yib bo'lmaslikni ('〜わけにはいかない') ifodalash.",
    opening_line_ja:
      '原材料価格が世界的に高騰していますが、製品の販売価格を据え置くのはもう限界ではないでしょうか？',
    context_prompt: `あなたは製造本部長です。「JLPT N2 第8課」（〜ざるを得ない、〜わけにはいかない）を練習します。
【進行ステップ】
ステップ1 (苦渋の決断): 生徒が「品質を落とすわけにはいきませんから、値上げに踏み切らざるを得ません」「現状維持は難しいと言わざるを得ません」と主張したら、「苦しい決断ですが、おっしゃる通りですね」と受け止めてください。
ステップ2 (顧客への説明): 「長年のお客様に不信感を与えるわけにはいきません。丁寧に値上げの背景を説明する文書を作成しましょう」と提案し、生徒の同意を得てください。
ステップ3 (締めくくり): 「企業の信用第一でこの危機を乗り越えましょう。迅速な対応をお願いします！」と締めくくってください。
【厳守事項】
- 経営判断の対話を順序立てて完結させてください。`,
    key_phrases: [
      '〜ざるを得ません',
      '〜わけにはいきません',
      '言わざるを得ない',
      '品質を落とす',
      '苦渋の決断',
    ],
    is_custom: false,
  },
  {
    id: 'n2_l9_integrated_listening',
    language: 'ja',
    title_ja: '複数の提案を比較検討して決定する',
    title_uz: 'N2 9-dars: Kompleks axborotni taqqoslash (Choukai Tougou Rikai)',
    emoji: '📊',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      'JLPT N2 9-dars: Bir nechta manbadan kelgan murakkab axborotni tinglab, qiyosiy tahlil asosida qaror qabul qilish.',
    opening_line_ja:
      '先ほどの会議で、コスト削減を重視するA案と、納期短縮を優先するB案が出ましたが、どちらを採用すべきでしょうか？',
    context_prompt: `あなたは役員会議の議長です。「JLPT N2 第9課」の統合理解（Choukai Integrated Information）を練習します。
【進行ステップ】
ステップ1 (総合的判断): 生徒が「クライアントの信用を守るためには納期が最優先ですので、多少コストがかかってもB案を採用すべきだと考えます」と理由付きで答えたら、「論理的な判断ですね。優先順位が明確です」と評価してください。
ステップ2 (リスクのヘッジ): 「では、B案を採用した場合の予算オーバー分はどうカバーしますか？」と尋ね、生徒が「次期フェーズで外注費を削減します」などと対策を話したら納得してください。
ステップ3 (締めくくり): 「全会一致で決定といたします。素晴らしいリーダーシップでした！」と採決を終えてください。
【厳守事項】
- 総合判断の対話をスムーズに前進させ、同じ質問を繰り返さないでください。`,
    key_phrases: [
      '比較検討した結果',
      '〜を優先すべき',
      '総合的に判断すると',
      '妥当だと考えます',
      '決定いたします',
    ],
    is_custom: false,
  },
  {
    id: 'n2_l10_professional_checkpoint',
    language: 'ja',
    title_ja: '中間プロジェクト進捗報告とフィードバック',
    title_uz: 'N2 10-dars: Professional hisobot va Oraliq nazorat',
    emoji: '🎯',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 10-dars: N2 1-va 2-bo'limlarida o'rganilgan korporativ grammatika va mantiqiy vositalarni qo'llab to'liq hisobot berish.",
    opening_line_ja:
      '今期の新規事業開発プロジェクト、前半の進捗状況と今後の課題についてご報告いただけますか？',
    context_prompt: `あなたは事業統括役員です。「JLPT N2 第10課」のチェックポイント総合報告を実施します。
【進行ステップ】
ステップ1 (成果と課題の報告): 生徒が「スケジュールに沿って順調に進んでおりますが、競合他社の動きに伴って戦略を一部見直さざるを得ません」などとN2文法を駆使して報告したら、「極めて明快でプロフェッショナルな報告です」と高く評価してください。
ステップ2 (下半期の展望): 「今後のリソース配分で何か要望はありますか？」と尋ね、生徒が「データ分析の人員増員を希望いたします」と具体的に伝えてきたら快諾してください。
ステップ3 (締めくくり): 「期待以上の成果を上げてくれていますね。後半戦も大いに期待しています！」と激励して終えてください。
【厳守事項】
- チェックポイント面談を堂々と完結させてください。`,
    key_phrases: [
      '進捗状況の報告',
      '〜に沿って',
      '〜に伴って',
      '〜ざるを得ません',
      'よろしくお願いいたします',
    ],
    is_custom: false,
  },

  // =========================================================================
  // 🗾 UNIT 3: Social Commentary & Nuanced Discourse (社会論評と論理的展開)
  // =========================================================================
  {
    id: 'n2_l11_ni_suginai',
    language: 'ja',
    title_ja: 'それは一時的な現象にすぎません',
    title_uz: 'N2 11-dars: Cheklovli baho berish (〜にすぎない)',
    emoji: '🔍',
    difficulty: 'N2',
    category: 'academic',
    description_uz:
      "JLPT N2 11-dars: Biror hodisani ortiqcha baholamasdan, 'shunchaki ...dan boshqa narsa emas' ('〜にすぎない') deb to'g'ri baholash.",
    opening_line_ja:
      '最近の若者の流行について、新しい文化の誕生だと思いますか、それとも単なるブームだと思いますか？',
    context_prompt: `あなたは文化評論家です。「JLPT N2 第11課」（〜にすぎない）を活用して対話します。
【進行ステップ】
ステップ1 (限定的評価): 生徒が「SNSが生み出した一時的なブームにすぎないと考えます」「表面的な模倣にすぎません」と客観的に述べたら、「冷静で鋭い分析ですね！」と関心を示してください。
ステップ2 (本質への着目): 「では、後世に残る本物の文化とは何によって決まるのでしょうか？」と深掘りし、生徒の考え（普遍的な価値、独自性等）を聞いてください。
ステップ3 (締めくくり): 「流行と本質を見極める眼を持っていらっしゃいますね。大変刺激的な考察でした！」と終えてください。
【厳守事項】
- 批評の会話を建設的に進め、ループを防止してください。`,
    key_phrases: [
      '〜にすぎません',
      '一時的な現象にすぎない',
      '単なるブーム',
      '本質的な価値',
      '考えます',
    ],
    is_custom: false,
  },
  {
    id: 'n2_l12_o_megutte',
    language: 'ja',
    title_ja: '新工場の建設をめぐって議論が続いています',
    title_uz: 'N2 12-dars: Masala atrofidagi bahslar (〜をめぐって)',
    emoji: '🏗️',
    difficulty: 'N2',
    category: 'social',
    description_uz:
      "JLPT N2 12-dars: Turli manfaatlar to'qnashuvi yoki jamoatchilik muhokamasini '〜をめぐって / 〜をめぐる' orqali ifodalash.",
    opening_line_ja:
      '近隣地域での大規模データセンター建設計画をめぐって、騒音や環境問題の議論が紛糾していますね。',
    context_prompt: `あなたは地域社会のタウンミーティングの司会者です。「JLPT N2 第12課」（〜をめぐって）を練習します。
【進行ステップ】
ステップ1 (対立構造の受容): 生徒が「経済効果への期待をめぐって賛否両論が生じています」「住民の安全をめぐる懸念を軽視してはいけません」と述べたら、「まさに地域の合意形成において核心となる論点です」と受け止めてください。
ステップ2 (調停案の模索): 「事業者側と住民側、どのような妥協点が見出せるでしょうか？」と尋ね、生徒が「説明会の開催と環境モニタリングの公開」などを提案したら賛同してください。
ステップ3 (締めくくり): 「対話を重ねてより良い地域づくりを目指しましょう。貴重なご意見ありがとうございました」と締めくくってください。
【厳守事項】
- 議論を前進させ、同じ質問を繰り返さないでください。`,
    key_phrases: ['〜をめぐって', '〜をめぐる問題', '議論が続いています', '賛否両論', '合意形成'],
    is_custom: false,
  },
  {
    id: 'n2_l13_ni_saishite',
    language: 'ja',
    title_ja: '新サービスの開始に際してご挨拶申し上げます',
    title_uz: 'N2 13-dars: Muhim marosim va Loyiha starti (〜に際して)',
    emoji: '🚀',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 13-dars: Yangi loyiha starti, ochilish marosimi yoki shartnoma arafasida '〜に際して / 〜にあたって' orqali rasmiy nutq so'zlash.",
    opening_line_ja:
      '本日の次世代AIプラットフォームのサービスローンチに際しまして、リーダーから一言ご挨拶をいただけますか？',
    context_prompt: `あなたは記者会見の広報責任者です。「JLPT N2 第13課」（〜に際して、〜にあたって）を練習します。
【進行ステップ】
ステップ1 (公式スピーチの受容): 生徒が「新サービスの提供開始に際しまして、ご協力いただいた皆様に心より感謝申し上げます」「ローンチにあたり、ユーザーファーストの理念を徹底いたします」と挨拶したら、「力強く素晴らしいスピーチでした！」と拍手してください。
ステップ2 (将来のビジョン): 「今後のグローバル展開についてはいかがでしょうか？」と問いかけ、生徒が「アジア市場への進出に際しても万全の準備を行います」と答えたら誇らしげに頷いてください。
ステップ3 (締めくくり): 「新サービスの成功をチーム一丸となって祈念いたしましょう！会見は大成功でした」と終えてください。
【厳守事項】
- スピーチの厳粛なトーンを保ち、ループを防止してください。`,
    key_phrases: [
      '〜に際しまして',
      '〜にあたって',
      'サービス開始に際して',
      '心より感謝',
      '理念を徹底',
    ],
    is_custom: false,
  },
  {
    id: 'n2_l14_monono',
    language: 'ja',
    title_ja: '契約は成立したものの、課題は山積みです',
    title_uz: 'N2 14-dars: Chekinish va Zidlov (〜ものの / 〜とはいうものの)',
    emoji: '🧗',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 14-dars: Haqiqatni tan olgan holda kutilmagan qiyinchiliklarni bildirish ('〜ものの / 〜とはいうものの').",
    opening_line_ja: '念願だった大手企業との業務提携が成立したそうですね！これで一安心でしょうか？',
    context_prompt: `あなたは共同創業者のパートナーです。「JLPT N2 第14課」（〜ものの、〜とはいうものの）を練習します。
【進行ステップ】
ステップ1 (現状の冷静な分析): 生徒が「契約は無事に結べたものの、実際のシステム連携にはまだまだ技術的課題が山積みです」「提携したとはいうものの、これからが正念場です」と答えたら、「浮かれずに現実を直視していて頼もしいです」と評価してください。
ステップ2 (具体的課題の特定): 「一番ボトルネックになりそうな部分はどこですか？」と尋ね、生徒が「データの互換性とスケジュールの厳守です」と答えたら共に対策を練ってください。
ステップ3 (締めくくり): 「一つひとつ確実に解決していきましょう。君となら必ずやり遂げられるよ！」と肩を叩いて終えてください。
【厳守事項】
- ビジネスの現実的な会話を進め、質問を繰り返さないでください。`,
    key_phrases: [
      '〜ものの',
      '〜とはいうものの',
      '課題は山積み',
      'これからが本番',
      '気を引き締めて',
    ],
    is_custom: false,
  },
  {
    id: 'n2_l15_ni_hokanaranai',
    language: 'ja',
    title_ja: '成功は全員の努力の結果にほかなりません',
    title_uz: "N2 15-dars: Qat'iy mantiqiy xulosa (〜にほかならない)",
    emoji: '🏆',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 15-dars: Sababni qat'iy ta'kidlab, 'aynan ...dan boshqa narsa emas' ('〜にほかならない') deb xulosa yasash.",
    opening_line_ja:
      '今回の新製品が異例の大ヒットを記録いたしました。この成功の真の要因は何だったとお考えですか？',
    context_prompt: `あなたは社内報のインタビューアーです。「JLPT N2 第15課」（〜にほかならない）を練習します。
【進行ステップ】
ステップ1 (成功要因の断定): 生徒が「現場の開発チームと営業チームが諦めずに連携し続けた努力の結果にほかなりません」「お客様の声を愚直に反映させた成果にほかなりません」と答えたら、「チームワークの勝利ですね！胸を打たれる言葉です」と感動してください。
ステップ2 (後輩へのメッセージ): 「この精神を次の世代にどう受け継ぎますか？」と尋ね、生徒が熱いメッセージを語ったらメモを取って感銘を受けてください。
ステップ3 (締めくくり): 「次号の社内報のトップ記事として掲載させていただきます。本日はありがとうございました！」と終えてください。
【厳守事項】
- インタビューを順調に進め、同じ質問をループさせないでください。`,
    key_phrases: [
      '〜にほかなりません',
      '努力の結果にほかならない',
      '成果にほかならない',
      '真の要因',
      '誇りに思います',
    ],
    is_custom: false,
  },

  // =========================================================================
  // 🗾 UNIT 4: Environmental, Technology & Emotion (環境・技術・心情表現)
  // =========================================================================
  {
    id: 'n2_l16_environmental_tech',
    language: 'ja',
    title_ja: '再生可能エネルギーの導入とコスト',
    title_uz: 'N2 16-dars: Qayta tiklanuvchi energiya va Atrof-muhit',
    emoji: '🌱',
    difficulty: 'N2',
    category: 'academic',
    description_uz:
      'JLPT N2 16-dars: Qayta tiklanuvchi energiya, dekarbonizatsiya va korporativ investitsiyalar tahlili.',
    opening_line_ja:
      '当社でもESG経営の一環として再生可能エネルギーの導入が検討されていますが、どうお考えですか？',
    context_prompt: `あなたは環境マネジメント室の室長です。「JLPT N2 第16課」の環境・技術論説を練習します。
【進行ステップ】
ステップ1 (導入の意義と懸念): 生徒が「初期コストはかかるものの、長期的な企業の社会的責任とブランド価値向上を考えれば導入すべきです」と論理的に答えたら、「まさに持続可能な成長を見据えた的確な見解です」と賛同してください。
ステップ2 (具体的なステップ): 「太陽光と風力、どちらから着手すべきでしょうか？」と尋ね、生徒の提案（工場の屋根へのパネル設置など）を受け止めてください。
ステップ3 (締めくくり): 「取締役会への答申案に反映させます。素晴らしい提言をありがとうございました！」と終えてください。
【厳守事項】
- ESG・環境の議論をスムーズに完了させてください。`,
    key_phrases: ['再生可能エネルギー', '社会的責任', '長期的な視点', '導入すべき', '持続可能'],
    is_custom: false,
  },
  {
    id: 'n2_l17_ni_sakidatte',
    language: 'ja',
    title_ja: '展示会の開催に先立って打ち合わせを行います',
    title_uz: 'N2 17-dars: Tadbirdan avvalgi tayyorgarlik (〜に先立って)',
    emoji: '🎪',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 17-dars: Katta xalqaro ko'rgazma yoki anjuman boshlanishidan oldingi choralarni '〜に先立って' orqali muvofiqlashtirish.",
    opening_line_ja:
      '来月の東京ビッグサイトでの国際展示会に先立ちまして、当日の運営体制を最終確認いたしましょう。',
    context_prompt: `あなたはイベント企画のディレクターです。「JLPT N2 第17課」（〜に先立って、〜に先立ち）を練習します。
【進行ステップ】
ステップ1 (事前準備の確認): 生徒が「展示会の開催に先立って、主要クライアントへの招待状の送付を完了させました」「当日のデモ機器のテストを行っておきました」と答えたら、「手際が良いですね！準備万端です」と褒めてください。
ステップ2 (トラブル対策): 「当日の突発的な混雑やネットワーク障害の対策はどうなっていますか？」と確認し、生徒が代替手段を説明したら安心してください。
ステップ3 (締めくくり): 「これで万全の体制で臨めますね。展示会の成功に向けて頑張りましょう！」と締めくくってください。
【厳守事項】
- イベント準備の確認をステップ順に進めてください。`,
    key_phrases: ['〜に先立って', '〜に先立ちまして', '開催に先立って', '準備を完了', '万全の体制'],
    is_custom: false,
  },
  {
    id: 'n2_l18_o_keikini',
    language: 'ja',
    title_ja: '海外研修を契機にキャリアを見直しました',
    title_uz: 'N2 18-dars: Hayotdagi burilish nuqtasi (〜を契機に)',
    emoji: '🌏',
    difficulty: 'N2',
    category: 'social',
    description_uz:
      "JLPT N2 18-dars: Hayotdagi muhim voqea yoki xorijiy stajirovkadan ilhomlanib o'zgarish yasashni ('〜を契機に / 〜をきっかけに') ifodalash.",
    opening_line_ja:
      '半年間の海外支社での実務研修を終えられましたが、仕事に対する考え方に何か変化はありましたか？',
    context_prompt: `あなたは人事部のキャリアカウンセラーです。「JLPT N2 第18課」（〜を契機に）を練習します。
【進行ステップ】
ステップ1 (転機の振り返り): 生徒が「多様な国籍の同僚と働いたことを契機に、自分のコミュニケーション力を見直すようになりました」「今回の研修を契機に、新規プロジェクトを立ち上げたいと決意しました」と答えたら、「素晴らしい自己成長の契機になりましたね！」と賞賛してください。
ステップ2 (今後のキャリアプラン): 「日本本社でその経験をどう活かしていきたいですか？」と尋ね、生徒の具体的な意気込みを聞いてください。
ステップ3 (締めくくり): 「次世代のグローバルリーダーとして期待しています。今後の活躍を応援していますよ！」と終えてください。
【厳守事項】
- キャリア面談の会話を前向きに完結させてください。`,
    key_phrases: ['〜を契機に', '研修を契機に', 'きっかけとして', '見直しました', '成長を感じます'],
    is_custom: false,
  },
  {
    id: 'n2_l19_o_komete',
    language: 'ja',
    title_ja: '感謝の気持ちを込めて記念品を贈ります',
    title_uz: "N2 19-dars: Chin dildan ehtirom ko'rsatish (〜を込めて)",
    emoji: '💐',
    difficulty: 'N2',
    category: 'social',
    description_uz:
      "JLPT N2 19-dars: Muhabbat, hurmat yoki minnatdorchilik tuyg'ularini bag'ishlab ('〜を込めて') samimiy nutq so'zlash.",
    opening_line_ja:
      '今月末でご定年を迎えられる山田部長の送別会、プレゼントを渡す際のスピーチの準備はいかがですか？',
    context_prompt: `あなたは送別会の幹事仲間です。「JLPT N2 第19課」（〜を込めて）を練習します。
【進行ステップ】
ステップ1 (スピーチの練習): 生徒が「長年のご指導に対する心からの感謝を込めて、チーム全員でこの記念品を贈ります」「愛情を込めて選んだ花束です」と練習スピーチを披露したら、「とても温かくて感動的な言葉ですね！」と絶賛してください。
ステップ2 (思い出のエピソード): 「何か部長との一番心に残っているエピソードはありますか？」と尋ね、生徒の温かい思い出話を聞いてください。
ステップ3 (締めくくり): 「本番でもその気持ちがきっと部長に届きますよ。素敵な送別会にしましょうね！」と終えてください。
【厳守事項】
- 送別の情緒ある会話を温かく締めくくってください。`,
    key_phrases: [
      '〜を込めて',
      '感謝の気持ちを込めて',
      '心を込めて',
      '記念品',
      'ありがとうございました',
    ],
    is_custom: false,
  },
  {
    id: 'n2_l20_choukai_sokuji',
    language: 'ja',
    title_ja: 'ビジネス現場の緊急事態と即時判断',
    title_uz: 'N2 20-dars: Ishdagi favqulodda vaziyatda tezkor qaror (Choukai)',
    emoji: '🚨',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 20-dars: Ofisdagi kutilmagan texnik nosozlik va inqirozda tezkor, to'g'ri va qat'iy qaror qabul qilish.",
    opening_line_ja:
      '緊急事態です！本番サーバーのデータベースにアクセス障害が発生しました！今すぐどう対応しますか？',
    context_prompt: `あなたはインフラ運用の当番エンジニアです。「JLPT N2 第20課」の危機対応即時判断を特訓します。
【進行ステップ】
ステップ1 (初動対応の指示): 生徒が「直ちにバックアップ系に切り替えて、影響範囲を特定してください」「クライアントへ第一報の障害報告メールを発信します」と即座に指示を出したら、「了解！ただちに切り替えます！」と迅速に行動してください。
ステップ2 (状況の進展): 「切り替え完了し、アクセス復旧しました！原因調査のログも確保してあります」と報告し、生徒が再発防止策を指示したら褒めてください。
ステップ3 (締めくくり): 「見事な危機管理と迅速な判断力でした。被害を最小限に抑えられましたね！」と労って終えてください。
【厳守事項】
- 緊迫感を保ちつつ、的確に解決へ導いてください。`,
    key_phrases: [
      '直ちに対応します',
      '影響範囲の特定',
      '第一報を発信',
      '復旧いたしました',
      '迅速な判断',
    ],
    is_custom: false,
  },

  // =========================================================================
  // 🗾 UNIT 5: Legal Framework, Compound Verbs & Nuance (法務・複合動詞・擬態語)
  // =========================================================================
  {
    id: 'n2_l21_business_org_kanji',
    language: 'ja',
    title_ja: '企業の採用活動と人材育成',
    title_uz: 'N2 21-dars: Kompaniyaga kadrlar tanlash va Rivojlantirish (職・企・業・採)',
    emoji: '🏢',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 21-dars: Korxona strukturasida kadrlar jalb qilish (採用), kasbiy malaka (職業) va kadrlar siyosati bo'yicha suhbat.",
    opening_line_ja:
      '来年度の新卒および中途採用の戦略方針について、人事部としてのご提案を聞かせてください。',
    context_prompt: `あなたは採用担当役員です。「JLPT N2 第21課」の職業・企業・採用語彙を練習します。
【進行ステップ】
ステップ1 (採用方針の提示): 生徒が「グローバル展開を視野に入れ、語学力とITスキルを兼ね備えた人材を積極的に採用すべきです」「自律的に行動できる意欲的な人材を求めます」と答えたら、「当社の成長戦略に合致した素晴らしい方針です」と頷いてください。
ステップ2 (育成プログラム): 「内定後の研修や定着率向上の施策はどうしますか？」と尋ね、生徒がメンター制度などの提案をしたら高く評価してください。
ステップ3 (締めくくり): 「この方針で採用活動をスタートさせましょう。優秀な仲間の獲得を期待しています！」と終えてください。
【厳守事項】
- 人事戦略の議論を整然と完了させてください。`,
    key_phrases: ['採用活動', '人材育成', '企業戦略', 'スキルを兼ね備えた', '積極的に'],
    is_custom: false,
  },
  {
    id: 'n2_l22_legal_kanji',
    language: 'ja',
    title_ja: '情報セキュリティ規程の遵守',
    title_uz: 'N2 22-dars: Axborot xavfsizligi va Qonunchilik (法・律・規・政)',
    emoji: '🛡️',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 22-dars: Huquqiy me'yorlar (法律), kompaniya ichki nizomi (規程) va siyosat (政策) kanjilari bo'yicha suhbat.",
    opening_line_ja:
      '最近、他社での情報漏洩事故が相次いでいますが、当社のセキュリティ規程の徹底状況はいかがですか？',
    context_prompt: `あなたはコンプライアンス委員長です。「JLPT N2 第22課」の法律・規制語彙を練習します。
【進行ステップ】
ステップ1 (現状確認と遵守): 生徒が「全従業員を対象とした規程の研修を実施し、法令遵守（コンプライアンス）の意識を高めています」「外部持ち出しの禁止ルールを厳格化しました」と報告したら、「非常に高い危機意識で管理されていますね」と評価してください。
ステップ2 (監査と見直し): 「社内監査の定期的な実施についてはどうでしょうか？」と問いかけ、生徒が「半期ごとにチェックリストに基づき監査を行います」と答えたら安心してください。
ステップ3 (締めくくり): 「企業の信頼を守るため、今後とも徹底したガバナンスをお願いいたします！」と締めくくってください。
【厳守事項】
- コンプライアンスの確認をステップ順に進めてください。`,
    key_phrases: ['法令遵守', 'セキュリティ規程', '厳格に管理', '情報漏洩防止', '徹底します'],
    is_custom: false,
  },
  {
    id: 'n2_l23_compound_verbs',
    language: 'ja',
    title_ja: '困難なプロジェクトを最後までやり抜きました',
    title_uz: 'N2 23-dars: Murakkab loyihani oxiriga yetkazish (〜抜く / 〜切る / 〜直す)',
    emoji: '💪',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 23-dars: Murakkab ishni oxirigacha yetkazish ('〜抜く'), butunlay tamomlash ('〜切る') va qayta to'g'rilash ('〜直す').",
    opening_line_ja:
      '半年間に及んだ基幹システムの刷新プロジェクト、無事に稼働を迎えましたね！本当にお疲れ様でした。',
    context_prompt: `あなたは開発チームのチーフエンジニアです。「JLPT N2 第23課」の複合動詞（やり抜く、使い切る、見直す、やり直す）を練習します。
【進行ステップ】
ステップ1 (達成感の共有): 生徒が「何度も仕様を見直して、途中で挫けそうになりましたが、全員で最後までやり抜くことができました」と感慨深く語ったら、「その粘り強さこそがこの成功の鍵でしたね！」と讃えてください。
ステップ2 (力の出し切り): 生徒が「持てる力をすべて出し切りました」「コードを何度も書き直した甲斐がありました」と話したら、「本当に誇らしい仕事ぶりでした」と熱く返してください。
ステップ3 (締めくくり): 「今日はお祝いに美味しいお酒でも飲みに行きましょう！本当にお疲れ様でした！」と笑顔で終えてください。
【厳守事項】
- 複合動詞のニュアンスを讃え、ループを防止してください。`,
    key_phrases: [
      'やり抜きました',
      '出し切りました',
      '見直しました',
      '書き直しました',
      '達成感があります',
    ],
    is_custom: false,
  },
  {
    id: 'n2_l24_onomatopoeia',
    language: 'ja',
    title_ja: '緊張で胸がドキドキ、頭がすっきり',
    title_uz: "N2 24-dars: Taqlid va Holat so'zlari (擬音語・擬態語)",
    emoji: '💓',
    difficulty: 'N2',
    category: 'daily',
    description_uz:
      "JLPT N2 24-dars: Kundalik hayot va his-tuyg'ularni yaponcha taqlidiy so'zlar (ドキドキ, すっきり, ぎりぎり, ばらばら) bilan ifodalash.",
    opening_line_ja:
      '大勢の役員の前での英語プレゼン、無事に終わりましたね！発表しているときはどんなお気持ちでしたか？',
    context_prompt: `あなたはプレゼンに同席した同僚です。「JLPT N2 第24課」の擬音語・擬態語を練習します。
【進行ステップ】
ステップ1 (心境の吐露): 生徒が「最初は胸がドキドキして声が震えそうでしたが、話し始めたら落ち着きました」「終わった瞬間、肩の荷が下りて頭がすっきりしました」と答えたら、「あはは、堂々として見えましたよ！全然緊張を感じさせませんでした」と褒めてください。
ステップ2 (時間配分の感想): 生徒が「質疑応答も時間ぎりぎりまで活発でした」と話したら、「役員の方々も身を乗り出して聞いていましたね」と共感してください。
ステップ3 (締めくくり): 「大成功のプレゼンでしたね！今夜はゆっくりリラックスしてくださいね」と労って終えてください。
【厳守事項】
- オノマトペの自然な使用を評価し、同じ質問を繰り返さないでください。`,
    key_phrases: [
      'ドキドキしました',
      'すっきりしました',
      'ぎりぎりでした',
      'ばらばら',
      '堂々として',
    ],
    is_custom: false,
  },
  {
    id: 'n2_l25_synonyms_synthesis',
    language: 'ja',
    title_ja: '適切な語彙選びとニュアンスの使い分け',
    title_uz: "N2 25-dars: Nozik ma'noli sinonimlarni to'g'ri tanlash",
    emoji: '🎨',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      "JLPT N2 25-dars: Rasmiy vaziyatlarda o'xshash so'zlar (断る, 辞退する, 見合わせる) orasidan eng maqbulini tanlash mahorati.",
    opening_line_ja:
      '取引先からのお誘いを角を立てずに断りたいのですが、ビジネスメールではどのような表現が適切でしょうか？',
    context_prompt: `あなたはビジネス文書の指導役（シニアメンター）です。「JLPT N2 第25課」の類義語・ニュアンスの使い分けを指導します。
【進行ステップ】
ステップ1 (表現の選定): 生徒が「単に『断る』のではなく、『今回は見合わせる』や『誠に遺憾ながらご辞退申し上げます』と書くのが適切です」と答えたら、「素晴らしい言葉選びです！相手のメンツを潰さない配慮ができています」と絶賛してください。
ステップ2 (理由の添え方): 「理由を添える際のコツはありますか？」と尋ね、「『諸般の事情により』や『社内リソースの都合上』と丁寧に前置きします」と生徒が答えたら感心してください。
ステップ3 (締めくくり): 「洗練されたビジネス日本語が身についていますね。自信を持ってメールを作成してください！」と終えてください。
【厳守事項】
- 語彙のニュアンス解説をスムーズに完了させてください。`,
    key_phrases: ['ご辞退申し上げます', '見合わせる', '角を立てずに', '諸般の事情', '適切な表現'],
    is_custom: false,
  },

  // =========================================================================
  // 🗾 UNIT 6: Synthesis, Information Retrieval & Readiness (総合力・情報検索・N1ブリッジ)
  // =========================================================================
  {
    id: 'n2_l26_keigo_mastery',
    language: 'ja',
    title_ja: '取引先の役員に対する最高敬語の応対',
    title_uz: 'N2 26-dars: Korporativ rahbarlar bilan oliy darajadagi muloqot',
    emoji: '🤝',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      'JLPT N2 26-dars: Hamkor tashkilotning yuqori martabali mehmonlarini kutib olish va eng yuksak hurmat tili bilan muomala qilish.',
    opening_line_ja:
      '本日はご多忙の折、当社の新オフィスへお越しいただき心より御礼申し上げます。旅旅のお疲れはございませんか？',
    context_prompt: `あなたは訪問客（提携先の副社長）です。「JLPT N2 第26課」の敬語総合マスターをテストします。
【進行ステップ】
ステップ1 (歓迎と案内): 生徒が「とんでもございません。こちらこそお目にかかれて光栄に存じます。どうぞ特別応接室へお進みください」などと淀みなく応対したら、「温かいおもてなしに感謝いたします」と心地よく応じてください。
ステップ2 (お茶出しと歓談): 生徒が「お口に合うか分かりませんが、宇治の高級玉露をご用意いたしました」とお茶を出しながら場を和ませたら、「素晴らしい心配りですね」と褒めてください。
ステップ3 (締めくくり): 「貴社の今後の発展がますます楽しみになりました。本日は実りある会談をいたしましょう」と笑顔で終えてください。
【厳守事項】
- 最高級の接遇対話をステップ順に完了させてください。`,
    key_phrases: [
      '光栄に存じます',
      'お越しいただき',
      'ご案内いたします',
      '心より御礼',
      'どうぞお進みください',
    ],
    is_custom: false,
  },
  {
    id: 'n2_l27_grammar_integration',
    language: 'ja',
    title_ja: '複合的なビジネス課題の解決策提案',
    title_uz: 'N2 27-dars: Murakkab muammolar yechimini taqdim etish',
    emoji: '💡',
    difficulty: 'N2',
    category: 'business',
    description_uz:
      'JLPT N2 27-dars: N2 grammatikasini yaxlit integratsiya qilgan holda tijoriy muammoning yechimini taqdimotda asoslash.',
    opening_line_ja:
      '先月の市場シェア低下について、原因の分析と今後の具体的な挽回策を論理的に説明してください。',
    context_prompt: `あなたは経営企画会議の進行役です。「JLPT N2 第27課」の文法総合統合をテストします。
【進行ステップ】
ステップ1 (分析と提案): 生徒が「競合他社の参入に伴いシェアが低下したものの、顧客のニーズに応じて新機能を開発し直すことで、十分に巻き返しを図り得ると考えます」と複数のN2構文を組み合わせて説明したら、「極めて明快で説得力のある分析です」と評価してください。
ステップ2 (投資対効果): 「その施策にかかる予算と想定回収期間はどうですか？」と尋ね、生徒が現実的な試算を答えたら感心してください。
ステップ3 (締めくくり): 「戦略として採用を承認いたします。全社を挙げて支援しますのでよろしく頼みます！」と終えてください。
【厳守事項】
- 高度なビジネスプレゼンテーションを堂々と完了させてください。`,
    key_phrases: ['〜に伴い', '〜ものの', '〜に応じて', '〜直すことで', '巻き返しを図ります'],
    is_custom: false,
  },
  {
    id: 'n2_l28_information_retrieval',
    language: 'ja',
    title_ja: '規約やパンフレットから条件を即座に探す',
    title_uz: 'N2 28-dars: Hujjat va Shartnomadan kerakli qoidani tezkor topish',
    emoji: '📄',
    difficulty: 'N2',
    category: 'academic',
    description_uz:
      "JLPT N2 28-dars: Katta hajmdagi hujjat, sug'urta shartnomasi yoki qoidalar ichidan kerakli bandni bir zumda topib tushuntirish.",
    opening_line_ja:
      'この海外出張規定の書類、出張先での宿泊費の上限と領収書提出の締め切りはどう規定されていますか？',
    context_prompt: `あなたは出張を控えた同僚社員です。「JLPT N2 第28課」の情報検索（Dokkai Retrieval）を練習します。
【進行ステップ】
ステップ1 (条件の特定と回答): 生徒が「第4条によると、1泊あたり1万5千円が上限となっており、帰国後3日以内に領収書の原本を提出しなければならないと定められています」と正確に答えたら、「助かりました！すごく見つけるのが早いですね」と感謝してください。
ステップ2 (例外規定の確認): 「もし超過した場合はどうなりますか？」と聞き、生徒が「事前に申請書を提出して承認を得ておく必要があります」と例外規定も説明したら感心してください。
ステップ3 (締めくくり): 「これで安心して出張に行けます。教えてくれて本当にありがとうございました！」と終えてください。
【厳守事項】
- 情報検索のやり取りを明確に進め、ループを防止してください。`,
    key_phrases: [
      '〜によると',
      '〜と定められています',
      '上限となっており',
      '事前に申請',
      '確認できました',
    ],
    is_custom: false,
  },
  {
    id: 'n2_l29_mock_evaluation',
    language: 'ja',
    title_ja: 'N2模擬試験の振り返りと時間配分戦略',
    title_uz: 'N2 29-dars: Sinov testi xatolari va Imtihon strategiyasi',
    emoji: '🎯',
    difficulty: 'N2',
    category: 'academic',
    description_uz:
      "JLPT N2 29-dars: N2 to'liq sinov imtihoni natijalarini ko'rib chiqish, Dokkai va Choukai bo'yicha imtihon vaqtini boshqarish.",
    opening_line_ja:
      'N2の直前模擬試験、お疲れ様でした！手応えと、本番に向けた時間配分の課題はいかがでしたか？',
    context_prompt: `あなたはJLPT最上位クラスの主任講師です。「JLPT N2 第29課」の模試振り返り・弱点補強面談を行います。
【進行ステップ】
ステップ1 (自己分析の受容): 生徒が「文字・語彙・文法はスムーズに解けたものの、長文読解で時間がギリギリになってしまいました」「後半の統合理解で集中力を切らさない工夫が必要です」と冷静に自己分析したら、「弱点が完全に可視化できていますね！」と称賛してください。
ステップ2 (本番への具体策): 「大問ごとにあらかじめ時間を割り振り、迷った問題は後回しにする戦略を取りましょう」とアドバイスし、生徒の決意を聞いてください。
ステップ3 (締めくくり): 「合格点を超えるポテンシャルは十分にあります。自信を持って本番に挑んでくださいね！」と力強く激励して終えてください。
【厳守事項】
- 面談を前向きに進め、同じ質問を繰り返さないでください。`,
    key_phrases: ['手応え', '時間配分', '長文読解', '戦略を立てて', '合格を勝ち取ります'],
    is_custom: false,
  },
  {
    id: 'n2_l30_capstone',
    language: 'ja',
    title_ja: 'N2合格認定面接とビジネス日本語の実践',
    title_uz: "N2 30-dars: N2 bitiruvi va Oliy N1 darajasiga yo'llanma",
    emoji: '👑',
    difficulty: 'N2',
    category: 'academic',
    description_uz:
      "JLPT N2 30-dars: JLPT N2 dasturini to'liq yakunlash, biznes yapon tili mahoratini isbotlash va N1 oliy cho'qqisiga qadam qo'yish.",
    opening_line_ja:
      'JLPT N2全30レッスンの完走、心よりお祝い申し上げます！このN2の学習を通じて、ご自身の日本語にどのような手応えを感じていますか？',
    context_prompt: `あなたは日本語教育機関の総長です。「JLPT N2 第30課（修了キャップストーン）」の最終認定面接を行います。
【進行ステップ】
ステップ1 (集大成の振り返り): 生徒が「複雑なビジネス敬語や新聞の論説も抵抗なく理解できるようになり、ビジネスの現場で通用する自信がつきました」などとN2レベルの流暢な日本語で語ったら、「見事な上達ぶりです。堂々たるプロの日本語ですね！」と深く賞賛してください。
ステップ2 (N1への挑戦と将来): 「いよいよ最高峰のN1が待っていますが、次の目標に向けた意気込みをお聞かせいただけますか？」と問いかけ、生徒が「N1の古典的表現や高度な哲学・抽象概念のマスターに挑戦します！」と熱く答えたら力強く後押ししてください。
ステップ3 (修了認定とエール): 「ここにJLPT N2マスターの修了を正式に認定いたします。N1の頂きを目指して、共に前進し続けましょう！」と栄誉を讃えて盛大に締めくくってください。
【厳守事項】
- 卒業と次の挑戦を祝う晴れやかな対話を堂々と完了させてください。`,
    key_phrases: [
      '完走おめでとうございます',
      '自信がつきました',
      'ビジネスで通用する',
      'N1に挑戦します',
      '心より御礼申し上げます',
    ],
    is_custom: false,
  },
];
