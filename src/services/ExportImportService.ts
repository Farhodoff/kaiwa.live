import JSZip from 'jszip';
import { supabase } from '../lib/supabase';
import { Task, Flashcard, Subject, Goal, Note } from '../types';

export function cleanAnkiHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function formatAnkiText(
  cards: Array<{ front: string; back: string; example?: string }>,
  deckName = 'Kaiwa JLPT',
): string {
  const sanitize = (val?: string | null) =>
    (val || '').replace(/\t/g, ' ').replace(/\r?\n/g, '<br>').trim();

  const lines = [
    '#separator:tab',
    '#html:true',
    '#tags column:4',
    `#deck:Kaiwa::${deckName.replace(/:/g, '_')}`,
  ];

  for (const card of cards) {
    const front = sanitize(card.front);
    const back = sanitize(card.back);
    const example = sanitize(card.example);
    const tag = `Kaiwa_${deckName.replace(/\s+/g, '_')}`;
    lines.push(`${front}\t${back}\t${example}\t${tag}`);
  }

  return lines.join('\n');
}

export function parseAnkiText(
  text: string,
): Array<{ front: string; back: string; example?: string }> {
  if (text.startsWith('\uFEFF')) {
    text = text.substring(1);
  }

  const lines = text.split(/\r?\n/);
  const cards: Array<{ front: string; back: string; example?: string }> = [];
  let delimiter = '\t';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('#separator:')) {
      const sep = line.split(':')[1]?.trim().toLowerCase();
      if (sep === 'comma') delimiter = ',';
      else if (sep === 'semicolon') delimiter = ';';
      else if (sep === 'space') delimiter = ' ';
      else delimiter = '\t';
      continue;
    }
    if (line.startsWith('#')) {
      continue;
    }

    const parts = delimiter === '\t' ? rawLine.split('\t') : rawLine.split(delimiter);
    if (parts.length >= 2) {
      const front = cleanAnkiHtml(parts[0]);
      const back = cleanAnkiHtml(parts[1]);
      const example = parts[2] ? cleanAnkiHtml(parts[2]) : '';

      if (front && back) {
        cards.push({ front, back, example });
      }
    }
  }

  return cards;
}

