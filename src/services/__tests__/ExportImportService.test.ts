import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import exportImportService, {
  cleanAnkiHtml,
  formatAnkiText,
  parseAnkiText,
  parseSqliteCards,
} from '../ExportImportService';

interface TestableExportImportService {
  parseCsv(text: string): string[][];
  escapeCsv(text: string): string;
}

const service = exportImportService as unknown as TestableExportImportService;

describe('ExportImportService', () => {
  describe('CSV Parser (RFC 4180 compliant)', () => {
    it('should parse standard CSV with simple values', () => {
      const csv = '"apple","olma","I like apples"\n"banana","banan","Yellow fruit"';
      const parsed = service.parseCsv(csv);

      expect(parsed).toHaveLength(2);
      expect(parsed[0][0]).toBe('apple');
      expect(parsed[0][1]).toBe('olma');
      expect(parsed[0][2]).toBe('I like apples');

      expect(parsed[1][0]).toBe('banana');
      expect(parsed[1][1]).toBe('banan');
      expect(parsed[1][2]).toBe('Yellow fruit');
    });

    it('should parse CSV containing commas and quotes inside fields', () => {
      const csv =
        '"Hello, world","Salom, dunyo","This is a ""cool"" test"\n"simple","oddiy","no quotes"';
      const parsed = service.parseCsv(csv);

      expect(parsed).toHaveLength(2);
      expect(parsed[0][0]).toBe('Hello, world');
      expect(parsed[0][1]).toBe('Salom, dunyo');
      expect(parsed[0][2]).toBe('This is a "cool" test');

      expect(parsed[1][0]).toBe('simple');
      expect(parsed[1][1]).toBe('oddiy');
      expect(parsed[1][2]).toBe('no quotes');
    });
  });

  describe('escapeCsv helper', () => {
    it('should escape quotes and commas correctly', () => {
      const escape = service.escapeCsv;
      expect(escape('hello')).toBe('hello');
      expect(escape('hello, world')).toBe('"hello, world"');
      expect(escape('hello "world"')).toBe('"hello ""world"""');
    });
  });

  describe('JSON Backup Validation & Disaster Recovery', () => {
    it('rejects corrupted or malformed JSON payloads gracefully', async () => {
      const malformedFile = new File(['{ "brokenJson": ...'], 'corrupt.json', {
        type: 'application/json',
      });
      await expect(exportImportService.importFromJSON(malformedFile, 'user-123')).rejects.toThrow(
        /Noto'g'ri JSON formati/i,
      );
    });

    it('rejects backup payload missing version field', async () => {
      const noVersionFile = new File([JSON.stringify({ tasks: [] })], 'no_version.json', {
        type: 'application/json',
      });
      await expect(exportImportService.importFromJSON(noVersionFile, 'user-123')).rejects.toThrow(
        /version maydoni topilmadi/i,
      );
    });
  });

  describe('Anki Utilities & Cleaners', () => {
    it('cleanAnkiHtml cleans HTML formatting, breaks, and entities', () => {
      const rawHtml =
        '<div><strong>Mizu (水)</strong><br><span>Suv&nbsp;&amp;&nbsp;ichimlik</span></div>';
      const cleaned = cleanAnkiHtml(rawHtml);
      expect(cleaned).toContain('Mizu (水)');
      expect(cleaned).toContain('Suv & ichimlik');
      expect(cleaned).not.toContain('<div>');
      expect(cleaned).not.toContain('<strong>');
    });

    it('formatAnkiText produces standard Anki headers and tab-separated rows', () => {
      const sampleCards = [
        { front: '食べる', back: 'Yemoq', example: 'ご飯を食べる' },
        { front: '飲む', back: 'Ichmoq', example: 'お茶を飲む' },
      ];

      const formatted = formatAnkiText(sampleCards, 'JLPT N5 Vocab');
      expect(formatted).toContain('#separator:tab');
      expect(formatted).toContain('#html:true');
      expect(formatted).toContain('#deck:Kaiwa::JLPT N5 Vocab');
      expect(formatted).toContain('食べる\tYemoq\tご飯を食べる\tKaiwa_JLPT_N5_Vocab');
      expect(formatted).toContain('飲む\tIchmoq\tお茶を飲む\tKaiwa_JLPT_N5_Vocab');
    });

    it('parseAnkiText parses Anki tab-delimited text and ignores directives', () => {
      const ankiRaw = `#separator:tab
#html:true
#tags column:4
#deck:Kaiwa::N5
猫\tMushuk\t可愛い猫\tKaiwa_N5
犬\tKuchuk\t大きい犬\tKaiwa_N5
`;
      const parsed = parseAnkiText(ankiRaw);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].front).toBe('猫');
      expect(parsed[0].back).toBe('Mushuk');
      expect(parsed[0].example).toBe('可愛い猫');
      expect(parsed[1].front).toBe('犬');
      expect(parsed[1].back).toBe('Kuchuk');
      expect(parsed[1].example).toBe('大きい犬');
    });

    it('parseAnkiText handles UTF-8 BOM smoothly', () => {
      const bomText = '\uFEFF花\tGul\t綺麗\tTag';
      const parsed = parseAnkiText(bomText);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].front).toBe('花');
      expect(parsed[0].back).toBe('Gul');
    });

    it('parseAnkiPackage extracts cards from text fallback inside ZIP', async () => {
      const zip = new JSZip();
      zip.file('anki_deck.txt', "山\tTog'\t高い山\n川\tDaryo\t広い川");
      const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

      const cards = await exportImportService.parseAnkiPackage(zipBuffer);
      expect(cards).toHaveLength(2);
      expect(cards[0].front).toBe('山');
      expect(cards[0].back).toBe("Tog'");
      expect(cards[1].front).toBe('川');
      expect(cards[1].back).toBe('Daryo');
    });

    it('parseAnkiPackage throws descriptive error when zip has no anki data', async () => {
      const zip = new JSZip();
      zip.file('readme.txt', 'Just an empty file');
      const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

      await expect(exportImportService.parseAnkiPackage(zipBuffer)).rejects.toThrow(
        /collection\.anki2 ma'lumotlar bazasi topilmadi/i,
      );
    });

    it('parseSqliteCards returns empty array for short or invalid binary buffer', () => {
      expect(parseSqliteCards(new Uint8Array(20))).toEqual([]);
      expect(parseSqliteCards(new Uint8Array(0))).toEqual([]);
    });
  });
});
