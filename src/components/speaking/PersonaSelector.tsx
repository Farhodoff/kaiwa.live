import React from 'react';
import { Flame, Sparkles, GraduationCap, Briefcase, Compass, Coffee } from 'lucide-react';

export type CoachPersona = 'roast' | 'gentle' | 'ielts' | 'interview' | 'travel' | 'casual';

export const PERSONAS_BY_LANG: Record<
  'en' | 'ja',
  Record<
    CoachPersona,
    {
      name: string;
      icon: any;
      color: string;
      gradientBg: string;
      desc: string;
      badge: string;
      emoji: string;
    }
  >
> = {
  en: {
    roast: {
      name: 'Strict Roast Coach',
      icon: Flame,
      color: 'from-orange-500 to-rose-600',
      gradientBg: 'from-orange-500/20 via-rose-500/10 to-transparent',
      desc: 'Kamchiliklaringizni shafqatsiz va hazil aralash roast qiladi',
      badge: '🌶️ Shiddatli & Roast',
      emoji: '🔥',
    },
    gentle: {
      name: 'Sabrli Tutor',
      icon: Sparkles,
      color: 'from-emerald-400 to-teal-600',
      gradientBg: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      desc: 'Yumshoq va xushmuomala tarzda xatolaringizni tushuntiradi',
      badge: '🌿 Muloyim & Sabrli',
      emoji: '✨',
    },
    ielts: {
      name: 'JLPT Sensei (Imtihonchi)',
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-600',
      gradientBg: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      desc: "JLPT suhbat va grammatika standarti bo'yicha savol-javob qiladi",
      badge: '🎓 JLPT Sensei',
      emoji: '🎓',
    },
    interview: {
      name: 'Tech & Job Interviewer',
      icon: Briefcase,
      color: 'from-purple-500 to-violet-700',
      gradientBg: 'from-purple-500/20 via-violet-500/10 to-transparent',
      desc: 'Yaponiyada ishga kirish suhbatlariga (Menya) yapon tilida tayyorlaydi',
      badge: '💼 IT & Menya',
      emoji: '💼',
    },
    travel: {
      name: 'Travel & Airport',
      icon: Compass,
      color: 'from-cyan-500 to-blue-600',
      gradientBg: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      desc: 'Aeroport, mehmonxona va restoranlarda muloqot mashqi',
      badge: '✈️ Sayohat & Aeroport',
      emoji: '✈️',
    },
    casual: {
      name: 'Casual Friend',
      icon: Coffee,
      color: 'from-amber-500 to-orange-600',
      gradientBg: 'from-amber-500/20 via-orange-500/10 to-transparent',
      desc: "Erkin, do'stona va kundalik mavzularda suhbatdosh",
      badge: "☕ Do'stona Suhbat",
      emoji: '☕',
    },
  },
  ja: {
    casual: {
      name: 'Erkin Muloqot (フリートーク)',
      icon: Coffee,
      color: 'from-amber-500 to-orange-600',
      gradientBg: 'from-amber-500/20 via-orange-500/10 to-transparent',
      desc: 'Xohlagan mavzuda erkin va do‘stona yaponcha muloqot',
      badge: '🍵 Erkin Suhbat',
      emoji: '🍵',
    },
    gentle: {
      name: 'Sabrli va Muloyim',
      icon: Sparkles,
      color: 'from-emerald-400 to-teal-600',
      gradientBg: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      desc: 'Boshlang‘ich darajadagilar uchun tushunarli va muloyim suhbat',
      badge: '🌸 Muloyim',
      emoji: '🌸',
    },
    roast: {
      name: 'Qat’iy Tahlilchi',
      icon: Flame,
      color: 'from-red-500 to-rose-600',
      gradientBg: 'from-red-500/20 via-rose-500/10 to-transparent',
      desc: 'Har bir grammatik va so‘z xatolarini darhol ko‘rsatib boradi',
      badge: '🔥 Qat’iy',
      emoji: '🔥',
    },
    ielts: {
      name: 'JLPT Amaliyoti',
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-600',
      gradientBg: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      desc: 'JLPT N5–N1 darajalari bo‘yicha nutq tayyorgarligi',
      badge: '🎌 JLPT',
      emoji: '🎌',
    },
    interview: {
      name: 'Ish Intervyusi (Mensetsu)',
      icon: Briefcase,
      color: 'from-purple-500 to-violet-700',
      gradientBg: 'from-purple-500/20 via-violet-500/10 to-transparent',
      desc: 'Yaponiyada ishga kirish va suhbat mashqlari',
      badge: '💼 Mensetsu',
      emoji: '💼',
    },
    travel: {
      name: 'Sayohat va Hayot',
      icon: Compass,
      color: 'from-cyan-500 to-blue-600',
      gradientBg: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      desc: 'Aeroport, do‘kon, mehmonxona va kundalik vaziyatlar',
      badge: '🗼 Sayohat',
      emoji: '🗼',
    },
  },
};

interface PersonaSelectorProps {
  language: 'en' | 'ja';
  selectedPersona: CoachPersona;
  onSelectPersona: (p: CoachPersona) => void;
  disabled?: boolean;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  language,
  selectedPersona,
  onSelectPersona,
  disabled = false,
}) => {
  const personas = PERSONAS_BY_LANG[language];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {(Object.keys(personas) as CoachPersona[]).map((pKey) => {
        const p = personas[pKey];
        const IconComponent = p.icon;
        const isSelected = selectedPersona === pKey;

        return (
          <button
            key={pKey}
            disabled={disabled}
            onClick={() => onSelectPersona(pKey)}
            className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3.5 text-left transition-all ${
              isSelected
                ? `bg-gradient-to-br ${p.gradientBg} border-primary shadow-md ring-2 ring-primary/20`
                : 'border-border/70 bg-card text-muted-foreground hover:bg-muted/50'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-[1.02]'}`}
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className={`rounded-xl bg-gradient-to-r p-2 ${p.color} text-white shadow-sm`}>
                  <IconComponent size={16} />
                </span>
                <span className="text-xs font-bold">{p.emoji}</span>
              </div>
              <h4 className="line-clamp-1 text-xs font-extrabold text-foreground">{p.name}</h4>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                {p.desc}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2 text-[10px] font-bold">
              <span className="text-primary">{p.badge}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
