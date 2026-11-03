import { CoachPersona } from './speakingTypes';

export const PROMPT_SUGGESTIONS_BY_LANG: Record<
  'en' | 'ja',
  { title: string; text: string; icon: string }[]
> = {
  en: [
    {
      title: 'Introduce Yourself',
      text: "Hajimemashite. Let's practice self-introduction in Japanese. Can you ask me questions to prompt my self-intro?",
      icon: '👋',
    },
    {
      title: 'Roast My Japanese',
      text: 'I want you to be a strict Japanese teacher. Correct every grammatical or pronunciation mistake I make in Japanese!',
      icon: '🔥',
    },
    {
      title: 'JLPT Speaking Mock',
      text: "Let's practice for JLPT speaking. Give me a daily conversation topic to talk about.",
      icon: '📝',
    },
    {
      title: 'IT Mock Interview',
      text: 'Act as a Japanese IT recruiter and ask me 3 interview questions in Japanese.',
      icon: '💼',
    },
  ],
  ja: [
    {
      title: '日常会話',
      text: '日本語で楽しい日常会話をしましょう！今日の予定や趣味を話したいです。',
      icon: '🏠',
    },
    {
      title: '旅行',
      text: '旅行について日本語で話しましょう。行きたい場所や旅の計画を練習したいです。',
      icon: '✈️',
    },
    {
      title: 'レストラン',
      text: 'レストランで注文する会話を練習したいです。店員さんになってください。',
      icon: '🍜',
    },
    {
      title: '仕事',
      text: '日本語で仕事の会話を練習したいです。面接の質問をしてください。',
      icon: '💼',
    },
  ],
};

export const getCoachInitialGreeting = (lang: 'en' | 'ja', _p?: CoachPersona): string => {
  if (lang === 'ja') {
    return 'こんにちは！調子はどうですか？今日はどんなことについて話しましょうか？';
  } else {
    return 'Hello! How are you doing today? What would you like to talk about?';
  }
};

// Short openings invite a real spoken answer instead of waiting for a typed topic.
export const COACH_CONVERSATION_OPENERS = {
  ja: [
    'こんにちは！今日はどんな一日でしたか？',
    'こんにちは！休みの日は何をするのが好きですか？',
    'こんにちは！今日、何かおいしいものを食べましたか？',
    'こんにちは！日本で行ってみたい場所はどこですか？',
    'こんにちは！最近、何か楽しいことがありましたか？',
  ],
  en: [
    'Hello! How has your day been?',
    'Hi! What do you enjoy doing on your days off?',
    'Hi! Have you eaten anything delicious today?',
  ],
};
export function getCoachConversationOpener(language: 'ja' | 'en'): string {
  const pool = COACH_CONVERSATION_OPENERS[language];
  return pool[Math.floor(Math.random() * pool.length)];
}
