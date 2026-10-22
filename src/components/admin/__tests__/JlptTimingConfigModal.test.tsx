import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JlptTimingConfigModal } from '../JlptTimingConfigModal';
import { JlptTimingConfigService } from '../../../services/JlptTimingConfigService';

vi.mock('../../../services/JlptTimingConfigService', () => ({
  JlptTimingConfigService: {
    loadConfig: vi.fn(),
    saveLevelConfig: vi.fn(),
  },
}));

describe('JlptTimingConfigModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (JlptTimingConfigService.loadConfig as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (JlptTimingConfigService.saveLevelConfig as ReturnType<typeof vi.fn>).mockImplementation(
      async (_level, config) => config,
    );
  });

  it('shows the combined N2 Language Knowledge + Reading block', async () => {
    render(<JlptTimingConfigModal isOpen onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Language Knowledge + Reading')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Language Knowledge + Reading official daqiqa')).toHaveValue(105);
    expect(screen.getByLabelText('Language Knowledge + Reading practice daqiqa')).toHaveValue(45);
  });

  it('saves admin-managed official and practice minutes per level', async () => {
    const onSaved = vi.fn();
    render(
      <JlptTimingConfigModal
        isOpen
        onClose={vi.fn()}
        user={{ id: 'admin-1', email: 'fsoyilov@gmail.com', role: 'superadmin' }}
        onSaved={onSaved}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText('Language Knowledge + Reading')).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText('Language Knowledge + Reading official daqiqa'), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByLabelText('Language Knowledge + Reading practice daqiqa'), {
      target: { value: '40' },
    });
    fireEvent.click(screen.getByText('Saqlash'));

    await waitFor(() => {
      expect(JlptTimingConfigService.saveLevelConfig).toHaveBeenCalledWith(
        'N2',
        [
          { block: 'language_reading', officialMinutes: 100, simulationMinutes: 40 },
          { block: 'listening', officialMinutes: 50, simulationMinutes: 20 },
        ],
        expect.objectContaining({ id: 'admin-1' }),
      );
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it('renders N1 with a 110 minute combined block', async () => {
    render(<JlptTimingConfigModal isOpen onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('N1')).toBeInTheDocument());
    fireEvent.click(screen.getByText('N1'));

    expect(screen.getByLabelText('Language Knowledge + Reading official daqiqa')).toHaveValue(110);
    expect(screen.getByLabelText('Listening (Choukai) official daqiqa')).toHaveValue(60);
  });
});
