import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminTwoFactorGate } from '../AdminTwoFactorGate';
import { AdminMfaService } from '../../../services/AdminMfaService';

describe('AdminTwoFactorGate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders children immediately if 2FA session is already verified', async () => {
    vi.spyOn(AdminMfaService, 'getMfaStatus').mockResolvedValue({
      isMfaRequired: true,
      isMfaEnrolled: true,
      isSessionVerified: true,
      currentLevel: 'aal2',
    });

    render(
      <MemoryRouter>
        <AdminTwoFactorGate user={{ email: 'admin@kaiwa.live', role: 'admin' }}>
          <div data-testid="secret-admin-content">Secret Admin Dashboard</div>
        </AdminTwoFactorGate>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('secret-admin-content')).toBeInTheDocument();
    });
  });

  it('shows 2FA verification prompt when factor is enrolled but session unverified', async () => {
    vi.spyOn(AdminMfaService, 'getMfaStatus').mockResolvedValue({
      isMfaRequired: true,
      isMfaEnrolled: true,
      isSessionVerified: false,
      currentLevel: 'aal1',
      factorId: 'factor-999',
    });

    render(
      <MemoryRouter>
        <AdminTwoFactorGate user={{ email: 'admin@kaiwa.live', role: 'admin' }}>
          <div data-testid="secret-admin-content">Secret Admin Dashboard</div>
        </AdminTwoFactorGate>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Ikki Bosqichli Tasdiqlash/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
      expect(screen.queryByTestId('secret-admin-content')).not.toBeInTheDocument();
    });
  });

  it('shows 2FA enrollment setup when admin has not enrolled 2FA yet', async () => {
    vi.spyOn(AdminMfaService, 'getMfaStatus').mockResolvedValue({
      isMfaRequired: true,
      isMfaEnrolled: false,
      isSessionVerified: false,
      currentLevel: 'aal1',
    });

    vi.spyOn(AdminMfaService, 'enrollTotp').mockResolvedValue({
      factorId: 'new-factor-1',
      qrCodeUrl: 'data:image/svg+xml;utf-8,<svg>test</svg>',
      secret: 'SECRETKEY123',
      uri: 'otpauth://totp/...',
    });

    render(
      <MemoryRouter>
        <AdminTwoFactorGate user={{ email: 'admin@kaiwa.live', role: 'admin' }}>
          <div data-testid="secret-admin-content">Secret Admin Dashboard</div>
        </AdminTwoFactorGate>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/2FA Himoyasini O‘rnating/i)).toBeInTheDocument();
      expect(screen.getByText('SECRETKEY123')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /2FA ni Faollashtirish/i })).toBeInTheDocument();
    });
  });
});
