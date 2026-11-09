import React, { useState, useEffect } from 'react';
import { useStudyData } from '../../context/StudyPlannerContext';
import { Flashcard } from '../../types';
import { Button } from '../ui/Button';
import { X, Sparkles, CheckCircle2, RefreshCw, Wand2, AlertTriangle } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { sanitizeCardContent } from '../../services/FlashcardService';
import { supabase } from '../../lib/supabase';

interface AdminAiCardCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminAiCardCleanerModal: React.FC<AdminAiCardCleanerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { flashcards, updateFlashcard } = useStudyData();
  const [badCards, setBadCards] = useState<
    Array<{ card: Flashcard; cleanedFront: string; cleanedBack: string; isModified: boolean }>
  >([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleScanCards();
    }
  }, [isOpen]);

  const handleScanCards = () => {
    setIsScanning(true);
    const results: Array<{
      card: Flashcard;
      cleanedFront: string;
      cleanedBack: string;
      isModified: boolean;
    }> = [];

    flashcards.forEach((card) => {
      const { card: cleanedCard, wasModified } = sanitizeCardContent(card);
      if (wasModified) {
        results.push({
          card,
          cleanedFront: cleanedCard.front,
          cleanedBack: cleanedCard.back,
          isModified: wasModified,
        });
      }
    });

    setBadCards(results);
    setIsScanning(false);
  };

  const handleCleanAllCards = async () => {
    if (badCards.length === 0) return;
    setIsCleaning(true);

    try {
      let cleanedCount = 0;
      for (const item of badCards) {
        const { card, cleanedFront, cleanedBack } = item;
        // Update Supabase DB
        await supabase
          .from('flashcards')
          .update({ front: cleanedFront, back: cleanedBack })
          .eq('id', card.id);

        // Update context
        await updateFlashcard(card.id, { front: cleanedFront, back: cleanedBack });
        cleanedCount++;
      }

      toast({
        title: '⚡ AI Card Cleaner Yakunlandi!',
        description: `${cleanedCount} ta buzuq OCR kartochkasi avtomatik tozalandi va saqlandi.`,
      });

      setBadCards([]);
      onClose();
    } catch (err) {
      console.error('Card cleaning error:', err);
      toast({
        variant: 'destructive',
        title: '❌ Xatolik',
        description: 'Kartalarni tozalashda xatolik yuz berdi.',
      });
    } finally {
      setIsCleaning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl 2xl:max-w-5xl 3xl:max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 p-6 text-white">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur-md">
              <Wand2 size={14} /> AI OCR Card Cleaner
            </div>
            <h2 className="text-xl font-black">Buzuq va Takroriy Kartochkalarni Avto-Tozalagich</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-all hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto bg-background p-6">
          {isScanning ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-4">
              <RefreshCw className="animate-spin text-amber-500" size={40} />
              <p className="text-sm font-bold text-muted-foreground">Baza skanerlanmoqda...</p>
            </div>
          ) : badCards.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-3 text-center">
              <CheckCircle2 className="text-emerald-500" size={56} />
              <h3 className="text-lg font-black text-foreground">Baza 100% Toza!</h3>
              <p className="text-xs text-muted-foreground">
                Barcha kartochkalar OCR va simvollardan tozalangan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={24} className="shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold">
                      Topilgan Buzuq Kartochkalar: {badCards.length} ta
                    </p>
                    <p className="text-[11px] opacity-90">
                      OCR shovqini (`(a`, `6 た くさん`, JSON kodlar) aniqlandi.
                    </p>
                  </div>
                </div>
                <Button
                  disabled={isCleaning}
                  onClick={handleCleanAllCards}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 px-5 py-2 text-xs font-black text-white shadow-md hover:from-amber-700 hover:to-rose-700"
                >
                  <Sparkles size={14} /> ⚡ Hammasini Avto-Tozalash ({badCards.length})
                </Button>
              </div>

              {/* Detected list */}
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {badCards.map(({ card, cleanedFront, cleanedBack }, idx) => (
                  <div
                    key={card.id || idx}
                    className="space-y-2 p-4 text-xs transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between font-extrabold text-muted-foreground">
                      <span>Karta #{idx + 1}</span>
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-500">
                        Tuzatilishi kerak
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5">
                        <span className="block text-[10px] font-black text-rose-500">
                          ESKI (Buzuq):
                        </span>
                        <p className="font-bold text-foreground line-through opacity-80">
                          {card.front}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-through opacity-80">
                          {card.back}
                        </p>
                      </div>
                      <div className="space-y-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                        <span className="block text-[10px] font-black text-emerald-500">
                          YANGI (Tozalangan):
                        </span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          {cleanedFront}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{cleanedBack}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 p-4 text-xs">
          <span className="font-bold text-muted-foreground">
            Jami kartochkalar:{' '}
            <span className="font-black text-foreground">{flashcards.length} ta</span>
          </span>
          <Button variant="outline" onClick={onClose} className="rounded-xl px-5 py-2 font-bold">
            Yopish
          </Button>
        </div>
      </div>
    </div>
  );
};
