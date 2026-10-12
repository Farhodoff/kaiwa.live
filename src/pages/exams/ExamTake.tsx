import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  Loader2,
  ArrowLeft,
  PenTool,
  Mic,
  FileText,
  Headphones,
  CheckCircle2,
  XCircle,
  Award,
} from 'lucide-react';
import { WritingSection } from '../../components/exams/WritingSection';
import { SpeakingSection } from '../../components/exams/SpeakingSection';
import { Button } from '../../components/ui/Button';
import { ExamCertificateModal } from '../../components/exams/ExamCertificateModal';
import { useStudyData } from '../../context/StudyPlannerContext';
import { HistoryService } from '../../services/HistoryService';

// Built-in standalone exams catalog when DB records do not exist
const BUILTIN_EXAMS: Record<
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

export const ExamTake: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, awardXP } = useStudyData();
  const [exam, setExam] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Questions and user answers state
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submittedResults, setSubmittedResults] = useState<{ score: number; total: number } | null>(
    null,
  );

  // Certificate modal state
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const resolvedId = id === 'exam_ielts_academic_1' ? 'exam_jlpt_n1_1' : id;

      // Check built-in exams first
      if (BUILTIN_EXAMS[resolvedId]) {
        const builtIn = BUILTIN_EXAMS[resolvedId];
        setExam(builtIn.exam);
        setSections(builtIn.sections);
        if (builtIn.sections.length > 0) {
          setActiveSectionId(builtIn.sections[0].id);
        }
        setLoading(false);
        return;
      }

      try {
        const { data: examData, error: examErr } = await supabase
          .from('exams')
          .select('*')
          .eq('id', resolvedId)
          .single();
        if (examErr || !examData) {
          // Fallback to built-in JLPT exam if unknown
          const fallback =
            BUILTIN_EXAMS['exam_jlpt_n5_1'] ||
            BUILTIN_EXAMS['exam_jlpt_n3_1'] ||
            BUILTIN_EXAMS['exam_jlpt_n1_1'];
          setExam(fallback.exam);
          setSections(fallback.sections);
          if (fallback.sections.length > 0) {
            setActiveSectionId(fallback.sections[0].id);
          }
        } else {
          setExam(examData);
          const { data: sectionsData } = await supabase
            .from('exam_sections')
            .select('*')
            .eq('exam_id', resolvedId)
            .order('order_index', { ascending: true });

          setSections(sectionsData || []);
          if (sectionsData && sectionsData.length > 0) {
            setActiveSectionId(sectionsData[0].id);
          }
        }
      } catch (err) {
        console.error('Exam fetch error:', err);
        const fallback =
          BUILTIN_EXAMS['exam_jlpt_n5_1'] ||
          BUILTIN_EXAMS['exam_jlpt_n3_1'] ||
          BUILTIN_EXAMS['exam_jlpt_n1_1'];
        setExam(fallback.exam);
        setSections(fallback.sections);
        if (fallback.sections.length > 0) {
          setActiveSectionId(fallback.sections[0].id);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id]);

  useEffect(() => {
    if (!activeSectionId || !id) return;

    const activeSec = sections.find((s) => s.id === activeSectionId);
    if (activeSec && (activeSec.type === 'Reading' || activeSec.type === 'Listening')) {
      setLoadingQuestions(true);
      setSubmittedResults(null);
      setUserAnswers({});

      // If built-in exam, load from dictionary
      if (BUILTIN_EXAMS[id]?.questionsBySection[activeSectionId]) {
        setQuestions(BUILTIN_EXAMS[id].questionsBySection[activeSectionId]);
        setLoadingQuestions(false);
        return;
      }

      const fetchQuestions = async () => {
        try {
          const { data } = await supabase
            .from('exam_questions')
            .select('*')
            .eq('section_id', activeSectionId)
            .order('order_index', { ascending: true });
          setQuestions(data || []);
        } catch {
          setQuestions([]);
        } finally {
          setLoadingQuestions(false);
        }
      };
      fetchQuestions();
    }
  }, [activeSectionId, sections, id]);

  const handleSelectOption = (questionId: string, option: string) => {
    if (submittedResults) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitAnswers = async () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });
    const result = { score: correctCount, total: questions.length };
    setSubmittedResults(result);
    setShowCertificate(true);

    // Award XP
    try {
      if (awardXP) {
        await awardXP(correctCount * 20);
      }
    } catch (e) {}

    // Persist attempt to HistoryService (mock_exams_history table)
    try {
      const isJlpt = exam?.type?.includes('JLPT');
      await HistoryService.saveMockExam({
        examType: isJlpt ? 'jlpt' : 'ielts_reading',
        level: exam?.type,
        score: correctCount,
        totalQuestions: questions.length,
        bandScore: isJlpt
          ? Math.round((correctCount / (questions.length || 1)) * 180)
          : Number(((correctCount / (questions.length || 1)) * 9).toFixed(1)),
      });
    } catch (err) {
      console.warn('Failed to persist mock exam result to history:', err);
    }

    // Record session to DB if user is logged in
    if (user?.id && id) {
      try {
        await supabase.from('exam_sessions').insert({
          user_id: user.id,
          exam_id: id,
          status: 'completed',
          completed_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Session record warning:', e);
      }
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold text-slate-500">Imtihon yuklanmoqda...</p>
      </div>
    );

  if (!exam)
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="max-w-sm space-y-4 rounded-3xl bg-slate-50 p-8 text-center dark:bg-slate-800">
          <FileText className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">Imtihon topilmadi</h3>
          <Button onClick={() => navigate('/exams')} className="w-full">
            Imtihonlar ro'yxatiga qaytish
          </Button>
        </div>
      </div>
    );

  const activeSection = sections.find((s) => s.id === activeSectionId);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 duration-300 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => navigate(-1)}
          className="rounded-2xl bg-slate-100 p-2.5 transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-extrabold uppercase ${
              exam.type.includes('JLPT')
                ? 'border-rose-500/20 bg-rose-500/10 text-rose-600'
                : 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600'
            }`}
          >
            {exam.type}
          </span>
          <h1 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white md:text-2xl">
            {exam.title}
          </h1>
        </div>
      </div>

      {/* Sections Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-3 dark:border-slate-800">
        {sections.map((section) => {
          const isActive = section.id === activeSectionId;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSectionId(section.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-extrabold transition-all ${
                isActive
                  ? 'scale-[1.02] bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {section.type === 'Writing' && <PenTool className="h-4 w-4" />}
              {section.type === 'Speaking' && <Mic className="h-4 w-4" />}
              {section.type === 'Reading' && <FileText className="h-4 w-4" />}
              {section.type === 'Listening' && <Headphones className="h-4 w-4" />}
              <span>{section.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Section Content */}
      <div className="pt-2">
        {activeSection ? (
          <div>
            {activeSection.type === 'Writing' && (
              <WritingSection
                examType="JLPT"
                promptText={activeSection.content || 'JLPT Writing Task prompti...'}
                promptId={activeSection.id}
                sessionId={id || ''}
              />
            )}

            {activeSection.type === 'Speaking' && (
              <SpeakingSection
                examType="JLPT"
                promptText={activeSection.content || 'JLPT Speaking Topic...'}
                promptId={activeSection.id}
                sessionId={id || ''}
              />
            )}

            {(activeSection.type === 'Reading' || activeSection.type === 'Listening') && (
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                {/* Left Pane: Dokkai Reading Passage / Text */}
                <div className="sticky top-4 max-h-[78vh] space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {activeSection.title} (Dokkai Matni)
                    </h3>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                    {activeSection.content || 'Hali matn kiritilmagan.'}
                  </div>
                </div>

                {/* Right Pane: Questions & Answer Selectors */}
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Savollar
                    </h3>
                    {submittedResults ? (
                      <button
                        onClick={() => setShowCertificate(true)}
                        className="flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-black text-green-600 transition hover:bg-green-500/20"
                      >
                        <Award className="h-4 w-4" /> Natija: {submittedResults.score} /{' '}
                        {submittedResults.total} (Sertifikat)
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        Javob berildi: {Object.keys(userAnswers).length} / {questions.length}
                      </span>
                    )}
                  </div>

                  {loadingQuestions ? (
                    <div className="py-12 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                  ) : questions.length > 0 ? (
                    <div className="max-h-[62vh] space-y-6 overflow-y-auto pr-1">
                      {questions.map((q, qIdx) => {
                        const isCorrect = userAnswers[q.id] === q.correct_answer;
                        return (
                          <div
                            key={q.id}
                            className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700/80 dark:bg-slate-800/50"
                          >
                            <p className="text-sm font-bold leading-snug text-slate-900 dark:text-white">
                              {qIdx + 1}. {q.question_text}
                            </p>

                            {q.options && (
                              <div className="space-y-2">
                                {(q.options as string[]).map((opt, optIdx) => {
                                  const isSelected = userAnswers[q.id] === opt;
                                  let btnStyle =
                                    'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400';

                                  if (submittedResults) {
                                    if (opt === q.correct_answer) {
                                      btnStyle =
                                        'bg-green-500/10 border-green-500 text-green-600 font-bold shadow-sm';
                                    } else if (isSelected && !isCorrect) {
                                      btnStyle =
                                        'bg-red-500/10 border-red-500 text-red-600 font-bold';
                                    }
                                  } else if (isSelected) {
                                    btnStyle =
                                      'bg-indigo-600 text-white font-bold border-indigo-600 shadow-md';
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => handleSelectOption(q.id, opt)}
                                      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-sm transition ${btnStyle}`}
                                    >
                                      <span>
                                        {String.fromCharCode(65 + optIdx)}) {opt}
                                      </span>
                                      {submittedResults && opt === q.correct_answer && (
                                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                                      )}
                                      {submittedResults && isSelected && !isCorrect && (
                                        <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {!submittedResults ? (
                        <Button
                          onClick={handleSubmitAnswers}
                          disabled={Object.keys(userAnswers).length === 0}
                          className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 font-bold text-white shadow-lg"
                        >
                          Javoblarni Tekshirish va Sertifikat Olish 🎓 (
                          {Object.keys(userAnswers).length}/{questions.length})
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setSubmittedResults(null)}
                          className="w-full rounded-2xl py-3.5 font-bold"
                        >
                          Qayta Urinish
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="py-12 text-center text-sm text-slate-400">
                      Bu bo'limga hali savollar kiritilmagan.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            Bo'lim tanlanmagan yoki yuklanmadi.
          </div>
        )}
      </div>

      {/* Official Certificate Modal */}
      <ExamCertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        examTitle={exam.title}
        examType={exam.type}
        overallScore={
          submittedResults ? `${submittedResults.score} / ${submittedResults.total}` : 'N/A'
        }
        sectionScores={{
          reading: submittedResults
            ? `${Math.round((submittedResults.score / submittedResults.total) * 100)}%`
            : undefined,
        }}
        userName={user?.email ? user.email.split('@')[0] : "O'quvchi"}
        aiFeedback={
          submittedResults
            ? `Tabriklaymiz! Siz ${exam.title} bo'yicha ${submittedResults.score} ta to'g'ri javob berdingiz (${Math.round((submittedResults.score / (submittedResults.total || 1)) * 100)}%). Keyingi bosqichga o'tish tavsiya etiladi.`
            : undefined
        }
      />
    </div>
  );
};

export default ExamTake;
