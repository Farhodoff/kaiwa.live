import React, { useState, useEffect } from 'react';
import { PresetDeck } from '../../data/presetDecks';
import { Button } from '../ui/Button';
import {
  ShieldAlert,
  Plus,
  Check,
  Trash2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Folder,
  FolderCheck,
  FolderPlus,
  ExternalLink,
} from 'lucide-react';
import { PresetDeckService, DeckPart } from '../../services/PresetDeckService';
import { useLanguage } from '../../context/LanguageContext';

interface PresetDeckCardProps {
  deck: PresetDeck;
  isAdded?: boolean;
  isAdmin?: boolean;
  userSubjectNames?: string[];
  onImport: (deck: PresetDeck) => void;
  onImportPart?: (part: DeckPart) => void;
  onRemove?: (deck: PresetDeck) => void;
  onAdminAudit?: (deck: PresetDeck) => void;
  onAdminAddNextPart?: (deck: PresetDeck, nextPartNumber: number) => void;
  onOpenFolderExplorer?: (deck: PresetDeck, parts: DeckPart[]) => void;
  onUpgradeClick?: () => void;
}

export const PresetDeckCard: React.FC<PresetDeckCardProps> = ({
  deck,
  isAdded = false,
  isAdmin = false,
  userSubjectNames = [],
  onImport,
  onImportPart,
  onRemove,
  onAdminAudit,
  onAdminAddNextPart,
  onOpenFolderExplorer,
}) => {
  const { language } = useLanguage();
  const isJa = language === 'ja';
  const [isPartsOpen, setIsPartsOpen] = useState(false);
  const [parts, setParts] = useState<DeckPart[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);

  useEffect(() => {
    if (isPartsOpen && parts.length === 0) {
      setLoadingParts(true);
      PresetDeckService.getDeckParts(deck, 100)
        .then((loadedParts) => {
          setParts(loadedParts);
          setLoadingParts(false);
        })
        .catch(() => setLoadingParts(false));
    }
  }, [isPartsOpen, deck, parts.length]);

  const nextPartNumber = parts.length > 0 ? Math.max(...parts.map((p) => p.partNumber)) + 1 : 1;

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition-all hover:shadow-md ${
        isAdded ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border'
      }`}
    >
      {isAdded && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
          <Check size={12} /> {isJa ? '保存済み' : 'Saqlangan'}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-muted/60 p-2.5 text-3xl">{deck.icon}</span>
          <div>
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${deck.badgeColor}`}
            >
              {deck.level}
            </span>
            <h3 className="mt-1 text-lg font-extrabold leading-snug text-foreground">
              {deck.title}
            </h3>
          </div>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {deck.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <BookOpen size={14} className="text-primary" />
            <span>
              {deck.cardCount} {isJa ? '枚のカード' : 'ta kartochka'}
            </span>
          </div>

          <button
            onClick={() => setIsPartsOpen(!isPartsOpen)}
            className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary shadow-sm transition-all hover:bg-primary/20 hover:underline"
          >
            <Folder size={14} /> {isJa ? 'フォルダ' : 'Jildlar'} (
            {parts.length > 0 ? parts.length : '...'}){' '}
            {isPartsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Expandable Parts Folder Drawer */}
        {isPartsOpen && (
          <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-border bg-muted/40 p-3.5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border/80 pb-2 text-[11px] font-extrabold text-muted-foreground">
              <span className="flex items-center gap-1">
                📂 {isJa ? 'レベル別単語集（各100語）' : 'Jildlar Kolleksiyasi (100 tadan)'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenFolderExplorer && onOpenFolderExplorer(deck, parts)}
                  className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-500 hover:underline"
                >
                  <ExternalLink size={12} /> {isJa ? 'すべて見る' : 'Barchasini Ochish'}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onAdminAddNextPart && onAdminAddNextPart(deck, nextPartNumber)}
                    className="flex items-center gap-1 text-[10px] font-black text-rose-500 hover:underline"
                  >
                    <FolderPlus size={12} /> ➕ {nextPartNumber}-Qism
                  </button>
                )}
              </div>
            </div>

            {loadingParts ? (
              <p className="animate-pulse py-3 text-center text-[11px] text-muted-foreground">
                {isJa ? '読み込み中...' : 'Jildlar yuklanmoqda...'}
              </p>
            ) : parts.length === 0 ? (
              <p className="py-3 text-center text-[11px] text-muted-foreground">
                {isJa ? 'フォルダがありません' : 'Jildlar mavjud emas'}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {parts.map((part) => {
                  const isPartAdded = userSubjectNames.some((name) => {
                    const cleanUserSub = name.toLowerCase().trim();
                    const cleanPartTitle = part.title.toLowerCase().trim();
                    return (
                      cleanUserSub === cleanPartTitle ||
                      cleanUserSub.includes(cleanPartTitle) ||
                      cleanPartTitle.includes(cleanUserSub)
                    );
                  });
                  return (
                    <div
                      key={part.id}
                      className={`flex items-center justify-between rounded-xl border bg-card p-2.5 transition-all hover:shadow-md ${
                        part.isCustomAdminPart
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : isPartAdded
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-border/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`rounded-lg border p-1.5 ${
                            part.isCustomAdminPart
                              ? 'border-amber-500/30 bg-amber-500/20 text-amber-500'
                              : 'border-primary/20 bg-primary/10 text-primary'
                          }`}
                        >
                          {isPartAdded ? <FolderCheck size={16} /> : <Folder size={16} />}
                        </div>
                        <div className="space-y-0.5">
                          <span className="block text-xs font-black leading-tight text-foreground">
                            {part.title}
                          </span>
                          {part.isCustomAdminPart && (
                            <span className="rounded bg-amber-500/10 px-1 text-[9px] font-extrabold text-amber-500">
                              Admin Jildi
                            </span>
                          )}
                        </div>
                      </div>

                      {isPartAdded ? (
                        <span className="flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          <Check size={12} /> {isJa ? '保存済み' : 'Saqlangan'}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => (onImportPart ? onImportPart(part) : onImport(deck))}
                          className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-[10px] font-extrabold text-primary-foreground shadow-none hover:bg-primary/90"
                        >
                          {isJa ? '+ 追加' : "+ Qo'shish"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2 border-t border-border/50 pt-6">
        {isAdmin && (
          <Button
            variant="outline"
            onClick={() => onAdminAudit && onAdminAudit(deck)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-amber-500/10 py-2 text-xs font-black text-rose-500 shadow-sm transition-all hover:bg-rose-500/20 active:scale-95 dark:text-rose-400"
          >
            <ShieldAlert size={14} /> 🛠️ Admin Tekshirish va Saralash
          </Button>
        )}

        {isAdded ? (
          <Button
            variant="outline"
            onClick={() => onRemove && onRemove(deck)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-rose-500/30 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10"
          >
            <Trash2 size={14} /> {isJa ? '- マイ単語帳から削除' : "- Mening to'plamimdan o'chirish"}
          </Button>
        ) : (
          <Button
            onClick={() => onImport(deck)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-extrabold text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow"
          >
            <Plus size={14} /> {isJa ? '+ マイ単語帳に追加' : "+ Mening to'plamimga qo'shish"}
          </Button>
        )}
      </div>
    </div>
  );
};
