import {
  Book,
  Play,
  Plus,
  Sparkles,
  Download,
  GraduationCap,
  Award,
  BookOpen,
  Code,
  Mic,
  Globe,
  Beaker,
  Atom,
  Music,
  Palette,
  Dumbbell,
  Trash2,
  Archive,
  ArchiveRestore,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Subject } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface DeckCardProps {
  subject: Subject;
  canManage?: boolean;
  cardCount: number;
  dueCount: number;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onToggleArchive?: () => void;
  onDelete?: () => void;
  onAIGenerate: () => void;
  onStudy?: () => void;
  onPopulatePreset?: () => void;
  onExploreFolders?: () => void;
}

const renderSubjectIcon = (iconName?: string) => {
  if (!iconName) return <Book size={22} />;

  // Check if it's an emoji (or non-ascii symbol)
  if (/\p{Extended_Pictographic}/u.test(iconName)) {
    return <span className="text-xl leading-none">{iconName}</span>;
  }

  const lower = iconName.toLowerCase().trim();
  if (lower === 'sparkles') return <Sparkles size={22} />;
  if (lower.includes('graduation')) return <GraduationCap size={22} />;
  if (lower === 'award') return <Award size={22} />;
  if (lower === 'code') return <Code size={22} />;
  if (lower === 'mic') return <Mic size={22} />;
  if (lower === 'book' || lower === 'bookopen') return <BookOpen size={22} />;
  if (lower === 'globe') return <Globe size={22} />;
  if (lower === 'beaker' || lower === 'science') return <Beaker size={22} />;
  if (lower === 'atom') return <Atom size={22} />;
  if (lower === 'music') return <Music size={22} />;
  if (lower === 'art' || lower === 'palette') return <Palette size={22} />;
  if (lower === 'sport' || lower === 'dumbbell') return <Dumbbell size={22} />;

  // Fallback: If it's short string (emoji), render text, else fallback icon
  if (iconName.length <= 4) {
    return <span className="text-xl leading-none">{iconName}</span>;
  }

  return <Book size={22} />;
};

const DeckCard: React.FC<DeckCardProps> = ({
  subject,
  canManage = false,
  cardCount,
  dueCount,
  isSelected,
  onToggleSelect,
  onToggleArchive,
  onDelete,
  onAIGenerate,
  onStudy,
  onPopulatePreset,
  onExploreFolders,
}) => {
  const { language } = useLanguage();
  const copy = (uz: string, en: string, ja: string) =>
    language === 'ja' ? ja : language === 'en' ? en : uz;
  const studyLabel =
    dueCount > 0
      ? copy('Takrorlash', 'Review', '復習する')
      : copy('Mashq qilish', 'Practice', '練習する');
  return (
    <div
      className={`group relative flex flex-col justify-between border-b px-1 py-5 transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
      }`}
    >
      {(onToggleSelect || onToggleArchive || onDelete) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {onToggleSelect && (
            <button
              type="button"
              onClick={onToggleSelect}
              aria-pressed={Boolean(isSelected)}
              aria-label={`${subject.name}: ${copy('Tanlash', 'Select deck', '選択')}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {isSelected ? (
                <CheckSquare size={20} className="text-primary" />
              ) : (
                <Square size={20} />
              )}
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            {onToggleArchive && (
              <button
                type="button"
                onClick={onToggleArchive}
                title={
                  subject.isArchived
                    ? copy('Arxivdan chiqarish', 'Restore deck', '復元')
                    : copy('Arxivlash', 'Archive deck', 'アーカイブ')
                }
                aria-label={`${subject.name}: ${subject.isArchived ? copy('Arxivdan chiqarish', 'Restore deck', '復元') : copy('Arxivlash', 'Archive deck', 'アーカイブ')}`}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {subject.isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                title={copy("To'plamni o'chirish", 'Delete deck', '削除')}
                aria-label={`${subject.name}: ${copy("To'plamni o'chirish", 'Delete deck', '削除')}`}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="mb-5 flex min-w-0 items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: subject.color + '20', color: subject.color }}
          aria-hidden="true"
        >
          {renderSubjectIcon(subject.icon)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-semibold leading-snug text-foreground">
            {subject.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {cardCount} {copy('ta karta', 'cards', '枚')}
          </p>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{copy('Bugun', 'Due today', '今日の復習')}</span>
        <span
          className={`rounded-full px-2.5 py-1 font-medium ${dueCount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
        >
          {dueCount > 0
            ? `${dueCount} ${copy('ta karta', 'cards', '枚')}`
            : copy('Karta yo‘q', 'None due', '予定なし')}
        </span>
      </div>

      <div className="space-y-3">
        {cardCount === 0 && onPopulatePreset ? (
          <Button
            onClick={onPopulatePreset}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-extrabold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            <Download size={15} /> {copy('Kartalarni yuklash', 'Load cards', 'カードを追加')}
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2 pt-2">
            {onStudy ? (
              <Button
                onClick={onStudy}
                className="flex min-w-0 flex-1 items-center justify-center gap-2 bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90"
                disabled={cardCount === 0}
              >
                <Play size={15} /> {studyLabel}
              </Button>
            ) : (
              <Button asChild className="min-w-0 flex-1 text-xs font-bold">
                <Link
                  to={`/flashcards?study=${subject.id}`}
                  aria-disabled={cardCount === 0}
                  onClick={(event) => {
                    if (cardCount === 0) event.preventDefault();
                  }}
                  className={cardCount === 0 ? 'pointer-events-none opacity-50' : ''}
                  tabIndex={cardCount === 0 ? -1 : undefined}
                >
                  <Play size={15} /> {studyLabel}
                </Link>
              </Button>
            )}
            <div className="flex shrink-0 items-center gap-1.5">
              {onExploreFolders && (
                <Button
                  variant="secondary"
                  className="px-2.5 text-foreground hover:text-primary sm:px-3"
                  onClick={onExploreFolders}
                  title={copy("Jildlarni ko'rish", 'Explore folders', 'フォルダーを開く')}
                  aria-label={copy("Jildlarni ko'rish", 'Explore folders', 'フォルダーを開く')}
                  size="icon"
                >
                  <BookOpen size={17} />
                </Button>
              )}
              {canManage && (
                <>
                  <Button
                    variant="secondary"
                    className="px-2.5 text-primary hover:bg-primary/10 sm:px-3"
                    onClick={onAIGenerate}
                    title="AI bilan yaratish"
                    aria-label={copy('AI bilan yaratish', 'Generate with AI', 'AIで作成')}
                    size="icon"
                  >
                    <Sparkles size={17} />
                  </Button>
                  <Button
                    asChild
                    size="icon"
                    aria-label={copy('Karta qo‘shish', 'Add card', 'カードを追加')}
                    variant="secondary"
                    className="px-2.5 text-muted-foreground hover:text-foreground sm:px-3"
                  >
                    <Link to={`/flashcards/new?subjectId=${subject.id}`}>
                      <Plus size={17} />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckCard;
