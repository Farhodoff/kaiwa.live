export const LEGACY_STANDALONE_EXAMS: Record<
  string,
  {
    exam: any;
    sections: any[];
    questionsBySection: Record<string, any[]>;
  }
> = {
  exam_jlpt_n1_1: {
    exam: {
      id: 'exam_jlpt_n1_1',
      title: 'JLPT N1 Official Practice Exam',
      type: 'JLPT N1',
      description: 'N1 言語知識・読解 (Academic & High-Register Reading Comprehension)',
    },
    sections: [
      {
        id: 'sec_n1_dokkai_1',
        exam_id: 'exam_jlpt_n1_1',
        title: 'N1 言語知識・読解 (Reading Comprehension)',
        type: 'Reading',
        order_index: 1,
        content: `科学技術の飛躍的進歩は、人間の生活様式のみならず精神構造や倫理観にも抜本的な変容を迫っている。とりわけ情報テクノロジーと生体医工学の融合は、従来アプリオリに自明とされてきた「人間存在の境界」そのものを揺るがしつつある。\n\n我々はいまや、技術の利便性に身を委ねるだけでなく、それがもたらす実存的危機の淵源を直視し、多元的な対話を通じて新たな規範を構築せざるを得ない段階に立たされている。`,
      },
    ],
    questionsBySection: {
      sec_n1_dokkai_1: [
        {
          id: 'q_n1_1',
          section_id: 'sec_n1_dokkai_1',
          question_text: '筆者が指摘する「技術の進歩がもたらす影響」として最も適切なものはどれか。',
          options: [
            '人間の生活様式を便利にするにとどまる',
            '人間存在の境界や倫理観に根本的な変容を迫っている',
            '科学と哲学の完全な分離をもたらした',
            '人間の精神構造を平穏にした',
          ],
          correct_answer: '人間存在の境界や倫理観に根本的な変容を迫っている',
          order_index: 1,
        },
        {
          id: 'q_n1_2',
          section_id: 'sec_n1_dokkai_1',
          question_text: '文中の「〜ざるを得ない」と同じ語法のニュアンスとして適切なものはどれか。',
          options: [
            '義務として強制される',
            '状況から判断してそうするより他に道がない',
            '自分の意志で喜んで選択する',
            '将来的に可能性が残されている',
          ],
          correct_answer: '状況から判断してそうするより他に道がない',
          order_index: 2,
        },
      ],
    },
  },
  exam_jlpt_n5_1: {
    exam: {
      id: 'exam_jlpt_n5_1',
      title: 'JLPT N5 Official Practice Exam',
      type: 'JLPT N5',
      description: 'N5 言語知識・読解 (Vocabulary, Grammar & Reading Comprehension)',
    },
    sections: [
      {
        id: 'sec_n5_dokkai_1',
        exam_id: 'exam_jlpt_n5_1',
        title: 'N5 言語知識・読解 (Reading Comprehension)',
        type: 'Reading',
        order_index: 1,
        content: `わたしは田中です。毎朝七時に起きます。あさごはんを食べてから、電車で大学へ行きます。\n大学の授業は九時から四時半までです。日本語の勉強はとても面白いですが、漢字は少し難しいです。\n放課後は図書館で一時間勉強して、六時に家へ帰ります。夜はテレビを見たり、音楽を聞いたりします。`,
      },
    ],
    questionsBySection: {
      sec_n5_dokkai_1: [
        {
          id: 'q_n5_1',
          section_id: 'sec_n5_dokkai_1',
          question_text: '田中さんは何で大学へ行きますか。',
          options: ['バス', 'じてんしゃ', 'でんしゃ', 'あるいて'],
          correct_answer: 'でんしゃ',
          order_index: 1,
        },
        {
          id: 'q_n5_2',
          section_id: 'sec_n5_dokkai_1',
          question_text: '田中さんは何時に起きますか。',
          options: ['六時', '六時半', '七時', '七時半'],
          correct_answer: '七時',
          order_index: 2,
        },
        {
          id: 'q_n5_3',
          section_id: 'sec_n5_dokkai_1',
          question_text: '田中さんは放課後どこで勉強しますか。',
          options: ['きょうしつ', 'としょかん', 'いえ', 'へや'],
          correct_answer: 'としょかん',
          order_index: 3,
        },
      ],
    },
  },
  exam_jlpt_n4_1: {
    exam: {
      id: 'exam_jlpt_n4_1',
      title: 'JLPT N4 Official Practice Exam',
      type: 'JLPT N4',
      description: 'N4 言語知識・読解 (Vocabulary, Grammar & Reading Comprehension)',
    },
    sections: [
      {
        id: 'sec_n4_dokkai_1',
        exam_id: 'exam_jlpt_n4_1',
        title: 'N4 言語知識・読解 (Reading Comprehension)',
        type: 'Reading',
        order_index: 1,
        content: `先週の土曜日、友達の佐藤さんと京都へ旅行に行きました。新幹線で行ったので、東京から二時間半しかかかりませんでした。\n午前中は有名なお寺を見学して、写真をたくさん撮りました。昼ごはんは京都の伝統的な日本料理を食べました。とてもおいしかったです。\n午後は少し雨が降ってきましたが、美術館に入ってゆっくり美術品を鑑賞することができました。また機会があれば行きたいです。`,
      },
    ],
    questionsBySection: {
      sec_n4_dokkai_1: [
        {
          id: 'q_n4_1',
          section_id: 'sec_n4_dokkai_1',
          question_text: '東京から京都まで何で行きましたか。',
          options: ['ひこうき', '新幹線 (しんかんせん)', '車 (くるま)', 'ふね'],
          correct_answer: '新幹線 (しんかんせん)',
          order_index: 1,
        },
        {
          id: 'q_n4_2',
          section_id: 'sec_n4_dokkai_1',
          question_text: '午後に雨が降ったとき、二人は何をしましたか。',
          options: [
            'お寺で雨宿りをした',
            '美術館に入って鑑賞した',
            '新幹線で東京へ帰った',
            '写真を撮り続けた',
          ],
          correct_answer: '美術館に入って鑑賞した',
          order_index: 2,
        },
      ],
    },
  },
  exam_jlpt_n3_1: {
    exam: {
      id: 'exam_jlpt_n3_1',
      title: 'JLPT N3 Official Practice Exam',
      type: 'JLPT N3',
      description: 'Kanji, Vocabulary, Grammar & Reading comprehensive exam',
    },
    sections: [
      {
        id: 'sec_n3_dokkai_1',
        exam_id: 'exam_jlpt_n3_1',
        title: '言語知識・読解 (Language Knowledge & Reading)',
        type: 'Reading',
        order_index: 1,
        content: `最近、リモートワークやオンライン授業が急速に普及してきました。家で仕事ができることは、通勤時間の節約になり、自由な時間が増えるという大きなメリットがあります。\n\nその一方で、同僚やクラスメートとの直接的なコミュニケーションが減少し、孤独を感じる人も増えています。効率性と人間関係のバランスをどのように取るかが、現代社会における重要な課題となっています。`,
      },
    ],
    questionsBySection: {
      sec_n3_dokkai_1: [
        {
          id: 'q_n3_1',
          section_id: 'sec_n3_dokkai_1',
          question_text: 'リモートワークの大きなメリットとして本文に挙げられているのはどれですか。',
          options: [
            '給料が増えること',
            '通勤時間が節約できること',
            '同僚と毎日会えること',
            '会社が大きくなること',
          ],
          correct_answer: '通勤時間が節約できること',
          order_index: 1,
        },
        {
          id: 'q_n3_2',
          section_id: 'sec_n3_dokkai_1',
          question_text: 'リモートワークの普及に伴って生じている課題は何ですか。',
          options: [
            '電気代が高くなること',
            '直接的な交流が減り孤独を感じること',
            '仕事がなくなること',
            'パソコンが壊れること',
          ],
          correct_answer: '直接的な交流が減り孤独を感じること',
          order_index: 2,
        },
        {
          id: 'q_n3_3',
          section_id: 'sec_n3_dokkai_1',
          question_text: '「節約 (せつやく)」の反対の意味に最も近い言葉はどれですか。',
          options: [
            '無駄遣い (むだづかい)',
            '努力 (どりょく)',
            '案内 (あんない)',
            '準備 (じゅんび)',
          ],
          correct_answer: '無駄遣い (むだづかい)',
          order_index: 3,
        },
      ],
    },
  },
  exam_jlpt_n2_1: {
    exam: {
      id: 'exam_jlpt_n2_1',
      title: 'JLPT N2 Advanced Reading & Listening',
      type: 'JLPT N2',
      description: 'Dokkai and Chokkai mock exam for N2 candidates',
    },
    sections: [
      {
        id: 'sec_n2_dokkai_1',
        exam_id: 'exam_jlpt_n2_1',
        title: 'N2 読解 (Reading Comprehension)',
        type: 'Reading',
        order_index: 1,
        content: `科学技術の進歩は私たちの生活を便利にするだけでなく、価値観そのものをも変容させつつある。人工知能（AI）の急速な台頭によって、従来人間にしかできないと考えられていた創造的な作業さえも機械が代替する可能性が指摘されている。\n\nしかし、技術を過信することなく、倫理的な観点からその利用方法を慎重に議論し続ける姿勢が不可欠である。`,
      },
    ],
    questionsBySection: {
      sec_n2_dokkai_1: [
        {
          id: 'q_n2_1',
          section_id: 'sec_n2_dokkai_1',
          question_text: 'AIの台頭に関して筆者が述べていることは何ですか。',
          options: [
            'AIは生活を不便にする',
            '人間にしかできなかった創造的作業も代替される可能性がある',
            'AIの開発は即時停止すべきである',
            'AIは倫理的な判断が得意である',
          ],
          correct_answer: '人間にしかできなかった創造的作業も代替される可能性がある',
          order_index: 1,
        },
        {
          id: 'q_n2_2',
          section_id: 'sec_n2_dokkai_1',
          question_text: '筆者が不可欠だと強調している姿勢は何ですか。',
          options: [
            '技術をすべて受け入れる姿勢',
            '倫理的観点から利用方法を慎重に議論する姿勢',
            'AIに頼り切る姿勢',
            '技術革新を恐れる姿勢',
          ],
          correct_answer: '倫理的観点から利用方法を慎重に議論する姿勢',
          order_index: 2,
        },
      ],
    },
  },
};
