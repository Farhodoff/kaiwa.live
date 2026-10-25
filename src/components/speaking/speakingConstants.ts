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
      title: '自己紹介 (Jikoshoukai)',
      text: 'はじめまして。自己紹介の練習をしたいです。',
      icon: '🙋',
    },
    {
      title: 'カフェ・買い物 (Shopping & Cafe)',
      text: 'カフェでの注文やお店での買い物の練習をしたいです。',
      icon: '☕',
    },
    {
      title: '日常会話 (Daily Japanese)',
      text: '日本語で楽しい日常会話をしましょう！今日の予定や趣味を話したいです。',
      icon: '🗣️',
    },
    {
      title: '敬語・面接 (Interview & Keigo)',
      text: '丁寧な敬語や面接の練習をお願いします。',
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
