import React, { useState } from 'react';
import { PresetSubDeck } from '../../data/presetDecks';
import { Button } from '../ui/Button';
import {
  Folder,
  FolderCheck,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  Layers,
  Trash2,
  Plus,
  Check,
} from 'lucide-react';

export interface StandaloneDeckGroup {
  baseTitle: string;
  level: string;
  description: string;
  totalCards: number;
  parts: PresetSubDeck[];
}

interface StandaloneDeckCardProps {
  group: StandaloneDeckGroup;
  isAdmin?: boolean;
  userSubjectNames?: string[];
  isImporting?: boolean;
  onImportPart: (part: PresetSubDeck) => void;
  onImportAllParts: (group: StandaloneDeckGroup) => void;
  onAddNextPart: (group: StandaloneDeckGroup, nextPartNumber: number) => void;
  onDeletePart: (part: PresetSubDeck) => void;
  onDeleteGroup: (group: StandaloneDeckGroup) => void;
}

export const StandaloneDeckCard: React.FC<StandaloneDeckCardProps> = ({
  group,
  isAdmin = false,
  userSubjectNames = [],
  isImporting = false,
  onImportPart,
  onImportAllParts,
  onAddNextPart,
  onDeletePart,
  onDeleteGroup,
}) => {
  const [isPartsOpen, setIsPartsOpen] = useState(false);

  const nextPartNumber =
    group.parts.length > 0 ? Math.max(...group.parts.map((p) => p.partNumber || 1)) + 1 : 1;

  const isPartAdded = (part: PresetSubDeck) => {
    const cleanPartTitle = part.title.toLowerCase().trim();
    return userSubjectNames.some((name) => {
      const cleanUserSub = name.toLowerCase().trim();
      return (
        cleanUserSub === cleanPartTitle ||
        cleanUserSub.includes(cleanPartTitle) ||
        cleanPartTitle.includes(cleanUserSub)
      );
    });
  };

  const isGroupFullyAdded = group.parts.length > 0 && group.parts.every((p) => isPartAdded(p));

  return (
    <div className="glass-card group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-500/30 bg-card p-6 transition-all hover:border-emerald-500 hover:shadow-xl">
      <div className="space-y-4">
        {/* Header Badge & Delete */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ⭐
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {group.level || 'MUSTAQIL'}
            </span>
            {isAdmin && (
              <button
                onClick={() => onDeleteGroup(group)}
                className="p-1.5 text-muted-foreground transition-colors hover:text-rose-500"
                title="Butun albomni o'chirish"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-base font-black text-foreground transition-colors group-hover:text-emerald-500">
            {group.baseTitle}
          </h4>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {group.description || "Maxsus mustaqil kartochkalar to'plami."}
          </p>
        </div>

        {/* Card Count & Folders Toggle */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Layers size={14} className="text-emerald-500" />
            <span>{group.totalCards} ta kartochka</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPartsOpen(!isPartsOpen)}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-extrabold text-emerald-600 shadow-sm transition-all hover:bg-emerald-500/20 hover:underline dark:text-emerald-400"
          >
            <Folder size={14} /> Jildlar ({group.parts.length}){' '}
            {isPartsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Nested Jildlar / Parts Drawer */}
        {isPartsOpen && (
          <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-border bg-muted/40 p-3.5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border/80 pb-2 text-[11px] font-extrabold text-muted-foreground">
              <span className="flex items-center gap-1">
                📂 Albom Jildlari ({group.parts.length} ta qism)
              </span>
              {isAdmin && (
                <button
                  onClick={() => onAddNextPart(group, nextPartNumber)}
                  className="flex items-center gap-1 text-[10px] font-black text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  <FolderPlus size={12} /> ➕ {nextPartNumber}-Qism
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {group.parts.map((part) => {
                const added = isPartAdded(part);
                return (
                  <div
                    key={part.id}
                    className={`flex items-center justify-between rounded-xl border bg-card p-2.5 transition-all hover:shadow-md ${
                      added ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-500">
                        {added ? <FolderCheck size={16} /> : <Folder size={16} />}
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-xs font-black leading-tight text-foreground">
                          {part.title}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {part.cardCount || part.cards?.length || 0} ta card
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {added ? (
                        <span className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          <Check size={11} /> Qo'shilgan
                        </span>
                      ) : (
                        <Button
                          onClick={() => onImportPart(part)}
                          disabled={isImporting}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm hover:bg-emerald-700"
                        >
                          <Plus size={11} /> Qo'shish
                        </Button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => onDeletePart(part)}
                          className="p-1 text-muted-foreground hover:text-rose-500"
                          title="Qismni o'chirish"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Main Action */}
      <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-5">
        {isGroupFullyAdded ? (
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2.5 text-center text-xs font-black text-emerald-600 dark:text-emerald-400">
            <FolderCheck size={15} /> Barcha Qismlar Qo'shilgan
          </div>
        ) : (
          <Button
            onClick={() => onImportAllParts(group)}
            disabled={isImporting}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700"
          >
            <Plus size={15} /> To'plamlarimga Qo'shish ({group.totalCards} ta card)
          </Button>
        )}
        {isAdmin && (
          <button
            onClick={() => onAddNextPart(group, nextPartNumber)}
            className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-muted px-3 py-2.5 text-xs font-black text-foreground transition-all hover:border-emerald-500/40 hover:bg-muted/80"
            title={`Yangi ${nextPartNumber}-Qismni yuklash`}
          >
            <FolderPlus size={14} className="text-emerald-500" /> + Qism
          </button>
        )}
      </div>
    </div>
  );
};
