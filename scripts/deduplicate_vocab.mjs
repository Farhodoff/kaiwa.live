import fs from 'fs';
import path from 'path';

function deduplicateLevel(level) {
  const filePath = path.resolve(`src/data/vocab/jlptVocab${level}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const wordMap = new Map();
  const deduped = [];
  const removedReport = [];

  data.forEach((item) => {
    const key = item.word.trim();
    if (wordMap.has(key)) {
      const existing = wordMap.get(key);

      // Merge examples
      const existingExamples = existing.examples || [];
      const newExamples = item.examples || [];
      const allExamples = [...existingExamples];

      newExamples.forEach((ne) => {
        if (!allExamples.some((ee) => ee.ja === ne.ja)) {
          allExamples.push(ne);
        }
      });
      existing.examples = allExamples;

      // Keep richer Uzbek meaning if available
      if (item.meaningUz && (!existing.meaningUz || existing.meaningUz.length < item.meaningUz.length)) {
        existing.meaningUz = item.meaningUz;
      }

      removedReport.push({ word: key, keptId: existing.id, removedId: item.id });
    } else {
      wordMap.set(key, item);
      deduped.push(item);
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(deduped, null, 2) + '\n', 'utf8');
  console.log(`[${level}] Original: ${data.length} -> Deduped: ${deduped.length} (Removed ${removedReport.length} duplicates)`);
  removedReport.forEach((r) => console.log(`  - Word: ${r.word} (kept: ${r.keptId}, removed: ${r.removedId})`));
  return deduped.length;
}

console.log('=== JLPT Vocabulary Deduplication Pipeline ===\n');
deduplicateLevel('N3');
console.log('');
deduplicateLevel('N2');
console.log('\n=== Deduplication Complete ===');
