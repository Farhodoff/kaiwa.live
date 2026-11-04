import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthPage from '../AuthPage';
import { supabase } from '../../lib/supabase';

// Mock supabase auth
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}));

// Mock framer-motion to avoid animation issues in test
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Auth Page & Redirect Flow Integrity (P1-3 Audit Fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to legitimate requested route (?redirect=/dashboard) on successful login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: {
        session: { access_token: 'fake-token' } as any,
        user: { id: 'test-user', email: 'test@example.com' } as any,
      },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/auth?redirect=/dashboard']}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const emailInput = screen.getByPlaceholderText(/Email manzilingizni kiriting/i);
    const passwordInput = screen.getByPlaceholderText(/Parolingizni kiriting/i);
    const submitButton = screen.getByRole('button', { name: /^Kirish$/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('navigates to legitimate requested route (?redirect=/settings) on successful login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: {
        session: { access_token: 'fake-token' } as any,
        user: { id: 'test-user', email: 'test@example.com' } as any,
      },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/auth?redirect=/settings']}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const emailInput = screen.getByPlaceholderText(/Email manzilingizni kiriting/i);
    const passwordInput = screen.getByPlaceholderText(/Parolingizni kiriting/i);
    const submitButton = screen.getByRole('button', { name: /^Kirish$/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/settings', { replace: true });
    });
  });

  it('neutralizes open redirect attempts (e.g. ?redirect=//evil.com) and falls back safely to root', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: {
        session: { access_token: 'fake-token' } as any,
        user: { id: 'test-user', email: 'test@example.com' } as any,
      },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/auth?redirect=//evil.com']}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const emailInput = screen.getByPlaceholderText(/Email manzilingizni kiriting/i);
    const passwordInput = screen.getByPlaceholderText(/Parolingizni kiriting/i);
    const submitButton = screen.getByRole('button', { name: /^Kirish$/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('preserves ?redirect param when toggling between login and register', async () => {
    render(
      <MemoryRouter initialEntries={['/auth?redirect=/flashcards']}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const switchButton = screen.getByRole('button', { name: /Ro'yxatdan o'tish/i });
    fireEvent.click(switchButton);

    expect(mockNavigate).toHaveBeenCalledWith('/register?redirect=%2Fflashcards', {
      replace: true,
    });
  });
});
