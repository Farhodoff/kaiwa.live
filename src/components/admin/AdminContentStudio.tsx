import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  Search,
  Layers,
  CheckCircle2,
  FolderPlus,
  MessageSquare,
  Edit2,
  Upload,
  Download,
  RefreshCw,
  X,
  Sparkles,
  Headphones,
} from 'lucide-react';
import { CustomContentService, BulkImportResult } from '../../services/CustomContentService';
import type { JlptKanjiItem, JlptGrammarItem } from '../../data/jlptGrammarKanji';
import type { JlptGrammarQuestion } from '../../data/jlpt/grammar_data';
import type { JlptReadingPassage } from '../../data/jlptReadingData';
import { PRESET_DECKS, PresetCard } from '../../data/presetDecks';
import {
  GlobalFlashcardOverrideService,
  GlobalFlashcardOverride,
} from '../../services/GlobalFlashcardOverrideService';
import { useStudyData } from '../../context/StudyPlannerContext';
import { AdminScenarioManager } from './AdminScenarioManager';
import { AdminQuizManager } from './AdminQuizManager';
import { AdminChoukaiManager } from './AdminChoukaiManager';
import { AdminDokkaiManager } from './AdminDokkaiManager';
import { AdminFlashcardManager } from '../decks/AdminFlashcardManager';
import { Button } from '../ui/Button';
import { toast } from '../../hooks/use-toast';

