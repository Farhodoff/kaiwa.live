import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '../../utils/test-utils';
import SubjectsPage from '../SubjectsPage';

// Mock Supabase at module level
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 'mock-new-sub-id',
                name: 'Matematika Backend Test',
                color: '#8b5cf6',
                schedule: [],
                description: 'Test fani tavsifi',
              },
              error: null,
            }),
          ),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

describe('SubjectsPage - Fan Yaratish va Boshqarish', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should render SubjectsPage with header and Fan Qo'shish button", async () => {
    await act(async () => {
      render(<SubjectsPage />);
    });

    expect(screen.getByRole('heading', { level: 2, name: /Fanlar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fan Qo'shish/i })).toBeInTheDocument();
  });

  it("should open SubjectForm when clicking Fan Qo'shish and submit a new subject successfully", async () => {
    await act(async () => {
      render(<SubjectsPage />);
    });

    const addButton = screen.getByRole('button', { name: /Fan Qo'shish/i });
    await act(async () => {
      fireEvent.click(addButton);
    });

    // Verify SubjectForm opened
    expect(screen.getByText('Yangi Fan')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/masalan, Backend Development/i)).toBeInTheDocument();

    // Fill out input
    const nameInput = screen.getByPlaceholderText(/masalan, Backend Development/i);
    const descInput = screen.getByPlaceholderText(/Fan haqida qisqacha ma'lumot.../i);

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Backend Pythons' } });
      fireEvent.change(descInput, { target: { value: 'Django va FastAPI kurslari' } });
    });

    // Submit form
    const saveButton = screen.getByRole('button', { name: /Saqlash/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify subject card is rendered in the UI
    await waitFor(
      () => {
        expect(screen.getByText('Backend Pythons')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  }, 15000);
});
