import { describe, it, expect } from 'vitest';
import {
  N1_EDITORIAL_SHASETSU,
  N1_ACADEMIC_ARTICLES,
  N1_BUSINESS_CORRESPONDENCE,
  N1_KEIGO_VERB_MATRIX,
  N1_NIJYUU_KEIGO_TRAPS,
  N1_KEIGO_DRILLS,
  N1_NUANCE_COMPARISONS,
  N1_INFERENCE_QUESTIONS,
  getAllN1ReadingPassages,
} from '../../data/n1AdvancedContent';
import { CustomContentService } from '../CustomContentService';

describe('N1 Advanced Pedagogical Content Suite Tests', () => {
  describe('1. Editorial & Shasetsu (社説・論説) Tests', () => {
    it('contains authentic Shasetsu editorial articles with rich metadata', () => {
      expect(N1_EDITORIAL_SHASETSU.length).toBeGreaterThanOrEqual(3);

      for (const ed of N1_EDITORIAL_SHASETSU) {
        expect(ed.id).toMatch(/^n1_shasetsu_/);
        expect(ed.title).toContain('['); // contains Furigana notation
        expect(ed.japaneseContent.length).toBeGreaterThan(150);
        expect(ed.uzbekTranslation.length).toBeGreaterThan(100);
        expect(ed.keyThemeUz.length).toBeGreaterThan(20);
        expect(ed.recommendedMinutes).toBeGreaterThanOrEqual(5);
        expect(ed.vocabularyHighlights.length).toBeGreaterThanOrEqual(3);

        for (const vocab of ed.vocabularyHighlights) {
          expect(vocab.word).toBeTruthy();
          expect(vocab.reading).toBeTruthy();
          expect(vocab.meaningUz).toBeTruthy();
          expect(vocab.nuanceNote).toBeTruthy();
        }

        expect(ed.questions.length).toBeGreaterThanOrEqual(1);
        for (const q of ed.questions) {
          expect(q.id).toBeTruthy();
          expect(q.questionText).toBeTruthy();
          expect(q.options.length).toBe(4);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(4);
          expect(q.explanation.length).toBeGreaterThan(10);
        }
      }
    });
  });

  describe('2. Academic & Philosophical Articles (学術・論文) Tests', () => {
    it('contains long-form academic articles with dialectic framework and terminology', () => {
      expect(N1_ACADEMIC_ARTICLES.length).toBeGreaterThanOrEqual(2);

      for (const acad of N1_ACADEMIC_ARTICLES) {
        expect(acad.id).toMatch(/^n1_acad_/);
        expect(acad.title).toBeTruthy();
        expect(acad.japaneseContent.length).toBeGreaterThan(150);
        expect(acad.uzbekTranslation.length).toBeGreaterThan(100);
        expect(acad.thesisSummaryUz.length).toBeGreaterThan(15);
        expect(acad.counterArgumentUz.length).toBeGreaterThan(15);
        expect(acad.synthesisUz.length).toBeGreaterThan(15);
        expect(acad.academicTerminology.length).toBeGreaterThanOrEqual(3);

        for (const term of acad.academicTerminology) {
          expect(term.term).toBeTruthy();
          expect(term.reading).toBeTruthy();
          expect(term.definitionUz.length).toBeGreaterThan(10);
        }

        expect(acad.questions.length).toBeGreaterThanOrEqual(1);
        for (const q of acad.questions) {
          expect(q.options.length).toBe(4);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(4);
          expect(q.explanation).toBeTruthy();
        }
      }
    });
  });

  describe('3. Business Correspondence & Contracts (ビジネス・契約書) Tests', () => {
    it('contains official business email scenarios and contract clauses', () => {
      expect(N1_BUSINESS_CORRESPONDENCE.length).toBeGreaterThanOrEqual(2);

      const apologyScenario = N1_BUSINESS_CORRESPONDENCE.find(
        (b) => b.category === 'apology_shazai',
      );
      expect(apologyScenario).toBeDefined();
      expect(apologyScenario?.japaneseContent).toContain('拝啓');
      expect(apologyScenario?.japaneseContent).toContain('敬具');
      expect(apologyScenario?.etiquetteNotesUz.length).toBeGreaterThanOrEqual(2);

      const contractScenario = N1_BUSINESS_CORRESPONDENCE.find(
        (b) => b.category === 'contract_clause',
      );
      expect(contractScenario).toBeDefined();
      expect(contractScenario?.contractClauses).toBeDefined();
      expect(contractScenario?.contractClauses?.length).toBeGreaterThanOrEqual(2);

      for (const scenario of N1_BUSINESS_CORRESPONDENCE) {
        expect(scenario.correctionDrills.length).toBeGreaterThanOrEqual(1);
        for (const drill of scenario.correctionDrills) {
          expect(drill.inappropriateSentence).toBeTruthy();
          expect(drill.options.length).toBe(4);
          expect(drill.correctIndex).toBeGreaterThanOrEqual(0);
          expect(drill.correctIndex).toBeLessThan(4);
          expect(drill.explanationUz).toBeTruthy();
        }
      }
    });
  });

  describe('4. Complex Keigo System (至高の敬語) Tests', () => {
    it('verifies Keigo verb matrix has Sonkeigo, Kenjougo I, and Teichougo', () => {
      expect(N1_KEIGO_VERB_MATRIX.length).toBeGreaterThanOrEqual(8);

      for (const row of N1_KEIGO_VERB_MATRIX) {
        expect(row.baseVerb).toBeTruthy();
        expect(row.sonkeigo).toBeTruthy();
        expect(row.kenjougoI).toBeTruthy();
        expect(row.kenjougoII).toBeTruthy();
        expect(row.teineigo).toBeTruthy();
        expect(row.criticalPitfallUz).toBeTruthy();
      }
    });

    it('validates common Nijyuu Keigo traps and correction pairs', () => {
      expect(N1_NIJYUU_KEIGO_TRAPS.length).toBeGreaterThanOrEqual(5);

      for (const trap of N1_NIJYUU_KEIGO_TRAPS) {
        expect(trap.incorrectSentence).toBeTruthy();
        expect(trap.correctSentence).toBeTruthy();
        expect(trap.trapType).toBeTruthy();
        expect(trap.explanationUz.length).toBeGreaterThan(15);
      }
    });

    it('ensures Keigo situational drills test realistic corporate etiquette', () => {
      expect(N1_KEIGO_DRILLS.length).toBeGreaterThanOrEqual(3);

      for (const drill of N1_KEIGO_DRILLS) {
        expect(drill.scenarioUz).toBeTruthy();
        expect(drill.speakerRole).toBeTruthy();
        expect(drill.listenerRole).toBeTruthy();
        expect(drill.options.length).toBe(4);
        expect(drill.correctIndex).toBeGreaterThanOrEqual(0);
        expect(drill.correctIndex).toBeLessThan(4);
        expect(drill.explanationUz).toBeTruthy();
      }
    });
  });

  describe('5. Synonym & Nuance Comparison (類義語・ニュアンス) Tests', () => {
    it('contains comprehensive confusing N1 expressions with comparative details', () => {
      expect(N1_NUANCE_COMPARISONS.length).toBeGreaterThanOrEqual(4);

      for (const item of N1_NUANCE_COMPARISONS) {
        expect(item.expressions.length).toBeGreaterThanOrEqual(2);
        expect(item.coreDifferenceUz.length).toBeGreaterThan(20);
        expect(item.comparativeDetails.length).toBe(item.expressions.length);

        for (const detail of item.comparativeDetails) {
          expect(detail.expression).toBeTruthy();
          expect(detail.exactNuanceUz).toBeTruthy();
          expect(detail.collocations.length).toBeGreaterThanOrEqual(1);
          expect(detail.exampleJp).toBeTruthy();
          expect(detail.exampleUz).toBeTruthy();
        }

        expect(item.drillQuestion.options.length).toBe(4);
        expect(item.drillQuestion.correctIndex).toBeGreaterThanOrEqual(0);
        expect(item.drillQuestion.correctIndex).toBeLessThan(4);
        expect(item.drillQuestion.explanationUz).toBeTruthy();
      }
    });
  });

  describe('6. Implicit Meaning & Contextual Inference (言外の意味・推論) Tests', () => {
    it('validates tricky inference questions have exactly one correct option and categorized trap distractors', () => {
      expect(N1_INFERENCE_QUESTIONS.length).toBeGreaterThanOrEqual(2);

      for (const inf of N1_INFERENCE_QUESTIONS) {
        expect(inf.passageTitle).toBeTruthy();
        expect(inf.inferenceTheme).toBeTruthy();
        expect(inf.passageJp.length).toBeGreaterThan(100);
        expect(inf.passageUz.length).toBeGreaterThan(50);
        expect(inf.logicalProofChainUz.length).toBeGreaterThan(30);

        expect(inf.options.length).toBe(4);
        const correctOptions = inf.options.filter((o) => o.isCorrect);
        expect(correctOptions.length).toBe(1);

        for (const opt of inf.options) {
          expect(opt.textJp).toBeTruthy();
          expect(opt.textUz).toBeTruthy();
          expect(opt.trapType).toBeTruthy();
          expect(opt.distractorRationaleUz.length).toBeGreaterThan(10);
        }
      }
    });
  });

  describe('7. Helper & Integration Tests', () => {
    it('converts editorial and academic passages into valid JlptReadingPassage objects', () => {
      const converted = getAllN1ReadingPassages();
      expect(converted.length).toBe(N1_EDITORIAL_SHASETSU.length + N1_ACADEMIC_ARTICLES.length);

      for (const p of converted) {
        expect(p.level).toBe('N1');
        expect(p.id).toBeTruthy();
        expect(p.title).toBeTruthy();
        expect(p.japaneseContent).toBeTruthy();
        expect(p.uzbekTranslation).toBeTruthy();
        expect(p.questions.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('CustomContentService seamlessly includes N1 advanced passages in getMergedReadingPassages("N1")', () => {
      const merged = CustomContentService.getMergedReadingPassages('N1');
      expect(merged.length).toBeGreaterThanOrEqual(
        14 + N1_EDITORIAL_SHASETSU.length + N1_ACADEMIC_ARTICLES.length,
      );

      const foundShasetsu = merged.find((p) => p.id === 'n1_shasetsu_1');
      expect(foundShasetsu).toBeDefined();

      const foundAcademic = merged.find((p) => p.id === 'n1_acad_1');
      expect(foundAcademic).toBeDefined();
    });
  });
});
