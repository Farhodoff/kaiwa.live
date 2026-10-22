import { describe, expect, it } from 'vitest';
import { ExamBulkImportService, RawImportQuestion } from '../ExamBulkImportService';

describe('ExamBulkImportService', () => {
  describe('parseCsv', () => {
    it('should parse valid CSV with comma delimiters and quotes', () => {
      const csv = `question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,level
彼女はいつも（　）な服を着ている。,派手,地味,清潔,親切,派手,"派手 (hade) - yorqin libos",N3
会議の時間を（　）してください。,確認,約束,準備,相談,確認,Izoh matni,N3`;

      const rows = ExamBulkImportService.parseCsv(csv);
      expect(rows.length).toBe(2);
      expect(rows[0].question_text).toBe('彼女はいつも（　）な服を着ている。');
      expect(rows[0].option_a).toBe('派手');
      expect(rows[0].correct_answer).toBe('派手');
      expect(rows[0].explanation).toBe('派手 (hade) - yorqin libos');
      expect(rows[1].question_text).toBe('会議の時間を（　）してください。');
    });

    it('should auto-detect semicolon delimiter', () => {
      const csv = `question_text;option_a;option_b;correct_answer;level
富士山は日本で一番高い山です。;Ha;Yo'q;Ha;N5`;

      const rows = ExamBulkImportService.parseCsv(csv);
      expect(rows.length).toBe(1);
      expect(rows[0].question_text).toBe('富士山は日本で一番高い山です。');
      expect(rows[0].option_a).toBe('Ha');
      expect(rows[0].correct_answer).toBe('Ha');
    });

    it('should handle UTF-8 BOM smoothly', () => {
      const csvWithBom = `\uFEFFquestion_text,option_a,option_b,correct_answer
Test question,A,B,A`;

      const rows = ExamBulkImportService.parseCsv(csvWithBom);
      expect(rows.length).toBe(1);
      expect(rows[0].question_text).toBe('Test question');
    });
  });

  describe('parseJson', () => {
    it('should parse valid JSON array', () => {
      const jsonStr = JSON.stringify([
        {
          question_text: 'Test 1',
          options: ['A', 'B'],
          correct_index: 0,
        },
      ]);
      const res = ExamBulkImportService.parseJson(jsonStr);
      expect(Array.isArray(res)).toBe(true);
      expect(res[0].question_text).toBe('Test 1');
    });

    it('should throw sanitized error for invalid JSON', () => {
      expect(() => ExamBulkImportService.parseJson('{ invalid: json')).toThrow(
        /JSON sintaksis xatosi/,
      );
    });
  });

  describe('validateQuestions', () => {
    it('1. should validate required fields and pass valid multiple choice question', () => {
      const raw: RawImportQuestion[] = [
        {
          question_text: '彼女はいつも（　）な服を着ている。',
          type: 'multiple_choice',
          options: ['派手', '地味', '清潔', '親切'],
          correct_answer: '派手',
          explanation: 'Izoh',
          level: 'N3',
          section: 'knowledge',
        },
      ];

      const res = ExamBulkImportService.validateQuestions(raw, { expectedLevel: 'N3' });
      expect(res.isValid).toBe(true);
      expect(res.validCount).toBe(1);
      expect(res.errorCount).toBe(0);
      expect(res.items[0].validated?.correct_index).toBe(0);
      expect(res.items[0].validated?.correct_answer).toBe('派手');
    });

    it('2. should flag error when question_text is missing or too short', () => {
      const raw: RawImportQuestion[] = [
        {
          question_text: '',
          options: ['A', 'B'],
          correct_answer: 'A',
        },
        {
          question_text: 'AB',
          options: ['A', 'B'],
          correct_answer: 'A',
        },
      ];

      const res = ExamBulkImportService.validateQuestions(raw);
      expect(res.isValid).toBe(false);
      expect(res.errorCount).toBe(2);
      expect(res.items[0].issues.some((i) => i.field === 'question_text')).toBe(true);
      expect(res.items[1].issues.some((i) => i.field === 'question_text')).toBe(true);
    });

    it('3. should flag error when options are fewer than 2 for multiple_choice', () => {
      const raw: RawImportQuestion[] = [
        {
          question_text: 'Savol matni mavjud',
          options: ['Faqat bitta variant'],
          correct_answer: 'Faqat bitta variant',
        },
      ];

      const res = ExamBulkImportService.validateQuestions(raw);
      expect(res.errorCount).toBe(1);
      expect(res.items[0].issues.some((i) => i.field === 'options')).toBe(true);
    });

    it('4. should correctly resolve correct_index by letter (A, B, C, D) and number (0-based and 1-based)', () => {
      const raw: RawImportQuestion[] = [
        {
          question_text: 'Savol letter index bilan',
          options: ['Birinchi', 'Ikkinchi', 'Uchinchi', "To'rtinchi"],
          correct_index: 'B',
        },
        {
          question_text: 'Savol 0-based index bilan',
          options: ['Birinchi', 'Ikkinchi', 'Uchinchi', "To'rtinchi"],
          correct_index: 2,
        },
        {
          question_text: 'Savol 1-based max index bilan',
          options: ['Birinchi', 'Ikkinchi', 'Uchinchi', "To'rtinchi"],
          correct_index: 4,
        },
      ];

      const res = ExamBulkImportService.validateQuestions(raw, {
        expectedLevel: 'N3',
        defaultSectionName: 'knowledge',
      });
      expect(res.validCount).toBe(3);
      expect(res.items[0].validated?.correct_index).toBe(1);
      expect(res.items[0].validated?.correct_answer).toBe('Ikkinchi');
      expect(res.items[1].validated?.correct_index).toBe(2);
      expect(res.items[1].validated?.correct_answer).toBe('Uchinchi');
      expect(res.items[2].validated?.correct_index).toBe(3);
      expect(res.items[2].validated?.correct_answer).toBe("To'rtinchi");
    });

    it('5. should flag error when correct_answer is not found in options list', () => {
      const raw: RawImportQuestion[] = [
        {
          question_text: "Savol noto'g'ri javob bilan",
          options: ['Olma', 'Anor', 'Uzum'],
          correct_answer: 'Banan',
        },
      ];

      const res = ExamBulkImportService.validateQuestions(raw);
      expect(res.isValid).toBe(false);
      expect(
        res.items[0].issues.some(
          (i) => i.field === 'correctAnswer' || i.field === 'correct_answer',
        ),
      ).toBe(true);
    });

    it('6. should detect intra-file duplicate questions and database duplicates', () => {
      const raw: RawImportQuestion[] = [
        {
          question_text: 'Bugun havo juda yaxshi.',
          options: ['A', 'B'],
          correct_answer: 'A',
        },
        {
          question_text: 'Bugun havo juda yaxshi!', // Normalized duplicate in batch
          options: ['A', 'B'],
          correct_answer: 'A',
        },
        {
          question_text: 'Bazadagi mavjud savol',
          options: ['A', 'B'],
          correct_answer: 'A',
        },
      ];

      const res = ExamBulkImportService.validateQuestions(raw, {
        existingQuestionTexts: ['Bazadagi mavjud savol'],
      });

      expect(res.duplicateCount).toBe(2);
      expect(res.items[1].isDuplicate).toBe(true);
      expect(res.items[2].isDuplicate).toBe(true);
      expect(res.items[1].issues.some((i) => i.message.includes('avvalroq uchragan'))).toBe(true);
      expect(res.items[2].issues.some((i) => i.message.includes('tizim bazasida allaqachon'))).toBe(
        true,
      );
    });

    it('7. should warn when question level does not match expected exam level', () => {
      const raw: RawImportQuestion[] = [
        {
          question_text: 'N5 darajadagi savol N1 imtihoniga adashib tushgan',
          options: ['A', 'B'],
          correct_answer: 'A',
          level: 'N5',
          section: 'reading',
        },
      ];

      const res = ExamBulkImportService.validateQuestions(raw, { expectedLevel: 'N1' });
      expect(res.warningCount).toBe(1);
      expect(res.items[0].status).toBe('warning');
      expect(res.items[0].issues.some((i) => i.field === 'level')).toBe(true);
    });
  });

  describe('template generation', () => {
    it('should generate non-empty sample CSV and JSON templates', () => {
      const csvTpl = ExamBulkImportService.generateSampleCsvTemplate();
      expect(csvTpl).toContain('section');
      expect(csvTpl).toContain('question');
      expect(csvTpl).toContain('correctAnswer');

      const jsonTpl = ExamBulkImportService.generateSampleJsonTemplate();
      expect(jsonTpl).toContain('knowledge');
      expect(jsonTpl).toContain('multiple_choice');
      expect(JSON.parse(jsonTpl)).toBeDefined();
    });
  });

  describe('parseAndValidate', () => {
    it('should parse and validate CSV text correctly', () => {
      const csv = `section,level,question_text,option_a,option_b,option_c,option_d,correct_answer
knowledge,N3,Test Savol matni,A variant,B variant,C variant,D variant,A variant`;
      const res = ExamBulkImportService.parseAndValidate(csv, 'csv');
      expect(res.totalCount).toBe(1);
      expect(res.validCount).toBe(1);
      expect(res.errorCount).toBe(0);
      expect(res.items[0].validated?.question_text).toBe('Test Savol matni');
      expect(res.items[0].validated?.correct_index).toBe(0);
    });

    it('should parse and validate JSON text correctly', () => {
      const json = JSON.stringify([
        {
          section: 'knowledge',
          question_text: 'JSON orqali kelgan savol',
          options: ['Bir', 'Ikki'],
          correct_answer: 'Bir',
          level: 'N3',
        },
      ]);
      const res = ExamBulkImportService.parseAndValidate(json, 'auto', { defaultLevel: 'N3' });
      expect(res.totalCount).toBe(1);
      expect(res.validCount).toBe(1);
      expect(res.items[0].validated?.correct_answer).toBe('Bir');
    });

    it('should handle empty or syntax error gracefully', () => {
      const emptyRes = ExamBulkImportService.parseAndValidate('');
      expect(emptyRes.totalCount).toBe(0);

      const brokenJsonRes = ExamBulkImportService.parseAndValidate('{ broken json ', 'json');
      expect(brokenJsonRes.errorCount).toBe(1);
      expect(brokenJsonRes.items[0].issues[0].field).toBe('json_syntax');
    });
  });

  describe('Task 2: Strict Schema & Validation Engine', () => {
    it('1. Majburiy maydonlar: should flag error if question, options, correctAnswer, level, or section are missing', () => {
      const rawEmpty: RawImportQuestion[] = [
        {}, // completely empty question
      ];

      const res = ExamBulkImportService.validateQuestions(rawEmpty);
      expect(res.isValid).toBe(false);
      expect(res.errorCount).toBe(1);

      const issues = res.items[0].issues;
      const fields = issues.map((i) => i.field);
      expect(fields).toContain('question_text');
      expect(fields).toContain('options');
      expect(fields).toContain('correctAnswer');
      expect(fields).toContain('level');
      expect(fields).toContain('section');
    });

    it("2. Level tekshiruvi: level faqat N5, N4, N3, N2 yoki N1 bo'lishi shart", () => {
      const validLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
      validLevels.forEach((lvl) => {
        const res = ExamBulkImportService.validateQuestions([
          {
            section: 'knowledge',
            question: 'Yapon tili daraja testi',
            options: ['A', 'B'],
            correctAnswer: 'A',
            level: lvl,
          },
        ]);
        const levelIssues = res.items[0].issues.filter(
          (i) => i.field === 'level' && i.severity === 'error',
        );
        expect(levelIssues.length).toBe(0);
      });

      // Invalid levels
      const invalidLevels = ['B2', 'N6', 'C1', 'JLPT3', 'random'];
      invalidLevels.forEach((badLvl) => {
        const res = ExamBulkImportService.validateQuestions([
          {
            section: 'knowledge',
            question: 'Yapon tili daraja testi',
            options: ['A', 'B'],
            correctAnswer: 'A',
            level: badLvl,
          },
        ]);
        expect(res.items[0].status).toBe('error');
        const err = res.items[0].issues.find((i) => i.field === 'level' && i.severity === 'error');
        expect(err).toBeDefined();
        expect(err?.message).toContain("level faqat N5, N4, N3, N2 yoki N1 bo'lishi shart");
      });
    });

    it("3. Section tekshiruvi: section faqat knowledge, reading yoki listening bo'lishi shart", () => {
      const validSections = [
        'knowledge',
        'reading',
        'listening',
        'Dokkai',
        'Gengo Chishiki',
        'Choukai',
      ];
      validSections.forEach((sec) => {
        const res = ExamBulkImportService.validateQuestions([
          {
            section: sec,
            question: "Bo'lim tekshiruvi savoli",
            options: ['A', 'B'],
            correctAnswer: 'A',
            level: 'N3',
          },
        ]);
        const secErrors = res.items[0].issues.filter(
          (i) => i.field === 'section' && i.severity === 'error',
        );
        expect(secErrors.length).toBe(0);
      });

      // Invalid sections
      const invalidSections = ['speaking', 'writing', 'math', 'chemistry', 'general_random'];
      invalidSections.forEach((badSec) => {
        const res = ExamBulkImportService.validateQuestions([
          {
            section: badSec,
            question: "Bo'lim tekshiruvi savoli",
            options: ['A', 'B'],
            correctAnswer: 'A',
            level: 'N3',
          },
        ]);
        expect(res.items[0].status).toBe('error');
        const secErr = res.items[0].issues.find((i) => i.field === 'section');
        expect(secErr).toBeDefined();
        expect(secErr?.message).toContain(
          "section faqat knowledge, reading yoki listening bo'lishi shart",
        );
      });
    });

    it('4. correctAnswer mavjud option indeksiga mos kelishi', () => {
      // Out of bounds index
      const resIndexOutOfBounds = ExamBulkImportService.validateQuestions([
        {
          section: 'knowledge',
          question: 'Chegaradan chiqqan indeks',
          options: ['A', 'B', 'C'],
          correct_index: 9, // only 3 options
          level: 'N3',
        },
      ]);
      expect(resIndexOutOfBounds.items[0].status).toBe('error');
      expect(resIndexOutOfBounds.items[0].issues.some((i) => i.field === 'correctAnswer')).toBe(
        true,
      );

      // Answer text not found in options
      const resAnswerNotFound = ExamBulkImportService.validateQuestions([
        {
          section: 'knowledge',
          question: "Mavjud bo'lmagan javob",
          options: ['Olma', 'Anor'],
          correctAnswer: 'Gilos',
          level: 'N3',
        },
      ]);
      expect(resAnswerNotFound.items[0].status).toBe('error');
      expect(resAnswerNotFound.items[0].issues.some((i) => i.field === 'correctAnswer')).toBe(true);

      // Valid match
      const resValid = ExamBulkImportService.validateQuestions([
        {
          section: 'knowledge',
          question: "To'g'ri mos kelgan javob",
          options: ['Olma', 'Anor'],
          correctAnswer: 'Olma',
          level: 'N3',
        },
      ]);
      expect(resValid.isValid).toBe(true);
      expect(resValid.items[0].validated?.correct_index).toBe(0);
    });

    it("5. Bo'sh savol, bo'sh variant va duplicate ID'larni aniqlash", () => {
      // Bo'sh savol
      const resEmptyQ = ExamBulkImportService.validateQuestions([
        {
          section: 'knowledge',
          question: '   ', // empty question
          options: ['A', 'B'],
          correctAnswer: 'A',
          level: 'N3',
        },
      ]);
      expect(resEmptyQ.items[0].status).toBe('error');
      expect(resEmptyQ.items[0].issues.some((i) => i.field === 'question_text')).toBe(true);

      // Bo'sh variant (array with empty option)
      const resEmptyOpt = ExamBulkImportService.validateQuestions([
        {
          section: 'knowledge',
          question: "Variantlardan biri bo'sh",
          options: ['Variant 1', '', 'Variant 3'],
          correctAnswer: 'Variant 1',
          level: 'N3',
        },
      ]);
      expect(resEmptyOpt.items[0].status).toBe('error');
      expect(
        resEmptyOpt.items[0].issues.some(
          (i) => i.field === 'options' && i.message.includes("Bo'sh variant"),
        ),
      ).toBe(true);

      // Duplicate ID'lar
      const resDupIds = ExamBulkImportService.validateQuestions([
        {
          id: 'q_100',
          section: 'knowledge',
          question: 'Birinchi savol',
          options: ['A', 'B'],
          correctAnswer: 'A',
          level: 'N3',
        },
        {
          id: 'q_100', // duplicate id
          section: 'knowledge',
          question: 'Ikkinchi boshqa savol',
          options: ['C', 'D'],
          correctAnswer: 'C',
          level: 'N3',
        },
      ]);
      expect(resDupIds.items[1].status).toBe('error');
      const dupIssue = resDupIds.items[1].issues.find((i) => i.field === 'id');
      expect(dupIssue).toBeDefined();
      expect(dupIssue?.message).toContain('Duplicate ID aniqlandi');
    });

    it("6. Xatolarni qator raqami va maydon nomi bilan ko'rsatish", () => {
      const res = ExamBulkImportService.validateQuestions([
        {
          section: 'knowledge',
          question: 'Valid question',
          options: ['A', 'B'],
          correctAnswer: 'A',
          level: 'N3',
        },
        {
          // Row 2 has errors
          section: 'invalid_section',
          question: '',
          options: ['A'],
          correctAnswer: '',
          level: 'invalid_level',
        },
      ]);

      expect(res.items[1].row).toBe(2);
      const row2Issues = res.items[1].issues;
      expect(row2Issues.every((i) => i.row === 2)).toBe(true);
      const fields = row2Issues.map((i) => i.field);
      expect(fields).toContain('question_text');
      expect(fields).toContain('options');
      expect(fields).toContain('correctAnswer');
      expect(fields).toContain('level');
      expect(fields).toContain('section');
    });

    it('7. Notogri fayl databasega saqlanmasligi', async () => {
      const invalidCsv = `section,question,options,correctAnswer,level
invalid_section,,["A"],,INVALID_LEVEL`;

      await expect(
        ExamBulkImportService.validateAndImportToSection('dummy-section-id', invalidCsv, 'csv'),
      ).rejects.toThrow(
        "validatsiya xatoligi mavjud. Noto'g'ri fayl ma'lumotlar bazasiga saqlanmaydi",
      );

      // Empty questions guard
      await expect(
        ExamBulkImportService.importQuestionsToSection('dummy-section-id', []),
      ).rejects.toThrow('Saqlash uchun yaroqli savollar topilmadi');
    });

    it('8. Task 3: passage saqlanadi va reading passagesiz bo‘lsa warning beradi', () => {
      const res = ExamBulkImportService.validateQuestions([
        {
          section: 'reading',
          question: '筆者の最も主張したいことはどれか。',
          passage:
            'Texnologiya hayotni osonlashtirdi. Shu bilan birga axloqiy qarashlarni ham yangilash kerak.',
          options: ['A variant', 'B variant'],
          correctAnswer: 'A variant',
          translation: 'Texnologiya hayotni osonlashtirdi.',
          explanation: 'Passage asosida javob beriladi.',
          level: 'N3',
        },
        {
          section: 'reading',
          question: 'Matnga kora togri javobni toping?',
          options: ['X variant', 'Y variant'],
          correctAnswer: 'X variant',
          level: 'N3',
        },
      ]);
      expect(res.items[0].validated?.passage).toContain('Texnologiya');
      expect(res.items[0].status).toBe('valid');
      expect(res.items[1].issues.some((i) => i.field === 'passage')).toBe(true);
    });

    it('9. Task 3: tahrirlangan savol qayta validatsiyadan otadi', () => {
      const base = ExamBulkImportService.validateQuestions([
        {
          section: 'knowledge',
          question: 'この問題の正しい答えを選んでください。',
          options: ['A1', 'B1'],
          correctAnswer: 'A1',
          explanation: 'eski izoh',
          translation: 'eski tarjima',
          level: 'N3',
        },
      ]);
      expect(base.items[0].status).toBe('valid');
      const edited = base.items.map((it) => ({
        ...it,
        validated: it.validated
          ? { ...it.validated, question_text: 'Yangilangan savol matni', explanation: 'yangi izoh' }
          : null,
      }));
      const re = ExamBulkImportService.revalidateEditedItems(edited, { expectedLevel: 'N3' });
      expect(re.items[0].validated?.question_text).toBe('Yangilangan savol matni');
      expect(re.items[0].validated?.explanation).toBe('yangi izoh');
      expect(re.errorCount).toBe(0);
    });
  });

  describe('Task 8: Duplicate detection & content quality audit', () => {
    const baseQuestion = (overrides: Partial<RawImportQuestion> = {}): RawImportQuestion => ({
      section: 'knowledge',
      question: 'この問題の正しい答えを選んでください。',
      options: ['答えA', '答えB', '答えC'],
      correctAnswer: '答えA',
      explanation: '正解の理由を説明します。',
      translation: 'Bu savolning tarjimasi.',
      level: 'N3',
      difficulty: 'medium',
      ...overrides,
    });

    it('bir xil question IDlarni fayl ichida va bazada aniqlaydi', () => {
      const res = ExamBulkImportService.validateQuestions(
        [
          baseQuestion({ id: 'q_1' }),
          baseQuestion({ id: 'q_1', question: '別の日本語の問題文です。' }),
          baseQuestion({ id: 'q_2', question: '三番目の日本語の問題です。' }),
        ],
        { existingQuestionIds: ['q_2'] },
      );

      expect(res.items[0].status).not.toBe('error');
      expect(res.items[1].issues.some((i) => i.field === 'id')).toBe(true);
      expect(res.items[2].issues.some((i) => i.field === 'id')).toBe(true);
      expect(res.errorCount).toBe(2);
    });

    it("bir xil yoki juda o'xshash savollarni aniqlaydi", () => {
      const res = ExamBulkImportService.validateQuestions([
        baseQuestion({ question: '日本語の文法問題を解いてください。' }),
        baseQuestion({ question: '日本語の文法問題を解いて下さい！' }),
      ]);

      expect(res.items[1].isDuplicate).toBe(true);
      expect(res.items[1].isSimilar).toBe(true);
      expect(res.items[1].similarToRow).toBe(1);
      expect(res.items[1].issues.some((i) => i.code === 'similar_question')).toBe(true);
      expect(res.similarCount).toBe(1);
    });

    it('bir xil passageni qayta import qilinishini aniqlaydi', () => {
      const passage = '科学技術の進歩は生活を便利にした。しかし倫理観の見直しも必要だ。';
      const res = ExamBulkImportService.validateQuestions(
        [
          baseQuestion({
            section: 'reading',
            passage,
            question: '筆者の主張は何か。',
          }),
        ],
        { existingPassages: [passage] },
      );

      expect(res.items[0].isPassageDuplicate).toBe(true);
      expect(res.items[0].issues.some((i) => i.code === 'duplicate_passage')).toBe(true);
      expect(res.passageDuplicateCount).toBe(1);
    });

    it('level va difficulty mosligini tekshiradi', () => {
      const res = ExamBulkImportService.validateQuestions([
        baseQuestion({ level: 'N5', difficulty: 'hard' }),
        baseQuestion({ level: 'N3', difficulty: 'impossible' }),
      ]);

      expect(res.items[0].issues.some((i) => i.code === 'level_difficulty_mismatch')).toBe(true);
      expect(res.items[1].issues.some((i) => i.code === 'invalid_difficulty')).toBe(true);
    });

    it("to'g'ri javob variantlarda mavjudligini tekshiradi", () => {
      const res = ExamBulkImportService.validateQuestions([
        baseQuestion({ correctAnswer: '存在しない答え' }),
      ]);

      expect(res.items[0].status).toBe('error');
      expect(res.items[0].issues.some((i) => i.field === 'correctAnswer')).toBe(true);
    });

    it('japanese text, translation va explanation bosh emasligini tekshiradi', () => {
      const res = ExamBulkImportService.validateQuestions([
        baseQuestion({
          question: 'Latin text only question',
          translation: '',
          explanation: '',
        }),
      ]);

      const codes = res.items[0].issues.map((i) => i.code);
      expect(codes).toContain('japanese_text_missing');
      expect(codes).toContain('translation_missing');
      expect(codes).toContain('explanation_missing');
      expect(res.items[0].status).toBe('warning');
    });

    it('audit natijasini xatolar, ogohlantirishlar va muvaffaqiyatli yozuvlarga ajratadi', () => {
      const res = ExamBulkImportService.validateQuestions([
        baseQuestion({ level: 'N5', difficulty: 'easy' }),
        baseQuestion({
          question: '別の日本語の問題文です。',
          explanation: '',
        }),
        {},
      ]);

      expect(res.totalCount).toBe(3);
      expect(res.audit.counts.total).toBe(3);
      expect(res.audit.errors).toHaveLength(1);
      expect(res.audit.warnings).toHaveLength(1);
      expect(res.audit.successful).toHaveLength(1);
      expect(res.audit.counts.errors).toBe(1);
      expect(res.audit.counts.warnings).toBe(1);
      expect(res.audit.counts.successful).toBe(1);
      expect(res.successfulCount).toBe(1);
    });
  });
});
