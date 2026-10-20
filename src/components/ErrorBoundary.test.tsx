import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary Component', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: /Xatolik yuz berdi/i })).toBeInTheDocument();
  });

  it('should display error message in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Nimadir noto'g'ri ketdi/i)).toBeInTheDocument();
  });

  it('should display reload button in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );
    const reloadButton = screen.getByRole('button', { name: /Sahifani yangilash/i });
    expect(reloadButton).toBeInTheDocument();
  });

  it('should display technical details section', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Texnik ma'lumot/i)).toBeInTheDocument();
  });

  it('should display the error message in details', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it('should log error to console', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should reload page when reload button is clicked', () => {
    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const reloadButton = screen.getByRole('button', { name: /Sahifani yangilash/i });
    reloadButton.click();
    expect(reloadMock).toHaveBeenCalled();
  });

  it('should render inline error card when inline prop is true', () => {
    const onResetMock = vi.fn();
    render(
      <ErrorBoundary inline={true} title="Modul xatosi" onReset={onResetMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: /Modul xatosi/i })).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Qayta urinish/i });
    expect(retryBtn).toBeInTheDocument();

    retryBtn.click();
    expect(onResetMock).toHaveBeenCalled();
  });

  it('should copy diagnostic error report when copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ErrorBoundary inline={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const copyBtn = screen.getByRole('button', { name: /Nusxa olish/i });
    expect(copyBtn).toBeInTheDocument();

    copyBtn.click();
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('NihongoTalk Xatolik Hisoboti'),
    );
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Test error'));
  });
});
