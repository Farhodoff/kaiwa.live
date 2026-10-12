import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Curriculum Test & Practice Integrity Suite', () => {
  const levelsDir = path.resolve(__dirname, '../../data/curriculum/levels');
  const levelNames = ['n5', 'n4', 'n3', 'n2', 'n1'];

  it('validates that all curriculum levels have zero duplicate test questions', () => {
    const seenPrompts = new Map<string, string>();
    let totalQuestions = 0;
    const duplicates: { level: string; prompt: string; location: string }[] = [];

    for (const lvl of levelNames) {
      const lvlPath = path.join(levelsDir, lvl);
      if (!fs.existsSync(lvlPath)) continue;

      const files = fs.readdirSync(lvlPath).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        const content = JSON.parse(fs.readFileSync(path.join(lvlPath, file), 'utf-8'));
        if (!Array.isArray(content)) continue;

        for (const item of content) {
          if (item.steps) {
            // Lesson
            for (const step of item.steps) {
              if (step.type === 'test' && step.testData?.questions) {
                for (const q of step.testData.questions) {
                  totalQuestions++;
                  const norm = q.question
                    .trim()
                    .toLowerCase()
                    .replace(/[\s\u3000]+/g, ' ');
                  if (seenPrompts.has(norm)) {
                    duplicates.push({
                      level: lvl,
                      prompt: q.question,
                      location: `${file} -> lesson: ${item.id}`,
                    });
                  } else {
                    seenPrompts.set(norm, `${lvl}:${item.id}`);
                  }
                }
              }
            }
          }
        }
      }
    }

    expect(totalQuestions).toBeGreaterThan(1000);
    expect(duplicates).toEqual([]);
  });

  it('verifies that all test questions have valid options and correctAnswerIndex in bounds', () => {
    let totalValidated = 0;

    for (const lvl of levelNames) {
      const lvlPath = path.join(levelsDir, lvl);
      if (!fs.existsSync(lvlPath)) continue;

      const files = fs.readdirSync(lvlPath).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        const content = JSON.parse(fs.readFileSync(path.join(lvlPath, file), 'utf-8'));
        if (!Array.isArray(content)) continue;

        for (const item of content) {
          if (item.steps) {
            for (const step of item.steps) {
              if (step.type === 'test' && step.testData?.questions) {
                for (const q of step.testData.questions) {
                  totalValidated++;
                  expect(q.question.trim().length).toBeGreaterThan(0);
                  expect(q.options.length).toBeGreaterThanOrEqual(2);
                  expect(q.correctAnswerIndex).toBeGreaterThanOrEqual(0);
                  expect(q.correctAnswerIndex).toBeLessThan(q.options.length);
                  expect(q.explanation?.trim().length).toBeGreaterThan(0);
                }
              }
            }
          }
        }
      }
    }

    expect(totalValidated).toBeGreaterThan(1000);
  });

  it('verifies that all practice exercises have valid structures', () => {
    let totalPractice = 0;

    for (const lvl of levelNames) {
      const lvlPath = path.join(levelsDir, lvl);
      if (!fs.existsSync(lvlPath)) continue;

      const files = fs.readdirSync(lvlPath).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        const content = JSON.parse(fs.readFileSync(path.join(lvlPath, file), 'utf-8'));
        if (!Array.isArray(content)) continue;

        for (const item of content) {
          if (item.steps) {
            for (const step of item.steps) {
              if (step.type === 'practice' && step.practiceData?.exercises) {
                for (const ex of step.practiceData.exercises) {
                  totalPractice++;
                  expect(ex.prompt.trim().length).toBeGreaterThan(0);
                  if (ex.type === 'multiple-choice') {
                    expect(ex.options?.length).toBeGreaterThanOrEqual(2);
                    if (typeof ex.correctAnswer === 'number') {
                      expect(ex.correctAnswer).toBeGreaterThanOrEqual(0);
                      expect(ex.correctAnswer).toBeLessThan(ex.options!.length);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    expect(totalPractice).toBeGreaterThan(500);
  });
});
