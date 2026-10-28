import { describe, expect, it } from 'vitest';
import { JAPANESE_N2_LESSONS } from '../japaneseN2';

describe('JLPT N2 curriculum structure', () => {
  it('contains 30 sequential lessons arranged as 6 units of 5 lessons', () => {
    expect(JAPANESE_N2_LESSONS).toHaveLength(30);

    JAPANESE_N2_LESSONS.forEach((lesson, index) => {
      const lessonNumber = index + 1;
      const unitNumber = Math.floor(index / 5) + 1;
      const lessonInUnit = (index % 5) + 1;

      expect(lesson.lessonNumber).toBe(lessonNumber);
      expect(lesson.id).toBe(`ja-n2-u${unitNumber}-l${lessonInUnit}`);
      expect(lesson.unitId).toBe(`ja-n2-u${unitNumber}`);
      expect(lesson.courseId).toBe('japanese-n2');
      expect(lesson.language).toBe('ja');
      expect(lesson.level).toBe('N2');
    });

    const unitCounts = JAPANESE_N2_LESSONS.reduce<Record<string, number>>((counts, lesson) => {
      counts[lesson.unitId] = (counts[lesson.unitId] ?? 0) + 1;
      return counts;
    }, {});

    expect(unitCounts).toEqual({
      'ja-n2-u1': 5,
      'ja-n2-u2': 5,
      'ja-n2-u3': 5,
      'ja-n2-u4': 5,
      'ja-n2-u5': 5,
      'ja-n2-u6': 5,
    });
  });

  it('uses a complete learn, practice and test flow in every lesson', () => {
    for (const lesson of JAPANESE_N2_LESSONS) {
      expect(lesson.steps.map((step) => step.type)).toEqual(['learn', 'practice', 'test']);
      expect(lesson.steps[0].learnData).toBeDefined();
      expect(lesson.steps[1].practiceData?.exercises.length).toBeGreaterThanOrEqual(2);
      expect(lesson.steps[2].testData?.questions.length).toBeGreaterThanOrEqual(4);

      const stepDuration = lesson.steps.reduce((total, step) => total + step.estimatedMinutes, 0);
      expect(stepDuration).toBe(lesson.estimatedDurationMinutes);
    }
  });

  it('keeps graduation language only at the end and avoids duplicate lesson titles', () => {
    const titles = JAPANESE_N2_LESSONS.map((lesson) => lesson.title);
    expect(new Set(titles).size).toBe(titles.length);

    for (const lesson of JAPANESE_N2_LESSONS.slice(0, -1)) {
      expect(lesson.title).not.toMatch(/graduation|official|N1 transition/i);
    }

    expect(JAPANESE_N2_LESSONS[9].title).toContain('Checkpoint');
    expect(JAPANESE_N2_LESSONS[28].title).toContain('Mini Mock');
    expect(JAPANESE_N2_LESSONS[29].title).toContain('Final Assessment');
  });

  it('does not repeat the dedicated 〜っこない lesson', () => {
    const dedicatedKkonaiLessons = JAPANESE_N2_LESSONS.filter((lesson) =>
      lesson.title.startsWith('〜っこない'),
    );

    expect(dedicatedKkonaiLessons).toHaveLength(0);
    expect(JAPANESE_N2_LESSONS[13].title).toContain('〜ものの');
  });

  it('uses real N2 audio assets in listening lessons', () => {
    const listeningLessons = JAPANESE_N2_LESSONS.filter((lesson) =>
      lesson.title.match(/Listening|Choukai|聴解/i),
    );

    expect(listeningLessons).toHaveLength(2);

    for (const lesson of listeningLessons) {
      const exercises = lesson.steps.flatMap((step) => step.practiceData?.exercises ?? []);
      const questions = lesson.steps.flatMap((step) => step.testData?.questions ?? []);
      const audioItems = [...exercises, ...questions].filter((item) => item.audioUrl);

      expect(audioItems).toHaveLength(6);
      for (const item of audioItems) {
        expect(item.audioUrl).toMatch(/^\/audio\/choukai\/n2\/Track\d{2}\.mp3$/);
        expect(item.audioTitle).toContain('N2 Track');
      }
    }
  });

  it('does not reuse identical practice prompts across different lessons', () => {
    const prompts = JAPANESE_N2_LESSONS.flatMap((lesson) =>
      lesson.steps.flatMap((step) =>
        (step.practiceData?.exercises ?? []).map((exercise) => exercise.prompt),
      ),
    );

    expect(new Set(prompts).size).toBe(prompts.length);
  });

  it('contains zero dummy/placeholder distractors and maintains realistic answer diversity', () => {
    const forbiddenPhrases = [
      "Umuman aloqasi bo'lmagan so'z",
      "Faqat bolalar o'rtasidagi so'zlashuvda qo'llaniladi",
      "Faqat o'tmish zamondagi shaxsiy hissiyotlar uchun ishlatiladi",
      "Ushbu masala bo'yicha yakuniy qaror qabul qilinmadi",
      "Ertaga ertalabdan boshlab yomg'ir yog'ishi kutilmoqda",
      '日本語を 毎日 勉強します',
    ];

    for (const lesson of JAPANESE_N2_LESSONS) {
      const serialized = JSON.stringify(lesson);
      for (const phrase of forbiddenPhrases) {
        expect(serialized).not.toContain(phrase);
      }

      const testStep = lesson.steps.find((s) => s.type === 'test');
      expect(testStep?.testData?.questions).toBeDefined();

      const questions = testStep!.testData!.questions;
      expect(questions.length).toBeGreaterThanOrEqual(4);

      // Verify each question has valid options, valid index, and non-empty explanation
      for (const q of questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(4);
        expect(q.correctAnswerIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctAnswerIndex).toBeLessThan(q.options.length);
        expect(q.explanation?.trim().length).toBeGreaterThan(10);
      }

      // Ensure no lesson has a completely monotonous answer key (e.g. all 0s)
      const answerIndices = questions.map((q) => q.correctAnswerIndex);
      const uniqueIndices = new Set(answerIndices);
      expect(uniqueIndices.size).toBeGreaterThan(1);
    }
  });
});
