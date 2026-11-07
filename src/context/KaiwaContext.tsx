/**
 * KaiwaContext
 * Re-exports the global Kaiwa application state, provider, and hooks.
 */

export * from './StudyPlannerContext';
export {
  StudyPlannerContext as KaiwaContext,
  StudyPlannerProvider as KaiwaProvider,
  useStudyData as useKaiwaData,
  useOptionalStudyData as useOptionalKaiwaData,
} from './StudyPlannerContext';
