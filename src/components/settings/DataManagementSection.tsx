import { Trash, AlertTriangle, X, Download, Upload, FileText, FileSpreadsheet } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { useStudyData } from '../../context/StudyPlannerContext';
import { exportImportService } from '../../services/ExportImportService';
import { toast } from '../../hooks/use-toast';

interface DataManagementSectionProps {
  onClearData: () => Promise<void>;
}

const DataManagementSection: React.FC<DataManagementSectionProps> = ({ onClearData }) => {
  const { user, subjects, refreshData } = useStudyData();
  const [showClearModal, setShowClearModal] = useState(false);
  const [showImportFlashcardsModal, setShowImportFlashcardsModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const csvTasksInputRef = useRef<HTMLInputElement>(null);
  const csvFlashcardsInputRef = useRef<HTMLInputElement>(null);

  const handleClear = async () => {
    await onClearData();
    setShowClearModal(false);
    toast({ title: 'Tozalandi', description: "Barcha ma'lumotlar tozalandi." });
  };

  const handleExportJSON = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      await exportImportService.exportToJSON(user.id);
      toast({ title: 'Eksport qilindi', description: 'JSON zaxira fayli yuklandi.' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err instanceof Error ? err.message : 'Xatolik yuz berdi.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsImporting(true);
    try {
      const success = await exportImportService.importFromJSON(file, user.id);
      if (success) {
        await refreshData();
        toast({
          title: 'Muvaffaqiyatli',
          description: "Ma'lumotlar muvaffaqiyatli import qilindi! 🚀",
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description:
          err instanceof Error ? err.message : 'Faylni import qilishda xatolik yuz berdi.',
      });
    } finally {
      setIsImporting(false);
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
    }
  };

  const handleExportTasksCSV = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      await exportImportService.exportTasksToCSV(user.id);
      toast({ title: 'Eksport qilindi', description: 'Vazifalar CSV fayli yuklandi.' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err instanceof Error ? err.message : 'Xatolik yuz berdi.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportTasksCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsImporting(true);
    try {
      const success = await exportImportService.importTasksFromCSV(file, user.id);
      if (success) {
        await refreshData();
        toast({
          title: 'Muvaffaqiyatli',
          description: 'Vazifalar muvaffaqiyatli import qilindi! 📋',
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description:
          err instanceof Error ? err.message : 'Vazifalarni import qilishda xatolik yuz berdi.',
      });
    } finally {
      setIsImporting(false);
      if (csvTasksInputRef.current) csvTasksInputRef.current.value = '';
    }
  };

  const handleExportFlashcardsCSV = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      await exportImportService.exportFlashcardsToCSV(user.id);
      toast({ title: 'Eksport qilindi', description: 'Flashcardlar CSV fayli yuklandi.' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err instanceof Error ? err.message : 'Xatolik yuz berdi.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFlashcardsCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0 || !selectedSubjectId) return;
    const file = e.target.files[0];
    setIsImporting(true);
    try {
      const success = await exportImportService.importFlashcardsFromCSV(
        file,
        user.id,
        selectedSubjectId,
      );
      if (success) {
        await refreshData();
        setShowImportFlashcardsModal(false);
        toast({
          title: 'Muvaffaqiyatli',
          description: 'Flashcardlar muvaffaqiyatli import qilindi! 🧠',
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description:
          err instanceof Error ? err.message : 'Flashcardlarni import qilishda xatolik yuz berdi.',
      });
    } finally {
      setIsImporting(false);
      if (csvFlashcardsInputRef.current) csvFlashcardsInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-[#1f2937]">
        <div className="border-b border-gray-100 p-4 text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
          MA'LUMOTLARN BOSHQARISH VA ZAXIRALASH
        </div>

        {/* JSON Backup & Restore */}
        <div className="border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/30">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <FileText size={20} />
              </div>
              <div>
                <span className="block font-semibold text-gray-900 dark:text-white">
                  To'liq zaxira (JSON)
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Barcha fanlar, vazifalar va statistikani zaxiralash
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                ref={jsonFileInputRef}
                onChange={handleImportJSON}
                className="hidden"
              />
              <Button
                variant="secondary"
                onClick={() => jsonFileInputRef.current?.click()}
                disabled={isImporting || isExporting}
                className="flex items-center gap-1 px-3 py-1.5 text-xs"
              >
                <Upload size={14} /> Import
              </Button>
              <Button
                variant="default"
                onClick={handleExportJSON}
                disabled={isImporting || isExporting}
                className="flex items-center gap-1 px-3 py-1.5 text-xs"
              >
                <Download size={14} /> Eksport
              </Button>
            </div>
          </div>
        </div>

        {/* CSV Tasks Backup & Restore */}
        <div className="border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/30">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <span className="block font-semibold text-gray-900 dark:text-white">
                  Vazifalar (CSV)
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Vazifalar ro'yxatini jadval ko'rinishida eksport/import qilish
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                ref={csvTasksInputRef}
                onChange={handleImportTasksCSV}
                className="hidden"
              />
              <Button
                variant="secondary"
                onClick={() => csvTasksInputRef.current?.click()}
                disabled={isImporting || isExporting}
                className="flex items-center gap-1 px-3 py-1.5 text-xs"
              >
                <Upload size={14} /> Import
              </Button>
              <Button
                variant="default"
                onClick={handleExportTasksCSV}
                disabled={isImporting || isExporting}
                className="flex items-center gap-1 px-3 py-1.5 text-xs"
              >
                <Download size={14} /> Eksport
              </Button>
            </div>
          </div>
        </div>

        {/* CSV Flashcards Backup & Restore */}
        <div className="border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/30">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <span className="block font-semibold text-gray-900 dark:text-white">
                  Flashcardlar (CSV)
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Flashcardlar to'plamini jadval ko'rinishida boshqarish
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                ref={csvFlashcardsInputRef}
                onChange={handleImportFlashcardsCSV}
                className="hidden"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (subjects.length === 0) {
                    toast({
                      variant: 'destructive',
                      title: 'Fan kerak',
                      description: 'Avval kamida bitta fan yaratishingiz kerak.',
                    });
                    return;
                  }
                  setSelectedSubjectId(subjects[0].id);
                  setShowImportFlashcardsModal(true);
                }}
                disabled={isImporting || isExporting}
                className="flex items-center gap-1 px-3 py-1.5 text-xs"
              >
                <Upload size={14} /> Import
              </Button>
              <Button
                variant="default"
                onClick={handleExportFlashcardsCSV}
                disabled={isImporting || isExporting}
                className="flex items-center gap-1 px-3 py-1.5 text-xs"
              >
                <Download size={14} /> Eksport
              </Button>
            </div>
          </div>
        </div>

        {/* Clear Data */}
        <div className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2 text-red-600 dark:bg-red-900/30">
              <Trash size={20} />
            </div>
            <div>
              <span className="block font-semibold text-red-600 dark:text-red-400">
                Barcha ma'lumotlarni tozalash
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Barcha ma'lumotlarni butunlay o'chirib yuborish
              </span>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowClearModal(true)}
            className="px-3 py-1.5 text-xs"
          >
            Tozalash
          </Button>
        </div>
      </div>

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <button
              onClick={() => setShowClearModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>

            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
                <AlertTriangle size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                Haqiqatan ham o'chirmoqchimisiz?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bu amalni ortga qaytarib bo'lmaydi. Barcha vazifalar, fanlar va statistikalar o'chib
                ketadi.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowClearModal(false)}
                className="flex-1"
              >
                Bekor qilish
              </Button>
              <Button variant="destructive" onClick={handleClear} className="flex-1">
                O'chirish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Flashcards Subject Select Modal */}
      {showImportFlashcardsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <button
              onClick={() => setShowImportFlashcardsModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>

            <div className="mb-6 flex flex-col">
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                Fanni tanlang
              </h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Import qilinadigan flashcardlar qaysi fanga biriktirilsin?
              </p>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowImportFlashcardsModal(false)}
                className="flex-1"
              >
                Bekor qilish
              </Button>
              <Button
                variant="default"
                onClick={() => csvFlashcardsInputRef.current?.click()}
                className="flex-1"
              >
                Faylni tanlash
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataManagementSection;
