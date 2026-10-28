import React from 'react';
import { useStudyData } from '../../context/StudyPlannerContext';

export type FuriganaMode = 'always' | 'never' | 'hover';

interface FuriganaTextProps {
  text: string;
  className?: string;
  rubyClassName?: string;
  /** Override global setting for specific usage */
  forceShow?: boolean;
  /** Display mode: 'always' (default if showFurigana is true), 'never', or 'hover' (only on hover/tap) */
  mode?: FuriganaMode;
}

/**
 * Renders Japanese text with optional Furigana (ruby) annotations.
 * Respects global showFurigana / showRomaji settings from StudyPlannerContext.
 *
 * Syntax: 漢字[かんじ] — wraps kanji with its reading in brackets.
 * Example: "日本語[にほんご]を勉強[べんきょう]する"
 */
export const FuriganaText: React.FC<FuriganaTextProps> = ({
  text,
  className = '',
  rubyClassName = 'text-[0.62em] font-japanese font-normal select-none text-muted-foreground/90',
  forceShow,
  mode,
}) => {
  const { settings } = useStudyData();
  const showFurigana =
    mode === 'never'
      ? false
      : mode === 'hover' || mode === 'always'
        ? true
        : forceShow !== undefined
          ? forceShow
          : (settings?.showFurigana ?? true);

  const isHoverMode = mode === 'hover';

  if (!text) return null;

  // Pattern matches Kanji[Furigana] or Kanji(Furigana) or Kanji（Furigana）
  const regex =
    /([一-龯々〆ヵヶA-Za-z0-9]+)(?:\[([^\]]+)\]|\(([\u3040-\u309f\u30a0-\u30ff]+)\)|（([\u3040-\u309f\u30a0-\u30ff]+)）)/g;
  const parts: { type: 'text' | 'ruby'; content?: string; kanji?: string; furigana?: string }[] =
    [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    const reading = match[2] || match[3] || match[4];
    parts.push({ type: 'ruby', kanji: match[1], furigana: reading });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return (
    <span
      className={`font-japanese inline-flex flex-wrap items-baseline leading-relaxed ${className}`}
    >
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return <span key={idx}>{part.content}</span>;
        }
        if (!showFurigana) {
          return <span key={idx}>{part.kanji}</span>;
        }

        if (isHoverMode) {
          return (
            <ruby
              key={idx}
              className="group relative mx-[1px] inline-flex cursor-help flex-col items-center"
              title={`${part.kanji}: ${part.furigana}`}
            >
              <span className="border-b border-dotted border-rose-400/50 leading-none transition-colors group-hover:border-rose-400">
                {part.kanji}
              </span>
              <rt
                className={`pt-0.5 leading-none tracking-tight opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100 ${rubyClassName}`}
              >
                {part.furigana}
              </rt>
            </ruby>
          );
        }

        return (
          <ruby key={idx} className="mx-[1px] inline-flex flex-col items-center">
            <span className="leading-none">{part.kanji}</span>
            <rt className={`pt-0.5 leading-none tracking-tight ${rubyClassName}`}>
              {part.furigana}
            </rt>
          </ruby>
        );
      })}
    </span>
  );
};

export default FuriganaText;
