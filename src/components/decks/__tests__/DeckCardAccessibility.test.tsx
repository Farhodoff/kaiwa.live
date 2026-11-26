import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import DeckCard from '../DeckCard';

vi.mock('../../../context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'uz' }),
}));
const subject = { id: 'n5', name: 'N5 so‘zlari', color: '#ff7766', schedule: [] };

describe('Deck card controls', () => {
  it('exposes deck selection and management actions with distinct accessible names', () => {
    const select = vi.fn();
    render(
      <MemoryRouter>
        <DeckCard
          subject={subject}
          cardCount={50}
          dueCount={50}
          isSelected
          onToggleSelect={select}
          onToggleArchive={vi.fn()}
          onDelete={vi.fn()}
          onAIGenerate={vi.fn()}
        />
      </MemoryRouter>,
    );
    const selection = screen.getByRole('button', { name: 'N5 so‘zlari: Tanlash' });
    expect(selection).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(selection);
    expect(select).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'N5 so‘zlari: Arxivlash' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /N5 so‘zlari: To'plamni o'chirish/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Takrorlash' })).toHaveAttribute(
      'href',
      '/flashcards?study=n5',
    );
    expect(document.querySelector('a button')).toBeNull();
  });

  it('prevents navigation for an empty deck and hides admin creation tools', () => {
    render(
      <MemoryRouter>
        <DeckCard subject={subject} cardCount={0} dueCount={0} onAIGenerate={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Mashq qilish' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.queryByRole('link', { name: 'Karta qo‘shish' })).toBeNull();
  });
});
