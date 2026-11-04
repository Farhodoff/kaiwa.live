import { useState } from 'react';
import { toast } from './use-toast';

export const useFlashcardImport = (
  importFlashcards: (
    subjectId: string,
    cards: { front: string; back: string; example?: string }[],
  ) => Promise<boolean>,
) => {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (subjectId: string, file: File) => {
    setIsImporting(true);
    const reader = new FileReader();

    return new Promise<void>((resolve, reject) => {
      reader.onload = async (event) => {
        try {
          const content = (event.target?.result as string) || '';
          let cards: { front: string; back: string; example?: string }[] = [];

          // 1. Try parsing JSON
          if (file.name.toLowerCase().endsWith('.json') || content.trim().startsWith('[')) {
            try {
              const json = JSON.parse(content);
              if (Array.isArray(json)) {
                cards = json
                  .map((c) => ({
                    front: String(c.front || c.Front || c.question || c.q || ''),
                    back: String(c.back || c.Back || c.answer || c.a || ''),
                    example: c.example || c.Example || '',
                  }))
                  .filter((c) => c.front && c.back);
              }
            } catch (e) {
              console.warn('JSON parse failed, falling back to CSV/text', e);
            }
          }

          // 2. Fallback to Tab/Comma Delimited or Anki Text
          if (cards.length === 0) {
            const lines = content
              .split(/\r?\n/)
              .map((l) => l.trim())
              .filter(Boolean);
            for (const line of lines) {
              if (line.startsWith('#')) continue; // Skip comments

              // Check Tab separated (Anki default)
              if (line.includes('\t')) {
                const parts = line.split('\t');
                if (parts.length >= 2) {
                  cards.push({
                    front: parts[0].trim(),
                    back: parts[1].trim(),
                    example: parts[2] ? parts[2].trim() : '',
                  });
                }
              } else if (line.includes(',')) {
                // Simple CSV fallback
                const parts = line.split(',');
                if (parts.length >= 2) {
                  cards.push({
                    front: parts[0].trim().replace(/^"|"$/g, ''),
                    back: parts[1].trim().replace(/^"|"$/g, ''),
                    example: parts[2] ? parts[2].trim().replace(/^"|"$/g, '') : '',
                  });
                }
              }
            }
          }

          if (cards.length === 0) {
            throw new Error(
              "Faylda yararoqlik kartochkalar topilmadi. Qatorda kamida 'Front' va 'Back' ustunlari bo'lishi kerak.",
            );
          }

          const success = await importFlashcards(subjectId, cards);
          if (success) {
            toast({
              title: 'Muvaffaqiyatli',
              description: `🎉 ${cards.length} ta kartochka import qilindi.`,
            });
            resolve();
          } else {
            toast({
              variant: 'destructive',
              title: 'Xatolik',
              description: "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.",
            });
            reject(new Error('Import failed'));
          }
        } catch (error: any) {
          console.error(error);
          toast({
            variant: 'destructive',
            title: 'Xatolik',
            description:
              error?.message || 'Fayl xato formatda! JSON, CSV yoki Anki text fayllarini yuklang.',
          });
          reject(error);
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    });
  };

  const downloadTemplate = () => {
    const template = [
      {
        front: 'Mizu (水)',
        back: 'Suv',
        example: 'Mizu o nomimasu (Suv ichaman)',
      },
      {
        front: 'Hon (本)',
        back: 'Kitob',
        example: "Hon o yomimasu (Kitob o'qiyman)",
      },
    ];
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards_template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return { handleImport, downloadTemplate, isImporting };
};
