import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { StudyPlannerProvider } from '../context/StudyPlannerContext';

// Mock Supabase client
export const mockSupabase = {
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
};

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.png',
  },
};

// Mock task data
export const mockTasks = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Description 1',
    status: 'pending' as const,
    priority: 'high' as const,
    userId: mockUser.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Description 2',
    status: 'completed' as const,
    priority: 'medium' as const,
    userId: mockUser.id,
    createdAt: new Date().toISOString(),
  },
];

// Mock subject data
export const mockSubjects = [
  {
    id: '1',
    name: 'Mathematics',
    color: '#3B82F6',
    icon: '📐',
    schedule: [],
  },
  {
    id: '2',
    name: 'Physics',
    color: '#10B981',
    icon: '⚛️',
    schedule: [],
  },
];

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { initialRoute = '/', ...renderOptions }: CustomRenderOptions = {},
) {
  window.history.pushState({}, 'Test page', initialRoute);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <StudyPlannerProvider>{children}</StudyPlannerProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
