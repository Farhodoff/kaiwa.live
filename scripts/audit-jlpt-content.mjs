import fs from 'node:fs';
import path from 'node:path';

const placeholder =
  /^(文脈に合わない表現|文脈と無関係な文|本文にない情報である|文法的に不自然な表現|意味が異なる表現|意味の異なる文|文法の誤った文|反対の内容である|文法形式だけを述べた選択肢)$/;
const root = process.cwd();
const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
const levelPath = (level) =>
  path.join(
    root,
    'src',
    'data',
    'curriculum',
    'levels',
    level.toLowerCase(),
    level === 'N5' || level === 'N4' ? 'minnaLessons.json' : 'japaneseLessons.json',
  );
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ');
const issues = [];
const knownIds = new Set();
const knownPrompts = new Set();
const report = {
  generatedAt: new Date().toISOString(),
  levels: {},
  totals: { lessons: 0, items: 0, quarantined: 0, issues: 0 },
  linguisticReviewRequired: true,
};

for (const level of levels) {
  const lessons = JSON.parse(fs.readFileSync(levelPath(level), 'utf8'));
  const result = { lessons: lessons.length, items: 0, quarantined: 0, issues: [] };
  for (const lesson of lessons)
    for (const [stepIndex, step] of lesson.steps.entries()) {
      const itemList = step.practiceData?.exercises ?? step.testData?.questions ?? [];
      for (const [itemIndex, item] of itemList.entries()) {
        result.items++;
        const itemIssues = [];
        const options = item.options ?? [];
        const itemId = item.id || '<missing>';
        const prompt = normalize(item.prompt ?? item.question);
        const prefix = {
          level,
          lessonId: lesson.id,
          itemId,
          path: `steps[${stepIndex}][${itemIndex}]`,
        };
        if (options.some((option) => placeholder.test(normalize(option))))
          itemIssues.push({ ...prefix, code: 'placeholder_option', severity: 'error' });
        if (new Set(options.map(normalize)).size !== options.length)
          itemIssues.push({ ...prefix, code: 'duplicate_option', severity: 'error' });
        const answerValid =
          'correctAnswerIndex' in item
            ? Number.isInteger(item.correctAnswerIndex) &&
              item.correctAnswerIndex >= 0 &&
              item.correctAnswerIndex < options.length
            : typeof item.correctAnswer === 'number'
              ? item.correctAnswer >= 0 && item.correctAnswer < options.length
              : options.includes(item.correctAnswer);
        if (!answerValid)
          itemIssues.push({ ...prefix, code: 'invalid_correct_answer', severity: 'error' });
        if (!item.explanation?.trim())
          itemIssues.push({ ...prefix, code: 'missing_explanation', severity: 'review' });
        if (knownIds.has(itemId))
          itemIssues.push({ ...prefix, code: 'duplicate_item_id', severity: 'error' });
        knownIds.add(itemId);
        if (prompt && knownPrompts.has(prompt))
          itemIssues.push({ ...prefix, code: 'duplicate_prompt', severity: 'review' });
        knownPrompts.add(prompt);
        if (itemIssues.some((issue) => issue.severity === 'error')) result.quarantined++;
        result.issues.push(...itemIssues);
      }
    }
  report.levels[level] = result;
  report.totals.lessons += result.lessons;
  report.totals.items += result.items;
  report.totals.quarantined += result.quarantined;
  report.totals.issues += result.issues.length;
}

const output = process.argv[2];
const json = `${JSON.stringify(report, null, 2)}\n`;
if (output) fs.writeFileSync(path.resolve(output), json);
else process.stdout.write(json);
