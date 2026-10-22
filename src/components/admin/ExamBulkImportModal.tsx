import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload,
  X,
  Loader2,
  Eye,
  Table2,
  Save,
  Trash2,
  Edit3,
  Plus,
  RotateCcw,
  Search,
  AlertTriangle,
  FileText,
  BookOpen,
  HelpCircle,
  Check,
  Clock,
  Award,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from '../../hooks/use-toast';
import {
  ExamBulkImportService,
  JlptLevel,
  BulkValidationResult,
  ValidatedQuestion,
} from '../../services/ExamBulkImportService';
import { ExamWorkflowService } from '../../services/ExamWorkflowService';
import { JlptQuestionPreview } from '../jlpt/JlptQuestionPreview';
import {
  buildJlptQuestionPayload,
  normalizeJlptQuestionType,
  type JlptQuestionType,
} from '../../types/jlptQuestionType';
import {
  type ExamLicenseType,
  LICENSE_CONFIG,
  validateJlptOfficialStatus,
} from '../../types/examMetadata';
import {
  parsePdfFile,
  pdfQuestionsToJson,
  validatePdfFile,
} from '../../services/ExamPdfImportService';
import {
  ExamAiExtractorService,
  type AiExtractionResult,
} from '../../services/ExamAiExtractorService';
import {
  canImportExamContent,
  canPublishExamContent,
  examImportRateLimiter,
  sanitizeImportError,
  validateImportUpload,
} from '../../utils/examImportSecurity';
import { evaluateLegalGates, type LegalGateField } from '../../utils/examLegalGates';

export interface ExamBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: { count: number; examId?: string }) => void;
  mode: 'section' | 'full-exam';
  sectionId?: string;
  sectionTitle?: string;
  examLevel?: JlptLevel | null;
  existingQuestions?: Array<{
    id?: string | number;
    question_text?: string;
    passage?: string | null;
  }>;
  existingPassages?: string[];
  examId?: string;
  availableExams?: Array<{ id: string; title: string; type: string }>;
  currentUserEmail?: string | null;
  currentUserRole?: string | null;
}

interface EditDraft {
  question_text: string;
  passage: string;
  options: string[];
  correct_index: number;
  explanation: string;
  level: JlptLevel;
  section_type: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  question_type?: JlptQuestionType;
  fragments?: string[];
  correct_order?: number[];
  star_position?: number;
  question_payload?: Record<string, any>;
}

