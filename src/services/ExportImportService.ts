import { supabase } from '../lib/supabase';
import { Task, Flashcard, Subject, Goal, Note } from '../types';

interface BackupData {
  version: string;
  exportedAt: string;
  subjects?: Omit<Subject, 'id'>[];
  tasks?: Omit<Task, 'id'>[];
  flashcards?: Omit<Flashcard, 'id'>[];
  goals?: Omit<Goal, 'id'>[];
  notes?: Omit<Note, 'id'>[];
  examResults?: any[];
}

class ExportImportService {
  // Helper: Escapes value for CSV formatting
  private escapeCsv(val: unknown): string {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  // Helper: RFC 4180 Compliant CSV Parser with Auto-Delimiter and BOM strip
  private parseCsv(text: string): string[][] {
    // Strip UTF-8 BOM if present
    if (text.startsWith('\uFEFF')) {
      text = text.substring(1);
    }

    // Auto-detect delimiter (comma or semicolon)
    let delimiter = ',';
    const firstLine = text.split(/\r?\n/)[0] || '';
    let commaCount = 0;
    let semicolonCount = 0;
    let inQuotesTest = false;
    for (let i = 0; i < firstLine.length; i++) {
      const char = firstLine[i];
      if (char === '"') inQuotesTest = !inQuotesTest;
      if (!inQuotesTest) {
        if (char === ',') commaCount++;
        if (char === ';') semicolonCount++;
      }
    }
    if (semicolonCount > commaCount) {
      delimiter = ';';
    }

    const lines: string[][] = [];
    let row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          row.push(current);
          current = '';
        } else if (char === '\r' || char === '\n') {
          row.push(current);
          current = '';
          if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
            lines.push(row);
          }
          row = [];
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
        } else {
          current += char;
        }
      }
    }
    if (row.length > 0 || current !== '') {
      row.push(current);
      lines.push(row);
    }
    return lines;
  }

  // Helper: Triggers browser download of a file
  private downloadFile(content: string, filename: string, contentType: string) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export all data as JSON
   */
  async exportToJSON(userId: string): Promise<void> {
    try {
      const [subjectsRes, tasksRes, flashcardsRes, goalsRes, notesRes, examResultsRes] =
        await Promise.all([
          supabase.from('subjects').select('*').eq('user_id', userId),
          supabase.from('tasks').select('*').eq('user_id', userId),
          supabase.from('flashcards').select('*').eq('user_id', userId),
          supabase.from('goals').select('*').eq('user_id', userId),
          supabase.from('notes').select('*').eq('user_id', userId),
          supabase.from('exam_results').select('*').eq('user_id', userId),
        ]);

      const backup: BackupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        subjects: subjectsRes.data || [],
        tasks: tasksRes.data || [],
        flashcards: flashcardsRes.data || [],
        goals: goalsRes.data || [],
        notes: notesRes.data || [],
        examResults: examResultsRes.data || [],
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      this.downloadFile(jsonStr, `study_planner_backup_${dateStr}.json`, 'application/json');
    } catch (error) {
      console.error('JSON export error:', error);
      throw new Error('Eksport qilishda xatolik yuz berdi.');
    }
  }

  /**
   * Import entire data from JSON with comprehensive schema integrity checks
   */
  async importFromJSON(file: File, userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          if (!content || typeof content !== 'string') {
            throw new Error("Fayl bo'sh yoki o'qib bo'lmadi.");
          }

          let backup: BackupData;
          try {
            backup = JSON.parse(content) as BackupData;
          } catch {
            throw new Error("Noto'g'ri JSON formati: Fayl strukturasi buzilgan.");
          }

          if (!backup || typeof backup !== 'object' || !backup.version) {
            throw new Error("Noto'g'ri zaxira fayl formati: version maydoni topilmadi.");
          }

          // 1. Import Subjects first (to handle foreign keys if necessary)
          if (Array.isArray(backup.subjects) && backup.subjects.length > 0) {
            const subjectsToInsert = backup.subjects.map((s) => ({
              ...s,
              user_id: userId,
            }));
            await supabase.from('subjects').upsert(subjectsToInsert);
          }

          // 2. Import Tasks
          if (Array.isArray(backup.tasks) && backup.tasks.length > 0) {
            const tasksToInsert = backup.tasks.map((t) => ({
              ...t,
              user_id: userId,
            }));
            await supabase.from('tasks').upsert(tasksToInsert);
          }

          // 3. Import Flashcards
          if (Array.isArray(backup.flashcards) && backup.flashcards.length > 0) {
            const flashcardsToInsert = backup.flashcards.map((f) => ({
              ...f,
              user_id: userId,
            }));
            await supabase.from('flashcards').upsert(flashcardsToInsert);
          }

          // 4. Import Goals
          if (Array.isArray(backup.goals) && backup.goals.length > 0) {
            const goalsToInsert = backup.goals.map((g) => ({
              ...g,
              user_id: userId,
            }));
            await supabase.from('goals').upsert(goalsToInsert);
          }

          // 5. Import Notes
          if (Array.isArray(backup.notes) && backup.notes.length > 0) {
            const notesToInsert = backup.notes.map((n) => ({
              ...n,
              user_id: userId,
            }));
            await supabase.from('notes').upsert(notesToInsert);
          }

          // 6. Import Exam Results
          if (Array.isArray(backup.examResults) && backup.examResults.length > 0) {
            const examsToInsert = backup.examResults.map((ex) => ({
              ...ex,
              user_id: userId,
            }));
            await supabase.from('exam_results').upsert(examsToInsert);
          }

          resolve(true);
        } catch (err) {
          console.error('JSON import error:', err);
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Faylni o'qishda xatolik yuz berdi."));
      reader.readAsText(file);
    });
  }

  /**
   * Export tasks to CSV
   */
  async exportTasksToCSV(userId: string): Promise<void> {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('title, status, priority, due_date, completed, description')
        .eq('user_id', userId);

      if (error) throw error;

      const headers = ['Vazifa nomi', 'Holati', 'Muhimligi', 'Muddati', 'Bajarilgan', 'Tavsif'];
      const rows = (tasks || []).map((t) => [
        t.title,
        t.status,
        t.priority,
        t.due_date || '',
        t.completed ? 'Ha' : "Yo'q",
        t.description || '',
      ]);

      const csvContent = [
        headers.map((h) => this.escapeCsv(h)).join(','),
        ...rows.map((row) => row.map((cell) => this.escapeCsv(cell)).join(',')),
      ].join('\n');

      const dateStr = new Date().toISOString().split('T')[0];
      this.downloadFile(
        csvContent,
        `study_planner_tasks_${dateStr}.csv`,
        'text/csv;charset=utf-8;',
      );
    } catch (error) {
      console.error('CSV export tasks error:', error);
      throw new Error('Vazifalarni eksport qilishda xatolik yuz berdi.');
    }
  }

  /**
   * Import tasks from CSV
   */
  async importTasksFromCSV(file: File, userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = this.parseCsv(text);

          if (parsed.length <= 1) {
            resolve(false);
            return;
          }

          // Skip header row
          const rows = parsed.slice(1);
          const tasksToInsert = rows
            .filter((row) => row[0]?.trim()) // ensure title is not empty
            .map((row) => {
              const title = row[0];
              const status = row[1] || 'todo';
              const priority = row[2] || 'medium';
              const dueDate = row[3] || null;
              const completed = row[4]?.toLowerCase() === 'ha' || row[4]?.toLowerCase() === 'true';
              const description = row[5] || '';

              return {
                user_id: userId,
                title,
                status,
                priority,
                due_date: dueDate || null,
                completed,
                description,
              };
            });

          if (tasksToInsert.length > 0) {
            const { error } = await supabase.from('tasks').upsert(tasksToInsert);
            if (error) throw error;
          }

          resolve(true);
        } catch (err) {
          console.error('CSV import tasks error:', err);
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  }

  /**
   * Export flashcards to CSV
   */
  async exportFlashcardsToCSV(userId: string): Promise<void> {
    try {
      const { data: cards, error } = await supabase
        .from('flashcards')
        .select('front, back, example, next_review, interval, ease_factor, repetitions')
        .eq('user_id', userId);

      if (error) throw error;

      const headers = [
        'Oldi (Savol)',
        'Orqasi (Javob)',
        'Misol',
        'Keyingi takrorlash',
        'Interval',
        'Osonlik koeffitsiyenti',
        'Takrorlashlar',
      ];
      const rows = (cards || []).map((c) => [
        c.front,
        c.back,
        c.example || '',
        c.next_review || '',
        c.interval || 0,
        c.ease_factor || 2.5,
        c.repetitions || 0,
      ]);

      const csvContent = [
        headers.map((h) => this.escapeCsv(h)).join(','),
        ...rows.map((row) => row.map((cell) => this.escapeCsv(cell)).join(',')),
      ].join('\n');

      const dateStr = new Date().toISOString().split('T')[0];
      this.downloadFile(
        csvContent,
        `study_planner_flashcards_${dateStr}.csv`,
        'text/csv;charset=utf-8;',
      );
    } catch (error) {
      console.error('CSV export flashcards error:', error);
      throw new Error('Flashcardlarni eksport qilishda xatolik yuz berdi.');
    }
  }

  /**
   * Import flashcards from CSV
   */
  async importFlashcardsFromCSV(file: File, userId: string, subjectId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = this.parseCsv(text);

          if (parsed.length <= 1) {
            resolve(false);
            return;
          }

          const rows = parsed.slice(1);
          const cardsToInsert = rows
            .filter((row) => row[0]?.trim() && row[1]?.trim()) // ensure front and back are present
            .map((row) => {
              const front = row[0];
              const back = row[1];
              const example = row[2] || '';
              const nextReview = row[3] || new Date().toISOString();
              const interval = parseInt(row[4] || '0', 10);
              const easeFactor = parseFloat(row[5] || '2.5');
              const repetitions = parseInt(row[6] || '0', 10);

              return {
                user_id: userId,
                subject_id: subjectId,
                front,
                back,
                example,
                next_review_date: nextReview,
                interval,
                ease_factor: easeFactor,
                repetitions,
              };
            });

          if (cardsToInsert.length > 0) {
            const { error } = await supabase.from('flashcards').upsert(cardsToInsert);
            if (error) throw error;
          }

          resolve(true);
        } catch (err) {
          console.error('CSV import flashcards error:', err);
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  }
}

export const exportImportService = new ExportImportService();
export default exportImportService;
