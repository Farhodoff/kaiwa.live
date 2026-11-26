import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AssessmentSummary } from '../AssessmentSummary';
import { TimedSkillAssessmentService } from '../../../services/TimedSkillAssessmentService';
vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({ user: { id: 'student-a' }, targetLevel: 'N3' }),
}));
vi.mock('../../../context/LanguageContext', () => ({ useLanguage: () => ({ language: 'uz' }) }));
describe('Measured assessments', () => {
  beforeEach(() => localStorage.clear());
  it('excludes other students, levels and skipped answers from accuracy', () => {
    const base = {
      level: 'N3' as const,
      skill: 'reading' as const,
      questionId: 'q',
      durationMs: 5000,
      skipped: false,
      correct: true,
    };
    TimedSkillAssessmentService.record(base, 'student-a');
    TimedSkillAssessmentService.record({ ...base, correct: false }, 'student-a');
    TimedSkillAssessmentService.record({ ...base, skipped: true, correct: false }, 'student-a');
    TimedSkillAssessmentService.record({ ...base, level: 'N5' }, 'student-a');
    TimedSkillAssessmentService.record(base, 'student-b');
    render(
      <MemoryRouter>
        <AssessmentSummary />
      </MemoryRouter>,
    );
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('2 ta javob')).toBeInTheDocument();
    expect(screen.getAllByText('Hali baholanmagan. Mashqni boshlang.')).toHaveLength(2);
  });
});
