import { X, Download, FileText } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { Subject } from '../../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onImport: (subjectId: string, file: File) => Promise<void>;
  isImporting: boolean;
  downloadTemplate: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onImport,
  isImporting,
  downloadTemplate,
}) => {
  const [importSubjectId, setImportSubjectId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importSubjectId || !importFile) return;
    await onImport(importSubjectId, importFile);
    setImportFile(null);
    setImportSubjectId('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>

        <h3 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          Anki / CSV / JSON Orqali Yuklash
        </h3>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Anki (.apkg/.txt), CSV, TSV yoki JSON tayyor kartochkalar to'plamini yuklash.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Qaysi fanga?
            </label>
            <select
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              value={importSubjectId}
              onChange={(e) => setImportSubjectId(e.target.value)}
              required
            >
              <option value="">Fanni tanlang...</option>
              {subjects
                .filter((s) => !s.isArchived)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Anki / CSV / TSV / JSON Fayl
            </label>
            <div
              className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json,.csv,.tsv,.txt,.apkg"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <FileText className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {importFile ? importFile.name : 'Anki (.apkg/txt), CSV yoki JSON faylni tanlang'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1 font-medium text-indigo-600 hover:underline"
            >
              <Download size={14} /> JSON Namunasini yuklab olish
            </button>
          </div>

          <Button type="submit" disabled={isImporting} className="w-full">
            {isImporting ? 'Yuklanmoqda...' : 'Yuklash'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ImportModal;
