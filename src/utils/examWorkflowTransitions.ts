/**
 * Task 19 — strict workflow transition matrices.
 *
 * This module is the single source of truth for which status changes are
 * legal for exams and questions. Both the service layer
 * (ExamWorkflowService) and the database triggers
 * (20261027000000_task19_workflow_transition_enforcement.sql) mirror these
 * lists — keep them in sync.
 */

export type ExamWorkflowStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';
export type QuestionWorkflowStatus = 'draft' | 'review' | 'approved' | 'rejected';

export const EXAM_WORKFLOW_STATUSES: readonly ExamWorkflowStatus[] = [
  'draft',
  'review',
  'approved',
  'published',
  'archived',
];

export const QUESTION_WORKFLOW_STATUSES: readonly QuestionWorkflowStatus[] = [
  'draft',
  'review',
  'approved',
  'rejected',
];

/**
 * Legal exam transitions:
 *   draft      -> review
 *   review     -> draft | approved
 *   approved   -> published
 *   published  -> archived
 *   archived   -> draft
 *
 * Notably forbidden: draft -> published, draft -> approved,
 * review -> published, archived -> published, published -> draft.
 */
export const EXAM_TRANSITIONS: Record<ExamWorkflowStatus, readonly ExamWorkflowStatus[]> = {
  draft: ['review'],
  review: ['draft', 'approved'],
  approved: ['published'],
  published: ['archived'],
  archived: ['draft'],
};

/**
 * Legal question transitions:
 *   draft     -> review
 *   review    -> approved | rejected
 *   rejected  -> draft
 *   approved  -> (terminal at question level; the exam publish step owns it)
 */
export const QUESTION_TRANSITIONS: Record<
  QuestionWorkflowStatus,
  readonly QuestionWorkflowStatus[]
> = {
  draft: ['review'],
  review: ['approved', 'rejected'],
  rejected: ['draft'],
  approved: [],
};

export type TransitionActorPolicy = 'none' | 'reviewer' | 'admin';

/**
 * Who may perform each exam transition. 'reviewer' means reviewer or admin;
 * 'admin' means admin/superadmin only.
 */
export const EXAM_TRANSITION_ACTOR_POLICY: Record<string, TransitionActorPolicy> = {
  'draft->review': 'reviewer',
  'review->draft': 'reviewer',
  'review->approved': 'reviewer',
  'approved->published': 'admin',
  'published->archived': 'admin',
  'archived->draft': 'admin',
};

/**
 * Question review is available to reviewers and admins. Publishing questions
 * is driven by the exam publish step, not by a question-level transition.
 */
export const QUESTION_TRANSITION_ACTOR_POLICY: Record<string, TransitionActorPolicy> = {
  'draft->review': 'reviewer',
  'review->approved': 'reviewer',
  'review->rejected': 'reviewer',
  'rejected->draft': 'reviewer',
};

const examKey = (from: ExamWorkflowStatus, to: ExamWorkflowStatus) => `${from}->${to}`;
const questionKey = (from: QuestionWorkflowStatus, to: QuestionWorkflowStatus) => `${from}->${to}`;

export function isExamWorkflowStatus(value: unknown): value is ExamWorkflowStatus {
  return typeof value === 'string' && (EXAM_WORKFLOW_STATUSES as readonly string[]).includes(value);
}

export function isQuestionWorkflowStatus(value: unknown): value is QuestionWorkflowStatus {
  return (
    typeof value === 'string' && (QUESTION_WORKFLOW_STATUSES as readonly string[]).includes(value)
  );
}

export function canTransitionExam(from: ExamWorkflowStatus, to: ExamWorkflowStatus): boolean {
  if (!isExamWorkflowStatus(from) || !isExamWorkflowStatus(to)) return false;
  return EXAM_TRANSITIONS[from].includes(to);
}

export function canTransitionQuestion(
  from: QuestionWorkflowStatus,
  to: QuestionWorkflowStatus,
): boolean {
  if (!isQuestionWorkflowStatus(from) || !isQuestionWorkflowStatus(to)) return false;
  return QUESTION_TRANSITIONS[from].includes(to);
}

export function getExamTransitionActorPolicy(
  from: ExamWorkflowStatus,
  to: ExamWorkflowStatus,
): TransitionActorPolicy {
  return EXAM_TRANSITION_ACTOR_POLICY[examKey(from, to)] ?? 'none';
}

export function getQuestionTransitionActorPolicy(
  from: QuestionWorkflowStatus,
  to: QuestionWorkflowStatus,
): TransitionActorPolicy {
  return QUESTION_TRANSITION_ACTOR_POLICY[questionKey(from, to)] ?? 'none';
}

export function allowedExamTransitions(from: ExamWorkflowStatus): readonly ExamWorkflowStatus[] {
  return EXAM_TRANSITIONS[from] ?? [];
}

export function allowedQuestionTransitions(
  from: QuestionWorkflowStatus,
): readonly QuestionWorkflowStatus[] {
  return QUESTION_TRANSITIONS[from] ?? [];
}

function formatAllowed(allowed: readonly string[]): string {
  if (allowed.length === 0) return 'yo‘q (yakuniy holat)';
  return allowed.join(', ');
}

/**
 * Throws a precise, user-facing error when an exam transition is illegal.
 */
export function assertExamTransition(from: ExamWorkflowStatus, to: ExamWorkflowStatus): void {
  if (!isExamWorkflowStatus(from)) {
    throw new Error(`Noma’lum exam holati: "${from}".`);
  }
  if (!isExamWorkflowStatus(to)) {
    throw new Error(`Noma’lum exam maqsad holati: "${to}".`);
  }
  if (canTransitionExam(from, to)) return;
  throw new Error(
    `Noto‘g‘ri exam status o‘tishi: "${from}" → "${to}". ` +
      `"${from}" holatidan ruxsat etilgan o‘tishlar: ${formatAllowed(EXAM_TRANSITIONS[from])}.`,
  );
}

/**
 * Throws a precise, user-facing error when a question transition is illegal.
 */
export function assertQuestionTransition(
  from: QuestionWorkflowStatus,
  to: QuestionWorkflowStatus,
): void {
  if (!isQuestionWorkflowStatus(from)) {
    throw new Error(`Noma’lum savol holati: "${from}".`);
  }
  if (!isQuestionWorkflowStatus(to)) {
    throw new Error(`Noma’lum savol maqsad holati: "${to}".`);
  }
  if (canTransitionQuestion(from, to)) return;
  throw new Error(
    `Noto‘g‘ri savol status o‘tishi: "${from}" → "${to}". ` +
      `"${from}" holatidan ruxsat etilgan o‘tishlar: ${formatAllowed(QUESTION_TRANSITIONS[from])}.`,
  );
}
