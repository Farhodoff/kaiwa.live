import React, { useState, useMemo } from 'react';
import { PresetDeck } from '../../data/presetDecks';
import { DeckPart } from '../../services/PresetDeckService';
import { Button } from '../ui/Button';
import { X, Folder, FolderCheck, FolderPlus, Search, Check, BookOpen } from 'lucide-react';

interface LevelFolderExplorerModalProps {
  isOpen: boolean;
  deck: PresetDeck | null;
  parts: DeckPart[];
  userSubjectNames?: string[];
  isAdmin?: boolean;
  onClose: () => void;
  onImportPart: (part: DeckPart) => void;
  onAdminAddNextPart?: (deck: PresetDeck, nextPartNumber: number) => void;
}

export const LevelFolderExplorerModal: React.FC<LevelFolderExplorerModalProps> = ({
  isOpen,
  deck,
  parts,
  userSubjectNames = [],
  isAdmin = false,
  onClose,
  onImportPart,
  onAdminAddNextPart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'saved' | 'admin'>('all');

  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || part.title.toLowerCase().includes(q);
      const isSaved = userSubjectNames.some(
        (name) => name.toLowerCase().trim() === part.title.toLowerCase().trim(),
      );

      if (filterTab === 'saved') return matchesSearch && isSaved;
      if (filterTab === 'admin') return matchesSearch && part.isCustomAdminPart;
      return matchesSearch;
    });
  }, [parts, searchQuery, filterTab, userSubjectNames]);

  const nextPartNumber = parts.length > 0 ? Math.max(...parts.map((p) => p.partNumber)) + 1 : 1;

  if (!isOpen || !deck) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900 p-6 text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-xl border border-indigo-500/40 bg-indigo-500/20 p-1.5 text-xs font-black text-indigo-300">
                <Folder size={14} /> Jildlar Kolleksiyasi
              </span>
              <span className="text-xs font-bold text-slate-300">{deck.level}</span>
            </div>
            <h2 className="flex items-center gap-2 text-xl font-black md:text-2xl">
              <span>{deck.icon}</span> {deck.title} — Qismlar va Boblar
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                onClick={() => onAdminAddNextPart && onAdminAddNextPart(deck, nextPartNumber)}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-md hover:bg-rose-700"
              >
                <FolderPlus size={14} /> ➕ {nextPartNumber}-Qism Yaratish
              </Button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-all hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-border bg-muted/40 p-4 sm:flex-row">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Jild yoki qism nomini qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex shrink-0 items-center rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setFilterTab('all')}
              className={`rounded-lg px-3 py-1 text-xs font-extrabold transition-all ${filterTab === 'all' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}
            >
              Barchasi ({parts.length})
            </button>
            <button
              onClick={() => setFilterTab('saved')}
              className={`rounded-lg px-3 py-1 text-xs font-extrabold transition-all ${filterTab === 'saved' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}
            >
              Saqlanganlar
            </button>
            <button
              onClick={() => setFilterTab('admin')}
              className={`rounded-lg px-3 py-1 text-xs font-extrabold transition-all ${filterTab === 'admin' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}
            >
              Admin Jildlari
            </button>
          </div>
        </div>

        {/* Folder Grid Body */}
        <div className="flex-1 overflow-y-auto bg-background p-6">
          {filteredParts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-3 text-center">
              <Folder size={48} className="text-muted-foreground/40" />
              <h3 className="text-base font-black text-foreground">Jildlar topilmadi</h3>
              <p className="text-xs text-muted-foreground">
                Qidiruv yoki filtr bo'yicha hech qanday qism mos kelmadi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {filteredParts.map((part) => {
                const isSaved = userSubjectNames.some((name) => {
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
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-lg ${
                      part.isCustomAdminPart
                        ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-card'
                        : isSaved
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-border'
                    }`}
                  >
                    {/* Top folder tab indicator */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`rounded-xl border p-2.5 ${
                            part.isCustomAdminPart
                              ? 'border-amber-500/30 bg-amber-500/20 text-amber-500'
                              : 'border-primary/20 bg-primary/10 text-primary'
                          }`}
                        >
                          {isSaved ? <FolderCheck size={20} /> : <Folder size={20} />}
                        </div>
                        <span className="text-xs font-black text-muted-foreground">
                          #{part.partNumber}-Qism
                        </span>
                      </div>

                      {part.isCustomAdminPart && (
                        <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-amber-500">
                          Admin Jildi
                        </span>
                      )}
                    </div>

                    <div className="mb-4 space-y-2">
                      <h4 className="text-sm font-black leading-snug text-foreground transition-colors group-hover:text-primary">
                        {part.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <BookOpen size={13} className="text-primary" />
                        <span>{part.cardCount} ta kartochka</span>
                      </div>
                    </div>

                    <div className="border-t border-border/60 pt-3">
                      {isSaved ? (
                        <div className="flex w-full items-center justify-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          <Check size={14} /> Saqlangan
                        </div>
                      ) : (
                        <Button
                          onClick={() => onImportPart(part)}
                          className="w-full rounded-xl bg-primary py-2 text-xs font-extrabold text-primary-foreground shadow-sm hover:bg-primary/90"
                        >
                          + Qo'shish
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 p-4 text-xs">
          <span className="font-bold text-muted-foreground">
            Jami Jildlar Soni: <span className="font-black text-foreground">{parts.length} ta</span>
          </span>
          <Button variant="outline" onClick={onClose} className="rounded-xl px-5 py-2 font-bold">
            Yopish
          </Button>
        </div>
      </div>
    </div>
  );
};
