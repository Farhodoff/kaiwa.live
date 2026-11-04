import { LearningRoadmap, RoadmapLessonNode, NodeStatus } from '../types/curriculum';
import { SkillWeakness, MasterySkill } from '../types/mastery';

/**
 * Phase 19 — Single next-lesson decision ladder.
 *
 * This is the ONE and only implementation of "which lesson next". Every
 * consumer (LearningProgressionService, RoadmapService, LearningPathEngine,
 * Dashboard, Roadmap, Personal Plan) must route through this resolver.
 *
 * Exclusion filters (implicit in roadmap construction + explicit here):
 *   1. blocked / locked (prerequisite not met or future level)
 *   2. completed
 *   3. skipped
 *   (language + level are already enforced by roadmap construction)
 *
 * Priority ladder:
 *   6. weak-skill remediation (highest-severity weak skill, score < 50)
 *   7. in-progress lesson
 *   8. current progression lesson
 *   9. available lesson (includes weak-flagged)
 *  10. safe fallback (first accessible lesson anywhere)
 *   —  none if nothing remains
 */

export type NextLessonBucket =
  'remediation' | 'in_progress' | 'current' | 'available' | 'fallback' | 'none';

export interface NextLessonResult {
  lesson: RoadmapLessonNode | null;
  bucket: NextLessonBucket;
  reason: string;
  priority: number;
}

const ACCESSIBLE_STATUSES: ReadonlySet<NodeStatus> = new Set([
  'in_progress',
  'current',
  'weak',
  'available',
]);

/** Flatten all lesson nodes in roadmap order. */
function flattenLessons(roadmap: LearningRoadmap): RoadmapLessonNode[] {
  const out: RoadmapLessonNode[] = [];
  for (const level of roadmap.levels) {
    for (const unit of level.units) {
      for (const lesson of unit.lessons) {
        out.push(lesson);
      }
    }
  }
  return out;
}

/**
 * Resolve the single next lesson from an already-built roadmap.
 * Pure function: no storage access, no side effects.
 */
export function resolveNextLesson(
  roadmap: LearningRoadmap,
  topWeaknesses: SkillWeakness[] = [],
): NextLessonResult {
  const all = flattenLessons(roadmap);

  const accessible = all.filter((l) => ACCESSIBLE_STATUSES.has(l.status));
  const inProgress = accessible.filter((l) => l.status === 'in_progress');
  const current = accessible.filter((l) => l.status === 'current');
  const available = accessible.filter((l) => l.status === 'available' || l.status === 'weak');

  // Priority 1: remediation for the highest-severity weak skill
  // (severity is computed by WeaknessEngine: high = score<50 or declining below 75)
  const highSeverity = (topWeaknesses || []).filter((w) => w.severity === 'high');
  if (highSeverity.length > 0) {
    const targetSkills: MasterySkill[] = highSeverity.map((w) => w.skill);
    for (const skill of targetSkills) {
      const match = accessible.find((l) => l.skill === skill);
      if (match) {
        return {
          lesson: match,
          bucket: 'remediation',
          reason: `Weak-skill remediation for ${skill}`,
          priority: 90,
        };
      }
    }
  }

  // Priority 2: in-progress
  if (inProgress.length > 0) {
    return {
      lesson: inProgress[0],
      bucket: 'in_progress',
      reason: 'Resume in-progress lesson',
      priority: 80,
    };
  }

  // Priority 3: current
  if (current.length > 0) {
    return {
      lesson: current[0],
      bucket: 'current',
      reason: 'Next lesson at current level',
      priority: 70,
    };
  }

  // Priority 4: available
  if (available.length > 0) {
    return {
      lesson: available[0],
      bucket: 'available',
      reason: 'Next available lesson',
      priority: 60,
    };
  }

  // Priority 5: safe fallback — first accessible lesson anywhere
  if (accessible.length > 0) {
    return { lesson: accessible[0], bucket: 'fallback', reason: 'Fallback lesson', priority: 50 };
  }

  return { lesson: null, bucket: 'none', reason: 'No accessible lesson', priority: 0 };
}
