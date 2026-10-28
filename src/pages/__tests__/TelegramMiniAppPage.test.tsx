import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TelegramMiniAppPage } from '../TelegramMiniAppPage';
import * as telegramAuth from '../../utils/telegramAuth';

describe('TelegramMiniAppPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dedicated mobile mini app view with user greeting and quick actions', () => {
    vi.spyOn(telegramAuth, 'initTelegramAuth').mockImplementation(() => null);
    vi.spyOn(telegramAuth, 'getTelegramWebAppUser').mockReturnValue({
      id: 123456,
      first_name: 'Anvar',
      username: 'anvar_uz',
    });

    render(
      <MemoryRouter initialEntries={['/twa']}>
        <Routes>
          <Route path="/twa" element={<TelegramMiniAppPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Konnichiwa, Anvar!/i)).toBeInTheDocument();
    expect(screen.getByText('@anvar_uz')).toBeInTheDocument();
    expect(screen.getByText('Bugungi Dars')).toBeInTheDocument();
    expect(screen.getByText('SRS Fleshkartalar')).toBeInTheDocument();
    expect(screen.getByText('Yuki AI Speaking')).toBeInTheDocument();
    expect(screen.getByText('JLPT Tezkor Quiz')).toBeInTheDocument();
    expect(screen.getByText("To'liq Veb Platformani Ochish")).toBeInTheDocument();
  });

  it('navigates to full web app when button is clicked', () => {
    vi.spyOn(telegramAuth, 'initTelegramAuth').mockImplementation(() => null);
    vi.spyOn(telegramAuth, 'getTelegramWebAppUser').mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/twa']}>
        <Routes>
          <Route path="/twa" element={<TelegramMiniAppPage />} />
          <Route path="/jlpt" element={<div data-testid="jlpt-hub">JLPT Hub</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const openWebBtn = screen.getByText("To'liq Veb Platformani Ochish");
    fireEvent.click(openWebBtn);

    expect(screen.getByTestId('jlpt-hub')).toBeInTheDocument();
  });

  it('redirects to /jlpt immediately if redirect=true query parameter is passed', () => {
    const initSpy = vi.spyOn(telegramAuth, 'initTelegramAuth').mockImplementation(() => null);

    render(
      <MemoryRouter initialEntries={['/twa?redirect=true']}>
        <Routes>
          <Route path="/twa" element={<TelegramMiniAppPage />} />
          <Route path="/jlpt" element={<div data-testid="jlpt-hub">JLPT Hub</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(initSpy).toHaveBeenCalled();
    expect(screen.getByTestId('jlpt-hub')).toBeInTheDocument();
  });

  it('opens in-app JLPT quiz modal when JLPT Tezkor Quiz is clicked', () => {
    vi.spyOn(telegramAuth, 'initTelegramAuth').mockImplementation(() => null);
    vi.spyOn(telegramAuth, 'getTelegramWebAppUser').mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/twa']}>
        <Routes>
          <Route path="/twa" element={<TelegramMiniAppPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const quizActionBtn = screen.getByText('JLPT Tezkor Quiz');
    fireEvent.click(quizActionBtn);

    expect(screen.getByRole('dialog', { name: /JLPT Tezkor Quiz/i })).toBeInTheDocument();
    expect(screen.getByText(/JLPT Tezkor Mini-Quiz/i)).toBeInTheDocument();
  });
});
