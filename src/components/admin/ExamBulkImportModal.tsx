import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Upload, X, Loader2, Eye, Table2, Save, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from '../../hooks/use-toast';
import {
  ExamBulkImportService,
  JlptLevel,
  BulkValidationResult,
  ValidatedQuestion,
} from '../../services/ExamBulkImportService';
import { sanitizeErrorMessage } from '../ErrorBoundary';

export interface ExamBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: { count: number; examId?: string }) => void;
  mode: 'section' | 'full-exam';
  sectionId?: string;
  sectionTitle?: string;
  examLevel?: JlptLevel | null;
  existingQuestions?: Array<{ question_text?: string }>;
  examId?: string;
  availableExams?: Array<{ id: string; title: string; type: string }>;
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
  examId,
  availableExams = [],
}) => {
  const [inputTab, setInputTab] = useState<'file' | 'text'>('file');
  const [fileFormat, setFileFormat] = useState<'auto' | 'json' | 'csv'>('auto');
  const [rawContent, setRawContent] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'errors' | 'warnings' | 'valid'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'preview'>('table');
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{
    question_text: string;
    passage: string;
    options: string[];
    correct_index: number;
    explanation: string;
  } | null>(null);
  const [deletedRows, setDeletedRows] = useState<Set<number>>(new Set());
  const [overrides, setOverrides] = useState<Record<number, ValidatedQuestion>>({});
  const [previewAnswers, setPreviewAnswers] = useState<Record<number, number>>({});
  const [showCorrectInPreview, setShowCorrectInPreview] = useState<boolean>(false);
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
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRawContent('');
      setFileName(null);
      setFileSizeStr(null);
      setActiveFilter('all');
      setIsImporting(false);
      setImportProgress(null);
      setViewMode('table');
      setEditingRow(null);
      setEditDraft(null);
      setDeletedRows(new Set());
      setOverrides({});
      setPreviewAnswers({});
      setShowCorrectInPreview(false);
      if (examId) setSelectedExamId(examId);
      if (examLevel) setNewLevel(examLevel);
    }
  }, [isOpen, examId, examLevel]);

  const baseValidation: BulkValidationResult | null = useMemo(() => {
    if (!rawContent.trim()) return null;
    return ExamBulkImportService.parseAndValidate(rawContent, fileFormat, {
      defaultLevel: mode === 'section' ? examLevel || undefined : newLevel,
      existingQuestions,
      checkIntraBatchDuplicates: true,
    });
  }, [rawContent, fileFormat, mode, examLevel, newLevel, existingQuestions]);

  const validationResult: BulkValidationResult | null = useMemo(() => {
    if (!baseValidation) return null;
    if (Object.keys(overrides).length === 0) return baseValidation;
    const mergedItems = baseValidation.items.map((item) => {
      const ov = overrides[item.row];
      if (ov && item.validated) return { ...item, validated: { ...ov } };
      return item;
    });
    return ExamBulkImportService.revalidateEditedItems(mergedItems, {
      expectedLevel: mode === 'section' ? examLevel || undefined : newLevel,
      existingQuestions,
    });
  }, [baseValidation, overrides, mode, examLevel, newLevel, existingQuestions]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadDroppedFile(file);
  };

  const loadDroppedFile = (file: File) => {
    setFileName(file.name);
    setFileSizeStr((file.size / 1024).toFixed(1) + ' KB');
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) loadDroppedFile(e.dataTransfer.files[0]);
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

  const filteredItems = useMemo(() => {
    if (!validationResult) return [];
    switch (activeFilter) {
      case 'errors':
        return validationResult.items.filter((it) => it.status === 'error');
      case 'warnings':
        return validationResult.items.filter((it) => it.status === 'warning');
      case 'valid':
        return validationResult.items.filter((it) => it.status === 'valid');
      default:
        return validationResult.items;
    }
  }, [validationResult, activeFilter]);

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

  const startEditing = (row: number) => {
    const item = validationResult?.items.find((i) => i.row === row);
    const v = item?.validated;
    if (!v) {
      toast({
        variant: 'destructive',
        title: 'Tahrirlab bolmaydi',
        description: 'Valid savol yoq.',
      });
      return;
    }
    setEditingRow(row);
    setEditDraft({
      question_text: v.question_text,
      passage: v.passage || '',
      options: [...v.options],
      correct_index: v.correct_index,
      explanation: v.explanation || '',
    });
  };
  const cancelEditing = () => {
    setEditingRow(null);
    setEditDraft(null);
  };
  const saveEditing = (row: number) => {
    if (!editDraft) return;
    const qText = editDraft.question_text.trim();
    const opts = editDraft.options.map((o) => o.trim()).filter(Boolean);
    if (qText.length < 3) {
      toast({ variant: 'destructive', title: 'Savol qisqa', description: 'Kamida 3 belgi.' });
      return;
    }
    if (opts.length < 2) {
      toast({ variant: 'destructive', title: 'Variant kam', description: 'Kamida 2 ta.' });
      return;
    }
    const safeIndex = Math.min(Math.max(editDraft.correct_index, 0), opts.length - 1);
    const item = validationResult?.items.find((i) => i.row === row);
    const prev = item?.validated;
    if (!prev) return;
    const updated: ValidatedQuestion = {
      ...prev,
      question_text: qText,
      passage: editDraft.passage.trim() || null,
      options: opts,
      correct_index: safeIndex,
      correct_answer: opts[safeIndex],
      explanation: editDraft.explanation.trim() || null,
    };
    setOverrides((pr) => ({ ...pr, [row]: updated }));
    setEditingRow(null);
    setEditDraft(null);
    toast({ title: 'Savol yangilandi', description: row + '-qator qayta tekshirildi.' });
  };
  const deleteRow = (row: number) => {
    setDeletedRows((prev) => new Set(prev).add(row));
    if (editingRow === row) cancelEditing();
  };
  const restoreRow = (row: number) => {
    setDeletedRows((prev) => {
      const n = new Set(prev);
      n.delete(row);
      return n;
    });
  };

  const handleExecuteImport = async (publish: boolean) => {
    if (validQuestionsToImport.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Import bolmaydi',
        description: 'Kamida 1 ta valid savol kerak!',
      });
      return;
    }
    if (publish && hasBlockingErrors) {
      toast({
        variant: 'destructive',
        title: 'Tasdiqlab bolmaydi',
        description: 'Xatoli savollarni tahrirlang yoki ochiring.',
      });
      return;
    }
    setIsImporting(true);
    setImportProgress(publish ? 'Tasdiqlanmoqda...' : 'Draft saqlanmoqda...');
    try {
      if (mode === 'section') {
        if (!sectionId) throw new Error('Bolim topilmadi.');
        const res = await ExamBulkImportService.importQuestionsToSection(
          sectionId,
          validQuestionsToImport,
        );
        toast({
          title: publish ? 'Tasdiqlandi' : 'Draft saqlandi',
          description: res.insertedCount + ' ta savol.',
        });
        onSuccess({ count: res.insertedCount });
        onClose();
      } else {
        if (examTargetType === 'create_new') {
          const title = newTitle.trim() || 'JLPT ' + newLevel + ' Yangi Imtihon';
          const res = await ExamBulkImportService.importFullExamWithSections({
            title,
            level: newLevel,
            description: newDesc.trim() || undefined,
            questions: validQuestionsToImport,
            isPublished: publish,
          });
          toast({
            title: publish ? 'Imtihon tasdiqlandi' : 'Draft saqlandi',
            description: title + ' — ' + res.totalInserted + ' ta savol.',
          });
          onSuccess({ count: res.totalInserted, examId: res.examId });
          onClose();
        } else {
          if (!selectedExamId) throw new Error('Imtihon tanlang.');
          const res = await ExamBulkImportService.importQuestionsToExistingExam(
            selectedExamId,
            validQuestionsToImport,
          );
          toast({
            title: publish ? 'Tasdiqlandi' : 'Draft qoshildi',
            description: res.totalInserted + ' ta savol.',
          });
          onSuccess({ count: res.totalInserted, examId: selectedExamId });
          onClose();
        }
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Import xatoligi',
        description: sanitizeErrorMessage(err?.message || 'Xatolik.'),
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
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black">Ommaviy Savollar Importi</h3>
              <p className="text-xs text-slate-500">
                Preview + tahrirlash + draft/tasdiqlash
                {mode === 'section' && sectionTitle ? ' • ' + sectionTitle : ''}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {mode === 'full-exam' && (
            <div className="space-y-3 rounded-2xl border p-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExamTargetType('create_new')}
                  className={
                    examTargetType === 'create_new'
                      ? 'rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white'
                      : 'rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold'
                  }
                >
                  Yangi imtihon
                </button>
                <button
                  type="button"
                  onClick={() => setExamTargetType('existing')}
                  className={
                    examTargetType === 'existing'
                      ? 'rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white'
                      : 'rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold'
                  }
                >
                  Mavjud imtihon
                </button>
              </div>
              {examTargetType === 'create_new' ? (
                <div className="grid gap-2">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Imtihon nomi"
                    className="rounded-xl border p-2 text-xs"
                  />
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as JlptLevel)}
                    className="rounded-xl border p-2 text-xs font-bold"
                  >
                    {(['N5', 'N4', 'N3', 'N2', 'N1'] as JlptLevel[]).map((lvl) => (
                      <option key={lvl} value={lvl}>
                        JLPT {lvl}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Tavsif (ixtiyoriy)"
                    className="rounded-xl border p-2 text-xs"
                  />
                </div>
              ) : (
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full rounded-xl border p-2 text-xs font-bold"
                >
                  {availableExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.type})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInputTab('file')}
                className={
                  inputTab === 'file'
                    ? 'rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white'
                    : 'rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold'
                }
              >
                Fayl
              </button>
              <button
                type="button"
                onClick={() => setInputTab('text')}
                className={
                  inputTab === 'text'
                    ? 'rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white'
                    : 'rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold'
                }
              >
                Matn
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs font-bold text-indigo-600"
            >
              Qollanma {showGuide ? '▲' : '▼'}
            </button>
          </div>
          {inputTab === 'file' ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-sm font-bold">CSV / JSON fayl tanlang</p>
              {fileName && (
                <p className="text-xs text-slate-500">
                  {fileName} ({fileSizeStr})
                </p>
              )}
            </div>
          ) : (
            <textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              rows={6}
              placeholder="CSV yoki JSON matnni joylashtiring..."
              className="w-full rounded-2xl border p-3 font-mono text-xs"
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => handleLoadDemo('csv')}>
              CSV namuna
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleLoadDemo('json')}>
              JSON namuna
            </Button>
            <select
              value={fileFormat}
              onChange={(e) => setFileFormat(e.target.value as 'auto' | 'json' | 'csv')}
              className="rounded-xl border p-1.5 text-xs font-bold"
            >
              <option value="auto">Auto</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
          {validationResult && (
            <div className="space-y-3 rounded-2xl border bg-slate-50/80 p-4">
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span>Jami: {validationResult.totalCount}</span>
                <span className="text-emerald-600">Togri: {validationResult.validCount}</span>
                {validationResult.errorCount > 0 && (
                  <span className="text-rose-600">Xato: {validationResult.errorCount}</span>
                )}
                {validationResult.warningCount > 0 && (
                  <span className="text-amber-600">Ogoh: {validationResult.warningCount}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={
                      viewMode === 'table'
                        ? 'rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white'
                        : 'rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500'
                    }
                  >
                    <span className="flex items-center gap-1">
                      <Table2 className="h-3.5 w-3.5" /> Jadval
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className={
                      viewMode === 'preview'
                        ? 'rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white'
                        : 'rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500'
                    }
                  >
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-500">
                  Tasdiqlanadi: <b className="text-emerald-600">{confirmableCount}</b>
                  {deletedRows.size > 0 ? ' • Ochirilgan: ' + deletedRows.size : ''}
                </div>
              </div>
              <div className="flex gap-2 border-b pb-2">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className="rounded-lg px-3 py-1 text-xs font-bold"
                >
                  Barchasi ({validationResult.totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('errors')}
                  className="rounded-lg px-3 py-1 text-xs font-bold text-rose-600"
                >
                  Xatolar ({validationResult.errorCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('warnings')}
                  className="rounded-lg px-3 py-1 text-xs font-bold text-amber-600"
                >
                  Ogoh ({validationResult.warningCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('valid')}
                  className="rounded-lg px-3 py-1 text-xs font-bold text-emerald-600"
                >
                  Togri ({validationResult.validCount})
                </button>
              </div>
              {viewMode === 'table' ? (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {filteredItems.length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-400">Savollar yoq.</p>
                  )}
                  {filteredItems.map((item) => {
                    const isDel = deletedRows.has(item.row);
                    const isEd = editingRow === item.row;
                    const v = item.validated;
                    return (
                      <div
                        key={item.row}
                        className={
                          isDel
                            ? 'rounded-2xl border bg-slate-100 p-3 opacity-60'
                            : 'rounded-2xl border bg-white p-3'
                        }
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-[11px] font-bold text-slate-500">
                            #{item.row} • {item.status}
                            {isDel ? ' • ochirilgan' : ''}
                            {v?.passage ? ' • passage bor' : ''}
                          </div>
                          <div className="flex gap-1">
                            {isDel ? (
                              <button
                                type="button"
                                onClick={() => restoreRow(item.row)}
                                className="rounded-lg border px-2 py-1 text-[10px] font-bold"
                              >
                                Qaytarish
                              </button>
                            ) : isEd ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => saveEditing(item.row)}
                                  className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white"
                                >
                                  Saqlash
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  className="rounded-lg border px-2 py-1 text-[10px] font-bold"
                                >
                                  Bekor
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditing(item.row)}
                                  disabled={!v}
                                  className="rounded-lg border px-2 py-1 text-[10px] font-bold"
                                >
                                  Tahrirlash
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteRow(item.row)}
                                  className="rounded-lg border px-2 py-1 text-[10px] font-bold text-rose-600"
                                >
                                  Ochirish
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {isEd && editDraft ? (
                          <div className="space-y-2 rounded-xl bg-slate-50 p-2">
                            <textarea
                              value={editDraft.question_text}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, question_text: e.target.value })
                              }
                              rows={2}
                              className="w-full rounded-lg border p-1.5 text-xs"
                              placeholder="Savol *"
                            />
                            <textarea
                              value={editDraft.passage}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, passage: e.target.value })
                              }
                              rows={2}
                              className="w-full rounded-lg border p-1.5 text-xs"
                              placeholder="Passage / Matn"
                            />
                            {editDraft.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditDraft({ ...editDraft, correct_index: oi })}
                                  className={
                                    editDraft.correct_index === oi
                                      ? 'h-6 w-6 rounded-full bg-emerald-600 text-[11px] font-black text-white'
                                      : 'h-6 w-6 rounded-full border text-[11px] font-black'
                                  }
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
                                  className="w-full rounded-lg border p-1.5 text-xs"
                                />
                              </div>
                            ))}
                            <textarea
                              value={editDraft.explanation}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, explanation: e.target.value })
                              }
                              rows={2}
                              className="w-full rounded-lg border p-1.5 text-xs"
                              placeholder="Izoh"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-[13px] font-bold">
                              {v?.question_text || '(Savol yoq)'}
                            </p>
                            {v?.passage && (
                              <p className="rounded bg-slate-50 p-1.5 text-[11px] text-slate-600">
                                Passage: {v.passage.slice(0, 120)}
                              </p>
                            )}
                            {v?.options && (
                              <div className="flex flex-wrap gap-1">
                                {v.options.map((o, oi) => (
                                  <span
                                    key={oi}
                                    className={
                                      oi === v.correct_index
                                        ? 'rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold'
                                        : 'rounded bg-slate-100 px-1.5 py-0.5 text-[11px]'
                                    }
                                  >
                                    {String.fromCharCode(65 + oi)}: {o}
                                  </span>
                                ))}
                              </div>
                            )}
                            {v?.explanation && (
                              <p className="text-[11px] italic text-slate-500">
                                Izoh: {v.explanation.slice(0, 100)}
                              </p>
                            )}
                            {item.issues.map((iss, k) => (
                              <p key={k} className="text-[11px] text-rose-600">
                                [{iss.field}] {iss.message}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-bold">
                      Talaba korinishi ({validQuestionsToImport.length} ta)
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCorrectInPreview((s) => !s)}
                      className="rounded-xl border px-3 py-1.5 text-xs font-bold"
                    >
                      {showCorrectInPreview ? 'Yashirish' : 'Javoblarni korsatish'}
                    </button>
                  </div>
                  <div className="max-h-96 space-y-4 overflow-y-auto">
                    {validQuestionsToImport.map((q, qi) => {
                      const rn = validationResult.items.find((it) => it.validated === q)?.row ?? qi;
                      const sel = previewAnswers[rn];
                      return (
                        <div key={rn} className="rounded-2xl border p-4">
                          <div className="mb-1 text-[11px] font-bold text-slate-400">
                            {qi + 1}-savol • {q.section_type}
                          </div>
                          {q.passage && (
                            <div className="mb-2 rounded-xl bg-slate-50 p-3 text-[13px]">
                              <b>MATN:</b>
                              <p className="whitespace-pre-wrap">{q.passage}</p>
                            </div>
                          )}
                          <p className="mb-2 text-sm font-bold">{q.question_text}</p>
                          {q.options.map((o, oi) => {
                            const isS = sel === oi;
                            const isC = oi === q.correct_index;
                            let c = 'border-slate-200';
                            if (showCorrectInPreview && isC) c = 'border-emerald-500 bg-emerald-50';
                            else if (showCorrectInPreview && isS) c = 'border-rose-500 bg-rose-50';
                            else if (isS) c = 'border-indigo-600 bg-indigo-50';
                            return (
                              <button
                                key={oi}
                                type="button"
                                onClick={() => setPreviewAnswers((pr) => ({ ...pr, [rn]: oi }))}
                                className={
                                  'mb-1.5 flex w-full justify-between rounded-xl border p-2.5 text-left text-sm ' +
                                  c
                                }
                              >
                                <span>
                                  {String.fromCharCode(65 + oi)}: {o}
                                </span>
                                <span>{showCorrectInPreview && isC ? 'OK' : ''}</span>
                              </button>
                            );
                          })}
                          {showCorrectInPreview && q.explanation && (
                            <div className="mt-2 rounded-xl bg-emerald-50 p-2 text-xs">
                              Izoh: {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl font-bold">
            Bekor Qilish
          </Button>
          <div className="flex items-center gap-2">
            {importProgress && (
              <span className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                <Loader2 className="h-4 w-4 animate-spin" /> {importProgress}
              </span>
            )}
            <Button
              variant="outline"
              onClick={() => handleExecuteImport(false)}
              disabled={isImporting || !validationResult || validQuestionsToImport.length === 0}
              className="gap-2 rounded-2xl font-bold"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Draft sifatida saqlash ({validQuestionsToImport.length})
            </Button>
            <Button
              onClick={() => handleExecuteImport(true)}
              disabled={
                isImporting ||
                !validationResult ||
                validQuestionsToImport.length === 0 ||
                hasBlockingErrors
              }
              className="gap-2 rounded-2xl bg-indigo-600 font-bold text-white"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {hasBlockingErrors
                ? 'Xatolarni tuzating'
                : 'Tasdiqlash (' + validQuestionsToImport.length + ') '}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
