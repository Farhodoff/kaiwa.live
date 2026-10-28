import React, { useMemo, useState } from 'react';
import { Headphones, RotateCcw, Star } from 'lucide-react';
import {
  getJlptQuestionTypeDefinition,
  normalizeJlptQuestionType,
  parseNumberList,
  parseStringList,
  type JlptQuestionType,
} from '../../types/jlptQuestionType';

export interface JlptQuestionPreviewData {
  id?: string | number;
  question_text: string;
  question_type?: string | null;
  options?: string[] | null;
  correct_answer?: string | null;
  correct_index?: number | null;
  explanation?: string | null;
  passage?: string | null;
  listening_audio_id?: string | null;
  question_payload?: Record<string, any> | null;
}

interface JlptQuestionPreviewProps {
  question: JlptQuestionPreviewData;
  sectionType?: string | null;
  selectedIndex?: number | null;
  showAnswer?: boolean;
  onSelect?: (index: number) => void;
  compact?: boolean;
}

const resolveType = (
  question: JlptQuestionPreviewData,
  sectionType?: string | null,
): JlptQuestionType =>
  normalizeJlptQuestionType(question.question_payload?.type || question.question_type, sectionType);

const resolveOptions = (question: JlptQuestionPreviewData): string[] => {
  const payload = question.question_payload || {};
  if (Array.isArray(payload.options)) return payload.options.map(String);
  if (Array.isArray(payload.fragments)) return payload.fragments.map(String);
  if (Array.isArray(question.options)) return question.options.map(String);
  if (typeof question.options === 'string') return parseStringList(question.options);
  return [];
};

const resolveCorrectIndex = (question: JlptQuestionPreviewData, options: string[]): number => {
  const payload = question.question_payload || {};
  const payloadIndex = Number(payload.correct_index);
  if (Number.isInteger(payloadIndex) && payloadIndex >= 0 && payloadIndex < options.length) {
    return payloadIndex;
  }
  if (
    typeof question.correct_index === 'number' &&
    question.correct_index >= 0 &&
    question.correct_index < options.length
  ) {
    return question.correct_index;
  }
  const answer = String(payload.correct_answer ?? question.correct_answer ?? '');
  if (answer) {
    const matched = options.findIndex((option) => option === answer);
    if (matched !== -1) return matched;
  }
  return -1;
};

