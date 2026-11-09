import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error Tailwind config is a plain JavaScript file
import tailwindConfig from '../../../tailwind.config.js';

describe('Ultrawide & High-Resolution (2K/4K) Layout Integrity', () => {
  it('defines 3xl and 4xl breakpoints in Tailwind configuration', () => {
    const screens = tailwindConfig.theme?.extend?.screens as Record<string, string> | undefined;
    expect(screens).toBeDefined();
    expect(screens?.['3xl']).toBe('1920px');
    expect(screens?.['4xl']).toBe('2560px');
  });

  it('defines 8xl, 9xl, and ultrawide max-width presets in Tailwind configuration', () => {
    const maxWidth = tailwindConfig.theme?.extend?.maxWidth as Record<string, string> | undefined;
    expect(maxWidth).toBeDefined();
    expect(maxWidth?.['8xl']).toBe('90rem');
    expect(maxWidth?.['9xl']).toBe('105rem');
    expect(maxWidth?.['ultrawide']).toBe('120rem');
  });

  it('defines 3xl and 4xl container screen widths for center containers', () => {
    const containerScreens = tailwindConfig.theme?.container?.screens as
      Record<string, string> | undefined;
    expect(containerScreens).toBeDefined();
    expect(containerScreens?.['2xl']).toBe('1400px');
    expect(containerScreens?.['3xl']).toBe('1720px');
    expect(containerScreens?.['4xl']).toBe('2048px');
  });

  it('verifies SpeakingCoachPage scales to 2xl:max-w-6xl and 3xl:max-w-7xl', () => {
    const file = fs.readFileSync(path.resolve(__dirname, '../SpeakingCoachPage.tsx'), 'utf-8');
    expect(file).toContain('xl:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl');
  });

  it('verifies LessonPlayerPage scales to 2xl:max-w-6xl and 3xl:max-w-7xl', () => {
    const file = fs.readFileSync(path.resolve(__dirname, '../LessonPlayerPage.tsx'), 'utf-8');
    expect(file).toContain('xl:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl');
  });

  it('verifies StudyModePage scales to 2xl:max-w-6xl and 3xl:max-w-7xl', () => {
    const file = fs.readFileSync(path.resolve(__dirname, '../StudyModePage.tsx'), 'utf-8');
    expect(file).toContain('xl:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl');
  });

  it('verifies MinnaLessonsExplorer expands to 4 and 5 column grids on ultrawide screens', () => {
    const file = fs.readFileSync(
      path.resolve(__dirname, '../../components/jlpt/MinnaLessonsExplorer.tsx'),
      'utf-8',
    );
    expect(file).toContain('2xl:grid-cols-4 3xl:grid-cols-5');
  });

  it('verifies DecksPage expands to 4 and 5 column grids on ultrawide screens', () => {
    const file = fs.readFileSync(path.resolve(__dirname, '../DecksPage.tsx'), 'utf-8');
    expect(file).toContain('2xl:grid-cols-4 3xl:grid-cols-5');
  });

  it('verifies JlptMistakeNotebook scales on ultrawide displays', () => {
    const file = fs.readFileSync(
      path.resolve(__dirname, '../../components/jlpt/JlptMistakeNotebook.tsx'),
      'utf-8',
    );
    expect(file).toContain('xl:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl');
  });

  it('verifies ScenarioPickerPage scales up to 5 columns on ultrawide displays', () => {
    const file = fs.readFileSync(path.resolve(__dirname, '../ScenarioPickerPage.tsx'), 'utf-8');
    expect(file).toContain('2xl:grid-cols-4 3xl:grid-cols-5');
  });
});
