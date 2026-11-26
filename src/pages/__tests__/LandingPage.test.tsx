import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LandingPage from '../LandingPage';
import { landingCopy } from '../../data/landingContent';

const state = vi.hoisted(() => ({ language: 'uz' as 'uz' | 'ja' | 'en', setLanguage: vi.fn() }));
vi.mock('../../context/LanguageContext', () => ({ useLanguage: () => state }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: vi.fn() }));
vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ isDark: false, toggleTheme: vi.fn() }),
}));
function Location() {
  return <span data-testid="location">{useLocation().search}</span>;
}
const show = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LandingPage />
      <Location />
    </MemoryRouter>,
  );

describe('JLPT landing experience', () => {
  beforeEach(() => {
    state.language = 'uz';
    vi.clearAllMocks();
    localStorage.clear();
  });
  it('leads with JLPT and lets visitors explore a public lesson without registering', () => {
    show();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('JLPT N5–N1 ga');
    expect(screen.getByRole('link', { name: 'Namunaviy darsni ko‘rish' })).toHaveAttribute(
      'href',
      '/jlpt?tab=lessons&level=N5',
    );
    expect(screen.queryByText('4.9')).not.toBeInTheDocument();
  });
  it('changes both the lesson destination and sample question when a level is selected', () => {
    show();
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Darajamni tanlash' })).getByRole('button', {
        name: 'N1',
      }),
    );
    expect(screen.getByTestId('location')).toHaveTextContent('level=N1');
    expect(screen.getByRole('link', { name: 'Namunaviy darsni ko‘rish' })).toHaveAttribute(
      'href',
      '/jlpt?tab=lessons&level=N1',
    );
    expect(screen.getByText('Ma’no nozikliklari')).toBeInTheDocument();
    expect(screen.getByText(/誠心誠意の 謝罪/)).toBeInTheDocument();
  });
  it('explains a wrong answer, supports retry, and does not write learning statistics', () => {
    show();
    fireEvent.click(screen.getByRole('radio', { name: '火' }));
    fireEvent.click(screen.getByRole('button', { name: 'Javobni tekshirish' }));
    expect(screen.getByRole('status')).toHaveTextContent('Yana bir bor ko‘rib chiqamiz.');
    expect(screen.getByRole('status')).toHaveTextContent('木曜日');
    fireEvent.click(screen.getByRole('button', { name: 'Qayta urinib ko‘rish' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: '木' }));
    fireEvent.click(screen.getByRole('button', { name: 'Javobni tekshirish' }));
    expect(screen.getByRole('status')).toHaveTextContent('To‘g‘ri javob!');
    expect(localStorage.length).toBe(0);
  });
  it('opens the selected level from a URL and resets the sample when the level changes', () => {
    show('/?level=N1&lang=uz');
    fireEvent.click(screen.getByRole('radio', { name: 'こそ' }));
    fireEvent.click(screen.getByRole('button', { name: 'Javobni tekshirish' }));
    expect(screen.getByRole('status')).toHaveTextContent('To‘g‘ri javob!');
    fireEvent.change(screen.getByLabelText('Darajalar'), { target: { value: 'N4' } });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText(/雨が 降って/)).toBeInTheDocument();
  });
  it.each(['uz', 'ja', 'en'] as const)('shows complete %s copy', (language) => {
    state.language = language;
    show();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      landingCopy[language].headline[0],
    );
    expect(screen.queryByLabelText(landingCopy[language].language)).toBeNull();
    expect(screen.queryByRole('button', { name: landingCopy[language].theme })).toBeNull();
    expect(
      screen.getByRole('heading', { name: landingCopy[language].faqTitle }),
    ).toBeInTheDocument();
  });
});
