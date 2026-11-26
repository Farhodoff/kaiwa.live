import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import PreferencesSection from '../PreferencesSection';
import InterfaceLanguageSelect from '../InterfaceLanguageSelect';
vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: null,
    targetLevel: 'N5',
    targetGoal: 'JLPT',
    setPrimaryFocus: vi.fn(),
  }),
}));
describe('Language and appearance preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/settings');
    document.documentElement.classList.add('dark');
  });
  it('remembers the interface language chosen at registration', () => {
    const view = render(
      <LanguageProvider>
        <InterfaceLanguageSelect />
      </LanguageProvider>,
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Ilova tili' }), {
      target: { value: 'en' },
    });
    expect(screen.getByRole('combobox', { name: 'App language' })).toHaveValue('en');
    view.unmount();
    render(
      <LanguageProvider>
        <InterfaceLanguageSelect />
      </LanguageProvider>,
    );
    expect(screen.getByRole('combobox', { name: 'App language' })).toHaveValue('en');
  });
  it('changes light and dark mode from settings and persists the selection', () => {
    render(
      <LanguageProvider>
        <PreferencesSection
          settings={{ theme: 'dark', notificationsEnabled: false }}
          onToggleNotifications={vi.fn()}
        />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Och' }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('kaiwa_theme')).toBe('light');
    expect(screen.getByRole('button', { name: 'Och' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Qora' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('kaiwa_theme')).toBe('dark');
  });
});