export function parseSqliteCards(
  uint8Arr: Uint8Array,
): Array<{ front: string; back: string; example?: string }> {
  if (uint8Arr.length < 100) return [];

  const view = new DataView(uint8Arr.buffer, uint8Arr.byteOffset, uint8Arr.byteLength);
  const decoder = new TextDecoder('utf-8');

  let pageSize = view.getUint16(16);
  if (pageSize === 1) pageSize = 65536;
  if (pageSize < 512) pageSize = 4096;

  function readVarint(offset: number): [number, number] {
    let res = 0;
    let len = 0;
    while (len < 8) {
      if (offset + len >= uint8Arr.length) return [0, 0];
      const b = uint8Arr[offset + len];
      res = (res << 7) | (b & 0x7f);
      len++;
      if ((b & 0x80) === 0) return [res, len];
    }
    if (offset + len >= uint8Arr.length) return [0, 0];
    const b = uint8Arr[offset + len];
    res = (res << 8) | b;
    return [res, len + 1];
  }

  const cards: Array<{ front: string; back: string; example?: string }> = [];

  for (let pageOffset = 0; pageOffset < uint8Arr.length; pageOffset += pageSize) {
    const isPage1 = pageOffset === 0;
    const headerOffset = isPage1 ? 100 : 0;
    if (pageOffset + headerOffset + 8 > uint8Arr.length) break;

    const pageType = uint8Arr[pageOffset + headerOffset];
    if (pageType !== 0x0d) continue; // 0x0D = b-tree table leaf page

    const cellCount = view.getUint16(pageOffset + headerOffset + 3);
    const ptrArrayOffset = pageOffset + headerOffset + 8;

    for (let c = 0; c < cellCount; c++) {
      if (ptrArrayOffset + c * 2 + 2 > uint8Arr.length) break;
      const cellPtr = view.getUint16(ptrArrayOffset + c * 2);
      let cur = pageOffset + cellPtr;

      const [, payloadLenBytes] = readVarint(cur);
      if (payloadLenBytes === 0) continue;
      cur += payloadLenBytes;

      const [, rowidLenBytes] = readVarint(cur);
      if (rowidLenBytes === 0) continue;
      cur += rowidLenBytes;

      const recordStart = cur;
      const [hdrSize, hdrLenBytes] = readVarint(cur);
      if (hdrLenBytes === 0) continue;
      cur += hdrLenBytes;

      const serialTypes: number[] = [];
      while (cur < recordStart + hdrSize && cur < uint8Arr.length) {
        const [st, stBytes] = readVarint(cur);
        if (stBytes === 0) break;
        serialTypes.push(st);
        cur += stBytes;
      }

      let dataCur = recordStart + hdrSize;
      for (const st of serialTypes) {
        if (st >= 13 && st % 2 === 1) {
          const strLen = (st - 13) / 2;
          if (dataCur + strLen <= uint8Arr.length) {
            const sub = uint8Arr.subarray(dataCur, dataCur + strLen);
            const str = decoder.decode(sub);
            if (str.includes('\x1f')) {
              const parts = str.split('\x1f');
              if (parts.length >= 2) {
                const front = cleanAnkiHtml(parts[0]);
                const back = cleanAnkiHtml(parts[1]);
                const example = parts[2] ? cleanAnkiHtml(parts[2]) : '';

                if (front && back) {
                  cards.push({ front, back, example });
                }
              }
            }
          }
          dataCur += strLen;
        } else if (st >= 12 && st % 2 === 0) {
          dataCur += (st - 12) / 2;
        } else if (st === 1) dataCur += 1;
        else if (st === 2) dataCur += 2;
        else if (st === 3) dataCur += 3;
        else if (st === 4) dataCur += 4;
        else if (st === 5) dataCur += 6;
        else if (st === 6 || st === 7) dataCur += 8;
      }
    }
  }

  return cards;
}

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
      this.downloadFile(jsonStr, `kaiwa_backup_${dateStr}.json`, 'application/json');
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
      this.downloadFile(csvContent, `kaiwa_tasks_${dateStr}.csv`, 'text/csv;charset=utf-8;');
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
      this.downloadFile(csvContent, `kaiwa_flashcards_${dateStr}.csv`, 'text/csv;charset=utf-8;');
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

  /**
   * Export flashcards to standard Anki tab-delimited text format (.txt)
   */
  async exportFlashcardsToAnki(userId: string, subjectId?: string): Promise<void> {
    try {
      let query = supabase
        .from('flashcards')
        .select('front, back, example, subject_id')
        .eq('user_id', userId);

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data: cards, error } = await query;
      if (error) throw error;

      let deckName = 'Kaiwa JLPT';
      if (subjectId) {
        const { data: subject } = await supabase
          .from('subjects')
          .select('name')
          .eq('id', subjectId)
          .maybeSingle();
        if (subject?.name) {
          deckName = subject.name;
        }
      }

      const content = formatAnkiText(cards || [], deckName);
      const safeName = deckName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      this.downloadFile(
        content,
        `kaiwa_anki_${safeName}_${dateStr}.txt`,
        'text/plain;charset=utf-8;',
      );
    } catch (error) {
      console.error('Anki export error:', error);
      throw new Error('Anki uchun eksport qilishda xatolik yuz berdi.');
    }
  }

  /**
   * Parse an Anki Package (.apkg) file containing collection.anki2
   */
  async parseAnkiPackage(
    buffer: ArrayBuffer | Uint8Array,
  ): Promise<Array<{ front: string; back: string; example?: string }>> {
    const zip = await JSZip.loadAsync(buffer);
    const ankiDbFile =
      zip.file('collection.anki2') ||
      zip.file('collection.anki21') ||
      zip.file('collection.anki21b');

    if (!ankiDbFile) {
      // Check if there is any text file inside
      const txtFile = Object.values(zip.files).find(
        (f) => !f.dir && (f.name.endsWith('.txt') || f.name.endsWith('.tsv')),
      );
      if (txtFile) {
        const text = await txtFile.async('text');
        const fallbackCards = parseAnkiText(text);
        if (fallbackCards.length > 0) {
          return fallbackCards;
        }
      }
      throw new Error("Noto'g'ri .apkg formati: collection.anki2 ma'lumotlar bazasi topilmadi.");
    }

    const rawBytes = await ankiDbFile.async('uint8array');
    return parseSqliteCards(rawBytes);
  }

  /**
   * Parse Anki tab-delimited text
   */
  parseAnkiText(text: string): Array<{ front: string; back: string; example?: string }> {
    return parseAnkiText(text);
  }

  /**
   * Import flashcards from Anki file (.apkg or .txt)
   */
  async importFlashcardsFromAnki(file: File, userId: string, subjectId: string): Promise<number> {
    let cards: Array<{ front: string; back: string; example?: string }> = [];

    if (file.name.toLowerCase().endsWith('.apkg')) {
      const buffer = await file.arrayBuffer();
      cards = await this.parseAnkiPackage(buffer);
    } else {
      const text = await file.text();
      cards = this.parseAnkiText(text);
    }

    if (cards.length === 0) {
      throw new Error(
        'Faylda mos kartochkalar topilmadi. Fayl formati yoki tuzilishini tekshiring.',
      );
    }

    const cardsToInsert = cards.map((c) => ({
      user_id: userId,
      subject_id: subjectId,
      front: c.front,
      back: c.back,
      example: c.example || '',
      next_review_date: new Date().toISOString(),
      interval: 0,
      ease_factor: 2.5,
      repetitions: 0,
    }));

    const { error } = await supabase.from('flashcards').upsert(cardsToInsert);
    if (error) throw error;

    return cardsToInsert.length;
  }
}

export const exportImportService = new ExportImportService();
export default exportImportService;