export const ExamBulkImportModal: React.FC<ExamBulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  sectionId,
  sectionTitle,
  examLevel = 'N3',
  existingQuestions = [],
  existingPassages = [],
  examId,
  availableExams = [],
  currentUserEmail = null,
  currentUserRole = null,
}) => {
  const canImport = canImportExamContent(currentUserEmail, currentUserRole);
  const canPublish = canPublishExamContent(currentUserEmail, currentUserRole);
  // Task 17: bulk import is draft-only. Publishing is never possible here —
  // it only happens through ExamWorkflowService.transitionExamStatus(...,
  // 'published') by an admin after the content passed review.
  const publishHint = canPublish
    ? 'Nashr qilish (publish) faqat review va tasdiqlashdan keyin, admin workflow orqali amalga oshiriladi.'
    : 'Nashr qilish (publish) faqat admin uchun ruxsat etilgan. Siz import qilib, reviewga yubora olasiz.';
  const [inputTab, setInputTab] = useState<'file' | 'text' | 'ai'>('file');
  const [fileFormat, setFileFormat] = useState<'auto' | 'json' | 'csv'>('auto');
  const [rawContent, setRawContent] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'errors' | 'warnings' | 'valid' | 'duplicates' | 'deleted'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'preview'>('table');
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [deletedRows, setDeletedRows] = useState<Set<number>>(new Set());
  const [overrides, setOverrides] = useState<Record<number, ValidatedQuestion>>({});
  const [expandedPassages, setExpandedPassages] = useState<Set<number>>(new Set());

  // AI Extraction States (Task 4)
  const [aiInputMode, setAiInputMode] = useState<'text' | 'file'>('text');
  const [aiSourceText, setAiSourceText] = useState<string>('');
  const [aiSelectedFile, setAiSelectedFile] = useState<File | null>(null);
  const [aiCustomInstruction, setAiCustomInstruction] = useState<string>('');
  const [isAiExtracting, setIsAiExtracting] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiExtractionResult | null>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  // Real Exam Preview Simulator State
  const [previewAnswers, setPreviewAnswers] = useState<Record<number, number>>({});
  const [showCorrectInPreview, setShowCorrectInPreview] = useState<boolean>(false);
  const [previewSectionFilter, setPreviewSectionFilter] = useState<
    'all' | 'knowledge' | 'reading' | 'listening'
  >('all');
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  // New Exam Settings
  const [examTargetType, setExamTargetType] = useState<'create_new' | 'existing'>(
    availableExams.length > 0 && examId ? 'existing' : 'create_new',
  );
  const [selectedExamId, setSelectedExamId] = useState<string>(
    examId || availableExams[0]?.id || '',
  );
  const [newTitle, setNewTitle] = useState<string>('');
  const [newLevel, setNewLevel] = useState<JlptLevel>(examLevel || 'N3');
  const [newDesc, setNewDesc] = useState<string>('');
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const [pdfWarnings, setPdfWarnings] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Source & License Metadata States (Task 7)
  const [sourceName, setSourceName] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [licenseType, setLicenseType] = useState<ExamLicenseType>('original');
  const [copyrightConfirmed, setCopyrightConfirmed] = useState<boolean>(false);
  const [isOfficialJlpt, setIsOfficialJlpt] = useState<boolean>(false);

  // Task 18: live legal / metadata checklist. The import itself stays
  // draft-only, but the user must know exactly which fields still block
  // publishing later on.
  const legalGates = useMemo(
    () =>
      evaluateLegalGates({
        copyrightConfirmed,
        licenseType,
        sourceName,
        sourceUrl,
        author,
        isOfficialJlpt,
        title: newTitle,
      }),
    [copyrightConfirmed, licenseType, sourceName, sourceUrl, author, isOfficialJlpt, newTitle],
  );
  const blockingLegalGates = useMemo(
    () => legalGates.filter((gate) => gate.blocking),
    [legalGates],
  );
  const missingLegalFieldList = useMemo(
    () => Array.from(new Set(blockingLegalGates.map((gate) => gate.field))),
    [blockingLegalGates],
  );
  const isLegalFieldMissing = (field: LegalGateField) => missingLegalFieldList.includes(field);

  useEffect(() => {
    if (isOpen) {
      setRawContent('');
      setFileName(null);
      setFileSizeStr(null);
      setActiveFilter('all');
      setSearchQuery('');
      setIsImporting(false);
      setImportProgress(null);
      setViewMode('table');
      setEditingRow(null);
      setEditDraft(null);
      setDeletedRows(new Set());
      setOverrides({});
      setExpandedPassages(new Set());
      setPreviewAnswers({});
      setShowCorrectInPreview(false);
      setIsSimulated(false);
      setPreviewSectionFilter('all');
      setAiSourceText('');
      setAiSelectedFile(null);
      setAiCustomInstruction('');
      setAiError(null);
      setAiResult(null);
      setIsAiExtracting(false);
      setSourceName('');
      setSourceUrl('');
      setAuthor('');
      setLicenseType('original');
      setCopyrightConfirmed(false);
      setIsOfficialJlpt(false);
      if (examId) setSelectedExamId(examId);
      if (examLevel) setNewLevel(examLevel);
    }
  }, [isOpen, examId, examLevel]);

  const baseValidation: BulkValidationResult | null = useMemo(() => {
    if (!rawContent.trim()) return null;
    return ExamBulkImportService.parseAndValidate(rawContent, fileFormat, {
      defaultLevel: mode === 'section' ? examLevel || undefined : newLevel,
      existingQuestions,
      existingPassages,
      checkIntraBatchDuplicates: true,
    });
  }, [rawContent, fileFormat, mode, examLevel, newLevel, existingQuestions, existingPassages]);

  const validationResult: BulkValidationResult | null = useMemo(() => {
    if (!baseValidation) return null;
    if (Object.keys(overrides).length === 0) return baseValidation;
    const mergedItems = baseValidation.items.map((item) => {
      const ov = overrides[item.row];
      if (ov) return { ...item, validated: { ...ov } };
      return item;
    });
    return ExamBulkImportService.revalidateEditedItems(mergedItems, {
      expectedLevel: mode === 'section' ? examLevel || undefined : newLevel,
      existingQuestions,
      existingPassages,
    });
  }, [baseValidation, overrides, mode, examLevel, newLevel, existingQuestions, existingPassages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadDroppedFile(file);
  };

  const loadDroppedFile = (file: File) => {
    setFileName(file.name);
    setFileSizeStr((file.size / 1024).toFixed(1) + ' KB');
    setPdfWarnings([]);

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      setFileFormat('json');
      void handlePdfFile(file);
      return;
    }

    const uploadCheck = validateImportUpload(file);
    if (!uploadCheck.valid) {
      setFileName(null);
      setFileSizeStr(null);
      setRawContent('');
      toast({
        variant: 'destructive',
        title: 'Fayl rad etildi',
        description: uploadCheck.error,
      });
      return;
    }

    if (file.name.toLowerCase().endsWith('.csv')) setFileFormat('csv');
    else if (file.name.toLowerCase().endsWith('.json')) setFileFormat('json');
    else setFileFormat('auto');
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      setRawContent(content);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handlePdfFile = async (file: File) => {
    const pdfCheck = validateImportUpload(file, 'pdf');
    const validation = pdfCheck.valid
      ? validatePdfFile(file)
      : { valid: false, error: pdfCheck.error };
    if (!validation.valid) {
      setRawContent('');
      toast({
        variant: 'destructive',
        title: 'PDF yuklanmadi',
        description: validation.error,
      });
      return;
    }

    setIsParsingPdf(true);
    try {
      const parsed = await parsePdfFile(file);
      setPdfWarnings(parsed.warnings);
      if (!parsed.questions.length) {
        setRawContent('');
        toast({
          variant: 'destructive',
          title: 'Savol topilmadi',
          description:
            parsed.warnings[0] ||
            'PDF matnida savollar topilmadi. Boshqa formatda (CSV/JSON) urinib ko‘ring.',
        });
        return;
      }
      setRawContent(pdfQuestionsToJson(parsed.questions));
      toast({
        title: 'PDF o‘qildi',
        description: `${parsed.questions.length} ta savol topildi (${parsed.pageCount} sahifa).`,
      });
    } catch (err: any) {
      setRawContent('');
      toast({
        variant: 'destructive',
        title: 'PDF o‘qib bo‘lmadi',
        description: sanitizeImportError(err?.message || 'Noma’lum xatolik.'),
      });
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) loadDroppedFile(e.dataTransfer.files[0]);
  };

  const handleAiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiSelectedFile(file);
    setAiError(null);
  };

  const handleLoadAiDemoText = () => {
    const demo = `JLPT N3 Sinov Savollari to'plami:

1. 彼女はいつも（　　）服を着ていて、遠くからでもすぐ分かる。
A) 派手な
B) 地味な
C) 清潔な
D) 親切な
答え: A
解説: 遠くからでも目立つという意味なので「派手な」が正解です。

2. 【読解問題】
以下の文章を読んで、筆者の考えに最も合うものを選びなさい。
「科学技術の進歩によって私たちの生活は非常に便利になった。しかし、便利さの代償として人と人との直接的な対話が減ってきているのも事実である。便利さを享受しながらも、心の触れ合いを大切にする姿勢が今こそ求められているのではないだろうか。」

質問: 筆者が最も伝えたいことは何か。
1) 科学技術は危険だから使用を制限すべきだ
2) 生活が便利になったことだけを喜ぶべきだ
3) 便利さを利用しつつも、人との心の触れ合いを大切にすべきだ
4) 直接的な対話はもはや必要ない
正解: 3
解説: 文章の最後の文で「便利さを享受しながらも、心の触れ合いを大切にする姿勢が今こそ求められている」と述べられています。`;
    setAiSourceText(demo);
    setAiInputMode('text');
    setAiError(null);
  };

  const handleAiExtract = async (overrideInstruction?: string) => {
    setIsAiExtracting(true);
    setAiError(null);
    try {
      const result = await ExamAiExtractorService.extractQuestions({
        text: aiSourceText,
        file: aiSelectedFile || undefined,
        customInstruction:
          overrideInstruction !== undefined ? overrideInstruction : aiCustomInstruction,
        defaultLevel: examLevel || newLevel || 'N3',
      });

      setAiResult(result);
      if (result.recommendedTitle && !newTitle.trim()) {
        setNewTitle(result.recommendedTitle);
      }
      if (result.recommendedLevel) {
        setNewLevel(result.recommendedLevel);
      }
      // Pass questions to validation pipeline as JSON
      setRawContent(JSON.stringify(result.questions, null, 2));
      setFileFormat('json');
      setViewMode('table');

      toast({
        title: '✨ AI tahlili yakunlandi',
        description: result.summary,
      });
    } catch (err: any) {
      const msg = err?.message || 'AI tahlilida kutilmagan xatolik yuz berdi.';
      setAiError(msg);
      toast({
        title: 'AI xatosi',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsAiExtracting(false);
    }
  };

  const handleLoadDemo = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      setFileFormat('csv');
      setFileName('namuna_jlpt_savollar.csv');
      setFileSizeStr('~1.2 KB');
      setRawContent(ExamBulkImportService.generateCsvTemplate());
    } else {
      setFileFormat('json');
      setFileName('namuna_jlpt_savollar.json');
      setFileSizeStr('~1.5 KB');
      setRawContent(ExamBulkImportService.generateJsonTemplate());
    }
    toast({ title: 'Namuna yuklandi', description: format.toUpperCase() + ' namuna yuklandi.' });
  };

  // Filtered rows for the table view
  const filteredItems = useMemo(() => {
    if (!validationResult) return [];
    let list = validationResult.items;

    // Filter by tab
    switch (activeFilter) {
      case 'errors':
        list = list.filter((it) => it.status === 'error' && !deletedRows.has(it.row));
        break;
      case 'warnings':
        list = list.filter((it) => it.status === 'warning' && !deletedRows.has(it.row));
        break;
      case 'valid':
        list = list.filter((it) => it.status === 'valid' && !deletedRows.has(it.row));
        break;
      case 'duplicates':
        list = list.filter((it) => it.isDuplicate && !deletedRows.has(it.row));
        break;
      case 'deleted':
        list = list.filter((it) => deletedRows.has(it.row));
        break;
      default:
        // 'all' includes non-deleted or all items
        break;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((it) => {
        const v = it.validated;
        const raw = it.raw;
        const text = (v?.question_text || raw.question || raw.question_text || '').toLowerCase();
        const passage = (
          v?.passage ||
          raw.passage ||
          raw.reading_passage ||
          raw.text ||
          ''
        ).toLowerCase();
        const explanation = (v?.explanation || raw.explanation || '').toLowerCase();
        const optionsList =
          v?.options ||
          (Array.isArray(raw.options)
            ? raw.options
            : [raw.option_a, raw.option_b, raw.option_c, raw.option_d]);
        const optionsStr = optionsList.filter(Boolean).join(' ').toLowerCase();
        return (
          text.includes(q) ||
          passage.includes(q) ||
          explanation.includes(q) ||
          optionsStr.includes(q)
        );
      });
    }

    return list;
  }, [validationResult, activeFilter, deletedRows, searchQuery]);

  // Valid questions eligible for import
  const validQuestionsToImport: ValidatedQuestion[] = useMemo(() => {
    if (!validationResult) return [];
    return validationResult.items
      .filter((it) => it.status !== 'error' && it.validated !== null && !deletedRows.has(it.row))
      .map((it) => it.validated!);
  }, [validationResult, deletedRows]);

  const confirmableCount = validQuestionsToImport.length;

  const hasBlockingErrors = useMemo(() => {
    if (!validationResult) return false;
    return validationResult.items.some((it) => it.status === 'error' && !deletedRows.has(it.row));
  }, [validationResult, deletedRows]);

  // Start editing a row (even if it had errors originally, user can repair it)
  const startEditing = (row: number) => {
    const item = validationResult?.items.find((i) => i.row === row);
    if (!item) return;
    const v = item.validated;
    const raw = item.raw;

    let initialOptions: string[] = [];
    if (v?.options && v.options.length > 0) {
      initialOptions = [...v.options];
    } else if (Array.isArray(raw.options)) {
      initialOptions = raw.options.map((o) => String(o).trim());
    } else if (typeof raw.options === 'string') {
      try {
        const parsed = JSON.parse(raw.options);
        if (Array.isArray(parsed)) initialOptions = parsed.map((o) => String(o).trim());
        else initialOptions = raw.options.split('|').map((o) => o.trim());
      } catch {
        initialOptions = raw.options.split('|').map((o) => o.trim());
      }
    } else {
      const extracted = [raw.option_a, raw.option_b, raw.option_c, raw.option_d]
        .map((o) => (o !== undefined && o !== null ? String(o).trim() : ''))
        .filter(Boolean);
      initialOptions = extracted.length > 0 ? extracted : ['', '', '', ''];
    }

    while (initialOptions.length < 2) {
      initialOptions.push('');
    }

    let initialIdx = 0;
    if (v && typeof v.correct_index === 'number') {
      initialIdx = v.correct_index;
    } else if (raw.correct_index !== undefined && !isNaN(Number(raw.correct_index))) {
      initialIdx = Number(raw.correct_index);
    } else if (raw.correctAnswer !== undefined || raw.correct_answer !== undefined) {
      const ca = String(raw.correctAnswer || raw.correct_answer).trim();
      const mIdx = initialOptions.findIndex((o) => o.toLowerCase() === ca.toLowerCase());
      if (mIdx >= 0) initialIdx = mIdx;
      else if (/^[A-D]$/i.test(ca)) {
        initialIdx = ca.toUpperCase().charCodeAt(0) - 65;
      }
    }

    const cleanLevel = raw.level ? String(raw.level).toUpperCase().replace(/\s+/g, '') : '';
    const initialLevel: JlptLevel =
      v?.level ||
      (['N1', 'N2', 'N3', 'N4', 'N5'].includes(cleanLevel) ? (cleanLevel as JlptLevel) : null) ||
      (mode === 'section' ? examLevel : newLevel) ||
      'N3';

    const rawSec = String(raw.section || raw.section_name || raw.section_type || '').toLowerCase();
    let initialSection = v?.section_type || 'knowledge';
    if (!v) {
      if (rawSec.includes('read') || rawSec.includes('dokkai')) initialSection = 'reading';
      else if (rawSec.includes('listen') || rawSec.includes('choukai'))
        initialSection = 'listening';
      else initialSection = 'knowledge';
    }

    setEditingRow(row);
    setEditDraft({
      question_text: v?.question_text || raw.question || raw.question_text || '',
      passage: v?.passage || raw.passage || raw.reading_passage || raw.text || raw.content || '',
      options: initialOptions,
      correct_index: Math.max(0, Math.min(initialIdx, Math.max(initialOptions.length - 1, 0))),
      explanation: v?.explanation || raw.explanation || '',
      level: initialLevel,
      section_type: initialSection,
      difficulty: v?.difficulty || (raw.difficulty as any) || 'medium',
      question_type: normalizeJlptQuestionType(
        v?.question_type || raw.question_type,
        initialSection,
      ),
      fragments: v?.question_payload?.fragments,
      correct_order: v?.question_payload?.correct_order,
      star_position: v?.question_payload?.star_position,
      question_payload: v?.question_payload,
    });
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditDraft(null);
  };

  const saveEditing = (row: number) => {
    if (!editDraft) return;
    const qText = editDraft.question_text.trim();
    const opts = editDraft.options.map((o) => o.trim());

    if (qText.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Savol matni juda qisqa',
        description: "Savol matni kamida 3 ta belgidan iborat bo'lishi shart.",
      });
      return;
    }
    const nonEmptyOpts = opts.filter(Boolean);
    if (nonEmptyOpts.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Variantlar yetarli emas',
        description: "Kamida 2 ta to'ldirilgan variant bo'lishi shart.",
      });
      return;
    }

    const safeIndex = Math.min(Math.max(editDraft.correct_index, 0), opts.length - 1);
    const item = validationResult?.items.find((i) => i.row === row);
    if (!item) return;

    const questionType =
      editDraft.question_type ||
      normalizeJlptQuestionType(
        item.validated?.question_type || item.raw.question_type,
        editDraft.section_type,
      );
    const updated: ValidatedQuestion = {
      id: item.validated?.id ?? item.raw.id,
      question_text: qText,
      type: 'multiple_choice',
      options: opts,
      correct_index: safeIndex,
      correct_answer: opts[safeIndex] || '',
      explanation: editDraft.explanation.trim() || null,
      passage: editDraft.passage.trim() || null,
      level: editDraft.level,
      section_name: editDraft.section_type,
      section_type: editDraft.section_type,
      difficulty: editDraft.difficulty || 'medium',
      question_type: questionType,
      question_payload: buildJlptQuestionPayload({
        type: questionType,
        options: opts,
        correctAnswer: opts[safeIndex] || '',
        correctIndex: safeIndex,
        fragments: editDraft.fragments,
        correctOrder: editDraft.correct_order,
        starPosition: editDraft.star_position,
      }),
    };

    setOverrides((pr) => ({ ...pr, [row]: updated }));
    setEditingRow(null);
    setEditDraft(null);
    toast({
      title: 'Savol yangilandi',
      description: `${row}-qator qayta tekshirildi va saqlandi.`,
    });
  };

  const deleteRow = (row: number) => {
    setDeletedRows((prev) => new Set(prev).add(row));
    if (editingRow === row) cancelEditing();
    toast({
      title: "Savol o'chirildi",
      description: `${row}-qator import ro'yxatidan chiqarildi.`,
    });
  };

  const restoreRow = (row: number) => {
    setDeletedRows((prev) => {
      const n = new Set(prev);
      n.delete(row);
      return n;
    });
    toast({
      title: 'Savol qaytarildi',
      description: `${row}-qator import ro'yxatiga qayta tiklandi.`,
    });
  };

  const togglePassageExpand = (row: number) => {
    setExpandedPassages((prev) => {
      const n = new Set(prev);
      if (n.has(row)) n.delete(row);
      else n.add(row);
      return n;
    });
  };

  // Preview filtering questions
  const previewQuestions = useMemo(() => {
    if (previewSectionFilter === 'all') return validQuestionsToImport;
    return validQuestionsToImport.filter((q) => q.section_type === previewSectionFilter);
  }, [validQuestionsToImport, previewSectionFilter]);

  // Preview Simulation calculation
  const simulationResults = useMemo(() => {
    if (!isSimulated || validQuestionsToImport.length === 0) return null;
    let correctCount = 0;
    validQuestionsToImport.forEach((q, idx) => {
      const ans = previewAnswers[idx];
      if (ans === q.correct_index) {
        correctCount++;
      }
    });
    const percentage = Math.round((correctCount / validQuestionsToImport.length) * 100);
    return {
      score: correctCount,
      total: validQuestionsToImport.length,
      percentage,
      isPassed: percentage >= 60,
    };
  }, [isSimulated, validQuestionsToImport, previewAnswers]);

  const handleExecuteImport = async () => {
    if (!canImport) {
      toast({
        variant: 'destructive',
        title: 'Ruxsat yo‘q',
        description: 'Faqat admin yoki reviewer kontent import qilishi mumkin.',
      });
      return;
    }

    const rate = examImportRateLimiter.check(currentUserEmail || currentUserRole || 'anonymous');
    if (!rate.allowed) {
      toast({
        variant: 'destructive',
        title: 'Juda ko‘p urinish',
        description: `Import limiti oshib ketdi. ${Math.ceil(
          rate.retryAfterMs / 1000,
        )} soniyadan keyin qayta urinib ko‘ring.`,
      });
      return;
    }

    if (validQuestionsToImport.length === 0) {
      toast({
        variant: 'destructive',
        title: "Import qilib bo'lmaydi",
        description: "Saqlash uchun kamida 1 ta to'g'ri (valid) savol bo'lishi shart!",
      });
      return;
    }
    if (hasBlockingErrors) {
      toast({
        variant: 'destructive',
        title: "Tasdiqlab bo'lmaydi",
        description: "Xatolik mavjud bo'lgan savollarni to'g'rilang yoki o'chiring.",
      });
      return;
    }

    // Copyright confirmation validation (Task 7)
    if (!copyrightConfirmed) {
      toast({
        variant: 'destructive',
        title: 'Mualliflik huquqi tasdiqlanmagan',
        description:
          "Iltimos, import qilishdan oldin 'Mualliflik huquqi roziligi' (Copyright confirmation) katakchasini belgilang.",
      });
      return;
    }

    // Official JLPT claim validation (Task 7)
    if (isOfficialJlpt) {
      const officialCheck = validateJlptOfficialStatus({
        isOfficialJlpt: true,
        sourceName: sourceName.trim(),
        title: newTitle.trim(),
      });
      if (!officialCheck.isValid) {
        toast({
          variant: 'destructive',
          title: 'Rasmiy JLPT xatoligi',
          description: officialCheck.error,
        });
        return;
      }
    }

    // Restricted license warning (Task 7) — publish is not part of import.
    if (licenseType === 'restricted') {
      toast({
        title: 'Cheklangan litsenziya',
        description:
          "Ushbu material 'Restricted' (cheklangan) litsenziyaga ega. Nashr qilishdan oldin mualliflik huquqlarini tekshiring.",
      });
    }

    setIsImporting(true);
    setImportProgress('Draft sifatida saqlanmoqda...');
    try {
      if (mode === 'section') {
        if (!sectionId) throw new Error("Bo'lim identifikatori topilmadi.");
        const res = await ExamBulkImportService.importQuestionsToSection(
          sectionId,
          validQuestionsToImport,
        );
        toast({
          title: 'Draft sifatida saqlandi',
          description: `${res.insertedCount} ta savol bo'limga qo'shildi.${
            res.batchId ? ` Batch: ${res.batchId.slice(0, 8)}…` : ''
          } Publish qilish uchun review kerak.`,
        });
        onSuccess({ count: res.insertedCount });
        onClose();
      } else {
        if (examTargetType === 'create_new') {
          const title = newTitle.trim() || `JLPT ${newLevel} Rasmiy Imtihon`;
          const res = await ExamBulkImportService.importFullExamWithSections({
            title,
            level: newLevel,
            description: newDesc.trim() || undefined,
            questions: validQuestionsToImport,
            sourceName: sourceName.trim() || undefined,
            sourceUrl: sourceUrl.trim() || undefined,
            author: author.trim() || undefined,
            licenseType,
            copyrightConfirmed,
            isOfficialJlpt,
          });
          toast({
            title: 'Draft sifatida saqlandi',
            description: `${title} — ${res.totalInserted} ta savol yuklandi.${
              res.batchId ? ` Batch: ${res.batchId.slice(0, 8)}…` : ''
            } Publish qilish uchun review kerak.`,
          });
          onSuccess({ count: res.totalInserted, examId: res.examId });
          onClose();
        } else {
          if (!selectedExamId) throw new Error('Mavjud imtihon tanlanmadi.');
          const res = await ExamBulkImportService.importQuestionsToExistingExam(
            selectedExamId,
            validQuestionsToImport,
          );
          if (sourceName.trim() || author.trim() || licenseType !== 'original') {
            try {
              await ExamWorkflowService.updateExamSourceLicense(selectedExamId, {
                sourceName: sourceName.trim() || undefined,
                sourceUrl: sourceUrl.trim() || undefined,
                author: author.trim() || undefined,
                licenseType,
                copyrightConfirmed,
                isOfficialJlpt,
              });
            } catch (licenseErr) {
              console.warn('Failed to update exam license on existing exam:', licenseErr);
            }
          }
          toast({
            title: "Savollar draft sifatida qo'shildi",
            description: `${res.totalInserted} ta savol imtihonga qo'shildi.${
              res.batchId ? ` Batch: ${res.batchId.slice(0, 8)}…` : ''
            } Publish qilish uchun review kerak.`,
          });
          onSuccess({ count: res.totalInserted, examId: selectedExamId });
          onClose();
        }
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Import xatoligi',
        description: sanitizeImportError(err?.message || 'Saqlashda xatolik yuz berdi.'),
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-5"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Ommaviy Imtihon Importi &amp; Qat'iy Validatsiya
                </h3>
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {mode === 'section' ? "Bo'limga import" : 'To‘liq imtihon'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Jadval orqali ko‘rish, tahrirlash, real imtihon previewsi va draft/tasdiqlash
                {mode === 'section' && sectionTitle ? ` • ${sectionTitle}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Target Exam Config (when mode === 'full-exam') */}
          {mode === 'full-exam' && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Maqsadli Imtihon
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExamTargetType('create_new')}
                    className={
                      examTargetType === 'create_new'
                        ? 'rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-slate-900'
                        : 'rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }
                  >
                    Yangi imtihon yaratish
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamTargetType('existing')}
                    className={
                      examTargetType === 'existing'
                        ? 'rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-slate-900'
                        : 'rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }
                  >
                    Mavjud imtihonga qo‘shish
                  </button>
                </div>
              </div>
              {examTargetType === 'create_new' ? (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Imtihon nomi (masalan: JLPT N3 Rasmiy Mock 2026)"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <select
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value as JlptLevel)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-black text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      {(['N5', 'N4', 'N3', 'N2', 'N1'] as JlptLevel[]).map((lvl) => (
                        <option key={lvl} value={lvl}>
                          JLPT {lvl} Darajasi
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Qisqacha tavsif (ixtiyoriy: 500 Mon va Shin Kanzen asosida)"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {availableExams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title} ({ex.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Source & License Metadata Card (Task 7) */}
              <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-black text-indigo-900 dark:text-indigo-200">
                    <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Manba va Litsenziya Metadatalari (Source & License)
                  </span>
                  <span className="rounded-full bg-indigo-100/70 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    Mualliflik huquqi va attribution
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Manba nomi (Source Name)
                    </label>
                    <input
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="masalan: JLPT Speed Master, So-matome"
                      aria-label="Manba nomi (Source Name)"
                      className={`w-full rounded-xl border bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-white ${
                        isLegalFieldMissing('source_name')
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Manba URL havolasi (Source URL)
                    </label>
                    <input
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://example.com/material"
                      aria-label="Manba URL havolasi (Source URL)"
                      className={`w-full rounded-xl border bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-white ${
                        isLegalFieldMissing('source_url')
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Muallif / Tashkilot (Author)
                    </label>
                    <input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="masalan: Ask Publishing, Farhod"
                      aria-label="Muallif / Tashkilot (Author)"
                      className={`w-full rounded-xl border bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-white ${
                        isLegalFieldMissing('author')
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Litsenziya turi (License Type)
                    </label>
                    <select
                      value={licenseType}
                      onChange={(e) => setLicenseType(e.target.value as ExamLicenseType)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="original">
                        Original (Platforma / O'qituvchi muallifligi)
                      </option>
                      <option value="cc-by">Creative Commons Attribution (CC BY)</option>
                      <option value="cc-by-sa">
                        Creative Commons Attribution-ShareAlike (CC BY-SA)
                      </option>
                      <option value="public-domain">Ommaviy Mulk (Public Domain / CC0)</option>
                      <option value="restricted">
                        Cheklangan / Mualliflik huquqi bilan himoyalangan (Restricted ⚠️)
                      </option>
                    </select>
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      {LICENSE_CONFIG[licenseType]?.description}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isOfficialJlpt}
                        onChange={(e) => setIsOfficialJlpt(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Rasmiy JLPT Materiali (Official JEES / Japan Foundation)</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <input
                        type="checkbox"
                        checked={copyrightConfirmed}
                        onChange={(e) => setCopyrightConfirmed(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span
                        className={
                          copyrightConfirmed
                            ? 'font-extrabold text-emerald-700 dark:text-emerald-400'
                            : isLegalFieldMissing('copyright_confirmed')
                              ? 'font-extrabold text-red-600 dark:text-red-400'
                              : 'text-slate-700 dark:text-slate-300'
                        }
                      >
                        ✓ Mualliflik huquqi roziligi (Copyright confirmation)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Task 18: live legal / metadata checklist */}
                {blockingLegalGates.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Shield className="h-4 w-4 text-amber-600" />
                      Yetishmayotgan maydonlar (publishdan oldin to‘ldirilishi shart):
                    </div>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5">
                      {blockingLegalGates.map((gate) => (
                        <li key={gate.id}>
                          <b>{gate.label}:</b> {gate.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                    ✓ Huquqiy va metadata tekshiruvi to‘liq bajarilgan — import reviewga yuborishga
                    tayyor.
                  </div>
                )}

                {/* Restricted Warning */}
                {licenseType === 'restricted' && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>
                      <b>Diqqat (Restricted Material):</b> Ushbu material litsenziyasi cheklangan.
                      Nashr qilish to‘liq bloklanadi — aniq huquqiy ruxsat (legal approval) talab
                      qilinadi. Import faqat draft sifatida saqlanadi.
                    </span>
                  </div>
                )}

                {/* Official JLPT False Claim Warning */}
                {isOfficialJlpt &&
                  !validateJlptOfficialStatus({ isOfficialJlpt, sourceName }).isValid && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>
                        <b>Ogohlantirish:</b>{' '}
                        {validateJlptOfficialStatus({ isOfficialJlpt, sourceName }).error}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Upload & Input Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInputTab('file')}
                className={
                  inputTab === 'file'
                    ? 'rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }
              >
                Fayl yuklash (CSV / JSON / PDF)
              </button>
              <button
                type="button"
                onClick={() => setInputTab('text')}
                className={
                  inputTab === 'text'
                    ? 'rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }
              >
                Matn ko‘rinishida kiritish
              </button>
              <button
                type="button"
                onClick={() => setInputTab('ai')}
                className={
                  inputTab === 'ai'
                    ? 'rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm'
                    : 'rounded-xl bg-purple-50 px-4 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300'
                }
              >
                ✨ AI bilan ajratish (PDF / Matn)
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Qo‘llanma va talablar {showGuide ? '▲' : '▼'}
            </button>
          </div>

          {/* Guide Dropdown */}
          {showGuide && (
            <div className="space-y-2 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 text-xs text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200">
              <p className="font-bold">Qat'iy Validatsiya Talablari (Task 2, 3 &amp; 4):</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  <b>Majburiy maydonlar:</b> question_text, options (kamida 2 ta), correct_answer /
                  correct_index, level (N1..N5), section (knowledge, reading, listening).
                </li>
                <li>
                  <b>To'g'ri javob indeksi:</b> 0 yoki 1-based raqam, harf (A/B/C/D) yoki to'liq
                  javob matniga mos kelishi shart.
                </li>
                <li>
                  <b>AI bilan ajratish:</b> PDF yoki erkin formatdagi matndan savollar avtomatik
                  ajratiladi, daraja, bo'lim va qiyinlik tavsiya qilinadi va barchasi avtomatik
                  Draft holatida saqlanadi.
                </li>
              </ul>
            </div>
          )}

          {/* Input Area */}
          {inputTab === 'ai' ? (
            <div className="space-y-4 rounded-2xl border border-purple-200 bg-gradient-to-b from-purple-50/40 to-indigo-50/20 p-5 dark:border-purple-900/40 dark:bg-slate-900/60">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-3 dark:border-purple-900/30">
                <div>
                  <h4 className="flex items-center gap-1.5 text-sm font-black text-purple-950 dark:text-purple-200">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    AI Yordamida Savollarni Avtomatik Ajratish
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    PDF, TXT yoki nusxalangan matnni kiriting. AI savol, variantlar, javob, izoh va
                    darajani o'zi tavsiya qiladi.
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-white/80 p-1 shadow-sm dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setAiInputMode('text')}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      aiInputMode === 'text'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                    }`}
                  >
                    Matn (Copy-Paste)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiInputMode('file')}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      aiInputMode === 'file'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                    }`}
                  >
                    Fayl (PDF / TXT)
                  </button>
                </div>
              </div>

              {aiInputMode === 'text' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Imtihon yoki savollar matni:
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadAiDemoText}
                      className="text-[11px] font-bold text-purple-600 hover:underline dark:text-purple-400"
                    >
                      Namuna matnni yuklash
                    </button>
                  </div>
                  <textarea
                    value={aiSourceText}
                    onChange={(e) => setAiSourceText(e.target.value)}
                    rows={6}
                    placeholder="Savollar matnini bu yerga joylashtiring (masalan: 1. 彼女は＿＿服を着ている。 1) 派手な 2) 地味な 答え: 1)..."
                    className="w-full rounded-xl border border-purple-200 bg-white p-3 font-mono text-xs text-slate-900 focus:border-purple-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              ) : (
                <div
                  onClick={() => aiFileInputRef.current?.click()}
                  className="group cursor-pointer rounded-xl border-2 border-dashed border-purple-200 bg-white/70 p-6 text-center transition hover:border-purple-500 hover:bg-purple-50/50 dark:border-slate-700 dark:bg-slate-950/60"
                >
                  <input
                    ref={aiFileInputRef}
                    type="file"
                    accept=".pdf,.txt,application/pdf,text/plain"
                    onChange={handleAiFileSelect}
                    className="hidden"
                  />
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    PDF yoki TXT faylni tanlang yoki bu yerga bosing
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Maksimal hajm: 20 MB. O'qiladigan matnli PDF yoki .txt fayl
                  </p>
                  {aiSelectedFile && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      <FileText className="h-3.5 w-3.5" />
                      {aiSelectedFile.name} ({(aiSelectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Qo‘shimcha ko‘rsatma (ixtiyoriy):
                </label>
                <input
                  type="text"
                  value={aiCustomInstruction}
                  onChange={(e) => setAiCustomInstruction(e.target.value)}
                  placeholder="Masalan: 'Faqat N2 savollarini ajrat', 'Variantlar 4 tadan bo‘lsin'..."
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {aiError && (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div>
                      <p className="font-bold">Xatolik yuz berdi:</p>
                      <p className="mt-0.5">{aiError}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAiExtract()}
                    className="border-rose-300 bg-white text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-slate-900"
                  >
                    Qayta urinish
                  </Button>
                </div>
              )}

              {aiResult && (
                <div className="space-y-3 rounded-xl border border-purple-300 bg-purple-50/80 p-4 dark:border-purple-800 dark:bg-purple-950/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-200 px-2.5 py-1 text-xs font-black text-purple-900 dark:bg-purple-900 dark:text-purple-200">
                        <Sparkles className="h-3.5 w-3.5" /> AI: {aiResult.recommendedLevel}
                      </span>
                      <span className="inline-flex items-center rounded-lg bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-200">
                        Bo'lim: {aiResult.recommendedSection}
                      </span>
                      <span className="inline-flex items-center rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {aiResult.questions.length} ta savol
                      </span>
                      <span className="inline-flex items-center rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Draft (Qoralama)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isAiExtracting}
                        onClick={() => handleAiExtract()}
                        className="flex items-center gap-1.5 rounded-xl border-purple-300 bg-white text-xs font-bold text-purple-800 hover:bg-purple-100 dark:border-purple-700 dark:bg-slate-900 dark:text-purple-200"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Qayta ishlash
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className="rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-700"
                      >
                        Jadvalda tahrirlash
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-purple-950 dark:text-purple-200">{aiResult.summary}</p>
                </div>
              )}

              <Button
                type="button"
                disabled={
                  isAiExtracting ||
                  (aiInputMode === 'text' ? !aiSourceText.trim() : !aiSelectedFile)
                }
                onClick={() => handleAiExtract()}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-xs font-black text-white shadow-md hover:from-purple-700 hover:to-indigo-700"
              >
                {isAiExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI savollar, variantlar va javoblarni tahlil qilmoqda...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {aiResult ? 'Savollarni qayta ajratish' : 'AI bilan savollarni ajratish'}
                  </>
                )}
              </Button>
            </div>
          ) : inputTab === 'file' ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-indigo-500 hover:bg-indigo-50/20 dark:border-slate-700 dark:hover:border-indigo-500"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.txt,.pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:scale-105 dark:bg-indigo-950 dark:text-indigo-400">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                CSV, JSON yoki PDF faylni tanlang yoki bu yerga tortib tashlang
              </p>
              <p className="mt-1 text-xs text-slate-400">
                UTF-8 formatidagi .csv yoki .json fayllar qo‘llab-quvvatlanadi
              </p>
              {isParsingPdf && (
                <p className="mt-2 flex items-center justify-center gap-2 text-xs font-bold text-indigo-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> PDF o‘qilmoqda va savollar
                  ajratilmoqda...
                </p>
              )}
              {fileName && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                  {fileName} ({fileSizeStr})
                </div>
              )}
              {pdfWarnings.length > 0 && (
                <ul className="mx-auto mt-2 max-w-md list-disc space-y-0.5 text-left text-xs text-amber-700 dark:text-amber-300">
                  {pdfWarnings.slice(0, 5).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              rows={6}
              placeholder="CSV yoki JSON matnini bu yerga joylashtiring..."
              className="w-full rounded-2xl border border-slate-200 p-3 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          )}

          {/* Quick Demo Templates */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Namunalar:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleLoadDemo('csv')}
                className="rounded-xl text-xs font-bold"
              >
                CSV Namuna
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleLoadDemo('json')}
                className="rounded-xl text-xs font-bold"
              >
                JSON Namuna
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Format:</span>
              <select
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value as 'auto' | 'json' | 'csv')}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <option value="auto">Auto-detect</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>

          {/* Validation & Preview Engine */}
          {validationResult && (
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/60">
              {/* Metrics & Mode Switcher Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {/* Metric Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Jami: {validationResult.totalCount}
                  </span>
                  <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                    ✓ Importga yaroqli: {validationResult.validCount}
                  </span>
                  <span className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300">
                    ★ Muvaffaqiyatli: {validationResult.successfulCount}
                  </span>
                  {validationResult.errorCount > 0 && (
                    <span className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                      ✗ Xatolik: {validationResult.errorCount}
                    </span>
                  )}
                  {validationResult.warningCount > 0 && (
                    <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                      ⚠ Ogohlantirish: {validationResult.warningCount}
                    </span>
                  )}
                  {validationResult.duplicateCount > 0 && (
                    <span className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950/50 dark:text-fuchsia-300">
                      ⧉ Duplikat: {validationResult.duplicateCount}
                      {validationResult.similarCount > 0 &&
                        ` (${validationResult.similarCount} o'xshash)`}
                    </span>
                  )}
                  {validationResult.passageDuplicateCount > 0 && (
                    <span className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300">
                      ⧉ Passage takrori: {validationResult.passageDuplicateCount}
                    </span>
                  )}
                  {deletedRows.size > 0 && (
                    <span className="rounded-lg bg-slate-200 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      O'chirilgan: {deletedRows.size}
                    </span>
                  )}
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                      viewMode === 'table'
                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <Table2 className="h-3.5 w-3.5" /> Savollar Jadvali
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                      viewMode === 'preview'
                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" /> Real Imtihon Preview
                  </button>
                </div>
              </div>

              {/* Blocking Warning Banner */}
              {hasBlockingErrors && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>
                    <b>Diqqat:</b> {validationResult.errorCount} ta savolda validatsiya xatoligi
                    aniqlandi. Imtihonni tasdiqlash uchun xato savollarni jadval orqali{' '}
                    <b>qayta tuzating</b> yoki <b>o'chiring</b>.
                  </span>
                </div>
              )}

              {/* VIEW 1: SAVOLLAR JADVALI (Table View) */}
              {viewMode === 'table' && (
                <div className="space-y-3">
                  {/* Table Filter Tabs & Search */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-800">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveFilter('all')}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                          activeFilter === 'all'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400'
                        }`}
                      >
                        Barchasi ({validationResult.totalCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFilter('valid')}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                          activeFilter === 'valid'
                            ? 'bg-emerald-600 text-white'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        Muvaffaqiyatli ({validationResult.successfulCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFilter('duplicates')}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                          activeFilter === 'duplicates'
                            ? 'bg-fuchsia-600 text-white'
                            : 'text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/30'
                        }`}
                      >
                        Duplikatlar ({validationResult.duplicateCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFilter('errors')}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                          activeFilter === 'errors'
                            ? 'bg-rose-600 text-white'
                            : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                        }`}
                      >
                        Xatolar ({validationResult.errorCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFilter('warnings')}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                          activeFilter === 'warnings'
                            ? 'bg-amber-600 text-white'
                            : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        }`}
                      >
                        Ogoh ({validationResult.warningCount})
                      </button>
                      {deletedRows.size > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveFilter('deleted')}
                          className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                            activeFilter === 'deleted'
                              ? 'bg-slate-700 text-white'
                              : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          O'chirilgan ({deletedRows.size})
                        </button>
                      )}
                    </div>

                    {/* Search Bar */}
                    <div className="relative min-w-[220px]">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Savol yoki variant qidirish..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* HTML TABLE CONTAINER */}
                  <div className="max-h-[440px] overflow-x-auto overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-inner dark:border-slate-800 dark:bg-slate-900">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <tr>
                          <th className="w-10 px-3 py-2.5 text-center">#</th>
                          <th className="w-28 px-3 py-2.5">Holat</th>
                          <th className="w-32 px-3 py-2.5">Bo‘lim / Daraja</th>
                          <th className="min-w-[280px] px-3 py-2.5">Savol va Passage</th>
                          <th className="min-w-[240px] px-3 py-2.5">
                            Variantlar &amp; To‘g‘ri Javob
                          </th>
                          <th className="min-w-[140px] px-3 py-2.5">Izoh</th>
                          <th className="w-28 px-3 py-2.5 text-right">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                              Savollar topilmadi.
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map((item) => {
                            const isDel = deletedRows.has(item.row);
                            const isEd = editingRow === item.row;
                            const v = item.validated;
                            const raw = item.raw;
                            const hasPassage = Boolean(
                              v?.passage || raw.passage || raw.reading_passage || raw.text,
                            );
                            const isExpandedPassage = expandedPassages.has(item.row);
                            const passageText =
                              v?.passage || raw.passage || raw.reading_passage || raw.text || '';

                            return (
                              <React.Fragment key={item.row}>
                                <tr
                                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                                    isDel ? 'bg-slate-100/60 opacity-60 dark:bg-slate-900/60' : ''
                                  } ${item.status === 'error' && !isDel ? 'bg-rose-50/20' : ''}`}
                                >
                                  {/* # Row */}
                                  <td className="px-3 py-3 text-center font-mono font-bold text-slate-500">
                                    {item.row}
                                  </td>

                                  {/* Holat Badge */}
                                  <td className="px-3 py-3">
                                    {isDel ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        O'chirilgan
                                      </span>
                                    ) : item.status === 'valid' ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                        <Check className="h-3 w-3" /> To'g'ri
                                      </span>
                                    ) : item.status === 'warning' ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                        <AlertTriangle className="h-3 w-3" /> Ogoh
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                        <X className="h-3 w-3" /> Xatolik
                                      </span>
                                    )}
                                  </td>

                                  {/* Section & Level */}
                                  <td className="px-3 py-3">
                                    <div className="flex flex-col gap-1">
                                      <span className="inline-block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                        {v?.section_type === 'reading'
                                          ? "📖 O'qish (読解)"
                                          : v?.section_type === 'listening'
                                            ? '🎧 Tinglash (聴解)'
                                            : '📚 Lug‘at / Qoida'}
                                      </span>
                                      <span className="inline-flex w-fit rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        JLPT {v?.level || raw.level || newLevel}
                                      </span>
                                      {Boolean(v?.difficulty || raw.difficulty) && (
                                        <span
                                          className={`inline-flex w-fit rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                            (v?.difficulty || raw.difficulty) === 'hard'
                                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                              : (v?.difficulty || raw.difficulty) === 'easy'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                          }`}
                                        >
                                          {v?.difficulty || raw.difficulty}
                                        </span>
                                      )}
                                      {Boolean(v?.question_type || raw.question_type) && (
                                        <span className="text-[10px] text-slate-500">
                                          {v?.question_type || raw.question_type}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Question Text & Passage Toggle */}
                                  <td className="px-3 py-3">
                                    <div className="space-y-1">
                                      <p className="font-bold leading-relaxed text-slate-900 dark:text-white">
                                        {v?.question_text || raw.question || raw.question_text || (
                                          <span className="italic text-rose-500">
                                            (Savol matni kiritilmagan)
                                          </span>
                                        )}
                                      </p>
                                      {hasPassage && (
                                        <div>
                                          <button
                                            type="button"
                                            onClick={() => togglePassageExpand(item.row)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                                          >
                                            <BookOpen className="h-3 w-3" />
                                            {isExpandedPassage
                                              ? 'Matnni yopish ▲'
                                              : 'Passage (Matn) ▼'}
                                          </button>
                                          {isExpandedPassage && (
                                            <div className="mt-1.5 whitespace-pre-wrap rounded-xl border border-amber-200/80 bg-amber-50/50 p-2.5 font-serif text-xs leading-relaxed text-slate-800 shadow-sm dark:border-amber-900/40 dark:bg-slate-900 dark:text-slate-200">
                                              {passageText}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {/* Specific Issues */}
                                      {item.issues.map((iss, ki) => (
                                        <p
                                          key={ki}
                                          className="text-[11px] font-bold text-rose-600 dark:text-rose-400"
                                        >
                                          [{iss.field}]: {iss.message}
                                        </p>
                                      ))}
                                    </div>
                                  </td>

                                  {/* Options and Correct Answer Pill */}
                                  <td className="px-3 py-3">
                                    <div className="flex flex-wrap gap-1.5">
                                      {(
                                        v?.options ||
                                        (Array.isArray(raw.options)
                                          ? raw.options
                                          : [
                                              raw.option_a,
                                              raw.option_b,
                                              raw.option_c,
                                              raw.option_d,
                                            ])
                                      )
                                        .filter(Boolean)
                                        .map((opt: any, oi: number) => {
                                          const isCorrect = v
                                            ? oi === v.correct_index
                                            : String(opt) ===
                                              String(raw.correct_answer || raw.correctAnswer);
                                          return (
                                            <span
                                              key={oi}
                                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] ${
                                                isCorrect
                                                  ? 'border border-emerald-500 bg-emerald-50 font-black text-emerald-800 shadow-sm dark:bg-emerald-950 dark:text-emerald-300'
                                                  : 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                              }`}
                                            >
                                              <span className="font-mono text-[10px] font-bold">
                                                {String.fromCharCode(65 + oi)})
                                              </span>
                                              <span>{String(opt)}</span>
                                              {isCorrect && (
                                                <Check className="h-3 w-3 text-emerald-600" />
                                              )}
                                            </span>
                                          );
                                        })}
                                    </div>
                                  </td>

                                  {/* Explanation */}
                                  <td className="px-3 py-3 text-[11px] italic text-slate-500 dark:text-slate-400">
                                    {v?.explanation || raw.explanation || '—'}
                                  </td>

                                  {/* Actions */}
                                  <td className="px-3 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      {isDel ? (
                                        <button
                                          type="button"
                                          onClick={() => restoreRow(item.row)}
                                          title="Qayta tiklash"
                                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        >
                                          <RotateCcw className="h-3 w-3" /> Qaytarish
                                        </button>
                                      ) : isEd ? (
                                        <span className="text-[10px] font-bold text-indigo-600">
                                          Tahrirlanmoqda
                                        </span>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => startEditing(item.row)}
                                            title="Savolni tahrirlash yoki qayta tuzatish"
                                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
                                              item.status === 'error'
                                                ? 'border-rose-400 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                            }`}
                                          >
                                            <Edit3 className="h-3 w-3" />
                                            {item.status === 'error'
                                              ? 'Qayta tuzatish'
                                              : 'Tahrirlash'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => deleteRow(item.row)}
                                            title="O'chirish"
                                            className="inline-flex items-center rounded-lg border border-slate-200 p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:bg-rose-950/40"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* INLINE EDIT DRAWER ROW */}
                                {isEd && editDraft && (
                                  <tr className="bg-indigo-50/40 dark:bg-indigo-950/20">
                                    <td colSpan={7} className="p-4">
                                      <div className="space-y-3 rounded-2xl border border-indigo-200 bg-white p-4 shadow-md dark:border-indigo-900 dark:bg-slate-900">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                            #{item.row}-savolni tahrirlash va qayta tuzatish
                                          </span>
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              onClick={() => saveEditing(item.row)}
                                              className="h-8 gap-1.5 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-500"
                                            >
                                              <Save className="h-3.5 w-3.5" /> Saqlash va Qayta
                                              tekshirish
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={cancelEditing}
                                              className="h-8 rounded-xl font-bold"
                                            >
                                              Bekor qilish
                                            </Button>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                          <div>
                                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                              Savol matni *
                                            </label>
                                            <textarea
                                              value={editDraft.question_text}
                                              onChange={(e) =>
                                                setEditDraft({
                                                  ...editDraft,
                                                  question_text: e.target.value,
                                                })
                                              }
                                              rows={2}
                                              className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                              placeholder="Savol matnini kiriting..."
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                              Passage (Reading / Matn - ixtiyoriy)
                                            </label>
                                            <textarea
                                              value={editDraft.passage}
                                              onChange={(e) =>
                                                setEditDraft({
                                                  ...editDraft,
                                                  passage: e.target.value,
                                                })
                                              }
                                              rows={2}
                                              className="mt-1 w-full rounded-xl border border-slate-200 p-2 font-serif text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                              placeholder="O'qish matni (passage)..."
                                            />
                                          </div>
                                        </div>

                                        {/* Section and Level dropdowns */}
                                        <div className="flex flex-wrap items-center gap-3">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                              Bo‘lim:
                                            </span>
                                            <select
                                              value={editDraft.section_type}
                                              onChange={(e) =>
                                                setEditDraft({
                                                  ...editDraft,
                                                  section_type: e.target.value,
                                                })
                                              }
                                              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-950"
                                            >
                                              <option value="knowledge">
                                                knowledge (Til bilimi / Grammatika)
                                              </option>
                                              <option value="reading">
                                                reading (O‘qish / Dokkai)
                                              </option>
                                              <option value="listening">
                                                listening (Tinglash / Choukai)
                                              </option>
                                            </select>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                              Daraja:
                                            </span>
                                            <select
                                              value={editDraft.level}
                                              onChange={(e) =>
                                                setEditDraft({
                                                  ...editDraft,
                                                  level: e.target.value as JlptLevel,
                                                })
                                              }
                                              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-black dark:border-slate-700 dark:bg-slate-950"
                                            >
                                              {(['N5', 'N4', 'N3', 'N2', 'N1'] as JlptLevel[]).map(
                                                (lvl) => (
                                                  <option key={lvl} value={lvl}>
                                                    JLPT {lvl}
                                                  </option>
                                                ),
                                              )}
                                            </select>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                              Qiyinlik:
                                            </span>
                                            <select
                                              value={editDraft.difficulty || 'medium'}
                                              onChange={(e) =>
                                                setEditDraft({
                                                  ...editDraft,
                                                  difficulty: e.target.value as any,
                                                })
                                              }
                                              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-black dark:border-slate-700 dark:bg-slate-950"
                                            >
                                              <option value="easy">easy (Oson)</option>
                                              <option value="medium">medium (O‘rtacha)</option>
                                              <option value="hard">hard (Qiyin)</option>
                                            </select>
                                          </div>
                                        </div>

                                        {/* Options Editor */}
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                              Variantlar (To‘g‘ri javobni tanlash uchun harf ustiga
                                              bosing):
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setEditDraft({
                                                  ...editDraft,
                                                  options: [...editDraft.options, ''],
                                                })
                                              }
                                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
                                            >
                                              <Plus className="h-3 w-3" /> Variant qo‘shish
                                            </button>
                                          </div>
                                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {editDraft.options.map((opt, oi) => {
                                              const isCorrect = editDraft.correct_index === oi;
                                              return (
                                                <div
                                                  key={oi}
                                                  className={`flex items-center gap-2 rounded-xl border p-1.5 transition ${
                                                    isCorrect
                                                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                                                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950'
                                                  }`}
                                                >
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setEditDraft({
                                                        ...editDraft,
                                                        correct_index: oi,
                                                      })
                                                    }
                                                    title="To'g'ri javob sifatida belgilash"
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black transition ${
                                                      isCorrect
                                                        ? 'bg-emerald-600 text-white shadow-sm'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                                  >
                                                    {String.fromCharCode(65 + oi)}
                                                  </button>
                                                  <input
                                                    value={opt}
                                                    onChange={(e) => {
                                                      const n = [...editDraft.options];
                                                      n[oi] = e.target.value;
                                                      setEditDraft({ ...editDraft, options: n });
                                                    }}
                                                    placeholder={`${String.fromCharCode(65 + oi)} varianti`}
                                                    className="w-full bg-transparent text-xs font-medium text-slate-900 focus:outline-none dark:text-white"
                                                  />
                                                  {editDraft.options.length > 2 && (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const n = editDraft.options.filter(
                                                          (_, idx) => idx !== oi,
                                                        );
                                                        const nextIdx = Math.min(
                                                          editDraft.correct_index,
                                                          n.length - 1,
                                                        );
                                                        setEditDraft({
                                                          ...editDraft,
                                                          options: n,
                                                          correct_index: nextIdx,
                                                        });
                                                      }}
                                                      className="p-1 text-slate-400 hover:text-rose-500"
                                                    >
                                                      <Trash2 className="h-3 w-3" />
                                                    </button>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* Explanation */}
                                        <div>
                                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                            Izoh / Tushuntirish (Explanation)
                                          </label>
                                          <textarea
                                            value={editDraft.explanation}
                                            onChange={(e) =>
                                              setEditDraft({
                                                ...editDraft,
                                                explanation: e.target.value,
                                              })
                                            }
                                            rows={2}
                                            className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                            placeholder="To'g'ri javob sababi va qoidasi..."
                                          />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 2: REAL IMTIHON PREVIEW (Official JLPT Exam Look & Feel) */}
              {viewMode === 'preview' && (
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  {/* Real Exam Header Widget */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-sm font-black text-white shadow-md">
                        JLPT
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {mode === 'section'
                              ? sectionTitle || 'JLPT Mock Test'
                              : newTitle || `JLPT ${newLevel} Rasmiy Imtihon`}
                          </h4>
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {newLevel || examLevel} Darajasi
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Haqiqiy talaba ko‘rinishi • Jami: {validQuestionsToImport.length} ta savol
                        </p>
                      </div>
                    </div>

                    {/* Simulated Timer and Actions */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Clock className="h-3.5 w-3.5 text-indigo-600" />
                        <span>01:45:00</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCorrectInPreview(!showCorrectInPreview)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                          showCorrectInPreview
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {showCorrectInPreview
                          ? '✓ Javoblar ko‘rsatilgan'
                          : 'To‘g‘ri javoblarni ko‘rsatish'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSimulated(true);
                        }}
                        className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-indigo-500"
                      >
                        Natijani hisoblash (Simulyatsiya)
                      </button>
                    </div>
                  </div>

                  {/* Section Filters */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewSectionFilter('all')}
                        className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                          previewSectionFilter === 'all'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        Barchasi ({validQuestionsToImport.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewSectionFilter('knowledge')}
                        className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                          previewSectionFilter === 'knowledge'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        📚 Til bilimi
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewSectionFilter('reading')}
                        className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                          previewSectionFilter === 'reading'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        📖 O‘qish (読解)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewSectionFilter('listening')}
                        className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                          previewSectionFilter === 'listening'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        🎧 Tinglash (聴解)
                      </button>
                    </div>

                    <div className="text-xs font-bold text-slate-500">
                      Belgilandi: {Object.keys(previewAnswers).length} /{' '}
                      {validQuestionsToImport.length}
                    </div>
                  </div>

                  {/* Simulation Score Result Banner */}
                  {simulationResults && (
                    <div
                      className={`flex items-center justify-between rounded-2xl border p-4 transition-all duration-300 ${
                        simulationResults.isPassed
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                          : 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Award className="h-6 w-6 text-emerald-600" />
                        <div>
                          <p className="text-sm font-black">
                            Simulyatsiya Natijasi: {simulationResults.score} /{' '}
                            {simulationResults.total} to‘g‘ri ({simulationResults.percentage}%)
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {simulationResults.isPassed
                              ? "Ajoyib! O'tish bali (60%) muvaffaqiyatli zabt etildi."
                              : "Qayta urinib ko'ring, to'g'ri javoblarni tahlil qiling."}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewAnswers({});
                          setIsSimulated(false);
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        Qayta boshlash
                      </button>
                    </div>
                  )}

                  {/* Questions List */}
                  <div className="max-h-[500px] space-y-6 overflow-y-auto pr-1">
                    {previewQuestions.length === 0 ? (
                      <p className="py-12 text-center text-xs text-slate-400">
                        Ushbu bo‘lim bo‘yicha yaroqli savol yo‘q.
                      </p>
                    ) : (
                      previewQuestions.map((q, qIndex) => {
                        const originalRow =
                          validationResult?.items.find((it) => it.validated === q)?.row ?? qIndex;
                        const userSelectedIdx = previewAnswers[originalRow];

                        return (
                          <div
                            key={originalRow}
                            className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition dark:border-slate-800 dark:bg-slate-900/60"
                          >
                            <div className="flex items-center justify-between">
                              <span className="rounded-lg bg-slate-200 px-2 py-0.5 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                第 {qIndex + 1} 問 ({qIndex + 1}-savol)
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">
                                {q.section_type === 'reading'
                                  ? '読解 (Reading)'
                                  : q.section_type === 'listening'
                                    ? '聴解 (Listening)'
                                    : '言語知識 (Knowledge)'}
                              </span>
                            </div>

                            {/* Question Prompt */}
                            <p className="text-sm font-bold leading-relaxed text-slate-900 dark:text-white">
                              {q.question_text}
                            </p>

                            <JlptQuestionPreview
                              question={{
                                ...q,
                                passage: q.passage,
                                question_payload: q.question_payload,
                              }}
                              sectionType={q.section_type}
                              selectedIndex={userSelectedIdx}
                              showAnswer={showCorrectInPreview || isSimulated}
                              onSelect={(optIdx) =>
                                setPreviewAnswers((prev) => ({
                                  ...prev,
                                  [originalRow]: optIdx,
                                }))
                              }
                            />

                            {/* Explanation Card */}
                            {(showCorrectInPreview || isSimulated) && q.explanation && (
                              <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                                <b>💡 Izoh va Qoida:</b> {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer — draft-only save (Task 17: no publish button here) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <Button variant="outline" onClick={onClose} className="rounded-xl font-bold">
            Bekor Qilish
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {importProgress && (
              <span className="mr-2 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <Loader2 className="h-4 w-4 animate-spin" /> {importProgress}
              </span>
            )}

            <span className="mr-1 hidden max-w-[22rem] text-xs text-slate-500 dark:text-slate-400 sm:block">
              {publishHint}
            </span>

            {hasBlockingErrors && (
              <span className="mr-1 text-xs font-bold text-red-600 dark:text-red-400">
                Xatolarni tuzating ({validationResult?.errorCount})
              </span>
            )}

            {/* DRAFT SAQLASH TUGMASI — import hech qachon publish qilmaydi */}
            <Button
              variant="outline"
              onClick={() => handleExecuteImport()}
              disabled={
                isImporting || !validationResult || confirmableCount === 0 || hasBlockingErrors
              }
              className="gap-2 rounded-2xl border-slate-300 font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              )}
              Draft sifatida saqlash ({confirmableCount})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