const SentenceOrderingPreview: React.FC<{
  question: JlptQuestionPreviewData;
  fragments: string[];
  showAnswer: boolean;
}> = ({ question, fragments, showAnswer }) => {
  const payload = question.question_payload || {};
  const rawOrder = parseNumberList(payload.correct_order ?? payload.correctOrder);
  const correctOrder = rawOrder.map((value) =>
    value >= 1 && value <= fragments.length ? value - 1 : value,
  );
  const rawStar = Number(payload.star_position ?? payload.starPosition ?? 3);
  const starPosition = Number.isFinite(rawStar) ? rawStar : 3;
  const prefix = String(payload.prefix || '');
  const suffix = String(payload.suffix || '');
  const [placed, setPlaced] = useState<Array<number | null>>([null, null, null, null]);

  const placedSet = new Set(placed.filter((value): value is number => value !== null));
  const isComplete = placed.every((value) => value !== null);
  const isCorrect =
    isComplete &&
    correctOrder.length === 4 &&
    placed.every((value, index) => value === correctOrder[index]);
  const starValue =
    placed[Math.min(Math.max(starPosition, 1), 4) - 1] !== null
      ? fragments[placed[starPosition - 1] as number]
      : null;

  const placeFragment = (index: number) => {
    if (placedSet.has(index)) return;
    const slot = placed.findIndex((value) => value === null);
    if (slot === -1) return;
    const next = [...placed];
    next[slot] = index;
    setPlaced(next);
  };

  const removeFragment = (slot: number) => {
    const next = [...placed];
    next[slot] = null;
    setPlaced(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 dark:border-amber-900 dark:bg-amber-950/40">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> 文の組み立て
        </span>
        <span>★ {starPosition}-o‘rin</span>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/60 dark:bg-slate-950/60">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold leading-loose text-slate-900 dark:text-white">
          {prefix && <span>{prefix}</span>}
          {[0, 1, 2, 3].map((slot) => {
            const isStar = slot === starPosition - 1;
            const fragmentIndex = placed[slot];
            return (
              <button
                key={slot}
                type="button"
                onClick={() => fragmentIndex !== null && removeFragment(slot)}
                disabled={fragmentIndex === null}
                className={`inline-flex min-w-[54px] items-center justify-center rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                  isStar
                    ? 'border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                    : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                } ${fragmentIndex === null ? 'border-dashed opacity-60' : ''}`}
              >
                {isStar && <Star className="mr-1 h-3 w-3 fill-current" />}
                {fragmentIndex !== null ? fragments[fragmentIndex] : `(${slot + 1})`}
              </button>
            );
          })}
          {suffix && <span>{suffix}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {fragments.map((fragment, index) => (
          <button
            key={`${fragment}-${index}`}
            type="button"
            onClick={() => placeFragment(index)}
            disabled={placedSet.has(index)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-indigo-400 disabled:opacity-35 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {fragment}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPlaced([null, null, null, null])}
          disabled={placedSet.size === 0}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-500 disabled:opacity-40 dark:border-slate-800"
        >
          <RotateCcw className="h-3 w-3" /> Tozalash
        </button>
      </div>

      {showAnswer && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <b>To‘g‘ri tartib:</b> {correctOrder.map((index) => fragments[index] || '?').join(' → ')}
          {starValue && (
            <span className="ml-2">
              · ★ javobi: <b>{starValue}</b>
            </span>
          )}
          {isComplete && (
            <span className={`ml-2 font-black ${isCorrect ? 'text-emerald-700' : 'text-rose-600'}`}>
              {isCorrect ? '✓ To‘g‘ri' : '✗ Qayta urinib ko‘ring'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const JlptQuestionPreview: React.FC<JlptQuestionPreviewProps> = ({
  question,
  sectionType,
  selectedIndex,
  showAnswer = false,
  onSelect,
  compact = false,
}) => {
  const type = resolveType(question, sectionType);
  const definition = getJlptQuestionTypeDefinition(type);
  const options = useMemo(() => resolveOptions(question), [question]);
  const correctIndex = useMemo(() => resolveCorrectIndex(question, options), [question, options]);
  const isOrdering = definition.answerMode === 'sentence_ordering';
  const isListening = definition.section === 'listening';

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-indigo-300 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-black text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
          {definition.labelUz}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {definition.labelJa}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {definition.shortLabel}
        </span>
      </div>

      {definition.requiresPassage && question.passage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 font-serif text-[13px] leading-relaxed text-slate-800 shadow-inner dark:border-amber-900/50 dark:bg-slate-950 dark:text-slate-200">
          <div className="mb-1 font-sans text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            【問題本文 / Reading Passage】
          </div>
          <p className="whitespace-pre-wrap">{question.passage}</p>
        </div>
      )}

      {isListening && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs font-bold text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
          <Headphones className="h-4 w-4" />
          {question.listening_audio_id
            ? 'Audio biriktirilgan — tinglab javob bering.'
            : 'Audio hali biriktirilmagan (preview).'}
        </div>
      )}

      <p className="text-sm font-bold leading-relaxed text-slate-900 dark:text-white">
        {question.question_text}
      </p>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">{definition.instructionUz}</p>

      {isOrdering ? (
        <SentenceOrderingPreview question={question} fragments={options} showAnswer={showAnswer} />
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrect = index === correctIndex;
            let buttonStyle =
              'border-slate-200 bg-white text-slate-700 hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200';

            if (showAnswer) {
              if (isCorrect) {
                buttonStyle =
                  'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950/40 dark:text-emerald-300 shadow-sm';
              } else if (isSelected && !isCorrect) {
                buttonStyle =
                  'border-rose-500 bg-rose-50 text-rose-800 font-bold dark:bg-rose-950/40 dark:text-rose-300';
              }
            } else if (isSelected) {
              buttonStyle =
                'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-600 dark:bg-indigo-950 dark:text-indigo-300';
            }

            return (
              <button
                key={`${option}-${index}`}
                type="button"
                onClick={() => onSelect?.(index)}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition sm:text-sm ${buttonStyle}`}
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-current font-mono text-xs font-black">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </span>
                {showAnswer && isCorrect && (
                  <span className="text-[10px] font-black text-emerald-600">✓ TO‘G‘RI</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showAnswer && question.explanation && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <b>💡 Izoh va Qoida:</b> {question.explanation}
        </div>
      )}
    </div>
  );
};
