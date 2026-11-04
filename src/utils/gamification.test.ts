import { describe, expect, it } from 'vitest';
import { getLevelInfo, LEVELS } from './gamification';

describe('Gamification Utils', () => {
  describe('getLevelInfo', () => {
    it('should return level 1 for 0 XP', () => {
      const result = getLevelInfo(0);
      expect(result.level).toBe(1);
      expect(result.title).toBe("Boshlang'ich Talaba");
      expect(result.currentXp).toBe(0);
      expect(result.progress).toBe(0);
    });

    it('should return level 1 for XP below level 2 threshold', () => {
      const result = getLevelInfo(250);
      expect(result.level).toBe(1);
      expect(result.currentXp).toBe(250);
      expect(result.nextLevelXp).toBe(500);
      expect(result.xpToNext).toBe(250);
      // Progress: (250 - 0) / (500 - 0) * 100 = 50%
      expect(result.progress).toBe(50);
    });

    it('should return level 2 at exactly 500 XP', () => {
      const result = getLevelInfo(500);
      expect(result.level).toBe(2);
      expect(result.title).toBe('Shogird');
      expect(result.currentXp).toBe(500);
      expect(result.nextLevelXp).toBe(1500);
    });

    it('should calculate progress correctly for mid-level XP', () => {
      const result = getLevelInfo(1000);
      expect(result.level).toBe(2);
      // Progress: (1000 - 500) / (1500 - 500) * 100 = 50%
      expect(result.progress).toBe(50);
      expect(result.xpToNext).toBe(500);
    });

    it('should return level 5 for 5000 XP', () => {
      const result = getLevelInfo(5000);
      expect(result.level).toBe(5);
      expect(result.title).toBe('Ekspert');
      expect(result.currentXp).toBe(5000);
    });

    it('should return max level (8) for XP above max threshold', () => {
      const result = getLevelInfo(25000);
      expect(result.level).toBe(8);
      expect(result.title).toBe('Professor');
      expect(result.progress).toBe(100);
      expect(result.xpToNext).toBe(0);
      expect(result.nextLevelXp).toBe(25000); // Same as current when max level
    });

    it('should handle exactly max level threshold', () => {
      const result = getLevelInfo(20000);
      expect(result.level).toBe(8);
      expect(result.title).toBe('Professor');
      expect(result.progress).toBe(100);
    });

    it('should handle negative XP gracefully', () => {
      const result = getLevelInfo(-100);
      expect(result.level).toBe(1);
      expect(result.currentXp).toBe(-100);
      // Progress should be clamped to 0
      expect(result.progress).toBeGreaterThanOrEqual(0);
    });

    it('should calculate XP to next level correctly', () => {
      const result = getLevelInfo(1750);
      expect(result.level).toBe(3);
      expect(result.nextLevelXp).toBe(3000);
      expect(result.xpToNext).toBe(1250); // 3000 - 1750
    });

    it('should verify all level thresholds', () => {
      LEVELS.forEach((level) => {
        const result = getLevelInfo(level.minXp);
        expect(result.level).toBe(level.level);
        expect(result.title).toBe(level.title);
      });
    });

    it('should have progress between 0 and 100', () => {
      const testXpValues = [0, 100, 500, 1000, 2000, 5000, 10000, 25000];
      testXpValues.forEach((xp) => {
        const result = getLevelInfo(xp);
        expect(result.progress).toBeGreaterThanOrEqual(0);
        expect(result.progress).toBeLessThanOrEqual(100);
      });
    });
  });
});
