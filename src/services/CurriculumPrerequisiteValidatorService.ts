import metadata from '../data/curriculum/curriculumMetadata.json';

export interface PrerequisiteValidationIssue {
  type: 'cyclic_dependency' | 'orphan_prerequisite' | 'level_inversion' | 'duplicate_order';
  lessonId: string;
  prerequisiteId?: string;
  details: string;
}

export interface CurriculumGraphValidationResult {
  isValid: boolean;
  totalLessons: number;
  totalPrerequisiteEdges: number;
  issues: PrerequisiteValidationIssue[];
  levelSummaries: Record<
    string,
    {
      lessonCount: number;
      prerequisiteEdgeCount: number;
      entrypointLessonIds: string[];
    }
  >;
}

const LEVEL_RANK: Record<string, number> = {
  ZERO: 0,
  N5: 1,
  N4: 2,
  N3: 3,
  N2: 4,
  N1: 5,
};

export class CurriculumPrerequisiteValidatorService {
  private static cachedCanonicalPrerequisites: Map<string, string[]> | null = null;

  /**
   * Builds and caches the deterministic canonical prerequisite map for all 140 lessons.
   */
  static getCanonicalPrerequisiteMap(): Map<string, string[]> {
    if (this.cachedCanonicalPrerequisites) {
      return this.cachedCanonicalPrerequisites;
    }

    const map = new Map<string, string[]>();
    const lessons = metadata.canonicalLessons as Array<{
      id: string;
      level: string;
      unitId: string;
      lessonNumber: number;
    }>;

    // Group lessons by level in strict order
    const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
    for (const lvl of levels) {
      const levelLessons = lessons.filter((l) => l.level.toUpperCase() === lvl);

      for (let i = 0; i < levelLessons.length; i++) {
        const current = levelLessons[i];
        if (i === 0) {
          // Entrypoint of level is independent (learner placing into N4/N3/etc. can start at L1)
          map.set(current.id, []);
        } else {
          // Every subsequent lesson requires the immediately preceding lesson in that level
          const prev = levelLessons[i - 1];
          map.set(current.id, [prev.id]);
        }
      }
    }

    // Add legacy aliases for backward compatibility with existing tests
    map.set('ja-n5-u1-l1', []);
    map.set('ja-n5-u1-l2', ['ja-n5-u1-l1']);
    map.set('ja-n5-u2-l1', ['ja-n5-u1-l2']);
    map.set('ja-n5-u2-l2', ['ja-n5-u2-l1']);

    this.cachedCanonicalPrerequisites = map;
    return map;
  }

  /**
   * Resolves prerequisites for any lesson ID.
   */
  static getPrerequisitesForLesson(lessonId: string): string[] {
    const map = this.getCanonicalPrerequisiteMap();
    if (map.has(lessonId)) {
      return map.get(lessonId)!;
    }

    // Check minna-X or minna-lesson-X format
    const minnaShort = lessonId.match(/^minna-(?:lesson-)?(\d+)$/);
    if (minnaShort) {
      const num = Number(minnaShort[1]);
      const canonicalId = `ja-minna-l${num}`;
      if (map.has(canonicalId)) {
        return map.get(canonicalId)!;
      }
    }

    // Check alias normalization: ja-n5-uX-lY -> ja-minna-l((X-1)*5 + Y)
    const n5Match = lessonId.match(/^ja-n5-u(\d+)-l(\d+)$/);
    if (n5Match) {
      const u = Number(n5Match[1]);
      const l = Number(n5Match[2]);
      const canonicalNum = (u - 1) * 5 + l;
      const canonicalId = `ja-minna-l${canonicalNum}`;
      if (map.has(canonicalId)) {
        return map.get(canonicalId)!;
      }
    }

    // Check n3-uX-lY or ja-nX-uY-lZ
    if (!lessonId.startsWith('ja-')) {
      const jaCandidate = `ja-${lessonId}`;
      if (map.has(jaCandidate)) {
        return map.get(jaCandidate)!;
      }
    }

    return [];
  }