export const AdminContentStudio: React.FC = () => {
  const { subjects, addSubject, addFlashcardsBatch } = useStudyData();

  const [activeSubTab, setActiveSubTab] = useState<
    'kanji' | 'grammar' | 'dokkai' | 'quiz' | 'choukai' | 'flashcards' | 'scenarios'
  >('kanji');

  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const flashcardFileInputRef = useRef<HTMLInputElement | null>(null);

  // === KANJI STATE ===
  const [customKanjiList, setCustomKanjiList] = useState<JlptKanjiItem[]>([]);
  const [kanjiSearch, setKanjiSearch] = useState('');
  const [editingKanji, setEditingKanji] = useState<JlptKanjiItem | null>(null);
  const [showBulkKanjiModal, setShowBulkKanjiModal] = useState(false);
  const [bulkKanjiText, setBulkKanjiText] = useState('');

  const [kanjiForm, setKanjiForm] = useState<{
    kanji: string;
    level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
    onyomi: string;
    kunyomi: string;
    meaningUz: string;
    strokeCount: number;
    exampleWord: string;
    exampleReading: string;
    exampleMeaning: string;
  }>({
    kanji: '',
    level: 'N5',
    onyomi: '',
    kunyomi: '',
    meaningUz: '',
    strokeCount: 4,
    exampleWord: '',
    exampleReading: '',
    exampleMeaning: '',
  });

  // === GRAMMAR STATE ===
  const [customGrammarList, setCustomGrammarList] = useState<JlptGrammarItem[]>([]);
  const [grammarSearch, setGrammarSearch] = useState('');
  const [editingGrammar, setEditingGrammar] = useState<JlptGrammarItem | null>(null);
  const [showBulkGrammarModal, setShowBulkGrammarModal] = useState(false);
  const [bulkGrammarText, setBulkGrammarText] = useState('');

  const [grammarForm, setGrammarForm] = useState<{
    title: string;
    level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
    romaji: string;
    meaningUz: string;
    structure: string;
    exampleJa: string;
    exampleRomaji: string;
    exampleUz: string;
  }>({
    title: '',
    level: 'N5',
    romaji: '',
    meaningUz: '',
    structure: '',
    exampleJa: '',
    exampleRomaji: '',
    exampleUz: '',
  });

  // === FLASHCARD BATCH STATE ===
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isCreatingNewSubject, setIsCreatingNewSubject] = useState(false);
  const [singleFront, setSingleFront] = useState('');
  const [singleBack, setSingleBack] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkSeparator, setBulkSeparator] = useState<'dash' | 'tab' | 'comma'>('dash');
  const [uploadFolder, setUploadFolder] = useState<'selected' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1'>(
    'selected',
  );

  const [customQuizList, setCustomQuizList] = useState<JlptGrammarQuestion[]>([]);
  const [customDokkaiList, setCustomDokkaiList] = useState<JlptReadingPassage[]>([]);

  // Preset Decks Explorer State
  const [selectedPresetDeckId, setSelectedPresetDeckId] = useState<string>('');
  const [presetDeckCards, setPresetDeckCards] = useState<PresetCard[]>([]);
  const [isLoadingPresetCards, setIsLoadingPresetCards] = useState(false);
  const [presetCardSearch, setPresetCardSearch] = useState('');
  const [showFlashcardManagerModal, setShowFlashcardManagerModal] = useState(false);
  const [editingPresetCard, setEditingPresetCard] = useState<PresetCard | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editPhonetic, setEditPhonetic] = useState('');
  const [editBack, setEditBack] = useState('');
  const [editExample, setEditExample] = useState('');
  const [isSavingCardOverride, setIsSavingCardOverride] = useState(false);

  // Load custom content on mount
  const reloadContent = () => {
    setCustomKanjiList(CustomContentService.getCustomKanji());
    setCustomGrammarList(CustomContentService.getCustomGrammar());
    setCustomQuizList(CustomContentService.getCustomQuizQuestions());
    setCustomDokkaiList(CustomContentService.getCustomReadingPassages());
  };

  useEffect(() => {
    reloadContent();
  }, []);

  // When selectedPresetDeckId changes, load its cards
  useEffect(() => {
    if (!selectedPresetDeckId) {
      setPresetDeckCards([]);
      return;
    }
    const deck = PRESET_DECKS.find((d) => d.id === selectedPresetDeckId);
    if (!deck) return;
    setIsLoadingPresetCards(true);
    deck
      .loadCards()
      .then((cards) => setPresetDeckCards(cards))
      .catch((err) => {
        console.error('Failed to load preset cards:', err);
        toast({ variant: 'destructive', title: 'Kartalarni yuklab bo‘lmadi' });
      })
      .finally(() => setIsLoadingPresetCards(false));
  }, [selectedPresetDeckId]);

  const handleEditPresetCardClick = (card: PresetCard) => {
    setEditingPresetCard(card);
    setEditFront(card.front);
    setEditPhonetic(card.phonetic || '');
    setEditBack(card.back);
    setEditExample(card.example || '');
  };

  const handleSavePresetCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPresetCard) return;
    setIsSavingCardOverride(true);
    try {
      const override: GlobalFlashcardOverride = {
        word: editingPresetCard.front,
        front: editFront.trim() || editingPresetCard.front,
        phonetic: editPhonetic.trim() || undefined,
        back: editBack.trim(),
        example: editExample.trim() || undefined,
        deck_id: selectedPresetDeckId,
      };

      await GlobalFlashcardOverrideService.saveGlobalOverride(override);

      // Refresh loaded cards
      setPresetDeckCards((prev) =>
        prev.map((c) =>
          c.front === editingPresetCard.front
            ? {
                ...c,
                front: editFront.trim() || c.front,
                back: editBack.trim() || c.back,
                phonetic: editPhonetic.trim() || c.phonetic,
                example: editExample.trim() || c.example,
              }
            : c,
        ),
      );

      toast({
        title: '✅ Karta yangilandi',
        description: `"${editingPresetCard.front}" uchun global tuzatish saqlandi.`,
      });
      setEditingPresetCard(null);
    } catch {
      toast({ variant: 'destructive', title: 'Saqlashda xatolik yuz berdi' });
    } finally {
      setIsSavingCardOverride(false);
    }
  };

  // Sync from DB handler
  const handleSyncFromDb = async () => {
    setIsSyncing(true);
    try {
      const { kanjiCount, grammarCount, quizCount, choukaiCount, dokkaiCount } =
        await CustomContentService.syncFromSupabase();
      reloadContent();
      toast({
        title: '☁️ Supabase bilan sinxronlandi',
        description: `${kanjiCount} Kanji, ${grammarCount} Grammatika, ${dokkaiCount} Dokkai, ${choukaiCount} Choukai va ${quizCount} Test yangilandi.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Sinxronizatsiya xatosi',
        description: 'Serverdan ma‘lumotlarni yuklab bo‘lmadi, lokal kesh faol.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Export JSON Backup handler
  const handleExportBackup = () => {
    const jsonStr = CustomContentService.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kaiwa_live_content_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: '📥 JSON Zaxira yuklandi',
      description: 'Barcha maxsus kanji, grammatika va test savollari faylga saqlandi.',
    });
  };

  // Import JSON Backup file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { kanjiResult, grammarResult, quizResult } =
        await CustomContentService.importBackupJSON(text);
      reloadContent();
      toast({
        title: '📤 Zaxira nusxa tiklandi',
        description: `Kanji: +${kanjiResult.added}, Grammatika: +${grammarResult.added}, Testlar: +${quizResult.added}`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Faylni o‘qishda xatolik',
        description: 'JSON fayl formati yaroqsiz.',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Set default subject if available
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      const active = subjects.find((s) => !s.isArchived);
      if (active) setSelectedSubjectId(active.id);
    }
  }, [subjects, selectedSubjectId]);

  const parseFlashcardJson = (text: string): Array<{ front: string; back: string }> => {
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.cards) ? parsed.cards : [];

    return rows
      .map((row: any) => {
        const frontRaw =
          row?.front ?? row?.question ?? row?.word ?? row?.ja ?? row?.jp ?? row?.term;
        const backRaw =
          row?.back ??
          row?.answer ??
          row?.meaning ??
          row?.translation ??
          row?.uz ??
          row?.definition;

        const front = String(frontRaw ?? '').trim();
        const back = String(backRaw ?? '').trim();
        if (!front || !back) return null;
        return { front, back };
      })
      .filter(Boolean) as Array<{ front: string; back: string }>;
  };

  const parseFlashcardDelimitedText = (text: string): Array<{ front: string; back: string }> => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    return lines
      .map((line) => {
        const separators = ['\t', ',', ';', '|', ' - ', '-'];
        let front = '';
        let back = '';

        for (const sep of separators) {
          const parts = line.split(sep);
          if (parts.length >= 2) {
            front = parts[0].trim();
            back = parts.slice(1).join(sep).trim();
            break;
          }
        }

        if (!front || !back) return null;
        return { front, back };
      })
      .filter(Boolean) as Array<{ front: string; back: string }>;
  };

  const resolveFolderSubject = async (): Promise<string | null> => {
    if (uploadFolder === 'selected') {
      return selectedSubjectId || null;
    }

    const levelName = `JLPT ${uploadFolder} Asosiy Lug'at`;
    const existing = subjects.find(
      (s) => !s.isArchived && s.name.toLowerCase().includes(`jlpt ${uploadFolder.toLowerCase()}`),
    );
    if (existing?.id) return existing.id;

    const palette: Record<'N5' | 'N4' | 'N3' | 'N2' | 'N1', string> = {
      N5: '#22C55E',
      N4: '#06B6D4',
      N3: '#3B82F6',
      N2: '#8B5CF6',
      N1: '#F43F5E',
    };

    const created = await addSubject({
      name: levelName,
      color: palette[uploadFolder],
      schedule: [],
      description: `Admin import: JLPT ${uploadFolder} folder`,
      icon: '🎌',
    });

    if (created?.id) {
      setSelectedSubjectId(created.id);
      return created.id;
    }

    return null;
  };

  const handleFlashcardFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const targetSubjectId = await resolveFolderSubject();
      if (!targetSubjectId) {
        toast({
          variant: 'destructive',
          title: 'To‘plam topilmadi',
          description: 'Avval mavjud to‘plamni tanlang yoki JLPT folderni belgilang.',
        });
        return;
      }

      const rawText = await file.text();
      const isJson = file.name.toLowerCase().endsWith('.json');

      const rows = isJson ? parseFlashcardJson(rawText) : parseFlashcardDelimitedText(rawText);
      if (rows.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Yaroqli kartalar topilmadi',
          description:
            'JSON uchun front/back juftligini, CSV/TXT uchun ajratkich formatini tekshiring.',
        });
        return;
      }

      await addFlashcardsBatch(
        rows.map((row) => ({
          front: row.front,
          back: row.back,
          subjectId: targetSubjectId,
        })),
      );

      toast({
        title: '📥 Fayldan fleshkartalar yuklandi',
        description: `${rows.length} ta karta muvaffaqiyatli qo‘shildi (${uploadFolder === 'selected' ? 'tanlangan to‘plam' : `JLPT ${uploadFolder}`} folder).`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Faylni yuklashda xatolik',
        description: 'JSON/CSV formatini tekshirib qayta urinib ko‘ring.',
      });
    } finally {
      if (flashcardFileInputRef.current) flashcardFileInputRef.current.value = '';
    }
  };

  // Handle Kanji submit
  const handleSaveKanji = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kanjiForm.kanji.trim() || !kanjiForm.meaningUz.trim()) {
      toast({
        variant: 'destructive',
        title: 'Maydonlar to‘liq emas',
        description: 'Kamida Kanji belgisi va uning ma‘nosini kiriting.',
      });
      return;
    }

    const newItem: JlptKanjiItem = {
      id: `custom-k-${Date.now()}`,
      kanji: kanjiForm.kanji.trim(),
      level: kanjiForm.level,
      onyomi: kanjiForm.onyomi.trim() || '-',
      kunyomi: kanjiForm.kunyomi.trim() || '-',
      meaningUz: kanjiForm.meaningUz.trim(),
      strokeCount: Number(kanjiForm.strokeCount) || 1,
      examples: kanjiForm.exampleWord.trim()
        ? [
            {
              word: kanjiForm.exampleWord.trim(),
              reading: kanjiForm.exampleReading.trim() || kanjiForm.exampleWord.trim(),
              meaning: kanjiForm.exampleMeaning.trim() || kanjiForm.meaningUz.trim(),
            },
          ]
        : [],
    };

    const success = await CustomContentService.saveCustomKanji(newItem);
    if (success) {
      toast({
        title: '✅ Kanji saqlandi',
        description: `『${newItem.kanji}』muvaffaqiyatli qo‘shildi va JLPT sahifasida ko‘rinadi.`,
      });
      setKanjiForm({
        kanji: '',
        level: kanjiForm.level,
        onyomi: '',
        kunyomi: '',
        meaningUz: '',
        strokeCount: 4,
        exampleWord: '',
        exampleReading: '',
        exampleMeaning: '',
      });
      reloadContent();
    } else {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Kanjini saqlashda muammo yuz berdi.',
      });
    }
  };

  // Handle Edit Kanji submit
  const handleUpdateKanji = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKanji || !editingKanji.kanji.trim() || !editingKanji.meaningUz.trim()) return;

    const success = await CustomContentService.updateCustomKanji(editingKanji.id, {
      kanji: editingKanji.kanji.trim(),
      level: editingKanji.level,
      onyomi: editingKanji.onyomi?.trim() || '-',
      kunyomi: editingKanji.kunyomi?.trim() || '-',
      meaningUz: editingKanji.meaningUz.trim(),
      strokeCount: Number(editingKanji.strokeCount) || 1,
      examples: editingKanji.examples || [],
    });

    if (success) {
      toast({
        title: '✅ Kanji yangilandi',
        description: `『${editingKanji.kanji}』ma‘lumotlari saqlandi.`,
      });
      setEditingKanji(null);
      reloadContent();
    } else {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Kanjini yangilashda xatolik yuz berdi.',
      });
    }
  };

  const handleDeleteKanji = async (id: string, kanji: string) => {
    if (!window.confirm(`Haqiqatan ham 『${kanji}』 Kanjisini o'chirmoqchimisiz?`)) return;
    const success = await CustomContentService.deleteCustomKanji(id);
    if (success) {
      toast({ title: '🗑️ Kanji o‘chirildi' });
      reloadContent();
    }
  };

  // Handle Kanji Bulk Import
  const parsedBulkKanji = useMemo(() => {
    return CustomContentService.parseKanjiInput(bulkKanjiText);
  }, [bulkKanjiText]);

  const handleExecuteBulkKanji = async () => {
    if (parsedBulkKanji.length === 0) {
      toast({ variant: 'destructive', title: 'Hech qanday to‘g‘ri formatdagi kanji topilmadi' });
      return;
    }

    const result: BulkImportResult = await CustomContentService.bulkImportKanji(parsedBulkKanji);
    toast({
      title: '⚡ Ommaviy Kanji yuklandi',
      description: `Qo‘shildi: ${result.added} ta, Yangilandi: ${result.updated} ta, Xatolar: ${result.failed}`,
    });
    setBulkKanjiText('');
    setShowBulkKanjiModal(false);
    reloadContent();
  };

  // Handle Grammar submit
  const handleSaveGrammar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grammarForm.title.trim() || !grammarForm.meaningUz.trim()) {
      toast({
        variant: 'destructive',
        title: 'Maydonlar to‘liq emas',
        description: 'Kamida grammatika qolipi nomi va uning ma‘nosini kiriting.',
      });
      return;
    }

    const newItem: JlptGrammarItem = {
      id: `custom-g-${Date.now()}`,
      title: grammarForm.title.trim(),
      level: grammarForm.level,
      romaji: grammarForm.romaji.trim() || grammarForm.title.trim(),
      meaningUz: grammarForm.meaningUz.trim(),
      structure: grammarForm.structure.trim() || grammarForm.title.trim(),
      examples: grammarForm.exampleJa.trim()
        ? [
            {
              ja: grammarForm.exampleJa.trim(),
              romaji: grammarForm.exampleRomaji.trim() || '',
              uz: grammarForm.exampleUz.trim() || grammarForm.meaningUz.trim(),
            },
          ]
        : [],
    };

    const success = await CustomContentService.saveCustomGrammar(newItem);
    if (success) {
      toast({
        title: '✅ Grammatika saqlandi',
        description: `『${newItem.title}』muvaffaqiyatli qo‘shildi va JLPT bo‘limida faollashdi.`,
      });
      setGrammarForm({
        title: '',
        level: grammarForm.level,
        romaji: '',
        meaningUz: '',
        structure: '',
        exampleJa: '',
        exampleRomaji: '',
        exampleUz: '',
      });
      reloadContent();
    } else {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Grammatikani saqlashda xatolik yuz berdi.',
      });
    }
  };

  // Handle Edit Grammar submit
  const handleUpdateGrammar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrammar || !editingGrammar.title.trim() || !editingGrammar.meaningUz.trim()) return;

    const success = await CustomContentService.updateCustomGrammar(editingGrammar.id, {
      title: editingGrammar.title.trim(),
      level: editingGrammar.level,
      romaji: editingGrammar.romaji?.trim() || editingGrammar.title.trim(),
      meaningUz: editingGrammar.meaningUz.trim(),
      structure: editingGrammar.structure?.trim() || '',
      examples: editingGrammar.examples || [],
    });

    if (success) {
      toast({
        title: '✅ Grammatika yangilandi',
        description: `『${editingGrammar.title}』saqlandi.`,
      });
      setEditingGrammar(null);
      reloadContent();
    } else {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Grammatikani yangilashda xatolik yuz berdi.',
      });
    }
  };

  const handleDeleteGrammar = async (id: string, title: string) => {
    if (!window.confirm(`Haqiqatan ham 『${title}』 grammatika qoidasini o'chirmoqchimisiz?`))
      return;
    const success = await CustomContentService.deleteCustomGrammar(id);
    if (success) {
      toast({ title: '🗑️ Grammatika o‘chirildi' });
      reloadContent();
    }
  };

  // Handle Grammar Bulk Import
  const parsedBulkGrammar = useMemo(() => {
    return CustomContentService.parseGrammarInput(bulkGrammarText);
  }, [bulkGrammarText]);

  const handleExecuteBulkGrammar = async () => {
    if (parsedBulkGrammar.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Hech qanday to‘g‘ri formatdagi grammatika topilmadi',
      });
      return;
    }

    const result: BulkImportResult =
      await CustomContentService.bulkImportGrammar(parsedBulkGrammar);
    toast({
      title: '⚡ Ommaviy Grammatika yuklandi',
      description: `Qo‘shildi: ${result.added} ta, Yangilandi: ${result.updated} ta, Xatolar: ${result.failed}`,
    });
    setBulkGrammarText('');
    setShowBulkGrammarModal(false);
    reloadContent();
  };

  // Handle Single Flashcard submit
  const handleAddSingleCard = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetSubId = selectedSubjectId;

    if (isCreatingNewSubject) {
      if (!newSubjectName.trim()) {
        toast({ variant: 'destructive', title: 'To‘plam nomini kiriting' });
        return;
      }
      try {
        const newSub = await addSubject({
          name: newSubjectName.trim(),
          color: '#3B82F6',
          schedule: [],
          description: 'Admin tomonidan yaratilgan to‘plam',
        });
        if (newSub?.id) {
          targetSubId = newSub.id;
          setSelectedSubjectId(newSub.id);
          setIsCreatingNewSubject(false);
          setNewSubjectName('');
        }
      } catch {
        toast({ variant: 'destructive', title: 'To‘plam ochishda xatolik' });
        return;
      }
    }

    if (!targetSubId) {
      toast({ variant: 'destructive', title: 'Mavzu (to‘plam)ni tanlang' });
      return;
    }

    if (!singleFront.trim() || !singleBack.trim()) {
      toast({ variant: 'destructive', title: 'Karta old va orqa qismini to‘ldiring' });
      return;
    }

    try {
      await addFlashcardsBatch([
        {
          front: singleFront.trim(),
          back: singleBack.trim(),
          subjectId: targetSubId,
        },
      ]);
      toast({ title: '🃏 Fleshkarta yaratildi', description: `『${singleFront}』saqlandi.` });
      setSingleFront('');
      setSingleBack('');
    } catch {
      toast({ variant: 'destructive', title: 'Fleshkartani saqlashda xatolik' });
    }
  };

  // Handle Bulk Flashcards submit
  const handleAddBulkCards = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetSubId = selectedSubjectId;

    if (isCreatingNewSubject) {
      if (!newSubjectName.trim()) {
        toast({ variant: 'destructive', title: 'To‘plam nomini kiriting' });
        return;
      }
      const newSub = await addSubject({
        name: newSubjectName.trim(),
        color: '#10B981',
        schedule: [],
        description: 'Admin tomonidan ommaviy yuklangan to‘plam',
      });
      if (newSub?.id) {
        targetSubId = newSub.id;
        setSelectedSubjectId(newSub.id);
        setIsCreatingNewSubject(false);
        setNewSubjectName('');
      }
    }

    if (!targetSubId) {
      toast({ variant: 'destructive', title: 'To‘plamni tanlang' });
      return;
    }

    const lines = bulkText.split('\n');
    const cardsToInsert: Array<{ front: string; back: string; subjectId: string }> = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let front = '';
      let back = '';

      if (bulkSeparator === 'dash') {
        const parts = trimmed.split('-');
        if (parts.length >= 2) {
          front = parts[0].trim();
          back = parts.slice(1).join('-').trim();
        }
      } else if (bulkSeparator === 'tab') {
        const parts = trimmed.split('\t');
        if (parts.length >= 2) {
          front = parts[0].trim();
          back = parts.slice(1).join('\t').trim();
        }
      } else if (bulkSeparator === 'comma') {
        const parts = trimmed.split(',');
        if (parts.length >= 2) {
          front = parts[0].trim();
          back = parts.slice(1).join(',').trim();
        }
      }

      if (front && back) {
        cardsToInsert.push({
          front,
          back,
          subjectId: targetSubId!,
        });
      }
    });

    if (cardsToInsert.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Kartalar topilmadi',
        description: 'Formatni tekshiring (masalan: Yaponcha - O‘zbekcha).',
      });
      return;
    }

    try {
      await addFlashcardsBatch(cardsToInsert);
      toast({
        title: '⚡ Ommaviy kartalar yuklandi',
        description: `${cardsToInsert.length} ta fleshkarta to‘plamga muvaffaqiyatli saqlandi.`,
      });
      setBulkText('');
    } catch {
      toast({ variant: 'destructive', title: 'Kartalarni saqlashda muammo yuz berdi' });
    }
  };

  // Filtered lists
  const filteredKanji = customKanjiList.filter(
    (k) =>
      k.kanji.includes(kanjiSearch) ||
      k.meaningUz.toLowerCase().includes(kanjiSearch.toLowerCase()) ||
      k.onyomi.includes(kanjiSearch) ||
      k.kunyomi.includes(kanjiSearch) ||
      k.level.toLowerCase().includes(kanjiSearch.toLowerCase()),
  );

  const filteredGrammar = customGrammarList.filter(
    (g) =>
      g.title.toLowerCase().includes(grammarSearch.toLowerCase()) ||
      g.meaningUz.toLowerCase().includes(grammarSearch.toLowerCase()) ||
      g.level.toLowerCase().includes(grammarSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Hidden file input for JSON restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Hidden file input for flashcard CSV/JSON upload */}
      <input
        type="file"
        ref={flashcardFileInputRef}
        onChange={handleFlashcardFileUpload}
        accept=".json,.csv,.txt"
        className="hidden"
      />

      {/* Top Header Card */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-gradient-to-r from-card to-muted/40 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
            <Sparkles className="text-primary" size={20} /> Kontent Studiosi (JLPT & Lug‘at)
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Yangi Kanji, Grammatika qoliplari va fleshkarta to‘plamlarini to‘g‘ridan-to‘g‘ri
            boshqaring.
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncFromDb}
            disabled={isSyncing}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-xs transition-colors hover:bg-muted"
            title="Supabase DB dagi yangi kanji va grammatikalarni yuklab olish"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin text-primary' : ''} />
            {isSyncing ? 'Sinxronlanmoqda...' : 'Serverdan Sinxron'}
          </button>

          <button
            onClick={handleExportBackup}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-xs transition-colors hover:bg-muted"
            title="Barcha maxsus kontentni JSON fayl sifatida yuklab olish"
          >
            <Download size={13} /> JSON Eksport
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-xs transition-colors hover:bg-muted"
            title="Oldingi JSON zaxirani tizimga qayta yuklash"
          >
            <Upload size={13} /> JSON Tiklash
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto border-b border-border pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('kanji')}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${
            activeSubTab === 'kanji'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ⛩️ Kanji Boshqaruvi ({customKanjiList.length})
        </button>
        <button
          onClick={() => setActiveSubTab('grammar')}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${
            activeSubTab === 'grammar'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📝 Grammatika Boshqaruvi ({customGrammarList.length})
        </button>
        <button
          onClick={() => setActiveSubTab('dokkai')}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${
            activeSubTab === 'dokkai'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📖 Dokkai (O‘qish) ({customDokkaiList.length})
        </button>
        <button
          onClick={() => setActiveSubTab('quiz')}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${
            activeSubTab === 'quiz'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ⚡ Test & Savollar ({customQuizList.length})
        </button>
        <button
          onClick={() => setActiveSubTab('choukai')}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${
            activeSubTab === 'choukai'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Headphones size={14} /> 🎧 Choukai (Eshitish)
        </button>
        <button
          onClick={() => setActiveSubTab('flashcards')}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${
            activeSubTab === 'flashcards'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🃏 Fleshkarta & Ommaviy Lug‘at
        </button>
        <button
          onClick={() => setActiveSubTab('scenarios')}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${
            activeSubTab === 'scenarios'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare size={14} /> Suhbat Ssenariylari
        </button>
      </div>

      {/* ==================== 1. KANJI TAB ==================== */}
      {activeSubTab === 'kanji' && (
        <div className="space-y-6">
          {/* Sub-bar for Add Options */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-medium text-muted-foreground">
              Kiritilgan har bir Kanji darhol talabalarning{' '}
              <span className="font-bold text-foreground">/jlpt</span> sahifasida eng yuqorida paydo
              bo‘ladi.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkKanjiModal(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-500 transition-colors hover:bg-amber-500/20"
              >
                <Upload size={14} /> ⚡ Ommaviy Import (Bulk Add)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Create Single Kanji Form */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Plus size={16} className="text-primary" /> Bittalab Kanji Qo‘shish
              </h3>
              <form onSubmit={handleSaveKanji} className="mt-4 space-y-3.5 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block font-medium text-muted-foreground">Kanji *</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={kanjiForm.kanji}
                      onChange={(e) => setKanjiForm({ ...kanjiForm, kanji: e.target.value })}
                      placeholder="櫻"
                      className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-center text-xl font-black text-foreground focus:border-primary"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block font-medium text-muted-foreground">Daraja</label>
                    <select
                      value={kanjiForm.level}
                      onChange={(e) => setKanjiForm({ ...kanjiForm, level: e.target.value as any })}
                      className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-bold text-foreground focus:border-primary"
                    >
                      <option value="N5">JLPT N5</option>
                      <option value="N4">JLPT N4</option>
                      <option value="N3">JLPT N3</option>
                      <option value="N2">JLPT N2</option>
                      <option value="N1">JLPT N1</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block font-medium text-muted-foreground">Chiziqlar</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={kanjiForm.strokeCount}
                      onChange={(e) =>
                        setKanjiForm({ ...kanjiForm, strokeCount: Number(e.target.value) })
                      }
                      className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-bold text-foreground focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-muted-foreground">
                    O‘zbekcha Ma‘nosi *
                  </label>
                  <input
                    type="text"
                    value={kanjiForm.meaningUz}
                    onChange={(e) => setKanjiForm({ ...kanjiForm, meaningUz: e.target.value })}
                    placeholder="Olcha daraxti, Sakura"
                    className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:border-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-muted-foreground">
                      Onyomi (Katakana)
                    </label>
                    <input
                      type="text"
                      value={kanjiForm.onyomi}
                      onChange={(e) => setKanjiForm({ ...kanjiForm, onyomi: e.target.value })}
                      placeholder="オウ"
                      className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2 font-medium text-foreground focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-muted-foreground">
                      Kunyomi (Hiragana)
                    </label>
                    <input
                      type="text"
                      value={kanjiForm.kunyomi}
                      onChange={(e) => setKanjiForm({ ...kanjiForm, kunyomi: e.target.value })}
                      placeholder="さくら"
                      className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2 font-medium text-foreground focus:border-primary"
                    />
                  </div>
                </div>

                {/* Example Word */}
                <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3">
                  <span className="font-bold text-foreground">Misol So‘z (Ixtiyoriy)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="桜花"
                      value={kanjiForm.exampleWord}
                      onChange={(e) => setKanjiForm({ ...kanjiForm, exampleWord: e.target.value })}
                      className="focus:outline-hidden rounded-lg border border-border bg-background p-2 text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="おうか"
                      value={kanjiForm.exampleReading}
                      onChange={(e) =>
                        setKanjiForm({ ...kanjiForm, exampleReading: e.target.value })
                      }
                      className="focus:outline-hidden rounded-lg border border-border bg-background p-2 text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Olcha guli"
                      value={kanjiForm.exampleMeaning}
                      onChange={(e) =>
                        setKanjiForm({ ...kanjiForm, exampleMeaning: e.target.value })
                      }
                      className="focus:outline-hidden rounded-lg border border-border bg-background p-2 text-foreground"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 font-bold text-primary-foreground transition-all hover:bg-primary/90"
                >
                  <Plus size={16} /> Kanjini Saqlash
                </button>
              </form>
            </div>

            {/* Kanji List and Search */}
            <div className="space-y-3 lg:col-span-7">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-muted-foreground" size={15} />
                <input
                  type="text"
                  placeholder="Maxsus kanjilardan qidirish..."
                  value={kanjiSearch}
                  onChange={(e) => setKanjiSearch(e.target.value)}
                  className="focus:outline-hidden w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-xs font-medium text-foreground focus:border-primary"
                />
              </div>

              <div className="max-h-[580px] space-y-2.5 overflow-y-auto pr-1">
                {filteredKanji.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-xs text-muted-foreground">
                    Hozircha maxsus Kanji mavjud emas. Yuqoridagi formadan yoki ommaviy yuklashdan
                    foydalaning.
                  </div>
                ) : (
                  filteredKanji.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 transition-all hover:border-primary/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl font-black text-primary">
                          {item.kanji}
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{item.meaningUz}</span>
                            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-black text-primary">
                              {item.level}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {item.strokeCount} chiziq
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            On: <span className="text-foreground">{item.onyomi}</span> | Kun:{' '}
                            <span className="text-foreground">{item.kunyomi}</span>
                          </div>
                          {item.examples && item.examples.length > 0 && (
                            <div className="text-[10px] text-muted-foreground">
                              Misol: {item.examples[0].word} ({item.examples[0].reading}) —{' '}
                              {item.examples[0].meaning}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingKanji({ ...item })}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Tahrirlash"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteKanji(item.id, item.kanji)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                          title="O‘chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. GRAMMAR TAB ==================== */}
      {activeSubTab === 'grammar' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-medium text-muted-foreground">
              Kiritilgan har bir grammatik qolip darhol talabalarning{' '}
              <span className="font-bold text-foreground">/jlpt</span> sahifasida birinchi o‘rinda
              chiqadi.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkGrammarModal(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-500 transition-colors hover:bg-amber-500/20"
              >
                <Upload size={14} /> ⚡ Ommaviy Import (Bulk Add)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Create Single Grammar Form */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Plus size={16} className="text-primary" /> Bittalab Grammatika Qo‘shish
              </h3>
              <form onSubmit={handleSaveGrammar} className="mt-4 space-y-3.5 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-medium text-muted-foreground">Qolip nomi *</label>
                    <input
                      type="text"
                      value={grammarForm.title}
                      onChange={(e) => setGrammarForm({ ...grammarForm, title: e.target.value })}
                      placeholder="〜てはいけない"
                      className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-bold text-foreground focus:border-primary"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block font-medium text-muted-foreground">Daraja</label>
                    <select
                      value={grammarForm.level}
                      onChange={(e) =>
                        setGrammarForm({ ...grammarForm, level: e.target.value as any })
                      }
                      className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-bold text-foreground focus:border-primary"
                    >
                      <option value="N5">JLPT N5</option>
                      <option value="N4">JLPT N4</option>
                      <option value="N3">JLPT N3</option>
                      <option value="N2">JLPT N2</option>
                      <option value="N1">JLPT N1</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-muted-foreground">
                    O‘zbekcha Ma‘nosi *
                  </label>
                  <input
                    type="text"
                    value={grammarForm.meaningUz}
                    onChange={(e) => setGrammarForm({ ...grammarForm, meaningUz: e.target.value })}
                    placeholder="... qilish mumkin emas / taqiqlanadi"
                    className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-muted-foreground">
                    Tuzilishi / Formula
                  </label>
                  <input
                    type="text"
                    value={grammarForm.structure}
                    onChange={(e) => setGrammarForm({ ...grammarForm, structure: e.target.value })}
                    placeholder="Fe'l [Te-shakli] + はいけない"
                    className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:border-primary"
                  />
                </div>

                {/* Example sentence */}
                <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3">
                  <span className="font-bold text-foreground">Misol Gap (Ixtiyoriy)</span>
                  <input
                    type="text"
                    placeholder="Yaponcha gap: ここでタバコを吸ってはいけません。"
                    value={grammarForm.exampleJa}
                    onChange={(e) => setGrammarForm({ ...grammarForm, exampleJa: e.target.value })}
                    className="focus:outline-hidden w-full rounded-lg border border-border bg-background p-2 text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Tarjimasi: Bu yerda sigaret chekish mumkin emas."
                    value={grammarForm.exampleUz}
                    onChange={(e) => setGrammarForm({ ...grammarForm, exampleUz: e.target.value })}
                    className="focus:outline-hidden w-full rounded-lg border border-border bg-background p-2 text-foreground"
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 font-bold text-primary-foreground transition-all hover:bg-primary/90"
                >
                  <Plus size={16} /> Grammatikani Saqlash
                </button>
              </form>
            </div>

            {/* Grammar List */}
            <div className="space-y-3 lg:col-span-7">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-muted-foreground" size={15} />
                <input
                  type="text"
                  placeholder="Maxsus grammatikadan qidirish..."
                  value={grammarSearch}
                  onChange={(e) => setGrammarSearch(e.target.value)}
                  className="focus:outline-hidden w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-xs font-medium text-foreground focus:border-primary"
                />
              </div>

              <div className="max-h-[580px] space-y-2.5 overflow-y-auto pr-1">
                {filteredGrammar.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-xs text-muted-foreground">
                    Hozircha maxsus grammatika mavjud emas. Yuqoridagi formadan kiritishingiz
                    mumkin.
                  </div>
                ) : (
                  filteredGrammar.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 transition-all hover:border-primary/40"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-foreground">{item.title}</span>
                          <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-black text-primary">
                            {item.level}
                          </span>
                        </div>
                        <div className="font-medium text-muted-foreground">{item.meaningUz}</div>
                        {item.structure && (
                          <div className="rounded-md bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-foreground">
                            {item.structure}
                          </div>
                        )}
                        {item.examples && item.examples.length > 0 && (
                          <div className="text-[11px] italic text-muted-foreground">
                            “{item.examples[0].ja}” — {item.examples[0].uz}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingGrammar({ ...item })}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Tahrirlash"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteGrammar(item.id, item.title)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                          title="O‘chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 3. FLASHCARD BATCH TAB ==================== */}
      {activeSubTab === 'flashcards' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Subject selector card */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 lg:col-span-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Layers size={16} className="text-primary" /> To‘plamni Tanlang
            </h3>

            {!isCreatingNewSubject ? (
              <div className="space-y-3">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="focus:outline-hidden w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-foreground focus:border-primary"
                >
                  <option value="" disabled>
                    To‘plamni tanlang...
                  </option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsCreatingNewSubject(true)}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 py-2 text-xs font-bold text-foreground hover:bg-muted"
                >
                  <FolderPlus size={14} /> + Yangi To‘plam Ochish
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Yangi to‘plam nomi (masalan: Minna No Nihongo 1-dars)..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="focus:outline-hidden w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-foreground focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setIsCreatingNewSubject(false)}
                  className="text-[11px] text-muted-foreground hover:underline"
                >
                  ← Mavjud to‘plamlardan tanlash
                </button>
              </div>
            )}

            {/* Single Card Mini Form */}
            <div className="space-y-3 border-t border-border pt-4">
              <span className="text-xs font-bold text-foreground">Yagona Karta Yaratish</span>
              <form onSubmit={handleAddSingleCard} className="space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Old tomoni (masalan: 食べる)"
                  value={singleFront}
                  onChange={(e) => setSingleFront(e.target.value)}
                  className="focus:outline-hidden w-full rounded-xl border border-border bg-background p-2 font-medium text-foreground focus:border-primary"
                  required
                />
                <input
                  type="text"
                  placeholder="Orqa tomoni (masalan: Yemoq)"
                  value={singleBack}
                  onChange={(e) => setSingleBack(e.target.value)}
                  className="focus:outline-hidden w-full rounded-xl border border-border bg-background p-2 font-medium text-foreground focus:border-primary"
                  required
                />
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary py-2 font-bold text-primary-foreground hover:bg-primary/90"
                >
                  <Plus size={14} /> Kartani Qo‘shish
                </button>
              </form>
            </div>
          </div>

          {/* Bulk Import Card */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 lg:col-span-8">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <CheckCircle2 size={16} className="text-emerald-500" /> ⚡ Ommaviy Lug‘at Qo‘shish
                (Bulk Add)
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Ajratkich:</span>
                <select
                  value={bulkSeparator}
                  onChange={(e) => setBulkSeparator(e.target.value as any)}
                  className="focus:outline-hidden rounded-lg border border-border bg-background px-2 py-1 font-bold text-foreground"
                >
                  <option value="dash">Chiziqcha ( - )</option>
                  <option value="tab">Tab jadval ( \t )</option>
                  <option value="comma">Vergul ( , )</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Har bir qatorda bittadan so‘z va uning tarjimasini kiriting. Masalan:
              <span className="mt-1 block font-mono font-semibold text-foreground">
                猫 - Mushuk
                <br />
                犬 - Kuchuk
                <br />
                食べる - Yemoq
              </span>
            </p>

            <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground">CSV/JSON fayl yuklash</div>
                  <div className="text-[11px] text-muted-foreground">
                    Avval folder tanlang: tanlangan to‘plam yoki JLPT N5–N1.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value as any)}
                    className="focus:outline-hidden rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-bold text-foreground"
                  >
                    <option value="selected">Tanlangan to‘plam</option>
                    <option value="N5">JLPT N5 folder</option>
                    <option value="N4">JLPT N4 folder</option>
                    <option value="N3">JLPT N3 folder</option>
                    <option value="N2">JLPT N2 folder</option>
                    <option value="N1">JLPT N1 folder</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => flashcardFileInputRef.current?.click()}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                  >
                    <Upload size={13} /> Fayl tanlash
                  </button>
                </div>
              </div>
            </div>

            <details className="rounded-xl border border-border/70 bg-background/60 p-3 text-xs">
              <summary className="cursor-pointer font-bold text-foreground">
                JSON/CSV format namunasini ko‘rish
              </summary>
              <div className="mt-3 space-y-3 text-muted-foreground">
                <div>
                  <div className="mb-1 font-semibold text-foreground">JSON (array)</div>
                  <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-2 text-[11px] leading-relaxed text-foreground">
                    {`[
  { "front": "食べる", "back": "Yemoq" },
  { "front": "飲む", "back": "Ichmoq" }
]`}
                  </pre>
                </div>

                <div>
                  <div className="mb-1 font-semibold text-foreground">JSON (cards wrapper)</div>
                  <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-2 text-[11px] leading-relaxed text-foreground">
                    {`{
  "cards": [
    { "front": "先生", "back": "O‘qituvchi" },
    { "front": "学生", "back": "Talaba" }
  ]
}`}
                  </pre>
                </div>

                <div>
                  <div className="mb-1 font-semibold text-foreground">CSV/TXT</div>
                  <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-2 text-[11px] leading-relaxed text-foreground">
                    {`猫 - Mushuk
犬 - Kuchuk
本, Kitob
学校\tMaktab`}
                  </pre>
                </div>
              </div>
            </details>

            <form onSubmit={handleAddBulkCards} className="space-y-3">
              <textarea
                rows={10}
                placeholder={`本 - Kitob\n先生 - O'qituvchi\n学生 - Talaba`}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="focus:outline-hidden w-full rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground focus:border-primary"
                required
              />

              <button
                type="submit"
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-500"
              >
                <CheckCircle2 size={15} /> Barchasini fleshkartaga aylantirish
              </button>
            </form>
          </div>

          {/* Preset Decks Studio Section */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 lg:col-span-12">
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Layers size={16} className="text-primary" />
                  <span>Preset Fleshkard Deklar Studiyasi ({PRESET_DECKS.length} ta To‘plam)</span>
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  JLPT 500 Mon, Minna no Nihongo, Kanji Master va boshqa rasmiy deklardagi
                  kartochkalarni ko‘ring va tahrirlang.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFlashcardManagerModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20"
              >
                <Sparkles size={14} /> Global Override & Cleaner Markazi
              </button>
            </div>

            {/* Preset Deck Picker */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-6">
                <label className="mb-1 block text-xs font-bold text-foreground">
                  Dekni Tanlang ({PRESET_DECKS.length} ta)
                </label>
                <select
                  value={selectedPresetDeckId}
                  onChange={(e) => setSelectedPresetDeckId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Dekni tanlang...</option>
                  {PRESET_DECKS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.icon} {d.title} ({d.cardCount} ta karta, {d.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-6">
                <label className="mb-1 block text-xs font-bold text-foreground">
                  Kartalardan Qidirish
                </label>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Iyeroglif, o‘qilishi yoki o‘zbekcha tarjimadan qidirish..."
                    value={presetCardSearch}
                    onChange={(e) => setPresetCardSearch(e.target.value)}
                    disabled={!selectedPresetDeckId}
                    className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Deck Cards List */}
            {selectedPresetDeckId && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Jami yuklangan: {presetDeckCards.length} ta karta{' '}
                    {presetCardSearch &&
                      `(filtrlangan: ${
                        presetDeckCards.filter(
                          (c) =>
                            c.front.toLowerCase().includes(presetCardSearch.toLowerCase()) ||
                            c.back.toLowerCase().includes(presetCardSearch.toLowerCase()) ||
                            (c.phonetic &&
                              c.phonetic.toLowerCase().includes(presetCardSearch.toLowerCase())),
                        ).length
                      } ta)`}
                  </span>
                  {isLoadingPresetCards && (
                    <span className="flex items-center gap-1 text-primary">
                      <RefreshCw size={12} className="animate-spin" /> Yuklanmoqda...
                    </span>
                  )}
                </div>

                <div className="grid max-h-[480px] grid-cols-1 gap-2.5 overflow-y-auto pr-1 md:grid-cols-2 lg:grid-cols-3">
                  {presetDeckCards
                    .filter((c) => {
                      if (!presetCardSearch.trim()) return true;
                      const q = presetCardSearch.toLowerCase();
                      return (
                        c.front.toLowerCase().includes(q) ||
                        c.back.toLowerCase().includes(q) ||
                        (c.phonetic && c.phonetic.toLowerCase().includes(q))
                      );
                    })
                    .map((card, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col justify-between rounded-xl border border-border bg-background p-3 hover:border-primary/40"
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-base font-bold text-foreground">
                              {card.front}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleEditPresetCardClick(card)}
                              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title="Kartani tahrirlash"
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                          {card.phonetic && (
                            <span className="block text-[11px] font-medium text-primary">
                              {card.phonetic}
                            </span>
                          )}
                          <p className="line-clamp-2 text-xs text-muted-foreground">{card.back}</p>
                        </div>
                        {card.example && (
                          <div className="mt-2 border-t border-border/40 pt-1.5 text-[10px] text-muted-foreground">
                            {card.example}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== DOKKAI TAB ==================== */}
      {activeSubTab === 'dokkai' && <AdminDokkaiManager />}

      {/* ==================== 4. QUIZ TAB ==================== */}
      {activeSubTab === 'quiz' && <AdminQuizManager />}

      {/* ==================== 5. CHOUKAI TAB ==================== */}
      {activeSubTab === 'choukai' && <AdminChoukaiManager />}

      {/* ==================== 6. SCENARIOS TAB ==================== */}
      {activeSubTab === 'scenarios' && <AdminScenarioManager />}

      {/* ==================== MODALS ==================== */}

      {/* 1. Edit Kanji Modal */}
      {editingKanji && (
        <div
          className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditingKanji(null)}
        >
          <div
            className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl duration-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Edit2 size={16} className="text-primary" /> Kanjini Tahrirlash: 『
                {editingKanji.kanji}』
              </h3>
              <button
                onClick={() => setEditingKanji(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateKanji} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground">Kanji</label>
                  <input
                    type="text"
                    value={editingKanji.kanji}
                    onChange={(e) => setEditingKanji({ ...editingKanji, kanji: e.target.value })}
                    className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-center text-xl font-black text-foreground focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground">Daraja</label>
                  <select
                    value={editingKanji.level}
                    onChange={(e) =>
                      setEditingKanji({ ...editingKanji, level: e.target.value as any })
                    }
                    className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-bold text-foreground focus:border-primary"
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground">Chiziqlar</label>
                  <input
                    type="number"
                    value={editingKanji.strokeCount}
                    onChange={(e) =>
                      setEditingKanji({ ...editingKanji, strokeCount: Number(e.target.value) })
                    }
                    className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-bold text-foreground focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-muted-foreground">O‘zbekcha Ma‘nosi</label>
                <input
                  type="text"
                  value={editingKanji.meaningUz}
                  onChange={(e) => setEditingKanji({ ...editingKanji, meaningUz: e.target.value })}
                  className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground">Onyomi</label>
                  <input
                    type="text"
                    value={editingKanji.onyomi}
                    onChange={(e) => setEditingKanji({ ...editingKanji, onyomi: e.target.value })}
                    className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2 font-medium text-foreground focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground">Kunyomi</label>
                  <input
                    type="text"
                    value={editingKanji.kunyomi}
                    onChange={(e) => setEditingKanji({ ...editingKanji, kunyomi: e.target.value })}
                    className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2 font-medium text-foreground focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setEditingKanji(null)}
                  className="rounded-xl border border-border px-4 py-2 font-bold text-foreground hover:bg-muted"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground hover:bg-primary/90"
                >
                  O‘zgarishlarni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Grammar Modal */}
      {editingGrammar && (
        <div
          className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditingGrammar(null)}
        >
          <div
            className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl duration-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Edit2 size={16} className="text-primary" /> Grammatikani Tahrirlash: 『
                {editingGrammar.title}』
              </h3>
              <button
                onClick={() => setEditingGrammar(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateGrammar} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-medium text-muted-foreground">Qolip nomi</label>
                  <input
                    type="text"
                    value={editingGrammar.title}
                    onChange={(e) =>
                      setEditingGrammar({ ...editingGrammar, title: e.target.value })
                    }
                    className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-bold text-foreground focus:border-primary"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-medium text-muted-foreground">Daraja</label>
                  <select
                    value={editingGrammar.level}
                    onChange={(e) =>
                      setEditingGrammar({ ...editingGrammar, level: e.target.value as any })
                    }
                    className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-bold text-foreground focus:border-primary"
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-muted-foreground">O‘zbekcha Ma‘nosi</label>
                <input
                  type="text"
                  value={editingGrammar.meaningUz}
                  onChange={(e) =>
                    setEditingGrammar({ ...editingGrammar, meaningUz: e.target.value })
                  }
                  className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground">
                  Tuzilishi / Formula
                </label>
                <input
                  type="text"
                  value={editingGrammar.structure}
                  onChange={(e) =>
                    setEditingGrammar({ ...editingGrammar, structure: e.target.value })
                  }
                  className="focus:outline-hidden mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setEditingGrammar(null)}
                  className="rounded-xl border border-border px-4 py-2 font-bold text-foreground hover:bg-muted"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground hover:bg-primary/90"
                >
                  O‘zgarishlarni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Bulk Kanji Importer Modal */}
      {showBulkKanjiModal && (
        <div
          className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowBulkKanjiModal(false)}
        >
          <div
            className="w-full max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl duration-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Upload size={16} className="text-amber-500" /> Kanji Ommaviy Import (Bulk Add)
              </h3>
              <button
                onClick={() => setShowBulkKanjiModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>
                  Format:{' '}
                  <code className="font-mono font-bold text-foreground">
                    Kanji | Daraja | Onyomi | Kunyomi | Ma‘nosi | Chiziqlar
                  </code>{' '}
                  yoki JSON
                </span>
              </div>
              <textarea
                rows={7}
                placeholder={`桜 | N3 | オウ | さくら | Olcha daraxti guli | 10\n川 | N5 | セン | かわ | Daryo | 3\n月 - Oy`}
                value={bulkKanjiText}
                onChange={(e) => setBulkKanjiText(e.target.value)}
                className="focus:outline-hidden w-full rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground focus:border-primary"
              />
            </div>

            {/* Live Preview Bar */}
            <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-xs">
              <span className="text-muted-foreground">
                Aniqlangan kanjilar soni:{' '}
                <strong className="text-foreground">{parsedBulkKanji.length} ta</strong>
              </span>
              {parsedBulkKanji.length > 0 && (
                <div className="flex max-w-xs items-center gap-1.5 overflow-x-auto">
                  {parsedBulkKanji.slice(0, 8).map((k, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-border bg-card px-2 py-0.5 font-black text-primary"
                    >
                      {k.kanji}
                    </span>
                  ))}
                  {parsedBulkKanji.length > 8 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{parsedBulkKanji.length - 8}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
              <button
                type="button"
                onClick={() => setShowBulkKanjiModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkKanji}
                disabled={parsedBulkKanji.length === 0}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Hammasini Yuklash ({parsedBulkKanji.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bulk Grammar Importer Modal */}
      {showBulkGrammarModal && (
        <div
          className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowBulkGrammarModal(false)}
        >
          <div
            className="w-full max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl duration-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Upload size={16} className="text-amber-500" /> Grammatika Ommaviy Import (Bulk Add)
              </h3>
              <button
                onClick={() => setShowBulkGrammarModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>
                  Format:{' '}
                  <code className="font-mono font-bold text-foreground">
                    Qolip | Daraja | Romaji | Formula | Ma‘nosi
                  </code>{' '}
                  yoki JSON
                </span>
              </div>
              <textarea
                rows={7}
                placeholder={`〜わけにはいかない | N2 | wake ni wa ikanai | V-ru + わけにはいかない | ... qilib bo'lmaydi\n〜ことにする | N3 | koto ni suru | V-ru + ことにする | ... qilishga qaror qilmoq`}
                value={bulkGrammarText}
                onChange={(e) => setBulkGrammarText(e.target.value)}
                className="focus:outline-hidden w-full rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground focus:border-primary"
              />
            </div>

            {/* Live Preview Bar */}
            <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-xs">
              <span className="text-muted-foreground">
                Aniqlangan qoliplar soni:{' '}
                <strong className="text-foreground">{parsedBulkGrammar.length} ta</strong>
              </span>
              {parsedBulkGrammar.length > 0 && (
                <div className="flex max-w-xs items-center gap-1.5 overflow-x-auto">
                  {parsedBulkGrammar.slice(0, 3).map((g, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-bold text-primary"
                    >
                      {g.title}
                    </span>
                  ))}
                  {parsedBulkGrammar.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{parsedBulkGrammar.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
              <button
                type="button"
                onClick={() => setShowBulkGrammarModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkGrammar}
                disabled={parsedBulkGrammar.length === 0}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Hammasini Yuklash ({parsedBulkGrammar.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Flashcard Manager Modal (Cleaner & Global Overrides) */}
      {showFlashcardManagerModal && (
        <AdminFlashcardManager
          isOpen={showFlashcardManagerModal}
          onClose={() => setShowFlashcardManagerModal(false)}
        />
      )}

      {/* Edit Preset Card Modal */}
      {editingPresetCard && (
        <div
          className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditingPresetCard(null)}
        >
          <div
            className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-sm font-bold text-foreground">
                Kartani Tahrirlash (Global Override)
              </h4>
              <button
                type="button"
                onClick={() => setEditingPresetCard(null)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePresetCard} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-foreground">Old tomoni (Front)</label>
                <input
                  type="text"
                  value={editFront}
                  onChange={(e) => setEditFront(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2 font-bold text-foreground focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">
                  O‘qilishi / Transkripsiya (Phonetic)
                </label>
                <input
                  type="text"
                  value={editPhonetic}
                  onChange={(e) => setEditPhonetic(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2 font-medium text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">
                  Orqa tomoni (Tarjima)
                </label>
                <textarea
                  rows={2}
                  value={editBack}
                  onChange={(e) => setEditBack(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2 text-foreground focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">Misol Gap (Example)</label>
                <textarea
                  rows={2}
                  value={editExample}
                  onChange={(e) => setEditExample(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isSavingCardOverride}
                  className="flex-1 py-2 font-bold"
                >
                  {isSavingCardOverride ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPresetCard(null)}
                  className="py-2"
                >
                  Bekor qilish
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
