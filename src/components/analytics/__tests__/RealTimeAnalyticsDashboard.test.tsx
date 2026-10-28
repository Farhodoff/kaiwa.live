import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RealTimeAnalyticsDashboard } from '../RealTimeAnalyticsDashboard';
import { RealTimeAnalyticsService } from '../../../services/RealTimeAnalyticsService';
import { ApiLoggingService } from '../../../services/ApiLoggingService';

describe('RealTimeAnalyticsDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    RealTimeAnalyticsService.resetAll();
    ApiLoggingService.clearLogs();
  });

  it('renders dashboard with KPI cards and header', () => {
    render(
      <MemoryRouter>
        <RealTimeAnalyticsDashboard />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: /Real-Vaqt Tahlili/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Bugungi O'qish Vaqti/i)).toBeInTheDocument();
    expect(screen.getByText(/Jonli Natijadorlik/i)).toBeInTheDocument();
    expect(screen.getByText(/O'qish Seriyasi/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Shaxsiylashtirilgan AI Fikr/i).length).toBeGreaterThan(0);
  });

  it('toggles study session start and finish properly', async () => {
    render(
      <MemoryRouter>
        <RealTimeAnalyticsDashboard />
      </MemoryRouter>,
    );

    const startBtn = screen.getByRole('button', { name: /Boshlash/i });
    expect(startBtn).toBeInTheDocument();

    fireEvent.click(startBtn);

    // After starting, status indicates active session and "Yakunlash" button appears
    await waitFor(() => {
      expect(screen.getByText(/Yakunlash/i)).toBeInTheDocument();
    });

    const stopBtn = screen.getByText(/Yakunlash/i);
    fireEvent.click(stopBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Boshlash/i })).toBeInTheDocument();
    });
  });

  it('triggers activity simulation and immediately reflects in KPI values', async () => {
    render(
      <MemoryRouter>
        <RealTimeAnalyticsDashboard />
      </MemoryRouter>,
    );

    const simQuizBtn = screen.getByText(/\+5 Quiz Savoli/i);
    fireEvent.click(simQuizBtn);

    await waitFor(() => {
      expect(screen.getByText(/JLPT N4 Grammatika Savollari/i)).toBeInTheDocument();
    });

    // Check accuracy badge is displayed
    expect(screen.getAllByText('80%').length).toBeGreaterThanOrEqual(1);
  });

  it('toggles system metrics & API logs drawer', async () => {
    ApiLoggingService.logApiCall({
      endpoint: '/api/v1/analytics-feedback',
      durationMs: 120,
      success: true,
      statusCode: 200,
    });

    render(
      <MemoryRouter>
        <RealTimeAnalyticsDashboard />
      </MemoryRouter>,
    );

    const telemetryToggle = screen.getByText(/Tizim Metriklari & API Telemetriya Loglari/i);
    fireEvent.click(telemetryToggle);

    await waitFor(() => {
      expect(screen.getByText(/Jami API So'rovlar/i)).toBeInTheDocument();
      expect(screen.getByText('/api/v1/analytics-feedback')).toBeInTheDocument();
    });
  });
});