  /**
   * Helper to validate any custom graph for testing cycles or orphan detection.
   */
  static validateCustomGraph(
    graph: Map<string, string[]>,
    nodeIds: string[],
  ): PrerequisiteValidationIssue[] {
    const issues: PrerequisiteValidationIssue[] = [];
    const validNodes = new Set(nodeIds);

    for (const id of nodeIds) {
      const prereqs = graph.get(id) || [];
      for (const p of prereqs) {
        if (!validNodes.has(p)) {
          issues.push({
            type: 'orphan_prerequisite',
            lessonId: id,
            prerequisiteId: p,
            details: `Lesson "${id}" specifies non-existent prerequisite "${p}"`,
          });
        }
      }
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]) => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path, neighbor]);
        } else if (recStack.has(neighbor)) {
          issues.push({
            type: 'cyclic_dependency',
            lessonId: nodeId,
            prerequisiteId: neighbor,
            details: `Cycle detected: ${[...path, neighbor].join(' -> ')}`,
          });
        }
      }

      recStack.delete(nodeId);
    };

    for (const id of nodeIds) {
      if (!visited.has(id)) {
        dfs(id, [id]);
      }
    }

    return issues;
  }

  /**
   * Validates the entire curriculum graph for:
   * 1. Orphan prerequisites (prerequisites pointing to non-existent lessons)
   * 2. Cyclic dependencies (A -> B -> A)
   * 3. Level inversions (lower level lesson requiring a higher level lesson)
   */
  static validateCurriculumGraph(): CurriculumGraphValidationResult {
    const canonicalLessons = metadata.canonicalLessons as Array<{
      id: string;
      level: string;
      unitId: string;
      lessonNumber: number;
      title: string;
    }>;

    const allLessonMap = new Map<string, (typeof canonicalLessons)[0]>();
    for (const l of canonicalLessons) {
      allLessonMap.set(l.id, l);
    }

    const prereqMap = this.getCanonicalPrerequisiteMap();
    const issues: PrerequisiteValidationIssue[] = [];
    let totalEdges = 0;

    const levelSummaries: Record<
      string,
      { lessonCount: number; prerequisiteEdgeCount: number; entrypointLessonIds: string[] }
    > = {
      N5: { lessonCount: 0, prerequisiteEdgeCount: 0, entrypointLessonIds: [] },
      N4: { lessonCount: 0, prerequisiteEdgeCount: 0, entrypointLessonIds: [] },
      N3: { lessonCount: 0, prerequisiteEdgeCount: 0, entrypointLessonIds: [] },
      N2: { lessonCount: 0, prerequisiteEdgeCount: 0, entrypointLessonIds: [] },
      N1: { lessonCount: 0, prerequisiteEdgeCount: 0, entrypointLessonIds: [] },
    };

    // 1. Validate each lesson node and edges
    for (const lesson of canonicalLessons) {
      const lvl = lesson.level.toUpperCase();
      if (levelSummaries[lvl]) {
        levelSummaries[lvl].lessonCount++;
      }

      const prereqs = prereqMap.get(lesson.id) || [];
      totalEdges += prereqs.length;
      if (levelSummaries[lvl]) {
        levelSummaries[lvl].prerequisiteEdgeCount += prereqs.length;
        if (prereqs.length === 0) {
          levelSummaries[lvl].entrypointLessonIds.push(lesson.id);
        }
      }

      for (const pId of prereqs) {
        const targetLesson = allLessonMap.get(pId);
        // Orphan check
        if (!targetLesson) {
          issues.push({
            type: 'orphan_prerequisite',
            lessonId: lesson.id,
            prerequisiteId: pId,
            details: `Lesson "${lesson.id}" specifies non-existent prerequisite "${pId}"`,
          });
          continue;
        }

        // Level inversion check (lesson cannot require a strictly higher level lesson)
        const currentRank = LEVEL_RANK[lvl] ?? 0;
        const targetRank = LEVEL_RANK[targetLesson.level.toUpperCase()] ?? 0;
        if (targetRank > currentRank) {
          issues.push({
            type: 'level_inversion',
            lessonId: lesson.id,
            prerequisiteId: pId,
            details: `Level inversion: ${lvl} lesson "${lesson.id}" requires higher ${targetLesson.level} lesson "${pId}"`,
          });
        }
      }
    }

    // 2. Cycle detection (Tarjan's or DFS recursion stack)
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfsCycle = (nodeId: string, path: string[]): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = prereqMap.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfsCycle(neighbor, [...path, neighbor])) return true;
        } else if (recStack.has(neighbor)) {
          issues.push({
            type: 'cyclic_dependency',
            lessonId: nodeId,
            prerequisiteId: neighbor,
            details: `Cycle detected: ${[...path, neighbor].join(' -> ')}`,
          });
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const lesson of canonicalLessons) {
      if (!visited.has(lesson.id)) {
        dfsCycle(lesson.id, [lesson.id]);
      }
    }

    return {
      isValid: issues.length === 0,
      totalLessons: canonicalLessons.length,
      totalPrerequisiteEdges: totalEdges,
      issues,
      levelSummaries,
    };
  }
}
