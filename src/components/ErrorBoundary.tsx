import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, Check, Copy, Home, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { logger } from '../utils/logger';
import { recordTelemetryEvent } from '../lib/errorTracking';

interface Props {
  children: ReactNode;
  inline?: boolean;
  title?: string;
  description?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  copied: boolean;
}

// Redacts sensitive keys, tokens, database passwords, and authorization credentials from technical strings
export function sanitizeErrorMessage(msg: string): string {
  if (!msg) return "Noma'lum xatolik";
  return msg
    .replace(/(AIzaSy[A-Za-z0-9_-]{10,})/g, 'AIzaSy[REDACTED]')
    .replace(/(sk-[A-Za-z0-9_-]{10,})/g, 'sk-[REDACTED]')
    .replace(/(Bearer\s+[A-Za-z0-9._-]+)/gi, 'Bearer [REDACTED]')
    .replace(/(apikey=[A-Za-z0-9._-]+)/gi, 'apikey=[REDACTED]')
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1[REDACTED_PASSWORD]$3');
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const safeMessage = sanitizeErrorMessage(error?.message || '');
    this.setState({ errorInfo });
    logger.error('ErrorBoundary', safeMessage, errorInfo?.componentStack?.slice(0, 300));
    try {
      recordTelemetryEvent('unhandled', `[ErrorBoundary] ${safeMessage}`, {
        success: false,
        metadata: {
          componentStack: errorInfo?.componentStack?.slice(0, 300),
          url: typeof window !== 'undefined' ? window.location?.href : '',
        },
      });
    } catch {
      // Telemetry recording is safe and non-blocking
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleInlineRetry = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
      copied: false,
    }));
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleCopyReport = async () => {
    const safeMessage = sanitizeErrorMessage(this.state.error?.message || '');
    const stackSnippet = this.state.errorInfo?.componentStack?.slice(0, 400) || '';
    const report = [
      `--- NihongoTalk Xatolik Hisoboti ---`,
      `Vaqt: ${new Date().toISOString()}`,
      `URL: ${typeof window !== 'undefined' ? window.location.href : "Noma'lum"}`,
      `Xabar: ${safeMessage}`,
      stackSnippet ? `Stack: ${stackSnippet}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      }
    } catch {
      // Non-blocking clipboard fallback
    }
  };

  render() {
    if (this.state.hasError) {
      const displayError = sanitizeErrorMessage(this.state.error?.message || '');

      if (this.props.inline) {
        return (
          <div
            role="alert"
            aria-live="assertive"
            className="mx-auto my-4 w-full max-w-xl rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center shadow-sm backdrop-blur-sm"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-foreground">
              {this.props.title || "Ushbu bo'limda xatolik yuz berdi"}
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              {this.props.description ||
                "Kutilmagan xatolik tufayli ushbu qismni yuklab bo'lmadi. Qayta urinib ko'ring."}
            </p>
            {displayError && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Texnik tafsilot
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-muted/50 p-2.5 font-mono text-[11px] text-muted-foreground">
                  {displayError}
                </pre>
              </details>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                onClick={this.handleInlineRetry}
                variant="secondary"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-2 text-xs font-semibold"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {this.state.retryCount > 0
                  ? `Qayta urinish (${this.state.retryCount})`
                  : 'Qayta urinish'}
              </Button>
              {displayError && (
                <Button
                  onClick={this.handleCopyReport}
                  variant="outline"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 px-3 py-2 text-xs font-medium"
                >
                  {this.state.copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" /> Nusxa olindi
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Nusxa olish
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Xatolik yuz berdi
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Nimadir noto'g'ri ketdi. Iltimos, sahifani yangilang yoki bosh sahifaga qayting.
            </p>
            {displayError && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Texnik ma'lumot
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-gray-100 p-3 font-mono text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  {displayError}
                </pre>
              </details>
            )}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={this.handleReset}
                  className="flex w-full items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" /> Sahifani yangilash
                </Button>
                <Button
                  variant="secondary"
                  onClick={this.handleGoHome}
                  className="flex w-full items-center justify-center gap-2"
                >
                  <Home className="h-4 w-4" /> Bosh sahifa
                </Button>
              </div>
              {displayError && (
                <Button
                  variant="outline"
                  onClick={this.handleCopyReport}
                  className="flex w-full items-center justify-center gap-2 text-xs text-muted-foreground"
                >
                  {this.state.copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" /> Xatolik ma'lumotidan nusxa
                      olindi
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Xatolik ma'lumotidan nusxa olish
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <span key={this.state.retryCount} className="contents">
        {this.props.children}
      </span>
    );
  }
}

export default ErrorBoundary;
