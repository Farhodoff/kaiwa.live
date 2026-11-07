import n1 from '../data/curriculum/levels/n1/japaneseLessons.json';
import n2 from '../data/curriculum/levels/n2/japaneseLessons.json';
import n3 from '../data/curriculum/levels/n3/japaneseLessons.json';
import n4 from '../data/curriculum/levels/n4/minnaLessons.json';
import n5 from '../data/curriculum/levels/n5/minnaLessons.json';
import { auditCurriculumContent, type ContentQualityIssue } from '../data/curriculum/contentQuality';
import { supabase } from '../lib/supabase';
import type { Lesson, PracticeExercise, TestQuestion } from '../types/lesson';

export type CurriculumIssueStatus =
  | 'detected' | 'triaged' | 'assigned' | 'in_progress' | 'ready_for_review'
  | 'expert_approved' | 'published' | 'rejected' | 'reopened' | 'quarantined';

export interface CurriculumQueueIssue {
  id: string; external_id: string; level: string; lesson_id: string; exercise_id: string;
  prompt: string; issue_code: string; severity: 'critical' | 'high' | 'medium' | 'low';
  status: CurriculumIssueStatus; owner_id: string | null; owner_name: string | null;
  updated_at: string; original_content: Record<string, unknown>; source_file: string;
  source_hash: string; active: boolean;
}

export interface QueueRevisionValidation { valid: boolean; errors: string[] }
type RawItem = PracticeExercise | TestQuestion;
type IndexedItem = { item: RawItem; level: string; sourceFile: string };

const sources = [
  { level: 'N5', sourceFile: 'src/data/curriculum/levels/n5/minnaLessons.json', lessons: n5 as unknown as Lesson[] },
  { level: 'N4', sourceFile: 'src/data/curriculum/levels/n4/minnaLessons.json', lessons: n4 as unknown as Lesson[] },
  { level: 'N3', sourceFile: 'src/data/curriculum/levels/n3/japaneseLessons.json', lessons: n3 as unknown as Lesson[] },
  { level: 'N2', sourceFile: 'src/data/curriculum/levels/n2/japaneseLessons.json', lessons: n2 as unknown as Lesson[] },
  { level: 'N1', sourceFile: 'src/data/curriculum/levels/n1/japaneseLessons.json', lessons: n1 as unknown as Lesson[] },
] as const;

const stableHash = (value: unknown) => {
  const text = JSON.stringify(value); let result = 5381;
  for (let i = 0; i < text.length; i += 1) result = (result * 33) ^ text.charCodeAt(i);
  return (result >>> 0).toString(16);
};
const promptFor = (item: RawItem) => ('prompt' in item ? item.prompt : item.question) || '';
const severityFor = (issue: ContentQualityIssue): CurriculumQueueIssue['severity'] =>
  issue.code === 'invalid_correct_answer' ? 'critical' : issue.severity === 'error' ? 'high' : 'medium';

function buildItemIndex(): Map<string, IndexedItem> {
  const index = new Map<string, IndexedItem>();
  for (const source of sources) for (const lesson of source.lessons) for (const step of lesson.steps) {
    const items = [...(step.practiceData?.exercises ?? []), ...(step.testData?.questions ?? [])];
    for (const item of items) index.set(item.id, { item, level: source.level, sourceFile: source.sourceFile });
  }
  return index;
}

export function validateRevisionDraft(content: Record<string, unknown>): QueueRevisionValidation {
  const errors: string[] = [];
  const prompt = String(content.prompt ?? content.question ?? '').trim();
  const options = Array.isArray(content.options) ? content.options.map(String) : [];
  if (!prompt) errors.push('Savol matni kiritilishi kerak.');
  if (options.length < 2) errors.push('Kamida ikki variant kerak.');
  if (new Set(options.map((value) => value.trim())).size !== options.length) errors.push('Variantlar takrorlanmasligi kerak.');
  const answer = content.correctAnswer; const answerIndex = content.correctAnswerIndex;
  if (typeof answerIndex === 'number' && (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length)) errors.push('To‘g‘ri javob indeksi variantlarga mos emas.');
  if (answer !== undefined && !options.includes(String(answer))) errors.push('To‘g‘ri javob variantlardan biri bo‘lishi kerak.');
  if (answer === undefined && answerIndex === undefined) errors.push('To‘g‘ri javob belgilanmagan.');
  if (!String(content.explanation ?? '').trim()) errors.push('Izoh kiritilishi kerak.');
  return { valid: errors.length === 0, errors };
}

export function filterQueueIssues(issues: CurriculumQueueIssue[], query: string, level: string, status: string) {
  const needle = query.trim().toLowerCase();
  return issues.filter((issue) => (!level || issue.level === level) && (!status || issue.status === status) && (!needle || [issue.lesson_id, issue.exercise_id, issue.prompt, issue.issue_code, issue.owner_name ?? ''].join(' ').toLowerCase().includes(needle)));
}

export class CurriculumQualityQueueService {
  static buildSyncPayload() {
    const index = buildItemIndex();
    const report = auditCurriculumContent(sources.flatMap((source) => source.lessons));
    return Object.values(report.levels).flatMap(({ issues }) => issues.filter((issue) => issue.severity === 'error').flatMap((issue) => {
      const found = index.get(issue.itemId); if (!found) return [];
      return [{ external_id: `${issue.lessonId}:${issue.itemId}:${issue.code}`, level: found.level, lesson_id: issue.lessonId, exercise_id: issue.itemId, prompt: promptFor(found.item), issue_code: issue.code, severity: severityFor(issue), source_file: found.sourceFile, source_hash: stableHash(found.item), original_content: found.item }];
    }));
  }

  static async sync(): Promise<number> {
    const { data, error } = await supabase.rpc('sync_curriculum_quality_issues', { p_issues: this.buildSyncPayload() });
    if (error) throw error; return Number(data ?? 0);
  }
  static async list(): Promise<CurriculumQueueIssue[]> {
    const { data, error } = await supabase.from('curriculum_quality_issues').select('*').eq('active', true).order('updated_at', { ascending: false });
    if (error) throw error; return (data ?? []) as CurriculumQueueIssue[];
  }
  static async transition(issueId: string, status: CurriculumIssueStatus, reason?: string, ownerName?: string, contentVersion?: string): Promise<void> {
    const { error } = await supabase.rpc('transition_curriculum_quality_issue', { p_issue_id: issueId, p_status: status, p_reason: reason || null, p_owner_id: null, p_owner_name: ownerName || null, p_content_version: contentVersion || null });
    if (error) throw error;
  }
  static async createRevision(issueId: string, content: Record<string, unknown>, validation: QueueRevisionValidation, notes?: string): Promise<void> {
    const { error } = await supabase.rpc('create_curriculum_quality_revision', { p_issue_id: issueId, p_proposed_content: content, p_validation_result: validation, p_notes: notes || null });
    if (error) throw error;
  }
}
